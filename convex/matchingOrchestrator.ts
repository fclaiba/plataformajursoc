import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { now } from "./utils";
import { runMatching } from "./matches";
import { writeOperationalLog } from "./ops";

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [500, 2000, 5000, 15000, 30000];

const nextBackoff = (attempts: number) => BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];

export const enqueueSubjectMatching = mutation({
  args: {
    subjectId: v.id("subjects"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matchingJobs")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .first();

    const timestamp = now();
    let jobId: Id<"matchingJobs">;
    if (existing) {
      jobId = existing._id;
      await ctx.db.patch(existing._id, {
        status: "queued",
        nextRunAt: timestamp,
        updatedAt: timestamp,
        lastError: undefined,
      });
    } else {
      jobId = await ctx.db.insert("matchingJobs", {
        subjectId: args.subjectId,
        status: "queued",
        attempts: 0,
        nextRunAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await ctx.scheduler.runAfter(0, internal.matchingOrchestrator.processJobInternal, { jobId });
    await writeOperationalLog(ctx, {
      domain: "matching",
      level: "info",
      message: "Matching job enqueued.",
      metadata: { jobId, subjectId: args.subjectId, reason: args.reason },
    });
    return { ok: true, jobId };
  },
});

export const processJob = action({
  args: { jobId: v.id("matchingJobs") },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.matchingOrchestrator.processJobInternal, args);
    return { ok: true };
  },
});

export const processJobInternal = internalAction({
  args: { jobId: v.id("matchingJobs") },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(internal.matchingOrchestrator.claimJob, args);
    if (!claimed) return { ok: true, skipped: true };

    try {
      await ctx.runMutation(internal.matchingOrchestrator.executeJob, {
        jobId: args.jobId,
        runToken: claimed.runToken,
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown matching error.";
      const retry = await ctx.runMutation(internal.matchingOrchestrator.failJobAndScheduleRetry, {
        jobId: args.jobId,
        runToken: claimed.runToken,
        message,
      });
      if (retry.shouldRetry) {
        await ctx.scheduler.runAfter(retry.delayMs, internal.matchingOrchestrator.processJobInternal, {
          jobId: args.jobId,
        });
      }
      return { ok: false, error: message };
    }
  },
});

export const claimJob = internalMutation({
  args: { jobId: v.id("matchingJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    if (job.status !== "queued" && job.status !== "failed") return null;
    if (job.nextRunAt > now()) return null;

    const runToken = `${job._id}-${now()}-${Math.random().toString(36).slice(2, 8)}`;
    await ctx.db.patch(job._id, {
      status: "running",
      attempts: job.attempts + 1,
      runToken,
      updatedAt: now(),
      lastError: undefined,
    });
    return { runToken };
  },
});

export const executeJob = internalMutation({
  args: { jobId: v.id("matchingJobs"), runToken: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "running" || job.runToken !== args.runToken) {
      throw new Error("Job is not claimed by this execution.");
    }

    const result = await runMatching(ctx, job.subjectId);
    await ctx.db.patch(job._id, {
      status: "done",
      runToken: undefined,
      lastMatchedPairs: result.matchedPairs,
      updatedAt: now(),
    });
    await writeOperationalLog(ctx, {
      domain: "matching",
      level: "info",
      message: "Matching job processed.",
      metadata: { jobId: job._id, matchedPairs: result.matchedPairs, subjectId: job.subjectId },
    });
    return { ok: true };
  },
});

export const failJobAndScheduleRetry = internalMutation({
  args: {
    jobId: v.id("matchingJobs"),
    runToken: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.runToken !== args.runToken) return { shouldRetry: false, delayMs: 0 };

    if (job.attempts >= MAX_ATTEMPTS) {
      await ctx.db.patch(job._id, {
        status: "failed",
        runToken: undefined,
        lastError: args.message,
        updatedAt: now(),
      });
      await writeOperationalLog(ctx, {
        domain: "matching",
        level: "error",
        message: "Matching job failed permanently.",
        metadata: { jobId: job._id, attempts: job.attempts, error: args.message },
      });
      return { shouldRetry: false, delayMs: 0 };
    }

    const delayMs = nextBackoff(job.attempts);
    await ctx.db.patch(job._id, {
      status: "queued",
      nextRunAt: now() + delayMs,
      runToken: undefined,
      lastError: args.message,
      updatedAt: now(),
    });
    await writeOperationalLog(ctx, {
      domain: "matching",
      level: "warning",
      message: "Matching job failed and rescheduled.",
      metadata: { jobId: job._id, attempts: job.attempts, delayMs, error: args.message },
    });
    return { shouldRetry: true, delayMs };
  },
});
