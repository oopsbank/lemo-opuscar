// CA ĐÊM (00:00) — a 75 s vertical pixel-art horror short (16-bit RPG grammar). One framebuffer, seven shots, everything drawn in code.
import { W, H, T, C, FB, layer, LUT, darkLut, makeOut, bayer, hash, clamp, lerp, ss, seg } from './px.js';
import { text, textW, wrap, charCount, LINE_H } from './font.js';

const TL = await fetch('timeline.json').then(r => r.json()), TT = TL.t, DUR = TL.dur;
const fb = new FB(), out = makeOut(document.getElementById('out'));
const Q = new URLSearchParams(location.search);
const step = (t, fps) => Math.floor(t * fps);   // sprite animation steps
const S3 = (nx, ny, cols, x, y, k = .55) => { const v = -(nx * .7 + ny * .7); return v > k ? cols[2] : v < -k ? cols[0] : (bayer(x, y) < (v + k) / (2 * k) * .25 + (v > k * .6 ? .5 : 0) ? cols[2] : cols[1]); };
const S3s = (nx, ny, cols) => { const v = -(nx * .7 + ny * .7); return v > .45 ? cols[2] : v < -.45 ? cols[0] : cols[1]; };
const NIGHT = [C.n1, C.n2, C.n3, C.n4, C.n5, C.n6, C.n7, C.n8];

// ———————————————— UI ————————————————
function boxFrame(x, y, w, h) {   // black box, white border (inner grey line), rounded corners
  fb.rect(x + 1, y, w - 2, h, C.ink); fb.rect(x, y + 1, w, h - 2, C.ink);
  fb.rect(x + 2, y + 1, w - 4, 1, C.n9); fb.rect(x + 2, y + h - 2, w - 4, 1, C.n9); fb.rect(x + 1, y + 2, 1, h - 4, C.n9); fb.rect(x + w - 2, y + 2, 1, h - 4, C.n9);
  fb.rect(x + 3, y + 3, w - 6, 1, C.n3); fb.rect(x + 3, y + 3, 1, h - 6, C.n3);
  fb.rect(x + 3, y + 4, w - 6, h - 7, (X, Y) => bayer(X, Y) < .12 ? C.n1 : C.ink);
}
function nameTag(x, y, who) { const w = textW(who) + 10; fb.rect(x, y, w, 14, C.ink); fb.rect(x + 1, y + 1, w - 2, 12, C.n9); fb.rect(x + 2, y + 2, w - 4, 10, C.ink); text(fb, who, x + 5, y - 4, C.n9); }
// a dialog box: lines typed at cps; returns true when complete
function dialog(b, t, y = 262, o = {}) {
  const lines = wrap(b.text, 152), h = Math.max(36, lines.length * LINE_H + 12), Y = o.bottom ? 316 - h : y;
  boxFrame(6, Y, 168, h); if (b.who) nameTag(10, Y - 11, b.who);
  const n = Math.floor(Math.max(0, t - b.a) * b.cps); let used = 0;
  lines.forEach((ln, i) => { const cc = charCount(ln); text(fb, ln, 13, Y + 4 + i * LINE_H - 2, o.col || C.n9, C.n3, Math.max(0, n - used)); used += cc + 1; });
  const done = n >= charCount(b.text);
  if (done && step(t, 3) % 2 === 0) { fb.rect(162, Y + h - 9, 5, 1, C.n9); fb.rect(163, Y + h - 8, 3, 1, C.n9); fb.px(164, Y + h - 7, C.n9); }
  return Y;
}
function bubble(x, y, kind, age) {   // [?] white or [!] red, popping in over 3 frames
  if (age < 0) return; const k = Math.min(1, age * 8), w = Math.round(5 + 6 * k), h = Math.round(5 + 7 * k), X = Math.round(x - w / 2), Y = Math.round(y - h - (age < .3 ? (1 - age / .3) * 3 : 0));
  const fill = kind === '!' ? C.r3 : C.n9, ink = kind === '!' ? C.n9 : C.ink;
  fb.rect(X - 1, Y, w + 2, h, C.ink); fb.rect(X, Y - 1, w, h + 2, C.ink); fb.rect(X, Y, w, h, fill); fb.px(X + w / 2, Y + h + 1, C.ink); fb.px(X + w / 2, Y + h, fill); fb.px(X + w / 2 - 1, Y + h, fill);
  if (k < 1) return;
  if (kind === '!') { fb.rect(X + 5, Y + 2, 2, 6, ink); fb.rect(X + 5, Y + 9, 2, 2, ink); }
  else { fb.rect(X + 4, Y + 2, 4, 1, ink); fb.px(X + 3, Y + 3, ink); fb.px(X + 8, Y + 3, ink); fb.px(X + 8, Y + 4, ink); fb.px(X + 7, Y + 5, ink); fb.px(X + 6, Y + 6, ink); fb.px(X + 6, Y + 7, ink); fb.px(X + 6, Y + 9, ink); }
}

