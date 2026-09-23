# Full-Stack Capstone Design Document

## 1. Overview & Goals

### Project Name

**GigSync** (or **TalentSync**)

### The Problem

Booking performers and creative talent locally is fragmented and inefficient. Event organizers, venue managers, theater directors, and private hosts reach out to individual artists one by one via direct messages or phone calls. This creates communication bottlenecks when filling open slots or replacing last-minute cancellations. Concurrently, emerging talent across multiple artistic fields—musicians, dancers, stand-up comedians, DJs, painters, visual artists, and circus performers—struggle to gain exposure or secure consistent gig opportunities.

### Goals

- Create a multi-disciplinary marketplace connecting creative performers, visual artists, event organizers, venue owners, and fans.
- Support a wide variety of **Art Categories** (Music, Dance, Stand-up Comedy, Live Painting/Visual Arts, Theater/Acting, DJing, Magic/Performance Art).
- Provide an **Emergency Availability Search** feature allowing organizers to instantly locate available artists for immediate or same-day slots using precise geospatial radius filtering.
- Implement tailored view interfaces for distinct user roles: Artist, Event Organizer, Fan, and Admin/Moderator.
- Enable direct messaging, media portfolio showcases, event discovery, review-based trust verification, and administrative content moderation.

### Non-Goals (v1 Scope Boundaries)

- In-app escrow, payment processing, or direct ticketing (v1 focuses on discovery, availability matching, application workflows, and direct communication).
- Server-side video transcoding or audio processing pipelines (media files are validated by type/size on upload and stored directly in Cloudflare R2).

## 2. Requirements

### Functional Requirements

- **Authentication & Authorization**: Custom Node.js + Express auth using `bcrypt` password hashing, short-lived JSON Web Tokens (JWT), and HTTP-only cookies supporting role-based access control (RBAC) across Artists, Organizers, Fans, Admins, and Moderators.
- **Multidisciplinary Profiles**: Artist profiles equipped to store category-specific portfolio assets (images, raw audio clips, and video files) uploaded directly to object storage.
- **Availability & Emergency Toggle**: Artists can manage regular calendar availability or trigger a time-bound emergency "Available Today" status.
- **Geospatial Proximity Search**: Query artists by current location radius using PostgreSQL's native `PostGIS` spatial indexing (`ST_DWithin`, `ST_DistanceSphere`).
- **Event Management & Recurrence**: Organizers post events requiring specific art categories, review applicant profiles, accept/reject performers, and manage recurring schedules.
- **Real-time Messaging & Notifications**: Instant message delivery and socket event broadcasts via Socket.IO using persistent database conversations and participant tracking.
- **Trust, Reviews & Moderation**: Verified badges ("Earning Trust"), double-blind review system after completed gigs, user reporting mechanisms, and administrative content deletion.

### Non-Functional Requirements

- **Performance**: Sub-500ms response times on geospatial radius queries and real-time Socket.IO message delivery.
- **Data Integrity**: Relational integrity via PostgreSQL foreign keys, unique constraints, check constraints, and transactional safety.
- **Usability & Accessibility**: Responsive, accessible layout adhering to WCAG 2.1 AA standards.

## 3. Tech Stack & Library Justification

### Core Tech Stack

- **Frontend**: React + TypeScript + Redux Toolkit
- **Backend**: Node.js + Express + TypeScript (`bcrypt`, `jsonwebtoken`, `@aws-sdk/client-s3` for R2)
- **Database**: PostgreSQL with PostGIS extension, hosted on **Supabase** (managed via the `pg` driver). Supabase is used only as managed Postgres+PostGIS here — we are intentionally *not* using Supabase Auth, Storage, or Realtime, so that auth stays a hand-rolled bcrypt + JWT implementation (a graded requirement) and storage/real-time stay on Cloudflare R2 / Socket.IO as originally planned.
- **Object Storage**: Cloudflare R2 (S3-compatible, zero-egress byte storage for avatars, portfolio assets, and gig media)
- **Real-time Engine**: Socket.IO
- **Version Control & CI/CD**: GitHub (source code management, pull request code reviews, issue tracking, and automated CI/CD pipeline tests) — see note below.

> **Note on version control**: the original draft of this doc named GitLab, but
> the bootcamp's grading rubric (Ch. 5 of the assignment brief) requires a
> shared **GitHub** repo with branch protection and PR review. This repo is
> set up for GitHub accordingly — update this section if that changes.

### Stack Justification

