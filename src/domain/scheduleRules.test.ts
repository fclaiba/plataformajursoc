import { describe, expect, it } from 'vitest';
import { hasEnrollmentConflict, schedulesOverlap } from './scheduleRules';

describe('scheduleRules', () => {
  it('detects overlap on same day', () => {
    const current = [{ dia: 'Lunes', inicio: '10:00', fin: '12:00' }];
    const candidate = [{ dia: 'Lunes', inicio: '11:30', fin: '13:00' }];

    expect(schedulesOverlap(current, candidate)).toBe(true);
  });

  it('ignores schedules on different days', () => {
    const current = [{ dia: 'Lunes', inicio: '10:00', fin: '12:00' }];
    const candidate = [{ dia: 'Martes', inicio: '10:30', fin: '11:30' }];

    expect(schedulesOverlap(current, candidate)).toBe(false);
  });

  it('checks conflict against all enrolled schedules', () => {
    const existing = [
      [{ dia: 'Lunes', inicio: '08:00', fin: '10:00' }],
      [{ dia: 'Miercoles', inicio: '14:00', fin: '16:00' }],
    ];
    const candidate = [{ dia: 'Miercoles', inicio: '15:00', fin: '17:00' }];

    expect(hasEnrollmentConflict(existing, candidate)).toBe(true);
  });
});
