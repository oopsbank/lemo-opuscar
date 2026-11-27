// Pixel Life characters at twice the resolution (a design test): the same people, the same colours and silhouettes, drawn on a
// grid with twice the pixels each way (hero 76×100 instead of 38×50; the Customer 68×92 instead of 34×46) and half the pixel
// size in the world, so they stand exactly as tall. The extra pixels go to the face (eye whites, pupils, brows, nose, ear,
// mouth shapes), the hands (fingers), the hair (strands, highlight) and the clothes (collar, placket, badge, folds, shoes).
import * as THREE from 'three';
import { PX, ramp, hex, billboard, blob } from './px.js';
import { atlas, COLS as C, INK } from './chars.js';

export const SPX2 = 1 / 54;   // HD character pixel → metres (half the old 1/27)
const BLUSH = hex('#e88a74'), LIP = [122, 52, 54], MOUTH = [70, 18, 28], TONGUE = [214, 86, 96], WH = [248, 248, 244], SCL = [236, 238, 240];
const POLO = ramp(['#1c440a', '#36741a', '#58aa22', '#86d636', '#c2f466'], .22), KHAKI = ramp(['#3e3424', '#5e5038', '#806e4e', '#a28e68', '#c0ac84'], .22);
const LANY = ramp(['#14306e', '#2456b4', '#3c78e0', '#78a8f4'], .22);

// an ellipse fill that skips pixels the colour function returns null for
function ellC(P, cx, cy, rx, ry, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const c = f(x, y, dx, dy); if (c) P.set(x, y, c); } } }
// a thick stroke along a polyline: every pixel within r of it, shaded across its width (lit from the upper left)
function limb(P, pts, r, col, s = .6) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0 - r); y <= y1 + r; y++) for (let x = Math.floor(x0 - r); x <= x1 + r; x++) {
    let best = 1e9, side = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / L)), px = ax + u * dx - x - .5, py = ay + u * dy - y - .5, d = Math.hypot(px, py);
      if (d < best) { best = d; side = (px + py) / (d || 1); }
    }
    if (best <= r) P.set(x, y, col(s + side * .12 - (best / r) * .14, x, y));
  }
}
function hand(P, x, y, s = .62, o = {}) {   // a mitten hand with a thumb and finger creases
  P.ellipse(x, y, 3.2, 3.0, (X, Y, dx, dy) => C.skin(s - dx * .1 - dy * .14, X, Y));
  P.set(x + (o.flip ? -3 : 3), y - 2, C.skin(s + .05, 0, 0)); P.set(x + (o.flip ? -3 : 3), y - 1, C.skin(s - .05, 0, 0));   // thumb
  if (!o.fist) { P.set(x - 1, y + 2, C.skin(s - .3, 0, 0)); P.set(x + 1, y + 2, C.skin(s - .3, 0, 0)); }
  if (o.finger) { const [fx, fy] = o.finger; P.line(x, y, fx, fy, C.skin(s, 0, 0)); P.line(x + 1, y, fx + 1, fy, C.skin(s - .2, 0, 0)); }
}

