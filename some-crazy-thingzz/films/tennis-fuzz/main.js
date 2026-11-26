// "Bald Serve" — why do tennis balls have fuzz? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows.
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildCourt, Puffs } from './court.js';
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
post.bloom.strength = .18; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .25; post.vig.uniforms.warm.value = .25; post.vig.uniforms.contrast.value = .18; post.vig.uniforms.sat.value = 1.1;

// noon: a high sun from front-left, a clear sky
const L = makeLight(scene, renderer, { sun: '#fff1d8', sunI: 3.4, sky: '#b4cff0', ground: '#6f8a5a', hemiI: 1.05, envI: .6, fog: '#dfe8ef' });
const K = buildCourt(scene);

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#f4f1ea', shoes: '#ffffff', mustache: '#8a5a2b', hat: HAT.band(), hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); } });
const nana = new Card(scene, { height: 1.55, shirt: '#7d5aa8', pants: '#5a4378', shoes: '#ffffff', cheeks: '#f0a0a0', glasses: true, hair: HAIR.bun('#b8b2ab'), back: BACK.bun('#b8b2ab'),
  detail: (T, lw) => { T.shape([[-15, -100], [15, -100], [21, -50], [0, -46], [-21, -50]], { fill: '#f6ecd8', lw: lw * .6, shade: () => T.fillOnly([[6, -100], [15, -100], [21, -50], [8, -48]], '#e3d5bb') }); T.shape([[-8, -74], [8, -74], [8, -62], [-8, -62]], { fill: '#f6ecd8', lw: lw * .5 }); } });   // her apron
