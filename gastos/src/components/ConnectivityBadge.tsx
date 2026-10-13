import { online, pendingCount, syncConfigured, syncStatus } from '../lib/sync';

const LABELS: Record<string, { text: string; dot: string }> = {
  local: { text: 'Solo en este dispositivo', dot: 'bg-slate-400' },
  offline: { text: 'Sin conexion', dot: 'bg-slate-400' },
  syncing: { text: 'Sincronizando...', dot: 'bg-amber-500 animate-pulse' },
  synced: { text: 'Sincronizado', dot: 'bg-brand-500' },
  pending: { text: 'Pendiente de sincronizar', dot: 'bg-amber-500' },
  error: { text: 'Error de sincronizacion', dot: 'bg-red-500' }
};

export function ConnectivityBadge() {
  const status = !online.value ? 'offline' : syncStatus.value;
  const info = LABELS[status] ?? LABELS.local;
  const count = pendingCount.value;
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <span className={`h-2 w-2 rounded-full ${info.dot}`} aria-hidden="true" />
      <span>{info.text}</span>
      {syncConfigured.value && count > 0 && status !== 'syncing' && (
        <span className="rounded-full bg-amber-100 px-1.5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{count}</span>
      )}
    </div>
  );
}
