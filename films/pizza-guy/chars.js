// Pixel characters for "You Are a Pizza Delivery Guy": drawn pixel by pixel (3/4 view, facing right), one frame per pose,
// packed into atlases; billboards take the scene lighting and cast cut-out shadows. An emissive layer carries the hot pizza box.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 27;   // character pixel → metres
const INK = hex('#1a1016'), BLUSH = hex('#e0806c');
const C = {
  red: ramp(['#4a0a12', '#7e1420', '#b42430', '#e03a3e', '#ff6a5e'], .22),      // cap, jacket, scooter (the hero colour)
  denim: ramp(['#141a2a', '#222c46', '#34446a', '#4a5e8c'], .22),
  skin: ramp(['#a86a52', '#d6987a', '#efc09c', '#ffdcc0'], .22),
  hair: ramp(['#1e120c', '#3a2416', '#5a3a22', '#7a5232'], .22),
  shoe: ramp(['#141416', '#26262c', '#3a3a44'], .22),
  tyre: ramp(['#0e0e12', '#1e1e24', '#34343c'], .22),
  chrome: ramp(['#4a5260', '#7c8696', '#b8c2cc', '#eef4f8'], .22),
  box: ramp(['#5a3a1c', '#8a6236', '#b88c56', '#dcb87e', '#f4dcae'], .22),
  hot: ramp(['#b84a14', '#f08a2a', '#ffc35a', '#fff0b0'], .22),
  tan: ramp(['#5a3a1e', '#8a5e32', '#b88a50', '#d8b078', '#f0d4a0'], .22),
  sheet: ramp(['#7a8a9a', '#aab8c6', '#d4dee6', '#f2f6fa'], .22),
  fur: ramp(['#24140c', '#3e2416', '#5c3820', '#7c4e2c', '#9c6a3e'], .22),
  robe: ramp(['#1c2638', '#2e3e5a', '#46607e', '#6a86a2'], .22), robeW: ramp(['#8c9aa8', '#b8c4ce', '#dce4ea'], .22),
  mug: ramp(['#5e6a3a', '#86945a', '#aebc7c'], .22),
  pizza: ramp(['#8a4a16', '#c47a2c', '#e8a848', '#f6d27a', '#fff0b4'], .22), sauce: ramp(['#6a140e', '#a42418', '#d24426'], .22),
};
const ell = (P, cx, cy, rx, ry, f) => P.ellipse(cx, cy, rx, ry, f);

