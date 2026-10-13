import type { Account, Budget, Category, Expense, PaymentMethod, RecurringExpense } from './types';
import { PAYMENT_METHODS } from './types';
import {
  addPeriods,
  isDateInPeriod,
  periodBounds,
  previousPeriodKey,
  toDateStr
} from './period';

function active(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => !e.deleted);
}

export function expensesInPeriod(expenses: Expense[], periodKey: string, monthStartDay: number): Expense[] {
  return active(expenses).filter((e) => isDateInPeriod(e.date, periodKey, monthStartDay));
}

export function totalOf(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export interface PeriodComparison {
  current: number;
  previous: number;
  diff: number;
  pct: number; // porcentaje de cambio respecto al mes anterior
}

export function compareWithPreviousPeriod(
  expenses: Expense[],
  periodKey: string,
  monthStartDay: number
): PeriodComparison {
  const current = totalOf(expensesInPeriod(expenses, periodKey, monthStartDay));
  const previous = totalOf(expensesInPeriod(expenses, previousPeriodKey(periodKey), monthStartDay));
  const diff = current - previous;
  const pct = previous === 0 ? (current === 0 ? 0 : 100) : (diff / previous) * 100;
  return { current, previous, diff, pct };
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
  pct: number;
}

export function totalsByCategory(
  expenses: Expense[],
  periodKey: string,
  monthStartDay: number
): CategoryTotal[] {
  const periodExpenses = expensesInPeriod(expenses, periodKey, monthStartDay);
  const total = totalOf(periodExpenses);
  const map = new Map<string, number>();
  for (const e of periodExpenses) {
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({ categoryId, total: amount, pct: total === 0 ? 0 : (amount / total) * 100 }))
    .sort((a, b) => b.total - a.total);
}

export interface TrendPoint {
  periodKey: string;
  total: number;
}

export function trend(expenses: Expense[], monthStartDay: number, referencePeriodKey: string, months = 12): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = addPeriods(referencePeriodKey, -i);
    points.push({ periodKey: key, total: totalOf(expensesInPeriod(expenses, key, monthStartDay)) });
  }
  return points;
}

export function topExpenses(expenses: Expense[], periodKey: string, monthStartDay: number, n = 10): Expense[] {
  return [...expensesInPeriod(expenses, periodKey, monthStartDay)].sort((a, b) => b.amount - a.amount).slice(0, n);
}

export interface GroupTotal<K extends string = string> {
  key: K;
  total: number;
  pct: number;
}

export function totalsByAccount(expenses: Expense[], periodKey: string, monthStartDay: number): GroupTotal[] {
  const periodExpenses = expensesInPeriod(expenses, periodKey, monthStartDay);
  const total = totalOf(periodExpenses);
  const map = new Map<string, number>();
  for (const e of periodExpenses) map.set(e.account, (map.get(e.account) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([key, amount]) => ({ key, total: amount, pct: total === 0 ? 0 : (amount / total) * 100 }))
    .sort((a, b) => b.total - a.total);
}

export function totalsByPaymentMethod(
  expenses: Expense[],
  periodKey: string,
  monthStartDay: number
): GroupTotal<PaymentMethod>[] {
  const periodExpenses = expensesInPeriod(expenses, periodKey, monthStartDay);
  const total = totalOf(periodExpenses);
  const map = new Map<PaymentMethod, number>();
  for (const pm of PAYMENT_METHODS) map.set(pm.id, 0);
  for (const e of periodExpenses) map.set(e.paymentMethod, (map.get(e.paymentMethod) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([key, amount]) => ({ key, total: amount, pct: total === 0 ? 0 : (amount / total) * 100 }))
    .sort((a, b) => b.total - a.total);
}

export interface DailyProjection {
  daysElapsed: number;
  daysTotal: number;
  dailyAverage: number;
  projection: number;
}

export function dailyAverageAndProjection(
  expenses: Expense[],
  periodKey: string,
  monthStartDay: number,
  now: Date = new Date()
): DailyProjection {
  const { start, end } = periodBounds(periodKey, monthStartDay);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));
  const clampedNow = now < start ? start : now > end ? end : now;
  // +1 porque el dia de hoy cuenta como transcurrido (dia 1 = el dia que empieza el periodo).
  const daysElapsed = Math.max(1, Math.min(daysTotal, Math.floor((clampedNow.getTime() - start.getTime()) / msPerDay) + 1));
  const total = totalOf(expensesInPeriod(expenses, periodKey, monthStartDay));
  const dailyAverage = total / daysElapsed;
  const projection = dailyAverage * daysTotal;
  return { daysElapsed, daysTotal, dailyAverage, projection };
}

