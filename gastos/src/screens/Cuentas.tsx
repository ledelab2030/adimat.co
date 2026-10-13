import { useState } from 'preact/hooks';
import { accounts as accountsSignal, addAccount, deleteAccount, updateAccount } from '../lib/store';
import { Button, Card, Input } from '../components/ui';

export function Cuentas() {
  const accs = [...accountsSignal.value].filter((a) => !a.deleted).sort((a, b) => a.order - b.order);
  const [newName, setNewName] = useState('');

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Cuentas</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Usalas para separar tus gastos personales de los de tus negocios.
      </p>
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {accs.map((a) => (
          <div key={a.id} className={`flex items-center gap-2 py-2 ${a.hidden ? 'opacity-50' : ''}`}>
            <Input
              value={a.name}
              onChange={(e) => updateAccount(a.id, { name: (e.target as HTMLInputElement).value })}
              className="flex-1"
            />
            <Button variant="ghost" className="px-2 text-xs" onClick={() => updateAccount(a.id, { hidden: !a.hidden })}>
              {a.hidden ? 'Mostrar' : 'Ocultar'}
            </Button>
            <Button
              variant="ghost"
              className="px-2 text-xs text-red-600"
              onClick={() => {
                if (confirm(`Eliminar la cuenta "${a.name}"?`)) deleteAccount(a.id);
              }}
            >
              🗑️
            </Button>
          </div>
        ))}
      </Card>
      <Card className="flex gap-2">
        <Input placeholder="Nueva cuenta" value={newName} onInput={(e) => setNewName((e.target as HTMLInputElement).value)} className="flex-1" />
        <Button
          disabled={!newName.trim()}
          onClick={async () => {
            await addAccount(newName);
            setNewName('');
          }}
        >
          Agregar
        </Button>
      </Card>
    </div>
  );
}
