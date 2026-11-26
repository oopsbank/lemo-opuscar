// toon.js — flat vector cartoon engine for one 2D canvas (adapted from Lemo-Opuscar's scifi-toon toon.js, MIT, without the line boil)
// Keeps its own affine matrix: points are transformed to canvas pixels before stroking, so line widths are given in canvas pixels
// (card.js sets them from the card's projected size: a constant width on screen at every shot size).
// Flat colour: fill → hard-edged shadow shapes clipped inside → stroke last.
import { clamp, lerp } from '/core/lib.js';
export const INK = '#1c1418';
export const TAU = Math.PI * 2;

export class Toon {
  constructor(g) { this.g = g; this.M = [1, 0, 0, 1, 0, 0]; this.ST = []; this.lw = 7; }
  reset() { this.M = [1, 0, 0, 1, 0, 0]; this.ST.length = 0; }
  push() { this.ST.push(this.M.slice()); }
  pop() { this.M = this.ST.pop(); }
  translate(x, y) { const M = this.M; this.M = [M[0], M[1], M[2], M[3], M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]; }
  rotate(a) { const M = this.M, c = Math.cos(a), s = Math.sin(a); this.M = [M[0] * c + M[2] * s, M[1] * c + M[3] * s, -M[0] * s + M[2] * c, -M[1] * s + M[3] * c, M[4], M[5]]; }
  scale(sx, sy = sx) { const M = this.M; this.M = [M[0] * sx, M[1] * sx, M[2] * sy, M[3] * sy, M[4], M[5]]; }
  tx(x, y) { const M = this.M; return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]; }
  zoom() { const M = this.M; return Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])); }
  path(pts, closed) {
    const P = new Path2D(); const s = pts.map(p => this.tx(p[0], p[1]));
    P.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) P.lineTo(s[i][0], s[i][1]);
    if (closed) P.closePath(); return P;
  }
  // fill, shade (draw inside the clip), stroke; returns the Path2D
  shape(pts, o = {}) {
    const g = this.g, closed = o.closed !== false, P = this.path(pts, closed);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (o.alpha != null) g.globalAlpha = o.alpha;
    if (o.fill && closed) { g.fillStyle = o.fill; g.fill(P); }
    if (o.shade) { g.save(); g.clip(P); o.shade(); g.restore(); }
    if (o.stroke !== false) this.outline(P, o.lw ?? this.lw, o.line ?? INK);
    if (o.alpha != null) g.globalAlpha = 1;
    return P;
  }
  outline(P, lw = this.lw, col = INK) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = col; g.stroke(P); }
  fillOnly(pts, fill) { return this.shape(pts, { fill, stroke: false }); }
  line(pts, lw = this.lw, col = INK) { const P = this.path(pts, false); this.outline(P, lw, col); return P; }
  dot(x, y, rPx, col = INK) { const [a, b] = this.tx(x, y), g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = col; g.beginPath(); g.arc(a, b, Math.max(.8, rPx), 0, TAU); g.fill(); }
}

// —— shape points in local coordinates ——
export function ell(cx, cy, rx, ry, n = 48, a0 = 0) { const p = []; for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
export function arc(cx, cy, rx, ry, a0, a1, n = 24) { const p = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
export function quad(a, c, b, n = 16) { const p = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return p; }
// Catmull-Rom spline through control points
export function spline(c, closed = true, k = 8) {
  const n = c.length, out = [], P = i => closed ? c[(i + n) % n] : c[clamp(i, 0, n - 1)];
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  if (!closed) out.push(c[n - 1]);
  return out;
}
export function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); const p = [];
  const c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a] of c) for (let i = 0; i <= 6; i++) { const b = a + i / 6 * Math.PI / 2; p.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); }
  return p;
}
// a limb as a quadratic curve from a to b, bent sideways by `bend` (local units)
export function limb(a, b, bend) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return quad(a, [(a[0] + b[0]) / 2 + nx * bend, (a[1] + b[1]) / 2 + ny * bend], b, 14);
}
