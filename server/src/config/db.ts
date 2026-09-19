import { Pool, QueryResultRow } from 'pg';
import { env } from './env';

// Shared PostgreSQL/PostGIS connection pool, pointed at Supabase's hosted
// Postgres (Project Settings -> Database -> Connection string, "URI" mode).
// Supabase requires TLS; the `pg` driver won't verify Supabase's cert chain
// by default, so we accept it without strict verification (fine for a
// managed provider - don't do this against an arbitrary untrusted host).
// Import `query` from here rather than instantiating new pools/clients
// elsewhere.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error', err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