// —— pizza box (with the emissive "hot" glow seam); x,y = top-left, w×h ——
function pizzaBox(P, E, x, y, w = 10, h = 4, hot = 1, open = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.set(x + i, y + j, C.box(j === 0 ? .85 : .55 - (i === 0 ? .2 : 0), x + i, y + j));
  P.rect(x + 2, y + 1, 3, 1, C.red(.6, 0, 0));   // logo
  if (hot > .05) for (let i = 1; i < w - 1; i++) { const c = C.hot(Math.min(.99, .5 + hot * .45), 0, 0); P.set(x + i, y - 1, c); E && E.set(x + i, y - 1, c); }   // steam-glow seam
  if (open) { for (let i = 0; i < w; i++) P.set(x + i - 1, y - 2 - Math.round(i * .6), C.box(.7, 0, 0)); }
}
function head(P, hx, hy, p) {   // red-cap delivery guy head, facing right
  ell(P, hx, hy + .5, 5.4, 5.8, (x, y, dx, dy) => C.skin(.6 - dx * .14 - dy * .3, x, y));
  for (let y = hy - 2; y < hy + 3; y++) { P.set(hx - 5, y, C.hair(.4, 0, 0)); P.set(hx - 4, y, C.hair(.55, 0, 0)); }
  const ex = hx + 2, ey = hy + 1, face = p.face || 'n';
  if (p.pizzaFace) {   // a slice stuck on the face
    P.poly([[hx - 1, hy - 3], [hx + 7, hy - 2], [hx + 6, hy + 7], [hx, hy + 5]], (x, y) => C.pizza(.65 + ((x * 3 + y) % 5 === 0 ? .2 : 0), x, y));
    for (const [a, b] of [[hx + 2, hy], [hx + 4, hy + 3], [hx + 1, hy + 3]]) P.rect(a, b, 2, 1, C.sauce(.6, 0, 0));
    P.set(hx + 3, hy + 7, C.pizza(.9, 0, 0)); P.set(hx + 3, hy + 8, C.pizza(.8, 0, 0)); P.set(hx + 5, hy + 8, C.pizza(.85, 0, 0));
  } else {
    if (p.blink) { P.set(ex, ey, C.skin(.15, 0, 0)); P.set(ex - 3, ey, C.skin(.15, 0, 0)); }
    else if (face === 'shock') for (const x of [ex, ex - 3]) { P.rect(x - 1, ey - 1, 2, 2, [250, 250, 250]); P.set(x, ey, INK); }
    else if (face === 'smile' || face === 'happy') for (const x of [ex, ex - 3]) { P.set(x - 1, ey, INK); P.set(x, ey - 1, INK); P.set(x + 1, ey, INK); }
    else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex - 3, ey, INK); P.set(ex - 3, ey - 1, INK); }
    if (face === 'sad') { P.set(ex, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 1, ey - 2, C.hair(.2, 0, 0)); P.set(ex - 3, ey - 3, C.hair(.2, 0, 0)); P.set(ex - 4, ey - 2, C.hair(.2, 0, 0)); }
    if (face === 'shock') { P.rect(ex - 1, ey - 4, 2, 1, C.hair(.2, 0, 0)); P.rect(ex - 4, ey - 4, 2, 1, C.hair(.2, 0, 0)); }
    if (face === 'grit') { P.set(ex - 1, ey - 3, C.hair(.2, 0, 0)); P.set(ex, ey - 2, C.hair(.2, 0, 0)); }
    P.rect(hx + 5, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.set(hx + 6, hy + 3, C.skin(.4, 0, 0)); P.set(hx + 1, ey + 2, BLUSH);
    if (face === 'shock' || p.mouth) P.rect(hx + 2, hy + 4, 2, 2, INK);
    else if (face === 'smile' || face === 'happy') { P.set(hx + 1, hy + 4, INK); P.rect(hx + 2, hy + 5, 2, 1, INK); P.set(hx + 4, hy + 4, INK); }
    else if (face === 'sad') { P.set(hx + 1, hy + 5, INK); P.rect(hx + 2, hy + 4, 2, 1, INK); P.set(hx + 4, hy + 5, INK); }
    else if (face === 'grit') P.rect(hx + 1, hy + 4, 4, 1, [240, 240, 240]);
    else P.rect(hx + 2, hy + 4, 2, 1, C.skin(.2, 0, 0));
  }
  // red cap with a peak pointing forward
  ell(P, hx - .5, hy - 3.2, 5.8, 3.4, (x, y, dx, dy) => C.red(.75 - dy * .3 - dx * .15, x, y));
  for (let x = hx; x <= hx + 8; x++) { P.set(x, hy - 1, C.red(.4, 0, 0)); }
  P.rect(hx - 1, hy - 5, 3, 1, C.red(.95, 0, 0));
}

