// Pixel characters for "You Are a Fish Seller": drawn procedurally pixel by pixel (3/4 view, facing right),
// one frame per pose (poses are data), packed into an atlas; billboards take the scene lighting and cast cut-out shadows.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 27;   // character pixel → metres
const INK = hex('#1a1016');
const C = {
  slick: ramp(['#5e4a0c', '#9c8212', '#d2b622', '#f2dc3e', '#fff59a'], .22),     // lemon-yellow oilskin (the hero colour)
  navy: ramp(['#0f1322', '#1a2038', '#283456', '#3a4a78', '#52649a'], .22),
  skin: ramp(['#a86a52', '#d6987a', '#efc09c', '#ffdcc0'], .22),
  hair: ramp(['#2a1610', '#4a2a1a', '#6e4228', '#8c5a36'], .22),
  boot: ramp(['#121812', '#1f2b1c', '#2f4129', '#42583a'], .22),
  shawl: ramp(['#26122c', '#45204e', '#683272', '#8c4c96', '#ae6cb4'], .22),
  skirt: ramp(['#1e1a1c', '#35302f', '#4d4644', '#665d58'], .22),
  white: ramp(['#7c8494', '#aab2c0', '#d6dce6', '#f4f6fa'], .22),
  grey: ramp(['#3a4250', '#5a6474', '#7c8696', '#a0aab8'], .22),
  beak: ramp(['#8a4a0c', '#d47a14', '#f4a62a', '#ffd25a'], .22),
  wick: ramp(['#3a2410', '#5e3c1c', '#86602e', '#a8823e'], .22),
  fish: ramp(['#28384e', '#4a6482', '#7c9cb8', '#b4cce0', '#e8f2fa'], .22),
  gold: ramp(['#6a4a10', '#b08424', '#e6c040', '#fff0a0'], .22),
};
const BLUSH = hex('#e0806c');

// —— a fish, drawn sideways into a sprite (x,y = top-left, w long; dir 1 = head right) ——
function smallFish(P, x, y, w = 9, dir = 1, vertical = false) {
  const h = Math.max(3, Math.round(w * .38));
  for (let j = 0; j < (vertical ? w : h); j++) for (let i = 0; i < (vertical ? h : w); i++) {
    const u = vertical ? j / (w - 1) : i / (w - 1), v = vertical ? i / (h - 1) : j / (h - 1);   // u along body (0 tail → 1 head), v across
    const uu = dir > 0 ? u : 1 - u;
    const half = uu < .22 ? .5 * (1 - uu / .22) + .12 : Math.sin(Math.min(1, (uu - .18) / .82) * Math.PI) * .5 + .02;
    if (Math.abs(v - .5) > half) continue;
    const c = C.fish(.75 - (v - .5) * .9 + (uu > .82 ? .1 : 0), x + i, y + j);
    P.set(x + i, y + j, c);
  }
  // eye
  if (!vertical) P.set(dir > 0 ? x + w - 3 : x + 2, y + 1, INK); else P.set(x + 1, dir > 0 ? y + w - 3 : y + 2, INK);
}

