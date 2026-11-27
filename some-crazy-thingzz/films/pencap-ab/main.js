// "Cap Check" — why do pen caps have a hole? Two versions for comparison: ?v=A (blown by mouth, THROAT label text) and ?v=B (taped cap, mini fan, no text at 6–11 s).
// Toon on Set, 1080×1920, 24 fps. Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Clarity rules (ideas/CLARITY_AUDIT.md): one text layer at a time, captions ≤ 6 words held ≥ words/3 + .3 s, the answer held still 2 s, no extra gags or sound words.
// Debug: ?fast · ?ssaa=1.5 · ?nocap · ?dur=1 · ?v=A|B
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildDesk } from './desk.js';
import { Card } from './card.js';
import { HAT, HAIR, BACK } from './cast.js';
import { drawCaps } from './caps.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search), VB = (QS.get('v') ?? 'A').toUpperCase() === 'B';
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

const L = makeLight(scene, renderer, { sun: '#ffe2b8', sunI: 3.0, sky: '#f0e2cc', ground: '#9a7456', hemiI: 1.2, envI: .5, fog: '#efe2cc' });
const bounce = new THREE.DirectionalLight('#ffe8cc', .45); bounce.position.set(2, 2, 3); scene.add(bounce);
const rim = new THREE.DirectionalLight('#cfe0ff', 1.1); rim.position.set(.6, 2.2, -3); scene.add(rim);
const K = buildDesk(scene), DY = K.DY;
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(vec3(.45, .33, .24), vec3(.95, .88, .76), smoothstep(-.3, .35, d.y));
    c += vec3(2., 1.9, 1.7) * smoothstep(.8, .95, dot(d, normalize(vec3(-1., .4, .6)))); gl_FragColor = vec4(c, 1.); }` })));
L.bakeEnv = () => { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, .02).texture; scene.environmentIntensity = .55; };

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); } });   // the shirt pocket
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
  t = on12(t);
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;

// —— places ——
const SUN = V(-.6, .62, .5).normalize();
const G0 = V(-.25, 0, -.55), N0 = V(.3, 0, -.55);
const C0 = K.cap.position.clone(), HOLE0 = C0.clone().add(V(0, .05, 0));
const MOUTH = [-2, -127];
// a point in Nana's drawing (cm, feet at 0, up = −y) → world (her card faces the camera; good enough for framing)
const nanaPt = (x, y) => V(N0.x + x / 100 * nana.scale, -y / 100 * nana.scale, N0.z);
// Nana's tube grips (left hand): at her side, and lifted with the bottom end at her mouth (A only)
const GRIP_SIDE = [-38, -100], GRIP_MOUTH = [-2, -141];
const TUBE_WAIST = -16, TUBE_TOP = -52;   // in the tube's own frame (see cast.js TUBE)

const SHOTS = [
  { t0: 0, t1: 3.2, name: 'whistle',   // Gus blows across the cap like a whistle, then shows it off: "Pen caps have a hole so they're whistles!"
    cam: u => ({ pos: LV(V(-.27, 1.42, 1.0), V(-.27, 1.42, .92), ss(u / 3.2)), look: V(-.27, 1.3, -.55), fov: 34, focus: 1.5, aper: 45 }),
    set(t) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const show = ei(seg(t, .32, .6));
      const hand = [lerp(MOUTH[0] + 2, -44, show), lerp(MOUTH[1] + 22, -138, show)];
      gus.pose = { armsFront: show < .5, lh: hand, bendL: 10, lprop: { kind: 'cap', big: true }, rh: [30, -84], brows: 'up', look: show < .5 ? [-.2, .9] : [-.6, -.3], turn: show * .15,
        mouth: show < .5 ? 'o' : 'grin', open: show < .5 ? .08 : .3, sq: 1 + (t < .32 ? .03 * Math.sin(t * 40) : 0), blink: blink(t, 1), ...(t > .35 ? (talk('gus', t) ?? {}) : {}) }; } },
  { t0: 3.2, t1: 6.3, name: 'enter',   // Nana walks in shaking her head: "Nope, Gus." — "Then what's it for?"
    cam: u => ({ pos: LV(V(.03, 1.42, 2.25), V(.03, 1.41, 2.1), ss(u / 3.1)), look: V(.03, 1.12, -.4), fov: 42, focus: 2.3, aper: 50 }),
    set(t) { gus.visible = nana.visible = true; gus.pos.copy(G0);
      const walk = eo(seg(t, 3.2, 3.75)); nana.pos.set(lerp(.95, .3, walk), 0, -.55);
      const shake = t > 3.3 && t < 4.35 ? Math.sin((t - 3.3) * 15) : 0;
      nana.pose = { lh: [-30, -76], rh: [30, -76], bendL: 12, bendR: -12, lf: walk < 1 ? [-13 + Math.sin(t * 22) * 6, -3] : [-13, -3], rf: walk < 1 ? [13 - Math.sin(t * 22) * 6, -3] : [13, -3], bob: walk < 1 ? -Math.abs(Math.sin(t * 22)) * 2 : 0,
        brows: 'skeptic', mouth: 'flat', look: [-.9, -.1] , turn: -.3 + shake * .25, tilt: shake * .06, blink: blink(t, 2.6), ...(talk('nana', t) ?? {}) };
      const ask = ei(seg(t, 4.45, 4.75));
      gus.pose = { lh: [lerp(-44, -44, ask), lerp(-138, -112, ask)], bendL: 10, lprop: { kind: 'cap', big: true }, rh: [lerp(30, 44, ask), lerp(-84, -110, ask)], bendR: -10,
        brows: t < 4.45 ? 'worried' : 'up', mouth: t < 4.45 ? 'frown' : 'flat', look: [1, -.1], turn: .3, blink: blink(t, 1), ...(talk('gus', t) ?? {}) }; } },
  { t0: 6.3, t1: VB ? 11.0 : 11.0, name: 'tube',   // Nana holds up the clear tube with its THROAT tag: "Pretend this tube is a throat."
    cam: u => ({ pos: LV(V(.2, 1.2, 1.15), V(.2, 1.2, 1.05), ss(u / 4.7)), look: V(.2, 1.12, -.55), fov: 36, focus: 1.65, aper: 45 }),
    set(t) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const up = eo(seg(t, 6.3, 6.6)), pt = ei(seg(t, 6.9, 7.2));
      nana.pose = { lh: [GRIP_SIDE[0], lerp(-70, GRIP_SIDE[1], up)], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t }, rh: [lerp(30, -14, pt), lerp(-76, -112, pt)], bendR: -16,
        brows: 'neutral', mouth: 'smile', look: [-.3, -.1], turn: -.1, blink: blink(t, 2), ...(talk('nana', t) ?? {}) }; } },
  ...(VB ? [{ t0: 11.0, t1: 12.2, name: 'tape',   // B: the cap, wrapped in a band of clear tape so it fits the tube snugly (close on her hand)
    cam: u => { const P = nanaPt(-20, -152); return { pos: P.clone().add(V(0, 0, .42 - .03 * ss(u / 1.2))), look: P, fov: 34, focus: .42, aper: 30 }; },
    set(t) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      nana.pose = { lh: [...GRIP_SIDE], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t }, rh: [-20, -142], bendR: -16, rprop: { kind: 'cap', tape: true, ang: Math.sin(t * 5) * .12 },
        brows: 'neutral', mouth: 'smile', look: [-.5, -.4], turn: -.1, ...(talk('nana', t) ?? {}) }; } }] : []),
  { t0: VB ? 12.2 : 11.0, t1: 13.4, name: 'drop',   // both: Nana drops the cap into the tube; it sticks at the narrow part; Gus jumps
    cam: u => ({ pos: LV(V(.05, 1.3, 1.65), V(.05, 1.3, 1.55), ss(u / 2.4)), look: V(.05, 1.12, -.5), fov: 40, focus: 2.1, aper: 50 }),
    set(t) { gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const tD = 12.1, fall = clamp((t - tD) / .28), capY = t < tD ? null : lerp(TUBE_TOP - 18, TUBE_WAIST, fall * fall) - (fall >= 1 ? 1.5 * Math.exp(-(t - tD - .28) * 14) * Math.sin((t - tD - .28) * 40) : 0);
      const lift = ei(seg(t, VB ? 12.2 : 11.1, (VB ? 12.2 : 11.1) + .35));
      nana.pose = { lh: [...GRIP_SIDE], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t, capY, tape: VB }, rh: [lerp(-20, -38, lift), lerp(-142, -172, lift)], bendR: -16,
        rprop: t < tD ? { kind: 'cap', big: true, tape: VB } : null, brows: 'neutral', mouth: 'flat', look: [-.4, -.6], turn: -.15, blink: blink(t, 2), ...(talk('nana', t) ?? {}) };
      if (t >= tD) Object.assign(nana.pose, { rh: [lerp(-38, -12, ei(seg(t, tD + .3, tD + .7))), lerp(-172, -110, ei(seg(t, tD + .3, tD + .7)))] });
      const jump = t > 12.4 && t < 12.85 ? Math.sin((t - 12.4) / .45 * Math.PI) : 0;
      gus.pose = { lh: [-34, -84], rh: [34, -84], bendL: 10, bendR: -10, lprop: null, brows: t > 12.4 ? 'shock' : 'up', mouth: t > 12.4 ? 'o' : 'flat', open: .5, look: [1, -.4], turn: .3, bob: -jump * 14, sq: 1 + jump * .05, blink: blink(t, 1) };
      if (jump > 0) Object.assign(gus.pose, { lh: [-46, -146], rh: [46, -146] }); } },
  { t0: 13.4, t1: 15.4, name: 'stuck',   // close on the tube: "…it can get stuck here."
    cam: u => { const P = nanaPt(GRIP_SIDE[0], GRIP_SIDE[1] + TUBE_WAIST); return { pos: P.clone().add(V(0, .01, .5 - .04 * ss(u / 2))), look: P, fov: 34, focus: .5, aper: 30 }; },
    set(t) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      nana.pose = { lh: [...GRIP_SIDE], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t, capY: TUBE_WAIST, tape: VB }, rh: [-12, -110], bendR: -16, brows: 'neutral', mouth: 'flat', look: [-.4, -.4], turn: -.15, ...(talk('nana', t) ?? {}) }; } },
  { t0: 15.4, t1: 17.5, name: 'blow',   // A: she lifts the tube to her mouth and blows · B: she switches on a mini fan under the tube
    cam: u => ({ pos: LV(V(.2, 1.28, 1.35), V(.2, 1.28, 1.25), ss(u / 2.1)), look: V(.2, 1.2, -.55), fov: 36, focus: 1.85, aper: 45 }),
    set(t) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const air = clamp((t - 16.95) / .2);
      if (!VB) {
        const lift = ei(seg(t, 16.45, 16.9)), g = [lerp(GRIP_SIDE[0], GRIP_MOUTH[0], lift), lerp(GRIP_SIDE[1], GRIP_MOUTH[1], lift)];
        nana.pose = { armsFront: lift > .5, lh: g, bendL: 14, lprop: { kind: 'throat', tagSide: -1, t, capY: TUBE_WAIST, air }, rh: [30, -76], bendR: -12, brows: 'neutral', mouth: 'flat', look: [-.3, -.2], turn: -.1, blink: blink(t, 2), ...(talk('nana', t) ?? {}) };
        if (t > 16.9) Object.assign(nana.pose, { mouth: 'o', open: .1, sq: 1.02, brows: 'up' });
      } else {
        const fan = ei(seg(t, 16.3, 16.75));
        nana.pose = { lh: [...GRIP_SIDE], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t, capY: TUBE_WAIST, tape: true, air }, rh: [lerp(30, GRIP_SIDE[0], fan), lerp(-76, GRIP_SIDE[1] + 30, fan)], bendR: -14,
          rprop: fan > 0 ? { kind: 'fan', on: t > 16.95, spin: t * 30 } : null, brows: 'neutral', mouth: 'flat', look: [-.4, .3], turn: -.1, blink: blink(t, 2), ...(talk('nana', t) ?? {}) };
      } } },
  { t0: 17.5, t1: 20.0, name: 'air',   // close on the tube: air squeezes through the cap's hole; the paper strip at the top flutters
    cam: u => { const g = VB ? GRIP_SIDE : GRIP_MOUTH, P = nanaPt(g[0], g[1] + (TUBE_WAIST + TUBE_TOP - 12) / 2); return { pos: P.clone().add(V(0, .01, .78 - .04 * ss(u / 2.5))), look: P, fov: 34, focus: .78, aper: 30 }; },
    set(t) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const pr = { kind: 'throat', tagSide: -1, t, capY: TUBE_WAIST, tape: VB, air: 1 };
      nana.pose = VB ? { lh: [...GRIP_SIDE], bendL: 14, lprop: pr, rh: [GRIP_SIDE[0], GRIP_SIDE[1] + 30], bendR: -14, rprop: { kind: 'fan', on: true, spin: t * 30 }, brows: 'neutral', mouth: 'flat', look: [-.4, -.6], turn: -.1 }
        : { armsFront: true, lh: [...GRIP_MOUTH], bendL: 14, lprop: pr, rh: [30, -76], bendR: -12, brows: 'up', mouth: 'o', open: .1, sq: 1.02, look: [-.2, -.8], turn: -.1 }; } },
  { t0: 20.0, t1: 23.3, name: 'hole',   // the answer, held still: the hole in a real cap, an arrow at it
    cam: () => ({ pos: HOLE0.clone().add(V(.02, .06, .075)), look: HOLE0.clone().add(V(0, -.012, 0)), fov: 34, focus: .1, aper: 26 }),
    still: true, set(t) { gus.visible = nana.visible = false; } },
  { t0: 23.3, t1: 99, name: 'end',   // Gus looks at the cap, pockets it; Nana nods
    cam: u => ({ pos: LV(V(.03, 1.42, 2.2), V(.03, 1.41, 2.0), ss(u / 8)), look: V(.03, 1.12, -.4), fov: 42, focus: 2.2, aper: 50 }),
    set(t) { gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const pocket = ei(seg(t, 25.3, 25.8)), held = t < 25.75;
      gus.pose = { lh: [lerp(-44, -12, pocket), lerp(-132, -92, pocket)], bendL: 10, lprop: held ? { kind: 'cap', big: true } : null, rh: [34, -84], bendR: -8,
        brows: t < 25.3 ? 'worried' : 'neutral', mouth: 'flat', look: t < 25.3 ? [-.8, .3] : [1, -.1], turn: t < 25.3 ? -.15 : .3, blink: blink(t, 1), ...(talk('gus', t) ?? {}) };
      if (t > 25.9) Object.assign(gus.pose, { lh: [-12, -88], mouth: talk('gus', t) ? gus.pose.mouth : 'smile' });
      const nod = t > 26.85 && t < 28.6 ? Math.sin((t - 26.85) * 9) : 0;
      nana.pose = { lh: [-34, -80], bendL: 14, lprop: { kind: 'throat', tagSide: -1, t, capY: TUBE_WAIST, tape: VB, ang: .5 }, rh: [30, -76], bendR: -12,
        brows: 'neutral', mouth: 'smile', look: [-.9, .05 + nod * .35], turn: -.3, bob: Math.abs(nod) * 1.5, blink: blink(t, 2.6), ...(talk('nana', t) ?? {}) }; } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

function setProps(t, S) {
  for (const o of K.backRow) o.visible = false;
  K.rig.visible = false; K.updateMotes(t); K.crack(false); K.puddle.visible = false;
  K.cap.visible = S.name === 'hole'; K.cap.rotation.set(0, .4, 0);
}

// —— overlays ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function words(lines, t, t0, t1, y = H * .2, size = 104) {   // the one text layer: a headline or a label, slammed in, held, gone
  if (t < t0 || t >= t1) return;
  const k = t - t0, s = k < .09 ? lerp(1.08, 1, ei(clamp(k / .09))) : 1 + .02 * Math.exp(-(k - .18) * 8) * Math.cos((k - .18) * 30), out = clamp((t1 - t) / .12);
  og.save(); og.translate(W / 2, y); og.scale(s, s); og.globalAlpha = out; og.rotate(-.02);
  og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const fit = Math.min(1, 940 / Math.max(...lines.map(l => og.measureText(l).width))); og.scale(fit, fit);
  lines.forEach((txt, i) => { const yy = (i - (lines.length - 1) / 2) * size * 1.18; og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, yy); og.fillText(txt, 0, yy); og.restore(); og.strokeText(txt, 0, yy); og.fillStyle = i === lines.length - 1 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, yy); });
  og.restore();
}
function ring(c, t, t0, R = 70) {
  const k = clamp((t - t0) / .4); if (k <= 0) return;
  og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = c[0] + Math.cos(a0 + a) * R * w, y = c[1] + Math.sin(a0 + a) * R * .8 * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function arrow(x0, y0, x1, y1, col, a = 1, lw = 22) {
  og.save(); og.globalAlpha = a; og.lineCap = 'round'; og.lineJoin = 'round';
  const ang = Math.atan2(y1 - y0, x1 - x0), hd = 52;
  for (const [c, w] of [['#1c1418', lw + 14], [col, lw]]) { og.strokeStyle = c; og.lineWidth = w; og.beginPath(); og.moveTo(x0, y0); og.lineTo(x1, y1); og.moveTo(x1 - Math.cos(ang - .5) * hd, y1 - Math.sin(ang - .5) * hd); og.lineTo(x1, y1); og.lineTo(x1 - Math.cos(ang + .5) * hd, y1 - Math.sin(ang + .5) * hd); og.stroke(); }
  og.restore();
}
function soundLines(c, t) {   // the whistle: sound arcs from the cap at Gus's lips (a picture, not a word)
  og.save(); og.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const r = 110 + ((t * 420 + i * 90) % 270); og.globalAlpha = 1 - r / 400; for (const [lw, col] of [[22, '#1c1418'], [11, '#ffffff']]) { og.lineWidth = lw; og.strokeStyle = col; og.beginPath(); og.arc(c[0], c[1], r, -.45, .45); og.stroke(); og.beginPath(); og.arc(c[0], c[1], r, Math.PI - .45, Math.PI + .45); og.stroke(); } }
  og.restore();
}

// text layers (one at a time; captions never overlap them — story.json caps are placed around these windows)
const TEXT = [
  { t0: 0, t1: 1.6, lines: ['WHY DO PEN CAPS', 'HAVE A HOLE?'] },
  ...(VB ? [] : [{ t0: 8.8, t1: 11.0, lines: ['THIS TUBE', '= THROAT'] }]),
  { t0: 17.55, t1: 20.0, lines: ['AIR STILL', 'GETS THROUGH'] },
  { t0: 20.0, t1: 23.3, lines: ['THE HOLE', '= AN AIRWAY'] },
];
let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0;
  setProps(t, S);
  const C = S.cam(u);
  if (!S.still) { const dist = C.pos.distanceTo(C.look), dr = .006 * dist;   // a gentle handheld drift (none on the held answer)
    C.pos.add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look.add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0)); }
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(on12(t));
  L.setSun(SUN, V(0, 1, -.5), 4);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper * .45; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (S.name === 'whistle' && t < .34) soundLines(proj(V(G0.x - .01, 1.26, G0.z + .03)), t);
  if (S.name === 'hole') { const h = proj(HOLE0), a = clamp((t - 20.15) / .25); arrow(h[0] + 300, h[1] + 330, h[0] + 70, h[1] + 80, '#ffd84a', a); ring(h, t, 20.1, 95); }
  for (const x of TEXT) words(x.lines, t, x.t0, x.t1);
  if (!QS.has('nocap')) drawCaps(og, STORY.caps.filter(c => !TEXT.some(x => c.t0 < x.t1 && c.t1 > x.t0)), t, W, H);
}
const EV = [
  { t: 0, type: 'toot', dur: .34 }, { t: 12.1, type: 'pick' }, { t: 12.38, type: 'bonk' }, { t: 16.95, type: 'air', dur: 3.05 }, { t: 25.7, type: 'pick' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS };
render(0);
window.READY = true;
