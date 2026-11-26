// Engine Nine — everything that moves: the engine, its route, traffic (yielding, jam, ambient), people, bridge, boat, fire, smoke, water
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, STATION, BRIDGE, CANAL, QUAY, WAREHOUSE, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry, hash, vnoise, monotone } from '/core/lib.js';
import { T, q, S, Sq, fireLevel, BEAT, SPEED } from './story.js';
import { makeSprites, puffTex, flameTex, dotTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const smooth = (x, a, b) => ss(seg(x, a, b));

// —— The engine's route ——
const TRUCK_SCALE = 1.2, TL = 9.6 * TRUCK_SCALE;   // body length 11.5 m
export const EAST_Z = 522.6, SOUTH_X = 117.4, STOP_Z = 615.5, FIRE_Z = 703;
const route = (() => {
  const P = [];
  const line = (x0, z0, x1, z1, step = 1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 1; i <= n; i++) P.push([lerp(x0, x1, i / n), lerp(z0, z1, i / n)]); };
  const arc = (cx, cz, r, a0, a1, n = 24) => { for (let i = 1; i <= n; i++) { const a = lerp(a0, a1, i / n); P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  P.push([-.2, -41]);
  line(-.2, -41, -.2, -26); line(-.2, -26, -3.2, -4, 1); line(-3.2, -4, -3.2, 250); line(-3.2, 250, -4.6, 272); line(-4.6, 272, -4.6, 455);
  line(-4.6, 455, -5.6, 475); line(-5.6, 475, -5.6, 510);
  // left turn (heading +z → +x) onto the eastbound lane
  const r1 = EAST_Z - 510, c1 = [-5.6 + r1, 510];
  arc(c1[0], c1[1], r1, Math.PI, Math.PI / 2);
  // east, then right turn (heading +x → +z) onto the southbound lane of the x=120 street
  const r2 = 9, c2 = [SOUTH_X - r2, EAST_Z + r2];
  line(c1[0], EAST_Z, c2[0], EAST_Z);
  arc(c2[0], c2[1], r2, -Math.PI / 2, 0);
  line(SOUTH_X, c2[1], SOUTH_X, 760);
  const Sx = [0]; for (let i = 1; i < P.length; i++) Sx.push(Sx[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, S: Sx };
})();
export function routeAt(s) {
  const { P, S: L } = route; s = clamp(s, 0, L[L.length - 1] - .01);
  let i = 0, j = L.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (L[m] <= s) i = m; else j = m; }
  const u = (s - L[i]) / (L[j] - L[i] || 1);
  // heading from a short window, so the body turns smoothly through corners
  const a = routeXY(s - 2.5), b = routeXY(s + 2.5);
  return { x: lerp(P[i][0], P[j][0], u), z: lerp(P[i][1], P[j][1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
}
function routeXY(s) {
  const { P, S: L } = route; s = clamp(s, 0, L[L.length - 1] - .01);
  let i = 0, j = L.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (L[m] <= s) i = m; else j = m; }
  const u = (s - L[i]) / (L[j] - L[i] || 1); return [lerp(P[i][0], P[j][0], u), lerp(P[i][1], P[j][1], u)];
}
const sAtZ = (z, from = 0) => { const { P, S: L } = route; for (let i = 1; i < P.length; i++) if (L[i] >= from && P[i][1] >= z && Math.abs(P[i][0] - SOUTH_X) < 30 === (z > 600)) return L[i]; return L[L.length - 1]; };
const sLen = route.S;
const sJamStop = sAtZ(470), sTurnEnd = (() => { const { P, S: L } = route; for (let i = 0; i < P.length; i++) if (Math.abs(P[i][1] - EAST_Z) < .01 && P[i][0] > 0) return L[i]; })();
const sBridge = (() => { const { P, S: L } = route; for (let i = 0; i < P.length; i++) if (P[i][1] >= STOP_Z && P[i][0] > 100) return L[i]; })();
const sFire = (() => { const { P, S: L } = route; for (let i = 0; i < P.length; i++) if (P[i][1] >= FIRE_Z && P[i][0] > 100) return L[i]; })();
// s(t): a scripted drive in film time (the world steps it; see q())
export const truckS = monotone([
  [0, 0], [2.0, 0], [2.5, 5], [3.0, 17], [3.5, 34], [4.0, 56], [8.0, 280], [11.0, 455], [11.8, sJamStop - 3], [12.6, sJamStop], [17.0, sJamStop],
  [17.35, sJamStop + 9], [18.0, sTurnEnd + 4], [21.0, sBridge - 22], [21.55, sBridge], [27.55, sBridge], [28.0, sBridge + 2.2], [28.5, sBridge + 34], [29.05, sFire], [99, sFire],
]);
export const truckAt = t => { const s = truckS(t), r = routeAt(s); return { ...r, s }; };
export const truckSmooth = truckAt;   // the camera follows the unstepped truck; the world shows the stepped one

// —— Meshes ——
function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .55, ...o })); }
function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

