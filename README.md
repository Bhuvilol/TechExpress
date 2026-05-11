# Vortex

A focused hackathon management platform — registration, team formation,
multi-round jury evaluation, and a live leaderboard. Three roles
(Admin, Jury, Student), one event, no ceremony.

> **Stack:** React 19 · Vite · TailwindCSS · Express · Prisma 7 · PostgreSQL 15 · Socket.IO · Docker Compose

---

## Table of Contents

1. [What you'll need](#1-what-youll-need)
2. [Quick start (5 minutes)](#2-quick-start-5-minutes)
3. [Default credentials](#3-default-credentials)
4. [What's running where](#4-whats-running-where)
5. [Walking through the app](#5-walking-through-the-app)
6. [Day-to-day commands](#6-day-to-day-commands)
7. [Local dev without Docker](#7-local-dev-without-docker)
8. [Troubleshooting](#8-troubleshooting)
9. [Project layout](#9-project-layout)
10. [Resetting everything](#10-resetting-everything)

---

## 1. What you'll need

Install these once. Everything else runs inside Docker.

| Tool | Purpose | Get it |
|---|---|---|
| **Docker Desktop** | Runs the database, backend, and frontend in containers | <https://www.docker.com/products/docker-desktop/> |
| **Git** | Clone the repository | <https://git-scm.com/downloads> |

That's it. You do **not** need Node.js, PostgreSQL, or anything else
installed locally to run the project. (If you want to develop without
Docker, see [§7](#7-local-dev-without-docker).)

> **Windows users:** Docker Desktop will prompt to enable WSL 2 the first
> time you open it. Say yes — it's the supported mode. After install,
> open Docker Desktop and wait for it to show "Engine running" before
> running the commands below.

Verify Docker is alive:

```bash
docker --version
docker compose version
```

Both should print versions without errors.

---

## 2. Quick start (5 minutes)

Open a terminal (PowerShell on Windows, Terminal on macOS / Linux) and:

```bash
# 1. Clone
git clone https://github.com/Bhuvilol/TechExpress.git vortex
cd vortex

# 2. Build images and start everything in the background
docker compose -p vortex up -d --build

# 3. Apply the database schema (one-time, runs inside the backend container)
docker compose -p vortex exec backend npx prisma db push

# 4. Seed admin / juries / hackathon rules / sample registry rows
docker compose -p vortex exec backend npm run db:seed
```

**That's it.** Open <http://localhost> in your browser.

The first build takes ~3-5 minutes (downloading Postgres + Node images
and installing dependencies). Subsequent starts are seconds.

> The `-p vortex` flag pins the Docker Compose project name. It's
> optional but recommended — it keeps your containers named consistently
> (`vortex-db-1`, `vortex-backend-1`, `vortex-frontend-1`) regardless of
> what folder you cloned into.

---

## 3. Default credentials

Seeded by `npm run db:seed`. Change them via env vars before running the
seed if you want different defaults (see [§6](#6-day-to-day-commands)).

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@vortex.com` | `admin123` |
| **Jury (1)** | `jury.alpha@vortex.com` | `jury123` |
| **Jury (2)** | `jury.bravo@vortex.com` | `jury123` |
| **Jury (3)** | `jury.charlie@vortex.com` | `jury123` |

**Students are not seeded** — they self-register through `/register`
and are then verified by an admin, which generates and emails a fresh
6-digit password (currently logged to the backend container instead of
emailed — see [§5](#5-walking-through-the-app) step 3).

---

## 4. What's running where

| Service | Container | URL | Purpose |
|---|---|---|---|
| Frontend (nginx + React build) | `vortex-frontend-1` | <http://localhost> | The UI |
| Backend (Express API + Socket.IO) | `vortex-backend-1` | <http://localhost:3001> | REST + websockets |
| Database (PostgreSQL 15) | `vortex-db-1` | `localhost:5432` | Persistent state |

The frontend's nginx proxies `/api/*` and `/socket.io/*` to the backend
on the internal Docker network, so you only ever need port `80` open in
your browser.

Verify everything is healthy:

```bash
# All three should be 'running' / 'healthy'
docker compose -p vortex ps

# Health endpoint should return {"status":"ok"}
curl http://localhost/api/health
```

---

## 5. Walking through the app

To experience every flow end-to-end:

### As Admin

1. Open <http://localhost> → click **Sign in**.
2. Use `admin@vortex.com` / `admin123`. You land in the admin shell.
3. Skim the sidebar — Verification, Registry, Teams, Rules, Rounds,
   Taxonomy, Broadcast, Audit Log.
4. Visit **Rules** and confirm the defaults
   (min 3 / max 5 members, 1 female, 1 domain expert).

### As a brand-new student

5. Open an incognito window → <http://localhost/register>.
6. Fill the form. For the institution, pick any one (e.g. *ITER | SOA*).
   For domain, pick any one (e.g. *Healthcare & Medical Technology*).
   - **Tip:** to test the registry-match flag, use a registration number
     from the seeded sample rows (`2026-VRTX-100` through `…-107`) with
     its matching email — those are seeded in `CollegeRegistry` so the
     admin sees a green "Matched" badge.
7. Submit. You'll see "Awaiting organizer verification."

### Back in admin

8. **Verification** tab → find the pending row → **Approve**.
9. A modal pops up showing the freshly-issued 6-digit password (it's
   also written to the backend container's logs — `docker compose -p
   vortex logs backend | grep mail`). **Copy it.**

### Back in incognito

10. <http://localhost/login> with the student email + that 6-digit code.
11. Go to **Teams** → **Create a team**. Pick the same domain you
    registered for. Become the leader.
12. Open another incognito window, register a second student, get them
    approved, log in, go to **Teams** → request to join the first team.
13. As leader, **Approve** the request. Repeat until the team meets the
    rules (min 3 members + 1 female + 1 domain expert).
14. Once status flips to **QUALIFIED**, click **Finalize team**.

### As Jury

15. Sign in as `jury.alpha@vortex.com` / `jury123`.
16. You'll see the finalized team in the scoring board.
17. **Admin must unlock a round first**: go to admin → **Rounds** →
    set Round 1 to **UNLOCKED**.
18. Back as jury, click any **Open** round chip → submit scores.
19. As admin, set **Rules → Leaderboard visible: ON** and visit
    <http://localhost/leaderboard>. Scores appear in real time.

### Real-time bonus

20. With two browsers open, go admin → **Broadcast**, send a message.
    The other window's toast fires within ~50ms.

---

## 6. Day-to-day commands

All of these assume you're in the project root.

### Start / stop

```bash
# Start (or restart if already running)
docker compose -p vortex up -d

# Stop without losing data
docker compose -p vortex stop

# Stop and remove containers (keeps the database volume)
docker compose -p vortex down

# View live logs from all services
docker compose -p vortex logs -f

# Logs for one service
docker compose -p vortex logs -f backend
```

### Rebuild after code changes

The frontend bundle is baked into the image. After editing source you
need to rebuild whichever service changed:

```bash
docker compose -p vortex up -d --build frontend   # after frontend edits
docker compose -p vortex up -d --build backend    # after backend edits
```

### Re-seed without wiping data

The seed is idempotent — running it twice doesn't change anything that
was already correct.

```bash
docker compose -p vortex exec backend npm run db:seed
```

### Apply schema changes

After editing `backend/prisma/schema.prisma`:

```bash
docker compose -p vortex exec backend npx prisma db push
```

If the change is non-trivial (new required column on a non-empty table,
type changes, etc.) Prisma will refuse and ask for `--force-reset`,
which **destroys all data**. See [§10](#10-resetting-everything).

### Customise admin / jury credentials before seeding

Edit `docker-compose.yml` → `backend.environment`:

```yaml
ADMIN_SEED_EMAIL: you@yourdomain.com
ADMIN_SEED_PASSWORD: your-strong-password
JURY_SEED_PASSWORD: your-jury-password
```

Then rebuild and re-seed:

```bash
docker compose -p vortex up -d --build backend
docker compose -p vortex exec backend npm run db:seed
```

> The seed never overwrites an existing user's password. If you want to
> reset to the new defaults, you have to delete those user rows first
> (or do a full reset — [§10](#10-resetting-everything)).

### Open a database shell

```bash
docker compose -p vortex exec db psql -U vortex_user -d vortex_db
# inside psql:
\dt              -- list tables
SELECT * FROM "User" LIMIT 5;
\q               -- quit
```

---

## 7. Local dev without Docker

For active development with hot-reload, run the frontend and backend
directly on your machine while still using the Dockerized database.

You'll need:
- Node.js 20+ (<https://nodejs.org>)
- The Postgres container running (`docker compose -p vortex up -d db`)

### Backend

```bash
cd backend
cp .env.example .env       # then open it and set values (see below)
npm install
npx prisma db push
npm run db:seed
npm run dev                # node --watch — restarts on file change
```

Minimum `.env` for local dev:

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DATABASE_URL="postgresql://vortex_user:vortex_password@localhost:5432/vortex_db?schema=public"
ACCESS_TOKEN_SECRET="dev-access-secret-please-rotate-32chars-min"
ACCESS_TOKEN_EXPIRY="2h"
BCRYPT_ROUNDS=12
CORS_ORIGIN="http://localhost,http://localhost:5173,http://127.0.0.1"
ADMIN_SEED_EMAIL="admin@vortex.com"
ADMIN_SEED_PASSWORD="admin123"
JURY_SEED_PASSWORD="jury123"
```

Backend now serves at <http://localhost:3001>.

### Frontend

```bash
cd frontend
npm install
npm run dev                # vite dev server with hot module reload
```

Frontend at <http://localhost:5173> with `/api` automatically proxied
to the local backend (configured in `vite.config.js`).

---

## 8. Troubleshooting

### "Port 80 / 3001 / 5432 is already in use"

Something else on your machine grabbed that port. Either stop it, or
edit `docker-compose.yml` to map a different host port — for example
`"8080:80"` instead of `"80:80"` and then visit <http://localhost:8080>.

### Login returns `500 Internal Server Error`

Check `docker compose -p vortex logs backend`. The most common cause is
a CORS rejection (e.g. you're hitting the API from a host that's not
in `CORS_ORIGIN`). Add your origin to the allow-list in
`docker-compose.yml` and rebuild the backend.

### Frontend shows blank page / CSS missing

Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). Browser cached the old bundle.

### Database container keeps restarting

```bash
docker compose -p vortex logs db
```

If it complains about volume permissions (rare on Windows / macOS),
try a clean reset — [§10](#10-resetting-everything).

### Backend fails with `Prisma schema validation` errors

Schema and database drifted. Apply the schema:

```bash
docker compose -p vortex exec backend npx prisma db push
```

If Prisma refuses because data exists, it's a destructive change — you
need [§10](#10-resetting-everything).

### `bcrypt invalid ELF header` inside the container

Your host's `node_modules` ended up baked into the Linux container. The
`.dockerignore` file in `backend/` prevents this — make sure it exists.
Then rebuild without cache:

```bash
docker compose -p vortex build --no-cache backend
docker compose -p vortex up -d backend
```

### "I forgot my admin password"

Easiest path: reset everything ([§10](#10-resetting-everything)) and
re-seed with the env defaults.

---

## 9. Project layout

```
TExDemo/
├── backend/                    # Express + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma       # Single source of truth for the DB
│   │   └── seed.js             # Idempotent seed
│   ├── src/
│   │   ├── config/             # env validation, Prisma client
│   │   ├── middleware/         # auth, validate, error handler, round guard
│   │   ├── services/           # all DB writes live here, never in controllers
│   │   ├── controllers/        # thin orchestrators
│   │   ├── routes/             # express routers
│   │   ├── realtime/           # Socket.IO bootstrap + emitter helpers
│   │   ├── validators/         # Zod schemas per endpoint
│   │   ├── utils/              # logger, errors, crypto, mail stub
│   │   └── index.js            # app entry
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                   # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── lib/                # api client, socket client, storage
│   │   ├── contexts/           # Auth, Toast, Broadcast (real-time)
│   │   ├── hooks/              # useApi, useSocketEvent
│   │   ├── components/
│   │   │   ├── ui/             # NeonBorderCard, Modal, Spinner, etc.
│   │   │   └── layout/         # TopAppBar, AdminShell, RouteGuards
│   │   ├── pages/
│   │   │   ├── public/         # Home, Login, Register, Leaderboard, Awards
│   │   │   ├── student/        # Dashboard, TeamFormation
│   │   │   ├── jury/           # JuryDashboard
│   │   │   └── admin/          # 9 admin pages
│   │   ├── App.jsx             # router
│   │   └── main.jsx            # mount + providers
│   ├── nginx.conf              # serves the build + proxies /api + /socket.io
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml          # ties db + backend + frontend together
├── CREDENTIALS.md              # seeded credentials reference
└── README.md                   # this file
```

---

## 10. Resetting everything

Use this when you want a totally clean slate — fresh database, fresh
seed, no leftover student accounts or teams.

> **This deletes all data permanently.** It's safe for development, never
> do it in production.

```bash
# Stop everything and remove the database volume
docker compose -p vortex down -v

# Bring everything back up from scratch
docker compose -p vortex up -d --build

# Reapply schema and seed
docker compose -p vortex exec backend npx prisma db push
docker compose -p vortex exec backend npm run db:seed
```

You're back to the default state with the credentials in [§3](#3-default-credentials).

---

## Deploying to production

Local dev is just step one. To put Vortex on the internet at your own
domain — buying a server, setting up a real database, automatic HTTPS,
real email, backups — see the deep walkthrough in **[DEPLOY.md](./DEPLOY.md)**.

Estimated cost: ~$7/month for a small event, ~$64/month for a few
thousand users.

---

## License

MIT — see [LICENSE](./LICENSE).
