import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACES,
  TABLES,
  isWalkable,
  findPath,
} from "../modules/cafe/scenes/barg/layout.js";
import { routeToTarget } from "@repo/spatial";
import { initialRenderQuality, needsLighterRendering } from "@repo/spatial";

test("Every table can be approached from every visitor waypoint without crossing furniture", () => {
  for (const [name, start] of Object.entries(PLACES)) {
    for (const table of TABLES) {
      const approach = routeToTarget(start, table, { findPath, isWalkable });
      assert.ok(approach, `${name} to table ${table.id}`);
      assert.ok(
        Math.hypot(approach.point.x - table.x, approach.point.z - table.z) <=
          2.21,
      );
      let previous = start;
      for (const point of approach.route) {
        for (let step = 0; step <= 10; step++) {
          const t = step / 10;
          assert.ok(
            isWalkable(
              previous.x + (point.x - previous.x) * t,
              previous.z + (point.z - previous.z) * t,
              0.2,
            ),
            `${name} to table ${table.id} crosses furniture`,
          );
        }
        previous = point;
      }
    }
  }
});

test("Mobile and constrained devices avoid the extra reflection render pass", () => {
  for (const device of [
    { compact: true, cores: 8, memory: 8 },
    { compact: false, cores: 4, memory: 8 },
    { compact: false, cores: 8, memory: 2 },
    { compact: false, cores: 8, memory: 8, saveData: true },
  ]) {
    const budget = initialRenderQuality(device);
    assert.equal(budget.reflections, false);
    assert.ok(budget.pixelRatio <= 1.1);
    assert.ok(budget.textureSize <= 512);
    assert.ok(budget.shadowSize <= 512);
  }
});

test("Adaptive quality ignores isolated stalls but detects sustained slow frames", () => {
  assert.equal(needsLighterRendering(Array(89).fill(50)), false);
  assert.equal(
    needsLighterRendering([...Array(85).fill(16.7), ...Array(5).fill(300)]),
    false,
  );
  assert.equal(needsLighterRendering(Array(90).fill(45)), true);
});
