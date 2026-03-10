import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { now } from "./utils";
import {
  areReciprocallyMatched,
  canBeCompleted,
  shouldAutoCompleteAfterDoubleFinalize,
} from "./requestsRules";
import { writeOperationalLog } from "./ops";

const removeEnrollmentForCompletedRequest = async (
  ctx: any,
  args: { userId: any; subjectId: any },
) => {
  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_user_subject", (q: any) => q.eq("userId", args.userId).eq("subjectId", args.subjectId))
    .first();
  if (!enrollment) return false;

  await ctx.db.delete(enrollment._id);
  const commission = await ctx.db.get(enrollment.commissionId);
  if (commission) {
    await ctx.db.patch(commission._id, {
      seatsAvailable: Math.min(commission.seatsTotal, commission.seatsAvailable + 1),
      updatedAt: now(),
    });
  }
  return true;
};

export const listByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

export const listVisibleByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const mine = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const byId = new Map<string, (typeof mine)[number]>();
    for (const request of mine) {
      byId.set(String(request._id), request);
    }

    for (const request of mine) {
      if (!request.matchedRequestId) continue;
      const matched = await ctx.db.get(request.matchedRequestId);
      if (!matched) continue;
      byId.set(String(matched._id), matched);
    }

    const sorted = Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    const enriched: Array<any> = [];
    for (const request of sorted) {
      const subject = await ctx.db.get(request.subjectId);
      const originCommission = await ctx.db.get(request.commissionOriginId);
      const destinationExternal = [] as Array<{ commissionId: string; priority: number }>;
      for (const destination of request.destinations) {
        const commission = await ctx.db.get(destination.commissionId);
        if (!commission) continue;
        destinationExternal.push({
          commissionId: commission.externalId,
          priority: destination.priority,
        });
      }
      enriched.push({
        ...request,
        subjectExternalId: subject?.externalId ?? String(request.subjectId),
        commissionOriginExternalId:
          originCommission?.externalId ?? String(request.commissionOriginId),
        destinationsExternal: destinationExternal,
      });
    }
    return enriched;
  },
});

export const createRequest = mutation({
  args: {
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    commissionOriginId: v.id("commissions"),
    destinations: v.array(
      v.object({
        commissionId: v.id("commissions"),
        priority: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("requests", {
      ...args,
      status: "PENDING",
      finalizedBy: [],
      createdAt: now(),
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId,
      actorUserId: args.userId,
      type: "REQUEST_CREATED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId,
      actorUserId: args.userId,
      type: "MATCH_RECOMPUTE_SCHEDULED",
      payload: { reason: "request_created", subjectId: args.subjectId },
      createdAt: now(),
    });
    await ctx.runMutation(api.matchingOrchestrator.enqueueSubjectMatching, {
      subjectId: args.subjectId,
      reason: "request_created",
    });
    await writeOperationalLog(ctx, {
      domain: "requests",
      level: "info",
      message: "Request created and matching scheduled.",
      actorUserId: args.userId,
      metadata: { requestId, subjectId: args.subjectId },
    });
    return requestId;
  },
});

export const cancelRequest = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    if (request.status === "CANCELLED" || request.status === "COMPLETED") return;
    if (request.status === "CONFIRMED") {
      throw new Error("No se puede cancelar una solicitud ya confirmada.");
    }

    let counterpartId = request.matchedRequestId;
    if (counterpartId) {
      const counterpart = await ctx.db.get(counterpartId);
      if (counterpart && areReciprocallyMatched({
        _id: String(request._id),
        status: request.status,
        matchedRequestId: request.matchedRequestId ? String(request.matchedRequestId) : undefined,
      }, {
        _id: String(counterpart._id),
        status: counterpart.status,
        matchedRequestId: counterpart.matchedRequestId ? String(counterpart.matchedRequestId) : undefined,
      })) {
        if (counterpart.status === "MATCHED" || counterpart.status === "CONFIRMED") {
          await ctx.db.patch(counterpart._id, {
            status: "PENDING",
            matchedRequestId: undefined,
            finalizedBy: [],
            updatedAt: now(),
          });
          await ctx.db.insert("requestEvents", {
            requestId: counterpart._id,
            actorUserId: args.actorUserId,
            type: "MATCH_RELEASED_ON_CANCEL",
            payload: { cancelledRequestId: request._id },
            createdAt: now(),
          });
        }
      } else {
        counterpartId = undefined;
      }
    }

    await ctx.db.patch(args.requestId, {
      status: "CANCELLED",
      matchedRequestId: undefined,
      finalizedBy: [],
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId: args.actorUserId,
      type: "REQUEST_CANCELLED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId: args.actorUserId,
      type: "MATCH_RECOMPUTE_SCHEDULED",
      payload: { reason: "request_cancelled", subjectId: request.subjectId, releasedCounterpart: counterpartId },
      createdAt: now(),
    });
    await ctx.runMutation(api.matchingOrchestrator.enqueueSubjectMatching, {
      subjectId: request.subjectId,
      reason: "request_cancelled",
    });
    await writeOperationalLog(ctx, {
      domain: "requests",
      level: "warning",
      message: "Request cancelled and matching rescheduled.",
      actorUserId: args.actorUserId,
      metadata: { requestId: args.requestId, subjectId: request.subjectId },
    });
  },
});

