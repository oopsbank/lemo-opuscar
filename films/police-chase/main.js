// Police Chase — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, ei } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, VO, sim, invSim, SLOW, pose, BR, CROSS, FERRY, T_STOP, T_CROSS, ARR } from './story.js';
import { makeDressing } from './dressing.js';
import { makeHarbour } from './harbour.js';
import { EXCL, COL, extraGeometry, makeRaceCar, makePolice, makeBridge, makeFerry, makeCrossing, makeArrest, makeSmoke } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 60px Overpass'); await document.fonts.load('900 300px Overpass'); await document.fonts.load('600 34px "Overpass Mono"'); await document.fonts.load('700 76px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 9000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') || 1), msaa: 4, taps: +(QS.get('taps') || 72), ao: !QS.has('noao') });
post.bloom.strength = .6; post.bloom.threshold = .9; post.bloom.radius = .5;
const GR = post.grade.uniforms; GR.sat.value = 1.5; GR.contrast.value = .45; GR.warm.value = .42; GR.amt.value = .3;

const skyMat = new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir; void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
    vec3 c = mix(vec3(1.,.82,.62), vec3(.30,.50,.84), pow(t, .45)); float s = max(dot(d, sunDir), 0.); c += vec3(1.,.8,.5) * pow(s, 16.) * .6;
    if (d.y < 0.) c = vec3(.95,.8,.66); gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), skyMat); dome.frustumCulled = false; scene.add(dome);
const sun = new THREE.DirectionalLight('#ffc58c', 3.1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#9db9e6', '#b0805a', 1.0));
scene.fog = new THREE.FogExp2('#efd6bd', .00036);
U.lit.value = 1;
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
function setSun(focus, azDeg, elDeg, span) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d);
}

