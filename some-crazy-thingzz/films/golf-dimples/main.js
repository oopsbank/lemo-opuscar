// "Sand Trap" — why do golf balls have dimples? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildCourse, Puffs } from './course.js';
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
const camera = new THREE.PerspectiveCamera(40, W / H, .01, 600);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .2; post.bloom.threshold = 1.05; post.bloom.radius = .45;
post.vig.uniforms.amt.value = .28; post.vig.uniforms.warm.value = .5; post.vig.uniforms.contrast.value = .2; post.vig.uniforms.sat.value = 1.12;

// golden hour: a low sun from front-left, a warm sky
const L = makeLight(scene, renderer, { sun: '#ffcf8e', sunI: 3.3, sky: '#b9cdea', ground: '#7d7a48', hemiI: 1.0, envI: .6, fog: '#e9d6b2' });
const K = buildCourse(scene);

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hat: HAT.flat('#a8763e'), hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); for (const x of [-15, -11]) T.line([[x, -102], [x, -92]], lw * .7, '#f4f1e8'); } });   // golf tees in the shirt pocket
const nana = new Card(scene, { height: 1.55, shirt: '#7d5aa8', pants: '#5a4378', shoes: '#4a2f2a', cheeks: '#f0a0a0', glasses: true, hair: HAIR.bun('#b8b2ab'), back: BACK.bun('#b8b2ab'),
  detail: (T, lw) => { T.shape([[-15, -100], [15, -100], [21, -50], [0, -46], [-21, -50]], { fill: '#f6ecd8', lw: lw * .6, shade: () => T.fillOnly([[6, -100], [15, -100], [21, -50], [8, -48]], '#e3d5bb') }); T.shape([[-8, -74], [8, -74], [8, -62], [-8, -62]], { fill: '#f6ecd8', lw: lw * .5 }); } });   // her apron
const cards = [gus, nana];
const SUN_TINT = new THREE.Color(1.07, 1.0, .9), SHADE_TINT = new THREE.Color(.9, .9, .95);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 30; ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);
const B0 = K.BALL_ON_TEE.clone(), TEN0 = K.TEE.clone().add(V(0, .031 + .0335, 0));
const FX = {
  dust: new Puffs(scene, { n: 22, t0: 0, t1: 2.0, life: .7, p: B0.clone().add(V(.012, .012, .01)), spread: .006, v: V(.06, .05, .05), vr: .05, size: .006, grow: 3, rise: .01, opacity: .5, color: '#f3ead8', seed: 4 }),
  divot: new Puffs(scene, { n: 10, t0: 8.38, t1: 8.5, life: .7, p: V(0, 0, 0), spread: .02, v: V(0, .25, 0), vr: .18, size: .025, grow: 2.5, rise: .02, opacity: .35, color: '#c9d9a0', seed: 6 }),
  tdust: new Puffs(scene, { n: 6, t0: 26.32, t1: 26.5, life: .5, p: TEN0.clone().add(V(.02, .02, .01)), spread: .006, v: V(.05, .05, .05), vr: .05, size: .008, grow: 3, rise: .01, opacity: .5, color: '#eef3b0', seed: 8 }),
};

