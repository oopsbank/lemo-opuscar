// All Green — set dressing and secondary motion: parked cars on every kerb, lamp posts, benches, planters, café tables with umbrellas,
// crowds waiting at the crossings, rooftop laundry, flags and pots, pigeons that take off at the crash, gulls circling
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, STATION, ROOFS } from './world.js';
import { clamp, lerp, seg, ss, mulberry } from '/core/lib.js';
import { JUNCS } from './grid.js';

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const std = (o = {}) => patchCloud(new THREE.MeshStandardMaterial({ roughness: .6, ...o }));
const AREA = { x0: -260, x1: 330, z0: -110, z1: 420 };
const inArea = (x, z) => x > AREA.x0 && x < AREA.x1 && z > AREA.z0 && z < AREA.z1;
const nearJ = (x, z, r) => JUNCS.some(J => Math.abs(x - J.x) < r && Math.abs(z - J.z) < r) || Math.abs(x) < 16 && z < 24 && z > -40;
function inst(scene, geo, mat, list, colors, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.count = list.length;
  list.forEach((it, i) => { Q.setFromEuler(E.set(0, it.yaw || 0, 0)); M.compose(P.set(it.x, it.y || 0, it.z), Q, Sc.set(it.s || 1, it.sy || it.s || 1, it.s || 1)); m.setMatrixAt(i, M); if (colors) m.setColorAt(i, C.set(colors(it, i))); });
  m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m;
}
const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c', '#7a3fc4'];
const CARC = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#3f8f5b', '#a83a2f', '#e9e4d8', '#f2b72e', '#e85f3a'];

