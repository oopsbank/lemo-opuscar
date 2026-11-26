// The Phantom Jam — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, T, speedAt, Sq, sim8, VO, shotAt, X_TL, remaining, IDX, N, BRAKE2_IDX } from './story.js';
import { HOSPITAL, EXCL, LANE_X, hospitalGeometry, makeRoofSign, carAt, makeTraffic, makeAmbulance, makeWalkers, makeCat } from './actors.js';

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
post.bloom.strength = .35; post.bloom.threshold = 1.0; post.bloom.radius = .45;
const GR = post.grade.uniforms; GR.sat.value = 1.42; GR.contrast.value = .4; GR.warm.value = .3; GR.amt.value = .26;

const skyMat = new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir; void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
    vec3 c = mix(vec3(.80,.88,.93), vec3(.26,.53,.86), pow(t, .5)); float s = max(dot(d, sunDir), 0.); c += vec3(1.,.95,.8) * pow(s, 32.) * .4;
    if (d.y < 0.) c = vec3(.78,.86,.9); gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), skyMat); dome.frustumCulled = false; scene.add(dome);
const sun = new THREE.DirectionalLight('#fff3df', 3.6); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#b9d3ec', '#a08c6c', .75));
scene.fog = new THREE.FogExp2('#cfdde8', .00032);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
function setSun(focus, azDeg, elDeg, span) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d);
}

buildWorld(scene, { excl: EXCL, extra: b => hospitalGeometry(b) });
makeRoofSign(scene, 'HOSPITAL', (HOSPITAL.x0 + HOSPITAL.x1) / 2 + 5, (HOSPITAL.z0 + HOSPITAL.z1) / 2 + 12, 30, 15, HOSPITAL.h + .08, 0, ['#d8342a', '#fbfaf6']);
const traffic = makeTraffic(scene), amb = makeAmbulance(scene), walkers = makeWalkers(scene);
makeCat(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const OPEN = { look: V(-4, 0, 252), az: 0, pitch: 52, dist: 215, fov: 36 };
const carP = (i, t) => { const c = carAt(i, t); return V(c.x, 1.2, c.z); };
const ARR = { look: V(-9, 1, 590), az: 320, pitch: 36, dist: 105, fov: 34 };
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1);
  let pos, look, fov = 34, up = V(0, 1, 0), band = { w: .075, amp: 30, mix: .62 }, aper = 5000, sunAz = 35, sunEl = 52, span = 200, subj = null;
  if (sh.id === 'open') {
    look = OPEN.look.clone().add(V(0, 0, 10 * eio(u))); pos = orbit(look, OPEN.az, OPEN.pitch, OPEN.dist - 12 * eio(u)); fov = OPEN.fov; subj = carP(IDX.culprit, t); span = 240;
  } else if (sh.id === 'amb') {
    const a = amb.pos(); look = V(-4, 0, a.z + 30); pos = orbit(look, 0, 44, 165); fov = 34; subj = a.clone().setY(1.2); sunAz = 35;
  } else if (sh.id === 'hero') {
    const h = carP(IDX.hero, t); look = V(-4, 1, h.z + 6); pos = orbit(look, 335, 36, lerp(95, 82, eio(u))); fov = 33; subj = h; band = { w: .055, amp: 32, mix: .64 }; aper = 6500; sunAz = 335 + 40; span = 110;
  } else if (sh.id === 'top') {
    const h = carP(IDX.hero, t); look = V(-4, 0, h.z + 70); const rot = lerp(Math.PI * .5, .03, eio(u));
    pos = look.clone().add(V(0, 300, 0)); up = V(Math.sin(rot), 0, Math.cos(rot)); fov = 40; sunAz = 150; span = 220; band = { w: .1, amp: 26, mix: .9 }; subj = h;
  } else if (sh.id === 'side') {
    const h = carP(IDX.hero, t); look = V(-4, 0, h.z + 55); pos = orbit(look, 290, 46, lerp(250, 215, eio(u))); fov = 36; subj = h; sunAz = 290 - 40; span = 220; band = { w: .085, amp: 30, mix: .6 };
  } else if (sh.id === 'arrive') {
    look = ARR.look.clone(); pos = orbit(look, ARR.az, ARR.pitch, lerp(110, ARR.dist, eio(u))); fov = ARR.fov; subj = amb.pos().clone().setY(1.2); sunAz = ARR.az + 40; span = 130; band = { w: .07, amp: 30, mix: .62 };
  } else {   // rise: from the hospital back to the opening frame
    const k = eio(seg(t, 29.4, DUR));
    look = ARR.look.clone().lerp(OPEN.look.clone().add(V(0, 0, 10)), k);
    const az = lerp(ARR.az, 360, k), pitch = lerp(ARR.pitch, OPEN.pitch, k), dist = Math.exp(lerp(Math.log(ARR.dist), Math.log(OPEN.dist - 12), k));
    pos = orbit(look, az, pitch, dist); fov = lerp(ARR.fov, OPEN.fov, k);
    subj = V(-9, 1.2, 590).lerp(carP(BRAKE2_IDX, t), k); sunAz = lerp(ARR.az + 40, 395, k); span = lerp(130, 240, k);
  }
  return { pos, look, fov, up, band, aper, sunAz, sunEl, span, subj: subj || look.clone() };
}

