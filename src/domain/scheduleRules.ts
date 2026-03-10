type TimeSlot = { dia: string; inicio: string; fin: string };

export const toMinutes = (hourText: string) => {
  const [hours, minutes] = hourText.split(':').map(Number);
  return (hours * 60) + minutes;
};

export const schedulesOverlap = (a: TimeSlot[], b: TimeSlot[]) => {
  return a.some((slotA) => b.some((slotB) => {
    if (slotA.dia !== slotB.dia) return false;
    const aStart = toMinutes(slotA.inicio);
    const aEnd = toMinutes(slotA.fin);
    const bStart = toMinutes(slotB.inicio);
    const bEnd = toMinutes(slotB.fin);
    return aStart < bEnd && bStart < aEnd;
  }));
};

export const hasEnrollmentConflict = (
  existingCommissionSchedules: TimeSlot[][],
  candidateSchedule: TimeSlot[]
) => existingCommissionSchedules.some((schedule) => schedulesOverlap(schedule, candidateSchedule));
