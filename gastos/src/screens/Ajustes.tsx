import { useRef, useState } from 'preact/hooks';
import { settings, updateSettings, wipeAllData } from '../lib/store';
import { syncNow, syncStatus, lastSyncError, pendingCount, syncConfigured } from '../lib/sync';
import { exportCSV, exportJSON, importExpensesCSV, importJSON, downloadFile } from '../lib/backup';
import { loadDemoData, removeDemoData } from '../lib/demoData';
import { showToast } from '../lib/toast';
import type { ThemeMode } from '../lib/types';
import { Button, Card, Input, Select } from '../components/ui';

function SectionTitle(props: { children: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{props.children}</h2>;
}

export function Ajustes() {
  const s = settings.value;
  const jsonInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [wipeStep, setWipeStep] = useState(0);
  const [syncUrlDraft, setSyncUrlDraft] = useState(s.syncUrl);
  const [syncKeyDraft, setSyncKeyDraft] = useState(s.syncKey);

  async function handleImportJSON(file: File) {
    try {
      const text = await file.text();
      const summary = await importJSON(text);
      showToast(
        `Importado: ${summary.expenses.added} gastos nuevos, ${summary.expenses.updated} actualizados, ${summary.expenses.skipped} ya existian.`
      );
    } catch (err) {
      showToast(`Error al importar: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
  }

  async function handleImportCSV(file: File) {
    try {
      const text = await file.text();
      const summary = await importExpensesCSV(text);
      showToast(`Importado: ${summary.added} gastos nuevos, ${summary.skipped} omitidos (duplicados o invalidos).`);
    } catch (err) {
      showToast(`Error al importar CSV: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 pb-28 md:pb-10">
      <h1 className="text-lg font-bold">Ajustes</h1>

      <Card className="space-y-3">
        <SectionTitle>General</SectionTitle>
        <div className="flex items-center justify-between text-sm">
          <span>Moneda</span>
          <span className="font-medium">Peso colombiano (COP) · $ 1.234.567</span>
        </div>
        <Input
          label="Dia de inicio del mes"
          type="number"
          min={1}
          max={28}
          value={s.monthStartDay}
          onInput={(e) => updateSettings({ monthStartDay: Math.min(28, Math.max(1, Number((e.target as HTMLInputElement).value) || 1)) })}
        />
        <Select label="Tema" value={s.theme} onChange={(e) => updateSettings({ theme: (e.target as HTMLSelectElement).value as ThemeMode })}>
          <option value="auto">Automatico (segun el sistema)</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </Select>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Respaldo de tus datos</SectionTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tus datos financieros nunca salen de tu dispositivo (ni del servidor de sincronizacion que tu configures). Descarga un respaldo cuando quieras.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => downloadFile(`gastos-respaldo-${Date.now()}.json`, exportJSON(), 'application/json')}>
            Descargar JSON
          </Button>
          <Button variant="secondary" onClick={() => downloadFile(`gastos-${Date.now()}.csv`, exportCSV(), 'text/csv')}>
            Descargar CSV
          </Button>
          <Button variant="secondary" onClick={() => jsonInput.current?.click()}>
            Importar JSON
          </Button>
          <Button variant="secondary" onClick={() => csvInput.current?.click()}>
            Importar CSV
          </Button>
        </div>
        <input ref={jsonInput} type="file" accept="application/json" className="hidden" onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) void handleImportJSON(file);
          (e.target as HTMLInputElement).value = '';
        }} />
        <input ref={csvInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) void handleImportCSV(file);
          (e.target as HTMLInputElement).value = '';
        }} />
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Sincronizacion entre dispositivos</SectionTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Opcional. Despliega el Worker incluido en <code>worker/</code> y define aqui la misma URL y clave en todos tus dispositivos.
        </p>
        <Input label="URL del worker" placeholder="https://gastos-sync.tu-cuenta.workers.dev" value={syncUrlDraft} onInput={(e) => setSyncUrlDraft((e.target as HTMLInputElement).value)} />
        <Input label="Clave personal" type="password" placeholder="Una frase larga y unica" value={syncKeyDraft} onInput={(e) => setSyncKeyDraft((e.target as HTMLInputElement).value)} />
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={async () => {
              await updateSettings({ syncUrl: syncUrlDraft.trim(), syncKey: syncKeyDraft.trim() });
              showToast('Configuracion de sincronizacion guardada.');
            }}
          >
            Guardar
          </Button>
          <Button variant="secondary" className="flex-1" disabled={!syncConfigured.value} onClick={() => syncNow()}>
            Sincronizar ahora
          </Button>
        </div>
        <p className="text-sm">
          Estado: <span className="font-medium">{syncStatus.value}</span>
          {pendingCount.value > 0 && ` · ${pendingCount.value} cambio(s) pendiente(s)`}
        </p>
        {lastSyncError.value && <p className="text-sm text-red-600">{lastSyncError.value}</p>}
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Datos de ejemplo</SectionTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">Util para explorar el panel de claridad sin usar tus datos reales.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const n = await loadDemoData();
              showToast(`Se agregaron ${n} gastos de ejemplo.`);
            }}
          >
            Cargar demo
          </Button>
          <Button
            variant="secondary"
            disabled={!s.demoLoaded}
            onClick={async () => {
              await removeDemoData();
              showToast('Datos de ejemplo eliminados.');
            }}
          >
            Quitar demo
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 border-red-200 dark:border-red-900">
        <SectionTitle>Zona de riesgo</SectionTitle>
        {wipeStep === 0 && (
          <Button variant="danger" onClick={() => setWipeStep(1)}>
            Borrar todos los datos
          </Button>
        )}
        {wipeStep === 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Esto eliminara todos tus gastos, categorias, cuentas, recurrentes y presupuestos de este dispositivo. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setWipeStep(0)}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => setWipeStep(2)}>
                Entiendo, continuar
              </Button>
            </div>
          </div>
        )}
        {wipeStep === 2 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">¿Confirmas que quieres borrar todo de forma definitiva?</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setWipeStep(0)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  await wipeAllData();
                  setWipeStep(0);
                  showToast('Todos los datos fueron eliminados.');
                }}
              >
                Si, borrar todo
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
