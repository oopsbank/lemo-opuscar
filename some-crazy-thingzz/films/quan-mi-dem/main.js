// "Quán Mì Đêm" — the night noodle cart. Stylized 3D cartoon, 1080×1920, 24 fps, 75 s, no dialogue.
// Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.   Debug: ?fast · ?ssaa=1.5 · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, spring, hash, mulberry } from '/core/lib.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 80px Baloo2');
const STORY = await (await fetch('story.json')).json();

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), og = ov.getContext('2d');

const scene = new THREE.Scene();
const FOG = new THREE.Color('#3b2763');
scene.fog = new THREE.FogExp2(FOG, .016);
const camera = new THREE.PerspectiveCamera(40, W / H, .01, 400);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 1.5);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .45; post.bloom.threshold = .92; post.bloom.radius = .5;
post.vig.uniforms.amt.value = .42; post.vig.uniforms.warm.value = .25; post.vig.uniforms.contrast.value = .18; post.vig.uniforms.sat.value = 1.12;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = mulberry(7);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .75, metalness: 0, ...o });
function mesh(geo, mat, p, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, mat); if (p) m.position.copy(p); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const softTex = canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
softTex.colorSpace = THREE.NoColorSpace;

// ———————————————————————————— sky, stars, the cloud sea ————————————————————————————
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, fog: false, depthWrite: false,
  uniforms: { moon: { value: V(-.45, .42, -.78).normalize() } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; uniform vec3 moon; void main(){ float y = vD.y;
    vec3 c = mix(vec3(.43, .25, .55), vec3(.17, .10, .33), smoothstep(-.05, .35, y)); c = mix(c, vec3(.04, .02, .11), smoothstep(.3, .95, y));
    float m = dot(normalize(vD), moon); c += vec3(.75, .7, 1.) * smoothstep(.9985, .9992, m) * 1.6 + vec3(.35, .3, .6) * pow(max(m, 0.), 60.) * .5;
    gl_FragColor = vec4(c, 1.); }` }));
sky.renderOrder = -2; sky.frustumCulled = false; scene.add(sky);
{ const n = 700, p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, y = .12 + R() * .88, r = Math.sqrt(1 - y * y); p.set([Math.cos(a) * r * 250, y * 250, Math.sin(a) * r * 250], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const st = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff6e8', size: 2.2 * SSAA, sizeAttenuation: false, map: softTex, transparent: true, depthWrite: false, fog: false, opacity: .9 }));
  st.renderOrder = -1; scene.add(st); }
// the cloud sea: soft sprites in violet layers below the rock, a few drifting at rock height for depth
const clouds = [];
function cloudPuff(x, y, z, s, col, op = .9) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: col, transparent: true, opacity: op, depthWrite: false, fog: true }));
  sp.position.set(x, y, z); sp.scale.set(s, s * .55, 1); scene.add(sp); clouds.push({ sp, x, ph: R() * 6.28, sp0: .02 + R() * .05 }); return sp;
}
for (let i = 0; i < 150; i++) { const a = R() * Math.PI * 2, r = 5 + Math.pow(R(), .7) * 60; cloudPuff(Math.cos(a) * r, -4.2 - R() * 3 - r * .03, Math.sin(a) * r, 5 + R() * 12, ['#6e52a0', '#54408a', '#8a6cb8', '#46357a'][i % 4], .6); }
for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, r = 9 + R() * 18; cloudPuff(Math.cos(a) * r, -1.8 + R() * 2.2, Math.sin(a) * r, 3 + R() * 5, '#8a70b8', .25); }
mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), std('#2e2050', { roughness: 1 }), V(0, -9, 0), scene, false);
// distant floating rocks, some with a tiny lit window
function rockGeo(seed, sx, sy, sz, detail = 3) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, r = mulberry(seed), off = [r() * 9, r() * 9, r() * 9];
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + .16 * Math.sin(x * 3.1 + off[0]) * Math.cos(z * 2.7 + off[1]) + .08 * Math.sin(y * 5 + x * 4 + off[2]);
    x *= n; z *= n; y *= n;
    if (y > .15) y = .15 + (y - .15) * .12; else { const k = Math.max(.15, 1 + y * .45); x *= k; z *= k; y *= 1.25; }
    p.setXYZ(i, x * sx, y * sy, z * sz); }
  g.computeVertexNormals(); return g;
}
const rockMat = std('#6e5a92', { roughness: .95, flatShading: true });
for (const [x, y, z, s, lit] of [[-22, 1, -40, 4, 1], [30, -1, -55, 6, 1], [-48, 3, -20, 5, 0], [40, 4, -18, 3, 1], [-12, -2, -70, 7, 0], [55, 0, 20, 5, 0], [-35, 2, 30, 4, 1]]) {
  const m = mesh(rockGeo(x * 7 + z, s, s * .7, s), rockMat, V(x, y, z), scene, false);
  if (lit) mesh(new THREE.SphereGeometry(.12 * s / 4, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb35a', fog: false }), V(x + s * .2, y + s * .12 + .2, z + s * .3), scene, false);
}

// ———————————————————————————— the rock and the cart ————————————————————————————
const ROCK = mesh(rockGeo(11, 3.3, 2.1, 2.7, 4), rockMat, V(-1.1, -.33, -.3));
mesh(new THREE.CylinderGeometry(3.1, 3.3, .1, 40), std('#5b4a7e', { roughness: 1 }), V(-1.1, -.03, -.3)).scale.set(1, 1, .85);   // the flat top
for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 1.4 + R() * 1.7; mesh(new THREE.DodecahedronGeometry(.05 + R() * .12, 0), rockMat, V(-1.1 + Math.cos(a) * r, .02, -.3 + Math.sin(a) * r * .8)); }
// small glowing mushrooms near the edge
for (let i = 0; i < 9; i++) { const x = 1.3 + R() * .5, z = -1.2 + R() * 2.2, h = .05 + R() * .07; const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(new THREE.CylinderGeometry(.012, .016, h, 8), std('#efe6d6'), V(0, h / 2, 0), g); mesh(new THREE.SphereGeometry(.04, 12, 8, 0, 6.29, 0, 1.6), std('#7fd6ff', { emissive: '#4fb8ff', emissiveIntensity: 1.4 }), V(0, h, 0), g, false); }

const woodTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#9a5f34'; g.fillRect(0, 0, w, h); const r = mulberry(3);
  for (let i = 0; i < 8; i++) { g.fillStyle = ['#a8693a', '#8e552d', '#b2754a', '#93582f'][i % 4]; g.fillRect(0, i * 64, w, 62); g.fillStyle = 'rgba(60,30,10,.55)'; g.fillRect(0, i * 64 + 62, w, 2); }
  g.globalAlpha = .18; for (let i = 0; i < 260; i++) { g.strokeStyle = r() > .5 ? '#5a3216' : '#d29a64'; g.lineWidth = 1 + r() * 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + r() * 8 - 4, w * .6, y + r() * 8 - 4, w, y + r() * 6 - 3); g.stroke(); } });
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
const wood = std('#ffffff', { map: woodTex, roughness: .7 }), woodDark = std('#6b3f22', { roughness: .75 });
const cart = new THREE.Group(); scene.add(cart);
const B = (w, h, d, mat, x, y, z, parent = cart) => mesh(new THREE.BoxGeometry(w, h, d), mat, V(x, y, z), parent);
B(2.1, .6, .55, wood, 0, .68, .02);            // the bar (the guest side)
B(2.1, .1, .62, woodDark, 0, .35, -.48);       // the cook's floor
B(2.36, .07, 1.0, wood, 0, 1.015, .06).material = std('#c58a55', { map: woodTex, roughness: .55 });   // the counter top
B(2.1, .55, .06, wood, 0, .6, -.8);            // a low back wall
for (const x of [-1.1, 1.1]) for (const z of [-.78, .5]) mesh(new THREE.CylinderGeometry(.035, .04, 1.72, 10), woodDark, V(x, 1.9, z), cart);
// wheels at the two ends
for (const x of [-1.16, 1.16]) { const wg = new THREE.Group(); wg.position.set(x, .4, -.25); wg.rotation.y = Math.PI / 2; cart.add(wg);
  mesh(new THREE.TorusGeometry(.36, .045, 10, 32), woodDark, V(0, 0, 0), wg); mesh(new THREE.CylinderGeometry(.07, .07, .1, 12).rotateX(Math.PI / 2), woodDark, V(0, 0, 0), wg);
  for (let k = 0; k < 8; k++) { const s = mesh(new THREE.CylinderGeometry(.016, .016, .7, 6), wood, V(0, 0, 0), wg); s.rotation.z = k / 8 * Math.PI; } }
// the left wall with the window the film opens through
{ const x = -1.1, mt = wood, mf = std('#5d3519', { roughness: .6 });
  B(.05, .14, 1.28, mt, x, 1.12, -.14); B(.05, .9, 1.28, mt, x, 2.22, -.14); B(.05, .52, .3, mt, x, 1.45, -.63); B(.05, .52, .38, mt, x, 1.45, .31);
  B(.09, .06, .66, mf, x, 1.2, -.15); B(.09, .06, .66, mf, x, 1.72, -.15); B(.09, .58, .06, mf, x, 1.46, -.48); B(.09, .58, .06, mf, x, 1.46, .18); }
// the awning: a striped canopy, sloping to the front, with a scalloped edge
const stripeTex = canvasTex(512, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f6ead2' : '#d8453a'; g.fillRect(i * w / 8, 0, w / 8, h); } g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 8; i++) g.fillRect(i * w / 8, 0, 3, h); });
const canvasMat = std('#ffffff', { map: stripeTex, roughness: .9, side: THREE.DoubleSide });
const awn = B(2.6, .04, 1.75, canvasMat, 0, 2.74, -.05); awn.rotation.x = .13;
for (let i = 0; i < 13; i++) { const s = mesh(new THREE.CircleGeometry(.1, 16, 0, Math.PI), std(i % 2 ? '#f6ead2' : '#d8453a', { side: THREE.DoubleSide, roughness: .9 }), V(-1.2 + i * .2, 2.63, .8), cart); s.rotation.z = Math.PI; }
// the back shelf: stacked bowls, jars, bottles
B(2.0, .04, .2, woodDark, 0, 1.45, -.86); B(2.0, .04, .2, woodDark, 0, 1.78, -.86);
const bowlGeo = (() => { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(.03 + Math.sin(a) * .1, .07 - Math.cos(a) * .07 + .0)); } pts.push(new THREE.Vector2(.128, .072)); for (let i = 12; i >= 0; i--) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(.02 + Math.sin(a) * .098, .075 - Math.cos(a) * .062)); } return new THREE.LatheGeometry(pts, 40); })();
const bowlMat = std('#f4efe6', { roughness: .35 }), bowlBand = std('#3f6fc4', { roughness: .35 });
function makeBowl(parent) { const g = new THREE.Group(); parent.add(g); mesh(bowlGeo, bowlMat, V(0, 0, 0), g); mesh(new THREE.TorusGeometry(.115, .006, 6, 40).rotateX(Math.PI / 2), bowlBand, V(0, .055, 0), g); return g; }
for (const [x, n] of [[-.75, 3], [-.45, 2]]) for (let k = 0; k < n; k++) { const b = makeBowl(cart); b.position.set(x, 1.47 + k * .05, -.86); b.scale.setScalar(.9); }
for (const [x, c, h] of [[-.1, '#e0b25a', .16], [.1, '#c94f3d', .2], [.3, '#7fae58', .14], [.55, '#e0b25a', .22], [.75, '#8a5ab0', .15]]) {
  mesh(new THREE.CylinderGeometry(.045, .05, h, 14), std(c, { roughness: .3 }), V(x, 1.47 + h / 2, -.86), cart); mesh(new THREE.CylinderGeometry(.03, .03, .03, 10), woodDark, V(x, 1.47 + h + .015, -.86), cart); }
for (const [x, c] of [[-.7, '#d85a3a'], [-.45, '#f0d080'], [.35, '#6fa0d8'], [.7, '#d85a3a']]) mesh(new THREE.CylinderGeometry(.05, .05, .12, 12), std(c, { roughness: .4 }), V(x, 1.86, -.86), cart);
// a chopstick cup and a spoon jar on the counter, a stack of menu boards
mesh(new THREE.CylinderGeometry(.05, .045, .12, 14), std('#3f6fc4', { roughness: .4 }), V(-.32, 1.11, .4), cart);
const sticksInCup = [];
for (let i = 0; i < 9; i++) { const s = mesh(new THREE.CylinderGeometry(.004, .003, .24, 5), std('#e9cf9a'), V(-.32 + (hash(i) - .5) * .05, 1.2, .4 + (hash(i + 9) - .5) * .05), cart); s.rotation.set((hash(i + 3) - .5) * .25, 0, (hash(i + 5) - .5) * .25); sticksInCup.push(s); }
const looseSticks = new THREE.Group(); looseSticks.position.set(.58, 1.056, .4); cart.add(looseSticks);
for (const dz of [-.012, .012]) { const s = mesh(new THREE.CylinderGeometry(.004, .003, .24, 5).rotateZ(Math.PI / 2), std('#e9cf9a'), V(0, 0, dz), looseSticks); s.rotation.y = .5; }
mesh(new THREE.BoxGeometry(.12, .04, .05), std('#3f6fc4'), V(.58, 1.05, .4), cart);   // a chopstick rest
// the stool for the guest
const stool = new THREE.Group(); stool.position.set(.2, 0, 1.12); scene.add(stool);
mesh(new THREE.CylinderGeometry(.24, .22, .07, 20), wood, V(0, .5, 0), stool);
for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; const l = mesh(new THREE.CylinderGeometry(.025, .03, .5, 8), woodDark, V(Math.cos(a) * .15, .25, Math.sin(a) * .15), stool); l.rotation.set(Math.sin(a) * .15, 0, -Math.cos(a) * .15); }

// the pot of broth on a little stove
const POT = V(-.68, 1.05, -.12);
mesh(new THREE.CylinderGeometry(.17, .15, .1, 20), std('#3a3a44', { metalness: .6, roughness: .4 }), POT.clone().add(V(0, .05, 0)), cart);
const flame = mesh(new THREE.ConeGeometry(.05, .08, 10), new THREE.MeshBasicMaterial({ color: '#6ab8ff', transparent: true, opacity: .8 }), POT.clone().add(V(0, .12, 0)), cart, false);
const potMat = std('#a9aab6', { metalness: .35, roughness: .35, side: THREE.DoubleSide });
mesh(new THREE.CylinderGeometry(.21, .19, .27, 32, 1, true), potMat, POT.clone().add(V(0, .235, 0)), cart);
mesh(new THREE.CircleGeometry(.19, 32).rotateX(-Math.PI / 2), potMat, POT.clone().add(V(0, .11, 0)), cart);
mesh(new THREE.TorusGeometry(.21, .012, 8, 40).rotateX(Math.PI / 2), potMat, POT.clone().add(V(0, .37, 0)), cart);
for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.04, .01, 6, 16, Math.PI).rotateY(Math.PI / 2), potMat, POT.clone().add(V(s * .22, .31, 0)), cart).rotation.z = s * Math.PI / 2;
const brothMat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, glow: { value: 1 } }, fog: false,
  vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec2 vU; uniform float t, glow; void main(){ vec2 p = vU - .5; float r = length(p) * 2.; float a = atan(p.y, p.x);
    float sw = .5 + .5 * sin(a * 3. + r * 9. - t * 1.6) * sin(r * 13. + t * 2.3);
    vec3 c = mix(vec3(1., .62, .16), vec3(1., .86, .42), sw * (1. - r * .5)); c *= 1.15 - r * .45; c += vec3(.25, .12, .0) * smoothstep(.85, 1., r);
    gl_FragColor = vec4(c * glow * .58, 1.); }` });
