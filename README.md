# GigSync

A multi-disciplinary marketplace connecting performers, visual artists, event
organizers, and fans — with proximity-based "emergency availability" search
for filling last-minute gig slots.

GigSync is a three-person full-stack capstone. See
[`docs/DESIGN_DOC.md`](./docs/DESIGN_DOC.md) for the design document
(architecture, data model, API design, Redux shape, timeline).

## At a glance

| | |
|---|---|
| **What** | Marketplace for performers, visual artists, organizers and fans, with proximity-based emergency availability search |
| **Stack** | React, TypeScript, Redux Toolkit, Vite, Node.js, Express, PostgreSQL + PostGIS (Supabase), Socket.IO, Cloudflare R2 |
| **Auth** | Custom bcrypt + JWT in HTTP-only cookies, email verification, password recovery, role-based access, rate limiting |
| **Quality** | 13 server test files (auth, events, media, sockets, rate limiting, recurrence); CI builds and lints client and server on every push and PR |
| **Deploy** | Render (API), Cloudflare Pages (client), Cloudflare R2 (media) |

## Features

- Accounts with email verification, password recovery and roles (artists, organizers, fans, admins, moderators).
- Artist profiles, portfolio pieces and a showcase.
- Events with applications, recurring events and event media.
- Emergency availability: artists mark themselves free, organizers search by distance with PostGIS.
- Real-time chat and live emergency alerts over Socket.IO.
- Direct-to-R2 media uploads using pre-signed URLs.

## Stack

- **Client**: React + TypeScript + Redux Toolkit + Vite
- **Server**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + PostGIS, hosted on **Supabase** (used as managed Postgres only — auth, storage, and realtime stay custom, see note below)
- **Object storage**: Cloudflare R2 (S3-compatible)
- **Real-time**: Socket.IO
- **Auth**: Custom bcrypt + JWT (HTTP-only cookies)

## Repo layout

```
gigsync/
├── client/          # React + Redux + TS frontend (Vite)
├── server/          # Express + TS backend (REST + Socket.IO)
├── docs/
│   └── DESIGN_DOC.md
└── .github/
    ├── workflows/ci.yml
    └── pull_request_template.md
```

## Getting started

### Server

```bash
cd server
cp .env.example .env   # fill in DB / JWT / R2 values
npm install
npm run dev             # starts the API on http://localhost:4000
```

### Client

```bash
cd client
cp .env.example .env
npm install
npm run dev              # starts Vite on http://localhost:5173
```

### Database (Supabase)

We're using Supabase purely as **managed Postgres + PostGIS** — auth, file
storage, and real-time messaging are still handled by our own Express +
bcrypt/JWT + Socket.IO + Cloudflare R2 code, not Supabase's built-in Auth /
Storage / Realtime services. That's a deliberate call: the bootcamp brief
grades a hand-rolled bcrypt + JWT auth layer, so we don't want Supabase Auth
quietly doing that job for us.

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, enable PostGIS (also the first line of `schema.sql`,
   but Supabase projects sometimes need it run once via the dashboard too):
    ```sql
    create extension if not exists postgis;
    ```
3. Grab the connection string: **Project Settings → Database → Connection
   string → URI**. Use the **Session pooler** (port `5432`) or direct
   connection, not the Transaction pooler (`6543`) — this server holds a
   persistent `pg.Pool`, which the transaction pooler doesn't support well.
4. Put that string in `server/.env` as `DATABASE_URL`.
5. Run the schema — either paste `server/src/db/schema.sql` into the
   Supabase SQL Editor, or from your machine:
    ```bash
    psql "$DATABASE_URL" -f server/src/db/schema.sql
    ```

The schema (`server/src/db/schema.sql`) is unchanged either way — it's
portable to any Postgres+PostGIS instance if you ever move off Supabase.

**Demo data:** `server/scripts/demo/` seeds a believable community (about 50 users, 150 posts, 20 events with applications and chats). Run it from `server/` with `npm run demo:seed`; see [`server/scripts/demo/README.md`](./server/scripts/demo/README.md) for the media steps first.

## Real-time messaging

The Socket.IO gateway lives in `server/src/sockets/index.ts`, with the client side in `client/src/sockets/`.

- **Authenticated handshake.** The socket reads the same `access_token` JWT cookie the REST routes use and verifies it with the same secret, so there is one auth model for both.
- **Per-conversation rooms.** A user must be a participant of a conversation to join it or send to it.
- **Events:** `send_message`, `receive_message` and `emergency_status_changed` (live alerts when emergency availability changes).

