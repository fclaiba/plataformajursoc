import { describe, expect, it } from 'vitest';
import type { ExchangeRequest } from '../types';
import { recomputePendingMatches } from './requestMatching';

const baseRequest = (overrides: Partial<ExchangeRequest>): ExchangeRequest => ({
  id: 'req-base',
  userId: 'user-base',
  materiaId: 'mat-1',
  comisionOrigenId: 'com-a',
  comisionesDestino: [{ comisionId: 'com-b', prioridad: 1 }],
  status: 'PENDING',
  createdAt: new Date(),
  ...overrides,
});

describe('requestMatching', () => {
  it('matches reciprocal requests', () => {
    const a = baseRequest({ id: 'a', userId: 'u1', comisionOrigenId: 'com-a', comisionesDestino: [{ comisionId: 'com-b', prioridad: 1 }] });
    const b = baseRequest({ id: 'b', userId: 'u2', comisionOrigenId: 'com-b', comisionesDestino: [{ comisionId: 'com-a', prioridad: 1 }] });

    const updated = recomputePendingMatches([a, b]);
    const updatedA = updated.find((request) => request.id === 'a');
    const updatedB = updated.find((request) => request.id === 'b');

    expect(updatedA?.status).toBe('MATCHED');
    expect(updatedB?.status).toBe('MATCHED');
    expect(updatedA?.matchedRequestId).toBe('b');
    expect(updatedB?.matchedRequestId).toBe('a');
  });

  it('keeps terminal statuses untouched', () => {
    const confirmed = baseRequest({ id: 'done', status: 'CONFIRMED', matchedRequestId: 'other', finalizedBy: ['u1', 'u2'] });
    const pending = baseRequest({ id: 'pending' });

    const updated = recomputePendingMatches([confirmed, pending]);
    const same = updated.find((request) => request.id === 'done');

    expect(same?.status).toBe('CONFIRMED');
    expect(same?.matchedRequestId).toBe('other');
  });
});
