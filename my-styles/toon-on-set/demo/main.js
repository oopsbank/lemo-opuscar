// Toon on Set — demo film "Red Flag" (1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?ao · ?nocap · ?frame (the style frame) · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildPlace } from './place.js';
import { Card } from './card.js';
import { HAT, HAIR, BACK } from './cast.js';
import { drawCaps, capAt } from './caps.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 92px Baloo2');
const STORY = await (await fetch('story.json')).json();

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), og = ov.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, .03, 600);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: QS.has('ao'), aoRadius: .5, aoThickness: 1, aoScale: 1.6, aoAmt: .8 });
post.bloom.strength = .18; post.bloom.threshold = 1.2; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .32; post.vig.uniforms.warm.value = .35; post.vig.uniforms.contrast.value = .25; post.vig.uniforms.sat.value = 1.12;

const L = makeLight(scene, renderer);
const place = buildPlace(scene);

// —— cast ——
const postie = new Card(scene, {
  shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b',
  hat: HAT.cap('#34508a', '#d8b04a'), hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -76], [-21, -76]], { fill: '#f4f0e6', lw: lw * .6 }); },   // a letter in the shirt pocket
});
const lady = new Card(scene, {
  height: 1.62, shirt: '#e9893a', pants: '#b6532a', shoes: '#5a2a22', lips: '#b8323a',
  hair: HAIR.bun('#4a2a1e'), back: BACK.bun('#4a2a1e'),
  detail: (T, lw) => { for (const [x, y] of [[-8, -100], [9, -92], [-4, -80], [12, -74]]) T.shape([[x - 2.5, y], [x + 2.5, y], [x + 2.5, y + 5], [x - 2.5, y + 5]], { fill: '#f6d27a', stroke: false }); },   // a dotted print
});
const cards = [postie, lady];
// hide cards from the ambient-occlusion pass (its override material would draw their full rectangles)
if (post.dof.ao) { const r0 = post.dof.ao.render.bind(post.dof.ao); post.dof.ao.render = (...a) => { const v = cards.map(c => c.group.visible); cards.forEach(c => c.group.visible = false); r0(...a); cards.forEach((c, i) => c.group.visible = v[i]); }; }

const SUN_TINT = new THREE.Color(1.07, 1.03, .96), SHADE_TINT = new THREE.Color(.7, .74, .9);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 80; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }

