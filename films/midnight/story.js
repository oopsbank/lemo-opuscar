// Midnight Crossing — one timeline in film seconds, no words. World metres: x east, z south (toward the camera), rails along z = 0.
import { clamp, seg, lerp, ss, eio } from '/core/lib.js';
export { clamp, seg, lerp, ss, eio };

export const DUR = 65;
export const ROAD = { x0: -3.6, x1: 3.6, sb: -1.8, nb: 1.8 };          // north–south street: southbound lane x −1.8, northbound +1.8
export const EWR = { z0: 6, z1: 11, wb: 7.25, eb: 9.75 };              // east–west street
export const RAIL = { z: 0, g: .55, bed: 1.5 };
export const BAR = { s: { x: -6.6, z: 2.5, len: 10.2, dir: 1 }, n: { x: 6.6, z: -2.5, len: 10.2, dir: -1 } };   // pivots; arms reach across the road
export const SIG = [{ x: -7.2, z: 2.9 }, { x: 7.2, z: -2.9 }];
export const CART = { x: -8.6, z: 3.6 };
export const SHELTER = { x0: 5.6, x1: 9.6, z0: 2.4, z1: 4.4 };
export const GIRL = { x: 6.9, z: 4.05 };
export const VEND = { x: 10.4, z: 3.1 };
export const LAMP = { x: -6.0, z: 13.4, hx: -5.0, hz: 11.9, h: 7.4 };   // base, head
export const HOLE = { x: 5.6, z: 14.2 };
export const STORE = { x0: -14, x1: -7.4, z0: 13.2, z1: 21, h: 3.6 };
export const BLK = { w: { x0: -17, x1: -4.8 }, e: { x0: 4.8, x1: 17 }, z0: -21, z1: -8.6, h: 12.6, fl: 3.15 };
export const MAN = { x: -4.5, z: 1.25 };                                // where the raincoat is trapped
export const COAT = { x: -2.6, z: 1.55 };                               // where the gust leaves the flat raincoat
export const UMB = { drop: { x: 7.3, z: 4.9 }, rest: { x: 9.2, z: 5.5 } };

export const T = {
  walk0: 1.2, arrive: 11.4, flick: 6.4,
  clock: 12.0, sig: 12.05, pige: 12.25, smoke: 12.2, bar0: 12.35, bar1: 13.2, lookL: 13.8, lookR: 15.6, lookL2: 17.6, lookR2: 19.6,
  push0: 24, ink0: 25.2, door: 26.4, figure: 27.4, reach: 33.4, step: 33.7, drop: 33.9, ink1: 36.6, push1: 37.6,
  light: 38.0, enter: 39.2, vanish0: 40.0, vanish1: 41.8, coat: 41.9, gust: 42.1, rise0: 43.2, rise1: 45.4, tail: 0,
  sigOff: 51.2, up0: 51.6, up1: 53.6, flick1: 52.5, flick2: 53.05, go: 55.0, stir: 52.8,
  sh0: 52.2, sh1: 55.0, pick: 55.6, hand: 57.0, nod: 57.4, away0: 58.2, away1: 61.6,
  glance0: 61.7, glance1: 62.5, lid: 62.75, eyes: 63.25, black: 64.6,
};
// the train: a loco and 8 coaches at 8.2 m/s from the west; nose at x = −12.5 (frame edge) at T.enter
export const TRAIN = { v: 8.2, loco: 7.2, coach: 6.4, n: 8, gap: .5 };
TRAIN.len = TRAIN.loco + TRAIN.n * (TRAIN.coach + TRAIN.gap);
export const noseX = t => -12.5 + (t - T.enter) * TRAIN.v;
T.tail = T.enter + (25 + TRAIN.len) / TRAIN.v;   // the tail leaves the right edge (x 12.5)

// the walker: from the store door, across the east–west street on the zebra, north up the pavement to the rails
const WP = [[-7.2, 14.5], [-4.6, 12.0], [-4.6, 5.3], [-4.5, 2.2], [MAN.x, MAN.z]];
const WL = [0]; for (let i = 1; i < WP.length; i++) WL.push(WL[i - 1] + Math.hypot(WP[i][0] - WP[i - 1][0], WP[i][1] - WP[i - 1][1]));
export function walkerPos(t) {
  const L = WL[WL.length - 1], d = L * clamp((t - T.walk0) / (T.arrive - T.walk0));
  let i = 1; while (i < WL.length - 1 && WL[i] < d) i++;
  const u = (d - WL[i - 1]) / (WL[i] - WL[i - 1]), a = WP[i - 1], b = WP[i];
  return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), moving: t > T.walk0 && t < T.arrive };
}
