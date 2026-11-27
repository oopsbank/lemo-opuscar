// Two Tugs, One Giant Ship — one timeline (film seconds). The ship drifts toward the quay; two tugs on lines hold it off.
import { clamp, seg, lerp, eio, monotone } from '/core/lib.js';

export const DUR = 30.5;
export const SHIP = { x: 60, len: 184, beam: 28, half: 14 };
export const QZ = 792;   // the quay edge
// distance (m) from the quay edge to the ship's side at the bow and at the stern
export const dBow = monotone([[0, 64], [2.5, 58], [7, 47], [11, 39], [13, 34], [15, 30], [17, 23], [19, 17], [21.5, 10], [24, 4.4], [25.5, 2.0], [DUR, 2.0]]);
export const dStern = monotone([[0, 66], [2.5, 60], [7, 48], [11.6, 39], [12.4, 36.5], [14, 23], [16, 16.5], [19, 12.5], [21.5, 8.5], [24, 4.2], [25.5, 2.0], [DUR, 2.0]]);
// how hard each tug pulls (0–100)
export const pullRed = monotone([[0, 0], [4.6, 0], [6.4, 62], [11, 70], [15, 72], [15.6, 0], [18.2, 0], [19.2, 88], [22, 100], [25.5, 100], [26.4, 8], [DUR, 8]]);
export const pullBlue = monotone([[0, 0], [5.0, 0], [6.8, 60], [11.4, 76], [11.95, 80], [12.0, 0], [16.6, 0], [17.6, 86], [22, 100], [25.5, 100], [26.4, 8], [DUR, 8]]);
export const T = { snap: 12.0, reconnect: 16.8, sail0: 14.6, sail1: 19.2, stop: 25.5, red: 4.6, blue: 5.0 };
// the share of the work each tug did up to t (integral of the pull)
const W = (() => { const r = [], b = []; let a = 0, c = 0; for (let k = 0; k <= DUR * 24; k++) { const t = k / 24; a += pullRed(t) / 24; c += pullBlue(t) / 24; r.push(a); b.push(c); } return { r, b }; })();
export const workShare = t => { const k = Math.min(W.r.length - 1, Math.max(0, Math.round(t * 24))); const s = W.r[k] + W.b[k]; return s > 0 ? W.r[k] / s : .5; };

export const SPEED = [
  { t0: 0, t1: 11.5, x: 'tl', k: 4 }, { t0: 11.5, t1: 13, x: 'real', k: 1 }, { t0: 13, t1: 21.5, x: 'tl', k: 4 },
  { t0: 21.5, t1: 26.5, x: 'real', k: 1 }, { t0: 26.5, t1: 999, x: 'tl', k: 6 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];

export const VO = [
  { id: 'v1', t: 0.0, text: "This ship won't stop." },
  { id: 'v2', t: 1.9, text: 'Two tugs. Pick one: red or blue.' },
  { id: 'v3', t: 5.0, text: "Red takes the front. Blue takes the back." },
  { id: 'v4', t: 8.4, text: "This slow, a ship's rudder barely works." },
  { id: 'v5', t: 12.0, text: "Blue's line snapped!" },
  { id: 'v6', t: 14.0, text: 'Sailboat! Red has to let go.' },
  { id: 'v7', t: 17.2, text: 'Blue is back on.' },
  { id: 'v8', t: 19.4, text: 'Both of you. Full power!' },
  { id: 'v9', t: 22.6, text: 'Four metres… three…' },
  { id: 'v10', t: 25.6, text: 'Two metres. Stopped.' },
  { id: 'v11', t: 27.2, text: 'Red or blue: who did more?' },
];
export const SHOTS = [
  { id: 'open', t0: 0, t1: 2.5 }, { id: 'race', t0: 2.5, t1: 8 }, { id: 'pull', t0: 8, t1: 11.5 }, { id: 'snap', t0: 11.5, t1: 14 },
  { id: 'sail', t0: 14, t1: 19 }, { id: 'both', t0: 19, t1: 21.5 }, { id: 'real', t0: 21.5, t1: 27 }, { id: 'rise', t0: 27, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg, lerp, eio };
