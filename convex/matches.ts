import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { now } from "./utils";
import { selectBestMatches, type CandidateEdge, type CandidateTriplet } from "./matchingEngine";
import { insertNotification } from "./notifications";

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
  
  const candidateEdges: CandidateEdge[] = [];
  const candidateTriplets: CandidateTriplet[] = [];
  
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      const a = open[i];
      const b = open[j];
      if (a.userId === b.userId) continue;

      const aWantsB = preferenceRank(a, b.commissionOriginId);
      const bWantsA = preferenceRank(b, a.commissionOriginId);
      if (Number.isFinite(aWantsB) && Number.isFinite(bWantsA)) {
        candidateEdges.push({ left: String(a._id), right: String(b._id), score: aWantsB + bWantsA });
      }

      for (let k = j + 1; k < open.length; k++) {
        const c = open[k];
        if (a.userId === c.userId || b.userId === c.userId) continue;

        // Try cycle direction: A -> B -> C -> A (A gives to B, B to C, C to A)
        const ab = preferenceRank(a, b.commissionOriginId);
        const bc = preferenceRank(b, c.commissionOriginId);
        const ca = preferenceRank(c, a.commissionOriginId);
        if (Number.isFinite(ab) && Number.isFinite(bc) && Number.isFinite(ca)) {
          candidateTriplets.push({ n1: String(a._id), n2: String(b._id), n3: String(c._id), score: ab + bc + ca });
        }

        // Try cycle direction: A -> C -> B -> A (A gives to C, C to B, B to A)
        const ac = preferenceRank(a, c.commissionOriginId);
        const cb = preferenceRank(c, b.commissionOriginId);
        const ba = preferenceRank(b, a.commissionOriginId);
        if (Number.isFinite(ac) && Number.isFinite(cb) && Number.isFinite(ba)) {
          candidateTriplets.push({ n1: String(a._id), n2: String(c._id), n3: String(b._id), score: ac + cb + ba });
        }
      }
    }
  }

  const selected = selectBestMatches(requestIds, candidateEdges, candidateTriplets);

  for (const match of selected.matches) {
    if (match.type === "pair") {
      const [leftId, rightId] = match.elements;
      const left = requestById.get(leftId);
      const right = requestById.get(rightId);
      if (!left || !right) continue;

      const latestLeft = await ctx.db.get(left._id);
      const latestRight = await ctx.db.get(right._id);
      if (!latestLeft || !latestRight) continue;
      if (latestLeft.status !== "PENDING" || latestRight.status !== "PENDING") continue;
      if (latestLeft.giveToRequestId || latestRight.giveToRequestId) continue;

      await ctx.db.patch(left._id, {
        status: "MATCHED",
        giveToRequestId: right._id,
        receiveFromRequestId: right._id,
        finalizedBy: [],
        updatedAt: now(),
      });
      await ctx.db.patch(right._id, {
        status: "MATCHED",
        giveToRequestId: left._id,
        receiveFromRequestId: left._id,
        finalizedBy: [],
        updatedAt: now(),
      });
      
      await insertNotification(ctx, { userId: left.userId, title: "¡Match encontrado!", message: "Se encontró un compañero compatible.", type: "success", source: "requests" });
      await insertNotification(ctx, { userId: right.userId, title: "¡Match encontrado!", message: "Se encontró un compañero compatible.", type: "success", source: "requests" });
      
    } else if (match.type === "triplet") {
      const [aId, bId, cId] = match.elements;
      const a = requestById.get(aId);
      const b = requestById.get(bId);
      const c = requestById.get(cId);
      if (!a || !b || !c) continue;

      const latestA = await ctx.db.get(a._id);
      const latestB = await ctx.db.get(b._id);
      const latestC = await ctx.db.get(c._id);
      if (!latestA || !latestB || !latestC) continue;
      if (latestA.status !== "PENDING" || latestB.status !== "PENDING" || latestC.status !== "PENDING") continue;
      if (latestA.giveToRequestId || latestB.giveToRequestId || latestC.giveToRequestId) continue;

      await ctx.db.patch(a._id, { status: "MATCHED", giveToRequestId: b._id, receiveFromRequestId: c._id, finalizedBy: [], updatedAt: now() });
      await ctx.db.patch(b._id, { status: "MATCHED", giveToRequestId: c._id, receiveFromRequestId: a._id, finalizedBy: [], updatedAt: now() });
      await ctx.db.patch(c._id, { status: "MATCHED", giveToRequestId: a._id, receiveFromRequestId: b._id, finalizedBy: [], updatedAt: now() });
      
      await insertNotification(ctx, { userId: a.userId, title: "¡Match triangular encontrado!", message: "Se armó una permuta de tres personas.", type: "success", source: "requests" });
      await insertNotification(ctx, { userId: b.userId, title: "¡Match triangular encontrado!", message: "Se armó una permuta de tres personas.", type: "success", source: "requests" });
      await insertNotification(ctx, { userId: c.userId, title: "¡Match triangular encontrado!", message: "Se armó una permuta de tres personas.", type: "success", source: "requests" });
    }
  }

  return { matchedPairs: selected.peopleSatisfied }; // Just return a number for API consistency
};
