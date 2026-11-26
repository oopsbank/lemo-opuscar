// Not In Our Town — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion)
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { buildWorld, U, STATION } from './world.js';
import { DUR, T, speedAt, Sq, VO, shotAt, X_TL } from './story.js';
import { PC, SAU, CAR0, PALM0, BOAT0, ENGINE_STOP_X, QUAY_LANE, saucerAt, beamAt, makeSaucer, makeBeam, makeLoot, makeTruck, makeDoor, truckAt, makeFireboats, fireboatAt, makeWater, rimPoint, makeSparks, makePeople, makeCars, makeAmbient, makeBridge, makeMoored } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 60px Overpass'); await document.fonts.load('900 300px Overpass'); await document.fonts.load('600 40px "Overpass Mono"'); await document.fonts.load('700 34px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 1, 9000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, taps: +(QS.get('taps') || 72), ao: false });
post.bloom.strength = .32; post.bloom.threshold = 1.05; post.bloom.radius = .45;
const GR = post.grade.uniforms; GR.sat.value = 1.42; GR.contrast.value = .4; GR.warm.value = .3; GR.amt.value = .26;

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
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#b9d3ec', '#a08c6c', .75); scene.add(hemi);
scene.fog = new THREE.FogExp2('#cfdde8', .00032);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .45; }
function setSun(focus, azDeg, elDeg, span) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d);
}

