// You Are a Pizza Delivery Guy — timeline (single source of truth for picture, sound, subtitles and checks)
// Music grid: 6/8, dotted-quarter = 120 → beat B = 0.5 s, bar = 1 s.
export const B = .5;
export const DUR = 61.0;

export const T = {
  neon: .5,          // the PIZZA sign stutters on
  card: 3.0,         // ORDER card
  go: 6.5,           // the watch starts, the scooter pulls away
  dogOut: 8.0,       // the dog bursts from its kennel
  gust: 17.0,        // gust on the bridge
  splat: 18.5,       // pizza lands on your face
  rideOn: 22.5,
  stop13: 25.0, knock13: 26.0, flash: 27.5, open13: 28.0, flee: 32.5,
  stop31: 36.0, knock31: 37.0, porch: 38.0, open31: 38.5, late: 39.0, slam: 47.0,
  sit: 47.5, dogIn: 48.5, share: 50.0, dry: 51.0,
  title: 56.0,
};
export const SHOTS = [
  { id: 'shop', a: 0, b: 7.5 },
  { id: 'dog', a: 7.5, b: 15.0 },
  { id: 'bridge', a: 15.0, b: T.splat },
  { id: 'face', a: T.splat, b: 24.0 },
  { id: 'ghost', a: 24.0, b: 35.0 },
  { id: 'cabin', a: 35.0, b: T.slam },
  { id: 'porch', a: T.slam, b: DUR },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'n1', t: 1.0, sub: 'You are a pizza delivery guy.' },
  { id: 'n2', t: 3.5, sub: 'One pizza. Number thirty-one. Thirty minutes.', card: 1 },
  { id: 'y1', t: 10.1, dlg: true, who: 'YOU', sub: 'Not today, buddy!', box: [10.0, 13.0] },
  { id: 'n3', t: 13.5, sub: 'You have a fan.' },
  { id: 'n4', t: 19.5, sub: 'The pizza is fine. You are not.' },
  { id: 'h1', t: 28.6, dlg: true, who: 'No. 13', sub: 'We didn’t order... anything.', box: [28.5, 32.0] },
  { id: 'y2', t: 32.1, dlg: true, who: 'YOU', sub: 'Wrong house!', box: [32.0, 34.5] },
  { id: 'b1', t: 41.1, dlg: true, who: 'No. 31', sub: 'You’re one second late.', box: [41.0, 44.0] },
  { id: 'b2', t: 44.1, dlg: true, who: 'No. 31', sub: 'So it’s free. Keep it.', box: [44.0, 47.0] },
  { id: 'n5', t: 50.0, sub: 'One pizza. Thirty minutes.' },
  { id: 'n6', t: 53.0, sub: 'One very happy customer.' },
];
export const BARKS = [{ id: 'w1', t: 8.05, box: [8.0, 10.0] }];   // the dog's box: "WOOF!" (synth bark, no voice)
export const CARDS = [{ n: 1, label: 'ORDER  #1', line: 'One pizza. No. 31. Thirty minutes.', a: T.card, b: 8.0 }];
export const BANNERS = [
  { id: 'ban13', text: 'No. 13, Crooked Lane', a: 24.0, b: 27.5 },
  { id: 'ban31', text: 'No. 31, Crooked Lane', a: 35.0, b: 38.5 },
];
// the watch: visible 4.0 → 41.5; runs from T.go to T.late
export const WATCH = { a: 4.0, b: 41.5, run0: T.go, run1: T.late, late: [T.late, 41.5] };

