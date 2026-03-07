import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";
import { runMatching } from "./matches";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createRequest = mutation({
  args: {
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    commissionOriginId: v.id("commissions"),
    destinations: v.array(
      v.object({
        commissionId: v.id("commissions"),
        priority: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("requests", {
      ...args,
      status: "PENDING",
      finalizedBy: [],
      createdAt: now(),
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId,
      actorUserId: args.userId,
      type: "REQUEST_CREATED",
      createdAt: now(),
    });
    await runMatching(ctx, args.subjectId);
    return requestId;
  },
});

export const cancelRequest = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    await ctx.db.patch(args.requestId, {
      status: "CANCELLED",
      matchedRequestId: undefined,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId: args.actorUserId,
      type: "REQUEST_CANCELLED",
      createdAt: now(),
    });
    await runMatching(ctx, request.subjectId);
  },
});

export const finalizeRequest = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.matchedRequestId) return;
    const matched = await ctx.db.get(request.matchedRequestId);
    if (!matched) return;

    const finalizedBy = Array.from(new Set([...request.finalizedBy, args.actorUserId]));
    await ctx.db.patch(request._id, {
      finalizedBy,
      updatedAt: now(),
    });

    const bothFinalized = finalizedBy.length > 0 && matched.finalizedBy.length > 0;
    if (bothFinalized) {
      await ctx.db.patch(request._id, { status: "CONFIRMED", updatedAt: now() });
      await ctx.db.patch(matched._id, { status: "CONFIRMED", updatedAt: now() });
      await ctx.db.insert("requestEvents", {
        requestId: request._id,
        actorUserId: args.actorUserId,
        type: "REQUEST_CONFIRMED",
        createdAt: now(),
      });
    }
  },
});

export const completeExchange = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    await ctx.db.patch(args.requestId, { status: "COMPLETED", updatedAt: now() });
    if (request.matchedRequestId) {
      await ctx.db.patch(request.matchedRequestId, { status: "COMPLETED", updatedAt: now() });
    }
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId: args.actorUserId,
      type: "REQUEST_COMPLETED",
      createdAt: now(),
    });
  },
});
