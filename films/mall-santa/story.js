// You Are a Mall Santa (Job #6): the timeline is the single source of truth for picture, sound, subtitles and checks.
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s. Every big hit lands on a beat.
export const B = .5;
export const DUR = 41.7;

export const T = {
  yank: 0, snap: .5, wide: 1.3, quest: 2.5, hop: 3.5, sit: 4.0, cheese: 4.7, c3: 5.0, c2: 5.5, c1: 6.0, flash: 6.5, polaroid: 7.0, off: 8.3,
  chain: 9.0, sack: 12.5, gifts: 13.5, joyMax: 15.5, custIn: 16.4, custTalk: 17.1, custSit: 18.5, plug: 20.0, eyes: 21.5, rear: 22.0, bolt: 22.5,
  balloons: 25.5, crash: 28.5, boss: 29.0, fired: 33.0, hired: 36.1, loopKid: 40.3, k2: 41.0,
};
export const SHOTS = [
  { id: 'close', a: 0, b: T.wide },          // opening type (c): the hero's face in panic, close; the beard mid-yank on frame 0
  { id: 'wide', a: T.wide, b: T.hop },
  { id: 'lap', a: T.hop, b: T.chain },
  { id: 'chain', a: T.chain, b: 12.4 },
  { id: 'sack', a: 12.4, b: T.custIn },
  { id: 'cust', a: T.custIn, b: T.plug },
  { id: 'plug', a: T.plug, b: 21.2 },
  { id: 'deer', a: 21.2, b: T.bolt },
  { id: 'chase', a: T.bolt, b: T.crash },
  { id: 'crash', a: T.crash, b: 29.4 },
  { id: 'boss', a: 29.4, b: T.hired },
  { id: 'hired', a: T.hired, b: T.k2 },
  { id: 'closeEnd', a: T.k2, b: DUR },       // the loop seam: the same close as frame 0
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'k1', t: 0.05, dlg: true, who: 'THE KID', sub: 'Is your beard real?', box: [0.0, 2.85] },
  { id: 'n1', t: 1.6, sub: 'You are a mall Santa.' },
  { id: 'y1', t: 4.7, dlg: true, who: 'YOU', sub: 'Say cheese!', box: [4.6, 6.9] },
  { id: 'y2', t: 12.5, dlg: true, who: 'YOU', sub: 'Who wants a present?', box: [12.4, 15.3] },
  { id: 'c1', t: 17.1, dlg: true, who: 'THE CUSTOMER', sub: 'One photo. For my followers.', box: [17.0, 20.4] },
  { id: 'y3', t: 23.7, dlg: true, who: 'YOU', sub: 'Whoa! Stop!', box: [23.6, 25.9] },
  { id: 'm1', t: 29.5, dlg: true, who: 'THE MANAGER', sub: 'Who plugged in the reindeer?', box: [29.4, 33.0] },
  { id: 'm2', t: 36.2, dlg: true, who: 'THE MANAGER', sub: 'Fifty five-star reviews. You’re on coffee tomorrow.', box: [36.1, 41.0] },
  { id: 'k2', t: 41.05, dlg: true, who: 'THE KID', sub: 'Santa!', box: [41.0, DUR], loop: true },
];
export const BANNERS = [
  { id: 'quest', kicker: 'JOB #6  ·  QUEST', text: '50 HAPPY PHOTOS', a: T.quest, b: 6.0 },
  { id: 'alert', kicker: '!  ALERT  !', text: 'REINDEER: ONLINE', a: T.eyes, b: 24.7 },
];
export const CAPTION = { text: 'BEARD CHECK', a: 0, b: 2.3 };
export const QUESTION = 'Mall Santas: wildest thing a kid asked for?';   // pinned comment, not on screen
export const COUNT = [[T.c3, '3'], [T.c2, '2'], [T.c1, '1']];