// ———————————————— the store, top-down ————————————————
const FOOT = [];   // wet footprints: {x, y, t}
function store(t, o) {
  // back wall, posters, the clock
  fb.rect(0, 0, W, 24, (x, y) => y > 20 ? C.n1 : bayer(x, y) < .2 ? C.n3 : C.n2);
  fb.rect(14, 5, 22, 12, C.v2); fb.rect(15, 6, 20, 10, C.v3); text(fb, '-50%', 16, 2, C.r3); fb.rect(44, 6, 16, 11, C.n4); fb.rect(46, 8, 12, 3, C.f3); fb.rect(46, 12, 8, 2, C.n7);
  const cx = 150, cy = 11; fb.ell(cx, cy, 8, 8, C.ink); fb.ell(cx, cy, 7, 7, (nx, ny) => nx + ny < -.8 ? C.n9 : C.n8); for (let k = 0; k < 12; k++) fb.px(cx + Math.sin(k / 6 * Math.PI) * 5.5, cy - Math.cos(k / 6 * Math.PI) * 5.5, C.n5);
  const mAng = t < TT.clock ? -Math.PI / 30 : 0; fb.line(cx, cy, cx + Math.sin(mAng) * 5, cy - Math.cos(mAng) * 5, C.ink); fb.line(cx, cy, cx, cy - 3, C.ink); fb.px(cx, cy, C.r3);
  if (Math.abs(t - TT.clock) < .3) fb.px(cx + 1, cy - 6, C.n9);
  // freezers: four glowing doors with shelves of products
  for (let i = 0; i < 4; i++) {
    const x0 = 6 + i * 42, fl = o.freezer ?? 1;
    fb.rect(x0, 24, 40, 32, C.n1); fb.rect(x0 + 2, 26, 36, 28, (x, y) => fl < .5 ? C.n2 : bayer(x, y) < .25 + (y - 26) / 60 ? C.f2 : C.f3);
    for (let s = 0; s < 3; s++) { fb.rect(x0 + 2, 32 + s * 8, 36, 1, fl < .5 ? C.n3 : C.f4); for (let p = 0; p < 9; p++) fb.rect(x0 + 3 + p * 4, 29 + s * 8, 3, 3, [C.orange, C.blue, C.mustard, C.pink, C.u3][(i * 7 + s * 3 + p) % 5]); }
    fb.rect(x0 + 19, 26, 1, 28, C.n1); fb.rect(x0 + 16, 38, 1, 5, C.n8); fb.rect(x0 + 22, 38, 1, 5, C.n8);
  }
  // the floor: dithered checker tiles, the freezers' glow spilling down
  for (let y = 56; y < 268; y++) for (let x = 0; x < W; x++) {
    const tile = ((x / 12 | 0) + (y / 12 | 0)) % 2, glow = (o.freezer ?? 1) > .5 ? Math.max(0, 1 - (y - 56) / 40) : 0;
    let c = tile ? C.n3 : C.n2; if (x % 12 === 0 || y % 12 === 0) c = C.n2; if (bayer(x, y) < glow * .6) c = C.f1; if (tile && bayer(x, y) < .06) c = C.n4;
    fb.px(x, y, c);
  }
  // footprints (wet, dithered, fading)
  for (const f of FOOT) { if (f.t > t) continue; const a = 1 - (t - f.t) / 30; if (a <= 0) continue; fb.rect(f.x, f.y, 3, 2, (x, y) => bayer(x, y) < a ? (bayer(x, y) < a * .4 ? C.rain2 : C.rain1) : null); }
  // three shelf gondolas (top view): a frame and rows of products on both faces
  for (const gx of [16, 58, 100]) {
    fb.rect(gx - 1, 84, 18, 114, C.ink); fb.rect(gx, 85, 16, 112, C.w2); fb.rect(gx + 7, 85, 2, 112, C.w1);
    for (let y = 88; y < 194; y += 5) for (const side of [0, 9]) fb.rect(gx + 1 + side, y, 6, 3, [C.orange, C.blue, C.mustard, C.pink, C.u3, C.n8][((y + gx + side) / 5 | 0) % 6]);
    fb.rect(gx, 197, 16, 3, C.n1);
  }
  // the counter (right): its top, its front face, the register and the paper under it
  fb.rect(121, 174, 24, 80, C.ink); fb.rect(122, 175, 22, 72, (x, y) => bayer(x, y) < .15 ? C.w4 : C.w3); fb.rect(122, 247, 22, 6, C.w1); fb.rect(122, 175, 1, 72, C.w4);
  fb.rect(125, 182, 14, 12, C.ink); fb.rect(126, 183, 12, 10, C.n4); fb.rect(127, 184, 10, 4, o.regGlow ? C.f4 : C.f3); fb.rect(127, 189, 10, 3, C.n6);
  if (!o.noPaper) { fb.rect(127, 194, 6, 3, C.p3); fb.px(128, 194, C.p4); if (o.glint && step(t, 6) % 2) fb.px(131, 193, C.n9); }
  fb.rect(126, 214, 12, 8, C.n2); fb.rect(127, 215, 10, 6, C.n4);   // a tray
  // the cigarette wall behind the cashier
  fb.rect(170, 160, 10, 100, C.ink); fb.rect(171, 162, 9, 96, C.w1); for (let y = 164; y < 256; y += 6) for (let x = 172; x < 180; x += 3) fb.rect(x, y, 2, 4, [C.r2, C.n7, C.u2, C.mustard][((x + y) / 3 | 0) % 4]);
  // the front: wall, the glass door (left), windows; outside the rain
  fb.rect(0, 268, W, 6, C.ink); fb.rect(0, 269, W, 4, C.n2);
  const doorOpen = o.door || 0;
  for (let y = 274; y < H; y++) for (let x = 0; x < W; x++) {
    let c = bayer(x, y) < (y - 274) / 90 ? C.n1 : C.n2; if ((x + y * 2) % 37 === 0) c = C.n3;
    const lamp = Math.hypot(x - 150, (y - 300) * 1.6); if (bayer(x, y) < Math.max(0, 1 - lamp / 40) * .5) c = C.n4;
    fb.px(x, y, c);
  }
  for (const gx of [62, 118]) fb.rect(gx, 274, 2, 46, C.n4);
  fb.rect(14 - doorOpen * 10, 274, 2, 46, C.n5); fb.rect(52 + doorOpen * 10, 274, 2, 46, C.n5); fb.rect(32, 274, 2, 46, doorOpen > .2 ? C.n1 : C.n5);
  // rain: streaks outside and down the glass
  for (let i = 0; i < 70; i++) { const x = hash(i, 1) * W | 0, sp = 180 + hash(i, 2) * 120, y = 274 + ((hash(i, 3) * 400 + t * sp) % 50); fb.line(x, y, x - 1, y + 3, hash(i, 4) < .5 ? C.rain2 : C.rain3); }
  for (let i = 0; i < 12; i++) { const x = hash(i, 9) * W | 0, y = 300 + hash(i, 8) * 18 | 0, r = ((t * 3 + hash(i, 7) * 5) % 1) * 5; if (r > .5) { fb.px(x - r, y, C.rain2); fb.px(x + r, y, C.rain2); } }
  fb.rect(20, 260, 26, 7, C.n4); fb.rect(21, 261, 24, 5, C.v2);   // the door mat
}

