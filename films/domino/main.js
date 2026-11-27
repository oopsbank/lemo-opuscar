// Domino (Miniature Chaos) — Tilt-Shift Miniature, YouTube Short (1080×1920, 24 fps, smooth motion); the last frame matches the first
import * as THREE from 'three';
import { makePost } from './post.js';
import { clamp, lerp, seg, ss, eio, eo, ei } from '/core/lib.js';
import { buildWorld, U } from './world.js';
import { DUR, T, J, SCAF, BUCKET, BUCKET2, HYD, CRANE, STACK, POSTS, BAKERY, COP, LANE } from './story.js';
import { makeDressing } from './dressing.js';
import { makeHarbour } from './harbour.js';
import { EXCL, extraGeometry, makePigeon, makeBuckets, makeRedCar, makeHydrant, makeScooter, makeCrane, makePipes, makeTraffic, makeBalls, makePosts, makeBakery, makePolice, makeConvertible, makePlaza } from './actors.js';

const W = innerWidth || 1080, H = innerHeight || 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('900 300px Overpass'); await document.fonts.load('600 34px "Overpass Mono"'); await document.fonts.load('700 76px "Overpass Mono"');

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
const pigeon = makePigeon(scene), buckets = makeBuckets(scene), car = makeRedCar(scene), hydrant = makeHydrant(scene), crane = makeCrane(scene);
const scooter = makeScooter(scene, crane.cabWorld), pipes = makePipes(scene), traffic = makeTraffic(scene), balls = makeBalls(scene), posts = makePosts(scene);
const bakery = makeBakery(scene), police = makePolice(scene), conv = makeConvertible(scene), plaza = makePlaza(scene);
scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; });
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// —— camera: the user's board — CU on the scaffold pulling back to the 60° wide; following wides; the building site; the
//    wide for the climax with small shakes; a 4 s still hold; a zoom back to the scaffold and the pigeon; cut to black ——
const proj = new THREE.Vector3();
const toScreenY = p => { proj.copy(p).project(camera); return proj.y * .5 + .5; };
function orbit(target, azDeg, pitchDeg, dist) { const az = azDeg * Math.PI / 180, pt = pitchDeg * Math.PI / 180; return target.clone().add(V(-Math.sin(az) * Math.cos(pt) * dist, Math.sin(pt) * dist, -Math.cos(az) * Math.cos(pt) * dist)); }
const P = (look, az, pitch, dist, fov) => ({ look, az, pitch, dist, fov });
const mixP = (a, b, k) => P(a.look.clone().lerp(b.look, k), lerp(a.az, b.az, k), lerp(a.pitch, b.pitch, k), Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), lerp(a.fov, b.fov, k));
const CU = P(V(BUCKET.x + 1, SCAF.plank + .7, BUCKET.z), 195, 30, 10, 34);
const W1 = P(V(104, 0, 254), 180, 58, 120, 36);
const RID = t => P(scooterPos(t).setY(0).lerp(V(128, 6, 245), .4), 185, 50, 140, 36);
const SITE = P(V(140, 10, 240), 205, 42, 105, 36);
const ROLL = P(V(122, 0, 252), 188, 55, 110, 36);
const QUEUE = P(V(88, 0, 257), 180, 56, 110, 36);
const RAIN = P(V(132, 0, 259), 182, 56, 120, 36);
const CAKE = P(V(160, 1, 268), 190, 44, 88, 36);
const ALL = P(V(124, 0, 250), 180, 57, 200, 36);
const KEYS = [[0, CU], [3.4, CU], [7.8, W1], [8.6, W1], [10.5, null], [13.6, null], [15.2, SITE], [19.6, SITE], [21.5, ROLL], [28.6, ROLL], [30.2, QUEUE], [33.9, QUEUE], [35.2, RAIN], [38.6, RAIN], [39.8, CAKE], [42.4, CAKE], [44.8, ALL], [T.hold1, ALL]];
const keyP = (k, t) => k[1] || RID(t);
const shake = (t, t0, a = 1) => { const u = t - t0; return u > 0 && u < .6 ? Math.exp(-u * 7) * a : 0; };
function shotCam(t) {
  let p, band = { w: .2, amp: 15, mix: .5 }, aper = 3000, span = 220;
  if (t < T.hold1) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = eio(seg(t, a[0], b[0]));
    p = mixP(keyP(a, t), keyP(b, t), k);
    if (t < 7.8) { const c = eio(seg(t, 3.4, 7.8)); band = { w: lerp(.3, .2, c), amp: lerp(9, 15, c), mix: .45 }; aper = lerp(1300, 3000, c); span = lerp(40, 200, c); }
    if (t > 42.4) span = 280;
  } else {
    const k = eio(seg(t, T.hold1, T.zoom1)); const cu = P(V(BUCKET.x + 2.2, SCAF.plank + .9, BUCKET.z), 192, 30, 9, 34); p = mixP(ALL, cu, k);
    if (t > T.fly) { const f = seg(t, T.fly + .1, T.fall2 + 1.6); p = mixP(cu, P(V(BUCKET2.x - 1, 2, LANE.wb), 190, 40, 17, 34), eio(f)); }
    band = { w: lerp(.2, .3, k), amp: lerp(15, 9, k), mix: .45 }; aper = lerp(3000, 1300, k); span = lerp(280, 40, k);
  }
  let pos = orbit(p.look, p.az, p.pitch, p.dist);
  // impacts shake the camera a little (scaled by its distance)
  let sk = 0; for (const [t0, a] of [[T.splat, .5], [T.hydrant, .8], [T.cab, .5], [T.sweep, .6], [30.3, .5], [30.75, .7], [31.2, .5], [31.6, .5], [32.0, .7], [T.smash, 1.4], [T.sign, .6], [T.cakeHit, 1]]) sk += shake(t, t0, a);
  if (sk > 0) pos.add(V(Math.sin(t * 61) * sk * p.dist * .004, Math.cos(t * 53) * sk * p.dist * .003, 0));
  return { pos, look: p.look, fov: p.fov, up: V(0, 1, 0), subj: p.look, band, aper, sunAz: 205, sunEl: 40, span };
}
const scooterPos = t => { const c = crane.cabWorld(t); const u = clamp((t - T.launch) / (T.cab - T.launch)); return t < T.launch ? V(HYD.x - 11.5 * (T.launch - t), 1, LANE.eb) : V(lerp(HYD.x, c.x, u), lerp(1.2, c.y, u) + 26 * 4 * u * (1 - u), lerp(LANE.eb, c.z, u)); };