export function makeTruck(scene) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.scale.setScalar(TRUCK_SCALE);
  const red = mat('#d0201b', { roughness: .32, metalness: .05 }), white = mat('#f4f1ea', { roughness: .5 }), dark = mat('#14171c', { roughness: .15, metalness: .4 }), grey = mat('#9aa0a6', { roughness: .45, metalness: .5 }), black = mat('#1d1d1f', { roughness: .8 });
  // body along +z (forward)
  box(2.4, 2.0, 7.4, red, 0, 1.55, -1.2, inner);              // rear body (lockers)
  box(2.42, .22, 7.42, white, 0, 1.55, -1.2, inner);          // white stripe
  box(2.4, 2.45, 2.3, red, 0, 1.78, 3.7, inner);              // cab
  box(2.2, .9, .08, dark, 0, 2.35, 4.86, inner);              // windscreen
  box(2.43, .7, 1.4, dark, 0, 2.3, 3.75, inner);              // side windows (dark band)
  box(2.4, .15, 9.6, mat('#2b2d31'), 0, .5, .05, inner);     // chassis rail
  box(2.3, .12, 7.0, grey, 0, 2.62, -1.3, inner);             // roof deck
  for (const [z, s] of [[3.6, 1], [-2.6, 1], [-4.0, 1]]) for (const x of [-1.12, 1.12]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .36, 12), black); w.rotation.z = Math.PI / 2; w.position.set(x, .5, z); w.castShadow = true; inner.add(w);
  }
  // light bar (emissive, blinking)
  const lr = new THREE.MeshStandardMaterial({ color: '#ff2a1a', emissive: '#ff2a1a', emissiveIntensity: 0 });
  const lb = new THREE.MeshStandardMaterial({ color: '#2a5cff', emissive: '#2a6cff', emissiveIntensity: 0 });
  const barL = box(.9, .2, .35, lr, -.55, 3.1, 3.9, inner), barR = box(.9, .2, .35, lb, .55, 3.1, 3.9, inner);
  // turntable + ladder (pivot at the rear of the roof)
  const turn = new THREE.Group(); turn.position.set(0, 2.75, -3.6); inner.add(turn);
  const tt = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .35, 16), grey); tt.castShadow = true; turn.add(tt);
  const pitch = new THREE.Group(); pitch.position.set(0, .3, 0); turn.add(pitch);
  const base = box(.9, .45, 8.6, mat('#c9ccd0', { metalness: .6, roughness: .35 }), 0, .2, 4.2, pitch);
  const fly = new THREE.Group(); pitch.add(fly);
  box(.66, .36, 8.2, mat('#e2e4e7', { metalness: .6, roughness: .35 }), 0, .45, 4.0, fly);
  const tip = new THREE.Object3D(); tip.position.set(0, .7, 8.2); fly.add(tip);
  const basket = box(1.1, .7, .8, red, 0, .55, 8.4, fly);
  // outriggers
  const legs = [];
  for (const z of [1.4, -4.6]) for (const sx of [-1, 1]) { const l = box(.3, .3, .5, grey, sx * 1.1, .7, z, inner); l.userData.sx = sx; legs.push(l); }
  scene.add(g);
  return { g, inner, turn, pitch, fly, tip, barL, barR, lr, lb, legs, basket };
}

// —— Roller door of the station ——
export function makeDoor(scene) {
  const d = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1, .3), mat('#b8322a', { roughness: .5 }));
  d.castShadow = true; scene.add(d);
  return d;
}

