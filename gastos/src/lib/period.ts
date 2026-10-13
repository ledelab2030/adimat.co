/** Utilidades de "periodo mensual" que respetan el dia de inicio de mes configurable. */

export interface PeriodBounds {
  /** Inclusivo */
  start: Date;
  /** Exclusivo */
  end: Date;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Devuelve la clave de periodo "YYYY-MM" a la que pertenece una fecha dada. */
export function periodKeyForDate(dateStr: string, monthStartDay: number): string {
  const d = parseDate(dateStr);
  let year = d.getFullYear();
  let month = d.getMonth(); // 0-based
  if (d.getDate() < monthStartDay) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function periodBounds(periodKey: string, monthStartDay: number): PeriodBounds {
  const [y, m] = periodKey.split('-').map(Number);
  const start = new Date(y, m - 1, monthStartDay);
  const end = new Date(y, m, monthStartDay);
  return { start, end };
}

export function previousPeriodKey(periodKey: string): string {
  const [y, m] = periodKey.split('-').map(Number);
  let year = y;
  let month = m - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addPeriods(periodKey: string, delta: number): string {
  const [y, m] = periodKey.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function currentPeriodKey(monthStartDay: number, reference: Date = new Date()): string {
  return periodKeyForDate(toDateStr(reference), monthStartDay);
}

export function isDateInPeriod(dateStr: string, periodKey: string, monthStartDay: number): boolean {
  const { start, end } = periodBounds(periodKey, monthStartDay);
  const d = parseDate(dateStr);
  return d >= start && d < end;
}

export function periodLabel(periodKey: string): string {
  const [y, m] = periodKey.split('-').map(Number);
  const names = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${names[m - 1]} ${y}`;
}

export function periodLabelShort(periodKey: string): string {
  const [y, m] = periodKey.split('-').map(Number);
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${names[m - 1]} ${String(y).slice(2)}`;
}
