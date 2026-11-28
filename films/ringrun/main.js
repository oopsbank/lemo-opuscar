// The Ring Run — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps), wordless; on-screen text in English.
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { DUR, T, MID, TOP, BOX, HOTEL, CHAPEL, ALTAR, BRIDGE, FISH, PIPE, CANAL, TOWER, STREET, bikeX, railAt, tramD, boatX } from './story.js';
import { buildScene, OUT } from './scene.js';
import { makeTram, makeRing, makeGroom, makePigeon, makeBike, makeCanal, makeChapel, makeClock, makePipe, makeTrail } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#bfe0f2'); scene.fog = new THREE.FogExp2('#d8ecf6', .0035);
const camera = new THREE.PerspectiveCamera(34, W / H, .3, 800);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, taps: 64, ao: false });
post.bloom.strength = .35; post.bloom.threshold = .92; post.bloom.radius = .4;
const GR = post.grade.uniforms; GR.sat.value = 1.15; GR.contrast.value = .3; GR.warm.value = .25; GR.amt.value = .22;
scene.add(new THREE.HemisphereLight('#d8ecff', '#e8d6bc', 1.3));
const sun = new THREE.DirectionalLight('#fff1da', 3.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.normalBias = .04; scene.add(sun, sun.target);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function setSun(focus, span) { sun.position.copy(focus).add(V(-30, 60, 40)); sun.target.position.copy(focus); sun.target.updateMatrixWorld(); Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix(); }

buildScene(scene);
const tram = makeTram(scene), ring = makeRing(scene, tram), groom = makeGroom(scene, tram), pigeon = makePigeon(scene, tram, groom.state, ring.cur);
const bike = makeBike(scene), canal = makeCanal(scene), chapel = makeChapel(scene, OUT.roof), clock = makeClock(scene), pipe = makePipe(scene), trail = makeTrail(scene, tram);

// —— shots ——
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(V(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, aper = 600, span = 40) => ({ look, az, pitch, dist, aper, span });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.aper, b.aper, k), lerp(a.span, b.span, k));
const WIDE = P(V(1, 8, 0), 180, 52, 108, 900, 70);
const DIVE = t => P(V(0, lerp(14, 8, seg(t, 2, 4)), lerp(-3, 3, seg(t, 2, 4))), 180, 64, lerp(84, 76, seg(t, 2, 4)), 900, 50);
const ALT = P(V(ALTAR.x, .6, ALTAR.z - 1.2), 0, 80, 15, 260, 14);
function shotCam(t) {
  if (t < 2) { const k = seg(t, 0, 2); return P(V(BOX.x + .3 * k, BOX.y, BOX.z), 205, 30, lerp(5.2, 4.6, k), 90, 8); }
  if (t < 4) return DIVE(t);
  if (t < 11) { const k = eio(seg(t, 4, 10.5)); return P(V(lerp(4, 6, k), lerp(17, 10, k), lerp(-10, -7, k)), 205, 46, 40, 500, 30); }
  if (t < 19) { const gx = groom.state.x, bx = t < T.pothole ? bikeX(t) : tram.g.position.x; return P(V(clamp((gx + bx) / 2, -16, 4), MID, -4.5), 180, 62, 36, 500, 28); }
  if (t < 27) { if (t < 22.5) { const r = tram.roofAt(t, -.5, 0); return P(V(r.x, MID + 2, r.z), 180, 82, 24, 420, 20); }
    return mixP(P(V(tram.roofAt(22.5, -.5, 0).x, MID + 2, -6), 180, 82, 24, 420, 20), P(V(12, MID, -5.5), 210, 46, 24, 420, 20), eio(seg(t, 22.5, 24))); }
  if (t < 34) return P(V(16, 4, 3), 200, 16, lerp(26, 24, seg(t, 27, 34)), 500, 20);
  if (t < 35) return P(V(18, 1, 10), 205, 40, 36, 600, 26);
  if (t < 37) return P(V(FISH.x, FISH.y - .4, FISH.z), 215, 16, 6, 70, 8);
  if (t < 39) return P(V(8, 5, 12.5), 252, 24, 44, 900, 40);
  if (t < 43) return P(V(clamp(groom.state.x, CHAPEL.door + 2, BRIDGE.x), 1, 11.5), 0, 64, 26, 420, 20);
  if (t < 51) return P(V(CHAPEL.door, 0, 20.6), 0, 82, 25, 600, 16);
  if (t < 57) return P(V(CHAPEL.door, 0, groom.state.z + 1.2), 0, 84, 15, 300, 14);
  if (t < 60) return P(clock.pos.clone().add(V(0, 0, 0)), 180, 6, lerp(7, 5.5, seg(t, 57, 60)), 90, 12);
  if (t < T.crane0) return ALT;
  if (t < T.crane1) return mixP(ALT, WIDE, eio(seg(t, T.crane0, T.crane0 + 2.6)));
  if (t < T.loop) return P(V(ALTAR.x, .6, ALTAR.z - 1.2), 0, 78, 14, 260, 14);
  return DIVE(2 + (t - T.loop));
}
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g2 = ov.getContext('2d');
function caption(text, a, y = H * .14) { g2.save(); g2.globalAlpha = a; g2.font = `900 ${Math.round(58 * W / 1080)}px sans-serif`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; const w = g2.measureText(text).width + 60;
  g2.fillStyle = 'rgba(255,255,255,.92)'; const hh = 100 * W / 1080; g2.beginPath(); g2.roundRect(W / 2 - w / 2, y - hh / 2, w, hh, hh / 2); g2.fill(); g2.fillStyle = '#c8202e'; g2.fillText(text, W / 2, y + 2); g2.restore(); }
