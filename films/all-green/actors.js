// All Green — the grid traffic from the sim (brake lights, hazards on the crash), the traffic lights, Engine 9 and its door,
// the tow truck (it drags the crashed car away), walkers, and the yellow cat on the fire station roof
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, STATION, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, mulberry } from '/core/lib.js';
import { LEN, JUNCS, LANE, world, greenFix, greenNS } from './grid.js';
import { SIM, sim, FIXED, flipAt, TOW, T_ROLL } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o })); }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }
export const EXCL = [];
const laneYaw = L => (L.axis === 'z' ? 0 : Math.PI / 2) + (L.dir < 0 ? Math.PI : 0);

// where a sim car is drawn: its centre, yaw, speed (null when not alive at that sim time)
const CRASH_A = SIM.locks.find(K => K.kind === 'crashA').car, CRASH_B = SIM.locks.find(K => K.kind === 'crashB').car;
export function carPose(c, s) {
  const st = SIM.state(c, s); if (!st) return null;
  const w = world(st.L, st.s - LEN / 2); let x = w.x, z = w.z, yaw = laneYaw(st.L);
  if (c.turnT != null && s >= c.turnT && s - c.turnT < 1.4) {   // the right turn from NB0 into EB120: blend along an arc
    const u = ss((s - c.turnT) / 1.4), y0 = Math.PI; x = lerp(c.turnP.x, x, u); z = lerp(c.turnP.z, z, u * u); yaw = lerp(y0, yaw, u);
  }
  // the crash: a small bump (squash) and a nudge when they meet
  return { x, z, yaw, v: st.v, L: st.L };
}

const MUTED = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#3f8f5b', '#a83a2f', '#e9e4d8', '#f4f4f2', '#c9ccd0'];
export function makeTraffic(scene) {
  const cars = SIM.cars.filter(c => c.kind !== 'engine'), n = cars.length;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, LEN).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  const tail = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .28, .12).translate(0, 1.05, -2.25), new THREE.MeshBasicMaterial({ color: '#fff' }), n);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, .22, .1).translate(0, 1.0, 2.24), new THREE.MeshBasicMaterial({ color: '#fff' }), n);
  for (const m of [body, cab]) { m.castShadow = true; m.receiveShadow = true; }
  for (const m of [body, cab, tail, head]) { m.frustumCulled = false; scene.add(m); }
  const rnd = mulberry(31);
  cars.forEach((c, i) => body.setColorAt(i, C.set(MUTED[Math.floor(rnd() * MUTED.length)])));
  body.setColorAt(cars.indexOf(CRASH_A), C.set('#e85fa8')); body.setColorAt(cars.indexOf(CRASH_B), C.set('#3d7bff'));
  const iB = cars.indexOf(CRASH_B);
  return {
    draw(t, s, towPose) {
      let k = 0;
      const put = (x, z, yaw, lit, haz, sq = 1) => {
        Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, 0, z), Q, Sc.set(1, sq, 1)); body.setMatrixAt(k, M); cab.setMatrixAt(k, M); tail.setMatrixAt(k, M); head.setMatrixAt(k, M);
        const hz = haz && Math.floor(t * 3) % 2;
        tail.setColorAt(k, hz ? C.setRGB(4, 1.6, .2) : C.setRGB(lit ? 4 : .35, lit ? .25 : .03, lit ? .15 : .03));
        head.setColorAt(k, hz ? C.setRGB(4, 1.6, .2) : C.setRGB(.9, .9, .85)); k++;
      };
      cars.forEach((c, i) => {
        if (i === iB && s >= TOW.go && towPose) { put(towPose.bx, towPose.bz, towPose.byaw, 0, 1); return; }
        const p = carPose(c, s);
        if (!p) { M.makeScale(0, 0, 0); body.setMatrixAt(k, M); cab.setMatrixAt(k, M); tail.setMatrixAt(k, M); head.setMatrixAt(k, M); k++; return; }
        const crash = c === CRASH_A || c === CRASH_B, hit = crash && s > 3 && s < 70.5;
        const sq = crash ? 1 - .12 * Math.exp(-Math.max(0, s - 4.2) * 3) * (s > 4.2 ? 1 : 0) : 1;
        put(p.x, p.z, p.yaw + (hit ? (c === CRASH_A ? .18 : -.12) * ss(seg(s, 4.0, 4.6)) : 0), p.v < 1.2, hit, sq);
      });
      for (const m of [body, cab, tail, head]) { m.count = k; m.instanceMatrix.needsUpdate = true; }
      tail.instanceColor.needsUpdate = true; head.instanceColor.needsUpdate = true;
    },
  };
}

