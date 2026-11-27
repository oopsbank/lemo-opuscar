// Two Tugs — harbour dressing so no patch of frame is empty: a marina with moored boats along the quay either side of the berth,
// buoys and a channel line, fishing boats and dinghies under way, kayaks, floating gulls and foam, quay clutter (crates, barrels,
// bikes, kiosks with awnings, flag poles, bollards, a crane), rooftop clutter on the sheds and the town (AC units, antennas,
// solar panels, water tanks), deck chairs and passengers on the ship's open decks, distant sails on the horizon
import * as THREE from 'three';
import { patchCloud, QUAY, ROOFS } from './world.js';
import { clamp, lerp, seg, ss, mulberry } from '/core/lib.js';
import { QZ, SHIP } from './story.js';

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const std = (o = {}) => patchCloud(new THREE.MeshStandardMaterial({ roughness: .6, ...o }));
const WL = -.9;
function inst(scene, geo, mat, list, colors, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.count = list.length;
  list.forEach((it, i) => { Q.setFromEuler(E.set(it.rx || 0, it.yaw || 0, it.rz || 0)); M.compose(P.set(it.x, it.y || 0, it.z), Q, Sc.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.s || 1)); m.setMatrixAt(i, M); if (colors) m.setColorAt(i, C.set(typeof colors === 'function' ? colors(it, i) : colors)); });
  m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m;
}
const HULL = ['#fbfaf6', '#fbfaf6', '#1f4f8f', '#d8342a', '#2c9a7a', '#f2b72e', '#f4f1ea', '#e9e4d8'];
const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];

