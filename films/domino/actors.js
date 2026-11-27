// Domino — the chain of toy-town mishaps: pigeon, paint buckets, red sports car, hydrant geyser, scooter rider, tower crane,
// rolling pipes, the pile-up, the ball truck and its rain of balls, falling lamp posts, the bakery sign and the giant cake,
// the police car, the white convertible
import * as THREE from 'three';
import { patchCloud } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry } from '/core/lib.js';
import { makeSprites, puffTex, dotTex } from './sprites.js';
import { T, J, LANE, SCAF, BUCKET, BUCKET2, HYD, CRANE, STACK, RAMP, POSTS, BAKERY, COP, carPose, riderPose, craneYaw, TROLLEY } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export const mat = (color, o = {}) => patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o }));
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }
const cyl = (r, h, m, parent, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); c.castShadow = true; c.receiveShadow = true; parent.add(c); return c; };
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const wheel = (g, x, z, r = .42, w = .32) => { const m = cyl(r, w, mat('#18191b', { roughness: .8 }), g, 12); m.rotation.z = Math.PI / 2; m.position.set(x, r, z); return m; };
const shadowAll = g => g.traverse(o => { if (o.isMesh) o.castShadow = true; });
// the area the action needs: no generic buildings or trees here
export const EXCL = [[SCAF.x0 - 1, SCAF.x1 + 1, SCAF.z0 - 1, SCAF.z1 + 3], [128, 172, 212, 252], [BAKERY.x0 - 1, BAKERY.x1 + 1, BAKERY.z0 - 1, BAKERY.z1 + 1], [14, 162, 268, 340]];   // last: a low plaza south of the junction, so the street stays in view

