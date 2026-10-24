import * as THREE from "three";
export function seeded(seed = 19) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function canvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}
function texture(c, srgb = true, maxSize = 1024) {
  if (Math.max(c.width, c.height) > maxSize) {
    const scale = maxSize / Math.max(c.width, c.height);
    const [small, context] = canvas(
      Math.round(c.width * scale),
      Math.round(c.height * scale),
    );
    context.drawImage(c, 0, 0, small.width, small.height);
    c = small;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
export function makeTextures(maxSize = 1024) {
  const detail = maxSize / 1024;
  const random = seeded(25);
  const [wood, w] = canvas(1024, 512);
  w.fillStyle = "#ae7c4c";
  w.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 3500 * detail; i++) {
    let y = random() * 512;
    w.strokeStyle = `rgba(${random() > 0.55 ? "65,35,15" : "245,208,151"},${0.015 + random() * 0.075})`;
    w.lineWidth = 0.4 + random() * 1.5;
    w.beginPath();
    w.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32)
      w.lineTo(x, y + Math.sin(x * 0.007 + i) * 1.8 + random());
    w.stroke();
  }
  for (let i = 0; i < 8; i++) {
    let y = i * 64;
    w.fillStyle = "#60442d60";
    w.fillRect(0, y, 1024, 2);
    w.fillStyle = "#e7bd8330";
    w.fillRect(0, y + 2, 1024, 1);
  }
  for (let i = 0; i < 11; i++) {
    let x = random() * 1024,
      y = random() * 512;
    for (let a = 0; a < 7; a++) {
      w.beginPath();
      w.ellipse(x, y, 8 + a * 4, 1.5 + a * 0.9, 0, 0, Math.PI * 2);
      w.strokeStyle = "#4b2a1614";
      w.lineWidth = 1;
      w.stroke();
    }
  }
  const [brick, b] = canvas(1024, 512);
  b.fillStyle = "#898376";
  b.fillRect(0, 0, 1024, 512);
  for (let row = 0; row < 8; row++)
    for (let col = -1; col < 9; col++) {
      let x = col * 128 + (row % 2) * 64,
        y = row * 64;
      let c = 110 + random() * 36;
      b.fillStyle = `rgb(${c + 41},${c - 12},${c - 41})`;
      b.fillRect(x + 3, y + 3, 122, 58);
      b.strokeStyle = "#d6a57644";
      b.strokeRect(x + 4, y + 4, 120, 56);
      for (let j = 0; j < 150 * detail; j++) {
        b.fillStyle = random() > 0.5 ? "#251a1533" : "#e6c0a933";
        b.fillRect(
          x + random() * 122 + 3,
          y + random() * 58 + 3,
          random() * 4 + 1,
          random() * 2 + 1,
        );
      }
    }
  const [floor, f] = canvas(1024);
  f.fillStyle = "#aba99c";
  f.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      let base = 175 + random() * 12;
      f.fillStyle = `rgb(${base + 4},${base + 1},${base - 8})`;
      f.fillRect(col * 256 + 1, row * 256 + 1, 253, 253);
      for (let j = 0; j < 45; j++) {
        f.beginPath();
        f.ellipse(
          col * 256 + random() * 256,
          row * 256 + random() * 256,
          5 + random() * 45,
          2 + random() * 18,
          random() * 6,
          0,
          6.28,
        );
        f.fillStyle = random() > 0.5 ? "#ffffff04" : "#77777706";
        f.fill();
      }
    }
  for (let i = 0; i < 85000 * detail; i++) {
    f.fillStyle = random() > 0.5 ? "#ffffff0b" : "#363d370b";
    f.fillRect(random() * 1024, random() * 1024, 1, 1);
  }
  const [stone, s] = canvas(512);
  s.fillStyle = "#292e2b";
  s.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 23000 * detail; i++) {
    s.fillStyle = random() > 0.5 ? "#e1e3d91b" : "#050a051f";
    s.fillRect(
      random() * 512,
      random() * 512,
      1 + random() * 1.5,
      1 + random(),
    );
  }
  const [fabric, a] = canvas(256);
  a.fillStyle = "#69704a";
  a.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    a.fillStyle = i % 4 ? "#ffffff10" : "#14241918";
    a.fillRect(i, 0, 1, 256);
    a.fillRect(0, i, 256, 1);
  }
  const [leaf, l] = canvas(128, 256);
  l.clearRect(0, 0, 128, 256);
  l.beginPath();
  l.moveTo(64, 5);
  l.bezierCurveTo(119, 58, 126, 175, 64, 248);
  l.bezierCurveTo(2, 179, 9, 67, 64, 5);
  l.closePath();
  const lg = l.createLinearGradient(5, 0, 110, 240);
  lg.addColorStop(0, "#b6c785");
  lg.addColorStop(0.45, "#738b4b");
  lg.addColorStop(1, "#324b26");
  l.fillStyle = lg;
  l.fill();
  l.strokeStyle = "#d8df9a88";
  l.lineWidth = 1.8;
  l.beginPath();
  l.moveTo(64, 240);
  l.lineTo(64, 14);
  l.stroke();
  for (let i = 0; i < 12; i++) {
    let y = 30 + i * 17;
    l.strokeStyle = "#b2c17566";
    l.lineWidth = 0.7;
    l.beginPath();
    l.moveTo(64, y + 17);
    l.lineTo(28, y - 5);
    l.moveTo(64, y + 17);
    l.lineTo(99, y - 5);
    l.stroke();
  }
  const [shadow, sh] = canvas(128);
  const grad = sh.createRadialGradient(64, 64, 3, 64, 64, 62);
  grad.addColorStop(0, "rgba(15,24,14,.42)");
  grad.addColorStop(0.5, "rgba(15,24,14,.18)");
  grad.addColorStop(1, "rgba(15,24,14,0)");
  sh.fillStyle = grad;
  sh.fillRect(0, 0, 128, 128);
  const [wave, v] = canvas(256);
  const pixels = v.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const wave =
        Math.sin(x * 0.18 + Math.sin(y * 0.12) * 2) * 15 +
        Math.sin(y * 0.25 + x * 0.03) * 9;
      const i = (y * 256 + x) * 4;
      pixels.data[i] = 128 + wave;
      pixels.data[i + 1] = 128 - wave;
      pixels.data[i + 2] = 255;
      pixels.data[i + 3] = 255;
    }
  v.putImageData(pixels, 0, 0);
  const [bark, barkContext] = canvas(256, 512);
  barkContext.fillStyle = "#80715d";
  barkContext.fillRect(0, 0, 256, 512);
  for (let x = -8; x < 270; x += 11) {
    for (let y = -10; y < 540; y += 35) {
      const offset = random() * 12;
      barkContext.fillStyle = random() > 0.5 ? "#483f32" : "#b29a79";
      barkContext.fillRect(
        x + offset,
        y + random() * 8,
        3 + random() * 6,
        24 + random() * 15,
      );
      barkContext.strokeStyle = "#302a2390";
      barkContext.beginPath();
      barkContext.moveTo(x + offset, y);
      barkContext.lineTo(x + offset - 3, y + 18);
      barkContext.lineTo(x + offset + 1, y + 31);
      barkContext.stroke();
    }
  }
  const [flame, flameContext] = canvas(64, 128);
  const flameGradient = flameContext.createRadialGradient(
    32,
    96,
    2,
    32,
    72,
    58,
  );
  flameGradient.addColorStop(0, "#a2c5ffff");
  flameGradient.addColorStop(0.24, "#4b7dffd0");
  flameGradient.addColorStop(0.65, "#5aa3ff50");
  flameGradient.addColorStop(1, "#2684ff00");
  flameContext.fillStyle = flameGradient;
  flameContext.beginPath();
  flameContext.moveTo(32, 3);
  flameContext.bezierCurveTo(15, 48, 0, 110, 31, 126);
  flameContext.bezierCurveTo(62, 113, 50, 62, 32, 3);
  flameContext.fill();
  const [kilim, k] = canvas(256);
  k.fillStyle = "#a55e7c";
  k.fillRect(0, 0, 256, 256);
  for (let band = 0; band < 8; band++) {
    k.fillStyle = ["#b8a14b", "#b9779c", "#795965", "#c69d69"][band % 4];
    k.fillRect(0, band * 32, 256, 16);
    for (let x = -16; x < 272; x += 32) {
      k.beginPath();
      k.moveTo(x, band * 32 + 16);
      k.lineTo(x + 16, band * 32 + 32);
      k.lineTo(x + 32, band * 32 + 16);
      k.closePath();
      k.fillStyle = band % 2 ? "#caab73" : "#72526f";
      k.fill();
    }
  }
  const makeTexture = (source, srgb = true) => texture(source, srgb, maxSize);
  return {
    wood: makeTexture(wood),
    bark: makeTexture(bark),
    kilim: makeTexture(kilim),
    flame: makeTexture(flame),
    brick: makeTexture(brick),
    floor: makeTexture(floor),
    stone: makeTexture(stone),
    fabric: makeTexture(fabric),
    leaf: makeTexture(leaf),
    shadow: makeTexture(shadow),
    wave: makeTexture(wave, false),
  };
}
