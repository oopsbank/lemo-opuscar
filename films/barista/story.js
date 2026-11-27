// You Are a Barista (Job #7): the timeline is the single source of truth for picture, sound, subtitles and checks.
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s. Every big hit lands on a beat.
export const B = .5;
export const DUR = 44.4;

export const T = {
  erupt: 0, pulse: .5, rew: 1.2, wide: 1.5, quest: 2.5, reg: 4.0, write: 5.0, cup: 6.0, read: 6.6,
  rush: 9.5, cust: 13.0, order: 13.5, ticket: 14.0, nofoam: 17.1, knob: 20.0, max: 21.5, shake: 22.0,
  twist: 24.0, catchup: 24.6, flood: 25.5, serve: 27.3, sip: 30.5, too: 31.0, burst: 32.0, boss: 32.5, fired: 36.5, hired: 39.7, k2: 43.7,
};
export const SHOTS = [
  { id: 'close', a: 0, b: T.wide },          // opening type (b): disaster first — the eruption on frame 0, then the rewind
  { id: 'wide', a: T.wide, b: T.reg },
  { id: 'reg', a: T.reg, b: T.cup },
  { id: 'cup', a: T.cup, b: T.read },
  { id: 'read', a: T.read, b: T.rush },
  { id: 'rush', a: T.rush, b: T.cust },
  { id: 'order', a: T.cust, b: 16.0 },
  { id: 'ticket', a: 16.0, b: T.knob },
  { id: 'knob', a: T.knob, b: T.shake },
  { id: 'shake', a: T.shake, b: T.twist },
  { id: 'catch', a: T.twist, b: T.flood },
  { id: 'flood', a: T.flood, b: T.sip },
  { id: 'sip', a: T.sip, b: T.burst },
  { id: 'burst', a: T.burst, b: 32.7 },
  { id: 'boss', a: 32.7, b: T.hired },
  { id: 'hired', a: T.hired, b: T.k2 },
  { id: 'closeEnd', a: T.k2, b: DUR },       // the loop seam: the same close as frame 0
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'c0', t: 0.05, dlg: true, who: 'THE CUSTOMER', sub: 'Is my latte ready?', box: [0.0, 1.5], pass: true },   // the hook line: cut by the rewind on purpose (also heard)
  { id: 'n1', t: 1.6, sub: 'You are a barista.' },
  { id: 'r1', t: 4.1, dlg: true, who: 'THE REGULAR', sub: 'Name’s Siobhan.', box: [4.0, 6.55] },
  { id: 'y1', t: 6.7, dlg: true, who: 'YOU', sub: 'Latte for… Bird? Eye?', box: [6.6, 9.5] },
  { id: 'y2', t: 9.7, dlg: true, who: 'YOU', sub: 'Oat! Soy! Almond! Next!', box: [9.6, 12.7] },
  { id: 'c1', t: 13.6, dlg: true, who: 'THE CUSTOMER', sub: 'Oat latte. Half-caf. Extra hot.', box: [13.5, 17.1] },
  { id: 'c2', t: 17.2, dlg: true, who: 'THE CUSTOMER', sub: 'No foam. Extra foam.', box: [17.1, 19.95] },
  { id: 'y3', t: 20.2, dlg: true, who: 'YOU', sub: 'No foam… extra… Sure!', box: [20.0, 22.95] },
  { id: 'c0b', t: 24.6, dlg: true, who: 'THE CUSTOMER', sub: 'Is my latte ready?', box: [24.4, 27.15] },
  { id: 'y4', t: 27.3, dlg: true, who: 'YOU', sub: 'One oat latte! Extra foam!', box: [27.2, 30.45] },
  { id: 'c3', t: 31.0, dlg: true, who: 'THE CUSTOMER', sub: 'Too foamy.', box: [30.5, 32.7] },
  { id: 'm1', t: 32.8, dlg: true, who: 'THE MANAGER', sub: 'Why is my café a bubble bath?', box: [32.7, 36.2] },
  { id: 'm2', t: 39.8, dlg: true, who: 'THE MANAGER', sub: 'Sold out! Tomorrow, you fix the computers.', box: [39.7, 43.7] },
  { id: 'c4', t: 43.75, dlg: true, who: 'THE CUSTOMER', sub: 'Same again!', box: [43.7, DUR], loop: true },
];
export const BANNERS = [
  { id: 'quest', kicker: 'JOB #7  ·  QUEST', text: '100 ORDERS BY 9', a: T.quest, b: 6.2 },
  { id: 'alert', kicker: '!  ALERT  !', text: 'PRESSURE: MAX', a: T.twist, b: 27.0 },
];
export const CAPTION = { text: 'FOAM OVERLOAD', a: 0, b: 1.5 };   // the headline belongs to the eruption; the rewind cuts it
export const QUESTION = 'Baristas: most impossible order you’ve ever had?';   // pinned comment, not on screen
// the Customer's ticket: one modifier per beat while the printer spits
export const MODS = ['+OAT', '+HALF-CAF', '+EXTRA HOT', '+7 PUMPS', '+NO LID', '+LID', '+CINNAMON', '+NO FOAM', '+EXTRA FOAM', '+STIRRED', '+NOT STIRRED'];
export const modAt = k => T.ticket + k * .5;

