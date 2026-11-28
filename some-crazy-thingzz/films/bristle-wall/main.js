// "The Bristle Wall" — Some Crazy Thingzz. Stylized 3D cartoon, 1080×1920, 24 fps, 72 s, no dialogue, on-screen text in English.
// Why do escalators have brushes along their sides? Sole City, a city of living shoes, thinks they are a free shoe shine.
// Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.   Debug: ?fast · ?ssaa=1.5 · ?cam=x,y,z,lx,ly,lz,fov
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, mulberry } from '/core/lib.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 80px Baloo2');
const STORY = await (await fetch('story.json')).json();

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), og = ov.getContext('2d');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8c79a');
scene.fog = new THREE.Fog('#e9c9a0', 30, 120);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
const camera = new THREE.PerspectiveCamera(40, W / H, .01, 400);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 1.5);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .38; post.bloom.threshold = .9; post.bloom.radius = .45;
const VG = post.vig.uniforms; VG.amt.value = .32; VG.warm.value = .12; VG.contrast.value = .12; VG.sat.value = 1.12;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = mulberry(11);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: 0, ...o });
const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: .4, metalness: 0, ...o });
function mesh(geo, mat, p, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, mat); if (p) m.position.copy(p); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c, draw }; return t; }
const softTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
softTex.colorSpace = THREE.NoColorSpace;
const sprite = (col, op, sc, add = true) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: col, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); s.scale.setScalar(sc); return s; };

// ———————————————————————————— the escalator path ————————————————————————————
// s = distance along the step chain. Flat bottom landing (s < 0), 30° incline (0..L), flat top landing (s > L). Treads are always horizontal.
const L = 20, SIN = .5, COS = Math.sqrt(3) / 2, HALF = 1.8, SKIRT = 1.86, COMB_BOT = -4.6, COMB_TOP = L + 2.2;
const P = s => s < 0 ? V(0, 0, s) : s <= L ? V(0, s * SIN, s * COS) : V(0, L * SIN, L * COS + (s - L));
const PY = s => P(s).y;
const PX = (s, x, y = 0) => P(s).add(V(x, y, 0));
let offRider = 0;   // set every frame: the escalator offset, so riders stand on the tread under them (treads are discrete steps)
const PR = (s, x, y = 0) => { const cyc = COMB_TOP - COMB_BOT; let si = COMB_BOT + offRider + Math.round((s - COMB_BOT - offRider) / (cyc / 27)) * (cyc / 27); const p = P(s); p.y = P(si).y - (ss(seg(si, COMB_TOP - .7, COMB_TOP + .1)) + ss(seg(-si, -COMB_BOT - .7, -COMB_BOT + .1))) * .5 * (s > COMB_BOT && s < COMB_TOP ? 1 : 0) + y; p.x = x; return p; };

// ———————————————————————————— the timeline ————————————————————————————
const T = { suck: 2.3, frz0: 3.25, frz1: 4.0, aglet: 4.55, catch: 5.15, rub2: 6.0, pat: 6.45,
  board: 20.5, slip: 23.0, hop: 25.0, lean: 25.8, giggle: 26.6, squeeze: 27.6, bite: 30.9, bite2: 31.6, fight: 33.0, momUp: 35.0, boots: 35.6,
  teeth: 37.0, turn: 39.0, mono: 39.6, crack: 42.0, jump: 42.25, button: 44.0, stop: 44.1, run: 46.0, pull: 46.9, sploink: 48.0, land: 48.9,
  truth1: 50.6, truth2: 53.2, blup: 56.4, soft: 57.0, tear: 60.5, spray: 63.3, morning: 65.0, flip: 66.9, stare: 68.9, cam: 69.7, loop: 71.0 };
const VEL = .85;
// escalator offset: frozen during the freeze frame, halts at the red button, runs again next morning
function offAt(t) {
  if (t >= T.morning) return offAt(T.stop + 3) + VEL * (t - T.morning);
  const te = t - clamp(t - T.frz0, 0, T.frz1 - T.frz0);
  if (t < T.stop) return VEL * te;
  const k = t - T.stop; return VEL * (T.stop - (T.frz1 - T.frz0)) + VEL * .06 * (1 - Math.exp(-k * 25));
}
const sqv = t => t >= T.morning ? 2.0 + VEL * (t - T.morning) : -4.2 + offAt(t) - offAt(T.board);     // the step Squish and Mom board onto
const hopK = t => eo(seg(t, T.hop, T.hop + .7));
const sSquish = t => t < T.board ? null : sqv(t) + 2.4 * hopK(t);
const sDuke = t => t < 15 ? -3.8 + offAt(t) : sqv(t) + 4.6;

// ———————————————————————————— materials ————————————————————————————
const steel = std('#c9ccd3', { metalness: .85, roughness: .28, envMapIntensity: 1.1 });
const darkSteel = std('#5d626c', { metalness: .8, roughness: .35 });
const nylon = std('#131316', { roughness: .45, metalness: .1, envMapIntensity: .8 });

// ———————————————————————————— steps ————————————————————————————
const treadTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#8b9099'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 8) { g.fillStyle = '#6c717a'; g.fillRect(x, 0, 3, h); g.fillStyle = '#b8bcc4'; g.fillRect(x + 4, 0, 2, h); }
  g.fillStyle = '#f2c61c'; g.fillRect(0, 0, 26, h); g.fillRect(w - 26, 0, 26, h); g.fillRect(0, h - 22, w, 22);   // the yellow demarcation lines (sides + front edge)
});
const stepGeo = new THREE.BoxGeometry(3.6, .58, .96); stepGeo.translate(0, -.29, 0);
const stepMats = [darkSteel, darkSteel, std('#9a9a9a', { map: treadTex, metalness: .4, roughness: .5 }), darkSteel, std('#3b3f47', { metalness: .6, roughness: .5 }), darkSteel];
const NSTEP = 27, PITCH = (COMB_TOP - COMB_BOT) / NSTEP;
const steps = new THREE.InstancedMesh(stepGeo, stepMats, NSTEP); steps.castShadow = true; steps.receiveShadow = true; scene.add(steps); steps.frustumCulled = false;
const stepS = i => (i * PITCH + offNow) % (COMB_TOP - COMB_BOT) + COMB_BOT;
let offNow = 0;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
function placeSteps() {
  for (let i = 0; i < NSTEP; i++) { const s = stepS(i), p = P(s); const dip = ss(seg(s, COMB_TOP - .7, COMB_TOP + .1)) + ss(seg(-s, -COMB_BOT - .7, -COMB_BOT + .1));
    p.y -= dip * .5; _m.compose(p, _q.identity(), _s.set(1, 1, 1)); steps.setMatrixAt(i, _m); }
  steps.instanceMatrix.needsUpdate = true;
}
// skirt panels, the gap, the bristle holder, glass balustrade, handrail: ribbons that follow the path
function ribbon(x0, x1, y0, y1, s0, s1, mat, n = 120, vertical = true) {
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), p = P(s);
    if (vertical) { pos.push(x0, p.y + y0, p.z, x0, p.y + y1, p.z); } else { pos.push(x0, p.y + y0, p.z, x1, p.y + y0, p.z); }
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
}
const gapMat = new THREE.MeshBasicMaterial({ color: '#1a0503', side: THREE.DoubleSide });
for (const sd of [-1, 1]) {
  const skirtMat = std('#d7dae0', { metalness: .9, roughness: .22, side: THREE.DoubleSide });
  ribbon(sd * SKIRT, 0, -.25, .95, COMB_BOT - 1.5, COMB_TOP + 1.5, skirtMat);
  ribbon(sd * (HALF + .002), sd * SKIRT, -.006, 0, COMB_BOT - .2, COMB_TOP + .2, gapMat, 160, false);       // the gap: a dark slit between the treads and the skirt
  ribbon(sd * (SKIRT - .004), 0, .27, .41, COMB_BOT - 1.5, COMB_TOP + 1.5, std('#2a2c31', { metalness: .7, roughness: .4, side: THREE.DoubleSide }));   // bristle holder
  ribbon(sd * (SKIRT + .02), 0, .95, 2.05, COMB_BOT - 1.5, COMB_TOP + 1.5, new THREE.MeshPhysicalMaterial({ color: '#cfe8ee', transparent: true, opacity: .14, roughness: .05, side: THREE.DoubleSide, depthWrite: false }));
  ribbon(sd * (SKIRT + .02), sd * (SKIRT + .2), 2.07, 0, COMB_BOT - 1.5, COMB_TOP + 1.5, std('#1b1b1f', { roughness: .35, side: THREE.DoubleSide }), 120, false);   // handrail
  ribbon(sd * (SKIRT + .5), 0, -2.2, 2.0, COMB_BOT - 1.5, COMB_TOP + 1.5, std('#e6dfd2', { roughness: .55, side: THREE.DoubleSide }));   // the outer cladding
}
// the gap's ember glow, breathing
const gapGlow = []; for (const sd of [-1, 1]) for (let i = 0; i < 40; i++) { const s = lerp(COMB_BOT, COMB_TOP, i / 39), g = sprite('#ff3b1a', .0, .35); g.position.copy(PX(s, sd * (HALF + .02), -.03)); scene.add(g); gapGlow.push({ g, s }); }
// the bristles: three rows per side of black nylon, instanced; they ripple, bristle up and push shoes back
const BR = []; const brGeo = new THREE.CylinderGeometry(.0045, .007, 1, 4, 1, true); brGeo.translate(0, .5, 0);
for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) for (let s = COMB_BOT - 1.2; s < COMB_TOP + 1.2; s += .026) BR.push({ sd, r, s: s + hash(BR.length) * .02, len: .4 + hash(BR.length + 3) * .05, ph: hash(BR.length + 7) * 6.28 });
const bristles = new THREE.InstancedMesh(brGeo, nylon, BR.length); bristles.frustumCulled = false; bristles.castShadow = false; scene.add(bristles);
const brTips = new THREE.InstancedMesh(new THREE.SphereGeometry(.007, 5, 4), std('#3a3a44', { metalness: .3, roughness: .2 }), BR.length); brTips.frustumCulled = false; scene.add(brTips);
const _up = V(0, 1, 0), _d = new THREE.Vector3();
let fluff = [];   // [{s, x, amt}] shoes that make the bristles bristle
function placeBristles(t) {
  for (let i = 0; i < BR.length; i++) { const b = BR[i], p = P(b.s); p.x = b.sd * (SKIRT - .01); p.y += .3 + b.r * .045;
    let dx = -b.sd, dy = -.12 + b.r * .05, dz = 0, len = b.len, f = 0;
    for (const q of fluff) { if (q.sd !== b.sd) continue; const d = Math.abs(b.s - q.s); if (d < q.w) f = Math.max(f, q.amt * (1 - d / q.w)); }
    const amb = .02 * Math.sin(t * 2.3 + b.s * 3 + b.ph);
    dy += amb + f * (.55 + .4 * Math.sin(b.ph * 3 + t * 14)); dz += f * .5 * Math.sin(b.ph * 5 + t * 9) + amb; dx *= 1 - f * .35; len *= 1 + f * .15;
    _d.set(dx, dy, dz).normalize(); _q.setFromUnitVectors(_up, _d);
    _m.compose(p, _q, _s.set(1, len, 1)); bristles.setMatrixAt(i, _m);
    _p.copy(p).addScaledVector(_d, len); _m.compose(_p, _q.identity(), _s.set(1, 1, 1)); brTips.setMatrixAt(i, _m); }
  bristles.instanceMatrix.needsUpdate = true; brTips.instanceMatrix.needsUpdate = true;
}
// landings, comb plates ("the teeth"), the red STOP button
const landing = std('#a7acb5', { metalness: .7, roughness: .38 });
mesh(new THREE.BoxGeometry(5.2, .3, 10), landing, V(0, L * SIN - .14, P(COMB_TOP).z + 4.98));
mesh(new THREE.BoxGeometry(5.2, .3, 8), landing, V(0, -.14, COMB_BOT - 3.98));
const teethGrp = new THREE.Group(); scene.add(teethGrp);
for (const [s, dir] of [[COMB_TOP, 1], [COMB_BOT, -1]]) { const p = P(s);
  mesh(new THREE.BoxGeometry(3.7, .05, .22), std('#e3c33a', { metalness: .6, roughness: .3 }), V(0, p.y + .02, p.z + dir * .11), dir > 0 ? teethGrp : scene);
  for (let i = 0; i < 46; i++) { const x = -1.76 + i * 3.52 / 45; const th = mesh(new THREE.BoxGeometry(.035, .03, .26), steel, V(x, p.y + .005, p.z - dir * .1), dir > 0 ? teethGrp : scene, false); th.rotation.x = dir * -.22; } }
