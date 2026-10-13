import { signal, computed } from '@preact/signals';
import { getDB } from './db';
import { newId } from './id';
import { todayStr } from './period';
import type {
  Account,
  Budget,
  Category,
  Expense,
  RecurringExpense,
  Settings
} from './types';
import { DEFAULT_SETTINGS } from './types';

export const categories = signal<Category[]>([]);
export const accounts = signal<Account[]>([]);
export const expenses = signal<Expense[]>([]);
export const recurring = signal<RecurringExpense[]>([]);
export const budgets = signal<Budget[]>([]);
export const settings = signal<Settings>(DEFAULT_SETTINGS);

/** Se incrementa en cada escritura local; sync.ts lo observa para disparar sincronizacion. */
export const lastMutationAt = signal(0);

export const visibleCategories = computed(() =>
  categories.value.filter((c) => !c.deleted && !c.hidden).sort((a, b) => a.order - b.order)
);
export const allCategoriesSorted = computed(() =>
  categories.value.filter((c) => !c.deleted).sort((a, b) => a.order - b.order)
);
export const visibleAccounts = computed(() =>
  accounts.value.filter((a) => !a.deleted && !a.hidden).sort((a, b) => a.order - b.order)
);
export const activeExpenses = computed(() => expenses.value.filter((e) => !e.deleted));
export const activeRecurring = computed(() => recurring.value.filter((r) => !r.deleted && r.active));
export const activeBudgets = computed(() => budgets.value.filter((b) => !b.deleted));

let initialized = false;

export async function initStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const db = await getDB();
  const [cats, accs, exps, recs, buds, sett] = await Promise.all([
    db.getAll('categories'),
    db.getAll('accounts'),
    db.getAll('expenses'),
    db.getAll('recurring'),
    db.getAll('budgets'),
    db.get('settings', 'settings')
  ]);
  categories.value = cats;
  accounts.value = accs;
  expenses.value = exps;
  recurring.value = recs;
  budgets.value = buds;
  settings.value = sett ?? DEFAULT_SETTINGS;
}

function touch<T extends { updatedAt: number }>(record: T): T {
  return { ...record, updatedAt: Date.now() };
}

function bump() {
  lastMutationAt.value = Date.now();
}

// ---------- Expenses ----------

export interface NewExpenseInput {
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  paymentMethod: Expense['paymentMethod'];
  account: string;
  recurringId?: string;
}

export async function addExpense(input: NewExpenseInput): Promise<Expense> {
  const db = await getDB();
  const now = Date.now();
  const expense: Expense = {
    id: newId(),
    amount: Math.round(input.amount),
    categoryId: input.categoryId,
    date: input.date || todayStr(),
    note: input.note.trim(),
    paymentMethod: input.paymentMethod,
    account: input.account,
    recurringId: input.recurringId,
    createdAt: now,
    updatedAt: now,
    deleted: false
  };
  await db.put('expenses', expense);
  expenses.value = [...expenses.value, expense];
  bump();
  return expense;
}

export async function updateExpense(id: string, patch: Partial<NewExpenseInput>): Promise<void> {
  const db = await getDB();
  const current = expenses.value.find((e) => e.id === id);
  if (!current) return;
  const updated = touch({ ...current, ...patch, amount: patch.amount !== undefined ? Math.round(patch.amount) : current.amount });
  await db.put('expenses', updated);
  expenses.value = expenses.value.map((e) => (e.id === id ? updated : e));
  bump();
}

export async function deleteExpense(id: string): Promise<() => Promise<void>> {
  const db = await getDB();
  const current = expenses.value.find((e) => e.id === id);
  if (!current) return async () => {};
  const deleted = touch({ ...current, deleted: true });
  await db.put('expenses', deleted);
  expenses.value = expenses.value.map((e) => (e.id === id ? deleted : e));
  bump();
  // Funcion de deshacer, valida mientras el registro no se haya vuelto a tocar.
  return async () => {
    const restored = touch({ ...deleted, deleted: false });
    await db.put('expenses', restored);
    expenses.value = expenses.value.map((e) => (e.id === id ? restored : e));
    bump();
  };
}

// ---------- Categories ----------

export async function addCategory(input: { name: string; icon: string; color: string }): Promise<Category> {
  const db = await getDB();
  const now = Date.now();
  const maxOrder = categories.value.reduce((m, c) => Math.max(m, c.order), -1);
  const category: Category = {
    id: newId(),
    name: input.name.trim(),
    icon: input.icon,
    color: input.color,
    order: maxOrder + 1,
    hidden: false,
    updatedAt: now,
    deleted: false
  };
  await db.put('categories', category);
  categories.value = [...categories.value, category];
  bump();
  return category;
}

export async function updateCategory(id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'hidden'>>): Promise<void> {
  const db = await getDB();
  const current = categories.value.find((c) => c.id === id);
  if (!current) return;
  const updated = touch({ ...current, ...patch });
  await db.put('categories', updated);
  categories.value = categories.value.map((c) => (c.id === id ? updated : c));
  bump();
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  const updatedList: Category[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const current = categories.value.find((c) => c.id === orderedIds[i]);
    if (!current) continue;
    const updated = touch({ ...current, order: i });
    await tx.store.put(updated);
    updatedList.push(updated);
  }
  await tx.done;
  categories.value = categories.value.map((c) => updatedList.find((u) => u.id === c.id) ?? c);
  bump();
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  const current = categories.value.find((c) => c.id === id);
  if (!current) return;
  const deleted = touch({ ...current, deleted: true });
  await db.put('categories', deleted);
  categories.value = categories.value.map((c) => (c.id === id ? deleted : c));
  bump();
}