// the clerk, top-down, facing left: feet at (x, y)
function namTop(t, x, y, pose) {
  const L = layer(), b = pose === 'idle' || pose === 'stiff' ? 0 : 0, br = step(t, 2) % 2 && pose !== 'stiff' ? 1 : 0;
  const P = (X, Y, c) => L.px(X, Y, c), R = (X, Y, w, h, c) => L.rect(X, Y, w, h, c);
  R(x - 4, y - 7, 3, 7, C.h2); R(x, y - 7, 3, 7, C.h1); R(x - 5, y - 1, 4, 2, C.ink); R(x, y - 1, 4, 2, C.ink);
  const by = y - 18 + br;
  R(x - 5, by, 10, 11, C.u2); R(x + 2, by, 3, 11, C.u1); R(x - 5, by, 2, 10, C.u3); R(x - 2, by, 4, 2, C.s3); P(x - 3, by + 4, C.n9); P(x - 4, by + 4, C.n9);
  // arms by pose
  const wipe = pose === 'wipe' ? (step(t, 6) % 2 ? 2 : 0) : 0;
  if (pose === 'wipe') { R(x - 9 - wipe, by + 4, 5, 2, C.u2); R(x - 11 - wipe, by + 3, 3, 3, C.s3); R(x - 13 - wipe, by + 5, 5, 2, C.n7); }
  else if (pose === 'yawn') { R(x - 6, by + 1, 2, 4, C.u2); R(x - 7, by - 3, 2, 3, C.s3); }
  else if (pose === 'pocket') { R(x - 6, by + 3, 2, 6, C.u2); R(x - 6, by + 9, 3, 2, C.s3); }
  else { R(x - 6, by + 2, 2, 7, C.u2); R(x - 6, by + 9, 2, 2, C.s3); }
  // head
  const hx = x + (pose === 'shake' ? (step(t, 8) % 2 ? -1 : 1) : 0), hy = by - 6 + (pose === 'look' ? 1 : 0);
  L.ell(hx, hy, 6, 6, (nx, ny) => nx + ny < -.9 ? C.s4 : nx > .5 ? C.s2 : C.s3);
  L.ell(hx + 1, hy - 2, 6, 4.5, (nx, ny, X, Y) => (X >= hx || Y < hy - 3) ? (nx + ny < -.8 ? C.h2 : C.h1) : null);
  P(hx - 2, hy - 7, C.h1); P(hx + 1, hy - 7, C.h1); P(hx + 3, hy - 6, C.h2); P(hx - 1, hy - 8, C.h1);   // spikes
  const shut = pose === 'yawn';
  if (shut) { R(hx - 4, hy, 2, 1, C.ink); } else { P(hx - 4, hy - 1, C.ink); P(hx - 4, hy, C.ink); }
  P(hx - 4, hy + 1, C.v2); P(hx - 3, hy + 1, C.v2);   // dark circles
  if (pose === 'yawn') R(hx - 5, hy + 2, 2, 3, C.r1); else P(hx - 5, hy + 3, C.s1);
  L.outline(C.ink);
  // a soft shadow
  fb.ell(x, y, 7, 2, (nx, ny, X, Y) => bayer(X, Y) < .5 ? C.n1 : null);
  L.over(fb);
  if (pose === 'stiff' && step(t, 1.5) % 2 === 0) { fb.px(hx + 5, hy - 3, C.rain3); fb.px(hx + 5, hy - 2, C.rain2); }
}
// the raincoat, top-down, from behind (facing up), feet at (x, y)
function coatTop(t, x, y, walk) {
  const L = layer(), f = walk ? step(t, 8) % 4 : 0, br = !walk && step(t, 1.5) % 2 ? 1 : 0;
  const bootA = f === 1 ? -1 : 0, bootB = f === 3 ? -1 : 0;
  L.rect(x - 4, y - 3 + bootA, 3, 4, C.y2); L.rect(x + 1, y - 3 + bootB, 3, 4, C.y2); L.rect(x - 4, y - 3 + bootA, 1, 3, C.y3); L.rect(x + 1, y - 3 + bootB, 1, 3, C.y3);
  L.poly([[x - 4, y - 19 + br], [x + 4, y - 19 + br], [x + 7, y - 2], [x - 7, y - 2]], (X, Y) => X > x + 3 ? C.y1 : X < x - 3 ? C.y4 : (bayer(X, Y) < .3 ? C.y4 : C.y3));
  L.rect(x, y - 18 + br, 1, 15, C.y2); for (let k = 0; k < 3; k++) L.px(x - 5 + k * 5, y - 6, C.y2);
  L.ell(x, y - 21 + br, 5, 5, (nx, ny) => nx + ny < -.6 ? C.y5 : nx > .4 ? C.y2 : C.y3); L.vline(x, y - 25 + br, y - 17 + br, C.y2);
  L.outline(C.ink); fb.ell(x, y, 7, 2, (nx, ny, X, Y) => bayer(X, Y) < .5 ? C.n1 : null); L.over(fb);
  for (let k = 0; k < 2; k++) { const dy = ((t * 30 + k * 7) % 10); fb.px(x - 6 + k * 12, y - 4 + dy * .4, C.rain3); }
}

