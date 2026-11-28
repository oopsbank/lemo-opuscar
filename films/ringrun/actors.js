// The Ring Run — everything that moves: the ring (sparkle + trail), the groom, the pigeon, the flower girl and her bike, the kid's
// scooter, tram 7, the boat, the fisherman and the fish, the rat, the sheet, apples, the crowd, the chapel inside (pews, guests,
// bride, priest, grate, stained light, doors), the clock hands, petals, confetti and the golden trail.
import * as THREE from 'three';
import { canvasTex, makeSprites, dotTex } from './sprites.js';
import { clamp, seg, lerp, ss, eio, eo, hash, vnoise, mulberry } from '/core/lib.js';
import { std, box, sph, cyl, figure, walkCycle, stand } from './kit.js';
import { T, MID, TOP, STREET, HOTEL, RAIL_, BOX, LINE, AWN, FIRE, CURVE, HOLE, PIPE, PIPEPTS, OUTFALL, STAIRS, CANAL, BRIDGE, CHAPEL, TOWER, ROSE, GRATE, ALTAR, FISH,
  bikeX, railAt, tramD, boatX, BOATZ, ringPos } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const starTex = () => canvasTex(128, 128, g => { g.translate(64, 64); for (const [r, w, a] of [[60, 4, 1], [34, 3, .7]]) for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 4 * (r === 60 ? 2 : 1) + (r === 60 ? 0 : Math.PI / 4)); const gr = g.createLinearGradient(-r, 0, r, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,240,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-r, -w / 2, 2 * r, w); g.restore(); }
  const c = g.createRadialGradient(0, 0, 0, 0, 0, 22); c.addColorStop(0, 'rgba(255,255,230,1)'); c.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = c; g.fillRect(-22, -22, 44, 44); });
