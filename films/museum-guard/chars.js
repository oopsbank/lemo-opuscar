// Pixel characters for "You Are a Night Museum Guard": drawn pixel by pixel (3/4 view, facing right), one frame per pose,
// packed into atlases; billboards take the scene lighting and cast cut-out shadows. Emissive layers carry the torch lens,
// the mummy's eyes, the candle flame and your eyes in the dark.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 27;   // character pixel → metres
const INK = hex('#1a1016'), BLUSH = hex('#e0806c');
const C = {
  lime: ramp(['#1c440a', '#36741a', '#58aa22', '#86d636', '#c2f466'], .22),     // cap + jacket (the hero colour)
  navy: ramp(['#10131e', '#1c2232', '#2c3550', '#40507a'], .22),
  skin: ramp(['#a86a52', '#d6987a', '#efc09c', '#ffdcc0'], .22),
  hair: ramp(["#2a1a10", "#4a2e1a", "#6e4626", "#946236"], .22),
  shoe: ramp(['#141416', '#26262c', '#3a3a44'], .22),
  metal: ramp(['#2a2e36', '#4e5664', '#8a94a4', '#d4dce6'], .22),
  gold: ramp(['#4a3210', '#8a621c', '#c89a38', '#f0d27a', '#fff2c0'], .22),
  bone: ramp(['#4e4434', '#8c7c62', '#bfae8c', '#e4d7b8', '#fff4dc'], .22),
  wrap: ramp(['#4a4232', '#7e7258', '#ab9e80', '#d2c6a6', '#f0e8cc'], .22),
  hatA: ramp(['#7a1a4a', '#c42a72', '#f0549a', '#ff9cc6'], .22), hatB: ramp(['#7a5a0a', '#c8a01c', '#f4d23a', '#fff08a'], .22),
  cake: ramp(['#5a2e1a', '#8a4e2a', '#b87a44', '#dca46a'], .22), icing: ramp(['#b04a7a', '#e07aa8', '#ffb4d2', '#fff0f6'], .22),
};
const ell = (P, cx, cy, rx, ry, f) => P.ellipse(cx, cy, rx, ry, f);
const FLAME = [[255, 196, 90], [255, 240, 180], [255, 140, 50]];

function partyHat(P, x, y, h = 9) {   // apex at (x, y), base below
  for (let j = 0; j < h; j++) { const w = Math.round(j * .45); for (let i = -w; i <= w; i++) P.set(x + i, y + j, ((j + i) >> 1) % 2 ? C.hatA(.6 - i * .03, 0, 0) : C.hatB(.6 - i * .03, 0, 0)); }
  P.set(x, y - 1, C.hatB(.9, 0, 0)); P.set(x - 1, y - 1, C.hatA(.8, 0, 0)); P.set(x, y - 2, C.hatA(.9, 0, 0));
}

// —— the guard's head: lime peaked cap with a gold badge, facing right ——
function head(P, E, hx, hy, p) {
  ell(P, hx, hy + .5, 5.4, 5.8, (x, y, dx, dy) => C.skin(.6 - dx * .14 - dy * .3, x, y));
  for (let y = hy - 2; y < hy + 3; y++) { P.set(hx - 5, y, C.hair(.4, 0, 0)); P.set(hx - 4, y, C.hair(.55, 0, 0)); }
  const ex = hx + 2, ey = hy + 1, face = p.face || 'n';
  if (p.dark) {   // only your eyes, glowing in the black
    if (!p.blink) for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); E.rect(x - 1, ey - 1, 2, 2, [235, 240, 255]); P.set(x, ey, INK); E.set(x, ey, [10, 10, 20]); }
  } else if (p.blink || face === 'sleep') { P.set(ex, ey, C.skin(.15, 0, 0)); P.set(ex - 1, ey, C.skin(.15, 0, 0)); P.set(ex - 3, ey, C.skin(.15, 0, 0)); P.set(ex - 4, ey, C.skin(.15, 0, 0)); }
  else if (face === 'shock') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
  else if (face === 'smile' || face === 'happy') for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); }
  else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
  if (!p.dark) {
    if (face === 'shock') { P.rect(ex - 1, ey - 4, 2, 1, C.hair(.2, 0, 0)); P.rect(ex - 4, ey - 4, 2, 1, C.hair(.2, 0, 0)); }
    if (face === 'worry') { P.set(ex, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 1, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 4, ey - 2, C.hair(.2, 0, 0)); }
    P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 6, hy + 3, C.skin(.4, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
    if (face === 'shock' || p.mouth) P.rect(hx + 2, hy + 4, 2, 2, INK);
    else if (face === 'blow') { P.set(hx + 5, hy + 4, INK); P.set(hx + 6, hy + 4, C.skin(.8, 0, 0)); ell(P, hx + 3, hy + 3.5, 1.6, 1.4, (x, y) => C.skin(.8, x, y)); P.set(hx + 5, hy + 4, INK); }
    else if (face === 'smile' || face === 'happy') { P.set(hx + 1, hy + 5, INK); P.rect(hx + 2, hy + 6, 3, 1, INK); P.set(hx + 5, hy + 5, INK); }
    else if (face === 'sleep') { P.rect(hx + 2, hy + 5, 2, 1, INK); }
    else P.rect(hx + 2, hy + 5, 2, 1, C.skin(.2, 0, 0));
  }
  if (p.hat) partyHat(P, hx - 1, hy - 14, 9);
  // navy guard cap: flat crown, black peak, gold badge
  P.rect(hx - 6, hy - 6, 12, 4, C.navy(.62, 0, 0)); P.rect(hx - 6, hy - 7, 11, 1, C.navy(.8, 0, 0)); P.rect(hx - 5, hy - 2, 10, 1, C.navy(.3, 0, 0));
  for (let x = hx + 2; x <= hx + 7; x++) P.set(x, hy - 1, C.shoe(.15, 0, 0));
  P.rect(hx, hy - 5, 2, 2, C.gold(.8, 0, 0));
}

