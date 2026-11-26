// Not In Our Town — everything that moves: the saucer, its beam and shadow, the three things it takes, Engine 9 and its route,
// the fireboats, water jets, sparks and smoke, the crowd on the quay, ambient traffic and walkers, the bridge, moored boats
import * as THREE from 'three';
import { patchCloud, NS, EW, BLVD, STATION, BRIDGE, CANAL, QUAY, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, vnoise, monotone } from '/core/lib.js';
import { T, Sq } from './story.js';
import { makeSprites, puffTex, dotTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
const smooth = (x, a, b) => ss(seg(x, a, b));
export function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .55, ...o })); }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

// Action clock: film time, slowed ×¼ in the slow-motion hit (particles, wobble, sparks)
export const PC = t => t < T.slow0 ? t : t < T.slow1 ? T.slow0 + (t - T.slow0) / 4 : T.slow0 + (T.slow1 - T.slow0) / 4 + (t - T.slow1);

// —— Places ——
export const SAU = V(8, 54, 772);                  // where the saucer hovers
export const CAR0 = V(6, 0, 743.4), PALM0 = V(20, 0, 758), BOAT0 = V(2, -.9, 808);
export const ENGINE_STOP_X = 62, QUAY_LANE = 747.6;
export const FIREBOATS = [
  { from: V(-120, -.9, 1060), to: V(-34, -.9, 832), ph: 0 },
  { from: V(20, -.9, 1120), to: V(22, -.9, 852), ph: 1.3 },
  { from: V(160, -.9, 1050), to: V(80, -.9, 834), ph: 2.1 },
];

// —— The saucer's flight ——
const zA = monotone([[0, 40], [2.5, 205], [4.0, 228]]);   // high above the camera in shot 1: only its shadow is seen
const zB = monotone([[4.0, 610], [5.5, 700], [7.6, 772], [99, 772]]);
const yB = monotone([[4.0, 92], [7.6, 54], [99, 54]]);
export function saucerAt(t) {
  if (t < T.reveal) return { p: V(2, 260, zA(t)), tilt: 0, spin: t * .6, on: 1 };
  const p = V(lerp(-6, SAU.x, smooth(t, 4, 7.6)), yB(t), zB(t));
  const pc = PC(t);
  p.y += Math.sin(t * 1.7) * .6;
  let tilt = 0;
  const hurt = smooth(pc, T.hit - .05, T.hit + .3);
  if (t > T.hit) { tilt = hurt * (.08 + .05 * Math.sin(pc * 9)); p.x += Math.sin(pc * 7.3) * 1.2 * hurt; p.y += Math.sin(pc * 5.1) * 1.0 * hurt; }
  if (t > T.wobble) tilt += .14 * Math.sin((t - T.wobble) * 14) * smooth(t, T.wobble, T.wobble + .3);
  if (t > T.flee) {   // shoots off up and to the north-east
    const u = t - T.flee, d = V(.55, .62, -.56).normalize();
    p.addScaledVector(d, 40 * u + 120 * u * u + 200 * u * u * u);
    tilt = .35 * smooth(t, T.flee, T.flee + .2);
  }
  return { p, tilt, spin: t * .6 + (t > T.flee ? (t - T.flee) ** 2 * 8 : 0), on: t < T.flee + 1.5 ? 1 : 0 };
}
export const belly = t => saucerAt(t).p.clone().add(V(0, -2.4, 0));

export function makeSaucer(scene) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); scene.add(g);
  const prof = [[0, -2.3], [5.4, -2.3], [6.6, -1.8], [11, -1.2], [16.2, -.5], [18, -.05], [18, .2], [16.5, .75], [11.5, 1.7], [7, 2.35], [0, 2.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const metal = patchCloud(new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: .85, roughness: .28 }));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), metal); hull.castShadow = true; hull.receiveShadow = true; body.add(hull);
  const band = new THREE.Mesh(new THREE.TorusGeometry(17.4, .55, 8, 64), mat('#3a3f48', { metalness: .6, roughness: .4 })); band.rotation.x = Math.PI / 2; band.position.y = .1; band.castShadow = true; body.add(band);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(11.5, .3, 6, 48), mat('#8d949e', { metalness: .7, roughness: .35 })); ring2.rotation.x = Math.PI / 2; ring2.position.y = 1.7; body.add(ring2);
  const domeM = new THREE.MeshStandardMaterial({ color: '#4fb7c2', metalness: .2, roughness: .06, emissive: '#1d6c74', emissiveIntensity: .5, transparent: true, opacity: .92 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeM); dome.position.y = 2.2; dome.castShadow = true; body.add(dome);
  const NL = 20;
  const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(.75, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff' }), NL);
  for (let i = 0; i < NL; i++) { const a = i / NL * Math.PI * 2; M.compose(P.set(Math.cos(a) * 17.9, .15, Math.sin(a) * 17.9), Q.identity(), Sc.set(1, 1, 1)); lights.setMatrixAt(i, M); lights.setColorAt(i, C.setRGB(1, 1, 1)); }
  body.add(lights);
  const bellyM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.2, .4, .25) });
  const bel = new THREE.Mesh(new THREE.CircleGeometry(5.2, 32), bellyM); bel.rotation.x = Math.PI / 2; bel.position.y = -2.35; body.add(bel);
  return {
    g,
    draw(t, beamOn) {
      const s = saucerAt(t);
      g.position.copy(s.p); g.visible = !!s.on;
      g.rotation.set(s.tilt, 0, s.tilt * .6); body.rotation.y = s.spin;
      const pc = PC(t), hurt = t > T.hit ? 1 : 0;
      for (let i = 0; i < NL; i++) {
        const k = (i + Math.floor(pc * 10)) % 4;
        let r = 3.2, gr = 2.4, b = .9; if (k === 1) { r = 3.4; gr = .9; b = .4; } if (k === 3) { r = .7; gr = 3.2; b = 1.4; }
        let on = 1;
        if (hurt) on = hash(i * 13.1 + Math.floor(pc * 18) * 7.7) < (t > T.flee ? .9 : .45) ? 1 : .05;
        lights.setColorAt(i, C.setRGB(r * on, gr * on, b * on));
      }
      lights.instanceColor.needsUpdate = true;
      bellyM.color.setRGB(.25 + 1.6 * beamOn, .4 + 3.4 * beamOn, .3 + 1.6 * beamOn);
      domeM.emissiveIntensity = .5 + .4 * Math.sin(t * 3);
    },
  };
}

