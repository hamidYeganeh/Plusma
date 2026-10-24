import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACES,
  TABLES,
  LANDMARKS,
  findPath,
  isWalkable,
} from "../modules/cafe/scenes/comma/layout.js";
import { routeToTarget } from "@repo/spatial";

function assertClearRoute(start, route) {
  assert.ok(route.length);
  let previous = start;
  for (const point of route) {
    for (let step = 0; step <= 12; step++) {
      const t = step / 12;
      assert.ok(
        isWalkable(
          previous.x + (point.x - previous.x) * t,
          previous.z + (point.z - previous.z) * t,
          0.2,
        ),
        "route crosses a wall, plant or chair",
      );
    }
    previous = point;
  }
}

test("Comma's courtyard, two greenhouse doors, hall and bar form connected walk routes", () => {
  for (const start of Object.values(PLACES)) {
    assert.ok(isWalkable(start.x, start.z));
    for (const end of Object.values(PLACES))
      if (start !== end) assertClearRoute(start, findPath(start, end));
  }
  for (const x of [-3.75, 1.25]) assert.ok(isWalkable(x, 8));
  for (const x of [-5.5, -1, 4])
    assert.equal(isWalkable(x, 8), false, "glazing must block walking");
  for (const object of [
    LANDMARKS.tree,
    LANDMARKS.bar,
    ...LANDMARKS.plants,
    ...TABLES,
  ])
    assert.equal(isWalkable(object.x, object.z), false);
  for (const point of [
    { x: 0, z: 100 },
    { x: Infinity, z: 0 },
    { x: NaN, z: 0 },
  ])
    assert.deepEqual(findPath(PLACES.entrance, point), []);
});

test("Every Comma table is reachable using Comma's own collision layout", () => {
  for (const [name, start] of Object.entries(PLACES)) {
    for (const table of TABLES) {
      const approach = routeToTarget(start, table, { findPath, isWalkable });
      assert.ok(approach, `${name} to table ${table.id}`);
      assert.ok(
        Math.hypot(approach.point.x - table.x, approach.point.z - table.z) <=
          2.21,
      );
      assertClearRoute(start, approach.route);
    }
  }
});
