import { createServer, type Server } from 'node:http';

/**
 * Servidor HTTP minimo que imita el contrato del Worker de sincronizacion
 * (POST /sync con {since, changes} -> {serverTime, changes}), usado solo
 * para la prueba e2e. Guarda todo en memoria, sin persistencia.
 */
export interface MockSyncServer {
  server: Server;
  port: number;
  requests: unknown[];
  close: () => Promise<void>;
}

type Table = 'expenses' | 'categories' | 'accounts' | 'recurring' | 'budgets';
const TABLES: Table[] = ['expenses', 'categories', 'accounts', 'recurring', 'budgets'];

export async function startMockSyncServer(): Promise<MockSyncServer> {
  const store: Record<Table, Map<string, { updatedAt: number; data: unknown }>> = {
    expenses: new Map(),
    categories: new Map(),
    accounts: new Map(),
    recurring: new Map(),
    budgets: new Map()
  };
  const requests: unknown[] = [];

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/sync' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = JSON.parse(body || '{}') as { since?: number; changes?: Partial<Record<Table, { id: string; updatedAt: number }[]>> };
        requests.push(parsed);
        const since = parsed.since ?? 0;

        for (const table of TABLES) {
          const rows = parsed.changes?.[table];
          if (!rows) continue;
          for (const row of rows) {
            const current = store[table].get(row.id);
            if (!current || row.updatedAt >= current.updatedAt) {
              store[table].set(row.id, { updatedAt: row.updatedAt, data: row });
            }
          }
        }

        const changes: Partial<Record<Table, unknown[]>> = {};
        for (const table of TABLES) {
          const rows = [...store[table].values()].filter((r) => r.updatedAt > since).map((r) => r.data);
          if (rows.length) changes[table] = rows;
        }

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ serverTime: Date.now(), changes }));
      });
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    server,
    port,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}
