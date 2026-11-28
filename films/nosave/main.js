// NO SAVE FILE — a 75 s vertical pixel-art short (16-bit RPG grammar): a rich old man has 60 seconds left; TIME rewinds his life,
// and every time he picks gold over a person, that person turns to gold. One indexed framebuffer; colour = love (loveLut).
import { W, H, T, FB, layer, LUT, darkLut, lutMap, whiteLut, loveLut, makeOut, bayer, hash, clamp, lerp, ss, seg } from './px.js';
import { text, textW, wrap, charCount, LINE_H } from './font.js';

const TL = await fetch('timeline.json').then(r => r.json()), TT = TL.t, DUR = TL.dur, LV = TL.levels.map(l => l.a), CZ = TL.clockZero;
const fb = new FB(), out = makeOut(document.getElementById('out'));
const step = (t, f) => Math.floor(t * f), ease = x => x * x * (3 - 2 * x), eo = x => 1 - (1 - x) * (1 - x);
// palette names
const K = { c0: 0, c1: 1, c2: 2, c3: 3, c4: 4, c5: 5, c6: 6, c7: 7, c8: 8, c9: 9, sk1: 10, sk2: 11, sk3: 12, sk4: 13, hb1: 14, hb2: 15, hb3: 16, hw1: 17, hw2: 18,
  g1: 19, g2: 20, g3: 21, g4: 22, sky1: 23, sky2: 24, sky3: 25, sky4: 26, or1: 27, or2: 28, or3: 29, or4: 30, ne1: 31, ne2: 32, ne3: 33, ne4: 34, cy1: 35, cy2: 36, cy3: 37,
  nv1: 38, nv2: 39, nv3: 40, rd1: 41, rd2: 42, rd3: 43, wd1: 44, wd2: 45, wd3: 46, au1: 47, au2: 48, au3: 49, au4: 50, au5: 51, cr1: 52, cr2: 53, cr3: 54, wh: 55, sd1: 56, sd2: 57, pk1: 58, pk2: 59, mon: 60 };
const S3 = (nx, ny, c) => { const v = -(nx * .7 + ny * .7); return v > .45 ? c[2] : v < -.45 ? c[0] : c[1]; };
const SKIN = [K.sk1, K.sk2, K.sk3], OLDSKIN = [K.sk1, K.sk2, K.c8];
const SCENE = [45, 198];   // the game view band (14–62 %)
const COLD = i => [K.c1, K.c2, K.c3, K.c4, K.c5, K.c6, K.c7, K.c8, K.c9];

// ———————————————— text helpers ————————————————
function big(s, cx, y, sc, col, outline = K.c0) {   // scaled pixel text, centred, with an outline
  const L = new FB(W, 24); L.d.fill(T); text(L, s, 0, 0, K.wh); const w = textW(s), x0 = Math.round(cx - w * sc / 2);
  const put = (dx, dy, c) => { for (let yy = 0; yy < 24; yy++) for (let xx = 0; xx < w; xx++) if (L.d[yy * W + xx] !== T) fb.rect(x0 + xx * sc + dx, y + yy * sc + dy, sc, sc, typeof c === 'function' ? c(yy) : c); };
  if (outline !== null) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1], [0, 2], [1, 2], [-1, 2]]) put(dx, dy, outline);
  put(0, 0, col);
}
function win(x, y, w, h, border, fill) { fb.rect(x + 1, y, w - 2, h, K.c0); fb.rect(x, y + 1, w, h - 2, K.c0); fb.rect(x + 2, y + 1, w - 4, 1, border); fb.rect(x + 2, y + h - 2, w - 4, 1, border); fb.rect(x + 1, y + 2, 1, h - 4, border); fb.rect(x + w - 2, y + 2, 1, h - 4, border); fb.rect(x + 2, y + 2, w - 4, h - 4, fill); }
function tag(x, y, who, col) { const w = textW(who) + 10; fb.rect(x, y, w, 14, K.c0); fb.rect(x + 1, y + 1, w - 2, 12, col); fb.rect(x + 2, y + 2, w - 4, 10, K.c0); text(fb, who, x + 5, y - 3, col); }
// the RPG dialog box (navy, white frame); TIME's box is black with a red frame; TIP has a gold frame
function box(b, t) {
  const st = b.style || 'npc', lines = wrap(b.text, 150), h = Math.max(34, lines.length * LINE_H + 12), Y = 204;
  const border = st === 'time' ? K.cr2 : st === 'tip' ? K.au4 : K.wh, fill = st === 'time' ? K.c0 : K.nv1;
  win(5, Y, 170, h, border, fill); if (b.who) tag(10, Y - 11, b.who, border);
  let n = Math.floor(Math.max(0, t - b.a) * b.cps); if (b.cutAt && t >= b.cutAt) n = Math.floor((b.cutAt - b.a) * b.cps);
  let used = 0; lines.forEach((ln, i) => { text(fb, ln, 12, Y + 4 + i * LINE_H - 2, st === 'tip' ? K.au4 : K.wh, K.nv2, Math.max(0, n - used)); used += charCount(ln) + 1; });
  if (n >= charCount(b.text) && step(t, 3) % 2 === 0) { fb.rect(163, Y + h - 9, 5, 1, K.wh); fb.rect(164, Y + h - 8, 3, 1, K.wh); fb.px(165, Y + h - 7, K.wh); }
}
// a choice menu with the ▶ cursor (it can move by itself)
function menu(m, t) {
  const h = m.opts.length * LINE_H + 10, Y = 204; win(5, Y, 170, h, K.wh, K.nv1);
  let cur = 0; m.move.forEach((mv, i) => { if (t >= mv) cur = m.auto ? (i % 2 === 0 ? 1 : 0) : 1; }); if (t >= m.confirm) cur = m.pick;
  m.opts.forEach((o, i) => text(fb, o, 22, Y + 3 + i * LINE_H, i === cur && t >= m.confirm && step(t, 8) % 2 ? K.au4 : K.wh, K.nv2));
  const jit = m.auto && t >= m.move[0] && t < m.confirm ? (step(t, 16) % 2) : 0;
  text(fb, '▶', 11 + jit, Y + 3 + cur * LINE_H, K.wh);
}
function card(s, t, a, glitch = false) {   // the level card sliding in
  const u = seg(t, a, a + .25), out = seg(t, a + 1.8, a + 2.05); if (u <= 0 || out >= 1) return;
  const x = Math.round(lerp(-120, 90, eo(u)) + out * 220), y = 56;
  if (glitch) { big(s, x - 2, y, 2, K.cr2, null); big(s, x + 2, y, 2, K.cy3, null); }
  big(s, x + (glitch ? (hash(step(t, 12)) - .5) * 8 : 0), y, 2, y2 => y2 < 3 ? K.au5 : y2 < 5 ? K.au4 : K.au3, K.wd1);
}
function plusG(s, t, a, x = 140, y = 70) { const u = seg(t, a, a + 1.3); if (u <= 0 || u >= 1) return; big(s, x, Math.round(y - u * 14), 1, K.au4, K.au1); }

