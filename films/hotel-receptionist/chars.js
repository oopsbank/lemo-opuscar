// Pixel characters for "You Are a Hotel Receptionist" (Job #4): drawn pixel by pixel (3/4 view, facing right), one frame per pose,
// packed into atlases; billboards take the scene lighting and cast cut-out shadows.
// The hero is the channel's recurring sprite (Job #3's face, lime jacket), here in a navy bellhop pillbox cap.
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
  else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
  if (f === 'shock') { P.rect(ex - 1, ey - 4, 2, 1, C.hair(.2, 0, 0)); P.rect(ex - 4, ey - 4, 2, 1, C.hair(.2, 0, 0)); }
  if (f === 'worry' || f === 'sad') { P.set(ex, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 1, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 4, ey - 2, C.hair(.2, 0, 0)); }
  P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 6, hy + 3, C.skin(.4, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
  if (f === 'shock' || p.mouth) P.rect(hx + 2, hy + 4, 2, 2, INK);
  else if (f === 'smile') { P.set(hx + 1, hy + 5, INK); P.rect(hx + 2, hy + 6, 3, 1, INK); P.set(hx + 5, hy + 5, INK); }
  else if (f === 'sad') { P.set(hx + 1, hy + 6, INK); P.rect(hx + 2, hy + 5, 3, 1, INK); P.set(hx + 5, hy + 6, INK); }
  else P.rect(hx + 2, hy + 5, 2, 1, C.skin(.2, 0, 0));
  if (!p.nocap) {   // pillbox: a short drum tilted on the head, gold band, chin strap
    P.rect(hx - 3, hy - 10, 9, 5, C.navy(.62, 0, 0)); P.rect(hx - 3, hy - 11, 9, 1, C.navy(.85, 0, 0)); P.rect(hx - 3, hy - 7, 9, 1, C.gold(.75, 0, 0));
    P.rect(hx + 5, hy - 10, 1, 4, C.navy(.35, 0, 0)); P.set(hx + 1, hy - 9, C.gold(.95, 0, 0));
  }
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
  stand: {}, stand1: { bob: 1 }, blink: { blink: 1 }, smile: { face: 'smile' }, smileTalk: { face: 'smile', arm: 'talk', mouth: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  c0: { step: 0, arm: 'carry' }, c1: { step: 1, bob: -1, arm: 'carry' }, c2: { step: 2, arm: 'carry' }, c3: { step: 3, bob: -1, arm: 'carry' }, carry: { arm: 'carry' },
  pull: { arm: 'pull' }, pullShock: { arm: 'pull', face: 'shock' },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 }, worry: { face: 'worry' },
  talk: { arm: 'talk', mouth: 1 }, talkBig: { arm: 'carry', face: 'smile', mouth: 1 },
  phone: { arm: 'phone', face: 'worry' }, phoneTalk: { arm: 'phone', face: 'worry', mouth: 1 }, phoneShock: { arm: 'phone', face: 'shock' },
  key: { arm: 'key', face: 'smile' }, keyShock: { arm: 'key', face: 'shock' }, sad: { face: 'sad', nocap: 1 }, sadCap: { face: 'sad' },
  b0: { step: 0, arm: 'box', face: 'sad', nocap: 1 }, b1: { step: 1, bob: -1, arm: 'box', face: 'sad', nocap: 1 }, b2: { step: 2, arm: 'box', face: 'sad', nocap: 1 }, b3: { step: 3, bob: -1, arm: 'box', face: 'sad', nocap: 1 },
};

