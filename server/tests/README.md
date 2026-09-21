# API tests

Basic API tests for board card #28. No VS Code extension, no account, no
paywall - just a plain TypeScript script run with `tsx` (already a project
dependency), using Node's built-in `fetch`.

## Running it

1. Start the server (`npm run dev` from the repo root, or `cd server && npm
   run dev`) so it's listening on `http://localhost:4000`.
2. From `server/`, run:
   ```
   npm run test:auth
   npm run test:events
   ```

Each one prints a pass/fail line per check and exits with a non-zero code
if anything fails, so they can be wired into `ci.yml` later if you want
them to gate PRs (they aren't right now - they need a real running server +
database, which CI doesn't spin up).

## What's covered

`auth.api.test.ts` runs 14 checks end-to-end against `/api/auth`:
registration (artist success, organizer success, missing fields, artist
without `artists_type`, duplicate email), login (success, missing fields,
wrong password), and the session lifecycle (`/me` unauthenticated, after
login, after token refresh, after logout, and confirming unauthenticated
again). It manages its own cookie jar between requests to mirror what a
real client does with the `access_token`/`refresh_token` cookies.

`events.api.test.ts` runs 26 checks end-to-end against `/api/events`
(board card #23): role-gated create (organizer only), validation (missing
fields, `endAt` <= `startAt`, invalid category), list/get/update/delete,
the full apply -> list applications -> accept/reject flow, duplicate-apply
and re-deciding-an-already-decided-application rejection, and ownership
checks (an artist can't touch organizer-only endpoints, only the owning
organizer can update/delete their own event). It logs in as three separate
users (organizer, artist, second artist) with three separate cookie jars in
the same run.

**Heads up if you're running `test:events` locally**: it queries the live
`event` table (singular - the one Kareem's been building, not `schema.sql`'s
`events`), extended with `venue_name`, `location` (PostGIS point),
`is_recurring`, `recurring_rule`, `status`, `updated_at`, and
`categories_needed` (an array of the existing `ArtistCategory` enum), plus a
new `event_applications` table. Your local Postgres needs the PostGIS
extension and those same columns/table before this will pass - see the
event-CRUD handoff for the exact `ALTER TABLE`/`CREATE TABLE` statements
(same ones already run against the real Supabase project).

Nothing else under `/api` is tested yet because nothing else is
implemented - `/api/artists`, `/api/media`, and `/api/conversations` all
still return `501 Not implemented` stubs. Add more `*.test.ts` files here
(and a matching `npm run test:*` script) as those land.

Every check in both files was run against the real controller/service code
(a throwaway local Postgres, not the real Supabase database) before being
committed, so the expected status codes are verified, not guessed.
