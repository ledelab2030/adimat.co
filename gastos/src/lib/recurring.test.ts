import { describe, expect, it } from 'vitest';
import { getDueOccurrences, lastOccurrenceDate } from './recurring';
import type { RecurringExpense } from './types';

function makeRec(partial: Partial<RecurringExpense>): RecurringExpense {
  return {
    id: 'r1',
    amount: 29900,
    categoryId: 'cat-suscripciones',
    note: 'Netflix',
    paymentMethod: 'debito',
    account: 'acc-personal',
    frequency: 'mensual',
    anchorDay: 15,
    startDate: '2026-01-01',
    active: true,
    updatedAt: 0,
    deleted: false,
    ...partial
  };
}

describe('lastOccurrenceDate - mensual', () => {
  it('usa el dia de este mes si ya paso', () => {
    const rec = makeRec({ anchorDay: 15 });
    expect(lastOccurrenceDate(rec, new Date(2026, 2, 20))).toBe('2026-03-15');
  });

  it('retrocede al mes anterior si el dia de este mes aun no llega', () => {
    const rec = makeRec({ anchorDay: 28 });
    expect(lastOccurrenceDate(rec, new Date(2026, 2, 10))).toBe('2026-02-28');
  });

  it('retorna null si todavia no empieza (antes de startDate)', () => {
    const rec = makeRec({ anchorDay: 15, startDate: '2026-05-01' });
    expect(lastOccurrenceDate(rec, new Date(2026, 2, 20))).toBeNull();
  });
});

describe('lastOccurrenceDate - semanal', () => {
  it('encuentra el dia de la semana mas reciente', () => {
    const rec = makeRec({ frequency: 'semanal', anchorDay: 1 }); // lunes
    const ref = new Date(2026, 2, 20); // viernes 20 de marzo de 2026
    const result = lastOccurrenceDate(rec, ref);
    const resultDate = new Date(result + 'T00:00:00');
    expect(resultDate.getDay()).toBe(1);
    expect(resultDate.getTime()).toBeLessThanOrEqual(ref.getTime());
  });
});

describe('lastOccurrenceDate - anual', () => {
  it('usa el aniversario de este ano si ya paso, si no el del anterior', () => {
    const rec = makeRec({ frequency: 'anual', anchorMonth: 12, anchorDay: 25, startDate: '2020-01-01' });
    expect(lastOccurrenceDate(rec, new Date(2026, 2, 1))).toBe('2025-12-25');
    expect(lastOccurrenceDate(rec, new Date(2026, 11, 26))).toBe('2026-12-25');
  });
});

describe('getDueOccurrences', () => {
  it('propone una ocurrencia que no ha sido confirmada ni omitida', () => {
    const rec = makeRec({ anchorDay: 10 });
    const due = getDueOccurrences([rec], new Date(2026, 2, 20));
    expect(due).toHaveLength(1);
    expect(due[0].date).toBe('2026-03-10');
  });

  it('no propone si ya fue confirmada para ese ciclo', () => {
    const rec = makeRec({ anchorDay: 10, lastConfirmedDate: '2026-03-10' });
    const due = getDueOccurrences([rec], new Date(2026, 2, 20));
    expect(due).toHaveLength(0);
  });

  it('no propone si ya fue omitida para ese ciclo', () => {
    const rec = makeRec({ anchorDay: 10, lastSkippedDate: '2026-03-10' });
    const due = getDueOccurrences([rec], new Date(2026, 2, 20));
    expect(due).toHaveLength(0);
  });

  it('ignora recurrentes pausados o eliminados', () => {
    const paused = makeRec({ anchorDay: 10, active: false });
    const deleted = makeRec({ anchorDay: 10, deleted: true });
    expect(getDueOccurrences([paused, deleted], new Date(2026, 2, 20))).toHaveLength(0);
  });
});
