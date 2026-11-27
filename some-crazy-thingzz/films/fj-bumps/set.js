// set.js — the full-size 3D set: canvas-painted materials (painted metal with chips and grime, wood, gravel, dirt, grass), a rounded-box kit, sky, sun and fill.
// Stylised but believable: soft bevels, real scale, wear toward the ground. Never toy plastic (no studs, no uniform gloss).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp } from '/core/lib.js';

// —— noise ——
export function h2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function vn2(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// tileable value noise (period p cells)
function vt(x, y, p, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = q => ((q % p) + p) % p;
  const a = h2(m(xi), m(yi), s), b = h2(m(xi + 1), m(yi), s), c = h2(m(xi), m(yi + 1), s), d = h2(m(xi + 1), m(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s = 0, o = 4, p = 0) { let a = 0, f = 1, w = .5, t = 0; for (let i = 0; i < o; i++) { a += (p ? vt(x * f, y * f, p * f, s + i * 17) : vn2(x * f, y * f, s + i * 17)) * w; t += w; f *= 2; w *= .5; } return a / t; }
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Build colour / roughness / bump canvases from one per-pixel function f(x, y) → { c:[r,g,b], r: 0–1, h: 0–1 }
export function paint(w, h, f) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const C = mk(), R = mk(), B = mk();
  const dc = C.getContext('2d').createImageData(w, h), dr = R.getContext('2d').createImageData(w, h), db = B.getContext('2d').createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = f(x, y), i = (y * w + x) * 4;
    dc.data[i] = o.c[0]; dc.data[i + 1] = o.c[1]; dc.data[i + 2] = o.c[2]; dc.data[i + 3] = 255;
    const r = Math.round(clamp(o.r ?? .6) * 255); dr.data[i] = dr.data[i + 1] = dr.data[i + 2] = r; dr.data[i + 3] = 255;
    const b = Math.round(clamp(o.h ?? .5) * 255); db.data[i] = db.data[i + 1] = db.data[i + 2] = b; db.data[i + 3] = 255;
  }
  C.getContext('2d').putImageData(dc, 0, 0); R.getContext('2d').putImageData(dr, 0, 0); B.getContext('2d').putImageData(db, 0, 0);
  return { C, R, B };
}
function texs(P, rep = [1, 1]) {
  const t = c => { const x = new THREE.CanvasTexture(c); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rep[0], rep[1]); x.anisotropy = 8; return x; };
  const map = t(P.C); map.colorSpace = THREE.SRGBColorSpace;
  return { map, roughnessMap: t(P.R), bumpMap: t(P.B) };
}
// a material whose textures repeat `rep` times (shares the canvases)
export function mat(P, rep = [1, 1], o = {}) {
  const T = texs(P, rep);
  return new THREE.MeshStandardMaterial({ ...T, roughness: 1, metalness: o.metal ?? 0, bumpScale: o.bump ?? 1, ...o.extra });
}