// ———————————————— the rule paper ————————————————
function paper(t) {
  const up = ss(TT.paperUp, TT.paperUp + .5, t), down = ss(TT.paperOut, TT.paperOut + .45, t), Y = Math.round(lerp(330, 40, up) + down * 300), X = 14, PW = 152, PH = 236;
  // crumpled sheet: a jagged edge, low-frequency creases (light/dark), fold lines
  for (let y = 0; y < PH; y++) {
    const jl = (hash(y >> 2, 1) * 3) | 0, jr = (hash(y >> 2, 2) * 3) | 0;
    for (let x = jl; x < PW - jr; x++) {
      const X0 = X + x, Y0 = Y + y; if (Y0 < 0 || Y0 >= H) continue;
      const u = x / PW, v = y / PH, cr = Math.sin(u * 13 + v * 5) * .35 + Math.sin(u * 4 - v * 15 + 1) * .35 + (hash(x >> 2, y >> 2, 5) - .5) * .35;
      let c = cr > .55 ? C.p4 : cr < -.6 ? C.p2 : C.p3; if (bayer(X0, Y0) < .12 && cr > .2) c = C.p4;
      if (Math.abs(y - PH * .48 - (x - PW / 2) * .08) < .6) c = C.p2; if (Math.abs(x - PW * .52) < .6 && hash(y, 4) < .8) c = C.p2;
      if (Math.abs(y - PH * .48 - (x - PW / 2) * .08 + 1) < .6) c = C.p4;
      fb.px(X0, Y0, c);
    }
  }
  fb.rect(X + 3, Y + PH, PW - 3, 2, C.ink); fb.rect(X + PW - 1, Y + 3, 2, PH, C.ink);
  // the rules, typed: dark ink, key words in red (ALL-CAPS words), underlined
  let ly = Y + 10;
  for (const r of TL.paper) {
    const n = Math.floor(Math.max(0, t - r.a) * r.cps), lines = wrap(r.text, PW - 20); let used = 0;
    for (const ln of lines) {
      let x = X + 10, k = Math.max(0, n - used);
      for (const w of ln.split(' ')) {
        const cc = charCount(w), red = r.red || (w.replace(/[^\p{L}]/gu, '').length > 1 && w === w.toUpperCase() && /\p{L}/u.test(w));
        const x2 = text(fb, w, x, ly, red ? C.r2 : C.n1, null, k); if (red && k > 0 && !r.red) fb.hline(x, x2 - 2, ly + 14, C.r2);
        k -= cc + 1; x += textW(w + ' ') + 1;
      }
      used += charCount(ln) + 1; ly += LINE_H;
    }
    ly += 6;
  }
}

