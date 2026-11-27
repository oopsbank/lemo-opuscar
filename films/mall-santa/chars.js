// Pixel characters for "You Are a Mall Santa" (Job #6): drawn pixel by pixel (3/4 view, facing right), one frame per pose,
// packed into atlases; billboards take the scene lighting and cast cut-out shadows. Every character can squash and stretch.
// The hero is the channel's recurring sprite (the same face, lime jacket), here in the store's red cap.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 27;   // character pixel → metres
const INK = hex('#1a1016'), BLUSH = hex('#e0806c'), WHITE = [246, 244, 238];
const C = {
  lime: ramp(['#1c440a', '#36741a', '#58aa22', '#86d636', '#c2f466'], .22),
  navy: ramp(['#10131e', '#1c2232', '#2c3550', '#40507a'], .22),
  skin: ramp(['#a86a52', '#d6987a', '#efc09c', '#ffdcc0'], .22),
  skin2: ramp(['#6a3e2a', '#94603e', '#bc8456', '#d8a474'], .22),
  hair: ramp(['#2a1a10', '#4a2e1a', '#6e4626', '#946236'], .22),
  shoe: ramp(['#141416', '#26262c', '#3a3a44'], .22),
  gold: ramp(['#4a3210', '#8a621c', '#c89a38', '#f0d27a', '#fff2c0'], .22),
  purple: ramp(['#2a0e3a', '#4a1a66', '#6e2a94', '#9448c0', '#bc78e0'], .22),
  pink: ramp(['#7a1a4a', '#c42a72', '#f0549a', '#ff9cc6'], .22),
  lilac: ramp(['#6a6078', '#948aa6', '#bcb2cc', '#e2dcee'], .22),
  grey: ramp(['#1e2026', '#363a44', '#545a66', '#767e8c', '#9aa2b0'], .22),
  red: ramp(['#4a0a10', '#8a1420', '#c42232', '#ec4a52'], .22),
  paper: ramp(['#8a8478', '#bcb6a8', '#e4dfd2', '#fbf8f0'], .22),
  goat: ramp(['#7a7064', '#aaa294', '#d4cec2', '#f0ece4', '#fffdf8'], .22),
  horn: ramp(['#4a3a28', '#7a6448', '#a68c68'], .22),
  fur: ramp(['#6a2e0c', '#a4501a', '#d87a2c', '#f6a84a', '#ffd08a'], .22),
  box: ramp(['#5a3c1c', '#86602e', '#b08648', '#d0aa68'], .22),
  black: ramp(['#0c0c10', '#18181e', '#26262e', '#363642'], .22),
  dress: ramp(['#9a96a0', '#c8c4cc', '#ecebf0', '#ffffff'], .22),
};
const ell = (P, cx, cy, rx, ry, f) => P.ellipse(cx, cy, rx, ry, f);
const TOUR = [   // shirt colours for the four tourist variants (never green: green is the hero's)
  ramp(['#6a2a08', '#b4501a', '#ee7a2c', '#ffae64'], .22), ramp(['#0e3a6a', '#1c62a4', '#3a92d8', '#7ac4f4'], .22),
  ramp(['#6a1440', '#b02a6a', '#e0569a', '#ff98c4'], .22), ramp(['#7a5a0a', '#c8a01c', '#f4d23a', '#fff08a'], .22),
];

// —— YOU: the hero's head, pillbox cap (navy, gold band), facing right ——
function heroHead(P, hx, hy, p) {
  ell(P, hx, hy + .5, 5.4, 5.8, (x, y, dx, dy) => C.skin(.6 - dx * .14 - dy * .3, x, y));
  for (let y = hy - 3; y < hy + 3; y++) { P.set(hx - 5, y, C.hair(.4, 0, 0)); P.set(hx - 4, y, C.hair(.55, 0, 0)); }
  P.rect(hx - 4, hy - 5, 8, 2, C.hair(.5, 0, 0)); P.set(hx + 3, hy - 4, C.hair(.7, 0, 0)); P.set(hx + 4, hy - 3, C.hair(.6, 0, 0));   // fringe
  const ex = hx + 2, ey = hy + 1, f = p.face || 'n';
  if (p.blink) { P.rect(ex - 1, ey, 2, 1, C.skin(.15, 0, 0)); P.rect(ex - 4, ey, 2, 1, C.skin(.15, 0, 0)); }
  else if (f === 'shock') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
  else if (f === 'smile') for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); }
  else if (f === 'sad') for (const x of [ex, ex - 3]) { P.set(x, ey + 1, INK); P.set(x - 1, ey, INK); }
  else if (f === 'stare') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 1, C.skin(.2, 0, 0)); P.rect(x - 1, ey, 2, 1, INK); }
  else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
  if (f === 'shock') { P.rect(ex - 1, ey - 4, 2, 1, C.hair(.2, 0, 0)); P.rect(ex - 4, ey - 4, 2, 1, C.hair(.2, 0, 0)); }
  if (f === 'worry' || f === 'sad' || f === 'sweat') { P.set(ex, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 1, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 4, ey - 2, C.hair(.2, 0, 0)); }
  P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 6, hy + 3, C.skin(.4, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
  if (f === 'shock' || p.mouth) P.rect(hx + 2, hy + 4, 2, 2, INK);
  else if (f === 'stare') P.rect(hx + 1, hy + 5, 4, 1, INK);
  else if (f === 'smile') { P.set(hx + 1, hy + 5, INK); P.rect(hx + 2, hy + 6, 3, 1, INK); P.set(hx + 5, hy + 5, INK); }
  else if (f === 'sad' || f === 'sweat') { P.set(hx + 1, hy + 6, INK); P.rect(hx + 2, hy + 5, 3, 1, INK); P.set(hx + 5, hy + 6, INK); }
  else P.rect(hx + 2, hy + 5, 2, 1, C.skin(.2, 0, 0));
  if (!p.nocap) {   // the store's red baseball cap, brim to the front, a white logo dot
    P.rect(hx - 4, hy - 9, 9, 4, C.red(.62, 0, 0)); P.rect(hx - 3, hy - 10, 7, 1, C.red(.85, 0, 0)); P.rect(hx - 4, hy - 6, 9, 1, C.red(.35, 0, 0));
    P.rect(hx + 4, hy - 6, 5, 1, C.red(.5, 0, 0)); P.rect(hx + 5, hy - 5, 4, 1, C.red(.2, 0, 0)); P.set(hx + 1, hy - 8, [250, 246, 236]);
  }
  if (f === 'sweat' || p.sweat) { P.set(hx - 2, hy - 3, [170, 220, 255]); P.rect(hx - 3, hy - 2, 2, 2, [140, 200, 250]); P.set(hx - 3, hy, [110, 170, 230]); }
}
// p: { step, arm, face, blink, bob, mouth, nocap }
function drawHero(P, E, p) {
  const by = p.bob || 0, top = 20 + by, hx = 16 + (p.lean || 0), hy = 11 + by;
  const st = p.step ?? -1;
  const legs = st < 0 ? [[13, 0], [18, 0]] : [[[11, 0], [20, -1]], [[14, -1], [17, 0]], [[20, -1], [11, 0]], [[17, 0], [14, -1]]][st];
  legs.forEach(([lx, ly], i) => {
    for (let y = 34; y < 46 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.navy(.4 - (x === lx ? .12 : 0) + (i ? 0 : .1), x, y));
    P.rect(lx, 46 + ly, 5, 3, C.shoe(i ? .4 : .6, 0, 0)); P.rect(lx, 48 + ly, 6, 1, C.shoe(.1, 0, 0));
  });
  // lime jacket, gold buttons, gold name tag
  P.poly([[10, top], [22, top], [23, top + 15], [9, top + 15]], (x, y) => { const s = (x - 9) / 14; let v = .7 - s * .4; if (x === 16) v -= .25; if (y === top + 14) v -= .2; return C.lime(v, x, y); });
  P.rect(9, top + 12, 15, 2, C.navy(.35, 0, 0)); for (const y of [top + 3, top + 7]) P.set(17, y, C.gold(.8, 0, 0));
  P.rect(19, top + 3, 3, 1, C.gold(.9, 0, 0));
  heroHead(P, hx, hy, p);
  const sl = (pts, s = .6) => pts.forEach(([x, y]) => { P.set(x, y, C.lime(s, x, y)); P.set(x, y + 1, C.lime(s - .25, x, y)); });
  const hand = (x, y, w = 2, h = 2) => P.rect(x, y, w, h, C.skin(.6, 0, 0));
  const a = p.arm || 'n';
  if (a === 'n') { sl([[21, top + 2], [22, top + 5], [22, top + 8]]); hand(22, top + 10); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'talk') { sl([[21, top + 2], [23, top + 4], [25, top + 5]]); hand(26, top + 4); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'point') { sl([[21, top + 2], [23, top + 4], [25, top + 6], [27, top + 7]]); hand(28, top + 7); P.rect(30, top + 8, 2, 1, C.skin(.6, 0, 0)); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'slapUp') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5]]); hand(24, top - 7); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'slapDn') { sl([[21, top + 2], [23, top + 5], [25, top + 8]]); P.rect(26, top + 9, 4, 2, C.skin(.6, 0, 0)); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'feed0') { sl([[21, top + 2], [23, top + 3], [25, top + 3]]); hand(26, top + 2); sl([[11, top + 3], [14, top + 6], [17, top + 8]], .45); hand(19, top + 8); }
  if (a === 'feed1') { sl([[21, top + 2], [23, top + 5], [24, top + 8]]); hand(25, top + 9); sl([[11, top + 2], [14, top + 3], [18, top + 3]], .45); hand(20, top + 2); }
  if (a === 'pull') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5]]); hand(24, top - 7); P.rect(25, top - 12, 1, 14, C.gold(.6, 0, 0)); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'carry' || a === 'up') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5]]); hand(24, top - 7); sl([[11, top + 1], [10, top - 1], [9, top - 3], [8, top - 5]], .45); hand(7, top - 7); }
  if (a === 'phone') { sl([[21, top + 2], [21, top - 1]]); hand(20, top - 3); P.rect(18, hy - 2, 3, 8, INK.map(v => v + 30)); P.rect(17, hy - 3, 3, 2, INK.map(v => v + 40)); P.rect(17, hy + 5, 3, 2, INK.map(v => v + 40)); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'key') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5]]); hand(24, top - 7); P.rect(25, top - 13, 1, 6, C.gold(.85, 0, 0)); P.rect(24, top - 15, 3, 3, C.gold(.9, 0, 0)); P.set(25, top - 14, INK); P.rect(26, top - 9, 2, 1, C.gold(.7, 0, 0)); E.rect(24, top - 15, 3, 3, [120, 90, 30]); sl([[11, top + 2], [10, top + 5], [10, top + 8]], .45); hand(9, top + 10); }
  if (a === 'box') {   // carrying a cardboard box of his things (a mug, a little plant-free photo frame)
    P.rect(12, top + 4, 15, 10, C.box(.55, 0, 0)); P.rect(12, top + 4, 15, 1, C.box(.85, 0, 0)); P.rect(12, top + 13, 15, 1, C.box(.25, 0, 0)); P.rect(18, top + 4, 1, 3, C.box(.3, 0, 0));
    P.rect(14, top + 1, 3, 3, [230, 225, 215]); P.rect(20, top, 4, 4, C.gold(.6, 0, 0)); P.rect(21, top + 1, 2, 2, [140, 180, 220]);
    hand(11, top + 8); hand(25, top + 8);
  }
}
const HERO_T = {
  stand: {}, stand1: { bob: 1 }, blink: { blink: 1 }, smile: { face: 'smile' }, stare: { face: 'stare' }, stare1: { face: 'stare', bob: 1 }, stareBlink: { face: 'stare', blink: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  point: { arm: 'point', face: 'stare', mouth: 1 }, pointQ: { arm: 'point', face: 'stare' },
  slapUp: { arm: 'slapUp', face: 'smile' }, slapDn: { arm: 'slapDn', face: 'smile', mouth: 1 },
  feed0: { arm: 'feed0', face: 'worry' }, feed1: { arm: 'feed1', face: 'worry' },
  sweat: { face: 'sweat' }, sweatTalk: { face: 'sweat', arm: 'talk', mouth: 1 }, sweat1: { face: 'sweat', bob: 1 },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 }, worry: { face: 'worry' },
  talk: { arm: 'talk', mouth: 1 }, sad: { face: 'sad', nocap: 1 }, sadCap: { face: 'sad' }, stareNoCap: { face: 'stare', nocap: 1 }, shockNoCap: { face: 'shock', arm: 'up', nocap: 1 },
};