// —— surfaces ——
// Painted metal: flat paint with a slight mottling, sparse chips showing dark primer / rust, grime and dust rising from the bottom edge (v = 1 is the bottom).
export function paintedMetal(col, o = {}) {
  const W = o.w ?? 512, H = o.h ?? 512, s = o.seed ?? 1, base = hex(col), rust = hex('#6b3a22'), primer = hex('#3a3330'), dust = hex(o.dust ?? '#9b8668');
  return paint(W, H, (x, y) => {
    const u = x / W, v = y / H;
    const m = fbm(u * 6, v * 6, s, 4, 6), fine = h2(x, y, s) - .5;
    let c = base.map(k => k * (.9 + m * .2 + fine * .03));
    let r = .38 + m * .18, ht = .5 + fine * .02;
    const chip = fbm(u * 22, v * 22, s + 5, 3, 22);
    const edge = Math.max(0, 1 - Math.min(u, 1 - u, v, 1 - v) * 14);   // chips gather near the edges
    const ch = o.chips ?? .1;
    if (chip > .84 - ch - edge * .16) { c = mix3(primer, rust, fbm(u * 40, v * 40, s + 9, 2, 40)); r = .85; ht = .38; }
    else if (chip > .81 - ch - edge * .16) { c = c.map(k => k * .72); ht = .45; }
    const gr = Math.pow(clamp((v - (o.grime0 ?? .55)) / .45), 1.6) * (.55 + fbm(u * 9, v * 3, s + 3, 3, 9) * .6);
    c = mix3(c, dust, clamp(gr * (o.grime ?? .6)));
    r = lerp(r, .9, gr * .6);
    return { c, r, h: ht };
  });
}
// Wood: planks along u, grain streaks, joints; paint optional (a painted plank shows wood through the wear)
export function wood(o = {}) {
  const W = o.w ?? 512, H = o.h ?? 512, s = o.seed ?? 2, n = o.planks ?? 4, ramp = (o.cols ?? ['#5a3b24', '#7a5233', '#94683f', '#a97a4b']).map(hex);
  const paintC = o.paint ? hex(o.paint) : null;
  return paint(W, H, (x, y) => {
    const u = x / W, v = y / H, pl = Math.floor(v * n), pv = v * n - pl;
    const id = h2(pl, 0, s);
    const grain = fbm(u * 3 + id * 9, pv * 40 + pl * 7, s, 4) * .7 + Math.sin((u * 24 + fbm(u * 2, pv * 4 + pl, s + 4, 3) * 6) * Math.PI) * .15;
    const t = clamp(.25 + grain * .75 + (id - .5) * .3);
    const i = Math.min(ramp.length - 2, Math.floor(t * (ramp.length - 1))); let c = mix3(ramp[i], ramp[i + 1], t * (ramp.length - 1) - i);
    let r = .75, ht = .5 + grain * .2;
    if (paintC) {
      const worn = fbm(u * 10, v * 30, s + 7, 4) + (1 - Math.min(pv, 1 - pv) * 6) * .12 + (o.wear ?? 0);
      if (worn < .62) { c = paintC.map((k, j) => k * (.88 + fbm(u * 5, v * 5, s + 2, 3) * .2)); r = .6; ht = .56; }
    }
    if (pv < .025 || pv > .975) { c = c.map(k => k * .35); ht = .2; }
    const gr = Math.pow(clamp((v - .7) / .3), 2) * .4; c = mix3(c, [96, 82, 66], gr);
    return { c, r, h: ht };
  });
}
// Gravel: two layers of Worley stones (big, then small ones filling the gaps), each stone shaded as a little dome lit from the upper left (tileable)
function worley(fx, fy, cells, s) {
  const cx = Math.floor(fx), cy = Math.floor(fy); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const X = cx + i, Y = cy + j, mx = ((X % cells) + cells) % cells, my = ((Y % cells) + cells) % cells;
    const px = X + .1 + h2(mx, my, s) * .8, py = Y + .1 + h2(mx, my, s + 1) * .8, el = .7 + h2(mx, my, s + 2) * .7, rot = h2(mx, my, s + 4) * 3;
    const ddx = fx - px, ddy = fy - py, ax = ddx * Math.cos(rot) - ddy * Math.sin(rot), ay = ddx * Math.sin(rot) + ddy * Math.cos(rot);
    const d = Math.max(Math.abs(ax) * el + Math.abs(ay) * .35, Math.abs(ay) / el + Math.abs(ax) * .35) * .85 + Math.hypot(ax * el, ay / el) * .3;   // angular stones
    if (d < d1) { d2 = d1; d1 = d; id = h2(mx, my, s + 3); ox = ddx; oy = ddy; } else if (d < d2) d2 = d;
  }
  return { d1, d2, id, ox, oy };
}
export function gravel(o = {}) {
  const W = o.w ?? 512, s = o.seed ?? 3, cells = o.cells ?? 16;
  const stones = (o.cols ?? ['#a39a8c', '#b2a690', '#8a8174', '#c2b59c', '#958676', '#ab9e88', '#7e766c'].map(hex)), gap = hex(o.gap ?? '#4e4338');
  const stone = (fx, fy, c, sd) => {
    const w = worley(fx, fy, c, sd), e = w.d2 - w.d1, inside = clamp((e - .04) * 9);
    const lit = clamp(.85 + (-w.ox * .7 - w.oy * .9) * .9 - w.d1 * .4, .45, 1.25);
    return { inside, lit, col: stones[Math.floor(w.id * stones.length)], dome: clamp(1 - w.d1 * 1.8) };
  };
  return paint(W, W, (x, y) => {
    const fx = x / W * cells, fy = y / W * cells;
    const A = stone(fx, fy, cells, s), B = stone(fx * 2.6, fy * 2.6, Math.round(cells * 2.6), s + 11);
    let c = mix3(gap.map(k => k * (.8 + h2(x, y, s) * .4)), B.col.map(k => k * B.lit * .92), B.inside * .9);
    let ht = B.inside * (.2 + B.dome * .3);
    const big = A.inside * (h2(Math.floor(fx), Math.floor(fy), s + 7) > .25 ? 1 : 0);
    c = mix3(c, A.col.map(k => k * A.lit), big); ht = Math.max(ht, big * (.35 + A.dome * .65));
    return { c, r: .82 - A.dome * .2, h: ht };
  });
}
// Ragged strip edge as an alpha map: u across (opaque in the middle), tiles along v
export function raggedEdge(o = {}) {
  const W = 256, H = 1024, s = o.seed ?? 21;
  return paint(W, H, (x, y) => { const u = x / W, v = y / H, n = (fbm(u * 3, v * 24, s, 4, 24) - .5) * .22 + (h2(x, y, s) - .5) * .05; const e = Math.min(u, 1 - u) + n; const a = e > .12 ? 1 : 0; return { c: [a * 255, a * 255, a * 255] }; });
}
// Dirt road: packed earth with ruts, scattered pebbles; edges fade into dry grass (u across the road, tiles along v)
export function dirtRoad(o = {}) {
  const W = o.w ?? 1024, H = o.h ?? 1024, s = o.seed ?? 4;
  const earth = hex('#a7835a'), earthD = hex('#7d5e3f'), grassC = hex('#9c9250'), pebble = hex('#c8b89a');
  return paint(W, H, (x, y) => {
    const u = x / W, v = y / H;
    const n = fbm(u * 8, v * 8, s, 5, 8), fine = h2(x, y, s);
    let c = mix3(earthD, earth, clamp(n * 1.3 - .1)).map(k => k * (.94 + fine * .1));
    let ht = .5 + (n - .5) * .3;
    for (const rc of [.3, .7]) { const d = Math.abs(u - rc - (fbm(v * 4, 1, s + 8, 2, 4) - .5) * .03); if (d < .06) { const k = 1 - d / .06; c = c.map(q => q * (1 - k * .12)); ht -= k * .1; } }
    const pb = fbm(u * 140, v * 140, s + 2, 2, 140); if (pb > .76) { c = mix3(c, pebble, .45); ht += .15; }
    const edge = Math.min(u, 1 - u) + (fbm(u * 4, v * 16, s + 5, 4, 16) - .5) * .12;
    if (edge < .1) { const k = clamp((.1 - edge) / .06); c = mix3(c, grassC.map(q => q * (.75 + fbm(u * 90, v * 30, s + 6, 2) * .5)), k); }
    return { c, r: .92, h: ht };
  });
}
// Dry grass ground: short strokes in golds and greens (tileable)
export function grass(o = {}) {
  const W = o.w ?? 512, s = o.seed ?? 6, A = hex(o.a ?? '#8f8c45'), B = hex(o.b ?? '#c2aa62'), D = hex(o.d ?? '#5d6a32');
  return paint(W, W, (x, y) => {
    const u = x / W, v = y / W;
    const big = fbm(u * 4, v * 4, s, 4, 4), blade = fbm(u * 120, v * 30, s + 1, 2, 120), fine = h2(x, y, s);
    let c = mix3(A, B, clamp(big * 1.4 - .2)); c = mix3(c, D, clamp((blade - .55) * 2.2));
    c = c.map(k => k * (.85 + fine * .25));
    return { c, r: .95, h: blade };
  });
}
// Foliage: dappled leaf clusters (for trees in the far blur)
export function foliage(o = {}) {
  const W = 256, s = o.seed ?? 8, A = hex(o.a ?? '#2f5a2a'), B = hex(o.b ?? '#6f9440');
  return paint(W, W, (x, y) => { const n = fbm(x / 16, y / 16, s, 4, 16), l = clamp(n * 1.6 - .3); return { c: mix3(A, B, l), r: .9, h: n }; });
}

