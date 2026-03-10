import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { now } from "./utils";
import { selectBestPairs } from "./matchingEngine";

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

  const requestById = new Map(open.map((request) => [String(request._id), request]));
  const requestIds = open.map((request) => String(request._id));
  const candidateEdges: Array<{ left: string; right: string; score: number }> = [];
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      const a = open[i];
      const b = open[j];
      if (a.userId === b.userId) continue;

      const aWantsB = preferenceRank(a, b.commissionOriginId);
      const bWantsA = preferenceRank(b, a.commissionOriginId);
      if (!Number.isFinite(aWantsB) || !Number.isFinite(bWantsA)) continue;
      candidateEdges.push({ left: String(a._id), right: String(b._id), score: aWantsB + bWantsA });
    }
  }

  const selected = selectBestPairs(requestIds, candidateEdges);

  for (const [leftId, rightId] of selected.pairs) {
    const left = requestById.get(leftId);
    const right = requestById.get(rightId);
    if (!left || !right) continue;

    // Re-read before patching to keep application idempotent and race-safe.
    const latestLeft = await ctx.db.get(left._id);
    const latestRight = await ctx.db.get(right._id);
    if (!latestLeft || !latestRight) continue;
    if (latestLeft.status !== "PENDING" || latestRight.status !== "PENDING") continue;
    if (latestLeft.matchedRequestId || latestRight.matchedRequestId) continue;

    await ctx.db.patch(left._id, {
      status: "MATCHED",
      matchedRequestId: right._id,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.patch(right._id, {
      status: "MATCHED",
      matchedRequestId: left._id,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: left._id,
      actorUserId: undefined,
      type: "MATCH_FOUND",
      payload: { counterpart: right._id, strategy: "max_pairs_then_priority" },
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: right._id,
      actorUserId: undefined,
      type: "MATCH_FOUND",
      payload: { counterpart: left._id, strategy: "max_pairs_then_priority" },
      createdAt: now(),
    });
  }

  return { matchedPairs: selected.pairCount };
};
