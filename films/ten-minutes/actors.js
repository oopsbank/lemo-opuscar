// Ten Minutes — everything that moves: the scooter and its route, the market, the dog, the roadworks, the parade, the bridge, the rain, the hand-over
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, BRIDGE, CANAL, QUAY, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, vnoise, monotone, back } from '/core/lib.js';
import { T, S, Sq, X_TL, rainAmt } from './story.js';
import { makeSprites, puffTex, dotTex, canvasTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const smooth = (x, a, b) => ss(seg(x, a, b));
export function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .55, ...o })); }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

// —— Layout of this film's places ——
export const PIZZERIA = { x0: -151, x1: -139, z0: 28, z1: 46, h: 7.2, door: 37 };
export const MARKET = { x: -130, z0: 130, z1: 250 };
export const DOG_YARD = { x: -121.5, z: 312 };
export const WORKS = { x: -130, z0: 437, z1: 470 };
export const ALLEY = { z: 420, h: 2.6 };
export const PARADE = { x0: -11, x1: -2.4 };
export const HAND = V(203, 0, 786);     // where the scooter stops on the quay
export const BOAT = V(203, 0, 798);
export const EXCL = [
  [PIZZERIA.x0 - 1, PIZZERIA.x1 + 1, PIZZERIA.z0 - 1, PIZZERIA.z1 + 1],
  [-125, -14, ALLEY.z - ALLEY.h - 1, ALLEY.z + ALLEY.h + 1],
  [14, 115, ALLEY.z - ALLEY.h - 1, ALLEY.z + ALLEY.h + 1],
  [-125, -108, DOG_YARD.z - 9, DOG_YARD.z + 9],
  [-124, -110, WORKS.z0 + 16, WORKS.z0 + 36],
];

// —— The scooter's route (plan view), and its keyframed drive ——
const SX = -131.6, EASTQ = QUAY.road0 + (QUAY.road1 - QUAY.road0) / 2 + 3.4 - 3.4 + 3.4, SOUTHX = 117.4;
const route = (() => {
  const P = [], mark = {};
  const push = (x, z) => P.push([x, z]);
  const line = (x0, z0, x1, z1, step = 1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 1; i <= n; i++) push(lerp(x0, x1, i / n), lerp(z0, z1, i / n)); };
  const arc = (cx, cz, r, a0, a1, n = 20) => { for (let i = 1; i <= n; i++) { const a = lerp(a0, a1, i / n); push(cx + Math.cos(a) * r, cz + Math.sin(a) * r); } };
  push(-134.6, 37);
  line(-134.6, 37, -134.0, 60); line(-134.0, 60, SX, 110);
  // market: weave between the stalls
  for (let z = 112; z <= 262; z += 1) push(-130 + 2.3 * Math.sin((z - 118) / 13), z);
  line(-130, 262, SX, 280); mark.dogStart = P.length;
  line(SX, 280, SX, 431);
  // brake, U-turn, back to the alley, right into it
  mark.uturn = P.length; arc(SX + 2.4, 431, 2.4, Math.PI, 0, 16);   // heading south → north (turning through east)
  const r1 = 4; line(SX + 4.8, 431, SX + 4.8, ALLEY.z + r1);
  arc(SX + 4.8 + r1, ALLEY.z + r1, r1, Math.PI, Math.PI * 1.5, 10);   // heading north → east
  line(SX + 4.8 + r1, ALLEY.z, -17, ALLEY.z); mark.mouth = P.length;
  // across the boulevard (hop the median), through the east alley, right turn south
  line(-17, ALLEY.z, 17, ALLEY.z); line(17, ALLEY.z, SOUTHX - 5, ALLEY.z);
  arc(SOUTHX - 5, ALLEY.z + 5, 5, -Math.PI / 2, 0, 10);
  line(SOUTHX, ALLEY.z + 5, SOUTHX, 743.4); mark.bridgeN = 0;
  // left turn onto the quay road (east), then right onto the quay
  const r2 = 6; arc(SOUTHX + r2, 743.4, r2, Math.PI, Math.PI / 2, 12);
  line(SOUTHX + r2, 749.4, 196, 749.4);
  const r3 = 7; arc(196, 749.4 + r3, r3, -Math.PI / 2, 0, 12);
  line(203, 756.4, HAND.x, HAND.z);
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, L, mark };
})();
function at(s) {
  const { P, L } = route; s = clamp(s, 0, L[L.length - 1] - .001);
  let i = 0, j = L.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (L[m] <= s) i = m; else j = m; }
  const u = (s - L[i]) / (L[j] - L[i] || 1); return [lerp(P[i][0], P[j][0], u), lerp(P[i][1], P[j][1], u)];
}
const sWhere = f => { const { P, L } = route; for (let i = 0; i < P.length; i++) if (f(P[i][0], P[i][1], i)) return L[i]; return L[L.length - 1]; };
const sZ = (z, xNear) => sWhere((x, zz) => zz >= z && Math.abs(x - xNear) < 6);
const sMouth = route.L[route.mark.mouth - 1], sUturn = route.L[route.mark.uturn];
const sEndAlley = sWhere((x, z) => x > SOUTHX - 1 && z > ALLEY.z + 4.9);
const sQuayTurn = sWhere((x, z) => z >= 743.4 && x > SOUTHX - .5 && z < 744);
const sHand = route.L[route.L.length - 1];
export const ROUTE = { sMouth, sHand };