// —— overlay: countdown plate, route map, subtitles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 }, MAP = { x: 56, y: 360, w: 96, h: 520 };
const speedLabel = t => speedAt(t).x === 'tl' ? `×${X_TL} TIME-LAPSE` : '×1 REAL TIME';
const fmt = r => { const s = Math.ceil(r - 1e-6); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const rem = remaining(t), done = t >= T.arrive, low = rem < 30 && !done, sp = speedAt(t).x;
  g.save(); rr(HUD.x, HUD.y, 430, 196, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  // ambulance glyph + countdown
  g.save(); g.translate(HUD.x + 52, HUD.y + 58); g.fillStyle = '#fff'; rr(-26, -17, 52, 34, 6); g.fill(); g.fillStyle = '#d8342a'; g.fillRect(-4, -12, 8, 24); g.fillRect(-12, -4, 24, 8); g.fillStyle = '#3d7bff'; g.fillRect(-10, -24, 20, 6); g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = done ? '#5fe08d' : low ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff'; g.fillText(fmt(rem), HUD.x + 100, HUD.y + 60);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = sp === 'tl' ? '#ffbd45' : '#5fe08d'; g.fillText(speedLabel(t), HUD.x + 30, HUD.y + 128);
  g.fillStyle = done ? '#5fe08d' : '#9fd4ff'; g.fillText(done ? 'AT THE HOSPITAL' : 'TO THE HOSPITAL', HUD.x + 30, HUD.y + 170);
  // route map: the boulevard as a strip, stopped cars red, the yellow car, the ambulance, the hospital
  const m = MAP, zy = z => m.y + 30 + (z + 4) / 626 * (m.h - 60);
  g.save(); rr(m.x, m.y, m.w, m.h, 14); g.fillStyle = 'rgba(14,22,34,.72)'; g.fill();
  g.fillStyle = '#5b6170'; g.fillRect(m.x + m.w / 2 - 6, m.y + 30, 12, m.h - 60);
  for (let i = 0; i < N; i++) { if (i === IDX.ambulance) continue; const c = carAt(i, t); g.fillStyle = i === IDX.hero ? '#ffc21a' : c.v < .8 ? '#ff4d3d' : '#c9ced6'; const r = i === IDX.hero ? 9 : 5; g.beginPath(); g.arc(m.x + m.w / 2, zy(c.z), r, 0, Math.PI * 2); g.fill(); }
  const hz = zy(588); g.fillStyle = '#d8342a'; g.fillRect(m.x + 14, hz - 12, 24, 24); g.fillStyle = '#fff'; g.fillRect(m.x + 23, hz - 8, 6, 16); g.fillRect(m.x + 18, hz - 3, 16, 6);
  const az = done ? 588 : amb.pos().z; g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x + m.w / 2, zy(az), 10, 0, Math.PI * 2); g.fill(); g.fillStyle = Math.floor(t * 6) % 2 ? '#3d7bff' : '#d8342a'; g.beginPath(); g.arc(m.x + m.w / 2, zy(az), 5, 0, Math.PI * 2); g.fill();
  g.restore();
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width, bw = tw + 120, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = s.t0 === 0 ? 1 - seg(t, s.t1 - .12, s.t1) : Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1));
    g.save(); g.globalAlpha = a; g.translate(0, s.t0 === 0 ? 0 : (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#ffc21a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(s.text, bx + 76, SUB_Y + 3);
    g.restore();
  }
}

window.DUR = DUR;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = Sq(t);
  traffic.draw(t); amb.draw(t); walkers.draw(t);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0); c.subj = c.look.clone(); c.span = 400; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix: brake squeaks when cars stop, the siren, the turn-in, cuts ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(0, 'brake1'); ev(T.brake2, 'brake1');
for (let i = 0; i < N; i++) { if (i === IDX.ambulance) continue; let was = false; for (let t = 0; t < DUR; t += 1 / 24) { const st = carAt(i, t).v < .4; if (st && !was) ev(t, 'stop', { pan: clamp(-carAt(i, t).z / 600 + .5, -1, 1) * .5 }); was = st; } }
ev(7.0, 'real'); ev(11.0, 'resume'); ev(25.4, 'real'); ev(29.4, 'resume'); ev(T.arrive, 'arrive');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [3, 7, 11, 17, 25.4, 29.4]) ev(s, 'cut');
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + 430, y1: HUD.y + 196, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
