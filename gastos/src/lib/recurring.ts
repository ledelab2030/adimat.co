import type { RecurringExpense } from './types';
import { toDateStr } from './period';

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function clampedDate(year: number, monthIndex0: number, day: number): Date {
  const d = Math.min(Math.max(1, day), daysInMonth(year, monthIndex0));
  return new Date(year, monthIndex0, d);
}

/** Fecha de la ocurrencia mas reciente (<= ref) para un gasto recurrente, en formato YYYY-MM-DD. */
export function lastOccurrenceDate(rec: RecurringExpense, ref: Date = new Date()): string | null {
  const start = new Date(rec.startDate + 'T00:00:00');
  let candidate: Date;

  if (rec.frequency === 'mensual') {
    candidate = clampedDate(ref.getFullYear(), ref.getMonth(), rec.anchorDay);
    if (candidate > ref) {
      const m = ref.getMonth() - 1;
      const year = m < 0 ? ref.getFullYear() - 1 : ref.getFullYear();
      candidate = clampedDate(year, ((m % 12) + 12) % 12, rec.anchorDay);
    }
  } else if (rec.frequency === 'semanal') {
    const refDay = ref.getDay();
    const target = rec.anchorDay % 7;
    const diff = (refDay - target + 7) % 7;
    candidate = new Date(ref);
    candidate.setDate(ref.getDate() - diff);
  } else {
    const month0 = (rec.anchorMonth ?? 1) - 1;
    candidate = clampedDate(ref.getFullYear(), month0, rec.anchorDay);
    if (candidate > ref) {
      candidate = clampedDate(ref.getFullYear() - 1, month0, rec.anchorDay);
    }
  }

  if (candidate < start) return null;
  return toDateStr(candidate);
}

export interface DueOccurrence {
  recurring: RecurringExpense;
  date: string;
}

/** Devuelve los recurrentes activos cuya ocurrencia mas reciente aun no ha sido confirmada ni omitida. */
export function getDueOccurrences(list: RecurringExpense[], ref: Date = new Date()): DueOccurrence[] {
  const due: DueOccurrence[] = [];
  for (const rec of list) {
    if (rec.deleted || !rec.active) continue;
    const date = lastOccurrenceDate(rec, ref);
    if (!date) continue;
    if (rec.lastConfirmedDate === date || rec.lastSkippedDate === date) continue;
    due.push({ recurring: rec, date });
  }
  return due;
}