// bridge leaves: rise from 30.6; slow-motion creep during the jump; open after
export const leafAngle = t => {
  if (t < T.leaf0) return 0;
  if (t < T.takeoff) return .42 * eio(seg(t, T.leaf0, T.takeoff)) ** .8;
  if (t < T.land) return lerp(.42, .45, seg(t, T.takeoff, T.land));
  return lerp(.45, 1.15, eio(seg(t, T.land, 34.6)));
};
const LEAF = (BRIDGE.hinge1 - BRIDGE.hinge0) / 2 + .2;
const tipN = t => BRIDGE.hinge0 + LEAF * Math.cos(leafAngle(t)), tipS = t => BRIDGE.hinge1 - LEAF * Math.cos(leafAngle(t));
const sTake = sZ(BRIDGE.hinge0 + LEAF * Math.cos(.42) - .3, SOUTHX), sLand = sZ(BRIDGE.hinge1 - LEAF * Math.cos(.45) + .3, SOUTHX);

export const scooterS = monotone([
  [0, 0], [T.go, 0], [2.6, 6], [3.0, 40], [6.5, sZ(190, -130)], [9.0, sZ(262, -130)], [12.6, sZ(400, SX)], [14.0, sZ(418, SX)],
  [T.brake, sUturn - 3], [T.uturn0, sUturn], [T.uturn1, sUturn + 9], [T.alley, sUturn + 22], [19.3, sMouth - .5], [T.go2, sMouth],
  [25.0, sMouth + 32], [26.7, sEndAlley], [30.0, sZ(600, SOUTHX)], [31.3, sZ(640, SOUTHX)], [T.takeoff, sTake], [T.land, sLand], [33.35, sZ(667, SOUTHX)],
  [34.0, sZ(700, SOUTHX)], [34.8, sQuayTurn], [38.9, sWhere((x, z) => x >= 186 && z > 749)], [40.2, sHand - 9], [T.stop, sHand], [999, sHand],
]);
export function scooterAt(t) {
  const s = scooterS(t), [x, z] = at(s), a = at(s - 1.2), b = at(s + 1.2);
  let yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), y = 0, pitch = 0;
  if (t < T.go) yaw = 0;
  // the median hop
  if (Math.abs(x) < BLVD.med + .3 && Math.abs(z - ALLEY.z) < 3) y = .26;
  // the bridge: up the north leaf, the flight, down the south leaf
  if (x > 100 && z > BRIDGE.hinge0 && z < BRIDGE.hinge1) {
    const th = leafAngle(t);
    if (t < T.takeoff) { y = (z - BRIDGE.hinge0) * Math.tan(th); pitch = -th; }
    else if (t < T.land) { const u = seg(t, T.takeoff, T.land); const y0 = LEAF * Math.sin(.42), y1 = LEAF * Math.sin(.45); y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * 2.6; pitch = lerp(-.42, .45, u); }
    else { y = Math.max(0, (BRIDGE.hinge1 - z) * Math.tan(th)); pitch = th; }
  }
  return { x, y, z, yaw, pitch, s };
}