// —— overlay: none (no words). Only the cut to black at the end ——
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
function drawOverlay(t) { g.clearRect(0, 0, W, H); if (t >= T.black) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } }

function placeCam(t) {
  const c = shotCam(t);
  if (QS.has('cam')) { const v = QS.get('cam').split(',').map(Number); c.pos = V(v[0], v[1], v[2]); c.look = V(v[3], v[4], v[5]); c.fov = v[6]; c.subj = c.look.clone(); c.span = 400; c.aper = 30000; }
  camera.position.copy(c.pos); camera.up.copy(c.up); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return c;
}
window.DUR = DUR; window.SCENE = scene;
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  U.time.value = t * 1.2;
  pigeon.draw(t); car.draw(t); buckets.draw(t, car.pose, conv.pose); crane.draw(t); scooter.draw(t); pipes.draw(t); traffic.draw(t); balls.draw(t); posts.draw(t); police.draw(t); conv.draw(t); plaza.draw(t);
  dressing.draw(t, t, 1e9); harbour.draw(t);
  const c = placeCam(t);
  hydrant.draw(t, camera); bakery.draw(t, camera);
  const dof = post.dof; dof.focus = camera.position.distanceTo(c.subj); dof.aper = c.aper * .45; dof.maxCoc = 16;
  Object.assign(dof.band, { y: clamp(toScreenY(c.subj), .12, .88), w: c.band.w, amp: c.band.amp, mix: c.band.mix });
  if (QS.has('nodof')) dof.maxCoc = 0;
  setSun(c.look, c.sunAz, c.sunEl, c.span);
  post.composer.render();
  drawOverlay(t);
};
// —— events for the mix and the score ——
const EV = [];
const ev = (t, type, o = {}) => { if (t >= 0 && t <= DUR) EV.push({ t: +t.toFixed(4), type, ...o }); };
for (const [k, v] of Object.entries(T)) if (typeof v === 'number' && k !== 'postDt') ev(v, k);
POSTS.forEach((p, i) => ev(T.post0 + i * T.postDt + .55, 'postHit', { i }));
for (const [i, th] of [[0, 30.3], [1, 30.75], [2, 31.2], [3, 31.6], [4, 32.0]]) ev(th, 'bump', { i });
for (let t = 0; t < DUR; t += 1 / 12) { const c = placeCam(t); ev(t, 'cam', { d: +camera.position.distanceTo(c.look).toFixed(1) }); }
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
window.TEXTS = () => [];
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