// —— The tractor beam: a soft additive cone from the saucer's belly to a target, with rings rising ——
const BEAM_SH = {
  uniforms: { uOn: { value: 0 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying float vF; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.);
    vec3 n = normalize(normalMatrix * normal); vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec2 vUv; varying float vF; uniform float uOn, uTime;
    void main(){ float rings = .55 + .45 * smoothstep(.2, .9, sin(vUv.y * 34. - uTime * 9.));
      float a = uOn * pow(vF, 1.6) * rings * (.35 + .65 * vUv.y) * .55;
      gl_FragColor = vec4(vec3(.45, 1., .55) * a, a); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
};
// beam target over time (null = off)
export function beamAt(t) {
  const swing = (a, b, t0, t1) => a.clone().lerp(b, eio(seg(t, t0, t1)));
  if (t >= T.beam1 && t < T.beam2) return { tgt: CAR0, on: smooth(t, T.beam1, T.beam1 + .15) };
  if (t >= T.beam2 && t < T.beam3) return { tgt: swing(CAR0, PALM0, T.beam2 - .1, T.beam2 + .25), on: 1 };
  if (t >= T.beam3 && t < T.beamOff + .25) return { tgt: swing(PALM0, BOAT0, T.beam3 - .1, T.beam3 + .25), on: 1 - smooth(t, T.beamOff, T.beamOff + .25) };
  if (t >= T.fizzle - .1 && t < T.land3 + .25) {   // the beam stutters as it lets go
    const tg = t < T.drop2 ? CAR0 : t < T.drop3 ? PALM0 : BOAT0;
    return { tgt: tg, on: (hash(Math.floor(t * 16) * 3.3) < .65 ? .8 : .1) * (1 - smooth(t, T.land3, T.land3 + .25)) };
  }
  return null;
}
export function makeBeam(scene) {
  const geo = new THREE.CylinderGeometry(.55, 1, 1, 40, 1, true); geo.translate(0, -.5, 0);   // apex (top) at 0, base at -1
  const m = new THREE.ShaderMaterial(BEAM_SH);
  const cone = new THREE.Mesh(geo, m); cone.frustumCulled = false; cone.renderOrder = 4; scene.add(cone);
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.4, .6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), glowM); glow.renderOrder = 4; scene.add(glow);
  const up = V(0, 1, 0);
  return {
    draw(t) {
      const b = beamAt(t);
      if (!b || b.on <= .001) { cone.visible = glow.visible = false; return 0; }
      cone.visible = glow.visible = true;
      const a = belly(t), tg = b.tgt.clone(); tg.y += .2;
      const d = a.clone().sub(tg), L = d.length();
      cone.position.copy(a); cone.quaternion.setFromUnitVectors(up, d.normalize()); cone.scale.set(8.5, L, 8.5);
      m.uniforms.uOn.value = b.on; m.uniforms.uTime.value = PC(t);
      glow.position.set(tg.x, Math.max(tg.y, 0) + .25, tg.z); glow.scale.setScalar(8.5); glowM.opacity = .35 * b.on;
      return b.on;
    },
  };
}