const broth = mesh(new THREE.CircleGeometry(.195, 48).rotateX(-Math.PI / 2), brothMat, POT.clone().add(V(0, .34, 0)), cart, false);
const bubbles = []; for (let i = 0; i < 16; i++) { const b = mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.29, 0, 1.7), std('#ffd27a', { emissive: '#ffb030', emissiveIntensity: .7, roughness: .15 }), V(0, 0, 0), cart, false); bubbles.push({ m: b, a: hash(i) * 6.28, r: Math.sqrt(hash(i + 20)) * .16, ph: hash(i + 40), sp: .7 + hash(i + 60) * .9, s: .012 + hash(i + 80) * .02 }); }
// glowing spice specks floating on the broth
const specks = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: '#fff0a0', size: 7 * SSAA, sizeAttenuation: false, map: softTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
specks.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3)); cart.add(specks);
const steamPuffs = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#fff3e0', transparent: true, opacity: 0, depthWrite: false })); cart.add(s); steamPuffs.push({ s, ph: i / 10 }); }

// lantern (hung at the front-right of the awning) and the sign beside it
const LANT = V(.98, 2.05, .55);
const lantern = new THREE.Group(); lantern.position.copy(LANT); cart.add(lantern);
const lanternMat = std('#ffb468', { emissive: '#ff8a2a', emissiveIntensity: 1.1, roughness: .9 });
mesh(new THREE.SphereGeometry(.15, 24, 16), lanternMat, V(0, 0, 0), lantern, false).scale.set(1, 1.25, 1);
for (const y of [-.1, -.03, .04, .11]) mesh(new THREE.TorusGeometry(.15 * Math.sqrt(1 - Math.pow(y / .19, 2)), .004, 6, 30).rotateX(Math.PI / 2), std('#5a2a12'), V(0, y, 0), lantern, false);
mesh(new THREE.CylinderGeometry(.06, .07, .04, 14), std('#2a1a12'), V(0, .19, 0), lantern); mesh(new THREE.CylinderGeometry(.07, .06, .04, 14), std('#2a1a12'), V(0, -.19, 0), lantern);
mesh(new THREE.CylinderGeometry(.003, .003, .5, 4), std('#2a1a12'), V(0, .45, 0), lantern, false);
const tassel = mesh(new THREE.CylinderGeometry(.01, .02, .1, 8), std('#d8453a'), V(0, -.26, 0), lantern, false);
const lampLight = new THREE.PointLight('#ff9a48', 3.2, 7, 1.6); lampLight.position.copy(LANT); cart.add(lampLight);
const lanternGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#ff9a48', transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); lanternGlow.scale.set(1.1, 1.1, 1); lanternGlow.position.copy(LANT); cart.add(lanternGlow);
const signTex = canvasTex(1024, 300, (g, w, h) => { g.fillStyle = '#7a4524'; g.fillRect(0, 0, w, h); g.fillStyle = '#8d5330'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 75 + 4, w, 68);
  g.strokeStyle = '#3e1f0c'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.font = '800 104px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3a1a08'; g.fillText('Mở cửa đến bình minh', w / 2 + 3, h / 2 + 10); g.fillStyle = '#ffd9a0'; g.fillText('Mở cửa đến bình minh', w / 2, h / 2 + 6); });
