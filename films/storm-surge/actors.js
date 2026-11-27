// Storm Surge — the sea wall and its four flood gates, the storm sea with its surge front, the parked van and the tow truck,
// the fish market and the people leaving the quay, the gate crews, rain, spray, and the yellow cat on the harbour office roof
import * as THREE from 'three';
import { patchCloud, QUAY, CHAN, CANAL, EXT } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';
import { T, DUR, gate, elapsed, reset, CLOCK0 } from './story.js';
import { makeSprites, puffTex, canvasTex, dotTex } from './sprites.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export function mat(color, o = {}) { return patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o })); }
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }

export const WALL = { z0: 789.6, z1: 792, h: 2.6 };
// gaps in the wall: [x0, x1]; hinge side; label
export const GATES = [
  { x0: CHAN.x0, x1: CHAN.x1, kind: 'mitre', name: 'CANAL' },
  { x0: 236, x1: 252, hinge: 'e', name: 'FERRY' },
  { x0: -150, x1: -138, hinge: 'w', name: 'BOATS' },
  { x0: 14, x1: 26, hinge: 'e', name: 'MARKET' },
];
export const gateCentre = i => V((GATES[i].x0 + GATES[i].x1) / 2, 1.2, 790.8);
export const MARKET = { x0: -6, x1: 48, z0: 758, z1: 776 };
export const OFFICE = { x0: 52, x1: 64, z0: 757, z1: 769, h: 7.2 };
export const EXCL = [];

// —— static: the wall (with gaps), the fish market stalls, the harbour office ——
export function wallGeometry(b) {
  const xs = [EXT.x0 - 300, ...GATES.flatMap(g => [g.x0, g.x1]).sort((a, c) => a - c), EXT.x1 + 300];
  for (let i = 0; i < xs.length; i += 2) {
    const x0 = xs[i], x1 = xs[i + 1];
    b.gFlat.box(x0, x1, 0, WALL.h, WALL.z0, WALL.z1, '#c6bfb1', '#e0dace');
    b.gFlat.box(x0, x1, WALL.h, WALL.h + .18, WALL.z0 - .15, WALL.z1 + .1, '#e6e0d3', '#e9e4d8');   // coping
    // gauge stripes on the seaward face every 40 m (white/black depth marks)
    for (let x = Math.ceil(x0 / 40) * 40; x < x1 - 1; x += 40) for (let k = 0; k < 6; k++) b.gFlat.box(x, x + .5, -2.2 + k * .8, -2.2 + k * .8 + .4, WALL.z1, WALL.z1 + .03, k % 2 ? '#1d1f22' : '#f2f0ea', '#f2f0ea');
  }
  // the gate pillars (yellow-black hazard tops) either side of each gap
  for (const g of GATES) for (const x of [g.x0, g.x1]) {
    const s = x === g.x0 ? -1 : 1;
    b.gFlat.box(x + (s < 0 ? -1.2 : 0), x + (s < 0 ? 0 : 1.2), -3.2, WALL.h + .6, WALL.z0 - .6, WALL.z1, '#d8d2c4', '#e9b93a');
  }
  // the fish market: six stalls with striped awnings, crates
  const AW = [['#2f6fd0', '#f4f1ea'], ['#d8342a', '#f4f1ea'], ['#2c9a7a', '#f4f1ea'], ['#e9b93a', '#f4f1ea'], ['#2f6fd0', '#f4f1ea'], ['#d8342a', '#f4f1ea']];
  for (let i = 0; i < 6; i++) {
    const x0 = MARKET.x0 + 2 + i * 8.6, z0 = MARKET.z0 + (i % 2) * 8;
    b.gFlat.box(x0, x0 + 6, 0, 1.0, z0, z0 + 3, '#9b7a55', '#e8e6e0');
    for (let k = 0; k < 6; k++) b.gFlat.box(x0 - .3 + k, x0 + .7 + k, 2.4, 2.6, z0 - .6, z0 + 3.8, AW[i][k % 2], AW[i][k % 2]);
    for (const px of [x0, x0 + 5.8]) b.gFlat.box(px, px + .15, 0, 2.4, z0, z0 + .15, '#ddd', '#ddd');
    b.gFlat.box(x0 + 6.6, x0 + 7.6, 0, .6, z0 + .4, z0 + 1.4, '#3f7fb5', '#7fb3d5'); b.gFlat.box(x0 + 6.6, x0 + 7.6, .6, 1.2, z0 + .5, z0 + 1.5, '#3f7fb5', '#d9d4c7');
  }
  // the harbour office (the cat sleeps on its roof)
  const o = OFFICE;
  b.gBld.box(o.x0, o.x1, 0, o.h, o.z0, o.z1, '#f4efe4', '#d6ccb9', { facade: true, wp: [3, 3.4, 33] });
  b.gBld.box(o.x0, o.x1, o.h, o.h + .45, o.z0, o.z0 + .3, '#f4efe4'); b.gBld.box(o.x0, o.x1, o.h, o.h + .45, o.z1 - .3, o.z1, '#f4efe4');
  b.gBld.box(o.x0, o.x0 + .3, o.h, o.h + .45, o.z0, o.z1, '#f4efe4'); b.gBld.box(o.x1 - .3, o.x1, o.h, o.h + .45, o.z0, o.z1, '#f4efe4');
  b.gBld.cyl(o.x0 + 3, o.z0 + 3, .12, o.h, o.h + 6, '#e8e6e0', 6);   // flag mast
}