function signTex(text, bg, fg, w = 512, h = 192) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${h * .62}px Overpass`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(w / 2, h * .54); const tw = g.measureText(text).width; g.scale(Math.min(1, w * .9 / tw), 1); g.fillText(text, 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// —— static set: the scaffold building, the building site (fence, dirt, platform and ramp), the bakery ——
export function extraGeometry(b) {
  const S = SCAF;
  b.gBld.box(S.x0, S.x1, 0, S.h, S.z0, S.z1, '#d7e3ea', '#c9cfd4', { facade: true, wp: [3.3, 3.3, 1000 + 61] });
  b.gFlat.flat(S.x0 - 1, S.x1 + 1, S.z1, S.front + .6, .13, '#ddd5c6');
  // scaffold: poles, ledgers and wooden planks at every floor along the south face; a half-painted wall (sunny yellow) at the top
  const pole = '#9aa0a6', wood = '#c8955a';
  for (let x = S.x0; x <= S.x1 + .01; x += 4) for (const z of [S.z1 + .5, S.front]) b.gFlat.box(x - .09, x + .09, 0, S.h + 1.5, z - .09, z + .09, pole, pole);
  for (const y of [3.3, 6.6, S.plank]) { b.gFlat.box(S.x0, S.x1, y - .12, y, S.z1 + .4, S.front + .2, wood, wood); for (const z of [S.z1 + .5, S.front]) b.gFlat.box(S.x0, S.x1, y + .9, y + 1.0, z - .06, z + .06, pole, pole); }
  b.gBld.box(S.x0, S.x0 + 5, 9.9, S.h, S.z1, S.z1 + .05, '#ffd23a', '#ffd23a');
  // the building site: brown earth, a blue-and-white hoarding fence, the crane's concrete pad, the pipe platform and its ramp
  b.gFlat.flat(128, 172, 212, 252, .05, '#b98d5e');
  for (let x = 128; x < 172; x += 3) b.gFlat.box(x, x + 2.8, 0, 2.2, 251.6, 251.9, x % 6 < 3 ? '#2f6fd0' : '#f4f2ee', x % 6 < 3 ? '#2f6fd0' : '#f4f2ee');
  b.gFlat.box(CRANE.x - 4, CRANE.x + 4, 0, .6, CRANE.z - 4, CRANE.z + 4, '#b8b3a8', '#c9c4b8');
  const px0 = STACK.x - 5, px1 = STACK.x + 5, pz0 = STACK.z - 5, pz1 = STACK.z + 4;
  b.gFlat.box(px0, px1, STACK.y - .4, STACK.y, pz0, pz1, '#e0a422', '#e0a422');
  for (const [x, z] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) b.gFlat.box(x - .25, x + .25, 0, STACK.y, z - .25, z + .25, '#8c8f93', '#8c8f93');
  // the ramp: a sloped plank from the platform's south-west corner down onto the junction
  const r0 = [RAMP.top.x, RAMP.top.y, RAMP.top.z], r1 = [RAMP.bot.x, RAMP.bot.y, RAMP.bot.z], w = 3.4;
  const dx = r1[0] - r0[0], dz = r1[2] - r0[2], L = Math.hypot(dx, dz), nx = -dz / L * w, nz = dx / L * w;
  b.gFlat.quad([r0[0] - nx, r0[1], r0[2] - nz], [r0[0] + nx, r0[1], r0[2] + nz], [r1[0] + nx, r1[1], r1[2] + nz], [r1[0] - nx, r1[1], r1[2] - nz], [0, 1, 0], '#c8955a');
  // the plaza south of the junction: paving, flower beds, a fountain, low kiosks
  b.gFlat.flat(14, 162, 269, 340, .12, '#e6dccb');
  for (let x = 24; x < 158; x += 16) for (let z = 282; z < 336; z += 14) { if ((x - 24) % 32 === 0 && z % 28 === 2) continue; b.gFlat.box(x, x + 7, .12, .55, z, z + 4, '#cbb89a', '#5f9a3c'); }
  b.gFlat.disc(88, 305, 6, 6, .3, '#cbb89a'); b.gFlat.disc(88, 305, 5, 5, .5, '#3fa5b5');
  for (const [x, z, c] of [[40, 274, '#2f6fd0'], [58, 274, '#d8342a'], [140, 300, '#2c9a7a'], [120, 320, '#f2b72e']]) { b.gBld.box(x, x + 4, 0, 2.8, z, z + 3, '#f4f2ee', c); }
  // bakery: pink walls, a striped awning, and a flat roof that holds the giant cake
  const K = BAKERY;
  b.gBld.box(K.x0, K.x1, 0, K.h, K.z0, K.z1, '#f6c3cf', '#efe6dc', { facade: true, wp: [3.0, 4.0, 1000 + 23] });
  for (let x = K.x0; x < K.x1; x += 1.5) b.gFlat.box(x, x + 1.5, 3.2, 3.4, K.z0 - 2.2, K.z0, (x - K.x0) % 3 < 1.5 ? '#d8342a' : '#fbfaf6', (x - K.x0) % 3 < 1.5 ? '#d8342a' : '#fbfaf6');
}

// —— the pigeon: fat, grey, iridescent neck; lands, pecks, looks down at the end, flies off ——
export function makePigeon(scene) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); scene.add(g);
  const grey = mat('#9aa3ad', { roughness: .7 }), dark = mat('#5d6670'), neck = mat('#5f8f7d', { roughness: .4, metalness: .2 });
  const torso = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 12), grey); torso.scale.set(.85, .8, 1.15); torso.position.y = .55; body.add(torso);
  const headG = new THREE.Group(); headG.position.set(0, 1.0, .42); body.add(headG);
  const nk = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 10), neck); nk.position.set(0, -.12, -.05); headG.add(nk);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10), grey); head.position.y = .08; headG.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 6), mat('#e8b06a')); beak.rotation.x = Math.PI / 2; beak.position.set(0, .04, .26); headG.add(beak);
  for (const sx of [-.11, .11]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat('#e8661a')); e.position.set(sx, .12, .15); headG.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), mat('#111')); p.position.set(sx * 1.08, .13, .19); headG.add(p); }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.4, .06, .5), dark); tail.position.set(0, .55, -.65); tail.rotation.x = .3; body.add(tail);
  const wings = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * .36, .7, .05); body.add(piv); const w = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .62), dark); w.position.x = sx * .45; piv.add(w); wings.push({ piv, sx }); }
  for (const sx of [-.15, .15]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .25, 5), mat('#e2735a')); l.position.set(sx, .13, 0); body.add(l); }
  shadowAll(g); g.scale.setScalar(1.3);
  const perch = V(BUCKET.x + 1.6, SCAF.plank, BUCKET.z + .1);
  return {
    g,
    draw(t) {
      let pos = perch.clone(), flap = 0, yaw = -Math.PI / 2 - .3, headDip = 0, headTilt = 0, vis = 1;
      if (t < T.land) { const u = t / T.land; pos.add(V(9 * (1 - u) ** 2, 6 * (1 - u) ** 1.5, 4 * (1 - u) ** 2)); flap = 1; yaw = -Math.PI / 2 - .6 * (1 - u); }
      for (const pk of [T.peck1, T.peck2]) headDip = Math.max(headDip, Math.max(0, Math.sin(clamp((t - pk) / .35) * Math.PI)));
      if (t > T.tip - .2 && t < T.fall + .8) headTilt = .45 * Math.sin(clamp((t - T.tip + .2) / 1.4) * Math.PI);   // looks over the edge after the bucket
      if (t > T.look && t < T.fly) headTilt = .55 * ss(seg(t, T.look, T.look + .4));
      if (t > T.fly) { const u = t - T.fly; pos.add(V(-u * u * 1.6 - u * 1.5, u * 2.6 + u * u * .8, -u * 1.2)); flap = 1; yaw = -Math.PI / 2 - .4 + clamp(u * 2) * 1.8; }
      g.position.copy(pos); g.rotation.y = yaw;
      headG.rotation.x = headDip * .9; headG.rotation.z = headTilt; headG.position.z = .42 + headDip * .12;
      const f = flap ? Math.sin(t * 34) * .9 : -.2; wings.forEach(w => { w.piv.rotation.z = w.sx * f; w.piv.rotation.y = flap ? 0 : w.sx * 1.35; });
      body.position.y = flap ? 0 : Math.abs(Math.sin(t * 2.2)) * .02;
      tail.rotation.y = t > T.fly && t < T.knock + .3 ? Math.sin((t - T.fly) * 20) * .6 : 0;
    },
  };
}

// —— paint buckets: yellow (tips at T.tip, falls onto the car), blue (knocked at the end, falls on the convertible) ——
function bucketMesh(scene, col) {
  const g = new THREE.Group(); scene.add(g);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.42, .34, .8, 14), mat(col, { roughness: .35 })); b.position.y = .4; g.add(b);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .04, 14), mat(col === '#ffd23a' ? '#ffe36a' : '#4f8fef')); lid.position.y = .79; g.add(lid);
  const h = new THREE.Mesh(new THREE.TorusGeometry(.38, .03, 6, 16, Math.PI), mat('#8c8f93', { metalness: .6 })); h.position.y = .8; g.add(h);
  shadowAll(g); return { g, h };
}
export function makeBuckets(scene) {
  const y = bucketMesh(scene, '#ffd23a'), bl = bucketMesh(scene, '#2f6fd0');
  return {
    draw(t, carNow, convNow) {
      // yellow: wobble, tip, tumble down to the car's windscreen, then ride along on its bonnet
      if (t < T.tip) { y.g.position.set(BUCKET.x, SCAF.plank, BUCKET.z); y.g.rotation.set(0, 0, Math.sin(t * 20) * .04 * seg(t, T.peck1, T.peck1 + .3)); }
      else if (t < T.fall) { const u = (t - T.tip) / (T.fall - T.tip); y.g.position.set(BUCKET.x, SCAF.plank, BUCKET.z + u * .6); y.g.rotation.set(Math.sin(u * 16) * .25 * u + u * .5, 0, Math.sin(u * 11) * .2); }
      else if (t < T.splat) { const u = (t - T.fall) / (T.splat - T.fall), c = carNow(T.splat); y.g.position.set(lerp(BUCKET.x, c.x + 1.2 * Math.sin(c.yaw), u), lerp(SCAF.plank, 1.4, u * u), lerp(BUCKET.z + .6, c.z, u)); y.g.rotation.set(u * 5, 0, u * 2); }
      else { const c = carNow(t); y.g.position.set(c.x + Math.sin(c.yaw) * 1.4, 1.25, c.z + Math.cos(c.yaw) * 1.4); y.g.rotation.set(Math.PI * .55, c.yaw, 0); }
      // blue: sits by the pigeon until its tail swipes it, then falls on the convertible
      if (t < T.knock) { bl.g.position.set(BUCKET2.x, SCAF.plank, BUCKET2.z); bl.g.rotation.set(0, 0, 0); }
      else if (t < T.fall2) { const u = (t - T.knock) / (T.fall2 - T.knock); bl.g.position.set(BUCKET2.x - u * .2, SCAF.plank, BUCKET2.z + u * .7); bl.g.rotation.set(u * 1.2, 0, Math.sin(u * 14) * .3); }
      else { const u = t - T.fall2, c = convNow(T.fall2 + 1.6); bl.g.position.set(lerp(BUCKET2.x, c.x, clamp(u / 1.6)), Math.max(1.3, SCAF.plank - 3.2 * u * u), lerp(BUCKET2.z + .7, c.z, clamp(u / 1.6))); bl.g.rotation.set(1.2 + u * 4, 0, u * 1.5); }
    },
    yellowPos: () => y.g.position.clone(), bluePos: () => bl.g.position.clone(),
  };
}

// —— vehicles: a tiny low-poly kit (sports car, taxi, bus, box truck, van, police car, convertible) ——
function carBody(scene, o) {
  const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(o.s || 1.2);
  const body = mat(o.col, { roughness: .3, metalness: .15 }), dark = mat('#13161b', { roughness: .12, metalness: .5 });
  const L = o.len || 4.4, H = o.h || .65, W = 1.95;
  box(W, H, L, body, 0, .35 + H / 2, 0, i);
  if (o.cab !== false) { box(W - .2, o.cabH || .7, o.cabL || 2.2, o.roof || body, 0, .35 + H + (o.cabH || .7) / 2, o.cabZ || -.2, i); for (const z of [(o.cabZ || -.2) + (o.cabL || 2.2) / 2 + .01, (o.cabZ || -.2) - (o.cabL || 2.2) / 2 - .01]) box(W - .35, (o.cabH || .7) * .7, .05, dark, 0, .35 + H + (o.cabH || .7) / 2, z, i); }
  const ws = []; for (const [x, z] of [[-.95, L / 2 - .9], [.95, L / 2 - .9], [-.95, -L / 2 + .9], [.95, -L / 2 + .9]]) ws.push(wheel(i, x, z));
  for (const sx of [-.6, .6]) { box(.35, .15, .05, glow(2.6, 2.4, 1.9), sx, .35 + H * .6, L / 2 + .02, i); box(.35, .15, .05, glow(2.4, .3, .2), sx, .35 + H * .6, -L / 2 - .02, i); }
  scene.add(g); shadowAll(g);
  return { g, i, ws };
}
export function makeRedCar(scene) {
  const c = carBody(scene, { col: '#e0241b', len: 4.6, h: .55, cabH: .45, cabL: 1.6, cabZ: -.3, roof: mat('#13161b', { roughness: .1, metalness: .5 }) });
  box(2.0, .08, .5, c.i.children[0].material, 0, 1.25, -2.1, c.i); for (const sx of [-.7, .7]) box(.08, .35, .2, mat('#111'), sx, 1.05, -2.1, c.i);
  const paint = new THREE.Group(); c.i.add(paint);
  box(2.0, .08, 2.6, mat('#ffd23a', { roughness: .25 }), 0, .95, .9, paint); box(1.75, .4, .1, mat('#ffd23a', { roughness: .25 }), 0, 1.1, .5, paint);
  for (let k = 0; k < 6; k++) box(.18, .5, .1, mat('#ffd23a'), -.9 + k * .36, .75, 2.32, paint);
  paint.visible = false;
  return {
    g: c.g,
    draw(t) { const p = carPose(t); c.g.position.set(p.x, 0, p.z); c.g.rotation.y = p.yaw; paint.visible = p.paint > 0; c.g.rotation.z = t > T.hydrant && t < T.hydrant + .4 ? Math.sin((t - T.hydrant) * 30) * .05 : 0; c.ws.forEach(w => { w.rotation.x = t * 30 * (t < T.hydrant ? 1 : 0); }); },
    pose: carPose,
  };
}

// —— the hydrant and its geyser ——
export function makeHydrant(scene) {
  const g = new THREE.Group(); scene.add(g); g.position.set(HYD.x, 0, HYD.z);
  const red = mat('#d8342a', { roughness: .35 });
  const b = cyl(.32, 1.0, red, g); b.position.y = .5; const cap = new THREE.Mesh(new THREE.SphereGeometry(.33, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), red); cap.position.y = 1.0; g.add(cap);
  for (const sx of [-1, 1]) { const n = cyl(.12, .3, red, g, 8); n.rotation.z = Math.PI / 2; n.position.set(sx * .38, .7, 0); }
  shadowAll(g);
  const N = 160, sp = makeSprites(scene, N, dotTex(), {}), rnd = mulberry(3), D = [];
  for (let k = 0; k < N; k++) D.push({ ph: rnd(), a: rnd() * Math.PI * 2, r: rnd(), s: .4 + rnd() * .9 });
  return {
    draw(t, camera) {
      const hit = t > T.hydrant; g.rotation.z = hit ? -.5 : 0; cap.visible = !hit || t < T.hydrant + .05;
      const H = hit ? 22 * ss(seg(t, T.hydrant, T.hydrant + .5)) * (t > 45 ? lerp(1, .55, seg(t, 45, 50)) : 1) : 0;
      D.forEach((d, k) => {
        if (!hit) { sp.hide(k); return; }
        const life = 1.3, age = ((t - T.hydrant) / life + d.ph) % 1, up = age * H * 1.15, fallback = age > .7 ? (age - .7) / .3 : 0;
        const rr = .3 + d.r * 1.6 * age + fallback * 3;
        const x = HYD.x + Math.cos(d.a) * rr, z = HYD.z + Math.sin(d.a) * rr, y = Math.max(.2, up - fallback * fallback * H * 1.2);
        const sz = d.s * (1 + age * 2.2);
        sp.set(k, x, y + 1, z, sz, sz, .86, .95, 1.0, .6 * (1 - age * .7), d.ph * 6);
      });
      sp.sortBy(camera); sp.commit(scene.fog);
    },
    height: t => t > T.hydrant ? 22 * ss(seg(t, T.hydrant, T.hydrant + .5)) : 0,
  };
}

// —— the delivery scooter and its rider (helmet, a delivery box), launched into the crane cab ——
export function makeScooter(scene, cabWorld) {
  const sc = new THREE.Group(); scene.add(sc);
  box(.5, .5, 1.6, mat('#2c9a7a'), 0, .55, 0, sc); box(.12, .9, .12, mat('#333'), 0, 1.05, .6, sc); box(.7, .08, .08, mat('#333'), 0, 1.5, .6, sc);
  box(.75, .65, .7, mat('#f07f2c'), 0, 1.2, -.55, sc);   // delivery box
  for (const z of [.65, -.6]) { const w = wheel(sc, 0, z, .3, .16); w.rotation.z = 0; w.rotation.y = Math.PI / 2; }
  sc.scale.setScalar(1.25); shadowAll(sc);
  const r = new THREE.Group(); scene.add(r);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .6, 4, 8), mat('#f07f2c')); body.position.y = .3; r.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), mat('#f0c9a4')); head.position.y = .95; r.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e8463a', { roughness: .3 })); helm.position.y = 1.0; r.add(helm);
  const arms = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * .38, .55, 0); r.add(piv); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .45, 3, 6), body.material); a.position.y = -.3; piv.add(a); arms.push({ piv, sx }); }
  r.scale.setScalar(1.25); shadowAll(r);
  return {
    draw(t) {
      const cab = cabWorld(t), p = riderPose(t, cab);
      r.position.set(p.x, p.y + (p.on ? 1.0 : 0), p.z); r.rotation.set(p.spin, 0, p.spin * .4); r.visible = true;
      arms.forEach(a => { a.piv.rotation.z = a.sx * (p.on ? .6 : 2.4 + Math.sin(t * 18) * .4); });
      if (p.inCab) { r.rotation.set(0, craneYaw(t), 0); arms.forEach(a => { a.piv.rotation.z = a.sx * (t < T.spin0 ? .3 : 2.6 + Math.sin(t * 9) * .3); }); }
      // the scooter: rides with him, then skids on alone across the pavement and tips over
      if (t < T.launch) { sc.position.set(p.x, 0, p.z); sc.rotation.set(0, Math.PI / 2, 0); }
      else { const u = t - T.launch, d = Math.min(9, u * 9 - u * u * 4.5); sc.position.set(HYD.x + 1 + d, 0, LANE.eb + 1 + d * .45); sc.rotation.set(0, Math.PI / 2 + Math.min(1, u) * .6, -Math.min(1.45, u * 2)); }
    },
  };
}

// —— the tower crane: yellow lattice mast, slewing jib with a trolley and hook, counter-jib and weights, the cab ——
export function makeCrane(scene) {
  const base = new THREE.Group(); base.position.set(CRANE.x, .6, CRANE.z); scene.add(base);
  const yel = mat('#f2b72e', { roughness: .45 }), dk = mat('#3a3d42'), wht = mat('#f4f2ee');
  const H = CRANE.h;
  for (const [x, z] of [[-.9, -.9], [.9, -.9], [-.9, .9], [.9, .9]]) box(.18, H, .18, yel, x, H / 2, z, base);
  for (let y = 1; y < H; y += 1.8) { box(1.98, .1, .1, yel, 0, y, -.9, base); box(1.98, .1, .1, yel, 0, y, .9, base); box(.1, .1, 1.98, yel, -.9, y + .9, 0, base); box(.1, .1, 1.98, yel, .9, y + .9, 0, base); }
  const slew = new THREE.Group(); slew.position.y = H; base.add(slew);
  box(2.4, .6, 2.4, dk, 0, .3, 0, slew);
  const cab = new THREE.Group(); cab.position.set(1.6, -.4, 1.2); slew.add(cab);
  box(2.0, 2.0, 2.2, wht, 0, 1, 0, cab); box(2.02, .9, 1.4, mat('#253038', { roughness: .1, metalness: .4 }), 0, 1.3, .5, cab);
  // jib along +z of the slew group (rotation.y = yaw makes it point along (sin yaw, cos yaw))
  const JL = CRANE.jib;
  for (const x of [-.55, .55]) box(.14, .14, JL, yel, x, 1.2, JL / 2 + 1, slew);
  box(.14, .14, JL, yel, 0, 2.2, JL / 2 + 1, slew);
  for (let z = 2; z < JL; z += 2.2) box(1.1, .08, .08, yel, 0, 1.2, z, slew);
  box(.16, 3.6, .16, yel, 0, 2.4, 0, slew);   // tower head
  for (const x of [-.55, .55]) box(.14, .14, 12, yel, x, 1.2, -6, slew);
  box(2.2, 1.6, 3, mat('#9aa0a6'), 0, .4, -10.5, slew);   // counterweights
  const trolley = box(1.1, .4, 1.2, dk, 0, .9, TROLLEY, slew);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 5), dk); slew.add(cable);
  const hook = new THREE.Group(); scene.add(hook);
  box(1.0, 1.1, .8, mat('#e8463a'), 0, .55, 0, hook); const hk = new THREE.Mesh(new THREE.TorusGeometry(.3, .09, 6, 12, Math.PI * 1.4), dk); hk.position.y = -.25; hook.add(hk);
  shadowAll(base); shadowAll(hook);
  const HOOK_Y = STACK.y + 1.8, drop = H + .9 - HOOK_Y;
  return {
    draw(t) {
      const yaw = craneYaw(t); slew.rotation.y = yaw;
      // the hook swings behind the jib (a lagging pendulum) while it spins
      const w = (craneYaw(t + .05) - craneYaw(t - .05)) / .1, lag = clamp(-w * 1.6, -2.5, 2.5) + Math.sin(t * 2.1) * .15;
      const tip = V(Math.sin(yaw) * TROLLEY, 0, Math.cos(yaw) * TROLLEY), side = V(Math.cos(yaw), 0, -Math.sin(yaw));
      const hp = V(CRANE.x, .6 + H + .9 - drop, CRANE.z).add(tip).addScaledVector(side, lag);
      hook.position.copy(hp); hook.rotation.y = yaw;
      const top = V(CRANE.x, .6 + H + .9, CRANE.z).add(tip), mid = top.clone().add(hp).multiplyScalar(.5), len = top.distanceTo(hp);
      slew.worldToLocal(mid); cable.position.copy(mid); cable.scale.y = len; cable.rotation.set(0, 0, 0); cable.rotation.z = Math.atan2(lag, drop) * (1);
    },
    cabWorld: t => { const yaw = craneYaw(t); const c = V(1.6, H - .4 + .6 + 1.0, 1.2); return V(CRANE.x + c.x * Math.cos(yaw) + c.z * Math.sin(yaw), c.y + .4, CRANE.z - c.x * Math.sin(yaw) + c.z * Math.cos(yaw)); },
  };
}

// —— the pipes: a stack on the platform, swept off by the hook, roll down the ramp and spread over the junction ——
export function makePipes(scene) {
  const rnd = mulberry(17), R = (a, b) => a + (b - a) * rnd();
  const N = 15, pipes = [];
  const dir = V(RAMP.bot.x - RAMP.top.x, 0, RAMP.bot.z - RAMP.top.z).normalize();   // down the ramp
  const along = V(-dir.z, 0, dir.x);   // pipe axis: across the ramp
  let k = 0;
  for (let row = 0; row < 5 && k < N; row++) for (let i = 0; i < 5 - row && k < N; i++, k++) {
    const p0 = V(STACK.x, STACK.y + .55 + row * .95, STACK.z).addScaledVector(dir, (i - (4 - row) / 2) * 1.05);
    const dist = R(8, 22), lat = R(-3.5, 3.5);
    pipes.push({ p0, dist, lat, t0: T.roll0 + row * .25 + R(0, .5), col: rnd() < .55 ? '#f07f2c' : '#9aa0a6', r: .5, len: R(4.2, 5.4) });
  }
  const ms = pipes.map(p => { const m = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.len, 14, 1, true), mat(p.col, { roughness: .4, metalness: p.col === '#9aa0a6' ? .5 : 0, side: THREE.DoubleSide })); m.castShadow = true; scene.add(m); return m; });
  const axisQ = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), along);
  const rampTop = V(RAMP.top.x, RAMP.top.y, RAMP.top.z), rampBot = V(RAMP.bot.x, 0, RAMP.bot.z), rampLen = rampTop.distanceTo(rampBot);
  return {
    draw(t) {
      pipes.forEach((p, i) => {
        const m = ms[i]; let pos, roll = 0;
        if (t < T.sweep) { pos = p.p0.clone(); }
        else {
          const u = Math.max(0, t - p.t0);
          // to the ramp head (slide off the platform), then down the ramp (accelerating), then rolling out with friction
          const s = u < .6 ? u * 2.4 : 1.44 + (u - .6) * 6 + (u - .6) ** 2 * 3.2;
          const tot = rampTop.distanceTo(p.p0) + rampLen, sx = Math.min(s, p.dist + tot);
          const sOut = Math.max(0, sx - tot), eased = p.dist * (1 - Math.exp(-sOut / p.dist * 1.6)) / (1 - Math.exp(-1.6));
          if (sx < rampTop.distanceTo(p.p0)) pos = p.p0.clone().lerp(rampTop.clone().setY(Math.max(STACK.y + .5, p.p0.y)), sx / rampTop.distanceTo(p.p0));
          else if (sx < tot) { const k = (sx - rampTop.distanceTo(p.p0)) / rampLen; pos = rampTop.clone().lerp(rampBot, k); pos.y += p.r; }
          else pos = rampBot.clone().addScaledVector(dir, eased).addScaledVector(along, p.lat * clamp(eased / p.dist)).setY(p.r);
          roll = sx / p.r;
        }
        m.position.copy(pos); m.quaternion.copy(axisQ).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), roll));
      });
    },
  };
}

// —— traffic: ambient cars through the junction (until the pipes block it), then the eastbound queue that piles up ——
const KIT = {
  taxi: { col: '#f2c21a', len: 4.4 }, bus: { col: '#2c9a7a', len: 11, h: 2.6, cabH: .2, cabL: 10, roof: mat('#f4f2ee') }, car: { col: '#2f6fd0', len: 4.3 },
  truck: { col: '#f4f2ee', len: 8, h: 2.9, cabH: .1, cabL: .2 }, van: { col: '#8e98a3', len: 5.2, h: 1.6, cabH: .3, cabL: 1.6, cabZ: 1.2 },
  car2: { col: '#3f9a5a', len: 4.2 }, car3: { col: '#e27fb0', len: 4.2 },
};
// the queue: the lead taxi stops at the pipes; each follower stops too late and nudges the one ahead; the van slams the truck
export const QUEUE = [
  { kind: 'taxi', rest: 99.0, hit: 30.3 }, { kind: 'bus', rest: 90.4, hit: 30.75 }, { kind: 'taxi', rest: 82.2, hit: 31.2 },
  { kind: 'car', rest: 77.4, hit: 31.6 }, { kind: 'truck', rest: 70.9, hit: 32.0 }, { kind: 'van', rest: 64.1, hit: T.smash },
];
export function makeTraffic(scene) {
  const out = [];
  QUEUE.forEach((q, i) => {
    const o = KIT[q.kind], c = carBody(scene, { ...o, s: 1.0 });
    if (q.kind === 'truck') { // ball-truck livery: coloured dots on the box, rear doors that burst open
      const dots = ['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0']; for (let k = 0; k < 14; k++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.32, 12), mat(dots[k % 5])); s.position.set(1.0, 1.5 + (k % 2) * .9, -3.2 + Math.floor(k / 2) * .9); s.rotation.y = Math.PI / 2; c.i.add(s); const s2 = s.clone(); s2.position.x = -1.0; s2.rotation.y = -Math.PI / 2; c.i.add(s2); }
      box(1.95, 1.3, 1.6, mat('#d8342a'), 0, 1.0, 3.3, c.i);   // the cab
      q.doors = []; for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * .97, 1.8, -4.02); c.i.add(piv); box(.97, 2.8, .06, mat('#e9e4d8'), -sx * .485, 0, 0, piv); q.doors.push({ piv, sx }); }
    }
    if (q.kind === 'taxi') box(.7, .25, .35, mat('#111'), 0, 1.85, -.2, c.i);
    out.push({ q, c, len: o.len * (q.kind === 'bus' || q.kind === 'truck' ? 1 : 1.2) });
  });
  // ambient cars crossing north–south and east–west before the chaos (they never get near the action's paths)
  const amb = [];
  const R = mulberry(31);
  for (let k = 0; k < 10; k++) { const kind = ['car', 'car2', 'car3', 'taxi'][k % 4]; const c = carBody(scene, { ...KIT[kind], s: 1.0 }); amb.push({ c, dir: k % 2 ? 'sb' : 'nb', t0: k * 2.6 + R() * 1.2 }); }
  return {
    draw(t) {
      out.forEach(({ q, c }, i) => {
        const v = 10, x0 = q.rest - v * (q.hit - 27.5);   // all cruise at 10 m/s from 27.5 s and arrive at their rest point at 'hit'
        let x = Math.min(x0 + v * Math.max(0, t - 27.5), q.rest), jolt = 0;
        const next = out[i + 1]; if (next) { const th = next.q.hit; if (t > th) jolt = Math.exp(-(t - th) * 5) * Math.sin((t - th) * 25) * .25 + (1 - Math.exp(-(t - th) * 8)) * .5; }
        if (q.kind === 'truck' && t > T.smash) jolt += (1 - Math.exp(-(t - T.smash) * 6)) * 1.6;
        c.g.position.set(x + jolt, t < 27.5 - (q.rest - x0) / v ? -50 : 0, LANE.eb); c.g.rotation.y = Math.PI / 2 + (t > q.hit ? Math.sin(i * 7) * .08 * seg(t, q.hit, q.hit + .2) : 0);
        c.g.rotation.x = t > q.hit && t < q.hit + .4 ? -Math.sin((t - q.hit) / .4 * Math.PI) * .06 : 0;
        c.ws.forEach(w => { w.rotation.x = x * 2; });
        if (q.doors) q.doors.forEach(d => { d.piv.rotation.y = d.sx * 1.9 * eo(seg(t, T.burst, T.burst + .35)); });
      });
      amb.forEach(a => {
        const life = 9, u = t - a.t0, on = u > 0 && u < life && t < 27;
        const x = a.dir === 'nb' ? LANE.nb : LANE.sb, z = a.dir === 'nb' ? 330 - u * 15 : 190 + u * 15;
        a.c.g.position.set(x, on ? 0 : -50, z); a.c.g.rotation.y = a.dir === 'nb' ? Math.PI : 0; a.c.ws.forEach(w => { w.rotation.x = u * 20; });
      });
    },
    truckRear: t => { const tr = out[4]; return V(tr.c.g.position.x - 4.2, 2.2, LANE.eb); },
  };
}

// —— the balls: ~1400, thrown up out of the truck by the smash; a rain of colour that bounces over the junction ——
export function makeBalls(scene) {
  const rnd = mulberry(77), R = (a, b) => a + (b - a) * rnd(), N = 1400;
  const COLS = ['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0', '#f07f2c', '#8bc6e8', '#7a3fc4', '#fbfaf6'];
  const B = [];
  for (let k = 0; k < N; k++) {
    // launched from the truck's box, mostly up and east (over the queue), some back west and sideways
    const east = rnd() < .82;
    const vx = east ? R(4, 19) : R(-6, -1), vz = R(-3.2, 3.2), vy = R(7, 15), t0 = T.burst + R(0, .9) + (east ? 0 : .2);
    const x0 = 70.9 + R(-3, 3), z0 = LANE.eb + R(-.8, .8), y0 = R(1.5, 3.5), r = R(.22, .34);
    // bounces: precompute flight segments (restitution .55, horizontal damping .75, walls at the kerbs + 3 m)
    const segs = []; let t = t0, x = x0, y = y0, z = z0, ux = vx, uy = vy, uz = vz;
    for (let b = 0; b < 7; b++) {
      const tf = (uy + Math.sqrt(uy * uy + 2 * 9.8 * (y - r))) / 9.8;
      segs.push({ t, x, y, z, ux, uy, uz, tf });
      t += tf; x += ux * tf; z += uz * tf; y = r; uy = Math.abs(uy - 9.8 * tf) * .55; ux *= .75; uz *= .75;
      if (z < 250) { z = 250 + (250 - z); uz = -uz; } if (z > 275) { z = 275 - (z - 275); uz = -uz; }
      if (uy < .6) { segs.push({ t, x, y: r, z, ux: ux * .5, uy: 0, uz: uz * .5, tf: 2.5, roll: 1 }); break; }
    }
    B.push({ segs, r, t0, col: COLS[k % COLS.length] });
  }
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat('#fff', { roughness: .35 }), N); m.castShadow = true; m.frustumCulled = false; scene.add(m);
  B.forEach((b, k) => m.setColorAt(k, C.set(b.col)));
  const at = (b, t) => {
    if (t < b.t0) return null;
    let s = b.segs[0]; for (const q of b.segs) if (t >= q.t) s = q;
    const u = Math.min(t - s.t, s.tf);
    if (s.roll) { const d = 1 - Math.exp(-u * 1.5); return V(s.x + s.ux * d / 1.5, s.y, s.z + s.uz * d / 1.5); }
    return V(s.x + s.ux * u, Math.max(b.r, s.y + s.uy * u - 4.9 * u * u), s.z + s.uz * u);
  };
  return {
    draw(t) { B.forEach((b, k) => { const p = at(b, t); if (!p) M.makeScale(0, 0, 0); else M.compose(P.copy(p), Q.identity(), Sc.set(b.r, b.r, b.r)); m.setMatrixAt(k, M); }); m.instanceMatrix.needsUpdate = true; },
    front: t => { let mx = 0; for (let k = 0; k < N; k += 7) { const p = at(B[k], t); if (p && p.y < 1.2) mx = Math.max(mx, p.x); } return mx; },
  };
}

// —— lamp posts on the south pavement east of the junction: the balls knock the first, each falls on the next ——
export function postAngle(i, t) { const t0 = T.post0 + i * T.postDt; return t < t0 ? 0 : 1.48 * ei(clamp((t - t0) / .62)) ** .8; }
export function makePosts(scene) {
  const ps = POSTS.map(p => {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); scene.add(g);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, p.h, 8), mat('#2f3338')); pole.position.y = p.h / 2; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .1, .1), mat('#2f3338')); arm.position.set(-.35, p.h, 0); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, .8) })); lamp.position.set(-.75, p.h - .2, 0); g.add(lamp);
    shadowAll(g); return g;
  });
  return { draw(t) { ps.forEach((g, i) => { g.rotation.z = -postAngle(i, t); }); } };
}

// —— the bakery sign (knocked by the last post) and the giant cake that topples onto the police car ——
export function makeBakery(scene) {
  const S = BAKERY.sign, sg = new THREE.Group(); sg.position.set(S.x, 0, S.z); scene.add(sg);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, S.h, 8), mat('#5d4a3a')); pole.position.y = S.h / 2; sg.add(pole);
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.5, .2), [mat('#f6c3cf'), mat('#f6c3cf'), mat('#f6c3cf'), mat('#f6c3cf'), new THREE.MeshStandardMaterial({ map: signTex('BAKERY', '#f6c3cf', '#b03a5b') }), new THREE.MeshStandardMaterial({ map: signTex('BAKERY', '#f6c3cf', '#b03a5b') })]);
  board.position.set(1.4, S.h - .3, 0); board.rotation.y = 0; sg.add(board);
  shadowAll(sg);
  // the cake: three tiers, pink icing, cream swirls, a cherry
  const cake = new THREE.Group(); scene.add(cake);
  const tiers = [[2.4, 1.3, '#f8e2c0'], [1.8, 1.1, '#f6c3cf'], [1.2, .9, '#fbfaf6']]; let y = 0;
  tiers.forEach(([r, h, c]) => { const m = cyl(r, h, mat(c, { roughness: .6 }), cake, 20); m.position.y = y + h / 2; const ic = cyl(r * 1.02, .18, mat('#f9a8c2'), cake, 20); ic.position.y = y + h - .05; y += h; });
  for (let k = 0; k < 8; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), mat('#fffaf2')); const a = k / 8 * Math.PI * 2; s.position.set(Math.cos(a) * 1.1, y + .05, Math.sin(a) * 1.1); cake.add(s); }
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), mat('#d8142a', { roughness: .2 })); cherry.position.y = y + .3; cake.add(cherry);
  shadowAll(cake);
  const N = 70, cream = makeSprites(scene, N, puffTex(), {}), rnd = mulberry(9), CR = []; for (let k = 0; k < N; k++) CR.push({ a: rnd() * Math.PI * 2, v: 2 + rnd() * 5, vy: 2 + rnd() * 4, s: .6 + rnd() });
  const from = V(BAKERY.cake.x, BAKERY.h, BAKERY.cake.z), to = V(COP.stop.x, 1.55, COP.stop.z);
  return {
    draw(t, camera) {
      const hitSign = T.sign; const k = t > hitSign ? Math.exp(-(t - hitSign) * 2.5) * Math.sin((t - hitSign) * 16) : 0;
      sg.rotation.x = t > hitSign ? -.35 * ss(seg(t, hitSign, hitSign + .3)) + k * .15 : 0;
      if (t < T.cakeFall) { cake.position.copy(from); cake.rotation.set(t > hitSign ? Math.sin((t - hitSign) * 14) * .06 : 0, 0, 0); cake.scale.set(1, 1, 1); }
      else if (t < T.cakeHit) { const u = (t - T.cakeFall) / (T.cakeHit - T.cakeFall); cake.position.set(lerp(from.x, to.x, u), lerp(from.y, to.y, u * u) + 2.5 * Math.sin(u * Math.PI) * (1 - u), lerp(from.z, to.z, u)); cake.rotation.set(-u * Math.PI * .95, 0, 0); cake.scale.set(1, 1, 1); }
      else { const u = t - T.cakeHit; cake.position.copy(to); cake.rotation.set(-Math.PI * .95, 0, 0); const sq = 1 - .42 * eo(clamp(u / .25)); cake.scale.set(1 + (1 - sq) * .8, sq, 1 + (1 - sq) * .8); }
      CR.forEach((c, i) => { const u = t - T.cakeHit; if (u < 0 || u > 2.5) { cream.hide(i); return; } const d = c.v * (1 - Math.exp(-u * 3)) / 3; const x = to.x + Math.cos(c.a) * d, z = to.z + Math.sin(c.a) * d, y = Math.max(.3, 1.8 + c.vy * u - 4.9 * u * u); cream.set(i, x, y, z, c.s, c.s, 1, .97, .92, .9 * (1 - clamp((u - 1.6) / .9)), c.a); });
      cream.sortBy(camera); cream.commit(scene.fog);
    },
  };
}

// —— the police car: comes up from the east, stops by the bakery; the cake lands on it; its lights blink on, weakly ——
export function makePolice(scene) {
  const c = carBody(scene, { col: '#1d4fd8', len: 4.5, h: .6, cabH: .7, cabL: 2.3, roof: mat('#f7f7f4') });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshStandardMaterial({ map: signTex('POLICE', '#1d4fd8', '#fff'), roughness: .5 }));
  plate.rotation.set(-Math.PI / 2, 0, Math.PI); plate.position.set(0, 1.71, -.4); c.i.add(plate);
  const bl = glow(.4, .8, 4), rd = glow(4, .4, .3), off = mat('#30343c'), blw = glow(.2, .35, 1.4), rdw = glow(1.4, .2, .15);
  const L = box(.7, .22, .32, bl, -.4, 1.82, .4, c.i), Rr = box(.7, .22, .32, rd, .4, 1.82, .4, c.i);
  return {
    draw(t) {
      const arrive = T.copStop, x = COP.stop.x + Math.max(0, arrive - t) * 13 + Math.max(0, arrive - t) ** 2 * 1.5, z = t < arrive - 1.2 ? LANE.wb : lerp(LANE.wb, COP.stop.z, ss(seg(t, arrive - 1.2, arrive)));
      c.g.position.set(x, t < arrive - 8 ? -50 : 0, z); c.g.rotation.y = -Math.PI / 2 + (t > arrive - 1.2 && t < arrive ? -.25 * Math.sin(seg(t, arrive - 1.2, arrive) * Math.PI) : 0);
      const f = Math.floor(t * 6) % 2, weak = t > T.cakeHit;
      L.material = f ? (weak ? blw : bl) : off; Rr.material = f ? off : (weak ? rdw : rd);
      if (weak) { const k = Math.floor(t * 1.5) % 3 === 0; L.material = k ? blw : off; Rr.material = k ? off : rdw; }
      c.ws.forEach(w => { w.rotation.x = -x * 2; });
    },
  };
}

// —— the white convertible arriving at the very end (westbound, under the scaffold) ——
export function makeConvertible(scene) {
  const c = carBody(scene, { col: '#fbfaf6', len: 4.6, h: .6, cab: false });
  box(1.7, .5, .06, mat('#13161b', { roughness: .1 }), 0, 1.2, .55, c.i); box(1.7, .2, 1.8, mat('#c9503a'), 0, .95, -.5, c.i);   // windscreen, red seats
  const pose = t => ({ x: BUCKET2.x - 1.2 + Math.max(0, T.fall2 + 1.6 - t) * 9, z: LANE.wb });
  return {
    draw(t) { const p = pose(t); c.g.position.set(p.x, t < 54 ? -50 : 0, p.z); c.g.rotation.y = -Math.PI / 2; c.ws.forEach(w => { w.rotation.x = -p.x * 2; }); },
    pose,
  };
}

// —— plaza life: café umbrellas and tables, strollers, pigeons on the ground; people cheer/jump at the big moments ——
export function makePlaza(scene) {
  const rnd = mulberry(44), R = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
  const PC = ['#e8463a', '#2f6fd0', '#f2b72e', '#3f9a5a', '#e27fb0', '#8bc6e8', '#f07f2c', '#7a3fc4', '#f4f1ea'];
  const umb = [], ppl = [];
  for (let i = 0; i < 60; i++) { const x = R(18, 158), z = R(272, 336); umb.push({ x, z, c: pick(['#d8342a', '#fbfaf6', '#2f6fd0', '#2c9a7a', '#f2b72e']) }); }
  for (let i = 0; i < 380; i++) ppl.push({ x: R(16, 160), z: R(271, 338), c: pick(PC), ph: R(0, 9), w: R(-.6, .6), wz: R(-.4, .4) });
  const std = (o = {}) => patchCloud(new THREE.MeshStandardMaterial({ roughness: .6, ...o }));
  const u1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, .55, 10).translate(0, 2.4, 0), std(), umb.length), u2 = new THREE.InstancedMesh(new THREE.CylinderGeometry(.55, .55, .08, 10).translate(0, .78, 0), std({ color: '#f1ede4' }), umb.length);
  umb.forEach((u, i) => { M.compose(P.set(u.x, 0, u.z), Q.identity(), Sc.set(1, 1, 1)); u1.setMatrixAt(i, M); u2.setMatrixAt(i, M); u1.setColorAt(i, C.set(u.c)); });
  const pm = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), std({ roughness: .7 }), ppl.length);
  ppl.forEach((p, i) => pm.setColorAt(i, C.set(p.c)));
  const trees = []; for (let i = 0; i < 34; i++) trees.push({ x: R(18, 158), z: R(286, 338), r: R(2.2, 3.4) });
  const tr = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), patchCloud(new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true })), trees.length);
  trees.forEach((q, i) => { M.compose(P.set(q.x, q.r * 1.1 + .4, q.z), Q.identity(), Sc.set(q.r, q.r * .9, q.r)); tr.setMatrixAt(i, M); tr.setColorAt(i, C.set(pick(['#4f9a35', '#5fa83c', '#3e8a35', '#6aae42']))); });
  [u1, u2, pm, tr].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); });
  const big = [T.splat, T.hydrant, T.smash, T.cakeHit];
  return {
    draw(t) {
      const cheer = big.reduce((a, b) => Math.max(a, t > b && t < b + 2.5 ? 1 : 0), 0);
      ppl.forEach((p, i) => { const x = p.x + Math.sin(t * .3 + p.ph) * 3 * p.w, z = p.z + Math.cos(t * .25 + p.ph) * 2 * p.wz; M.compose(P.set(x, .12 + (cheer ? Math.max(0, Math.sin(t * 9 + p.ph)) * .4 : 0), z), Q.identity(), Sc.set(1, 1, 1)); pm.setMatrixAt(i, M); });
      pm.instanceMatrix.needsUpdate = true;
    },
  };
}