buildWorld(scene, { excl: EXCL, extra: extraGeometry });
const dressing = makeDressing(scene), harbour = makeHarbour(scene);
const car = makeRaceCar(scene), pol = makePolice(scene), bridge = makeBridge(scene), ferry = makeFerry(scene), crossing = makeCrossing(scene), arrest = makeArrest(scene), smoke = makeSmoke(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— shots (film seconds); the hero (the red car) stays on screen and about the same size in every chase shot ——
const proj = new THREE.Vector3();
const toScreen = p => { proj.copy(p).project(camera); return { x: (proj.x * .5 + .5) * W, y: (1 - (proj.y * .5 + .5)) * H, z: proj.z }; };
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
const sharp = { w: .3, amp: 8, mix: .3 };
const T1 = invSim(T_STOP);
export const SHOTS = [
  { id: 'open', t0: 0, t1: 1.6 }, { id: 'side', t0: 1.6, t1: 3.1 }, { id: 'ferry', t0: 3.1, t1: 5.4 }, { id: 'behind', t0: 5.4, t1: 8.2 },
  { id: 'cross', t0: 8.2, t1: SLOW.t1 }, { id: 'bridge', t0: SLOW.t1, t1: T1 - 2.4 }, { id: 'skid', t0: T1 - 2.4, t1: T1 + .3 },
  { id: 'box', t0: T1 + .3, t1: invSim(ARR.out) - .3 }, { id: 'arrest', t0: invSim(ARR.out) - .3, t1: invSim(ARR.ferry) - .2 }, { id: 'end', t0: invSim(ARR.ferry) - .2, t1: 999 },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
// a camera rig relative to a vehicle: right (m), up (m), forward (m) in the vehicle's frame
function rig(p, r, u, f) { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); return V(p.x + fx * f - fz * r, u, p.z + fz * f + fx * r); }
const SPEEDY = new Set(['open', 'side', 'behind']);
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, Math.min(sh.t1, DUR)), s = sim(t), cp = pose('thief', s);
  let c, band = { w: .17, amp: 15, mix: .5 }, aper = 5600, span = 120;
  const carP = V(cp.x, 1, cp.z);
  if (sh.id === 'open') { const pos = rig(cp, -3.4, 3.4, 14 - 2 * u); c = { pos, look: carP.clone().add(V(0, .6, 0)), fov: 32, subj: carP }; band = sharp; aper = 700; span = 60; }
  else if (sh.id === 'side') { const p1 = pose('p1', s); const pos = rig(cp, -6.5, 6.5, 27 - 5 * u); const look = carP.clone().lerp(V(p1.x, 1, p1.z), .3); c = { pos, look, fov: 30, subj: carP }; band = { w: .26, amp: 10, mix: .4 }; aper = 1500; span = 80; }
  else if (sh.id === 'ferry') { const f = ferry.pos(s); const look = f.clone().add(V(0, 4, -6)); const pos = f.clone().add(V(lerp(-70, -62, u), 30, -44)); c = { pos, look, fov: 34, subj: look }; band = { w: .26, amp: 10, mix: .4 }; span = 160; }
  else if (sh.id === 'behind') { const p1 = pose('p1', s); const pos = rig(p1, 1.0, 7.5, -13); c = { pos, look: carP.clone().add(V(0, .5, 0)), fov: 34, subj: V(p1.x, 1, p1.z).lerp(carP, .5) }; band = { w: .3, amp: 10, mix: .35 }; aper = 2500; span = 100; }
  else if (sh.id === 'cross') { const pos = V(CROSS.x + 23, 11, 518.5), look = V(CROSS.x - 4, 1.0, 520).lerp(carP, .25); c = { pos, look, fov: 36, subj: V(CROSS.x, 1, 520) }; band = { w: .22, amp: 12, mix: .4 }; aper = 2000; span = 70; }
  else if (sh.id === 'bridge') { const pos = V(123, 30, 692), look = V(117, 2, lerp(612, 618, u)).lerp(carP, .15); c = { pos, look, fov: 36, subj: V(118, 2, 615).lerp(carP, .5) }; band = { w: .2, amp: 12, mix: .45 }; span = 110; }
  else if (sh.id === 'skid') { const pos = V(114.5, 7, 597), look = V(117, 3, 636); c = { pos, look, fov: 34, subj: carP }; band = { w: .26, amp: 10, mix: .4 }; aper = 1800; span = 70; }
  else if (sh.id === 'box') { const look = V(116, 0, 626); const pos = V(lerp(150, 146, u), lerp(38, 34, u), lerp(612, 604, u)); c = { pos, look, fov: 36, subj: V(117, 1, 627) }; band = { w: .24, amp: 12, mix: .45 }; span = 90; }
  else if (sh.id === 'arrest') { const th = arrest.thiefPos(); const look = th.clone().add(V(0, 1.2, 0)); const pos = V(th.x + 3, 6.5, th.z - 10); c = { pos, look: look.clone().add(V(0, 0, 3)), fov: 34, subj: look }; band = { w: .3, amp: 8, mix: .3 }; aper = 2600; span = 60; }
  else { const k = eio(u); const look = V(116, 0, 626).lerp(V(128, 0, 716), k); const pos = V(146, 34, 604).lerp(V(98, 170, 512), k); c = { pos, look, fov: 38, subj: look }; band = { w: .22, amp: 13, mix: .45 }; span = lerp(90, 300, k); }
  return { up: V(0, 1, 0), ...c, band, aper, sunAz: 215, sunEl: 30, span, speedy: SPEEDY.has(sh.id) && s < T_STOP - 1 };
}

