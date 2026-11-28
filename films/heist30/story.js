// The Last Train Heist — one timeline. Film seconds t ↔ story seconds s (a 0.3× slow-motion at the top of the jump).
// World metres: x east, z south (toward the camera). Viaduct along z −20, junction at (0, 3), bank at the bottom.
import { clamp, seg, lerp, ss, eio, eo } from '/core/lib.js';
export { clamp, seg, lerp, ss, eio, eo };

export const DUR = 65;
export const NS = { x0: -3.6, x1: 3.6, nb: 1.8, sb: -1.8 };       // north–south avenue (northbound lane x +1.8)
export const EW = { z0: 0, z1: 6, z: 3, wb: 1.5, eb: 4.5 };      // east–west road through the junction
export const QS = { z0: 11.8, z1: 14.6, z: 13.2 };               // the quiet street at the bottom (sidewalks 10.6–11.8 and 14.6–17)
export const VIA = { z: -20, w: 4.4, h: 7, x0: -40, x1: 13 };    // viaduct deck (top at h), ends in the tunnel at x 13
export const STATION = { x0: -21, x1: -3, plat: -17.1 };
export const CLIFF = { x0: 13, x1: 30, z0: -30, z1: -12, h: 16 };
export const BANK = { x0: -5, x1: 5, z0: 17, z1: 25, h: 5.5, door: { x: 0, z: 17 } };
export const CAFE = { x0: 6.2, x1: 13, z0: 17, z1: 23 };
export const STRIP = { z0: 7, z1: 10.6 };                        // low shops between the junction road and the quiet street
export const ALLEY = { x: 8.6 };
export const BLOCKS = [{ z0: -5.8, z1: -.6 }, { z0: -11.8, z1: -6.6 }, { z0: -17.0, z1: -12.6 }].map(b => ({ ...b, x0: 5.2, x1: 12.8, h: 12 }));
export const BOARD = { x: 7.0, z0: -14.4, z1: -17.4, y0: 12.3, w: 3.8 };    // the billboard ramp on block 3's roof: rises northward at 45° (4 m up)
export const BAG = '#2ff2d8';

// —— film time → story time: ×0.3 at the top of the jump ——
const SL = { a: 43.55, b: 44.0, k: .3 };
export const SLOW = { t0: SL.a, t1: SL.a + (SL.b - SL.a) / SL.k };
export function sim(t) { if (t <= SLOW.t0) return t; if (t <= SLOW.t1) return SL.a + (t - SLOW.t0) * SL.k; return SL.b + (t - SLOW.t1); }
export const invSim = s => s <= SL.a ? s : s <= SL.b ? SLOW.t0 + (s - SL.a) / SL.k : SLOW.t1 + (s - SL.b);

// story-time beats (s); film times for the sound come from invSim
export const T = {
  boom: .6, out: 1.0, alarm: .7, cops0: 6.0, heli: 7.5, jam: 9.0, cafe: 8.0, stop: 9.6, turn: 12.0,
  alley: 16.6, cross: 19.4, fire0: 20.6, fire1: 25.8, jump1: 28.4, jump2: 31.9, clock: 29.0, doors: 30.0, headlight: 30.6, whistle: 33.0,
  depart: 37.0, board0: 40.6, launch: 43.0, land: 44.95, roll: 45.6, grab: 46.2, tunnel: 0, flash: 0,
  line0: 46.5, line1: 52.5, out0: 46.6, sweep0: 60.6, black: 64.6,
};
// —— the train: 4 cars; front at x −3.5 at the platform; accelerates at 0.7 m/s² to 3.4 m/s, then cruises ——
export const TRAIN = { car: 3.7, gap: .35, n: 4, a: .7, v: 3.4, x0: -3.5 };
TRAIN.len = TRAIN.n * TRAIN.car + (TRAIN.n - 1) * TRAIN.gap;
export function trainS(s) { const d = Math.max(0, s - T.depart), ta = TRAIN.v / TRAIN.a; return d < ta ? .5 * TRAIN.a * d * d : .5 * TRAIN.a * ta * ta + TRAIN.v * (d - ta); }
export const trainFront = s => TRAIN.x0 + trainS(s);
export const lastCarX = s => trainFront(s) - TRAIN.len + TRAIN.car / 2;
{ let s = T.depart; while (trainFront(s) - TRAIN.len < VIA.x1) s += .01; T.tunnel = +s.toFixed(2); T.flash = T.tunnel + .25; }