function drawOverlay(t) { g2.clearRect(0, 0, W, H);
  if (t > 2.05 && t < 4.6) caption('THE WEDDING STARTS IN 1 MINUTE.'.replace(' IN 1', ' IN 1'), Math.min(1, (t - 2.05) / .15, (4.6 - t) / .2));
  if (t > T.notagain && t < T.loop) caption('NOT AGAIN.', Math.min(1, (t - T.notagain) / .1));
}
const proj = V(), toY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
let lastShot = null;
window.DUR = DUR; window.SCENE = scene;
window.render = (t0) => {
  t0 = clamp(t0, 0, DUR - 1e-4); const t = t0 >= T.loop ? 2 + (t0 - T.loop) : t0;   // the last second replays the fall (a loop)
  tram.draw(t); groom.draw(t); ring.draw(t, camera); pigeon.draw(t0 >= T.loop ? 1.2 : t); bike.draw(t); canal.draw(t, groom.state); clock.draw(t); pipe.draw(t); trail.draw(t);
  const inside = (t >= 43 && t < 62.6) || (t >= T.crane1 && t0 < T.loop); chapel.draw(t, inside, ring.cur.z);
  const c = shotCam(t0); const pos = orbit(c.look, c.az, c.pitch, c.dist);
  if (t0 > T.dong && t0 < T.dong + .8) pos.add(V(Math.sin(t0 * 70) * .25 * (1 - seg(t0, T.dong, T.dong + .8)), 0, 0));   // the bell shakes the frame
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.updateMatrixWorld();
  setSun(c.look, c.span);
  const focusP = (t0 < 43 || t0 >= T.loop) && ring.ring.visible ? ring.cur : c.look;
  const dof = post.dof; dof.focus = camera.position.distanceTo(focusP); dof.aper = c.aper; dof.maxCoc = 14;
  Object.assign(dof.band, { y: clamp(toY(focusP), .25, .75), w: .14, amp: 14, mix: .6 });
  post.composer.render(); drawOverlay(t0);
};
// —— events for the sound (film seconds) ——
const EV = [], ev = (t, type, o = {}) => { if (t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
for (const [k, v] of Object.entries(T)) ev(v, k);
for (const s of [0, 2, 4, 11, 19, 27, 34, 35, 37, 39, 43, 51, 57, 60, 62, 67, 71]) ev(s, 'cut');
for (let t = 5.3; t < 10.3; t += .2) ev(t, 'clank');
for (let k = 0; k < 4; k++) ev(T.aisle + [0, .35, .62, .8][k], 'tink');
for (let t = 0; t < DUR; t += 1 / 12) ev(t, 'cam', { d: 0 });
EV.sort((a, b) => a.t - b.t); window.EV = EV; window.TEXTS = () => [];
window.render(QS.has('t') ? +QS.get('t') : 0); window.READY = true;
