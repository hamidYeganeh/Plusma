import { BARG_TABLES as TABLES } from "../../data/barg-tables.js";
export { TABLES };
export const ROOM = { width: 12, depth: 14, height: 3.55 };
export const POND = { x: 0.65, z: -0.5, width: 1.9, depth: 4.6, height: 0.55 };
export const LANDMARKS = {
  tree: { x: 4.85, z: 2.7, w: 1.22, d: 1.22 },
  pots: [
    { x: POND.x - POND.width / 2 - 0.34, z: -1.5, size: 1 },
    { x: POND.x + POND.width / 2 + 0.34, z: 0.1, size: 1.15 },
    { x: POND.x - POND.width / 2 - 0.36, z: 1.3, size: 0.8 },
  ],
  planter: { x: POND.x, z: POND.z + POND.depth / 2 + 0.44, w: 1.62, d: 0.58 },
};
// Chair local +Z is the backrest: every seat faces its own edge of the table.
export function chairLayout(t) {
  const gap = 0.105,
    front = t.d / 2 + 0.225 + gap,
    side = t.w / 2 + 0.225 + gap;
  const seat = (dx, dz, rotation, i) => ({
    x: t.x + dx,
    z: t.z + dz,
    rotation: rotation + Math.sin(t.id * 13 + i * 7) * 0.025,
  });
  if (t.seating === "back-bench")
    return [-0.3, 0.3].map((x, i) => seat(x, front, 0, i));
  if (t.seating === "right-bench")
    return [-0.275, 0.275].map((z, i) => seat(-side, z, -Math.PI / 2, i));
  if (t.chairs === 6)
    return [-0.73, 0, 0.73].flatMap((x, i) => [
      seat(x, front + (i === 2 ? 0.025 : 0), 0, i),
      seat(x, -front, Math.PI, i + 3),
    ]);
  if (t.chairs === 4)
    return [
      seat(0.02, front, 0, 0),
      seat(-0.02, -front, Math.PI, 1),
      seat(-side, 0, -Math.PI / 2, 2),
      seat(side, 0, Math.PI / 2, 3),
    ];
  return [seat(0.025, front, 0, 0), seat(-0.025, -front, Math.PI, 1)];
}
export const PLACES = {
  entrance: { x: -4.85, z: 5.85, look: [0.5, -1.4], label: "ورودی" },
  pond: { x: 2.1, z: 2.6, look: [0.65, -1.6], label: "کنار حوض" },
  left: { x: -5.2, z: -1.6, look: [-3.2, -3.5], label: "دیوار چپ" },
  lounge: { x: 3, z: -3.6, look: [4.8, -4.7], label: "نشیمن" },
};
export const COLLIDERS = [
  { x: POND.x, z: POND.z, w: POND.width, d: POND.depth },
  { x: 0, z: -6.43, w: 10.9, d: 0.58 },
  { x: 5.66, z: -1.25, w: 0.58, d: 8.7 },
  LANDMARKS.tree,
  LANDMARKS.planter,
  ...LANDMARKS.pots.map((p) => ({
    x: p.x,
    z: p.z,
    w: 0.48 * p.size,
    d: 0.48 * p.size,
  })),
  ...TABLES.flatMap((t) => [
    { x: t.x, z: t.z, w: t.w, d: t.d },
    ...chairLayout(t).map((c) => ({
      x: c.x,
      z: c.z,
      w:
        Math.abs(Math.cos(c.rotation)) * 0.5 +
        Math.abs(Math.sin(c.rotation)) * 0.53,
      d:
        Math.abs(Math.sin(c.rotation)) * 0.5 +
        Math.abs(Math.cos(c.rotation)) * 0.53,
    })),
  ]),
  { x: -5.6, z: -6, w: 0.4, d: 0.4 },
  { x: -5.65, z: 1, w: 0.25, d: 0.4 },
];
export function isWalkable(x, z, r = 0.21) {
  if (x < -5.65 + r || x > 5.65 - r || z < -6.65 + r || z > 6.65 - r)
    return false;
  return !COLLIDERS.some(
    (c) => Math.abs(x - c.x) < c.w / 2 + r && Math.abs(z - c.z) < c.d / 2 + r,
  );
}
// Grid A* prevents click-to-walk routes from cutting through the pond or furniture.
export function findPath(start, end, cell = 0.26) {
  if (
    !Number.isFinite(end.x) ||
    !Number.isFinite(end.z) ||
    end.x < -5.65 ||
    end.x > 5.65 ||
    end.z < -6.65 ||
    end.z > 6.65
  )
    return [];
  const minX = -5.4,
    minZ = -6.4,
    cols = 43,
    rows = 50;
  const at = (x, z) => [
    Math.max(0, Math.min(cols - 1, Math.round((x - minX) / cell))),
    Math.max(0, Math.min(rows - 1, Math.round((z - minZ) / cell))),
  ];
  const world = (i, j) => ({ x: minX + i * cell, z: minZ + j * cell });
  const key = (i, j) => j * cols + i;
  function nearest(p) {
    let best = null,
      bestD = Infinity;
    const [a, b] = at(p.x, p.z);
    for (let r = 0; r < 7; r++) {
      for (let i = Math.max(0, a - r); i <= Math.min(cols - 1, a + r); i++)
        for (let j = Math.max(0, b - r); j <= Math.min(rows - 1, b + r); j++) {
          const v = world(i, j);
          const d = Math.hypot(v.x - p.x, v.z - p.z);
          if (d < bestD && isWalkable(v.x, v.z, 0.23)) {
            best = [i, j];
            bestD = d;
          }
        }
      if (best && bestD < cell * (r + 0.5)) break;
    }
    return best;
  }
  const s = nearest(start),
    e = nearest(end);
  if (!s || !e) return [];
  const open = [s],
    came = new Map(),
    g = new Map([[key(...s), 0]]),
    closed = new Set();
  const heuristic = (i, j) => Math.hypot(i - e[0], j - e[1]);
  let found = false;
  while (open.length) {
    let bi = 0,
      bf = Infinity;
    for (let k = 0; k < open.length; k++) {
      let n = open[k],
        f = g.get(key(...n)) + heuristic(...n);
      if (f < bf) {
        bf = f;
        bi = k;
      }
    }
    const n = open.splice(bi, 1)[0],
      nk = key(...n);
    if (n[0] === e[0] && n[1] === e[1]) {
      found = true;
      break;
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
        const a = world(n[0] + dx, n[1]),
          b = world(n[0], n[1] + dz);
        if (!isWalkable(a.x, a.z, 0.23) || !isWalkable(b.x, b.z, 0.23))
          continue;
      }
      const score = g.get(nk) + Math.hypot(dx, dz);
      if (score < (g.get(k) ?? Infinity)) {
        came.set(k, n);
        g.set(k, score);
        if (!open.some((v) => v[0] === i && v[1] === j)) open.push([i, j]);
      }
    }
  }
  if (!found) return [];
  const path = [];
  let n = e;
  while (n) {
    path.unshift(world(...n));
    n = came.get(key(...n));
  }
  path.shift();
  return path;
}
