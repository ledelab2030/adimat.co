import { useMemo, useState } from 'preact/hooks';
import {
  accounts as accountsSignal,
  activeExpenses,
  categories as categoriesSignal,
  deleteExpense,
  updateExpense
} from '../lib/store';
import { formatCOP, formatDateHuman, parseAmountInput } from '../lib/format';
import { PAYMENT_METHODS, type Expense } from '../lib/types';
import { Card, EmptyState, IconBadge, Input, Select } from '../components/ui';
import { Modal } from '../components/Modal';
import { ExpenseForm } from '../components/ExpenseForm';
import { showToast } from '../lib/toast';

export function Historial() {
  const expenses = activeExpenses.value;
  const cats = categoriesSignal.value;
  const accs = accountsSignal.value;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const accById = new Map(accs.map((a) => [a.id, a]));

  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const min = minAmount ? parseAmountInput(minAmount) : 0;
    const max = maxAmount ? parseAmountInput(maxAmount) : Infinity;
    const q = search.trim().toLowerCase();
    return expenses
      .filter((e) => (month ? e.date.startsWith(month) : true))
      .filter((e) => (categoryFilter ? e.categoryId === categoryFilter : true))
      .filter((e) => (accountFilter ? e.account === accountFilter : true))
      .filter((e) => (paymentFilter ? e.paymentMethod === paymentFilter : true))
      .filter((e) => e.amount >= min && e.amount <= max)
      .filter((e) => (q ? e.note.toLowerCase().includes(q) || (catById.get(e.categoryId)?.name ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [expenses, search, month, categoryFilter, accountFilter, paymentFilter, minAmount, maxAmount]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  async function handleDelete(id: string) {
    const undo = await deleteExpense(id);
    setEditing(null);
    showToast('Gasto eliminado', undo);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Historial</h1>

      <Card className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Input label="Buscar" type="search" placeholder="Nota o categoria" value={search} onInput={(e) => setSearch((e.target as HTMLInputElement).value)} className="col-span-2 sm:col-span-1" />
        <Input label="Mes" type="month" value={month} onInput={(e) => setMonth((e.target as HTMLInputElement).value)} />
        <Select label="Categoria" value={categoryFilter} onChange={(e) => setCategoryFilter((e.target as HTMLSelectElement).value)}>
          <option value="">Todas</option>
          {cats.filter((c) => !c.deleted).map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </Select>
        <Select label="Cuenta" value={accountFilter} onChange={(e) => setAccountFilter((e.target as HTMLSelectElement).value)}>
          <option value="">Todas</option>
          {accs.filter((a) => !a.deleted).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        <Select label="Medio de pago" value={paymentFilter} onChange={(e) => setPaymentFilter((e.target as HTMLSelectElement).value)}>
          <option value="">Todos</option>
          {PAYMENT_METHODS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </Select>
        <Input label="Monto minimo" inputMode="numeric" value={minAmount} onInput={(e) => setMinAmount((e.target as HTMLInputElement).value)} />
        <Input label="Monto maximo" inputMode="numeric" value={maxAmount} onInput={(e) => setMaxAmount((e.target as HTMLInputElement).value)} />
      </Card>

      <div className="flex items-center justify-between px-1 text-sm text-slate-500 dark:text-slate-400">
        <span>{filtered.length} registro(s)</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCOP(total)}</span>
      </div>

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 && <EmptyState>No hay gastos con estos filtros.</EmptyState>}
        {filtered.map((e) => {
          const cat = catById.get(e.categoryId);
          return (
            <button
              key={e.id}
              onClick={() => setEditing(e)}
              className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <IconBadge icon={cat?.icon ?? '📦'} color={cat?.color ?? '#999'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.note || cat?.name || 'Gasto'}</p>
                <p className="text-xs text-slate-500">
                  {formatDateHuman(e.date)} · {accById.get(e.account)?.name ?? e.account}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatCOP(e.amount)}</p>
            </button>
          );
        })}
      </Card>

      {editing && (
        <Modal title="Editar gasto" onClose={() => setEditing(null)}>
          <ExpenseForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onDelete={() => handleDelete(editing.id)}
            onSave={async (values) => {
              await updateExpense(editing.id, values);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
