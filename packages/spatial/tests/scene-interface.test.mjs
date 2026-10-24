import test from "node:test";
import assert from "node:assert/strict";
import { defineScene, routeToTarget, createNavigation } from "@repo/spatial";
import { residentialScene } from "./fixtures/residential-scene.ts";

test("A residential scene uses the spatial interface without cafe fields or an entrance waypoint", () => {
  const scene = residentialScene();
  assert.equal(scene.initialWaypoint, "foyer");
  assert.equal(Object.hasOwn(scene.waypoints, "entrance"), false);
  assert.equal(Object.hasOwn(scene, "tables"), false);
  for (const target of scene.targets) {
    const result = routeToTarget(
      scene.waypoints.foyer,
      target,
      scene.navigation,
    );
    assert.ok(result);
    assert.deepEqual(result.point, target.focus);
    for (const point of result.route)
      assert.ok(scene.navigation.isWalkable(point.x, point.z));
  }
});

test("Room selection and resource disposal cross the same scene interface as the runtime", () => {
  const selected = [],
    disposed = [];
  const scene = residentialScene(
    (id) => selected.push(id),
    () => disposed.push(true),
  );
  const instance = scene.build();
  assert.deepEqual(
    instance.pickTargets.map(({ id }) => id),
    ["living-room", "bedroom"],
  );
  instance.setSelectedTarget("bedroom");
  instance.setSelectedTarget(null);
  assert.deepEqual(selected, ["bedroom", null]);
  assert.equal(instance.reduceQuality, undefined);
  instance.dispose();
  assert.equal(instance.scene.children.length, 0);
  assert.equal(disposed.length, 1);
});

test("Invalid scene definitions fail before renderer allocation", () => {
  const scene = residentialScene();
  for (const change of [
    { initialWaypoint: "missing" },
    { targets: [scene.targets[0], scene.targets[0]] },
    { targets: [{ ...scene.targets[0], x: NaN }] },
    { bounds: { ...scene.bounds, maxX: scene.bounds.minX } },
    { waypoints: { foyer: { x: 99, z: 99, look: [0, 0] } } },
  ])
    assert.throws(() => defineScene({ ...scene, ...change }));
});

test("A blocked room focus is rejected instead of moving outside its requested room", () => {
  const scene = residentialScene();
  const navigation = createNavigation(scene.bounds, [
    { x: -2, z: 0, w: 1, d: 1 },
  ]);
  assert.equal(
    routeToTarget(scene.waypoints.foyer, scene.targets[0], navigation),
    null,
  );
});