// ———————————————— YOU, standing (34×50) ————————————————
// p: { step, arm:'low'|'box'|'knock'|'up'|'run0'|'run1'|'eat'|'share', sit, face, blink, bob, hot }
function drawYou(P, E, p) {
  const by = (p.bob || 0) + (p.sit ? 10 : 0), top = 20 + by, hx = 16 + (p.lean || 0), hy = 11 + by;
  if (p.sit) {
    for (let y = 37; y < 41; y++) for (let x = 12; x < 24; x++) P.set(x, y, C.denim(.45 - (y - 37) * .08, x, y));
    for (const lx of [20, 23]) { for (let y = 41; y < 48; y++) for (let x = lx; x < lx + 3; x++) P.set(x, y, C.denim(.35, x, y)); P.rect(lx, 47, 4, 2, C.shoe(.5, 0, 0)); }
  } else {
    const st = p.step ?? -1, run = p.arm?.startsWith('run');
    const legs = st < 0 ? [[13, 0], [18, 0]] : run ? [[[9, -1], [21, 0]], [[13, -2], [17, 0]], [[21, 0], [9, -1]], [[17, 0], [13, -2]]][st] : [[[11, 0], [20, -1]], [[14, -1], [17, 0]], [[20, -1], [11, 0]], [[17, 0], [14, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      for (let y = 34; y < 46 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, C.denim(.4 - (x === lx ? .12 : 0) + (i ? 0 : .1), x, y));
      P.rect(lx, 46 + ly, 5, 3, C.shoe(i ? .4 : .6, 0, 0)); P.rect(lx, 48 + ly, 6, 1, C.shoe(.1, 0, 0));
    });
  }
  // red jacket
  P.poly([[10, top], [22, top], [23, top + 15], [9, top + 15]], (x, y) => { const s = (x - 9) / 14; let v = .72 - s * .4; if (x === 16) v -= .25; if (y === top + 14) v -= .2; return C.red(v, x, y); });
  P.rect(16, top + 2, 1, 12, C.chrome(.5, 0, 0));   // zip
  head(P, hx, hy, p);
  const sl = (pts, s = .6) => pts.forEach(([x, y]) => { P.set(x, y, C.red(s, x, y)); P.set(x, y + 1, C.red(s - .25, x, y)); });
  const hand = (x, y, w = 2, h = 2) => P.rect(x, y, w, h, C.skin(.6, 0, 0));
  const a = p.arm || 'low', hot = p.hot ?? 1;
  if (a === 'low') { sl([[21, top + 2], [22, top + 4], [22, top + 6], [22, top + 8], [22, top + 10]]); hand(22, top + 12); P.set(9, top + 9, C.skin(.35, 0, 0)); }
  if (a === 'box') { sl([[21, top + 3], [23, top + 5], [24, top + 6]]); sl([[11, top + 3], [13, top + 6]], .45); pizzaBox(P, E, 17, top + 7, 12, 4, hot); hand(26, top + 8); }
  if (a === 'knock') { sl([[21, top + 2], [23, top + 2], [25, top + 1], [27, top]]); P.rect(28, top - 2, 3, 3, C.skin(.6, 0, 0)); pizzaBox(P, E, 8, top + 8, 10, 4, hot); P.set(9, top + 9, C.skin(.4, 0, 0)); }
  if (a === 'up') { sl([[21, top + 1], [22, top - 1], [23, top - 3], [24, top - 5], [24, top - 7]]); hand(24, top - 9); sl([[11, top + 1], [10, top - 1], [9, top - 3], [8, top - 5], [8, top - 7]], .45); hand(7, top - 9); }
  if (a === 'run0') { sl([[21, top + 2], [23, top + 3], [24, top + 5]]); hand(25, top + 6); sl([[11, top + 2], [9, top + 1], [8, top - 1]], .45); hand(7, top - 2); }
  if (a === 'run1') { sl([[21, top + 2], [23, top + 1], [24, top - 1]]); hand(25, top - 2); sl([[11, top + 2], [10, top + 4], [9, top + 6]], .45); hand(8, top + 7); }
  if (a === 'sitbox') { sl([[21, top + 2], [22, top + 5], [23, top + 8]]); pizzaBox(P, E, 14, top + 11, 12, 3, hot, 1); hand(24, top + 9); }
  if (a === 'eat') { sl([[21, top + 2], [23, top + 1], [24, top - 1]]); hand(24, top - 3); P.poly([[24, hy + 2], [29, hy + 1], [26, hy + 6]], (x, y) => C.pizza(.7, x, y)); P.set(26, hy + 2, C.sauce(.6, 0, 0)); pizzaBox(P, E, 13, top + 11, 12, 3, hot * .5, 1); }
  if (a === 'share') { sl([[21, top + 2], [23, top + 3], [25, top + 4], [27, top + 4]]); hand(28, top + 3); P.poly([[29, top + 1], [33, top + 3], [29, top + 6]], (x, y) => C.pizza(.7, x, y)); P.set(30, top + 3, C.sauce(.6, 0, 0)); pizzaBox(P, E, 11, top + 11, 12, 3, hot * .5, 1); }
}
const YOU_T = {
  stand: { arm: 'box' }, stand1: { arm: 'box', bob: 1 }, blink: { arm: 'box', blink: 1 },
  w0: { step: 0, arm: 'box' }, w1: { step: 1, arm: 'box', bob: -1 }, w2: { step: 2, arm: 'box' }, w3: { step: 3, arm: 'box', bob: -1 },
  knock: { arm: 'knock', face: 'smile' }, knock1: { arm: 'low', face: 'smile' },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 }, talkShock: { arm: 'up', face: 'shock', mouth: 1 },
  r0: { step: 0, arm: 'run0', face: 'shock', lean: 1 }, r1: { step: 1, arm: 'run1', face: 'shock', lean: 1, bob: -1 }, r2: { step: 2, arm: 'run0', face: 'shock', lean: 1 }, r3: { step: 3, arm: 'run1', face: 'shock', lean: 1, bob: -1 },
  hope: { arm: 'box', face: 'smile' }, sadBox: { arm: 'box', face: 'sad' },
  sit: { sit: 1, arm: 'sitbox', face: 'sad' }, sitBlink: { sit: 1, arm: 'sitbox', face: 'sad', blink: 1 },
  eat: { sit: 1, arm: 'eat', face: 'happy' }, share: { sit: 1, arm: 'share', face: 'smile' }, share1: { sit: 1, arm: 'share', face: 'smile', bob: 1 },
};

