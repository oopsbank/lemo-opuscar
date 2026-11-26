// The Phantom Jam — the boulevard traffic from the sim (tail lights from braking), the yellow car, the culprit, the ambulance,
// oncoming traffic, side-street queues, the hospital, walkers, and the yellow cat on a roof (the hidden detail)
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, mulberry, hash } from '/core/lib.js';
import { SIM, IDX, N, Sq, sim8, T, BRAKE2_IDX } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export function mat(color, o = {}) { const m = patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o })); return m; }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

export const LANE_X = -3.8;
export const HOSPITAL = { x0: -64, x1: -18, z0: 566, z1: 612, h: 12, bay: V(-13.5, 0, 592) };
export const EXCL = [[HOSPITAL.x0 - 6, HOSPITAL.x1 + 4, HOSPITAL.z0 - 6, HOSPITAL.z1 + 6]];

export function hospitalGeometry(b) {
  const h = HOSPITAL;
  b.gBld.box(h.x0, h.x1, 0, h.h, h.z0, h.z1, '#f4f2ee', '#d8d4cc', { facade: true, wp: [3.2, 3.4, 1000 + 88] });
  b.gBld.box(h.x1 - .1, h.x1 + 3.5, 0, 3.6, h.z0 + 18, h.z0 + 34, '#f4f2ee', '#c7302a');   // entrance canopy
  b.gFlat.flat(-12, h.x1, h.z0 + 16, h.z0 + 36, .13, '#cfc9bd');                               // forecourt
  // red cross on the roof
  b.gFlat.box(h.x0 + 6, h.x0 + 18, h.h, h.h + .1, h.z0 + 19, h.z0 + 23, '#d8342a', '#d8342a');
  b.gFlat.box(h.x0 + 10, h.x0 + 14, h.h, h.h + .1, h.z0 + 15, h.z0 + 27, '#d8342a', '#d8342a');
}
export function makeRoofSign(scene, text, cx, cz, w, h, y, rotY, colors) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.font = '900 260px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(512, 270); const tw0 = g.measureText(text).width; g.scale(Math.min(1, 920 / tw0), 1.2);
  g.lineWidth = 24; g.strokeStyle = colors[1]; g.lineJoin = 'round'; g.strokeText(text, 0, 0); g.fillStyle = colors[0]; g.fillText(text, 0, 0); g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  m.rotation.set(-Math.PI / 2, rotY, 0, 'YXZ'); m.position.set(cx, y, cz); m.receiveShadow = true; scene.add(m); return m;
}

// —— where each boulevard car is, and whether its brake lights are on ——
export function carAt(i, t) {
  const st = sim8(t), z = SIM.pos(i, st), v = SIM.vel(i, st);
  return { x: LANE_X, z, v, brake: SIM.brake(i, st) };
}
const MUTED = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#3f8f5b', '#a83a2f', '#e9e4d8'];
export function makeTraffic(scene) {
  const NO = 70, n = N + NO + 40;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  const tail = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .28, .12).translate(0, 1.05, -2.25), new THREE.MeshBasicMaterial({ color: '#fff' }), n);
  for (const m of [body, cab]) { m.castShadow = true; m.receiveShadow = true; }
  for (const m of [body, cab, tail]) { m.frustumCulled = false; scene.add(m); }
  const rnd = mulberry(31);
  for (let i = 0; i < n; i++) body.setColorAt(i, C.set(MUTED[Math.floor(rnd() * MUTED.length)]));
  body.setColorAt(IDX.hero, C.set('#ffc21a')); body.setColorAt(IDX.culprit, C.set('#e85fa8')); body.setColorAt(BRAKE2_IDX, C.set('#7a3fc4'));
  // oncoming (northbound) lane: free flow; side-street queues at the two junctions
  const onc = Array.from({ length: NO }, (_, k) => ({ s0: k * 9.4 + rnd() * 4 }));
  let k = 0;
  const put = (x, z, yaw, lit, sc = 1) => { Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, 0, z), Q, Sc.set(sc, sc, sc)); body.setMatrixAt(k, M); cab.setMatrixAt(k, M); tail.setMatrixAt(k, M); tail.setColorAt(k, C.setRGB(lit ? 4 : .35, lit ? .25 : .03, lit ? .15 : .03)); k++; };
  return {
    draw(t) {
      k = 0;
      for (let i = 0; i < N; i++) {
        if (i === IDX.ambulance) { put(0, -999, 0, 0); continue; }
        const c = carAt(i, t); put(c.x, c.z, 0, c.brake);
      }
      const s = sim8(t);
      for (const o of onc) { const span = 640; let u = (o.s0 + s * 12.5) % span; const z = 620 - u; put(3.8, z, Math.PI, 0); }
      // side-street queues: grow while the boulevard is stopped near the junction
      for (const [jz, side] of [[520, -1], [520, 1], [260, -1], [260, 1]]) {
        let stopped = 0; for (let i = 0; i < N; i++) { const c = carAt(i, t); if (Math.abs(c.z - jz) < 45 && c.v < .8) stopped++; }
        const q = Math.min(8, Math.round(stopped * 1.6));
        for (let j = 0; j < 8; j++) { const x = side * (14 + j * 6.8); if (j < q) put(x, jz + (side < 0 ? 3.4 : -3.4), side < 0 ? Math.PI / 2 : -Math.PI / 2, 1); else put(0, -999, 0, 0); }
      }
      for (const m of [body, cab, tail]) { m.count = k; m.instanceMatrix.needsUpdate = true; }
      tail.instanceColor.needsUpdate = true;
    },
  };
}