const cards = [gus, nana];
const SUN_TINT = new THREE.Color(1.05, 1.02, .96), SHADE_TINT = new THREE.Color(.9, .92, .98);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 30; ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && h.object.visible && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);
const R = .0335, B0 = V(.3, R, 1.2);
const FX = {
  fluff: new Puffs(scene, { n: 30, t0: 0, t1: 2.0, life: .8, p: B0.clone().add(V(.02, .02, .01)), spread: .008, v: V(.09, .07, .06), vr: .07, size: .007, grow: 2, rise: -.04, opacity: .8, color: '#e2ef6a', seed: 4 }),
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
function cardLocal(card, P) {
  const ry = Math.atan2(camera.position.x - card.pos.x, camera.position.z - card.pos.z);
  const n = V(Math.sin(ry), 0, Math.cos(ry)), d = P.clone().sub(camera.position), s = card.pos.clone().sub(camera.position).dot(n) / d.dot(n);
  const X = camera.position.clone().addScaledVector(d, s).sub(card.pos), right = V(Math.cos(ry), 0, -Math.sin(ry));
  return [X.dot(right) / card.scale * 100, -X.y / card.scale * 100];
}
// a racket pose: angle of the racket (0 = head down, −π/2 = head to the right, ±π = head up), the hand on a circle round the right shoulder
function racket(ang, o = {}) {
  const C = [17, -108], r = 40, a = ang + Math.PI / 2 + (o.off ?? 0);
  return { rh: [C[0] + Math.cos(a) * r * .9 + 10, C[1] + Math.sin(a) * r * .9], bendR: -8, rprop: { kind: 'racket', ang, blur: o.blur ?? 0 } };
}

// —— flights ——
const G0 = V(-.3, 0, .4), N0 = V(1.3, 0, -16.5), N_NEAR = V(.75, 0, -.9);
const SERVE = 7.1, FENCE = V(1.75, 1.35, K.FZ2 + .05);
function serveBall(t) {   // the bald serve: a laser from Gus's racket into the far fence
  const P0 = G0.clone().add(V(.25, 2.45, 0)), k = clamp((t - SERVE) / 1.2);
  const P = LV(P0, FENCE, k); P.y += Math.sin(Math.PI * k) * .25; return P;
}
const FIRE_B = 11.6, FIRE_F = 13.0;
function demoBald(t) { const k = Math.max(0, t - FIRE_B), kk = Math.min(k, .74); const P = V(-.18 - 3.4 * kk, .7 + 3 * kk - 4.9 * kk * kk, .25 - 40 * kk); return P; }
function demoFuzzy(t) {
  const k = Math.max(0, t - FIRE_F), land = .81;
  if (k < land) return V(.18 + 2.6 * k, .7 + 3.4 * k - 4.9 * k * k, .25 - 28 * (1 - Math.exp(-.9 * k)) / .9);
  const P = demoFuzzy(FIRE_F + land - 1e-4), b = k - land; P.y = R + Math.max(0, 1.6 * b - 4.9 * b * b); P.z -= 5 * b * Math.exp(-b); P.x += .5 * b * Math.exp(-b); return P;
}
const HIT = 18.0, RC = V(.35, 1.0, .5);   // the rally: the contact point beside Gus
function rallyBall(t) {
  const far = V(-.4, 1.4, -13);
  if (t < HIT) { const k = clamp(1 - (HIT - t) / 1.0); const P = LV(far, RC, k); P.y += Math.sin(Math.PI * k) * 1.2; return P; }
  const k = clamp((t - HIT) / 1.1); const P = LV(RC, V(1.5, .6, -18), k); P.y += Math.sin(Math.PI * k) * 1.6; return P;
}

// —— shots ——
const SUN = V(-.55, .78, .32).normalize();
const ECU = (P, u) => { const s = R / .0214; return { pos: P.clone().add(V(.03 * s, .028 * s, .148 * s - .012 * s * ss(u / 2))), look: P.clone().add(V(0, -.021 * s, 0)), fov: 34, focus: .15 * s - .012 * s * ss(u / 2), aper: 30 }; };
const SHOTS = [
  { t0: 0, t1: 2.0, name: 'ECU ball',   // frame 0: the fuzz huge and circled; the shaver already buzzing
    cam: u => ECU(B0, u),
    set(u, tc) { gus.visible = nana.visible = false; K.shaver.visible = true;
      const ph = u * 18, a = .5 + Math.sin(ph) * .25, n = V(Math.sin(a) * .7, Math.cos(a), .4).normalize();
      K.shaver.position.copy(B0).addScaledVector(n, R * 1.08); K.shaver.lookAt(K.shaver.position.clone().add(n)); K.shaver.rotateX(Math.PI / 2); K.shaver.rotateY(.6 + Math.sin(ph) * .15);
      K.shaver.position.x += Math.sin(u * 140) * .0008; } },
  { t0: 2.0, t1: 6.0, name: 'shave medium',   // "Oh, I KNOW this one." / "The fuzz is just for looks! Bald is faster."
    cam: u => ({ pos: LV(V(.0, 1.46, 2.9), V(-.02, 1.44, 2.7), ss(u / 4)), look: V(-.08, 1.06, .2), fov: 40, focus: 2.5 - .2 * ss(u / 4), aper: 55 }),
    set(u, tc) {
      gus.visible = nana.visible = true; K.shaver.visible = false; gus.pos.copy(G0); nana.pos.copy(N_NEAR);
      const up = ei(seg(tc, 5.2, 5.45)), buzz = tc < 5.1;
      const bh = [lerp(-14, 6, up), lerp(-92, -168, up)];
      gus.pose = { lh: bh, bendL: 10, lprop: { kind: tc > 4.6 ? 'bald' : 'tennis' },
        rh: up > 0 ? [36, -82] : [bh[0] + 18 + Math.sin(tc * 30) * 3, bh[1] - 8], bendR: -8, rprop: up > 0 ? null : { kind: 'shaver', ang: -1.9, buzz },
        brows: tc < 3.3 ? 'up' : 'angry', mouth: 'smile', look: up > .5 ? [-.4, -.9] : [-.5, .5], tilt: .04, blink: blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc > 2.05 && tc < 3.3) Object.assign(gus.pose, { turn: .3, look: [1, -.2] });
      if (tc > 5.45) Object.assign(gus.pose, { mouth: 'grin', open: .4, brows: 'up' });
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'skeptic', mouth: 'flat', look: [-.9, .1], turn: -.3, blink: blink(tc, 2.6), lprop: null, rprop: null };
      if (tc > 4.6) Object.assign(nana.pose, { brows: 'worried' });
    } },
  { t0: 6.0, t1: 7.6, name: 'serve',   // the toss, the serve, PING
    cam: u => ({ pos: LV(V(.75, .95, 2.9), V(.7, .95, 2.7), ss(u / 1.6)), look: V(-.15, 1.35, .3), fov: 50, focus: 2.75, aper: 40 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.shaver.visible = false; gus.pos.copy(G0);
      const toss = ei(seg(tc, 6.1, 6.5)), sw = seg(tc, 6.85, 7.15);
      const bally = tc < 6.5 ? lerp(-120, -250, toss) : (tc < SERVE ? -250 + 40 * Math.sin(Math.PI * seg(tc, 6.5, 7.3)) * 0 : -250);
      let rk = tc < 6.85 ? racket(Math.PI * .55, {}) : racket(lerp(Math.PI * .55, -Math.PI * .7, ei(sw)), { blur: sw > .2 && sw < .9 ? 1 : 0 });
      if (tc < 6.85) rk.rh = [44, -168];
      gus.pose = { ...rk, lh: tc < 6.5 ? [-24, lerp(-110, -200, toss)] : [-30, -196], bendL: 8, lprop: tc < SERVE - .02 && tc < 6.5 ? { kind: 'bald' } : null,
        brows: 'angry', mouth: 'grin', open: .3, look: [-.2, -1], tilt: -.05, lean: tc > SERVE ? .08 : -.04 };
      if (tc >= SERVE) Object.assign(gus.pose, { look: [1, -.4], mouth: 'o', open: .6, brows: 'up' });
    } },
  { t0: 7.6, t1: 10.0, name: 'streak wide',   // the ball streaks past Nana into the fence; WRONG
    cam: u => ({ pos: V(2.6, 1.3, 3.2), look: V(1.25, .95, -16.5), fov: 15, focus: 19.8, aper: 14 }),
    set(u, tc) {
      gus.visible = nana.visible = true; K.shaver.visible = false; gus.pos.copy(G0); nana.pos.copy(N0);
      gus.pose = { ...racket(-Math.PI * .7), lh: [-30, -100], brows: 'up', mouth: 'grin', open: .4, look: [-.6, -.3], turn: -.3 };
      const d = tc - 7.78;
      nana.pose = d < .05 ? { brows: 'neutral', mouth: 'flat', look: [0, 0] } : { lh: [-48, -160], rh: [48, -160], bendL: 12, bendR: -12, brows: 'shock', mouth: 'o', open: .7, look: [-1, 0], tilt: .1 * Math.exp(-d * 3) * Math.sin(d * 30), sq: 1 + .06 * Math.exp(-d * 6) };
      if (tc > 8.8) Object.assign(nana.pose, { lh: [-24, -60], rh: [24, -60], bendL: -16, bendR: 16, brows: 'angry', mouth: 'flat', open: 0, look: [0, 0], tilt: 0, sq: 1 });
      if (tc > 9.2) Object.assign(gus.pose, { brows: 'worried', mouth: 'teeth', look: [0, 0] });
    } },
  { t0: 10.0, t1: 11.2, name: 'Nana CU',   // "Actually…"
    cam: u => ({ pos: LV(V(1.38, 1.24, -13.5), V(1.38, 1.24, -13.62), ss(u / 1.2)), look: V(1.3, 1.12, -16.5), fov: 34, focus: 2.2, aper: 45 }),
    set(u, tc) {
      gus.visible = false; nana.visible = true; K.shaver.visible = false; nana.pos.copy(N0);
      const push = ei(seg(tc, 10.05, 10.35));
      nana.pose = { armsFront: tc < 10.6 && push > .3, lh: [-30, -76], rh: tc < 10.6 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, blink: tc > 10.95 && tc < 11.05 ? 1 : 0, ...(talk('nana', tc) ?? {}) };
    } },
  { t0: 11.2, t1: 17.2, name: 'demo',   // the ball machine: BALD out, FUZZY in
    cam: u => { const k = ss(u / 6); return { pos: V(0, 6.2 - .4 * k, 6.4 - .6 * k), look: V(0, 0, -15), fov: 48, focus: 18, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; K.shaver.visible = false; } },
  { t0: 17.2, t1: 20.6, name: 'rally',   // Gus hits a fuzzy one back: pok
    cam: u => ({ pos: LV(V(.55, 1.4, 3.3), V(.5, 1.4, 3.1), ss(u / 3.4)), look: V(.0, 1.1, .2), fov: 42, focus: 2.9, aper: 50 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.shaver.visible = false; gus.pos.copy(G0);
      const head = cardLocal(gus, RC), back0 = ei(seg(tc, 17.3, 17.8)), sw = seg(tc, 17.85, 18.15);
      let ang = tc < 17.85 ? lerp(-Math.PI / 2, -Math.PI / 2 - 1.3, back0) : lerp(-Math.PI / 2 - 1.3, -Math.PI / 2 + 1.4, ei(sw));
      const L = 34, dir = [-Math.sin(ang), Math.cos(ang)];
      const hand = tc < 17.85 ? [26 + 10 * back0, -96 + 8 * back0] : [head[0] - dir[0] * L, head[1] - dir[1] * L];
      gus.pose = { rh: hand, bendR: -6, rprop: { kind: 'racket', ang, blur: sw > .2 && sw < .8 ? 1 : 0 }, lh: [-34, -96], bendL: 8, lf: [-20, -3], rf: [18, -3],
        brows: 'angry', mouth: 'teeth', look: [1, -.3], turn: .3, lean: .04 };
      if (tc > HIT + .1) Object.assign(gus.pose, { brows: 'up', mouth: 'o', open: .6, look: [-.5, -.6] });
      if (tc > 19.0) Object.assign(gus.pose, { mouth: 'grin', open: .5, rh: [44, -150], rprop: { kind: 'racket', ang: Math.PI * .9 }, look: [0, 0], turn: 0 });
    } },
  { t0: 20.6, t1: 25.6, name: 'sweater CU',   // "Poor thing. It must be freezing!" — a tiny knitted sweater
    cam: u => ({ pos: LV(V(-.5, 1.4, 3.1), V(-.5, 1.4, 2.92), ss(u / 5)), look: V(-.52, 1.28, .4), fov: 34, focus: 2.65, aper: 45 }),
    set(u, tc) {
      gus.visible = true; nana.visible = false; K.shaver.visible = false; gus.pos.copy(G0);
      const lift = ei(seg(tc, 20.7, 21.0)), sw = ei(seg(tc, 23.7, 24.5));
      const bh = [lerp(-30, -52, lift), lerp(-80, -132, lift)];
      gus.pose = { lh: bh, bendL: 10, lprop: { kind: 'bald', sweater: sw, shiver: sw < .5 && tc > 21.0 && Math.floor(tc * 12) % 2 === 0 },
        rh: tc > 23.4 && tc < 24.6 ? [bh[0] + 14, bh[1] - 14 + 8 * sw] : [34, -82], bendR: -10,
        brows: tc < 23.6 ? 'worried' : 'up', mouth: 'frown', look: [-.2, .6], tilt: .06, blink: blink(tc, 1), ...(talk('gus', tc) ?? {}) };
      if (tc > 24.6) Object.assign(gus.pose, { mouth: 'grin', open: .4, brows: 'up', tilt: -.04, look: [-.2, .5] });
    } },
  { t0: 25.6, t1: 26.8, name: 'ECU sweater',   // framed like frame 0 → the cut
    cam: u => ECU(B0, u * .3),
    set(u, tc) { gus.visible = nana.visible = false; K.shaver.visible = false; } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

function setProps(t) {
  const S = shotAt(t);
  const hero = S.name === 'ECU ball' || S.name === 'ECU sweater';
  K.ball.g.visible = hero; K.ball.g.position.copy(B0); K.ball.g.rotation.set(S.name === 'ECU sweater' ? .05 : .3, t < 2 ? t * .15 : .6, S.name === 'ECU sweater' ? -.15 : .1);
  K.ball.shave(S.name === 'ECU sweater' ? 1 : .45 * seg(t, .6, 2.0)); K.ball.sweater(S.name === 'ECU sweater');
  K.bald.g.visible = S.name === 'streak wide' || (S.name === 'demo'); K.bald.g.position.copy(S.name === 'demo' ? demoBald(t) : serveBall(t));
  if (S.name === 'streak wide' && t < SERVE) K.bald.g.visible = false;
  if (S.name === 'serve' && t >= 6.5) { K.bald.g.visible = true; if (t < SERVE) { const k = seg(t, 6.5, SERVE); K.bald.g.position.set(G0.x - .12 + .37 * k, 1.95 + .75 * Math.sin(Math.PI * k * .85), G0.z + .02); } }
  K.fuzzy.g.visible = S.name === 'demo' && t >= FIRE_F; K.fuzzy.g.position.copy(demoFuzzy(t));
  K.rally.g.visible = S.name === 'rally' && t < HIT + 1.1; K.rally.g.position.copy(rallyBall(t));
  K.machine.visible = S.name === 'demo' || S.name === 'shave medium';
  K.machine.position.set(S.name === 'demo' ? 0 : 2.2, 0, S.name === 'demo' ? .6 : -2.5);
  FX.fluff.update(t, S.name === 'ECU ball');
}

// —— overlays ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function ring(t) {
  const k = clamp(.4 + t / .5);
  const c = proj(B0), e = proj(B0.clone().add(V(0, R, 0))), Rp = Math.abs(c[1] - e[1]);
  const cx = c[0] - Rp * .38, cy = c[1] - Rp * .05, rx = Rp * .46, ry = Rp * .4;
  og.save(); og.strokeStyle = '#ff3b30'; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = cx + Math.cos(a0 + a) * rx * w, y = cy + Math.sin(a0 + a) * ry * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function stamp(t) {
  const k = t - 9.2; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .27); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}
function streak(f, t0, t1, t, col = '255,255,255', w = 12) {   // a bright head with a fading trail along a flight
  if (t < t0 || t > t1) return;
  og.save(); og.lineCap = 'round';
  for (let i = 0; i < 10; i++) { const a = proj(f(t - i * .02)), b = proj(f(t - (i + 1) * .02)); og.strokeStyle = `rgba(${col},${.85 * (1 - i / 10)})`; og.lineWidth = w * (1 - i / 12); og.beginPath(); og.moveTo(a[0], a[1]); og.lineTo(b[0], b[1]); og.stroke(); }
  og.restore();
}
function path(f, t0, t, end, col, label, lx, ly) {   // a dotted path drawn up to now, a head marker, a label
  if (t < t0) return;
  og.save(); og.fillStyle = col; og.strokeStyle = col;
  const tn = Math.min(t, end);
  for (let s = t0; s <= tn; s += .025) { const [x, y] = proj(f(s)); og.beginPath(); og.arc(x, y, 7, 0, Math.PI * 2); og.fill(); }
  const [hx, hy] = proj(f(tn)); og.lineWidth = 6; og.beginPath(); og.arc(hx, hy, 20, 0, Math.PI * 2); og.stroke();
  og.font = '800 76px Baloo2'; og.textAlign = 'center'; og.lineWidth = 14; og.strokeStyle = '#000'; og.lineJoin = 'round';
  const a = clamp((t - t0) / .3); og.globalAlpha = a; og.strokeText(label, lx, ly); og.fillText(label, lx, ly);
  og.restore();
}

let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  const C = S.cam(u);
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  setProps(t);
  S.set(u, tc);
  L.setSun(SUN, V(0, 0, -10), 22);
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
  if (S.name === 'serve' && t >= SERVE) streak(serveBall, SERVE, 7.6, t);
  if (S.name === 'streak wide') { streak(serveBall, SERVE, SERVE + 1.2, t, '255,255,255', 16); stamp(t); }
  if (S.name === 'demo') { path(demoBald, FIRE_B, t, FIRE_B + .74, '#ff6a50', 'BALD: OUT!', W * .3, H * .17); path(demoFuzzy, FIRE_F, t, FIRE_F + 1.6, '#ffd84a', 'FUZZY: IN', W * .72, H * .4); }
  if (S.name === 'rally') streak(rallyBall, 17.0, HIT + 1.1, t, '230,245,120', 10);
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(t, STORY.caps[0].t0), W, H);
}
// sound events (core/render/events.mjs → events.json, read by mix.py)
const EV = [
  { t: 0, type: 'buzz', dur: 2.0 }, { t: 2.2, type: 'buzz', dur: 2.9, gain: .45 }, { t: 5.42, type: 'sparkle' },
  { t: 6.12, type: 'swish', gain: .25 }, { t: 6.95, type: 'swish', gain: 1 }, { t: SERVE, type: 'ping' }, { t: SERVE + .02, type: 'zip' },
  { t: 7.7, type: 'zip', gain: .6 }, { t: 8.3, type: 'fence' }, { t: 8.6, type: 'cricket', dur: 1.4 }, { t: 9.2, type: 'buzzer' }, { t: 9.2, type: 'stamp' },
  { t: 11.6, type: 'thump' }, { t: 11.62, type: 'zip', gain: .5 }, { t: 12.3, type: 'fence', gain: .4 }, { t: 13.0, type: 'thump' }, { t: 13.81, type: 'bounce' }, { t: 14.5, type: 'bounce', gain: .5 },
  { t: 17.85, type: 'swish', gain: .8 }, { t: HIT, type: 'pok' }, { t: 23.7, type: 'knit', dur: .8 },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, cards, L, SHOTS, FX };
render(0);
window.READY = true;