// —— overlay: one text layer at a time: the headline (0–1.5 s), then subtitles; a FERRY label in the ferry shot; speed lines ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.filter(v => v.id !== 'v1').map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) { const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1]; s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR; }
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395;
const SPEED_LINES = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + Math.sin(i * 7.3) * .1, r0: .62 + (i * 37 % 10) / 40, len: .12 + (i * 53 % 10) / 50, ph: i * 1.7 }));
function drawOverlay(t, cam) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  if (cam.speedy) {   // speed lines round the edges
    g.save(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineCap = 'round';
    for (const L of SPEED_LINES) {
      const k = (t * 3.2 + L.ph) % 1, r0 = L.r0 + k * .25, r1 = r0 + L.len, cx = W / 2, cy = H * .5, R = Math.hypot(W, H) * .5;
      g.globalAlpha = .55 * Math.sin(Math.PI * k); g.lineWidth = 3 + 3 * k;
      g.beginPath(); g.moveTo(cx + Math.cos(L.a) * R * r0, cy + Math.sin(L.a) * R * r0); g.lineTo(cx + Math.cos(L.a) * R * r1, cy + Math.sin(L.a) * R * r1); g.stroke();
    }
    g.restore();
  }
  if (t < 1.55) {   // the headline
    const a = 1 - seg(t, 1.4, 1.55), y0 = 470;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(W / 2 - 430, y0 - 110, 860, 220, 26); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 10; g.strokeStyle = COL.police; rr(W / 2 - 416, y0 - 96, 832, 192, 18); g.stroke();
    g.font = '900 96px Overpass'; g.fillStyle = COL.thief; g.fillText('STOP THAT CAR!', W / 2, y0 + 6);
    g.restore();
  }
  if (t > 3.25 && t < 5.35) {   // label the ferry
    const a = Math.min(seg(t, 3.25, 3.5), 1 - seg(t, 5.1, 5.35)), q = toScreen(ferry.pos(sim(t)).clone().add(V(0, 14, 0)));
    g.save(); g.globalAlpha = a; g.fillStyle = '#f7f4ec'; g.strokeStyle = COL.police; g.lineWidth = 6;
    rr(q.x - 120, q.y - 120, 240, 84, 16); g.fill(); g.stroke(); g.beginPath(); g.moveTo(q.x - 20, q.y - 38); g.lineTo(q.x + 20, q.y - 38); g.lineTo(q.x, q.y - 4); g.closePath(); g.fillStyle = COL.police; g.fill();
    g.fillStyle = COL.police; g.font = '900 58px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FERRY', q.x, q.y - 76); g.restore();
  }
  const sb = SUBS.find(q => t >= q.t0 && t < q.t1);
  if (sb && t >= 1.55) {
    g.font = '800 58px Overpass'; const tw = g.measureText(sb.text).width, sc = Math.min(1, 900 / (tw + 120)), bw = (tw + 120) * sc, bh = 100, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const al = Math.min(seg(t, sb.t0, sb.t0 + .12), 1 - seg(t, sb.t1 - .12, sb.t1));
    g.save(); g.globalAlpha = al; g.translate(0, (1 - eo(seg(t, sb.t0, sb.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = COL.police; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.fillStyle = '#16233f'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = `800 ${Math.round(58 * sc)}px Overpass`; g.fillText(sb.text, W / 2 - 10, SUB_Y + 3);
    g.restore();
  }
}

function placeCam(t) {
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.subj = c.look.clone(); c.span = 400; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return c;
}
window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  const s = sim(t);
  U.time.value = t * 1.5;
  car.draw(t, s); for (const k in pol) pol[k].draw(t, s); bridge.draw(t, s); ferry.draw(t, s); crossing.draw(t, s); arrest.draw(t, s);
  dressing.draw(t, s, 1e9); harbour.draw(t);
  const c = placeCam(t);
  smoke.draw(t, s, camera);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper * .4; dof.maxCoc = 14;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t, c);
};
// —— events for the mix and the score ——
const EV = [];
const ev = (t, type, o = {}) => { if (t !== null && t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
ev(0, 'hit'); ev(SLOW.t0, 'slow'); ev(SLOW.t1, 'resume'); ev(invSim(T_CROSS), 'cross');
for (const [k, s] of [['bell', BR.bell], ['barDown', BR.barDown], ['up0', BR.up0], ['up1', BR.up1], ['stop', T_STOP], ['brake', T_STOP - 1.4], ['out', ARR.out], ['hands', ARR.hands], ['ferry', ARR.ferry]]) ev(invSim(s), k);
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const sh of SHOTS.slice(1)) ev(sh.t0, 'cut');
// engine and siren levels: speed of the race car, distance of the cars to the camera
for (let t = 0; t < DUR; t += 1 / 12) {
  placeCam(t); const s = sim(t), cp = pose('thief', s), dc = camera.position.distanceTo(V(cp.x, 1, cp.z));
  let dp = 1e9; for (const k of ['p1', 'p2', 'p3']) { const p = pose(k, s); dp = Math.min(dp, camera.position.distanceTo(V(p.x, 1, p.z))); }
  ev(t, 'lvl', { v: +cp.v.toFixed(2), car: +Math.min(1, 25 / Math.max(25, dc)).toFixed(3), pol: +Math.min(1, 25 / Math.max(25, dp)).toFixed(3) });
}
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
