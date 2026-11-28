// px.js — the indexed pixel engine for CA ĐÊM (vertical): a 180×320 framebuffer of palette indices, presented through a lookup
// table (index → RGB) and scaled ×6 nearest-neighbour to 1080×1920. Lighting changes (the freezer flicker, the phone glow, the red
// heartbeat edge) are table swaps, never alpha. Adapted from the 16-bit Pixel RPG style engine.
export const W = 180, H = 320, SCALE = 6;
export const T = 255;
const HEX = [
  // 0–9 cold grey-blue (the colour of a life without love; also the hospital at the end)
  '#07080c', '#10131c', '#1a1f2c', '#262c3c', '#343b4e', '#465064', '#5c677c', '#7a8698', '#a2adbc', '#d6dde6',
  // 10–13 skin   14–16 brown hair   17–18 white/grey hair
  '#6a3a30', '#a86a50', '#e0a080', '#ffd0b0', '#2a160c', '#5a3218', '#8a5a2c', '#b8b8c0', '#e8e8f0',
  // 19–22 green (hills, grass)   23–26 sky (blue → warm)
  '#1a4a20', '#2e7a30', '#58b040', '#a0e060', '#3a6ad0', '#6aa8f0', '#f0c070', '#ffe0a0',
  // 27–30 sunset orange / pink   31–34 neon purple/pink
  '#8a3010', '#e06020', '#ff9a40', '#ffd080', '#3a1860', '#7a2aa0', '#e040a0', '#ff90d0',
  // 35–37 cyan screen   38–40 navy UI (protected: the UI never fades)
  '#0a4050', '#20a0c0', '#90f0ff', '#0c1238', '#1c2a6a', '#3a50b0',
  // 41–43 warm red/check (Mom's apron, curtains)   44–46 wood
  '#7a1a22', '#d03a40', '#ffb0b0', '#3a2010', '#6a4020', '#a06a38',
  // 47–51 PROTECTED gold (coins, GOLD, dust, gold bars)
  '#5a3a00', '#a06a00', '#e0a800', '#ffd830', '#fff6a0',
  // 52–54 PROTECTED red (the clock, the scarf)
  '#5a0010', '#c00820', '#ff3a3a',
  // 55 PROTECTED white (UI text, TIME's eye)   56–57 hourglass sand glow
  '#ffffff', '#6ad0e0', '#c0f8ff',
  // 58–59 pink heart (protected, for the half heart)   60 green monitor wave
  '#e04080', '#ff90b8', '#40ff70',
];
export const C = {
  ink: 0, n1: 1, n2: 2, n3: 3, n4: 4, n5: 5, n6: 6, n7: 7, n8: 8, n9: 9, v1: 10, v2: 11, v3: 12, v4: 13,
  f1: 14, f2: 15, f3: 16, f4: 17, u1: 18, u2: 19, u3: 20, u4: 21, s1: 22, s2: 23, s3: 24, s4: 25, h1: 26, h2: 27,
  r1: 28, r2: 29, r3: 30, r4: 31, p1: 32, p2: 33, p3: 34, p4: 35, w1: 36, w2: 37, w3: 38, w4: 39,
  orange: 40, mustard: 41, blue: 42, pink: 43, y1: 44, y2: 45, y3: 46, y4: 47, y5: 48, eye: 49, ph1: 50, ph2: 51, rain1: 52, rain2: 53, rain3: 54,
};
export const NPAL = HEX.length;
export const PROTECT = new Set([38, 39, 40, 47, 48, 49, 50, 51, 52, 53, 54, 55, 58, 59]);
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const RGB = HEX.map(rgb);
const pack = ([r, g, b]) => (255 << 24) | (b << 16) | (g << 8) | r;
const lutFrom = fn => { const L = new Uint32Array(256); for (let i = 0; i < NPAL; i++) L[i] = pack(fn(i)); return L; };
export const LUT = {};
LUT.full = lutFrom(i => RGB[i]);
// darkness by steps (the flicker, fades): protected colours untouched; q in quarters
export function darkLut(q, keep = true) { q = Math.round(q * 4) / 4; return lutFrom(i => keep && PROTECT.has(i) ? RGB[i] : RGB[i].map(v => v * (1 - q) | 0)); }
for (const q of [.25, .5, .75, .85, 1]) LUT['d' + q] = darkLut(q);
LUT.black = darkLut(1, false);
// LUT.phone = lutFrom(i => PROTECT.has(i) ? RGB[i] : (([r, g, b]) => [r * .55 | 0, g * .75 | 0, Math.min(255, b * 1.05 + 20) | 0])(RGB[i]));

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + .5) / 16;
export function hash(x, y = 0, z = 0) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

