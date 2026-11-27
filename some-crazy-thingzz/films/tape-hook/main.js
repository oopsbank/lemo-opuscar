// "Glue Time" — why does a tape measure hook wobble? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows. Skeleton: myth vs real (a bet). Opening: (c) macro of the odd detail.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildWorkshop } from './workshop.js';
import { Card } from './card.js';
import { HAT, HAIR, BACK } from './cast.js';
import { drawCaps } from './caps.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 92px Baloo2');
const STORY = await (await fetch('story.json')).json();

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), og = ov.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, .005, 200);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .18; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .32; post.vig.uniforms.warm.value = .5; post.vig.uniforms.contrast.value = .27; post.vig.uniforms.sat.value = 1.18;

// a sunny workshop: the sun through the window on the right, a warm room, a cool rim from behind
const L = makeLight(scene, renderer, { sun: '#ffe2b8', sunI: 3.0, sky: '#f0e2cc', ground: '#8a7456', hemiI: 1.25, envI: .5, fog: '#efe2cc' });
const bounce = new THREE.DirectionalLight('#ffe8cc', .5); bounce.position.set(-2, 2, 3); scene.add(bounce);
const rim = new THREE.DirectionalLight('#cfe0ff', 1.1); rim.position.set(-.6, 2.2, -3); scene.add(rim);
const K = buildWorkshop(scene), DY = K.DY;
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(vec3(.45, .33, .24), vec3(.95, .88, .76), smoothstep(-.3, .35, d.y));
    c += vec3(2., 1.9, 1.7) * smoothstep(.8, .95, dot(d, normalize(vec3(1., .4, .6)))); gl_FragColor = vec4(c, 1.); }` })));
L.bakeEnv = () => { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, .02).texture; scene.environmentIntensity = .55; };

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); T.line([[-14, -102], [-14, -90]], lw * .9, '#f2c335'); } });   // a carpenter's pencil in the pocket
const nana = new Card(scene, { height: 1.55, shirt: '#7d5aa8', pants: '#5a4378', shoes: '#4a2f2a', cheeks: '#f0a0a0', glasses: true, hair: HAIR.bun('#b8b2ab'), back: BACK.bun('#b8b2ab'),
  detail: (T, lw) => { T.shape([[-15, -100], [15, -100], [21, -50], [0, -46], [-21, -50]], { fill: '#f6ecd8', lw: lw * .6, shade: () => T.fillOnly([[6, -100], [15, -100], [21, -50], [8, -48]], '#e3d5bb') }); T.shape([[-8, -74], [8, -74], [8, -62], [-8, -62]], { fill: '#f6ecd8', lw: lw * .5 }); } });
const cards = [gus, nana];
const SUN_TINT = new THREE.Color(1.05, 1.02, .95), SHADE_TINT = new THREE.Color(.95, .92, .9);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 20; ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && h.object.visible && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);

// —— acting helpers ——
const on12 = t => Math.floor(t * 12 + 1e-6) / 12;
const VOX = await (await fetch('voices.json')).json();
let TNEW = 0;
function talk(who) {
  const t = on12(TNEW);
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;
// a point in a card's drawing (cm, y up negative) → world, for putting a 3D prop in a drawn hand
function handWorld(card, h, fwd = .05) {
  const right = V(camera.position.x - card.pos.x, 0, camera.position.z - card.pos.z).normalize(); const r = V(right.z, 0, -right.x);
  return card.pos.clone().addScaledVector(r, h[0] / 100 * card.scale).add(V(0, -h[1] / 100 * card.scale, 0)).addScaledVector(right, fwd);
}

// —— shots ——
const SUN = V(.7, .6, .45).normalize();
const G0 = V(-.25, 0, -.62), N0 = V(.32, 0, -.62);
const HOLD = [30, -128];   // Gus's right hand holding the tape up beside his face (frame 0 and the loop)
const RATTLE = t => Math.sign(Math.sin(t * 34)) * .9;   // the hook clacking in and out
const OPEN = { pos: V(-.06, 1.37, .5), look: V(-.12, 1.33, -.62), fov: 40, focus: .62, aper: 10 };   // frame 0 and the last shot share this
const BENCH = V(-.25, DY, .06);
const SHOTS = [
  { t0: 0, t1: 1.4, name: 'macro0',   // (c) the hook clacking in Gus's hand, glue closing in, his face right behind
    cam: u => ({ ...OPEN, pos: OPEN.pos.clone().add(V(0, 0, -.06 * ss(u / 1.4))) }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const g = ei(seg(tc, .2, 1.3));
      gus.pose = { armsFront: true, rh: HOLD, bendR: -12, lh: [lerp(-46, -18, g), lerp(-118, -128, g)], bendL: 12, lprop: { kind: 'glue', ang: lerp(-.2, .9, g) }, brows: 'angry', mouth: 'grin', open: .3, look: [1, .5], turn: .15,
        sq: 1 + .06 * Math.exp(-tc * 7) * Math.cos(tc * 28), ...(talk('gus') ?? {}) };
      tapeInHand(K.tapeG, HOLD, .07, RATTLE(tc), false); } },
  { t0: 1.4, t1: 3.1, name: 'glue',   // "Easy! It's broken. Glue time!" — SQUIRT on the hook; Nana behind, skeptical
    cam: u => ({ pos: LV(V(-.05, 1.3, 1.05), V(-.05, 1.28, .95), ss(u / 1.7)), look: V(-.08, 1.02, -.3), fov: 44, focus: 1.1, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const sq = ei(seg(tc, 2.45, 2.65));
      gus.pose = { lh: [-6, -78], bendL: 10, lprop: { kind: 'glue', ang: Math.PI, squeeze: sq * 2, drop: sq }, rh: [36, -86], brows: tc < 2.4 ? 'up' : 'angry', mouth: 'grin', open: .3, look: [.2, .9], turn: .1, lean: .05, ...(talk('gus') ?? {}) };
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'skeptic', mouth: 'flat', look: [-.9, .2], turn: -.3, blink: blink(tc, 2) };
      tapeOnBench(K.tapeG, BENCH, .14, 1); K.tapeG.setGlue(tc > 2.6); } },
  { t0: 3.1, t1: 4.7, name: 'bet',   // "It's loose on purpose. Bet a cookie?"
    cam: u => ({ pos: LV(V(.34, 1.27, .55), V(.34, 1.27, .45), ss(u / 1.6)), look: V(.32, 1.16, -.62), fov: 38, focus: 1.1, aper: 30 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const up = ei(seg(tc, 3.7, 4.0));
      nana.pose = { lh: [-26, -80], rh: [lerp(30, 44, up), lerp(-84, -132, up)], bendR: -14, rprop: up > .2 ? { kind: 'cookie' } : null, brows: tc < 3.7 ? 'skeptic' : 'up', mouth: tc < 4.3 ? 'flat' : 'smile', look: [-.4, -.1], turn: -.15, ...(talk('nana') ?? {}) }; } },
  { t0: 4.7, t1: 5.45, name: 'measure',   // "Deal! Watch this." — the glued hook jammed into the empty cubby, stuck OUT
    cam: u => { const c = cubby(); return { pos: c.clone().add(V(.02, .09, .28 - .04 * ss(u / .75))), look: c.clone().add(V(0, -.01, -.06)), fov: 40, focus: .3, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; const c = cubby();
      K.tapeG.visible = true; K.tapeG.setGlue(true); K.tapeG.set(.08 + .02 * ei(seg(tc, 4.7, 4.95)), 1);
      K.tapeG.position.copy(c.clone().add(V(-K.CUB.w / 2 + .085 + .1 - .1, -K.CUB.h / 2 + .002, .02))); K.tapeG.rotation.set(0, 0, 0);
      K.tapeG.position.x = c.x + K.CUB.w / 2 - .0016 - (.006 + K.tapeG.len) - .0008; } },
  { t0: 5.45, t1: 6.05, name: 'jam',   // the board is too long: CLUNK, crooked
    cam: u => { const c = cubby(); return { pos: c.clone().add(V(.04, .12, .42)), look: c.clone().add(V(0, 0, -.04)), fov: 42, focus: .44, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; const c = cubby(); K.tapeG.visible = false;
      const k = ei(seg(tc, 5.45, 5.65)), b = K.boardG; b.visible = true;
      b.position.copy(c.clone().add(V(0, .015 + .025 * k, lerp(.25, .02, k)))); b.rotation.set(0, 0, k * .12 + (tc > 5.65 ? .02 * Math.sin((tc - 5.65) * 40) * Math.exp(-(tc - 5.65) * 6) : 0)); } },
  { t0: 6.05, t1: 6.6, name: 'wrong',   // Gus CU: ❌ WRONG
    cam: u => ({ pos: V(-.27, 1.44, .3), look: V(-.27, 1.36, -.62), fov: 36, focus: .9, aper: 30 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { lh: [-46, -84], rh: [46, -84], brows: 'worried', mouth: 'teeth', look: [0, 0], sq: 1 - .05 * Math.exp(-(tc - 6.05) * 8), tilt: -.04 }; } },
  { t0: 6.6, t1: 7.75, name: 'actually',   // "Actually…"
    cam: u => ({ pos: LV(V(.34, 1.25, .5), V(.34, 1.25, .38), ss(u / 1.15)), look: V(.32, 1.15, -.62), fov: 36, focus: 1.0, aper: 30 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const push = ei(seg(tc, 6.65, 6.95));
      nana.pose = { armsFront: tc < 7.2 && push > .3, lh: [-30, -76], rh: tc < 7.2 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, ...(talk('nana') ?? {}) }; } },
  { t0: 7.75, t1: 10.2, name: 'slots',   // "The hook slides by its own thickness." — the macro on the rivets in their slots
    cam: u => { const k = ss(u / 2.45), h = DEMO_A; return { pos: h.clone().add(V(-.045 + .02 * k, .07 - .01 * k, .11 - .02 * k)), look: h.clone().add(V(-.006, .002, 0)), fov: 36, focus: .12, aper: 5 }; },
    set(u, tc) { gus.visible = nana.visible = false; const tp = K.tapeDemo[0]; tp.visible = true; tp.gain = 3.5;
      tp.position.copy(DEMO_A).add(V(-(.006 + .16), 0, 0)); tp.rotation.set(0, 0, 0); tp.set(.16, Math.sin((tc - 7.75) * 4.2)); } },
  { t0: 10.2, t1: 14.75, name: 'pullpush',   // "Pull it, it slides out. Push it, it slides in." "So it reads true, inside or out."
    cam: u => { const k = ss(u / 4.5); return { pos: V(.0, DY + .36 - .03 * k, .3 - .02 * k), look: V(.0, DY + .01, .02), fov: 46, focus: .42, aper: 6 }; },
    set(u, tc) { gus.visible = nana.visible = false;
      const [a, b] = K.tapeDemo; a.visible = b.visible = true; a.gain = b.gain = 3.5;
      const pull = ei(seg(tc, 10.5, 10.9)), push = ei(seg(tc, 11.7, 12.1));
      // top: hooked over the far end of a board, pulled → the case moves back, the hook stays on the board's end: it slides OUT
      a.position.set(-.13 - .0028 * pull, DY + .02, -.07); a.rotation.set(0, 0, 0); a.set(.16, pull);
      K.blockOut.visible = true; K.blockOut.scale.set(3.2, .4, 1); K.blockOut.position.set(.0352 - .096, DY + .01, -.07);
      // bottom: pushed against a wall → the case moves forward, the hook stays on the wall: it slides IN
      b.position.set(-.13 + .0028 * push, DY, .1); b.rotation.set(0, 0, 0); b.set(.16, -push);
      K.blockIn.visible = true; K.blockIn.position.set(.0568, DY + .045, .1); } },
  { t0: 14.75, t1: 15.75, name: 'ha',   // "Ha! The first inch is short!"
    cam: u => ({ pos: LV(V(-.24, 1.38, .36), V(-.24, 1.38, .3), ss(u)), look: V(-.25, 1.3, -.62), fov: 38, focus: .95, aper: 30 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { armsFront: true, rh: [34, -112], bendR: -12, lh: [-40, -86], brows: 'up', mouth: 'grin', open: .4, look: [.8, .6], turn: .2, sq: 1 + .05 * Math.exp(-(tc - 14.8) * 8) * Math.cos((tc - 14.8) * 30), ...(talk('gus') ?? {}) };
      tapeInHand(K.tapeG, [34, -112], .1, .9, true); } },
  { t0: 15.75, t1: 18.2, name: 'inch',   // "On purpose. The hook fills the gap." — the first inch, measured from the hook's outer face
    cam: u => { const k = ss(u / 2.45), h = DEMO_A; return { pos: h.clone().add(V(-.018 - .004 * k, .085 - .008 * k, .07)), look: h.clone().add(V(-.014, 0, 0)), fov: 34, focus: .11, aper: 4 }; },
    set(u, tc) { gus.visible = nana.visible = false; const tp = K.tapeDemo[0]; tp.visible = true; tp.gain = 3.5;
      tp.position.copy(DEMO_A).add(V(-(.006 + .16), 0, 0)); tp.rotation.set(0, 0, 0); tp.set(.16, 1); } },
  { t0: 18.2, t1: 20.1, name: 'fit',   // Nana's board slides in: PERFECT FIT
    cam: u => { const c = cubby(); return { pos: c.clone().add(V(.05, .13, .48 - .04 * ss(u / 1.9))), look: c.clone().add(V(0, 0, -.04)), fov: 42, focus: .5, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; const c = cubby(); K.boardG.visible = false;
      const k = ei(seg(tc, 18.35, 18.9)), b = K.boardN; b.visible = true; b.position.copy(c.clone().add(V(0, .03, lerp(.3, -.005, k)))); b.rotation.set(0, 0, 0); } },
  { t0: 20.1, t1: 22.85, name: 'unglue',   // "Fine. I'll unglue it." — he yanks, the blade whips back: THWACK
    cam: u => ({ pos: LV(V(.02, 1.4, 1.25), V(.02, 1.4, 1.15), ss(u / 2.75)), look: V(.02, 1.2, -.5), fov: 42, focus: 1.6, aper: 20 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const pull = ei(seg(tc, 20.9, 21.55)), hit = tc > 21.75, k = tc - 21.75;
      gus.pose = { armsFront: true, rh: [30, -112], bendR: -12, lh: hit ? [-30, -84] : [lerp(10, -60, pull), lerp(-112, -106, pull)], bendL: 8, brows: hit ? 'shock' : 'angry', mouth: hit ? 'o' : 'teeth', open: .7,
        look: hit ? [Math.sin(k * 14) * .6, Math.cos(k * 11) * .4] : [.4, .3], turn: .1, tilt: hit ? -.22 * Math.exp(-k * 3) * Math.cos(k * 9) - .05 : 0, sq: hit ? 1 - .08 * Math.exp(-k * 6) : 1,
        stache: hit ? [6, -2, .35] : null, ...(hit ? {} : (talk('gus') ?? {})) };
      nana.pose = { armsFront: true, lh: [-12, -142], rh: [20, -84], lprop: { kind: 'cookie' }, brows: hit ? 'up' : 'skeptic', mouth: hit ? 'teeth' : 'flat', look: [-.9, -.1], turn: -.3, crumbs: tc > 20.6 ? 3 : 0 };
      // the tape in his right hand; the blade pulled out by the left hand, then snapping back
      const lhx = lerp(10, -60, pull), len = hit ? .02 : Math.max(.06, (30 - lhx) / 100 - .07); tapeInHand(K.tapeG, [30, -112], len, 1, true); K.tapeG.rotation.y = Math.PI; } },
  { t0: 22.85, t1: 25.8, name: 'loop',   // dazed, a new tape off the pegboard: "This one's broken too!" → framed like frame 0 → the cut
    cam: u => { const k = ss(clamp((u - 1.9) / .9)); return { ...OPEN, pos: LV(V(-.08, 1.38, .62), OPEN.pos.clone().add(V(0, 0, -.0)), k), fov: lerp(42, 40, k) }; },
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const up = ei(seg(tc, 22.9, 23.3)), g = ei(seg(tc, 24.8, 25.75));
      gus.pose = { armsFront: true, rh: [lerp(46, HOLD[0], up), lerp(-84, HOLD[1], up)], bendR: -12, lh: [lerp(-46, -18, g), lerp(-118, -128, g)], bendL: 12, lprop: { kind: 'glue', ang: lerp(-.2, .9, g) },
        brows: tc < 24.6 ? 'up' : 'angry', mouth: tc < 24.6 ? 'grin' : 'grin', open: .3, look: [1, .5], turn: .15, stache: tc < 23.4 ? [6, -2, .35] : null, ...(talk('gus') ?? {}) };
      tapeInHand(K.tapeG, HOLD, .07, tc > 23.3 ? RATTLE(tc) : 0, false); K.tapeG.setGlue(false); } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
const DEMO_A = V(.03, DY + .002, .02);
function cubby() { return K.cubby.position.clone().add(V(K.CUB.x, K.CUB.y, .0)); }
function tapeInHand(tp, h, len, slide, glue) {
  tp.visible = true; tp.position.copy(handWorld(gus, h, .07)).add(V(.0, -.03, 0)); tp.rotation.set(.15, -.25, .05); tp.gain = 3; tp.set(len, slide); tp.setGlue(glue);
}
function tapeOnBench(tp, p, len, slide) { tp.visible = true; tp.position.copy(p); tp.rotation.set(0, .25, 0); tp.gain = 1; tp.set(len, slide); }

function setProps(t, S) {
  for (const tp of [K.tapeG, K.tapeN, ...K.tapeDemo]) tp.visible = false;
  K.boardG.visible = K.boardN.visible = K.blockOut.visible = K.blockIn.visible = false;
  K.blockOut.scale.set(1, 1, 1);
  if (t > 5.6 && t < 18.2) { K.boardG.visible = true; const c = cubby(); K.boardG.position.copy(c.clone().add(V(0, .04, .02))); K.boardG.rotation.set(0, 0, .12); }
  K.updateMotes(t);
}

// —— overlays ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function ring(P, t, t0, R0 = 70, col = '#ff3b30') {
  const k = clamp((t - t0) / .3); if (k <= 0) return; const c = proj(P);
  og.save(); og.strokeStyle = col; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = c[0] + Math.cos(a0 + a) * R0 * w, y = c[1] + Math.sin(a0 + a) * R0 * .8 * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function title(t) {   // the question, slammed in big at the top in the first second, gone by 1.4 s
  if (t > 1.4) return;
  const s = t < .09 ? lerp(1.08, 1, ei(clamp(t / .09))) : 1 + .02 * Math.exp(-(t - .18) * 8) * Math.cos((t - .18) * 30), out = clamp((1.4 - t) / .12);
  og.save(); og.translate(W / 2, H * .215); og.scale(s, s); og.globalAlpha = out; og.rotate(-.03);
  og.font = '800 104px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  for (const [txt, y] of [['WHY DOES THE', -66], ['HOOK WOBBLE?', 66]]) { og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, y); og.fillText(txt, 0, y); og.restore(); og.strokeText(txt, 0, y); og.fillStyle = y > 0 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, y); }
  og.restore();
}
function burst(cx, cy, t, t0, col = '#ffffff') {
  const k = t - t0; if (k < 0 || k > .35) return;
  og.save();
  if (k < .085) { og.fillStyle = `rgba(255,255,255,${k < .042 ? .85 : .4})`; og.fillRect(0, 0, W, H); }
  og.strokeStyle = col; og.lineCap = 'round'; og.lineWidth = 14 * (1 - k / .35); og.globalAlpha = 1 - k / .35;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .2, r0 = 90 + k * 500, r1 = r0 + 120; og.beginPath(); og.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); og.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); og.stroke(); }
  og.restore();
}
function sweat(card, t, t0) {
  const k = t - t0; if (k < 0) return;
  const head = proj(card.pos.clone().add(V(.27 * card.scale, 1.5 * card.scale, .02))), y = head[1] + Math.min(1, k / .6) * 60;
  og.save(); og.fillStyle = '#8fd0ff'; og.strokeStyle = '#1c1418'; og.lineWidth = 6; og.beginPath(); og.moveTo(head[0], y - 46); og.quadraticCurveTo(head[0] + 28, y + 6, head[0], y + 18); og.quadraticCurveTo(head[0] - 28, y + 6, head[0], y - 46); og.fill(); og.stroke(); og.restore();
}
function speed(t, t0, dur) {
  const k = (t - t0) / dur; if (k < 0 || k > 1) return;
  og.save(); og.globalAlpha = Math.sin(Math.PI * k) * .85; og.strokeStyle = '#ffffff'; og.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const y = hash(i * 3.3) * H, x = (hash(i * 7.1) * 1.4 - .2) * W + k * 600, l = 200 + hash(i) * 500; og.lineWidth = 4 + hash(i * 1.9) * 10; og.beginPath(); og.moveTo(x, y); og.lineTo(x - l, y); og.stroke(); }
  og.restore();
}
function pow(txt, x, y, t, t0, dur, col = '#ffd84a', rot = -.12, size = 120) {
  const k = t - t0; if (k < 0 || k > dur) return;
  const sc = k < .1 ? lerp(1.5, 1, ei(k / .1)) : 1 + .03 * Math.sin(k * 30);
  og.save(); og.translate(x, y); og.rotate(rot); og.scale(sc, sc); og.globalAlpha = Math.min(1, (dur - k) / .15);
  og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = size * .22; og.strokeStyle = '#1c1418'; og.strokeText(txt, 0, 0); og.fillStyle = col; og.fillText(txt, 0, 0);
  og.restore();
}
function label(txt, x, y, col = '#ffffff', size = 76, a = 1) {
  og.save(); og.globalAlpha = a; og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = size * .24; og.strokeStyle = '#1c1418'; og.strokeText(txt, x, y); og.fillStyle = col; og.fillText(txt, x, y); og.restore();
}
function arrow(x0, y0, x1, y1, col, a = 1, lw = 18) {
  og.save(); og.globalAlpha = a; og.strokeStyle = '#1c1418'; og.lineCap = 'round'; og.lineJoin = 'round';
  const ang = Math.atan2(y1 - y0, x1 - x0), hd = 34;
  for (const [c, w] of [['#1c1418', lw + 12], [col, lw]]) { og.strokeStyle = c; og.lineWidth = w; og.beginPath(); og.moveTo(x0, y0); og.lineTo(x1, y1); og.moveTo(x1 - Math.cos(ang - .5) * hd, y1 - Math.sin(ang - .5) * hd); og.lineTo(x1, y1); og.lineTo(x1 - Math.cos(ang + .5) * hd, y1 - Math.sin(ang + .5) * hd); og.stroke(); }
  og.restore();
}
function stamp(t, t0) {
  const k = t - t0; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .22); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}
function confetti(t, t0) {
  const k = t - t0; if (k < 0 || k > 1.6) return;
  og.save(); for (let i = 0; i < 40; i++) { const x = W * hash(i * 1.3), y = -40 + k * (600 + hash(i * 2.7) * 700) + Math.sin(k * 6 + i) * 20; og.fillStyle = ['#ffd84a', '#ff6a8a', '#7be07b', '#9be0ff'][i % 4]; og.save(); og.translate(x, y); og.rotate(k * 8 + i); og.fillRect(-10, -5, 20, 10); og.restore(); } og.restore();
}
const hookTip = tp => tp.localToWorld(tp.hook.position.clone().add(V(.0008, .0, 0)));
function bracket(xa, xb, y, col, txt, a = 1) {   // a dimension bracket with a label above
  og.save(); og.globalAlpha = a; og.lineCap = 'round';
  for (const [c, w] of [['#1c1418', 20], [col, 9]]) { og.strokeStyle = c; og.lineWidth = w; og.beginPath(); og.moveTo(xa, y + 26); og.lineTo(xa, y); og.lineTo(xb, y); og.lineTo(xb, y + 26); og.stroke(); }
  og.restore(); label(txt, (xa + xb) / 2, y - 54, col, 70, a);
}

let texts = [];
function render(t) {
  TNEW = t;
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(t, S);
  const C = S.cam(u);
  const dist = C.pos.distanceTo(C.look), dr = .006 * dist;
  C.pos = C.pos.clone().add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look = C.look.clone().add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0));
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(u, tc);
  L.setSun(SUN, V(0, DY, -.3), 3);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper * .45; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  const N = S.name;
  if (N === 'macro0') { title(t); ring(hookTip(K.tapeG), t, 0, 80); pow('CLACK!', W * .78, H * .5, t, 0, .5, '#ffffff', .12, 96); pow('CLACK!', W * .74, H * .55, t, .6, .5, '#ffd84a', -.1, 96); }
  if (N === 'glue') { const p = proj(hookTip(K.tapeG)); pow('SQUIRT!', p[0] + 40, p[1] - 260, t, 2.5, .9, '#9be0ff', -.1); }
  if (N === 'bet') { pow('BET?', W * .26, H * .3, t, 4.1, .6, '#ffd84a', -.15, 110); }
  if (N === 'measure') { const p = proj(hookTip(K.tapeG)); label('GLUED!', p[0] - 120, p[1] - 220, '#ff6a50', 88); arrow(p[0] - 110, p[1] - 160, p[0] - 10, p[1] - 30, '#ff6a50'); }
  if (N === 'jam') { const c = proj(cubby()); pow('CLUNK!', c[0], c[1] - 330, t, 5.65, .4, '#ffffff', -.08); burst(c[0], c[1], t, 5.65, '#ffd84a'); }
  if (N === 'wrong') { stamp(t, 6.05); sweat(gus, t, 6.15); }
  if (N === 'slots') {   // the rivets in their slots, and the travel = the hook's thickness
    const tp = K.tapeDemo[0], lip = proj(hookTip(tp)), lipB = proj(hookTip(tp).add(V(-.0016 * 1.2, 0, 0)));
    const a = clamp((t - 8.2) / .3); ring(tp.localToWorld(tp.hook.position.clone().add(V(-.011, .005, .006))), t, 7.9, 90, '#ffd84a');
    label('SLIDES ↔', W * .5, H * .22, '#ffd84a', 96, a);
    if (t > 9.0) label('= HOOK THICKNESS', W * .5, H * .3, '#7be07b', 72, clamp((t - 9.0) / .25));
  }
  if (N === 'pullpush') {
    const [a, b] = K.tapeDemo, pa = proj(hookTip(a)), pb = proj(hookTip(b));
    const k1 = clamp((t - 10.4) / .25), k2 = clamp((t - 11.6) / .25);
    label('PULL', W * .24, pa[1] - 150, '#ffd84a', 84, k1);
    arrow(pa[0] - 60, pa[1] - 100, pa[0] + 60, pa[1] - 100, '#ffd84a', k1); label('OUT', pa[0] + 140, pa[1] - 100, '#ffd84a', 70, k1);
    label('PUSH', W * .24, pb[1] + 150, '#9be0ff', 84, k2);
    arrow(pb[0] + 60, pb[1] + 110, pb[0] - 60, pb[1] + 110, '#9be0ff', k2); label('IN', pb[0] + 120, pb[1] + 110, '#9be0ff', 70, k2);
    if (t > 13.3) { const k3 = clamp((t - 13.3) / .3); label('✓ TRUE ZERO', W * .5, H * .2, '#7be07b', 92, k3); }
  }
  if (N === 'ha') pow('HA!', W * .72, H * .3, t, 14.8, .6, '#ffd84a', .12);
  if (N === 'inch') {   // the first inch: from the hook's outer face to the 1" mark
    const tp = K.tapeDemo[0], o = hookTip(tp), one = tp.localToWorld(V(.006 + .16 - .0254 + .0016, .006, .0));
    const po = proj(o), p1 = proj(one), y = Math.min(po[1], p1[1]) - 120;
    const a = clamp((t - 15.9) / .25); bracket(p1[0], po[0], y, '#7be07b', '1 INCH', a);
    if (t > 16.7) label('SHORT BY 1/16"…', W * .5, H * .2, '#ff6a50', 80, clamp((t - 16.7) / .25));
    if (t > 17.3) label('…THE HOOK FILLS IT', W * .5, H * .27, '#ffd84a', 80, clamp((t - 17.3) / .25));
  }
  if (N === 'fit') { const c = proj(cubby()); if (t > 18.9) { pow('PERFECT FIT!', W * .5, c[1] - 360, t, 18.9, 1.2, '#7be07b', -.06, 108); pow('DING!', W * .75, c[1] - 520, t, 18.9, .7, '#ffd84a', .1, 96); } confetti(t, 18.9); }
  if (N === 'unglue') { if (t > 20.9 && t < 21.75) pow('YANK!', W * .3, H * .32, t, 20.9, .7, '#ffffff', -.12, 100); speed(t, 21.6, .2); burst(W * .42, H * .3, t, 21.75, '#ffd84a'); pow('THWACK!', W * .5, H * .22, t, 21.75, .9, '#ff6a50', -.08, 130); }
  if (N === 'loop') { if (t > 25.0) ring(hookTip(K.tapeG), t, 25.0, 80); if (t > 23.4 && t < 24.9) pow('CLACK!', W * .78, H * .5, t, 23.4, .5, '#ffffff', .12, 96); }
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(t, STORY.caps[0]?.t0 ?? 0), W, H);
}
const EV = [
  { t: 0, type: 'clack' }, { t: .3, type: 'clack' }, { t: .6, type: 'clack' }, { t: .9, type: 'clack' }, { t: 1.4, type: 'whoosh' }, { t: 2.5, type: 'squirt' }, { t: 4.1, type: 'pop' },
  { t: 4.7, type: 'zip' }, { t: 5.65, type: 'clunk' }, { t: 6.05, type: 'buzzer' }, { t: 6.05, type: 'stamp' }, { t: 7.9, type: 'tick' }, { t: 8.4, type: 'tick' }, { t: 10.5, type: 'slide' }, { t: 11.7, type: 'slide' }, { t: 13.3, type: 'ding' },
  { t: 14.8, type: 'pop' }, { t: 15.9, type: 'tick' }, { t: 18.35, type: 'slide' }, { t: 18.9, type: 'ding' }, { t: 18.9, type: 'cheer' }, { t: 20.9, type: 'zip', dur: .65 }, { t: 21.6, type: 'zipback' }, { t: 21.75, type: 'thwack' },
  { t: 23.4, type: 'clack' }, { t: 23.7, type: 'clack' }, { t: 24.0, type: 'clack' }, { t: 24.3, type: 'clack' }, { t: 24.6, type: 'clack' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS };
render(0);
window.READY = true;
