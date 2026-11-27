// Storm Surge vs the Sea Wall — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { buildWorld, U, QUAY, CHAN } from './world.js';
import { DUR, T, speedAt, elapsed, remaining, VO, shotAt, gate, gatesShut, front, baseLevel, reset, SURGE, CLOCK0, frontZ } from './story.js';
import { GATES, WALL, EXCL, MARKET, gateCentre, wallGeometry, makeGates, makeSea, SEA, makeVanAndTruck, makePeople, makeRain, makeSpray, makeCat } from './actors.js';

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
post.bloom.strength = .3; post.bloom.threshold = 1.0; post.bloom.radius = .45;
const GR = post.grade.uniforms; GR.sat.value = 1.22; GR.contrast.value = .42; GR.warm.value = .06; GR.amt.value = .32;

// —— storm sky: low grey cloud deck, a paler band at the horizon ——
const skyMat = new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(0, 1, 0) }, ft: { value: 0 } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir; uniform float ft;
    float h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.);
    vec3 c = mix(vec3(.70,.73,.75), vec3(.40,.44,.49), pow(t, .45));
    vec2 q = d.xz / max(d.y, .06) * 1.6 + vec2(ft * .05, ft * .02); float cl = n(q) * .6 + n(q * 2.3) * .4;
    c *= .86 + .22 * cl; if (d.y < 0.) c = vec3(.62,.66,.68); gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), skyMat); dome.frustumCulled = false; scene.add(dome);
const sun = new THREE.DirectionalLight('#eef1f4', 1.9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 4;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#c3ccd6', '#7d776c', 1.25));
scene.fog = new THREE.FogExp2('#aeb6bc', .00042);
{ const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat)); scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0, .1, 200).texture; scene.environmentIntensity = .6; }
function setSun(focus, azDeg, elDeg, span) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.copy(focus).addScaledVector(d, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 300, far: 1800 }); sun.shadow.camera.updateProjectionMatrix();
  skyMat.uniforms.sunDir.value.copy(d);
}

U.storm.value = 1;
const world = buildWorld(scene, { excl: EXCL, extra: b => wallGeometry(b) });
world.waterMat.color.set('#55716e'); world.waterMat.roughness = .25;
const sea = makeSea(scene), gates = makeGates(scene), vt = makeVanAndTruck(scene), people = makePeople(scene), rain = makeRain(scene), spray = makeSpray(scene);
makeCat(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const storm = t => clamp(elapsed(t) / CLOCK0) * (1 - reset(t));   // 0 … 1, how wild the sea is

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const OPEN = P(V(-20, 0, 900), 4, 31, 600, 36);
const G1 = P(V(-288, 0, 784), 18, 38, 120, 34);
const G2A = P(V(246, 1, 781), 335, 36, 62, 34);
const G2B = P(V(248, 0, 772), 322, 46, 120, 34);
const G3 = P(V(-144, 1, 800), 8, 21, 135, 34);
const G4A = P(V(20, 0, 774), 352, 44, 175, 34);
const G4B = P(V(20, 1.5, 792), 14, 24, 78, 34);
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1);
  let p, subj, band = { w: .075, amp: 30, mix: .62 }, aper = 5000, sunAz = 30, sunEl = 50, span = 200;
  if (sh.id === 'open') { p = P(OPEN.look, OPEN.az, OPEN.pitch, OPEN.dist - 20 * eio(u), OPEN.fov); subj = gateCentre(3).clone().lerp(V(-20, 0, 812), .5); span = 420; band = { w: .1, amp: 26, mix: .55 }; }
  else if (sh.id === 'g1') { const k = eio(seg(t, 3.2, 5.0)); p = mixP(P(OPEN.look, OPEN.az, OPEN.pitch, OPEN.dist - 20, OPEN.fov), G1, k); p.dist *= 1 - .06 * eio(seg(t, 5, 8)); subj = gateCentre(0).clone().lerp(V(-20, 0, 812), 1 - k); span = lerp(420, 140, k); sunAz = 18 + 40; }
  else if (sh.id === 'g2a') { p = P(G2A.look, G2A.az, G2A.pitch, G2A.dist - 5 * eio(u), G2A.fov); subj = V(245, 1.5, 782); band = { w: .06, amp: 32, mix: .64 }; aper = 6500; span = 90; sunAz = 335 + 40; }
  else if (sh.id === 'g2b') { p = mixP(G2A, G2B, eio(seg(t, 10.6, 12))); p.dist *= 1 - .08 * eio(u); subj = vt.truck.visible ? vt.truck.position.clone().setY(1.2).lerp(gateCentre(1), .4) : gateCentre(1); span = 140; sunAz = 322 + 40; }
  else if (sh.id === 'g3') { p = P(G3.look, G3.az, G3.pitch, G3.dist - 12 * eio(u), G3.fov); subj = gateCentre(2); span = 160; sunAz = 8 + 40; band = { w: .07, amp: 30, mix: .6 }; }
  else if (sh.id === 'g4a') { const k = eio(seg(t, 24.0, 26)); p = mixP(P(G4A.look, G4A.az, G4A.pitch, G4A.dist - 15 * eio(seg(t, 21, 24)), G4A.fov), G4B, k); subj = V(22, 1, lerp(768, 791, k)); span = lerp(200, 110, k); sunAz = lerp(352, 14, k) + 40; }
  else if (sh.id === 'g4b') { const sh2 = t > T.impact ? Math.exp(-(t - T.impact) * 2.2) * .35 * Math.sin((t - T.impact) * 38) : 0; p = P(G4B.look.clone().add(V(0, sh2, 0)), G4B.az, G4B.pitch, G4B.dist - 8 * eio(seg(t, 26, 32)) + 10 * eio(seg(t, 32.4, 34)), G4B.fov); subj = gateCentre(3); band = { w: .065, amp: 32, mix: .64 }; aper = 6200; span = 110; sunAz = 14 + 40; }
  else { const k = eio(seg(t, 34, DUR)); const from = P(G4B.look, G4B.az, G4B.pitch, G4B.dist + 2, G4B.fov); p = mixP(from, P(OPEN.look, OPEN.az, OPEN.pitch, OPEN.dist, OPEN.fov), k); subj = gateCentre(3).clone().lerp(gateCentre(3).clone().lerp(V(-20, 0, 812), .5), k); span = lerp(110, 420, k); sunAz = lerp(54, 34, k); band = { w: lerp(.065, .1, k), amp: lerp(32, 26, k), mix: lerp(.64, .55, k) }; }
  const pos = orbit(p.look, p.az, p.pitch, p.dist);
  return { pos, look: p.look, fov: p.fov, up: V(0, 1, 0), band, aper, sunAz, sunEl, span, subj };
}

