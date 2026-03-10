import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { now } from "./utils";
import { CATEDRAS_INGRESANTES, COMISIONES_INGRESANTES, MATERIAS_INGRESANTES } from "../src/data/ingresantes2026";

const syncCatalogData = async (
  ctx: any,
  args: {
    subjects: Array<{ externalId: string; code: string; name: string; year: number }>;
    cathedras: Array<{ externalId: string; subjectExternalId: string; name: string }>;
    commissions: Array<{
      externalId: string;
      subjectExternalId: string;
      cathedraExternalId: string;
      number: number;
      professor: string;
      seatsTotal: number;
      seatsAvailable: number;
      schedules: Array<{ day: string; start: string; end: string }>;
    }>;
  },
) => {
  const subjectByExternal = new Map<string, string>();
  for (const subject of args.subjects) {
    const existing = await ctx.db
      .query("subjects")
        .withIndex("by_external", (q: any) => q.eq("externalId", subject.externalId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        code: subject.code,
        name: subject.name,
        year: subject.year,
        active: true,
        updatedAt: now(),
      });
      subjectByExternal.set(subject.externalId, String(existing._id));
      continue;
    }
    const id = await ctx.db.insert("subjects", {
      externalId: subject.externalId,
      code: subject.code,
      name: subject.name,
      year: subject.year,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    });
    subjectByExternal.set(subject.externalId, String(id));
  }

  const cathedraByExternal = new Map<string, string>();
  for (const cathedra of args.cathedras) {
    const subjectId = subjectByExternal.get(cathedra.subjectExternalId);
    if (!subjectId) continue;
    const existing = await ctx.db
      .query("cathedras")
      .withIndex("by_external", (q: any) => q.eq("externalId", cathedra.externalId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        subjectId: subjectId as any,
        name: cathedra.name,
        updatedAt: now(),
      });
      cathedraByExternal.set(cathedra.externalId, String(existing._id));
      continue;
    }
    const id = await ctx.db.insert("cathedras", {
      externalId: cathedra.externalId,
      subjectId: subjectId as any,
      name: cathedra.name,
      createdAt: now(),
      updatedAt: now(),
    });
    cathedraByExternal.set(cathedra.externalId, String(id));
  }

  for (const commission of args.commissions) {
    const subjectId = subjectByExternal.get(commission.subjectExternalId);
    const cathedraId = cathedraByExternal.get(commission.cathedraExternalId);
    if (!subjectId || !cathedraId) continue;

    const existing = await ctx.db
      .query("commissions")
      .withIndex("by_external", (q: any) => q.eq("externalId", commission.externalId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        number: commission.number,
        professor: commission.professor,
        seatsTotal: commission.seatsTotal,
        seatsAvailable: commission.seatsAvailable,
        schedules: commission.schedules,
        updatedAt: now(),
      });
      continue;
    }

    await ctx.db.insert("commissions", {
      externalId: commission.externalId,
      subjectId: subjectId as any,
      cathedraId: cathedraId as any,
      number: commission.number,
      professor: commission.professor,
      seatsTotal: commission.seatsTotal,
      seatsAvailable: commission.seatsAvailable,
      schedules: commission.schedules,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  return { ok: true };
};

export const listSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

export const listCatalog = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    const cathedras = await ctx.db.query("cathedras").collect();
    const commissions = await ctx.db.query("commissions").collect();

    return {
      subjects: subjects.map((subject) => ({
        id: String(subject._id),
        externalId: subject.externalId,
        code: subject.code,
        name: subject.name,
        year: subject.year,
      })),
      cathedras: cathedras.map((cathedra) => ({
        id: String(cathedra._id),
        externalId: cathedra.externalId,
        subjectId: String(cathedra.subjectId),
        name: cathedra.name,
      })),
      commissions: commissions.map((commission) => ({
        id: String(commission._id),
        externalId: commission.externalId,
        subjectId: String(commission.subjectId),
        cathedraId: String(commission.cathedraId),
        number: commission.number,
        professor: commission.professor,
        schedules: commission.schedules,
        seatsTotal: commission.seatsTotal,
        seatsAvailable: commission.seatsAvailable,
      })),
    };
  },
});

