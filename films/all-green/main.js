// All Green — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, ei } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { JUNCS, JUNC, LANE, LEN, world } from './grid.js';
import { DUR, T_ROLL, sim, rate, remaining, VO, shotAt, SIM, FIXED, flipAt, TOW, invSim } from './story.js';
import { makeDressing } from './dressing.js';
import { EXCL, makeTraffic, makeLights, lightState, makeEngine, makeTow, makeWalkers, makeCat, carPose } from './actors.js';

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
const sun = new THREE.DirectionalLight('#ffc58c', 4.2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .35; sun.shadow.radius = 2;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#9db9e6', '#b0805a', .72));
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

buildWorld(scene, { excl: EXCL });
const traffic = makeTraffic(scene), lights = makeLights(scene), engine = makeEngine(scene), tow = makeTow(scene), walkers = makeWalkers(scene);
const dressing = makeDressing(scene);
makeCat(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const engineRolling = s => s >= T_ROLL;
const engS = s => engineRolling(s) ? s : null;

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
const OPEN = P(V(116, 0, 255), 205, 46, 125, 34);
const CLOSE = P(V(117.5, 1.2, 254), 196, 32, 24, 32);
// the first 2 s stay sharp (only the outer edges blur), then the full tilt-shift band returns
const sharp = t => { const k = ss(seg(t, 1.6, 2.4)); return { w: lerp(.34, .07, k), amp: lerp(10, 34, k), mix: lerp(.25, .68, k) }; };
const CRASH = P(V(116, 0, 255), 205, 44, 110, 34);
const SPREAD = P(V(60, 0, 185), 180, 64, 380, 38);
const ENG = P(V(0, 0, 52), 180, 42, 165, 34);
const REAL = P(V(0, 0, 62), 180, 34, 190, 33);
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1), s = sim(t);
  let p, subj, band = { w: .07, amp: 34, mix: .68 }, aper = 5600, sunAz = 35, sunEl = 24, span = 220;
  if (sh.id === 'open') { const k = eio(seg(t, 1.15, 1.85)); p = mixP(P(CLOSE.look, CLOSE.az, CLOSE.pitch, CLOSE.dist - 2.5 * seg(t, 0, 1.15), CLOSE.fov), OPEN, k); subj = V(117, 1.2, 256).lerp(V(116, 1, 260), k); span = lerp(60, 200, k); sunAz = p.az + 40; band = sharp(t); aper = lerp(700, 5600, ss(seg(t, 1.6, 2.4))); }
  else if (sh.id === 'crash') { p = mixP(P(OPEN.look, OPEN.az, OPEN.pitch, OPEN.dist - 25, OPEN.fov), CRASH, eio(seg(t, 2.5, 3.9))); p.dist *= 1 - .06 * eio(seg(t, 3.9, 5.5)); subj = V(116, 1, 260).lerp(V(116, 1, 225), seg(t, 4, 5.5) * .6); span = 160; sunAz = CRASH.az + 40; }
  else if (sh.id === 'spread') { p = mixP(CRASH, SPREAD, eio(seg(t, 5.5, 7.5))); subj = V(116, 1, 260).lerp(V(0, 1, 120), seg(t, 6.5, 9)); span = 320; band = { w: .12, amp: 24, mix: .5 }; sunAz = 30; }
  else if (sh.id === 'engine') { p = P(ENG.look, ENG.az, ENG.pitch, ENG.dist - 10 * eio(u), ENG.fov); subj = V(0, 1.5, 30); band = { w: .07, amp: 38, mix: .7 }; aper = 6500; span = 140; sunAz = ENG.az + 40; }
  else if (sh.id === 'tow') { const tp = tow.pose(s) || { x: 330, z: 252 }; const look = V(tp.x - 8, 0, tp.z + 4); p = P(look, 205, 40, lerp(115, 95, eio(u)), 34); subj = V(tp.x, 1.3, tp.z); span = 140; sunAz = 205 + 40; band = { w: .07, amp: 36, mix: .68 }; }
  else if (sh.id === 'release') { const look = V(55, 0, lerp(225, 165, eio(u))); const rot = lerp(Math.PI * .45, .02, eio(u)); p = { look, top: true, rot, h: 310, fov: 40 }; subj = look.clone(); span = 300; band = { w: .12, amp: 24, mix: .85 }; sunAz = 160; }
  else if (sh.id === 'real') { p = P(REAL.look, REAL.az, REAL.pitch, REAL.dist - 12 * eio(u), REAL.fov); subj = V(0, 1, 120); band = { w: .065, amp: 38, mix: .7 }; aper = 6200; span = 160; sunAz = 40; }
  else if (sh.id === 'roll') { const e = engine.pos(s); const look = V(0, 0, Math.max(62, e.z + 12)); p = P(look, 180, lerp(34, 40, eio(u)), lerp(190, 140, eio(u)), 33); subj = e; band = { w: .065, amp: 38, mix: .7 }; aper = 6200; span = 170; sunAz = 40; }
  else { const k = eio(seg(t, 29, DUR - .55)); const e = engine.pos(sim(29)); const from = P(V(0, 0, Math.max(62, e.z + 12)), 180, 40, 140, 33); p = mixP(from, OPEN, k); const d = ei(seg(t, DUR - .55, DUR)); if (d > 0) p = mixP(p, CLOSE, d); subj = e.clone().lerp(V(116, 1, 260), k); span = lerp(170, 300, k); sunAz = lerp(40, OPEN.az + 40, k); band = { w: lerp(.065, .1, k), amp: lerp(32, 26, k), mix: lerp(.64, .55, k) }; }
  let pos, up = V(0, 1, 0);
  if (p.top) { pos = p.look.clone().add(V(0, p.h, 0)); up = V(Math.sin(p.rot), 0, -Math.cos(p.rot)); }
  else pos = orbit(p.look, p.az, p.pitch, p.dist);
  return { pos, look: p.look, fov: p.fov, up, band, aper, sunAz, sunEl, span, subj };
}