// —— Meshes: scooter + rider + delivery box ——
export function makeScooter(scene) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.scale.setScalar(1.7);
  const body = mat('#7fd1c4', { roughness: .35 }), red = mat('#d8342a', { roughness: .45 }), white = mat('#f6f3ec'), dark = mat('#1d1f22', { roughness: .8 }), skin = mat('#e2b48c');
  box(.5, .45, 1.5, body, 0, .5, -.05, inner);                 // body
  box(.45, .6, .25, body, 0, .75, .62, inner);                 // leg shield
  box(.6, .06, .08, dark, 0, 1.1, .62, inner);                 // handlebar
  box(.42, .12, .75, dark, 0, .82, -.25, inner);               // seat
  for (const z of [.62, -.62]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .14, 12), dark); w.rotation.z = Math.PI / 2; w.position.set(0, .24, z); w.castShadow = true; inner.add(w); }
  const crate = box(.62, .5, .55, red, 0, 1.16, -.65, inner);   // the pizza box carrier
  box(.64, .08, .57, white, 0, 1.43, -.65, inner);
  // rider (separate group, so they can step off)
  const rider = new THREE.Group(); inner.add(rider); rider.position.set(0, .8, -.15);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .45, 3, 8), red); torso.position.y = .45; torso.castShadow = true; rider.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), skin); head.position.y = .98; rider.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8, 0, Math.PI * 2, 0, Math.PI * .55), white); helmet.position.y = 1.0; helmet.castShadow = true; rider.add(helmet);
  const legs = box(.36, .45, .3, mat('#2b3a55'), 0, 0, .12, rider);
  // the pizza box that changes hands
  const pbox = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .5), mat('#f1e6cf', { roughness: .7 })); pbox.castShadow = true; scene.add(pbox);
  const pTop = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3).rotateX(-Math.PI / 2), mat('#d8342a')); pTop.position.y = .052; pbox.add(pTop);
  scene.add(g);
  return { g, inner, rider, legs, pbox };
}