// —— The three things it takes (and gives back) ——
function liftPose(t, base, t0, t1, tDrop, tLand, yaw0, spinK = 1) {
  // returns { p, rotY, rotX, scale, vis }
  if (t < t0) return { p: base.clone(), rotY: yaw0, rotX: 0, scale: 1, vis: true };
  if (t < t1) {
    const u = seg(t, t0, t1), e = ei(u) * .85 + u * .15, top = belly(t);
    const p = base.clone().lerp(top, e); p.y = lerp(base.y, top.y - 1, e) + Math.sin(u * 9) * .3;
    return { p, rotY: yaw0 + spinK * 7 * u * u, rotX: .3 * Math.sin(u * 5), scale: 1 - .7 * smooth(u, .75, 1), vis: u < .98 };
  }
  if (t < tDrop) return { vis: false };
  if (t < tLand) {   // falls from the belly under gravity, unwinding its spin
    const u = seg(t, tDrop, tLand), top = belly(tDrop);
    const p = top.clone().lerp(base, u); p.y = lerp(top.y - 1, base.y, u * u);
    return { p, rotY: yaw0 + spinK * 1.5 * (1 - u) ** 2, rotX: .15 * (1 - u), scale: lerp(.6, 1, smooth(u, 0, .4)), vis: true };
  }
  const u = t - tLand, bounce = Math.abs(Math.sin(u * 9)) * Math.exp(-u * 6) * 1.4;
  const sq = 1 - .18 * Math.exp(-u * 10) * Math.cos(u * 18);
  return { p: base.clone().add(V(0, bounce, 0)), rotY: yaw0, rotX: 0, scale: 1, sqY: sq, vis: true };
}
export function makeLoot(scene) {
  // the car: teal, a little bigger than the traffic so it reads
  const car = new THREE.Group(), ci = new THREE.Group(); car.add(ci); ci.scale.setScalar(1.2);
  const teal = mat('#22a3b5', { roughness: .3, metalness: .15 }), glass = mat('#0f1218', { roughness: .12, metalness: .5 });
  box(1.9, 1.0, 4.4, teal, 0, .85, 0, ci); box(1.7, .72, 2.3, glass, 0, 1.71, -.25, ci); box(1.6, .08, 2.0, teal, 0, 2.1, -.3, ci);
  for (const [x, z] of [[-.95, 1.4], [.95, 1.4], [-.95, -1.4], [.95, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .3, 10), mat('#1d1d1f', { roughness: .8 })); w.rotation.z = Math.PI / 2; w.position.set(x, .38, z); ci.add(w); }
  scene.add(car);
  // the palm: trunk + fronds + root ball
  const palm = new THREE.Group(), ph = 11;
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, ph, 6).translate(0, ph / 2, 0), mat('#8a6d52', { roughness: .9 })); tr.castShadow = true; palm.add(tr);
  const fm = mat('#3f8f2f', { roughness: .8 });
  for (let k = 0; k < 8; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(4.2, .14, 1.0).translate(2.1, 0, 0), fm); f.rotation.set(0, k / 8 * Math.PI * 2, -.35 - (k % 2) * .25, 'YXZ'); f.position.y = ph; f.castShadow = true; palm.add(f); }
  const root = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8).scale(1, .6, 1), mat('#7a5a3a', { roughness: 1 })); root.position.y = -.2; palm.add(root);
  scene.add(palm);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20).rotateX(-Math.PI / 2), mat('#5a4330', { roughness: 1 })); hole.position.set(PALM0.x, .15, PALM0.z); hole.receiveShadow = true; scene.add(hole);
  // the sailboat
  const boat = new THREE.Group(), bi = new THREE.Group(); boat.add(bi); bi.scale.setScalar(.85);
  const hs = new THREE.Shape(); hs.moveTo(-6, -1.6); hs.lineTo(3, -1.6); hs.quadraticCurveTo(6.2, -1.2, 6.8, 0); hs.quadraticCurveTo(6.2, 1.2, 3, 1.6); hs.lineTo(-6, 1.6); hs.lineTo(-6, -1.6);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 1.5, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -.6, 0);
  const hull = new THREE.Mesh(hg, mat('#f6f6f2', { roughness: .4 })); hull.castShadow = true; bi.add(hull);
  box(12.4, .2, 3.25, mat('#c23b2b'), .2, .1, 0, bi);
  box(3.4, .9, 2.0, mat('#f6f6f2'), -1.4, 1.4, 0, bi);
  box(.22, 15, .22, mat('#d9d9d9', { metalness: .5 }), .8, 8.4, 0, bi);
  const ss1 = new THREE.Shape(); ss1.moveTo(0, 0); ss1.lineTo(-5.6, 0); ss1.lineTo(0, 13); ss1.lineTo(0, 0);
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(ss1), mat('#fbfaf5', { side: THREE.DoubleSide, roughness: .7 })); sail.position.set(.7, 1.6, .1); sail.rotation.y = .25; sail.castShadow = true; bi.add(sail);
  scene.add(boat);
  const put = (o, s, sy = 1) => { if (!s.vis) { o.visible = false; return; } o.visible = true; o.position.copy(s.p); o.rotation.set(s.rotX, s.rotY, 0, 'YXZ'); o.scale.set(s.scale, s.scale * (s.sqY || 1), s.scale); };
  return {
    draw(t) {
      put(car, liftPose(t, CAR0, T.lift1, T.gone1, T.drop1, T.land1, -Math.PI / 2, 1));
      const pp = liftPose(t, PALM0, T.lift2, T.gone2, T.drop2, T.land2, .4, .6); put(palm, pp);
      const bp = liftPose(t, BOAT0.clone().add(V(0, .55, 0)), T.lift3, T.gone3, T.drop3, T.land3, .25, .8);
      if (bp.vis && t < T.lift3 + 1e-3) bp.p.y += Math.sin(Sq(t) * 2) * .1;
      put(boat, bp);
      return { car: car.position, palm: palm.position, boat: boat.position };
    },
  };
}