const signGlowTex = canvasTex(1024, 300, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.font = '800 104px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffb860'; g.fillText('Mở cửa đến bình minh', w / 2, h / 2 + 6); });
const signMat = std('#ffffff', { map: signTex, emissive: '#ffffff', emissiveMap: signGlowTex, emissiveIntensity: 0, roughness: .7 });
const sign = new THREE.Group(); sign.position.set(.3, 2.4, .74); cart.add(sign);
mesh(new THREE.BoxGeometry(.8, .235, .03), [woodDark, woodDark, woodDark, woodDark, signMat, woodDark], V(0, 0, 0), sign);
for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.004, .004, .3, 4), std('#2a1a12'), V(s * .33, .26, 0), sign, false);
// a wind chime at the front-left corner
const chime = new THREE.Group(); chime.position.set(-1.0, 2.52, .7); cart.add(chime);
mesh(new THREE.CylinderGeometry(.07, .07, .015, 16), wood, V(0, 0, 0), chime, false);
const chimeBars = []; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28, l = .12 + k * .03; const pv = new THREE.Group(); pv.position.set(Math.cos(a) * .05, -.01, Math.sin(a) * .05); chime.add(pv);
  mesh(new THREE.CylinderGeometry(.008, .008, l, 8), std('#cfd6e0', { metalness: .9, roughness: .25 }), V(0, -l / 2 - .05, 0), pv, false); chimeBars.push(pv); }

// ———————————————————————————— props: bowl, noodles, ladle, jar, sun seed, stone ————————————————————————————
const PREP = V(-.15, 1.05, -.12), SERVE = V(.2, 1.05, .42);
const bowl = makeBowl(scene); bowl.scale.setScalar(1.25);
const bowlBroth = mesh(new THREE.CircleGeometry(.12, 40).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: brothMat.uniforms, vertexShader: brothMat.vertexShader, fragmentShader: brothMat.fragmentShader, fog: false }), V(0, .02, 0), bowl, false);
bowlBroth.visible = false;
const noodleMat = std('#ffe6a6', { emissive: '#ffc560', emissiveIntensity: .9, roughness: .4 });
const noodles = new THREE.Group(); scene.add(noodles);
{ const rr = mulberry(31); for (let k = 0; k < 16; k++) { const pts = [], a0 = rr() * 6.28, rad = .03 + rr() * .045;
    for (let i = 0; i <= 40; i++) { const a = a0 + i / 40 * Math.PI * 2 * (1.2 + rr() * .3); pts.push(V(Math.cos(a) * rad * (1 + .2 * Math.sin(i * .7 + k)), .012 * Math.sin(i * .5 + k) + k * .0018, Math.sin(a) * rad * (1 + .2 * Math.cos(i * .6 + k)))); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .0045, 5), noodleMat, V(0, 0, 0), noodles, false); } }
const toppings = new THREE.Group(); scene.add(toppings);
for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * .045, .02, .02); e.rotation.set(-1.25, 0, s * .4); toppings.add(e);
  mesh(new THREE.SphereGeometry(.03, 16, 10, 0, 6.29, 0, Math.PI / 2), std('#fffaf0', { roughness: .4 }), V(0, 0, 0), e, false).scale.set(1, .9, 1.35);
  mesh(new THREE.CircleGeometry(.016, 16).rotateX(-Math.PI / 2), std('#ffb02a', { emissive: '#ff9a10', emissiveIntensity: .3 }), V(0, .001, 0), e, false); }
for (let i = 0; i < 10; i++) mesh(new THREE.TorusGeometry(.007, .003, 5, 10).rotateX(Math.PI / 2), std('#58b84a'), V((hash(i) - .5) * .12, .025, (hash(i + 7) - .5) * .1), toppings, false);
const ladle = new THREE.Group(); scene.add(ladle);
mesh(new THREE.SphereGeometry(.05, 16, 10, 0, 6.29, Math.PI / 2, Math.PI / 2), std('#b8bcc6', { metalness: .9, roughness: .25, side: THREE.DoubleSide }), V(0, 0, 0), ladle);
const ladleHandle = mesh(new THREE.CylinderGeometry(.008, .008, .34, 8), std('#b8bcc6', { metalness: .9, roughness: .25 }), V(0, .16, -.06), ladle); ladleHandle.rotation.x = -.35;
const ladleFill = mesh(new THREE.CircleGeometry(.045, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffc04a' }), V(0, -.012, 0), ladle, false);
const stream = mesh(new THREE.CylinderGeometry(.012, .018, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ffc04a', transparent: true, opacity: .95 }), V(0, 0, 0), scene, false);
const jar = new THREE.Group(); scene.add(jar);
mesh(new THREE.CylinderGeometry(.055, .055, .12, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .35, roughness: .05, side: THREE.DoubleSide }), V(0, .06, 0), jar, false);
mesh(new THREE.CircleGeometry(.055, 24).rotateX(-Math.PI / 2), std('#cfe8ff'), V(0, .002, 0), jar, false);
const jarLid = mesh(new THREE.CylinderGeometry(.06, .06, .03, 24), std('#b07a44'), V(0, .135, 0), jar);
const seedMat = new THREE.MeshBasicMaterial({ color: '#ffe08a' });
for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(.016, 12, 8), seedMat, V((hash(i) - .5) * .05, .025 + i * .02, (hash(i + 3) - .5) * .05), jar, false);
const jarGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#ffb84a', transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); jarGlow.scale.set(.32, .32, 1); jarGlow.position.y = .07; jar.add(jarGlow);
const seed = new THREE.Group(); scene.add(seed);
mesh(new THREE.SphereGeometry(.02, 16, 10), seedMat, V(0, 0, 0), seed, false);
const seedGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#ffa53a', transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); seedGlow.scale.set(.2, .2, 1); seed.add(seedGlow);
const tongs = new THREE.Group(); scene.add(tongs);
for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(.004, .003, .24, 5), std('#e9cf9a'), V(s * .008, .12, 0), tongs); st.rotation.z = s * .05; }
const motes = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: '#ffd98a', size: 10 * SSAA, sizeAttenuation: false, map: softTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
motes.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3)); scene.add(motes);
// the Heavy-Heart Stone → the gem
const stone = new THREE.Group(); scene.add(stone);
const stoneMat = std('#7d808c', { roughness: .95, flatShading: true, emissive: '#7f9cd8', emissiveIntensity: .1 });
mesh(new THREE.DodecahedronGeometry(.075, 0), stoneMat, V(0, 0, 0), stone).scale.set(1, .85, 1);
for (let k = 0; k < 4; k++) { const c = mesh(new THREE.BoxGeometry(.004, .07, .004), new THREE.MeshBasicMaterial({ color: '#9fb4e0' }), V((hash(k) - .5) * .06, 0, .06), stone, false); c.rotation.z = (hash(k + 4) - .5) * 1.6; }
const gem = new THREE.Group(); scene.add(gem);
mesh(new THREE.OctahedronGeometry(.07, 0), new THREE.MeshStandardMaterial({ color: '#ffd77a', emissive: '#ffae3a', emissiveIntensity: 1.2, roughness: .1, metalness: .1, flatShading: true }), V(0, 0, 0), gem, false).scale.set(1, 1.25, 1);
const gemGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#ffb84a', transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); gemGlow.scale.set(.26, .26, 1); gem.add(gemGlow);
const gemLight = new THREE.PointLight('#ffb050', 0, 2, 2); gem.add(gemLight);
const cloth = mesh(new THREE.BoxGeometry(.09, .012, .07), std('#f2f2ea', { roughness: 1 }), V(0, 0, 0), scene);

