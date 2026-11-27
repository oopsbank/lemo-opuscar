// Tunnel or Bridge? — one timeline. Film seconds t ↔ race seconds s (sim). Two ambulances leave the ferry quay at s = 0:
// A (blue roof) through the tunnel under the canal, B (orange roof) over the drawbridge. Both run on a physical speed profile
// (accel/brake limits, slow corners, the camper, the bridge stop); their top speeds are solved so A crosses the bay line at 39.95, B at 40.05.
import { clamp, seg, lerp, eio } from '/core/lib.js';

export const DUR = 34.8;
export const FIN = { A: 39.95, B: 40.05 };
// bridge: bell, barriers down, leaves up, sailboat through, leaves down, barriers up (race seconds)
export const BR = { bell: 12.3, barDown: 13.2, up0: 15.0, up1: 18.4, sail0: 16.6, sail1: 22.2, dn0: 21.2, dn1: 23.6, barUp: 24.0, go: 24.3 };
export const CAMPER = { x: -127.2, z: 727, bar: 723.5 };
export const BAY = { x: -7.5, zA: 587, zB: 597 };   // the painted bay line (x) and each ambulance's slot (z)
export const PORTAL = { S: 712, N: 600, x0: -142, x1: -118 };

// —— paths: rounded polylines, sampled by arc length ——
function makePath(pts, r = 7) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0 || i === pts.length - 1) { out.push(p); continue; }
    const a = pts[i - 1], b = pts[i + 1];
    const da = Math.hypot(p[0] - a[0], p[1] - a[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, da * .45, db * .45);
    const p0 = [p[0] + (a[0] - p[0]) / da * rr, p[1] + (a[1] - p[1]) / da * rr], p1 = [p[0] + (b[0] - p[0]) / db * rr, p[1] + (b[1] - p[1]) / db * rr];
    for (let k = 0; k <= 10; k++) { const u = k / 10, w0 = (1 - u) ** 2, w1 = 2 * u * (1 - u), w2 = u * u; out.push([w0 * p0[0] + w1 * p[0] + w2 * p1[0], w0 * p0[1] + w1 * p[1] + w2 * p1[1]]); }
  }
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const at = d => {
    d = clamp(d, 0, L[L.length - 1]); let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]), a = out[i - 1], b = out[i];
    return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  };
  // arc length where the path first crosses a line (axis 0: x = v, axis 1: z = v)
  const cross = (axis, v, last = false) => { for (let j = 1; j < out.length; j++) { const i = last ? out.length - j : j; const a = out[i - 1][axis], b = out[i][axis]; if ((a - v) * (b - v) <= 0 && a !== b) return L[i - 1] + (L[i] - L[i - 1]) * (v - a) / (b - a); } return null; };
  // corners: arc length of each original vertex (for speed limits)
  return { pts: out, L, len: L[L.length - 1], at, cross };
}
const LA = -2.8;   // lane offset from a street's centre line (right-hand traffic)
export const PATH = {
  A: makePath([[-22, 746 - LA], [-130 - LA, 746 - LA], [-130 - LA, 520 - LA], [0 + LA, 520 - LA], [0 + LA, BAY.zA - 7], [BAY.x, BAY.zA], [-17, BAY.zA]], 8),
  B: makePath([[-18, 746 + 2.8], [120 + 2.8, 746 + 2.8], [120 + 2.8, 630 - 2.8], [0 + 2.8, 630 - 2.8], [0 + 2.8, BAY.zB + 7], [BAY.x, BAY.zB], [-17, BAY.zB]], 8),
};
// where each run's nose crosses the bay line (the ambulance is 6.4 m long, its centre 3.2 m behind the nose)
const FD = {};
const finD = k => { if (FD[k] === undefined) { const P = PATH[k]; let d = P.len; while (d > 0) { const p = P.at(d); if (p.x + 3.4 * Math.sin(p.yaw) > BAY.x) break; d -= .02; } FD[k] = d; } return FD[k]; };
// A's swerve past the camper: lateral offset (m, to the left) along its path
const dCamper = PATH.A.cross(1, CAMPER.z + 6), dCamper1 = PATH.A.cross(1, CAMPER.bar - 8);
export const swerveA = d => 5.6 * Math.min(clamp((d - dCamper + 14) / 10), 1 - clamp((d - dCamper1) / 10));

