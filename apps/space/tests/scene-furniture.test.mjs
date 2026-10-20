import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createWireChair,
  createHollowLogs,
  createDecoratedTree,
  createEntranceFacade,
} from "../modules/explore/scenes/barg/reference-objects.js";

function inspect(group) {
  let triangles = 0;
  const geometries = new Set();
  group.traverse((object) => {
    if (!object.geometry) return;
    geometries.add(object.geometry);
    const position = object.geometry.attributes.position;
    for (const value of position.array)
      assert.ok(
        Number.isFinite(value),
        "invalid vertex would break bounds/culling",
      );
    if (object.isMesh)
      triangles += (object.geometry.index?.count ?? position.count) / 3;
  });
  const bounds = new THREE.Box3().setFromObject(group);
  assert.ok(!bounds.isEmpty());
  geometries.forEach((geometry) => geometry.dispose());
  return { triangles, bounds };
}

test("Wire chair stays within its furniture footprint and mobile geometry budget", () => {
  const surface = new THREE.MeshStandardMaterial(),
    wire = new THREE.LineBasicMaterial();
  const { triangles, bounds } = inspect(
    createWireChair(surface, surface, wire),
  );
  assert.ok(triangles < 1000, "a repeated chair must stay inexpensive");
  assert.ok(bounds.min.y >= 0 && bounds.max.y < 1.15);
  assert.ok(bounds.max.x - bounds.min.x < 0.56);
  surface.dispose();
  wire.dispose();
});
test("Photo landmarks produce finite geometry without a browser or renderer", () => {
  const material = new THREE.MeshStandardMaterial(),
    wire = new THREE.LineBasicMaterial();
  for (const group of [
    createHollowLogs(material, material, material),
    createDecoratedTree(
      material,
      material,
      material,
      material,
      material,
      material,
      wire,
    ),
    createEntranceFacade(
      material,
      material,
      material,
      material,
      material,
      material,
    ),
  ]) {
    assert.ok(
      inspect(group).triangles < 12000,
      "landmark exceeded its static geometry budget",
    );
  }
  material.dispose();
  wire.dispose();
});
