// Two Tugs — the cruise ship, the red and blue tugs on lines, the sailboat, prop wash and wakes, the crowd on the quay, the cat
import * as THREE from 'three';
import { patchCloud, QUAY, STATION } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';
import { SHIP, QZ, dBow, dStern, pullRed, pullBlue, T } from './story.js';
import { makeSprites, dotTex, puffTex, canvasTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export const mat = (color, o = {}) => patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o }));
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }
export const EXCL = [];
const WL = -.9;   // the water line

// —— the ship's pose: centre z and yaw from the bow and stern distances ——
export function shipPose(t) {
  const b = dBow(t), s = dStern(t), L = SHIP.len * .9;
  const zc = QZ + SHIP.half + (b + s) / 2, yaw = Math.atan2(s - b, L);   // bow nearer the quay → rotation.y > 0 (the bow (+x) swings to −z)
  return { x: SHIP.x, z: zc, yaw };
}
// a point on the ship in its local frame (x along, z across; +z = seaward side) to world
export function shipPoint(t, lx, ly, lz) { const p = shipPose(t); return V(lx, ly, lz).applyAxisAngle(V(0, 1, 0), p.yaw).add(V(p.x, 0, p.z)); }

function hullTex() {
  return canvasTex(2048, 256, (g, w, h) => {
    g.fillStyle = '#e4e0d6'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let x = 30; x < w - 30; x += 22) { g.fillStyle = r === 3 ? '#20304a' : '#2b3e5c'; g.fillRect(x, 26 + r * 40, 14, r === 3 ? 10 : 16); }
    g.fillStyle = '#1d4c9e'; g.fillRect(0, h - 70, w, 70); g.fillStyle = '#c23b2b'; g.fillRect(0, h - 18, w, 18);
    g.font = '900 64px Overpass'; g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.fillText('POCKET STAR', w - 560, 70);
  });
}
export function makeShip(scene) {
  const g = new THREE.Group(); scene.add(g);
  const L = SHIP.len, B = SHIP.beam, tex = hullTex(); tex.anisotropy = 8;
  const hullMat = [mat('#e4e0d6'), mat('#e4e0d6'), mat('#dcd8ce'), mat('#1d4c9e'), new THREE.MeshStandardMaterial({ map: tex, roughness: .5 }), new THREE.MeshStandardMaterial({ map: tex, roughness: .5 })];
  const hull = new THREE.Mesh(new THREE.BoxGeometry(L - 22, 12, B), hullMat); hull.position.y = WL + 6 - 2; hull.castShadow = hull.receiveShadow = true; g.add(hull);
  // bow wedge
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(B / 2, B / 2, 12, 3, 1, false, 0, Math.PI), mat('#e4e0d6')); bow.scale.set(1.6, 1, 1); bow.rotation.y = 0; bow.position.set((L - 22) / 2, WL + 4, 0); bow.castShadow = true; g.add(bow);
  const sternB = box(4, 12, B, mat('#e4e0d6'), -(L - 22) / 2 - 2, WL + 4, 0, g);
  // decks: stepping superstructure with balcony bands, lifeboats, funnel, pool
  const white = mat('#e8e4da'), glass = mat('#22324c', { roughness: .15, metalness: .4 }), orange = mat('#f07f2c'), blueM = mat('#3fa5d8', { roughness: .1 }), red = mat('#c8322a');
  for (let k = 0; k < 6; k++) {
    const len = L * (.78 - k * .07), y = WL + 10 + k * 3, x0 = -6 - k * 2;
    box(len, 3, B - 2 - k * .6, white, x0, y + 1.5, 0, g);
    box(len - 1, .9, B - 1.7 - k * .6, glass, x0, y + 1.8, 0, g);
  }
  for (let i = 0; i < 10; i++) for (const s of [-1, 1]) box(7, 2.2, 2.4, orange, -60 + i * 13, WL + 12.2, s * (B / 2 - .6), g);
  box(26, .4, 9, blueM, -28, WL + 28.2, 0, g);
  const fun = box(10, 9, 7, red, -50, WL + 33, 0, g); box(10.2, 1.2, 7.2, white, -50, WL + 35.5, 0, g);
  box(8, 6, B - 6, white, 58, WL + 30, 0, g);   // bridge
  box(9, 1.2, B + 4, white, 58, WL + 32.4, 0, g);   // bridge wings
  // passengers along the top deck rail
  const n = 120, pm = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .6, 2, 5).translate(0, .6, 0), mat('#ffffff'), n); pm.castShadow = true;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'], rnd = mulberry(4);
  for (let i = 0; i < n; i++) { M.compose(P.set(-70 + rnd() * 120, WL + 28, (rnd() < .5 ? -1 : 1) * (B / 2 - 3.5 - rnd() * 1.2)), Q.identity(), Sc.set(1, 1, 1)); pm.setMatrixAt(i, M); pm.setColorAt(i, C.set(PC[Math.floor(rnd() * PC.length)])); }
  g.add(pm);
  return { g, draw(t) { const p = shipPose(t); g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw; g.position.y = Math.sin(t * .6) * .08; } };
}

