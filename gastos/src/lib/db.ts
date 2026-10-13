import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Account, Budget, Category, Expense, RecurringExpense, Settings } from './types';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { DEFAULT_ACCOUNTS } from './defaultAccounts';
import { DEFAULT_SETTINGS } from './types';

interface GastosDB extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: { byDate: string; byUpdatedAt: number; byCategory: string };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { byUpdatedAt: number };
  };
  accounts: {
    key: string;
    value: Account;
    indexes: { byUpdatedAt: number };
  };
  recurring: {
    key: string;
    value: RecurringExpense;
    indexes: { byUpdatedAt: number };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: { byUpdatedAt: number; byCategory: string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'gastos-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GastosDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GastosDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GastosDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const expenses = db.createObjectStore('expenses', { keyPath: 'id' });
        expenses.createIndex('byDate', 'date');
        expenses.createIndex('byUpdatedAt', 'updatedAt');
        expenses.createIndex('byCategory', 'categoryId');

        const categories = db.createObjectStore('categories', { keyPath: 'id' });
        categories.createIndex('byUpdatedAt', 'updatedAt');

        const accounts = db.createObjectStore('accounts', { keyPath: 'id' });
        accounts.createIndex('byUpdatedAt', 'updatedAt');

        const recurring = db.createObjectStore('recurring', { keyPath: 'id' });
        recurring.createIndex('byUpdatedAt', 'updatedAt');

        const budgets = db.createObjectStore('budgets', { keyPath: 'id' });
        budgets.createIndex('byUpdatedAt', 'updatedAt');
        budgets.createIndex('byCategory', 'categoryId');

        db.createObjectStore('settings', { keyPath: 'id' });
      }
    }).then(async (db) => {
      await seedIfEmpty(db);
      return db;
    });
  }
  return dbPromise;
}

async function seedIfEmpty(db: IDBPDatabase<GastosDB>) {
  const tx = db.transaction(['categories', 'accounts', 'settings'], 'readwrite');
  const catCount = await tx.objectStore('categories').count();
  if (catCount === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await tx.objectStore('categories').put(cat);
    }
  }
  const accCount = await tx.objectStore('accounts').count();
  if (accCount === 0) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await tx.objectStore('accounts').put(acc);
    }
  }
  const settings = await tx.objectStore('settings').get('settings');
  if (!settings) {
    await tx.objectStore('settings').put(DEFAULT_SETTINGS);
  }
  await tx.done;
}

export type { GastosDB };
