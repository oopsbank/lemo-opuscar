// FLOOR -99 — a 65 s vertical pixel-art action-horror short (16-bit RPG grammar). One indexed framebuffer, eight shots, all in code.
import { W, H, T, C, FB, layer, LUT, darkLut, lutMap, whiteLut, makeOut, bayer, hash, clamp, lerp, ss, seg } from './px.js';
import { text, textW, wrap, charCount, LINE_H } from './font.js';

const TL = await fetch('timeline.json').then(r => r.json()), TT = TL.t, DUR = TL.dur;
const DURS = await fetch('voices/dur.json').then(r => r.json()).catch(() => ({}));
const fb = new FB(), out = makeOut(document.getElementById('out'));
const step = (t, f) => Math.floor(t * f), ease = x => x * x * (3 - 2 * x);
const S3 = (nx, ny, c) => { const v = -(nx * .7 + ny * .7); return v > .45 ? c[2] : v < -.45 ? c[0] : c[1]; };
const HOOD = [C.u1, C.u2, C.u3], SKIN = [C.s2, C.s3, C.s4], STEEL = [C.w1, C.w2, C.w3], JEAN = [C.orange, C.n3, C.n4];
const LUTS = {
  red: lutMap(([r, g, b]) => [r * .7 + 70, g * .45, b * .45]),
  blue: lutMap(([r, g, b], i) => i >= 14 && i <= 17 ? [r, g, b] : [r * .32, g * .45, b * .7 + 18]),
  redRoom: lutMap(([r, g, b]) => [r * .8 + 40, g * .35, b * .35]),
};

// ———————————————— UI ————————————————
function win(x, y, w, h, border, fill = C.ink) { fb.rect(x + 1, y, w - 2, h, C.ink); fb.rect(x, y + 1, w, h - 2, C.ink); fb.rect(x + 2, y + 1, w - 4, 1, border); fb.rect(x + 2, y + h - 2, w - 4, 1, border); fb.rect(x + 1, y + 2, 1, h - 4, border); fb.rect(x + w - 2, y + 2, 1, h - 4, border); fb.rect(x + 2, y + 2, w - 4, h - 4, fill); }
function banner(lines, y, col, border, show = true) { if (!show) return; const w = Math.max(...lines.map(l => textW(l))) + 14, x = Math.round((W - w) / 2), h = lines.length * LINE_H + 6; win(x, y, w, h, border); lines.forEach((l, i) => text(fb, l, x + 7, y + 1 + i * LINE_H, col, null)); }
function nameTag(x, y, who, col = C.n9) { const w = textW(who) + 10; fb.rect(x, y, w, 14, C.ink); fb.rect(x + 1, y + 1, w - 2, 12, col); fb.rect(x + 2, y + 2, w - 4, 10, C.ink); text(fb, who, x + 5, y - 3, col); }
function box(b, t, o = {}) {
  const lines = wrap(b.text, 152), h = Math.max(30, lines.length * LINE_H + 12), Y = o.y ?? 214;
  win(6, Y, 168, h, o.border ?? C.n9); nameTag(10, Y - 11, b.who, o.tag ?? C.n9);
  const n = Math.floor(Math.max(0, t - b.a) * b.cps); let used = 0;
  lines.forEach((ln, i) => {
    if (o.ghost) {   // jittering letters, a wrong glyph flashing now and then
      let x = 13, k = 0; for (const ch of ln) { if (used + k >= n) break; const f = step(t, 12), jx = Math.round((hash(k, f, 1) - .5) * 2.4), jy = Math.round((hash(k, f, 2) - .5) * 2.4), wrong = hash(k, f, 3) < .06 ? '#%&?'[k % 4] : ch; text(fb, wrong, x + jx, Y + 4 + i * LINE_H - 2 + jy, hash(k, f, 4) < .2 ? C.r3 : C.n8); x += textW(ch) + 1; k++; }
    } else text(fb, ln, 13, Y + 4 + i * LINE_H - 2, o.col ?? C.n9, C.n3, Math.max(0, n - used));
    used += charCount(ln) + 1;
  });
}
// VO as a dialog box (the subtitle), typed to the length of the line
function voBox(v, t) { const d = DURS[v.id] || 1.5; if (t < v.t - .1 || t > v.t + d + 1.0) return; box({ who: 'LEO', text: v.sub, a: v.t, cps: charCount(v.sub) / Math.max(.5, d * .55) }, t, { tag: C.u4 }); }
// big ×2 outlined text
function bigText(s, cx, y, col, outline = C.ink) { const L = new FB(W, 20); L.d.fill(T); text(L, s, 0, 0, col); const w = textW(s), x0 = Math.round(cx - w); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1], [0, 2], [1, 2], [-1, 2]]) for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < w; xx++) if (L.d[yy * W + xx] !== T) fb.rect(x0 + xx * 2 + dx, y + yy * 2 + dy, 2, 2, outline); for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < w; xx++) { const c = L.d[yy * W + xx]; if (c !== T) fb.rect(x0 + xx * 2, y + yy * 2, 2, 2, typeof col === 'function' ? col(yy) : c); } }
function shift(dx, dy) { if (!dx && !dy) return; const src = fb.d.slice(); fb.clear(C.ink); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x - dx, Y = y - dy; if (X >= 0 && Y >= 0 && X < W && Y < H) fb.d[y * W + x] = src[Y * W + X]; } }
const shakeXY = (t, amt) => amt < .5 ? [0, 0] : [Math.round((hash(step(t, 24), 1) - .5) * 2 * amt), Math.round((hash(step(t, 24), 2) - .5) * 2 * amt)];
function sparks(x, y, t, t0, n = 14, spread = 30, col = [C.y5, C.y4, C.y3]) { const a = t - t0; if (a < 0 || a > .5) return; for (let i = 0; i < n; i++) { const ang = hash(i, t0 * 10 | 0, 1) * Math.PI * 2, sp = (.4 + hash(i, t0 * 10 | 0, 2)) * spread, px = x + Math.cos(ang) * sp * a * 2.2, py = y + Math.sin(ang) * sp * a * 2.2 + a * a * 60; fb.px(px, py, col[i % 3]); if (a < .2) fb.px(px - Math.cos(ang), py - Math.sin(ang), col[(i + 1) % 3]); } }
function crtNoise(t, amt = 1) { const f = step(t, 24); for (let i = 0; i < 36 * amt; i++) { const x = hash(i, f, 1) * W | 0, y = hash(i, f, 2) * H | 0, c = fb.get(x, y); if (c !== T && c < 9) fb.px(x, y, Math.min(9, c + 2)); } const by = (t * 41) % (H + 20) - 10; for (let y = Math.max(0, by | 0); y < Math.min(H, by + 3); y++) for (let x = 0; x < W; x++) { const c = fb.d[y * W + x]; if (c >= 1 && c <= 7) fb.d[y * W + x] = c + 1; } }
function staticNoise(t) { const f = step(t, 24), R = [C.n1, C.n2, C.n3, C.n4, C.n5, C.n6, C.n7, C.n8]; for (let y = 0; y < H; y++) { const roll = ((y + f * 7) % 40) < 6 ? 2 : 0; for (let x = 0; x < W; x++) fb.d[y * W + x] = R[Math.min(7, (hash(x, y, f) * 8 | 0) + roll)]; } }

