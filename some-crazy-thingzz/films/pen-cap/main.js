// "Cap Solo" — why do pen caps have a hole? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildDesk } from './desk.js';
import { Card } from './card.js';
import { HAT, HAIR, BACK } from './cast.js';
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
const camera = new THREE.PerspectiveCamera(40, W / H, .005, 200);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .18; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .34; post.vig.uniforms.warm.value = .48; post.vig.uniforms.contrast.value = .25; post.vig.uniforms.sat.value = 1.15;

// a sunny study: the sun from the front-left, a warm room
const L = makeLight(scene, renderer, { sun: '#ffe2b8', sunI: 3.0, sky: '#f0e2cc', ground: '#9a7456', hemiI: 1.2, envI: .5, fog: '#efe2cc' });
const bounce = new THREE.DirectionalLight('#ffe8cc', .45); bounce.position.set(2, 2, 3); scene.add(bounce);
const rim = new THREE.DirectionalLight('#cfe0ff', 1.1); rim.position.set(.6, 2.2, -3); scene.add(rim);   // a cool rim from behind
const K = buildDesk(scene), DY = K.DY;
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(vec3(.45, .33, .24), vec3(.95, .88, .76), smoothstep(-.3, .35, d.y));
    c += vec3(2., 1.9, 1.7) * smoothstep(.8, .95, dot(d, normalize(vec3(-1., .4, .6)))); gl_FragColor = vec4(c, 1.); }` })));
L.bakeEnv = () => { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, .02).texture; scene.environmentIntensity = .55; };

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); T.line([[-14, -102], [-14, -90]], lw * .9, '#d8342a'); } });   // a red pen in the pocket
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
function talk(who, t) {
  t = on12(TNEW);   // voices run on the new (retimed) clock
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;

// —— shots ——
const SUN = V(-.6, .62, .5).normalize();
const G0 = V(-.25, 0, -.55), N0 = V(.3, 0, -.55);
const C0 = K.cap.position.clone(), HOLE0 = C0.clone().add(V(0, .05, 0));
const penHole = () => K.pen.localToWorld(V(.02, .0046, 0));
const ECU = (P, u) => ({ pos: P.clone().add(V(.02, .075 - .006 * ss(u / 2), .075 - .006 * ss(u / 2))), look: P.clone().add(V(0, -.028, 0)), fov: 34, focus: .108 - .008 * ss(u / 2), aper: 26 });
const MOUTH = [-2, -127];
const TOOT = tc => ({ armsFront: true, lh: [MOUTH[0] + 2, MOUTH[1] + 15], bendL: 10, rh: [30, -84], mouth: 'o', open: .08 });   // the cap held upright under the lip, blown across its hole
const SHOTS = [
  { t0: 0, t1: 2.0, name: 'toot CU',   // frame 0: Gus already tooting the cap like a flute; the hole circled; the title slams in
    cam: u => ({ pos: LV(V(-.27, 1.44, .95), V(-.27, 1.44, .85), ss(u / 2)), look: V(-.27, 1.3, -.55), fov: 34, focus: 1.45, aper: 45 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const puff = .5 + .5 * Math.sin(tc * 9);
      gus.pose = { ...TOOT(tc), lprop: { kind: 'cap', ang: 0, ring: 1 }, brows: 'up', look: [-.2, .9], sq: 1 + .03 * puff, tilt: Math.sin(tc * 4) * .04, ...(TNEW > .1 ? (talk('gus') ?? {}) : {}) }; } },
  { t0: 2.0, t1: 6.4, name: 'desk two-shot',   // "Oh, I KNOW this one. It's a tiny flute! Listen!"
    cam: u => ({ pos: LV(V(.03, 1.45, 2.3), V(.02, 1.43, 2.1), ss(u / 4.4)), look: V(.03, 1.14, -.4), fov: 42, focus: 2.3 - .2 * ss(u / 4.4), aper: 50 }),
    set(u, tc) {
      gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const lift = ei(seg(tc, 2.0, 2.3)), toMouth = ei(seg(tc, 4.6, 4.95));
      const hand = toMouth > 0 ? [lerp(-52, MOUTH[0] + 2, toMouth), lerp(-150, MOUTH[1] + 15, toMouth)] : [lerp(-30, -52, lift), lerp(-80, -150, lift)];
      gus.pose = { armsFront: toMouth > .4, lh: hand, bendL: 10, lprop: { kind: 'cap', ang: 0 }, rh: [34, -84], bendR: -8,
        brows: tc < 3.3 ? 'up' : 'angry', mouth: 'smile', look: toMouth > 0 ? [-.2, -.2] : [-.6, -.8], tilt: .04, blink: blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc > 2.05 && tc < 3.3) Object.assign(gus.pose, { turn: .35, look: [1, -.2] });
      if (toMouth > .4) Object.assign(gus.pose, { mouth: 'o', open: .15, brows: 'up', look: [.3, -.6] });
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: tc > 3.6 ? 'skeptic' : 'neutral', mouth: 'flat', look: [-.9, -.1], turn: -.3, blink: blink(tc, 2.6) };
      if (tc > 4.3 && tc < 4.9) { const k = Math.sin(seg(tc, 4.3, 4.9) * Math.PI); Object.assign(nana.pose, { brows: 'shock', mouth: 'o', open: .4, sq: 1 + .06 * k, look: [-1, -.3] }); }   // a double take at "Listen!"
    } },
  { t0: 6.4, t1: 8.6, name: 'mug',   // the squeal; the mug cracks
    cam: u => ({ pos: LV(V(.6, .95, .66), V(.58, .95, .58), ss(u / 2.2)), look: V(-.05, 1.05, -.55), fov: 50, focus: .9, aper: 12 }),
    set(u, tc) {
      gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const blow = tc > 6.55 && tc < 7.85, sh = blow ? (hash(Math.floor(tc * 12)) - .5) : 0;
      gus.pose = { ...TOOT(tc), lprop: { kind: 'cap', ang: 0 }, brows: blow ? 'angry' : 'up', look: [0, -.3], sq: 1 + (blow ? .05 : 0), tilt: sh * .05 };
      if (tc > 7.9) Object.assign(gus.pose, { brows: 'worried', look: [1, .6], turn: .4 });
      nana.pose = tc < 6.75 ? { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'skeptic', mouth: 'flat', look: [-.9, -.1], turn: -.3 }
        : { lh: [-34, -146], rh: [34, -146], bendL: 14, bendR: -14, brows: 'shock', mouth: 'teeth', look: [-.6, 0], sq: 1 - .03 * Math.abs(sh) };
      if (tc > 7.7) Object.assign(nana.pose, { lh: [-24, -60], rh: [24, -60], bendL: -16, bendR: 16, brows: 'angry', mouth: 'flat', look: [0, .8], turn: 0 });
    } },
  { t0: 8.6, t1: 10.0, name: 'Gus CU',   // sheepish; WRONG
    cam: u => ({ pos: LV(V(-.27, 1.42, 1.25), V(-.27, 1.42, 1.15), ss(u / 1.4)), look: V(-.27, 1.34, -.55), fov: 34, focus: 1.75, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { lh: [-52, -140], bendL: 10, lprop: { kind: 'cap', ang: 0 }, rh: [30, -84], brows: 'worried', mouth: 'teeth', look: [1, .2], turn: .3, tilt: -.05, blink: blink(tc, 1) };
      if (tc > 9.2) Object.assign(gus.pose, { look: [0, 0], turn: 0, brows: 'worried', mouth: 'frown', sq: .97 });
    } },
  { t0: 10.0, t1: 11.2, name: 'Nana CU',   // "Actually…"
    cam: u => ({ pos: LV(V(.32, 1.24, 1.15), V(.32, 1.24, 1.03), ss(u / 1.2)), look: V(.3, 1.14, -.55), fov: 34, focus: 1.65, aper: 45 }),
    set(u, tc) {
      gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const push = ei(seg(tc, 10.05, 10.35));
      nana.pose = { armsFront: tc < 10.6 && push > .3, lh: [-30, -76], rh: tc < 10.6 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, blink: tc > 10.95 && tc < 11.05 ? 1 : 0, ...(talk('nana', tc) ?? {}) };
    } },
  { t0: 11.2, t1: 19.2, name: 'model',   // the clear-tube model: air stops under the solid cap, gets through the hole
    cam: u => { const k = ss(u / 8); return { pos: V(0, DY + .25 - .02 * k, .98 - .12 * k), look: V(0, DY + .13, -.02), fov: 40, focus: .9 - .12 * k, aper: 22 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 19.2, t1: 22.2, name: 'pluck',   // "So please, stop chewing caps."
    cam: u => ({ pos: LV(V(-.1, 1.3, 1.85), V(-.1, 1.3, 1.7), ss(u / 3)), look: V(-.1, 1.1, -.55), fov: 42, focus: 2.3, aper: 50 }),
    set(u, tc) {
      gus.visible = nana.visible = true; gus.pos.copy(G0); const walk = ei(seg(tc, 19.2, 19.5)); nana.pos.set(lerp(.3, .12, walk), 0, -.55);
      const pluck = tc >= 19.55, up = ei(seg(tc, 19.6, 19.9));
      gus.pose = { armsFront: !pluck, lh: pluck ? [-34, -84] : [MOUTH[0] + 2, MOUTH[1] + 15], lprop: pluck ? null : { kind: 'cap', ang: 0 }, rh: [34, -84], brows: pluck ? 'worried' : 'up', mouth: pluck ? 'frown' : 'teeth', look: [1, .1], turn: .3, blink: blink(tc, 1) };
      if (pluck && tc < 19.75) Object.assign(gus.pose, { mouth: 'o', open: .7, sq: 1.04 });
      if (tc > 21.2) {   // the second laugh: while Nana talks, Gus sneaks a spare cap out of his pocket and back into his mouth
        const k = ei(seg(tc, 21.2, 21.6));
        Object.assign(gus.pose, { armsFront: k > .6, lh: [lerp(-14, MOUTH[0] + 2, k), lerp(-90, MOUTH[1] + 15, k)], lprop: { kind: 'cap', ang: 0 }, mouth: k > .6 ? 'o' : 'smile', open: .08, brows: 'up', look: [-.4, .6], turn: -.2 });
      }
      const reach = ei(seg(tc, 19.35, 19.55));
      nana.pose = { lh: pluck ? [lerp(-52, -30, up), lerp(-118, -150, up)] : [lerp(-30, -52, reach), lerp(-80, -118, reach)], bendL: -10, lprop: pluck ? { kind: 'cap', ang: 0 } : null, rh: [26, -60], bendR: 16,
        brows: 'angry', mouth: 'flat', look: [-1, -.2], turn: -.4, blink: blink(tc, 2), ...(talk('nana', tc) ?? {}) };
      if (tc > 21.75) Object.assign(nana.pose, { brows: 'angry', mouth: 'teeth', look: [-1, .1], sq: 1 + .05 * Math.exp(-(tc - 21.75) * 8) });   // she catches him
    } },
  { t0: 22.2, t1: 25.0, name: 'pen CU',   // "Wait. Why does the pen have a hole?"
    cam: u => ({ pos: LV(V(-.5, 1.42, 1.3), V(-.5, 1.42, 1.2), ss(u / 2.8)), look: V(-.5, 1.32, -.55), fov: 34, focus: 1.75, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const lift = ei(seg(tc, 22.25, 22.55));
      gus.pose = { lh: [lerp(-30, -46, lift), lerp(-84, -126, lift)], bendL: 10, lprop: { kind: 'pen', ang: -.25, ring: clamp((tc - 23.0) / .3) }, rh: [32, -84], brows: tc < 22.6 ? 'neutral' : 'up', mouth: 'flat', look: [-1, -.6], turn: -.3, blink: blink(tc, 3), ...(talk('gus', tc) ?? {}) };
      if (tc > 24.5) Object.assign(gus.pose, { brows: 'skeptic', mouth: 'o', open: .3 });
    } },
  { t0: 25.0, t1: 26.8, name: 'pen toot',   // framed like frame 0: Gus raises the pen to his lips, about to toot its hole → the cut
    cam: u => ({ pos: LV(V(-.27, 1.44, 1.05), V(-.27, 1.44, .95), ss(u / 1.8)), look: V(-.27, 1.3, -.55), fov: 34, focus: 1.5, aper: 45 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const up = ei(seg(tc, 25.0, 25.6));
      gus.pose = { armsFront: up > .5, lh: [lerp(-46, MOUTH[0] + 4, up), lerp(-126, MOUTH[1] + 6, up)], bendL: 10, lprop: { kind: 'pen', ang: lerp(-.25, Math.PI / 2, up), ring: clamp((tc - 25.7) / .3) }, rh: [30, -84],
        brows: 'up', mouth: up > .8 ? 'o' : 'grin', open: up > .8 ? .08 : .4, look: [-.2, .8], blink: blink(tc, 2), sq: 1 + (tc > 26.4 ? .04 : 0) }; } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

function setProps(t) {
  const S = shotAt(t);
  for (const o of K.backRow) o.visible = ['model'].includes(S.name);
  K.cap.visible = S.name === 'ECU cap'; K.cap.rotation.set(Math.sin(t * 9) * .02 * Math.exp(-t), t * .9 + .4, 0);
  K.rig.visible = S.name === 'model'; K.updateMotes(t);
  K.crack(t >= 7.6);
  const pk = clamp((t - 7.7) / .9); K.puddle.visible = t >= 7.7; K.puddle.scale.set(.02 + .1 * eo(pk), .015 + .07 * eo(pk), 1);
  K.mug.position.y = DY + (t > 7.6 && t < 7.7 ? .002 * Math.sin(t * 300) : 0);
}

// —— overlays ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function ring(P, t, t0) {
  const k = clamp(.4 + (t - t0) / .5);
  const c = proj(P), e = proj(P.clone().add(V(.006, 0, 0))), Rp = Math.max(60, Math.abs(c[0] - e[0]) * 1.3);
  og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = c[0] + Math.cos(a0 + a) * Rp * w, y = c[1] + Math.sin(a0 + a) * Rp * .8 * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function title(t) {   // the question, slammed in big at the top in the first second
  if (t > 1.5) return;
  const k = 1, s = t < .09 ? lerp(1.08, 1, ei(clamp(t / .09))) : 1 + .02 * Math.exp(-(t - .18) * 8) * Math.cos((t - .18) * 30), out = clamp((1.5 - t) / .12);
  og.save(); og.translate(W / 2, H * .24); og.scale(s, s); og.globalAlpha = Math.min(k * 2, out); og.rotate(-.03);
  og.font = '800 112px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  for (const [txt, y] of [['WHY DO PEN CAPS', -64], ['HAVE A HOLE?', 64]]) { og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, y); og.fillText(txt, 0, y); og.restore(); og.strokeText(txt, 0, y); og.fillStyle = y > 0 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, y); }
  og.restore();
}
function burst(cx, cy, t, t0, col = '#ffffff') {   // impact: a 2-frame flash and radial burst lines
  const k = t - t0; if (k < 0 || k > .35) return;
  og.save();
  if (k < .085) { og.fillStyle = `rgba(255,255,255,${k < .042 ? .85 : .4})`; og.fillRect(0, 0, W, H); }
  og.strokeStyle = col; og.lineCap = 'round'; og.lineWidth = 14 * (1 - k / .35); og.globalAlpha = 1 - k / .35;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .2, r0 = 90 + k * 500, r1 = r0 + 120; og.beginPath(); og.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); og.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); og.stroke(); }
  og.restore();
}
function sweat(card, t, t0) {   // a sweat drop sliding down beside the head
  const k = t - t0; if (k < 0) return;
  const head = proj(card.pos.clone().add(V(.26 * card.scale, 1.52 * card.scale, .02))), y = head[1] + Math.min(1, k / .8) * 60;
  og.save(); og.fillStyle = '#8fd0ff'; og.strokeStyle = '#1c1418'; og.lineWidth = 6; og.beginPath(); og.moveTo(head[0], y - 46); og.quadraticCurveTo(head[0] + 28, y + 6, head[0], y + 18); og.quadraticCurveTo(head[0] - 28, y + 6, head[0], y - 46); og.fill(); og.stroke(); og.restore();
}
function anger(card, t, t0) {   // little steam puffs above the head
  const k = t - t0; if (k < 0) return;
  for (const s of [-1, 1]) { const c = proj(card.pos.clone().add(V(s * .2 * card.scale, 1.72 * card.scale + ((k * .3) % .15), .02))); og.save(); og.globalAlpha = .9 - ((k * 2) % 1) * .6; og.fillStyle = '#ffffff'; og.strokeStyle = '#1c1418'; og.lineWidth = 5;
    for (const [dx, dy, r] of [[0, 0, 22], [18, -14, 16], [-16, -12, 14]]) { og.beginPath(); og.arc(c[0] + dx * s, c[1] + dy, r, 0, 7); og.fill(); og.stroke(); } og.restore(); }
}
function speed(t, t0, dur) {   // horizontal speed lines for the whip pan
  const k = (t - t0) / dur; if (k < 0 || k > 1) return;
  og.save(); og.globalAlpha = Math.sin(Math.PI * k) * .85; og.strokeStyle = '#ffffff'; og.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const y = hash(i * 3.3) * H, x = (hash(i * 7.1) * 1.4 - .2) * W - k * 600, l = 200 + hash(i) * 500; og.lineWidth = 4 + hash(i * 1.9) * 10; og.beginPath(); og.moveTo(x, y); og.lineTo(x + l, y); og.stroke(); }
  og.restore();
}
function pow(txt, x, y, t, t0, dur, col = '#ffd84a', rot = -.12) {   // comic sound words, so muted viewers get every beat
  const k = t - t0; if (k < 0 || k > dur) return;
  const sc = k < .1 ? lerp(1.5, 1, ei(k / .1)) : 1 + .03 * Math.sin(k * 30);
  og.save(); og.translate(x, y); og.rotate(rot); og.scale(sc, sc); og.globalAlpha = Math.min(1, (dur - k) / .15);
  og.font = '800 120px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = 26; og.strokeStyle = '#1c1418'; og.strokeText(txt, 0, 0); og.fillStyle = col; og.fillText(txt, 0, 0);
  og.restore();
}
function stamp(t) {
  const k = t - 9.2; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .22); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}
function squealAt(t, t0) {   // sound lines from the cap at Gus's mouth (close-ups)
  const c = proj(V(G0.x - .01, 1.25, G0.z + .03));
  og.save(); og.strokeStyle = '#ffffff'; og.lineWidth = 12; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.45)'; og.shadowBlur = 8;
  for (let i = 0; i < 3; i++) { const r = 110 + (((t - t0) * 420 + i * 90) % 270); og.globalAlpha = 1 - r / 400; for (const [lw, col] of [[22, '#1c1418'], [11, '#ffffff']]) { og.lineWidth = lw; og.strokeStyle = col; og.beginPath(); og.arc(c[0], c[1], r, -.45, .45); og.stroke(); og.beginPath(); og.arc(c[0], c[1], r, Math.PI - .45, Math.PI + .45); og.stroke(); } }
  og.restore();
}
function squeal(t) {   // sound lines from the cap while Gus blows
  if (t < 6.55 || t > 7.85) return;
  const c = proj(V(G0.x - .01, 1.25, G0.z + .02));
  og.save(); og.strokeStyle = '#ffffff'; og.lineWidth = 9; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.4)'; og.shadowBlur = 6;
  for (let i = 0; i < 3; i++) { const r = 60 + ((t * 300 + i * 60) % 180); og.globalAlpha = 1 - r / 260; og.beginPath(); og.arc(c[0], c[1], r, -.5, .5); og.stroke(); og.beginPath(); og.arc(c[0], c[1], r, Math.PI - .5, Math.PI + .5); og.stroke(); }
  og.restore();
}
function air(t) {   // the model: air dots rising in both tubes; labels; ✕ and ✓
  const T = K.TUBE, rig = K.rig.position, A = clamp((t - 11.5) / .4);
  const lab = (txt, col, x, y, a) => { og.save(); og.globalAlpha = a; og.font = '800 72px Baloo2'; og.textAlign = 'center'; og.lineJoin = 'round'; og.lineWidth = 14; og.strokeStyle = '#000'; og.fillStyle = col; og.strokeText(txt, x, y); og.fillText(txt, x, y); og.restore(); };
  for (const [i, x] of T.x.entries()) {
    const top = proj(rig.clone().add(V(x, T.y0 + T.h + .02, 0)));
    lab(i ? 'HOLE' : 'NO HOLE', i ? '#7be07b' : '#ff6a50', top[0], top[1] - 30, A);
    if (t < 11.6) continue;
    for (let k = 0; k < 18; k++) {
      const sp = .07, ph = ((t - 11.6) * sp + k / 18 * .34) % .34, y = .035 + ph, ox = (hash(k * 3.1 + i) - .5) * T.r * 1.4;
      let px = ox, py = y, al = 1;
      if (i === 0) { if (y > .158) { py = .158 - (hash(k * 7.7) * .015) + Math.sin(t * 20 + k) * .002; al = clamp(1 - (y - .158) / .1); } }
      else { if (y > .16 && y < .27) px = ox * (1 - (y - .16) / .11); else if (y >= .27) px = ox * clamp((y - .27) / .06) * .6; }
      if ((t - 11.6) * sp < ph) continue;   // dots start at the bottom
      const P = rig.clone().add(V(x + px, py, .0)), [sx, sy] = proj(P);
      og.fillStyle = `rgba(170,225,255,${.9 * al})`; og.beginPath(); og.arc(sx, sy, 9, 0, Math.PI * 2); og.fill();
    }
  }
  const capTop = i => proj(rig.clone().add(V(T.x[i], .23, .04)));
  if (t > 13.2) { const [x, y] = capTop(0), s = 46 * clamp((t - 13.2) / .15); og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 18; og.lineCap = 'round'; og.beginPath(); og.moveTo(x - s, y - s); og.lineTo(x + s, y + s); og.moveTo(x + s, y - s); og.lineTo(x - s, y + s); og.stroke(); og.restore(); }
  if (t > 14.7) { const [x, y] = proj(rig.clone().add(V(T.x[1], .33, .04))), s = 40 * clamp((t - 14.7) / .15); og.save(); og.strokeStyle = '#3fcf5a'; og.lineWidth = 18; og.lineCap = 'round'; og.beginPath(); og.moveTo(x + s * 1.4, y - s); og.lineTo(x - s * .2, y + s * .9); og.lineTo(x - s * .9, y + s * .1); og.stroke(); og.restore(); }
}

// Retention retime (27 Nov playbook): the film was blocked on an older, slower clock; WARP maps the new clock to it, shot by shot.
const WARP = [[0, 1.5, 0, 1.5], [1.5, 3.3, 3.3, 5.1], [3.3, 4.8, 6.4, 8.6], [4.8, 6.2, 8.6, 10.0], [6.2, 7.4, 10.0, 11.2], [7.4, 16.4, 11.2, 19.2], [16.4, 19.6, 19.2, 22.2], [19.6, 23.0, 22.2, 25.0], [23.0, 25.01, 25.0, 26.8]];
const warp = t => { for (const [n0, n1, o0, o1] of WARP) if (t < n1) return o0 + (Math.max(t, n0) - n0) / (n1 - n0) * (o1 - o0); return 26.8; };
let TNEW = 0;
const warpInv = o => { for (const [n0, n1, o0, o1] of WARP) if (o < o1) return +(n0 + (o - o0) / (o1 - o0) * (n1 - n0)).toFixed(3); return 25; };
let texts = [];
function render(tn) {
  TNEW = tn; const t = warp(tn);
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(t);
  const C = S.cam(u);
  const dist = C.pos.distanceTo(C.look), dr = .006 * dist;   // a gentle handheld drift
  C.pos.add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look.add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0));
  if (S.name === 'model' && u < .3) { const w = (1 - ei(u / .3)) * .5; C.pos.x += w; C.look.x += w; }
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(u, tc);
  L.setSun(SUN, V(0, 1, -.5), 4);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper * .45;   // the density pass: keep the dressed set readable post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (S.name === 'toot CU' || (S.name === 'pen toot' && t > 26.4)) squealAt(t, S.name === 'toot CU' ? 0 : 26.4);
  if (S.name === 'mug') { pow('SQUEEEE!', W * .38, H * .2, t, 6.55, 1.05, '#ffffff', -.1); pow('CRACK!', W * .62, H * .5, t, 7.6, .95, '#ffd84a', .12); squeal(t); const m = proj(K.mug.position.clone().add(V(0, .06, 0))); burst(m[0], m[1], t, 7.6); anger(nana, t, 7.8); }
  if (S.name === 'Gus CU') { stamp(t); const c = proj(V(0, 1.2, -.55)); burst(W / 2, H * .22, t, 9.2, '#ff6a50'); sweat(gus, t, 9.35); }
  if (S.name === 'model') { air(t); speed(t, 11.2, .3); }
  if (S.name === 'pluck') pow('POP!', W * .3, H * .3, t, 19.55, .6, '#ffffff', -.15);
  if (S.name === 'pluck') burst(...proj(V(G0.x + .02, 1.45, G0.z + .03)), t, 19.55, '#ffffff');
  if (S.name === 'toot CU') title(t);
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(tn, STORY.caps[0].t0), W, H);
}
const EV = [
  { t: 0, type: 'toot', dur: .3 }, { t: 0, type: 'boing' }, { t: 2.8, type: 'pick' }, { t: 24.6, type: 'toot', dur: .4 }, { t: 7.35, type: 'whip' },
  { t: 3.4, type: 'squeal', dur: .95 }, { t: 4.1, type: 'crack' }, { t: 4.2, type: 'drip', dur: .6 }, { t: 4.8, type: 'cricket', dur: .5 }, { t: 5.4, type: 'buzzer' }, { t: 5.4, type: 'stamp' },
  { t: 7.7, type: 'air', dur: 8.4 }, { t: warpInv(13.2), type: 'bonk' }, { t: warpInv(14.7), type: 'ding' }, { t: warpInv(19.55), type: 'pop' }, { t: warpInv(23.0), type: 'blip' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS };
render(0);
window.READY = true;
