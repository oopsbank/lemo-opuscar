// Snow Day — one timeline for picture, score, foley and subtitles (120 BPM, 1 beat = 0.5 s, 1 bar = 2 s)
import { clamp, seg } from '/core/lib.js';

export const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const DUR = 36.0;
export const X_TL = 300;

export const SPEED = [
  { t0: 0.0, t1: 14.5, x: 'tl', k: 1 },
  { t0: 14.5, t1: 18.5, x: 'real', k: 1 / X_TL },
  { t0: 18.5, t1: 27.5, x: 'tl', k: 1 },
  { t0: 27.5, t1: 30.5, x: 'real', k: 1 / X_TL },
  { t0: 30.5, t1: 999, x: 'tl', k: 1 },
];
export const speedAt = t => SPEED.find(s => t >= s.t0 && t < s.t1) || SPEED[SPEED.length - 1];
export function S(t) { let acc = 0; for (const s of SPEED) { if (t <= s.t0) break; acc += (Math.min(t, s.t1) - s.t0) * s.k; } return acc; }
export const Sq = t => S(t);

export const T = {
  go: 0.0, cut2: 4.0, cut3: 10.0,
  stuck0: 14.5, spin: 14.7, back0: 16.3, back1: 17.1, ram: 17.35, burst: 17.75, free: 18.5,
  cut5: 18.5, cut6: 26.0, real2: 27.5, drift: 27.6, gate: 29.4, bell: 29.5, resume: 30.5, cut7: 31.0,
  snow0: 33.0, resnow0: 33.8, resnow1: 35.9,
};

// The clock: 6:00 at t = 0, exactly 8:00:00 when the bell rings
const C0 = 6 * 3600, SCALE = 7200 / (X_TL * S(T.bell));
export const clockSec = t => C0 + X_TL * S(t) * SCALE;
export const fmtClock = (t, secs = false) => { const c = Math.floor(clockSec(t) + 1e-6), h = Math.floor(c / 3600), m = Math.floor(c / 60) % 60, s = c % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` + (secs ? `:${String(s).padStart(2, '0')}` : ''); };

// Voice lines (text = subtitles; say = what the TTS speaks; asr = what the speech check expects)
export const VO = [
  { id: 'v1', t: 0.0, text: 'Two hours. Three ploughs.', say: 'Two hours. Three ploughs.', asr: 'Two hours. Three plows.' },
  { id: 'v2', t: 4.5, text: 'You take the boulevard.', say: 'You take the boulevard.' },
  { id: 'v3', t: 10.3, text: 'Every street. Every lane.', say: 'Every street. Every lane.' },
  { id: 'v4', t: 14.8, text: "You're stuck.", say: "You're stuck." },
  { id: 'v5', t: 16.2, text: 'Back up… and ram it!', say: 'Back up, and ram it!', asr: 'Back up, and ram it!' },
  { id: 'v6', t: 21.0, text: '7:50. One road left.', say: 'Seven fifty. One road left.', asr: '750. One road left.' },
  { id: 'v7', t: 27.6, text: 'Come on, come on…', say: 'Come on, come on.', asr: 'Come on, come on.' },
  { id: 'v8', t: 29.8, text: "8:00. School's open!", say: "Eight o'clock. School's open!", asr: "Eight o'clock. School's open!" },
  { id: 'v9', t: 33.3, text: 'Hold on. Is that snow?', say: 'Hold on. Is that snow?' },
];

export const SHOTS = [
  { id: 'open', t0: 0, t1: 4 },
  { id: 'boulevard', t0: 4, t1: 10 },
  { id: 'top', t0: 10, t1: 14.5 },
  { id: 'stuck', t0: 14.5, t1: 18.5 },
  { id: 'wide', t0: 18.5, t1: 26 },
  { id: 'school', t0: 26, t1: 31 },
  { id: 'close', t0: 31, t1: 999 },
];
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export { clamp, seg };
