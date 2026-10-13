import type { SyncMeta } from './types';

export interface MergeResult {
  added: number;
  updated: number;
  skipped: number;
}

export interface MergeOutcome<T> {
  merged: T[];
  toWrite: T[];
  result: MergeResult;
}

/** Fusiona una lista local con registros entrantes usando "ultima escritura gana" por updatedAt. */
export function mergeByLastWriteWins<T extends SyncMeta>(existing: T[], incoming: T[]): MergeOutcome<T> {
  const byId = new Map(existing.map((r) => [r.id, r]));
  const toWrite: T[] = [];
  const result: MergeResult = { added: 0, updated: 0, skipped: 0 };
  for (const rec of incoming) {
    const current = byId.get(rec.id);
    if (!current) {
      byId.set(rec.id, rec);
      toWrite.push(rec);
      result.added++;
    } else if (rec.updatedAt > current.updatedAt) {
      byId.set(rec.id, rec);
      toWrite.push(rec);
      result.updated++;
    } else {
      result.skipped++;
    }
  }
  return { merged: [...byId.values()], toWrite, result };
}
