// The Last Train Heist — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps), wordless, SFX only. The user's own script.
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { DUR, T, VIA, CAFE, TRAIN, CLIFF, BANK, sim, invSim, SLOW, trainFront, thiefPos, lastCarX } from './story.js';
import { buildScene, LAMPS } from './scene.js';
import { makeLights, makeLamps, makeBank, makeThief, makePolice, makeHeli, makeCivilians, makePeople, makeTrain, makeRoofs, makeSweeper, makeGlints, alarm, policeOn } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.45;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#070b16'); scene.fog = new THREE.FogExp2('#0e1730', .0038);
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 700);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, taps: +(QS.get('taps') || 64), ao: false });
post.bloom.strength = .8; post.bloom.threshold = .6; post.bloom.radius = .5;
const GR = post.grade.uniforms; GR.sat.value = 1.2; GR.contrast.value = .4; GR.warm.value = 0; GR.amt.value = .42; GR.tint.value.set(.92, .98, 1.08);
{ const env = new THREE.Scene(); env.background = new THREE.Color('#0b1220'); const add = (c, x, y, z, s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); env.add(m); };
  add('#ffb060', -20, 18, 30, 6); add('#4060a0', 0, 60, -40, 30); add('#ff60c0', 30, 14, -30, 4); add('#60d0ff', 30, 10, 20, 4);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, .02).texture; scene.environmentIntensity = .6; }