## Tests

The API tests in `server/tests/` are plain TypeScript scripts run with `tsx` against a running server and database, for example `npm run test:auth`, `test:events`, `test:sockets` and `test:rate-limit` from `server/`. They are not part of CI yet because CI does not start a server and database; CI builds and lints both client and server. See [`server/tests/README.md`](./server/tests/README.md).

## Deployment

Per the design doc (Section 8, Week 4): backend on **Render or Railway**,
frontend on **Cloudflare Pages**, media on **Cloudflare R2**. Config for all
three lives in this repo; each service still needs to be connected once
through its own dashboard.

### Backend (Render)

1. Push this branch, then in the [Render dashboard](https://dashboard.render.com)
   choose **New > Blueprint** and point it at this repo. Render reads
   [`render.yaml`](./render.yaml) at the repo root and creates the
   `gigsync-api` web service automatically (root dir `server`, build
   `npm ci --include=dev && npm run build`, start `npm start`, health check `/health`).
2. Render will prompt for the env vars marked `sync: false` in `render.yaml`
   (`DATABASE_URL`,
   `CLIENT_ORIGIN`, the `R2_*` values); the two JWT secrets are generated automatically - fill these in from `server/.env.example`
   with real values, never commit them.
3. `CLIENT_ORIGIN` should be the Cloudflare Pages URL from the section below
   (update it once that URL exists) so CORS + cookies work in production.

**Railway alternative:** `server/railway.json` is set up the same way if you'd
rather use Railway - set the service's root directory to `server` in the
Railway dashboard and it picks up the config automatically. A portable
`server/Dockerfile` is also included if you ever need a plain container build
instead of either platform's native Node buildpack.

### Frontend (Cloudflare Pages)

Simplest path - no GitHub secrets needed: in the
[Cloudflare Pages dashboard](https://dash.cloudflare.com), \*\*Create a project

> Connect to Git\*\*, pick this repo, and set:

- Framework preset: `Vite`
- Root directory: `client`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_BASE_URL` and `VITE_SOCKET_URL` pointing at
  the Render/Railway backend URL from above

Cloudflare then builds and deploys automatically on every push to `main`.
`client/wrangler.jsonc` serves `dist` as a single-page app, so client-side routes
(e.g. `/login`, `/events/:id`) don't 404 on refresh. The deploy command is
`npx wrangler deploy`; don't add a `public/_redirects` catch-all, Cloudflare
rejects it as an infinite loop.

### Media storage (Cloudflare R2)

1. In the Cloudflare dashboard, **R2 > Create bucket**, name it
   `gigsync-media` (matches `R2_BUCKET_NAME` in `server/.env.example`).
2. **Manage R2 API tokens > Create API token** with read/write access to
   that bucket - gives you `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
3. Your `R2_ACCOUNT_ID` is on the R2 overview page's right sidebar.
4. If the bucket's public dev URL is enabled (Settings tab), that's
   `R2_PUBLIC_URL`; otherwise wire up a custom domain first.
5. Add all four `R2_*` values to the Render/Railway env vars above - the
   pre-signed upload endpoints (`/api/media`, owned by Kareem) read them at
   request time, nothing else needs to change once they're set.

## Working as a team (Git workflow)

- `main` is always in a working state — nobody pushes to it directly.
- One feature branch per piece of work: `feature/login`, `feature/emergency-search`, etc.
- Open a Pull Request, get at least one teammate's review, then merge.
- Small, frequent commits with clear, present-tense messages
  (`Add JWT auth middleware`, not `update` or `stuff`).
- Keep `docs/DESIGN_DOC.md` up to date as the design evolves — it's the team's
  single source of truth, not a document you write once and forget.

## Team

| Name                | Role              | Owns                                                                                                                                                               |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kareem Shuhadh      | Backend           | Auth (bcrypt + JWT), DB schema + Supabase/PostGIS, Event CRUD + applications, artist search, emergency search, R2 media uploads, reviews/moderation                |
| Jinad Abd Alkader   | Frontend          | Routes + page shells, Login/Register, artist search + emergency-search UI, event board, artist profile page, chat UI, design system, WCAG 2.1 AA pass              |
| Maher (Shin0Impact) | Scrum + Fullstack | Repo/CI, board + standups, Socket.IO server + client, deployment (Render/Railway + Cloudflare Pages + R2), Redux store, keeping this design doc current, demo prep |
