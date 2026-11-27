// You Are a Night Museum Guard — timeline (single source of truth for picture, sound, subtitles and checks)
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s (the party waltz: 3/4, same beat).
export const B = .5;
export const DUR = 61.0;

export const T = {
  card: 3.5,
  hallBan: 8.0,
  look: 9.0,          // behind you, the skull turns to watch
  turn1: 10.0,        // you turn round: it snaps back
  walk2: 11.0, lift: 11.5,
  turn2: 12.5,        // you turn: frozen mid-step, leaning over you
  run: 15.5,
  gal: 16.5, galBan: 16.5, duchess: 18.0,
  egypt: 28.0, egBan: 28.0, lid: 29.0, sitUp: 29.5, lieBack: 36.5, lidShut: 37.0,
  back: 37.5, flick1: 38.0, flick2: 38.5, dark: 39.0,
  spot1: 42.0, spot2: 42.5, spot3: 43.0, surprise: 43.5,
  close: 45.0, blow: 50.5, dawn: 51.5,
  descend: 53.0, wink: 57.0, title: 56.0,
};
export const SHOTS = [
  { id: 'plan', a: 0, b: 7.5 },
  { id: 'hall', a: 7.5, b: T.gal },
  { id: 'gallery', a: T.gal, b: T.egypt },
  { id: 'egypt', a: T.egypt, b: T.back },
  { id: 'dark', a: T.back, b: T.close },
  { id: 'close', a: T.close, b: T.dawn },
  { id: 'dawn', a: T.dawn, b: DUR },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'n1', t: 1.0, sub: 'You are a night museum guard.' },
  { id: 'n2', t: 4.0, sub: 'Nothing ever happens here.', card: 1 },
  { id: 'n3', t: 13.0, sub: 'Sixty-six million years dead. Mostly.' },
  { id: 'd1', t: 18.1, dlg: true, who: 'THE DUCHESS', sub: 'Lower that light, dear.', box: [18.0, 21.0] },
  { id: 'y1', t: 21.1, dlg: true, who: 'YOU', sub: 'Paintings don’t talk!', box: [21.0, 24.0] },
  { id: 'd2', t: 24.1, dlg: true, who: 'THE DUCHESS', sub: 'And guards don’t nap. Yet here we are.', box: [24.0, 28.0] },
  { id: 'm1', t: 30.1, dlg: true, who: 'THE MUMMY', sub: 'Is it morning?', box: [30.0, 32.5] },
  { id: 'y2', t: 32.6, dlg: true, who: 'YOU', sub: 'No...?', box: [32.5, 34.5] },
  { id: 'm2', t: 34.6, dlg: true, who: 'THE MUMMY', sub: 'Five more centuries.', box: [34.5, 37.5] },
  { id: 'y3', t: 40.1, dlg: true, who: 'YOU', sub: 'H-hello?', box: [40.0, 42.1] },
  { id: 's1', t: 43.55, dlg: true, who: 'EVERYONE', sub: 'SURPRISE!', box: [43.5, 45.7] },
  { id: 'n4', t: 46.0, sub: 'Nobody remembered your birthday.' },
  { id: 'n5', t: 49.0, sub: 'Except the museum.' },
  { id: 'n6', t: 53.0, sub: 'Nothing ever happens here.' },
];
export const CARDS = [{ n: 1, label: 'NIGHT SHIFT', line: 'Nothing ever happens here.', a: T.card, b: 7.5 }];
export const BANNERS = [
  { id: 'banHall', text: 'HALL OF GIANTS', a: T.hallBan, b: 11.0 },
  { id: 'banGal', text: 'PORTRAIT GALLERY', a: T.galBan, b: 19.5 },
  { id: 'banEg', text: 'THE EGYPT ROOM', a: T.egBan, b: 31.0 },
];