const BTN = P(COMB_TOP + 1.2).add(V(2.35, 0, 0));
mesh(new THREE.CylinderGeometry(.16, .2, .75, 20), std('#d8d2c4', { roughness: .5 }), BTN.clone().add(V(0, .37, 0)));
const button = mesh(new THREE.SphereGeometry(.13, 20, 12, 0, 6.28, 0, 1.6), std('#e0251b', { roughness: .25, emissive: '#7a0a05', emissiveIntensity: .6 }), BTN.clone().add(V(0, .75, 0)));
const btnLabel = mesh(new THREE.PlaneGeometry(.3, .1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 86, (g, w, h) => { g.fillStyle = '#d8d2c4'; g.fillRect(0, 0, w, h); g.font = '800 64px Baloo2'; g.fillStyle = '#c3160c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', w / 2, h / 2 + 4); }) }), BTN.clone().add(V(-.17, .55, 0)), scene, false);
btnLabel.rotation.y = -Math.PI / 2;

// ———————————————————————————— Sole City: the atrium ————————————————————————————
const AC = V(0, 0, 9), AR = 24;
mesh(new THREE.CircleGeometry(AR + 2, 64).rotateX(-Math.PI / 2), std('#cdb79a', { roughness: .3, metalness: .1 }), V(AC.x, -.3, AC.z), scene, false);
const shopTex = canvasTex(2048, 512, (g, w, h) => {
  g.fillStyle = '#e9d2b4'; g.fillRect(0, 0, w, h); const cols = ['#f7a1b7', '#7fe0e6', '#ffd36b', '#b9a2f2', '#9be38f'];
  for (let x = 0; x < w; x += 128) { g.fillStyle = '#cdb08c'; g.fillRect(x, 0, 6, h); g.fillStyle = cols[(x / 128) % 5]; g.globalAlpha = .55; g.fillRect(x + 18, 150, 92, 260); g.globalAlpha = 1;
    g.fillStyle = '#5a3d2a'; g.fillRect(x + 18, 100, 92, 34); g.fillStyle = '#fff3da'; g.fillRect(x + 30, 170, 30, 50); g.fillRect(x + 66, 170, 30, 50); }
});
shopTex.wrapS = THREE.RepeatWrapping; shopTex.repeat.set(6, 1);
const FLOORS = [0, 10, 20, 30, 40];
for (const y of FLOORS) {
  const wall = mesh(new THREE.CylinderGeometry(AR + 2, AR + 2, 10, 64, 1, true), std('#ffffff', { map: shopTex, side: THREE.BackSide, emissive: '#3a2410', emissiveIntensity: .2 }), V(AC.x, y + 5, AC.z), scene, false);
  if (y > 0) { const ring = mesh(new THREE.RingGeometry(AR - 5, AR + 2, 64).rotateX(-Math.PI / 2), std('#d9c3a3', { roughness: .5, side: THREE.DoubleSide }), V(AC.x, y, AC.z), scene, false);
    mesh(new THREE.CylinderGeometry(AR - 5, AR - 5, .9, 64, 1, true), std('#b98d5e', { roughness: .4, metalness: .2, side: THREE.DoubleSide }), V(AC.x, y - .35, AC.z), scene, false);
    mesh(new THREE.TorusGeometry(AR - 5, .06, 6, 96).rotateX(Math.PI / 2), std('#f0d9a8', { metalness: .8, roughness: .25 }), V(AC.x, y + 1.0, AC.z), scene, false); }
}
// the top-landing bridge to the UPPER SOLES ring
mesh(new THREE.BoxGeometry(5.2, .3, 12), landing, V(0, L * SIN - .14, P(COMB_TOP).z + 10));
// neon signs on the balconies
function neon(text, col, y, ang, w = 7) { const tex = canvasTex(1024, 256, (g, cw, ch) => { g.fillStyle = 'rgba(30,14,30,.85)'; g.fillRect(0, 0, cw, ch); g.font = '800 150px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fillText(text, cw / 2, ch / 2 + 10); g.shadowBlur = 0; g.fillStyle = '#fff'; g.globalAlpha = .55; g.fillText(text, cw / 2, ch / 2 + 10); });
  const m = mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), V(AC.x + Math.sin(ang) * (AR - 5.3), y, AC.z + Math.cos(ang) * (AR - 5.3)), scene, false); m.lookAt(AC.x, y, AC.z); return m; }
neon('LACE & GRACE', '#ff6fb1', 11.4, 2.2); neon('INSOLE INN', '#56e8ff', 21.4, -2.1); neon('THE HEEL BAR', '#ff6fb1', 31.4, 1.2); neon('PUDDLE PARK', '#56e8ff', 1.6, -1.3, 6); neon('LOWER SOLES', '#ffd25c', 2.2, 2.6, 6); neon('UPPER SOLES', '#ffd25c', 11.6, -.8);
// the glass dome, sun shafts
const dome = mesh(new THREE.SphereGeometry(AR + 2, 32, 12, 0, 6.28, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff1d2', side: THREE.BackSide, fog: false }), V(AC.x, 50, AC.z), scene, false);
const lattice = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(AR + 1.9, 16, 6, 0, 6.28, 0, Math.PI / 2)), new THREE.LineBasicMaterial({ color: '#8a6a44', fog: false })); lattice.position.set(AC.x, 50, AC.z); scene.add(lattice);
const shaftTex = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,200,.9)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); });
const shafts = []; for (let i = 0; i < 4; i++) { const m = mesh(new THREE.PlaneGeometry(3 + R() * 3, 60), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), V(AC.x - 14 + R() * 28, 22, AC.z - 12 + R() * 24), scene, false); m.rotation.set(0, R() * 3, .32); shafts.push(m); }
// other escalators criss-crossing the atrium (static ramps)
const rampTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = '#6d727b'; g.fillRect(0, y, w, 6); } g.fillStyle = '#f2c61c'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); });
rampTex.wrapT = THREE.RepeatWrapping; rampTex.repeat.set(1, 6);
const RAMPS = [];
for (const [x, y, z, ry] of [[-13, 10, 6, 1.2], [12, 20, 14, -2.0], [-9, 30, 18, 2.6], [10, 0, 0, -.9]]) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
  const rp = mesh(new THREE.BoxGeometry(3, .3, 20), std('#ffffff', { map: rampTex, metalness: .5, roughness: .4 }), V(0, 5, 0), g, false); rp.rotation.x = -Math.atan2(10, 17.3);
  for (const sd of [-1, 1]) { const sk = mesh(new THREE.BoxGeometry(.15, 1.3, 20.2), std('#e6dfd2'), V(sd * 1.6, 5.5, 0), g, false); sk.rotation.x = rp.rotation.x; }
  RAMPS.push(g);
}
// Lower Soles: a puddle and chewing-gum boulders near the bottom of the escalator
mesh(new THREE.CircleGeometry(3.2, 40).rotateX(-Math.PI / 2), phys('#8fc9e8', { roughness: .02, metalness: .2, clearcoat: 1 }), V(-5.5, -.27, -9), scene, false);
for (const [x, z, s, c] of [[5.5, -10, 1.3, '#f58fb6'], [-7.8, -4, 1.0, '#7ad6c9'], [7.5, -3, .8, '#f5b56e']]) mesh(new THREE.SphereGeometry(s, 24, 16), phys(c, { roughness: .35, clearcoat: .5 }), V(x, s * .5 - .3, z)).scale.set(1, .6, 1);

// the billboard above the top of the escalator — and the X sprayed over it later
const BB = V(0, 24.2, AC.z + AR - 4.6);
function drawDuke(g, x, y, s) {   // a little Duke for posters: black patent oxford, monocle, a wink
  g.save(); g.translate(x, y, s > 0 ? 0 : 0); g.scale(s, s);
  g.fillStyle = '#0d0d12'; g.beginPath(); g.ellipse(0, 0, 150, 62, 0, 0, Math.PI * 2); g.fill(); g.fillRect(-150, 10, 70, 48);
  g.fillStyle = '#ffffff'; g.globalAlpha = .55; g.beginPath(); g.ellipse(-20, -30, 90, 12, -.1, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(40, -40, 26, 0, 7); g.arc(100, -36, 26, 0, 7); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(44, -38, 11, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = '#111'; g.beginPath(); g.moveTo(80, -36); g.lineTo(120, -40); g.stroke();
  g.strokeStyle = '#e8c35a'; g.lineWidth = 6; g.beginPath(); g.arc(40, -40, 33, 0, 7); g.stroke(); g.restore();
}
function sparkle(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
const bbTex = canvasTex(1600, 800, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffcf6b'); gr.addColorStop(1, '#ff8fb3'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a1630'; g.lineWidth = 22; g.strokeRect(11, 11, w - 22, h - 22);
  drawDuke(g, 1160, 470, 2.0);
  g.font = '800 170px Baloo2'; g.fillStyle = '#2b0f26'; g.textAlign = 'left'; g.fillText('THE DUKE', 70, 220); g.fillText('SHINE', 70, 390);
  g.font = '800 92px Baloo2'; g.fillStyle = '#ffffff'; g.fillText('FREE!', 80, 540); g.font = '800 70px Baloo2'; g.fillText('JUST RUB THE BRISTLES', 80, 660);
  for (const [x, y, r] of [[930, 140, 46], [1480, 180, 34], [1010, 650, 30], [1500, 620, 40], [860, 600, 22]]) sparkle(g, x, y, r, '#fffbe6');
});
const billboard = mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: bbTex, toneMapped: false }), BB, scene, false); billboard.rotation.y = Math.PI;
mesh(new THREE.BoxGeometry(16.6, 8.6, .3), std('#3a1630'), BB.clone().add(V(0, 0, .2)), scene, false);
let sprayK = 0;
const xTex = canvasTex(1600, 800, (g) => {}); const xPlane = mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: xTex, transparent: true, toneMapped: false, depthWrite: false }), BB.clone().add(V(0, 0, -.05)), scene, false); xPlane.rotation.y = Math.PI;
function drawX(k) { const c = xTex.userData.c, g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.strokeStyle = '#e3160c'; g.lineCap = 'round'; g.lineWidth = 120;
  const k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  if (k1 > 0) { g.beginPath(); g.moveTo(200, 120); g.lineTo(200 + 1200 * k1, 120 + 560 * k1); g.stroke(); }
  if (k2 > 0) { g.beginPath(); g.moveTo(1400, 120); g.lineTo(1400 - 1200 * k2, 120 + 560 * k2); g.stroke(); }
  xTex.needsUpdate = true; }
