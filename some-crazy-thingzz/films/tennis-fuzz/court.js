// court.js — the set for "Bald Serve": a blue hard court at noon (lines, net, chain-link fence with a windscreen banner carrying the channel name, light poles, a bench with a ball hopper, trees), a two-lane ball machine, a tennis ball with fur-shell fuzz that can be shaved bald and given a knitted sweater, an electric shaver.
// Units: metres. Ground y = 0; the camera mostly looks toward -z.
import * as THREE from 'three';
import { paint, mat, wood, fbm, h2, rbox, cyl, box, foliage } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function felt() {
  const W = 512, H = 256, s = 13, A = hex('#d8e84a'), B = hex('#c4d838');
  return paint(W, H, (x, y) => {
    const u = x / W, v = y / H, lon = u * Math.PI * 2, lat = (v - .5) * Math.PI;
    const n = fbm(u * 40, v * 20, s, 3, 40), f = h2(x, y, s);
    let c = mix3(A, B, n).map(k => k * (.86 + f * .22));
    const seam = Math.abs(lat - .55 * Math.sin(2 * lon) * Math.cos(lat) ** .3);   // a wavy seam round the ball
    if (seam < .045) c = mix3(c, [246, 246, 236], clamp((.045 - seam) / .02));
    return { c, r: 1, h: .5 + (f - .5) * .6 };
  });
}
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
// the court: blue playing area, green surround, white lines (singles + doubles), a little grit; covers x −9…9, z +6…−30
const CW = 18, CL = 36, CZ0 = 6;
function courtPaint() {
  const W = 1024, H = 2048, s = 23, blue = hex('#3f6fb0'), green = hex('#4f8a5a'), white = [244, 244, 238];
  const px = x => (x + CW / 2) / CW * W, pz = z => (CZ0 - z) / CL * H, lw = .05 / CW * W;
  const L = [];   // white lines as rectangles in metres [x0, z0, x1, z1]
  const hl = (x0, x1, z) => L.push([x0, z - .025, x1, z + .025]), vl = (x, z0, z1) => L.push([x - .025, z1, x + .025, z0]);
  for (const z of [0, -23.77]) hl(-5.485, 5.485, z);
  for (const x of [-5.485, 5.485, -4.115, 4.115]) vl(x, 0, -23.77);
  for (const z of [-5.485, -18.285]) hl(-4.115, 4.115, z);
  vl(0, -5.485, -18.285); L.push([-.025, -.1, .025, 0]); L.push([-.025, -23.77, .025, -23.67]);
  return paint(W, H, (x, y) => {
    const mx = x / W * CW - CW / 2, mz = CZ0 - y / H * CL;
    const inC = Math.abs(mx) < 6.9 && mz < 3.6 && mz > -27.4;
    const n = fbm(x / 40, y / 40, s, 3), f = h2(x, y, s);
    let c = (inC ? blue : green).map(k => k * (.94 + n * .08 + (f - .5) * .06));
    for (const [x0, z0, x1, z1] of L) if (mx >= x0 && mx <= x1 && mz >= z0 && mz <= z1) { c = white.map(k => k * (.96 + f * .04)); break; }
    return { c, r: .78 + f * .1, h: .5 + (f - .5) * .4 };
  });
}
function rubber() { const W = 256, H = 128, s = 31; return paint(W, H, (x, y) => { const u = x / W, v = y / H, lon = u * Math.PI * 2, lat = (v - .5) * Math.PI, f = h2(x, y, s);
  const seam = Math.abs(lat - .55 * Math.sin(2 * lon) * Math.cos(lat) ** .3); let c = mix3(hex('#b9c25a'), hex('#a8b04c'), fbm(u * 8, v * 4, s, 3)).map(k => k * (.95 + f * .06));
  if (seam < .03) c = c.map(k => k * .6); return { c, r: .35, h: seam < .03 ? .2 : .5 }; }); }