// —— world + actors ——
buildWorld(scene);
const saucer = makeSaucer(scene), beam = makeBeam(scene), loot = makeLoot(scene);
const truck = makeTruck(scene), door = makeDoor(scene), fireboats = makeFireboats(scene), water = makeWater(scene), sparks = makeSparks(scene);
const people = makePeople(scene), cars = makeCars(scene, 1400), amb = makeAmbient(), moored = makeMoored(scene);
makeBridge(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— Engine 9: position, lights, outriggers, ladder aimed at the saucer's rim ——
const nozzle = new THREE.Vector3();
function placeTruck(t) {
  const st = truckAt(t);
  truck.g.position.set(st.x, 0, st.z); truck.g.rotation.y = st.yaw;
  const ph = Math.floor(t * 6) % 2, lit = t > T.alarm + .3 ? 1 : 0;
  truck.lr.emissiveIntensity = lit * (ph ? 6 : .3); truck.lb.emissiveIntensity = lit * (ph ? .3 : 6);
  const o = ss(seg(t, T.outrig, T.outrig + .25));
  for (const l of truck.legs) { l.position.x = l.userData.sx * (1.1 + 1.2 * o); l.position.y = .7 - .45 * o; }
  truck.g.updateMatrixWorld(true);
  const tgt = rimPoint(Math.min(t, T.flee), V(st.x, 0, st.z));
  const local = truck.turn.worldToLocal(tgt.clone());
  const rise = seg(t, T.ladder0, T.ladder0 + .45), ext = seg(t, T.ladder0 + .2, T.ladder1);
  truck.turn.rotation.y = Math.atan2(local.x, local.z) * ss(rise);
  const pitchT = Math.atan2(local.y - .3, Math.hypot(local.x, local.z));
  truck.pitch.rotation.x = -pitchT * ss(rise) * (1 - .35 * smooth01(t, 35.5, 38));
  truck.fly.position.z = 7.2 * ss(ext) * (1 - smooth01(t, 35.5, 38));
  truck.g.updateMatrixWorld(true); truck.tip.getWorldPosition(nozzle);
  return st;
}
function smooth01(t, a, b) { return ss(seg(t, a, b)); }

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
let lootPos = null;
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1), ts = truckAt(t), tp = V(ts.x, 1.5, ts.z), sp = saucerAt(t).p;
  let pos, look, fov = 34, up = V(0, 1, 0), band = { w: .075, amp: 30, mix: .62 }, aper = 5000, sunAz = 0, sunEl = 52, span = 170, subj = null;
  if (sh.id === 'shadow') {
    look = V(0, 0, lerp(395, 425, eio(u))); pos = orbit(look, 0, 50, lerp(245, 222, eio(u))); fov = 35;
    sunAz = 0; sunEl = 52; span = 240; subj = look.clone();
  } else if (sh.id === 'reveal') {
    const k = eio(seg(t, 4.2, 7.6));
    pos = V(lerp(-10, -16, k), lerp(125, 42, k), lerp(545, 606, k));
    look = V(0, 0, 655).lerp(V(sp.x, sp.y - 6, sp.z), k); fov = lerp(36, 33, k);
    subj = V(0, 2, 650).lerp(sp, k); sunAz = 25; sunEl = 46; span = 200; band = { w: lerp(.08, .07, k), amp: 30, mix: .6 }; aper = 4000;
  } else if (sh.id === 'beam') {
    look = V(10, 16, 766); pos = orbit(look, 180, 36, lerp(200, 178, eio(u))); fov = 34;
    subj = lootPos ? lootPos.clone() : V(CAR0.x, 1, CAR0.z); sunAz = 180 + 35; sunEl = 50; span = 160; band = { w: .09, amp: 28, mix: .58 };
  } else if (sh.id === 'station') {
    const f = ss(seg(t, 17.2, 19)); look = V(-2, 0, lerp(-28, ts.z - 6, f * .8)); pos = orbit(look, 200, 48, lerp(205, 190, u)); fov = 36;
    subj = t < T.out ? V(0, 3, -26) : tp; sunAz = 160; sunEl = 55; span = 160;
  } else if (sh.id === 'top') {
    const lead = smooth01(t, 22.8, 24.6) * 55;
    look = V(ts.x, 0, ts.z + lead); const rot = lerp(Math.PI / 2, .03, eio(seg(t, 19.4, 22.4)));
    pos = look.clone().add(V(0, lerp(175, 205, smooth01(t, 22.8, 24.6)), 0)); up = V(Math.sin(rot), 0, Math.cos(rot)); fov = 40; sunAz = 150; sunEl = 58; span = 220;
    band = { w: .09, amp: 28, mix: .9 }; subj = tp;
  } else if (sh.id === 'attack') {
    const slow = smooth01(t, 28.2, 28.9) * (1 - smooth01(t, 30.0, 30.8));
    look = V(lerp(38, 34, u), lerp(24, 28, slow), lerp(790, 784, u)); pos = orbit(look, 196, lerp(34, 30, slow), lerp(240, 210, eio(u)) - 25 * slow); fov = 36;
    subj = t < T.water ? tp : rimPoint(t, tp).lerp(tp, .35 * (1 - slow)); sunAz = 196 + 40; sunEl = 50; span = 190;
    band = { w: lerp(.12, .075, slow), amp: 30, mix: .55 }; aper = 4500;
  } else if (sh.id === 'payoff') {
    const k = smooth01(t, 33.6, 34.6);
    look = V(8, lerp(25, 48, k), 768); pos = orbit(look, 162, lerp(15, 10, k), lerp(132, 140, u)); fov = 38;
    subj = t < T.drop2 ? V(CAR0.x, 1, CAR0.z) : t < T.drop3 ? V(PALM0.x, 3, PALM0.z) : t < T.wobble ? V(BOAT0.x, 1, BOAT0.z) : sp.clone();
    if (t > T.flee + .25) subj = V(10, 20, 770);
    sunAz = 166 + 40; sunEl = 50; span = 150; band = { w: .1, amp: 30, mix: .6 };
  } else {   // rise
    const k = eio(seg(t, 35, 40)), h = Math.exp(lerp(Math.log(150), Math.log(780), k));
    look = V(lerp(40, 30, k), 0, lerp(764, 700, k)); pos = orbit(look, lerp(160, 175, k), lerp(52, 68, k), h); fov = 34;
    subj = V(ENGINE_STOP_X - 8, 1, 758).lerp(look, k); sunAz = 200; sunEl = 52; span = lerp(170, 520, k);
    band = { w: lerp(.08, .16, k), amp: 30, mix: .6 };
  }
  return { pos, look, fov, up, band, aper, sunAz, sunEl, span, subj: subj || look.clone() };
}

// —— overlay: speed plate + UFO alert (top left), subtitles on glazed tiles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: v.t - .08, t1: 0 }));
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 150 };
const hudLabel = t => { const x = speedAt(t).x; return x === 'tl' ? `×${X_TL} TIME-LAPSE` : x === 'slow' ? '×¼ SLOW-MO' : '×1 REAL TIME'; };
const alertAt = t => t >= T.reveal && t < T.flee + .4 ? 'UFO OVERHEAD' : t >= T.flee + .4 ? 'ALL CLEAR' : null;
function hudW(t) { g.font = '600 40px "Overpass Mono"'; return 92 + g.measureText(hudLabel(t)).width + 28; }
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const sp = speedAt(t).x, lab = hudLabel(t), hw = hudW(t), al = alertAt(t);
  const ph = al ? 150 : 92;
  g.save(); rr(HUD.x, HUD.y, hw, ph, 16); g.fillStyle = 'rgba(14,22,34,.78)'; g.fill(); g.restore();
  const cx = HUD.x + 48, cy = HUD.y + 46, col = sp === 'tl' ? '#ffbd45' : sp === 'slow' ? '#9fd4ff' : '#5fe08d';
  g.beginPath(); g.arc(cx, cy, 28, 0, Math.PI * 2); g.fillStyle = '#f6f2e8'; g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke();
  const ang = Sq(t) * 1.7 - Math.PI / 2; g.lineCap = 'round';
  g.strokeStyle = '#17212e'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang / 12) * 13, cy + Math.sin(ang / 12) * 13); g.stroke();
  g.font = '600 40px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = col; g.fillText(lab, HUD.x + 92, HUD.y + 48);
  if (al) {
    const clear = al === 'ALL CLEAR', blink = clear || Math.floor(t * 3) % 2 === 0;
    g.beginPath(); g.arc(cx, HUD.y + 116, 10, 0, Math.PI * 2); g.fillStyle = clear ? '#5fe08d' : blink ? '#ff4d3d' : '#7a2a24'; g.fill();
    g.font = '700 34px "Overpass Mono"'; g.fillStyle = clear ? '#5fe08d' : '#ff6b5a'; g.fillText(al, HUD.x + 92, HUD.y + 118);
  }
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width, bw = tw + 120, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1));
    g.save(); g.globalAlpha = a; g.translate(0, (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#35c86a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(s.text, bx + 76, SUB_Y + 3);
    g.restore();
  }
}

