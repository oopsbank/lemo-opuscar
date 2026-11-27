// The set: a small, tall café on a snowy December morning, open at the front (a diorama). Floor y 0, x[−9.5, 7.5] z[−4, 3.2].
// The counter runs x[−3.2, 2.4] at z −1.2…−.55 with the big brass espresso machine on it (x −1.75), the till and the ticket printer,
// the pastry case with the Cat on top; the back counter, shelves and the chalk menu under a high brick wall; tables with laptop
// people on the left; the queue on the right up to the big window and the door onto the street (behind the back wall, z < −4).
// The milk foam rises over the floor in the flood. Dense on purpose.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, glow, billboard, woodPlanks } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles } from './fx.js';
import { makeChar, SPX } from './chars.js';
import { T, P, DUR, VO, QUEUE, SITTERS, walkStep, geyser, foam, pressure, MODS, modAt } from './story.js';
import { HUD, VDUR as DURS } from './ui.js';
import { clamp, seg, ss, lerp, mulberry, eo } from '/core/lib.js';
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pick = (t, hz, k = 0) => (Math.floor(t * hz + k) % 2) === 0;
const vo = id => VO.find(v => v.id === id);
const talk = (t, id, d) => { const v = vo(id); return t >= v.t && t < v.t + d; };
const says = (t, id) => { const v = vo(id); return t >= v.t && t < v.t + (DURS[id] || 1.2) && pick(t, 7); };

// —— pixel text: a pixel font drawn small, alpha thresholded to hard pixels ——
function pixText(lines, o = {}) {
  const w = o.w ?? 96, h = o.h ?? 24, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (o.bg !== null) { g.fillStyle = o.bg ?? '#ffffff'; g.fillRect(0, 0, w, h); }
  if (o.border) { g.fillStyle = o.border; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); }
  const lay = document.createElement('canvas'); lay.width = w; lay.height = h; const L = lay.getContext('2d');
  L.textBaseline = 'middle';
  for (const ln of lines) { L.textAlign = ln.al ?? 'center'; L.font = `${ln.b ? 700 : 400} ${ln.s}px Silkscreen`; L.fillStyle = ln.c; L.fillText(ln.t, (ln.x ?? .5) * w, ln.y * h); }
  const d = L.getImageData(0, 0, w, h), D = d.data;
  for (let i = 0; i < D.length; i += 4) D[i + 3] = D[i + 3] > 110 ? 255 : 0;
  L.putImageData(d, 0, 0); g.drawImage(lay, 0, 0);
  return c;
}
function basic(c, o = {}) { const m = new THREE.MeshStandardMaterial({ map: texOf(c), roughness: o.rough ?? .8, metalness: o.metal ?? 0, transparent: !!o.alpha, alphaTest: o.alpha ? .5 : 0 }); if (o.em) { m.emissiveMap = m.map; m.emissive = new THREE.Color('#ffffff'); m.emissiveIntensity = o.em; } return m; }
function quad(w, h, m) { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.receiveShadow = true; return q; }
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .6, metalness: o.m ?? 0, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 0 });

