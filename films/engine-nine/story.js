// Engine Nine — one timeline for picture, score, foley and subtitles (120 BPM, 1 beat = 0.5 s, 1 bar = 2 s)
import { clamp, seg } from '/core/lib.js';

export const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const DUR = 37.0;

// Time-lapse sections: displayed rate, stepping (Hz, 0 = smooth), sim speed k (sim seconds per film second)
// Boundaries sit on half-seconds so stepped clocks never run backwards across a change.
export const SPEED = [
  { t0: 0.0, t1: 12.0, x: 12, hz: 0, k: 1 },
  { t0: 12.0, t1: 17.0, x: 3, hz: 0, k: .25 },
  { t0: 17.0, t1: 22.0, x: 12, hz: 0, k: 1 },
  { t0: 22.0, t1: 28.0, x: 1, hz: 0, k: 1 / 12 },
  { t0: 28.0, t1: 34.0, x: 12, hz: 0, k: 1 },
  { t0: 34.0, t1: 99, x: 1, hz: 0, k: 1 / 12 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
// Film time as the world sees it: held for 1/hz in time-lapse, smooth in real time
export function q(t) { const s = speedAt(t); return s.hz ? Math.max(s.t0, Math.floor(t * s.hz + 1e-6) / s.hz) : t; }
// Sim clock: integral of k (ambient traffic, smoke, people all run on this)
export function S(t) {
  let acc = 0;
  for (const s of SPEED) { if (t <= s.t0) break; acc += (Math.min(t, s.t1) - s.t0) * s.k; }
  return acc;
}
export const Sq = t => S(q(t));

// Key story times
export const T = {
  alarm: 0.0, door0: 1.0, door1: 2.0, out: 2.5,
  cut2: 4.0, cut3: 8.0, cut4: 12.0, part1: 14.0, part2: 15.0, part3: 16.0, surge: 17.0,
  cut5: 18.0, cut6: 22.0, boatHorn: 23.8, boatClear: 24.5, bridge0: 25.0, clunk: 27.5,
  cut7: 28.0, arrive: 29.0, outrig: 29.5, ladder0: 29.5, ladder1: 30.5, water: 30.5,
  cut8: 31.5, out1: 34.0,
};

// Fire level: full until the water hits, then one step down per beat until the last flame dies at 34.0
export function fireLevel(t) {
  if (t < T.water) return 1;
  if (t >= T.out1) return 0;
  const k = Math.floor((t - T.water) / BEAT) + 1, n = Math.round((T.out1 - T.water) / BEAT);
  return clamp(1 - k / (n + 1));
}

// Voice lines (text = subtitles; say = what the TTS speaks; asr = what the speech check expects)
export const VO = [
  { id: 'v1', t: 0.15, text: 'You drive Engine 9.', say: 'You drive Engine Nine.', asr: 'You drive Engine Nine.' },
  { id: 'v2', t: 2.4, text: 'Smoke down by the harbor. Go.', say: 'Smoke, down by the harbor. Go.' },
  { id: 'v3', t: 12.35, text: 'Gridlock.', say: 'Gridlock.' },
  { id: 'v4', t: 16.0, text: 'Move, move!', say: 'Move, move!' },
  { id: 'v5', t: 22.9, text: 'Bridge is up.', say: 'Bridge is up.' },
  { id: 'v6', t: 25.4, text: 'Come on…', say: 'Come on.', asr: 'Come on.' },
  { id: 'v7', t: 34.3, text: "Fire's out. Nobody's hurt.", say: "Fire's out. Nobody's hurt." },
];

// Shots: id, start, end
export const SHOTS = [
  { id: 'station', t0: 0, t1: 4 },
  { id: 'hill', t0: 4, t1: 8 },
  { id: 'boulevard', t0: 8, t1: 12 },
  { id: 'jam', t0: 12, t1: 18 },
  { id: 'top', t0: 18, t1: 22 },
  { id: 'bridge', t0: 22, t1: 28 },
  { id: 'fire', t0: 28, t1: 31.5 },
  { id: 'roof', t0: 31.5, t1: 99 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { seg };
