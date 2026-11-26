// You Are a Fish Seller — timeline (single source of truth for picture, sound, subtitles and checks)
// Music grid: 6/8, dotted-quarter = 90 → beat B = 2/3 s, bar = 2 beats. Chase section 36.0–40.0 at beat .5 s.
export const B = 2 / 3;
export const DUR = 60.0;

export const T = {
  lamp: B * 1,          // 0.667  stall lamp clicks on
  lift: B * 4,          // 2.667  you lift the fish
  gullIn: B * 11,       // 7.333  gull drops in
  land: B * 12,         // 8.0    gull lands on the counter
  grab: B * 20,         // 13.333 gull grabs a fish (music stops dead)
  granIn: B * 23,       // 15.333 grandma starts walking in (J-cut)
  granAt: B * 29,       // 19.333 she reaches the counter
  stare: B * 38,        // 25.333 close on the stare (silence)
  leave: B * 40,        // 26.667 she leaves with fish and coins
  eye: B * 51,          // 34.0   the fish opens its eye
  flop: 36.0,           // fish flops off the scale, the chase starts (beat .5)
  leap: 39.5,           // fish leaps off the pier end
  splash: 40.0,         // splash (music stops)
  turn: 42.0,           // you turn round; rack focus to the stall
  rackEnd: 43.0,
  sun: 50.667,          // sunrise begins
  title: 54.667,        // title card
};

