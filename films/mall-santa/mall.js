// The set: a two-floor shopping-mall atrium in December, open at the front (a diorama). Ground floor y 0, x[-22,14] z[-6.5,5];
// shop fronts on both floors at z −6.5 (the upper walkway at y 3.6 with a rail at z −4.2), an escalator on the right, the giant
// tree on the left at x −14, Santa's grotto in the middle (platform y .3, x[−3.4,3.4] z[−3.2,.2]) with a sleigh and an animatronic
// reindeer facing left, the queue of kids on the right. Warm shop windows, a cool skylight, fairy lights; dense on purpose.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, glow, billboard } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles } from './fx.js';
import { makeChar, SPX } from './chars.js';
import { T, P, DUR, VO, KIDS, PARENTS, sleighX, sleighOn, walkStep, photos } from './story.js';
import { HUD } from './ui.js';
import { clamp, seg, ss, lerp, mulberry, eo } from '/core/lib.js';
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pick = (t, hz, k = 0) => (Math.floor(t * hz + k) % 2) === 0;
const vo = id => VO.find(v => v.id === id);
const talking = (id, d) => t => { const v = vo(id); return t >= v.t && t < v.t + d; };

// —— pixel text: a pixel font drawn small, alpha thresholded to hard pixels ——
function pixText(lines, o = {}) {
  const w = o.w ?? 96, h = o.h ?? 24, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = o.bg ?? '#ffffff'; g.fillRect(0, 0, w, h);
  if (o.border) { g.fillStyle = o.border; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); }
  const lay = document.createElement('canvas'); lay.width = w; lay.height = h; const L = lay.getContext('2d');
  L.textAlign = 'center'; L.textBaseline = 'middle';
  for (const ln of lines) { L.font = `${ln.b ? 700 : 400} ${ln.s}px Silkscreen`; L.fillStyle = ln.c; L.fillText(ln.t, (ln.x ?? .5) * w, ln.y * h); }
  const d = L.getImageData(0, 0, w, h), D = d.data;
  for (let i = 0; i < D.length; i += 4) D[i + 3] = D[i + 3] > 110 ? 255 : 0;
  L.putImageData(d, 0, 0); g.drawImage(lay, 0, 0);
  return c;
}
const tex = (c, o) => texOf(c, o);
function basic(c, o = {}) { const m = new THREE.MeshStandardMaterial({ map: tex(c), roughness: o.rough ?? .8, metalness: 0 }); if (o.em) { m.emissiveMap = m.map; m.emissive = new THREE.Color('#ffffff'); m.emissiveIntensity = o.em; } return m; }
function quad(w, h, m) { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.receiveShadow = true; return q; }
function cardboard(w, h, s, tape = true, col) {
  const p = new PX(w, h), R = ramp(col ?? ['#6a4620', '#8e6430', '#b08446', '#c8a060'], .4);
  p.fill((x, y) => { if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return R(.15, x, y); if (tape && Math.abs(x - w / 2) < 1.5) return [214, 196, 150]; let v = .55 + (h2(x, y, s) - .5) * .2 + (y % 3 === 0 ? -.05 : 0); if (h2(x >> 1, y >> 1, s + 3) > .985) v = .2; return R(v, x, y); });
  if (h2(s, 1, 5) > .5) { p.rect(3, 3, 5, 3, [250, 248, 240]); p.rect(4, 4, 3, 1, [40, 40, 50]); }
  return p.done();
}
function wireMesh(w, h) { const p = new PX(w, h), R = ramp(['#4a4e58', '#7a808c', '#aab0ba'], .5); p.fill((x, y) => (x % 6 === 0 || y % 6 === 0) ? R(x % 6 === 0 ? .7 : .45, x, y) : null); return p.done(); }
function shelfBoxTex(w, h, s) {   // boxes on the shelves: a printed product face
  const p = new PX(w, h), hue = [['#1c3a6a', '#2c5aa0', '#5a8ad0'], ['#6a1a1a', '#a42c2c', '#d85a4a'], ['#1a5a3a', '#2a8a5a', '#5ac08a'], ['#7a5a10', '#c8961c', '#f0c84a'], ['#4a2a6a', '#6e44a0', '#a07ad0'], ['#e8e4da', '#f4f0e6', '#ffffff']][Math.floor(h2(s, 0, 1) * 6)], R = ramp(hue, .4);
  p.fill((x, y) => { if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return R(0, x, y); let v = .55; if (y > h * .6) v = .9; if (Math.abs(x - w / 2) < w * .2 && y > 3 && y < h * .5) v = .1 + h2(s, 4, 2) * .3; return R(v, x, y); });
  return p.done();
}
function tinsel(w, h, col) { const p = new PX(w, h), R = ramp(col, .3); p.fill((x, y) => { const c = Math.abs(y - h / 2 + Math.sin(x * .9) * 1.2); if (c > h / 2 - .5) return null; return R(.3 + h2(x, y, 3) * .7, x, y); }); return p.done(); }

// —— mall textures ——
function marble(w, h) {   // the atrium floor: big cream tiles with a dark red diamond inlay
  const p = new PX(w, h), R = ramp(['#9a8c78', '#b8aa92', '#d2c6ae', '#e6dcc6'], .4), D = ramp(['#4a1418', '#6e2024', '#8e2c2e'], .4);
  p.fill((x, y) => { const tx = x % 32, ty = y % 32; if (tx < 2 || ty < 2) return [86, 70, 58]; const d = Math.abs(tx - 16) + Math.abs(ty - 16); if (d < 5) return D(.5 + (h2(x, y, 3) - .5) * .4, x, y);
    let v = .55 + (fbm(x * .1, y * .1, 4) - .5) * .5; if (Math.sin(x * .3 + y * .1 + fbm(x * .05, y * .05, 2) * 8) > .9) v -= .3; if (h2(x, y, 8) > .985) v += .4; return R(v, x, y); });
  return p.done();
}
function fakeSnow(w, h) { const p = new PX(w, h), R = ramp(['#8a9ab4', '#b8c4d4', '#d8e0ea', '#eef2f8', '#ffffff'], .4); p.fill((x, y) => { if (h2(x, y, 6) > .992) return [[255, 220, 90], [120, 200, 255], [255, 120, 140]][(x + y) % 3]; return R(.55 + (fbm(x * .14, y * .14, 7) - .5) * .9 + (h2(x, y, 2) > .95 ? .35 : 0) - (h2(x, y, 4) > .97 ? .4 : 0), x, y); }); return p.done(); }
function shopWindow(s, kind) {   // a lit window full of goods (emissive)
  const W = 48, H = 32, p = new PX(W, H), R = ramp(['#3a2a20', '#7a5a40', '#d8b080', '#fff0c8'], .4);
  p.fill((x, y) => R(.75 - y / H * .25 + (h2(x >> 2, y >> 2, s) - .5) * .1, x, y));
  const rnd = mulberry(s * 13 + 1), pal = [[216, 40, 52], [44, 92, 160], [240, 200, 60], [70, 160, 90], [160, 80, 190], [236, 120, 40], [240, 240, 236]];
  for (const sy of [10, 21, 31]) { p.rect(0, sy, W, 1, [90, 70, 50]); for (let x = 1; x < W - 3;) { const w = 2 + (rnd() * 5 | 0), h = 3 + (rnd() * 6 | 0), c = pal[rnd() * pal.length | 0];
    if (kind === 'shoe') { p.rect(x, sy - 2, w + 1, 2, c); p.rect(x, sy - 4, 2, 2, c); } else if (kind === 'book') { p.rect(x, sy - h, w > 3 ? 2 : w, h, c); }
    else if (kind === 'cafe') { p.rect(x, sy - 3, 3, 3, [240, 236, 226]); p.set(x + 3, sy - 2, [240, 236, 226]); p.rect(x + 1, sy - 4, 1, 1, [120, 70, 40]); }
    else if (kind === 'sweet') { p.ellipse(x + 2, sy - 3, 2, 2.5, c); p.rect(x + 2, sy - 1, 1, 1, [250, 250, 250]); }
    else { p.rect(x, sy - h, w, h, c); p.rect(x, sy - h, w, 1, c.map(v => Math.min(255, v + 50))); }
    x += w + 1 + (rnd() * 2 | 0); } }
  return p.done();
}
function gingerTex(w, h) { const p = new PX(w, h), R = ramp(['#5a3010', '#8a5020', '#b07030', '#c88a48'], .4);
  p.fill((x, y) => { if (y % 16 === 0) return [250, 248, 240]; if ((x + (y >> 4) * 8) % 16 === 0 && y % 16 < 3) return [250, 248, 240]; if (h2(x >> 2, y >> 2, 5) > .9) return [[216, 40, 52], [80, 170, 90], [250, 220, 60]][(x + y) % 3]; return R(.55 + (h2(x, y, 3) - .5) * .3, x, y); });
  return p.done(); }
