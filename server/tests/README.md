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
   npm run test:sockets
   npm run test:rate-limit
   npm run test:login-timing
   ```

Each one prints a pass/fail line per check and exits with a non-zero code
if anything fails, so they can be wired into `ci.yml` later if you want
them to gate PRs (they aren't right now - they need a real running server +
database, which CI doesn't spin up).

## What's covered

`auth.api.test.ts` runs 18 checks end-to-end against `/api/auth`:
registration (artist success, organizer success, missing fields, artist
without `artists_type`, too-short password, duplicate email, and that
self-assigning the `moderator`/`admin` role is rejected and doesn't
actually create an account), login (success, missing fields, wrong
password), and the session lifecycle (`/me` unauthenticated, after login,
after token refresh, after logout, and confirming unauthenticated again).
It manages its own cookie jar between requests to mirror what a real
client does with the `access_token`/`refresh_token` cookies. Passwords
must be at least 8 characters (length only, no forced complexity - see
the comment in `register_user`).

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

`event_media.api.test.ts` runs 22 checks (plus up to 3 more, see below)
against `POST /api/media/upload-url` and `/api/events/:id/media`: upload-url
auth + validation (missing fields, unsupported content type, and - security
fix - a missing or over-the-cap `fileSizeBytes`) and that it returns a real
pre-signed R2 PUT URL plus a sanitized `objectKey` under the requested
folder; add/list/delete on event media with ownership checks (only
the owning organizer can add or delete, an artist can't touch either write
endpoint, listing is public); validation (missing fields, invalid
`mediaType`); and `sort_order` ordering on list. Needs a new `event_media`
table (`id` uuid pk, `event_id` bigint references `event(id)`, `media_type`
varchar, `object_key` text, `alt_text` text, `sort_order` int, `created_at`)
- same handoff as the events-CRUD SQL.

**Security fix (`upload-url` size cap):** nothing capped the size of a file
a presigned URL would accept before this - a caller could request a URL for
a "photo" and PUT a multi-gigabyte file into R2 with it. `POST
/api/media/upload-url` now requires a `fileSizeBytes` field, rejects it
outright over 50MB (`MAX_UPLOAD_SIZE_BYTES` in `media.service.ts`), and
signs `ContentLength` into the presigned URL itself so R2 rejects the
actual PUT if its real `Content-Length` doesn't match what was declared -
a client can't get a URL for a small declared size and then stream
something bigger into it. This does NOT verify the uploaded bytes actually
match the declared `contentType` (that would need inspecting the real
bytes after upload, e.g. magic-number sniffing or a content-scan step) -
still a known gap, just a smaller one than "no size limit at all".

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

Does NOT assert on the Socket.IO `emergency_status_changed` broadcast
itself - PATCH-ing the status is covered here, but proving the broadcast
actually arrives on a connected socket needs a `socket.io-client`, which
`sockets.conversation-auth.test.ts` (below) now pulls in as a dev
dependency for its own coverage. Still worth wiring up as its own check if
this area gets touched again; for now, verify manually: connect a socket
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

`sockets.conversation-auth.test.ts` runs 7 checks against the Socket.IO
gateway's `join_conversation`/`send_message` handlers (`sockets/index.ts`)
- a security fix: those handlers previously did zero authorization, so any
authenticated user could join or send into ANY conversation room just by
knowing/guessing a `conversationId`. `POST /api/conversations` is still a
`501` stub, so there's no REST endpoint yet to create a conversation or
add a participant - unlike every other file here, this one talks to the
DB directly (`query` from `src/config/db`) to set up a conversation +
`conversation_participants` fixture row, then drives the actual gateway
with a real `socket.io-client` connection authenticated via the same
`access_token` cookie the HTTP tests use. Covers: the real participant can
join and send a message, which is actually persisted; a non-participant is
rejected on both `join_conversation` and `send_message` (not just told no
- checked directly against the `messages` table, so a rejected send
genuinely writes nothing); and an empty `conversationId` is rejected
outright. All fixture rows (messages, participant, conversation, both test
users) are deleted at the end of the run.

Needs the `conversations`/`conversation_participants`/`messages` tables,
which are in `schema.sql` but were never actually applied to the live
Supabase project (unlike everything else in that file). Run this in
Supabase's SQL Editor:

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Not a FK yet: schema.sql's `events` (plural) was superseded by the
  -- live `event` (singular) table (see the events.api.test.ts note
  -- above) before this table was ever applied. Add a real FK once
  -- card #76 settles whether/how a conversation links to an event.
  event_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
```

`rateLimit.api.test.ts` runs 6 checks against the rate limiting added to
`POST /api/auth/register` and `POST /api/auth/login`
(`src/middleware/rateLimit.middleware.ts`) - a security fix, since neither
endpoint had any throttling before (nothing stopped a script from
brute-forcing `/login` or mass-creating accounts via `/register` as fast
as the network allowed). Each limiter allows 20 requests/minute per IP.
This file fires a burst of 30 concurrent requests at each endpoint with
deliberately-invalid payloads (missing fields for register, bad
credentials for login) so it proves the limiter without creating any real
accounts or leaving fixture rows to clean up - the earliest requests in
each burst still get their normal validation response (400/401), and once
the cap is hit the rest come back 429.

**Heads up if you run the full suite back to back**: this file spends a
chunk of the 1-minute window for whichever endpoint it just hit, so a
different file's first request or two can occasionally see a 429 if it
lands in the same window right after. That's the limiter working as
intended, not a bug - wait a few seconds and re-run.

`loginTiming.api.test.ts` runs 4 checks against the login timing
side-channel fix in `login_user` (`src/services/auth.service.ts`) - it
used to return immediately (skipping `bcrypt.compare` entirely) when the
identifier didn't match any user, but ran a real cost-12 `bcrypt.compare`
when it did. Same generic "Invalid credentials" error either way, but the
RESPONSE TIME gave away whether an email was actually registered - enough
to enumerate real accounts via timing alone. This file times 5 sequential
wrong-password attempts against a real (freshly registered) user against
5 attempts against a made-up email, and checks the two medians land
within a loose 2x-ish ratio of each other (comfortably passes normal
network/DB jitter, clearly fails the old skip-bcrypt behavior). Only 10
login attempts total, well under the 20/minute limit on its own - but
don't run it in the same 60s window as `test:auth` or `test:rate-limit`,
which both also hit `/auth/login`; check 01 fails clearly (instead of
reporting bogus timing) if it gets rate-limited.

Nothing else under `/api` is tested yet because nothing else is
implemented - `/api/artists` and `/api/conversations` still return
`501 Not implemented` stubs. Add more `*.test.ts` files here (and a
matching `npm run test:*` script) as those land.

Every check across all these files was run against the real controller/
service code before being committed, so the expected status codes are
verified, not guessed - the earlier files (auth/events/event_media/
showcase/works) against a throwaway local Postgres; artists.api.test.ts
(21/21) was run and confirmed passing against the real Supabase database,
since that's what's actually running locally by this point in the
project. (verification.api.test.ts is covered on its own branch,
feature/verification-id-documents / PR #89 - not part of this one.)