// —— overlay: the clock plate, the grid map, subtitles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) {
  const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1];
  s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR;
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 }, MAP = { x: 56, y: 356, w: 300, h: 330 };
function speedLabel(t) { const k = rate(t); return k < 1.3 ? '×1 REAL TIME' : `×${Math.round(k)} TIME-LAPSE`; }
const fmt = r => { const s = Math.ceil(r - 1e-6); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// a junction is "locked" when a stopped car sits in its box
function locked(J, s) {
  for (const q of J.lanes) for (const c of SIM.cars) { if (c.kind === 'engine') continue; const st = SIM.state(c, s); if (!st || st.L !== q.L) continue; if (st.s > q.sIn && st.s - LEN < q.sOut && st.v < .4) return true; }
  return false;
}
const LOCKCACHE = new Map();
const lockedAt = (J, s) => { const k = J.id + '|' + Math.round(s * 4); if (!LOCKCACHE.has(k)) LOCKCACHE.set(k, locked(J, Math.round(s * 4) / 4)); return LOCKCACHE.get(k); };
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  g.save(); g.globalAlpha = seg(t, 1.0, 1.3);
  const s = sim(t), rem = remaining(t), rolled = s >= T_ROLL, low = rem < 20 && !rolled;
  const nFixed = JUNCS.filter(J => s >= FIXED[J.id]).length;
  g.save(); rr(HUD.x, HUD.y, 430, 196, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  // fire engine glyph
  g.save(); g.translate(HUD.x + 52, HUD.y + 60); g.fillStyle = '#d8342a'; rr(-27, -14, 54, 28, 5); g.fill(); g.fillStyle = '#fff'; g.fillRect(-27, -2, 54, 4); g.fillStyle = '#c9ccd0'; g.fillRect(-20, -20, 34, 5); g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = rolled ? '#5fe08d' : low ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff'; g.fillText(fmt(rem), HUD.x + 100, HUD.y + 60);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = rate(t) < 1.3 ? '#5fe08d' : '#ffbd45'; g.fillText(speedLabel(t), HUD.x + 30, HUD.y + 128);
  let line, col;
  if (rolled) { line = 'ENGINE 9 IS OUT'; col = '#5fe08d'; } else if (nFixed === 0) { line = t < 2.4 ? 'ENGINE 9 ROLLS IN' : 'ALL LIGHTS: GREEN'; col = t < 2.4 ? '#9fd4ff' : '#ffbd45'; } else { line = `LIGHTS BACK ${nFixed}/6`; col = '#9fd4ff'; }
  g.fillStyle = col; g.fillText(line, HUD.x + 30, HUD.y + 170);
  // the grid map: streets, junctions (green lights / all-green / locked), the crash, Engine 9, its route
  const m = MAP, X = x => m.x + 30 + (x + 190) / 380 * (m.w - 60), Z = z => m.y + 30 + (z + 30) / 330 * (m.h - 60);
  g.save(); g.globalAlpha = seg(t, 1.8, 2.2); rr(m.x, m.y, m.w, m.h, 14); g.fillStyle = 'rgba(14,22,34,.72)'; g.fill(); g.clip();
  g.strokeStyle = '#5b6170'; g.lineWidth = 9; g.lineCap = 'butt';
  for (const x of [-130, 0, 120]) { g.beginPath(); g.moveTo(X(x), x === 0 ? Z(-8) : m.y); g.lineTo(X(x), m.y + m.h); g.stroke(); }
  for (const z of [120, 260]) { g.beginPath(); g.moveTo(m.x, Z(z)); g.lineTo(m.x + m.w, Z(z)); g.stroke(); }
  // Engine 9's route
  g.strokeStyle = rolled ? 'rgba(95,224,141,.9)' : 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(0), Z(-8)); g.lineTo(X(0), m.y + m.h); g.stroke(); g.setLineDash([]);
  for (const J of JUNCS) {
    const fixed = s >= FIXED[J.id], lk = s >= .3 && lockedAt(J, s);
    g.fillStyle = lk ? (Math.floor(t * 4) % 2 ? '#ff4d3d' : '#c2382c') : fixed ? '#5fe08d' : s >= flipAt(J) ? '#9be36b' : '#c9ced6';
    rr(X(J.x) - 12, Z(J.z) - 12, 24, 24, 5); g.fill();
  }
  if (s > 3 && s < TOW.go) { g.strokeStyle = '#fff'; g.lineWidth = 4; const cx = X(120), cz = Z(260); g.beginPath(); g.moveTo(cx - 8, cz - 8); g.lineTo(cx + 8, cz + 8); g.moveTo(cx + 8, cz - 8); g.lineTo(cx - 8, cz + 8); g.stroke(); }
  const e = engine.pos(s); g.fillStyle = '#d8342a'; g.beginPath(); g.arc(X(0), Z(Math.min(e.z, 300)), 10, 0, Math.PI * 2); g.fill(); g.fillStyle = Math.floor(t * 6) % 2 ? '#fff' : '#3d7bff'; g.beginPath(); g.arc(X(0), Z(Math.min(e.z, 300)), 4, 0, Math.PI * 2); g.fill();
  const tp = tow.pose(s); if (tp && tp.x < 200) { g.fillStyle = '#f2a51a'; g.beginPath(); g.arc(X(tp.x), Z(tp.z), 8, 0, Math.PI * 2); g.fill(); }
  g.restore();
  g.restore();
  if (t < 2.2) {   // the hook: the problem in big letters from frame 0
    const a = 1 - seg(t, 1.9, 2.2), y0 = 520;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(W / 2 - 400, y0 - 150, 800, 300, 26); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 10; g.strokeStyle = '#1d4c9e'; rr(W / 2 - 386, y0 - 136, 772, 272, 18); g.stroke();
    g.font = '900 110px Overpass'; g.fillStyle = '#1d4c9e'; g.fillText('EVERY LIGHT', W / 2, y0 - 48);
    g.fillStyle = '#2aa84a'; g.fillText('IS GREEN', W / 2 + 40, y0 + 62);
    g.beginPath(); g.arc(W / 2 - 270, y0 + 62, 34, 0, Math.PI * 2); g.fillStyle = '#2aa84a'; g.fill();
    g.restore();
  }
  const sb = SUBS.find(q => t >= q.t0 && t < q.t1);
  if (sb) {
    g.font = '800 54px Overpass'; const tw = g.measureText(sb.text).width, sc = Math.min(1, 900 / (tw + 120)), bw = (tw + 120) * sc, bh = 96, bx = (W - bw) / 2 - 10, by = SUB_Y - bh / 2;
    const a = sb.t0 === 0 ? 1 - seg(t, sb.t1 - .12, sb.t1) : Math.min(seg(t, sb.t0, sb.t0 + .12), 1 - seg(t, sb.t1 - .12, sb.t1));
    g.save(); g.globalAlpha = a; g.translate(0, sb.t0 === 0 ? 0 : (1 - eo(seg(t, sb.t0, sb.t0 + .18))) * 14);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; rr(bx, by, bw, bh, 12); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 6; g.strokeStyle = '#1d4c9e'; rr(bx + 9, by + 9, bw - 18, bh - 18, 7); g.stroke();
    g.beginPath(); g.arc(bx + 44 * sc, SUB_Y, 11, 0, Math.PI * 2); g.fillStyle = '#ffc21a'; g.fill();
    g.fillStyle = '#1d4c9e'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `800 ${Math.round(54 * sc)}px Overpass`; g.fillText(sb.text, bx + 76 * sc, SUB_Y + 3);
    g.restore();
  }
}