function knit() { const W = 256, s = 37; return paint(W, W, (x, y) => { const u = x / W, v = y / W, row = Math.floor(v * 16), stripe = row % 6 < 3;
  const st = Math.abs(((u * 24 + (row % 2) * .5) % 1) - .5); let c = stripe ? hex('#d8342a') : hex('#f4efe2'); c = c.map(k => k * (.8 + (.5 - st) * .4 + h2(x, y, s) * .06));
  return { c, r: 1, h: .5 - st }; }); }
function mesh() {   // chain-link diamonds as an alpha map
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#fff'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function banner(text) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#1f4d32'; g.fillRect(0, 0, 2048, 256);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .1})`; g.fillRect(Math.random() * 2048, Math.random() * 256, 2, 2); }
  g.fillStyle = '#ffd84a'; g.font = '800 150px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 1024, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function fiberTex(seed) {   // alpha dots for one fur shell
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#fff'; for (let i = 0; i < 9000; i++) { const x = h2(i, 1, seed) * 512, y = h2(i, 2, seed) * 256; g.fillRect(x, y, 2, 2); }
  const t = new THREE.CanvasTexture(c); return t;
}

// —— a tennis ball: felt + fur shells; shave(k) takes the fuzz off (k = 1: bald rubber); sweater(on) dresses it ——
export class TennisBall {
  constructor(r = .0335, o = {}) {
    this.r = r; this.g = new THREE.Group();
    this.feltM = mat(felt(), [1, 1], { bump: .6 }); this.rubM = mat(rubber(), [1, 1], { bump: .3 });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), this.feltM); this.core.castShadow = this.core.receiveShadow = true; this.g.add(this.core);
    this.shells = [];
    const n = o.shells ?? 10;
    for (let i = 1; i <= n; i++) {
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d8e84a').multiplyScalar(.75 + .3 * i / n), alphaMap: fiberTex(i * 7), alphaTest: .5, transparent: false, roughness: 1 });
      const s = new THREE.Mesh(new THREE.SphereGeometry(r * (1 + i * .014), 48, 32), m); s.rotation.set(i, i * 2, 0); this.g.add(s); this.shells.push(s);
    }
    const sw = new THREE.Group(); const km = mat(knit(), [3, 1], { bump: .8 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * .98, r * 1.05, 40, 1, true), km); band.material.side = THREE.DoubleSide; sw.add(band);
    for (const y of [-.575, .575]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * .09, 10, 40), km); t.rotation.x = Math.PI / 2; t.position.y = y * r; sw.add(t); }
    for (const sx of [-1, 1]) { const sl = new THREE.Mesh(new THREE.CylinderGeometry(r * .22, r * .22, r * .45, 16), km); sl.rotation.z = Math.PI / 2; sl.position.set(sx * r * 1.15, r * .25, 0); sw.add(sl); }
    sw.visible = false; this.sw = sw; this.g.add(sw);
    this.k = -1; this.shave(0);
  }
  shave(k) {
    k = clamp(k); if (k === this.k) return; this.k = k;
    const n = this.shells.length; this.shells.forEach((s, i) => { s.visible = (i + 1) / n > k * 1.05; });
    this.core.material = k > .6 ? this.rubM : this.feltM;
  }
  sweater(on) { this.sw.visible = !!on; }
}