// ———————————————— YOU, the guard (34×50) ————————————————
// p: { step, arm:'torch'|'up'|'run0'|'run1'|'low'|'blow'|'cheer', sit, face, blink, bob, lean, dark, hat, torch(0..1) }
function drawGuard(P, E, p) {
  const by = (p.bob || 0) + (p.sit ? 10 : 0), top = 20 + by, hx = 16 + (p.lean || 0), hy = 11 + by;
  if (p.sit) {
    for (let y = 37; y < 41; y++) for (let x = 12; x < 24; x++) P.set(x, y, C.navy(.45 - (y - 37) * .08, x, y));
    for (const lx of [20, 23]) { for (let y = 41; y < 48; y++) for (let x = lx; x < lx + 3; x++) P.set(x, y, C.navy(.35, x, y)); P.rect(lx, 47, 4, 2, C.shoe(.5, 0, 0)); }
  } else {
    const st = p.step ?? -1, run = p.arm?.startsWith('run');
    const legs = st < 0 ? [[13, 0], [18, 0]] : run ? [[[9, -1], [21, 0]], [[13, -2], [17, 0]], [[21, 0], [9, -1]], [[17, 0], [13, -2]]][st] : [[[11, 0], [20, -1]], [[14, -1], [17, 0]], [[20, -1], [11, 0]], [[17, 0], [14, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      for (let y = 34; y < 46 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.navy(.4 - (x === lx ? .12 : 0) + (i ? 0 : .1), x, y));
      P.rect(lx, 46 + ly, 5, 3, C.shoe(i ? .4 : .6, 0, 0)); P.rect(lx, 48 + ly, 6, 1, C.shoe(.1, 0, 0));
    });
  }
  // lime jacket, navy belt, gold buttons
  P.poly([[10, top], [22, top], [23, top + 15], [9, top + 15]], (x, y) => { const s = (x - 9) / 14; let v = .7 - s * .4; if (x === 16) v -= .25; if (y === top + 14) v -= .2; return C.lime(v, x, y); });
  P.rect(9, top + 12, 15, 2, C.navy(.35, 0, 0)); for (const y of [top + 3, top + 7]) P.set(17, y, C.gold(.8, 0, 0));
  head(P, E, hx, hy, p);
  const sl = (pts, s = .6) => pts.forEach(([x, y]) => { P.set(x, y, C.lime(s, x, y)); P.set(x, y + 1, C.lime(s - .25, x, y)); });
  const hand = (x, y, w = 2, h = 2) => P.rect(x, y, w, h, C.skin(.6, 0, 0));
  const lit = p.torch ?? 1;
  const torchAt = (x, y, up) => {   // a chunky torch: barrel + bright lens (emissive when lit)
    if (up) { P.rect(x, y - 3, 3, 5, C.metal(.55, 0, 0)); P.rect(x - 1, y - 5, 5, 2, C.metal(.8, 0, 0)); for (let i = 0; i < 3; i++) { const c = lit > .05 ? [255, 250, 220] : [90, 96, 110]; P.set(x + i, y - 6, c); if (lit > .05) E.set(x + i, y - 6, c); } return; }
    P.rect(x, y, 5, 3, C.metal(.55, 0, 0)); P.rect(x + 5, y - 1, 2, 5, C.metal(.8, 0, 0));
    for (let j = 0; j < 3; j++) { const c = lit > .05 ? [255, 250, 220] : [90, 96, 110]; P.set(x + 7, y + j, c); if (lit > .05) E.set(x + 7, y + j, c); }
  };
  const a = p.arm || 'torch';
  if (a === 'torch') { sl([[21, top + 2], [23, top + 4], [25, top + 5]]); hand(26, top + 5); torchAt(27, top + 4); P.set(9, top + 9, C.skin(.35, 0, 0)); }
  if (a === 'low') { sl([[21, top + 2], [22, top + 4], [22, top + 6], [22, top + 8], [22, top + 10]]); hand(22, top + 12); torchAt(23, top + 12); }
  if (a === 'up') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5], [24, top - 7]]); hand(24, top - 9); torchAt(24, top - 9, true); sl([[11, top + 1], [10, top - 1], [9, top - 3], [8, top - 5], [8, top - 7]], .45); hand(7, top - 9); }
  if (a === 'run0') { sl([[21, top + 2], [23, top + 3], [24, top + 5]]); hand(25, top + 6); torchAt(26, top + 5); sl([[11, top + 2], [9, top + 1], [8, top - 1]], .45); hand(7, top - 2); }
  if (a === 'run1') { sl([[21, top + 2], [23, top + 1], [24, top - 1]]); hand(25, top - 2); torchAt(26, top - 3); sl([[11, top + 2], [10, top + 4], [9, top + 6]], .45); hand(8, top + 7); }
  if (a === 'blow') { sl([[21, top + 3], [22, top + 6], [22, top + 9]]); hand(22, top + 11); torchAt(23, top + 11); }
  if (a === 'cheer') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5]]); hand(24, top - 7); sl([[11, top + 1], [10, top - 1], [9, top - 3], [8, top - 5]], .45); hand(7, top - 7); }
  if (a === 'sleep') { sl([[21, top + 3], [21, top + 6], [20, top + 9]]); hand(19, top + 10); P.rect(13, top + 10, 6, 3, C.metal(.5, 0, 0)); }
}
const GUARD_T = {
  stand: {}, stand1: { bob: 1 }, blink: { blink: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  look: { face: 'worry' }, worry1: { face: 'worry', bob: 1 },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 }, talkShock: { arm: 'up', face: 'shock', mouth: 1 },
  talk: { face: 'n', mouth: 1 }, talkW: { face: 'worry', mouth: 1 },
  r0: { step: 0, arm: 'run0', face: 'shock', lean: 1 }, r1: { step: 1, arm: 'run1', face: 'shock', lean: 1, bob: -1 }, r2: { step: 2, arm: 'run0', face: 'shock', lean: 1 }, r3: { step: 3, arm: 'run1', face: 'shock', lean: 1, bob: -1 },
  dimW0: { step: 0, torch: 0 }, dimW1: { step: 1, bob: -1, torch: 0 }, dimW2: { step: 2, torch: 0 }, dimW3: { step: 3, bob: -1, torch: 0 }, dim: { torch: 0, face: 'worry' },
  dark: { dark: 1, arm: 'low', torch: 0 }, darkBlink: { dark: 1, blink: 1, arm: 'low', torch: 0 }, darkTalk: { face: 'worry', mouth: 1, torch: 0, arm: 'low' },
  surprised: { arm: 'up', face: 'shock', torch: 0 }, happy: { arm: 'cheer', face: 'happy', torch: 0 }, happy1: { arm: 'cheer', face: 'happy', torch: 0, bob: -1 },
  smile: { arm: 'low', face: 'smile', torch: 0 }, blow: { arm: 'blow', face: 'blow', lean: 1, torch: 0 },
  sleep: { sit: 1, arm: 'sleep', face: 'sleep', hat: 1, torch: 0 }, sleep1: { sit: 1, arm: 'sleep', face: 'sleep', hat: 1, torch: 0, bob: 1 },
};