// —— Cars ——
const CAR_COLS = ['#f4f4f2', '#f4f4f2', '#c9ccd0', '#2a2d33', '#2f63b5', '#e4b324', '#3f8f5b', '#e9e4d8', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#f08c3a', '#a83a2f'];
export function makeCars(scene, n) {
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  const roof = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, .08, 2.0).translate(0, 2.1, -.3), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const shad = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.3, 4.9).rotateX(-Math.PI / 2).translate(0, .05, 0), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false }), n);
  for (const m of [body, cab, roof]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  scene.add(shad);
  const rnd = mulberry(31);
  for (let i = 0; i < n; i++) { C.set(CAR_COLS[Math.floor(rnd() * CAR_COLS.length)]); body.setColorAt(i, C); roof.setColorAt(i, C); }
  let k = 0;
  return {
    begin() { k = 0; },
    put(x, y, z, yaw, sc = 1, len = 1) {
      if (k >= n) return;
      Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y, z), Q, Sc.set(sc, sc, sc * len));
      body.setMatrixAt(k, M); cab.setMatrixAt(k, M); roof.setMatrixAt(k, M); shad.setMatrixAt(k, M); k++;
    },
    end() {
      for (const m of [body, cab, roof, shad]) { m.count = k; m.instanceMatrix.needsUpdate = true; }
    },
  };
}

// Yielding traffic on the main road (pre-computed in film time, 48 Hz, for 0–12.5 s), with simple car-following
export function makeRoadTraffic() {
  const rnd = mulberry(77), cars = [], ev = [];
  const DT = 1 / 48, N = Math.ceil(12.6 / DT);
  for (let z = 24; z < 460; z += 11 + rnd() * 17) cars.push({ dir: 1, lane: z < BLVD.z0 ? -3.4 : (rnd() < .5 ? -4.4 : -9.2), z0: z, v: 18 + rnd() * 9 });
  for (let z = 40; z < 440; z += 13 + rnd() * 19) cars.push({ dir: -1, lane: z < BLVD.z0 ? 3.4 : (rnd() < .5 ? 4.4 : 9.2), z0: z, v: 22 + rnd() * 10 });
  for (const c of cars) { c.zs = new Float32Array(N + 1); c.xs = new Float32Array(N + 1); c.z = c.z0; c.w = 0; c.fired = false; }
  const laneKey = c => c.dir > 0 ? (Math.abs(c.lane) > 7 ? 'o' : 'i') : 'n' + Math.abs(c.lane);
  for (let i = 0; i <= N; i++) {
    const t = i * DT, tr = truckAt(t), tz = tr.z;
    for (const c of cars) {
      const d = c.z - tz;   // >0: the car is ahead of the engine (same way) or still coming toward it (oncoming)
      const want = (c.dir > 0 ? (d > -14 && d < 55) : (d > -16 && d < 70)) && t > 1.6 ? 1 : 0;
      c.w += (want - c.w) * Math.min(1, DT * 5);
      if (!c.fired && c.w > .5) { c.fired = true; ev.push({ t, type: 'yield', x: c.lane, z: c.z }); }
      c.z += c.dir * c.v * (1 - .92 * c.w) * DT;
    }
    // car-following for the southbound lanes: nobody passes the car in front, the stopped engine, or the jam's tail
    const groups = {};
    for (const c of cars) if (c.dir > 0) (groups[laneKey(c)] ||= []).push(c);
    for (const k in groups) {
      const g = groups[k].sort((a, b) => b.z - a.z);
      let lead = k === 'o' ? 474.2 - 6.8 : 9999;
      if (k === 'i' && t > 6) lead = Math.min(lead, tz - TL / 2 - 4);
      for (const c of g) { if (c.z > lead && !(k === 'i' && c.z > tz)) c.z = lead; if (!(k === 'i' && c.z > tz)) lead = c.z - 6.8; }
    }
    for (const c of cars) {
      const inBlvd = c.z > BLVD.z0 && c.z < BLVD.z1;
      const target = !inBlvd ? Math.sign(c.lane) * 6.0 : (Math.abs(c.lane) > 7 ? Math.sign(c.lane) * 10.8 : Math.sign(c.lane) * 8.0);
      c.zs[i] = c.z; c.xs[i] = lerp(c.lane, target, ss(c.w));
    }
  }
  return {
    cars, ev,
    draw(cars3, t) {
      const i = clamp(Math.round(Math.min(t, 12.5) / DT), 0, N);
      for (const c of cars) { const z = c.zs[i]; if (z > 469 && c.dir > 0 && Math.abs(c.lane) < 7) continue; if (z < -4) continue; cars3.put(c.xs[i], 0, z, c.dir > 0 ? 0 : Math.PI); }
    },
  };
}

