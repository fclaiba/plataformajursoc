import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";

export const listSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

export const listCommissionsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commissions")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

export const addEnrollment = mutation({
  args: {
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    cathedraId: v.id("cathedras"),
    commissionId: v.id("commissions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_user_subject", (q) => q.eq("userId", args.userId).eq("subjectId", args.subjectId))
      .first();
    if (existing) throw new Error("Already enrolled in this subject.");

    const commission = await ctx.db.get(args.commissionId);
    if (!commission) throw new Error("Commission not found.");
    if (commission.seatsAvailable <= 0) throw new Error("No seats available.");

    const enrollmentId = await ctx.db.insert("enrollments", {
      ...args,
      createdAt: now(),
      updatedAt: now(),
    });

    await ctx.db.patch(args.commissionId, {
      seatsAvailable: Math.max(0, commission.seatsAvailable - 1),
      updatedAt: now(),
    });

    return enrollmentId;
  },
});

export const removeEnrollment = mutation({
  args: { enrollmentId: v.id("enrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) return;
    await ctx.db.delete(args.enrollmentId);

    const commission = await ctx.db.get(enrollment.commissionId);
    if (commission) {
      await ctx.db.patch(commission._id, {
        seatsAvailable: Math.min(commission.seatsTotal, commission.seatsAvailable + 1),
        updatedAt: now(),
      });
    }
  },
});
