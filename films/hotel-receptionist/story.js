// You Are a Hotel Receptionist (Job #4): the timeline is the single source of truth for picture, sound, subtitles and checks.
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s.
export const B = .5;
export const DUR = 42.5;

export const T = {
  quest: 4.0, cord: 5.5, wall: 6.0, drain: 6.5, walkP: 7.0, grab: 7.5, hang: 8.5, okay: 10.5, xp: 11.5,
  ring: 12.0, pull: 13.0, up: 15.5, meh1: 17.0, meh2: 20.0, eatSign: 20.5,
  bus: 22.5, alert: 23.0, door: 23.5, crowd: 27.5, keyUp: 29.0, lift: 29.5, crunch: 30.5,
  boss: 31.5, fired: 34.0, ask: 34.0, hired: 38.5, back: 40.5, c3: 41.0,
};
export const SHOTS = [
  { id: 'desk', a: 0, b: T.pull },
  { id: 'pull', a: T.pull, b: T.up },
  { id: 'room7', a: T.up, b: T.bus },
  { id: 'tour', a: T.bus, b: 31.0 },
  { id: 'fired', a: 31.0, b: T.hired },
  { id: 'loop', a: T.hired, b: DUR },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'c1', t: 0.05, dlg: true, who: 'THE CUSTOMER', sub: 'I want a room with a sea view.', box: [0.0, 3.2] },
  { id: 'n1', t: 2.5, sub: 'You are a hotel receptionist.' },
  { id: 'y1', t: 8.6, dlg: true, who: 'YOU', sub: 'Sea view!', box: [8.5, 10.6] },
  { id: 'c2', t: 10.6, dlg: true, who: 'THE CUSTOMER', sub: 'Acceptable.', box: [10.5, 12.9] },
  { id: 'r1', t: 13.1, dlg: true, who: 'ROOM 7', sub: 'There’s a goat in our honeymoon suite.', box: [13.0, 16.9] },
  { id: 'y2', t: 17.6, dlg: true, who: 'YOU', sub: 'We don’t have a goat.', box: [17.5, 20.2] },
  { id: 'g1', t: 27.6, dlg: true, who: 'THE GUIDE', sub: 'Forty rooms, please!', box: [27.5, 30.2] },
  { id: 'm1', t: 31.6, dlg: true, who: 'THE MANAGER', sub: 'Who checked a goat in?', box: [31.5, 34.2] },
  { id: 'm2', t: 38.6, dlg: true, who: 'THE MANAGER', sub: 'You’re hired.', box: [38.5, 40.9] },
  { id: 'c3', t: 41.0, dlg: true, who: 'THE CUSTOMER', sub: 'Excuse me! I want a ro—', box: [41.0, DUR], loop: true },
];
export const BANNERS = [
  { id: 'quest', kicker: 'JOB #4  ·  QUEST', text: 'CHECK IN EVERY GUEST', a: T.quest, b: 7.6 },
  { id: 'alert', kicker: '!  ALERT  !', text: 'TOUR GROUP: 40 GUESTS', a: T.alert, b: 26.3 },
];
export const QUESTION = 'Receptionists: weirdest guest request?';