- **Custom Node.js + Express Auth**: Provides full control over token lifetimes, refresh token rotation, cookie security flags (`HttpOnly`, `SameSite`, `Secure`), and RBAC middleware without third-party vendor lock-in.
- **PostgreSQL + PostGIS**: PostGIS provides production-grade spatial indexing (`GIST`) and exact distance calculations (`ST_DWithin`). Relational tables strictly enforce foreign key integrity for conversations, applications, reviews, and category hierarchies.
- **Cloudflare R2**: Offers S3-compatible object storage for hosting actual binary media files (images, audio, video, avatars) without data egress fees, keeping asset serving fast and cost-effective.
- **Socket.IO**: Satisfies the real-time requirements for persistent chat room connections, typing indicators, read receipts, and live emergency availability broadcasts.
- **GitHub**: Serves as the development platform for git version control, branch protection, pull request review, and CI execution.

## 4. Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │            Client (Browser)             │
                     │   React + Redux Toolkit + TypeScript   │
                     └────────────────────┬────────────────────┘
                                          │
                        HTTPS / REST API  │  WebSockets
                         (JSON Requests)  │  (Socket.IO)
                                          │
                                          v
                     ┌─────────────────────────────────────────┐
                     │        Node.js + Express Server         │
                     │  - Custom JWT & Bcrypt Auth Middleware  │
                     │  - REST Controllers & PostGIS Queries   │
                     │  - S3 SDK Client (Cloudflare R2)        │
                     │  - Socket.IO Gateway / Event Handlers   │
                     └───────────┬──────────────┬──────────────┘
                                 │              │
            SQL / PostGIS        │              │ Direct Binary Uploads
            (Native PG Client)   │              │ (Signed URLs / S3 API)
                                 v              v
                   ┌──────────────────┐    ┌──────────────────┐
                   │ PostgreSQL +     │    │ Cloudflare R2    │
                   │ PostGIS Database │    │ Object Storage   │
                   └──────────────────┘    └──────────────────┘
```

## 5. Data Model (PostgreSQL / PostGIS Schema)

See [`server/src/db/schema.sql`](../server/src/db/schema.sql) for the live,
runnable version of this schema.

**Decision: no shared mock-data file.** Early on, a `server/src/db/mockStore.ts`
was drafted to fake data for endpoints before Supabase was ready. We dropped
that approach — every mismatch between the mock literals and the shared
TypeScript types turned into a build failure, because two people were
hand-maintaining the same shape in two places with nothing enforcing they
stayed in sync. Now that Supabase is live:
- Kareem seeds a handful of real rows directly in Supabase (SQL Editor or a
  small seed script) and endpoints query Postgres for real, so the type
  contract is enforced by actual query results instead of by hand.
- If a screen's backend endpoint isn't ready yet, whoever's building that
  screen hardcodes 2-3 example objects locally in that component (not a
  shared file) and deletes them once the real endpoint exists.

### 5a. Schema drift: live Supabase vs. `schema.sql` (as of 2026-09-23)

The tables actually running in the team's Supabase project still do **not**
match `server/src/db/schema.sql` above, but the gap has narrowed a lot since
this section was last written — the singular `event` table has since been
extended (additively, via `ALTER TABLE`, not recreated) to cover the
marketplace/gig-booking model, and two new tables now support it. This
section documents what's actually live so the rest of the team isn't
working from a stale picture. Treat this as in-flux and owned by Kareem;
update it as the schema settles rather than treating it as final.

**Tables currently in Supabase (`public` schema):**

| Table | Columns (name: type) |
| --- | --- |
| `profiles` | `id` (bigint), `created_at` (timestamptz), `user_name` (text), `user_id` (uuid), `avatar_url` (text), `followers_number` (bigint), `artists_type` (enum) |
| `roles` | `user_id` (uuid), `role` (enum), `created_at` (timestamptz) |
| `followings` | `id` (bigint), `created_at` (timestamptz), `user_id` (uuid), `followed_id` (uuid) |
| `works` | `id` (bigint), `created_at` (timestamptz), `description` (text), `user_id` (uuid), `updated_at` (timestamptz) |
| `work_updates` | `id` (bigint), `created_at`, `updated_at` (timestamptz), `work_id` (bigint), `version_number` (bigint), `description` (text) |
| `update_media` | `id` (bigint), `created_at` (timestamptz), `update_id` (bigint), `media_type` (text), `r2_key` (text), `mime_type` (text), `file_size` (bigint), `sort_order` (bigint) |
| `work_likes` | `id` (bigint), `created_at` (timestamptz), `work_id` (bigint), `user_id` (uuid) |
| `work_comments` | `id` (bigint), `created_at` (timestamptz), `work_id` (bigint), `user_id` (uuid), `content` (text), `updated_at` (timestamptz) |
| `event` | `id` (bigint), `created_at` (timestamptz), `start_at`/`end_at` (timestamp), `organizer_id` (uuid, FK -> `users`), `title` (text), `descriptions` (text), `venue_name` (text), `location` (`geography(Point, 4326)`), `is_recurring` (boolean), `recurring_rule` (varchar), `status` (enum `event_status`: `open`/`filled`/`completed`/`cancelled`), `categories_needed` (`"ArtistCategory"[]`), `updated_at` (timestamptz) |
| `event_applications` | `id` (uuid), `event_id` (bigint, FK -> `event`), `artist_id` (uuid, FK -> `users`), `status` (enum `application_status`: `pending`/`accepted`/`rejected`), `cover_note` (text), `applied_at`/`updated_at` (timestamptz) |
| `event_media` | `id` (uuid), `event_id` (bigint, FK -> `event`), `media_type` (varchar), `object_key` (text), `alt_text` (text), `sort_order` (integer), `created_at` (timestamptz) |

Notes:
- `artists_type` (on `profiles`) and `role` (on `roles`) are Postgres enum
  types — see `server/src/types/social.ts` for the resolved value lists
  once confirmed.
- `event`'s original `post_id` FK to `work_updates` is gone — it no longer
  ties to the feed/post model at all. It's now a standalone bookable gig
  listing with its own title/description/venue/categories, matching the
  original marketplace concept this doc describes in sections 1-2. Event
  CRUD + applications (board card #23) and event media (R2-backed uploads)
  both ship against this table now — see `server/src/db/queries/events.queries.ts`
  and `server/src/db/queries/event_media.queries.ts`.
- `categories_needed` reuses the existing `"ArtistCategory"` enum (values:
  `painter`, `photographer`, `designer`, `musician`) rather than a separate
  categories table, per the team's addition-only preference.
- `location` is a real PostGIS `geography(Point, 4326)` column now, so
  proximity-based search (artist search, emergency search) has something to
  query against for `event` -- `ST_Y`/`ST_X` on the geometry cast give
  lat/lng back out. Artist-level location for `#24`/`#25` (artist search,
  emergency availability) still needs its own geospatial column on
  `profiles`/`users` -- not addressed yet.
