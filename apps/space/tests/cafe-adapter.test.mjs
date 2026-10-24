import test from "node:test";
import assert from "node:assert/strict";
import { cafes } from "../modules/cafe/index.ts";
import { loadCafeScene } from "../modules/cafe/scenes/index.ts";
import { routeToTarget } from "@repo/spatial";

test("Both cafe adapters expose exactly the catalog's stable targets", async () => {
  for (const cafe of cafes) {
    const scene = await loadCafeScene(cafe.scene);
    assert.deepEqual(
      scene.targets.map(({ id }) => id),
      cafe.tables.map(({ targetId }) => targetId),
    );
    for (const target of scene.targets) {
      const approach = routeToTarget(
        scene.waypoints[scene.initialWaypoint],
        target,
        scene.navigation,
      );
      assert.ok(approach, `${cafe.slug}: ${target.id}`);
    }
  }
});

test("Unknown scenes fail explicitly rather than displaying another cafe", async () => {
  for (const id of ["missing", "", "__proto__", "toString"])
    await assert.rejects(() => loadCafeScene(id), /Unknown cafe scene/);
});
