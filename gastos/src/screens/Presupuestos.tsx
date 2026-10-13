import { useState } from 'preact/hooks';
import { activeExpenses, budgets as budgetsSignal, removeBudget, setBudget, settings, visibleCategories } from '../lib/store';
import { budgetProgress } from '../lib/calculations';
import { currentPeriodKey } from '../lib/period';
import { formatCOP, parseAmountInput } from '../lib/format';
import { Button, Card, IconBadge, Input, ProgressBar } from '../components/ui';

export function Presupuestos() {
  const cats = visibleCategories.value;
  const budgetsList = budgetsSignal.value.filter((b) => !b.deleted);
  const periodKey = currentPeriodKey(settings.value.monthStartDay);
  const progress = budgetProgress(activeExpenses.value, budgetsList, periodKey, settings.value.monthStartDay);
  const progressByCategory = new Map(progress.map((p) => [p.categoryId, p]));
  const budgetByCategory = new Map(budgetsList.map((b) => [b.categoryId, b]));

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Presupuestos mensuales</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Define un limite por categoria. Veras una alerta al pasar el 80% y el 100%.
      </p>
      <div className="space-y-3">
        {cats.map((c) => {
          const existing = budgetByCategory.get(c.id);
          const prog = progressByCategory.get(c.id);
          return (
            <BudgetRow key={c.id} categoryId={c.id} icon={c.icon} color={c.color} name={c.name} amount={existing?.amount ?? 0} spent={prog?.spent ?? 0} pct={prog?.pct ?? 0} level={prog?.level ?? 'ok'} />
          );
        })}
      </div>
    </div>
  );
}

function BudgetRow(props: {
  categoryId: string;
  icon: string;
  color: string;
  name: string;
  amount: number;
  spent: number;
  pct: number;
  level: 'ok' | 'warning' | 'over';
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(props.amount ? String(props.amount) : '');

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-3">
        <IconBadge icon={props.icon} color={props.color} />
        <span className="flex-1 font-medium">{props.name}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input inputMode="numeric" value={raw} onInput={(e) => setRaw((e.target as HTMLInputElement).value)} className="w-32 text-right" />
            <Button
              className="px-2"
              onClick={async () => {
                const amount = parseAmountInput(raw);
                if (amount > 0) await setBudget(props.categoryId, amount);
                else await removeBudget(props.categoryId);
                setEditing(false);
              }}
            >
              ✓
            </Button>
          </div>
        ) : (
          <button className="tap-target text-sm font-semibold text-brand-600" onClick={() => setEditing(true)}>
            {props.amount > 0 ? formatCOP(props.amount) : 'Definir'}
          </button>
        )}
      </div>
      {props.amount > 0 && (
        <>
          <ProgressBar pct={props.pct} level={props.level} />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{formatCOP(props.spent)} gastado</span>
            <span className={props.level === 'over' ? 'font-semibold text-red-600' : props.level === 'warning' ? 'font-semibold text-amber-600' : ''}>
              {props.pct.toFixed(0)}%
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
