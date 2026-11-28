// The Ring Run — one timeline in film seconds (no global slow-motion: the ring's two flights are simply slow arcs).
// World metres: x east, z south (toward the default camera). Three tiers on a hillside:
//   top    — GRAND HOTEL roof (y 22) and neighbouring roofs, z −24…−12
//   middle — MARKET STREET terrace (y 8), z −26…0, tram 7 along z −5.5 curving north at x 8
//   bottom — the canal (water y −0.4, z 8…13), quays (y 0), the stone bridge (x 24), HARBOR CHAPEL (x −12…−2, z 15…26) and its clock tower
import { clamp, seg, lerp, ss, eio, eo, ei } from '/core/lib.js';
export { clamp, seg, lerp, ss, eio, eo, ei };

export const DUR = 72;
export const MID = 8, TOP = 22;
export const STREET = { z0: -8, z1: -2, bike: -3.2, rail: -5.5 };
export const HOTEL = { x0: -6, x1: 10, z0: -24, z1: -12 };
export const RAIL_ = { y: TOP, z: -12.35, h: 1.1 };                 // the roof railing
export const BOX = { x: 2, y: TOP + 1.15, z: -12.35 };
export const LINE = { y: 19.6, z: -11.3, x0: -3.5, x1: 6.5 };       // laundry line on brackets off the facade
export const AWN = { x0: -1, x1: 5, z0: -10, z1: -8, y: MID + 3.4 }; // café awning (north side of the street)
export const FIRE = { x0: 7.4, x1: 10.4, z: -11.2 };                // fire escape on the hotel's south face
export const CURVE = { x: 8, z: -11.5, r: 6 };                      // the tram turns north into the side street at x 14
export const HOLE = { x: 13.6, z: -3.9 };                           // the manhole at the curve
export const PIPE = { x: 13.6 };                                    // runs down the terrace wall (z 0) and across the quay
export const STAIRS = { x0: 16.6, x1: 19.4 };                       // stone steps, middle → bottom tier (z −1 → 7)
export const CANAL = { z0: 8, z1: 13, y: -.4 };
export const BRIDGE = { x: 24, w: 3.2 };
export const CHAPEL = { x0: -4, x1: 6, z0: 15, z1: 26, h: 6.2, door: 1 };
export const TOWER = { x0: -7.8, x1: -4.4, z0: 15, z1: 18.4, h: 31 };
export const ROSE = { x: 1, y: 7.6, z: 15 };
export const GRATE = { x: 1, z: 23.4 };
export const ALTAR = { x: 1, z: 24.9 };

// —— key beats (film s) ——
export const T = {
  land: .3, peck: 1.0, fall0: 1.9, line: 4.0, awning: 6.0, basket: 7.0, sheet: 8.2, pothole: 14.0, tram: 16.0, apples: 17.0,
  board: 20.0, roof: 21.2, curve: 22.0, lunge: 23.4, slip: 24.0, hole: 24.7, kneel1: 25.2,
  pipe0: 27.0, pipe1: 31.0, splash: 31.5, kneel2: 32.2, hook: 35.0, flick: 37.0, run: 38.0, jump: 39.2, boat: 40.0, landing: 42.6,
  rose: 44.0, aisle: 44.6, turn: 46.0, wobble: 48.0, door: 49.0, slide0: 51.0, catch: 55.0, clock0: 57.0, dong: 60.0, cheer: 60.4,
  crane0: 62.0, crane1: 67.0, ring2: 67.2, steal: 68.0, out: 69.0, notagain: 70.0, loop: 71.0,
};
// —— the flower bike (west along the south lane), the tram (along the rails), the boat (west along the canal) ——
export const bikeX = t => 1.0 - 2.0 * (t - T.basket) - (t > T.pothole ? .6 * Math.max(0, t - T.pothole) : 0);
const RL = { x0: -46, xc: CURVE.x };   // rails: straight from x −46 to the curve start, then a quarter circle, then north
export const RAILLEN = RL.xc - RL.x0, ARC = CURVE.r * Math.PI / 2;
export function railAt(d) {
  if (d <= RAILLEN) return { x: RL.x0 + d, z: STREET.rail, yaw: Math.PI / 2 };
  if (d <= RAILLEN + ARC) { const a = (d - RAILLEN) / CURVE.r; return { x: CURVE.x + Math.sin(a) * CURVE.r, z: CURVE.z + Math.cos(a) * CURVE.r, yaw: Math.PI / 2 + a }; }
  const e = d - RAILLEN - ARC; return { x: CURVE.x + CURVE.r, z: CURVE.z - e, yaw: Math.PI };
}
export const TRAMV = 4.2, TRAM_D16 = (-17.5) - RL.x0;              // the tram's centre at t 16 is at x −17.5
export const tramD = t => TRAM_D16 + TRAMV * (t - T.tram);
export const boatX = t => t < 40 ? lerp(40, 23, seg(t, 36, 40)) : lerp(23, CHAPEL.door + .5, eo(seg(t, 40, T.landing)));
export const BOATZ = 10.5;