// ———————————————— HUD ————————————————
const heartsAt = t => { if (t < TT.rewind) return 0; if (t < TT.lv1) return Math.min(4, Math.floor((t - TT.rewind) / .3)); let h = 4; if (t >= TT.heart5) h = 5; for (const b of [TT.break1, TT.break2, TT.break3, TT.break4, TT.break5]) if (t >= b) h--; return Math.max(0, h); };
const goldAt = t => { if (t < TT.rewind) return 999999; if (t < TT.lv1) return Math.round(999999 * (1 - ease(seg(t, TT.rewind, TT.lv1 - .1)))); if (t >= TT.montage) return Math.round(lerp(555100, 999999, ease(seg(t, TT.montage, TT.achievement)))); let g = 0; if (t >= TT.plus100 + .9) g = 100; if (t >= TT.plus5k) g = 5100; if (t >= TT.plus50k) g = 55100; if (t >= TT.plus500k) g = 555100; return g; };
const timeLeft = t => Math.max(0, Math.ceil(60 * (1 - seg(t, TL.clockStart, CZ)) - 1e-6));   // 60 game-seconds from clockStart to the cut line
function heart(x, y, state, t, breakT) {   // full / empty / breaking / half
  const P = ['..##.##..', '.#######.', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
  const broken = breakT !== null && t >= breakT, k = broken ? seg(t, breakT, breakT + .45) : 0;
  P.forEach((r, j) => { for (let i = 0; i < 9; i++) if (r[i] === '#') {
    let c = state === 'full' ? (j < 2 && i < 4 ? K.pk2 : K.pk1) : state === 'half' ? (i < 5 ? (j < 2 && i < 4 ? K.pk2 : K.pk1) : K.c4) : K.c4;
    if (state === 'empty') { const edge = j === 0 || j === 7 || i === 0 || i === 8 || r[i - 1] !== '#' || r[i + 1] !== '#' || (P[j + 1] && P[j + 1][i] !== '#') || (P[j - 1] && P[j - 1][i] !== '#'); if (!edge) continue; }
    if (broken && k < 1) { const side = i < 4 ? -1 : 1; fb.px(x + i + side * k * 6, y + j + k * k * 10, c); if (i === 4 || (j + i) % 5 === 0) fb.px(x + 4, y + j, K.c0); }
    else fb.px(x + i, y + j, c);
  } });
}
function hud(t) {
  fb.rect(0, 0, W, 45, K.c0); fb.rect(0, 44, W, 1, K.c3);
  const tl = timeLeft(t), s = `00:${String(tl).padStart(2, '0')}`.replace('00:60', '01:00');
  text(fb, 'TIME LEFT', 90 - textW('TIME LEFT') / 2, -3, K.wh);
  const blink = tl <= 5 && step(t, 4) % 2; big(s, 90, 12, 2, blink ? K.cr3 : K.cr2, K.cr1);
  text(fb, 'LOVE', 4, -3, K.wh); const h = heartsAt(t), breaks = [TT.break1, TT.break2, TT.break3, TT.break4, TT.break5];
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 10, y = 16;
    if (t >= TT.pickup + .4 && t < TT.zero + .2 && i === 0) { heart(x, y, 'half', t, null); continue; }
    const idx = 4 - i, bk = breaks.findIndex((b, j) => 4 - j === idx);   // hearts break right to left
    if (i < h) heart(x, y, 'full', t, null); else if (bk >= 0 && t >= breaks[bk] && t < breaks[bk] + .45 && t >= TT.heart5) heart(x, y, 'full', t, breaks[bk]); else heart(x, y, 'empty', t, null);
  }
  const g = goldAt(t); text(fb, 'GOLD', 176 - textW('GOLD'), -3, K.wh);
  fb.ell(124, 20, 4, 4, (nx, ny) => nx + ny < -.4 ? K.au5 : nx + ny > .5 ? K.au2 : K.au4);
  const gs = g.toLocaleString('en-US'); text(fb, gs, 176 - textW(gs), 11, K.au4);
  if (g >= 999999 && step(t, 3) % 2) text(fb, 'MAX', 176 - textW('MAX'), 25, K.au5); else if (g >= 999999) text(fb, 'MAX', 176 - textW('MAX'), 25, K.au3);
}

// ———————————————— people ————————————————
// a side-view person; feet at (x, y), s = height in px; o: { skin, hair, style, top, legs, scarf, pose, face, dir, apron, grey, gone, age }
function person(t, x, y, s, o) {
  const L = layer(), u = s / 40, d = o.dir || 1, X = v => x + v * u * d, Y = v => y - v * u, cap = (pts, r, cols) => L.cap(pts.map(([a, b]) => [X(a), Y(b)]), r * u, cols);
  const top = o.top || [K.c4, K.c5, K.c6], legs = o.legs || [K.c2, K.c3, K.c4], hair = o.hair || [K.hb1, K.hb2, K.hb3], skin = o.skin || SKIN;
  const pose = o.pose || 'stand', bob = pose === 'jump' ? Math.abs(Math.sin(t * 8)) * 4 : pose === 'run' ? Math.abs(Math.sin(t * 12)) * 1.5 : 0;
  const B = v => Y(v + bob);
  // legs
  if (pose === 'sit') { cap([[-2, 14], [6, 14], [6, 2]], 2.2, legs); cap([[1, 14], [9, 14], [9, 2]], 2.2, legs); }
  else { const sw = pose === 'run' || pose === 'walk' ? Math.sin(t * (pose === 'run' ? 14 : 7)) * 4 : 0; L.cap([[X(-1), B(16)], [X(-1 - sw), Y(0)]], 2.4 * u, legs); L.cap([[X(2), B(16)], [X(2 + sw), Y(0)]], 2.4 * u, legs); }
  // torso
  L.poly([[X(-5), B(28)], [X(5), B(28)], [X(6), B(14)], [X(-6), B(14)]], (px, py) => { const v = (px - x) * d / (6 * u); return v > .5 ? top[0] : v < -.4 ? top[2] : top[1]; });
  if (o.apron) L.poly([[X(-4), B(24)], [X(4), B(24)], [X(5), B(12)], [X(-5), B(12)]], (px, py) => ((Math.floor(px / 2) + Math.floor(py / 2)) % 2) ? K.rd2 : K.c9);
  if (o.suit) { L.poly([[X(-1), B(28)], [X(1), B(28)], [X(0), B(22)]], K.c9); L.line(X(0), B(27), X(0), B(19), K.rd1); }
  // arms by pose
  const arm = (pts) => cap(pts, 1.9, top), hand = (a, b) => L.ell(X(a), B(b), 1.8 * u, 1.8 * u, (nx, ny) => S3(nx, ny, skin));
  if (pose === 'wave') { const w = Math.sin(t * 12) * 3; arm([[3, 27], [8, 32], [9 + w, 38]]); hand(9 + w, 39); arm([[-3, 27], [-4, 20], [-4, 15]]); }
  else if (pose === 'kite') { arm([[3, 27], [8, 33], [10, 38]]); hand(10, 39); arm([[-3, 27], [-4, 20], [-3, 15]]); }
  else if (pose === 'phone' || pose === 'flyer') { arm([[3, 27], [6, 21], [9, 22]]); hand(9, 22); arm([[-3, 27], [-4, 20], [-4, 15]]); if (pose === 'flyer') L.rect(X(8) - (d < 0 ? 6 * u : 0), B(26), 6 * u, 8 * u, K.c9); else L.rect(X(8), B(25), 2 * u, 4 * u, K.c1); }
  else if (pose === 'bow') { arm([[3, 27], [4, 20], [5, 15]]); arm([[-3, 27], [-3, 20], [-2, 15]]); }
  else if (pose === 'case') { arm([[3, 27], [6, 20], [8, 15]]); hand(8, 15); L.rect(X(7), B(14), 7 * u * d, 10 * u, K.c3); L.rect(X(7), B(14), 7 * u * d, 2 * u, K.c5); arm([[-3, 27], [-4, 20], [-4, 15]]); }
  else { arm([[3, 27], [4, 20], [4, 15]]); hand(4, 14); arm([[-3, 27], [-4, 20], [-4, 15]]); hand(-4, 14); }
  // head and hair
  const hy = 33 + (pose === 'bow' ? -3 : 0), hx = pose === 'bow' ? 3 : 0;
  L.ell(X(hx), B(hy), 5.6 * u, 6 * u, (nx, ny) => S3(nx, ny, skin));
  const st = o.style || 'short';
  if (st === 'pony') { L.ell(X(hx - 1), B(hy + 3), 6 * u, 4 * u, (nx, ny, px, py) => py < B(hy + 2) ? S3(nx, ny, hair) : null); cap([[hx - 5, hy + 2], [hx - 9, hy - 2], [hx - 8, hy - 7]], 1.8, hair); }
  else if (st === 'bowl') L.ell(X(hx - .5), B(hy + 2), 6.4 * u, 4.8 * u, (nx, ny, px, py) => py < B(hy) || (px - X(hx)) * d < -2 * u ? S3(nx, ny, hair) : null);
  else if (st === 'spiky') { L.ell(X(hx - 1), B(hy + 3), 6 * u, 4 * u, (nx, ny, px, py) => py < B(hy + 2) ? S3(nx, ny, hair) : null); for (const a of [-4, -1, 2]) L.poly([[X(hx + a - 1.5), B(hy + 5)], [X(hx + a + 1.5), B(hy + 5)], [X(hx + a + 1), B(hy + 10)]], hair[1]); }
  else if (st === 'long') { L.ell(X(hx - 1), B(hy + 2), 6.4 * u, 5 * u, (nx, ny, px, py) => py < B(hy + 1) || (px - X(hx)) * d < -1 * u ? S3(nx, ny, hair) : null); cap([[hx - 5, hy], [hx - 6, hy - 9]], 2.4, hair); }
  else if (st === 'white') L.ell(X(hx - 1), B(hy + 3), 6 * u, 3.6 * u, (nx, ny, px, py) => py < B(hy + 2) || (px - X(hx)) * d < -3 * u ? (ny < 0 ? K.hw2 : K.hw1) : null);
  else if (st === 'salt') L.ell(X(hx - 1), B(hy + 3), 6 * u, 3.8 * u, (nx, ny, px, py) => py < B(hy + 2) || (px - X(hx)) * d < -3 * u ? (bayer(px, py) < .5 ? K.hw1 : K.c5) : null);
  else L.ell(X(hx - 1), B(hy + 3), 6 * u, 4 * u, (nx, ny, px, py) => py < B(hy + 2) || (px - X(hx)) * d < -3 * u ? S3(nx, ny, hair) : null);
  L.px(X(hx + 2.5), B(hy + .5), K.c0); if (s > 34) L.px(X(hx + 2.5), B(hy + 1.2), K.c0);
  if (o.face === 'smile') { L.px(X(hx + 2), B(hy - 2.5), K.c1); L.px(X(hx + 3.5), B(hy - 2), K.c1); } else if (o.face === 'sad') L.px(X(hx + 2.5), B(hy - 3), K.c1); else L.px(X(hx + 3), B(hy - 2.5), K.c1);
  if (o.blush) L.px(X(hx + 1), B(hy - 1), K.rd3);
  if (o.scarf) { cap([[-3, 29], [4, 29]], 1.9, [K.cr1, K.cr2, K.cr3]); cap([[-3, 29], [-6, 24], [-8, 21]], 1.4, [K.cr1, K.cr2, K.cr3]); }
  if (o.star) { L.poly([[X(0), B(27)], [X(2), B(23)], [X(6), B(23)], [X(3), B(20)], [X(4), B(16)], [X(0), B(18)], [X(-4), B(16)], [X(-3), B(20)], [X(-6), B(23)], [X(-2), B(23)]], o.starOn === false ? K.c5 : K.au4); }
  if (o.extra) o.extra(L, X, B, u);
  L.outline(K.c0);
  // turning to grey from the feet up, then crumbling into gold dust
  const yTop = y - s * 1.05, yBot = y + 1;
  if (o.grey > 0) { const cut = yBot - (yBot - yTop) * o.grey; for (let py = Math.max(0, Math.floor(cut)); py <= yBot && py < H; py++) for (let px = 0; px < W; px++) { const c = L.d[py * W + px]; if (c === T || c === K.cr1 || c === K.cr2 || c === K.cr3) continue; const rgb = c; L.d[py * W + px] = [K.c2, K.c3, K.c4, K.c5, K.c6, K.c7][Math.min(5, (hash(c, 3) * 2 + (c % 6)) | 0)]; } }
  if (o.gone > 0) for (let i = 0; i < L.d.length; i++) if (L.d[i] !== T && hash(i, 7) < o.gone) L.d[i] = T;
  L.over(fb);
  return [x, yTop, yBot];
}
// gold dust: grains from a body's box spiral up into the GOLD counter
function dust(t, t0, bx, by0, by1, n = 70, dur = 1.3, tx = 150, ty = 18) {
  for (let i = 0; i < n; i++) {
    const delay = hash(i, 11) * .5, u = seg(t, t0 + delay, t0 + delay + dur); if (u <= 0 || u >= 1) continue;
    const sx = bx + (hash(i, 12) - .5) * 14, sy = lerp(by1, by0, hash(i, 13)), e = ease(u), r = (1 - e) * 16, a = u * 9 + i;
    fb.px(lerp(sx, tx, e) + Math.cos(a) * r, lerp(sy, ty, e) + Math.sin(a) * r * .6, [K.au3, K.au4, K.au5][i % 3]);
  }
}
// TIME: a tall thin shadow, no face, one white eye pixel, an hourglass of glowing pale-blue sand
function timeFig(x, y, h, o = {}) {
  const L = layer(), w = h * .14, sand = o.sand ?? .5, look = o.look ?? 0;
  L.poly([[x - w * .6, y - h * .84], [x + w * .6, y - h * .84], [x + w, y], [x - w, y]], K.c0);
  L.ell(x + look * 1.5, y - h * .9, w * .7, h * .08, K.c0);
  for (let yy = Math.round(y - h * .84); yy < y; yy++) L.px(Math.round(x + w * .6 + (yy - (y - h * .84)) / (h * .84) * w * .4), yy, K.c3);   // a 1-px rim of light
  if (o.eye !== false) L.px(Math.round(x + look * 2 + (o.eyeDx ?? 1)), Math.round(y - h * .91), K.wh);
  if (o.glass !== false) {   // the hourglass at its chest
    const gx = x + (o.glassDx ?? w * .4), gy = y - h * .58, gh = Math.max(6, h * .14), gw = gh * .55;
    L.rect(gx - gw - 1, gy - gh / 2 - 1, gw * 2 + 2, 1, K.wd2); L.rect(gx - gw - 1, gy + gh / 2, gw * 2 + 2, 1, K.wd2);
    for (let k = 0; k <= gh; k++) { const yy = gy - gh / 2 + k, half = Math.abs(k - gh / 2) / (gh / 2) * gw + .5, topHalf = k < gh / 2, filled = topHalf ? (k > gh / 2 * (1 - sand)) : (k > gh - gh / 2 * (1 - sand) * .999 ? true : k > gh * (.5 + sand * .5)); L.px(gx - half, yy, K.c6); L.px(gx + half, yy, K.c6); if ((topHalf && k / (gh / 2) > 1 - sand) || (!topHalf && (k - gh / 2) / (gh / 2) > sand)) for (let xx = -half + 1; xx < half; xx++) L.px(gx + xx, yy, bayer(gx + xx, yy) < .5 ? K.sd1 : K.sd2); }
    if (o.flow !== false) for (let k = 0; k < 3; k++) L.px(gx, gy - 1 + k, K.sd2);
    L.d.forEach((c, i) => {}); fb.ell(gx, gy, gh * 1.2, gh * 1.2, (nx, ny, px, py) => bayer(px, py) < .25 * (1 - nx * nx - ny * ny) ? K.sd1 : null);
  }
  if (o.rim) L.outline(K.c5);
  L.over(fb);
}

