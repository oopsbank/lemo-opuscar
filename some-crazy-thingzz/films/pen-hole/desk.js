// desk.js — the set for "Cap Solo": a sunny study (plaster wall, a window, a framed print), a wooden desk with a lamp, a pen cup, a notebook,
// the channel mug (it cracks), the hero pen cap (a hole at its top), a ballpoint pen (a hole in its barrel), and the clear-tube model for the demo.
// Units: metres. Ground y = 0; the camera mostly looks toward -z.
import * as THREE from 'three';
import { paint, mat, wood, fbm, h2, rbox, cyl, box } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function puffTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), d = g.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const dx = x / 64 - 1, dy = y / 64 - 1, r = Math.hypot(dx, dy), n = fbm(x / 22, y / 22, 91, 4);
    const a = clamp((1 - r) * 1.6) * clamp(n * 1.6 - .25); const i = (y * 128 + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = a * 255;
  }
  g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _puff = null;
export class Puffs {
  // spec: { n, t0, t1 (spawn window), life, p (spawn point Vector3), spread, v (velocity), vr (random speed), grow, size, rise, color, opacity }
  constructor(scene, spec) {
    _puff = _puff || puffTex(); this.spec = spec; this.ps = [];
    for (let i = 0; i < spec.n; i++) {
      const m = new THREE.SpriteMaterial({ map: _puff, color: spec.color ?? '#ffffff', transparent: true, depthWrite: false, opacity: 0, fog: false });
      const s = new THREE.Sprite(m); s.renderOrder = 3; scene.add(s);
      const r = k => h2(i, k, spec.seed ?? 7);
      this.ps.push({ s, t0: lerp(spec.t0, spec.t1, i / spec.n + (r(1) - .5) / spec.n), life: spec.life * (.75 + r(2) * .5),
        off: new THREE.Vector3((r(3) - .5) * 2, (r(4) - .5) * 2, (r(5) - .5) * 2).multiplyScalar(spec.spread ?? .02),
        v: (spec.v ?? new THREE.Vector3(0, .3, 0)).clone().add(new THREE.Vector3((r(6) - .5) * 2, (r(7) - .3) * 2, (r(8) - .5) * 2).multiplyScalar(spec.vr ?? .1)), rot: r(9) * 6.28, sz: .7 + r(10) * .6 });
    }
  }
  update(t, show = true) {
    const S = this.spec;
    for (const p of this.ps) {
      const a = t - p.t0, k = a / p.life;
      if (!show || a < 0 || k >= 1) { p.s.visible = false; continue; }
      p.s.visible = true;
      const drag = S.drag ?? 2.5, d = (1 - Math.exp(-drag * a)) / drag;   // fast out, slowing down
      p.s.position.copy(S.p).add(p.off).addScaledVector(p.v, d); p.s.position.y += (S.rise ?? .1) * a * a;
      const sz = (S.size ?? .08) * p.sz * (1 + (S.grow ?? 3) * k);
      p.s.scale.set(sz, sz, 1); p.s.material.rotation = p.rot + a * .6;
      p.s.material.opacity = (S.opacity ?? .5) * Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.15)), .6) * (1 - k * .3);
    }
  }
}



// —— surfaces ——
function plaster(col = '#e9dcc4') { const W = 256, s = 51, c0 = hex(col); return paint(W, W, (x, y) => { const u = x / W, v = y / W, n = fbm(u * 6, v * 6, s, 5, 6); return { c: c0.map(k => k * (.93 + n * .12)), r: .92, h: n }; }); }
function wallpaper() {   // cream wallpaper: soft vertical stripes and a small leaf motif (no flat wall anywhere)
  const W = 256, s = 52; return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, n = fbm(u * 6, v * 6, s, 4, 6), stripe = Math.floor(u * 4) % 2;
    let c = (stripe ? hex('#efe0c2') : hex('#e6d2b0')).map(k => k * (.95 + n * .08));
    const cx = ((u * 4) % 1) - .5, cy = ((v * 4 + (Math.floor(u * 4) % 2) * .5) % 1) - .5, d = Math.hypot(cx * 1.6, cy);
    if (d < .2 && d > .1) c = mix3(c, hex('#b8683a'), .8); if (d <= .07) c = mix3(c, hex('#6f9a3a'), .85); if (Math.abs(cx) < .015 || Math.abs(cy) < .015) c = c.map(k => k * .93);
    if (Math.abs(((u * 4) % 1) - .5) > .49) c = c.map(k => k * .9);
    return { c, r: .9, h: .5 + (d < .16 ? .1 : 0) };
  });
}
function rugPaint() { const W = 512, s = 61; return paint(W, W, (x, y) => { const u = x / W - .5, v = y / W - .5, r = Math.max(Math.abs(u), Math.abs(v)), n = fbm(x / 8, y / 8, s, 3);
  const ring = Math.floor(r * 14) % 3; let c = [hex('#b2433a'), hex('#e8c27a'), hex('#2f5a7a')][ring]; if (Math.abs(Math.abs(u) - Math.abs(v)) < .02) c = hex('#f4ead0');
  return { c: c.map(k => k * (.85 + n * .2)), r: 1, h: n }; }); }
function boards() { return wood({ planks: 6, cols: ['#6a4429', '#86592f', '#9c6a3a', '#b07c46'], seed: 3 }); }
function mugCanvas() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; return c;
}
function drawMug(c, cracked) {
  const g = c.getContext('2d'); g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#d8342a'; g.font = '800 58px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SOME CRAZY', 512, 100); g.fillText('THINGZZ', 512, 160);
  g.fillStyle = '#d8342a'; g.fillRect(0, 16, 1024, 10); g.fillRect(0, 232, 1024, 10);
  if (cracked) {   // a jagged crack across the logo, a dark tea line under it
    g.strokeStyle = '#3a2a22'; g.lineWidth = 5; g.lineJoin = 'miter'; g.beginPath();
    const P = [[430, 0], [452, 40], [440, 78], [470, 110], [455, 150], [490, 190], [478, 256]]; P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(470, 110); g.lineTo(520, 128); g.lineTo(548, 120); g.moveTo(455, 150); g.lineTo(412, 172); g.stroke();
    g.fillStyle = 'rgba(120,70,30,.85)'; g.beginPath(); g.moveTo(478, 160); g.quadraticCurveTo(470, 220, 484, 256); g.lineTo(500, 256); g.quadraticCurveTo(494, 210, 490, 160); g.fill();
  }
}

