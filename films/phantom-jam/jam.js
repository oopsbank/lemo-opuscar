// The Phantom Jam — a ring-road traffic simulation (Intelligent Driver Model) on the boulevard's southbound lane.
// Cars leave at the bottom and re-enter at the top (a ring, like the classic circular-track experiment).
// Sim time in seconds; precomputed once; positions are looked up by sim time.
export const RING = { z0: -4, z1: 622 }; export const L = RING.z1 - RING.z0;
export const N = 44, LEN = 4.4;
export const IDX = { culprit: 20, ambulance: 4, hero: 5 };   // car order along the road, 0 = furthest back at the start
const P = { v0: 14, T: 1.0, a: .55, b: 2.0, s0: 2.0, d: 4 };
export function simulate(o = {}) {
  const DT = .05, STEPS = Math.ceil((o.tEnd ?? 200) / DT) + 1;
  const tBrake = o.tBrake ?? 0, tBrake2 = o.tBrake2 ?? 1e9, tSave = o.tSave ?? 999, vSave = o.vSave ?? 3.2, tPull = o.tPull ?? 999, zPull = o.zPull ?? 1e9;
  let x = Array.from({ length: N }, (_, i) => i * L / N), v = Array(N).fill(8);
  // warm up to steady flow (no perturbation)
  const acc = (i, x, v, t) => {
    let j = (i + 1) % N; if (pulled[j]) j = (j + 1) % N;
    let gap = (x[j] - x[i] + L) % L - LEN; if (gap <= 0) gap = .01;
    let v0 = P.v0, T = P.T;
    if (i === IDX.hero && t >= tSave) { v0 = vSave; T = 3.2; }
    const ss = P.s0 + Math.max(0, v[i] * T + v[i] * (v[i] - v[j]) / (2 * Math.sqrt(P.a * P.b)));
    let a = P.a * (1 - (v[i] / v0) ** P.d - (ss / gap) ** 2);
    if ((i === IDX.culprit && t >= tBrake && t < tBrake + 1.8) || (i === (o.brake2Idx ?? IDX.culprit) && t >= tBrake2 && t < tBrake2 + 1.8)) a = Math.min(a, -5);
    return Math.max(a, -8);
  };
  const pulled = Array(N).fill(false);
  for (let k = 0; k < 1200; k++) { const A = x.map((_, i) => acc(i, x, v, -1e9)); for (let i = 0; i < N; i++) { v[i] = Math.max(0, v[i] + A[i] * DT); x[i] = (x[i] + v[i] * DT) % L; } }
  // align so the ambulance starts near the top of the boulevard
  const sh = (L * .02 - x[IDX.ambulance] + L) % L; x = x.map(q => (q + sh) % L);
  const X = new Float32Array(STEPS * N), Vv = new Float32Array(STEPS * N), U = new Float32Array(STEPS * N), PULL = new Float32Array(STEPS);
  const unw = x.slice();   // unwrapped distance (for the ambulance's progress)
  let pullT = -1;
  for (let s = 0; s < STEPS; s++) {
    const t = s * DT;
    for (let i = 0; i < N; i++) { X[s * N + i] = x[i]; Vv[s * N + i] = v[i]; U[s * N + i] = unw[i]; }
    if (pullT < 0 && t > tPull && unw[IDX.ambulance] >= zPull) { pullT = t; pulled[IDX.ambulance] = true; }
    PULL[s] = pullT;
    const A = x.map((_, i) => acc(i, x, v, t));
    for (let i = 0; i < N; i++) { if (pulled[i]) { v[i] = 0; continue; } v[i] = Math.max(0, v[i] + A[i] * DT); x[i] = (x[i] + v[i] * DT) % L; unw[i] += v[i] * DT; }
  }
  const at = (arr, i, t) => { const f = Math.max(0, Math.min(STEPS - 1.001, t / DT)), s = Math.floor(f), u = f - s; return arr[s * N + i] * (1 - u) + arr[(s + 1) * N + i] * u; };
  return {
    DT, STEPS,
    pos(i, t) { const f = Math.max(0, Math.min(STEPS - 1.001, t / DT)), s = Math.floor(f), u = f - s; let a = X[s * N + i], b = X[(s + 1) * N + i]; if (b < a - L / 2) b += L; return RING.z0 + ((a * (1 - u) + b * u) % L); },
    vel: (i, t) => at(Vv, i, t), dist: (i, t) => at(U, i, t),
    pullT: () => PULL[STEPS - 1],
    brake(i, t) { return at(Vv, i, t - .25) - at(Vv, i, t + .25) > .8 || (at(Vv, i, t) < .6); },
  };
}
