export type PaymentMethod = 'efectivo' | 'debito' | 'credito' | 'transferencia';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'debito', label: 'Debito' },
  { id: 'credito', label: 'Credito' },
  { id: 'transferencia', label: 'Transferencia' }
];

export type Frequency = 'semanal' | 'mensual' | 'anual';

/** Campos comunes a todo registro sincronizable (local-first, borrado logico). */
export interface SyncMeta {
  id: string;
  updatedAt: number;
  deleted: boolean;
}

export interface Category extends SyncMeta {
  name: string;
  icon: string;
  color: string;
  order: number;
  hidden: boolean;
}

export interface Account extends SyncMeta {
  name: string;
  order: number;
  hidden: boolean;
}

export interface Expense extends SyncMeta {
  amount: number; // entero en pesos, sin decimales
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string;
  paymentMethod: PaymentMethod;
  account: string; // Account.id
  recurringId?: string;
  createdAt: number;
}

export interface RecurringExpense extends SyncMeta {
  amount: number;
  categoryId: string;
  note: string;
  paymentMethod: PaymentMethod;
  account: string;
  frequency: Frequency;
  /** dia del mes (1-31) para mensual/anual, dia de la semana (0=domingo) para semanal */
  anchorDay: number;
  /** solo para anual: mes 1-12 */
  anchorMonth?: number;
  startDate: string; // YYYY-MM-DD
  active: boolean;
  lastConfirmedDate?: string; // YYYY-MM-DD de la ultima ocurrencia confirmada
  lastSkippedDate?: string;
}

export interface Budget extends SyncMeta {
  categoryId: string;
  amount: number;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Settings {
  id: 'settings';
  currency: 'COP';
  locale: string;
  monthStartDay: number; // 1-28
  theme: ThemeMode;
  syncUrl: string;
  syncKey: string;
  lastSyncAt: number;
  demoLoaded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  currency: 'COP',
  locale: 'es-CO',
  monthStartDay: 1,
  theme: 'auto',
  syncUrl: '',
  syncKey: '',
  lastSyncAt: 0,
  demoLoaded: false
};

export type SyncableStoreName = 'expenses' | 'categories' | 'accounts' | 'recurring' | 'budgets';

export interface SyncRecordMap {
  expenses: Expense;
  categories: Category;
  accounts: Account;
  recurring: RecurringExpense;
  budgets: Budget;
}