// —— THE CUSTOMER (34×46): stout, purple coat, round sunglasses, lilac bun, pink handbag ——
function drawCustomer(P, E, p) {
  const by = p.bob || 0, st = p.step ?? -1;
  if (p.sit) { for (const lx of [20, 24]) { P.rect(lx, 38, 4, 4, C.skin(.5, 0, 0)); P.rect(lx - 1, 42, 6, 2, C.purple(.15, 0, 0)); } }
  const legs = p.sit ? [] : st < 0 ? [[12, 0], [18, 0]] : [[[10, 0], [19, -1]], [[13, -1], [16, 0]], [[19, -1], [10, 0]], [[16, 0], [13, -1]]][st];
  legs.forEach(([lx, ly], i) => { for (let y = 38; y < 43 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.skin(.45 + (i ? 0 : .1), x, y)); P.rect(lx - 1, 43 + ly, 6, 2, C.purple(.15, 0, 0)); P.rect(lx + 4, 42 + ly, 1, 2, C.purple(.15, 0, 0)); });
  // coat: a wide bell from the shoulders to the knees
  const top = 18 + by;
  P.poly([[10, top], [23, top], [27, top + 21], [6, top + 21]], (x, y) => { let v = .72 - (x - 6) / 21 * .45; if (y >= top + 20) v -= .25; if (x === 16) v -= .15; return C.purple(v, x, y); });
  P.rect(8, top + 1, 17, 2, C.pink(.7, 0, 0));   // fur-ish collar
  for (const y of [top + 6, top + 11, top + 16]) P.set(17, y, C.gold(.8, 0, 0));
  // head: lilac bun, round dark glasses with a white glint, pursed red mouth
  const hx = 16, hy = 10 + by;
  ell(P, hx, hy + 1, 5.6, 6, (x, y, dx, dy) => C.skin(.62 - dx * .12 - dy * .25, x, y));
  ell(P, hx - 2, hy - 5, 6, 3.4, (x, y, dx, dy) => C.lilac(.7 - dy * .3 + ((x + y) % 3 === 0 ? .1 : 0), x, y));
  ell(P, hx - 3, hy - 9, 3.4, 3, (x, y, dx, dy) => C.lilac(.75 - dy * .3, x, y));
  for (let y = hy - 4; y < hy + 3; y++) P.set(hx - 6, y, C.lilac(.45, 0, 0));
  for (const x of [hx + 3, hx - 1]) { ell(P, x, hy + 1, 2.1, 1.9, INK); P.set(x - 1, hy, [200, 200, 230]); E.set(x - 1, hy, [60, 60, 70]); }
  P.set(hx + 1, hy + 1, INK);
  P.rect(hx + 5, hy + 2, 2, 2, C.skin(.7, 0, 0));
  if (p.mouth) P.rect(hx + 2, hy + 5, 3, 2, [140, 20, 40]); else if (p.smug) { P.rect(hx + 1, hy + 5, 4, 1, [190, 40, 60]); P.set(hx + 5, hy + 4, [190, 40, 60]); } else P.rect(hx + 2, hy + 5, 2, 1, [200, 40, 60]);
  // arms
  const sl = (pts, s = .55) => pts.forEach(([x, y]) => { P.rect(x, y, 2, 2, C.purple(s, x, y)); });
  const hand = (x, y) => P.rect(x, y, 2, 2, C.skin(.62, 0, 0));
  const bag = (x, y) => { P.rect(x, y, 6, 5, C.pink(.6, 0, 0)); P.rect(x, y, 6, 1, C.pink(.85, 0, 0)); P.line(x + 1, y - 1, x + 3, y - 3, C.gold(.7, 0, 0)); P.line(x + 3, y - 3, x + 5, y - 1, C.gold(.7, 0, 0)); };
  const a = p.arm || 'n';
  sl([[9, top + 2], [8, top + 6], [7, top + 10]], .4); hand(6, top + 12); bag(3, top + 13);
  if (a === 'n' || a === 'talk') { sl([[22, top + 2], [24, top + 6], [25, top + 10]]); hand(26, top + 12); }
  if (a === 'bellUp') { sl([[22, top + 1], [24, top - 2], [26, top - 5]]); hand(27, top - 7); }
  if (a === 'bellDn') { sl([[22, top + 2], [25, top + 4], [28, top + 6]]); hand(30, top + 7); }
  if (a === 'demand') { sl([[22, top + 1], [24, top - 1], [26, top - 3]]); hand(27, top - 5); P.set(28, top - 7, C.skin(.62, 0, 0)); P.set(28, top - 8, C.skin(.62, 0, 0)); }
  if (a === 'up2') { sl([[22, top + 1], [23, top - 2], [24, top - 5]]); hand(24, top - 7); P.rect(9, top - 2, 2, 3, C.purple(.4, 0, 0)); hand(9, top - 4); }
  if (a === 'dn2') { sl([[22, top + 2], [25, top + 4], [28, top + 6]]); hand(30, top + 6); }
  if (a === 'cross') { P.rect(11, top + 7, 13, 3, C.purple(.5, 0, 0)); P.rect(11, top + 7, 13, 1, C.purple(.7, 0, 0)); hand(22, top + 7); hand(11, top + 8); }
}
const CUST_T = {
  stand: {}, talk: { mouth: 1, arm: 'demand' }, demand: { arm: 'demand' }, bellUp: { arm: 'bellUp', mouth: 1 }, bellDn: { arm: 'bellDn' }, bellUpQ: { arm: 'bellUp' }, bellDnT: { arm: 'bellDn', mouth: 1 },
  up2: { arm: 'up2', mouth: 1 }, dn2: { arm: 'dn2', mouth: 1 }, dn2q: { arm: 'dn2' }, sit: { sit: 1, arm: 'demand', smug: 1 }, sitTalk: { sit: 1, arm: 'demand', mouth: 1 }, sitShock: { sit: 1, arm: 'up2', mouth: 1 }, sitShock1: { sit: 1, arm: 'up2', mouth: 1, bob: -1 },
  cross: { arm: 'cross' }, crossTalk: { arm: 'cross', mouth: 1 }, smug: { arm: 'cross', smug: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
};

// —— THE MANAGER (32×60): tall, grey suit, red tie, bald with a grey fringe, a clipboard ——
function drawManager(P, E, p) {
  const by = p.bob || 0, st = p.step ?? -1;
  const legs = st < 0 ? [[12, 0], [17, 0]] : [[[10, 0], [19, -1]], [[13, -1], [16, 0]], [[19, -1], [10, 0]], [[16, 0], [13, -1]]][st];
  legs.forEach(([lx, ly], i) => { for (let y = 38; y < 56 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.grey(.35 + (i ? 0 : .1) - (x === lx ? .1 : 0), x, y)); P.rect(lx, 56 + ly, 6, 3, C.shoe(.3, 0, 0)); });
  const top = 18 + by;
  P.poly([[9, top], [22, top], [23, top + 21], [8, top + 21]], (x, y) => { let v = .62 - (x - 8) / 15 * .35; if (x === 15) v -= .2; return C.grey(v, x, y); });
  P.poly([[13, top], [18, top], [15.5, top + 7]], (x, y) => C.paper(.8, x, y)); P.rect(15, top + 1, 2, 9, C.red(.6, 0, 0)); P.rect(15, top + 1, 2, 1, C.red(.85, 0, 0));
  const hx = 16 + (p.nod ? 1 : 0), hy = 10 + by + (p.nod ? 1 : 0);
  ell(P, hx, hy, 5.4, 6.2, (x, y, dx, dy) => C.skin(.64 - dx * .12 - dy * .3, x, y));
  for (let y = hy - 1; y < hy + 3; y++) { P.set(hx - 5, y, C.lilac(.45, 0, 0)); P.set(hx - 4, y, C.lilac(.6, 0, 0)); }
  P.set(hx - 1, hy - 5, [255, 240, 225]);   // the shine on the head
  const ex = hx + 2, ey = hy;
  if (p.nod) { P.rect(ex - 1, ey + 1, 2, 1, INK); P.rect(ex - 4, ey + 1, 2, 1, INK); }
  else { P.set(ex, ey, INK); P.set(ex - 3, ey, INK); P.rect(ex - 1, ey - 2, 3, 1, C.lilac(.3, 0, 0)); P.rect(ex - 4, ey - 2, 2, 1, C.lilac(.3, 0, 0)); }
  P.rect(hx + 5, hy, 2, 3, C.skin(.7, 0, 0));
  P.rect(ex - 1, ey + 2, 4, 1, C.lilac(.55, 0, 0));   // moustache-free: a thin grey line of disapproval above the mouth
  if (p.mouth) P.rect(hx + 2, hy + 4, 2, 2, INK); else if (p.nod) { P.set(hx + 1, hy + 4, INK); P.rect(hx + 2, hy + 5, 3, 1, INK); } else P.rect(hx + 1, hy + 4, 4, 1, INK);
  const sl = (pts, s = .55) => pts.forEach(([x, y]) => P.rect(x, y, 2, 2, C.grey(s, x, y)));
  const hand = (x, y) => P.rect(x, y, 2, 2, C.skin(.62, 0, 0));
  sl([[9, top + 2], [8, top + 6], [8, top + 10], [9, top + 13]], .4); hand(9, top + 15); P.rect(5, top + 9, 6, 9, C.box(.4, 0, 0)); P.rect(6, top + 10, 4, 6, C.paper(.85, 0, 0)); P.rect(7, top + 8, 2, 2, C.grey(.9, 0, 0));
  if (p.point) { sl([[21, top + 2], [23, top + 3], [25, top + 4], [27, top + 5]]); hand(29, top + 5); P.rect(31, top + 5, 1, 1, C.skin(.62, 0, 0)); }
  else { sl([[21, top + 2], [22, top + 6], [22, top + 10], [22, top + 14]]); hand(22, top + 16); }
}
const BOSS_T = { stand: {}, talk: { mouth: 1, point: 1 }, point: { point: 1 }, nod: { nod: 1 }, nodTalk: { nod: 1, mouth: 1 }, w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 } };

