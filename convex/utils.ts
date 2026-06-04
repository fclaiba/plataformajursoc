import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

export const now = () => Date.now();

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const pairHash = (left: string, right: string) =>
  [left, right].sort().join("__");

export const requireAuth = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated.");
  return userId;
};

/**
 * Sliding-window rate limiter backed by the `rateLimits` table.
 * Throws a user-facing error when the limit is exceeded.
 *
 * @param ctx      mutation context
 * @param action   a short identifier (e.g. "createRequest")
 * @param userId   the acting user
 * @param windowMs window size in ms (e.g. 60_000 for 1 min)
 * @param maxHits  max allowed calls within the window
 */
export const rateLimit = async (
  ctx: MutationCtx,
  action: string,
  userId: string,
  windowMs: number,
  maxHits: number,
) => {
  const key = `${action}:${userId}`;
  const timestamp = now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", { key, hits: 1, windowStart: timestamp });
    return;
  }

  // Window expired → reset
  if (timestamp - existing.windowStart > windowMs) {
    await ctx.db.patch(existing._id, { hits: 1, windowStart: timestamp });
    return;
  }

  if (existing.hits >= maxHits) {
    throw new Error(
      `Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo.`,
    );
  }

  await ctx.db.patch(existing._id, { hits: existing.hits + 1 });
};
