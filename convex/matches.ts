import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { now } from "./utils";

const preferenceRank = (
  request: {
    destinations: Array<{ commissionId: Id<"commissions">; priority: number }>;
  },
  commissionId: Id<"commissions">,
) => request.destinations.find((d) => d.commissionId === commissionId)?.priority ?? Number.POSITIVE_INFINITY;

export const runMatching = async (ctx: MutationCtx, subjectId: Id<"subjects">) => {
  const open = await ctx.db
    .query("requests")
    .withIndex("by_subject_status", (q) => q.eq("subjectId", subjectId).eq("status", "PENDING"))
    .collect();

  const candidates: Array<{ a: typeof open[number]; b: typeof open[number]; score: number }> = [];
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      const a = open[i];
      const b = open[j];
      if (a.userId === b.userId) continue;

      const aWantsB = preferenceRank(a, b.commissionOriginId);
      const bWantsA = preferenceRank(b, a.commissionOriginId);
      if (!Number.isFinite(aWantsB) || !Number.isFinite(bWantsA)) continue;
      candidates.push({ a, b, score: aWantsB + bWantsA });
    }
  }

  candidates.sort((x, y) => x.score - y.score);
  const used = new Set<string>();

  for (const c of candidates) {
    if (used.has(c.a._id) || used.has(c.b._id)) continue;
    await ctx.db.patch(c.a._id, {
      status: "MATCHED",
      matchedRequestId: c.b._id,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.patch(c.b._id, {
      status: "MATCHED",
      matchedRequestId: c.a._id,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: c.a._id,
      actorUserId: undefined,
      type: "MATCH_FOUND",
      payload: { counterpart: c.b._id },
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: c.b._id,
      actorUserId: undefined,
      type: "MATCH_FOUND",
      payload: { counterpart: c.a._id },
      createdAt: now(),
    });
    used.add(c.a._id);
    used.add(c.b._id);
  }
};