// —— acting helpers (characters live on twos: 12 fps) ——
const on12 = t => Math.floor(t * 12 + 1e-6) / 12;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);
function walk(ph, dir = 1) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lf: [-11 + s * 15, -3 - Math.max(0, -c) * 8], rf: [11 - s * 15, -3 - Math.max(0, c) * 8], lh: [-30 - s * 12, -70], rh: [30 + s * 12, -70], bendL: 7, bendR: -7, bob: -Math.abs(c) * 3.5, turn: .5 * dir, look: [dir * .7, 0] };
}
const crouch = () => ({ bob: 42, lf: [-27, -42], rf: [27, -42], legBend: 20 });
// lip sync: the mouth opens with the voice's loudness (voices.json, 24 Hz envelopes from timing.py), sampled on the 12 fps drawing time
const VOX = await (await fetch('voices.json')).json();
function talk(who, t) {
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;
const shock = tc => ({ rh: [62, -150], bendR: -14, lh: [-28, -72], bendL: 8, brows: 'shock', mouth: 'o', open: .5, look: [1, -.4], turn: .35, lean: .03, tilt: -.05 });

// —— shots ——
const SUN = V(-.38, .46, .8);
const SHOTS = [
  { t0: 0, t1: 3, name: 'insert flag',   // the insert that explains: shallow focus, slow push
    cam: u => ({ pos: LV(V(1.72, 1.22, -2.12), V(1.55, 1.24, -2.28), ss(u / 3)), look: V(.55, 1.36, -3.22), fov: 32, focus: 1.55 - .2 * ss(u / 3), aper: 16 }),
    set() { postie.visible = lady.visible = false; } },
  { t0: 3, t1: 6.5, name: 'walk in',   // eye-level medium; the postman's real shadow travels with him on the gravel
    cam: u => ({ pos: V(-.35, 1.36, 1.55), look: V(-.12, 1.1, -3.1), fov: 40, focus: 4.6, aper: 55 }),
    set(u, tc) {
      postie.visible = true; lady.visible = false;
      const k = clamp((tc - 3.15) / 2.3), x = lerp(-1.3, -.42, k);
      postie.pos.set(x, 0, -3.0);
      if (k < 1) postie.pose = { ...walk((tc - 3.15) * 2 * Math.PI * 1.15), brows: 'up', mouth: 'smile', ...(talk('postie', tc) ?? {}), blink: blink(tc, 1) };
      else if (tc < 5.75) postie.pose = { brows: 'neutral', mouth: 'smile', turn: .2, look: [.2, 0], blink: blink(tc, 1) };
      else postie.pose = { brows: 'up', mouth: 'flat', turn: .35, look: [1, -.4], tilt: -.04 };   // he sees it
    } },
  { t0: 6.5, t1: 8.5, name: 'reaction CU',   // a beat of stillness, then a snap zoom on the punchline word; the cap pops
    cam: u => { const z = eo(seg(u, .25, .4)); const sh = u > .25 && u < .7 ? (hash(Math.floor(u * 24)) - .5) * .012 * (1 - seg(u, .25, .7)) : 0;
      return { pos: V(-.38 + sh, 1.42 + sh, -.1), look: V(-.42, 1.33, -3.0), fov: lerp(36, 25, z), focus: 2.9, aper: 40 }; },
    set(u, tc) {
      postie.visible = true; lady.visible = false; postie.pos.set(-.42, 0, -3.0);
      const d = tc - 6.75;
      postie.pose = d >= 0 ? { ...shock(tc), hatLift: 16 * (1 - ss(seg(tc, 6.95, 7.35))), sq: 1 + .08 * Math.exp(-d * 8) * Math.cos(d * 40), ...(talk('postie', tc) ?? {}) }
        : { brows: 'up', mouth: 'flat', turn: .35, look: [1, -.4], tilt: -.04 };
    } },
  { t0: 8.5, t1: 10.5, name: 'low angle flag',   // the absurd-scale reveal: knee height, the flag against the sky
    cam: u => ({ pos: LV(V(.05, .42, -1.75), V(.15, .46, -2.05), ss(u / 2)), look: V(.56, 1.42, -3.2), fov: 46, focus: 1.5, aper: 22 }),
    set() { postie.visible = lady.visible = false; } },
  { t0: 10.5, t1: 13, name: 'hiding',   // crouched behind a post that hides nothing; nervous jitter
    cam: u => ({ pos: LV(V(.05, 1.15, .1), V(.08, 1.15, -.1), ss(u / 2.5)), look: V(.3, .85, -3.4), fov: 38, focus: 3.9, aper: 45 }),
    set(u, tc) {
      postie.visible = true; lady.visible = false;
      const j = (hash(Math.floor(tc * 12) * 1.3) - .5) * .02;
      postie.pos.set(.36 + j, 0, -3.75);
      postie.pose = { ...crouch(), lh: [-34, -130], rh: [34, -130], bendL: -10, bendR: 10, brows: 'worried', mouth: 'teeth', look: [.6 + j * 20, -.5 + j * 10], turn: .3, ...(talk('postie', tc) ?? {}) };
    } },
  { t0: 13, t1: 16.4, name: 'two-shot rack',   // she walks into the foreground; focus racks from him to her
    cam: u => ({ pos: V(.05, 1.4, .95), look: V(.42, 1.12, -2.7), fov: 42, focus: lerp(4.75, 3.05, ss(seg(u, .7, 1.15))), aper: 60 }),
    set(u, tc) {
      postie.visible = lady.visible = true;
      postie.pos.set(.36, 0, -3.75);
      postie.pose = tc < 15.3 ? { ...crouch(), lh: [-34, -130], rh: [34, -130], bendL: -10, bendR: 10, brows: 'worried', mouth: 'teeth', look: [1, -.1], turn: .45 } : { brows: 'up', mouth: 'flat', look: [1, 0], turn: .5, lh: [-30, -70], rh: [30, -70] };
      const k = clamp((tc - 13.0) / .9), lx = lerp(1.3, .66, k);
      lady.pos.set(lx, 0, -1.9);
      const base = k < 1 ? { ...walk((tc - 13) * 2 * Math.PI * 1.15, -1), mouth: 'flat', brows: 'skeptic' } : { brows: 'skeptic', mouth: 'flat', turn: -.45, look: [-1, 0], lh: [12, -94], rh: [-12, -90], bendL: -6, bendR: 6 };
      if (tc > 14.0 && tc < 16.0) Object.assign(base, { lh: [-72, -128], bendL: 10, rh: [26, -70], bendR: -4 });   // points at the box
      lady.pose = { ...base, ...(talk('lady', tc) ?? {}), blink: blink(tc, 2) };
    } },
  { t0: 16.4, t1: 18.4, name: 'insert door',   // the door drops open: the letter
    cam: u => ({ pos: LV(V(-.36, 1.34, -2.2), V(-.3, 1.32, -2.33), ss(u / 2)), look: V(.3, 1.18, -2.98), fov: 32, focus: .78, aper: 12 }),
    set() { postie.visible = lady.visible = false; } },
  { t0: 18.4, t1: 20.6, name: 'blank CU',   // silence; "Oh."; a sheepish grin
    cam: u => ({ pos: LV(V(-.72, 1.5, -1.45), V(-.68, 1.5, -1.6), ss(u / 2.2)), look: V(-.15, 1.4, -3.65), fov: 32, focus: 2.35, aper: 40 }),
    set(u, tc) {
      postie.visible = true; lady.visible = false; postie.pos.set(-.15, 0, -3.65);
      const grin = tc > 19.95;
      postie.pose = { brows: grin ? 'worried' : 'neutral', mouth: grin ? 'grin' : 'flat', open: .2, look: grin ? [-.3, .2] : [0, 0], turn: grin ? -.1 : .05, tilt: grin ? .06 : 0, lh: [-30, -70], rh: grin ? [-4, -150] : [30, -70], bendR: grin ? 20 : -6, blink: tc > 18.9 && tc < 19.0 ? 1 : 0, ...(grin ? {} : talk('postie', tc) ?? {}) };
    } },
  { t0: 20.6, t1: 22.4, name: 'callback',   // the opening insert again: the flag drops
    cam: u => ({ pos: V(1.55, 1.24, -2.28), look: V(.55, 1.36, -3.22), fov: 32, focus: 1.35, aper: 16 }),
    set() { postie.visible = lady.visible = false; } },
];
// the set's moving parts, as functions of film time
function setProps(t) {
  const o = seg(t, 16.55, 16.95);
  place.door.rotation.x = t < 16.55 || t >= 20.6 ? 0 : 1.45 * (o < 1 ? ei(o) : 1 - .06 * Math.exp(-(t - 16.95) * 9) * Math.abs(Math.cos((t - 16.95) * 30)));
  const d = seg(t, 20.95, 21.15);
  place.flag.rotation.x = t < 20.95 ? 0 : -Math.PI / 2 * (d < 1 ? ei(d) : 1 - .08 * Math.exp(-(t - 21.15) * 7) * Math.abs(Math.cos((t - 21.15) * 22)));
}
const FRAME = { t0: 0, t1: 1, name: 'style frame',
  cam: () => ({ pos: V(-.02, 1.38, 1.15), look: V(.02, 1.12, -3.1), fov: 38, focus: 4.1, aper: 60 }),
  set() { postie.visible = true; lady.visible = false; postie.pos.set(-.42, 0, -3.0); postie.pose = shock(0); } };
const FRAME_CAPS = [{ t0: 0, t1: 99, text: 'Red flag?', hot: true }];
const shotAt = t => QS.has('frame') ? FRAME : SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(QS.has('frame') ? 0 : t);
  S.set(u, tc);
  const C = S.cam(u);
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  L.setSun(SUN, C.look, 6);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.4 * c.scale - (c.pose.bob ?? 0) / 100, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (!QS.has('nocap')) drawCaps(og, QS.has('frame') ? FRAME_CAPS : STORY.caps, t, W, H);   // captions are subtitles: checked through the .srt, not TEXTS
}
// sound events (exported with core/render/events.mjs → events.json, read by mix.py)
const EV = [];
for (let t = 3.15; t < 5.45; t += 1 / (2 * 1.15)) EV.push({ t: +t.toFixed(3), type: 'step', gain: .8 });
for (let t = 13.0; t < 13.9; t += 1 / (2 * 1.15)) EV.push({ t: +t.toFixed(3), type: 'step', gain: 1 });
EV.push({ t: 6.72, type: 'whoosh' }, { t: 6.75, type: 'boing' }, { t: 8.5, type: 'swell' }, { t: 10.5, type: 'tremble', dur: 2.5 }, { t: 15.3, type: 'pop' },
  { t: 16.55, type: 'creak' }, { t: 16.95, type: 'clank' }, { t: 21.15, type: 'clunk' });
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;   // ?dur=1: a quick pipeline check
window.DBG = { scene, camera, post, place, cards, L, SHOTS };
render(0);
window.READY = true;
