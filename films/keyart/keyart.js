// Pixel Life key art: the hero and the Customer at the IT help desk, hi-bit pixel art.
// Drawn on a 360×640 pixel canvas (every art pixel = 2×2 on the 720×1280 output), the characters about 320 art pixels
// (640 output pixels) tall: ~6.5× the films' original 50-pixel sprite. Everything is drawn in code, pixel by pixel:
// shaded forms (a key light from the upper left, a cool rim light from the right), ordered dithering between ramp steps,
// a selective outline per character, hard pixels only.
const W = 360, H = 640, OUT = 2;
// ———— colour ————
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + .5) / 16;
const ramp = (cols, dz = .5) => { const C = cols.map(hex); return (v, x, y) => { v = Math.max(0, Math.min(.9999, v)) * (C.length - 1); const i = Math.floor(v); let f = v - i; f = Math.max(0, Math.min(1, (f - .5) / dz + .5)); return C[Math.min(C.length - 1, i + (bayer(x, y) < f ? 1 : 0))]; }; };
const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t));
const R = {
  skin: ramp(['#5e3428', '#8a5040', '#b8735a', '#d99a78', '#efbd98', '#ffdcbc', '#fff0dc']),
  hair: ramp(['#1a0e08', '#2e1a0e', '#4a2c16', '#6a4222', '#8c5a30', '#b07a44', '#d4a060']),
  polo: ramp(['#0e2a06', '#1c4a0c', '#2e6e12', '#46961c', '#66bc2a', '#8ada44', '#b8f070', '#e0ffa8']),
  khaki: ramp(['#2a2218', '#463a28', '#665640', '#88765a', '#a89676', '#c8b896']),
  shoe: ramp(['#0c0c10', '#1a1a20', '#2c2c34', '#44444e', '#6a6a76']),
  white: ramp(['#8a8e9a', '#b4b8c4', '#d4d8e0', '#eef0f4', '#ffffff']),
  lany: ramp(['#0c1e4a', '#163482', '#2452b8', '#3c74e0', '#6a9cf4', '#a8c8ff']),
  black: ramp(['#08080c', '#14141a', '#22222a', '#34343e', '#4c4c58', '#6c6c7a']),
  gold: ramp(['#3a2608', '#6a4a12', '#9a7020', '#c89a34', '#ecc85a', '#fff09a']),
  purple: ramp(['#1a0628', '#300c48', '#4a166a', '#661e8c', '#8430ac', '#a452c8', '#c682e0']),
  pink: ramp(['#5a0a32', '#8c1650', '#c0246e', '#e8488e', '#ff7cb0', '#ffb4d2']),
  lilac: ramp(['#3e3448', '#5e5470', '#807696', '#a49cb8', '#c8c2d8', '#e8e4f2', '#ffffff']),
  red: ramp(['#4a0610', '#7a0c1e', '#ac1830', '#d42c44', '#f05a6a']),
  iris: ramp(['#1e1008', '#3e2412', '#64401e', '#8c602e', '#b48444']),
  lens: ramp(['#06040c', '#140c26', '#22163e', '#34245a', '#4c3a7a']),
};
const INK = hex('#140c14'), RIM = [170, 214, 255], WARM = [255, 236, 200];
const L = (() => { const v = [-.5, -.62, .6], n = Math.hypot(...v); return v.map(c => c / n); })();
// shade: base value from a surface normal (lambert + ambient), plus a cool rim on the right edges
const lam = (nx, ny, nz) => Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
function shade(r, nx, ny, nz, x, y, o = {}) {
  let v = (o.amb ?? .22) + (o.k ?? .78) * lam(nx, ny, nz) + (o.add || 0);
  let c = r(v, x, y);
  const rim = Math.max(0, nx) * Math.pow(1 - nz, 1.6);
  if (rim > .28 && !o.norim) c = mix(c, RIM, Math.min(.55, (rim - .28) * 1.4));
  return c;
}

// ———— a pixel layer ————
class Layer {
  constructor() { this.d = new Uint8ClampedArray(W * H * 4); }
  set(x, y, c, a = 255) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || !c) return; const i = (y * W + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a; }
  get(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return null; const i = (y * W + x) * 4; return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, typeof c === 'function' ? c(x + i, y + j) : c); }
  // ellipse; f(nx, ny, nz, x, y) gets the sphere-ish normal
  ell(cx, cy, rx, ry, f) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, q = nx * nx + ny * ny; if (q > 1) continue;
      const c = typeof f === 'function' ? f(nx, ny, Math.sqrt(1 - q), x, y) : f; if (c) this.set(x, y, c);
    }
  }
  poly(pts, f) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs = [], yc = y + .5;
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) { const c = typeof f === 'function' ? f(x, y) : f; if (c) this.set(x, y, c); }
    }
  }
  // a tube along a polyline; f(nx, ny, nz, t, x, y) with a cylinder normal across the width; r can vary along the line [r0, r1]
  tube(pts, r, f) {
    const [r0, r1] = Array.isArray(r) ? r : [r, r], rm = Math.max(r0, r1);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const segL = []; let tot = 0; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segL.push(l); tot += l; }
    for (let y = Math.floor(y0 - rm); y <= y1 + rm; y++) for (let x = Math.floor(x0 - rm); x <= x1 + rm; x++) {
      let best = 1e9, bs = 0, bt = 0, bp = [0, 0], acc = 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, LL = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / LL)), qx = x + .5 - (ax + u * dx), qy = y + .5 - (ay + u * dy), d = Math.hypot(qx, qy);
        const Lg = Math.sqrt(LL), px = -dy / Lg, py = dx / Lg, s = qx * px + qy * py;
        const tt = (acc + u * segL[i]) / (tot || 1), rr = r0 + (r1 - r0) * tt;
        if (d / rr < best) { best = d / rr; bs = s / rr; bt = tt; bp = [px, py]; }
        acc += segL[i];
      }
      if (best > 1) continue;
      const s = Math.max(-1, Math.min(1, bs)), nz = Math.sqrt(Math.max(0, 1 - s * s));
      const c = f(bp[0] * s, bp[1] * s, nz, bt, x, y); if (c) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let i = 0; i <= n; i++) { const t = i / n; this.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, typeof c === 'function' ? c(t) : c); } }
  // a tapered brush stroke along a quadratic curve (hair strands, brows, folds)
  curve(a, b, c, w0, w1, col) { const n = 40; for (let i = 0; i <= n; i++) { const t = i / n, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1], w = w0 + (w1 - w0) * t; if (w < .7) this.set(x, y, typeof col === 'function' ? col(t, x, y) : col); else this.ell(x, y, w, w, () => typeof col === 'function' ? col(t, x, y) : col); } }
  outline(k = .35, tint = [20, 12, 22]) {   // selective outline: empty pixels next to the figure take its colour, darkened
    const src = new Uint8ClampedArray(this.d), add = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (src[(y * W + x) * 4 + 3]) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 4; if (src[i + 3]) { add.push([x, y, mix(tint, [src[i], src[i + 1], src[i + 2]], k)]); break; } }
    }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  over(dst) { for (let i = 0; i < this.d.length; i += 4) if (this.d[i + 3]) { const a = this.d[i + 3] / 255; for (let k = 0; k < 3; k++) dst.d[i + k] = Math.round(dst.d[i + k] * (1 - a) + this.d[i + k] * a); dst.d[i + 3] = 255; } }
}