buildScene(scene);
const lights = makeLights(scene), lamps = makeLamps(scene), bank = makeBank(scene), thief = makeThief(scene), police = makePolice(scene), heli = makeHeli(scene);
const civ = makeCivilians(scene), people = makePeople(scene), train = makeTrain(scene), roofs = makeRoofs(scene), sweeper = makeSweeper(scene), glints = makeGlints(scene, camera);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— camera: the whole map; a push onto the blocks (keeping the train in view); closer on the gap for the jump; back out ——
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(V(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist) => ({ look, az, pitch, dist });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)));
const WIDE = P(V(1.5, 0, -2.5), 180, 60, 98);
const ROOFS = P(V(6.5, 7, -7.5), 184, 58, 62);
const GAP = P(V(4, 9, -17), 184, 64, 50);
const DIVE = P(V(6, 7, -19), 180, 66, 62);
const END = P(V(1.5, 0, -2.5), 180, 60, 98);
const SWEEP = P(V(-1, 0, 1.5), 180, 60, 78);
function shotCam(t) {
  const s = sim(t); let p;
  if (t < 20) p = WIDE;
  else if (t < 36) p = mixP(WIDE, ROOFS, eio(seg(t, 20, 23.5)));
  else if (t < invSim(T.land) + .6) p = mixP(ROOFS, GAP, eio(seg(t, 36, 39.5)));
  else if (t < invSim(T.flash) + .8) p = mixP(GAP, DIVE, eio(seg(t, invSim(T.land) + .6, invSim(T.land) + 2.2)));
  else if (t < 60.4) p = mixP(DIVE, END, eio(seg(t, invSim(T.flash) + .8, invSim(T.flash) + 5)));
  else p = mixP(END, SWEEP, eio(seg(t, 60.4, 63.6)));
  // follow the thief a little on the roofs
  if (t > 20 && t < invSim(T.land) + 1) { const tp = thiefPos(s), k = .3 * seg(t, 20, 24) * (1 - seg(t, invSim(T.land) - .5, invSim(T.land) + 1)); p = P(p.look.clone().lerp(V(tp.x, tp.y * .6, tp.z), k), p.az, p.pitch, p.dist); }
  let pos = orbit(p.look, p.az, p.pitch, p.dist);
  let sk = 0; for (const [t0, a] of [[invSim(T.boom), 1.2], [invSim(T.land), .5], [12.6, .25], [12.9, .25], [13.4, .25]]) { const u = t - t0; if (u > 0 && u < .7) sk += Math.exp(-u * 6) * a; }
  if (t > 6 && t < 20) sk += .08;   // the script: a slight shake with the action
  if (sk) pos.add(V(Math.sin(t * 61) * sk * .25, Math.cos(t * 53) * sk * .18, 0));
  return { pos, look: p.look, subj: p.look };
}
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g2 = ov.getContext('2d');
function drawOverlay(t) { g2.clearRect(0, 0, W, H); if (t >= T.black) { g2.fillStyle = '#000'; g2.fillRect(0, 0, W, H); } }
const proj = new THREE.Vector3(), toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function placeCam(t) { const c = shotCam(t); camera.position.copy(c.pos); camera.lookAt(c.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld(); return c; }
const lightsOf = (s, t) => {
  const out = [];
  LAMPS.forEach(([x, z], i) => { const c = lamps.color(s, i); out.push([x, 4.75, z, c[0], c[1], c[2], .55, 1.6]); });
  if (thief.state.visible) out.push([thief.state.x, thief.state.y + 1.8, thief.state.z, .2, 1, .85, .7, 1.6]);
  const ph = Math.floor(s * 4) % 2;
  if (policeOn(s)) { const c = police.centre; out.push([c.x - 2, 2, c.z, 1, .1, .15, ph ? .8 : .2, 3], [c.x + 2, 2, c.z + 1, .15, .3, 1, ph ? .2 : .8, 3]); }
  const f = trainFront(s); for (let i = 0; i < TRAIN.n; i++) { const x = f - TRAIN.car / 2 - i * (TRAIN.car + TRAIN.gap); if (x < CLIFF.x0 - 1) out.push([x, VIA.h + 1.9, VIA.z + 1.2, 1, .8, .4, .35, 2]); }
  out.push([(CAFE.x0 + CAFE.x1) / 2, 2, CAFE.z0 - .5, 1, .75, .45, .4, 2.6], [-12, VIA.h + 3, VIA.z + 3, 1, .8, .5, .3, 3]);
  return out;
};
window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4); const s = sim(t);
  thief.draw(s, t); police.draw(s); lights.draw(s, thief.state, police.centre); lamps.draw(s); heli.draw(s, thief.state); civ.draw(s); people.draw(s); train.draw(s); roofs.draw(s); sweeper.draw(s);
  const c = placeCam(t);
  bank.draw(s, camera, scene); glints.draw(lightsOf(s, t));
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = 700; dof.maxCoc = 12;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .3, .7), w: .26, amp: 9, mix: .55 });
  if (QS.has('nodof')) dof.maxCoc = 0;
  post.composer.render();
  drawOverlay(t);
};
// —— events (film seconds) for the sound ——
const EV = [], ev = (t, type, o = {}) => { if (t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
for (const [k, v] of Object.entries(T)) if (typeof v === 'number') ev(k === 'black' ? v : invSim(v), k);
ev(SLOW.t0, 'slow0'); ev(SLOW.t1, 'slow1');
[[6.0, 12.5, -.6], [6.4, 12.6, .7], [6.8, 13.2, -.9], [7.0, 13.0, .9], [7.6, 13.8, -.8], [7.9, 14.2, .8]].forEach(([a, b, pan], i) => { ev(a, 'siren', { i, pan, end: b }); ev(b - .9, 'skid', { i, pan }); });
[9.9, 10.1, 10.2, 10.4, 10.6, 10.8].forEach((t, i) => ev(t, 'bump', { i }));
for (let k = 0; k < 10; k++) ev(invSim(T.line0 + 3.6 + (k % 6) * .5 + (k > 5 ? 1.4 : 0)), 'lineBump', { k });
for (let s = T.fire0; s < T.fire1; s += .18) ev(s, 'clank');
for (let s = T.depart + 1.6; s < T.tunnel + 1.5; s += Math.max(.22, 1.2 / (1 + (s - T.depart) * .5))) ev(invSim(s), 'wheel');
for (let t = 0; t < DUR; t += 1 / 12) { const c = placeCam(t); ev(t, 'cam', { d: +camera.position.distanceTo(c.look).toFixed(1) }); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.TEXTS = () => [];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
