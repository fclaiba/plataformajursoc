import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { now, requireAuth, rateLimit } from "./utils";
import {
  areReciprocallyMatched,
  canBeCompleted,
  shouldAutoCompleteAfterDoubleFinalize,
} from "./requestsRules";
import { writeOperationalLog } from "./ops";
import { insertNotification } from "./notifications";

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

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const myRequests = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const active = myRequests.filter(
      (r) => r.status === "PENDING" || r.status === "MATCHED",
    ).length;
    const completed = myRequests.filter((r) => r.status === "COMPLETED").length;
    const pendingConfirm = myRequests.filter(
      (r) =>
        r.status === "MATCHED" &&
        r.giveToRequestId &&
        !r.finalizedBy?.includes(userId),
    ).length;

    // Unread messages: count messages where the user is receiver and readAt is not set
    let unreadMessages = 0;
    const matchedRequests = myRequests.filter((r) => r.giveToRequestId || r.receiveFromRequestId);
    for (const req of matchedRequests) {
      const threads = await ctx.db
        .query("threads")
        .withIndex("by_request", (q) => q.eq("requestId", req._id))
        .collect();
      for (const thread of threads) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();
        unreadMessages += messages.filter(
          (m) => m.senderUserId !== userId && !m.readAt,
        ).length;
      }
    }

    return { active, completed, pendingConfirm, unreadMessages };
  },
});

export const countActiveByCommission = query({
  args: { subjectExternalId: v.string() },
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_external", (q) => q.eq("externalId", args.subjectExternalId))
      .first();
    if (!subject) return [];

    const pending = await ctx.db
      .query("requests")
      .withIndex("by_subject_status", (q) =>
        q.eq("subjectId", subject._id).eq("status", "PENDING"),
      )
      .collect();

    const countByCommission = new Map<string, number>();
    for (const req of pending) {
      for (const dest of req.destinations) {
        const commission = await ctx.db.get(dest.commissionId);
        const key = commission?.externalId ?? String(dest.commissionId);
        countByCommission.set(key, (countByCommission.get(key) ?? 0) + 1);
      }
    }

    return Array.from(countByCommission.entries()).map(([commissionId, count]) => ({
      commissionId,
      count,
    }));
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
      if (request.giveToRequestId) {
        const giveTo = await ctx.db.get(request.giveToRequestId);
        if (giveTo) byId.set(String(giveTo._id), giveTo);
      }
      if (request.receiveFromRequestId && request.receiveFromRequestId !== request.giveToRequestId) {
        const receiveFrom = await ctx.db.get(request.receiveFromRequestId);
        if (receiveFrom) byId.set(String(receiveFrom._id), receiveFrom);
      }
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
    const userId = await requireAuth(ctx);
    await rateLimit(ctx, "createRequest", userId, 60_000, 5);
    const requestId = await ctx.db.insert("requests", {
      ...args,
      userId,
      status: "PENDING",
      finalizedBy: [],
      createdAt: now(),
      updatedAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId,
      actorUserId: userId,
      type: "REQUEST_CREATED",
      createdAt: now(),
    });
    await ctx.db.insert("requestEvents", {
      requestId,
      actorUserId: userId,
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
      actorUserId: userId,
      metadata: { requestId, subjectId: args.subjectId },
    });
    return requestId;
  },
});

export const editRequest = mutation({
  args: {
    requestId: v.id("requests"),
    destinations: v.array(
      v.object({
        commissionId: v.id("commissions"),
        priority: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await rateLimit(ctx, "editRequest", userId, 60_000, 10);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.userId !== userId) throw new Error("No tenés permiso para editar esta solicitud.");
    if (request.status !== "PENDING") {
      throw new Error("Solo se pueden editar solicitudes en estado PENDIENTE.");
    }
    if (args.destinations.length === 0) {
      throw new Error("Debe haber al menos un destino.");
    }

    await ctx.db.patch(request._id, {
      destinations: args.destinations,
      updatedAt: now(),
    });

    await ctx.db.insert("requestEvents", {
      requestId: request._id,
      actorUserId: userId,
      type: "REQUEST_EDITED",
      payload: { newDestinations: args.destinations.length },
      createdAt: now(),
    });

    // Re-trigger matching with updated destinations
    await ctx.runMutation(api.matchingOrchestrator.enqueueSubjectMatching, {
      subjectId: request.subjectId,
      reason: "request_edited",
    });

    return request._id;
  },
});

export const cancelRequest = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const actorUserId = await requireAuth(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    if (request.status === "CANCELLED" || request.status === "COMPLETED") return;
    if (request.status === "CONFIRMED") {
      throw new Error("No se puede cancelar una solicitud ya confirmada.");
    }

    const counterpartIds = new Set<Id<"requests">>();
    if (request.giveToRequestId) counterpartIds.add(request.giveToRequestId);
    if (request.receiveFromRequestId) counterpartIds.add(request.receiveFromRequestId);

    for (const counterpartId of counterpartIds) {
      const counterpart = await ctx.db.get(counterpartId);
      if (counterpart && (counterpart.status === "MATCHED" || counterpart.status === "CONFIRMED")) {
        await ctx.db.patch(counterpart._id, {
          status: "PENDING",
          giveToRequestId: undefined,
          receiveFromRequestId: undefined,
          finalizedBy: [],
          updatedAt: now(),
        });
        await ctx.db.insert("requestEvents", {
          requestId: counterpart._id,
          actorUserId,
          type: "MATCH_RELEASED_ON_CANCEL",
          payload: { cancelledRequestId: request._id },
          createdAt: now(),
        });
      }
    }

    await ctx.db.patch(args.requestId, {
      status: "CANCELLED",
      giveToRequestId: undefined,
      receiveFromRequestId: undefined,
      finalizedBy: [],
      updatedAt: now(),
    });

    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId,
      type: "REQUEST_CANCELLED",
      createdAt: now(),
    });
    
    await ctx.db.insert("requestEvents", {
      requestId: args.requestId,
      actorUserId,
      type: "MATCH_RECOMPUTE_SCHEDULED",
      payload: { reason: "request_cancelled", subjectId: request.subjectId, releasedCounterparts: Array.from(counterpartIds) },
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
      actorUserId,
      metadata: { requestId: args.requestId, subjectId: request.subjectId },
    });
  },
});