// ———————————————— LEO ————————————————
// front view (shot 1): feet at (x, y); pose 'float' (thrown up, limbs out) or 'slam' (crouched) or 'stand'
function leoFront(t, x, y, pose) {
  const L = layer(), f = step(t, 12) % 2;
  if (pose === 'slam') {
    L.cap([[x - 8, y - 20], [x - 16, y - 8], [x - 12, y]], 6, JEAN); L.cap([[x + 8, y - 20], [x + 16, y - 8], [x + 12, y]], 6, JEAN);
    L.ell(x, y - 34, 20, 18, (nx, ny) => S3(nx, ny, HOOD)); L.line(x - 12, y - 48, x + 10, y - 22, C.ph1 === 0 ? 0 : C.mustard);
    L.cap([[x - 18, y - 40], [x - 28, y - 22], [x - 26, y - 6]], 5, HOOD); L.cap([[x + 18, y - 40], [x + 28, y - 22], [x + 26, y - 6]], 5, HOOD);
    L.ell(x, y - 58, 13, 13, (nx, ny) => S3(nx, ny, SKIN)); L.ell(x, y - 64, 14, 9, (nx, ny, X, Y) => Y < y - 61 ? (nx + ny < -.8 ? C.h2 : C.h1) : null);
    for (const [a, b] of [[-11, -4], [-4, -8], [5, -6], [12, -2]]) L.poly([[x + a - 3, y - 66], [x + a + 3, y - 66], [x + a + b * .4, y - 76]], C.h1);
    L.rect(x - 6, y - 58, 3, 2, C.ink); L.rect(x + 3, y - 58, 3, 2, C.ink); L.rect(x - 3, y - 51, 6, 2, C.r1);
  } else {
    const up = pose === 'float';
    L.cap([[x - 7, y - 50], [x - 14 - (up ? 6 : 0), y - 26], [x - 10 - (up ? 10 : 0), y - 4 - (up ? 8 : 0)]], 6, JEAN);
    L.cap([[x + 7, y - 50], [x + 14 + (up ? 6 : 0), y - 26], [x + 12 + (up ? 8 : 0), y - 2 - (up ? 12 : 0)]], 6, JEAN);
    for (const sx of [-1, 1]) L.rect(x + sx * (up ? 20 : 12) - 6, y - (up ? 10 : 2) - (sx > 0 && up ? 4 : 0), 12, 5, C.n8);
    L.poly([[x - 20, y - 92], [x + 20, y - 92], [x + 22, y - 48], [x - 22, y - 48]], (X, Y) => { const v = (X - x) / 22; return v > .5 ? C.u1 : v < -.5 ? C.u3 : bayer(X, Y) < .06 ? C.u3 : C.u2; });
    L.rect(x - 22, y - 52, 44, 4, C.u1); L.rect(x - 8, y - 70, 16, 8, C.u1);   // hem, pocket
    L.line(x - 18, y - 92, x + 18, y - 54, C.mustard); L.line(x - 17, y - 92, x + 19, y - 54, C.mustard);   // the backpack strap
    const ay = up ? -30 + f * 4 : 0;
    L.cap([[x - 20, y - 88], [x - 34, y - 72 + ay], [x - 40, y - 56 + ay * 1.6]], 5.5, HOOD); L.cap([[x + 20, y - 88], [x + 34, y - 74 + ay], [x + 42, y - 60 + ay * 1.6]], 5.5, HOOD);
    L.ell(x - 40, y - 54 + ay * 1.6, 4, 4, (nx, ny) => S3(nx, ny, SKIN)); L.ell(x + 42, y - 58 + ay * 1.6, 4, 4, (nx, ny) => S3(nx, ny, SKIN));
    L.ell(x, y - 94, 16, 7, (nx, ny) => S3(nx, ny, HOOD));   // the hood around the neck
    L.ell(x, y - 108, 14, 15, (nx, ny) => S3(nx, ny, SKIN));
    L.ell(x, y - 116, 15, 10, (nx, ny, X, Y) => Y < y - 112 ? (nx + ny < -.8 ? C.h2 : C.h1) : null);
    for (const [a, b] of [[-12, -4], [-4, -8], [6, -6], [13, -2]]) L.poly([[x + a - 3, y - 118], [x + a + 3, y - 118], [x + a + b * .4, y - 128]], C.h1);
    L.rect(x - 8, y - 109, 5, 5, C.eye); L.rect(x + 3, y - 109, 5, 5, C.eye); L.rect(x - 6, y - 107, 2, 2, C.ink); L.rect(x + 5, y - 107, 2, 2, C.ink);
    L.rect(x - 9, y - 112, 6, 1, C.h1); L.rect(x + 3, y - 113, 6, 1, C.h1);
    L.ell(x, y - 98, 4, 3 + f, C.r1);   // the scream
  }
  L.outline(C.ink); L.over(fb);
}
// back view, over the shoulder (shot 2b): his left shoulder and head bottom-left, the right arm reaching the panel when hitting
function leoBack(t, hitK) {
  const L = layer(), bx = 62, by = 250;
  L.poly([[bx - 62, 320], [bx - 48, by - 10], [bx + 48, by - 12], [bx + 70, 320]], (X, Y) => { const v = (X - bx) / 60; return v > .5 ? C.u1 : v < -.5 ? C.u3 : bayer(X, Y) < .05 ? C.u3 : C.u2; });
  L.cap([[bx - 30, by + 6], [bx + 40, 320]], 4, [C.mustard, C.mustard, C.y2]);   // the strap
  L.rect(bx - 60, by + 30, 26, 44, C.mustard); L.rect(bx - 58, by + 32, 22, 4, C.y2);   // the backpack side
  const hand = hitK > 0 ? [150 - 3 * (1 - hitK), 170 + 2 * (1 - hitK)] : [bx + 64, by + 40];
  L.cap(hitK > 0 ? [[bx + 40, by + 2], [bx + 90, by - 40], [hand[0] - 8, hand[1] + 4]] : [[bx + 40, by + 2], [bx + 76, by + 24], hand], 9, HOOD);
  L.ell(hand[0], hand[1], 7, 6, (nx, ny) => S3(nx, ny, SKIN));
  L.ell(bx, by - 26, 34, 18, (nx, ny) => S3(nx, ny, HOOD));   // the hood bunched on the shoulders
  L.ell(bx + 2, by - 50, 26, 28, (nx, ny) => S3(nx, ny, [C.h1, C.h1, C.h2]));   // the back of his head
  for (const [a, b] of [[-14, -60], [-2, -76], [12, -70], [22, -52]]) L.poly([[bx + a - 6, by + b + 8], [bx + a + 6, by + b + 8], [bx + a + 3, by + b - 4]], C.h1);
  L.rect(bx + 24, by - 46, 5, 9, C.s2);   // an ear
  L.outline(C.ink); L.over(fb);
}
// side view (shot 3), facing right; pose 'lean' | 'spray' | 'lever'
function leoSide(t, x, y, pose) {
  const L = layer(), br = step(t, 3) % 2;
  L.cap([[x, y - 30], [x + 4, y - 16], [x + 2, y - 2]], 4, JEAN); L.cap([[x + 4, y - 30], [x + 10, y - 16], [x + 10, y - 2]], 4, JEAN);
  L.rect(x - 3, y - 3, 9, 4, C.n8); L.rect(x + 7, y - 3, 9, 4, C.n8);
  L.poly([[x - 9, y - 62 + br], [x + 11, y - 62 + br], [x + 14, y - 30], [x - 10, y - 30]], (X) => X > x + 6 ? C.u1 : X < x - 4 ? C.u3 : C.u2);
  L.rect(x - 16, y - 58 + br, 8, 22, C.mustard); L.rect(x - 15, y - 56 + br, 6, 3, C.y2);   // backpack
  L.ell(x + 2, y - 72 + br, 9, 10, (nx, ny) => S3(nx, ny, SKIN)); L.ell(x, y - 77 + br, 10, 7, (nx, ny, X, Y) => (X < x + 4 || Y < y - 78) ? C.h1 : null);
  L.poly([[x - 6, y - 82], [x, y - 82], [x - 8, y - 90]], C.h1); L.poly([[x + 1, y - 83], [x + 6, y - 82], [x + 6, y - 91]], C.h1);
  L.rect(x + 6, y - 74 + br, 2, 2, C.ink); L.rect(x + 9, y - 69 + br, 2, 2, C.r1);   // eye, open mouth (panting)
  if (pose === 'spray') { L.cap([[x + 4, y - 58], [x + 16, y - 56], [x + 26, y - 58]], 3.5, HOOD); L.rect(x + 25, y - 64, 6, 10, C.r2); L.rect(x + 25, y - 66, 6, 2, C.n9); L.ell(x + 26, y - 57, 3, 3, (nx, ny) => S3(nx, ny, SKIN)); }
  else if (pose === 'lever') { L.cap([[x + 4, y - 58], [x - 8, y - 66], [x - 14, y - 60 + (step(t, 4) % 2) * 6]], 3.5, HOOD); }
  else L.cap([[x + 2, y - 58], [x + 6, y - 44], [x + 4, y - 34]], 3.5, HOOD);
  L.outline(C.ink); L.over(fb);
}
// low angle (shot 4): seen from below, foreshortened (big legs, small head); climbing raises him; the screwdriver arm up to the hatch
function leoLow(t, up, pry) {
  const L = layer(), x = 86, y = 300 - up;
  L.cap([[x - 18, y - 70], [x - 26, y - 30], [x - 22, y]], 12, JEAN); L.cap([[x + 16, y - 70], [x + 24, y - 34], [x + 20, y]], 12, JEAN);
  L.rect(x - 38, y - 6, 26, 10, C.n8); L.rect(x + 8, y - 6, 26, 10, C.n8);
  L.poly([[x - 26, y - 128], [x + 26, y - 128], [x + 30, y - 66], [x - 30, y - 66]], (X, Y) => { const v = (X - x) / 30; return v > .5 ? C.u1 : v < -.5 ? C.u3 : C.u2; });
  L.rect(x - 30, y - 72, 60, 6, C.u1); L.line(x - 24, y - 126, x + 26, y - 70, C.mustard); L.line(x - 23, y - 126, x + 27, y - 70, C.mustard);
  L.ell(x, y - 132, 18, 7, (nx, ny) => S3(nx, ny, HOOD));
  L.ell(x - 2, y - 146, 12, 12, (nx, ny) => S3(nx, ny, SKIN)); L.rect(x - 9, y - 140, 16, 4, C.s1);   // chin from below, looking up
  L.ell(x - 2, y - 154, 13, 8, (nx, ny, X, Y) => Y < y - 151 ? C.h1 : null);
  L.cap([[x - 24, y - 122], [x - 44, y - 96], [x - 48, y - 70]], 7, HOOD);   // the other hand grips the rail
  const reach = up > 30, jig = pry ? (step(t, 12) % 2 ? 6 : -2) : 0, hx = reach ? x + 30 + jig : x + 44, hy = reach ? Math.max(40, y - 210) : y - 76;
  L.cap(reach ? [[x + 24, y - 124], [x + 34, y - 160], [hx, hy + 10]] : [[x + 24, y - 124], [x + 40, y - 100], [hx, hy + 10]], 7, HOOD);
  L.ell(hx, hy + 6, 6, 6, (nx, ny) => S3(nx, ny, SKIN)); L.rect(hx - 1, hy - 20 + (pry ? -4 : 0), 3, 24, C.w4); L.rect(hx, hy - 20 + (pry ? -4 : 0), 1, 24, C.n9); L.rect(hx - 3, hy + 2, 7, 8, C.r2);   // the screwdriver
  L.outline(C.ink); L.over(fb);
}
// top-down on the cabin roof (shot 5); 'throw' raises the arm
function leoTop(t, x, y, pose) {
  const L = layer();
  L.rect(x - 12, y + 3, 24, 18, C.mustard); L.rect(x - 10, y + 5, 20, 3, C.y2);
  L.ell(x, y, 19, 12, (nx, ny) => S3(nx, ny, HOOD));
  let ax = x + 19, ay = y + 9;   // the throwing hand
  if (pose === 'windup') { ax = x + 22; ay = y + 22; } else if (pose === 'throw') { ax = x + 14; ay = y - 34; }
  L.cap([[x - 16, y], [x - 22, y + 12]], 6, HOOD); L.cap([[x + 16, y], [(x + 16 + ax) / 2 + 6, (y + ay) / 2], [ax, ay]], 7.5, HOOD); L.ell(ax, ay, 4.5, 4.5, (nx, ny) => S3(nx, ny, SKIN));
  L.ell(x, y - 4, 11, 11, (nx, ny) => nx + ny < -.6 ? C.h2 : C.h1);
  for (const [a, b] of [[-6, -14], [2, -16], [8, -12]]) L.poly([[x + a - 3, y - 10], [x + a + 3, y - 10], [x + a, y + b]], C.h1);
  L.outline(C.ink); L.over(fb);
  if (pose === 'throw') for (let k = 0; k < 10; k++) { const u = k / 10, px = lerp(x + 22, ax, u) + Math.sin(u * Math.PI) * 10, py = lerp(y + 22, ay, u); fb.px(px, py, C.n8); }   // the swing arc
  return [ax, ay];
}
// ———————————————— the cabin (front view) ————————————————
function cabinFront(t, o) {
  fb.rect(0, 0, W, H, C.w1);
  fb.poly([[22, 40], [158, 40], [158, 256], [22, 256]], (x, y) => (x - 22) % 34 === 0 ? C.w1 : bayer(x, y) < .1 ? C.w3 : C.w2);   // the back wall panels
  fb.poly([[0, 0], [22, 40], [22, 256], [0, 300]], (x, y) => bayer(x, y) < .2 ? C.w2 : C.w1); fb.poly([[180, 0], [158, 40], [158, 256], [180, 300]], (x, y) => bayer(x, y) < .2 ? C.w2 : C.w1);
  fb.poly([[0, 0], [180, 0], [158, 40], [22, 40]], C.n1);
  const red = o.strobe && step(t, 8) % 2 === 0;
  fb.rect(60, 14, 60, 10, C.ink); fb.rect(62, 16, 56, 6, red ? C.r3 : o.light === false ? C.n2 : C.n8);
  if (red) fb.ell(90, 30, 70, 40, (nx, ny, x, y) => bayer(x, y) < .3 * (1 - nx * nx - ny * ny) ? C.r1 : null);
  fb.poly([[0, 300], [22, 256], [158, 256], [180, 300], [180, 320], [0, 320]], (x, y) => ((x >> 2) + (y >> 2)) % 3 === 0 ? C.w3 : C.w2);   // the checker-plate floor
  // the LED panel on the right wall
  fb.rect(162, 90, 14, 40, C.ink); const s = o.led || 'B?'; text(fb, s.length > 2 ? s.slice(-2) : s, 163, 92, C.r3);
  for (let i = 0; i < 4; i++) fb.rect(165, 112 + i * 5, 6, 3, C.w3);
}
function handrail(dy) { fb.rect(0, 270 + dy, W, 7, C.ink); fb.rect(0, 271 + dy, W, 5, C.w3); fb.rect(0, 271 + dy, W, 1, C.w4); for (const x of [24, 156]) fb.rect(x - 2, 276 + dy, 5, 44, C.w2); }

