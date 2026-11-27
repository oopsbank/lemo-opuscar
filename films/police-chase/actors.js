// Police Chase — the red race car, three police cars, the drawbridge (raised by the police), the ferry, people on the
// zebra crossing who jump clear, the fruit crates that fly, the thief with his hands up, the officers, tyre smoke
import * as THREE from 'three';
import { patchCloud, BRIDGE, CANAL, QUAY } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';
import { makeSprites, puffTex } from './sprites.js';
import { BR, CROSS, FERRY, PATH, pose, dist, T_STOP, T_CROSS, T_TURN1, ARR, skid } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export const mat = (color, o = {}) => patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o }));
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const wheel = (g, x, z, r = .42, w = .34) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), mat('#18191b', { roughness: .8 })); m.rotation.z = Math.PI / 2; m.position.set(x, r, z); m.castShadow = true; g.add(m); return m; };
export const EXCL = [];
export const COL = { thief: '#e0241b', police: '#1d4fd8' };

// static geometry merged into the world
export function extraGeometry(b) {
  // the zebra crossing on the market street (stripes across the road), with a fruit stall on the north-east corner
  for (let z = 512.6; z < 527.6; z += 1.25) b.gMark.flat(CROSS.x - 2.2, CROSS.x + 2.2, z, z + .65, .045, '#f6f4ee');
  // the bridge's south barrier posts and the bridge keeper's hut
  b.gFlat.box(BRIDGE.x0 - .9, BRIDGE.x0 - .5, 0, 1.4, BRIDGE.z1 - .6, BRIDGE.z1 - .2, '#c7302a', '#c7302a');
  b.gFlat.box(BRIDGE.x1 + .5, BRIDGE.x1 + .9, 0, 1.4, BRIDGE.z1 - .6, BRIDGE.z1 - .2, '#c7302a', '#c7302a');
  // the ferry terminal: a ramp and a pavilion on the quay
  b.gBld.box(FERRY.x - 30, FERRY.x - 6, 0, 4.2, QUAY.road1 + 6, QUAY.road1 + 16, '#f3efe6', '#2f6fd0', { facade: true, wp: [4, 4.2, 2000 + 12] });
  b.gFlat.box(FERRY.x + 2, FERRY.x + 10, -.6, .2, QUAY.edge - 2, QUAY.edge + 7, '#8d9399', '#8d9399');
}

function plateTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256); g.fillStyle = fg; g.font = '900 150px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(256, 136); const w = g.measureText(text).width; g.scale(Math.min(1, 470 / w), 1); g.fillText(text, 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// —— the race car: low, bright red, white stripes, black canopy, rear wing ——
export function makeRaceCar(scene) {
  const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.25);
  const red = mat('#e0241b', { roughness: .25, metalness: .2 }), wht = mat('#f7f5ef', { roughness: .3 }), blk = mat('#121417', { roughness: .1, metalness: .5 });
  box(2.0, .55, 4.6, red, 0, .55, 0, i);                 // body
  box(1.7, .32, 1.6, red, 0, .9, 1.55, i).rotation.x = .12;   // nose
  box(1.5, .45, 1.6, blk, 0, 1.05, -.2, i);              // canopy
  for (const sx of [-.28, .28]) box(.22, .02, 4.62, wht, sx, .84, 0, i);   // stripes
  box(2.1, .1, .6, red, 0, 1.38, -2.05, i); for (const sx of [-.8, .8]) box(.1, .55, .3, blk, sx, 1.08, -2.05, i);   // wing
  const wh = []; for (const [x, z] of [[-1.02, 1.45], [1.02, 1.45], [-1.04, -1.4], [1.04, -1.4]]) wh.push(wheel(i, x, z, .44, .4));
  for (const sx of [-.65, .65]) box(.36, .16, .05, glow(2.8, 2.6, 2.0), sx, .7, 2.32, i);
  for (const sx of [-.7, .7]) box(.4, .14, .05, glow(3.2, .3, .2), sx, .72, -2.32, i);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  return {
    g,
    draw(t, s) { const p = pose('thief', s); g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw; g.rotation.z = clamp(-skid(s) * .06, 0, .06); const roll = dist('thief', s) / .55; wh.forEach(w => { w.rotation.x = roll; }); },
    pos: s => { const p = pose('thief', s); return V(p.x, 1, p.z); },
  };
}

