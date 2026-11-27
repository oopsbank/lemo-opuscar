// You Are the IT Help Desk (Job #8): the timeline is the single source of truth for picture, sound, subtitles and checks.
// Music grid: 4/4, crotchet = 120 → beat B = 0.5 s, bar = 2 s. Every big hit lands on a beat.
export const B = .5;
export const DUR = 34.85;

export const T = {
  cont: 1.0, wide: 1.5, quest: 2.5, w1: 2.9, btn: 7.3, off: 7.5, on: 7.75, fixed: 8.0, combo: 9.0, intern: 11.0, ring: 12.0, ceo: 12.4,
  pc: 14.0, router: 14.8, server: 16.0, down: 17.5, up: 18.0, twist: 18.5, cascade: 19.5, again: 22.0, again2: 22.5, full: 24.0, restart: 24.3, dark: 24.6,
  fired: 25.0, plug: 27.0, plugIn: 27.7, conn: 28.0, end: 30.7, reflex: 33.6, k2: 34.35,
};
export const SHOTS = [
  { id: 'close', a: 0, b: T.wide },          // opening type (d): the GAME OVER card cold open, in the dark CEO office lit by blue screens
  { id: 'wide', a: T.wide, b: T.w1 },
  { id: 'desk', a: T.w1, b: T.btn },
  { id: 'btn', a: T.btn, b: T.combo },
  { id: 'combo', a: T.combo, b: T.ring },
  { id: 'ceo', a: T.ring, b: T.server },
  { id: 'server', a: T.server, b: T.twist },
  { id: 'reboot', a: T.twist, b: T.again },
  { id: 'again', a: T.again, b: T.dark },
  { id: 'fired', a: T.dark, b: T.plug },     // the catch-up: the frame-0 two-shot, now with YOU'RE FIRED
  { id: 'plug', a: T.plug, b: T.end },
  { id: 'end', a: T.end, b: T.k2 },
  { id: 'closeEnd', a: T.k2, b: DUR },       // the loop seam: the same two-shot as frame 0
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

export const VO = [
  { id: 'c0', t: 0.05, dlg: true, who: 'THE CEO', sub: 'You rebooted the whole building?', box: [0.0, 1.5], pass: true },   // the hook line: cut by CONTINUE on purpose (also heard)
  { id: 'n1', t: 1.75, sub: 'You are the IT help desk.' },
  { id: 'w1', t: 3.68, dlg: true, who: 'A COLLEAGUE', sub: 'My screen’s dead!', box: [3.45, 6.1] },
  { id: 'y1', t: 6.2, dlg: true, who: 'YOU', sub: 'Turned it off and on?', box: [6.1, 9.0] },
  { id: 'y2', t: 9.1, dlg: true, who: 'YOU', sub: 'Off. On. Fixed! Next!', box: [9.0, 12.0] },
  { id: 'c1', t: 12.6, dlg: true, who: 'THE CEO', sub: 'My internet is broken. Fix it!', box: [12.4, 15.9] },
  { id: 'y3', t: 16.4, dlg: true, who: 'YOU', sub: 'Off… and on.', box: [16.2, 18.5] },
  { id: 'y4', t: 19.4, dlg: true, who: 'YOU', sub: 'It’s all rebooting!', box: [19.3, 22.1] },
  { id: 'c3', t: 22.3, dlg: true, who: 'THE CEO', sub: 'Internet fixed?', box: [22.1, 24.6] },
  { id: 'c4', t: 28.15, dlg: true, who: 'THE CEO', sub: 'Oh. It was unplugged.', box: [27.8, 30.7] },
  { id: 'm2', t: 30.8, dlg: true, who: 'THE CEO', sub: 'Fired. Go be a flight attendant.', box: [30.7, 34.35] },
];
export const BANNERS = [
  { id: 'quest', kicker: 'JOB #8  ·  QUEST', text: '50 TICKETS BY 5', a: T.quest, b: 5.9 },
  { id: 'alert', kicker: '!  SYSTEM  !', text: 'REBOOTING…', a: T.twist, b: 21.3 },
];
export const QUESTION = 'IT people: what’s the dumbest fix that actually worked?';   // pinned comment, not on screen
// the combo: one device per beat, off and on
export const COMBO = [
  { id: 'printer', t: 9.0, x: -4.0 }, { id: 'copier', t: 9.5, x: -2.6 }, { id: 'coffee', t: 10.0, x: -1.2 }, { id: 'vending', t: 10.5, x: .2 }, { id: 'lamp', t: 11.0, x: 2.3 },
];

// —— game feel ——
export const FREEZES = [[T.cont, .06], [T.fixed, .06], [T.down, .1], [T.twist, .12], [T.conn, .1]];
export const SHAKES = [[0, .5], [T.cont, .7], [T.wide, .2], [T.fixed, .25], [T.ring, .3], [T.down, .6], [T.up, .5], [T.twist, 1.0], [T.cascade, .4], [T.again, .7], [T.restart, .6], [T.dark, .8], [T.plugIn, .3], [T.reflex, .4], [T.k2, .4]];
export const FLASHES = [T.cont, T.twist, T.again];
export const sceneT = t => { for (const [a, d] of FREEZES) if (t >= a && t < a + d) return a; return t; };
export const shakeAt = t => { let k = 0; for (const [a, s] of SHAKES) if (t >= a) k = Math.max(k, s * Math.exp(-(t - a) * 7)); if ((t >= T.twist && t < T.dark)) k = Math.max(k, .12); return k; };

export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const walkStep = (t, fast) => Math.floor(t * (fast ? 10 : 7)) % 4;

// blocking (metres; floor y 0). The open-plan floor x[−9.5, 7.5] z[−4.5, 3.5]; the server room behind glass at the far left x < −6.4;
// the CEO's glass office at the far right x > 3.2; the window wall at the back (z −4.6) with the devices in front of it (z −4.05);
// desk row A at z −.5 (workers behind at −1.05), row B at z 1.9 (workers at 1.35), the help desk front left.
export const P = {
  ceoDesk: [5.0, -2.5], ceoAt: [5.3, -1.95], heroCeo: [4.68, -1.8],
  main: [-7.75, -4.32], heroMain: [-7.15, -3.65], serverDoor: [-6.4, -2.1],
  w1Desk: [-.65, -.5], w1: [-.65, -1.05, 3], heroW1: [.2, -.1], help: [-3.0, 2.0], heroHelp: [-3.0, 1.42],
  intern: [2.3, -3.75, 6], internDesk: [2.3, -3.2], devZ: -4.05, heroDevZ: -3.4, elevator: -5.4,
};
// the building's power: 1 = lights on. Dark in the frame-0 state, when the main switch is down, while the lights come back row by row,
// after RESTART REQUIRED, and after the reflex click at the end
export const power = t => t < T.wide ? 0 : t < T.down ? 1 : t < T.twist ? 0 : t < T.twist + .9 ? seg(t, T.twist + .1, T.twist + .9) : t >= T.again && t < T.again + .3 ? 0 : t < T.dark ? 1 : t < T.plug ? 0 : t < T.reflex + .25 ? 1 : 0;
// the screens: 'blue' (UPDATING, the frame-0 state), 'desk', 'upd' (1 of 487), 'upd2' (1 of 974), 'red' (RESTART REQUIRED)
export const screens = t => t < T.wide ? 'blue' : t < T.twist ? 'desk' : t < T.again + .3 ? 'upd' : t < T.full ? 'upd2' : t < T.dark ? 'red' : t < T.plug ? 'blue' : t < T.reflex + .25 ? 'desk' : 'blue';
export const tickets = t => t < T.fixed ? 0 : t < T.combo ? 1 : t < T.intern + .3 ? 1 + COMBO.filter(c => t >= c.t + .25).length : t < T.conn ? Math.min(49, 6 + Math.round(43 * ss(seg(t, T.intern + .3, T.ring - .1)))) : 50;
export const mood = t => t < T.ceo ? 1 : t < T.pc + .3 ? .75 : t < T.router + .3 ? .55 : t < T.twist ? .4 : t < T.again ? .2 : t < T.conn ? 0 : .5;
export const desksUp = t => t >= T.cascade && t < T.dark ? .25 * Math.max(0, Math.sin((t - T.cascade) * 5)) : 0;   // the standing desks ride up and down in a wave

// the office: workers at the two desk rows (x, z, variant); the sleeping intern at the lamp desk
export const ROWA = [-4.4, -3.15, -1.9, -.65, .6, 1.85], ROWB = [-.65, .6, 1.85];
export const WORKERS = [[-4.4, -1.05, 1], [-3.15, -1.05, 4], [-1.9, -1.05, 6], [.6, -1.05, 2], [1.85, -1.05, 7], [.6, 1.35, 5], [1.85, 1.35, 1]];

export function events() {
  const ev = [], push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const b of BANNERS) push(b.a, 'banner', { id: b.id });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, box: v.box || null });
  push(0, 'buzz', { d: 1.0 }); push(T.cont, 'coin'); push(T.wide, 'whoosh'); push(T.quest, 'chime');
  push(T.off, 'click'); push(T.on, 'click'); push(T.fixed, 'boot');
  for (const c of COMBO) { push(c.t, 'click'); push(c.t + .25, 'ding', { k: COMBO.indexOf(c) }); }
  push(T.intern + .3, 'combo');
  push(T.ring, 'ring', { d: .9 }); push(T.pc, 'click'); push(T.pc + .3, 'nope'); push(T.router, 'click'); push(T.router + .3, 'nope');
  push(T.down, 'clunk'); push(T.down + .05, 'powerdown'); push(T.up, 'clunk');
  push(T.twist, 'boot', { big: 1 }); push(T.twist, 'banner2'); for (let k = 0; k < 4; k++) push(T.twist + .1 + k * .2, 'lights', { k });
  push(T.cascade, 'paper', { d: 2.5 }); push(20.0, 'cans', { d: 2 }); push(20.5, 'elevator', { d: 1.5 }); push(21.0, 'vacuum', { d: 2.5 });
  push(T.again, 'clunk'); push(T.again + .05, 'powerdown'); push(T.again2, 'boot');
  push(T.full, 'ding', { k: 5 }); push(T.restart, 'error'); push(T.dark, 'powerdown'); push(T.fired, 'gameover'); push(T.fired + .6, 'xpdown');
  push(T.plugIn, 'plug'); push(T.conn, 'connect'); push(T.conn + .3, 'fanfare');
  push(T.reflex, 'click'); push(T.reflex + .25, 'powerdown'); push(T.k2 + .1, 'buzz', { d: .4 });
  push(DUR, 'cut');
  return ev.sort((a, b) => a.t - b.t);
}