// the work boot on a rope that sprays the X
const worker = new THREE.Group(); scene.add(worker);
mesh(new THREE.CylinderGeometry(.03, .03, 12, 6), std('#c9a77a'), V(0, 6, 0), worker, false);

// the safety sign at the foot of the escalator, covered by a Duke poster
const SIGN = V(-2.8, 0, COMB_BOT - 1.6);
mesh(new THREE.CylinderGeometry(.06, .06, 2.4, 10), steel, SIGN.clone().add(V(0, 1.2, 0)));
const signTex = canvasTex(800, 1000, (g, w, h) => { g.fillStyle = '#ffd21f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26);
  g.fillStyle = '#1a1a1a'; g.font = '800 104px Baloo2'; g.textAlign = 'center'; g.fillText('STAND IN THE', w / 2, 170); g.fillText('CENTER.', w / 2, 300);
  g.fillStyle = '#1a1a1a'; g.fillRect(150, 380, 500, 300); g.fillStyle = '#ffd21f'; g.fillRect(190, 420, 420, 220); g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(400, 530, 70, 40, 0, 0, 7); g.fill();
  g.strokeStyle = '#d4180d'; g.lineWidth = 22; g.beginPath(); g.moveTo(205, 430); g.lineTo(205, 630); g.moveTo(595, 430); g.lineTo(595, 630); g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = '800 78px Baloo2'; g.fillText('KEEP AWAY FROM', w / 2, 800); g.fillText('THE SIDES.', w / 2, 900); });
const signPanel = mesh(new THREE.PlaneGeometry(1.4, 1.75), new THREE.MeshStandardMaterial({ map: signTex, roughness: .5 }), SIGN.clone().add(V(0, 1.75, -.08)), scene, false);
signPanel.rotation.y = Math.PI;   // faces shoes walking up (toward -z)
const posterTex = canvasTex(800, 760, (g, w, h) => { g.fillStyle = '#ff9ec0'; g.fillRect(0, 0, w, h); drawDuke(g, 430, 360, 1.5); g.font = '800 120px Baloo2'; g.fillStyle = '#2b0f26'; g.textAlign = 'center'; g.fillText('SHINE ME', w / 2, 640); sparkle(g, 140, 140, 50, '#fff'); sparkle(g, 680, 200, 36, '#fff'); });
const poster = new THREE.Group(); scene.add(poster); poster.position.copy(SIGN.clone().add(V(0, 1.555, -.1))); poster.rotation.y = Math.PI;
const posterMesh = mesh(new THREE.PlaneGeometry(1.44, 1.37), new THREE.MeshStandardMaterial({ map: posterTex, roughness: .7, side: THREE.DoubleSide }), V(0, 0, 0), poster, false);


// a shoe body from its side profile (toe low and round, the vamp rising to a collar, a heel at the back), extruded across and tapered at toe and heel
function shoeGeo(len, h, w, toeH, toeTaper = .7, collar = .78) {
  const L2 = len / 2, sh = new THREE.Shape();
  sh.moveTo(-L2, 0); sh.lineTo(L2 - toeH * .6, 0); sh.quadraticCurveTo(L2, 0, L2, toeH * .55); sh.quadraticCurveTo(L2, toeH, L2 - toeH * .9, toeH * 1.02);
  sh.quadraticCurveTo(-len * .02, toeH * 1.1, -len * .12, h * collar); sh.quadraticCurveTo(-len * .3, h * (collar - .08), -L2 + len * .06, h); sh.quadraticCurveTo(-L2 - .01, h, -L2, h * .8); sh.lineTo(-L2, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: w - .08, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 4, curveSegments: 14 });
  g.translate(0, 0, -(w - .08) / 2); g.rotateY(-Math.PI / 2);   // length along +z (toe forward), width along x
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), k = z > 0 ? lerp(1, toeTaper, Math.pow(z / L2, 2)) : lerp(1, .88, Math.pow(-z / L2, 2)); p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) + .0); }
  g.computeVertexNormals(); return g;
}
// ———————————————————————————— characters: shared parts ————————————————————————————
const eyeWhite = phys('#ffffff', { roughness: .15, clearcoat: 1 }), pupilMat = phys('#121018', { roughness: .1, clearcoat: 1 });
const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } return new THREE.ShapeGeometry(s); })();
const starMat = new THREE.MeshBasicMaterial({ color: '#ffd23a', toneMapped: false, side: THREE.DoubleSide });
function makeEye(parent, p, r, lidMat) {   // a cartoon eye: white ball, pupil that looks around, a highlight, an eyelid (body colour) that closes from the top
  const e = new THREE.Group(); e.position.copy(p); parent.add(e);
  mesh(new THREE.SphereGeometry(r, 24, 16), eyeWhite, V(0, 0, 0), e, false);
  const pv = new THREE.Group(); e.add(pv);
  const pupil = mesh(new THREE.SphereGeometry(r * .52, 18, 12), pupilMat, V(0, 0, r * .62), pv, false); pupil.scale.z = .5;
  const hl = mesh(new THREE.SphereGeometry(r * .14, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), V(r * .18, r * .2, r * .9), pv, false);
  const star = mesh(starShape, starMat, V(0, 0, r * 1.0), pv, false); star.scale.setScalar(r * .75); star.visible = false;
  const lid = mesh(new THREE.SphereGeometry(r * 1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat, V(0, 0, 0), e, false);
  const lidLow = mesh(new THREE.SphereGeometry(r * 1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat, V(0, 0, 0), e, false); lidLow.rotation.x = Math.PI;
  return { e, pv, pupil, star, lid, lidLow, r, set(o) { // o: {lx, ly, lid, low, pup, star, tear}
      pv.rotation.set(-(o.ly ?? 0) * .5, (o.lx ?? 0) * .6, 0);
      const l = clamp(o.lid ?? 0); lid.rotation.x = lerp(-Math.PI / 2 - .25, -.02, l) ; lid.visible = l > .02 || true;
      lidLow.rotation.x = Math.PI + lerp(Math.PI / 2 + .25, .25, clamp(o.low ?? 0)) - Math.PI / 2 + .0;
      const ps = o.pup ?? 1; pupil.scale.set(ps, ps, .5); hl.visible = !o.star; pupil.visible = !o.star; star.visible = !!o.star;
      if (o.star) { star.rotation.z = (o.t ?? 0) * 3; star.scale.setScalar(r * (.75 + .12 * Math.sin((o.t ?? 0) * 18))); }
    } };
}
function lace(radius, col) {   // a lace as a tube rebuilt every frame through a few points
  const m = new THREE.Mesh(new THREE.BufferGeometry(), std(col, { roughness: .7 })); m.castShadow = true; scene.add(m); m.frustumCulled = false;
  return { m, set(pts, n = 28) { const c = new THREE.CatmullRomCurve3(pts); m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(c, n, radius, 6, false); return c; } };
}
const aglet = (parent) => mesh(new THREE.CylinderGeometry(.012, .012, .06, 8), std('#c9ccd3', { metalness: .9, roughness: .2 }), V(0, 0, 0), parent ?? scene, false);

// ———————————————————————————— Squish: the lemon-yellow rubber clog ————————————————————————————
const rubber = phys('#f4e43a', { roughness: .32, clearcoat: .6, clearcoatRoughness: .2, sheen: .5, sheenColor: new THREE.Color('#fff7a0'), emissive: '#7a6200', emissiveIntensity: .12 });
const SQ = new THREE.Group(); scene.add(SQ);
const sqBody = new THREE.Group(); SQ.add(sqBody);   // squash & stretch here
const sqToe = new THREE.Group(); sqToe.position.set(0, 0, -.26); sqBody.add(sqToe);   // the whole clog hangs from its heel so it can stretch toe-first (taffy)
mesh(shoeGeo(.52, .27, .3, .21, .86, .6), rubber, V(0, .03, .26), sqToe);
mesh(new THREE.BoxGeometry(.3, .035, .54), phys('#e8c81f', { roughness: .5 }), V(0, .018, .26), sqToe);
for (let i = 0; i < 11; i++) { const r = i < 4 ? 0 : i < 8 ? 1 : 2, x = r === 2 ? ((i - 8) - 1) * .07 : ((i % 4) - 1.5) * .065, z = .36 + r * .065;
  const h = mesh(new THREE.CircleGeometry(.024, 14), new THREE.MeshBasicMaterial({ color: '#5e4c00' }), V(x, .25 - r * .035, z), sqToe, false); h.rotation.x = -Math.PI / 2 + .5 + r * .3; }
const strap = mesh(new THREE.TorusGeometry(.13, .02, 10, 24, Math.PI), rubber, V(0, .15, .06), sqToe); strap.rotation.set(0, Math.PI / 2, -.35);
const sqEyes = [-1, 1].map(s => makeEye(sqBody, V(s * .068, .27, .1), .06, rubber));
const tear = mesh(new THREE.SphereGeometry(.022, 12, 8), phys('#bfe9ff', { roughness: .02, transmission: .0, transparent: true, opacity: .85, clearcoat: 1 }), V(.1, .26, .16), sqBody, false); tear.visible = false;

// ———————————————————————————— Mom: the grey-blue runner ————————————————————————————
const mesh2 = phys('#7f93a8', { roughness: .55, sheen: .6, sheenColor: new THREE.Color('#c9d6e6') });
const MOM = new THREE.Group(); scene.add(MOM); const momBody = new THREE.Group(); MOM.add(momBody);
mesh(shoeGeo(.86, .44, .34, .2, .72, .8), mesh2, V(0, .07, 0), momBody);
mesh(new THREE.BoxGeometry(.36, .08, .9), phys('#f4f1ea', { roughness: .6 }), V(0, .04, .0), momBody);
mesh(new THREE.TorusGeometry(.1, .025, 8, 20), phys('#3a4656', { roughness: .7 }), V(0, .45, -.25), momBody).rotation.x = Math.PI / 2;
const stripe = mesh(new THREE.BoxGeometry(.35, .025, .52), new THREE.MeshStandardMaterial({ color: '#e7f6ff', emissive: '#cfefff', emissiveIntensity: .5, metalness: .4, roughness: .2 }), V(0, .14, .0), momBody, false);
const momEyes = [-1, 1].map(s => makeEye(momBody, V(s * .075, .31, .12), .068, mesh2));
const momLaces = [lace(.013, '#f6f3ee'), lace(.013, '#f6f3ee')];
const momAglets = [aglet(), aglet()];

// ———————————————————————————— Duke: the black patent oxford ————————————————————————————
const patent = phys('#0b0b10', { roughness: .06, metalness: .15, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.6 });
const DUKE = new THREE.Group(); scene.add(DUKE); const dkBody = new THREE.Group(); DUKE.add(dkBody);
mesh(shoeGeo(.98, .38, .3, .15, .55, .74), patent, V(0, .05, 0), dkBody);
mesh(new THREE.BoxGeometry(.24, .1, .2), phys('#1a120c', { roughness: .4 }), V(0, .03, -.37), dkBody);
mesh(new THREE.BoxGeometry(.3, .035, 1.0), phys('#2a1a12', { roughness: .5 }), V(0, .02, .01), dkBody);
mesh(new THREE.TorusGeometry(.09, .022, 8, 20), phys('#1c1c22', { roughness: .3 }), V(0, .41, -.3), dkBody).rotation.x = Math.PI / 2;
const dkEyes = [-1, 1].map(s => makeEye(dkBody, V(s * .07, .27, .1), .06, patent));
const monocle = new THREE.Group(); scene.add(monocle);
mesh(new THREE.TorusGeometry(.08, .012, 10, 28), std('#e8c35a', { metalness: 1, roughness: .15 }), V(0, 0, 0), monocle, false);
mesh(new THREE.CircleGeometry(.075, 24), new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', transparent: true, opacity: .25, roughness: 0, metalness: .2 }), V(0, 0, 0), monocle, false);
const dkLace = lace(.014, '#1c1c22'), dkAglet = aglet();
const bandaid = mesh(new THREE.BoxGeometry(.06, .035, .03), std('#f2c2a0'), V(0, 0, 0), scene, false); bandaid.visible = false;

// ———————————————————————————— the crowd (instanced shoes with eyes) ————————————————————————————
const crowdGeo = (() => { const g = shoeGeo(.72, .36, .3, .17, .72, .8); g.translate(0, .04, 0); return g; })();
const NC = 420;
const CR = [];   // {kind, col, x, s|world, yaw0, sc}
const crowdBody = new THREE.InstancedMesh(crowdGeo, phys('#ffffff', { roughness: .45, clearcoat: .3 }), NC);
const crowdSole = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .05, .74), std('#f3efe6'), NC);
const crowdEye = new THREE.InstancedMesh(new THREE.SphereGeometry(.055, 12, 8), eyeWhite, NC * 2);
const crowdPup = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 10, 6), pupilMat, NC * 2);
for (const m of [crowdBody, crowdSole, crowdEye, crowdPup]) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; scene.add(m); }
const PAL = ['#e2574c', '#3d7be0', '#f2a33a', '#3bb07a', '#9a5fd0', '#f07fb0', '#2b2b33', '#4ec2d8', '#c9b28a', '#ffd23a'];
// riders on the main escalator: a shoe or two on most steps; on rain boots (tall, glossy) etc. kind sets the shape
for (let i = 0; i < 70; i++) CR.push({ esc: true, i: Math.floor(i / 2.6), x: (hash(i) - .5) * 2.4, col: PAL[i % PAL.length], kind: ['sneaker', 'boot', 'heel', 'slipper'][i % 4], ph: hash(i + 9) * 6.28, rub: hash(i + 4) > .45 });
// three fat rain boots that block Mom
const BOOTS = [-.75, 0, .75].map((x, k) => ({ boot3: k, x, col: '#f2c21b', kind: 'boot', ph: k }));
CR.push(...BOOTS);
// the tourist flip-flop with sunglasses (next morning) is built separately below
// people on the balconies and other ramps (wide shots only)
for (let i = 0; i < 300; i++) { const fl = FLOORS[1 + (i % 4)], a = hash(i * 3) * 6.28, r = AR - 4.2 + hash(i * 5) * 4;
  CR.push({ world: V(AC.x + Math.sin(a) * r, fl, AC.z + Math.cos(a) * r), yaw: hash(i) * 6.28, col: PAL[(i * 7) % PAL.length], kind: ['sneaker', 'boot', 'heel', 'slipper'][i % 4], ph: hash(i + 1) * 6.28 }); }