// —— render ——
window.DUR = DUR;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = Sq(t);
  const st = placeTruck(t);
  const open = seg(t, T.door0, T.door1), dh = 5.6 * (1 - open) + .01;
  door.scale.set(1, dh, 1); door.position.set(0, 5.6 - dh / 2, STATION.z1 + .32);
  cars.begin(); amb.draw(cars, t); cars.end();
  const lp = loot.draw(t);
  lootPos = t < T.beam2 ? lp.car.clone() : t < T.beam3 ? lp.palm.clone().add(V(0, 4, 0)) : lp.boat.clone().add(V(0, 3, 0));
  if (t > T.gone3) lootPos = saucerAt(t).p.clone();
  const beamOn = beam.draw(t);
  saucer.draw(t, beamOn); saucer.g.scale.setScalar(t < T.reveal ? 1.9 : 1);
  people.draw(t, st); moored.draw(t); fireboats.draw(t);
  water.draw(t, [nozzle.clone(), ...fireboats.tips.map(v => v.clone())]);
  sparks.draw(t);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0); c.subj = c.look.clone(); c.span = +(QS.get('span') || 400); c.aper = 30000; c.band = { w: +(QS.get('bw') || .1), amp: 26, mix: .7 }; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  fireboats.finish(camera, scene.fog); water.finish(camera, scene.fog); sparks.finish(camera, scene.fog);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(T.real, 'tapestop'); ev(T.hum, 'hum'); ev(T.reveal, 'gong'); ev(5.9, 'theremin');
for (const [b, l, n] of [[T.beam1, T.lift1, 'car'], [T.beam2, T.lift2, 'palm'], [T.beam3, T.lift3, 'boat']]) { ev(b, 'zap', { what: n }); ev(l, 'lift', { what: n }); }
ev(T.beam1 + .25, 'screams'); ev(T.beamOff, 'beamoff');
ev(T.alarm, 'alarm'); for (let k = 0; k < 10; k++) ev(T.door0 + k * .08, 'door'); ev(T.door1 + .05, 'engine'); ev(T.out, 'depart'); ev(T.out + .2, 'siren');
ev(T.boats0, 'boats'); ev(22.6, 'bridge'); ev(24.6, 'brake');
for (let k = 0; k < 4; k++) ev(T.outrig + k * .0625, 'outrig'); for (let k = 0; k < 9; k++) ev(T.ladder0 + .2 + k / 12, 'ladder');
ev(T.water, 'water'); ev(T.arcs, 'arcs'); ev(T.slow0, 'slow'); ev(T.hit, 'hit'); ev(T.slow1, 'release');
for (let k = 0; k < 10; k++) ev(30.1 + k * .37 + (k % 3) * .05, 'crackle');
ev(T.fizzle, 'fizzle'); ev(T.land1, 'land', { what: 'car' }); ev(T.land2, 'land', { what: 'palm' }); ev(T.land3, 'land', { what: 'boat' });
ev(T.wobble, 'wobble'); ev(T.flee, 'flee'); ev(35.4, 'cheer'); ev(36.4, 'honk', { pan: -.4 }); ev(37.2, 'honk', { pan: .5 });
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [4, 8, 15, 19, 25, 31, 35]) ev(s, 'cut');
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => { const out = [{ id: 'hud', text: hudLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + hudW(t), y1: HUD.y + 92 }]; const a = alertAt(t); if (a) out.push({ id: 'alert', text: a, x0: HUD.x, y0: HUD.y + 92, x1: HUD.x + hudW(t), y1: HUD.y + 150 }); return out; };
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