// —— blocking: the floor plan (x east, z south; ceiling off). Four rooms in a 2×2 grid ——
// Lobby x[-12,0] z[-10,0] · Hall of Giants x[-12,0] z[-18,-10] · Portrait Gallery x[0,12] z[-18,-10] · Egypt Room x[0,12] z[-10,0]
export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const P = {
  desk: [-6.5, -4.2], dino: [-6.2, -15.2], walkZ: -12.3, galZ: -12.6, egZ: -3.6,
  portraits: [3.0, 6.0, 9.0], wallZ: -17.9, sarc: [7.2, -6.6], bench: [-8.3, -13.75],
};
// the guard's path: [t, x, z]; between keys you walk (or run) in a straight line
const PATH = [
  [0, -7.4, -3.0], [2.6, -9.2, -6.0], [5.2, -10.6, -10.2], [7.5, -10.4, P.walkZ],
  [10.0, -7.4, P.walkZ], [11.0, -7.4, P.walkZ], [12.5, -5.6, P.walkZ], [15.5, -5.6, P.walkZ], [16.5, -0.6, P.walkZ],
  // gallery (cut)
  [16.501, 1.6, P.galZ], [18.5, 4.6, P.galZ], [28.0, 5.2, P.galZ],
  // egypt (cut)
  [28.001, 1.8, P.egZ], [29.5, 4.4, P.egZ], [37.5, 4.4, P.egZ],
  // back in the hall (cut), walking west
  [37.501, -2.6, P.walkZ], [39.0, -4.6, P.walkZ], [51.5, -4.6, P.walkZ],
  // dawn: asleep on the bench
  [51.501, P.bench[0], P.bench[1]], [DUR, P.bench[0], P.bench[1]],
];
export function guard(t) {
  let i = 0; while (i < PATH.length - 2 && t >= PATH[i + 1][0]) i++;
  const [t0, x0, z0] = PATH[i], [t1, x1, z1] = PATH[i + 1], u = seg(t, t0, t1);
  const moving = (x1 !== x0 || z1 !== z0) && t1 - t0 > .01 && t < t1;
  const sp = moving ? Math.hypot(x1 - x0, z1 - z0) / (t1 - t0) : 0;
  return { x: x0 + (x1 - x0) * u, z: z0 + (z1 - z0) * u, moving, run: sp > 2.4, dx: x1 - x0, dz: z1 - z0 };
}
export const walkStep = (t, run) => Math.floor(t * (run ? 12 : 7)) % 4;
// which way you face: +1 east (right), −1 west
export function facing(t) {
  if (t >= T.turn1 && t < T.walk2) return -1;
  if (t >= T.turn2 && t < T.run) return -1;
  if (t >= T.back && t < T.spot2) return -1;
  if (t < 7.5) return -1;   // walking north-west out of the lobby
  return 1;
}
// the torch: 1 = on; flickers late in the night; dies at T.dark
export function torch(t) {
  if (t >= T.dark) return 0;
  if (t >= T.flick1) { const u = t - T.flick1; return (u % .5) < .07 ? .1 : (u % .5) < .12 ? .8 : (u % .5) < .16 ? .15 : 1; }
  if (t > 26.6 && t < 26.8) return .35;   // a first hint, in the gallery
  return 1;
}

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const c of CARDS) push(c.a, 'card', { n: c.n });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, card: v.card || 0, box: v.box || null });
  // footsteps: on every other walk frame; the floor changes by room
  const floor = (x, z) => z > -10 ? (x < 0 ? 'carpet' : 'stone') : (x < 0 ? 'marble' : 'wood');
  for (let t = 1 / 60; t < DUR; t += 1 / 60) {
    const g = guard(t), g0 = guard(t - 1 / 60);
    if (g.moving && g0.moving && walkStep(t, g.run) !== walkStep(t - 1 / 60, g0.run) && walkStep(t, g.run) % 2 === 0) push(t, 'step', { f: floor(g.x, g.z), run: g.run });
  }
  for (let t = 0; t < 7.5; t += 1) push(t + .5, 'tick');
  push(T.look, 'look'); push(T.turn1, 'turn'); push(T.turn1, 'snap'); push(T.lift, 'lift'); push(T.turn2, 'turn'); push(T.turn2, 'freeze');
  push(T.run, 'scurry');
  push(24.6, 'purr'); push(26.0, 'giggle');
  push(T.lid, 'grind'); push(T.sitUp, 'rustle'); push(31.2, 'yawn'); push(T.lieBack, 'rustle'); push(T.lidShut, 'thud');
  push(T.flick1, 'buzz'); push(T.flick2, 'buzz'); push(T.dark, 'click');
  for (let t = T.dark + .5; t < T.spot1; t += .75) push(t, 'heart');
  push(T.spot1, 'spot', { n: 1 }); push(T.spot2, 'spot', { n: 2 }); push(T.spot3, 'spot', { n: 3 }); push(T.spot3, 'candle');
  push(T.surprise, 'cheer'); push(T.surprise + .1, 'roar');
  push(T.blow, 'puff'); push(T.blow + .4, 'cheer2');
  push(T.dawn, 'dawn'); push(54.5, 'snore'); push(56.0, 'snore'); push(T.wink, 'wink'); push(T.title, 'title');
  return ev.sort((a, b) => a.t - b.t);
}