// —— the ambulance: white, red band, flashing blue bar; pulls into the hospital bay when it gets there ——
export function makeAmbulance(scene) {
  const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.15);
  const white = mat('#f7f7f4', { roughness: .4 }), red = mat('#d8342a'), dark = mat('#14171c', { roughness: .15, metalness: .4 });
  box(2.2, 2.3, 5.6, white, 0, 1.55, -.4, i); box(2.22, .35, 5.62, red, 0, 1.4, -.4, i); box(2.1, .8, .08, dark, 0, 2.1, 2.42, i);
  const blue = new THREE.MeshStandardMaterial({ color: '#2a5cff', emissive: '#2a6cff', emissiveIntensity: 0 });
  box(1.6, .22, .4, blue, 0, 2.85, 1.9, i);
  for (const [x, z] of [[-1, 1.5], [1, 1.5], [-1, -2.2], [1, -2.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 10), mat('#1d1d1f')); w.rotation.z = Math.PI / 2; w.position.set(x, .42, z); i.add(w); }
  // a red cross on the roof
  box(1.4, .05, .4, red, 0, 2.72, -.6, i); box(.4, .05, 1.4, red, 0, 2.72, -.6, i);
  scene.add(g);
  return {
    draw(t) {
      const st = sim8(t);
      if (t < T.arrive) { const z = SIM.pos(IDX.ambulance, st); g.position.set(LANE_X, 0, z); g.rotation.y = 0; }
      else { const u = eio(seg(t, T.arrive, T.arrive + 2.2)); g.position.set(lerp(LANE_X, HOSPITAL.bay.x, u), 0, lerp(588 - 1, HOSPITAL.bay.z, u)); g.rotation.y = -Math.sin(u * Math.PI) * .9 - (u > .5 ? 0 : 0); }
      blue.emissiveIntensity = Math.floor(t * 7) % 2 ? 7 : .3;
    },
    pos: () => g.position,
  };
}

// —— walkers on the pavements ——
export function makeWalkers(scene) {
  const rnd = mulberry(12), W = [];
  for (let i = 0; i < 420; i++) {
    const side = rnd() < .5 ? -1 : 1;
    if (rnd() < .4) { const z = lerp(-20, 625, rnd()), hw = z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : 7; W.push({ axis: 'z', c: side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -20, hi: 625 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; W.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, rnd()), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460 }); }
  }
  const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), W.length); m.castShadow = true; m.frustumCulled = false;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  for (let i = 0; i < W.length; i++) m.setColorAt(i, C.set(PC[Math.floor(rnd() * PC.length)]));
  scene.add(m);
  return { draw(t) { const s = Sq(t); W.forEach((w, i) => { const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s * 3) % span; if (u < 0) u += span; const p = w.lo + u; M.compose(P.set(w.axis === 'z' ? w.c : p, .12, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M); }); m.instanceMatrix.needsUpdate = true; } };
}

// —— the yellow cat, asleep on the hospital roof (the channel's hidden detail) ——
export function makeCat(scene) {
  const g = new THREE.Group(), y = mat('#f2b72e', { roughness: .8 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .7, 4, 8), y); b.rotation.z = Math.PI / 2; b.position.y = .35; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y); h.position.set(.62, .45, 0); g.add(h);
  for (const z of [-.13, .13]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 4), y); e.position.set(.66, .76, z); g.add(e); }
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 5), y); tl.rotation.z = 1.2; tl.position.set(-.75, .3, .1); g.add(tl);
  g.scale.setScalar(1.4); g.position.set(HOSPITAL.x1 - 4, HOSPITAL.h + .05, HOSPITAL.z0 + 5); g.rotation.y = .6;
  g.traverse(o => { o.castShadow = true; }); scene.add(g);
}
