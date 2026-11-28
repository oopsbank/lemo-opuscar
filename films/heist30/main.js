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

// —— the recut: hard cuts between story slices (film start, story from, story to, speed, camera) ——
export const SEGS = [
  [0.00, .35, 3.55, 1, 'cu'], [3.20, 6.4, 12.2, 1, 'junc'], [9.00, 16.0, 20.6, 1, 'follow'], [13.60, 23.4, 28.9, 1, 'climb'],
  [19.10, 28.3, 29.9, 1, 'clock'], [20.70, 38.4, 43.55, 1, 'gap'], [25.85, 43.55, 44.0, .3, 'gap'], [27.35, 44.0, 49.7, 1, 'gap'], [33.05, 61.0, 63.5, 1, 'end'],
];
const segAt = t => { let i = 0; while (i < SEGS.length - 1 && t >= SEGS[i + 1][0]) i++; return SEGS[i]; };
const simR = t => { const g = segAt(t); return Math.min(g[2], g[1] + (t - g[0]) * g[3]); };
const invR = s => { for (const g of SEGS) if (s >= g[1] && s <= g[2]) return g[0] + (s - g[1]) / g[3]; return null; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(V(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const CLOCKP = V(-12, VIA.h + 4.6, VIA.z + VIA.w / 2 + 2.6);
const tpos = s => { const p = thiefPos(s); return V(p.x, p.y * .8, p.z); };
function shotCam(t) {
  const g = segAt(t), s = simR(t), k = seg(t, g[0], g[0] + (g[2] - g[1]) / g[3]); let look, az, pitch, dist;
  if (g[4] === 'cu') { look = V(0, 1.2, lerp(16.4, 13.6, k)); az = 10; pitch = lerp(44, 50, k); dist = lerp(24, 21, eio(k)); }
  else if (g[4] === 'junc') { look = V(1, 0, 5.5); az = 180; pitch = 56; dist = lerp(46, 42, k); }
  else if (g[4] === 'follow') { look = tpos(s).add(V(0, 0, -1.5)); az = 190; pitch = 58; dist = 34; }
  else if (g[4] === 'climb') { look = tpos(s); az = 192; pitch = lerp(46, 54, k); dist = 30; }
  else if (g[4] === 'clock') { look = CLOCKP.clone().add(V(0, -.6, 0)); az = 180; pitch = 34; dist = lerp(15, 13, k); }
  else if (g[4] === 'gap') { const land = s > T.land + .6 ? eio(seg(s, T.land + .6, T.land + 2.2)) : 0;
    look = V(4, 9, -17).lerp(tpos(s), .35 * (1 - land)).lerp(V(6, 7, -19), land); az = 184 - 4 * land; pitch = lerp(60, 64, land); dist = lerp(42, 52, land); }
  else { look = V(-1, 0, -.5); az = 180; pitch = 60; dist = lerp(64, 60, k); }
  let pos = orbit(look, az, pitch, dist);
  let sk = 0; for (const [s0, a] of [[T.boom, 1.0], [T.land, .5]]) { const u = s - s0; if (u > 0 && u < .7) sk += Math.exp(-u * 6) * a; }
  if (g[4] === 'junc') sk += .1;
  if (sk) pos.add(V(Math.sin(t * 61) * sk * .2, Math.cos(t * 53) * sk * .14, 0));
  return { pos, look, subj: look, close: g[4] === 'cu' || g[4] === 'clock' };
}
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g2 = ov.getContext('2d');
const SEG7 = { 0: 'abcdef', 2: 'abged', 3: 'abgcd', 5: 'afgcd', 9: 'abcdfg' };
function led(str, cx, cy, h, on) {
  const w = h * .55, q = h * .12, gap = h * .2; const ds = str.replace(':', ''); const tot = 4 * w + 3 * gap + gap * 1.4; let x = cx - tot / 2, y = cy - h / 2;
  g2.font = `900 ${Math.round(h * .22)}px sans-serif`; const lw = on ? g2.measureText(on).width : 0; const bw = Math.max(tot + h * .7, lw + h * .6);
  g2.fillStyle = 'rgba(8,4,6,.82)'; g2.beginPath(); g2.roundRect(cx - bw / 2, y - h * .3, bw, h * 1.6 + (on ? h * .3 : 0), h * .18); g2.fill();
  g2.strokeStyle = '#ff3a2a'; g2.lineWidth = 4; g2.stroke();
  g2.shadowColor = '#ff2a1a'; g2.shadowBlur = 24;
  [...ds].forEach((d, i) => { const X = x + i * (w + gap) + (i > 1 ? gap * 1.4 : 0);
    const P = { a: [X + q, y, w - 2 * q, q], b: [X + w - q, y + q, q, h / 2 - q], c: [X + w - q, y + h / 2, q, h / 2 - q], d: [X + q, y + h - q, w - 2 * q, q], e: [X, y + h / 2, q, h / 2 - q], f: [X, y + q, q, h / 2 - q], g: [X + q, y + h / 2 - q / 2, w - 2 * q, q] };
    for (const k of 'abcdefg') if (SEG7[d].includes(k)) { g2.fillStyle = '#ff3a26'; g2.fillRect(...P[k]); } });
  const cxn = x + 2 * (w + gap) - gap * .3; g2.fillStyle = '#ff3a26'; g2.fillRect(cxn, y + h * .28, q, q); g2.fillRect(cxn, y + h * .62, q, q);
  g2.shadowBlur = 0;
  if (on) { g2.fillStyle = '#ffffff'; g2.font = `900 ${Math.round(h * .22)}px sans-serif`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(on, cx, y + h * 1.4); }
}
function drawOverlay(t) { g2.clearRect(0, 0, W, H);
  if (t < 3.0) { const a = Math.min(1, t / .15, (3.0 - t) / .25); g2.globalAlpha = a; led('23:59', W / 2, H * .17, 150, 'LAST TRAIN AT MIDNIGHT'); g2.globalAlpha = 1; }
  if (t > 33.25) { const a = Math.min(1, (t - 33.25) / .15); g2.globalAlpha = a; led('00:00', W / 2, H * .17, 150, null); g2.globalAlpha = 1; }
}
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
const DUR30 = 35.5; window.DUR = DUR30; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR30 - 1e-4); const s = simR(t);
  thief.draw(s, t); police.draw(s); lights.draw(s, thief.state, police.centre); lamps.draw(s); heli.draw(s, thief.state); civ.draw(s); people.draw(s); train.draw(s); roofs.draw(s); sweeper.draw(s);
  const c = placeCam(t);
  bank.draw(s, camera, scene); glints.draw(lightsOf(s, t));
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.close ? 220 : 700; dof.maxCoc = 12;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .3, .7), w: .26, amp: 9, mix: .55 });
  if (QS.has('nodof')) dof.maxCoc = 0;
  post.composer.render();
  drawOverlay(t);
};
// —— events (film seconds) for the sound ——
const EV = [], ev = (t, type, o = {}) => { if (t != null && t >= 0 && t <= DUR30) EV.push({ t: +t.toFixed(4), type, ...o }); };
SEGS.forEach((g, i) => ev(g[0], 'cut', { i, s0: g[1], s1: g[2], k: g[3], cam: g[4] }));
for (const [k, v] of Object.entries(T)) if (typeof v === 'number') ev(invR(v), k);
for (let t = 0; t < DUR30; t += 1 / 12) { const c = placeCam(t); ev(t, 'cam', { d: +camera.position.distanceTo(c.look).toFixed(1) }); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.TEXTS = () => [];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
