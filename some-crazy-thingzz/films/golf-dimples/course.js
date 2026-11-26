// course.js — the set for "Sand Trap": a tee box at golden hour (mown stripes, tee markers, a club sign with the channel logo, a golf bag),
// a fairway rolling away to trees, a bunker and a flag; a golf ball with real dimples that can be sanded smooth; a tennis ball; a sanding block;
// and the smoke board (a wind-tunnel demo on an easel) whose smoke is drawn into the board's canvas every frame.
// Units: metres. Ground y = 0; the camera mostly looks toward -z.
import * as THREE from 'three';
import { paint, mat, wood, fbm, h2, rbox, cyl, box, foliage } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// —— surfaces ——
// mown turf: two stripes (light / dark) across u, fine blades, a little clover; the texture covers 4 m × 4 m
function turf(o = {}) {
  const W = 1024, s = o.seed ?? 5, L = hex('#7fb04a'), D = hex('#5f9238'), Y = hex('#a6b85a'), deep = hex('#3f6a26');
  return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, stripe = Math.floor(u * 2) % 2;
    const big = fbm(u * 6, v * 6, s, 4, 6), blade = fbm(u * 260, v * 90, s + 1, 2, 260), fine = h2(x, y, s);
    let c = stripe ? D : L; c = mix3(c, Y, clamp((big - .55) * 1.6) * .5); c = mix3(c, deep, clamp((blade - .58) * 2.4) * .6);
    c = c.map(k => k * (.88 + fine * .2));
    return { c, r: .9, h: blade * .8 + big * .2 };
  });
}
function sand() {
  const W = 256, s = 9; return paint(W, W, (x, y) => { const n = fbm(x / 30, y / 30, s, 4, 8.53), f = h2(x, y, s); return { c: mix3(hex('#d9c08a'), hex('#efdcae'), n).map(k => k * (.92 + f * .12)), r: .95, h: n * .6 + f * .4 }; });
}
// fuzzy tennis felt with the white seam (u around, v pole to pole)
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
// sandpaper grit
function grit() {
  const W = 256, s = 17; return paint(W, W, (x, y) => { const f = h2(x, y, s), g = h2(x >> 1, y >> 1, s + 1); return { c: mix3(hex('#9a6a3c'), hex('#d8b07a'), g).map(k => k * (.75 + f * .35)), r: 1, h: g }; });
}
// the club sign: painted board with the channel logo
function signCanvas() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 448; const g = c.getContext('2d');
  g.fillStyle = '#1f4d32'; g.fillRect(0, 0, 768, 448);
  g.strokeStyle = '#e9d9a6'; g.lineWidth = 14; g.strokeRect(22, 22, 724, 404);
  g.fillStyle = '#ffd84a'; g.font = '800 92px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SOME CRAZY', 384, 128); g.fillText('THINGZZ', 384, 222);
  g.fillStyle = '#e9d9a6'; g.font = '800 54px Baloo2'; g.fillText('GOLF CLUB · HOLE 1', 384, 330);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .08})`; g.fillRect(Math.random() * 768, Math.random() * 448, 2, 2); }
  return c;
}

// —— a golf ball with real dimples; sand(k) lowers them to 0 (k = 1: perfectly smooth) ——
export class GolfBall {
  constructor(r = .0214, o = {}) {
    this.r = r;
    const N = 332, C = [];
    for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5)); C.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
    const th = .118, cth = Math.cos(th), depth = .035;
    this.geo = new THREE.SphereGeometry(1, o.seg ?? 240, o.rings ?? 180);
    const P = this.geo.attributes.position, n = P.count; this.dir = new Float32Array(n * 3); this.dent = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i); this.dir.set([x, y, z], i * 3);
      let best = -1; for (const c of C) { const d = x * c[0] + y * c[1] + z * c[2]; if (d > best) best = d; }
      if (best > cth) { const a = Math.acos(Math.min(1, best)) / th; this.dent[i] = depth * (1 - a * a) ** .8; }
    }
    this.mat = new THREE.MeshStandardMaterial({ color: '#f7f5ef', roughness: .42, metalness: 0, envMapIntensity: 1 });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.scale.setScalar(r); this.k = -1; this.sand(0);
  }
  sand(k) {
    k = +clamp(k).toFixed(3); if (k === this.k) return; this.k = k;
    const P = this.geo.attributes.position, d = this.dir;
    for (let i = 0; i < P.count; i++) { const s = 1 - this.dent[i] * (1 - k); P.setXYZ(i, d[i * 3] * s, d[i * 3 + 1] * s, d[i * 3 + 2] * s); }
    P.needsUpdate = true; this.geo.computeVertexNormals();
    const N = this.geo.attributes.normal;   // the poles of a UV sphere give zero-length normals (NaN in the shader → black blocks after bloom / DOF)
    for (let i = 0; i < N.count; i++) { const x = N.getX(i), y = N.getY(i), z = N.getZ(i), l = Math.hypot(x, y, z); if (!(l > .5)) N.setXYZ(i, d[i * 3], d[i * 3 + 1], d[i * 3 + 2]); }
    N.needsUpdate = true;
    this.mat.roughness = lerp(.42, .06, k ** 1.5); this.mat.color.set(k > .5 ? '#fbfaf6' : '#f7f5ef'); this.mat.envMapIntensity = lerp(1, 2.2, k);
  }
}

// —— the smoke board: flow past two balls drawn into a canvas (board units: px; 1024 px = 1 m) ——
export class SmokeBoard {
  constructor(o) {
    this.W = 1024; this.H = Math.round(1024 * o.h / o.w); this.balls = o.balls;   // [{ x, y, R, sep (deg), kind }]
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.H; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.last = null;
  }
  // a streamline of potential flow past a cylinder (radius R) that starts at height y0 far upstream: y at horizontal offset x
  static potY(x, y0, R) {
    if (Math.abs(y0) < 1e-3) return 0;
    let lo = Math.abs(y0), hi = Math.abs(y0) + R * 2;   // |y| ≥ |y0|: lines bulge out round the ball
    const psi = y => y * (1 - R * R / (x * x + y * y));
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (psi(m) < Math.abs(y0)) lo = m; else hi = m; }
    return Math.sign(y0) * (lo + hi) / 2;
  }
  draw(t, on = 1) {
    const key = t.toFixed(3) + on; if (key === this.last) return; this.last = key;
    const g = this.g, W = this.W, H = this.H;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#22262c'); bg.addColorStop(1, '#15181d'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${h2(i, 3, 5) * .03})`; g.fillRect(h2(i, 1, 5) * W, h2(i, 2, 5) * H, 3, 3); }
    // grid (a wind-tunnel board), very faint
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // title arrow: AIR →
    g.font = '800 54px Baloo2'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = 'rgba(160,220,255,.9)'; g.fillText('AIR', 40, 70);
    g.strokeStyle = 'rgba(160,220,255,.9)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(150, 70); g.lineTo(290, 70); g.moveTo(262, 48); g.lineTo(292, 70); g.lineTo(262, 92); g.stroke();
    const U = 260;   // px per second
    for (const b of this.balls) this.flow(g, b, t, U, on);
    for (const b of this.balls) {   // labels
      g.font = '800 60px Baloo2'; g.textAlign = 'left'; g.fillStyle = b.kind === 'smooth' ? '#ff8a6a' : '#ffd84a';
      g.fillText(b.label, 40, b.y - b.R - 150);
    }
    this.tex.needsUpdate = true;
  }
  flow(g, b, t, U, on) {
    const { x: bx, y: by, R } = b, ts = b.sep * Math.PI / 180;
    const xs = -R * Math.cos(ts), ys = R * Math.sin(ts);   // separation point (relative), upper side
    const grow = b.kind === 'smooth' ? .32 : -.6, minW = b.kind === 'smooth' ? R * 1.2 : R * .42;
    const wake = x => x < xs ? 0 : (b.kind === 'smooth' ? Math.min(R * 2.1, ys + (x - xs) * grow) : Math.max(minW, ys + (x - xs) * grow));
    const lines = [];
    for (let y0 = -R * 2.35; y0 <= R * 2.36; y0 += R * .26) lines.push(y0 + R * .13 * Math.sign(y0 || 1) * 0);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const head = (t * U) % 2000;
    for (const y0 of lines) {
      if (Math.abs(y0) < R * .05) continue;
      const pts = [];
      for (let x = -bx; x <= this.W - bx; x += 6) {
        let y = SmokeBoard.potY(Math.max(x, -2000), y0, R);
        const r2 = x * x + y * y;
        if (x > xs) {   // past separation: lines don't follow the back of the ball; they hug the wake boundary
          const w = wake(x); if (Math.abs(y) < w + R * .1) y = Math.sign(y0) * (w + (Math.abs(y0) - 0) * .35 + R * .04);
          y += Math.sin(x * .03 - t * 6 + y0) * (b.kind === 'smooth' ? 3.5 : 1.2) * clamp((x - xs) / R);
        } else if (r2 < (R * 1.02) ** 2) y = Math.sign(y0) * Math.sqrt(Math.max(0, (R * 1.02) ** 2 - x * x));
        pts.push([bx + x, by + y]);
      }
      // the smoke arrives from the left: drawn up to the advancing front
      const front = on >= 1 ? 1e9 : -bx + head;
      g.strokeStyle = 'rgba(240,246,255,.78)'; g.lineWidth = 5; g.beginPath(); let st = false;
      for (const [x, y] of pts) { if (x - bx > front) break; if (!st) { g.moveTo(x, y); st = true; } else g.lineTo(x, y); }
      g.stroke();
      // moving puffs along the line (shows the direction of flow)
      g.fillStyle = 'rgba(255,255,255,.95)';
      for (let k = 0; k < pts.length; k += 1) { const ph = (pts[k][0] - t * U) % 120; if (ph > -6 && ph < 0) { g.beginPath(); g.arc(pts[k][0], pts[k][1], 5.5, 0, Math.PI * 2); g.fill(); } }
    }
    // the wake: curling eddies shed alternately from top and bottom, drifting downstream
    const big = b.kind === 'smooth', n = big ? 7 : 6, sp = big ? R * 1.35 : R * .75, drift = U * .45;
    for (let i = -1; i < n; i++) {
      const x0 = xs + R * .4 + ((i * sp + t * drift) % (n * sp)), w = wake(x0); if (x0 > this.W - bx - 20 || w <= 0) continue;
      const side = (Math.floor((i * sp + t * drift) / sp) + i) % 2 ? 1 : -1, rr = w * (big ? .62 : .55), cy = side * w * .42;
      g.strokeStyle = `rgba(235,240,255,${big ? .55 : .5})`; g.lineWidth = big ? 6 : 4; g.beginPath();
      for (let a = 0; a < Math.PI * 4.2; a += .12) { const r = rr * (1 - a / (Math.PI * 4.6)), ang = side * a + t * 3 * side; const px = bx + x0 + Math.cos(ang) * r, py = by + cy + Math.sin(ang) * r * .8; a === 0 ? g.moveTo(px, py) : g.lineTo(px, py); }
      g.stroke();
    }
    // a soft smoke fill in the wake
    for (let i = 0; i < (big ? 60 : 24); i++) {
      const x0 = xs + ((h2(i, 1, b.y) * 1.2 + t * .35) % 1.2) * (big ? R * 9 : R * 8), w = wake(x0); if (w <= 0 || x0 > this.W - bx) continue;
      const y = (h2(i, 2, b.y) * 2 - 1) * w * .85 + Math.sin(t * 4 + i) * 4; g.fillStyle = `rgba(220,228,240,${big ? .07 : .06})`;
      g.beginPath(); g.arc(bx + x0, by + y, (big ? 26 : 14) * (.6 + h2(i, 3, 1)), 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
}

// —— the set ——
export function buildCourse(scene) {
  const K = {};
  const M = K.M = {
    turf: mat(turf(), [70, 70], { bump: .5 }), sand: mat(sand(), [6, 3], { bump: .4 }),
    wood: mat(wood({ planks: 3, cols: ['#4a3020', '#6a4429', '#86592f', '#9c6a3a'] }), [1, 1], { bump: .5 }),
    post: mat(wood({ planks: 1, seed: 7 }), [1, 2], { bump: .5 }),
    leaf: mat(foliage({ a: '#2c5224', b: '#7aa046' }), [2, 2]), leafB: mat(foliage({ a: '#3a5e2a', b: '#93ac52', seed: 4 }), [2, 2]),
    bark: new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: .9 }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: .5 }),
    red: new THREE.MeshStandardMaterial({ color: '#d8342a', roughness: .35 }),
    felt: mat(felt(), [1, 1], { bump: .6 }),
    grit: mat(grit(), [1, 1], { bump: .8 }),
    navy: new THREE.MeshStandardMaterial({ color: '#25325a', roughness: .55 }), orange: new THREE.MeshStandardMaterial({ color: '#f08a32', roughness: .55 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: .22, metalness: 1 }), black: new THREE.MeshStandardMaterial({ color: '#1e1e22', roughness: .4 }),
  };
  // ground: the tee box and the fairway are one rolling sheet (flat near the tee)
  const gg = new THREE.PlaneGeometry(400, 400, 160, 160); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i), d = Math.hypot(x, z); const k = clamp((d - 8) / 30); gp.setY(i, k * (Math.sin(x * .05) * 1.6 + Math.cos(z * .04 + 1) * 1.4 + (fbm(x * .01 + 50, z * .01 + 50, 3, 3) - .5) * 5) - (z < -60 ? 0 : 0)); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, M.turf); ground.receiveShadow = true; scene.add(ground);
  // the tee: a white wooden peg
  K.TEE = new THREE.Vector3(.05, 0, .32);
  const tee = new THREE.Group(); const peg = cyl(.0035, .0018, .03, M.white, 12); peg.position.y = .012; const cup = cyl(.0065, .0035, .006, M.white, 16); cup.position.y = .029; tee.add(peg, cup);
  tee.position.copy(K.TEE); scene.add(tee); K.tee = tee;
  K.BALL_ON_TEE = K.TEE.clone().add(new THREE.Vector3(0, .031 + .0214, 0));
  // tee markers: two red balls
  for (const x of [-1.25, 1.45]) { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 24, 16), M.red); m.position.set(x, .06, .55); m.castShadow = m.receiveShadow = true; scene.add(m); }
  // the club sign with the channel logo, behind the tee
  const sc = signCanvas(); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace; st.anisotropy = 8;
  const sign = new THREE.Group();
  const board = rbox(.66, .39, .035, .008, [M.wood, M.wood, M.wood, M.wood, new THREE.MeshStandardMaterial({ map: st, roughness: .6 }), M.wood]);
  board.position.y = .95; sign.add(board);
  for (const x of [-.26, .26]) { const p = rbox(.05, .8, .05, .008, M.post); p.position.set(x, .4, -.03); sign.add(p); }
  sign.position.set(-.55, 0, -2.4); sign.rotation.y = .18; scene.add(sign);
  // a golf bag with club heads
  const bag = new THREE.Group();
  const body = cyl(.12, .11, .82, M.navy, 28); body.position.y = .41; bag.add(body);
  for (const y of [.12, .7]) { const b = cyl(.124, .124, .05, M.orange, 28); b.position.y = y; bag.add(b); }
  const rim = cyl(.125, .125, .03, M.black, 28); rim.position.y = .82; bag.add(rim);
  [[-.04, .03, .2], [.05, -.02, -.15], [0, .06, .05], [.04, .05, .3]].forEach(([x, z, a], i) => {
    const s = cyl(.006, .006, .3, M.chrome, 8); s.position.set(x, .95, z); s.rotation.z = a * .3; bag.add(s);
    const h = i % 2 ? rbox(.09, .05, .045, .015, M.black) : rbox(.075, .03, .02, .006, M.chrome); h.position.set(x + .03, 1.1, z); h.rotation.z = a; bag.add(h);
  });
  bag.position.set(1.05, 0, -1.45); bag.rotation.z = -.12; scene.add(bag); K.bag = bag;
  // a bench, a ball washer
  const bench = new THREE.Group(); const seat = rbox(1.2, .05, .36, .01, M.post); seat.position.y = .45; bench.add(seat);
  for (const x of [-.5, .5]) { const l = rbox(.06, .45, .32, .01, M.black); l.position.set(x, .22, 0); bench.add(l); }
  bench.position.set(2.1, 0, -2.9); bench.rotation.y = -.3; scene.add(bench);
  const wash = new THREE.Group(); const wp = cyl(.03, .03, .95, M.black, 12); wp.position.y = .47; const wb = rbox(.16, .2, .12, .02, M.navy); wb.position.y = 1.0; wash.add(wp, wb);
  wash.position.set(-1.7, 0, -1.2); scene.add(wash);
  // bunker, flag, trees, hills
  const bk = new THREE.Mesh(new THREE.CircleGeometry(1, 48), M.sand); bk.rotation.x = -Math.PI / 2; bk.scale.set(5, 2.6, 1); bk.position.set(6.5, .03, -16); bk.receiveShadow = true; scene.add(bk);
  const flag = new THREE.Group(); const pole = cyl(.03, .03, 2.4, M.white, 8); pole.position.y = 1.2; flag.add(pole);
  const flg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(.9, 2.15, 0), new THREE.Vector3(0, 1.9, 0)]); flg.computeVertexNormals();
  const fl = new THREE.Mesh(flg, new THREE.MeshStandardMaterial({ color: '#e23a2e', side: THREE.DoubleSide })); flag.add(fl);
  flag.position.set(-3, 0, -70); scene.add(flag);
  const tree = (x, z, s, m) => {
    const g = new THREE.Group(); const tr = cyl(.25 * s, .35 * s, 3 * s, M.bark, 10); tr.position.y = 1.5 * s; g.add(tr);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.6 + h2(i, x | 0, 3)) * s, 1), m); b.position.set((h2(i, 1, x | 0) - .5) * 2.2 * s, (3.6 + h2(i, 2, x | 0) * 1.8) * s, (h2(i, 3, x | 0) - .5) * 2 * s); b.castShadow = true; b.receiveShadow = true; g.add(b); }
    g.position.set(x, 0, z); scene.add(g);
  };
  for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, z = -14 - i * 7 - h2(i, 9, 9) * 6, x = side * (16 + h2(i, 8, 9) * 14); tree(x, z, .9 + h2(i, 7, 9) * .6, i % 3 ? M.leaf : M.leafB); }
  for (let i = 0; i < 8; i++) tree(-30 + i * 9 + h2(i, 4, 4) * 4, -110 - h2(i, 5, 4) * 15, 1.4, M.leafB);
  for (const [x, z] of [[-5, -6], [-8, -9]]) tree(x - 6, z, .8, M.leaf);
  // —— the smoke board on an easel (off to the left of the tee: a demo Dot set up) ——
  const SB = K.SB = { pos: new THREE.Vector3(-3.4, 0, -1.6), w: 1.0, h: 1.4, y0: .55 };
  const R = .08, toPx = 1024 / SB.w;
  const yS = 1.595, yD = 1.114, xB = .3;
  K.smoke = new SmokeBoard({ w: SB.w, h: SB.h, balls: [
    { x: xB * toPx, y: (SB.y0 + SB.h - yS) * toPx, R: R * toPx * 1.0, sep: 82, kind: 'smooth', label: 'SMOOTH' },
    { x: xB * toPx, y: (SB.y0 + SB.h - yD) * toPx, R: R * toPx * 1.0, sep: 118, kind: 'dimpled', label: 'DIMPLED' }] });
  const easel = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ map: K.smoke.tex, roughness: .85, emissive: '#ffffff', emissiveMap: K.smoke.tex, emissiveIntensity: .32 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(SB.w, SB.h), bm); face.position.set(0, SB.y0 + SB.h / 2, .021); face.receiveShadow = true; easel.add(face);
  const back = rbox(SB.w + .06, SB.h + .06, .04, .01, M.wood); back.position.set(0, SB.y0 + SB.h / 2, 0); easel.add(back);
  for (const [x, a] of [[-.38, .08], [.38, -.08]]) { const l = rbox(.05, 2.2, .04, .01, M.post); l.position.set(x, 1.05, -.06); l.rotation.z = a; easel.add(l); }
  const bl = rbox(.05, 2.0, .04, .01, M.post); bl.position.set(0, 1.0, -.45); bl.rotation.x = -.25; easel.add(bl);
  const ledge = rbox(SB.w + .1, .04, .1, .01, M.post); ledge.position.set(0, SB.y0 - .03, .03); easel.add(ledge);
  K.demoSmooth = new GolfBall(R, { seg: 96, rings: 64 }); K.demoSmooth.sand(1);
  K.demoDimp = new GolfBall(R, { seg: 280, rings: 200 });
  for (const [b, y] of [[K.demoSmooth, yS], [K.demoDimp, yD]]) {
    b.mesh.position.set(-SB.w / 2 + xB, y, .12); easel.add(b.mesh);
    const rod = cyl(.006, .006, .1, M.chrome, 8); rod.rotation.x = Math.PI / 2; rod.position.set(-SB.w / 2 + xB, y, .07); easel.add(rod);
  }
  easel.position.copy(SB.pos); scene.add(easel); K.easel = easel;
  // —— props that move: the hero ball, the good ball, the tennis ball, the sanding block ——
  K.ball = new GolfBall(); scene.add(K.ball.mesh);
  K.ball2 = new GolfBall(.0214, { seg: 120, rings: 90 }); scene.add(K.ball2.mesh);
  K.tennis = new THREE.Mesh(new THREE.SphereGeometry(.0335, 64, 48), M.felt); K.tennis.castShadow = K.tennis.receiveShadow = true; scene.add(K.tennis);
  const blk = new THREE.Group(); const wb2 = rbox(.05, .02, .034, .005, M.post); wb2.position.y = .01 + .003; const pad = rbox(.05, .004, .034, .0015, M.grit); pad.position.y = .003; blk.add(wb2, pad);
  scene.add(blk); K.block = blk;
  return K;
}

// —— soft billboard particles (from the No Holes kitchen): dust, chalk ——
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