// —— Market: stalls with striped canopies, produce, a milling crowd that steps aside, a crate of oranges spilling ——
const CANOPY = [['#d8342a', '#f6f3ec'], ['#2f6fd0', '#f6f3ec'], ['#3f9a5a', '#f2e6c8'], ['#e9b82c', '#f6f3ec'], ['#e27fb0', '#f6f3ec']];
const PRODUCE = ['#f08c3a', '#e9463a', '#f2d23a', '#6aae42', '#8a3a8f', '#f4f1ea'];
export function marketGeometry({ gBld, gFlat, R, rnd }) {
  const stalls = [];
  for (const side of [-1, 1]) for (let z = MARKET.z0; z < MARKET.z1; z += 7.4) {
    const x = MARKET.x + side * 6.3, w = 2.6, d = 5.6, c = CANOPY[Math.floor(rnd() * CANOPY.length)];
    gFlat.box(x - w / 2, x + w / 2, 0, .9, z, z + d, '#9b7a55', '#9b7a55');                  // table
    for (let k = 0; k < 6; k++) { const px = x + R(-.9, .9), pz = z + .5 + k * .85; const pc = PRODUCE[Math.floor(rnd() * PRODUCE.length)]; gFlat.box(px - .4, px + .4, .9, 1.2, pz - .35, pz + .35, pc, pc); }
    for (const px of [x - w / 2, x + w / 2]) for (const pz of [z, z + d]) gFlat.box(px - .06, px + .06, 0, 2.6, pz - .06, pz + .06, '#5a5a5a', '#5a5a5a');
    for (let k = 0; k < 6; k++) { const zz = z + k * d / 6; gBld.box(x - w / 2 - .25, x + w / 2 + .25, 2.6, 2.75, zz, zz + d / 6, c[k % 2], c[k % 2]); }
    stalls.push([x, z + d / 2]);
  }
  // the crate that tips (east side, mid-market)
  return stalls;
}
export function makeMarket(scene) {
  const rnd = mulberry(23), N = 120, ppl = [];
  for (let i = 0; i < N; i++) {
    const zone = rnd();
    const x = zone < .55 ? MARKET.x + (rnd() - .5) * 7 : MARKET.x + (rnd() < .5 ? -1 : 1) * (8.2 + rnd() * 1.4);
    ppl.push({ x, z: MARKET.z0 + rnd() * (MARKET.z1 - MARKET.z0), ph: rnd() * 10, c: rnd() });
  }
  // the moment the scooter passes each person (to step aside)
  const passT = z => { for (let t = 2; t < 10; t += .02) if (scooterAt(t).z >= z) return t; return 99; };
  for (const p of ppl) p.tp = passT(p.z);
  const g = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(g, patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), N); m.castShadow = true; scene.add(m);
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  ppl.forEach((p, i) => m.setColorAt(i, C.set(PC[Math.floor(p.c * PC.length)])));
  // oranges
  const NO = 36, oranges = [];
  for (let i = 0; i < NO; i++) oranges.push({ a: -Math.PI / 2 + (rnd() - .5) * 2.2, v: 3 + rnd() * 6, d: .5 + rnd() * .5 });
  const om = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), patchCloud(new THREE.MeshStandardMaterial({ color: '#f39a2a', roughness: .5 })), NO); om.castShadow = true; scene.add(om);
  const crate = new THREE.Group(); scene.add(crate);
  box(.9, .6, .9, mat('#b58550'), 0, .3, 0, crate); crate.position.set(MARKET.x + 4.4, .9, 189);
  return {
    draw(t) {
      const s = Sq(t);
      ppl.forEach((p, i) => {
        const wx = p.x + Math.sin(s * .9 + p.ph) * .9, wz = p.z + Math.cos(s * .7 + p.ph * 1.3) * 1.4;
        const sc = scooterAt(t); let dx = 0;
        const near = Math.exp(-(((t - p.tp) / .35) ** 2));
        if (Math.abs(wx - sc.x) < 3.5) dx = Math.sign(wx - sc.x || 1) * 2.6 * near;
        M.compose(P.set(wx + dx, .12, wz), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M);
      });
      m.instanceMatrix.needsUpdate = true;
      // the crate tips at 6.5 and the oranges roll west across the street, slowing
      const tip = smooth(t, T.crate, T.crate + .25);
      crate.rotation.z = tip * 1.4; crate.position.set(MARKET.x + 4.4 - tip * .4, .9 - tip * .55, 189);
      oranges.forEach((o, i) => {
        const age = Math.max(0, t - T.crate - .15) * 1.0, dist = o.v * (1 - Math.exp(-age * 1.1)) / 1.1;
        const x = MARKET.x + 4.0 + Math.cos(o.a) * dist * (age > 0 ? 1 : 0) - (age > 0 ? 0 : 0), z = 189 + Math.sin(o.a + Math.PI / 2) * dist * .7 + (i % 5) * .15;
        const y = age > 0 ? Math.max(.2, .9 - age * 3) : 1.1 + (i % 3) * .2;
        const xx = age > 0 ? MARKET.x + 4 - dist * 1.1 : MARKET.x + 4.4 + (i % 3) * .2 - .2;
        M.compose(P.set(xx, y, age > 0 ? 189 + (o.a + Math.PI / 2) * dist * .5 : 189 + (i % 4) * .2 - .3), Q.identity(), Sc.set(1, 1, 1)); om.setMatrixAt(i, M);
      });
      om.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— The dog ——
export function makeDog(scene) {
  const g = new THREE.Group(), tan = mat('#c58b4a', { roughness: .8 }), wht = mat('#f3ede2', { roughness: .8 }), dk = mat('#3a2a20');
  const k = 2.6; g.scale.setScalar(k);
  const body = box(.32, .32, .8, tan, 0, .48, 0, g);
  const head = box(.3, .3, .32, tan, 0, .72, .48, g); box(.16, .12, .14, wht, 0, .66, .68, g);
  for (const sx of [-1, 1]) box(.07, .14, .07, dk, sx * .11, .9, .44, g);
  const tail = box(.06, .06, .3, tan, 0, .66, -.48, g); tail.rotation.x = -.7;
  const legs = [];
  for (const [lx, lz] of [[-.1, .3], [.1, .3], [-.1, -.3], [.1, -.3]]) { const l = new THREE.Group(); l.position.set(lx, .34, lz); g.add(l); box(.08, .34, .08, tan, 0, -.17, 0, l); legs.push(l); }
  scene.add(g);
  // path: out of the yard, chase alongside/behind, stop and sit at the corner
  return {
    draw(t) {
      const s = Sq(t);
      if (t < T.dog0) { g.position.set(DOG_YARD.x + 1.2, 0, DOG_YARD.z); g.rotation.y = -Math.PI / 2; legs.forEach(l => l.rotation.x = 0); body.rotation.x = 0; return; }
      const sc = scooterAt(Math.max(T.dog0, t - .05));
      const out = smooth(t, T.dog0, T.dog0 + .4);
      let x = lerp(DOG_YARD.x, sc.x + 2.4, out), z = lerp(DOG_YARD.z, sc.z - 2.2, out);
      const stopT = T.dogStop, sitting = t > stopT;
      if (sitting) { const sp = scooterAt(stopT - .05); x = sp.x + 2.4; z = sp.z - 2.2; }
      g.position.set(x, 0, z); g.rotation.y = sitting ? lerp(0, -.5, smooth(t, stopT, stopT + .4)) : 0;
      const run = sitting ? 0 : 1, ph = s * 26;
      legs.forEach((l, i) => l.rotation.x = run * Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? .8 : 0)) * .8);
      g.position.y = run * Math.abs(Math.sin(ph)) * .12;
      body.rotation.x = sitting ? -.35 * smooth(t, stopT, stopT + .3) : 0;
      tail.rotation.x = -.7 + Math.sin(s * 40) * .4;
    },
  };
}

