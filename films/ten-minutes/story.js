// Ten Minutes — one timeline for picture, score, foley, subtitles and the countdown (120 BPM, 1 beat = 0.5 s, 1 bar = 2 s)
import { clamp, seg } from '/core/lib.js';

export const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const DUR = 45.0;
export const X_TL = 18;   // displayed time-lapse rate

// Speed sections: displayed label, k = sim seconds (in time-lapse units) per film second. Smooth motion everywhere (hz 0).
export const SPEED = [
  { t0: 0.0, t1: 19.5, x: 'tl', k: 1, hz: 0 },
  { t0: 19.5, t1: 23.5, x: 'real', k: 1 / X_TL, hz: 0 },
  { t0: 23.5, t1: 31.6, x: 'tl', k: 1, hz: 0 },
  { t0: 31.6, t1: 33.0, x: 'slow', k: 1 / (X_TL * 4), hz: 0 },
  { t0: 33.0, t1: 41.0, x: 'tl', k: 1, hz: 0 },
  { t0: 41.0, t1: 999, x: 'real', k: 1 / X_TL, hz: 0 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
export const q = t => t;   // smooth: the world sees film time as it is
export function S(t) { let acc = 0; for (const s of SPEED) { if (t <= s.t0) break; acc += (Math.min(t, s.t1) - s.t0) * s.k; } return acc; }
export const Sq = t => S(t);
export function invS(s) { let acc = 0; for (const p of SPEED) { const len = (p.t1 - p.t0) * p.k; if (s <= acc + len) return p.t0 + (s - acc) / p.k; acc += len; } return 999; }

// Key story times
export const T = {
  bell: 0.0, out: 0.9, mount: 1.5, go: 2.2,
  cut2: 3.0, crate: 6.5, cut3: 9.0, dog0: 9.4, dogStop: 12.6,
  cut4: 14.0, brake: 15.0, uturn0: 15.5, uturn1: 16.5, alley: 17.6,
  cut5: 19.0, real: 19.5, resume: 23.5, gap: 24.25, go2: 24.45,
  cut6: 25.0, cut7: 30.0, bells: 30.1, leaf0: 30.6, takeoff: 31.6, land: 33.0,
  cut8: 34.0, rain0: 34.3, rain1: 39.8, cut9: 39.0, stop: 41.0, hand: 41.5, rainbow: 41.9,
};

// The countdown: starts at "Go", reaches 00:01 at the hand-over, then stops
export const CLOCK_START = T.go;
const SCALE = 599 / (X_TL * (S(T.hand) - S(CLOCK_START)));
export function remaining(t) {
  if (t < CLOCK_START) return 600;
  if (t >= T.hand) return 1;
  return Math.max(1, 600 - X_TL * (S(t) - S(CLOCK_START)) * SCALE);
}

export const rainAmt = t => Math.min(clamp((t - T.rain0) / .5), 1 - clamp((t - T.rain1) / .9));

// Voice lines (text = subtitles; say = what the TTS speaks; asr = what the speech check expects)
export const VO = [
  { id: 'v1', t: 0.2, text: "Ten minutes. Hot pizza. Let's go!", say: "Ten minutes. Hot pizza. Let's go!" },
  { id: 'v2', t: 4.4, text: 'Market day. Of course.', say: 'Market day. Of course.' },
  { id: 'v3', t: 9.7, text: 'Not now, buddy!', say: 'Not now, buddy!' },
  { id: 'v4', t: 15.1, text: 'Road closed. Shortcut.', say: 'Road closed. Shortcut.' },
  { id: 'v5', t: 19.7, text: 'A parade?', say: 'A parade?' },
  { id: 'v6', t: 21.9, text: 'Come on, come on…', say: 'Come on, come on.', asr: 'Come on, come on.' },
  { id: 'v7', t: 30.15, text: 'Bridge is going up. Hold on!', say: 'Bridge is going up. Hold on!' },
  { id: 'v8', t: 34.6, text: 'And now it rains.', say: 'And now it rains.' },
  { id: 'v9', t: 41.75, text: '9:59. Enjoy your pizza.', say: 'Nine fifty-nine. Enjoy your pizza.', asr: 'Nine fifty-nine. Enjoy your pizza.' },
];

export const SHOTS = [
  { id: 'pizzeria', t0: 0, t1: 3 },
  { id: 'market', t0: 3, t1: 9 },
  { id: 'dog', t0: 9, t1: 14 },
  { id: 'works', t0: 14, t1: 19 },
  { id: 'parade', t0: 19, t1: 25 },
  { id: 'top', t0: 25, t1: 30 },
  { id: 'bridge', t0: 30, t1: 34 },
  { id: 'rain', t0: 34, t1: 39 },
  { id: 'arrive', t0: 39, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { seg };
