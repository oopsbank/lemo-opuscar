// Pixel Life characters at three times the original resolution (a design test): the hero 114×150 (was 38×50) and the Customer
// 102×138 (was 34×46), a third of the pixel size in the world (1/81 m), so they stand exactly as tall. The extra pixels go to
// face shading, irises, lashes, fingers, fabric folds and texture, hair strands and accessories. Still hard pixels, no blur.
import * as THREE from 'three';
import { ramp, hex, billboard, blob } from './px.js';
import { atlas, COLS as C, INK } from './chars.js';

export const SPX3 = 1 / 81;
const BLUSH = hex('#e88a74'), LIP = [122, 52, 54], MOUTH = [66, 16, 26], TONGUE = [214, 86, 96], WH = [250, 250, 246], SCL = [236, 238, 242], SCL2 = [204, 208, 218];
const IRIS = ramp(['#2a1a10', '#5a3a20', '#8a5e34'], .3);
const POLO = ramp(['#143808', '#2a6212', '#469a1c', '#6cc22a', '#9ae24c', '#c8f478'], .22), KHAKI = ramp(['#3a3022', '#564a34', '#76664a', '#988664', '#b8a680'], .22);
const LANY = ramp(['#14306e', '#2456b4', '#3c78e0', '#78a8f4'], .22), RED = [176, 36, 58], RED2 = [140, 24, 44], RED3 = [226, 104, 118];

function ellC(P, cx, cy, rx, ry, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const c = f(x, y, dx, dy); if (c) P.set(x, y, c); } } }
function limb(P, pts, r, col, s = .6, tex) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0 - r); y <= y1 + r; y++) for (let x = Math.floor(x0 - r); x <= x1 + r; x++) {
    let best = 1e9, side = 0, along = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / L)), px = ax + u * dx - x - .5, py = ay + u * dy - y - .5, d = Math.hypot(px, py);
      if (d < best) { best = d; side = (px + py) / (d || 1); along = i + u; }
    }
    if (best <= r) P.set(x, y, col(s + side * .14 - (best / r) ** 2 * .2 + (tex ? tex(x, y, along) : 0), x, y));
  }
}
// a hand: palm, a thumb, three finger creases, a nail glint; 'open' spreads four short fingers along the arm's direction
function hand(P, x, y, s = .62, o = {}) {
  const dir = o.dir || [0, 1], [ux, uy] = dir, L = Math.hypot(ux, uy) || 1, nx = ux / L, ny = uy / L;
  ellC(P, x, y, 4.6, 4.3, (X, Y, dx, dy) => C.skin(s - dx * .1 - dy * .16, X, Y));
  if (o.open) for (let k = -1.5; k <= 1.5; k++) { const bx = x + nx * 3 - ny * k * 2.2, by = y + ny * 3 + nx * k * 2.2; limb(P, [[bx, by], [bx + nx * 4, by + ny * 4]], 1.1, C.skin, s); }
  else { for (let k = -1; k <= 1; k++) { const bx = Math.round(x + nx * 2.5 - ny * k * 2), by = Math.round(y + ny * 2.5 + nx * k * 2); P.set(bx, by, C.skin(s - .32, 0, 0)); P.set(Math.round(bx + nx), Math.round(by + ny), C.skin(s - .22, 0, 0)); } }
  const tx = o.flip ? -1 : 1; limb(P, [[x + tx * 3, y - 2], [x + tx * 5, y - 4]], 1.3, C.skin, s + .04);   // thumb
  if (o.finger) { const [fx, fy] = o.finger; limb(P, [[x, y], [fx, fy]], 1.2, C.skin, s); P.set(Math.round(fx), Math.round(fy), C.skin(s + .25, 0, 0)); }
}

