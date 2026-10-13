import { useState } from 'preact/hooks';
import {
  accounts as accountsSignal,
  activeExpenses,
  activeRecurring,
  categories as categoriesSignal,
  settings
} from '../lib/store';
import {
  compareWithPreviousPeriod,
  dailyAverageAndProjection,
  detectRepeatedSmallLeaks,
  subscriptionsTotal,
  topExpenses,
  totalsByAccount,
  totalsByCategory,
  totalsByPaymentMethod,
  trend
} from '../lib/calculations';
import { currentPeriodKey, addPeriods, periodLabel, periodLabelShort } from '../lib/period';
import { formatCOP, formatDateHuman, formatPct } from '../lib/format';
import { PAYMENT_METHODS } from '../lib/types';
import { Button, BarRow, Card, EmptyState, IconBadge } from '../components/ui';

export function Panel() {
  const monthStartDay = settings.value.monthStartDay;
  const [periodKey, setPeriodKey] = useState(currentPeriodKey(monthStartDay));
  const cats = categoriesSignal.value;
  const accs = accountsSignal.value;
  const expenses = activeExpenses.value;

  const catById = new Map(cats.map((c) => [c.id, c]));
  const accById = new Map(accs.map((a) => [a.id, a]));

  const comparison = compareWithPreviousPeriod(expenses, periodKey, monthStartDay);
  const byCategory = totalsByCategory(expenses, periodKey, monthStartDay);
  const trend12 = trend(expenses, monthStartDay, periodKey, 12);
  const top10 = topExpenses(expenses, periodKey, monthStartDay, 10);
  const byAccount = totalsByAccount(expenses, periodKey, monthStartDay);
  const byPayment = totalsByPaymentMethod(expenses, periodKey, monthStartDay);
  const projection = dailyAverageAndProjection(expenses, periodKey, monthStartDay);
  const leaks = detectRepeatedSmallLeaks(expenses, cats, periodKey, monthStartDay);
  const subs = subscriptionsTotal(expenses, activeRecurring.value, periodKey, monthStartDay);

  const maxTrend = Math.max(1, ...trend12.map((t) => t.total));
  const isCurrent = periodKey === currentPeriodKey(monthStartDay);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-28 md:pb-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" aria-label="Mes anterior" onClick={() => setPeriodKey(addPeriods(periodKey, -1))}>
          ←
        </Button>
        <h1 className="text-lg font-bold capitalize">{periodLabel(periodKey)}</h1>
        <Button variant="ghost" aria-label="Mes siguiente" disabled={isCurrent} onClick={() => setPeriodKey(addPeriods(periodKey, 1))}>
          →
        </Button>
      </div>

      <Card className="space-y-1 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Total del periodo</p>
        <p className="text-4xl font-extrabold tabular-nums">{formatCOP(comparison.current)}</p>
        <p className={`text-sm font-medium ${comparison.diff > 0 ? 'text-red-600' : comparison.diff < 0 ? 'text-brand-600' : 'text-slate-500'}`}>
          {formatPct(comparison.pct)} vs. mes anterior ({formatCOP(Math.abs(comparison.diff))})
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Promedio diario</p>
          <p className="text-xl font-bold tabular-nums">{formatCOP(projection.dailyAverage)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Proyeccion de cierre</p>
          <p className="text-xl font-bold tabular-nums">{formatCOP(projection.projection)}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Gasto por categoria</h2>
        {byCategory.length === 0 && <EmptyState>Sin gastos en este periodo.</EmptyState>}
        {byCategory.map((c) => {
          const cat = catById.get(c.categoryId);
          return (
            <BarRow
              key={c.categoryId}
              label={`${cat?.icon ?? '📦'} ${cat?.name ?? 'Otras'}`}
              amount={`${formatCOP(c.total)} · ${c.pct.toFixed(0)}%`}
              pct={c.pct}
              color={cat?.color}
            />
          );
        })}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Tendencia · ultimos 12 meses</h2>
        <div className="flex h-32 gap-1.5" role="img" aria-label="Grafico de barras de gasto mensual">
          {trend12.map((t) => (
            <div key={t.periodKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t-md ${t.periodKey === periodKey ? 'bg-brand-600' : 'bg-brand-300 dark:bg-brand-800'}`}
                style={{ height: `${Math.max(4, (t.total / maxTrend) * 100)}%` }}
                title={`${periodLabel(t.periodKey)}: ${formatCOP(t.total)}`}
              />
              <span className="text-[9px] text-slate-500">{periodLabelShort(t.periodKey)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Los 10 gastos mas grandes</h2>
        {top10.length === 0 && <EmptyState>Sin gastos en este periodo.</EmptyState>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {top10.map((e) => {
            const cat = catById.get(e.categoryId);
            return (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <IconBadge icon={cat?.icon ?? '📦'} color={cat?.color ?? '#999'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.note || cat?.name}</p>
                  <p className="text-xs text-slate-500">{formatDateHuman(e.date)}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatCOP(e.amount)}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-semibold">Por cuenta</h2>
          {byAccount.map((a) => (
            <BarRow key={a.key} label={accById.get(a.key)?.name ?? a.key} amount={formatCOP(a.total)} pct={a.pct} />
          ))}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">Por medio de pago</h2>
          {byPayment.map((p) => (
            <BarRow key={p.key} label={PAYMENT_METHODS.find((m) => m.id === p.key)?.label ?? p.key} amount={formatCOP(p.total)} pct={p.pct} />
          ))}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Posibles fugas</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Suscripciones este periodo: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCOP(subs.fromCategory)}</span>
        </p>
        {leaks.length === 0 ? (
          <EmptyState>No se detectaron gastos pequenos repetidos.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {leaks.map((l) => (
              <li key={l.signature} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/40">
                <span>
                  {l.label} <span className="text-slate-500">× {l.count}</span>
                </span>
                <span className="font-semibold">{formatCOP(l.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