// ———————————————— YOU on the scooter (56×46) ————————————————
// p: { wheel 0|1, look (head back), brake, arms:'bars'|'wave'|'up', pizzaFace, lid (box open), hot, face }
function drawRider(P, E, p) {
  const by = p.bob || 0, hot = p.hot ?? 1;
  // wheels
  for (const [wx, wy] of [[11, 39], [42, 39]]) {
    ell(P, wx, wy, 5.6, 5.6, (x, y, dx, dy) => { const r = Math.hypot(dx, dy); return r > .62 ? C.tyre(.4 - dy * .2, x, y) : C.chrome(.55 - dy * .2, x, y); });
    const a = (p.wheel || 0) * Math.PI / 4; for (let k = -2; k <= 2; k++) P.set(Math.round(wx + Math.cos(a) * k), Math.round(wy + Math.sin(a) * k), C.chrome(.2, 0, 0));
  }
  // scooter body: rear cowl, floorboard, front shield, handlebar stem, headlight
  P.poly([[6, 30 + by], [22, 28 + by], [24, 36 + by], [5, 37 + by]], (x, y) => C.red(.72 - (y - 28) * .04 - (x < 8 ? .15 : 0), x, y));
  P.rect(22, 35 + by, 14, 2, C.tyre(.5, 0, 0));
  P.poly([[36, 36 + by], [40, 22 + by], [44, 22 + by], [44, 37 + by]], (x, y) => C.red(.8 - (x - 36) * .03, x, y));
  P.rect(41, 14 + by, 2, 9, C.chrome(.6, 0, 0)); P.rect(37, 13 + by, 8, 2, C.chrome(.7, 0, 0));
  P.rect(44, 18 + by, 3, 3, C.chrome(.95, 0, 0)); for (const [x, y] of [[45, 19], [46, 19], [45, 20], [46, 20]]) { P.set(x, y + by, [255, 250, 220]); E.set(x, y + by, [255, 250, 220]); }
  P.rect(8, 27 + by, 14, 2, C.tyre(.55, 0, 0));   // seat
  // rack + pizza box behind the rider
  P.rect(1, 25 + by, 9, 1, C.chrome(.5, 0, 0));
  pizzaBox(P, E, 0, 19 + by, 11, 6, hot, p.lid ? 1 : 0);
  if (p.empty) return;
  // rider: legs bent, torso leaning forward
  for (let y = 26 + by; y < 30 + by; y++) for (let x = 14; x < 26; x++) P.set(x, y, C.denim(.45 - (y - 26 - by) * .06, x, y));
  for (let y = 29 + by; y < 35 + by; y++) for (let x = 24; x < 28; x++) P.set(x, y, C.denim(.35, x, y));
  P.rect(24, 34 + by, 6, 2, C.shoe(.5, 0, 0));
  const lb = p.brake ? -2 : 0;
  P.poly([[13 + lb, 14 + by], [24 + lb, 13 + by], [27, 27 + by], [13, 27 + by]], (x, y) => C.red(.7 - (x - 13) / 14 * .35, x, y));
  const hx = 21 + lb + (p.look ? -1 : 0), hy = 7 + by;
  if (p.look) {   // looking back over the shoulder: face to the left
    ell(P, hx, hy + .5, 5.4, 5.8, (x, y, dx, dy) => C.skin(.6 + dx * .14 - dy * .3, x, y));
    const ex = hx - 2, ey = hy + 1; P.set(ex, ey, INK); P.set(ex, ey - 1, INK); P.set(ex + 3, ey, INK); P.set(ex + 3, ey - 1, INK);
    P.rect(hx - 6, hy + 1, 2, 3, C.skin(.7, 0, 0)); P.rect(hx - 3, hy + 4, 3, 2, INK); P.set(hx - 1, ey + 2, BLUSH);
    ell(P, hx + .5, hy - 3.2, 5.8, 3.4, (x, y, dx, dy) => C.red(.75 - dy * .3 + dx * .15, x, y)); for (let x = hx - 8; x <= hx; x++) P.set(x, hy - 1, C.red(.4, 0, 0));
  } else head(P, hx, hy, p);
  const sl = pts => pts.forEach(([x, y]) => { P.set(x, y + by, C.red(.6, x, y)); P.set(x, y + 1 + by, C.red(.35, x, y)); });
  const arms = p.arms || 'bars';
  if (arms === 'bars') { sl([[24, 16], [27, 15], [30, 15], [33, 14], [36, 13]]); P.rect(37, 12 + by, 2, 2, C.skin(.6, 0, 0)); }
  if (arms === 'wave') { sl([[24, 16], [27, 15], [30, 15], [33, 14], [36, 13]]); P.rect(37, 12 + by, 2, 2, C.skin(.6, 0, 0)); sl([[15, 15], [13, 12], [11, 9], [10, 6]]); P.rect(9, 3 + by, 3, 3, C.skin(.6, 0, 0)); }
  if (arms === 'up') { sl([[24, 15], [26, 12], [27, 9], [28, 6]]); P.rect(28, 3 + by, 2, 3, C.skin(.6, 0, 0)); sl([[16, 15], [15, 12], [14, 9], [13, 6]]); P.rect(12, 3 + by, 2, 3, C.skin(.6, 0, 0)); }
}
const RIDER_T = {
  ride0: { wheel: 0 }, ride1: { wheel: 1, bob: 1 }, ride2: { wheel: 2 }, ride3: { wheel: 3, bob: 1 },
  grit0: { wheel: 0, face: 'grit' }, grit1: { wheel: 2, face: 'grit', bob: 1 },
  look0: { wheel: 0, look: 1, arms: 'wave' }, look1: { wheel: 2, look: 1, arms: 'wave', bob: 1 },
  brake: { brake: 1, arms: 'up', face: 'shock', lid: 1, hot: .9 }, brake1: { brake: 1, arms: 'up', face: 'shock', lid: 1, bob: 1, hot: .9 },
  face: { brake: 1, pizzaFace: 1, lid: 1, hot: .6 }, face1: { brake: 1, pizzaFace: 1, lid: 1, bob: 1, hot: .6 },
  sad0: { wheel: 0, face: 'sad', hot: .55 }, sad1: { wheel: 2, face: 'sad', bob: 1, hot: .55 },
  park: { face: 'n', hot: .5 }, flee0: { wheel: 0, face: 'shock', hot: .45 }, flee1: { wheel: 2, face: 'shock', bob: 1, hot: .45 },
  late0: { wheel: 0, face: 'grit', hot: .35 }, late1: { wheel: 2, face: 'grit', bob: 1, hot: .35 },
  empty: { empty: 1, hot: 0 },
};