export interface BudgetProgress {
  categoryId: string;
  budget: number;
  spent: number;
  pct: number;
  level: 'ok' | 'warning' | 'over';
}

export function budgetProgress(
  expenses: Expense[],
  budgets: Budget[],
  periodKey: string,
  monthStartDay: number
): BudgetProgress[] {
  const byCategory = new Map(totalsByCategory(expenses, periodKey, monthStartDay).map((c) => [c.categoryId, c.total]));
  return budgets
    .filter((b) => !b.deleted && b.amount > 0)
    .map((b) => {
      const spent = byCategory.get(b.categoryId) ?? 0;
      const pct = b.amount === 0 ? 0 : (spent / b.amount) * 100;
      const level: BudgetProgress['level'] = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok';
      return { categoryId: b.categoryId, budget: b.amount, spent, pct, level };
    })
    .sort((a, b) => b.pct - a.pct);
}

export interface LeakGroup {
  signature: string;
  label: string;
  categoryId: string;
  count: number;
  total: number;
  average: number;
}

/**
 * Detecta "fugas": gastos pequenos que se repiten (misma nota o categoria) en los
 * ultimos `lookbackMonths` periodos, y que suman mas de `minTotal`.
 */
export function detectRepeatedSmallLeaks(
  expenses: Expense[],
  categories: Category[],
  referencePeriodKey: string,
  monthStartDay: number,
  opts: { lookbackMonths?: number; minOccurrences?: number; minTotal?: number; maxAverage?: number } = {}
): LeakGroup[] {
  const lookbackMonths = opts.lookbackMonths ?? 3;
  const minOccurrences = opts.minOccurrences ?? 3;
  const minTotal = opts.minTotal ?? 30000;
  const maxAverage = opts.maxAverage ?? 100000;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const relevant = active(expenses).filter((e) => {
    for (let i = 0; i < lookbackMonths; i++) {
      if (isDateInPeriod(e.date, addPeriods(referencePeriodKey, -i), monthStartDay)) return true;
    }
    return false;
  });

  const groups = new Map<string, { label: string; categoryId: string; count: number; total: number }>();
  for (const e of relevant) {
    const noteKey = e.note.trim().toLowerCase();
    const signature = noteKey ? `note:${noteKey}` : `cat:${e.categoryId}`;
    const label = noteKey ? e.note.trim() : categoryName.get(e.categoryId) ?? 'Otras';
    const existing = groups.get(signature);
    if (existing) {
      existing.count += 1;
      existing.total += e.amount;
    } else {
      groups.set(signature, { label, categoryId: e.categoryId, count: 1, total: e.amount });
    }
  }

  return [...groups.entries()]
    .map(([signature, g]) => ({ signature, ...g, average: g.total / g.count }))
    .filter((g) => g.count >= minOccurrences && g.total >= minTotal && g.average <= maxAverage)
    .sort((a, b) => b.total - a.total);
}

export function subscriptionsTotal(
  expenses: Expense[],
  recurringList: RecurringExpense[],
  periodKey: string,
  monthStartDay: number,
  subscriptionsCategoryId = 'cat-suscripciones'
): { fromCategory: number; fromActiveRecurring: number } {
  const fromCategory = totalOf(
    expensesInPeriod(expenses, periodKey, monthStartDay).filter((e) => e.categoryId === subscriptionsCategoryId)
  );
  const fromActiveRecurring = recurringList
    .filter((r) => !r.deleted && r.active && r.categoryId === subscriptionsCategoryId)
    .reduce((sum, r) => sum + (r.frequency === 'mensual' ? r.amount : r.frequency === 'anual' ? r.amount / 12 : r.amount * 4.33), 0);
  return { fromCategory, fromActiveRecurring };
}

export function accountName(accounts: Account[], id: string): string {
  return accounts.find((a) => a.id === id)?.name ?? id;
}

export const _internals = { toDateStr };