// ———————————————— scenes ————————————————
function hospital(t, o = {}) {
  const [y0, y1] = SCENE;
  fb.rect(0, y0, W, y1 - y0, (x, y) => y > y1 - 22 ? (bayer(x, y) < .3 ? K.c5 : K.c4) : bayer(x, y) < .25 ? K.c7 : K.c6);   // a pale wall, the floor
  fb.rect(0, y1 - 23, W, 2, K.c4);
  // the window: night rain, purple lightning
  fb.rect(94, y0 + 8, 74, 64, K.c4); const flash = o.lightning !== false && hash(step(t, 6), 9) < .07;
  fb.rect(97, y0 + 11, 68, 58, (x, y) => flash ? (bayer(x, y) < .5 ? K.ne4 : K.ne3) : bayer(x, y) < .15 ? K.c2 : K.c1);
  const up = o.rewind ? -1 : 1;
  for (let i = 0; i < 24; i++) { const x = 98 + (hash(i, 1) * 66 | 0), yy = y0 + 11 + (((hash(i, 2) * 80 + up * t * 120) % 58) + 58) % 58; fb.line(x, yy, x - 1, yy + 3, K.c6); }
  fb.rect(130, y0 + 11, 2, 58, K.c4); fb.rect(97, y0 + 40, 68, 2, K.c4);
  // the bed: a metal frame, white sheets; Leo at 70, white hair, gaunt; his hand on the blanket holding the red scarf
  const by = y1 - 40;
  fb.rect(10, by - 30, 6, 62, K.c3); fb.rect(10, by - 32, 10, 4, K.c3); fb.rect(150, by - 10, 5, 42, K.c3);
  fb.rect(14, by, 140, 10, K.c3); fb.rect(16, by + 10, 4, 22, K.c3); fb.rect(146, by + 10, 4, 22, K.c3);
  fb.rect(16, by - 10, 136, 12, (x, y) => y < by - 7 ? K.c9 : bayer(x, y) < .3 ? K.c8 : K.c9); fb.ell(34, by - 12, 18, 7, K.c9);
  fb.ell(38, by - 20, 10, 10, (nx, ny) => S3(nx, ny, OLDSKIN)); fb.ell(32, by - 24, 9, 6, (nx, ny) => ny < 0 ? K.hw2 : K.hw1);
  fb.px(45, by - 21, K.c0); fb.px(46, by - 21, K.c0); fb.rect(44, by - 15, 4, 1, K.c3); fb.rect(36, by - 16, 3, 3, K.c5);
  fb.cap([[66, by - 9], [82, by - 13]], 3, [K.c6, K.c7, K.c8]); fb.ell(86, by - 13, 3.4, 3, (nx, ny) => S3(nx, ny, OLDSKIN));
  fb.cap([[84, by - 15], [94, by - 12], [102, by - 9], [108, by - 10]], 2.4, [K.cr1, K.cr2, K.cr3]);
  if (o.phone) { fb.rect(46, by - 30, 6, 11, K.c0); fb.rect(47, by - 29, 4, 8, K.cy2); }
  if (o.gold) for (let i = 0; i < o.gold; i++) { const gx = 6 + (hash(i, 21) * 168 | 0), gy = y1 - 2 - (hash(i, 22) * hash(i, 23) * 20 | 0); fb.ell(gx, gy, 2.6, 1.6, (nx, ny) => ny < 0 ? K.au5 : K.au3); }
  // the heart monitor in the foreground, the IV stand and line
  fb.rect(150, y0 + 78, 28, 36, K.c1); fb.rect(152, y0 + 80, 24, 26, K.c0);
  for (let x = 0; x < 22; x++) { const ph = (x * 2 + (o.rewind ? -1 : 1) * t * 60) % 40, v = o.flat ? 0 : ph > 18 && ph < 22 ? (ph < 20 ? -7 : 5) : 0; fb.px(153 + x, y0 + 93 + v, K.mon); fb.px(153 + x, y0 + 94 + v, K.mon); }
  fb.rect(60, y0 + 2, 2, 70, K.c3); fb.rect(55, y0 + 2, 12, 14, K.c8); fb.rect(57, y0 + 6, 8, 8, K.c9); fb.line(61, y0 + 72, 70 + Math.sin(t * 2) * 2, by - 10, K.c4);
  if (o.time) timeFig(o.time.x, o.time.y ?? by + 32, o.time.h ?? 128, { sand: o.time.sand, look: o.time.look });
}
function lv1(t) {   // a sunny hill, kite, the town, TIME as a tiny dot on the far hill
  const [y0, y1] = SCENE, cam = (t - TT.lv1) * 6;
  fb.gradV(0, y0, W, 70, [K.sky2, K.sky2, K.sky3, K.sky4]);
  for (let i = 0; i < 4; i++) { const cx = ((i * 60 - cam * .2) % 240 + 240) % 240 - 30; fb.ell(cx, y0 + 14 + i * 5, 16, 5, K.c9); }
  for (let i = 0; i < 9; i++) { const hx = ((i * 24 - cam * .4) % 220 + 220) % 220 - 20, hh = 12 + (i % 3) * 5; fb.rect(hx, y0 + 70 - hh, 16, hh, K.c8); fb.poly([[hx - 2, y0 + 70 - hh], [hx + 18, y0 + 70 - hh], [hx + 8, y0 + 62 - hh]], K.rd2); fb.rect(hx + 11, y0 + 58 - hh, 3, 6, K.c6); const sm = (t * 6 + i * 3) % 10; fb.px(hx + 12 + sm * .4, y0 + 56 - hh - sm, K.c8); }
  fb.ell(150, y0 + 82, 70, 22, (nx, ny, x, y) => bayer(x, y) < .4 ? K.g2 : K.g3);
  timeFig(150, y0 + 61, 8, { glass: false, eyeDx: 0 }); if (step(t, 2) % 2) fb.px(150, y0 + 54, K.sd2);   // hidden #1
  fb.ell(70, y0 + 130, 130, 60, (nx, ny, x, y) => bayer(x, y) < .2 ? K.g4 : K.g3);
  fb.rect(0, y1 - 26, W, 26, (x, y) => bayer(x, y) < .3 ? K.g2 : K.g3);
  const kiteUp = ss(TT.scarf, TT.scarf + 1.2, t), kx = lerp(96, 120, kiteUp) + Math.sin(t * 3) * 2, ky = lerp(y0 + 90, y0 + 22, kiteUp);
  fb.poly([[kx, ky - 7], [kx + 5, ky], [kx, ky + 8], [kx - 5, ky]], (x, y) => x < kx ? K.rd2 : K.rd3); fb.line(kx, ky + 8, kx - 2, ky + 18, K.c8);
  const run = t >= TT.scarf + .3 ? 'run' : 'stand', momX = lerp(70, 86, ss(TT.scarf, TT.scarf + 2, t)), leoX = lerp(98, 106, ss(TT.scarf, TT.scarf + 2, t));
  fb.line(momX + 6, y1 - 22 - 16, kx, ky + 8, K.c9);
  person(t, momX, y1 - 6, 40, { style: 'pony', hair: [K.hb1, K.hb2, K.hb3], top: [K.or1, K.or2, K.or3], legs: [K.c3, K.c4, K.c5], apron: true, pose: t < TT.scarf ? 'kite' : run === 'run' ? 'kite' : 'kite', face: 'smile' });
  person(t, leoX, y1 - 6, 24, { style: 'bowl', hair: [K.hb2, K.hb3, K.hb3], top: [K.sky1, K.sky2, K.sky2], legs: [K.c3, K.c4, K.c5], pose: t < TT.scarf - .2 ? 'jump' : 'run', face: 'smile', blush: true, scarf: t >= TT.scarf + .2 });
  for (let i = 0; i < 18; i++) { const gx = ((i * 13 - cam * 1.6) % 200 + 200) % 200 - 10; fb.cap([[gx, y1], [gx + Math.sin(t * 3 + i) * 2, y1 - 10 - (i % 3) * 3]], 1, [K.g1, K.g2, K.g3]); if (i % 4 === 0) fb.ell(gx + Math.sin(t * 3 + i) * 2, y1 - 13 - (i % 3) * 3, 2, 2, K.c9); }
  for (let i = 0; i < 6; i++) { const px = ((i * 40 + t * 30) % 220) - 20, py = y0 + 30 + i * 18 + Math.sin(t * 2 + i) * 5; fb.px(px, py, K.c9); fb.px(px + 1, py, K.c8); }
  if (t >= TT.ecu1) {   // the ECU of his face: big, smiling, two white pixels in each eye
    const z = ss(TT.ecu1, TT.ecu1 + .3, t); if (z > 0) { fb.rect(0, y0, W, y1 - y0, (x, y) => bayer(x, y) < z ? K.sky3 : null);
      if (z >= 1) { fb.ell(90, y0 + 84, 50, 54, (nx, ny) => S3(nx, ny, SKIN)); fb.ell(84, y0 + 52, 54, 30, (nx, ny, x, y) => y < y0 + 60 ? S3(nx, ny, [K.hb1, K.hb2, K.hb3]) : null);
        for (const ex of [72, 108]) { fb.rect(ex - 5, y0 + 76, 10, 12, K.c0); fb.rect(ex - 3, y0 + 77, 2, 2, K.wh); fb.rect(ex + 1, y0 + 82, 2, 2, K.wh); }
        fb.rect(70, y0 + 104, 40, 4, K.c1); fb.rect(74, y0 + 108, 32, 3, K.rd2); fb.ell(60, y0 + 96, 8, 4, K.rd3); fb.ell(120, y0 + 96, 8, 4, K.rd3);
        fb.cap([[46, y0 + 140], [134, y0 + 140]], 8, [K.cr1, K.cr2, K.cr3]); } }
  }
}
function lv2(t) {   // school gate at sunset; Max waves; TIME under the lamp post across the street
  const [y0, y1] = SCENE;
  fb.gradV(0, y0, W, 80, [K.ne1, K.ne2, K.or2, K.or3]);
  fb.rect(0, y0 + 60, W, 30, K.c2); for (let i = 0; i < 8; i++) fb.rect(i * 24, y0 + 64, 18, 26, K.c3);
  const bus = ((t - LV[1]) * 70) % 400 - 120; fb.rect(bus, y0 + 70, 60, 20, K.au3 === 0 ? 0 : K.or1); fb.rect(bus + 4, y0 + 73, 50, 7, K.c7);
  fb.rect(150, y0 + 40, 2, 52, K.c1); fb.rect(146, y0 + 38, 10, 4, K.c1); fb.ell(151, y0 + 44, 10, 12, (nx, ny, x, y) => bayer(x, y) < .25 * (1 - nx * nx - ny * ny) ? K.or4 : null);
  timeFig(158, y0 + 92, 42, { sand: .7, eyeDx: -1 });   // hidden #2: as tall as a man, half in shadow
  fb.rect(0, y0 + 92, W, 4, K.c5); fb.rect(0, y0 + 96, W, y1 - y0 - 96, (x, y) => bayer(x, y) < .3 ? K.c4 : K.c3);
  fb.rect(6, y0 + 50, 6, 56, K.wd1); fb.rect(4, y0 + 46, 50, 6, K.wd2); text(fb, 'SCHOOL', 8, y0 + 40, K.c9);
  fb.rect(170, y0 + 20, 3, 140, K.c1);   // the pole in the foreground
  const bike = ((t - LV[1]) * 120) % 500 - 100; if (bike > -20 && bike < 200) { fb.line(bike, y1 - 22, bike + 20, y1 - 22, K.c1); fb.ell(bike, y1 - 18, 5, 5, K.c1); fb.ell(bike + 20, y1 - 18, 5, 5, K.c1); for (let k = 1; k < 8; k++) fb.px(bike - k * 3, y1 - 24, K.c4); }
  const g = seg(t, TT.greyMax, TT.dustMax), gone = seg(t, TT.dustMax, TT.dustMax + .6);
  if (gone < 1) person(t, 60, y1 - 8, 40, { style: 'spiky', hair: [K.hb2, K.hb3, K.au3 === 0 ? 0 : K.hb3], top: [K.sky1, K.sky2, K.sky3], legs: [K.c3, K.c4, K.c5], pose: t < TT.greyMax ? 'wave' : 'wave', face: 'smile', grey: g, gone,
    extra: (L, X, B, u) => { L.poly([[X(-9), B(36)], [X(-5), B(38)], [X(-3), B(4)], [X(-7), B(2)]], K.or3); } });
  person(t, 110, y1 - 8, 40, { dir: -1, style: 'short', hair: [K.hb1, K.hb2, K.hb2], top: [K.c4, K.c5, K.c6], legs: [K.c2, K.c3, K.c4], pose: t >= TT.break1 ? 'flyer' : 'flyer', scarf: true, face: t >= TT.break1 ? 'smile' : 'neutral' });
  if (t >= TT.break1) { const u = seg(t, TT.break1, TT.break1 + .7), cy = y1 - 50 - Math.sin(u * Math.PI) * 24; fb.ell(100, cy, 2.5, 2.5, (nx, ny) => ny < 0 ? K.au5 : K.au3); }
  dust(t, TT.dustMax, 60, y1 - 50, y1 - 8);
  plusG('+100 G', t, TT.plus100, 120, 80);
}
function lv3(t) {   // the office at night: OTS on the monitor; CU the phone; CU the photo frame; TIME only in the window's reflection
  const [y0, y1] = SCENE;
  if (t >= TT.cuPhone && t < TT.plus5k + .4) {   // the phone
    fb.rect(0, y0, W, y1 - y0, (x, y) => bayer(x, y) < .2 ? K.wd2 : K.wd1); const vib = t < TT.plus5k && step(t, 16) % 2 ? 1 : 0;
    fb.rect(56 + vib, y0 + 10, 68, 130, K.c0); fb.rect(60 + vib, y0 + 16, 60, 116, t >= TT.plus5k ? K.c1 : K.cy1);
    text(fb, 'MOM', 90 - textW('MOM') / 2 + vib, y0 + 20, K.wh); text(fb, 'CALLING...', 90 - textW('CALLING...') / 2 + vib, y0 + 34, K.wh);
    fb.ell(90 + vib, y0 + 76, 16, 16, K.sky2); fb.ell(90 + vib, y0 + 72, 7, 7, K.sk2); fb.ell(88 + vib, y0 + 68, 7, 4, K.hb2); fb.cap([[80 + vib, y0 + 90], [100 + vib, y0 + 90]], 5, [K.or1, K.or2, K.or3]);
    fb.ell(72 + vib, y0 + 116, 7, 7, K.g2); fb.ell(108 + vib, y0 + 116, 7, 7, t >= TT.plus5k - .4 ? K.cr3 : K.rd2);
    return;
  }
  fb.rect(0, y0, W, y1 - y0, K.c1);
  // the window wall: neon city, rain streaks; the reflection of TIME behind him (hidden #3)
  fb.rect(0, y0, W, 80, (x, y) => bayer(x, y) < .1 ? K.ne1 : K.c1);
  for (let i = 0; i < 10; i++) { const bx = i * 19, bh = 20 + (i * 7) % 30; fb.rect(bx, y0 + 80 - bh, 15, bh, K.c2); for (let k = 0; k < 6; k++) fb.px(bx + 3 + (k * 5) % 10, y0 + 82 - bh + k * 4, [K.ne3, K.ne4, K.cy2][k % 3]); }
  for (let i = 0; i < 16; i++) { const x = hash(i, 1) * W | 0, y = y0 + ((hash(i, 2) * 80 + t * 40) % 80); fb.line(x, y, x, y + 4, K.c4); }
  if (t < TT.frame) for (let k = 0; k < 2; k++) timeFig(118, y0 + 82, 60, { sand: .55, glass: k === 0 });
  fb.rect(0, y0 + 78, W, 3, K.c3);
  // the desk, files, three steaming coffees, the monitor (cyan on his face), the photo frame
  fb.rect(0, y0 + 112, W, 40, K.wd1); fb.rect(0, y0 + 112, W, 2, K.wd2);
  for (let k = 0; k < 6; k++) fb.rect(8, y0 + 112 - k * 5 - 5, 26, 4, k % 2 ? K.c8 : K.c9);
  for (let k = 0; k < 3; k++) { const cx = 140 + k * 10; fb.rect(cx, y0 + 104, 7, 8, K.c9); for (let s = 0; s < 3; s++) fb.px(cx + 3 + Math.sin(t * 3 + s + k) * 1.5, y0 + 101 - s * 3, K.c7); }
  fb.rect(56, y0 + 66, 64, 46, K.c0); fb.rect(59, y0 + 69, 58, 38, K.cy2); for (let r = 0; r < 6; r++) fb.rect(62, y0 + 72 + r * 6, 20 + (r * 13) % 30, 2, K.cy3); fb.rect(84, y0 + 107, 8, 5, K.c3);
  const fr = TT.frame, g = seg(t, fr, fr + .5), gone = seg(t, fr + .5, fr + 1.0);
  if (gone < 1) { fb.rect(124, y0 + 92, 16, 20, K.wd2); fb.rect(126, y0 + 94, 12, 16, g > 0 ? K.c5 : K.sky2); if (g === 0) { fb.ell(129, y0 + 104, 2, 3, K.or2); fb.ell(134, y0 + 106, 1.5, 2, K.sky1); fb.px(132, y0 + 97, K.rd2); } if (g > .6) fb.line(126, y0 + 94, 137, y0 + 109, K.c0); }
  dust(t, fr + .5, 132, y0 + 92, y0 + 112, 50, 1.1);
  // Leo at 30 from behind (over the shoulder): shirt, loose tie, the scarf over the chair
  fb.rect(10, y1 - 40, 46, 40, K.c3); fb.cap([[16, y1 - 34], [22, y1 - 46], [30, y1 - 44]], 2, [K.cr1, K.cr2, K.cr3]);
  fb.ell(40, y1 - 30, 26, 24, (nx, ny) => S3(nx, ny, [K.c7, K.c8, K.c9])); fb.ell(42, y1 - 64, 13, 14, (nx, ny) => S3(nx, ny, [K.hb1, K.hb2, K.hb2])); fb.px(55, y1 - 62, K.cy3); fb.px(54, y1 - 58, K.cy2);
  plusG('+5,000 G', t, TT.plus5k, 130, 90);
}
function lv4(t) {   // split: the school show above, the airport gate below
  const [y0, y1] = SCENE, mid = Math.round((y0 + y1) / 2);
  // above: red curtains gone brown, a spotlight, Lily in a glowing star costume, the RESERVED: DAD seat
  fb.rect(0, y0, W, mid - y0, K.c1); fb.rect(0, y0, 20, mid - y0, K.rd1); fb.rect(160, y0, 20, mid - y0, K.rd1); for (let k = 0; k < 4; k++) { fb.rect(2 + k * 5, y0, 1, mid - y0, K.wd1); fb.rect(162 + k * 5, y0, 1, mid - y0, K.wd1); }
  fb.poly([[80, y0], [100, y0], [118, mid - 14], [62, mid - 14]], (x, y) => bayer(x, y) < .35 ? K.or4 : null); fb.rect(20, mid - 14, 140, 4, K.wd2);
  const bow = t >= TT.bow, g = seg(t, TT.bow + .3, TT.bow + .8), gone = seg(t, TT.bow + .8, TT.bow + 1.2);
  if (gone < 1) person(t, 90, mid - 14, 30, { style: 'long', hair: [K.hb1, K.hb2, K.hb3], top: [K.au2, K.au3, K.au4], legs: [K.au2, K.au3, K.au3], pose: bow ? 'bow' : 'stand', face: 'smile', star: true, starOn: !bow, grey: g, gone });
  for (let k = 0; k < 6; k++) { const sx = 40 + k * 18; fb.rect(sx, mid - 8, 12, 6, K.rd1); fb.rect(sx, mid - 12, 12, 4, K.rd2); }
  fb.rect(76, mid - 9, 20, 5, K.c9); text(fb, 'DAD', 78, mid - 16, K.c0);
  if (t >= TT.timeSeat) timeFig(86, mid - 6, 22, { glass: false, eyeDx: 1, look: 0 });   // hidden #4
  dust(t, TT.bow + .8, 90, mid - 44, mid - 14, 60, 1.4);
  fb.rect(0, mid - 1, W, 2, K.c0);
  // below: the gate, cold fluorescent, GATE 7 — NOW BOARDING, Leo with a suitcase walking through
  fb.rect(0, mid + 1, W, y1 - mid - 1, (x, y) => bayer(x, y) < .1 ? K.c7 : K.c6); fb.rect(0, mid + 2, W, 3, K.c9);
  fb.rect(20, mid + 10, 90, 16, K.c0); text(fb, 'GATE 7', 24, mid + 6, K.au4); if (step(t, 3) % 2) text(fb, 'NOW BOARDING', 24, mid + 14, K.wh);
  fb.rect(130, mid + 8, 40, y1 - mid - 8, K.c3); fb.rect(134, mid + 12, 32, y1 - mid - 12, K.c1);
  const walk = ss(TT.plus50k, TT.plus50k + 2, t), lx = lerp(70, 150, walk);
  person(t, lx, y1 - 2, 40, { style: 'short', hair: [K.hb1, K.hb2, K.hb2], top: [K.c2, K.c3, K.c4], legs: [K.c2, K.c3, K.c3], suit: true, pose: walk > 0 && walk < 1 ? 'case' : t < TT.plus50k ? 'phone' : 'case', face: 'neutral',
    extra: (L, X, B, u) => L.rect(X(-2), B(26), 2 * u, 3 * u, K.cr2) });
  plusG('+50,000 G', t, TT.plus50k, 120, mid + 30);
}
function lv5(t) {   // one-point perspective: the long table, the chandelier, Mia at the door, Leo far away with gold, TIME behind his chair
  const [y0, y1] = SCENE, vx = 90, vy = y0 + 58;
  fb.rect(0, y0, W, y1 - y0, K.c2);
  fb.poly([[0, y1], [W, y1], [vx + 14, vy], [vx - 14, vy]], (x, y) => bayer(x, y) < .2 ? K.wd1 : K.c2);
  fb.poly([[30, y1 - 20], [150, y1 - 20], [vx + 10, vy + 8], [vx - 10, vy + 8]], K.wd2);
  for (let k = 0; k < 10; k++) { const u = k / 10, xl = lerp(26, vx - 12, u), xr = lerp(154, vx + 12, u), yy = lerp(y1 - 18, vy + 10, u), s = lerp(10, 2, u); fb.rect(xl - s / 2, yy - s * 1.6, s, s * 1.6, K.wd1); fb.rect(xr - s / 2, yy - s * 1.6, s, s * 1.6, K.wd1); }
  const lit = t < TT.slamDoor || hash(step(t, 10), 5) < .5; fb.line(vx, y0, vx, y0 + 16, K.c6); for (let k = 0; k < 7; k++) { const cx = vx - 18 + k * 6, on = lit && (t < TT.slamDoor || k < 4); fb.rect(cx, y0 + 16, 2, 4, on ? K.c9 : K.c4); if (on) fb.ell(cx + 1, y0 + 18, 5, 5, (nx, ny, x, y) => bayer(x, y) < .2 ? K.au5 : null); }
  timeFig(vx + 4, vy + 12, 60, { sand: .25 });   // hidden #5: right behind his chair
  person(t, vx - 2, vy + 14, 18, { style: 'salt', top: [K.c4, K.c5, K.c6], legs: [K.c2, K.c3, K.c3], pose: 'sit' });
  fb.rect(vx + 5, vy + 2, 6, 4, K.cy2); for (let k = 0; k < 3; k++) fb.rect(vx - 14, vy + 4 - k * 2, 6, 2, K.au4); fb.cap([[vx + 14, vy + 6], [vx + 18, vy + 10]], 1, [K.cr1, K.cr2, K.cr3]);
  const g = seg(t, TT.plus500k, TT.plus500k + .25), gone = seg(t, TT.plus500k + .25, TT.plus500k + .6);
  fb.rect(150, y0 + 30, 30, y1 - y0 - 30, t < TT.slamDoor ? K.c6 : K.wd1);   // the doorway
  if (gone < 1) person(t, 160, y1 - 2, 46, { dir: -1, style: 'long', hair: [K.hb1, K.hb2, K.hb2], top: [K.ne1, K.ne2, K.c5], legs: [K.c2, K.c3, K.c3], pose: 'case', face: 'sad', grey: g, gone });
  dust(t, TT.plus500k + .25, 160, y1 - 48, y1 - 2, 70, 1.0);
  if (t >= TT.ecuHands && t < TT.plus500k) {   // ECU: his trembling hands, he didn't press it
    fb.rect(0, y0, W, y1 - y0, K.c1); const j = step(t, 20) % 2;
    for (const hx of [56, 124]) { fb.ell(hx + j, y0 + 80, 22, 18, (nx, ny) => S3(nx, ny, [K.sk1, K.sk2, K.c7])); for (let f = 0; f < 4; f++) fb.cap([[hx - 12 + f * 8 + j, y0 + 66], [hx - 14 + f * 8 + j, y0 + 44]], 3, [K.sk1, K.sk2, K.c7]); }
  }
  plusG('+500,000 G', t, TT.plus500k, 110, 100);
}
function montage(t) {   // A: the mansion map going dark room by room; B: Leo aging alone on the sofa, TIME mimicking him
  const [y0, y1] = SCENE, k = Math.floor((t - TT.montage) / .5), u = seg(t, TT.montage, TT.matchCut);
  if (t >= TT.silence && t < TT.matchCut) { fb.rect(0, y0, W, y1 - y0, K.c0); return; }
  if (k % 2 === 0) {
    fb.rect(0, y0, W, y1 - y0, K.c1);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const i = r * 3 + c, x = 20 + c * 48, y = y0 + 10 + r * 46, dark = i < u * 11; fb.rect(x, y, 44, 42, K.c0); fb.rect(x + 2, y + 2, 40, 38, dark ? K.c2 : K.au2 === 0 ? 0 : K.wd3); if (!dark) { fb.rect(x + 8, y + 10, 10, 6, K.wd1); fb.ell(x + 30, y + 26, 4, 4, K.g2); } else { fb.cap([[x + 30, y + 30], [x + 34, y + 24]], 1, [K.c4, K.c4, K.c4]); for (let d = 0; d < 6; d++) fb.px(x + 6 + d * 5, y + 30 + (d % 2) * 3, K.c4); } }
  } else {
    fb.rect(0, y0, W, y1 - y0, K.c2); fb.rect(110, y0 + 40, 54, 34, K.c0); fb.rect(113, y0 + 43, 48, 28, K.c1);
    fb.rect(10, y1 - 50, 90, 30, K.c4); fb.rect(10, y1 - 70, 90, 22, K.c5);
    const age = Math.min(1, u * 1.2), hunch = age * 6;
    person(t, 42, y1 - 18, 34, { style: age > .4 ? 'white' : 'salt', skin: OLDSKIN, top: [K.c3, K.c4, K.c5], legs: [K.c2, K.c3, K.c3], pose: 'sit', extra: (L, X, B, uu) => {} });
    timeFig(76, y1 - 18, 44 - hunch, { sand: .1, glass: false });
  }
  const ages = ['AGE 60...', 'AGE 64...', 'AGE 67...', 'AGE 70']; const ai = Math.min(3, Math.floor(u * 4.2)); if (step(t, 4) % 2 === 0) text(fb, ages[ai], 6, y0 + 2, K.wh, K.c0);
  if (t >= TT.achievement && t < TT.silence) {   // the achievement popup
    const p = eo(seg(t, TT.achievement, TT.achievement + .2)); win(8, Math.round(y0 + 52 - (1 - p) * 30), 164, 44, K.au4, K.nv1);
    const yy = Math.round(y0 + 52 - (1 - p) * 30); fb.rect(16, yy + 10, 12, 10, K.au4); fb.rect(19, yy + 20, 6, 4, K.au3); fb.rect(16, yy + 24, 12, 3, K.au2); fb.px(14, yy + 12, K.au4); fb.px(29, yy + 12, K.au4);
    text(fb, 'ACHIEVEMENT UNLOCKED:', 34, yy + 2, K.au4); text(fb, 'ALONE AT THE TOP', 34, yy + 18, K.wh);
  }
}
function shopMenu(t, scroll = 0, freeGlow = false) {
  const [y0] = SCENE, x = 10, y = y0 + 6, w = 160, h = 140; win(x, y, w, h, K.au4, K.nv1);
  text(fb, 'SHOP', 90 - textW('SHOP') / 2, y + 2, K.au4); text(fb, 'GOLD: 999,999', 90 - textW('GOLD: 999,999') / 2, y + 16, K.au3);
  const rows = [['+1 YEAR', 'SOLD OUT'], ['+1 DAY', 'SOLD OUT'], ['+1 MINUTE', 'SOLD OUT'], ['1 PHONE CALL', 'FREE']];
  const top = y + 36 - Math.round(scroll * 22);
  rows.forEach(([a, b], i) => {
    const ry = top + i * 22; if (ry < y + 32 || ry > y + 36 + 2 * 22 + 4) return;   // a 3-row window: the FREE line hides below until the list scrolls
    if (i === 3 && freeGlow) { fb.rect(x + 4, ry + 2, w - 8, 16, (px, py) => bayer(px, py) < .3 ? K.au2 : K.au1); fb.rect(x + 4, ry + 2, w - 8, 1, K.au5); fb.rect(x + 4, ry + 17, w - 8, 1, K.au5); }
    text(fb, a, x + 14, ry, K.wh); let dots = ''; while (textW(a + ' ' + dots + '. ' + b) < w - 26) dots += '.'; text(fb, b, x + w - 8 - textW(b), ry, i === 3 ? K.au5 : K.c7);
    text(fb, dots, x + 16 + textW(a), ry, K.c5);
  });
  return top;
}
function stamp(t, t0, x, y) { const u = seg(t, t0, t0 + .12); if (t < t0) return; const s = Math.round(lerp(4, 2, u)), w = textW('SOLD OUT') * s; fb.rect(x - w / 2 - 4, y - 4, w + 8, 7 * s + 8, K.cr2); fb.rect(x - w / 2 - 2, y - 2, w + 4, 7 * s + 4, K.c0 === 0 ? K.cr1 : 0); big('SOLD OUT', x, y - 5 * s + 1, s, K.cr3, null); }
function phoneUI(t) {
  const [y0, y1] = SCENE; fb.rect(0, y0, W, y1 - y0, K.c1);
  fb.rect(34, y0 + 4, 112, 146, K.c0); fb.rect(38, y0 + 10, 104, 134, K.c2);
  const col = seg(t, TT.pickup, TT.pickup + 1.4);
  text(fb, 'LILY', 90 - textW('LILY') / 2, y0 + 12, K.wh); text(fb, 'Last call: 29 years ago', 90 - textW('Last call: 29 years ago') / 2, y0 + 26, K.c7);
  // the avatar: a grown-up Lily, grey, getting its colour back pixel by pixel when she picks up
  for (let yy = -22; yy <= 22; yy++) for (let xx = -22; xx <= 22; xx++) { if (xx * xx + yy * yy > 22 * 22) continue; const X = 90 + xx, Y = y0 + 76 + yy; let c = yy < -8 && xx * xx + (yy + 6) * (yy + 6) < 200 ? K.hb2 : xx * xx + (yy + 2) * (yy + 2) < 90 ? K.sk3 : yy > 10 ? K.ne2 : K.sky2; if (Math.abs(xx - 4) < 1 && Math.abs(yy + 2) < 1) c = K.c0; if (Math.abs(xx + 4) < 1 && Math.abs(yy + 2) < 1) c = K.c0;
    const warm = hash(xx + 40, yy + 40, 3) < col, grey = c === K.sk3 ? K.c7 : c === K.hb2 ? K.c3 : c === K.c0 ? K.c0 : c === K.ne2 ? K.c4 : K.c5; fb.px(X, Y, warm ? c : grey); }
  if (t < TT.pickup) { const dots = '.'.repeat(1 + step(t, 3) % 3); text(fb, 'CALLING' + dots, 90 - textW('CALLING...') / 2, y0 + 108, K.wh); }
  else text(fb, '00:00:0' + Math.min(2, Math.floor(t - TT.pickup)), 90 - textW('00:00:00') / 2, y0 + 108, K.g4);
}

