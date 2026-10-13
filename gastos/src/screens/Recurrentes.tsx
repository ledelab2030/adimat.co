import { useState } from 'preact/hooks';
import {
  recurring as recurringSignal,
  addRecurring,
  deleteRecurring,
  updateRecurring,
  visibleAccounts,
  visibleCategories
} from '../lib/store';
import { formatCOP, parseAmountInput } from '../lib/format';
import { todayStr } from '../lib/period';
import { PAYMENT_METHODS, type Frequency, type PaymentMethod } from '../lib/types';
import { Button, Card, EmptyState, IconBadge, Input, Select } from '../components/ui';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function NewRecurringForm(props: { onDone: () => void }) {
  const cats = visibleCategories.value;
  const accs = visibleAccounts.value;
  const [amountRaw, setAmountRaw] = useState('');
  const [categoryId, setCategoryId] = useState(cats[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('debito');
  const [account, setAccount] = useState(accs[0]?.id ?? '');
  const [frequency, setFrequency] = useState<Frequency>('mensual');
  const [anchorDay, setAnchorDay] = useState(1);
  const [anchorMonth, setAnchorMonth] = useState(1);
  const [startDate, setStartDate] = useState(todayStr());

  const amount = parseAmountInput(amountRaw);

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Nuevo gasto recurrente</h2>
      <Input label="Monto" inputMode="numeric" value={amountRaw} onInput={(e) => setAmountRaw((e.target as HTMLInputElement).value)} />
      <Input label="Nota" value={note} onInput={(e) => setNote((e.target as HTMLInputElement).value)} />

      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId((e.target as HTMLSelectElement).value)}>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
        ))}
      </Select>

      <Select label="Frecuencia" value={frequency} onChange={(e) => setFrequency((e.target as HTMLSelectElement).value as Frequency)}>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
        <option value="anual">Anual</option>
      </Select>

      {frequency === 'semanal' && (
        <Select label="Dia de la semana" value={anchorDay} onChange={(e) => setAnchorDay(Number((e.target as HTMLSelectElement).value))}>
          {WEEKDAYS.map((d, i) => (
            <option key={d} value={i}>{d}</option>
          ))}
        </Select>
      )}
      {frequency !== 'semanal' && (
        <Input label="Dia del mes" type="number" min={1} max={31} value={anchorDay} onInput={(e) => setAnchorDay(Number((e.target as HTMLInputElement).value))} />
      )}
      {frequency === 'anual' && (
        <Select label="Mes" value={anchorMonth} onChange={(e) => setAnchorMonth(Number((e.target as HTMLSelectElement).value))}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </Select>
      )}

      <Input label="Empieza el" type="date" value={startDate} onInput={(e) => setStartDate((e.target as HTMLInputElement).value)} />

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Medio de pago</span>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              type="button"
              key={pm.id}
              onClick={() => setPayment(pm.id)}
              className={`tap-target rounded-xl px-2 text-xs font-medium ${payment === pm.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      <Select label="Cuenta" value={account} onChange={(e) => setAccount((e.target as HTMLSelectElement).value)}>
        {accs.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </Select>

      <Button
        className="w-full"
        disabled={amount <= 0 || !categoryId || !account}
        onClick={async () => {
          await addRecurring({
            amount,
            categoryId,
            note,
            paymentMethod: payment,
            account,
            frequency,
            anchorDay,
            anchorMonth: frequency === 'anual' ? anchorMonth : undefined,
            startDate,
            active: true
          });
          props.onDone();
        }}
      >
        Crear recurrente
      </Button>
    </Card>
  );
}

export function Recurrentes() {
  const list = recurringSignal.value.filter((r) => !r.deleted);
  const cats = visibleCategories.value;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Gastos recurrentes</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cerrar' : '+ Nuevo'}</Button>
      </div>

      {showForm && <NewRecurringForm onDone={() => setShowForm(false)} />}

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {list.length === 0 && <EmptyState>Aun no tienes gastos recurrentes configurados.</EmptyState>}
        {list.map((r) => {
          const cat = catById.get(r.categoryId);
          return (
            <div key={r.id} className={`flex items-center gap-3 py-2.5 ${!r.active ? 'opacity-50' : ''}`}>
              <IconBadge icon={cat?.icon ?? '🔁'} color={cat?.color ?? '#999'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.note || cat?.name}</p>
                <p className="text-xs text-slate-500">
                  {formatCOP(r.amount)} · {r.frequency}
                </p>
              </div>
              <Button variant="ghost" className="px-2 text-xs" onClick={() => updateRecurring(r.id, { active: !r.active })}>
                {r.active ? 'Pausar' : 'Activar'}
              </Button>
              <Button
                variant="ghost"
                className="px-2 text-xs text-red-600"
                onClick={() => {
                  if (confirm('Eliminar este gasto recurrente?')) deleteRecurring(r.id);
                }}
              >
                🗑️
              </Button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