// —— the tram ——
export function makeTram(scene) {
  const g = new THREE.Group(); scene.add(g); const yel = std('#f2c230', { roughness: .3, metalness: .1 });
  g.add(box(2.2, 2.3, 7.2, yel, 0, 1.45, 0)); g.add(box(2.24, .7, 6.4, std('#2a3a50', { roughness: .1, metalness: .5 }), 0, 1.9, 0)); g.add(box(2.0, .12, 7.0, std('#e8e2d4'), 0, 2.66, 0));
  g.add(box(2.24, .25, 7.24, std('#c83a3a'), 0, .5, 0));
  const tex = canvasTex(256, 96, c => { c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#ffd040'; c.font = 'bold 60px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TRAM 7', 128, 52); });
  for (const s of [1, -1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .5), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(0, 2.45, s * 3.62); if (s < 0) m.rotation.y = Math.PI; g.add(m); }
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .64), new THREE.MeshBasicMaterial({ map: tex })); top.rotation.x = -Math.PI / 2; top.rotation.z = Math.PI / 2; top.position.set(0, 2.73, 1.2); g.add(top);
  const pole = new THREE.Group(); pole.position.set(0, 2.72, 1.6); g.add(pole); const pb = box(.08, .08, 3.2, std('#555'), 0, 0, -1.6); pb.rotation.x = .5; pb.position.set(0, .8, -1.4); pole.add(pb);
  const driver = figure({ top: '#3a5a8a', hair: '#888' }); driver.position.set(0, .3, 3.0); driver.scale.setScalar(1.0); g.add(driver);
  const roofAt = (t, lx, lz) => { const p = railAt(tramD(t) + lx), h = V(Math.sin(p.yaw), 0, Math.cos(p.yaw)), r = V(-Math.cos(p.yaw), 0, Math.sin(p.yaw)); return { x: p.x + r.x * lz, y: MID + 2.8, z: p.z + r.z * lz }; };
  return { g, roofAt, poleTop: t => { const p = railAt(tramD(t) + 1.6); return V(p.x, MID + 3.9, p.z); },
    draw(t) { const p = railAt(tramD(t)); g.position.set(p.x, MID, p.z); g.rotation.y = p.yaw; g.visible = t > 10 && t < 30; } };
}
// —— the ring: a gold torus with a diamond, a star flash and a sparkly trail ——
export function makeRing(scene, tram) {
  const gold = new THREE.MeshStandardMaterial({ color: '#ffcf40', emissive: '#a86a00', emissiveIntensity: .7, roughness: .15, metalness: 1 });
  const ring = new THREE.Group(); scene.add(ring); const tor = new THREE.Mesh(new THREE.TorusGeometry(.2, .065, 10, 26), gold); ring.add(tor);
  const dia = new THREE.Mesh(new THREE.OctahedronGeometry(.09), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#bfefff', emissiveIntensity: 1.2, roughness: 0, metalness: .2 })); dia.position.y = .26; ring.add(dia);
  const star = makeSprites(scene, 1, starTex(), { additive: true, fog: false }), trail = makeSprites(scene, 40, dotTex(), { additive: true, fog: false });
  const boxG = new THREE.Group(); scene.add(boxG); boxG.position.set(BOX.x, BOX.y - .14, BOX.z);
  boxG.add(box(.6, .26, .5, std('#b8202a', { roughness: .9 }), 0, 0, 0)); const lid = box(.6, .06, .5, std('#b8202a', { roughness: .9 }), 0, 0, -.25); lid.geometry.translate(0, 0, .25); lid.position.set(0, .14, -.25); lid.rotation.x = -1.9; boxG.add(lid);
  const cur = V();
  return { ring, cur, draw(t, cam, q) {
    const p = q || ringPos(t, tram); cur.set(p.x, p.y, p.z);
    const vis = p.mode !== 'hidden' && p.mode !== 'hand'; ring.visible = vis;
    ring.position.set(p.x, p.y + (p.mode === 'box' ? .05 : 0), p.z); ring.scale.setScalar(p.mode === 'box' ? 1 : 1.25);
    if (p.mode === 'box') ring.rotation.set(-.3, 0, 0); else if (p.mode === 'roll') ring.rotation.set(0, Math.PI / 2 + (p.wob ? Math.sin(t * 9) * .4 * seg(t, T.wobble, T.catch) : 0), p.spin || 0);
    else ring.rotation.set((p.spin || 0) * .7, p.spin || 0, (p.spin || 0) * .4);
    // star flash: brief glints, and a steady sparkle while flying
    const glint = Math.pow(Math.max(0, Math.sin(t * 3.1 + hash(Math.floor(t * 1.3)) * 6)), 8);
    const sz = vis ? (p.mode === 'fly' ? 1.4 : .9) * (.7 + glint * 1.2) * (p.slow ? 1.4 : 1) : 0;
    if (sz) star.set(0, p.x, p.y + .25, p.z, sz, sz, 1, .95, .7, .9, t * .8); else star.hide(0); star.commit(null);
    // trail: the last 40 positions while flying
    for (let i = 0; i < 40; i++) { const tt = t - i * .03, q2 = ringPos(tt, tram); const on = vis && q2.mode === 'fly' && p.mode === 'fly' && tt > 0;
      if (on) trail.set(i, q2.x, q2.y + .1, q2.z, .25 * (1 - i / 40), .25 * (1 - i / 40), 1, .85, .4, .8 * (1 - i / 40)); else trail.hide(i); }
    trail.commit(null);
    boxG.visible = t < 2 || t > T.loop;
  } };
}
// —— the groom (white shirt, red bow) ——
const GP = (t, tram) => {
  if (t < T.fall0) return { x: 3.6, y: TOP, z: -13.4, yaw: Math.PI, m: 'bow' };
  if (t < 4.2) return { x: lerp(3.6, 2.7, seg(t, T.fall0, 2.3)), y: TOP, z: lerp(-13.4, -12.85, seg(t, T.fall0, 2.3)), yaw: 0, m: 'despair' };
  if (t < 4.9) { const u = seg(t, 4.2, 4.9); return { x: lerp(2.7, 9.6, u), y: TOP, z: -12.7, yaw: Math.PI / 2, m: 'run' }; }
  if (t < 5.2) { const u = seg(t, 4.9, 5.2); return { x: 9.6, y: TOP + Math.sin(u * Math.PI) * .8, z: lerp(-12.7, FIRE.z + .1, u), yaw: 0, m: 'jump' }; }
  if (t < 10.4) { const u = (t - 5.2) / 5.2 * 4, k = Math.min(3, Math.floor(u)), f = u - k, dir = k % 2 ? 1 : -1, xa = dir > 0 ? FIRE.x0 : FIRE.x1, xb = dir > 0 ? FIRE.x1 : FIRE.x0;
    return { x: lerp(xa, xb, f), y: TOP - (k + f) * 3.5, z: FIRE.z + .2, yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2, m: 'run' }; }
  if (t < 12) { const u = seg(t, 10.4, 12); return { x: lerp(FIRE.x0 + .3, 6.2, u), y: MID, z: lerp(-10.6, -2.9, u), yaw: Math.atan2(6.2 - 7.7, 7.7), m: 'run' }; }
  const sc = (x, z, yaw) => ({ x, y: MID, z, yaw, m: 'scoot' });
  if (t < 16) { const u = seg(t, 12, 16); return sc(lerp(6.2, -14.5, u), lerp(-2.9, -3.6, u), -Math.PI / 2); }
  if (t < 17) { const u = seg(t, 16, 17), a = u * Math.PI; return sc(-14.5 - Math.sin(a) * 1.2, -3.6 - (1 - Math.cos(a)) * .7, -Math.PI / 2 - a); }
  if (t < T.board) { const u = seg(t, 17, T.board); const r = tram.roofAt(T.board, -3.9, 0); return sc(lerp(-14.5, r.x, u), lerp(-5.0, r.z, u), Math.PI / 2); }
  if (t < T.roof) { const u = seg(t, T.board, T.roof), r = tram.roofAt(t, -3.4, 0); return { x: r.x, y: lerp(MID + .4, r.y, u), z: r.z, yaw: railAt(tramD(t)).yaw, m: 'climb' }; }
  if (t < T.slip + .8) { const lx = lerp(-3.2, -.9, ss(seg(t, T.roof, T.lunge))), lz = lerp(0, .9, ss(seg(t, T.lunge - .4, T.lunge + .2))), r = tram.roofAt(t, lx, lz);
    return { x: r.x, y: r.y - .05, z: r.z, yaw: railAt(tramD(t)).yaw, m: t > T.lunge ? 'lunge' : 'crawl' }; }
  if (t < T.kneel1) { const u = seg(t, T.slip + .8, T.kneel1), a = tram.roofAt(T.slip + .8, -.9, .9); return { x: lerp(a.x, HOLE.x - .7, u), y: lerp(a.y, MID, u) + Math.sin(u * Math.PI) * .6, z: lerp(a.z, HOLE.z + .5, u), yaw: Math.PI / 2, m: 'jump' }; }
  if (t < T.pipe0) return { x: HOLE.x - .7, y: MID, z: HOLE.z + .5, yaw: Math.PI / 2, m: 'kneel' };
  const ST = (STAIRS.x0 + STAIRS.x1) / 2;
  if (t < 27.7) { const u = seg(t, T.pipe0, 27.7); return { x: lerp(HOLE.x - .7, ST, u), y: MID, z: lerp(HOLE.z + .5, -1.2, u), yaw: Math.PI * .7, m: 'run' }; }
  if (t < 30.6) { const u = seg(t, 27.7, 30.6), z = lerp(-1, 7.2, u); return { x: ST, y: Math.max(0, MID - Math.max(0, z + 1)), z, yaw: 0, m: 'run' }; }
  if (t < 31.8) { const u = seg(t, 30.6, 31.8); return { x: lerp(ST, PIPE.x + .9, u), y: 0, z: lerp(7.2, 7.4, u), yaw: -Math.PI / 2, m: 'run' }; }
  if (t < T.run) return { x: PIPE.x + .9, y: 0, z: 7.4, yaw: 0, m: t < T.kneel2 ? 'stand' : 'kneel' };
  if (t < T.jump) { const u = seg(t, T.run, T.jump), x = lerp(PIPE.x + .9, BRIDGE.x, u), onB = Math.max(0, 1 - Math.abs(x - BRIDGE.x) / 2); return { x, y: 2.1 * onB, z: lerp(7.4, 9.9, ss(seg(u, .6, 1))), yaw: Math.PI / 2, m: 'run' }; }
  if (t < T.boat) { const u = seg(t, T.jump, T.boat); return { x: lerp(BRIDGE.x, boatX(T.boat), u), y: 2.1 + Math.sin(u * Math.PI) * 1.4 - u * 1.6, z: lerp(9.9, BOATZ, u), yaw: -Math.PI / 2, m: 'jump' }; }
  if (t < T.landing + .2) return { x: boatX(t) + .3, y: .55, z: BOATZ, yaw: -Math.PI / 2, m: 'stand' };
  if (t < 43.6) { const u = seg(t, T.landing + .2, 43.6); return { x: lerp(boatX(T.landing) + .3, CHAPEL.door, u), y: lerp(.55, .5, u), z: lerp(BOATZ, CHAPEL.z0 - 1, u), yaw: 0, m: 'run' }; }
  if (t < T.door) return { x: CHAPEL.door, y: 0, z: CHAPEL.z0 - 3, yaw: 0, m: 'hide' };
  if (t < T.slide0) return { x: CHAPEL.door, y: 0, z: CHAPEL.z0 + .7 + seg(t, T.door + .9, T.slide0) * 1.6, yaw: 0, m: t < T.door + .9 ? 'stand' : 'run' };
  if (t < T.catch + .3) { const u = eo(seg(t, T.slide0, T.catch)); return { x: CHAPEL.door + .15 * u, y: 0, z: lerp(CHAPEL.z0 + 2.3, GRATE.z - .9, u), yaw: 0, m: 'slide' }; }
  return { x: CHAPEL.door + .15, y: 0, z: GRATE.z - .9, yaw: 0, m: t > T.ring2 ? 'standAlt' : 'kneel' };
};
export function makeGroom(scene, tram) {
  const f = figure({ top: '#ffffff', legs: '#2a2e3a', hair: '#3a2a1a' }); scene.add(f);
  const bow = new THREE.Group(); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 4), new THREE.MeshBasicMaterial({ color: '#ff1a2a', toneMapped: false })); w.rotation.z = s * Math.PI / 2; w.position.x = s * .08; bow.add(w); }
  bow.position.set(0, 1.38, .16); f.body.add(bow);
  const scooter = new THREE.Group(); scooter.add(box(.18, .06, .9, std('#3ac0e0'), 0, .18, 0)); scooter.add(box(.05, 1.0, .05, std('#888'), 0, .7, .38)); scooter.add(box(.5, .05, .05, std('#888'), 0, 1.18, .38));
  for (const z of [-.38, .38]) scooter.add(cyl(.1, .1, .08, std('#222'), 0, .1, z, 10).rotateZ(Math.PI / 2)); scene.add(scooter); scooter.scale.setScalar(1.35);
  const kid = figure({ top: '#f0a030', legs: '#3a5a8a' }); kid.scale.setScalar(.9); scene.add(kid);
  const petals = makeSprites(scene, 60, dotTex(), {}); const R = mulberry(5), PP = Array.from({ length: 60 }, () => ({ a: R() * 6.28, d: R() }));
  const state = { x: 0, y: 0, z: 0, m: '' };
  return { f, state, draw(t) {
    const p = GP(t, tram); Object.assign(state, p); f.visible = p.m !== 'hide'; f.position.set(p.x, p.y, p.z); f.rotation.set(0, p.yaw, 0); f.body.rotation.set(0, 0, 0); f.body.position.y = 0;
    stand(f); f.P.head.rotation.set(0, 0, 0);
    const ph = t * 13;
    if (p.m === 'run') walkCycle(f, ph, .9); else if (p.m === 'bow') { f.P.armL.rotation.x = f.P.armR.rotation.x = -2.6; f.P.armL.rotation.z = .5; f.P.armR.rotation.z = -.5; }
    else if (p.m === 'despair') { f.P.armL.rotation.x = f.P.armR.rotation.x = -2.9; f.P.armL.rotation.z = .9; f.P.armR.rotation.z = -.9; f.body.rotation.x = .35; }
    else if (p.m === 'jump') { walkCycle(f, 1.2, 1.1); f.P.armL.rotation.x = f.P.armR.rotation.x = -2.4; }
    else if (p.m === 'scoot') { f.P.armL.rotation.x = f.P.armR.rotation.x = -1.2; f.body.rotation.x = .15; f.position.y += .35; }
    else if (p.m === 'climb') { walkCycle(f, ph * .8, .7); f.P.armL.rotation.x = -2.6; }
    else if (p.m === 'crawl' || p.m === 'lunge') { f.body.rotation.x = 1.3; f.body.position.y = -.85; walkCycle(f, ph * .6, .5); if (p.m === 'lunge') { f.body.rotation.x = 1.5; f.P.armL.rotation.x = f.P.armR.rotation.x = -2.9; } }
    else if (p.m === 'kneel') { f.P.legL.rotation.x = f.P.legR.rotation.x = -1.4; f.body.position.y = -.5; f.body.rotation.x = .45; f.P.head.rotation.x = .5; if (t > T.catch && t < T.ring2) { f.body.rotation.x = .15; f.P.armR.rotation.x = -1.4; f.P.head.rotation.x = -.2; } }
    else if (p.m === 'slide') { f.P.legL.rotation.x = f.P.legR.rotation.x = -1.4; f.body.position.y = -.5; f.body.rotation.x = -.1; f.P.armL.rotation.x = f.P.armR.rotation.x = -1.8; f.P.armR.rotation.x = -1.4 - .4 * seg(t, T.catch - .6, T.catch); }
    else if (p.m === 'standAlt') { f.rotation.y = Math.PI * .1; if (t > T.out) { f.P.armL.rotation.x = f.P.armR.rotation.x = -.4; } }
    // the scooter and the kid
    const sc = p.m === 'scoot'; scooter.visible = sc || t < 12; if (sc) { scooter.position.set(p.x, MID, p.z); scooter.rotation.y = p.yaw; } else if (t < 12) { scooter.position.set(6.2, MID, -2.9); scooter.rotation.y = -Math.PI / 2; }
    kid.position.set(6.2 + (t > 12 ? .9 : 0), MID + (t < 12 ? .35 : 0), t < 12 ? -2.9 : -2.2); kid.rotation.y = t < 12 ? -Math.PI / 2 : 0; stand(kid); if (t > 12 && t < 13.2) { kid.P.armL.rotation.z = kid.P.armR.rotation.z = Math.sin((t - 12) * 6) * .5; }
    // petals: a burst when he lands in the boat; a comet tail on the slide; thrown at 60.4
    for (let i = 0; i < 60; i++) { const q = PP[i]; let on = false, x, y, z, a;
      if (t > T.boat && t < T.boat + 1.6) { const u = (t - T.boat) / 1.6; x = boatX(T.boat) + Math.cos(q.a) * u * 2.4; z = BOATZ + Math.sin(q.a) * u * 1.6; y = .8 + u * 2.6 - u * u * 3; a = 1 - u; on = true; }
      else if (t > T.slide0 && t < T.catch + 1) { const tt = T.slide0 + q.d * (Math.min(t, T.catch) - T.slide0), gp = GP(tt, tram), age = t - tt; if (age < 2.2) { x = gp.x + Math.cos(q.a) * .5 * age; z = gp.z - .3; y = .2 + Math.abs(Math.sin(q.a)) * .6 * Math.exp(-age); a = 1 - age / 2.2; on = true; } }
      if (on) petals.set(i, x, y, z, .16, .16, 1, .98, .95, a); else petals.hide(i); }
    petals.commit(null);
  } };
}
// —— the pigeon ——
export function makePigeon(scene, tram, groomState, ringCur) {
  const g = new THREE.Group(); scene.add(g); const body = sph(.24, std('#9aa0ac', { roughness: .5 }), 0, 0, 0, 14); body.scale.set(1, .85, 1.45); g.add(body);
  const neck = sph(.15, std('#7a6aa8', { roughness: .3, metalness: .3, emissive: '#2a5a5a', emissiveIntensity: .3 }), 0, .17, .22, 12); g.add(neck);
  const head = sph(.12, std('#8a909c'), 0, .32, .3, 12); g.add(head); g.add(box(.05, .04, .1, std('#e0a030'), 0, .3, .42));
  const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .16, .06, 0); const w = new THREE.Mesh(new THREE.PlaneGeometry(.55, .32), std('#858b96', { side: THREE.DoubleSide })); w.rotation.x = -Math.PI / 2; w.position.x = s * .27; p.add(w); g.add(p); return p; });
  g.scale.setScalar(1.25);
  const perch = (x, y, z) => ({ x, y, z, fly: 0 });
  const path = t => {
    if (t < T.land) { const u = seg(t, -1, T.land); return { x: BOX.x - .5 - (1 - u) * 3, y: BOX.y - .05 + (1 - u) * 2, z: BOX.z - .1, fly: 1, yaw: Math.PI / 2 }; }
    if (t < 4.2) return { ...perch(BOX.x - .5, BOX.y - .05, BOX.z - .1), yaw: Math.PI / 2 };
    if (t < 16) { const gp = groomState; return { x: gp.x - 1.4 + Math.sin(t * 1.3) * .5, y: gp.y + 3 + Math.sin(t * 2) * .3, z: gp.z - .6, fly: 1, yaw: gp.yaw }; }
    if (t < 22.2) { const p = tram.poleTop(t); return { x: p.x, y: p.y + .2, z: p.z, fly: t < 16.5 ? 1 : 0, yaw: railAt(tramD(t)).yaw }; }
    if (t < T.flick) return { x: 6, y: 18 + Math.sin(t) * 2, z: 0, fly: 1, yaw: 0 };
    if (t < T.rose + .3) { const r = ringCur; return { x: r.x + .9, y: r.y + .4, z: r.z - .5, fly: 1, yaw: -Math.PI / 2 }; }
    if (t < T.door) return { x: CHAPEL.door, y: 30, z: 0, fly: 1, yaw: 0 };
    if (t < T.steal) { const gp = groomState; return { x: gp.x, y: gp.y + 3.05 + (gp.m === 'kneel' || gp.m === 'slide' ? -.65 : 0), z: gp.z, fly: t > T.slide0 && t < T.catch ? .5 : 0, yaw: Math.PI }; }
    if (t < T.out) { const u = eio(seg(t, T.steal + .3, T.out)), a = { x: ALTAR.x - .35, y: 1.6, z: ALTAR.z - .5 }; return { x: lerp(a.x, ROSE.x, u), y: lerp(a.y, ROSE.y, u), z: lerp(a.z, ROSE.z, u), fly: t > T.steal + .3 ? 1 : 0, yaw: Math.PI }; }
    return { x: ROSE.x, y: ROSE.y + 3, z: ROSE.z - 6, fly: 1, yaw: Math.PI };
  };
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(.16, .05, 8, 20), new THREE.MeshStandardMaterial({ color: '#ffd860', emissive: '#a07000', emissiveIntensity: .8, metalness: 1, roughness: .15 })); scene.add(ring2);
  return { draw(t) {
    const p = path(t); g.position.set(p.x, p.y, p.z); g.rotation.set(0, p.yaw || 0, 0); g.visible = t < 62 || t > T.ring2 - .5;
    const f = p.fly ? Math.sin(t * 30) * .9 : 0; wings[0].rotation.z = f; wings[1].rotation.z = -f;
    head.position.y = .32 + (t > T.peck - .15 && t < T.peck + .1 ? -.12 : 0) + (t > T.steal - .1 && t < T.steal + .15 ? -.15 : 0); head.rotation.z = t < T.peck ? Math.sin(t * 4) * .3 : 0;
    // the second ring: in the bride's palm → in the pigeon's beak → out of the window
    ring2.visible = t > T.ring2 && t < T.out + .5; const bp = V(ALTAR.x - .35, 1.45, ALTAR.z - .55);
    if (t < T.steal) ring2.position.copy(bp); else ring2.position.set(p.x, p.y + .38, p.z + .5); ring2.rotation.set(1.2, t * 2, 0);
  } };
}
// —— the flower girl and her bike (west along the street) ——
export function makeBike(scene) {
  const g = new THREE.Group(); scene.add(g); const girl = figure({ top: '#f2a0b0', legs: '#f2e0c0', hair: '#8a4a2a', dress: '#f2a0b0' }); girl.scale.setScalar(1.2); girl.position.y = .25; g.add(girl);
  girl.P.legL.rotation.x = -1.0; girl.P.armL.rotation.x = girl.P.armR.rotation.x = -1.2;
  g.add(box(.08, .08, 1.6, std('#3a7ac0'), 0, .65, 0)); for (const z of [-.7, .7]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.34, .04, 6, 18), std('#333')); w.rotation.y = Math.PI / 2; w.position.set(0, .36, z); g.add(w); }
  const basket = box(.6, .35, .5, std('#c89a58'), 0, 1.0, .95); g.add(basket);
  for (let k = 0; k < 7; k++) { const fl = new THREE.Group(); fl.position.set((k % 3 - 1) * .18, 1.3 + (k % 2) * .08, .85 + Math.floor(k / 3) * .14); fl.add(cyl(.11, .11, .04, std('#ffd020'), 0, 0, 0, 12)); fl.add(cyl(.05, .05, .05, std('#6a3a1a'), 0, .01, 0, 8)); g.add(fl); }
  const sunfl = makeSprites(scene, 12, dotTex(), {});
  return { g, draw(t) {
    const x = t < T.basket ? 1.0 + 2.0 * (T.basket - t) : bikeX(t); g.position.set(x, MID, STREET.bike); g.rotation.set(0, -Math.PI / 2, 0); g.visible = t < 22 || (t > T.crane0 && t < T.crane1 + .5);
    if (t > T.pothole && t < T.pothole + .5) g.position.y += Math.sin(seg(t, T.pothole, T.pothole + .5) * Math.PI) * .35;
    girl.P.legL.rotation.x = -1.0 + Math.sin(t * 8) * .5; girl.P.legR.rotation.x = -1.0 - Math.sin(t * 8) * .5;
    if (t > T.crane0) { g.position.set(-6, MID, STREET.bike); girl.P.armL.rotation.x = girl.P.armR.rotation.x = -2.9; }
    for (let i = 0; i < 12; i++) { const u = (t - T.crane0 - 1.5 - i * .05) / 1.4; if (u > 0 && u < 1 && t > T.crane0) sunfl.set(i, -6 + Math.cos(i) * u * 2, MID + 2 + u * 3 - u * u * 4, STREET.bike + Math.sin(i) * u * 2, .3, .3, 1, .85, .1, 1 - u); else sunfl.hide(i); }
    sunfl.commit(null);
  } };
}
// —— the boat, the fisherman and the fish, the rat, the sheet, the apples, the crowd ——
export function makeCanal(scene) {
  const boat = new THREE.Group(); scene.add(boat);
  boat.add(box(4.2, .5, 1.6, std('#f4f0e8'), 0, .1, 0)); boat.add(box(4.0, .1, 1.4, std('#c8a070'), 0, .36, 0));
  for (let k = 0; k < 24; k++) boat.add(sph(.14, std('#ffffff', { roughness: .6 }), -1.6 + (k % 8) * .45, .5, -.5 + Math.floor(k / 8) * .5, 8));
  const ban = canvasTex(512, 96, c => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#e05a7a'; c.font = 'bold 64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('JUST MARRIED', 256, 52); });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .6), new THREE.MeshBasicMaterial({ map: ban, side: THREE.DoubleSide })); banner.position.set(0, 1.4, .82); boat.add(banner);
  for (const x of [-1.6, 1.6]) boat.add(box(.05, 1.3, .05, std('#888'), x, .95, .82));
  const rower = figure({ top: '#4a7ab0' }); rower.position.set(1.6, .3, 0); rower.rotation.y = -Math.PI / 2; boat.add(rower);
  const fisher = figure({ coat: '#ffd21a', hood: '#ffd21a', legs: '#3a4a6a' }); scene.add(fisher); fisher.position.set(BRIDGE.x, 1.55, 9.2); fisher.rotation.y = -Math.PI / 2;
  fisher.P.legL.rotation.x = fisher.P.legR.rotation.x = -1.4; fisher.body.position.y = -.4;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, 3.2, 6), std('#5a4a3a')); rod.geometry.translate(0, 1.6, 0); scene.add(rod);
  const lineG = new THREE.BufferGeometry().setFromPoints([V(), V()]); const line = new THREE.Line(lineG, new THREE.LineBasicMaterial({ color: '#ffffff' })); scene.add(line);
  const fish = new THREE.Group(); const fb = sph(.25, std('#ff8a3a', { roughness: .3 }), 0, 0, 0, 12); fb.scale.set(1.6, .8, .5); fish.add(fb); const tail = box(.25, .3, .04, std('#ff8a3a'), -.45, 0, 0); fish.add(tail); scene.add(fish);
  const rat = new THREE.Group(); const rb = sph(.18, std('#8a8a90'), 0, 0, 0, 10); rb.scale.set(1.5, .9, 1); rat.add(rb); rat.add(box(.4, .03, .03, std('#c09090'), -.4, 0, 0)); scene.add(rat);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2, 6, 4), std('#ffffff', { side: THREE.DoubleSide, roughness: .8 })); sheet.castShadow = true; scene.add(sheet); const sb = sheet.geometry.getAttribute('position').array.slice();
  const apples = Array.from({ length: 14 }, () => { const a = sph(.13, std('#e0283a', { roughness: .35 }), 0, 0, 0, 8); scene.add(a); return a; });
  const crowd = []; const R = mulberry(12);
  for (let i = 0; i < 26; i++) { const c = new THREE.Group(); c.add(cyl(.2, .26, .9, std(['#f08a8a', '#8ac8f0', '#a0d890', '#f0d080', '#c0a0e0', '#f0b0d0'][i % 6]), 0, .7, 0, 8)); c.add(sph(.17, std('#e8c09a'), 0, 1.3, 0, 8)); c.scale.setScalar(1.3); scene.add(c);
    crowd.push({ c, x0: -30 + R() * 60, z: R() < .5 ? STREET.z0 - .9 + R() * .6 : STREET.z1 + .2 + R() * .6, v: (R() < .5 ? -1 : 1) * (1.2 + R()) * 1.5, ph: R() * 6 }); }
  return { boat, draw(t, groom) {
    boat.position.set(boatX(t), CANAL.y + .15 + Math.sin(t * 2) * .04, BOATZ); boat.rotation.y = 0; boat.visible = t > 35.5 && (t < T.landing + 6 || t > T.crane0);
    if (t > T.crane0) boat.position.x = CHAPEL.door + .5;
    rower.P.armL.rotation.x = rower.P.armR.rotation.x = -1.2 + Math.sin(t * 6) * .6;
    // the fisherman's rod: bends and jerks up at the hook
    const tip = V(BRIDGE.x - 2.3, 3.6, 9.6); const pull = seg(t, T.hook, T.hook + .5) * (1 - seg(t, T.flick + .2, T.flick + 1.2));
    rod.position.set(BRIDGE.x - .3, 2.4, 9.3); rod.rotation.set(0, 0, 1.1 - pull * .5 - (t > T.crane0 + 2.5 && t < T.crane1 ? .3 : 0));
    const end = rod.localToWorld(V(0, 3.2, 0)); rod.updateMatrixWorld();
    const fy = t > T.hook && t < T.flick + .4 ? lerp(CANAL.y, FISH.y - .6, eo(seg(t, T.hook, T.hook + .7))) : CANAL.y - .3;
    lineG.setFromPoints([end, V(FISH.x, fy + .3, FISH.z)]); fish.visible = t > T.hook && t < T.flick + .9; fish.position.set(FISH.x, fy, FISH.z);
    if (t > T.flick) { const u = seg(t, T.flick, T.flick + .9); fish.position.y = lerp(fy, CANAL.y, u); fish.rotation.z = u * 4; } else fish.rotation.z = Math.sin(t * 25) * .4;
    tail.rotation.y = Math.sin(t * 30) * .5;
    fisher.P.armL.rotation.x = fisher.P.armR.rotation.x = -1.3 - pull * .6; if (t > T.crane0 + 2.5 && t < T.crane1) { fisher.P.armR.rotation.x = -3; }
    // the rat in the pipe channel
    rat.visible = t > 27.4 && t < 30; rat.position.set(PIPE.x + .3, 3.8 + (t > 28.6 ? Math.sin(seg(t, 28.6, 29.2) * Math.PI) * .6 : 0), .9 + (t > 28.6 ? seg(t, 28.6, 29.2) * .8 : 0)); rat.rotation.y = Math.PI / 2;
    // the sheet: on the line → a parachute → over the groom's head → pulled off and fluttering down
    const pa = sheet.geometry.getAttribute('position');
    if (t < T.line) { sheet.position.set(.5, LINE.y - .55, LINE.z + .05); sheet.rotation.set(0, 0, 0); }
    else if (t < T.sheet) { const u = seg(t, T.line, T.sheet), gp = GP(T.sheet, null); sheet.position.set(lerp(.5, gp.x, u), lerp(LINE.y - .55, gp.y + 2.0, u), lerp(LINE.z + .05, gp.z, u)); sheet.rotation.set(-Math.PI / 2 + Math.sin(t * 3) * .3, 0, Math.sin(t * 2) * .3); }
    else if (t < T.sheet + .9) { sheet.position.set(groom.x, groom.y + 2.0, groom.z); sheet.rotation.set(-Math.PI / 2, 0, 0); }
    else { const u = seg(t, T.sheet + .9, T.sheet + 4), gp = GP(T.sheet + .9, null); sheet.position.set(gp.x + u * 2, lerp(gp.y + 2, MID + .05, u), gp.z + u * 1.5); sheet.rotation.set(-Math.PI / 2 + (1 - u) * Math.sin(t * 4) * .5, 0, 0); }
    if (t > T.crane0) { sheet.position.set(.5, LINE.y - .55, LINE.z + .05); sheet.rotation.set(0, 0, Math.sin(t * 5) * .25); }
    for (let i = 0; i < pa.count; i++) { const x = sb[i * 3], y = sb[i * 3 + 1]; pa.setZ(i, Math.sin(t * 6 + x * 3 + y * 2) * .08 + (t > T.line && t < T.sheet ? -(x * x + y * y) * .25 : 0)); } pa.needsUpdate = true; sheet.geometry.computeVertexNormals();
    sheet.visible = t < 12.5 || t > T.crane0;
    // apples
    apples.forEach((a, i) => { const u = t - T.apples - i * .04; a.visible = u > 0 && t < 30; if (!a.visible) return; const d = Math.min(u, 3); a.position.set(-12.6 + i * .12 + d * (1.6 + (i % 4) * .4), MID + .13 + Math.abs(Math.sin(d * 5)) * .3 * Math.exp(-d * 2), -1.3 - d * (.8 + (i % 3) * .5)); });
    // the crowd (1.5× speed)
    for (const p of crowd) { let x = p.x0 + p.v * t; x = ((x + 40) % 80 + 80) % 80 - 40; p.c.position.set(x, MID + Math.abs(Math.sin(t * 9 + p.ph)) * .06, p.z); p.c.visible = t < 30 || t > T.crane0; }
  } };
}
// —— the chapel inside: pews, guests, bride, priest, the grate, stained light, the doors, confetti ——
export function makeChapel(scene, roof) {
  const C = CHAPEL, grp = new THREE.Group(); scene.add(grp);
  grp.add(Object.assign(box(1.8, .02, C.z1 - C.z0 - 1.5, std('#c8283a', { roughness: .9 }), C.door, .05, (C.z0 + C.z1) / 2 - .2), { castShadow: false }));
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .7), new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, g => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#5a5a60'; for (let i = 0; i < 12; i++) g.fillRect(i * 11 + 2, 0, 5, 64); }), metalness: .6, roughness: .5 }));
  grate.rotation.x = -Math.PI / 2; grate.position.set(GRATE.x, .07, GRATE.z); grp.add(grate);
  grp.add(box(4, .3, 1.4, std('#e8e2d4'), ALTAR.x, .15, ALTAR.z + .5)); grp.add(box(2.2, 1.1, .8, std('#f8f4ec'), ALTAR.x, .85, C.z1 - 1.0));
  for (const dx of [-.7, .7]) grp.add(cyl(.05, .05, .5, std('#d8b040'), ALTAR.x + dx, 1.65, C.z1 - 1.0, 6));
  const R = mulberry(21), guests = [];
  for (let r = 0; r < 5; r++) for (const side of [-1, 1]) { const z = C.z0 + 3.2 + r * 1.3, x0 = side < 0 ? C.x0 + .8 : C.door + 1.2, x1 = side < 0 ? C.door - 1.2 : C.x1 - .8;
    grp.add(box(x1 - x0, .5, .4, std('#a87a4a'), (x0 + x1) / 2, .45, z + .25)); grp.add(box(x1 - x0, .8, .12, std('#a87a4a'), (x0 + x1) / 2, .7, z + .48));
    for (let k = 0; k < 3; k++) { const f = figure({ top: ['#f08a8a', '#8ac8f0', '#a0d890', '#f0d080', '#c0a0e0', '#f0b0d0', '#9ab0c0'][(r * 6 + k * 2 + (side > 0 ? 1 : 0)) % 7], hair: ['#3a2a1a', '#8a5a2a', '#d0b070', '#222'][k % 4] });
      f.scale.setScalar(1.0); const x = lerp(x0 + .4, x1 - .4, k / 2); f.position.set(x, .2, z); f.P.legL.rotation.x = f.P.legR.rotation.x = -1.4; f.body.position.y = -.0; grp.add(f);
      if (R() < .4) { const hat = cyl(.25, .25, .05, std(['#f0d0e0', '#d0e0f0', '#f0e0a0'][k % 3]), 0, .16, 0, 12); f.P.head.add(hat); }
      guests.push({ f, x, z, r }); } }
  const bride = figure({ dress: '#ffffff', legs: '#fff', hair: '#5a3a1a' }); bride.position.set(ALTAR.x - .7, .3, ALTAR.z - .3); bride.rotation.y = Math.PI; grp.add(bride);
  const veil = sph(.28, std('#ffffff', { transparent: true, opacity: .6 }), 0, .1, -.08, 12); bride.P.head.add(veil);
  const priest = figure({ coat: '#2a2a3a', hair: '#ccc' }); priest.position.set(ALTAR.x + .3, .3, ALTAR.z + .4); priest.rotation.y = Math.PI; grp.add(priest);
  priest.add(box(.3, .1, .05, std('#fff'), 0, 1.4, .2));
  // stained-glass light pools on the floor; windows glowing on the walls; the rose window inside
  const pools = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: ['#ff6a6a', '#6a8aff', '#ffd040'][k % 3], transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(k % 2 ? C.x1 - 2.4 : C.x0 + 2.4, .08, C.z0 + 4 + Math.floor(k / 2) * 2.4); grp.add(m); pools.push(m); }
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.1, 1.8), new THREE.MeshBasicMaterial({ color: ['#ff6a6a', '#6a8aff', '#ffd040'][k] })); m.position.set(s < 0 ? C.x0 + .42 : C.x1 - .42, 3.4, C.z0 + 4 + k * 2.4); m.rotation.y = Math.PI / 2; grp.add(m); }
  const rose = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, g => { for (let k = 0; k < 12; k++) { g.fillStyle = ['#ff7a8a', '#7aa0ff', '#ffd060', '#90e0a0'][k % 4]; g.beginPath(); g.moveTo(64, 64); g.arc(64, 64, 62, k * .5236, (k + 1) * .5236); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 14, 0, 7); g.fill(); }), side: THREE.DoubleSide }));
  rose.position.set(ROSE.x, ROSE.y, ROSE.z - .03); scene.add(rose);
  // the doors (north wall), and confetti
  const doors = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(C.door + s * 1.1, 0, C.z0 + .2); const d = box(1.1, 2.6, .12, std('#8a5a3a'), -s * .55, 1.3, 0); p.add(d); scene.add(p); return p; });
  const conf = makeSprites(scene, 120, dotTex(), {}), CR = mulberry(8), CP = Array.from({ length: 120 }, () => ({ x: (CR() - .5) * 8, z: (CR() - .5) * 6, v: .8 + CR(), c: ['#ff6a8a', '#ffd040', '#6ad0ff', '#a0f080', '#ffffff'][CR() * 5 | 0] }));
  const cc = new THREE.Color();
  return { grp, draw(t, inside, ringZ) {
    roof.visible = !inside;
    const dOpen = t > T.door ? eo(seg(t, T.door, T.door + .25)) : 0; doors.forEach((p, i) => { p.rotation.y = (i ? 1 : -1) * dOpen * 1.9; });
    guests.forEach(({ f, x, z, r }, i) => { const look = seg(t, T.turn + r * .25, T.turn + r * .25 + .4) * (1 - seg(t, T.slide0 + 2, T.slide0 + 3)); const toRing = Math.atan2(CHAPEL.door - x, (ringZ ?? z) - z) * look;
      f.P.head.rotation.y = t > T.door ? Math.atan2(CHAPEL.door - x, -3) * (1 - seg(t, T.slide0 + 3, T.catch)) : toRing + (t > T.out && t < T.out + 3 ? Math.PI * .9 * seg(t, T.out, T.out + .3) : 0);
      f.P.armL.rotation.x = f.P.armR.rotation.x = t > T.cheer && t < T.crane0 ? -2.8 + Math.sin(t * 9 + i) * .3 : -.8; });
    bride.P.armL.rotation.x = bride.P.armR.rotation.x = t > T.cheer && t < T.crane0 ? -2.2 : -.9; bride.P.armL.rotation.z = .2; bride.P.armR.rotation.z = -.2;
    if (t > T.ring2 && t < T.steal) bride.P.armR.rotation.x = -1.3;
    bride.rotation.y = Math.PI + (t > T.dong - .4 && t < T.crane0 ? -.4 : 0);
    priest.P.armR.rotation.x = t > T.ring2 - .4 && t < T.steal ? -1.3 : -.4;
    pools.forEach((m, k) => { m.material.opacity = .2 + .05 * Math.sin(t + k); });
    for (let i = 0; i < 120; i++) { const p = CP[i], u = (t - T.cheer - (i % 10) * .03) / 3.5; if (u > 0 && u < 1) { cc.set(p.c); conf.set(i, ALTAR.x + p.x * (.3 + u), 4.5 - u * 4.2 * p.v + Math.sin(u * 20 + i) * .1, ALTAR.z - 2 + p.z * (.3 + u * .7), .15, .15, cc.r, cc.g, cc.b, 1 - u * .6, u * 10 + i); } else conf.hide(i); }
    conf.commit(null);
  } };
}
// —— the clock faces (south and north of the tower) and their hands ——
export function makeClock(scene) {
  const face = canvasTex(256, 256, g => { g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#2a3a5a'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 1; k <= 12; k++) { const a = k / 12 * Math.PI * 2; g.fillText(['I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][k - 1], 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); } });
  const cx = (TOWER.x0 + TOWER.x1) / 2, cy = 26.5, faces = [];
  for (const [z, ry] of [[TOWER.z1 + .02, 0], [TOWER.z0 - .02, Math.PI]]) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshStandardMaterial({ map: face, roughness: .5, emissive: '#fff4d0', emissiveIntensity: .25 })); m.position.set(cx, cy, z); m.rotation.y = ry; scene.add(m);
    const hh = box(.14, .85, .04, std('#1a2030'), 0, .42, .03), mh = box(.09, 1.25, .04, std('#1a2030'), 0, .62, .05); hh.geometry.translate(0, .42, 0); hh.position.y = 0; mh.geometry.translate(0, .62, 0); mh.position.y = 0;
    const H = new THREE.Group(), M = new THREE.Group(); H.add(hh); M.add(mh); m.add(H, M); faces.push({ H, M }); }
  return { pos: V(cx, cy, TOWER.z1), draw(t) {
    let min = 59 + (t < T.clock0 ? 0 : t < T.dong ? Math.min(.92, seg(t, T.clock0, T.dong) * .9) + (t > T.dong - .6 ? Math.sin(t * 40) * .04 : 0) : 1);   // 11:59 → (trembling) → 12:00
    if (t > T.dong && t < T.dong + .25) min = 60 + Math.sin(seg(t, T.dong, T.dong + .25) * Math.PI) * .3;
    for (const f of faces) { f.M.rotation.z = -min / 60 * Math.PI * 2; f.H.rotation.z = -(11 + min / 60) / 12 * Math.PI * 2; }
  } };
}
// —— the pipe channel (a mossy half-pipe down the terrace wall and across the quay), the manhole, the splash ——
export function makePipe(scene) {
  const g = new THREE.Group(); scene.add(g); const moss = new THREE.MeshStandardMaterial({ color: '#4a6a50', roughness: .9, side: THREE.DoubleSide });
  const seg_ = (a, b) => { const A = V(...a), B = V(...b), L = A.distanceTo(B); const c = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, L, 16, 1, true, Math.PI / 2, Math.PI), moss); c.position.copy(A).add(B).multiplyScalar(.5); c.lookAt(B); c.rotateX(Math.PI / 2); g.add(c); };
  seg_(PIPEPTS[1], PIPEPTS[2]); seg_(PIPEPTS[2], PIPEPTS[3]);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(.6, 7.2), new THREE.MeshBasicMaterial({ color: '#7ac8b0', transparent: true, opacity: .5 })); water.rotation.x = -Math.PI / 2; water.position.set(PIPE.x, 1.0, 4.1); g.add(water);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .05, 20), std('#4a4a4e', { metalness: .6, roughness: .4 })); hole.position.set(HOLE.x, MID + .03, HOLE.z); scene.add(hole);
  const ripples = makeSprites(scene, 8, canvasTex(64, 64, c => { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 28, 0, 7); c.stroke(); }), { additive: true });
  return { draw(t) { for (let i = 0; i < 8; i++) { const u = (t - T.splash - i * .3) / 2; if (u > 0 && u < 1) ripples.set(i, PIPE.x + .4, CANAL.y + .02, 10.2, .4 + u * 3, .2 + u * 1.5, 1, 1, 1, .7 * (1 - u)); else ripples.hide(i); } ripples.commit(null); } };
}
// —— the golden trail: the ring's journey redrawn from above (62–67 s) ——
export function makeTrail(scene, tram) {
  const N = 260, sp = makeSprites(scene, N, dotTex(), { additive: true, fog: false }), pts = [];
  for (let i = 0; i < N; i++) { const t = T.peck + (T.catch - T.peck) * i / (N - 1); const p = ringPos(t, tram); pts.push(p.mode === 'hidden' && t > T.splash ? { x: lerp(PIPE.x + .4, FISH.x, (t - T.splash) / (T.hook - T.splash)), y: CANAL.y + .1, z: lerp(10.2, FISH.z, (t - T.splash) / (T.hook - T.splash)) } : p); }
  return { draw(t) { const u = seg(t, T.crane0 + .6, T.crane1 - .6); for (let i = 0; i < N; i++) { const k = i / (N - 1), on = t > T.crane0 && t < T.crane1 + .2 && k < u; const p = pts[i];
    if (on) { const head = Math.max(0, 1 - (u - k) * 12); sp.set(i, p.x, p.y + .2, p.z, 1.6 + head * 2.4, 1.6 + head * 2.4, 1, .82, .3, 1); } else sp.hide(i); } sp.commit(null); } };
}