// ———————————————————————————— the cook ————————————————————————————
const SKIN = '#ffd6b5';
const cook = new THREE.Group(); scene.add(cook);
const ck = {};
{ const body = new THREE.Group(); cook.add(body); ck.body = body;
  mesh(new THREE.SphereGeometry(.3, 32, 24), std('#fbf8f2', { roughness: .8 }), V(0, .42, 0), body).scale.set(1, 1.02, .92);
  mesh(new THREE.SphereGeometry(.302, 32, 24, -.9, 1.8, .9, 1.4), std('#6fa8dc', { roughness: .85 }), V(0, .42, 0), body).scale.set(1, 1.02, .92);   // apron
  for (const y of [.55, .45]) mesh(new THREE.SphereGeometry(.014, 8, 6), std('#d8453a'), V(-.08, y, .265), body);
  mesh(new THREE.TorusGeometry(.12, .025, 8, 24).rotateX(Math.PI / 2), std('#d8453a'), V(0, .67, 0), body);   // neckerchief
  for (const s of [-1, 1]) mesh(new THREE.CapsuleGeometry(.06, .08, 6, 12), std('#3a3346'), V(s * .1, .08, 0), body);
  const head = new THREE.Group(); head.position.set(0, .86, 0); body.add(head); ck.head = head;
  mesh(new THREE.SphereGeometry(.22, 32, 24), std(SKIN, { roughness: .6 }), V(0, 0, 0), head); ck.headMat = head.children[0].material;
  mesh(new THREE.SphereGeometry(.035, 12, 8), std('#ffb89a', { roughness: .5 }), V(0, -.02, .215), head);   // nose
  for (const s of [-1, 1]) { mesh(new THREE.CircleGeometry(.035, 16), new THREE.MeshBasicMaterial({ color: '#ff9e9e', transparent: true, opacity: .55 }), V(s * .12, -.05, .19), head, false).rotation.y = s * .55; }
  ck.eyes = []; for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * .075, .03, .19); head.add(e); mesh(new THREE.SphereGeometry(.03, 14, 10), std('#1a1420', { roughness: .2 }), V(0, 0, 0), e); mesh(new THREE.SphereGeometry(.009, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), V(.01 * s + .005, .012, .026), e, false); ck.eyes.push(e); }
  ck.brows = []; for (const s of [-1, 1]) { const b = mesh(new THREE.CapsuleGeometry(.008, .04, 4, 8).rotateZ(Math.PI / 2), std('#5a3a22'), V(s * .075, .085, .195), head); ck.brows.push(b); }
  const mouthCurve = k => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.045, 0, 0), V(0, -.025 * k, .006), V(.045, 0, 0)]), 12, .006, 6);
  ck.mouthSmile = mesh(mouthCurve(1), std('#5a1a22'), V(0, -.095, .2), head); ck.mouthBig = mesh(mouthCurve(1.8), std('#5a1a22'), V(0, -.09, .2), head); ck.mouthO = mesh(new THREE.TorusGeometry(.018, .006, 6, 16), std('#5a1a22'), V(0, -.1, .205), head);
  // the oversized chef's hat
  const hat = new THREE.Group(); hat.position.set(0, .17, 0); head.add(hat); ck.hat = hat;
  const hatMat = std('#ffffff', { roughness: .85 });
  mesh(new THREE.CylinderGeometry(.19, .2, .12, 28), hatMat, V(0, .03, 0), hat);
  for (const [x, y, z, r] of [[0, .3, 0, .22], [-.15, .24, .05, .15], [.15, .24, .05, .15], [0, .24, -.13, .15], [0, .25, .13, .14], [-.1, .4, -.04, .14], [.1, .4, .03, .14]]) mesh(new THREE.SphereGeometry(r, 20, 14), hatMat, V(x, y, z), hat);
  // the monocle magnifier on a chain; it rests up on the hat band and flips down over the right eye
  const mono = new THREE.Group(); head.add(mono); ck.mono = mono;
  mesh(new THREE.TorusGeometry(.05, .009, 8, 28), std('#e8b54a', { metalness: .9, roughness: .3 }), V(0, 0, 0), mono);
  mesh(new THREE.CircleGeometry(.047, 24), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: .35, roughness: 0, metalness: .2 }), V(0, 0, .002), mono, false);
  ck.chain = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)]), new THREE.LineBasicMaterial({ color: '#e8b54a' })); head.add(ck.chain);
  // arms: a shoulder pivot, a sleeve along −y, a round mitten at the end
  ck.arms = []; for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .26, .55, 0); body.add(sh);
    const arm = mesh(new THREE.CapsuleGeometry(.055, .16, 6, 12), std('#fbf8f2'), V(0, -.11, 0), sh);
    const hand = mesh(new THREE.SphereGeometry(.065, 16, 12), std('#ffffff', { roughness: .7 }), V(0, -.25, 0), sh);
    ck.arms.push({ sh, arm, hand, L: .25, s }); } }
const COOK0 = V(.05, .4, -.5);

// ———————————————————————————— the giant guest ————————————————————————————
function taperTube(curve, r0, r1, N = 32, M = 14) {
  const fr = curve.computeFrenetFrames(N, false), pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, P = curve.getPointAt(u), r = lerp(r0, r1, Math.pow(u, .8));
    for (let j = 0; j <= M; j++) { const a = j / M * Math.PI * 2, n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a))); pos.push(P.x + n.x * r, P.y + n.y * r, P.z + n.z * r); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const rimMat = (rim = '#b7a8ff') => new THREE.ShaderMaterial({ uniforms: { rim: { value: new THREE.Color(rim) }, base: { value: new THREE.Color('#07050d') }, fade: { value: 0 }, fogc: { value: FOG.clone() } },
  vertexShader: `varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vN, vV; uniform vec3 rim, base, fogc; uniform float fade; void main(){ float f = 1. - max(dot(normalize(vN), normalize(vV)), 0.);
    vec3 c = base + rim * (pow(f, 2.6) * 1.25 + pow(f, 8.) * 1.4); gl_FragColor = vec4(mix(c, fogc, fade), 1.); }` });
const gMat = rimMat();
const guest = new THREE.Group(); scene.add(guest);
const gu = {};
{ const hips = new THREE.Group(); guest.add(hips); gu.hips = hips;
  const torso = new THREE.Group(); hips.add(torso); gu.torso = torso;
  // one smooth pear body flowing from the hips through round shoulders into a short neck (no seams for the rim light to catch)
  { const prof = [[0, -.04], [.3, -.02], [.46, .14], [.55, .42], [.56, .66], [.53, .88], [.46, 1.04], [.32, 1.16], [.2, 1.26], [.17, 1.36], [0, 1.42]];
    const pts = new THREE.SplineCurve(prof.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(48); pts[0].x = 0; pts[pts.length - 1].x = 0;
    mesh(new THREE.LatheGeometry(pts, 48), gMat, V(0, 0, 0), torso).scale.set(1.02, 1, .84); }
  const head = new THREE.Group(); head.position.set(0, 1.32, .06); torso.add(head); gu.head = head;
  mesh(new THREE.SphereGeometry(.31, 28, 20), gMat, V(0, 0, 0), head).scale.set(1, .95, .95);
  // long horns: chains of spheres that taper as they curve up and back
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(V(s * (.2 + .34 * Math.sin(k * 1.5)), .16 + .6 * Math.sin(k * 1.3), -.04 - .34 * k * k)); }
    mesh(taperTube(new THREE.CatmullRomCurve3(pts), .085, .008), gMat, V(0, 0, 0), head); }
  gu.eyeMat = new THREE.MeshBasicMaterial({ color: '#7fe8ff' });
  gu.eyes = []; for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(.055, 16, 10), gu.eyeMat, V(s * .11, .03, .27), head, false); e.scale.set(1.15, .4, .4); e.rotation.z = -s * .18; gu.eyes.push(e); }
  gu.eyeGlow = []; for (const s of [-1, 1]) { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#7fe8ff', transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); g.position.set(s * .11, .03, .3); g.scale.set(.22, .14, 1); head.add(g); gu.eyeGlow.push(g); }
  gu.arms = []; for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .44, .98, 0); torso.add(sh);
    mesh(new THREE.CapsuleGeometry(.15, .45, 8, 16), gMat, V(0, -.35, 0), sh).scale.set(1.15, 1, 1.1); const hand = mesh(new THREE.SphereGeometry(.16, 18, 12), gMat, V(0, -.68, 0), sh); hand.scale.set(1, .85, 1.1);
    gu.arms.push({ sh, arm: sh.children[0], hand, L: .68, s }); }
  mesh(new THREE.SphereGeometry(.24, 20, 14), gMat, V(0, .02, 0), hips).scale.set(1.6, .8, 1.15);   // a soft seat that joins the thighs to the body
  gu.legs = []; for (const s of [-1, 1]) { const hp = new THREE.Group(); hp.position.set(s * .22, 0, 0); hips.add(hp);
    const th = mesh(new THREE.CapsuleGeometry(.19, .34, 8, 16), gMat, V(0, -.27, 0), hp); const kn = new THREE.Group(); kn.position.set(0, -.52, 0); hp.add(kn);
    mesh(new THREE.CapsuleGeometry(.17, .32, 8, 16), gMat, V(0, -.25, 0), kn); mesh(new THREE.SphereGeometry(.17, 14, 10), gMat, V(0, -.5, .08), kn).scale.set(1, .6, 1.5);
    gu.legs.push({ hp, kn }); } }
// the tiny rain cloud over the guest's head
const rain = new THREE.Group(); scene.add(rain);
const cloudMat = std('#7a7f98', { roughness: 1, emissive: '#ffcf5a', emissiveIntensity: 0 });
for (const [x, y, z, r] of [[0, 0, 0, .17], [-.15, -.03, .02, .13], [.15, -.02, -.02, .14], [.06, .08, .05, .12], [-.07, .06, -.06, .12], [0, -.05, .12, .1]]) mesh(new THREE.SphereGeometry(r, 18, 12), cloudMat, V(x, y, z), rain, false);
const DROPS = 46, dropPos = new Float32Array(DROPS * 6);
const drops = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#a9c8ff', transparent: true, opacity: .75 }));
drops.geometry.setAttribute('position', new THREE.BufferAttribute(dropPos, 3)); rain.add(drops); drops.frustumCulled = false;
const sparks = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: '#ffd76a', size: 9 * SSAA, sizeAttenuation: false, map: softTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
sparks.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(180 * 3), 3)); scene.add(sparks); sparks.frustumCulled = false;

// ———————————————————————————— lights ————————————————————————————
scene.add(new THREE.HemisphereLight('#8a7cc8', '#2a1c40', .55));
const moon = new THREE.DirectionalLight('#a9b4ff', 1.1); moon.position.set(-6, 7, -9); scene.add(moon);
const key = new THREE.DirectionalLight('#ffb070', 1.6); key.position.set(3.5, 5, 4.5); key.target.position.set(0, .9, 0); scene.add(key, key.target);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3.5, bottom: -1.5, near: .5, far: 15 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
const potLight = new THREE.PointLight('#ffb34a', 1.2, 1.6, 2); potLight.position.copy(POT).add(V(0, .55, 0)); cart.add(potLight);

