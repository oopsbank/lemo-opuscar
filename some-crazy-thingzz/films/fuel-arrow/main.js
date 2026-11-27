// "Wrong Side" — why is there an arrow next to the fuel icon? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildStation, buildCockpit } from './station.js';
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

// a bright noon forecourt
const L = makeLight(scene, renderer, { sun: '#fff1d8', sunI: 3.3, sky: '#b4cff0', ground: '#9a9488', hemiI: 1.1, envI: .6, fog: '#dfe8ef' });
const rim = new THREE.DirectionalLight('#cfe0ff', .8); rim.position.set(.6, 3, 4); scene.add(rim);
const K = buildStation(scene);
const CK = buildCockpit(scene, new THREE.Vector3(24, 0, 0));   // the cockpit rig, off to the side of the forecourt

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); } });
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
const SUN = V(-.5, .8, .35).normalize();
const RIG = CK.position, GUS = RIG.clone().add(V(-.4, 0, .42)), NANA = RIG.clone().add(V(.42, 0, .42));
const CAR_PARK = V(-1.65, 0, 0);
function carAt(t) {   // where the car is, and which way it faces
  if (t < 4.4) return { p: V(-1.65, 0, 4.5), ry: 0 };
  if (t < 6.2) { const a = (t - 4.4) / 1.8 * Math.PI * 3.2 + Math.PI; return { p: V(Math.cos(a) * 2.5, 0, Math.sin(a) * 3.1), ry: -a }; }   // laps round the pump island, the fuel door always facing out
  if (t < 16.6) return { p: V(1.65, 0, 0), ry: Math.PI };   // parked the wrong way first: door away from the pump
  const k = ei(clamp((t - 16.6) / .9)); return { p: V(-1.65, 0, lerp(7, 0, k)), ry: 0 };   // the second try: in on the right side
}
const COCK = (look, d = 1.6, y = 1.36) => ({ pos: look.clone().add(V(-.05, .04, -d)), look, fov: 34, focus: d, aper: 20 });
const SHOTS = [
  { t0: 0, t1: 1.45, name: 'nana stop',   // frame 0: Nana's face, "Gus! No, no, no!", Gus already cranking the wheel
    cam: u => ({ pos: LV(V(RIG.x + .22, 1.52, -.95), V(RIG.x + .22, 1.5, -.85), ss(u / 1.45)), look: V(RIG.x + .22, 1.28, .42), fov: 42, focus: 1.35, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(GUS); nana.pos.copy(NANA);
      nana.pose = { lh: [-36, -150], rh: [36, -150], bendL: 14, bendR: -14, brows: 'shock', mouth: 'o', open: .8, look: [-1, 0], turn: -.4, sq: 1 + .05 * Math.sin(tc * 14), ...(talk('nana') ?? {}) };
      const steer = Math.sin(tc * 9); gus.pose = { lh: [-20 + steer * 10, -96 - steer * 8], rh: [24 + steer * 10, -96 + steer * 8], brows: 'angry', mouth: 'grin', open: .4, look: [1, .2], turn: .3, ...(TNEW > 1.0 ? (talk('gus') ?? {}) : {}) };
      CK.wheel.rotation.z = steer * 1.2; } },
  { t0: 1.45, t1: 2.9, name: 'gauge',   // the gauge: the arrow ringed
    cam: u => { const g = CK.GAUGE; return { pos: g.clone().add(V(.01, .12 - .01 * ss(u / 1.3), .44 - .05 * ss(u / 1.3))), look: g.clone().add(V(0, -.045, 0)), fov: 34, focus: .45, aper: 12 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 2.9, t1: 4.4, name: 'gus snacks',   // "Easy! It points to the snacks!"
    cam: u => ({ pos: LV(V(RIG.x - .38, 1.55, -1.0), V(RIG.x - .38, 1.55, -.9), ss(u / 1.5)), look: V(RIG.x - .4, 1.36, .42), fov: 38, focus: 1.45, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(GUS); nana.pos.copy(NANA);
      gus.pose = { lh: [-24, -96], rh: [56, -150], bendR: -16, brows: 'up', mouth: 'grin', open: .4, look: [1, -.3], turn: .3, ...(talk('gus') ?? {}) };
      nana.pose = { lh: [-20, -140], armsFront: true, rh: [30, -80], brows: 'worried', mouth: 'flat', look: [-1, 0], turn: -.4 }; } },
  { t0: 4.4, t1: 6.0, name: 'laps',   // the car laps the pump island
    cam: u => ({ pos: V(.2, 4.0, 13.5), look: V(0, .3, 0), fov: 46, focus: 13.5, aper: 6 }),
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 6.0, t1: 7.0, name: 'gus dizzy',   // WRONG
    cam: u => ({ pos: V(RIG.x - .38, 1.55, -.95), look: V(RIG.x - .4, 1.36, .42), fov: 38, focus: 1.45, aper: 18 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(GUS);
      const sw = Math.sin(tc * 10) * .08; gus.pose = { lh: [-24, -96], rh: [24, -96], brows: 'worried', mouth: 'teeth', look: [Math.sin(tc * 12), Math.cos(tc * 12)], tilt: sw, lean: sw * .5 }; } },
  { t0: 7.0, t1: 8.2, name: 'nana CU',   // "Actually…"
    cam: u => ({ pos: LV(V(RIG.x + .42, 1.45, -.95), V(RIG.x + .42, 1.45, -.85), ss(u / 1.2)), look: V(RIG.x + .42, 1.2, .42), fov: 38, focus: 1.4, aper: 18 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(NANA);
      const push = ei(seg(tc, 7.05, 7.35));
      nana.pose = { armsFront: tc < 7.6 && push > .3, lh: [-30, -76], rh: tc < 7.6 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, blink: tc > 7.95 && tc < 8.05 ? 1 : 0, ...(talk('nana') ?? {}) }; } },
  { t0: 8.2, t1: 11.6, name: 'door side',   // the arrow → the fuel door's side
    cam: u => { const k = ss(u / 3.4); return { pos: V(5.4 - .3 * k, 1.9, 5.8 - .4 * k), look: V(1.4, .8, .4), fov: 44, focus: 6.5, aper: 10 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 11.6, t1: 16.6, name: 'gauge twist',   // "So the little hose shows it too!" — "Nope. The hose means nothing. Only the arrow."
    cam: u => { const g = CK.GAUGE, k = ss(u / 5); return { pos: g.clone().add(V(.0, .12, .46 - .06 * k)), look: g.clone().add(V(0, -.045, 0)), fov: 34, focus: .47 - .06 * k, aper: 12 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 16.6, t1: 19.6, name: 'first try',   // in on the right side first time: DING
    cam: u => ({ pos: V(4.2, 2.2, 6.5), look: V(-.6, .7, 1.2), fov: 44, focus: 7, aper: 10 }),
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 19.6, t1: 23.2, name: 'sticker',   // "Fine! Then I'll make my own arrow." — the sticker on the gauge; Nana facepalms
    cam: u => ({ pos: LV(V(RIG.x, 1.62, -2.0), V(RIG.x, 1.6, -1.9), ss(u / 3.6)), look: V(RIG.x, 1.25, .42), fov: 44, focus: 2.4, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(GUS); nana.pos.copy(NANA);
      const slap = ei(seg(tc, 21.0, 21.25));
      gus.pose = { lh: [-24, -96], rh: tc < 21.3 ? [lerp(40, 10, slap), lerp(-150, -70, slap)] : [40, -150], rprop: tc < 21.25 ? { kind: 'sticker' } : null, bendR: -10, brows: 'up', mouth: 'grin', open: .4, look: [.6, .5], turn: .2, ...(talk('gus') ?? {}) };
      nana.pose = tc < 21.4 ? { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'skeptic', mouth: 'flat', look: [-1, .3], turn: -.4 } : { armsFront: true, lh: [-6, -146], rh: [16, -86], brows: 'worried', mouth: 'frown', look: [0, .8], blink: 1, sq: .97 }; } },
  { t0: 23.2, t1: 26.6, name: 'tape loop',   // framed like frame 0: Gus holds up a tape measure — "Wait. Why does a tape measure hook wobble?" — Nana inhales…
    cam: u => ({ pos: LV(V(RIG.x + .22, 1.52, -1.02), V(RIG.x + .22, 1.52, -.95), ss(u / 3.4)), look: V(RIG.x + .22, 1.28, .42), fov: 42, focus: 1.35, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(GUS); nana.pos.copy(NANA);
      const up = ei(seg(tc, 23.25, 23.6));
      gus.pose = { rh: [24, -96], lh: [lerp(-30, -58, up), lerp(-84, -150, up)], bendL: 14, lprop: { kind: 'tape' }, brows: 'up', mouth: 'smile', look: [1, -.4], turn: .3, ...(talk('gus') ?? {}) };
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: tc > 25.6 ? 'shock' : 'skeptic', mouth: tc > 25.9 ? 'o' : 'flat', open: .6, look: [-1, 0], turn: -.4, sq: 1 + (tc > 25.9 ? .04 : 0) }; } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

function setProps(t) {
  const S = shotAt(t), c = carAt(t);
  K.car.position.copy(c.p); K.car.rotation.y = c.ry;
  K.car.position.y = S.name === 'laps' ? Math.abs(Math.sin(t * 20)) * .02 : 0;
  const open = S.name === 'door side' ? ei(seg(t, 9.6, 9.9)) : (t > 17.6 ? ei(seg(t, 17.8, 18.1)) : 0);
  K.car.fuelDoor.rotation.y = -1.8 * open;
  CK.gauge.set({ icon: S.name === 'gauge' || (S.name === 'gauge twist'), arrow: (S.name === 'gauge twist' && t > 15.5) || S.name === 'door side', hoseX: S.name === 'gauge twist' && t > 14.0, sticker: t > 21.2, needle: t > 18 ? .95 : .08 });
  K.skid.visible = t > 4.9; K.skid.material.opacity = clamp((t - 4.9) / 1.0);
  CK.fresh.rotation.z = Math.PI + Math.sin(t * 6) * (t < 1.45 ? .5 : .1);
  CK.wheelMesh.visible = CK.hub.visible = !(S.name === 'gauge' || S.name === 'gauge twist');
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
  og.font = '800 96px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  for (const [txt, y] of [['WHY IS THERE AN ARROW', -64], ['BY THE FUEL ICON?', 64]]) { og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, y); og.fillText(txt, 0, y); og.restore(); og.strokeText(txt, 0, y); og.fillStyle = y > 0 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, y); }
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
  const k = t - 6.0; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .22); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}

function inset(t) {   // a picture-in-picture of the gauge with its arrow, and a big arrow to the fuel door
  const k = clamp((t - 8.4) / .25); if (k <= 0) return;
  og.save(); og.globalAlpha = k;
  const x0 = 90, y0 = 330, R = 150;
  og.fillStyle = '#101418'; og.strokeStyle = '#ffffff'; og.lineWidth = 12; og.beginPath(); og.arc(x0 + R, y0 + R, R, 0, 7); og.fill(); og.stroke();
  og.save(); og.translate(x0 + R, y0 + R + 20); og.scale(1.6, 1.6); og.fillStyle = '#ff9a3a'; og.fillRect(-38, -60, 66, 100); og.fillStyle = '#101418'; og.fillRect(-26, -48, 42, 26);
  og.strokeStyle = '#ff9a3a'; og.lineWidth = 12; og.beginPath(); og.moveTo(-38, -30); og.quadraticCurveTo(-78, -30, -74, 10); og.lineTo(-74, 34); og.stroke();
  og.fillStyle = '#7be07b'; og.beginPath(); og.moveTo(62, -36); og.lineTo(112, -10); og.lineTo(62, 16); og.closePath(); og.fill(); og.restore();
  const door = proj(K.car.localToWorld(K.car.FUEL_LOCAL.clone())), a = clamp((t - 8.8) / .6);
  const sx = x0 + 2 * R + 20, sy = y0 + R, ex = lerp(sx, door[0] - 40, a), ey = lerp(sy, door[1] - 60, a);
  og.strokeStyle = '#7be07b'; og.lineWidth = 22; og.lineCap = 'round'; og.beginPath(); og.moveTo(sx, sy); og.quadraticCurveTo((sx + ex) / 2, sy - 160, ex, ey); og.stroke();
  if (a >= 1) { og.fillStyle = '#7be07b'; og.beginPath(); og.arc(door[0], door[1], 70 + 8 * Math.sin(t * 10), 0, 7); og.lineWidth = 14; og.strokeStyle = '#7be07b'; og.stroke(); }
  og.font = '800 76px Baloo2'; og.textAlign = 'center'; og.lineJoin = 'round'; og.lineWidth = 16; og.strokeStyle = '#000'; og.fillStyle = '#7be07b';
  if (t > 9.7) { og.strokeText('FUEL DOOR SIDE', W / 2, H * .62 - 120); og.fillText('FUEL DOOR SIDE', W / 2, H * .62 - 120); }
  og.restore();
}
function gaugeRing(t) {   // ring the arrow on the gauge close-up
  const g = proj(CK.GAUGE.clone().add(V(.035, -.014, .0)));
  og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 16; og.lineCap = 'round'; og.beginPath(); og.ellipse(g[0] + 40, g[1] + 40, 120, 100, 0, -2.2, -2.2 + Math.PI * 2.1 * ss(clamp((t - 1.45) / .3))); og.stroke(); og.restore();
}
function confetti(t, t0) {
  const k = t - t0; if (k < 0 || k > 1.6) return;
  og.save(); for (let i = 0; i < 40; i++) { const x = W * hash(i * 1.3), y = -40 + k * (600 + hash(i * 2.7) * 700) + Math.sin(k * 6 + i) * 20; og.fillStyle = ['#ffd84a', '#ff6a8a', '#7be07b', '#9be0ff'][i % 4]; og.save(); og.translate(x, y); og.rotate(k * 8 + i); og.fillRect(-10, -5, 20, 10); og.restore(); } og.restore();
}

let TNEW = 0, texts = [];
function render(t) {
  TNEW = t;
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(t);
  const C = S.cam(u);
  const dist = C.pos.distanceTo(C.look), dr = .006 * dist;
  C.pos.add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look.add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0));
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(u, tc);
  L.setSun(SUN, S.name === 'laps' || S.name === 'door side' || S.name === 'first try' ? V(0, 0, 0) : RIG.clone(), 12);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper * .45; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (S.name === 'nana stop') { title(t); pow('SCREECH!', W * .3, H * .44, t, 0, 1.2, '#ffffff', -.15); }
  if (S.name === 'gauge') gaugeRing(t);
  if (S.name === 'laps') { pow('LAP 2!', W * .5, H * .3, t, 4.9, .6, '#ffd84a', -.1); pow('LAP 3!', W * .5, H * .36, t, 5.45, .55, '#ff6a50', .1); speed(t, 4.4, .25); }
  if (S.name === 'gus dizzy') { stamp(t); burst(W / 2, H * .22, t, 6.1, '#ff6a50'); sweat(gus, t, 6.2); }
  if (S.name === 'door side') inset(t);
  if (S.name === 'gauge twist') { if (t > 14.0 && t < 15.4) pow('NOPE', W * .28, H * .3, t, 14.0, 1.4, '#ff6a50', -.12); if (t > 15.5) pow('ONLY THE ARROW', W * .5, H * .22, t, 15.5, 1.1, '#7be07b', 0); }
  if (S.name === 'first try') { pow('DING!', W * .62, H * .3, t, 18.1, .8, '#ffd84a', .1); confetti(t, 17.6); }
  if (S.name === 'sticker') { burst(...proj(CK.GAUGE.clone()), t, 21.05, '#ffd84a'); pow('SLAP!', W * .4, H * .5, t, 21.05, .6, '#ffffff', -.1); }
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(t, STORY.caps[0].t0), W, H);
}
const EV = [
  { t: 0, type: 'screech', dur: 1.5 }, { t: 0, type: 'boing' }, { t: 4.4, type: 'screech', dur: 1.7 }, { t: 4.9, type: 'ding' }, { t: 5.45, type: 'ding' }, { t: 6.0, type: 'buzzer' }, { t: 6.0, type: 'stamp' },
  { t: 9.6, type: 'click' }, { t: 14.0, type: 'bonk' }, { t: 15.5, type: 'ding' }, { t: 16.6, type: 'engine', dur: 1.0 }, { t: 17.6, type: 'brake' }, { t: 18.1, type: 'ding' }, { t: 21.05, type: 'slap' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, CK, cards, L, SHOTS };
render(0);
window.READY = true;
