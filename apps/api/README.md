# Plusma API

NestJS modular monolith for cafe reservations, menu management and orders. PostgreSQL is authoritative; no reservation state depends on the 3D runtime or process memory.

## Local setup

From the repository root, with Docker running:

```sh
npm ci
npm run setup:local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

`setup:local` creates random ignored local secrets only when the files do not exist. Existing files are preserved. API listens on `127.0.0.1:3001`; `space` forwards `/api/*` to it. Health: `/api/v1/health`. `API_ORIGIN` in the Next app is a server build setting. The public frontend origin must appear in API `TRUSTED_ORIGINS` (comma separated). Production uses `NODE_ENV=production`, HTTPS and a stable `APP_SECRET` of at least 32 random characters shared by every replica. Set `HOST=0.0.0.0` when the API runs inside a container. Run migrations once before rolling out replicas; the runner uses a PostgreSQL advisory lock.

The local fixtures create Barg and Comma as separate organizations, with tables matching the existing scenes. They do not create a staff password, verify a phone, or contact a real cafe. They are development data; provision actual organizations, venue schedules and tables deliberately before deployment. Re-seeding does not change existing table capacity.

Create a local staff identity with a chosen password (12–256 characters):

```sh
read -s STAFF_PASSWORD
export STAFF_PASSWORD
npm run staff:create --workspace api -- --email you@example.com --name 'مدیر کافه' --venue barg --role owner
unset STAFF_PASSWORD
```

Open `/staff`. An owner can operate all venues in that organization; a staff member needs explicit `venue_permissions`. Re-running the command grants membership without changing an existing password. Provisioning is an operator command; there is no public signup or role escalation endpoint.

## HTTP interface

All paths start with `/api/v1`. JSON only for POST. Reservation and order mutations require `Idempotency-Key` (16–128 letters, digits, `_` or `-`; use a UUID per new intent and reuse it for retries).

| Method       | Path                                | Input / authorization                                                |
| ------------ | ----------------------------------- | -------------------------------------------------------------------- |
| GET          | `/public/venues/:slug/availability` | `date=YYYY-MM-DD&tableId=1&guests=2`                                 |
| POST         | `/public/venues/:slug/holds`        | `{tableId,startsAt,guests}`                                          |
| GET          | `/public/reservations/:id`          | Guest bearer token                                                   |
| POST         | `/public/reservations/:id/confirm`  | `{guestName,guestPhone}` + guest bearer token                        |
| POST         | `/public/reservations/:id/cancel`   | `{}` + guest bearer token                                            |
| POST         | `/staff/login`                      | `{email,password}`; sets HttpOnly session cookie; no idempotency key |
| GET / DELETE | `/staff/session`                    | Staff cookie; DELETE logs out                                        |
| GET          | `/staff/venues/:slug/reservations`  | Staff cookie + `date=YYYY-MM-DD`                                     |
| POST         | `/staff/reservations/:id/cancel`    | `{}` + staff cookie                                                  |
| POST         | `/staff/reservations/:id/check-in`  | `{}` + staff cookie                                                  |

Menu endpoints use the item UUID as create identity and a `version` for updates, instead of the command header.

| Method | Path                                 | Input / authorization                                                                  |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| GET    | `/public/venues/:slug/menu`          | Available menu items only                                                              |
| GET    | `/staff/venues/:slug/menu`           | Staff cookie; all items for an authorized venue                                        |
| POST   | `/staff/venues/:slug/menu/items`     | Staff cookie + `{id,name,category,priceRials,isAvailable}`; client-generated item UUID |
| POST   | `/staff/venues/:slug/menu/items/:id` | Same fields + `version`; matching path/body item ID                                    |
| GET    | `/staff/venues/:slug/orders`         | Staff cookie + `date=YYYY-MM-DD`; created day in venue timezone                        |
| POST   | `/staff/venues/:slug/orders`         | Staff cookie + `{reservationId,items:[{menuItemId,quantity,version}]}` + command key   |
| POST   | `/staff/orders/:id/status`           | Staff cookie + `{status}` + command key                                                |

Menus start empty. Prices are integer IRR (10–1,000,000,000, divisible by 10); the interface displays whole toman. Menu edits increment a version. Replaying identical item data returns the existing item; stale edits with different data return 409. Order creation requires a checked-in reservation whose visit has not ended, with 1–20 distinct available items, 1–20 units each and matching menu versions. The server snapshots names/prices and computes the total; client price fields are ignored. The same create key returns the same order at its current status. Status transitions are `placed → preparing → ready → served`, or cancellation from placed/preparing; transitions store a command result for replay. Lists read persisted line snapshots in one round trip. Preparation status has no payment meaning; payment, receipts, cash shifts and settlement are future work. See [ADR-0007](../../docs/adr/0007-cafe-menu-and-orders.md).

Transport types: `@repo/contracts`. No caller supplies a trusted organization ID. Lists omit temporary holds. Status transitions: `held → confirmed → checked_in`, `held/confirmed → cancelled`, `held → expired`. Check-in opens 30 minutes before arrival and closes at the reservation end. Terminal states cannot be changed. A replay returns the original command result; GET returns current status. Changed input with the same key gives 409.

Default bookable hours are 10:00–23:00 in the venue timezone, starts every 30 minutes, duration 90 minutes, full-table allocation and a 5 minute hold. The server exposes 30 future days; the customer dialog offers the next 7. Availability is advisory; creating the hold performs the authoritative allocation. Overlap is protected by transaction locks plus a database exclusion constraint. Neighboring half-open intervals can coexist. Expired holds are ignored in availability and cleared under the table lock before reuse.

Guest capabilities are hashed at rest and held in the browser tab's sessionStorage, never a URL. Public codes do not authorize access. Phone numbers are contact details, without SMS verification. Closing a tab can lose guest access: cross-device recovery needs verified contact in a later phase. Session cookies are hashed at rest, expire after 12 hours and are revoked on logout. Browser mutations require a trusted Origin; cookies without Origin on mutations are rejected. PostgreSQL stores login/hold rate counters so adding replicas does not reset limits. Production edge limits should be set for actual traffic and proxy topology.

## Verification and operations

```sh
npm run test --workspace api
```

The integration suite requires PostgreSQL and creates/drops its own randomly named database. It uses `TEST_DATABASE_URL` or the local API config; that role needs `CREATEDB` and permission to install `btree_gist`. No test truncates the configured database. Tests boot real Nest HTTP, issue concurrent requests, exercise guest/staff flows, tenant/venue isolation, expiry and command retries. Test execution is not cached in Turbo.

`npm run build --workspace api` then `npm run start --workspace api` runs compiled output, reading deployment environment variables. `npm run dev --workspace api` loads `.env.local` and watches TypeScript. Migrations are versioned, transactional and never automatic at process startup. Keep migrations immutable once applied.

Deployment operations still need environment-specific backups/restore drills, TLS, connection sizing, monitoring and retention policies for guest contact data, audit events, expired sessions and request counters. No distributed job runner is needed for hold expiry correctness. Do not rotate `APP_SECRET` while unresolved hold retries must remain recoverable. Dependencies currently override `body-parser >=2.4.0` and `multer >=2.5.0` to include upstream DoS fixes until Nest's pinned transitive versions catch up.

Local package-manager note: npm 11.12.1 can label Nest's original exact `multer 2.4.0` requirement as invalid in `npm ls` even with the root override. The committed lockfile resolves `2.5.0`; a clean `npm ci`, Nest HTTP integration tests and `npm audit --omit=dev` were verified with that installed version. Keep the root override and lockfile together.
