// All Green — one timeline. Film seconds t ↔ simulation seconds (grid.js). The clock counts down to Engine 9 rolling out.
import { clamp, seg, lerp, eio } from '/core/lib.js';
import { simulate, LOCKS_DEFAULT } from './grid.js';

export const DUR = 32.3, T_ROLL = 119.5;
// film → sim, piecewise linear (the speed readout shows the slope); the film opens with the lights already green and the crash coming
const KEYS = [[0, 2.5], [2.5, 7], [5.5, 18], [9, 45], [11.5, 58], [16.5, 72], [21.5, 115.5], [26, 120], [29, 135], [DUR, 152]];
export function sim(t) { for (let i = 0; i < KEYS.length - 1; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (t <= b || i === KEYS.length - 2) return sa + (sb - sa) * (t - a) / (b - a); } return 0; }
export function rate(t) { for (let i = 0; i < KEYS.length - 1; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (t < b || i === KEYS.length - 2) return (sb - sa) / (b - a); } return 1; }
export function invSim(s) { for (let i = 0; i < KEYS.length - 1; i++) { const [a, sa] = KEYS[i], [b, sb] = KEYS[i + 1]; if (s <= sb) return a + (b - a) * (s - sa) / (sb - sa); } return DUR; }
export const SIM = simulate({ locks: LOCKS_DEFAULT, tRoll: T_ROLL, tEnd: 160 });
export const remaining = t => Math.max(0, T_ROLL - sim(t));
export const lockOf = id => SIM.locks.find(K => K.J === id && K.done) ;
// when each junction got its lights back (its last lock released)
export const FIXED = {};
for (const K of SIM.locks) FIXED[K.J] = Math.max(FIXED[K.J] || 0, K.t1);
export const FLIP0 = .3;   // sim time the lights flip to all-green (a wave across the grid)
export const flipAt = J => FLIP0 + Math.hypot(J.x - 120, J.z - 260) * .004;
export const TOW = { t0: 60, at: 66, hook: 68, go: 70 };

export const VO = [
  { id: 'v1', t: 0.05, text: 'Every light turned green. Engine 9 is trapped.' },
  { id: 'v2', t: 3.3, text: 'It has to roll in two minutes.' },
  { id: 'v3', t: 4.9, text: 'The queue fills the next junction. Then the next.' },
  { id: 'v4', t: 8.2, text: 'Now Engine 9 is boxed in.' },
  { id: 'v5', t: 11.0, text: "You're the tow truck. Take the pavement." },
  { id: 'v6', t: 14.1, text: 'Hook the crash. Pull it clear.' },
  { id: 'v7', t: 16.6, text: 'Now watch it untangle backwards.' },
  { id: 'v8', t: 19.2, text: 'The lights come back, one by one.' },
  { id: 'v9', t: 22.0, text: 'Last car out of the box…' },
  { id: 'v10', t: 25.3, text: 'Go, Engine 9!' },
  { id: 'v11', t: 26.9, text: 'Gridlock starts with one car stuck in a junction.' },
  { id: 'v12', t: 29.95, text: 'Which junction would you have fixed first?' },
];
export const SHOTS = [
  { id: 'open', t0: 0, t1: 2.5 }, { id: 'crash', t0: 2.5, t1: 5.5 }, { id: 'spread', t0: 5.5, t1: 9 }, { id: 'engine', t0: 9, t1: 11.5 },
  { id: 'tow', t0: 11.5, t1: 16.5 }, { id: 'release', t0: 16.5, t1: 21.5 }, { id: 'real', t0: 21.5, t1: 26 }, { id: 'roll', t0: 26, t1: 29 }, { id: 'rise', t0: 29, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg, lerp, eio };