// —— game feel ——
export const FREEZES = [[T.snap, .08], [T.flash, .1], [T.plug, .1], [T.crash, .16]];
export const SHAKES = [[0, .5], [T.snap, .6], [T.flash, .3], [T.custSit, .4], [T.plug, .4], [T.rear, .5], [T.bolt, .6], [T.balloons, .3], [T.crash, 1.0], [28.75, .5], [T.fired, .5]];
export const FLASHES = [T.crash];
export const sceneT = t => { for (const [a, d] of FREEZES) if (t >= a && t < a + d) return a; return t; };
export const shakeAt = t => { let k = 0; for (const [a, s] of SHAKES) if (t >= a) k = Math.max(k, s * Math.exp(-(t - a) * 7)); if (t >= T.bolt && t < T.crash) k = Math.max(k, .12); return k; };

export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const walkStep = (t, fast) => Math.floor(t * (fast ? 10 : 7)) % 4;
// blocking: the grotto platform y .3, x[-3.5,3.5] z[-3.2,.2]; the sleigh faces −x (left) with the reindeer in front
export const P = { sleigh: [.7, -1.2], seat: [.85, -1.2], lap: [1.12, -1.0], deer: [-1.15, -1.2], cat: [2.45, -.35], kid0: [1.62, .02], plat: .3, tree: [-14, -3.2], socket: [.98, -.66] };
// the sleigh's x during the chase (accelerating, then the crash into the tree)
export const sleighX = t => t < T.bolt || t >= T.k2 ? P.sleigh[0] : P.sleigh[0] - 13.2 * Math.pow(seg(t, T.bolt, T.crash), 1.6);
export const sleighOn = t => t >= T.bolt && t < T.hired;
// the queue: kids in front, parents behind, from the grotto steps to the right
export const KIDS = [...Array(12)].map((_, i) => ({ i, v: (i * 5 + 1) % 6, x: 2.3 + i * .72, z: .85 + (i % 2) * .22, cry: T.chain + i * .22, gift: T.gifts + i * .17 }));
export const PARENTS = [...Array(10)].map((_, i) => ({ i, v: (i * 3 + 2) % 8, x: 2.6 + i * .8 + .25, z: 1.65 + (i % 3) * .12 }));
export const photos = t => t < T.polaroid ? 0 : t < T.bolt + .5 ? 1 : t < T.crash ? Math.min(50, 1 + Math.round(49 * ss(seg(t, T.bolt + .5, T.crash - .3)))) : 50;
export const joy = t => t < T.chain ? .7 : t < T.sack ? .7 - .65 * ss(seg(t, T.chain, T.chain + 2.6)) : t < T.joyMax ? .05 + .95 * ss(seg(t, T.gifts, T.joyMax)) : 1;
export const combo = t => t < T.chain ? 0 : Math.min(12, 1 + Math.floor((t - T.chain) / .22));

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, box: v.box || null });
  push(0, 'boing'); push(T.snap, 'thwack'); push(T.wide, 'whoosh'); push(T.hop, 'hop');
  for (const [t] of COUNT) push(t, 'count'); push(T.flash, 'shutter'); push(T.flash + .1, 'wail', { k: 0 }); push(T.polaroid, 'print');
  for (const k of KIDS) push(k.cry, 'wail', { k: k.i + 1 });
  push(T.sack, 'sack'); for (const k of KIDS) push(k.gift, 'gift', { k: k.i }); push(T.joyMax, 'cheer');
  push(T.custIn, 'heels'); push(T.custSit, 'creak'); push(T.plug, 'zap'); push(T.eyes, 'servo'); push(T.rear, 'neigh'); push(T.bolt, 'bells');
  for (let t = T.bolt; t < T.crash; t += .25) push(t, 'gallop');
  for (let k = 0; k < 6; k++) push(T.bolt + .8 + k * .9, 'flash');
  push(T.balloons, 'pop'); push(T.crash, 'crash'); push(T.crash + .6, 'baubles'); push(T.boss, 'steps');
  push(T.fired, 'gameover'); push(T.fired + .6, 'xpdown'); push(T.hired, 'cheer'); push(T.loopKid, 'hop');
  push(DUR, 'cut');
  return ev.sort((a, b) => a.t - b.t);
}