// —— THE DAD (36×54): big, a red-and-green Christmas jumper with a white zigzag, beard, green bobble hat ——
const JUMP = ramp(['#4a0a10', '#8a1420', '#c42232', '#e8503c'], .22), BEARD = ramp(['#2a1608', '#4a2a12', '#6e4220', '#8e5a2e'], .22), JEAN = ramp(['#101a30', '#1a2c50', '#2a4478', '#4060a0'], .22), BOTTLE = ramp(['#0a2a1a', '#124a2c', '#1e6a40', '#2e8a56'], .22);
function drawDad(P, E, p) {
  const by = p.bob || 0, st = p.step ?? -1;
  const legs = st < 0 ? [[12, 0], [19, 0]] : [[[10, 0], [21, -1]], [[14, -1], [17, 0]], [[21, -1], [10, 0]], [[17, 0], [14, -1]]][st];
  legs.forEach(([lx, ly], i) => { for (let y = 38; y < 50 + ly; y++) for (let x = lx; x < lx + 5; x++) P.set(x, y, JEAN(.45 + (i ? 0 : .12) - (x === lx ? .12 : 0), x, y)); P.rect(lx - 1, 50 + ly, 7, 3, C.box(.3, 0, 0)); });
  const top = 18 + by;
  P.poly([[9, top], [25, top], [28, top + 12], [27, top + 21], [8, top + 21], [7, top + 10]], (x, y) => { let v = .7 - (x - 7) / 21 * .4; if (y >= top + 19) v -= .3; return JUMP(v, x, y); });
  for (let x = 8; x < 28; x++) { const zz = top + 9 + (x % 4 < 2 ? x % 2 : 1 - x % 2); P.set(x, zz, [240, 236, 226]); P.set(x, top + 7, BOTTLE(.6, x, 0)); P.set(x, top + 12, BOTTLE(.6, x, 0)); }
  const hx = 18, hy = 10 + by;
  ell(P, hx, hy + 1, 6, 6.4, (x, y, dx, dy) => C.skin(.62 - dx * .12 - dy * .25, x, y));
  ell(P, hx + 1, hy + 5, 6, 4, (x, y, dx, dy) => BEARD(.6 - dy * .2 + ((x + y) % 3 === 0 ? .15 : 0), x, y));   // beard
  P.rect(hx - 5, hy - 7, 11, 4, BOTTLE(.55, 0, 0)); P.rect(hx - 5, hy - 4, 11, 2, [236, 232, 222]); ell(P, hx - 1, hy - 9, 2.2, 2.2, [250, 248, 240]);   // bobble hat
  const ex = hx + 3, ey = hy;
  if (p.shock) for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
  else if (p.proud) for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); }
  else for (const x of [ex, ex - 3]) { P.set(x, ey, INK); P.set(x, ey - 1, INK); }
  P.rect(hx + 5, hy, 2, 3, C.skin(.72, 0, 0)); P.set(hx + 2, hy + 2, BLUSH);
  if (p.mouth) P.rect(hx + 2, hy + 4, 3, 2, [90, 20, 20]);
  const sl = (pts, s = .55) => pts.forEach(([x, y]) => P.rect(x, y, 3, 2, JUMP(s, x, y)));
  const hand = (x, y) => P.rect(x, y, 3, 3, C.skin(.62, 0, 0));
  sl([[9, top + 2], [7, top + 6], [6, top + 10], [6, top + 14]], .4); hand(5, top + 16);
  if (p.arm === 'slam') { sl([[23, top + 2], [26, top + 5], [29, top + 8]]); hand(31, top + 9); }
  else if (p.arm === 'up') { sl([[23, top + 1], [25, top - 2], [26, top - 5]]); hand(26, top - 8); P.rect(26, top - 13, 3, 5, [250, 248, 236]); }
  else { sl([[24, top + 2], [26, top + 6], [27, top + 10], [27, top + 14]]); hand(27, top + 16); }
}
const DAD_T = { stand: {}, talk: { mouth: 1, proud: 1 }, proud: { proud: 1 }, slam: { arm: 'slam', mouth: 1, proud: 1 }, up: { arm: 'up', mouth: 1, proud: 1 }, shock: { shock: 1 }, w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 } };