- All primary keys here are still `bigint` (auto-increment) except the two
  new join-ish tables (`event_applications`, `event_media`), which use
  `uuid` -- still a mixed convention worth reconciling eventually, but new
  tables are deliberately using `uuid` to match the rest of the schema's
  convention going forward.
- **Open item (`#81`, assigned to all three, scoped to Kareem for now):** a
  user being simultaneously an artist *and* an organizer isn't supported by
  the current schema -- `roles.user_id` is the table's primary key, meaning
  one role per user by design. Supporting dual roles needs an actual schema
  change (e.g. a composite `(user_id, role)` key instead), not just an
  app-logic tweak. Scoped as schema-plus-logic work, not just logic.
- **Recurring events**: `is_recurring`/`recurring_rule` columns exist on
  `event` but nothing reads or interprets them yet -- no logic generates
  future occurrences, and `recurring_rule` has no enforced format. Kareem is
  taking this end-to-end (`#72` "create recurring database function"); a
  duplicate card (`#80`) exists under Shin from before the split and should
  get closed once `#72` lands rather than tracked separately.

## 6. API Design & Storage Integration

### Custom Node.js Auth Routes (`/api/auth`)

- `POST /api/auth/register` — Hash password via `bcrypt`, store user record, issue HTTP-only JWT cookie.
- `POST /api/auth/login` — Validate credentials, issue access/refresh JWTs.
- `POST /api/auth/logout` — Clear auth cookies.
- `GET /api/auth/me` — Verify JWT payload and return current user profile.

### Cloudflare R2 Media Upload Routes (`/api/media`) -- **implemented & R2-verified**

