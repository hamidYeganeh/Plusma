import test from "node:test";
import assert from "node:assert/strict";
import {
  visitDays,
  validDemoChoice,
} from "../modules/reservations/demo-options.js";

const now = new Date("2026-10-20T21:30:00Z");
test("Visit dates follow Tehran midnight and cross month boundaries correctly", () => {
  assert.deepEqual(
    visitDays(now).map((day) => day.id),
    ["2026-10-21", "2026-10-22", "2026-10-23"],
  );
  assert.deepEqual(
    visitDays(new Date("2026-12-31T20:00:00Z")).map((day) => day.id),
    ["2026-12-31", "2027-01-01", "2027-01-02"],
  );
});
test("Preview cannot accept more guests than the selected table or unlisted times/dates", () => {
  const choice = { day: "2026-10-21", time: "18:00", guests: 2 };
  assert.equal(validDemoChoice(choice, 2, now), true);
  for (const change of [
    { guests: 3 },
    { guests: 0 },
    { guests: 1.5 },
    { time: "03:00" },
    { day: "2026-10-20" },
    { day: "invalid" },
  ])
    assert.equal(validDemoChoice({ ...choice, ...change }, 2, now), false);
});