// ———————————————————————————— rig helpers ————————————————————————————
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), DOWN = V(0, -1, 0);
function reach(a, target, maxStretch = 1.8) {   // point an arm at a world target; stretch (cartoon) up to maxStretch
  a.sh.updateWorldMatrix(true, false); const P = a.sh.getWorldPosition(_v);
  const d = _w.copy(target).sub(P), L = d.length(); d.normalize();
  const pq = a.sh.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  _q.setFromUnitVectors(DOWN, d.applyQuaternion(pq)); a.sh.quaternion.copy(_q);
  const s = clamp(L / a.L, .55, maxStretch); a.sh.scale.set(1, s, 1); a.hand.scale.set(1, 1 / s, 1);
}
const handPos = a => a.hand.getWorldPosition(new THREE.Vector3());
function lookAt(obj, target, k = 1) { const P = obj.getWorldPosition(new THREE.Vector3()), d = target.clone().sub(P); const yaw = Math.atan2(d.x, d.z), pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z)); return { yaw: yaw * k, pitch: pitch * k }; }

// ———————————————————————————— the timeline ————————————————————————————
const T = { stomp: [10.05, 10.95, 11.85, 12.8], sit: 14.6, push: 24.2, mono: 27.6, nod: 31.2, toss: 34.6, land: 36.9, ladle: 39.4, pop: 43.0, place: 45.6, serve: 50.4, lift: 52.4, slurp: 53.8, warm: 56.8, burst: 59.3, eyes: 63.6, standup: 66.4, gem: 69.3, lamp: 71.9 };
const STAND = { hips: 1.02, thigh: 0, knee: 0 }, SIT = { hips: .6, thigh: -1.35, knee: 1.4 };

function setGuest(t) {
  // path: walks in from the right (x 3.6) along the front, ducks under the awning, sits on the stool; later stands and walks away into the mist
  let pos = V(3.6, 0, 1.25), yaw = -Math.PI / 2, sit = 0, duck = 0, lean = 0, walkPh = 0, fade = 0;
  const STOOL = V(.2, 0, 1.3);
  if (t < 10) pos = V(6, 0, 1.25);
  else if (t < T.sit - .9) { const k = seg(t, 10, T.sit - .9); pos = V(lerp(3.6, STOOL.x + .3, eio(k)), 0, lerp(1.6, STOOL.z, k)); yaw = -Math.PI / 2 + .2 * k; walkPh = k * 4; duck = ss(seg(t, 12.2, 13.4)); }
  else if (t < T.sit + .4) { const k = seg(t, T.sit - .9, T.sit); pos = V(lerp(STOOL.x + .3, STOOL.x, k), 0, STOOL.z); yaw = lerp(-Math.PI / 2 + .2, Math.PI, eio(seg(t, T.sit - .9, T.sit - .2))); sit = ei(k); duck = 1; }
  else if (t < T.standup) { pos = STOOL.clone(); yaw = Math.PI; sit = 1; duck = 1 - .6 * ss(seg(t, T.sit + .5, T.sit + 1.5)); }
  else { const k = seg(t, T.standup, T.standup + .8), w = seg(t, T.standup + .9, 70.2); pos = V(STOOL.x + lerp(0, 2.4, w), 0, STOOL.z + lerp(0, 2.2, eio(w))); yaw = lerp(Math.PI, .6, eio(seg(t, T.standup + .5, T.standup + 1.2))); sit = 1 - eio(k); duck = 1 - eio(seg(t, T.standup + .6, T.standup + 1.4)); walkPh = w * 4; fade = ss(seg(t, 67.8, 70.0)); }
  // a slumped, tired posture from the sit until the bowl
  const slump = t > T.sit && t < T.slurp ? ss(seg(t, T.sit + 1, T.push - .6)) : t >= T.slurp ? 1 - ss(seg(t, T.burst, T.burst + 1.2)) : 0;
  lean = duck * .45 + slump * .35;
  guest.position.copy(pos); guest.rotation.y = yaw; guest.visible = t > 9.9;
  const hipsY = lerp(STAND.hips, SIT.hips, sit) - (walkPh ? Math.abs(Math.sin(walkPh * Math.PI)) * .05 : 0);
  gu.hips.position.y = hipsY; gu.torso.rotation.x = lean;
  for (const [i, L] of gu.legs.entries()) { const sw = walkPh ? Math.sin(walkPh * Math.PI + i * Math.PI) * .45 : 0; L.hp.rotation.x = lerp(STAND.thigh + sw, SIT.thigh, sit); L.kn.rotation.x = lerp(Math.max(0, -sw) * .8, SIT.knee, sit); }
  gu.head.rotation.set(-lean * .4 + slump * .25, 0, 0);
  gMat.uniforms.fade.value = fade;
  // arms: hanging / swinging while walking, on the counter while seated, the bowl lifted for the slurp
  gu.torso.updateWorldMatrix(true, true);
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), side = V(Math.cos(yaw), 0, -Math.sin(yaw));
  for (const a of gu.arms) {
    let tg;
    const sh = a.sh.getWorldPosition(new THREE.Vector3());
    if (sit < .5) tg = sh.clone().add(V(0, -.7, 0)).addScaledVector(fwd, walkPh ? Math.sin(walkPh * Math.PI + (a.s > 0 ? 0 : Math.PI)) * .3 + .1 : .15);
    else tg = V(SERVE.x + a.s * -.32, 1.12, SERVE.z + .12);   // forearms on the counter (side = mirrored by the 180° turn)
    a.tg = tg;
  }
  return { pos, yaw, sit, fwd };
}

const SHOTS = [];
const shot = (t0, t1, name, cam) => SHOTS.push({ t0, t1, name, cam });
const CART_C = V(.1, 1.15, .1);
// 0–10: ECU of the broth → pull back out through the window → the cart on the edge of the floating rock
const PULL = new THREE.CatmullRomCurve3([V(-.58, 1.9, .22), V(-.9, 1.72, -.05), V(-1.32, 1.47, -.16), V(-2.6, 1.6, .2), V(-4.4, 2.0, 2.6), V(-3.6, 2.2, 5.6), V(-1.6, 2.35, 7.4)], false, 'centripetal');
shot(0, 10, 'open', t => { const k = eio(seg(t, 2.6, 9.7)); const p = PULL.getPointAt(Math.min(1, k));
  const look = LV(POT.clone().add(V(0, .34, 0)), CART_C.clone().add(V(.2, .2, 0)), ss(seg(t, 3.6, 8.8)));
  return { pos: p, look, fov: lerp(34, 44, ss(seg(t, 4, 9))), focus: p.distanceTo(look), aper: lerp(6, 3, seg(t, 0, 6)) }; });
shot(10, 22, 'arrive', t => ({ pos: V(-2.9, 1.95, 4.9), look: V(.35, 1.4, .7), fov: 46, focus: 5.2, aper: 3 }));
shot(22, 27.2, 'pay', t => ({ pos: V(-.45, 1.5, -.28 + .04 * seg(t, 22, 27)), look: V(.22, 1.2, .5), fov: 46, focus: 1.0, aper: 5 }));
shot(27.2, 31, 'inspect', t => ({ pos: V(.06, 1.32, .4), look: V(.05, 1.3, -.5), fov: 40, focus: .9, aper: 8 }));
shot(31, 34, 'nod', t => ({ pos: V(2.5, 1.75, 1.9), look: V(.2, 1.75, .25), fov: 42, focus: 2.8, aper: 3 }));
shot(34, 36.6, 'toss', t => ({ pos: V(-.85, 1.72, .7), look: V(.02, 1.78, -.45), fov: 52, focus: 1.45, aper: 3 }));
shot(36.6, 39.2, 'land', t => ({ pos: PREP.clone().add(V(.25, .42, .5)), look: PREP.clone().add(V(0, .05, 0)), fov: 36, focus: .7, aper: 10 }));
shot(39.2, 42.2, 'ladle', t => ({ pos: V(-.4, 1.55, .5), look: V(-.42, 1.15, -.14), fov: 40, focus: .75, aper: 10 }));
shot(42.2, 44.8, 'jar', t => ({ pos: V(.12, 1.25, .38), look: V(.1, 1.2, -.12), fov: 36, focus: .5, aper: 12 }));
shot(44.8, 47.4, 'seed', t => ({ pos: PREP.clone().add(V(.15, .36, .38)), look: PREP.clone().add(V(0, .06, 0)), fov: 34, focus: .55, aper: 12 }));
shot(47.4, 50.2, 'glow', t => ({ pos: V(.2, 1.2, .75 - .1 * seg(t, 47.4, 50)), look: V(.0, 1.3, -.4), fov: 40, focus: 1.15, aper: 8 }));
shot(50.2, 63.2, 'ots', t => { const k = ss(seg(t, 56, 59)); return { pos: V(-.5, 1.65 + .1 * k, -.7), look: V(.25, 1.95 + .35 * k, 1.1), fov: 50 + 4 * k, focus: 1.95, aper: 5 }; });
shot(63.2, 66.2, 'eyes', t => ({ pos: V(.2, 1.85, -.5 + .12 * seg(t, 63.2, 66)), look: V(.2, 1.95, 1.1), fov: 40, focus: 1.6, aper: 5 }));
shot(66.2, 69.2, 'leave', t => ({ pos: V(-2.9, 1.95, 4.9), look: V(.9, 1.4, 1.6), fov: 46, focus: 5, aper: 3 }));
shot(69.2, 71.8, 'gem', t => ({ pos: V(.3, 1.62, 1.55), look: V(.14, 1.25, .1), fov: 32, focus: 1.5, aper: 5 }));
shot(71.8, 75.1, 'lamp', t => { const k = eio(seg(t, 72.6, 75)); return { pos: LV(V(.2, 1.75, 2.1), V(-1.2, 2.9, 8.2), k), look: LV(V(.75, 1.75, .5), V(-.2, 1.0, 0), k), fov: lerp(38, 44, k), focus: lerp(1.7, 8, k), aper: lerp(6, 2, k) }; });
function LV(a, b, u) { return a.clone().lerp(b, u); }
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

