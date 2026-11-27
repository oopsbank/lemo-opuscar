// Storm Surge vs the Sea Wall — one timeline (film seconds). The surge clock counts 45:00 → 0:00 (clock seconds R).
import { clamp, seg, lerp, eio } from '/core/lib.js';

export const BPM = 120, DUR = 39.3, CLOCK0 = 2700;
// clock speed per film second; D ramps from K0 down to ×1 so the real-time stretch starts at 0:06
const A = 150, C = 120;
const E8 = 8 * A, E106 = E8 + 2.6, E21 = E106 + (21 - 10.6) * C, NEED = CLOCK0 - 6 - E21;   // seconds the ramp (21–26) must cover
const K0 = 1 + 3 * (NEED / 5 - 1);                                                         // ∫ 1 + (K0-1)(1-u)² over 5 s = NEED
export const SPEED = [
  { t0: 0, t1: 8, x: 'tl', k: () => A },
  { t0: 8, t1: 10.6, x: 'real', k: () => 1 },
  { t0: 10.6, t1: 21, x: 'tl', k: () => C },
  { t0: 21, t1: 26, x: 'ramp', k: t => 1 + (K0 - 1) * (1 - seg(t, 21, 26)) ** 2 },
  { t0: 26, t1: 34, x: 'real', k: () => 1 },
  { t0: 34, t1: 999, x: 'tl', k: () => 600 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
// elapsed clock seconds at film time t (stops at the impact, 0:00)
export function elapsed(t) {
  if (t <= 8) return t * A;
  if (t <= 10.6) return E8 + (t - 8);
  if (t <= 21) return E106 + (t - 10.6) * C;
  if (t <= 26) { const u = seg(t, 21, 26); return E21 + 5 * (u + (K0 - 1) * (1 - (1 - u) ** 3) / 3); }
  return Math.min(CLOCK0, CLOCK0 - 6 + (t - 26));
}
export const T = { g1: [5.2, 7.0], g2try: [8.35, 9.25], g2: [14.0, 15.0], g3: [17.8, 19.6], g4: [24.6, 30.0], impact: 32.0, rise: 34.0 };
export const remaining = t => Math.max(0, CLOCK0 - elapsed(t));
// the "reset" during the rise: 0 until 34, 1 at the end (the sea goes back out, the gates reopen, the opening state returns)
export const reset = t => eio(seg(t, T.rise + .6, DUR - .25));

// the surge front (z of the foamy line) from the clock; during the rise it goes back out to the opening position
export const frontZ = R => 792 + .05 * R + 8 * R / (1 + R / 40);
export function front(t) {
  const R = remaining(t), z0 = frontZ(CLOCK0);
  if (t < T.impact) return frontZ(R);
  const after = t - T.impact;                    // the front runs up the wall and spreads; then the rise sends it back out
  const zw = 792 - Math.min(6, after * 6);
  return lerp(zw, z0, reset(t));
}
// sea level (y): base rises with the clock; the surge adds +1.8 behind the front
export const baseLevel = t => lerp(lerp(-1.7, -.55, clamp(elapsed(t) / CLOCK0)), -1.7, reset(t));
export const SURGE = 1.8;
// gate closure 0 (open) … 1 (shut)
export function gate(i, t) {
  const back = 1 - reset(t);
  if (i === 0) return eio(seg(t, ...T.g1)) * back;
  if (i === 1) { const tryU = eio(seg(t, ...T.g2try)) * .39; const bump = t > T.g2try[1] ? -.025 * Math.exp(-(t - T.g2try[1]) * 6) * Math.sin((t - T.g2try[1]) * 30) : 0; return Math.max(tryU + bump, lerp(.39, 1, eio(seg(t, ...T.g2)))) * back; }
  if (i === 2) return eio(seg(t, ...T.g3)) * back;
  return seg(t, ...T.g4) ** 1.05 * back;
}
export const gatesShut = t => [0, 1, 2, 3].filter(i => gate(i, t) > .995).length;

export const VO = [
  { id: 'v1', t: 0.0, text: 'Storm surge. Four gates. Forty-five minutes.', say: 'Storm surge. Four gates. Forty-five minutes.' },
  { id: 'v2', t: 3.5, text: 'Gate one: the canal. The big one.', say: 'Gate one: the canal. The big one.' },
  { id: 'v3', t: 8.15, text: 'Gate two. Someone parked in it!', say: 'Gate two. Someone parked in it!' },
  { id: 'v4', t: 11.0, text: 'Call a tow truck. Hurry!', say: 'Call a tow truck. Hurry!' },
  { id: 'v5', t: 15.9, text: 'Gate three. Here comes the wave.', say: 'Gate three. Here comes the wave.' },
  { id: 'v6', t: 21.2, text: 'Last gate: the fish market.', say: 'Last gate: the fish market.' },
  { id: 'v7', t: 23.6, text: 'Everybody off the quay!', say: 'Everybody off the quay!' },
  { id: 'v8', t: 26.6, text: 'Come on. Close!', say: 'Come on. Close!' },
  { id: 'v9', t: 32.8, text: 'It held.', say: 'It held.' },
  { id: 'v10', t: 34.1, text: 'Storm surge: the sea, pushed in by wind.', say: 'Storm surge: the sea, pushed in by wind.' },
  { id: 'v11', t: 37.25, text: 'Would you close the canal first?', say: 'Would you close the canal first?' },
];

export const SHOTS = [
  { id: 'open', t0: 0, t1: 3.2 },
  { id: 'g1', t0: 3.2, t1: 8 },
  { id: 'g2a', t0: 8, t1: 10.6 },
  { id: 'g2b', t0: 10.6, t1: 15.6 },
  { id: 'g3', t0: 15.6, t1: 21 },
  { id: 'g4a', t0: 21, t1: 26 },
  { id: 'g4b', t0: 26, t1: 34 },
  { id: 'rise', t0: 34, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg };
