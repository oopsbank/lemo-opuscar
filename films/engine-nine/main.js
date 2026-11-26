// Engine Nine — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps)
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, track } from '/core/lib.js';
import { buildWorld, U, STATION, BRIDGE, WAREHOUSE, CANAL } from './world.js';
import { DUR, T, BEAT, SPEED, speedAt, q, S, Sq, VO, shotAt, fireLevel } from './story.js';
import { makeTruck, makeDoor, makeCars, makeRoadTraffic, makeJam, makeAmbient, makePeople, makeBridge, makeBoats, makeFire, makeSmoke, makeWater, truckAt, bridgeAngle, FIRE_TARGET, EAST_Z, SOUTH_X } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 60px Overpass'); await document.fonts.load('900 300px Overpass'); await document.fonts.load('600 40px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, W / H, 1, 9000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') || 1), msaa: 4, taps: +(QS.get('taps') || 72), ao: false });
post.bloom.strength = .32; post.bloom.threshold = 1.05; post.bloom.radius = .45;
Object.assign(post.grade.uniforms, {});
post.grade.uniforms.sat.value = 1.42; post.grade.uniforms.contrast.value = .4; post.grade.uniforms.warm.value = .3; post.grade.uniforms.amt.value = .26;

// —— sky, sun, fill ——
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
const SM = +(QS.get('sm') || 2048); sun.shadow.mapSize.set(SM, SM); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#b9d3ec', '#a08c6c', .75); scene.add(hemi);
scene.fog = new THREE.FogExp2('#cfdde8', .00032);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
function setSun(focus, azDeg, elDeg, span) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));   // same convention as orbit(): the sun sits where a camera looking at azimuth az would
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d);
}

// —— world + actors ——
buildWorld(scene);
const truck = makeTruck(scene), door = makeDoor(scene);
const cars = makeCars(scene, 1400), road = makeRoadTraffic(), jam = makeJam(), amb = makeAmbient();
const people = makePeople(scene), bridge = makeBridge(scene), boats = makeBoats(scene);
const fire = makeFire(scene), smoke = makeSmoke(scene), water = makeWater(scene);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— the engine: stepped position, lights, ladder ——
const nozzle = new THREE.Vector3();
function placeTruck(t) {
  const tw = q(t), st = truckAt(tw);
  truck.g.position.set(st.x, 0, st.z); truck.g.rotation.y = st.yaw;
  // light bar: alternating, at the world's step rate in time-lapse, 3 Hz in real time
  const ph = speedAt(t).hz ? Math.floor(tw * 4) % 2 : Math.floor(t * 6) % 2;
  const lit = t > .3 && t < T.out1 + 2.2 ? 1 : 0;
  truck.lr.emissiveIntensity = lit * (ph ? 6 : .3); truck.lb.emissiveIntensity = lit * (ph ? .3 : 6);
  // outriggers, ladder
  const o = ss(seg(tw, T.outrig, T.outrig + .25));
  for (const l of truck.legs) { l.position.x = l.userData.sx * (1.1 + 1.2 * o); l.position.y = .7 - .45 * o; }
  truck.g.updateMatrixWorld(true);
  const local = truck.turn.worldToLocal(FIRE_TARGET.clone());
  const yawT = Math.atan2(local.x, local.z);
  const rise = seg(tw, T.ladder0, T.ladder0 + .5), ext = seg(tw, T.ladder0 + .25, T.ladder1);
  truck.turn.rotation.y = yawT * ss(rise);
  const pitchT = Math.atan2(FIRE_TARGET.y - 3.4 - 2.8, Math.hypot(local.x, local.z) * 1.2) + .12;
  truck.pitch.rotation.x = -(pitchT + .18) * ss(rise);
  truck.fly.position.z = 7.2 * ss(ext);
  truck.g.updateMatrixWorld(true);
  truck.tip.getWorldPosition(nozzle);
  return st;
}

