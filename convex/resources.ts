import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { now } from "./utils";

const requireAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated.");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  if (profile?.role !== "admin") throw new Error("Admin role required.");
  return userId;
};

export const listBySubject = query({
  args: { subjectExternalId: v.string(), category: v.optional(v.union(v.literal("biblio"), v.literal("apuntes"), v.literal("resumenes"))) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("subjectResources")
      .withIndex("by_subject_category", (q) =>
        q.eq("subjectExternalId", args.subjectExternalId).eq("category", args.category ?? "biblio"),
      )
      .collect();
    if (!args.category) {
      const everything = await ctx.db
        .query("subjectResources")
        .withIndex("by_subject_category", (q) => q.eq("subjectExternalId", args.subjectExternalId).eq("category", "biblio"))
        .collect();
      const apuntes = await ctx.db
        .query("subjectResources")
        .withIndex("by_subject_category", (q) => q.eq("subjectExternalId", args.subjectExternalId).eq("category", "apuntes"))
        .collect();
      const resumenes = await ctx.db
        .query("subjectResources")
        .withIndex("by_subject_category", (q) => q.eq("subjectExternalId", args.subjectExternalId).eq("category", "resumenes"))
        .collect();
      return [...everything, ...apuntes, ...resumenes].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createResource = mutation({
  args: {
    subjectExternalId: v.string(),
    category: v.union(v.literal("biblio"), v.literal("apuntes"), v.literal("resumenes")),
    title: v.string(),
    author: v.optional(v.string()),
    type: v.union(v.literal("pdf"), v.literal("link"), v.literal("video")),
    url: v.string(),
    size: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("subjectResources", {
      ...args,
      createdAt: now(),
      updatedAt: now(),
    });
  },
});

export const deleteResource = mutation({
  args: { resourceId: v.id("subjectResources") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.resourceId);
    return { ok: true };
  },
});
