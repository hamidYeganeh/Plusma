/** Scene-local collision and grid routing; no renderer or venue dependency. */
export function createNavigation(bounds, colliders) {
  function isWalkable(x, z, radius = 0.21) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(z) ||
      x < bounds.minX + radius ||
      x > bounds.maxX - radius ||
      z < bounds.minZ + radius ||
      z > bounds.maxZ - radius
    )
      return false;
    return !colliders.some(
      (c) =>
        Math.abs(x - c.x) < c.w / 2 + radius &&
        Math.abs(z - c.z) < c.d / 2 + radius,
    );
  }
  function findPath(start, end, cell = 0.26) {
    if (!isWalkable(end.x, end.z, 0.23)) return [];
    const minX = bounds.minX + 0.3,
      minZ = bounds.minZ + 0.3;
    const cols = Math.floor((bounds.maxX - minX - 0.3) / cell) + 1,
      rows = Math.floor((bounds.maxZ - minZ - 0.3) / cell) + 1;
    const world = (i, j) => ({ x: minX + i * cell, z: minZ + j * cell });
    const key = (i, j) => j * cols + i;
    function nearest(p) {
      const a = Math.round((p.x - minX) / cell),
        b = Math.round((p.z - minZ) / cell);
      let best = null,
        distance = Infinity;
      for (let r = 0; r < 5; r++) {
        for (let i = Math.max(0, a - r); i <= Math.min(cols - 1, a + r); i++)
          for (
            let j = Math.max(0, b - r);
            j <= Math.min(rows - 1, b + r);
            j++
          ) {
            const v = world(i, j),
              d = Math.hypot(v.x - p.x, v.z - p.z);
            // The join to the grid must also be clear, including a diagonal join.
            if (
              d < distance &&
              [0, 0.25, 0.5, 0.75, 1].every((t) =>
                isWalkable(p.x + (v.x - p.x) * t, p.z + (v.z - p.z) * t, 0.2),
              ) &&
              isWalkable(v.x, v.z, 0.23)
            ) {
              best = [i, j];
              distance = d;
            }
          }
        if (best) break;
      }
      return best;
    }
    const s = nearest(start),
      e = nearest(end);
    if (!s || !e) return [];
    const open = [s],
      came = new Map(),
      scores = new Map([[key(...s), 0]]),
      closed = new Set();
    while (open.length) {
      let best = 0,
        distance = Infinity;
      for (let n = 0; n < open.length; n++) {
        const p = open[n],
          f = scores.get(key(...p)) + Math.hypot(p[0] - e[0], p[1] - e[1]);
        if (f < distance) {
          best = n;
          distance = f;
        }
      }
      const n = open.splice(best, 1)[0],
        nk = key(...n);
      if (n[0] === e[0] && n[1] === e[1]) {
        const path = [];
        let cursor = e;
        while (cursor) {
          path.unshift(world(...cursor));
          cursor = came.get(key(...cursor));
        }
        // Keep the first grid point: skipping it can cut across a chair corner.
        return path;
      }
      closed.add(nk);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const i = n[0] + dx,
          j = n[1] + dz,
          k = key(i, j),
          p = world(i, j);
        if (
          i < 0 ||
          i >= cols ||
          j < 0 ||
          j >= rows ||
          closed.has(k) ||
          !isWalkable(p.x, p.z, 0.23)
        )
          continue;
        if (dx && dz) {
          const a = world(i, n[1]),
            b = world(n[0], j);
          if (!isWalkable(a.x, a.z, 0.23) || !isWalkable(b.x, b.z, 0.23))
            continue;
        }
        const g = scores.get(nk) + Math.hypot(dx, dz);
        if (g < (scores.get(k) ?? Infinity)) {
          scores.set(k, g);
          came.set(k, n);
          if (!open.some((v) => v[0] === i && v[1] === j)) open.push([i, j]);
        }
      }
    }
    return [];
  }
  return { isWalkable, findPath };
}