// ———————————————— medium shot: behind the counter, the freezers behind ————————————————
function medium(t, o) {
  // ceiling, the neon tube, the back wall
  fb.rect(0, 0, W, 50, (x, y) => bayer(x, y) < y / 90 ? C.n2 : C.n1);
  const lit = o.light > .5;
  fb.rect(30, 20, 120, 4, C.ink); fb.rect(31, 21, 118, 2, lit ? C.n9 : C.n3); if (lit) fb.rect(31, 24, 118, 2, (x, y) => bayer(x, y) < .5 ? C.n6 : C.n2);
  // three tall freezer doors across the back
  for (let i = 0; i < 3; i++) {
    const x0 = 4 + i * 58; fb.rect(x0, 50, 56, 140, C.n1); fb.rect(x0 + 3, 54, 50, 132, (x, y) => !lit ? C.n2 : bayer(x, y) < .3 + (y - 54) / 300 ? C.f2 : C.f3);
    for (let s = 0; s < 5; s++) { fb.rect(x0 + 3, 74 + s * 22, 50, 2, lit ? C.f4 : C.n3); for (let p = 0; p < 8; p++) fb.rect(x0 + 5 + p * 6, 64 + s * 22, 4, 10, [C.orange, C.blue, C.mustard, C.pink, C.u3, C.n8][(i * 5 + s * 3 + p) % 6]); }
    fb.rect(x0 + 47, 100, 2, 30, C.n7);
  }
  // the floor and the far end: the last shelf on the left, where it stood
  fb.rect(0, 190, W, 60, (x, y) => (x / 14 + y / 7 | 0) % 2 ? C.n3 : C.n2);
  fb.rect(4, 140, 30, 52, C.ink); fb.rect(5, 141, 28, 50, C.w2); for (let s = 0; s < 4; s++) { fb.rect(5, 150 + s * 12, 28, 1, C.w1); for (let p = 0; p < 5; p++) fb.rect(7 + p * 5, 143 + s * 12, 4, 6, [C.orange, C.blue, C.mustard, C.pink][(s + p) % 4]); }
  if (o.farCoat) {   // small, back turned, at the last shelf
    const x = 40, y = 194, br = step(t, 1.5) % 2;
    fb.rect(x - 4, y - 4, 3, 4, C.y2); fb.rect(x + 1, y - 4, 3, 4, C.y2);
    fb.poly([[x - 4, y - 26 + br], [x + 4, y - 26 + br], [x + 7, y - 3], [x - 7, y - 3]], (X) => X > x + 3 ? C.y1 : X < x - 2 ? C.y4 : C.y3);
    fb.ell(x, y - 29 + br, 5, 5, (nx) => nx > .3 ? C.y2 : C.y3);
  }
  if (o.bigCoat) {   // right behind him: a tall yellow hood over his shoulder, the face a black void
    const L = layer(), x = 58, br = step(t, 1.5) % 2;
    L.poly([[x - 26, 92 + br], [x + 26, 92 + br], [x + 44, 320], [x - 46, 320]], (X, Y) => { const nx = (X - x) / 40; return nx > .45 ? C.y1 : nx > .15 ? C.y2 : nx < -.5 ? C.y4 : (bayer(X, Y) < .2 ? C.y4 : C.y3); });
    for (let k = 0; k < 4; k++) L.line(x - 8 + k * 9, 130, x - 14 + k * 12, 320, C.y2);
    L.ell(x, 78 + br, 30, 34, (nx, ny) => nx + ny < -.7 ? C.y5 : nx > .5 ? C.y2 : C.y3);
    L.ell(x + 4, 86 + br, 20, 23, (nx, ny) => C.ink);   // the void inside the hood
    L.vline(x - 1, 44 + br, 60 + br, C.y2);
    L.outline(C.ink); L.over(fb);
    for (let k = 0; k < 5; k++) { const dy = (t * 40 + k * 13) % 60; fb.px(x - 30 + k * 15, 150 + dy, C.rain3); }
  }
  // Nam, waist-up, head bowed over the counter (the far side of the counter faces us)
  const L = layer(), wide = o.wide || 0, nx0 = 112, ny0 = 150, bw = step(t, 2) % 2, DROP = o.drop || 0; o = { ...o, drop: 0 };
  L.poly([[nx0 - 34, 192 + bw + (o.drop || 0)], [nx0 + 36, 192 + bw + (o.drop || 0)], [nx0 + 46, 262], [nx0 - 44, 262]], (X, Y) => { const v = (X - nx0) / 45; return v > .55 ? C.u1 : v < -.55 ? C.u3 : bayer(X, Y) < .08 ? C.u3 : C.u2; });
  L.poly([[nx0 - 10, 190 + (o.drop || 0)], [nx0 + 10, 190 + (o.drop || 0)], [nx0, 204 + (o.drop || 0)]], C.s3);
  L.rect(nx0 - 26, 212 + (o.drop || 0), 14, 9, C.n8); L.rect(nx0 - 25, 213 + (o.drop || 0), 12, 2, C.u4); L.rect(nx0 - 24, 216 + (o.drop || 0), 6, 1, C.n4);   // name badge
  // the wiping arm on the counter
  const wx = o.wipe ? Math.round(Math.sin(t * 5) * 10) : 0;
  L.cap([[nx0 - 30, 205 + (o.drop || 0)], [nx0 - 40 + wx / 2, 236], [nx0 - 22 + wx, 252]], 7, [C.u1, C.u2, C.u3]);
  L.ell(nx0 - 18 + wx, 252, 8, 6, (nx, ny) => S3s(nx, ny, [C.s2, C.s3, C.s4])); L.rect(nx0 - 26 + wx, 255, 18, 6, C.n7); L.rect(nx0 - 26 + wx, 255, 18, 1, C.n9);
  // the head, bowed: hair (big spikes), the face seen from above, dark circles
  const hx = nx0, hy = ny0 - (o.lift || 0) * 6;
  L.ell(hx, hy + 18, 9, 10, (nx, ny) => S3s(nx, ny, [C.s1, C.s2, C.s3]));   // neck
  L.ell(hx, hy, 24, 25, (nx, ny) => S3s(nx, ny, [C.s2, C.s3, C.s4]));
  L.ell(hx, hy - 8 + (o.lift || 0) * 4, 26, 21, (nx, ny, X, Y) => Y < hy + 2 - (o.lift || 0) * 6 ? S3s(nx, ny, [C.h1, C.h1, C.h2]) : null);
  for (const [sx, sy, ex, ey] of [[-14, -16, -22, -30], [-2, -22, -6, -38], [10, -20, 14, -36]]) L.poly([[hx + sx - 5, hy + sy], [hx + sx + 5, hy + sy], [hx + ex, hy + ey]], C.h1);
  for (const [a, b] of [[-14, -12], [0, -16], [12, -12]]) L.line(hx + a, hy + b, hx + a + 4, hy + b + 6, C.h2);
  const ey = hy + 6 + (o.lift || 0) * 3;
  if (o.lift > .5 || wide > 0) {   // eyes wide open, looking up
    for (const ex of [hx - 10, hx + 10]) { L.rect(ex - 4, ey - 3, 8, 6, C.eye); L.rect(ex - 1, ey - 1, 2, 2, C.ink); L.rect(ex - 4, ey - 4, 8, 1, C.ink); }
  } else {
    for (const ex of [hx - 10, hx + 10]) { L.rect(ex - 4, ey, 8, 1, C.ink); L.rect(ex - 3, ey + 1, 6, 1, C.s2); }   // lowered lids
  }
  for (const ex of [hx - 10, hx + 10]) { L.rect(ex - 4, ey + 4, 8, 1, C.v2); L.rect(ex - 3, ey + 5, 6, 1, C.v1); }   // dark circles
  L.rect(hx - 1, ey + 6, 3, 5, C.s2); L.rect(hx - 3, ey + 14, 7, 1, C.s1);
  L.outline(C.ink); L.over(fb, 0, DROP);
  if (o.sweat >= 0) { const d = o.sweat, sx = hx + 22, sy = hy - 4 + d * 70; if (d < 1) { fb.px(sx, sy, C.rain3); fb.px(sx, sy + 1, C.rain2); fb.px(sx - 1, sy + 1, C.rain2); fb.px(sx, sy + 2, C.rain1); } }
  // the counter top and front (nearest to us)
  fb.rect(0, 258, W, 6, (x, y) => y === 258 ? C.w4 : C.w3); fb.rect(0, 264, W, 56, (x, y) => (y - 264) % 14 === 0 ? C.w1 : bayer(x, y) < .15 ? C.w3 : C.w2);
  fb.rect(132, 228, 36, 30, C.ink); fb.rect(133, 229, 34, 28, C.n4); fb.rect(135, 231, 30, 12, lit ? C.f3 : C.n3); fb.rect(135, 246, 30, 9, C.n6);   // the register
}