// —— the set ——
export function buildCourt(scene) {
  const K = {};
  const M = K.M = {
    court: mat(courtPaint(), [1, 1], { bump: .3 }),
    post: mat(wood({ planks: 1, seed: 7 }), [1, 2], { bump: .5 }),
    leaf: mat(foliage({ a: '#2c5224', b: '#7aa046' }), [2, 2]), leafB: mat(foliage({ a: '#3a5e2a', b: '#93ac52', seed: 4 }), [2, 2]),
    bark: new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: .9 }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: .5 }),
    green: new THREE.MeshStandardMaterial({ color: '#2a4a34', roughness: .8 }),
    steel: new THREE.MeshStandardMaterial({ color: '#5a636b', roughness: .45, metalness: .8 }),
    black: new THREE.MeshStandardMaterial({ color: '#1e1e22', roughness: .4 }),
    net: new THREE.MeshStandardMaterial({ color: '#111', alphaMap: mesh(), alphaTest: .4, side: THREE.DoubleSide, roughness: .9 }),
    fence: new THREE.MeshStandardMaterial({ color: '#7d878f', metalness: .6, roughness: .5, alphaMap: mesh(), alphaTest: .4, side: THREE.DoubleSide }),
    orange: new THREE.MeshStandardMaterial({ color: '#e8762e', roughness: .5 }), grey: new THREE.MeshStandardMaterial({ color: '#c9ccd0', roughness: .4, metalness: .3 }),
  };
  M.net.alphaMap.repeat.set(160, 14); M.fence.alphaMap.repeat.set(90, 18);
  const court = new THREE.Mesh(new THREE.PlaneGeometry(CW, CL), M.court); court.rotation.x = -Math.PI / 2; court.position.set(0, 0, CZ0 - CL / 2); court.receiveShadow = true; scene.add(court);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#6f9a48', roughness: .95 })); grass.rotation.x = -Math.PI / 2; grass.position.y = -.01; grass.receiveShadow = true; scene.add(grass);
  // the net
  const NZ = -11.885;
  const netG = new THREE.PlaneGeometry(12.8, 1, 1, 8); const np = netG.attributes.position;
  for (let i = 0; i < np.count; i++) { const x = np.getX(i), y = np.getY(i) + .5; np.setY(i, y * (1.07 - .156 * (1 - (x / 6.4) ** 2))); }
  const net = new THREE.Mesh(netG, M.net); net.position.set(0, 0, NZ); scene.add(net);
  const tape = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([-6.4, -3.2, 0, 3.2, 6.4].map(x => new THREE.Vector3(x, 1.07 - .156 * (1 - (x / 6.4) ** 2), NZ))), 40, .028, 6), M.white); tape.castShadow = true; scene.add(tape);
  for (const x of [-6.4, 6.4]) { const p = cyl(.04, .04, 1.1, M.green, 12); p.position.set(x, .55, NZ); scene.add(p); }
  // the fence with windscreens (the channel name on the far one)
  const FH = 3.6, FZ1 = 5.6, FZ2 = -29.4, FX = 8.6;
  const fence = (w, cx, cz, ry) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, FH), M.fence); f.position.set(cx, FH / 2, cz); f.rotation.y = ry; scene.add(f);
    for (let s = -w / 2; s <= w / 2 + .01; s += 3) { const p = cyl(.035, .035, FH, M.steel, 8); p.position.set(cx + Math.cos(ry) * s, FH / 2, cz - Math.sin(ry) * s); scene.add(p); } };
  fence(FX * 2, 0, FZ2, 0); fence(FX * 2, 0, FZ1, 0); fence(FZ1 - FZ2, -FX, (FZ1 + FZ2) / 2, Math.PI / 2); fence(FZ1 - FZ2, FX, (FZ1 + FZ2) / 2, Math.PI / 2);
  const bt = banner('SOME CRAZY THINGZZ TENNIS CLUB');
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(FX * 2 - .2, 1.9), new THREE.MeshStandardMaterial({ map: bt, roughness: .9 })); ws.position.set(0, 1.05, FZ2 - .02); ws.receiveShadow = true; scene.add(ws);
  const ws2 = new THREE.Mesh(new THREE.PlaneGeometry(FX * 2 - .2, 1.9), new THREE.MeshStandardMaterial({ map: banner('SOME CRAZY THINGZZ TENNIS CLUB'), roughness: .9, side: THREE.BackSide })); ws2.position.set(0, 1.05, FZ1 + .02); scene.add(ws2);
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(FZ1 - FZ2, 1.9), M.green); w.position.set(sx * (FX + .02), 1.05, (FZ1 + FZ2) / 2); w.rotation.y = Math.PI / 2; scene.add(w); }
  K.FZ2 = FZ2;
  // light poles, a bench with a ball hopper
  for (const [x, z] of [[-FX - .3, -2], [FX + .3, -2], [-FX - .3, -22], [FX + .3, -22]]) { const p = cyl(.08, .1, 9, M.steel, 10); p.position.set(x, 4.5, z); scene.add(p); const h = rbox(.9, .35, .3, .04, M.grey); h.position.set(x * .97, 9, z); scene.add(h); }
  const bench = new THREE.Group(); const seat = rbox(1.6, .05, .4, .01, M.post); seat.position.y = .45; bench.add(seat);
  for (const x of [-.7, .7]) { const l = rbox(.06, .45, .36, .01, M.black); l.position.set(x, .22, 0); bench.add(l); }
  bench.position.set(7.4, 0, -11); bench.rotation.y = -Math.PI / 2; scene.add(bench);
  // trees outside
  const tree = (x, z, s, m) => {
    const g = new THREE.Group(); const tr = cyl(.25 * s, .35 * s, 3 * s, M.bark, 10); tr.position.y = 1.5 * s; g.add(tr);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.6 + h2(i, x | 0, 3)) * s, 1), m); b.position.set((h2(i, 1, x | 0) - .5) * 2.2 * s, (3.6 + h2(i, 2, x | 0) * 1.8) * s, (h2(i, 3, x | 0) - .5) * 2 * s); b.castShadow = true; g.add(b); }
    g.position.set(x, 0, z); scene.add(g);
  };
  for (let i = 0; i < 16; i++) tree(-22 + i * 3 + h2(i, 1, 2) * 2, -36 - h2(i, 2, 2) * 8, 1 + h2(i, 3, 2) * .5, i % 2 ? M.leaf : M.leafB);
  for (let i = 0; i < 10; i++) { const sx = i % 2 ? 1 : -1; tree(sx * (13 + h2(i, 4, 2) * 6), 4 - i * 4, 1.1, i % 3 ? M.leafB : M.leaf); }
  // the ball machine (two tubes: lanes at x = ±.18)
  const bm = new THREE.Group(); const body = rbox(.55, .5, .7, .06, M.orange); body.position.y = .45; bm.add(body);
  const hop = rbox(.6, .25, .6, .04, M.black); hop.position.y = .82; bm.add(hop);
  for (const x of [-.18, .18]) { const t = cyl(.055, .055, .45, M.grey, 16); t.rotation.x = Math.PI / 2 + .25; t.position.set(x, .62, -.4); bm.add(t); }
  for (const [x, z] of [[-.25, .3], [.25, .3], [-.25, -.3], [.25, -.3]]) { const w = cyl(.09, .09, .05, M.black, 16); w.rotation.z = Math.PI / 2; w.position.set(x * 1.2, .09, z); bm.add(w); }
  bm.position.set(0, 0, .6); scene.add(bm); K.machine = bm;
  // moving props: the hero ball (shaved, sweater), a fuzzy demo ball, a bald demo ball, the rally ball, the shaver
  K.ball = new TennisBall(); scene.add(K.ball.g);
  K.fuzzy = new TennisBall(.0335, { shells: 4 }); scene.add(K.fuzzy.g);
  K.bald = new TennisBall(.0335, { shells: 1 }); K.bald.shave(1); scene.add(K.bald.g);
  K.rally = new TennisBall(.0335, { shells: 3 }); scene.add(K.rally.g);
  const sh = new THREE.Group(); const sb = rbox(.045, .13, .032, .014, M.black); sb.position.y = .085; const head = rbox(.055, .02, .036, .008, M.grey); head.position.y = .01; sh.add(sb, head);
  for (const x of [-.014, .014]) { const c = cyl(.009, .009, .006, M.steel, 16); c.position.set(x, -.001, 0); sh.add(c); }
  sh.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(sh); K.shaver = sh;
  return K;
}