// —— blocking ——
export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const X = { shop: 0, kennel: 5.5, bridge0: 19.5, bridge1: 25.5, h13: 34.0, h31: 46.0 };
export const ROAD_Z = .2;
// scooter x(t): leaves the shop, rides to the bridge, stops after the splat, rides to No. 13, flees to No. 31
const KEYS = [[0, 1.0], [6.5, 1.0], [8.0, 4.4], [15.0, 17.2], [17.0, 22.0], [18.5, 23.6], [22.5, 23.6], [24.0, 27.6], [25.0, 32.4], [32.8, 32.4], [33.4, 33.6], [35.4, 41.0], [36.0, 44.4], [DUR, 44.4]];
export function scooterX(t) {
  let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
  const [t0, x0] = KEYS[i], [t1, x1] = KEYS[i + 1], u = seg(t, t0, t1);
  const accel = i === 1 || i === 6 || i === 9, stop = i === 4 || i === 7 || i === 11;
  return x0 + (x1 - x0) * (accel ? u * u * .6 + u * .4 : stop ? 1 - (1 - u) * (1 - u) : u);
}
export const riding = t => (t > T.go && t < T.splat) || (t > T.rideOn && t < T.stop13) || (t > 32.8 && t < T.stop31);
// you on foot at No. 13 / No. 31
export function youFoot(t) {
  if (t >= T.stop13 && t < 32.8) { const x = t < T.knock13 ? 32.5 + seg(t, T.stop13 + .1, T.knock13 - .05) * .8 : t < T.flee ? 33.3 : 33.3 - seg(t, T.flee, 32.8) * .8; return { x, z: -1.75 + (t < T.knock13 ? -seg(t, T.stop13 + .1, T.knock13 - .05) * .1 : -.1), walk: (t > T.stop13 + .1 && t < T.knock13 - .05) || t > T.flee }; }
  if (t >= T.stop31) { const x = 44.4 + seg(t, T.stop31 + .05, T.knock31 - .05) * .5; return { x: t < T.sit ? x : 45.3, z: t < T.sit ? -1.9 : -2.2, walk: t > T.stop31 + .05 && t < T.knock31 - .05 }; }
  return null;
}
export const walkStep = t => Math.floor(t * 8) % 4;
// the dog
export function dogPos(t) {
  if (t < T.dogOut) return { x: X.kennel, z: -2.55, f: 'sleep' };
  if (t < 15.5) { const x = X.kennel + Math.max(0, (t - T.dogOut - .4)) * 2.05 + (t > T.dogOut + .4 ? 0 : 0); return { x: Math.min(x, scooterX(t) - 1.25), z: .9, run: t > T.dogOut + .4 }; }
  if (t < T.dogIn - 1.2) return null;
  const u = seg(t, T.dogIn - 1.2, T.dogIn + .3); return { x: 43.0 + u * 3.25, z: -1.9, run: u < 1 };
}

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  push(T.neon, 'neon');
  for (const c of CARDS) push(c.a, 'card', { n: c.n });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, card: v.card || 0, box: v.box || null });
  for (const w of BARKS) { push(w.box[0], 'dlg', { id: w.id }); push(w.t, 'bark'); push(w.t + .35, 'bark'); push(w.box[0], 'sq', { box: w.box, text: 'WOOF!' }); }
  push(5.8, 'start'); push(T.go, 'watch');
  for (const [a, b] of [[T.go, T.splat], [T.rideOn, T.stop13], [32.8, T.stop31]]) push(a, 'engine', { d: b - a });
  push(T.dogOut, 'kennel'); push(11.0, 'bark'); push(13.6, 'bark');
  for (let t = T.dogOut + .4; t < 15.5; t += 1 / 60) { const s0 = Math.floor((t - 1 / 60) * 12) % 4, s1 = Math.floor(t * 12) % 4; if (s0 !== s1 && s1 % 2 === 0) push(t, 'paw'); }
  push(T.gust, 'gust'); push(T.gust + .2, 'lid'); push(T.splat, 'splat'); push(T.splat - .25, 'brake');
  for (let t = 0; t < DUR; t += 1 / 60) { const f = youFoot(t), f0 = youFoot(t - 1 / 60); if (f && f.walk && f0 && f0.walk && walkStep(t) !== walkStep(t - 1 / 60) && walkStep(t) % 2 === 0) push(t, 'step'); }
  for (const k of [0, .5, 1.0]) push(T.knock13 + k, 'knock');
  push(T.flash, 'flash'); push(T.flash + .35, 'thunder'); push(T.open13, 'creak'); push(T.open13 + .3, 'ghost');
  for (const k of [0, .5]) push(T.knock31 + k, 'knock');
  push(T.porch, 'lamp'); push(T.open31, 'creak'); push(T.late, 'late'); push(T.slam, 'slam');
  push(T.sit + .3, 'box'); for (let t = T.dogIn - 1.2; t < T.dogIn + .3; t += .25) push(t, 'paw');
  push(T.share, 'chew'); push(T.share + .6, 'whine'); push(52.0, 'thump'); push(52.4, 'thump'); push(T.title, 'title');
  return ev.sort((a, b) => a.t - b.t);
}
