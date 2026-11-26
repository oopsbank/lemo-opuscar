// The Phantom Jam — one timeline (120 BPM, bar = 2 s). The world runs on a ring-road traffic sim (jam.js) at ×8.
import { clamp, seg } from '/core/lib.js';
import { simulate, N, IDX } from './jam.js';

export const BPM = 120, DUR = 36.0, X_TL = 8;
export const SPEED = [
  { t0: 0.0, t1: 7.0, x: 'tl', k: 1 },
  { t0: 7.0, t1: 11.0, x: 'real', k: 1 / X_TL },
  { t0: 11.0, t1: 25.4, x: 'tl', k: 1 },
  { t0: 25.4, t1: 29.4, x: 'real', k: 1 / X_TL },
  { t0: 29.4, t1: 999, x: 'tl', k: 1 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
export function S(t) { let acc = 0; for (const s of SPEED) { if (t <= s.t0) break; acc += (Math.min(t, s.t1) - s.t0) * s.k; } return acc; }
export const Sq = t => S(t);
export const sim8 = t => S(t) * X_TL;          // simulation seconds
export function invSim(ss) { let acc = 0; for (const p of SPEED) { const len = (p.t1 - p.t0) * p.k * X_TL; if (ss <= acc + len) return p.t0 + (ss - acc) / (p.k * X_TL); acc += len; } return 999; }

// the simulation: the culprit brakes at 0; you (the yellow car) start leaving a gap at sim 58; at the end the car at the culprit's spot brakes (the loop)
const SAVE = 58, VSAVE = 2.8, ZPULL = 588, B2 = sim8(35.72);
const probe = simulate({ tEnd: 245, tSave: SAVE, vSave: VSAVE, tPull: SAVE, zPull: ZPULL });
const z0 = probe.pos(IDX.culprit, 0); let b2i = IDX.culprit, bd = 1e9;
for (let i = 0; i < N; i++) { if (i === IDX.ambulance) continue; const d = Math.abs(probe.pos(i, B2) - z0); if (d < bd) { bd = d; b2i = i; } }
export const SIM = simulate({ tEnd: 245, tSave: SAVE, vSave: VSAVE, tPull: SAVE, zPull: ZPULL, tBrake2: B2, brake2Idx: b2i });
export const BRAKE2_IDX = b2i;

export const T = {
  brake: 0, stuck1: invSim(25), save: invSim(SAVE), arrive: invSim(SIM.pullT()), brake2: invSim(B2),
};
// countdown to the hospital: 3:00 at the start, 0:03 when the ambulance turns in
export const remaining = t => t >= T.arrive ? 3 : 180 - 177 * (sim8(t) / sim8(T.arrive));

export const VO = [
  { id: 'v1', t: 0.0, text: 'One driver hit the brakes.', say: 'One driver hit the brakes.' },
  { id: 'v2', t: 3.4, text: 'Now the ambulance is stuck.', say: 'Now the ambulance is stuck.' },
  { id: 'v3', t: 7.3, text: "You're the yellow car.", say: "You're the yellow car." },
  { id: 'v4', t: 9.2, text: "Don't rush. Leave a gap.", say: "Don't rush. Leave a gap." },
  { id: 'v5', t: 12.6, text: 'Up ahead: stop and go.', say: 'Up ahead: stop and go.' },
  { id: 'v6', t: 17.0, text: "Nobody crashed. Nobody's in the way.", say: "Nobody crashed. Nobody's in the way." },
  { id: 'v7', t: 21.6, text: 'You just never stop.', say: 'You just never stop.' },
  { id: 'v8', t: 0, text: "It's through!", say: "It's through!" },
  { id: 'v9', t: 30.4, text: "That's a phantom jam.", say: "That's a phantom jam." },
  { id: 'v10', t: 33.4, text: 'Did you spot who started it?', say: 'Did you spot who started it?' },
];
VO.find(v => v.id === 'v8').t = +(T.arrive + .15).toFixed(2);

export const SHOTS = [
  { id: 'open', t0: 0, t1: 3 },
  { id: 'amb', t0: 3, t1: 7 },
  { id: 'hero', t0: 7, t1: 11 },
  { id: 'top', t0: 11, t1: 17 },
  { id: 'side', t0: 17, t1: 25.4 },
  { id: 'arrive', t0: 25.4, t1: 29.4 },
  { id: 'rise', t0: 29.4, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg, N, IDX };
