import { addExpense, deleteExpense, updateSettings } from './store';
import { toDateStr } from './period';
import type { PaymentMethod } from './types';

const DEMO_IDS_KEY = 'gastos:demoExpenseIds';

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length)];
}

const PAYMENTS: PaymentMethod[] = ['efectivo', 'debito', 'credito', 'transferencia'];

interface DemoTemplate {
  categoryId: string;
  note: string;
  min: number;
  max: number;
  /** Ocurrencias aproximadas por mes */
  perMonth: number;
}

const TEMPLATES: DemoTemplate[] = [
  { categoryId: 'cat-vivienda', note: 'Arriendo', min: 1200000, max: 1200000, perMonth: 1 },
  { categoryId: 'cat-servicios', note: 'Energia', min: 90000, max: 160000, perMonth: 1 },
  { categoryId: 'cat-servicios', note: 'Agua', min: 40000, max: 70000, perMonth: 1 },
  { categoryId: 'cat-servicios', note: 'Internet', min: 95000, max: 95000, perMonth: 1 },
  { categoryId: 'cat-mercado', note: 'Mercado semana', min: 90000, max: 220000, perMonth: 4 },
  { categoryId: 'cat-restaurantes', note: 'Almuerzo', min: 15000, max: 35000, perMonth: 10 },
  { categoryId: 'cat-restaurantes', note: 'Domicilio', min: 25000, max: 55000, perMonth: 4 },
  { categoryId: 'cat-transporte', note: 'Transporte publico', min: 3000, max: 6000, perMonth: 16 },
  { categoryId: 'cat-transporte', note: 'Gasolina', min: 60000, max: 120000, perMonth: 2 },
  { categoryId: 'cat-salud', note: 'Droguería', min: 20000, max: 90000, perMonth: 2 },
  { categoryId: 'cat-ocio', note: 'Cine', min: 20000, max: 45000, perMonth: 1 },
  { categoryId: 'cat-ocio', note: 'Salida', min: 30000, max: 90000, perMonth: 2 },
  { categoryId: 'cat-suscripciones', note: 'Netflix', min: 29900, max: 29900, perMonth: 1 },
  { categoryId: 'cat-suscripciones', note: 'Spotify', min: 17900, max: 17900, perMonth: 1 },
  { categoryId: 'cat-suscripciones', note: 'iCloud', min: 9900, max: 9900, perMonth: 1 },
  { categoryId: 'cat-educacion', note: 'Curso en linea', min: 40000, max: 120000, perMonth: 0.3 },
  { categoryId: 'cat-familia', note: 'Util. familia', min: 20000, max: 80000, perMonth: 1.5 },
  { categoryId: 'cat-otras', note: 'Varios', min: 10000, max: 40000, perMonth: 2 }
];

export async function loadDemoData(): Promise<number> {
  const ids: string[] = [];
  const now = new Date();
  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const base = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (const tpl of TEMPLATES) {
      const occurrences = Math.random() < (tpl.perMonth % 1) ? Math.ceil(tpl.perMonth) : Math.floor(tpl.perMonth);
      for (let k = 0; k < occurrences; k++) {
        const day = Math.min(daysInMonth, randomInt(1, daysInMonth + 1));
        const date = new Date(base.getFullYear(), base.getMonth(), day);
        if (date > now) continue;
        const expense = await addExpense({
          amount: randomInt(tpl.min, tpl.max + 1),
          categoryId: tpl.categoryId,
          date: toDateStr(date),
          note: tpl.note,
          paymentMethod: randomPick(PAYMENTS),
          account: 'acc-personal'
        });
        ids.push(expense.id);
      }
    }
  }
  localStorage.setItem(DEMO_IDS_KEY, JSON.stringify(ids));
  await updateSettings({ demoLoaded: true });
  return ids.length;
}

export async function removeDemoData(): Promise<void> {
  const raw = localStorage.getItem(DEMO_IDS_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  for (const id of ids) {
    await deleteExpense(id);
  }
  localStorage.removeItem(DEMO_IDS_KEY);
  await updateSettings({ demoLoaded: false });
}
