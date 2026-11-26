// Snow Day — everything that moves or changes: three ploughs on scripted routes, the plough map (which road is cleared when),
// the two drifts, snow plumes, the school, the kids, the snowman, snowfall, traffic and walkers after the bell
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, QUAY, EXT, CLR } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, monotone } from '/core/lib.js';
import { T, Sq } from './story.js';
import { makeSprites, puffTex, dotTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const smooth = (x, a, b) => ss(seg(x, a, b));
export function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .55, ...o })); }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

// —— Places ——
export const SCHOOL = { x0: -84, x1: -22, z0: 274, z1: 298, h: 9, gate: V(-53, 0, 266) };
export const DRIFT1 = V(-130, 0, 384);          // the drift the blue plough sticks in
export const EXCL = [[SCHOOL.x0 - 8, SCHOOL.x1 + 6, SCHOOL.z0 - 10, SCHOOL.z1 + 10]];

// —— Routes: polylines through waypoints, cumulative length, and a scripted s(t) per plough ——
function path(W) {
  const Pt = [W[0]];
  for (let i = 1; i < W.length; i++) { const [x0, z0] = W[i - 1], [x1, z1] = W[i], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0))); for (let k = 1; k <= n; k++) Pt.push([lerp(x0, x1, k / n), lerp(z0, z1, k / n)]); }
  const L = [0]; for (let i = 1; i < Pt.length; i++) L.push(L[i - 1] + Math.hypot(Pt[i][0] - Pt[i - 1][0], Pt[i][1] - Pt[i - 1][1]));
  const wpS = W.map(([x, z]) => { let best = 0, bd = 1e9; Pt.forEach(([a, b], i) => { const d = Math.hypot(a - x, b - z) + i * 1e-6; if (d < bd) { bd = d; best = i; } }); return L[best]; });
  const xy = s => { s = clamp(s, 0, L[L.length - 1] - .001); let i = 0, j = L.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (L[m] <= s) i = m; else j = m; } const u = (s - L[i]) / (L[j] - L[i] || 1); return [lerp(Pt[i][0], Pt[j][0], u), lerp(Pt[i][1], Pt[j][1], u)]; };
  return { L, wpS, xy, len: L[L.length - 1] };
}
const R1 = path([[-4, -4], [-4, 523], [250, 523], [250, 263], [-47, 263]]);
const R2 = path([[-130, -125], [-130, 523], [6, 523], [6, 274]]);
const R3 = path([[120, -125], [120, 627], [-260, 627], [-260, -125]]);
const sZ2 = z => -125 < z ? R2.wpS[0] + (z + 125) : 0;   // along x = -130 going south
const sX1 = x => R1.wpS[3] + (250 - x);                   // along z = 263 going west
export const PLOUGHS = [
  { name: 'P1', col: '#f07a1f', R: R1, s: monotone([[0, 0], [9.8, R1.wpS[1]], [14.5, R1.wpS[1] + 160], [18.5, R1.wpS[1] + 162], [24.0, sX1(60)], [26.0, sX1(8)], [27.5, sX1(-28)], [T.gate, R1.len], [99, R1.len]]) },
  { name: 'P2', col: '#2f6fd0', R: R2, s: monotone([[0, 0], [14.5, sZ2(377)], [16.3, sZ2(379.5)], [17.1, sZ2(374)], [T.ram, sZ2(373.6)], [T.burst, sZ2(381)], [18.5, sZ2(392)], [25.5, R2.len], [99, R2.len]]) },
  { name: 'P3', col: '#e8b51e', R: R3, s: monotone([[0, 0], [14.5, R3.len * .5], [18.5, R3.len * .5 + 2], [27.0, R3.len], [99, R3.len]]) },
];
export function ploughAt(i, t) {
  const p = PLOUGHS[i], s = p.s(t), [x, z] = p.R.xy(s), a = p.R.xy(s - 3), b = p.R.xy(s + 3);
  let yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const v = (p.s(t + .05) - p.s(t - .05)) / .1;
  if (i === 1 && t > T.back0 - .1 && t < T.ram) yaw = Math.atan2(0, 1);   // reversing: keep facing south
  return { x, z, yaw, v, s };
}