- `POST /api/media/upload-url` — Request a pre-signed PUT URL for direct R2 binary uploads (validates content-type against an allow-list, sanitizes the filename, scopes the object key under a `folder`). **Live**: R2 credentials are configured (bucket `gigsync-media`), and `server/tests/event_media.api.test.ts` does a real `PUT` to the presigned URL and reads it back from the public URL to prove the round trip, not just that the signature is well-formed.
- `POST /api/showcases` — still a `501` stub. Same presign/upload pattern as event media, just needs a `showcases` table + service (board card `#78`).
- `DELETE /api/showcases/:id` — still a `501` stub; once implemented, needs to delete both the DB row and the R2 object (see note below -- event media had this exact gap and it's now fixed there).

### Geospatial & Artist Routes (`/api/artists`)

- `GET /api/artists/search?category_id=&lat=&lng=&radius_km=` — not implemented yet (`501` stub, board card `#24`).
- `GET /api/artists/emergency-available?lat=&lng=&radius_km=` — not implemented yet (`501` stub, board card `#25`).
- `PATCH /api/artists/me/emergency-status` — not implemented yet (`501` stub, board card `#25`).

### Event & Application Routes (`/api/events`) -- **implemented (board card #23)**

- `POST /api/events` — Create gig listing requiring specific art categories (Organizer role only).
- `GET /api/events/:id`, `PATCH /api/events/:id`, `DELETE /api/events/:id` — read/update/delete, with ownership checks (only the owning organizer can update/delete).
- `POST /api/events/:id/apply` — Submit artist application with an optional cover note; rejects duplicate applications.
- `GET /api/events/:id/applications` — Organizer-only list of applicants.
- `PATCH /api/events/:id/applications/:appId` — Accept/reject applicant status (rejects re-deciding an already-decided application).
- `POST /api/events/:id/media`, `GET /api/events/:id/media`, `DELETE /api/events/:id/media/:mediaId` — event flyer/photo/video attachments backed by the R2 upload-url flow above (ownership-checked on write, public on read). Deleting a media item deletes both the DB row and the underlying R2 object.
- Covered end-to-end by `server/tests/events.api.test.ts` (26 checks) and `server/tests/event_media.api.test.ts` (24 checks) -- see `server/tests/README.md`.

### Real-time Messaging Routes (`/api/conversations`)

- `POST /api/conversations` — not implemented yet (`501` stub, board card `#76`).
- `GET /api/conversations/:id/messages` — not implemented yet (`501` stub, board card `#76`). Once built, this is what the Socket.IO gateway's in-memory-fallback placeholder (section 7) needs real conversation rows to persist against.

## 7. Frontend Architecture & Socket.IO Plan

### Redux State Shape (`store/index.ts`)

See [`client/src/store/index.ts`](../client/src/store/index.ts) and the
slices under `client/src/store/slices/` for the live version of this shape.

### Socket.IO Integration Mechanics

1. **Authentication Handshake**: Socket connection authenticates using the HTTP-only JWT cookie passed in the connection header. *(Status: implemented for real now that `/api/auth` exists -- the handshake verifies the JWT via `jwt.verify()`; the old placeholder that trusted a plain `userId` has been removed. See `server/src/sockets/index.ts`.)* Message persistence still degrades gracefully to an in-memory fallback when the referenced `conversations` row doesn't exist, since `POST /api/conversations` (`#76`) isn't built yet -- check the server console for fallback warnings.
2. **Room Joining**: Users automatically join rooms corresponding to their `conversation_id` records (`socket.join(conversationId)`).
3. **Event Drivers**:
    - `send_message` / `receive_message`: Delivers instant messages and updates state via Redux.
    - `emergency_status_changed`: Broadcasts live alerts when an artist within an organizer's active view toggles emergency availability.

## 8. Division of Work & Timeline (3 Developers)

### Team Division

- **Kareem Shuhadh (Backend)**: Node.js/Express JWT auth framework, PostgreSQL schema + Supabase/PostGIS setup, Event CRUD, application workflows, artist search and emergency-availability search APIs, Cloudflare R2 pre-signed upload integration, review system, and moderation logic.
- **Jinad Abd Alkader (Frontend)**: React page shells and routing, Login/Register UI, artist search and emergency-search views, event board, multi-category artist profile pages, chat UI, design system, and the WCAG 2.1 AA accessibility pass.
- **Maher / Shin0Impact (Scrum + Fullstack)**: Repo scaffold, CI, and branch protection; turning this doc's milestones into board items and running standups; Socket.IO WebSocket server/client implementation and live emergency broadcast alerts; Redux Toolkit store setup; deployment (Render/Railway backend, Cloudflare Pages frontend, Cloudflare R2 media); and keeping this design doc current as decisions change.

### Milestone Schedule

| **Week** | **Milestone** | **Key Deliverables** |
| --- | --- | --- |
| **Week 1** | **Setup & Foundation** | Design doc approval. Setup GitHub repository with branch rules and CI pipeline. Initialize PostgreSQL database with PostGIS extensions. Build Custom Node JWT auth and React skeleton. |
| **Week 2** | **Core API & Storage** | Implement multi-category profile endpoints. Integrate Cloudflare R2 pre-signed upload routes for images, video, and audio assets. Build Event creation and application APIs. |
| **Week 3** | **Real-Time & Search** | Integrate **Socket.IO** messaging, persistent conversation handlers, and live status broadcasts. Complete PostGIS proximity and emergency availability search UI. |
| **Week 4** | **Testing, CI/CD & Deploy** | Run CI automated test suite. Execute cross-browser checks, complete deployment (Render/Railway backend + Cloudflare Pages frontend + Cloudflare R2 media storage), and prepare the presentation demo. |