// ———————————————— THE DINOSAUR SKELETON (132×100) ————————————————
// p: { look (skull turned back at you), step (frozen mid-stride, leaning in), down (head lowered to you), hat, jaw, wink }
function bone(P, x0, y0, x1, y1, r, v) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) if (j * j + k * k <= r * r + .5) P.set(Math.round(x + k), Math.round(y + j), C.bone(v - j * .08, 0, 0)); }
  for (const [x, y] of [[x0, y0], [x1, y1]]) ell(P, x, y, r + 1.2, r + 1.2, (xx, yy, dx, dy) => C.bone(v + .1 - dy * .2, xx, yy));
}
const qb = (a, b, c, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * b[1] + u * u * c[1]];
function skull(P, E, x, y, dir, p) {   // (x, y) = back of the skull; dir +1 faces right
  const pt = (dx, dy) => [x + dx * dir, y + dy];
  const poly = pts => pts.map(([dx, dy]) => pt(dx, dy));
  P.poly(poly([[-2, -5], [8, -8], [18, -6], [24, -3], [24, 2], [12, 3], [0, 4]]), (xx, yy) => C.bone(.72 - (yy - y) * .05, xx, yy));
  const jo = p.jaw ? 5 : 0;   // lower jaw
  P.poly(poly([[2, 4], [12, 4 + jo * .4], [22, 3 + jo], [22, 6 + jo], [10, 9 + jo * .5], [2, 8]]), (xx, yy) => C.bone(.55, xx, yy));
  for (let i = 0; i < 6; i++) { const [tx, ty] = pt(12 + i * 2, 3); P.set(tx, ty, C.bone(.95, 0, 0)); if (p.jaw) { const [bx, b2] = pt(12 + i * 2, 3 + jo); P.set(bx, b2, C.bone(.95, 0, 0)); } }
  // eye socket and nostril holes (dark), and a tiny pupil when it's watching you
  const [ex, ey] = pt(7, -3); P.rect(ex - 2, ey - 1, 4, 3, INK);
  if (p.look || p.wink !== undefined) { if (p.wink) P.rect(ex - 2, ey, 4, 1, C.bone(.4, 0, 0)); else { P.set(ex + (dir > 0 ? 0 : -1), ey, [250, 250, 245]); } }
  const [nx, ny] = pt(20, -3); P.rect(nx - 1, ny, 2, 2, INK);
  const [fx, fy] = pt(14, 0); P.rect(fx - 2, fy - 1, 4, 2, C.bone(.3, 0, 0));   // fenestra
  if (p.hat) { const [hx, hy] = pt(6, -8); partyHat(P, hx, hy - 12, 12); }
}
function drawDino(P, E, p) {
  const lean = p.step ? 1 : 0, Hp = [54 + lean * 5, 44 + lean * 4], S = [86 + lean * 7, 48 + lean * 6];
  // tail
  const tail = [[4, 24], [24, 38], Hp];
  for (let i = 0; i < 18; i++) { const u = i / 17, [x, y] = qb(tail[0], tail[1], tail[2], u); const r = Math.round(.6 + u * 2.2); ell(P, x, y, r + .6, r + .4, (xx, yy, dx, dy) => C.bone(.75 - dy * .3, xx, yy)); if (i % 2 === 0 && u > .2) P.line(x, y - r, x - 1, y - r - 2 - Math.round(u * 2), C.bone(.6, 0, 0)); }
  // far hind leg (darker)
  const legs = (near, raise) => {
    const v = near ? .7 : .45, o = near ? 0 : -6;
    const K = raise ? [Hp[0] + 16, Hp[1] + 12] : [Hp[0] + 6 + o, Hp[1] + 24], A = raise ? [Hp[0] + 12, Hp[1] + 30] : [Hp[0] - 2 + o, Hp[1] + 42], F = raise ? [Hp[0] + 22, Hp[1] + 32] : [Hp[0] + 10 + o, 98];
    bone(P, Hp[0] + o * .3, Hp[1] + 4, K[0], K[1], 2, v); bone(P, K[0], K[1], A[0], A[1], 1.5, v - .05); bone(P, A[0], A[1], F[0], F[1], 1, v - .05);
    for (let k = 0; k < 3; k++) P.line(F[0], F[1], F[0] + 3 + k, F[1] - 1 + k, C.bone(v, 0, 0));
  };
  legs(false, false);
  // spine (hips → shoulders) with dorsal spines, and ribs hanging under it
  for (let i = 0; i <= 12; i++) { const u = i / 12, x = Hp[0] + (S[0] - Hp[0]) * u, y = Hp[1] + (S[1] - Hp[1]) * u - Math.sin(u * Math.PI) * 4; ell(P, x, y, 2.6, 2.2, (xx, yy, dx, dy) => C.bone(.8 - dy * .3, xx, yy)); P.line(x, y - 2, x - 1, y - 5, C.bone(.6, 0, 0));
    if (i > 1 && i < 12 && i % 2 === 0) { const len = 12 + Math.sin(u * Math.PI) * 8; for (let k = 0; k < len; k++) P.set(Math.round(x + Math.sin(k / len * 2.4) * 3), Math.round(y + 2 + k), C.bone(.62 - k / len * .2, 0, 0)); } }
  // pelvis blade
  P.poly([[Hp[0] - 7, Hp[1] - 2], [Hp[0] + 6, Hp[1] - 5], [Hp[0] + 8, Hp[1] + 6], [Hp[0] - 4, Hp[1] + 8]], (x, y) => C.bone(.7 - (y - Hp[1]) * .03, x, y));
  ell(P, Hp[0] + 1, Hp[1] + 1, 2, 2, INK);
  legs(true, !!p.step);
  // little arms
  bone(P, S[0] + 2, S[1] + 6, S[0] + 7, S[1] + 13, 1, .6); bone(P, S[0] + 7, S[1] + 13, S[0] + 11, S[1] + 12, .6, .6);
  // neck → skull
  const N = p.down ? [S[0] + 20, S[1] + 18] : p.step ? [S[0] + 18, S[1] - 2] : [S[0] + 14, S[1] - 18];
  for (let i = 0; i <= 8; i++) { const u = i / 8, [x, y] = qb(S, [S[0] + 12, S[1] - (p.down ? 6 : 10)], N, u); ell(P, x, y, 2.4, 2.2, (xx, yy, dx, dy) => C.bone(.78 - dy * .3, xx, yy)); }
  if (p.look) skull(P, E, N[0] + 4, N[1] - 4, -1, p); else skull(P, E, N[0] - 2, N[1] - (p.down ? 0 : 2), 1, p);
}
const DINO_T = {
  stand: {}, look: { look: 1 }, step: { step: 1 }, stepLook: { step: 1, look: 1 },
  down: { down: 1, hat: 1, jaw: 1 }, downC: { down: 1, hat: 1 }, hat: { hat: 1 }, hatLook: { hat: 1, look: 1, wink: 0 }, hatWink: { hat: 1, look: 1, wink: 1 },
};

