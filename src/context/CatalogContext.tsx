import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from 'convex/react';
import type { Catedra, Comision, Materia } from '../types';
import { subjectsListCatalog } from '../convex/functions';

interface CatalogContextType {
  materias: Materia[];
  catedras: Catedra[];
  comisiones: Comision[];
  loading: boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const catalog = useQuery(subjectsListCatalog, {});

  const materias = useMemo<Materia[]>(() => {
    return (catalog?.subjects || []).map((subject) => ({
      id: subject.externalId,
      nombre: subject.name,
      anio: subject.year,
    }));
  }, [catalog?.subjects]);

  const subjectIdByExternal = useMemo(() => {
    const map = new Map<string, string>();
    for (const subject of catalog?.subjects || []) {
      map.set(subject.externalId, subject.id);
    }
    return map;
  }, [catalog?.subjects]);

  const externalBySubjectId = useMemo(() => {
    const map = new Map<string, string>();
    for (const subject of catalog?.subjects || []) {
      map.set(subject.id, subject.externalId);
    }
    return map;
  }, [catalog?.subjects]);

  const catedras = useMemo<Catedra[]>(() => {
    return (catalog?.cathedras || []).map((cathedra) => ({
      id: cathedra.externalId,
      materiaId: externalBySubjectId.get(cathedra.subjectId) || cathedra.subjectId,
      nombre: cathedra.name,
    }));
  }, [catalog?.cathedras, externalBySubjectId]);

  const cathedraIdByExternal = useMemo(() => {
    const map = new Map<string, string>();
    for (const cathedra of catalog?.cathedras || []) {
      map.set(cathedra.externalId, cathedra.id);
    }
    return map;
  }, [catalog?.cathedras]);

  const externalByCathedraId = useMemo(() => {
    const map = new Map<string, string>();
    for (const cathedra of catalog?.cathedras || []) {
      map.set(cathedra.id, cathedra.externalId);
    }
    return map;
  }, [catalog?.cathedras]);

  const comisiones = useMemo<Comision[]>(() => {
    return (catalog?.commissions || []).map((commission) => ({
      id: commission.externalId,
      numero: commission.number,
      catedraId: externalByCathedraId.get(commission.cathedraId) || commission.cathedraId,
      materiaId: externalBySubjectId.get(commission.subjectId) || commission.subjectId,
      profesor: commission.professor,
      horarios: commission.schedules.map((schedule) => ({
        dia: schedule.day as Comision['horarios'][number]['dia'],
        inicio: schedule.start,
        fin: schedule.end,
      })),
      cuposTotales: commission.seatsTotal,
      cuposDisponibles: commission.seatsAvailable,
    }));
  }, [catalog?.commissions, externalByCathedraId, externalBySubjectId]);

  // Keep maps computed/memoized for future derived lookups in this provider.
  void subjectIdByExternal;
  void cathedraIdByExternal;

  return (
    <CatalogContext.Provider value={{ materias, catedras, comisiones, loading: catalog === undefined }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
