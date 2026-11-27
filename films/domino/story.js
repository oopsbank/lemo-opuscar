// Domino (Miniature Chaos) — one timeline in film seconds, no narration. One junction of the toy town (x 120, z 260),
// seen from the south: the scaffold building top-left (NW), the hydrant bottom-left (SW), the building site with the tower
// crane on the right (NE), the bakery with a giant cake bottom-right (SE). A pigeon knocks a paint bucket off the scaffold and
// starts a chain: car → hydrant → scooter rider → crane → pipes → pile-up → ball truck → lamp posts → bakery sign → cake → police car.
import { clamp, seg, lerp, eio, ss } from '/core/lib.js';

export const DUR = 60;
export const J = { x: 120, z: 260 };
export const LANE = { wb: 257.2, eb: 262.8, nb: 122.8, sb: 117.2 };   // westbound / eastbound (z), northbound / southbound (x)
export const SCAF = { x0: 92, x1: 112, z0: 236, z1: 251, h: 13.2, plank: 9.9, front: 254.2 };   // building + scaffold on its south face
export const BUCKET = { x: 104.5, z: 253.6, y: 9.9 + .5 }, BUCKET2 = { x: 107.6, z: 253.6, y: 9.9 + .5 };
export const HYD = { x: 93, z: 268.6 };
export const CRANE = { x: 156, z: 224, h: 30, jib: 38, cab: { r: 2.2 } };
export const STACK = { x: 139, z: 245.5, y: 6 };   // pipe stack on a platform at the site's south-west corner
export const RAMP = { top: { x: 134.6, y: 6, z: 249.7 }, bot: { x: 127, y: .05, z: 254.2 } };   // the ramp runs down west-south-west onto the junction
export const POSTS = Array.from({ length: 6 }, (_, i) => ({ x: 129.5 + i * 6.2, z: 268.4, h: 6.6 }));
export const BAKERY = { x0: 164, x1: 182, z0: 271, z1: 287, h: 8, sign: { x: 163.6, z: 270.2, h: 5.6 }, cake: { x: 170, z: 273.6 } };
export const COP = { stop: { x: 169, z: 264.4 } };
export const T = {
  land: 1.0, peck1: 3.0, peck2: 3.7, tip: 4.2, fall: 5.5, splat: 6.9,
  hydrant: 8.0, launch: 8.35, cab: 14.0, spin0: 15.0, spin1: 20.0, sweep: 0, roll0: 0, roll1: 28.0,
  brake: 29.6, smash: 33.6, burst: 33.8, post0: 35.6, postDt: .5, sign: 0, cakeFall: 0, copStop: 39.6, cakeHit: 0,
  hold0: 46, hold1: 50, zoom1: 54.5, look: 54.2, fly: 55.8, knock: 56.2, fall2: 56.5, black: 58.3,
};
T.sign = T.post0 + T.postDt * POSTS.length + .1; T.cakeFall = T.sign + .5; T.cakeHit = T.cakeFall + 1.25;

// —— the red sports car: westbound, hit by the paint at x 104.5, swerves left into the hydrant ——
export function carPose(t) {
  const v = 16.4, xHit = BUCKET.x - 1.5;
  if (t < T.splat) return { x: xHit + v * (T.splat - t), z: LANE.wb, yaw: -Math.PI / 2, paint: 0 };
  const u = clamp((t - T.splat) / (T.hydrant - T.splat));
  // a wobbly swerve across both lanes to the south kerb, then the hydrant: a cubic from the impact point to the crash point
  const x = lerp(xHit, HYD.x + 2.4, u) - Math.sin(u * Math.PI) * 1.2, z = lerp(LANE.wb, HYD.z - 1.2, ss(u)) + Math.sin(u * Math.PI * 3) * .6 * (1 - u);
  const yaw = -Math.PI / 2 - .55 * Math.sin(u * Math.PI * .9) + Math.sin(u * 18) * .12 * (1 - u) - (t > T.hydrant ? .35 : 0);
  return { x, z, yaw, paint: 1 };
}
// —— the scooter rider: eastbound, launched by the geyser into the crane cab ——
export const SCOOT = { v: 11.5, x8: HYD.x - 1.0 };
export function riderPose(t, cabPos) {
  if (t < T.launch) { const x = SCOOT.x8 - SCOOT.v * (T.launch - t); return { x, y: 0, z: LANE.eb + .8, spin: 0, on: 1 }; }
  if (t < T.cab) {
    const u = (t - T.launch) / (T.cab - T.launch);
    const a = { x: HYD.x, y: 1.2, z: LANE.eb + .4 }, b = cabPos;
    const x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u), y = lerp(a.y, b.y, u) + 26 * 4 * u * (1 - u);   // a long comic arc
    return { x, y, z, spin: u * Math.PI * 5, on: 0 };
  }
  return { x: cabPos.x, y: cabPos.y, z: cabPos.z, spin: 0, on: 0, inCab: 1 };
}
// the crane's jib angle (radians about y); the cab is at the top of the mast; the spin overshoots and settles
export function craneYaw(t) {
  const a0 = Math.PI * .5, a1 = a0 - Math.PI;   // jib from pointing east (+x), round through south, to pointing west
  if (t < T.spin0) return a0 + Math.sin(t * .4) * .03;
  const u = clamp((t - T.spin0) / (T.spin1 - T.spin0));
  return lerp(a0, a1, eio(u)) + Math.sin(clamp((t - T.spin1) / 2.5) * Math.PI * 3) * .12 * (1 - clamp((t - T.spin1) / 2.5));
}
// when the hook (trolley radius TROLLEY) passes over the pipe stack
export const TROLLEY = Math.hypot(STACK.x - CRANE.x, STACK.z - CRANE.z);
{ const want = Math.atan2(STACK.x - CRANE.x, STACK.z - CRANE.z); for (let t = T.spin0; t < T.spin1; t += .005) if (craneYaw(t) <= want) { T.sweep = +t.toFixed(3); break; } T.roll0 = T.sweep + .35; }
export { clamp, seg, lerp, eio, ss };

// the harbour dressing (harbour.js) keeps clear of a berth; none here
export const QZ = 792, SHIP = { x: 9999, half: 14 };