// —— overlay: surge clock plate, gate map, subtitles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 }, MAP = { x: 56, y: 356, w: 430, h: 210 };
function speedLabel(t) { const s = speedAt(t); if (s.x === 'real' || s.k(t) < 1.5) return '×1 REAL TIME'; const k = s.k(t); return `×${k < 10 ? Math.round(k) : Math.round(k / 10) * 10} TIME-LAPSE`; }
const fmt = r => { const s = Math.ceil(r - 1e-6); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const rem = remaining(t), held = t >= T.impact + .3, low = rem < 60 && !held, real = speedLabel(t)[1] === '1', n = gatesShut(t);
  g.save(); rr(HUD.x, HUD.y, 430, 196, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  // wave glyph
  g.save(); g.translate(HUD.x + 50, HUD.y + 60); g.strokeStyle = '#9fd4ff'; g.lineWidth = 6; g.lineCap = 'round';
  for (const dy of [-12, 2, 16]) { g.beginPath(); for (let x = -24; x <= 24; x += 2) { const y = dy + Math.sin(x / 7 + t * 4) * 4; x === -24 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = held ? '#5fe08d' : low ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff'; g.fillText(fmt(rem), HUD.x + 100, HUD.y + 60);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = real ? '#5fe08d' : '#ffbd45'; g.fillText(speedLabel(t), HUD.x + 30, HUD.y + 128);
  g.fillStyle = held ? '#5fe08d' : '#9fd4ff'; g.fillText(held ? 'THE WALL HELD' : 'GATES', HUD.x + 30, HUD.y + 170);
  if (!held) for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(HUD.x + 178 + i * 38, HUD.y + 168, 13, 0, Math.PI * 2); g.fillStyle = i < n ? '#5fe08d' : 'rgba(255,255,255,.18)'; g.fill(); if (i >= n) { g.lineWidth = 3; g.strokeStyle = '#ff6b5a'; g.stroke(); } }
  if (!held) { g.fillStyle = '#9fd4ff'; g.fillText('SHUT', HUD.x + 330, HUD.y + 170); }
  // the map: the quay from above (town top, sea bottom), the four gates, the surge line coming up
  const m = MAP, X = x => m.x + 20 + (x + 470) / 940 * (m.w - 40), wallY = m.y + 92;
  const Zy = z => wallY + Math.min(1, (z - 792) / 1300) * (m.h - 104);
  g.save(); rr(m.x, m.y, m.w, m.h, 14); g.fillStyle = 'rgba(14,22,34,.72)'; g.fill(); g.clip();
  g.fillStyle = 'rgba(217,208,191,.35)'; g.fillRect(m.x, m.y, m.w, 44);
  g.fillStyle = '#5b8fa6'; g.fillRect(m.x, m.y + 44, m.w, 9);   // the canal
  g.fillStyle = 'rgba(217,208,191,.25)'; g.fillRect(m.x, m.y + 53, m.w, 39);
  g.fillStyle = '#5b8fa6'; g.fillRect(X(CHAN.x0), m.y + 53, X(CHAN.x1) - X(CHAN.x0), 39);   // the channel
  g.fillStyle = 'rgba(70,104,112,.85)'; g.fillRect(m.x, wallY, m.w, m.h);
  const fz = front(t), fy = Zy(fz);
  g.fillStyle = 'rgba(140,170,178,.55)'; g.fillRect(m.x, fy, m.w, m.h);   // raised sea behind the front
  g.strokeStyle = '#f2f6f8'; g.lineWidth = 5; g.beginPath(); for (let x = m.x; x <= m.x + m.w; x += 6) { const y = fy + Math.sin(x / 9 + t * 5) * 2.5; x === m.x ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.fillStyle = '#e0dace'; g.fillRect(m.x + 10, wallY - 5, m.w - 20, 7);
  for (let i = 0; i < 4; i++) { const G = GATES[i], x0 = X(G.x0) - 4, x1 = X(G.x1) + 4, sh = gate(i, t) > .995; g.fillStyle = sh ? '#5fe08d' : (Math.floor(t * 4) % 2 ? '#ff4d3d' : '#c2382c'); rr(x0, wallY - 10, Math.max(16, x1 - x0), 17, 5); g.fill(); }
  g.restore();
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  if (s) {
    g.font = '800 54px Overpass'; const tw = g.measureText(s.text).width, sc = Math.min(1, 900 / (tw + 120)), bw = (tw + 120) * sc, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = s.t0 === 0 ? 1 - seg(t, s.t1 - .12, s.t1) : Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1));
    g.save(); g.globalAlpha = a; g.translate(0, s.t0 === 0 ? 0 : (1 - eo(seg(t, s.t0, s.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44 * sc, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#ffc21a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `800 ${Math.round(54 * sc)}px Overpass`; g.fillText(s.text, bx + 76 * sc, SUB_Y + 3);
    g.restore();
  }
}

window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = elapsed(t) / 60 + t * .4;         // cloud shadows drift with the clock (and a little with film time)
  skyMat.uniforms.ft.value = elapsed(t) / 60 + t;
  const lv = baseLevel(t), st = storm(t);
  SEA.level.value = lv; SEA.zf.value = front(t); SEA.surge.value = SURGE; SEA.crest.value = ss(seg(front(t), 781, 800)); SEA.ft.value = t; SEA.storm.value = .45 + .55 * st;
  // the canal and channel follow the sea until gate 1 shuts, then stay put
  world.canal.position.y = world.chanW.position.y = (t > T.g1[1] && reset(t) < .5 ? baseLevel(T.g1[1]) : Math.min(lv, -1.2)) + .02;
  gates.draw(t); vt.draw(t); people.draw(t);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.subj = c.look.clone(); c.span = 500; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  if (!QS.has('norain')) rain.draw(t, c.pos, c.look);
  spray.draw(t, camera, st);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 28;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix and the score ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(T.g1[0], 'gate_start', { i: 0 }); ev(T.g1[1], 'gate_shut', { i: 0 });
ev(T.g2try[0], 'gate_start', { i: 1 }); ev(T.g2try[1], 'clunk', { i: 1 }); ev(T.g2[0], 'gate_start', { i: 1 }); ev(T.g2[1], 'gate_shut', { i: 1 });
ev(T.g3[0], 'gate_start', { i: 2 }); ev(T.g3[1], 'gate_shut', { i: 2 });
ev(T.g4[0], 'gate_start', { i: 3 }); ev(T.g4[1], 'gate_shut', { i: 3 });
ev(T.impact, 'impact'); ev(12.7, 'hook'); ev(10.6, 'truck');
ev(8.0, 'real'); ev(10.6, 'resume'); ev(26.0, 'real'); ev(34.0, 'resume');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [3.2, 8, 10.6, 15.6, 21, 26, 34]) ev(s, 'cut');
// waves on the wall (storm level), sampled each 0.25 s for the mix
for (let t = 0; t < DUR; t += .25) ev(t, 'storm', { v: +storm(t).toFixed(3), fz: +front(t).toFixed(1) });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + 430, y1: HUD.y + 196, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