// —— Roadworks: barrier, trench, cones, a digger and a crane ——
export function worksGeometry({ gBld, gFlat }) {
  const z0 = WORKS.z0;
  for (let i = 0; i < 9; i++) { const x = WORKS.x - 6 + i * 1.5; gFlat.box(x, x + 1.3, .3, .9, z0, z0 + .25, i % 2 ? '#f6f3ec' : '#d8342a', i % 2 ? '#f6f3ec' : '#d8342a'); gFlat.box(x + .1, x + .2, 0, .9, z0, z0 + .2, '#555', '#555'); }
  gFlat.box(WORKS.x - 2.2, WORKS.x + 2.2, 1.0, 2.6, z0 + .3, z0 + .45, '#e9b82c', '#e9b82c');   // ROAD CLOSED board (yellow)
  gFlat.box(WORKS.x - 3.5, WORKS.x + 3.5, -1.5, .05, z0 + 6, z0 + 24, '#3d3328', '#3d3328');      // trench
  gFlat.box(WORKS.x - 5.5, WORKS.x - 3.6, .05, .8, z0 + 6, z0 + 24, '#8a6a4a', '#8a6a4a');      // spoil heap
  for (let i = 0; i < 8; i++) gFlat.cyl(WORKS.x + (i % 2 ? 4.6 : -4.6), z0 + 3 + i * 3, .25, 0, .8, '#f07f2c', 6);
}
export function makeWorks(scene) {
  const y = mat('#f2b72e', { roughness: .45 }), dk = mat('#2b2d31'), gl = mat('#14171c', { roughness: .1, metalness: .4 });
  // digger
  const dig = new THREE.Group(); dig.position.set(WORKS.x + 3.2, 0, WORKS.z0 + 14); scene.add(dig);
  box(2.4, .6, 3.2, dk, 0, .3, 0, dig); const cab = new THREE.Group(); cab.position.y = .6; dig.add(cab);
  box(2.2, 1.2, 2.2, y, 0, .6, -.2, cab); box(1.0, 1.0, .9, gl, -.5, 1.6, .2, cab);
  const boom = new THREE.Group(); boom.position.set(.4, 1.0, .9); cab.add(boom); box(.35, .35, 3.2, y, 0, 0, 1.6, boom);
  const stick = new THREE.Group(); stick.position.set(0, 0, 3.2); boom.add(stick); box(.28, .28, 2.2, y, 0, 0, 1.1, stick); box(.7, .5, .5, dk, 0, -.2, 2.2, stick);
  // crane: base truck + slewing boom + hanging pipe
  const cr = new THREE.Group(); cr.position.set(WORKS.x + 8.6, 0, WORKS.z0 + 26); scene.add(cr);
  box(2.6, 1.4, 7, mat('#e9463a'), 0, .9, 0, cr);
  const slew = new THREE.Group(); slew.position.y = 1.7; cr.add(slew); box(1.6, 1.0, 1.8, y, 0, .4, 0, slew);
  const jib = new THREE.Group(); jib.position.y = .9; slew.add(jib); box(.45, .45, 18, y, 0, 0, 9, jib); jib.rotation.x = -.62;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 6, 10), mat('#8a9096', { metalness: .5 })); pipe.rotation.z = Math.PI / 2; pipe.castShadow = true; scene.add(pipe);
  const cable = new THREE.Mesh(new THREE.BoxGeometry(.05, 1, .05), dk); scene.add(cable);
  const tipLocal = V(0, 0, 18), tipW = V();
  return {
    draw(t) {
      const s = Sq(t);
      cab.rotation.y = Math.sin(s * .5) * .9; boom.rotation.x = -.35 + Math.sin(s * .8) * .25; stick.rotation.x = .9 + Math.sin(s * .8 + 1) * .35;
      slew.rotation.y = Math.PI * .75 + Math.sin(s * .25) * .9;
      cr.updateMatrixWorld(true); tipW.copy(tipLocal); jib.localToWorld(tipW);
      const hang = 7 + Math.sin(s * .6) * 2.5; pipe.position.set(tipW.x + Math.sin(s * 1.3) * .4, tipW.y - hang, tipW.z); pipe.rotation.y = s * .3;
      cable.scale.y = hang; cable.position.set(pipe.position.x, tipW.y - hang / 2, pipe.position.z);
    },
  };
}

