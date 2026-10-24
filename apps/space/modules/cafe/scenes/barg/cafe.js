import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { POND, TABLES, LANDMARKS, chairLayout } from "./layout.js";
import { makeTextures, seeded } from "./textures.js";
import {
  createWireChair,
  createHollowLogs,
  createDecoratedTree,
  createEntranceFacade,
} from "./reference-objects.js";

export function buildCafe(renderer, quality) {
  const createdGeometries = new Set(),
    createdMaterials = new Set();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d9e0cd");
  scene.fog = new THREE.Fog("#d9e0cd", 24, 65);
  const world = new THREE.Group(),
    roof = new THREE.Group();
  scene.add(world, roof);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.35;
  environment.dispose();
  pmrem.dispose();
  const t = makeTextures(quality.textureSize),
    r = seeded(128),
    m = {};
  const mat = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
  m.black = mat("#252b27", { metalness: 0.55, roughness: 0.55 });
  m.wood = mat("#d7aa78", {
    map: t.wood,
    roughness: 0.69,
    bumpMap: t.wood,
    bumpScale: 0.009,
  });
  m.stone = mat("#969e98", {
    map: t.stone,
    roughness: 0.68,
    bumpMap: t.stone,
    bumpScale: 0.016,
  });
  m.concrete = mat("#9d9e90", { roughness: 0.95 });
  m.soil = mat("#313327");
  m.linen = mat("#e8ddc2", {
    bumpMap: t.fabric,
    bumpScale: 0.008,
    roughness: 1,
  });
  m.bark = mat("#c5b291", { map: t.bark, bumpMap: t.bark, bumpScale: 0.025 });
  m.charcoal = mat("#272827", { roughness: 0.94 });
  m.log = mat("#786349", { map: t.bark, bumpMap: t.bark, bumpScale: 0.035 });
  m.logEnd = mat("#c4a776", { roughness: 0.98 });
  m.logInside = mat("#181812", { side: THREE.BackSide });
  m.terracotta = mat("#bc7652", { roughness: 0.95 });
  m.turquoise = mat("#3b9b9f", { roughness: 1 });
  m.blue = mat("#304d79", { roughness: 1 });
  m.kilim = mat("#ffffff", { map: t.kilim, roughness: 1 });
  m.facadeGlass = mat("#2e302a", { metalness: 0.3, roughness: 0.24 });
  const wire = new THREE.LineBasicMaterial({ color: "#252725" });
  const thread = new THREE.LineBasicMaterial({ color: "#ccbfa0" });
  m.ceramic = mat("#d8cfaf", { roughness: 0.66 });
  m.coffee = mat("#372619", { roughness: 0.25 });
  m.pebble = mat("#e4dfca");
  m.bulb = mat("#fff5cd", { emissive: "#ffb44a", emissiveIntensity: 2 });
  m.led = mat("#f9da8e", { emissive: "#ffb94c", emissiveIntensity: 1.5 });
  const unitBox = new THREE.BoxGeometry(1, 1, 1),
    sphere = new THREE.SphereGeometry(1, 10, 8);
  function mesh(geo, material, parent = world) {
    createdGeometries.add(geo);
    createdMaterials.add(material);
    const o = new THREE.Mesh(geo, material);
    o.castShadow = true;
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
  function rounded(x, y, z, w, h, d, radius, material, parent = world) {
    const o = mesh(
      new RoundedBoxGeometry(w, h, d, 2, radius),
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
  function line(points, radius, material, parent = world) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        Math.max(6, points.length * 3),
        radius,
        7,
        false,
      ),
      material,
      parent,
    );
  }
  function addReferenceObject(object, parent = world) {
    object.traverse((node) => {
      if (node.geometry) createdGeometries.add(node.geometry);
      if (node.material) createdMaterials.add(node.material);
    });
    parent.add(object);
    return object;
  }
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: t.shadow,
    transparent: true,
    depthWrite: false,
    color: "#33392e",
    opacity: 0.7,
  });
  function contact(x, z, w, d, opacity = 0.6) {
    const sm = shadowMaterial.clone();
    sm.opacity = opacity;
    const o = mesh(new THREE.PlaneGeometry(w, d), sm);
    o.rotation.x = -Math.PI / 2;
    o.position.set(x, 0.012, z);
    o.castShadow = false;
    o.receiveShadow = false;
  }
  const floorMap = t.floor.clone();
  floorMap.repeat.set(4.3, 5);
  floorMap.needsUpdate = true;
  const floorMat = mat("#c8c9bd", {
    map: floorMap,
    bumpMap: floorMap,
    bumpScale: 0.012,
    roughness: 0.88,
  });
  const floor = mesh(new THREE.PlaneGeometry(12, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  floor.userData.floor = true;
  box(0, -0.12, 0, 12.3, 0.2, 14.3, m.concrete);
  const outside = mat("#b8c0a5");
  box(0, -0.24, 0, 90, 0.12, 90, outside);
  function wallTexture(length) {
    const bt = t.brick.clone();
    bt.repeat.set(length / 3.1, 1);
    bt.needsUpdate = true;
    return mat("#ffffff", {
      map: bt,
      bumpMap: bt,
      bumpScale: 0.035,
      roughness: 1,
    });
  }
  box(0, 0.62, -7, 12, 1.24, 0.2, wallTexture(12));
  const leftWall = box(-6, 0.62, 0, 0.2, 1.24, 14, wallTexture(14));
  leftWall.rotation.y = 0;
  box(6, 0.62, 0, 0.2, 1.24, 14, wallTexture(14));
  box(0, 1.28, -7, 12, 0.09, 0.27, m.concrete);
  box(-6, 1.28, 0, 0.27, 0.09, 14, m.concrete);
  box(6, 1.28, 0, 0.27, 0.09, 14, m.concrete);
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#dce4d3",
    transparent: true,
    opacity: 0.3,
    roughness: 0.28,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  box(0, 2.4, -7, 12, 2.2, 0.035, glass);
  box(-6, 2.4, 0, 0.035, 2.2, 14, glass);
  box(6, 2.4, 0, 0.035, 2.2, 14, glass);
  for (let x = -6; x <= 6; x += 2) {
    box(x, 2.4, -6.98, 0.045, 2.25, 0.06, m.black);
  }
  for (let z = -7; z <= 7; z += 2) {
    box(-5.99, 2.4, z, 0.06, 2.25, 0.045, m.black);
    box(5.99, 2.4, z, 0.06, 2.25, 0.045, m.black);
  }
  for (const x of [-5.72, 5.72])
    for (const z of [-6.75, 0, 6.75]) {
      box(x, 1.79, z, 0.12, 3.58, 0.12, m.black);
      box(x, 0.05, z, 0.24, 0.08, 0.24, m.black);
    }
  for (const x of [-5.8, 0, 5.8])
    box(x, 3.49, 0, 0.18, 0.25, 14.1, m.black, roof);
  for (let z = -7; z <= 7; z += 0.48)
    box(0, 3.52, z, 12, 0.075, 0.045, m.black, roof);
  const roofMat = new THREE.MeshPhysicalMaterial({
    color: "#d7b475",
    roughness: 0.78,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  for (let z = -6.65; z < 7; z += 0.95) {
    const panel = box(0, 3.6, z, 12, 0.035, 0.92, roofMat, roof);
    panel.castShadow = false;
  }
  box(0, 3.4, -7, 12, 0.16, 0.13, m.black, roof);
  box(0, 3.4, 7, 12, 0.16, 0.13, m.black, roof);
  // The front low planter and its opening follow the presentation sheet.
  for (const p of [
    { x: -2.1, z: 6.42, w: 7.8, d: 0.45 },
    { x: 5.6, z: 6.42, w: 0.8, d: 0.45 },
    { x: -5.78, z: 4.8, w: 0.35, d: 3.6 },
  ]) {
    box(p.x, 0.2, p.z, p.w, 0.4, p.d, m.concrete);
    box(p.x, 0.41, p.z, p.w - 0.1, 0.025, p.d - 0.1, m.soil);
  }
  // A timber ventilated cover for the existing AC unit.
  box(-5.78, 1.95, 3.05, 0.29, 1.02, 1.5, m.black);
  for (let y = 1.48; y < 2.44; y += 0.065)
    box(-5.56, y, 3.05, 0.05, 0.027, 1.55, m.wood);
  for (const z of [2.28, 3.82]) box(-5.56, 1.95, z, 0.07, 1.04, 0.055, m.wood);
  // The perimeter is a concrete planting ledge, not upholstered banquettes.
  box(0, 0.23, -6.43, 10.7, 0.46, 0.58, m.concrete);
  box(5.66, 0.23, -1.4, 0.58, 0.46, 8.4, m.concrete);
  const wireChair = createWireChair(m.black, m.charcoal, wire);
  function chair(x, z, rot = 0) {
    const object = wireChair.clone(true);
    object.position.set(x, 0, z);
    object.rotation.y = rot;
    addReferenceObject(object);
    contact(x, z, 0.76, 0.76, 0.34);
  }
  function cup(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    world.add(g);
    const a = mesh(
      new THREE.CylinderGeometry(0.049, 0.042, 0.095, 12),
      m.ceramic,
      g,
    );
    a.position.y = 0.88;
    const c = mesh(
      new THREE.CylinderGeometry(0.039, 0.039, 0.003, 12),
      m.coffee,
      g,
    );
    c.position.y = 0.929;
    const handle = mesh(
      new THREE.TorusGeometry(0.029, 0.008, 6, 12),
      m.ceramic,
      g,
    );
    handle.position.set(0.05, 0.885, 0);
  }
  const tableHits = [],
    tableHighlights = new Map();
  const selectionMaterial = new THREE.MeshStandardMaterial({
    color: "#dfe6b4",
    emissive: "#b7cc71",
    emissiveIntensity: 0.5,
    roughness: 0.6,
  });
  function table(p) {
    rounded(p.x, 0.79, p.z, p.w, 0.07, p.d, 0.025, m.wood);
    for (const dx of [-p.w / 2 + 0.1, p.w / 2 - 0.1])
      for (const dz of [-p.d / 2 + 0.1, p.d / 2 - 0.1])
        box(p.x + dx, 0.39, p.z + dz, 0.045, 0.77, 0.045, m.black);
    box(p.x, 0.65, p.z, p.w - 0.13, 0.045, 0.04, m.black);
    contact(p.x, p.z, p.w + 0.6, p.d + 0.65, 0.48);
    chairLayout(p).forEach((c) => chair(c.x, c.z, c.rotation));
    const pick = box(
      p.x,
      0.8,
      p.z,
      p.w + 0.04,
      0.12,
      p.d + 0.04,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
    );
    pick.userData.tableId = p.id;
    pick.castShadow = false;
    pick.receiveShadow = false;
    tableHits.push(pick);
    const outline = new THREE.Group();
    scene.add(outline);
    outline.visible = false;
    for (const z of [p.z - p.d / 2 - 0.025, p.z + p.d / 2 + 0.025])
      box(p.x, 0.835, z, p.w + 0.05, 0.018, 0.018, selectionMaterial, outline);
    for (const x of [p.x - p.w / 2 - 0.025, p.x + p.w / 2 + 0.025])
      box(x, 0.835, p.z, 0.018, 0.018, p.d + 0.05, selectionMaterial, outline);
    tableHighlights.set(p.id, outline);
    const numberStand = box(
      p.x + 0.19,
      0.85,
      p.z - 0.1,
      0.12,
      0.07,
      0.025,
      m.black,
    );
    numberStand.rotation.y = -0.08;
    const ashtray = mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.018, 10),
      m.charcoal,
    );
    ashtray.position.set(p.x + 0.32, 0.835, p.z - 0.04);
    if (p.id === 1 || p.id === 5) cup(p.x - 0.2, p.z + 0.08);
  }
  TABLES.forEach(table);
  // Black stone water feature, raised in the same central position as the images.
  const px = POND.x,
    pz = POND.z,
    pw = POND.width,
    pd = POND.depth;
  box(px, 0.08, pz, pw - 0.05, 0.15, pd - 0.05, m.black);
  box(px - pw / 2 + 0.065, 0.34, pz, 0.13, 0.46, pd, m.stone);
  box(px + pw / 2 - 0.065, 0.34, pz, 0.13, 0.46, pd, m.stone);
  box(px, 0.34, pz - pd / 2 + 0.065, pw, 0.46, 0.13, m.stone);
  box(px, 0.34, pz + pd / 2 - 0.065, pw, 0.46, 0.13, m.stone);
  for (const x of [px - pw / 2, px + pw / 2])
    box(x, 0.11, pz, 0.022, 0.022, pd, m.led);
  for (const z of [pz - pd / 2, pz + pd / 2])
    box(px, 0.11, z, pw, 0.022, 0.022, m.led);
  const pondGlow = new THREE.MeshBasicMaterial({
    map: t.shadow,
    color: "#ffb953",
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = mesh(new THREE.PlaneGeometry(pw + 1, pd + 1), pondGlow);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(px, 0.016, pz);
  glow.castShadow = false;
  const reflector = new Reflector(
    new THREE.PlaneGeometry(pw - 0.28, pd - 0.28),
    {
      textureWidth: quality.reflections ? 256 : 64,
      textureHeight: quality.reflections ? 512 : 64,
      color: "#a8b6a0",
      clipBias: 0.005,
    },
  );
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(px, 0.455, pz);
  reflector.visible = quality.reflections;
  scene.add(reflector);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: "#26342b",
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.62,
    normalMap: t.wave,
    normalScale: new THREE.Vector2(0.09, 0.09),
    depthWrite: false,
  });
  t.wave.repeat.set(2, 5);
  const water = mesh(new THREE.PlaneGeometry(pw - 0.28, pd - 0.28), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(px, 0.462, pz);
  water.castShadow = false;
  const cascadeZ = pz - pd / 2 + 0.72;
  const logs = createHollowLogs(m.log, m.logEnd, m.logInside);
  logs.position.set(px, 0.64, cascadeZ);
  addReferenceObject(logs);
  const flameMaterial = new THREE.SpriteMaterial({
    map: t.flame,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  createdMaterials.add(flameMaterial);
  const flames = [];
  for (let i = 0; i < 4; i++) {
    const flame = new THREE.Sprite(flameMaterial);
    flame.position.set(px - 0.23 + i * 0.15, 1.39 + (i % 2) * 0.05, cascadeZ);
    flame.scale.set(0.18, 0.38, 1);
    world.add(flame);
    flames.push(flame);
  }
  // Foliage uses GPU instances: thousands of curved, veined leaves at a few draw calls.
  const treeLeaves = [],
    floorLeaves = [],
    vineLeaves = [];
  function addPlant(x, z, size = 1, pot = true, baseHeight = 0.09) {
    if (pot) {
      box(x, 0.16, z, 0.46 * size, 0.32, 0.46 * size, m.black);
      box(x, 0.33, z, 0.4 * size, 0.02, 0.4 * size, m.soil);
    }
    const base = pot ? 0.32 : baseHeight;
    for (let j = 0; j < 24; j++) {
      const a = j * 2.399,
        b = 0.14 + r() * 0.24;
      floorLeaves.push({
        x: x + Math.cos(a) * b * size,
        y: base + 0.16 + r() * 0.34 * size,
        z: z + Math.sin(a) * b * size,
        w: (0.12 + r() * 0.1) * size,
        h: (0.4 + r() * 0.27) * size,
        rx: 0.25 + r() * 1.1,
        ry: -a,
        rz: (r() - 0.5) * 0.5,
      });
    }
    contact(x, z, 1.1 * size, 1.1 * size, 0.45);
  }
  function tree(x, z, height = 3.1, lean = 0.3) {
    const points = [
      [x, 0.15, z],
      [x + lean * 0.25, 0.9, z - 0.06],
      [x - lean * 0.15, 1.7, z + 0.05],
      [x + lean, 2.4, z + 0.1],
      [x + lean * 0.85, height, z + 0.04],
    ];
    line(points, 0.065, m.bark);
    for (let j = 0; j < 10; j++) {
      const a = j * 2.4,
        sy = 1.3 + r() * 1.3,
        ex = x + Math.cos(a) * (0.4 + r() * 0.6),
        ez = z + Math.sin(a) * (0.4 + r() * 0.6),
        ey = Math.min(height, sy + 0.65);
      line(
        [
          [x, sy, z],
          [(x + ex) / 2, sy + 0.4, (z + ez) / 2],
          [ex, ey, ez],
        ],
        0.016 + r() * 0.012,
        m.bark,
      );
      for (let k = 0; k < 36; k++) {
        const u = r() * 6.28,
          rad = r() * 0.6;
        treeLeaves.push({
          x: ex + Math.cos(u) * rad,
          y: ey + (r() - 0.5) * 0.7,
          z: ez + Math.sin(u) * rad,
          w: 0.055 + r() * 0.04,
          h: 0.27 + r() * 0.2,
          rx: r() * 3.14,
          ry: r() * 6.28,
          rz: r() * 6.28,
        });
      }
    }
  }
  for (const z of [-5.8, -4.7, -3.6, -2.5, -1.4, -0.3, 0.8, 1.9, 3, 4.1, 5.2]) {
    addPlant(-5.55, z, 0.8);
    addPlant(5.84, z, 0.8, false, 0.4);
  }
  for (let x = -4.8; x < 5; x += 0.9) addPlant(x, -6.83, 0.8, false, 0.4);
  for (const [x, z, h, l] of [
    [-4.8, -6.83, 3.1, 0.22],
    [-2.2, -6.83, 3.3, 0.34],
    [1, -6.83, 3.25, -0.2],
    [3.8, -6.83, 3.4, 0.3],
    [5.84, -4.5, 3.3, -0.3],
    [5.84, -1.4, 3.3, -0.2],
    [5.84, 2.1, 3.35, -0.24],
  ])
    tree(x, z, h, l);
  function terracottaPot(x, z, size = 1) {
    const pot = mesh(
      new THREE.CylinderGeometry(0.24 * size, 0.19 * size, 0.48 * size, 12),
      m.terracotta,
    );
    pot.position.set(x, 0.24 * size, z);
    const rim = mesh(
      new THREE.TorusGeometry(0.237 * size, 0.022 * size, 4, 16),
      m.terracotta,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.47 * size, z);
    const soil = mesh(
      new THREE.CylinderGeometry(0.215 * size, 0.215 * size, 0.015, 12),
      m.soil,
    );
    soil.position.set(x, 0.465 * size, z);
    addPlant(x, z, 0.66 * size, false, 0.47 * size);
  }
  for (const { x, z, size } of LANDMARKS.pots) terracottaPot(x, z, size);
  const fp = LANDMARKS.planter;
  rounded(fp.x, 0.25, fp.z, fp.w, 0.5, fp.d, 0.04, m.ceramic);
  box(fp.x, 0.505, fp.z, fp.w - 0.12, 0.018, fp.d - 0.12, m.soil);
  for (const dx of [-0.5, 0.5]) addPlant(fp.x + dx, fp.z, 0.8, false, 0.5);
  const treeDetails = createDecoratedTree(
    m.bark,
    m.soil,
    m.black,
    m.linen,
    m.turquoise,
    m.blue,
    thread,
  );
  treeDetails.position.set(LANDMARKS.tree.x, 0, LANDMARKS.tree.z);
  addReferenceObject(treeDetails);
  addPlant(LANDMARKS.tree.x, LANDMARKS.tree.z, 0.7, false, 0.04);
  const facade = createEntranceFacade(
    m.concrete,
    m.wood,
    m.black,
    m.led,
    m.facadeGlass,
    m.kilim,
  );
  addReferenceObject(facade);
  box(0, 3.6, 8, 12, 0.035, 2.1, roofMat, roof).castShadow = false;
  box(5.84, 0.18, -1.2, 0.27, 0.36, 11.7, m.black);
  box(0, 0.18, -6.83, 10.5, 0.36, 0.27, m.black);
  for (let x = -5.3; x < 1.5; x += 0.6) addPlant(x, 6.43, 0.58, false);
  const arbor = new THREE.Group();
  world.add(arbor);
  for (const x of [-4.8, -2.65])
    for (const z of [-4.7, -0.5]) box(x, 1.26, z, 0.04, 2.52, 0.04, m.black);
  for (const x of [-4.8, -2.65]) box(x, 2.52, -2.6, 0.04, 0.045, 4.25, m.black);
  for (let z = -4.7; z <= -0.5; z += 0.55)
    box(-3.725, 2.52, z, 2.2, 0.035, 0.035, m.black);
  for (const [x, z] of [
    [-4.7, -4.5],
    [-2.8, -0.6],
  ]) {
    line(
      [
        [x, 0, z],
        [x + 0.2, 0.9, z - 0.15],
        [x - 0.12, 1.7, z + 0.1],
        [x + 0.05, 2.5, z],
      ],
      0.055,
      m.bark,
    );
  }
  for (const z of [-4.1, -2.8, -1.2])
    line(
      [
        [-4.7, 2.42, z],
        [-4.1, 2.63, z + 0.18],
        [-3.45, 2.51, z - 0.12],
        [-2.7, 2.56, z + 0.2],
      ],
      0.025,
      m.bark,
    );
  for (let j = 0; j < 750; j++) {
    const x = -4.9 + r() * 2.45,
      z = -4.85 + r() * 4.55;
    vineLeaves.push({
      x,
      y: 2.52 + (r() - 0.5) * 0.32,
      z,
      w: 0.13 + r() * 0.12,
      h: 0.17 + r() * 0.15,
      rx: r() * 3.14,
      ry: r() * 6.28,
      rz: r() * 6.28,
    });
  }
  for (let j = 0; j < 150; j++) {
    const z = -4.7 + r() * 4.2;
    vineLeaves.push({
      x: -2.65 + (r() - 0.5) * 0.24,
      y: 1.6 + r() * 0.9,
      z,
      w: 0.14,
      h: 0.22,
      rx: r() * 3.14,
      ry: r() * 6.28,
      rz: r() * 6.28,
    });
  }
  // Pale pebbles in the front border.
  const pebbleGeo = new THREE.IcosahedronGeometry(1, 0),
    pebbles = new THREE.InstancedMesh(pebbleGeo, m.pebble, 450),
    dummy = new THREE.Object3D();
  for (let i = 0; i < 450; i++) {
    dummy.position.set(-5.8 + r() * 7.5, 0.44, 6.28 + r() * 0.27);
    dummy.rotation.set(r() * 3, r() * 3, r() * 3);
    dummy.scale.set(0.025 + r() * 0.02, 0.015 + r() * 0.02, 0.025 + r() * 0.02);
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  pebbles.receiveShadow = true;
  world.add(pebbles);
  function leaves(data, color) {
    if (quality.foliageStep > 1)
      data = data.filter((_, i) => i % quality.foliageStep === 0);
    const geo = new THREE.PlaneGeometry(1, 1, 1, 2),
      pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++)
      pos.setZ(i, Math.sin((pos.getY(i) + 0.5) * Math.PI) * 0.13);
    geo.computeVertexNormals();
    const lm = new THREE.MeshStandardMaterial({
      map: t.leaf,
      alphaTest: 0.42,
      color,
      side: THREE.DoubleSide,
      roughness: 0.87,
    });
    const inst = new THREE.InstancedMesh(geo, lm, data.length);
    for (let i = 0; i < data.length; i++) {
      let l = data[i];
      dummy.position.set(l.x, l.y, l.z);
      dummy.rotation.set(l.rx, l.ry, l.rz);
      dummy.scale.set(l.w, l.h, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(
        i,
        new THREE.Color().setHSL(
          0.2 + r() * 0.045,
          0.3 + r() * 0.18,
          0.35 + r() * 0.3,
        ),
      );
    }
    inst.receiveShadow = true;
    inst.castShadow = true;
    inst.computeBoundingSphere();
    world.add(inst);
    return inst;
  }
  leaves(treeLeaves, "#b8c58b");
  leaves(floorLeaves, "#bccb89");
  leaves(vineLeaves, "#d2d99e");
  // Hazy silhouettes beyond the translucent perimeter glazing.
  const outerLeaves = [];
  for (let j = 0; j < 20; j++) {
    let x, z;
    if (j < 10) {
      x = -12 + r() * 24;
      z = -10 - r() * 5;
    } else {
      x = (j % 2 ? 1 : -1) * (9 + r() * 4);
      z = -7 + r() * 18;
    }
    for (let k = 0; k < 220; k++) {
      outerLeaves.push({
        x: x + (r() - 0.5) * 3,
        y: 0.4 + r() * 5,
        z: z + (r() - 0.5) * 3,
        w: 0.08 + r() * 0.08,
        h: 0.18 + r() * 0.15,
        rx: r() * 3.14,
        ry: r() * 6.28,
        rz: r() * 6.28,
      });
    }
  }
  const surroundings = leaves(outerLeaves, "#a1b296");
  // Festoon lighting on catenaries and compact black brick sconces.
  for (const x of [-3.7, 2.6]) {
    line(
      [
        [x, 3.28, -6.5],
        [x, 3.12, -3],
        [x, 3.06, 0],
        [x, 3.12, 3],
        [x, 3.28, 6.5],
      ],
      0.009,
      m.black,
      roof,
    );
    for (let z = -6; z <= 6; z += 1.25) {
      const y = 3.06 + 0.21 * (z / 6.5) ** 2;
      box(x, y - 0.03, z, 0.04, 0.08, 0.04, m.black, roof);
      ball(x, y - 0.12, z, 0.045, 0.064, 0.045, m.bulb, roof);
    }
  }
  for (const z of [-5.5, -2.5, 0.5, 3.5, 5.8])
    for (const x of [-5.84, 5.84]) {
      box(x, 1.31, z, 0.09, 0.18, 0.13, m.black);
      box(x, 1.42, z, 0.1, 0.018, 0.12, m.led);
      box(x, 1.2, z, 0.1, 0.018, 0.12, m.led);
    }
  for (const x of [-4, -1, 2, 4.5]) {
    box(x, 1.31, -6.84, 0.13, 0.18, 0.09, m.black);
    box(x, 1.42, -6.84, 0.12, 0.018, 0.1, m.led);
  }
  const hemi = new THREE.HemisphereLight("#fff4d8", "#8c8173", 2.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1cc", 3);
  sun.position.set(-3, 9, 4);
  sun.target.position.set(0, 0, -2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  Object.assign(sun.shadow.camera, {
    left: -11,
    right: 11,
    top: 12,
    bottom: -12,
    near: 0.5,
    far: 30,
  });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fills = [];
  for (const [x, z] of [
    [-3, -3],
    [3, -3],
    [0, 3],
  ]) {
    const l = new THREE.PointLight("#ffd294", 1, 10, 2);
    l.position.set(x, 2.6, z);
    fills.push(l);
    scene.add(l);
  }
  const pondLight = new THREE.PointLight("#ffb14e", 0.3, 4, 2);
  pondLight.position.set(px, 0.3, pz + 1.3);
  scene.add(pondLight);
  // Consolidate static opaque surfaces by material, keeping roof visibility independent.
  function batch(group) {
    group.updateMatrixWorld(true);
    const bins = new Map(),
      remove = [];
    group.traverse((o) => {
      if (
        (o.isMesh || o.isLineSegments) &&
        !o.isInstancedMesh &&
        o !== water &&
        !Array.isArray(o.material) &&
        !o.material.transparent
      ) {
        const k = o.type + o.material.uuid;
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        const flat = g.index ? g.toNonIndexed() : g;
        if (flat !== g) g.dispose();
        for (const a of Object.keys(flat.attributes))
          if (!["position", "normal", "uv"].includes(a))
            flat.deleteAttribute(a);
        if (!flat.attributes.uv)
          flat.setAttribute(
            "uv",
            new THREE.BufferAttribute(
              new Float32Array(flat.attributes.position.count * 2),
              2,
            ),
          );
        if (!bins.has(k))
          bins.set(k, {
            material: o.material,
            lines: o.isLineSegments,
            geos: [],
          });
        bins.get(k).geos.push(flat);
        remove.push(o);
      }
    });
    for (const { material, lines, geos } of bins.values()) {
      const geo = mergeGeometries(geos, false);
      if (geo) {
        const o = lines
          ? new THREE.LineSegments(geo, material)
          : new THREE.Mesh(geo, material);
        o.castShadow = !lines;
        o.receiveShadow = !lines;
        group.add(o);
      }
      for (const g of geos) g.dispose();
    }
    remove.forEach((o) => o.removeFromParent());
  }
  batch(world);
  batch(roof);
  let night = 0,
    targetNight = 0;
  function setNight(value) {
    targetNight = value ? 1 : 0;
  }
  const nightSun = new THREE.Color("#728bbe"),
    nightSky = new THREE.Color("#142735");
  function update(time, dt) {
    night = THREE.MathUtils.damp(night, targetNight, 3, dt);
    hemi.intensity = THREE.MathUtils.lerp(2.1, 0.18, night);
    sun.intensity = THREE.MathUtils.lerp(3, 0.04, night);
    sun.color.set("#fff1cc").lerp(nightSun, night);
    scene.background.set("#d9e0cd").lerp(nightSky, night);
    scene.fog.color.copy(scene.background);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.35, 0.09, night);
    fills.forEach((l) => (l.intensity = THREE.MathUtils.lerp(0.7, 4.5, night)));
    pondLight.intensity = THREE.MathUtils.lerp(0.3, 2.5, night);
    m.bulb.emissiveIntensity = THREE.MathUtils.lerp(2, 5, night);
    m.led.emissiveIntensity = THREE.MathUtils.lerp(1.5, 3.5, night);
    pondGlow.opacity = THREE.MathUtils.lerp(0.16, 0.5, night);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(0.92, 0.95, night);
    t.wave.offset.set(time * 0.018, time * 0.01);
    flameMaterial.opacity = THREE.MathUtils.lerp(0.015, 0.8, night);
    for (let i = 0; i < flames.length; i++)
      flames[i].scale.y =
        0.48 +
        Math.sin(time * 4.3 + i * 2.1) * 0.045 +
        Math.cos(time * 7 + i) * 0.025;
  }
  function dispose() {
    const textures = new Set(Object.values(t));
    createdMaterials.add(shadowMaterial);
    scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry) createdGeometries.add(o.geometry);
      if (o.material) {
        for (const material of Array.isArray(o.material)
          ? o.material
          : [o.material])
          createdMaterials.add(material);
      }
      if (o.shadow) o.shadow.dispose();
    });
    for (const material of createdMaterials) {
      for (const value of Object.values(material))
        if (value?.isTexture) textures.add(value);
      material.dispose();
    }
    for (const geometry of createdGeometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    reflector.getRenderTarget().dispose();
    env.dispose();
    scene.clear();
  }
  return {
    dispose,
    scene,
    world,
    roof,
    floor,
    reflector,
    water,
    tableHits,
    setSelectedTable(id) {
      for (const [key, outline] of tableHighlights)
        outline.visible = key === id;
    },
    setNight,
    update,
    setOverview(value) {
      roof.visible = !value;
      surroundings.visible = !value;
    },
  };
}