// The gridlock at the crossroads (hand-placed; three partings on beats)
export function makeJam() {
  const J = [];
  const add = (x, z, yaw, mv) => J.push({ x, z, yaw, mv });
  // southbound queue: lane next to the median (to the median at 14 / 15), outer lane (to the kerb)
  [478.6, 485.4, 492.2, 499.0, 505.8].forEach((z, i) => add(-4.4, z, 0, { t: i < 2 ? T.part1 : T.part2, dx: 3.6, dz: 0, up: .25 }));
  [474.2, 481.0, 487.8, 494.6, 501.4].forEach((z, i) => add(-9.2, z, 0, { t: i < 2 ? T.part1 : T.part2, dx: -1.5, dz: 0 }));
  // stuck in the box: westbound crawl west at 16, eastbound roll east and pull to the kerb at 16
  [-16, -10, -4, 2, 8].forEach(x => add(x, 516.2, -Math.PI / 2, { t: T.part3, dx: -20, dz: 0 }));
  [-14, -8, -2, 4, 10, 16].forEach((x, i) => add(x, 523.6, Math.PI / 2, { t: T.part3, dx: 22 + i * 1.5, dz: 3.4 }));
  // queues outside the box (static, they just crawl)
  for (let i = 0; i < 10; i++) add(24 + i * 6.6, 516.2, -Math.PI / 2, null);
  for (let i = 0; i < 7; i++) add(-24 - i * 6.6, 523.6, Math.PI / 2, null);
  for (let i = 0; i < 6; i++) add(3.4, 534 + i * 6.8, Math.PI, null);
  for (let i = 0; i < 5; i++) add(i % 2 ? 9.2 : 4.4, 470 + i * 7.5, Math.PI, null);
  return {
    J,
    draw(cars3, t) {
      for (const c of J) {
        let x = c.x, z = c.z, y = 0, yaw = c.yaw;
        if (c.mv) {
          const u = eio(seg(t, c.mv.t, c.mv.t + .55));
          x += c.mv.dx * u; z += c.mv.dz * u; y += (c.mv.up || 0) * u;
          yaw += Math.sin(u * Math.PI) * .25 * Math.sign(c.mv.dx || 1) * (c.yaw === 0 ? 1 : 0);
        }
        cars3.put(x, y, z, yaw);
      }
    },
  };
}

// Ambient traffic: constant-speed lanes on the sim clock; cars that would sit in the engine's way are dropped
export function makeAmbient() {
  const rnd = mulberry(5), lanes = [];
  const box = [   // the engine's crossings: [axis, coord lo, hi, t0, t1]
    ['x', -16, 16, 2.6, 4.2, 114, 126],     // EW z=120 crossing (filled in below by time)
  ];
  const crossT = z => { for (let t = 0; t < 30; t += .02) if (truckAt(t).z >= z) return t; return 99; };
  const tz120 = crossT(120), tz260 = crossT(260);
  const avoid = [
    { axis: 'x', lo: -16, hi: 14, t0: tz120 - 1.1, t1: tz120 + .6, z: 120 },
    { axis: 'x', lo: -20, hi: 18, t0: tz260 - 1.1, t1: tz260 + .6, z: 260 },
    { axis: 'z', lo: 505, hi: 540, t0: 17.4, t1: 19.4, x: 120 },
    { axis: 'x', lo: 104, hi: 134, t0: 27.4, t1: 28.6, z: 630 },
  ];
  for (const e of EW) {
    if (e.z === 520) continue;   // the jam street is hand-placed
    for (const dir of [1, -1]) lanes.push({ axis: 'x', c: e.z + dir * (e.h - 2.6), dir, v: 11 + rnd() * 3, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [14, 40], key: e.z });
  }
  for (const s of NS) {
    if (s.x === 0) continue;
    for (const dir of [1, -1]) {
      if (s.x === 120) continue;   // southbound: the engine's own lane; northbound: nothing comes over a raised bridge
      lanes.push({ axis: 'z', c: s.x - dir * (s.h - 2.6), dir, v: 10 + rnd() * 3, x0: EXT.z0 - 60, x1: 625, gap: [16, 46], key: s.x });
    }
  }
  lanes.push({ axis: 'x', c: QUAY.road0 + 3, dir: -1, v: 9, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [30, 70], key: 'quay' });
  lanes.push({ axis: 'x', c: QUAY.road1 - 3, dir: 1, v: 9, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [30, 70], key: 'quay' });
  for (const L of lanes) {
    L.cars = []; const len = L.x1 - L.x0;
    for (let s = rnd() * 20; s < len; s += L.gap[0] + rnd() * (L.gap[1] - L.gap[0])) L.cars.push({ s0: s, sc: rnd() < .08 ? 1.12 : 1, len: rnd() < .06 ? 2.4 : 1 });
    // drop any car that would be inside an engine crossing during its window
    L.cars = L.cars.filter(c => {
      for (const a of avoid) {
        if (a.axis !== L.axis) continue;
        if (a.z !== undefined && Math.abs(L.c - a.z) > 8) continue;
        if (a.x !== undefined && Math.abs(L.c - a.x) > 8) continue;
        for (let t = a.t0; t <= a.t1; t += 1 / 24) { const p = posOf(L, c, Sq(t)); if (p > a.lo - 3 && p < a.hi + 3) return false; }
      }
      return true;
    });
  }
  function posOf(L, c, s) { const len = L.x1 - L.x0; let u = (c.s0 + L.v * s * 3) % len; if (u < 0) u += len; return L.dir > 0 ? L.x0 + u : L.x1 - u; }
  // pulled-over cars in the engine's lanes (east on z=520 ahead of the jam, south on x=120)
  const parked = [];
  for (let x = 30; x < 100; x += 9 + rnd() * 10) parked.push([x, EAST_Z + 4.2, Math.PI / 2]);
  for (let z = 545; z < 600; z += 10 + rnd() * 12) parked.push([SOUTH_X - 3.8, z, 0]);
  for (let z = 674; z < 698; z += 6.9) parked.push([122.6, z, Math.PI]);   // waiting on the far side of the bridge
  for (let z = 300; z < 600; z += 30 + rnd() * 30) parked.push([123.4, z, Math.PI]);
  return {
    draw(cars3, t) {
      const s = Sq(t);
      for (const L of lanes) for (const c of L.cars) {
        const p = posOf(L, c, s);
        if (L.axis === 'x') cars3.put(p, 0, L.c, L.dir > 0 ? Math.PI / 2 : -Math.PI / 2, c.sc, c.len);
        else cars3.put(L.c, 0, p, L.dir > 0 ? 0 : Math.PI, c.sc, c.len);
      }
      for (const [x, z, yaw] of parked) cars3.put(x, 0, z, yaw);
    },
  };
}

