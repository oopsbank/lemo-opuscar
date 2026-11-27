// Two Tugs, One Giant Ship — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, ei } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, T, VO, shotAt, speedAt, dBow, dStern, pullRed, pullBlue, workShare, SHIP, QZ } from './story.js';
import { makeDressing } from './dressing.js';
import { makeHarbour } from './harbour.js';
import { EXCL, makeShip, makeTugs, makeSailboat, makeFoam, makeQuayCrowd, makeCat, shipPoint, shipPose } from './actors.js';

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
const dressing = makeDressing(scene), harbour = makeHarbour(scene);
const ship = makeShip(scene), tugs = makeTugs(scene), sail = makeSailboat(scene), foam = makeFoam(scene), crowd = makeQuayCrowd(scene);
const cat = makeCat(scene); ship.g.add(cat); cat.position.set(56, -.9 + 33.1, 3); cat.rotation.y = 1.2;   // asleep on the bridge roof
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const gap = t => Math.min(dBow(t), dStern(t));

// —— shots ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(new THREE.Vector3(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
const OPEN = P(V(60, 4, 828), 352, 27, 175, 34);
const sharp = t => { const k = ss(seg(t, 1.6, 2.4)); return { w: lerp(.34, .07, k), amp: lerp(10, 36, k), mix: lerp(.25, .68, k) }; };
const OPEN2 = P(V(95, 0, 880), 190, 46, 330, 36);
const RACE = P(V(40, 0, 900), 335, 50, 360, 36);
const PULL = P(V(140, 0, 875), 20, 40, 150, 34);
const SNAP = P(V(-16, 0, 884), 20, 42, 130, 34);
const SAIL = P(V(150, 0, 885), 30, 44, 165, 34);
const BOTH = P(V(40, 0, 870), 0, 58, 320, 36);
const REAL = P(V(66, 0, 797), 282, 30, 115, 33);
function shotCam(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1);
  let p, subj, band = { w: .1, amp: 26, mix: .62 }, aper = 5600, sunEl = 22, span = 220;
  if (sh.id === 'open') { const tp = tugs.pose.red.pos, CL = P(tp.clone().setY(2), 192, 20, 46, 32); const k = eio(seg(t, 1.15, 1.9)); p = mixP(CL, OPEN2, k); subj = tp.clone().setY(2).lerp(shipPoint(t, 40, 4, SHIP.half), k); span = lerp(60, 200, k); band = sharp(t); aper = lerp(700, 5600, ss(seg(t, 1.6, 2.4))); }
  else if (sh.id === 'race') { p = mixP(OPEN2, RACE, eio(seg(t, 2.5, 4.5))); subj = shipPoint(t, 0, 2, SHIP.half + 30); span = 320; band = { w: .1, amp: 30, mix: .6 }; }
  else if (sh.id === 'pull') { p = mixP(RACE, PULL, eio(seg(t, 8, 9.4))); subj = tugs.pose.red ? tugs.pose.red.pos.clone().setY(1) : V(140, 1, 900); span = 180; }
  else if (sh.id === 'snap') { p = P(SNAP.look, SNAP.az, SNAP.pitch, SNAP.dist - 10 * eio(u), SNAP.fov); subj = shipPoint(t, -78, 4, SHIP.half + 4); span = 160; band = { w: .065, amp: 28, mix: .64 }; }
  else if (sh.id === 'sail') { p = P(SAIL.look, SAIL.az, SAIL.pitch, SAIL.dist, SAIL.fov); subj = sail.pos().clone().setY(2); span = 200; }
  else if (sh.id === 'both') { p = mixP(SAIL, BOTH, eio(seg(t, 19, 20.6))); subj = shipPoint(t, 0, 2, SHIP.half + 20); span = 320; band = { w: .1, amp: 30, mix: .6 }; }
  else if (sh.id === 'real') { p = mixP(BOTH, REAL, eio(seg(t, 21.5, 23))); p.dist *= 1 - .05 * eio(seg(t, 23, 26)); subj = V(66, 1, QZ + 2); span = 160; band = { w: .065, amp: 28, mix: .64 }; aper = 6200; }
  else { p = mixP(REAL, OPEN, eio(seg(t, 27, DUR - .55))); { const d = ei(seg(t, DUR - .55, DUR)); if (d > 0) { const tp = tugs.pose.red.pos; p = mixP(p, P(tp.clone().setY(2), 192, 20, 46, 32), d); } } subj = V(66, 1, QZ + 2).lerp(shipPoint(t, 20, 6, -SHIP.half), eio(seg(t, 27, DUR))); }
  return { pos: orbit(p.look, p.az, p.pitch, p.dist), look: p.look, fov: p.fov, up: V(0, 1, 0), band, aper, sunAz: p.az + 25, sunEl, span, subj };
}

