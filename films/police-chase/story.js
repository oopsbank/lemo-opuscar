// Police Chase — one timeline. Film seconds t ↔ chase seconds s (sim). A thief in a red race car races south down the
// boulevard, east along the market street, then south for the drawbridge and the ferry. Police cars chase him; the police
// raise the bridge; he skids to a stop at the barrier and is boxed in. Every car runs on a speed profile (accel/brake limits,
// slow corners, a stop at the end of its path).
import { clamp, seg, lerp, eio } from '/core/lib.js';

export const DUR = 31.5;
export const CROSS = { x: 88, z: 520 };        // the zebra crossing on the market street (the near miss)
export const FERRY = { x: 150, z: 812 };       // moored at the quay, south of the bridge

// —— paths ——
function makePath(pts, r = 7) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0 || i === pts.length - 1) { out.push(p); continue; }
    const a = pts[i - 1], b = pts[i + 1];
    const da = Math.hypot(p[0] - a[0], p[1] - a[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, da * .45, db * .45);
    const p0 = [p[0] + (a[0] - p[0]) / da * rr, p[1] + (a[1] - p[1]) / da * rr], p1 = [p[0] + (b[0] - p[0]) / db * rr, p[1] + (b[1] - p[1]) / db * rr];
    for (let k = 0; k <= 12; k++) { const u = k / 12, w0 = (1 - u) ** 2, w1 = 2 * u * (1 - u), w2 = u * u; out.push([w0 * p0[0] + w1 * p[0] + w2 * p1[0], w0 * p0[1] + w1 * p[1] + w2 * p1[1]]); }
  }
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const at = d => {
    d = clamp(d, 0, L[L.length - 1]); let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]), a = out[i - 1], b = out[i];
    return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  };
  const near = (x, z) => { let best = 0, bd = 1e9; for (let i = 0; i < out.length; i++) { const dd = Math.hypot(out[i][0] - x, out[i][1] - z); if (dd < bd) { bd = dd; best = L[i]; } } return best; };
  return { pts: out, L, len: L[L.length - 1], at, near };
}
const R_ = [[-6.4, 385], [-6.4, 524], [117.2, 524], [117.2, 629.5]];   // the thief: south on the boulevard, east, south to the bridge
export const PATH = {
  thief: makePath(R_, 10),
  p1: makePath([[-6.4, 350], ...R_.slice(1, 3), [117.2, 619.5]], 10),                          // lead police car, stops right behind him
  p2: makePath([[-6.4, 322], ...R_.slice(1, 3), [117.2, 590], [122.6, 606], [122.6, 625]], 10), // second car, pulls alongside (east)
  p3: makePath([[30, 632.8], [108.5, 632.8]], 8),                                             // third car, along the canal road: blocks the west side
};
function profile(P, vmax, { A = 4.5, Bk = 7, v0 = 0, corner = 11, t0 = 0 } = {}) {
  const lim = []; for (let i = 1; i < P.pts.length - 1; i++) { const a = P.pts[i - 1], b = P.pts[i], c = P.pts[i + 1]; let dy = Math.abs(Math.atan2(c[0] - b[0], c[1] - b[1]) - Math.atan2(b[0] - a[0], b[1] - a[1])); if (dy > Math.PI) dy = 2 * Math.PI - dy; if (dy > .05) lim.push({ d: P.L[i], v: corner }); }
  const dt = 1 / 240, D = [[t0, 0]]; let t = t0, d = 0, v = v0;
  while (d < P.len - .02 && t < 60) {
    let cap = vmax;
    for (const c of lim) if (c.d > d) cap = Math.min(cap, Math.sqrt(c.v * c.v + 2 * Bk * (c.d - d)));
    cap = Math.min(cap, Math.sqrt(2 * Bk * Math.max(0, P.len - d)) + .2);
    v = v < cap ? Math.min(cap, v + A * dt) : Math.max(cap, v - Bk * 1.5 * dt);
    d = Math.min(P.len, d + v * dt); t += dt;
    if (Math.round(t * 240) % 4 === 0) D.push([t, d]);
  }
  D.push([t + .01, P.len]);
  return D;
}
const tAt = (D, d) => { for (let i = 1; i < D.length; i++) if (D[i][1] >= d) return D[i - 1][0] + (D[i][0] - D[i - 1][0]) * (d - D[i - 1][1]) / Math.max(1e-9, D[i][1] - D[i - 1][1]); return D[D.length - 1][0]; };
const dAtT = (D, t) => { if (t <= D[0][0]) return 0; for (let i = 1; i < D.length; i++) if (D[i][0] >= t) return D[i - 1][1] + (D[i][1] - D[i - 1][1]) * (t - D[i - 1][0]) / Math.max(1e-9, D[i][0] - D[i - 1][0]); return D[D.length - 1][1]; };
export const RUN = {
  thief: profile(PATH.thief, 26, { A: 6, Bk: 9.5, v0: 22, corner: 12.5 }),
  p1: profile(PATH.p1, 26.5, { A: 6, Bk: 9, v0: 22, corner: 12 }),
  p2: profile(PATH.p2, 26, { A: 6, Bk: 9, v0: 21, corner: 11.5 }),
};
export const dist = (k, s) => dAtT(RUN[k], s);
export const T_STOP = tAt(RUN.thief, PATH.thief.len - .05);
export const T_CROSS = tAt(RUN.thief, PATH.thief.near(CROSS.x, 524));
export const T_TURN2 = tAt(RUN.thief, PATH.thief.near(117.2, 530));
export const T_TURN1 = tAt(RUN.thief, PATH.thief.near(-6.4, 520));
RUN.p3 = profile(PATH.p3, 20, { A: 6, Bk: 8, v0: 4, t0: T_STOP - 4.2 });
// the bridge (chase seconds): the police call it in as he turns south; bell, barriers, leaves up before he arrives
export const BR = { bell: T_CROSS + .6, barDown: T_CROSS + 1.3, up0: T_CROSS + 1.6, up1: T_CROSS + 4.8 };
// the skid: in the last 14 m he brakes, the tail swings out ~60°
export const skid = s => { const d = dist('thief', s), k = clamp((d - (PATH.thief.len - 16)) / 16); return -1.05 * (k * k * (3 - 2 * k)); };
export const pose = (k, s) => {
  const P = PATH[k], d = dist(k, s), p = P.at(d);
  if (k === 'thief') p.yaw += skid(s);
  return { ...p, d, v: (dist(k, s + .05) - dist(k, s - .05)) / .1 };
};
// the arrest (chase seconds after the stop)
export const ARR = { out: T_STOP + 3.6, hands: T_STOP + 4.4, cops: T_STOP + 3.0, walk: T_STOP + 4.0, ferry: T_STOP + 6.5 };