// —— People: capsules on the sidewalks, onlookers by the fire, the crew ——
export function makePeople(scene) {
  const rnd = mulberry(12), walkers = [], crowd = [];
  for (let i = 0; i < 520; i++) {
    const side = rnd() < .5 ? -1 : 1, along = rnd();
    const r = rnd();
    if (r < .45) { const z = lerp(-20, 625, along), hw = z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : 7; walkers.push({ axis: 'z', c: side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -20, hi: 625 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; walkers.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, along), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460 }); }
  }
  for (let i = 0; i < 46; i++) crowd.push({ x: 92 + rnd() * 17, z: 708 + rnd() * 26, ph: rnd() * 10 });
  const crew = [[-3.2, -2], [3.0, -1.0], [3.2, -4.4], [-2.8, 2.4], [-5.5, -5]];
  const n = walkers.length + crowd.length + crew.length;
  const g = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(g, patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), n); m.castShadow = true;
  const PCOL = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  for (let i = 0; i < n; i++) m.setColorAt(i, C.set(i >= walkers.length + crowd.length ? '#e9b82c' : PCOL[Math.floor(rnd() * PCOL.length)]));
  const helmets = new THREE.InstancedMesh(new THREE.SphereGeometry(.26, 8, 6).translate(0, 1.45, 0), new THREE.MeshStandardMaterial({ color: '#c8201a', roughness: .4 }), crew.length);
  scene.add(m, helmets);
  return {
    crew,
    draw(t, truck) {
      const s = Sq(t); let k = 0;
      for (const w of walkers) {
        const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s * 3) % span; if (u < 0) u += span; const p = w.lo + u;
        M.compose(P.set(w.axis === 'z' ? w.c : p, .12, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(k++, M);
      }
      for (const c of crowd) { const j = Math.sin(s * 3 + c.ph) * .3; M.compose(P.set(c.x + j, .1, c.z), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(k++, M); }
      const on = t >= T.arrive + .3;
      crew.forEach(([dx, dz], i) => {
        const wx = truck.x + dx * Math.cos(truck.yaw) + dz * Math.sin(truck.yaw), wz = truck.z - dx * Math.sin(truck.yaw) + dz * Math.cos(truck.yaw);
        M.compose(P.set(wx, on ? .1 : -50, wz), Q.identity(), Sc.set(1.08, 1.08, 1.08)); m.setMatrixAt(k++, M); helmets.setMatrixAt(i, M);
      });
      m.count = k; m.instanceMatrix.needsUpdate = true; helmets.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— Drawbridge (two bascule leaves) + barrier arms ——
export const bridgeAngle = t => {
  if (t < T.bridge0) return 1.2;
  const u = seg(t, T.bridge0, T.clunk);
  return 1.2 * (1 - eio(u));
};
export function makeBridge(scene) {
  const deck = mat('#5b5f66', { roughness: .8 }), rail = mat('#f2efe8'), redm = mat('#c7302a');
  const L = (BRIDGE.hinge1 - BRIDGE.hinge0) / 2 + .2, W = BRIDGE.x1 - BRIDGE.x0 + 1.2;
  const mk = (hz, dir) => {
    const piv = new THREE.Group(); piv.position.set((BRIDGE.x0 + BRIDGE.x1) / 2, .0, hz); scene.add(piv);
    const d = box(W, .7, L, deck, 0, -.35, dir * L / 2, piv);
    box(W - .4, .04, .25, mat('#e9b93a'), 0, .02, dir * L / 2, piv);
    for (const sx of [-1, 1]) box(.25, 1.1, L, rail, sx * (W / 2 - .15), .55, dir * L / 2, piv);
    return piv;
  };
  const a = mk(BRIDGE.hinge0, 1), b = mk(BRIDGE.hinge1, -1);
  const arms = [];
  for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(sx < 0 ? BRIDGE.x0 - .7 : BRIDGE.x1 + .7, 1.2, BRIDGE.z0 + .4); scene.add(piv);
    const arm = new THREE.Group(); piv.add(arm);
    for (let i = 0; i < 6; i++) box(1.05, .18, .18, i % 2 ? rail : redm, -sx * (.55 + i * 1.05), 0, 0, arm);
    arms.push({ piv, arm, sx });
  }
  return {
    draw(t) {
      const th = bridgeAngle(t);
      a.rotation.x = -th; b.rotation.x = th;
      const up = smooth(t, T.clunk + .15, T.clunk + .55) * (t < 28.5 ? 1 : 1);
      for (const A of arms) A.arm.rotation.z = A.sx * up * 1.35;
    },
  };
}

// —— Sailboat passing through the bridge, plus moored boats ——
export function makeBoats(scene) {
  const g = new THREE.Group(); scene.add(g);
  const hullShape = new THREE.Shape(); hullShape.moveTo(-6, -1.6); hullShape.lineTo(3, -1.6); hullShape.quadraticCurveTo(6.2, -1.2, 6.8, 0); hullShape.quadraticCurveTo(6.2, 1.2, 3, 1.6); hullShape.lineTo(-6, 1.6); hullShape.lineTo(-6, -1.6);
  const hullG = new THREE.ExtrudeGeometry(hullShape, { depth: 1.5, bevelEnabled: false }); hullG.rotateX(-Math.PI / 2); hullG.translate(0, -.6, 0);
  const hull = new THREE.Mesh(hullG, mat('#f6f6f2', { roughness: .4 })); hull.castShadow = true; g.add(hull);
  const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: .05, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, .92, 0).scale(.96, 1, .9), mat('#b98a5a')); g.add(deck);
  box(12.4, .2, 3.25, mat('#1f4f9a'), .2, .1, 0, g).scale.set(1, 1, .98);
  box(3.4, .9, 2.0, mat('#f6f6f2'), -1.4, 1.4, 0, g);
  const mast = box(.22, 15, .22, mat('#d9d9d9', { metalness: .5 }), .8, 8.4, 0, g);
  const sailShape = new THREE.Shape(); sailShape.moveTo(0, 0); sailShape.lineTo(-5.6, 0); sailShape.lineTo(0, 13); sailShape.lineTo(0, 0);
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), mat('#fbfaf5', { side: THREE.DoubleSide, roughness: .7 })); sail.position.set(.7, 1.6, .1); sail.rotation.y = .25; sail.castShadow = true; g.add(sail);
  const jibShape = new THREE.Shape(); jibShape.moveTo(0, 0); jibShape.lineTo(4.6, 0); jibShape.lineTo(0, 12); jibShape.lineTo(0, 0);
  const jib = new THREE.Mesh(new THREE.ShapeGeometry(jibShape), mat('#f3efe4', { side: THREE.DoubleSide, roughness: .7 })); jib.position.set(1.0, 1.6, -.1); jib.rotation.y = -.2; jib.castShadow = true; g.add(jib);
  // moored boats in the harbour (small motorboats)
  const moor = [];
  const rnd = mulberry(4);
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group(); const L2 = 5 + rnd() * 4;
    box(L2, 1.0, 2.0, mat(['#f6f6f2', '#e9e4d8', '#3a6fb0', '#d74b3a', '#f2c94c'][Math.floor(rnd() * 5)], { roughness: .4 }), 0, .1, 0, b);
    box(L2 * .35, .8, 1.5, mat('#f6f6f2'), -L2 * .1, .9, 0, b);
    b.position.set(-300 + i * 46 + rnd() * 10, -.6, QUAY.edge + 4 + rnd() * 6); b.rotation.y = Math.PI / 2 + (rnd() - .5) * .2; scene.add(b); moor.push(b);
  }
  return {
    draw(t) {
      const x = lerp(108, 140, seg(t, 21.6, 26.4));
      const on = t > 21.5 && t < 28.6;
      g.position.set(on ? x : -9999, CANAL.y + .9, (CANAL.z0 + CANAL.z1) / 2 + 1.2);
      g.rotation.y = 0; g.rotation.z = Math.sin(t * 1.3) * .015;
      // hull points along +x
      g.rotation.y = 0;
      const s = Sq(t); moor.forEach((b, i) => { b.position.y = -.6 + Math.sin(s * 2 + i) * .08; });
    },
  };
}