// —— SHOPPERS (30×50) in the queue: 8 coats, each holding the thing they're returning ——
const COATS = [
  ramp(['#0e3a6a', '#1c62a4', '#3a92d8', '#7ac4f4'], .22), ramp(['#6a2a08', '#b4501a', '#ee7a2c', '#ffae64'], .22), ramp(['#3a1a4a', '#5e2e78', '#8a4ab0', '#b47ad8'], .22),
  ramp(['#7a5a0a', '#c8a01c', '#f4d23a', '#fff08a'], .22), ramp(['#3a3a3e', '#5a5a62', '#7e7e88', '#a4a4ae'], .22), ramp(['#6a1440', '#b02a6a', '#e0569a', '#ff98c4'], .22),
  ramp(['#0a3a3a', '#146464', '#24908e', '#56c0bc'], .22), ramp(['#4a2a14', '#74461e', '#a06a32', '#c8945a'], .22),
];
const HAIRS = [C.hair, ramp(['#0c0a0c', '#1c181c', '#2e282c'], .22), ramp(['#7a5a1a', '#b8902c', '#e4c050', '#f8e08a'], .22), C.lilac, ramp(['#4a1a08', '#7a2c10', '#a8441a', '#d0662c'], .22)];
const ITEMS = [0, 1, 2, 3, 4, 5, 3, 2];   // teddy, lamp, jumper, gift box, toaster, little tree
function item(P, E, k, x, y) {
  if (k === 0) { ell(P, x + 4, y + 7, 5, 5.4, (xx, yy, dx, dy) => C.box(.7 - dy * .3, xx, yy)); ell(P, x + 4, y, 3.6, 3.4, (xx, yy, dx, dy) => C.box(.75 - dy * .3, xx, yy)); P.set(x + 1, y - 3, C.box(.5, 0, 0)); P.set(x + 7, y - 3, C.box(.5, 0, 0)); P.set(x + 3, y, INK); P.set(x + 6, y, INK); P.rect(x + 3, y + 4, 3, 1, C.red(.7, 0, 0)); }
  if (k === 1) { P.poly([[x + 1, y - 2], [x + 7, y - 2], [x + 9, y + 4], [x - 1, y + 4]], (xx, yy) => C.paper(.85 - (yy - y) * .05, xx, yy)); P.rect(x + 3, y + 4, 2, 9, C.gold(.5, 0, 0)); P.rect(x + 1, y + 12, 6, 2, C.gold(.4, 0, 0)); }
  if (k === 2) { P.rect(x - 1, y + 2, 11, 9, BOTTLE(.55, 0, 0)); for (let i = 0; i < 11; i++) P.set(x - 1 + i, y + 5 + (i % 2), [236, 60, 60]); P.set(x + 3, y + 8, [250, 250, 250]); P.set(x + 6, y + 8, [250, 250, 250]); }
  if (k === 3) { P.rect(x - 1, y + 1, 11, 10, C.red(.6, 0, 0)); P.rect(x + 4, y + 1, 2, 10, C.gold(.85, 0, 0)); P.rect(x - 1, y + 5, 11, 2, C.gold(.85, 0, 0)); P.rect(x + 2, y - 1, 6, 2, C.gold(.7, 0, 0)); }
  if (k === 4) { P.rect(x - 1, y + 3, 11, 8, C.grey(.8, 0, 0)); P.rect(x - 1, y + 3, 11, 1, C.grey(.95, 0, 0)); P.rect(x + 1, y + 2, 3, 1, INK); P.rect(x + 5, y + 2, 3, 1, INK); P.rect(x + 8, y + 6, 2, 2, C.grey(.3, 0, 0)); }
  if (k === 5) { P.poly([[x + 4, y - 4], [x + 10, y + 8], [x - 2, y + 8]], (xx, yy) => BOTTLE(.5 + ((xx + yy) % 4 === 0 ? .3 : 0), xx, yy)); P.set(x + 4, y - 5, C.gold(.95, 0, 0)); E.set(x + 4, y - 5, [120, 100, 30]); P.set(x + 2, y + 3, [240, 60, 60]); P.set(x + 6, y + 5, [80, 140, 255]); P.rect(x + 2, y + 8, 4, 3, C.red(.5, 0, 0)); }
}
function drawShopper(P, E, p) {
  const v = p.v, by = p.bob || 0, st = p.step ?? -1, coat = COATS[v], hair = HAIRS[v % 5], skin = v % 3 === 1 ? C.skin2 : C.skin;
  const legs = st < 0 ? [[10, p.tap ? -1 : 0], [15, 0]] : [[[8, 0], [17, -1]], [[11, -1], [14, 0]], [[17, -1], [8, 0]], [[14, 0], [11, -1]]][st];
  legs.forEach(([lx, ly], i) => { for (let y = 35; y < 46 + ly; y++) P.rect(lx, y, 4, 1, (v % 2 ? JEAN : C.black)(.5 + (i ? 0 : .12), 0, 0)); P.rect(lx, 46 + ly, 5, 2, C.shoe(.35, 0, 0)); });
  const top = 20 + by, long = v % 3 === 0;
  P.poly([[8, top], [20, top], [long ? 22 : 21, top + (long ? 19 : 15)], [long ? 6 : 7, top + (long ? 19 : 15)]], (x, y) => { let v2 = .7 - (x - 7) / 14 * .42; if (x === 14) v2 -= .2; return coat(v2, x, y); });
  if (v % 4 === 2) P.rect(8, top, 13, 3, [236, 232, 222]);   // a scarf
  const hx = 14, hy = 12 + by;
  ell(P, hx, hy, 5, 5.4, (x, y, dx, dy) => skin(.62 - dx * .12 - dy * .25, x, y));
  if (v % 4 === 1) { P.rect(hx - 5, hy - 7, 10, 4, coat(.3, 0, 0)); ell(P, hx - 1, hy - 8, 2, 1.6, [240, 236, 226]); }   // beanie
  else { ell(P, hx - 1, hy - 3, 5.6, 3.2, (x, y) => hair(.6, x, y)); for (let y = hy - 3; y < hy + (v % 2 ? 5 : 2); y++) P.rect(hx - 6, y, 2, 1, hair(.45, 0, 0)); }
  const ex = hx + 2, ey = hy + 1;
  if (p.look) for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
  else if (p.phone) { P.set(ex, ey + 1, INK); P.set(ex - 3, ey + 1, INK); }
  else { P.set(ex, ey, INK); P.set(ex - 3, ey, INK); }
  if (p.mouth) P.rect(hx + 1, hy + 3, 3, 2, INK); else P.rect(hx + 1, hy + 3, 3, 1, skin(.2, 0, 0));
  const hand = (x, y) => P.rect(x, y, 2, 2, skin(.6, 0, 0));
  if (p.phone) { P.rect(18, top + 1, 2, 5, coat(.5, 0, 0)); hand(19, top - 1); P.rect(20, top - 4, 2, 4, INK.map(c => c + 30)); E.rect(20, top - 4, 1, 3, [60, 90, 130]); item(P, E, ITEMS[v], 6, top + 9); }
  else { P.rect(18, top + 2, 2, 6, coat(.5, 0, 0)); item(P, E, ITEMS[v], 13, top + 4); hand(12, top + 9); hand(21, top + 9); }
}
const SHOP_T = {};
for (let v = 0; v < 8; v++) Object.assign(SHOP_T, { [`${v}s`]: { v }, [`${v}t`]: { v, tap: 1 }, [`${v}p`]: { v, phone: 1 }, [`${v}l`]: { v, look: 1, mouth: 1 }, [`${v}w0`]: { v, step: 0 }, [`${v}w1`]: { v, step: 1, bob: -1 }, [`${v}w2`]: { v, step: 2 }, [`${v}w3`]: { v, step: 3, bob: -1 } });

