// The Last Train Heist — everything that moves or glows. All motion runs on story time s (story.js: sim(t)).
import * as THREE from 'three';
import { canvasTex, makeSprites, puffTex } from './sprites.js';
import { clamp, seg, lerp, ss, eio, eo, ei, hash, vnoise, monotone, mulberry } from '/core/lib.js';
import { std, box, sph, cyl, figure, walkCycle, stand, car } from './kit.js';
import { T, NS, EW, QS, VIA, STATION, CLIFF, BANK, CAFE, BLOCKS, BOARD, BAG, TRAIN, trainFront, lastCarX, thiefPos, landPos } from './story.js';
import { LAMPS } from './scene.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const alarm = s => s > T.alarm;
export const policeOn = s => s > T.cops0 - 1;

// —— lights ——
export function makeLights(scene) {
  scene.add(new THREE.HemisphereLight('#3d5590', '#10141c', 1.7));
  const moon = new THREE.DirectionalLight('#8fa9e0', .9); moon.position.set(-30, 60, 20); scene.add(moon);
  const bag = new THREE.PointLight(BAG, 0, 9, 1.4); scene.add(bag);
  const red = new THREE.PointLight('#ff2030', 0, 16, 1.3), blue = new THREE.PointLight('#2050ff', 0, 16, 1.3); red.position.set(-2, 3, 2); blue.position.set(2, 3, 4); scene.add(red, blue);
  const train = new THREE.PointLight('#ffc060', 18, 12, 1.4); scene.add(train);
  const station = new THREE.PointLight('#ffd08a', 20, 14, 1.5); station.position.set(-12, VIA.h + 3, VIA.z + 3.5); scene.add(station);
  const cafe = new THREE.PointLight('#ffb870', 14, 8, 1.5); cafe.position.set((CAFE.x0 + CAFE.x1) / 2, 2.2, CAFE.z0 - 1.2); scene.add(cafe);
  const alarmL = new THREE.PointLight('#ff2a1a', 0, 14, 1.4); alarmL.position.set(0, 4, 15); scene.add(alarmL);
  return { bag, red, blue, train, alarmL, draw(s, thief, policeCentre) {
    bag.position.set(thief.x, thief.y + 1.8, thief.z); bag.intensity = thief.visible ? 40 : 0;
    const ph = Math.floor(s * 4) % 2, on = policeOn(s) ? ss(seg(s, T.cops0 - 1, T.cops0 + 2)) : 0;
    red.position.copy(policeCentre).add(V(-2, 3, 0)); blue.position.copy(policeCentre).add(V(2, 3, 0));
    red.intensity = on * (ph ? 40 : 8); blue.intensity = on * (ph ? 8 : 40);
    const f = trainFront(s); train.position.set(f - TRAIN.len / 2, VIA.h + 2, VIA.z + 1.5); train.intensity = f - TRAIN.len > CLIFF.x0 ? 0 : 18;
    alarmL.intensity = alarm(s) ? (Math.floor(s * 2.5) % 2 ? 16 : 2) * (1 - seg(s, 30, 40)) : 0;
  } };
}
// —— street-lamp heads: warm, then flashing red with the alarm ——
export function makeLamps(scene) {
  const mats = LAMPS.map(() => new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false }));
  LAMPS.forEach(([x, z], i) => { const h = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 6), mats[i]); h.position.set(x, 4.75, z); scene.add(h); });
  return { color: (s, i) => !alarm(s) ? [1, .85, .6] : (Math.floor(s * 2.5 + i * .5) % 2 ? [1, .12, .08] : [.25, .03, .02]),
    draw(s) { mats.forEach((m, i) => { const c = this.color(s, i); m.color.setRGB(c[0] * 1.6, c[1] * 1.6, c[2] * 1.6); }); } };
}
// —— the bank door, the cartoon puff ——
export function makeBank(scene) {
  const door = new THREE.Group(); scene.add(door);
  door.add(box(2.1, 2.5, .12, std('#4a4e55', { metalness: .8, roughness: .35 }), 0, 0, 0)); for (let k = -2; k <= 2; k++) door.add(box(.06, 2.5, .16, std('#33363b', { metalness: .8 }), k * .4, 0, 0));
  const puffs = makeSprites(scene, 26, puffTex(), {}); const R = mulberry(9), P = Array.from({ length: 26 }, () => ({ a: R() * 6.28, r: .4 + R() * 1.3, y: R() * 1.6, s: 1.2 + R() * 1.3 }));
  return { draw(s, camera, scene_) {
    const u = s - T.boom;
    if (u < 0) { door.position.set(0, 1.55, BANK.z0 - .08); door.rotation.set(0, 0, 0); }
    else { const k = Math.min(u, 1.1); door.position.set(.6 * k, 1.55 + 3.2 * k - 4.9 * k * k + (u > 1.1 ? 0 : 0), BANK.z0 - .08 - 6.5 * k); door.rotation.set(-k * 5, k * 1.5, 0); if (u > 1.1) { door.position.set(.66, .22, BANK.z0 - 7.2); door.rotation.set(-Math.PI / 2, 1.65, 0); } }
    for (let i = 0; i < 26; i++) { const p = P[i]; if (u < 0 || u > 5) { puffs.hide(i); continue; }
      const e = eo(seg(u, 0, .5)), k = Math.max(0, 1 - seg(u, 1.5, 5));
      puffs.set(i, Math.cos(p.a) * p.r * (1 + e), .5 + p.y * e + u * .5, BANK.z0 - 1.2 + Math.sin(p.a) * p.r * .6 * (1 + e), p.s * (.3 + e), p.s * (.3 + e), 1, 1, 1, .85 * k, i); }
    puffs.sortBy(camera); puffs.commit(scene_.fog);
  } };
}
// —— the thief and the glowing bag ——
export function makeThief(scene) {
  const f = figure({ top: '#121318', legs: '#121318', hair: '#0b0b0d', skin: '#e2b08a' }); scene.add(f);
  const mask = box(.36, .09, .05, std('#000'), 0, .02, .16); f.P.head.add(mask);
  const bagM = new THREE.MeshBasicMaterial({ color: BAG, toneMapped: false }); const bag = sph(.48, bagM, -.05, 1.6, -.36, 14); bag.scale.set(1, .9, 1.1); f.body.add(bag);
  const knot = sph(.14, bagM, -.05, 2.02, -.36, 8); f.body.add(knot);
  const halo = makeSprites(scene, 1, (() => canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }))(), { additive: true, fog: false });
  const state = { x: 0, y: 0, z: 0, visible: false };
  return { state, f, draw(s, t) {
    const p = thiefPos(s); const vis = p.mode !== 'hide' && !(s > T.tunnel - .3 && lastCarX(s) > CLIFF.x0 - .2);
    f.visible = vis; Object.assign(state, { x: p.x, y: p.y, z: p.z, visible: vis });
    f.position.set(p.x, p.y, p.z); f.rotation.set(0, p.yaw, 0); f.body.rotation.set(0, 0, 0);
    if (p.mode === 'run') walkCycle(f, s * 13, .9); else if (p.mode === 'climb') { walkCycle(f, s * 11, .7); f.body.rotation.x = .25; }
    else if (p.mode === 'look') { stand(f); f.P.head.rotation.y = Math.sin((s - T.stop) * 3) * .9; }
    else if (p.mode === 'jump') { walkCycle(f, 1.3, 1.0); }
    else if (p.mode === 'slide') { stand(f); f.P.legL.rotation.x = .9; f.P.legR.rotation.x = -.6; f.body.rotation.x = -.3; f.P.armL.rotation.z = -1.2; f.P.armR.rotation.z = 1.2; }
    else if (p.mode === 'fly') { stand(f); f.P.legL.rotation.x = -1.0; f.P.legR.rotation.x = .7; f.P.armL.rotation.x = -2.6; f.P.armR.rotation.x = -2.2; f.body.rotation.x = .2 - .4 * p.u; }
    else if (p.mode === 'roll') { stand(f); const r = seg(s, T.land, T.roll); f.body.rotation.x = r * Math.PI * 2; f.P.legL.rotation.x = f.P.legR.rotation.x = -1.4; }
    else if (p.mode === 'hold') { stand(f); f.body.position.y = -.45; f.body.rotation.x = .9; f.P.armL.rotation.x = f.P.armR.rotation.x = -1.6; }
    if (p.mode !== 'look') f.P.head.rotation.y = 0;
    // the bag glints; a last flash as the train dives into the tunnel
    const fl = s > T.flash - .3 && s < T.flash + .35 ? 1 + 5 * Math.sin(seg(s, T.flash - .3, T.flash + .35) * Math.PI) : 1;
    if (vis) halo.set(0, p.x, p.y + 1.9, p.z, 3.6 * fl, 3.6 * fl, .3, 1, .9, .75); else if (s > T.tunnel - .3 && s < T.flash + .4) halo.set(0, CLIFF.x0 - .2, VIA.h + 3, VIA.z, 3 * fl, 3 * fl, .3, 1, .9, .7 * Math.sin(seg(s, T.tunnel - .3, T.flash + .4) * Math.PI)); else halo.hide(0);
    halo.commit(null);
  } };
}
// —— police cars (6 at the junction, 4 more for the line under the viaduct), the helicopter ——
function policeCar(scene) {
  const g = car(scene, { body: '#f4f6f8', len: 3.6 }); const bar = new THREE.Group(); g.add(bar);
  const r = new THREE.MeshBasicMaterial({ color: '#ff2030', toneMapped: false }), b = new THREE.MeshBasicMaterial({ color: '#2a60ff', toneMapped: false });
  bar.add(box(.5, .16, .24, r, -.28, 1.42, -.1)); bar.add(box(.5, .16, .24, b, .28, 1.42, -.1));
  g.add(box(1.62, .2, 3.4, std('#1a2a6a'), 0, .62, 0)); return Object.assign(g, { r, b });
}
// [from x, from z] → [park x, park z, yaw]: they rush in from the four corners and box the junction
const COPS = [
  { k: [[6.0, -40, -6.5], [12.5, 1.8, -2.6]], c: 'z', lane: NS.nb, dir: -1, park: [1.8, -.8, Math.PI * .85] },
  { k: [[6.4, 40, 8.0], [12.6, -1.8, 8.6]], c: 'z', lane: NS.sb, dir: 1, park: [-1.6, 7.6, Math.PI * .15] },
  { k: [[6.8, -50, -6], [13.2, -6.2, -6]], c: 'x', lane: EW.eb, dir: 1, park: [-6.0, 2.9, Math.PI * .5] },
  { k: [[7.0, 50, 6], [13.0, 6.6, 6]], c: 'x', lane: EW.wb, dir: -1, park: [6.2, 3.1, -Math.PI * .5] },
  { k: [[7.6, -48, -6], [13.8, -6.4, -6]], c: 'x', lane: EW.wb + .2, dir: 1, park: [-6.4, .8, Math.PI * .62] },
  { k: [[7.9, 48, 6], [14.2, 6.6, 6]], c: 'x', lane: EW.eb - .2, dir: -1, park: [6.6, 5.2, -Math.PI * .4] },
];
export function makePolice(scene) {
  const cars = COPS.map(() => policeCar(scene)), extra = [0, 1, 2, 3].map(() => policeCar(scene));
  // the line under the viaduct: the six leave the junction (46.5) and pile up northbound on the avenue, the four join from the south
  const LINE = k => -6.5 - k * 4.4;   // nose z of the k-th car in the line (on the avenue, northbound lane and southbound lane)
  const centre = V(0, 0, 3);
  return { centre, draw(s) {
    const ph = Math.floor(s * 4) % 2;
    cars.forEach((g, i) => {
      const C = COPS[i], [a, b] = C.k; let x, z, yaw;
      if (s < T.line0) {
        const u = eio(seg(s, a[0], b[0])), sk = seg(s, b[0] - 1.2, b[0]);
        if (C.c === 'z') { const zz = lerp(a[1], b[1], eo(seg(s, a[0], b[0]))); x = lerp(C.lane, C.park[0], ss(sk)); z = lerp(zz, C.park[1], ss(sk)); yaw = lerp(C.dir > 0 ? 0 : Math.PI, C.park[2], ss(sk)); }
        else { const xx = lerp(a[1], b[1], eo(seg(s, a[0], b[0]))); x = lerp(xx, C.park[0], ss(sk)); z = lerp(C.lane, C.park[1], ss(sk)); yaw = lerp(C.dir > 0 ? Math.PI / 2 : -Math.PI / 2, C.park[2], ss(sk)); }
        if (s < a[0]) { x = C.c === 'z' ? C.lane : a[1]; z = C.c === 'z' ? a[1] : C.lane; }
      } else {   // to the line
        const u = eio(seg(s, T.line0 + i * .35, T.line0 + 3.6 + i * .5)); const lx = i % 2 ? NS.nb : NS.sb + .2, lz = LINE(Math.floor(i / 2));
        x = lerp(C.park[0], lx, u); z = lerp(C.park[1], lz, u); yaw = lerp(C.park[2], Math.PI, Math.min(1, u * 1.6));
        const br = seg(s, T.line0 + 3.6 + i * .5 - .25, T.line0 + 3.6 + i * .5 + .3); z += Math.sin(br * Math.PI) * -.5;   // nose-dives into the line
      }
      g.position.set(x, 0, z); g.rotation.y = yaw; g.rotation.x = s > T.line0 + 3.4 + i * .5 && s < T.line0 + 4.1 + i * .5 ? .08 : 0;
      g.r.color.setScalar(policeOn(s) ? (ph ? 2 : .3) : .3).multiply(new THREE.Color(1, .12, .15)); g.b.color.setScalar(policeOn(s) ? (ph ? .3 : 2) : .3).multiply(new THREE.Color(.15, .3, 1));
    });
    extra.forEach((g, i) => { const u = eo(seg(s, T.line0 + 1 + i * .7, T.line0 + 6 + i * .7)); const lz = LINE(3 + Math.floor(i / 2)); const lx = i % 2 ? NS.nb : NS.sb + .2;
      g.position.set(lx, 0, lerp(46, lz, u)); g.rotation.y = Math.PI; g.visible = s > T.line0;
      g.r.color.setRGB(ph ? 2 : .3, .2, .2); g.b.color.setRGB(.1, .2, ph ? .4 : 2); });
    centre.set(0, 0, s < T.line0 ? 3 : lerp(3, -12, seg(s, T.line0, T.line0 + 4)));
  } };
}
export function makeHeli(scene) {
  const g = new THREE.Group(); scene.add(g);
  const body = sph(.9, std('#3d5a94', { roughness: .35, emissive: '#22385e', emissiveIntensity: .8 }), 0, 0, 0, 16); body.scale.set(1, .8, 1.6); g.add(body);
  g.add(box(.22, .22, 2.6, std('#1d2b4a'), 0, .1, -2.0)); g.add(box(.08, .6, .4, std('#1d2b4a'), 0, .4, -3.2));
  const glass = sph(.6, std('#9fd0ff', { roughness: .1, metalness: .3, emissive: '#204060' }), 0, .1, .8, 12); glass.scale.set(1, .8, 1); g.add(glass);
  for (const dx of [-.6, .6]) g.add(box(.08, .08, 1.8, std('#333'), dx, -.85, 0));
  const rotor = new THREE.Group(); rotor.position.y = .85; g.add(rotor); for (let k = 0; k < 2; k++) { const bl = box(5.2, .04, .22, std('#222'), 0, 0, 0); bl.rotation.y = k * Math.PI / 2; rotor.add(bl); }
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, .05, 6, 28), new THREE.MeshBasicMaterial({ color: '#9fe0ff', toneMapped: false })); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.6, 1); g.add(rim); }
  const blink = sph(.1, new THREE.MeshBasicMaterial({ color: '#ff3030', toneMapped: false }), 0, -.6, -3.2, 6); g.add(blink);
  const spot = new THREE.SpotLight('#eaf6ff', 0, 60, .13, .45, 1.0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0008; scene.add(spot, spot.target);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -.5, 0), new THREE.MeshBasicMaterial({ color: '#dff0ff', transparent: true, opacity: .025, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(cone);
  const tgt = V(), pos = V();
  return { pos, tgt, draw(s, thief) {
    const on = s > T.heli;
    // path: in from the top left, sweep the junction, then shadow the thief over the roofs; at the end it hangs, lost
    const hover = s => V(-8 + Math.sin(s * .5) * 3, 18, -4 + Math.cos(s * .4) * 2);
    const follow = s => { const p = thiefPos(Math.min(s, T.land) - .8); return V(p.x - 9, 20, p.z + 1); };
    const P = s < T.heli ? V(-60, 26, -50) : s < 12 ? V(-60, 26, -50).lerp(hover(12), eo(seg(s, T.heli, 12))) : s < T.fire0 ? hover(s) : s < T.land ? hover(s).lerp(follow(s), ss(seg(s, T.fire0, T.fire0 + 3))) : follow(s).lerp(V(4, 18.5, -9), ss(seg(s, T.land, T.land + 2.5)));
    pos.copy(P);
    g.position.copy(pos).add(V(0, Math.sin(s * 2.1) * .15, 0)); g.visible = on;
    rotor.rotation.y = s * 31; blink.visible = Math.floor(s * 1.5) % 2 === 0;
    // the searchlight target: sweeping the streets, then on (just behind) the thief; at the end it wanders lost
    let T_;
    if (s < T.turn) T_ = V(Math.sin(s * 1.3) * 8, 0, 6 + Math.cos(s * .9) * 6);
    else if (s < T.land) { const lag = s < T.fire0 ? .45 : .35; const p = thiefPos(s - lag); T_ = V(p.x, p.y, p.z); }
    else { const p = thiefPos(T.land - .35); T_ = V(p.x, p.y, p.z).lerp(V(4 + Math.sin(s * .7) * 6, VIA.h, -18 + Math.cos(s * .5) * 6), ss(seg(s, T.land, T.land + 2))); }
    tgt.copy(T_);
    g.rotation.set(s < 12 ? .15 : .05, s < 12 ? Math.atan2(52, 46) : Math.atan2(T_.x - pos.x, T_.z - pos.z), s > T.land + 2 ? Math.sin(s * 1.7) * .06 : 0);
    spot.position.copy(g.position).add(V(0, -.8, .6)); spot.target.position.copy(tgt); spot.target.updateMatrixWorld(); spot.intensity = on ? 220 : 0;
    const d = spot.position.distanceTo(tgt); cone.visible = on; cone.position.copy(spot.position); cone.scale.set(d * .14, d, d * .14); cone.lookAt(tgt); cone.rotateX(-Math.PI / 2);
  } };
}
// —— civilian traffic (7 cars): flowing, then braking and bumping into a jam ——
export function makeCivilians(scene) {
  const L = [
    { v: car(scene, { body: '#f2c21a', taxi: true }), c: 'z', lane: NS.nb, dir: -1, k: [[0, 30], [8.4, 9.6], [10.0, 9.2]] },
    { v: car(scene, { body: '#3c78c8', len: 4.4, truck: true }), c: 'z', lane: NS.nb, dir: -1, k: [[0, 42], [8.6, 14.4], [10.2, 13.6]] },
    { v: car(scene, { body: '#e6e8ea' }), c: 'z', lane: NS.sb, dir: 1, k: [[0, -34], [8.2, -4.0], [9.6, -3.4]] },
    { v: car(scene, { body: '#c8402a' }), c: 'z', lane: NS.sb, dir: 1, k: [[0, -46], [8.5, -8.6], [10.0, -7.6]] },
    { v: car(scene, { body: '#f2c21a', taxi: true }), c: 'x', lane: EW.eb, dir: 1, k: [[0, -40], [8.4, -9.4], [9.8, -8.6]] },
    { v: car(scene, { body: '#6a6e74' }), c: 'x', lane: EW.wb, dir: -1, k: [[0, 34], [8.8, 11.2], [10.4, 10.0]] },
    { v: car(scene, { body: '#2f8a5a' }), c: 'x', lane: EW.wb, dir: -1, k: [[0, 46], [9.0, 15.6], [10.6, 14.4]] },
  ];
  for (const o of L) o.f = monotone(o.k);
  return { list: L, draw(s) { for (const o of L) {
    const p = o.f(s), g = o.v, bump = Math.exp(-(((s - o.k[2][0]) * 6) ** 2)) * .12;
    if (o.c === 'z') { g.position.set(o.lane, 0, p); g.rotation.set(-bump * o.dir, o.dir > 0 ? 0 : Math.PI, 0); } else { g.position.set(p, 0, o.lane); g.rotation.set(0, o.dir > 0 ? Math.PI / 2 : -Math.PI / 2, bump); }
    if (s > o.k[2][0]) g.rotation.y += (hash(o.lane * 3 + o.k[0][1]) - .5) * .35;   // skewed after the bump
  } } };
}
// —— people: café customers run inside; passers-by freeze and turn to the bank ——
export function makePeople(scene) {
  const R = mulberry(4), cafe = [], walkers = [];
  for (let i = 0; i < 6; i++) { const f = figure({ top: ['#a84a3a', '#3a6a9a', '#8a7a3a', '#5a3a6a', '#3a8a6a', '#aa6a8a'][i] }); f.scale.setScalar(.95 * 1.35); const tx = CAFE.x0 + 1.2 + (i >> 1) * 2.3, tz = CAFE.z0 - 1.4 + (i % 2) * .9;
    f.position.set(tx, 0, tz); scene.add(f); cafe.push({ f, tx, tz, d: R() * .8 }); }
  for (let k = 0; k < 3; k++) { const x = CAFE.x0 + 1.6 + k * 2.3, z = CAFE.z0 - 1.0; const t = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .06, 14), std('#e8e4dc')); t.position.set(x, .75, z); scene.add(t); scene.add(cyl(.05, .05, .6, std('#333'), x, .45, z, 6)); }
  for (const [x, z, dx, c] of [[-10, 11.2, 1, '#7a5a3a'], [13, 11.1, -1, '#3a5a7a'], [-8, 15.6, 1, '#6a3a3a'], [-14, 7.0, 1, '#4a6a4a'], [10, -.4 + 7.4, -1, '#5a5a7a']]) { const f = figure({ top: c }); scene.add(f); walkers.push({ f, x, z, dx }); }
  return { draw(s) {
    cafe.forEach(({ f, tx, tz, d }) => { const u = seg(s, T.cafe + d, T.cafe + d + 1.6); f.visible = u < 1; f.position.set(tx + (CAFE.x0 + 3.5 - tx) * eio(u), 0, tz + (CAFE.z0 + .5 - tz) * eio(u));
      if (u > 0) { f.rotation.y = Math.atan2(CAFE.x0 + 3.5 - tx, CAFE.z0 + .5 - tz); walkCycle(f, s * 14, .9); f.body.rotation.x = 0; } else { stand(f); f.P.legL.rotation.x = f.P.legR.rotation.x = -1.5; f.body.position.y = -.45; f.rotation.y = Math.PI; f.P.head.rotation.y = s > T.boom + .3 ? -.8 : 0; } });
    walkers.forEach(({ f, x, z, dx }) => { const frozen = s > T.boom + .2; const xx = x + dx * Math.min(s, T.boom + .2) * 1.1 + (s > T.jam + 4 ? dx * (s - T.jam - 4) * 1.6 : 0); f.position.set(xx, 0, z);
      if (!frozen || s > T.jam + 4) { f.rotation.y = dx > 0 ? Math.PI / 2 : -Math.PI / 2; walkCycle(f, s * (s > T.jam + 4 ? 12 : 6), s > T.jam + 4 ? .9 : .4); } else { stand(f); const look = Math.atan2(0 - xx, BANK.z0 - z); f.rotation.y = lerp(dx > 0 ? Math.PI / 2 : -Math.PI / 2, look, ss(seg(s, T.boom + .2, T.boom + .6))); } });
  } };
}
// —— the train, the clock, the doors, the headlight ——
export function makeTrain(scene) {
  const g = new THREE.Group(); scene.add(g); const cars = [];
  const body = std('#d9dde3', { roughness: .35, metalness: .2 }), stripe = std('#2a6fd0'), win = new THREE.MeshBasicMaterial({ color: '#ffcf70', toneMapped: false }), roof = std('#9aa0a8', { metalness: .5, roughness: .4 });
  for (let i = 0; i < TRAIN.n; i++) { const c = new THREE.Group(); g.add(c); cars.push(c);
    c.add(box(TRAIN.car, 2.3, 2.4, body, 0, 1.55, 0)); c.add(box(TRAIN.car + .02, .25, 2.42, stripe, 0, 1.0, 0)); c.add(box(TRAIN.car * .96, .22, 2.0, roof, 0, 2.8, 0));
    for (let w = 0; w < 3; w++) for (const sd of [-1, 1]) c.add(box(.8, .7, .04, win, -TRAIN.car / 2 + .7 + w * 1.15, 1.9, sd * 1.21));
    for (const sd of [-1, 1]) c.add(box(.05, 1.4, .05, std('#888'), TRAIN.car / 2 - .3, 3.1, sd * .9)); // roof rail posts
    c.add(box(TRAIN.car * .7, .06, .06, std('#888'), 0, 3.0, .9)); }
  const doors = cars.map(c => { const d = box(.7, 1.6, .05, std('#bfc4ca'), .2, 1.45, 1.24); c.add(d); return d; });
  const head = new THREE.MeshBasicMaterial({ color: '#333', toneMapped: false }); const hl = box(.08, .35, .6, head, TRAIN.car / 2 + .05, 1.4, 0); cars[0].add(hl);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 12, 18, 1, true).rotateZ(Math.PI / 2).translate(-6.4, 0, 0), new THREE.MeshBasicMaterial({ color: '#fff1c8', transparent: true, opacity: .06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI; beam.position.set(TRAIN.car / 2 + .1, 1.4, 0); cars[0].add(beam);
  // the station clock 23:59 → 00:00
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const gc = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; let last = '';
  const SEG = { 0: 'abcdef', 2: 'abged', 3: 'abgcd', 5: 'afgcd', 9: 'abcdfg' };
  const digit = (d, x, y, w, h) => { const q = 14, P = { a: [x + q, y, w - 2 * q, q], b: [x + w - q, y + q, q, h / 2 - q], c: [x + w - q, y + h / 2, q, h / 2 - q], d: [x + q, y + h - q, w - 2 * q, q], e: [x, y + h / 2, q, h / 2 - q], f: [x, y + q, q, h / 2 - q], g: [x + q, y + h / 2 - q / 2, w - 2 * q, q] };
    for (const k of 'abcdefg') { gc.fillStyle = SEG[d].includes(k) ? '#ff3020' : '#2a0606'; gc.fillRect(...P[k]); } };
  const drawClock = (str, colon) => { const key = str + colon; if (key === last) return; last = key; gc.fillStyle = '#120202'; gc.fillRect(0, 0, 512, 192); gc.strokeStyle = '#444'; gc.lineWidth = 10; gc.strokeRect(5, 5, 502, 182);
    [40, 140, 290, 390].forEach((x, i) => digit(+str.replace(':', '')[i], x, 36, 82, 120)); gc.fillStyle = colon ? '#ff3020' : '#2a0606'; gc.fillRect(246, 70, 18, 18); gc.fillRect(246, 112, 18, 18); tex.needsUpdate = true; };
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); clock.position.set(-12, VIA.h + 4.6, VIA.z + VIA.w / 2 + 2.6); clock.rotation.x = -.7; scene.add(clock);
  clock.add(box(4.4, 1.8, .1, std('#222'), 0, 0, -.07));
  return { draw(s) {
    const f = trainFront(s);
    cars.forEach((c, i) => { const x = f - TRAIN.car / 2 - i * (TRAIN.car + TRAIN.gap); c.position.set(x, VIA.h + .05, VIA.z); c.visible = x - TRAIN.car / 2 < CLIFF.x0 - .1; c.position.y += Math.sin(s * 30 + i) * .015 * (s > T.depart ? 1 : 0); });
    const dc = ss(seg(s, T.doors, T.doors + .4)); doors.forEach(d => { d.position.x = .2 - .75 * (1 - dc); });
    const hon = s > T.headlight; head.color.set(hon ? '#ffffff' : '#333'); beam.visible = hon;
    drawClock(s < T.clock ? '23:59' : '00:00', (s % 1) < .5);
  }, carX: i => f => f };
}
// —— block 2's tanks (shiny), the leaning neon billboard on block 3 ——
export function makeRoofs(scene) {
  const inox = new THREE.MeshStandardMaterial({ color: '#dde1e6', roughness: .2, metalness: .9 });
  for (const [x, z] of [[11.0, -9.2], [11.4, -11.0], [6.6, -7.6]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.6, 18), inox); c.position.set(x, 12 + 1.2, z); c.castShadow = true; scene.add(c); scene.add(box(1.0, .4, 1.0, std('#555'), x, 12.2, z)); }
  const R = mulberry(3), clothes = [];
  for (let i = 0; i < 6; i++) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(.45, .6), std(['#e04a4a', '#3a7be0', '#f2d23a', '#ffffff', '#40b070', '#e07ad0'][i], { side: THREE.DoubleSide })); cl.geometry.translate(0, -.3, 0); const p = new THREE.Group(); p.position.set(6.0 + (i % 3) * .85 + (i > 2 ? 2.6 : 0) * 0, 13.45, -10.6 + (i % 3) * 1.0 + (i > 2 ? .4 : 0)); p.rotation.y = Math.PI / 2; p.add(cl); scene.add(p); clothes.push(p); }
  // the billboard: a big neon panel on legs, its face rising north at 45° (a ramp)
  const ad = canvasTex(512, 448, (g, w, h) => { g.fillStyle = '#0d0a1e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff4fc8'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#4ff0ff'; g.font = 'bold 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SODA', w / 2, h * .42);
    g.fillStyle = '#ffe04f'; g.font = 'bold 64px sans-serif'; g.fillText('★ FIZZ ★', w / 2, h * .74); });
  const len = Math.hypot(BOARD.z0 - BOARD.z1, BOARD.z0 - BOARD.z1);
  const mat = new THREE.MeshBasicMaterial({ map: ad, toneMapped: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, len), mat); panel.rotation.x = -Math.PI / 4; panel.position.set(BOARD.x, BOARD.y0 + (BOARD.z0 - BOARD.z1) / 2, (BOARD.z0 + BOARD.z1) / 2); scene.add(panel);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w + .2, len + .2), std('#222')); back.rotation.x = -Math.PI / 4; back.position.copy(panel.position).add(V(0, -.06, -.06)); scene.add(back);
  for (const dx of [-1.8, 1.8]) for (const [dz, h] of [[0, .3], [1.6, 2.0], [3.2, 3.6]]) scene.add(box(.12, h, .12, std('#3a3a3a'), BOARD.x + dx, 12 + h / 2, BOARD.z0 - dz - .2));
  const glow = new THREE.PointLight('#ff60d0', 10, 10, 1.5); glow.position.set(BOARD.x, 15, -14); scene.add(glow);
  return { draw(s) { clothes.forEach((p, i) => { p.rotation.x = .2 + Math.sin(s * 1.7 + i) * .2; }); const f = (.8 + .2 * vnoise(s * 6)) * (hash(Math.floor(s * 7)) > .95 ? .3 : 1); mat.color.setScalar(f * 1.3); glow.intensity = 10 * f; } };
}
// —— the orange street sweeper ——
export function makeSweeper(scene) {
  const g = new THREE.Group(); scene.add(g); const o = std('#ff8a1a', { roughness: .4 });
  g.add(box(1.6, 1.0, 2.6, o, 0, .9, -.2)); g.add(box(1.5, .9, 1.1, std('#1a2230', { metalness: .5, roughness: .15 }), 0, 1.75, .6)); g.add(box(1.0, .2, .3, new THREE.MeshBasicMaterial({ color: '#ffb020', toneMapped: false }), 0, 2.3, .4));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(.28, .28, .2, std('#111'), sx * .8, .3, sz * .85 - .2, 10).rotateZ(Math.PI / 2));
  const brushes = [-1, 1].map(sx => { const b = new THREE.Group(); b.position.set(sx * .85, .12, 1.25); g.add(b); for (let k = 0; k < 10; k++) { const br = box(.04, .05, .5, std('#f2c21a'), 0, 0, 0); br.rotation.y = k * .628; br.position.set(Math.sin(k * .628) * .25, 0, Math.cos(k * .628) * .25); b.add(br); } return b; });
  return { g, draw(s) { const u = seg(s, T.sweep0, T.black); g.visible = s > T.sweep0 - .1; g.position.set(lerp(-14, -.8, eo(u * 1.25)), 0, EW.eb + Math.sin(u * 6) * .12); g.rotation.y = Math.PI / 2; brushes.forEach((b, i) => { b.rotation.y = s * 14 * (i ? 1 : -1); }); } };
}
// —— reflections of the lights on the wet road (sprites where the camera ray to each light's mirror image meets the road) ——
export function makeGlints(scene, camera) {
  const tex = canvasTex(64, 256, (g, w, h) => { const gr = g.createRadialGradient(32, 128, 0, 32, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const N = 90, sp = makeSprites(scene, N, tex, { additive: true, fog: false }), cam = V();
  return { draw(list) { camera.getWorldPosition(cam); let i = 0;
    for (const [x, y, z, r, g, b, a, w] of list) { if (i >= N) break; const k = (cam.y - .2) / (cam.y + y); sp.set(i++, cam.x + (x - cam.x) * k, .22, cam.z + (z - cam.z) * k, w, w * 3, r, g, b, a); }
    while (i < N) sp.hide(i++); sp.commit(null); } };
}
