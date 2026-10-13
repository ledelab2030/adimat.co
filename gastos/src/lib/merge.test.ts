import { describe, expect, it } from 'vitest';
import { mergeByLastWriteWins } from './merge';
import type { SyncMeta } from './types';

interface Rec extends SyncMeta {
  value: string;
}

function rec(id: string, updatedAt: number, value: string, deleted = false): Rec {
  return { id, updatedAt, value, deleted };
}

describe('mergeByLastWriteWins', () => {
  it('agrega registros nuevos', () => {
    const { merged, result } = mergeByLastWriteWins<Rec>([], [rec('1', 100, 'a')]);
    expect(merged).toHaveLength(1);
    expect(result).toEqual({ added: 1, updated: 0, skipped: 0 });
  });

  it('actualiza cuando el entrante es mas reciente (evita duplicados en re-importaciones)', () => {
    const existing = [rec('1', 100, 'viejo')];
    const { merged, result } = mergeByLastWriteWins<Rec>(existing, [rec('1', 200, 'nuevo')]);
    expect(merged).toEqual([rec('1', 200, 'nuevo')]);
    expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
  });

  it('omite cuando el entrante es igual o mas viejo (idempotente)', () => {
    const existing = [rec('1', 200, 'actual')];
    const { merged, result } = mergeByLastWriteWins<Rec>(existing, [rec('1', 200, 'duplicado'), rec('1', 50, 'muy viejo')]);
    expect(merged).toEqual([rec('1', 200, 'actual')]);
    expect(result.skipped).toBe(2);
  });

  it('reimportar el mismo respaldo dos veces no duplica ni cambia nada', () => {
    const backup = [rec('1', 100, 'a'), rec('2', 100, 'b')];
    const first = mergeByLastWriteWins<Rec>([], backup);
    const second = mergeByLastWriteWins<Rec>(first.merged, backup);
    expect(second.merged).toHaveLength(2);
    expect(second.result).toEqual({ added: 0, updated: 0, skipped: 2 });
  });
});