// —— Fire: flame sprites on the warehouse roof, glowing windows, light ——
const roofY = x => WAREHOUSE.h + WAREHOUSE.ridge * (1 - Math.abs(x - (WAREHOUSE.x0 + WAREHOUSE.x1) / 2) / ((WAREHOUSE.x1 - WAREHOUSE.x0) / 2 + .5));
export const FIRE_TARGET = V(150, 14.6, 704);
export function makeFire(scene) {
  const rnd = mulberry(66), N = 70, F = [];
  for (let i = 0; i < N; i++) { const x = 138 + rnd() * 28, z = 688 + rnd() * 32; F.push({ x, z, y: roofY(x), s: .8 + rnd() * 1.1, ph: rnd() * 40, order: rnd() }); }
  F.sort((a, b) => a.order - b.order);
  const sp = makeSprites(scene, N, flameTex(), { additive: false, anchor: 1 }), core = makeSprites(scene, N, flameTex(), { additive: true, anchor: 1 });
  // glowing windows on the street facade (west, x = x0) and the south gable
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.1, .3) });
  for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), glowM); w.rotation.y = -Math.PI / 2; w.position.set(WAREHOUSE.x0 - .06, 8.2, WAREHOUSE.z0 + 5 + i * 7.6); scene.add(w); }
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), glowM); w.position.set(WAREHOUSE.x0 + 6 + i * 10, 8.2, WAREHOUSE.z1 + .06); scene.add(w); }
  const light = new THREE.PointLight('#ff7a2e', 0, 60, 2); light.position.set(150, 19, 704); scene.add(light);
  return {
    draw(t) {
      const tq = q(t), lev = fireLevel(tq), n = Math.round(N * lev);
      for (let i = 0; i < N; i++) {
        const f = F[i];
        if (i >= n) { sp.hide(i); core.hide(i); continue; }
        const fl = .55 + .9 * vnoise(tq * 7 + f.ph);
        const h = f.s * fl * (2.6 + 1.6 * lev), w = f.s * (2.4 + .7 * vnoise(tq * 5 + f.ph * 3));
        const lean = (vnoise(tq * 3 + f.ph * 2) - .5) * .5 - .12;
        sp.set(i, f.x, f.y - .5, f.z, w, h, 1.0, .5, .12, .92, lean);
        core.set(i, f.x, f.y - .4, f.z, w * .5, h * .5, 1.1, .75, .3, .8, lean * .6);
      }
      const fl = .8 + .4 * vnoise(tq * 9);
      glowM.color.setRGB(3.4 * lev * fl + .03, 1.2 * lev * fl + .03, .32 * lev * fl + .03);
      light.intensity = 260 * lev * fl;
    },
    finish(cam, fog) { sp.sortBy(cam); sp.commit(fog); core.commit(fog); },
  };
}

