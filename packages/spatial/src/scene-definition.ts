import type { SceneDefinition } from "./contracts.ts";

/** Validate the scene interface before allocating browser/GPU resources. */
export function defineScene(definition: SceneDefinition): SceneDefinition {
  const { id, targets, initialWaypoint, waypoints, bounds } = definition;
  if (!id || !Object.hasOwn(waypoints, initialWaypoint))
    throw new Error("A scene needs an id and a valid initial waypoint");
  if (
    !Object.values(bounds).every(Number.isFinite) ||
    bounds.maxX <= bounds.minX ||
    bounds.maxZ <= bounds.minZ
  )
    throw new Error(`Invalid bounds for scene ${id}`);
  const ids = new Set<string>();
  for (const target of targets) {
    if (!target.id || ids.has(target.id))
      throw new Error(`Duplicate or empty target in scene ${id}`);
    if (
      ![target.x, target.z, target.w, target.d].every(Number.isFinite) ||
      target.w <= 0 ||
      target.d <= 0
    )
      throw new Error(`Invalid geometry for target ${target.id}`);
    if (
      target.markerHeight !== undefined &&
      !Number.isFinite(target.markerHeight)
    )
      throw new Error(`Invalid marker height for target ${target.id}`);
    if (
      target.focus &&
      (!Number.isFinite(target.focus.x) || !Number.isFinite(target.focus.z))
    )
      throw new Error(`Invalid focus for target ${target.id}`);
    ids.add(target.id);
  }
  for (const [name, waypoint] of Object.entries(waypoints)) {
    if (
      ![waypoint.x, waypoint.z, ...waypoint.look].every(Number.isFinite) ||
      waypoint.look.length !== 2 ||
      !definition.navigation.isWalkable(waypoint.x, waypoint.z)
    )
      throw new Error(`Invalid waypoint ${name} in scene ${id}`);
  }
  return definition;
}
