# Vortex - Seeded Credentials

The v2 seed (`backend/prisma/seed.js`) seeds privileged accounts:
admin, jury, and campus coordinators. Students self-register through
`/register` and are then verified by either a campus coordinator for
their institution or by the admin, which generates and emails a fresh
6-digit password.

All passwords below are defaults sourced from environment variables
(`ADMIN_SEED_PASSWORD`, `JURY_SEED_PASSWORD`, `COORDINATOR_SEED_PASSWORD`
in `docker-compose.yml`). Override them before bringing up the stack.
The seed is idempotent and never overwrites an existing `passwordHash`.

---

## Access URLs

| What | URL |
|---|---|
| Frontend | <http://localhost> |
| Backend API | <http://localhost:3001> (also reachable via the frontend `/api` proxy) |
| Postgres | `localhost:5432` (`vortex_user` / `vortex_password` / `vortex_db`) |

---

## Admin

| Field | Value |
|---|---|
| Email | `admin@vortex.local` |
| Password | `admin1234` |
| Role | `ADMIN` |

Use this to test the global verification queue, taxonomy CRUD, hackathon
rules, round control, jury assignments, team force-resolve, broadcasts,
and the audit log.

---

## Jury (3 seeded)

All juries share the same default password.

| Email | Password | Role |
|---|---|---|
| `jury.alpha@vortex.local`   | `jury1234` | `JURY` |
| `jury.bravo@vortex.local`   | `jury1234` | `JURY` |
| `jury.charlie@vortex.local` | `jury1234` | `JURY` |

A jury can only score teams an admin has assigned to them via
`Admin -> Jury Assignments`, and only when the round is `UNLOCKED`.

---

## Campus Coordinators (10 seeded)

All coordinators share the same default password.

| Institution | Email | Password | Role |
|---|---|---|---|
| `ITER \| SOA` | `coordinator.iter@vortex.local` | `coord1234` | `COORDINATOR` |
| `SPS \| SOA` | `coordinator.sps@vortex.local` | `coord1234` | `COORDINATOR` |
| `SNC \| SOA` | `coordinator.snc@vortex.local` | `coord1234` | `COORDINATOR` |
| `IMS & SUM \| SOA` | `coordinator.ims@vortex.local` | `coord1234` | `COORDINATOR` |
| `IDS \| SOA` | `coordinator.ids@vortex.local` | `coord1234` | `COORDINATOR` |
| `SNIL \| SOA` | `coordinator.snil@vortex.local` | `coord1234` | `COORDINATOR` |
| `IAS \| SOA` | `coordinator.ias@vortex.local` | `coord1234` | `COORDINATOR` |
| `IVS & AH \| SOA` | `coordinator.ivs@vortex.local` | `coord1234` | `COORDINATOR` |
| `IBCS \| SOA` | `coordinator.ibcs@vortex.local` | `coord1234` | `COORDINATOR` |
| `SHM \| SOA` | `coordinator.shm@vortex.local` | `coord1234` | `COORDINATOR` |

Each coordinator can only review `PENDING` students from their own
institution. They can approve or reject from the coordinator portal.
Only admin can revoke, restore, or reissue passwords.

---

## Students

Not seeded. To test student flows:

1. Open <http://localhost/register> and submit the form.
   - The seed includes 8 entries in `CollegeRegistry` (see below). Using
     any of those `registrationNo` + `email` combinations triggers an
     auto-match hint in the admin verification queue.
2. Sign in either as the matching campus coordinator or as admin, open
   the verification queue, find the pending registration, and click
   **Approve**.
3. Watch the backend container logs (`docker logs vortex-backend-1 -f`)
   for the mail stub line if you are not using a real mail provider.
4. Sign in at <http://localhost/login> with the registered email and the
   issued 6-digit code.

### Sample registry entries

| Registration No | Full Name | Email | Institution |
|---|---|---|---|
| `2026-VRTX-100` | Alice Vance  | `alice.vance@vortex.local`  | ITER \| SOA |
| `2026-VRTX-101` | Bob Smith    | `bob.smith@vortex.local`    | SPS \| SOA |
| `2026-VRTX-102` | Carla Mendes | `carla.mendes@vortex.local` | SNC \| SOA |
| `2026-VRTX-103` | Devraj Patil | `devraj.patil@vortex.local` | IMS & SUM \| SOA |
| `2026-VRTX-104` | Esha Nair    | `esha.nair@vortex.local`    | IDS \| SOA |
| `2026-VRTX-105` | Farhan Iqbal | `farhan.iqbal@vortex.local` | SNIL \| SOA |
| `2026-VRTX-106` | Gita Roy     | `gita.roy@vortex.local`     | IAS \| SOA |
| `2026-VRTX-107` | Hari Menon   | `hari.menon@vortex.local`   | IVS & AH \| SOA |

---

## Re-seeding

The seed is idempotent - every write is an `upsert` keyed on a stable
identifier. Re-running converges to the same state without resetting
admin-tweaked rules or rotating passwords.

```bash
cd backend && npm run db:seed
```

To wipe everything in development only:

```bash
cd backend && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<your-text>" npx prisma db push --force-reset
npm run db:seed
```

---

## Production Note

Before deploying anywhere real:

- Set `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` to non-defaults
- Set `JURY_SEED_PASSWORD` to a non-default or remove the seed call
- Set `COORDINATOR_SEED_PASSWORD` to a non-default
- Rotate `ACCESS_TOKEN_SECRET` to a fresh 32+ char secret
- Restrict `CORS_ORIGIN` to your real frontend origin only
- Replace the mail stub in `backend/src/utils/mail.js` with a real provider