// —— Smoke and steam: soft puffs on the sim clock; each puff's colour is set by when it was born ——
function invS(s) { let acc = 0; for (const p of SPEED) { const len = (p.t1 - p.t0) * p.k; if (s <= acc + len) return p.t0 + (s - acc) / p.k; acc += len; } return 99; }
export function makeSmoke(scene) {
  const N = 320, L = 26, rnd = mulberry(91);
  const seeds = Array.from({ length: N }, () => [rnd(), rnd(), rnd(), rnd(), rnd()]);
  const sp = makeSprites(scene, N, puffTex(), { additive: false });
  const dark = new THREE.Color('#2e2d2f'), mid = new THREE.Color('#77787b'), steam = new THREE.Color('#f4f6f8'), ember = new THREE.Color('#ff7b35');
  return {
    draw(t) {
      const s = Sq(t);
      for (let i = 0; i < N; i++) {
        const [a, b, c, d, e] = seeds[i];
        const age = ((s + a * L) % L), born = s - age, bt = invS(Math.max(0, born));
        const lev = fireLevel(bt), isSteam = bt >= T.water;
        let alive = born < 0 ? 1 : 1;
        if (isSteam && (bt > T.out1 + 1.5 || d > .35 + .65 * Math.max(lev, .5))) alive = 0;
        if (!isSteam && born >= 0 && lev <= 0) alive = 0;
        if (!alive) { sp.hide(i); continue; }
        const u = age / L;
        const x0 = 140 + b * 24, z0 = 690 + c * 28;
        const rise = isSteam ? 4.6 : 7.0;
        const y = roofY(x0) + 1 + age * rise + Math.pow(age, 1.25) * .5;
        const x = x0 + age * 1.6 + Math.pow(age, 1.6) * .2 + Math.sin(age * .7 + a * 9) * 2.4;
        const z = z0 - age * 2.4 - Math.pow(age, 1.5) * .22 + Math.cos(age * .5 + b * 7) * 2.2;
        let r = (isSteam ? 4 : 6) + age * (isSteam ? 2.0 : 2.6) + d * 3;
        r *= .35 + .65 * smooth(age, 0, 1.5);
        const al = (isSteam ? .55 : .82) * smooth(age, 0, .6) * (1 - smooth(u, .7, 1));
        if (isSteam) C.copy(steam).lerp(mid, .1 * u); else C.copy(dark).lerp(mid, Math.min(1, u * 1.4));
        if (!isSteam) C.lerp(ember, (1 - smooth(age, 0, 1.6)) * .55 * lev);
        C.multiplyScalar(.9 + .2 * e);
        sp.set(i, x, y, z, r, r, C.r, C.g, C.b, al, e * 6.28);
      }
    },
    finish(cam, fog) { sp.sortBy(cam); sp.commit(fog); },
  };
}

