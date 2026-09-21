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

**Seed data:** there's no mock-data file in this repo (see the note in
`docs/DESIGN_DOC.md` section 5 for why). Insert a handful of real rows via
the Supabase SQL Editor once the schema's in place, so endpoints have
something real to query while the app is still early.

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
   `npm install && npm run build`, start `npm start`, health check `/health`).
2. Render will prompt for the env vars marked `sync: false` in `render.yaml`
   (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `CLIENT_ORIGIN`, the `R2_*` values) - fill these in from `server/.env.example`
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
`client/public/_redirects` is already in place so client-side routes (e.g.
`/socket-test`, future `/login`, `/events/:id`) don't 404 on refresh.

**GitHub Actions alternative:** [`.github/workflows/deploy-frontend.yml`](./.github/workflows/deploy-frontend.yml)
does the same build + deploy from CI instead, if you'd rather see deploy logs
in GitHub. It needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` added
as repo secrets first (Settings > Secrets and variables > Actions) - until
those are set this workflow just fails harmlessly, it isn't a required CI
check. Use one approach or the other, not both, to avoid double deploys.

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

## Milestones

See Section 8 of the design doc. Rough shape:

1. **Week 1** — Repo/CI setup, DB + PostGIS init, auth skeleton, React skeleton
2. **Week 2** — Profile + R2 upload endpoints, Event CRUD/applications
3. **Week 3** — Socket.IO messaging, PostGIS proximity + emergency search
4. **Week 4** — Testing, CI/CD, deploy, demo prep
