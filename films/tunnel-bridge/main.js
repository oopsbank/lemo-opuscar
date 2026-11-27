// Tunnel or Bridge? — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, ei } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, VO, shotAt, sim, rate, isRewind, invSim, pose, dist, toGo, inTunnel, BR, BAY, CAMPER, PORTAL, FIN, T_ENTER, T_EXIT, T_CAMPER, T_STOPB, LEN } from './story.js';
import { makeDressing } from './dressing.js';
import { makeHarbour } from './harbour.js';
import { EXCL, COL, extraGeometry, makeAmbulances, makeBridge, makeSailboat, makeCamper, makeTraffic, makePeople, makeTunnelLamps, makeCat, makeQuayDressing } from './actors.js';

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
const amb = makeAmbulances(scene), bridge = makeBridge(scene), sail = makeSailboat(scene), camper = makeCamper(scene), traffic = makeTraffic(scene), people = makePeople(scene);
makeTunnelLamps(scene); makeCat(scene); const quay = makeQuayDressing(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— shots ——
const proj = new THREE.Vector3();
const toScreen = p => { proj.copy(p).project(camera); return { x: (proj.x * .5 + .5) * W, y: (1 - (proj.y * .5 + .5)) * H, z: proj.z }; };
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
const sharp = t => { const k = ss(seg(t, 1.6, 2.4)); return { w: lerp(.34, .07, k), amp: lerp(10, 28, k), mix: lerp(.25, .62, k) }; };
// the close at the bay: the camera stands at the bay mouth and whips from A (coming south) to B (coming north)
const EYE = V(7.5, 6.5, 594);
const closeCam = (t, s) => {
  const k = eio(seg(t, .55, 1.05));
  const a = amb.A.pos(s), b = amb.B.pos(s);
  const look = a.clone().setY(1.5).lerp(b.clone().setY(1.5), k);
  return { pos: EYE.clone(), look, fov: 30, subj: look.clone().setY(1.5) };
};
const AER = P(V(-8, 0, 650), 180, 58, 760, 36);
const START = P(V(-20, 0, 752), 192, 42, 100, 34);
const CAMP = P(V(-127, 0, 730), 192, 42, 70, 34);
const TUN = P(V(-130, 0, 664), 186, 52, 210, 35);
const BRG = P(V(119, 0, 664), 205, 34, 92, 34);
const CONV = P(V(-2, 0, 578), 180, 56, 430, 36);
const TOP = t => ({ pos: V(16 + 3 * seg(t, 29.6, 31.5), 27 + 3 * seg(t, 29.6, 31.5), 592), look: V(-9, 1, 592), fov: 36 });   // photo finish from across the street: the line runs across the frame   // photo finish, straight down
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1), s = sim(t);
  let p = null, c = null, subj, band = { w: .17, amp: 15, mix: .5 }, aper = 5600, sunEl = 23, span = 220;
  if (sh.id === 'open') { c = closeCam(t, s); band = sharp(t); aper = 700; span = 60; }
  else if (sh.id === 'rewind') {
    const o = closeCam(1.6, sim(1.6)), k = eio(seg(t, 1.6, 2.7));
    const a = { look: o.look, pos: o.pos }, bp = orbit(AER.look, AER.az, AER.pitch, AER.dist);
    c = { pos: a.pos.clone().lerp(bp, k), look: a.look.clone().lerp(AER.look, k), fov: lerp(36, AER.fov, k), subj: AER.look.clone() };
    c.subj = a.look.clone().lerp(AER.look, k); band = sharp(t); band.w = lerp(band.w, .2, k); aper = lerp(700, 9000, k); span = lerp(60, 420, k);
  }
  else if (sh.id === 'start') { p = mixP(AER, START, eio(seg(t, 3.2, 4.4))); p.dist *= 1 + .25 * eio(seg(t, 4.4, 6.2)); subj = V(-20, 1, 746); span = lerp(400, 160, eio(seg(t, 3.2, 4.4))); }
  else if (sh.id === 'brun') { const b = amb.B.pos(s); p = P(V(b.x - 8, 0, b.z + 6), 200, 38, lerp(88, 100, u), 34); subj = b; span = 150; }
  else if (sh.id === 'camper') { const a = amb.A.pos(s); p = P(CAMP.look.clone().lerp(V(-130, 0, 718), eio(u)), CAMP.az, CAMP.pitch, CAMP.dist - 8 * eio(u), 34); subj = s < T_CAMPER - 1 ? V(CAMPER.x, 2, CAMPER.z) : a; span = 130; }
  else if (sh.id === 'tunnel') { p = P(TUN.look, TUN.az, TUN.pitch, TUN.dist - 14 * eio(u), TUN.fov); subj = V(-130, 1, 690); span = 220; band = { w: .17, amp: 16, mix: .5 }; }
  else if (sh.id === 'twist') { p = P(BRG.look, BRG.az, BRG.pitch, BRG.dist - 8 * eio(u), BRG.fov); subj = V(121, 2, 668); span = 140; band = { w: .15, amp: 16, mix: .5 }; }
  else if (sh.id === 'comeback') { const b = amb.B.pos(s); const k = eio(seg(t, 21.3, 23)); p = P(BRG.look.clone().lerp(V(b.x - 6, 0, b.z - 2), k), lerp(BRG.az, 200, k), lerp(BRG.pitch, 40, k), lerp(BRG.dist - 8, 120, k), 34); subj = s < BR.go ? V(121, 2, 668) : b; span = 160; }
  else if (sh.id === 'converge') { p = P(CONV.look, CONV.az, CONV.pitch, CONV.dist - 60 * eio(u), CONV.fov); subj = V(-14, 1, 575); span = 300; band = { w: .16, amp: 24, mix: .5 }; }
  else if (sh.id === 'final') {
    if (t < 27.8) { c = closeCam(0, s); const a = amb.A.pos(s); c.look = a.clone().setY(1.5); c.subj = a.clone().setY(1.5); aper = 900; band = { w: .2, amp: 14, mix: .4 }; span = 70; }
    else {   // photo finish: straight down on the bay line, north up, the ambulances crossing right to left
      const k = t < 27.8 ? 0 : 1, a = amb.A.pos(s);   // a hard cut into the slow-mo
      const top = TOP(t);
      c = { pos: EYE.clone().lerp(top.pos, k), look: a.clone().setY(1.5).lerp(top.look, k), fov: lerp(30, top.fov, k), subj: top.look.clone() };
      aper = lerp(900, 3000, k); band = { w: .3, amp: 8, mix: .3 }; span = 70;
    }
  }
  else {   // rise to the aerial, then the last 0.55 s dives back to the frame-0 close (the race rewinds under it)
    const top = TOP(31.5), ap = orbit(CONV.look, CONV.az, CONV.pitch, CONV.dist - 60);
    const k = eio(seg(t, 31.5, 34.25)); c = { pos: top.pos.clone().lerp(ap, k), look: top.look.clone().lerp(CONV.look, k), fov: lerp(top.fov, CONV.fov, k), subj: top.look.clone().lerp(CONV.look, k), up: V(0, 1, 0) };
    const d = ei(seg(t, 34.25, DUR - 1 / 24));
    if (d > 0) {   // dive: direction blends, distance blends in log space, so the last frames really are the close
      const o = closeCam(0, s), va = c.pos.clone().sub(o.subj), vc = o.pos.clone().sub(o.subj);
      const len = Math.exp(lerp(Math.log(va.length()), Math.log(vc.length()), d)), dir = va.normalize().lerp(vc.normalize(), d).normalize();
      c.pos = o.subj.clone().addScaledVector(dir, len); c.look.lerp(o.look, d); c.fov = lerp(c.fov, o.fov, d); c.subj = o.subj; c.up.lerp(V(0, 1, 0), d).normalize();
    }
    span = lerp(80, 300, k); band = { w: lerp(.18, .14, k), amp: lerp(16, 24, k), mix: .5 }; aper = lerp(1600, 5600, k);
    if (d > 0) { band = sharp(0); aper = lerp(aper, 700, d); span = lerp(span, 60, d); }
  }
  if (!c) c = { pos: orbit(p.look, p.az, p.pitch, p.dist), look: p.look, fov: p.fov, subj };
  const closeK = sh.id === 'open' || sh.id === 'final' ? 1 : sh.id === 'rewind' ? 1 - seg(t, 1.6, 2.4) : sh.id === 'rise' ? Math.max(1 - seg(t, 31.5, 32.5), seg(t, 34.25, DUR)) : 0;
  return { up: V(0, 1, 0), ...c, band, aper, sunAz: lerp(205, 250, closeK), sunEl: lerp(sunEl, 36, closeK), span };
}