// —— the flood gates: red steel leaves on hinges ——
export function makeGates(scene) {
  const red = mat('#c8322a', { roughness: .45, metalness: .25 }), dark = mat('#8a221d', { roughness: .5, metalness: .25 }), white = mat('#f2f0ea'), yel = mat('#e9b93a');
  const leaves = [];
  function leaf(len, dir) {   // dir: +1 leaf extends to +x from the hinge, −1 to −x
    const g = new THREE.Group(); const y0 = -3.2, y1 = WALL.h + .1, h = y1 - y0;
    box(len, h, .7, red, dir * len / 2, y0 + h / 2, 0, g);
    for (let k = 0; k < 5; k++) box(len - .3, .22, .9, dark, dir * len / 2, y0 + 1 + k * 1.15, 0, g);
    box(len, .2, .95, white, dir * len / 2, y1 + .1, 0, g);
    for (let k = 0; k < Math.floor(len / 1.6); k++) box(.8, .21, .97, k % 2 ? yel : mat('#1d1f22'), dir * (.6 + k * 1.6), y1 + .12, 0, g);
    box(.5, h + .4, .5, dark, 0, y0 + h / 2, 0, g);   // hinge post
    scene.add(g); return g;
  }
  // gate 1: the canal mouth, twin mitre leaves meeting in a V toward the sea
  const span = CHAN.x1 - CHAN.x0, alpha = 12 * Math.PI / 180, L = span / 2 / Math.cos(alpha) + .2;
  const gw = leaf(L, 1), ge = leaf(L, -1); gw.position.set(CHAN.x0, 0, WALL.z0 - .2); ge.position.set(CHAN.x1, 0, WALL.z0 - .2);
  leaves.push([gw, u => lerp(Math.PI / 2, -alpha, u)], [ge, u => lerp(-Math.PI / 2, alpha, u)]);
  const single = [];
  for (const i of [1, 2, 3]) {
    const G = GATES[i], len = G.x1 - G.x0, e = G.hinge === 'e';
    const l = leaf(len, e ? -1 : 1); l.position.set(e ? G.x1 : G.x0, 0, (WALL.z0 + WALL.z1) / 2);
    single.push([i, l, e]);
  }
  return {
    draw(t) {
      const u0 = gate(0, t); for (const [g, f] of leaves) g.rotation.y = f(u0);
      for (const [i, l, e] of single) { const u = gate(i, t); l.rotation.y = (e ? -1 : 1) * (1 - u) * Math.PI / 2; }
    },
  };
}