// —— kit ——
export const rbox = (w, h, d, r = .02, m) => { const g = new RoundedBoxGeometry(w, h, d, 3, r); const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; return me; };
export const cyl = (r0, r1, h, m, seg = 24) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); me.castShadow = me.receiveShadow = true; return me; };
export const box = (w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.castShadow = me.receiveShadow = true; return me; };

// —— sky, sun, fill ——
const skyMat = new THREE.ShaderMaterial({
  uniforms: { zen: { value: new THREE.Color('#5592d2') }, hor: { value: new THREE.Color('#f7d9a6') }, sunDir: { value: new THREE.Vector3(1, .3, 0) }, sunCol: { value: new THREE.Color('#ffcf8a') } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 zen, hor, sunDir, sunCol;
    void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
      vec3 c = mix(hor, zen, smoothstep(0., .45, pow(t, .6)));
      float s = max(dot(d, normalize(sunDir)), 0.);
      c += sunCol * (pow(s, 6.) * .45 + pow(s, 60.) * .8);
      if (d.y < 0.) c = hor * .8;
      gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
export function makeLight(scene, renderer, o = {}) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat); dome.frustumCulled = false; dome.renderOrder = -1; scene.add(dome);
  const sun = new THREE.DirectionalLight(o.sun ?? '#ffd59a', o.sunI ?? 3.4); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 1.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(o.sky ?? '#a9c2ea', o.ground ?? '#8a6f52', o.hemiI ?? 1.05); scene.add(hemi);
  scene.fog = new THREE.Fog(o.fog ?? '#e8d2b0', 30, 260);
  // environment map from the sky alone (metal and paint reflect a warm sky)
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat));
  const pm = new THREE.PMREMGenerator(renderer);
  const L = {
    sun, hemi, dome,
    dir: new THREE.Vector3(1, .3, 0),
    setSun(dir, fitCenter, fitR = 8) {
      this.dir.copy(dir).normalize(); skyMat.uniforms.sunDir.value.copy(this.dir);
      sun.position.copy(fitCenter).addScaledVector(this.dir, 60); sun.target.position.copy(fitCenter); sun.target.updateMatrixWorld();
      const c = sun.shadow.camera; c.left = c.bottom = -fitR; c.right = c.top = fitR; c.near = 1; c.far = 140; c.updateProjectionMatrix();
    },
    bakeEnv() { if (scene.environment) scene.environment.dispose?.(); scene.environment = pm.fromScene(envScene, 0.02).texture; scene.environmentIntensity = o.envI ?? .55; },
    skyMat,
  };
  return L;
}
