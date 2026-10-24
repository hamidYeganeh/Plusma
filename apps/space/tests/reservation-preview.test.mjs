import test from "node:test";
import assert from "node:assert/strict";
import { visitDays } from "../modules/cafe/reservations/booking-dates.ts";
import {
  BookingRequestError,
  createBookingClient,
} from "../modules/cafe/reservations/booking-client.ts";

const held = {
  id: "reservation-1",
  code: "P-1234",
  venueSlug: "barg",
  venueName: "برگ",
  timeZone: "Asia/Tehran",
  tableId: 1,
  guests: 2,
  startsAt: "2026-10-25T12:30:00Z",
  endsAt: "2026-10-25T14:00:00Z",
  status: "held",
  expiresAt: "2026-10-24T11:05:00Z",
  guestName: null,
  guestPhone: null,
};
const result = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test("Visit dates follow the venue's midnight and cross year boundaries", () => {
  assert.deepEqual(
    visitDays(new Date("2026-10-20T21:30:00Z"))
      .slice(0, 3)
      .map((day) => day.id),
    ["2026-10-21", "2026-10-22", "2026-10-23"],
  );
  assert.deepEqual(
    visitDays(new Date("2026-12-31T20:00:00Z"))
      .slice(0, 3)
      .map((day) => day.id),
    ["2026-12-31", "2027-01-01", "2027-01-02"],
  );
  assert.equal(
    visitDays(new Date("2026-10-20T21:30:00Z"), "Europe/London")[0].id,
    "2026-10-20",
  );
});

test("A lost hold response is recovered after reopen with the same key and payload", async () => {
  const storage = memoryStorage(),
    calls = [];
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    storage,
    randomId: () => "first-intent",
    fetch: async (url, init) => {
      calls.push({ url, init });
      throw new TypeError("network lost");
    },
  });
  await assert.rejects(
    client.hold(held.startsAt, 2),
    (error) => error instanceof BookingRequestError && error.status === 0,
  );
  assert.equal(client.pendingAction(), "hold");
  const reopened = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    storage,
    randomId: () => "must-not-be-used",
    fetch: async (url, init) => {
      calls.push({ url, init });
      return result(
        url.endsWith("/holds")
          ? { reservation: held, accessToken: "secret-capability" }
          : held,
      );
    },
  });
  assert.deepEqual(await reopened.refresh(), held);
  assert.equal(
    calls[0].init.headers["Idempotency-Key"],
    calls[1].init.headers["Idempotency-Key"],
  );
  assert.equal(calls[0].init.body, calls[1].init.body);
  assert.equal(reopened.pendingAction(), null);
  assert.equal(calls[1].url.includes("secret-capability"), false);
});

test("Confirm and cancellation recover uncertain results; tracking uses the capability header", async () => {
  const storage = memoryStorage(),
    calls = [];
  let failConfirm = true,
    failCancel = true;
  const confirmed = {
    ...held,
    status: "confirmed",
    expiresAt: null,
    guestName: "مهمان",
    guestPhone: "09123456789",
  };
  const cancelled = { ...confirmed, status: "cancelled" };
  let serverCurrent = held;
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    storage,
    randomId: () => `intent-${calls.length}`,
    fetch: async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith("/holds"))
        return result({ reservation: held, accessToken: "capability" });
      assert.equal(init.headers.Authorization, "Bearer capability");
      assert.equal(url.includes("capability"), false);
      if (url.endsWith("/confirm")) {
        if (failConfirm) {
          failConfirm = false;
          return result({}, 503);
        }
        serverCurrent = confirmed;
        return result(confirmed);
      }
      if (url.endsWith("/cancel")) {
        if (failCancel) {
          failCancel = false;
          throw new TypeError("network lost");
        }
        serverCurrent = cancelled;
        return result(cancelled);
      }
      return result(serverCurrent);
    },
  });
  await client.hold(held.startsAt, 2);
  await assert.rejects(
    client.confirm({ guestName: "مهمان", guestPhone: "09123456789" }),
  );
  assert.equal(client.pendingAction(), "confirm");
  assert.deepEqual(await client.refresh(), confirmed);
  assert.equal(
    calls[1].init.headers["Idempotency-Key"],
    calls[2].init.headers["Idempotency-Key"],
  );
  assert.equal(calls[1].init.body, calls[2].init.body);
  assert.deepEqual(await client.refresh(), confirmed);
  assert.equal(client.startOver(), false);
  await assert.rejects(client.cancel());
  assert.equal(client.pendingAction(), "cancel");
  assert.deepEqual(await client.refresh(), cancelled);
  const cancellations = calls.filter((call) => call.url.endsWith("/cancel"));
  assert.equal(
    cancellations[0].init.headers["Idempotency-Key"],
    cancellations[1].init.headers["Idempotency-Key"],
  );
  assert.equal(client.startOver(), true);
  assert.equal(await client.refresh(), null);
});