// —— Engine 9: route, drive, mesh ——
const TRUCK_SCALE = 1.2;
export const EAST_Z = 522.6, SOUTH_X = 117.4;
const route = (() => {
  const P = [];
  const line = (x0, z0, x1, z1, step = 1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 1; i <= n; i++) P.push([lerp(x0, x1, i / n), lerp(z0, z1, i / n)]); };
  const arc = (cx, cz, r, a0, a1, n = 24) => { for (let i = 1; i <= n; i++) { const a = lerp(a0, a1, i / n); P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  P.push([-.2, -41]);
  line(-.2, -41, -.2, -26); line(-.2, -26, -3.2, -4, 1); line(-3.2, -4, -3.2, 250); line(-3.2, 250, -4.6, 272); line(-4.6, 272, -4.6, 455);
  line(-4.6, 455, -5.6, 475); line(-5.6, 475, -5.6, 510);
  const r1 = EAST_Z - 510, c1 = [-5.6 + r1, 510];
  arc(c1[0], c1[1], r1, Math.PI, Math.PI / 2);
  const r2 = 9, c2 = [SOUTH_X - r2, EAST_Z + r2];
  line(c1[0], EAST_Z, c2[0], EAST_Z);
  arc(c2[0], c2[1], r2, -Math.PI / 2, 0);
  const r3 = 7; line(SOUTH_X, c2[1], SOUTH_X, QUAY_LANE - r3);
  arc(SOUTH_X - r3, QUAY_LANE - r3, r3, 0, Math.PI / 2, 14);
  line(SOUTH_X - r3, QUAY_LANE, ENGINE_STOP_X - 10, QUAY_LANE);
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, L };
})();
function routeXY(s) {
  const { P, L } = route; s = clamp(s, 0, L[L.length - 1] - .01);
  let i = 0, j = L.length - 1; while (j - i > 1) { const m = (i + j) >> 1; if (L[m] <= s) i = m; else j = m; }
  const u = (s - L[i]) / (L[j] - L[i] || 1); return [lerp(P[i][0], P[j][0], u), lerp(P[i][1], P[j][1], u)];
}
export function routeAt(s) { const [x, z] = routeXY(s), a = routeXY(s - 2.5), b = routeXY(s + 2.5); return { x, z, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
const sWhere = f => { const { P, L } = route; for (let i = 0; i < P.length; i++) if (f(P[i][0], P[i][1])) return L[i]; return L[L.length - 1]; };
const sStop = sWhere((x, z) => z > QUAY_LANE - .01 && x <= ENGINE_STOP_X);
const sBridge0 = sWhere((x, z) => x > 100 && z > BRIDGE.z0 - 30);
export const truckS = monotone([
  [0, 0], [T.out, 0], [T.out + .5, 8], [17.6, 40], [19.0, 120], [22.6, sBridge0], [24.4, sStop - 10], [T.arrive, sStop], [99, sStop],
]);
export const truckAt = t => { const s = truckS(t), r = routeAt(s); return { ...r, s }; };
export const engineCross = (axis, c) => { for (let t = T.out; t < T.arrive; t += .01) { const p = truckAt(t); if ((axis === 'z' ? p.z : p.x) >= c && (axis === 'z' || p.z > 600)) return t; } return 99; };

export function makeTruck(scene) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.scale.setScalar(TRUCK_SCALE);
  const red = mat('#d0201b', { roughness: .32, metalness: .05 }), white = mat('#f4f1ea', { roughness: .5 }), dark = mat('#14171c', { roughness: .15, metalness: .4 }), grey = mat('#9aa0a6', { roughness: .45, metalness: .5 }), black = mat('#1d1d1f', { roughness: .8 });
  box(2.4, 2.0, 7.4, red, 0, 1.55, -1.2, inner); box(2.42, .22, 7.42, white, 0, 1.55, -1.2, inner);
  box(2.4, 2.45, 2.3, red, 0, 1.78, 3.7, inner); box(2.2, .9, .08, dark, 0, 2.35, 4.86, inner); box(2.43, .7, 1.4, dark, 0, 2.3, 3.75, inner);
  box(2.4, .15, 9.6, mat('#2b2d31'), 0, .5, .05, inner); box(2.3, .12, 7.0, grey, 0, 2.62, -1.3, inner);
  for (const z of [3.6, -2.6, -4.0]) for (const x of [-1.12, 1.12]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .36, 12), black); w.rotation.z = Math.PI / 2; w.position.set(x, .5, z); w.castShadow = true; inner.add(w); }
  const lr = new THREE.MeshStandardMaterial({ color: '#ff2a1a', emissive: '#ff2a1a', emissiveIntensity: 0 }), lb = new THREE.MeshStandardMaterial({ color: '#2a5cff', emissive: '#2a6cff', emissiveIntensity: 0 });
  box(.9, .2, .35, lr, -.55, 3.1, 3.9, inner); box(.9, .2, .35, lb, .55, 3.1, 3.9, inner);
  const turn = new THREE.Group(); turn.position.set(0, 2.75, -3.6); inner.add(turn);
  const tt = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .35, 16), grey); tt.castShadow = true; turn.add(tt);
  const pitch = new THREE.Group(); pitch.position.set(0, .3, 0); turn.add(pitch);
  box(.9, .45, 8.6, mat('#c9ccd0', { metalness: .6, roughness: .35 }), 0, .2, 4.2, pitch);
  const fly = new THREE.Group(); pitch.add(fly);
  box(.66, .36, 8.2, mat('#e2e4e7', { metalness: .6, roughness: .35 }), 0, .45, 4.0, fly);
  const tip = new THREE.Object3D(); tip.position.set(0, .7, 8.2); fly.add(tip);
  box(1.1, .7, .8, red, 0, .55, 8.4, fly);
  const legs = [];
  for (const z of [1.4, -4.6]) for (const sx of [-1, 1]) { const l = box(.3, .3, .5, grey, sx * 1.1, .7, z, inner); l.userData.sx = sx; legs.push(l); }
  scene.add(g);
  return { g, inner, turn, pitch, fly, tip, lr, lb, legs };
}
export function makeDoor(scene) { const d = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1, .3), mat('#b8322a', { roughness: .5 })); d.castShadow = true; scene.add(d); return d; }