// —— Water jet from the ladder tip to the roof, with spray at the target ——
export function makeWater(scene) {
  const N = 220;
  const sp = makeSprites(scene, N, dotTex(), { additive: false });
  return {
    draw(t, nozzle) {
      const on = t >= T.water && t < T.out1 + 1.2, s = Sq(t);
      if (!on) { for (let i = 0; i < N; i++) sp.hide(i); return; }
      const tgt = FIRE_TARGET, grow = clamp((q(t) - T.water) / .35);
      const fade = 1 - seg(t, T.out1 + .4, T.out1 + 1.2);
      for (let i = 0; i < N; i++) {
        if (i < 170) {
          let u = ((i / 170) + s * 1.1) % 1; u *= grow;
          P.copy(nozzle).lerp(tgt, u); P.y += Math.sin(u * Math.PI) * 5.5;
          const sp2 = u * u * 1.4; P.x += (hash(i * 3.1) - .5) * sp2; P.z += (hash(i * 7.7) - .5) * sp2; P.y += (hash(i * 5.3) - .5) * sp2 * .6;
          const r = .55 + u * 1.3;
          sp.set(i, P.x, P.y, P.z, r, r, .95, .98, 1.0, .85 * fade);
        } else {
          const k = i - 170, a = ((k / 50) + s * .8) % 1;
          P.copy(tgt); P.x += (hash(k * 2.3) - .5) * 9 * a; P.z += (hash(k * 4.1) - .5) * 9 * a; P.y += a * 3;
          const r = 1 + a * 3;
          sp.set(i, P.x, P.y, P.z, r, r, .92, .95, 1.0, .45 * (1 - a) * grow * fade);
        }
      }
    },
    finish(cam, fog) { sp.commit(fog); },
  };
}