// —— the storm sea: displaced grid, the surge front with a foamy crest, chop, whitecaps ——
export const SEA = { zf: { value: 1500 }, level: { value: -1.7 }, surge: { value: 1.8 }, crest: { value: 1 }, ft: { value: 0 }, storm: { value: 1 } };
export function makeSea(scene) {
  const geo = new THREE.PlaneGeometry(5200, 2700, 130, 560); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, QUAY.edge + 1350);
  const H = `
    uniform float sZf, sLevel, sSurge, sCrest, sT, sStorm;
    float seaH(vec2 p){ float d = p.y - sZf;
      float raised = sSurge * smoothstep(-2., 14., d);
      float crest = sCrest * (1.1 * exp(-pow((d - 5.) / 6., 2.)) - .35 * exp(-pow((d + 6.) / 6., 2.)));
      float far = smoothstep(0., 80., p.y - ${QUAY.edge.toFixed(1)});
      float ch = .26 * sin(.19 * p.y + 1.6 * sT + .021 * p.x) + .16 * sin(.33 * p.y - .09 * p.x + 2.2 * sT) + .09 * sin(.81 * p.y + .47 * p.x + 3.3 * sT) + .05 * sin(1.7 * p.x - .9 * p.y + 4.1 * sT);
      return sLevel + raised + crest + ch * sStorm * (.45 + .55 * far); }`;
  const m = new THREE.MeshStandardMaterial({ color: '#4c6866', roughness: .32, metalness: .08 });
  patchCloud(m, `
    { float d = vWP.z - sZf;
      float fo = (exp(-pow((d - 3.) / 9., 2.)) + .5 * exp(-pow((d - 22.) / 20., 2.))) * sCrest;
      float n1 = c_n(vWP.xz * vec2(.35, .9) + vec2(0., sT * .8)), n2 = c_n(vWP.xz * 1.7 - sT * .6);
      float streak = smoothstep(.55, .8, n1) * smoothstep(0., 30., d) * .55 * sStorm;
      float caps = smoothstep(.74, .86, n2 * .6 + n1 * .4) * sStorm * .8;
      float wallFoam = exp(-(vWP.z - ${QUAY.edge.toFixed(1)}) / 5.) * .9 * sStorm;
      float deep = smoothstep(${QUAY.edge.toFixed(1)}, ${(QUAY.edge + 900).toFixed(1)}, vWP.z);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.19, .29, .32), deep * .6);
      diffuseColor.rgb *= .82 + .3 * n2;
      float f = clamp(fo * (.75 + .5 * n2) + streak + caps + wallFoam * (.6 + .6 * n1), 0., 1.);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.9, .93, .94), f); }`);
  const f = m.onBeforeCompile;
  m.onBeforeCompile = sh => {
    f(sh);
    for (const [k, u] of Object.entries({ sZf: SEA.zf, sLevel: SEA.level, sSurge: SEA.surge, sCrest: SEA.crest, sT: SEA.ft, sStorm: SEA.storm })) sh.uniforms[k] = u;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + H)
      .replace('#include <beginnormal_vertex>', `float _e = .6; float _hx = (seaH(position.xz + vec2(_e, 0.)) - seaH(position.xz - vec2(_e, 0.))) / (2. * _e); float _hz = (seaH(position.xz + vec2(0., _e)) - seaH(position.xz - vec2(0., _e))) / (2. * _e);
        vec3 objectNormal = normalize(vec3(-_hx, 1., -_hz));
        #ifdef USE_TANGENT
        vec3 objectTangent = vec3(tangent.xyz);
        #endif`)
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.y += seaH(position.xz);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float sZf, sCrest, sT, sStorm;');
  };
  m.defines = { NOSNOW: '' };
  const sea = new THREE.Mesh(geo, m); sea.receiveShadow = true; sea.frustumCulled = false; scene.add(sea);
  return sea;
}