// —— the pen cap: a blue lathe with a hole at its top and a clip (height 5 cm, the open end at y = 0) ——
export function makeCap(col = '#2456c8', hole = true) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: col, roughness: .32, metalness: 0, side: THREE.DoubleSide });
  const R = .0058, Hh = .05, pts = [];
  pts.push(new THREE.Vector2(R * .78, .001), new THREE.Vector2(R, 0), new THREE.Vector2(R * 1.02, .006), new THREE.Vector2(R * .97, Hh - .006));
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(R * (.97 - .25 * Math.sin(a)), Hh - .006 + Math.sin(a) * .006)); }
  pts.push(new THREE.Vector2(hole ? .0024 : 0, Hh)); if (hole) pts.push(new THREE.Vector2(.0024, Hh - .004));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), m); body.castShadow = body.receiveShadow = true; g.add(body);
  if (hole) { const d = new THREE.Mesh(new THREE.CircleGeometry(.0025, 24), new THREE.MeshBasicMaterial({ color: '#0c0c12' })); d.rotation.x = -Math.PI / 2; d.position.y = Hh - .0004; g.add(d); }
  const clip = rbox(.0022, .036, .004, .0009, m); clip.position.set(0, Hh - .02, R + .0018); g.add(clip);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.0022, 16, 12), m); tip.position.set(0, Hh - .037, R + .0025); g.add(tip);
  return g;
}
// —— a ballpoint pen lying along x, its hole facing up (length 14 cm) ——
export function makePen() {
  const g = new THREE.Group(), wm = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: .35 }), bm = new THREE.MeshStandardMaterial({ color: '#2456c8', roughness: .32 }), mm = new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: .25, metalness: 1 });
  const bar = cyl(.0045, .0045, .12, wm, 32); bar.rotation.z = Math.PI / 2; g.add(bar);
  const cone = cyl(.0045, .0012, .016, wm, 32); cone.rotation.z = -Math.PI / 2; cone.position.x = .068; g.add(cone);
  const tipm = cyl(.0012, .0005, .004, mm, 12); tipm.rotation.z = -Math.PI / 2; tipm.position.x = .078; g.add(tipm);
  const plug = cyl(.0042, .0042, .008, bm, 24); plug.rotation.z = Math.PI / 2; plug.position.x = -.063; g.add(plug);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.0009, 16), new THREE.MeshBasicMaterial({ color: '#0c0c12' })); hole.rotation.x = -Math.PI / 2; hole.position.set(.02, .00452, 0); g.add(hole);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// —— the set ——