// ———————————————————————— YOU, the fishmonger (34×50) ————————————————————————
// p: { step 0..3 | null, bob, arm:'low'|'hold'|'talk'|'up'|'give'|'run0'|'run1'|'reach'|'sit', face:'n'|'smile'|'shock'|'frown'|'sad', blink, turn (back view), cap:false }
function drawYou(P, E, p) {
  const by = (p.bob || 0) + (p.sit ? 10 : 0), top = 20 + by, lean = p.lean || 0;
  const hx = 16 + lean, hy = 11 + by;
  // legs + boots
  if (p.sit) {
    for (let y = 37; y < 41; y++) for (let x = 12; x < 24; x++) P.set(x, y, C.navy(.45 - (y - 37) * .08, x, y));   // thighs forward
    for (const lx of [20, 23]) { for (let y = 41; y < 48; y++) for (let x = lx; x < lx + 3; x++) P.set(x, y, C.boot(y > 45 ? .3 : .65 - (x - lx) * .2, x, y)); P.rect(lx, 48, 4, 1, C.boot(.1, 0, 0)); }
  } else {
    const st = p.step ?? -1;
    const legs = st < 0 ? [[13, 0], [18, 0]] : p.arm?.startsWith('run')
      ? [[[9, -1], [21, 0]], [[13, -2], [17, 0]], [[21, 0], [9, -1]], [[17, 0], [13, -2]]][st]
      : [[[11, 0], [20, -1]], [[14, -1], [17, 0]], [[20, -1], [11, 0]], [[17, 0], [14, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      for (let y = 34; y < 42 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.navy(.35 - (x === lx ? .12 : 0) + (i ? 0 : .1), x, y));
      for (let y = 42 + ly; y < 49 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.boot((i ? .55 : .8) - (x === lx ? .3 : 0) - (y > 46 + ly ? .25 : 0), x, y));
      P.rect(lx, 48 + ly, 5, 1, C.boot(.05, 0, 0));
    });
  }
  // torso: navy jumper
  P.poly([[10, top], [22, top], [23, top + 15], [9, top + 15]], (x, y) => C.navy(.6 - (x - 9) / 14 * .35 + ((x + y) % 7 === 0 ? -.1 : 0), x, y));
  // apron: lemon-yellow oilskin, bib + skirt
  if (!p.turn) {
    P.poly([[13, top + 2], [21, top + 2], [23, top + 22], [11, top + 22]], (x, y) => {
      const s = (x - 11) / 12; let v = .78 - s * .38 + (y > top + 9 && (x + y) % 6 === 0 ? -.12 : 0); if (x === 13 || x === 21) v += .08; return C.slick(v, x, y);
    });
    P.line(14, top, 13, top + 2, C.slick(.5, 0, 0)); P.line(20, top, 21, top + 2, C.slick(.5, 0, 0));   // straps
    P.rect(15, top + 6, 4, 3, C.slick(.42, 0, 0)); P.rect(15, top + 6, 4, 1, C.slick(.3, 0, 0));        // pocket
  } else {
    P.rect(12, top + 9, 9, 1, C.slick(.55, 0, 0));   // apron string at the back
    P.set(16, top + 10, C.slick(.45, 0, 0)); P.set(17, top + 11, C.slick(.45, 0, 0));
  }
  // head
  P.ellipse(hx, hy + .5, 5.6, 6, (x, y, dx, dy) => C.skin(.6 - dx * .14 - dy * .3, x, y));
  P.rect(hx - 2, hy + 6, 5, 2, C.skin(.35, 0, 0));   // neck
  const face = p.face || 'n';
  if (p.turn) {   // back of the head
    P.ellipse(hx, hy + 1, 5.4, 5.4, (x, y, dx, dy) => C.hair(.5 - dy * .3 - dx * .1, x, y));
  } else {
    // hair at the back + sideburn
    for (let y = hy - 3; y < hy + 3; y++) { P.set(hx - 5, y, C.hair(.4, 0, 0)); P.set(hx - 4, y, C.hair(.55, 0, 0)); }
    const ex = hx + 2, ey = hy + 1;
    // eyes
    if (p.blink) { P.set(ex, ey, C.skin(.15, 0, 0)); P.set(ex - 3, ey, C.skin(.15, 0, 0)); }
    else if (face === 'shock') { for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); } }
    else if (face === 'smile') { for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); } }
    else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
    // brows
    if (face === 'frown') { P.set(ex - 1, ey - 3, C.hair(.2, 0, 0)); P.set(ex, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 2, ey - 3, C.hair(.2, 0, 0)); }
    else if (face === 'sad') { P.set(ex - 1, ey - 2, C.hair(.2, 0, 0)); P.set(ex, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 4, ey - 2, C.hair(.2, 0, 0)); }
    else if (face === 'shock') { P.rect(ex - 1, ey - 4, 2, 1, C.hair(.2, 0, 0)); P.rect(ex - 4, ey - 4, 2, 1, C.hair(.2, 0, 0)); }
    // big round nose + cheek
    P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 6, hy + 3, C.skin(.4, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
    // mouth
    if (face === 'shock') { P.rect(hx + 2, hy + 4, 2, 2, INK); }
    else if (face === 'smile') { P.set(hx + 1, hy + 4, INK); P.rect(hx + 2, hy + 5, 2, 1, INK); P.set(hx + 4, hy + 4, INK); }
    else if (face === 'sad' || face === 'frown') { P.set(hx + 1, hy + 5, INK); P.rect(hx + 2, hy + 4, 2, 1, INK); P.set(hx + 4, hy + 5, INK); }
    else P.rect(hx + 2, hy + 4, 2, 1, C.skin(.2, 0, 0));
  }
  // cap: yellow oilskin sou'wester (brim longer at the back)
  if (p.cap !== false) {
    P.ellipse(hx - .5, hy - 3.2, 6.2, 3.6, (x, y, dx, dy) => C.slick(.8 - dy * .3 - dx * .15, x, y));
    for (let x = hx - 8; x <= hx + 6; x++) { const y = hy - 1 + (x < hx - 5 ? 1 : 0); P.set(x, y, C.slick(.45, x, y)); P.set(x, y + 1, C.slick(.3, x, y)); }
  }
  // arms
  const sl = (pts, s = .55) => pts.forEach(([x, y]) => { P.set(x, y, C.navy(s, x, y)); P.set(x, y + 1, C.navy(s - .25, x, y)); });
  const hand = (x, y, w = 2, h = 2) => P.rect(x, y, w, h, C.skin(.6, 0, 0));
  const arm = p.arm || 'low';
  if (arm === 'low') { sl([[21, top + 2], [22, top + 3], [22, top + 5], [22, top + 7], [22, top + 9]]); hand(22, top + 11); P.set(9, top + 9, C.skin(.35, 0, 0)); }
  if (arm === 'talk') { sl([[21, top + 2], [22, top + 4], [24, top + 5], [26, top + 5]]); hand(27, top + 3, 2, 3); P.set(9, top + 9, C.skin(.35, 0, 0)); }
  if (arm === 'give') { sl([[21, top + 2], [23, top + 4], [25, top + 5], [27, top + 5]]); hand(28, top + 4, 3, 2); P.set(30, top + 3, C.gold(.9, 0, 0)); P.set(29, top + 3, C.gold(.6, 0, 0)); }
  if (arm === 'hold' || arm === 'holdHi') {   // holding a fish up by the tail
    const hi = arm === 'holdHi' ? -3 : 0;
    sl([[21, top + 1], [23, top - 1 + hi * .3], [24, top - 3 + hi * .6], [25, top - 5 + hi]]); hand(25, top - 7 + hi);
    smallFish(P, 24, top - 5 + hi, 17, -1, true);   // hangs head-down from the hand
    P.set(9, top + 9, C.skin(.35, 0, 0));
  }
  if (arm === 'up') {   // outrage: both arms up
    sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5], [24, top - 7]]); hand(24, top - 9);
    sl([[11, top + 1], [10, top - 1], [9, top - 3], [8, top - 5], [8, top - 7]], .4); hand(7, top - 9);
  }
  if (arm === 'reach') { sl([[21, top + 2], [23, top + 2], [25, top + 2], [27, top + 1], [29, top]]); hand(30, top - 1); sl([[11, top + 2], [9, top + 3]], .4); }
  if (arm === 'run0') { sl([[21, top + 2], [23, top + 3], [24, top + 5]]); hand(25, top + 6); sl([[11, top + 2], [9, top + 1], [8, top - 1]], .4); hand(7, top - 2); }
  if (arm === 'run1') { sl([[21, top + 2], [23, top + 1], [24, top - 1]]); hand(25, top - 2); sl([[11, top + 2], [10, top + 4], [9, top + 6]], .4); hand(8, top + 7); }
  if (arm === 'sit') { sl([[21, top + 2], [22, top + 4], [22, top + 6], [21, top + 8]]); hand(20, top + 10); }
}
const YOU_T = {
  idle0: {}, idle1: { bob: 1 }, blink: { blink: 1 },
  proud: { arm: 'hold', face: 'smile' }, proud1: { arm: 'holdHi', face: 'smile' },
  smile: { face: 'smile' }, talk: { arm: 'talk', face: 'smile' }, talk1: { arm: 'talk', face: 'n', bob: 1 },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 },
  frown: { face: 'frown' }, talkAngry: { arm: 'talk', face: 'frown' }, sad: { face: 'sad' }, give: { arm: 'give', face: 'sad' },
  reach: { arm: 'reach', face: 'shock' },
  r0: { step: 0, arm: 'run0', face: 'shock', lean: 1 }, r1: { step: 1, arm: 'run1', face: 'shock', lean: 1, bob: -1 }, r2: { step: 2, arm: 'run0', face: 'shock', lean: 1 }, r3: { step: 3, arm: 'run1', face: 'shock', lean: 1, bob: -1 },
  skid: { arm: 'up', face: 'shock', step: 0 }, back: { turn: 1 }, backShock: { turn: 1, arm: 'up' },
  sit: { sit: 1, arm: 'sit', face: 'sad' }, sitBlink: { sit: 1, arm: 'sit', face: 'sad', blink: 1 },
};