// ———————————————— under the counter ————————————————
function under(t) {
  fb.clear(C.ink);
  // the gap of light at the bottom: the floor beyond the counter's open side
  fb.rect(0, 262, W, 34, (x, y) => bayer(x, y) < .35 - (y - 262) / 120 + (x > 120 ? .1 : 0) ? C.n3 : C.n2);
  fb.rect(0, 262, W, 1, C.n1); fb.rect(0, 296, W, 24, C.ink);
  // the boots: step in from the right, stop at the edge
  if (t >= TT.stepsA) {
    const u = seg(t, TT.stepsA, TT.bootsStop), steps = 6, k = Math.min(steps, Math.floor(u * steps + .001)), bx = Math.round(200 - k * 15);
    for (const [i, dx] of [[0, 0], [1, 22]]) {
      const lift = !(u >= 1) && (k % 2 === i) ? -3 : 0, x = bx + dx, y = 290 + lift;
      fb.rect(x - 9, y - 26, 18, 22, C.ink); fb.rect(x - 16, y - 8, 25, 10, C.ink); fb.rect(x - 8, y - 25, 16, 20, (X, Y) => X > x + 4 ? C.y1 : X < x - 4 ? C.y4 : C.y3); fb.ell(x - 4, y - 3, 11, 5, (nx, ny) => ny < -.4 && nx < 0 ? C.y5 : nx > .5 ? C.y1 : C.y3); fb.rect(x - 15, y + 1, 24, 2, C.y1); fb.rect(x - 9, y - 27, 18, 4, C.y2); fb.rect(x - 8, y - 26, 16, 1, C.y4);
      for (let j = 0; j < 3; j++) { const dy = ((t * 18 + j * 5 + i * 3) % 12); fb.px(x - 6 + j * 6, y + dy * .5, C.rain3); }
    }
    if (u >= 1) for (let j = 0; j < 16; j++) fb.px(bx - 10 + j * 3, 292 + (j % 2), j % 3 ? C.rain1 : C.rain2);   // the puddle spreading
  }
  // his eyes, wide, trembling a pixel; a faint rim of face
  const jx = step(t, 12) % 3 - 1, blink = t > TT.blink && t < TT.blink + .12;
  fb.ell(90, 150, 52, 30, (nx, ny, x, y) => bayer(x, y) < .08 * (1 - nx * nx - ny * ny) ? C.s1 : null);
  for (const ex of [64, 116]) {
    if (blink) { fb.rect(ex - 10, 150, 20, 2, C.s1); continue; }
    fb.ell(ex, 150, 10, 7, C.eye); fb.rect(ex - 2 + jx, 147, 4, 5, C.ink); fb.px(ex - 1 + jx, 147, C.n9);
    fb.rect(ex - 10, 142, 20, 1, C.s1); fb.rect(ex - 8, 158, 16, 1, C.v1);
  }
}

// ———————————————— the phone close-up ————————————————
function phone(t) {
  fb.clear(C.ink);
  const vib = t < TT.buzz + .6 && t >= TT.buzz ? (step(t, 24) % 2 ? 1 : -1) : 0, glow = ss(TT.buzz, TT.buzz + .3, t);
  // the eyes behind him, in the dark (top left), slowly opening
  const op = ss(TT.eyesOpen, TT.eyesOpen + 1.2, t);
  if (op > 0) { const ry = Math.max(.6, op * 4); for (const ex of [22, 48]) { fb.ell(ex, 50, 14, 10, (nx, ny, x, y) => bayer(x, y) < .45 * op * (1 - nx * nx - ny * ny) ? C.n4 : null); fb.ell(ex, 50, 7, ry, C.eye); } }
  // his face, lit from below by the phone
  const hx = 104, hy = 116;
  fb.ell(hx, hy + 44, 18, 14, (nx, ny) => ny > 0 ? C.s3 : C.s2);
  fb.ell(hx, hy, 46, 50, (nx, ny, x, y) => { const v = ny * .9 - .1; return glow > .3 ? (v > .45 ? C.s4 : v > -.1 ? (bayer(x, y) < .5 ? C.s3 : C.s2) : C.s2) : C.s1; });
  fb.ell(hx, hy - 30, 50, 34, (nx, ny, x, y) => y < hy - 20 ? (nx + ny < -.8 ? C.h2 : C.h1) : null);
  for (const [sx, sy, ex, ey] of [[-42, -24, -62, -20], [-26, -44, -44, -78], [-4, -52, -8, -88], [18, -48, 32, -82], [38, -32, 60, -50]]) fb.poly([[hx + sx - 11, hy + sy], [hx + sx + 11, hy + sy], [hx + ex, hy + ey]], (x, y) => bayer(x, y) < .35 ? C.n2 : C.h2);
  for (const [a, b] of [[-30, -40], [-6, -50], [20, -44]]) fb.line(hx + a, hy + b, hx + a + 8, hy + b + 14, C.h2);
  for (const ex of [hx - 20, hx + 20]) {   // wide eyes, looking down at the phone; the dark circles; under-light on the lids
    fb.ell(ex, hy + 4, 12, 9, C.eye); fb.rect(ex - 3, hy + 6, 6, 6, C.ink); fb.rect(ex - 2, hy + 6, 2, 2, C.ph2);
    fb.rect(ex - 12, hy - 6, 24, 2, C.ink); fb.rect(ex - 10, hy + 14, 20, 2, C.v2); fb.rect(ex - 8, hy + 16, 16, 1, C.v1);
    fb.rect(ex - 11, hy - 12, 22, 3, C.h1);
  }
  fb.rect(hx - 3, hy + 16, 6, 12, C.s2); fb.rect(hx - 4, hy + 28, 8, 2, C.s4);
  fb.rect(hx - 10, hy + 38, 20, 3, C.s1); fb.rect(hx - 8, hy + 39, 16, 1, C.r1);
  if (t > TT.ting1) { fb.px(hx - 44, hy - 10, C.rain3); fb.px(hx - 44, hy - 9, C.rain2); fb.px(hx - 45, hy - 8, C.rain2); }
  // the phone and his hands at the bottom; its glow washing up
  const px0 = 84 + vib, py0 = 176;
  fb.ell(px0 + 16, py0 + 10, 60, 40, (nx, ny, x, y) => bayer(x, y) < glow * .3 * (1 - nx * nx - ny * ny) ? C.ph1 : null);
  fb.rect(px0 - 2, py0 - 2, 36, 48, C.ink); fb.rect(px0, py0, 32, 44, C.n2); fb.rect(px0 + 2, py0 + 3, 28, 36, glow > .2 ? C.ph1 : C.n1); fb.rect(px0 + 2, py0 + 3, 28, 4, C.ph2);
  if (t > TT.ting1) { fb.rect(px0 + 4, py0 + 10, 20, 6, C.n9); } if (t > TT.ting2) fb.rect(px0 + 4, py0 + 18, 22, 8, C.r3);
  for (const [x, w] of [[px0 - 12, 14], [px0 + 30, 14]]) fb.rect(x, py0 + 20, w, 26, (X, Y) => bayer(X, Y) < .5 ? C.s3 : C.s2);
}