// speed profile: integrate with accel/brake limits; limits = [{d, v}] point constraints, zones = [{d0, d1, v}], stop = {d, until}
function profile(P, vmax, { limits = [], zones = [], stop = null, vPre = null } = {}) {
  const A = 3.6, Bk = 5.2, dt = 1 / 240, D = [[0, 0]];
  let t = 0, d = 0, v = 0;
  while (d < P.len - .05 && t < 80) {
    let cap = (vPre && stop && d < stop.d) ? vPre : vmax;
    for (const z of zones) if (d > z.d0 - 1 && d < z.d1) cap = Math.min(cap, z.v);
    for (const c of limits) if (c.d > d) cap = Math.min(cap, Math.sqrt(c.v * c.v + 2 * Bk * (c.d - d)));
    for (const z of zones) if (z.d0 > d) cap = Math.min(cap, Math.sqrt(z.v * z.v + 2 * Bk * (z.d0 - d)));
    if (stop && t < stop.until && d < stop.d) cap = Math.min(cap, Math.sqrt(Math.max(0, 2 * Bk * (stop.d - d))));
    cap = Math.min(cap, Math.sqrt(2 * Bk * Math.max(0, P.len - d)) + .3);
    v = v < cap ? Math.min(cap, v + A * dt) : Math.max(cap, v - Bk * 1.4 * dt);
    const held = stop && t < stop.until && d < stop.d;
    d = Math.min(P.len, d + v * dt); if (held) d = Math.min(d, stop.d - 1e-3); t += dt;
    if (Math.round(t * 240) % 6 === 0) D.push([t, d]);
  }
  D.push([t + .01, P.len]);
  return D;
}
const cornerLimits = (P, v = 8.5) => { const out = []; for (let i = 1; i < P.pts.length - 1; i++) { const a = P.pts[i - 1], b = P.pts[i], c = P.pts[i + 1]; const t1 = Math.atan2(b[0] - a[0], b[1] - a[1]), t2 = Math.atan2(c[0] - b[0], c[1] - b[1]); let dy = Math.abs(t2 - t1); if (dy > Math.PI) dy = 2 * Math.PI - dy; if (dy > .04) out.push({ d: P.L[i], v }); } return out; };
const tAt = (D, d) => { for (let i = 1; i < D.length; i++) if (D[i][1] >= d) return D[i - 1][0] + (D[i][0] - D[i - 1][0]) * (d - D[i - 1][1]) / Math.max(1e-9, D[i][1] - D[i - 1][1]); return D[D.length - 1][0]; };
const dAtT = (D, t) => { if (t <= 0) return 0; for (let i = 1; i < D.length; i++) if (D[i][0] >= t) return D[i - 1][1] + (D[i][1] - D[i - 1][1]) * (t - D[i - 1][0]) / Math.max(1e-9, D[i][0] - D[i - 1][0]); return D[D.length - 1][1]; };
function solve(k, opts, target) {
  let lo = 8, hi = 30, D;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; D = profile(PATH[k], m, opts); if (tAt(D, finD(k)) > target) lo = m; else hi = m; }
  return { D, vmax: (lo + hi) / 2 };
}
const stopB = PATH.B.cross(1, 669.4 + 3.4);   // B's nose stops just short of the south barrier
const optsA = { limits: cornerLimits(PATH.A), zones: [{ d0: dCamper - 6, d1: dCamper1 - 2, v: 6.5 }] };
const SA = solve('A', optsA, FIN.A);
// B is the same ambulance (same top speed): solve when its barrier lifts so it crosses the line at FIN.B
const optsB = go => ({ limits: cornerLimits(PATH.B), stop: { d: stopB, until: go } });
let gLo = 16, gHi = 36, DB;
for (let i = 0; i < 40; i++) { const m = (gLo + gHi) / 2; DB = profile(PATH.B, SA.vmax, optsB(m)); if (tAt(DB, finD('B')) > FIN.B) gHi = m; else gLo = m; }
BR.go = (gLo + gHi) / 2; BR.barUp = BR.go - .35; BR.dn1 = BR.go - .75; BR.dn0 = BR.dn1 - 2.6; BR.sail1 = BR.dn0 + .6;
export const RUN = { A: SA.D, B: DB, vmax: { A: SA.vmax, B: SA.vmax } };
export const dist = (k, s) => dAtT(RUN[k], s);
export const pose = (k, s) => { const d = dist(k, s), p = PATH[k].at(d); if (k === 'A') { const o = swerveA(d), c = Math.cos(p.yaw), sn = Math.sin(p.yaw); p.x += c * o; p.z -= sn * o; } return { ...p, d }; };
export const speedOf = (k, s) => (dist(k, s + .1) - dist(k, Math.max(0, s - .1))) / (s < .1 ? .1 + s : .2);
export const toGo = (k, s) => Math.max(0, finD(k) - dist(k, s));
export const T_ENTER = tAt(RUN.A, PATH.A.cross(1, PORTAL.S + 3.2)), T_EXIT = tAt(RUN.A, PATH.A.cross(1, PORTAL.N + 3.2));
export const T_CAMPER = tAt(RUN.A, dCamper - 6), T_STOPB = tAt(RUN.B, stopB - .3);
export const LEN = { A: finD('A'), B: finD('B') };
export const inTunnel = s => s > T_ENTER && s < T_EXIT;