// ———— the background: a clean help-desk corner ————
function background(bg) {
  const wall = ramp(['#1c2638', '#26324a', '#30405c', '#3c4e6e', '#4a5e80']);
  bg.rect(0, 0, W, H, (x, y) => wall(.75 - y / 900 + (x - 180) ** 2 / -400000, x, y));
  // the ceiling and two light panels
  bg.rect(0, 0, W, 34, (x, y) => mix([206, 212, 222], [160, 168, 182], y / 34));
  for (const x0 of [30, 210]) { bg.rect(x0, 22, 120, 7, [250, 252, 255]); bg.rect(x0 - 2, 29, 124, 2, [190, 200, 214]); }
  // the window: dusk sky, a skyline with lit windows, snow, mullions
  const sky = ramp(['#24406e', '#3a5c92', '#5a7cb0', '#8aa0c8', '#c8b4c0', '#f0c8a8']);
  const wx0 = 14, wx1 = 346, wy0 = 112, wy1 = 330;
  bg.rect(wx0 - 6, wy0 - 6, wx1 - wx0 + 12, wy1 - wy0 + 12, (x, y) => mix([210, 214, 222], [150, 156, 168], (y - wy0 + 6) / (wy1 - wy0 + 12)));
  bg.rect(wx0, wy0, wx1 - wx0, wy1 - wy0, (x, y) => sky(.15 + (y - wy0) / (wy1 - wy0) * .85, x, y));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [layer, base, col, lit] of [[0, 230, '#3a4a6a', .25], [1, 262, '#2a3654', .4]]) {
    let x = wx0; while (x < wx1) { const w = 16 + rnd() * 30 | 0, h = (layer ? 40 : 60) + rnd() * (layer ? 50 : 70) | 0, top = wy1 - h; const c = hex(col);
      bg.rect(x, top, Math.min(w, wx1 - x), wy1 - top, c);
      for (let yy = top + 4; yy < wy1 - 3; yy += 5) for (let xx = x + 3; xx < Math.min(x + w, wx1) - 2; xx += 4) if (rnd() < lit) bg.rect(xx, yy, 2, 2, rnd() < .7 ? [255, 214, 140] : [190, 220, 255]);
      x += w + (layer ? 0 : 2); }
  }
  for (let i = 0; i < 140; i++) { const x = wx0 + rnd() * (wx1 - wx0) | 0, y = wy0 + rnd() * (wy1 - wy0) | 0; bg.set(x, y, [236, 242, 255]); }
  for (const x of [wx0 + 110, wx0 + 222]) bg.rect(x, wy0, 4, wy1 - wy0, [168, 176, 190]);
  bg.rect(wx0, wy0 + 98, wx1 - wx0, 3, [168, 176, 190]);
  // the IT HELP DESK sign on two cables
  for (const x of [118, 242]) bg.rect(x, 31, 1, 46, [60, 66, 80]);
  bg.rect(98, 74, 164, 38, [20, 12, 22]); bg.rect(100, 76, 160, 34, (x, y) => R.polo(.72 - (y - 76) / 34 * .3, x, y)); bg.rect(100, 76, 160, 3, [214, 252, 160]);
  const tc = document.createElement('canvas'); tc.width = 160; tc.height = 34; const tg = tc.getContext('2d'); tg.font = '700 16px Silkscreen'; tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.fillStyle = '#fff'; tg.fillText('IT HELP DESK', 80, 18);
  const td = tg.getImageData(0, 0, 160, 34).data; for (let y = 0; y < 34; y++) for (let x = 0; x < 160; x++) if (td[(y * 160 + x) * 4 + 3] > 110) { bg.set(100 + x, 76 + y, [20, 40, 12]); }
  // a plant on the left, the desk behind the characters with the monitor, keyboard and mug
  const leaf = ramp(['#0e2a14', '#1a4a22', '#2a6e30', '#40924a', '#62b468']);
  bg.rect(18, 400, 34, 46, (x, y) => mix([200, 120, 80], [130, 70, 50], (x - 18) / 34));
  for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (i - 6.5) * .22, l = 40 + (i % 3) * 14; bg.curve([35, 402], [35 + Math.cos(a) * l * .5, 402 + Math.sin(a) * l * .7], [35 + Math.cos(a) * l, 402 + Math.sin(a) * l * .9 + 10], 3.2, .8, t => leaf(.3 + t * .5 + (i % 2) * .1, i, t * 9 | 0)); }
  const lam8 = ramp(['#6a665e', '#8e8a80', '#b4aea2', '#d6d0c2', '#eee8da']);
  bg.rect(0, 452, W, 8, (x, y) => lam8(.8 - (y - 452) * .06, x, y)); bg.rect(0, 460, W, 4, [70, 66, 60]);
  bg.rect(0, 464, W, 150, (x, y) => lam8(.42 + (x % 60 < 2 ? -.2 : 0) - (y - 464) / 600, x, y));
  // the monitor (a ticket queue with a big green tick) between them
  bg.rect(146, 360, 82, 56, [18, 18, 24]); bg.rect(149, 363, 76, 48, (x, y) => mix([40, 70, 140], [30, 50, 100], (y - 363) / 48));
  bg.rect(149, 363, 76, 6, [70, 130, 230]); bg.rect(151, 365, 16, 2, [230, 240, 255]); bg.rect(219, 365, 4, 2, [240, 90, 90]);
  for (let r = 0; r < 5; r++) { bg.rect(152, 372 + r * 7, 3, 3, [[240, 90, 90], [250, 200, 60], [120, 220, 90]][r % 3]); bg.rect(158, 373 + r * 7, 22 + (r * 9) % 18, 1, [170, 190, 230]); }
  bg.ell(205, 392, 11, 11, (nx, ny, nz, x, y) => mix([120, 230, 100], [70, 180, 60], (ny + 1) / 2)); for (const [x, y] of [[199, 392], [200, 393], [201, 394], [202, 395], [203, 394], [204, 393], [205, 392], [206, 391], [207, 390], [208, 389], [209, 388], [210, 387]]) bg.rect(x, y, 2, 2, [250, 255, 246]);
  bg.rect(183, 416, 8, 30, [40, 42, 50]); bg.rect(170, 446, 34, 6, [50, 52, 60]);
  bg.rect(156, 448, 60, 4, [56, 58, 66]); for (let i = 0; i < 18; i++) bg.set(158 + i * 3, 449, [120, 124, 136]);
  bg.rect(300, 428, 20, 24, (x, y) => R.white(.85 - (x - 300) / 40, x, y)); bg.rect(300, 436, 20, 6, (x, y) => R.polo(.65, x, y)); bg.rect(319, 432, 6, 12, null);
  for (const [x, y] of [[320, 432], [324, 433], [325, 436], [325, 439], [324, 442], [320, 443]]) bg.rect(x, y, 2, 2, R.white(.7, 0, 0));
  bg.rect(302, 428, 16, 2, [70, 40, 24]); for (const [x, y] of [[306, 422], [308, 418], [307, 414], [312, 420], [314, 416], [313, 412]]) bg.set(x, y, [230, 236, 246]);
  // the floor: carpet tiles in perspective, a warm pool of light
  const carpet = ramp(['#1a2030', '#222a3e', '#2c364e', '#38445e']);
  bg.rect(0, 614, W, 26, (x, y) => carpet(.55 + ((x + (y - 614) * ((x - 180) / 180)) % 40 < 1.2 ? -.4 : 0) - (y - 614) * .01, x, y));
  // soft light: a warm key from the upper left, a vignette
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, k = Math.max(0, 1 - Math.hypot((x - 120) / 260, (y - 280) / 420)) * .18, v = 1 - Math.pow(Math.hypot((x - 180) / 260, (y - 330) / 420), 3) * .35;
    for (let c = 0; c < 3; c++) bg.d[i + c] = Math.max(0, Math.min(255, bg.d[i + c] * v + WARM[c] * k * .4)); }
}