// ———————————————— THE DOG (28×22) ————————————————
function drawDog(P, E, p) {
  const by = p.bob || 0, pose = p.pose || 'stand', sit = pose === 'sit' || pose === 'eat' || pose === 'beg';
  const cx = 12, cy = 13 + by;
  // legs
  if (pose === 'run') { const st = p.step || 0; const L = [[[6, 1], [17, -1]], [[8, -1], [15, 1]], [[5, 0], [18, 0]], [[9, 0], [14, -1]]][st]; for (const [lx, ly] of L) { P.rect(lx, 17 + by + ly, 2, 4 - ly, C.tan(.4, 0, 0)); P.rect(lx + 3, 17 + by - ly, 2, 4 + ly, C.tan(.55, 0, 0)); } }
  else if (sit) { P.rect(7, 16 + by, 5, 4, C.tan(.45, 0, 0)); P.rect(15, 16, 2, 5, C.tan(.6, 0, 0)); P.rect(18, 16, 2, 5, C.tan(.5, 0, 0)); }
  else if (pose !== 'sleep') for (const lx of [6, 9, 15, 18]) P.rect(lx, 17 + by, 2, 4, C.tan(lx > 12 ? .6 : .45, 0, 0));
  // body
  if (pose === 'sleep') ell(P, 13, 17, 9, 4, (x, y, dx, dy) => C.tan(.7 - dy * .3, x, y));
  else if (sit) ell(P, 12, 13 + by, 6, 5.4, (x, y, dx, dy) => C.tan(.7 - dy * .3 - dx * .1, x, y));
  else ell(P, cx, cy, 8.5, 4.4, (x, y, dx, dy) => C.tan(.72 - dy * .35, x, y));
  for (let i = 0; i < 4; i++) P.set(8 + i * 3, cy - 3 + (i % 2), C.tan(.95, 0, 0));   // scruff
  // tail
  const tw = p.wag ? -2 : 0;
  if (pose !== 'sleep') { P.set(3, cy - 2 + tw, C.tan(.6, 0, 0)); P.set(2, cy - 3 + tw, C.tan(.7, 0, 0)); P.set(2, cy - 4 + tw * 1.5, C.tan(.8, 0, 0)); }
  // head
  const head = pose === 'sleep' ? [20, 15] : pose === 'eat' ? [21, 13 + by] : pose === 'bark' ? [21, 6 + by] : sit ? [18, 6 + by] : [20, 8 + by];
  const [hx, hy] = head;
  ell(P, hx, hy, 4.4, 4, (x, y, dx, dy) => C.tan(.78 - dy * .3, x, y));
  P.rect(hx + 3, hy, 3, 2, C.tan(.6, 0, 0)); P.set(hx + 5, hy, INK);   // snout + nose
  if (pose === 'sleep' || p.blink) P.set(hx + 1, hy - 1, C.tan(.2, 0, 0)); else { P.set(hx + 1, hy - 1, INK); P.set(hx + 1, hy - 2, [250, 250, 250]); }
  P.rect(hx - 3, hy - 3, 2, 4, C.tan(.3, 0, 0)); P.set(hx - 2, hy - 4, C.tan(.35, 0, 0));        // floppy ear
  P.set(hx + 1, hy - 4, C.tan(.5, 0, 0)); P.set(hx + 2, hy - 5, C.tan(.55, 0, 0));                  // perky ear
  if (pose === 'bark') { P.rect(hx + 3, hy + 2, 3, 2, [120, 30, 40]); P.set(hx + 6, hy - 2, [250, 250, 250]); P.set(hx + 7, hy - 3, [250, 250, 250]); }
  if (pose === 'beg' || pose === 'eat') P.set(hx + 4, hy + 2, [230, 110, 120]);   // tongue
  if (pose === 'eat') { P.poly([[hx + 3, hy + 2], [hx + 8, hy + 1], [hx + 6, hy + 5]], (x, y) => C.pizza(.7, x, y)); }
}
const DOG_T = {
  sleep: { pose: 'sleep' }, stand: {}, bark: { pose: 'bark' }, bark1: { pose: 'bark', bob: -1 },
  r0: { pose: 'run', step: 0 }, r1: { pose: 'run', step: 1, bob: -1 }, r2: { pose: 'run', step: 2 }, r3: { pose: 'run', step: 3, bob: -1 },
  sit: { pose: 'sit' }, sitWag: { pose: 'sit', wag: 1 }, beg: { pose: 'beg', wag: 1 }, beg1: { pose: 'beg', bob: 1 }, eat: { pose: 'eat', wag: 1 }, eat1: { pose: 'eat', bob: 1 },
};