// —— The plough map: for every metre of road, the film time a blade passed over it ——
export function makeClearMap() {
  const W = CLR.w, H = CLR.h, d = new Uint8Array(W * H * 4).fill(255);
  const stamp = (x, z, r, t) => {
    const v = Math.min(254, Math.round(t / 40 * 255));
    const cx = x - CLR.x0, cz = z - CLR.z0;
    for (let j = Math.floor(cz - r); j <= Math.ceil(cz + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
      if (i < 0 || j < 0 || i >= W || j >= H || (i - cx) ** 2 + (j - cz) ** 2 > r * r) continue;
      const k = (j * W + i) * 4; if (d[k] > v) d[k] = v;
    }
  };
  for (let t = 0; t <= 30; t += 1 / 48) PLOUGHS.forEach((p, i) => {
    const st = ploughAt(i, t);
    if (i === 1 && t > T.stuck0 && t < T.burst) return;           // the drift holds until the ram
    const onBlvd = i === 0 && st.z > BLVD.z0 - 2 && st.z < BLVD.z1 + 2 && Math.abs(st.x) < 14;
    stamp(st.x, st.z, onBlvd ? 9 : 6.6, t);
    if (onBlvd) stamp(st.x + 10, st.z, 6, t + .4);                // a second pass on the wide boulevard, just behind
  });
  const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

// —— Plough mesh ——
const vmat = (color, o = {}) => { const m = mat(color, o); m.defines = { NOSNOW: '' }; return m; };   // vehicles stay clean
function makePloughMesh(scene, col) {
  const mat = vmat;
  const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.3);
  const body = mat(col, { roughness: .4 }), dark = mat('#14171c', { roughness: .15, metalness: .4 }), black = mat('#1d1d1f', { roughness: .8 }), steel = mat('#8b9096', { metalness: .6, roughness: .4 });
  box(2.4, 2.3, 2.2, body, 0, 1.75, 1.6, i); box(2.42, .8, 1.5, dark, 0, 2.3, 1.7, i); box(2.2, .9, .08, dark, 0, 2.2, 2.72, i);
  box(2.4, 1.5, 4.4, body, 0, 1.55, -1.9, i); box(2.5, .3, 4.5, steel, 0, .8, -1.9, i);
  for (const z of [1.6, -1.2, -2.8]) for (const x of [-1.1, 1.1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .4, 12), black); w.rotation.z = Math.PI / 2; w.position.set(x, .55, z); w.castShadow = true; i.add(w); }
  const blade = new THREE.Group(); blade.position.set(0, .7, 3.6); blade.rotation.y = -.32; i.add(blade);
  box(4.6, 1.3, .3, mat('#f2c230', { roughness: .45 }), 0, 0, 0, blade);
  box(4.6, .15, .32, mat('#1d1d1f'), 0, -.6, .02, blade);
  const beaconM = new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ffa010', emissiveIntensity: 0 });
  box(.5, .3, .5, beaconM, 0, 3.05, 1.6, i);
  const headM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.5, 2.2) });
  for (const x of [-.8, .8]) box(.4, .25, .1, headM, x, 1.3, 2.76, i);
  const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10).scale(1, .5, 1), mat('#e9eef5', { roughness: .95 })); pile.position.set(0, .2, 5.4); pile.castShadow = true; i.add(pile);
  scene.add(g);
  return { g, beaconM, pile };
}

export function makePloughs(scene) {
  const m = PLOUGHS.map(p => makePloughMesh(scene, p.col));
  const N = 70, plume = makeSprites(scene, 3 * N, puffTex(), { additive: false });
  return {
    states: [],
    draw(t) {
      this.states = PLOUGHS.map((p, k) => {
        const st = ploughAt(k, t), o = m[k];
        o.g.position.set(st.x, 0, st.z); o.g.rotation.y = st.yaw;
        if (k === 1 && t > T.spin && t < T.back0) { o.g.position.x += Math.sin(t * 60) * .05; o.g.rotation.z = Math.sin(t * 47) * .01; } else o.g.rotation.z = 0;
        o.beaconM.emissiveIntensity = Math.floor(t * 5 + k) % 2 ? 5 : .2;
        // the pile in front of the blade: grows on the school run, stays at the kerb after
        const pileK = k === 0 ? smooth(t, 26.2, T.gate) : 0;
        o.pile.scale.set(.4 + 2.2 * pileK, .3 + 1.6 * pileK, .4 + 1.4 * pileK); o.pile.visible = pileK > .01;
        return st;
      });
      // plumes: snow thrown off the right end of each blade while it moves
      this.states.forEach((st, k) => {
        const fx = Math.sin(st.yaw), fz = Math.cos(st.yaw), rx = -fz, rz = fx;   // right of travel
        const mv = clamp(Math.abs(st.v) / 40) * (k === 1 && t > T.stuck0 && t < T.burst ? .25 : 1);
        for (let j = 0; j < N; j++) {
          const i = k * N + j, a = (j / N + t * 2.3 + k * .3) % 1;
          if (mv < .05 || t > 30) { plume.hide(i); continue; }
          const base = V(st.x + fx * 6.2 + rx * 3.2, 1.2, st.z + fz * 6.2 + rz * 3.2);
          const x = base.x + rx * a * 9 - fx * a * 3 + (hash(j * 1.3) - .5) * 2, z = base.z + rz * a * 9 - fz * a * 3 + (hash(j * 2.9) - .5) * 2;
          const y = base.y + a * 5 - a * a * 6;
          const r = (1.2 + a * 3) * (.6 + .4 * mv);
          plume.set(i, x, Math.max(.3, y), z, r, r, .95, .97, 1, .75 * (1 - a) * mv, hash(j) * 6.28);
        }
      });
    },
    finish(cam, fog) { plume.sortBy(cam); plume.commit(fog); },
  };
}