export function buildDesk(scene) {
  const K = {}, DY = .76;
  const M = K.M = {
    wall: mat(wallpaper(), [10, 4], { bump: .3 }), floor: mat(boards(), [3, 3], { bump: .5 }),
    top: mat(wood({ planks: 2, cols: ['#7a4e2c', '#94643a', '#ab7845', '#bb8a52'], seed: 11 }), [1, 1], { bump: .4 }),
    leg: new THREE.MeshStandardMaterial({ color: '#5e3c22', roughness: .7 }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: .5 }), black: new THREE.MeshStandardMaterial({ color: '#1e1e22', roughness: .4 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#f2c335', roughness: .5 }), green: new THREE.MeshStandardMaterial({ color: '#3f8a5a', roughness: .6 }),
    glass: new THREE.MeshStandardMaterial({ color: '#dfefff', roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }),
    rim: new THREE.MeshStandardMaterial({ color: '#cfe4f5', roughness: .1, transparent: true, opacity: .6 }),
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.floor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), M.wall); wall.position.set(0, 2.5, -1.7); wall.receiveShadow = true; scene.add(wall);
  // a window on the wall (bright sky and a tree), a framed print with the channel name
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 320; const wg = wc.getContext('2d');
  const gr = wg.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#9cc8f0'); gr.addColorStop(1, '#e8f2fa'); wg.fillStyle = gr; wg.fillRect(0, 0, 256, 320);
  wg.fillStyle = '#ffffff'; for (const [x, y, r] of [[50, 50, 22], [80, 44, 28], [110, 52, 20], [190, 90, 18], [215, 84, 24]]) { wg.beginPath(); wg.arc(x, y, r, 0, 7); wg.fill(); }
  for (const [x, w, h, c] of [[10, 50, 90, '#d8b08a'], [70, 40, 120, '#c9693a'], [190, 60, 80, '#e8d2b0']]) { wg.fillStyle = c; wg.fillRect(x, 320 - h - 60, w, h); wg.fillStyle = '#5a6a7a'; wg.beginPath(); wg.moveTo(x - 6, 320 - h - 60); wg.lineTo(x + w / 2, 320 - h - 90); wg.lineTo(x + w + 6, 320 - h - 60); wg.fill(); wg.fillStyle = '#9cc8f0'; for (let k = 0; k < 3; k++) wg.fillRect(x + 8 + k * 12, 320 - h - 40, 8, 10); }
  wg.fillStyle = '#6f9a48'; for (let i = 0; i < 40; i++) { wg.beginPath(); wg.arc(140 + Math.cos(i) * 60 * Math.random(), 230 + Math.sin(i * 2) * 40 * Math.random(), 30, 0, 7); wg.fill(); }
  const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.15), new THREE.MeshBasicMaterial({ map: wt, color: new THREE.Color(1.25, 1.25, 1.25) })); win.position.set(-1.05, 1.7, -1.69); scene.add(win);
  for (const [w, h, x, y] of [[1.0, .06, -1.05, 2.28], [1.0, .08, -1.05, 1.12], [.06, 1.2, -1.53, 1.7], [.06, 1.2, -.57, 1.7], [.9, .03, -1.05, 1.7], [.03, 1.15, -1.05, 1.7]]) { const f = rbox(w, h, .05, .008, M.white); f.position.set(x, y, -1.67); scene.add(f); }
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 640; const pg = pc.getContext('2d'); pg.fillStyle = '#ffd84a'; pg.fillRect(0, 0, 512, 640);
  pg.fillStyle = '#1f4d32'; pg.font = '800 96px Baloo2'; pg.textAlign = 'center'; pg.fillText('SOME', 256, 200); pg.fillText('CRAZY', 256, 310); pg.fillText('THINGZZ', 256, 420); pg.font = '800 160px Baloo2'; pg.fillText('?', 256, 590);
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
  const print = new THREE.Mesh(new THREE.PlaneGeometry(.5, .62), new THREE.MeshStandardMaterial({ map: pt, roughness: .7 })); print.position.set(.95, 1.75, -1.68); scene.add(print);
  const pf = rbox(.56, .68, .03, .01, M.black); pf.position.set(.95, 1.75, -1.695); scene.add(pf);
  // the desk
  const top = rbox(2.0, .05, .8, .01, M.top); top.position.set(0, DY - .025, -.1); scene.add(top);
  for (const [x, z] of [[-.95, .25], [.95, .25], [-.95, -.45], [.95, -.45]]) { const l = rbox(.06, DY - .05, .06, .01, M.leg); l.position.set(x, (DY - .05) / 2, z); scene.add(l); }
  const front = rbox(1.9, .14, .02, .005, M.leg); front.position.set(0, DY - .12, .29); scene.add(front);
  // a lamp, a pen cup, a notebook
  const lamp = new THREE.Group(); const lb = cyl(.08, .09, .02, M.green, 24); lb.position.y = .01; lamp.add(lb);
  const arm = cyl(.008, .008, .4, M.black, 8); arm.position.set(0, .2, 0); arm.rotation.z = .2; lamp.add(arm);
  const shade = cyl(.04, .1, .12, M.green, 24); shade.position.set(-.06, .4, 0); shade.rotation.z = .9; lamp.add(shade);
  lamp.position.set(-.8, DY, -.35); lamp.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(lamp);
  const cup = cyl(.04, .036, .1, M.yellow, 24); cup.position.set(.78, DY + .05, -.3); scene.add(cup);
  [[-.012, .01, .2, '#d8342a'], [.012, -.008, -.15, '#2456c8'], [0, .014, .05, '#1e1e22']].forEach(([x, z, a, c]) => { const p = cyl(.004, .004, .15, new THREE.MeshStandardMaterial({ color: c, roughness: .4 }), 10); p.position.set(.78 + x, DY + .11, -.3 + z); p.rotation.z = a; p.castShadow = true; scene.add(p); });
  const nb = rbox(.21, .015, .28, .004, new THREE.MeshStandardMaterial({ color: '#e8e2d2', roughness: .8 })); nb.position.set(-.45, DY + .008, -.05); nb.rotation.y = .25; scene.add(nb);
  const nc = rbox(.212, .004, .282, .002, new THREE.MeshStandardMaterial({ color: '#c23a2e', roughness: .6 })); nc.position.set(-.45, DY + .0015, -.05); nc.rotation.y = .25; scene.add(nc);
  // the channel mug: it cracks; tea pools under it
  K.mugC = mugCanvas(); drawMug(K.mugC, false); const mt = new THREE.CanvasTexture(K.mugC); mt.colorSpace = THREE.SRGBColorSpace; K.mugTex = mt;
  const mug = new THREE.Group(); const mb = new THREE.Mesh(new THREE.CylinderGeometry(.045, .042, .1, 48, 1, true), new THREE.MeshStandardMaterial({ map: mt, roughness: .3, side: THREE.DoubleSide })); mb.position.y = .05; mb.rotation.y = -Math.PI / 2 - .2; mb.castShadow = true; mug.add(mb);
  const mbot = new THREE.Mesh(new THREE.CircleGeometry(.042, 32), M.white); mbot.rotation.x = -Math.PI / 2; mbot.position.y = .003; mug.add(mbot);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(.043, 32), new THREE.MeshStandardMaterial({ color: '#7a4a22', roughness: .1 })); tea.rotation.x = -Math.PI / 2; tea.position.y = .085; mug.add(tea);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(.026, .007, 10, 24, Math.PI * 1.2), M.white); hd.position.set(.05, .05, 0); hd.rotation.z = -Math.PI * .6; hd.castShadow = true; mug.add(hd);
  K.mug = mug; mug.position.set(.42, DY, .1); scene.add(mug);
  K.puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: '#7a4a22', roughness: .08, transparent: true, opacity: .9 })); K.puddle.rotation.x = -Math.PI / 2; K.puddle.position.set(.43, DY + .001, .15); scene.add(K.puddle);
  K.crack = cracked => { if (K.cracked === cracked) return; K.cracked = cracked; drawMug(K.mugC, cracked); K.mugTex.needsUpdate = true; };
  // —— set dressing: a wall shelf with books and a plant, a clock, a corkboard with notes, desk clutter, a lit lamp, a sunbeam with dust ——
  const bookC = ['#c23a2e', '#2456c8', '#3f8a5a', '#e8a33a', '#6b4a8a', '#2a6a7a', '#d8d0bc', '#8a3a3a'];
  const shelf = rbox(.9, .03, .2, .006, M.top); shelf.position.set(.15, 1.98, -1.6); scene.add(shelf);
  for (const sx of [-.38, .38]) { const br = rbox(.03, .08, .16, .004, M.leg); br.position.set(.15 + sx, 1.94, -1.62); scene.add(br); }
  let bx = -.27;
  for (let i = 0; i < 12; i++) { const w = .025 + h2(i, 1, 4) * .02, hh = .17 + h2(i, 2, 4) * .08; const bk = rbox(w, hh, .15, .004, new THREE.MeshStandardMaterial({ color: bookC[i % bookC.length], roughness: .7 })); bk.position.set(bx + w / 2, 1.995 + hh / 2, -1.59); if (i === 9) { bk.rotation.z = -.35; bk.position.x += .03; bk.position.y -= .015; } bk.castShadow = true; scene.add(bk); bx += w + .004; if (i === 9) bx += .05; }
  const pot = cyl(.06, .045, .1, new THREE.MeshStandardMaterial({ color: '#c9693a', roughness: .8 }), 20); pot.position.set(.5, 2.045, -1.6); scene.add(pot);
  const leafM = new THREE.MeshStandardMaterial({ color: '#4e8a3a', roughness: .7, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), leafM); lf.scale.set(.5, 1.6, .25); const a = i / 9 * Math.PI * 2; lf.position.set(.5 + Math.cos(a) * .04, 2.16 + h2(i, 3, 5) * .06, -1.6 + Math.sin(a) * .04); lf.rotation.set(Math.sin(a) * .7, a, Math.cos(a) * .7); lf.castShadow = true; scene.add(lf); }
  // a wall clock
  const cc = document.createElement('canvas'); cc.width = cc.height = 256; const cg = cc.getContext('2d'); cg.fillStyle = '#fbf7ee'; cg.beginPath(); cg.arc(128, 128, 126, 0, 7); cg.fill();
  cg.strokeStyle = '#1e1e22'; cg.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cg.lineWidth = i % 3 ? 4 : 9; cg.beginPath(); cg.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); cg.lineTo(128 + Math.cos(a) * 114, 128 + Math.sin(a) * 114); cg.stroke(); }
  cg.lineWidth = 10; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 + 55, 128 - 30); cg.stroke(); cg.lineWidth = 6; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 - 20, 128 - 88); cg.stroke();
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.14, 48), new THREE.MeshStandardMaterial({ map: ct, roughness: .5 })); clock.position.set(-.25, 2.2, -1.67); scene.add(clock);
  const crim = new THREE.Mesh(new THREE.TorusGeometry(.145, .014, 10, 48), new THREE.MeshStandardMaterial({ color: '#c23a2e', roughness: .4 })); crim.position.set(-.25, 2.2, -1.675); scene.add(crim);
  // a corkboard with notes and a doodle
  const kc = document.createElement('canvas'); kc.width = 512; kc.height = 384; const kg = kc.getContext('2d');
  for (let y = 0; y < 384; y += 2) for (let x = 0; x < 512; x += 2) { const n = h2(x, y, 9); kg.fillStyle = `rgb(${190 + n * 30},${140 + n * 25},${90 + n * 20})`; kg.fillRect(x, y, 2, 2); }
  [['#ffe66d', 40, 40, -.1, 'TO DO'], ['#9be0ff', 200, 70, .08, 'CAPS?'], ['#ffb3c7', 330, 30, -.05, '!!!'], ['#ffe66d', 300, 210, .1, 'TEA']].forEach(([c, x, y, r, t]) => { kg.save(); kg.translate(x + 70, y + 70); kg.rotate(r); kg.fillStyle = 'rgba(0,0,0,.2)'; kg.fillRect(-66, -62, 140, 140); kg.fillStyle = c; kg.fillRect(-70, -70, 140, 140); kg.fillStyle = '#1e1e22'; kg.font = '800 34px Baloo2'; kg.textAlign = 'center'; kg.fillText(t, 0, 10); kg.fillStyle = '#d8342a'; kg.beginPath(); kg.arc(0, -56, 9, 0, 7); kg.fill(); kg.restore(); });
  kg.strokeStyle = '#1e1e22'; kg.lineWidth = 5; kg.beginPath(); kg.arc(120, 290, 40, 0, 7); kg.moveTo(160, 290); kg.lineTo(230, 330); kg.stroke();
  const kt = new THREE.CanvasTexture(kc); kt.colorSpace = THREE.SRGBColorSpace;
  const cork = new THREE.Mesh(new THREE.PlaneGeometry(.62, .46), new THREE.MeshStandardMaterial({ map: kt, roughness: .9 })); cork.position.set(-.35, 1.62, -1.68); scene.add(cork);
  const cf = rbox(.66, .5, .02, .006, M.leg); cf.position.set(-.35, 1.62, -1.695); scene.add(cf);
  // desk clutter: sticky notes, crumpled paper, a stapler, paper clips
  [['#ffe66d', -.62, .12, .3], ['#9be0ff', -.58, .18, -.2], ['#ffb3c7', .62, .14, .5]].forEach(([c, x, z, r]) => { const n = rbox(.075, .003, .075, .001, new THREE.MeshStandardMaterial({ color: c, roughness: .8 })); n.position.set(x, DY + .0015, z); n.rotation.y = r; scene.add(n); });
  const paperM = new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: .9, flatShading: true });
  [[.7, .05, .035], [.62, -.1, .03], [-.72, -.15, .028]].forEach(([x, z, r], i) => { const g2 = new THREE.IcosahedronGeometry(r, 1), pp = g2.attributes.position; for (let k = 0; k < pp.count; k++) { const f = .75 + h2(k, i, 3) * .45; pp.setXYZ(k, pp.getX(k) * f, pp.getY(k) * f, pp.getZ(k) * f); } g2.computeVertexNormals(); const b = new THREE.Mesh(g2, paperM); b.position.set(x, DY + r * .8, z); b.castShadow = true; scene.add(b); });
  const stap = new THREE.Group(); const s1 = rbox(.14, .025, .035, .008, M.black); s1.position.y = .0125; const s2 = rbox(.14, .02, .03, .008, new THREE.MeshStandardMaterial({ color: '#c23a2e', roughness: .4 })); s2.position.y = .035; stap.add(s1, s2); stap.position.set(-.2, DY, -.3); stap.rotation.y = -.4; stap.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(stap);
  // the lamp is on: a warm bulb and a little light pool
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.022, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.6) })); bulb.position.set(-.86, DY + .37, -.35); scene.add(bulb);
  const lampL = new THREE.PointLight('#ffcf8a', .25, 1.6, 2); lampL.position.set(-.86, DY + .33, -.35); scene.add(lampL);
  // a sunbeam from the window (additive, soft) and dust motes in it
  const bc = document.createElement('canvas'); bc.width = 64; bc.height = 256; const bg2 = bc.getContext('2d'); const gr2 = bg2.createLinearGradient(0, 0, 0, 256); gr2.addColorStop(0, 'rgba(255,240,210,.5)'); gr2.addColorStop(1, 'rgba(255,240,210,0)'); bg2.fillStyle = gr2; bg2.fillRect(0, 0, 64, 256);
  const hz = bg2.createLinearGradient(0, 0, 64, 0); hz.addColorStop(0, 'rgba(0,0,0,1)'); hz.addColorStop(.25, 'rgba(0,0,0,0)'); hz.addColorStop(.75, 'rgba(0,0,0,0)'); hz.addColorStop(1, 'rgba(0,0,0,1)'); bg2.globalCompositeOperation = 'destination-out'; bg2.fillStyle = hz; bg2.fillRect(0, 0, 64, 256);
  const btx = new THREE.CanvasTexture(bc);
  const beamM = new THREE.MeshBasicMaterial({ map: btx, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .35, side: THREE.DoubleSide, fog: false });
  K.beams = [];
  for (const [x, w] of [[-1.25, .35], [-.9, .3]]) { const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), beamM); bm.position.set(x + .6, 1.3, -.9); bm.rotation.set(-.35, .5, .55); bm.renderOrder = 5; scene.add(bm); K.beams.push(bm); }
  const NM = 140, mg = new THREE.BufferGeometry(), mp = new Float32Array(NM * 3); K.moteBase = [];
  for (let i = 0; i < NM; i++) { const b = [-.9 + h2(i, 1, 7) * 1.5, .9 + h2(i, 2, 7) * 1.3, -1.4 + h2(i, 3, 7) * 1.4]; K.moteBase.push(b); mp.set(b, i * 3); }
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  K.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#fff3d6', size: .004, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  scene.add(K.motes);
  K.updateMotes = t => { const a = K.motes.geometry.attributes.position; for (let i = 0; i < NM; i++) { const b = K.moteBase[i]; a.setXYZ(i, b[0] + Math.sin(t * .3 + i) * .03, b[1] + ((t * .02 + h2(i, 4, 7)) % 1) * .1 - .05, b[2] + Math.cos(t * .25 + i * 1.3) * .03); } a.needsUpdate = true; };
  // —— density pass: no empty wall, floor or desk ——
  const R = (w, h, d, r, c, rough = .6) => rbox(w, h, d, r, new THREE.MeshStandardMaterial({ color: c, roughness: rough }));
  const put = (m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(m); return m; };
  const tex = draw => { const c = document.createElement('canvas'); c.width = 256; c.height = 320; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const frame = (x, y, w, h, drawFn, col = '#3a2a22') => { const f = R(w + .03, h + .03, .02, .004, col); put(f, x, y, -1.69); const p2 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(drawFn), roughness: .6 })); p2.position.set(x, y, -1.677); scene.add(p2); };
  // framed pictures: a cat, a mountain, a family photo, a "keep calm" poster, a diploma
  frame(.42, 1.5, .16, .2, g => { g.fillStyle = '#9cc8f0'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#e8a33a'; g.beginPath(); g.arc(128, 200, 70, 0, 7); g.fill(); g.beginPath(); g.moveTo(70, 150); g.lineTo(90, 80); g.lineTo(120, 140); g.moveTo(186, 150); g.lineTo(166, 80); g.lineTo(136, 140); g.fill(); g.fillStyle = '#1e1e22'; g.fillRect(100, 180, 12, 12); g.fillRect(144, 180, 12, 12); });
  frame(.2, 1.42, .13, .1, g => { g.fillStyle = '#7ab0e0'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#5a6a7a'; g.beginPath(); g.moveTo(0, 320); g.lineTo(110, 90); g.lineTo(256, 320); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(80, 150); g.lineTo(110, 90); g.lineTo(140, 150); g.fill(); }, '#c9a36a');
  frame(.66, 1.38, .14, .18, g => { g.fillStyle = '#f4d0a0'; g.fillRect(0, 0, 256, 320); for (const [x, c] of [[70, '#5b93d3'], [180, '#7d5aa8']]) { g.fillStyle = c; g.fillRect(x - 40, 200, 80, 120); g.fillStyle = '#fbf7ef'; g.beginPath(); g.arc(x, 150, 45, 0, 7); g.fill(); } });
  frame(1.32, 1.55, .3, .42, g => { g.fillStyle = '#c23a2e'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#fff'; g.font = '800 40px Baloo2'; g.textAlign = 'center'; for (const [t, y] of [['KEEP', 90], ['CALM', 140], ['AND', 190], ['ASK', 240], ['NANA', 290]]) g.fillText(t, 128, y); }, '#1e1e22');
  frame(-1.75, 1.6, .3, .22, g => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 256, 320); g.strokeStyle = '#c9a36a'; g.lineWidth = 10; g.strokeRect(12, 12, 232, 296); g.fillStyle = '#1e1e22'; g.font = '800 30px Baloo2'; g.textAlign = 'center'; g.fillText('CERTIFICATE', 128, 110); g.fillText('OF KNOWING', 128, 160); g.fillText('THINGS', 128, 210); g.fillStyle = '#c23a2e'; g.beginPath(); g.arc(128, 260, 22, 0, 7); g.fill(); }, '#c9a36a');
  // string lights along the top of the wall
  const bulbM = ['#ffd84a', '#ff8a6a', '#9be0ff', '#7be07b'].map(c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.6) }));
  const wire = []; for (let i = 0; i <= 40; i++) { const x = -2 + i * .1; wire.push(new THREE.Vector3(x, 2.48 - .06 * Math.abs(Math.sin(i * Math.PI / 8)), -1.66)); }
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 120, .003, 4), new THREE.MeshStandardMaterial({ color: '#1e1e22' })));
  wire.forEach((p, i) => { if (i % 2) return; const b = new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 8), bulbM[(i / 2) % 4]); b.position.copy(p).add(new THREE.Vector3(0, -.025, .005)); scene.add(b); });
  // a second shelf with jars, a globe and a toy robot
  // (the first shelf sits at 1.98; this one hangs lower left, under the clock)
  const sh2y = 1.37; put(R(.55, .025, .16, .005, '#9c6a3a'), -1.05 + 1.95, sh2y - .02, -1.61);
  const globe = new THREE.Group(); const gs = new THREE.Mesh(new THREE.SphereGeometry(.07, 24, 16), new THREE.MeshStandardMaterial({ color: '#3f7ab8', roughness: .4 })); gs.position.y = .11; const gb2 = cyl(.035, .045, .03, M.leg, 16); gb2.position.y = .015; globe.add(gs, gb2);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), new THREE.MeshStandardMaterial({ color: '#5aa04a', roughness: .6 })); l.scale.set(1, .5, .3); const a = i * 1.3; l.position.set(Math.cos(a) * .06, .11 + Math.sin(i) * .04, Math.sin(a) * .06); globe.add(l); }
  put(globe, .72, sh2y, -1.6);
  const robot = new THREE.Group(); const rb = R(.06, .07, .05, .01, '#c9ccd0', .35); rb.position.y = .035; const rh = R(.05, .045, .045, .01, '#c9ccd0', .35); rh.position.y = .095; const ant = cyl(.003, .003, .03, M.black, 6); ant.position.y = .13;
  for (const sx of [-.012, .012]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.006, 8, 6), new THREE.MeshBasicMaterial({ color: '#4ad0ff' })); e.position.set(sx, .1, .023); robot.add(e); }
  robot.add(rb, rh, ant); put(robot, 1.0, sh2y, -1.58, -.3);
  for (const [x, c] of [[1.1, '#e8a33a'], [1.16, '#7be07b']]) { const j = cyl(.025, .025, .07, new THREE.MeshStandardMaterial({ color: c, roughness: .2, transparent: true, opacity: .8 }), 16); put(j, x, sh2y + .035, -1.6); }
  // the desk front: drawers with knobs and stickers
  for (const [x, w] of [[-.6, .5], [.6, .5]]) {
    for (const [y, h] of [[DY - .2, .12], [DY - .34, .12], [DY - .48, .12]]) { put(R(w, h, .02, .006, '#8a5a32', .55), x, y, .3); put(R(.08, .015, .02, .006, '#d8c08a', .3), x, y, .315); }
  }
  const stk = (x, y, c, t) => { const c2 = document.createElement('canvas'); c2.width = 128; c2.height = 128; const g = c2.getContext('2d'); g.fillStyle = c; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 34px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 64, 66); const tt = new THREE.CanvasTexture(c2); tt.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.CircleGeometry(.04, 24), new THREE.MeshBasicMaterial({ map: tt, transparent: true })); m.position.set(x, y, .312); scene.add(m); };
  stk(-.75, DY - .17, '#c23a2e', 'WOW'); stk(.42, DY - .32, '#2456c8', '?!'); stk(.8, DY - .46, '#3f8a5a', 'A+');
  // under the desk: a rug, a waste bin full of paper, a backpack, cables
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), mat(rugPaint(), [1, 1], { bump: .5 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .004, -.2); rug.receiveShadow = true; scene.add(rug);
  const bin = new THREE.Group(); const bw = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .3, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#3f8a5a', roughness: .5, side: THREE.DoubleSide })); bw.position.y = .15; bin.add(bw);
  for (let i = 0; i < 5; i++) { const pb = new THREE.Mesh(new THREE.IcosahedronGeometry(.05, 1), paperM); pb.position.set(Math.cos(i * 2) * .05, .28 + (i % 2) * .03, Math.sin(i * 2) * .05); bin.add(pb); }
  put(bin, .98, 0, .15);
  const bag = new THREE.Group(); const bb = R(.32, .4, .16, .06, '#d8762e', .7); bb.position.y = .2; const bp = R(.22, .16, .04, .03, '#b85a22', .7); bp.position.set(0, .14, .09); bag.add(bb, bp); put(bag, -1.05, 0, .05, .4);
  // more desk clutter: a closed laptop with stickers, a stack of books, a cactus, a tape dispenser, a plate of cookies, pencils
  const lap = new THREE.Group(); const lb2 = R(.34, .018, .23, .008, '#9aa1ab', .3); lb2.position.y = .009; lap.add(lb2); for (const [x, z, c] of [[-.08, .03, '#ffd84a'], [.06, -.04, '#c23a2e'], [.1, .06, '#4ad0ff']]) { const d = new THREE.Mesh(new THREE.CircleGeometry(.025, 16), new THREE.MeshBasicMaterial({ color: c })); d.rotation.x = -Math.PI / 2; d.position.set(x, .0185, z); lap.add(d); }
  put(lap, .52, DY, -.25, -.2);
  [['#c23a2e', .04], ['#2456c8', .035], ['#e8a33a', .03]].forEach(([c, h], i) => put(R(.2 - i * .015, h, .15, .004, c, .7), -.75, DY + [0, .04, .075][i] + h / 2, .08, .3 + i * .15));
  const cac = new THREE.Group(); const cp2 = cyl(.035, .028, .06, new THREE.MeshStandardMaterial({ color: '#e08a5a', roughness: .8 }), 16); cp2.position.y = .03; const cb2 = new THREE.Mesh(new THREE.CapsuleGeometry(.022, .06, 6, 12), new THREE.MeshStandardMaterial({ color: '#4e8a3a', roughness: .6 })); cb2.position.y = .1; cac.add(cp2, cb2); put(cac, .9, DY, .05);
  put(R(.1, .045, .045, .015, '#1e1e22', .4), -.35, DY + .0225, .15, .2);
  const plate = new THREE.Group(); const pl = cyl(.08, .07, .01, M.white, 32); pl.position.y = .005; plate.add(pl); for (let i = 0; i < 4; i++) { const ck = cyl(.025, .025, .008, new THREE.MeshStandardMaterial({ color: '#c98a4a', roughness: .8 }), 16); ck.position.set(Math.cos(i * 1.6) * .03, .014 + i * .004, Math.sin(i * 1.6) * .03); plate.add(ck); } put(plate, .22, DY, -.32);
  [[-.05, '#e8a33a', .3], [.02, '#3f8a5a', -.5], [.3, '#c23a2e', 1.2]].forEach(([x, c, r]) => { const pc2 = cyl(.004, .004, .16, new THREE.MeshStandardMaterial({ color: c, roughness: .5 }), 8); pc2.rotation.z = Math.PI / 2; pc2.rotation.y = r; pc2.position.set(x, DY + .004, -.12); pc2.castShadow = true; scene.add(pc2); });
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[.52, DY + .01, -.36], [.7, DY + .005, -.38], [.95, DY - .05, -.42], [1.0, .3, -.45], [.9, .01, -.6]].map(p => new THREE.Vector3(...p))), 40, .005, 6), M.black); scene.add(cable);
  // the front of the desk top: a doodled sheet, a ruler, an eraser, paper clips
  const dc = document.createElement('canvas'); dc.width = 256; dc.height = 320; const dg = dc.getContext('2d'); dg.fillStyle = '#fbf8f0'; dg.fillRect(0, 0, 256, 320); dg.strokeStyle = '#9cc8f0'; dg.lineWidth = 2; for (let y = 30; y < 320; y += 22) { dg.beginPath(); dg.moveTo(0, y); dg.lineTo(256, y); dg.stroke(); }
  dg.strokeStyle = '#2456c8'; dg.lineWidth = 4; dg.beginPath(); dg.arc(80, 90, 30, 0, 7); dg.moveTo(140, 70); dg.lineTo(220, 120); dg.moveTo(40, 200); dg.quadraticCurveTo(120, 140, 200, 230); dg.stroke(); dg.fillStyle = '#c23a2e'; dg.font = '800 34px Baloo2'; dg.fillText('WHY??', 60, 290);
  const dt = new THREE.CanvasTexture(dc); dt.colorSpace = THREE.SRGBColorSpace;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(.21, .27), new THREE.MeshStandardMaterial({ map: dt, roughness: .9 })); sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = .15; sheet.position.set(-.18, DY + .0012, .2); sheet.receiveShadow = true; scene.add(sheet);
  const ruler = rbox(.3, .003, .035, .001, new THREE.MeshStandardMaterial({ color: '#f2c335', roughness: .5 })); ruler.position.set(.2, DY + .0016, .24); ruler.rotation.y = -.1; scene.add(ruler);
  const er = rbox(.05, .015, .025, .005, new THREE.MeshStandardMaterial({ color: '#ff8fa8', roughness: .8 })); er.position.set(.36, DY + .0075, .12); er.rotation.y = .5; er.castShadow = true; scene.add(er);
  for (const [x, z, r] of [[.05, .25, .3], [.08, .22, 1.2], [-.4, .24, 2]]) { const pc3 = new THREE.Mesh(new THREE.TorusGeometry(.012, .0012, 6, 16), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 1, roughness: .3 })); pc3.rotation.x = -Math.PI / 2; pc3.scale.set(1, 2, 1); pc3.position.set(x, DY + .0015, z); pc3.rotation.z = r; scene.add(pc3); }
  // the back of the desk, behind the model: a row of books between bookends, a tall plant, a desk organiser
  const back0 = scene.children.length;
  let bx2 = -.28; for (let i = 0; i < 9; i++) { const w = .03 + h2(i, 5, 6) * .02, hh = .18 + h2(i, 6, 6) * .1; put(R(w, hh, .14, .004, bookC[(i + 3) % bookC.length], .7), bx2 + w / 2, DY + hh / 2, -.43); bx2 += w + .003; }
  for (const x of [-.3, bx2 + .01]) put(R(.015, .16, .12, .003, '#1e1e22', .4), x, DY + .08, -.43);
  const tp = new THREE.Group(); const tpot = cyl(.07, .055, .14, new THREE.MeshStandardMaterial({ color: '#2a6a7a', roughness: .7 }), 20); tpot.position.y = .07; tp.add(tpot);
  for (let i = 0; i < 12; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), leafM); lf.scale.set(.35, 2.2, .2); const a2 = i / 12 * Math.PI * 2; lf.position.set(Math.cos(a2) * .05, .26 + h2(i, 7, 5) * .1, Math.sin(a2) * .05); lf.rotation.set(Math.sin(a2) * .5, a2, Math.cos(a2) * .5); tp.add(lf); }
  put(tp, .3, DY, -.45);
  const org = new THREE.Group(); const ob = R(.16, .1, .08, .01, '#e8a33a', .6); ob.position.y = .05; org.add(ob); for (const [x, c] of [[-.05, '#c23a2e'], [0, '#2456c8'], [.05, '#3f8a5a']]) { const p3 = cyl(.004, .004, .14, new THREE.MeshStandardMaterial({ color: c }), 8); p3.position.set(x, .12, 0); org.add(p3); } put(org, -.45, DY, -.42);
  K.backRow = scene.children.slice(back0);   // shown only on the close demo shots (a cheat: it would hide the cast in the wides)
  // the hero cap and pen
  K.DY = DY;
  K.cap = makeCap(); K.cap.position.set(-.12, DY, .16); scene.add(K.cap);
  K.pen = makePen(); K.pen.position.set(.08, DY + .0045, .17); K.pen.rotation.y = .15; scene.add(K.pen);
  // the model: two clear tubes on a stand, an enlarged cap stuck in each (left: no hole, right: hole)
  const rig = new THREE.Group(); const base = rbox(.36, .03, .14, .01, M.black); base.position.y = .015; rig.add(base);
  K.TUBE = { h: .34, r: .03, x: [-.09, .09], y0: .03 };
  for (const [i, x] of K.TUBE.x.entries()) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(K.TUBE.r, K.TUBE.r, K.TUBE.h, 40, 1, true), M.glass); t.position.set(x, .03 + K.TUBE.h / 2, 0); t.renderOrder = 4; rig.add(t);
    for (const y of [.03, .03 + K.TUBE.h]) { const rr = new THREE.Mesh(new THREE.TorusGeometry(K.TUBE.r, .0025, 8, 40), M.rim); rr.rotation.x = Math.PI / 2; rr.position.set(x, y, 0); rig.add(rr); }
    const c = makeCap(i ? '#2456c8' : '#2456c8', i === 1); c.scale.set(5, 2.2, 5); c.position.set(x, .16, 0); c.children[0].material = c.children[0].material.clone(); rig.add(c);
  }
  const sign = document.createElement('canvas'); sign.width = 512; sign.height = 96; const sg = sign.getContext('2d'); sg.fillStyle = '#f4f1e8'; sg.fillRect(0, 0, 512, 96); sg.fillStyle = '#1e1e22'; sg.font = '800 54px Baloo2'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('MODEL · NOT TO SCALE', 256, 50);
  const st = new THREE.CanvasTexture(sign); st.colorSpace = THREE.SRGBColorSpace;
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(.3, .056), new THREE.MeshStandardMaterial({ map: st, roughness: .6 })); lab.position.set(0, .03, .075); rig.add(lab);
  rig.position.set(0, DY, -.02); scene.add(rig); K.rig = rig;
  return K;
}

