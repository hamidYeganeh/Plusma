import { findPath, isWalkable } from "./scenes/barg/layout.js";

/** Find a reachable standing point beside a table, never inside its furniture. */
export function routeToTable(start, table) {
  const candidates = [];
  for (const radius of [1.15, 1.5, 1.85, 2.2]) {
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const point = {
        x: table.x + Math.sin(angle) * radius,
        z: table.z + Math.cos(angle) * radius,
      };
      if (!isWalkable(point.x, point.z, 0.23)) continue;
      const route = findPath(start, point);
      if (route.length) candidates.push({ point, route });
    }
    if (candidates.length) break;
  }
  candidates.sort((a, b) => a.route.length - b.route.length);
  return candidates[0] ?? null;
}
