// Not In Our Town — one timeline for picture, score, foley and subtitles (120 BPM, 1 beat = 0.5 s, 1 bar = 2 s)
import { clamp, seg } from '/core/lib.js';

export const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const DUR = 40.0;
export const X_TL = 12;

// Speed sections: x = label, k = sim seconds (time-lapse units) per film second. Smooth motion everywhere.
export const SPEED = [
  { t0: 0.0, t1: 2.5, x: 'tl', k: 1 },
  { t0: 2.5, t1: 8.0, x: 'real', k: 1 / X_TL },
  { t0: 8.0, t1: 28.5, x: 'tl', k: 1 },
  { t0: 28.5, t1: 30.0, x: 'slow', k: 1 / (X_TL * 4) },
  { t0: 30.0, t1: 35.0, x: 'real', k: 1 / X_TL },
  { t0: 35.0, t1: 999, x: 'tl', k: 1 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
export function S(t) { let acc = 0; for (const s of SPEED) { if (t <= s.t0) break; acc += (Math.min(t, s.t1) - s.t0) * s.k; } return acc; }
export const Sq = t => S(t);

// Key story times
export const T = {
  real: 2.5, reveal: 4.0, hum: 2.5,
  cut3: 8.0, beam1: 8.4, lift1: 8.7, gone1: 10.5, beam2: 10.8, lift2: 11.1, gone2: 12.8, beam3: 13.0, lift3: 13.2, gone3: 14.9, beamOff: 15.0,
  cut4: 15.0, alarm: 14.7, door0: 15.5, door1: 16.3, out: 16.6,
  cut5: 19.0, boats0: 19.0,
  cut6: 25.0, arrive: 25.0, outrig: 25.3, ladder0: 25.5, ladder1: 26.3, water: 26.4, arcs: 27.0, slow0: 28.5, hit: 28.9, slow1: 30.0,
  cut7: 31.0, fizzle: 31.0, drop1: 31.2, land1: 31.6, drop2: 31.7, land2: 32.1, drop3: 32.3, land3: 32.7, wobble: 33.0, flee: 33.8,
  cut8: 35.0, waterOff: 31.0,
};

// Voice lines (text = subtitles; say = what the TTS speaks; asr = what the speech check expects)
export const VO = [
  { id: 'v1', t: 0.4, text: "That's not a cloud.", say: "That's not a cloud." },
  { id: 'v2', t: 5.0, text: 'Pocket City has a visitor.', say: 'Pocket City has a visitor.' },
  { id: 'v3', t: 9.0, text: "It's taking the cars.", say: "It's taking the cars." },
  { id: 'v4', t: 13.3, text: 'And the boats!', say: 'And the boats!' },
  { id: 'v5', t: 15.6, text: 'Engine 9. Roll out!', say: 'Engine Nine. Roll out!', asr: 'Engine Nine. Roll out!' },
  { id: 'v6', t: 23.0, text: 'Here come the fireboats!', say: 'Here come the fire boats!' },
  { id: 'v7', t: 25.6, text: 'Aim for the lights!', say: 'Aim for the lights!' },
  { id: 'v8', t: 31.0, text: 'Put it all back.', say: 'Put it all back.' },
  { id: 'v9', t: 35.6, text: 'Not in our town.', say: 'Not in our town.' },
];

export const SHOTS = [
  { id: 'shadow', t0: 0, t1: 4 },
  { id: 'reveal', t0: 4, t1: 8 },
  { id: 'beam', t0: 8, t1: 15 },
  { id: 'station', t0: 15, t1: 19 },
  { id: 'top', t0: 19, t1: 25 },
  { id: 'attack', t0: 25, t1: 31 },
  { id: 'payoff', t0: 31, t1: 35 },
  { id: 'rise', t0: 35, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg };
