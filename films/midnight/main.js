// Midnight Crossing — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps), wordless. The user's own script.
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, hash } from '/core/lib.js';
import { DUR, T, LAMP, CART, VEND, STORE, SIG, HOLE, COAT, MAN, RAIL, TRAIN, noseX, walkerPos } from './story.js';
import { buildScene } from './scene.js';
import { makeLights, makeSigns, makeCrossing, makePeople, makePigeons, makeRoofs, makeTraffic, makeTrain, makeInk, makeManhole, makeFX, flashOn, lampOn } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.45;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#070a12');
scene.fog = new THREE.FogExp2('#101a2e', .0042);
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 600);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') || 1), msaa: 4, taps: +(QS.get('taps') || 64), ao: false });
post.bloom.strength = .85; post.bloom.threshold = .62; post.bloom.radius = .55;
const GR = post.grade.uniforms; GR.sat.value = 1.25; GR.contrast.value = .4; GR.warm.value = 0; GR.amt.value = .45; GR.tint.value.set(.92, .98, 1.08);
// a dim night environment for the wet reflections
{ const env = new THREE.Scene(); env.background = new THREE.Color('#0b1220');
  const add = (c, x, y, z, s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); env.add(m); };
  add('#ffb060', -20, 18, 30, 6); add('#4060a0', 0, 60, -40, 30); add('#ff60c0', 30, 14, -30, 4); add('#60d0ff', 30, 10, 20, 4);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, .02).texture; scene.environmentIntensity = .6; }