// —— THE STAFFER (30×50) on a ladder at the shelves: red polo, a box over the head ——
function drawStaffer(P, E, p) {
  const top = 20, hx = 14, hy = 12;
  for (const lx of [10, 15]) { for (let y = 35; y < 46; y++) P.rect(lx, y, 4, 1, C.black(.5, 0, 0)); P.rect(lx, 46, 5, 2, C.shoe(.4, 0, 0)); }
  P.poly([[8, top], [20, top], [21, top + 15], [7, top + 15]], (x, y) => C.red(.7 - (x - 7) / 14 * .4, x, y));
  P.rect(13, top, 2, 8, C.gold(.6, 0, 0));
  ell(P, hx, hy, 5, 5.4, (x, y, dx, dy) => C.skin2(.62 - dx * .12 - dy * .25, x, y));
  ell(P, hx - 1, hy - 4, 5.6, 3, (x, y) => C.black(.5, x, y)); P.rect(hx - 7, hy - 4, 3, 3, C.black(.4, 0, 0));
  if (p.shock) for (const x of [hx + 2, hx - 1]) { P.rect(x - 1, hy, 2, 2, [250, 250, 250]); P.set(x, hy + 1, INK); } else { P.set(hx + 2, hy, INK); P.set(hx - 1, hy, INK); }
  P.rect(hx + 1, hy + 3, 2, p.shock ? 2 : 1, INK);
  const hand = (x, y) => P.rect(x, y, 2, 2, C.skin2(.6, 0, 0));
  if (p.box) { P.rect(6, 0, 16, 9, C.box(.6, 0, 0)); P.rect(6, 0, 16, 1, C.box(.85, 0, 0)); P.rect(13, 0, 2, 9, C.paper(.7, 0, 0)); hand(6, 8); hand(20, 8); P.rect(7, 9, 2, top - 9, C.red(.5, 0, 0)); P.rect(19, 9, 2, top - 9, C.red(.5, 0, 0)); }
  else { P.rect(4, top - 2, 4, 2, C.red(.5, 0, 0)); hand(2, top - 3); P.rect(20, top - 2, 4, 2, C.red(.5, 0, 0)); hand(24, top - 3); }
}
const STAFF_T = { box: { box: 1 }, box1: { box: 1 }, arms: {}, shock: { shock: 1 } };

// —— THE KID on the coin-op rocket ride (40×48): the rocket is part of the sprite ——
function drawKid(P, E, p) {
  const R = C.red, Wt = ramp(['#8a8a96', '#b8b8c4', '#e0e0ea', '#ffffff'], .22);
  P.rect(8, 42, 24, 6, C.grey(.4, 0, 0)); P.rect(8, 42, 24, 1, C.grey(.7, 0, 0)); P.rect(15, 44, 10, 2, [240, 200, 60]); E.rect(15, 44, 10, 2, [120, 90, 20]);   // base with a coin slot light
  ell(P, 20, 28, 9, 13, (x, y, dx, dy) => Wt(.75 - dx * .3 - dy * .1, x, y));   // body
  P.poly([[13, 18], [27, 18], [20, 6]], (x, y) => R(.75 - (x - 13) / 14 * .3, x, y));   // nose cone
  P.poly([[10, 34], [6, 42], [12, 40]], (x, y) => R(.55, x, y)); P.poly([[30, 34], [34, 42], [28, 40]], (x, y) => R(.45, x, y));   // fins
  ell(P, 20, 28, 3.4, 3.4, (x, y, dx, dy) => [80 + dy * 40, 170, 230]); E.rect(18, 26, 3, 3, [30, 60, 90]);   // porthole
  // the kid sits in the cockpit on top: head and arms only
  const hx = 20, hy = 10 - (p.up ? 1 : 0);
  ell(P, hx, hy - 2, 4.4, 4.6, (x, y, dx, dy) => C.skin(.62 - dx * .12 - dy * .25, x, y));
  P.rect(hx - 4, hy - 8, 8, 3, BOTTLE(.6, 0, 0)); ell(P, hx, hy - 9, 1.6, 1.6, [250, 248, 240]);
  P.set(hx + 1, hy - 2, INK); P.set(hx - 2, hy - 2, INK); P.rect(hx - 1, hy + 1, 3, 2, INK);
  if (p.up) { P.rect(hx - 8, hy - 7, 2, 6, BOTTLE(.5, 0, 0)); P.rect(hx + 6, hy - 7, 2, 6, BOTTLE(.5, 0, 0)); P.rect(hx - 8, hy - 9, 2, 2, C.skin(.6, 0, 0)); P.rect(hx + 6, hy - 9, 2, 2, C.skin(.6, 0, 0)); }
  else { P.rect(hx - 7, hy + 2, 3, 2, BOTTLE(.5, 0, 0)); P.rect(hx + 4, hy + 2, 3, 2, BOTTLE(.5, 0, 0)); }
}
const KID_T = { k0: {}, k1: { up: 1 } };