// ———— the hero ————
function hero(P, ox, oy, K) {
  const T = (u, v) => [ox + (u - 57) * K, oy + (v - 146) * K], k = K;
  const S = (r, o) => (nx, ny, nz, x, y) => shade(r, nx, ny, nz, x, y, o);
  // legs (khaki, a crease, knee folds) and shoes
  for (const [i, hipU, ankU] of [[0, [47, 109], [45, 136]], [1, [59, 109], [61, 136]]]) {
    const hip = T(...hipU), ank = T(...ankU), kn = [(hip[0] + ank[0]) / 2 + (i ? 1 : -1), (hip[1] + ank[1]) / 2];
    P.tube([hip, kn, ank], [6.6 * k, 5.6 * k], (nx, ny, nz, t, x, y) => shade(R.khaki, nx, ny, nz, x, y, { add: (i ? .05 : -.08) + (Math.abs(nx) < .08 && t > .1 ? .12 : 0) }));
    for (let j = 0; j < 3; j++) P.curve([kn[0] - 8, kn[1] - 6 + j * 5], [kn[0], kn[1] - 2 + j * 5], [kn[0] + 7, kn[1] - 5 + j * 5], 1, .6, R.khaki(.18, 0, 0));
    const sx = ank[0] + 4, sy = ank[1] + 7;
    P.ell(sx, sy, 10.5 * k / 2.15 * 2.15, 5.6 * k / 2.15 * 2.15 / 1.0 * .5 * 2, S(R.shoe, { add: -.05 }));
    P.ell(sx + 6, sy - 3, 6, 3, (nx, ny, nz, x, y) => nz > .8 && nx < 0 ? [140, 140, 156] : null);
    P.rect(sx - 22, sy + 9, 46, 4, (x, y) => R.white(.35 - (y - sy - 9) * .1, x, y));
    for (let j = 0; j < 4; j++) P.rect(sx - 4 + j * 5, sy - 9 + j, 4, 1, [230, 232, 240]);
  }
  // the far arm (behind the body): sleeve and forearm hanging, a relaxed hand
  const arm = (S0, E0, W0, far, handPose) => {
    const s = T(...S0), e = T(...E0), w = T(...W0), mid = [s[0] + (e[0] - s[0]) * .5, s[1] + (e[1] - s[1]) * .5];
    P.tube([mid, e, w], [4.6 * k, 4.0 * k], (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: far ? -.14 : 0 }));
    P.tube([s, mid], [7.4 * k, 6.8 * k], (nx, ny, nz, t, x, y) => shade(R.polo, nx, ny, nz, x, y, { add: (far ? -.16 : 0) + (t > .86 ? -.16 : 0) + ((((x + 2 * y) % 9) === 0) ? -.05 : 0) }));
    handPose(w, e, far);
  };
  const relaxed = (w, e, far) => {
    const dx = w[0] - e[0], dy = w[1] - e[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, cx = w[0] + ux * 9, cy = w[1] + uy * 9;
    P.ell(cx, cy, 10, 11, S(R.skin, { add: far ? -.12 : 0 }));
    for (let f = -1.5; f <= 1.5; f++) { const bx = cx - uy * f * 4.6 + ux * 6, by = cy + ux * f * 4.6 + uy * 6; P.tube([[bx, by], [bx + ux * 8, by + uy * 8]], [2.6, 2.3], (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: (far ? -.12 : 0) - t * .06 })); }
    P.tube([[cx + 7, cy - 3], [cx + 10, cy + 5]], 2.7, (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: far ? -.1 : .04 }));
  };
  arm([38, 66], [34, 84], [33, 100], true, relaxed);
  // the polo: a torso with knit dithering, folds, a stitched hem, sleeves set in
  const tl = T(36, 60), tr = T(69, 60), br = T(73, 107), bl = T(32, 107), cx = (tl[0] + tr[0]) / 2, hw = (tr[0] - tl[0]) / 2;
  P.poly([tl, tr, br, bl], (x, y) => { const nx = Math.max(-1, Math.min(1, (x - cx) / (hw * 1.12))), nz = Math.sqrt(1 - nx * nx); let add = ((x + y) % 2 === 0 && (x * 3 + y) % 7 === 0) ? .04 : 0; if (y > br[1] - 9) add -= .1; if (y === Math.round(br[1] - 10) && x % 2) add += .12; return shade(R.polo, nx, .1, nz, x, y, { add }); });
  for (const [a, b, c] of [[[tl[0] + 10, tl[1] + 40], [tl[0] + 18, tl[1] + 62], [tl[0] + 14, br[1] - 14]], [[tr[0] - 12, tr[1] + 36], [tr[0] - 20, tr[1] + 60], [tr[0] - 12, br[1] - 16]], [[cx - 30, tl[1] + 24], [cx - 18, tl[1] + 34], [cx - 4, tl[1] + 34]]]) { P.curve(a, b, c, 1.6, .7, (t, x, y) => R.polo(.18, x, y)); P.curve([a[0] + 2, a[1]], [b[0] + 2, b[1]], [c[0] + 2, c[1]], .9, .5, (t, x, y) => R.polo(.62, x, y)); }
  P.ell(T(39, 66)[0], T(39, 66)[1], 8 * k, 7.4 * k, S(R.polo, { add: .02 })); P.ell(T(66, 66)[0], T(66, 66)[1], 8 * k, 7.4 * k, S(R.polo, { add: -.02 }));
  // belt with loops and a brass buckle
  const by0 = Math.round(T(0, 105)[1]); P.rect(Math.round(bl[0]) + 1, by0, Math.round(br[0] - bl[0]) - 1, 11, (x, y) => R.black(.45 - (y - by0) * .03 + (y === by0 ? .3 : 0), x, y));
  for (const u of [37, 46, 62, 70]) P.rect(Math.round(T(u, 0)[0]), by0 - 2, 4, 14, (x, y) => R.black(.25, x, y));
  P.rect(Math.round(cx) - 9, by0 - 1, 18, 13, (x, y) => R.gold(.85 - (y - by0) * .05 - (x - cx) * .02, x, y)); P.rect(Math.round(cx) - 5, by0 + 3, 10, 5, R.black(.4, 0, 0)); P.rect(Math.round(cx) - 9, by0 - 1, 18, 2, R.gold(.98, 0, 0));
  // the collar (two flaps) and the placket with buttons
  const cy0 = tl[1];
  P.poly([[cx - 26, cy0 - 4], [cx + 1, cy0 - 4], [cx - 6, cy0 + 22]], (x, y) => R.white(.95 - (y - cy0) * .02 - (x - cx + 26) * .004, x, y));
  P.poly([[cx - 1, cy0 - 4], [cx + 26, cy0 - 4], [cx + 6, cy0 + 22]], (x, y) => R.white(.75 - (y - cy0) * .02, x, y));
  P.line(cx - 26, cy0 - 3, cx - 6, cy0 + 22, R.white(.3, 0, 0)); P.line(cx + 26, cy0 - 3, cx + 6, cy0 + 22, R.white(.25, 0, 0));
  P.rect(Math.round(cx) - 5, cy0 + 8, 10, 32, (x, y) => R.polo(.42 + (x - cx) * -.02, x, y)); P.rect(Math.round(cx) - 5, cy0 + 8, 2, 32, R.polo(.2, 0, 0));
  for (const y of [cy0 + 18, cy0 + 31]) { P.ell(cx, y, 3.4, 3.2, S(R.white, { add: .1 })); P.set(cx - 1, y, [150, 150, 150]); P.set(cx + 1, y, [150, 150, 150]); }
  // the lanyard (a woven strap with a highlight), a metal clip and the badge
  for (const [a, c, s] of [[[cx - 22, cy0 + 2], [cx - 10, cy0 + 52], .62], [[cx + 22, cy0 + 2], [cx + 10, cy0 + 52], .42]]) P.tube([a, c], 2.8, (nx, ny, nz, t, x, y) => shade(R.lany, nx, ny, nz, x, y, { add: s - .55 + (((y + x) % 4) === 0 ? .1 : 0) }));
  P.rect(Math.round(cx) - 6, cy0 + 49, 12, 8, (x, y) => R.black(.85 - (y - cy0 - 49) * .06, x, y));
  const bx = Math.round(cx) - 17, byy = cy0 + 56;
  P.rect(bx - 1, byy - 1, 36, 44, [40, 44, 60]); P.rect(bx, byy, 34, 42, (x, y) => R.white(.95 - (x - bx) * .008, x, y)); P.rect(bx, byy, 34, 9, (x, y) => R.lany(.6, x, y)); P.rect(bx + 12, byy + 2, 10, 2, R.lany(.15, 0, 0));
  P.rect(bx + 3, byy + 13, 11, 15, (x, y) => R.skin(.7, x, y)); P.rect(bx + 3, byy + 13, 11, 5, (x, y) => R.hair(.4, x, y)); P.set(bx + 7, byy + 20, INK); P.set(bx + 11, byy + 20, INK); P.rect(bx + 6, byy + 24, 5, 1, [150, 60, 60]); P.rect(bx + 3, byy + 26, 11, 2, R.polo(.6, 0, 0));
  for (const [y, w] of [[14, 15], [18, 12], [22, 15], [26, 10]]) P.rect(bx + 17, byy + y, w, 2, R.black(.45, 0, 0));
  P.rect(bx + 3, byy + 33, 28, 5, (x, y) => (x + y) % 2 ? [20, 20, 24] : [240, 240, 244]); E.badge = [bx, byy];
  // the neck and the head
  const hc = T(51, 33), hx = hc[0], hy = hc[1];
  P.tube([[hx - 4, hy + 30], [hx - 2, hy + 52]], 12, (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: -.18 + t * .05 }));
  P.ell(hx, hy, 17 * k, 18.6 * k, S(R.skin, { add: .02 }));
  P.ell(hx + 9, hy + 18, 26, 20, S(R.skin, { add: .04 }));   // jaw and chin, forward
  P.ell(hx + 13, hy + 13, 9, 6, (nx, ny, nz, x, y) => R.skin(.86, x, y));   // the lit cheek
  P.ell(hx + 14, hy + 21, 10, 4, (nx, ny, nz, x, y) => bayer(x, y) < .5 ? hex('#f08a7c') : null);   // blush
  // the ear (behind the headset cup), the nose
  P.ell(hx + 40, hy + 6, 6, 10, S(R.skin, { add: .05 }));
  P.ell(hx + 38, hy + 2, 5, 9, S(R.skin, { add: .1 })); P.curve([hx + 36, hy + 9], [hx + 42, hy + 11], [hx + 40, hy + 15], 1, .6, R.skin(.3, 0, 0));
  // eyes: near (right) and far (left)
  const eye = (ex, ey, rw, rh, far) => {
    P.ell(ex, ey, rw, rh, (nx, ny, nz, x, y) => R.white(.98 - (ny < -.3 ? .3 : 0) - (far ? .1 : 0), x, y));
    const ix = ex + rw * .32, iy = ey + 1; P.ell(ix, iy, rw * .62, rh * .86, (nx, ny, nz, x, y) => (Math.abs(x + .5 - ex) / rw) ** 2 + ((y + .5 - ey) / rh) ** 2 > 1 ? null : R.iris(.35 + ny * .4 + (Math.hypot(nx, ny) < .5 ? .15 : 0), x, y));
    P.ell(ix + .5, iy + .5, rw * .32, rh * .44, (nx, ny, nz, x, y) => (Math.abs(x + .5 - ex) / rw) ** 2 + ((y + .5 - ey) / rh) ** 2 > 1 ? null : INK);
    P.ell(ix - rw * .22, iy - rh * .34, 2.2, 2.2, [255, 255, 255]); P.rect(Math.round(ix + rw * .2), Math.round(iy + rh * .3), 2, 2, [230, 220, 210]);
    P.curve([ex - rw - 1, ey - 1], [ex, ey - rh - 3], [ex + rw + 2, ey - rh * .3], 2.2, 1.4, INK);   // upper lid
    P.curve([ex + rw, ey - rh * .4], [ex + rw + 4, ey - rh * .7], [ex + rw + 6, ey - rh * .95], 1.3, .6, INK);   // lashes
    P.curve([ex - rw + 2, ey + rh + 1], [ex, ey + rh + 3], [ex + rw - 1, ey + rh], .8, .6, R.skin(.38, 0, 0));
  };
  eye(hx + 20, hy - 1, 8, 9.5, false); eye(hx - 3, hy - 1, 6.4, 9, true);
  // brows: confident, a little raised
  P.curve([hx + 10, hy - 15], [hx + 20, hy - 22], [hx + 31, hy - 17], 2.6, 1.6, (t, x, y) => R.hair(.12 + t * .1, x, y));
  P.curve([hx - 11, hy - 16], [hx - 4, hy - 21], [hx + 3, hy - 18], 2.2, 1.4, (t, x, y) => R.hair(.14, x, y));
  // the nose: a bridge highlight, a lit tip, a nostril
  P.poly([[hx + 31, hy - 2], [hx + 38, hy + 12], [hx + 34, hy + 15], [hx + 29, hy + 13]], (x, y) => R.skin(.72 - (y - hy) * .008, x, y));
  P.ell(hx + 35, hy + 12, 4, 3.4, S(R.skin, { add: .12 })); P.rect(Math.round(hx + 29), Math.round(hy + 15), 6, 1, R.skin(.32, 0, 0)); P.set(hx + 33, hy + 14, R.skin(.2, 0, 0)); P.set(hx + 34, hy + 9, R.skin(.98, 0, 0));
  // the mouth: an open, confident grin (teeth, tongue, lip shading, dimples)
  const mx = hx + 20, my = hy + 26;
  P.poly([[mx - 13, my - 3], [mx + 12, my - 5], [mx + 9, my + 5], [mx + 1, my + 9], [mx - 7, my + 6]], [74, 18, 28]);
  P.poly([[mx - 12, my - 3], [mx + 11, my - 5], [mx + 10, my - 1], [mx - 10, my + 1]], [250, 250, 246]); P.line(mx - 10, my + 1, mx + 10, my - 1, [200, 196, 196]);
  P.ell(mx, my + 5, 6, 3, [214, 86, 100]); P.set(mx - 2, my + 4, [246, 140, 150]);
  P.curve([mx - 15, my - 6], [mx - 13, my - 3], [mx - 12, my], 1, .6, R.skin(.3, 0, 0)); P.curve([mx + 13, my - 8], [mx + 14, my - 5], [mx + 12, my - 2], 1, .6, R.skin(.3, 0, 0));
  P.curve([mx - 6, my + 11], [mx, my + 13], [mx + 6, my + 10], 1, .6, R.skin(.42, 0, 0));
  // hair: the mass, strands with highlights, three fringe locks, the shine
  P.ell(hx - 3, hy - 14, 39, 30, (nx, ny, nz, x, y) => (y < hy - 10 + (x - hx) * .05 || x < hx - 22) ? shade(R.hair, nx, ny, nz, x, y, { add: -.02 }) : null);
  for (let i = 0; i < 22; i++) { const a = -2.9 + i * .1, sx = hx - 3 + Math.cos(a) * 30, sy = hy - 14 + Math.sin(a) * 25; P.curve([sx, sy], [sx + 8, sy + 10], [sx + 6 + (i % 3) * 2, sy + 22], 1.2, .5, (t, x, y) => R.hair(.18 + (i % 4) * .05, x, y)); }
  for (const [a, b, c, w] of [[[hx - 4, hy - 34], [hx + 4, hy - 18], [hx + 3, hy - 4], 7], [[hx + 8, hy - 34], [hx + 20, hy - 22], [hx + 20, hy - 6], 7], [[hx + 22, hy - 32], [hx + 34, hy - 22], [hx + 37, hy - 4], 6]]) {
    P.curve(a, b, c, w, 1, (t, x, y) => R.hair(.55 - t * .3, x, y)); P.curve([a[0] + 2, a[1]], [b[0] + 2, b[1]], [c[0] + 1, c[1] - 3], 1.3, .5, (t, x, y) => R.hair(.86 - t * .3, x, y));
  }
  for (let i = 0; i < 30; i++) { const t = i / 29, x = hx - 30 + t * 44, y = hy - 40 + Math.pow((t - .55) * 2, 2) * 7; P.set(x, y, R.hair(.98, 0, 0)); if (i % 3) P.set(x, y + 1, R.hair(.8, 0, 0)); if (i % 4 === 1) P.set(x, y + 2, R.hair(.7, 0, 0)); }
  P.ell(hx + 10, hy - 9, 26, 3, (nx, ny, nz, x, y) => y > hy - 9 && bayer(x, y) < .55 ? R.skin(.38, x, y) : null);   // shadow under the fringe
  // the headset: a padded band and a cup with a lime light
  for (let a = -3.25; a <= -.95; a += .006) for (const [r, v] of [[46, .7], [48, .55], [50, .35], [52, .22]]) P.set(hx - 8 + Math.cos(a) * r, hy + 4 + Math.sin(a) * r * .9, R.black(v, 0, 0));
  P.ell(hx - 32, hy + 6, 11, 14, S(R.black, { add: .1 })); P.ell(hx - 31, hy + 6, 7, 10, S(R.black, { add: -.1 }));
  P.rect(Math.round(hx - 30), Math.round(hy), 4, 4, [180, 255, 110]); P.rect(Math.round(hx - 29), Math.round(hy + 1), 2, 2, [240, 255, 210]);
  // the near arm: a thumbs-up in front of the chest
  arm([67, 66], [76, 84], [68, 74], false, (w, e) => {
    const cx2 = w[0] + 2, cy2 = w[1] - 2;
    P.ell(cx2, cy2, 12, 11, S(R.skin, { add: .02 }));
    for (let f = 0; f < 4; f++) P.tube([[cx2 - 9, cy2 - 5 + f * 5], [cx2 + 2, cy2 - 5 + f * 5]], 2.8, (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: -.02 * f }));
    for (let f = 0; f < 3; f++) P.line(cx2 - 10, cy2 - 2 + f * 5, cx2 + 1, cy2 - 2 + f * 5, R.skin(.32, 0, 0));
    P.tube([[cx2 + 4, cy2 - 4], [cx2 + 6, cy2 - 22]], [3.6, 3.2], (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: .06 }));
    P.ell(cx2 + 6, cy2 - 22, 2.4, 2, [255, 226, 212]);
  });
}
const E = {};