// —— Fireboats: red hulls, white wheelhouse, a monitor on the bow; wakes behind them ——
export function fireboatAt(i, t) {
  const b = FIREBOATS[i], u = eo(seg(t, T.boats0 + b.ph * .4, T.arrive + .3));
  const p = b.from.clone().lerp(b.to, u), d = b.to.clone().sub(b.from);
  const yaw = Math.atan2(d.x, d.z);
  p.y += Math.sin(Sq(t) * 2.4 + b.ph) * .12;
  return { p, yaw, moving: u > 0 && u < .995 ? 1 - u * u : 0, u };
}
export function makeFireboats(scene) {
  const red = mat('#d0261e', { roughness: .4 }), white = mat('#f4f2ec', { roughness: .5 }), dark = mat('#1b2028', { roughness: .2, metalness: .3 });
  const boats = FIREBOATS.map(() => {
    const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.2);
    box(3.6, 1.6, 10, red, 0, .3, 0, i); box(3.3, .25, 9.6, white, 0, 1.15, 0, i);
    box(2.6, 1.8, 3.2, white, 0, 2.2, -1.2, i); box(2.65, .5, 3.25, dark, 0, 2.7, -1.2, i);
    box(.5, 1.6, .5, red, 0, 2.0, 3.2, i);
    const tip = new THREE.Object3D(); tip.position.set(0, 3.0, 3.4); i.add(tip);
    scene.add(g); return { g, tip };
  });
  const wake = makeSprites(scene, 3 * 70, dotTex(), { additive: false });
  return {
    tips: [V(), V(), V()],
    draw(t) {
      boats.forEach((b, k) => {
        const s = fireboatAt(k, t), vis = t >= T.boats0 - .1;
        b.g.visible = vis; b.g.position.copy(s.p); b.g.rotation.set(0, s.yaw, Math.sin(Sq(t) * 1.9 + k) * .03);
        b.g.updateMatrixWorld(true); b.tip.getWorldPosition(this.tips[k]);
        const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
        for (let j = 0; j < 70; j++) {
          const i = k * 70 + j;
          if (!vis || s.moving <= 0) { wake.hide(i); continue; }
          const a = (j / 70 + Sq(t) * .9) % 1, back = 2 + a * 34, side = (j % 2 ? 1 : -1) * (1.6 + a * 7);
          wake.set(i, s.p.x - fx * back + fz * side * (hash(j) * .4 + .8), -.75, s.p.z - fz * back - fx * side * (hash(j) * .4 + .8), 2.2 + a * 3, 2.2 + a * 3, .96, .98, 1, .7 * (1 - a) * s.moving);
        }
      });
    },
    finish(cam, fog) { wake.commit(fog); },
  };
}

