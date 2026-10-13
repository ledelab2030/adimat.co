import { describe, expect, it } from 'vitest';
import { addPeriods, periodBounds, periodKeyForDate, previousPeriodKey } from './period';

describe('periodKeyForDate', () => {
  it('usa el mes calendario cuando el dia de inicio es 1', () => {
    expect(periodKeyForDate('2026-03-15', 1)).toBe('2026-03');
    expect(periodKeyForDate('2026-03-01', 1)).toBe('2026-03');
    expect(periodKeyForDate('2026-03-31', 1)).toBe('2026-03');
  });

  it('desplaza al periodo anterior si el dia aun no llega al inicio configurado', () => {
    expect(periodKeyForDate('2026-03-27', 28)).toBe('2026-02');
    expect(periodKeyForDate('2026-03-28', 28)).toBe('2026-03');
    expect(periodKeyForDate('2026-04-10', 28)).toBe('2026-03');
  });

  it('cruza el limite de ano correctamente', () => {
    expect(periodKeyForDate('2026-01-05', 15)).toBe('2025-12');
    expect(periodKeyForDate('2026-01-20', 15)).toBe('2026-01');
  });
});

describe('periodBounds', () => {
  it('calcula el rango [inicio, fin) para un periodo con dia de inicio 28', () => {
    const { start, end } = periodBounds('2026-03', 28);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(28);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(28);
  });
});

describe('previousPeriodKey / addPeriods', () => {
  it('retrocede un mes, incluso cruzando de ano', () => {
    expect(previousPeriodKey('2026-01')).toBe('2025-12');
    expect(previousPeriodKey('2026-06')).toBe('2026-05');
  });

  it('suma y resta N periodos', () => {
    expect(addPeriods('2026-01', 2)).toBe('2026-03');
    expect(addPeriods('2026-01', -2)).toBe('2025-11');
    expect(addPeriods('2026-01', 0)).toBe('2026-01');
  });
});