export const finalizeRequest = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const actorUserId = await requireAuth(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    if (request.userId !== actorUserId) {
      throw new Error("Solo el dueño de la solicitud puede confirmarla.");
    }

    const counterpartIds = new Set<Id<"requests">>();
    if (request.giveToRequestId) counterpartIds.add(request.giveToRequestId);
    if (request.receiveFromRequestId) counterpartIds.add(request.receiveFromRequestId);
    
    if (counterpartIds.size === 0) return;

    const group = [request];
    for (const gid of counterpartIds) {
      const req = await ctx.db.get(gid);
      if (req) group.push(req);
    }

    const unconfirmable = group.find(r => r.status !== "MATCHED" && r.status !== "CONFIRMED" && r.status !== "COMPLETED");
    if (unconfirmable) {
       throw new Error("Una o más partes del intercambio no están en estado confirmable.");
    }

    const allUserIds = group.map(g => g.userId);
    
    // Add this user to everyone's finalizedBy list
    for (const req of group) {
      const finalizedBy = Array.from(new Set([...req.finalizedBy, actorUserId]));
      await ctx.db.patch(req._id, { finalizedBy, updatedAt: now() });
      if (req.status === "MATCHED") {
        await ctx.db.patch(req._id, { status: "CONFIRMED" });
      }
    }

    // Check if everyone has finalized
    let allFinalized = true;
    for (const req of group) {
      const latest = await ctx.db.get(req._id);
      if (!latest) continue;
      for (const uid of allUserIds) {
        if (!latest.finalizedBy.includes(uid)) {
          allFinalized = false;
        }
      }
    }

    if (!allFinalized) return;
    
    // Auto-complete
    for (const req of group) {
      const latest = await ctx.db.get(req._id);
      if (latest && latest.status !== "COMPLETED") {
        await ctx.db.patch(req._id, { status: "COMPLETED", updatedAt: now() });
        await ctx.db.insert("requestEvents", { requestId: req._id, actorUserId, type: "REQUEST_CONFIRMED", createdAt: now() });
        await ctx.db.insert("requestEvents", { requestId: req._id, actorUserId, type: "REQUEST_COMPLETED", createdAt: now() });
        const removed = await removeEnrollmentForCompletedRequest(ctx, { userId: req.userId, subjectId: req.subjectId });
      }
    }

    await writeOperationalLog(ctx, {
      domain: "requests",
      level: "info",
      message: "Exchange completed and enrollments cleared from my subjects.",
      actorUserId,
      metadata: { requestId: request._id, autoCompleted: true },
    });

    for (const uid of new Set(allUserIds)) {
      await insertNotification(ctx, {
        userId: uid,
        title: "¡Permuta completada!",
        message: "Tu intercambio fue completado exitosamente. Ya podés dejar una reseña.",
        type: "success",
        source: "requests",
      });
    }
  },
});

export const completeExchange = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const actorUserId = await requireAuth(ctx);
    // similar logic to finalize but forced.
    const request = await ctx.db.get(args.requestId);
    if (!request) return;
    
    const counterpartIds = new Set<Id<"requests">>();
    if (request.giveToRequestId) counterpartIds.add(request.giveToRequestId);
    if (request.receiveFromRequestId) counterpartIds.add(request.receiveFromRequestId);
    
    if (counterpartIds.size === 0) throw new Error("La solicitud no tiene contraparte.");

    const group = [request];
    for (const gid of counterpartIds) {
      const req = await ctx.db.get(gid);
      if (req) group.push(req);
    }

    for (const req of group) {
      if (req.status !== "COMPLETED") {
        await ctx.db.patch(req._id, { status: "COMPLETED", updatedAt: now() });
        await ctx.db.insert("requestEvents", { requestId: req._id, actorUserId, type: "REQUEST_COMPLETED", createdAt: now() });
        await removeEnrollmentForCompletedRequest(ctx, { userId: req.userId, subjectId: req.subjectId });
      }
    }

    // notifications
    const allUserIds = group.map(g => g.userId);
    for (const uid of new Set(allUserIds)) {
      await insertNotification(ctx, {
        userId: uid,
        title: "¡Permuta completada!",
        message: "Tu intercambio fue completado manualmente. Ya podés dejar una reseña.",
        type: "success",
        source: "requests",
      });
    }
  },
});
