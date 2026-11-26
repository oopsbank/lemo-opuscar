// "No Holes" — why do crackers have holes? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?frame (the style frame) · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildKitchen, Puffs } from './kitchen.js';
import { Card } from './card.js';
import { HAT, HAIR, BACK } from './cast.js';
import { ell } from './toon.js';
import { drawCaps } from './caps.js';

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
const camera = new THREE.PerspectiveCamera(40, W / H, .02, 200);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .22; post.bloom.threshold = 1.1; post.bloom.radius = .45;
post.vig.uniforms.amt.value = .3; post.vig.uniforms.warm.value = .42; post.vig.uniforms.contrast.value = .22; post.vig.uniforms.sat.value = 1.1;

// warm interior: the sun comes in only through the window; a warm hemisphere and a soft bounce fill the room
const L = makeLight(scene, renderer, { sun: '#ffd49a', sunI: 3.6, sky: '#f7dfba', ground: '#a27a56', hemiI: 1.15, envI: .5 });
const bounce = new THREE.DirectionalLight('#ffe4c4', .55); bounce.position.set(2, 2.5, 3); scene.add(bounce);
const K = buildKitchen(scene);
// reflections come from a warm room (cream walls, a brown floor, the bright window on the left), not from the outdoor sky
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD);
    vec3 c = mix(vec3(.42, .3, .22), vec3(.93, .84, .7), smoothstep(-.3, .35, d.y)); c = mix(c, vec3(1., .95, .86), smoothstep(.6, 1., d.y) * .4);
    c += vec3(2.2, 1.9, 1.5) * smoothstep(.8, .95, dot(d, normalize(vec3(-1., .35, .25)))); gl_FragColor = vec4(c, 1.); }` })));
L.bakeEnv = () => { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, .02).texture; scene.environmentIntensity = .55; };

// —— cast ——
const kid = new Card(scene, {
  height: 1.2, headScale: 1.1, shirt: '#e0503c', pants: '#2f3f6b', shoes: '#3a2a26',
  hat: HAT.toque(), hair: HAIR.tuft('#7a4a26'),
  detail: (T, lw) => { T.g.globalAlpha = .85; for (const [x, y, r] of [[-10, -88, 4.5], [-6, -85, 3], [11, -78, 3.2]]) T.fillOnly(ell(x, y, r, r * .7, 16), '#fbf2e4'); T.g.globalAlpha = 1; },   // flour smudges
});
const gran = new Card(scene, {
  height: 1.55, shirt: '#7d5aa8', pants: '#5a4378', shoes: '#4a2f2a', cheeks: '#f0a0a0', glasses: true,
  hair: HAIR.bun('#b8b2ab'), back: BACK.bun('#b8b2ab'),
  detail: (T, lw) => { T.shape([[-15, -100], [15, -100], [21, -50], [0, -46], [-21, -50]], { fill: '#f6ecd8', lw: lw * .6, shade: () => T.fillOnly([[6, -100], [15, -100], [21, -50], [8, -48]], '#e3d5bb') }); T.shape([[-8, -74], [8, -74], [8, -62], [-8, -62]], { fill: '#f6ecd8', lw: lw * .5 }); },   // an apron with a pocket
});
const cards = [kid, gran];
const SUN_TINT = new THREE.Color(1.06, 1.02, .95), SHADE_TINT = new THREE.Color(.95, .9, .84), OVEN_TINT = new THREE.Color(1.2, .66, .4);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 20; ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }

// —— steam and flour ——
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);
const O = K.OV, fzO = O.z + O.d / 2, ISL = K.ISL;
const TRAY_A_ISL = V(ISL.x + .12, .9025, ISL.z - .06), TRAY_B = V(ISL.x + .02, .9025, ISL.z - .1);
const RACK = V(O.x, K.RACK_Y + .004, K.CAV.z + .02);
const FX = {
  flour: new Puffs(scene, { n: 14, t0: .52, t1: .62, life: 1.1, p: TRAY_A_ISL.clone().add(V(0, .03, 0)), spread: .1, v: V(0, .25, 0), vr: .35, size: .07, grow: 2.5, rise: .02, opacity: .55, color: '#fffaf0', seed: 3 }),
  leak: new Puffs(scene, { n: 22, t0: 10.95, t1: 13.2, life: 1.8, p: V(O.x, .62, fzO + .1), spread: .12, v: V(0, .22, .12), vr: .12, size: .1, grow: 3, rise: .06, opacity: .32, color: '#fff4e6', seed: 5 }),
  jet: new Puffs(scene, { n: 26, t0: 14.0, t1: 14.85, life: 1.3, p: V(0, 0, 0), spread: .01, v: V(-.55, .9, .25), vr: .18, size: .05, grow: 4.5, rise: .05, opacity: .55, color: '#ffffff', drag: 3, seed: 9 }),
  wisp: new Puffs(scene, { n: 12, t0: 19.95, t1: 21.6, life: 1.4, p: TRAY_B.clone().add(V(0, .02, 0)), spread: .1, v: V(0, .12, 0), vr: .03, size: .035, grow: 2.5, rise: .04, opacity: .28, color: '#fffaf2', seed: 11 }),
};

// —— acting helpers (characters live on twos: 12 fps) ——
const on12 = t => Math.floor(t * 12 + 1e-6) / 12;
function walk(ph, dir = 1) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lf: [-11 + s * 13, -3 - Math.max(0, -c) * 7], rf: [11 - s * 13, -3 - Math.max(0, c) * 7], lh: [-30 - s * 10, -70], rh: [30 + s * 10, -70], bendL: 7, bendR: -7, bob: -Math.abs(c) * 3, turn: .5 * dir, look: [dir * .7, 0] };
}
const VOX = await (await fetch('voices.json')).json();
function talk(who, t) {
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;
// a world point → the card's own drawing units (cm, feet at 0, up is −y), seen from the camera: where a hand must be drawn to touch it
function cardLocal(card, P) {
  const ry = Math.atan2(camera.position.x - card.pos.x, camera.position.z - card.pos.z);
  const n = V(Math.sin(ry), 0, Math.cos(ry)), d = P.clone().sub(camera.position), s = card.pos.clone().sub(camera.position).dot(n) / d.dot(n);
  const X = camera.position.clone().addScaledVector(d, s).sub(card.pos), right = V(Math.cos(ry), 0, -Math.sin(ry));
  return [X.dot(right) / card.scale * 100, -X.y / card.scale * 100];
}
const holeW = k => { const [u, v] = K.doughB.holes[k]; return TRAY_B.clone().add(V((u - .5) * K.doughB.w, .022, (v - .5) * K.doughB.d)); };
const POKE0 = 17.0, POKE_DT = .25;

// —— the set's moving parts, as functions of film time ——
const doorOpen = a => { K.door.rotation.x = a; };
function setProps(t) {
  // tray A: on the island (0 – 5.5), in the oven (5.5 – 10.9), shoved out onto the door (10.9 –)
  const out = seg(t, 10.9, 11.05);
  if (t < 5.5) K.trayA.position.copy(TRAY_A_ISL);
  else if (t < 10.9) K.trayA.position.copy(RACK);
  else { const o = eo(out); K.trayA.position.copy(RACK).add(V(0, -(RACK.y - .21) * ei(out), .55 * o)); }
  K.trayB.visible = t >= 16;
  K.trayB.position.copy(TRAY_B);
  // dough A: the slap (drops onto the tray), bubbles, the puff, the burst, the poke
  const slap = seg(t, .38, .55);
  K.doughA.mesh.position.y = .013 + (t < .55 ? (1 - ei(slap)) * .22 : 0);
  K.doughA.mesh.scale.set(1, t > .55 && t < .75 ? 1 - .5 * Math.exp(-(t - .55) * 20) : 1, 1);
  K.doughA.mesh.visible = t >= .38 || t < 0;
  let h = 0, bub = 0, spread = 0, wob = 0, wr = 0, bake = 0;
  if (t >= 7.55) { bub = seg(t, 7.6, 8.4); bake = .25 * seg(t, 7.6, 9.3); }
  if (t >= 8.3) { h = .27 * ei(seg(t, 8.3, 9.25)) ** .8; spread = .18 * seg(t, 8.3, 9.25); bake = .25 + .3 * seg(t, 8.3, 9.3); }
  if (t >= 10.9) { const k = t - 10.9; h = .33 + .05 * Math.exp(-k * 4) * Math.sin(k * 26); spread = .5 - .08 * Math.exp(-k * 5); wob = Math.exp(-k * 2); bake = .55; }
  if (t >= 14.0) { const k = seg(t, 14.0, 14.8); h = lerp(.33, .018, eo(k)) + .03 * (1 - k) * Math.sin(t * 60); spread = lerp(.5, .55, k); wr = k; wob = 0; bake = .55; }
  K.doughA.shape(h, bub, spread, wob, wr, t); K.doughA.paintTex(+bake.toFixed(2), 0);
  // dough B: holes appear one per poke; baked golden after the cut at 20
  const nh = t < POKE0 ? 0 : Math.min(9, Math.floor((t - POKE0) / POKE_DT + 1e-6) + 1);
  K.doughB.paintTex(t >= 20 ? 1 : 0, t >= 20 ? 9 : nh); K.doughB.shape(0, 0, 0, 0, 0, t);
  // the door: open (the kid put the tray in) until the kick at 6.0; bursts open at 10.9
  if (t < 6.0) doorOpen(1.5);
  else if (t < 10.9) { const k = seg(t, 6.0, 6.12); doorOpen(k < 1 ? 1.5 * (1 - ei(k)) : -.03 * Math.exp(-(t - 6.12) * 10) * Math.abs(Math.sin((t - 6.12) * 30))); }
  else { const k = seg(t, 10.9, 10.98); doorOpen(k < 1 ? 1.62 * eo(k) : 1.62 - .1 * Math.exp(-(t - 10.98) * 7) * Math.abs(Math.cos((t - 10.98) * 24))); }
  if (t < 10.9 && t >= 8.6) doorOpen(K.door.rotation.x + .012 * Math.sin(t * 50) * seg(t, 8.6, 9.3));   // the door rattles as the pillow presses
  // the dial turns, the elements glow
  K.dials[0].rotation.z = -2.4 * ss(seg(t, 6.5, 6.8));
  const glow = t < 6.9 ? 0 : Math.min(1, (t - 6.9) * 3) * (t < 14.8 ? 1 : 1 - seg(t, 14.8, 15.5) * .6);
  for (const c of K.coils) c.material.color.setRGB(.25 + glow * 1.6, .1 + glow * .55, .05 + glow * .12);
  K.ovenLight.intensity = glow * .16;
  K.tint.material.opacity = .32 - glow * .1;
  K.cavMat.emissive.setRGB(.3 * glow, .1 * glow, .02 * glow); K.cavMat.color.setScalar(1 - .75 * glow);
  K.doughB.mesh.visible = t < 21.5;
  // steam and flour
  FX.flour.update(t); FX.leak.update(t); FX.wisp.update(t);
  FX.jet.spec.p.copy(K.trayA.position).add(V(.04, .2, .02)); FX.jet.update(t);
}

// —— shots ——
const SUN = V(-.85, .4, .32).normalize();
const atIsl = { x: ISL.x - .05, y: .26, z: ISL.z - .58 };   // the kid on the step stool behind the island
const SHOTS = [
  { t0: 0, t1: 3.5, name: 'counter',   // mid-action: the slap, then the fork; slow push
    cam: u => ({ pos: LV(V(-.33, 1.42, 1.05), V(-.37, 1.4, .82), ss(u / 3.5)), look: V(-.42, .98, -1.3), fov: 40, focus: 2.62 - .22 * ss(u / 3.5), aper: 40 }),
    set(u, tc) {
      kid.visible = true; gran.visible = false; kid.pos.set(atIsl.x, atIsl.y, atIsl.z);
      const a = cardLocal(kid, TRAY_A_ISL.clone().add(V(-.15, .03, .05))), b = cardLocal(kid, TRAY_A_ISL.clone().add(V(.15, .03, .05)));
      if (tc < .55) { const up = 1 - ei(seg(tc, .3, .55)); kid.pose = { lh: [a[0], a[1] - 24 * up], rh: [b[0], b[1] - 24 * up], bendL: 10, bendR: -10, brows: 'angry', mouth: 'teeth', look: [.2, .8], sq: 1 + .04 * up }; }
      else if (tc < 2.2) kid.pose = { lh: [a[0], a[1]], rh: [b[0], b[1]], bendL: 10, bendR: -10, brows: 'up', mouth: 'smile', look: [.1, .7], blink: blink(tc, 1), sq: 1 - .03 * Math.exp(-(tc - .55) * 8) };
      else { const k = ei(seg(tc, 2.2, 2.5)); kid.pose = { lh: a, rh: [lerp(b[0], 50, k), lerp(b[1], -124, k)], bendL: 10, bendR: -24, rprop: k > .3 ? { kind: 'fork', ang: Math.PI * .95 } : null, brows: tc > 2.6 ? 'skeptic' : 'up', mouth: tc > 2.6 ? 'flat' : 'smile', look: [.9, -.7], turn: .2, tilt: -.05 }; }
    } },
  { t0: 3.5, t1: 5.5, name: 'decision CU',   // "Holes? Who needs holes!" — the fork goes over the shoulder
    cam: u => ({ pos: LV(V(-.43, 1.4, .6), V(-.44, 1.4, .48), ss(u / 2)), look: V(-.48, 1.36, -1.58), fov: 34, focus: 2.12, aper: 45 }),
    set(u, tc) {
      kid.visible = true; gran.visible = false; kid.pos.set(atIsl.x, atIsl.y, atIsl.z);
      const toss = seg(tc, 4.95, 5.2), gone = tc >= 5.17;
      const rh = toss <= 0 ? [50, -124] : [lerp(50, 30, ei(toss)), lerp(-124, -205, ei(toss))];
      kid.pose = { lh: [-30, -78], rh, bendR: -24, rprop: gone ? null : { kind: 'fork', ang: Math.PI * .95 + toss * 2.5 }, brows: tc < 4.1 ? 'skeptic' : 'up', mouth: 'smile', look: tc < 4.1 ? [.9, -.7] : [0, 0], turn: tc < 4.1 ? .2 : 0, tilt: tc < 4.1 ? -.05 : .04, ...(talk('kid', tc) ?? {}), blink: blink(tc, 2) };
      if (tc > 5.3) Object.assign(kid.pose, { brows: 'worried', mouth: 'teeth', look: [-.9, 0], tilt: -.06, rh: [26, -96] });   // the clang off-screen: a wince
    } },
  { t0: 5.5, t1: 7.5, name: 'oven',   // the kick shuts the door, the dial, the glow
    cam: u => ({ pos: LV(V(.24, 1.04, .3), V(.26, 1.02, .14), ss(u / 2)), look: V(.62, .64, -2.2), fov: 42, focus: 2.25, aper: 40 }),
    set(u, tc) {
      kid.visible = true; gran.visible = false;
      const step = ei(seg(tc, 5.75, 5.95));
      kid.pos.set(lerp(.18, .34, step), 0, -1.98);
      if (tc < 6.25) kid.pose = { rf: tc > 5.9 && tc < 6.15 ? [42, -26] : [13, -3], legBend: 6, lean: tc > 5.9 && tc < 6.15 ? -.12 : 0, lh: [-34, -84], rh: [36, -86], brows: 'angry', mouth: 'grin', open: .3, look: [1, .4], turn: .3 };
      else { const d = cardLocal(kid, V(O.x - .27, .79, fzO + .03)); kid.pose = { rh: d, bendR: 8, lh: [-30, -72], brows: 'up', mouth: tc > 6.9 ? 'grin' : 'smile', open: .2, look: [1, .5], turn: .35, lean: .03 }; }
    } },
  { t0: 7.5, t1: 9.3, name: 'oven window',   // the insert that explains, as a horror reveal: bubbles, then the pillow
    cam: u => ({ pos: LV(V(O.x + .04, .58, fzO + .58), V(O.x + .03, .56, fzO + .46), ss(u / 1.8)), look: V(O.x, .5, K.CAV.z + .02), fov: 36, focus: .88 - .1 * ss(u / 1.8), aper: 22 }),
    set() { kid.visible = gran.visible = false; } },
  { t0: 9.3, t1: 10.9, name: 'uh oh CU',   // lit orange by the oven; the face does it
    cam: u => ({ pos: LV(V(.52, 1.08, -.05), V(.51, 1.08, -.17), ss(u / 1.6)), look: V(.34, .93, -1.98), fov: 38, focus: 1.88, aper: 45 }),
    set(u, tc) {
      kid.visible = true; gran.visible = false; kid.pos.set(.34, 0, -1.98);
      const tr = (hash(Math.floor(tc * 12) * 1.7) - .5) * (tc > 10.3 ? 1 : 0);
      kid.pose = { lh: [-34, -98], rh: [34, -98], bendL: -8, bendR: 8, brows: 'worried', mouth: 'teeth', look: [1 + tr * .2, .5], turn: .45, tilt: .03 + tr * .02, ...(talk('kid', tc) ?? {}), sq: 1 - .02 * Math.abs(tr) };
      kid.glow = 1;
    } },
  { t0: 10.9, t1: 13.0, name: 'burst wide',   // the door bangs open, the pillow wobbles out; the kid jumps, the hat pops; then silence
    cam: u => { const sh = u < .5 ? (hash(Math.floor(u * 24) + 3) - .5) * .02 * (1 - u / .5) : 0;
      return { pos: V(.86 + sh, 1.14 + sh, .66), look: V(.62, .66, -2.05), fov: 46, focus: 2.75, aper: 45 }; },
    set(u, tc) {
      kid.visible = true; gran.visible = false;
      const j = eo(seg(tc, 10.92, 11.15)), d = tc - 10.92;
      kid.pos.set(lerp(.38, .3, j), d > 0 && d < .35 ? Math.sin(d / .35 * Math.PI) * .12 : 0, lerp(-1.98, -1.78, j));
      kid.pose = d < 0 ? { brows: 'worried', mouth: 'teeth', look: [1, .5], turn: .45 } : { lh: [-58, -160], rh: [58, -160], bendL: 14, bendR: -14, brows: 'shock', mouth: 'o', open: .8, look: [1, .3], turn: .3, lean: -.06, hatLift: 26 * (1 - ss(seg(tc, 11.1, 11.6))), sq: 1 + .1 * Math.exp(-d * 7) * Math.cos(d * 34), lf: [-24, -10 * (d < .35 ? 1 : 0) - 3], rf: [24, -3] };
      if (tc > 12.0) Object.assign(kid.pose, { lh: [-34, -84], rh: [34, -84], bendL: 8, bendR: -8, mouth: 'flat', brows: 'up', open: 0, blink: blink(tc, 3) });
    } },
  { t0: 13.0, t1: 16.5, name: 'grandma',   // two-shot: she walks in with a fork; the poke; the steam whistles out
    cam: u => ({ pos: V(.86, 1.32, 1.12), look: V(.82, .96, -1.9), fov: 46, focus: lerp(3.1, 2.78, ss(seg(u, 1, 2))), aper: 50 }),
    set(u, tc) {
      kid.visible = gran.visible = true;
      kid.pos.set(.3, 0, -1.82);
      const k = clamp((tc - 13.0) / .85), gx = lerp(1.9, 1.32, k);
      gran.pos.set(gx, 0, -1.6);
      const tip = cardLocal(gran, K.trayA.position.clone().add(V(.08, .26, .05)));
      const pk = seg(tc, 13.75, 14.0), back0 = [tip[0] + 18, tip[1] - 30];
      let g = k < 1 ? { ...walk((tc - 13) * 2 * Math.PI * 1.1, -1), rprop: null, lprop: { kind: 'fork', ang: -.6 }, brows: 'neutral', mouth: 'flat' }
        : { brows: 'skeptic', mouth: 'flat', turn: -.4, look: [-1, .6], rh: [26, -72], bendR: -4, lh: tc < 14.0 ? [lerp(back0[0], tip[0] + 6, ei(pk)), lerp(back0[1], tip[1] - 10, ei(pk))] : [tip[0] + 6, tip[1] - 10], bendL: 12, lprop: { kind: 'fork', ang: .62 } };
      if (k >= 1 && tc > 14.9) Object.assign(g, { turn: -.5, look: [-1, 0], lh: [-26, -96], lprop: { kind: 'fork', ang: -.3 }, ...(talk('gran', tc) ?? {}) });
      gran.pose = { ...g, blink: blink(tc, 2) };
      const jet = seg(tc, 14.0, 14.5);
      kid.pose = tc < 14.0 ? { brows: 'up', mouth: 'flat', look: [1, .2], turn: .35, lh: [-34, -84], rh: [34, -84] }
        : { brows: 'shock', mouth: 'o', open: .5, look: [1, .3], turn: .3, lh: [-40, -150], rh: [30, -84], bendL: 12, hatLift: 22 * Math.sin(Math.PI * jet), tilt: -.04, lean: -.04 };
      if (tc > 15.0) kid.pose = { brows: 'up', mouth: 'flat', look: [1, 0], turn: .4, lh: [-34, -84], rh: [34, -84], blink: blink(tc, 1) };
    } },
  { t0: 16.5, t1: 20.0, name: 'pokes',   // over the island, a slow lateral track: a smiley face of holes, on the beat
    cam: u => ({ pos: LV(V(-.62, 1.56, .3), V(-.47, 1.56, .3), ss(u / 3.5)), look: V(-.43, .84, -1.25), fov: 40, focus: 1.62, aper: 40 }),
    set(u, tc) {
      kid.visible = true; gran.visible = false; kid.pos.set(atIsl.x, atIsl.y, atIsl.z);
      const k = clamp(Math.floor((tc - POKE0) / POKE_DT + 1e-6), 0, 8), ph = ((tc - POKE0) / POKE_DT) - Math.floor((tc - POKE0) / POKE_DT);
      const T = cardLocal(kid, holeW(k)), up = tc < POKE0 ? 1 : (k >= 8 && tc > POKE0 + 8 * POKE_DT + .1 ? 1 : (ph < .35 ? 0 : (ph - .35) / .65));
      const hand = [T[0], T[1] - 22 - up * 9];
      kid.pose = { rh: hand, bendR: 10, rprop: { kind: 'fork', ang: 0 }, lh: [-30, -88], bendL: 6, brows: 'angry', mouth: 'grin', open: .2, look: [.2, .9], tilt: .03, blink: 0 };
      if (tc > 19.3) Object.assign(kid.pose, { brows: 'up', mouth: 'grin', open: .4, look: [0, .6] });
    } },
  { t0: 20.0, t1: 21.5, name: 'golden insert',   // flat and crisp; wisps of steam out of the holes
    cam: u => ({ pos: LV(V(TRAY_B.x - .02, 1.58, TRAY_B.z + .58), V(TRAY_B.x - .02, 1.52, TRAY_B.z + .5), ss(u / 1.5)), look: V(TRAY_B.x, .91, TRAY_B.z - .03), fov: 40, focus: .86 - .08 * ss(u / 1.5), aper: 22 }),
    set() { kid.visible = gran.visible = false; } },
  { t0: 21.5, t1: 24.0, name: 'crunch CU',   // the bite; "Crunchy!"; grandma soft behind
    cam: u => ({ pos: LV(V(-.42, 1.4, .62), V(-.43, 1.4, .5), ss(u / 2.5)), look: V(-.47, 1.32, -1.58), fov: 34, focus: 2.15, aper: 45 }),
    set(u, tc) {
      kid.visible = gran.visible = true; kid.pos.set(atIsl.x, atIsl.y, atIsl.z);
      gran.pos.set(-.02, 0, -2.22);
      const bite = tc >= 22.2, raise = ei(seg(tc, 21.6, 22.0));
      kid.pose = { armsFront: raise > .2, rh: [lerp(30, 14, raise), lerp(-96, -122, raise)], bendR: -16, rprop: { kind: 'cracker', ang: -.1, bite }, lh: [-30, -80], brows: bite ? 'up' : 'neutral', mouth: tc < 22.15 ? 'o' : 'flat', open: tc < 22.15 ? .6 : 0, look: tc < 22.1 ? [.2, .8] : [0, 0], crumbs: bite ? 4 : 0, blink: tc > 22.2 && tc < 22.4 ? 1 : 0, sq: bite ? 1 - .05 * Math.exp(-(tc - 22.2) * 10) : 1 };
      if (bite) { const tk = talk('kid', tc); if (tk) Object.assign(kid.pose, tk); }
      if (tc > 23.35) Object.assign(kid.pose, { mouth: 'grin', open: .5, brows: 'up', look: [0, -.1], tilt: .06, rh: [52, -112], armsFront: false });
      gran.pose = { brows: 'neutral', mouth: 'smile', turn: -.3, look: [-1, 0], lh: [-28, -72], rh: tc > 23.3 ? [44, -150] : [28, -72], bendR: -10, blink: blink(tc, 2) };
    } },
];
const FRAME = { t0: 0, t1: 1, name: 'style frame',
  cam: () => ({ pos: V(.92, 1.12, .62), look: V(.66, .62, -2.05), fov: 44, focus: 2.75, aper: 45 }),
  set() { kid.visible = true; gran.visible = false; kid.pos.set(.22, 0, -1.8); kid.pose = { lh: [-58, -160], rh: [58, -160], bendL: 14, bendR: -14, brows: 'shock', mouth: 'o', open: .8, look: [1, .3], turn: .3, lean: -.06, hatLift: 14 }; } };
const FRAME_T = 11.6, FRAME_CAPS = [{ t0: 0, t1: 99, text: 'No holes?!', hot: true }];
const shotAt = t => QS.has('frame') ? FRAME : SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  const C = S.cam(u);   // the camera first: hands placed with cardLocal depend on it
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  setProps(QS.has('frame') ? FRAME_T : t);
  for (const c of cards) c.glow = 0;
  S.set(u, tc);
  L.setSun(SUN, V(-.6, 1.1, -1.3), 3.6); K.setBeam(SUN);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale - (c.pose.bob ?? 0) / 100, 0)), L.dir);
    const tint = { sunTint: SUN_TINT, shadeTint: SHADE_TINT };
    if (c.glow) tint.sunTint = tint.shadeTint = OVEN_TINT;
    c.update(camera, H, L.dir, { ...tint, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (!QS.has('nocap')) drawCaps(og, QS.has('frame') ? FRAME_CAPS : STORY.caps, t, W, H);   // captions are subtitles: checked through the .srt, not TEXTS
}
// sound events (core/render/events.mjs → events.json, read by mix.py)
const EV = [
  { t: .55, type: 'slap' }, { t: 5.12, type: 'whoosh' }, { t: 5.42, type: 'clang' }, { t: 6.02, type: 'kick' }, { t: 6.12, type: 'slam' },
  { t: 6.5, type: 'ratchet', dur: .3 }, { t: 6.9, type: 'ignite' }, { t: 6.9, type: 'hum', dur: 8.0 },
  ...[7.62, 7.78, 7.92, 8.05, 8.17, 8.28].map((t, i) => ({ t, type: 'blip', i })), { t: 8.35, type: 'stretch', dur: .95 },
  { t: 10.9, type: 'bang' }, { t: 11.0, type: 'hiss', dur: 2.0, gain: .4 }, { t: 11.2, type: 'tick', dur: 3.6 },
  ...[13.05, 13.5].map(t => ({ t, type: 'shuffle' })), { t: 14.0, type: 'poke' }, { t: 14.0, type: 'hiss', dur: .9, gain: 1 }, { t: 14.03, type: 'deflate' },
  ...Array.from({ length: 9 }, (_, k) => ({ t: +(POKE0 + k * POKE_DT).toFixed(3), type: 'tock', k })),
  { t: 20.0, type: 'ding' }, { t: 22.2, type: 'crunch' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS, FX };
render(0);
window.READY = true;