// —— THE CAT (28×20): asleep in the returns tray, walks across the desk, eats the cake ——
function drawCat(P, E, p) {
  const by = p.walk != null ? (p.walk ? -1 : 0) : 0;
  if (p.walk != null) { const L = p.walk ? [0, 1, 1, 0] : [1, 0, 0, 1]; [[6, .5], [9, .7], [17, .5], [20, .7]].forEach(([lx, v], i) => P.rect(lx + L[i], 15, 2, 4, C.fur(v, 0, 0))); }
  if (p.sit) { ell(P, 12, 12, 7, 6.5, (x, y, dx, dy) => C.fur(.7 - dy * .3 + ((x + y * 3) % 5 === 0 ? -.2 : 0), x, y)); }
  else ell(P, 12, 12 + by, 9.5, 4.6, (x, y, dx, dy) => C.fur(.7 - dy * .3 + ((x + y * 3) % 5 === 0 ? -.2 : 0), x, y));
  const hx = p.eat ? 22 : 19, hy = (p.eat ? 13 : p.sit ? 5 : 9) + by;
  ell(P, hx, hy, 4.4, 3.9, (x, y, dx, dy) => C.fur(.75 - dy * .3, x, y));
  for (const x of [hx - 3, hx + 1]) P.poly([[x - 1, hy - 2], [x + 1, hy - 6], [x + 2, hy - 2]], (xx, yy) => C.fur(.6, xx, yy));
  if (p.look || p.walk != null) for (const x of [hx - 2, hx + 1]) { P.rect(x, hy - 1, 2, 2, [230, 220, 80]); P.set(x + 1, hy - 1, INK); P.set(x + 1, hy, INK); }
  else if (p.eat) for (const x of [hx - 2, hx + 1]) P.rect(x, hy, 2, 1, INK);
  else for (const x of [hx - 2, hx + 1]) P.rect(x, hy, 2, 1, INK);
  P.set(hx, hy + 2, [200, 110, 120]);
  if (p.eat === 2) P.rect(hx + 2, hy + 2, 3, 2, [250, 236, 230]);   // frosting on the chin
  if (p.elf) { P.poly([[hx - 4, hy - 3], [hx + 4, hy - 3], [hx + 6, hy - 10], [hx + 9, hy - 8]], (xx, yy) => BOTTLE(.6, xx, yy)); P.rect(hx - 4, hy - 4, 9, 2, C.red(.6, 0, 0)); P.set(hx + 9, hy - 8, C.gold(.95, 0, 0)); }
  if (p.paw) { P.rect(hx + 3, hy + 2, 2, 5, C.fur(.7, 0, 0)); }
  if (p.tail) { P.line(3, 12 + by, 1, 5 + by, C.fur(.6, 0, 0)); P.line(4, 12 + by, 2, 5 + by, C.fur(.45, 0, 0)); }
  else { P.line(3, 14 + by, 10, 16 + by, C.fur(.55, 0, 0)); P.line(3, 15 + by, 10, 16 + by, C.fur(.4, 0, 0)); }
}
const CAT_T = { sleep: {}, tail: { tail: 1 }, look: { look: 1 }, walk0: { walk: 0, tail: 1 }, walk1: { walk: 1, tail: 1 }, eat0: { eat: 1, tail: 1 }, eat1: { eat: 2, tail: 1 }, sit: { sit: 1, look: 1, tail: 1 }, elf: { sit: 1, look: 1, tail: 1, elf: 1 }, elfPaw: { sit: 1, look: 1, elf: 1, paw: 1 }, elfSleep: { sit: 1, elf: 1 } };


// —— YOU as Santa (40×46), seated in the sleigh, facing right: the hero's face, a Santa hat, a fake beard, red suit, lime scarf and mittens ——
const SUIT = ramp(['#4a0a10', '#8a1420', '#c42232', '#ec4a52'], .22), FUR = ramp(['#b8b4ac', '#dcd8d0', '#f4f2ec', '#ffffff'], .22);
function drawSanta(P, E, p) {
  const by = p.bob || 0, top = 14 + by, hx = 18, hy = 9 + by;
  // legs forward (seated): thighs to the right, shins down, black boots
  for (let y = 31; y < 36; y++) P.rect(14, y, 14, 1, SUIT(.55 - (y - 31) * .04, 0, 0));
  for (const lx of [24, 27]) { P.rect(lx, 36, 4, 5, SUIT(.45, 0, 0)); P.rect(lx - 1, 41, 6, 3, C.shoe(.4, 0, 0)); P.rect(lx - 1, 40, 6, 1, FUR(.7, 0, 0)); }
  // body: a round red coat, white fur hem and placket, black belt, gold buckle
  ell(P, 15, top + 10, 9, 10, (x, y, dx, dy) => SUIT(.72 - dx * .2 - dy * .2, x, y));
  P.rect(15, top + 1, 2, 17, FUR(.8, 0, 0)); P.rect(7, top + 17, 17, 2, FUR(.75, 0, 0));
  P.rect(7, top + 11, 17, 2, C.black(.4, 0, 0)); P.rect(14, top + 10, 4, 4, C.gold(.8, 0, 0)); P.rect(15, top + 11, 2, 2, C.black(.4, 0, 0));
  // lime scarf
  P.rect(11, top - 1, 13, 3, C.lime(.65, 0, 0)); P.rect(11, top - 1, 13, 1, C.lime(.85, 0, 0)); P.rect(20, top + 1, 3, 6, C.lime(.5, 0, 0));
  // head: the hero's face
  ell(P, hx, hy + .5, 5.4, 5.8, (x, y, dx, dy) => C.skin(.6 - dx * .14 - dy * .3, x, y));
  const ex = hx + 2, ey = hy + 1, f = p.face || 'n';
  if (p.blink) { P.rect(ex - 1, ey, 2, 1, C.skin(.15, 0, 0)); P.rect(ex - 4, ey, 2, 1, C.skin(.15, 0, 0)); }
  else if (f === 'shock') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 2, 3, 3, [250, 250, 250]); P.set(x, ey - 1, INK); }
  else if (f === 'smile') for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); }
  else if (f === 'stare') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 1, C.skin(.2, 0, 0)); P.rect(x - 1, ey, 2, 1, INK); }
  else if (f === 'sad') for (const x of [ex, ex - 3]) { P.set(x, ey + 1, INK); P.set(x - 1, ey, INK); }
  else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
  P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
  // the fake beard (cotton white, a loop over the ears) unless it has been yanked off
  if (!p.nobeard) { ell(P, hx + 1, hy + 6, 6.2, 5, (x, y, dx, dy) => FUR(.7 - dy * .2 + ((x + y) % 3 === 0 ? -.15 : 0), x, y)); P.rect(hx - 4, hy, 1, 5, FUR(.5, 0, 0));
    if (p.mouth) P.rect(hx + 2, hy + 4, 3, 2, INK); else P.rect(hx + 2, hy + 4, 3, 1, FUR(.3, 0, 0)); }
  else { if (p.mouth || f === 'shock') P.rect(hx + 2, hy + 4, 2, 3, INK); else P.rect(hx + 2, hy + 5, 2, 1, C.skin(.2, 0, 0)); P.set(hx - 4, hy + 2, FUR(.6, 0, 0)); }
  // Santa hat (flops back, a white pompom), unless lost
  if (!p.nohat) { P.rect(hx - 5, hy - 6, 11, 3, FUR(.8, 0, 0)); P.poly([[hx - 4, hy - 6], [hx + 5, hy - 6], [hx - 3, hy - 13], [hx - 8, hy - 10]], (x, y) => SUIT(.7 - (y - hy + 13) * .02, x, y)); ell(P, hx - 9, hy - 9, 2.2, 2.2, FUR(.9, 0, 0)); }
  else { P.rect(hx - 4, hy - 5, 8, 2, C.hair(.5, 0, 0)); P.set(hx + 3, hy - 4, C.hair(.7, 0, 0)); }
  if (p.tinsel) for (let x = hx - 6; x < hx + 6; x++) { P.set(x, hy - 6 + (x % 2), C.gold(.9, 0, 0)); E.set(x, hy - 6 + (x % 2), [90, 70, 20]); }
  // arms (lime mittens)
  const sl = (pts, s = .6) => pts.forEach(([x, y]) => P.rect(x, y, 2, 2, SUIT(s, x, y)));
  const mit = (x, y) => { P.rect(x, y, 3, 3, C.lime(.65, 0, 0)); P.set(x + 2, y, C.lime(.85, 0, 0)); };
  const a = p.arm || 'n';
  if (a === 'n') { sl([[20, top + 3], [22, top + 6], [23, top + 9]]); mit(23, top + 11); sl([[9, top + 3], [8, top + 7]], .45); mit(7, top + 9); }
  if (a === 'up') { sl([[20, top + 2], [22, top - 1], [23, top - 4]]); mit(23, top - 7); sl([[9, top + 2], [7, top - 1], [6, top - 4]], .45); mit(5, top - 7); }
  if (a === 'wave') { sl([[20, top + 2], [22, top], [24, top - 3]]); mit(24, top - 6); sl([[9, top + 3], [8, top + 7]], .45); mit(7, top + 9); }
  if (a === 'thumb') { sl([[20, top + 3], [23, top + 4], [25, top + 3]]); mit(26, top + 1); P.rect(27, top - 1, 1, 2, C.lime(.8, 0, 0)); sl([[9, top + 3], [8, top + 7]], .45); mit(7, top + 9); }
  if (a === 'sack') { sl([[9, top + 3], [6, top + 7], [4, top + 11]], .45); mit(2, top + 13); sl([[20, top + 3], [22, top + 6], [23, top + 9]]); mit(23, top + 11); }
  if (a === 'throw') { sl([[20, top + 2], [23, top], [26, top - 3]]); mit(27, top - 6); sl([[9, top + 3], [6, top + 7], [4, top + 11]], .45); mit(2, top + 13); }
  if (a === 'hold') { sl([[20, top + 3], [23, top + 5], [26, top + 6]]); mit(28, top + 6); sl([[9, top + 4], [12, top + 7], [15, top + 8]], .45); mit(17, top + 8); }
  if (a === 'hug') { sl([[20, top + 3], [23, top + 6], [24, top + 9]]); mit(25, top + 10); sl([[9, top + 4], [12, top + 8], [15, top + 10]], .45); mit(17, top + 10); }
}
const SANTA_T = {
  sit: {}, sit1: { bob: 1 }, blink: { blink: 1 }, smile: { face: 'smile' }, smileWave: { face: 'smile', arm: 'wave', mouth: 1 }, stare: { face: 'stare' },
  yank: { face: 'shock', nobeard: 1, arm: 'up' }, yank1: { face: 'shock', nobeard: 1, arm: 'up', bob: -1 }, shock: { face: 'shock', arm: 'up' }, shock1: { face: 'shock', arm: 'up', bob: -1 },
  cheese: { face: 'smile', arm: 'thumb', mouth: 1 }, cheeseQ: { face: 'smile', arm: 'thumb' }, hug: { face: 'smile', arm: 'hug' }, hugWorry: { face: 'worry', arm: 'hug' },
  worry: { face: 'worry' }, sack: { face: 'smile', arm: 'sack' }, throw: { face: 'smile', arm: 'throw', mouth: 1 }, throwQ: { face: 'smile', arm: 'throw' },
  hold: { face: 'shock', arm: 'hold' }, hold1: { face: 'shock', arm: 'hold', bob: -1, mouth: 1 }, holdTalk: { face: 'shock', arm: 'hold', mouth: 1 },
  wreck: { face: 'stare', nohat: 1, tinsel: 1 }, wreckBlink: { face: 'stare', nohat: 1, tinsel: 1, blink: 1 }, wreckSad: { face: 'sad', nohat: 1, tinsel: 1 },
};

