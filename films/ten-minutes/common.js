// Ten Minutes — shared pieces from the town: cars, ambient traffic, sidewalk walkers, the drawbridge, moored boats
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, BRIDGE, CANAL, QUAY, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, mulberry, hash } from '/core/lib.js';
import { T, Sq } from './story.js';
import { mat, box, scooterAt, leafAngle, HAND, MARKET } from './actors.js';
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const smooth = (x, a, b) => ss(seg(x, a, b));
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

// Ambient traffic: constant-speed lanes on the sim clock; cars that would sit in the engine's way are dropped
export function makeAmbient() {
  const crossT = (axis, c, lo = -1e9, hi = 1e9) => { for (let t = 0; t < 45; t += .02) { const p = scooterAt(t); if ((axis === 'z' ? p.z : p.x) >= c && (axis === 'z' ? p.x : p.z) > lo && (axis === 'z' ? p.x : p.z) < hi) return t; } return 99; };
  const rnd = mulberry(5), lanes = [];
  const c120 = crossT('z', 120, -140, -120), c260 = crossT('z', 260, -140, -120), c520 = crossT('z', 520, 110, 125), c630 = crossT('z', 630, 110, 125);
  const avoid = [
    { axis: 'x', lo: -142, hi: -118, t0: c120 - 1.0, t1: c120 + .6, z: 120 },
    { axis: 'x', lo: -142, hi: -118, t0: c260 - 1.0, t1: c260 + .6, z: 260 },
    { axis: 'x', lo: 104, hi: 132, t0: c520 - 1.0, t1: c520 + .6, z: 520 },
    { axis: 'x', lo: 104, hi: 132, t0: c630 - 1.0, t1: c630 + .6, z: 630 },
    { axis: 'z', lo: 405, hi: 435, t0: 24.0, t1: 27.0, x: 120 },
  ];
  for (const e of EW) {
    for (const dir of [1, -1]) lanes.push({ axis: 'x', c: e.z + dir * (e.h - 2.6), dir, v: 11 + rnd() * 3, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [14, 40], key: e.z });
  }
  for (const s of NS) {
    if (s.x === 0) continue;
    for (const dir of [1, -1]) {
      if (s.x === -130) continue;   // the market / dog street: closed to cars
      if (s.x === 120 && dir === 1) continue;   // the scooter's own lane
      lanes.push({ axis: 'z', c: s.x - dir * (s.h - 2.6), dir, v: 10 + rnd() * 3, x0: EXT.z0 - 60, x1: 625, gap: [16, 46], key: s.x });
    }
  }
  lanes.push({ axis: 'x', c: QUAY.road0 + 3, dir: -1, v: 9, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [30, 70], key: 'quay' });
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
  const parked = [];
  for (let z = 270; z < 410; z += 11 + rnd() * 14) parked.push([-125.4, z, Math.PI]);
  for (let z = 440; z < 600; z += 14 + rnd() * 14) parked.push([113.8, z, 0]);
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

// —— Walkers on the pavements (not on the market street) ——
export function makeWalkers(scene) {
  const rnd = mulberry(12), W = [];
  for (let i = 0; i < 420; i++) {
    const side = rnd() < .5 ? -1 : 1;
    if (rnd() < .4) { const z = lerp(-20, 625, rnd()), hw = z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : 7; W.push({ axis: 'z', c: side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -20, hi: 625 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; W.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, rnd()), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460 }); }
  }
  const g = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(g, patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), W.length); m.castShadow = true;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  for (let i = 0; i < W.length; i++) m.setColorAt(i, C.set(PC[Math.floor(rnd() * PC.length)]));
  scene.add(m);
  return { draw(t) { const s = Sq(t); W.forEach((w, i) => { const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s * 3) % span; if (u < 0) u += span; const p = w.lo + u; M.compose(P.set(w.axis === 'z' ? w.c : p, .12, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M); }); m.instanceMatrix.needsUpdate = true; } };
}

// —— Drawbridge (two bascule leaves) + barrier arms ——
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
      const th = leafAngle(t);
      a.rotation.x = -th; b.rotation.x = th;
      const up = 1 - smooth(t, T.bells + .8, T.bells + 1.3);
      for (const A of arms) A.arm.rotation.z = A.sx * up * 1.35;
    },
  };
}

// —— Sailboat passing through the bridge, plus moored boats ——
export function makeBoats(scene) {
  // moored boats in the harbour (small motorboats)
  const moor = [];
  const rnd = mulberry(4);
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group(); const L2 = 5 + rnd() * 4;
    box(L2, 1.0, 2.0, mat(['#f6f6f2', '#e9e4d8', '#3a6fb0', '#d74b3a', '#f2c94c'][Math.floor(rnd() * 5)], { roughness: .4 }), 0, .1, 0, b);
    box(L2 * .35, .8, 1.5, mat('#f6f6f2'), -L2 * .1, .9, 0, b);
    b.position.set(-300 + i * 46 + rnd() * 10, -.6, QUAY.edge + 4 + rnd() * 6); b.rotation.y = Math.PI / 2 + (rnd() - .5) * .2;
    if (Math.abs(b.position.x - HAND.x) < 16) continue; scene.add(b); moor.push(b);
  }
  return {
    draw(t) {
      const s = Sq(t); moor.forEach((b, i) => { b.position.y = -.6 + Math.sin(s * 2 + i) * .08; });
    },
  };
}

