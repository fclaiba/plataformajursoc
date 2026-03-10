import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { now } from "./utils";

export const createReport = mutation({
  args: {
    category: v.union(v.literal("bug"), v.literal("abuse"), v.literal("support")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");
    if (!args.message.trim()) throw new Error("El reporte no puede estar vacío.");

    const reportId = await ctx.db.insert("supportReports", {
      userId,
      category: args.category,
      message: args.message.trim(),
      status: "open",
      createdAt: now(),
      updatedAt: now(),
    });

    return { ok: true, reportId };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("supportReports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});
