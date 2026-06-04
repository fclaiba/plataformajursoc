import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizeEmail, now } from "./utils";
import { getAuthUserId } from "@convex-dev/auth/server";

const hasInteractionAccess = async (
  ctx: any,
  viewerUserId: any,
  targetUserId: any,
) => {
  if (String(viewerUserId) === String(targetUserId)) return true;

  const viewerRequests = await ctx.db
    .query("requests")
    .withIndex("by_user", (q: any) => q.eq("userId", viewerUserId))
    .collect();

  for (const request of viewerRequests) {
    if (request.giveToRequestId) {
      const g = await ctx.db.get(request.giveToRequestId);
      if (g && String(g.userId) === String(targetUserId)) return true;
    }
    if (request.receiveFromRequestId) {
      const r = await ctx.db.get(request.receiveFromRequestId);
      if (r && String(r.userId) === String(targetUserId)) return true;
    }
  }

  const reviewsReceivedByViewer = await ctx.db
    .query("reviews")
    .withIndex("by_target", (q: any) => q.eq("targetUserId", viewerUserId))
    .collect();
  if (reviewsReceivedByViewer.some((review: any) => String(review.reviewerUserId) === String(targetUserId))) {
    return true;
  }

  const reviewsReceivedByTarget = await ctx.db
    .query("reviews")
    .withIndex("by_target", (q: any) => q.eq("targetUserId", targetUserId))
    .collect();
  if (reviewsReceivedByTarget.some((review: any) => String(review.reviewerUserId) === String(viewerUserId))) {
    return true;
  }

  return false;
};

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizeEmail(args.email)))
      .first();
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return { user, profile };
  },
});

export const getVisibleProfile = query({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) return null;

    const canView = await hasInteractionAccess(ctx, viewerUserId, args.targetUserId);
    if (!canView) return null;

    const user = await ctx.db.get(args.targetUserId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    return {
      user: {
        _id: String(user._id),
        name: user.name ?? "Usuario",
      },
      profile: {
        role: profile?.role ?? "student",
        reputation: profile?.reputation ?? 0,
        reviewsCount: profile?.reviewsCount ?? 0,
      },
    };
  },
});

export const listVisibleActivity = query({
  args: {
    targetUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) return [];

    const canView = await hasInteractionAccess(ctx, viewerUserId, args.targetUserId);
    if (!canView) return [];

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 30);
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .collect();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_target", (q) => q.eq("targetUserId", args.targetUserId))
      .collect();

    const activity = [
      ...requests
        .filter((request) => request.status === "COMPLETED")
        .map((request) => ({
          id: `request:${String(request._id)}`,
          type: "exchange_completed",
          title: "Permuta completada",
          description: "Completo un intercambio bilateral.",
          createdAt: request.updatedAt,
        })),
      ...reviews.map((review) => ({
        id: `review:${String(review._id)}`,
        type: "review_received",
        title: "Resena recibida",
        description: `Recibio ${review.rating}/5 estrellas.`,
        createdAt: review.createdAt,
      })),
    ];

    return activity.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isAdmin: false };
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return { isAdmin: profile?.role === "admin" };
  },
});

export const ensureCurrentProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated.");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("userProfiles", {
        userId,
        role: "student",
        reputation: 0,
        reviewsCount: 0,
        approvedSubjectExternalIds: [],
        documentUrls: [],
        createdAt: now(),
        updatedAt: now(),
      });
    } else {
      await ctx.db.patch(existingProfile._id, { updatedAt: now() });
    }

    const trimmedName = args.name?.trim();
    if (trimmedName) {
      await ctx.db.patch(userId, { name: trimmedName });
    }

    return { ok: true };
  },
});

export const upsertProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name.trim() });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      email,
      name: args.name.trim(),
      isAnonymous: false,
    });
    await ctx.db.insert("userProfiles", {
      userId,
      role: "student",
      reputation: 0,
      reviewsCount: 0,
      approvedSubjectExternalIds: [],
      documentUrls: [],
      createdAt: now(),
      updatedAt: now(),
    });
    return userId;
  },
});

export const addDocument = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const current = profile.documentUrls ?? [];
    await ctx.db.patch(profile._id, {
      documentUrls: [...current, args.url],
      updatedAt: now(),
    });
    return { ok: true };
  },
});

export const toggleApprovedSubject = mutation({
  args: { subjectExternalId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found.");

    const current = profile.approvedSubjectExternalIds ?? [];
    const alreadyApproved = current.includes(args.subjectExternalId);
    const nextApproved = alreadyApproved
      ? current.filter((subjectId) => subjectId !== args.subjectExternalId)
      : [...current, args.subjectExternalId];

    await ctx.db.patch(profile._id, {
      approvedSubjectExternalIds: nextApproved,
      updatedAt: now(),
    });

    return { ok: true, approved: !alreadyApproved };
  },
});

export const setUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    if (!actorUserId) throw new Error("Not authenticated.");

    const actorProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", actorUserId))
      .first();
    if (actorProfile?.role !== "admin") {
      throw new Error("Only admins can change user roles.");
    }

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();
    if (!targetProfile) throw new Error("Target profile not found.");

    await ctx.db.patch(targetProfile._id, {
      role: args.role,
      updatedAt: now(),
    });
    return { ok: true };
  },
});
