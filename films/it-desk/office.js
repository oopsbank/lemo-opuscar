// The set: an open-plan office on the 12th floor on a snowy winter morning, open at the front (a diorama). Floor y 0, x[−9.5, 7.6] z[−4.6, 3.5].
// The window wall at the back (z −4.6) over a snowy skyline, with the devices in front of it: the elevator, printer, copier, coffee
// machine, vending machine, water cooler, the intern's lamp desk. Desk row A (z −.5) and row B (z 1.9), the IT help desk front left.
// The server room behind glass at the far left (the MAIN switch on its back wall); the CEO's glass office at the far right.
// Dense on purpose.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, texOf, glow, billboard, woodPlanks } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles } from './fx.js';
import { makeChar } from './chars.js';
import { T, P, DUR, VO, COMBO, ROWA, ROWB, WORKERS, walkStep, power, screens, desksUp } from './story.js';
import { HUD, VDUR as DURS } from './ui.js';
import { seg, ss, lerp, mulberry, eo } from '/core/lib.js';
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pick = (t, hz, k = 0) => (Math.floor(t * hz + k) % 2) === 0;
const vo = id => VO.find(v => v.id === id);
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

// —— office textures ——
function carpet(w, h) {   // grey-blue carpet tiles, a darker walkway
  const p = new PX(w, h), R = ramp(['#2a3040', '#384052', '#485268', '#5a6680'], .4);
  p.fill((x, y) => { const tx = x >> 4, ty = y >> 4, dir = (tx + ty) % 2, u = dir ? x : y; if (x % 16 === 0 || y % 16 === 0) return [40, 44, 58]; return R(.52 + (h2(tx, ty, 3) - .5) * .25 + ((u % 3 === 0) ? .12 : 0) + (h2(x, y, 5) - .5) * .15, x, y); });
  return p.done();
}
function screenTex(kind, k = 0) {   // 32×20 screens
  const p = new PX(32, 20);
  if (kind === 'off') { p.fill((x, y) => [10, 12, 16]); p.rect(2, 2, 6, 1, [40, 44, 56]); return p.done(); }
  if (kind === 'boot') { p.fill(() => [8, 10, 14]); p.ellipse(16, 9, 4, 4, [60, 170, 255]); p.ellipse(16, 9, 2.4, 2.4, [8, 10, 14]); p.rect(15, 4, 2, 5, [60, 170, 255]); p.rect(10, 15, 12, 1, [40, 50, 70]); p.rect(10, 15, 7, 1, [90, 200, 255]); return p.done(); }
  if (kind === 'blue' || kind === 'upd' || kind === 'upd2') {
    const pr = kind === 'upd2' ? 2 : kind === 'upd' ? 5 + k * 3 : 9;
    p.fill((x, y) => (y < 2 ? [40, 110, 230] : [24, 86, 210])); for (let i = 0; i < 4; i++) { const a = i * 1.57 + k; p.set(16 + Math.round(Math.cos(a) * 3), 6 + Math.round(Math.sin(a) * 3), [240, 248, 255]); }
    p.rect(6, 12, 20, 3, [12, 50, 150]); p.rect(6, 12, pr, 3, [240, 248, 255]); p.rect(9, 16, 14, 1, [200, 220, 255]); return p.done(); }
  if (kind === 'red') { p.fill(() => [170, 20, 30]); p.rect(14, 3, 4, 9, [255, 240, 230]); p.rect(14, 13, 4, 3, [255, 240, 230]); p.rect(5, 17, 22, 1, [255, 200, 190]); return p.done(); }
  if (kind === 'nonet') { p.fill((x, y) => (y < 2 ? [60, 64, 80] : [226, 230, 238])); p.line(12, 6, 20, 14, [220, 30, 40]); p.line(20, 6, 12, 14, [220, 30, 40]); p.line(13, 6, 21, 14, [220, 30, 40]); p.line(21, 6, 13, 14, [220, 30, 40]); p.rect(9, 16, 14, 1, [120, 120, 140]); return p.done(); }
  if (kind === 'conn') { p.fill((x, y) => (y < 2 ? [60, 64, 80] : [30, 140, 70])); for (let r = 2; r < 9; r += 3) for (let a = -.8; a <= .8; a += .05) p.set(16 + Math.round(Math.sin(a) * r), 13 - Math.round(Math.cos(a) * r), [240, 255, 240]); p.rect(15, 12, 2, 2, [240, 255, 240]); return p.done(); }
  // a desktop: a coloured wallpaper, windows, a spreadsheet or a chart
  const bgs = [[60, 120, 200], [40, 140, 120], [130, 80, 170], [200, 120, 60], [50, 60, 90]], bg = bgs[k % 5];
  p.fill((x, y) => (y < 2 ? [50, 54, 66] : bg.map(c => Math.min(255, c + (y > 12 ? 14 : 0)))));
  p.rect(3 + k % 3, 4, 18, 11, [240, 242, 246]); p.rect(3 + k % 3, 4, 18, 2, [70, 90, 140]);
  if (k % 2) for (let y = 7; y < 15; y += 2) for (let x = 4 + k % 3; x < 20 + k % 3; x += 4) p.rect(x, y, 3, 1, [140, 150, 170]);
  else for (let i = 0; i < 6; i++) p.rect(5 + k % 3 + i * 3, 14 - ((i * 7 + k * 3) % 6) - 2, 2, ((i * 7 + k * 3) % 6) + 2, [[60, 170, 90], [230, 120, 60], [60, 130, 220]][i % 3]);
  p.rect(24, 5, 5, 4, [250, 220, 90]); p.rect(24, 11, 5, 4, [250, 250, 250]); p.rect(0, 19, 32, 1, [30, 32, 40]);
  return p.done();
}
function skyline(w, h, s) {   // snowy towers across the street, lit windows in the morning gloom
  const p = new PX(w, h), R = ramp(s % 2 ? ['#3a4258', '#4c5672', '#5e6a8a', '#76829e'] : ['#4a4a58', '#5e5e70', '#74748a', '#8a8aa0'], .4);
  p.fill((x, y) => { const bw = 18 + (s % 3) * 4, b = Math.floor(x / bw), top = 6 + Math.floor(h2(b, s, 4) * 30); if (y < top) return null;
    if (y < top + 2) return [236, 242, 250]; const wx = x % 6, wy = y % 7; if (wx > 1 && wx < 5 && wy > 1 && wy < 5) return h2(x / 6 | 0, y / 7 | 0, s + b) > .55 ? [255, 222, 150] : [70, 84, 110];
    return R(.5 + (h2(b, y >> 3, s) - .5) * .2, x, y); });
  return p.done();
}
function skyTex() { const p = new PX(8, 64); p.fill((x, y) => { const u = y / 63; return [Math.round(150 + 80 * u), Math.round(170 + 70 * u), Math.round(200 + 45 * u)]; }); return p.done(); }
function rackTex(on) {   // server rack front: 1U slots with LEDs
  const p = new PX(20, 64); p.fill((x, y) => (x < 2 || x > 17 ? [30, 32, 38] : y % 4 === 0 ? [20, 22, 26] : [44, 48, 58]));
  for (let y = 1; y < 64; y += 4) for (let k = 0; k < 4; k++) { const lit = on && h2(y, k, 7) > .35; p.set(4 + k * 3, y + 1, lit ? (h2(y, k, 9) > .8 ? [255, 180, 40] : [70, 255, 110]) : [30, 50, 36]); }
  for (let y = 1; y < 64; y += 8) p.rect(14, y + 1, 2, 2, [16, 18, 22]);
  return p.done();
}
function posterTex(k) {
  const p = new PX(24, 32), bg = [[40, 60, 110], [230, 200, 80], [200, 70, 70], [60, 150, 110]][k];
  p.fill(() => bg);
  if (k === 0) { p.poly([[3, 26], [12, 6], [21, 26]], [240, 240, 250]); p.rect(4, 27, 16, 2, [250, 220, 80]); }
  if (k === 1) { p.ellipse(12, 13, 7, 7, [40, 40, 50]); p.ellipse(12, 13, 5, 5, bg); p.rect(11, 8, 2, 6, [40, 40, 50]); p.rect(12, 12, 4, 2, [40, 40, 50]); }
  if (k === 2) { for (let i = 0; i < 5; i++) p.rect(3 + i * 4, 24 - i * 4, 3, 4 + i * 4, [250, 240, 230]); }
  if (k === 3) { p.ellipse(12, 12, 6, 6, [250, 240, 200]); p.rect(6, 22, 12, 2, [250, 240, 200]); p.rect(8, 25, 8, 2, [250, 240, 200]); }
  for (let x = 0; x < 24; x++) { p.set(x, 0, [20, 20, 24]); p.set(x, 31, [20, 20, 24]); } for (let y = 0; y < 32; y++) { p.set(0, y, [20, 20, 24]); p.set(23, y, [20, 20, 24]); }
  return p.done();
}
function plantTex() { const p = new PX(20, 26); for (let k = 0; k < 9; k++) { const a = -1.3 + k * .32; p.line(10, 25, 10 + Math.round(Math.sin(a) * 9), 25 - Math.round(Math.cos(a) * 16 + (k % 2) * 4), [50 + k * 8, 130 + k * 6, 50]); p.ellipse(10 + Math.sin(a) * 9, 25 - Math.cos(a) * 16 - (k % 2) * 4, 2.4, 1.6, [70, 170, 70]); } return p.done(); }
function whiteboardTex() {
  const p = new PX(64, 36); p.fill(() => [240, 242, 244]);
  const ink = [[40, 60, 160], [200, 40, 50], [30, 130, 70]];
  p.rect(4, 4, 22, 1, ink[0]); p.rect(4, 8, 16, 1, ink[0]); p.rect(4, 12, 19, 1, ink[0]);
  for (let i = 0; i < 6; i++) p.rect(34 + i * 4, 30 - (i * 5 % 17) - 4, 3, (i * 5 % 17) + 4, ink[i % 3]);
  p.line(34, 30, 60, 30, [40, 40, 50]); p.line(34, 8, 34, 30, [40, 40, 50]);
  p.ellipse(14, 24, 8, 5, ink[1]); p.ellipse(14, 24, 7, 4, [240, 242, 244]); p.rect(11, 23, 7, 1, ink[1]);
  return p.done();
}
function hazard(w, h) { const p = new PX(w, h); p.fill((x, y) => (((x + y) >> 2) % 2 ? [250, 200, 30] : [26, 24, 28])); return p.done(); }

