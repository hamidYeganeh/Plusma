import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
import { createApp } from "../dist/src/app.js";
import { hashPassword } from "../dist/modules/access/index.js";
import { migrate } from "../scripts/migrate.mjs";
import { seed } from "../scripts/seed.mjs";
let admin, db, app, url, databaseName, databaseUrl;
const origin = "http://localhost:3000";
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const at = (hour) => `${tomorrow}T${hour}:00:00+03:30`;
const fresh = () => randomUUID();
async function request(
  path,
  { method = "GET", body, cookie, token, key, headers = {} } = {},
) {
  const response = await fetch(`${url}/api/v1${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie, origin } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key ? { "idempotency-key": key } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
async function hold(
  tableId = 1,
  startsAt = at("12"),
  key = fresh(),
  slug = "barg",
) {
  return request(`/public/venues/${slug}/holds`, {
    method: "POST",
    body: { tableId, startsAt, guests: 2 },
    key,
  });
}
async function confirm(
  held,
  key = fresh(),
  body = { guestName: "مهمان آزمایشی", guestPhone: "09120000000" },
) {
  return request(`/public/reservations/${held.reservation.id}/confirm`, {
    method: "POST",
    body,
    token: held.accessToken,
    key,
  });
}
let bargCookie, commaCookie;
before(async () => {
  const local = parseEnv(
    await readFile(new URL("../.env.local", import.meta.url), "utf8").catch(
      () => "",
    ),
  );
  const source = process.env.TEST_DATABASE_URL ?? local.DATABASE_URL;
  assert.ok(
    source,
    "Set TEST_DATABASE_URL to a PostgreSQL role able to create an isolated test database, or configure apps/api/.env.local",
  );
  admin = new pg.Client({ connectionString: source });
  await admin.connect();
  databaseName = `plusma_test_${randomBytes(6).toString("hex")}`;
  await admin.query(`CREATE DATABASE ${databaseName}`);
  const parsed = new URL(source);
  parsed.pathname = `/${databaseName}`;
  databaseUrl = parsed.href;
  await migrate(databaseUrl);
  await seed(databaseUrl);
  db = new pg.Client({ connectionString: databaseUrl });
  await db.connect();
  // One owner in each organization, plus a same-organization staff member without venue permission.
  for (const [email, slug, role] of [
    ["barg@example.test", "barg", "owner"],
    ["comma@example.test", "comma-beheshti", "owner"],
    ["denied@example.test", "barg", "staff"],
  ]) {
    const {
      rows: [user],
    } = await db.query(
      "INSERT INTO staff_users(email,name,password_hash) VALUES($1,$1,$2) RETURNING id",
      [email, await hashPassword("test-password-123")],
    );
    await db.query(
      "INSERT INTO memberships(user_id,organization_id,role) SELECT $1,organization_id,$2 FROM venues WHERE slug=$3",
      [user.id, role, slug],
    );
  }
  app = await createApp({
    databaseUrl,
    secret: "integration-only-secret-with-32-characters",
    origins: [origin],
    logger: false,
  });
  await app.listen(0, "127.0.0.1");
  url = await app.getUrl();
  bargCookie = (
    await request("/staff/login", {
      method: "POST",
      body: { email: "barg@example.test", password: "test-password-123" },
    })
  ).cookie;
  commaCookie = (
    await request("/staff/login", {
      method: "POST",
      body: { email: "comma@example.test", password: "test-password-123" },
    })
  ).cookie;
});
after(async () => {
  if (app) await app.close();
  if (db) await db.end();
  if (admin) {
    if (databaseName)
      await admin.query(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
    await admin.end();
  }
});
test("health and server-owned availability use venue timezone, duration and capacity", async () => {
  assert.equal((await request("/health")).status, 200);
  const r = await request(
    `/public/venues/barg/availability?date=${tomorrow}&tableId=1&guests=2`,
  );
  assert.equal(r.status, 200);
  assert.equal(r.body.venue.timeZone, "Asia/Tehran");
  assert.equal(r.body.durationMinutes, 90);
  assert.equal(r.body.slots[0].label, "10:00");
  assert.equal(r.body.slots[0].startsAt, `${tomorrow}T06:30:00.000Z`);
  assert.equal(
    (
      await request(
        `/public/venues/barg/availability?date=${tomorrow}&tableId=2&guests=3`,
      )
    ).status,
    400,
  );
  assert.equal((await hold(2, at("23"))).status, 400);
  assert.equal(
    (
      await request(
        "/public/venues/barg/availability?date=2026-02-30&tableId=1&guests=2",
      )
    ).status,
    400,
  );
});
test("12 concurrent HTTP requests allocate a table once, including partially overlapping slots", async () => {
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      hold(1, index % 2 ? at("12") : at("13")),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 11);
  const winner = results.find((r) => r.status === 201).body;
  assert.equal((await confirm(winner)).status, 201);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM reservations WHERE table_id=1 AND status='confirmed'",
      )
    ).rows[0].n,
    1,
  );
});
test("same numeric table ID in another venue can be booked independently", async () => {
  assert.equal(
    (await hold(1, at("12"), fresh(), "comma-beheshti")).status,
    201,
  );
});
test("concurrent retried hold and confirm replay exactly; changed payload is rejected", async () => {
  const holdKey = fresh();
  const [a, b] = await Promise.all([
    hold(2, at("14"), holdKey),
    hold(2, at("14"), holdKey),
  ]);
  assert.equal(a.status, 201);
  assert.deepEqual(a.body, b.body);
  assert.equal(
    (
      await request("/public/venues/barg/holds", {
        method: "POST",
        key: holdKey,
        body: { tableId: 2, startsAt: at("14"), guests: 1 },
      })
    ).status,
    409,
  );
  const confirmKey = fresh();
  const [c, d] = await Promise.all([
    confirm(a.body, confirmKey),
    confirm(a.body, confirmKey),
  ]);
  assert.equal(c.status, 201);
  assert.deepEqual(c.body, d.body);
  assert.equal(
    (
      await confirm(a.body, confirmKey, {
        guestName: "شخص دیگر",
        guestPhone: "09120000001",
      })
    ).status,
    409,
  );
});
test("expired hold cannot confirm and capacity becomes reusable", async () => {
  const old = await hold(3, at("16"));
  assert.equal(old.status, 201);
  await db.query(
    "UPDATE reservations SET expires_at=now()-interval '1 second' WHERE id=$1",
    [old.body.reservation.id],
  );
  assert.equal((await confirm(old.body)).status, 410);
  assert.equal(
    (
      await request(`/public/reservations/${old.body.reservation.id}`, {
        token: old.body.accessToken,
      })
    ).body.status,
    "expired",
  );
  assert.equal((await hold(3, at("16"))).status, 201);
});
test("tenant and venue permissions protect day lists and guessed reservation mutations", async () => {
  const held = await hold(4, at("15"));
  await confirm(held.body);
  assert.equal(
    (await request(`/staff/venues/barg/reservations?date=${tomorrow}`)).status,
    401,
  );
  assert.equal(
    (
      await request(`/staff/venues/barg/reservations?date=${tomorrow}`, {
        cookie: commaCookie,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/staff/reservations/${held.body.reservation.id}/cancel`, {
        method: "POST",
        body: {},
        cookie: commaCookie,
        key: fresh(),
      })
    ).status,
    403,
  );
  const denied = await request("/staff/login", {
    method: "POST",
    body: { email: "denied@example.test", password: "test-password-123" },
  });
  assert.equal(denied.body.venues.length, 0);
  assert.equal(
    (
      await request(`/staff/venues/barg/reservations?date=${tomorrow}`, {
        cookie: denied.cookie,
      })
    ).status,
    403,
  );
  const list = await request(
    `/staff/venues/barg/reservations?date=${tomorrow}`,
    { cookie: bargCookie },
  );
  assert.ok(list.body.some((r) => r.id === held.body.reservation.id));
});
test("guest capability is separate from public tracking code; cancellation is repeatable and frees table", async () => {
  const held = (await hold(5, at("16"))).body;
  await confirm(held);
  assert.equal(
    (
      await request(`/public/reservations/${held.reservation.id}`, {
        token: held.reservation.code,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(`/public/reservations/${held.reservation.id}`, {
        token: randomBytes(32).toString("base64url"),
      })
    ).status,
    404,
  );
  const options = {
    method: "POST",
    body: {},
    token: held.accessToken,
    key: fresh(),
  };
  const first = await request(
    `/public/reservations/${held.reservation.id}/cancel`,
    options,
  );
  assert.equal(first.body.status, "cancelled");
  assert.deepEqual(
    first.body,
    (
      await request(
        `/public/reservations/${held.reservation.id}/cancel`,
        options,
      )
    ).body,
  );
  assert.equal((await hold(5, at("16"))).status, 201);
});
test("staff check-in obeys time and state; repeated command replays, terminal booking cannot cancel", async () => {
  const held = (await hold(6, at("18"))).body;
  await confirm(held);
  const path = `/staff/reservations/${held.reservation.id}/check-in`,
    options = { method: "POST", body: {}, cookie: bargCookie, key: fresh() };
  assert.equal((await request(path, options)).status, 409);
  await db.query(
    "UPDATE reservations SET starts_at=now()+interval '10 minutes',ends_at=now()+interval '100 minutes' WHERE id=$1",
    [held.reservation.id],
  );
  const checked = await request(path, options);
  assert.equal(checked.body.status, "checked_in");
  assert.deepEqual((await request(path, options)).body, checked.body);
  assert.equal(
    (
      await request(`/staff/reservations/${held.reservation.id}/cancel`, {
        ...options,
        key: fresh(),
      })
    ).status,
    409,
  );
});
test("menu edits are scoped to a venue, versioned and available items alone are public", async () => {
  const menu = {
    id: fresh(),
    name: "لاته آزمایشی",
    category: "قهوه",
    priceRials: 1500000,
    isAvailable: true,
  };
  const base = "/staff/venues/barg/menu/items";
  const options = { method: "POST", cookie: bargCookie, body: menu };
  const first = await request(base, options);
  assert.equal(first.status, 201);
  assert.deepEqual(first.body, (await request(base, options)).body);
  assert.equal(
    (await request(base, { ...options, cookie: commaCookie })).status,
    403,
  );
  assert.equal(
    (
      await request(base, {
        ...options,
        body: { ...menu, id: fresh(), priceRials: 999 },
      })
    ).status,
    400,
  );
  const changed = {
    ...menu,
    name: "لاته جدید",
    priceRials: 1600000,
    version: first.body.version,
  };
  const updated = await request(`${base}/${menu.id}`, {
    ...options,
    body: changed,
  });
  assert.equal(updated.body.version, 2);
  assert.equal(
    (
      await request(`${base}/${menu.id}`, {
        ...options,
        body: { ...changed, name: "ویرایش قدیمی" },
      })
    ).status,
    409,
  );
  // Lost update response can be retried verbatim even though its old version was consumed.
  assert.deepEqual(
    (await request(`${base}/${menu.id}`, { ...options, body: changed })).body,
    updated.body,
  );
  const unavailable = { ...updated.body, isAvailable: false };
  assert.equal(
    (await request(`${base}/${menu.id}`, { ...options, body: unavailable }))
      .status,
    201,
  );
  assert.equal(
    (await request("/public/venues/barg/menu")).body.some(
      (item) => item.id === menu.id,
    ),
    false,
  );
  assert.equal(
    (
      await request("/staff/venues/barg/menu", { cookie: bargCookie })
    ).body.some((item) => item.id === menu.id),
    true,
  );
  assert.equal(
    (await request("/staff/venues/barg/menu", { cookie: commaCookie })).status,
    403,
  );
});
test("orders snapshot server prices, reject stale and foreign menu items and serialize retries", async () => {
  const reservation = (
    await db.query(
      "SELECT id FROM reservations WHERE status='checked_in' LIMIT 1",
    )
  ).rows[0];
  const menu = {
    id: fresh(),
    name: "اسپرسو آزمایشی",
    category: "قهوه",
    priceRials: 900000,
    isAvailable: true,
  };
  const other = { ...menu, id: fresh(), name: "آیتم مکان دیگر" };
  const opts = { method: "POST", cookie: bargCookie };
  await request("/staff/venues/barg/menu/items", { ...opts, body: menu });
  await request("/staff/venues/comma-beheshti/menu/items", {
    ...opts,
    cookie: commaCookie,
    body: other,
  });
  const base = "/staff/venues/barg/orders";
  const input = {
    reservationId: reservation.id,
    items: [{ menuItemId: menu.id, quantity: 2, version: 1 }],
  };
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: {
          ...input,
          items: [{ menuItemId: other.id, quantity: 1, version: 1 }],
        },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: {
          ...input,
          items: [{ menuItemId: menu.id, quantity: 1, version: 99 }],
        },
      })
    ).status,
    409,
  );
  const future = (await hold(8, at("20"))).body;
  await confirm(future);
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: { ...input, reservationId: future.reservation.id },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: { ...input, items: [{ ...input.items[0], quantity: 21 }] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: { ...input, items: [input.items[0], input.items[0]] },
      })
    ).status,
    400,
  );
  const command = fresh();
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      request(base, {
        ...opts,
        key: command,
        body: {
          ...input,
          totalRials: 1,
          items: [{ ...input.items[0], unitPriceRials: 1 }],
        },
      }),
    ),
  );
  assert.ok(results.every((result) => result.status === 201));
  assert.ok(results.every((result) => result.body.id === results[0].body.id));
  const order = results[0].body;
  assert.equal(order.totalRials, 1800000);
  assert.equal(order.items[0].unitPriceRials, 900000);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM cafe_orders WHERE command_key=$1",
        [command],
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: command,
        body: { ...input, items: [{ ...input.items[0], quantity: 1 }] },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        cookie: commaCookie,
        key: fresh(),
        body: input,
      })
    ).status,
    403,
  );
  await request(`/staff/venues/barg/menu/items/${menu.id}`, {
    ...opts,
    body: { ...menu, version: 1, priceRials: 1200000 },
  });
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const list = await request(`${base}?date=${day}`, { cookie: bargCookie });
  assert.equal(
    list.body.find((row) => row.id === order.id).totalRials,
    1800000,
  );
  assert.equal(
    (await request(`${base}?date=${day}`, { cookie: commaCookie })).status,
    403,
  );
  assert.equal(
    (await request(base, { ...opts, key: fresh(), body: input })).status,
    409,
  );
  await request(`/staff/venues/barg/menu/items/${menu.id}`, {
    ...opts,
    body: { ...menu, version: 2, priceRials: 1200000, isAvailable: false },
  });
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: { ...input, items: [{ ...input.items[0], version: 3 }] },
      })
    ).status,
    409,
  );
  await request(`/staff/venues/barg/menu/items/${menu.id}`, {
    ...opts,
    body: { ...menu, version: 3, priceRials: 1200000, isAvailable: true },
  });
  await db.query(
    "UPDATE reservations SET ends_at=now()-interval '1 minute', starts_at=now()-interval '90 minutes' WHERE id=$1",
    [reservation.id],
  );
  assert.equal(
    (
      await request(base, {
        ...opts,
        key: fresh(),
        body: { ...input, items: [{ ...input.items[0], version: 4 }] },
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(base, { ...opts, key: command, body: input })).body.id,
    order.id,
  );
});
test("order state transitions authorize the venue, replay commands and reject invalid steps", async () => {
  const order = (await db.query("SELECT id FROM cafe_orders LIMIT 1")).rows[0];
  const path = `/staff/orders/${order.id}/status`;
  const opts = {
    method: "POST",
    cookie: bargCookie,
    key: fresh(),
    body: { status: "preparing" },
  };
  assert.equal(
    (await request(path, { ...opts, cookie: commaCookie })).status,
    403,
  );
  assert.equal(
    (await request(path, { ...opts, body: { status: "served" } })).status,
    409,
  );
  const first = await request(path, opts);
  assert.equal(first.body.status, "preparing");
  assert.deepEqual((await request(path, opts)).body, first.body);
  assert.equal(
    (await request(path, { ...opts, body: { status: "ready" } })).status,
    409,
  );
  assert.equal(
    (await request(path, { ...opts, key: fresh(), body: { status: "ready" } }))
      .body.status,
    "ready",
  );
  assert.equal(
    (await request(path, { ...opts, key: fresh(), body: { status: "served" } }))
      .body.status,
    "served",
  );
  assert.equal(
    (
      await request(path, {
        ...opts,
        key: fresh(),
        body: { status: "cancelled" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM cafe_order_events WHERE order_id=$1",
        [order.id],
      )
    ).rows[0].n,
    4,
  );
});
test("browser origin protection, invalid login, logout and hashed session storage", async () => {
  assert.equal(
    (
      await request("/staff/login", {
        method: "POST",
        body: { email: "barg@example.test", password: "incorrect" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/staff/login", {
        method: "POST",
        body: { email: "barg@example.test", password: "test-password-123" },
        headers: { origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/staff/session", {
        method: "DELETE",
        cookie: bargCookie,
        headers: { origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (await request("/staff/session", { cookie: bargCookie })).status,
    200,
  );
  const raw = bargCookie.split("=")[1];
  assert.equal(
    (await db.query("SELECT 1 FROM staff_sessions WHERE token_hash=$1", [raw]))
      .rowCount,
    0,
  );
  assert.equal(
    (await request("/staff/session", { method: "DELETE", cookie: bargCookie }))
      .status,
    200,
  );
  assert.equal(
    (await request("/staff/session", { cookie: bargCookie })).status,
    401,
  );
});
