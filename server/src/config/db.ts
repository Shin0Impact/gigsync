import { Pool, QueryResultRow } from 'pg';
import { env } from './env';

// Shared PostgreSQL/PostGIS connection pool. Import `query` from here rather
// than instantiating new pools/clients elsewhere.
let poolInstance: Pool | null = null;

try {
  poolInstance = new Pool({
    connectionString: env.databaseUrl,
    connectionTimeoutMillis: 3000,
  });

  poolInstance.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[AI Studio] PostgreSQL pool error (fallback active):', err.message);
  });
} catch {
  // eslint-disable-next-line no-console
  console.warn('[AI Studio] PostgreSQL not connected — using mock fallback');
}

export const pool = poolInstance ?? ({
  query: async () => ({ rows: [], rowCount: 0 }),
  connect: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {},
  }),
} as unknown as Pool);

export async function query<T extends QueryResultRow = any>(text: string, params?: unknown[]) {
  try {
    if (poolInstance) {
      return await poolInstance.query<T>(text, params);
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('[AI Studio] DB query failed, returning empty mock rows:', err.message);
  }
  return { rows: [] as T[], rowCount: 0 };
}