// —— The parade: a marching band and flag bearers going north on the boulevard; spectators on both pavements ——
export function makeParade(scene) {
  const rows = 16, cols = 5, N = rows * cols + 6;
  const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .6 })), N);
  const hat = new THREE.InstancedMesh(new THREE.CylinderGeometry(.2, .22, .5, 8).translate(0, 1.6, 0), patchCloud(new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: .6 })), N);
  const flag = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1.0).translate(.8, 2.6, 0), patchCloud(new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .7 })), 6);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .5, 14), mat('#f6f3ec')); drum.rotation.z = Math.PI / 2; drum.castShadow = true; scene.add(drum);
  body.castShadow = hat.castShadow = flag.castShadow = true; scene.add(body, hat, flag);
  const FL = ['#e9463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0', '#f07f2c'];
  for (let i = 0; i < N; i++) body.setColorAt(i, C.set(i < 6 ? '#f6f3ec' : (i % 7 === 3 ? '#e9b82c' : '#c8231c')));
  for (let i = 0; i < 6; i++) flag.setColorAt(i, C.set(FL[i]));
  // spectators
  const rnd = mulberry(8), specs = [];
  for (let i = 0; i < 90; i++) specs.push({ x: (rnd() < .5 ? -1 : 1) * (BLVD.h + 1.6 + rnd() * 1.6), z: 360 + rnd() * 120, ph: rnd() * 6, c: rnd() });
  const sp = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), specs.length); sp.castShadow = true; scene.add(sp);
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  specs.forEach((p, i) => sp.setColorAt(i, C.set(PC[Math.floor(p.c * PC.length)])));
  // head position: band clock = real seconds (sim × 18); at 19.5 the middle of the band is at the alley
  const V_MARCH = 1.35, LEN = rows * 1.9 + 8;
  const head = t => { const real = Sq(t) * X_TL, real0 = S(T.real) * X_TL; return ALLEY.z - LEN / 2 + 4 - V_MARCH * (real - real0); };
  return {
    LEN, head,
    draw(t) {
      const on = t > 11 && t < 30, h = head(t), real = Sq(t) * X_TL;
      let k = 0;
      const put = (x, z, step) => { const bob = Math.abs(Math.sin(real * Math.PI * 2 + step)) * .12; M.compose(P.set(x, on ? bob + .05 : -60, z), Q.identity(), Sc.set(1, 1, 1)); body.setMatrixAt(k, M); hat.setMatrixAt(k, M); k++; };
      // front: drum major + 5 flag bearers
      put((PARADE.x0 + PARADE.x1) / 2, h, 0);
      for (let i = 0; i < 5; i++) { const x = lerp(PARADE.x0, PARADE.x1, i / 4), z = h + 3.5; put(x, z, i * .5); M.compose(P.set(x, on ? 0 : -60, z), Q.setFromEuler(E.set(0, Math.sin(real * 2 + i) * .4 + Math.PI / 2, 0)), Sc.set(1, 1, 1)); flag.setMatrixAt(i, M); }
      M.compose(P.set(0, -60, 0), Q.identity(), Sc.set(1, 1, 1)); flag.setMatrixAt(5, M);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) put(lerp(PARADE.x0, PARADE.x1, c / (cols - 1)), h + 7.5 + r * 1.9, (r % 2) * Math.PI / 2);
      drum.position.set((PARADE.x0 + PARADE.x1) / 2, on ? 1.2 : -60, h + 7.5 + rows * 1.9 * .5);
      body.instanceMatrix.needsUpdate = hat.instanceMatrix.needsUpdate = flag.instanceMatrix.needsUpdate = true;
      specs.forEach((p, i) => { const clap = Math.abs(Math.sin(real * 3 + p.ph)) * .08; M.compose(P.set(p.x, .12 + clap, p.z), Q.identity(), Sc.set(1, 1, 1)); sp.setMatrixAt(i, M); });
      sp.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— Pizzeria: walls, striped awning, chimney; "PIZZA" painted on the roof ——
export function pizzeriaGeometry({ gBld, gFlat, building }) {
  const p = PIZZERIA;
  p.h = building(p.x0, p.x1, p.z0, p.z1, 2, { force: true, wall: '#f2dcb6', gable: false, clean: true, ty: 1, bay: 3.2 });
  for (let k = 0; k < 8; k++) { const z = p.door - 6 + k * 1.5; gBld.box(p.x1, p.x1 + 2.2, 3.2, 3.35, z, z + 1.5, k % 2 ? '#f6f3ec' : '#2e8b4a', k % 2 ? '#f6f3ec' : '#2e8b4a'); }   // green-white awning
  gBld.box(p.x1 - .02, p.x1 + .05, 0, 2.6, p.door - 1, p.door + 1, '#5a3a25', '#5a3a25');   // door
  gBld.cyl(p.x0 + 2.4, p.z0 + 3, .55, p.h, p.h + 3.2, '#b26a4e', 10);                          // oven chimney
  for (let k = 0; k < 2; k++) gFlat.box(p.x1 + 2.6, p.x1 + 3.4, 0, .75, p.door + 4 + k * 1.4, p.door + 4.8 + k * 1.4, '#f6f3ec', '#d8342a');   // two little tables
}
export function makeRoofSign(scene, text, cx, cz, w, h, y, rotY, colors = ['#d8342a', '#fbfaf6']) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.font = '900 260px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(512, 270); const tw0 = g.measureText(text).width; g.scale(Math.min(1, 920 / tw0), 1.2);
  g.lineWidth = 24; g.strokeStyle = colors[1]; g.lineJoin = 'round'; g.strokeText(text, 0, 0); g.fillStyle = colors[0]; g.fillText(text, 0, 0); g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), patchCloud(new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
  m.rotation.set(-Math.PI / 2, rotY, 0, 'YXZ'); m.position.set(cx, y, cz); m.receiveShadow = true; scene.add(m); return m;
}

