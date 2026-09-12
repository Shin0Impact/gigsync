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

## GitHub Pages Deployment

The frontend can be automatically built and hosted on GitHub Pages:

1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Push to `main` (or trigger the **Deploy to GitHub Pages** action under the **Actions** tab).
4. The workflow in `.github/workflows/deploy-pages.yml` will automatically build the client and deploy it to `https://<username>.github.io/<repo-name>/`.


### Database

The PostGIS schema lives at [`server/src/db/schema.sql`](./server/src/db/schema.sql).
Create a Postgres database, enable the `postgis` extension, then run:

```bash
psql "$DATABASE_URL" -f server/src/db/schema.sql
```

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