// ———————————————— CRT noise and the glitch ————————————————
function crtNoise(t, amt = 1) {
  const f = step(t, 24);
  for (let i = 0; i < 40 * amt; i++) { const x = hash(i, f, 1) * W | 0, y = hash(i, f, 2) * H | 0, c = fb.get(x, y); if (c !== T && c < 9) fb.px(x, y, Math.min(9, c + 2)); }
  const by = (t * 37) % (H + 20) - 10; for (let y = Math.max(0, by | 0); y < Math.min(H, by + 3); y++) for (let x = 0; x < W; x++) { const c = fb.d[y * W + x]; if (c >= 1 && c <= 7) fb.d[y * W + x] = c + 1; }
}
function staticNoise(t) { const f = step(t, 24); for (let y = 0; y < H; y++) { const roll = ((y + f * 7) % 40) < 6 ? 2 : 0; for (let x = 0; x < W; x++) fb.d[y * W + x] = NIGHT[Math.min(7, (hash(x, y, f) * 8 | 0) + roll)]; } }

// ———————————————— the director ————————————————
// the raincoat's walk: door → down the aisle → the last shelf; footprints laid along the way
const PATH = [[36, 278], [36, 250], [40, 210], [42, 150], [42, 100], [40, 76]];
const coatPos = t => { const u = seg(t, TT.inside - .4, TT.atShelf); let tot = 0; const L = []; for (let i = 0; i + 1 < PATH.length; i++) { const l = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]); L.push(l); tot += l; } let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(PATH[i][0], PATH[i + 1][0], k), lerp(PATH[i][1], PATH[i + 1][1], k)]; } d -= L[i]; } return PATH[PATH.length - 1]; };
for (let k = 0; k < 40; k++) { const tt = TT.inside - .3 + k * (TT.atShelf - TT.inside + .3) / 40, [x, y] = coatPos(tt); FOOT.push({ x: Math.round(x + (k % 2 ? 2 : -4)), y: Math.round(y - 1), t: tt }); }
const shotAt = t => TL.shots.find(s => t >= s.a && t < s.b) || TL.shots[TL.shots.length - 1];
const box = id => TL.boxes.find(b => b.id === id);
// light level in the medium shot: flicker 1 (violent: off, on, off, on), flicker 2 (a longer off)
function lightAt(t) {
  const f1 = [[0, .125], [.25, .375], [.46, .54]], f2 = [[0, .33], [.42, .5]];
  for (const [a, b] of f1) if (t >= TT.fl1 + a && t < TT.fl1 + b) return 0;
  for (const [a, b] of f2) if (t >= TT.fl2 + a && t < TT.fl2 + b) return 0;
  if (t >= TT.fl3 - .1) return 0;
  return 1;
}
// palette step fade in/out at shot edges: 0 = full, 1 = black
function fadeAt(t) {
  const q = x => Math.round(clamp(x, 0, 1) * 4) / 4;
  if (t < .35) return q(1 - t / .35);
  if (t >= TT.dark && t < TT.paperUp) return q((t - TT.dark) / .6) * .85;
  if (t >= TT.paperUp && t < 21.75) return null;   // the paper shot: the store held dark behind the sheet
  if (t >= 21.75 && t < 22.25) return q(1 - (t - 21.75) / .5);
  if (t >= 41.6 && t < 42.0) return q((t - 41.6) / .4);
  if (t >= 42.0 && t < 42.3) return q(1 - (t - 42.0) / .3);
  return 0;
}

