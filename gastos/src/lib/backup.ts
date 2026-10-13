import { getDB } from './db';
import { parseCsv, toCsvRow } from './csv';
import { newId } from './id';
import { mergeByLastWriteWins, type MergeResult } from './merge';
import {
  accounts,
  budgets,
  categories,
  expenses,
  recurring,
  settings,
  updateSettings
} from './store';
import type { Account, Budget, Category, Expense, RecurringExpense } from './types';
import { PAYMENT_METHODS } from './types';

const BACKUP_VERSION = 1;

export interface FullBackup {
  version: number;
  exportedAt: string;
  categories: Category[];
  accounts: Account[];
  expenses: Expense[];
  recurring: RecurringExpense[];
  budgets: Budget[];
  settings: {
    currency: string;
    locale: string;
    monthStartDay: number;
    theme: string;
  };
}

export function buildFullBackup(): FullBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories: categories.value,
    accounts: accounts.value,
    expenses: expenses.value,
    recurring: recurring.value,
    budgets: budgets.value,
    settings: {
      currency: settings.value.currency,
      locale: settings.value.locale,
      monthStartDay: settings.value.monthStartDay,
      theme: settings.value.theme
    }
  };
}

export function exportJSON(): string {
  return JSON.stringify(buildFullBackup(), null, 2);
}

const CSV_HEADER = ['id', 'fecha', 'monto', 'categoria', 'nota', 'medioPago', 'cuenta', 'recurrenteId'];

export function exportCSV(): string {
  const categoryName = new Map(categories.value.map((c) => [c.id, c.name]));
  const accountName = new Map(accounts.value.map((a) => [a.id, a.name]));
  const lines = [toCsvRow(CSV_HEADER)];
  for (const e of expenses.value.filter((e) => !e.deleted)) {
    lines.push(
      toCsvRow([
        e.id,
        e.date,
        e.amount,
        categoryName.get(e.categoryId) ?? e.categoryId,
        e.note,
        e.paymentMethod,
        accountName.get(e.account) ?? e.account,
        e.recurringId ?? ''
      ])
    );
  }
  return lines.join('\n');
}

export interface ImportSummary {
  categories: MergeResult;
  accounts: MergeResult;
  expenses: MergeResult;
  recurring: MergeResult;
  budgets: MergeResult;
}

export async function importJSON(text: string): Promise<ImportSummary> {
  const parsed = JSON.parse(text) as Partial<FullBackup>;
  const db = await getDB();

  const catMerge = mergeByLastWriteWins(categories.value, parsed.categories ?? []);
  const accMerge = mergeByLastWriteWins(accounts.value, parsed.accounts ?? []);
  const expMerge = mergeByLastWriteWins(expenses.value, parsed.expenses ?? []);
  const recMerge = mergeByLastWriteWins(recurring.value, parsed.recurring ?? []);
  const budMerge = mergeByLastWriteWins(budgets.value, parsed.budgets ?? []);

  const tx = db.transaction(['categories', 'accounts', 'expenses', 'recurring', 'budgets'], 'readwrite');
  await Promise.all([
    ...catMerge.toWrite.map((r) => tx.objectStore('categories').put(r)),
    ...accMerge.toWrite.map((r) => tx.objectStore('accounts').put(r)),
    ...expMerge.toWrite.map((r) => tx.objectStore('expenses').put(r)),
    ...recMerge.toWrite.map((r) => tx.objectStore('recurring').put(r)),
    ...budMerge.toWrite.map((r) => tx.objectStore('budgets').put(r))
  ]);
  await tx.done;

  categories.value = catMerge.merged;
  accounts.value = accMerge.merged;
  expenses.value = expMerge.merged;
  recurring.value = recMerge.merged;
  budgets.value = budMerge.merged;

  if (parsed.settings) {
    await updateSettings({
      currency: 'COP',
      locale: parsed.settings.locale ?? settings.value.locale,
      monthStartDay: parsed.settings.monthStartDay ?? settings.value.monthStartDay,
      theme: (parsed.settings.theme as typeof settings.value.theme) ?? settings.value.theme
    });
  }

  return {
    categories: catMerge.result,
    accounts: accMerge.result,
    expenses: expMerge.result,
    recurring: recMerge.result,
    budgets: budMerge.result
  };
}