function treeTex(w, h) { const p = new PX(w, h), G = ramp(['#0a2410', '#123a1a', '#1e5a28', '#2e7a36', '#4a9a48'], .35);
  p.fill((x, y) => { const v = .45 + (fbm(x * .2, y * .3, 9) - .5) * .7 + ((y % 6) / 6) * .25; if (h2(x, y, 3) > .965) return [[255, 220, 120], [255, 120, 100], [140, 200, 255]][(x + y) % 3]; return G(v, x, y); });
  return p.done(); }
function canePost() { const c = document.createElement('canvas'); c.width = 8; c.height = 32; const g = c.getContext('2d'); for (let y = 0; y < 32; y++) { g.fillStyle = ((y + 0) % 8) < 4 ? '#d81c2c' : '#fbf6ea'; g.fillRect(0, y, 8, 1); } const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function flakeSprite(seed) { const p = new PX(24, 24), c = [236, 246, 255]; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; for (let r = 0; r < 11; r++) { const x = 12 + Math.cos(a) * r, y = 12 + Math.sin(a) * r; p.set(x, y, c); if (r === 6 || r === 9) { for (const s of [-1, 1]) p.set(x + Math.cos(a + s * .9) * 2, y + Math.sin(a + s * .9) * 2, c); } } } p.ellipse(12, 12, 2, 2, [255, 255, 255]); return p.done(); }
function beardTex() { const p = new PX(24, 14), R = ramp(['#b8b4ac', '#dcd8d0', '#f4f2ec', '#ffffff'], .3); p.fill((x, y) => { const e = Math.abs(y - 7 + Math.sin(x * 1.3) * .8) / 7; if (e > .95 - (x / 24) * .55) return null; return R(.7 - e * .3 + ((x + y) % 3 === 0 ? -.15 : 0), x, y); }); p.outline(.3); return p.done(); }