// —— traffic lights: four poles per junction, each with a head toward the NS approach and one toward the EW approach ——
export function lightState(J, axis, s, engineS) {
  if (s < flipAt(J)) return (axis === 'z') === greenNS(J, s) ? 'g' : 'r';
  if (s < FIXED[J.id]) return 'g';
  if (engineS != null && J.x === 0) return axis === 'z' ? 'g' : 'r';   // pre-emption for Engine 9
  return (axis === 'z') === greenFix(J, s) ? 'g' : 'r';
}
export function makeLights(scene) {
  const poles = [], heads = [];
  for (const J of JUNCS) for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = J.x + sx * (J.hx + 1.2), z = J.z + sz * (J.hz + 1.2); poles.push([x, z]);
    heads.push({ J, axis: 'z', x, z: z + (sz < 0 ? .1 : -.1), y: 5.4, face: sz < 0 ? Math.PI : 0 });     // faces traffic coming along z toward it
    heads.push({ J, axis: 'x', x: x + (sx < 0 ? .1 : -.1), z, y: 4.6, face: sx < 0 ? -Math.PI / 2 : Math.PI / 2 });
  }
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .16, 6.2, 6).translate(0, 3.1, 0), patchCloud(new THREE.MeshStandardMaterial({ color: '#3b3f45', roughness: .6 })), poles.length);
  poles.forEach(([x, z], i) => { M.compose(P.set(x, 0, z), Q.identity(), Sc.set(1, 1, 1)); pole.setMatrixAt(i, M); }); pole.castShadow = true; scene.add(pole);
  const hb = new THREE.InstancedMesh(new THREE.BoxGeometry(.7, 2.0, .6), patchCloud(new THREE.MeshStandardMaterial({ color: '#202327', roughness: .5 })), heads.length);
  const lamp = new THREE.InstancedMesh(new THREE.SphereGeometry(.34, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff' }), heads.length * 2);
  const glow = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: .28, depthWrite: false, blending: THREE.AdditiveBlending }), heads.length);
  heads.forEach((h, i) => { Q.setFromEuler(E.set(0, h.face, 0)); M.compose(P.set(h.x, h.y, h.z), Q, Sc.set(1, 1, 1)); hb.setMatrixAt(i, M); });
  hb.castShadow = true; lamp.frustumCulled = false; glow.frustumCulled = false; scene.add(hb, lamp, glow);
  return {
    draw(t, s, engineS) {
      heads.forEach((h, i) => {
        const st = lightState(h.J, h.axis, s, engineS);
        const fwd = V(Math.sin(h.face), 0, Math.cos(h.face));
        for (const [k, yOff, col] of [[0, .5, 'r'], [1, -.5, 'g']]) {
          const on = st === col, p = V(h.x, h.y + yOff, h.z).addScaledVector(fwd, .36);
          M.compose(P.copy(p), Q.identity(), Sc.setScalar(on ? 1.25 : .9)); lamp.setMatrixAt(i * 2 + k, M);
          lamp.setColorAt(i * 2 + k, on ? (col === 'r' ? C.setRGB(5, .35, .2) : C.setRGB(.4, 5, 1.2)) : C.setRGB(.12, .12, .12));
          if (on) { M.compose(P.copy(p), Q.identity(), Sc.setScalar(1.3)); glow.setMatrixAt(i, M); glow.setColorAt(i, col === 'r' ? C.setRGB(1, .15, .08) : C.setRGB(.2, 1, .35)); }
        }
      });
      lamp.instanceMatrix.needsUpdate = true; lamp.instanceColor.needsUpdate = true; glow.instanceMatrix.needsUpdate = true; glow.instanceColor.needsUpdate = true;
    },
  };
}

