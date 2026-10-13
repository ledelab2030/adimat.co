import { describe, expect, it } from 'vitest';
import {
  budgetProgress,
  compareWithPreviousPeriod,
  dailyAverageAndProjection,
  detectRepeatedSmallLeaks,
  topExpenses,
  totalOf,
  totalsByAccount,
  totalsByCategory,
  totalsByPaymentMethod,
  trend
} from './calculations';
import type { Budget, Category, Expense } from './types';

let counter = 0;
function expense(partial: Partial<Expense>): Expense {
  counter++;
  return {
    id: `e${counter}`,
    amount: 10000,
    categoryId: 'cat-mercado',
    date: '2026-03-10',
    note: '',
    paymentMethod: 'efectivo',
    account: 'acc-personal',
    createdAt: counter,
    updatedAt: counter,
    deleted: false,
    ...partial
  };
}

const categories: Category[] = [
  { id: 'cat-mercado', name: 'Mercado', icon: '🛒', color: '#000', order: 0, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-ocio', name: 'Ocio', icon: '🎮', color: '#111', order: 1, hidden: false, updatedAt: 0, deleted: false }
];

describe('totalOf', () => {
  it('suma los montos', () => {
    expect(totalOf([expense({ amount: 1000 }), expense({ amount: 2000 })])).toBe(3000);
  });
});

describe('compareWithPreviousPeriod', () => {
  it('calcula diferencia y porcentaje respecto al mes anterior', () => {
    const expenses = [
      expense({ date: '2026-03-05', amount: 100000 }),
      expense({ date: '2026-02-05', amount: 50000 })
    ];
    const cmp = compareWithPreviousPeriod(expenses, '2026-03', 1);
    expect(cmp.current).toBe(100000);
    expect(cmp.previous).toBe(50000);
    expect(cmp.diff).toBe(50000);
    expect(cmp.pct).toBe(100);
  });

  it('da 0% cuando ambos periodos estan vacios', () => {
    const cmp = compareWithPreviousPeriod([], '2026-03', 1);
    expect(cmp.pct).toBe(0);
  });

  it('ignora los gastos eliminados (borrado logico)', () => {
    const expenses = [expense({ date: '2026-03-05', amount: 999999, deleted: true })];
    const cmp = compareWithPreviousPeriod(expenses, '2026-03', 1);
    expect(cmp.current).toBe(0);
  });
});

describe('totalsByCategory', () => {
  it('agrupa por categoria y calcula el porcentaje del total', () => {
    const expenses = [
      expense({ categoryId: 'cat-mercado', amount: 60000, date: '2026-03-01' }),
      expense({ categoryId: 'cat-ocio', amount: 40000, date: '2026-03-02' })
    ];
    const totals = totalsByCategory(expenses, '2026-03', 1);
    expect(totals[0]).toMatchObject({ categoryId: 'cat-mercado', total: 60000, pct: 60 });
    expect(totals[1]).toMatchObject({ categoryId: 'cat-ocio', total: 40000, pct: 40 });
  });
});

describe('totalsByAccount / totalsByPaymentMethod', () => {
  it('agrupa por cuenta', () => {
    const expenses = [
      expense({ account: 'acc-personal', amount: 10000, date: '2026-03-01' }),
      expense({ account: 'acc-ledelab', amount: 30000, date: '2026-03-02' })
    ];
    const byAccount = totalsByAccount(expenses, '2026-03', 1);
    expect(byAccount.find((a) => a.key === 'acc-ledelab')?.total).toBe(30000);
  });

  it('agrupa por medio de pago incluyendo los que estan en cero', () => {
    const expenses = [expense({ paymentMethod: 'credito', amount: 20000, date: '2026-03-01' })];
    const byMethod = totalsByPaymentMethod(expenses, '2026-03', 1);
    expect(byMethod.find((m) => m.key === 'credito')?.total).toBe(20000);
    expect(byMethod.find((m) => m.key === 'efectivo')?.total).toBe(0);
  });
});

describe('trend', () => {
  it('devuelve N periodos terminando en el periodo de referencia', () => {
    const expenses = [expense({ date: '2026-03-01', amount: 5000 })];
    const points = trend(expenses, 1, '2026-03', 3);
    expect(points.map((p) => p.periodKey)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(points[2].total).toBe(5000);
    expect(points[0].total).toBe(0);
  });
});

describe('topExpenses', () => {
  it('devuelve los N mas grandes ordenados descendente', () => {
    const expenses = [
      expense({ amount: 1000, date: '2026-03-01' }),
      expense({ amount: 50000, date: '2026-03-02' }),
      expense({ amount: 20000, date: '2026-03-03' })
    ];
    const top = topExpenses(expenses, '2026-03', 1, 2);
    expect(top.map((e) => e.amount)).toEqual([50000, 20000]);
  });
});

describe('dailyAverageAndProjection', () => {
  it('proyecta el cierre de mes a partir del promedio diario', () => {
    const now = new Date(2026, 2, 10); // 10 de marzo
    const expenses = [
      expense({ date: '2026-03-01', amount: 30000 }),
      expense({ date: '2026-03-05', amount: 60000 })
    ];
    const proj = dailyAverageAndProjection(expenses, '2026-03', 1, now);
    expect(proj.daysTotal).toBe(31);
    expect(proj.daysElapsed).toBe(10);
    expect(proj.dailyAverage).toBeCloseTo(90000 / 10);
    expect(proj.projection).toBeCloseTo((90000 / 10) * 31);
  });
});

describe('budgetProgress', () => {
  it('marca el nivel segun el porcentaje gastado', () => {
    const budgets: Budget[] = [
      { id: 'b1', categoryId: 'cat-mercado', amount: 100000, updatedAt: 0, deleted: false },
      { id: 'b2', categoryId: 'cat-ocio', amount: 100000, updatedAt: 0, deleted: false }
    ];
    const expenses = [
      expense({ categoryId: 'cat-mercado', amount: 85000, date: '2026-03-01' }),
      expense({ categoryId: 'cat-ocio', amount: 120000, date: '2026-03-01' })
    ];
    const progress = budgetProgress(expenses, budgets, '2026-03', 1);
    expect(progress.find((p) => p.categoryId === 'cat-mercado')?.level).toBe('warning');
    expect(progress.find((p) => p.categoryId === 'cat-ocio')?.level).toBe('over');
  });
});

describe('detectRepeatedSmallLeaks', () => {
  it('agrupa gastos pequenos repetidos por nota', () => {
    const expenses = Array.from({ length: 5 }, (_, i) =>
      expense({ note: 'Cafe', amount: 8000, date: `2026-03-0${i + 1}` })
    );
    const leaks = detectRepeatedSmallLeaks(expenses, categories, '2026-03', 1, { minOccurrences: 3, minTotal: 10000 });
    expect(leaks[0]).toMatchObject({ label: 'Cafe', count: 5, total: 40000 });
  });

  it('no marca como fuga un gasto grande aislado', () => {
    const expenses = [expense({ note: 'Carro nuevo', amount: 5000000, date: '2026-03-01' })];
    const leaks = detectRepeatedSmallLeaks(expenses, categories, '2026-03', 1);
    expect(leaks).toHaveLength(0);
  });
});