// —— police cars: white with a bold blue lower half, POLICE on the roof, red/blue light bar ——
export function makePolice(scene) {
  const out = {};
  for (const k of ['p1', 'p2', 'p3']) {
    const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.2);
    const wht = mat('#f7f7f4', { roughness: .3 }), blue = mat(COL.police, { roughness: .35 }), dark = mat('#14171c', { roughness: .15, metalness: .4 });
    box(2.0, .6, 4.5, blue, 0, .6, 0, i); box(2.02, .3, 4.52, wht, 0, 1.0, 0, i);
    box(1.75, .7, 2.3, wht, 0, 1.5, -.2, i); box(1.6, .5, .06, dark, 0, 1.55, .96, i); box(1.6, .5, .06, dark, 0, 1.55, -1.36, i);
    for (const sx of [-.88, .88]) box(.04, .45, 1.9, dark, sx, 1.55, -.2, i);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshStandardMaterial({ map: plateTex('POLICE', '#1d4fd8', '#ffffff'), roughness: .5 }));
    roof.rotation.set(-Math.PI / 2, 0, Math.PI); roof.position.set(0, 1.86, -.55); i.add(roof);
    const bl = glow(.4, .8, 4), rd = glow(4, .4, .3), off = mat('#30343c');
    const L = box(.7, .22, .32, bl, -.4, 1.97, .3, i), R = box(.7, .22, .32, rd, .4, 1.97, .3, i);
    for (const [x, z] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) wheel(i, x, z);
    for (const sx of [-.65, .65]) box(.36, .16, .05, glow(2.6, 2.4, 1.9), sx, .78, 2.27, i);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    const ph = { p1: 0, p2: 1, p3: 2 }[k];
    out[k] = {
      g,
      draw(t, s) {
        const p = pose(k, s); g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw; g.visible = k !== 'p3' || s > T_STOP - 4.3;
        const f = Math.floor(t * 7 + ph) % 2; L.material = f ? bl : off; R.material = f ? off : rd;
      },
      pos: s => { const p = pose(k, s); return V(p.x, 1, p.z); },
    };
  }
  return out;
}

// —— the drawbridge: the police raise it (it stays up) ——
export const leafAngle = s => s < BR.up0 ? 0 : 1.2 * eio(seg(s, BR.up0, BR.up1));
export const barrier = s => ss(seg(s, BR.barDown - .7, BR.barDown));
export function makeBridge(scene) {
  const deck = mat('#5b5f66', { roughness: .8 }), rail = mat('#f2efe8'), redm = mat('#c7302a');
  const L = (BRIDGE.hinge1 - BRIDGE.hinge0) / 2 + .2, W = BRIDGE.x1 - BRIDGE.x0 + 1.2;
  const mk = (hz, dir) => {
    const piv = new THREE.Group(); piv.position.set((BRIDGE.x0 + BRIDGE.x1) / 2, 0, hz); scene.add(piv);
    box(W, .7, L, deck, 0, -.35, dir * L / 2, piv); box(.25, .04, L, mat('#e9b93a'), 0, .02, dir * L / 2, piv);
    for (const sx of [-1, 1]) box(.25, 1.1, L, rail, sx * (W / 2 - .15), .55, dir * L / 2, piv);
    // a big STOP sign painted on the underside, facing north when raised
    return piv;
  };
  const a = mk(BRIDGE.hinge0, 1), b = mk(BRIDGE.hinge1, -1);
  // a big STOP sign on the north leaf's underside: when it's raised, it faces the oncoming car
  { const sign = new THREE.Mesh(new THREE.PlaneGeometry(W - .6, L * .7), new THREE.MeshStandardMaterial({ map: plateTex('STOP', '#d8342a', '#ffffff'), roughness: .5, side: THREE.DoubleSide }));
    sign.rotation.x = -Math.PI / 2; sign.rotation.z = Math.PI; sign.position.set(0, .07, L / 2); a.add(sign); }
  const arms = [], lamps = [], on = glow(4, .5, .3), off = mat('#5a1a16');
  for (const z of [BRIDGE.z0 + .4, BRIDGE.z1 - .4]) for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(sx < 0 ? BRIDGE.x0 - .7 : BRIDGE.x1 + .7, 1.2, z); scene.add(piv);
    const arm = new THREE.Group(); piv.add(arm);
    for (let i = 0; i < 6; i++) box(1.05, .2, .2, i % 2 ? rail : redm, -sx * (.55 + i * 1.05), 0, 0, arm);
    arms.push({ arm, sx }); lamps.push(box(.55, .55, .25, off, 0, .75, 0, piv));
  }
  return {
    draw(t, s) {
      const th = leafAngle(s); a.rotation.x = -th; b.rotation.x = th;
      const dn = barrier(s); for (const A of arms) A.arm.rotation.z = A.sx * (1 - dn) * 1.35;
      lamps.forEach((l, i) => { l.material = s > BR.bell && (Math.floor(t * 3) + i) % 2 ? on : off; });
    },
  };
}