// —— Water: jets from the ladder and the three monitors to the saucer's rim, spray where they hit ——
export function rimPoint(t, from) {   // nearest point on the rim toward a nozzle
  const s = saucerAt(t).p, d = V(from.x - s.x, 0, from.z - s.z).normalize();
  return s.clone().addScaledVector(d, 15.5).add(V(0, -.6, 0));
}
export function makeWater(scene) {
  const NS_ = 4, PER = 150, SPR = 40, N = NS_ * (PER + SPR);
  const sp = makeSprites(scene, N, dotTex(), { additive: false });
  return {
    draw(t, nozzles) {
      const pc = PC(t);
      nozzles.forEach((nz, k) => {
        const t0 = k === 0 ? T.water : T.arcs + k * .12;
        const on = t >= t0 && t < T.waterOff + .6;
        const grow = clamp((PC(t) - PC(t0)) / .45), fade = 1 - seg(t, T.waterOff, T.waterOff + .6);
        const tgt = rimPoint(t, nz), arc = k === 0 ? 4 : 9;
        for (let j = 0; j < PER + SPR; j++) {
          const i = k * (PER + SPR) + j;
          if (!on) { sp.hide(i); continue; }
          if (j < PER) {
            let u = ((j / PER) + pc * 1.3 + k * .17) % 1; u *= grow;
            P.copy(nz).lerp(tgt, u); P.y += Math.sin(u * Math.PI) * arc;
            const s2 = u * u * 1.6; P.x += (hash(j * 3.1 + k) - .5) * s2; P.z += (hash(j * 7.7 + k) - .5) * s2; P.y += (hash(j * 5.3 + k) - .5) * s2 * .6;
            const r = .7 + u * 1.5; sp.set(i, P.x, P.y, P.z, r, r, .95, .98, 1, .9 * fade);
          } else {
            const a = (((j - PER) / SPR) + pc * 1.1) % 1;
            P.copy(tgt); P.x += (hash(j * 2.3 + k * 9) - .5) * 12 * a; P.z += (hash(j * 4.1 + k * 5) - .5) * 12 * a; P.y += (hash(j * 1.7 + k) - .4) * 7 * a - a * a * 6;
            const r = 1.4 + a * 3.4; sp.set(i, P.x, P.y, P.z, r, r, .93, .96, 1, .55 * (1 - a) * (grow >= 1 ? 1 : 0) * fade);
          }
        }
      });
    },
    finish(cam, fog) { sp.sortBy(cam); sp.commit(fog); },
  };
}

// —— Sparks (additive, from the hit) and smoke puffs (from the hurt saucer) ——
export function makeSparks(scene) {
  const N = 260, rnd = mulberry(8);
  const S2 = Array.from({ length: N }, () => ({ tb: rnd(), a: rnd() * Math.PI * 2, v: 8 + rnd() * 16, up: rnd() * 10 - 2, life: .35 + rnd() * .45, k: rnd() }));
  const sp = makeSprites(scene, N, dotTex(), { additive: true });
  const puffs = makeSprites(scene, 70, puffTex(), { additive: false });
  return {
    draw(t) {
      const pc = PC(t), h0 = PC(T.hit), h1 = PC(T.flee);
      for (let i = 0; i < N; i++) {
        const s = S2[i];
        // a big burst at the hit, then crackle until it flees
        const tb = i < 110 ? h0 + s.tb * .06 : h0 + .2 + s.tb * (h1 - h0 - .2);
        const age = pc - tb;
        if (age < 0 || age > s.life || t > T.flee + .3) { sp.hide(i); continue; }
        const sau = saucerAt(t).p, ang = s.a, rr = 16.5;
        P.set(sau.x + Math.cos(ang) * rr, sau.y - .2, sau.z + Math.sin(ang) * rr);
        if (i < 110) { const fr = V(ENGINE_STOP_X, 0, QUAY_LANE).sub(sau).setY(0).normalize(); P.set(sau.x + fr.x * rr + Math.cos(ang) * 3, sau.y - .4, sau.z + fr.z * rr + Math.sin(ang) * 3); }
        P.x += Math.cos(ang) * s.v * age; P.z += Math.sin(ang) * s.v * age; P.y += s.up * age - 14 * age * age;
        const f = 1 - age / s.life, r = (i < 110 ? 2.6 : 1.6) * (.6 + f * .6);
        sp.set(i, P.x, P.y, P.z, r, r, 3.2 * f + .4, 2.0 * f * f + .2, .7 * f * f, f);
      }
      for (let i = 0; i < 70; i++) {
        const tb = PC(T.hit + .15) + (i / 70) * (PC(T.flee + .4) - PC(T.hit + .15)), age = pc - tb, L = 3.2;
        if (age < 0 || age > L) { puffs.hide(i); continue; }
        const src = saucerAt(clamp(t - age, 0, 99)).p, a = hash(i * 1.9) * 6.28;
        const x = src.x + Math.cos(a) * 15 + age * 3, y = src.y + 1 + age * 3.2, z = src.z + Math.sin(a) * 15 - age * 1.5;
        const r = 3 + age * 3.2, al = .7 * smooth(age, 0, .3) * (1 - smooth(age, L * .5, L));
        puffs.set(i, x, y, z, r, r, .32, .33, .36, al, hash(i) * 6.28);
      }
    },
    finish(cam, fog) { sp.commit(fog); puffs.sortBy(cam); puffs.commit(fog); },
  };
}

