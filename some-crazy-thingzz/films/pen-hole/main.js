// "Peephole" — why do pens have a hole in the side? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildDesk, buildPour } from './desk.js';
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
const PR = buildPour(scene, DY);
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
const EYE_L = [-11.5, -145], EYE_R = [11.5, -145];
const PEEP = (eye, tc) => ({ armsFront: true, lh: [eye[0] - 3, eye[1]], bendL: 10, lprop: { kind: 'pen', ang: Math.PI / 2, ring: 1 }, rh: [30, -84] });   // the pen across the face, its side hole on the eye
const CU = (u, d0 = 1.0) => ({ pos: LV(V(-.27, 1.44, d0 - .55), V(-.27, 1.44, d0 - .65), ss(u / 2)), look: V(-.27, 1.36, -.55), fov: 34, focus: d0 - .05, aper: 45 });
const SHOTS = [
  { t0: 0, t1: 1.6, name: 'result CU',   // frame 0, result first: Gus already has a blue ink ring round his eye, shocked, pen in hand
    cam: u => ({ pos: LV(V(-.25, 1.38, 1.45), V(-.25, 1.38, 1.35), ss(u / 1.5)), look: V(-.25, 1.5, -.55), fov: 36, focus: 1.95, aper: 30 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const d = TNEW;
      gus.pose = { armsFront: true, lh: [-24, -108], bendL: 10, lprop: { kind: 'pen', ang: -.5, ring: 1 }, rh: [44, -150], bendR: -14, inkRing: 1, brows: 'shock', mouth: 'o', open: .6, look: [-.8, -.4], turn: -.2,
        sq: 1 + .1 * Math.exp(-d * 8) * Math.cos(d * 30), tilt: .06 * Math.exp(-d * 4) * Math.sin(d * 20), ...(d > .1 ? (talk('gus') ?? {}) : {}) }; } },
  { t0: 1.6, t1: 6.4, name: 'desk two-shot',   // "Oh, I KNOW this one. It's a peephole! To check the ink!"
    cam: u => ({ pos: LV(V(.03, 1.45, 2.3), V(.02, 1.43, 2.1), ss(u / 4.4)), look: V(.03, 1.14, -.4), fov: 42, focus: 2.3 - .2 * ss(u / 4.4), aper: 50 }),
    set(u, tc) {
      gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const lift = ei(seg(tc, 2.0, 2.3)), peep = ei(seg(tc, 4.6, 4.9));
      if (peep > 0) gus.pose = { ...PEEP(EYE_L, tc), lh: [lerp(-52, EYE_L[0] - 3, peep), lerp(-140, EYE_L[1], peep)], armsFront: peep > .5, brows: 'skeptic', mouth: 'o', open: .2, look: [-.6, 0], ...(talk('gus', tc) ?? {}) };
      else gus.pose = { lh: [lerp(-30, -52, lift), lerp(-80, -140, lift)], bendL: 10, lprop: { kind: 'pen', ang: -.3 }, rh: [34, -84], brows: tc < 3.3 ? 'up' : 'angry', mouth: 'smile', look: [-.6, -.6], tilt: .04, blink: blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc > 2.05 && tc < 3.3) Object.assign(gus.pose, { turn: .35, look: [1, -.2] });
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: tc > 3.6 ? 'skeptic' : 'neutral', mouth: 'flat', look: [-.9, -.1], turn: -.3, blink: blink(tc, 2.6) };
    } },
  { t0: 6.4, t1: 8.6, name: 'reveal',   // he lowers the pen: a blue ink ring round his eye; Nana's spit take
    cam: u => ({ pos: LV(V(-.02, 1.38, 1.6), V(-.02, 1.38, 1.45), ss(u / 2.2)), look: V(-.02, 1.22, -.55), fov: 42, focus: 2.1, aper: 45 }),
    set(u, tc) {
      gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const down = ei(seg(tc, 6.55, 6.8));
      gus.pose = { armsFront: down < .5, lh: [lerp(EYE_L[0] - 3, -40, down), lerp(EYE_L[1], -100, down)], bendL: 10, lprop: { kind: 'pen', ang: lerp(Math.PI / 2, -.3, down) }, rh: [34, -84], inkRing: down > .3 ? 1 : 0,
        brows: 'up', mouth: 'grin', open: .3, look: [1, -.1], turn: .3 };
      if (tc > 7.6) Object.assign(gus.pose, { brows: 'worried', mouth: 'teeth', open: 0 });
      const spit = tc > 7.0;
      nana.pose = tc < 6.95 ? { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'neutral', mouth: 'flat', look: [-.9, -.1], turn: -.3 }
        : { lh: [-30, -80], rh: [30, -80], brows: 'shock', mouth: 'o', open: .9, look: [-1, -.2], turn: -.3, sq: 1 + .08 * Math.exp(-(tc - 7.0) * 6), lean: -.05 * Math.exp(-(tc - 7.0) * 3) };
      if (tc > 7.9) Object.assign(nana.pose, { mouth: 'teeth', open: 0, brows: 'up', lh: [-14, -138], armsFront: true });   // stifling a laugh
    } },
  { t0: 8.6, t1: 10.0, name: 'Gus CU',   // the ink ring; WRONG
    cam: u => ({ pos: LV(V(-.27, 1.42, 1.25), V(-.27, 1.42, 1.15), ss(u / 1.4)), look: V(-.27, 1.34, -.55), fov: 34, focus: 1.75, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { lh: [-52, -126], bendL: 10, lprop: { kind: 'pen', ang: -.3 }, rh: [30, -84], inkRing: 1, brows: 'worried', mouth: 'teeth', look: [1, .2], turn: .3, tilt: -.05, blink: blink(tc, 1) };
      if (tc > 9.2) Object.assign(gus.pose, { look: [0, 0], turn: 0, mouth: 'frown', sq: .97 });
    } },
  { t0: 10.0, t1: 11.2, name: 'Nana CU',   // "Actually…"
    cam: u => ({ pos: LV(V(.32, 1.24, 1.15), V(.32, 1.24, 1.03), ss(u / 1.2)), look: V(.3, 1.14, -.55), fov: 34, focus: 1.65, aper: 45 }),
    set(u, tc) {
      gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const push = ei(seg(tc, 10.05, 10.35));
      nana.pose = { armsFront: tc < 10.6 && push > .3, lh: [-30, -76], rh: tc < 10.6 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, blink: tc > 10.95 && tc < 11.05 ? 1 : 0, ...(talk('nana', tc) ?? {}) };
    } },
  { t0: 11.2, t1: 18.4, name: 'pour',   // one hole glugs; two holes flow
    cam: u => { const k = ss(u / 7.2); return { pos: V(-.02, DY + .27 - .02 * k, 1.3 - .08 * k), look: V(-.02, DY + .1, -.02), fov: 40, focus: 1.3 - .08 * k, aper: 22 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 18.4, t1: 21.8, name: 'cutaway',   // the clear pen: ink moves down, air comes in through the side hole
    cam: u => { const k = ss(u / 3.4); return { pos: V(-.02, DY + .4, .58 - .06 * k), look: V(-.02, DY + .33, 0), fov: 40, focus: .85 - .08 * k, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; } },
  { t0: 21.8, t1: 25.2, name: 'rub CU',   // "Fine. I'll check with the other eye."
    cam: u => ({ pos: LV(V(-.27, 1.42, 1.25), V(-.27, 1.42, 1.13), ss(u / 3.4)), look: V(-.27, 1.34, -.55), fov: 34, focus: 1.75, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const rub = tc < 22.8 ? Math.sin(tc * 18) * 4 : 0;
      gus.pose = { armsFront: tc < 22.8, rh: tc < 22.8 ? [-6 + rub, -140] : [30, -84], lh: [-52, -126], bendL: 10, lprop: { kind: 'pen', ang: -.3 }, inkRing: 1, brows: tc < 22.8 ? 'worried' : 'angry', mouth: tc < 22.8 ? 'frown' : 'smile', look: [-.6, -.5], blink: tc < 22.8 ? 1 : blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc > 24.4) Object.assign(gus.pose, { look: [-.9, -.6], brows: 'skeptic', mouth: 'grin', open: .3 });
    } },
  { t0: 25.2, t1: 27.0, name: 'peep again',   // framed like frame 0: the pen to the OTHER eye → the cut
    cam: u => CU(u * .5),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      const up = ei(seg(tc, 25.25, 25.75));
      gus.pose = { ...PEEP(EYE_R, tc), lh: [lerp(-52, EYE_R[0] - 3, up), lerp(-126, EYE_R[1], up)], armsFront: up > .5, lprop: { kind: 'pen', ang: lerp(-.3, Math.PI / 2, up), ring: clamp((tc - 25.8) / .3) }, inkRing: 1, brows: 'skeptic', mouth: 'o', open: .2, look: [.6, 0] }; } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

const TILT0 = 12.0, GL = [[.25, .2], [.25, .2], [.25, .2], [.3, .18], [.22, .2], [.25, .22], [.25, .2], [.25, .2], [.25, .2], [.25, .2], [.25, .2], [.25, .2], [.25, .2], [.25, .2]];
const glugOn = t => { let x = t - (TILT0 + .55); if (x < 0) return false; for (const [on, off] of GL) { if (x < on) return true; x -= on; if (x < off) return false; x -= off; } return false; };
function setProps(t) {
  const S = shotAt(t);
  for (const o of K.backRow) o.visible = ['pour', 'cutaway'].includes(S.name);
  K.cap.visible = false; K.rig.visible = false; K.updateMotes(t); K.crack(false); K.puddle.visible = false;
  PR.root.visible = S.name === 'pour'; PR.cut.visible = S.name === 'cutaway';
  const tilt = -1.9 * ei(seg(t, TILT0, TILT0 + .6));
  PR.cans.forEach((c, i) => { c.pivot.rotation.z = tilt + (i === 0 && glugOn(t) === false && t > TILT0 + .6 ? .06 * Math.sin(t * 40) : 0); });
  const fill = i => i ? .085 * clamp((t - TILT0 - .55) / 4.2) : .085 * clamp((t - TILT0 - .55) / 4.2) * .45;
  PR.glasses.forEach((g, i) => { const f = Math.max(.0005, fill(i)); g.juice.scale.y = f; });
  if (!PR.placed) {   // each glass sits right under its can's hole at full tilt
    PR.cans.forEach((c, i) => { c.pivot.rotation.z = -1.9; c.pivot.updateMatrixWorld(true); const sp = c.can.localToWorld(c.spout.clone()); PR.glasses[i].g.position.x = sp.x; c.pivot.rotation.z = tilt; });
    PR.placed = true;
  }
  PR.cut.rotation.z = -Math.PI / 2; PR.cut.position.set(0, DY + .44, 0);
  PR.setInk(clamp((t - 18.6) / 3.0) * .5);
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
  if (t > 1.6) return;
  const k = 1, s = t < .09 ? lerp(1.08, 1, ei(clamp(t / .09))) : 1 + .02 * Math.exp(-(t - .18) * 8) * Math.cos((t - .18) * 30), out = clamp((1.6 - t) / .12);
  og.save(); og.translate(W / 2, H * .2); og.scale(s, s); og.globalAlpha = Math.min(k * 2, out); og.rotate(-.03);
  og.font = '800 112px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  for (const [txt, y] of [['WHY DO PENS HAVE', -64], ['A HOLE IN THE SIDE?', 64]]) { og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, y); og.fillText(txt, 0, y); og.restore(); og.strokeText(txt, 0, y); og.fillStyle = y > 0 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, y); }
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
function spitTake(t, t0) {   // a spray of tea droplets from Nana's mouth
  const k = t - t0; if (k < 0 || k > .9) return;
  const m = proj(V(N0.x - .03, 1.2, N0.z + .05));
  og.save(); og.fillStyle = '#c98a4a'; og.strokeStyle = '#1c1418'; og.lineWidth = 4;
  for (let i = 0; i < 16; i++) { const a = Math.PI * (.85 + hash(i) * .35), sp = 500 + hash(i * 3.1) * 700, x = m[0] + Math.cos(a) * sp * k, y = m[1] + Math.sin(a) * sp * k * .4 + 900 * k * k, r = 9 + hash(i * 7) * 10;
    og.globalAlpha = 1 - k / .9; og.beginPath(); og.arc(x, y, r, 0, 7); og.fill(); og.stroke(); }
  og.restore();
}
function streams(t) {   // juice from each can's hole into its glass: one glugs in bursts, one flows; labels
  const lab = (txt, col, x, y) => { og.save(); og.font = '800 70px Baloo2'; og.textAlign = 'center'; og.lineJoin = 'round'; og.lineWidth = 14; og.strokeStyle = '#000'; og.fillStyle = col; og.strokeText(txt, x, y); og.fillText(txt, x, y); og.restore(); };
  PR.cans.forEach((c, i) => {
    const sp = c.can.localToWorld(c.spout.clone()), g = PR.glasses[i].g.position, top = proj(V(g.x, DY + .11, g.z)), s0 = proj(sp);
    const on = t > TILT0 + .55 && (i ? true : glugOn(t));
    if (on) {
      og.save(); og.strokeStyle = '#ff9a2e'; og.lineCap = 'round';
      for (let k = 0; k <= 1.001; k += .05) { const x = lerp(s0[0], top[0], k) + Math.sin(t * 30 + k * 9) * (i ? 2 : 7), y = lerp(s0[1], top[1], k);
        og.lineWidth = (i ? 22 : 30) * (1 - k * .3); og.globalAlpha = .95; og.beginPath(); og.arc(x, y, og.lineWidth / 2, 0, 7); og.fillStyle = '#ff9a2e'; og.fill(); }
      og.restore();
    }
    const head = proj(V(g.x - .03 + (i ? -.02 : .03), DY + .36, 0));
    lab(i ? 'TWO HOLES' : 'ONE HOLE', i ? '#7be07b' : '#ff6a50', head[0], head[1]);
    if (!i && t > TILT0 + .6 && !glugOn(t) && t < 18.2) { const b = proj(V(g.x - .08, DY + .24, .05)); lab('GLUG!', '#ffffff', b[0] + 20, b[1]); }
    if (i && t > 16.2) { const b = proj(V(g.x, DY + .2, .05)); lab('SMOOTH', '#ffffff', b[0], b[1]); }
  });
}
function airIn(t) {   // air dots entering the side hole; ink dots at the tip; labels
  const H0 = PR.cut.localToWorld(PR.HOLE.clone()), hp = proj(H0);
  const lab = (txt, col, x, y) => { og.save(); og.font = '800 64px Baloo2'; og.textAlign = 'left'; og.lineJoin = 'round'; og.lineWidth = 14; og.strokeStyle = '#000'; og.fillStyle = col; og.strokeText(txt, x, y); og.fillText(txt, x, y); og.restore(); };
  if (t > 18.6) for (let k = 0; k < 10; k++) { const ph = ((t - 18.6) * .9 + k / 10) % 1, x = hp[0] + 260 * (1 - ph), y = hp[1] - 40 * (1 - ph) + Math.sin(k + t * 4) * 6;
    og.fillStyle = `rgba(170,225,255,${Math.sin(Math.PI * ph)})`; og.beginPath(); og.arc(x, y, 11, 0, 7); og.fill(); }
  lab('AIR IN', '#9be0ff', hp[0] - 330, hp[1] - 90);
  const tip = proj(PR.cut.localToWorld(V(.39, 0, 0))); lab('INK OUT', '#6a8cff', tip[0] + 50, tip[1] + 10);
  for (let k = 0; k < 6; k++) { const ph = ((t - 18.6) * 1.2 + k / 6) % 1; if (t < 18.6) break; og.fillStyle = '#2a4fd0'; og.beginPath(); og.arc(tip[0] + Math.sin(k) * 6, tip[1] + 20 + ph * 70, 9 * (1 - ph * .5), 0, 7); og.fill(); }
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

// Retention retime (27 Nov playbook): shots were blocked on an older clock; WARP maps the new clock to it, shot by shot.
const WARP = [[0, 1.6, 0, 1.6], [1.6, 3.4, 3.4, 5.2], [3.4, 4.8, 6.4, 8.6], [4.8, 6.2, 8.6, 10.0], [6.2, 7.4, 10.0, 11.2], [7.4, 15.0, 11.2, 18.4], [15.0, 19.0, 18.4, 21.8], [19.0, 22.4, 21.8, 25.2], [22.4, 25.01, 25.2, 27.0]];
const warp = t => { for (const [n0, n1, o0, o1] of WARP) if (t < n1) return o0 + (Math.max(t, n0) - n0) / (n1 - n0) * (o1 - o0); return 27; };
const warpInv = o => { for (const [n0, n1, o0, o1] of WARP) if (o < o1) return +(n0 + (o - o0) / (o1 - o0) * (n1 - n0)).toFixed(3); return 25; };
let TNEW = 0;
let texts = [];
function render(tn) {
  TNEW = tn; const t = warp(tn);
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(t);
  const C = S.cam(u);
  const dist = C.pos.distanceTo(C.look), dr = .006 * dist;   // a gentle handheld drift
  C.pos.add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look.add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0));
  if (S.name === 'pour' && u < .3) { const w = (1 - ei(u / .3)) * .5; C.pos.x += w; C.look.x += w; }
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(u, tc);
  gus.pose.inkRing = 1;
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
  if (S.name === 'reveal') { pow('PFFFT!', W * .66, H * .24, t, 7.0, 1.1, '#9be0ff', .12); spitTake(t, 7.0); burst(...proj(V(N0.x, 1.25, N0.z + .05)), t, 7.0, '#9be0ff'); }
  if (S.name === 'Gus CU') { stamp(t); burst(W / 2, H * .22, t, 9.2, '#ff6a50'); sweat(gus, t, 9.35); }
  if (S.name === 'pour') { streams(t); speed(t, 11.2, .3); }
  if (S.name === 'cutaway') airIn(t);
  if (S.name === 'result CU') title(tn);
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(tn, STORY.caps[0].t0), W, H);
}
const EV = [
  { t: 0, type: 'boing' }, { t: 0, type: 'squeak' }, { t: 2.8, type: 'squeak' }, { t: 7.35, type: 'whip' }, { t: 23.2, type: 'squeak' },
  { t: 3.78, type: 'spit' }, { t: 4.8, type: 'cricket', dur: .6 }, { t: 5.4, type: 'buzzer' }, { t: 5.4, type: 'stamp' },
  ...(() => { const o = []; let x = TILT0 + .55; for (const [on, off] of GL) { if (x > 18.3) break; o.push({ t: warpInv(x), type: 'glug' }); x += on + off; } return o; })(),
  { t: warpInv(TILT0 + .55), type: 'pour', dur: 6.2 }, { t: 15.2, type: 'air', dur: 3.6 }, { t: 19.1, type: 'rub', dur: .8 },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS };
render(0);
window.READY = true;
