# GigSync

A multi-disciplinary marketplace connecting performers, visual artists, event
organizers, and fans — with proximity-based "emergency availability" search
for filling last-minute gig slots.

This repo is the starting scaffold for the team's full-stack capstone. See
[`docs/DESIGN_DOC.md`](./docs/DESIGN_DOC.md) for the full design document
(architecture, data model, API design, Redux shape, timeline).

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

## Realtime chat (proof of concept)

The Socket.IO gateway (`server/src/sockets/index.ts`) and client wiring
(`client/src/sockets/`) are implemented and provable today, even before auth
or the full DB pipeline exist:

- **Auth is a placeholder for now** — the socket handshake trusts a plain
  `userId` string instead of verifying a real JWT cookie, since
  `/api/auth` isn't built yet. This is called out with `TEMPORARY AUTH`
  comments in both `server/src/sockets/index.ts` and
  `client/src/sockets/client.ts` — swap both once JWT auth lands.
- **Message persistence degrades gracefully** — if the `messages` insert
  fails (e.g. the `conversations` row it references doesn't exist yet,
  since `POST /api/conversations` isn't built), the server falls back to an
  in-memory message so real-time delivery still works. Check the server
  console: warnings there mean it's using the fallback, not the DB.

To try it: run both `client` and `server` (`npm run dev` in each), then open
**http://localhost:5173/socket-test** in two browser tabs. Use a different
"User ID" in each tab but the same "Conversation ID", connect both, and send
a message — it should show up in both tabs instantly. That page
(`client/src/pages/SocketTestPage.tsx`) is temporary and documented as such;
delete it once real chat UI exists and reuse `sockets/client.ts` +
`sockets/listeners.ts` there instead.

## Working as a team (Git workflow)

- `main` is always in a working state — nobody pushes to it directly.
- One feature branch per piece of work: `feature/login`, `feature/emergency-search`, etc.
- Open a Pull Request, get at least one teammate's review, then merge.
- Small, frequent commits with clear, present-tense messages
  (`Add JWT auth middleware`, not `update` or `stuff`).
- Keep `docs/DESIGN_DOC.md` up to date as the design evolves — it's the team's
  single source of truth, not a document you write once and forget.

## Team

| Area | Owner |
| --- | --- |
| Auth, DB schema, Events & Applications, Reviews/Moderation | Dev 1 |
| Artist profiles, Cloudflare R2 media, PostGIS search | Dev 2 |
| Socket.IO, Redux store, chat UI, layout | Dev 3 |

(Fill in names once the team is finalized.)

## Milestones

See Section 8 of the design doc. Rough shape:

1. **Week 1** — Repo/CI setup, DB + PostGIS init, auth skeleton, React skeleton
2. **Week 2** — Profile + R2 upload endpoints, Event CRUD/applications
3. **Week 3** — Socket.IO messaging, PostGIS proximity + emergency search
4. **Week 4** — Testing, CI/CD, deploy, demo prep