// —— the ring ——
const arc = (a, b, u, h) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) + h * 4 * u * (1 - u), z: lerp(a.z, b.z, u) });
const fall = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u * u), z: lerp(a.z, b.z, u) });
export const PIPEPTS = [[HOLE.x, MID - .2, HOLE.z], [PIPE.x, MID - 1.0, .55], [PIPE.x, 1.3, .7], [PIPE.x, 1.0, 7.6]];
export const OUTFALL = { x: PIPE.x, y: 1.0, z: 7.9 };
export const FISH = { x: BRIDGE.x - .9, y: 4.6, z: 10.3 };
export function ringPos(t, tram) {
  const B = { x: BOX.x, y: BOX.y, z: BOX.z };
  if (t < T.peck) return { ...B, mode: 'box' };
  if (t < T.fall0) { const u = seg(t, T.peck, T.fall0); return { x: B.x + .7 * u, y: B.y + .12 + Math.sin(u * Math.PI) * .05, z: B.z, mode: 'roll', spin: u * 6 }; }
  const A1 = { x: B.x + .7, y: B.y, z: B.z + .1 }, L1 = { x: 2.7, y: LINE.y + .05, z: LINE.z };
  if (t < T.line) return { ...fall(A1, L1, seg(t, T.fall0, T.line)), mode: 'fly', spin: t * 9 };
  const AW = { x: 2.2, y: AWN.y + .1, z: -8.9 };
  if (t < T.awning) return { ...arc(L1, AW, seg(t, T.line, T.awning), 2.2), mode: 'fly', spin: t * 9 };
  const BK = t2 => ({ x: bikeX(t2) - .55, y: MID + 1.35, z: STREET.bike });
  if (t < T.basket) return { ...arc(AW, BK(T.basket), seg(t, T.awning, T.basket), 2.4), mode: 'fly', spin: t * 9 };
  if (t < T.pothole) return { ...BK(t), mode: 'basket' };
  if (t < T.tram) { const p = arc(BK(T.pothole), tram.roofAt(T.tram, -1.6, .2), ss(seg(t, T.pothole, T.tram)), 6.5); return { ...p, mode: 'fly', spin: t * 5, slow: 1 }; }
  if (t < T.slip) { const lx = -1.6 + 1.9 * ss(seg(t, T.board, T.curve)), lz = .2 + 1.05 * ss(seg(t, T.curve, T.slip)); return { ...tram.roofAt(t, lx, lz), mode: 'tram' }; }
  const S0 = tram.roofAt(T.slip, .3, 1.3), G = { x: S0.x + .9, y: MID + .05, z: S0.z + 1.0 }, H = { x: HOLE.x, y: MID + .05, z: HOLE.z };
  if (t < T.hole) { const u = seg(t, T.slip, T.hole); if (u < .45) return { ...arc(S0, G, u / .45, .3), mode: 'fly' }; return { ...arc(G, H, (u - .45) / .55, .35), mode: 'fly' }; }
  if (t < T.pipe0) return { ...H, mode: 'hidden' };
  if (t < T.pipe1) { const u = ss(seg(t, T.pipe0, T.pipe1)) * 3, k = Math.min(2, Math.floor(u)), f = u - k, a = PIPEPTS[k], b = PIPEPTS[k + 1];
    return { x: lerp(a[0], b[0], f) + (k === 1 ? Math.sin(f * 14) * .28 : 0), y: lerp(a[1], b[1], f), z: lerp(a[2], b[2], f) + (k === 1 ? Math.cos(f * 14) * .2 : 0), mode: k === 0 ? 'hidden' : 'pipe', spin: t * 12 }; }
  const SPL = { x: PIPE.x + .4, y: CANAL.y, z: 10.2 };
  if (t < T.splash) return { ...arc(OUTFALL, SPL, seg(t, T.pipe1, T.splash), .5), mode: 'fly' };
  if (t < T.hook) return { ...SPL, y: CANAL.y - .6, mode: 'hidden' };
  if (t < T.flick) { const u = seg(t, T.hook, T.hook + .7); return { x: FISH.x, y: lerp(CANAL.y, FISH.y - .35, eo(u)), z: FISH.z, mode: 'fish' }; }
  const RW = { x: ROSE.x, y: ROSE.y, z: ROSE.z - .1 };
  if (t < T.rose) return { ...arc({ x: FISH.x, y: FISH.y, z: FISH.z }, RW, seg(t, T.flick, T.rose), 11), mode: 'fly', spin: t * 4, slow: 1 };
  const IN = { x: CHAPEL.door + .1, y: .12, z: CHAPEL.z0 + 2.2 };
  if (t < T.aisle) return { ...fall(RW, IN, seg(t, T.rose, T.aisle)), mode: 'fly' };
  if (t < T.wobble) { const u = seg(t, T.aisle, T.wobble), b = Math.abs(Math.sin(seg(t, T.aisle, T.aisle + .8) * Math.PI * 2)) * .35 * (1 - seg(t, T.aisle, T.aisle + .8));
    return { x: IN.x, y: .12 + b, z: lerp(IN.z, GRATE.z - 1.1, eo(u)), mode: 'roll', spin: u * 30 }; }
  if (t < T.catch) { const u = seg(t, T.wobble, T.catch); return { x: IN.x + .35 * ss(u), y: .12, z: lerp(GRATE.z - 1.1, GRATE.z - .35, ss(u)), mode: 'roll', wob: 1, spin: 30 + u * 6 }; }
  return { x: IN.x, y: .12, z: GRATE.z - .35, mode: 'hand' };
}