buildScene(scene);
const lights = makeLights(scene), signs = makeSigns(scene), crossing = makeCrossing(scene), people = makePeople(scene), pigeons = makePigeons(scene), roofs = makeRoofs(scene);
const traffic = makeTraffic(scene), train = makeTrain(scene), ink = makeInk(scene), hole = makeManhole(scene);
// every light that should be mirrored in the wet road: [x, y, z, r, g, b, alpha, width]
const lightsOf = t => {
  const out = [];
  if (lampOn(t)) out.push([LAMP.hx, LAMP.h - .3, LAMP.hz, 1, .72, .4, .9, 3.2]);
  out.push([CART.x, 2.2, CART.z, 1, .6, .25, .6, 2.4], [VEND.x, 1.2, VEND.z + .4, .35, .85, 1, .6, 1.8], [STORE.x1 + .3, 2.4, 15.5, .85, .9, 1, .5, 2.2], [11.5, 2.4, 13.9, .4, 1, .6, .45, 2], [10.6, 8.4, -8.1, 1, .35, .8, .2 * (.6 + .4 * Math.sin(t * 7)), 1.4]);
  if (flashOn(t)) { const ph = crossing.phase(t); SIG.forEach((s, i) => out.push([s.x + (i ? -.45 : .45) * (ph ? 1 : -1) * (i ? -1 : 1), 2.55, s.z, 1, .12, .06, .6, .9])); }
  for (const o of traffic.list) { const g = o.v, f = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion); const L = g.len / 2;
    out.push([g.position.x + f.x * L, .65, g.position.z + f.z * L, 1, .95, .8, .6, 1.3], [g.position.x - f.x * L, .68, g.position.z - f.z * L, 1, .15, .1, .5, 1.0]); }
  if (t > T.light && t < T.tail) { const nx = noseX(t); out.push([Math.max(nx, -13), 1.6, RAIL.z, .8, .95, 1, .8 * ss(seg(t, T.light, T.enter)), 3]);
    for (let k = 1; k < 6; k++) { const x = nx - TRAIN.loco - k * 7; if (x > -14 && x < 14) out.push([x, 2, RAIL.z + 1.1, .4, .9, 1, .35, 2.4]); } }
  return out;
};
const fx = makeFX(scene, camera, lightsOf);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— camera: the locked 65° wide; a slow push in (24–38); the wide again for the train with a rumble; back out; a quick glance
//    down to the manhole for the last 3 s ——
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(V(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
const WIDE = P(V(0, 0, -.8), 180, 60, 80, 34);
const PUSH = P(V(1.2, 0, 2.2), 180, 60, 50, 34);
const TRN = P(V(0, 0, .6), 180, 60, 66, 34);
const HOLEP = P(V(HOLE.x - .6, 0, HOLE.z - .6), 196, 52, 11, 34);
function shotCam(t) {
  let p, band = { w: .2, amp: 11, mix: .5 }, aper = 900;
  if (t < T.push0) p = WIDE;
  else if (t < T.light) p = mixP(WIDE, PUSH, eio(seg(t, T.push0, T.push1)));
  else if (t < T.sigOff) p = mixP(PUSH, TRN, eio(seg(t, T.light, T.enter + .4)));
  else if (t < T.glance0) p = mixP(TRN, WIDE, eio(seg(t, T.sigOff, T.sigOff + 4)));
  else { const k = eio(seg(t, T.glance0, T.glance1)); p = mixP(WIDE, HOLEP, k); band = { w: lerp(.2, .26, k), amp: lerp(11, 9, k), mix: .5 }; aper = lerp(900, 160, k); }
  // a very slow breathing drift (the diorama is alive), and the train's rumble
  const look = p.look.clone().add(V(Math.sin(t * .21) * .15, 0, Math.cos(t * .17) * .12));
  let pos = orbit(look, p.az, p.pitch, p.dist);
  const rum = t > T.enter - .5 && t < T.tail + .3 ? .05 * ss(seg(t, T.enter - .5, T.enter + .5)) * (1 - seg(t, T.tail - .5, T.tail + .3)) : 0;
  if (rum) pos.add(V(Math.sin(t * 71) * rum, Math.sin(t * 57) * rum * .6, Math.cos(t * 63) * rum));
  if (t > T.bar1 && t < T.bar1 + .3) pos.y += Math.sin((t - T.bar1) * 60) * .04 * (1 - seg(t, T.bar1, T.bar1 + .3));
  return { pos, look, fov: p.fov, up: V(0, 1, 0), subj: look, band, aper };
}
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g2 = ov.getContext('2d');
function drawOverlay(t) { g2.clearRect(0, 0, W, H); if (t >= T.black) { g2.fillStyle = '#000'; g2.fillRect(0, 0, W, H); } }
const proj = new THREE.Vector3(), toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function placeCam(t) {
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.subj = c.look.clone(); c.aper = 1; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return c;
}
window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4); const frame = Math.round(t * 24);
  lights.draw(t); signs.draw(t); crossing.draw(t); people.draw(t, frame); pigeons.draw(t); roofs.draw(t); traffic.draw(t); train.draw(t); hole.draw(t);
  const c = placeCam(t);
  const w = walkerPos(t); ink.draw(t, { x: w.x, z: w.z });
  fx.draw(t, traffic);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 14;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .2, .8), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  post.composer.render();
  drawOverlay(t);
};
// —— events for the mix and the score ——
const EV = [], ev = (t, type, o = {}) => { if (t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
for (const [k, v] of Object.entries(T)) if (typeof v === 'number') ev(v, k);
for (let t = T.sig; t < T.sigOff; t += 1 / 3) ev(t, 'ding', { i: Math.round((t - T.sig) * 3) % 2 });
for (let k = 0; k < TRAIN.n + 1; k++) { const x0 = k === 0 ? 0 : TRAIN.loco + TRAIN.gap + (k - 1) * (TRAIN.coach + TRAIN.gap); const L = k === 0 ? TRAIN.loco : TRAIN.coach; for (const off of [.9, L - .9]) ev(T.enter + (12.5 + x0 + off) / TRAIN.v, 'wheel', { k }); }
for (let t = 0; t < DUR; t += 1 / 12) { const c = placeCam(t); ev(t, 'cam', { d: +camera.position.distanceTo(c.look).toFixed(1) }); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.TEXTS = () => [];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