// —— People: walkers on the pavements; a crowd on the quay that flees from the beam and comes back to cheer; the engine crew ——
export function makePeople(scene) {
  const rnd = mulberry(12), walkers = [], quay = [];
  for (let i = 0; i < 460; i++) {
    const side = rnd() < .5 ? -1 : 1;
    if (rnd() < .42) { const z = lerp(-20, 625, rnd()), hw = z > BLVD.z0 && z < BLVD.z1 ? BLVD.h : 7; walkers.push({ axis: 'z', c: side * (hw + 1.4 + rnd() * 1.2), p0: z, v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -20, hi: 625 }); }
    else { const e = EW[Math.floor(rnd() * EW.length)]; walkers.push({ axis: 'x', c: e.z + side * (e.h + 1.4 + rnd() * 1.2), p0: lerp(-400, 400, rnd()), v: (rnd() < .5 ? 1 : -1) * (1.1 + rnd() * .6), lo: -460, hi: 460 }); }
  }
  for (let i = 0; i < 90; i++) {
    const x = -70 + rnd() * 150, z = 755 + rnd() * 34;
    const d = V(x - 10, 0, z - 765); const dist = d.length() || 1; d.normalize();
    const far = V(x, 0, z).addScaledVector(d, 70 + rnd() * 40); far.z = clamp(far.z, 755, 789);
    const cheer = V(ENGINE_STOP_X - 26 + rnd() * 40, 0, 755 + rnd() * 14);
    quay.push({ x, z, far, cheer, ph: rnd() * 10, v: (rnd() - .5) * 2, delay: dist / 140 + rnd() * .3 });
  }
  const crew = [[-3.2, -2], [3.0, -1.0], [3.2, -4.4], [-2.8, 2.4], [-5.5, -5]];
  const n = walkers.length + quay.length + crew.length;
  const g = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(g, patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), n); m.castShadow = true;
  const PCOL = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  for (let i = 0; i < n; i++) m.setColorAt(i, C.set(i >= walkers.length + quay.length ? '#e9b82c' : PCOL[Math.floor(rnd() * PCOL.length)]));
  const helmets = new THREE.InstancedMesh(new THREE.SphereGeometry(.26, 8, 6).translate(0, 1.45, 0), new THREE.MeshStandardMaterial({ color: '#c8201a', roughness: .4 }), crew.length);
  scene.add(m, helmets);
  return {
    draw(t, truck) {
      const s = Sq(t); let k = 0;
      for (const w of walkers) {
        const span = w.hi - w.lo; let u = (w.p0 - w.lo + w.v * s * 3) % span; if (u < 0) u += span; const p = w.lo + u;
        M.compose(P.set(w.axis === 'z' ? w.c : p, .12, w.axis === 'z' ? p : w.c), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(k++, M);
      }
      for (const c of quay) {
        const stroll = V(c.x + Math.sin(s * .4 + c.ph) * 3 + c.v * Math.min(s, 8), 0, c.z);
        const run = eio(seg(t, T.beam1 + c.delay, T.beam1 + c.delay + 1.6)), back = eio(seg(t, 34.2 + c.delay * .5, 37.0 + c.delay * .5));
        P.copy(stroll).lerp(c.far, run).lerp(c.cheer, back);
        const jump = t > 36.0 ? Math.abs(Math.sin(s * 9 + c.ph)) * .7 * smooth(t, 36, 36.6) : 0;
        P.y = .1 + jump;
        M.compose(P, Q.identity(), Sc.set(1.05, 1.05, 1.05)); m.setMatrixAt(k++, M);
      }
      const on = t >= T.outrig;
      crew.forEach(([dx, dz], i) => {
        const wx = truck.x + dx * Math.cos(truck.yaw) + dz * Math.sin(truck.yaw), wz = truck.z - dx * Math.sin(truck.yaw) + dz * Math.cos(truck.yaw);
        M.compose(P.set(wx, on ? .1 : -50, wz), Q.identity(), Sc.set(1.08, 1.08, 1.08)); m.setMatrixAt(k++, M); helmets.setMatrixAt(i, M);
      });
      m.count = k; m.instanceMatrix.needsUpdate = true; helmets.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— Cars (instanced) and ambient traffic that keeps out of the engine's way ——
const CAR_COLS = ['#f4f4f2', '#f4f4f2', '#c9ccd0', '#2a2d33', '#2f63b5', '#e4b324', '#3f8f5b', '#e9e4d8', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#f08c3a', '#a83a2f'];
export function makeCars(scene, n) {
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  const roof = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, .08, 2.0).translate(0, 2.1, -.3), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const shad = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.3, 4.9).rotateX(-Math.PI / 2).translate(0, .05, 0), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false }), n);
  for (const m of [body, cab, roof]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  scene.add(shad);
  const rnd = mulberry(31);
  for (let i = 0; i < n; i++) { C.set(CAR_COLS[Math.floor(rnd() * CAR_COLS.length)]); body.setColorAt(i, C); roof.setColorAt(i, C); }
  let k = 0;
  return {
    begin() { k = 0; },
    put(x, y, z, yaw, sc = 1, len = 1) {
      if (k >= n) return;
      Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y, z), Q, Sc.set(sc, sc, sc * len));
      body.setMatrixAt(k, M); cab.setMatrixAt(k, M); roof.setMatrixAt(k, M); shad.setMatrixAt(k, M); k++;
    },
    end() { for (const m of [body, cab, roof, shad]) { m.count = k; m.instanceMatrix.needsUpdate = true; } },
  };
}
export function makeAmbient() {
  const rnd = mulberry(5), lanes = [];
  const c120 = engineCross('z', 120), c260 = engineCross('z', 260), c630 = engineCross('z', 630);
  const avoid = [
    { axis: 'x', lo: -12, hi: 6, t0: c120 - .9, t1: c120 + .6, z: 120 },
    { axis: 'x', lo: -12, hi: 6, t0: c260 - .9, t1: c260 + .6, z: 260 },
    { axis: 'x', lo: 106, hi: 130, t0: c630 - .9, t1: c630 + .6, z: 630 },
  ];
  for (const e of EW) for (const dir of [1, -1]) {
    if (e.z === 520 && dir === 1) continue;   // the engine's own lane
    lanes.push({ axis: 'x', c: e.z + dir * (e.h - 2.6), dir, v: 11 + rnd() * 3, x0: EXT.x0 - 60, x1: EXT.x1 + 60, gap: [14, 40] });
  }
  for (const s of NS) {
    if (s.x === 0) continue;
    for (const dir of [1, -1]) {
      if (s.x === 120 && dir === 1) continue;
      lanes.push({ axis: 'z', c: s.x - dir * (s.h - 2.6), dir, v: 10 + rnd() * 3, x0: EXT.z0 - 60, x1: 625, gap: [16, 46] });
    }
  }
  // the boulevard's outer lanes (the engine uses the inner one)
  for (const dir of [1, -1]) lanes.push({ axis: 'z', c: -dir * 9.2, dir, v: 12, x0: BLVD.z0 + 4, x1: BLVD.z1 - 2, gap: [12, 30] });
  for (const L of lanes) {
    L.cars = []; const len = L.x1 - L.x0;
    for (let s = rnd() * 20; s < len; s += L.gap[0] + rnd() * (L.gap[1] - L.gap[0])) L.cars.push({ s0: s, sc: rnd() < .08 ? 1.12 : 1, len: rnd() < .06 ? 2.4 : 1 });
    L.cars = L.cars.filter(c => {
      for (const a of avoid) {
        if (a.axis !== L.axis || Math.abs(L.c - a.z) > 8) continue;
        for (let t = a.t0; t <= a.t1; t += 1 / 24) { const p = posOf(L, c, Sq(t)); if (p > a.lo - 3 && p < a.hi + 3) return false; }
      }
      return true;
    });
  }
  function posOf(L, c, s) { const len = L.x1 - L.x0; let u = (c.s0 + L.v * s * 3) % len; if (u < 0) u += len; return L.dir > 0 ? L.x0 + u : L.x1 - u; }
  return {
    draw(cars3, t) {
      const s = Sq(t);
      for (const L of lanes) for (const c of L.cars) {
        const p = posOf(L, c, s);
        if (L.axis === 'x') cars3.put(p, 0, L.c, L.dir > 0 ? Math.PI / 2 : -Math.PI / 2, c.sc, c.len);
        else cars3.put(L.c, 0, p, L.dir > 0 ? 0 : Math.PI, c.sc, c.len);
      }
      // parked along the quay road's kerb (west of the loot car, east of the engine stop)
      for (const x of [-60, -42, -24, 30, 92, 104]) cars3.put(x, 0, 741.6, Math.PI / 2);
    },
  };
}

