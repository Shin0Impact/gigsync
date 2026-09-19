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
- **Database**: PostgreSQL with PostGIS extension (managed via `pg` driver or Prisma ORM)
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

## 6. API Design & Storage Integration

### Custom Node.js Auth Routes (`/api/auth`)

- `POST /api/auth/register` — Hash password via `bcrypt`, store user record, issue HTTP-only JWT cookie.
- `POST /api/auth/login` — Validate credentials, issue access/refresh JWTs.
- `POST /api/auth/logout` — Clear auth cookies.
- `GET /api/auth/me` — Verify JWT payload and return current user profile.

### Cloudflare R2 Media Upload Routes (`/api/media`)

- `POST /api/media/upload-url` — Request a pre-signed PUT URL for direct R2 binary uploads (validates mime-type, file limit, and media structure).
- `POST /api/showcases` — Finalize showcase record post-upload by storing metadata and the R2 object key.
- `DELETE /api/showcases/:id` — Delete record from database and delete binary object from Cloudflare R2 via S3 SDK.

### Geospatial & Artist Routes (`/api/artists`)

- `GET /api/artists/search?category_id=&lat=&lng=&radius_km=` — PostGIS radius query (see `server/src/routes/artists.routes.ts`).
- `GET /api/artists/emergency-available?lat=&lng=&radius_km=` — Fetch performers who have active `is_emergency_available = true` flags sorted by proximity.
- `PATCH /api/artists/me/emergency-status` — Toggle emergency availability with auto-expiration timestamp.

### Event & Application Routes (`/api/events`)

- `POST /api/events` — Create gig listing requiring specific art categories (Organizer role).
- `GET /api/events` — Filter active gigs by proximity, category, and date.
- `POST /api/events/:id/apply` — Submit artist application with an optional cover note.
- `PATCH /api/events/:id/applications/:appId` — Accept/reject applicant status.

### Real-time Messaging Routes (`/api/conversations`)

- `POST /api/conversations` — Initiate a chat between organizer and artist.
- `GET /api/conversations/:id/messages` — Fetch message history with pagination.

## 7. Frontend Architecture & Socket.IO Plan

### Redux State Shape (`store/index.ts`)

See [`client/src/store/index.ts`](../client/src/store/index.ts) and the
slices under `client/src/store/slices/` for the live version of this shape.

### Socket.IO Integration Mechanics

1. **Authentication Handshake**: Socket connection authenticates using the HTTP-only JWT cookie passed in the connection header.
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
