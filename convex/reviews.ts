import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";

export const createReview = mutation({
  args: {
    requestId: v.id("requests"),
    reviewerUserId: v.id("users"),
    targetUserId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const exists = await ctx.db
      .query("reviews")
      .withIndex("by_request_reviewer", (q) =>
        q.eq("requestId", args.requestId).eq("reviewerUserId", args.reviewerUserId),
      )
      .first();
    if (exists) throw new Error("Review already exists for this request and reviewer.");

    const reviewId = await ctx.db.insert("reviews", {
      ...args,
      createdAt: now(),
    });

    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_target", (q) => q.eq("targetUserId", args.targetUserId))
      .collect();
    const reviewsCount = allReviews.length;
    const reputation = allReviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviewsCount, 1);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { reviewsCount, reputation, updatedAt: now() });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.targetUserId,
        role: "student",
        reviewsCount,
        reputation,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    return reviewId;
  },
});

export const listByTarget = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("reviews").withIndex("by_target", (q) => q.eq("targetUserId", args.targetUserId)).collect();
  },
});
