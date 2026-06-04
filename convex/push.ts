import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { now } from "./utils";

// Make sure to define these in your Convex environment variables:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (e.g. mailto:your-email@example.com)

export const getVapidPublicKey = query({
  args: {},
  handler: async () => {
    return process.env.VAPID_PUBLIC_KEY || null;
  },
});

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if subscription already exists for this endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Just update ownership or timestamps if needed
      if (existing.userId !== userId) {
        await ctx.db.patch(existing._id, { userId, p256dh: args.p256dh, auth: args.auth });
      }
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: now(),
    });
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing && existing.userId === userId) {
      await ctx.db.delete(existing._id);
    }
  },
});



import { internalQuery, internalMutation } from "./_generated/server";

export const getSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const internalUnsubscribe = internalMutation({
  args: { _id: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args._id);
  },
});
