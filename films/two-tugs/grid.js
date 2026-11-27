// All Green — a straight-lane traffic simulation (Intelligent Driver Model) over a 3 × 2 grid of junctions.
// Before sim t = 0 the lights work (warm-up). At t = 0 every light turns green: cars enter a junction whenever no crossing car
// is in it, even if the road beyond is full, so they get stuck inside it ("blocking the box"). At t = 3 two cars meet in the box of
// junction (120, 260). The queue behind them fills the junctions upstream, one after another: gridlock.
// At tTow the tow truck takes one of them away; the release travels back through the grid. Engine 9 rolls when its route is clear.
// Pure JS (no three.js): it runs in node for tuning (node grid.js) and in the page.

export const LEN = 4.4;
const P = { v0: 12, T: 1.1, a: 1.3, b: 2.6, s0: 2.0, d: 4 };
const DT = .05, REC = .1;
// streets: NS x (half width), EW z (half width)
export const NSX = [{ x: -130, h: 6, lo: 3 }, { x: 0, h: 7, lo: 3.8 }, { x: 120, h: 6, lo: 3 }];
export const EWZ = [{ z: 120, h: 6, lo: 3 }, { z: 260, h: 6, lo: 3 }];
// lanes: axis z (NS) or x (EW); dir +1 = toward +axis; c = the fixed coordinate; a0 → a1 = the start and end along the axis
export const LANES = [];
const lane = (id, axis, dir, c, a0, a1, o = {}) => { const L = { id, axis, dir, c, a0, a1, len: Math.abs(a1 - a0), hd: 2.6, ...o }; LANES.push(L); return L; };
for (const s of NSX) {
  if (s.x === 0) {
    lane('SB0', 'z', 1, -s.lo, -8, 625, { hd: 0 });                    // the fire station's own road: only Engine 9
    lane('NB0', 'z', -1, s.lo, 625, 131, { hd: 3.4, next: 'EB120', nextA: 14 });   // turns right (east) at (0, 120)
  } else {
    lane(`SB${s.x}`, 'z', 1, s.x - s.lo, -360, s.x === 120 ? 760 : 625, { hd: s.x === 120 ? 2.0 : 2.8 });
    lane(`NB${s.x}`, 'z', -1, s.x + s.lo, s.x === 120 ? 760 : 625, -360, { hd: 3.0 });
  }
}
for (const e of EWZ) {
  lane(`EB${e.z}`, 'x', 1, e.z + e.lo, -560, 560, { hd: e.z === 120 ? 2.1 : 2.3 });
  lane(`WB${e.z}`, 'x', -1, e.z - e.lo, 560, -560, { hd: 2.9 });
}
export const LANE = Object.fromEntries(LANES.map(l => [l.id, l]));
export const sOf = (L, a) => (a - L.a0) * L.dir;            // along-lane distance of the axis coordinate a
export const aOf = (L, s) => L.a0 + L.dir * s;
export function world(L, s) { const a = aOf(L, s); return L.axis === 'z' ? { x: L.c, z: a } : { x: a, z: L.c }; }
// junctions: box rectangle; for each lane through it, its entry/exit distances
export const JUNCS = [];
for (const s of NSX) for (const e of EWZ) {
  const hx = (s.x === 0 && e.z === 260 ? 8 : s.h) + .5, hz = e.h + .5;
  const J = { id: `${s.x},${e.z}`, x: s.x, z: e.z, hx, hz, lanes: [] };
  for (const L of LANES) {
    const along = L.axis === 'z' ? e.z : s.x, half = L.axis === 'z' ? hz : hx, cross = L.axis === 'z' ? Math.abs(L.c - s.x) < 12 : Math.abs(L.c - e.z) < 12;
    if (!cross) continue;
    const sIn = sOf(L, along - L.dir * half), sOut = sOf(L, along + L.dir * half);
    if (sIn < 0 || sOut > L.len) continue;
    J.lanes.push({ L, sIn, sOut });
  }
  JUNCS.push(J);
}
export const JUNC = Object.fromEntries(JUNCS.map(j => [j.id, j]));
for (const L of LANES) L.junc = JUNCS.flatMap(J => J.lanes.filter(q => q.L === L).map(q => ({ J, sIn: q.sIn, sOut: q.sOut }))).sort((a, b) => a.sIn - b.sIn);
// the lights before the glitch: NS green for 18 s, then EW, offsets per junction
export const greenFix = (J, t) => ((t + J.x * .04) % 20 + 20) % 20 < 10;
export const greenNS = (J, t) => (((t + (J.x + 200) * .05 + J.z * .03) % 36) + 36) % 36 < 18;

