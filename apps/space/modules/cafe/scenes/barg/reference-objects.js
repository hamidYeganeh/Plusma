import * as THREE from "three";

// Geometry specific to the supplied Barg photographs; no UI, state or network.
const point = (x, y, z) => new THREE.Vector3(x, y, z);
function primitives() {
  const group = new THREE.Group();
  const mesh = (geometry, material, position = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    group.add(object);
    return object;
  };
  const box = (x, y, z, w, h, d, material) =>
    mesh(new THREE.BoxGeometry(w, h, d), material, [x, y, z]);
  const tube = (points, radius, material, segments = 20) =>
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => point(...p))),
        segments,
        radius,
        5,
        false,
      ),
      material,
    );
  return { group, mesh, box, tube };
}

export function createWireChair(frame, cushion, wire) {
  const { group, mesh, tube } = primitives();
  const vertices = [];
  const segment = (a, b) => vertices.push(...a, ...b);
  // Rounded, scooped wire back rather than wooden vertical slats.
  const back = (x, y) => [
    x,
    y,
    0.16 + (y - 0.49) * 0.2 - 0.025 * (1 - (x / 0.26) ** 2),
  ];
  for (let x = -0.24; x <= 0.241; x += 0.04) {
    const top = 0.57 + 0.49 * Math.sqrt(Math.max(0, 1 - (x / 0.255) ** 2));
    segment([x * 0.86, 0.47, 0.1], back(x, 0.62));
    segment(back(x, 0.62), back(x, top));
  }
  for (const y of [0.57, 0.66, 0.75, 0.84, 0.93, 1.01]) {
    const width = 0.255 * Math.sqrt(Math.max(0, 1 - ((y - 0.57) / 0.49) ** 2));
    for (let i = 0; i < 8; i++)
      segment(
        back(-width + (width * 2 * i) / 8, y),
        back(-width + (width * 2 * (i + 1)) / 8, y),
      );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  const grid = new THREE.LineSegments(geometry, wire);
  group.add(grid);
  const outline = [];
  for (let i = 0; i <= 16; i++) {
    const a = (Math.PI * i) / 16;
    outline.push([
      Math.cos(a) * 0.255,
      0.57 + Math.sin(a) * 0.49,
      0.16 + Math.sin(a) * 0.1,
    ]);
  }
  tube(outline, 0.007, frame, 24);
  const seat = mesh(
    new THREE.CylinderGeometry(0.235, 0.225, 0.044, 16),
    cushion,
    [0, 0.476, -0.012],
  );
  seat.scale.z = 0.9;
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      tube(
        [
          [x * 0.255, 0.025, z * 0.23],
          [x * 0.155, 0.44, z * 0.145],
        ],
        0.008,
        frame,
        1,
      );
    }
  tube(
    [
      [-0.23, 0.11, -0.22],
      [0.18, 0.33, 0.16],
    ],
    0.005,
    frame,
    1,
  );
  tube(
    [
      [0.23, 0.11, -0.22],
      [-0.18, 0.33, 0.16],
    ],
    0.005,
    frame,
    1,
  );
  return group;
}

export function createHollowLogs(bark, endGrain, inside) {
  const { group, mesh } = primitives();
  const logs = [
    [-0.28, 0.04, 0.12, 0.17, 0.63, -0.18],
    [0.18, 0.02, 0.12, 0.16, 0.72, 0.2],
    [-0.46, 0.15, -0.13, 0.13, 0.48, -0.32],
    [0.38, 0.18, -0.12, 0.14, 0.54, 0.27],
    [-0.15, 0.32, -0.13, 0.19, 0.58, 0.22],
    [0.13, 0.46, -0.22, 0.15, 0.58, -0.23],
    [0.42, 0.33, -0.34, 0.12, 0.44, 0.4],
    [-0.4, 0.38, -0.31, 0.12, 0.48, -0.4],
  ];
  for (const [x, y, z, r, length, tilt] of logs) {
    const log = new THREE.Group();
    log.position.set(x, y, z);
    log.rotation.set(Math.PI / 2 - 0.2, tilt, tilt * 0.4);
    group.add(log);
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.91, r, length, 12, 1, true),
      bark,
    );
    log.add(outer);
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.69, r * 0.76, length, 12, 1, true),
      inside,
    );
    log.add(inner);
    for (const sign of [-1, 1]) {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.84, r * 0.12, 4, 12),
        endGrain,
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = (sign * length) / 2;
      log.add(rim);
    }
  }
  mesh(
    new THREE.DodecahedronGeometry(0.36, 0),
    bark,
    [0, -0.12, -0.08],
  ).scale.set(1.6, 0.5, 1.25);
  return group;
}