// —— the ferry: moored south of the bridge; leaves (horn) after the arrest ——
export function makeFerry(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wht = mat('#f7f6f1', { roughness: .4 }), blue = mat('#1f4f9a'), red = mat('#d8342a'), dark = mat('#20242a', { roughness: .2 });
  box(16, 3.2, 58, wht, 0, .6, 0, g); box(16.1, 1.0, 58.1, blue, 0, -.3, 0, g);
  box(14, 3.0, 40, wht, 0, 3.6, -3, g); box(14.05, .9, 40.05, dark, 0, 3.9, -3, g);
  box(11, 2.6, 24, wht, 0, 6.4, -6, g); box(11.05, .8, 24.05, dark, 0, 6.6, -6, g);
  box(3.4, 5, 3.4, red, 0, 9.5, -12, g); box(3.5, .8, 3.5, dark, 0, 11.6, -12, g);
  box(9, 1.6, 5, wht, 0, 8.6, 8, g); box(9.05, .6, 5.05, dark, 0, 8.8, 8, g);   // bridge (wheelhouse)
  const rnd = mulberry(5); const ppl = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .6, 3, 6), mat('#ffffff'), 40);
  for (let k = 0; k < 40; k++) { M.compose(P.set((rnd() - .5) * 12, 5.6, -20 + rnd() * 36), Q.identity(), Sc.set(1, 1, 1)); ppl.setMatrixAt(k, M); ppl.setColorAt(k, C.set(['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#f4f1ea'][k % 5])); }
  g.add(ppl);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return {
    g,
    draw(t, s) {
      const u = Math.max(0, s - ARR.ferry), dz = u * u * .9 + u * 1.2;
      g.position.set(FERRY.x + u * u * .25, -.6 + Math.sin(t * .9) * .08, FERRY.z + 30 + dz); g.rotation.y = Math.PI + u * .03;
    },
    pos: s => g.position.clone(),
  };
}

