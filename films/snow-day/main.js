// Snow Day — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first (loop)
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, T, speedAt, Sq, VO, shotAt, X_TL, clockSec, fmtClock } from './story.js';
import { SCHOOL, DRIFT1, EXCL, ploughAt, makeClearMap, makePloughs, makeDrift, schoolGeometry, makeRoofSign, makeSnowman, makePeople, makeCars, makeTraffic, makeSnowfall } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 60px Overpass'); await document.fonts.load('900 300px Overpass'); await document.fonts.load('600 34px "Overpass Mono"'); await document.fonts.load('700 76px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 9000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, taps: +(QS.get('taps') || 72), ao: false });
post.bloom.strength = .3; post.bloom.threshold = 1.1; post.bloom.radius = .45;
const GR = post.grade.uniforms; GR.sat.value = 1.32; GR.contrast.value = .38; GR.warm.value = .32; GR.amt.value = .26; GR.expo.value = .9;

// —— sky (early morning), low sun with long blue shadows ——
const skyMat = new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) }, snow: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir; uniform float snow; void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
    vec3 c = mix(vec3(.96,.86,.78), vec3(.36,.56,.84), pow(t, .45)); float s = max(dot(d, sunDir), 0.); c += vec3(1.,.85,.6) * pow(s, 16.) * .5;
    if (d.y < 0.) c = vec3(.85,.88,.92); c = mix(c, vec3(.78,.8,.84), snow); gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), skyMat); dome.frustumCulled = false; scene.add(dome);
const sun = new THREE.DirectionalLight('#ffe2bd', 3.3); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#a9c4ec', '#c9b6a0', .8); scene.add(hemi);
scene.fog = new THREE.FogExp2('#d9e0ea', .00034);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
function setSun(focus, azDeg, elDeg, span, snow) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d); skyMat.uniforms.snow.value = snow;
  sun.intensity = 3.3 * (1 - .45 * snow); scene.fog.density = .00034 + .0005 * snow;
}

// —— world ——
U.clearTex.value = makeClearMap();
buildWorld(scene, { excl: EXCL, extra: b => schoolGeometry(b) });
makeRoofSign(scene, 'SCHOOL', (SCHOOL.x0 + SCHOOL.x1) / 2, (SCHOOL.z0 + SCHOOL.z1) / 2 + 1.5, 40, 20, SCHOOL.h + .07, Math.PI, ['#e8b51e', '#1d4c9e']);
const ploughs = makePloughs(scene), drift = makeDrift(scene), people = makePeople(scene), cars = makeCars(scene, 1400), traffic = makeTraffic(), snowfall = makeSnowfall(scene);
makeSnowman(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const OPEN = { look: V(-4, 0, 30), az: 0, pitch: 48, dist: 250, fov: 36 };   // the opening = the closing frame
const pl = (i, t) => { const s = ploughAt(i, t); return V(s.x, 1.5, s.z); };
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1);
  let pos, look, fov = 34, up = V(0, 1, 0), band = { w: .075, amp: 30, mix: .62 }, aper = 5000, sunAz = 0, sunEl = 24, span = 200, subj = null;
  if (sh.id === 'open') {
    look = OPEN.look.clone().add(V(0, 0, 45 * eio(u))); pos = orbit(look, OPEN.az, OPEN.pitch, OPEN.dist - 15 * eio(u)); fov = OPEN.fov;
    subj = pl(0, t); sunAz = 35; span = 240; band = { w: .09, amp: 30, mix: .6 };
  } else if (sh.id === 'boulevard') {
    const p = pl(0, t); look = V(p.x + 2, 0, p.z + 14); pos = orbit(look, 160, 42, 175); fov = 34; subj = p; sunAz = 160 + 40;
  } else if (sh.id === 'top') {
    look = V(10, 0, lerp(420, 450, u)); const rot = lerp(Math.PI * .5, .03, eio(u));
    pos = look.clone().add(V(0, 560, 0)); up = V(Math.sin(rot), 0, Math.cos(rot)); fov = 40; sunAz = 150; span = 340; band = { w: .12, amp: 26, mix: .9 }; subj = look.clone();
  } else if (sh.id === 'stuck') {
    const p = pl(1, Math.min(t, T.burst + .3));
    look = V(-130, 1, lerp(378, 382, u)); pos = orbit(look, 180, 42, lerp(92, 84, u)); fov = 32; subj = p; sunAz = 180 + 40; span = 100;
    band = { w: .06, amp: 32, mix: .64 }; aper = 6000;
  } else if (sh.id === 'wide') {
    look = V(lerp(40, -10, eio(u)), 0, lerp(380, 300, eio(u))); pos = orbit(look, 20, 52, lerp(560, 430, eio(u))); fov = 36; subj = pl(0, t); sunAz = 20 + 35; span = 360;
    band = { w: .1, amp: 28, mix: .6 };
  } else if (sh.id === 'school') {
    look = V(-42, 2, 274); pos = orbit(look, 20, lerp(38, 33, u), lerp(130, 104, eio(u))); fov = 34;
    subj = t < T.gate ? pl(0, t) : V(-53, 2, 268); sunAz = 20 + 40; span = 120; band = { w: lerp(.08, .06, u), amp: 30, mix: .62 };
  } else {   // close: rise from the school back to the opening frame
    const k = eio(seg(t, 31, DUR));
    const lookA = V(-36, 2, 272), lookB = OPEN.look;
    look = lookA.clone().lerp(lookB, k);
    const az = lerp(20, OPEN.az, k), pitch = lerp(33, OPEN.pitch, k), dist = Math.exp(lerp(Math.log(104), Math.log(OPEN.dist), k));
    pos = orbit(look, az, pitch, dist); fov = lerp(34, OPEN.fov, k);
    subj = V(-50, 2, 266).lerp(V(-4, 1, 10), k); sunAz = lerp(60, 35, k); span = lerp(120, 240, k); band = { w: lerp(.06, .1, k), amp: 30, mix: lerp(.62, .6, k) };
  }
  return { pos, look, fov, up, band, aper, sunAz, sunEl, span, subj: subj || look.clone() };
}

