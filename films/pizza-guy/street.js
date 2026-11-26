// The set: Crooked Lane on a rainy night. One long street (west → east): pizza shop, terraces, the dog's kennel,
// a stone bridge over a canal, No. 13 (haunted), No. 31 (a log cabin with a porch). The rain stops at the end.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, woodPlanks, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, crate, barrel, ridge } from './kit.js';
import { sky, stars, sea, particles, rain, flick } from './fx.js';
import { makeChar, pizzaDisc, SPX } from './chars.js';
import { T, X, ROAD_Z, VO, scooterX, riding, youFoot, walkStep, dogPos } from './story.js';
import { clamp, seg, ss, lerp, track } from '/core/lib.js';

const GLY = {
  P: '110101110100100', I: '111010010010111', Z: '111001010100111', A: '010101111101101', '1': '010110010010111', '3': '111001011001111', N: '101111111111101', O: '010101101101010', '.': '000000000000010',
};
function pixText(P, s, x, y, col, k = 1, E) { for (const ch of s) { const g = GLY[ch]; if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') { P.rect(x + i * k, y + j * k, k, k, col); E && E.rect(x + i * k, y + j * k, k, k, col); } x += 4 * k; } }

export function buildStreet() {
  const scene = new THREE.Scene(), MM = mats();
  const FOG = new THREE.Color('#141d33'); scene.fog = new THREE.FogExp2(FOG.clone(), .028);
  const SEA_Y = -1.3;
  const SK = sky({ top: '#05070f', mid: '#0d1428', hor: '#1c2844', moonDir: new THREE.Vector3(.4, .35, -1), moonCol: '#dfe8ff', moonI: 0 }); scene.add(SK.mesh);
  const ST = stars(700, 9); scene.add(ST);

  // —— lights ——
  const key = new THREE.DirectionalLight('#7d90c8', .55); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 120 }); key.shadow.bias = -.0006; key.shadow.normalBias = .02;
  scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#4c5c8c', '#0e0e18', 1.35); scene.add(hemi);
  const fill = new THREE.PointLight('#9fb2e8', 1.4, 7, 2); scene.add(fill);

  // —— ground: wet cobbles, kerbs, canal, bridge ——
  const wetCob = mat(cobbles(96, 96, { seed: 6, cols: ['#121219', '#22222c', '#33333f', '#474553', '#5d5a68'] }), { rough: .32 }); wetCob.metalness = .12;
  const pave = mat(cobbles(96, 96, { seed: 11, cell: 12, cols: ['#18181e', '#2a2a32', '#3c3c46', '#504e5a'] }), { rough: .4 });
  const stone = mat(rock(96, 96, { seed: 3, cols: ['#121218', '#22222a', '#33323c', '#46444e', '#5c5862'] }));
  for (const [x0, x1] of [[-16, X.bridge0], [X.bridge1, 64]]) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    scene.add(mesh(new THREE.BoxGeometry(w, .3, 6.4).translate(cx, -.15, .2), wetCob));
    scene.add(mesh(new THREE.BoxGeometry(w, .45, 2.6).translate(cx, -.05, -4.3), pave));   // pavement in front of the houses
    scene.add(mesh(new THREE.BoxGeometry(w, .3, 14).translate(cx, -.15, -12.6), pave));
    scene.add(mesh(new THREE.BoxGeometry(w, .3, 5).translate(cx, -.15, 5.9), pave));
  }
  // canal walls + water
  for (const x of [X.bridge0, X.bridge1]) scene.add(mesh(new THREE.BoxGeometry(.6, 2.2, 40).translate(x + (x === X.bridge0 ? -.3 : .3), -1.2, -4), stone));
  const SEA = sea(600, { ppm: 9, deep: '#040a14', shallow: '#0e2036', crest: '#3a5a7c' }); SEA.mesh.position.y = SEA_Y; scene.add(SEA.mesh);
  // bridge: deck, parapets, an arch
  const bw = X.bridge1 - X.bridge0 + .4, bc = (X.bridge0 + X.bridge1) / 2;
  scene.add(mesh(new THREE.BoxGeometry(bw, .4, 4.4).translate(bc, -.2, ROAD_Z), stone));
  for (const z of [-2.05, 2.45]) scene.add(mesh(new THREE.BoxGeometry(bw, .6, .3).translate(bc, .3, z), stone));
  // puddles: dark mirrors that catch the lamps
  const pudM = new THREE.MeshStandardMaterial({ color: '#070b16', roughness: .06, metalness: .7 });
  const R = mulberry(5);
  for (let i = 0; i < 26; i++) { let x = -10 + R() * 70; if (x > X.bridge0 - .5 && x < X.bridge1 + .5) x += 7; const p = new THREE.Mesh(new THREE.CircleGeometry(.5 + R() * .7, 14), pudM); p.rotation.x = -Math.PI / 2; p.scale.set(1.6 + R(), 1, 1); p.position.set(x, .012, -2 + R() * 4.6); p.receiveShadow = true; scene.add(p); }

  // —— houses (fronts at z ≈ -4.3) ——
  const H = [
    house({ x: -7.4, z: -7.6, w: 6.2, d: 5, h: 4.6, wall: 'wall2', roof: 'roof2', door: 1.4, windows: [[-1.6, 2.1]], upper: [[-1.3, 3.7], [1.4, 3.7]] }),
    house({ x: 7.0, z: -7.6, w: 5.6, d: 5, h: 4.2, wall: 'wall', roof: 'roof', door: -1.4, windows: [[1.2, 2.1]], upper: [[0, 3.4]] }),
    house({ x: 13.2, z: -7.8, w: 5.4, d: 5, h: 5.2, wall: 'wall3', roof: 'roof3', door: 1.2, windows: [[-1.2, 2.2]], upper: [[-1.1, 4.0], [1.2, 4.0]] }),
    house({ x: 40.0, z: -7.8, w: 5.0, d: 5, h: 4.6, wall: 'wall', roof: 'roof2', door: 1.1, windows: [[-1.1, 2.1]], upper: [[0, 3.7]] }),
    house({ x: 53.0, z: -7.8, w: 6.0, d: 5, h: 5.0, wall: 'wall3', roof: 'roof', windows: [[-1.4, 2.2], [1.4, 2.2]] }),
    house({ x: -3.0, z: -17, w: 6, d: 5, h: 7.0, wall: 'wall', roof: 'roof3', windows: [[-1.4, 3.3], [1.4, 3.3]], upper: [[0, 5.3]] }),
    house({ x: 9.5, z: -17.5, w: 6, d: 5, h: 6.4, wall: 'wall2', roof: 'roof', windows: [[0, 3.1]], upper: [[-1.2, 4.8]] }),
    house({ x: 31.0, z: -18, w: 6, d: 5, h: 6.8, wall: 'wall3', roof: 'roof2', windows: [[-1.4, 3.2]], upper: [[1.2, 5.0]] }),
    house({ x: 47.0, z: -17.5, w: 6, d: 5, h: 6.2, wall: 'wall', roof: 'roof3', windows: [[1.4, 3.1]], upper: [[-1.2, 4.8]] }),
  ];
  H.forEach(h => scene.add(h));
  const winMat = H[0].userData.windows[0].material;
  const winLights = [[-8.9, 2.2, -4.4], [8.2, 2.2, -4.4], [12.0, 2.4, -4.6], [38.9, 2.2, -4.6], [51.6, 2.3, -4.6]].map(([x, y, z]) => { const L = new THREE.PointLight('#ff9d4a', 4.5, 7, 2); L.position.set(x, y, z); scene.add(L); return L; });

  // —— the pizza shop ——
  const shop = house({ x: X.shop, z: -7.6, w: 6.4, d: 5, h: 4.4, wall: 'wall3', roof: 'roof', door: 1.8, windows: [[-1.4, 1.9]], upper: [[-1.3, 3.4], [1.4, 3.4]] });
  scene.add(shop);
  const nP = new PX(40, 12), nE = new PX(40, 12);
  nP.fill((x, y) => [24, 16, 22]); for (let x = 0; x < 40; x++) { nP.set(x, 0, [60, 40, 50]); nP.set(x, 11, [60, 40, 50]); }
  pixText(nP, 'PIZZA', 1, 1, [255, 92, 120], 2, nE);
  const neonM = new THREE.MeshStandardMaterial({ map: texOf(nP.done()), emissiveMap: texOf(nE.done()), emissive: '#ffffff', emissiveIntensity: 0, roughness: .6 });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .96), neonM); neon.position.set(X.shop + .2, 3.0, -5.05); scene.add(neon);
  const neonL = new THREE.PointLight('#ff5c7a', 0, 11, 1.7); neonL.position.set(X.shop + .2, 2.8, -4.2); neonL.shadow.mapSize.set(1024, 1024); neonL.shadow.bias = -.004; neonL.shadow.camera.near = .1; scene.add(neonL);
  const neonG = glow('#ff6a88', 3.2, 1.0); neonG.position.set(X.shop + .2, 3.0, -4.95); scene.add(neonG);
  const awn = mesh(new THREE.BoxGeometry(6.6, .08, 1.3).translate(0, 0, 0), mat(woodPlanks(48, 48, { pw: 6, len: 96, seed: 3, nails: false, cols: ['#0f2a1a', '#1a4228', '#285a38'] })));
  awn.position.set(X.shop, 2.35, -4.55); awn.rotation.x = .3; scene.add(awn);

  // —— the dog's kennel ——
  const ken = new THREE.Group(); ken.position.set(X.kennel - .4, 0, -3.1); scene.add(ken);
  ken.add(box(1.1, .75, .9, MM.plankDark));
  const kr = mesh(new THREE.ConeGeometry(.85, .5, 4).rotateY(Math.PI / 4).translate(0, 1.0, 0), MM.roof); ken.add(kr);
  const kd = new THREE.Mesh(new THREE.PlaneGeometry(.4, .45), new THREE.MeshBasicMaterial({ color: '#050406' })); kd.position.set(0, .25, .46); ken.add(kd);

  // —— street lamps ——
  const lamps = [];
  for (const [x, z] of [[-3.6, -3.4], [10.2, -3.4], [17.6, -3.4], [22.3, -1.75], [28.2, -3.4], [41.6, -3.4], [57, -3.4]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    g.add(box(.12, 3.4, .12, MM.plankDark)); const arm = box(.5, .07, .07, MM.plankDark); arm.position.set(.2, 3.3, 0); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.26, .32, .26), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffcf8a', emissiveIntensity: 3 })); head.position.set(.42, 3.05, 0); g.add(head);
    const L = new THREE.PointLight('#ffc888', 7, 11, 1.8); L.position.set(x + .42, 2.9, z + .3); scene.add(L);
    const gl = glow('#ffd29a', 1.5, 1.0); gl.position.set(x + .42, 3.05, z); scene.add(gl);
    lamps.push({ L, gl, head, x });
  }

  // —— No. 13 (crooked, dark, green window, dead tree, iron fence) ——
  const h13 = house({ x: X.h13, z: -7.6, w: 5.6, d: 5, h: 5.4, wall: 'wall2', roof: 'roof2', chimney: true, windows: [], upper: [] });
  h13.rotation.z = .035; h13.traverse(o => { if (o.material && o.material.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(.55); } }); scene.add(h13);
  const greenW = new THREE.MeshStandardMaterial({ color: '#0a1a10', emissive: '#58ff8a', emissiveIntensity: 1.0, roughness: .5 });
  for (const [x, y] of [[-1.5, 3.9], [1.5, 3.9]]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(.7, .95), greenW); q.position.set(X.h13 + x, y, -5.08); scene.add(q); }
  const greenL = new THREE.PointLight('#58ff8a', 3, 8, 1.8); greenL.position.set(X.h13, 3.8, -4.4); scene.add(greenL);
  const door13 = new THREE.Group(); door13.position.set(X.h13 - .5, 0, -5.05); scene.add(door13);
  const d13 = box(1.0, 2.0, .1, MM.plankDark); d13.position.set(.5, 0, 0); door13.add(d13);
  const dark13 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ color: '#020304' })); dark13.position.set(X.h13, 1.0, -5.1); scene.add(dark13);
  const plateP = new PX(10, 7); plateP.fill(() => [40, 34, 28]); pixText(plateP, '13', 1, 1, [200, 190, 160]);
  const plate13 = new THREE.Mesh(new THREE.PlaneGeometry(.36, .25), new THREE.MeshStandardMaterial({ map: texOf(plateP.done()), roughness: .7 })); plate13.position.set(X.h13 + .8, 1.75, -5.03); scene.add(plate13);
  const iron = new THREE.MeshStandardMaterial({ color: '#15161a', roughness: .5, metalness: .6 });
  for (let x = X.h13 - 3.2; x <= X.h13 + 3.2; x += .3) { if (Math.abs(x - X.h13) < .8) continue; const p = new THREE.Mesh(new THREE.BoxGeometry(.04, 1.1 + (Math.round(x * 10) % 3) * .05, .04), iron); p.position.set(x, .55 + .2, -3.35); p.castShadow = true; scene.add(p); }
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, .05, .05), iron); rail.position.set(X.h13 + s * 2.0, 1.05, -3.35); scene.add(rail); }
  const treeP = new PX(48, 80); { const br = (x, y, a, l, w) => { if (l < 3) return; const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l; for (let k = 0; k < w; k++) treeP.line(x + k, y, x2 + k, y2, [26, 22, 26]); br(x2, y2, a + .5, l * .68, Math.max(1, w - 1)); br(x2, y2, a - .45, l * .62, Math.max(1, w - 1)); }; br(24, 79, Math.PI / 2 + .08, 26, 4); }
  treeP.outline(.5);
  const tree = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.4).translate(0, 2.2, 0), new THREE.MeshLambertMaterial({ map: texOf(treeP.done()), alphaTest: .5, side: THREE.DoubleSide })); tree.position.set(X.h13 + 3.8, 0, -4.2); tree.castShadow = true; scene.add(tree);

  // —— No. 31 (log cabin, porch, porch lamp, step) ——
  MM.logs = mat(woodPlanks(96, 96, { pw: 8, len: 96, seed: 19, nails: false, cols: ['#1e1009', '#3a2213', '#57341c', '#744828', '#8e5e34'] }));
  const h31 = house({ x: X.h31, z: -7.6, w: 6.2, d: 5, h: 3.8, wall: 'logs', roof: 'roof3', chimney: true, windows: [[-1.8, 1.9]], upper: [] }); scene.add(h31);
  const porch = mesh(new THREE.BoxGeometry(5.2, .3, 1.7).translate(X.h31, .15, -4.25), MM.plank); scene.add(porch);
  const step = mesh(new THREE.BoxGeometry(1.6, .16, .6).translate(X.h31 - .3, .08, -3.15), MM.plank); scene.add(step);
  for (const x of [X.h31 - 2.4, X.h31 + 2.4]) { const p = box(.14, 3.2, .14, MM.beam); p.position.set(x, .3, -3.6); scene.add(p); }
  const proof = mesh(new THREE.BoxGeometry(5.6, .1, 2.1).translate(0, 0, 0), MM.roof3 || MM.roof); proof.position.set(X.h31, 3.55, -4.6); proof.rotation.x = .3; scene.add(proof);
  const door31 = new THREE.Group(); door31.position.set(X.h31 - .5, .3, -5.06); scene.add(door31);
  const d31 = box(1.0, 2.0, .1, MM.plankDark); d31.position.set(.5, 0, 0); door31.add(d31);
  const in31 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ color: '#ffb46a' })); in31.position.set(X.h31, 1.3, -5.12); scene.add(in31);
  const inL = new THREE.PointLight('#ffb060', 0, 6, 2); inL.position.set(X.h31, 1.5, -4.4); scene.add(inL);
  const plate2 = new PX(10, 7); plate2.fill(() => [40, 34, 28]); pixText(plate2, '31', 1, 1, [200, 190, 160]);
  const plate31 = new THREE.Mesh(new THREE.PlaneGeometry(.36, .25), new THREE.MeshStandardMaterial({ map: texOf(plate2.done()), roughness: .7 })); plate31.position.set(X.h31 + .8, 2.05, -5.04); scene.add(plate31);
  const pLampB = new THREE.Mesh(new THREE.BoxGeometry(.2, .26, .2), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 0 })); pLampB.position.set(X.h31 + 1.15, 2.6, -4.2); scene.add(pLampB);
  const porchL = new THREE.PointLight('#ffb060', 0, 10, 1.6); porchL.position.set(X.h31 + 1.1, 2.45, -3.6); porchL.shadow.mapSize.set(1024, 1024); porchL.shadow.bias = -.004; porchL.shadow.camera.near = .05; scene.add(porchL);
  const porchG = glow('#ffc070', 1.1, 1.1); porchG.position.copy(pLampB.position); scene.add(porchG);
  [[X.h31 + 2.9, -3.4], [X.h31 - 3.0, -3.2]].forEach(([x, z]) => { const b = barrel(.3, .8); b.position.set(x, 0, z); scene.add(b); });
  [[X.shop - 3.6, -3.6], [X.shop + 3.4, -3.8, .6], [15.6, -3.6]].forEach(([x, z, s]) => { const c = crate(s ?? .7); c.position.set(x, 0, z); c.rotation.y = .3; scene.add(c); });
  const binM = new THREE.MeshStandardMaterial({ color: '#1e2a22', roughness: .6 }); for (const x of [3.2, 26.8, 38.0]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.3, .26, .8, 10), binM); b.position.set(x, .4, -3.5); b.castShadow = true; scene.add(b); }
  [[-420, -520, 520, 70, '#141d33', 3], [120, -560, 700, 60, '#111a2e', 7]].forEach(([x, z, w, h, c, s]) => { const r = ridge(w, h, c, s, { ppm: 1.4 }); r.position.set(x, SEA_Y - 2, z); scene.add(r); });

  // —— characters ——
  const parked = makeChar('rider', 2.2), rider = makeChar('rider', 2.2), you = makeChar('you', 2.2), dog = makeChar('dog'), ghost = makeChar('ghost', 1.6), bear = makeChar('bear');
  parked.frame('empty'); scene.add(parked.root, rider.root, you.root, dog.root, ghost.root, bear.root);
  const head = new THREE.SpotLight('#fff4d8', 0, 14, .5, .5, 1.5); scene.add(head, head.target);
  const headG = glow('#fff2d0', .38, 1.2); scene.add(headG);
  const boxL = new THREE.PointLight('#ffa040', 0, 3.2, 2); scene.add(boxL);
  const boxG = glow('#ffb060', .7, 1.0); scene.add(boxG);
  const pizza = pizzaDisc(); scene.add(pizza);
  const ghostL = new THREE.PointLight('#7affa8', 0, 4, 2); scene.add(ghostL);

  // —— rain, splashes, drips ——
  const RAIN = rain(1600, [-9, 0, -7, 9, 11, 6], { speed: 20, len: .7, opacity: .32, color: '#a8bedc' }); scene.add(RAIN);
  const SPL = particles(220, (i, t, o) => { const ph = (t * 1.7 + h2(i, 1)) % 1; o.x = cx0 + (h2(i, 2, Math.floor(t * 1.7 + h2(i, 1))) - .5) * 18; o.z = -3.8 + h2(i, 3, Math.floor(t * 1.7 + h2(i, 1))) * 7.5; o.y = .03 + ph * .12; o.a = ph < .3 ? (1 - ph / .3) * .7 * rainK : 0; o.s = .05 + ph * .1; o.r = .75; o.g = .85; o.b = 1; }, { soft: 1 });
  scene.add(SPL);
  let cx0 = 0, rainK = 1;

  // —— helpers ——
  const pick = (t, f) => (Math.floor(t * f) % 2 ? 1 : 0);
  const v3 = a => new THREE.Vector3(...a);
  const hotK = t => 1 - .7 * seg(t, T.go, T.late);
  const flash = t => { const u = t - T.flash; if (u < 0 || u > 1.4) return 0; return u < .12 ? 1 : u < .22 ? .25 : u < .3 ? .85 : Math.exp(-(u - .3) / .22) * .7; };

  const CAM = {
    shop: { p: track([[0, [2.6, 9.8, 14.2]], [7.5, [1.6, 7.8, 11.2]]]), l: track([[0, [.4, 1.5, -1.6]], [7.5, [.9, 1.2, -1.0]]]), fov: 36, aper: 380 },
    bridge: { p: track([[15, [18.2, 11.5, 15.0]], [18.5, [19.6, 10.5, 13.8]]]), l: track([[15, [21.4, .6, -.4]], [18.5, [22.8, 1.2, -.2]]]), fov: 36, aper: 440 },
    face: { p: track([[18.5, [24.9, 4.6, 6.6]], [22.0, [24.6, 4.0, 5.8]], [24.0, [27.4, 6.8, 9.8]]]), l: track([[18.5, [23.5, .95, .1]], [22.0, [23.5, 1.0, .1]], [24.0, [26.0, .8, .1]]]), fov: 32, aper: 200 },
    ghost: { p: track([[24, [30.6, 7.0, 9.4]], [27.5, [31.4, 6.4, 8.6]], [35, [31.9, 6.1, 8.2]]]), l: track([[24, [32.2, .9, -1.8]], [27.5, [33.4, 1.1, -2.3]], [35, [33.4, 1.2, -2.3]]]), fov: 36, aper: 330 },
    cabin: { p: track([[35, [42.4, 7.4, 9.8]], [39, [44.0, 6.2, 8.2]], [47, [44.7, 5.6, 7.4]]]), l: track([[35, [44.6, .9, -1.6]], [39, [45.8, 1.2, -2.6]], [47, [45.9, 1.3, -2.7]]]), fov: 36, aper: 330 },
    porch: { p: track([[47, [44.9, 4.2, 5.6]], [50.5, [44.8, 4.6, 6.2]], [55, [41.5, 13.5, 17.5]], [61, [39.5, 23, 29]]]), l: track([[47, [45.8, .8, -2.3]], [50.5, [45.8, .8, -2.3]], [55, [44.6, .4, -3.0]], [61, [44.2, .2, -3.4]]]), fov: 34, aper: 240 },
  };

  function update(t, shot, cam, post, renderer) {
    const sx = scooterX(t);
    // —— camera ——
    if (shot.id === 'dog') {
      const lx = sx - .2; cam.position.set(lx + 1.4, 8.4, 13.2); cam.fov = 34; cam.updateProjectionMatrix(); cam.lookAt(lx, .9, .2); post.dof.aper = 360;
    } else { const C = CAM[shot.id]; cam.position.set(...C.p(t)); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.lookAt(...C.l(t)); post.dof.aper = C.aper; }

    // —— weather: rain until T.dry, then it stops; lightning at No. 13 ——
    rainK = 1 - ss(seg(t, T.dry - 1, T.dry + 2.5));
    const fl = flash(t);
    cx0 = cam.position.x - 1.5;
    RAIN.position.set(cam.position.x - 1.5, 0, 0); RAIN.material.opacity = .32 * rainK + fl * .2; RAIN.visible = rainK > .01; RAIN.userData.update(t, [-3.2, 0]);
    SPL.userData.update(t);
    const clear = ss(seg(t, T.dry, T.dry + 4));
    SK.u.k.value = 1 + fl * 2.6 + clear * .3; ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = clear;
    scene.fog.density = lerp(.028, .014, clear); scene.fog.color.copy(FOG).multiplyScalar(1 + fl * 1.8);
    hemi.intensity = 1.35 + fl * 3.5; key.intensity = .55 + fl * 2.5 + clear * .25;
    const kd = new THREE.Vector3(-.35, .8, .45).normalize(); key.target.position.set(cam.position.x - 2, 0, -2); key.position.copy(key.target.position).addScaledVector(kd, 50);
    renderer.toneMappingExposure = 1.3 + fl * .5;

    // —— practicals ——
    let nv = 0; const dn = t - T.neon; if (dn >= 0) nv = dn < .06 ? 1 : dn < .14 ? .1 : dn < .2 ? 1 : dn < .26 ? .2 : 1;
    nv *= .9 + .1 * Math.sin(t * 31) * Math.sin(t * 7);
    neonM.emissiveIntensity = nv * 2.6; neonL.intensity = nv * 9; neonG.material.opacity = nv * .55;
    neonL.castShadow = shot.id === 'shop';
    lamps.forEach((L, i) => { L.L.intensity = 7 * (1 + .03 * Math.sin(t * 5 + i)); });
    winMat.emissiveIntensity = 2.0; winLights.forEach((L, i) => L.intensity = 4.5 * (1 + .04 * Math.sin(t * 3 + i)));
    greenL.intensity = 1.5 * (.85 + .15 * Math.sin(t * 2.3)) + (t > T.open13 && t < 35 ? .8 : 0);
    // doors
    door13.rotation.y = -1.45 * ss(seg(t, T.open13, T.open13 + .9));
    const o31 = ss(seg(t, T.open31, T.open31 + .5)) * (1 - ss(seg(t, T.slam - .12, T.slam)));
    door31.rotation.y = -1.5 * o31; inL.intensity = 4 * o31; in31.visible = o31 > .02;
    // porch lamp: clicks on at T.porch
    let pv = 0; const dp = t - T.porch; if (dp >= 0) pv = dp < .05 ? 1 : dp < .1 ? .2 : 1;
    pv *= flick(t, 4) * .25 + .75;
    porchL.intensity = Math.pow(pv, 1.3) * 7; porchG.material.opacity = pv * .8; pLampB.material.emissiveIntensity = pv * 4;
    porchL.castShadow = shot.id === 'cabin' || shot.id === 'porch';
    SEA.u.t.value = t; SEA.u.camPos.value.copy(cam.position); SEA.u.fogColor.value.copy(scene.fog.color); SEA.u.fogDensity.value = scene.fog.density;
    SEA.setLights([...lamps.filter(l => Math.abs(l.x - 22.5) < 14).map(l => ({ p: l.L.position, c: new THREE.Color('#ffc888'), i: .7 })), { p: new THREE.Vector3(sx + 1.2, 1, ROAD_Z), c: new THREE.Color('#fff2d0'), i: riding(t) ? .5 : 0 }]);

    // —— the scooter / you ——
    const foot = youFoot(t), onFoot = !!foot;
    rider.root.visible = !onFoot; you.root.visible = onFoot; parked.root.visible = onFoot;
    if (onFoot) { parked.root.position.set(sx, 0, ROAD_Z); parked.face(cam); }
    const hk = hotK(t);
    if (!onFoot) {
      rider.root.position.set(sx, 0, ROAD_Z);
      const wh = Math.floor(sx / .22) % 4;
      let f = ['ride0', 'ride1', 'ride2', 'ride3'][wh];
      if (t < T.go) f = 'park';
      else if (t >= 10.0 && t < 12.6) f = wh % 2 ? 'look1' : 'look0';
      else if (t >= T.dogOut && t < 15) f = wh % 2 ? 'grit1' : 'grit0';
      else if (t >= T.gust && t < T.splat) f = pick(t, 6) ? 'brake1' : 'brake';
      else if (t >= T.splat && t < T.rideOn) f = pick(t, 1.5) ? 'face1' : 'face';
      else if (t >= T.rideOn && t < T.stop13 + 1) f = wh % 2 ? 'sad1' : 'sad0';
      else if (t >= 32.8 && t < 34.6) f = wh % 2 ? 'flee1' : 'flee0';
      else if (t >= 34.6) f = wh % 2 ? 'late1' : 'late0';
      rider.frame(f); rider.face(cam);
      // headlight + hot box
      const hp = new THREE.Vector3(sx + .66, .98, ROAD_Z + .06);
      head.position.copy(hp); head.target.position.set(sx + 7, 0, ROAD_Z); head.intensity = t > 5.8 ? 30 : 0; headG.position.copy(hp).add(new THREE.Vector3(0, 0, .1)); headG.material.opacity = t > 5.8 ? .75 : 0;
      const bp = new THREE.Vector3(sx - .82, .95, ROAD_Z + .15); const toCam = cam.position.clone().sub(bp).setY(0).normalize();
      boxL.position.copy(bp).addScaledVector(toCam, .35); boxL.intensity = 2.4 * hk * (flick(t, 1) * .3 + .7); boxG.position.copy(bp); boxG.material.opacity = .55 * hk;
    } else {
      head.intensity = 0; headG.material.opacity = 0;
      // the parked scooter stays where you left it (drawn by a second rider instance? keep it simple: the rider sprite stays hidden; a parked scooter mesh is not needed in frame)
      you.root.position.set(foot.x, t >= T.stop31 ? .0 : 0, foot.z);
      let f = 'stand', flip = false;
      if (t < 32.8) {
        if (foot.walk && t < T.flee) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t)];
        else if (t < T.flash) { const k = [0, .5, 1.0].some(k => t >= T.knock13 + k && t < T.knock13 + k + .22); f = k ? 'knock' : 'knock1'; }
        else if (t < T.flash + 1.0) f = pick(t, 6) ? 'shock' : 'shock1';
        else if (t < 32.0) f = Math.floor(t * 8) % 23 === 0 ? 'blink' : 'stand';
        else if (t < T.flee) f = 'talkShock';
        else { f = ['r0', 'r1', 'r2', 'r3'][walkStep(t)]; flip = true; }
      } else {
        if (foot.walk) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t)];
        else if (t < T.porch) { const k = [0, .5].some(k => t >= T.knock31 + k && t < T.knock31 + k + .22); f = k ? 'knock' : 'knock1'; }
        else if (t < T.late) f = 'hope';
        else if (t < 41.0) f = pick(t, 4) ? 'shock' : 'shock1';
        else if (t < T.sit) f = Math.floor(t * 8) % 29 === 0 ? 'blink' : 'sadBox';
        else if (t < T.share - .5) f = Math.floor(t * 8) % 31 === 0 ? 'sitBlink' : 'sit';
        else if (t < 52.6) f = pick(t, 1.2) ? 'share1' : 'share';
        else f = 'eat';
      }
      you.frame(f); you.face(cam, flip);
      // the hot box glow follows you
      const bp = you.root.position.clone().add(new THREE.Vector3(t >= T.sit ? .1 : .25, t >= T.sit ? .25 : .85, .12)); const toCam = cam.position.clone().sub(bp).setY(0).normalize();
      boxL.position.copy(bp).addScaledVector(toCam, .35); boxL.intensity = 2.0 * hk; boxG.position.copy(bp); boxG.material.opacity = .45 * hk;
    }
    // the flying pizza
    pizza.visible = t >= T.gust && t < T.splat;
    if (pizza.visible) {
      const u = seg(t, T.gust, T.splat), x0 = scooterX(T.gust) - .8, x1 = scooterX(T.splat) + .15;
      pizza.position.set(lerp(x0, x1, u) + (scooterX(t) - lerp(scooterX(T.gust), scooterX(T.splat), u)), lerp(1.1, 1.35, u) + Math.sin(u * Math.PI) * 3.0, ROAD_Z + .3);
      pizza.rotation.set(Math.floor(u * 14) * Math.PI / 4, .3, Math.floor(u * 9) * .5);
    }
    // the dog
    const D = dogPos(t); dog.root.visible = !!D;
    if (D) {
      dog.root.position.set(D.x, 0, D.z);
      let f = 'sleep', flip = false;
      if (t >= T.dogOut && t < 15.5) { f = (t < T.dogOut + .4 || (t >= 8.0 && t < 9.0) || (t > 10.9 && t < 11.4) || (t > 13.5 && t < 14.0)) ? (pick(t, 6) ? 'bark' : 'bark1') : ['r0', 'r1', 'r2', 'r3'][Math.floor(t * 12) % 4]; }
      else if (t >= T.dogIn - 1.2) { if (D.run) f = ['r0', 'r1', 'r2', 'r3'][Math.floor(t * 12) % 4]; else { flip = true; f = t < T.share - .5 ? (pick(t, 2) ? 'sitWag' : 'sit') : t < T.share ? (pick(t, 3) ? 'beg1' : 'beg') : t < 52.6 ? (pick(t, 3) ? 'eat1' : 'eat') : (pick(t, 2.5) ? 'sitWag' : 'sit'); } }
      dog.frame(f); dog.face(cam, flip);
    }
    // the ghost
    const gv = t > T.open13 + .25 && t < 35;
    ghost.root.visible = gv;
    if (gv) {
      const pop = ss(seg(t, T.open13 + .25, T.open13 + .8));
      ghost.root.position.set(X.h13 + .05, .15 + Math.sin(t * 2.2) * .08 + pop * .1, -4.55 + pop * .6);
      ghost.frame(t < T.open13 + 1.0 ? 'boo' : t > T.flee - .2 ? (pick(t, 3) ? 'wave1' : 'wave0') : pick(t, 1.6) ? 'f1' : 'f0'); ghost.face(cam);
      ghostL.position.copy(ghost.root.position).add(new THREE.Vector3(0, .8, .5)); ghostL.intensity = 1.5;
    } else ghostL.intensity = 0;
    // the bear
    const bv = t > T.open31 + .15 && t < T.slam - .1;
    bear.root.visible = bv;
    if (bv) {
      bear.root.position.set(X.h31 + .05, .3, -4.75);
      const b1 = VO.find(v => v.id === 'b1'), b2 = VO.find(v => v.id === 'b2');
      let f = t < T.late ? 'stand' : 'down';
      if (t > b1.t && t < b1.t + 1.45) f = pick(t, 6) ? 'talk' : 'talk1';
      else if (t > b2.t && t < b2.t + 1.5) f = pick(t, 5) ? 'point' : 'point1';
      else if (t > 45.8) f = 'stand1';
      if (Math.floor(t * 8) % 27 === 0 && f === 'stand') f = 'blink';
      bear.frame(f); bear.face(cam, true);
    }

    // —— focus subject ——
    let subj;
    if (shot.id === 'shop') subj = v3([.9, 1.1, -1.0]);
    else if (shot.id === 'dog') subj = v3([sx - .4, .7, ROAD_Z + .3]);
    else if (shot.id === 'bridge') subj = v3([sx, .6, ROAD_Z]);
    else if (shot.id === 'face') subj = v3([sx + .2, 1.1, ROAD_Z]);
    else if (shot.id === 'ghost') subj = t < 25 ? v3([sx, .8, ROAD_Z]) : v3([33.6, 1.1, -2.6]);
    else if (shot.id === 'cabin') subj = t < T.stop31 ? v3([sx, .8, ROAD_Z]) : v3([45.8, 1.3, -2.8]);
    else subj = v3([45.85, .6, -2.1]);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.maxCoc = 22;
    fill.position.copy(subj).add(new THREE.Vector3(.3, .7, 2.0)); fill.intensity = 1.3 * (1 - clear * .5);
    return subj;
  }
  return { scene, update };
}