// —— people on the zebra crossing, who see the race car coming and jump back to the kerbs; the fruit crates ——
export function makeCrossing(scene) {
  const rnd = mulberry(8), R = (a, b) => a + (b - a) * rnd();
  const PC = ['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0', '#8bc6e8', '#f07f2c', '#7a3fc4'];
  const W = [];
  for (let i = 0; i < 7; i++) { const z = R(514, 526), north = z < 520; W.push({ x: CROSS.x + R(-1.6, 1.6), z, to: north ? 509 + R(-1, 0) : 531 + R(0, 1), c: PC[i % PC.length], d: R(0, .25) }); }
  const ppl = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.36, .8, 3, 8).translate(0, .76, 0), mat('#fff', { roughness: .7 }), W.length); ppl.castShadow = true; ppl.frustumCulled = false;
  W.forEach((w, i) => ppl.setColorAt(i, C.set(w.c))); scene.add(ppl);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.3, 10, 8).translate(0, 1.75, 0), mat('#f0c9a4'), W.length); heads.castShadow = true; heads.frustumCulled = false; scene.add(heads);
  // the fruit stall at the north-east corner, crates and a cloud of oranges and apples that fly as he swerves past
  const stall = new THREE.Group(); scene.add(stall); stall.position.set(CROSS.x + 7, 0, 509.5);
  box(4.6, 1.0, 1.8, mat('#9a6b45'), 0, .5, 0, stall); box(5.2, .14, 2.8, mat('#2c9a7a'), 0, 2.6, 0, stall); box(.1, 2.6, .1, mat('#ddd'), -2.4, 1.3, -1.2, stall); box(.1, 2.6, .1, mat('#ddd'), 2.4, 1.3, -1.2, stall);
  const crates = []; for (let k = 0; k < 4; k++) crates.push(box(1.1, .7, .9, mat(['#b9874f', '#a3743f'][k % 2]), -1.6 + k * 1.1, 1.35, .3, stall));
  const NF = 60, fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), mat('#fff', { roughness: .5 }), NF); fruit.castShadow = true; fruit.frustumCulled = false; scene.add(fruit);
  const F = []; for (let k = 0; k < NF; k++) { F.push({ x0: CROSS.x + 5 + R(-1.8, 1.8), z0: 510 + R(-.3, .7), vx: R(-3, 3), vz: R(2, 8), vy: R(3, 7) }); fruit.setColorAt(k, C.set(k % 3 ? '#ff8a1c' : '#e0322a')); }
  const T0 = T_CROSS - .05;   // the moment the car's slipstream and its mirror catch the crates
  return {
    draw(t, s) {
      W.forEach((w, i) => {
        const k = eo(seg(s, T_CROSS - 1.1 + w.d, T_CROSS - .35 + w.d)); const z = lerp(w.z, w.to, k), hop = Math.sin(Math.PI * k) * 1.1;
        Q.setFromEuler(E.set(0, 0, 0)); M.compose(P.set(w.x + Math.sin(t * 2 + i) * .05, hop, z), Q, Sc.set(1, 1, 1)); ppl.setMatrixAt(i, M); heads.setMatrixAt(i, M);
      }); ppl.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
      const u = Math.max(0, s - T0);
      crates.forEach((c, k) => { if (k >= 2) { c.position.set(-1.6 + k * 1.1 + u * 2.5 * (k - 1.5), Math.max(.35, 1.35 + u * 2 - 9 * u * u), .3 + u * 3); c.rotation.set(u * 3, u * 2 * k, u * 4); } });
      F.forEach((f, k) => { const y = Math.max(.2, 1.6 + f.vy * u - 4.9 * u * u), mv = y > .2 ? u : Math.min(u, (f.vy + Math.sqrt(f.vy * f.vy + 4 * 4.9 * 1.4)) / 9.8); M.compose(P.set(f.x0 + f.vx * mv, s < T0 ? -5 : y, f.z0 + f.vz * mv), Q.identity(), Sc.set(1, 1, 1)); fruit.setMatrixAt(k, M); });
      fruit.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— the arrest: the thief (striped shirt) steps out and raises his hands; officers come up to him ——
export function makeArrest(scene) {
  const mk = (body, cap) => {
    const g = new THREE.Group(); scene.add(g);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(.36, .8, 4, 8), body); b.position.y = .78; b.castShadow = true; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), mat('#f0c9a4')); h.position.y = 1.62; h.castShadow = true; g.add(h);
    if (cap) { const c = box(.62, .18, .62, cap, 0, 1.88, 0, g); }
    const arms = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * .42, 1.2, 0); g.add(piv); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .7, 3, 6), b.material); a.position.y = -.43; piv.add(a); arms.push({ piv, sx }); }
    return { g, arms };
  };
  // striped shirt: a canvas texture of black and white bands
  const c = document.createElement('canvas'); c.width = 16; c.height = 64; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#111' : '#f4f4f0'; x.fillRect(0, i * 8, 16, 8); }
  const st = new THREE.CanvasTexture(c); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(1, 1.5);
  const thief = mk(new THREE.MeshStandardMaterial({ map: st, roughness: .7 }), mat('#111'));
  const cops = ['p1', 'p2', 'p3'].map(() => mk(mat('#1b3f9e'), mat('#0d1b3d')));
  return {
    draw(t, s) {
      const car = pose('thief', T_STOP + 1), side = car.yaw - Math.PI / 2;
      const ox = Math.sin(side) * 2.0, oz = Math.cos(side) * 2.0;
      const k = ss(seg(s, ARR.out, ARR.out + .8));
      thief.g.visible = s > ARR.out; thief.g.position.set(car.x + ox * (.4 + .6 * k), 0, car.z + oz * (.4 + .6 * k)); thief.g.rotation.y = car.yaw + 2.6;
      const up = ss(seg(s, ARR.hands, ARR.hands + .5)); thief.arms.forEach(a => { a.piv.rotation.z = a.sx * up * 2.9; });
      ['p1', 'p2', 'p3'].forEach((kk, i) => {
        const p = pose(kk, T_STOP + 6), cp = cops[i]; cp.g.visible = s > ARR.cops + i * .25;
        const target = V(thief.g.position.x + [-1.8, 2.2, -.6][i], 0, thief.g.position.z + [-2.4, -.4, 2.5][i]);
        const from = V(p.x + Math.cos(p.yaw) * 1.6, 0, p.z - Math.sin(p.yaw) * 1.6);
        const w = ss(seg(s, ARR.walk + i * .2, ARR.walk + 2.2 + i * .2)); cp.g.position.copy(from.lerp(target, w)); cp.g.position.y = Math.abs(Math.sin(s * 9 + i)) * .08 * (w > 0 && w < 1 ? 1 : 0);
        cp.g.lookAt(thief.g.position.x, 0, thief.g.position.z);
        cp.arms.forEach(a => { a.piv.rotation.z = a.sx * (i === 0 ? .9 * w : .2); });
      });
    },
    thiefPos: () => thief.g.position.clone(),
  };
}