// —— shots: camera, band, sun ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) {   // azimuth = direction the camera looks (0 = south/+z, 90 = east/+x)
  const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180;
  return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist));
}
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1), ts = truckAt(t), tp = V(ts.x, 1.5, ts.z);
  let pos, look, fov = 34, up = V(0, 1, 0), focus = tp, band = { w: .07, amp: 30, mix: .62 }, aper = 5000, sunAz = 160, sunEl = 52, span = 170, subj = tp;
  if (sh.id === 'station') {
    look = V(-2, 0, lerp(-30, -22, u)); pos = orbit(look, 200, 48, lerp(200, 188, u)); fov = 36;
    subj = V(0, 3, lerp(-34, -18, ss(seg(t, 2, 4)))); sunAz = 200 - 40; sunEl = 55; span = 150;
  } else if (sh.id === 'hill') {
    look = V(-6, 0, ts.z + 32); pos = orbit(look, 14, 50, 205); fov = 35; sunAz = 14 - 45; sunEl = 52;
  } else if (sh.id === 'boulevard') {
    look = V(-4, 0, ts.z + 6); pos = orbit(look, 200, 42, 250); fov = 27; sunAz = 200 + 45; sunEl = 50; aper = 7000;
  } else if (sh.id === 'jam') {
    look = V(-3, 0, 486); pos = orbit(look, 25, 50, lerp(235, 185, eio(u))); fov = 33; subj = V(-4, 1, 489); band = { w: .085, amp: 30, mix: .6 }; sunAz = 25 + 40; sunEl = 55;
    // after the surge, follow the engine into its turn
    const f = ss(seg(t, 17.0, 18.0)); look.lerp(V(ts.x, 0, ts.z), f * .6); subj = subj.clone().lerp(tp, f);
  } else if (sh.id === 'top') {
    look = V(ts.x, 0, ts.z); const rot = lerp(Math.PI / 2, .03, eio(seg(t, 18.6, 21.4)));
    pos = look.clone().add(V(0, 215, 0)); up = V(Math.sin(rot), 0, Math.cos(rot)); fov = 40; sunAz = 150; sunEl = 58; span = 190;
    band = { w: .08, amp: 28, mix: .9 };
  } else if (sh.id === 'bridge') {
    look = V(125, 0, 646 + 2 * u); pos = orbit(look, 10, 44, 240); fov = 34; subj = V(119, 2, 628);
    band = { w: lerp(.085, .065, ss(seg(t, 22, 24))), amp: 30, mix: .65 }; sunAz = 4 - 40; sunEl = 50; span = 140;
  } else if (sh.id === 'fire') {
    look = V(lerp(134, 138, u), 4, lerp(690, 694, u)); pos = orbit(look, 148, 46, lerp(225, 205, u)); fov = 34; subj = V(126, 6, 703); sunAz = 148 + 40; sunEl = 52;
    band = { w: .085, amp: 30, mix: .62 };
  } else {   // roof
    const k = eio(seg(t, 31.5, 36.5));
    look = V(lerp(132, 135, k), lerp(9, 10, k), lerp(708, 706, k)); pos = orbit(look, lerp(192, 186, k), lerp(34, 31, k), lerp(175, 140, k)); fov = 32; subj = V(140, 12, 712);
    band = { w: lerp(.07, .045, ss(seg(t, 33.5, 35))), amp: 32, mix: .66 }; sunAz = 185 + 35; sunEl = 48; aper = 6500; span = 130;
  }
  return { pos, look, fov, up, focus, band, aper, sunAz, sunEl, span, subj };
}

// —— overlay: HUD (time-lapse clock) and subtitles (harbour street-name tiles) ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
const SUBS = VO.map((v, i) => ({ ...v, t0: v.t - .08, t1: 0 }));
export const DUR_SPEECH = {};   // filled from voices/dur.json when present
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65);
  if (next) s.t1 = Math.min(s.t1, next.t0 - .05);
  if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 150 };
