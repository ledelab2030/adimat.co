import type { Account } from './types';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-personal', name: 'Personal', order: 0, hidden: false, updatedAt: 0, deleted: false },
  { id: 'acc-ledelab', name: 'LedeLab', order: 1, hidden: false, updatedAt: 0, deleted: false },
  { id: 'acc-protemad', name: 'Protemad', order: 2, hidden: false, updatedAt: 0, deleted: false },
  { id: 'acc-i-de', name: 'I+DE', order: 3, hidden: false, updatedAt: 0, deleted: false }
];