for (let i = 0; i < 40; i++) { const rp = RAMPS[i % 4], k = (i / 40 * 4) % 1, loc = V((hash(i) - .5) * 2, 5 + (k - .5) * 10 + .3, (k - .5) * 17.3); CR.push({ ramp: rp, loc, col: PAL[(i * 3) % PAL.length], kind: ['sneaker', 'boot', 'heel', 'slipper'][i % 4], ph: hash(i + 2) * 6.28 }); }
const KS = { sneaker: [1, 1, 1], boot: [1.05, 1.9, .9], heel: [.75, .9, .95], slipper: [1.05, .6, 1.05] };
const _c = new THREE.Color(), _e = new THREE.Euler(), _o = new THREE.Object3D();
// crowd mood: {hideNear: [s0, s1], squash, center (0..1 line up in the middle), lookAt: Vector3|null, lookK}
function placeCrowd(t, mood) {
  let n = 0;
  for (let i = 0; i < CR.length && n < NC; i++) { const c = CR[i]; let pos, yaw = 0, vis = true, bob = 0;
    if (c.esc) { const s = stepS(c.i % NSTEP); if (s < COMB_BOT + .2 || s > COMB_TOP - .3) vis = false; if (mood.hide && s > mood.hide[0] && s < mood.hide[1]) vis = false;
      let x = lerp(c.x, (c.i % 3 - 1) * .0 + (hash(c.i) - .5) * .25, mood.center ?? 0); if ((c.i * 7) % 5 === 0 && (mood.center ?? 0) > .5) vis = false;
      if (c.rub && (mood.center ?? 0) < .5 && t < T.morning) x = Math.sign(c.x || 1) * (1.2 + .12 * Math.sin(t * 6 + c.ph));
      pos = PX(s, x); bob = Math.abs(Math.sin(t * 5 + c.ph)) * .02; }
    else if (c.boot3 !== undefined) { if (!(t > 33 && t < 50)) vis = false; const s = sqv(t) + 1.2; pos = PX(s, c.x); bob = Math.abs(Math.sin(t * 3 + c.ph)) * .01; }
    else if (c.ramp) { c.ramp.updateMatrixWorld(); pos = c.loc.clone().applyMatrix4(c.ramp.matrixWorld); yaw = c.ramp.rotation.y; }
    else { pos = c.world.clone(); yaw = c.yaw + Math.sin(t * .7 + c.ph) * .3; bob = Math.max(0, Math.sin(t * 3 + c.ph)) * .03; }
    if (!vis) continue;
    if (mood.look) { const d = mood.look.clone().sub(pos); yaw = lerp(yaw, Math.atan2(d.x, d.z), mood.lookK ?? 1); }
    const k = KS[c.kind]; const sq = mood.squash ? mood.squash(c) : 1;
    _o.position.copy(pos); _o.position.y += bob; _o.rotation.set(0, yaw, 0); _o.scale.set(k[0] / Math.sqrt(sq), k[1] * sq, k[2] / Math.sqrt(sq)); _o.updateMatrix();
    crowdBody.setMatrixAt(n, _o.matrix); crowdBody.setColorAt(n, _c.set(c.col));
    _o.scale.set(k[0], 1, k[2]); _o.updateMatrix(); crowdSole.setMatrixAt(n, _o.matrix);
    for (const sd of [-1, 1]) { const ep = V(sd * .07, (.19 + .04 * (k[1] - 1)) * sq + .04, .12 * k[2]).applyEuler(_e.set(0, yaw, 0)).add(_o.position);
      _o.position.copy(ep); _o.scale.setScalar(1); _o.updateMatrix(); crowdEye.setMatrixAt(n * 2 + (sd > 0), _o.matrix);
      const pp = V(sd * .07, (.19 + .04 * (k[1] - 1)) * sq + .04, .12 * k[2] + .035).applyEuler(_e).add(pos).add(V(0, bob, 0)); _o.position.copy(pp); _o.updateMatrix(); crowdPup.setMatrixAt(n * 2 + (sd > 0), _o.matrix);
      _o.position.copy(pos); }
    n++; }
  crowdBody.count = crowdSole.count = n; crowdEye.count = crowdPup.count = n * 2;
  for (const m of [crowdBody, crowdSole, crowdEye, crowdPup]) m.instanceMatrix.needsUpdate = true; crowdBody.instanceColor.needsUpdate = true;
}
// the tourist flip-flop with sunglasses
const FLIP = new THREE.Group(); scene.add(FLIP);
mesh(new THREE.BoxGeometry(.3, .05, .62), phys('#2fb6c9', { roughness: .4 }), V(0, .03, 0), FLIP).scale.set(1, 1, 1);
mesh(new THREE.TorusGeometry(.12, .018, 8, 20, Math.PI), phys('#ff6b3d'), V(0, .06, .05), FLIP).rotation.x = -Math.PI / 2 + .0;
const flipHead = new THREE.Group(); flipHead.position.set(0, .16, .12); FLIP.add(flipHead);
mesh(new THREE.SphereGeometry(.1, 16, 12), phys('#ff6b3d', { roughness: .4 }), V(0, 0, 0), flipHead).scale.set(1.3, .7, 1);
for (const sd of [-1, 1]) mesh(new THREE.BoxGeometry(.09, .05, .02), phys('#111', { roughness: .05, clearcoat: 1 }), V(sd * .055, .03, .09), flipHead, false);
mesh(new THREE.BoxGeometry(.2, .012, .012), phys('#111'), V(0, .045, .09), flipHead, false);

