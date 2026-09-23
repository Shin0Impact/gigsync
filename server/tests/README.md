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

`event_media.api.test.ts` runs 20 checks (plus up to 3 more, see below)
against `POST /api/media/upload-url` and `/api/events/:id/media`: upload-url
auth + validation (missing fields, unsupported content type) and that it
returns a real pre-signed R2 PUT URL plus a sanitized `objectKey` under the
requested folder; add/list/delete on event media with ownership checks (only
the owning organizer can add or delete, an artist can't touch either write
endpoint, listing is public); validation (missing fields, invalid
`mediaType`); and `sort_order` ordering on list. Needs a new `event_media`
table (`id` uuid pk, `event_id` bigint references `event(id)`, `media_type`
varchar, `object_key` text, `alt_text` text, `sort_order` int, `created_at`)
- same handoff as the events-CRUD SQL.

**Real R2 round-trip (checks 07b-07d):** generating a pre-signed URL is a
local HMAC computation - the AWS SDK never makes a network call to do it -
so checks 01-07 and 08-20 all pass even with placeholder `R2_*` credentials
in `.env`, proving only that the signing logic is correct. Checks 07b-07d
go further: they actually `PUT` a real 1x1 PNG to the presigned URL, then
`GET` it back from `R2_PUBLIC_URL` and diff the bytes, so a pass there is
the real proof an upload works against your actual bucket. They
automatically skip (not fail) if `R2_PUBLIC_URL` isn't set in `.env`, so
teammates without real R2 credentials configured yet still get a clean run
on everything else.

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

`showcase.api.test.ts` runs 23 checks against
`POST/GET/DELETE /api/media/showcases`. Showcasing pins a whole PROJECT or
EVENT, not a single post/media file: an artist pins one of their own
`works`, an organizer pins one of their own `event`s. A work has many
versions (`work_updates`) over time, so the pin points at the work itself,
not one update - the showcase always reflects the project's current
state. This file creates its pin targets via the works/events endpoints
rather than uploading anything itself (the real upload proof lives in
`works.api.test.ts` / `event_media.api.test.ts`). Covers: pin requires
auth + self-ownership of the source (403 on someone else's work or
event); validation (missing/invalid `sourceType`); pinning the same
work/event twice is a 409, not a duplicate row; a 4th pin is rejected once
the cap (`MAX_SHOWCASE_ITEMS` in `showcase.service.ts`, currently 3) is
hit; adding a NEW update to an already-pinned work, then confirming the
showcase listing picks it up - proves the pin isn't frozen on whatever
version existed when it was created; listing is public and resolves a
pinned work to every update + all their media, a pinned event to its
event_media; both source types are exercised; and unpin requires
ownership of the *pin* (not the source), 404s on a nonexistent id, and
leaves the underlying work/event untouched.

Needs a new `showcase_items` table shape - references whole works, not
updates or media rows. Run this in Supabase's SQL Editor. If you're
migrating from the *previous* iteration (`work_update_id`), drop that
constraint by name first or Postgres will refuse the column drop:

```sql
ALTER TABLE showcase_items
  DROP CONSTRAINT showcase_items_exactly_one_source,
  DROP COLUMN work_update_id,
  ADD COLUMN work_id bigint REFERENCES works(id) ON DELETE CASCADE,
  ADD CONSTRAINT showcase_items_exactly_one_source CHECK (
    (event_id IS NOT NULL AND work_id IS NULL) OR
    (event_id IS NULL AND work_id IS NOT NULL)
  );
```

`verification.api.test.ts` runs 23 checks against
`/api/verification/social-links`, `/api/verification/id-upload-url`,
`/api/verification/requests`, `/api/verification/status/:userId`, and the
moderator-only `/api/verification/requests/:id/id-document` (card #82).
Covers: requesting an ID document upload URL requires auth; submitting a
verification request without an `idDocumentObjectKey` is rejected (400);
submitting a request before meeting the eligibility bar (no social link,
or fewer than 3 prior works/events) is rejected with a specific reason,
not a generic error; meeting the bar (>=1 social link, >=3 works for an
artist or >=3 events for an organizer, plus an uploaded ID document key)
lets the request through; a `fan` can't request at all (only
artist/organizer are eligible roles); submitting twice while already
pending is a 409, not a duplicate row; the moderator queue
(`GET /api/verification/requests`), review endpoint
(`PATCH /api/verification/requests/:id`), and the ID document view URL
(`GET /api/verification/requests/:id/id-document`) are all role-gated to
moderator/admin - a non-moderator gets 403 on each; approving flips
`profiles.is_verified` to true, reflected on the public status endpoint;
rejecting does not verify the user; and reviewing an already-decided
request again is a 409.

