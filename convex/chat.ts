import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now, requireAuth, rateLimit } from "./utils";
import { writeOperationalLog } from "./ops";
import { insertNotification } from "./notifications";

const buildPairKey = (reqId1: string, reqId2: string) =>
  [reqId1, reqId2].sort().join("|");

export const getOrCreateThread = mutation({
  args: {
    requestId: v.id("requests"),
    counterpartRequestId: v.id("requests")
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");
    
    const matched = await ctx.db.get(args.counterpartRequestId);
    if (!matched) throw new Error("Matched request not found.");

    const pairKey = buildPairKey(String(args.requestId), String(args.counterpartRequestId));
    const byPairKey = await ctx.db
      .query("threads")
      .withIndex("by_pair_key", (q) => q.eq("pairKey", pairKey))
      .first();
    if (byPairKey) {
      await writeOperationalLog(ctx, {
        domain: "chat",
        level: "info",
        message: "Thread resolved by pairKey.",
        actorUserId: userId,
        metadata: { requestId: args.requestId, threadId: byPairKey._id, pairKey, source: "pairKey" },
      });
      return byPairKey._id;
    }

    const existing = await ctx.db
      .query("threads")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { pairKey, updatedAt: now() });
      await writeOperationalLog(ctx, {
        domain: "chat",
        level: "warning",
        message: "Thread migrated from by_request to pairKey.",
        actorUserId: userId,
        metadata: { requestId: args.requestId, threadId: existing._id, pairKey, source: "by_request" },
      });
      return existing._id;
    }
    const threadId = await ctx.db.insert("threads", {
      requestId: args.requestId,
      userAId: request.userId,
      userBId: matched.userId,
      pairKey,
      createdAt: now(),
      updatedAt: now(),
    });
    await writeOperationalLog(ctx, {
      domain: "chat",
      level: "info",
      message: "Thread created for matched pair.",
      actorUserId: userId,
      metadata: { requestId: args.requestId, counterpartRequestId: args.counterpartRequestId, threadId, pairKey },
    });
    return threadId;
  },
});

export const listMessagesByRequest = query({
  args: { requestId: v.id("requests"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    const ordered = rows.sort((a, b) => a.createdAt - b.createdAt).slice(-limit);
    return await Promise.all(
      ordered.map(async (row) => ({
        ...row,
        mediaUrl: row.mediaStorageId ? await ctx.storage.getUrl(row.mediaStorageId) : row.mediaUrl,
      })),
    );
  },
});

export const listMessagesByThread = query({
  args: { threadId: v.id("threads"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    const ordered = rows.sort((a, b) => a.createdAt - b.createdAt).slice(-limit);
    return await Promise.all(
      ordered.map(async (row) => ({
        ...row,
        mediaUrl: row.mediaStorageId ? await ctx.storage.getUrl(row.mediaStorageId) : row.mediaUrl,
      })),
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    requestId: v.id("requests"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const senderUserId = await requireAuth(ctx);
    await rateLimit(ctx, "sendMessage", senderUserId, 60_000, 30);
    const id = await ctx.db.insert("messages", {
      ...args,
      senderUserId,
      createdAt: now(),
    });
    await ctx.db.patch(args.threadId, { updatedAt: now() });
    await writeOperationalLog(ctx, {
      domain: "chat",
      level: "info",
      message: "Message sent.",
      actorUserId: senderUserId,
      metadata: { messageId: id, threadId: args.threadId, requestId: args.requestId, type: args.type },
    });

    // Notify the other participant
    const request = await ctx.db.get(args.requestId);
    if (request?.giveToRequestId) {
      const matched = await ctx.db.get(request.giveToRequestId);
      if (matched && matched.userId !== senderUserId) {
        await insertNotification(ctx, {
          userId: matched.userId,
          title: "Nuevo mensaje",
          message: "Tenés un nuevo mensaje en el chat de tu permuta.",
          type: "info",
          source: "chat",
        });
      }
    }
    if (request?.receiveFromRequestId && request.receiveFromRequestId !== request.giveToRequestId) {
      const matched = await ctx.db.get(request.receiveFromRequestId);
      if (matched && matched.userId !== senderUserId) {
        await insertNotification(ctx, {
          userId: matched.userId,
          title: "Nuevo mensaje",
          message: "Tenés un nuevo mensaje en el chat de tu permuta.",
          type: "info",
          source: "chat",
        });
      }
    }

    return id;
  },
});

export const markRequestMessagesAsRead = mutation({
  args: { requestId: v.id("requests") },
  handler: async (ctx, args) => {
    const readerUserId = await requireAuth(ctx);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    let updated = 0;
    for (const row of rows) {
      if (row.senderUserId === readerUserId) continue;
      if (row.readAt) continue;
      await ctx.db.patch(row._id, { readAt: now() });
      updated += 1;
    }
    return { ok: true, updated };
  },
});

export const markThreadMessagesAsRead = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const readerUserId = await requireAuth(ctx);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    let updated = 0;
    for (const row of rows) {
      if (row.senderUserId === readerUserId) continue;
      if (row.readAt) continue;
      await ctx.db.patch(row._id, { readAt: now() });
      updated += 1;
    }
    return { ok: true, updated };
  },
});

export const backfillPairThreads = mutation({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("requests").collect();
    const processed = new Set<string>();
    let mergedThreads = 0;
    let movedMessages = 0;

    for (const request of requests) {
      if (!request.giveToRequestId) continue;
      const pairKey = buildPairKey(String(request._id), String(request.giveToRequestId));
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const threadA = await ctx.db
        .query("threads")
        .withIndex("by_request", (q) => q.eq("requestId", request._id))
        .first();
      const threadB = await ctx.db
        .query("threads")
        .withIndex("by_request", (q) => q.eq("requestId", request.giveToRequestId!))
        .first();

      if (!threadA && !threadB) continue;
      const canonical = threadA ?? threadB!;
      await ctx.db.patch(canonical._id, { pairKey, updatedAt: now() });

      const secondary = threadA && threadB && threadA._id !== threadB._id ? threadB : null;
      if (secondary) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", secondary._id))
          .collect();
        for (const message of messages) {
          await ctx.db.patch(message._id, { threadId: canonical._id });
          movedMessages += 1;
        }
        await ctx.db.delete(secondary._id);
        mergedThreads += 1;
      }
    }

    return { ok: true, mergedThreads, movedMessages, processedPairs: processed.size };
  },
});