// film ↔ race time: the open is the finish (slow), a rewind to the start, the race, the finish again in ×¼, and a rewind dive at the seam
const KEYS = [[0, 39.15], [1.6, 39.55], [2.6, 0], [3.2, 0], [16, 15], [20, 19], [23, 27], [26.2, 37.6], [27.8, 39.6], [29.6, 40.05], [34.25, 44.7], [DUR - 1 / 24, 39.15], [DUR + 1, 39.15]];
export function sim(t) { for (let i = 0; i < KEYS.length - 1; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (t <= b || i === KEYS.length - 2) { let u = (t - a) / (b - a); if (i === 1 || i === KEYS.length - 3) u = eio(u); return sa + (sb - sa) * u; } } return 0; }
export function rate(t) { const h = 1 / 48; return (sim(t + h) - sim(t - h)) / (2 * h); }
export const isRewind = t => (t > 1.6 && t < 2.6) || t > 34.25;
export const invSim = s => { for (let i = 2; i < KEYS.length - 2; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (s >= sa && s <= sb && sb > sa) return a + (b - a) * (s - sa) / (sb - sa); } return null; };

export const VO = [
  { id: 'v1', t: 0.05, text: 'Tunnel or bridge? Pick one. Now!' },
  { id: 'v2', t: 2.2, text: 'Forty seconds earlier.' },
  { id: 'v3', t: 3.6, text: 'Blue takes the tunnel. Orange takes the bridge.' },
  { id: 'v4', t: 6.6, text: 'The bridge way is a hundred metres shorter.' },
  { id: 'v5', t: 9.3, text: 'A camper is stuck at the tunnel!' },
  { id: 'v6', t: 11.7, text: 'Squeeze past. Into the tunnel!' },
  { id: 'v7', t: 15.0, text: "Blue's under the canal now." },
  { id: 'v8', t: 16.7, text: 'Oh no. The bridge is going up!' },
  { id: 'v9', t: 18.6, text: 'A sailboat. Orange has to wait.' },
  { id: 'v10', t: 21.2, text: "It's down! Go, orange!" },
  { id: 'v11', t: 23.6, text: 'Here they both come!' },
  { id: 'v12', t: 26.3, text: "It's going to be close!" },
  { id: 'v13', t: 29.15, text: 'Tunnel, by a nose! Tunnels never stop for boats.' },
  { id: 'v14', t: 32.2, text: 'Next: one tow truck, two hundred cars.' },
];
export const SHOTS = [
  { id: 'open', t0: 0, t1: 1.6 }, { id: 'rewind', t0: 1.6, t1: 3.2 }, { id: 'start', t0: 3.2, t1: 6.2 }, { id: 'brun', t0: 6.2, t1: 9.2 },
  { id: 'camper', t0: 9.2, t1: 13.2 }, { id: 'tunnel', t0: 13.2, t1: 16 }, { id: 'twist', t0: 16, t1: 20 }, { id: 'comeback', t0: 20, t1: 23 },
  { id: 'converge', t0: 23, t1: 26.2 }, { id: 'final', t0: 26.2, t1: 31.5 }, { id: 'rise', t0: 31.5, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg, lerp, eio };

// the harbour dressing (harbour.js) keeps clear of a berth; there is no ship in this film
export const QZ = 792, SHIP = { x: 9999, half: 14 };