// —— a tug: hull, cabin, tyre fenders, mast lights; it pulls a line from the ship ——
function makeTugMesh(scene, color) {
  const g = new THREE.Group(), i = new THREE.Group(); g.add(i);
  const c = mat(color, { roughness: .4 }), white = mat('#fbfaf6'), dark = mat('#1d1f22'), glass = mat('#2b3e5c', { roughness: .1, metalness: .4 });
  box(5.4, 2.6, 14, c, 0, WL + 1.4, 0, i);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 2.6, 3, 1, false, 0, Math.PI), c); nose.rotation.y = Math.PI / 2; nose.scale.set(1, 1, 1.3); nose.position.set(0, WL + 1.4, 7); i.add(nose);
  box(5.6, .4, 14.2, dark, 0, WL + 2.7, 0, i);   // rubbing strake
  box(3.8, 2.6, 4.4, white, 0, WL + 4.1, 1.2, i); box(3.9, .9, 4.5, glass, 0, WL + 4.6, 1.2, i);
  box(3.2, 1.8, 3.0, white, 0, WL + 6.2, 1.6, i); box(3.3, .7, 3.1, glass, 0, WL + 6.5, 1.6, i);
  box(.9, 2.6, .9, c, 0, WL + 8.4, .6, i); box(1.0, .5, 1.0, dark, 0, WL + 9.8, .6, i);   // funnel
  box(1.4, 1.2, 1.4, dark, 0, WL + 3.4, -5.4, i);   // towing winch at the stern
  for (let k = 0; k < 6; k++) box(.6, .6, 1.6, dark, (k % 2 ? 1 : -1) * 2.9, WL + 1.6, -4 + Math.floor(k / 2) * 4, i);
  scene.add(g); return g;
}
// tug pose: approach from the open sea, swing round, then sit on its line astern (pulling away from the ship, facing south)
function tugPose(t, which) {
  const lx = which === 'red' ? 74 : -78, tArr = which === 'red' ? T.red : T.blue, pull = which === 'red' ? pullRed(t) : pullBlue(t);
  const bitt = shipPoint(t, lx, 0, SHIP.half + 1);
  const slack = which === 'red' ? 1 - ss(seg(t, T.sail0 + .9, T.sail0 + 1.4)) * (1 - ss(seg(t, T.sail1 - .8, T.sail1))) : 1;
  const Lline = 34 + 6 * (pull / 100) * slack;
  const hold = bitt.clone().add(V((which === 'red' ? 6 : -6) + Math.sin(t * .9 + (which === 'red' ? 0 : 2)) * 1.5, 0, Lline + 7));
  const start = V(which === 'red' ? 300 : -260, 0, which === 'red' ? 1060 : 1150);
  const u = which === 'red' ? eo(seg(t, tArr - 7.5, tArr + .4)) : eio(seg(t, tArr - 4, tArr + .4));
  let pos = start.clone().lerp(hold, u), yaw;
  // heading: toward the ship while arriving (facing north/−z), then turned to face the open sea (+z) to pull
  const turn = ss(seg(t, tArr - .6, tArr + .9));
  yaw = lerp(Math.PI, 0, turn) + (which === 'red' ? .15 : -.15) * turn;
  if (which === 'blue' && t > T.snap && t < T.reconnect) { const k = ss(seg(t, T.snap, T.snap + 1.5)) * (1 - ss(seg(t, T.reconnect - 1.6, T.reconnect))); pos.add(V(0, 0, 14 * k)); yaw += .6 * Math.sin(Math.PI * seg(t, T.snap, T.reconnect)); }
  return { pos, yaw, bitt, pull: pull * slack };
}
export function makeTugs(scene) {
  const red = makeTugMesh(scene, '#d8342a'), blue = makeTugMesh(scene, '#2f6fd0');
  // lines: 8 segments each (a sagging catenary when slack)
  const seg8 = 10, lineM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .14, 1, 5).rotateX(Math.PI / 2), mat('#e8dcc0', { roughness: .8 }), seg8 * 3); lineM.castShadow = true; lineM.frustumCulled = false; scene.add(lineM);
  const pose = { red: null, blue: null };
  function drawLine(k0, a, b, tension, vis) {
    for (let k = 0; k < seg8; k++) {
      if (!vis) { M.makeScale(0, 0, 0); lineM.setMatrixAt(k0 + k, M); continue; }
      const f0 = k / seg8, f1 = (k + 1) / seg8, sag = (1 - tension) * 7;
      const p0 = a.clone().lerp(b, f0); p0.y -= sag * 4 * f0 * (1 - f0); const p1 = a.clone().lerp(b, f1); p1.y -= sag * 4 * f1 * (1 - f1);
      const mid = p0.clone().add(p1).multiplyScalar(.5), d = p1.clone().sub(p0), len = d.length();
      Q.setFromUnitVectors(V(0, 0, 1), d.normalize()); M.compose(mid, Q, Sc.set(1, 1, len)); lineM.setMatrixAt(k0 + k, M);
    }
  }
  return {
    draw(t) {
      for (const [w, g] of [['red', red], ['blue', blue]]) {
        const p = tugPose(t, w); pose[w] = p;
        g.position.copy(p.pos); g.rotation.y = p.yaw;
        g.rotation.z = Math.sin(t * 1.7 + (w === 'red' ? 0 : 1)) * .03; g.rotation.x = -(p.pull / 100) * .05 + Math.sin(t * 1.3) * .02;
        g.position.y = Math.sin(t * 2.1 + (w === 'red' ? 0 : 1.4)) * .12;
      }
      // red line (connected from its arrival); blue: snapped at T.snap (the ship end whips and drops), a new one from T.reconnect
      const tow = w => pose[w].pos.clone().add(V(-Math.sin(pose[w].yaw) * 5.4, WL + 3.6, -Math.cos(pose[w].yaw) * 5.4));
      const bitt = w => pose[w].bitt.clone().setY(WL + 9);
      drawLine(0, bitt('red'), tow('red'), pullRed(t) > 20 ? clamp(pose.red.pull / 70) : 0, t > T.red + .2);
      const bv = t > T.blue + .2 && (t < T.snap || t > T.reconnect);
      drawLine(seg8, bitt('blue'), tow('blue'), clamp(pose.blue.pull / 70), bv);
      // the snapped end: falls from the ship into the water
      const fall = t >= T.snap && t < T.snap + 2.5;
      if (fall) { const k = seg(t, T.snap, T.snap + 1.2); const a = bitt('blue'), b = a.clone().add(V(0, -9 * k * k, 14 * (1 - k * .5))); b.y = Math.max(WL, b.y); drawLine(seg8 * 2, a, b, .2, true); } else drawLine(seg8 * 2, V(), V(), 0, false);
      lineM.instanceMatrix.needsUpdate = true;
    },
    pose,
  };
}