export function buildOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9aaccc');
  scene.fog = new THREE.FogExp2(new THREE.Color('#b8c4d8'), .004);
  const R = mulberry(31);

  // —— lights: daylight through the window wall (always), the ceiling panels (on the building's power), screen glow ——
  const key = new THREE.DirectionalLight('#e8f0ff', 1.3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 60 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(-1, 0, -1); key.position.set(-3, 16, 12); scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', .6); fill.position.set(-2, 6, -16); scene.add(fill);   // the window: a cool rim from behind
  const hemi = new THREE.HemisphereLight('#dce6ff', '#5a5060', .75); scene.add(hemi);
  const panelsL = [-6, -3, 0, 3, 6].map(x => { const L = new THREE.PointLight('#f4f8ff', 3, 7, 1.4); L.position.set(x, 3.2, -.5); scene.add(L); return L; });
  const panelsL2 = [-7.8, 5.2].map(x => { const L = new THREE.PointLight('#f4f8ff', 2.4, 5, 1.4); L.position.set(x, 3.0, -2.8); scene.add(L); return L; });
  const blueL = new THREE.PointLight('#5a9cff', 0, 5, 1.2); blueL.position.set(5.0, 1.7, -.4); scene.add(blueL);
  const warmKey = new THREE.SpotLight('#fff0e0', 0, 9, .55, .6, 1.2); warmKey.position.set(5.0, 2.9, 1.6); warmKey.target.position.set(5.0, 1.7, -2.0); scene.add(warmKey, warmKey.target);
  const sparkL = new THREE.PointLight('#ffc040', 0, 4, 1.5); sparkL.position.set(P.main[0], 1.6, P.main[1] + .4); scene.add(sparkL);
  const redL = new THREE.PointLight('#ff2a2a', 0, 6, 1.4); redL.position.set(-1, 2.6, -2); scene.add(redL);

  // —— floor, walls, ceiling bulkhead ——
  scene.add(mesh(new THREE.BoxGeometry(17.2, .2, 8.2).translate(-1, -.1, -.5), mat(carpet(96, 96), { rough: .95 }), { cast: false }));
  const wallM = std('#d8dce4', { r: .85 }), darkWallM = std('#2a3040', { r: .8 }), frameM = std('#3a3e48', { m: .5, r: .4 });
  const glassM = new THREE.MeshStandardMaterial({ color: '#cfe4f4', roughness: .05, metalness: .2, transparent: true, opacity: .16, depthWrite: false });
  // the window wall: a sill, tall panes, a bulkhead with ducts above
  { const sill = box(11.2, .9, .3, wallM, { cast: false }); sill.position.set(-1.0, 0, -4.75); scene.add(sill);
    const bulk = box(17.2, 1.2, .5, wallM, { cast: false }); bulk.position.set(-1, 3.8, -4.75); scene.add(bulk);
    for (let x = -6.4; x <= 4.4; x += 1.35) { const m = box(.09, 2.9, .14, frameM); m.position.set(x, .9, -4.62); scene.add(m); }
    const tr = box(11.2, .07, .14, frameM); tr.position.set(-1, 2.35, -4.62); scene.add(tr);
    const pane = quad(11.2, 2.9, glassM); pane.position.set(-1, 2.35, -4.64); scene.add(pane);
    const lvl = quad(1.4, .36, basic(pixText([{ t: 'LEVEL 12', s: 9, b: 1, c: '#2a3040', y: .55 }], { w: 64, h: 16, bg: '#e8ecf2' }), { em: .3 })); lvl.position.set(-5.4, 4.3, -4.48); scene.add(lvl);
    for (let x = -9; x < 7.5; x += 2.6) { const d = box(.36, .36, 7.6, std('#9aa0ac', { m: .6, r: .4 }), { cast: false }); d.position.set(x, 4.5, -.8); scene.add(d); } }
  // the sky and the skyline (behind the glass)
  { const sky = quad(60, 22, new THREE.MeshBasicMaterial({ map: texOf(skyTex()), fog: false })); sky.position.set(-1, 6, -40); scene.add(sky);
    for (let k = 0; k < 3; k++) { const sl = quad(26, 10, new THREE.MeshStandardMaterial({ map: texOf(skyline(160, 64, k)), transparent: true, alphaTest: .5, emissive: '#ffffff', emissiveIntensity: .25 - k * .05, roughness: 1 }));
      sl.material.emissiveMap = sl.material.map; sl.position.set(-1 + (k - 1) * 3, 1.0 + k * 1.2, -14 - k * 7); scene.add(sl); } }
  const snowfall = particles(260, (i, t, o) => { const H = 6, y = H - ((t * (.3 + h2(i, 3, 9) * .2) + h2(i, 1, 9) * H) % H); o.x = -7 + h2(i, 2, 9) * 12 + Math.sin(t * .7 + i) * .25; o.z = -5.1 - h2(i, 4, 9) * 7; o.y = y; o.s = .035; o.r = o.g = o.b = 1; o.a = .9; }, { blend: THREE.NormalBlending });
  scene.add(snowfall);
  // the ceiling panels (they light in rows when the power comes back), hung on wires
  const panelOn = std('#ffffff', { e: '#f4f8ff', ei: 2.2 }), panelOff = std('#9aa0ac', { r: .5 });
  const panels = [];
  for (const z of [-3.2, -1.2, .9]) for (let x = -8.4; x < 7; x += 2.1) { const pn = box(1.2, .05, .5, panelOn, { cast: false }); pn.position.set(x, 3.4, z); scene.add(pn); panels.push({ m: pn, z, x }); for (const dx of [-.5, .5]) { const w = box(.01, .8, .01, std('#2a2a30'), { cast: false }); w.position.set(x + dx, 3.45, z); scene.add(w); } }

  { const bn = quad(3.4, .55, basic(pixText([{ t: 'Q4 GOAL: ZERO DOWNTIME', s: 9, b: 1, c: '#fbf6ea', y: .55 }], { w: 140, h: 22, bg: '#2c5aa0', border: '#f0c84a' }), { em: .45 })); bn.position.set(-1.9, 3.05, -2.6); scene.add(bn);
    for (const dx of [-1.6, 1.6]) { const w = box(.01, .9, .01, std('#2a2a30'), { cast: false }); w.position.set(-1.9 + dx, 3.3, -2.6); scene.add(w); } }
  // —— the server room (far left, behind glass): racks, cable trays, the MAIN switch ——
  { const sw = box(3.2, 4.6, .3, darkWallM, { cast: false }); sw.position.set(-8.0, 0, -4.75); scene.add(sw);
    const side = box(.3, 4.6, 8.2, wallM, { cast: false }); side.position.set(-9.65, 0, -.5); scene.add(side);
    for (const [z0, z1] of [[-4.6, -2.6], [-1.6, -.9]]) { const gp = quad(z1 - z0, 2.6, glassM); gp.rotation.y = Math.PI / 2; gp.position.set(-6.4, 1.3, (z0 + z1) / 2); scene.add(gp);
      for (const z of [z0, z1]) { const fr = box(.08, 2.6, .08, frameM); fr.position.set(-6.4, 0, z); scene.add(fr); } }
    const hd = box(.1, .1, 3.7, frameM); hd.position.set(-6.4, 2.6, -2.75); scene.add(hd);
    const sign = quad(1.0, .3, basic(pixText([{ t: 'SERVER ROOM', s: 8, b: 1, c: '#fbf6ea', y: .32 }, { t: 'AUTHORIZED ONLY', s: 6, c: '#ffd23a', y: .75 }], { w: 64, h: 20, bg: '#2a3040', border: '#ffd23a' }), { em: .6 }));
    sign.rotation.y = Math.PI / 2; sign.position.set(-6.35, 2.3, -2.1); scene.add(sign);
    const floorS = box(3.1, .02, 3.8, std('#3a3e48', { r: .5, m: .3 }), { cast: false }); floorS.position.set(-8.0, 0, -2.7); scene.add(floorS);
    for (let x = -9.4; x < -6.5; x += .3) for (let z = -4.5; z < -.9; z += .3) { const tl = box(.28, .005, .28, std('#4a4e58'), { cast: false }); tl.position.set(x + .15, .02, z + .15); scene.add(tl); } }
  const rackOn = basic(rackTex(true), { em: 1.2 }), rackOn2 = basic(rackTex(true), { em: 1.2 }), rackOff = basic(rackTex(false), { em: .1 });
  rackOn2.map.offset.y = .5; rackOn2.map.wrapT = THREE.RepeatWrapping; rackOn2.emissiveMap = rackOn2.map;
  const racks = [];
  for (const [x, z, ry] of [[-9.05, -4.25, 0], [-8.45, -4.25, 0], [-6.85, -4.25, 0], [-9.3, -3.3, Math.PI / 2], [-9.3, -2.6, Math.PI / 2]]) {
    const r = new THREE.Group(); const body = box(.56, 2.1, .7, std('#1a1c22', { m: .4, r: .4 })); r.add(body); const fr = quad(.5, 2.0, rackOn); fr.position.set(0, 1.05, .36); r.add(fr);
    r.position.set(x, 0, z); r.rotation.y = ry; scene.add(r); racks.push(fr); }
  for (let k = 0; k < 6; k++) { const cb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(-9.2 + k * .08, 2.1, -4.3), v3(-8.6 + k * .06, 2.6 + k * .03, -3.6), v3(-7.2, 2.5 + k * .04, -4.1), v3(-6.9 + k * .05, 2.1, -4.25)]), 16, .018, 5), std(['#2c5aa0', '#d8604a', '#f0c84a', '#3a8a5a', '#9448c0', '#1a1a20'][k], { r: .6 })); scene.add(cb); }
  const tray = box(2.8, .06, .3, std('#7a808c', { m: .7, r: .3 }), { cast: false }); tray.position.set(-8.0, 2.75, -4.1); scene.add(tray);
  // the MAIN switch: a grey cabinet on hazard stripes, a big red lever, DO NOT TOUCH
  const lever = new THREE.Group();
  { const hz = quad(1.0, 1.4, basic(hazard(32, 44))); hz.position.set(P.main[0], 1.35, -4.59); scene.add(hz);
    const cab = box(.72, 1.0, .22, std('#8a909c', { m: .5, r: .35 })); cab.position.set(P.main[0], .85, -4.5); scene.add(cab);
    const lab = quad(.5, .14, basic(pixText([{ t: 'MAIN', s: 9, b: 1, c: '#fbf6ea', y: .55 }], { w: 40, h: 12, bg: '#c41a26' }), { em: .5 })); lab.position.set(P.main[0], 1.7, -4.38); scene.add(lab);
    const dnt = quad(.56, .2, basic(pixText([{ t: 'DO NOT', s: 7, b: 1, c: '#1a1016', y: .3 }, { t: 'TOUCH', s: 7, b: 1, c: '#c41a26', y: .76 }], { w: 40, h: 16, bg: '#ffd23a', border: '#1a1016' }), { em: .4 }));
    dnt.position.set(P.main[0] + .02, 1.05, -4.27); dnt.rotation.z = -.08; scene.add(dnt);
    const slot = box(.06, .5, .02, std('#1a1a20')); slot.position.set(P.main[0] - .22, 1.15, -4.38); scene.add(slot);
    const arm = box(.05, .36, .05, std('#2a2a30', { m: .6 })); arm.position.set(0, 0, .06); lever.add(arm);
    const knobL = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 8), std('#e01a26', { r: .3, e: '#600008', ei: .6 })); knobL.position.set(0, .38, .08); lever.add(knobL);
    lever.position.set(P.main[0] - .22, 1.4, -4.38); scene.add(lever);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), std('#ffffff', { e: '#40ff60', ei: 2 })); lamp.position.set(P.main[0] + .2, 1.62, -4.38); scene.add(lamp); lever.userData.lamp = lamp; }

  // —— the window-wall devices: elevator, printer, copier, coffee machine, vending machine, water cooler ——
  const metal = std('#c8ccd4', { m: .7, r: .3 }), white = std('#eceef2', { r: .5 }), grey = std('#5a606c', { r: .5, m: .2 });
  const elev = {};
  { const ex = P.elevator, surround = box(1.7, 2.6, .2, std('#a8acb8', { m: .6, r: .3 })); surround.position.set(ex, 0, -4.48); scene.add(surround);
    elev.L = box(.62, 2.3, .06, metal); elev.R = box(.62, 2.3, .06, metal); for (const d of [elev.L, elev.R]) { d.position.z = -4.34; scene.add(d); }
    const inside = quad(1.2, 2.3, std('#c8a878', { r: .6 })); inside.position.set(ex, 1.15, -4.37); scene.add(inside);
    elev.ind = quad(.5, .18, basic(pixText([{ t: '12 ▲', s: 8, b: 1, c: '#ff6a3a', y: .55 }], { w: 32, h: 12, bg: '#140808' }), { em: 2 })); elev.ind.position.set(ex, 2.45, -4.37); scene.add(elev.ind);
    const btn = box(.08, .16, .04, std('#2a2a30')); btn.position.set(ex + .95, 1.1, -4.4); scene.add(btn); }
  const dev = {};
  { const x = COMBO[0].x, g = new THREE.Group(); const b = box(.8, .75, .6, white); g.add(b); const top = box(.7, .18, .5, std('#d0d4dc')); top.position.y = .75; g.add(top); const tray0 = box(.5, .04, .3, grey); tray0.position.set(0, .95, .15); g.add(tray0);
    const st = box(.8, .05, .62, grey); g.add(st); const scr = quad(.16, .1, std('#80c0ff', { e: '#3a8cff', ei: 1.2 })); scr.position.set(.25, .85, .26); scr.rotation.x = -.6; g.add(scr);
    g.position.set(x, 0, P.devZ); scene.add(g); dev.printer = g; dev.printerScr = scr; }
  { const x = COMBO[1].x, g = new THREE.Group(); const b = box(1.0, .95, .7, std('#e4e6ea', { r: .5 })); g.add(b); const lid = box(.95, .06, .65, grey); lid.position.y = .95; g.add(lid); const pnl = box(.35, .08, .2, std('#2a2e38')); pnl.position.set(.3, 1.01, .15); g.add(pnl);
    const bar = quad(.8, .05, std('#ffffff', { e: '#b8ffb0', ei: 3 })); bar.position.set(0, .7, .36); g.add(bar); for (let k = 0; k < 3; k++) { const d = box(.9, .02, .02, grey); d.position.set(0, .2 + k * .2, .36); g.add(d); }
    g.position.set(x, 0, P.devZ); scene.add(g); dev.copier = g; dev.copierBar = bar; }
  { const x = COMBO[2].x, g = new THREE.Group(); const stand = box(.9, .85, .55, std('#5a4030', { r: .7 })); g.add(stand); const top0 = box(.95, .04, .6, std('#e8e2d4')); top0.position.y = .85; g.add(top0);
    const m = box(.45, .6, .4, std('#b8bcc6', { m: .7, r: .3 })); m.position.set(0, .89, 0); g.add(m); const d = quad(.18, .08, std('#ffffff', { e: '#ffb060', ei: 1.2 })); d.position.set(0, 1.35, .21); g.add(d);
    for (let k = 0; k < 6; k++) { const mg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 8).translate(0, .05, 0), std(['#f4f0e6', '#2c5aa0', '#d8604a', '#3a8a5a', '#f0c84a', '#9448c0'][k], { r: .4 })); mg.position.set(-.38 + (k % 3) * .1 + (k > 2 ? .58 : 0), .89, .1); g.add(mg); }
    g.position.set(x, 0, P.devZ); scene.add(g); dev.coffee = g; dev.coffeeD = d; }
  { const x = COMBO[3].x, g = new THREE.Group(); const b = box(.95, 1.9, .75, std('#c42232', { r: .4, m: .2 })); g.add(b);
    const win = quad(.6, 1.3, new THREE.MeshStandardMaterial({ map: texOf((() => { const p = new PX(24, 48); p.fill(() => [24, 28, 36]); for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const col = [[220, 40, 40], [40, 120, 220], [240, 200, 40], [60, 180, 90], [240, 120, 40]][(r + c * 2) % 5]; p.rect(2 + c * 5, 3 + r * 7, 4, 5, col); p.rect(2 + c * 5, 3 + r * 7, 4, 1, [250, 250, 250]); p.rect(1, 9 + r * 7, 22, 1, [140, 144, 150]); } return p.done(); })()), emissive: '#ffffff', emissiveIntensity: .5, roughness: .3 }));
    win.material.emissiveMap = win.material.map; win.position.set(-.1, 1.15, .38); g.add(win); const slot = box(.5, .14, .05, std('#111')); slot.position.set(-.1, .2, .38); g.add(slot);
    const logo = quad(.8, .16, basic(pixText([{ t: 'SNACKS', s: 8, b: 1, c: '#fbf6ea', y: .55 }], { w: 48, h: 10, bg: '#c42232' }), { em: .6 })); logo.position.set(0, 1.95, .38); logo.rotation.x = 0; g.add(logo);
    g.position.set(x, 0, P.devZ - .05); scene.add(g); dev.vending = g; dev.vendWin = win; }
  { const g = new THREE.Group(), b = box(.35, .9, .35, white); g.add(b); const bt = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .45, 12).translate(0, .22, 0), new THREE.MeshStandardMaterial({ color: '#8ac8f8', transparent: true, opacity: .6, roughness: .1 })); bt.position.y = .9; g.add(bt); g.position.set(1.2, 0, P.devZ); scene.add(g); }
  // the intern's little desk, the desk lamp
  const lampL = new THREE.PointLight('#ffd890', 2, 2.2, 1.6); lampL.position.set(P.internDesk[0] + .35, 1.15, P.internDesk[1] + .1); scene.add(lampL);
  let lampBulb;
  { const g = new THREE.Group(), tp = box(1.1, .04, .6, std('#e8e2d4')); tp.position.y = .72; g.add(tp); for (const dx of [-.5, .5]) { const l = box(.04, .72, .5, grey); l.position.set(dx, 0, 0); g.add(l); }
    const arm = box(.03, .4, .03, std('#2a2a30')); arm.position.set(.35, .74, -.1); arm.rotation.z = .3; g.add(arm); const sh = new THREE.Mesh(new THREE.ConeGeometry(.12, .14, 10, 1, true), std('#2c5aa0', { r: .5 })); sh.material.side = THREE.DoubleSide; sh.position.set(.3, 1.12, -.05); sh.rotation.z = -.5; g.add(sh);
    lampBulb = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), std('#fff2c0', { e: '#ffd060', ei: 3 })); lampBulb.position.set(.33, 1.06, -.04); g.add(lampBulb);
    const ppr = box(.3, .08, .22, std('#f4f0e6')); ppr.position.set(-.25, .74, .05); g.add(ppr); const mg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .035, .09, 8).translate(0, .045, 0), std('#d8604a')); mg.position.set(-.05, .74, .1); g.add(mg);
    g.position.set(P.internDesk[0], 0, P.internDesk[1]); scene.add(g); }
  // the wall between: whiteboards, posters, a clock, plants
  const plantT = texOf(plantTex()), potM = std('#e8e4dc', { r: .8 }), faced = [];
  { for (const [k, x, y] of [[0, -6.0, 2.0], [2, 2.9, 2.6]]) { const pq = quad(.62, .82, basic(posterTex(k), { rough: .7 })); pq.position.set(x, y, -4.45); scene.add(pq); }
    const wb = quad(1.6, .9, basic(whiteboardTex(), { rough: .3 })); wb.position.set(-3.3, 3.1, -4.45); scene.add(wb);
    const ck = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .05, 20), std('#f4f0e6')); ck.rotation.x = Math.PI / 2; ck.position.set(.6, 3.3, -4.45); scene.add(ck); for (const [l, r] of [[.18, .5], [.12, 3.0]]) { const h = box(.02, l, .02, std('#1a1a20')); h.rotation.z = r; h.position.set(.6, 3.3, -4.4); scene.add(h); }
    for (const [x, z, s] of [[-6.1, -3.9, 1.3], [1.75, -4.1, 1.1], [3.0, -.6, 1.2], [-5.9, 2.6, 1.3], [2.9, 2.8, 1.1], [7.1, -3.9, 1.3]]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22 * s, .18 * s, .42 * s, 10).translate(0, .21 * s, 0), potM); pot.position.set(x, 0, z); scene.add(pot);
      const lv = billboard(plantT, .9 * s, 1.15 * s, {}); lv.position.set(x, .36 * s, z); scene.add(lv); faced.push(lv); } }

  // —— the desks: rows A and B (standing desks that ride up and down in the cascade), monitors, keyboards, mugs, clutter ——
  const deskTop = std('#e8e2d4', { r: .6 }), legM = std('#3a3e48', { m: .6, r: .4 }), partM = std('#4a6a8a', { r: .9 });
  const monitors = [], deskTops = [];
  const MON = { desk: [0, 1, 2, 3, 4].map(k => basic(screenTex('desk', k), { em: 1.1 })), off: basic(screenTex('off'), { em: .2 }), boot: basic(screenTex('boot'), { em: 1.4 }),
    blue: basic(screenTex('blue', 0), { em: 1.6 }), upd: [0, 1, 2].map(k => basic(screenTex('upd', k), { em: 1.6 })), upd2: basic(screenTex('upd2'), { em: 1.6 }), red: basic(screenTex('red'), { em: 1.8 }),
    nonet: basic(screenTex('nonet'), { em: .55 }), conn: basic(screenTex('conn'), { em: 1.5 }) };
  const mkMonitor = (sx = .5) => { const g = new THREE.Group(); const st = box(.06, .1, .06, legM); g.add(st); const ft = box(.22, .02, .14, legM); g.add(ft); const fr = box(sx + .04, sx * .64 + .04, .04, std('#1a1c22', { r: .4 })); fr.position.y = .08; g.add(fr);
    const sc = quad(sx, sx * .62, MON.desk[0]); sc.position.set(0, .08 + (sx * .64 + .04) / 2, .025); g.add(sc); const pb = box(.03, .02, .01, std('#1a1c22', { e: '#40ff60', ei: 1 })); pb.position.set(sx / 2 - .04, .09, .025); g.add(pb); g.userData.sc = sc; g.userData.pb = pb; return g; };
  const desk = (x, z, k, o = {}) => { const g = new THREE.Group(), top = new THREE.Group(); g.add(top);
    const tp = box(1.2, .04, .7, deskTop); tp.position.y = .72; top.add(tp); for (const dx of [-.55, .55]) { const l = box(.05, .72, .6, legM); l.position.set(dx, 0, 0); g.add(l); }
    const part = box(1.2, .42, .04, partM); part.position.set(0, .76, -.33); top.add(part);
    const n = o.one ? 1 : 2; for (let i = 0; i < n; i++) { const m = mkMonitor(o.big ? .56 : .42); m.position.set(n === 1 ? 0 : (i - .5) * .52, .76, -.12); m.rotation.y = n === 1 ? 0 : (i - .5) * -.25; top.add(m); monitors.push({ g: m, k: (k + i) % 5, x: x + m.position.x, id: o.id ? o.id + i : null }); }
    const kb = box(.42, .02, .14, std('#2a2e38')); kb.position.set(0, .76, .17); top.add(kb); const ms = box(.06, .02, .09, std('#2a2e38')); ms.position.set(.3, .76, .18); top.add(ms);
    const mg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 8).translate(0, .05, 0), std(['#f4f0e6', '#2c5aa0', '#d8604a', '#3a8a5a', '#f0c84a'][k % 5], { r: .4 })); mg.position.set(-.45, .76, .15); top.add(mg);
    if (k % 2) { const st = box(.06, .06, .002, std('#ffe070')); st.position.set(.2, .95, -.08); top.add(st); const st2 = box(.06, .06, .002, std('#ff9ab0')); st2.position.set(-.18, 1.0, -.06); top.add(st2); }
    if (k % 3 === 0) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .08, 8).translate(0, .04, 0), potM); pl.position.set(.5, .76, -.15); top.add(pl); const lv = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), std('#3a8a4a', { r: .9 })); lv.position.set(.5, .9, -.15); top.add(lv); }
    if (k % 3 === 1) { for (let j = 0; j < 4; j++) { const pp = box(.24, .025, .32, std(j % 2 ? '#f4f0e6' : '#e0dcd0')); pp.position.set(-.38, .76 + j * .025, -.1); pp.rotation.y = j * .1; top.add(pp); } }
    const chair = new THREE.Group(); { const seat = box(.44, .07, .42, std('#2a2e38')); seat.position.y = .46; chair.add(seat); const bk = box(.42, .5, .06, std('#2a2e38')); bk.position.set(0, .5, -.2); chair.add(bk); const post = box(.05, .45, .05, legM); chair.add(post);
      for (let j = 0; j < 5; j++) { const a = j * 1.256, leg = box(.24, .03, .03, legM); leg.position.set(Math.cos(a) * .12, .03, Math.sin(a) * .12); leg.rotation.y = -a; chair.add(leg); } }
    chair.position.set(0, 0, -.65); chair.rotation.y = .3 * (k % 2 ? 1 : -1); g.add(chair);
    g.position.set(x, 0, z); scene.add(g); deskTops.push({ top, x, z, k, chair }); return g; };
  ROWA.forEach((x, i) => desk(x, P.w1Desk[1], i, { id: x === P.w1Desk[0] ? 'w1' : null }));
  ROWB.forEach((x, i) => desk(x, 1.9, i + 3));
  // the help desk: a sign, three monitors, spare keyboards, a toolbox, the TICKETS board
  { desk(P.help[0], P.help[1], 2, { one: true, big: true });
    const sign = quad(1.3, .32, basic(pixText([{ t: 'IT HELP DESK', s: 9, b: 1, c: '#1a1016', y: .55 }], { w: 72, h: 16, bg: '#86d636', border: '#1a1016' }), { em: .5 })); sign.position.set(P.help[0], 2.35, P.help[1]); scene.add(sign);
    for (const dx of [-.5, .5]) { const w = box(.01, 1.0, .01, std('#2a2a30'), { cast: false }); w.position.set(P.help[0] + dx, 2.5, P.help[1]); scene.add(w); }
    for (let k = 0; k < 5; k++) { const kb = box(.42, .025, .14, std(['#2a2e38', '#d0d4dc'][k % 2])); kb.position.set(P.help[0] + .85, k * .03, P.help[1] + .2); kb.rotation.y = k * .2; scene.add(kb); }
    const tb = box(.4, .22, .22, std('#c42232', { r: .5 })); tb.position.set(P.help[0] - .85, 0, P.help[1] + .2); scene.add(tb);
    const cab = new THREE.Mesh(new THREE.TorusGeometry(.12, .015, 6, 16), std('#1a1a20')); cab.rotation.x = Math.PI / 2; cab.position.set(P.help[0] - .3, .78, P.help[1] + .15); scene.add(cab);
    const tk = quad(.7, .5, basic(pixText([{ t: 'TICKETS', s: 7, b: 1, c: '#c41a26', y: .14 }, { t: '#0412 PRINTER', s: 5, c: '#1a1016', y: .38, x: .08, al: 'left' }, { t: '#0413 WIFI??', s: 5, c: '#1a1016', y: .56, x: .08, al: 'left' }, { t: '#0414 MOUSE', s: 5, c: '#1a1016', y: .74, x: .08, al: 'left' }, { t: '#0415 CEO', s: 5, c: '#c41a26', y: .92, x: .08, al: 'left' }], { w: 64, h: 44, bg: '#f4f2ec', border: '#3a3e48' }), { em: .2 }));
    tk.position.set(P.help[0] - 1.1, 1.5, P.help[1] - .3); tk.rotation.y = .35; scene.add(tk); const tkp = box(.04, 1.25, .04, legM); tkp.position.set(P.help[0] - 1.1, 0, P.help[1] - .32); scene.add(tkp); }

  // —— the CEO's office (far right, behind glass): the big desk, his monitor, the PC tower and its cable, the router, a shelf ——
  const ceo = {};
  { const side = box(.3, 4.6, 8.2, wallM, { cast: false }); side.position.set(7.75, 0, -.5); scene.add(side);
    for (const [z0, z1] of [[-4.6, -1.9], [-1.1, -.6]]) { const gp = quad(z1 - z0, 2.7, glassM); gp.rotation.y = Math.PI / 2; gp.position.set(3.2, 1.35, (z0 + z1) / 2); scene.add(gp); for (const z of [z0, z1]) { const fr = box(.08, 2.7, .08, frameM); fr.position.set(3.2, 0, z); scene.add(fr); } }
    const hd = box(.1, .1, 4.0, frameM); hd.position.set(3.2, 2.7, -2.6); scene.add(hd);
    const np = quad(.9, .26, basic(pixText([{ t: 'CEO', s: 9, b: 1, c: '#f0d27a', y: .55 }], { w: 40, h: 12, bg: '#14182a', border: '#c89a38' }), { em: .7 })); np.rotation.y = Math.PI / 2; np.position.set(3.25, 2.3, -1.5); scene.add(np);
    const rug = box(3.2, .012, 2.4, std('#6a1a24', { r: 1 }), { cast: false }); rug.position.set(5.4, 0, -2.6); scene.add(rug);
    const woodM = mat(woodPlanks(96, 96, { pw: 8, len: 96, seed: 9, cols: ['#2a160c', '#3e2214', '#56321e', '#6e4428', '#84562e'], nails: false }));
    const dk = mesh(new THREE.BoxGeometry(1.9, .76, .85).translate(0, .38, 0), woodM); dk.position.set(P.ceoDesk[0], 0, P.ceoDesk[1]); scene.add(dk);
    const dtop = box(2.0, .04, .92, std('#1a120c', { r: .3 })); dtop.position.set(P.ceoDesk[0], .76, P.ceoDesk[1]); scene.add(dtop);
    const mon = mkMonitor(.7); mon.position.set(P.ceoDesk[0] - .15, .8, P.ceoDesk[1] - .1); scene.add(mon); ceo.mon = mon;
    const kb = box(.5, .025, .16, std('#d8dce4')); kb.position.set(P.ceoDesk[0] - .15, .8, P.ceoDesk[1] + .25); scene.add(kb); ceo.kb = kb;
    const mug = quad(.18, .14, basic(pixText([{ t: 'WORLD’S', s: 5, b: 1, c: '#1a1016', y: .3 }, { t: 'BEST CEO', s: 5, b: 1, c: '#c41a26', y: .72 }], { w: 32, h: 24, bg: '#fbf6ea' })));
    const mg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .055, .14, 10).translate(0, .07, 0), std('#fbf6ea')); mg.position.set(P.ceoDesk[0] + .55, .8, P.ceoDesk[1] + .15); scene.add(mg); mug.position.set(P.ceoDesk[0] + .55, .87, P.ceoDesk[1] + .215); scene.add(mug);
    const ph = box(.16, .06, .2, std('#1a1c22')); ph.position.set(P.ceoDesk[0] + .75, .8, P.ceoDesk[1] - .15); scene.add(ph);
    const fr = box(.16, .2, .02, std('#c89a38', { m: .7, r: .3 })); fr.position.set(P.ceoDesk[0] - .75, .8, P.ceoDesk[1] - .2); fr.rotation.y = .4; scene.add(fr);
    // the PC tower on the floor at the right of the desk, its power cable dangling to the socket — unplugged
    const tower = box(.22, .48, .46, std('#1a1c22', { m: .3, r: .4 })); tower.position.set(P.ceoDesk[0] + 1.15, 0, P.ceoDesk[1] + .1); scene.add(tower);
    const tled = new THREE.Mesh(new THREE.SphereGeometry(.015, 6, 4), std('#ffffff', { e: '#40a0ff', ei: 0 })); tled.position.set(P.ceoDesk[0] + 1.15, .4, P.ceoDesk[1] + .34); scene.add(tled); ceo.tled = tled;
    const SX = P.ceoDesk[0] + 1.05, sock = box(.14, .14, .02, std('#f4f0e6')); sock.position.set(SX, .18, -4.01); scene.add(sock);
    for (const dx of [-.03, .03]) { const h = box(.014, .035, .005, std('#1a1a20')); h.position.set(SX + dx, .24, -3.995); scene.add(h); }
    const cabOut = new THREE.CatmullRomCurve3([v3(P.ceoDesk[0] + 1.2, .25, P.ceoDesk[1] - .14), v3(P.ceoDesk[0] + 1.3, .05, -2.9), v3(P.ceoDesk[0] + 1.5, .02, -3.3), v3(P.ceoDesk[0] + 1.45, .03, -3.55)]);
    const cabIn = new THREE.CatmullRomCurve3([v3(P.ceoDesk[0] + 1.2, .25, P.ceoDesk[1] - .14), v3(P.ceoDesk[0] + 1.25, .05, -3.1), v3(P.ceoDesk[0] + 1.1, .04, -3.8), v3(P.ceoDesk[0] + 1.05, .24, -3.98)]);
    ceo.cabOut = new THREE.Mesh(new THREE.TubeGeometry(cabOut, 20, .015, 5), std('#1a1a20')); ceo.cabIn = new THREE.Mesh(new THREE.TubeGeometry(cabIn, 20, .015, 5), std('#1a1a20')); scene.add(ceo.cabOut, ceo.cabIn);
    ceo.plug = box(.06, .04, .08, std('#f4f0e6')); ceo.plug.position.set(P.ceoDesk[0] + 1.45, .03, -3.6); scene.add(ceo.plug);
    // the router on a credenza, blinking; a shelf of trophies and books; a golf bag; a leather chair
    const cred = box(1.6, .7, .45, woodM); cred.position.set(6.6, 0, -4.25); scene.add(cred);
    const rt = box(.3, .06, .2, std('#f4f6f8')); rt.position.set(6.2, .7, -4.2); scene.add(rt); for (const dx of [-.1, .1]) { const an = box(.015, .2, .015, std('#f4f6f8')); an.position.set(6.2 + dx, .76, -4.28); an.rotation.z = dx * 3; scene.add(an); }
    ceo.rleds = [0, 1, 2, 3].map(k => { const l = new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 4), std('#ffffff', { e: '#40ff60', ei: 2 })); l.position.set(6.1 + k * .06, .74, -4.09); scene.add(l); return l; });
    for (let k = 0; k < 3; k++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .22, 8).translate(0, .11, 0), std('#d8b040', { m: .8, r: .25 })); tr.position.set(6.7 + k * .22, .7, -4.25); scene.add(tr); }
    for (let row = 0; row < 3; row++) { const sh = box(1.4, .04, .3, woodM); sh.position.set(6.7, 1.3 + row * .5, -4.45); scene.add(sh); for (let k = 0; k < 10; k++) { const bk = box(.09, .24 + h2(row, k, 3) * .1, .22, std(['#8a2a1a', '#2c5aa0', '#c8961c', '#3a8a5a', '#f4f0e6', '#1a1c22'][(row * 4 + k) % 6], { r: .8 })); bk.position.set(6.1 + k * .12, 1.34 + row * .5, -4.42); scene.add(bk); } }
    const bag = new THREE.Mesh(new THREE.CylinderGeometry(.14, .12, .8, 10).translate(0, .4, 0), std('#2a4a7a', { r: .6 })); bag.position.set(7.2, 0, -2.0); bag.rotation.z = .12; scene.add(bag); for (let k = 0; k < 3; k++) { const cl = box(.02, .35, .02, metal); cl.position.set(7.15 + k * .05, .8, -2.0); scene.add(cl); }
    const chair = new THREE.Group(); { const seat = box(.6, .12, .55, std('#3a1a10', { r: .4 })); seat.position.y = .45; chair.add(seat); const bk = box(.6, .9, .14, std('#3a1a10', { r: .4 })); bk.position.set(0, .5, -.25); chair.add(bk); } chair.position.set(P.ceoDesk[0] - .1, 0, P.ceoDesk[1] - .8); scene.add(chair);
    const art = quad(1.0, .7, basic(posterTex(1), { rough: .7 })); art.rotation.y = -Math.PI / 2; art.position.set(7.58, 2.0, -1.8); scene.add(art);
    const award = quad(.6, .45, basic(pixText([{ t: 'CEO OF', s: 6, b: 1, c: '#f0d27a', y: .3 }, { t: 'THE YEAR', s: 6, b: 1, c: '#f0d27a', y: .7 }], { w: 40, h: 28, bg: '#14182a', border: '#c89a38' }), { em: .3 })); award.rotation.y = -Math.PI / 2; award.position.set(7.58, 1.6, -3.2); scene.add(award); }

  // —— the cascade: paper from the printer and copier, cans from the vending machine, sparks from the MAIN switch, a robot vacuum ——
  const casc = t => t >= T.cascade && t < T.dark;
  const paper = particles(220, (i, t, o) => { if (!casc(t)) { o.a = 0; return; } const src = i % 2 ? COMBO[0].x : COMBO[1].x, ph = ((t - T.cascade) * (.7 + h2(i, 1, 3) * .5) + h2(i, 2, 3)) % 1, a = (h2(i, 3, 3) - .5) * 2.2;
    o.x = src + Math.sin(a) * ph * 3 + Math.sin(t * 5 + i) * .15 * ph; o.z = P.devZ + .3 + ph * (2 + h2(i, 4, 3) * 3); o.y = Math.max(.02, 1.0 + 2.6 * ph - 3.4 * ph * ph); o.s = .17; o.r = o.g = 1; o.b = .97; o.a = 1; }, { blend: THREE.NormalBlending });
  scene.add(paper);
  const cans = particles(60, (i, t, o) => { const u = t - 20.0 - h2(i, 1, 4) * 1.8; if (u < 0 || u > 1.3 || !casc(t)) { o.a = 0; return; } const sp = 2 + h2(i, 2, 4) * 2.5, a = (h2(i, 3, 4) - .5) * 1.4;
    o.x = COMBO[3].x - .1 + Math.sin(a) * sp * u; o.z = P.devZ + .4 + Math.cos(a) * sp * u; o.y = Math.max(.05, .25 + 3.4 * u - 4.9 * u * u); o.s = .15; const c = i % 3; o.r = c === 0 ? .9 : c === 1 ? .2 : .95; o.g = c === 0 ? .15 : c === 1 ? .45 : .8; o.b = c === 0 ? .15 : c === 1 ? .9 : .1; o.a = 1; }, { blend: THREE.NormalBlending });
  scene.add(cans);
  const sparks = particles(70, (i, t, o) => { let u = -1; for (const a of [T.down, T.up, T.again]) { const d = t - a - h2(i, 1, 6) * .1; if (d >= 0 && d < .6) u = d; } if (u < 0) { o.a = 0; return; } const a = h2(i, 2, 6) * 6.28, sp = .8 + h2(i, 3, 6) * 1.6;
    o.x = P.main[0] - .22 + Math.cos(a) * sp * u; o.z = -4.25 + Math.abs(Math.sin(a)) * sp * u * .6; o.y = 1.45 + Math.sin(a) * sp * u * .6 - 4 * u * u; o.s = .04; o.r = 1; o.g = .8; o.b = .3; o.a = 1 - u / .6; }, {});
  scene.add(sparks);
  const dust = particles(90, (i, t, o) => { o.x = -8 + h2(i, 1, 2) * 14; o.z = -4 + h2(i, 2, 2) * 6; o.y = .4 + ((t * .05 + h2(i, 3, 2)) % 1) * 3; o.s = .02; o.r = 1; o.g = .97; o.b = .9; o.a = .35; }, {});
  scene.add(dust);
  const vac = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .08, 16), std('#1a1c22', { m: .3, r: .4 })); vac.add(b); const l = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), std('#ffffff', { e: '#40c0ff', ei: 3 })); l.position.set(.1, .05, 0); vac.add(l); } scene.add(vac);

  // —— characters ——
  const hero = makeChar('hero'), boss = makeChar('ceo'), w1 = makeChar('shop'), intern = makeChar('shop');
  for (const c of [hero, boss, w1, intern]) scene.add(c.root);
  const workers = WORKERS.map(([x, z, v]) => { const c = makeChar('shop'); scene.add(c.root); return { x, z, v, c }; });

  const place = (c, x, y, z) => c.root.position.set(x, y, z);
  const L3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  const CLOSE = { p: [4.98, 1.69, 1.45], l: [4.98, 1.675, -2.0] };
  function camAt(t, shot) {
    const id = shot.id;
    if (id === 'close' || id === 'closeEnd' || id === 'fired') { const u = id === 'close' ? eo(seg(t, 0, T.wide)) : id === 'fired' ? eo(seg(t, T.dark, T.plug)) : 1 - eo(seg(t, T.k2, DUR)); return { p: L3(CLOSE.p, [4.98, 1.69, 1.62], u), l: CLOSE.l }; }
    if (id === 'wide') { const u = ss(seg(t, T.wide, T.w1)); return { p: L3([-2.1, 4.6, 11.0], [-2.1, 4.2, 10.2], u), l: L3([-1.9, 1.7, -1.6], [-1.9, 1.6, -1.6], u) }; }
    if (id === 'desk') { const u = ss(seg(t, T.w1, T.btn)); return { p: L3([-.35, 2.05, 3.9], [-.35, 2.0, 3.5], u), l: L3([-.35, 1.3, -.8], [-.35, 1.28, -.8], u) }; }
    if (id === 'btn') { const u = ss(seg(t, T.btn, T.combo)); return { p: L3([-.15, 1.4, 1.0], [-.2, 1.38, .85], u), l: [-.6, 1.05, -.62] }; }
    if (id === 'combo') { const hx = heroComboX(t); return { p: [hx - .3, 2.7, .9], l: [hx - .5, 1.0, -4.0] }; }
    if (id === 'ceo') { const u = ss(seg(t, T.ring, T.server)); return { p: L3([5.0, 1.85, 1.9], [5.05, 1.78, 1.5], u), l: L3([5.1, 1.35, -2.3], [5.15, 1.33, -2.3], u) }; }
    if (id === 'server') { const u = ss(seg(t, T.server, T.twist)); return { p: L3([-6.7, 1.75, -1.1], [-6.95, 1.65, -1.6], u), l: [-7.55, 1.35, -4.3] }; }
    if (id === 'reboot') { const u = ss(seg(t, T.twist, T.again)); return { p: L3([-1.8, 4.4, 9.4], [-1.9, 3.9, 8.2], u), l: L3([-1.8, 1.6, -2.0], [-1.9, 1.5, -2.0], u) }; }
    if (id === 'again') { const u = ss(seg(t, T.again, T.dark)); return { p: L3([-6.3, 1.9, 1.0], [-6.4, 1.85, .6], u), l: [-6.95, 1.35, -3.2] }; }
    if (id === 'plug') { const u = ss(seg(t, T.plug, T.end)); return { p: L3([5.45, 1.55, 1.9], [5.5, 1.5, 1.5], u), l: L3([5.55, 1.1, -2.6], [5.55, 1.12, -2.6], u) }; }
    const u = ss(seg(t, T.end, T.k2)); return { p: L3([4.85, 1.65, 1.9], [4.9, 1.6, 1.4], u), l: L3([4.95, 1.4, -2.2], [4.95, 1.44, -2.2], u) };
  }
  // the combo route: the hero sprints from device to device (left to right), stopping on each beat
  function heroComboX(t) { const k = Math.max(0, Math.min(COMBO.length - 1, Math.floor((t - T.combo + .2) / .5))), c = COMBO[k], u = seg(t, c.t - .2, c.t); const prev = k > 0 ? COMBO[k - 1].x + .5 : COMBO[0].x + .9; return lerp(prev, c.x + .5, eo(u)); }

  function update(t, shot, camera, shake) {
    const { p, l } = camAt(t, shot);
    const jx = (Math.sin(t * 61) + Math.sin(t * 37.3)) * .5 * shake * .06, jy = (Math.sin(t * 53.1) + Math.cos(t * 29.7)) * .5 * shake * .06;
    camera.position.set(p[0] + jx, p[1] + jy, p[2]); camera.lookAt(l[0] + jx * .5, l[1] + jy * .5, l[2]); camera.fov = shot.id === 'btn' ? 36 : 40; camera.updateProjectionMatrix();
    const cam = camera, id = shot.id, hook = id === 'close' || id === 'closeEnd' || id === 'fired';
    const pw = power(t), scr = screens(t), dark = pw < .5;
    // lights: the panels light row by row as the power comes back after the twist
    panels.forEach(pn => { const row = pn.z < -2 ? 0 : pn.z < 0 ? 1 : 2, on = t >= T.twist && t < T.twist + 1.0 ? pw > (row + 1) / 3.2 : pw > .5; pn.m.material = on ? panelOn : panelOff; });
    panelsL.forEach(L => { L.intensity = 3 * pw; }); panelsL2.forEach(L => { L.intensity = 2.4 * pw; });
    blueL.intensity = hook ? 13 : dark ? 2 : 0; warmKey.intensity = hook ? 6.5 : id === 'end' || id === 'plug' ? 1.5 : 0;
    sparkL.intensity = [T.down, T.up, T.again].some(a => t >= a && t < a + .5) ? 5 : 0;
    redL.intensity = scr === 'red' ? (pick(t, 4) ? 5 : 2) : 0;
    hemi.intensity = .75 - (dark ? .2 : 0);
    for (const pz of [snowfall, paper, cans, sparks, dust]) pz.userData.update(t);
    faced.forEach(f => { f.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z); });
    // the server racks blink while powered; dark when the main is down
    const rOn = !(t >= T.down && t < T.twist) && !(t >= T.again && t < T.again + .3);
    racks.forEach((r, k) => { r.material = rOn ? ((Math.floor(t * 6 + k) % 2) ? rackOn : rackOn2) : rackOff; });
    lever.rotation.x = (t >= T.down && t < T.up) || (t >= T.again && t < T.again2) ? 2.6 : 0; lever.userData.lamp.material.emissive.set(rOn ? '#40ff60' : '#ff2020');
    // the screens
    const updK = Math.floor(t * 2) % 3;
    const screenMat = (m, k) => scr === 'blue' ? MON.blue : scr === 'upd' ? MON.upd[(updK + k) % 3] : scr === 'upd2' ? MON.upd2 : scr === 'red' ? MON.red : MON.desk[k];
    monitors.forEach((m, i) => { let mt = screenMat(m, m.k);
      if (t >= T.twist && t < T.twist + 1.0 && scr === 'upd') mt = (m.x + 6) / 9 < seg(t, T.twist, T.twist + .9) ? mt : MON.off;   // the screens wake in a wave, left to right
      if (pw <= 0 && scr === 'desk') mt = MON.off;
      if (m.id === 'w10' || m.id === 'w11') { if (t >= T.wide && t < T.off) mt = m.id === 'w10' ? MON.off : MON.desk[1]; if (m.id === 'w10' && t >= T.off && t < T.fixed) mt = t < T.on ? MON.off : MON.boot; }
      m.g.userData.sc.material = mt; });
    { let mt = screenMat(ceo.mon, 3); if (scr === 'desk') mt = t < T.conn ? MON.nonet : MON.conn; if (t >= T.pc && t < T.pc + .3) mt = MON.off; if (t >= T.plug && t < T.conn) mt = MON.nonet; ceo.mon.userData.sc.material = mt; }
    ceo.tled.material.emissiveIntensity = t >= T.conn && t < T.reflex + .25 ? 3 : 0;
    ceo.rleds.forEach((l, k) => { l.visible = !(t >= T.router && t < T.router + .3) && pick(t * (k + 1), 3); });
    { const plugged = t >= T.plugIn && t < T.reflex + 1; ceo.cabOut.visible = !plugged; ceo.cabIn.visible = plugged;
      const u = seg(t, T.plug + .5, T.plugIn); ceo.plug.position.set(lerp(P.ceoDesk[0] + 1.45, P.ceoDesk[0] + 1.05, plugged ? 1 : eo(u)), lerp(.03, .21, plugged ? 1 : eo(u)), lerp(-3.6, -3.96, plugged ? 1 : eo(u))); }
    // the devices: a status pulse on each beat of the combo; the copier bar scans; the elevator chomps in the cascade; the lamp
    for (const c of COMBO) { const d = dev[c.id]; if (!d) continue; const u = t - c.t; d.scale.y = u >= 0 && u < .25 ? 1 - .06 * Math.sin(u * 40) : 1; }
    dev.copierBar.position.y = casc(t) || (t >= COMBO[1].t && t < COMBO[1].t + .5) ? .3 + .6 * Math.abs(Math.sin(t * 6)) : .7;
    dev.copierBar.visible = !dark; dev.coffeeD.visible = !dark; dev.vendWin.material.emissiveIntensity = dark ? .1 : casc(t) ? (pick(t, 6) ? 1.2 : .3) : .5; dev.printerScr.visible = !dark;
    { const ch = t >= 20.5 && t < T.dark ? Math.abs(Math.sin((t - 20.5) * 9)) : 0; elev.L.position.x = P.elevator - .31 - ch * .55; elev.R.position.x = P.elevator + .31 + ch * .55; elev.ind.visible = !dark; }
    { const lampOn = !dark && !(t >= COMBO[4].t && t < COMBO[4].t + .25); lampL.intensity = lampOn ? 2 : 0; lampBulb.visible = lampOn; }
    // the standing desks ride up and down in a wave; the chairs spin
    const up = desksUp(t);
    deskTops.forEach(d => { const w = up > 0 ? .25 * Math.max(0, Math.sin((t - T.cascade) * 5 - d.x * .7)) : 0; d.top.position.y = w; d.chair.rotation.y = casc(t) ? t * (d.k % 2 ? 6 : -5) : .3 * (d.k % 2 ? 1 : -1); });
    { const on = t >= 21.0 && t < T.dark, u = (t - 21.0) * 1.6; vac.visible = on; vac.position.set(-2.0 + Math.cos(u) * 2.4, .04, .6 + Math.sin(u) * .9); vac.rotation.y = -u; }

    // —— YOU ——
    { let f = 'stand', x = P.heroCeo[0], y = 0, z = P.heroCeo[1], flip = false, sq = 0;
      if (t < T.wide || t >= T.k2) { f = t >= T.cont && t < T.cont + .35 ? 'darkMash' : pick(t, 9) ? 'dark' : 'darkS'; if (t >= T.cont && t < T.cont + .1) sq = -.12; }
      else if (t < T.w1) { x = P.heroHelp[0]; z = P.heroHelp[1]; f = t < 2.3 ? 'stare' : (Math.floor(t * 8) % 19 === 0 ? 'blink' : 'smile'); }
      else if (t < T.btn) { const u = seg(t, T.w1, 4.6); x = lerp(P.heroHelp[0] + .4, P.heroW1[0], ss(u)); z = lerp(P.heroHelp[1], P.heroW1[1], ss(u)); f = u < 1 ? `w${walkStep(t, true)}` : says(t, 'y1') ? 'talkS' : 'smile'; flip = false; if (u >= 1) flip = true; }
      else if (t < T.combo) { x = P.heroW1[0]; z = P.heroW1[1]; flip = true; f = t < T.off ? 'pressS' : t < T.fixed ? 'press' : 'talkS'; if (t >= T.fixed) f = pick(t, 4) ? 'smile' : 'talkS'; sq = (t >= T.off && t < T.off + .12) || (t >= T.on && t < T.on + .12) ? -.08 : 0; }
      else if (t < T.ring) { x = heroComboX(t); z = P.heroDevZ; flip = true; const k = Math.floor((t - T.combo + .2) / .5), c = COMBO[Math.min(4, Math.max(0, k))], u = t - c.t;
        f = t > COMBO[4].t + .6 ? (says(t, 'y2') ? 'talkS' : 'smile') : u < -.02 ? `w${walkStep(t, true)}` : u < .2 ? 'press' : says(t, 'y2') ? 'pressTalk' : 'pressS'; sq = u >= 0 && u < .1 ? -.1 : 0; if (t > COMBO[4].t + .6) { f = 'shock'; if (t > 11.9) f = 'talkS'; f = t < 11.75 ? 'smile' : 'talkS'; } }
      else if (t < T.server) { const u = seg(t, T.ring, 12.7); x = lerp(3.6, 4.5, u); z = lerp(-.9, -1.7, u); f = u < 1 ? `w${walkStep(t, true)}` : t < T.pc ? 'stare' : t < T.pc + .5 ? 'press' : t < T.router ? 'worry' : t < T.router + .5 ? 'pressW' : 'sweat';
        if (t >= T.router - .2 && t < T.router + .7) { x = 5.85; z = -3.5; } if (t >= T.pc - .15 && t < T.pc + .6) { x = 4.6; z = -2.0; } }
      else if (t < T.twist) { x = P.heroMain[0]; z = P.heroMain[1]; flip = true; f = t < 16.4 ? 'stare' : t < T.down - .2 ? (says(t, 'y3') ? 'pullUpT' : 'pullUp') : t < T.up ? 'pullDn' : t < T.up + .1 ? 'pullUp' : 'pullUp';
        if (t >= T.up && t < 18.3) f = 'pullUp'; if (t >= 18.3) f = 'shock'; sq = t >= T.down && t < T.down + .15 ? -.12 : 0; }
      else if (t < T.again) { const u = seg(t, 18.7, 19.5); x = lerp(-5.6, -3.2, u); z = lerp(-1.9, .95, u); if (u < 1) f = `w${walkStep(t, true)}`; if (u >= 1) f = says(t, 'y4') ? 'shockT' : pick(t, 5) ? 'shock' : 'shock1'; }
      else if (t < T.dark) { x = P.heroMain[0]; z = P.heroMain[1]; flip = true; f = t < T.again2 ? 'pullDn' : t < 23.2 ? 'pullUp' : 'sweat'; if (t >= T.full) f = 'shock'; }
      else if (t < T.plug) { f = pick(t, 9) ? 'dark' : 'darkS'; }
      else if (t < T.end) { x = 6.05; z = -2.55; flip = true; f = t < T.plugIn - .3 ? 'stare' : t < T.conn + .3 ? 'plug' : 'plugS'; if (t >= T.conn + .8) { x = 5.75; f = 'smile'; } }
      else { x = 5.75; z = -1.95; flip = true; f = t < T.reflex - .1 ? (pick(t, 3) ? 'smile' : 'sad') : t < T.reflex + .3 ? 'press' : 'shock'; if (t >= T.end && t < T.reflex - .1) f = says(t, 'm2') ? 'sad' : 'sad'; }
      place(hero, x, y, z); hero.frame(f); hero.squash(sq); hero.face(cam, flip); }
    // —— THE CEO ——
    { let vis = false, f = 'stand', x = P.ceoAt[0], z = P.ceoAt[1], flip = true;
      if (t < T.wide || t >= T.k2 || (t >= T.dark && t < T.plug)) { vis = true; f = says(t, 'c0') ? 'darkTalk' : t >= T.dark ? 'darkShock' : 'dark'; if (t >= T.k2) f = 'dark'; }
      else if (t >= T.ring && t < T.server) { vis = true; x = 5.55; z = -2.15; f = t < T.ceo ? 'phone' : says(t, 'c1') ? 'angryTalk' : t > T.router ? 'point' : 'angry'; if (t < 12.15) f = 'phoneTalk'; }
      else if (t >= T.again && t < T.dark) { vis = true; const u = seg(t, T.again, 22.4); x = lerp(-5.5, -6.2, u); z = lerp(-1.9, -2.2, u); f = u < 1 ? `w${walkStep(t, true)}` : says(t, 'c3') ? 'angryTalk' : 'angry'; if (t >= T.full) f = 'shock'; }
      else if (t >= T.plug && t < T.k2) { vis = true; x = 5.15; z = -1.85; flip = false; f = t < T.conn ? 'down' : says(t, 'c4') ? 'downTalk' : 'down'; if (t >= T.end) { x = 4.55; f = says(t, 'm2') ? 'angryTalk' : t > T.reflex ? 'shock' : 'point'; } }
      boss.root.visible = vis; if (vis) { place(boss, x, 0, z); boss.frame(f); boss.face(cam, flip); } }
    // —— the colleague with the dead screen ——
    { const [x, z, v] = P.w1; let f = `${v}k0`;
      if (t < T.btn) f = says(t, 'w1') ? `${v}kl` : t < T.w1 ? (pick(t, 3) ? `${v}k0` : `${v}k1`) : `${v}k0`;
      else if (t < T.combo) f = t >= T.fixed ? (pick(t, 4) ? `${v}up` : `${v}upQ`) : `${v}k0`;
      else if (casc(t) || (t >= T.twist && t < T.dark)) f = pick(t + .3, 3) ? `${v}up` : `${v}upQ`;
      else f = pick(t, 3) ? `${v}k0` : `${v}k1`;
      place(w1, x, deskTops[3].top.position.y * .3, z); w1.frame(f); w1.face(cam, false); }
    // —— the intern: asleep at the lamp desk until the lamp goes off and on ——
    { const [x, z, v] = P.intern; let f;
      if (t < COMBO[4].t + .25) f = pick(t, .8) ? `${v}z` : `${v}z1`; else if (t < 12.2) f = `${v}upQ`; else if (t >= T.twist && t < T.dark) f = pick(t, 3) ? `${v}up` : `${v}upQ`; else f = pick(t, 3) ? `${v}k0` : `${v}k1`;
      place(intern, x, 0, z); intern.frame(f); intern.squash(t >= COMBO[4].t + .25 && t < COMBO[4].t + .45 ? .15 : 0); intern.face(cam, false); }
    // —— everyone else: typing; arms up in the cascade ——
    workers.forEach((w, k) => { const d = deskTops.find(dd => Math.abs(dd.x - w.x) < .1 && Math.abs(dd.z - (w.z < 0 ? P.w1Desk[1] : 1.9)) < .1); const f = (t >= T.twist && t < T.dark) ? (pick(t + k * .37, 3) ? `${w.v}up` : `${w.v}upQ`) : pick(t + k * .29, 2.5) ? `${w.v}k0` : `${w.v}k1`;
      place(w.c, w.x, d ? d.top.position.y * .5 : 0, w.z); w.c.frame(f); w.c.face(cam, k % 2 === 1); });

    // —— focus subject and HUD anchors ——
    let subj;
    if (hook) subj = v3(4.95, 1.55, -1.9);
    else if (id === 'wide' || id === 'reboot') subj = v3(-1.6, 1.2, -1.0);
    else if (id === 'desk') subj = v3(-.3, 1.3, -.6);
    else if (id === 'btn') subj = v3(-.6, 1.05, -.62);
    else if (id === 'combo') subj = v3(heroComboX(t) - .2, 1.2, -3.8);
    else if (id === 'ceo') subj = v3(5.0, 1.3, -2.2);
    else if (id === 'server' || id === 'again') subj = v3(-7.4, 1.35, -3.9);
    else if (id === 'plug') subj = v3(5.5, .8, -2.5);
    else subj = v3(5.0, 1.3, -2.0);
    const proj = (x, y, z) => { const v = v3(x, y, z).project(camera); return [(v.x * .5 + .5) * 1080, (.5 - v.y * .5) * 1920]; };
    const hp = hero.root.position; HUD.you = proj(hp.x, hp.y + 1.9, hp.z);
    HUD.ceo = proj(boss.root.position.x, 2.35, boss.root.position.z);
    HUD.w1 = proj(P.w1[0], 1.95, P.w1[1]);
    HUD.intern = proj(P.intern[0], 1.95, P.intern[1]);
    HUD.dev = proj(heroComboX(t) - .5, 1.4, P.devZ);
    HUD.mon = proj(-.85, 1.15, -.62);
    HUD.ceoMon = proj(ceo.mon.position.x, 1.3, ceo.mon.position.z);
    HUD.main = proj(P.main[0], 1.6, -4.3);
    HUD.office = proj(-1.6, 2.2, -2.0);
    return subj;
  }
  return { scene, update };
}