// —— overlay: race plate (both distances), route map, tags over the ambulances, the hook, the rewind stamp, the result, subtitles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) { const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1]; s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR; }
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 }, MAP = { x: 56, y: 390, w: 330, h: 300 };
function speedLabel(t) { const k = rate(t); if (isRewind(t) || k < -.05) return '◀◀ REWIND'; if (k < .45) return '×¼ SLOW-MO'; if (k < 1.4) return '×1 REAL TIME'; return `×${Math.round(k)} FAST`; }
const tile = (lines, y0, col = '#1d4c9e', bg = '#f7f4ec', size = 104, w = 860) => {
  const h = lines.length * size * 1.06 + 90;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(W / 2 - w / 2 - 30, y0 - h / 2, w, h, 26); g.fillStyle = bg; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 10; g.strokeStyle = col; rr(W / 2 - w / 2 - 16, y0 - h / 2 + 14, w - 28, h - 28, 18); g.stroke();
  g.font = `900 ${size}px Overpass`; lines.forEach(([txt, c], i) => { g.fillStyle = c || col; g.fillText(txt, W / 2 - 30, y0 + (i - (lines.length - 1) / 2) * size * 1.06 + 4); });
};
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  const s = sim(t);
  // tags over the ambulances when they're small on screen
  for (const k of ['A', 'B']) {
    if (k === 'A' && inTunnel(s)) continue;
    const p = amb[k].pos(s), d = camera.position.distanceTo(p); const a = clamp((d - 120) / 60) * (1 - seg(t, 26.0, 26.2)) * seg(t, 2.6, 3.0);
    if (a <= 0) continue;
    const q = toScreen(p.clone().setY(9)); if (q.z > 1) continue;
    g.save(); g.globalAlpha = a; g.fillStyle = COL[k]; g.strokeStyle = '#fff'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(q.x, q.y + 30); g.lineTo(q.x - 14, q.y + 8); g.lineTo(q.x + 14, q.y + 8); g.closePath(); g.fill();
    g.beginPath(); g.arc(q.x, q.y - 10, 30, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.font = '900 40px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, q.x, q.y - 7); g.restore();
  }
  // race plate
  const ha = seg(t, 2.9, 3.3) * (1 - seg(t, 33.9, 34.25));
  if (ha > 0) {
    g.save(); g.globalAlpha = ha; rr(HUD.x, HUD.y, 470, 206, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    for (const [i, k, name] of [[0, 'A', 'TUNNEL'], [1, 'B', 'BRIDGE']]) {
      const y = HUD.y + 44 + i * 64, done = s >= FIN[k], left = toGo(k, s);
      g.fillStyle = COL[k]; rr(HUD.x + 22, y - 22, 44, 44, 9); g.fill(); g.fillStyle = '#fff'; g.font = '900 32px Overpass'; g.textAlign = 'center'; g.fillText(k, HUD.x + 44, y + 2); g.textAlign = 'left';
      g.font = '700 34px "Overpass Mono"'; g.fillStyle = '#e9edf2'; g.fillText(name, HUD.x + 82, y + 2);
      let txt = done ? (k === 'A' ? '1ST' : '2ND') : `${Math.round(left)} m`, col = done ? (k === 'A' ? '#5fe08d' : '#ffbd45') : '#ffffff';
      if (k === 'B' && s > BR.bell && s < BR.go && !done) { txt = Math.floor(t * 4) % 2 ? 'WAIT' : `${Math.round(left)} m`; col = '#ff6b5a'; }
      if (k === 'A' && inTunnel(s)) { txt = `${Math.round(left)} m`; col = '#9fd4ff'; }
      g.font = '700 50px "Overpass Mono"'; g.fillStyle = col; g.textAlign = 'right'; g.fillText(txt, HUD.x + 446, y + 2); g.textAlign = 'left';
    }
    const k = rate(t); g.font = '600 32px "Overpass Mono"'; g.fillStyle = isRewind(t) ? '#ff6b5a' : Math.abs(k - 1) < .4 ? '#5fe08d' : '#ffbd45'; g.fillText(speedLabel(t), HUD.x + 24, HUD.y + 178);
    g.restore();
  }
  // route map: the canal, the tunnel (dashed under it), the bridge, both routes, the hospital, two dots
  const ma = seg(t, 3.4, 3.9) * (1 - seg(t, 26.0, 26.3)) + seg(t, 31.6, 32.0) * (1 - seg(t, 33.9, 34.25));
  if (ma > 0) {
    const m = MAP, X = x => m.x + 26 + (x + 150) / 290 * (m.w - 52), Z = z => m.y + 22 + (z - 505) / 260 * (m.h - 44);
    g.save(); g.globalAlpha = ma; rr(m.x, m.y, m.w, m.h, 14); g.fillStyle = 'rgba(14,22,34,.74)'; g.fill(); g.clip();
    g.fillStyle = '#2f8fa3'; g.fillRect(m.x, Z(640), m.w, Z(666) - Z(640));
    g.strokeStyle = '#5b6170'; g.lineWidth = 7;
    for (const x of [-130, 0, 120]) { g.beginPath(); g.moveTo(X(x), Z(505)); g.lineTo(X(x), Z(x === 120 ? 760 : 632)); g.stroke(); }
    for (const z of [520, 630, 746]) { g.beginPath(); g.moveTo(m.x, Z(z)); g.lineTo(m.x + m.w, Z(z)); g.stroke(); }
    g.setLineDash([7, 6]); g.beginPath(); g.moveTo(X(-130), Z(600)); g.lineTo(X(-130), Z(746)); g.stroke(); g.setLineDash([]);
    const up = (s > BR.up0 - .5 && s < BR.dn1 + .3); g.fillStyle = up ? (Math.floor(t * 4) % 2 ? '#ff4d3d' : '#c2382c') : '#c9ced6'; g.fillRect(X(120) - 9, Z(638), 18, Z(668) - Z(638));
    // the routes
    for (const k of ['A', 'B']) { const Pp = PATHS[k]; g.strokeStyle = COL[k]; g.globalAlpha = ma * .55; g.lineWidth = 5; g.beginPath(); Pp.forEach((q, i) => i ? g.lineTo(X(q[0]), Z(q[1])) : g.moveTo(X(q[0]), Z(q[1]))); g.stroke(); g.globalAlpha = ma; }
    // hospital
    g.fillStyle = '#f4f2ee'; g.fillRect(X(-64), Z(566), X(-18) - X(-64), Z(612) - Z(566)); g.fillStyle = '#d8342a'; g.fillRect(X(-41) - 3, Z(589) - 10, 6, 20); g.fillRect(X(-41) - 10, Z(589) - 3, 20, 6);
    for (const k of ['A', 'B']) {
      const p = pose(k, s), r = 12; g.fillStyle = COL[k]; g.globalAlpha = ma * (k === 'A' && inTunnel(s) ? .55 + .45 * (Math.floor(t * 4) % 2) : 1);
      g.beginPath(); g.arc(X(p.x), Z(p.z), r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 16px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, X(p.x), Z(p.z) + 1); g.globalAlpha = ma;
    }
    g.restore();
  }
  if (t < 1.9) { g.save(); g.globalAlpha = 1 - seg(t, 1.6, 1.9); tile([['WHO GETS', '#1d4c9e'], ['THERE FIRST?', '#d8342a']], 470); g.restore(); }
  if (t > 27.9 && t < 31.4) {   // photo finish: the bay line, marked
    const a = Math.min(seg(t, 27.9, 28.4), 1 - seg(t, 31.0, 31.4)), p0 = toScreen(V(BAY.x, .2, BAY.zA - 6)), p1 = toScreen(V(BAY.x, .2, BAY.zB + 6));
    g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = 8; g.setLineDash([26, 14]); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10;
    g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff'; g.font = '900 44px Overpass'; g.textAlign = 'center'; g.fillText('FINISH', p1.x, p1.y + 50); g.restore();
  }
  if (t > 1.7 && t < 3.15) {   // the rewind stamp
    const a = Math.min(seg(t, 1.7, 1.85), 1 - seg(t, 2.95, 3.15));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 600); g.rotate(-.04); g.translate(-W / 2, -600); tile([['◀◀ 40 SECONDS', '#fbfaf6'], ['EARLIER', '#ffc21a']], 600, '#fbfaf6', 'rgba(20,24,32,.88)', 92, 820); g.restore();
  }
  if (t > 29.25 && t < 31.6) {   // the result
    const a = Math.min(seg(t, 29.25, 29.4), 1 - seg(t, 31.4, 31.6));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 560); g.scale(1 + .15 * (1 - eo(seg(t, 29.25, 29.5))), 1 + .15 * (1 - eo(seg(t, 29.25, 29.5)))); g.translate(-W / 2, -560);
    tile([['TUNNEL WINS', COL.A], ['BY A NOSE', '#1d4c9e']], 560); g.restore();
  }
  const sb = SUBS.find(q => t >= q.t0 && t < q.t1);
  if (sb) {
    g.font = '800 54px Overpass'; const tw = g.measureText(sb.text).width, sc = Math.min(1, 900 / (tw + 120)), bw = (tw + 120) * sc, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const al = sb.t0 === 0 ? 1 - seg(t, sb.t1 - .12, sb.t1) : Math.min(seg(t, sb.t0, sb.t0 + .12), 1 - seg(t, sb.t1 - .12, sb.t1));
    g.save(); g.globalAlpha = al; g.translate(0, sb.t0 === 0 ? 0 : (1 - eo(seg(t, sb.t0, sb.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44 * sc, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#ffc21a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `800 ${Math.round(54 * sc)}px Overpass`; g.fillText(sb.text, bx + 76 * sc, SUB_Y + 3);
    g.restore();
  }
}
import { PATH } from './story.js';
const PATHS = { A: PATH.A.pts, B: PATH.B.pts };

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
  amb.A.draw(t, s); amb.B.draw(t, s); bridge.draw(t, s); sail.draw(t, s); camper.draw(t); traffic.draw(t, s); people.draw(t, s);
  dressing.draw(t, s, 1e9); harbour.draw(t); quay.draw(t);
  const c = placeCam(t);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 26;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};
// —— events for the mix and the score ——
const EV = [];
const ev = (t, type, o = {}) => { if (t !== null && t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
ev(0, 'hit'); ev(1.6, 'rewind'); ev(2.6, 'rewindEnd'); ev(3.2, 'go'); ev(34.25, 'rewind2');
for (const [k, s] of [['bell', BR.bell], ['barDown', BR.barDown], ['up0', BR.up0], ['up1', BR.up1], ['dn0', BR.dn0], ['dn1', BR.dn1], ['barUp', BR.barUp], ['bgo', BR.go], ['camper', T_CAMPER], ['enter', T_ENTER], ['exit', T_EXIT], ['stopB', T_STOPB], ['finA', FIN.A], ['finB', FIN.B]]) ev(invSim(s), k);
ev(16, 'real'); ev(27.8, 'slow'); ev(29.6, 'resume');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [3.2, 6.2, 9.2, 13.2, 16, 20, 23, 26.2, 27.8]) ev(s, 'cut');
// siren levels: how close each ambulance is to the camera (A is muffled in the tunnel)
for (let t = 0; t < DUR; t += 1 / 12) { placeCam(t); const s = sim(t); const o = {}; for (const k of ['A', 'B']) { const d = camera.position.distanceTo(amb[k].pos(s)); o[k] = +(Math.min(1, 30 / Math.max(30, d)) * (k === 'A' && inTunnel(s) ? .25 : 1)).toFixed(3); const q = toScreen(amb[k].pos(s)); o['p' + k] = +clamp((q.x / W - .5) * 1.6, -1, 1).toFixed(2); } ev(t, 'siren', o); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + 470, y1: HUD.y + 206, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
