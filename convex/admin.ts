import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { writeOperationalLog } from "./ops";

const requireAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated.");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  if (profile?.role !== "admin") throw new Error("Admin role required.");
  return userId;
};

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const jobs = await ctx.db.query("matchingJobs").collect();
    const logs = await ctx.db.query("operationalLogs").collect();
    const recentLogs = [...logs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 25);
    const failedJobs = jobs.filter((job) => job.status === "failed").length;
    const queuedJobs = jobs.filter((job) => job.status === "queued").length;
    const runningJobs = jobs.filter((job) => job.status === "running").length;
    return {
      jobs: {
        total: jobs.length,
        failed: failedJobs,
        queued: queuedJobs,
        running: runningJobs,
      },
      recentLogs,
    };
  },
});

export const getReleaseReadiness = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const jobs = await ctx.db.query("matchingJobs").collect();
    const logs = await ctx.db.query("operationalLogs").collect();
    const subjects = await ctx.db.query("subjects").collect();
    const professors = await ctx.db.query("professors").collect();
    const recentErrors = logs.filter((log) => log.level === "error").sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
    return {
      checks: [
        {
          id: "catalog_seeded",
          label: "Catalogo cargado",
          ok: subjects.length > 0,
          detail: `${subjects.length} materias`,
        },
        {
          id: "professors_synced",
          label: "Profesores sincronizados",
          ok: professors.length > 0,
          detail: `${professors.length} profesores`,
        },
        {
          id: "matching_jobs_healthy",
          label: "Matching sin jobs fallidos",
          ok: jobs.every((job) => job.status !== "failed"),
          detail: `${jobs.filter((job) => job.status === "failed").length} fallidos`,
        },
        {
          id: "operational_logs",
          label: "Logs operativos presentes",
          ok: logs.length > 0,
          detail: `${logs.length} logs`,
        },
      ],
      recentErrors,
    };
  },
});

export const listOperationalLogs = query({
  args: {
    domain: v.optional(v.string()),
    level: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const logs = await ctx.db.query("operationalLogs").collect();
    return logs
      .filter((log) => (args.domain ? log.domain === args.domain : true))
      .filter((log) => (args.level ? log.level === args.level : true))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const listSupportReports = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const rows = await ctx.db.query("supportReports").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const listRecentRequestEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("requestEvents").collect();
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    return [...all].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const resetRanking = mutation({
  args: {},
  handler: async (ctx) => {
    const actorUserId = await requireAdmin(ctx);
    const snapshots = await ctx.db.query("ratingSnapshots").collect();
    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id);
    }
    await writeOperationalLog(ctx, {
      domain: "admin",
      level: "warning",
      message: "Ranking snapshots reset by admin.",
      actorUserId,
      metadata: { deletedSnapshots: snapshots.length },
    });
    return { ok: true, deletedSnapshots: snapshots.length };
  },
});

export const seedCatalog = action({
  args: {},
  handler: async (ctx) => {
    const isAdmin = await ctx.runQuery(api.users.isCurrentUserAdmin, {});
    if (!isAdmin.isAdmin) throw new Error("Admin role required.");
    await ctx.runMutation(api.subjects.seedCatalogFromIngresantes, {});
    return { ok: true };
  },
});

export const recomputeMatchingBySubject = action({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.users.isCurrentUserAdmin, {});
    if (!isAdmin.isAdmin) throw new Error("Admin role required.");
    await ctx.runMutation(api.matchingOrchestrator.enqueueSubjectMatching, {
      subjectId: args.subjectId,
      reason: "admin_recompute",
    });
    return { ok: true };
  },
});

export const syncProfessorsFromCatalog = action({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; count: number }> => {
    const isAdmin = await ctx.runQuery(api.users.isCurrentUserAdmin, {});
    if (!isAdmin.isAdmin) throw new Error("Admin role required.");
    const result: { ok: boolean; count: number } = await ctx.runMutation(api.ranking.ensureProfessorsFromCatalog, {});
    return { ok: true, count: result.count };
  },
});
