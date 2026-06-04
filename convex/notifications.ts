import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now, requireAuth } from "./utils";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Internal helper — call from other mutations to create a notification
 * without going through the mutation args / validation layer.
 */
export const insertNotification = async (
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    source?: "auth" | "requests" | "chat" | "ranking" | "system";
  },
) => {
  const notifId = await ctx.db.insert("notifications", {
    ...params,
    createdAt: now(),
    readAt: undefined,
  });

  await ctx.scheduler.runAfter(0, api.pushAction.sendPushNotification, {
    userId: params.userId,
    title: params.title,
    body: params.message,
    url: "/notifications",
  });

  return notifId;
};
import { paginationOptsValidator } from "convex/server";
import { api } from "./_generated/api";

export const listByUser = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    source: v.optional(v.union(v.literal("auth"), v.literal("requests"), v.literal("chat"), v.literal("ranking"), v.literal("system"))),
  },
  handler: async (ctx, args) => {
    const notifId = await ctx.db.insert("notifications", {
      ...args,
      createdAt: now(),
      readAt: undefined,
    });

    await ctx.scheduler.runAfter(0, api.pushAction.sendPushNotification, {
      userId: args.userId,
      title: args.title,
      body: args.message,
      url: "/notifications",
    });

    return notifId;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.notificationId, { readAt: now() });
  },
});

export const clearByUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const all = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const n of all) await ctx.db.delete(n._id);
  },
});