export function buildMall() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1420');
  scene.fog = new THREE.FogExp2(new THREE.Color('#c8a888'), .008);
  const R = mulberry(17);

  // —— lights ——
  const key = new THREE.DirectionalLight('#fff0dc', 1.8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 90 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(-4, 0, -1.5); key.position.set(4, 30, 14); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#d8e0ff', '#7a5a40', .95); scene.add(hemi);
  const grottoL = new THREE.PointLight('#ffc890', 4.5, 9, 1.4); grottoL.position.set(.8, 3.0, .6); scene.add(grottoL);
  const treeL = new THREE.PointLight('#ffd090', 5, 10, 1.4); treeL.position.set(-13, 3.2, -1.2); scene.add(treeL);
  const eyeL = new THREE.PointLight('#ff2010', 0, 4, 1.6); scene.add(eyeL);
  const warmKey = new THREE.SpotLight('#ffd2a0', 0, 8, .6, .6, 1.2); warmKey.position.set(2.4, 2.8, 2.6); warmKey.target.position.set(.9, 1.4, -1.1); scene.add(warmKey, warmKey.target);
  const flashL = new THREE.PointLight('#ffffff', 0, 6, 1.5); scene.add(flashL);

  // —— floor, mats, dropped things ——
  scene.add(mesh(new THREE.BoxGeometry(40, .2, 14).translate(-4, -.1, -1.5), mat(marble(96, 96), { rough: .35 }), { cast: false }));
  const matM = new THREE.MeshStandardMaterial({ color: '#7a1a20', roughness: 1 });
  for (const [x, z, w, d] of [[2.6, .9, 1.6, 1.0], [-6, 2.2, 2.2, 1.2], [9.2, -.4, 2.0, 1.4]]) { const m = box(w, .02, d, matM, { cast: false }); m.position.set(x, 0, z); scene.add(m); }
  const litter = [];
  for (let k = 0; k < 26; k++) { const c = ['#d81c2c', '#2c5aa0', '#f0c84a', '#3aa050', '#f6f2ea', '#c42a72'][k % 6]; const m = box(.08 + R() * .1, .02, .06 + R() * .08, new THREE.MeshStandardMaterial({ color: c, roughness: .6 }), { cast: false });
    m.position.set(-18 + R() * 30, .01, -3.8 + R() * 8); m.rotation.y = R() * 3; scene.add(m); litter.push(m); }

  // —— shop fronts, two floors ——
  const KINDS = [['TOYS', 'toy'], ['SHOES', 'shoe'], ['BOOKS', 'book'], ['CAFE', 'cafe'], ['SWEETS', 'sweet'], ['GAMES', 'toy'], ['GIFTS', 'toy'], ['PETS', 'toy'], ['TECH', 'book'], ['HATS', 'shoe']];
  const facadeM = new THREE.MeshStandardMaterial({ color: '#3a2a34', roughness: .7 }), trimM = new THREE.MeshStandardMaterial({ color: '#c8a050', roughness: .35, metalness: .7 });
  const signCols = ['#d81c2c', '#1c5aa0', '#2a8a4a', '#8a3ab0', '#d87a1a', '#c42a72'];
  const winMats = [];
  for (const [floorY, rowIdx] of [[0, 0], [3.6, 1]]) for (let k = 0; k < 9; k++) {
    const x = -21 + k * 4, kd = KINDS[(k + rowIdx * 4) % KINDS.length], g = new THREE.Group();
    const wall = box(4, 3.4, .3, facadeM); g.add(wall);
    const wm = basic(shopWindow(k + rowIdx * 20, kd[1]), { em: 1.1, rough: .3 }); winMats.push(wm);
    const win = quad(2.6, 1.9, wm); win.position.set(-.35, 1.25, .16); g.add(win);
    const door = quad(.8, 2.1, new THREE.MeshStandardMaterial({ color: '#2a1e1c', roughness: .4, emissive: '#ffcf8a', emissiveIntensity: .25 })); door.position.set(1.45, 1.05, .16); g.add(door);
    const sign = quad(3.4, .55, basic(pixText([{ t: kd[0], s: 13, b: 1, c: '#fff6e0', y: .55 }], { w: 96, h: 16, bg: signCols[(k + rowIdx) % 6] }), { em: 1.3 })); sign.position.set(0, 2.85, .17); g.add(sign);
    const aw = new THREE.Mesh(new THREE.BoxGeometry(3.0, .08, .6), new THREE.MeshStandardMaterial({ color: signCols[(k + 3) % 6], roughness: .7 })); aw.position.set(-.35, 2.35, .45); aw.rotation.x = .35; g.add(aw);
    const pil = box(.25, 3.4, .5, trimM); pil.position.set(-2, 0, .1); g.add(pil);
    for (let w = 0; w < 7; w++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff2c0', emissive: ['#ffcf60', '#ff6050', '#60b0ff'][w % 3], emissiveIntensity: 2 })); b.position.set(-1.5 + w * .5, 2.55 + Math.sin(w) * .04, .2); g.add(b); }
    g.position.set(x, floorY, -6.6); scene.add(g);
  }
  // the upper walkway, its rail, the ceiling beams and skylight
  const slab = box(40, .25, 2.5, new THREE.MeshStandardMaterial({ color: '#d8ccb6', roughness: .6 })); slab.position.set(-4, 3.35, -5.45); scene.add(slab);
  const railGlass = new THREE.Mesh(new THREE.BoxGeometry(40, .9, .04), new THREE.MeshStandardMaterial({ color: '#a8c8d8', roughness: .05, metalness: .3, transparent: true, opacity: .25 })); railGlass.position.set(-4, 4.05, -4.2); scene.add(railGlass);
  const rail = box(40, .06, .08, trimM); rail.position.set(-4, 4.5, -4.2); scene.add(rail);
  for (let x = -24; x < 16; x += 6) { const bm = box(.3, .3, 12, new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: .6 }), { cast: false }); bm.position.set(x, 7.8, -.5); scene.add(bm); }
  // a garland of fairy lights along the rail and across the atrium (catenaries), giant snowflakes hanging on threads
  const bulbs = [];
  const bulbM = ['#ffd060', '#ff5040', '#60c0ff', '#80ff90'].map(c => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: c, emissiveIntensity: 2.4 }));
  for (let k = 0; k < 64; k++) { const x = -23 + k * .62, b = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), bulbM[k % 4]); b.position.set(x, 4.55 - Math.abs(Math.sin(k * .5)) * .18, -4.15); scene.add(b); bulbs.push(b); }
  for (const x0 of [-16, -9, -2, 5]) for (let k = 0; k < 18; k++) { const u = k / 17, b = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), bulbM[(k + x0) & 3]); b.position.set(x0 + u * 6, 7.4 - Math.sin(u * Math.PI) * 1.1, -4 + u * 7); scene.add(b); bulbs.push(b); }
  const flakes = [];
  for (let k = 0; k < 11; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(flakeSprite(k)), color: new THREE.Color(1.4, 1.5, 1.7), transparent: true, alphaTest: .5 })); const s = .7 + R() * .7; sp.scale.set(s, s, 1);
    sp.position.set(-20 + k * 3.1 + R(), 5.0 + R() * 1.6, -3.2 + R() * 4.5); scene.add(sp); flakes.push(sp);
    const th = box(.01, 7.8 - sp.position.y, .01, new THREE.MeshBasicMaterial({ color: '#d8d8e0' }), { cast: false }); th.position.set(sp.position.x, sp.position.y, sp.position.z); scene.add(th); }
  // shoppers on the upper walkway and along the back
  const strollers = [];
  for (let k = 0; k < 10; k++) { const c = makeChar('shop'); scene.add(c.root); strollers.push({ c, v: k % 8, y: k < 5 ? 3.48 : 0, z: k < 5 ? -5.1 - (k % 2) * .4 : -5.3 + (k % 2) * .5, x0: -22 + R() * 34, sp: (.5 + R() * .6) * (k % 2 ? 1 : -1), lean: k === 1 || k === 3 }); }
  // the escalator on the right, with two riders
  const esc = new THREE.Group(); { const sideM = new THREE.MeshStandardMaterial({ color: '#b8bec8', roughness: .3, metalness: .8 });
    const ramp1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, .35, 1.3), new THREE.MeshStandardMaterial({ color: '#3a3c44', roughness: .5 })); ramp1.rotation.x = 0; ramp1.rotation.z = Math.atan2(3.6, 4.6); ramp1.position.set(2.3, 1.8, 0); esc.add(ramp1);
    for (const z of [-.68, .68]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(5.4, .5, .06), sideM); sd.rotation.z = Math.atan2(3.6, 4.6); sd.position.set(2.3, 2.2, z); esc.add(sd); const hr = new THREE.Mesh(new THREE.BoxGeometry(5.4, .06, .1), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); hr.rotation.z = sd.rotation.z; hr.position.set(2.3, 2.5, z); esc.add(hr); } }
  esc.position.set(7.6, 0, -3.3); esc.rotation.y = Math.PI / 2 * 0; scene.add(esc);
  const riders = [0, 1].map(k => { const c = makeChar('shop'); scene.add(c.root); return c; });

  // —— the giant tree on the left: three cones, baubles, lights, a star; it topples at T.crash ——
  const tree = new THREE.Group(); scene.add(tree); tree.position.set(P.tree[0], 0, P.tree[1]);
  const treeM = new THREE.MeshStandardMaterial({ map: texOf(treeTex(64, 64)), roughness: .9 }); treeM.map.wrapS = treeM.map.wrapT = THREE.RepeatWrapping; treeM.map.repeat.set(3, 2);
  for (const [y, r, h] of [[.4, 2.4, 3.0], [2.6, 1.9, 2.6], [4.5, 1.3, 2.4]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14, 1).translate(0, h / 2, 0), treeM); c.position.y = y; c.castShadow = true; tree.add(c); }
  const trunk = box(.4, .5, .4, new THREE.MeshStandardMaterial({ color: '#4a2a14' })); tree.add(trunk);
  const treeBaubles = [];
  for (let k = 0; k < 34; k++) { const y = .7 + R() * 5.4, r = (1 - (y - .4) / 6.8) * 2.3 + .05, a = R() * Math.PI * 2, bm = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#e8c040', '#2c5aa0', '#f0f0f0'][k % 4], roughness: .15, metalness: .7 }));
    bm.position.set(Math.cos(a) * r * .92, y, Math.sin(a) * r * .92); tree.add(bm); treeBaubles.push(bm); }
  const star = glow('#ffe080', 1.6, 1.2); star.position.set(0, 7.1, 0); tree.add(star);
  const starM = new THREE.Mesh(new THREE.OctahedronGeometry(.3), new THREE.MeshStandardMaterial({ color: '#ffe080', emissive: '#ffc840', emissiveIntensity: 2 })); starM.position.set(0, 7.05, 0); tree.add(starM);
  const treeGifts = [];
  for (let k = 0; k < 12; k++) { const s = .3 + R() * .35, gm = new THREE.Mesh(new THREE.BoxGeometry(s, s * .8, s), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#2c5aa0', '#3aa050', '#c42a72', '#f0c84a'][k % 5], roughness: .5 })); gm.castShadow = true;
    const a = R() * Math.PI * 2; gm.position.set(P.tree[0] + Math.cos(a) * 2.6, s * .4, P.tree[1] + Math.sin(a) * 1.6 + .8); gm.rotation.y = R() * 3; scene.add(gm); treeGifts.push({ m: gm, p0: gm.position.clone(), a }); }

  // —— the fountain, benches, planters, a balloon cart (on the chase path) ——
  const stoneM = new THREE.MeshStandardMaterial({ color: '#c8bca8', roughness: .6 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, .5, 24, 1, true), stoneM); basin.position.set(-18, .25, 3.0); scene.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.38, 24), new THREE.MeshStandardMaterial({ color: '#5aa8d8', roughness: .05, metalness: .3, emissive: '#1a4a6a', emissiveIntensity: .4 })); water.rotation.x = -Math.PI / 2; water.position.set(-18, .4, 3.0); scene.add(water);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.15, .25, 1.2, 10), stoneM); spout.position.set(-18, .6, 3.0); scene.add(spout);
  const jets = particles(80, (i, t, o) => { const u = ((t * .9 + h2(i, 1, 3)) % 1), a = h2(i, 2, 3) * Math.PI * 2, r = u * .9; o.x = -18 + Math.cos(a) * r; o.z = 3.0 + Math.sin(a) * r; o.y = 1.2 + 1.6 * u - 2.6 * u * u; o.s = .05; o.r = .7; o.g = .85; o.b = 1; o.a = .8; }, { blend: THREE.NormalBlending });
  scene.add(jets);
  const benchM = new THREE.MeshStandardMaterial({ color: '#6a4228', roughness: .7 });
  for (const [x, z] of [[-2.8, 5.0], [4.6, 5.0], [-15, 4.8], [11, 4.6]]) { const b = box(1.6, .08, .5, benchM); b.position.set(x, .45, z); scene.add(b); const bk = box(1.6, .45, .06, benchM); bk.position.set(x, .5, z - .25); scene.add(bk); for (const s of [-1, 1]) { const l = box(.06, .45, .45, trimM); l.position.set(x + s * .7, 0, z); scene.add(l); } }
  const potM = new THREE.MeshStandardMaterial({ color: '#2a2c34', roughness: .5 });
  const plantP = new PX(20, 26); for (let k = 0; k < 9; k++) { const a = -1.3 + k * .32; plantP.line(10, 25, 10 + Math.round(Math.sin(a) * 9), 25 - Math.round(Math.cos(a) * 16 + (k % 2) * 4), [50 + k * 8, 130 + k * 6, 50]); plantP.ellipse(10 + Math.sin(a) * 9, 25 - Math.cos(a) * 16 - (k % 2) * 4, 2.4, 1.6, [70, 170, 70]); }
  const plantT = texOf(plantP.done());
  for (const [x, z] of [[-9.5, 4.4], [-4.5, 3.9], [7.5, 3.9], [12.5, 3.6], [-18, 3.6], [-16, -4.6], [3.5, -4.6]]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.3, .25, .55, 10).translate(0, .27, 0), potM); pot.position.set(x, 0, z); scene.add(pot); const lv = billboard(plantT, .9, 1.15, {}); lv.position.set(x, .45, z); scene.add(lv); lv.userData.face = true; flakes.push(lv); }
  const cart = new THREE.Group(); { const cb = box(.8, .7, .5, new THREE.MeshStandardMaterial({ color: '#2c5aa0', roughness: .5 })); cb.position.y = .2; cart.add(cb); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .05, 12), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); w.rotation.x = Math.PI / 2; w.position.set(s * .3, .18, .28); cart.add(w); } }
  cart.position.set(-5.2, 0, -.9); scene.add(cart);
  const balloons = [];
  for (let k = 0; k < 11; k++) { const bm = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#f0c84a', '#2c5aa0', '#3aa050', '#c42a72', '#ee7a2c'][k % 6], roughness: .25, emissive: '#200808', emissiveIntensity: .2 })); bm.scale.y = 1.2;
    const off = [(R() - .5) * .9, 1.7 + R() * .6, (R() - .5) * .5]; scene.add(bm); balloons.push({ m: bm, off, vx: (R() - .5) * .6, vz: (R() - .5) * .4, sp: .9 + R() * .6 }); }
  const strings = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#e8e8e8' })); strings.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(11 * 6), 3)); strings.frustumCulled = false; scene.add(strings);

  // —— the grotto ——
  const grotto = new THREE.Group(); scene.add(grotto);
  const snowM = mat(fakeSnow(96, 96), { rough: 1 });
  const plat = mesh(new THREE.BoxGeometry(6.8, .3, 3.4).translate(0, .15, -1.5), snowM); grotto.add(plat);
  for (let k = 0; k < 14; k++) { const s = .3 + R() * .4, lump = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f2f6fb', roughness: 1 })); lump.position.set(-3.3 + R() * 6.6, .3, -3.1 + R() * .6 + (k % 2) * 2.9); lump.scale.y = .5; grotto.add(lump); }
  const ginger = quad(4.4, 3.2, mat(gingerTex(64, 48), { rough: .8 })); ginger.position.set(.4, 1.9, -3.15); grotto.add(ginger);
  for (const [x, y] of [[-.9, 2.4], [1.7, 2.4]]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.32, .1, 8, 18), new THREE.MeshStandardMaterial({ color: '#1e5a28', roughness: .8 })); w.position.set(x, y, -3.08); grotto.add(w);
    const bow = box(.2, .14, .05, new THREE.MeshStandardMaterial({ color: '#d81c2c' })); bow.position.set(x, y - .42, -3.0); grotto.add(bow);
    for (let k = 0; k < 8; k++) { const bb = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), bulbM[k % 4]); const a = k / 8 * Math.PI * 2; bb.position.set(x + Math.cos(a) * .32, y + Math.sin(a) * .32, -3.0); grotto.add(bb); } }
  { const dw = quad(.9, 1.5, new THREE.MeshStandardMaterial({ color: '#3a1e0c', emissive: '#ffb060', emissiveIntensity: .35 })); dw.position.set(.4, 1.05, -3.12); grotto.add(dw);
    const wn = quad(.7, .5, new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffc060', emissiveIntensity: 1.4 })); wn.position.set(.4, 2.55, -3.12); grotto.add(wn);
    for (let k = 0; k < 9; k++) { const cc = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 10), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#3aa050', '#f0c84a'][k % 3], roughness: .4 })); cc.rotation.x = Math.PI / 2; cc.position.set(-1.6 + k * .5, 3.2, -3.1); grotto.add(cc); } }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.4, 4, 1), new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: .9 })); roof.rotation.y = Math.PI / 4; roof.scale.z = .25; roof.position.set(.4, 4.1, -3.2); grotto.add(roof);
  const arch = quad(3.4, .6, basic(pixText([{ t: "SANTA'S GROTTO", s: 10, b: 1, c: '#ffe070', y: .55 }], { w: 112, h: 20, bg: '#7a1018', border: '#ffe070' }), { em: 1.4 })); arch.position.set(.4, 3.55, -3.05); grotto.add(arch);
  const archGlow = glow('#ffd070', 3.2, .18); archGlow.position.set(.4, 3.55, -2.9); grotto.add(archGlow);
  const caneT = canePost(), caneM = new THREE.MeshStandardMaterial({ map: caneT, roughness: .4 });
  for (let x = -3.3; x <= 3.31; x += .42) { if (x > 1.75 && x < 2.65) continue; const c = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .55, 8).translate(0, .275, 0), caneM); c.position.set(x, .3, .2); c.userData.fence = true; grotto.add(c); }
  const fenceRail = box(5.2, .05, .05, new THREE.MeshStandardMaterial({ color: '#d81c2c' })); fenceRail.position.set(-.8, .78, .2); grotto.add(fenceRail);
  const gifts = [];
  for (let k = 0; k < 16; k++) { const s = .25 + R() * .35, gm = new THREE.Mesh(new THREE.BoxGeometry(s, s * .85, s), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#2c5aa0', '#3aa050', '#c42a72', '#f0c84a', '#f6f2ea'][k % 6], roughness: .5 })); gm.castShadow = true;
    const rib = box(s * 1.02, s * .87, .05, new THREE.MeshStandardMaterial({ color: '#ffe070', metalness: .6, roughness: .3 })); rib.position.y = -s * .42; gm.add(rib);
    const side = k < 8 ? -1 : 1; gm.position.set(side < 0 ? -3.0 + (k % 4) * .38 : 2.6 + (k % 4) * .3, .3 + s * .42 + Math.floor((k % 8) / 4) * s * .8, -2.7 + Math.floor((k % 8) / 4) * .1 + (side > 0 ? 0 : .2)); gm.rotation.y = R(); grotto.add(gm); gifts.push(gm); }
  for (const x of [-3.1, 3.2]) { const post = box(.08, 1.8, .08, new THREE.MeshStandardMaterial({ color: '#1a1a20', metalness: .6 })); post.position.set(x, .3, -.1); grotto.add(post); const lan = new THREE.Mesh(new THREE.BoxGeometry(.25, .32, .25), new THREE.MeshStandardMaterial({ color: '#fff2c0', emissive: '#ffb050', emissiveIntensity: 2.2 })); lan.position.set(x, 2.2, -.1); grotto.add(lan); const gl = glow('#ffb050', 1.2, .5); gl.position.set(x, 2.2, 0); grotto.add(gl); }
  // the snowmen (fake), the little tree on the right
  for (const [x, z] of [[-2.9, -.6]]) { for (const [y, r] of [[.55, .32], [1.05, .24], [1.42, .17]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshStandardMaterial({ color: '#f6f8fc', roughness: 1 })); s.position.set(x, y, z); s.castShadow = true; grotto.add(s); }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.04, .2, 6), new THREE.MeshStandardMaterial({ color: '#ee7a2c' })); nose.rotation.z = -Math.PI / 2; nose.position.set(x + .2, 1.42, z + .05); grotto.add(nose);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .2, 10), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); hat.position.set(x, 1.62, z); grotto.add(hat); }
  // the camera on its tripod, the Cat in an elf hat on top
  const tri = new THREE.Group(); { const tm = new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: .6, roughness: .4 }); for (let k = 0; k < 3; k++) { const l = box(.03, 1.25, .03, tm); l.rotation.z = Math.cos(k * 2.1) * .2; l.rotation.x = Math.sin(k * 2.1) * .2; tri.add(l); }
    const cam = box(.36, .24, .26, new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: .4 })); cam.position.y = 1.2; tri.add(cam); const lens = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .16, 12), new THREE.MeshStandardMaterial({ color: '#2a2a34', metalness: .7, roughness: .2 })); lens.rotation.z = Math.PI / 2; lens.position.set(-.24, 1.32, 0); tri.add(lens);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(.06, .1, .14), new THREE.MeshStandardMaterial({ color: '#f0f0f0', emissive: '#ffffff', emissiveIntensity: 0 })); fl.position.set(-.18, 1.5, 0); tri.add(fl); tri.userData.flash = fl; }
  tri.position.set(P.cat[0], .3, P.cat[1]); scene.add(tri);
  const polaroid = quad(.26, .3, basic((() => { const p = new PX(16, 18); p.fill(() => [246, 244, 236]); p.rect(2, 2, 12, 11, [120, 170, 220]); p.ellipse(8, 8, 3, 3, [240, 200, 160]); p.rect(6, 9, 4, 2, [40, 30, 40]); p.set(6, 7, [90, 160, 240]); p.set(10, 7, [90, 160, 240]); return p.done(); })())); scene.add(polaroid);

  // —— the sleigh, the sack, the reindeer and its plug ——
  const sleigh = new THREE.Group(); scene.add(sleigh);
  const sleighTex = (() => { const p = new PX(48, 24), Rr = ramp(['#5a0a12', '#8a1420', '#b41a26', '#d83a40'], .3), G = ramp(['#8a621c', '#c89a38', '#f0d27a'], .3);
    p.fill((x, y) => { if (y < 2 || y > 21) return G(.6, x, y); const sw = Math.sin(x * .45 + Math.sin(y * .5) * 1.6) * Math.cos(y * .55); if (Math.abs(sw) < .12 && y > 4 && y < 19) return G(.8, x, y); if ((x + y * 3) % 17 === 0) return [250, 240, 220]; return Rr(.55 + (h2(x, y, 3) - .5) * .25, x, y); });
    const t = texOf(p.done()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; })();
  { const rm = new THREE.MeshStandardMaterial({ map: sleighTex, roughness: .35, metalness: .2 }), gm = new THREE.MeshStandardMaterial({ color: '#e8c040', roughness: .25, metalness: .8 });
    const body = box(1.7, .55, .95, rm); body.position.set(0, .15, 0); sleigh.add(body);
    const back = box(.25, .9, .95, rm); back.position.set(.85, .15, 0); back.rotation.z = -.15; sleigh.add(back);
    const front = new THREE.Mesh(new THREE.TorusGeometry(.35, .07, 8, 16, Math.PI), rm); front.position.set(-.85, .55, 0); front.rotation.z = Math.PI / 2; sleigh.add(front);
    for (const z of [-.42, .42]) { const run = box(2.1, .05, .06, gm); run.position.set(-.1, 0, z); sleigh.add(run); const curl = new THREE.Mesh(new THREE.TorusGeometry(.18, .03, 6, 12, Math.PI * 1.3), gm); curl.position.set(-1.15, .2, z); sleigh.add(curl);
      const trim = box(1.7, .06, .03, gm); trim.position.set(0, .66, z * 1.14); sleigh.add(trim); } }
  const sack = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), new THREE.MeshStandardMaterial({ color: '#8a5a2a', roughness: 1 })); sack.scale.set(1, 1.2, 1); sack.castShadow = true; scene.add(sack);
  const warn = quad(.5, .3, basic(pixText([{ t: 'DANGER', s: 8, b: 1, c: '#1a1016', y: .3 }, { t: 'DO NOT PLUG IN', s: 6, c: '#1a1016', y: .7 }], { w: 48, h: 28, bg: '#ffd23a', border: '#1a1016' }))); warn.position.set(P.socket[0] + .42, .62, P.socket[1] + .02); warn.rotation.y = .3; scene.add(warn);
  const warnPost = box(.03, .32, .03, new THREE.MeshStandardMaterial({ color: '#1a1a20' })); warnPost.position.set(P.socket[0] + .45, .3, P.socket[1] - .06); scene.add(warnPost);
  for (let k = 0; k < 7; k++) { const s = .1 + R() * .12, gm = new THREE.Mesh(new THREE.BoxGeometry(s, s * .8, s), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#2c5aa0', '#3aa050', '#c42a72', '#f0c84a'][k % 5], roughness: .5 })); gm.position.set(P.socket[0] - .5 + k * .2, .3 + s * .4, P.socket[1] + .25 + (k % 2) * .12); gm.rotation.y = R() * 3; scene.add(gm); }
  const socket = box(.22, .1, .14, new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: .5 })); scene.add(socket);
  const plug = box(.08, .08, .06, new THREE.MeshStandardMaterial({ color: '#1a1a20', roughness: .5 })); scene.add(plug);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(P.socket[0], .38, P.socket[1]), v3(.2, .32, -.5), v3(-.6, .32, -.8), v3(P.deer[0] + .4, .35, P.deer[1] + .1)]), 24, .015, 5), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); scene.add(cable);
  const harness = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#c42232' })); harness.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); harness.frustumCulled = false; scene.add(harness);
  const beard = new THREE.Mesh(new THREE.PlaneGeometry(.3, .26).translate(.15, 0, 0), new THREE.MeshLambertMaterial({ map: texOf(beardTex()), transparent: true, alphaTest: .5, side: THREE.DoubleSide })); scene.add(beard);

  // a toy train along the front edge of the grotto, back and forth
  const train = new THREE.Group(); { const cols = ['#d81c2c', '#2c5aa0', '#3aa050', '#f0c84a'];
    for (let k = 0; k < 4; k++) { const car = box(.28, .16, .16, new THREE.MeshStandardMaterial({ color: cols[k], roughness: .4 })); car.position.set(k * .32, .05, 0); train.add(car);
      for (const dx of [-.08, .08]) for (const dz of [-.09, .09]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .02, 8), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); w.rotation.x = Math.PI / 2; w.position.set(k * .32 + dx, .05, dz); train.add(w); } }
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .12, 8), new THREE.MeshStandardMaterial({ color: '#1a1a20' })); chim.position.set(-.05, .27, 0); train.add(chim); }
  scene.add(train);
  const track = box(6.6, .02, .2, new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: .8 }), { cast: false }); track.position.set(0, .3, -.05); scene.add(track);
  for (let x = -3.2; x < 3.3; x += .2) { const sl = box(.05, .025, .26, new THREE.MeshStandardMaterial({ color: '#3a2a1a' }), { cast: false }); sl.position.set(x, .3, -.05); scene.add(sl); }
  // —— characters ——
  const santa = makeChar('santa'), cust = makeChar('cust'), boss = makeChar('boss'), deer = makeChar('deer', 1.4), cat = makeChar('cat', 1, 1.15);
  for (const c of [santa, cust, boss, deer, cat]) scene.add(c.root);
  santa.root.add(beard);
  const kids = KIDS.map(k => { const c = makeChar('kid'); scene.add(c.root); return { ...k, c }; });
  const kid0 = makeChar('kid'), toddler = makeChar('kid'); scene.add(kid0.root, toddler.root);
  const stool = new THREE.Mesh(new THREE.BoxGeometry(.42, .3, .34).translate(0, .15, 0), new THREE.MeshStandardMaterial({ color: '#2c5aa0', roughness: .5 })); stool.position.set(P.kid0[0], P.plat, P.kid0[1]); stool.castShadow = true; scene.add(stool);
  { const rb = box(.43, .31, .06, new THREE.MeshStandardMaterial({ color: '#ffe070', metalness: .6, roughness: .3 })); rb.position.set(P.kid0[0], P.plat, P.kid0[1]); scene.add(rb); }
  const parents = PARENTS.map(p => { const c = makeChar('shop'); scene.add(c.root); return { ...p, c }; });
  const divers = [0, 1, 2, 3].map(k => { const c = makeChar('shop'); scene.add(c.root); return { c, v: (k * 3 + 1) % 8, x: -3.8 - k * 2.4, z: -1.3 + (k % 2) * .25 }; });
  // queue rope (candy-cane stanchions) to the right of the grotto
  for (let k = 0; k < 10; k++) { const x = 2.15 + k * .9, c = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .95, 8).translate(0, .475, 0), caneM); c.position.set(x, 0, 1.3); scene.add(c); if (k < 9) { const r = box(.9, .03, .03, new THREE.MeshStandardMaterial({ color: '#d81c2c' }), { cast: false }); r.position.set(x + .45, .85, 1.3); scene.add(r); } }

  // —— particles: tears, presents, sparks, baubles, confetti snow ——
  const tears = particles(140, (i, t, o) => { const k = i % 13, kid = k < 12 ? kids[k] : null, t0 = k < 12 ? kid.cry : T.flash + .1, t1 = k < 12 ? T.gifts + k * .17 : T.off; if (t < t0 || t > t1) { o.a = 0; return; }
    const ph = ((t - t0) * 2.2 + h2(i, 1, 2)) % 1, side = i % 2 ? 1 : -1, base = k < 12 ? kid.c.root.position : toddler.root.position;
    o.x = base.x + side * (.06 + ph * .35); o.y = base.y + .95 * (k < 12 ? .8 : .8) + 2.0 * ph * .35 - 4.9 * ph * ph * .35; o.z = base.z + .1; o.s = .04; o.r = .55; o.g = .8; o.b = 1; o.a = 1; }, { blend: THREE.NormalBlending });
  scene.add(tears);
  const sparks = particles(50, (i, t, o) => { const u = t - T.plug - (i % 5) * .15; if (u < 0 || u > .5 || t > 21.8) { o.a = 0; return; } const a = h2(i, 1, 4) * Math.PI * 2, sp = 1 + h2(i, 2, 4) * 1.5;
    o.x = P.socket[0] + Math.cos(a) * sp * u * .5; o.z = P.socket[1] + Math.sin(a) * sp * u * .3; o.y = .42 + 1.5 * u - 4.9 * u * u; o.s = .03; o.r = 1; o.g = .85; o.b = .3; o.a = 1 - u * 2; });
  scene.add(sparks);
  const baubleFly = particles(60, (i, t, o) => { const u = t - T.crash - h2(i, 3, 6) * .3; if (u < 0 || u > 2) { o.a = 0; return; } const a = h2(i, 1, 6) * Math.PI * 2, sp = 1.5 + h2(i, 2, 6) * 3;
    o.x = P.tree[0] + 1 + Math.cos(a) * sp * u; o.z = P.tree[1] + 1.5 + Math.abs(Math.sin(a)) * sp * u * .6; o.y = Math.max(.08, 2 + 3 * u - 4.9 * u * u); o.s = .1; const c = [[.85, .1, .15], [.9, .75, .25], [.17, .35, .63], [.95, .95, .95]][i % 4]; o.r = c[0]; o.g = c[1]; o.b = c[2]; o.a = 1; }, { blend: THREE.NormalBlending });
  scene.add(baubleFly);
  const confetti = particles(160, (i, t, o) => { const H = 7.5, y = H - ((t * (.25 + h2(i, 3, 9) * .2) + h2(i, 1, 9) * H) % H); o.x = -20 + h2(i, 2, 9) * 32 + Math.sin(t + i) * .3; o.z = -4 + h2(i, 4, 9) * 7; o.y = y; o.s = .035; o.r = o.g = o.b = 1; o.a = .9; }, { blend: THREE.NormalBlending });
  scene.add(confetti);
  const GIFTN = 12, giftFly = [...Array(GIFTN)].map((_, k) => { const s = .18 + (k % 3) * .04, m = new THREE.Mesh(new THREE.BoxGeometry(s, s * .8, s), new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#2c5aa0', '#3aa050', '#c42a72', '#f0c84a'][k % 5], roughness: .5 })); scene.add(m); return m; });

  const place = (c, x, y, z) => c.root.position.set(x, y, z);
  const L3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  function camAt(t, shot) {
    const sx = sleighX(t);
    if (shot.id === 'close' || shot.id === 'closeEnd') { const u = shot.id === 'close' ? eo(seg(t, 0, T.wide)) : 1 - eo(seg(t, T.k2, DUR)); return { p: L3([1.55, 1.85, 2.55], [1.6, 1.9, 2.9], u), l: L3([1.25, 1.5, -1.0], [1.25, 1.52, -1.0], u) }; }
    if (shot.id === 'wide') { const u = ss(seg(t, T.wide, T.hop)); return { p: L3([1.3, 4.4, 10.8], [1.3, 4.1, 10.2], u), l: L3([1.25, 1.6, -1.0], [1.25, 1.5, -.9], u) }; }
    if (shot.id === 'lap') { const u = ss(seg(t, T.hop, T.chain)); return { p: L3([2.0, 2.15, 4.0], [1.9, 2.05, 3.6], u), l: L3([1.5, 1.35, -.9], [1.5, 1.35, -.9], u) }; }
    if (shot.id === 'chain') { const u = ss(seg(t, T.chain, 12.4)); return { p: L3([3.0, 2.3, 6.6], [7.0, 2.3, 6.8], u), l: L3([2.8, 1.0, .6], [6.6, 1.0, .8], u) }; }
    if (shot.id === 'sack') { const u = ss(seg(t, 12.4, T.custIn)); return { p: L3([2.0, 2.6, 6.0], [2.4, 2.5, 6.6], u), l: L3([1.3, 1.25, -.6], [2.4, 1.2, -.2], u) }; }
    if (shot.id === 'cust') { const u = ss(seg(t, T.custIn, T.plug)); return { p: L3([1.8, 2.3, 5.2], [1.4, 2.0, 4.0], u), l: L3([1.3, 1.3, -.8], [1.0, 1.3, -1.0], u) }; }
    if (shot.id === 'plug') return { p: [1.95, 1.45, 2.7], l: [1.1, .85, -.8] };
    if (shot.id === 'deer') { const u = ss(seg(t, 21.2, T.bolt)); return { p: L3([-1.1, 2.0, 4.6], [-1.3, 2.3, 5.6], u), l: L3([-1.6, 1.3, -1.2], [-1.6, 1.4, -1.2], u) }; }
    if (shot.id === 'chase') return { p: [sx + .1, 2.7, 6.6], l: [sx - 1.0, 1.0, -1.0] };
    if (shot.id === 'crash') { const u = ss(seg(t, T.crash, 29.4)); return { p: L3([-10.6, 2.6, 4.6], [-10.2, 3.2, 6.6], u), l: L3([-12.8, 1.6, -1.6], [-12.6, 2.0, -2.0], u) }; }
    return { p: [-10.8, 2.7, 6.6], l: [-11.6, .95, -1.0] };
  }

  function update(t, shot, camera, shake) {
    const { p, l } = camAt(t, shot);
    const jx = (Math.sin(t * 61) + Math.sin(t * 37.3)) * .5 * shake * .06, jy = (Math.sin(t * 53.1) + Math.cos(t * 29.7)) * .5 * shake * .06;
    camera.position.set(p[0] + jx, p[1] + jy, p[2]); camera.lookAt(l[0] + jx * .5, l[1] + jy * .5, l[2]); camera.fov = 40; camera.updateProjectionMatrix();
    const cam = camera;
    const sx = sleighX(t), dx = sx - P.sleigh[0], chasing = sleighOn(t), wrecked = t >= T.crash && t < T.k2;
    const hook = shot.id === 'close' || shot.id === 'closeEnd';
    // lights
    warmKey.intensity = hook ? 4 : 0;
    eyeL.intensity = t >= T.eyes && t < T.crash ? 3.5 * (.8 + .2 * Math.sin(t * 30)) : 0;
    bulbs.forEach((b, i) => { b.visible = ((Math.floor(t * 2 + i * .37) % 7) !== 0); });
    const fl = t >= T.flash && t < T.flash + .12; tri.userData.flash.material.emissiveIntensity = fl ? 6 : 0; flashL.intensity = fl && t < T.flash + .06 ? 4 : 0; flashL.position.set(P.cat[0] - .3, 1.8, P.cat[1] + .3);
    for (const pz of [tears, sparks, baubleFly, confetti, jets]) pz.userData.update(t);
    { const ph = (t * .12) % 2, u = ph < 1 ? ph : 2 - ph; train.position.set(-3.0 + u * 5.0, .3, -.05); train.rotation.y = ph < 1 ? Math.PI : 0; train.visible = !(t >= T.bolt && t < T.k2) || sx > -3.4; }
    flakes.forEach((f, i) => { if (f.isSprite) f.material.rotation = Math.sin(t * .4 + i) * .3; else if (f.userData.face) f.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z); });
    // strollers on two floors; the escalator riders
    strollers.forEach((s, k) => { let x = s.x0 + s.sp * t; x = ((x + 24) % 38 + 38) % 38 - 24; place(s.c, x, s.y, s.z); s.c.frame(s.lean ? `${s.v}p` : `${s.v}w${walkStep(t + k * .3, false)}`); s.c.face(cam, s.sp < 0); });
    riders.forEach((c, k) => { const u = ((t * .08 + k * .5) % 1); place(c, 7.6 + u * 4.6 - 2.3 + 2.3, u * 3.6 + .15, -3.3 + (k ? .25 : -.25)); c.frame(`${(k * 5 + 2) % 8}s`); c.face(cam, false); });
    // the sleigh, the sack, the reindeer, the harness, the plug
    const bump = chasing && t < T.crash ? Math.abs(Math.sin(t * 14)) * .05 : 0, offPlat = sx < -3.4 ? -.3 * ss(seg(sx, -3.4, -3.8)) * -1 : 0;
    const floorY = sx < -3.5 ? 0 : P.plat;
    const tilt = wrecked ? .25 : chasing ? Math.sin(t * 9) * .03 : 0;
    sleigh.position.set(sx, floorY + bump, P.sleigh[1]); sleigh.rotation.set(0, wrecked ? .5 : 0, tilt);
    sack.position.set(sx + .65, floorY + .62 + bump, P.sleigh[1]); sack.scale.set(1, 1.2 - (t > T.sack && t < T.joyMax ? .25 * ss(seg(t, T.sack, T.joyMax)) : 0), 1);
    socket.position.set(P.socket[0], .35, P.socket[1]); socket.visible = !chasing && !wrecked;
    const plugIn = t >= T.plug && t < T.hired; plug.position.set(P.socket[0] + (plugIn ? 0 : .16), .42, P.socket[1]); plug.visible = socket.visible;
    cable.visible = !chasing && !wrecked;
    { let f = 'stiff', sq = 0, x = P.deer[0] + dx, y = floorY + bump * 1.5;
      if (t >= T.eyes && t < T.rear) f = 'eyes';
      else if (t >= T.rear && t < T.bolt) { f = 'rear'; sq = .1 * Math.sin(seg(t, T.rear, T.bolt) * Math.PI); }
      else if (chasing && t < T.crash) f = `r${walkStep(t, true)}`;
      else if (wrecked) { f = 'dizzy'; x = P.tree[0] + 1.3; y = 0; }
      place(deer, x, y, P.deer[1] + .05); deer.frame(f); deer.squash(sq); deer.face(cam, false); }
    const hp = harness.geometry.attributes.position; const dpos = deer.root.position;
    hp.setXYZ(0, dpos.x + .7, dpos.y + 1.2, dpos.z); hp.setXYZ(1, sx - .85, floorY + .6, P.sleigh[1] - .3); hp.setXYZ(2, dpos.x + .7, dpos.y + 1.1, dpos.z); hp.setXYZ(3, sx - .85, floorY + .6, P.sleigh[1] + .3);
    hp.needsUpdate = true; harness.visible = !wrecked;
    // the grotto's fence breaks when the sleigh goes through it, presents scatter (a cut hides the repair for the loop)
    // —— Santa ——
    { let f = 'sit', sq = 0, vis = true;
      const sy = floorY + .28 + bump;
      if (t < T.snap) f = pick(t, 8) ? 'yank' : 'yank1';
      else if (t < T.wide) { f = pick(t, 8) ? 'shock' : 'shock1'; sq = -.2 * Math.exp(-(t - T.snap) * 10) * Math.cos((t - T.snap) * 30); }
      else if (t < T.hop) f = t < 2.4 ? 'stare' : (Math.floor(t * 8) % 19 === 0 ? 'blink' : 'smile');
      else if (t < T.cheese) f = 'hug';
      else if (t < T.flash) f = t < 5.6 ? (pick(t, 6) ? 'cheese' : 'cheeseQ') : 'cheeseQ';
      else if (t < T.chain) f = t < T.flash + .4 ? 'shock' : 'hugWorry';
      else if (t < T.sack) f = pick(t, 3) ? 'worry' : 'stare';
      else if (t < T.joyMax) f = t < T.gifts ? (pick(t, 6) ? 'throw' : 'sack') : (pick(t, 6) ? 'throw' : 'throwQ');
      else if (t < T.custSit) f = t > T.custTalk ? 'stare' : 'smile';
      else if (t < T.eyes) f = t < T.custSit + .3 ? 'shock' : 'hugWorry';
      else if (t < T.bolt) f = pick(t, 7) ? 'shock' : 'shock1';
      else if (t < T.crash) f = pick(t, 9) ? 'hold' : 'hold1';
      else if (t < T.k2) f = Math.floor(t * 8) % 17 === 0 ? 'wreckBlink' : t > T.fired ? 'wreckSad' : 'wreck';
      else f = t < (T.k2 + .4) ? 'smile' : 'yank';
      if (t >= T.k2 && t >= (T.k2 + .4)) f = pick(t, 8) ? 'yank' : 'yank1';
      if (wrecked) { place(santa, P.tree[0] + 3.2, .0, P.sleigh[1] + .3); } else place(santa, P.seat[0] + dx, sy, P.seat[1]);
      santa.root.visible = vis; santa.frame(f); santa.squash(sq); santa.face(cam, false);
      // the beard prop: stretched toward the kid at frame 0, snaps back at T.snap; again at the end
      const bOn = t < T.snap + .02 || t >= (T.k2 + .4);
      beard.visible = bOn; beard.position.set(-.04, 1.14, .02);
      const k = t < T.snap ? 2.2 + .1 * Math.sin(t * 40) : t < T.snap + .02 ? 1.2 : 1 + 1.2 * eo(seg(t, (T.k2 + .4), DUR));
      beard.scale.set(k, 1 - (k - 1) * .15, 1); beard.rotation.z = -.38; }
    // —— the yanking kid (frame 0 and the loop), the toddler on the lap, the queue of kids ——
    { const on = t < T.wide || t >= T.k2; kid0.root.visible = on; place(kid0, P.kid0[0], P.plat + .3, P.kid0[1]); kid0.frame(t < T.snap || t >= (T.k2 + .4) ? '3grab' : t >= T.k2 ? '3s' : '3h'); kid0.squash(t < .1 ? .06 : 0); kid0.face(cam, true); }
    { const vis = t >= T.hop && t < T.off + .6; toddler.root.visible = vis;
      if (vis) { let x = P.lap[0], y = P.plat + .45, z = P.lap[1], f = '2sit';
        if (t < T.sit) { const u = seg(t, T.hop, T.sit); x = lerp(2.3, P.lap[0], u); y = lerp(0, P.plat + .45, u) + Math.sin(u * Math.PI) * .35; z = lerp(.9, P.lap[1], u); f = '2h'; }
        else if (t >= T.off) { const u = seg(t, T.off, T.off + .6); x = lerp(P.lap[0], 2.6, u); y = lerp(P.plat + .45, 0, u) + Math.sin(u * Math.PI) * .3; z = lerp(P.lap[1], .9, u); f = pick(t, 6) ? '2c0' : '2c1'; }
        else if (t >= T.flash) f = pick(t, 6) ? '2sitc0' : '2sitc1';
        place(toddler, x, y, z); toddler.frame(f); toddler.squash(t >= T.flash && t < T.flash + .3 ? .15 * Math.sin((t - T.flash) * 30) : 0); toddler.face(cam, true); } }
    kids.forEach(k => {
      let x = k.x, z = k.z, f = `${k.v}s`, y = 0, flip = true;
      if (t >= k.cry && t < k.gift) f = pick(t + k.i * .1, 6) ? `${k.v}c0` : `${k.v}c1`;
      else if (t >= k.gift && t < T.bolt) f = t < T.joyMax + .8 ? (pick(t + k.i * .1, 4) ? `${k.v}h` : `${k.v}h1`) : `${k.v}g`;
      else if (t >= T.bolt && t < T.crash) f = `${k.v}f`;
      if (t >= T.hired) { x = -12.9 + (k.i % 6) * .5; z = .9 + Math.floor(k.i / 6) * .55; f = pick(t + k.i * .2, 3) ? `${k.v}p` : `${k.v}h`; flip = x > -10; }
      else if (t >= T.crash) f = `${k.v}h`;
      if (t >= T.k2) { x = k.x; z = k.z; f = `${k.v}s`; }
      if (k.i === 0 && t >= T.hop - .5 && t < T.off + .8) k.c.root.visible = false; else k.c.root.visible = true;
      if (t >= k.cry && t < k.cry + .2) y = .05 * Math.sin((t - k.cry) * 30);
      place(k.c, x, y, z); k.c.frame(f); k.c.face(cam, flip);
    });
    parents.forEach(pp => { let f = `${pp.v}s`; if (t >= T.chain + pp.i * .25 && t < T.gifts) f = `${pp.v}l`; else if (t >= T.bolt && t < T.crash) f = `${pp.v}p`; place(pp.c, pp.x, 0, pp.z); pp.c.root.visible = t < T.hired || t >= T.k2; pp.c.frame(f); pp.c.face(cam, true); });
    // shoppers on the chase path dive out of the way
    divers.forEach((d, k) => { const near = clamp((d.x + 2.2 - sx) / 2.2 + 1, 0, 1), dive = chasing ? ss(seg(sx, d.x + 1.8, d.x - .3)) : 0;
      place(d.c, d.x, Math.sin(dive * Math.PI) * .4, d.z + dive * 1.8); d.c.frame(dive > 0 && dive < 1 ? `${d.v}l` : t < T.bolt ? `${d.v}w${walkStep(t + k, false)}` : `${d.v}s`); d.c.face(cam, k % 2 === 0); d.c.root.visible = !wrecked || t < T.hired;
      if (t < T.bolt) d.c.root.position.x = d.x + Math.sin(t * .3 + k) * .6; });
    // —— the Customer ——
    { let f = 'stand', x = 3.6, y = 0, z = .5, vis = t >= T.custIn && t < T.k2, flip = true, sq = 0;
      if (t < T.custTalk) { const u = seg(t, T.custIn, T.custTalk); x = lerp(4.6, 2.0, u); z = lerp(.6, .1, u); f = `w${walkStep(t, true)}`; }
      else if (t < T.custSit) { x = 2.0; z = .1; f = pick(t, 6) && t < 19.0 ? 'talk' : 'demand'; }
      else if (t < T.crash) { const u = eo(seg(t, T.custSit, T.custSit + .35)); x = lerp(2.0, P.lap[0] + dx + .05, u); y = lerp(0, floorY + .38 + bump, u) + Math.sin(u * Math.PI) * .3; z = lerp(.1, P.lap[1] + .05, u);
        f = t < T.eyes ? (t < T.custSit + .4 ? 'sit' : pick(t, 5) && t < 19.5 ? 'sitTalk' : 'sit') : pick(t, 8) ? 'sitShock' : 'sitShock1'; sq = t >= T.custSit + .3 && t < T.custSit + .6 ? -.12 * Math.sin((t - T.custSit - .3) * 10) : 0; }
      else { x = P.tree[0] + 2.4; y = 0; z = P.sleigh[1] + .9; f = t < T.hired ? 'cross' : 'smug'; }
      cust.root.visible = vis; place(cust, x, y, z); cust.frame(f); cust.squash(sq); cust.face(cam, flip); }
    // —— the Manager ——
    { const vis = t >= T.boss && t < T.k2; boss.root.visible = vis; const u = seg(t, T.boss, T.boss + .6);
      place(boss, lerp(-8.6, -10.4, u), 0, lerp(1.4, .6, u)); boss.frame(u < 1 ? `w${walkStep(t, true)}` : (t > 29.5 && t < 31.4) || (t > 35.7 && t < 39.3) ? (pick(t, 6) ? 'talk' : 'point') : 'stand'); boss.face(cam, true); }
    // —— the Cat, elf photographer, on the camera ——
    { place(cat, P.cat[0] + .05, P.plat + 1.34, P.cat[1]); const f = t >= T.c3 && t < T.flash + .2 ? (pick(t, 4) ? 'elfPaw' : 'elf') : wrecked ? 'elfSleep' : 'elf'; cat.frame(f); cat.face(cam, true); cat.root.visible = true; }
    // the polaroid pops out of the camera
    { const u = seg(t, T.polaroid, T.polaroid + .4); polaroid.visible = t >= T.polaroid && t < T.chain + 1; polaroid.position.set(P.cat[0] - .1, P.plat + 1.45 + .25 * eo(u), P.cat[1] + .1); polaroid.rotation.y = Math.atan2(cam.position.x - polaroid.position.x, cam.position.z - polaroid.position.z); }
    // presents arc from the sack into the kids' arms
    giftFly.forEach((m, k) => { const kd = kids[k], u = seg(t, kd.gift - .55, kd.gift); m.visible = t > kd.gift - .55 && t < kd.gift; if (!m.visible) return; const a = [P.sleigh[0] + .65, P.plat + 1.0, P.sleigh[1]], b = [kd.x, .9, kd.z];
      m.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 1.6, lerp(a[2], b[2], u)); m.rotation.set(u * 6, u * 4, 0); });
    // the balloon cart: knocked at T.balloons, the balloons float up
    balloons.forEach((b, k) => { const u = Math.max(0, t - T.balloons); const base = [cart.position.x, 0, cart.position.z];
      b.m.position.set(base[0] + b.off[0] + b.vx * u, base[1] + b.off[1] + b.sp * u * u * .5 + u * .4 + Math.sin(t * 2 + k) * .03, base[2] + b.off[2] + b.vz * u); });
    { const sp = strings.geometry.attributes.position; balloons.forEach((b, k) => { const u = Math.max(0, t - T.balloons); sp.setXYZ(k * 2, b.m.position.x, b.m.position.y - .22, b.m.position.z); sp.setXYZ(k * 2 + 1, u > 0 ? b.m.position.x : cart.position.x, u > 0 ? b.m.position.y - .9 : .55, u > 0 ? b.m.position.z : cart.position.z); }); sp.needsUpdate = true; }
    cart.rotation.z = t >= T.balloons ? -1.2 * eo(seg(t, T.balloons, T.balloons + .3)) : 0; cart.position.y = 0;
    // the tree topples at T.crash; its presents scatter
    const fall = t >= T.crash && t < T.k2 ? Math.min(1.42, 1.42 * eo(seg(t, T.crash + .05, T.crash + .7))) - (t > T.crash + .7 ? .05 * Math.exp(-(t - T.crash - .7) * 6) * Math.sin((t - T.crash - .7) * 25) : 0) : 0;
    tree.rotation.z = fall; treeL.position.set(P.tree[0] - Math.sin(fall) * 3, 3.2 - (1 - Math.cos(fall)) * 2, P.tree[1] + 1.5);
    treeGifts.forEach(g => { const u = t >= T.crash && t < T.k2 ? eo(seg(t, T.crash + .1, T.crash + .9)) : 0; g.m.position.set(g.p0.x + Math.cos(g.a) * u * 1.8, g.p0.y + Math.sin(u * Math.PI) * .6, g.p0.z + Math.abs(Math.sin(g.a)) * u * 1.4); g.m.rotation.x = u * 3; });
    gifts.forEach((g, k) => { g.visible = !(t >= T.gifts && t < T.k2 && k >= 8); });

    // —— focus subject and HUD anchors ——
    let subj;
    if (hook) subj = v3(1.0, 1.55, -1.1);
    else if (shot.id === 'chain') subj = v3(lerp(3.0, 6.6, ss(seg(t, T.chain, 12.4))), 1.0, .9);
    else if (shot.id === 'plug') subj = v3(P.socket[0], .42, P.socket[1]);
    else if (shot.id === 'chase') subj = v3(sx - .4, 1.2, P.sleigh[1]);
    else if (shot.id === 'crash' || shot.id === 'boss' || shot.id === 'hired') subj = v3(-11.4, 1.3, -.4);
    else subj = v3(1.0, 1.3, -1.0);
    const proj = (x, y, z) => { const v = v3(x, y, z).project(camera); return [(v.x * .5 + .5) * 1080, (.5 - v.y * .5) * 1920]; };
    const sp2 = santa.root.position; HUD.you = proj(sp2.x, sp2.y + 1.75, sp2.z);
    HUD.cust = proj(cust.root.position.x, cust.root.position.y + 1.85, cust.root.position.z);
    HUD.kid = proj(toddler.root.position.x, toddler.root.position.y + 1.1, toddler.root.position.z);
    HUD.cat = proj(P.cat[0], P.plat + 1.8, P.cat[1]);
    HUD.deer = proj(deer.root.position.x - .6, deer.root.position.y + 1.9, deer.root.position.z);
    HUD.boss = proj(boss.root.position.x, 2.3, boss.root.position.z);
    HUD.queue = proj(5.0, 1.6, 1.0);
    HUD.tree = proj(P.tree[0] + 2, 2.5, P.tree[1] + 1);
    return subj;
  }
  return { scene, update };
}