export class FB {
  constructor(w = W, h = H) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  clear(c = 0) { this.d.fill(c); }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === T || c == null) return; this.d[y * this.w + x] = c; }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T; return this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) this.px(x + i, y + j, typeof c === 'function' ? c(x + i, y + j) : c); }
  hline(x0, x1, y, c) { for (let x = Math.round(x0); x <= Math.round(x1); x++) this.px(x, y, c); }
  vline(x, y0, y1, c) { for (let y = Math.round(y0); y <= Math.round(y1); y++) this.px(x, y, c); }
  line(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  // filled ellipse; f(nx, ny, x, y) → index (nx, ny in −1..1)
  ell(cx, cy, rx, ry, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; if (nx * nx + ny * ny > 1) continue; this.px(x, y, typeof f === 'function' ? f(nx, ny, x, y) : f); } }
  poly(pts, f) { const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys)); for (let y = y0; y <= y1; y++) { const xs = [], yc = y + .5; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); } xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, typeof f === 'function' ? f(x, y) : f); } }
  // a thick capsule along a polyline with 3-tone shading across it (light from the upper left): cols = [dark, mid, light]
  cap(pts, r, cols) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0 - r); y <= y1 + r; y++) for (let x = Math.floor(x0 - r); x <= x1 + r; x++) { let best = 1e9, side = 0;
      for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = clamp(((x + .5 - ax) * dx + (y + .5 - ay) * dy) / L, 0, 1), qx = x + .5 - (ax + u * dx), qy = y + .5 - (ay + u * dy), d = Math.hypot(qx, qy); if (d < best) { best = d; side = (qx + qy) / (d || 1); } }
      if (best <= r) this.px(x, y, best > r - .9 && side > 0 ? cols[0] : side < -.3 && best > r * .3 ? cols[2] : cols[1]); } }
  // dithered choice between two indices
  dither(x0, y0, w, h, f, a, b) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x0 + x, Y = y0 + y; this.px(X, Y, bayer(X, Y) < f(X, Y) ? b : a); } }
  gradV(x0, y0, w, h, cols) { const n = cols.length - 1; for (let y = 0; y < h; y++) { const v = y / Math.max(1, h - 1) * n, b = Math.min(n - 1, Math.floor(v)), f = v - b; for (let x = 0; x < w; x++) this.px(x0 + x, y0 + y, cols[bayer(x0 + x, y0 + y) < f ? b + 1 : b]); } }
  // a 1-px ink outline around everything drawn into this buffer that isn't index T (used on sprite layers)
  outline(c = 0) { const src = this.d.slice(), add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (src[y * this.w + x] !== T) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h && src[Y * this.w + X] !== T) { add.push(y * this.w + x); break; } } } for (const i of add) this.d[i] = c; }
  over(dst, ox = 0, oy = 0) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.d[y * this.w + x]; if (c !== T) dst.px(x + ox, y + oy, c); } }
}
export const layer = () => { const L = new FB(); L.d.fill(T); return L; };

// output: index → RGB through a LUT (optionally a second LUT chosen per pixel), CRT post at output resolution, ×6
export function makeOut(canvas) {
  const lo = document.createElement('canvas'); lo.width = W; lo.height = H;
  const g = lo.getContext('2d'), img = g.createImageData(W, H), u32 = new Uint32Array(img.data.buffer);
  const o = canvas.getContext('2d'); o.imageSmoothingEnabled = false;
  return {
    u32,
    present(fb, lut, lutB = null, pick = null) { const d = fb.d; if (!lutB) for (let i = 0; i < d.length; i++) u32[i] = lut[d[i]]; else for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) u32[i] = (pick(x, y) ? lutB : lut)[d[i]]; },
    post(fn) { fn(u32); },
    show(crt = 1) {
      g.putImageData(img, 0, 0); o.drawImage(lo, 0, 0, W * SCALE, H * SCALE);
      if (crt > 0) {   // CRT layer: a dark gap under every art-pixel row (aligned to the pixel grid, never blurring) and a soft vignette
        o.fillStyle = `rgba(0,0,0,${.22 * crt})`; for (let y = 5; y < H * SCALE; y += 6) o.fillRect(0, y, W * SCALE, 1);
        const vg = o.createRadialGradient(W * SCALE / 2, H * SCALE / 2, H * SCALE * .3, W * SCALE / 2, H * SCALE / 2, H * SCALE * .62);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.45 * crt})`); o.fillStyle = vg; o.fillRect(0, 0, W * SCALE, H * SCALE);
      }
    },
    ctx: o,
  };
}
// a LUT from a per-colour function (protected colours kept unless keep = false)
export function lutMap(fn, keep = true) { const L = new Uint32Array(256); for (let i = 0; i < NPAL; i++) L[i] = pack(keep && PROTECT.has(i) ? RGB[i] : fn(RGB[i], i).map(v => Math.max(0, Math.min(255, v | 0)))); return L; }
export function whiteLut(q) { q = Math.round(q * 4) / 4; return lutMap(c => c.map(v => v + (255 - v) * q), false); }
// colour = love: L hearts of 5. Each lost heart takes ~20 % of the saturation; at 0 the scene collapses to 4 cold greys.
// Gold, the clock's red, the scarf's red, the UI and the half pink heart are protected.
const COLD = ['#10131c', '#3a4254', '#6c788c', '#b4bcc8'].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const _love = {};
export function loveLut(L) {
  L = Math.round(Math.max(0, Math.min(5, L)) * 4) / 4; if (_love[L]) return _love[L];
  const k = 1 - L / 5;
  return (_love[L] = lutMap(([r, g, b]) => {
    const y = .299 * r + .587 * g + .114 * b, grey = [y * .9, y * .95, y * 1.08];
    if (L === 0) { const q = Math.min(3, Math.floor(y / 256 * 4)); return COLD[q]; }
    return [r + (grey[0] - r) * k, g + (grey[1] - g) * k, b + (grey[2] - b) * k];
  }));
}