// camera shake after each heavy step and the sit-down
function shake(t) { let a = 0; for (const s of [...T.stomp, T.sit]) { const k = t - s; if (k >= 0 && k < .7) a += (s === T.stomp[0] ? 1 : .55) * Math.exp(-k * 7); } return a; }

function setScene(t) {
  const S = shotAt(t);
  // —— broth, bubbles, specks, steam ——
  brothMat.uniforms.t.value = t;
  for (const b of bubbles) { const k = ((t * b.sp + b.ph) % 1); b.m.position.set(POT.x + Math.cos(b.a) * b.r, POT.y + .34, POT.z + Math.sin(b.a) * b.r); const s = b.s * (k < .85 ? ss(k / .85) : 1 + (k - .85) * 6) * (k > .95 ? 0 : 1); b.m.scale.set(s, s * .7, s); }
  { const p = specks.geometry.attributes.position; for (let i = 0; i < 40; i++) { const a = hash(i) * 6.28 + t * (.3 + hash(i + 5) * .4), r = Math.sqrt(hash(i + 9)) * .17; p.setXYZ(i, POT.x + Math.cos(a) * r, POT.y + .345 + (hash(i + 2) * .01) + Math.max(0, Math.sin(t * 2 + i)) * .03, POT.z + Math.sin(a) * r); } p.needsUpdate = true; }
  for (const s of steamPuffs) { const k = (t * .35 + s.ph) % 1; s.s.position.set(POT.x + Math.sin(k * 5 + s.ph * 9) * .06, POT.y + .4 + k * .7, POT.z + Math.cos(k * 4 + s.ph * 7) * .05); s.s.scale.setScalar(.12 + k * .35); s.s.material.opacity = .22 * Math.sin(k * Math.PI); }
  flame.scale.y = 1 + .2 * Math.sin(t * 23) * Math.sin(t * 7.3);
  for (const c of clouds) { c.sp.position.x = c.x + Math.sin(t * c.sp0 + c.ph) * 1.5; }
  // —— the heavy steps: the chopsticks and bowls jump ——
  let jolt = 0; for (const s of [...T.stomp, T.sit]) { const k = t - s; if (k >= 0 && k < .5) jolt = Math.max(jolt, Math.sin(k / .5 * Math.PI) * Math.exp(-k * 4) * (s === T.stomp[0] ? 1 : .6)); }
  looseSticks.position.y = 1.056 + jolt * .07; looseSticks.rotation.z = jolt * .5; looseSticks.rotation.y = jolt * .4;
  for (const [i, s] of sticksInCup.entries()) s.position.y = 1.2 + jolt * .05 * hash(i + 1);
  cart.position.y = -jolt * .012;
  // —— wind chime ——
  const wind = .25 + .75 * ss(seg(t, 72.2, 73.2)) * (1 - ss(seg(t, 74.5, 75)));
  chimeBars.forEach((b, k) => { b.rotation.x = Math.sin(t * (2.2 + k * .3) + k) * .12 * wind; b.rotation.z = Math.cos(t * (1.9 + k * .4) + k * 2) * .12 * wind; });
  lantern.rotation.z = Math.sin(t * .9) * .04; tassel.rotation.z = Math.sin(t * 1.7) * .15;
  sign.rotation.x = Math.sin(t * .8 + 1) * .02;

  // —— the guest ——
  const G = setGuest(t);
  // —— the cook ——
  cook.position.copy(COOK0); cook.rotation.y = 0;
  let sq = 1, bodyTilt = 0, headYaw = 0, headPitch = 0, headRoll = 0, mono = 0, mouth = 'smile', brow = 0;
  const tg = [null, null];   // left, right hand targets (world)
  const restL = V(-.3, 1.05, -.25), restR = V(.38, 1.05, -.25);
  // wiping a bowl (0–16)
  let held = null;
  if (t < 16.2) { const w = t < 10 ? Math.sin(t * 9) : 0; tg[0] = V(-.12, 1.2, -.2); tg[1] = V(-.02 + Math.cos(t * 9) * .05, 1.27 + w * .02, -.17 + Math.sin(t * 9) * .03); held = 'wipe'; headPitch = .35; headYaw = -.1; }
  if (t > T.stomp[0] && t < 16.2) { const k = t - T.stomp[0]; sq = 1 + .18 * Math.exp(-k * 6) * Math.sin(k * 26); mouth = 'O'; brow = .02; const L = lookAt(ck.head, gu.head.getWorldPosition(new THREE.Vector3())); headYaw = L.yaw * .8; headPitch = clamp(L.pitch, -.6, .3); }
  if (t > 15.4 && t < 16.2) { tg[0] = LV(V(-.12, 1.2, -.2), V(-.2, 1.08, -.2), seg(t, 15.4, 16)); }
  // the stone (22–34)
  if (t >= 16.2 && t < T.toss) { tg[0] = restL; tg[1] = restR; mouth = 'smile';
    const L = lookAt(ck.head, stone.getWorldPosition(new THREE.Vector3())); headYaw = L.yaw * .7; headPitch = clamp(L.pitch, -.5, .4);
    if (t > T.mono - .6) { const k = ss(seg(t, T.mono - .6, T.mono)); tg[1] = LV(restR, ck.head.getWorldPosition(new THREE.Vector3()).add(V(.12, .12, .2)), Math.sin(k * Math.PI) * (t < T.mono ? 1 : 0)); mono = ss(seg(t, T.mono - .3, T.mono + .1)); }
    if (t > T.mono) { headRoll = .22 * ss(seg(t, T.mono, T.mono + .5)); bodyTilt = .18 * ss(seg(t, T.mono, T.mono + .6)); brow = -.01; mouth = 'O'; }
    if (t > 29.6) { const L2 = lookAt(ck.head, rain.getWorldPosition(new THREE.Vector3())); const k = ss(seg(t, 29.6, 30.2)); headYaw = lerp(headYaw, L2.yaw * .7, k); headPitch = lerp(headPitch, clamp(L2.pitch, -.7, .3), k); headRoll *= 1 - k; bodyTilt *= 1 - k; mouth = 'smile'; brow = .015; }
    if (t > T.nod) { headPitch += Math.max(0, Math.sin((t - T.nod) * 9)) * .3 * (t < T.nod + 1.4 ? 1 : 0); mono = 1 - ss(seg(t, 33.2, 33.8)); } }
  // cooking (34–50): toss, catch, ladle, jar, seed, the glow
  if (t >= T.toss && t < T.serve) { mouth = 'smile'; brow = -.005;
    const L = lookAt(ck.head, noodles.getWorldPosition(new THREE.Vector3())); headYaw = L.yaw * .6; headPitch = clamp(L.pitch, -.6, .5);
    if (t < T.land) { const k = seg(t, T.toss, T.toss + .35); sq = k < 1 ? 1 - .2 * Math.sin(k * Math.PI) : 1 + .15 * Math.exp(-(t - T.toss - .35) * 5) * Math.sin((t - T.toss - .35) * 20); const up = ss(seg(t, T.toss + .2, T.toss + .45)); tg[0] = V(-.12, lerp(1.15, 1.75, up), -.2); tg[1] = V(.08, lerp(1.15, 1.75, up), -.2); }
    else if (t < T.ladle) { tg[0] = PREP.clone().add(V(-.14, .1, 0)); tg[1] = PREP.clone().add(V(.14, .1, 0)); }
    else if (t < T.pop - .7) { tg[0] = restL; tg[1] = ladle.position.clone().add(V(0, .26, -.08)); }
    else if (t < T.place - .4) { tg[0] = jar.position.clone().add(V(0, .06, -.05)); tg[1] = jar.position.clone().add(V(.02, .14 + (t > T.pop - .1 ? .1 : 0), 0)); }
    else { tg[0] = restL; tg[1] = tongs.position.clone().add(V(0, .24, 0)); }
    if (t > 47.4) { headYaw = 0; headPitch = .35; mouth = 'smile'; } }
  // serving and watching (50–69)
  if (t >= T.serve && t < T.gem) { const push = ss(seg(t, T.serve, T.serve + .9)) * (1 - ss(seg(t, T.lift, T.lift + .5)));
    tg[0] = LV(restL, bowl.position.clone().add(V(-.15, .06, -.05)), push); tg[1] = LV(restR, bowl.position.clone().add(V(.15, .06, -.05)), push);
    const L = lookAt(ck.head, gu.head.getWorldPosition(new THREE.Vector3())); headYaw = L.yaw * .7; headPitch = clamp(L.pitch, -.7, .3); mouth = t > T.burst ? 'big' : 'smile';
    if (t > T.burst && t < T.burst + 1.5) sq = 1 + .1 * Math.exp(-(t - T.burst) * 4) * Math.sin((t - T.burst) * 18);
    if (t > T.standup + .8) { const L2 = lookAt(ck.head, guest.position.clone().add(V(0, 2, 0))); headYaw = L2.yaw * .6; headPitch = -.1; tg[1] = t < 68.6 ? V(.45, 1.5 + Math.sin(t * 10) * .06, .0) : restR; } }
  // the gem into the lantern (69–75)
  if (t >= T.gem) { mouth = 'big';
    const walk = ss(seg(t, 70.2, 71.4)); cook.position.x = lerp(COOK0.x, .62, walk); cook.position.y = COOK0.y + Math.abs(Math.sin(walk * Math.PI * 3)) * .03;
    const L = lookAt(ck.head, t < 71 ? gem.getWorldPosition(new THREE.Vector3()) : LANT.clone()); headYaw = L.yaw * .7; headPitch = clamp(L.pitch, -.6, .5);
    tg[0] = restL.clone().add(V(walk * .5, 0, 0)); tg[1] = t < T.lamp - .9 ? gem.position.clone() : t < T.lamp - .5 ? V(.75, 1.6, -.1) : restR.clone().add(V(.45, .05, 0));
    if (t > T.lamp - .9) sq = 1 + .06 * Math.sin(seg(t, T.lamp - .9, T.lamp) * Math.PI);
    if (t > T.lamp + .3) { tg[1] = restR.clone().add(V(.45, 0, 0)); headPitch = -.25; } }
  cook.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  ck.body.rotation.z = -bodyTilt; ck.head.rotation.set(headPitch, headYaw, headRoll, 'YXZ');
  ck.mouthSmile.visible = mouth === 'smile'; ck.mouthBig.visible = mouth === 'big'; ck.mouthO.visible = mouth === 'O';
  ck.brows.forEach((b, i) => { b.position.y = .085 + brow; b.rotation.z = (i ? -1 : 1) * brow * 6; });
  ck.eyes.forEach(e => e.scale.y = ((t + .3) % 3.7) < .1 ? .15 : 1);
  // monocle: from the hat band (tilted up) down onto the right eye
  ck.mono.position.lerpVectors(V(.1, .16, .17), V(.075, .03, .225), mono); ck.mono.rotation.set(lerp(-1.1, 0, mono), 0, 0);
  ck.mono.updateMatrixWorld();
  { const p = ck.chain.geometry.attributes.position; p.setXYZ(0, ck.mono.position.x + .03, ck.mono.position.y - .04, ck.mono.position.z); p.setXYZ(1, .2, -.15, .12); p.setXYZ(2, .22, -.34, .08); p.needsUpdate = true; }
  ck.headMat.emissive.set('#ffb050'); ck.headMat.emissiveIntensity = t > 46.6 && t < 50.4 ? .35 * ss(seg(t, 46.6, 47.6)) : 0;
  cook.updateMatrixWorld(true);
  ck.arms.forEach((a, i) => { const target = tg[i] ?? (i ? restR : restL); reach(a, target, 2.2); });
  cook.updateMatrixWorld(true);
  const HL = handPos(ck.arms[0]), HR = handPos(ck.arms[1]);

  // —— guest arms (after the cook so the bowl can follow) ——
  let gBowl = null;
  for (const a of gu.arms) { let target = a.tg;
    if (t > T.push - 1 && t < T.push + 1.5 && a.s < 0) target = LV(V(SERVE.x + .15, 1.12, SERVE.z + .15), stone.position.clone().add(V(0, .05, .05)), Math.sin(seg(t, T.push - 1, T.push + 1.5) * Math.PI));
    if (t > T.lift && t < T.standup) { const up = ss(seg(t, T.lift, T.lift + .8)) * (1 - ss(seg(t, 65.6, 66.3))), hd = gu.head.getWorldPosition(new THREE.Vector3());
      const at = LV(SERVE.clone().add(V(a.s * -.16, .08, 0)), hd.clone().add(V(a.s * -.15, -.28, -.2)), up); target = at; gBowl = up; }
    reach(a, target, 1.6); }
  guest.updateMatrixWorld(true);
  // —— props ——
  // the bowl: wiped in the cook's hands → set down → (cooking at PREP) → pushed to SERVE → lifted by the guest → set down
  cloth.visible = t < 16.2; if (cloth.visible) { cloth.position.copy(HR).add(V(0, -.02, .02)); cloth.rotation.y = t * 3; }
  if (t < 16.2) { bowl.position.copy(HL).add(V(.06, -.02, .03)); bowl.rotation.set(.25 + Math.sin(t * 2) * .05, 0, -.3); }
  else if (t < T.serve) { bowl.position.copy(PREP); bowl.rotation.set(0, 0, 0); if (t < T.toss) bowl.position.set(-.25, 1.05, -.3); }
  else if (t < T.lift) { bowl.position.copy(LV(PREP, SERVE, ss(seg(t, T.serve + .1, T.serve + 1)))); bowl.rotation.set(0, 0, 0); }
  else if (t < T.standup) { const hd = gu.head.getWorldPosition(new THREE.Vector3()), up = gBowl ?? 0;
    bowl.position.copy(LV(SERVE, hd.clone().add(V(0, -.3, -.22)), up)); bowl.rotation.set(-up * (t > T.slurp ? .9 + .2 * Math.sin(t * 3) : .3), 0, 0); }
  else { bowl.position.copy(t < 69.2 ? SERVE : V(.66, 1.05, .45)); bowl.rotation.set(0, 0, 0); }
  bowlBroth.visible = t > T.ladle + .7 && t < 70; bowlBroth.scale.setScalar(t < T.slurp ? 1 : lerp(1, .6, seg(t, T.slurp, 56.3))); bowlBroth.position.y = .02 + (t < T.ladle + 1.6 ? .03 * seg(t, T.ladle + .7, T.ladle + 1.6) : .03) - (t > T.slurp ? .03 * seg(t, T.slurp, 56.3) : 0);
  // noodles: in the cook's hands → tossed in a glowing arc → into the bowl; eaten during the slurp
  noodles.visible = t >= T.toss - .2 && t < 56.3;
  if (t < T.toss + .45) noodles.position.copy(HL.clone().lerp(HR, .5)).add(V(0, .03, 0));
  else if (t < T.land) { const k = seg(t, T.toss + .45, T.land), a = HL.clone().lerp(HR, .5), b = PREP.clone().add(V(0, .06, 0)); noodles.position.copy(LV(a, b, k)).add(V(0, Math.sin(k * Math.PI) * .75, 0)); noodles.rotation.set(k * 6, k * 3, 0); const st = 1 + .5 * Math.sin(k * Math.PI); noodles.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); }
  else { noodles.position.copy(bowl.position).add(V(0, .06, 0)); noodles.rotation.set(bowl.rotation.x, 0, 0); const s = t < T.land + .25 ? 1 + .3 * Math.sin(seg(t, T.land, T.land + .25) * Math.PI) : 1; noodles.scale.set(s, 1 / s, s); if (t > T.slurp) noodles.scale.multiplyScalar(1 - .85 * seg(t, T.slurp, 56.3)); }
  noodleMat.emissiveIntensity = .9 + .5 * Math.sin(t * 3);
  toppings.visible = t > T.place - .6 && t < 56.3; toppings.position.copy(bowl.position).add(V(0, .09, 0)); toppings.rotation.x = bowl.rotation.x;
  if (t > T.slurp) toppings.scale.setScalar(1 - seg(t, T.slurp, 56.3)); else toppings.scale.setScalar(1);
  // the ladle: rests in the pot → scoops → pours into the bowl (39.2–42.2)
  ladle.visible = t > 34 && t < 50;
  if (t < T.ladle) { ladle.position.copy(POT).add(V(.05, .36, 0)); ladle.rotation.set(0, 0, .3); ladleFill.visible = false; }
  else { const a = POT.clone().add(V(0, .33, 0)), b = PREP.clone().add(V(-.05, .3, 0)); const k1 = ss(seg(t, T.ladle, T.ladle + .45)), k2 = ss(seg(t, T.ladle + .5, T.ladle + 1.1)), pour = ss(seg(t, T.ladle + 1.1, T.ladle + 1.4)) * (1 - ss(seg(t, T.ladle + 2.2, T.ladle + 2.5)));
    ladle.position.copy(LV(LV(POT.clone().add(V(.05, .36, 0)), a, k1), b, k2)).add(V(0, Math.sin(k2 * Math.PI) * .12, 0)); ladle.rotation.set(0, 0, -pour * 1.3); ladleFill.visible = k1 > .5 && pour < .7; }
  stream.visible = t > T.ladle + 1.15 && t < T.ladle + 2.3;
  if (stream.visible) { const top = ladle.position.clone().add(V(.045, -.01, 0)), bot = PREP.clone().add(V(0, .05, 0)); stream.position.copy(top.clone().lerp(bot, .5)); stream.scale.set(1, top.y - bot.y, 1); stream.rotation.z = Math.atan2(top.x - bot.x, top.y - bot.y) * -1; }
  // the jar of sun seeds: lid pops (43.0); a seed is lifted with chopsticks and set on top (45.6)
  jar.visible = t > 34 && t < 50; jar.position.set(.18, 1.05, -.2);
  if (t > T.pop) { const k = t - T.pop; jarLid.position.set(.09 * Math.min(k, .6) / .6, .135 + Math.max(0, 2.4 * k - 6 * k * k) + (k > .4 ? -.135 + .015 : 0) * ss(seg(k, .4, .6)), 0); jarLid.rotation.z = Math.min(k, .5) * 6; if (k > .6) jarLid.position.set(.12, .015, .03); }
  else jarLid.position.set(0, .135, 0), jarLid.rotation.z = 0;
  jarGlow.material.opacity = t > T.pop ? .9 : .4;
  seed.visible = t > T.pop + .4 && t < 56.3; tongs.visible = t > T.pop + .4 && t < T.place + .8;
  { const a = jar.position.clone().add(V(0, .1, 0)), up = jar.position.clone().add(V(-.1, .32, 0)), b = PREP.clone().add(V(0, .13, 0));
    const k1 = ss(seg(t, T.pop + .6, 44.7)), k2 = ss(seg(t, 44.7, T.place));
    const p = t < T.place ? LV(LV(a, up, k1), b, k2) : bowl.position.clone().add(V(0, .12, 0)); seed.position.copy(p); tongs.position.copy(p).add(V(0, .005, 0)); tongs.rotation.z = -.3;
    seedGlow.material.opacity = .9 + .2 * Math.sin(t * 7); seedGlow.scale.setScalar(t > T.place ? .2 + .15 * ss(seg(t, T.place, T.place + 1)) : .2); }
  // rising light motes from the finished bowl
  { const p = motes.geometry.attributes.position, on = t > T.place + .3 && t < 63; motes.visible = on;
    for (let i = 0; i < 60; i++) { const k = ((t - T.place) * (.25 + hash(i) * .2) + hash(i + 3)) % 1; p.setXYZ(i, bowl.position.x + Math.sin(k * 6 + i) * .07 * (1 + k), bowl.position.y + .1 + k * .7, bowl.position.z + Math.cos(k * 5 + i * 2) * .06 * (1 + k)); }
    p.needsUpdate = true; motes.material.opacity = on ? .85 * ss(seg(t, T.place + .3, T.place + 1.2)) * (1 - ss(seg(t, 56, 58))) : 0; }
  // the stone: in the guest's hand → pushed to the middle → (later) turns into the gem
  const ST0 = V(.32, 1.1, .62), ST1 = V(.1, 1.1, .2);
  stone.visible = t > 22 && t < 68.6 && !(t > T.toss && t < T.serve);
  { const k = ss(seg(t, T.push - .2, T.push + 1.1)); stone.position.copy(LV(ST0, ST1, k)); stone.rotation.set(k * 4, k * 1.5, 0); }
  stoneMat.emissiveIntensity = .08 + .25 * Math.max(0, Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1)) * (t < 66.4 ? 1 : 1 + 6 * seg(t, 66.4, 68.4));
  const gk = ss(seg(t, 67.4, 68.6)); gem.visible = t > 67.4;
  stone.scale.setScalar(1 - gk * .9);
  if (t < T.lamp - .9) { gem.position.copy(t < 70.4 ? ST1.clone().add(V(0, .02 * gk, 0)) : HR.clone().add(V(0, .02, .03))); gem.rotation.y = t * 1.2; gem.scale.setScalar(gk * (1 + .15 * Math.sin(t * 5))); }
  else if (t < T.lamp) { const k = seg(t, T.lamp - .9, T.lamp), a0 = V(.72, 1.25, -.2); gem.position.copy(LV(a0, LANT.clone().add(V(0, -.15, 0)), k)).add(V(0, Math.sin(k * Math.PI) * .45, 0)); gem.rotation.y = t * 8; gem.scale.setScalar(1); }
  else { gem.position.copy(LANT); gem.scale.setScalar(1 - ss(seg(t, T.lamp, T.lamp + .35))); }
  gemLight.intensity = gem.visible ? .6 * gk : 0;
  // the lantern blazes once the gem is inside; the sign lights up
  const blaze = ss(seg(t, T.lamp + .1, T.lamp + .8)), flick = 1 + .05 * Math.sin(t * 13) * Math.sin(t * 4.1);
  lanternMat.emissiveIntensity = (1.1 + 3.4 * blaze + .9 * Math.exp(-Math.max(0, t - T.lamp - .3) * 3) * (t > T.lamp + .1 ? 1 : 0)) * flick;
  lampLight.intensity = (3.2 + 7 * blaze) * flick; lanternGlow.scale.setScalar(1.1 + 1.6 * blaze); lanternGlow.material.opacity = .5 + .35 * blaze;
  signMat.emissiveIntensity = 1.3 * blaze;
  // the rain cloud: grey and raining → warm, swelling → bursts into golden dust (59.3)
  const hd = gu.head.getWorldPosition(new THREE.Vector3());
  rain.position.copy(hd).add(V(0, .72 + .03 * Math.sin(t * 1.3), 0)); rain.visible = t > 9 && t < T.burst;
  const warm = ss(seg(t, T.warm, T.warm + 1.2)), swell = ss(seg(t, 57.8, T.burst));
  cloudMat.color.set('#7a7f98').lerp(new THREE.Color('#ffd98a'), warm); cloudMat.emissiveIntensity = warm * .8 + swell * .8;
  rain.scale.setScalar((1 + .9 * swell + .06 * Math.sin(t * 11) * swell) * (t > T.burst - .12 ? 1.15 : 1));
  { const raining = t < T.warm + .4; drops.visible = raining;
    for (let i = 0; i < DROPS; i++) { const a = hash(i) * 6.28, r = Math.sqrt(hash(i + 50)) * .2, k = ((t * 2.2 + hash(i + 100)) % 1);
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = -.08 - k * .62; dropPos.set([x, y, z, x, y - .06, z], i * 6); }
    drops.geometry.attributes.position.needsUpdate = true; }
  { const p = sparks.geometry.attributes.position, k = t - T.burst; sparks.visible = k > 0 && k < 3.2;
    for (let i = 0; i < 180; i++) { const th = hash(i) * 6.28, ph = Math.acos(2 * hash(i + 7) - 1), sp = .4 + hash(i + 13) * .9, d = sp * (1 - Math.exp(-k * 3)) / 1;
      p.setXYZ(i, rain.position.x + Math.sin(ph) * Math.cos(th) * d, rain.position.y + Math.cos(ph) * d * .7 + k * .12 - k * k * .02, rain.position.z + Math.sin(ph) * Math.sin(th) * d); }
    p.needsUpdate = true; sparks.material.opacity = k > 0 ? (1 - ss(seg(k, 1.2, 3.2))) : 0; sparks.material.size = (9 + 6 * Math.exp(-k * 3)) * SSAA; }
  // the guest's eyes: cold cyan → warm amber after the bowl; wider, softer
  const ew = ss(seg(t, T.eyes, T.eyes + 1.3)); const ec = new THREE.Color('#7fe8ff').lerp(new THREE.Color('#ffc46a'), ew);
  gu.eyeMat.color.copy(ec); gu.eyeGlow.forEach(g => { g.material.color.copy(ec); g.material.opacity = (.5 + .3 * ew) * (1 - gMat.uniforms.fade.value); });
  gu.eyes.forEach((e, i) => { e.scale.set(1.15, lerp(.4, .95, ew) * (((t + 1.1) % 4.1) < .12 && t > 20 ? .2 : 1), .4); e.rotation.z = (i ? -1 : 1) * -.18 * (1 - ew); });
  // the tired slow blink and a sigh-heave while slumped
  if (t > T.sit && t < T.lift) gu.torso.position.y = Math.sin(t * 1.4) * .015;
  return S;
}