// —— café textures ——
function herring(w, h) {   // the floor: honey oak herringbone
  const p = new PX(w, h), R = ramp(['#4a2c16', '#6e4422', '#8e5c30', '#a87440', '#c08c52'], .4);
  p.fill((x, y) => { const k = Math.floor((x + y) / 8), dir = k % 2, u = dir ? (x - y + 512) % 24 : (x + y) % 24, edge = (x + y) % 8 === 0 || u === 0;
    if (edge) return R(.12, x, y); return R(.55 + (h2(k, Math.floor((dir ? x - y : x + y) / 24), 3) - .5) * .4 + (fbm(x * .3, y * .05, 5) - .5) * .25, x, y); });
  return p.done();
}
function subway(w, h) {   // the wall behind the counter: white subway tiles with a green band
  const p = new PX(w, h), R = ramp(['#9aa49c', '#c4ccc4', '#e4e8e0', '#f6f8f2'], .4), G = ramp(['#1c4a2a', '#2a6a3a', '#3a8a4a'], .4);
  p.fill((x, y) => { const row = Math.floor(y / 6), xx = (x + (row % 2) * 6) % 12, yy = y % 6; if (yy === 0 || xx === 0) return [120, 126, 118];
    if (row % 8 === 5) return G(.5 + (yy === 1 ? .3 : 0), x, y); return R(.62 + (yy === 1 ? .25 : 0) - (yy === 5 ? .2 : 0) + (h2(row, x >> 3, 4) - .5) * .12, x, y); });
  return p.done();
}
function brick(w, h) {
  const p = new PX(w, h), R = ramp(['#3a1810', '#5a2818', '#7a3a22', '#94502e', '#a8643c'], .4);
  p.fill((x, y) => { const row = Math.floor(y / 5), xx = (x + (row % 2) * 6) % 12; if (y % 5 === 0 || xx === 0) return [92, 80, 72]; return R(.5 + (h2(row, Math.floor((x + (row % 2) * 6) / 12), 7) - .5) * .5 + (h2(x, y, 2) - .5) * .15, x, y); });
  return p.done();
}
function chalkMenu(flood) {
  const W = 128, H = 72, c = pixText([
    { t: 'COFFEE', s: 10, b: 1, c: '#ffe8a0', y: .1 },
    { t: 'LATTE', s: 8, c: '#f4f0e6', y: .27, x: .06, al: 'left' }, { t: '4.0', s: 8, c: '#f4f0e6', y: .27, x: .5, al: 'right' },
    { t: 'FLAT WHITE', s: 8, c: '#f4f0e6', y: .4, x: .06, al: 'left' }, { t: '4.0', s: 8, c: '#f4f0e6', y: .4, x: .5, al: 'right' },
    { t: 'MOCHA', s: 8, c: '#f4f0e6', y: .53, x: .06, al: 'left' }, { t: '4.5', s: 8, c: '#f4f0e6', y: .53, x: .5, al: 'right' },
    { t: 'CAPPUCCINO', s: 8, c: '#f4f0e6', y: .66, x: .06, al: 'left' }, { t: '4.0', s: 8, c: '#f4f0e6', y: .66, x: .5, al: 'right' },
    { t: 'OAT  +0.5', s: 8, c: '#b8e890', y: .8, x: .06, al: 'left' },
    { t: 'TODAY', s: 8, b: 1, c: '#ff9ab0', y: .27, x: .76 }, { t: 'GINGER', s: 8, c: '#f4f0e6', y: .4, x: .76 }, { t: 'LATTE', s: 8, c: '#f4f0e6', y: .53, x: .76 },
  ], { w: W, h: H, bg: '#1e2a24', border: '#8a6a40' });
  const g = c.getContext('2d'); g.fillStyle = '#8a6a40'; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2); g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H); g.fillRect(64, 18, 1, 44);
  for (let k = 0; k < 4; k++) { g.fillStyle = ['#ff9ab0', '#b8e890', '#ffe8a0', '#9ad0ff'][k]; g.fillRect(84 + k * 7, 60, 4, 4); }
  if (flood) {   // the payoff: a new item stuck on in red
    const s = pixText([{ t: 'THE FLOOD', s: 9, b: 1, c: '#fff6e0', y: .32 }, { t: 'SOLD OUT', s: 8, b: 1, c: '#ffe070', y: .74 }], { w: 58, h: 26, bg: '#c41a26', border: '#fff6e0' });
    g.save(); g.translate(96, 44); g.rotate(-.12); g.drawImage(s, -29, -13); g.restore();
  }
  return c;
}
function foamTex(w, h, seed) {   // milk foam: cream with bubbles
  const p = new PX(w, h), R = ramp(['#c8bca8', '#e2d8c6', '#f4ecde', '#fffaf0', '#ffffff'], .4);
  p.fill((x, y) => R(.62 + (fbm(x * .12, y * .12, seed) - .5) * .6, x, y));
  const rnd = mulberry(seed * 7 + 3);
  for (let k = 0; k < w * h / 40; k++) { const cx = rnd() * w, cy = rnd() * h, r = 1 + rnd() * 2.6; p.ellipse(cx, cy, r, r, (x, y, dx, dy) => (dx * dx + dy * dy > .55 ? [196, 186, 170] : dx < -.2 && dy < -.2 ? [255, 255, 255] : [246, 240, 228])); }
  const t = texOf(p.done()); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function glyphCup() {   // the cup "for Siobhan": a bird, an eye, a squiggle, in marker
  const p = new PX(64, 40); p.fill((x, y) => (y < 3 ? [250, 250, 248] : y > 36 ? [230, 226, 216] : [246, 242, 232]));
  p.rect(0, 30, 64, 3, [110, 70, 40]);
  const ink = [24, 40, 110];
  // bird
  p.ellipse(14, 16, 5, 3.5, ink); p.ellipse(19, 12, 2.6, 2.6, ink); p.rect(21, 12, 3, 1, ink); p.line(11, 19, 9, 24, ink); p.line(15, 19, 15, 24, ink); p.line(9, 15, 6, 13, ink); p.set(19, 11, [246, 242, 232]);
  // eye
  p.ellipse(34, 15, 6, 3, ink); p.ellipse(34, 15, 4.6, 1.8, [246, 242, 232]); p.ellipse(34, 15, 1.8, 1.8, ink); p.line(30, 18, 28, 24, ink); p.line(28, 24, 33, 24, ink);
  // squiggle
  for (let x = 43; x < 60; x++) p.rect(x, Math.round(15 + Math.sin(x * .9) * 3), 1, 2, ink);
  p.rect(43, 22, 16, 1, ink);
  return p.done();
}
function streetFacade(w, h, s) {   // the buildings across the street: lit windows in the snow light
  const p = new PX(w, h), R = ramp(s % 2 ? ['#2a2238', '#3a3050', '#4c4268', '#5e5480'] : ['#3a2a22', '#4e382c', '#64483a', '#7a5a48'], .4);
  p.fill((x, y) => { const wx = x % 16, wy = y % 20; if (wx > 3 && wx < 12 && wy > 4 && wy < 15) { const lit = h2(x >> 4, y / 20 | 0, s) > .35; return lit ? (wy < 6 ? [255, 238, 190] : [255, 206, 120]) : [40, 50, 70]; } return R(.5 + (h2(x >> 2, y >> 2, s) - .5) * .3, x, y); });
  for (let x = 0; x < w; x++) for (let y = 0; y < 3; y++) p.set(x, y, [236, 242, 250]);
  return p.done();
}
function snowTex(w, h) { const p = new PX(w, h), R = ramp(['#8a9ab4', '#b8c4d4', '#d8e0ea', '#eef2f8', '#ffffff'], .4); p.fill((x, y) => R(.6 + (fbm(x * .14, y * .14, 7) - .5) * .8, x, y)); return p.done(); }
function posterTex(k) {
  const p = new PX(24, 32), bg = [[236, 196, 120], [120, 170, 200], [220, 120, 110]][k];
  p.fill(() => bg);
  if (k === 0) { p.rect(7, 12, 10, 12, [246, 242, 232]); p.rect(17, 15, 3, 5, [246, 242, 232]); p.rect(8, 13, 8, 3, [110, 70, 40]); for (let y = 4; y < 11; y++) p.set(10 + (y % 3), y, [250, 250, 250]); }
  if (k === 1) { p.poly([[2, 26], [12, 8], [22, 26]], [70, 90, 120]); p.poly([[9, 13], [12, 8], [15, 13]], [250, 250, 250]); p.ellipse(18, 6, 3, 3, [255, 236, 150]); }
  if (k === 2) { p.ellipse(12, 16, 8, 8, [110, 70, 40]); p.line(8, 10, 16, 22, [60, 36, 20]); p.rect(4, 27, 16, 2, [250, 250, 250]); }
  for (let x = 0; x < 24; x++) { p.set(x, 0, [30, 24, 20]); p.set(x, 31, [30, 24, 20]); } for (let y = 0; y < 32; y++) { p.set(0, y, [30, 24, 20]); p.set(23, y, [30, 24, 20]); }
  return p.done();
}
function plantTex() { const p = new PX(20, 26); for (let k = 0; k < 9; k++) { const a = -1.3 + k * .32; p.line(10, 25, 10 + Math.round(Math.sin(a) * 9), 25 - Math.round(Math.cos(a) * 16 + (k % 2) * 4), [50 + k * 8, 130 + k * 6, 50]); p.ellipse(10 + Math.sin(a) * 9, 25 - Math.cos(a) * 16 - (k % 2) * 4, 2.4, 1.6, [70, 170, 70]); } return p.done(); }
function ivyTex() { const p = new PX(16, 40); for (let k = 0; k < 3; k++) { let x = 4 + k * 4; for (let y = 0; y < 40; y++) { x += Math.round(Math.sin(y * .5 + k) * .6); p.set(x, y, [40, 110, 40]); if (y % 4 === k) p.ellipse(x + (y % 8 < 4 ? 2 : -2), y, 1.8, 1.4, [60 + k * 20, 150, 60]); } } return p.done(); }
function paperTex() { const p = new PX(16, 128); p.fill((x, y) => (x === 0 || x === 15 ? [210, 206, 196] : [248, 246, 240])); for (let y = 4; y < 128; y += 7) { const n = 4 + (h2(y, 1, 3) * 9 | 0); p.rect(2, y, n, 1, [60, 60, 70]); p.rect(2 + n + 1, y, 3, 1, [60, 60, 70]); } return p.done(); }
function gaugeTex() {
  const p = new PX(40, 40); p.ellipse(20, 20, 19, 19, [40, 30, 20]); p.ellipse(20, 20, 17, 17, [246, 240, 226]);
  for (let k = 0; k <= 10; k++) { const a = -2.2 + k * .44, r0 = k > 7 ? 11 : 13; for (let r = r0; r < 16; r++) p.set(20 + Math.sin(a) * r, 20 - Math.cos(a) * r, k > 7 ? [210, 30, 40] : [40, 40, 50]); }
  for (let a = .9; a < 2.2; a += .02) for (let r = 14; r < 16; r++) p.set(20 + Math.sin(a) * r, 20 - Math.cos(a) * r, [220, 40, 40]);
  p.rect(14, 26, 12, 4, [255, 210, 58]); p.rect(15, 27, 10, 1, [30, 20, 20]); p.rect(15, 29, 6, 1, [30, 20, 20]);
  return p.done();
}

export function buildCafe() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1620');
  scene.fog = new THREE.FogExp2(new THREE.Color('#c8b8a0'), .006);
  const R = mulberry(23);

  // —— lights ——
  const key = new THREE.DirectionalLight('#ffe8d0', 1.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 60 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(-1, 0, -1); key.position.set(3, 18, 12); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#e0e4ff', '#8a5a38', 1.0); scene.add(hemi);
  const pend = [-2.4, -.9, .6, 2.0].map(x => { const L = new THREE.PointLight('#ffc884', 3.2, 5, 1.5); L.position.set(x, 2.3, -.9); scene.add(L); return L; });
  const winL = new THREE.SpotLight('#b8d0ff', 6, 12, .8, .6, 1.2); winL.position.set(5, 3.0, -6); const doorL = new THREE.PointLight('#d8e4ff', 0, 6, 1.4); doorL.position.set(5.2, 2.4, -3.2); scene.add(doorL); winL.target.position.set(3.5, 0, 0); scene.add(winL, winL.target);
  const warmKey = new THREE.SpotLight('#ffd8b0', 0, 8, .6, .6, 1.2); warmKey.position.set(.3, 2.6, 1.4); warmKey.target.position.set(-.7, 1.5, -1.3); scene.add(warmKey, warmKey.target);
  const machL = new THREE.PointLight('#ffb060', 1.2, 3, 1.6); machL.position.set(-1.75, 1.8, -.4); scene.add(machL);
  const errL = new THREE.PointLight('#ff3020', 0, 4, 1.6); errL.position.set(-1.75, 1.6, -.3); scene.add(errL);

  // —— floor, walls ——
  scene.add(mesh(new THREE.BoxGeometry(17.5, .2, 7.6).translate(-1, -.1, -.4), mat(herring(96, 96), { rough: .5 }), { cast: false }));
  const rugM = new THREE.MeshStandardMaterial({ map: texOf((() => { const p = new PX(32, 20), Rr = ramp(['#5a1a1a', '#8a2a24', '#a8402e'], .4); p.fill((x, y) => { if (x < 2 || y < 2 || x > 29 || y > 17) return [220, 190, 120]; return ((x + y) % 6 < 2 || (x - y + 40) % 6 < 2) ? [200, 160, 90] : Rr(.5, x, y); }); return p.done(); })()), roughness: 1 });
  { const rug = box(3.2, .015, 2.0, rugM, { cast: false }); rug.position.set(-6.0, 0, .7); scene.add(rug); }
  const WALLH = 6.5;
  const brickM = new THREE.MeshStandardMaterial({ map: texOf(brick(96, 96)), roughness: .9 }); brickM.map.wrapS = brickM.map.wrapT = THREE.RepeatWrapping;
  const wallPart = (x0, x1, y0, y1) => { const w = x1 - x0, h = y1 - y0, g = new THREE.BoxGeometry(w, h, .3); g.translate(0, h / 2, 0); const m = mesh(g, mat(brick(96, 96), { rough: .9 }), { cast: false }); m.position.set((x0 + x1) / 2, y0, -4.15); scene.add(m); return m; };
  wallPart(-9.6, 2.8, 0, WALLH); wallPart(2.8, 7.6, 0, .9); wallPart(2.8, 7.6, 2.9, WALLH); wallPart(4.75, 5.05, .9, 2.9); wallPart(5.95, 6.15, .9, 2.9);
  const tiles = quad(6.2, 2.4, new THREE.MeshStandardMaterial({ map: (() => { const t = texOf(subway(96, 48)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; })(), roughness: .35 }));
  tiles.position.set(-.5, 2.1, -3.99); scene.add(tiles);
  const sideL = mesh(new THREE.BoxGeometry(.3, WALLH, 7.6).translate(0, WALLH / 2, -.4), mat(brick(96, 96), { rough: .9 }), { cast: false }); sideL.position.set(-9.75, 0, 0); scene.add(sideL);
  // the window frames, the door, the glass
  const frameM = std('#1e3a2c', { r: .5 }), glassM = new THREE.MeshStandardMaterial({ color: '#bcd8f0', roughness: .05, metalness: .2, transparent: true, opacity: .18, depthWrite: false });
  for (const [x0, x1] of [[2.8, 4.75], [6.15, 7.6]]) { const gl = quad(x1 - x0, 2.0, glassM); gl.position.set((x0 + x1) / 2, 1.9, -4.05); scene.add(gl);
    for (const y of [.9, 2.9]) { const f = box(x1 - x0, .08, .12, frameM); f.position.set((x0 + x1) / 2, y - .04, -4.0); scene.add(f); }
    for (let x = x0; x <= x1 + .01; x += (x1 - x0) / 2) { const f = box(.07, 2.0, .12, frameM); f.position.set(x, .9, -4.0); scene.add(f); } }
  const winSign = quad(1.6, .3, basic(pixText([{ t: 'OPEN  ·  WIFI', s: 9, b: 1, c: '#ff7a5a', y: .55 }], { w: 64, h: 12, bg: null }), { em: 2.0, alpha: true })); winSign.position.set(3.8, 2.6, -4.02); scene.add(winSign);
  const door = new THREE.Group(); { const leaf = box(.9, 2.0, .06, frameM); leaf.position.set(.45, 0, 0); door.add(leaf); const dg = quad(.6, 1.2, glassM); dg.position.set(.45, 1.2, .04); door.add(dg); const hd = box(.06, .3, .06, std('#c8a050', { m: .8, r: .3 })); hd.position.set(.8, .95, .06); door.add(hd); }
  door.position.set(5.05, 0, -4.05); scene.add(door);
  const bellD = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), std('#e0c050', { m: .8, r: .3 })); bellD.position.set(5.5, 2.1, -3.95); scene.add(bellD);
  // string lights along the window and across the room
  const bulbs = [], bulbM = ['#ffd060', '#ff8a50', '#ffe8a0', '#ff6a8a'].map(c => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: c, emissiveIntensity: 2.6 }));
  for (let k = 0; k < 30; k++) { const x = 2.8 + k * .16, b = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 4), bulbM[k % 4]); b.position.set(x, 3.05 - Math.abs(Math.sin(k * .42)) * .14, -3.9); scene.add(b); bulbs.push(b); }
  for (const [x0, x1] of [[-9, -3.4], [-3.4, 2.4], [2.4, 7.4]]) for (let k = 0; k < 20; k++) { const u = k / 19, b = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), bulbM[(k + (x0 | 0)) & 3]); b.position.set(lerp(x0, x1, u), 4.6 - Math.sin(u * Math.PI) * .6, -2.2 + u * .8); scene.add(b); bulbs.push(b); }
  // the big neon CAFE sign on the high brick wall, posters, a clock, ivy
  const neon = quad(3.2, .9, basic(pixText([{ t: 'CAFÉ  MORNING', s: 11, b: 1, c: '#ffd8a0', y: .55 }], { w: 112, h: 30, bg: null }), { em: 2.6, alpha: true })); neon.position.set(-.5, 5.4, -3.98); scene.add(neon);
  const neonG = glow('#ffb070', 4.5, .22); neonG.position.set(-.5, 5.4, -3.8); scene.add(neonG);
  for (const [k, x, y] of [[0, -8.2, 2.4], [1, -7.2, 2.6], [2, -4.6, 2.3], [1, 2.2, 4.2], [0, -3.6, 4.4]]) { const pq = quad(.62, .82, basic(posterTex(k), { rough: .7 })); pq.position.set(x, y, -3.98); scene.add(pq); }
  { const ck = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .06, 20), std('#f4f0e6')); ck.rotation.x = Math.PI / 2; ck.position.set(-6.0, 4.4, -3.95); scene.add(ck); for (const [l, r] of [[.22, .5], [.16, 2.2]]) { const h = box(.02, l, .02, std('#1a1a20')); h.rotation.z = r; h.position.set(-6.0, 4.4, -3.9); scene.add(h); } }
  const ivy = texOf(ivyTex());
  for (const x of [-9.0, -5.2, 1.9, 7.1]) { const iv = billboard(ivy, .6, 1.5, {}); iv.position.set(x, 4.9, -3.95); iv.castShadow = false; scene.add(iv); }
  for (let x = -9; x < 7.5; x += 2.2) { const d = box(.4, .4, 7.4, std('#3a3a40', { m: .6, r: .4 }), { cast: false }); d.position.set(x, 6.1, -.5); scene.add(d); }

  // —— the street outside (seen through the window and the door) ——
  { const snow = mesh(new THREE.BoxGeometry(14, .1, 10).translate(2, -.05, -9.3), mat(snowTex(64, 64), { rough: 1 }), { cast: false }); scene.add(snow);
    for (let k = 0; k < 4; k++) { const fm = quad(4.2, 5.2, basic(streetFacade(64, 80, k), { em: .5 })); fm.position.set(-1 + k * 4.2, 2.6, -11.5); scene.add(fm); }
    const lp = box(.08, 3.0, .08, std('#1a1a20', { m: .5 })); lp.position.set(4.0, 0, -6.6); scene.add(lp);
    const lh = new THREE.Mesh(new THREE.BoxGeometry(.26, .32, .26), std('#fff2c0', { e: '#ffc060', ei: 2.4 })); lh.position.set(4.0, 3.1, -6.6); scene.add(lh);
    const lg = glow('#ffc070', 1.8, .55); lg.position.set(4.0, 3.1, -6.5); scene.add(lg);
    const bike = new THREE.Group(); for (const x of [-.4, .4]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 16), std('#1a1a20')); w.position.set(x, .32, 0); bike.add(w); } const fr = box(.8, .04, .04, std('#c42a2a')); fr.position.set(0, .5, 0); bike.add(fr); bike.position.set(6.6, 0, -4.8); scene.add(bike);
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(.25, .22, .8, 10).translate(0, .4, 0), std('#2a4a3a')); bin.position.set(3.3, 0, -5.0); scene.add(bin); }
  const snowfall = particles(220, (i, t, o) => { const H = 5, y = H - ((t * (.35 + h2(i, 3, 9) * .25) + h2(i, 1, 9) * H) % H); o.x = 1.8 + h2(i, 2, 9) * 7 + Math.sin(t * .8 + i) * .2; o.z = -4.4 - h2(i, 4, 9) * 6; o.y = y; o.s = .03; o.r = o.g = o.b = 1; o.a = .9; }, { blend: THREE.NormalBlending });
  scene.add(snowfall);

  // —— the counter: dark wood front, a brass foot rail, a pale top ——
  const darkWood = mat(woodPlanks(96, 96, { pw: 8, len: 96, seed: 3, cols: ['#1e120c', '#30201a', '#462e20', '#5c3e28', '#6e4c30'], nails: false }));
  const frontWood = mat(woodPlanks(96, 96, { pw: 6, len: 96, seed: 5, cols: ['#3a2416', '#5a3a22', '#7a5230', '#94683e', '#b0804e'], nails: false }));
  const counter = mesh(new THREE.BoxGeometry(5.6, 1.0, .64).translate(0, .5, 0), frontWood); counter.position.set(-.4, 0, P.counterZ); scene.add(counter);
  const topM = std('#d8ccb8', { r: .35 }), brass = std('#d0a048', { m: .85, r: .28 });
  const ctop = box(5.75, .06, .72, topM); ctop.position.set(-.4, 1.0, P.counterZ); scene.add(ctop);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 5.5, 8), brass); rail.rotation.z = Math.PI / 2; rail.position.set(-.4, .22, P.counterZ + .42); scene.add(rail);
  for (let x = -3; x < 2.4; x += .9) { const pnl = box(.04, .8, .02, std('#2a180c')); pnl.position.set(x, .1, P.counterZ + .33); scene.add(pnl); }
  // the counter front: stickers, a chalk A-board, sacks of beans, a basket of oranges-free mugs, a dog bowl, a crate of milk
  for (const [x, y, txt, bg, fg] of [[-2.2, .62, 'OAT', '#3a8a5a', '#fff6e0'], [-1.2, .5, 'FRESH', '#d8604a', '#fff6e0'], [.6, .66, 'WIFI', '#2c5aa0', '#fff6e0'], [1.6, .5, 'CASH OK', '#f0c84a', '#1a1016']]) { const st = quad(.42, .2, basic(pixText([{ t: txt, s: 8, b: 1, c: fg, y: .55 }], { w: 40, h: 18, bg, border: '#1a1016' }), { em: .3 })); st.position.set(x, y, P.counterZ + .335); st.rotation.z = (x % .7) * .2; scene.add(st); }
  const sackT = texOf((() => { const p = new PX(24, 24), Rr = ramp(['#6a5030', '#8a6a40', '#a8885a', '#c4a676'], .4); p.fill((x, y) => Rr(.5 + ((x + y) % 3 === 0 ? .2 : 0) + (h2(x, y, 3) - .5) * .2, x, y)); p.ellipse(12, 12, 6, 5, [60, 40, 24]); p.ellipse(12, 12, 4, 3, Rr(.8, 0, 0)); p.rect(5, 19, 14, 2, [160, 40, 40]); return p.done(); })());
  for (const [x, z, r] of [[-3.05, -.25, .3], [-2.7, -.15, -.2], [-2.88, -.3, .1]]) { const sk = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .3).translate(0, .25, 0), new THREE.MeshStandardMaterial({ map: sackT, roughness: 1 })); sk.position.set(x, x === -2.88 ? .5 : 0, z); sk.rotation.y = r; sk.castShadow = true; scene.add(sk); }
  { const ab = new THREE.Group(), boardT = basic(pixText([{ t: 'TRY OUR', s: 7, b: 1, c: '#ffe8a0', y: .2 }, { t: 'OAT', s: 10, b: 1, c: '#fff6e0', y: .45 }, { t: 'LATTE', s: 10, b: 1, c: '#fff6e0', y: .68 }, { t: '♥', s: 8, c: '#ff9ab0', y: .88 }], { w: 40, h: 56, bg: '#1e2a24', border: '#8a6a40' }));
    const bq = quad(.55, .8, boardT); bq.position.set(0, .45, .08); bq.rotation.x = -.18; ab.add(bq); const fr = box(.6, .85, .04, std('#6a4a2e')); fr.position.set(0, 0, .03); fr.rotation.x = -.18; ab.add(fr); ab.position.set(1.0, 0, -.25); ab.rotation.y = -.25; scene.add(ab); }
  { const crate = box(.5, .32, .36, std('#2c5aa0', { r: .6 })); crate.position.set(2.15, 0, -.3); scene.add(crate); for (let k = 0; k < 6; k++) { const mb = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .22, 8).translate(0, .11, 0), std('#f6f4ee', { r: .4 })); mb.position.set(1.98 + (k % 3) * .17, .32, -.38 + Math.floor(k / 3) * .16); scene.add(mb); } }
  { const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.12, .09, .06, 12), std('#c42a2a')); bowl.position.set(-.6, .03, -.3); scene.add(bowl); const bt = quad(.2, .08, basic(pixText([{ t: 'DOGS', s: 6, b: 1, c: '#fff6e0', y: .55 }], { w: 24, h: 10, bg: '#c42a2a' }))); bt.rotation.x = -Math.PI / 2; bt.position.set(-.6, .07, -.3); scene.add(bt); }
  // the back counter, shelves, the menu
  const back = mesh(new THREE.BoxGeometry(6.2, .95, .55).translate(0, .475, 0), darkWood); back.position.set(-.5, 0, -3.6); scene.add(back);
  const btop = box(6.3, .05, .6, topM); btop.position.set(-.5, .95, -3.6); scene.add(btop);
  const shelfM = std('#6a4a2e', { r: .7 });
  const mugCols = ['#f4f0e6', '#2c5aa0', '#d8604a', '#3a8a5a', '#f0c84a', '#1a1a20'];
  for (const y of [1.55, 1.95]) { const sh = box(5.8, .05, .3, shelfM); sh.position.set(-.5, y, -3.82); scene.add(sh);
    for (let x = -3.3; x < 2.3; x += .19) { const k = (x * 7 + y * 13) | 0, kind = (k % 5 + 5) % 5;
      if (kind < 3) { const mg = new THREE.Mesh(new THREE.CylinderGeometry(.055, .05, .12, 10).translate(0, .06, 0), std(mugCols[(k % 6 + 6) % 6], { r: .4 })); mg.position.set(x, y + .025, -3.8); scene.add(mg); }
      else if (kind === 3) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(.04, .045, .28, 8).translate(0, .14, 0), std(['#8a2a1a', '#c8961c', '#4a2a6a', '#2a6a3a'][(k % 4 + 4) % 4], { r: .2, m: .1 })); bt.position.set(x, y + .025, -3.8); scene.add(bt); }
      else { const bg = box(.15, .22, .1, std(['#5a3a20', '#2a2a30', '#c8b090'][(k % 3 + 3) % 3], { r: .9 })); bg.position.set(x, y + .025, -3.8); scene.add(bg); } } }
  const menuM = basic(chalkMenu(false), { em: .25, rough: .9 }), menuFloodM = basic(chalkMenu(true), { em: .25, rough: .9 });
  const menu = quad(3.4, 1.9, menuM); menu.position.set(-.6, 3.25, -3.97); scene.add(menu);
  const menu2 = quad(1.4, 1.9, basic(pixText([{ t: 'PASTRY', s: 9, b: 1, c: '#ffe8a0', y: .12 }, { t: 'CROISSANT', s: 7, c: '#f4f0e6', y: .32 }, { t: 'MUFFIN', s: 7, c: '#f4f0e6', y: .47 }, { t: 'BAGEL', s: 7, c: '#f4f0e6', y: .62 }, { t: 'COOKIE', s: 7, c: '#f4f0e6', y: .77 }], { w: 56, h: 72, bg: '#1e2a24', border: '#8a6a40' }), { em: .25 }));
  menu2.position.set(1.7, 3.25, -3.97); scene.add(menu2);
  // things on the back counter: a grinder, milk jugs, a kettle, bags, a toaster-oven, cups
  for (const [x, w, h, c] of [[-3.0, .32, .55, '#2a2a30'], [-2.4, .26, .4, '#c8c4ba'], [1.4, .5, .34, '#3a3a40'], [2.0, .3, .3, '#c42a2a']]) { const b = box(w, h, .3, std(c, { m: .5, r: .35 })); b.position.set(x, 1.0, -3.6); scene.add(b); }
  for (let k = 0; k < 6; k++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .16, 10).translate(0, .08, 0), std('#c8ccd4', { m: .9, r: .2 })); j.position.set(-1.6 + k * .2, 1.0, -3.55); scene.add(j); }

  // —— the espresso machine: cream body, brass trim, two group heads, a gauge, a display, the steam knob and wand ——
  const mach = new THREE.Group(); scene.add(mach); mach.position.set(P.mach[0], P.top, P.mach[1]);
  const creamM = std('#e8dcc4', { r: .3, m: .1 }), steelM = std('#c8ccd4', { m: .9, r: .18 });
  { const body = box(1.15, .62, .55, creamM); mach.add(body);
    const base = box(1.2, .06, .6, brass); mach.add(base);
    const topRail = box(1.15, .05, .5, steelM); topRail.position.y = .62; mach.add(topRail);
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .1, 10).translate(0, .05, 0), std('#f6f2ea', { r: .3 })); c.position.set(-.45 + k * .18, .67, (k % 2) * .12 - .06); mach.add(c); }
    const eagle = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass); eagle.position.set(0, .67, 0); mach.add(eagle);
    for (const x of [-.32, .12]) { const gh = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .1, 12), steelM); gh.position.set(x, .3, .32); mach.add(gh); const pf = box(.05, .04, .26, std('#1a1a20', { r: .5 })); pf.position.set(x, .2, .42); mach.add(pf); }
    const drip = box(1.0, .03, .25, steelM); drip.position.set(-.1, .06, .32); mach.add(drip);
    const stripe = box(1.16, .07, .01, brass); stripe.position.set(0, .52, .28); mach.add(stripe); }
  const gauge = quad(.24, .24, basic(gaugeTex(), { em: .5 })); gauge.position.set(-.1 + .32, .46, .285); mach.add(gauge);
  const needle = box(.012, .1, .006, std('#c41a1a', { e: '#600000', ei: 1 })); needle.position.set(.22, .46, .292); mach.add(needle);
  const dispReady = basic(pixText([{ t: 'READY', s: 8, b: 1, c: '#7ae04a', y: .55 }], { w: 40, h: 12, bg: '#0a140a' }), { em: 1.5 }), dispErr = basic(pixText([{ t: 'ERROR', s: 8, b: 1, c: '#ff3a2a', y: .55 }], { w: 40, h: 12, bg: '#1a0606' }), { em: 2.2 }), dispQ = basic(pixText([{ t: 'FOAM?', s: 8, b: 1, c: '#ffd23a', y: .55 }], { w: 40, h: 12, bg: '#141006' }), { em: 2 });
  const disp = quad(.22, .07, dispReady); disp.position.set(-.32, .46, .282); mach.add(disp);
  const knob = new THREE.Group(); { const kb = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .05, 6), std('#1a1a20', { r: .4 })); kb.rotation.x = Math.PI / 2; knob.add(kb); const kp = box(.012, .05, .01, brass); kp.position.set(0, .0, .03); knob.add(kp); }
  knob.position.set(.5, .38, .3); mach.add(knob);
  const wand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(.56, .4, .12), v3(.66, .38, .2), v3(.66, .12, .25)]), 12, .014, 6), steelM); mach.add(wand);
  // the ticket printer and the till next to it; the endless ticket (a ribbon revealed along a path)
  const till = box(.42, .22, .3, std('#2a2a30', { r: .4 })); till.position.set(P.till[0], P.top, P.till[1]); scene.add(till);
  const tillScr = quad(.3, .16, basic(pixText([{ t: 'ORDER', s: 6, b: 1, c: '#9ad0ff', y: .3 }, { t: '#047', s: 7, b: 1, c: '#ffffff', y: .72 }], { w: 30, h: 16, bg: '#0a1a2a' }), { em: 1.6 })); tillScr.position.set(P.till[0], P.top + .34, P.till[1] + .05); tillScr.rotation.x = -.3; scene.add(tillScr);
  const printer = box(.2, .14, .22, std('#e8e4da', { r: .5 })); printer.position.set(P.printer[0], P.top, P.printer[1]); scene.add(printer);
  const path = new THREE.CatmullRomCurve3([v3(P.printer[0], P.top + .14, P.printer[1] + .05), v3(P.printer[0] + .02, P.top + .2, P.printer[1] + .25), v3(P.printer[0] + .05, P.top + .07, P.counterZ + .38), v3(P.printer[0] + .08, .5, P.counterZ + .5),
    v3(P.printer[0] + .2, .012, P.counterZ + .9), v3(2.4, .012, .1), v3(3.6, .012, -.6), v3(4.4, .012, -2.4), v3(5.4, .012, -3.9), v3(5.6, .012, -6.0)]);
  const RIB = 260, ribPos = [], ribUv = [], ribIdx = [];
  for (let i = 0; i <= RIB; i++) { const u = i / RIB, pnt = path.getPointAt(u), tg = path.getTangentAt(u), side = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(.045);
    if (Math.abs(tg.y) > .8) side.set(.045, 0, 0); ribPos.push(pnt.x - side.x, pnt.y, pnt.z - side.z, pnt.x + side.x, pnt.y, pnt.z + side.z); ribUv.push(0, u * 60, 1, u * 60); if (i < RIB) { const a = i * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const ribG = new THREE.BufferGeometry(); ribG.setAttribute('position', new THREE.Float32BufferAttribute(ribPos, 3)); ribG.setAttribute('uv', new THREE.Float32BufferAttribute(ribUv, 2)); ribG.setIndex(ribIdx); ribG.computeVertexNormals();
  const paperT = texOf(paperTex()); paperT.wrapS = paperT.wrapT = THREE.RepeatWrapping;
  const ribbon = new THREE.Mesh(ribG, new THREE.MeshStandardMaterial({ map: paperT, side: THREE.DoubleSide, roughness: .8 })); ribbon.castShadow = true; scene.add(ribbon);
  // the cups on the counter: towers, the rush row, the hieroglyph cup
  const cupM = std('#f6f2ea', { r: .35 }), sleeveM = std('#9a6a3a', { r: .8 }), lidM = std('#f8f8f6', { r: .4 });
  const mkCup = (s = 1) => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.045 * s, .035 * s, .12 * s, 12).translate(0, .06 * s, 0), cupM); c.castShadow = true; g.add(c); const sl = new THREE.Mesh(new THREE.CylinderGeometry(.044 * s, .039 * s, .04 * s, 12).translate(0, .06 * s, 0), sleeveM); g.add(sl); const ld = new THREE.Mesh(new THREE.CylinderGeometry(.047 * s, .047 * s, .015 * s, 12).translate(0, .12 * s, 0), lidM); g.add(ld); return g; };
  for (const [x, z, n] of [[-2.95, -1.0, 9], [-2.75, -.75, 7], [-2.55, -1.05, 8], [2.25, -1.05, 6]]) for (let k = 0; k < n; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .038, .12, 10).translate(0, .06, 0), cupM); c.position.set(x, P.top + .03 + k * .045, z); scene.add(c); }
  const rushCups = [...Array(10)].map(() => { const c = mkCup(); scene.add(c); return c; });
  const glyph = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(.06, .048, .16, 20, 1, true).translate(0, .08, 0), new THREE.MeshStandardMaterial({ map: texOf(glyphCup()), roughness: .5, side: THREE.DoubleSide })); c.rotation.y = -Math.PI * .55; glyph.add(c); const ld = new THREE.Mesh(new THREE.CylinderGeometry(.063, .063, .02, 20).translate(0, .165, 0), lidM); glyph.add(ld); }
  scene.add(glyph);
  const herCup = mkCup(1.1); scene.add(herCup);
  // the pastry case: glass box, three trays of pastries, the Cat on top
  { const cg = new THREE.Mesh(new THREE.BoxGeometry(.8, .42, .5).translate(0, .21, 0), new THREE.MeshStandardMaterial({ color: '#d8eef8', roughness: .05, metalness: .1, transparent: true, opacity: .22, depthWrite: false })); cg.position.set(P.case[0], P.top, P.case[1]); scene.add(cg);
    const cl = new THREE.PointLight('#fff0c8', .8, 1.2, 2); cl.position.set(P.case[0], P.top + .35, P.case[1]); scene.add(cl);
    for (const [y, kind] of [[.03, 0], [.18, 1], [.32, 2]]) for (let k = 0; k < 5; k++) { const col = ['#d8962c', '#7a4a2a', '#e8c070'][kind];
      const pm = kind === 1 ? new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .06, 8), std(col, { r: .8 })) : new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), std(col, { r: .7 })); if (kind === 0) pm.scale.set(1.5, .7, .8);
      pm.position.set(P.case[0] - .3 + k * .15, P.top + y + .04, P.case[1] + (k % 2) * .08); scene.add(pm); } }
  // a tip jar, napkins, a little tree, the bell on the counter, sugar
  { const jar = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .18, 12, 1, true).translate(0, .09, 0), new THREE.MeshStandardMaterial({ color: '#d8eef8', transparent: true, opacity: .35, roughness: .05 })); jar.position.set(-.35, P.top + .03, -.66); scene.add(jar);
    for (let k = 0; k < 5; k++) { const coin = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .005, 8), brass); coin.position.set(-.38 + (k % 3) * .03, P.top + .04 + k * .006, -.68); scene.add(coin); }
    const tag = quad(.16, .07, basic(pixText([{ t: 'TIPS', s: 7, b: 1, c: '#1a1016', y: .55 }], { w: 24, h: 10, bg: '#ffe070' }))); tag.position.set(-.35, P.top + .14, -.58); scene.add(tag);
    const nap = box(.14, .1, .12, std('#f4f0e6')); nap.position.set(-2.2, P.top + .03, -.68); scene.add(nap);
    const tree = new THREE.Mesh(new THREE.ConeGeometry(.12, .34, 8).translate(0, .17, 0), std('#1e5a28', { r: .8 })); tree.position.set(-2.95, P.top + .03, -.65); scene.add(tree);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), bulbM[k % 4]); const a = k * 2.3; b.position.set(-2.95 + Math.cos(a) * .07, P.top + .1 + k * .035, -.65 + Math.sin(a) * .07); scene.add(b); }
    for (let k = 0; k < 3; k++) { const sg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .12, 8).translate(0, .06, 0), std(['#f4f0e6', '#c8a070', '#f0c84a'][k])); sg.position.set(-.05 + k * .07, P.top + .03, -.62); scene.add(sg); } }
  // pendant lamps over the counter
  for (const x of [-2.4, -.9, .6, 2.0]) { const cord = box(.01, 3.6, .01, std('#1a1a20'), { cast: false }); cord.position.set(x, 2.55, -.9); scene.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(.2, .22, 12, 1, true), std('#1e3a2c', { r: .5, m: .3 })); shade.material.side = THREE.DoubleSide; shade.position.set(x, 2.55, -.9); scene.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), std('#fff2c0', { e: '#ffc870', ei: 3 })); bulb.position.set(x, 2.45, -.9); scene.add(bulb); const gl = glow('#ffc070', .9, .35); gl.position.set(x, 2.42, -.9); scene.add(gl); }

  // —— seating on the left: tables, chairs, a sofa, a bookcase, plants, a coat rack ——
  const tables = [], tableTopM = std('#3a2a20', { r: .5 }), legM = std('#1a1a20', { m: .6, r: .4 });
  for (const [x, z] of [[-5.8, -.6], [-5.8, 1.4], [-7.9, -2.8], [-3.9, 2.4], [-8.2, 1.0]]) { const g = new THREE.Group(); const tp = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .05, 18), tableTopM); tp.position.y = .74; tp.castShadow = true; g.add(tp); const lg = box(.06, .72, .06, legM); g.add(lg); const ft = box(.4, .03, .4, legM); g.add(ft);
    const mg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .1, 10).translate(0, .05, 0), std(mugCols[tables.length % 6], { r: .4 })); mg.position.set(.18, .77, .1); g.add(mg);
    g.position.set(x, 0, z); scene.add(g); tables.push({ g, x, z });
    for (const s of [-1, 1]) { const ch = new THREE.Group(); const seat = box(.38, .04, .38, std('#6a3a24', { r: .6 })); seat.position.y = .45; ch.add(seat); const bk = box(.38, .45, .04, std('#6a3a24', { r: .6 })); bk.position.set(0, .45, -.18); ch.add(bk); for (const dx of [-.16, .16]) for (const dz of [-.16, .16]) { const l = box(.03, .45, .03, legM); l.position.set(dx, 0, dz); ch.add(l); }
      ch.position.set(x + s * .62, 0, z - .1); ch.rotation.y = s * Math.PI / 2; scene.add(ch); tables.push({ g: ch, x: x + s * .62, z: z - .1, chair: 1 }); } }
  { const sofa = new THREE.Group(), sm = std('#2c5a6a', { r: .9 }); const sb = box(2.0, .45, .8, sm); sofa.add(sb); const sk = box(2.0, .5, .2, sm); sk.position.set(0, .45, -.32); sofa.add(sk); for (const s of [-1, 1]) { const ar = box(.2, .6, .8, sm); ar.position.set(s * .95, 0, 0); sofa.add(ar); } for (let k = 0; k < 3; k++) { const cu = box(.4, .3, .12, std(['#f0c84a', '#d8604a', '#f4f0e6'][k], { r: 1 })); cu.position.set(-.6 + k * .6, .45, -.18); cu.rotation.z = (k - 1) * .2; sofa.add(cu); }
    sofa.position.set(-8.3, 0, -1.0); sofa.rotation.y = Math.PI / 2; scene.add(sofa); tables.push({ g: sofa, x: -8.3, z: -1.0, chair: 1 }); }
  { const bc = box(2.0, 2.6, .4, std('#4a2e1c', { r: .7 })); bc.position.set(-7.6, 0, -3.8); scene.add(bc);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 14; k++) { const h = .22 + h2(row, k, 3) * .12, bk = box(.1, h, .26, std(['#8a2a1a', '#2c5aa0', '#c8961c', '#3a8a5a', '#f4f0e6', '#6e44a0'][(row * 5 + k) % 6], { r: .8 })); bk.position.set(-8.5 + k * .13, .15 + row * .62, -3.62); scene.add(bk); } }
  const plantT = texOf(plantTex()), potM = std('#c8b8a0', { r: .8 }), faced = [];
  for (const [x, z, s] of [[-9.0, 2.4, 1.3], [-4.6, -3.4, 1.1], [2.6, -3.5, 1.2], [7.0, -3.2, 1.4], [-3.4, -.2, .9], [7.1, 2.4, 1.2]]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.24 * s, .2 * s, .45 * s, 10).translate(0, .22 * s, 0), potM); pot.position.set(x, 0, z); scene.add(pot);
    const lv = billboard(plantT, .9 * s, 1.15 * s, {}); lv.position.set(x, .38 * s, z); scene.add(lv); faced.push(lv); }
  { const rack = box(.05, 1.8, .05, legM); rack.position.set(2.5, 0, -3.3); scene.add(rack); for (const [c, a] of [['#c42a2a', 0], ['#2c5aa0', 2.1], ['#f0c84a', 4.2]]) { const coat = new THREE.Mesh(new THREE.CylinderGeometry(.08, .2, .8, 8), std(c, { r: .9 })); coat.position.set(2.5 + Math.cos(a) * .15, 1.3, -3.3 + Math.sin(a) * .15); scene.add(coat); } }
  { const stand = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .55, 10).translate(0, .27, 0), std('#2a2a30', { m: .5 })); stand.position.set(6.6, 0, -3.5); scene.add(stand); for (let k = 0; k < 3; k++) { const u = box(.03, .9, .03, std(['#c42a2a', '#1a1a20', '#2c5aa0'][k])); u.position.set(6.55 + k * .05, .2, -3.5); u.rotation.z = (k - 1) * .15; scene.add(u); } }
  { const sticker = quad(.9, .35, basic(pixText([{ t: 'PLEASE WAIT HERE', s: 6, b: 1, c: '#1a1016', y: .55 }], { w: 64, h: 16, bg: '#ffd23a' }))); sticker.rotation.x = -Math.PI / 2; sticker.position.set(1.5, .015, .55); scene.add(sticker); }
  for (let k = 0; k < 4; k++) { const st = new THREE.Group(); const p0 = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .9, 8).translate(0, .45, 0), brass); st.add(p0); const bs = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .03, 12), brass); st.add(bs); st.position.set(2.0 + k * 1.2, 0, 1.25); scene.add(st); if (k < 3) { const rope = box(1.2, .04, .04, std('#8a1420')); rope.position.set(2.6 + k * 1.2, .8, 1.25); scene.add(rope); } }
  { const bench = box(2.6, .45, .45, darkWood); bench.position.set(4.8, 0, -3.65); scene.add(bench); }

  // —— the foam: a rising bubbly surface over the floor, a front skirt, the tongue out of the door; the geyser; spray, bubbles ——
  const FW = 17.6, FD = 7.4, foamG = new THREE.PlaneGeometry(FW, FD, 70, 30); foamG.rotateX(-Math.PI / 2); foamG.translate(-1, 0, -.4);
  const fbase = Float32Array.from(foamG.attributes.position.array);
  const foamT = foamTex(64, 64, 4); foamT.repeat.set(9, 4);
  const foamM = new THREE.MeshStandardMaterial({ map: foamT, roughness: .7, emissive: '#3a3226', emissiveIntensity: .1 });
  const foamS = new THREE.Mesh(foamG, foamM); foamS.receiveShadow = true; scene.add(foamS);
  const skirtT = foamTex(64, 16, 9); skirtT.repeat.set(9, 1);
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(FW, 1), new THREE.MeshStandardMaterial({ map: skirtT, roughness: .8, emissive: '#3a3226', emissiveIntensity: .1 })); skirt.position.set(-1, .5, 3.2); scene.add(skirt);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 5).translate(0, -.5, -2.5), new THREE.MeshStandardMaterial({ map: foamTex(64, 64, 6), roughness: .7, emissive: '#3a3226', emissiveIntensity: .1 })); tongue.position.set(5.5, 0, -4.1); scene.add(tongue);
  const softWhite = { blend: THREE.NormalBlending, soft: 1 };
  const W0 = new THREE.Vector3();
  const geyserP = particles(260, (i, t, o) => { const g = geyser(t); if (g <= 0) { o.a = 0; return; }
    mach.localToWorld(W0.set(.66, .12, .25)); const u = ((t * (1.4 + h2(i, 5, 2) * .6) + h2(i, 1, 2)) % 1), H = 3.2 * g, a = h2(i, 2, 2) * 6.28, spread = .04 + u * u * u * 1.1 * g;
    o.x = W0.x + Math.cos(a) * spread + Math.sin(t * 9 + i) * .03; o.z = W0.z + Math.sin(a) * spread * .7; o.y = W0.y + u * H; o.s = (.1 + u * .22) * (.6 + g * .4); o.r = 1; o.g = .98; o.b = .94; o.a = .95 * Math.min(1, (1 - u) * 4); }, softWhite);
  scene.add(geyserP);
  const colT = foamTex(32, 64, 11); colT.repeat.set(2, 3);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(.32, .07, 1, 14, 8, true).translate(0, .5, 0), new THREE.MeshStandardMaterial({ map: colT, roughness: .6, emissive: '#fff4e8', emissiveIntensity: .35, side: THREE.DoubleSide }));
  const colBase = Float32Array.from(column.geometry.attributes.position.array); scene.add(column);
  const cloud = particles(90, (i, t, o) => { const g = geyser(t); if (g < .3) { o.a = 0; return; } const a = h2(i, 1, 4) * 6.28, r = (.2 + h2(i, 2, 4) * 1.6) * g; o.x = P.mach[0] + .66 + Math.cos(a) * r + Math.sin(t + i) * .1; o.z = P.mach[1] + Math.sin(a) * r * .5; o.y = 3.3 + .2 * Math.sin(t * 2 + i) + h2(i, 3, 4) * .3; o.s = .45; o.r = 1; o.g = .97; o.b = .93; o.a = .9 * g; }, softWhite);
  scene.add(cloud);
  const spray = particles(160, (i, t, o) => { const g = geyser(t); if (g <= 0) { o.a = 0; return; } const ph = ((t * 1.2 + h2(i, 1, 6)) % 1), a = h2(i, 2, 6) * 6.28, sp = 1.2 + h2(i, 3, 6) * 2.2, top = 1.4 + h2(i, 4, 6) * 1.8 * g;
    o.x = P.mach[0] + .66 + Math.cos(a) * sp * ph; o.z = P.mach[1] + .2 + Math.sin(a) * sp * ph * .25; o.y = Math.max(foam(t) + .02, top + 2.5 * ph - 6 * ph * ph); o.s = .06 + h2(i, 5, 6) * .07; o.r = 1; o.g = .98; o.b = .95; o.a = .95; }, softWhite);
  scene.add(spray);
  const bubbles = particles(140, (i, t, o) => { const L = foam(t); if (L < .05) { o.a = 0; return; } const ph = (t * .8 + h2(i, 1, 8)) % 1; o.x = -9.4 + h2(i, 2, 8) * 16.6; o.z = -3.9 + h2(i, 3, 8) * 7; o.y = L + .02 + ph * .25; o.s = .05 + .05 * Math.sin(ph * Math.PI); o.r = .95; o.g = .97; o.b = 1; o.a = (1 - ph) * .9; }, softWhite);
  scene.add(bubbles);
  const steam = particles(70, (i, t, o) => { const ph = (t * .35 + h2(i, 1, 3)) % 1; const src = i % 3; const bx = src === 0 ? P.mach[0] - .32 : src === 1 ? P.mach[0] + .12 : -2.4; o.x = bx + Math.sin(ph * 6 + i) * .1; o.z = (src < 2 ? P.mach[1] + .3 : -3.5); o.y = (src < 2 ? P.top + .3 : 1.4) + ph * 1.2; o.s = .12 + ph * .25; o.r = o.g = o.b = 1; o.a = (1 - ph) * .25; }, softWhite);
  scene.add(steam);
  const beans = particles(40, (i, t, o) => { const u = t - T.twist - h2(i, 1, 7) * .4; if (u < 0 || u > 1.6) { o.a = 0; return; } const a = h2(i, 2, 7) * 6.28, sp = 1 + h2(i, 3, 7) * 2; o.x = -3.0 + Math.cos(a) * sp * u; o.z = -1.0 + Math.abs(Math.sin(a)) * sp * u; o.y = Math.max(.05, 1.6 + 3 * u - 4.9 * u * u); o.s = .05; o.r = .35; o.g = .2; o.b = .1; o.a = 1; }, { blend: THREE.NormalBlending });
  scene.add(beans);
  const wave = particles(200, (i, t, o) => { const u = t - T.burst - h2(i, 1, 5) * .3; if (u < 0 || u > 2.5 || t >= T.hired) { o.a = 0; return; } const sp = 2 + h2(i, 2, 5) * 3; o.x = 5.5 + (h2(i, 3, 5) - .5) * 1.6 + (h2(i, 6, 5) - .5) * u * 2; o.z = -4.0 - sp * u; o.y = Math.max(.05, .9 + 1.6 * u - 3 * u * u); o.s = .18; o.r = 1; o.g = .98; o.b = .94; o.a = 1; }, softWhite);
  scene.add(wave);

  // —— characters ——
  const hero = makeChar('hero'), cust = makeChar('cust'), boss = makeChar('boss'), cat = makeChar('cat', 1, 1.15), reg = makeChar('shop');
  for (const c of [hero, cust, boss, cat, reg]) scene.add(c.root);
  const queue = QUEUE.map(q => { const c = makeChar('shop'); scene.add(c.root); return { ...q, c }; });
  const sitters = SITTERS.map(([x, z, v, flip]) => { const c = makeChar('shop'); scene.add(c.root); return { x, z, v, flip, c }; });
  const walkers = [0, 1, 2, 3, 4].map(k => { const c = makeChar('shop'); scene.add(c.root); return { c, v: (k * 3 + 1) % 8, x0: k * 2.1, sp: k % 2 ? .7 : -.6, z: -5.2 - (k % 2) * .8 }; });
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .03, 16), std('#c8a050', { m: .7, r: .3 })); scene.add(tray);

  const place = (c, x, y, z) => c.root.position.set(x, y, z);
  const L3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  function camAt(t, shot) {
    const id = shot.id;
    if (id === 'close' || id === 'closeEnd') { const u = id === 'close' ? eo(seg(t, 0, T.rew)) : 1 - eo(seg(t, T.k2, DUR)); return { p: L3([-.35, 1.35, 2.9], [-.33, 1.38, 3.15], u), l: L3([-.4, 1.5, -1.0], [-.4, 1.52, -1.0], u) }; }
    if (id === 'wide') { const u = ss(seg(t, T.wide, T.reg)); return { p: L3([-.4, 4.6, 12.0], [-.2, 4.2, 11.0], u), l: L3([-.6, 1.6, -1.6], [-.5, 1.5, -1.5], u) }; }
    if (id === 'reg') { const u = ss(seg(t, T.reg, T.cup)); return { p: L3([-.45, 1.8, 2.9], [-.35, 1.75, 2.6], u), l: L3([-.2, 1.45, -.9], [-.2, 1.42, -.9], u) }; }
    if (id === 'cup') { const u = ss(seg(t, T.cup, T.read)); return { p: L3([.4, 1.3, -.16], [.39, 1.28, -.22], u), l: [.3, 1.14, -.72] }; }
    if (id === 'read') { const u = ss(seg(t, T.read, T.rush)); return { p: L3([.25, 1.8, 1.6], [.15, 1.75, 1.35], u), l: L3([-.5, 1.6, -1.4], [-.5, 1.62, -1.4], u) }; }
    if (id === 'rush') { const u = ss(seg(t, T.rush, T.cust)); return { p: [lerp(-.4, .6, u), 2.1, 3.7], l: [lerp(-.4, .4, u), 1.2, -1.0] }; }
    if (id === 'order') { const u = ss(seg(t, T.cust, T.tk)); return { p: L3([-1.0, 1.9, 3.4], [-.9, 1.85, 3.1], u), l: L3([-.35, 1.35, -.7], [-.35, 1.35, -.7], u) }; }
    if (id === 'ticket') { const u = ss(seg(t, T.tk, T.knob)); return { p: L3([1.5, 1.45, 3.0], [1.9, 1.7, 3.4], u), l: L3([1.2, .6, -.6], [1.9, .4, -1.0], u) }; }
    if (id === 'knob') { const u = ss(seg(t, T.knob, T.shake)); return { p: L3([-2.2, 1.55, .9], [-2.05, 1.5, .7], u), l: [-.95, 1.45, -1.0] }; }
    if (id === 'shake') { const u = ss(seg(t, T.shake, T.twist)); return { p: L3([-.6, 1.9, 2.8], [-.8, 1.8, 2.2], u), l: [-1.3, 1.45, -1.0] }; }
    if (id === 'catch') return { p: [.9, 2.7, 2.6], l: [-.8, 1.55, -1.2] };
    if (id === 'flood') { const u = ss(seg(t, T.flood, T.sip)); return { p: L3([.2, 2.6, 7.0], [-.3, 4.0, 9.6], u), l: L3([-.7, 1.3, -1.4], [-.6, 1.6, -1.4], u) }; }
    if (id === 'sip') return { p: [.9, 1.8, 2.4], l: [-.1, 1.4, -.5] };
    if (id === 'burst') return { p: [2.6, 2.9, 2.4], l: [5.3, 1.1, -4.0] };
    if (id === 'boss') { const u = ss(seg(t, T.bossShot, T.fired)); return { p: L3([3.5, 1.85, -.2], [3.7, 1.8, -.6], u), l: [5.4, 1.3, -4.6] }; }
    const u = ss(seg(t, T.hired, T.k2)); return { p: L3([2.6, 2.6, 7.2], [2.2, 2.4, 6.4], u), l: L3([2.6, 1.5, -2.4], [2.4, 1.5, -2.4], u) };
  }

  function update(t, shot, camera, shake) {
    const { p, l } = camAt(t, shot);
    const jx = (Math.sin(t * 61) + Math.sin(t * 37.3)) * .5 * shake * .06, jy = (Math.sin(t * 53.1) + Math.cos(t * 29.7)) * .5 * shake * .06;
    camera.position.set(p[0] + jx, p[1] + jy, p[2]); camera.lookAt(l[0] + jx * .5, l[1] + jy * .5, l[2]); camera.fov = shot.id === 'cup' ? 34 : 40; camera.updateProjectionMatrix();
    const cam = camera, id = shot.id, hook = id === 'close' || id === 'closeEnd', F = foam(t), G = geyser(t);
    const err = G > 0 || (t >= T.max && t < T.hired), q = t >= T.knob && t < T.max;
    // lights
    warmKey.intensity = hook ? 4 : id === 'catch' ? 1.5 : id === 'sip' ? 1.0 : 0;
    doorL.intensity = t >= T.burst && t < T.k2 ? 3 : 0;
    errL.intensity = err ? (pick(t, 4) ? 3 : 1.2) : 0;
    bulbs.forEach((b, i) => { b.visible = ((Math.floor(t * 2 + i * .37) % 7) !== 0); });
    for (const pz of [snowfall, geyserP, cloud, spray, bubbles, steam, beans, wave]) pz.userData.update(t);
    faced.forEach(f => { f.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z); });
    // the geyser column: a wobbling cone of foam from the wand tip to the ceiling
    { column.visible = G > 0; if (G > 0) { mach.localToWorld(W0.set(.66, .12, .25)); column.position.copy(W0); column.scale.set(.6 + .4 * G, 3.3 * G, .6 + .4 * G);
      const pa = column.geometry.attributes.position.array; for (let i = 0; i < pa.length; i += 3) { const y = colBase[i + 1], k = 1 + .18 * Math.sin(y * 9 - t * 14 + Math.atan2(colBase[i + 2], colBase[i]) * 3); pa[i] = colBase[i] * k + Math.sin(y * 4 + t * 6) * .04 * y; pa[i + 2] = colBase[i + 2] * k; } column.geometry.attributes.position.needsUpdate = true; colT.offset.y = -t * 1.6; } }
    // the machine: shakes from MAX to the twist, the needle, the display, the knob
    const mshake = t >= T.max && t < T.sip ? (t < T.twist ? .006 + .012 * seg(t, T.max, T.twist) : .02) : G > 0 ? .015 : 0;
    mach.position.set(P.mach[0] + Math.sin(t * 71) * mshake, P.top + Math.abs(Math.sin(t * 53)) * mshake, P.mach[1]);
    const pr = pressure(t); needle.rotation.z = -(-2.2 + 4.4 * pr) + Math.sin(t * 40) * (pr > .9 ? .08 : 0);
    disp.material = err ? (pick(t, 3) ? dispErr : dispQ) : q ? dispQ : dispReady;
    knob.rotation.z = t < T.knob ? 0 : t < T.hired ? -2.6 * eo(seg(t, T.knob + .3, T.max)) : 0;
    menu.material = t >= T.hired && t < T.k2 ? menuFloodM : menuM;
    // the ticket: printed from T.ticket, unrolls over the counter and floor to the door
    const rib = t < T.ticket ? 0 : t < T.hired ? Math.min(1, ss(seg(t, T.ticket, T.knob)) * .97 + .03) : 0;
    ribbon.geometry.setDrawRange(0, Math.floor(rib * RIB) * 6); ribbon.visible = rib > 0;
    // the door: bursts open at T.burst
    door.rotation.y = t >= T.burst && t < T.hired ? 1.6 * eo(seg(t, T.burst, T.burst + .2)) : t >= T.hired && t < T.k2 ? 1.2 : 0;
    // the foam
    { const pos = foamG.attributes.position.array; for (let i = 0; i < pos.length; i += 3) { const x = fbase[i], z = fbase[i + 2]; pos[i + 1] = F + (F > 0 ? .05 * Math.sin(x * 1.7 + t * 2.2) * Math.cos(z * 1.3 - t * 1.7) + .03 * Math.sin(x * 4.1 - t * 3) : 0); } foamG.attributes.position.needsUpdate = true; foamG.computeVertexNormals(); }
    foamS.visible = skirt.visible = F > .005; skirt.scale.y = Math.max(.01, F); skirt.position.y = F / 2;
    foamT.offset.set(t * .02, t * .01);
    const tg = t >= T.burst && t < T.k2 ? (t < T.hired ? eo(seg(t, T.burst, T.burst + .8)) : .5) : 0; tongue.visible = tg > 0; tongue.scale.set(1, Math.max(.01, .6 * tg), tg || .01);
    // floating furniture
    tables.forEach((tb, k) => { const lift = Math.max(0, F - (tb.chair ? .35 : .55)); tb.g.position.y = lift > 0 ? lift + .04 * Math.sin(t * 2 + k) : 0; tb.g.rotation.z = lift > 0 ? .06 * Math.sin(t * 1.6 + k) : 0; });
    // the cups: the rush row slides down the counter, then the cups float
    rushCups.forEach((c, k) => { const a = T.rush + k * .5; let x = -1.0, vis = false, y = P.top + .03, z = -.7;
      if (t >= a && t < T.hired) { vis = true; const u = seg(t, a, a + .35); x = lerp(-.6, 2.2 - (k % 5) * .1, eo(u)); z = -.68 + (k % 2) * .06; if (t > a + 1.3 && t < T.flood) vis = k >= 7; }
      if (F > P.top) { y = F + .02; x += Math.sin(t * .7 + k) * .3; }
      c.visible = vis; c.position.set(x, y, z); c.rotation.z = t >= a && t < a + .35 ? -.15 : 0; });
    glyph.visible = t >= T.write && t < T.rush; glyph.position.set(.3, P.top + .03, -.72);
    { const vis = (t >= T.serve + .2 && t < T.hired) || (t >= T.hired && t < T.k2); herCup.visible = vis; const at = t < T.sip ? [lerp(-.4, .05, ss(seg(t, T.serve + .2, T.serve + 1.0))), Math.max(P.top + .05, F + .1), -.55] : [.05, P.top + .05, -.6]; herCup.position.set(...at); herCup.visible = vis && t < T.sip; }
    // —— YOU ——
    { let f = 'stand', x = P.hero[0], y = 0, z = P.hero[1], flip = false, sq = 0;
      const atWand = () => { x = -.62; z = -1.42; flip = true; f = pick(t, 9) ? 'wand' : 'wand1'; y = .03 + .05 * Math.abs(Math.sin(t * 18)); sq = .05 * Math.sin(t * 30); };
      if (t < T.wide || t >= T.k2) atWand();
      else if (t < T.reg) f = t < 2.1 ? 'stare' : (Math.floor(t * 8) % 19 === 0 ? 'blink' : 'smile');
      else if (t < T.cup) { f = t < T.write ? (says(t, 'r1') ? 'smile' : 'talkS') : pick(t, 5) ? 'write0' : 'write1'; if (t < T.write) f = 'smile'; }
      else if (t < T.rush) { f = says(t, 'y1') ? 'readTalk' : t > 7.0 ? 'readQ' : 'read'; sq = t < T.read + .15 ? .1 * Math.sin((t - T.read) * 30) : 0; }
      else if (t < T.cust) { const k = Math.floor((t - T.rush) / .5) % 3, u = ((t - T.rush) % .5) / .5; x = [-1.0, -.3, .3][k]; f = ['lever', 'pour', says(t, 'y2') ? 'slide' : 'slideQ'][k]; sq = u < .2 ? -.15 * (1 - u * 5) : 0; flip = k === 0; }
      else if (t < T.knob) f = t < T.ticket ? 'smile' : t < 13.5 ? 'stare' : pick(t, 2) ? 'sweat' : 'worry';
      else if (t < T.twist) { x = -.55; z = -1.5; flip = true; f = t < T.shake ? (t < T.max + .2 ? 'knob' : 'knobS') : t < 18.3 ? 'worry' : 'shock'; sq = t >= T.max && t < T.max + .3 ? .12 * Math.sin((t - T.max) * 30) : 0; }
      else if (t < T.flood) atWand();
      else if (t < T.sip) { x = lerp(-.62, -.3, seg(t, T.flood, T.serve)); z = -1.4; y = F * .45 + .04 * Math.sin(t * 3); flip = false; f = t < T.serve ? (pick(t, 5) ? 'swim' : 'swim1') : says(t, 'y4') ? 'offerFoam' : 'offerFoamQ'; }
      else if (t < T.hired) { x = -.3; z = -1.4; y = F * .45; f = t < T.burst ? 'offerFoamQ' : 'sadFoam'; }
      else { x = .1; z = -1.45; f = pick(t, 2) ? 'offerFoamQ' : 'offerFoam'; f = 'offerFoamQ'; }
      place(hero, x, y, z); hero.frame(f); hero.squash(sq); hero.face(cam, flip); }
    // —— THE CUSTOMER ——
    { let f = 'tap', x = .15, y = 0, z = -.2, vis = false, flip = true, sq = 0;
      if (t < T.wide || t >= T.k2) { vis = true; f = says(t, t < T.wide ? 'c0' : 'c4') ? 'tapTalk' : 'tap'; }
      else if (t >= 9.7 && t < T.hired) { vis = true; x = .15; z = .2;
        if (t < T.cust + .3) { const u = seg(t, 9.7, T.cust + .3); x = lerp(4.4, .15, u); z = lerp(1.0, .2, u); f = `w${walkStep(t, true)}`; f = 'w' + walkStep(t, true); }
        else if (t < T.knob) f = says(t, 'c1') || says(t, 'c2') ? 'tapTalk' : 'tap';
        else if (t < T.twist) f = 'cross';
        else if (t < T.flood) f = pick(t, 4) ? 'tapTalk' : 'tap';
        else if (t < T.sip) f = t < T.serve + .8 ? 'cross' : 'tap';
        else if (t < T.too) f = 'sip';
        else f = says(t, 'c3') ? 'moustTalk' : 'moust';
        if (t >= T.sip && t < T.sip + .25) sq = .1 * Math.sin((t - T.sip) * 25); }
      else if (t >= T.hired && t < T.k2) { vis = true; x = 1.0; z = .35; f = 'moust'; }
      cust.root.visible = vis; if (vis) { cust.frame(f === 'w0' || f === 'w1' || f === 'w2' || f === 'w3' ? f : f); place(cust, x, y, z); cust.squash(sq); cust.face(cam, flip); }
      if (vis && F > 0) cust.root.position.y = 0; }
    // —— THE MANAGER: arrives at the door as it bursts ——
    { const vis = t >= T.burst && t < T.k2; boss.root.visible = vis;
      if (vis) { let x = 5.45, z = -4.6, f = 'foam', flip = true;
        if (t < T.boss) { const u = seg(t, T.burst, T.boss); x = lerp(6.8, 5.45, u); z = -4.7; f = `w${walkStep(t, true)}`; }
        else if (t < T.hired) f = says(t, 'm1') ? 'foamTalk' : t > 26.6 ? 'foamNod' : 'foam';
        else { x = 1.9; z = .9; f = says(t, 'm2') ? 'foamNodTalk' : 'foamNod'; }
        place(boss, x, 0, z); boss.frame(f); boss.face(cam, flip); } }
    // —— THE REGULAR (Siobhan) ——
    { const vis = t >= T.wide && t < T.rush + .8; reg.root.visible = vis;
      if (vis) { let x = .35, z = .2, f = '6s'; if (t < T.reg) { const u = seg(t, T.wide, T.reg); x = lerp(1.9, .35, ss(u)); z = lerp(.6, .2, u); f = u < 1 ? `6w${walkStep(t, false)}` : '6s'; }
        else if (t < T.read) f = says(t, 'r1') ? '6l' : '6s'; else if (t < T.rush) f = t > 7.2 ? '6l' : '6s'; else { const u = seg(t, T.rush, T.rush + .8); x = lerp(.35, -1.6, u); z = .95; f = `6w${walkStep(t, true)}`; }
        place(reg, x, 0, z); reg.frame(f); reg.face(cam, t >= T.rush ? true : true); } }
    // —— the queue: advances during the rush (the served ones walk off to the left), arms up in the flood, foam moustaches at the end ——
    const prog = t < T.rush ? 0 : t < T.cust ? 4 * seg(t, T.rush, T.cust - .4) : 4;
    queue.forEach((qq, k) => { let s = qq.i + 1 - (t >= T.hired ? 0 : prog), x, z, f, flip = true, vis = true;
      if (s >= 1) { x = 2.5 + (s - 1) * .58; z = .55 + (qq.i % 2) * .22; f = t < T.flood ? (pick(t + k * .3, .5) ? `${qq.v}p` : `${qq.v}s`) : t < T.hired ? `${qq.v}up` : `${qq.v}m`; if (s % 1 > .05 && t < T.hired) f = `${qq.v}w${walkStep(t + k, false)}`; }
      else { x = 2.5 - (1 - s) * 4.0; z = .95 + (qq.i % 2) * .1; f = `${qq.v}w${walkStep(t + k, true)}`; vis = x > -6.5; if (s <= 0) f = `${qq.v}w${walkStep(t + k, false)}`; }
      if (t >= T.hired) { f = `${qq.v}m`; flip = true; }
      qq.c.root.visible = vis; place(qq.c, x, 0, z); qq.c.frame(f.replace('cw', 'w')); qq.c.face(cam, flip); });
    sitters.forEach((st, k) => { const f = t >= T.hired && t < T.k2 ? `${st.v}m` : F > .3 ? `${st.v}lapUp` : pick(t + k * .7, .25) ? `${st.v}lap` : `${st.v}lapB`; place(st.c, st.x, Math.max(0, F - .5) * .8, st.z + .35); st.c.frame(f); st.c.face(cam, st.flip); });
    // passers-by in the street; at the end they queue outside the door
    walkers.forEach((w, k) => { let x, z = w.z, f, flip = w.sp < 0;
      if (t >= T.hired && t < T.k2) { x = 6.2 + k * .65; z = -5.0 - (k % 2) * .25; f = `${w.v}c`; flip = true; }
      else { x = 1.0 + (((w.x0 + w.sp * t) % 8.5) + 8.5) % 8.5; f = `${w.v}w${walkStep(t + k, false)}`; }
      place(w.c, x, 0, z); w.c.frame(f); w.c.face(cam, flip); });
    // —— the Cat: asleep on the pastry case; surfs a tray in the flood ——
    { let x = P.case[0], y = P.top + .43, z = P.case[1], f = 'sleep', flip = false;
      if (t >= T.rush && t < T.flood) f = t < T.knob ? 'look' : 'tail';
      if (G > 0 && t < T.flood) f = 'look';
      if (t >= T.flood + .6 && t < T.hired) { const u = seg(t, T.flood + .6, T.sip + 1.2); x = lerp(1.6, -4.8, u); z = .6 + Math.sin(u * 6) * .3; y = F + .06 + .05 * Math.sin(t * 4); f = 'sit'; flip = true; tray.visible = true; tray.position.set(x, F + .03 + .05 * Math.sin(t * 4), z); tray.rotation.z = .1 * Math.sin(t * 3); }
      else tray.visible = false;
      place(cat, x, y, z); cat.frame(f); cat.face(cam, flip); }

    // —— focus subject and HUD anchors ——
    let subj;
    if (hook || id === 'catch') subj = v3(-.7, 1.6, -1.3);
    else if (id === 'wide' || id === 'flood') subj = v3(-.6, 1.2, -1.0);
    else if (id === 'cup') subj = v3(.3, 1.14, -.72);
    else if (id === 'rush') subj = v3(lerp(-1.1, 1.2, ss(seg(t, T.rush, T.cust))), 1.2, -.8);
    else if (id === 'ticket') subj = v3(lerp(1.2, 3.4, ss(seg(t, T.tk, T.knob))), .6, lerp(-.6, -1.6, ss(seg(t, T.tk, T.knob))));
    else if (id === 'knob' || id === 'shake') subj = v3(-1.4, 1.4, -.8);
    else if (id === 'sip') subj = v3(.15, 1.45, .2);
    else if (id === 'burst' || id === 'boss') subj = v3(5.45, 1.3, -4.4);
    else if (id === 'hired') subj = v3(2.0, 1.3, .4);
    else subj = v3(0, 1.4, -.6);
    const proj = (x, y, z) => { const v = v3(x, y, z).project(camera); return [(v.x * .5 + .5) * 1080, (.5 - v.y * .5) * 1920]; };
    const hp = hero.root.position; HUD.you = proj(hp.x, hp.y + 1.9, hp.z);
    HUD.cust = proj(cust.root.position.x, cust.root.position.y + 1.8, cust.root.position.z);
    HUD.reg = proj(reg.root.position.x, 1.95, reg.root.position.z);
    HUD.boss = proj(boss.root.position.x, 2.35, boss.root.position.z);
    HUD.cat = proj(cat.root.position.x, cat.root.position.y + .6, cat.root.position.z);
    HUD.printer = proj(P.printer[0], P.top + .3, P.printer[1]);
    HUD.mach = proj(P.mach[0], P.top + 1.0, P.mach[1]);
    HUD.queue = proj(2.6, 1.9, .6);
    HUD.cup = proj(.3, 1.3, -.72);
    return subj;
  }
  return { scene, update };
}
