import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now, pairHash } from "./utils";

const K_FACTOR = 32;
const DAILY_LIMIT = 120;
const COOLDOWN_MS = 2500;

const expectedScore = (eloA: number, eloB: number) => 1 / (1 + Math.pow(10, (eloB - eloA) / 400));

export const getLeaderboard = query({
  args: {
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratingSnapshots")
      .withIndex("by_context", (q) => q.eq("contextType", args.contextType).eq("contextId", args.contextId))
      .collect();
  },
});

export const castVote = mutation({
  args: {
    voterUserId: v.id("users"),
    winnerProfessorId: v.id("professors"),
    loserProfessorId: v.id("professors"),
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.winnerProfessorId === args.loserProfessorId) throw new Error("Invalid vote pair.");

    const hash = pairHash(String(args.winnerProfessorId), String(args.loserProfessorId));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const userVotes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterUserId", args.voterUserId))
      .collect();
    const todayVotes = userVotes.filter((v) => v.createdAt >= todayStart.getTime());
    if (todayVotes.length >= DAILY_LIMIT) throw new Error("Daily voting limit reached.");

    const pairVotes = await ctx.db
      .query("votes")
      .withIndex("by_pair_context", (q) =>
        q.eq("pairHash", hash).eq("contextType", args.contextType).eq("contextId", args.contextId),
      )
      .collect();
    const lastVote = pairVotes.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (lastVote && now() - lastVote.createdAt < COOLDOWN_MS) {
      throw new Error("Cooldown active for this pair/context.");
    }

    const loadSnapshot = async (professorId: typeof args.winnerProfessorId) => {
      const snapshots = await ctx.db
        .query("ratingSnapshots")
        .withIndex("by_context", (q) => q.eq("contextType", args.contextType).eq("contextId", args.contextId))
        .collect();
      return snapshots.find((s) => s.professorId === professorId);
    };

    const winner = await loadSnapshot(args.winnerProfessorId);
    const loser = await loadSnapshot(args.loserProfessorId);
    const winnerElo = winner?.elo ?? 1200;
    const loserElo = loser?.elo ?? 1200;

    const expectedWinner = expectedScore(winnerElo, loserElo);
    const expectedLoser = expectedScore(loserElo, winnerElo);
    const nextWinnerElo = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
    const nextLoserElo = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

    await ctx.db.insert("votes", {
      voterUserId: args.voterUserId,
      winnerProfessorId: args.winnerProfessorId,
      loserProfessorId: args.loserProfessorId,
      contextType: args.contextType,
      contextId: args.contextId,
      pairHash: hash,
      createdAt: now(),
    });

    const upsertSnapshot = async (
      current: typeof winner,
      professorId: typeof args.winnerProfessorId,
      elo: number,
      won: boolean,
    ) => {
      if (current) {
        await ctx.db.patch(current._id, {
          elo,
          matches: current.matches + 1,
          wins: current.wins + (won ? 1 : 0),
          updatedAt: now(),
        });
      } else {
        await ctx.db.insert("ratingSnapshots", {
          professorId,
          contextType: args.contextType,
          contextId: args.contextId,
          elo,
          matches: 1,
          wins: won ? 1 : 0,
          updatedAt: now(),
        });
      }
    };

    await upsertSnapshot(winner, args.winnerProfessorId, nextWinnerElo, true);
    await upsertSnapshot(loser, args.loserProfessorId, nextLoserElo, false);
  },
});
