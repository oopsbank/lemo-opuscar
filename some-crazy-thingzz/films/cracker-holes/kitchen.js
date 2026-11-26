// kitchen.js — the set for "No Holes": a warm home kitchen at full size. Mint wall tiles, cream cabinets, a butcher-block island,
// a butter-yellow enamel range with a hinged glass door and glowing elements, a window on the left wall that lets the sun in.
// Units: metres. Floor y = 0, back wall z = -3, left wall x = -2.4; the camera looks toward -z.
import * as THREE from 'three';
import { paint, mat, paintedMetal, wood, fbm, h2, vn2, rbox, cyl, box } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// —— surfaces ——
// glazed wall tiles (subway bond): colour variation per tile, glossy glaze, dark grout lines; u across, v down
function tiles(o = {}) {
  const W = 512, cols = o.cols ?? 4, rows = o.rows ?? 8, s = o.seed ?? 31, base = hex(o.col ?? '#9fd3bf'), grout = hex(o.grout ?? '#d9d2c2');
  return paint(W, W, (x, y) => {
    const u = x / W * cols, v = y / W * rows, r = Math.floor(v), off = (r % 2) * .5, c = Math.floor(u + off);
    const fu = u + off - c, fv = v - r, id = h2(c, r, s);
    const g = Math.min(fu, 1 - fu) * W / cols, gv = Math.min(fv, 1 - fv) * W / rows;
    if (g < 2.2 || gv < 2.2) return { c: grout.map(k => k * (.92 + h2(x, y, s) * .1)), r: .9, h: .2 };
    const edge = clamp(Math.min(g, gv) / 9);   // bevelled glaze edge
    let col = base.map(k => k * (.92 + id * .14 + (fbm(u * 3, v * 3, s + 2, 3) - .5) * .06));
    col = col.map(k => k * (.86 + edge * .14));
    return { c: col, r: .12 + (1 - edge) * .2 + fbm(u * 9, v * 9, s, 2) * .08, h: .45 + edge * .4 };
  });
}
// floor: checkerboard of cream and terracotta tiles, a little worn and dusty
function checker(o = {}) {
  const W = 512, n = 4, s = 41, A = hex('#ece0c8'), B = hex('#b8775c'), grout = hex('#8e7a66');
  return paint(W, W, (x, y) => {
    const u = x / W * n, v = y / W * n, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const g = Math.min(fu, 1 - fu, fv, 1 - fv) * W / n;
    if (g < 1.8) return { c: grout, r: .9, h: .15 };
    let c = ((i + j) % 2 ? B : A).map(k => k * (.93 + h2(i, j, s) * .1 + (fbm(u * 4, v * 4, s, 4, n * 4) - .5) * .12));
    const wear = fbm(u * 12, v * 12, s + 3, 3, n * 12); c = mix3(c, [205, 190, 165], clamp((wear - .62) * 1.5) * .35);
    return { c, r: .35 + wear * .3, h: .5 + clamp(g / 6) * .2 };
  });
}
// warm plaster above the tiles
function plaster(col = '#f2e3c7') {
  const W = 256, s = 51, c0 = hex(col);
  return paint(W, W, (x, y) => { const u = x / W, v = y / W, n = fbm(u * 6, v * 6, s, 5, 6); return { c: c0.map(k => k * (.93 + n * .12)), r: .92, h: n }; });
}
// cabinet doors: painted wood with a recessed panel line and worn edges (one door per texture)
function cabinetDoor(col = '#efe3c9') {
  const W = 256, s = 61, c0 = hex(col), woodC = hex('#a77a4b');
  return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, e = Math.min(u, 1 - u, v, 1 - v);
    let c = c0.map(k => k * (.95 + fbm(u * 5, v * 5, s, 3) * .08)), ht = .6, r = .45;
    if (Math.abs(e - .12) < .012) { c = c.map(k => k * .72); ht = .3; }              // the panel groove
    else if (e > .12) { c = c.map(k => k * .97); ht = .5; }
    if (e < .02) { c = c.map(k => k * .8); ht = .35; }                               // the gap between doors
    const worn = fbm(u * 30, v * 30, s + 4, 3) + (e < .06 ? .2 : 0);
    if (worn > .78) { c = woodC; r = .7; }
    c = mix3(c, [150, 130, 105], Math.pow(clamp((v - .8) / .2), 2) * .25);           // scuffs toward the floor
    return { c, r, h: ht };
  });
}
// the oven's speckled dark enamel interior
function graniteware() {
  const W = 256, s = 71; return paint(W, W, (x, y) => { const sp = h2(x, y, s) > .985 || (fbm(x / 6, y / 6, s, 2) > .78 && h2(x, y, s + 1) > .6); const n = fbm(x / 40, y / 40, s, 3); return { c: sp ? [200, 205, 215] : [28 + n * 12, 32 + n * 12, 46 + n * 14], r: .35, h: sp ? .7 : .5 }; });
}
// dough: pale, floury, with a few bubbles of darker baked colour as it browns; holes are drawn on top (setHoles)
export function doughCanvas(seed = 81) {
  const W = 256; return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, n = fbm(u * 8, v * 8, seed, 4), f = h2(x, y, seed);
    const flour = fbm(u * 20, v * 20, seed + 5, 3);
    let c = mix3(hex('#ead6ad'), hex('#f6ead2'), n); c = mix3(c, [250, 246, 238], clamp((flour - .6) * 2) * .7);
    return { c: c.map(k => k * (.97 + f * .05)), r: .85, h: .5 + n * .3 };
  });
}

