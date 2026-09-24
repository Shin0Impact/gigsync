// Applies ci-schema.sql to whatever DATABASE_URL points at. Used by CI to
// set up the ephemeral Postgres/PostGIS service container before the
// server starts, but works the same way against a local throwaway
// Postgres for manual testing.
//
// Deliberately a separate plain `pg` Client here instead of importing
// src/config/db.ts's pool - that pool pins the Supabase production root
// CA and only skips TLS for a `supabase.co` host, which is correct for
// the real app but irrelevant (and would just add friction) against a
// local/CI container that never proxies through Supabase at all.
//
// Usage: DATABASE_URL=postgres://... node tests/ci-apply-schema.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'ci-schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // A single query() call with a plain string runs as Postgres's simple
    // query protocol, which executes every ;-separated statement in the
    // file as one batch - no manual statement splitting needed, and none
    // of these CREATE statements contain a literal semicolon that could
    // trip up a naive split anyway.
    await client.query(sql);
    console.log(`Applied ${path.basename(sqlPath)} to ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply CI schema:', err);
  process.exit(1);
});