This does not upload real bytes to R2 - it only exercises presigned-URL
issuance and the objectKey plumbing through `submit_verification_request`.
The id-upload-url calls still need `R2_ID_DOCUMENTS_BUCKET_NAME` set to a
real bucket or they'll fail with a 400 ("ID document uploads are not
configured").

ID documents are deliberately stored in a SEPARATE, PRIVATE R2 bucket from
the rest of the app's media - not the existing `gigsync-media` bucket,
which has a public dev URL enabled (fine for event photos/work media, not
for government ID scans). The new bucket must NOT have a public dev URL:
every read goes through a short-lived (5 min) presigned GET URL, issued
only via the moderator-gated `/id-document` route. You'll need to:

1. Create a new, separate R2 bucket in Cloudflare (do not enable its
   public dev URL).
2. Set `R2_ID_DOCUMENTS_BUCKET_NAME` in the server's env to that bucket's
   name.
3. Make sure your R2 API token's scope covers the new bucket too - the
   existing token was scoped only to `gigsync-media`.

Needs three new pieces of schema - `social_links`, `verification_requests`
(with a required `id_document_key`), and `profiles.is_verified`. Uses a
Postgres enum for status, matching the existing `event_status` /
`application_status` convention rather than an unconstrained varchar. Run
this in Supabase's SQL Editor:

```sql
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform varchar NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

CREATE TABLE verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'pending',
  id_document_key text NOT NULL,
  notes text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;

CREATE INDEX idx_verification_requests_status ON verification_requests (status);
CREATE INDEX idx_verification_requests_user_id ON verification_requests (user_id);
CREATE INDEX idx_social_links_user_id ON social_links (user_id);
```

Note: `social_links` is a placeholder for real OAuth social-account
connecting, which isn't built yet - for now it's just a self-reported
platform + URL, enough to prove "has a social presence" at request time.
Swap this out once real connecting lands.

`artists.api.test.ts` runs 21 checks against
`PATCH /api/artists/me/emergency-status`, `GET /api/artists/:userId/emergency-status`,
and `GET /api/artists/emergency-available` (card #25 - "Emergency
Availability Search" from the design doc). This is the other half of a
feature that was already partly built: the Socket.IO `emergency_status_changed`
broadcast (`sockets/index.ts`) existed before this REST layer did. Covers:
toggling requires auth + the artist role; turning availability ON requires
lat/lng, turning it OFF doesn't (the existing location is left alone); a
past `emergencyUntil` is rejected; out-of-range lat/lng/radius_km are
rejected, including a missing/non-numeric query param (which becomes
`NaN`, not a clean type mismatch - validation uses `Number.isFinite`, not
`typeof`, specifically to catch this); searching finds an available artist
inside the radius and excludes one ~130km away (NYC vs. Philadelphia is
the fixture - close enough to be realistic for an "emergency, same-day"
feature, far enough to cross a 50km test radius); a 150km radius (still
under the service's 200km cap) finds both; turning availability back off
removes that artist from search results immediately, AND stops exposing
their last-known coordinates via the public status-read endpoint (only
`isEmergencyAvailable`/`emergencyUntil` remain visible - their location
isn't left publicly queryable forever just because they were emergency
available once); and the public status endpoint reports the *effective*
current state (accounting for an expired `emergencyUntil`, not just the
raw stored boolean) for any single artist.

Does NOT assert on the Socket.IO broadcast itself - there's no
`socket.io-client` dev dependency in this repo to drive that from a plain
`fetch`-based test file. Verify that part manually: connect a socket
client, PATCH the status, confirm `emergency_status_changed` arrives.

Needs three new columns on the live `profiles` table (not run yet):

```sql
ALTER TABLE profiles
  ADD COLUMN location geography(Point, 4326),
  ADD COLUMN is_emergency_available boolean NOT NULL DEFAULT false,
  ADD COLUMN emergency_until timestamptz;

CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_profiles_emergency_available
  ON profiles (is_emergency_available)
  WHERE is_emergency_available = true;
```

Note: there's no background job flipping `is_emergency_available` back to
false once `emergency_until` passes - the search query
(`find_emergency_available_near` in `db/queries/profiles.queries.ts`)
just filters out any row whose `emergency_until` is in the past, live, on
every search. An artist can also always turn it off early via the same
PATCH. `GET /api/artists/search` (card #24, general category/radius
artist search) is a separate, still-`501` stub - not part of this file.

Nothing else under `/api` is tested yet because nothing else is
implemented - `/api/artists` and `/api/conversations` still return
`501 Not implemented` stubs. Add more `*.test.ts` files here (and a
matching `npm run test:*` script) as those land.

Every check across all these files was run against the real controller/
service code before being committed, so the expected status codes are
verified, not guessed - the earlier files (auth/events/event_media/
showcase/works) against a throwaway local Postgres; verification.api.test.ts
(23/23) and artists.api.test.ts (21/21) were run and confirmed passing
against the real Supabase database, since that's what's actually running
locally by this point in the project.