// ———————————————————————— GRANDMA (30×42) ————————————————————————
// p: { step, arm:'basket'|'two'|'pay', face:'n'|'stare'|'smile', fishOut, bob, blink }
function drawGran(P, E, p) {
  const by = p.bob || 0, hx = 16, hy = 10 + by, top = 17 + by;
  // feet
  const st = p.step ?? -1, feet = st < 0 ? [[11, 0], [16, 0]] : [[[10, 0], [17, -1]], [[12, -1], [15, 0]], [[17, -1], [10, 0]], [[15, 0], [12, -1]]][st];
  feet.forEach(([fx, fy], i) => { P.rect(fx, 38 + fy, 4, 3, C.skirt(i ? .3 : .45, 0, 0)); P.rect(fx, 41 + fy, 5, 1, INK); });
  // skirt (long, dark)
  P.poly([[10, top + 10], [21, top + 10], [24, 39], [7, 39]], (x, y) => C.skirt(.55 - (x - 7) / 17 * .35 + ((x * 3 + y) % 5 === 0 ? -.1 : 0), x, y));
  // shawl (violet) over hunched shoulders
  P.poly([[9, top + 1], [20, top - 1], [24, top + 12], [7, top + 13]], (x, y) => { const s = (x - 7) / 17; let v = .7 - s * .35 + ((x + y * 2) % 6 === 0 ? -.15 : 0); if (y === top + 12 || y === top + 13) v -= .2; return C.shawl(v, x, y); });
  for (let x = 8; x < 24; x += 2) P.set(x, top + 14, C.shawl(.3, 0, 0));   // fringe
  // head (leaning forward)
  P.ellipse(hx + 1, hy + 1, 5, 5.4, (x, y, dx, dy) => C.skin(.62 - dx * .12 - dy * .3, x, y));
  // white hair + bun
  P.ellipse(hx - 1, hy - 2, 5, 3.4, (x, y, dx, dy) => C.white(.8 - dy * .3, x, y));
  P.ellipse(hx - 4, hy - 4, 2.6, 2.6, (x, y, dx, dy) => C.white(.75 - dy * .3, x, y));
  for (let y = hy - 1; y < hy + 3; y++) P.set(hx - 4, y, C.white(.55, 0, 0));
  // glasses + eyes
  const ex = hx + 3, ey = hy + 1, face = p.face || 'n';
  P.rect(ex - 1, ey - 1, 3, 3, [200, 210, 225]); P.rect(ex, ey, 1, 1, INK);
  if (face === 'stare') { P.rect(ex - 1, ey - 1, 3, 1, C.skin(.35, 0, 0)); P.rect(ex - 1, ey, 3, 1, INK); P.rect(ex - 1, ey + 1, 3, 1, [200, 210, 225]); P.set(ex + 1, ey - 1, [255, 255, 255]); E.set(ex + 1, ey - 1, [255, 255, 255]); }
  else if (face === 'smile' || p.blink) { P.rect(ex - 1, ey, 3, 1, [200, 210, 225]); P.set(ex - 1, ey + 1, INK); P.set(ex, ey, INK); P.set(ex + 1, ey + 1, INK); }
  P.set(ex - 2, ey, [120, 126, 140]);   // glasses arm
  P.rect(hx + 5, hy + 2, 2, 2, C.skin(.72, 0, 0)); P.set(hx + 2, hy + 3, BLUSH);   // nose, cheek
  if (face === 'smile') { P.set(hx + 3, hy + 4, INK); P.set(hx + 4, hy + 5, INK); P.set(hx + 5, hy + 4, INK); }
  else if (face === 'stare') P.rect(hx + 3, hy + 5, 3, 1, INK);
  else P.rect(hx + 3, hy + 5, 2, 1, C.skin(.25, 0, 0));
  // basket on the far arm (left)
  const bx = 3, byy = top + 7;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { if (y === 0 && (x === 0 || x === 7)) continue; P.set(bx + x, byy + y, C.wick((x + y) % 2 ? .6 : .35, bx + x, byy + y)); }
  P.line(bx + 1, byy, bx + 4, byy - 4, C.wick(.7, 0, 0)); P.line(bx + 4, byy - 4, bx + 7, byy, C.wick(.7, 0, 0));
  if (p.fishOut) { smallFish(P, bx - 3, byy - 4, 9, -1); }
  P.rect(8, top + 7, 2, 2, C.skin(.5, 0, 0));   // hand on the basket
  // near arm
  const arm = p.arm || 'basket', sl = pts => pts.forEach(([x, y]) => { P.set(x, y, C.shawl(.6, x, y)); P.set(x, y + 1, C.shawl(.35, x, y)); });
  if (arm === 'basket') { sl([[21, top + 3], [22, top + 5], [22, top + 7]]); P.rect(22, top + 9, 2, 2, C.skin(.55, 0, 0)); }
  if (arm === 'two') { sl([[21, top + 3], [23, top + 3], [25, top + 2]]); P.rect(26, top + 1, 2, 2, C.skin(.6, 0, 0)); P.set(26, top - 1, C.skin(.7, 0, 0)); P.set(26, top, C.skin(.7, 0, 0)); P.set(28, top - 1, C.skin(.7, 0, 0)); P.set(27, top, C.skin(.7, 0, 0)); }
  if (arm === 'pay') { sl([[21, top + 3], [23, top + 4], [25, top + 4]]); P.rect(26, top + 3, 2, 2, C.skin(.6, 0, 0)); P.set(28, top + 3, C.gold(.95, 0, 0)); P.set(28, top + 4, C.gold(.6, 0, 0)); }
}
const GRAN_T = {
  stand: {}, stand1: { bob: 1 }, blink: { blink: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: 1 }, w2: { step: 2 }, w3: { step: 3, bob: 1 },
  two: { arm: 'two' }, two1: { arm: 'two', bob: 1 }, stare: { face: 'stare' }, stare1: { face: 'stare', bob: 1 },
  l0: { step: 0, fishOut: 1, face: 'smile' }, l1: { step: 1, bob: 1, fishOut: 1, face: 'smile' }, l2: { step: 2, fishOut: 1, face: 'smile' }, l3: { step: 3, bob: 1, fishOut: 1, face: 'smile' },
  pay: { arm: 'pay', fishOut: 1, face: 'smile' }, smileFish: { fishOut: 1, face: 'smile' },
};

