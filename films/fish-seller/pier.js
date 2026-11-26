// The set: a harbour fish-market pier before dawn (and at sunrise). One diorama, every shot.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, rock, woodPlanks, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, crate, barrel, ridge } from './kit.js';
import { sky, sea, particles, flick } from './fx.js';
import { makeChar, flatFish, SPX } from './chars.js';
import { T, B, VO, GRAN, granX, granWalking, granStep, YOU, youRunX, youRunning, runStep, FLOPS } from './story.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';

// —— tiny 3×5 pixel font for signs ——
const GLY = {
  F: '111100110100100', R: '110101110101101', E: '111100110100111', S: '011100010001110', H: '101101111101101', I: '111010010010111',
  C: '011100100100011', O: '010101101101010', D: '110101101101110', '1': '010110010010111', '0': '111101101101111', L: '100100100100111', '£': '011010111010111', ' ': '000000000000000',
};
function pixText(P, s, x, y, col, k = 1) { for (const ch of s) { const g = GLY[ch] || GLY[' ']; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') P.rect(x + i * k, y + j * k, k, k, col); x += 4 * k; } }

export function buildPier() {
  const scene = new THREE.Scene(), MM = mats();
  const FOG0 = new THREE.Color('#1d2a45'), FOG1 = new THREE.Color('#c79a86');
  scene.fog = new THREE.FogExp2(FOG0.clone(), .018);
  const SEA_Y = -1.3;
  const SKY = { top: [new THREE.Color('#0a1230'), new THREE.Color('#3f6aa6')], mid: [new THREE.Color('#1c2c56'), new THREE.Color('#d98a7a')], hor: [new THREE.Color('#3c4f78'), new THREE.Color('#ffc886')] };
  const SUNDIR = new THREE.Vector3(.78, .05, -.62).normalize();
  const SK = sky({ moonDir: SUNDIR, top: '#0a1230', mid: '#1c2c56', hor: '#3c4f78', moonCol: '#ffd9a0', moonI: 0 }); scene.add(SK.mesh);

  // —— Lights: cold sky key (becomes the sun), hemisphere, practicals, front fill ——
  const key = new THREE.DirectionalLight('#8ea4d8', .9); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 140 }); key.shadow.bias = -.0006; key.shadow.normalBias = .02;
  key.target.position.set(3, 0, 0); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#5a6c9c', '#141420', 1.6); scene.add(hemi);
  const fill = new THREE.PointLight('#9fb2e8', 1.6, 7, 2); scene.add(fill);

  // —— Pier deck ——
  const deckM = mat(woodPlanks(96, 96, { pw: 6, len: 96, seed: 8, cols: ['#20150f', '#3a281b', '#544028', '#6e5636', '#8a6e46'] }));
  scene.add(mesh(new THREE.BoxGeometry(26.2, .3, 14.6).translate(-2.9, -.15, -2.7), deckM));
  const beamM = MM.beam;
  scene.add(mesh(new THREE.BoxGeometry(26.4, .26, .28).translate(-2.9, -.2, 4.62), beamM));
  scene.add(mesh(new THREE.BoxGeometry(.28, .26, 14.8).translate(10.32, -.2, -2.7), beamM));
  for (let x = -15.5; x <= 10.3; x += 2.15) { const p = mesh(new THREE.CylinderGeometry(.16, .18, 3.2, 8).translate(x, -1.5, 4.55), beamM); scene.add(p); }
  for (let z = -9.5; z <= 4.6; z += 2.15) { const p = mesh(new THREE.CylinderGeometry(.16, .18, 3.2, 8).translate(10.25, -1.5, z), beamM); scene.add(p); }
  // town quay behind (cobbles) + houses
  const cob = mat(cobbles(96, 96, { seed: 4, cols: ['#1b1b22', '#2e2d36', '#44424c', '#5b5862', '#757079'] }));
  scene.add(mesh(new THREE.BoxGeometry(44, .4, 18).translate(-6, -.2, -19), cob));
  const houses = [
    house({ x: -9.5, z: -14.5, w: 5.6, d: 4.6, h: 4.6, wall: 'wall', roof: 'roof2', door: 1.2, windows: [[-1.4, 2.1]], upper: [[-1.2, 3.7], [1.3, 3.7]] }),
    house({ x: -3.4, z: -15.2, w: 5, d: 4.6, h: 5.4, wall: 'wall3', roof: 'roof', door: -1.2, windows: [[1.1, 2.1]], upper: [[-1, 4.1], [1.2, 4.1]] }),
    house({ x: 2.6, z: -14.6, w: 5.2, d: 4.4, h: 4.2, wall: 'wall2', roof: 'roof3', door: .9, windows: [[-1.2, 2]], upper: [[1, 3.3]] }),
    house({ x: 8.4, z: -15.6, w: 5, d: 4.6, h: 5.8, wall: 'wall', roof: 'roof', windows: [[-1, 2.6], [1.2, 2.6]], upper: [[0, 4.4]] }),
    house({ x: -15.4, z: -15, w: 5.4, d: 4.6, h: 4.9, wall: 'wall3', roof: 'roof2', windows: [[0, 2.3]], upper: [[-1.2, 3.8]] }),
    house({ x: -6.4, z: -22, w: 6, d: 5, h: 6.6, wall: 'wall2', roof: 'roof', windows: [[-1.4, 3.3], [1.4, 3.3]], upper: [[0, 5.2]] }),
    house({ x: 4.6, z: -22.5, w: 5.4, d: 5, h: 6.2, wall: 'wall', roof: 'roof3', windows: [[0, 3.1]], upper: [[-1.2, 4.8]] }),
  ];
  houses.forEach(hh => scene.add(hh));
  const winMat = houses[0].userData.windows[0].material;
  const winLights = [[-9.5, 2.4, -11.6], [-3.2, 2.6, -12.4], [8.6, 2.8, -12.8]].map(([x, y, z]) => { const L = new THREE.PointLight('#ff9d4a', 6, 9, 2); L.position.set(x, y, z); scene.add(L); return L; });
  [[-420, -520, 520, 70, '#1b2944', 3], [120, -560, 700, 60, '#15213a', 7], [-100, -600, 900, 110, '#121c33', 11]].forEach(([x, z, w, h, c, s]) => { const r = ridge(w, h, c, s, { ppm: 1.4 }); r.position.set(x, SEA_Y - 2, z); scene.add(r); });

  // —— YOUR stall ——
  const stall = new THREE.Group(); scene.add(stall);
  const paint = mat(woodPlanks(48, 48, { pw: 48, len: 6, seed: 14, nails: false, cols: ['#132225', '#1f3538', '#2d4a4b', '#3e6260', '#557a72'] }));
  const counter = mesh(new THREE.BoxGeometry(2.6, .78, 1.0).translate(0, .39, 0), paint, { swap: true }); stall.add(counter);
  const iceP = new PX(48, 24), IR = ramp(['#4f6e84', '#86a8bc', '#bcd6e4', '#eaf4fa'], .45);
  iceP.fill((x, y) => { const n = fbm(x * .3, y * .3, 41); let v = .35 + n * .6; if (h2(x, y, 9) > .9) v += .25; return IR(v, x, y); });
  const ice = new THREE.Mesh(new THREE.BoxGeometry(2.5, .08, .9), new THREE.MeshStandardMaterial({ map: texOf(iceP.done()), roughness: .35 })); ice.position.set(0, .82, 0); ice.receiveShadow = true; stall.add(ice);
  // two back posts, a high striped canopy behind you, a striped skirt on the counter front
  for (const [x, z, h] of [[-1.28, -1.2, 2.95], [1.28, -1.2, 2.95]]) { const p = box(.09, h, .09, MM.beam); p.position.set(x, 0, z); stall.add(p); }
  const strP = new PX(48, 32), SA = ramp(['#1a3c44', '#2a5a62', '#3c7880'], .3), SB = ramp(['#a8a294', '#cfc8b6', '#e8e2d0'], .3);
  strP.fill((x, y) => { const s = Math.floor(x / 6) % 2; const v = .6 + (fbm(x * .2, y * .2, 3) - .5) * .4 - (y > 28 ? .3 : 0); return s ? SA(v, x, y) : SB(v, x, y); });
  const awnT = texOf(strP.done());
  const awn = new THREE.Mesh(new THREE.BoxGeometry(2.95, .05, .8), new THREE.MeshStandardMaterial({ map: awnT, roughness: .9 }));
  awn.position.set(0, 2.98, -1.0); awn.rotation.x = -.35; awn.castShadow = awn.receiveShadow = true; stall.add(awn);
  const valP = new PX(48, 6); valP.fill((x, y) => { const s = Math.floor(x / 6) % 2, r = Math.abs((x % 6) - 2.5); if (y > 3 && r > 3.5 - (y - 3)) return null; return s ? SA(.5, x, y) : SB(.55, x, y); });
  const val = new THREE.Mesh(new THREE.PlaneGeometry(2.95, .3), new THREE.MeshStandardMaterial({ map: texOf(valP.done()), alphaTest: .5, side: THREE.DoubleSide, roughness: .9 }));
  val.position.set(0, 2.98, -.6); val.castShadow = true; stall.add(val);
  const skP = new PX(48, 14); skP.fill((x, y) => { const s = Math.floor(x / 4) % 2, v = .5 + (fbm(x * .3, y * .3, 8) - .5) * .4 - (y > 11 ? .25 : 0); return s ? SA(v, x, y) : SB(v * .9, x, y); });
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(2.62, .42), new THREE.MeshStandardMaterial({ map: texOf(skP.done()), roughness: .95 }));
  skirt.position.set(0, .56, .505); skirt.receiveShadow = true; stall.add(skirt);
  // lamp bracket: from the left back post, forward over the counter
  const brk = box(.06, .06, 1.75, MM.beam, { cast: true }); brk.position.set(-1.28, 2.62, -.35); stall.add(brk);
  // sign board above: FRESH FISH
  const sgP = new PX(48, 10), SG = ramp(['#24160e', '#3e2a1a', '#5a3e26'], .45);
  sgP.fill((x, y) => SG(.55 + (h2(x >> 2, y, 3) - .5) * .4 - (y === 0 || y === 9 ? .3 : 0), x, y));
  pixText(sgP, 'FRESH FISH', 4, 2, [236, 226, 196]);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, .46, .06), [0, 0, 0, 0, new THREE.MeshStandardMaterial({ map: texOf(sgP.done()), roughness: .8 }), MM.beam].map(m => m || MM.beam));
  sign.position.set(0, 2.5, -1.2); sign.castShadow = true; stall.add(sign);
  // chalkboard leaning on the counter front: COD £10
  const cbP = new PX(18, 22), CB = ramp(['#151a18', '#202824', '#2a332e'], .45);
  cbP.fill((x, y) => { if (x < 1 || y < 1 || x > 16 || y > 20) return [92, 62, 36]; return CB(.5 + (h2(x, y, 4) - .5) * .5, x, y); });
  pixText(cbP, 'COD', 3, 3, [228, 228, 220]); pixText(cbP, '£10', 3, 12, [236, 214, 140]);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.5, .62), new THREE.MeshStandardMaterial({ map: texOf(cbP.done()), roughness: .9 }));
  board.position.set(-.75, .31, .56); board.rotation.x = -.18; board.castShadow = true; stall.add(board);
  // scale (right end of the counter)
  const metal = new THREE.MeshStandardMaterial({ color: '#a0a6ac', roughness: .45, metalness: .25 });
  const sBase = new THREE.Mesh(new THREE.BoxGeometry(.44, .14, .36), metal); sBase.position.set(.95, .93, -.05); sBase.castShadow = true; stall.add(sBase);
  const sDialP = new PX(12, 10); sDialP.fill((x, y) => { const d = Math.hypot(x - 5.5, y - 6); if (d > 5.6) return null; if (d > 4.8) return [40, 44, 50]; return (x === 5 && y > 2 && y < 7) || (x === 6 && y === 3) ? [180, 40, 30] : [228, 224, 210]; });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(.26, .22), new THREE.MeshStandardMaterial({ map: texOf(sDialP.done()), alphaTest: .5, roughness: .6 })); dial.position.set(.95, .96, .135); dial.rotation.x = -.35; stall.add(dial);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.3, .26, .04, 16), metal); plate.position.set(.95, 1.02, -.05); plate.castShadow = plate.receiveShadow = true; stall.add(plate);
  // cash tin
  const tin = new THREE.Mesh(new THREE.BoxGeometry(.3, .14, .22), new THREE.MeshStandardMaterial({ color: '#5a2a24', roughness: .6, metalness: .3 })); tin.position.set(-1.0, .93, -.22); tin.castShadow = true; stall.add(tin);
  // fish on the ice
  const counterFish = [];
  [[-.62, .05, .3, 2], [-.2, -.2, -.25, 5], [.15, .18, .1, 7], [-.95, .2, -.15, 11], [.45, -.22, -.35, 13]].forEach(([x, z, r, s], i) => {
    const f = flatFish(s, { w: 22, h: 9, cols: i % 2 ? ['#2e2a40', '#5a5274', '#8c84a4', '#c4bed4', '#f0ecf6'] : null }); f.rotation.set(-Math.PI / 2, 0, r); f.position.set(x, .865, z); f.userData.frame(0); stall.add(f); counterFish.push(f);
  });
  // THE fish (on the scale)
  const hero = flatFish(3, { w: 30, h: 12, s: SPX * .78 }); hero.userData.frame(0); scene.add(hero);
  // the hanging stall lamp
  const lampG = new THREE.Group(); lampG.position.set(-1.28, 2.62, .48); stall.add(lampG);
  const chain = new THREE.Mesh(new THREE.BoxGeometry(.02, .22, .02), new THREE.MeshStandardMaterial({ color: '#222' })); chain.position.y = -.11; lampG.add(chain);
  const lampBody = new THREE.Mesh(new THREE.BoxGeometry(.2, .26, .2), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 0 })); lampBody.position.y = -.35; lampG.add(lampBody);
  const lampCap = new THREE.Mesh(new THREE.ConeGeometry(.17, .12, 4), new THREE.MeshStandardMaterial({ color: '#1c1a18' })); lampCap.position.y = -.17; lampCap.rotation.y = Math.PI / 4; lampG.add(lampCap);
  const lampL = new THREE.PointLight('#ffb060', 0, 12, 1.6); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lampL.shadow.bias = -.004; lampL.shadow.camera.near = .05; scene.add(lampL);
  const lampGl = glow('#ffbe6a', 1.5, 1.2); scene.add(lampGl);

  const duck = box(2.4, .16, .7, MM.plankDark); duck.position.set(0, 0, -.85); stall.add(duck);
  // —— neighbours: closed stalls ——
  const shutP = new PX(48, 48), SH = ramp(['#262a30', '#3a4048', '#525a62', '#6a727a'], .45);
  shutP.fill((x, y) => SH(.5 + (y % 4 === 0 ? -.3 : y % 4 === 1 ? .2 : 0) + (fbm(x * .1, y * .1, 5) - .5) * .3, x, y));
  const shutM = mat(shutP.done());
  for (const [x, z, col] of [[-4.5, 0, ['#3a1c22', '#5c2c30', '#7a4040']], [5.2, -2.2, ['#22303c', '#34485a', '#4a6276']]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    g.add(mesh(new THREE.BoxGeometry(2.6, 2.1, 1.0).translate(0, 1.05, 0), shutM));
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 2.8, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: col[1], roughness: .9 })); r.position.set(0, 2.25, .55); r.castShadow = true; g.add(r);
    const rf = mesh(new THREE.BoxGeometry(2.8, .1, 1.2).translate(0, 2.18, 0), MM.plankDark); g.add(rf);
  }
  // —— props ——
  const R = mulberry(12);
  [[-1.85, -.35, .72], [-1.8, -.3, .58, .72], [-2.3, .5, .6], [6.2, 2.2, .7], [3.4, 3.9, .75], [6.8, 4.05, .7], [7.4, 3.6, .6], [-6.6, 2.4, .8]].forEach(([x, z, s, y]) => { const c = crate(s); c.position.set(x, y ?? 0, z); c.rotation.y = R() * .5; scene.add(c); });
  [[-2.6, -.6], [5.4, 3.9], [2.2, -.9]].forEach(([x, z]) => { const b = barrel(.32, .85); b.position.set(x, 0, z); scene.add(b); });
  const bollards = [[-8, 4.25], [-2.5, 4.25], [2.8, 4.25], [8.2, 4.25], [9.9, 0], [9.0, 2.9]];
  bollards.forEach(([x, z]) => { const b = mesh(new THREE.CylinderGeometry(.15, .18, .36, 8).translate(x, .18, z), MM.plankDark); scene.add(b); });
  const rope = new THREE.Mesh(new THREE.TorusGeometry(.32, .07, 6, 14), new THREE.MeshStandardMaterial({ color: '#7a6444', roughness: 1 })); rope.rotation.x = -Math.PI / 2; rope.position.set(-3.2, .07, 3.4); rope.castShadow = true; scene.add(rope);
  // pier-end lantern post
  const post = new THREE.Group(); post.position.set(9.95, 0, -3.2); scene.add(post);
  post.add(box(.12, 2.6, .12, MM.plankDark));
  const pLamp = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .22), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 3 })); pLamp.position.y = 2.7; post.add(pLamp);
  const pGl = glow('#ffb25e', 1.3, 1.1); pGl.position.y = 2.7; post.add(pGl);
  const pL = new THREE.PointLight('#ffae55', 7, 10, 2); pL.position.set(9.6, 2.4, -2.7); scene.add(pL);
  // moored boats (in front of the pier)
  const boats = [];
  function boat(x, z, ry, col, s = 1) {
    const g = new THREE.Group();
    const hs = new THREE.Shape(); hs.moveTo(-2.4, -.8); hs.lineTo(1.6, -.8); hs.quadraticCurveTo(2.9, -.4, 3.2, 0); hs.quadraticCurveTo(2.9, .4, 1.6, .8); hs.lineTo(-2.4, .8); hs.quadraticCurveTo(-2.7, 0, -2.4, -.8);
    const hg = new THREE.ExtrudeGeometry(hs, { depth: 1.0, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -.7, 0);
    g.add(mesh(hg, mat(woodPlanks(96, 96, { pw: 4, len: 96, seed: 21 + x | 0, cols: col }))));
    const cab = box(1.2, .8, 1.0, MM.plank); cab.position.set(-1.1, .3, 0); g.add(cab);
    const mast = mesh(new THREE.CylinderGeometry(.06, .08, 4.2, 6).translate(.6, 2.3, 0), MM.beam); g.add(mast);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(.14, .18, .14), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 3 })); bl.position.set(-1.1, 1.25, 0); g.add(bl);
    const bg = glow('#ffb25e', .9, 1.1); bg.position.copy(bl.position); g.add(bg);
    g.position.set(x, SEA_Y + .25, z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g); boats.push({ g, x, z, ry, bl, bg }); return g;
  }
  boat(-5.5, 7.0, .08, ['#0e1416', '#1a2628', '#2a3c3c', '#3c5250', '#506a66']);
  boat(4.2, 7.4, -.12, ['#160c0c', '#2c1616', '#4a2222', '#663030', '#7e4038']);
  boat(14.5, 1.2, Math.PI / 2 + .2, ['#121418', '#20242c', '#323846', '#46506a', '#5c6a8a'], .9);

  // —— sea + foam ——
  const SEA = sea(1400, { ppm: 9, deep: '#06101e', shallow: '#14304c', crest: '#4a7aa2' }); SEA.mesh.position.y = SEA_Y; scene.add(SEA.mesh);
  const foamC = new PX(64, 8); foamC.fill((x, y) => { const v = fbm(x * .2, y * .6, 31) - y * .06; return v > .5 ? (v > .6 ? [205, 220, 235] : [120, 150, 180]) : null; });
  const foamT = texOf(foamC.done()); foamT.wrapS = foamT.wrapT = THREE.RepeatWrapping;
  const foams = [];
  for (let x = -15.5; x <= 10.3; x += 2.15) { const t2 = foamT.clone(); t2.needsUpdate = true; const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .5), new THREE.MeshBasicMaterial({ map: t2, transparent: true, alphaTest: .5, color: '#8fa6c4' })); m.rotation.x = -Math.PI / 2; m.position.set(x, SEA_Y + .02, 4.6); scene.add(m); foams.push(t2); }

  // —— particles: sea mist, feathers, splash, coin glints ——
  const R2 = mulberry(77), dust = [...Array(140)].map(() => [R2() * 30 - 12, R2() * 5, R2() * 16 - 8, R2() * 10]);
  const D = particles(dust.length, (i, t, o) => { const d = dust[i]; o.x = d[0] + Math.sin(t * .2 + d[3]) * .8 + t * .12; o.y = d[1] + Math.sin(t * .3 + d[3] * 2) * .3; o.z = d[2]; o.a = .22 + .18 * Math.sin(t * 1.3 + d[3]); o.s = .045; o.r = .75; o.g = .82; o.b = 1; }, { soft: 1 });
  scene.add(D);
  const FE = particles(14, (i, t, o) => { const u = t - T.grab - .05; if (u < 0 || u > 2.2) { o.a = 0; o.x = 0; o.y = -9; o.z = 0; return; } o.x = .55 + (h2(i, 1) - .5) * .8 + Math.sin(u * 3 + i) * .25; o.y = 1.3 + (h2(i, 2) * .8 + .3) * Math.min(u, .4) * 2 - u * u * .18; o.z = .05 + (h2(i, 3) - .5) * .5; o.a = (1 - u / 2.2) * .9; o.s = .06; o.r = 1; o.g = 1; o.b = 1; }, { blend: THREE.NormalBlending });
  scene.add(FE);
  const SPL = particles(60, (i, t, o) => { const u = t - T.splash; if (u < 0 || u > 1.1) { o.a = 0; o.x = 0; o.y = -9; o.z = 0; return; } const a = h2(i, 4) * Math.PI * 2, sp = .8 + h2(i, 5) * 2.2, vy = 2.2 + h2(i, 6) * 3.4; o.x = 11.2 + Math.cos(a) * sp * u * .8; o.z = 2.2 + Math.sin(a) * sp * u * .8; o.y = SEA_Y + vy * u - 4.9 * u * u; if (o.y < SEA_Y) o.a = 0; else o.a = (1 - u / 1.1) * 1.1; o.s = .14 + h2(i, 7) * .1; o.r = .85; o.g = .93; o.b = 1; }, { blend: THREE.NormalBlending });
  scene.add(SPL);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .45, 24), new THREE.MeshBasicMaterial({ color: '#cfe2f2', transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(11.2, SEA_Y + .03, 2.2); scene.add(ring);

  // —— characters ——
  const you = makeChar('you'), gull = makeChar('gull'), gran = makeChar('gran');
  scene.add(you.root, gull.root, gran.root);

  // —— helpers ——
  const _v = new THREE.Vector3();
  const pick = (t, f) => (Math.floor(t * f) % 2 ? 1 : 0);
  const idle = (t, a = 'idle0', b = 'idle1', blink = 'blink', seed = 0) => (Math.floor(t * 8 + seed) % 29 === 0 ? blink : pick(t + seed * .13, 1.4) ? b : a);
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const v3 = a => new THREE.Vector3(...a);

  // runner path during the chase: round the counter end, then along the pier front
  function youPos(t) {
    if (t < T.flop + .45) return [YOU.x, YOU.z];
    const x = youRunX(t), z = x < 1.9 ? lerp(YOU.z, 1.55, ss((x - 1.0) / .9)) : 1.55;
    return [Math.max(x, YOU.x + (t - T.flop - .45) * 3), z];
  }
  // the fish: lies on the scale, then flops along the pier, then leaps
  function fishPose(t) {
    const P0 = [.95, 1.045, -.05];
    if (t < FLOPS[0]) return { p: P0, rx: -Math.PI / 2, rz: .15, frame: t >= T.eye ? (t >= VO.find(v => v.id === 'f1').t && t < VO.find(v => v.id === 'f1').t + .7 ? 2 : 1) : 0 };
    const xs = [P0[0], 1.9, 3.0, 4.15, 5.3, 6.45, 7.6, 8.75], zs = [P0[2], .9, 1.35, 1.3, 1.4, 1.3, 1.4, 1.35], ys = [P0[1], .03, .03, .03, .03, .03, .03, .03];
    let i = FLOPS.length - 1; while (i > 0 && t < FLOPS[i]) i--;
    const u = clamp((t - FLOPS[i]) / .42);
    if (i === FLOPS.length - 1) {   // the leap into the sea
      const w = clamp((t - FLOPS[i]) / .5), x = lerp(xs[7], 11.2, w), z = lerp(zs[7], 2.2, w), y = lerp(.03, SEA_Y, w) + Math.sin(w * Math.PI) * 1.6;
      return { p: [x, y, z], rx: -Math.PI / 2 + Math.floor(w * 10) * Math.PI / 4, rz: .3, frame: 2, hide: t > T.splash };
    }
    const x = lerp(xs[i], xs[i + 1], ss(u)), z = lerp(zs[i], zs[i + 1], u), y = lerp(ys[i], ys[i + 1], u) + Math.sin(u * Math.PI) * (i === 0 ? .5 : .55);
    const flip = Math.floor(u * 6) * Math.PI / 3;   // stepped spin around its long axis
    return { p: [x, y, z], rx: -Math.PI / 2 + (u < 1 ? flip : 0), rz: .1 * (i % 2 ? 1 : -1), frame: 1 };
  }
  function gullPose(t) {
    const L = [.62, .865, .06];
    if (t < T.gullIn) return { vis: false };
    if (t < T.land) { const u = ss(seg(t, T.gullIn, T.land)); return { vis: true, p: lerp3([2.6, 3.4, -.4], L, u), f: pick(t, 9) ? 'f0' : 'f1', flip: true }; }
    if (t < T.grab - .3) {
      const q = VO, sq1 = 11.333 + .1;
      let f = idle(t, 'stand', 'stand1', 'blink', 3); if (t > sq1 - .05 && t < sq1 + .75) f = 'squawk';
      return { vis: true, p: L, f, flip: true };
    }
    if (t < T.grab) return { vis: true, p: L, f: 'grab', flip: true };
    if (t < T.grab + .12) return { vis: true, p: L, f: 'grabFish', flip: true };
    if (t < T.grab + 2.2) { const u = seg(t, T.grab + .12, T.grab + 2.2); return { vis: true, p: [lerp(L[0], -2.6, u), L[1] + u * 5.2 + Math.sin(u * 9) * .1, lerp(L[2], -2.2, u)], f: pick(t, 9) ? 'ff0' : 'ff1', flip: true }; }
    if (t < T.turn - .5) return { vis: false };
    // the gull has taken over the stall: on the counter, wearing your cap, facing the customer side
    const C2 = [-.15, .865, -.1], sq2 = 43.333 + .1;
    let f = idle(t, 'cap', 'cap1', 'capBlink', 5); if (t > sq2 - .05 && t < sq2 + .75) f = 'capSquawk';
    return { vis: true, p: C2, f, flip: false };
  }
  function granPose(t) {
    const x = granX(t), w = granWalking(t);
    let f = 'stand', flip = true;
    const g1 = VO.find(v => v.id === 'g1'), g2 = VO.find(v => v.id === 'g2');
    if (t < T.leave) {
      if (w) f = ['w0', 'w1', 'w2', 'w3'][granStep(t)];
      else if (t > g1.box[0] && t < g1.box[1] + .2) f = pick(t, 1.2) ? 'two1' : 'two';
      else if (t > T.granAt + 3.6) f = pick(t, 1) ? 'stare1' : 'stare';
      else f = idle(t, 'stand', 'stand1', 'blink', 1);
      return { vis: t > T.granIn - .3, p: [x, 0, GRAN.z], f, flip };
    }
    if (t < T.leave + 6) { f = w ? ['l0', 'l1', 'l2', 'l3'][granStep(t)] : 'smileFish'; return { vis: true, p: [x, 0, GRAN.z], f, flip: true }; }
    // rule four: she is back, at the gull's counter, paying
    const B2 = T.turn - .4;
    if (t < 47.2) { f = t > g2.box[0] - .4 && t < g2.box[1] ? 'pay' : 'smileFish'; return { vis: t > B2, p: [GRAN.x1 - .55, 0, GRAN.z], f, flip: true }; }
    const u = seg(t, 47.2, 52.5), xx = lerp(GRAN.x1 - .55, -7.5, u);
    return { vis: true, p: [xx, 0, GRAN.z + u * .6], f: ['l0', 'l1', 'l2', 'l3'][granStep(t)], flip: true };
  }
  function youPose(t) {
    const [x, z] = youPos(t);
    const y1 = VO.find(v => v.id === 'y1'), y2 = VO.find(v => v.id === 'y2');
    let f, flip = false;
    if (t < T.lamp) f = 'idle0';
    else if (t < T.lift) f = idle(t, 'smile', 'smile', 'blink');
    else if (t < T.land - .3) f = pick(t, 1.6) ? 'proud1' : 'proud';
    else if (t < T.grab) f = t > y1.t - .1 && t < y1.t + 1.6 ? (pick(t, 3) ? 'talk' : 'talk1') : idle(t, 'smile', 'smile', 'blink', 2);
    else if (t < T.grab + 2.6) f = pick(t, 4) ? 'shock' : 'shock1';
    else if (t < T.granAt) f = idle(t, 'frown', 'frown', 'blink', 4);
    else if (t < y2.box[0]) f = idle(t, 'smile', 'smile', 'blink', 4);
    else if (t < T.stare) f = 'talkAngry';
    else if (t < T.leave) f = 'frown';
    else if (t < T.leave + 1.4) f = 'give';
    else if (t < T.flop) f = t > T.eye ? 'frown' : idle(t, 'sad', 'sad', 'blink', 6);
    else if (t < T.flop + .45) f = 'reach';
    else if (t < T.splash - .25) f = ['r0', 'r1', 'r2', 'r3'][runStep(t)];
    else if (t < 40.667) f = pick(t, 6) ? 'skid' : 'shock1';
    else if (t < T.turn) f = idle(t, 'sad', 'sad', 'blink', 7);
    else if (t < 43.2) f = 'back';
    else if (t < 49.333) f = pick(t, 3) ? 'backShock' : 'back';
    else f = Math.floor(t * 8) % 31 === 0 ? 'sitBlink' : 'sit';
    let p = [x, t < T.flop + .45 ? .16 : 0, z];
    if (t >= 40.0 && t < 49.333) p = [YOU.edgeX, 0, 1.55];
    if (t >= 49.333) p = [9.0, 0, 3.05];
    return { p, f, flip };
  }

  // —— Cameras: every path a monotone track; focus subject per shot ——
  const CAM = {
    open: { p: track([[0, [1.6, 12.6, 15.8]], [6.667, [.6, 9.4, 11.6]]]), l: track([[0, [0, 1.0, -.2]], [6.667, [0, 1.15, 0]]]), fov: 36, aper: 420 },
    gull: { p: track([[6.667, [-1.3, 7.6, 9.2]], [16, [-1.0, 7.4, 8.8]]]), l: track([[6.667, [.15, .75, .2]], [13.333, [.1, .75, .2]], [14.1, [-.6, 2.4, -.8]], [15.3, [-.2, 1.2, -.1]], [16, [-.1, .9, 0]]]), fov: 34, aper: 360 },
    gran: { p: track([[16, [6.2, 7.6, 10.2]], [19.4, [3.9, 7.0, 9.4]], [25.333, [3.4, 6.8, 9.0]]]), l: track([[16, [3.6, 1.0, .5]], [19.4, [1.0, 1.1, .3]], [25.333, [.9, 1.1, .3]]]), fov: 34, aper: 360 },
    stare: { p: track([[25.333, [GRAN.x1 - .2, 3.0, GRAN.z + 3.9]], [26.667, [GRAN.x1 - .15, 2.6, GRAN.z + 3.2]]]), l: track([[25.333, [GRAN.x1 - .12, 1.0, GRAN.z]], [26.667, [GRAN.x1 - .12, 1.05, GRAN.z]]]), fov: 30, aper: 160 },
    leave: { p: track([[26.667, [.4, 8.6, 11.2]], [29.333, [.1, 8.4, 10.9]]]), l: track([[26.667, [-.9, 1.0, .3]], [29.333, [-1.2, 1.0, .3]]]), fov: 36, aper: 360 },
    insert: { p: track([[29.333, [1.6, 4.1, 2.9]], [36, [1.4, 3.4, 2.2]]]), l: track([[29.333, [.92, .78, -.2]], [36, [.92, .8, -.2]]]), fov: 30, aper: 140 },
    chase: null,
    edge: { p: track([[40.667, [17.3, 5.2, 3.8]], [42, [17.2, 5.2, 3.75]], [49.333, [16.7, 5.0, 3.6]]]), l: track([[40.667, [5.8, 1.05, 1.6]], [49.333, [5.5, 1.05, 1.5]]]), fov: 42, aper: 300 },
    rise: { p: track([[49.333, [.6, 9.4, 11.6]], [50.6, [1.2, 10.4, 12.6]], [55, [6.0, 21, 25]], [60, [6.8, 25, 29.5]]]), l: track([[49.333, [0, 1.15, 0]], [55, [5.2, .5, -.6]], [60, [5.6, .3, -.8]]]), fov: 36, aper: 480 },
  };

  function update(t, shot, cam, post, renderer) {
    // —— camera ——
    let subj;
    if (shot.id === 'chase') {
      const [rx] = youPos(t), fx = fishPose(t).p[0], cx = Math.max(rx, fx - 1.2);
      const lx = Math.min(cx + 1.1, 9.9);
      cam.position.set(lx + 1.6 - ss(seg(t, 36, 36.8)) * .6, 7.2, 10.8); cam.fov = 34; cam.updateProjectionMatrix(); cam.lookAt(lx, .55, 1.0);
      subj = v3([rx, .8, 1.55]); post.dof.aper = 280;
    } else {
      const C = CAM[shot.id]; cam.position.set(...C.p(t)); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.lookAt(...C.l(t)); post.dof.aper = C.aper;
    }

    // —— time of day: pre-dawn → sunrise ——
    const sun = ss(seg(t, T.sun, T.sun + 4.2));
    SK.u.top.value.copy(SKY.top[0]).lerp(SKY.top[1], sun); SK.u.mid.value.copy(SKY.mid[0]).lerp(SKY.mid[1], sun); SK.u.hor.value.copy(SKY.hor[0]).lerp(SKY.hor[1], sun); SK.u.moonI.value = sun * 1.4;
    scene.fog.color.copy(FOG0).lerp(FOG1, sun * .8); scene.fog.density = lerp(.018, .011, sun);
    const keyDir0 = new THREE.Vector3(-.45, .75, .3).normalize(), sunDir = new THREE.Vector3(SUNDIR.x, lerp(.12, .3, sun), SUNDIR.z).normalize();
    const kd = keyDir0.clone().lerp(sunDir, ss(seg(t, T.sun, T.sun + 2.6))).normalize();
    key.position.copy(key.target.position).addScaledVector(kd, 60);
    key.color.set('#8ea4d8').lerp(new THREE.Color('#ffc48a'), sun); key.intensity = lerp(.85, 2.6, sun);
    hemi.color.set('#5a6c9c').lerp(new THREE.Color('#9ab0d8'), sun); hemi.groundColor.set('#141420').lerp(new THREE.Color('#3a2c28'), sun); hemi.intensity = lerp(1.6, 1.15, sun);
    renderer.toneMappingExposure = lerp(1.32, 1.05, sun);
    post.vig.uniforms.warm.value = lerp(.08, .22, sun);

    // —— practicals ——
    // stall lamp: off → click on at T.lamp (with a stutter) → breathes → fades with the daylight
    let lv = 0; const dl = t - T.lamp;
    if (dl >= 0) lv = dl < .05 ? 1 : dl < .11 ? .15 : dl < .16 ? 1 : 1;
    lv *= 1 - ss(seg(t, T.sun + 1.2, T.sun + 3.4));
    const fk = flick(t, 2) * .5 + .5;   // gentle oil-lamp breathing
    const swing = Math.sin(t * 1.7) * .05 + (t > T.grab && t < T.grab + 3 ? Math.sin((t - T.grab) * 9) * .25 * Math.exp(-(t - T.grab) * 1.2) : 0);
    lampG.rotation.z = swing; lampG.updateMatrixWorld();
    lampBody.getWorldPosition(_v);
    const toCam = cam.position.clone().sub(_v).setY(0).normalize();
    lampL.position.copy(_v).addScaledVector(toCam, .42); lampL.intensity = Math.pow(lv * fk, 1.3) * 6.5;
    lampGl.position.copy(_v); lampGl.material.opacity = lv * .7; lampGl.scale.setScalar(.8 + .15 * fk + (dl > 0 && dl < .5 ? (1 - dl / .5) * 1.0 : 0));
    lampBody.material.emissiveIntensity = lv * 4.5 * fk;
    const winK = 1 - sun * .85; winMat.emissiveIntensity = 2.2 * winK; winLights.forEach((L, i) => L.intensity = 6 * winK * (1 + .04 * Math.sin(t * 3 + i)));
    pL.intensity = 7 * flick(t, 6) * (1 - sun * .9); pLamp.material.emissiveIntensity = 3 * (1 - sun * .8); pGl.material.opacity = 1 - sun * .85;
    boats.forEach((b, i) => { b.g.position.y = SEA_Y + .25 + Math.sin(t * .9 + i * 2) * .06; b.g.rotation.z = Math.sin(t * .7 + i) * .025; b.bg.material.opacity = 1 - sun * .8; });

    SEA.u.t.value = t; SEA.u.camPos.value.copy(cam.position); SEA.u.fogColor.value.copy(scene.fog.color); SEA.u.fogDensity.value = scene.fog.density;
    SEA.u.bright.value = 1;
    SEA.u.deep.value.set('#06101e').lerp(new THREE.Color('#2a3a5a'), sun); SEA.u.shallow.value.set('#14304c').lerp(new THREE.Color('#5a6a8a'), sun); SEA.u.crest.value.set('#4a7aa2').lerp(new THREE.Color('#ffd0a0'), sun * .7);
    const sunPos = cam.position.clone().addScaledVector(new THREE.Vector3(SUNDIR.x, .02, SUNDIR.z), 120); sunPos.y = SEA_Y + 2;
    SEA.setLights([{ p: lampL.position, c: new THREE.Color('#ffb060'), i: .8 * lv }, { p: pL.position, c: new THREE.Color('#ffae55'), i: .7 * (1 - sun) }, ...boats.map(b => ({ p: b.g.position.clone().setY(SEA_Y + 1.3), c: new THREE.Color('#ffb45a'), i: .35 * (1 - sun) })), { p: sunPos, c: new THREE.Color('#ffc890'), i: sun * 2.2 }]);
    D.userData.update(t); FE.userData.update(t); SPL.userData.update(t);
    foams.forEach((f, i) => f.offset.set(Math.sin(t * .6 + i) * .08, Math.floor(t * 4) % 2 * .12));
    const ru = t - T.splash; ring.material.opacity = ru > 0 && ru < 1.6 ? (1 - ru / 1.6) * .8 : 0; ring.scale.setScalar(1 + Math.max(0, ru) * 2.2);

    // —— counter fish: one goes with the gull, one with grandma ——
    counterFish[2].visible = t < T.grab;            // the gull's
    counterFish[0].visible = t < T.leave;           // grandma's
    // —— the fish ——
    const F = fishPose(t); hero.visible = !F.hide; hero.position.set(...F.p); hero.rotation.set(F.rx, 0, F.rz); hero.userData.frame(F.frame);

    // —— characters ——
    const Y = youPose(t); you.root.position.set(...Y.p); you.frame(Y.f); you.face(cam, Y.flip);
    you.shadowBlob.visible = !(Y.p[2] < 0 && t < T.flop);   // behind the counter: no blob over the counter
    const G = gullPose(t); gull.root.visible = !!G.vis; if (G.vis) { gull.root.position.set(...G.p); gull.frame(G.f); gull.face(cam, G.flip); gull.shadowBlob.visible = G.f[0] !== 'f'; }
    const N = granPose(t); gran.root.visible = !!N.vis; if (N.vis) { gran.root.position.set(...N.p); gran.frame(N.f); gran.face(cam, N.flip); }

    // —— focus subject (depth of field + tilt band) ——
    if (!subj) {
      const S = {
        open: [0, 1.25, -.3], gull: [.2, 1.3, -.2], gran: [lerp(granX(t), .5, .45), 1.0, .5], stare: [GRAN.x1, 1.15, GRAN.z], leave: [-.2, 1.2, -.3], insert: [.95, 1.05, -.05],
        edge: t < T.turn ? [YOU.edgeX, .9, 1.55] : null, rise: null,
      }[shot.id];
      if (shot.id === 'edge' && !S) { const u = ss(seg(t, T.turn, T.rackEnd)); subj = v3([YOU.edgeX, .9, 1.55]).lerp(v3([0, 1.25, -.1]), u); }
      else if (shot.id === 'rise') { const u = ss(seg(t, 50.2, 55.5)); subj = v3([0, 1.25, 0]).lerp(v3([9.0, .5, 3.05]), u); }
      else subj = v3(S);
    }
    post.dof.focus = cam.position.distanceTo(subj); post.dof.maxCoc = 22;
    fill.position.copy(subj).add(new THREE.Vector3(.3, .6, 2.0)); fill.intensity = shot.id === 'rise' ? 0 : shot.id === 'stare' ? 2.6 : 1.5 * (1 - sun);
    fill.color.set(shot.id === 'stare' || shot.id === 'insert' ? '#ffcf9a' : '#9fb2e8');
    return subj;
  }
  return { scene, update };
}
