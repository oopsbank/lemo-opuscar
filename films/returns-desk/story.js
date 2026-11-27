// You Are a Returns Desk Clerk (Job #5): the timeline is the single source of truth for picture, sound, subtitles and checks.
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s. Every big hit lands on a beat.
export const B = .5;
export const DUR = 34.5;

export const T = {
  slam: 0, quest: 2.5, point: 4.5, drain: 5.0, smug: 7.5, catWalk: 7.9, catBite: 8.5, refund: 9.5,
  dad: 9.6, dslam: 10.5, pull: 12.0, date: 13.5, y2: 14.3,
  alert: 16.5, back: 20.0, crash: 20.5, pop: 21.5, boss: 21.5,
  fired: 26.0, ask: 26.2, hired: 30.5, capOn: 31.0, custBack: 32.2, c3: 33.4,
};
export const SHOTS = [
  { id: 'slam', a: 0, b: 1.2 },          // the slam open: a tight two-shot, the cake mid-bounce (frame 0)
  { id: 'desk', a: 1.2, b: T.pull },
  { id: 'receipt', a: T.pull, b: T.y2 - .3 },
  { id: 'desk2', a: T.y2 - .3, b: T.alert },
  { id: 'queue', a: T.alert, b: T.back },
  { id: 'crash', a: T.back, b: T.fired },
  { id: 'fired', a: T.fired, b: T.hired },
  { id: 'loop', a: T.hired, b: 33.6 },
  { id: 'slamEnd', a: 33.6, b: DUR },     // the loop seam: the same tight two-shot as frame 0, the cake raised
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'c1', t: 0.05, dlg: true, who: 'THE CUSTOMER', sub: 'I’d like to return this. It’s unopened.', box: [0.0, 4.2] },
  { id: 'n1', t: 2.45, sub: 'You are a returns desk clerk.' },
  { id: 'y1', t: 4.45, dlg: true, who: 'YOU', sub: 'There’s a slice missing.', box: [4.3, 7.4] },
  { id: 'c2', t: 7.55, dlg: true, who: 'THE CUSTOMER', sub: 'It came like that.', box: [7.4, 10.15] },
  { id: 'd1', t: 10.4, dlg: true, who: 'THE DAD', sub: 'I kept the receipt!', box: [10.3, 13.1] },
  { id: 'y2', t: 14.3, dlg: true, who: 'YOU', sub: 'It’s from 1998.', box: [14.2, 16.75] },
  { id: 'm1', t: 22.3, dlg: true, who: 'THE MANAGER', sub: 'Why is the queue in the car park?', box: [22.2, 25.95] },
  { id: 'm2', t: 30.6, dlg: true, who: 'THE MANAGER', sub: 'Nobody else applied.', box: [30.5, 33.35] },
  { id: 'c3', t: 33.4, dlg: true, who: 'THE CUSTOMER', sub: 'Excuse me!', box: [33.4, DUR], loop: true },
];
export const BANNERS = [
  { id: 'quest', kicker: 'JOB #5  ·  QUEST', text: 'SURVIVE DECEMBER 26', a: T.quest, b: 6.4 },
  { id: 'alert', kicker: '!  ALERT  !', text: 'RETURNS QUEUE: 300', a: T.alert, b: 20.0 },
];
export const CAPTION = { text: 'UNOPENED?', a: 0, b: 2.4 };   // the frame-0 hook, big, upper third
export const QUESTION = 'Retail workers: worst return ever?';

// —— game feel: freeze frames (hit-stop), screen shake, white flashes ——
export const FREEZES = [[10.5, .08], [13.5, .14], [20.5, .16], [26.0, .1]];
export const SHAKES = [[0, .8], [5.0, .15], [9.5, .3], [10.5, .45], [13.5, .55], [20.5, 1.0], [20.75, .5], [21.5, .3], [26.0, .5]];
export const FLASHES = [13.5, 20.5];
// scene time: the picture holds still for a few frames on each big hit (sound and UI keep real time)
export const sceneT = t => { for (const [a, d] of FREEZES) if (t >= a && t < a + d) return a; return t; };
export const shakeAt = t => { let k = 0; for (const [a, s] of SHAKES) if (t >= a) k = Math.max(k, s * Math.exp(-(t - a) * 7)); return k; };

// —— blocking (x east, y up, z toward camera). Store floor y 0; the desk x[-1.3,1.3] z[-2.35,-1.65], top .95 ——
export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const P = { you: [-.15, -2.75], cust: [.95, -1.15], cake: [.3, -1.98], till: [-.75, -2.02], cat0: [-1.05, -2.0], printer: [.55, -2.1], deskTop: .95 };
export const walkStep = (t, fast) => Math.floor(t * (fast ? 10 : 7)) % 4;

