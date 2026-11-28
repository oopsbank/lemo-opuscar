// Midnight Crossing — everything that moves or lights up: lights, the clock, signals, barriers, people, pigeons, cars, the ghost
// train, the shadow, the umbrella, the coat, the manhole lid and its eyes, the curtain, the balcony, neon, rain, steam, spray.
import * as THREE from 'three';
import { canvasTex, makeSprites, puffTex, dotTex } from './sprites.js';
import { clamp, seg, lerp, ss, eio, eo, ei, hash, vnoise, monotone, mulberry } from '/core/lib.js';
import { T, ROAD, EWR, RAIL, BAR, SIG, CART, SHELTER, GIRL, VEND, LAMP, HOLE, STORE, BLK, MAN, COAT, UMB, TRAIN, noseX, walkerPos } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const sph = (r, mat, x = 0, y = 0, z = 0, s = 12) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, s, s >> 1), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, s = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, s), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
export const flashOn = t => t > T.sig && t < T.sigOff;
export const lampOn = t => !((t > T.flick1 && t < T.flick1 + .16) || (t > T.flick2 && t < T.flick2 + .2));

// —— lights ——
export function makeLights(scene) {
  scene.add(new THREE.HemisphereLight('#4a66a0', '#141822', 1.9));
  const moon = new THREE.DirectionalLight('#9db6e8', 1.0); moon.position.set(-30, 60, -20); scene.add(moon);
  const lamp = new THREE.SpotLight('#ffb15c', 140, 24, .85, .5, 1.5); lamp.position.set(LAMP.hx, LAMP.h - .3, LAMP.hz); lamp.target.position.set(LAMP.hx + .6, 0, LAMP.hz - 7.5);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -.0006; lamp.shadow.radius = 3; scene.add(lamp, lamp.target);
  const cart = new THREE.PointLight('#ffa04a', 26, 9, 1.4); cart.position.set(CART.x, 2.3, CART.z); scene.add(cart);
  const vend = new THREE.PointLight('#58dcff', 14, 6.5, 1.5); vend.position.set(VEND.x, 1.2, VEND.z + 1); scene.add(vend);
  const store = new THREE.PointLight('#e4ecff', 22, 8, 1.5); store.position.set(STORE.x1 + 1.2, 2.2, 15.5); scene.add(store);
  const sigL = SIG.map(s => { const l = new THREE.PointLight('#ff2a1a', 0, 7, 1.6); l.position.set(s.x + (s.x < 0 ? .6 : -.6), 2.6, s.z); scene.add(l); return l; });
  const neon = new THREE.PointLight('#ff4fb8', 6, 9, 1.5); neon.position.set(10.6, 9.5, BLK.z1 + 1.4); scene.add(neon);
  const head = new THREE.SpotLight('#d6f2ff', 0, 40, .5, .5, 1.2); head.target.position.set(0, 0, 0); scene.add(head, head.target);
  const ghost = new THREE.PointLight('#7fd4ff', 0, 14, 1.4); scene.add(ghost);
  return {
    lamp, cart, vend, store, sigL, neon, head, ghost,
    draw(t) {
      lamp.intensity = lampOn(t) ? 140 : 4;
      const ph = Math.floor((t - T.sig) * 3) % 2;
      sigL.forEach((l, i) => { l.intensity = flashOn(t) ? (ph === i ? 16 : 3) : 0; });
      neon.intensity = 6 * (.6 + .4 * vnoise(t * 7)) * (hash(Math.floor(t * 9)) > .93 ? .2 : 1);
      cart.intensity = 26 * (1 + .05 * Math.sin(t * 13));
      const nx = noseX(t);
      head.intensity = t > T.light && t < T.tail + 1 ? 380 * ss(seg(t, T.light, T.enter)) : 0;
      head.position.set(Math.max(-30, nx), 2.4, RAIL.z); head.target.position.set(nx + 20, 0, RAIL.z); head.target.updateMatrixWorld();
      ghost.intensity = t > T.enter - .5 && t < T.tail ? 30 : 0; ghost.position.set(clamp(nx - 12, -14, 14), 3, RAIL.z + 2);
    },
  };
}
// —— the LED clock on the store, and the neon HOTEL sign ——
export function makeSigns(scene) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const g = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const digit = (d, x, y, w, h, on) => {
    const s = 14, P = { a: [x + s, y, w - 2 * s, s], b: [x + w - s, y + s, s, h / 2 - s], c: [x + w - s, y + h / 2, s, h / 2 - s], d: [x + s, y + h - s, w - 2 * s, s], e: [x, y + h / 2, s, h / 2 - s], f: [x, y + s, s, h / 2 - s], g: [x + s, y + h / 2 - s / 2, w - 2 * s, s] };
    for (const k of 'abcdefg') { g.fillStyle = SEG[d].includes(k) ? on : '#2a0606'; const r = P[k]; g.fillRect(...r); }
  };
  let last = '';
  const draw = (str, colon) => { const key = str + colon; if (key === last) return; last = key;
    g.fillStyle = '#120202'; g.fillRect(0, 0, 512, 192); g.strokeStyle = '#3a3a3a'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 182);
    const xs = [40, 140, 290, 390]; [...str.replace(':', '')].forEach((d, i) => digit(+d, xs[i], 36, 82, 120, '#ff2b1c'));
    g.fillStyle = colon ? '#ff2b1c' : '#2a0606'; g.fillRect(246, 70, 18, 18); g.fillRect(246, 112, 18, 18); tex.needsUpdate = true; };
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.35), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  panel.position.set((STORE.x0 + STORE.x1) / 2 + .6, STORE.h + 1.45, STORE.z0 + 1.6); panel.rotation.x = -.62; scene.add(panel);
  const frame = box(3.8, 1.5, .12, std('#222'), 0, 0, -.07); frame.castShadow = false; panel.add(frame);
  const leg = box(.12, 1.2, .12, std('#333'), (STORE.x0 + STORE.x1) / 2 + .6, STORE.h + .6, STORE.z0 + 1.9); scene.add(leg);
  // neon HOTEL, vertical, on the east block's facade
  const nv = canvasTex(128, 640, (g2, w, h) => { g2.fillStyle = '#0b0b16'; g2.fillRect(0, 0, w, h); g2.strokeStyle = '#3fd0ff'; g2.lineWidth = 8; g2.strokeRect(10, 10, w - 20, h - 20);
    g2.fillStyle = '#ff5ec8'; g2.font = 'bold 104px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; [...'HOTEL'].forEach((c, i) => g2.fillText(c, w / 2, 80 + i * 120)); });
  const nmat = new THREE.MeshBasicMaterial({ map: nv, toneMapped: false, color: '#ffffff' });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 5.4), nmat); neon.position.set(10.6, 8.4, BLK.z1 + .5); neon.rotation.x = -.35; scene.add(neon);
  return { clockPos: panel.position, neonPos: neon.position,
    draw(t) { draw(t < T.clock ? '23:59' : '00:00', (t % 1) < .5);
      const f = (.65 + .35 * vnoise(t * 7)) * (hash(Math.floor(t * 9)) > .93 ? .25 : 1); nmat.color.setScalar(f * 1.6); } };
}
// —— signals (two posts, crossbuck, two red lamps each) and the barriers ——
export function makeCrossing(scene) {
  const out = { lamps: [] };
  const stripe = canvasTex(512, 32, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#111' : '#ffd21c'; g.fillRect(i * 32, 0, 32, h); } });
  const red = () => new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff2010', emissiveIntensity: 0 });
  SIG.forEach((s, i) => {
    const grp = new THREE.Group(); grp.position.set(s.x, 0, s.z); scene.add(grp);
    grp.add(cyl(.08, .08, 3.4, std('#ddd'), 0, 1.85, 0, 8));
    for (const a of [.7, -.7]) { const cb = box(1.3, .18, .04, std('#f2f2f2', { emissive: '#222' }), 0, 3.1, 0); cb.rotation.z = a; grp.add(cb); }
    const bar = box(1.1, .1, .1, std('#222'), 0, 2.55, 0); grp.add(bar);
    const L = [red(), red()]; for (const [k, dx] of [[0, -.45], [1, .45]]) { grp.add(box(.36, .36, .14, std('#111'), dx, 2.55, .05)); const l = sph(.13, L[k], dx, 2.55, .14, 10); grp.add(l); out.lamps.push({ mat: L[k], pos: V(s.x + dx, 2.55, s.z + .14), k }); }
    grp.rotation.y = s.x < 0 ? .5 : -.5;
  });
  const bars = ['s', 'n'].map(k => {
    const B = BAR[k], piv = new THREE.Group(); piv.position.set(B.x, .95, B.z); scene.add(piv);
    scene.add(box(.4, 1.1, .4, std('#e8e8e8'), B.x, .7, B.z));
    const arm = new THREE.Mesh(new THREE.BoxGeometry(B.len, .13, .1), new THREE.MeshStandardMaterial({ map: stripe, roughness: .5, emissive: '#211a00' }));
    arm.position.x = B.dir * B.len / 2; arm.castShadow = true; piv.add(arm);
    for (let j = 1; j < 4; j++) { const r = sph(.06, new THREE.MeshStandardMaterial({ color: '#600', emissive: '#ff2010', emissiveIntensity: 0 }), B.dir * B.len * j / 4, .1, 0, 6); arm.add(r); out.lamps.push({ mat: r.material, arm: r, k: j % 2 }); }
    return { piv, B };
  });
  out.barAngle = t => {   // 0 = down, 1 = up
    if (t < T.bar0) return 1; if (t < T.bar1) { const u = seg(t, T.bar0, T.bar1); return 1 - u * u; }
    if (t < T.up0) { const u = t - T.bar1; return Math.abs(Math.sin(u * 14)) * Math.exp(-u * 9) * .05; }
    return ss(seg(t, T.up0, T.up1));
  };
  out.draw = t => {
    const a = out.barAngle(t); bars.forEach(({ piv, B }) => { piv.rotation.z = B.dir * a * Math.PI * .47; });
    const ph = Math.floor((t - T.sig) * 3) % 2;
    out.lamps.forEach(l => { l.mat.emissiveIntensity = flashOn(t) ? (ph === l.k ? 9 : .25) : 0; });
  };
  out.phase = t => Math.floor((t - T.sig) * 3) % 2;
  return out;
}
// —— toy people ——
export function figure({ coat = null, top = '#3b4a5e', legs = '#222', skin = '#e7b892', hair = '#1c1712', hood = null, dress = null, mat = null, h = 1 } = {}) {
  const M = c => mat || std(c, { roughness: .6 });
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const hip = .72 * h, P = {};
  for (const [k, dx] of [['legL', -.09], ['legR', .09]]) { const p = new THREE.Group(); p.position.set(dx, hip, 0); const l = box(.13, hip, .15, M(legs), 0, -hip / 2, 0); p.add(l); body.add(p); P[k] = p; }
  if (dress) { const c = cyl(.17, .36, .78, M(dress), 0, hip + .02, 0, 14); body.add(c); body.add(cyl(.15, .2, .55, M(dress), 0, hip + .62, 0, 12)); }
  else if (coat) { const c = cyl(.21, .36, 1.0, M(coat), 0, hip + .16, 0, 14); body.add(c); }
  else body.add(cyl(.19, .23, .66, M(top), 0, hip + .33, 0, 12));
  for (const [k, dx] of [['armL', -.25], ['armR', .25]]) { const p = new THREE.Group(); p.position.set(dx, hip + .6, 0); const a = box(.1, .58, .12, M(coat || dress || top), 0, -.28, 0); p.add(a); body.add(p); P[k] = p; }
  const head = new THREE.Group(); head.position.set(0, hip + .86, 0); body.add(head); P.head = head;
  head.add(sph(.17, M(skin), 0, 0, 0, 14));
  if (hood) { const hd = sph(.2, M(hood), 0, .03, -.02, 14); hd.scale.set(1, 1.05, 1.05); head.add(hd); const fc = sph(.135, M(skin), 0, -.01, .08, 12); head.add(fc); }
  else { const hr = sph(.175, M(hair), 0, .05, -.03, 14); hr.scale.set(1, .9, 1); head.add(hr); }
  Object.assign(g, { P, body }); g.scale.setScalar(1.35);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function walkCycle(f, ph, amp = .5) { const s = Math.sin(ph); f.P.legL.rotation.x = s * amp; f.P.legR.rotation.x = -s * amp; f.P.armL.rotation.x = -s * amp * .7; f.P.armR.rotation.x = s * amp * .7; f.body.position.y = Math.abs(Math.cos(ph)) * .03; }
export function stand(f) { for (const k of ['legL', 'legR', 'armL', 'armR']) f.P[k].rotation.set(0, 0, 0); f.body.position.y = 0; }

export function makePeople(scene) {
  // the walker in the yellow raincoat
  const yel = std('#ffd21a', { roughness: .35, emissive: '#3a2a00' });
  const walker = figure({ coat: '#ffd21a', hood: '#ffd21a', legs: '#2a2f3a', mat: null });
  walker.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.material.color.getHexString() === 'ffd21a') o.material = yel; } });
  scene.add(walker);
  // the girl in red with a clear umbrella
  const girl = figure({ dress: '#d8191f', legs: '#e7b892', hair: '#16110d' }); scene.add(girl);
  const umb = new THREE.Group(); const canopy = new THREE.Mesh(new THREE.SphereGeometry(.85, 16, 8, 0, Math.PI * 2, 0, Math.PI * .42), new THREE.MeshStandardMaterial({ color: '#e8f4ff', transparent: true, opacity: .35, roughness: .05, depthWrite: false, side: THREE.DoubleSide }));
  canopy.position.y = .5; umb.add(canopy); const shaft = cyl(.015, .015, 1.15, std('#ccc'), 0, 0, 0, 6); umb.add(shaft); const hook = box(.04, .14, .04, std('#333'), 0, -.6, .03); umb.add(hook);
  scene.add(umb);
  // the cook and three diners
  const cook = figure({ top: '#f0f0ea', legs: '#2b2b2b', hair: '#222' }); cook.position.set(CART.x - .3, 0, CART.z - .95); scene.add(cook);
  const diners = [[-10.2, 5.65, Math.PI, '#3d6b4a'], [-10.9, 5.0, Math.PI / 2, '#6a4a7a'], [-7.4, 5.9, Math.PI, '#5a5550']].map(([x, z, yaw, c]) => {
    const f = figure({ top: c, legs: '#2a2a33' }); f.position.set(x, -.52, z); f.rotation.y = yaw; f.P.legL.rotation.x = f.P.legR.rotation.x = -1.4; f.P.armL.rotation.x = f.P.armR.rotation.x = -1.1; f.body.rotation.x = .25; scene.add(f); return f; });
  // the figure on the balcony (backlit, dark)
  const sil = std('#0a0b10', { roughness: 1 });
  const watcher = figure({ mat: sil }); watcher.position.set(-10.1, 2 * BLK.fl + .18, BLK.z1 - .3); scene.add(watcher);
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.1), new THREE.MeshBasicMaterial({ color: '#ffcf8a', toneMapped: false })); doorLight.position.set(-10.1, 2 * BLK.fl + 1.25, BLK.z1 + .03); scene.add(doorLight);
  const door = box(1.0, 2.1, .06, std('#3a2d24'), 0, 0, 0); const doorPiv = new THREE.Group(); doorPiv.position.set(-10.6, 2 * BLK.fl + 1.25, BLK.z1 + .07); door.position.x = .5; doorPiv.add(door); scene.add(doorPiv);
  const balc = new THREE.PointLight('#ffb870', 0, 5, 1.6); balc.position.set(-10.1, 2 * BLK.fl + 1.5, BLK.z1 + .8); scene.add(balc);
  // the shadow man (black, flat, no light)
  const black = new THREE.MeshBasicMaterial({ color: '#030304', transparent: true, opacity: 1 });
  const shadowMan = figure({ coat: '#000', hood: '#000', mat: black }); shadowMan.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(shadowMan);
  // the flat coat
  const coat = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CircleGeometry(.5, 16), yel); c.rotation.x = -Math.PI / 2; c.scale.set(1, 1.5, 1); coat.add(c);
    const hd = new THREE.Mesh(new THREE.CircleGeometry(.24, 12), yel); hd.rotation.x = -Math.PI / 2; hd.position.set(0, .01, -.78); coat.add(hd);
    for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(.22, .7), yel); sl.rotation.x = -Math.PI / 2; sl.rotation.z = s * .9; sl.position.set(s * .55, .005, -.25); coat.add(sl); } }
  scene.add(coat);
  // passers-by at the end (umbrellas)
  const passers = [['#2f4a6a', '#1f3fae'], ['#5a3a2a', '#1a1a1a'], ['#444', '#3a7a4a']].map(([c, u]) => {
    const f = figure({ top: c }); const ub = new THREE.Mesh(new THREE.SphereGeometry(.62, 14, 6, 0, Math.PI * 2, 0, Math.PI * .42), std(u, { side: THREE.DoubleSide })); ub.position.set(.15, 1.95, 0); ub.castShadow = true; f.add(ub); scene.add(f); return f; });

  const umbPos = t => {
    // in her hand → tilt & shake → dropped at her feet → rolled east by the train's gust → picked up → handed back
    if (t < T.drop) return null;
    if (t < T.drop + .45) { const u = seg(t, T.drop, T.drop + .45); return { x: lerp(GIRL.x + .3, UMB.drop.x, u), y: lerp(1.3, .45, u * u), z: lerp(GIRL.z + .2, UMB.drop.z, u), rx: lerp(0, 1.45, u), rz: 0 }; }
    const r = eo(seg(t, T.enter + 1.0, T.enter + 2.4)); const rr = seg(t, T.enter + 1.0, T.enter + 2.4);
    if (t < T.pick) return { x: lerp(UMB.drop.x, UMB.rest.x, r), y: .45, z: lerp(UMB.drop.z, UMB.rest.z, r), rx: 1.45, rz: 0, spin: rr * 6 };
    return null;
  };
  const shPath = [[MAN.x, MAN.z], [-1, 1.7], [4, 2.0], [UMB.rest.x - .7, UMB.rest.z - .1]];
  const shPos = t => {
    if (t < T.sh0) return { x: MAN.x, z: MAN.z, yaw: 0, walk: 0 };
    if (t < T.sh1) { const u = eio(seg(t, T.sh0, T.sh1)), L = shPath.length - 1, k = Math.min(L - 1, Math.floor(u * L)), f = u * L - k, a = shPath[k], b = shPath[k + 1];
      return { x: lerp(a[0], b[0], f), z: lerp(a[1], b[1], f), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), walk: 1 }; }
    const end = shPath[shPath.length - 1];
    if (t < T.hand) return { x: end[0], z: end[1], yaw: Math.PI / 2, walk: 0 };
    if (t < T.away0) { const u = eio(seg(t, T.hand - .6, T.hand)); return { x: lerp(end[0], GIRL.x + .75, u), z: lerp(end[1], GIRL.z + 1.0, u), yaw: -Math.PI * .8, walk: u < 1 ? 1 : 0 }; }
    const u = seg(t, T.away0, T.away1); return { x: lerp(GIRL.x + .75, 13.5, u), z: lerp(GIRL.z + 1.0, 5.4, ss(u)), yaw: Math.PI / 2, walk: 1 };
  };
  return {
    walker, girl, shadowMan, umbPos,
    draw(t, frame) {
      // the walker
      const w = walkerPos(t); walker.position.set(w.x, 0, w.z);
      if (w.moving) { walker.rotation.y = w.yaw; walkCycle(walker, (t - T.walk0) * 7.2, .45); } else { stand(walker); walker.rotation.y = Math.PI; }
      if (t > T.arrive) {   // stuck: he looks left, right, left, right
        const look = t < T.lookL ? 0 : t < T.lookR ? -.9 : t < T.lookL2 ? .9 : t < T.lookR2 ? -.8 : .7;
        const tgt = t < T.lookL ? 0 : look; walker.P.head.rotation.y = lerp(walker.P.head.rotation.y || 0, tgt, .35);
        walker.P.head.rotation.y = tgt * ss(seg(t % 2, 0, .4) + (t > T.lookL ? 1 : 0));
        if (t > T.light) walker.P.head.rotation.y = -1.2;   // toward the light
        walker.rotation.y = Math.PI + (t > T.push0 ? Math.sin(t * .7) * .04 : 0);
      }
      let wv = 1; if (t > T.vanish0) { const k = seg(t, T.vanish0, T.vanish1); wv = hash(frame * 1.37 + 3) > k * 1.15 ? 1 : 0; if (t > T.vanish1) wv = 0; }
      walker.visible = wv > 0;
      if (t > T.vanish0 && t < T.vanish1) walker.scale.set(1.35, 1.35 * (1 - .15 * seg(t, T.vanish0, T.vanish1)), 1.35);
      // the coat drops, then the gust slides it onto the road
      coat.visible = t > T.coat; if (coat.visible) { const s = seg(t, T.gust, T.gust + .7), e = eo(s); coat.position.set(lerp(MAN.x, COAT.x, e), .2, lerp(MAN.z, COAT.z, e)); coat.rotation.y = lerp(.4, 1.1, e); const d = seg(t, T.coat, T.coat + .2); coat.scale.set(1, 1, lerp(.7, 1, d)); }
      // the girl: shakes her umbrella at T.flick; steps back at T.step; takes the umbrella back and nods
      girl.position.set(GIRL.x - .35 * eo(seg(t, T.step, T.step + .35)) * (t < T.hand ? 1 : 1), 0, GIRL.z - .25 * eo(seg(t, T.step, T.step + .35)));
      girl.rotation.y = t > T.step && t < T.hand + .3 ? Math.PI * .85 : -.15;
      girl.P.armR.rotation.x = t < T.drop || t > T.hand ? -.6 : -.1;
      girl.P.head.rotation.x = t > T.nod && t < T.nod + .55 ? Math.sin(seg(t, T.nod, T.nod + .55) * Math.PI) * .45 : 0;
      girl.P.head.rotation.y = t > T.reach - 1.5 && t < T.step ? -.6 : 0;
      // the cook stirs (freezes 12.2 → 52.8)
      const stir = t < T.smoke || t > T.stir; cook.P.armR.rotation.x = stir ? -1.0 + Math.sin(t * 5) * .35 : -1.0; cook.P.armR.rotation.z = stir ? Math.cos(t * 5) * .3 : 0;
      cook.P.head.rotation.x = stir ? .35 : (t > T.sig + .3 ? -.15 : .35); cook.rotation.y = stir ? 0 : (t > T.sig + .3 && t < T.stir ? .5 : 0);
      diners.forEach((d, i) => { const eat = t < T.smoke || t > T.stir; d.P.head.rotation.x = eat ? .3 + Math.max(0, Math.sin(t * 2.2 + i * 2)) * .3 : (t > T.sig + .4 + i * .2 ? -.25 : .3); d.P.armR.rotation.x = eat ? -1.1 - Math.max(0, Math.sin(t * 2.2 + i * 2)) * .6 : -1.0; });
      // the balcony: the door opens and a figure steps out and stares down
      const od = ss(seg(t, T.door, T.door + .9)); doorPiv.rotation.y = -od * 1.7; doorLight.visible = od > 0; doorLight.material.color.setRGB(1 * od, .8 * od, .55 * od); balc.intensity = 5 * od;
      watcher.visible = t > T.figure; if (watcher.visible) { const s = eio(seg(t, T.figure, T.figure + 1.4)); watcher.position.z = lerp(BLK.z1 - .2, BLK.z1 + .55, s); watcher.rotation.y = 0; watcher.P.head.rotation.x = .5 * s;
        if (s < 1) walkCycle(watcher, t * 6, .3); else stand(watcher); }
      // the shadow man: rises from the ground, waits, crosses, picks up the umbrella, hands it over, walks off and fades
      shadowMan.visible = t > T.rise0 && t < T.away1 + .2;
      if (shadowMan.visible) {
        const p = shPos(t); shadowMan.position.set(p.x, 0, p.z);
        const r = eio(seg(t, T.rise0, T.rise1));
        const d0 = Math.atan2(MAN.x - LAMP.hx, MAN.z - LAMP.hz);   // direction the shadow lies (away from the lamp)
        if (t < T.sh0) { shadowMan.rotation.set(0, 0, 0); shadowMan.rotation.order = 'YXZ'; shadowMan.rotation.y = d0; shadowMan.rotation.x = (1 - r) * Math.PI / 2 * .995; }
        else { shadowMan.rotation.set(0, p.yaw, 0); }
        if (p.walk) walkCycle(shadowMan, t * 8.5, .65); else stand(shadowMan);
        if (t > T.pick - .2 && t < T.pick + .6) { const b = Math.sin(seg(t, T.pick - .2, T.pick + .6) * Math.PI); shadowMan.body.rotation.x = b * .9; shadowMan.P.armR.rotation.x = -b * 1.2; } else shadowMan.body.rotation.x = 0;
        if (t > T.hand - .5 && t < T.away0) shadowMan.P.armR.rotation.x = -1.2;
        black.opacity = 1 - .85 * seg(t, T.away0 + 1.6, T.away1);
      }
      const up = umbPos(t);
      if (!up) {
        const held = t < T.drop || t > T.hand; umb.visible = held || (t > T.pick && t <= T.hand);
        if (t < T.drop || t > T.hand) {   // in her hand, over her head; a little shake at T.flick
          const sh = t > T.flick && t < T.flick + .7 ? Math.sin((t - T.flick) * 40) * .2 * (1 - seg(t, T.flick, T.flick + .7)) : 0;
          const p = V(.28, 1.95, .05).applyAxisAngle(V(0, 1, 0), girl.rotation.y).add(girl.position); umb.position.copy(p); umb.rotation.set(-.15 + sh, girl.rotation.y, .15 + sh * .5);
        } else {   // in the shadow's hand
          const s = shadowMan.position, held2 = V(.35, .9, .25).applyAxisAngle(V(0, 1, 0), shadowMan.rotation.y).add(s);
          umb.position.copy(held2); umb.rotation.set(.3, 0, 1.2 * (1 - seg(t, T.hand - .5, T.hand)));
        }
      } else { umb.visible = true; umb.position.set(up.x, up.y, up.z); umb.rotation.set(up.rx, up.spin || 0, up.rz); }
      // passers-by walk east along the north pavement at the end (the shadow joins them)
      passers.forEach((f, i) => { const t0 = 58.6 + i * .8; const u = (t - t0) / 6.2; f.visible = u > 0 && u < 1; f.position.set(lerp(3.8, 15, u) + (i === 1 ? -1.8 : 0), 0, 5.35 + (i - 1) * .3); f.rotation.y = Math.PI / 2; walkCycle(f, t * 6.5 + i, .4); });
    },
  };
}
// —— pigeons (8, on the east block's parapet; they burst off at midnight) ——
export function makePigeons(scene) {
  const grey = std('#8d939c'), dark = std('#4b5058'), R = mulberry(7);
  const birds = Array.from({ length: 8 }, (_, i) => {
    const g = new THREE.Group(); const b = sph(.17, grey, 0, 0, 0, 10); b.scale.set(1, .8, 1.5); g.add(b); g.add(sph(.09, dark, 0, .12, .2, 8));
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(.38, .2), std('#7b818a', { side: THREE.DoubleSide })); wl.rotation.x = -Math.PI / 2; wl.position.x = -.2; const pl = new THREE.Group(); pl.add(wl); g.add(pl);
    const wr = wl.clone(); wr.position.x = .2; const pr = new THREE.Group(); pr.add(wr); g.add(pr);
    const x = 6.2 + i * 1.25 + R() * .4, y = BLK.h + .78, z = BLK.z1 - .12; g.position.set(x, y, z); g.scale.setScalar(1.3); scene.add(g);
    return { g, pl, pr, x, y, z, d: R() * .35, vx: (R() - .5) * 5, vz: -2 - R() * 3, vy: 4 + R() * 3, ph: R() * 6 };
  });
  return { draw(t) { for (const b of birds) {
    const u = t - (T.pige + b.d);
    if (u < 0) { b.g.position.set(b.x, b.y, b.z); b.g.rotation.set(0, Math.PI + Math.sin(t * .8 + b.ph) * .4, 0); b.pl.rotation.z = b.pr.rotation.z = 0; b.g.children[1].position.y = .12 + Math.max(0, Math.sin(t * 1.3 + b.ph)) * .04; b.g.visible = true; continue; }
    b.g.position.set(b.x + b.vx * u, b.y + b.vy * u + 1.2 * u * u, b.z + b.vz * u); b.g.rotation.set(-.4, Math.atan2(b.vx, b.vz), 0);
    const f = Math.sin(u * 32 + b.ph) * .9; b.pl.rotation.z = f; b.pr.rotation.z = -f; b.g.visible = u < 8;
  } } };
}
// —— the apartment details: tanks, AC fan, laundry, the curtain ——
export function makeRoofs(scene) {
  const inox = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: .25, metalness: .9 });
  for (const x of [11.6, 13.9]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 2.1, 20), inox); c.rotation.x = Math.PI / 2; c.position.set(x, BLK.h + 1.45, -13.2); c.castShadow = true; scene.add(c);
    scene.add(box(1.2, .7, .12, std('#555'), x, BLK.h + .35, -12.4)); scene.add(box(1.2, .7, .12, std('#555'), x, BLK.h + .35, -14)); }
  const ac = new THREE.Group(); ac.position.set(-7.4, BLK.h + .55, -10.2); scene.add(ac); ac.add(box(1.3, 1.0, .7, std('#cfd2d4'), 0, 0, 0));
  const fan = new THREE.Group(); fan.position.set(0, 0, .37); ac.add(fan); for (let k = 0; k < 3; k++) { const bl = box(.75, .14, .02, std('#333'), 0, 0, 0); bl.rotation.z = k * 2.09; fan.add(bl); }
  scene.add(box(.06, 1.8, .06, std('#555'), -15.6, BLK.h + .9, -12.6)); scene.add(box(.06, 1.8, .06, std('#555'), -9.4, BLK.h + .9, -12.6));
  const cols = ['#e04a4a', '#3a7be0', '#f2d23a', '#ffffff', '#40b070', '#e07ad0', '#ff8a3a', '#8a5ae0'], clothes = [];
  for (let i = 0; i < 8; i++) { const w = .4 + (i % 3) * .15, h = .5 + (i % 2) * .3; const cl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std(cols[i], { side: THREE.DoubleSide })); cl.geometry.translate(0, -h / 2, 0); const p = new THREE.Group(); p.position.set(-15.2 + i * .75, BLK.h + 1.75, -12.6); p.add(cl); cl.castShadow = true; scene.add(p); clothes.push(p); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-15.6, BLK.h + 1.78, -12.6), V(-9.4, BLK.h + 1.78, -12.6)]), new THREE.LineBasicMaterial({ color: '#222' })); scene.add(line);
  // the curtain blowing out of the lit floor-3 window (east block)
  const cg = new THREE.PlaneGeometry(.75, 1.45, 1, 10); cg.translate(0, -.72, 0); const cpos = cg.getAttribute('position'), base = cpos.array.slice();
  const curtain = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: '#f3e3c8', emissive: '#6b4a20', emissiveIntensity: .8, side: THREE.DoubleSide, transparent: true, opacity: .9 })); curtain.position.set(10.9, 8.78, BLK.z1 + .05); scene.add(curtain);
  return { draw(t) {
    fan.rotation.z = t * 2.2;
    clothes.forEach((p, i) => { p.rotation.x = .25 + Math.sin(t * 1.6 + i) * .18; });
    for (let i = 0; i < cpos.count; i++) { const y = base[i * 3 + 1], k = -y / 1.45; cpos.setZ(i, k * k * (.5 + .35 * Math.sin(t * 2.1 + k * 2)) + k * .2); cpos.setX(i, base[i * 3] + Math.sin(t * 3.1 + k * 3) * .08 * k); }
    cpos.needsUpdate = true; cg.computeVertexNormals();
  } };
}
// —— cars and scooters ——
function car(scene, { body = '#f2c21a', cab = null, len = 3.5, wid = 1.6, taxi = false, truck = false }) {
  const g = new THREE.Group(), mb = std(body, { roughness: .3, metalness: .3 }), glassM = std('#1a2230', { roughness: .1, metalness: .6 });
  if (truck) { g.add(box(wid, .9, 1.4, mb, 0, .75, len / 2 - .7)); g.add(box(wid * .96, .45, .9, glassM, 0, 1.25, len / 2 - .75)); g.add(box(wid + .1, 1.5, len - 1.5, std('#2a62b8', { roughness: .6 }), 0, 1.15, -.75)); }
  else { g.add(box(wid, .55, len, mb, 0, .55, 0)); g.add(box(wid * .86, .45, len * .5, glassM, 0, 1.03, -.1)); g.add(box(wid * .84, .06, len * .46, mb, 0, 1.28, -.1)); }
  if (taxi) g.add(box(.5, .18, .22, std('#fff', { emissive: '#fff4c0', emissiveIntensity: 1.5 }), 0, 1.4, -.1));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(.28, .28, .2, std('#111'), sx * wid / 2, .3, sz * len * .32, 10).rotateZ(Math.PI / 2));
  const hl = new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false }), tl = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false });
  for (const sx of [-1, 1]) { g.add(box(.3, .14, .05, hl, sx * wid * .32, .65, len / 2 + .02)); g.add(box(.3, .12, .05, tl, sx * wid * .34, .68, -len / 2 - .02)); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  return Object.assign(g, { len });
}
function scooter(scene, c = '#e8402a') {
  const g = new THREE.Group(); g.add(box(.35, .45, 1.4, std(c, { roughness: .35 }), 0, .45, 0)); g.add(box(.55, .5, .55, std('#f08a1a'), 0, 1.05, -.55));
  const r = figure({ top: '#2a7a3a', legs: '#222', hair: '#111' }); r.position.set(0, .15, .05); r.P.legL.rotation.x = r.P.legR.rotation.x = -1.2; r.P.armL.rotation.x = r.P.armR.rotation.x = -1.1; r.scale.setScalar(.9); g.add(r);
  const helm = sph(.2, std('#ffd21a', { roughness: .3 }), 0, 1.56, .05); g.add(helm);
  g.add(box(.18, .1, .05, new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false }), 0, .8, .72)); g.add(box(.15, .08, .05, new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false }), 0, .7, -.72));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g); return Object.assign(g, { len: 1.4 });
}
// each vehicle: lane axis, fixed coordinate, heading, keyframes of the moving coordinate (monotone → smooth stops)
export function makeTraffic(scene) {
  const V_ = [
    { v: car(scene, { body: '#f2c21a', taxi: true }), ax: 'z', c: ROAD.nb, dir: -1, k: [[0, 26], [12, -32], [30, -140]] },
    { v: car(scene, { body: '#eef0f2', len: 3.6 }), ax: 'z', c: ROAD.nb, dir: -1, k: [[2.5, 34], [10.5, 10], [14.2, 5.7], [T.go, 5.7], [T.go + 1.6, 3.8], [62, -30]] },
    { v: scooter(scene, '#e8402a'), ax: 'z', c: ROAD.nb + .4, dir: -1, k: [[5, 40], [12, 14], [14.8, 9.2], [T.go + .6, 9.2], [T.go + 2.6, 5.5], [62.5, -24]] },
    { v: car(scene, { body: '#e7e9ec', len: 4.4, truck: true }), ax: 'z', c: ROAD.sb, dir: 1, k: [[3, -34], [10.8, -9.5], [14.4, -6.3], [T.go, -6.3], [T.go + 1.8, -3.8], [63, 30]] },
    { v: car(scene, { body: '#f2c21a', taxi: true }), ax: 'x', c: EWR.eb, dir: 1, k: [[0, -34], [9.5, -12], [13.0, -8.2], [T.go + .4, -8.2], [T.go + 2.2, -5.2], [63, 34]] },
    { v: scooter(scene, '#2a8ae8'), ax: 'x', c: EWR.wb, dir: -1, k: [[0, 30], [10.5, 12], [13.2, 8.6], [T.go + .9, 8.6], [T.go + 2.8, 5.5], [64, -30]] },
  ];
  for (const o of V_) o.f = monotone(o.k);
  return {
    list: V_,
    draw(t) { for (const o of V_) {
      const s = o.f(t), g = o.v;
      if (o.ax === 'z') { let x = o.c; if (o.c === ROAD.sb && t > T.go) x += Math.exp(-(((s - COAT.z) / 2.6) ** 2)) * 1.0; g.position.set(x, 0, s); g.rotation.y = o.dir > 0 ? 0 : Math.PI; }
      else { g.position.set(s, 0, o.c); g.rotation.y = o.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    } },
  };
}
// —— the ghost train ——
export function makeTrain(scene) {
  const grp = new THREE.Group(); scene.add(grp);
  const ghost = new THREE.MeshStandardMaterial({ color: '#a9dcff', emissive: '#2f86c0', emissiveIntensity: .9, transparent: true, opacity: .32, roughness: .2, metalness: .1, depthWrite: false });
  const winM = new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pass = new THREE.MeshBasicMaterial({ color: '#02040a', transparent: true, opacity: .9 });
  const add = (m, mat, ro) => { m.material = mat; m.renderOrder = ro; m.castShadow = false; grp.add(m); return m; };
  const L = TRAIN.loco; let x = 0;
  // loco (nose at x = 0, extends to −x)
  add(new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 4.6, 16).rotateZ(Math.PI / 2).translate(-2.6, 1.55, 0)), ghost, 3);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.3).translate(-6, 1.9, 0)), ghost, 3);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.28, .4, 1.1, 10).translate(-1.2, 2.75, 0)), ghost, 3);
  add(new THREE.Mesh(new THREE.BoxGeometry(L, .5, 2.2).translate(-L / 2, .55, 0)), ghost, 3);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.4, .7, .1).translate(-6, 2.3, 1.17)), winM, 4);
  const lampM = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }); const lamp = new THREE.Mesh(new THREE.SphereGeometry(.26, 12, 6), lampM); lamp.position.set(.05, 1.6, 0); grp.add(lamp);
  // coaches with passengers
  x = -L - TRAIN.gap; const R = mulberry(3);
  for (let i = 0; i < TRAIN.n; i++) {
    const c = TRAIN.coach, cx = x - c / 2;
    add(new THREE.Mesh(new THREE.BoxGeometry(c, 2.1, 2.3).translate(cx, 1.65, 0)), ghost, 3);
    add(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, c, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).translate(cx, 2.7, 0)), ghost, 3);
    for (let w = 0; w < 5; w++) for (const s of [-1, 1]) add(new THREE.Mesh(new THREE.PlaneGeometry(.9, .7).rotateY(s > 0 ? 0 : Math.PI).translate(cx - c / 2 + .8 + w * 1.2, 2.0, s * 1.16)), winM, 4);
    for (let w = 0; w < 5; w++) for (const s of [-.5, .5]) { const px = cx - c / 2 + .8 + w * 1.2, pz = s * 1.1; if (R() < .12) continue;
      add(new THREE.Mesh(new THREE.BoxGeometry(.34, .6, .3).translate(px, 1.55, pz)), pass, 1); add(new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 4).translate(px, 2.02, pz)), pass, 1); }
    x -= c + TRAIN.gap;
  }
  // the headlight beam (an additive cone along the rails)
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 22, 20, 1, true).rotateZ(Math.PI / 2).translate(11, 1.6, 0), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(beam);
  return { grp, draw(t) {
    const nx = noseX(t); grp.visible = t > T.enter - 1.5 && t < T.tail + .5; grp.position.set(nx, 0, RAIL.z);
    const flick = .75 + .25 * vnoise(t * 9); ghost.opacity = .3 * flick; winM.opacity = .55 * flick;
    grp.position.y = Math.sin(t * 40) * .02;
    beam.visible = t > T.light && t < T.tail; beam.position.set(nx, 0, RAIL.z); beam.material.opacity = .08 * ss(seg(t, T.light, T.enter));
    if (t < T.enter - 1.5) beam.position.x = -12.5 - 24 + 24 * ss(seg(t, T.light, T.enter));
  } };
}
// —— the shadow as ink on the ground: a silhouette strip from the feet; in 25–33 s its head crawls to the girl's shoe ——
export function makeInk(scene) {
  const N = 90, pos = new Float32Array(N * 2 * 3), idx = [];
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color: '#020203', transparent: true, opacity: .88, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 1; mesh.frustumCulled = false; scene.add(mesh);
  const head = new THREE.Mesh(new THREE.CircleGeometry(.6, 18).rotateX(-Math.PI / 2), mat); head.renderOrder = 1; scene.add(head);
  const Y = .34;
  return { draw(t, foot) {
    const vis = t < T.rise0 + .4; mesh.visible = head.visible = vis; if (!vis) return;
    const dx = foot.x - LAMP.hx, dz = foot.z - LAMP.hz, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
    const len0 = 2.1 * dl / (LAMP.h - 2.1) * .8;   // the natural shadow length
    const ext = ss(seg(t, T.ink0, T.reach)) * (1 - eio(seg(t, T.ink1, T.push1)));
    // control points: natural direction, then a long curve east and south to the girl's shoe
    const P0 = { x: foot.x, z: foot.z }, P1 = { x: foot.x + ux * len0, z: foot.z + uz * len0 };
    const tgt = { x: GIRL.x - .35, z: GIRL.z + .3 }, C = { x: P1.x + 5, z: P1.z - 1.2 };
    const bez = u => ({ x: (1 - u) ** 2 * P1.x + 2 * u * (1 - u) * C.x + u * u * tgt.x, z: (1 - u) ** 2 * P1.z + 2 * u * (1 - u) * C.z + u * u * tgt.z });
    const body = .62;   // the legs + torso part of the silhouette (fraction of len0)
    const pts = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1); let p, w;
      if (u < .5) { const k = u / .5 * body; p = { x: lerp(P0.x, P1.x, k), z: lerp(P0.z, P1.z, k) }; w = (k < .45 ? .26 + k * .3 : .44 - (k - .45) * .2) * 1.35; }
      else { const k = (u - .5) / .5; const kk = k * ext; const a = { x: lerp(P0.x, P1.x, body), z: lerp(P0.z, P1.z, body) };
        if (ext < .001) { p = { x: lerp(a.x, P1.x, k * .6), z: lerp(a.z, P1.z, k * .6) }; w = .3; }
        else { const bp = bez(kk), base = { x: lerp(a.x, P1.x, k * .6), z: lerp(a.z, P1.z, k * .6) }; const m = ss(Math.min(1, kk * 3)); p = { x: lerp(base.x, bp.x, m), z: lerp(base.z, bp.z, m) };
          w = .5 + .1 * Math.sin(k * 14 - t * 5) * ext; } }
      pts.push(p, w);
    }
    for (let i = 0; i < N; i++) {
      const p = pts[i * 2], w = pts[i * 2 + 1], q = pts[Math.min(N - 1, i + 1) * 2], r = pts[Math.max(0, i - 1) * 2];
      let tx = q.x - r.x, tz = q.z - r.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const wob = 1 + .12 * Math.sin(i * .9 + t * 6) * ext;
      pos.set([p.x - tz * w / 2 * wob, Y, p.z + tx * w / 2 * wob], i * 6); pos.set([p.x + tz * w / 2 * wob, Y, p.z - tx * w / 2 * wob], i * 6 + 3);
    }
    g.getAttribute('position').needsUpdate = true; g.computeBoundingSphere();
    const tip = pts[(N - 1) * 2]; head.position.set(tip.x, Y + .002, tip.z); head.scale.setScalar(1 + .15 * Math.sin(t * 4) * ext);
    // as the shadow stands up (43.2 s) the flat one shrinks into its feet
    const k = 1 - seg(t, T.rise0, T.rise0 + .4); mat.opacity = .88 * k;
  } };
}
// —— the manhole lid and the eyes ——
export function makeManhole(scene) {
  const tex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2b2a29'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.strokeStyle = '#4a4744'; g.lineWidth = 6;
    for (let r = 30; r < 126; r += 24) { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); } for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a * .52) * 120, 128 + Math.sin(a * .52) * 120); g.stroke(); } });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .06, 24), [std('#2b2a29', { metalness: .6, roughness: .5 }), new THREE.MeshStandardMaterial({ map: tex, metalness: .6, roughness: .45 }), std('#222')]);
  lid.receiveShadow = true; scene.add(lid);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.68, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000' })); hole.position.set(HOLE.x, .2, HOLE.z); scene.add(hole);
  const eyeM = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const eyes = new THREE.Group(); for (const dx of [-.11, .11]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 6), eyeM); e.scale.set(1, .75, 1); e.position.x = dx; eyes.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 4), new THREE.MeshBasicMaterial({ color: '#000' })); p.position.set(dx - .02, .01, -.05); eyes.add(p); }
  scene.add(eyes);
  return { draw(t) {
    const s = eo(seg(t, T.lid, T.lid + .45)); const dir = V(COAT.x - HOLE.x, 0, COAT.z - HOLE.z).normalize();
    lid.position.set(HOLE.x - dir.x * s * .38 + Math.sin(t * 60) * .01 * (s > 0 && s < 1 ? 1 : 0), .22 + s * .03, HOLE.z - dir.z * s * .38); lid.rotation.y = s * .25;
    const e = eo(seg(t, T.eyes, T.eyes + .5)); eyes.visible = t > T.eyes;
    eyes.position.set(HOLE.x + dir.x * .45, .2 + .12 * e, HOLE.z + dir.z * .45); eyes.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
    const blink = t > T.eyes + 1.0 && t < T.eyes + 1.12; eyes.scale.set(1, blink ? .15 : 1, 1);
  } };
}
// —— rain, steam, spray, ripples, and the reflections of every light on the wet road ——
export function makeFX(scene, camera, lightsOf) {
  const streak = canvasTex(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.6, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(6, 0, 4, h); });
  const glintTex = canvasTex(64, 256, (g, w, h) => { const gr = g.createRadialGradient(32, 128, 0, 32, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.save(); g.scale(1, 1); g.fillRect(0, 0, w, h); g.restore(); });
  const ringTex = canvasTex(64, 64, (g) => { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.stroke(); });
  const NR = 1800, rain = makeSprites(scene, NR, streak, { additive: true, fog: false }), RR = mulberry(11);
  const drops = Array.from({ length: NR }, () => ({ x: -14 + RR() * 28, z: -10 + RR() * 30, y0: RR() * 14, s: .8 + RR() * .5 }));
  const steam = makeSprites(scene, 40, puffTex(), {}), spray = makeSprites(scene, 160, puffTex(), {}), rip = makeSprites(scene, 120, ringTex, { additive: true }), glint = makeSprites(scene, 60, glintTex, { additive: true, fog: false });
  const RS = mulberry(5), sprayP = Array.from({ length: 160 }, () => ({ x: (RS() - .5) * 24, side: RS() < .5 ? -1 : 1, v: 2 + RS() * 4, t: RS() * 1.2, s: .5 + RS() * .8 }));
  const ripP = Array.from({ length: 120 }, () => ({ x: (RS() - .5) * 26, z: -6 + RS() * 24, ph: RS() }));
  const v = new THREE.Vector3(), cam = new THREE.Vector3();
  return { draw(t, traffic) {
    // rain: falling streaks; brighter inside the lamp's cone
    for (let i = 0; i < NR; i++) { const d = drops[i], y = 14 - ((d.y0 + t * 11 * d.s) % 14), x = d.x - (14 - y) * .12;
      const dl = Math.hypot(x - LAMP.hx, d.z - LAMP.hz), inCone = Math.max(0, 1 - dl / (1.2 + (LAMP.h - y) * .55)) * (y < LAMP.h ? 1 : 0) * (lampOn(t) ? 1 : 0);
      const a = .09 + .7 * inCone, c = inCone > .05 ? [1, .8, .55] : [.7, .8, 1];
      rain.set(i, x, y, d.z, .035, .7, c[0], c[1], c[2], a); }
    rain.commit(scene.fog);
    // steam over the pot (stops dead at midnight, back at 52.8)
    const on = t < T.smoke || t > T.stir;
    for (let i = 0; i < 40; i++) { const life = 2.6, u = ((t * .9 + i / 40 * life) % life) / life, birth = t - u * life;
      const alive = (birth < T.smoke || birth > T.stir) && (t < T.smoke + .25 || t > T.stir);
      if (!alive) { steam.hide(i); continue; }
      const fade = t > T.smoke && t < T.smoke + .25 ? 1 - seg(t, T.smoke, T.smoke + .25) : 1;
      steam.set(i, CART.x + .45 + Math.sin(i * 3.1 + u * 3) * .3 * u, 1.9 + u * 2.6, CART.z + Math.cos(i * 1.7) * .2 * u, .4 + u * 1.2, .4 + u * 1.2, 1, .9, .8, .3 * Math.sin(u * Math.PI) * fade, i); }
    steam.sortBy(camera); steam.commit(scene.fog);
    // spray from the puddles as the train passes
    const nx = (t - T.enter) * TRAIN.v - 12.5;
    for (let i = 0; i < 160; i++) { const p = sprayP[i], tp = T.enter + (p.x + 12.5) / TRAIN.v + p.t * .3, u = (t - tp) / 1.1;
      if (u < 0 || u > 1 || t > T.tail) { spray.hide(i); continue; }
      spray.set(i, p.x + u * 1.5, .3 + u * 1.6 - u * u * 1.4, p.side * (1.5 + u * p.v), p.s * (.5 + u), p.s * (.5 + u), .75, .88, 1, .35 * (1 - u), i); }
    spray.sortBy(camera); spray.commit(scene.fog);
    // ripples on the wet road
    for (let i = 0; i < 120; i++) { const p = ripP[i], u = (t * 1.3 + p.ph) % 1, k = Math.floor(t * 1.3 + p.ph); const x = p.x + hash(k + i) * 3, z = p.z + hash(k * 3 + i) * 3;
      rip.set(i, x, .2, z, .1 + u * .35, .05 + u * .17, .8, .85, 1, .18 * (1 - u)); }
    rip.commit(scene.fog);
    // glints: each light mirrored in the road; the sprite sits where the ray to the mirror image meets the road
    camera.getWorldPosition(cam); let gi = 0;
    const put = (x, y, z, r, g2, b, a, w) => { if (gi >= 60) return; v.set(x, -y, z); const k = (cam.y - .2) / (cam.y + y); const gx = cam.x + (v.x - cam.x) * k, gz = cam.z + (v.z - cam.z) * k;
      glint.set(gi++, gx, .22, gz, w, w * 3.2, r, g2, b, a); };
    for (const L of lightsOf(t)) put(...L);
    while (gi < 60) glint.hide(gi++);
    glint.commit(scene.fog);
  } };
}