// —— tyre smoke (corners and the skid) ——
export function makeSmoke(scene) {
  const N = 90, sp = makeSprites(scene, N, puffTex(), {}), puffs = [];
  // emit points along the thief's path where he brakes hard: the two corners and the final skid
  const rnd = mulberry(12);
  for (let k = 0; k < N; k++) { const kind = k % 3; puffs.push({ kind, ph: rnd(), r: .5 + rnd() }); }
  return {
    draw(t, s, camera) {
      puffs.forEach((p, k) => {
        // each puff is born at some chase time during a braking stretch and lives 1.4 s
        const spans = [[T_STOP - 1.4, T_STOP], [T_CROSS + .7, T_CROSS + 1.5], [T_TURN1 - .6, T_TURN1 + .3]];
        const [a, b] = spans[p.kind], born = lerp(a, b, p.ph), age = s - born;
        if (age < 0 || age > 1.6) { sp.hide(k); return; }
        const q = pose('thief', born), back = q.yaw + Math.PI;
        const x = q.x + Math.sin(back) * 2.2 + (p.r - 1) * 1.5, z = q.z + Math.cos(back) * 2.2;
        const sz = 1.2 + age * 3.4, al = .55 * (1 - age / 1.6);
        sp.set(k, x, .6 + age * .9, z, sz, sz, .92, .92, .94, al, p.ph * 6);
      });
      sp.sortBy(camera); sp.commit(scene.fog);
    },
  };
}