// —— KIDS (26×36, drawn small): six variants; stand, cry, cheer, hold a gift, hold a photo, sit on the lap, grab ——
const KCOL = [ramp(['#0e3a6a', '#1c62a4', '#3a92d8', '#7ac4f4'], .22), ramp(['#6a1440', '#b02a6a', '#e0569a', '#ff98c4'], .22), ramp(['#7a5a0a', '#c8a01c', '#f4d23a', '#fff08a'], .22),
  ramp(['#3a1a4a', '#5e2e78', '#8a4ab0', '#b47ad8'], .22), ramp(['#0a3a3a', '#146464', '#24908e', '#56c0bc'], .22), ramp(['#6a2a08', '#b4501a', '#ee7a2c', '#ffae64'], .22)];
function drawKid2(P, E, p) {
  const v = p.v, by = p.bob || 0, coat = KCOL[v], skin = v % 3 === 1 ? C.skin2 : C.skin, hair = HAIRS[v % 5];
  const sit = p.sit, top = 16 + by;
  if (sit) { P.rect(11, 28, 10, 3, JEAN(.5, 0, 0)); P.rect(19, 31, 3, 3, JEAN(.45, 0, 0)); P.rect(19, 34, 4, 2, C.shoe(.4, 0, 0)); }
  else { const st = p.step ?? -1, legs = st < 0 ? [[10, 0], [14, 0]] : [[[8, 0], [16, -1]], [[11, -1], [13, 0]], [[16, -1], [8, 0]], [[13, 0], [11, -1]]][st];
    legs.forEach(([lx, ly]) => { P.rect(lx, 28, 3, 5 + ly, JEAN(.5, 0, 0)); P.rect(lx, 33 + ly, 4, 2, C.shoe(.4, 0, 0)); }); }
  P.poly([[8, top], [18, top], [19, top + 12], [7, top + 12]], (x, y) => coat(.7 - (x - 7) / 12 * .4, x, y));
  if (v % 2 === 0) P.rect(8, top, 11, 2, [240, 236, 226]);
  const hx = 13, hy = 9 + by;
  ell(P, hx, hy, 5.2, 5.4, (x, y, dx, dy) => skin(.62 - dx * .12 - dy * .25, x, y));
  if (v % 3 === 0) { P.rect(hx - 5, hy - 6, 10, 3, coat(.35, 0, 0)); ell(P, hx - 1, hy - 7, 2, 1.6, [244, 240, 230]); }   // a bobble hat
  else { ell(P, hx - 1, hy - 3, 5.6, 3, (x, y) => hair(.6, x, y)); if (v % 2) { P.rect(hx - 7, hy - 2, 2, 5, hair(.5, 0, 0)); P.rect(hx + 5, hy - 2, 2, 5, hair(.5, 0, 0)); } }
  const ex = hx + 2, ey = hy;
  const cry = p.cry != null;
  if (cry) { for (const x of [ex, ex - 3]) { P.rect(x - 1, ey, 2, 1, INK); P.set(x - 1, ey - 1, INK); } P.rect(hx, hy + 2, 4, 3, INK); P.rect(hx + 1, hy + 3, 2, 1, [200, 60, 80]);
    for (const x of [ex, ex - 3]) { const d = p.cry ? 1 : 0; P.set(x, ey + 1 + d, [120, 190, 255]); P.set(x, ey + 2 + d, [90, 160, 240]); P.set(x - 1, ey + 3 + d, [120, 190, 255]); } }
  else if (p.happy) { for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); } P.rect(hx, hy + 2, 4, 2, INK); P.rect(hx + 1, hy + 3, 2, 1, [220, 80, 90]); }
  else if (p.grin) { for (const x of [ex, ex - 3]) { P.set(x, ey, INK); P.set(x, ey - 1, INK); } P.rect(hx, hy + 3, 4, 1, INK); P.set(hx + 4, hy + 2, INK); }
  else { for (const x of [ex, ex - 3]) { P.set(x, ey, INK); P.set(x, ey - 1, INK); } P.rect(hx + 1, hy + 3, 2, 1, INK); }
  P.set(hx - 1, ey + 2, BLUSH);
  const hand = (x, y) => P.rect(x, y, 2, 2, skin(.6, 0, 0)), arm = (pts) => pts.forEach(([x, y]) => P.rect(x, y, 2, 2, coat(.5, x, y)));
  const a = p.arm || 'n';
  if (a === 'n') { arm([[17, top + 2], [18, top + 6]]); hand(18, top + 9); arm([[7, top + 2], [6, top + 6]]); hand(5, top + 9); }
  if (a === 'up') { arm([[17, top + 1], [19, top - 2]]); hand(20, top - 4); arm([[7, top + 1], [5, top - 2]]); hand(4, top - 4); }
  if (a === 'grab') { arm([[17, top + 1], [19, top - 1], [21, top - 3]]); hand(22, top - 5); arm([[7, top + 2], [6, top + 6]]); hand(5, top + 9); }
  if (a === 'gift') { P.rect(11, top + 3, 10, 8, C.red(.6, 0, 0)); P.rect(15, top + 3, 2, 8, C.gold(.85, 0, 0)); P.rect(11, top + 6, 10, 2, C.gold(.85, 0, 0)); P.rect(13, top + 1, 6, 2, C.gold(.7, 0, 0)); hand(10, top + 7); hand(20, top + 7); }
  if (a === 'photo') { arm([[17, top + 1], [19, top - 2]]); hand(19, top - 4); P.rect(18, top - 11, 8, 8, [246, 244, 236]); P.rect(19, top - 10, 6, 5, [120, 170, 220]); P.set(21, top - 8, C.red(.7, 0, 0)); P.set(22, top - 8, [250, 250, 250]); arm([[7, top + 2], [6, top + 6]]); hand(5, top + 9); }
  if (a === 'phone') { arm([[17, top + 1], [19, top - 1]]); hand(19, top - 3); P.rect(20, top - 7, 3, 5, INK.map(c => c + 30)); E.rect(20, top - 7, 3, 4, [180, 200, 240]); arm([[7, top + 2], [6, top + 6]]); hand(5, top + 9); }
}
const KID_T2 = {};
for (let v = 0; v < 6; v++) Object.assign(KID_T2, { [`${v}s`]: { v }, [`${v}c0`]: { v, cry: 0 }, [`${v}c1`]: { v, cry: 1, bob: 1 }, [`${v}h`]: { v, happy: 1, arm: 'up' }, [`${v}h1`]: { v, happy: 1, arm: 'up', bob: -1 },
  [`${v}g`]: { v, happy: 1, arm: 'gift' }, [`${v}p`]: { v, happy: 1, arm: 'photo' }, [`${v}f`]: { v, grin: 1, arm: 'phone' }, [`${v}sit`]: { v, sit: 1, grin: 1 }, [`${v}sitc0`]: { v, sit: 1, cry: 0 }, [`${v}sitc1`]: { v, sit: 1, cry: 1, bob: 1 },
  [`${v}grab`]: { v, grin: 1, arm: 'grab' }, [`${v}w0`]: { v, step: 0 }, [`${v}w1`]: { v, step: 1, bob: -1 }, [`${v}w2`]: { v, step: 2 }, [`${v}w3`]: { v, step: 3, bob: -1 } });

