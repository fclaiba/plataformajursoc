import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizeEmail, now } from "./utils";
import { getAuthUserId } from "@convex-dev/auth/server";

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
      createdAt: now(),
      updatedAt: now(),
    });
    return userId;
  },
});
