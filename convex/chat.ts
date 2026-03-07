import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";

export const getOrCreateThread = mutation({
  args: {
    requestId: v.id("requests"),
    userAId: v.id("users"),
    userBId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("threads")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("threads", {
      ...args,
      createdAt: now(),
      updatedAt: now(),
    });
  },
});

export const listMessagesByRequest = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    requestId: v.id("requests"),
    senderUserId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("messages", {
      ...args,
      createdAt: now(),
    });
    await ctx.db.patch(args.threadId, { updatedAt: now() });
    return id;
  },
});