window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  const s = sim(t);
  U.time.value = s / 6;
  const tp = tow.draw(t, s);
  traffic.draw(t, s, tp); lights.draw(t, s, engS(s)); engine.draw(t, s); walkers.draw(s); dressing.draw(t, s);
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.up = V(0, 1, 0); c.subj = c.look.clone(); c.span = 400; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 34;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};

// —— events for the mix and the score ——
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(invSim(.3), 'flip'); ev(invSim(4.2), 'crash');
for (const J of JUNCS) ev(invSim(FIXED[J.id]), 'fixed', { j: J.id });
for (const K of SIM.locks) if (K.kind !== 'crashA' && K.kind !== 'crashB') ev(invSim(K.t0 + 2), 'lock', { j: K.J });
ev(invSim(TOW.t0), 'tow'); ev(invSim(TOW.hook), 'hook'); ev(invSim(TOW.go), 'towgo');
ev(invSim(T_ROLL), 'roll'); ev(21.5, 'real'); ev(26, 'resume');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [2.5, 5.5, 9, 11.5, 16.5, 21.5, 26, 29]) ev(s, 'cut');
// how jammed the grid is (stopped cars in view), sampled for horns
for (let t = 0; t < DUR; t += .25) { const s = sim(t); let n = 0; for (const c of SIM.cars) { const st = SIM.state(c, s); if (st && st.v < .3) n++; } ev(t, 'jam', { n }); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + 430, y1: HUD.y + 196, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
