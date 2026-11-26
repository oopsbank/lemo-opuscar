// Ten Minutes — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion)
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { buildWorld, U, BLVD, BRIDGE, QUAY } from './world.js';
import { DUR, T, BEAT, SPEED, speedAt, S, Sq, VO, shotAt, remaining, rainAmt, X_TL } from './story.js';
import { EXCL, PIZZERIA, MARKET, DOG_YARD, WORKS, ALLEY, HAND, BOAT, ROUTE, scooterAt, leafAngle, makeScooter, marketGeometry, makeMarket, makeDog, worksGeometry, makeWorks, makeParade, pizzeriaGeometry, makeRoofSign, makeRain, makeQuayFolk } from './actors.js';
import { makeCars, makeAmbient, makeWalkers, makeBridge, makeBoats } from './common.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 60px Overpass'); await document.fonts.load('900 260px Overpass'); await document.fonts.load('600 40px "Overpass Mono"'); await document.fonts.load('700 76px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 9000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, taps: +(QS.get('taps') || 72), ao: false });
post.bloom.strength = .25; post.bloom.threshold = 1.1; post.bloom.radius = .45;
const GR = post.grade.uniforms; GR.sat.value = 1.42; GR.contrast.value = .4; GR.warm.value = .3; GR.amt.value = .26;

// —— sky, sun, fill (dimmed under the rain) ——
const skyMat = new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) }, rain: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir; uniform float rain; void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
    vec3 c = mix(vec3(.80,.88,.93), vec3(.26,.53,.86), pow(t, .5)); float s = max(dot(d, sunDir), 0.); c += vec3(1.,.95,.8) * pow(s, 32.) * .4;
    if (d.y < 0.) c = vec3(.78,.86,.9); c = mix(c, vec3(.55,.58,.62), rain); gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), skyMat); dome.frustumCulled = false; scene.add(dome);
const sun = new THREE.DirectionalLight('#fff3df', 3.6); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#b9d3ec', '#a08c6c', .75); scene.add(hemi);
scene.fog = new THREE.FogExp2('#cfdde8', .00032);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
const FOG0 = new THREE.Color('#cfdde8'), FOGR = new THREE.Color('#9aa3ab'), HEMI0 = new THREE.Color('#b9d3ec'), HEMIR = new THREE.Color('#9aa6b4');
function setSun(focus, azDeg, elDeg, span, rain) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d); skyMat.uniforms.rain.value = rain;
  sun.intensity = 3.6 * (1 - .78 * rain); hemi.intensity = .75 + .2 * rain; hemi.color.copy(HEMI0).lerp(HEMIR, rain);
  scene.fog.color.copy(FOG0).lerp(FOGR, rain); scene.fog.density = .00032 + .0009 * rain;
  GR.sat.value = 1.42 - .38 * rain; GR.expo.value = 1 - .12 * rain;
}