// ———————————————————————— THE GULL (28×26) ————————————————————————
// p: { pose:'stand'|'squawk'|'fly'|'grab', wing:0|1, fish, cap, bob, blink }
function drawGull(P, E, p) {
  const by = p.bob || 0, pose = p.pose || 'stand', fly = pose === 'fly';
  const cx = 13, cy = 15 + by + (fly ? -2 : 0);
  // legs
  if (!fly) { for (const lx of [12, 15]) { P.rect(lx, 21 + by, 1, 4 - by, C.beak(.55, 0, 0)); P.rect(lx, 25, 3, 1, C.beak(.45, 0, 0)); } }
  else { P.set(9, cy + 4, C.beak(.5, 0, 0)); P.set(8, cy + 4, C.beak(.5, 0, 0)); }
  // body: plump white
  P.ellipse(cx, cy, 7, 5, (x, y, dx, dy) => C.white(.85 - dy * .35 - (dx < -.5 ? .15 : 0), x, y));
  // tail
  P.poly([[5, cy - 2], [1, cy - 1], [2, cy + 1], [6, cy + 2]], (x, y) => C.grey(.5, x, y)); P.set(1, cy - 1, INK); P.set(2, cy, INK);
  // head + neck
  const up = pose === 'squawk' ? -2 : pose === 'grab' ? 3 : 0;
  const hx = cx + 6 + (pose === 'grab' ? 2 : 0), hy = cy - 6 + up;
  P.ellipse(hx, hy, 3.6, 3.4, (x, y, dx, dy) => C.white(.88 - dy * .3, x, y));
  P.rect(hx - 2, hy + 2, 3, 3 - Math.min(0, up), C.white(.75, 0, 0));
  // cap: your yellow sou'wester, too big for him
  if (p.cap) { P.ellipse(hx - .5, hy - 2.4, 4.4, 2.4, (x, y, dx, dy) => C.slick(.8 - dy * .3, x, y)); for (let x = hx - 6; x <= hx + 4; x++) P.set(x, hy - 1 + (x < hx - 4 ? 1 : 0), C.slick(.4, x, 0)); }
  // eye with an angry brow (gulls always look cross)
  if (p.blink) P.set(hx + 1, hy, C.grey(.3, 0, 0)); else { P.set(hx + 1, hy, INK); P.set(hx + 1, hy - 1, [250, 250, 250]); }
  P.set(hx, hy - 1 - (p.cap ? 0 : 1), C.grey(.2, 0, 0)); P.set(hx + 1, hy - 2, C.grey(.2, 0, 0)); if (!p.cap) P.set(hx + 2, hy - 2, C.grey(.2, 0, 0));
  // beak
  const bx = hx + 3, byk = hy + 1;
  if (pose === 'squawk') { P.rect(bx, byk - 2, 4, 1, C.beak(.8, 0, 0)); P.set(bx + 4, byk - 3, C.beak(.7, 0, 0)); P.rect(bx, byk + 1, 3, 1, C.beak(.6, 0, 0)); P.set(bx + 3, byk + 2, C.beak(.5, 0, 0)); P.rect(bx, byk - 1, 2, 2, [120, 30, 40]); }
  else { P.rect(bx, byk, 4, 1, C.beak(.8, 0, 0)); P.rect(bx, byk + 1, 3, 1, C.beak(.55, 0, 0)); P.set(bx + 3, byk + 1, [200, 40, 30]); }
  if (p.fish) smallFish(P, bx - 2, byk + 1, 10, 1);
  // wing
  if (fly) {
    if (p.wing) { P.poly([[cx - 3, cy - 2], [cx + 3, cy - 2], [cx - 5, cy - 13], [cx - 8, cy - 11]], (x, y) => C.grey(.75 - (cy - y) * .03, x, y)); P.rect(cx - 8, cy - 13, 3, 2, INK); }
    else { P.poly([[cx - 3, cy], [cx + 3, cy], [cx - 4, cy + 9], [cx - 8, cy + 8]], (x, y) => C.grey(.55, x, y)); P.rect(cx - 8, cy + 7, 3, 2, INK); }
  } else {
    P.poly([[cx - 5, cy - 3], [cx + 4, cy - 3], [cx + 2, cy + 2], [cx - 7, cy + 1]], (x, y) => C.grey(.62 - (y - cy + 3) * .05, x, y));
    P.rect(cx - 7, cy, 3, 2, INK); P.set(cx - 5, cy - 1, [250, 250, 250]);
  }
}
const GULL_T = {
  stand: {}, stand1: { bob: 1 }, blink: { blink: 1 }, squawk: { pose: 'squawk' }, grab: { pose: 'grab' }, grabFish: { pose: 'grab', fish: 1 },
  f0: { pose: 'fly', wing: 1 }, f1: { pose: 'fly', wing: 0 }, ff0: { pose: 'fly', wing: 1, fish: 1 }, ff1: { pose: 'fly', wing: 0, fish: 1 },
  cap: { cap: 1 }, cap1: { cap: 1, bob: 1 }, capSquawk: { cap: 1, pose: 'squawk' }, capBlink: { cap: 1, blink: 1 },
};