// —— YOU: the recurring hero's head, facing right (3/4 view) ——
function heroHeadHD(P, E, hx, hy, p) {
  const f = p.face || 'n';
  P.rect(hx - 4, hy + 10, 8, 7, C.skin(.38, 0, 0)); P.rect(hx - 4, hy + 10, 8, 2, C.skin(.25, 0, 0));   // neck in the chin's shadow
  P.ellipse(hx, hy, 11, 12, (x, y, dx, dy) => C.skin(.64 - dx * .12 - dy * .26, x, y));
  P.ellipse(hx + 3, hy + 6, 8, 6, (x, y, dx, dy) => C.skin(.6 - dy * .3 - dx * .06, x, y));   // the jaw, forward
  // hair: a cap over the crown and the back of the head, the fringe in three locks over the forehead
  ellC(P, hx - 1, hy - 4, 11.8, 9.5, (x, y, dx, dy) => (y <= hy - 4 || x <= hx - 7) ? C.hair(.5 - dy * .25 + dx * .05 + ((x * 3 + y) % 5 === 0 ? .12 : 0), x, y) : null);
  for (const tri of [[[hx - 3, hy - 5], [hx + 3, hy - 5], [hx, hy]], [[hx + 2, hy - 6], [hx + 8, hy - 5], [hx + 5, hy - 1]], [[hx + 7, hy - 7], [hx + 12, hy - 4], [hx + 10, hy - 1]]])
    P.poly(tri, (x, y) => C.hair(.45 + (y - hy + 5) * -.04, x, y));
  for (let x = hx - 7; x <= hx + 3; x++) P.set(x, hy - 12 + Math.round(Math.abs(x - hx + 2) * .25), C.hair(.92, 0, 0));   // the shine
  for (const [x, y] of [[hx - 5, hy - 8], [hx - 2, hy - 9], [hx + 2, hy - 9], [hx - 8, hy - 3]]) P.line(x, y, x + 2, y + 3, C.hair(.2, 0, 0));   // strands
  // the ear (under the headset cup in this job) and the sideburn
  P.ellipse(hx - 5, hy + 2, 2.6, 3.4, (x, y, dx) => C.skin(.5 - dx * .1, x, y)); P.rect(hx - 5, hy + 1, 1, 3, C.skin(.28, 0, 0));
  // nose: a bump past the cheek line, lit on top, a shadow under it
  P.rect(hx + 10, hy + 1, 2, 4, C.skin(.68, 0, 0)); P.set(hx + 12, hy + 3, C.skin(.6, 0, 0)); P.set(hx + 12, hy + 4, C.skin(.4, 0, 0)); P.rect(hx + 9, hy + 5, 3, 1, C.skin(.36, 0, 0));
  // eyes: the near eye (right) and the far eye (left, a pixel narrower)
  const ey = hy + 1, eyes = [[hx + 6, 3], [hx, 2]];
  for (const [ex, w] of eyes) {
    if (p.blink || f === 'smile') {   // closed: a lash line (smile: an upturned arc)
      if (f === 'smile' && !p.blink) { P.set(ex - 1, ey + 1, INK); P.rect(ex, ey, w - 1, 1, INK); P.set(ex + w - 1, ey + 1, INK); }
      else { P.rect(ex - 1, ey + 1, w + 1, 1, INK); P.set(ex + w - 1, ey + 2, INK); }
      continue;
    }
    const big = f === 'shock' ? 1 : 0;
    P.rect(ex - 1 - big, ey - 1 - big, w + 1 + big, 4 + big * 2, SCL);   // the white
    if (f === 'shock') { P.rect(ex + w - 2, ey, 1, 2, INK); }
    else { P.rect(ex + w - 2, ey - 1, 2, 4, INK); P.set(ex + w - 2, ey - 1, WH); }   // a tall pupil looking right, a shine
    P.rect(ex - 1 - big, ey - 2 - big, w + 2 + big, 1, INK); P.set(ex + w + big, ey - 1 - big, INK);   // the upper lid and an outer lash
    if (f === 'stare') P.rect(ex - 1, ey - 1, w + 1, 2, C.skin(.35, 0, 0));   // half-lidded
  }
  // brows
  const brow = (x0, w, dy0, dy1) => { for (let i = 0; i < w; i++) { const y = ey - 5 + Math.round(dy0 + (dy1 - dy0) * i / Math.max(1, w - 1)); P.set(x0 + i, y, C.hair(.08, 0, 0)); P.set(x0 + i, y - 1, C.hair(.3, 0, 0)); } };
  if (f === 'shock') { brow(hx + 5, 4, -2, -2); brow(hx - 1, 3, -2, -2); }
  else if (f === 'worry' || f === 'sweat' || f === 'sad') { brow(hx + 5, 4, -1, 1); brow(hx - 1, 3, 1, -1); }
  else if (f === 'stare') { brow(hx + 5, 4, 1, 1); brow(hx - 1, 3, 1, 1); }
  else { brow(hx + 5, 4, 0, 0); brow(hx - 1, 3, 0, 0); }
  P.rect(hx + 3, hy + 6, 3, 1, BLUSH); P.set(hx + 9, hy + 6, BLUSH);
  // mouth
  const mx = hx + 5, my = hy + 9;
  if (f === 'shock') { P.rect(mx - 1, my - 1, 3, 4, MOUTH); P.rect(mx, my + 1, 2, 1, TONGUE); }
  else if (p.mouth && f === 'smile') { P.rect(mx - 2, my - 1, 6, 1, WH); P.rect(mx - 1, my, 4, 2, MOUTH); P.rect(mx, my + 1, 2, 1, TONGUE); P.set(mx - 3, my - 2, LIP); P.set(mx + 4, my - 2, LIP); }
  else if (p.mouth) { P.rect(mx - 1, my - 1, 4, 3, MOUTH); P.rect(mx - 1, my - 1, 4, 1, WH); P.rect(mx, my + 1, 2, 1, TONGUE); }
  else if (f === 'smile') { P.set(mx - 2, my - 1, LIP); P.rect(mx - 1, my, 4, 1, LIP); P.set(mx + 3, my - 1, LIP); }
  else if (f === 'sad' || f === 'sweat' || f === 'worry') { P.set(mx - 2, my + 1, LIP); P.rect(mx - 1, my, 4, 1, LIP); P.set(mx + 3, my + 1, LIP); }
  else if (f === 'stare') P.rect(mx - 2, my, 5, 1, LIP);
  else { P.rect(mx - 1, my, 3, 1, LIP); P.rect(mx - 1, my + 1, 3, 1, C.skin(.4, 0, 0)); }
  // the headset: a band over the crown and a cup over the ear
  for (let a = -3.3; a <= -1.0; a += .02) for (const r of [12.6, 13.4]) P.set(Math.round(hx - 3 + Math.cos(a) * r), Math.round(hy + 1 + Math.sin(a) * r), C.black(r > 13 ? .35 : .6, 0, 0));
  P.ellipse(hx - 7, hy + 2, 2.6, 3.6, (x, y, dx, dy) => C.grey(.42 - dx * .15 - dy * .2, x, y)); P.rect(hx - 6, hy + 1, 1, 2, POLO(.8, 0, 0));
  if (f === 'sweat' || p.sweat) { P.set(hx - 2, hy - 9, [190, 230, 255]); P.rect(hx - 3, hy - 8, 3, 3, [140, 200, 250]); P.rect(hx - 2, hy - 5, 1, 1, [100, 160, 230]); E.rect(hx - 3, hy - 8, 3, 3, [20, 40, 60]); }
}
// —— YOU on the IT help desk: lime polo, white collar, blue lanyard and badge, khaki trousers, headset ——
function drawHeroHD(P, E, p) {
  const by = (p.bob || 0) * 2, top = 40 + by, hx = 34 + (p.lean || 0) * 2, hy = 22 + by, st = p.step ?? -1;
  // legs: hip → ankle strokes (walk: four steps), then shoes
  const feet = st < 0 ? [[30, 0], [40, 0]] : [[[25, 0], [45, -2]], [[32, -2], [38, 0]], [[45, -2], [25, 0]], [[38, 0], [32, -2]]][st];
  feet.forEach(([fx, ly], i) => {
    limb(P, [[i ? 39 : 31, top + 32], [fx, 90 + ly]], 4.2, KHAKI, i ? .55 : .42);
    P.set(fx + 1, top + 40, KHAKI(.75, 0, 0));
    P.ellipse(fx + 2, 93 + ly, 6, 3.2, (x, y, dx, dy) => y > 95 + ly ? C.grey(.55, x, y) : C.shoe(.5 - dy * .3 + (i ? .1 : 0), x, y));
    P.rect(fx - 3, 96 + ly, 11, 1, C.grey(.35, 0, 0)); P.set(fx + 3, 91 + ly, C.grey(.8, 0, 0)); P.set(fx + 5, 92 + ly, C.grey(.8, 0, 0));   // sole, laces
  });
  // arms: [shoulder, elbow, wrist] for the far arm (drawn behind) and the near arm (in front); walking swings them
  const sw = st < 0 ? 0 : [5, 0, -5, 0][st];
  const A = {
    n: [[[25, top + 4], [23 - sw, top + 16], [23 - sw, top + 27]], [[45, top + 4], [47 + sw, top + 16], [47 + sw, top + 27]]],
    talk: [[[25, top + 4], [23, top + 16], [23, top + 27]], [[45, top + 4], [51, top + 15], [58, top + 9]]],
    point: [[[25, top + 4], [23, top + 16], [23, top + 27]], [[45, top + 4], [53, top + 9], [62, top + 11]]],
    up: [[[25, top + 4], [19, top - 6], [17, top - 17]], [[45, top + 4], [51, top - 6], [53, top - 17]]],
  }[p.arm || 'n'];
  const arm = (pts, s, near) => {
    const [S, El, Wr] = pts, mid = [S[0] + (El[0] - S[0]) * .55, S[1] + (El[1] - S[1]) * .55];
    limb(P, [mid, El, Wr], 2.8, C.skin, s);
    limb(P, [S, mid], 4.6, POLO, s);   // the short sleeve
    P.set(Math.round(mid[0]), Math.round(mid[1]) + 3, POLO(s - .35, 0, 0));
    const dx = Wr[0] - El[0], dy = Wr[1] - El[1], L = Math.hypot(dx, dy) || 1;
    hand(P, Math.round(Wr[0] + dx / L * 3), Math.round(Wr[1] + dy / L * 3), s + .02, { finger: p.arm === 'point' && near ? [Wr[0] + 9, Wr[1] + 1] : null });
  };
  arm(A[0], .42, false);
  // torso: the polo, shaded, with folds; a belt
  P.poly([[24, top], [46, top], [49, top + 31], [21, top + 31]], (x, y) => { let v = .76 - (x - 21) / 28 * .44; if (y >= top + 28) v -= .16; if ((x === 28 || x === 43) && y > top + 18) v -= .14; return POLO(v, x, y); });
  P.ellipse(26, top + 4, 5, 4.5, (x, y, dx, dy) => POLO(.7 - dy * .2, x, y)); P.ellipse(44, top + 4, 5, 4.5, (x, y, dx, dy) => POLO(.5 - dy * .2, x, y));
  P.rect(21, top + 30, 28, 3, C.black(.45, 0, 0)); P.rect(33, top + 30, 5, 3, C.gold(.75, 0, 0)); P.set(34, top + 31, C.gold(.3, 0, 0));
  // collar, placket and buttons
  P.poly([[28, top - 1], [35, top - 1], [33, top + 5]], (x, y) => y > top + 2 ? [214, 214, 206] : WH); P.poly([[35, top - 1], [43, top - 1], [38, top + 5]], (x, y) => y > top + 2 ? [200, 200, 194] : [236, 236, 230]);
  P.rect(34, top + 2, 3, 9, POLO(.38, 0, 0)); P.set(35, top + 5, WH); P.set(35, top + 8, WH);
  // lanyard and the badge (a photo, a name line, a blue band)
  limb(P, [[30, top + 1], [33, top + 16]], .9, LANY, .6); limb(P, [[41, top + 1], [38, top + 16]], .9, LANY, .4);
  P.rect(31, top + 16, 10, 12, [244, 246, 250]); P.rect(31, top + 16, 10, 3, LANY(.55, 0, 0)); P.rect(32, top + 20, 3, 5, C.skin(.55, 0, 0)); P.rect(32, top + 20, 3, 1, C.hair(.4, 0, 0));
  P.rect(36, top + 21, 4, 1, C.grey(.5, 0, 0)); P.rect(36, top + 23, 3, 1, C.grey(.6, 0, 0)); P.rect(31, top + 27, 10, 1, [190, 196, 210]); E.rect(31, top + 16, 10, 3, [10, 20, 50]);
  heroHeadHD(P, E, hx, hy, p);
  arm(A[1], .62, true);
}
const HERO2_T = {
  stand: {}, blink: { blink: 1 }, smile: { face: 'smile' }, stare: { face: 'stare' }, worry: { face: 'worry' }, sweat: { face: 'sweat' },
  talk: { arm: 'talk', mouth: 1 }, talkS: { arm: 'talk', face: 'smile', mouth: 1 }, point: { arm: 'point', face: 'stare', mouth: 1 },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  s0: { step: 0, face: 'sweat' }, s1: { step: 1, bob: -1, face: 'sweat' }, s2: { step: 2, face: 'sweat' }, s3: { step: 3, bob: -1, face: 'sweat' },
};