export function createDecoratedTree(
  bark,
  soil,
  frame,
  ivory,
  turquoise,
  blue,
  wire,
) {
  const { group, mesh, tube } = primitives();
  mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.035, 24), frame, [0, 0.018, 0]);
  mesh(new THREE.CylinderGeometry(0.59, 0.59, 0.02, 24), soil, [0, 0.04, 0]);
  tube(
    [
      [0, 0.04, 0],
      [0.07, 0.8, 0.01],
      [-0.02, 1.6, 0],
      [0.16, 2.35, 0.06],
      [0.02, 3.45, 0.1],
    ],
    0.125,
    bark,
    18,
  );
  tube(
    [
      [0.02, 0.95, 0],
      [-0.23, 1.66, 0.04],
      [-0.64, 2.5, -0.06],
      [-1.2, 3.25, -0.18],
    ],
    0.064,
    bark,
    14,
  );
  tube(
    [
      [0.08, 1.6, 0],
      [0.44, 2.2, -0.02],
      [0.64, 2.85, -0.18],
      [0.9, 3.3, -0.32],
    ],
    0.055,
    bark,
    12,
  );
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25;
    tube(
      [
        [0, 0.19, 0],
        [Math.sin(a) * 0.26, 0.08, Math.cos(a) * 0.26],
        [Math.sin(a) * 0.47, 0.045, Math.cos(a) * 0.47],
      ],
      0.025,
      bark,
      6,
    );
  }
  for (const [y, material] of [
    [1.28, turquoise],
    [2.26, blue],
  ]) {
    const band = mesh(
      new THREE.CylinderGeometry(0.142, 0.146, 0.16, 12, 1, true),
      material,
      [y > 2 ? 0.14 : 0, y, 0.015],
    );
    band.rotation.z = -0.12;
  }
  const web = [];
  for (const [x, y, z, r] of [
    [-0.52, 1.84, 0.08, 0.16],
    [0.42, 2.13, -0.06, 0.12],
    [-0.25, 2.55, 0.14, 0.095],
  ]) {
    const hoop = mesh(new THREE.TorusGeometry(r, 0.006, 4, 24), ivory, [
      x,
      y,
      z,
    ]);
    hoop.rotation.y = 0.25;
    tube(
      [
        [x, 3.0, z],
        [x, y + r, z],
      ],
      0.003,
      turquoise,
      1,
    );
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6,
        b = a + (Math.PI * 5) / 6;
      web.push(
        x + Math.cos(a) * r,
        y + Math.sin(a) * r,
        z,
        x + Math.cos(b) * r * 0.72,
        y + Math.sin(b) * r * 0.72,
        z,
      );
    }
    for (const dx of [-r * 0.6, 0, r * 0.6]) {
      const bottom = y - r - 0.28 - Math.abs(dx) * 0.5;
      tube(
        [
          [x + dx, y - r * 0.7, z],
          [x + dx, bottom, z],
        ],
        0.0025,
        turquoise,
        1,
      );
      const feather = mesh(new THREE.SphereGeometry(1, 6, 4), ivory, [
        x + dx,
        bottom - 0.025,
        z,
      ]);
      feather.scale.set(0.018, 0.075, 0.007);
      mesh(new THREE.SphereGeometry(0.014, 6, 4), turquoise, [
        x + dx,
        bottom + 0.07,
        z,
      ]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(web, 3));
  group.add(new THREE.LineSegments(geometry, wire));
  return group;
}

export function createEntranceFacade(
  concrete,
  wood,
  metal,
  light,
  glass,
  kilim,
) {
  const { group, mesh, box, tube } = primitives();
  box(0, 0.08, 8.1, 12, 0.3, 2.2, concrete);
  box(0, 1.87, 9.15, 12, 3.45, 0.18, concrete);
  for (const x of [-3.1, 3.1]) {
    box(x, 1.7, 9.02, 4.5, 2.1, 0.05, glass);
    for (const xx of [x - 2.25, x, x + 2.25])
      box(xx, 1.7, 8.96, 0.065, 2.2, 0.06, metal);
    for (const y of [0.62, 2.78]) box(x, y, 8.96, 4.6, 0.065, 0.06, metal);
    const points = [];
    for (let i = 0; i <= 42; i++) {
      const t = i / 42;
      points.push([
        x - 1.65 + t * 3.3,
        2.38 + Math.sin(t * Math.PI * 8) * 0.1,
        8.87,
      ]);
    }
    tube(points, 0.012, light, 64);
    box(x, 0.7, 8.9, 3.9, 0.09, 0.25, wood);
  }
  box(0, 1.52, 8.98, 1.24, 2.8, 0.08, metal);
  box(0, 1.63, 8.92, 1.08, 2.48, 0.04, glass);
  box(0.43, 1.45, 8.86, 0.025, 0.28, 0.025, light);
  for (let x = -5.9; x < 6; x += 0.12)
    box(x, 3.18, 8.95, 0.045, 0.65, 0.06, wood);
  if (kilim) {
    for (const x of [-4.65, -3.35]) {
      const pouf = mesh(
        new THREE.CylinderGeometry(0.52, 0.49, 0.28, 20),
        kilim,
        [x, 0.37, 7.65],
      );
      pouf.scale.z = 0.86;
    }
  }
  for (const x of [-5.84, 5.84]) box(x, 1.83, 8, 0.12, 3.55, 0.12, metal);
  return group;
}
