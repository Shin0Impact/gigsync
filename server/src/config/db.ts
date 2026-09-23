import { Pool, QueryResultRow, types } from 'pg';
import { env } from './env';
import { SUPABASE_ROOT_CA } from './supabaseRootCa';

// `pg` returns bigint (OID 20 - int8) columns as strings by default, since
// a bigint can exceed Number.MAX_SAFE_INTEGER and silently lose precision
// as a JS number. Nothing in this app's bigint columns (event.id,
// event_applications.event_id, the social-schema tables' ids, etc.) will
// ever realistically get that large, and returning them as strings makes
// every equality check against a parsed route param ("123" !== 123) a
// silent bug instead of a type error - so parse them to numbers globally,
// once, here.
types.setTypeParser(20, (value: string) => parseInt(value, 10));

// Shared PostgreSQL/PostGIS connection pool, pointed at Supabase's hosted
// Postgres (Project Settings -> Database -> Connection string, "URI" mode).
// `ca: SUPABASE_ROOT_CA` above is what makes this actually verify the
// connection now (rejectUnauthorized defaults to true whenever `ca` is
// set) - a previous version disabled verification entirely
// (rejectUnauthorized: false), which encrypted the connection but never
// checked WHO was on the other end, so a MITM presenting any certificate
// at all would have gone undetected.
// Import `query` from here rather than instantiating new pools/clients
// elsewhere.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('supabase.co') ? { ca: SUPABASE_ROOT_CA } : undefined,
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
