// The set: a department store with its front wall and ceiling off, the returns desk at the back. Store floor x[-9,7.4] z[-4.4,3];
// the glass doors on the right (x 7.4) open onto a snowy car park, where the queue ends. Overhead fluorescent light, cool daylight
// through the doors, a warm desk lamp; a red alarm beacon from the ALERT on.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, glow, billboard, radialTex } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, beamCard } from './fx.js';
import { makeChar, SPX } from './chars.js';
import { T, P, DUR, VO, cust as custPath, dad as dadPath, boss as bossPath, QUEUE, QN, QGAP, queueAt, queueShift, walkStep, serving, FLASHES } from './story.js';
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

// —— surfaces ——
function lino(w, h) {   // store floor: big cream tiles, a grey border line, speckle, scuffs
  const p = new PX(w, h), R = ramp(['#8a8478', '#a8a294', '#c6c0b0', '#ddd8ca'], .4), G = ramp(['#5a5c64', '#74767e'], .5);
  p.fill((x, y) => { const tx = x % 24, ty = y % 24; if (tx === 0 || ty === 0) return G(.5, x, y); let v = .55 + (h2(x >> 3, y >> 3, 2) - .5) * .12 + (fbm(x * .2, y * .2, 3) - .5) * .25; if (h2(x, y, 7) > .97) v -= .35; if (((x / 24 | 0) + (y / 24 | 0)) % 2) v -= .08; return R(v, x, y); });
  return p.done();
}
function wallpaper(w, h, cols, dado, s = 3) {
  const p = new PX(w, h), A = ramp(cols, .4), D = ramp(dado, .4);
  p.fill((x, y) => { if (y > h - 20) return D(.4 + (y === h - 20 ? .45 : 0) + (h2(x, y, s) - .5) * .2, x, y); if (y < 4) return D(.7, x, y); return A(.55 + ((x % 16) < 1 ? -.15 : 0) + (fbm(x * .1, y * .1, s) - .5) * .18, x, y); });
  return p.done();
}
function snowTex(w, h) { const p = new PX(w, h), R = ramp(['#8a98b0', '#b4c2d6', '#d8e2ee', '#f2f6fb'], .4); p.fill((x, y) => R(.6 + (fbm(x * .08, y * .08, 4) - .5) * .5 + (h2(x, y, 9) > .96 ? .3 : 0), x, y)); return p.done(); }
function tarmac(w, h) { const p = new PX(w, h), R = ramp(['#3a3e48', '#4a4e5a', '#5a5e6a'], .4), S = ramp(['#a8b8cc', '#d4deea', '#eef2f8'], .5); p.fill((x, y) => { const sn = fbm(x * .06, y * .06, 6) + (h2(x, y, 5) - .5) * .06; if (sn > .44) return S(sn, x, y); return R(.6 + (h2(x, y, 3) - .5) * .4, x, y); }); return p.done(); }
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
function receiptTex() {   // 64 px across × 1440 along: printed lines, then at the very end (the canvas bottom) the date, upright for a camera behind the tip
  const W = 64, H = 1440, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, W, H);
  for (let y = 10; y < H - 190; y += 9) { const n = 6 + (h2(y, 0, 3) * 30 | 0); g.fillStyle = '#9a968c'; g.fillRect(5, y, n, 3); const m = 4 + (h2(y, 1, 3) * 10 | 0); g.fillRect(W - 5 - m, y, m, 3); }
  for (let y = 180; y < H - 200; y += 160) { g.fillStyle = '#c8c2b4'; for (let x = 2; x < W - 2; x += 4) g.fillRect(x, y, 2, 1); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#16121a';
  g.font = '400 9px Silkscreen'; g.fillText('DATE', W / 2, H - 112);
  g.font = '700 11px Silkscreen'; g.fillText('26.12.', W / 2, H - 96);
  g.font = '700 22px Silkscreen'; g.fillText('1998', W / 2, H - 70);
  g.fillStyle = '#9a968c'; for (let x = 4; x < W - 4; x += 4) g.fillRect(x, H - 48, 2, 1);
  g.fillStyle = '#16121a'; g.font = '400 8px Silkscreen'; g.fillText('THANK YOU!', W / 2, H - 34);
  const d = g.getImageData(0, 0, W, H), D = d.data; for (let i = 0; i < D.length; i += 4) { const l = D[i] + D[i + 1] + D[i + 2]; if (l < 600) { const k = l < 380 ? 0 : 1; D[i] = k ? 154 : 22; D[i + 1] = k ? 150 : 18; D[i + 2] = k ? 140 : 26; } else { D[i] = 246; D[i + 1] = 243; D[i + 2] = 234; } }
  g.putImageData(d, 0, 0);
  const t = texOf(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function cakeTop() { const p = new PX(32, 32), R = ramp(['#e8d8d0', '#f6ece6', '#fffaf6'], .4); p.fill((x, y) => { const dx = x - 15.5, dy = y - 15.5, r = Math.hypot(dx, dy); if (r > 16) return null; if (r > 13.5 && (Math.atan2(dy, dx) * 8 | 0) % 2 === 0) return [236, 120, 160]; if (r < 3) return [220, 40, 60]; if ((x * 7 + y * 3) % 23 === 0) return [[80, 160, 255], [255, 210, 60], [120, 220, 120]][(x + y) % 3]; return R(.6 + (h2(x, y, 2) - .5) * .4, x, y); }); return p.done(); }
function cakeSide() { const p = new PX(64, 10), R = ramp(['#e8d0c8', '#f6e4dc', '#fff6f0'], .4); p.fill((x, y) => { if (y < 2 && (x % 6) < 3) return [236, 120, 160]; if (y === 9) return [200, 170, 140]; return R(.6 + (h2(x, y, 4) - .5) * .3, x, y); }); return p.done(); }
function sponge() { const p = new PX(16, 10), S = ramp(['#c89a50', '#e8c070', '#f8dc98'], .4); p.fill((x, y) => { if (y < 2) return [250, 240, 236]; if (y === 5) return [210, 40, 70]; if (y === 4 || y === 6) return [250, 236, 230]; return S(.5 + (h2(x, y, 5) - .5) * .5, x, y); }); return p.done(); }
function tinsel(w, h, col) { const p = new PX(w, h), R = ramp(col, .3); p.fill((x, y) => { const c = Math.abs(y - h / 2 + Math.sin(x * .9) * 1.2); if (c > h / 2 - .5) return null; return R(.3 + h2(x, y, 3) * .7, x, y); }); return p.done(); }

export function buildStore() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#141820');
  scene.fog = new THREE.FogExp2(new THREE.Color('#9aa8bc'), .012);

  // —— lights ——
  const key = new THREE.DirectionalLight('#e8f0ff', 1.9); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(0, 0, -1.5); key.position.set(9, 26, 16); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#d8e4ff', '#6a5a48', .85); scene.add(hemi);
  const tubeL = new THREE.PointLight('#e8f6ff', 4.5, 8, 1.6); tubeL.position.set(.3, 3.3, -2.0); scene.add(tubeL);
  const lampL = new THREE.PointLight('#ffb060', 1.6, 2.2, 2); lampL.position.set(-.55, 1.45, -1.95); scene.add(lampL);
  const alarmL = new THREE.PointLight('#ff2a1a', 0, 9, 1.4); scene.add(alarmL);
  const warmKey = new THREE.SpotLight('#ffcf9a', 0, 9, .55, .6, 1.2); warmKey.position.set(1.6, 2.8, 1.4); warmKey.target.position.set(.4, 1.3, -1.9); scene.add(warmKey, warmKey.target);   // the hook's warm key on the faces
  const signL = new THREE.PointLight('#ff6a5a', 2.2, 4, 2); signL.position.set(.3, 3.0, -3.8); scene.add(signL);

  // —— outside: snowy car park, cars, lamp posts, a dark winter sky ——
  const snowM = mat(snowTex(96, 96), { rough: 1 }), tarM = mat(tarmac(96, 96), { rough: 1 });
  scene.add(mesh(new THREE.BoxGeometry(40, .2, 30).translate(27.4, -.12, 0), tarM, { cast: false }));
  scene.add(mesh(new THREE.BoxGeometry(60, .2, 30).translate(0, -.14, 17), snowM, { cast: false }));
  const R = mulberry(7);
  const carCols = ['#a82a2a', '#2a5aa8', '#e8e4da', '#3a3a44', '#c8961c', '#2a8a5a'];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: carCols[i % 6], roughness: .45, metalness: .3 });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, .7, 1.0).translate(0, .45, 0), cm), b2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, .45, .9).translate(-.1, 1.0, 0), new THREE.MeshStandardMaterial({ color: '#8ab0d0', roughness: .2, metalness: .5 }));
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.05, .12, .95).translate(-.1, 1.26, 0), snowM);
    for (const m of [b1, b2, roof]) { m.castShadow = m.receiveShadow = true; g.add(m); }
    g.position.set(10.5 + (i % 5) * 3.6 + R() * .4, 0, -3.2 + Math.floor(i / 5) * 9.5); g.rotation.y = (R() - .5) * .2; scene.add(g);
  }
  for (const [x, z] of [[11, 5], [18, 6], [25, 5.4], [13, -1.5], [22, -1.2]]) {
    const pole = box(.1, 3.6, .1, new THREE.MeshStandardMaterial({ color: '#2a2e36', roughness: .5, metalness: .6 })); pole.position.set(x, 0, z); scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .2), new THREE.MeshStandardMaterial({ color: '#fff2d0', emissive: '#ffe0a0', emissiveIntensity: 2 })); lamp.position.set(x, 3.6, z); scene.add(lamp);
    const gl = glow('#ffd890', 1.6, .5); gl.position.set(x, 3.5, z); scene.add(gl);
  }
  const snow = particles(420, (i, t, o) => { const r = h2(i, 1, 3), r2 = h2(i, 2, 3), r3 = h2(i, 3, 3), H = 8, y = H - ((t * (.5 + r3 * .4) + r * H) % H);
    o.x = 7.6 + r2 * 26 + Math.sin(t * .8 + i) * .3; o.z = -5 + h2(i, 4, 3) * 12; o.y = y; o.s = .05 + r3 * .05; o.r = o.g = o.b = .9; o.a = .9; }, { blend: THREE.NormalBlending });
  scene.add(snow);

  // —— the store shell ——
  const floorM = mat(lino(96, 96), { rough: .55 });
  scene.add(mesh(new THREE.BoxGeometry(16.4, .2, 7.4).translate(-.8, -.1, -.7), floorM, { cast: false }));
  const wallM = mat(wallpaper(96, 96, ['#2e4a52', '#3e5e66', '#4e727a', '#62868c'], ['#4a2a2a', '#6a3434', '#8a4444', '#a85a54']));
  scene.add(mesh(new THREE.BoxGeometry(16.4, 4.2, .3).translate(-.8, 2.1, -4.55), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.3, 4.2, 3.8).translate(7.55, 2.1, -2.5), wallM));   // right wall, up to the doors
  scene.add(mesh(new THREE.BoxGeometry(.3, 4.2, 7.4).translate(-9.05, 2.1, -.7), wallM));
  // the glass doors: a frame, two sliding panes (they open when people pass), a red mat, daylight pouring in
  const frameM = new THREE.MeshStandardMaterial({ color: '#b8bec8', roughness: .35, metalness: .8 });
  for (const z of [-.62, 2.62]) { const f = box(.16, 2.8, .16, frameM); f.position.set(7.5, 0, z); scene.add(f); }
  const lintel = box(.2, .3, 3.4, frameM); lintel.position.set(7.5, 2.8, 1.0); scene.add(lintel);
  const glassM = new THREE.MeshStandardMaterial({ color: '#bcd8ec', roughness: .05, metalness: .2, transparent: true, opacity: .25 });
  const panes = [0, 1].map(k => { const p = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.7, 1.6), glassM); p.position.set(7.5, 1.35, .2 + k * 1.6); scene.add(p); return p; });
  const doorSign = quad(1.4, .3, basic(pixText([{ t: 'WAY OUT ← → WAY IN', s: 9, c: '#e8e4da', y: .55 }], { w: 96, h: 20, bg: '#1a3a2a' }), { em: 1.2 })); doorSign.rotation.y = -Math.PI / 2; doorSign.position.set(7.38, 3.15, 1.0); scene.add(doorSign);
  const mat2 = box(1.6, .02, 3.0, new THREE.MeshStandardMaterial({ color: '#7a1a20', roughness: 1 }), { cast: false }); mat2.position.set(6.6, 0, 1.0); scene.add(mat2);
  const beam = beamCard(7, 2.6, 4.6, '#cfe4ff', { k: .22, fall: 1.1 }); scene.add(beam);
  const motes = particles(90, (i, t, o) => { const u = (h2(i, 1, 8) + t * .015 * (1 + h2(i, 2, 8))) % 1, r = h2(i, 3, 8);
    o.x = 7.2 - u * 6; o.y = .3 + h2(i, 4, 8) * 2.6 + Math.sin(t * .7 + i) * .1; o.z = -.4 + h2(i, 5, 8) * 3.2 + Math.cos(t * .5 + i) * .1; o.s = .03 + r * .03; o.r = 1; o.g = .97; o.b = .9; o.a = .55 * Math.sin(u * Math.PI); }, { soft: 1 });
  scene.add(motes);

  // —— the back wall: shelves of boxes on the left, the returns corner in the middle, the rocket ride on the right ——
  const shelfM = new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: .5, metalness: .6 });
  const shelfBoxes = [];
  for (let u = 0; u < 3; u++) {   // three tall shelf units
    const x0 = -8.6 + u * 2.15, g = new THREE.Group();
    for (const y of [.12, .9, 1.68, 2.46, 3.24]) { const s = box(2.05, .05, .75, shelfM); s.position.set(1.02, y, 0); g.add(s); }
    for (const x of [0, 2.05]) { const p = box(.06, 3.4, .75, shelfM); p.position.set(x, 0, 0); g.add(p); }
    for (const [yi, y] of [.17, .95, 1.73, 2.51].entries()) { let x = .08; let k = 0; while (x < 1.9) { const w = .3 + h2(u, yi * 10 + k, 2) * .3, h = .3 + h2(u, yi * 10 + k, 3) * .38; if (x + w > 1.98) break;
      const bm = new THREE.MeshStandardMaterial({ map: tex(shelfBoxTex(12, 12, u * 100 + yi * 10 + k)), roughness: .8 }); const b = box(w, h, .5, bm); b.position.set(x + w / 2, y, .05); g.add(b); x += w + .04; k++; } }
    g.position.set(x0, 0, -4.0); scene.add(g);
  }
  // the staffer's ladder and the gap on the top shelf he is filling
  const ladM = new THREE.MeshStandardMaterial({ color: '#d8a820', roughness: .5, metalness: .4 });
  const ladder = new THREE.Group(); for (const s of [-1, 1]) { const r = box(.05, 2.0, .05, ladM); r.position.set(s * .26, 0, 0); r.rotation.x = -.12; ladder.add(r); const r2 = box(.05, 2.0, .05, ladM); r2.position.set(s * .26, 0, -.45); r2.rotation.x = .12; ladder.add(r2); }
  for (let k = 1; k < 6; k++) { const st = box(.56, .03, .1, ladM); st.position.set(0, k * .33, -.04 * k * 0); ladder.add(st); }
  ladder.position.set(-4.3, 0, -3.0); scene.add(ladder);
  const staffBox = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .45).translate(0, .16, 0), new THREE.MeshStandardMaterial({ map: tex(shelfBoxTex(12, 12, 777)), roughness: .8 })); staffBox.castShadow = true; scene.add(staffBox);

  // signage on the back wall
  const signRet = new THREE.Mesh(new THREE.BoxGeometry(2.3, .56, .14), [0, 0, 0, 0, basic(pixText([{ t: 'RETURNS', s: 16, b: 1, c: '#d81c2c', y: .54 }], { w: 96, h: 24, bg: '#fbf6ea', border: '#d81c2c' }), { em: .8 }), frameM]);
  signRet.position.set(.3, 3.3, -4.3); scene.add(signRet);
  const signGlow = glow('#ffe0d0', 2.2, .1); signGlow.position.set(.3, 3.3, -4.1); scene.add(signGlow);
  const nowServing = [46, 47].map(n => basic(pixText([{ t: 'NOW SERVING', s: 8, c: '#ff9a6a', y: .26 }, { t: String(n), s: 16, b: 1, c: '#ff3a2a', y: .68 }], { w: 48, h: 32, bg: '#120c10' }), { em: 2 }));
  const serve = quad(.62, .42, nowServing[0]); serve.position.set(1.95, 2.95, -4.38); scene.add(serve);
  const posters = [
    [pixText([{ t: 'NO RECEIPT?', s: 9, b: 1, c: '#1a1016', y: .2 }, { t: 'NO PROBLEM*', s: 9, b: 1, c: '#d81c2c', y: .45 }, { t: '*problem', s: 7, c: '#4a4450', y: .86 }], { w: 64, h: 48, bg: '#fff2a8', border: '#1a1016' }), -1.55, 2.25, .9, .68],
    [pixText([{ t: '30', s: 20, b: 1, c: '#1c3a6a', y: .36 }, { t: 'DAY RETURNS', s: 7, c: '#1c3a6a', y: .74 }], { w: 48, h: 40, bg: '#e8f0fa', border: '#1c3a6a' }), 2.65, 2.2, .62, .52],
    [pixText([{ t: 'EMPLOYEE', s: 7, c: '#f0d27a', y: .14 }, { t: 'OF THE MONTH', s: 6, c: '#f0d27a', y: .28 }], { w: 40, h: 52, bg: '#2a1a10' }), -2.45, 2.6, .5, .64],
  ].map(([c, x, y, w, h]) => { const q = quad(w, h, basic(c)); q.position.set(x, y, -4.38); scene.add(q); return q; });
  { // the employee of the month is the Cat: a tiny portrait inside the frame
    const pp = new PX(16, 14); pp.fill(() => [70, 110, 150]); pp.ellipse(8, 9, 6, 4, [216, 122, 44]); pp.ellipse(9, 6, 4, 3.4, [236, 150, 60]); pp.set(7, 6, [20, 16, 22]); pp.set(10, 6, [20, 16, 22]);
    pp.poly([[5, 4], [6, 1], [8, 4]], [216, 122, 44]); pp.poly([[10, 4], [11, 1], [13, 4]], [216, 122, 44]);
    const q = quad(.32, .28, basic(pp.done())); q.position.set(-2.45, 2.5, -4.37); scene.add(q); }
  const sale = quad(2.6, .55, basic(pixText([{ t: 'SALE  -70%  SALE', s: 13, b: 1, c: '#fff6e0', y: .55 }], { w: 128, h: 26, bg: '#d81c2c' }), { em: .5 })); sale.position.set(-5.4, 3.75, -3.1); scene.add(sale);
  for (const x of [-6.5, -4.3]) { const s = box(.02, .5, .02, frameM); s.position.set(x, 4.0, -3.1); scene.add(s); }
  // post-Christmas tinsel drooping along the top of the wall (one end has fallen), baubles
  const tinselM = new THREE.MeshStandardMaterial({ map: tex(tinsel(64, 6, ['#6a5a10', '#c8a020', '#ffe070', '#fffbd8'])), transparent: true, alphaTest: .5, roughness: .3, metalness: .6, side: THREE.DoubleSide, emissive: '#5a4810', emissiveIntensity: .4 });
  const tinselR = new THREE.MeshStandardMaterial({ map: tex(tinsel(64, 6, ['#5a0a10', '#a41a24', '#e84a4a', '#ffb0a0'])), transparent: true, alphaTest: .5, roughness: .3, metalness: .6, side: THREE.DoubleSide, emissive: '#400808', emissiveIntensity: .4 });
  const baubles = [];
  [[-8.6, -3.0, 3.7, tinselM], [-3.0, 2.7, 3.85, tinselR], [2.7, 7.2, 3.7, tinselM]].forEach(([a, b, y0, m], k) => {
    const N = 24, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(a, b, u); let y = y0 - Math.sin(u * Math.PI * 2) ** 2 * .35; if (k === 1 && u > .8) y -= (u - .8) * 6; pts.push(v3(x, y, -4.36)); }
    const curve = new THREE.CatmullRomCurve3(pts), tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, .07, 5, false), m); scene.add(tube);
    for (let i = 1; i < 4; i++) { const p = curve.getPoint(i / 4), bm = new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#2c5aa0', '#e8c040'][(i + k) % 3], roughness: .2, metalness: .7, emissive: ['#400808', '#081830', '#403010'][(i + k) % 3] });
      const bb = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), bm); bb.position.copy(p).add(v3(0, -.14, .04)); scene.add(bb); baubles.push(bb); }
  });
  // the alarm beacon above the sign
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ff4030', emissive: '#ff2010', emissiveIntensity: 0, roughness: .2 }));
  beacon.position.set(1.75, 3.62, -4.3); scene.add(beacon);
  const beaconG = glow('#ff3020', 2.4, 0); beaconG.position.set(1.75, 3.7, -4.15); scene.add(beaconG);

  // —— the returns cage behind the desk: wire mesh, stacked returns ——
  const cage = new THREE.Group(); scene.add(cage); cage.position.set(.1, 0, -3.75);
  const wireM = new THREE.MeshStandardMaterial({ map: tex(wireMesh(60, 48)), transparent: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .4, metalness: .7 });
  const cageBack = quad(3.1, 2.5, wireM); cageBack.position.set(0, 1.25, -.45); cage.add(cageBack);
  for (const s of [-1, 1]) { const sd = quad(.9, 2.5, wireM); sd.rotation.y = Math.PI / 2; sd.position.set(s * 1.55, 1.25, 0); cage.add(sd); }
  for (const [x, z] of [[-1.55, -.45], [1.55, -.45], [-1.55, .45], [1.55, .45]]) { const p = box(.05, 2.55, .05, frameM); p.position.set(x, 0, z); cage.add(p); }
  const cageDoor = new THREE.Group(); { const d = quad(1.55, 2.5, wireM); d.position.set(.775, 1.25, 0); cageDoor.add(d); const lbl = quad(.7, .3, basic(pixText([{ t: 'RETURNS', s: 8, b: 1, c: '#1a1016', y: .55 }], { w: 48, h: 20, bg: '#ffd840' }))); lbl.position.set(.78, 1.9, .01); cageDoor.add(lbl); }
  cageDoor.position.set(-1.55, 0, .45); cage.add(cageDoor);
  const cageDoor2 = new THREE.Group(); { const d = quad(1.55, 2.5, wireM); d.position.set(-.775, 1.25, 0); cageDoor2.add(d); }
  cageDoor2.position.set(1.55, 0, .45); cage.add(cageDoor2);
  // the boxes: stacked in the cage, then (T.crash) they fall onto the desk and the hero
  const RB = mulberry(21), BOXES = [];
  const pileAt = k => {   // where each box comes to rest: a mound over the desk and around the hero, his own spot kept clear
    for (let n = 0; n < 40; n++) { const a = RB() * Math.PI * 2, r = Math.sqrt(RB()), x = -.15 + Math.cos(a) * r * 1.3, z = -2.25 + Math.sin(a) * r * .6;
      if (Math.hypot(x - P.you[0], (z - P.you[1]) * 1.6) > .42) return { x, z, y: 0 }; }
    return { x: .9, z: -1.9, y: 0 };
  };
  for (let k = 0; k < 34; k++) {
    const w = .28 + RB() * .3, h = .22 + RB() * .25, d = .26 + RB() * .2, col = RB() < .3 ? ['#5a1a1a', '#8a2a2a', '#b84444', '#d06a5a'] : RB() < .4 ? ['#1a3a5a', '#2a5a8a', '#4a80b8', '#7aa8d8'] : null;
    const m = new THREE.MeshStandardMaterial({ map: tex(cardboard(12, 10, k, RB() < .7, col)), roughness: .85 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = b.receiveShadow = true; scene.add(b);
    const col0 = k % 6, row = Math.floor(k / 6), sx = -1.25 + col0 * .5 + (RB() - .5) * .08, sy = h / 2 + .05 + row * .42, sz = -3.75 + (RB() - .5) * .3;
    BOXES.push({ b, w, h, d, s: [sx, sy, sz], e: null, delay: (5 - row) * .05 + RB() * .12, spin: [(RB() - .5) * 6, (RB() - .5) * 6, (RB() - .5) * 6], rest: [(RB() - .5) * .5, RB() * 3, (RB() - .5) * .4] });
  }
  // rest heights: drop each box in order onto a coarse height field over the desk
  { const HF = new Map(), cell = (x, z) => `${Math.round(x / .3)},${Math.round(z / .3)}`;
    const base = (x, z) => (Math.abs(x) < 1.3 && z > -2.35 && z < -1.65) ? .95 : 0;
    BOXES.slice().sort((a, b) => a.delay - b.delay).forEach(B => { let e = pileAt(), k = cell(e.x, e.z), h0 = Math.max(base(e.x, e.z), HF.get(k) || 0); for (let n = 0; n < 12 && h0 > 1.35; n++) { e = pileAt(); k = cell(e.x, e.z); h0 = Math.max(base(e.x, e.z), HF.get(k) || 0); }
      e.y = h0 + B.h / 2; HF.set(k, h0 + B.h * .92); B.e = e; }); }
  // big returned things in the cage (sprites): a giant teddy, an inflatable flamingo, a sledge
  function bigSprite(draw, w, h, mW) { const p = new PX(w, h), e = new PX(w, h); draw(p, e); p.outline(.3); const t = texOf(p.done()); return billboard(t, mW, mW * h / w, {}); }
  const teddy = bigSprite(p => { const Bc = ramp(['#4a2a10', '#7a4a20', '#a46a30', '#c88a48'], .3); p.ellipse(14, 26, 11, 12, (x, y, dx, dy) => Bc(.7 - dy * .3, x, y)); p.ellipse(14, 11, 8, 7.5, (x, y, dx, dy) => Bc(.75 - dy * .3, x, y));
    p.ellipse(7, 5, 3, 3, (x, y) => Bc(.6, x, y)); p.ellipse(21, 5, 3, 3, (x, y) => Bc(.6, x, y)); p.ellipse(14, 14, 3.5, 2.6, [220, 190, 150]); p.set(14, 13, [20, 16, 20]); p.set(11, 9, [20, 16, 20]); p.set(17, 9, [20, 16, 20]);
    p.rect(8, 18, 12, 2, [216, 28, 44]); p.ellipse(4, 26, 3, 5, (x, y) => Bc(.55, x, y)); p.ellipse(24, 26, 3, 5, (x, y) => Bc(.45, x, y)); p.rect(4, 33, 24, 2, [250, 250, 240]); p.rect(6, 33, 4, 2, [216, 28, 44]); }, 28, 38, 1.0);
  teddy.position.set(1.05, 1.0, -3.72); scene.add(teddy);
  const flamingo = bigSprite(p => { const Pk = ramp(['#a01a4a', '#e0407a', '#ff7aa8', '#ffb4cc'], .3); p.ellipse(12, 26, 10, 6, (x, y, dx, dy) => Pk(.7 - dy * .3, x, y)); for (let y = 6; y < 22; y++) p.rect(18 + Math.round(Math.sin(y * .3) * 2), y, 3, 1, Pk(.6, 0, 0)); p.ellipse(19, 5, 3.4, 3, (x, y) => Pk(.75, x, y)); p.rect(21, 5, 4, 2, [40, 30, 40]); p.set(19, 4, [20, 16, 20]); }, 28, 34, .8);
  flamingo.position.set(-1.0, 1.15, -3.85); scene.add(flamingo);
  // a cardboard box that ends up on the hero's head, and his cap lost on top of the pile
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(.4, .34, .36).translate(0, .17, 0), new THREE.MeshStandardMaterial({ map: tex(cardboard(12, 10, 99)), roughness: .85 })); headBox.castShadow = true; scene.add(headBox);
  const lostCap = new THREE.Group(); { const cm = new THREE.MeshStandardMaterial({ color: '#c42232', roughness: .7 }); const c = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cm); const br = new THREE.Mesh(new THREE.BoxGeometry(.14, .015, .12), cm); br.position.set(.12, .01, 0); lostCap.add(c, br); } scene.add(lostCap);

  // —— the desk ——
  const deskG = new THREE.Group(); scene.add(deskG);
  const topM = mat((() => { const p = new PX(48, 48), Rr = ramp(['#8a6a48', '#a8845a', '#c4a070', '#dcbc8a'], .4); p.fill((x, y) => Rr(.55 + (fbm(x * .05, y * .4, 3) - .5) * .5, x, y)); return p.done(); })(), { rough: .35 });
  const top = box(2.7, .07, .78, topM); top.position.set(0, .9, -2.0); deskG.add(top);
  const frontC = pixText([{ t: 'RETURNS & EXCHANGES', s: 8, b: 1, c: '#fff6e8', y: .5 }], { w: 128, h: 16, bg: '#b41a26' });
  const frontP = new THREE.Mesh(new THREE.BoxGeometry(2.6, .86, .7).translate(0, .43, 0), [new THREE.MeshStandardMaterial({ color: '#8a141e' }), new THREE.MeshStandardMaterial({ color: '#8a141e' }), new THREE.MeshStandardMaterial({ color: '#8a141e' }), new THREE.MeshStandardMaterial({ color: '#8a141e' }), basic(frontC, { rough: .6 }), new THREE.MeshStandardMaterial({ color: '#8a141e' })]);
  frontP.castShadow = frontP.receiveShadow = true; frontP.position.set(0, 0, -2.0); deskG.add(frontP);
  const kick = box(2.6, .1, .02, new THREE.MeshStandardMaterial({ color: '#2a1a1a' })); kick.position.set(0, 0, -1.64); deskG.add(kick);
  // the till: a monitor with a green screen, a keyboard, a cash drawer that springs open at the refund
  const scrC = pixText([{ t: 'REFUND?', s: 8, c: '#7aff8a', y: .3 }, { t: 'Y / N', s: 8, c: '#7aff8a', y: .7 }], { w: 40, h: 28, bg: '#061a0c' });
  const scrC2 = pixText([{ t: 'REFUND', s: 8, c: '#ffe070', y: .3 }, { t: '£19.98', s: 8, c: '#ffe070', y: .7 }], { w: 40, h: 28, bg: '#1a1406' });
  const scrM = [basic(scrC, { em: 1.8 }), basic(scrC2, { em: 1.8 })];
  const till = new THREE.Group(); deskG.add(till); till.position.set(P.till[0], .935, P.till[1] - .08);
  const mon = box(.44, .32, .06, new THREE.MeshStandardMaterial({ color: '#2a2c34', roughness: .5 })); mon.position.set(0, .2, 0); till.add(mon);
  const scr = quad(.38, .26, scrM[0]); scr.position.set(0, .36, .035); till.add(scr);
  const stand = box(.06, .2, .06, frameM); till.add(stand);
  const drawer = box(.5, .1, .4, new THREE.MeshStandardMaterial({ color: '#3a3c44', roughness: .5 })); drawer.position.set(0, -.12, .12); till.add(drawer);
  const scrGlow = glow('#6aff8a', .7, .25); scrGlow.position.set(0, .36, .1); till.add(scrGlow);
  // the receipt printer, the bell, the ticket dispenser, the pen cup, a small potted plant, the lamp, the cat's tray
  const printer = box(.24, .16, .26, new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: .6 })); printer.position.set(P.printer[0], .935, P.printer[1]); deskG.add(printer);
  const bellM = new THREE.MeshStandardMaterial({ color: '#d8b040', roughness: .2, metalness: .9 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), bellM); bell.position.set(.55, .935, -1.78); deskG.add(bell);
  const disp = new THREE.Group(); { const pole = box(.04, 1.1, .04, frameM); disp.add(pole); const head = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .08, 16), new THREE.MeshStandardMaterial({ color: '#d81c2c', roughness: .4 })); head.rotation.x = Math.PI / 2; head.position.y = 1.15; disp.add(head);
    const lbl = quad(.3, .12, basic(pixText([{ t: 'TAKE A No.', s: 7, c: '#fff6e8', y: .55 }], { w: 40, h: 14, bg: '#d81c2c' }))); lbl.position.set(0, 1.15, .045); disp.add(lbl); }
  disp.position.set(1.55, 0, -1.55); scene.add(disp);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .12, 10).translate(0, .06, 0), new THREE.MeshStandardMaterial({ color: '#2c5aa0', roughness: .5 })); cup.position.set(-.3, .935, -2.2); deskG.add(cup);
  for (let k = 0; k < 3; k++) { const pen = box(.012, .16, .012, new THREE.MeshStandardMaterial({ color: ['#d81c2c', '#1a1a20', '#2c5aa0'][k] })); pen.position.set(-.3 + (k - 1) * .015, 1.0, -2.2); pen.rotation.z = (k - 1) * .2; deskG.add(pen); }
  const plant = new THREE.Group(); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.08, .06, .12, 10).translate(0, .06, 0), new THREE.MeshStandardMaterial({ color: '#b8602a', roughness: .8 })); plant.add(pot);
    const lp = new PX(16, 20); for (let k = 0; k < 7; k++) { const a = -1.2 + k * .4; lp.line(8, 19, 8 + Math.round(Math.sin(a) * 7), 19 - Math.round(Math.cos(a) * 12 + (k % 2) * 4), ramp(['#1a4a1a', '#2a7a2a', '#4aa83a'])(.3 + (k % 3) * .3, k, 0)); lp.ellipse(8 + Math.sin(a) * 7, 19 - Math.cos(a) * 12 - (k % 2) * 4, 2, 1.4, [70, 160, 60]); }
    const leaves = billboard(texOf(lp.done()), .3, .38, {}); leaves.position.y = .1; plant.add(leaves); plant.userData.leaves = leaves; }
  plant.position.set(1.18, .935, -2.22); deskG.add(plant);
  const lamp = new THREE.Group(); { const lm = new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: .4, metalness: .6 }); const b0 = box(.14, .02, .14, lm); lamp.add(b0); const arm = box(.025, .4, .025, lm); arm.rotation.z = .35; arm.position.set(.03, 0, 0); lamp.add(arm);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(.1, .12, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#1a5a3a', roughness: .4, side: THREE.DoubleSide })); shade.position.set(-.12, .4, 0); shade.rotation.z = .6; lamp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffc060', emissiveIntensity: 3 })); bulb.position.set(-.14, .36, 0); lamp.add(bulb); }
  lamp.position.set(-.55, .935, -2.25); deskG.add(lamp);
  const lampG = glow('#ffb060', .8, .6); lampG.position.set(-.69, 1.3, -2.2); scene.add(lampG);
  const tray = box(.38, .07, .3, new THREE.MeshStandardMaterial({ color: '#2a2c34', roughness: .6 })); tray.position.set(P.cat0[0], .935, P.cat0[1]); deskG.add(tray);
  const trayL = quad(.2, .05, basic(pixText([{ t: 'IN', s: 7, c: '#fff6e8', y: .55 }], { w: 16, h: 6, bg: '#2a2c34' }))); trayL.position.set(P.cat0[0], .97, P.cat0[1] + .152); deskG.add(trayL);

  // —— the cake: an open box, the cake with a slice missing (then two) ——
  const cakeG = new THREE.Group(); scene.add(cakeG);
  const boxM = new THREE.MeshStandardMaterial({ color: '#cfc8ba', roughness: .9 });
  const cbase = box(.46, .03, .4, boxM); cakeG.add(cbase);
  const lid = new THREE.Group(); { const lt = box(.46, .02, .4, boxM); lt.position.set(0, 0, .2); lid.add(lt); const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.3, .14), basic(pixText([{ t: 'Patisserie', s: 7, c: '#c42a72', y: .55 }], { w: 40, h: 18, bg: '#fff6fa' }))); lbl.rotation.x = -Math.PI / 2; lbl.position.set(0, .022, .2); lid.add(lbl); }
  lid.position.set(0, .03, -.2); cakeG.add(lid);
  const topT = tex(cakeTop()), sideT = tex(cakeSide()); sideT.wrapS = THREE.RepeatWrapping;
  const cakeMats = [new THREE.MeshStandardMaterial({ map: sideT, roughness: .7 }), new THREE.MeshStandardMaterial({ map: topT, roughness: .6 }), new THREE.MeshStandardMaterial({ color: '#c8a070' })];
  const spongeM = new THREE.MeshStandardMaterial({ map: tex(sponge()), roughness: .8, side: THREE.DoubleSide });
  const cakeR = .16, cakeH = .13;
  function cakeMesh(miss) {   // a cylinder with `miss` eighths cut out, and the two cut faces
    const g = new THREE.Group(), th = Math.PI * 2 * (1 - miss / 8), st = Math.PI / 2 + Math.PI * miss / 8 * 0;
    const cy = new THREE.Mesh(new THREE.CylinderGeometry(cakeR, cakeR, cakeH, 28, 1, false, st, th).translate(0, cakeH / 2, 0), cakeMats); cy.castShadow = cy.receiveShadow = true; g.add(cy);
    for (const a of [st, st + th]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(cakeR, cakeH).translate(cakeR / 2, cakeH / 2, 0), spongeM); f.rotation.y = a - Math.PI / 2; g.add(f); }
    return g;
  }
  const cake1 = cakeMesh(1), cake2 = cakeMesh(2); cake1.position.y = cake2.position.y = .03; cakeG.add(cake1, cake2);
  cake1.rotation.y = cake2.rotation.y = -.5;
  const slice = new THREE.Group(); { const sm = new THREE.Mesh(new THREE.CylinderGeometry(cakeR, cakeR, cakeH, 6, 1, false, 0, Math.PI / 4).translate(0, cakeH / 2, 0), cakeMats); slice.add(sm); } scene.add(slice);   // the slice in the Cat's mouth

  // —— the receipt: a long paper strip from the roll on the desk, over the edge, along the floor to the lens ——
  const rTex = receiptTex(), RN = 160;
  const rGeo = new THREE.PlaneGeometry(1, 1, 1, RN); const rM = new THREE.MeshStandardMaterial({ map: rTex, side: THREE.DoubleSide, roughness: .9, color: '#d8d2c2' });
  const strip = new THREE.Mesh(rGeo, rM); strip.frustumCulled = false; strip.castShadow = true; strip.receiveShadow = true; scene.add(strip);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .12, 14), new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: .8 })); roll.rotation.z = Math.PI / 2; scene.add(roll);
  const RW = .15, RX = .3;   // strip width, its x
  const rPath = s => {   // a point along the strip: s metres from the roll; returns [y, z]
    const z0 = -1.86, edge = -1.6, top = .975;
    if (s < edge - z0) return [top, z0 + s];
    const dropS = s - (edge - z0); if (dropS < top - .005) { const k = dropS; return [top - k, edge + .02 + Math.sin(Math.min(1, k / top) * Math.PI) * .05]; }
    const fl = dropS - top; return [.006 + Math.max(0, Math.sin(fl * 7) * .012), edge + .04 + fl];
  };
  const END = .42, EV = 200 / 1440;   // the last END metres carry the bottom 200 px of the texture (the date)
  function updStrip(len) {
    const pos = rGeo.attributes.position, uv = rGeo.attributes.uv;
    for (let j = 0; j <= RN; j++) { const s = len * (1 - j / RN), [y, z] = rPath(s), fe = len - s;
      const v = fe < END ? fe / END * EV : EV + (((fe - END) / 2.2) % 1) * (1 - EV) * .999;
      for (let i = 0; i < 2; i++) { const k = j * 2 + i; pos.setXYZ(k, RX + (i - .5) * RW, y + .001, z); uv.setXY(k, i, v); } }
    pos.needsUpdate = uv.needsUpdate = true; rGeo.computeVertexNormals();
  }
  const RLEN = 5.0;
  // paper loops piled round the hero after the receipt
  const loopM = new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: .9, side: THREE.DoubleSide });
  const loops = [...Array(11)].map((_, k) => { const r = .1 + h2(k, 1, 4) * .08, m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .13, 18, 1, true), loopM); m.rotation.set(Math.PI / 2 * (k % 2), h2(k, 2, 4) * 3, Math.PI / 2 + (h2(k, 3, 4) - .5) * .8);
    const spots = [[-.35, 1.06, -2.0], [.2, 1.07, -1.9], [.6, 1.06, -2.1], [-.75, 1.05, -1.85], [-.1, 1.62, -2.72], [.12, 1.55, -2.7], [.95, .12, -1.4], [.5, .12, -1.1], [1.3, .12, -1.0], [.1, 1.2, -2.0], [-.5, .12, -1.3]][k];
    m.position.set(...spots); m.castShadow = true; scene.add(m); return m; });

  // —— the fluorescent tubes: housings with emissive tubes; the one over the desk flickers ——
  const tubeOn = new THREE.MeshStandardMaterial({ color: '#f4fbff', emissive: '#e8f6ff', emissiveIntensity: 1.8 });
  const tubeDesk = new THREE.MeshStandardMaterial({ color: '#f4fbff', emissive: '#e8f6ff', emissiveIntensity: 2.4 });
  const housingM = new THREE.MeshStandardMaterial({ color: '#d8dce2', roughness: .5, metalness: .5 });
  const TUBES = [[.3, -2.0, tubeDesk], [-5.4, -2.0, tubeOn], [-2.6, -.2, tubeOn], [3.4, -2.2, tubeOn], [3.6, .9, tubeOn], [-6.0, 1.0, tubeOn]];
  const tubeGlows = [];
  for (const [x, z, m] of TUBES) {
    const h = box(1.9, .06, .32, housingM, { cast: false }); h.position.set(x, 3.62, z); scene.add(h);
    for (const dz of [-.08, .08]) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.75, 8), m); tb.rotation.z = Math.PI / 2; tb.position.set(x, 3.58, z + dz); scene.add(tb); }
    for (const dx of [-.8, .8]) { const r = box(.01, .5, .01, frameM, { cast: false }); r.position.set(x + dx, 3.65, z); scene.add(r); }
    const gl = glow('#e0f0ff', 1.6, .06); gl.position.set(x, 3.5, z); scene.add(gl); tubeGlows.push([gl, m]);
  }

  // —— characters ——
  const hero = makeChar('hero'), custC = makeChar('cust'), dadC = makeChar('dad'), mgr = makeChar('boss'), cat = makeChar('cat', 1, 1.15), staff = makeChar('staff'), kid = makeChar('kid', 1.2);
  for (const c of [hero, custC, dadC, mgr, cat, staff, kid]) scene.add(c.root);
  const shoppers = QUEUE.map(q => { const c = makeChar('shop'); scene.add(c.root); return { ...q, c }; });
  const trolleyMan = makeChar('shop'); scene.add(trolleyMan.root);
  const trolley = new THREE.Group(); { const tm = new THREE.MeshStandardMaterial({ map: tex(wireMesh(24, 16)), transparent: true, alphaTest: .5, side: THREE.DoubleSide, metalness: .7, roughness: .4 });
    const bx = new THREE.Mesh(new THREE.BoxGeometry(.8, .45, .5), tm); bx.position.y = .62; trolley.add(bx); const hd = box(.04, .4, .5, frameM); hd.position.set(-.42, .55, 0); hd.rotation.z = .3; trolley.add(hd);
    for (const [x, z] of [[-.35, -.2], [.35, -.2], [-.35, .2], [.35, .2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 10), new THREE.MeshStandardMaterial({ color: '#1a1a1e' })); w.rotation.x = Math.PI / 2; w.position.set(x, .06, z); trolley.add(w); }
    const stuff = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .35), new THREE.MeshStandardMaterial({ map: tex(shelfBoxTex(12, 12, 55)) })); stuff.position.set(.05, .8, 0); trolley.add(stuff); }
  scene.add(trolley);
  // stanchions with belts (the zig-zag lanes); some are in the foreground, out of focus
  const postM = new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: .25, metalness: .9 }), beltM = new THREE.MeshStandardMaterial({ color: '#d81c2c', roughness: .6 });
  const POSTS = [[1.15, -.75], [2.95, -.75], [5.4, -.75], [1.15, .05], [2.95, .05], [5.45, .05], [1.15, .85], [3.2, .85], [5.75, .85], [1.15, 1.65], [3.2, 1.65], [5.75, 1.65], [-1.3, 2.3], [-.5, 2.6]];
  POSTS.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .95, 8).translate(0, .475, 0), postM); p.position.set(x, 0, z); p.castShadow = true; scene.add(p); const bs = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .04, 12), postM); bs.position.set(x, .02, z); scene.add(bs); });
  const belt = (a, b) => { const [x0, z0] = POSTS[a], [x1, z1] = POSTS[b], L = Math.hypot(x1 - x0, z1 - z0); const m = new THREE.Mesh(new THREE.BoxGeometry(L, .05, .005), beltM); m.position.set((x0 + x1) / 2, .9, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(m); };
  [[0, 1], [1, 2], [4, 5], [3, 4], [6, 7], [7, 8], [10, 11], [9, 10], [12, 13]].forEach(([a, b]) => belt(a, b));

  // —— particles: crumbs, coins, dust ——
  const CR = 46, crumbs = particles(CR, (i, t, o) => {   // the slam (from t = −0.08: frame 0 already shows them in the air) and the Cat's two bites
    const burst = i < 30 ? -.08 : i < 38 ? T.catBite : 8.95, u = t - burst, cp = cakeG.position;
    if (u < 0 || (i < 30 && t > T.pull)) { o.a = 0; return; }
    const a = h2(i, 1, 5) * Math.PI * 2, sp = .6 + h2(i, 2, 5) * 1.2, vy = 1.4 + h2(i, 3, 5) * 1.6;
    const x = cp.x + Math.cos(a) * sp * Math.min(u, .7) * .55, z = cp.z + Math.sin(a) * sp * Math.min(u, .7) * .45, y0 = cp.y + .12;
    let y = y0 + vy * u - 4.9 * u * u; const floorY = Math.abs(x) < 1.35 && z > -2.39 && z < -1.61 ? .94 : 0; if (y < floorY + .01) y = floorY + .01;
    o.x = x; o.y = y; o.z = z; o.s = .018 + h2(i, 4, 5) * .02; const c = [[.98, .9, .86], [.93, .45, .6], [.85, .66, .36]][i % 3]; o.r = c[0]; o.g = c[1]; o.b = c[2]; o.a = 1;
  }, { blend: THREE.NormalBlending });
  scene.add(crumbs);
  const coins = particles(26, (i, t, o) => { const u = t - T.refund; if (u < 0 || u > 1.3) { o.a = 0; return; }
    const a = h2(i, 1, 6) * Math.PI * 2, sp = .4 + h2(i, 2, 6) * .9, vy = 2.2 + h2(i, 3, 6) * 1.8;
    o.x = P.till[0] + Math.cos(a) * sp * u * .8 + u * .9; o.z = P.till[1] + .1 + Math.sin(a) * sp * u * .4; o.y = 1.05 + vy * u - 4.9 * u * u; if (o.y < .97) o.y = .97;
    o.s = .045; const tw = .6 + .4 * Math.abs(Math.sin(t * 30 + i)); o.r = 1 * tw; o.g = .82 * tw; o.b = .25 * tw; o.a = 1 - ss(seg(u, 1.0, 1.3)); }, { blend: THREE.NormalBlending });
  scene.add(coins);
  const dust = particles(70, (i, t, o) => { const u = t - T.crash - .05; if (u < 0 || u > 2.2) { o.a = 0; return; }
    const a = h2(i, 1, 7) * Math.PI * 2, r = (.3 + h2(i, 2, 7) * 1.2) * eo(u / 1.2);
    o.x = -.1 + Math.cos(a) * r * 1.2; o.z = -2.2 + Math.sin(a) * r * .6 + .3; o.y = .3 + h2(i, 3, 7) * 1.4 + u * .3; o.s = .25 + u * .3 + h2(i, 4, 7) * .2; o.r = .78; o.g = .72; o.b = .62; o.a = .55 * (1 - ss(seg(u, .4, 2.2))); }, { blend: THREE.NormalBlending, soft: 1 });
  scene.add(dust);

  // —— cameras ——
  const DESK = { p: [.5, 2.35, 4.75], l: [.4, 1.2, -2.0] };
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, .05, 400);
  const place = (c, x, z, lift = 0) => c.root.position.set(x, lift, z);
  const L3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  function camAt(t, shot) {
    let p, l;
    if (shot.id === 'slam' || shot.id === 'slamEnd') {   // tight two-shot: the Customer big on the right, the hero's face behind the cake
      const u = shot.id === 'slam' ? eo(seg(t, 0, 1.2)) : 1 - eo(seg(t, 33.6, DUR));
      p = L3([.5, 1.5, 3.2], [.5, 1.56, 3.55], u); l = L3([.42, 1.28, -1.6], [.42, 1.3, -1.6], u);
    }
    else if (shot.id === 'desk') { const u = ss(seg(t, 0, T.pull)); p = L3(DESK.p, [.42, 2.25, 4.2], u); l = L3(DESK.l, [.38, 1.18, -2.0], u);
      if (t >= 6.3 && t < 9.4) { const k = ss(seg(t, 6.3, 7.0)) * (1 - ss(seg(t, 9.0, 9.4))); p = L3(p, [-.05, 2.1, 3.3], k * .5); l = L3(l, [-.15, 1.15, -2.0], k * .5); } }
    else if (shot.id === 'receipt') {
      const tip = rPath(RLEN * ss(seg(t, T.pull, 13.3)));
      const u = ss(seg(t, T.pull, 13.0)), k = ss(seg(t, 13.15, T.date - .02));
      p = L3([.5, 1.75, .9], [.32, .42, 3.85], u); l = [RX, lerp(.95, .02, ss(seg(t, 12.2, 12.9))), Math.max(-1.6, tip[1] - .2)];
      if (t >= 13.15) { const tipZ = rPath(RLEN)[1]; l = L3([RX, .0, tipZ - .3], [RX, 0, tipZ - .13], k); p = L3([.32, .42, 3.85], [RX + .01, .58, tipZ + .5], k); }
    }
    else if (shot.id === 'desk2') { p = [.45, 2.2, 3.9]; l = [.32, 1.2, -2.0]; }
    else if (shot.id === 'slam' || shot.id === 'slamEnd') subj = v3(.5, 1.3, -1.6);
    else if (shot.id === 'queue') {
      const u = eo(seg(t, T.alert, 18.0)), v = ss(seg(t, 18.0, T.back));
      p = L3([.45, 2.2, 3.9], [-2.6, 5.6, 5.4], u); l = L3([.32, 1.2, -2.0], [6.2, 0, .6], u);
      p = L3(p, [-1.4, 7.4, 6.6], v); l = L3(l, [10.5, 0, 1.6], v);
    }
    else if (shot.id === 'crash') { const k = ss(seg(t, T.boss, 22.4)); p = L3([.25, 2.4, 5.0], [-.45, 2.35, 5.1], k); l = L3([.15, 1.25, -2.2], [-.6, 1.25, -2.0], k); }
    else if (shot.id === 'fired') { p = [-.45, 2.35, 5.1]; l = [-.6, 1.25, -2.0]; }
    else { const u = ss(seg(t, T.hired, DUR)); p = L3([.0, 2.25, 4.3], DESK.p, ss(seg(t, 32.2, DUR))); l = L3([-.25, 1.2, -2.0], DESK.l, ss(seg(t, 32.2, DUR))); }
    return { p, l };
  }

  // —— per frame ——
  function update(t, shot, camera, shake) {
    const { p, l } = camAt(t, shot);
    const sx = (Math.sin(t * 61) + Math.sin(t * 37.3)) * .5 * shake * .06, sy = (Math.sin(t * 53.1) + Math.cos(t * 29.7)) * .5 * shake * .06;
    camera.position.set(p[0] + sx, p[1] + sy, p[2]); camera.lookAt(l[0] + sx * .5, l[1] + sy * .5, l[2]); cam.position.copy(camera.position); cam.quaternion.copy(camera.quaternion);
    camera.fov = shot.id === 'receipt' && t >= 13.15 ? lerp(40, 34, ss(seg(t, 13.15, 13.48))) : 40; camera.updateProjectionMatrix();

    // lights: the desk tube flickers; the alarm beacon sweeps red; the grade is set by main.js
    const flickT = (t > 1.9 && t < 2.25 && pick(t, 22)) || (t > 13.5 && t < 13.75 && pick(t, 30)) || (t > 20.5 && t < 21.1 && pick(t, 14)) || (t > 17.2 && t < 17.4);
    const tubeK = flickT ? .15 : 1;
    tubeDesk.emissiveIntensity = 1.8 * tubeK; tubeL.intensity = 4.5 * tubeK; tubeGlows[0][0].material.opacity = tubeK;
    const alarm = t >= T.alert && t < T.fired ? 1 : 0, ang = t * 9;
    alarmL.intensity = alarm * (10 + 8 * Math.max(0, Math.sin(ang))); alarmL.position.set(1.75 + Math.cos(ang) * 2.2, 3.2, -3.6 + Math.sin(ang) * 2.2);
    beacon.material.emissiveIntensity = alarm * (1.5 + 2 * Math.max(0, Math.sin(ang))); beaconG.material.opacity = alarm * (.4 + .6 * Math.max(0, Math.sin(ang)));
    signL.intensity = 2.2; warmKey.intensity = (shot.id === 'slam' || shot.id === 'slamEnd') ? 9 : shot.id === 'desk' && t < 2.5 ? 9 * (1 - ss(seg(t, 1.2, 2.5))) : 0; lampL.intensity = (t >= T.crash && t < T.hired ? .3 : 1.6) * (1 + .03 * Math.sin(t * 17));
    serve.material = nowServing[serving(t) - 46];
    beam.userData.aim(v3(7.6, 2.4, 1.0), v3(-1, -.45, -.05), camera); beam.material.uniforms.t.value = t;
    for (const pz of [snow, motes, crumbs, coins, dust]) pz.userData.update(t);
    // the doors slide open while people pass
    const dopen = .55;
    panes[0].position.z = .2 - dopen * .9; panes[1].position.z = 1.8 + dopen * .9;
    baubles.forEach((b, i) => b.position.y += Math.sin(t * 2 + i) * .0004);

    // —— the cake ——
    const cakeVis = t < T.pull + .1 || t >= 32.9;
    cakeG.visible = cakeVis;
    if (t < 30) {   // on the desk: the slam squash at frame 0, the lid pops
      const sq = t < .4 ? 1 - .28 * Math.exp(-t * 14) * Math.cos(t * 40) : 1;
      cakeG.position.set(P.cake[0], .935, P.cake[1]); cakeG.scale.set(2 - sq, sq, 2 - sq); cakeG.rotation.y = .12;
      lid.rotation.x = -2.55 * eo(seg(t, 0, .22)) + .25 * Math.exp(-Math.max(0, t - .22) * 8) * Math.sin(Math.max(0, t - .22) * 30);
      // when she leaves she takes it with her
      if (t > 9.8) { const g = custPath(t); cakeG.position.set(g.x - .25, 1.05, g.z + .05); lid.rotation.x = 0; cakeG.visible = cakeVis && g.x < 4; }
    } else { // the loop: she comes back holding it above her head
      const g = custPath(t), up = ss(seg(t, 33.0, 33.4));
      cakeG.position.set(g.x - .2, lerp(1.05, 1.82, up), g.z + .05); lid.rotation.x = 0; cakeG.scale.set(1, 1, 1);
    }
    const bitten = t >= T.catBite && t < 30;
    cake1.visible = !bitten; cake2.visible = bitten;
    slice.visible = t >= T.catBite && t < 9.3; slice.position.set(.2, 1.02, -1.92); slice.rotation.set(.3, 2.4, .2);
    // the till: the drawer springs open at the refund, the screen changes
    drawer.position.z = .12 + .22 * eo(seg(t, T.refund, T.refund + .12)) * (1 - ss(seg(t, 11.0, 11.3)));
    scr.material = t >= T.refund && t < 11.2 ? scrM[1] : scrM[0];
    bell.scale.y = 1;

    // —— the receipt ——
    const rl = t < T.pull ? .0 : RLEN * ss(seg(t, T.pull, 13.3));
    const rollOn = t >= T.dslam - .05 && t < T.crash;
    roll.visible = rollOn; strip.visible = rollOn && t >= T.pull;
    if (rollOn) { const sq = 1 - .3 * Math.exp(-(t - T.dslam) * 12) * Math.cos((t - T.dslam) * 40); roll.position.set(RX, .975 + .045 * (sq - .7), -1.88); roll.scale.set(1, 1, sq); roll.rotation.x = -rl * 22; }
    if (strip.visible) updStrip(Math.max(.02, rl));
    loops.forEach((m, k) => { m.visible = t >= 13.65 && t < T.crash + .1 && (k < 6 || shot.id !== 'receipt'); });

    // —— the avalanche ——
    const cageOpen = ss(seg(t, T.crash - .1, T.crash + .15));
    cageDoor.rotation.y = -1.9 * cageOpen * (t < T.hired ? 1 : 0); cageDoor2.rotation.y = 1.9 * cageOpen * (t < T.hired ? 1 : 0);
    if (t < T.crash - .35) cage.rotation.z = 0; else cage.rotation.z = t < T.crash ? .02 * Math.sin((t - T.crash) * 60) : 0;
    teddy.visible = flamingo.visible = true;
    if (t >= T.crash && t < T.hired) { teddy.position.set(lerp(1.05, .95, eo(seg(t, T.crash + .2, T.crash + .6))), lerp(1.0, .98, eo(seg(t, T.crash + .2, T.crash + .6))), lerp(-3.72, -2.0, eo(seg(t, T.crash + .2, T.crash + .6)))); teddy.rotation.z = -.5 * eo(seg(t, T.crash + .2, T.crash + .6)); }
    else { teddy.position.set(1.05, 1.0, -3.72); teddy.rotation.z = 0; }
    teddy.rotation.y = Math.atan2(camera.position.x - teddy.position.x, camera.position.z - teddy.position.z);
    flamingo.rotation.y = Math.atan2(camera.position.x - flamingo.position.x, camera.position.z - flamingo.position.z);
    for (const B of BOXES) {
      const u = t - T.crash - B.delay;
      if (t >= T.hired || u <= 0) { B.b.position.set(...B.s); B.b.rotation.set(0, 0, 0); B.b.visible = t < T.hired || true; continue; }
      const D = .42, k = Math.min(1, u / D), [sx2, sy2, sz2] = B.s, e = B.e;
      const x = lerp(sx2, e.x, k), z = lerp(sz2, e.z, k), y = lerp(sy2, e.y, k) + Math.sin(k * Math.PI) * .55 * (1 - k * .3);
      const land = u > D ? Math.exp(-(u - D) * 14) * Math.sin((u - D) * 40) * .04 : 0;
      B.b.position.set(x, y + land, z);
      B.b.rotation.set(B.spin[0] * k * .4 + (k >= 1 ? B.rest[0] : 0) * k, B.spin[1] * k * .4 + B.rest[1] * k, B.spin[2] * k * .4 + B.rest[2] * k);
    }
    // in the loop the cage is full again (the boxes went back in: a cut covers it)
    headBox.visible = t >= T.pop && t < T.capOn + .25;
    lostCap.visible = t >= T.crash + .4 && t < T.hired; lostCap.position.set(.35, 1.62, -2.1); lostCap.rotation.set(.2, .5, -.3);

    // —— the hero ——
    { let f = 'stand', flip = false, lift = 0, sq = 0, vis = true;
      const y1 = vo('y1'), y2 = vo('y2');
      if (t < 2.4) f = t < .7 ? (pick(t, 8) ? 'shock' : 'shock1') : (pick(t, 6) ? 'stare' : 'stare1');
      else if (t < T.point - .1) f = Math.floor(t * 8) % 19 === 0 ? 'stareBlink' : 'stare';
      else if (t < y1.t + 1.2) f = pick(t, 7) ? 'point' : 'pointQ';
      else if (t < T.catBite + .1) f = 'stare';
      else if (t < T.refund - .25) f = t < T.catBite + .6 ? 'shock' : 'stare';
      else if (t < T.refund) f = 'slapUp';
      else if (t < T.refund + .5) { f = 'slapDn'; sq = -.12 * Math.exp(-(t - T.refund) * 10); }
      else if (t < T.dslam) f = 'smile';
      else if (t < T.pull) f = t < T.dslam + .3 ? 'shock' : 'worry';
      else if (t < 13.4) f = pick(t, 8) ? 'feed0' : 'feed1';
      else if (t < T.alert) f = t >= y2.t && t < y2.t + 1.2 ? 'sweatTalk' : pick(t, 3) ? 'sweat' : 'sweat1';
      else if (t < T.crash) f = pick(t, 6) ? 'shock' : 'shock1';
      else if (t < T.pop) vis = false;
      else if (t < T.fired) { f = t < T.boss + .8 ? 'stareNoCap' : 'stareNoCap'; lift = -.62 + .62 * 0; sq = .25 * Math.exp(-(t - T.pop) * 9) * Math.cos((t - T.pop) * 30); }
      else if (t < T.hired) { f = 'sad'; lift = 0; }
      else if (t < T.capOn) f = 'stareNoCap';
      else { f = t < T.capOn + .5 ? 'stare' : (Math.floor(t * 8) % 17 === 0 ? 'stareBlink' : 'stare'); sq = .18 * Math.exp(-(t - T.capOn) * 10) * Math.cos((t - T.capOn) * 34); }
      if (t >= T.pop && t < T.fired) lift = .32 - .94 * (1 - eo(seg(t, T.pop, T.pop + .18)));
      if (t >= T.fired && t < T.hired) lift = .32;
      hero.root.visible = vis;
      place(hero, P.you[0], P.you[1], (t >= T.pop && t < T.hired) ? lift + .0 : 0);
      if (t >= T.pop && t < T.hired) hero.root.position.y = lift + .02;
      hero.frame(f); hero.squash(sq); hero.face(cam, flip);
      // the box on his head
      const hb = hero.root.position;
      if (t < T.capOn) headBox.position.set(hb.x + .02, hb.y + 1.72, hb.z + .05), headBox.rotation.set(0, .2, -.08);
      else { const u = eo(seg(t, T.capOn, T.capOn + .25)); headBox.position.set(lerp(hb.x + .02, -1.4, u), lerp(1.72, 2.3, u), hb.z); headBox.rotation.set(0, .2, -.08 + u); }
    }
    // —— the Customer ——
    { const g = custPath(t); place(custC, g.x, g.z); custC.root.visible = g.x < 6;
      let f = 'demand', sq = 0;
      if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
      else if (t < .5) { f = 'dn2'; sq = -.07 * Math.exp(-t * 10) * Math.cos(t * 30) - .02; }
      else if (talking('c1', 2.1)(t)) f = pick(t, 6) ? 'talk' : 'demand';
      else if (t < T.drain) f = 'demand';
      else if (t < T.smug) f = t < T.drain + .2 ? 'cross' : 'cross';
      else if (talking('c2', 1.3)(t)) f = pick(t, 5) ? 'crossTalk' : 'smug';
      else if (t < T.refund) f = 'smug';
      else if (t < 9.8) f = 'demand';
      else if (t >= 33.0) { f = t < 33.35 ? 'dn2q' : 'up2'; sq = t >= 33.35 ? .06 : 0; }
      custC.frame(f); custC.squash(sq); custC.face(cam, g.moving ? g.dx < 0 : true); }
    // —— the Dad ——
    { const g = dadPath(t); place(dadC, g.x, g.z); dadC.root.visible = t < T.fired;
      let f = 'proud', sq = 0;
      if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
      else if (t < 9.6) f = pick(t, 1.3) ? 'proud' : 'stand';
      else if (t < T.dslam + .35) { f = t < T.dslam ? 'up' : 'slam'; if (t >= T.dslam) sq = -.12 * Math.exp(-(t - T.dslam) * 10); }
      else if (talking('d1', 1.2)(t)) f = pick(t, 6) ? 'talk' : 'proud';
      else if (t >= T.crash) f = 'shock';
      else f = 'proud';
      dadC.frame(f); dadC.squash(sq); dadC.face(cam, g.moving ? g.dx < 0 : true); }
    // —— the Manager ——
    { const g = bossPath(t); place(mgr, g.x, g.z); mgr.root.visible = t >= T.boss && (t < T.fired + .2 || t >= T.hired) && t < 32.8;
      let f = 'stand';
      if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
      else if (t < T.fired) f = talking('m1', 2.2)(t) ? (pick(t, 6) ? 'talk' : 'point') : 'point';
      else if (t < T.capOn + .3) f = t < T.capOn - .1 ? 'stand' : 'point';
      else f = talking('m2', 1.8)(t) ? (pick(t, 6) ? 'nodTalk' : 'nod') : 'nod';
      mgr.frame(f); mgr.face(cam, g.moving ? g.dx < 0 : false); }
    // —— the Cat: asleep in the IN tray; walks to the cake; bites; back to sleep ——
    { let x = P.cat0[0], f = 'sleep', flip = false;
      if (t < T.catWalk) f = (t > 6.5 ? 'look' : Math.floor(t * 1.2) % 5 === 0 ? 'tail' : 'sleep');
      else if (t < T.catBite - .05) { x = lerp(P.cat0[0], .02, ss(seg(t, T.catWalk, T.catBite - .05))); f = pick(t, 8) ? 'walk0' : 'walk1'; }
      else if (t < 9.3) { x = .02; f = t < 8.75 || (t > 8.9 && t < 9.1) ? 'eat0' : 'eat1'; }
      else if (t < 10.0) { x = lerp(.02, P.cat0[0], ss(seg(t, 9.3, 10.0))); f = pick(t, 8) ? 'walk0' : 'walk1'; flip = true; }
      else if (t < T.crash) f = t > 20.0 ? 'look' : Math.floor(t * 1.2) % 5 === 0 ? 'tail' : 'sleep';
      else if (t < T.hired) { f = 'sit'; x = -1.2; }
      else f = Math.floor(t * 1.2) % 5 === 0 ? 'tail' : 'sleep';
      cat.root.position.set(x, t >= T.crash && t < T.hired ? 1.55 : .975, t >= T.crash && t < T.hired ? -2.05 : P.cat0[1] + .02);
      cat.frame(f); cat.squash(t >= T.catWalk && t < T.catWalk + .25 ? .15 * Math.sin((t - T.catWalk) * 12) : 0); cat.face(cam, flip); }
    // —— background life: the staffer, the kid on the rocket, a trolley crossing, the queue ——
    { const sw = Math.sin(t * 1.7) * .05 + (t >= T.crash && t < T.crash + 1.2 ? Math.sin((t - T.crash) * 18) * .12 * Math.exp(-(t - T.crash) * 2) : 0);
      ladder.rotation.z = sw * .3;
      staff.root.position.set(-4.3 + sw, 1.32, -3.05); const ph = (t % 4) / 4;
      staff.frame(t >= T.crash && t < T.crash + 1.6 ? 'shock' : ph < .5 ? 'box' : 'arms'); staff.face(cam, true);
      staffBox.visible = ph >= .5 && !(t >= T.crash && t < T.crash + 1.6); staffBox.position.set(-4.65, 2.51, -3.8); }
    { const b = Math.abs(Math.sin(t * 5.2)) * .06; kid.root.position.set(5.8, b, -3.3); kid.root.rotation.z = 0; kid.frame(pick(t, 2.6) ? 'k0' : 'k1'); kid.face(cam, false); kid.mesh.rotation.z = Math.sin(t * 5.2) * .05; }
    { const ph = (t % 11) / 11, x = lerp(-8.6, -1.0, ph < .5 ? ph * 2 : 2 - ph * 2), dir = ph < .5 ? 1 : -1;
      trolleyMan.root.position.set(x - dir * .55, 0, -2.85); trolleyMan.frame(`2w${walkStep(t + .3, false)}`); trolleyMan.face(cam, dir < 0);
      trolley.position.set(x + dir * .15, 0, -2.85); trolley.rotation.y = (dir < 0 ? Math.PI : 0) + Math.sin(t * 9) * .04; }
    const shift = queueShift(t), queueVis = shot.id !== 'loop' && shot.id !== 'fired';
    shoppers.forEach(q => {
      const s = (q.i + 1) * QGAP - shift, pq = queueAt(s);
      q.c.root.visible = queueVis || q.i < 4; if (!q.c.root.visible) return;
      const moving = t >= 9.75 && t < 10.55;
      q.c.root.position.set(pq.x + Math.sin(q.i * 3.1) * .05, 0, pq.z + Math.cos(q.i * 2.3) * .05);
      let f;
      if (moving) f = `${q.v}w${walkStep(t + q.ph, true)}`;
      else if ((t >= T.crash && t < T.crash + 1.4) || (t >= T.alert && t < T.alert + .7)) f = `${q.v}l`;
      else { const m = (q.i * 13) % 5; f = m === 0 ? `${q.v}p` : m === 1 ? (pick(t + q.ph, 2) ? `${q.v}t` : `${q.v}s`) : (Math.floor(t * .5 + q.ph * 7) % 6 === 0 ? `${q.v}p` : `${q.v}s`); }
      const hop = (t >= T.crash && t < T.crash + .3) ? .1 * Math.sin((t - T.crash) / .3 * Math.PI) : 0;
      q.c.root.position.y = hop;
      q.c.frame(f); q.c.face(cam, pq.dx < 0 && !moving ? true : false);
    });

    // —— focus subject (tilt-shift band) and HUD anchors ——
    let subj;
    if (shot.id === 'receipt') subj = t >= 13.2 ? v3(RX, .01, rPath(RLEN)[1] - .13) : v3(RX, .5, Math.min(2.6, rPath(rl)[1]));
    else if (shot.id === 'slam' || shot.id === 'slamEnd') subj = v3(.5, 1.3, -1.6);
    else if (shot.id === 'queue') subj = v3(lerp(.5, 9.0, ss(seg(t, T.alert, 18.0))), .8, lerp(-1.6, 1.4, ss(seg(t, T.alert, 18.0))));
    else if (shot.id === 'crash' && t >= T.boss) subj = v3(-.8, 1.4, -1.8);
    else subj = v3(.35, 1.35, -1.9);
    const proj = (x, y, z) => { const v = v3(x, y, z).project(camera); return [(v.x * .5 + .5) * 1080, (.5 - v.y * .5) * 1920]; };
    HUD.cust = proj(custPath(t).x, 1.95, custPath(t).z);
    HUD.you = proj(P.you[0], 2.0, P.you[1]);
    HUD.dad = proj(dadPath(t).x, 2.15, dadPath(t).z);
    HUD.till = proj(P.till[0], 1.4, P.till[1]);
    HUD.cat = proj(.05, 1.4, P.cat0[1]);
    HUD.boss = proj(bossPath(t).x, 2.3, bossPath(t).z);
    return subj;
  }
  return { scene, update, cam };
}
