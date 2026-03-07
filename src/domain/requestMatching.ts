import type { ExchangeRequest } from '../types';

const TERMINAL_STATUSES = new Set(['CONFIRMED', 'CANCELLED', 'COMPLETED']);

const getPreferenceRank = (request: ExchangeRequest, comisionId: string) => {
  const destination = request.comisionesDestino.find((d) => d.comisionId === comisionId);
  return destination?.prioridad ?? Number.POSITIVE_INFINITY;
};

export const recomputePendingMatches = (current: ExchangeRequest[]) => {
  const requestsById = new Map(current.map((request) => [request.id, { ...request }]));

  for (const request of requestsById.values()) {
    if (!TERMINAL_STATUSES.has(request.status)) {
      request.status = 'PENDING';
      request.matchedRequestId = undefined;
      request.finalizedBy = [];
    }
  }

  const pending = Array.from(requestsById.values()).filter((request) => request.status === 'PENDING');
  const candidates: Array<{ a: string; b: string; score: number }> = [];

  for (let i = 0; i < pending.length; i++) {
    for (let j = i + 1; j < pending.length; j++) {
      const a = pending[i];
      const b = pending[j];
      if (a.userId === b.userId || a.materiaId !== b.materiaId) continue;

      const aWantsB = getPreferenceRank(a, b.comisionOrigenId);
      const bWantsA = getPreferenceRank(b, a.comisionOrigenId);
      if (!Number.isFinite(aWantsB) || !Number.isFinite(bWantsA)) continue;

      candidates.push({ a: a.id, b: b.id, score: aWantsB + bWantsA });
    }
  }

  candidates.sort((x, y) => x.score - y.score);
  const used = new Set<string>();

  for (const candidate of candidates) {
    if (used.has(candidate.a) || used.has(candidate.b)) continue;
    const reqA = requestsById.get(candidate.a);
    const reqB = requestsById.get(candidate.b);
    if (!reqA || !reqB) continue;

    reqA.status = 'MATCHED';
    reqA.matchedRequestId = reqB.id;
    reqA.finalizedBy = [];

    reqB.status = 'MATCHED';
    reqB.matchedRequestId = reqA.id;
    reqB.finalizedBy = [];

    used.add(reqA.id);
    used.add(reqB.id);
  }

  return Array.from(requestsById.values());
};