// —— Rain: streaks around the camera's subject, splashes, darker light ——
export function makeRain(scene) {
  const N = 1400, rnd = mulberry(55), drops = [];
  for (let i = 0; i < N; i++) drops.push([rnd() * 2 - 1, rnd() * 2 - 1, rnd(), rnd()]);
  const streak = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(235,242,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(2, 0, 4, h); });
  const sp = makeSprites(scene, N, streak, { additive: false });
  const spl = makeSprites(scene, 260, dotTex(), { additive: false });
  return {
    draw(t, center) {
      const a = rainAmt(t);
      for (let i = 0; i < N; i++) {
        const [u, v, w, k] = drops[i];
        if (k > a) { sp.hide(i); continue; }
        const fall = ((w * 40 - t * 42) % 40 + 40) % 40;
        sp.set(i, center.x + u * 70, fall, center.z + v * 70, .13, 3.2, .9, .94, 1, .72);
      }
      for (let i = 0; i < 260; i++) {
        const [u, v, w] = drops[i * 5];
        const ph = (t * 3 + w * 7) % 1;
        if (a < .05) { spl.hide(i); continue; }
        spl.set(i, center.x + u * 60, .1, center.z + v * 60, .3 + ph * 1.0, .12 + ph * .35, .9, .95, 1, .5 * (1 - ph) * a);
      }
    },
    finish(cam, fog) { sp.commit(fog); spl.commit(fog); },
  };
}