// ---------- Accounts ----------

export async function addAccount(name: string): Promise<Account> {
  const db = await getDB();
  const now = Date.now();
  const maxOrder = accounts.value.reduce((m, a) => Math.max(m, a.order), -1);
  const account: Account = {
    id: newId(),
    name: name.trim(),
    order: maxOrder + 1,
    hidden: false,
    updatedAt: now,
    deleted: false
  };
  await db.put('accounts', account);
  accounts.value = [...accounts.value, account];
  bump();
  return account;
}

export async function updateAccount(id: string, patch: Partial<Pick<Account, 'name' | 'hidden'>>): Promise<void> {
  const db = await getDB();
  const current = accounts.value.find((a) => a.id === id);
  if (!current) return;
  const updated = touch({ ...current, ...patch });
  await db.put('accounts', updated);
  accounts.value = accounts.value.map((a) => (a.id === id ? updated : a));
  bump();
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDB();
  const current = accounts.value.find((a) => a.id === id);
  if (!current) return;
  const deleted = touch({ ...current, deleted: true });
  await db.put('accounts', deleted);
  accounts.value = accounts.value.map((a) => (a.id === id ? deleted : a));
  bump();
}

// ---------- Recurring ----------

export type NewRecurringInput = Omit<RecurringExpense, keyof import('./types').SyncMeta>;

export async function addRecurring(input: NewRecurringInput): Promise<RecurringExpense> {
  const db = await getDB();
  const now = Date.now();
  const rec: RecurringExpense = { id: newId(), updatedAt: now, deleted: false, ...input };
  await db.put('recurring', rec);
  recurring.value = [...recurring.value, rec];
  bump();
  return rec;
}

export async function updateRecurring(id: string, patch: Partial<NewRecurringInput>): Promise<void> {
  const db = await getDB();
  const current = recurring.value.find((r) => r.id === id);
  if (!current) return;
  const updated = touch({ ...current, ...patch });
  await db.put('recurring', updated);
  recurring.value = recurring.value.map((r) => (r.id === id ? updated : r));
  bump();
}

export async function deleteRecurring(id: string): Promise<void> {
  const db = await getDB();
  const current = recurring.value.find((r) => r.id === id);
  if (!current) return;
  const deleted = touch({ ...current, deleted: true, active: false });
  await db.put('recurring', deleted);
  recurring.value = recurring.value.map((r) => (r.id === id ? deleted : r));
  bump();
}

/** Confirma una ocurrencia propuesta: crea el gasto y marca la fecha como confirmada. */
export async function confirmRecurringOccurrence(recId: string, occurrenceDate: string): Promise<void> {
  const rec = recurring.value.find((r) => r.id === recId);
  if (!rec) return;
  await addExpense({
    amount: rec.amount,
    categoryId: rec.categoryId,
    date: occurrenceDate,
    note: rec.note,
    paymentMethod: rec.paymentMethod,
    account: rec.account,
    recurringId: rec.id
  });
  await updateRecurring(recId, { lastConfirmedDate: occurrenceDate });
}

export async function skipRecurringOccurrence(recId: string, occurrenceDate: string): Promise<void> {
  await updateRecurring(recId, { lastSkippedDate: occurrenceDate });
}

// ---------- Budgets ----------

export async function setBudget(categoryId: string, amount: number): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  const current = budgets.value.find((b) => b.categoryId === categoryId && !b.deleted);
  const record: Budget = current
    ? touch({ ...current, amount: Math.round(amount) })
    : { id: newId(), categoryId, amount: Math.round(amount), updatedAt: now, deleted: false };
  await db.put('budgets', record);
  budgets.value = current ? budgets.value.map((b) => (b.id === record.id ? record : b)) : [...budgets.value, record];
  bump();
}

export async function removeBudget(categoryId: string): Promise<void> {
  const db = await getDB();
  const current = budgets.value.find((b) => b.categoryId === categoryId && !b.deleted);
  if (!current) return;
  const deleted = touch({ ...current, deleted: true });
  await db.put('budgets', deleted);
  budgets.value = budgets.value.map((b) => (b.id === current.id ? deleted : b));
  bump();
}

// ---------- Settings ----------

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const db = await getDB();
  const updated = { ...settings.value, ...patch };
  await db.put('settings', updated);
  settings.value = updated;
}

// ---------- Mantenimiento ----------

export async function wipeAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['expenses', 'categories', 'accounts', 'recurring', 'budgets', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('expenses').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('accounts').clear(),
    tx.objectStore('recurring').clear(),
    tx.objectStore('budgets').clear(),
    tx.objectStore('settings').clear()
  ]);
  await tx.done;
  expenses.value = [];
  categories.value = [];
  accounts.value = [];
  recurring.value = [];
  budgets.value = [];
  settings.value = DEFAULT_SETTINGS;
  initialized = false;
  await initStore();
}
