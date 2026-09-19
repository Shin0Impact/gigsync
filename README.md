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
- **Database**: PostgreSQL + PostGIS
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

### Database

The PostGIS schema lives at [`server/src/db/schema.sql`](./server/src/db/schema.sql).
Create a Postgres database, enable the `postgis` extension, then run:

```bash
psql "$DATABASE_URL" -f server/src/db/schema.sql
```

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
[Cloudflare Pages dashboard](https://dash.cloudflare.com), **Create a project
> Connect to Git**, pick this repo, and set:

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

| Area | Owner |
| --- | --- |
| Auth, DB schema, Events & Applications, Reviews/Moderation | Dev 1 |
| Artist profiles, Cloudflare R2 media, PostGIS search | kareem |
| Socket.IO, Redux store, chat UI, layout | Jinad |

(Fill in names once the team is finalized.)

## Milestones

See Section 8 of the design doc. Rough shape:

1. **Week 1** — Repo/CI setup, DB + PostGIS init, auth skeleton, React skeleton
2. **Week 2** — Profile + R2 upload endpoints, Event CRUD/applications
3. **Week 3** — Socket.IO messaging, PostGIS proximity + emergency search
4. **Week 4** — Testing, CI/CD, deploy, demo prep