// —— The drift on x = -130 (bursts when rammed), sprays from the spinning wheels, the burst ——
export function makeDrift(scene) {
  const g = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat('#eef2f8', { roughness: .95 }));
  g.position.copy(DRIFT1); g.scale.set(7, 2.6, 4.5); g.castShadow = g.receiveShadow = true; scene.add(g);
  const N = 120, sp = makeSprites(scene, N, puffTex(), { additive: false });
  return {
    draw(t, p2) {
      const b = smooth(t, T.burst - .05, T.burst + .35);
      g.scale.set(7 + 3 * b, 2.6 * (1 - .85 * b), 4.5 + 2 * b); g.position.y = 0;
      for (let i = 0; i < N; i++) {
        let on = false;
        if (i < 50 && t > T.spin && t < T.back0) {   // wheel spray behind the stuck plough
          const a = (i / 50 + t * 3) % 1, fx = Math.sin(p2.yaw), fz = Math.cos(p2.yaw), side = i % 2 ? 1.4 : -1.4;
          sp.set(i, p2.x - fx * (3 + a * 6) + fz * side, .5 + a * 2 - a * a * 2.5, p2.z - fz * (3 + a * 6) - fx * side, .8 + a * 1.6, .8 + a * 1.6, .93, .95, 1, .7 * (1 - a), hash(i) * 6); on = true;
        } else if (i >= 50 && t > T.burst && t < T.burst + 1.6) {   // the burst
          const a = (t - T.burst) / 1.6, an = hash(i * 3.3) * 6.28, v = 6 + hash(i * 7.1) * 10;
          sp.set(i, DRIFT1.x + Math.cos(an) * v * a * 1.5, 1 + (4 + hash(i) * 6) * a - 6 * a * a, DRIFT1.z + 3 + Math.sin(an) * v * a, 2 + 4 * a, 2 + 4 * a, .95, .97, 1, .85 * (1 - a), hash(i) * 6); on = true;
        }
        if (!on) sp.hide(i);
      }
    },
    finish(cam, fog) { sp.sortBy(cam); sp.commit(fog); },
  };
}

// —— School: a long two-storey building, a bell turret, a yard with a fence, "SCHOOL" on the roof ——
export function schoolGeometry(b) {
  const s = SCHOOL;
  b.gBld.box(s.x0, s.x1, 0, s.h, s.z0, s.z1, '#f1d9a8', '#cfc7b8', { facade: true, wp: [3.4, 3.6, 1000 + 41] });
  b.gBld.box(-56, -50, s.h, s.h + 3.4, s.z0 + 2, s.z0 + 6, '#f1d9a8', '#b25a3d');   // bell turret
  b.gFlat.flat(s.x0, s.x1, s.z0 - 6.5, s.z0, .13, '#d9cdb5');                       // forecourt
  for (const [x0, x1] of [[s.x0, -56], [-50, s.x1]]) b.gFlat.box(x0, x1, 0, 1.1, s.z0 - 6.7, s.z0 - 6.4, '#2a5d8f', '#2a5d8f');
}
export function makeRoofSign(scene, text, cx, cz, w, h, y, rotY, colors) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.font = '900 260px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(512, 270); const tw0 = g.measureText(text).width; g.scale(Math.min(1, 920 / tw0), 1.2);
  g.lineWidth = 24; g.strokeStyle = colors[1]; g.lineJoin = 'round'; g.strokeText(text, 0, 0); g.fillStyle = colors[0]; g.fillText(text, 0, 0); g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  m.rotation.set(-Math.PI / 2, rotY, 0, 'YXZ'); m.position.set(cx, y, cz); m.receiveShadow = true; scene.add(m); return m;
}