export const LOCKS_DEFAULT = [
  { J: '120,260', lane: 'SB120', t0: 3, t1: 71.2, kind: 'crashA', stop: 261.9 },
  { J: '120,260', lane: 'EB260', t0: 3, t1: 70, kind: 'crashB', stop: 115.9, tow: true },
  { J: '0,260', lane: 'EB260', t0: 13 , t1: 77 },
  { J: '120,120', lane: 'SB120', t0: 20, t1: 75 },
  { J: '0,120', lane: 'EB120', t0: 30, t1: 86 },
  { J: '-130,260', lane: 'EB260', t0: 40, t1: 81 },
  { J: '-130,120', lane: 'EB120', t0: 48, t1: 90 },
  { J: '0,260', lane: 'NB0', t0: 24, t1: 79 },
  { J: '120,120', lane: 'WB120', t0: 34, t1: 80 },
];
export function simulate(o = {}) {
  const tEnd = o.tEnd ?? 160, tRoll = o.tRoll ?? 999; const LOCKS = (o.locks || []).map(k => ({ ...k }));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cars = [];            // {id, L, s, v, alive, rec: [], hold, force, kind}
  let nid = 0;
  const add = (L, s, v, kind = 'car') => { const c = { id: nid++, L, s, v, kind, alive: true, born: null, died: null, rec: [], lanes: [], turnT: null, turnP: null, force: null, hold: null }; cars.push(c); return c; };
  const next = {}; for (const L of LANES) next[L.id] = rnd() * 3;
  // seed the lanes with flowing traffic
  for (const L of LANES) if (L.hd > 0) for (let s = 6; s < L.len - 6; s += 14 + rnd() * 26) add(L, s, 8);
  const engine = add(LANE.SB0, 9, 0, 'engine'); engine.hold = 9;   // waits on the apron
  const inBox = (c, q) => c.s > q.sIn - .3 && c.s - LEN < q.sOut;
  const laneCars = {};
  const sortLanes = () => { for (const L of LANES) laneCars[L.id] = []; for (const c of cars) if (c.alive) laneCars[c.L.id].push(c); for (const L of LANES) laneCars[L.id].sort((a, b) => b.s - a.s); };
  const crossOf = (J, L) => J.lanes.filter(q => q.L.axis !== L.axis);
  const recSteps = Math.round(REC / DT), T0 = -40;
  let step = 0;
  for (let t = T0; t <= tEnd + 1e-9; t += DT, step++) {
    const glitch = t >= 0;
    sortLanes();
    // locks: at t0 the next car on that lane goes into the box and stops in the middle (the crash, then cars stuck in boxes as the
    // queues arrive); at t1 it drives on (or is towed) and the junction gets its lights back
    for (const K of LOCKS) {
      const L = LANE[K.lane], q = JUNC[K.J].lanes.find(q => q.L === L);
      if (!K.car && !K.done && t >= K.t0) {
        const c = laneCars[L.id].filter(c => c.s < q.sIn + 1 && c.s > q.sIn - 45 && c.kind === 'car')[0];
        if (c) { K.car = c; c.kind = K.kind || 'stuck'; c.force = K.stop != null ? sOf(L, K.stop) : (q.sIn + q.sOut) / 2 + LEN / 2; }
      }
      if (K.car && !K.done && t >= K.t1) { K.done = true; if (K.tow) { K.car.alive = false; K.car.died = t; K.car.towed = true; } else K.car.force = null; }
    }
    if (t >= tRoll) engine.hold = null;
    // accelerations
    const acc = new Map();
    for (const L of LANES) {
      const arr = laneCars[L.id];
      for (let k = 0; k < arr.length; k++) {
        const c = arr[k];
        let gap = 1e9, vl = c.v;
        if (k > 0) { gap = arr[k - 1].s - LEN - c.s; vl = arr[k - 1].v; }
        const wall = w => { const g = w - c.s; if (g < gap) { gap = g; vl = 0; } };
        if (c.force != null) wall(c.force + 1.0);
        if (c.hold != null) wall(c.hold + .5);
        // the next junction ahead: may it go in?
        for (const q of L.junc) {
          if (c.s > q.sIn - .3) continue;                 // already in (committed) or passed
          if (q.sIn - c.s > 30) break;
          const crossCars = crossOf(q.J, L).flatMap(cq => laneCars[cq.L.id].map(x => ({ x, cq })));
          const lead = k > 0 ? arr[k - 1] : null, room = !lead || lead.s - LEN > q.sOut + LEN + 1.5;
          const fixed = LOCKS.some(K => K.J === q.J.id && K.done);
          const engineNear = crossCars.some(({ x, cq }) => x.kind === 'engine' && !x.hold && x.s < cq.sOut && cq.sIn - x.s < 40);
          const inside = crossCars.some(({ x, cq }) => inBox(x, cq));
          const busy = inside || engineNear || crossCars.some(({ x, cq }) => x.s < cq.sIn && cq.sIn - x.s < 3 + x.v * .6 && x.v > 1.5 && (cq.sIn - x.s) / Math.max(x.v, .1) < (q.sIn - c.s) / Math.max(c.v, .1));
          if (c.v < .5 && q.sIn - c.s < 3) c.wait = (c.wait || 0) + DT; else if (q.sIn - c.s >= 3) c.wait = 0;
          let ok;
          if (c.force != null) ok = true;
          else if (!glitch) ok = ((L.axis === 'z') === greenNS(q.J, t)) && room && !inside;
          else if (fixed) { const pre = engineNear || crossCars.some(({ x, cq }) => x.kind === 'engine' && !x.hold && x.s < cq.sOut && cq.sIn - x.s < 120); ok = !pre && ((L.axis === 'z') === greenFix(q.J, t)) && room && !inside; if (c.kind === 'engine') ok = !inside; }
          else ok = !busy || (!inside && !engineNear && (c.wait || 0) > 1.2);
          if (!ok) wall(q.sIn);
          break;
        }
        // end of the lane: a turn into another lane needs a gap there
        if (L.next) { const N = LANE[L.next], sN = sOf(N, L.nextA), blocked = laneCars[N.id].some(x => x.s > sN - LEN - 3 && x.s - LEN < sN + 6); if (blocked) wall(L.len); }
        const v0 = c.kind === 'engine' ? 13 : P.v0;
        const ss = P.s0 + Math.max(0, c.v * P.T + c.v * (c.v - vl) / (2 * Math.sqrt(P.a * P.b)));
        let a = P.a * (1 - (c.v / v0) ** P.d - (ss / Math.max(gap, .05)) ** 2);
        acc.set(c, Math.max(a, -9));
      }
    }
    for (const [c, a] of acc) {
      c.v = Math.max(0, c.v + a * DT); c.s += c.v * DT;
      if (c.force != null && c.s > c.force) { c.s = c.force; c.v = 0; }
      if (c.s >= c.L.len) {
        if (c.L.next) { const N = LANE[c.L.next], nA = c.L.nextA; c.turnT = t; c.turnP = world(c.L, c.L.len); c.L = N; c.s = sOf(N, nA); }
        else { c.alive = false; c.died = t; }
      }
    }
    // spawn at lane starts
    for (const L of LANES) {
      if (!(L.hd > 0) || t < next[L.id]) continue;
      const arr = laneCars[L.id], last = arr[arr.length - 1];
      if (!last || last.s - LEN > 8) { add(L, 0, 8); next[L.id] = t + L.hd * (.7 + .6 * rnd()) * (t > (o.ease ?? 66) ? 2.6 : 1); }
    }
    if (step % recSteps === 0 && t >= -.001) for (const c of cars) {
      if (!c.alive) continue;
      if (c.born == null) c.born = t;
      c.rec.push(c.s, c.v); c.lanes.push(c.L.id);
    }
  }
  // lookup
  const live = cars.filter(c => c.born != null);
  live.forEach(c => { c.k0 = Math.round(c.born / REC); });
  function state(c, t) {
    const f = t / REC - c.k0, n = c.lanes.length; if (f < 0 || f > n - 1) return null;
    const k = Math.min(n - 2, Math.floor(f)), u = f - k;
    if (n < 2) return { L: LANE[c.lanes[0]], s: c.rec[0], v: c.rec[1] };
    const L = LANE[c.lanes[k + 1]];
    let s0 = c.rec[k * 2], s1 = c.rec[k * 2 + 2];
    if (c.lanes[k] !== c.lanes[k + 1]) s0 = s1 - c.rec[k * 2 + 3] * REC;
    return { L, s: s0 + (s1 - s0) * u, v: c.rec[k * 2 + 1] * (1 - u) + c.rec[k * 2 + 3] * u };
  }
  return { cars: live, state, locks: LOCKS, engine, REC, tEnd };
}