// ———————————————— THE MUMMY: sitting up (36×30, the sarcophagus hides the legs) and standing (36×52) ————————————————
function mummyTop(P, E, ox, oy, p) {   // torso + head + arms; (ox, oy) = waist centre
  const bx = ox, by = oy;
  P.poly([[bx - 7, by - 16], [bx + 6, by - 16], [bx + 7, by], [bx - 7, by]], (x, y) => C.wrap(.6 - (x - bx) * .02 + ((y * 2 + x) % 5 === 0 ? -.2 : 0), x, y));
  for (let y = by - 15; y < by; y += 3) P.line(bx - 7, y, bx + 6, y + 1, C.wrap(.35, 0, 0));
  const hx = bx + 1, hy = by - 22;
  ell(P, hx, hy, 5.2, 5.6, (x, y, dx, dy) => C.wrap(.7 - dy * .25 + ((y + x * 2) % 4 === 0 ? -.18 : 0), x, y));
  P.rect(hx - 3, hy - 2, 7, 3, INK);   // eye slit
  const eye = [255, 190, 70];
  if (p.blink) { P.rect(hx - 2, hy - 1, 2, 1, [120, 80, 40]); P.rect(hx + 1, hy - 1, 2, 1, [120, 80, 40]); }
  else for (const x of [hx - 2, hx + 1]) { P.rect(x, hy - 1, 2, 1, eye); E.rect(x, hy - 1, 2, 1, eye); }
  if (p.yawn) { ell(P, hx, hy + 3, 2.2, 2, INK); }
  else if (p.talk) P.rect(hx - 1, hy + 2, 3, 2, INK); else if (p.smile) { P.set(hx - 2, hy + 2, INK); P.rect(hx - 1, hy + 3, 3, 1, INK); P.set(hx + 2, hy + 2, INK); }
  P.set(hx + 5, hy + 1, C.wrap(.85, 0, 0)); P.set(hx + 6, hy + 2, C.wrap(.8, 0, 0)); P.set(hx + 6, hy + 3, C.wrap(.75, 0, 0));   // a loose end
  if (p.hat) partyHat(P, hx, hy - 15, 9);
  const arm = pts => pts.forEach(([x, y]) => P.rect(x, y, 3, 3, C.wrap(.55, x, y)));
  if (p.yawn) { arm([[bx - 9, by - 18], [bx - 10, by - 22], [bx - 10, by - 26]]); arm([[bx + 6, by - 18], [bx + 8, by - 22], [bx + 8, by - 26]]); }
  else if (p.cake) {   // both hands at the chest, holding a pink cake with one candle
    arm([[bx - 8, by - 14], [bx - 6, by - 10]]); arm([[bx + 6, by - 14], [bx + 7, by - 10]]);
    const cx = bx - 6, cy = by - 11;
    P.rect(cx, cy, 14, 5, C.cake(.6, 0, 0)); P.rect(cx, cy - 2, 14, 2, C.icing(.75, 0, 0)); for (let i = 0; i < 14; i += 3) P.set(cx + i, cy, C.icing(.6, 0, 0));
    P.rect(cx + 6, cy - 6, 1, 4, [240, 240, 250]); P.set(cx + 7, cy - 5, [130, 190, 255]);
    if (p.flame) { P.set(cx + 6, cy - 7, FLAME[1]); P.set(cx + 6, cy - 8, FLAME[0]); P.set(cx + 6, cy - 9, FLAME[2]); E.set(cx + 6, cy - 7, FLAME[1]); E.set(cx + 6, cy - 8, FLAME[0]); E.set(cx + 6, cy - 9, FLAME[2]); }
    else if (p.smoke) { P.set(cx + 6, cy - 8, [120, 120, 130]); P.set(cx + 7, cy - 10, [100, 100, 110]); }
  } else if (p.point) { arm([[bx + 6, by - 15], [bx + 9, by - 16], [bx + 12, by - 17]]); arm([[bx - 9, by - 15], [bx - 10, by - 11]]); }
  else { arm([[bx + 5, by - 14], [bx + 6, by - 10], [bx + 6, by - 6]]); arm([[bx - 9, by - 14], [bx - 10, by - 10], [bx - 10, by - 6]]); }
}
function drawMummySit(P, E, p) { mummyTop(P, E, 17, 29, p); }
function drawMummy(P, E, p) {
  for (const lx of [12, 19]) for (let y = 34; y < 51; y++) for (let x = lx; x < lx + 5; x++) P.set(x, y, C.wrap(.5 + ((y + x) % 4 === 0 ? -.2 : 0) + (lx > 15 ? .1 : 0), x, y));
  mummyTop(P, E, 17, 35 + (p.bob || 0), p);
}
const MSIT_T = { sit: {}, blink: { blink: 1 }, talk: { talk: 1 }, yawn: { yawn: 1 }, point: { point: 1, talk: 1 } };
const MUM_T = { cake: { cake: 1, flame: 1, smile: 1, hat: 1 }, cake1: { cake: 1, flame: 1, smile: 1, hat: 1, bob: 1 }, cakeOut: { cake: 1, smoke: 1, smile: 1, hat: 1 }, cakeTalk: { cake: 1, flame: 1, talk: 1, hat: 1 } };