// —— world (+ this film's places) and actors ——
buildWorld(scene, {
  excl: EXCL,
  extra: (b) => {
    pizzeriaGeometry(b); marketGeometry(b); worksGeometry(b);
    const PAVE = '#9b9384';
    b.gRoad.flat(-124, -BLVD.h, ALLEY.z - ALLEY.h, ALLEY.z + ALLEY.h, .03, PAVE);
    b.gRoad.flat(BLVD.h, 114, ALLEY.z - ALLEY.h, ALLEY.z + ALLEY.h, .03, PAVE);
    // the dog's yard: lawn, white fence with a gap, a kennel
    b.gFlat.flat(-121, -110, DOG_YARD.z - 8, DOG_YARD.z + 8, .14, '#6aa543');
    for (const [z0, z1] of [[DOG_YARD.z - 8, DOG_YARD.z - 2], [DOG_YARD.z + 2, DOG_YARD.z + 8]]) b.gFlat.box(-121.2, -120.9, 0, 1.0, z0, z1, '#f6f3ec', '#f6f3ec');
    b.gFlat.box(-115, -112, 0, 1.6, DOG_YARD.z - 1.5, DOG_YARD.z + 1.5, '#c0623f', '#8a4a32');
  },
});
makeRoofSign(scene, 'PIZZA', (PIZZERIA.x0 + PIZZERIA.x1) / 2 + .3, (PIZZERIA.z0 + PIZZERIA.z1) / 2, 15.5, 7.8, PIZZERIA.h + .07, Math.PI / 2);
const scooter = makeScooter(scene), market = makeMarket(scene), dog = makeDog(scene), works = makeWorks(scene), parade = makeParade(scene);
const cars = makeCars(scene, 1300), amb = makeAmbient(), walkers = makeWalkers(scene), bridge = makeBridge(scene), boats = makeBoats(scene);
const rain = makeRain(scene), folk = makeQuayFolk(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });   // instances move far from where they started
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— the scooter, the rider (steps off at the end), the pizza box ——
const boxW = new THREE.Vector3();
function placeScooter(t) {
  const st = scooterAt(t);
  scooter.g.position.set(st.x, st.y, st.z); scooter.g.rotation.set(0, st.yaw, 0, 'YXZ'); scooter.inner.rotation.x = st.pitch;
  // rider: walks out of the door and onto the scooter (0.9–1.5); at the end steps off toward the boat
  const r = scooter.rider;
  if (t < T.mount) {
    const u = seg(t, T.out, T.mount);
    r.position.set(lerp(-2.6, 0, eio(u)), t < T.out ? -50 : .8 - .8 * (1 - u) + .0, -.15);
    r.rotation.y = lerp(-Math.PI / 2, 0, u);
  } else if (t > T.stop + .1) {
    const u = eio(seg(t, T.stop + .1, T.hand - .05));
    r.position.set(0, .8 - .8 * Math.min(1, u * 3), -.15 + u * 3.6); r.rotation.y = 0;
  } else { r.position.set(0, .8, -.15); r.rotation.y = 0; }
  // the pizza box: hidden in the carrier, then in the rider's hands, then the customer's
  const pb = scooter.pbox;
  if (t < T.stop + .1) pb.position.set(0, -60, 0);
  else {
    scooter.g.updateMatrixWorld(true);
    const hands = new THREE.Vector3(); r.getWorldPosition(hands); hands.y += .95 * 1.7;
    const cust = V(BOAT.x, 1.7, BOAT.z - 1.3);
    const u = eio(seg(t, T.hand - .1, T.hand + .35));
    pb.position.copy(hands).lerp(cust, u); pb.rotation.y = st.yaw;
    pb.scale.setScalar(2.6);
  }
  return st;
}

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const sc = t => { const s = scooterAt(t); return V(s.x, 1 + s.y, s.z); };
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1), p = sc(t);
  let pos, look, fov = 34, up = V(0, 1, 0), band = { w: .07, amp: 30, mix: .62 }, aper = 5000, az = 0, rel = 40, el = 54, span = 160, subj = p;
  if (sh.id === 'pizzeria') {
    az = 270; look = V(-136, 0, lerp(38, 46, eio(seg(t, 1.6, 3)))); pos = orbit(look, az, 48, lerp(150, 140, u)); subj = V(-136, 1.5, lerp(37, 44, ss(seg(t, 2, 3))));
  } else if (sh.id === 'market') {
    az = 0; look = V(-130, 0, p.z + 16); pos = orbit(look, az, 50, 170); fov = 33;
  } else if (sh.id === 'dog') {
    az = 180; look = V(-129, 0, p.z - 4); pos = orbit(look, az, 46, 128); fov = 32; subj = V(p.x, 1, p.z - 2); rel = -40;
  } else if (sh.id === 'works') {
    az = 215; look = V(-124, 0, lerp(436, 430, u)); pos = orbit(look, az, 50, lerp(200, 185, u)); subj = V(-128, 1, 432); band = { w: .085, amp: 30, mix: .62 };
  } else if (sh.id === 'parade') {
    az = 180; look = V(-6, 0, ALLEY.z - 2); pos = orbit(look, az, 45, lerp(160, 140, eio(u))); subj = V(-8, 1, ALLEY.z); band = { w: .08, amp: 30, mix: .62 }; rel = -35;
  } else if (sh.id === 'top') {
    look = V(p.x, 0, p.z); const rot = lerp(Math.PI / 2, .03, eio(seg(t, 25.8, 28.2)));
    pos = look.clone().add(V(0, 200, 0)); up = V(Math.sin(rot), 0, Math.cos(rot)); fov = 40; az = 150; band = { w: .08, amp: 28, mix: .9 }; span = 180;
  } else if (sh.id === 'bridge') {
    az = 90; look = V(SOUTHX_L, 4, lerp(clamp(p.z, 618, 672), 653, .55)); pos = orbit(look, az, 30, 120); fov = 33; subj = V(117.4, 5, 653); band = { w: .1, amp: 30, mix: .6 }; rel = 35; el = 50;
  } else if (sh.id === 'rain') {
    az = 120; look = V(p.x + 10, 0, p.z + 2); pos = orbit(look, az, 50, 175); fov = 33; rel = 40;
  } else {
    const k = eio(seg(t, 39, 42.2)), k2 = eio(seg(t, 42.3, 45));
    az = 165; look = V(lerp(196, 203, k), lerp(0, 1.5, k) + 20 * k2, lerp(770, 790, k) - 18 * k2); pos = orbit(look, az, lerp(lerp(42, 33, k), 16, k2), lerp(lerp(130, 92, k), 160, k2)); fov = 32; subj = V(203, 1.5, 790);
    band = { w: lerp(.08, .055, seg(t, 41, 43)), amp: 30, mix: .64 }; aper = 6000; span = 120;
  }
  return { pos, look, fov, up, band, aper, sunAz: az + rel, sunEl: el, span, subj };
}
const SOUTHX_L = 117.4;

