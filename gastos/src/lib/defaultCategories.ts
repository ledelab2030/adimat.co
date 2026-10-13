import type { Category } from './types';

/** IDs fijos para que la semilla sea idempotente y estable entre dispositivos. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-vivienda', name: 'Vivienda', icon: '🏠', color: '#2563eb', order: 0, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-servicios', name: 'Servicios', icon: '💡', color: '#f59e0b', order: 1, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-mercado', name: 'Mercado', icon: '🛒', color: '#16a34a', order: 2, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-restaurantes', name: 'Restaurantes', icon: '🍽️', color: '#ea580c', order: 3, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-transporte', name: 'Transporte', icon: '🚌', color: '#0891b2', order: 4, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-salud', name: 'Salud', icon: '🩺', color: '#dc2626', order: 5, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-educacion', name: 'Educacion', icon: '🎓', color: '#7c3aed', order: 6, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-familia', name: 'Familia', icon: '👨‍👩‍👧', color: '#db2777', order: 7, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-ocio', name: 'Ocio', icon: '🎮', color: '#9333ea', order: 8, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-suscripciones', name: 'Suscripciones', icon: '🔁', color: '#4f46e5', order: 9, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-impuestos', name: 'Impuestos', icon: '🧾', color: '#64748b', order: 10, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-negocio', name: 'Negocio', icon: '💼', color: '#0d9488', order: 11, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-deudas', name: 'Deudas', icon: '💳', color: '#b91c1c', order: 12, hidden: false, updatedAt: 0, deleted: false },
  { id: 'cat-otras', name: 'Otras', icon: '📦', color: '#525252', order: 13, hidden: false, updatedAt: 0, deleted: false }
];