// —— THE CUSTOMER (34×46): stout, purple coat, round sunglasses, lilac bun, pink handbag ——
function drawCustomer(P, E, p) {
  const by = p.bob || 0, st = p.step ?? -1;
  const legs = st < 0 ? [[12, 0], [18, 0]] : [[[10, 0], [19, -1]], [[13, -1], [16, 0]], [[19, -1], [10, 0]], [[16, 0], [13, -1]]][st];
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
  if (a === 'cross') { P.rect(11, top + 7, 13, 3, C.purple(.5, 0, 0)); P.rect(11, top + 7, 13, 1, C.purple(.7, 0, 0)); hand(22, top + 7); hand(11, top + 8); }
}
const CUST_T = {
  stand: {}, talk: { mouth: 1, arm: 'demand' }, demand: { arm: 'demand' }, bellUp: { arm: 'bellUp', mouth: 1 }, bellDn: { arm: 'bellDn' }, bellUpQ: { arm: 'bellUp' }, bellDnT: { arm: 'bellDn', mouth: 1 },
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

// —— THE GOAT (44×38): white, small horns, a beard; chews everything ——
function drawGoat(P, E, p) {
  const st = p.step ?? -1, by = p.bob || 0;
  const L = st < 0 ? [0, 0, 0, 0] : [[1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1], [0, 0, 0, 0]][st];
  [[9, .45], [13, .7], [27, .45], [31, .7]].forEach(([lx, v], i) => { for (let y = 26; y < 35; y++) P.rect(lx + (y > 30 ? L[i] : 0), y, 2, 1, C.goat(v - (y > 31 ? .1 : 0), 0, 0)); P.rect(lx + L[i], 35, 3, 2, C.horn(.2, 0, 0)); });
  ell(P, 20, 21 + by, 13, 7, (x, y, dx, dy) => C.goat(.75 - dy * .3 + ((x * 3 + y) % 7 === 0 ? -.15 : 0), x, y));
  P.line(6, 17 + by, 4, 14 + by, C.goat(.7, 0, 0)); P.line(5, 17 + by, 3, 15 + by, C.goat(.5, 0, 0));   // tail
  // neck + head, raised for MEH
  const up = p.meh ? -3 : 0, hx = 36, hy = 10 + by + up;
  P.poly([[28, 16 + by], [34, hy + 2], [38, hy + 5], [32, 22 + by]], (x, y) => C.goat(.72, x, y));
  ell(P, hx, hy, 4.6, 4, (x, y, dx, dy) => C.goat(.78 - dy * .25, x, y));
  P.poly([[hx + 2, hy - 2], [hx + 8, hy + 1], [hx + 8, hy + 4], [hx + 2, hy + 4]], (x, y) => C.goat(.7, x, y));   // muzzle
  P.set(hx + 7, hy + 1, INK);
  const jaw = p.meh ? 3 : p.chew ? 1 : 0;
  if (jaw) P.rect(hx + 4, hy + 4, 4, jaw, [120, 40, 50]);
  P.rect(hx + 3, hy + 4 + jaw, 5, 1, C.goat(.55, 0, 0));
  P.rect(hx + 2, hy + 5 + jaw, 2, 4, C.goat(.85, 0, 0)); P.set(hx + 2, hy + 9 + jaw, C.goat(.7, 0, 0));   // beard
  P.rect(hx, hy - 1, 2, 1, [60, 40, 20]); P.set(hx + 1, hy - 1, INK); P.rect(hx, hy - 2, 2, 1, C.goat(.4, 0, 0));   // the goat's sideways pupil
  P.line(hx - 3, hy - 2, hx - 7, hy, C.goat(.6, 0, 0)); P.line(hx - 3, hy - 1, hx - 6, hy + 1, C.goat(.45, 0, 0));   // ear
  P.line(hx - 1, hy - 4, hx - 3, hy - 8, C.horn(.6, 0, 0)); P.line(hx, hy - 4, hx - 2, hy - 8, C.horn(.8, 0, 0)); P.set(hx - 4, hy - 8, C.horn(.5, 0, 0));
  if (p.sign) { P.rect(hx + 6, hy + 2, 7, 5, [235, 230, 220]); P.rect(hx + 6, hy + 2, 7, 1, [200, 40, 50]); P.rect(hx + 7, hy + 4, 5, 1, [200, 40, 50]); }
  if (p.key) { P.rect(hx + 6, hy + 3, 5, 1, C.gold(.85, 0, 0)); P.rect(hx + 10, hy + 2, 2, 3, C.gold(.9, 0, 0)); }
  if (p.curtain) { P.rect(hx + 6, hy + 3, 3, 6, C.pink(.7, 0, 0)); P.rect(hx + 6, hy + 8, 4, 2, C.pink(.5, 0, 0)); }
  if (p.cap) { P.rect(hx - 4, hy - 9, 8, 4, C.navy(.62, 0, 0)); P.rect(hx - 4, hy - 10, 8, 1, C.navy(.85, 0, 0)); P.rect(hx - 4, hy - 6, 8, 1, C.gold(.75, 0, 0)); P.set(hx - 1, hy - 8, C.gold(.95, 0, 0)); }
}
const GOAT_T = {
  stand: {}, chew0: { chew: 1 }, meh: { meh: 1 }, cur0: { curtain: 1 }, cur1: { curtain: 1, chew: 1 }, sign: { sign: 1 }, sign1: { sign: 1, chew: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 }, key: { key: 1 }, key1: { key: 1, chew: 1 },
  cap: { cap: 1 }, capChew: { cap: 1, chew: 1 }, capMeh: { cap: 1, meh: 1 },
};

// —— THE CAT (24×14): an orange loaf asleep on the guest book ——
function drawCat(P, E, p) {
  ell(P, 11, 9, 9, 4.6, (x, y, dx, dy) => C.fur(.7 - dy * .3 + ((x + y * 3) % 5 === 0 ? -.2 : 0), x, y));
  ell(P, 18, 7, 4.2, 3.8, (x, y, dx, dy) => C.fur(.75 - dy * .3, x, y));
  for (const x of [16, 20]) P.poly([[x - 1, 5], [x + 1, 1], [x + 2, 5]], (xx, yy) => C.fur(.6, xx, yy));
  if (p.look) { for (const x of [17, 20]) { P.rect(x, 6, 2, 2, [230, 220, 80]); P.set(x + 1, 6, INK); P.set(x + 1, 7, INK); } }
  else for (const x of [17, 20]) P.rect(x, 7, 2, 1, INK);
  P.set(19, 9, [200, 110, 120]);
  if (p.tail) { P.line(2, 9, 1, 4, C.fur(.6, 0, 0)); P.line(3, 9, 2, 4, C.fur(.45, 0, 0)); }
  else { P.line(2, 11, 9, 13, C.fur(.55, 0, 0)); P.line(2, 12, 9, 13, C.fur(.4, 0, 0)); }
}
const CAT_T = { sleep: {}, tail: { tail: 1 }, look: { look: 1 } };

// —— THE NEWLYWEDS (48×40): a bride and a groom sitting on the edge of the bed ——
function drawCouple(P, E, p) {
  const sit = (cx, dress) => {
    // legs forward over the bed edge
    for (let y = 30; y < 38; y++) for (let x = cx; x < cx + 3; x++) P.set(x + 4, y, dress ? C.dress(.6, x, y) : C.black(.5, x, y));
    P.rect(cx + 3, 37, 5, 2, dress ? C.dress(.8, 0, 0) : C.shoe(.3, 0, 0));
    const top = 14;
    if (dress) P.poly([[cx - 5, top], [cx + 5, top], [cx + 9, top + 17], [cx - 7, top + 17]], (x, y) => C.dress(.8 - (x - cx) * .02 + ((x + y) % 4 === 0 ? -.1 : 0), x, y));
    else { P.poly([[cx - 5, top], [cx + 5, top], [cx + 6, top + 17], [cx - 6, top + 17]], (x, y) => C.black(.55 - (x - cx) * .02, x, y)); P.poly([[cx - 1, top], [cx + 2, top], [cx + .5, top + 6]], (x, y) => [240, 240, 240]); P.rect(cx, top, 2, 2, C.red(.6, 0, 0)); }
    const hx = cx + 1, hy = 7;
    ell(P, hx, hy, 5, 5.6, (x, y, dx, dy) => (dress ? C.skin : C.skin2)(.62 - dx * .12 - dy * .25, x, y));
    if (dress) { ell(P, hx - 2, hy - 3, 5.4, 4, (x, y) => C.hair(.75, x, y)); P.poly([[hx - 3, hy - 7], [hx + 3, hy - 7], [hx - 6, hy + 14], [hx - 9, hy + 14]], (x, y) => [250, 250, 255]); }
    else { ell(P, hx - 1, hy - 4, 5.2, 2.6, (x, y) => C.black(.4, x, y)); }
    const ex = hx + 2, ey = hy;
    if (p.shock) for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
    else for (const x of [ex, ex - 3]) { P.set(x, ey, INK); P.set(x, ey - 1, INK); }
    if (p.shock) P.rect(hx + 1, hy + 3, 2, 2, INK); else { P.set(hx + 1, hy + 3, INK); P.rect(hx + 2, hy + 4, 2, 1, INK); }
    P.set(hx, ey + 2, BLUSH);
  };
  sit(13, false); sit(31, true);
  if (p.shock) { P.rect(20, 20, 8, 3, C.black(.5, 0, 0)); P.rect(26, 20, 4, 3, C.skin(.6, 0, 0)); }
}
const COUPLE_T = { sit: {}, shock: { shock: 1 } };

// —— TOURISTS (28×48, four shirt colours) and THE GUIDE (with a flag) ——
function drawTourist(P, E, p) {
  const by = p.bob || 0, st = p.step ?? -1, sh = TOUR[p.v ?? 0];
  const legs = st < 0 ? [[10, 0], [15, 0]] : [[[8, 0], [17, -1]], [[11, -1], [14, 0]], [[17, -1], [8, 0]], [[14, 0], [11, -1]]][st];
  legs.forEach(([lx, ly], i) => { for (let y = 34; y < 40; y++) P.rect(lx, y, 4, 1, C.box(.55 + (i ? 0 : .1), 0, 0)); for (let y = 40; y < 45 + ly; y++) P.rect(lx + 1, y, 2, 1, C.skin(.55, 0, 0)); P.rect(lx, 45 + ly, 5, 2, [240, 240, 240]); });
  const top = 20 + by;
  P.poly([[8, top], [20, top], [21, top + 14], [7, top + 14]], (x, y) => { let v = .7 - (x - 7) / 14 * .4; if ((x * 3 + y * 2) % 9 === 0) v += .25; return sh(v, x, y); });
  P.line(9, top, 18, top + 10, INK.map(v => v + 30));   // camera strap
  const hx = 14, hy = 12 + by;
  ell(P, hx, hy, 5, 5.4, (x, y, dx, dy) => ((p.v ?? 0) % 2 ? C.skin2 : C.skin)(.62 - dx * .12 - dy * .25, x, y));
  if ((p.v ?? 0) % 2) { ell(P, hx, hy - 4, 8, 1.6, (x, y) => C.paper(.75, x, y)); P.rect(hx - 4, hy - 8, 8, 4, C.paper(.65, 0, 0)); P.rect(hx - 4, hy - 5, 8, 1, sh(.3, 0, 0)); }   // sun hat
  else { P.rect(hx - 5, hy - 6, 10, 3, sh(.55, 0, 0)); P.rect(hx + 2, hy - 3, 6, 1, sh(.35, 0, 0)); }   // cap
  const ex = hx + 2, ey = hy + 1;
  if (p.photo) { P.rect(hx + 1, hy - 1, 6, 4, INK.map(v => v + 25)); P.rect(hx + 5, hy, 2, 2, [140, 160, 200]); P.rect(hx + 2, hy - 2, 2, 1, INK.map(v => v + 25)); }
  else { P.set(ex, ey, INK); P.set(ex - 3, ey, INK); P.rect(hx + 1, hy + 3, 3, 1, INK); }
  P.rect(5, top + 2, 4, 9, C.box(.35, 0, 0)); P.rect(5, top + 2, 4, 1, C.box(.6, 0, 0));   // backpack
  const hand = (x, y) => P.rect(x, y, 2, 2, C.skin(.6, 0, 0));
  if (p.photo) { P.rect(19, top + 1, 2, 4, sh(.5, 0, 0)); hand(19, hy + 2); }
  else if (p.flag) { P.rect(19, top + 1, 2, 4, sh(.5, 0, 0)); hand(20, top - 1); P.rect(21, 0, 1, top + 1, C.box(.5, 0, 0)); P.rect(22, 0, 7, 5, C.gold(.85, 0, 0)); P.rect(22, 2, 7, 1, C.red(.6, 0, 0)); }
  else if (p.mouth) { P.rect(19, top + 1, 2, 2, sh(.5, 0, 0)); hand(21, top - 1); P.rect(hx + 1, hy + 3, 3, 2, INK); }
  else { P.rect(19, top + 1, 2, 6, sh(.5, 0, 0)); hand(19, top + 7); P.rect(19, top + 8, 4, 3, INK.map(v => v + 25)); }
}
const TOURIST_T = {};
for (const v of [0, 1, 2, 3]) Object.assign(TOURIST_T, { [`${v}s`]: { v }, [`${v}p`]: { v, photo: 1 }, [`${v}w0`]: { v, step: 0 }, [`${v}w1`]: { v, step: 1, bob: -1 }, [`${v}w2`]: { v, step: 2 }, [`${v}w3`]: { v, step: 3, bob: -1 } });
Object.assign(TOURIST_T, { gs: { v: 3, flag: 1 }, gt: { v: 3, flag: 1, mouth: 1 }, gw0: { v: 3, flag: 1, step: 0 }, gw1: { v: 3, flag: 1, step: 1, bob: -1 }, gw2: { v: 3, flag: 1, step: 2 }, gw3: { v: 3, flag: 1, step: 3, bob: -1 } });

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
  hero: { table: HERO_T, draw: drawHero, FW: 34, FH: 50, blob: .42 },
  cust: { table: CUST_T, draw: drawCustomer, FW: 34, FH: 46, blob: .48 },
  boss: { table: BOSS_T, draw: drawManager, FW: 32, FH: 60, blob: .42 },
  goat: { table: GOAT_T, draw: drawGoat, FW: 46, FH: 38, blob: .6 },
  cat: { table: CAT_T, draw: drawCat, FW: 24, FH: 14, blob: 0 },
  couple: { table: COUPLE_T, draw: drawCouple, FW: 48, FH: 40, blob: 0 },
  tourist: { table: TOURIST_T, draw: drawTourist, FW: 30, FH: 48, blob: .38 },
};
const _atl = {};
export function makeChar(kind, emI = 1.0, cap = 1.25) {
  const K = KINDS[kind], A = _atl[kind] || (_atl[kind] = atlas(K.table, K.draw, K.FW, K.FH));
  const tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true;   // shared image, own offset
  const mesh = billboard(tex, K.FW * SPX, K.FH * SPX, { em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${cap.toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
  mesh.material.customProgramCacheKey = () => 'spriteCap' + cap; mesh.material.needsUpdate = true;
  mesh.customDepthMaterial.map = tex; mesh.customDistanceMaterial.map = tex;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  let sh = null; if (K.blob) { sh = blob(K.blob, .45); sh.position.y = .015; root.add(sh); }
  return {
    root, mesh, atlas: A, shadowBlob: sh, H: K.FH * SPX, W: K.FW * SPX,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); tex.offset.x = em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
  };
}
export { C as COLS, INK };