// —— The drawbridge, down and open to traffic; moored boats ——
export function makeBridge(scene) {
  const deck = mat('#5b5f66', { roughness: .8 }), rail = mat('#f2efe8');
  const L = (BRIDGE.hinge1 - BRIDGE.hinge0) / 2 + .2, W = BRIDGE.x1 - BRIDGE.x0 + 1.2;
  for (const [hz, dir] of [[BRIDGE.hinge0, 1], [BRIDGE.hinge1, -1]]) {
    const piv = new THREE.Group(); piv.position.set((BRIDGE.x0 + BRIDGE.x1) / 2, 0, hz); scene.add(piv);
    box(W, .7, L, deck, 0, -.35, dir * L / 2, piv); box(W - .4, .04, .25, mat('#e9b93a'), 0, .02, dir * L / 2, piv);
    for (const sx of [-1, 1]) box(.25, 1.1, L, rail, sx * (W / 2 - .15), .55, dir * L / 2, piv);
  }
}
export function makeMoored(scene) {
  const moor = [], rnd = mulberry(4);
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Group(); const L2 = 5 + rnd() * 4;
    box(L2, 1.0, 2.0, mat(['#f6f6f2', '#e9e4d8', '#3a6fb0', '#d74b3a', '#f2c94c'][Math.floor(rnd() * 5)], { roughness: .4 }), 0, .1, 0, b);
    box(L2 * .35, .8, 1.5, mat('#f6f6f2'), -L2 * .1, .9, 0, b);
    b.position.set(-330 + i * 44 + rnd() * 10, -.6, QUAY.edge + 4 + rnd() * 6); b.rotation.y = Math.PI / 2 + (rnd() - .5) * .2;
    if (Math.abs(b.position.x - BOAT0.x) < 14) continue; scene.add(b); moor.push(b);
  }
  return { draw(t) { const s = Sq(t); moor.forEach((b, i) => { b.position.y = -.6 + Math.sin(s * 2 + i) * .08; }); } };
}