/** Importa un CSV de gastos (propio o externo). Deduplica por id cuando viene, o por firma fecha+monto+nota+cuenta. */
export async function importExpensesCSV(text: string): Promise<MergeResult> {
  const rows = parseCsv(text);
  if (rows.length === 0) return { added: 0, updated: 0, skipped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iId = idx('id');
  const iFecha = idx('fecha');
  const iMonto = idx('monto');
  const iCategoria = idx('categoria');
  const iNota = idx('nota');
  const iMedio = idx('mediopago');
  const iCuenta = idx('cuenta');
  const iRecurrente = idx('recurrenteid');

  const categoryByName = new Map(categories.value.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const categoryById = new Set(categories.value.map((c) => c.id));
  let accountByName = new Map(accounts.value.map((a) => [a.name.trim().toLowerCase(), a.id]));
  const accountById = new Set(accounts.value.map((a) => a.id));
  const paymentIds = new Set(PAYMENT_METHODS.map((p) => p.id));

  const existingSignatures = new Set(
    expenses.value.filter((e) => !e.deleted).map((e) => `${e.date}|${e.amount}|${e.note.trim().toLowerCase()}|${e.account}`)
  );
  const existingIds = new Set(expenses.value.map((e) => e.id));

  const now = Date.now();
  const toAdd: Expense[] = [];
  const newAccounts: Account[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;
    const date = (iFecha >= 0 ? row[iFecha] : '').trim();
    const amount = parseInt((iMonto >= 0 ? row[iMonto] : '0').replace(/[^0-9-]/g, ''), 10);
    if (!date || Number.isNaN(amount)) {
      skipped++;
      continue;
    }
    const note = (iNota >= 0 ? row[iNota] : '').trim();
    const rawCategory = (iCategoria >= 0 ? row[iCategoria] : '').trim();
    const categoryId = categoryById.has(rawCategory) ? rawCategory : categoryByName.get(rawCategory.toLowerCase()) ?? 'cat-otras';
    const rawAccount = (iCuenta >= 0 ? row[iCuenta] : '').trim() || 'Personal';
    let accountId = accountById.has(rawAccount) ? rawAccount : accountByName.get(rawAccount.toLowerCase());
    if (!accountId) {
      const newAcc: Account = {
        id: newId(),
        name: rawAccount,
        order: accounts.value.length + newAccounts.length,
        hidden: false,
        updatedAt: now,
        deleted: false
      };
      newAccounts.push(newAcc);
      accountByName = new Map(accountByName).set(rawAccount.toLowerCase(), newAcc.id);
      accountId = newAcc.id;
    }
    const rawMethod = (iMedio >= 0 ? row[iMedio] : '').trim().toLowerCase();
    const paymentMethod = paymentIds.has(rawMethod as never) ? (rawMethod as Expense['paymentMethod']) : 'efectivo';
    const id = iId >= 0 && row[iId] ? row[iId].trim() : '';

    const signature = `${date}|${amount}|${note.trim().toLowerCase()}|${accountId}`;
    if ((id && existingIds.has(id)) || existingSignatures.has(signature)) {
      skipped++;
      continue;
    }
    existingSignatures.add(signature);
    const finalId = id || newId();
    existingIds.add(finalId);
    toAdd.push({
      id: finalId,
      amount,
      categoryId,
      date,
      note,
      paymentMethod,
      account: accountId,
      recurringId: iRecurrente >= 0 && row[iRecurrente] ? row[iRecurrente].trim() : undefined,
      createdAt: now,
      updatedAt: now,
      deleted: false
    });
  }

  const db = await getDB();
  const tx = db.transaction(['expenses', 'accounts'], 'readwrite');
  await Promise.all([
    ...toAdd.map((e) => tx.objectStore('expenses').put(e)),
    ...newAccounts.map((a) => tx.objectStore('accounts').put(a))
  ]);
  await tx.done;

  expenses.value = [...expenses.value, ...toAdd];
  if (newAccounts.length) accounts.value = [...accounts.value, ...newAccounts];

  return { added: toAdd.length, updated: 0, skipped };
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