// ———————————————————————————— render ————————————————————————————
let texts = [];
function render(t) {
  const S = setScene(t), u = t - S.t0;
  const C = S.cam(t);
  if (QS.has('cam')) { const c = QS.get('cam').split(',').map(Number); C.pos = V(c[0], c[1], c[2]); C.look = V(c[3], c[4], c[5]); C.fov = c[6] ?? 40; C.aper = 0; }
  const dist = C.pos.distanceTo(C.look), dr = .004 * dist, sh = shake(t) * .045;
  C.pos = C.pos.clone().add(V(Math.sin(t * .7) * dr + (hash(Math.floor(t * 24)) - .5) * sh, Math.sin(t * .93 + 1) * dr * .7 + (hash(Math.floor(t * 24) + 7) - .5) * sh, 0));
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  post.dof.focus = C.focus; post.dof.aper = C.aper; post.dof.maxCoc = 14;
  post.vig.uniforms.fade.value = clamp(t / .6) * clamp((75 - t) / 1.0);
  post.composer.render();
  og.clearRect(0, 0, W, H); texts = [];
}
const EV = [
  { t: 0, type: 'boil', dur: 10.5 }, { t: 0, type: 'wind', dur: 75 },
  ...T.stomp.map((s, i) => ({ t: s, type: 'stomp', v: i ? .6 : 1 })), { t: T.sit, type: 'sit' }, { t: T.sit + .25, type: 'creak' }, { t: 9.6, type: 'rain', dur: T.warm + .5 - 9.6 },
  { t: T.push - .1, type: 'roll', dur: 1.2 }, { t: T.mono, type: 'tick' },
  { t: T.toss + .35, type: 'whoosh' }, { t: T.land, type: 'plop' }, { t: T.land, type: 'sizzle', dur: 1.6 }, { t: T.ladle + .2, type: 'clang' }, { t: T.ladle + 1.15, type: 'pour', dur: 1.1 }, { t: T.pop, type: 'pop' }, { t: T.place, type: 'tink' },
  { t: T.serve + .1, type: 'slide' }, { t: T.slurp, type: 'slurp', dur: 2.4 }, { t: T.warm, type: 'shimmer', dur: 2.5 }, { t: T.burst, type: 'chime' },
  { t: T.standup + .1, type: 'creak' }, { t: T.standup + .9, type: 'steps', dur: 2.6 }, { t: 67.6, type: 'tink' }, { t: T.lamp + .1, type: 'whoomp' }, { t: 72.3, type: 'windchime', dur: 3 },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, SHOTS, T };
render(0);
window.READY = true;