// —— Quay people (some under umbrellas when it rains), the customer on the boat, the rainbow ——
export function makeQuayFolk(scene) {
  const rnd = mulberry(14), folk = [];
  for (let i = 0; i < 40; i++) folk.push({ x: 120 + rnd() * 160, z: QUAY.road1 + 3 + rnd() * 30, ph: rnd() * 8, c: rnd(), open: T.rain0 + .25 + rnd() * .9 });
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), folk.length); m.castShadow = true; scene.add(m);
  const um = new THREE.InstancedMesh(new THREE.ConeGeometry(1.1, .45, 10).translate(0, 2.1, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .5 })), folk.length); um.castShadow = true; scene.add(um);
  folk.forEach((p, i) => { m.setColorAt(i, C.set(PC[Math.floor(p.c * PC.length)])); um.setColorAt(i, C.set(PC[Math.floor((p.c * 7) % 1 * PC.length)])); });
  // the customer, on the boat
  const cust = new THREE.Group(); scene.add(cust);
  const cb = new THREE.Mesh(new THREE.CapsuleGeometry(.36, .8, 3, 8).translate(0, .78, 0), mat('#2f6fd0')); cb.castShadow = true; cust.add(cb);
  const ch = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), mat('#e2b48c')); ch.position.y = 1.55; cust.add(ch);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8, 0, Math.PI * 2, 0, Math.PI * .5), mat('#3a2a20')); hair.position.y = 1.6; cust.add(hair);
  // the customer's boat (a small white motor cruiser)
  const boat = new THREE.Group(); scene.add(boat); boat.position.set(BOAT.x, -.6, BOAT.z); boat.rotation.y = Math.PI / 2;
  box(9, 1.3, 3.2, mat('#f6f6f2', { roughness: .4 }), 0, .1, 0, boat); box(9.05, .25, 3.25, mat('#1f4f9a'), 0, -.25, 0, boat); box(3.4, 1.1, 2.4, mat('#f6f6f2'), -1.2, 1.3, 0, boat);
  box(5.0, .05, 2.9, mat('#b98a5a'), 2.0, .78, 0, boat);
  cust.position.set(BOAT.x, .2, BOAT.z - 1.3);
  // rainbow (big arc standing on the sea)
  const rb = canvasTex(1024, 512, (g, w, h) => {
    const cols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5e5ce6', '#bf5af2'];
    cols.forEach((c, i) => { g.beginPath(); g.lineWidth = 10; g.strokeStyle = c; g.globalAlpha = .8; g.arc(w / 2, h, h * .9 - i * 9, Math.PI, 0); g.stroke(); });
    g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.25, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const rbm = new THREE.MeshBasicMaterial({ map: rb, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const rainbow = new THREE.Mesh(new THREE.PlaneGeometry(440, 220), rbm); rainbow.position.set(195, -25, 575); scene.add(rainbow);
  return {
    rainbow,
    draw(t, cam) {
      const s = Sq(t), a = rainAmt(t);
      folk.forEach((p, i) => {
        const x = p.x + Math.sin(s * .8 + p.ph) * 3, z = p.z + Math.cos(s * .6 + p.ph) * 2;
        M.compose(P.set(x, .1, z), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M);
        const o = back(seg(t, p.open, p.open + .25), 2.2) * (1 - seg(t, T.rain1 + .2 + p.c * .6, T.rain1 + .5 + p.c * .6));
        M.compose(P.set(x, .1, z), Q.identity(), Sc.set(Math.max(.001, o), Math.max(.001, o), Math.max(.001, o))); um.setMatrixAt(i, M);
      });
      m.instanceMatrix.needsUpdate = um.instanceMatrix.needsUpdate = true;
      const joy = t > T.hand + .25 ? Math.abs(Math.sin((t - T.hand - .25) * 7)) * .35 * (1 - seg(t, T.hand + 1.6, T.hand + 2.2)) : 0;
      cust.position.y = .2 + joy; boat.position.y = -.6 + Math.sin(s * 2 + 1) * .05 + (t > 41 ? Math.sin(t * 1.6) * .05 : 0);
      rbm.opacity = .55 * smooth(t, T.rainbow, T.rainbow + 1.8);
      if (cam) rainbow.lookAt(cam.position.x, rainbow.position.y, cam.position.z);
    },
  };
}