test("Capabilities are scoped to venue/table and server rejection does not leave a pending hold", async () => {
  const storage = memoryStorage();
  const first = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    storage,
    randomId: () => "key",
    fetch: async () => result({ reservation: held, accessToken: "private" }),
  });
  await first.hold(held.startsAt, 2);
  for (const scope of [
    { venueSlug: "barg", tableId: 2 },
    { venueSlug: "comma-beheshti", tableId: 1 },
  ]) {
    const other = createBookingClient({
      ...scope,
      storage,
      fetch: async () => {
        assert.fail("Must not fetch a foreign session");
      },
    });
    assert.equal(await other.refresh(), null);
  }
  const rejected = createBookingClient({
    venueSlug: "other",
    tableId: 1,
    storage,
    randomId: () => "key",
    fetch: async () => result({}, 409),
  });
  await assert.rejects(
    rejected.hold(held.startsAt, 2),
    (error) => error.status === 409,
  );
  assert.equal(rejected.pendingAction(), null);
});

test("Availability uses backend slots and does not send private booking capability", async () => {
  const availability = {
    venue: { slug: "barg", name: "برگ", timeZone: "Asia/Tehran" },
    date: "2026-10-25",
    table: { id: 1, capacity: 2 },
    durationMinutes: 90,
    holdMinutes: 5,
    slots: [
      {
        startsAt: held.startsAt,
        endsAt: held.endsAt,
        label: "16:00",
        available: false,
      },
    ],
  };
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    fetch: async (url, init) => {
      assert.equal(
        url,
        "/api/v1/public/venues/barg/availability?date=2026-10-25&tableId=1&guests=2",
      );
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.cache, "no-store");
      return result(availability);
    },
  });
  assert.deepEqual(await client.availability("2026-10-25", 2), availability);
});

test("Repeated clicks share one pending mutation rather than placing two holds", async () => {
  let respond;
  let requests = 0;
  const response = new Promise((resolve) => {
    respond = resolve;
  });
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    randomId: () => "one-intent",
    fetch: async () => {
      requests++;
      return response;
    },
  });
  const first = client.hold(held.startsAt, 2);
  const repeated = client.hold(held.startsAt, 2);
  assert.equal(requests, 1);
  respond(result({ reservation: held, accessToken: "private" }));
  assert.deepEqual(await first, held);
  assert.deepEqual(await repeated, held);
});

test("A truncated success response remains recoverable with the original idempotency key", async () => {
  const keys = [];
  let attempts = 0;
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    randomId: () => "original-intent",
    fetch: async (url, init) => {
      if (!url.endsWith("/holds")) return result(held);
      keys.push(init.headers["Idempotency-Key"]);
      if (attempts++ === 0)
        return new Response('{"reservation":', { status: 201 });
      return result({ reservation: held, accessToken: "private" });
    },
  });
  await assert.rejects(client.hold(held.startsAt, 2));
  assert.equal(client.pendingAction(), "hold");
  assert.deepEqual(await client.refresh(), held);
  assert.deepEqual(keys, ["original-intent", "original-intent"]);
});

test("Guest contact uses canonical phone digits for backend validation and retry identity", async () => {
  const confirmed = {
    ...held,
    status: "confirmed",
    expiresAt: null,
    guestName: "مهمان",
    guestPhone: "+989123456789",
  };
  const client = createBookingClient({
    venueSlug: "barg",
    tableId: 1,
    randomId: () => "intent",
    fetch: async (url, init) => {
      if (url.endsWith("/holds"))
        return result({ reservation: held, accessToken: "private" });
      assert.deepEqual(JSON.parse(init.body), {
        guestName: "مهمان",
        guestPhone: "+989123456789",
      });
      return result(confirmed);
    },
  });
  await client.hold(held.startsAt, 2);
  assert.deepEqual(
    await client.confirm({
      guestName: " مهمان ",
      guestPhone: "+۹۸ (٩١٢) ۳۴۵-۶۷۸۹",
    }),
    confirmed,
  );
});