// —— the parked van (gate 2) and the tow truck ——
const VAN0 = { x: 244.4, z: 784.2 };
export function makeVanAndTruck(scene) {
  const van = new THREE.Group(), vi = new THREE.Group(); van.add(vi);
  const white = mat('#f4f3ef', { roughness: .35 }), glass = mat('#13171d', { roughness: .1, metalness: .5 }), blue = mat('#2f6fd0'), tyre = mat('#1d1d1f');
  box(2.1, 2.2, 5.4, white, 0, 1.45, 0, vi); box(1.9, .7, .08, glass, 0, 2.0, 2.71, vi); box(2.12, .3, 5.42, blue, 0, 1.15, 0, vi);
  for (const [x, z] of [[-1, 1.7], [1, 1.7], [-1, -1.7], [1, -1.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .28, 10), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, .4, z); vi.add(w); }
  const hazard = new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ffa010', emissiveIntensity: 0 });
  box(.35, .2, .1, hazard, -.8, 1.1, -2.72, vi); box(.35, .2, .1, hazard, .8, 1.1, -2.72, vi);
  scene.add(van);
  const truck = new THREE.Group(), ti = new THREE.Group(); truck.add(ti);
  const yel = mat('#f2a51a', { roughness: .4 }), blk = mat('#24262a');
  box(2.4, 2.4, 2.6, yel, 0, 1.6, 2.4, ti); box(2.2, .8, .08, glass, 0, 2.2, 3.72, ti);   // cab (front = +z local)
  box(2.4, .9, 4.6, blk, 0, .95, -1.2, ti); box(2.3, .3, 4.4, yel, 0, 1.5, -1.2, ti);   // bed
  const boom = new THREE.Group(); boom.position.set(0, 1.7, -2.6); ti.add(boom); box(.4, .4, 3.2, yel, 0, 0, -1.4, boom); boom.rotation.x = -.35;
  const beacon = new THREE.MeshStandardMaterial({ color: '#ff9a10', emissive: '#ff8a00', emissiveIntensity: 0 }); box(1.4, .25, .4, beacon, 0, 2.95, 2.2, ti);
  for (const [x, z] of [[-1.15, 2.6], [1.15, 2.6], [-1.15, -2.2], [1.15, -2.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .32, 10), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, .48, z); ti.add(w); }
  scene.add(truck);
  // the truck: west along the quay road (10.6–11.7), reverse south to the van while turning to face north (11.7–12.7),
  // hook (12.7–13.1), drive north towing (13.1–14.3), turn east and away along the road (14.3–16.5)
  const ROADZ = (QUAY.road0 + QUAY.road1) / 2 + 2.2;
  const hookZ = VAN0.z - 2.7 - 4.6;   // the truck's centre when its tail meets the van's back
  function truckPose(t) {
    if (t < 10.6) return { x: 420, z: ROADZ, yaw: -Math.PI / 2, vis: 0 };
    if (t < 11.7) { const u = eio(seg(t, 10.6, 11.7)); return { x: lerp(330, VAN0.x - 9, u), z: ROADZ, yaw: -Math.PI / 2, vis: 1 }; }
    if (t < 12.7) { const u = eio(seg(t, 11.7, 12.7)); return { x: lerp(VAN0.x - 9, VAN0.x, ss(u)), z: lerp(ROADZ, hookZ, u), yaw: lerp(-Math.PI / 2, -Math.PI, u), vis: 1 }; }
    if (t < 13.1) return { x: VAN0.x, z: hookZ, yaw: -Math.PI, vis: 1 };
    if (t < 14.3) { const u = eio(seg(t, 13.1, 14.3)); return { x: VAN0.x, z: lerp(hookZ, ROADZ + 6, u), yaw: -Math.PI, vis: 1 }; }
    const u = ss(seg(t, 14.3, 16.8)); return { x: lerp(VAN0.x, 470, u * u), z: lerp(ROADZ + 6, ROADZ, ss(seg(t, 14.3, 15.0))), yaw: lerp(-Math.PI, -Math.PI * 1.5, ss(seg(t, 14.3, 14.9))), vis: t < 16.8 ? 1 : 0 };
  }
  return {
    draw(t) {
      const p = truckPose(t), r = reset(t);
      truck.visible = !!p.vis; truck.position.set(p.x, 0, p.z); truck.rotation.y = p.yaw;   // yaw π: cab faces −z (north)
      boom.rotation.x = t > 12.7 && t < 16.8 ? -.15 : -.35;
      beacon.emissiveIntensity = Math.floor(t * 6) % 2 ? 6 : .4;
      // the van is towed behind the truck (its back to the truck's tail) once hooked
      if (t < 13.1) { van.position.set(VAN0.x, 0, VAN0.z); van.rotation.y = 0; }
      else {
        const yaw = truck.rotation.y, tail = V(0, 0, -3.9).applyAxisAngle(V(0, 1, 0), yaw).add(truck.position);
        const back = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), yaw);   // the van trails behind the truck, nose first away from it
        van.position.copy(tail).addScaledVector(back, -3.4).setY(.0); van.rotation.y = yaw + Math.PI;
        if (t > 13.1 && t < 13.3) van.position.y = .15 * Math.sin(seg(t, 13.1, 13.3) * Math.PI);
        van.visible = t < 16.8;
      }
      if (r > 0) { van.visible = r > .5; van.position.set(VAN0.x, 0, VAN0.z); van.rotation.y = 0; }   // back where it was for the loop
      hazard.emissiveIntensity = Math.floor(t * 3) % 2 ? 5 : .3;
    },
    van, truck,
  };
}