// ———————————————————————— atlas + character object ————————————————————————
function atlas(table, draw, FW, FH) {
  const names = Object.keys(table), n = names.length;
  const P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH);
    draw(p1, e1, table[k]); p1.outline(.3);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); const e = e1.get(x, y); if (e) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n, canvas: P.c };
}
const KINDS = {
  you: { table: YOU_T, draw: drawYou, FW: 34, FH: 50, blob: .42 },
  gran: { table: GRAN_T, draw: drawGran, FW: 30, FH: 42, blob: .38 },
  gull: { table: GULL_T, draw: drawGull, FW: 28, FH: 26, blob: .26 },
};
export function makeChar(kind) {
  const K = KINDS[kind], A = atlas(K.table, K.draw, K.FW, K.FH);
  const mesh = billboard(A.tex, K.FW * SPX, K.FH * SPX, { em: A.em, emCol: '#ffffff', emI: 1.4 });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.3 + totalEmissiveRadiance);\n#include <opaque_fragment>'); };
  mesh.material.customProgramCacheKey = () => 'spriteCap'; mesh.material.needsUpdate = true;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  const sh = blob(K.blob, .5); sh.position.y = .015; root.add(sh);
  return {
    root, mesh, atlas: A, shadowBlob: sh, H: K.FH * SPX,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
  };
}