export const SHOTS = [
  { id: 'open', a: 0, b: B * 10 },          // 0–6.667
  { id: 'gull', a: B * 10, b: 16.0 },       // 6.667–16
  { id: 'gran', a: 16.0, b: T.stare },      // 16–25.333
  { id: 'stare', a: T.stare, b: T.leave },  // 25.333–26.667
  { id: 'leave', a: T.leave, b: B * 44 },   // 26.667–29.333
  { id: 'insert', a: B * 44, b: T.flop },   // 29.333–36
  { id: 'chase', a: T.flop, b: 40.667 },    // 36–40.667
  { id: 'edge', a: 40.667, b: 49.333 },     // 40.667–49.333
  { id: 'rise', a: 49.333, b: DUR },        // 49.333–60
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

// Voice lines. t = start; dur from voices/dur.json. card: the chapter card that prints this line (no subtitle).
// dlg: spoken on screen (dialogue box), box = [in, out] seconds.
export const VO = [
  { id: 'n1', t: B * 2, sub: 'You are a fish seller.' },
  { id: 'n2', t: B * 6.5, sub: 'Rule one. Greet your first customer.', card: 1 },
  { id: 'y1', t: B * 13 + .08, dlg: true, who: 'YOU', sub: 'Good morning, sir!', box: [B * 13, B * 17] },
  { id: 'n3', t: B * 21, sub: 'He did not pay.' },
  { id: 'n4', t: B * 24.5, sub: 'Rule two. Never haggle with a grandma.', card: 2 },
  { id: 'g1', t: B * 31 + .08, dlg: true, who: 'GRANDMA', sub: 'Two pounds.', box: [B * 30, B * 34] },
  { id: 'y2', t: B * 35 + .08, dlg: true, who: 'YOU', sub: 'It’s ten!', box: [B * 34, B * 38] },
  { id: 'n5', t: B * 41, sub: 'Somehow, you paid her.' },
  { id: 'n6', t: B * 44.5, sub: 'Rule three. Make sure the fish is dead.', card: 3 },
  { id: 'f1', t: B * 52 + .08, dlg: true, who: 'THE FISH', sub: 'Nope.', box: [B * 52, B * 55] },
  { id: 'n7', t: 40.0 + B * 1, sub: 'It was not.' },
  { id: 'g2', t: 40.0 + B * 8 + .08, dlg: true, who: 'GRANDMA', sub: 'Keep the change, dear.', box: [40.0 + B * 8, 40.0 + B * 12.5] },
  { id: 'n8', t: 40.0 + B * 12.5, sub: 'Rule four. Never leave your stall.', card: 4 },
  { id: 'n9', t: 40.0 + B * 18, sub: 'You were a fish seller.' },
];
// Gull lines: no voice (a synthesized squawk), but a dialogue box
export const SQUAWKS = [
  { id: 'q1', t: B * 17 + .1, box: [B * 17, B * 20.5] },               // 11.333
  { id: 'q2', t: 40.0 + B * 5 + .1, box: [40.0 + B * 5, 40.0 + B * 8] }, // 43.333
];
// Chapter cards: [in, out]
export const CARDS = [
  { n: 1, label: 'RULE  I', line: 'Greet your first customer.', a: B * 6, b: B * 12.6 },
  { n: 2, label: 'RULE  II', line: 'Never haggle with a grandma.', a: 16.0, b: B * 30.5 },
  { n: 3, label: 'RULE  III', line: 'Make sure the fish is dead.', a: B * 44, b: B * 50.6 },
  { n: 4, label: 'RULE  IV', line: 'Never leave your stall.', a: 40.0 + B * 12, b: 40.0 + B * 18 },
];

// —— Blocking (shared by the picture and the foley events) ——
export const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// Grandma: walks in from the right along the front of the stalls, stops at the counter; leaves to the left
export const GRAN = { x0: 5.2, x1: 1.35, z: 1.05, xLeave: -6 };
export function granX(t) {
  if (t < T.granIn) return GRAN.x0;
  if (t < T.granAt) return GRAN.x0 + (GRAN.x1 - GRAN.x0) * seg(t, T.granIn, T.granAt);
  if (t < T.leave + .3) return GRAN.x1;
  return GRAN.x1 + (GRAN.xLeave - GRAN.x1) * seg(t, T.leave + .3, T.leave + .3 + 4.6);
}
export const granWalking = t => (t > T.granIn && t < T.granAt) || (t > T.leave + .3 && t < T.leave + 4.9);
export const granStep = t => Math.floor(t * 6) % 4;   // 6 fps shuffle

// You: behind the counter until the chase; run to the pier end
export const YOU = { x: -.25, z: -.78, runX0: 1.0, edgeX: 9.35 };
export function youRunX(t) {   // during the chase (36.0–40.0): around the counter end, then along the pier
  const u = seg(t, T.flop + .45, T.splash - .1);
  return YOU.runX0 + (YOU.edgeX - YOU.runX0) * (u < .9 ? u / .9 * .97 : .97 + (u - .9) / .1 * .03);
}
export const youRunning = t => t > T.flop + .45 && t < T.splash - .25;
export const runStep = t => Math.floor(t * 10) % 4;   // 10 fps run

// The fish: flops from the scale to the pier end, then leaps into the sea
export const FISH = { x0: .95, z0: -.05, y0: 1.06, xEdge: 10.6 };
export const FLOPS = [36.0, 36.5, 37.0, 37.5, 38.0, 38.5, 39.0, 39.5];   // one flop per chase beat; the last is the leap

// Events for the mixer (sound) and the cue checker
export function events() {
  const ev = [];
  const push = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  push(T.lamp, 'lamp');
  for (const c of CARDS) push(c.a, 'card', { n: c.n });
  for (const v of VO) if (v.dlg) push(v.box[0], 'dlg', { id: v.id });
  for (const q of SQUAWKS) { push(q.box[0], 'dlg', { id: q.id }); push(q.t, 'squawk'); }
  push(T.gullIn - .2, 'wings', { d: .9 }); push(T.land, 'land');
  push(T.grab, 'grab'); push(T.grab + .1, 'wings', { d: 1.3 });
  push(T.lift, 'lift');
  // grandma shuffle steps
  for (let t = T.granIn; t < DUR; t += 1 / 60) { if (granWalking(t) && granWalking(t - 1 / 60) && granStep(t) !== granStep(t - 1 / 60) && granStep(t) % 2 === 0) push(t, 'gstep'); }
  push(T.stare + .6, 'heart');
  push(T.leave + .05, 'coins'); push(T.leave + .35, 'coins');
  push(T.eye, 'blink');
  for (let i = 0; i < FLOPS.length - 1; i++) push(FLOPS[i] + .02, 'flop', { i });
  push(T.leap, 'leap');
  for (let t = T.flop; t < T.splash; t += 1 / 60) { if (youRunning(t) && youRunning(t - 1 / 60) && runStep(t) !== runStep(t - 1 / 60) && runStep(t) % 2 === 0) push(t, 'boot'); }
  push(T.splash - .25, 'skid');
  push(T.splash, 'splash');
  push(T.turn, 'turn');
  push(40.0 + B * 9.2, 'coins');
  push(T.sun, 'sun');
  push(T.title, 'title');
  for (const v of VO) push(v.t, 'vo', { id: v.id, sub: v.sub, dlg: !!v.dlg, who: v.who || null, card: v.card || 0, box: v.box || null });
  for (const q of SQUAWKS) push(q.box[0], 'sq', { box: q.box });
  return ev.sort((a, b) => a.t - b.t);
}