// ———————————————— THE GHOST (28×36) ————————————————
function drawGhost(P, E, p) {
  const by = p.bob || 0, cx = 14, top = 4 + by;
  P.poly([[cx - 7, top + 8], [cx - 5, top + 2], [cx, top], [cx + 5, top + 2], [cx + 7, top + 8], [cx + 9, top + 28], [cx - 9, top + 28]], (x, y) => C.sheet(.8 - (y - top) * .012 - Math.abs(x - cx) * .02, x, y));
  for (let x = cx - 9; x <= cx + 9; x++) { const w = Math.round(Math.sin(x * .9 + (p.wave || 0) * 2) * 1.5 + 1.5); for (let k = 0; k < w; k++) P.set(x, top + 28 + k, C.sheet(.55, 0, 0)); }
  // eyes: hollow black ovals with a faint green glow
  for (const ex of [cx - 2, cx + 3]) { P.rect(ex, top + 7, 2, 3, INK); const g = [140, 255, 170]; P.set(ex, top + 7, g); E.set(ex, top + 7, g); }
  P.rect(cx, top + 12, 2, 2, INK);
  if (p.arm === 'wave') { P.poly([[cx + 7, top + 12], [cx + 12, top + 6], [cx + 13, top + 8], [cx + 8, top + 15]], (x, y) => C.sheet(.7, x, y)); }
  if (p.arm === 'boo') for (const s of [-1, 1]) P.poly([[cx + s * 7, top + 12], [cx + s * 13, top + 7], [cx + s * 13, top + 10], [cx + s * 8, top + 16]], (x, y) => C.sheet(.7, x, y));
  // faint all-over glow so it reads as a ghost
  for (let y = 0; y < 36; y++) for (let x = 0; x < 28; x++) { const c = P.get(x, y); if (c && !E.get(x, y)) E.set(x, y, [Math.round(c[0] * .22), Math.round(c[1] * .3), Math.round(c[2] * .26)]); }
}
const GHOST_T = { f0: {}, f1: { bob: 1, wave: 1 }, boo: { arm: 'boo' }, wave0: { arm: 'wave' }, wave1: { arm: 'wave', bob: 1, wave: 1 } };