// —— YOU: the recurring hero's head (3/4 view, facing right) ——
function heroHead3(P, E, hx, hy, p) {
  const f = p.face || 'n';
  P.rect(hx - 6, hy + 15, 12, 11, C.skin(.4, 0, 0)); P.rect(hx - 6, hy + 15, 12, 3, C.skin(.24, 0, 0)); P.rect(hx + 3, hy + 18, 3, 8, C.skin(.5, 0, 0));   // neck, chin shadow
  ellC(P, hx, hy, 16.5, 18, (x, y, dx, dy) => C.skin(.64 - dx * .12 - dy * .24 - (dx < -.6 ? .08 : 0), x, y));
  ellC(P, hx + 4.5, hy + 9, 12, 9, (x, y, dx, dy) => C.skin(.6 - dy * .3 - dx * .05, x, y));   // jaw and chin
  ellC(P, hx + 6, hy + 6, 4, 2.6, (x, y) => C.skin(.74, x, y));   // the lit cheek
  // hair: the crown and back with strand stripes, three fringe locks, a two-row shine, a few loose strands
  ellC(P, hx - 1.5, hy - 6, 17.7, 14.2, (x, y, dx, dy) => (y <= hy - 6 || x <= hx - 10) ? C.hair(.52 - dy * .26 + dx * .06 + (((x - (y >> 1)) & 3) === 0 ? -.14 : 0), x, y) : null);
  for (const tri of [[[hx - 5, hy - 8], [hx + 5, hy - 8], [hx, hy + 1]], [[hx + 3, hy - 9], [hx + 12, hy - 8], [hx + 8, hy - 1]], [[hx + 10, hy - 11], [hx + 19, hy - 6], [hx + 15, hy - 1]]])
    P.poly(tri, (x, y) => C.hair(.5 - (y - hy + 8) * .045 + (((x + y) & 3) === 0 ? -.1 : 0), x, y));
  for (let x = hx - 11; x <= hx + 5; x++) { const y = hy - 18 + Math.round(Math.abs(x - hx + 3) * .22); P.set(x, y, C.hair(.95, 0, 0)); if (x % 3) P.set(x, y + 1, C.hair(.78, 0, 0)); }
  for (const [x, y] of [[hx - 8, hy - 12], [hx - 3, hy - 14], [hx + 3, hy - 13], [hx - 12, hy - 4], [hx - 13, hy + 2]]) P.line(x, y, x + 3, y + 4, C.hair(.18, 0, 0));
  ellC(P, hx + 3, hy - 4, 12, 1.4, (x, y) => C.skin(.36, x, y));   // shadow under the fringe
  for (const tri of [[[hx - 5, hy - 8], [hx + 5, hy - 8], [hx, hy + 1]], [[hx + 3, hy - 9], [hx + 12, hy - 8], [hx + 8, hy - 1]]]) P.poly(tri, (x, y) => C.hair(.42 - (y - hy + 8) * .04, x, y));
  // nose
  P.rect(hx + 15, hy + 1, 3, 6, C.skin(.66, 0, 0)); P.rect(hx + 18, hy + 3, 1, 3, C.skin(.56, 0, 0)); P.set(hx + 16, hy + 2, C.skin(.86, 0, 0)); P.rect(hx + 13, hy + 7, 5, 1, C.skin(.34, 0, 0)); P.set(hx + 17, hy + 6, C.skin(.3, 0, 0));
  // eyes: near (right, 5 wide) and far (left, 4 wide)
  const ey = hy + 1;
  for (const [ex, w] of [[hx + 8, 5], [hx - 1, 4]]) {
    if (p.blink || f === 'smile') {
      if (f === 'smile' && !p.blink) { P.set(ex - 1, ey + 2, INK); P.set(ex, ey + 1, INK); P.rect(ex + 1, ey, w - 2, 1, INK); P.set(ex + w - 1, ey + 1, INK); P.set(ex + w, ey + 2, INK); }
      else { P.rect(ex - 1, ey + 1, w + 2, 1, INK); P.set(ex + w + 1, ey + 2, INK); P.rect(ex, ey + 2, w, 1, C.skin(.4, 0, 0)); }
      continue;
    }
    if (f === 'shock') {
      P.rect(ex - 2, ey - 3, w + 3, 8, SCL); P.rect(ex - 2, ey + 4, w + 3, 1, SCL2); P.rect(ex + w - 2, ey, 2, 2, INK);
      P.rect(ex - 2, ey - 4, w + 3, 1, INK); continue;
    }
    P.rect(ex - 1, ey - 2, w + 1, 6, SCL); P.rect(ex - 1, ey + 3, w + 1, 1, SCL2);   // the white, shaded under the lid
    P.rect(ex + w - 3, ey - 2, 3, 6, IRIS(.6, 0, 0)); P.rect(ex + w - 3, ey + 2, 3, 2, IRIS(.85, 0, 0));   // iris, lighter below
    P.rect(ex + w - 2, ey - 1, 2, 3, INK); P.set(ex + w - 3, ey - 2, WH); P.set(ex + w - 1, ey + 2, [180, 160, 140]);   // pupil, shine
    P.rect(ex - 1, ey - 3, w + 2, 1, INK); P.set(ex + w + 1, ey - 2, INK); P.set(ex + w + 1, ey - 4, INK);   // the lid and lashes
    P.rect(ex, ey + 4, w, 1, C.skin(.42, 0, 0));   // the lower lid
    if (f === 'stare') { P.rect(ex - 1, ey - 2, w + 1, 3, C.skin(.4, 0, 0)); P.rect(ex - 1, ey + 1, w + 2, 1, INK); }
  }
  const brow = (x0, w, dy0, dy1) => { for (let i = 0; i < w; i++) { const y = ey - 7 + Math.round(dy0 + (dy1 - dy0) * i / Math.max(1, w - 1)); P.set(x0 + i, y, C.hair(.06, 0, 0)); P.set(x0 + i, y - 1, C.hair(.24, 0, 0)); if (i > 0 && i < w - 1) P.set(x0 + i, y - 2, C.hair(.4, 0, 0)); } };
  if (f === 'shock') { brow(hx + 7, 7, -3, -3); brow(hx - 2, 5, -3, -3); }
  else if (f === 'worry' || f === 'sweat' || f === 'sad') { brow(hx + 7, 7, -2, 1); brow(hx - 2, 5, 1, -2); }
  else if (f === 'stare') { brow(hx + 7, 7, 1, 1); brow(hx - 2, 5, 1, 1); }
  else { brow(hx + 7, 7, 0, -1); brow(hx - 2, 5, -1, 0); }
  for (let i = 0; i < 6; i++) if (i % 2 === 0 || i === 3) P.set(hx + 3 + i, hy + 9, BLUSH); P.rect(hx + 4, hy + 10, 4, 1, BLUSH); P.set(hx + 14, hy + 9, BLUSH);
  // mouth
  const mx = hx + 8, my = hy + 13;
  if (f === 'shock') { ellC(P, mx + .5, my + 1.5, 2.6, 3.4, () => MOUTH); P.rect(mx - 1, my + 3, 3, 1, TONGUE); }
  else if (p.mouth && f === 'smile') { P.rect(mx - 3, my - 1, 8, 1, WH); P.rect(mx - 2, my, 6, 2, MOUTH); P.rect(mx - 1, my + 2, 4, 1, MOUTH); P.rect(mx, my + 1, 2, 1, TONGUE); P.set(mx - 4, my - 2, LIP); P.set(mx + 5, my - 2, LIP); }
  else if (p.mouth) { P.rect(mx - 2, my - 1, 6, 4, MOUTH); P.rect(mx - 2, my - 1, 6, 1, WH); P.rect(mx - 1, my + 2, 4, 1, TONGUE); P.rect(mx - 1, my + 3, 4, 1, LIP); }
  else if (f === 'smile') { P.set(mx - 3, my - 1, LIP); P.set(mx - 2, my, LIP); P.rect(mx - 1, my + 1, 4, 1, LIP); P.set(mx + 3, my, LIP); P.set(mx + 4, my - 1, LIP); }
  else if (f === 'sad' || f === 'sweat' || f === 'worry') { P.set(mx - 2, my + 2, LIP); P.set(mx - 1, my + 1, LIP); P.rect(mx, my, 3, 1, LIP); P.set(mx + 3, my + 1, LIP); }
  else if (f === 'stare') P.rect(mx - 2, my, 6, 1, LIP);
  else { P.rect(mx - 2, my, 5, 1, LIP); P.rect(mx - 1, my + 1, 3, 1, C.skin(.42, 0, 0)); }
  // the headset: a two-tone band over the crown, a padded cup with a lime light
  for (let a = -3.3; a <= -1.0; a += .015) for (const [r, v] of [[18.8, .62], [19.6, .5], [20.4, .32]]) P.set(Math.round(hx - 4.5 + Math.cos(a) * r), Math.round(hy + 1.5 + Math.sin(a) * r), C.black(v, 0, 0));
  ellC(P, hx - 10, hy + 3, 4.6, 5.6, (x, y, dx, dy) => C.grey(.45 - dx * .15 - dy * .2, x, y)); ellC(P, hx - 10, hy + 3, 2.6, 3.6, (x, y, dx, dy) => C.grey(.25 - dy * .1, x, y));
  P.rect(hx - 9, hy + 1, 2, 2, POLO(.85, 0, 0)); E.rect(hx - 9, hy + 1, 2, 2, [40, 90, 10]);
  if (f === 'sweat' || p.sweat) { ellC(P, hx - 3, hy - 9, 2.2, 3, (x, y, dx, dy) => [150 + dy * 30, 205 + dy * 20, 250]); P.set(hx - 3, hy - 13, [200, 235, 255]); P.set(hx - 4, hy - 10, WH); E.rect(hx - 5, hy - 12, 4, 6, [20, 40, 60]); }
}
function drawHero3(P, E, p) {
  const by = (p.bob || 0) * 3, top = 60 + by, hx = 51 + (p.lean || 0) * 3, hy = 33 + by, st = p.step ?? -1;
  const feet = st < 0 ? [[45, 0], [60, 0]] : [[[37, 0], [68, -3]], [[48, -3], [57, 0]], [[68, -3], [37, 0]], [[57, 0], [48, -3]]][st];
  feet.forEach(([fx, ly], i) => {
    const hip = [i ? 58 : 47, top + 49], ank = [fx, 136 + ly], kn = [(hip[0] + ank[0]) / 2 + 1, (hip[1] + ank[1]) / 2];
    limb(P, [hip, kn, ank], 6.3, KHAKI, i ? .55 : .42, (x, y) => (x === Math.round(kn[0]) - 1 ? .12 : 0));   // a pressed crease
    for (const d of [-2, 0, 2]) P.set(Math.round(kn[0]) + d, Math.round(kn[1]) + Math.abs(d) - 1, KHAKI(.22, 0, 0));   // knee fold
    ellC(P, fx + 3, 140 + ly, 9, 4.8, (x, y, dx, dy) => y > 143 + ly ? C.grey(.5, x, y) : C.shoe(.5 - dy * .32 + (i ? .1 : 0) + (dx > .5 && dy < 0 ? .2 : 0), x, y));
    P.rect(fx - 6, 144 + ly, 18, 2, C.grey(.32, 0, 0)); for (const k of [0, 2, 4]) P.rect(fx + 1 + k, 137 + ly + (k >> 1), 2, 1, C.grey(.85, 0, 0));
  });
  const sw = st < 0 ? 0 : [8, 0, -8, 0][st];
  const A = {
    n: [[[38, top + 6], [35 - sw, top + 24], [35 - sw, top + 40]], [[67, top + 6], [71 + sw, top + 24], [71 + sw, top + 40]]],
    talk: [[[38, top + 6], [35, top + 24], [35, top + 40]], [[67, top + 6], [77, top + 22], [87, top + 13]]],
    point: [[[38, top + 6], [35, top + 24], [35, top + 40]], [[67, top + 6], [80, top + 13], [93, top + 16]]],
    up: [[[38, top + 6], [29, top - 9], [26, top - 25]], [[67, top + 6], [76, top - 9], [79, top - 25]]],
  }[p.arm || 'n'];
  const arm = (pts, s, near) => {
    const [S, El, Wr] = pts, mid = [S[0] + (El[0] - S[0]) * .55, S[1] + (El[1] - S[1]) * .55];
    limb(P, [mid, El, Wr], 4.2, C.skin, s);
    P.set(Math.round(El[0]) - 1, Math.round(El[1]), C.skin(s - .3, 0, 0));   // elbow
    limb(P, [S, mid], 6.9, POLO, s, (x, y, a) => (a > .85 ? -.2 : 0) + (((x + 2 * y) % 7) === 0 ? -.08 : 0));   // the sleeve, a darker hem
    const dx = Wr[0] - El[0], dy = Wr[1] - El[1], L = Math.hypot(dx, dy) || 1;
    hand(P, Math.round(Wr[0] + dx / L * 4), Math.round(Wr[1] + dy / L * 4), s + .02, { dir: [dx, dy], open: p.arm === 'up' || (p.arm === 'talk' && near), finger: p.arm === 'point' && near ? [Wr[0] + 14, Wr[1] + 2] : null });
  };
  arm(A[0], .42, false);
  // the polo: knit texture (dither), side folds, a stitched hem
  P.poly([[36, top], [69, top], [73, top + 47], [32, top + 47]], (x, y) => {
    let v = .78 - (x - 32) / 41 * .46 + (((x + y) & 1) && ((x >> 1) + y) % 5 === 0 ? .06 : 0);
    if (y >= top + 43) v -= .14; if (y === top + 42 && x % 2) v += .1;
    if ((x === 41 || x === 42) && y > top + 26 && y < top + 40 && (y + x) % 3) v -= .14; if ((x === 64 || x === 63) && y > top + 22 && y < top + 38 && (y + x) % 3) v -= .14;
    if (y > top + 8 && y < top + 14 && x > 36 && x < 42 && x - 36 === y - top - 8) v -= .12;   // a crease from the armpit
    return POLO(v, x, y);
  });
  ellC(P, 39, top + 6, 7.5, 6.8, (x, y, dx, dy) => POLO(.72 - dy * .22, x, y)); ellC(P, 66, top + 6, 7.5, 6.8, (x, y, dx, dy) => POLO(.52 - dy * .22, x, y));
  P.rect(32, top + 45, 42, 5, C.black(.45, 0, 0)); P.rect(32, top + 45, 42, 1, C.black(.7, 0, 0)); for (const x of [36, 45, 62, 70]) P.rect(x, top + 44, 2, 6, C.black(.3, 0, 0));
  P.rect(49, top + 45, 8, 5, C.gold(.78, 0, 0)); P.rect(51, top + 46, 4, 3, C.black(.35, 0, 0)); P.set(49, top + 45, C.gold(.98, 0, 0));
  // collar, placket, buttons with holes
  P.poly([[41, top - 2], [53, top - 2], [49, top + 8]], (x, y) => y > top + 4 ? [212, 212, 204] : y === top - 2 ? [190, 190, 182] : WH);
  P.poly([[53, top - 2], [65, top - 2], [57, top + 8]], (x, y) => y > top + 4 ? [196, 196, 188] : [234, 234, 228]);
  P.line(41, top - 1, 49, top + 8, [170, 170, 162]); P.line(65, top - 1, 57, top + 8, [160, 160, 152]);
  P.rect(51, top + 3, 5, 14, POLO(.4, 0, 0)); P.rect(51, top + 3, 1, 14, POLO(.22, 0, 0));
  for (const y of [top + 7, top + 12]) { P.rect(52, y, 3, 3, WH); P.set(53, y + 1, [150, 150, 144]); }
  // lanyard with a clip, the badge (photo, name lines, a lime logo, a slot)
  limb(P, [[45, top + 1], [49, top + 24]], 1.4, LANY, .62); limb(P, [[62, top + 1], [57, top + 24]], 1.4, LANY, .4);
  P.rect(51, top + 22, 5, 3, C.grey(.8, 0, 0));
  P.rect(46, top + 24, 15, 19, [244, 246, 250]); P.rect(46, top + 24, 15, 5, LANY(.55, 0, 0)); P.rect(51, top + 25, 5, 1, LANY(.15, 0, 0));
  P.rect(48, top + 31, 5, 7, C.skin(.55, 0, 0)); P.rect(48, top + 31, 5, 2, C.hair(.4, 0, 0)); P.set(50, top + 34, INK);
  for (const [y, w] of [[31, 6], [34, 5], [37, 6]]) P.rect(54, top + y, w, 1, C.grey(.5, 0, 0));
  P.rect(54, top + 40, 2, 2, POLO(.7, 0, 0)); P.rect(46, top + 42, 15, 1, [186, 192, 206]); E.rect(46, top + 24, 15, 5, [10, 20, 50]);
  heroHead3(P, E, hx, hy, p);
  arm(A[1], .62, true);
}
const HERO3_T = {
  stand: {}, blink: { blink: 1 }, smile: { face: 'smile' }, stare: { face: 'stare' }, worry: { face: 'worry' }, sweat: { face: 'sweat' },
  talk: { arm: 'talk', mouth: 1 }, talkS: { arm: 'talk', face: 'smile', mouth: 1 }, point: { arm: 'point', face: 'stare', mouth: 1 },
  shock: { arm: 'up', face: 'shock' }, shock1: { arm: 'up', face: 'shock', bob: -1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  s0: { step: 0, face: 'sweat' }, s1: { step: 1, bob: -1, face: 'sweat' }, s2: { step: 2, face: 'sweat' }, s3: { step: 3, bob: -1, face: 'sweat' },
};

// —— THE CUSTOMER at 3× ——
function drawCustomer3(P, E, p) {
  const by = (p.bob || 0) * 3, st = p.step ?? -1, top = 54 + by, hx = 50, hy = 30 + by;
  const feet = st < 0 ? [[40, 0], [57, 0]] : [[[33, 0], [63, -3]], [[44, -3], [53, 0]], [[63, -3], [33, 0]], [[53, 0], [44, -3]]][st];
  feet.forEach(([fx, ly], i) => {
    limb(P, [[i ? 56 : 44, top + 57], [fx + 2, 128 + ly]], 4.8, C.skin, i ? .5 : .38);
    ellC(P, fx + 3, 132 + ly, 7.5, 3.9, (x, y, dx, dy) => C.purple(.34 - dy * .22 + (i ? .1 : 0) + (dx > .3 && dy < -.2 ? .3 : 0), x, y));
    P.rect(fx - 4, 132 + ly, 3, 5, C.purple(.12, 0, 0)); P.rect(fx + 2, 129 + ly, 3, 2, C.pink(.8, 0, 0));   // heel, a little bow
  });
  // the far arm and the handbag (stitched flap, gold clasp, handle)
  limb(P, [[33, top + 6], [26, top + 22], [23, top + 37]], 5.7, C.purple, .38, (x, y) => (((x + 2 * y) % 6) === 0 ? -.08 : 0));
  ellC(P, 23, top + 37, 5.4, 3, (x, y, dx, dy) => C.pink(.75 - dy * .2 + ((x + y) % 3 === 0 ? .1 : 0), x, y)); hand(P, 23, top + 42, .55);
  P.rect(7, top + 40, 22, 17, C.pink(.55, 0, 0)); P.rect(7, top + 40, 22, 2, C.pink(.85, 0, 0)); P.rect(7, top + 55, 22, 2, C.pink(.22, 0, 0)); P.rect(27, top + 42, 2, 13, C.pink(.38, 0, 0));
  P.poly([[7, top + 42], [29, top + 42], [18, top + 49]], (x, y) => C.pink(.7 - (y - top - 42) * .03, x, y));
  for (let x = 9; x < 28; x += 2) P.set(x, top + 43, C.pink(.95, 0, 0));
  P.rect(17, top + 48, 3, 3, C.gold(.85, 0, 0)); P.set(17, top + 48, C.gold(1, 0, 0));
  for (let a = Math.PI; a <= 2 * Math.PI; a += .03) { P.set(Math.round(18 + Math.cos(a) * 7.5), Math.round(top + 40 + Math.sin(a) * 7.5), C.gold(.72, 0, 0)); P.set(Math.round(18 + Math.cos(a) * 8.4), Math.round(top + 40 + Math.sin(a) * 8.4), C.gold(.45, 0, 0)); }
  // the coat: a quilted bell, a centre seam, folds, three gold buttons, pocket flaps
  P.poly([[30, top], [71, top], [83, top + 60], [18, top + 60]], (x, y) => {
    let v = .76 - (x - 18) / 65 * .46 + ((((x + y) % 7) === 0 || ((x - y + 140) % 7) === 0) ? .07 : 0);
    if (y >= top + 57) v -= .22; if (x === 51 || x === 52) v -= .16;
    if ((x === 30 || x === 31) && y > top + 34 && (x + y) % 3) v -= .12; if ((x === 72 || x === 73) && y > top + 30 && (x + y) % 3) v -= .12;
    return C.purple(v, x, y);
  });
  for (const y of [top + 13, top + 27, top + 41]) { P.rect(53, y, 4, 4, C.gold(.82, 0, 0)); P.set(53, y, C.gold(1, 0, 0)); P.rect(55, y + 2, 2, 2, C.gold(.4, 0, 0)); }
  P.rect(60, top + 39, 13, 2, C.purple(.25, 0, 0)); P.rect(60, top + 41, 13, 1, C.purple(.55, 0, 0)); P.rect(26, top + 39, 11, 2, C.purple(.35, 0, 0));
  // the fur collar: lumpy tufts
  for (let x = 25; x <= 76; x++) { const h = 5 + ((x * 7) % 4); for (let y = top - 4; y < top - 4 + h + 3; y++) P.set(x, y, C.pink(.88 - (y - top + 4) * .07 + ((x + y) % 4 === 0 ? .12 : 0) - ((x * 3 + y) % 7 === 0 ? .15 : 0), x, y)); }
  // head
  ellC(P, hx, hy, 17, 18, (x, y, dx, dy) => C.skin(.58 - dx * .1 - dy * .2, x, y));
  ellC(P, hx + 3, hy + 9, 13.5, 9.75, (x, y, dx, dy) => C.skin(.56 - dy * .2 - dx * .05, x, y));
  ellC(P, hx + 8, hy + 9, 4, 2.4, (x, y) => C.skin(.68, x, y));
  // hair: a waved sweep under a tall coiled bun, a gold pin, nape curls
  ellC(P, hx - 4.5, hy - 9, 18, 11.25, (x, y, dx, dy) => (y <= hy - 5 || x <= hx - 12) ? C.lilac(.72 - dy * .3 + (((x + 2 * y) % 6) < 1 ? -.16 : 0) + (((x + 2 * y) % 6) === 3 ? .1 : 0), x, y) : null);
  ellC(P, hx - 9, hy - 24, 10.5, 9, (x, y, dx, dy) => C.lilac(.8 - dy * .3 - dx * .1, x, y));
  for (const [r, v] of [[6.5, .38], [3.4, .42]]) for (let a = 0; a < 6.28; a += .06) P.set(Math.round(hx - 9 + Math.cos(a) * r), Math.round(hy - 24 + Math.sin(a) * r * .85), C.lilac(v, 0, 0));
  P.line(hx - 2, hy - 30, hx + 4, hy - 20, C.gold(.8, 0, 0)); P.set(hx - 2, hy - 30, C.gold(1, 0, 0));
  for (const [x, y] of [[hx - 17, hy + 3], [hx - 15, hy + 8], [hx - 18, hy + 9]]) { ellC(P, x, y, 2.8, 2.8, (X, Y, dx, dy) => C.lilac(.62 - dy * .3, X, Y)); P.set(x, y, C.lilac(.3, 0, 0)); }
  P.rect(hx - 2, hy - 14, 14, 1, C.lilac(.95, 0, 0));
  ellC(P, hx - 8, hy + 11, 2.2, 2.2, (x, y, dx, dy) => [246 - dy * 30, 242 - dy * 30, 232 - dy * 30]); P.set(hx - 9, hy + 10, WH);
  // brows over the glasses (arched: unimpressed)
  for (let i = 0; i < 9; i++) P.set(hx + 5 + i, hy - 6 - Math.round(Math.sin(i / 8 * Math.PI) * 2), C.lilac(.25, 0, 0));
  for (let i = 0; i < 6; i++) P.set(hx - 6 + i, hy - 6 - Math.round(Math.sin(i / 5 * Math.PI) * 1.5), C.lilac(.3, 0, 0));
  // round sunglasses: gold rims, black lenses, a glint and a streak, a purple reflection
  for (const [x, r] of [[hx + 9, 6.3], [hx - 3, 5.2]]) {
    ellC(P, x, hy + 1.5, r + 1, 6.7, () => C.gold(.6, 0, 0)); ellC(P, x, hy + 1.5, r, 5.7, (X, Y, dx, dy) => dy > .3 ? [46, 30, 74] : INK);
    P.rect(x - 3, hy - 2, 2, 2, WH); P.line(x - 1, hy + 4, x + 2, hy + 1, [120, 110, 160]); E.rect(x - 3, hy - 2, 2, 2, [70, 70, 80]);
  }
  P.rect(hx + 1, hy, 3, 2, C.gold(.8, 0, 0)); P.rect(hx - 12, hy, 4, 1, C.gold(.6, 0, 0));
  P.rect(hx + 16, hy + 4, 3, 6, C.skin(.66, 0, 0)); P.set(hx + 17, hy + 5, C.skin(.85, 0, 0)); P.rect(hx + 14, hy + 10, 4, 1, C.skin(.36, 0, 0));
  for (let i = 0; i < 6; i++) if (i % 2 === 0) P.set(hx + 2 + i, hy + 10, BLUSH); P.rect(hx + 3, hy + 11, 4, 1, BLUSH);
  // lips
  const mx = hx + 8, my = hy + 14;
  if (p.mouth) { ellC(P, mx + .5, my + 1, 3.4, 3.6, () => RED); ellC(P, mx + .5, my + 1.4, 2, 2.2, () => MOUTH); P.set(mx, my + 3, TONGUE); P.set(mx - 1, my - 2, RED3); }
  else if (p.smug) { P.rect(mx - 2, my, 7, 1, RED2); P.rect(mx - 2, my + 1, 6, 2, RED); P.set(mx + 5, my - 1, RED2); P.set(mx + 5, my, RED); P.set(mx, my + 1, RED3); }
  else { P.rect(mx - 1, my, 5, 1, RED2); P.rect(mx - 1, my + 1, 5, 2, RED); P.set(mx, my + 1, RED3); }
  // the near arm: a pink fur cuff, a gold bracelet, a ring
  const near = p.arm === 'demand' ? [[68, top + 6], [75, top - 9], [80, top - 24]] : [[68, top + 6], [75, top + 22], [78, top + 37]];
  limb(P, near, 5.7, C.purple, .6, (x, y) => (((x + 2 * y) % 6) === 0 ? -.08 : 0));
  ellC(P, near[2][0], near[2][1], 5.4, 3, (x, y, dx, dy) => C.pink(.82 - dy * .2 + ((x + y) % 3 === 0 ? .1 : 0), x, y));
  if (p.arm === 'demand') { P.rect(78, top - 28, 5, 1, C.gold(.85, 0, 0)); hand(P, 80, top - 31, .62, { finger: [81, top - 42], dir: [0, -1] }); P.rect(80, top - 36, 2, 1, C.gold(.9, 0, 0)); }
  else { P.rect(76, top + 39, 5, 1, C.gold(.85, 0, 0)); hand(P, 78, top + 43, .62, { dir: [0, 1] }); }
}
const CUST3_T = {
  stand: {}, smug: { smug: 1 }, talk: { mouth: 1, arm: 'demand' }, demand: { arm: 'demand' }, talkDn: { mouth: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
};

const KINDS = {
  hero: { table: HERO3_T, draw: drawHero3, FW: 114, FH: 150, blob: .4 },
  cust: { table: CUST3_T, draw: drawCustomer3, FW: 102, FH: 138, blob: .48 },
};
const _atl = {};
export function atlas3(kind) { const K = KINDS[kind]; return _atl[kind] || (_atl[kind] = atlas(K.table, K.draw, K.FW, K.FH)); }
export function makeChar3(kind, emI = 1.0, cap = 1.25) {
  const K = KINDS[kind], A = atlas3(kind);
  const tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true;
  const mesh = billboard(tex, K.FW * SPX3, K.FH * SPX3, { em, emCol: '#ffffff', emI });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${cap.toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
  mesh.material.customProgramCacheKey = () => 'spriteCap' + cap; mesh.material.needsUpdate = true;
  mesh.customDepthMaterial.map = tex; mesh.customDistanceMaterial.map = tex;
  const root = new THREE.Group(); root.add(mesh); root.userData.char = '3x-' + kind;
  let sh = null; if (K.blob) { sh = blob(K.blob, .45); sh.position.y = .015; root.add(sh); }
  return {
    root, mesh, atlas: A, H: K.FH * SPX3, W: K.FW * SPX3,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); tex.offset.x = em.offset.x = i / A.n; },
    sq: [1, 1], squash(k) { this.sq = [1 - k * .55, 1 + k]; return this; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.set((flip ? -1 : 1) * this.sq[0], this.sq[1], 1); this.sq = [1, 1]; },
  };
}
