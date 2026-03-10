import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";
import { areReciprocallyMatched } from "./requestsRules";

export const createReview = mutation({
  args: {
    requestId: v.id("requests"),
    reviewerUserId: v.id("users"),
    targetUserId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.matchedRequestId) {
      throw new Error("La reseña requiere una solicitud matcheada válida.");
    }
    const matchedRequest = await ctx.db.get(request.matchedRequestId);
    if (!matchedRequest) {
      throw new Error("La contraparte de la solicitud no existe.");
    }
    if (request.status !== "COMPLETED" || matchedRequest.status !== "COMPLETED") {
      throw new Error("Solo se puede reseñar cuando ambas solicitudes están COMPLETED.");
    }
    if (
      !areReciprocallyMatched(
        {
          _id: String(request._id),
          status: request.status,
          matchedRequestId: request.matchedRequestId ? String(request.matchedRequestId) : undefined,
        },
        {
          _id: String(matchedRequest._id),
          status: matchedRequest.status,
          matchedRequestId: matchedRequest.matchedRequestId ? String(matchedRequest.matchedRequestId) : undefined,
        },
      )
    ) {
      throw new Error("La relación de match no es recíproca.");
    }
    const reviewerOwnsRequest = request.userId === args.reviewerUserId;
    const reviewerOwnsMatchedRequest = matchedRequest.userId === args.reviewerUserId;
    if (!reviewerOwnsRequest && !reviewerOwnsMatchedRequest) {
      throw new Error("El reviewer debe pertenecer a la permuta.");
    }
    // Target is derived from the matched pair to avoid client-side mismatches.
    const resolvedTargetUserId = reviewerOwnsRequest ? matchedRequest.userId : request.userId;

    const exists = await ctx.db
      .query("reviews")
      .withIndex("by_request_reviewer", (q) =>
        q.eq("requestId", args.requestId).eq("reviewerUserId", args.reviewerUserId),
      )
      .first();
    if (exists) throw new Error("Review already exists for this request and reviewer.");

    const reviewId = await ctx.db.insert("reviews", {
      ...args,
      targetUserId: resolvedTargetUserId,
      createdAt: now(),
    });

    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_target", (q) => q.eq("targetUserId", resolvedTargetUserId))
      .collect();
    const reviewsCount = allReviews.length;
    const reputation = allReviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviewsCount, 1);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", resolvedTargetUserId))
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { reviewsCount, reputation, updatedAt: now() });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: resolvedTargetUserId,
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
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_target", (q) => q.eq("targetUserId", args.targetUserId))
      .collect();
    const enriched = [];
    for (const review of rows.sort((a, b) => b.createdAt - a.createdAt)) {
      const reviewer = await ctx.db.get(review.reviewerUserId);
      enriched.push({
        _id: String(review._id),
        reviewerUserId: String(review.reviewerUserId),
        reviewerName: reviewer?.name ?? "Usuario",
        targetUserId: String(review.targetUserId),
        requestId: String(review.requestId),
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      });
    }
    return enriched;
  },
});

export const listByReviewer = query({
  args: { reviewerUserId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("reviewerUserId"), args.reviewerUserId))
      .collect();
    return rows.map((review) => ({
      requestId: String(review.requestId),
      targetUserId: String(review.targetUserId),
      createdAt: review.createdAt,
    }));
  },
});