// —— people: the market crowd and quay walkers leave north; the gate crews (hi-vis) stay by the hinges ——
export function makePeople(scene) {
  const rnd = mulberry(21), F = [];
  for (let i = 0; i < 110; i++) {
    const nearMkt = i < 70;
    const x = nearMkt ? lerp(MARKET.x0 - 4, MARKET.x1 + 4, rnd()) : lerp(-420, 420, rnd());
    const z = nearMkt ? lerp(MARKET.z0 - 2, MARKET.z1 + 8, rnd()) : lerp(QUAY.road1 + 4, WALL.z0 - 3, rnd());
    F.push({ x, z, ph: rnd() * 9, leave: nearMkt ? 21.6 + rnd() * 2.4 : 2 + rnd() * 18, v: 3.2 + rnd() * 2.2, drift: (rnd() - .5) * .5, c: Math.floor(rnd() * 9) });
  }
  const CREW = [];
  for (const g of GATES) { const hx = g.kind === 'mitre' ? [g.x0 - 3, g.x1 + 3] : g.hinge === 'e' ? [g.x1 + 3, g.x1 + 5] : [g.x0 - 3, g.x0 - 5]; for (const x of hx) CREW.push({ x, z: WALL.z0 - 2.5 - rnd() * 2, ph: rnd() * 6 }); }
  const geo = new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0);
  const m = new THREE.InstancedMesh(geo, patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), F.length + CREW.length); m.castShadow = true; m.frustumCulled = false;
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  F.forEach((f, i) => m.setColorAt(i, C.set(PC[f.c])));
  CREW.forEach((c, i) => m.setColorAt(F.length + i, C.set('#ff7a12')));
  scene.add(m);
  // umbrellas over some walkers
  const um = new THREE.InstancedMesh(new THREE.ConeGeometry(1.0, .4, 10).translate(0, 2.05, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .5 })), F.length); um.castShadow = true; um.frustumCulled = false;
  F.forEach((f, i) => um.setColorAt(i, C.set(PC[(f.c * 4 + 3) % 9]))); scene.add(um);
  return {
    draw(t) {
      const r = reset(t);
      F.forEach((f, i) => {
        const go = Math.max(0, t - f.leave), dz = go * f.v;   // walk north (−z), off the quay, behind the sheds
        let z = f.z - dz * (1 - r), x = f.x + f.drift * dz + Math.sin(t * .8 + f.ph) * .4;
        const vis = z > QUAY.road0 - 30 || r > .6;
        if (r > 0) z = lerp(z, f.z, r);
        const bob = go > 0 && go < 30 ? Math.abs(Math.sin(t * 9 + f.ph)) * .12 : 0;
        M.compose(P.set(x, .1 + bob, z), Q.identity(), Sc.setScalar(vis ? 1 : 0)); m.setMatrixAt(i, M);
        M.compose(P.set(x, .1 + bob, z), Q.identity(), Sc.setScalar(vis && f.c % 3 === 0 ? 1 : 0)); um.setMatrixAt(i, M);
      });
      CREW.forEach((c, k) => { M.compose(P.set(c.x + Math.sin(t * 1.3 + c.ph) * .3, .1, c.z), Q.identity(), Sc.setScalar(1.1)); m.setMatrixAt(F.length + k, M); });
      m.instanceMatrix.needsUpdate = true; um.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— rain: slanted streaks in a volume in front of the camera; splashes ——
export function makeRain(scene) {
  const N = 1000, rnd = mulberry(55), drops = [];
  for (let i = 0; i < N; i++) drops.push([rnd() * 2 - 1, rnd() * 2 - 1, rnd(), rnd()]);
  const streak = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(230,236,245,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(2, 0, 4, h); });
  const sp = makeSprites(scene, N, streak, { additive: false });
  return {
    draw(t, cam, look) {
      const dir = look.clone().sub(cam).normalize(), dist = cam.distanceTo(look);
      const R = clamp(dist * .22, 18, 70), c = cam.clone().addScaledVector(dir, R * 1.25);
      const gust = .28 + .16 * Math.sin(t * 1.3) + .08 * Math.sin(t * 3.7);
      for (let i = 0; i < N; i++) {
        const [u, v, w, k] = drops[i];
        const H = R * 1.6, fall = ((w * H - t * 38) % H + H) % H - H / 2;
        sp.set(i, c.x + u * R + fall * gust * .5, c.y + fall, c.z + v * R, .06 + .05 * (R / 40), 2.2 + R * .03, .85, .9, .97, .42, gust);
      }
      sp.commit(scene.fog);
    },
  };
}

// —— spray: waves bursting on the wall (more as the storm grows), and the big hit at 0:00 ——
export function makeSpray(scene) {
  const N = 1100, sp = makeSprites(scene, N, puffTex(), { additive: false });
  const rnd = mulberry(77), B = [];
  for (let t = 0; t < DUR; t += .05) B.push({ t0: t + rnd() * .05, x: lerp(-480, 480, rnd()), s: .6 + rnd() * .6, life: .7 + rnd() * .5, seed: rnd() * 100 });
  // the big hit: a line along the whole wall near the market, then a few aftershocks
  const HIT = [];
  for (let k = 0; k < 380; k++) HIT.push({ t0: T.impact + rnd() * .25 + (k % 4 === 0 ? 1.1 + rnd() * .6 : 0), x: lerp(-90, 130, rnd()), vy: 9 + rnd() * 11, vz: -(2 + rnd() * 6), size: 4 + rnd() * 6, life: 1.6 + rnd() * 1.2 });
  const BIG = [];
  for (let k = 0; k < 70; k++) BIG.push({ t0: T.impact + rnd() * .2, x: lerp(-460, 460, rnd()), vy: 6 + rnd() * 6, vz: -(1 + rnd() * 3), size: 5 + rnd() * 5, life: 1.6 + rnd() });
  return {
    draw(t, camera, storm) {
      let i = 0; const g = 9.8, r = 1 - reset(t);
      // background bursts: rate and height follow the storm (0 … 1)
      for (const b of B) {
        if (i >= N - 340) break;
        const a = t - b.t0; if (a < 0 || a > b.life) continue;
        if ((b.seed % 1) > storm * .9 || t > T.impact - .2 && t < T.impact + 2) continue;
        const k = a / b.life, hgt = (1.5 + 6 * storm) * b.s;
        for (let j = 0; j < 3 && i < N - 340; j++) {
          const vy = Math.sqrt(2 * g * hgt) * (.7 + .3 * j / 2), y = WALL.h * .4 + vy * a - g * a * a / 2;
          sp.set(i++, b.x + (j - 1) * 1.8, Math.max(-.3, y), WALL.z1 + 1.5 - a * .8 * j, 2.4 + 5 * k * b.s, 2.2 + 4.5 * k * b.s, .92, .94, .95, .55 * (1 - k) * r);
        }
      }
      for (const L of [HIT, BIG]) for (const h of L) {
        const a = t - h.t0; if (a < 0 || a > h.life || i >= N) continue;
        const k = a / h.life, y = 1 + h.vy * a - g * a * a / 2;
        sp.set(i++, h.x, Math.max(.2, y), WALL.z1 + .5 + h.vz * a, h.size * (.6 + 1.2 * k), h.size * (.6 + 1.1 * k), .93, .95, .96, .75 * (1 - k * k) * r);
      }
      for (; i < N; i++) sp.hide(i);
      sp.sortBy(camera); sp.commit(scene.fog);
    },
  };
}

// —— the yellow cat, asleep on the harbour office roof ——
export function makeCat(scene) {
  const g = new THREE.Group(), y = mat('#f2b72e', { roughness: .8 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .7, 4, 8), y); b.rotation.z = Math.PI / 2; b.position.y = .35; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y); h.position.set(.62, .45, 0); g.add(h);
  for (const z of [-.13, .13]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 4), y); e.position.set(.66, .76, z); g.add(e); }
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 5), y); tl.rotation.z = 1.2; tl.position.set(-.75, .3, .1); g.add(tl);
  g.scale.setScalar(1.4); g.position.set(OFFICE.x1 - 3.5, OFFICE.h + .05, OFFICE.z0 + 4); g.rotation.y = 2.2;
  g.traverse(o => { o.castShadow = true; }); scene.add(g);
}