// ———— the Customer (faces left, towards the hero) ————
function customer(P, ox, oy, K) {
  const T = (u, v) => [ox - (u - 51) * K, oy + (v - 136) * K], k = K;
  const S = (r, o) => (nx, ny, nz, x, y) => shade(r, nx, ny, nz, x, y, o);
  // legs and purple pumps with a bow
  for (const [i, hipU, ankU] of [[0, [44, 111], [42, 128]], [1, [57, 111], [59, 128]]]) {
    const hip = T(...hipU), ank = T(...ankU);
    P.tube([hip, ank], [5.2 * k, 4 * k], (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: i ? -.12 : 0 }));
    const sx = ank[0] - 5, sy = ank[1] + 7;
    P.ell(sx, sy, 15, 8, S(R.purple, { add: i ? -.08 : .04 })); P.ell(sx - 8, sy - 4, 5, 2.5, () => R.purple(.9, 0, 0));
    P.rect(Math.round(sx) + 10, Math.round(sy), 5, 12, (x, y) => R.purple(.15, x, y));
    P.ell(sx - 2, sy - 7, 5, 3, S(R.pink, { add: .1 }));
  }
  // the handbag on the far arm (her right, on screen right)
  const bag = T(18, 96);
  P.tube([T(33, 62), T(25, 76), T(22, 90)], [6.4 * k, 5.6 * k], (nx, ny, nz, t, x, y) => shade(R.purple, nx, ny, nz, x, y, { add: -.15 + ((((x + 2 * y) % 9) === 0) ? -.06 : 0) }));
  for (let a = Math.PI; a <= 2 * Math.PI; a += .01) for (const [r, v] of [[16, .8], [17.5, .55], [19, .3]]) P.set(bag[0] + Math.cos(a) * r, bag[1] - 16 + Math.sin(a) * r * 1.1, R.gold(v, 0, 0));
  P.poly([[bag[0] - 24, bag[1] - 16], [bag[0] + 24, bag[1] - 16], [bag[0] + 26, bag[1] + 20], [bag[0] - 26, bag[1] + 20]], (x, y) => shade(R.pink, Math.max(-1, Math.min(1, (x - bag[0]) / 28)), .1, .9, x, y, { add: -.05 }));
  P.poly([[bag[0] - 24, bag[1] - 16], [bag[0] + 24, bag[1] - 16], [bag[0] + 2, bag[1] + 2]], (x, y) => R.pink(.72 - (y - bag[1] + 16) * .02, x, y));
  for (let x = bag[0] - 20; x < bag[0] + 20; x += 3) P.set(x, bag[1] - 13, R.pink(.98, 0, 0));
  P.ell(bag[0] + 2, bag[1] + 1, 4.5, 4, S(R.gold, { add: .1 }));
  P.ell(T(22, 92)[0], T(22, 92)[1], 11, 11, S(R.skin, { add: -.12 }));
  // the coat: a quilted bell (diamond stitching), the centre seam, folds, gold buttons, pocket flaps
  const c0 = T(30, 54), c1 = T(71, 54), c2 = T(83, 114), c3 = T(18, 114), ccx = (c0[0] + c1[0]) / 2;
  P.poly([c0, c1, c2, c3], (x, y) => { const hw = Math.abs(c0[0] - c1[0]) / 2 + (y - c0[1]) * .2, nx = Math.max(-1, Math.min(1, (x - ccx) / (hw * 1.05))), nz = Math.sqrt(1 - nx * nx);
    const q = ((x + y) % 14 === 0 || (x - y + 1400) % 14 === 0) ? -.12 : ((x + y) % 14 === 1 || (x - y + 1400) % 14 === 1) ? .06 : 0; let add = q; if (y > c2[1] - 6) add -= .15; return shade(R.purple, nx, .05, nz, x, y, { add }); });
  P.line(ccx, c0[1] + 8, ccx + 2, c2[1], (t) => R.purple(.12, 0, 0));
  for (const [a, b, c] of [[[ccx - 50, c0[1] + 70], [ccx - 60, c0[1] + 100], [ccx - 66, c2[1] - 4]], [[ccx + 44, c0[1] + 64], [ccx + 54, c0[1] + 100], [ccx + 64, c2[1] - 4]]]) P.curve(a, b, c, 1.8, 1, R.purple(.08, 0, 0));
  for (const v of [70, 85, 100]) { const p = T(54.5, v); P.ell(p[0] - 6, p[1], 5, 5, S(R.gold, { add: .08 })); P.set(p[0] - 8, p[1] - 2, [255, 255, 230]); }
  for (const [u0, u1, v] of [[60, 73, 95], [26, 37, 95]]) { const a = T(u0, v), b = T(u1, v); P.rect(Math.round(Math.min(a[0], b[0])), Math.round(a[1]), Math.round(Math.abs(b[0] - a[0])), 4, (x, y) => R.purple(.3 - (y - a[1]) * .05, x, y)); }
  // the fur collar: a roll of lit tufts
  for (let i = 0; i < 70; i++) { const t = i / 69, x = c0[0] + 12 - t * (c0[0] - c1[0] + 24), y = c0[1] - 6 + Math.sin(t * Math.PI) * 4 + (i % 3) * 2; P.ell(x, y, 6, 6, S(R.pink, { add: .1 + (i % 2) * .05 })); }
  // the head: face, round cheeks, a lit nose, blush
  const hc = T(50, 30), hx = hc[0], hy = hc[1];
  P.ell(hx, hy, 17.5 * k, 18.5 * k, S(R.skin, { add: -.02 }));
  P.ell(hx - 7, hy + 20, 28, 20, S(R.skin, { add: .02 }));
  P.ell(hx - 20, hy + 18, 9, 6, (nx, ny, nz, x, y) => R.skin(.8, x, y));
  P.ell(hx - 16, hy + 22, 11, 5, (nx, ny, nz, x, y) => bayer(x, y) < .55 ? hex('#f07a8a') : null);
  P.poly([[hx - 33, hy + 4], [hx - 41, hy + 16], [hx - 36, hy + 20], [hx - 30, hy + 17]], (x, y) => R.skin(.66, x, y)); P.ell(hx - 38, hy + 16, 4, 3.4, S(R.skin, { add: .1 })); P.rect(Math.round(hx - 37), Math.round(hy + 20), 6, 1, R.skin(.3, 0, 0));
  // hair: a waved sweep (strands), the tall coiled bun, a gold pin, nape curls, a pearl
  P.ell(hx + 8, hy - 18, 40, 25, (nx, ny, nz, x, y) => (y < hy - 8 - (x - hx) * .08 || x > hx + 26) ? shade(R.lilac, nx, ny, nz, x, y, { add: -.05 }) : null);
  for (let i = 0; i < 26; i++) { const a = -3.3 + i * .11, sx = hx + 8 + Math.cos(a) * 34, sy = hy - 18 + Math.sin(a) * 20; P.curve([sx, sy], [sx - 10, sy + 4], [sx - 14 + (i % 3) * 3, sy + 12], 1.3, .5, (t, x, y) => R.lilac(.25 + (i % 3) * .1, x, y)); }
  for (let i = 0; i < 9; i++) P.curve([hx - 30 + i * 6, hy - 30 + (i % 2) * 2], [hx - 26 + i * 6, hy - 36], [hx - 20 + i * 6, hy - 32], 1, .6, R.lilac(.92, 0, 0));
  const bun = [hx + 16, hy - 52];
  P.ell(bun[0], bun[1], 25, 21, S(R.lilac, { add: .04 }));
  for (const [r0, v] of [[18, .3], [11, .32], [5, .38]]) for (let a = 0; a < 6.28; a += .01) P.set(bun[0] + Math.cos(a) * r0, bun[1] + Math.sin(a) * r0 * .84, R.lilac(v, 0, 0));
  for (let a = -2.6; a < -1.2; a += .02) P.set(bun[0] + Math.cos(a) * 20, bun[1] + Math.sin(a) * 17, R.lilac(1, 0, 0));
  P.tube([[bun[0] - 26, bun[1] - 14], [bun[0] - 8, bun[1] + 10]], 1.8, (nx, ny, nz, t, x, y) => shade(R.gold, nx, ny, nz, x, y, { add: .1 })); P.ell(bun[0] - 26, bun[1] - 14, 3.6, 3.6, S(R.gold, { add: .15 }));
  for (const [x, y] of [[hx + 38, hy + 6], [hx + 34, hy + 16], [hx + 40, hy + 18]]) { P.ell(x, y, 6, 6, S(R.lilac, { add: 0 })); for (let a = 0; a < 6.28; a += .05) P.set(x + Math.cos(a) * 3, y + Math.sin(a) * 3, R.lilac(.3, 0, 0)); }
  P.ell(hx + 18, hy + 22, 4.6, 4.6, (nx, ny, nz, x, y) => mix([170, 166, 176], [252, 250, 244], lam(nx, ny, nz))); P.set(hx + 16, hy + 20, [255, 255, 255]);
  // brows (arched, unimpressed) over the glasses
  P.curve([hx - 34, hy - 13], [hx - 24, hy - 24], [hx - 12, hy - 17], 1.8, 1.2, R.lilac(.28, 0, 0)); P.curve([hx - 2, hy - 16], [hx + 6, hy - 22], [hx + 13, hy - 16], 1.6, 1, R.lilac(.32, 0, 0));
  // round sunglasses: gold rims, dark lenses with a window reflection and a glint
  for (const [x, rw, rh] of [[hx - 22, 14, 13], [hx + 5, 12, 12.5]]) {
    P.ell(x, hy, rw + 2.5, rh + 2.5, S(R.gold, { add: .05 }));
    P.ell(x, hy, rw, rh, (nx, ny, nz, X, Y) => { let v = .55 + ny * .4; if (Math.abs((X - x) + (Y - hy) * .9 + rw * .2) < 2.2 || Math.abs((X - x) + (Y - hy) * .9 - rw * .25) < 1.1) return [150, 140, 200]; return R.lens(v, X, Y); });
    P.ell(x - rw * .4, hy - rh * .45, 3, 2.4, [255, 255, 255]);
  }
  P.tube([[hx - 8, hy - 2], [hx - 6, hy - 2]], 2, (nx, ny, nz, t, x, y) => shade(R.gold, nx, ny, nz, x, y)); P.line(hx + 17, hy - 2, hx + 30, hy, R.gold(.6, 0, 0));
  // red lips, pursed: shading, a highlight, a corner pulled up (smug)
  const lx = hx - 22, ly = hy + 30;
  P.ell(lx, ly - 2, 9, 4, S(R.red, { add: -.05 })); P.ell(lx, ly + 3, 8, 4.4, S(R.red, { add: .1 }));
  P.line(lx - 8, ly, lx + 8, ly, R.red(.05, 0, 0)); P.line(lx + 8, ly, lx + 11, ly - 3, R.red(.1, 0, 0)); P.rect(Math.round(lx - 3), Math.round(ly + 3), 4, 1, [255, 170, 180]);
  // the near arm raised, index finger up: a fur cuff, a gold bracelet, a ring
  const s = T(68, 60), e = T(76, 44), w = T(80, 28);
  P.tube([s, e, w], [6.6 * k, 5.4 * k], (nx, ny, nz, t, x, y) => shade(R.purple, nx, ny, nz, x, y, { add: .04 + ((((x + 2 * y) % 9) === 0) ? -.06 : 0) }));
  for (let i = 0; i < 10; i++) P.ell(w[0] - 12 + i * 2.6, w[1] + (i % 2) * 2, 4.4, 4.4, S(R.pink, { add: .12 }));
  P.rect(Math.round(w[0]) - 9, Math.round(w[1]) - 8, 18, 3, (x, y) => R.gold(.85 - (x - w[0]) * .02, x, y));
  const hx2 = w[0], hy2 = w[1] - 20;
  P.ell(hx2, hy2, 11, 12, S(R.skin, { add: .04 }));
  for (let f = 0; f < 3; f++) P.tube([[hx2 + 6, hy2 - 6 + f * 5], [hx2 - 6, hy2 - 6 + f * 5]], 2.8, (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: -.03 * f }));
  P.tube([[hx2 - 2, hy2 - 8], [hx2 - 1, hy2 - 40]], [3.3, 2.9], (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y, { add: .06 }));
  P.ell(hx2 - 1, hy2 - 40, 2.2, 2, [255, 232, 220]); P.rect(Math.round(hx2) - 5, Math.round(hy2) - 20, 8, 3, (x, y) => R.gold(.9, x, y)); P.set(hx2 - 1, hy2 - 21, [210, 240, 255]);
  P.tube([[hx2 - 8, hy2 + 2], [hx2 - 12, hy2 - 6]], 3, (nx, ny, nz, t, x, y) => shade(R.skin, nx, ny, nz, x, y));
}

// ———— compose ————
async function draw() {
  await document.fonts.load('700 16px Silkscreen'); await document.fonts.ready;
  const bg = new Layer(); background(bg);
  const shadow = new Layer(); shadow.ell(124, 622, 66, 9, [10, 12, 20]); shadow.ell(254, 622, 62, 9, [10, 12, 20]);
  for (let i = 0; i < shadow.d.length; i += 4) if (shadow.d[i + 3]) shadow.d[i + 3] = 120;
  shadow.over(bg);
  const cu = new Layer(); customer(cu, 256, 612, 2.15); cu.outline(); cu.over(bg);
  const he = new Layer(); hero(he, 116, 612, 2.15); he.outline(); he.over(bg);
  const c = document.getElementById('out'), g = c.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  tmp.getContext('2d').putImageData(new ImageData(bg.d, W, H), 0, 0);
  g.imageSmoothingEnabled = false; g.drawImage(tmp, 0, 0, W * OUT, H * OUT);
}
await draw();
window.DUR = 1; window.render = () => {}; window.READY = true;
