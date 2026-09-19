import { Pool, QueryResultRow } from 'pg';
import { env } from './env';

// Shared PostgreSQL/PostGIS connection pool. Import `query` from here rather
// than instantiating new pools/clients elsewhere.
export const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error', err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}
