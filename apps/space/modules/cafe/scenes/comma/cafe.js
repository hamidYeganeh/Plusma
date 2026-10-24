import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TABLES, LANDMARKS, chairLayout } from "./layout.js";

/** Photo study: official references and inference log live in output/research/comma-beheshti. */
export function buildComma(renderer, quality) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d9ddd8");
  scene.fog = new THREE.Fog("#d9ddd8", 45, 95);
  const world = new THREE.Group(),
    roof = new THREE.Group();
  world.name = "Comma Beheshti — photo reconstruction";
  roof.name = "ceiling";
  scene.userData = {
    reference: "https://commaconcept.ir/about/",
    accuracy:
      "Approximate photo reconstruction; inferred proportions, connections and table layout.",
  };
  scene.add(world, roof);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  let seed = 1799;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const mat = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      ...extra,
    });
    materials.add(m);
    return m;
  };
  function texture(size, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    draw(canvas.getContext("2d"), size);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.add(t);
    return t;
  }
  const concrete = texture(quality.textureSize, (ctx, size) => {
    ctx.fillStyle = "#c1c0b7";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 45; i++) {
      ctx.fillStyle = random() > 0.45 ? "#666b6210" : "#fffff514";
      ctx.fillRect(
        random() * size,
        random() * size,
        0.5 + random() * 3,
        0.5 + random() * 8,
      );
    }
    for (let i = 0; i < 55; i++) {
      ctx.strokeStyle = "#70776f0c";
      ctx.lineWidth = 0.5 + random();
      ctx.beginPath();
      const x = random() * size,
        y = random() * size;
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 95, y + random() * 14);
      ctx.stroke();
    }
  });
  concrete.repeat.set(3, 2);
  const checker = texture(256, (ctx, size) => {
    ctx.fillStyle = "#eaece6";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#171c1b";
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    ctx.strokeStyle = "#858a8155";
    ctx.lineWidth = 0.6;
    for (const n of [0, size / 2, size]) {
      ctx.beginPath();
      ctx.moveTo(n, 0);
      ctx.lineTo(n, size);
      ctx.moveTo(0, n);
      ctx.lineTo(size, n);
      ctx.stroke();
    }
  });
  checker.repeat.set(10, 19.2);
  const gravel = texture(quality.textureSize, (ctx, size) => {
    ctx.fillStyle = "#a5a69a";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 15000; i++) {
      const c = Math.floor(155 + random() * 85);
      ctx.fillStyle = `rgb(${c},${c},${Math.round(c * 0.95)})`;
      ctx.beginPath();
      ctx.ellipse(
        random() * size,
        random() * size,
        0.8 + random() * 2.5,
        0.7 + random() * 2,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  gravel.repeat.set(7, 5);
  const m = {
    concrete: mat("#d1d1c8", {
      map: concrete,
      bumpMap: concrete,
      bumpScale: 0.016,
    }),
    black: mat("#1c2321", { metalness: 0.6, roughness: 0.42 }),
    white: mat("#e6e8e2", { roughness: 0.49 }),
    stone: mat("#a7aca5", { map: concrete, roughness: 0.53 }),
    cushion: mat("#89928e", { roughness: 1 }),
    fabric: mat("#92877a", { roughness: 1 }),
    wood: mat("#9c7143", { roughness: 0.65 }),
    deck: mat("#81877a", { roughness: 0.91 }),
    soil: mat("#3d3c30"),
    leaf: mat("#3d703a", { side: THREE.DoubleSide, roughness: 0.73 }),
    leafLight: mat("#5f853d", { side: THREE.DoubleSide, roughness: 0.78 }),
    trunk: mat("#a49a7d", { roughness: 1 }),
    bulb: mat("#fff4d9", { emissive: "#fff1ce", emissiveIntensity: 2.4 }),
    glass: mat("#b7d5d4", {
      transparent: true,
      opacity: 0.095,
      depthWrite: false,
      roughness: 0.14,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
    bottle: mat("#606c4a", { metalness: 0.25, roughness: 0.2 }),
    silver: mat("#aab2ad", { metalness: 0.85, roughness: 0.3 }),
    gold: mat("#c8ba8b", { metalness: 0.6, roughness: 0.5 }),
  };
  const unitBox = new THREE.BoxGeometry(1, 1, 1),
    sphere = new THREE.SphereGeometry(1, 8, 6);
  geometries.add(unitBox);
  geometries.add(sphere);
  function mesh(geo, material, parent = world) {
    geometries.add(geo);
    materials.add(material);
    const o = new THREE.Mesh(geo, material);
    o.castShadow = !material.transparent;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(x, y, z, w, h, d, material, parent = world) {
    const o = mesh(unitBox, material, parent);
    o.position.set(x, y, z);
    o.scale.set(w, h, d);
    return o;
  }
  function rounded(x, y, z, w, h, d, material, radius = 0.035, parent = world) {
    const o = mesh(
      new RoundedBoxGeometry(w, h, d, 1, radius),
      material,
      parent,
    );
    o.position.set(x, y, z);
    return o;
  }
  function ball(x, y, z, sx, sy, sz, material, parent = world) {
    const o = mesh(sphere, material, parent);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    return o;
  }
  function rod(a, b, radius, material, parent = world) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      vector = end.clone().sub(start);
    const o = mesh(
      new THREE.CylinderGeometry(radius, radius, vector.length(), 6),
      material,
      parent,
    );
    o.position.copy(start.add(end).multiplyScalar(0.5));
    o.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      vector.normalize(),
    );
    return o;
  }
  function cylinder(x, y, z, rTop, rBottom, height, material, parent = world) {
    const o = mesh(
      new THREE.CylinderGeometry(rTop, rBottom, height, 16),
      material,
      parent,
    );
    o.position.set(x, y, z);
    return o;
  }
  // 300 m² ground floor and 100 m² courtyard. The 150 m² gallery surrounds an inferred atrium.
  const floor = box(
    0,
    -0.09,
    -4,
    12.5,
    0.18,
    24,
    mat("#ffffff", { map: checker, roughness: 0.24, metalness: 0.1 }),
  );
  box(
    0,
    -0.11,
    12,
    12.5,
    0.18,
    8,
    mat("#e1e0d4", { map: gravel, roughness: 1 }),
  );
  box(0, -0.26, 0, 13.05, 0.24, 32.5, m.concrete);
  box(0, -0.44, 0, 100, 0.1, 100, mat("#c2c8ba"));
  for (const x of [-6.28, 6.28]) {
    box(x, 3.4, -5, 0.2, 6.8, 22.2, m.concrete);
    box(x, 1.75, 7, 0.2, 3.5, 2, m.concrete);
    box(x, 1.9, 12, 0.2, 3.8, 8, m.concrete);
  }
  box(0, 1.9, 16.1, 12.7, 3.8, 0.2, m.concrete);
  // Street glazing and the large, unadorned exposed concrete ceiling.
  function glazing(z, y, height, parent = world, doors = false) {
    for (let i = 0; i <= 10; i++)
      box(
        -6.25 + i * 1.25,
        y + height / 2,
        z,
        0.045,
        height,
        0.07,
        m.black,
        parent,
      );
    for (const h of [0, height * 0.48, height])
      box(0, y + h, z, 12.5, 0.045, 0.07, m.black, parent);
    for (let i = 0; i < 10; i++) {
      const x = -5.625 + i * 1.25;
      if (doors && (i === 4 || i === 5)) continue;
      box(x, y + height / 2, z, 1.205, height, 0.018, m.glass, parent);
    }
  }
  glazing(-16.05, 0, 3.3, world, true);
  glazing(-16.05, 3.55, 3.15);
  box(0, 3.4, -16.05, 12.7, 0.3, 0.22, m.concrete);
  box(0, 6.85, -5, 12.7, 0.22, 22.2, m.concrete, roof);
  const upper = new THREE.Group();
  world.add(upper);
  const upperChecker = checker.clone();
  upperChecker.repeat.set(10, 3.6);
  textures.add(upperChecker);
  const upperMat = mat("#ffffff", { map: upperChecker, roughness: 0.33 });
  for (const [z, depth] of [
    [-12.5, 7],
    [4.75, 2.5],
  ]) {
    box(0, 3.45, z, 12.5, 0.22, depth, m.concrete, upper);
    box(0, 3.565, z, 12.5, 0.01, depth, upperMat, upper);
  }
  for (const x of [-5.625, 5.625])
    box(x, 3.45, -2.75, 1.25, 0.22, 12.5, m.concrete, upper);
  function railing(a, b) {
    rod([a[0], 4.5, a[1]], [b[0], 4.5, b[1]], 0.026, m.black, upper);
    const length = Math.hypot(a[0] - b[0], a[1] - b[1]),
      steps = Math.ceil(length / 0.65);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        x = a[0] + (b[0] - a[0]) * t,
        z = a[1] + (b[1] - a[1]) * t;
      rod([x, 3.55, z], [x, 4.5, z], 0.018, m.black, upper);
    }
  }
  railing([-5, -9], [5, -9]);
  railing([-5, 3.5], [5, 3.5]);
  railing([-5, -9], [-5, 3.5]);
  railing([5, -9], [5, 3.5]);
  // Rear greenhouse: black steel mullions, inclined glass and industrial cage pendants.
  const glasshouseRoof = new THREE.Group();
  world.add(glasshouseRoof);
  for (let i = 0; i <= 10; i++) {
    const x = -6.25 + i * 1.25;
    rod([x, 2.8, 8], [x, 3.55, 6], 0.025, m.black, glasshouseRoof);
    const isDoorEdge = [2, 3, 6, 7].includes(i);
    box(x, 1.4, 8, 0.045, 2.8, 0.06, m.black);
    if (!isDoorEdge) box(x, 0.04, 8, 0.05, 0.06, 0.06, m.black);
  }
  box(0, 2.8, 8, 12.5, 0.06, 0.06, m.black);
  box(0, 3.55, 6, 12.5, 0.06, 0.06, m.black, glasshouseRoof);
  for (const [a, b] of [
    [-6.25, -4.45],
    [-3.05, 0.55],
    [1.95, 6.25],
  ]) {
    box((a + b) / 2, 1.4, 8, b - a, 2.8, 0.016, m.glass);
    box((a + b) / 2, 0.65, 8, b - a, 0.04, 0.05, m.black);
  }
  const slope = mesh(
    new THREE.PlaneGeometry(12.5, Math.hypot(2, 0.75)),
    m.glass,
    glasshouseRoof,
  );
  slope.rotation.x = -Math.PI / 2 + Math.atan2(0.75, 2);
  slope.position.set(0, 3.175, 7);
  glazing(6, 3.65, 3.05);
  box(0, 3.55, 6, 12.5, 0.22, 0.25, m.concrete);
  function leafGeometry() {
    const positions = [],
      uvs = [],
      indices = [],
      rows = 10,
      cols = 4;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows,
        half = Math.pow(Math.sin(t * Math.PI), 0.8) * 0.36;
      for (let j = 0; j <= cols; j++) {
        const side = (j / cols) * 2 - 1;
        positions.push(
          half * side,
          t * 0.93,
          Math.sin(t * Math.PI * 0.85) * 0.2 + side * side * half * 0.25,
        );
        uvs.push(j / cols, t);
        if (i < rows && j < cols) {
          const a = i * (cols + 1) + j;
          indices.push(
            a,
            a + 1,
            a + cols + 1,
            a + 1,
            a + cols + 2,
            a + cols + 1,
          );
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  const leafGeo = leafGeometry();
  geometries.add(leafGeo);
  function plant(
    x,
    z,
    size = 1,
    y = 0,
    potMaterial = m.white,
    fern = false,
    parent = world,
  ) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    cylinder(
      0,
      size * 0.23,
      0,
      size * 0.29,
      size * 0.22,
      size * 0.46,
      potMaterial,
      group,
    );
    cylinder(
      0,
      size * 0.465,
      0,
      size * 0.258,
      size * 0.258,
      size * 0.018,
      m.soil,
      group,
    );
    const count = fern ? 25 : 9;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399,
        reach = size * (0.2 + random() * 0.38),
        height = size * (fern ? 0.65 + random() * 0.38 : 0.9 + random() * 0.65);
      const dx = Math.sin(angle) * reach,
        dz = Math.cos(angle) * reach;
      rod(
        [0, size * 0.44, 0],
        [dx, height, dz],
        size * 0.009,
        m.leafLight,
        group,
      );
      const leaf = mesh(leafGeo, i % 3 ? m.leaf : m.leafLight, group);
      leaf.position.set(dx, height - size * 0.06, dz);
      leaf.rotation.set(
        fern ? 1.45 : 0.65 + random() * 0.45,
        angle,
        (random() - 0.5) * 0.25,
      );
      leaf.scale.setScalar(size * (fern ? 0.4 : 0.64 + random() * 0.25));
    }
    return group;
  }
  for (const p of LANDMARKS.plants)
    plant(
      p.x,
      p.z,
      p.size,
      0,
      p.z > 8 ? m.cushion : m.white,
      p.z > 6 && p.z < 8,
    );
  for (const x of [-4.7, -2.2, 0.3, 2.8, 5.3]) {
    box(x, 4.1, 6.33, 1.15, 0.48, 0.42, m.black);
    for (let i = 0; i < 5; i++)
      box(x, 3.92 + i * 0.09, 6.56, 1.2, 0.038, 0.035, m.silver);
    plant(x, 6.35, 0.44, 4.22, m.black, true);
  }
  // Low timber pads and the small stepping squares float above loose white gravel.
  function deck(x, z, w, d) {
    const n = Math.round(w / 0.12);
    for (let i = 0; i < n; i++)
      box(
        x - w / 2 + ((i + 0.5) * w) / n,
        0.035,
        z,
        w / n - 0.012,
        0.055,
        d,
        m.deck,
      );
  }
  for (const t of TABLES.filter((t) => t.z > 8))
    deck(t.x, t.z + (t.sofa ? 0.45 : 0), 2.7, t.sofa ? 3 : 2.25);
  deck(1.15, 12.35, 2.2, 2.1);
  for (const [x, z] of [
    [0, 14.8],
    [-0.6, 13.5],
    [-0.5, 12.15],
    [0, 10.8],
    [0.75, 9.35],
    [-2.1, 11.6],
  ])
    deck(x, z, 0.62, 0.62);
  const pebbleCount = Math.round(
    (quality.textureSize <= 512 ? 3500 : 8000) / quality.foliageStep,
  );
  const pebbleGeo = new THREE.IcosahedronGeometry(1, 0);
  geometries.add(pebbleGeo);
  const pebbleMat = mat("#dedfd5", { roughness: 1, vertexColors: false });
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount),
    dummy = new THREE.Object3D();
  for (let i = 0; i < pebbleCount; i++) {
    dummy.position.set((random() - 0.5) * 12.4, 0.004, 8 + random() * 8);
    dummy.rotation.set(random() * 3, random() * 3, random() * 3);
    dummy.scale.set(
      0.014 + random() * 0.023,
      0.012 + random() * 0.016,
      0.018 + random() * 0.024,
    );
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
    pebbles.setColorAt(
      i,
      new THREE.Color().setHSL(0.13, 0.04, 0.57 + random() * 0.3),
    );
  }
  pebbles.receiveShadow = true;
  world.add(pebbles);
  // The courtyard's large ribbed black planter and multi-stem tree are distinctive in the references.
  const tree = new THREE.Group();
  tree.position.set(LANDMARKS.tree.x, 0, LANDMARKS.tree.z);
  world.add(tree);
  box(0, 0.4, 0, 1.18, 0.8, 1.18, m.black, tree);
  box(0, 0.8, 0, 1.32, 0.1, 1.32, m.black, tree);
  for (let i = 0; i < 14; i++) {
    const a = (i / 13 - 0.5) * 1.12;
    for (const side of [-1, 1]) {
      box(a, 0.4, side * 0.602, 0.035, 0.73, 0.025, m.black, tree);
      box(side * 0.602, 0.4, a, 0.025, 0.73, 0.035, m.black, tree);
    }
  }
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4,
      x = Math.sin(a) * (0.6 + random()),
      z = Math.cos(a) * (0.6 + random()),
      y = 3.6 + random() * 1.8;
    rod(
      [Math.sin(a) * 0.15, 0.8, Math.cos(a) * 0.15],
      [x * 0.6, y * 0.65, z * 0.6],
      0.045,
      m.trunk,
      tree,
    );
    rod([x * 0.6, y * 0.65, z * 0.6], [x, y, z], 0.023, m.trunk, tree);
    const n = Math.round(
      (quality.textureSize <= 512 ? 50 : 100) / quality.foliageStep,
    );
    for (let j = 0; j < n; j++)
      ball(
        x + (random() - 0.5) * 1.3,
        y + (random() - 0.5) * 1.3,
        z + (random() - 0.5) * 1.3,
        0.07,
        0.1,
        0.035,
        j % 3 ? m.leaf : m.leafLight,
        tree,
      );
  }
  // Two observed chair families: black/white spindle chairs and canvas chairs with timber arms.
  function chair(x, z, rotation, white, style, y = 0, parent = world) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotation;
    parent.add(g);
    const frame = white ? m.white : m.black;
    if (style === "windsor") {
      rounded(0, 0.46, 0, 0.43, 0.055, 0.43, frame, 0.04, g);
      rounded(0, 0.5, 0.005, 0.39, 0.045, 0.37, m.cushion, 0.025, g);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          rod(
            [sx * 0.25, 0.03, sz * 0.26],
            [sx * 0.17, 0.46, sz * 0.15],
            0.023,
            frame,
            g,
          );
      for (const sx of [-1, 1])
        rod([sx * 0.18, 0.45, 0.19], [sx * 0.22, 0.98, 0.25], 0.021, frame, g);
      for (let i = -2; i <= 2; i++)
        rod([i * 0.065, 0.49, 0.18], [i * 0.075, 0.91, 0.24], 0.011, frame, g);
      rounded(0, 0.94, 0.25, 0.49, 0.12, 0.055, frame, 0.025, g);
    } else {
      rounded(0, 0.46, 0, 0.45, 0.055, 0.43, m.fabric, 0.02, g);
      const back = rounded(
        0,
        0.76,
        0.23,
        0.43,
        0.46,
        0.045,
        m.fabric,
        0.018,
        g,
      );
      back.rotation.x = -0.1;
      for (const sx of [-1, 1]) {
        rod([sx * 0.27, 0, -0.25], [sx * 0.2, 0.51, -0.16], 0.012, m.black, g);
        rod([sx * 0.27, 0, 0.28], [sx * 0.2, 0.99, 0.24], 0.012, m.black, g);
        rod(
          [sx * 0.27, 0.03, -0.25],
          [-sx * 0.2, 0.45, 0.2],
          0.008,
          m.black,
          g,
        );
        rod(
          [sx * 0.2, 0.51, -0.16],
          [sx * 0.2, 0.68, -0.16],
          0.012,
          m.black,
          g,
        );
        rod(
          [sx * 0.24, 0.68, -0.27],
          [sx * 0.24, 0.68, 0.32],
          0.025,
          m.wood,
          g,
        );
      }
      rod([-0.26, 1, 0.25], [0.26, 1, 0.25], 0.025, m.wood, g);
      for (const x of [-0.13, 0.13])
        box(x, 0.77, 0.26, 0.035, 0.44, 0.02, m.black, g);
    }
  }
  function sofa(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    world.add(g);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1])
        rod(
          [sx * 0.87, 0, sz * 0.32],
          [sx * 0.87, 0.5, sz * 0.32],
          0.02,
          m.black,
          g,
        );
      rod([sx * 0.91, 0.64, -0.33], [sx * 0.91, 0.64, 0.4], 0.025, m.black, g);
    }
    box(0, 0.4, 0, 1.8, 0.06, 0.75, m.black, g);
    for (const x of [-0.44, 0.44]) {
      rounded(x, 0.49, -0.02, 0.86, 0.17, 0.71, m.cushion, 0.07, g);
      const back = rounded(x, 0.81, 0.32, 0.86, 0.61, 0.16, m.cushion, 0.06, g);
      back.rotation.x = -0.1;
      for (const dx of [-0.2, 0.2])
        ball(x + dx, 0.58, -0.01, 0.014, 0.008, 0.014, m.white, g);
    }
  }
  const tableHits = [],
    highlights = new Map();
  const highlightMat = new THREE.MeshBasicMaterial({
    color: "#7757ff",
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  materials.add(highlightMat);
  function table(t, y = 0, interactive = true, parent = world) {
    const top = box(t.x, y + 0.76, t.z, t.w, 0.055, t.d, m.stone, parent);
    if (interactive) {
      top.userData.tableId = t.id;
      tableHits.push(top);
      const shape = new THREE.Shape();
      shape.moveTo(-t.w / 2 - 0.04, -t.d / 2 - 0.04);
      shape.lineTo(t.w / 2 + 0.04, -t.d / 2 - 0.04);
      shape.lineTo(t.w / 2 + 0.04, t.d / 2 + 0.04);
      shape.lineTo(-t.w / 2 - 0.04, t.d / 2 + 0.04);
      shape.closePath();
      const marker = mesh(new THREE.ShapeGeometry(shape), highlightMat, parent);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(t.x, y + 0.795, t.z);
      marker.visible = false;
      marker.userData.noBatch = true;
      highlights.set(t.id, marker);
    }
    if (t.w > 2) {
      for (const dx of [-t.w * 0.36, t.w * 0.36]) {
        rod(
          [t.x + dx, y + 0.7, t.z - 0.32],
          [t.x + dx, y + 0.03, t.z + 0.38],
          0.04,
          m.black,
          parent,
        );
        rod(
          [t.x + dx, y + 0.7, t.z + 0.32],
          [t.x + dx, y + 0.03, t.z - 0.38],
          0.04,
          m.black,
          parent,
        );
      }
    } else {
      cylinder(t.x, y + 0.37, t.z, 0.045, 0.065, 0.7, m.black, parent);
      box(t.x, y + 0.04, t.z, t.w * 0.7, 0.045, 0.065, m.black, parent);
      box(t.x, y + 0.04, t.z, 0.065, 0.045, t.d * 0.8, m.black, parent);
    }
    cylinder(
      t.x + t.w * 0.2,
      y + 0.8,
      t.z + 0.1,
      0.05,
      0.06,
      0.025,
      m.black,
      parent,
    );
    cylinder(t.x - 0.16, y + 0.83, t.z, 0.034, 0.032, 0.08, m.white, parent);
    for (const c of chairLayout(t))
      chair(c.x, c.z, c.rotation, c.white, t.style, y, parent);
    if (t.sofa) sofa(t.x, t.z + 1.15);
  }
  TABLES.forEach((t) => table(t));
  // Furniture on the mezzanine is visible in overview; its unverified circulation is not offered as a walk route.
  table(
    { id: 90, x: -1.8, z: -13.5, w: 3.3, d: 0.95, chairs: 6, style: "windsor" },
    3.57,
    false,
    upper,
  );
  table(
    { id: 91, x: 1.4, z: 5, w: 3.2, d: 0.95, chairs: 6, style: "sling" },
    3.57,
    false,
    upper,
  );
  plant(-5.2, -14.4, 1.1, 3.57, m.white, false, upper);
  plant(5.2, 5, 1.1, 3.57, m.white, false, upper);
  // Concrete bar, floating black shelves, espresso machine, bottles and three timber-topped wire stools.
  const b = LANDMARKS.bar;
  box(b.x, 0.53, b.z, b.w, 1.06, b.d, m.concrete);
  box(b.x, 1.09, b.z, b.w + 0.12, 0.07, b.d + 0.13, m.stone);
  for (const x of [2.6, 3.85, 5.1]) {
    rounded(x, 0.77, 3.65, 0.48, 0.065, 0.36, m.wood, 0.035);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        rod(
          [x + sx * 0.23, 0.02, 3.65 + sz * 0.23],
          [x + sx * 0.14, 0.74, 3.65 + sz * 0.12],
          0.009,
          m.black,
        );
    rod([x - 0.22, 0.2, 3.45], [x + 0.22, 0.2, 3.85], 0.009, m.black);
    rod([x + 0.22, 0.2, 3.45], [x - 0.22, 0.2, 3.85], 0.009, m.black);
  }
  box(3.8, 0.5, 6.5, 3.8, 1, 0.65, m.black);
  for (const x of [2.5, 5.25])
    cylinder(x, 1.9, 6.5, 0.055, 0.055, 3.5, m.black);
  for (const y of [1.16, 1.9, 2.6]) box(3.9, y, 6.5, 3.9, 0.045, 0.6, m.black);
  for (let i = 0; i < 17; i++) {
    const x = 2.2 + i * 0.2;
    cylinder(x, 1.36, 6.38, 0.047, 0.047, 0.35, i % 3 ? m.bottle : m.silver);
    cylinder(x, 1.58, 6.38, 0.018, 0.018, 0.1, m.gold);
    cylinder(x, 2.03, 6.45, 0.055, 0.04, 0.2, i % 2 ? m.white : m.black);
    cylinder(x, 2.72, 6.45, 0.04, 0.04, 0.19, m.silver);
  }
  rounded(2.55, 1.36, 4.65, 0.85, 0.48, 0.48, m.silver);
  box(2.55, 1.14, 4.33, 0.85, 0.04, 0.15, m.black);
  for (const x of [2.3, 2.55, 2.8])
    rod([x, 1.32, 4.38], [x, 1.32, 4.15], 0.014, m.black);
  const fills = [];
  function pendant(x, z, y, kind = "disc", parent = world) {
    rod([x, 6.7, z], [x, y + 0.1, z], 0.008, m.black, parent);
    if (kind === "square") {
      for (const a of [-1, 1]) {
        box(x + a * 0.38, y, z, 0.1, 0.055, 0.85, m.bulb, parent);
        box(x, y, z + a * 0.38, 0.85, 0.055, 0.1, m.bulb, parent);
      }
    } else {
      cylinder(x, y, z, 0.44, 0.46, 0.1, m.black, parent);
      cylinder(x, y - 0.055, z, 0.405, 0.405, 0.018, m.bulb, parent);
    }
  }
  for (const z of [-8, -4, 0])
    for (const x of [-2.6, 2.6]) pendant(x, z, 5.9, "square", roof);
  for (const z of [-13.8, 5])
    for (const x of [-2.8, -0.8, 1.2])
      pendant(x, z, z > 0 ? 6.1 : 5.8, "disc", roof);
  for (const x of [-5, -2.5, 0, 2.5, 5]) {
    rod([x, 3.2, 7], [x, 2.62, 7], 0.007, m.black, glasshouseRoof);
    cylinder(x, 2.5, 7, 0.08, 0.08, 0.2, m.bulb, glasshouseRoof);
    cylinder(x, 2.64, 7, 0.1, 0.1, 0.04, m.silver, glasshouseRoof);
    for (const dx of [-0.08, 0.08])
      rod(
        [x + dx, 2.37, 7],
        [x + dx, 2.64, 7],
        0.007,
        m.silver,
        glasshouseRoof,
      );
  }
  // A small self-drawn sign refers to the observed facade, without embedding third-party photographs.
  const signMap = texture(512, (ctx, size) => {
    ctx.fillStyle = "#1b2222";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#d2c399";
    ctx.textAlign = "center";
    ctx.font = "300 62px sans-serif";
    ctx.fillText("c o m m a", size / 2, 255);
    ctx.font = "22px sans-serif";
    ctx.fillText("C A F E   ·   B E H E S H T I", size / 2, 305);
  });
  const signMaterial = mat("#ffffff", { map: signMap, roughness: 0.85 });
  const sign = mesh(new THREE.PlaneGeometry(3.4, 1.7), signMaterial);
  sign.rotation.y = Math.PI;
  sign.position.set(0, 3.25, -16.2);
  const hemi = new THREE.HemisphereLight("#f1f5ef", "#7c8273", 2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff3d9", 3.2);
  sun.position.set(-9, 17, 19);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.far = 65;
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  for (const z of [-12, -4, 4, 11]) {
    const light = new THREE.PointLight("#ffe8bf", 22, 15, 1.3);
    light.position.set(0, z === 11 ? 3 : 3.05, z);
    scene.add(light);
    fills.push(light);
  }
  const pmrem = new THREE.PMREMGenerator(renderer),
    environment = new RoomEnvironment();
  const env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.55;
  environment.dispose();
  pmrem.dispose();
  // Batch static opaque geometry by material. Pickable tops and selection overlays keep their identities.
  function batch(group) {
    scene.updateMatrixWorld(true);
    const bins = new Map(),
      remove = [];
    group.traverse((o) => {
      if (
        !o.isMesh ||
        o.isInstancedMesh ||
        o.material.transparent ||
        o.userData.noBatch ||
        o.userData.tableId ||
        o === floor
      )
        return;
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld),
        flat = g.index ? g.toNonIndexed() : g;
      if (flat !== g) g.dispose();
      for (const attr of Object.keys(flat.attributes))
        if (!["position", "normal", "uv"].includes(attr))
          flat.deleteAttribute(attr);
      if (!flat.attributes.uv)
        flat.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            new Float32Array(flat.attributes.position.count * 2),
            2,
          ),
        );
      if (!bins.has(o.material.uuid))
        bins.set(o.material.uuid, { material: o.material, geos: [] });
      bins.get(o.material.uuid).geos.push(flat);
      remove.push(o);
    });
    for (const { material, geos } of bins.values()) {
      const geo = mergeGeometries(geos, false);
      if (geo) {
        const o = mesh(geo, material, group);
        o.castShadow = true;
      }
      geos.forEach((g) => g.dispose());
    }
    remove.forEach((o) => o.removeFromParent());
  }
  // Keep the roof separate so the whole two-storey interior can be inspected from above.
  batch(world);
  batch(roof);
  // Runtime uses this visibility flag as its optional reflection budget; Comma has no reflection pass.
  const reflector = { visible: false };
  let targetNight = 0,
    night = 0;
  return {
    scene,
    world,
    roof,
    floor,
    reflector,
    tableHits,
    setSelectedTable(id) {
      for (const [key, marker] of highlights) marker.visible = key === id;
    },
    setOverview(value) {
      roof.visible = !value;
      glasshouseRoof.visible = !value;
    },
    setNight(value) {
      targetNight = value ? 1 : 0;
    },
    update(_time, dt) {
      night = THREE.MathUtils.damp(night, targetNight, 3, dt);
      hemi.intensity = THREE.MathUtils.lerp(2, 0.2, night);
      sun.intensity = THREE.MathUtils.lerp(3.2, 0.05, night);
      scene.background.set("#d9ddd8").lerp(new THREE.Color("#17262d"), night);
      scene.fog.color.copy(scene.background);
      fills.forEach((light) => {
        light.intensity = THREE.MathUtils.lerp(22, 48, night);
      });
      m.bulb.emissiveIntensity = THREE.MathUtils.lerp(2.4, 4, night);
      scene.environmentIntensity = THREE.MathUtils.lerp(0.55, 0.18, night);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(1, 0.92, night);
    },
    dispose() {
      scene.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
        if (o.geometry) geometries.add(o.geometry);
        if (o.shadow) o.shadow.dispose();
      });
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      env.dispose();
      scene.clear();
    },
  };
}