// —— game feel ——
export const FREEZES = [[T.rew, .06], [T.cup, .08], [T.max, .1], [T.twist, .12], [T.burst, .14]];
export const SHAKES = [[0, .7], [T.pulse, .7], [T.wide, .2], [T.rush, .3], [T.max, .5], [22.5, .3], [23.0, .35], [23.5, .45], [T.twist, 1.0], [T.flood, .4], [T.burst, 1.0], [T.fired, .5], [T.k2, .4]];
export const FLASHES = [T.twist, T.burst];
// the rewind: for 0.3 s the scene runs backwards at ×4 (the geyser sucks back in)
export const sceneT = t => { if (t >= T.rew && t < T.wide) return Math.max(0, T.rew - (t - T.rew) * 4); for (const [a, d] of FREEZES) if (t >= a && t < a + d) return a; return t; };
export const shakeAt = t => { let k = 0; for (const [a, s] of SHAKES) if (t >= a) k = Math.max(k, s * Math.exp(-(t - a) * 7)); if ((t >= T.twist && t < T.sip) || t < T.rew || t >= T.k2) k = Math.max(k, .14); if (t >= T.max && t < T.twist) k = Math.max(k, .05 + .1 * seg(t, T.max, T.twist)); return k; };

export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const walkStep = (t, fast) => Math.floor(t * (fast ? 10 : 7)) % 4;
// blocking: the counter runs x[−3.2, 2.4] at z −1.2…−.55 (top y 1.05); the machine at x −1.6 on it, the hero behind at z −1.75
export const P = { counterZ: -.88, top: 1.05, hero: [-.75, -1.75], mach: [-1.75, -.95], wand: [-1.12, 1.42, -.78], till: [.75, -.9], printer: [1.2, -.95], case: [1.95, -.88], cust: [.15, .2], door: [5.4, -4.0] };
// the geyser: on during the opening (and rewound), from the twist through the flood, and again for the loop
export const geyser = t => t < T.rew ? .75 + .25 * seg(t, 0, .4) : t >= T.twist - .3 && t < T.sip ? Math.min(1, seg(t, T.twist - .3, T.twist)) : t >= T.k2 ? .35 + .4 * seg(t, T.k2, DUR) : 0;
// the foam level over the café floor (m)
export const foam = t => t < T.flood ? 0 : t < T.hired ? Math.min(.8, .8 * ss(seg(t, T.flood, 30.0))) - (t > T.burst ? .35 * ss(seg(t, T.burst, T.burst + 1.2)) : 0) : t < T.k2 ? .18 : 0;
export const orders = t => t < T.reg ? 0 : t < T.rush ? 1 : t < T.cust ? Math.min(47, 1 + Math.round(46 * ss(seg(t, T.rush, T.cust - .3)))) : t < T.hired ? 47 : Math.min(200, 47 + Math.round(153 * ss(seg(t, T.hired + .3, T.hired + 2.5))));
export const pressure = t => t < T.rew ? 1 : t < T.rush ? .2 : t < T.knob ? .2 + .3 * ss(seg(t, T.rush, T.cust)) : t < T.twist ? .5 + .5 * ss(seg(t, T.knob + .6, T.max + .3)) : t < T.fired ? 1 : .15;
export const KIDS = [];
// the queue: from the counter out to the door, right side; the laptop people at the tables on the left
export const QUEUE = [...Array(9)].map((_, i) => ({ i, v: (i * 5 + 3) % 8, x: 2.6 + i * .62, z: .55 + (i % 2) * .25 }));
export const SITTERS = [[-6.4, -.4, 0, false], [-5.2, -.4, 3, true], [-6.6, 1.6, 6, false], [-4.9, 1.6, 2, true], [-8.0, -2.6, 5, false]];

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, box: v.box || null });
  push(0, 'hiss', { d: 1.2 }); push(T.pulse, 'gush'); push(T.rew, 'rewind'); push(T.wide, 'whoosh');
  push(T.reg, 'bell'); push(T.write, 'marker'); push(T.cup, 'sting');
  for (let k = 0; k < 10; k++) push(T.rush + k * .5, 'slide', { k });
  for (let k = 0; k < 8; k++) push(T.rush + .25 + k * .5, 'ding', { k });
  push(T.cust, 'heels'); push(T.ticket, 'printer', { d: 5.0 });
  for (let k = 0; k < MODS.length; k++) push(modAt(k), 'mod', { k });
  push(T.knob, 'ratchet'); push(T.max, 'clunk'); for (const r of [22.5, 23.0, 23.5]) push(r, 'rattle');
  push(T.twist, 'blast'); push(T.twist, 'hiss', { d: 6.4 }); push(T.flood, 'bubbles'); push(T.serve, 'pour'); push(T.sip, 'slurp');
  push(T.burst, 'splash'); push(T.boss, 'steps'); push(T.fired, 'gameover'); push(T.fired + .6, 'xpdown');
  push(T.hired, 'cheer'); push(T.hired + .3, 'register'); push(T.k2, 'hiss', { d: .7 });
  push(DUR, 'cut');
  return ev.sort((a, b) => a.t - b.t);
}