// —— THE REINDEER animatronic (66×58), facing left (towards −x): stiff on display, eyes light up, rears, gallops ——
const DEER = ramp(['#3a200e', '#5e3618', '#845026', '#a86c38', '#c88c50'], .22), ANT = ramp(['#6a5030', '#9a7a50', '#c8a878'], .22);
function drawDeer(P, E, p) {
  const rear = p.rear, st = p.step ?? -1, by = p.bob || 0;
  // legs: four thin legs with black hooves; galloping frames spread them
  const L = st < 0 ? [[14, 0], [20, 0], [42, 0], [48, 0]] : [[[8, -2], [18, 0], [40, 0], [52, -2]], [[13, 0], [19, -1], [44, -1], [48, 0]], [[18, 0], [10, -2], [50, -2], [42, 0]], [[15, -1], [21, 0], [45, 0], [47, -1]]][st];
  if (rear) { for (const [lx, a] of [[42, 0], [48, 0]]) { P.rect(lx, 40, 3, 15, DEER(.45, 0, 0)); P.rect(lx - 1, 55, 4, 3, INK); } for (const [lx, ly] of [[14, 16], [20, 18]]) { P.rect(lx, ly, 3, 12, DEER(.45, 0, 0)); P.rect(lx - 1, ly - 2, 4, 3, INK); } }
  else L.forEach(([lx, ly], i) => { P.rect(lx, 40 + by, 3, 15 + ly, DEER(.5 - (i % 2) * .1, 0, 0)); P.rect(lx - 1, 55 + ly + by, 4, 3, INK); });
  const tilt = rear ? -12 : 0;
  // body: a barrel with a white belly, a red harness with gold bells
  P.poly([[12, 28 + tilt + by], [52, 28 + by], [54, 42 + by], [10, 42 + tilt * .6 + by]], (x, y) => DEER(.7 - (y - 28) / 16 * .3 + ((x * 3 + y) % 9 === 0 ? -.1 : 0), x, y));
  P.rect(18, 40 + by, 28, 2, FUR(.7, 0, 0));
  P.rect(22, 30 + tilt * .6 + by, 3, 12, C.red(.6, 0, 0)); P.rect(10, 32 + tilt * .8 + by, 44, 2, C.red(.55, 0, 0));
  for (const x of [16, 28, 40]) { ell(P, x, 36 + by, 1.8, 1.8, C.gold(.85, 0, 0)); E.set(x, 36 + by, [70, 55, 15]); }
  P.line(54, 30 + by, 60, 26 + by, DEER(.6, 0, 0)); P.line(55, 31 + by, 61, 27 + by, DEER(.4, 0, 0));   // tail tuft
  // neck and head (facing left), antlers
  const hx = 9, hy = (rear ? 6 : 16) + by;
  P.poly([[10, 30 + tilt + by], [18, 30 + tilt + by], [hx + 6, hy + 4], [hx - 1, hy + 4]], (x, y) => DEER(.68, x, y));
  ell(P, hx, hy, 6, 5, (x, y, dx, dy) => DEER(.75 - dy * .25, x, y));
  ell(P, hx - 5, hy + 2, 3.4, 2.6, (x, y) => DEER(.85, x, y)); P.rect(hx - 9, hy + 1, 2, 2, INK);   // muzzle, black nose
  for (const [dx, k] of [[2, 1], [6, .8]]) { P.line(hx + dx, hy - 4, hx + dx + 2, hy - 12, ANT(k, 0, 0)); P.line(hx + dx + 1, hy - 8, hx + dx + 5, hy - 11, ANT(k, 0, 0)); P.line(hx + dx + 1, hy - 10, hx + dx - 2, hy - 14, ANT(k * .9, 0, 0)); }
  P.line(hx + 4, hy - 2, hx + 8, hy - 4, DEER(.5, 0, 0));   // ear
  if (p.eyes) { P.rect(hx - 3, hy - 2, 2, 2, [255, 40, 30]); E.rect(hx - 3, hy - 2, 2, 2, [255, 30, 20]); P.set(hx - 3, hy - 2, [255, 200, 180]); }
  else if (p.dizzy) { P.set(hx - 3, hy - 2, INK); P.set(hx - 2, hy - 1, INK); P.set(hx - 2, hy - 3, INK); P.set(hx - 4, hy - 1, INK); }
  else P.rect(hx - 3, hy - 2, 2, 2, INK);
  if (p.tinsel) for (let x = hx - 2; x < hx + 12; x++) { P.set(x, hy - 9 + (x % 3), C.gold(.9, 0, 0)); E.set(x, hy - 9 + (x % 3), [80, 60, 20]); }
}
const DEER_T = { stiff: {}, eyes: { eyes: 1 }, rear: { eyes: 1, rear: 1 }, r0: { eyes: 1, step: 0 }, r1: { eyes: 1, step: 1, bob: -1 }, r2: { eyes: 1, step: 2 }, r3: { eyes: 1, step: 3, bob: -1 }, dizzy: { dizzy: 1, tinsel: 1 } };

// ———————————————— atlas + character object ————————————————
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
  santa: { table: SANTA_T, draw: drawSanta, FW: 40, FH: 46, blob: 0 },
  cust: { table: CUST_T, draw: drawCustomer, FW: 34, FH: 46, blob: .48 },
  boss: { table: BOSS_T, draw: drawManager, FW: 32, FH: 60, blob: .42 },
  shop: { table: SHOP_T, draw: drawShopper, FW: 30, FH: 50, blob: .36 },
  kid: { table: KID_T2, draw: drawKid2, FW: 26, FH: 36, blob: .3, sc: .8 },
  deer: { table: DEER_T, draw: drawDeer, FW: 66, FH: 58, blob: .9, sc: 1.05 },
  cat: { table: CAT_T, draw: drawCat, FW: 28, FH: 20, blob: 0, sc: .55 },
};
const _atl = {};
export function makeChar(kind, emI = 1.0, cap = 1.25) {
  const K = KINDS[kind], A = _atl[kind] || (_atl[kind] = atlas(K.table, K.draw, K.FW, K.FH));
  const tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true;   // shared image, own offset
  const sc = K.sc ?? 1, mesh = billboard(tex, K.FW * SPX * sc, K.FH * SPX * sc, { em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${cap.toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
  mesh.material.customProgramCacheKey = () => 'spriteCap' + cap; mesh.material.needsUpdate = true;
  mesh.customDepthMaterial.map = tex; mesh.customDistanceMaterial.map = tex;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  let sh = null; if (K.blob) { sh = blob(K.blob, .45); sh.position.y = .015; root.add(sh); }
  return {
    root, mesh, atlas: A, shadowBlob: sh, H: K.FH * SPX * (K.sc ?? 1), W: K.FW * SPX * (K.sc ?? 1),
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); tex.offset.x = em.offset.x = i / A.n; },
    sq: [1, 1],
    squash(k) { this.sq = [1 - k * .55, 1 + k]; return this; },   // k > 0 stretches up, k < 0 squashes down (the pivot is at the feet)
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.set((flip ? -1 : 1) * this.sq[0], this.sq[1], 1); this.sq = [1, 1]; },
  };
}
export { C as COLS, INK };