// —— tuning (node grid.js): when each junction's box is blocked, and when it clears ——
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('grid.js')) {
  const S = simulate({ locks: LOCKS_DEFAULT, tRoll: 90, tEnd: 130 });
  const stuck = (J, t) => S.cars.filter(c => { const st = S.state(c, t); if (!st) return false; const q = J.lanes.find(q => q.L === st.L); return q && st.s > q.sIn && st.s - LEN < q.sOut && st.v < .3; }).length;
  console.log(S.locks.map(K => K.J + ' ' + K.lane + ' ' + (K.car ? 'ok' : 'MISSING')).join(' | '));
  const line = t => JUNCS.map(J => `${J.id}:${stuck(J, t)}`).join(' ');
  for (let t = 0; t <= 130; t += 5) console.log(String(t).padStart(4), line(t), ' q EB120', S.cars.filter(c => { const st = S.state(c, t); return st && st.L.id === 'EB120' && st.v < .3; }).length, ' SB120', S.cars.filter(c => { const st = S.state(c, t); return st && st.L.id === 'SB120' && st.v < .3; }).length);
  const eng = S.engine; for (let t = 80; t <= 130; t += 2) { const st = S.state(eng, t); if (st) process.stdout.write(`${t}:${st.s.toFixed(0)} `); } console.log();
}