// —— Engine 9 (red, white stripe, ladder on top) and the station's roller door ——
export function makeEngine(scene) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const red = mat('#d0201b', { roughness: .32, metalness: .05 }), white = mat('#f4f1ea'), dark = mat('#14171c', { roughness: .15, metalness: .4 }), grey = mat('#9aa0a6', { roughness: .45, metalness: .5 }), black = mat('#1d1d1f', { roughness: .8 });
  box(2.4, 2.0, 7.0, red, 0, 1.55, -1.4, inner); box(2.42, .22, 7.02, white, 0, 1.55, -1.4, inner);
  box(2.4, 2.45, 2.3, red, 0, 1.78, 3.3, inner); box(2.2, .9, .08, dark, 0, 2.35, 4.46, inner); box(2.43, .7, 1.4, dark, 0, 2.3, 3.35, inner);
  box(2.3, .12, 6.6, grey, 0, 2.62, -1.5, inner); box(.9, .45, 7.6, mat('#c9ccd0', { metalness: .6, roughness: .35 }), 0, 2.95, -.8, inner);
  for (const z of [3.2, -2.8, -4.0]) for (const x of [-1.12, 1.12]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .36, 12), black); w.rotation.z = Math.PI / 2; w.position.set(x, .5, z); inner.add(w); }
  const lr = new THREE.MeshStandardMaterial({ color: '#ff2a1a', emissive: '#ff2a1a', emissiveIntensity: 0 }), lb = new THREE.MeshStandardMaterial({ color: '#2a5cff', emissive: '#2a6cff', emissiveIntensity: 0 });
  box(.9, .2, .35, lr, -.55, 3.1, 3.5, inner); box(.9, .2, .35, lb, .55, 3.1, 3.5, inner);
  inner.position.z = -4.6;   // the sim position is the front bumper
  scene.add(g);
  const door = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1, .3), mat('#b8322a', { roughness: .5 })); door.castShadow = true; scene.add(door);
  const eng = SIM.cars.find(c => c.kind === 'engine');
  return {
    draw(t, s) {
      const st = SIM.state(eng, s); const w = world(st.L, st.s);
      g.position.set(w.x, 0, w.z); g.rotation.y = 0;
      const on = Math.floor(t * 6) % 2; lr.emissiveIntensity = on ? 6 : .3; lb.emissiveIntensity = on ? .3 : 6;
      const open = 1;   // the door is up from the start: the crew is already aboard, waiting for the road
      door.scale.set(1, 5.6 * (1 - open) + .4, 1); door.position.set(0, 5.6 - (5.6 * (1 - open) + .4) / 2, STATION.z1 + .3);
    },
    pos(s) { const st = SIM.state(eng, s); const w = world(st.L, st.s); return V(w.x, 1.5, w.z - 4); },
  };
}

