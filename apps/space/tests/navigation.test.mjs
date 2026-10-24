import test from "node:test";
import assert from "node:assert/strict";
import {
  isWalkable,
  findPath,
  PLACES,
  POND,
  TABLES,
  LANDMARKS,
} from "../modules/cafe/scenes/barg/layout.js";
test("Every visitor waypoint has free standing space", () => {
  for (const [name, p] of Object.entries(PLACES))
    assert.ok(isWalkable(p.x, p.z), name);
});
test("Pond, tables, planting ledges and outside the room are impassable", () => {
  assert.equal(isWalkable(POND.x, POND.z), false);
  for (const t of TABLES) assert.equal(isWalkable(t.x, t.z), false);
  for (const p of [LANDMARKS.tree, LANDMARKS.planter, ...LANDMARKS.pots])
    assert.equal(isWalkable(p.x, p.z), false);
  for (const p of [
    [0, -6.2],
    [5.4, 0],
    [-7, 0],
    [0, 8],
  ])
    assert.equal(isWalkable(...p), false);
});
test("Every pair of waypoints is reachable around obstacles", () => {
  for (const [a, start] of Object.entries(PLACES))
    for (const [b, end] of Object.entries(PLACES)) {
      if (a === b) continue;
      const path = findPath(start, end);
      assert.ok(path.length, `${a} to ${b}`);
      const last = path.at(-1);
      assert.ok(Math.hypot(last.x - end.x, last.z - end.z) < 0.4);
      let prev = start;
      for (const p of path) {
        assert.ok(isWalkable(p.x, p.z, 0.23));
        for (let t = 0; t <= 1; t += 0.1)
          assert.ok(
            isWalkable(
              prev.x + (p.x - prev.x) * t,
              prev.z + (p.z - prev.z) * t,
              0.2,
            ),
            `${a} to ${b} crosses obstacle`,
          );
        prev = p;
      }
    }
});
test("Unreachable clicks outside the cafe return no route", () => {
  assert.deepEqual(findPath(PLACES.entrance, { x: 100, z: 100 }), []);
});

import { joystickVector } from "@repo/spatial";
test("Joystick has a dead zone and clamps diagonal movement to unit length", () => {
  assert.equal(joystickVector(1, 1).x, 0);
  assert.equal(Math.abs(joystickVector(1, 1).y), 0);
  const far = joystickVector(200, -200);
  assert.ok(Math.abs(Math.hypot(far.x, far.y) - 1) < 1e-10);
  assert.ok(far.x > 0 && far.y > 0);
  assert.ok(Math.abs(Math.hypot(far.knobX, far.knobY) - 36) < 1e-10);
});
