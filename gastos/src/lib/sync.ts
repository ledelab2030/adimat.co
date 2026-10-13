import { signal, computed, effect } from '@preact/signals';
import { getDB } from './db';
import { mergeByLastWriteWins } from './merge';
import {
  accounts,
  budgets,
  categories,
  expenses,
  lastMutationAt,
  recurring,
  settings,
  updateSettings
} from './store';
import type { SyncableStoreName, SyncRecordMap } from './types';

export type SyncStatus = 'local' | 'offline' | 'syncing' | 'synced' | 'pending' | 'error';

export const online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
export const syncStatus = signal<SyncStatus>('local');
export const lastSyncError = signal<string | null>(null);

const STORE_SIGNALS = { categories, accounts, expenses, recurring, budgets } as const;

export const pendingCount = computed(() => {
  const since = settings.value.lastSyncAt;
  let count = 0;
  for (const name of Object.keys(STORE_SIGNALS) as SyncableStoreName[]) {
    count += STORE_SIGNALS[name].value.filter((r) => r.updatedAt > since).length;
  }
  return count;
});

export const syncConfigured = computed(() => Boolean(settings.value.syncUrl && settings.value.syncKey));

interface SyncRequestBody {
  since: number;
  changes: Partial<{ [K in SyncableStoreName]: SyncRecordMap[K][] }>;
}

interface SyncResponseBody {
  serverTime: number;
  changes: Partial<{ [K in SyncableStoreName]: SyncRecordMap[K][] }>;
}

let syncing = false;
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

export async function syncNow(): Promise<void> {
  if (syncing) return;
  if (!syncConfigured.value) {
    syncStatus.value = 'local';
    return;
  }
  if (!online.value) {
    syncStatus.value = 'offline';
    return;
  }

  syncing = true;
  syncStatus.value = 'syncing';
  lastSyncError.value = null;
  try {
    const since = settings.value.lastSyncAt;
    const changes: SyncRequestBody['changes'] = {};
    for (const name of Object.keys(STORE_SIGNALS) as SyncableStoreName[]) {
      const dirty = STORE_SIGNALS[name].value.filter((r) => r.updatedAt > since);
      if (dirty.length) changes[name] = dirty as never;
    }

    const res = await fetch(`${settings.value.syncUrl.replace(/\/$/, '')}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.value.syncKey}`
      },
      body: JSON.stringify({ since, changes } satisfies SyncRequestBody)
    });

    if (!res.ok) {
      throw new Error(`El servidor respondio ${res.status}`);
    }

    const body = (await res.json()) as SyncResponseBody;
    const db = await getDB();

    for (const name of Object.keys(STORE_SIGNALS) as SyncableStoreName[]) {
      const incoming = body.changes[name];
      if (!incoming || !incoming.length) continue;
      const sig = STORE_SIGNALS[name];
      const outcome = mergeByLastWriteWins(sig.value as never[], incoming as never[]);
      if (outcome.toWrite.length) {
        const tx = db.transaction(name, 'readwrite');
        await Promise.all(outcome.toWrite.map((r) => tx.store.put(r as never)));
        await tx.done;
      }
      (sig as { value: unknown[] }).value = outcome.merged;
    }

    await updateSettings({ lastSyncAt: body.serverTime ?? Date.now() });
    syncStatus.value = 'synced';
  } catch (err) {
    lastSyncError.value = err instanceof Error ? err.message : 'Error desconocido';
    syncStatus.value = pendingCount.value > 0 ? 'pending' : 'error';
  } finally {
    syncing = false;
  }
}

function scheduleSync(delayMs = 1500) {
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => {
    void syncNow();
  }, delayMs);
}

let initialized = false;

export function initSync(): void {
  if (initialized) return;
  initialized = true;

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      online.value = true;
      scheduleSync(200);
    });
    window.addEventListener('offline', () => {
      online.value = false;
      syncStatus.value = 'offline';
    });
  }

  effect(() => {
    // Se re-ejecuta en cada mutacion local; sincroniza con rebote.
    lastMutationAt.value;
    if (syncConfigured.value) scheduleSync();
  });

  // Sincronizacion periodica mientras la app esta abierta.
  if (typeof window !== 'undefined') {
    setInterval(() => {
      if (online.value && syncConfigured.value) void syncNow();
    }, 60_000);
  }

  scheduleSync(500);
}
