import { COMMA_TABLES as TABLES } from "../../data/comma-beheshti-tables.js";
import { createNavigation } from "@repo/spatial";
export { TABLES };

// Areas follow the official description. Aspect ratios and connections are inferred.
export const ROOM = { width: 12.5, depth: 32, height: 6.9 };
export const BOUNDS = { minX: -6.25, maxX: 6.25, minZ: -16, maxZ: 16 };
export const PLACES = {
  entrance: { x: -0.8, z: 14.7, look: [0, 6], label: "ورودی حیاط" },
  courtyard: { x: 0, z: 9.5, look: [1.5, 12.5], label: "حیاط" },
  bar: { x: 0.1, z: 3.3, look: [3.6, 4.6], label: "بار قهوه" },
  hall: { x: -0.9, z: -9.2, look: [0.5, -1], label: "سالن دوارتفاع" },
};
export const LANDMARKS = {
  tree: { x: 1.15, z: 12.35, w: 1.3, d: 1.3 },
  bar: { x: 3.9, z: 4.65, w: 3.65, d: 0.85 },
  plants: [
    { x: -5.7, z: 7.3, w: 0.7, d: 0.7, size: 1.05 },
    { x: -1.8, z: 7.3, w: 0.7, d: 0.7, size: 1 },
    { x: 5.65, z: 7.1, w: 0.7, d: 0.7, size: 1.1 },
    { x: 0.55, z: -3.4, w: 1, d: 1, size: 1.8 },
    { x: -0.55, z: -5.1, w: 0.85, d: 0.85, size: 1.6 },
    { x: 5.6, z: 14.9, w: 0.65, d: 0.65, size: 0.85 },
    { x: -5.65, z: -14.8, w: 0.7, d: 0.7, size: 1.5 },
  ],
};
export function chairLayout(t) {
  const front = t.d / 2 + 0.38,
    side = t.w / 2 + 0.38;
  const seat = (dx, dz, rotation, i) => ({
    x: t.x + dx,
    z: t.z + dz,
    rotation,
    white: (t.id + i) % 2 === 0,
  });
  if (t.sofa)
    return [seat(-side, 0, -Math.PI / 2, 0), seat(side, 0, Math.PI / 2, 1)];
  if (t.chairs === 6)
    return [-0.76, 0, 0.76].flatMap((x, i) => [
      seat(x, front, 0, i),
      seat(x, -front, Math.PI, i + 3),
    ]);
  if (t.chairs === 4)
    return [
      seat(0, front, 0, 0),
      seat(0, -front, Math.PI, 1),
      seat(-side, 0, -Math.PI / 2, 2),
      seat(side, 0, Math.PI / 2, 3),
    ];
  return [seat(0, front, 0, 0), seat(0, -front, Math.PI, 1)];
}
export const COLLIDERS = [
  LANDMARKS.tree,
  LANDMARKS.bar,
  ...LANDMARKS.plants,
  { x: 3.8, z: 6.5, w: 3.8, d: 0.65 },
  // The photographed glazing has two open doorways; all other panes are solid.
  ...[
    [-6.25, -4.45],
    [-3.05, 0.55],
    [1.95, 6.25],
  ].map(([a, b]) => ({ x: (a + b) / 2, z: 8, w: b - a, d: 0.09 })),
  ...TABLES.flatMap((t) => [
    { x: t.x, z: t.z, w: t.w, d: t.d },
    ...chairLayout(t).map((c) => ({ x: c.x, z: c.z, w: 0.57, d: 0.57 })),
    ...(t.sofa ? [{ x: t.x, z: t.z + 1.15, w: 1.85, d: 0.75 }] : []),
  ]),
  // Stool footprints and the plant stands are also obstacles.
  ...[2.6, 3.85, 5.1].map((x) => ({ x, z: 3.65, w: 0.5, d: 0.5 })),
];
export const { isWalkable, findPath } = createNavigation(BOUNDS, COLLIDERS);
export const MAP_REGIONS = [
  { x: 0, z: 12, w: 12.5, d: 8, color: "#d2d0c7" },
  { ...LANDMARKS.bar, color: "#777c77" },
  { ...LANDMARKS.tree, color: "#536e49" },
];
