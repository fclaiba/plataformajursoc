import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now, pairHash, requireAuth } from "./utils";

const K_FACTOR = 32;
const DAILY_LIMIT = 120;
const COOLDOWN_MS = 2500;

const expectedScore = (eloA: number, eloB: number) => 1 / (1 + Math.pow(10, (eloB - eloA) / 400));

const normalizeProfessorName = (raw: string) =>
  raw
    .replace(/^\s*(titular|adjunto)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeProfessorKey = (raw: string) => normalizeProfessorName(raw).toLocaleLowerCase("es-AR");
const isCompositeProfessorName = (name: string) => name.includes("/");
const toBinaryRole = (role: string) => (role === "Titular" ? "Titular" : "Adjunto");

export const getLeaderboard = query({
  args: {
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const rows = await ctx.db
      .query("ratingSnapshots")
      .withIndex("by_context", (q) => q.eq("contextType", args.contextType).eq("contextId", args.contextId))
      .collect();
    return rows.sort((a, b) => b.elo - a.elo).slice(0, limit);
  },
});

export const listProfessors = query({
  args: {},
  handler: async (ctx) => {
    const professors = await ctx.db.query("professors").collect();
    return professors.filter((professor) => !isCompositeProfessorName(professor.name));
  },
});

export const listProfessorsWithStats = query({
  args: {},
  handler: async (ctx) => {
    const professors = (await ctx.db.query("professors").collect()).filter(
      (professor) => !isCompositeProfessorName(professor.name),
    );
    const snapshots = await ctx.db.query("ratingSnapshots").collect();

    const byProfessor = new Map<string, Array<(typeof snapshots)[number]>>();
    for (const snapshot of snapshots) {
      const key = String(snapshot.professorId);
      const current = byProfessor.get(key) ?? [];
      current.push(snapshot);
      byProfessor.set(key, current);
    }

    return professors.map((professor) => {
      const professorSnapshots = byProfessor.get(String(professor._id)) ?? [];
      const general = professorSnapshots.find(
        (snapshot) => snapshot.contextType === "general" && snapshot.contextId === "general",
      );
      const bySubject = professorSnapshots
        .filter((snapshot) => snapshot.contextType === "subject")
        .map((snapshot) => ({
          contextId: snapshot.contextId,
          elo: snapshot.elo,
          matches: snapshot.matches,
          wins: snapshot.wins,
        }));
      const byCathedra = professorSnapshots
        .filter((snapshot) => snapshot.contextType === "cathedra")
        .map((snapshot) => ({
          contextId: snapshot.contextId,
          elo: snapshot.elo,
          matches: snapshot.matches,
          wins: snapshot.wins,
        }));

      return {
        _id: String(professor._id),
        name: professor.name,
        roles: professor.roles,
        subjectExternalIds: professor.subjectExternalIds,
        cathedraExternalIds: professor.cathedraExternalIds,
        general: general
          ? { elo: general.elo, matches: general.matches, wins: general.wins }
          : { elo: 1200, matches: 0, wins: 0 },
        bySubject,
        byCathedra,
      };
    });
  },
});

export const ensureProfessors = mutation({
  args: {
    professors: v.array(
      v.object({
        name: v.string(),
        roles: v.array(v.string()),
        subjectExternalIds: v.array(v.string()),
        cathedraExternalIds: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const professor of args.professors) {
      const normalizedName = normalizeProfessorName(professor.name);
      const primaryRole = toBinaryRole(professor.roles[0] ?? "Adjunto");
      const existing = await ctx.db
        .query("professors")
        .withIndex("by_name", (q) => q.eq("name", normalizedName))
        .first();

      const subjectIds: any[] = [];
      for (const subjectExternalId of professor.subjectExternalIds) {
        const subject = await ctx.db
          .query("subjects")
          .withIndex("by_external", (q) => q.eq("externalId", subjectExternalId))
          .first();
        if (subject) subjectIds.push(subject._id);
      }

      const cathedraIds: any[] = [];
      for (const cathedraExternalId of professor.cathedraExternalIds) {
        const cathedra = await ctx.db
          .query("cathedras")
          .withIndex("by_external", (q) => q.eq("externalId", cathedraExternalId))
          .first();
        if (cathedra) cathedraIds.push(cathedra._id);
      }

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: normalizedName,
          roles: [primaryRole],
          subjectIds,
          cathedraIds,
          subjectExternalIds: professor.subjectExternalIds,
          cathedraExternalIds: professor.cathedraExternalIds,
          updatedAt: now(),
        });
        continue;
      }

      await ctx.db.insert("professors", {
        name: normalizedName,
        roles: [primaryRole],
        subjectIds,
        cathedraIds,
        subjectExternalIds: professor.subjectExternalIds,
        cathedraExternalIds: professor.cathedraExternalIds,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    return { ok: true };
  },
});

export const ensureProfessorsFromCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const commissions = await ctx.db.query("commissions").collect();
    const subjects = await ctx.db.query("subjects").collect();
    const cathedras = await ctx.db.query("cathedras").collect();
    const professors = await ctx.db.query("professors").collect();
    const subjectExternalById = new Map(subjects.map((subject) => [String(subject._id), subject.externalId]));
    const cathedraExternalById = new Map(cathedras.map((cathedra) => [String(cathedra._id), cathedra.externalId]));
    const existingByKey = new Map(professors.map((professor) => [normalizeProfessorKey(professor.name), professor]));
    const byName = new Map<
      string,
      {
        displayName: string;
        role: "Titular" | "Adjunto";
        subjectIds: Set<string>;
        cathedraIds: Set<string>;
      }
    >();

    for (const commission of commissions) {
      const names = commission.professor
        .split("/")
        .map((part) => normalizeProfessorName(part))
        .filter(Boolean);

      for (const [index, name] of names.entries()) {
        const key = normalizeProfessorKey(name);
        const inferredRole: "Titular" | "Adjunto" = index === 0 ? "Titular" : "Adjunto";
        const current = byName.get(key) ?? {
          displayName: name,
          role: inferredRole,
          subjectIds: new Set<string>(),
          cathedraIds: new Set<string>(),
        };
        if (inferredRole === "Titular") current.role = "Titular";
        current.subjectIds.add(String(commission.subjectId));
        current.cathedraIds.add(String(commission.cathedraId));
        byName.set(key, current);
      }
    }

    for (const [key, data] of byName.entries()) {
      const existing = existingByKey.get(key);

      const subjectIds = Array.from(data.subjectIds).map((id) => id as any);
      const cathedraIds = Array.from(data.cathedraIds).map((id) => id as any);

      const subjectExternalIds = Array.from(data.subjectIds)
        .map((id) => subjectExternalById.get(id))
        .filter((id): id is string => Boolean(id));
      const cathedraExternalIds = Array.from(data.cathedraIds)
        .map((id) => cathedraExternalById.get(id))
        .filter((id): id is string => Boolean(id));

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: data.displayName,
          roles: [data.role],
          subjectIds,
          cathedraIds,
          subjectExternalIds,
          cathedraExternalIds,
          updatedAt: now(),
        });
      } else {
        await ctx.db.insert("professors", {
          name: data.displayName,
          roles: [data.role],
          subjectIds,
          cathedraIds,
          subjectExternalIds,
          cathedraExternalIds,
          createdAt: now(),
          updatedAt: now(),
        });
      }
    }

    return { ok: true, count: byName.size };
  },
});

export const castVote = mutation({
  args: {
    winnerProfessorId: v.id("professors"),
    loserProfessorId: v.id("professors"),
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const voterUserId = await requireAuth(ctx);
    if (args.winnerProfessorId === args.loserProfessorId) throw new Error("Invalid vote pair.");

    const hash = pairHash(String(args.winnerProfessorId), String(args.loserProfessorId));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const userVotes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterUserId", voterUserId))
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
      voterUserId,
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
    return { ok: true };
  },
});