// —— THE CUSTOMER: stout, a purple bell coat with a pink fur collar, a lilac bun, round sunglasses, red lips, a pink handbag ——
function drawCustomerHD(P, E, p) {
  const by = (p.bob || 0) * 2, st = p.step ?? -1, top = 36 + by, hx = 33, hy = 20 + by;
  // legs and pumps
  const feet = st < 0 ? [[27, 0], [38, 0]] : [[[22, 0], [42, -2]], [[29, -2], [35, 0]], [[42, -2], [22, 0]], [[35, 0], [29, -2]]][st];
  feet.forEach(([fx, ly], i) => {
    limb(P, [[i ? 37 : 29, top + 38], [fx + 1, 85 + ly]], 3.2, C.skin, i ? .52 : .4);
    P.ellipse(fx + 2, 88 + ly, 5, 2.6, (x, y, dx, dy) => C.purple(.32 - dy * .2 + (i ? .1 : 0), x, y)); P.rect(fx - 2, 88 + ly, 2, 3, C.purple(.12, 0, 0)); P.set(fx + 3, 87 + ly, C.purple(.75, 0, 0));
  });
  // the far arm with the handbag
  limb(P, [[22, top + 4], [17, top + 15], [15, top + 25]], 3.8, C.purple, .38);
  hand(P, 15, top + 28, .55);
  P.rect(5, top + 27, 14, 11, C.pink(.55, 0, 0)); P.rect(5, top + 27, 14, 2, C.pink(.82, 0, 0)); P.rect(5, top + 37, 14, 1, C.pink(.25, 0, 0));
  P.poly([[5, top + 29], [19, top + 29], [12, top + 33]], (x, y) => C.pink(.68, x, y)); P.rect(11, top + 32, 2, 2, C.gold(.85, 0, 0));
  for (let a = Math.PI; a <= 2 * Math.PI; a += .05) P.set(Math.round(12 + Math.cos(a) * 5), Math.round(top + 27 + Math.sin(a) * 5), C.gold(.7, 0, 0));
  // the coat: a bell from the shoulders to the knees, a centre seam, three gold buttons, pockets
  P.poly([[20, top], [47, top], [55, top + 40], [12, top + 40]], (x, y) => { let v = .74 - (x - 12) / 43 * .46; if (y >= top + 38) v -= .22; if (x === 34) v -= .16; if ((x === 19 || x === 49) && y > top + 22) v -= .12; return C.purple(v, x, y); });
  for (const y of [top + 9, top + 18, top + 27]) { P.rect(35, y, 2, 2, C.gold(.85, 0, 0)); P.set(36, y + 1, C.gold(.4, 0, 0)); }
  P.rect(40, top + 26, 8, 1, C.purple(.25, 0, 0)); P.rect(18, top + 26, 7, 1, C.purple(.35, 0, 0));
  // the fur collar: a lumpy pink roll
  for (let x = 17; x <= 50; x++) { const h = 3 + ((x * 7) % 3); for (let y = top - 2; y < top - 2 + h + 2; y++) P.set(x, y, C.pink(.85 - (y - top + 2) * .1 + ((x + y) % 4 === 0 ? .1 : 0), x, y)); }
  // head
  P.ellipse(hx, hy, 11.4, 12, (x, y, dx, dy) => C.skin(.58 - dx * .1 - dy * .2, x, y));
  P.ellipse(hx + 2, hy + 6, 9, 6.5, (x, y, dx, dy) => C.skin(.58 - dy * .18 - dx * .05, x, y));   // round cheeks and chin
  // hair: swept back under a tall lilac bun, curls at the nape
  ellC(P, hx - 3, hy - 6, 12, 7.5, (x, y, dx, dy) => (y <= hy - 3 || x <= hx - 8) ? C.lilac(.72 - dy * .3 + ((x + 2 * y) % 5 === 0 ? .12 : 0), x, y) : null);
  P.ellipse(hx - 6, hy - 16, 7, 6, (x, y, dx, dy) => C.lilac(.78 - dy * .3 - dx * .1 + ((x * y) % 7 === 0 ? .1 : 0), x, y));
  for (let a = 0; a < 6.28; a += .3) P.set(Math.round(hx - 6 + Math.cos(a) * 3.5), Math.round(hy - 16 + Math.sin(a) * 3), C.lilac(.4, 0, 0));   // the bun's coil
  for (const [x, y] of [[hx - 11, hy + 2], [hx - 10, hy + 5], [hx - 12, hy + 6]]) P.ellipse(x, y, 1.8, 1.8, (X, Y, dx, dy) => C.lilac(.6 - dy * .3, X, Y));
  P.rect(hx - 1, hy - 9, 9, 1, C.lilac(.95, 0, 0));
  P.ellipse(hx - 5, hy + 7, 1.4, 1.4, [250, 246, 236]);   // a pearl earring
  // round sunglasses: two black lenses, a gold bridge, a white glint and a purple reflection
  for (const [x, r] of [[hx + 6, 4.2], [hx - 2, 3.6]]) {
    P.ellipse(x, hy + 1, r, 3.8, INK); P.set(x - 2, hy - 1, WH); P.set(x - 1, hy - 1, [200, 200, 230]); P.rect(x - 1, hy + 2, 3, 1, [70, 50, 110]); E.set(x - 2, hy - 1, [60, 60, 70]);
  }
  P.rect(hx + 1, hy, 2, 1, C.gold(.8, 0, 0)); P.rect(hx - 7, hy, 2, 1, C.gold(.7, 0, 0));
  P.rect(hx + 11, hy + 2, 2, 4, C.skin(.68, 0, 0)); P.set(hx + 11, hy + 6, C.skin(.38, 0, 0));   // nose
  P.rect(hx + 1, hy + 6, 3, 1, BLUSH);
  // the mouth: pursed red lips (smug: a sideways smirk; talk: open)
  const mx = hx + 5, my = hy + 9;
  if (p.mouth) { P.rect(mx - 1, my - 1, 4, 4, [180, 34, 56]); P.rect(mx, my, 2, 2, MOUTH); }
  else if (p.smug) { P.rect(mx - 1, my, 4, 1, [176, 36, 58]); P.set(mx + 3, my - 1, [176, 36, 58]); }
  else { P.rect(mx - 1, my, 3, 2, [176, 36, 58]); P.set(mx, my, [226, 104, 118]); }
  // the near arm
  const near = p.arm === 'demand' ? [[45, top + 4], [50, top - 6], [53, top - 16]] : [[45, top + 4], [50, top + 15], [52, top + 25]];
  limb(P, near, 3.8, C.purple, .6); P.ellipse(near[2][0], near[2][1], 3.6, 2, C.pink(.8, 0, 0));   // a pink cuff
  if (p.arm === 'demand') hand(P, 53, top - 19, .62, { finger: [54, top - 27] }); else hand(P, 52, top + 28, .62);
}
const CUST2_T = {
  stand: {}, smug: { smug: 1 }, talk: { mouth: 1, arm: 'demand' }, demand: { arm: 'demand' }, talkDn: { mouth: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
};

const KINDS = {
  hero: { table: HERO2_T, draw: drawHeroHD, FW: 76, FH: 100, blob: .4 },
  cust: { table: CUST2_T, draw: drawCustomerHD, FW: 68, FH: 92, blob: .48 },
};
const _atl = {};
export function atlasHD(kind) { const K = KINDS[kind]; return _atl[kind] || (_atl[kind] = atlas(K.table, K.draw, K.FW, K.FH)); }
export function makeCharHD(kind, emI = 1.0, cap = 1.25) {
  const K = KINDS[kind], A = atlasHD(kind);
  const tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true;
  const mesh = billboard(tex, K.FW * SPX2, K.FH * SPX2, { em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${cap.toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
  mesh.material.customProgramCacheKey = () => 'spriteCap' + cap; mesh.material.needsUpdate = true;
  mesh.customDepthMaterial.map = tex; mesh.customDistanceMaterial.map = tex;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = 'hd-' + kind;
  let sh = null; if (K.blob) { sh = blob(K.blob, .45); sh.position.y = .015; root.add(sh); }
  return {
    root, mesh, atlas: A, H: K.FH * SPX2, W: K.FW * SPX2,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); tex.offset.x = em.offset.x = i / A.n; },
    sq: [1, 1], squash(k) { this.sq = [1 - k * .55, 1 + k]; return this; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.set((flip ? -1 : 1) * this.sq[0], this.sq[1], 1); this.sq = [1, 1]; },
  };
}