function subBox(s) { g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width; const w = tw + 120, h = 96; return { x: (W - w) / 2 - 10, y: SUB_Y - h / 2, w, h, tw }; }
function hudW(lab) { g.font = '600 40px "Overpass Mono"'; return 92 + g.measureText(lab).width + 28; }
function hudLabel(t) { const sp = speedAt(t); return sp.x === 1 ? '×1 REAL TIME' : `×${sp.x} TIME-LAPSE`; }
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  // HUD plate
  const sp = speedAt(t), lab = hudLabel(t), real = sp.x === 1;
  g.font = '600 40px "Overpass Mono"'; const hw = hudW(lab);
  g.save(); g.globalAlpha = .92; rr(HUD.x, HUD.y, hw, 92, 16); g.fillStyle = 'rgba(14,22,34,.78)'; g.fill(); g.restore();
  // clock face whose hand spins with the world clock
  const cx = HUD.x + 48, cy = HUD.y + 46;
  g.beginPath(); g.arc(cx, cy, 28, 0, Math.PI * 2); g.fillStyle = '#f6f2e8'; g.fill(); g.lineWidth = 3; g.strokeStyle = real ? '#4ccf7a' : '#f2b13a'; g.stroke();
  const ang = Sq(t) * 1.7 - Math.PI / 2; g.lineCap = 'round';
  g.strokeStyle = '#17212e'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang / 12) * 13, cy + Math.sin(ang / 12) * 13); g.stroke();
  g.font = '600 40px "Overpass Mono"'; g.textBaseline = 'middle'; g.fillStyle = real ? '#5fe08d' : '#ffbd45';
  g.fillText(lab, HUD.x + 92, HUD.y + 48);
  // subtitle tile: white glazed tile, cobalt border and letters, a small red beacon
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    const a = Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1)), b = subBox(s);
    g.save(); g.globalAlpha = a; g.translate(0, (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
    rr(b.x, b.y, b.w, b.h, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(b.x + 9, b.y + 9, b.w - 18, b.h - 18, 7); g.stroke();
    // beacon
    const on = Math.floor(t * 4) % 2 === 0 && t < T.out1;
    g.beginPath(); g.arc(b.x + 44, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = on ? '#e5322a' : '#8f2a24'; g.fill();
    g.font = '800 54px Overpass'; g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText(s.text, b.x + 76, SUB_Y + 3);
    g.restore();
  }
}

// —— render ——
const clipPlaneSave = {};
window.DUR = DUR;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  const tw = q(t);
  U.time.value = Sq(t);
  const st = placeTruck(t);
  // roller door: rises in steps 1.0–2.0
  const open = seg(tw, T.door0, T.door1), dh = 5.6 * (1 - open) + .01;
  door.scale.set(1, dh, 1); door.position.set(0, 5.6 - dh / 2, STATION.z1 + .32);
  cars.begin(); road.draw(cars, tw); jam.draw(cars, tw); amb.draw(cars, t); cars.end();
  people.draw(t, st); bridge.draw(t); boats.draw(t); fire.draw(t); smoke.draw(t); water.draw(t, nozzle);
  // camera
  const c = shotCam(t);
  if (QS.has('cam')) {   // debug / stills: cam=x,y,z,lx,ly,lz,fov[,bandY-world-x,y,z]
    const v = QS.get('cam').split(',').map(Number);
    c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0);
    c.subj = v.length >= 10 ? V(v[7], v[8], v[9]) : c.look.clone(); c.band = { w: +(QS.get('bw') || .1), amp: 26, mix: .7 }; c.span = +(QS.get('span') || 700); c.aper = 30000;
  }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const dof = post.dof;
  dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  fire.finish(camera, scene.fog); smoke.finish(camera, scene.fog); water.finish(camera, scene.fog);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix (foley + music gates) ——
const EV = [];
EV.push({ t: 0, type: 'alarm' });
for (let k = 0; k < 12; k++) EV.push({ t: T.door0 + k / 12, type: 'door' });
EV.push({ t: 2.15, type: 'engine' }, { t: T.out, type: 'depart' });
for (const e of road.ev) EV.push({ t: q(e.t) + .001, type: 'yield', pan: clamp(e.x / 12, -1, 1) });
EV.push({ t: 12.7, type: 'horn', pan: -.4 }, { t: 13.35, type: 'horn', pan: .5 }, { t: 12.6, type: 'brake' });
for (const tt of [T.part1, T.part2, T.part3]) EV.push({ t: tt, type: 'part' });
EV.push({ t: T.surge, type: 'rev' }, { t: 18.05, type: 'corner' }, { t: 20.0, type: 'corner' }, { t: 21.5, type: 'brake' });
EV.push({ t: T.boatHorn, type: 'boathorn' }, { t: T.bridge0, type: 'motor0' }, { t: T.clunk, type: 'clunk' }, { t: T.clunk + .2, type: 'barrier' });
EV.push({ t: 28.0, type: 'rev' }, { t: T.arrive, type: 'brake' });
for (let k = 0; k < 4; k++) EV.push({ t: T.outrig + k * .0625, type: 'outrig' });
for (let k = 0; k < 9; k++) EV.push({ t: T.ladder0 + .25 + k / 12, type: 'ladder' });
EV.push({ t: T.water, type: 'water' });
for (let tt = T.water + BEAT; tt < T.out1 - 1e-6; tt += BEAT) EV.push({ t: tt, type: 'flame' });
EV.push({ t: T.out1, type: 'out' });
for (const v of VO) EV.push({ t: v.t, type: 'vo', id: v.id });
for (const sh of [4, 8, 12, 18, 22, 28, 31.5]) EV.push({ t: sh, type: 'cut' });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.SUBS = SUBS.map(s => ({ t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), text: s.text }));
window.TEXTS = (t) => {
  const out = [];
  const lab = hudLabel(t); out.push({ id: 'hud', text: lab, x0: HUD.x, y0: HUD.y, x1: HUD.x + hudW(lab), y1: HUD.y + 92 });
  return out;
};
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