export function makeDressing(scene) {
  const rnd = mulberry(77), R = (a, b) => a + (b - a) * rnd();
  const parked = [], lamps = [], benches = [], planters = [], tables = [], umbrellas = [], crowd = [];
  // kerbs: along every street segment in the area, both sides
  for (const s of NS) for (const side of [-1, 1]) {
    const off = (s.x === 0 ? 5.9 : 5.0) * side, pave = (s.h + 1.6) * side;
    for (let z = AREA.z0; z < AREA.z1; z += R(5.4, 8)) {
      const hw = s.x === 0 && z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : s.h;
      if (s.x === 0 && z > BLVD.z0) continue;
      if (nearJ(s.x, z, 16) || rnd() < .22) continue;
      parked.push({ x: s.x + off, z, yaw: side > 0 ? Math.PI : 0, c: CARC[Math.floor(rnd() * CARC.length)] });
    }
    for (let z = AREA.z0 + R(0, 20); z < AREA.z1; z += 24) if (!nearJ(s.x, z, 10)) lamps.push({ x: s.x + (s.h + .8) * side, z });
    for (let z = AREA.z0; z < AREA.z1; z += R(30, 60)) if (!nearJ(s.x, z, 14)) (rnd() < .5 ? benches : planters).push({ x: s.x + (s.h + 2.4) * side, z, yaw: Math.PI / 2 });
  }
  for (const e of EW) for (const side of [-1, 1]) {
    const off = 5.0 * side;
    for (let x = AREA.x0; x < AREA.x1; x += R(5.4, 8)) {
      if (nearJ(x, e.z, 16) || rnd() < .22) continue;
      if (e.z === 260 && side < 0 && x > 120 && x < 340) continue;   // the tow truck's pavement run stays clear of parked cars' doors
      parked.push({ x, z: e.z + off, yaw: side > 0 ? -Math.PI / 2 : Math.PI / 2, c: CARC[Math.floor(rnd() * CARC.length)] });
    }
    for (let x = AREA.x0 + R(0, 20); x < AREA.x1; x += 24) if (!nearJ(x, e.z, 10)) lamps.push({ x, z: e.z + (e.h + .8) * side });
    for (let x = AREA.x0; x < AREA.x1; x += R(30, 60)) if (!nearJ(x, e.z, 14) && !(e.z === 260 && side < 0 && x > 120)) (rnd() < .5 ? benches : planters).push({ x, z: e.z + (e.h + 2.4) * side });
  }
  // café terraces on the corners near the station road and the boulevard
  for (const [cx, cz, nx, nz] of [[-18, 140, 6, 4], [18, 240, 5, 4], [-18, 240, 5, 3], [140, 140, 5, 3], [-112, 245, 5, 3]]) {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = cx + (cx < 0 ? -1 : 1) * i * 2.6, z = cz + (cz > 200 ? -1 : 1) * j * 2.8;
      tables.push({ x, z }); if ((i + j) % 2 === 0) umbrellas.push({ x, z, c: ['#d8342a', '#f4f1ea', '#2f6fd0', '#2c9a7a', '#f2b72e'][Math.floor(rnd() * 5)], ph: rnd() * 6 });
      for (let k = 0; k < 2; k++) if (rnd() < .6) crowd.push({ x: x + (k ? .8 : -.8), z: z + R(-.4, .4), c: PC[Math.floor(rnd() * PC.length)], ph: rnd() * 9, sit: 1 });
    }
  }
  // crowds waiting at each junction's corners (pedestrians can't cross either: the cars never stop)
  for (const J of JUNCS) for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const n = 4 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) crowd.push({ x: J.x + sx * (J.hx + R(1.2, 4)), z: J.z + sz * (J.hz + R(1.2, 4)), c: PC[Math.floor(rnd() * PC.length)], ph: rnd() * 9, sit: 0, J });
  }
  // meshes
  const carG = new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), cabG = new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25);
  inst(scene, carG, std({ roughness: .35, metalness: .15 }), parked, it => it.c);
  inst(scene, cabG, std({ color: '#0f1218', roughness: .12, metalness: .5 }), parked);
  inst(scene, new THREE.CylinderGeometry(.1, .13, 6, 6).translate(0, 3, 0), std({ color: '#2f3338' }), lamps);
  inst(scene, new THREE.SphereGeometry(.38, 8, 6).translate(0, 6.1, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, .8) }), lamps, null, false);
  inst(scene, new THREE.BoxGeometry(2.0, .5, .7).translate(0, .45, 0), std({ color: '#8a5a3a' }), benches);
  inst(scene, new THREE.BoxGeometry(1.4, .8, 1.4).translate(0, .4, 0), std({ color: '#c9b79c' }), planters);
  inst(scene, new THREE.IcosahedronGeometry(.9, 0).translate(0, 1.4, 0), std({ color: '#4f9a35', flatShading: true }), planters);
  inst(scene, new THREE.CylinderGeometry(.55, .55, .08, 10).translate(0, .78, 0), std({ color: '#f1ede4' }), tables);
  const umb = inst(scene, new THREE.ConeGeometry(1.5, .55, 10).translate(0, 2.4, 0), std({ roughness: .55 }), umbrellas, it => it.c);
  inst(scene, new THREE.CylinderGeometry(.05, .05, 2.3, 4).translate(0, 1.15, 0), std({ color: '#ddd' }), umbrellas);
  // people (crowds + café), they sway, turn their heads (bob), some step about
  const ppl = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), std({ roughness: .7 }), crowd.length); ppl.castShadow = true; ppl.frustumCulled = false;
  crowd.forEach((p, i) => ppl.setColorAt(i, C.set(p.c))); scene.add(ppl);
  // rooftops: laundry lines, flags, pots, satellite dishes (flat roofs in the area)
  const roofs = ROOFS.filter(r => !r.gable && inArea((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2));
  const cloth = [], flags = [], pots = [], dishes = [];
  for (const r of roofs) {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, w = r.x1 - r.x0;
    if (rnd() < .45) { const n = Math.floor(w / 1.1) - 2; for (let i = 0; i < n; i++) cloth.push({ x: r.x0 + 1.5 + i * 1.1, z: cz, y: r.h + 1.4, c: PC[Math.floor(rnd() * PC.length)], ph: rnd() * 6 }); }
    if (rnd() < .12) flags.push({ x: r.x1 - 1, z: r.z0 + 1, y: r.h, c: ['#d8342a', '#2f6fd0', '#f2b72e', '#3f9a5a'][Math.floor(rnd() * 4)], ph: rnd() * 6 });
    for (let i = 0; i < 3; i++) if (rnd() < .4) pots.push({ x: R(r.x0 + 1, r.x1 - 1), z: R(r.z0 + 1, r.z1 - 1), y: r.h, s: R(.6, 1.1) });
    if (rnd() < .2) dishes.push({ x: R(r.x0 + 1, r.x1 - 1), z: R(r.z0 + 1, r.z1 - 1), y: r.h, yaw: R(0, 6.28) });
  }
  const clothM = new THREE.InstancedMesh(new THREE.PlaneGeometry(.8, 1.0).translate(0, -.5, 0), std({ side: THREE.DoubleSide, roughness: .8 }), Math.max(1, cloth.length)); clothM.count = cloth.length; clothM.castShadow = true; clothM.frustumCulled = false;
  cloth.forEach((c, i) => clothM.setColorAt(i, C.set(c.c))); scene.add(clothM);
  inst(scene, new THREE.IcosahedronGeometry(.6, 0).translate(0, .6, 0), std({ color: '#5aa83a', flatShading: true }), pots);
  inst(scene, new THREE.CylinderGeometry(.6, .2, .3, 8).rotateX(.7).translate(0, 1, 0), std({ color: '#e8e6e0' }), dishes);
  inst(scene, new THREE.CylinderGeometry(.05, .05, 3.2, 4).translate(0, 1.6, 0), std({ color: '#ddd' }), flags);
  const flagM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1.0, 6, 1).translate(.8, 2.7, 0), std({ side: THREE.DoubleSide }), Math.max(1, flags.length)); flagM.count = flags.length; flagM.frustumCulled = false;
  flags.forEach((f, i) => flagM.setColorAt(i, C.set(f.c))); scene.add(flagM);
  // birds: pigeons by the crash junction (they lift off when the cars meet) and gulls circling over the town
  const PIG = [], GULL = [];
  for (let i = 0; i < 36; i++) PIG.push({ x: 120 + R(-14, 14), z: 260 + R(-14, 14), ph: rnd() * 6, ang: rnd() * 6.28, r: R(14, 40), h: R(12, 28), land: ROOFS.length ? ROOFS[Math.floor(rnd() * ROOFS.length)] : null });
  for (let i = 0; i < 40; i++) GULL.push({ cx: R(AREA.x0, AREA.x1), cz: R(AREA.z0, AREA.z1), r: R(20, 70), h: R(25, 55), w: R(.15, .3) * (rnd() < .5 ? 1 : -1), ph: rnd() * 6 });
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.25, 0, 0, .25, -.9, 0, 0, 0, 0, -.25, .9, 0, 0, 0, 0, .25], 3)); wingG.computeVertexNormals();
  const birds = new THREE.InstancedMesh(wingG, new THREE.MeshStandardMaterial({ color: '#f4f2ee', side: THREE.DoubleSide, roughness: .7 }), PIG.length + GULL.length); birds.castShadow = true; birds.frustumCulled = false;
  PIG.forEach((p, i) => birds.setColorAt(i, C.set(i % 3 ? '#8d939b' : '#c9ced6'))); GULL.forEach((g, i) => birds.setColorAt(PIG.length + i, C.set('#f7f5f0'))); scene.add(birds);
  const bodyG = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.16, .4, 2, 5).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9aa0a6' }), PIG.length + GULL.length); bodyG.frustumCulled = false; bodyG.castShadow = true; scene.add(bodyG);
  return {
    draw(t, s, crashS = 4.2, wind = 1) {
      // umbrellas rock a little, laundry and flags flutter
      umbrellas.forEach((u, i) => { Q.setFromEuler(E.set(Math.sin(t * 1.7 + u.ph) * .04 * wind, 0, Math.cos(t * 1.3 + u.ph) * .04 * wind)); M.compose(P.set(u.x, 0, u.z), Q, Sc.set(1, 1, 1)); umb.setMatrixAt(i, M); }); umb.instanceMatrix.needsUpdate = true;
      cloth.forEach((c, i) => { Q.setFromEuler(E.set(Math.sin(t * 3.1 + c.ph) * .35 * wind, 0, 0)); M.compose(P.set(c.x, c.y, c.z), Q, Sc.set(1, 1, 1)); clothM.setMatrixAt(i, M); }); clothM.instanceMatrix.needsUpdate = true;
      flags.forEach((f, i) => { Q.setFromEuler(E.set(0, Math.sin(t * 2.3 + f.ph) * .35 + .4, Math.sin(t * 5 + f.ph) * .06)); M.compose(P.set(f.x, f.y, f.z), Q, Sc.set(1, 1 + .05 * Math.sin(t * 7 + f.ph), 1)); flagM.setMatrixAt(i, M); }); flagM.instanceMatrix.needsUpdate = true;
      // people: idle sway; the corner crowds bob and shuffle, and cheer (hop) when Engine 9 goes by
      crowd.forEach((p, i) => {
        const hop = !p.sit && p.J && p.J.x === 0 && s > 120 && s < 150 ? Math.max(0, Math.sin(t * 9 + p.ph)) * .35 : 0;
        M.compose(P.set(p.x + Math.sin(t * .9 + p.ph) * .25, (p.sit ? -.25 : .1) + hop, p.z + Math.cos(t * .7 + p.ph) * .2), Q.identity(), Sc.set(1, p.sit ? .8 : 1, 1)); ppl.setMatrixAt(i, M);
      }); ppl.instanceMatrix.needsUpdate = true;
      // pigeons: pecking on the ground until the crash, then up in a wheeling flock, settling on roofs
      PIG.forEach((p, i) => {
        const a = s - crashS; let x, y, z, yaw, flap, fly = 0;
        if (a < 0) { x = p.x + Math.sin(t * .5 + p.ph) * .6; z = p.z + Math.cos(t * .4 + p.ph) * .6; y = .2; yaw = t * .3 + p.ph; flap = .1; }
        else {
          const u = clamp(a / 18), up = ss(clamp(a / 2.5)), land = p.land, lx = land ? (land.x0 + land.x1) / 2 : p.x, lz = land ? (land.z0 + land.z1) / 2 : p.z, ly = land ? land.h + .2 : .2;
          const ang = p.ang + a * .9, cx = lerp(120, lx, ss(u)), cz = lerp(260, lz, ss(u)), rr = p.r * (1 - ss(u));
          x = cx + Math.cos(ang) * rr; z = cz + Math.sin(ang) * rr; y = lerp(lerp(.2, p.h, up), ly, ss(seg(u, .7, 1))); yaw = -ang; flap = u < .98 ? 1 : .1; fly = 1;
        }
        const wing = flap > .5 ? Math.sin(t * 22 + p.ph) * .9 : .15;
        Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y + .3, z), Q, Sc.set(1, 1, 1)); bodyG.setMatrixAt(i, M);
        Q.setFromEuler(E.set(0, yaw, wing * .6)); M.compose(P.set(x, y + .35, z), Q, Sc.set(.7, 1, .7)); birds.setMatrixAt(i, M);
      });
      GULL.forEach((gl, k) => {
        const i = PIG.length + k, ang = gl.ph + t * gl.w * 2.2, x = gl.cx + Math.cos(ang) * gl.r, z = gl.cz + Math.sin(ang) * gl.r, y = gl.h + Math.sin(t * .8 + gl.ph) * 2;
        const yaw = -ang - Math.sign(gl.w) * Math.PI / 2, wing = Math.sin(t * 6 + gl.ph) * .5;
        Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y, z), Q, Sc.set(1.4, 1.4, 1.4)); bodyG.setMatrixAt(i, M);
        Q.setFromEuler(E.set(0, yaw, wing)); M.compose(P.set(x, y + .05, z), Q, Sc.set(1.8, 1, 1.4)); birds.setMatrixAt(i, M);
      });
      birds.instanceMatrix.needsUpdate = true; bodyG.instanceMatrix.needsUpdate = true;
    },
  };
}