export const finalizeRequest = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.matchedRequestId) return;
    if (request.userId !== args.actorUserId) {
      throw new Error("Solo el dueño de la solicitud puede confirmarla.");
    }
    const matched = await ctx.db.get(request.matchedRequestId);
    if (!matched) return;
    if (request.status === "COMPLETED" && matched.status === "COMPLETED") return;
    if (
      !areReciprocallyMatched(
        {
          _id: String(request._id),
          status: request.status,
          matchedRequestId: request.matchedRequestId ? String(request.matchedRequestId) : undefined,
        },
        {
          _id: String(matched._id),
          status: matched.status,
          matchedRequestId: matched.matchedRequestId ? String(matched.matchedRequestId) : undefined,
        },
      )
    ) {
      throw new Error("La relación de match es inconsistente.");
    }
    if (
      request.status !== "MATCHED" &&
      request.status !== "CONFIRMED" &&
      request.status !== "COMPLETED"
    ) {
      throw new Error("La solicitud no está en estado confirmable.");
    }
    if (
      matched.status !== "MATCHED" &&
      matched.status !== "CONFIRMED" &&
      matched.status !== "COMPLETED"
    ) {
      throw new Error("La contraparte no está en estado confirmable.");
    }

    const finalizedBy = Array.from(new Set([...request.finalizedBy, args.actorUserId]));
    await ctx.db.patch(request._id, {
      finalizedBy,
      updatedAt: now(),
    });
    const latestRequest = await ctx.db.get(request._id);
    const latestMatched = await ctx.db.get(matched._id);
    if (!latestRequest || !latestMatched) return;
    const shouldAutoComplete = shouldAutoCompleteAfterDoubleFinalize(
      {
        _id: String(latestRequest._id),
        userId: String(latestRequest.userId),
        status: latestRequest.status,
        matchedRequestId: latestRequest.matchedRequestId ? String(latestRequest.matchedRequestId) : undefined,
        finalizedBy: latestRequest.finalizedBy.map(String),
      },
      {
        _id: String(latestMatched._id),
        userId: String(latestMatched.userId),
        status: latestMatched.status,
        matchedRequestId: latestMatched.matchedRequestId ? String(latestMatched.matchedRequestId) : undefined,
        finalizedBy: latestMatched.finalizedBy.map(String),
      },
    );
    if (!shouldAutoComplete) return;
    if (latestRequest.status === "COMPLETED" && latestMatched.status === "COMPLETED") return;

    await ctx.db.patch(request._id, { status: "COMPLETED", updatedAt: now() });
    await ctx.db.patch(matched._id, { status: "COMPLETED", updatedAt: now() });
    await ctx.db.insert("requestEvents", {
      requestId: request._id,
      actorUserId: args.actorUserId,
      type: "REQUEST_CONFIRMED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: matched._id,
      actorUserId: args.actorUserId,
      type: "REQUEST_CONFIRMED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: request._id,
      actorUserId: args.actorUserId,
      type: "REQUEST_COMPLETED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: matched._id,
      actorUserId: args.actorUserId,
      type: "REQUEST_COMPLETED",
      createdAt: now(),
    });
    const removedCurrent = await removeEnrollmentForCompletedRequest(ctx, {
      userId: request.userId,
      subjectId: request.subjectId,
    });
    const removedMatched = await removeEnrollmentForCompletedRequest(ctx, {
      userId: matched.userId,
      subjectId: matched.subjectId,
    });
    await writeOperationalLog(ctx, {
      domain: "requests",
      level: "info",
      message: "Exchange completed and enrollments cleared from my subjects.",
      actorUserId: args.actorUserId,
      metadata: {
        requestId: request._id,
        matchedRequestId: matched._id,
        subjectId: request.subjectId,
        removedCurrent,
        removedMatched,
      },
    });
  },
});

export const completeExchange = mutation({
  args: {
    requestId: v.id("requests"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    if (request.status === "COMPLETED") return;
    if (!request.matchedRequestId) {
      throw new Error("La solicitud no tiene contraparte matcheada.");
    }
    const matched = await ctx.db.get(request.matchedRequestId);
    if (!matched) {
      throw new Error("La contraparte de la solicitud no existe.");
    }
    if (matched.status === "COMPLETED") return;
    if (
      !canBeCompleted(
        {
          _id: String(request._id),
          status: request.status,
          matchedRequestId: request.matchedRequestId ? String(request.matchedRequestId) : undefined,
        },
        {
          _id: String(matched._id),
          status: matched.status,
          matchedRequestId: matched.matchedRequestId ? String(matched.matchedRequestId) : undefined,
        },
      )
    ) {
      throw new Error("El cierre es automático cuando ambas partes confirman la permuta.");
    }
    await ctx.db.patch(args.requestId, { status: "COMPLETED", updatedAt: now() });
    await ctx.db.patch(request.matchedRequestId, { status: "COMPLETED", updatedAt: now() });
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId: args.actorUserId,
      type: "REQUEST_COMPLETED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId: request.matchedRequestId,
      actorUserId: args.actorUserId,
      type: "REQUEST_COMPLETED",
      createdAt: now(),
    });
    const removedCurrent = await removeEnrollmentForCompletedRequest(ctx, {
      userId: request.userId,
      subjectId: request.subjectId,
    });
    const removedMatched = await removeEnrollmentForCompletedRequest(ctx, {
      userId: matched.userId,
      subjectId: matched.subjectId,
    });
    await writeOperationalLog(ctx, {
      domain: "requests",
      level: "info",
      message: "Manual completion cleared enrollments from my subjects.",
      actorUserId: args.actorUserId,
      metadata: {
        requestId: request._id,
        matchedRequestId: matched._id,
        subjectId: request.subjectId,
        removedCurrent,
        removedMatched,
      },
    });
  },
});
