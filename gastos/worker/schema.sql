-- Esquema D1 para el Worker de sincronizacion de Gastos.
-- Cada tabla guarda el registro completo como JSON en `data`, mas las
-- columnas `updated_at` y `deleted` para poder filtrar y ordenar sin tener
-- que parsear el JSON (clave para la resolucion de conflictos LWW).

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON expenses (updated_at);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories (updated_at);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts (updated_at);

CREATE TABLE IF NOT EXISTS recurring (
  id TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recurring_updated_at ON recurring (updated_at);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON budgets (updated_at);
