import { signal } from '@preact/signals';

export type ViewId =
  | 'registro'
  | 'panel'
  | 'historial'
  | 'mas'
  | 'categorias'
  | 'cuentas'
  | 'recurrentes'
  | 'presupuestos'
  | 'ajustes';

export const currentView = signal<ViewId>('registro');

export interface ViewDef {
  id: ViewId;
  label: string;
  icon: string;
}

export const PRIMARY_VIEWS: ViewDef[] = [
  { id: 'registro', label: 'Registrar', icon: '➕' },
  { id: 'panel', label: 'Panel', icon: '📊' },
  { id: 'historial', label: 'Historial', icon: '🧾' }
];

export const SECONDARY_VIEWS: ViewDef[] = [
  { id: 'categorias', label: 'Categorias', icon: '🏷️' },
  { id: 'cuentas', label: 'Cuentas', icon: '🏢' },
  { id: 'recurrentes', label: 'Recurrentes', icon: '🔁' },
  { id: 'presupuestos', label: 'Presupuestos', icon: '🎯' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙️' }
];

export function goTo(view: ViewId) {
  currentView.value = view;
  if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
}