// ———————————————————————————— lights ————————————————————————————
const hemi = new THREE.HemisphereLight('#fff0d8', '#8a6a52', .55); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffd9a0', 1.7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .5, far: 40 }); scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#a8c4ff', .5); fill.position.set(-6, 4, -8); scene.add(fill);
const alarm = new THREE.PointLight('#ff2a1a', 0, 14, 1.6); scene.add(alarm);
const alarmLamp = mesh(new THREE.SphereGeometry(.12, 16, 10), new THREE.MeshBasicMaterial({ color: '#ff3a1a' }), BTN.clone().add(V(0, 1.15, 0)), scene, false);
const gapLight = new THREE.PointLight('#ff3a1a', 0, 1.6, 2); scene.add(gapLight);

// ———————————————————————————— shots ————————————————————————————
const SHOTS = []; const shot = (t0, t1, name, cam) => SHOTS.push({ t0, t1, name, cam });
const sD0 = t => sDuke(t);
// 0–2 ECU at tread level beside the bristles: Duke rubbing his flank on them, the gap beyond
const ecuCam = (s, x, t) => ({ pos: PX(s + 1.7, x - .15, .2), look: PX(s, x + .05, .24), fov: 34, focus: 1.7, aper: 7 });
shot(0, 2.0, 'open', t => { const s = sD0(t), k = eo(seg(t, 0, 2)); return { pos: LV(PR(s + 3.2, -.3, 1.9), PR(s + 1.6, .55, 1.05), k), look: LV(PR(s + .2, .9, .25), PR(s, 1.15, .3), k), fov: 44, focus: lerp(3.6, 1.9, k), aper: 4 }; });
shot(2.0, 4.0, 'snap', t => { const tt = Math.min(t, T.frz0), s = sD0(tt), k = eo(seg(tt, 2.0, 2.2)), sh = tt > T.suck ? Math.exp(-(tt - T.suck) * 5) * .06 : 0;
  const pos = PX(s + 1.0, .7, .62).add(V((hash(Math.floor(tt * 48)) - .5) * sh, (hash(Math.floor(tt * 48) + 3) - .5) * sh, 0)), end = PX(s - .25, 1.72, .02), mid = PX(s, 1.45, .35);
  return { pos, look: LV(LV(mid, end, k), PX(s, 1.45, .55), ss(seg(tt, T.suck, 2.75))), fov: lerp(42, lerp(20, 38, ss(seg(tt, T.suck, 2.8))), k), focus: 1.25, aper: 6 }; });
shot(4.0, 7.0, 'ms', t => { const s = sD0(t); return { pos: PX(s - .3, -.95, .6), look: PX(s, 1.05, .32), fov: 44, focus: 2.1, aper: 4 }; });
// 7–15 crane up along the escalator to the dome, then turn round to see the whole city
const CR0 = () => { const s = sD0(7); return [PX(s - .3, -.95, .6), PX(s, 1.05, .32)]; };
shot(7, 10.2, 'crane', t => { const [p0, l0] = CR0(), k = eio(seg(t, 7, 9.6)), r = eio(seg(t, 8.8, 10.2));
  const pos = new THREE.CatmullRomCurve3([p0, PX(5, -1.0, 2.6), PX(12, -.8, 5.5), PX(19, -.6, 8), V(-.5, 22, 22), V(0, 25, 24)]).getPointAt(k);
  const lookFwd = LV(l0, PX(L + 4, 0, 4), k), lookBack = V(0, 1, -4);
  return { pos, look: LV(lookFwd, lookBack, r).add(V(0, 0, 0)), fov: lerp(44, 62, k), focus: 30, aper: lerp(4, .6, k) }; });
shot(10.2, 12.6, 'bill', t => ({ pos: BB.clone().add(V(lerp(-4.2, 3.6, eio(seg(t, 10.2, 12.6))), -1.2, -12.5)), look: BB.clone().add(V(lerp(-4.6, 3.9, eio(seg(t, 10.2, 12.6))), -.4, 0)), fov: 42, focus: 12.5, aper: 1.5 }));
shot(12.6, 15, 'rubbers', t => { const k = seg(t, 12.6, 15); return { pos: PX(9.5 + k * .8, -.2, 2.4), look: PX(7.8 + k * .8, 1.3, .4), fov: 44, focus: 2.6, aper: 3.5 }; });
// 15–22: Squish and Mom at the foot of the escalator
const FOOT = V(-.25, 0, COMB_BOT - 1.3);
shot(15, 17.2, 'low', t => ({ pos: FOOT.clone().add(V(1.0, .16, -1.6)), look: FOOT.clone().add(V(-.1, .32, .2)), fov: 40, focus: 1.8, aper: 6 }));
shot(17.2, 18.8, 'ots', t => ({ pos: FOOT.clone().add(V(.25, .42, -.7 - .2 * seg(t, 17.2, 18.8))), look: BB.clone().add(V(0, -1, 0)), fov: 40, focus: 18, aper: 2 }));
shot(18.8, 19.9, 'cu', t => ({ pos: FOOT.clone().add(V(.3, .55, 1.75)), look: FOOT.clone().add(V(.3, .2, 0)), fov: 30, focus: 1.8, aper: 7 }));
shot(19.9, 22, 'board', t => ({ pos: FOOT.clone().add(V(1.3, .55, -1.4)), look: FOOT.clone().add(V(-.1, .25, 1.6)), fov: 44, focus: 2.2, aper: 5 }));
// 22–30 the temptation
shot(22, 25, 'ride', t => { const s = sqv(t); return { pos: PX(s + 5.2, -1.0, 2.1), look: PX(s + 1.2, .3, .3), fov: 40, focus: 4.4, aper: 3 }; });
shot(25, 27.4, 'top', t => { const s = sSquish(t); return { pos: PX(s - .5, .3, 3.6), look: PX(s + .2, .5, 0), fov: 46, focus: 3.5, aper: 3 }; });
shot(27.4, 28.9, 'toe', t => { const s = sSquish(t); return { pos: PX(s + .8, .35, 1.0), look: PX(s, 1.55, .1), fov: 36, focus: 1.6, aper: 6 }; });
// 28.9–30 the slit between the step and the skirt, glowing
shot(28.9, 30.0, 'slit', t => { const s = sSquish(t), k = seg(t, 28.9, 30); return { pos: PR(s + 1.0 + .1 * k, .75, 1.7), look: PR(s + 1.0, 1.84, -.02), fov: 32, focus: 2.0, aper: 6 }; });
// 30–42 the gap
shot(30.0, 31.6, 'gap', t => { const s = sSquish(t); return { pos: PX(s + .55, .7, .85), look: PX(s, 1.72, .04), fov: 30, focus: 1.35, aper: 7, shake: .3 }; });
shot(31.6, 33.0, 'face', t => { const s = sSquish(t); return { pos: PX(s + .35, 1.05, .95), look: PX(s, 1.45, .25), fov: 40, focus: .85, aper: 8, shake: .5 }; });
shot(33.0, 35.0, 'fight', t => { const s = sSquish(t); return { pos: PX(s - .85, .55, .6), look: PX(s, 1.5, .2), fov: 44, focus: 1.3, aper: 6, shake: .5 }; });
shot(35.0, 37.0, 'mom', t => { const s = sqv(t); return { pos: PX(s + 2.0, -.25, .75), look: PX(s, -.5, .3), fov: 40, focus: 2.0, aper: 5, shake: .6 }; });
shot(37.0, 39.0, 'teeth', t => { const s = sSquish(t); return { pos: PX(s + 2.4, .35, 1.25), look: PX(s + .3, 1.15, .15), fov: 40, focus: 2.4, aper: 3, shake: .8 }; });
shot(39.0, 42.0, 'duke', t => { const s = sDuke(t); return { pos: PX(s + .9, .2, .55), look: PX(s, .7, .3), fov: 40, focus: 1.0, aper: 7, shake: .6 }; });
// 42–50 the red button
shot(42.0, 43.4, 'jump', t => { const s = sDuke(T.crack); return { pos: PX(COMB_TOP + 2.6, -1.2, 1.5), look: LV(PX(s, .9, .3), BTN.clone().add(V(0, .7, 0)), ss(seg(t, 42.4, 43.4))), fov: 44, focus: 3.5, aper: 3 }; });
shot(43.4, 44.6, 'button', t => ({ pos: BTN.clone().add(V(-2.0, 1.7, 2.1)), look: BTN.clone().add(V(0, 1.0, 0)), fov: 44, focus: 3.0, aper: 3, shake: t > T.button ? 1.2 * Math.exp(-(t - T.button) * 4) : 0 }));
shot(44.6, 46.0, 'stopwide', t => ({ pos: PX(6, -5.5, 7.5), look: PX(12, .2, .5), fov: 52, focus: 9, aper: 1.5 }));
shot(46.0, 47.8, 'pull', t => { const s = sSquish(t); return { pos: PX(s + 1.5, .55, 1.05), look: PX(s, 1.15, .2), fov: 44, focus: 1.8, aper: 5 }; });
shot(47.8, 50.0, 'sploink', t => { const s = sSquish(t); return { pos: PX(s + 3.0, -.3, 1.8), look: PX(s, .5, .5), fov: 46, focus: 3.3, aper: 3 }; });
// 50–56 the truth: wide, still; then a slow dolly to the bristles
shot(50.0, 56.0, 'truth', t => { const k = eio(seg(t, 52.6, 56)), s = sSquish(t); return { pos: LV(PX(s + 5.5, -.9, 2.8), PX(s + 1.2, .9, .8), k), look: LV(PX(s, .5, .3), PX(s, 1.65, .3), k), fov: lerp(46, 40, k), focus: lerp(5.5, 1.2, k), aper: lerp(2, 6, k) }; });
shot(56.0, 60.0, 'soft', t => { const q = SQ.position, k = eio(seg(t, 56, 60)); return { pos: q.clone().add(V(.05, lerp(.95, .7, k), lerp(1.6, 1.15, k))), look: q.clone().add(V(0, .16, 0)), fov: 38, focus: lerp(1.85, 1.35, k), aper: 7 }; });
// 60–65 fixing the city
shot(60.0, 63.3, 'sign', t => ({ pos: SIGN.clone().add(V(.25, 1.65, -4.3)), look: SIGN.clone().add(V(0, 1.65, 0)), fov: 40, focus: 4.3, aper: 2.5 }));
shot(63.3, 65.0, 'board2', t => ({ pos: BB.clone().add(V(2, -5, -14)), look: BB.clone().add(V(0, -.5, 0)), fov: 44, focus: 14, aper: 1.5 }));
// 65–72 next morning, the loop
shot(65.0, 71.0, 'morning', t => { const s = sqv(t); return { pos: PX(s + 6.5, 0, 2.6), look: PX(s - .6, .2, .2), fov: 46, focus: 6.8, aper: 2 }; });
shot(71.0, 72.1, 'loopecu', t => { const s = sFlip(t); return { pos: PR(s + 1.3, .65, 1.25), look: PR(s, 1.25, .5), fov: 38, focus: 1.5, aper: 6 }; });
function LV(a, b, u) { return a.clone().lerp(b, u); }
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
const sFlip = t => sqv(t) - 2.2;