// —— overlay: the countdown plate and the subtitles (glazed street-name tiles) ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: v.t - .08, t1: 0 }));
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 };
const speedLabel = t => { const x = speedAt(t).x; return x === 'tl' ? `×${X_TL} TIME-LAPSE` : x === 'slow' ? '×¼ SLOW-MO' : '×1 REAL TIME'; };
const fmt = r => { const s = Math.ceil(r - 1e-6); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
function hudW(t) { g.font = '600 34px "Overpass Mono"'; const a = g.measureText(speedLabel(t)).width; g.font = '700 76px "Overpass Mono"'; return Math.max(a, g.measureText('00:00').width) + 120; }
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const rem = remaining(t), done = t >= T.hand, low = rem < 60 && !done, sp = speedAt(t).x;
  const w = hudW(t);
  g.save(); rr(HUD.x, HUD.y, w, 150, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  // pizza-slice icon
  const cx = HUD.x + 46, cy = HUD.y + 58;
  g.save(); g.translate(cx, cy); g.beginPath(); g.moveTo(0, 26); g.lineTo(-22, -18); g.quadraticCurveTo(0, -30, 22, -18); g.closePath(); g.fillStyle = '#f2b72e'; g.fill();
  g.beginPath(); g.moveTo(-22, -18); g.quadraticCurveTo(0, -30, 22, -18); g.lineWidth = 7; g.strokeStyle = '#c98a3a'; g.stroke();
  for (const [x, y] of [[-6, -8], [6, 2], [-2, 12]]) { g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fillStyle = '#d8342a'; g.fill(); }
  g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.fillStyle = done ? '#5fe08d' : low ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff';
  g.fillText(fmt(rem), HUD.x + 94, HUD.y + 60);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = sp === 'tl' ? '#ffbd45' : sp === 'slow' ? '#9fd4ff' : '#5fe08d';
  g.fillText(speedLabel(t), HUD.x + 94, HUD.y + 122);
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width, bw = tw + 120, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1));
    g.save(); g.globalAlpha = a; g.translate(0, (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#d8342a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(s.text, bx + 76, SUB_Y + 3);
    g.restore();
  }
}

// —— render ——
window.DUR = DUR;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = Sq(t);
  const st = placeScooter(t);
  cars.begin(); amb.draw(cars, t); cars.end();
  market.draw(t); dog.draw(t); works.draw(t); parade.draw(t); walkers.draw(t); bridge.draw(t); boats.draw(t);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0); c.subj = c.look.clone(); c.span = 700; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  folk.draw(t, camera); rain.draw(t, V(c.look.x, 0, c.look.z));
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span, rainAmt(t));
  rain.finish(camera, scene.fog);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t, type, ...o });
ev(0, 'bell'); ev(T.out, 'door'); ev(1.85, 'start'); ev(T.go, 'go');
for (const tt of [3.7, 5.3, 7.9]) ev(tt, 'beep');
ev(T.crate, 'crate'); for (let k = 0; k < 7; k++) ev(T.crate + .2 + k * .11, 'roll');
for (const tt of [9.55, 10.35, 11.2, 12.0]) ev(tt, 'bark'); ev(T.dogStop + .1, 'whine');
ev(T.brake, 'brake'); ev(T.uturn0, 'skid'); ev(T.alley, 'rev');
ev(T.real, 'real'); ev(T.resume, 'resume'); ev(T.go2, 'rev'); ev(26.7, 'corner');
ev(T.bells, 'bells'); ev(31.0, 'throttle'); ev(T.takeoff, 'takeoff'); ev(T.land, 'land');
ev(T.rain0, 'rain'); ev(35.1, 'thunder'); for (const tt of [35.6, 36.4, 37.3, 38.1]) ev(tt, 'splash');
ev(40.7, 'brake'); ev(T.stop, 'stop'); ev(T.hand, 'hand'); ev(T.rainbow, 'rainbow');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const sh of [3, 9, 14, 19, 25, 30, 34, 39]) ev(sh, 'cut');
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud-speed', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + hudW(t), y1: HUD.y + 150 }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