export function makeHarbour(scene) {
  const rnd = mulberry(91), R = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
  // most of the floating clutter goes where the cameras look (around the ship), away from the tugs' lanes and the ship itself
  const lane = (x, z) => (x > 100 && x < 180 || x > -65 && x < 20) && z < QZ + 128 || z < QZ + 42 && x > SHIP.x - 105 && x < SHIP.x + 105 || x > 100 && x < 280 && Math.abs(z - (QZ + 92)) < 12;
  const near = () => { for (;;) { const x = R(-230, 360), z = R(QZ + 48, QZ + 360); if (!lane(x, z)) return [x, z]; } };
  // —— marina: pontoons sticking out from the quay west and east of the berth, boats moored both sides ——
  const pontoons = [], boats = [], masts = [], cabins = [];
  for (const x0 of [-330, -270, -210, -150, 250, 310, 370, 430]) {
    const L = R(55, 80); pontoons.push({ x: x0, z: QZ + L / 2, sx: 3, sy: .5, sz: L, y: WL + .5 });
    for (let k = 0; k < L / 7.5 - 1; k++) for (const s of [-1, 1]) {
      if (rnd() < .15) continue;
      const len = R(7, 12), x = x0 + s * (1.5 + 1.6 + R(0, .4)), z = QZ + 6 + k * 7.5, sail = rnd() < .55;
      boats.push({ x: x + s * 0, z, yaw: s > 0 ? Math.PI / 2 : -Math.PI / 2, sx: 2.6 + len * .08, sy: 1.2, sz: len, y: WL + .3, c: pick(HULL), ph: rnd() * 6 });
      cabins.push({ x, z, yaw: s > 0 ? Math.PI / 2 : -Math.PI / 2, sx: 1.8, sy: .9, sz: len * .4, y: WL + 1.3, c: rnd() < .5 ? '#fbfaf6' : '#dfe6ea' });
      if (sail) masts.push({ x, z, y: WL + 1, sy: R(9, 14) });
    }
  }
  inst(scene, new THREE.BoxGeometry(1, 1, 1), std({ color: '#b89a74' }), pontoons);
  const boatM = inst(scene, new THREE.CylinderGeometry(.5, .5, 1, 6, 1).rotateX(Math.PI / 2).scale(1, 1, 1), std({ roughness: .4 }), boats, it => it.c);
  inst(scene, new THREE.BoxGeometry(1, 1, 1), std({ roughness: .3 }), cabins, it => it.c);
  inst(scene, new THREE.CylinderGeometry(.06, .08, 1, 4).translate(0, .5, 0), std({ color: '#e8e6e0' }), masts);
  // —— buoys: a channel of red/green buoys, mooring balls, lobster-pot floats ——
  const buoys = [];
  for (let i = 0; i < 14; i++) { buoys.push({ x: -380 + i * 60, z: QZ + 230, c: i % 2 ? '#2aa84a' : '#d8342a', s: 1.4, ph: rnd() * 6 }); }
  for (let i = 0; i < 160; i++) { const [x, z] = i < 120 ? near() : [R(-560, 620), R(QZ + 300, QZ + 800)]; buoys.push({ x, z, c: pick(['#f07f2c', '#fbfaf6', '#f2b72e', '#d8342a']), s: R(.5, .9), ph: rnd() * 6 }); }
  const buoyM = inst(scene, new THREE.SphereGeometry(.7, 8, 6), std({ roughness: .4 }), buoys, it => it.c);
  // —— boats under way (fishing boats, dinghies, a little ferry, kayaks), circling slowly on loops away from the action ——
  const movers = [];
  for (let i = 0; i < 40; i++) {
    const kind = i < 9 ? 'fish' : i < 24 ? 'dinghy' : i < 34 ? 'kayak' : 'yacht';
    const far = i % 3 === 0;
    movers.push({ kind, cx: far ? R(-500, 600) : R(-200, 330), cz: far ? R(QZ + 300, QZ + 900) : R(QZ + 200, QZ + 380), r: far ? R(30, 120) : R(8, 22), w: R(.02, .06) * (rnd() < .5 ? 1 : -1), ph: rnd() * 6, c: pick(HULL) });
  }
  const mv = { fish: [], dinghy: [], kayak: [], yacht: [] }; movers.forEach(m => mv[m.kind].push(m));
  const fishM = inst(scene, new THREE.BoxGeometry(3.6, 1.6, 10).translate(0, WL + .6, 0), std({ roughness: .4 }), mv.fish, it => it.c);
  const fishCab = inst(scene, new THREE.BoxGeometry(2.4, 2, 2.6).translate(0, WL + 2.4, 1.6), std({ color: '#fbfaf6' }), mv.fish);
  const dinM = inst(scene, new THREE.BoxGeometry(1.8, .7, 4.2).translate(0, WL + .3, 0), std({ roughness: .4 }), mv.dinghy, it => it.c);
  const kayM = inst(scene, new THREE.BoxGeometry(.7, .4, 4).translate(0, WL + .2, 0), std({ color: '#f07f2c' }), mv.kayak);
  const yM = inst(scene, new THREE.BoxGeometry(3, 1.2, 12).translate(0, WL + .4, 0), std({ color: '#fbfaf6' }), mv.yacht);
  const ySail = inst(scene, new THREE.ConeGeometry(2.6, 13, 3).translate(0, WL + 7.5, 0), std({ color: '#fbfaf6', flatShading: true }), mv.yacht);
  // boats at anchor close to the action (so the open water around the ship is busy)
  const anch = [], anchCab = [], anchMast = [];
  for (let i = 0; i < 36; i++) { const [x, z] = near(), yaw = R(-.5, .5) + Math.PI / 2, len = R(8, 14); anch.push({ x, z, yaw, sx: 3, sy: 1.3, sz: len, y: WL + .4, c: pick(HULL), ph: rnd() * 6 }); anchCab.push({ x, z, yaw, sx: 2, sy: 1, sz: len * .4, y: WL + 1.5, c: '#fbfaf6' }); if (rnd() < .6) anchMast.push({ x, z, y: WL + 1, sy: R(10, 15) }); }
  const anchM = inst(scene, new THREE.BoxGeometry(1, 1, 1), std({ roughness: .4 }), anch, it => it.c);
  inst(scene, new THREE.BoxGeometry(1, 1, 1), std({ roughness: .3 }), anchCab, it => it.c);
  inst(scene, new THREE.CylinderGeometry(.06, .08, 1, 4).translate(0, .5, 0), std({ color: '#e8e6e0' }), anchMast);
  // wake foam for the movers and floating gulls / foam patches on open water
  const foam = [];
  for (let i = 0; i < 420; i++) { const [x, z] = i < 320 ? near() : [R(-560, 620), R(QZ + 300, QZ + 900)]; foam.push({ x, z, s: R(1.2, 4.5), ph: rnd() * 6 }); }
  const foamM = inst(scene, new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f4f6f6', transparent: true, opacity: .35, depthWrite: false, roughness: .9 }), foam, null, false);
  const gulls = []; for (let i = 0; i < 160; i++) { const [x, z] = near(); gulls.push({ x, z, ph: rnd() * 6 }); }
  const gullM = inst(scene, new THREE.CapsuleGeometry(.22, .5, 2, 5).rotateX(Math.PI / 2).translate(0, WL + .25, 0), std({ color: '#f7f5f0' }), gulls);
  // —— quay clutter ——
  const crates = [], barrels = [], bikes = [], kiosks = [], awn = [], bollards = [], poles = [], flags = [];
  for (let x = -520; x < 520; x += R(6, 14)) {
    const z = R(QUAY.road1 + 3, QZ - 4); if (Math.abs(x - 60) < 110 && z > QZ - 18) continue;   // keep the crowd strip by the berth clear-ish
    const r = rnd();
    if (r < .3) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) crates.push({ x: x + k * 1.3, z, y: (k % 2) * 1.1, s: 1.1, yaw: R(-.2, .2), c: pick(['#b5814f', '#8f6a46', '#c9a06b', '#3f7fb5']) }); }
    else if (r < .5) { for (let k = 0; k < 3; k++) barrels.push({ x: x + (k % 2) * 1.1, z: z + Math.floor(k / 2) * 1.1, c: pick(['#2f6fd0', '#d8342a', '#3f9a5a', '#f2b72e']) }); }
    else if (r < .65) bikes.push({ x, z, yaw: R(0, 3), c: pick(PC) });
    else if (r < .72) { kiosks.push({ x, z }); awn.push({ x, z, c: pick(['#d8342a', '#2f6fd0', '#2c9a7a', '#f2b72e']) }); }
  }
  for (let x = -520; x < 520; x += 9) if (Math.abs(x - 60) > 100) bollards.push({ x, z: QZ - 1 });
  for (let x = -500; x < 520; x += 46) { poles.push({ x, z: QZ - 3, sy: 9 }); flags.push({ x, z: QZ - 3, c: pick(['#d8342a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#fbfaf6']), ph: rnd() * 6 }); }
  inst(scene, new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), std(), crates, it => it.c);
  inst(scene, new THREE.CylinderGeometry(.45, .45, 1.1, 8).translate(0, .55, 0), std({ roughness: .4 }), barrels, it => it.c);
  inst(scene, new THREE.BoxGeometry(.15, .9, 1.7).translate(0, .55, 0), std(), bikes, it => it.c);
  inst(scene, new THREE.BoxGeometry(3.2, 2.6, 2.4).translate(0, 1.3, 0), std({ color: '#f4efe4' }), kiosks);
  inst(scene, new THREE.BoxGeometry(3.8, .25, 3.4).rotateX(.25).translate(0, 2.8, .4), std(), awn, it => it.c);
  inst(scene, new THREE.CylinderGeometry(.3, .36, .8, 8).translate(0, .4, 0), std({ color: '#2a2d31' }), bollards);
  inst(scene, new THREE.CylinderGeometry(.07, .07, 1, 4).translate(0, .5, 0), std({ color: '#e8e6e0' }), poles);
  const flagM = inst(scene, new THREE.PlaneGeometry(2, 1.2).translate(1, 8.2, 0), std({ side: THREE.DoubleSide }), flags, it => it.c, false);
  // —— roofs: AC units, antennas, solar panels, water tanks on every flat roof; skylights on gables ——
  const ac = [], ant = [], solar = [], tanks = [];
  for (const r of ROOFS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    if (r.gable) { if (rnd() < .5) solar.push({ x: (r.x0 + r.x1) / 2 + R(-w / 4, w / 4), z: (r.z0 + r.z1) / 2 + d * .18, y: r.h + Math.min(w, d) * .2, sx: Math.min(6, w * .4), sz: Math.min(4, d * .25), rx: -.35 }); continue; }
    for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) ac.push({ x: R(r.x0 + 1, r.x1 - 1), z: R(r.z0 + 1, r.z1 - 1), y: r.h, yaw: R(0, 3) });
    if (rnd() < .6) ant.push({ x: R(r.x0 + 1, r.x1 - 1), z: R(r.z0 + 1, r.z1 - 1), y: r.h, sy: R(2, 4) });
    if (rnd() < .5) solar.push({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, y: r.h + .5, sx: Math.min(8, w * .5), sz: Math.min(5, d * .4), rx: -.3 });
    if (rnd() < .35) tanks.push({ x: R(r.x0 + 1.5, r.x1 - 1.5), z: R(r.z0 + 1.5, r.z1 - 1.5), y: r.h });
  }
  inst(scene, new THREE.BoxGeometry(1.2, .8, .9).translate(0, .4, 0), std({ color: '#d9d6cf' }), ac);
  inst(scene, new THREE.CylinderGeometry(.05, .05, 1, 3).translate(0, .5, 0), std({ color: '#3b3f45' }), ant);
  inst(scene, new THREE.BoxGeometry(1, .12, 1), std({ color: '#25365a', roughness: .2, metalness: .4 }), solar);
  inst(scene, new THREE.CylinderGeometry(.8, .8, 1.6, 10).translate(0, 1.4, 0), std({ color: '#e8e4da' }), tanks);
  // —— horizon: distant sails and a container ship far out ——
  const far = []; for (let i = 0; i < 26; i++) far.push({ x: R(-1400, 1500), z: R(QZ + 1100, QZ + 2200), s: R(1.5, 3) });
  inst(scene, new THREE.ConeGeometry(2, 9, 3).translate(0, WL + 4.5, 0), std({ color: '#fbfaf6', flatShading: true }), far, null, false);
  inst(scene, new THREE.BoxGeometry(160, 14, 24).translate(0, WL + 6, 0), std({ color: '#2c4a6e' }), [{ x: -700, z: QZ + 2600 }], null, false);
  return {
    draw(t) {
      boats.forEach((b, i) => { Q.setFromEuler(E.set(Math.sin(t * 1.2 + b.ph) * .03, b.yaw, Math.sin(t * .9 + b.ph) * .05)); M.compose(P.set(b.x, b.y + Math.sin(t * 1.4 + b.ph) * .1, b.z), Q, Sc.set(b.sx, b.sy, b.sz)); boatM.setMatrixAt(i, M); }); boatM.instanceMatrix.needsUpdate = true;
      buoys.forEach((b, i) => { M.compose(P.set(b.x, WL + .2 + Math.sin(t * 1.7 + b.ph) * .15, b.z), Q.identity(), Sc.setScalar(b.s)); buoyM.setMatrixAt(i, M); }); buoyM.instanceMatrix.needsUpdate = true;
      for (const [list, ...meshes] of [[mv.fish, fishM, fishCab], [mv.dinghy, dinM], [mv.kayak, kayM], [mv.yacht, yM, ySail]]) {
        list.forEach((m, i) => { const a = m.ph + t * m.w * (m.kind === 'kayak' ? 1 : 3); const x = m.cx + Math.cos(a) * m.r, z = m.cz + Math.sin(a) * m.r; const yaw = -a + (m.w > 0 ? 0 : Math.PI); Q.setFromEuler(E.set(0, yaw, m.kind === 'yacht' ? .15 : 0)); M.compose(P.set(x, Math.sin(t * 1.5 + m.ph) * .1, z), Q, Sc.set(1, 1, 1)); for (const me of meshes) me.setMatrixAt(i, M); });
        for (const me of meshes) me.instanceMatrix.needsUpdate = true;
      }
      foam.forEach((f, i) => { M.compose(P.set(f.x + Math.sin(t * .3 + f.ph) * 2, WL + .05, f.z), Q.identity(), Sc.setScalar(f.s * (.8 + .2 * Math.sin(t + f.ph)))); foamM.setMatrixAt(i, M); }); foamM.instanceMatrix.needsUpdate = true;
      gulls.forEach((gl, i) => { Q.setFromEuler(E.set(0, gl.ph + Math.sin(t * .2 + gl.ph) * .5, 0)); M.compose(P.set(gl.x, Math.sin(t * 1.6 + gl.ph) * .12, gl.z), Q, Sc.set(1, 1, 1)); gullM.setMatrixAt(i, M); }); gullM.instanceMatrix.needsUpdate = true;
      flags.forEach((f, i) => { Q.setFromEuler(E.set(0, Math.sin(t * 2.1 + f.ph) * .3 + .3, Math.sin(t * 5 + f.ph) * .05)); M.compose(P.set(f.x, 0, f.z), Q, Sc.set(1, 1, 1)); flagM.setMatrixAt(i, M); }); flagM.instanceMatrix.needsUpdate = true;
    },
  };
}