// —— overlay: the clock plate (time of day + speed + the deadline), subtitles on glazed tiles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 }));
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 };
const speedLabel = t => { const x = speedAt(t).x; return x === 'tl' ? `×${X_TL} TIME-LAPSE` : '×1 REAL TIME'; };
function hudW() { g.font = '600 34px "Overpass Mono"'; return Math.max(g.measureText('×300 TIME-LAPSE').width, g.measureText('SCHOOL OPENS 8:00').width) + 60; }
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const w = hudW(), sp = speedAt(t).x, open = clockSec(t) >= 8 * 3600 - .02, late = !open && clockSec(t) > 7 * 3600 + 50 * 60;
  g.save(); rr(HUD.x, HUD.y, w, 196, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = open ? '#5fe08d' : late ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff';
  const real = sp === 'real' && t > 27 && t < 31;
  g.fillText(fmtClock(t, real), HUD.x + 30, HUD.y + 56);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = sp === 'tl' ? '#ffbd45' : '#5fe08d'; g.fillText(speedLabel(t), HUD.x + 30, HUD.y + 118);
  g.fillStyle = open ? '#5fe08d' : '#9fd4ff'; g.fillText(open ? 'SCHOOL OPEN' : 'SCHOOL OPENS 8:00', HUD.x + 30, HUD.y + 164);
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width, bw = tw + 120, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = s.t0 === 0 ? 1 - seg(t, s.t1 - .12, s.t1) : Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1));
    g.save(); g.globalAlpha = a; g.translate(0, s.t0 === 0 ? 0 : (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#f07a1f'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(s.text, bx + 76, SUB_Y + 3);
    g.restore();
  }
}

// —— render ——
window.DUR = DUR;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = Sq(t); U.ft.value = t; U.resnow.value = ss(seg(t, T.resnow0, T.resnow1));
  cars.begin(); traffic.draw(cars, t); cars.end();
  ploughs.draw(t); drift.draw(t, ploughs.states[1]); people.draw(t);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0); c.subj = c.look.clone(); c.span = +(QS.get('span') || 400); c.aper = 30000; c.band = { w: +(QS.get('bw') || .1), amp: 26, mix: .7 }; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const R = clamp(camera.position.distanceTo(c.look) * .45, 30, 200);
  snowfall.draw(t, V(c.look.x, 0, c.look.z), R);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  const snowing = Math.max(1 - seg(t, .2, 2.2), seg(t, T.snow0, T.snow0 + 1.2)) * .5;
  setSun(c.look, c.sunAz, c.sunEl, c.span, snowing);
  ploughs.finish(camera, scene.fog); drift.finish(camera, scene.fog); snowfall.finish(camera, scene.fog);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(0, 'start');
ev(T.stuck0, 'real'); ev(T.spin, 'spin'); for (let k = 0; k < 5; k++) ev(T.back0 + k * .17, 'beep'); ev(T.ram, 'ram'); ev(T.burst, 'burst'); ev(T.free, 'resume');
ev(T.real2, 'tick'); ev(T.real2 + 1, 'tick');
ev(T.real2, 'real'); ev(T.drift, 'push'); ev(T.gate - .15, 'stop'); ev(T.bell, 'bell'); ev(T.bell + .2, 'cheer'); ev(T.resume, 'resume');
ev(T.snow0, 'snow');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [4, 10, 14.5, 18.5, 26, 31]) ev(s, 'cut');
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + hudW(), y1: HUD.y + 196, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