// —— the tow truck: west along the pavement of the 260 street, into the box, hooks the blue car, drags it east ——
export function makeTow(scene) {
  const truck = new THREE.Group(), ti = new THREE.Group(); truck.add(ti);
  const yel = mat('#f2a51a', { roughness: .4 }), blk = mat('#24262a'), glass = mat('#13171d', { roughness: .1, metalness: .5 }), tyre = mat('#1d1d1f');
  box(2.4, 2.4, 2.6, yel, 0, 1.6, 2.4, ti); box(2.2, .8, .08, glass, 0, 2.2, 3.72, ti);
  box(2.4, .9, 4.6, blk, 0, .95, -1.2, ti); box(2.3, .3, 4.4, yel, 0, 1.5, -1.2, ti);
  const boom = new THREE.Group(); boom.position.set(0, 1.7, -2.6); ti.add(boom); box(.4, .4, 3.2, yel, 0, 0, -1.4, boom); boom.rotation.x = -.35;
  const beacon = new THREE.MeshStandardMaterial({ color: '#ff9a10', emissive: '#ff8a00', emissiveIntensity: 0 }); box(1.4, .25, .4, beacon, 0, 2.95, 2.2, ti);
  for (const [x, z] of [[-1.15, 2.6], [1.15, 2.6], [-1.15, -2.2], [1.15, -2.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .32, 10), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, .48, z); ti.add(w); }
  scene.add(truck);
  const PAVE = 260 - 6 - 2.2, B = { x: 115.9 - LEN / 2, z: 263 };
  function pose(s) {
    if (s < TOW.t0) return null;
    if (s < TOW.at) { const u = eio(seg(s, TOW.t0, TOW.at)); return { x: lerp(330, 132, u), z: PAVE, yaw: -Math.PI / 2, y: .14 }; }   // on the pavement, facing west
    if (s < TOW.hook) { const u = eio(seg(s, TOW.at, TOW.hook)); return { x: lerp(132, B.x + LEN / 2 + 4.4, u), z: lerp(PAVE, B.z, u), yaw: lerp(-Math.PI / 2, Math.PI / 2, u), y: .14 * (1 - u) }; }   // swings round into the box, tail to the blue car's nose
    if (s < TOW.go) return { x: B.x + LEN / 2 + 4.4, z: B.z, yaw: Math.PI / 2, y: 0 };
    const u = s - TOW.go; const x = B.x + LEN / 2 + 4.4 + Math.min(u, 2) ** 2 * 1.2 + Math.max(0, u - 2) * 4.8; return { x, z: B.z, yaw: Math.PI / 2, y: 0 };
  }
  return {
    draw(t, s) {
      const p = pose(s); truck.visible = !!p && p.x < 600; if (!p) return null;
      truck.position.set(p.x, p.y, p.z); truck.rotation.y = p.yaw;
      boom.rotation.x = s > TOW.hook ? -.12 : -.35; beacon.emissiveIntensity = Math.floor(t * 6) % 2 ? 6 : .4;
      const lift = s > TOW.hook ? .5 * ss(seg(s, TOW.hook, TOW.go)) : 0;
      return { bx: p.x - 4.4 - LEN / 2 + .3, bz: p.z, byaw: Math.PI / 2, lift };
    },
    pose,
  };
}

// —— walkers on the pavements ——
export function makeWalkers(scene) {
  const rnd = mulberry(12), W = [];
  for (let i = 0; i < 360; i++) {
    const side = rnd() < .5 ? -1 : 1;
    if (rnd() < .45) { const s = NS[Math.floor(rnd() * NS.length)]; const z = lerp(-300, 620, rnd()), hw = s.x === 0 && z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : s.h; W.push({ axis: 'z', c: s.x + side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -300, hi: 625 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; W.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, rnd()), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460 }); }
  }
  const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), W.length); m.castShadow = true; m.frustumCulled = false;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  for (let i = 0; i < W.length; i++) m.setColorAt(i, C.set(PC[Math.floor(rnd() * PC.length)]));
  scene.add(m);
  return { draw(s) { W.forEach((w, i) => { const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s) % span; if (u < 0) u += span; const p = w.lo + u; M.compose(P.set(w.axis === 'z' ? w.c : p, .12, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M); }); m.instanceMatrix.needsUpdate = true; } };
}

// —— the yellow cat, asleep on the fire station roof ——
export function makeCat(scene) {
  const g = new THREE.Group(), y = mat('#f2b72e', { roughness: .8 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .7, 4, 8), y); b.rotation.z = Math.PI / 2; b.position.y = .35; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y); h.position.set(.62, .45, 0); g.add(h);
  for (const z of [-.13, .13]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 4), y); e.position.set(.66, .76, z); g.add(e); }
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 5), y); tl.rotation.z = 1.2; tl.position.set(-.75, .3, .1); g.add(tl);
  g.scale.setScalar(1.4); g.position.set(STATION.x0 + 3, STATION.h + .05, STATION.z1 - 3); g.rotation.y = -.7;
  g.traverse(o => { o.castShadow = true; }); scene.add(g);
}