// —— Peephole additions: two juice cans on a tilting stand, two glasses that fill, an enlarged clear cut-away pen ——
export function buildPour(scene, DY) {
  const P = {}, root = new THREE.Group(); scene.add(root); P.root = root;
  const canTex = label => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ff9a2e'); gr.addColorStop(1, '#f06a1e'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff'; g.font = '800 64px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('JUICE', 256, 110); g.font = '800 30px Baloo2'; g.fillText(label, 256, 175);
    g.fillStyle = '#3f8a3a'; g.beginPath(); g.ellipse(120, 60, 30, 14, -.5, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const steel = new THREE.MeshStandardMaterial({ color: '#d0d4da', roughness: .25, metalness: 1 });
  const glassM = new THREE.MeshStandardMaterial({ color: '#e8f4ff', roughness: .05, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide });
  const juiceM = new THREE.MeshStandardMaterial({ color: '#ff9a2e', roughness: .15, emissive: '#7a3a00', emissiveIntensity: .25 });
  P.cans = []; P.glasses = [];
  for (const [i, x] of [[0, -.14], [1, .13]]) {
    const pivot = new THREE.Group(); pivot.position.set(x - .06, DY + .2, 0); root.add(pivot);
    const can = new THREE.Group(); can.position.set(.06, 0, 0); pivot.add(can);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.033, .033, .12, 40), [new THREE.MeshStandardMaterial({ map: canTex(i ? 'TWO HOLES' : 'ONE HOLE'), roughness: .3, metalness: .3 }), steel, steel]); body.castShadow = true; can.add(body);
    const holeM = new THREE.MeshBasicMaterial({ color: '#111' });
    const h1 = new THREE.Mesh(new THREE.CircleGeometry(.006, 16), holeM); h1.rotation.x = -Math.PI / 2; h1.position.set(.02, .0605, 0); can.add(h1);
    if (i) { const h2b = new THREE.Mesh(new THREE.CircleGeometry(.0045, 16), holeM); h2b.rotation.x = -Math.PI / 2; h2b.position.set(-.02, .0605, 0); can.add(h2b); }
    const arm = rbox(.012, .2, .012, .003, new THREE.MeshStandardMaterial({ color: '#1e1e22', roughness: .4 })); arm.position.set(x - .06, DY + .1, -.045); root.add(arm);
    P.cans.push({ pivot, can, spout: new THREE.Vector3(.02, .0605, 0) });
    const gl = new THREE.Group(); gl.position.set(x + .07, DY, .0); root.add(gl);
    const gw = new THREE.Mesh(new THREE.CylinderGeometry(.032, .027, .1, 40, 1, true), glassM); gw.position.y = .05; gw.renderOrder = 4; gl.add(gw);
    const gb = new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .006, 32), glassM); gb.position.y = .003; gl.add(gb);
    const jc = new THREE.Mesh(new THREE.CylinderGeometry(.029, .026, 1, 32), juiceM); jc.position.y = .006; gl.add(jc); jc.geometry.translate(0, .5, 0);
    P.glasses.push({ g: gl, juice: jc });
  }
  const base = rbox(.5, .02, .12, .006, new THREE.MeshStandardMaterial({ color: '#1e1e22', roughness: .4 })); base.position.set(0, DY + .01, -.045); root.add(base);
  // the cut-away pen: a clear barrel 10× (1.4 m would be too big: 6×, lying across the desk), an ink tube with a moving ink column
  const cp = new THREE.Group(); cp.position.set(0, DY + .07, 0); scene.add(cp);
  const clear = new THREE.MeshStandardMaterial({ color: '#cfe6ff', roughness: .05, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .6, 48, 1, true), clear); bar.rotation.z = Math.PI / 2; bar.renderOrder = 4; cp.add(bar);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.027, .09, 48, 1, true), clear); tip.rotation.z = -Math.PI / 2; tip.position.x = .345; tip.renderOrder = 4; cp.add(tip);
  const plug = cyl(.026, .026, .04, new THREE.MeshStandardMaterial({ color: '#2456c8', roughness: .3 }), 32); plug.rotation.z = Math.PI / 2; plug.position.x = -.32; cp.add(plug);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .58, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: .2, transparent: true, opacity: .45, depthWrite: false })); tube.rotation.z = Math.PI / 2; tube.position.x = .02; cp.add(tube);
  const ink = new THREE.Mesh(new THREE.CylinderGeometry(.0085, .0085, 1, 20), new THREE.MeshStandardMaterial({ color: '#1a3fb0', roughness: .2 })); ink.rotation.z = Math.PI / 2; cp.add(ink);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.006, 16, 12), new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: .2, metalness: 1 })); ball.position.x = .39; cp.add(ball);
  const hr = new THREE.Mesh(new THREE.TorusGeometry(.0055, .0015, 8, 24), new THREE.MeshStandardMaterial({ color: '#1e1e22' })); hr.rotation.x = Math.PI / 2; hr.position.set(.1, .027, 0); cp.add(hr);
  P.cut = cp; P.ink = ink; P.HOLE = new THREE.Vector3(.1, .027, 0);
  P.setInk = k => { const x0 = -.27 + .3 * k, x1 = .31; ink.scale.y = x1 - x0; ink.position.x = (x0 + x1) / 2; };   // the ink column shrinks from the back as it flows to the tip
  return P;
}
