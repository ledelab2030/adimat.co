export interface Env {
  DB: D1Database;
  SYNC_KEY: string;
  ALLOWED_ORIGIN: string;
}

const TABLES = ['expenses', 'categories', 'accounts', 'recurring', 'budgets'] as const;
type Table = (typeof TABLES)[number];

const MAX_BODY_BYTES = 5 * 1_000_000; // 5 MB, generoso para un respaldo personal completo
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

// Limitador "mejor esfuerzo": vive en memoria del isolate, se reinicia solo.
// No sustituye un limitador real (Durable Objects / Cloudflare Rate Limiting)
// pero frena abuso trivial sin anadir infraestructura.
const rateBuckets = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count++;
  return bucket.count <= RATE_LIMIT_MAX_REQUESTS;
}

function allowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = allowedOrigins(env);
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.SYNC_KEY) return false;
  const header = request.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return false;
  return timingSafeEqual(match[1], env.SYNC_KEY);
}

interface StoredRow {
  id: string;
  updated_at: number;
  deleted: number;
  data: string;
}

async function upsertRows(db: D1Database, table: Table, rows: Record<string, unknown>[]): Promise<void> {
  if (!rows.length) return;
  const stmt = db.prepare(
    `INSERT INTO ${table} (id, updated_at, deleted, data) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, deleted = excluded.deleted, data = excluded.data
     WHERE excluded.updated_at >= ${table}.updated_at`
  );
  const batch = rows.map((row) => {
    const id = String(row.id);
    const updatedAt = Number(row.updatedAt ?? 0);
    const deleted = row.deleted ? 1 : 0;
    return stmt.bind(id, updatedAt, deleted, JSON.stringify(row));
  });
  await db.batch(batch);
}

async function fetchChangesSince(db: D1Database, table: Table, since: number): Promise<unknown[]> {
  const { results } = await db
    .prepare(`SELECT data FROM ${table} WHERE updated_at > ?1 ORDER BY updated_at ASC LIMIT 5000`)
    .bind(since)
    .all<Pick<StoredRow, 'data'>>();
  return (results ?? []).map((r) => JSON.parse(r.data));
}

async function handleSync(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Cuerpo demasiado grande' }), { status: 413 });
  }

  let body: { since?: number; changes?: Partial<Record<Table, Record<string, unknown>[]>> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  const since = typeof body.since === 'number' ? body.since : 0;
  const changes = body.changes ?? {};

  for (const table of TABLES) {
    const rows = changes[table];
    if (Array.isArray(rows)) {
      await upsertRows(env.DB, table, rows);
    }
  }

  const responseChanges: Partial<Record<Table, unknown[]>> = {};
  for (const table of TABLES) {
    const rows = await fetchChangesSince(env.DB, table, since);
    if (rows.length) responseChanges[table] = rows;
  }

  return new Response(
    JSON.stringify({ serverTime: Date.now(), changes: responseChanges }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, name: 'gastos-sync' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    if (url.pathname !== '/sync') {
      return new Response('No encontrado', { status: 404, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Metodo no permitido', { status: 405, headers: cors });
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    try {
      const res = await handleSync(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(cors)) headers.set(k, v as string);
      return new Response(res.body, { status: res.status, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Error interno', detail: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }
};
