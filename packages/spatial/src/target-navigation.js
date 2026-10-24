/** Find a reachable standing point beside a target using the supplied scene navigation. */
export function routeToTarget(start, target, navigation) {
  if (target.focus) {
    if (!navigation.isWalkable(target.focus.x, target.focus.z, 0.23))
      return null;
    const route = navigation.findPath(start, target.focus);
    return route.length ? { point: target.focus, route } : null;
  }
  const candidates = [];
  for (const radius of [1.15, 1.5, 1.85, 2.2]) {
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const point = {
        x: target.x + Math.sin(angle) * radius,
        z: target.z + Math.cos(angle) * radius,
      };
      if (!navigation.isWalkable(point.x, point.z, 0.23)) continue;
      const route = navigation.findPath(start, point);
      if (route.length) candidates.push({ point, route });
    }
    if (candidates.length) break;
  }
  candidates.sort((a, b) => a.route.length - b.route.length);
  return candidates[0] ?? null;
}
