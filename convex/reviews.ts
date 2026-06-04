import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now, requireAuth, rateLimit } from "./utils";
import { areReciprocallyMatched } from "./requestsRules";
import { insertNotification } from "./notifications";

export const createReview = mutation({
  args: {
    requestId: v.id("requests"),
    targetUserId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const reviewerUserId = await requireAuth(ctx);
    await rateLimit(ctx, "createReview", reviewerUserId, 60_000, 3);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("La reseña requiere una solicitud matcheada válida.");
    }
    if (request.status !== "COMPLETED") {
      throw new Error("Solo se puede reseñar cuando ambas solicitudes están COMPLETED.");
    }

    if (request.userId !== reviewerUserId && args.targetUserId !== request.userId) {
       // if we are the target trying to review the request owner? Or the owner reviewing a target?
       // Let's enforce that reviewerUserId must own the request.
       if (request.userId !== reviewerUserId) {
         throw new Error("Solo el dueño de la solicitud puede dejar esta reseña.");
       }
    }

    // Validate targetUserId
    let validTarget = false;
    if (request.giveToRequestId) {
      const g = await ctx.db.get(request.giveToRequestId);
      if (g && g.status === "COMPLETED" && g.userId === args.targetUserId) validTarget = true;
    }
    if (request.receiveFromRequestId && !validTarget) {
      const r = await ctx.db.get(request.receiveFromRequestId);
      if (r && r.status === "COMPLETED" && r.userId === args.targetUserId) validTarget = true;
    }
    
    if (!validTarget) {
      throw new Error("El usuario objetivo no es parte de tu permuta completada.");
    }

    const resolvedTargetUserId = args.targetUserId;

    const exists = await ctx.db
      .query("reviews")
      .withIndex("by_request_reviewer", (q) =>
        q.eq("requestId", args.requestId).eq("reviewerUserId", reviewerUserId),
      )
      .first();
    if (exists) throw new Error("Review already exists for this request and reviewer.");

    const reviewId = await ctx.db.insert("reviews", {
      requestId: args.requestId,
      reviewerUserId,
      targetUserId: resolvedTargetUserId,
      rating: args.rating,
      comment: args.comment,
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

    // Notify the reviewed user
    await insertNotification(ctx, {
      userId: resolvedTargetUserId,
      title: "Nueva reseña recibida",
      message: `Recibiste una calificación de ${args.rating} ★ por una permuta completada.`,
      type: "info",
      source: "system",
    });

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
  args: {},
  handler: async (ctx) => {
    const reviewerUserId = await requireAuth(ctx);
    const rows = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("reviewerUserId"), reviewerUserId))
      .collect();
    return rows.map((review) => ({
      requestId: String(review.requestId),
      targetUserId: String(review.targetUserId),
      createdAt: review.createdAt,
    }));
  },
});