// —— The snowman in the park (an orange cone for a hat, the ploughs' colour): the hidden gag ——
export function makeSnowman(scene) {
  const g = new THREE.Group(), w = mat('#f3f6fa', { roughness: .95 });
  for (const [r, y] of [[1.5, 1.3], [1.05, 3.4], [.75, 4.9]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), w); s.position.y = y; s.castShadow = true; g.add(s); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.4, 12), new THREE.MeshStandardMaterial({ color: '#f07a1f', roughness: .5 })); cone.position.y = 6.2; cone.castShadow = true; g.add(cone);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.14, .7, 8), new THREE.MeshStandardMaterial({ color: '#f07a1f' })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 4.9, .9); g.add(nose);
  const twig = new THREE.MeshStandardMaterial({ color: '#5a3d28' });
  for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.2, 5), twig); a.position.set(sx * 1.8, 3.8, 0); a.rotation.z = sx * 1.0; g.add(a); }
  g.position.set(-62, .1, 205); g.rotation.y = .5; scene.add(g);
  return g;
}

// —— People: kids waiting at the gate, cheering and going in; walkers and traffic come out once the roads are open ——
export function makePeople(scene) {
  const rnd = mulberry(21), kids = [], walkers = [];
  for (let i = 0; i < 70; i++) kids.push({ wait: V(-80 + rnd() * 54, 0, SCHOOL.z0 - 5.6 + rnd() * 4.6), arrive: 18 + rnd() * 9, from: V(-200 + rnd() * 300, 0, 200 + rnd() * 120), into: V(SCHOOL.x0 + 6 + rnd() * 50, 0, SCHOOL.z0 - .8), ph: rnd() * 9, d: rnd() * .7 });
  for (let i = 0; i < 360; i++) {
    const side = rnd() < .5 ? -1 : 1;
    if (rnd() < .42) { const z = lerp(-20, 625, rnd()), hw = z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : 7; walkers.push({ axis: 'z', c: side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -20, hi: 625, on: 30.6 + rnd() * 3 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; walkers.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, rnd()), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460, on: 30.6 + rnd() * 3 }); }
  }
  const n = kids.length + walkers.length;
  const geo = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: .7 }), n); m.castShadow = true;
  const PCOL = ['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c', '#9b4fd0'];
  for (let i = 0; i < n; i++) m.setColorAt(i, C.set(PCOL[Math.floor(rnd() * PCOL.length)]));
  m.frustumCulled = false; scene.add(m);
  return {
    draw(t) {
      const s = Sq(t); let k = 0;
      for (const c of kids) {
        const sc = .85;
        if (t < c.arrive) { M.compose(P.set(0, -50, 0), Q.identity(), Sc.set(sc, sc, sc)); m.setMatrixAt(k++, M); continue; }
        P.copy(c.from).lerp(c.wait, smooth(t, c.arrive, c.arrive + 1.6));
        P.lerp(c.into, smooth(t, T.bell + .5 + c.d, T.bell + 2.2 + c.d));
        if (t > T.bell + 2.6 + c.d) P.y = -50;
        const hop = t > T.bell && t < T.bell + 1.4 ? Math.abs(Math.sin((t - T.bell) * 11 + c.ph)) * .8 : t > 27.5 && t < T.bell ? Math.abs(Math.sin(t * 6 + c.ph)) * .12 : 0;
        P.y += .1 + hop;
        M.compose(P, Q.identity(), Sc.set(sc, sc, sc)); m.setMatrixAt(k++, M);
      }
      for (const w of walkers) {
        const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s * 1.2) % span; if (u < 0) u += span; const p = w.lo + u;
        M.compose(P.set(w.axis === 'z' ? w.c : p, t > w.on ? .12 : -50, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(k++, M);
      }
      m.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— Cars: parked (snow on their roofs from the shader), and traffic on the ploughed roads after the bell ——
const CAR_COLS = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#2f63b5', '#e4b324', '#3f8f5b', '#8e98a3', '#1f4f8f', '#7fb3d5', '#f08c3a', '#a83a2f', '#d74b3a'];
export function makeCars(scene, n) {
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  for (const m of [body, cab]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
  const rnd = mulberry(31);
  for (let i = 0; i < n; i++) body.setColorAt(i, C.set(CAR_COLS[Math.floor(rnd() * CAR_COLS.length)]));
  let k = 0;
  return {
    begin() { k = 0; },
    put(x, y, z, yaw, sc = 1, len = 1) { if (k >= n) return; Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y, z), Q, Sc.set(sc, sc, sc * len)); body.setMatrixAt(k, M); cab.setMatrixAt(k, M); k++; },
    end() { for (const m of [body, cab]) { m.count = k; m.instanceMatrix.needsUpdate = true; } },
  };
}
export function makeTraffic() {
  const rnd = mulberry(5), lanes = [], parked = [];
  const L = (axis, c, dir, x0, x1) => lanes.push({ axis, c, dir, x0, x1, v: 10 + rnd() * 3, cars: [] });
  L('z', -126.6, 1, -120, 515); L('z', -133.4, -1, -120, 515); L('z', 116.6, -1, -120, 620); L('z', 123.4, 1, -120, 620);
  L('x', 520 - 3.4, -1, -300, 250); L('x', 520 + 3.4, 1, -300, 250); L('z', -9.2, 1, BLVD.z0 + 4, BLVD.z1 - 2); L('z', 9.2, -1, BLVD.z0 + 4, BLVD.z1 - 2);
  L('x', 627, -1, -260, 120); L('z', 246.6, 1, -120, 515);
  for (const l of lanes) { const len = l.x1 - l.x0; for (let s = rnd() * 20; s < len; s += 18 + rnd() * 30) l.cars.push({ s0: s, len: rnd() < .06 ? 2.2 : 1 }); }
  // parked along quieter kerbs
  for (const e of EW) for (let x = -480; x < 480; x += 13 + rnd() * 22) if (Math.abs(x) > 20 && rnd() < .55) parked.push([x, e.z + (rnd() < .5 ? -1 : 1) * (e.h + .4), Math.PI / 2]);
  for (const s of NS) for (let z = -300; z < 600; z += 13 + rnd() * 22) if (s.x !== 0 && rnd() < .45) parked.push([s.x + (rnd() < .5 ? -1 : 1) * (s.h + .4), z, 0]);
  const pos = (l, c, s) => { const len = l.x1 - l.x0; let u = (c.s0 + l.v * s * 1.5) % len; if (u < 0) u += len; return l.dir > 0 ? l.x0 + u : l.x1 - u; };
  return {
    draw(cars, t) {
      const on = smooth(t, 30.5, 31.5);
      if (on > 0) { const s = Sq(t); for (const l of lanes) for (const c of l.cars) { if (hash(c.s0) > on) continue; const p = pos(l, c, s); if (l.axis === 'x') cars.put(p, 0, l.c, l.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 1, c.len); else cars.put(l.c, 0, p, l.dir > 0 ? 0 : Math.PI, 1, c.len); } }
      for (const [x, z, yaw] of parked) cars.put(x, 0, z, yaw);
    },
  };
}

// —— Snowfall: light at the very start (the end of the night's snow) and again at the end (the loop) ——
export const snowAmt = t => Math.max(.55 * (1 - smooth(t, .2, 2.2)), smooth(t, T.snow0, T.snow0 + 1.2) * .55);
export function makeSnowfall(scene) {
  const N = 1600, rnd = mulberry(77), F = Array.from({ length: N }, () => [rnd() * 2 - 1, rnd() * 2 - 1, rnd(), rnd(), rnd()]);
  const sp = makeSprites(scene, N, dotTex(), { additive: false });
  return {
    draw(t, center, R) {
      const a = snowAmt(t);
      for (let i = 0; i < N; i++) {
        const [u, v, w, k, e] = F[i];
        if (k > a) { sp.hide(i); continue; }
        const H = R * .7, y = ((w * H - t * 9) % H + H) % H;
        sp.set(i, center.x + u * R + Math.sin(t * 1.3 + e * 9) * 2, y, center.z + v * R, .9 * R / 160, .9 * R / 160, 1, 1, 1, .9);
      }
    },
    finish(cam, fog) { sp.commit(fog); },
  };
}
export const BELL = V(-50, 12.6, SCHOOL.z0 + 4);