// ———————————————— the director ————————————————
const shotAt = t => TL.shots.find(s => t >= s.a && t < s.b) || TL.shots[TL.shots.length - 1];
const B = id => TL.boxes.find(b => b.id === id);
const lastHit = t => { let k = 0; for (const h of TT.hits) if (t >= h) k = h; return k; };

window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t); let lut = LUT.full, sh = 0, crt = 1;
  fb.clear(C.ink);
  if (shot.id === 'fall') {
    cabinFront(t, { strobe: true, led: 'B' + (10 + (hash(step(t, 12)) * 89 | 0)) });
    const fl = ease(seg(t, TT.floatA, 2.6)), slam = ss(TT.slam, TT.slam + .12, t);
    const y = t < TT.slam ? lerp(258, 158, fl) + Math.sin(t * 9) * 2 : lerp(158, 258, slam);
    leoFront(t, 90, Math.round(y), t < TT.slam + .12 ? (t > TT.floatA ? 'float' : 'stand') : 'slam');
    handrail(step(t, 24) % 2);
    for (let k = 0; k < 8; k++) sparks(166, 104, t, k * .45, 18, 40);
    sh = t < TT.slam ? 5 : t < TT.slam + .5 ? 8 * (1 - seg(t, TT.slam, TT.slam + .5)) + 3 : 3;
    banner(['WARNING:', 'CABLE SNAP - FREE FALL'], 54, C.r3, step(t, 4) % 2 ? C.r3 : C.r1);
    if (step(t, 8) % 2 === 0) lut = LUTS.red;
    voBox(TL.vo[0], t);
  } else if (shot.id === 'panel') {
    fb.rect(0, 0, W, H, (x, y) => (x * 3 + y) % 11 === 0 ? C.w3 : C.w2);
    fb.rect(16, 70, 148, 80, C.ink); fb.rect(18, 72, 144, 76, (x, y) => bayer(x, y) < .08 ? C.r1 : C.ink);
    const stopped = t >= TT.b13, s = stopped ? 'B13' : 'B' + (14 + (hash(step(t, 20)) * 80 | 0));
    bigText(s, 90, 86, stopped ? C.r3 : C.r2, C.r1); if (stopped) bigText(s, 90, 86, C.r3, C.r1);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const bx = 40 + c * 40, by = 180 + r * 30; fb.ell(bx, by, 10, 10, C.ink); fb.ell(bx, by, 8, 8, (nx, ny) => S3(nx, ny, STEEL)); text(fb, ['B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', '>|<', '<|>', '!'][r * 3 + c].slice(0, 3), bx - 7, by - 10, C.n8); }
    sh = stopped ? 4 * (1 - seg(t, TT.b13, TT.b13 + .5)) : 1;
  } else if (shot.id === 'b13') {
    // the doors, jammed at a 30 cm gap; black beyond; claws through the gap
    fb.rect(0, 0, W, H, C.w1); fb.rect(20, 40, 140, 240, C.ink);
    const gx0 = 80, gx1 = 100;
    fb.rect(22, 42, gx0 - 22, 236, (x, y) => x % 9 === 0 ? C.w2 : bayer(x, y) < .1 ? C.w4 : C.w3); fb.rect(gx1, 42, 158 - gx1, 236, (x, y) => x % 9 === 0 ? C.w2 : bayer(x, y) < .1 ? C.w4 : C.w3);
    fb.rect(gx0 - 2, 42, 2, 236, C.w4); fb.rect(gx1, 42, 2, 236, C.w1);
    for (let i = 0; i < 9; i++) {   // shadow hands: from the gap, curling over the door edges, white claws scraping
      const y0 = 60 + i * 24 + Math.round(Math.sin(t * 6 + i * 1.7) * 4), side = i % 2 ? 1 : -1, ex = side > 0 ? gx1 + 6 + (i % 3) * 3 : gx0 - 6 - (i % 3) * 3;
      fb.cap([[90, y0 + 6], [side > 0 ? gx1 - 2 : gx0 + 2, y0], [ex, y0 + 2 + Math.round(Math.sin(t * 9 + i) * 2)]], 3.5, [C.v1, C.v2, C.v3]);
      for (let k = 0; k < 4; k++) { const cx = ex + side * 2, cy = y0 - 3 + k * 2; fb.line(cx, cy, cx + side * 4, cy + 2, C.eye); }
    }
    // the button panel on the right, sparking on each hit
    fb.rect(144, 120, 20, 80, C.ink); fb.rect(145, 121, 18, 78, C.w3); fb.ell(154, 170, 6, 6, C.ink); fb.ell(154, 170, 5, 5, (nx, ny) => S3(nx, ny, [C.r1, C.r2, C.r3])); text(fb, '>|<', 145, 150, C.ink);
    const h = lastHit(t), hk = h && t - h < .25 ? 1 - (t - h) / .25 : 0;
    for (const hh of TT.hits) sparks(152, 170, t, hh, 16, 26);
    leoBack(t, hk);
    sh = hk > .6 ? 2 : 0;
    banner(['FLOOR: B13 - VOID HALLWAY'], 36, C.n9, C.n9, t >= 6.0);
    voBox(TL.vo[1], t);
  } else if (shot.id === 'guard') {
    // left: the cabin in section; right: the hallway; floor line y 236
    fb.rect(0, 0, W, H, C.n1);
    fb.rect(0, 96, 86, 14, C.w1); fb.rect(0, 236, 86, 12, C.w1); fb.rect(0, 110, 84, 126, (x, y) => bayer(x, y) < .15 ? C.w3 : C.w2); fb.rect(0, 110, 4, 126, C.w1);
    fb.rect(30, 113, 30, 3, step(t, 7) % 5 ? C.n8 : C.n4);
    fb.rect(6, 150, 8, 14, C.ink); fb.rect(7, 151, 6, 12, C.w4); const lv = t >= TT.lever ? 1 : 0; fb.rect(9, lv ? 158 : 146, 2, 8, C.r3);   // the emergency lever
    // the hallway: tiles, wainscot, doors, a flickering neon tube, a gurney
    const neon = !(hash(step(t, 10), 3) < .25) || t > TT.slamDoor;
    fb.rect(86, 110, 94, 126, (x, y) => y > 190 ? (bayer(x, y) < .2 ? C.f1 : C.n2) : bayer(x, y) < .12 ? C.n3 : C.n2);
    fb.rect(86, 236, 94, 84, (x, y) => ((x >> 3) + (y >> 3)) % 2 ? C.n2 : C.n3); fb.rect(118, 140, 24, 52, C.n1); fb.rect(120, 142, 20, 48, C.n3); fb.rect(122, 150, 16, 8, C.f1);
    fb.rect(100, 112, 60, 3, neon ? C.f4 : C.n3); if (neon) fb.rect(96, 115, 70, 40, (x, y) => bayer(x, y) < .25 * (1 - (y - 115) / 40) ? C.f2 : null);
    fb.rect(96, 214, 26, 4, C.w3); fb.rect(98, 218, 2, 16, C.w2); fb.rect(118, 218, 2, 16, C.w2);
    // the guard: back turned; his head turns 180° to show a blank face
    const gx = 150, gy = 236, a = Math.PI * ease(seg(t, TT.turnA, TT.turnB)), Lg = layer();
    Lg.rect(gx - 6, gy - 30, 5, 30, C.pink); Lg.rect(gx + 1, gy - 30, 5, 30, C.pink); Lg.rect(gx - 7, gy - 2, 7, 3, C.ink); Lg.rect(gx, gy - 2, 7, 3, C.ink);
    Lg.poly([[gx - 11, gy - 68], [gx + 11, gy - 68], [gx + 13, gy - 28], [gx - 13, gy - 28]], (X) => X > gx + 6 ? C.v1 : X < gx - 6 ? C.n3 : C.pink); Lg.rect(gx - 13, gy - 34, 26, 3, C.ink);
    Lg.rect(gx - 15, gy - 66, 5, 30, C.pink); Lg.rect(gx + 10, gy - 66, 5, 30, C.pink);
    Lg.ell(gx, gy - 78, 9, 10, (nx, ny) => nx < -Math.cos(a) && ny > -.5 ? (nx < -Math.cos(a) + .25 ? C.s2 : C.s4) : (nx + ny < -.8 ? C.h2 : C.h1));
    Lg.rect(gx - 10, gy - 90, 20, 5, C.pink); Lg.rect(gx - 10, gy - 86, 20, 2, C.ink); Lg.rect(gx + (Math.cos(a) > 0 ? -12 : 4), gy - 87, 8, 2, C.ink);   // the cap and brim
    if (a > .2 && a < 3) for (let k = 0; k < 3; k++) Lg.line(gx - 6, gy - 69 + k, gx + 6, gy - 67 - k, C.v2);   // the twisted neck
    Lg.outline(C.ink); Lg.over(fb);
    // the shadow reaching in, cut by the doors
    if (t < TT.slamDoor) { const r = seg(t, TT.sprayEnd, TT.slamDoor); if (r > 0) fb.cap([[132, 170], [100, 168], [lerp(96, 70, r), 172 + Math.sin(t * 8) * 3]], 7, [C.v1, C.v1, C.v2]); }
    else { const k = seg(t, TT.slamDoor, TT.slamDoor + 1.2); fb.ell(72 - k * 6, lerp(172, 228, Math.min(1, k * 1.6)), 9 * (1 - k * .6), 6 * (1 - k * .6), (nx, ny, x, y) => bayer(x, y) < 1 - k ? C.v1 : null); }
    // the doors: open until the lever, then slam shut
    const dc = ss(TT.slamDoor - .15, TT.slamDoor, t); if (dc > 0) { const hgt = 63 * dc; fb.rect(82, 110, 6, hgt, C.w3); fb.rect(82, 236 - hgt, 6, hgt, C.w3); fb.rect(82, 110, 1, hgt, C.w4); }
    fb.rect(82, 96, 6, 14, C.w1); fb.rect(82, 236, 6, 12, C.w1);
    const pose = t >= TT.lever ? 'lever' : t >= TT.sprayOut ? 'spray' : 'lean';
    leoSide(t, pose === 'lever' ? 26 : 36, 236, pose);
    if (t >= TT.spray && t < TT.sprayEnd + .6) for (let i = 0; i < 60; i++) { const age = (t - TT.spray) - i * .025; if (age < 0 || age > 1.2) continue; const px = 66 + age * 70 + hash(i, 1) * 10, py = 176 + (hash(i, 2) - .5) * age * 40; fb.px(px, py, age < .5 ? C.n9 : C.n7); if (age < .8) fb.px(px + 1, py, C.n8); }
    banner(['ITEM USED: PEPPER SPRAY'], 36, C.y4, C.y4, t >= TT.spray && t < TT.spray + 2.4);
    const g = B('ghost'); if (t >= g.a && t < g.b) box(g, t, { ghost: true, border: C.r2, tag: C.r3 });
    sh = t >= TT.slamDoor && t < TT.slamDoor + .5 ? 4 * (1 - seg(t, TT.slamDoor, TT.slamDoor + .5)) + .5 : 0;
  } else if (shot.id === 'flood') {
    // looking up: the ceiling (small, far) with the light and the vent hatch; the back wall flaring out toward us
    fb.rect(0, 0, W, H, C.w1);
    fb.poly([[50, 44], [130, 44], [180, 300], [0, 300]], (x, y) => bayer(x, y) < .1 ? C.w3 : C.w2);
    fb.rect(50, 8, 80, 36, C.w2); fb.rect(52, 10, 76, 32, (x, y) => bayer(x, y) < .1 ? C.w3 : C.w2);
    const popped = t >= TT.pop;
    if (!popped) { fb.rect(58, 36, 30, 5, C.n9); fb.ell(73, 42, 40, 18, (nx, ny, x, y) => bayer(x, y) < .25 * (1 - nx * nx - ny * ny) ? C.n6 : null); } else { fb.rect(58, 36, 30, 5, C.n1); sparks(73, 38, t, TT.pop, 18, 30); }
    fb.rect(96, 46, 26, 3, C.f3); fb.rect(98, 46, 22, 1, C.f4);   // the blue indicator bar
    const opened = t >= TT.hatch, screws = TT.pry.filter(p => t < p + .3).length;
    fb.rect(94, 12, 30, 22, C.ink);
    if (!opened) { fb.rect(96, 14, 26, 18, C.w3); for (let i = 0; i < 4; i++) fb.rect(98, 17 + i * 4, 22, 1, C.w1); [[97, 15], [119, 15], [97, 29], [119, 29]].slice(0, Math.max(0, screws - 1)).forEach(([x, y]) => fb.rect(x, y, 2, 2, C.w4)); }
    else { fb.rect(96, 14, 26, 18, C.n1); fb.rect(122, 4, 4, 30, C.w3); }
    fb.rect(10, 186, 160, 5, C.w4); fb.rect(10, 190, 160, 2, C.w1);   // the handrail
    // the water: rising, black, eyes floating, hands reaching
    const wl = Math.round(lerp(312, 238, ss(TT.floodA, TT.floodA + 3.2, t)));
    const climbU = ss(TT.climb, TT.climb + 1.4, t);
    leoLow(t, climbU * 70, TT.pry.some(p => t >= p && t < p + .5));
    fb.rect(0, wl, W, H - wl, (x, y) => y === wl ? (Math.sin(x * .4 + t * 6) > .3 ? C.rain3 : C.rain2) : bayer(x, y) < .12 ? C.rain2 : C.rain1);
    for (let i = 0; i < 7; i++) { const ex = 12 + i * 24 + Math.round(Math.sin(t * 1.5 + i) * 4), ey = wl + 6 + (i % 3) * 12 + Math.round(Math.sin(t * 2 + i * 2) * 2), op = step(t + i * .3, 1.2) % 5 !== 0; if (op) { fb.rect(ex, ey, 3, 2, C.eye); fb.rect(ex + 6, ey, 3, 2, C.eye); } }
    if (t > TT.climb) for (let i = 0; i < 4; i++) { const hx = 40 + i * 32, r = ss(TT.climb + i * .4, TT.climb + 1.2 + i * .4, t), top = wl - 14 * r - Math.sin(t * 5 + i) * 4; fb.cap([[hx, wl + 4], [hx + 3, top]], 3, [C.v1, C.v1, C.v2]); for (let k = 0; k < 3; k++) fb.px(hx - 2 + k * 2, top - 3, C.eye); }
    for (const p of TT.pry) { sparks(110, 26, t, p + .25, 12, 34, [C.w4, C.y5, C.n9]); const a = t - p - .25; if (a > 0 && a < .7) { fb.rect(110 + a * 40, 26 + a * a * 200, 2, 2, C.w4); } }
    if (popped) lut = LUTS.blue;
    if (t >= TT.oxygen) { const ox = Math.round(lerp(35, 6, seg(t, TT.oxygen, TT.hatch + .6))), lines = ['OXYGEN: ' + ox + '% - FLOODING'], w = textW(lines[0]) + 14, x = Math.round((W - w) / 2); win(x, 58, w, LINE_H + 6, step(t, 3) % 2 ? C.eye : C.ph1, C.ph1); text(fb, lines[0], x + 7, 59, C.eye, null); }
    if (t >= TT.grab) { const g = ss(TT.grab, TT.grab + .3, t), gx = 66, gy = Math.round(lerp(wl + 10, 262 - climbU * 70 - 6, g)); fb.cap([[gx - 6, wl + 20], [gx, gy + 14]], 6, [C.v1, C.v1, C.v2]); fb.ell(gx + 2, gy + 6, 9, 7, C.v1); for (let k = 0; k < 4; k++) fb.line(gx - 5 + k * 4, gy, gx - 6 + k * 4, gy - 7, C.eye); }
    voBox(TL.vo[2], t);
    sh = t >= TT.pop && t < TT.pop + .3 ? 3 : t >= TT.grab && t < TT.grab + .4 ? 4 : t >= TT.hatch && t < TT.hatch + .3 ? 2 : 0;
  } else if (shot.id === 'shaft') {
    // looking straight down the shaft: walls streaming up past the cabin roof; rails sparking
    const sp = t * 520;
    fb.rect(0, 0, W, H, (x, y) => ((y + sp) % 60 < 2) ? C.n4 : ((y + sp * .6) % 23 < 1 && (x < 30 || x > 150)) ? C.n3 : x < 30 || x > 150 ? C.n2 : C.n1);
    for (const rx of [24, 152]) { fb.rect(rx, 0, 4, H, C.w3); fb.rect(rx + 1, 0, 1, H, C.w4); }
    // the cabin roof below
    fb.rect(30, 150, 120, 120, C.ink); fb.rect(32, 152, 116, 116, (x, y) => bayer(x, y) < .1 ? C.w3 : C.w2);
    fb.rect(70, 196, 30, 24, C.ink); fb.rect(72, 198, 26, 20, C.n1);   // the open hatch
    fb.rect(108, 160, 26, 18, C.w1); fb.ell(121, 169, 7, 7, (nx, ny) => S3(nx, ny, STEEL)); fb.line(121, 169, 121, 150, C.w4); fb.line(118, 150, 124, 140, C.w4);   // the pulley, the snapped cable
    for (let k = 0; k < 4; k++) { const s0 = Math.floor(t * 18) / 18 - k * .06; sparks(28, 170 + k * 26, t, s0, 14, 40); sparks(152, 180 + k * 26, t, s0 + .015, 14, 40); }
    // the spider: crawling down from the top, legs on the walls; recoils after the hit
    const app = ease(seg(t, TT.spiderIn, TT.throw)), rec = ss(TT.hit, TT.hit + 1.8, t), sy = Math.round(lerp(-28, 64, app) - rec * 90), sx = 90 + Math.round(Math.sin(t * 2) * 6);
    if (t >= TT.spiderIn) {
      const Ls = layer(), hitF = t >= TT.hit && t < TT.hit + .6 && step(t, 12) % 2;
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1, k = i % 4, ph = Math.sin(t * 14 + i * 1.3) * 6;
        const kx = sx + side * (26 + k * 3), ky = sy - 18 + k * 12 + ph, fx = side < 0 ? 14 : 166, fy = sy - 34 + k * 22 - ph;
        Ls.cap([[sx + side * 8, sy - 6 + k * 4], [kx, ky - 12], [fx, fy]], 2.6, [C.v1, C.v2, C.v3]);
      }
      Ls.ell(sx, sy - 10, 22, 26, (nx, ny) => hitF ? C.r2 : S3(nx, ny, [C.v1, C.v2, C.v3]));
      Ls.ell(sx, sy + 20, 12, 10, (nx, ny) => hitF ? C.r3 : S3(nx, ny, [C.v1, C.v2, C.v4]));
      for (const [ex, ey] of [[-5, 18], [5, 18], [-8, 22], [8, 22], [-3, 25], [3, 25]]) { Ls.rect(sx + ex - 1, sy + ey, 2, 2, C.r3); }
      Ls.rect(sx - 5, sy + 28, 2, 4, C.eye); Ls.rect(sx + 3, sy + 28, 2, 4, C.eye);   // fangs
      Ls.outline(C.ink); Ls.over(fb);
    }
    const pose = t >= TT.throw - .15 && t < TT.throw + .5 ? 'throw' : t >= TT.throw - .75 && t < TT.throw - .15 ? 'windup' : 'stand', [hx, hy] = leoTop(t, 84, 238, pose);
    // the flare: lit in his hand, thrown, a red burst
    if (t >= TT.flareLit && t < TT.throw + .05) { fb.ell(hx, hy, 26, 26, (nx, ny, x, y) => bayer(x, y) < .4 * (1 - nx * nx - ny * ny) * (.7 + .3 * (step(t, 12) % 2)) ? C.ph1 : null); fb.rect(hx - 1, hy - 7, 3, 7, C.r2); fb.rect(hx - 1, hy - 9, 3, 3, C.ph2); }
    if (t >= TT.throw && t < TT.hit) { const u = seg(t, TT.throw, TT.hit), fx = lerp(hx, sx, u), fy = lerp(hy, sy + 20, u); for (let k = 0; k < 8; k++) fb.px(lerp(hx, fx, k / 8), lerp(hy, fy, k / 8), k % 2 ? C.ph1 : C.ph2); fb.ell(fx, fy, 3, 3, C.ph2); fb.ell(fx, fy, 14, 14, (nx, ny, x, y) => bayer(x, y) < .35 * (1 - nx * nx - ny * ny) ? C.ph1 : null); }
    if (t >= TT.hit) { sparks(sx, sy + 20, t, TT.hit, 30, 60, [C.ph2, C.ph1, C.y5]); if (t < TT.hit + .1) fb.rect(0, 0, W, H, (x, y) => bayer(x, y) < .5 ? C.ph2 : null); }
    if (t >= TT.hit && t < TT.hit + 2.4) bigText('CRITICAL HIT!', 90, Math.round(100 - seg(t, TT.hit, TT.hit + 2.4) * 20), y => y < 3 ? C.y5 : y < 5 ? C.y4 : C.ph1, C.ink);
    banner([t >= TT.b99 ? 'DEPTH: B98 -> B99' : 'DEPTH: B98 -> ...'], 36, t >= TT.b99 && step(t, 4) % 2 ? C.r3 : C.n9, C.n9, t >= TT.shaftA + .2);
    sh = t >= TT.hit && t < TT.hit + .6 ? 4 : 1;
  } else if (shot.id === 'lever') {
    fb.rect(0, 0, W, H, (x, y) => (x * 3 + y) % 13 === 0 ? C.w3 : C.w2);
    fb.rect(30, 262, 120, 30, C.ink); fb.rect(32, 264, 116, 26, C.w1); text(fb, 'EMERGENCY BRAKE', 90 - textW('EMERGENCY BRAKE') / 2, 264, C.y4);
    const ang = lerp(-.15, 1.35, ease(seg(t, TT.pull, TT.pull + .25))), px = 60, py = 236, len = 104, ex = px + Math.sin(ang) * len, ey = py - Math.cos(ang) * len;
    const gx = px + Math.sin(ang) * len * .72, gy = py - Math.cos(ang) * len * .72;   // the grip, below the knob
    fb.cap([[gx + 4, gy + 10], [gx + 40, gy + 110]], 13, HOOD);   // his arm comes from below right
    fb.cap([[px, py], [ex, ey]], 7, [C.r1, C.r2, C.r3]); fb.ell(ex, ey, 14, 12, (nx, ny) => S3(nx, ny, [C.r1, C.r2, C.r3])); fb.ell(ex - 4, ey - 4, 4, 3, C.r4); fb.ell(px, py, 12, 12, (nx, ny) => S3(nx, ny, STEEL));
    fb.ell(gx, gy, 12, 10, (nx, ny) => S3(nx, ny, SKIN)); for (let k = 0; k < 4; k++) fb.line(gx - 10, gy - 6 + k * 4, gx + 8, gy - 5 + k * 4, C.s2);
    if (t >= TT.pull) { for (let k = 0; k < 6; k++) sparks(px, py, t, TT.pull + k * .08, 24, 70); }
    sh = t >= TT.pull ? 4 : 0;
    if (t >= TT.white) lut = whiteLut(seg(t, TT.white, TT.exitA - .2));
    if (t >= TT.exitA - .2) lut = whiteLut(1);
  } else if (shot.id === 'exit') {
    if (t >= TT.static) { if (t >= TT.black) { fb.clear(C.ink); out.present(fb, LUT.full); out.show(0); return; } staticNoise(t); out.present(fb, LUT.full); out.show(1); return; }
    const looped = t >= TT.loop, glitch = t >= TT.glitchSign && t < TT.loop;
    const L1 = looped ? [C.r1, C.r2, C.r3, C.r4] : [C.p1, C.p2, C.p3, C.p4];
    // inside the cabin looking out: dark walls, the open doorway full of light
    fb.rect(0, 0, W, H, (x, y) => bayer(x, y) < .1 ? C.w2 : C.w1);
    fb.rect(34, 60, 112, 230, C.ink);
    fb.rect(36, 62, 108, 226, (x, y) => { const v = 1 - Math.abs(x - 90) / 70 - (y - 62) / 600; return v > .7 ? L1[3] : v > .5 ? (bayer(x, y) < .5 ? L1[3] : L1[2]) : v > .3 ? L1[2] : L1[1]; });
    fb.poly([[36, 288], [144, 288], [180, 320], [0, 320]], (x, y) => bayer(x, y) < .45 - (y - 288) / 80 ? L1[1] : C.w2);   // light spilling onto the floor
    fb.rect(30, 60, 6, 228, C.w3); fb.rect(144, 60, 6, 228, C.w3);
    // the sign
    const sx = 90, sy = 92, swap = glitch ? step(t, 12) % 3 === 0 : looped;
    if (!swap) { win(48, sy - 10, 84, 40, C.ink, C.u4 === 0 ? 0 : C.blue); fb.rect(51, sy - 7, 78, 34, C.blue); text(fb, 'EXIT', sx - textW('EXIT') / 2, sy - 8, C.n9); text(fb, 'SURFACE LEVEL', sx - textW('SURFACE LEVEL') / 2, sy + 8, C.n9); fb.rect(56, sy - 1, 8, 1, C.n9); }
    else { win(20, sy - 18, 140, 58, C.r3, C.r1); ['WELCOME TO', 'FLOOR -99.', 'LOOP 01 COMPLETE.'].forEach((l, i) => text(fb, l, sx - textW(l) / 2, sy - 16 + i * 16, C.r4)); }
    if (glitch) for (let y = sy - 20; y < sy + 44; y++) if (hash(y >> 2, step(t, 12)) < .35) { const d = Math.round((hash(y, step(t, 12), 2) - .5) * 30); const row = fb.d.slice(y * W, y * W + W); for (let x = 0; x < W; x++) fb.d[y * W + x] = row[((x - d) % W + W) % W]; }
    // Leo: a silhouette in the doorway, collapsing to his knees
    const k = ss(TT.kneel, TT.kneel + .6, t), Lk = layer(), lx = 90, ly = 286, hgt = Math.round(lerp(70, 46, k));
    Lk.poly([[lx - 12, ly - hgt + 16], [lx + 12, ly - hgt + 16], [lx + 14, ly - 6], [lx - 14, ly - 6]], C.n1);
    Lk.rect(lx - 14, ly - 8, 12, 8, C.n1); Lk.rect(lx + 2, ly - 8, 12, 8, C.n1); Lk.ell(lx, ly - hgt + 6, 9, 10, C.n1);
    Lk.cap([[lx - 12, ly - hgt + 20], [lx - 20, ly - hgt + 40]], 4, [C.n1, C.n1, C.n1]); Lk.cap([[lx + 12, ly - hgt + 20], [lx + 20, ly - hgt + 40]], 4, [C.n1, C.n1, C.n1]);
    Lk.over(fb);
    voBox(TL.vo[3], t);
    if (t >= TT.cut) { out.present(fb, LUT.full); out.post(u => { const f = step(t, 24); for (let y = 0; y < H; y++) { const s = hash(y >> 3, f) < .5 ? Math.round((hash(y >> 2, f, 3) - .5) * 70) : 0; if (!s) continue; const row = u.slice(y * W, y * W + W); for (let x = 0; x < W; x++) u[y * W + x] = row[((x - s) % W + W) % W]; } }); out.show(1); return; }
    if (t < TT.exitA + .3) lut = whiteLut(1 - seg(t, TT.exitA, TT.exitA + .3));
  }
  shift(...shakeXY(t, sh));
  crtNoise(t, 1);
  out.present(fb, lut); out.show(crt);
};
if (new URLSearchParams(location.search).has('sheet')) window.render = () => { fb.clear(C.n3); leoFront(0, 40, 140, 'stand'); leoFront(.1, 120, 140, 'float'); leoSide(0, 30, 300, 'lean'); leoSide(0, 70, 300, 'spray'); leoTop(0, 140, 260, 'throw'); out.present(fb, LUT.full); out.show(0); };
window.READY = true;