// —— the thief's route: [story time, x, y, z] keyframes; jumps are arcs between roof edges ——
const R = 12;   // roof height
export const ROUTE = [
  [T.out, 0, 0, 16.6], [2.6, .8, 0, 13.4], [5.0, 2.6, 0, 10.8], [T.stop, 2.9, 0, 7.4],   // out of the bank, up the avenue toward the junction
  [T.turn, 2.9, 0, 7.4], [13.6, 4.0, 0, 11.2], [T.alley, 8.6, 0, 11.2],                 // boxed in: back, east along the quiet street
  [18.6, 8.6, 0, 7.0], [T.cross, 8.6, 0, 6.4], [T.fire0, 9.0, 0, -.4],                  // up the alley, across the road to the fire escape
];
// the fire escape zig-zags on block 1's south face (x 6.4–11.6), 4 flights
export const FIRE = { x0: 6.6, x1: 11.4, z: -.6 + .7 };
export function thiefPos(s) {
  if (s < T.out) return { x: 0, y: 0, z: 17.4, yaw: Math.PI, mode: 'hide' };
  if (s < T.fire0) {
    let i = 1; while (i < ROUTE.length - 1 && ROUTE[i][0] < s) i++;
    const a = ROUTE[i - 1], b = ROUTE[i], u = clamp((s - a[0]) / Math.max(1e-6, b[0] - a[0]));
    const mode = s > T.stop && s < T.turn ? 'look' : 'run';
    return { x: lerp(a[1], b[1], u), y: 0, z: lerp(a[3], b[3], u), yaw: Math.atan2(b[1] - a[1], b[3] - a[3]), mode };
  }
  if (s < T.fire1) {   // flights: up 3 m each, alternating direction
    const u = (s - T.fire0) / (T.fire1 - T.fire0) * 4, k = Math.min(3, Math.floor(u)), f = u - k, dir = k % 2 ? -1 : 1;
    const xa = dir > 0 ? FIRE.x0 : FIRE.x1, xb = dir > 0 ? FIRE.x1 : FIRE.x0;
    return { x: lerp(xa, xb, f), y: (k + f) * 3, z: FIRE.z, yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2, mode: 'climb' };
  }
  // rooftops: over the parapet, north across block 1, jump, block 2 (round the tanks), jump, block 3 to the billboard
  const RK = [[T.fire1, FIRE.x0, R, -.8], [T.fire1 + .5, 7.4, R, -1.6], [T.jump1, 8.4, R, -5.5], [T.jump1 + .7, 8.6, R, -7.0], [29.9, 10.6, R, -8.4], [30.9, 10.8, R, -10.2], [T.jump2, 9.4, R, -11.6],
    [T.jump2 + .7, 9.4, R, -13.0], [34.0, 11.8, R, -13.4], [35.6, 11.9, R, -16.4], [37.4, 11.9, R, -16.4], [39.2, 9.9, R, -13.2], [T.board0, BOARD.x, R, -14.0]];
  if (s < T.board0) {
    let i = 1; while (i < RK.length - 1 && RK[i][0] < s) i++;
    const a = RK[i - 1], b = RK[i], u = clamp((s - a[0]) / Math.max(1e-6, b[0] - a[0]));
    const jump = (a[0] === T.jump1 || a[0] === T.jump2) ? Math.sin(u * Math.PI) * 1.1 : 0;
    return { x: lerp(a[1], b[1], u), y: R + jump, z: lerp(a[3], b[3], u), yaw: Math.atan2(b[1] - a[1], b[3] - a[3]), mode: jump ? 'jump' : 'run' };
  }
  if (s < T.launch) {   // up the leaning billboard (45°), sliding the last part
    const u = ss(seg(s, T.board0, T.launch)), d = u * (BOARD.z0 - BOARD.z1);
    return { x: BOARD.x, y: BOARD.y0 + d, z: BOARD.z0 - d, yaw: Math.PI, mode: u > .55 ? 'slide' : 'run' };
  }
  const L = landPos();
  if (s < T.land) {   // the leap: a ballistic arc to the last car's roof
    const u = (s - T.launch) / (T.land - T.launch), y0 = BOARD.y0 + (BOARD.z0 - BOARD.z1);
    return { x: lerp(BOARD.x, L.x, u), y: lerp(y0, L.y, u) + 4 * 2.2 * u * (1 - u), z: lerp(BOARD.z1, L.z, u), yaw: Math.atan2(L.x - BOARD.x, L.z - BOARD.z1), mode: 'fly', u };
  }
  // on the roof of the last car, moving with the train
  const x = lastCarX(s) + (s < T.roll ? 0 : -.3 * eo(seg(s, T.roll, T.grab)));
  return { x, y: L.y, z: VIA.z, yaw: Math.PI / 2, mode: s < T.grab ? 'roll' : 'hold' };
}
export function landPos() { return { x: lastCarX(T.land), y: VIA.h + 2.75, z: VIA.z }; }