// —— the sailboat that cuts across red's line ——
export function makeSailboat(scene) {
  const g = new THREE.Group(); scene.add(g);
  box(2.2, 1, 8, mat('#fbfaf6'), 0, WL + .4, 0, g);
  const sail = new THREE.Mesh(new THREE.BufferGeometry(), mat('#fbfaf6', { side: THREE.DoubleSide }));
  sail.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, WL + 1, -3, 0, WL + 11, 0, 0, WL + 1, 2.6], 3)); sail.geometry.computeVertexNormals(); sail.castShadow = true; g.add(sail);
  const jib = new THREE.Mesh(new THREE.BufferGeometry(), mat('#e8463a', { side: THREE.DoubleSide }));
  jib.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, WL + 1, 2.8, 0, WL + 9, .2, 0, WL + 1, 4], 3)); jib.geometry.computeVertexNormals(); g.add(jib);
  return {
    draw(t) {
      const u = seg(t, T.sail0 - 1.5, T.sail1 + 1.5); g.visible = u > 0 && u < 1;
      const z = shipPoint(t, 74, 0, SHIP.half).z + 20; g.position.set(lerp(260, -10, u), Math.sin(t * 2) * .1, z); g.rotation.y = -Math.PI / 2; g.rotation.z = .18;
    },
    pos: () => g.position,
  };
}