// ———————————————————————————— the scene at time t ————————————————————————————
function setShoe(G, body, pos, yaw, sq = 1, lean = 0, roll = 0) { G.position.copy(pos); G.rotation.set(0, yaw, 0); body.rotation.set(lean, 0, roll); body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); G.updateMatrixWorld(true); }
const loc = (G, v) => v.clone().applyMatrix4(G.matrixWorld);
function jelly(t, t0, amp = .25, f = 22, d = 7) { const k = t - t0; return k < 0 ? 0 : amp * Math.exp(-k * d) * Math.sin(k * f); }

let texts = [];
function setScene(t) {
  const S = shotAt(t);
  offNow = offAt(t); offRider = offNow; placeSteps();
  const danger = ss(seg(t, 30.6, 31.4)) * (1 - ss(seg(t, 48.2, 49.6)));
  const morning = ss(seg(t, 64.6, 65.4));
  // —— Duke ——
  const tD = (t >= T.frz0 && t < T.frz1) ? T.frz0 : t;
  let dS = sDuke(tD), dX = 1.15, dYaw = 0, dSq = 1, dLean = 0, dRoll = 0, dVis = !(t >= 15 && t < 21.4), dEyes = { lid: .75, lx: .5 }, monoAt = null, laceEnd = null, aglEnd = true;
  if (t < 15) {   // rubbing: side to side against the bristles, eyes closed in bliss
    const rub = Math.sin(tD * 7.5) * .05; dX = 1.2 + rub; dRoll = -.08 + rub * .8; dEyes = { lid: .6, low: .35, ly: .3 };
    laceEnd = PR(dS - .25, 1.74, .02).add(V(0, 0, Math.sin(tD * 3) * .04));
    if (tD > T.suck) { const k = seg(tD, T.suck, T.suck + .18); dX = lerp(1.2, 1.5, eo(k)); dSq = 1 - .55 * ss(k); dRoll = -.5 * ss(k); dEyes = { lid: 0, pup: .55 }; laceEnd = PR(dS - .15, HALF + .05, -.12);
      monoAt = P(dS).add(V(dX - .12 + .3 * k, .32 + 1.4 * eo(seg(tD, T.suck, T.frz0)), .1)); }
    if (t >= T.frz1) { // the lace yanks free (the aglet stays behind and shoots out), the monocle drops, he catches it, puts it on, rubs again
      const k = seg(t, T.frz1, T.frz1 + .5); dX = lerp(1.5, 1.05, eo(seg(t, T.aglet, T.aglet + .25))); dSq = lerp(.45, 1, ss(seg(t, T.aglet, T.aglet + 1.2))) + jelly(t, T.aglet + .9, .06, 18, 5); dRoll = lerp(-.5, 0, ss(seg(t, T.aglet, T.aglet + .6)));
      dEyes = { lid: lerp(0, .55, ss(seg(t, 5.4, 5.8))), lx: .4, pup: lerp(.55, 1, ss(seg(t, 4.6, 5))) };
      aglEnd = t < T.aglet; laceEnd = t < T.aglet ? PR(dS - .15, HALF + .05, -.12) : null;
      const fall = seg(t, T.frz1, T.catch); monoAt = t < T.catch ? P(dS).add(V(1.5 - .12 + .3, .32 + 1.4 - 1.2 * ei(fall), .1)) : null;
      if (t > T.rub2) { const rub = Math.sin(t * 7.5) * .05; dX = 1.2 + rub; dRoll = -.08 + rub * .8; dEyes = { lid: .85, low: .4 }; } }
  } else {   // 21.4+: three steps above Squish, still rubbing; turns at 39; leaps to the button at 42.25; back to help pull; next morning: in the middle
    dX = 1.2 + Math.sin(t * 7.5) * .05; dRoll = -.08; dEyes = { lid: .85, low: .4 };
    if (t > T.turn) { const k = ss(seg(t, T.turn, T.turn + .5)); dYaw = lerp(0, Math.PI, k); dX = lerp(1.2, .9, k); dRoll = 0; dEyes = { lid: 0, pup: .5, lx: 0, ly: -.4 }; }
    if (t > T.crack) { const k = seg(t, T.jump, T.button); const a = PR(sDuke(T.crack), .9), b = BTN.clone().add(V(0, .82, 0));
      dSq = t < T.jump ? 1 - .35 * ss(seg(t, T.crack, T.jump)) : 1.25 - .25 * ss(k); const p = LV(a, b, eio(k)).add(V(0, Math.sin(k * Math.PI) * 1.6, 0));
      dS = null; DUKE.position.copy(p); dYaw = lerp(Math.PI, 0, ss(seg(t, T.jump, T.jump + .4))); dLean = t > T.jump ? -.4 * Math.sin(k * Math.PI) : .3 * ss(seg(t, T.crack, T.jump)); dEyes = { lid: 0, pup: .8 };
      if (t > T.button) { DUKE.position.copy(b.clone().add(V(0, -.12 * Math.exp(-(t - T.button) * 6), 0))); dSq = 1 - .3 * Math.exp(-(t - T.button) * 5); dLean = -.15; }
      if (t > T.run) { const k2 = ss(seg(t, T.run, T.run + .8)); const sq = sSquish(t); DUKE.position.copy(LV(b, PR(sq + .55, 1.0), k2).add(V(0, Math.sin(k2 * Math.PI) * .6, 0))); dYaw = lerp(0, Math.PI + .9, k2); dLean = 0; }
      if (t > T.truth1) { const sq = sSquish(t); DUKE.position.copy(PR(sq + .75, .95)); dYaw = Math.PI + .6; dEyes = { lid: .2, ly: -.6, lx: .2 }; dSq = 1; } }
    if (t > T.tear && t < T.morning) { DUKE.position.copy(SIGN.clone().add(V(.45, 0, -.4))); dYaw = Math.PI * .85; dS = null; dEyes = { lid: .1, ly: .4 }; dLean = 0; }
    if (t >= T.morning) { dS = sqv(t) + 1.0; dX = .45; dYaw = 0; dRoll = 0; dEyes = { lid: .2 }; dSq = 1 + jelly(t, 66, .03, 8, 1); if (t > T.stare) { dYaw = lerp(0, 2.7, ss(seg(t, T.stare, T.stare + .3))) * (1 - ss(seg(t, T.cam, T.cam + .3))); dEyes = { lid: .45 }; } }
  }
  if (dS !== null) { DUKE.position.copy(PR(dS, dX)); }
  setShoe(DUKE, dkBody, DUKE.position.clone(), dYaw, dSq, dLean, dRoll); DUKE.visible = dVis;
  dkEyes.forEach((e, i) => e.set({ ...dEyes, t }));
  // monocle: on the right eye, flying, dropped, caught
  const eyeR = loc(dkBody, V(.07, .27, .17));
  if (monoAt) { monocle.position.copy(monoAt); monocle.rotation.set(t * 9, t * 6, 0); }
  else if (t > T.mono && t < T.truth1) { const k = seg(t, T.mono, T.mono + .45); monocle.position.copy(LV(eyeR, P(sDuke(T.mono)).add(V(.9, .02, .15)), ei(k))); monocle.rotation.set(Math.PI / 2 * k, 0, 0); if (t > T.crack) monocle.position.copy(P(sDuke(T.mono)).add(V(.9, .02, .15))); }
  else { monocle.position.copy(eyeR); monocle.quaternion.copy(DUKE.quaternion); }
  monocle.visible = DUKE.visible || t < 15;
  // Duke's lace: from the eyelets back along his flank like a scarf; the end trails toward the gap in the hook
  { const a = loc(dkBody, V(0, .3, .05)), b = loc(dkBody, V(.12, .34, -.12)); let e = laceEnd ?? loc(dkBody, V(.2, .12 + Math.sin(t * 4) * .02, -.34));
    if (t >= T.catch && t < T.rub2) e = monocle.position.clone();   // the lace holds the monocle while he puts it back
    if (t > T.crack && t < T.truth1) e = loc(dkBody, V(-.1, .5, -.3));
    if (t >= T.morning) e = loc(dkBody, V(.22, .08, -.3));
    const mid = LV(b, e, .5).add(V(0, .08, 0)); dkLace.set([a, b, mid, e]); dkAglet.position.copy(e); dkAglet.visible = aglEnd || t < T.frz0; DUKE.visible || (dkLace.m.visible = false); dkLace.m.visible = DUKE.visible || t < 15;
    bandaid.visible = t >= T.morning; bandaid.position.copy(e); }
  // the bitten-off aglet ricocheting between the skirts
  { const k = t - T.aglet; const ag = dkAglet; if (k > 0 && k < 1.6 && t < 15) { const x = 1.75 - Math.abs(((k * 6) % 2) - 1) * 3.5 + 1.75 - 1.75; ag.visible = true; ag.position.copy(PR(sDuke(T.aglet) + k * 1.6, 1.74 - 3.48 * Math.abs(((k * 1.8 + .0) % 2) - 1) * 1, .1 + Math.abs(Math.sin(k * 9)) * .25 * Math.exp(-k))); ag.rotation.set(k * 20, k * 13, 0); } }

  // —— Squish and Mom ——
  let sPos, sYaw = 0, sSq = 1, sLean = 0, sRoll = 0, toe = 1, sEyes = { lid: 0 }, sTear = false, squished = false;
  let mPos, mYaw = 0, mSq = 1, mLean = 0, mEyes = { lid: .1 }, laceT = [null, null];
  const hopB = (t2, f = 1) => Math.abs(Math.sin(t2 * Math.PI * 2.2 * f));
  if (t < T.board) {   // at the foot: bouncing, spots the billboard, Mom places him in the middle
    const b = hopB(t); sPos = FOOT.clone().add(V(.3, b * .22, 0)); sSq = 1 + (b < .2 ? -.3 * (1 - b / .2) : .25 * b);
    sEyes = { lid: 0, ly: t > 17.2 && t < 18.8 ? .9 : .2, star: t > 17.6 && t < 19.95, t };
    if (t > 19.95) { const k = ss(seg(t, 19.95, 20.45)); sPos = LV(FOOT.clone().add(V(.3, 0, 0)), PR(COMB_BOT + .4, 0), k).add(V(0, Math.sin(k * Math.PI) * .25, 0)); sSq = 1; }
    mPos = FOOT.clone().add(V(-.55, 0, -.3)); mEyes = { lid: .15, lx: .4 };
    laceT[1] = loc(sqBody, V(0, .14, -.22));
  } else {
    const s = sSquish(t); let x = 0;
    if (t > T.hop) { const k = seg(t, T.hop, T.hop + .7); sSq = 1 + .35 * Math.sin(k * Math.PI) - (k > .9 ? .2 : 0) + jelly(t, T.hop + .7, .2); }
    if (t > T.lean) { x = lerp(0, 1.1, ss(seg(t, T.lean, T.lean + .6))); sRoll = .15 * ss(seg(t, T.lean, T.lean + .6)); }
    if (t > T.giggle && t < T.squeeze + .4) { sSq += .05 * Math.sin(t * 40); sEyes = { lid: .65, low: .5 }; x = 1.1 - .12 * Math.abs(Math.sin(t * 6)); }   // the bristles push him back; he giggles
    if (t > T.squeeze) { const k = ss(seg(t, T.squeeze, T.squeeze + .9)); x = lerp(1.1, 1.42, k); sYaw = lerp(0, Math.PI / 2, k); sRoll = 0; sLean = .12 * k; toe = 1 + .2 * k; sEyes = { lid: .55 * (1 - k), ly: -.2 }; }
    if (t > T.bite) { squished = true; const k = ei(seg(t, T.bite, T.bite + .15)), k2 = ss(seg(t, T.bite2, T.bite2 + .3)); toe = 1.2 + .45 * k + .35 * k2 + .03 * Math.sin(t * 30); x = 1.42 + .05 * k2; sLean = .12 + .15 * k; sEyes = { lid: 0, pup: .45, ly: .1, lx: -.3 }; sTear = t > 31.8; sSq = 1 - .08 * Math.sin(t * 22) * danger; }
    if (t > T.pull) { const k = ss(seg(t, T.pull, T.sploink)); toe = lerp(toe, 1.9, k) + .05 * Math.sin(t * 25); x -= .2 * k; }
    sPos = PR(s, x); if (t > T.hop && t < T.hop + .7) sPos.y += Math.sin(seg(t, T.hop, T.hop + .7) * Math.PI) * .7;
    if (t > T.sploink) { // fires out, bounces on Duke's toe, lands in Mom's lace loop
      squished = false; const k = seg(t, T.sploink, T.land), a = PR(s, 1.3, .05), d = DUKE.position.clone().add(V(0, .35, 0)), m = PR(sqv(t) + .5, -.1, .55);
      toe = 1 + .9 * Math.exp(-(t - T.sploink) * 12) * Math.cos((t - T.sploink) * 30); sYaw = lerp(Math.PI / 2, 0, k) + k * 6.28;
      sPos = k < .45 ? LV(a, d, k / .45).add(V(0, Math.sin(k / .45 * Math.PI) * 1.2, 0)) : LV(d, m, (k - .45) / .55).add(V(0, Math.sin((k - .45) / .55 * Math.PI) * .9, 0));
      sSq = 1 + jelly(t, T.sploink + .45 * (T.land - T.sploink), .35, 26, 6) + jelly(t, T.land, .3, 20, 5); sEyes = { lid: 0, pup: .6 }; sLean = 0;
      if (t > T.land) { sPos = m.clone(); sYaw = 0; sEyes = { lid: .25 + .3 * ss(seg(t, 56.5, 58)), ly: .3, low: .3 }; sTear = t > T.soft - .5 && t < 60; toe = 1 + (t > T.blup ? .5 * Math.exp(-(t - T.blup) * 3) * Math.cos((t - T.blup) * 14) : .5); sSq = .96 + .02 * Math.sin(t * 9); } }
    if (t >= T.morning) { sPos = PR(sqv(t) + 1.0, 0); sYaw = 0; toe = 1; sTear = false; const b = hopB(t, .9); sPos.y += b * .18; sSq = 1 + (b < .2 ? -.25 * (1 - b / .2) : .2 * b); sEyes = { lid: 0, ly: .2 };
      if (t > T.stare) { sYaw = lerp(0, 2.7, ss(seg(t, T.stare, T.stare + .3))) * (1 - ss(seg(t, T.cam, T.cam + .3))); sPos.y = PY(sqv(t) + 1.0); sSq = 1; sEyes = { lid: .35 }; } }
    // Mom: beside him; the lace slips at 23 and she bends to tie it; sees, gets blocked by the boots, runs up once the escalator stops, pulls
    const ms = sqv(t); mPos = PR(ms, -.55); mEyes = { lid: .1, lx: .3 };
    if (t > T.slip && t < T.momUp) { mLean = .35 * ss(seg(t, T.slip + .3, T.slip + .8)); mEyes = { lid: .1, ly: -.9 }; }
    if (t > T.momUp) { mEyes = { lid: 0, pup: lerp(1, .3, ss(seg(t, T.momUp, T.momUp + .3))), lx: .3, ly: .3 }; const k = ss(seg(t, T.boots, T.boots + .4)); mPos = PR(ms + .55 * k - .25 * ss(seg(t, T.boots + .4, T.boots + .7)), -.4 + .3 * k); mSq = 1 + jelly(t, T.boots + .4, .25); }
    if (t > T.run) { const k = ss(seg(t, T.run, T.run + .9)); mPos = LV(mPos, PR(s - .35, .7), k); mPos.y += Math.abs(Math.sin(k * Math.PI * 4)) * .15 * (1 - k); mYaw = .5 * k; }
    if (t > T.land) { mPos = PR(sqv(t) + .3, -.55); mYaw = .3; mEyes = { lid: .3, lx: .3, ly: -.2 }; }
    if (t > T.tear && t < T.morning) { mPos = PR(sqv(t) + .3, -.55); }
    if (t >= T.morning) { mPos = PR(sqv(t) + 1.0, -.45); mYaw = 0; mEyes = { lid: .2 }; if (t > T.stare) { mYaw = lerp(0, 2.7, ss(seg(t, T.stare, T.stare + .3))) * (1 - ss(seg(t, T.cam, T.cam + .3))); mEyes = { lid: .45 }; } }
  }
  setShoe(SQ, sqBody, sPos, sYaw, sSq, sLean, sRoll); sqToe.scale.set(1 / Math.sqrt(toe), 1 / Math.sqrt(toe) * 1.0 + (1 - 1 / Math.sqrt(toe)) * .4, toe);
  sqEyes.forEach(e => e.set({ ...sEyes, t })); tear.visible = sTear; if (sTear) tear.position.set(.1, .26 - ((t * .6) % 1) * .1, .15);
  setShoe(MOM, momBody, mPos, mYaw, mSq, mLean, 0); momEyes.forEach(e => e.set({ ...mEyes, t }));
  // Mom's two laces: arms. Holding Squish's strap at the foot and on the escalator until the slip; pulling at 46.9; cradling after 48.9
  { const anchors = [loc(momBody, V(-.06, .36, .08)), loc(momBody, V(.06, .36, .08))];
    const strapP = loc(sqBody, V(0, .14, -.22)), toeP = loc(sqBody, V(0, .12, .1));
    for (let i = 0; i < 2; i++) { const a = anchors[i]; let e;
      if (t > T.land) { const sq = SQ.position; e = sq.clone().add(V(i ? .2 : -.2, .12, i ? -.05 : .05)); }
      else if (t > T.pull && t < T.sploink) { e = strapP.clone().add(V(0, .02 * i, 0)); }
      else if ((t < T.slip + .3 && i === 1)) { e = strapP; }
      else if (t > T.slip && t < T.momUp) { e = loc(momBody, V(i ? .1 : -.1, .05, .25)).add(V(Math.sin(t * 14 + i) * .03, 0, 0)); }
      else e = loc(momBody, V(i ? .2 : -.2, .08, .05 + Math.sin(t * 2 + i) * .03));
      const mid = LV(a, e, .5).add(V(0, .12, 0)); momLaces[i].set([a, LV(a, mid, .5).add(V(0, .04, 0)), mid, e]); momAglets[i].position.copy(e); } }
  // —— Duke's laces pulling too (46.9–48) ——
  if (t > T.pull && t < T.sploink) { const a = loc(dkBody, V(0, .3, .05)), e = loc(sqBody, V(0, .16, -.18)); dkLace.set([a, LV(a, e, .5).add(V(0, .15, 0)), e]); }
  // —— the bristles: who disturbs them ——
  fluff = [];
  if (t < 15) { fluff.push({ sd: 1, s: dS ?? 0, w: .6, amt: t > T.rub2 && t < T.pat ? 1 : t > T.pat && t < T.pat + .3 ? .2 : .25 + .1 * Math.sin(t * 7.5) }); }
  else if (t < T.turn) fluff.push({ sd: 1, s: sDuke(t), w: .6, amt: .25 });
  if (t > T.lean && t < T.land) { const s = sSquish(t); fluff.push({ sd: 1, s, w: .7, amt: t < T.squeeze ? .9 : t < T.bite ? .6 : t < 44.2 ? 1 + .3 * Math.sin(t * 30) : .4 }); }
  if (t > 28.7 && t < 30.1) fluff.push({ sd: 1, s: sSquish(t) + 1.0, w: .5, amt: 1.4 * ss(seg(t, 28.8, 29.2)) });
  if (t > T.truth1 && t < T.morning) fluff.push({ sd: 1, s: sSquish(t), w: 2, amt: -.15 * ss(seg(t, 50.5, 52)) });
  if (t > T.flip) { const s = sFlip(t); fluff.push({ sd: 1, s, w: .6, amt: .5 + .3 * Math.sin(t * 8) }); }
  for (const c of CR) if (c.esc && c.rub && t < T.morning) fluff.push({ sd: Math.sign(c.x || 1), s: stepS(c.i % NSTEP), w: .5, amt: .3 });
  placeBristles(t);
  // —— the flip-flop ——
  FLIP.visible = t > T.flip - .6;
  if (FLIP.visible) { const s = sFlip(t), k = seg(t, T.flip - .6, T.flip); let p = t < T.flip ? LV(PX(COMB_BOT - 1.2, 1.0), PX(s, 1.15), k).add(V(0, Math.sin(k * Math.PI) * .4, 0)) : PR(s, 1.25 + Math.sin(t * 8) * .05, .4);
    FLIP.position.copy(p); FLIP.rotation.set(0, 0, t > T.flip ? -.1 + Math.sin(t * 8) * .1 : 0); flipHead.rotation.set(0, 0, 0); }
  // —— the crowd ——
  const mood = { hide: t < 15 ? [sDuke(t) - 2.2, sDuke(t) + 1.6] : [sqv(t) - 2.5, sqv(t) + 5], center: morning };
  if (t > T.stop && t < T.stop + .9) { const k = t - T.stop; mood.squash = c => 1 - .35 * Math.exp(-k * 5) * Math.cos(k * 16); }
  if (t > T.stare && t < 72) { mood.look = t < T.cam ? FLIP.position : camera.position; mood.lookK = 1; }
  if (t >= T.morning) mood.hide = [sqv(t) - .3, sqv(t) + 2.2];
  if (t > 30 && t < 65) mood.hide = [sqv(t) - 2.5, sqv(t) + 5];
  placeCrowd(t, mood);
  // —— gap breathing, alarm, button ——
  for (const g of gapGlow) g.g.material.opacity = (.12 + .1 * Math.sin(t * 2 + g.s)) * (1 + 6 * Math.max(danger, ss(seg(t, 28.9, 29.4)) * (1 - ss(seg(t, 30.0, 30.4)))) * (1 + 1.5 * ss(seg(t, 28.9, 29.4)) * (t < 30.4 ? 1 : 0) * Math.max(0, 1 - Math.abs(g.s - sSquish(t) - 1.0) / 1.5))) * (t > T.stop && t < T.morning ? .4 : 1);
  button.position.y = BTN.y + .75 - (t > T.button ? .06 * Math.exp(-(t - T.button) * 3) + .03 : 0);
  alarm.position.copy(BTN.clone().add(V(Math.cos(t * 6) * 3, 2.2, Math.sin(t * 6) * 3)));
  alarm.intensity = danger * (t < T.stop ? 25 : 8) * (.5 + .5 * Math.sin(t * 12));
  alarmLamp.material.color.set(danger > .05 ? (Math.sin(t * 12) > 0 ? '#ff3a1a' : '#5a0a05') : '#5a0a05');
  if (squished) { gapLight.position.copy(PX(sSquish(t), HALF + .02, -.2)); gapLight.intensity = 2.2 * danger; } else gapLight.intensity = 0;
  // —— light & colour: honey morning → steel blue + red sweep → warm → bright ——
  const cool = danger;
  sun.color.set('#ffd9a0').lerp(new THREE.Color('#7f9cc9'), cool * .8); sun.intensity = lerp(1.7, .9, cool) + morning * .4;
  hemi.color.set('#fff0d8').lerp(new THREE.Color('#7d93c0'), cool); hemi.intensity = lerp(.55, .4, cool) + morning * .2;
  scene.background.set('#e8c79a').lerp(new THREE.Color('#4d5f80'), cool * .8).lerp(new THREE.Color('#fff0d4'), morning * .6);
  scene.fog.color.copy(scene.background);
  VG.warm.value = lerp(.12, -.15, cool) + morning * .05; VG.sat.value = lerp(1.12, .85, cool); VG.contrast.value = lerp(.12, .22, cool);
  dome.material.color.set('#fff1d2').lerp(new THREE.Color('#6d84ad'), cool);
  for (const m of shafts) m.material.opacity = .05 * (1 - cool) + morning * .03;
  // —— billboard X, the worker, the poster ——
  sprayK = seg(t, T.spray, T.spray + 1.6); if (t > T.spray - .1) drawX(sprayK); xPlane.visible = t > T.spray;
  worker.visible = t > 62.0 && t < T.morning + 2; worker.position.copy(BB.clone().add(V(lerp(-7, 7, sprayK) * (sprayK < .5 ? 1 : 1), -3 + (sprayK < .5 ? sprayK * 6 : 0), -.8)));
  { const k = seg(t, T.tear, T.tear + .7); poster.rotation.set(-k * 2.2, Math.PI, k * .8); poster.position.copy(SIGN.clone().add(V(-k * 1.2, 1.555 + k * 1.4 - k * k * 2.2, -.1 - k * 1.5))); poster.visible = k < 1; }
  // sun & shadow follow the subject
  const focusP = S.cam(t).look; sun.target.position.copy(focusP); sun.position.copy(focusP).add(V(-3, 9, -4)); sun.target.updateMatrixWorld();
  const big = ['crane', 'stopwide', 'board2', 'ots', 'bill', 'sign'].includes(S.name); Object.assign(sun.shadow.camera, big ? { left: -14, right: 14, top: 14, bottom: -14 } : { left: -4, right: 4, top: 4, bottom: -4 }); sun.shadow.camera.updateProjectionMatrix();
  return S;
}