// ———————————————— the director ————————————————
const box_ = id => TL.boxes.find(b => b.id === id);
function boxes(t) { for (const b of TL.boxes) if (t >= b.a && t < b.b) box(b, t); for (const m of TL.menus) if (t >= m.a && t < m.b) menu(m, t); }
function flash(t, at) { return t >= at && t < at + 2 / 24; }
function loveAt(t) { if (t >= TT.zero) return 0; if (t >= TT.pickup + .4) return .5; return heartsAt(t); }
function crt(o, t, off = 0) {   // the curved CRT: corner vignette + glitch RGB shift handled per scene
}

window.DUR = DUR;
window.render = t => {
  fb.clear(K.c0); let lut = loveLut(loveAt(t)), sh = 0, glitch = 0;
  if (t < TT.fly) {   // HOOK: black → the red 01:00 punches in
    if (t < .12) { for (let i = 0; i < W * H; i++) fb.d[i] = hash(i, step(t, 24)) < .5 ? K.c9 : K.c2; }
    else { const z = Math.max(1, Math.round(lerp(12, 4, eo(seg(t, TT.punch, TT.punch + .17))))); fb.ell(90, 120, 80, 50, (nx, ny, x, y) => bayer(x, y) < .4 * (1 - nx * nx - ny * ny) ? K.cr1 : null); big('01:00', 90, 120 - 4 * z, z, K.cr3, K.cr1); sh = t < TT.punch + .25 ? 6 : 0; }
    if (t >= box_('die').a) box(box_('die'), t);
    lut = LUT.full;
  } else if (t < TT.cuTime) {   // the reveal: the clock flies up into the HUD, zoom out by steps to the hospital
    hospital(t, { time: { x: 128, h: 128, sand: t >= TT.flip ? .98 : 1, look: t >= TT.flip + .4 ? 1 : 0 } });
    if (t >= TT.flip && t < TT.flip + .3) fb.rect(140, 60, 20, 6, K.c0);
    hud(t);
    if (t < TT.fly + .35) { const z = [4, 2, 1][Math.min(2, Math.floor((t - TT.fly) / .12))]; if (z > 1) { const src = fb.d.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = src[Math.floor(90 + (x - 90) / z + (120 - 120 / z) * 0) + Math.floor(120 + (y - 120) / z) * W]; } }
  } else if (t < TT.lv1) {   // rewind
    if (t < TT.rewind) { fb.rect(0, SCENE[0], W, SCENE[1] - SCENE[0], K.c1); timeFig(90, SCENE[1] + 10, 160, { sand: .95, look: 1, rim: true }); if (step(t, 6) % 3 === 0) fb.px(92, SCENE[1] + 10 - 160 * .91, K.wh); }
    else {
      const ages = [70, 50, 30, 6], k = Math.min(3, Math.floor((t - TT.rewind) / .35));
      hospital(t, { rewind: true, time: { x: 128, h: 128, sand: .9 } });
      fb.rect(30, 70, 120, 100, K.c1);
      person(t, 90, 168, [44, 42, 40, 24][k], { style: ['white', 'salt', 'short', 'bowl'][k], skin: k < 2 ? OLDSKIN : SKIN, top: [K.c4, K.c5, K.c6], scarf: true, face: 'neutral' });
      for (let i = 0; i < 6; i++) { const y = SCENE[0] + ((i * 31 + t * 200) % (SCENE[1] - SCENE[0])); for (let x = 0; x < W; x++) if (hash(x >> 2, i, step(t, 24)) < .5) fb.px(x, y, K.c8); }
      text(fb, '◀◀ REWIND', 6, SCENE[0] + 2, K.wh, K.c0);
      const p = seg(t, TT.rewind, TT.lv1 - .1); win(10, 176, 160, 18, K.wh, K.nv1); fb.rect(13, 189, Math.round(154 * p), 3, K.au4); text(fb, 'LOADING MEMORIES...', 14, 172, K.wh);
      glitch = 2;
    }
    hud(t);
  } else if (t < LV[1]) { lv1(t); hud(t); card('LV.1 - AGE 6', t, TT.lv1); if (t >= TT.heart5 && t < TT.heart5 + 1) big('+♥', 30, Math.round(56 - (t - TT.heart5) * 10), 2, K.pk1, K.c0); }
  else if (t < LV[2]) { lv2(t); hud(t); card('LV.2 - AGE 16', t, LV[1]); sh = t >= TT.break1 && t < TT.break1 + .2 ? 2 : 0; }
  else if (t < LV[3]) { lv3(t); hud(t); card('LV.3 - AGE 30', t, LV[2]); }
  else if (t < LV[4]) { lv4(t); hud(t); card('LV.4 - AGE 41', t, LV[3]); }
  else if (t < TT.montage) { lv5(t); hud(t); card('LV.5 - AGE 55', t, LV[4], true); if (t >= TL.menus[4].move[0] && t < TL.menus[4].confirm) glitch = 2; sh = t >= TT.slamDoor && t < TT.slamDoor + .3 ? 3 : 0; }
  else if (t < TT.save) { montage(t); hud(t); }
  else if (t < TT.shop) {   // SAVE
    hospital(t, { time: { x: 24, h: 128, sand: .2 }, gold: 0 }); hud(t);
    if (t < TL.menus[5].a) { const r = seg(t, TT.save, TL.menus[5].a - .1); fb.cap([[70, 190], [lerp(70, 100, r), lerp(190, 120, r)]], 7, OLDSKIN); for (let f = 0; f < 4; f++) fb.cap([[lerp(70, 100, r) - 6 + f * 4, lerp(190, 120, r) - 4], [lerp(70, 100, r) - 7 + f * 4, lerp(190, 120, r) - 14]], 2, OLDSKIN); }
    if (t >= TT.error) { win(14, 100, 152, 46, K.cr3, K.cr1); text(fb, 'ERROR: THIS GAME', 90 - textW('ERROR: THIS GAME') / 2, 104, K.wh); text(fb, 'HAS NO SAVE FILE.', 90 - textW('HAS NO SAVE FILE.') / 2, 120, K.wh); sh = t < TT.error + .17 ? 3 : 0; }
  } else if (t < TT.free) {   // SHOP: SOLD OUT ×3, gold pouring out uselessly
    const pile = Math.round(lerp(0, 160, seg(t, TT.buys[0], TT.free)));
    hospital(t, { time: { x: 24, h: 128, sand: .1 }, gold: pile }); lut = loveLut(0); hud(t);
    shopMenu(t); TT.buys.forEach((b, i) => stamp(t, b, 90 + (i - 1) * 6, 112 + i * 6)); TT.buys.forEach(b => { if (t >= b && t < b + .15) sh = 3; });
    for (let i = 0; i < 40; i++) { const u = ((t * .8 + hash(i, 1)) % 1), x = 120 + hash(i, 2) * 50, y = lerp(30, SCENE[1], u); if (t > TT.buys[0]) fb.ell(x, y, 2, 1.5, K.au4); }
    if (t >= TT.buys[0] + .7 && t < TT.buys[0] + 1.1) { fb.rect(0, SCENE[0], W, SCENE[1] - SCENE[0], K.c1); fb.ell(90, 120, 46, 50, (nx, ny) => S3(nx, ny, OLDSKIN)); fb.ell(86, 86, 46, 22, (nx, ny, x, y) => y < 92 ? K.hw2 : null); for (const ex of [72, 108]) { fb.rect(ex - 6, 112, 12, 8, K.c9); fb.rect(ex - 1, 113, 3, 4, K.c0); } fb.rect(130, 96, 3, 6, K.sd2); fb.rect(80, 146, 20, 4, K.c0); }
  } else if (t < TT.calling) {   // FREE: the list scrolls one row; the last item glows; he presses it
    hospital(t, { time: { x: 24, h: 128, sand: .06 }, gold: 160 }); lut = loveLut(0); fb.rect(0, SCENE[0], W, SCENE[1] - SCENE[0], (x, y) => bayer(x, y) < .55 ? K.c0 : null); hud(t);
    const top = shopMenu(t, ease(seg(t, TT.free, TT.free + .8)), t >= TT.free + .8), cy = top + (t < TT.free + 1.2 ? 2 : 3) * 22, tr = step(t, 10) % 2;
    text(fb, '▶', 14 + tr, cy, t >= TT.freeSel ? K.au5 : K.wh); if (t >= TT.freeSel && step(t, 6) % 2) fb.rect(16, cy + 16, 150, 1, K.au5);
  } else if (t < TT.pickup) {   // CALLING: the phone, then his eye with one tear; the clock grows
    if (t < TT.ecuEye) phoneUI(t);
    else { fb.rect(0, SCENE[0], W, SCENE[1] - SCENE[0], K.c1); fb.ell(90, 120, 80, 60, (nx, ny) => S3(nx, ny, OLDSKIN)); fb.ell(90, 114, 30, 14, K.c9); fb.ell(92, 114, 12, 12, K.c2); fb.ell(92, 114, 6, 6, K.c0); fb.rect(88, 110, 3, 3, K.wh); fb.rect(60, 98, 60, 4, K.hw1); const tu = seg(t, TT.ecuEye + .3, TT.pickup); fb.rect(118, Math.round(lerp(122, 168, tu)), 2, 3, K.sd2); fb.px(118, Math.round(lerp(122, 168, tu)), K.wh); }
    hud(t); const g = ss(TT.calling, TT.pickup, t); if (g > 0 && t >= TT.calling + 1) { const tl = timeLeft(t); big('00:0' + tl, 90, 168, Math.round(2 + g * 3), step(t, 4) % 2 ? K.cr3 : K.cr2, K.cr1); }
  } else if (t < TT.zero) { phoneUI(t); hud(t); }
  else if (t < TT.gameOver) {   // 00:00: the hook's frame again; the line is cut; everything freezes grey; flatline
    const tf = Math.min(t, TT.zero + 1.0);
    hospital(tf, { time: { x: 24, h: 128, sand: 0 }, gold: 160, phone: true, flat: t >= TT.zero + 1.0, lightning: t < TT.zero + 1.0 }); hud(Math.min(t, CZ)); lut = t >= TT.zero + 1.0 ? loveLut(0) : loveLut(.5);
  } else if (t < TT.twist) {   // GAME OVER
    hospital(TT.zero + 1.0, { time: { x: 24, h: 128, sand: 0 }, gold: 160, phone: true, flat: true, lightning: false }); hud(CZ);
    lut = darkLut(.75, true);
    const drop = seg(t, TT.gameOver, TT.gameOver + .5), bounce = Math.abs(Math.sin(drop * Math.PI * 2.5)) * (1 - drop) * 20;
    big('GAME OVER', 90, Math.round(lerp(-30, 96, ease(Math.min(1, drop * 1.4))) - bounce), 3, K.cr3, K.c0);
    if (t >= TT.gameOver + 1.0) { text(fb, 'CONTINUE?', 90 - textW('CONTINUE?') / 2, 140, K.wh, K.c0); text(fb, 'YES', 66, 158, K.wh); text(fb, 'NO', 104, 158, K.wh); text(fb, '▶', t >= TT.contYes - .4 ? 56 : 94, 158, K.wh); }
    if (t >= TT.noCont) { win(20, 180, 140, 22, K.wh, K.nv1); text(fb, 'NO CONTINUES LEFT.', 90 - textW('NO CONTINUES LEFT.') / 2, 182, K.wh); }
  } else if (t < TT.end) {   // THE TWIST: TIME turns to look at us; the hourglass marked YOU
    lut = LUT.full; fb.clear(K.c0);
    const p = seg(t, TT.push, TT.line1);
    if (p < 1) { const h = lerp(240, 420, ease(p)); fb.ell(90, 300 + p * 120 - h * .5, h * .3, h * .6, (nx, ny, x, y) => bayer(x, y) < .18 * (1 - nx * nx - ny * ny) ? K.c3 : null); timeFig(90, 300 + p * 120, h, { sand: .5, look: t >= TT.turn ? 1 : 0, eye: t >= TT.turn + .3, eyeDx: 0, glassDx: 0, rim: true }); }
    else {   // ECU of the hourglass
      const gx = 90, gy = 120, gh = 110, gw = 54;
      fb.ell(gx, gy, 90, 90, (nx, ny, x, y) => bayer(x, y) < .22 * (1 - nx * nx - ny * ny) ? K.sd1 : null);
      fb.rect(gx - gw - 6, gy - gh / 2 - 8, gw * 2 + 12, 8, K.wd2); fb.rect(gx - gw - 6, gy + gh / 2, gw * 2 + 12, 8, K.wd2);
      for (let k = 0; k <= gh; k++) { const yy = gy - gh / 2 + k, half = Math.abs(k - gh / 2) / (gh / 2) * gw + 2; fb.px(gx - half, yy, K.c7); fb.px(gx + half, yy, K.c7); const sandTop = k < gh / 2 && k > gh / 2 * .45, sandBot = k > gh * .72; if (sandTop || sandBot) for (let xx = -half + 1; xx < half; xx++) fb.px(gx + xx, yy, bayer(gx + xx, yy) < .5 ? K.sd1 : K.sd2); }
      for (let k = 0; k < 30; k++) fb.px(gx + (hash(k, step(t, 12)) - .5) * 2, gy - 2 + ((k * 2 + t * 40) % 40), K.sd2);
      big('YOU', gx, gy - 30, 2, K.c9, K.c3);
    }
    const l1 = 'THIS GAME HAS NO SAVE FILE.', l2 = 'NEITHER DOES YOURS.';
    if (t >= TT.line1) text(fb, l1, 90 - textW(l1) / 2, 214, K.wh, K.c3, Math.floor((t - TT.line1) * 22));
    if (t >= TT.line2) text(fb, l2, 90 - textW(l2) / 2, 232, K.wh, K.c3, Math.floor((t - TT.line2) * 16));
  } else {   // END: ▶ CALL THEM. then the CRT switches off
    lut = LUT.full; fb.clear(K.c0);
    if (t < TT.crtOff) { if (step(t - TT.end, 1.6) % 2 === 0 || t > TT.end + 1.3) big('▶ CALL THEM.', 90, 140, 2, K.wh, K.c0); }
    else { const u = seg(t, TT.crtOff, TT.off); if (u < .6) { const hh = Math.max(1, Math.round(lerp(60, 1, u / .6))); fb.rect(0, 160 - hh / 2, W, hh, K.c9); } else if (u < 1) { const r = lerp(6, 0, (u - .6) / .4); fb.ell(90, 160, r + .5, r + .5, K.wh); } }
  }
  // the 2-frame subliminal flashes of the hospital room with TIME
  for (const f of [TT.flash1, TT.flash2, TT.flash3, TT.flash4]) if (flash(t, f)) { hospital(t, { time: { x: 70, h: 150, sand: .4, look: 1 } }); lut = darkLut(.25, true); }
  if (t < TT.end && t >= TT.fly) for (const m of TL.menus) if (t >= m.a && t < m.b) menu(m, t);
  if (t >= TT.fly && t < TT.twist) for (const b of TL.boxes) if (t >= b.a && t < b.b && b.id !== 'die') box(b, t);
  fb.rect(0, 262, W, 58, K.c0);   // keep the bottom 18 % empty for the app's caption and buttons
  // shake, glitch
  if (sh) { const dx = Math.round((hash(step(t, 24), 1) - .5) * 2 * sh), dy = Math.round((hash(step(t, 24), 2) - .5) * 2 * sh); const src = fb.d.slice(); fb.clear(K.c0); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x - dx, Y = y - dy; if (X >= 0 && Y >= 0 && X < W && Y < H) fb.d[y * W + x] = src[Y * W + X]; } }
  out.present(fb, lut);
  if (glitch) out.post(u => { const f = step(t, 24); for (let y = 0; y < H; y++) { if (hash(y >> 2, f) > .3) continue; const s = Math.round((hash(y, f, 3) - .5) * 10 * glitch); const row = u.slice(y * W, y * W + W); for (let x = 0; x < W; x++) { const a = row[((x - s) % W + W) % W], b = row[((x + 2) % W)]; u[y * W + x] = (a & 0xff00ffff) | (b & 0x00ff0000); } } });
  out.show(1);
};
window.READY = true;
