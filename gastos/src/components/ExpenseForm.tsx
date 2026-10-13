import { useState } from 'preact/hooks';
import { visibleAccounts, visibleCategories } from '../lib/store';
import { formatCOP, parseAmountInput } from '../lib/format';
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from '../lib/types';
import { Button, IconBadge, Input } from './ui';

export interface ExpenseFormValues {
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  paymentMethod: PaymentMethod;
  account: string;
}

export function ExpenseForm(props: {
  initial: Expense;
  onSave: (values: ExpenseFormValues) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cats = visibleCategories.value;
  const accs = visibleAccounts.value;
  const [amountRaw, setAmountRaw] = useState(String(props.initial.amount));
  const [categoryId, setCategoryId] = useState(props.initial.categoryId);
  const [date, setDate] = useState(props.initial.date);
  const [note, setNote] = useState(props.initial.note);
  const [payment, setPayment] = useState<PaymentMethod>(props.initial.paymentMethod);
  const [account, setAccount] = useState(props.initial.account);

  const amount = parseAmountInput(amountRaw);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Monto</span>
        <input
          inputMode="numeric"
          value={formatCOP(amount)}
          onInput={(e) => setAmountRaw((e.target as HTMLInputElement).value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-2xl font-bold tabular-nums dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <div className="grid grid-cols-5 gap-2">
        {cats.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`tap-target flex flex-col items-center gap-0.5 rounded-xl p-1.5 ${
              categoryId === c.id ? 'bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950' : ''
            }`}
          >
            <IconBadge icon={c.icon} color={c.color} size="sm" />
            <span className="line-clamp-1 text-[10px]">{c.name}</span>
          </button>
        ))}
      </div>

      <Input label="Fecha" type="date" value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
      <Input label="Nota" type="text" value={note} onInput={(e) => setNote((e.target as HTMLInputElement).value)} />

      <div className="grid grid-cols-4 gap-2">
        {PAYMENT_METHODS.map((pm) => (
          <button
            type="button"
            key={pm.id}
            onClick={() => setPayment(pm.id)}
            className={`tap-target rounded-xl px-2 text-xs font-medium ${
              payment === pm.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {accs.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => setAccount(a.id)}
            className={`tap-target rounded-xl px-3 text-sm font-medium ${
              account === a.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="danger" onClick={props.onDelete} className="flex-1">
          Eliminar
        </Button>
        <Button variant="secondary" onClick={props.onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={() => props.onSave({ amount, categoryId, date, note, paymentMethod: payment, account })}
          className="flex-1"
          disabled={amount <= 0}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