// —— blocking (x east, y up, z toward camera). The lobby x[-5,5] z[-4,0], floor 0; room 7 above it, floor y = 3.4 ——
export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const P = {
  you: [0.0, -2.85], cust: [1.7, -1.5], window: [0.9, -3.93], painting: [-2.5, -3.93], rack: [-1.05, -3.93],
  lift: [-3.9, -3.75], sideDoor: [-5.2, -2.3], door: [5.2, -1.15], desk: [0, -2.15], F1: 3.4,
};
// a path: [t, x, z] keys; between keys you walk in a straight line
function walker(PATH) {
  return t => {
    let i = 0; while (i < PATH.length - 2 && t >= PATH[i + 1][0]) i++;
    const [t0, x0, z0] = PATH[i], [t1, x1, z1] = PATH[i + 1], u = seg(t, t0, t1);
    const moving = (x1 !== x0 || z1 !== z0) && t1 - t0 > .01 && t >= t0 && t < t1;
    return { x: x0 + (x1 - x0) * u, z: z0 + (z1 - z0) * u, moving, dx: x1 - x0, dz: z1 - z0 };
  };
}
export const you = walker([
  [0, P.you[0], P.you[1]], [T.walkP, P.you[0], P.you[1]], [7.5, -2.3, -3.2], [7.9, -2.3, -3.2], [8.4, 0.75, -3.15], [8.9, 0.75, -3.15], [9.4, P.you[0], P.you[1]],
  [T.hired, P.you[0], P.you[1]], [39.0, 1.65, -2.85], [39.4, 2.25, -1.05], [40.2, 5.4, -1.05], [DUR, 5.4, -1.05],
]);
export const cust = walker([
  [0, P.cust[0], P.cust[1]], [12.2, P.cust[0], P.cust[1]], [13.4, 5.4, -1.1], [39.8, 5.4, -1.1], [40.4, P.cust[0], P.cust[1]], [DUR, P.cust[0], P.cust[1]],
]);
export const goat = walker([
  [T.lift, P.lift[0], -3.35], [T.lift + .3, P.lift[0], -3.35], [29.95, -1.7, -2.95], [30.3, -.72, -2.25], [DUR, -.72, -2.25],
]);
export const boss = walker([
  [30.6, P.sideDoor[0], P.sideDoor[1]], [31.4, -2.15, -2.55], [T.hired, -2.15, -2.55], [T.hired + .01, -1.35, -2.75], [DUR, -1.35, -2.75],
]);
// the tour group: 14 visible tourists come in through the revolving door, one every quarter beat
export const TOURISTS = [...Array(14)].map((_, i) => {
  const col = i % 4, row = Math.floor(i / 4);
  return { i, a: T.door + .5 + i * .22, x: 2.35 + col * .62 + (row % 2) * .3, z: -1.95 + row * .5, v: (i * 7) % 4 };
});
export const GUIDE = { a: T.door, x: P.cust[0], z: P.cust[1] };
export const walkStep = (t, fast) => Math.floor(t * (fast ? 10 : 7)) % 4;
export const keysLeft = t => t < T.xp ? 2 : t < T.crunch ? 1 : t < T.hired ? 0 : 2;
export const xpAt = t => t < T.xp ? 0 : t < T.fired + .6 ? 10 : Math.round(10 - 1009 * ss(seg(t, T.fired + .6, T.fired + 1.8)));
export const patience = t => t < T.wall ? 1 : t < T.drain + .3 ? 1 - .7 * ss(seg(t, T.wall + .1, T.drain + .3)) : t < T.okay ? .3 : .3 + .45 * ss(seg(t, T.okay, T.okay + .6));
export const guestsIn = t => Math.round(40 * ss(seg(t, T.door, T.crowd)));
// camera flashes from the tour group, on the beat
export const FLASHES = [24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 28.0, 29.0].map((t, k) => ({ t, who: (k * 5 + 3) % 14 }));

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, box: v.box || null });
  for (const t of [0, .5, 1.0, 1.5]) push(t, 'bell');
  for (const t of [T.back, T.back + .5]) push(t, 'bell');
  // footsteps on carpet
  for (const [w, who] of [[you, 'you'], [cust, 'cust'], [boss, 'boss']]) for (let t = 1 / 60; t < DUR; t += 1 / 60) {
    const g = w(t), g0 = w(t - 1 / 60);
    if (g.moving && g0.moving && walkStep(t, true) !== walkStep(t - 1 / 60, true) && walkStep(t, true) % 2 === 0) push(t, 'step', { who });
  }
  push(T.cord, 'cord'); push(T.wall, 'curtain'); push(T.drain, 'drain'); push(T.grab, 'grab'); push(T.hang, 'hang'); push(T.hang, 'gull');
  push(T.xp, 'xp'); push(T.ring, 'ring'); push(T.ring + 1.0, 'ring'); push(T.ring + .9, 'pickup');
  push(T.up, 'whoosh'); push(T.meh1, 'meh'); push(18.5, 'chew'); push(T.meh2, 'meh'); push(T.eatSign, 'munch'); push(21.0, 'gasp');
  push(T.bus, 'horn'); push(T.bus + .5, 'brakes'); push(T.door, 'revolve');
  for (const tr of TOURISTS) push(tr.a, 'tstep');
  for (const f of FLASHES) push(f.t, 'flash', { who: f.who });
  push(T.keyUp, 'sparkle'); push(T.lift, 'ding'); push(T.crunch, 'crunch'); push(T.fired, 'gameover'); push(T.fired + .6, 'xpdown');
  push(T.hired, 'nod'); push(DUR, 'cut');
  return ev.sort((a, b) => a.t - b.t);
}
