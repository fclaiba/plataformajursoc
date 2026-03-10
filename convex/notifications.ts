import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";

export const listByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
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
    return await ctx.db.insert("notifications", {
      ...args,
      createdAt: now(),
      readAt: undefined,
    });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { readAt: now() });
  },
});

export const clearByUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const n of all) await ctx.db.delete(n._id);
  },
});