// ———————————————— THE BEAR (44×62) ————————————————
function drawBear(P, E, p) {
  const by = p.bob || 0, cx = 21, top = 22 + by;
  for (const lx of [13, 24]) { P.rect(lx, 52, 7, 8, C.fur(.4, 0, 0)); P.rect(lx - 1, 58, 9, 3, C.robeW(.6, 0, 0)); }   // legs + slippers
  // robe body
  P.poly([[cx - 11, top], [cx + 11, top], [cx + 14, 54], [cx - 13, 54]], (x, y) => { const st = Math.floor((x + 40) / 3) % 2; const s = (x - cx + 13) / 27; return st ? C.robe(.7 - s * .35, x, y) : C.robeW(.7 - s * .3, x, y); });
  P.poly([[cx - 3, top], [cx + 3, top], [cx, top + 10]], (x, y) => C.fur(.65, x, y));   // chest fur in the V
  P.rect(cx - 12, top + 16, 26, 2, C.robeW(.8, 0, 0)); P.set(cx + 6, top + 18, C.robeW(.6, 0, 0)); P.set(cx + 7, top + 19, C.robeW(.6, 0, 0));   // belt
  // head
  const hx = cx + 2 + (p.down ? 1 : 0), hy = 12 + by + (p.down ? 2 : 0);
  ell(P, hx, hy, 9, 8.5, (x, y, dx, dy) => C.fur(.7 - dy * .3 - dx * .1, x, y));
  for (const ex of [hx - 7, hx + 6]) ell(P, ex, hy - 7, 2.6, 2.6, (x, y) => C.fur(.6, x, y));
  ell(P, hx + 4, hy + 3, 4.5, 3.4, (x, y, dx, dy) => C.tan(.7 - dy * .2, x, y));   // muzzle
  P.rect(hx + 6, hy + 1, 3, 2, INK);   // nose
  const ey = hy - 2;
  if (p.blink) { P.rect(hx - 1, ey, 2, 1, C.fur(.2, 0, 0)); P.rect(hx + 4, ey, 2, 1, C.fur(.2, 0, 0)); }
  else { P.rect(hx - 1, ey, 2, 2, INK); P.rect(hx + 4, ey, 2, 2, INK); }
  if (p.frown) { P.line(hx - 2, ey - 3, hx + 1, ey - 2, C.fur(.15, 0, 0)); P.line(hx + 7, ey - 3, hx + 4, ey - 2, C.fur(.15, 0, 0)); }
  if (p.talk) P.rect(hx + 3, hy + 5, 4, 2, [70, 20, 24]); else P.rect(hx + 3, hy + 6, 4, 1, C.fur(.15, 0, 0));
  // arms (robe sleeves) + mug
  const sl = (pts, s = .6) => pts.forEach(([x, y]) => { P.rect(x, y + by, 3, 3, C.robe(s, x, y)); });
  if (p.arm === 'point') { sl([[cx + 10, top + 4], [cx + 13, top + 5], [cx + 16, top + 5]]); ell(P, cx + 20, top + 6 + by, 2.4, 2.4, (x, y) => C.fur(.6, x, y)); }
  else { sl([[cx + 10, top + 4], [cx + 11, top + 8], [cx + 11, top + 12]]); P.rect(cx + 10, top + 14 + by, 5, 6, C.mug(.6, 0, 0)); P.rect(cx + 15, top + 16 + by, 2, 3, C.mug(.4, 0, 0)); }
  sl([[cx - 13, top + 4], [cx - 14, top + 8], [cx - 14, top + 12]], .4); ell(P, cx - 13, top + 16 + by, 2.4, 2.4, (x, y) => C.fur(.5, x, y));
}
const BEAR_T = { stand: {}, stand1: { bob: 1 }, blink: { blink: 1 }, down: { down: 1, frown: 1 }, talk: { down: 1, frown: 1, talk: 1 }, talk1: { down: 1, talk: 1, bob: 1 }, point: { arm: 'point', talk: 1, down: 1 }, point1: { arm: 'point', down: 1, bob: 1 } };

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
  you: { table: YOU_T, draw: drawYou, FW: 34, FH: 50, blob: .42 },
  rider: { table: RIDER_T, draw: drawRider, FW: 56, FH: 46, blob: .9 },
  dog: { table: DOG_T, draw: drawDog, FW: 28, FH: 22, blob: .32 },
  ghost: { table: GHOST_T, draw: drawGhost, FW: 28, FH: 36, blob: .35 },
  bear: { table: BEAR_T, draw: drawBear, FW: 44, FH: 62, blob: .6 },
};
export function makeChar(kind, emI = 1.4) {
  const K = KINDS[kind], A = atlas(K.table, K.draw, K.FW, K.FH);
  const mesh = billboard(A.tex, K.FW * SPX, K.FH * SPX, { em: A.em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.3 + totalEmissiveRadiance);\n#include <opaque_fragment>'); };
  mesh.material.customProgramCacheKey = () => 'spriteCap'; mesh.material.needsUpdate = true;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  const sh = blob(K.blob, .5); sh.position.y = .015; root.add(sh);
  return {
    root, mesh, atlas: A, shadowBlob: sh, H: K.FH * SPX, W: K.FW * SPX,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
  };
}

// —— a flying pizza: a flat pixel disc with one slice missing ——
export function pizzaDisc() {
  const P = new PX(20, 20);
  P.fill((x, y) => { const dx = x - 9.5, dy = y - 9.5, r = Math.hypot(dx, dy); if (r > 9.6) return null; if (dx > 0 && dy < 0 && Math.abs(Math.atan2(-dy, dx) - .8) < .42) return null; if (r > 8) return C.pizza(.45, x, y); if ((x * 7 + y * 3) % 11 === 0 || (x * 5 + y * 9) % 13 === 0) return C.sauce(.6, x, y); return C.pizza(.8 + ((x + y) % 3 === 0 ? .1 : 0), x, y); });
  P.outline(.3);
  const t = texOf(P.done()), m = new THREE.MeshLambertMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: .6, emissiveMap: t });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(.95, .95), m); me.castShadow = true;
  me.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5, side: THREE.DoubleSide });
  return me;
}
export { C as COLS };