// ———————————————— atlas + character object ————————————————
function atlas(table, draw, FW, FH) {
  const names = Object.keys(table), n = names.length;
  const P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH);
    draw(p1, e1, table[k]); if (!table[k].dark) p1.outline(.3);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); const e = e1.get(x, y); if (e) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n, canvas: P.c };
}
const KINDS = {
  guard: { table: GUARD_T, draw: drawGuard, FW: 34, FH: 50, blob: .42 },
  dino: { table: DINO_T, draw: drawDino, FW: 132, FH: 100, blob: 1.6 },
  mummySit: { table: MSIT_T, draw: drawMummySit, FW: 36, FH: 30, blob: 0 },
  mummy: { table: MUM_T, draw: drawMummy, FW: 36, FH: 52, blob: .42 },
};
export function makeChar(kind, emI = 1.4, cap = 1.3) {
  const K = KINDS[kind], A = atlas(K.table, K.draw, K.FW, K.FH);
  const mesh = billboard(A.tex, K.FW * SPX, K.FH * SPX, { em: A.em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${cap.toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
  mesh.material.customProgramCacheKey = () => 'spriteCap' + cap; mesh.material.needsUpdate = true;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  let sh = null; if (K.blob) { sh = blob(K.blob, .5); sh.position.y = .015; root.add(sh); }
  return {
    root, mesh, atlas: A, shadowBlob: sh, H: K.FH * SPX, W: K.FW * SPX,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
  };
}

// ———————————————— PORTRAITS: oil paintings that look, squint and talk (24×30 per frame) ————————————————
const PC = {
  umber: ramp(['#140c08', '#24160e', '#362218', '#4a3020'], .3), wine: ramp(['#1a080c', '#2e1016', '#441a20', '#5c262c'], .3), slate: ramp(['#0c1018', '#161c28', '#222a3a', '#30394c'], .3),
  coat: ramp(['#0e1630', '#1c2a52', '#2e4278', '#4a62a0'], .22), beard: ramp(['#8c8a86', '#bab8b2', '#e2e0da', '#fbfaf6'], .22),
  wig: ramp(['#7c8698', '#a4aec0', '#ccd4e2', '#eef2fa'], .22), dress: ramp(['#7a2c4a', '#b04a6e', '#dc7a98', '#f8b4c8'], .22),
  fur: ramp(['#6a2e0c', '#a4501a', '#d87a2c', '#f6a84a', '#ffd08a'], .22), ruff: ramp(['#a6a29a', '#d2cec6', '#f2eee6'], .22),
};
function eyes(P, x1, x2, y, p, white = [244, 238, 226]) {
  if (p.squint) { for (const x of [x1, x2]) P.rect(x - 1, y, 3, 1, INK); return; }
  if (p.closed) { for (const x of [x1, x2]) { P.rect(x - 1, y, 3, 1, [90, 60, 50]); } return; }
  const o = p.look || 0; for (const x of [x1, x2]) { P.rect(x - 1, y - 1, 3, 2, white); P.set(x + o, y, INK); P.set(x + o, y - 1, INK); }
}
function drawCaptain(P, p) {
  P.fill((x, y) => PC.umber(.4 + (1 - y / 30) * .35 + ((x * 7 + y * 3) % 9 === 0 ? .1 : 0), x, y));
  P.poly([[2, 30], [4, 22], [12, 19], [20, 22], [22, 30]], (x, y) => PC.coat(.6 - (x - 12) * .02, x, y));
  P.rect(10, 20, 4, 10, PC.beard(.85, 0, 0)); for (const y of [22, 25, 28]) { P.set(8, y, C.gold(.8, 0, 0)); P.set(15, y, C.gold(.8, 0, 0)); }
  ell(P, 12, 12, 5, 6, (x, y, dx, dy) => C.skin(.6 - dx * .15 - dy * .2, x, y));
  P.poly([[6, 14], [18, 14], [16, 21], [12, 22], [8, 21]], (x, y) => PC.beard(.6 + (x % 2) * .1, x, y));   // big white beard
  eyes(P, 10, 14, 11, p); P.rect(11, 13, 3, 1, C.skin(.35, 0, 0));
  if (p.smirk) { P.rect(10, 16, 4, 1, INK); P.set(14, 15, INK); } else if (p.talk) P.rect(11, 16, 3, 2, INK); else P.rect(11, 16, 3, 1, PC.beard(.3, 0, 0));
  P.poly([[2, 7], [12, 2], [22, 7], [19, 9], [5, 9]], (x, y) => INK.map(v => v + 14 + (y - 2) * 3)); P.rect(11, 3, 2, 2, C.gold(.8, 0, 0));   // bicorn
}
function drawDuchess(P, p) {
  P.fill((x, y) => PC.wine(.4 + (1 - y / 30) * .35 + ((x * 5 + y * 7) % 11 === 0 ? .1 : 0), x, y));
  P.poly([[1, 30], [4, 23], [12, 21], [20, 23], [23, 30]], (x, y) => PC.dress(.62 - (x - 12) * .02 + (y % 3 === 0 ? .08 : 0), x, y));
  P.rect(10, 21, 4, 3, C.skin(.7, 0, 0)); P.set(12, 23, [240, 240, 250]); P.set(11, 24, [240, 240, 250]); P.set(13, 24, [240, 240, 250]);   // pearls
  ell(P, 12, 0, 8, 10, (x, y, dx, dy) => PC.wig(.6 - dy * .2 + ((x + y) % 3 === 0 ? .12 : 0), x, y));   // tall powdered wig
  ell(P, 12, 14, 4.6, 5.6, (x, y, dx, dy) => C.skin(.72 - dx * .12 - dy * .15, x, y));
  for (const [x, y] of [[7, 10], [17, 10], [7, 14], [17, 14]]) ell(P, x, y, 2, 2.5, (xx, yy) => PC.wig(.7, xx, yy));   // curls
  eyes(P, 10, 14, 13, p); P.set(10, 11, INK); P.set(14, 11, INK); P.set(15, 16, INK);   // brows + beauty mark
  P.set(9, 15, BLUSH); P.set(15, 15, BLUSH);
  if (p.talk) P.rect(11, 17, 3, 2, [120, 30, 50]); else if (p.smile) { P.set(10, 17, [150, 40, 60]); P.rect(11, 18, 3, 1, [150, 40, 60]); P.set(14, 17, [150, 40, 60]); } else P.rect(11, 17, 3, 1, [170, 60, 80]);
  if (p.fan) P.poly([[15, 30], [17, 22], [23, 21], [23, 28]], (x, y) => ((x - 15) % 2 ? PC.ruff(.8, x, y) : PC.dress(.8, x, y)));
}
function drawCat(P, p) {
  P.fill((x, y) => PC.slate(.4 + (1 - y / 30) * .35 + ((x * 3 + y * 5) % 7 === 0 ? .1 : 0), x, y));
  ell(P, 12, 27, 9, 7, (x, y, dx, dy) => PC.fur(.6 - dy * .2, x, y));
  for (let i = 0; i < 9; i++) ell(P, 5 + i * 1.75, 20, 2, 1.6, (x, y) => PC.ruff(.7 + (i % 2) * .15, x, y));   // ruff
  ell(P, 12, 13, 6.4, 5.6, (x, y, dx, dy) => PC.fur(.65 - dy * .25 + ((x + y * 2) % 5 === 0 ? -.15 : 0), x, y));
  for (const s of [-1, 1]) P.poly([[12 + s * 2, 9], [12 + s * 6, 3], [12 + s * 7, 10]], (x, y) => PC.fur(.6, x, y));
  if (p.yawn) { for (const x of [9, 15]) P.rect(x - 1, 12, 3, 1, INK); ell(P, 12, 16, 2.4, 2.4, [120, 30, 40]); P.set(11, 14, [250, 250, 250]); P.set(13, 14, [250, 250, 250]); }
  else { if (p.closed) for (const x of [9, 15]) P.rect(x - 1, 12, 3, 1, INK); else for (const x of [9, 15]) { P.rect(x - 1, 11, 3, 2, [230, 220, 80]); P.set(x + (p.look || 0), 11, INK); P.set(x + (p.look || 0), 12, INK); }
    P.set(12, 14, [200, 110, 120]); P.set(11, 15, INK); P.set(13, 15, INK); }
  for (const s of [-1, 1]) { P.line(12 + s * 3, 15, 12 + s * 7, 14, PC.ruff(.9, 0, 0)); P.line(12 + s * 3, 16, 12 + s * 7, 17, PC.ruff(.9, 0, 0)); }
}
const PORT = {
  captain: { draw: drawCaptain, T: { n: {}, lookR: { look: 1 }, lookL: { look: -1 }, smirk: { smirk: 1, look: 1 }, talk: { talk: 1 } } },
  duchess: { draw: drawDuchess, T: { n: {}, lookR: { look: 1 }, lookL: { look: -1 }, squint: { squint: 1 }, talk: { talk: 1, look: 1 }, talkSq: { talk: 1, squint: 1 }, smile: { smile: 1, look: 1 }, smileFan: { smile: 1, fan: 1, look: 1 }, talkFan: { talk: 1, fan: 1, look: 1 } } },
  cat: { draw: drawCat, T: { n: { closed: 1 }, open: { look: 1 }, yawn: { yawn: 1 }, lookL: { look: -1 } } },
};
export function makePortrait(kind, wM = 1.2) {
  const K = PORT[kind], names = Object.keys(K.T), n = names.length, FW = 24, FH = 30;
  const P = new PX(FW * n, FH);
  names.forEach((k, i) => { const p1 = new PX(FW, FH); K.draw(p1, K.T[k]); for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); } });
  const tex = texOf(P.done()); tex.repeat.set(1 / n, 1);
  const hM = wM * FH / FW;
  const m = new THREE.MeshLambertMaterial({ map: tex });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), m); plane.receiveShadow = true;
  const g = new THREE.Group(); g.add(plane);
  const gold = new THREE.MeshStandardMaterial({ color: '#c89a38', roughness: .35, metalness: .75, emissive: '#3a2608', emissiveIntensity: .4 });
  const fw = .14;
  for (const [w, h, x, y] of [[wM + fw * 2, fw, 0, hM / 2 + fw / 2], [wM + fw * 2, fw, 0, -hM / 2 - fw / 2], [fw, hM, -wM / 2 - fw / 2, 0], [fw, hM, wM / 2 + fw / 2, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .1), gold); b.position.set(x, y, .03); b.castShadow = true; g.add(b); }
  return { root: g, w: wM, h: hM, frame(name) { const i = names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); tex.offset.x = i / n; } };
}
export { C as COLS };