// —— acting helpers (characters live on twos: 12 fps) ——
const on12 = t => Math.floor(t * 12 + 1e-6) / 12;
const VOX = await (await fetch('voices.json')).json();
function talk(who, t) {
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;
function cardLocal(card, P) {   // a world point → the card's drawing units (cm, feet at 0, up is −y), seen from the camera
  const ry = Math.atan2(camera.position.x - card.pos.x, camera.position.z - card.pos.z);
  const n = V(Math.sin(ry), 0, Math.cos(ry)), d = P.clone().sub(camera.position), s = card.pos.clone().sub(camera.position).dot(n) / d.dot(n);
  const X = camera.position.clone().addScaledVector(d, s).sub(card.pos), right = V(Math.cos(ry), 0, -Math.sin(ry));
  return [X.dot(right) / card.scale * 100, -X.y / card.scale * 100];
}
// a golf swing on the card: a = 0 address, −1 top of the backswing, +1 the finish; the club head sits on the ball at address
function swing(card, ballW, a, extra = {}) {
  const C = [0, -108], H0 = [5, -74], r = Math.hypot(H0[0] - C[0], H0[1] - C[1]), f0 = Math.atan2(H0[1] - C[1], H0[0] - C[0]);
  const Bl = cardLocal(card, ballW), len = Math.hypot(Bl[0] - H0[0], Bl[1] - H0[1]) + 2, ang0 = Math.atan2(-(Bl[0] - H0[0]), Bl[1] - H0[1]);
  const f = f0 + (a < 0 ? -a * 2.3 : -a * 2.4), hand = [C[0] + Math.cos(f) * r * (1 + .25 * Math.abs(a)), C[1] + Math.sin(f) * r * (1 + .25 * Math.abs(a))];
  const ang = ang0 + (f - f0) + (a < 0 ? -a * .9 : -a * .5);
  return { lh: hand, rh: [hand[0] + 3, hand[1] + 4], bendL: -6, bendR: 6, rprop: { kind: 'club', len, ang, face: a > .2 ? -1 : 1, blur: extra.blur ?? 0 },
    lf: [-21, -3], rf: [21, -3], legBend: 5, lean: a * .06, tilt: a * .05, turn: a * .5, look: a < .3 ? [lerp(.25, -.4, -Math.min(0, a)), .9] : [1, -.4], ...extra };
}

// —— the ball's flights ——
// the smooth ball: a sad wobble a metre to the right, a plop, a roll back
function sadBall(t) {
  const t0 = 7.45; if (t < t0) return B0.clone();
  const k = t - t0, P = B0.clone();
  if (k < .95) { const u = k / .95; P.x += 1.0 * u; P.y += Math.sin(Math.PI * u) * .32; P.z += Math.sin(u * Math.PI * 3) * .06 - .12 * u; }
  else { const u = clamp((k - .95) / .9); P.x += 1.0 - .16 * eo(u); P.y = .0214 + Math.abs(Math.sin(u * Math.PI * 2)) * .04 * (1 - u); P.z -= .12; }
  return P;
}
// the good ball: launched up and away (high, right, and down the fairway)
function goodBall(t) {
  const t0 = 19.45; if (t < t0) return B0.clone();
  const k = t - t0, P = B0.clone(); P.x += 14 * k; P.z -= 40 * k; P.y += 26 * k - 3.2 * k * k;
  return P;
}

// —— shots ——
const SUN = V(-.78, .36, .52).normalize();
const G0 = V(-.12, 0, 0), D0 = V(.72, 0, -1.25);
const ECU = (P, r, u) => { const s = r / .0214; return { pos: P.clone().add(V(.03 * s, .028 * s, .148 * s - .012 * s * ss(u / 2))), look: P.clone().add(V(0, -.03 * s, 0)), fov: 34, focus: .15 * s - .012 * s * ss(u / 2), aper: 30 }; };
const blockOn = (P, r, ph, lift = 0) => {   // the sanding block rubbing over the top-right of a ball
  const a = .55 + Math.sin(ph) * .35, n = V(Math.sin(a) * .8, Math.cos(a), .45).normalize();
  const c = P.clone().addScaledVector(n, r + .003 + lift);
  K.block.position.copy(c); K.block.lookAt(c.clone().add(n)); K.block.rotateX(Math.PI / 2); K.block.rotateY(Math.sin(ph) * .2 + .4);
};
const SHOTS = [
  { t0: 0, t1: 2.0, name: 'ECU ball',   // frame 0: the ball huge, the dimples circled, sandpaper already moving
    cam: u => ECU(B0, .0214, u),
    set(u, tc) { gus.visible = nana.visible = false; K.block.visible = true; blockOn(B0, .0214, u * 15 + 1.2); } },
  { t0: 2.0, t1: 6.2, name: 'tee medium',   // "Oh, I KNOW this one. That's damage! Smooth flies better."
    cam: u => ({ pos: LV(V(.24, 1.46, 2.5), V(.22, 1.44, 2.3), ss(u / 4.2)), look: V(.12, 1.06, -.2), fov: 40, focus: 2.45 - .2 * ss(u / 4.2), aper: 55 }),
    set(u, tc) {
      gus.visible = nana.visible = true; K.block.visible = false;
      gus.pos.copy(G0); nana.pos.copy(D0);
      const up = ei(seg(tc, 5.15, 5.4)), scrub = tc < 5.1 ? Math.sin(tc * 16) : 0;
      const ballH = [lerp(-14, 8, up), lerp(-92, -168, up)];
      gus.pose = { lh: ballH, bendL: 10, lprop: { kind: 'ball', shiny: tc > 4.4, sparkle: tc > 5.35 ? Math.max(0, Math.sin((tc - 5.35) / .55 * Math.PI)) : 0 },
        rh: up > 0 ? [36, -82] : [ballH[0] + 16 + scrub * 6, ballH[1] - 6 + scrub * 2], bendR: -8, rprop: { kind: 'sand', ang: -.3 + scrub * .15 },
        brows: tc < 3.7 ? 'up' : 'angry', mouth: 'smile', look: up > .5 ? [-.4, -.9] : [-.5, .5], tilt: .04, blink: blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc < 3.7 && tc > 2.05) Object.assign(gus.pose, { turn: .3, look: [1, -.2] });
      if (tc > 5.4) Object.assign(gus.pose, { mouth: 'grin', open: .4, brows: 'up' });
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, armsFront: false, brows: 'skeptic', mouth: 'flat', look: [-.9, .1], turn: -.3, blink: blink(tc, 2.6) };
    } },
  { t0: 6.2, t1: 7.7, name: 'low angle',   // ball height: the mirror ball, the waggle, the swing
    cam: u => ({ pos: LV(V(.55, .32, 2.45), V(.5, .3, 2.25), ss(u / 1.5)), look: V(.02, .8, 0), fov: 50, focus: 2.3, aper: 40 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.block.visible = false; gus.pos.copy(G0);
      let a = 0; if (tc < 6.9) a = Math.sin((tc - 6.2) * 14) * .06; else if (tc < 7.25) a = -ei(seg(tc, 6.9, 7.25)); else a = lerp(-1, .9, ei(seg(tc, 7.25, 7.55)) ** .6);
      gus.pose = swing(gus, B0, a, { brows: 'angry', mouth: 'grin', open: .2, blur: tc > 7.3 && tc < 7.5 ? 1 : 0 });
    } },
  { t0: 7.7, t1: 10.0, name: 'plop wide',   // the follow-through; the ball dribbles a metre and plops; WRONG
    cam: u => ({ pos: V(.42, 1.12, 3.5), look: V(.32, .72, 0), fov: 44, focus: 3.5, aper: 50 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.block.visible = false; gus.pos.copy(G0);
      gus.pose = swing(gus, B0, .9, { brows: 'up', mouth: 'grin', open: .3, look: [1, .2] });
      if (tc > 8.25) Object.assign(gus.pose, { brows: 'worried', mouth: 'flat', open: 0, look: [1, .7], turn: .5 });
      if (tc > 8.9) { const d = ei(seg(tc, 8.9, 9.3)); Object.assign(gus.pose, swing(gus, B0, lerp(.9, .25, d), { brows: 'worried', mouth: 'frown', look: [1, .9], sq: 1 - .04 * d, tilt: -.06 * d })); }
      if (tc > 9.2) Object.assign(gus.pose, { brows: 'shock', mouth: 'o', open: .5, look: [0, 0] });
    } },
  { t0: 10.0, t1: 11.2, name: 'Dot CU',   // "Actually…"
    cam: u => ({ pos: LV(V(.8, 1.24, 1.0), V(.8, 1.24, .88), ss(u / 1.2)), look: V(.72, 1.12, -1.25), fov: 34, focus: 2.2, aper: 45 }),
    set(u, tc) {
      gus.visible = false; nana.visible = true; K.block.visible = false; nana.pos.copy(D0);
      const push = ei(seg(tc, 10.05, 10.35));
      nana.pose = { armsFront: tc < 10.6 && push > .3, lh: [-30, -76], rh: tc < 10.6 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, blink: tc > 10.95 && tc < 11.05 ? 1 : 0, ...(talk('nana', tc) ?? {}) };
    } },
  { t0: 11.2, t1: 16.4, name: 'smoke board',   // the demo: smooth vs dimpled, the wakes
    cam: u => { const b = K.SB.pos, k = ss(u / 5.2); return { pos: V(b.x - .02 + .01 * k, 1.15 + .0 * k, b.z + 2.44 - .3 * k), look: V(b.x - .02 + .01 * k, 1.15, b.z), fov: 40, focus: 2.32 - .3 * k, aper: 30 }; },
    set(u, tc) { gus.visible = nana.visible = false; K.block.visible = false; } },
  { t0: 16.4, t1: 18.9, name: 'handoff',   // "Less drag. It flies twice as far."
    cam: u => ({ pos: LV(V(.2, 1.42, 2.3), V(.2, 1.42, 2.15), ss(u / 2.5)), look: V(.18, 1.05, -.1), fov: 42, focus: 2.3, aper: 55 }),
    set(u, tc) {
      gus.visible = nana.visible = true; K.block.visible = false;
      gus.pos.copy(G0); nana.pos.set(.48, 0, -.25);
      const give = ei(seg(tc, 16.5, 16.9)), take = tc > 17.0;
      nana.pose = { lh: take ? [-28, -78] : [lerp(-26, -44, give), lerp(-80, -108, give)], bendL: -10, lprop: take ? null : { kind: 'ball' }, rh: [30, -78], brows: 'neutral', mouth: 'flat', look: [-1, 0], turn: -.4, blink: blink(tc, 2), ...(talk('nana', tc) ?? {}) };
      gus.pose = { lh: take ? [24, -116] : [-28, -76], rh: [30, -76], bendL: 8, lprop: take ? { kind: 'ball' } : null, brows: take ? 'skeptic' : 'up', mouth: 'flat', look: take ? [.4, -.6] : [1, 0], turn: .35, blink: blink(tc, 1) };
    } },
  { t0: 18.9, t1: 21.8, name: 'the drive',   // CRACK: the ball rockets; the camera tilts up after it to a twinkle
    cam: u => { const t = 18.9 + u, P = goodBall(t), k = ss(seg(t, 19.5, 20.6));
      const look = LV(V(.25, .8, 0), P.clone().lerp(V(P.x, P.y, P.z), 1), k * .98);
      return { pos: V(.75, .55, 2.6), look, fov: lerp(50, 42, k), focus: lerp(2.6, 8, k), aper: lerp(45, 10, k) }; },
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.block.visible = false; gus.pos.copy(G0);
      let a = 0; if (tc < 19.0) a = 0; else if (tc < 19.3) a = -ei(seg(tc, 19.0, 19.3)); else a = lerp(-1, 1, ei(seg(tc, 19.3, 19.6)) ** .6);
      gus.pose = swing(gus, B0, a, { brows: tc > 19.5 ? 'shock' : 'angry', mouth: tc > 19.5 ? 'o' : 'grin', open: .5, blur: tc > 19.33 && tc < 19.55 ? 1 : 0, ...(tc > 19.5 ? { look: [.7, -1] } : {}) });
    } },
  { t0: 21.8, t1: 25.4, name: 'Gary CU',   // awe, then the tennis ball: "Then THIS one needs a shave!"
    cam: u => ({ pos: LV(V(-.1, 1.4, 2.8), V(-.1, 1.4, 2.62), ss(u / 3.6)), look: V(-.12, 1.28, 0), fov: 34, focus: 2.7, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.block.visible = false; gus.pos.copy(G0);
      const lift = ei(seg(tc, 22.0, 22.35)), sand = ei(seg(tc, 24.5, 24.8));
      gus.pose = { armsFront: lift > .5, lh: [lerp(-30, -34, lift), lerp(-76, -118, lift)], bendL: 12, lprop: { kind: 'tennis' }, rh: [lerp(32, 36, sand), lerp(-80, -124, sand)], bendR: -12, rprop: sand > .1 ? { kind: 'sand', ang: -.2 } : null,
        brows: tc < 22.2 ? 'up' : 'skeptic', mouth: tc < 22.2 ? 'o' : 'flat', open: .3, look: tc < 22.2 ? [.5, -1] : [-.8, -.6], tilt: -.04, blink: blink(tc, 3), ...(talk('gus', tc) ?? {}) };
      if (tc > 24.6) Object.assign(gus.pose, { mouth: 'grin', open: .6, brows: 'angry', look: [-.2, 0] });
    } },
  { t0: 25.4, t1: 26.5, name: 'ECU tennis',   // framed like frame 0; the block comes down → the loop
    cam: u => ECU(TEN0, .0335, 2 - 1.1 + u),
    set(u, tc) { gus.visible = nana.visible = false; K.block.visible = true; const d = 1 - ei(seg(25.4 + u, 25.5, 26.3)); blockOn(TEN0, .0335, 1.2, d * .09); } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

// —— the moving props ——
function setProps(t) {
  const S = shotAt(t);
  K.ball.mesh.visible = !['tee medium', 'handoff', 'Gary CU', 'smoke board', 'Dot CU', 'ECU tennis', 'the drive'].includes(S.name);
  K.ball.mesh.position.copy(t < 7.45 ? B0 : sadBall(t));
  K.ball.sand(t < 2.0 ? .38 * seg(t, 1.0, 2.0) : 1);
  K.ball.mesh.rotation.set(t * .3, t > 7.45 ? (t - 7.45) * 9 : 0, 0);
  K.ball2.mesh.visible = S.name === 'the drive'; K.ball2.mesh.position.copy(goodBall(t));
  K.tennis.visible = S.name === 'ECU tennis'; K.tennis.position.copy(TEN0); K.tennis.rotation.set(.4, 1.1, .2);
  K.tee.visible = true;
  K.tee.rotation.z = (t > 7.45 && t < 18.9) || (t > 19.45 && t < 25.4) ? -1.2 : 0; K.tee.position.y = K.tee.rotation.z ? .004 : 0;
  K.smoke.draw(+t.toFixed(3), S.name === 'smoke board' ? clamp((t - 11.2) / 1.3) : 1);
  FX.divot.update(t, false); FX.dust.update(t, S.name === 'ECU ball'); FX.tdust.update(t, S.name === 'ECU tennis');
}

// —— overlays: the ring round the dimples, the WRONG stamp, the twinkle ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function ring(t) {
  const k = clamp(.4 + t / .5);
  const c = proj(B0), e = proj(B0.clone().add(V(0, .0214, 0))), R = Math.abs(c[1] - e[1]);
  const cx = c[0] - R * .38, cy = c[1] - R * .1, rx = R * .46, ry = R * .4;
  og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = cx + Math.cos(a0 + a) * rx * w, y = cy + Math.sin(a0 + a) * ry * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function stamp(t) {
  const k = t - 9.2; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .5); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}
function streak(t) {   // the good ball, too small to see at that distance: a bright nana with a fading trail
  if (t < 19.5 || t > 21.2) return;
  og.save(); og.lineCap = 'round';
  for (let i = 0; i < 10; i++) { const a = proj(goodBall(t - i * .02)), b = proj(goodBall(t - (i + 1) * .02)); og.strokeStyle = `rgba(255,255,255,${.85 * (1 - i / 10)})`; og.lineWidth = 12 * (1 - i / 12); og.beginPath(); og.moveTo(a[0], a[1]); og.lineTo(b[0], b[1]); og.stroke(); }
  og.restore();
}
function twinkle(t) {
  const k = (t - 21.15) / .45; if (k < 0 || k > 1) return;
  const [x, y] = proj(goodBall(t)), s = Math.sin(Math.PI * k) * 70;
  og.save(); og.translate(x, y); og.rotate(k * 1.5); og.fillStyle = '#ffffff'; og.shadowColor = '#ffe9a8'; og.shadowBlur = 30;
  og.beginPath(); og.moveTo(0, -s); og.lineTo(s * .16, -s * .16); og.lineTo(s, 0); og.lineTo(s * .16, s * .16); og.lineTo(0, s); og.lineTo(-s * .16, s * .16); og.lineTo(-s, 0); og.lineTo(-s * .16, -s * .16); og.closePath(); og.fill(); og.restore();
}

let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  const C = S.cam(u);
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  setProps(t);
  S.set(u, tc);
  if (QS.has('nog')) gus.visible = false;
  for (const k of (QS.get('hide') ?? '').split(',').filter(Boolean)) { const o = K[k]; (o.mesh ?? o).visible = false; }
  L.setSun(SUN, V(0, 0, -1), 6);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  if (S.name === 'ECU ball') ring(t);
  if (S.name === 'plop wide') stamp(t);
  if (QS.has('dbg')) console.warn('DBG', S.name, JSON.stringify(gus.pose));
  if (S.name === 'the drive') { streak(t); twinkle(t); }
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(t, STORY.caps[0].t0), W, H);   // the question is on screen from frame 0
}
// sound events (core/render/events.mjs → events.json, read by mix.py)
const EV = [
  ...[0, .5, 1.0, 1.5].map(t => ({ t, type: 'rasp', dur: .42 })), ...[2.2, 2.75, 3.3, 3.85, 4.4].map(t => ({ t, type: 'rasp', dur: .3, gain: .5 })),
  { t: 5.38, type: 'sparkle' }, { t: 6.3, type: 'swish', gain: .3 }, { t: 6.6, type: 'swish', gain: .3 }, { t: 7.32, type: 'swish', gain: 1 }, { t: 7.45, type: 'tink' },
  { t: 8.38, type: 'plop' }, { t: 8.6, type: 'roll', dur: .9 }, { t: 8.5, type: 'cricket', dur: 1.5 }, { t: 9.2, type: 'buzzer' }, { t: 9.2, type: 'stamp' },
  { t: 10.15, type: 'sting' }, { t: 11.2, type: 'air', dur: 5.2 }, { t: 16.95, type: 'pat' },
  { t: 19.3, type: 'swish', gain: 1.2 }, { t: 19.45, type: 'crack' }, { t: 19.5, type: 'whistle', dur: 1.6 }, { t: 21.2, type: 'twinkle' },
  { t: 24.55, type: 'swish', gain: .4 }, { t: 26.3, type: 'rasp', dur: .2 },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS, FX };
render(0);
window.READY = true;