// —— prop wash (tugs pulling) and bow waves: foam sprites ——
export function makeFoam(scene) {
  const N = 900, sp = makeSprites(scene, N, dotTex(), { additive: false }), rnd = mulberry(9), seeds = Array.from({ length: N }, () => [rnd(), rnd(), rnd()]);
  return {
    draw(t, tugs) {
      let i = 0;
      for (const w of ['red', 'blue']) {
        const p = tugs.pose[w]; if (!p) continue;
        const k = clamp(p.pull / 100), arr = t < (w === 'red' ? T.red : T.blue) + .5;
        const back = V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));   // the wash goes out astern, toward the ship
        for (let j = 0; j < 260; j++, i++) {
          const [a, b, c] = seeds[i], life = (a + t * (1.2 + k)) % 1, spread = 1.5 + life * 7;
          const d = arr ? -life * 30 : 6 + life * (10 + 22 * k);   // arriving: a wake behind it; pulling: a jet of white water toward the ship
          const q = p.pos.clone().addScaledVector(back, d).add(V((b - .5) * spread, 0, (c - .5) * spread * .6));
          const s = (1.2 + life * 3) * (arr ? 1 : .5 + k);
          sp.set(i, q.x, WL + .08, q.z, s, s * .55, .96, .97, .98, (1 - life) * (arr ? .6 : .2 + .55 * k), b * 6);
        }
      }
      // a white rim along the ship's quay-side waterline (it is pushing water ahead of it)
      for (let j = 0; j < 260; j++, i++) {
        const [a, b] = seeds[i], lx = -SHIP.len / 2 + a * SHIP.len, q = shipPoint(t, lx, 0, -SHIP.half - .8 - b * 2.5);
        sp.set(i, q.x, WL + .06, q.z, 2.2, 1.0, .96, .97, .98, .35 * (.5 + .5 * Math.sin(t * 3 + a * 40)), 0);
      }
      for (; i < N; i++) sp.hide(i);
      sp.commit(scene.fog);
    },
  };
}

// —— the crowd on the quay watching (they step back as the ship gets close) and the yellow cat ——
export function makeQuayCrowd(scene) {
  const rnd = mulberry(23), F = [];
  for (let i = 0; i < 160; i++) F.push({ x: -70 + rnd() * 260, z: QZ - 2 - rnd() * 14, c: Math.floor(rnd() * 9), ph: rnd() * 9 });
  const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), F.length); m.castShadow = true; m.frustumCulled = false;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  F.forEach((f, i) => m.setColorAt(i, C.set(PC[f.c]))); scene.add(m);
  // fenders on the quay edge: big black tyres
  const fen = new THREE.InstancedMesh(new THREE.TorusGeometry(.9, .45, 6, 10), mat('#1d1f22'), 18); fen.castShadow = true;
  for (let i = 0; i < 18; i++) { M.compose(P.set(-30 + i * 11, -.6, QZ + .5), Q.identity(), Sc.set(1, 1, 1)); fen.setMatrixAt(i, M); } scene.add(fen);
  return {
    draw(t, gap) {
      const back = clamp((12 - gap) / 10) * 5;
      F.forEach((f, i) => { const hop = gap < 2.3 && t > 25.6 ? Math.max(0, Math.sin(t * 9 + f.ph)) * .4 : 0; M.compose(P.set(f.x + Math.sin(t * .8 + f.ph) * .3, .1 + hop, f.z - back * (f.z > QZ - 8 ? 1 : .3)), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M); });
      m.instanceMatrix.needsUpdate = true;
    },
  };
}
export function makeCat(scene) {
  const g = new THREE.Group(), y = mat('#f2b72e', { roughness: .8 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .7, 4, 8), y); b.rotation.z = Math.PI / 2; b.position.y = .35; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y); h.position.set(.62, .45, 0); g.add(h);
  for (const z of [-.13, .13]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 4), y); e.position.set(.66, .76, z); g.add(e); }
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 5), y); tl.rotation.z = 1.2; tl.position.set(-.75, .3, .1); g.add(tl);
  g.scale.setScalar(1.4); g.traverse(o => { o.castShadow = true; }); scene.add(g);
  return g;
}