function walker(PATH) {
  return t => {
    let i = 0; while (i < PATH.length - 2 && t >= PATH[i + 1][0]) i++;
    const [t0, x0, z0] = PATH[i], [t1, x1, z1] = PATH[i + 1], u = seg(t, t0, t1);
    const moving = (x1 !== x0 || z1 !== z0) && t1 - t0 > .01 && t >= t0 && t < t1;
    return { x: x0 + (x1 - x0) * u, z: z0 + (z1 - z0) * u, moving, dx: x1 - x0, dz: z1 - z0 };
  };
}
// The Customer: at the desk, leaves with her refund, comes back for the loop
export const cust = walker([[0, ...P.cust], [9.8, ...P.cust], [10.6, 3.4, -1.6], [10.61, 9, -1.6], [32.0, 9, -1.6], [32.01, 2.6, -1.4], [33.0, ...P.cust], [DUR, ...P.cust]]);
// The Dad: first in the queue, steps up when she leaves
export const dad = walker([[0, 1.55, -.35], [9.6, 1.55, -.35], [10.25, ...P.cust], [T.fired, ...P.cust], [DUR, ...P.cust]]);
// The Manager: in from the staff door on the left
export const boss = walker([[T.boss, -4.6, -1.3], [22.2, -1.55, -1.25], [T.fired, -1.55, -1.25], [T.hired, -.95, -2.6], [32.0, -.95, -2.6], [32.7, -3.6, -2.9], [DUR, -3.6, -2.9]]);

// —— the queue: a zig-zag between stanchions, out of the glass doors and across the snowy car park ——
const LANES = [[1.55, -.35], [5.1, -.35], [5.1, .45], [1.4, .45], [1.4, 1.25], [5.4, 1.25], [7.6, 1.25], [10.5, 1.6], [13.5, 2.6], [17, 3.0], [21, 2.2], [25, 3.4], [30, 4.6]];
const SEGS = []; let LEN = 0;
for (let i = 0; i + 1 < LANES.length; i++) { const [ax, az] = LANES[i], [bx, bz] = LANES[i + 1], l = Math.hypot(bx - ax, bz - az); SEGS.push({ ax, az, bx, bz, l, s0: LEN }); LEN += l; }
export const QLEN = LEN;
export function queueAt(s) {   // position along the queue line (s metres from the head)
  s = Math.max(0, Math.min(LEN - .01, s));
  const g = SEGS.find(q => s >= q.s0 && s < q.s0 + q.l) || SEGS[SEGS.length - 1], u = (s - g.s0) / g.l;
  return { x: g.ax + (g.bx - g.ax) * u, z: g.az + (g.bz - g.az) * u, dx: g.bx - g.ax };
}
export const QGAP = .62;
export const QN = Math.floor(LEN / QGAP) - 1;   // people visible in the wide shot (the HUD says 300: the rest are round the corner)
// everyone shuffles one place forward when the Dad steps up
export const queueShift = t => QGAP * ss(seg(t, 9.75, 10.55));
export const QUEUE = [...Array(QN)].map((_, i) => ({ i, v: (i * 5 + 2) % 8, item: (i * 7 + 3) % 6, ph: (i * .37) % 1 }));
// HUD
export const xpAt = t => t < T.refund ? 0 : t < T.fired + .6 ? 10 : Math.round(10 - 1009 * ss(seg(t, T.fired + .6, T.fired + 1.8)));
export const patience = t => t < T.drain ? 1 : t < T.refund ? 1 - .75 * ss(seg(t, T.drain, T.drain + .5)) - .15 * ss(seg(t, T.catBite, T.catBite + .3)) : 1;
export const queueCount = t => t < T.alert ? 12 : Math.round(12 + 288 * ss(seg(t, T.alert + .2, 19.4)));
export const serving = t => t < T.refund + .3 ? 46 : 47;

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, box: v.box || null });
  for (const [w, who] of [[cust, 'cust'], [dad, 'dad'], [boss, 'boss']]) for (let t = 1 / 60; t < DUR; t += 1 / 60) {
    const g = w(t), g0 = w(t - 1 / 60);
    if (g.moving && g0.moving && walkStep(t, true) !== walkStep(t - 1 / 60, true) && walkStep(t, true) % 2 === 0) push(t, 'step', { who });
  }
  push(T.slam, 'slam'); push(.12, 'lid'); push(T.point, 'point'); push(T.drain, 'bang'); push(T.catWalk, 'catjump'); push(T.catBite, 'munch'); push(8.95, 'munch');
  push(T.refund, 'till'); push(T.refund + .05, 'coins'); push(T.refund + .1, 'xp'); push(10.0, 'shuffle');
  push(T.dslam, 'thud'); push(T.pull, 'rip'); push(T.date, 'stab'); push(T.date + .15, 'bang'); push(T.y2 - .2, 'sweat');
  push(T.alert, 'alarm'); push(16.6, 'whoosh'); push(T.back, 'whoosh'); push(T.crash - .35, 'creak'); push(T.crash, 'crash');
  for (let k = 0; k < 9; k++) push(T.crash + .08 + k * .11, 'thump', { k });
  push(T.pop, 'pop'); push(T.fired, 'gameover'); push(T.fired + .6, 'xpdown'); push(T.capOn, 'pop'); push(32.0, 'door');
  push(DUR, 'cut');
  return ev.sort((a, b) => a.t - b.t);
}