// —— overlay: distance plate, pull meters, the hook, subtitles ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let durs = {};
try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) { durs = {}; }
const SUBS = VO.map(v => ({ ...v, t0: Math.max(0, v.t - .08), t1: 0 })).sort((a, b) => a.t - b.t);
for (let i = 0; i < SUBS.length; i++) { const s = SUBS[i], d = durs[s.id] || 1.2, next = SUBS[i + 1]; s.t1 = Math.max(s.t0 + 1.9, s.t + d + .65); if (next) s.t1 = Math.min(s.t1, next.t0 - .05); if (i === SUBS.length - 1) s.t1 = DUR; }
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const SUB_Y = 1395, HUD = { x: 56, y: 140 };
const speedLabel = t => speedAt(t).x === 'real' ? '×1 REAL TIME' : `×${speedAt(t).k} TIME-LAPSE`;
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (QS.has('nohud')) return;
  g.save(); g.globalAlpha = seg(t, 1.0, 1.3);
  const d = gap(t), stopped = t >= T.stop, low = d < 10 && !stopped;
  g.save(); rr(HUD.x, HUD.y, 430, 196, 18); g.fillStyle = 'rgba(14,22,34,.8)'; g.fill(); g.restore();
  g.save(); g.translate(HUD.x + 52, HUD.y + 60); g.fillStyle = '#fbfaf6'; g.beginPath(); g.moveTo(-28, -6); g.lineTo(22, -6); g.lineTo(30, 4); g.lineTo(-24, 10); g.closePath(); g.fill(); g.fillStyle = '#c8322a'; g.fillRect(-14, -16, 8, 10); g.restore();
  g.font = '700 76px "Overpass Mono"'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = stopped ? '#5fe08d' : low ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#ffbd45') : '#ffffff'; g.fillText(`${Math.max(2, Math.round(d))} m`, HUD.x + 100, HUD.y + 60);
  g.font = '600 34px "Overpass Mono"'; g.fillStyle = speedAt(t).x === 'real' ? '#5fe08d' : '#ffbd45'; g.fillText(speedLabel(t), HUD.x + 30, HUD.y + 128);
  g.fillStyle = stopped ? '#5fe08d' : '#9fd4ff'; g.fillText(stopped ? 'STOPPED. QUAY SAFE' : 'TO THE QUAY', HUD.x + 30, HUD.y + 170);
  // pull meters (red, blue) and, at the end, the share of the work
  const a = seg(t, 1.8, 2.3);
  if (a > 0) {
    g.save(); g.globalAlpha = a; rr(HUD.x, HUD.y + 214, 430, 150, 18); g.fillStyle = 'rgba(14,22,34,.78)'; g.fill();
    const share = workShare(t);
    for (const [k, col, name, v, sh] of [[0, '#e8463a', 'RED', pullRed(t), share], [1, '#3d7bff', 'BLUE', pullBlue(t), 1 - share]]) {
      const y = HUD.y + 254 + k * 62;
      g.fillStyle = col; g.font = '700 34px "Overpass Mono"'; g.fillText(name, HUD.x + 24, y);
      g.fillStyle = 'rgba(255,255,255,.15)'; rr(HUD.x + 130, y - 16, 180, 32, 8); g.fill();
      const snapped = k === 1 && t > T.snap && t < T.reconnect;
      g.fillStyle = snapped ? (Math.floor(t * 4) % 2 ? '#ff6b5a' : '#555') : col; rr(HUD.x + 130, y - 16, Math.max(8, 180 * v / 100), 32, 8); g.fill();
      g.fillStyle = '#fff'; g.font = '600 28px "Overpass Mono"'; g.fillText(snapped ? 'SNAP' : t > T.stop ? `${Math.round(sh * 100)}%` : `${Math.round(v)}`, HUD.x + 326, y);
    }
    g.restore();
  }
  g.restore();
  if (t < 2.2) {   // the hook
    const al = 1 - seg(t, 1.9, 2.2), y0 = 520;
    g.save(); g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(W / 2 - 420, y0 - 150, 840, 300, 26); g.fillStyle = '#f7f4ec'; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 10; g.strokeStyle = '#1d4c9e'; rr(W / 2 - 406, y0 - 136, 812, 272, 18); g.stroke();
    g.font = '900 104px Overpass'; g.fillStyle = '#1d4c9e'; g.fillText('THIS SHIP', W / 2, y0 - 50); g.fillStyle = '#d8342a'; g.fillText("WON'T STOP", W / 2, y0 + 60);
    g.restore();
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

window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = t * 1.5;
  ship.draw(t); tugs.draw(t); sail.draw(t); dressing.draw(t, 0, 1e9); harbour.draw(t); crowd.draw(t, gap(t));
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.subj = c.look.clone(); c.span = 400; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  foam.draw(t, tugs);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper; dof.maxCoc = 26;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(T.red - .3, 'tug', { w: 'red' }); ev(T.blue - .3, 'tug', { w: 'blue' }); ev(T.snap, 'snap'); ev(T.reconnect, 'reconnect'); ev(T.sail0, 'sail'); ev(T.stop, 'stop');
ev(11.5, 'real'); ev(13, 'resume'); ev(21.5, 'real'); ev(26.5, 'resume');
for (const v of VO) ev(v.t, 'vo', { id: v.id });
for (const s of [2.5, 8, 11.5, 14, 19, 21.5, 27]) ev(s, 'cut');
for (let t = 0; t < DUR; t += .25) ev(t, 'pull', { r: +pullRed(t).toFixed(1), b: +pullBlue(t).toFixed(1), gap: +gap(t).toFixed(1) });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = (t) => [{ id: 'hud', text: speedLabel(t), x0: HUD.x, y0: HUD.y, x1: HUD.x + 430, y1: HUD.y + 196, pass: true }];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