// film ↔ chase time: ×1, except a ×0.3 slow-mo through the near miss at the crossing
const SL = { a: T_CROSS - 1.0, b: T_CROSS + 0.4, k: .3 };
export const SLOW = { t0: SL.a, t1: SL.a + (SL.b - SL.a) / SL.k };
export function sim(t) { if (t <= SLOW.t0) return t; if (t <= SLOW.t1) return SL.a + (t - SLOW.t0) * SL.k; return SL.b + (t - SLOW.t1); }
export const invSim = s => s <= SL.a ? s : s <= SL.b ? SLOW.t0 + (s - SL.a) / SL.k : SLOW.t1 + (s - SL.b);

export const VO = [
  { id: 'v1', t: 0.1, text: 'Stop that car!' },
  { id: 'v2', t: 1.6, text: "He's a thief!" },
  { id: 'v3', t: 3.4, text: "He's racing for the ferry." },
  { id: 'v4', t: 5.45, text: 'The police are right behind.' },
  { id: 'v5', t: 0, text: 'He speeds through a crossing!' },
  { id: 'v6', t: 0, text: 'Everyone jumps clear.' },
  { id: 'v7', t: 0, text: 'So police raise the bridge.' },
  { id: 'v7b', t: 0, text: 'Up goes the bridge!' },
  { id: 'v7c', t: 0, text: 'He slams on the brakes!' },
  { id: 'v8', t: 0, text: 'He has nowhere to go.' },
  { id: 'v9', t: 0, text: 'Police cars block him in.' },
  { id: 'v10', t: 0, text: "Hands up. He's caught!" },
  { id: 'v11', t: 0, text: 'The ferry leaves without him.' },
];
// voice cues tied to the action
const at = (id, t) => { VO.find(v => v.id === id).t = +t.toFixed(2); };
at('v5', SLOW.t0 - 1.9); at('v6', SLOW.t0 + .9); at('v7', SLOW.t1 + .05); at('v7b', invSim(BR.up0) + 1.0); at('v7c', invSim(T_STOP) - 2.0); at('v8', invSim(T_STOP) + .1);
at('v9', invSim(T_STOP) + 2.15); at('v10', invSim(ARR.hands) - .1); at('v11', invSim(ARR.ferry));
export { clamp, seg, lerp, eio };

// the harbour dressing (harbour.js) keeps clear of a berth: the ferry's
export const QZ = 792, SHIP = { x: 150, half: 14 };