// ———————————————————————————— on-screen text ————————————————————————————
function textBox(lines, t, t0, t1, y, size = 74, col = '#ffffff', pop = true) {
  if (t < t0 || t > t1) return; const a = Math.min(clamp((t - t0) / .2), clamp((t1 - t) / .25)), s = pop ? back(seg(t, t0, t0 + .3), 2.2) : 1;
  og.save(); og.globalAlpha = a; og.translate(W / 2, y); og.scale(s, s); og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  lines.forEach((l, i) => { const yy = (i - (lines.length - 1) / 2) * size * 1.18; og.lineWidth = size * .2; og.strokeStyle = 'rgba(20,12,30,.92)'; og.strokeText(l, 0, yy); og.fillStyle = col; og.fillText(l, 0, yy); });
  og.restore(); texts.push(lines.join(' '));
}
function stamp(t) {   // a red rubber stamp slammed down + a red arrow at the bristles
  if (t < T.frz0 || t > 4.2) return; const k = seg(t, T.frz0, T.frz0 + .12), a = clamp((4.2 - t) / .15);
  og.save(); og.globalAlpha = a; og.translate(W / 2, 560); og.rotate(-.08); og.scale(lerp(2.2, 1, ei(k)), lerp(2.2, 1, ei(k)));
  og.font = '800 92px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; const ls = ["YOU'VE BEEN USING", 'THESE WRONG.'];
  og.lineWidth = 14; og.strokeStyle = '#d4140b'; og.strokeRect(-470, -140, 940, 280); og.fillStyle = 'rgba(255,245,240,.18)'; og.fillRect(-470, -140, 940, 280);
  ls.forEach((l, i) => { og.lineWidth = 16; og.strokeStyle = '#fff'; og.strokeText(l, 0, (i - .5) * 108); og.fillStyle = '#d4140b'; og.fillText(l, 0, (i - .5) * 108); });
  og.restore();
  if (k >= 1) { og.save(); og.globalAlpha = a * clamp((t - T.frz0 - .15) / .1); og.strokeStyle = '#d4140b'; og.fillStyle = '#d4140b'; og.lineWidth = 22; og.lineCap = 'round';
    og.beginPath(); og.moveTo(560, 740); og.quadraticCurveTo(860, 820, 900, 1080); og.stroke(); og.beginPath(); og.moveTo(900, 1130); og.lineTo(850, 1040); og.lineTo(955, 1050); og.closePath(); og.fill(); og.restore(); }
}
function drawTexts(t) {
  texts = []; stamp(t);
  textBox(["YOU'VE BEEN USING", 'THESE WRONG.'], t, 0.0, T.frz0 - .02, 330, 92, '#ffffff', false);
  textBox(["THE BRUSHES AREN'T", 'THE DANGER.'], t, 31.7, 35.0, 360, 80);
  textBox(['THE GAP IS.'], t, 32.6, 35.0, 520, 96, '#ff5a3d');
  textBox(["ESCALATOR BRUSHES", "AREN'T FOR", "SHINING SHOES."], t, T.truth1, T.truth2 - .1, 520, 82);
  textBox(['THEY KEEP YOUR FEET', 'AWAY FROM THE GAP.'], t, T.truth2, 56.0, 520, 82, '#ffe066');
  textBox(['SOFT RUBBER SHOES', 'GET PULLED IN', 'MORE EASILY.'], t, T.soft, 60.0, 430, 78);
  textBox(['SEND THIS TO THE FRIEND', 'WHO DOES THIS.'], t, 65.4, 71.0, 470, 76, '#ffe066');
}