export const syncCatalog = mutation({
  args: {
    subjects: v.array(
      v.object({
        externalId: v.string(),
        code: v.string(),
        name: v.string(),
        year: v.number(),
      }),
    ),
    cathedras: v.array(
      v.object({
        externalId: v.string(),
        subjectExternalId: v.string(),
        name: v.string(),
      }),
    ),
    commissions: v.array(
      v.object({
        externalId: v.string(),
        subjectExternalId: v.string(),
        cathedraExternalId: v.string(),
        number: v.number(),
        professor: v.string(),
        seatsTotal: v.number(),
        seatsAvailable: v.number(),
        schedules: v.array(
          v.object({
            day: v.string(),
            start: v.string(),
            end: v.string(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => syncCatalogData(ctx, args),
});

export const seedCatalogFromIngresantes = mutation({
  args: {},
  handler: async (ctx) => {
    return await syncCatalogData(ctx, {
      subjects: MATERIAS_INGRESANTES.map((subject) => ({
        externalId: subject.id,
        code: subject.id.toUpperCase(),
        name: subject.nombre,
        year: subject.anio,
      })),
      cathedras: CATEDRAS_INGRESANTES.map((cathedra) => ({
        externalId: cathedra.id,
        subjectExternalId: cathedra.materiaId,
        name: cathedra.nombre,
      })),
      commissions: COMISIONES_INGRESANTES.map((commission) => ({
        externalId: commission.id,
        subjectExternalId: commission.materiaId,
        cathedraExternalId: commission.catedraId,
        number: commission.numero,
        professor: commission.profesor,
        seatsTotal: commission.cuposTotales,
        seatsAvailable: commission.cuposDisponibles,
        schedules: commission.horarios.map((schedule) => ({
          day: schedule.dia,
          start: schedule.inicio,
          end: schedule.fin,
        })),
      })),
    });
  },
});

export const listCommissionsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commissions")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

export const getCatalogIdsByExternal = query({
  args: {
    subjectExternalId: v.string(),
    commissionExternalIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_external", (q) => q.eq("externalId", args.subjectExternalId))
      .first();

    const commissions = [] as Array<{ externalId: string; id: string }>;
    for (const externalId of args.commissionExternalIds) {
      const commission = await ctx.db
        .query("commissions")
        .withIndex("by_external", (q) => q.eq("externalId", externalId))
        .first();
      if (commission) {
        commissions.push({ externalId, id: String(commission._id) });
      }
    }

    return {
      subjectId: subject ? String(subject._id) : null,
      commissions,
    };
  },
});

export const listEnrollmentsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const result: Array<{
      enrollmentId: string;
      materiaId: string;
      catedraId: string;
      comisionId: string;
    }> = [];

    for (const enrollment of enrollments) {
      const subject = await ctx.db.get(enrollment.subjectId);
      const cathedra = await ctx.db.get(enrollment.cathedraId);
      const commission = await ctx.db.get(enrollment.commissionId);
      if (!subject || !cathedra || !commission) continue;
      result.push({
        enrollmentId: String(enrollment._id),
        materiaId: subject.externalId,
        catedraId: cathedra.externalId,
        comisionId: commission.externalId,
      });
    }

    return result;
  },
});

export const addEnrollment = mutation({
  args: {
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    cathedraId: v.id("cathedras"),
    commissionId: v.id("commissions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_user_subject", (q) => q.eq("userId", args.userId).eq("subjectId", args.subjectId))
      .first();
    if (existing) throw new Error("Already enrolled in this subject.");

    const commission = await ctx.db.get(args.commissionId);
    if (!commission) throw new Error("Commission not found.");

    const enrollmentId = await ctx.db.insert("enrollments", {
      ...args,
      createdAt: now(),
      updatedAt: now(),
    });

    await ctx.db.patch(args.commissionId, {
      seatsAvailable: Math.max(0, commission.seatsAvailable - 1),
      updatedAt: now(),
    });

    return enrollmentId;
  },
});

export const addEnrollmentByExternal = mutation({
  args: {
    userId: v.id("users"),
    subjectExternalId: v.string(),
    cathedraExternalId: v.string(),
    commissionExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_external", (q) => q.eq("externalId", args.subjectExternalId))
      .first();
    const cathedra = await ctx.db
      .query("cathedras")
      .withIndex("by_external", (q) => q.eq("externalId", args.cathedraExternalId))
      .first();
    const commission = await ctx.db
      .query("commissions")
      .withIndex("by_external", (q) => q.eq("externalId", args.commissionExternalId))
      .first();

    if (!subject || !cathedra || !commission) {
      throw new Error("Catalog data not found in Convex.");
    }

    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_user_subject", (q) => q.eq("userId", args.userId).eq("subjectId", subject._id))
      .first();
    if (existing) throw new Error("Already enrolled in this subject.");

    const enrollmentId = await ctx.db.insert("enrollments", {
      userId: args.userId,
      subjectId: subject._id,
      cathedraId: cathedra._id,
      commissionId: commission._id,
      createdAt: now(),
      updatedAt: now(),
    });

    await ctx.db.patch(commission._id, {
      seatsAvailable: Math.max(0, commission.seatsAvailable - 1),
      updatedAt: now(),
    });

    return enrollmentId;
  },
});

export const removeEnrollment = mutation({
  args: { enrollmentId: v.id("enrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) return;
    await ctx.db.delete(args.enrollmentId);

    const commission = await ctx.db.get(enrollment.commissionId);
    if (commission) {
      await ctx.db.patch(commission._id, {
        seatsAvailable: Math.min(commission.seatsTotal, commission.seatsAvailable + 1),
        updatedAt: now(),
      });
    }
  },
});

export const removeEnrollmentByExternal = mutation({
  args: {
    userId: v.id("users"),
    subjectExternalId: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_external", (q) => q.eq("externalId", args.subjectExternalId))
      .first();
    if (!subject) return;

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_subject", (q) => q.eq("userId", args.userId).eq("subjectId", subject._id))
      .first();
    if (!enrollment) return;

    await ctx.db.delete(enrollment._id);

    const commission = await ctx.db.get(enrollment.commissionId);
    if (commission) {
      await ctx.db.patch(commission._id, {
        seatsAvailable: Math.min(commission.seatsTotal, commission.seatsAvailable + 1),
        updatedAt: now(),
      });
    }
  },
});
