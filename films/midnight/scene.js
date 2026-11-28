// Midnight Crossing — the static diorama: wet streets, the level crossing bed, pavements, two apartment blocks, the store, the
// lamp, the bus shelter, the noodle corner, poles and wires. Everything animated lives in actors.js.
import * as THREE from 'three';
import { GB } from './geo.js';
import { canvasTex } from './sprites.js';
import { ROAD, EWR, RAIL, BLK, STORE, LAMP, HOLE, SHELTER, VEND, CART } from './story.js';
import { mulberry } from '/core/lib.js';

const R = mulberry(41);
export const MAT = {};
// tiled pavement and wet asphalt textures (world-space uvs: 1 unit = 1 m)
function tileTex() {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a5d63'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 84 + (R() * 22 | 0); g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(20,25,20,${.05 + R() * .1})`; g.beginPath(); g.arc(R() * w, R() * h, 4 + R() * 14, 0, 7); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 2.4, 1 / 2.4); return t;
}
function asphaltTex() {
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4000; k++) { const v = 30 + R() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(R() * w, R() * h, 2, 2); }
    for (let k = 0; k < 26; k++) { g.fillStyle = `rgba(10,12,16,${.25 + R() * .3})`; g.beginPath(); g.ellipse(R() * w, R() * h, 20 + R() * 60, 10 + R() * 30, R() * 3, 0, 7); g.fill(); }   // puddle-dark patches
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, 1 / 9); return t;
}
function roughTex() {   // puddles: shiny (dark in the roughness map)
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 18; k++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); g.save(); g.translate(R() * w, R() * h); g.scale(30 + R() * 70, 14 + R() * 30); gr.addColorStop(0, '#080808'); gr.addColorStop(.8, '#181818'); gr.addColorStop(1, 'rgba(154,154,154,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
  });
  t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, 1 / 9); return t;
}
function plane(x0, x1, z0, z1, y, mat) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute('uv'), p = g.getAttribute('position'); for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
// a facade: stained concrete, a grid of windows, some lit (emissive map)
function facade(wid, hgt, floors, bays, lit, seed, base = '#8d8a7e') {
  const r = mulberry(seed), PX = 64, W = Math.round(wid * PX), H = Math.round(hgt * PX), fl = hgt / floors, bw = wid / bays;
  const win = (g, i, f) => [(i + .22) * bw * PX, H - (f + .78) * fl * PX, bw * .56 * PX, fl * .5 * PX];
  const map = canvasTex(W, H, g => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${40 + r() * 30 | 0},${55 + r() * 30 | 0},${35 + r() * 20 | 0},${.08 + r() * .14})`; g.beginPath(); g.ellipse(r() * W, r() * H, 10 + r() * 50, 8 + r() * 40, 0, 0, 7); g.fill(); }
    for (let k = 0; k < 50; k++) { const x = r() * W, y = r() * H * .9; const gr = g.createLinearGradient(0, y, 0, y + 40 + r() * 120); gr.addColorStop(0, 'rgba(40,45,35,.35)'); gr.addColorStop(1, 'rgba(40,45,35,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 5, 160); }   // drip streaks
    for (let f = 0; f < floors; f++) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, H - (f + 1) * fl * PX, W, 5); }
    for (let f = 0; f < floors; f++) for (let i = 0; i < bays; i++) {
      const [x, y, w, h] = win(g, i, f); g.fillStyle = '#1b1f27'; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(90,100,110,.6)'; g.fillRect(x - 3, y + h, w + 6, 4);   // sill
      g.strokeStyle = '#4a4c50'; g.lineWidth = 2; for (let b = 1; b < 4; b++) { g.beginPath(); g.moveTo(x + w * b / 4, y); g.lineTo(x + w * b / 4, y + h); g.stroke(); }   // window bars
    }
  });
  const em = canvasTex(W, H, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const [i, f, c] of lit) { const [x, y, w, h] = win(g, i, f); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c || '#ffcf7a'); gr.addColorStop(1, '#d7892e'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(60,30,10,.5)'; g.fillRect(x, y, w * .28, h); }   // a drawn curtain on one side
  });
  return new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: 1.6, roughness: .9 });
}
export function buildScene(scene) {
  const tile = tileTex(), asp = asphaltTex(), rgh = roughTex();
  MAT.pave = new THREE.MeshStandardMaterial({ map: tile, roughness: .55, metalness: .05, color: '#a7adb8' });
  MAT.road = new THREE.MeshStandardMaterial({ map: asp, roughnessMap: rgh, roughness: .38, metalness: .35, color: '#a3a9b4' });
  MAT.v = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 });
  MAT.metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .8 });
  // ground: pavement everywhere, streets on top
  scene.add(plane(-60, 60, -60, 60, .15, MAT.pave));
  scene.add(plane(ROAD.x0, ROAD.x1, -60, 60, .17, MAT.road));
  scene.add(plane(-60, 60, EWR.z0, EWR.z1, .171, MAT.road));
  const b = new GB(), m = new GB(), e = new GB();
  // kerbs
  for (const [x0, x1, z0, z1] of [[ROAD.x0 - .18, ROAD.x0, -60, -RAIL.bed], [ROAD.x1, ROAD.x1 + .18, -60, -RAIL.bed], [ROAD.x0 - .18, ROAD.x0, RAIL.bed, EWR.z0], [ROAD.x1, ROAD.x1 + .18, RAIL.bed, EWR.z0],
    [ROAD.x0 - .18, ROAD.x0, EWR.z1, 60], [ROAD.x1, ROAD.x1 + .18, EWR.z1, 60], [-60, ROAD.x0, EWR.z0 - .18, EWR.z0], [ROAD.x1, 60, EWR.z0 - .18, EWR.z0], [-60, ROAD.x0, EWR.z1, EWR.z1 + .18], [ROAD.x1, 60, EWR.z1, EWR.z1 + .18]])
    b.box(x0, x1, .1, .26, z0, z1, '#9da2a8');
  // markings: centre dashes, stop lines, the zebra the raincoat walks over, the yellow box at the crossing
  for (let z = -60; z < 60; z += 3) if (Math.abs(z) > 3 && (z < EWR.z0 - 1 || z > EWR.z1)) b.flat(-.07, .07, z, z + 1.6, .18, '#d8d2bc');
  for (let x = -60; x < 60; x += 3) if (Math.abs(x) > 6) b.flat(x, x + 1.6, 8.43, 8.57, .18, '#d8d2bc');
  b.flat(.1, ROAD.x1, 3.6, 3.85, .18, '#e4e0d0'); b.flat(ROAD.x0, -.1, -3.85, -3.6, .18, '#e4e0d0');
  for (let k = 0; k < 6; k++) b.flat(-5.9, -3.75, EWR.z0 + .35 + k * .8, EWR.z0 + .75 + k * .8, .18, '#dcd8ca');
  for (let k = 0; k < 6; k++) b.flat(3.75, 5.9, EWR.z0 + .35 + k * .8, EWR.z0 + .75 + k * .8, .18, '#dcd8ca');
  // rail bed: gravel strip, sleepers, rails; over the street, rubber crossing panels
  b.flat(-60, 60, -RAIL.bed, RAIL.bed, .165, '#5d5b56');
  for (let x = -60; x < 60; x += .62) { if (x > -6.2 && x < 6.2) continue; b.box(x, x + .26, .16, .24, -.95, .95, '#4a3f34'); }
  b.box(-6.2, 6.2, .16, .22, -1.1, 1.1, '#55565a');
  for (const z of [-RAIL.g, RAIL.g]) m.box(-60, 60, .2, .32, z - .05, z + .05, '#c9ccd3');
  // north pavement: electricity poles and sagging wires; parked scooters; planters
  for (const x of [-6.6, 6.6]) { b.cyl(x, -6.2, .16, 0, 9.5, '#7d7a72', 8); b.box(x - .9, x + .9, 8.6, 8.75, -6.3, -6.1, '#6b675e'); }
  const wire = new THREE.LineBasicMaterial({ color: '#111318' });
  for (let k = 0; k < 7; k++) {
    const pts = []; const y0 = 8.7 - k * .12 + (k % 2) * .05, sag = .7 + k * .12, dz = (k - 3) * .12;
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = -26 + u * 52; const seg_ = x < -6.6 ? (x + 26) / 19.4 : x < 6.6 ? (x + 6.6) / 13.2 : (x - 6.6) / 19.4; pts.push(new THREE.Vector3(x, y0 - Math.sin(Math.PI * seg_) * sag, -6.2 + dz)); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
  }
  const bikeCols = ['#2b3d5a', '#5a2b2b', '#3b3b3b', '#c8c8c8', '#2b5a3d'];
  for (let i = 0; i < 9; i++) { const x = -15.5 + i * 1.2 + (i > 4 ? 18.4 : 0), z = -7.6; if (x > 16) break; const c = bikeCols[i % 5]; b.box(x - .22, x + .22, .2, .75, z - .75, z + .75, c); b.box(x - .18, x + .18, .75, .95, z - .1, z + .55, '#151515'); }
  for (const [x, z] of [[-10, 15.4], [-2, 19], [9.5, 13.4], [14, 13.4]]) { b.box(x - .6, x + .6, .15, .75, z - .6, z + .6, '#6d6a63'); }
  // the apartment blocks (two, the street runs north between them); roofs with parapets
  for (const k of ['w', 'e']) {
    const { x0, x1 } = BLK[k], z0 = BLK.z0, z1 = BLK.z1, h = BLK.h;
    b.box(x0, x1, 0, h, z0, z1, k === 'w' ? '#7a786d' : '#857a6d', '#8d8f93');
    b.box(x0, x1, h, h + .7, z1 - .25, z1, '#8a877c'); b.box(x0, x1, h, h + .7, z0, z0 + .25, '#8a877c');
    b.box(x0, x0 + .25, h, h + .7, z0, z1, '#8a877c'); b.box(x1 - .25, x1, h, h + .7, z0, z1, '#8a877c');
    b.box(x0, x1, 0, .5, z1, z1 + .3, '#5e5a52');
    // stairwell hut, a satellite dish, roof clutter
    const hx = k === 'w' ? x0 + 2 : x1 - 4.5; b.box(hx, hx + 2.6, h, h + 2.6, z0 + 1.2, z0 + 4, '#8f8a7d', '#5c5d60');
    b.box(hx + .3, hx + 1.2, h + 2.6, h + 2.75, z0 + 1.5, z0 + 3, '#3a3a3a');
  }
  const fW = facade(BLK.w.x1 - BLK.w.x0, BLK.h, 4, 5, [[0, 0, '#ffd690'], [3, 1], [1, 2], [4, 3, '#ffe2a8']], 3, '#88867a');
  const fE = facade(BLK.e.x1 - BLK.e.x0, BLK.h, 4, 5, [[1, 0], [2, 2, '#ffd18a'], [0, 3], [3, 1, '#fff0c8']], 9, '#8e8476');
  for (const [k, mat] of [['w', fW], ['e', fE]]) { const { x0, x1 } = BLK[k]; const g = new THREE.PlaneGeometry(x1 - x0, BLK.h); g.translate((x0 + x1) / 2, BLK.h / 2, BLK.z1 + .02); const me = new THREE.Mesh(g, mat); me.receiveShadow = true; scene.add(me); }
  // the floor-3 balcony (west block): slab + railing; door behind is an actor (light)
  b.box(-11.6, -8.6, 2 * BLK.fl, 2 * BLK.fl + .18, BLK.z1, BLK.z1 + 1.1, '#9a978c');
  for (let x = -11.6; x <= -8.55; x += .25) b.box(x, x + .05, 2 * BLK.fl + .18, 2 * BLK.fl + 1.1, BLK.z1 + 1.03, BLK.z1 + 1.08, '#2b2b2b');
  b.box(-11.6, -8.6, 2 * BLK.fl + 1.08, 2 * BLK.fl + 1.15, BLK.z1 + 1, BLK.z1 + 1.1, '#2b2b2b');
  // ground-floor shop shutters on the blocks
  for (const k of ['w', 'e']) { const { x0, x1 } = BLK[k]; for (let x = x0 + .4; x < x1 - 2; x += 2.45) b.box(x, x + 2.1, .1, 2.4, BLK.z1, BLK.z1 + .06, '#6e7378'); }
  // the convenience store (bottom left): box, a lit band of windows on its east face, an awning
  b.box(STORE.x0, STORE.x1, 0, STORE.h, STORE.z0, STORE.z1, '#d9dde0', '#a5a9ad');
  b.box(STORE.x1, STORE.x1 + .9, 2.7, 2.85, STORE.z0, STORE.z0 + 5.2, '#2e8a52');
  b.box(STORE.x0, STORE.x1, STORE.h, STORE.h + .4, STORE.z0, STORE.z0 + .2, '#2e8a52'); b.box(STORE.x0, STORE.x1, STORE.h, STORE.h + .4, STORE.z0, STORE.z1, '#2e8a52', '#b9bdc0', { noSides: true });
  for (const [x, z] of [[-12.4, 17.5], [-9.2, 18.6]]) b.box(x - .8, x + .8, STORE.h + .4, STORE.h + 1.2, z - .5, z + .5, '#9da0a3');   // roof AC units
  // the street lamp
  b.cyl(LAMP.x, LAMP.z, .14, 0, LAMP.h, '#3e4148', 8); b.box(Math.min(LAMP.x, LAMP.hx) - .05, Math.max(LAMP.x, LAMP.hx) + .05, LAMP.h - .12, LAMP.h, Math.min(LAMP.z, LAMP.hz) - .06, Math.max(LAMP.z, LAMP.hz) + .06, '#3e4148');
  // a second, dimmer lamp far north (silhouette only)
  b.cyl(5.4, -7.4, .12, 0, 6.5, '#3e4148', 8);
  // the bus shelter: posts, bench, a lit ad panel on the east end; glass is added as a transparent mesh
  const S = SHELTER;
  for (const [x, z] of [[S.x0, S.z0], [S.x1, S.z0], [S.x0, S.z1], [S.x1, S.z1]]) m.box(x - .05, x + .05, .15, 2.6, z - .05, z + .05, '#b8bcc4');
  b.box(S.x0 + .4, S.x1 - .6, .55, .62, S.z0 + .2, S.z0 + .55, '#6a6f78');
  b.box(S.x0 + .5, S.x0 + .58, .15, .55, S.z0 + .25, S.z0 + .5, '#444'); b.box(S.x1 - .7, S.x1 - .62, .15, .55, S.z0 + .25, S.z0 + .5, '#444');
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .22, roughness: .05, metalness: .2, depthWrite: false });
  { const gg = new THREE.Mesh(new THREE.BoxGeometry(S.x1 - S.x0 + .3, .05, S.z1 - S.z0 + .4), glass); gg.position.set((S.x0 + S.x1) / 2, 2.62, (S.z0 + S.z1) / 2); scene.add(gg);
    const bk = new THREE.Mesh(new THREE.BoxGeometry(S.x1 - S.x0, 2.3, .04), glass); bk.position.set((S.x0 + S.x1) / 2, 1.35, S.z0); scene.add(bk); }
  // vending machine (cyan front, facing the street)
  b.box(VEND.x - .5, VEND.x + .5, .15, 2.0, VEND.z - .4, VEND.z + .4, '#e9eef2');
  // noodle corner: plastic tables and stools (the cart itself is an actor: light, steam)
  for (const [x, z] of [[-10.2, 5.0], [-7.4, 5.2]]) { b.box(x - .45, x + .45, .62, .68, z - .45, z + .45, '#d24b3a'); b.box(x - .06, x + .06, .15, .62, z - .06, z + .06, '#a23a2c');
    for (const [dx, dz] of [[-.7, 0], [.7, 0], [0, .7]]) b.box(x + dx - .18, x + dx + .18, .15, .42, z + dz - .18, z + dz + .18, dx < 0 ? '#2f7ac0' : '#d24b3a'); }
  // manhole ring
  b.cyl(HOLE.x, HOLE.z, .78, .14, .19, '#2b2a28', 20);
  // bottom right: a small pharmacy (lit shutters, a green cross), trees in planters, parked scooters, a bench
  b.box(9.2, 17, 0, 3.4, 15.2, 22, '#c9c2b4', '#8f9194'); b.box(9.2, 17, 3.4, 3.7, 15.2, 15.5, '#2a8a5a');
  for (const [x, z] of [[-1.2 - 5.2, 16.2], [12.6, 18.8]]) { b.box(x - .7, x + .7, 3.7, 4.4, z - .5, z + .5, '#a2a5a8'); }
  for (const [x, z] of [[-9.5, -4.6], [-13.5, -4.6], [9.6, -4.6], [13.6, -4.6], [3 + 6.4, 12.6], [-1.2 - 15, 12.6]]) { b.box(x - .55, x + .55, .15, .6, z - .55, z + .55, '#5d5a52'); b.cyl(x, z, .1, .6, 1.8, '#3b2d22', 6); }
  for (let i = 0; i < 6; i++) { const x = 4.6 + i * .95, z = 12.3; const c = bikeCols[(i + 2) % 5]; b.box(x - .2, x + .2, .2, .7, z - .7, z + .7, c); b.box(x - .16, x + .16, .7, .9, z - .1, z + .5, '#151515'); }
  b.box(-2.4 - 13, -2.4 - 10.6, .5, .58, 12.1, 12.5, '#6b4a33');
  // shop fronts on the blocks' ground floors (lit), signs over them
  for (const [x0, x1, c] of [[-16.4, -12.6, '#ffe7b0'], [-12.1, -8.4, '#d8f0ff'], [5.4, 9.2, '#ffd7a8'], [13.2, 16.4, '#fff1c4']]) b.box(x0, x1, 2.5, 3.1, BLK.z1, BLK.z1 + .12, c);
  // cart body
  b.box(CART.x - 1.1, CART.x + 1.1, .55, 1.45, CART.z - .55, CART.z + .55, '#c8c0aa'); b.box(CART.x - 1.1, CART.x + 1.1, 1.45, 1.5, CART.z - .6, CART.z + .6, '#b7b0a0');
  for (const dx of [-.7, .7]) b.cyl(CART.x + dx, CART.z + .58, .32, .2, .2, '#222', 10);
  for (const [dx, dz] of [[-1.05, -.5], [1.05, -.5], [-1.05, .5], [1.05, .5]]) b.box(CART.x + dx - .04, CART.x + dx + .04, 1.5, 2.6, CART.z + dz - .04, CART.z + dz + .04, '#666');
  b.cyl(CART.x + .45, CART.z, .3, 1.5, 1.9, '#9aa3ad', 12);   // the pot
  for (const gb of [b]) { const me = new THREE.Mesh(gb.build(), MAT.v); me.castShadow = me.receiveShadow = true; scene.add(me); }
  { const me = new THREE.Mesh(m.build(), MAT.metal); me.receiveShadow = true; scene.add(me); }
  scene.add(new THREE.Mesh(e.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, opacity: .9 })));
  const leaf = new THREE.MeshStandardMaterial({ color: '#1f3a2a', roughness: .9 });
  for (const [x, z] of [[-9.5, -4.6], [-13.5, -4.6], [9.6, -4.6], [13.6, -4.6], [9.4, 12.6], [-16.2, 12.6]]) for (const [dx, dy, r] of [[0, 2.6, 1.1], [.5, 3.2, .8], [-.4, 3.1, .75]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf); c.position.set(x + dx, dy, z + dx * .3); c.castShadow = true; scene.add(c); }
  // the cart's orange tarp (lit from below)
  { const g = new THREE.PlaneGeometry(2.6, 1.6); g.rotateX(-Math.PI / 2 + .18); const me = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#ff8a2a', emissive: '#ff6a10', emissiveIntensity: .55, roughness: .8, side: THREE.DoubleSide }));
    me.position.set(CART.x, 2.62, CART.z); me.castShadow = true; scene.add(me); }
}
