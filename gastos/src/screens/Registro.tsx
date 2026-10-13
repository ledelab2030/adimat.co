import { useMemo, useState } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import {
  addExpense,
  confirmRecurringOccurrence,
  recurring as recurringSignal,
  skipRecurringOccurrence,
  visibleAccounts,
  visibleCategories
} from '../lib/store';
import { getDueOccurrences } from '../lib/recurring';
import { formatCOP, formatDateHuman, parseAmountInput } from '../lib/format';
import { todayStr } from '../lib/period';
import { PAYMENT_METHODS, type PaymentMethod } from '../lib/types';
import { Button, Card, IconBadge, Input } from '../components/ui';

export function Registro() {
  const cats = visibleCategories.value;
  const accs = visibleAccounts.value;
  const dueList = useComputed(() => getDueOccurrences(recurringSignal.value));

  const [amountRaw, setAmountRaw] = useState('');
  const [categoryId, setCategoryId] = useState(cats[0]?.id ?? '');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('efectivo');
  const [account, setAccount] = useState(accs[0]?.id ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  const amount = useMemo(() => parseAmountInput(amountRaw), [amountRaw]);
  const canSave = amount > 0 && categoryId && account;

  async function handleSave(e: Event) {
    e.preventDefault();
    if (!canSave) return;
    await addExpense({ amount, categoryId, date, note, paymentMethod: payment, account });
    setAmountRaw('');
    setNote('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      {dueList.value.length > 0 && (
        <Card className="space-y-3 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Tienes {dueList.value.length} gasto{dueList.value.length > 1 ? 's' : ''} recurrente{dueList.value.length > 1 ? 's' : ''} por confirmar
          </p>
          {dueList.value.map(({ recurring: rec, date: occDate }) => (
            <div key={rec.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/70 p-2 dark:bg-slate-900/50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{rec.note || 'Gasto recurrente'}</p>
                <p className="text-xs text-slate-500">{formatCOP(rec.amount)} · {formatDateHuman(occDate)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button variant="ghost" className="px-2 text-xs" onClick={() => skipRecurringOccurrence(rec.id, occDate)}>
                  Omitir
                </Button>
                <Button className="px-2 text-xs" onClick={() => confirmRecurringOccurrence(rec.id, occDate)}>
                  Confirmar
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Monto</span>
            <input
              inputMode="numeric"
              autoFocus
              placeholder="$ 0"
              value={amountRaw ? formatCOP(amount) : ''}
              onInput={(e) => setAmountRaw((e.target as HTMLInputElement).value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-3xl font-bold tabular-nums focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</span>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {cats.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`tap-target flex flex-col items-center gap-1 rounded-xl p-2 text-center transition ${
                    categoryId === c.id ? 'bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-pressed={categoryId === c.id}
                >
                  <IconBadge icon={c.icon} color={c.color} />
                  <span className="line-clamp-1 text-[11px] leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <Input label="Fecha" type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} max={todayStr()} />
          <Input label="Nota (opcional)" type="text" placeholder="Ej: Almuerzo con el equipo" value={note} onInput={(e) => setNote((e.target as HTMLInputElement).value)} />

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Medio de pago</span>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setPayment(pm.id)}
                  aria-pressed={payment === pm.id}
                  className={`tap-target rounded-xl px-2 text-xs font-medium ${
                    payment === pm.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cuenta</span>
            <div className="flex flex-wrap gap-2">
              {accs.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAccount(a.id)}
                  aria-pressed={account === a.id}
                  className={`tap-target rounded-xl px-3 text-sm font-medium ${
                    account === a.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Button type="submit" disabled={!canSave} className="w-full py-3.5 text-lg">
          {savedFlash ? 'Guardado ✓' : 'Guardar gasto'}
        </Button>
      </form>
    </div>
  );
}