// —— a sheet of dough that can puff into a pillow ——
// top surface only (seen from above and the front); footprint w × d; puff(h, bubbles, spread, wob) reshapes it every frame.
export class Dough {
  constructor(w, d, o = {}) {
    this.w = w; this.d = d; this.nx = 44; this.nz = 32;
    this.geo = new THREE.PlaneGeometry(1, 1, this.nx, this.nz); this.geo.rotateX(-Math.PI / 2);
    this.base = this.geo.attributes.position.array.slice();
    this.P = doughCanvas(o.seed ?? 81);
    this.cv = document.createElement('canvas'); this.cv.width = this.cv.height = 512; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: .82, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.holes = []; this.n = -1; this.bake = -1;
    this.bub = Array.from({ length: 9 }, (_, i) => ({ x: (h2(i, 3, 5) - .5) * 1.4, z: (h2(i, 4, 5) - .5) * 1.3, r: .14 + h2(i, 5, 5) * .14, t: h2(i, 6, 5) }));
    this.paintTex(0, 0);
  }
  // redraw the texture: browning 0–1, the first n holes (u, v in 0–1)
  paintTex(bake, n) {
    if (bake === this.bake && n === this.n) return; this.bake = bake; this.n = n;
    const g = this.g, S = 512; g.drawImage(this.P.C, 0, 0, S, S);
    if (bake > 0) {   // golden toward the edges and on the bubbles, darker spots
      g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(246,196,110,${.7 * bake})`; g.fillRect(0, 0, S, S);
      const gr = g.createRadialGradient(S / 2, S / 2, S * .2, S / 2, S / 2, S * .75); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(200,130,55,${.35 * bake})`);
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(190,120,50,${.16 * bake})`; g.beginPath(); g.ellipse(h2(i, 1, 9) * S, h2(i, 2, 9) * S, 10 + h2(i, 3, 9) * 22, 8 + h2(i, 4, 9) * 14, h2(i, 5, 9) * 3, 0, 7); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }
    for (const [u, v] of this.holes.slice(0, n)) {   // a docking hole: dark pit, a pale rim, browned when baked
      const x = u * S, y = v * S;
      g.fillStyle = bake > .5 ? 'rgba(150,90,35,.9)' : 'rgba(205,180,140,.9)'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
      g.fillStyle = bake > .5 ? '#3a200c' : '#6e5638'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,250,235,.55)'; g.beginPath(); g.arc(x - 2, y - 3, 3, 0, 7); g.fill();
    }
    this.tex.needsUpdate = true;
  }
  // h: pillow height (m) · bub: 0–1 bubbles rising · spread: footprint growth · wob: jiggle · wr: wrinkles (deflated)
  shape(h = 0, bub = 0, spread = 0, wob = 0, wr = 0, t = 0) {
    const a = this.geo.attributes.position.array, B = this.base, sx = this.w * (1 + spread), sz = this.d * (1 + spread * .8);
    for (let i = 0; i < a.length; i += 3) {
      const u = B[i] * 2, v = B[i + 2] * 2;   // −1..1
      const r = Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), .25);
      const dome = clamp(1 - Math.pow(r, 3.2));
      let y = .004 * clamp((1 - r) * 8) + h * Math.pow(dome, .42) * (1 + wob * Math.sin(t * 31 + u * 2) * .06);
      for (const b of this.bub) { const k = clamp(bub * 1.6 - b.t * .9); if (k <= 0) continue; const d2 = ((u - b.x) ** 2 + (v - b.z) ** 2) / (b.r * b.r); y += k * .018 * Math.exp(-d2 * 2) * dome; }
      if (wr > 0) y += wr * .01 * (vn2(u * 4 + 7, v * 4, 3) - .5) * clamp((1 - r) * 4);
      a[i] = B[i] * sx * (1 + h * .3 * (1 - Math.abs(v))); a[i + 1] = y; a[i + 2] = B[i + 2] * sz * (1 + h * .2 * (1 - Math.abs(u)));
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals();
  }
}

// —— soft billboards for steam and flour (deterministic: every particle is a function of film time) ——
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

// —— the kitchen ——
export function buildKitchen(scene) {
  const K = {};
  const M = K.M = {
    floor: mat(checker(), [7, 7], { bump: .6 }),
    tileB: mat(tiles(), [8, 3.6], { bump: .4 }), tileL: mat(tiles({ seed: 33 }), [8, 3.6], { bump: .4 }),
    plaster: mat(plaster(), [3, 2], { bump: .3 }),
    block: mat(wood({ planks: 8, cols: ['#5e3b22', '#74482a', '#8a5a34', '#9c6a3f'], seed: 12 }), [1, 1], { bump: .3 }),
    shelf: mat(wood({ planks: 1, cols: ['#7a5233', '#94683f', '#a97a4b', '#b98a58'], seed: 14 }), [3, 1], { bump: .3 }),
    cab: mat(cabinetDoor(), [1, 1], { bump: .5 }),
    cabSide: mat(paint(64, 64, (x, y) => ({ c: hex('#e9dcc0').map(k => k * (.95 + vn2(x / 9, y / 9, 3) * .08)), r: .5 })), [1, 1]),
    oven: mat(paintedMetal('#efc24f', { seed: 4, grime: .35, chips: .05, dust: '#8a6a42' }), [1, 1], { bump: .25, extra: { roughness: .7 } }),
    chrome: new THREE.MeshStandardMaterial({ color: '#dfe3e8', metalness: 1, roughness: .2 }),
    steel: new THREE.MeshStandardMaterial({ color: '#b7bcc3', metalness: .75, roughness: .38 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#3a3d44', metalness: .6, roughness: .5 }),
    enamel: mat(graniteware(), [2, 2], { bump: .2 }),
    frame: new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: .55 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c99a45', metalness: .9, roughness: .3 }),
    glow: new THREE.MeshBasicMaterial({ color: '#ff6a1e' }),
  };
  M.oven.roughness = .7;
  // floor and walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -.5); floor.receiveShadow = true; scene.add(floor);
  const wallB = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.45), M.tileB); wallB.position.set(0, .725, -3); wallB.receiveShadow = true; scene.add(wallB);
  const wallB2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), M.plaster); wallB2.position.set(0, 2.15, -3); wallB2.receiveShadow = true; scene.add(wallB2);
  const trimB = box(5, .04, .03, M.frame); trimB.position.set(0, 1.46, -2.985); scene.add(trimB);
  // left wall with a window (thick, so it casts the window's shadow); WIN in z, y
  const WIN = K.WIN = { z0: -2.0, z1: -.55, y0: .95, y1: 2.3 }, XL = -2.4;
  const wallPiece = (z0, z1, y0, y1) => { const b = box(.14, y1 - y0, z1 - z0, M.plaster); b.position.set(XL - .07, (y0 + y1) / 2, (z0 + z1) / 2); scene.add(b); return b; };
  wallPiece(-3.1, WIN.z0, 0, 3.6); wallPiece(WIN.z1, 7, 0, 3.6); wallPiece(WIN.z0, WIN.z1, 0, WIN.y0); wallPiece(WIN.z0, WIN.z1, WIN.y1, 3.6);
  const wallR = box(.14, 3.6, 5.6, M.plaster); wallR.position.set(2.47, 1.8, -.3); scene.add(wallR);
  const ceil = box(5.2, .1, 10, M.plaster); ceil.position.set(0, 2.85, 1.9); ceil.castShadow = true; scene.add(ceil);
  // window frame, cross bar, sill; curtains; the garden outside
  const fz = (WIN.z0 + WIN.z1) / 2, fy = (WIN.y0 + WIN.y1) / 2, fw = WIN.z1 - WIN.z0, fh = WIN.y1 - WIN.y0;
  for (const [y, h] of [[WIN.y0 + .025, .05], [WIN.y1 - .025, .05], [fy, .035]]) { const b = box(.08, h, fw, M.frame); b.position.set(XL + .01, y, fz); scene.add(b); }
  for (const [z, w] of [[WIN.z0 + .025, .05], [WIN.z1 - .025, .05], [fz, .035]]) { const b = box(.08, fh, w, M.frame); b.position.set(XL + .01, fy, z); scene.add(b); }
  const sill = rbox(.24, .04, fw + .16, .01, M.frame); sill.position.set(XL + .1, WIN.y0 - .02, fz); scene.add(sill);
  const gingham = mat(paint(128, 128, (x, y) => { const a = (Math.floor(x / 16) % 2) + (Math.floor(y / 16) % 2); return { c: [[248, 240, 228], [233, 150, 140], [214, 84, 74]][a], r: .95 }; }), [3, 3]);
  for (const s of [-1, 1]) {
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(.34, 1.25, 12, 1), gingham); cur.castShadow = cur.receiveShadow = true;
    const p = cur.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * .025); cur.geometry.computeVertexNormals();
    cur.rotation.y = Math.PI / 2; cur.position.set(XL + .07, WIN.y1 - .55, s < 0 ? WIN.z0 - .08 : WIN.z1 + .08); scene.add(cur);
  }
  const rod = cyl(.012, .012, fw + .7, M.brass); rod.rotation.x = Math.PI / 2; rod.position.set(XL + .08, WIN.y1 + .06, fz); scene.add(rod);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: '#cfe3f1', fog: false })); outside.rotation.y = Math.PI / 2; outside.position.set(-9, 2, -1); scene.add(outside);
  const leaf = mat(paint(128, 128, (x, y) => { const n = fbm(x / 10, y / 10, 8, 4); return { c: mix3([60, 104, 52], [150, 186, 90], clamp(n * 1.6 - .3)), r: .9 }; }), [2, 2]);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.9 + h2(i, 1, 2) * .7, 20, 14), leaf); b.position.set(-4.6 - h2(i, 2, 2) * 2, .4 + h2(i, 3, 2) * 1.4, -3.2 + i * .8); scene.add(b); }
  const plant = cyl(.07, .055, .12, mat(paintedMetal('#c4633f', { seed: 9 }))); plant.position.set(XL + .12, WIN.y0 + .06, fz - .4); scene.add(plant);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), leaf); l.scale.set(1, 1.6, .6); l.position.set(XL + .12 + (h2(i, 1, 4) - .5) * .1, WIN.y0 + .17 + h2(i, 2, 4) * .1, fz - .4 + (h2(i, 3, 4) - .5) * .12); l.rotation.z = (h2(i, 4, 4) - .5); l.castShadow = true; scene.add(l); }

  // —— cabinets and counters ——
  const run = (x0, x1, z, d, h = .9) => {   // a cabinet run with doors, a toe kick and a butcher-block top
    const w = x1 - x0, cx = (x0 + x1) / 2, nd = Math.max(1, Math.round(w / .5));
    const body = box(w, h - .1, d - .04, M.cabSide); body.position.set(cx, (h - .1) / 2 + .02, z); scene.add(body);
    const kick = box(w, .1, d - .1, M.darkSteel); kick.position.set(cx, .05, z - .03); scene.add(kick);
    for (let i = 0; i < nd; i++) {
      const dw = w / nd, dx = x0 + dw * (i + .5);
      const door = rbox(dw - .012, h - .2, .025, .006, M.cab); door.position.set(dx, .1 + (h - .2) / 2, z + (d - .04) / 2 + .012); scene.add(door);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.016, 12, 8), M.brass); knob.position.set(dx + (i % 2 ? -1 : 1) * (dw / 2 - .07), h - .2, z + (d - .04) / 2 + .035); knob.castShadow = true; scene.add(knob);
    }
    const top = rbox(w + .03, .045, d + .03, .008, M.block); top.position.set(cx, h - .02, z); scene.add(top);
    return top;
  };
  run(-2.4, .54, -2.69, .62); run(1.36, 2.4, -2.69, .62);
  const ISL = K.ISL = { x: -.45, z: -1.0, w: 1.35, d: .72, h: .9 };
  run(ISL.x - ISL.w / 2, ISL.x + ISL.w / 2, ISL.z, ISL.d);
  // the island's back has doors too (the camera sees it from behind in some shots)
  const stool = rbox(.42, .26, .3, .02, M.shelf); stool.position.set(ISL.x, .13, ISL.z - .62); scene.add(stool); K.stool = stool;
  // shelves with jars on the back wall
  const jarCols = ['#f0d48a', '#8b5a3c', '#f6f1e6', '#d9773f', '#e9d9b5', '#6a8f4e'];
  for (const [y, x0, x1] of [[1.62, -2.2, -.2], [2.02, -2.2, -.2]]) {
    const sh = rbox(x1 - x0, .035, .22, .006, M.shelf); sh.position.set((x0 + x1) / 2, y, -2.88); scene.add(sh);
    for (let i = 0, x = x0 + .12; x < x1 - .1; i++) {
      const r = .045 + h2(i, y * 10, 3) * .03, hh = .1 + h2(i, y * 10 + 1, 3) * .12;
      if (h2(i, y * 10 + 2, 3) > .2) {
        const jar = cyl(r, r, hh, new THREE.MeshStandardMaterial({ color: jarCols[Math.floor(h2(i, y * 10 + 3, 3) * jarCols.length)], roughness: .5 }), 18); jar.position.set(x + r, y + .018 + hh / 2, -2.86); scene.add(jar);
        const lid = cyl(r * 1.02, r * 1.02, .025, h2(i, 9, 3) > .5 ? M.brass : M.frame, 18); lid.position.set(x + r, y + .018 + hh + .012, -2.86); scene.add(lid);
      }
      x += r * 2 + .05 + h2(i, y * 10 + 4, 3) * .08;
    }
  }
  // things on the back counter: a mixing bowl, a rolling pin
  const bowlPts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; bowlPts.push(new THREE.Vector2(.02 + Math.sin(a) * .15, .14 - Math.cos(a) * .14)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 32), new THREE.MeshStandardMaterial({ color: '#e9b938', roughness: .35, side: THREE.DoubleSide })); bowl.position.set(-1.3, .92, -2.7); bowl.castShadow = bowl.receiveShadow = true; scene.add(bowl);
  const pin = cyl(.03, .03, .32, M.shelf); pin.rotation.z = Math.PI / 2; pin.position.set(ISL.x - .28, .935, ISL.z + .22); scene.add(pin);
  for (const s of [-1, 1]) { const hd = cyl(.012, .012, .09, M.shelf); hd.rotation.z = Math.PI / 2; hd.position.set(ISL.x - .28 + s * .2, .935, ISL.z + .22); scene.add(hd); }
  // a flour bag on the island
  const bagC = document.createElement('canvas'); bagC.width = 256; bagC.height = 384; { const g = bagC.getContext('2d'); g.fillStyle = '#efe3cb'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#c44a3a'; g.fillRect(0, 120, 256, 120); g.fillStyle = '#fff8ea'; g.font = '800 64px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FLOUR', 128, 182); g.strokeStyle = 'rgba(120,90,60,.35)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 30 + i * 9); g.lineTo(256, 34 + i * 8); g.stroke(); } }
  const bagT = new THREE.CanvasTexture(bagC); bagT.colorSpace = THREE.SRGBColorSpace;
  const bag = rbox(.17, .25, .1, .015, new THREE.MeshStandardMaterial({ map: bagT, roughness: .95 })); bag.position.set(ISL.x - .52, .9 + .125, ISL.z - .12); bag.rotation.y = .3; scene.add(bag);
  // flour dusting on the island top
  const dustC = document.createElement('canvas'); dustC.width = dustC.height = 256; { const g = dustC.getContext('2d'), d = g.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const r = Math.hypot(x - 128, y - 128) / 128, n = fbm(x / 18, y / 18, 3, 4), i = (y * 256 + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = 250; d.data[i + 3] = clamp((n - .45) * 2.2 * (1 - r)) * 200; } g.putImageData(d, 0, 0); }
  const dustT = new THREE.CanvasTexture(dustC);
  const dust = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshStandardMaterial({ map: dustT, transparent: true, depthWrite: false, roughness: 1 })); dust.rotation.x = -Math.PI / 2; dust.position.set(ISL.x - .05, .9 + .004, ISL.z); dust.receiveShadow = true; scene.add(dust);

  // —— the range: butter-yellow enamel, chrome trim, a glass door hinged at the bottom ——
  const O = K.OV = { x: .95, z: -2.68, w: .78, d: .64 }; const fzO = O.z + O.d / 2;   // front face z
  const g = new THREE.Group(); scene.add(g); K.oven = g;
  const part = (w, h, d, x, y, z, m = M.oven, r = .012) => { const b = rbox(w, h, d, r, m); b.position.set(O.x + x, y, O.z + z); g.add(b); return b; };
  part(.04, .9, O.d, -O.w / 2 + .02, .45, 0); part(.04, .9, O.d, O.w / 2 - .02, .45, 0);               // sides
  part(O.w, .045, O.d, 0, .9, 0);                                                                     // cook top
  part(O.w, .15, .04, 0, .79, O.d / 2 - .02);                                                         // control strip
  part(O.w, .14, O.d, 0, .07, 0);                                                                     // drawer
  part(O.w, .9, .03, 0, .45, -O.d / 2 + .015);                                                        // back
  part(O.w, .3, .05, 0, 1.08, -O.d / 2 + .03);                                                        // back guard
  const strip = box(O.w - .02, .02, .012, M.chrome); strip.position.set(O.x, .72, fzO + .002); g.add(strip);
  const dhandle = cyl(.01, .01, .34, M.chrome); dhandle.rotation.z = Math.PI / 2; dhandle.position.set(O.x, .07, fzO + .03); g.add(dhandle);
  // burners
  for (const [dx, dz] of [[-.2, -.13], [.2, -.13], [-.2, .13], [.2, .13]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 8, 28), M.darkSteel); r.rotation.x = Math.PI / 2; r.position.set(O.x + dx, .93, O.z + dz); r.castShadow = true; g.add(r); const c = cyl(.03, .03, .012, M.darkSteel); c.position.set(O.x + dx, .93, O.z + dz); g.add(c); }
  // dials on the control strip; K.dial turns
  K.dials = [];
  for (let i = 0; i < 4; i++) { const d = new THREE.Group(); const k = cyl(.028, .032, .03, M.frame); k.rotation.x = Math.PI / 2; d.add(k); const n = box(.008, .03, .008, M.darkSteel); n.position.set(0, .016, .016); d.add(n); d.position.set(O.x - .27 + i * .18, .79, fzO + .015); g.add(d); K.dials.push(d); }
  // a clock in the back guard
  const clkC = document.createElement('canvas'); clkC.width = clkC.height = 128; { const q = clkC.getContext('2d'); q.fillStyle = '#fbf6ea'; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.strokeStyle = '#333'; q.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; q.beginPath(); q.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); q.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58); q.stroke(); } q.lineWidth = 5; q.beginPath(); q.moveTo(64, 64); q.lineTo(64, 26); q.stroke(); q.beginPath(); q.moveTo(64, 64); q.lineTo(92, 74); q.stroke(); }
  const clkT = new THREE.CanvasTexture(clkC); clkT.colorSpace = THREE.SRGBColorSpace;
  const clk = new THREE.Mesh(new THREE.CircleGeometry(.07, 32), new THREE.MeshStandardMaterial({ map: clkT, roughness: .4 })); clk.position.set(O.x, 1.1, O.z - O.d / 2 + .058); g.add(clk);
  const clkR = new THREE.Mesh(new THREE.TorusGeometry(.072, .008, 8, 32), M.chrome); clkR.position.copy(clk.position); g.add(clkR);
  // the cavity: speckled enamel box seen through the door; the rack, two glowing elements, a light
  const CAV = K.CAV = { w: O.w - .1, h: .52, d: O.d - .08, y0: .16, z: O.z + .01 };
  const cav = new THREE.Mesh(new THREE.BoxGeometry(CAV.w, CAV.h, CAV.d), M.enamel); cav.material = M.enamel.clone(); cav.material.side = THREE.BackSide; cav.material.emissive = new THREE.Color('#000000'); K.cavMat = cav.material;
  cav.position.set(O.x, CAV.y0 + CAV.h / 2, CAV.z); cav.receiveShadow = true; g.add(cav);
  const coil = y => { const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(O.x + (i % 2 ? .26 : -.26), y, CAV.z - CAV.d / 2 + .05 + i * (CAV.d - .1) / 8)); const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2), 80, .006, 6), M.glow.clone()); g.add(c); return c; };
  K.coils = [coil(CAV.y0 + .03), coil(CAV.y0 + CAV.h - .03)];
  const RACK_Y = K.RACK_Y = .4;
  for (let i = 0; i < 9; i++) { const r = cyl(.003, .003, CAV.d - .02, M.chrome, 6); r.rotation.x = Math.PI / 2; r.position.set(O.x - CAV.w / 2 + .04 + i * (CAV.w - .08) / 8, RACK_Y, CAV.z); g.add(r); }
  K.ovenLight = new THREE.PointLight('#ff8a3a', 0, 1.0, 2); K.ovenLight.position.set(O.x, .64, CAV.z - .15); g.add(K.ovenLight);
  // the door: a group whose pivot is the bottom front edge; rotation.x > 0 drops it open toward the camera
  const door = new THREE.Group(); door.position.set(O.x, CAV.y0, fzO + .005); g.add(door); K.door = door;
  const DW = O.w - .02, DH = .55, WW = .44, WH = .25, WY = .3;   // door size, window size, window centre height
  const dpart = (w, h, x, y) => { const b = rbox(w, h, .045, .01, M.oven); b.position.set(x, y, .022); door.add(b); };
  dpart(DW, WY - WH / 2, 0, (WY - WH / 2) / 2); dpart(DW, DH - WY - WH / 2, 0, WY + WH / 2 + (DH - WY - WH / 2) / 2);
  dpart((DW - WW) / 2, WH, -(WW + (DW - WW) / 2) / 2, WY); dpart((DW - WW) / 2, WH, (WW + (DW - WW) / 2) / 2, WY);
  const wf = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 6, 4), M.chrome);   // a chrome bezel round the window
  wf.scale.set(WW * .72, WH * .72, 1); wf.rotation.z = Math.PI / 4; wf.position.set(0, WY, .047); door.add(wf);
  const glassC = document.createElement('canvas'); glassC.width = 256; glassC.height = 128; { const q = glassC.getContext('2d'); const gr = q.createLinearGradient(0, 0, 256, 128); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(.3, 'rgba(255,255,255,.0)'); gr.addColorStop(.36, 'rgba(255,255,255,.35)'); gr.addColorStop(.42, 'rgba(255,255,255,.0)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(.53, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 256, 128); }
  const glassT = new THREE.CanvasTexture(glassC); glassT.colorSpace = THREE.SRGBColorSpace;
  K.glass = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: glassT, color: '#fff3e0', transparent: true, opacity: .9, depthWrite: false })); K.glass.position.set(0, WY, .03); K.glass.renderOrder = 4; door.add(K.glass);
  const tint = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ color: '#2a1a10', transparent: true, opacity: .32, depthWrite: false })); tint.position.set(0, WY, .029); tint.renderOrder = 3; door.add(tint); K.tint = tint;
  const handle = cyl(.011, .011, .5, M.chrome); handle.rotation.z = Math.PI / 2; handle.position.set(0, DH - .05, .1); door.add(handle);
  for (const s of [-1, 1]) { const post = cyl(.008, .008, .06, M.chrome); post.rotation.x = Math.PI / 2; post.position.set(s * .22, DH - .05, .07); door.add(post); }
  g.traverse(o => { if (o.isMesh && o !== K.glass && o !== tint && !K.coils.includes(o)) { o.castShadow = true; o.receiveShadow = true; } });
  K.glass.castShadow = tint.castShadow = false; cav.castShadow = false;

  // —— trays and the two doughs ——
  const tray = () => { const t = new THREE.Group(); const b = rbox(.46, .012, .34, .004, M.steel); b.position.y = .006; t.add(b);
    for (const [w, d, x, z] of [[.46, .012, 0, .17], [.46, .012, 0, -.17], [.012, .34, .23, 0], [.012, .34, -.23, 0]]) { const r = rbox(w, .02, d, .004, M.steel); r.position.set(x, .016, z); t.add(r); }
    scene.add(t); return t; };
  K.trayA = tray(); K.trayB = tray();
  K.doughA = new Dough(.36, .26, { seed: 81 }); K.trayA.add(K.doughA.mesh); K.doughA.mesh.position.y = .013;
  K.doughB = new Dough(.27, .2, { seed: 83 }); K.trayB.add(K.doughB.mesh); K.doughB.mesh.position.y = .013;
  // the smiley the kid pokes: eyes, then the mouth from left to right (u, v on the dough texture)
  K.doughB.holes = [[.36, .36], [.64, .36], [.24, .58], [.31, .68], [.4, .74], [.5, .76], [.6, .74], [.69, .68], [.76, .58]];

  // —— light shafts from the window (additive, very faint) ——
  K.beamMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: .045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  K.beam = new THREE.Mesh(new THREE.BufferGeometry(), K.beamMat); K.beam.renderOrder = 5; scene.add(K.beam);
  K.setBeam = dir => {   // dir points toward the sun; the shaft runs from the window opening into the room
    const c = [[WIN.z0, WIN.y0], [WIN.z1, WIN.y0], [WIN.z1, WIN.y1], [WIN.z0, WIN.y1]].map(([z, y]) => new THREE.Vector3(XL, y, z));
    const far = c.map(p => { const s = p.y / dir.y; return p.clone().addScaledVector(dir, -Math.min(s, 3.2)); });
    const v = [...c, ...far], idx = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
    const pos = new Float32Array(idx.length * 3); idx.forEach((k, i) => { pos[i * 3] = v[k].x; pos[i * 3 + 1] = v[k].y; pos[i * 3 + 2] = v[k].z; });
    K.beam.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); K.beam.geometry.computeBoundingSphere();
  };
  return K;
}