// ———————————————————————————— render ————————————————————————————
function render(t) {
  const S = setScene(t);
  const C = S.cam(t);
  if (QS.has('cam')) { const c = QS.get('cam').split(',').map(Number); C.pos = V(c[0], c[1], c[2]); C.look = V(c[3], c[4], c[5]); C.fov = c[6] ?? 40; C.aper = 0; }
  const dist = C.pos.distanceTo(C.look), dr = .003 * dist, sh = (C.shake ?? 0) * .02;
  const fr = Math.floor(t * 24);
  C.pos = C.pos.clone().add(V(Math.sin(t * .8) * dr + (hash(fr) - .5) * sh, Math.sin(t * 1.1 + 1) * dr * .7 + (hash(fr + 7) - .5) * sh, 0));
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  post.dof.focus = C.focus; post.dof.aper = C.aper; post.dof.maxCoc = 14;
  VG.fade.value = 1;
  post.composer.render();
  og.clearRect(0, 0, W, H); drawTexts(t);
}
const EV = [
  { t: 0, type: 'room', dur: 72 }, { t: 0, type: 'brush', dur: 2.3 }, { t: T.suck, type: 'suck' }, { t: T.suck + .12, type: 'slam' }, { t: T.frz0, type: 'scratch' }, { t: T.frz0 + .05, type: 'doom' },
  { t: T.aglet, type: 'snap' }, ...[0, .25, .48, .68, .86, 1.02].map((d, i) => ({ t: T.aglet + .12 + d, type: 'ping', v: 1 - i * .13 })), { t: 5.3, type: 'hmph' }, { t: T.rub2 + .1, type: 'frrsh' }, { t: T.rub2, type: 'brush', dur: 1 },
  { t: 7, type: 'city', dur: 8 }, ...[15.2, 15.65, 16.1, 16.55, 17.0, 17.45, 19.5].map(x => ({ t: x, type: 'boing' })), { t: 17.6, type: 'ting' }, { t: 20.25, type: 'clack' },
  { t: T.slip + .3, type: 'tie', dur: 2.4 }, { t: T.hop + .1, type: 'boing' }, { t: T.hop + .7, type: 'boing' }, { t: T.lean + .3, type: 'frrsh' }, { t: T.giggle, type: 'giggle', dur: 1.2 }, { t: 28, type: 'rumble', dur: 3 },
  { t: T.bite, type: 'stretch', dur: 1 }, { t: T.bite + .05, type: 'squeak' }, { t: T.bite2, type: 'stretch', dur: .8 }, { t: 31, type: 'grind', dur: 13.2 }, { t: T.fight, type: 'frrsh' }, { t: T.fight + .6, type: 'frrsh' },
  { t: T.boots + .4, type: 'bump' }, { t: T.mono + .45, type: 'tink' }, { t: T.crack, type: 'crack' }, { t: T.button, type: 'clunk' }, { t: T.button + .05, type: 'beep', dur: 1.2 }, { t: T.stop, type: 'brake' }, { t: T.stop + .1, type: 'huych' },
  { t: T.pull, type: 'stretch', dur: 1.1 }, { t: T.sploink, type: 'sploink' }, { t: T.sploink + .4, type: 'boing' }, { t: T.land, type: 'boing' }, { t: T.land + .1, type: 'hush' },
  { t: 50.3, type: 'sigh', dur: 3 }, { t: T.blup, type: 'blup' }, { t: T.blup + .45, type: 'blup' }, { t: 57.4, type: 'sniff' }, { t: 58.4, type: 'pat' }, { t: 58.75, type: 'pat' },
  { t: T.tear + .1, type: 'tear' }, { t: T.spray, type: 'spray', dur: 1.6 }, { t: T.flip + .1, type: 'brush', dur: 2 }, { t: T.stare, type: 'turn' }, { t: T.cam, type: 'turn' }, { t: T.loop, type: 'brush', dur: 1 },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, SHOTS, T };
render(0);
window.READY = true;