// ———————————————————————— fish lying flat (counter, scale) ————————————————————————
// A top-down pixel fish on a horizontal plane; frames: 0 = eye shut, 1 = eye open (huge), 2 = mouth open
export function fishTex(seed = 0, o = {}) {
  const W = o.w ?? 30, H = o.h ?? 12, nF = 3, P = new PX(W * nF, H), body = o.cols ? ramp(o.cols, .22) : C.fish;
  for (let f = 0; f < nF; f++) {
    const Q = new PX(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / (W - 1), v = (y + .5) / H;
      const half = u < .2 ? .5 * (1 - u / .2) + .1 : Math.sin(Math.min(1, (u - .16) / .84) * Math.PI) * .46 + .03;
      if (Math.abs(v - .5) > half) continue;
      let k = .78 - (v - .5) * 1.1 + (u > .8 ? .08 : 0);
      if (u > .2 && u < .8 && Math.abs(v - .5) < .05) k -= .2;            // lateral line
      if (u > .7 && u < .73) k -= .25;                                       // gill
      if (((x * 3 + y * 5 + seed) % 7) === 0 && u > .25 && u < .75) k += .1; // scales glint
      Q.set(x, y, body(k, x, y));
    }
    const ex = W - 5, ey = Math.round(H * .38);
    if (f === 0) { Q.set(ex - 1, ey, INK); Q.set(ex, ey, INK); Q.set(ex + 1, ey, INK); }
    else { Q.rect(ex - 1, ey - 2, 4, 4, [250, 250, 250]); Q.rect(ex, ey - 1, 2, 2, INK); Q.set(ex - 1, ey - 2, [255, 255, 255]); }
    if (f === 2) { Q.rect(W - 2, ey + 2, 2, 2, [90, 30, 40]); }
    Q.outline(.3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = Q.get(x, y); if (c) P.set(f * W + x, y, c); }
  }
  const t = texOf(P.done()); t.repeat.set(1 / nF, 1);
  return { t, W, H, nF };
}
export function flatFish(seed = 0, o = {}) {
  const F = fishTex(seed, o), s = o.s ?? SPX;
  const m = new THREE.MeshLambertMaterial({ map: F.t, alphaTest: .5, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(F.W * s, F.H * s);
  const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true;
  me.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: F.t, alphaTest: .5, side: THREE.DoubleSide });
  me.userData.frame = i => { F.t.offset.x = i / F.nF; };
  me.userData.len = F.W * s;
  return me;
}
export { C as COLS };