window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t); let lut = LUT.full, crt = 1, noiseAmt = 1;
  fb.clear(C.ink);
  if (shot.id === 'store' || shot.id === 'shrug' || shot.id === 'enter' || shot.id === 'paper') {
    const st = shot.id === 'paper' ? TT.dark : t;
    const doorO = ss(TT.door, TT.door + .4, t) * (1 - ss(TT.inside + .4, TT.inside + 1, t));
    store(st, { glint: t > TT.look && t < TT.dark, noPaper: t > TT.pocket, door: doorO });
    let pose = 'idle';
    if (t < TT.clock) pose = t > TT.yawn && t < TT.yawn + 1.6 ? 'yawn' : 'idle';
    else if (t < TT.dark) pose = t > TT.look ? 'look' : 'idle';
    else if (t < TT.pocket) pose = 'look';
    else if (t < TT.wipe) pose = t < TT.pocket + .5 ? 'pocket' : 'shake';
    else if (t < TT.excl) pose = 'wipe';
    else pose = 'stiff';
    if (shot.id !== 'paper') namTop(t, 156, 236, pose);
    if (shot.id === 'enter' && t >= TT.door + .3) { const [x, y] = coatPos(t); coatTop(t, Math.round(x), Math.round(y), t < TT.atShelf); }
    if (shot.id === 'shrug') bubble(156, 203, '?', t - TT.q);
    if (shot.id === 'enter' && t >= TT.excl) bubble(156, 203, '!', t - TT.excl);
    if (shot.id === 'store' && t >= box('start').a) dialog(box('start'), t, 264);
    if (shot.id === 'shrug' && t >= box('nam').a && t < box('nam').b) dialog(box('nam'), t, 262);
    if (shot.id === 'paper') {
      const fd = Math.min(.85, Math.round(seg(t, TT.dark, TT.dark + .6) * 4) / 4); const dark = darkLut(fd, false);
      const mask = new Uint8Array(W * H);
      const before = fb.d.slice(); paper(t); for (let i = 0; i < fb.d.length; i++) if (fb.d[i] !== before[i]) mask[i] = 1;
      out.present(fb, dark, LUT.full, (x, y) => mask[y * W + x] || (fb.d[y * W + x] >= 32 && fb.d[y * W + x] <= 35)); crtNoise(t, .5); out.show(1); return;
    }
  } else if (shot.id === 'flicker') {
    const L = lightAt(t), sweat = t > TT.sweat ? Math.min(1, (t - TT.sweat) / 1.6) : -1;
    const drop = t > TT.dive ? Math.round(ss(TT.dive, TT.fl3, t) * 120) : 0;
    medium(t, { light: L, farCoat: t < TT.fl1 + .125, bigCoat: t >= TT.fl2 + .1, wipe: t < TT.fl2, sweat: sweat > 0 && sweat < 1 ? sweat : -1, lift: ss(TT.eyesWide - .3, TT.eyesWide, t), drop });
    lut = L ? LUT.full : LUT['d0.85'];
    if (t >= TT.fl2) {   // the heartbeat edge: a red dithered border on each beat, faster and faster
      const bpm = lerp(70, 150, seg(t, TT.fl2, TT.fl3)), ph = ((t - TT.fl2) * bpm / 60) % 1, k = ph < .15 ? 1 - ph / .15 : 0;
      if (k > 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.min(x, y, W - 1 - x, H - 1 - y); if (d < 10 && bayer(x, y) < k * (1 - d / 10) * .9) fb.px(x, y, d < 4 ? C.r2 : C.r1); }
    }
  } else if (shot.id === 'under') {
    under(t); noiseAmt = .6;
  } else if (shot.id === 'phone') {
    if (t >= TT.static) { if (t >= TT.black) { fb.clear(C.ink); out.present(fb, LUT.full); out.show(0); return; } staticNoise(t); out.present(fb, LUT.full); out.show(1); return; }
    phone(t); lut = LUT.phone;
    const s1 = box('sms1'), s2 = box('sms2');
    if (t >= s1.a) {   // the two messages stack in one black box with the sender's name
      const l1 = wrap(s1.text, 152), l2 = t >= s2.a ? wrap(s2.text, 152) : [], hgt = (l1.length + l2.length) * LINE_H + 16 + (l2.length ? 4 : 0), Y = 314 - hgt;
      boxFrame(6, Y, 168, hgt); nameTag(10, Y - 11, s1.who);
      const n1 = Math.floor((t - s1.a) * s1.cps); let used = 0; l1.forEach((ln, i) => { text(fb, ln, 13, Y + 6 + i * LINE_H - 2, C.n9, C.n3, Math.max(0, n1 - used)); used += charCount(ln) + 1; });
      if (l2.length) { const n2 = Math.floor((t - s2.a) * s2.cps); used = 0; const y2 = Y + 10 + l1.length * LINE_H; fb.hline(13, 166, y2 - 3, C.n3); l2.forEach((ln, i) => { text(fb, ln, 13, y2 + i * LINE_H - 2, C.r4, C.r1, Math.max(0, n2 - used)); used += charCount(ln) + 1; }); }
    }
    if (t >= TT.glitch) {   // the glitch cut: torn rows, then static
      out.present(fb, lut); out.post(u => { const f = step(t, 24); for (let y = 0; y < H; y++) { const sh = hash(y >> 3, f) < .5 ? Math.round((hash(y >> 2, f, 3) - .5) * 60) : 0; if (!sh) continue; const row = u.slice(y * W, y * W + W); for (let x = 0; x < W; x++) u[y * W + x] = row[((x - sh) % W + W) % W]; } }); out.show(1); return;
    }
  }
  if (noiseAmt) crtNoise(t, noiseAmt);
  const fd = fadeAt(t);
  if (fd) lut = darkLut(fd, false);
  out.present(fb, lut); out.show(crt);
};
// a model sheet of the sprites and the type (?sheet=1)
if (Q.has('sheet')) { window.render = () => { fb.clear(C.n2); namTop(0, 30, 60, 'idle'); namTop(.3, 60, 60, 'yawn'); namTop(.1, 90, 60, 'wipe'); namTop(0, 120, 60, 'stiff'); coatTop(0, 150, 60, false); coatTop(.1, 30, 110, true); bubble(60, 100, '?', 1); bubble(90, 100, '!', 1);
  text(fb, 'ĐỪNG CHUI XUỐNG GẦM QUẦY.', 6, 120, C.n9); text(fb, 'Lại trò đùa nhảm nhí của', 6, 138, C.n9); text(fb, 'thằng ca chiều... Ê quên dặn,', 6, 154, C.n9); text(fb, 'tờ giấy dưới máy là của', 6, 170, C.n9); text(fb, 'Đèn tủ đông nháy 3 lần: Ố Ấ ữ ợ ỷ', 6, 186, C.n9);
  out.present(fb, LUT.full); out.show(0); }; }
window.READY = true;
