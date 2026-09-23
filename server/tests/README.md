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
   npm run test:event-media
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

`event_media.api.test.ts` runs 20 checks against `POST /api/media/upload-url`
and `/api/events/:id/media`: upload-url auth + validation (missing fields,
unsupported content type) and that it returns a real pre-signed R2 PUT URL
plus a sanitized `objectKey` under the requested folder; add/list/delete on
event media with ownership checks (only the owning organizer can add or
delete, an artist can't touch either write endpoint, listing is public);
validation (missing fields, invalid `mediaType`); and `sort_order` ordering
on list. Generating a pre-signed URL is a local HMAC computation - the AWS
SDK never makes a network call to do it - so this passes even with
placeholder `R2_*` credentials in `.env`. It does **not** prove an actual
`PUT` to that URL succeeds against a real R2 bucket - that still needs
manual verification once real R2 credentials are in place. Needs a new
`event_media` table (`id` uuid pk, `event_id` bigint references `event(id)`,
`media_type` varchar, `object_key` text, `alt_text` text, `sort_order` int,
`created_at`) - same handoff as the events-CRUD SQL.

`works.api.test.ts` runs 20 checks (plus up to 4 more) against
`POST /api/works`, `/api/works/:workId/updates`, and
`/api/works/updates/:updateId/media` - the "artist uploads" slice of
Kareem's works/work_updates/update_media schema (see
`server/src/db/social.queries.ts`): create work requires auth + the artist
role; add update/add media both require ownership, walking
update -> work -> userId; validation; listing works/updates/media is
public; and delete media requires ownership + does the same real R2
round-trip/cleanup proof as event_media (checks 15b-15d/19b, skipped not
failed when `R2_PUBLIC_URL` isn't set).

`showcase.api.test.ts` runs 17 checks against
`POST/GET/DELETE /api/media/showcases`. Showcasing is a PIN, not an
upload - a user stars an `event_media` or `update_media` row they already
own onto their profile, so this file creates its pin targets via the
works endpoints rather than uploading anything itself (the real upload
proof lives in `works.api.test.ts`). Covers: pin requires auth + self-
ownership of the source media (403 on someone else's); validation
(missing/invalid `sourceType`); pinning the same media twice is a 409, not
a duplicate row; a 4th pin is rejected once the cap (`MAX_SHOWCASE_ITEMS`
in `showcase.service.ts`, currently 3) is hit; listing is public and
resolves each pin to its underlying `objectKey`; and unpin requires
ownership of the *pin* (not the source media), 404s on a nonexistent id,
and leaves the underlying media row untouched.

Needs a new `showcase_items` table shape - it's no longer upload-based.
Run this in Supabase's SQL Editor (same handoff pattern as `event_media`):

```sql
ALTER TABLE showcase_items
  DROP COLUMN media_type,
  DROP COLUMN object_key,
  DROP COLUMN alt_text,
  ADD COLUMN event_media_id uuid REFERENCES event_media(id) ON DELETE CASCADE,
  ADD COLUMN update_media_id bigint REFERENCES update_media(id) ON DELETE CASCADE,
  ADD CONSTRAINT showcase_items_exactly_one_source CHECK (
    (event_media_id IS NOT NULL AND update_media_id IS NULL) OR
    (event_media_id IS NULL AND update_media_id IS NOT NULL)
  );
```

Nothing else under `/api` is tested yet because nothing else is
implemented - `/api/artists` and `/api/conversations` still return
`501 Not implemented` stubs. Add more `*.test.ts` files here (and a
matching `npm run test:*` script) as those land.

Every check in all three files was run against the real controller/service code
(a throwaway local Postgres, not the real Supabase database) before being
committed, so the expected status codes are verified, not guessed.
