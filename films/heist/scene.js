// The Last Train Heist — the static toy map: avenue, junction road, quiet street, alley; the viaduct, station and the cliff with
// the tunnel; three apartment blocks with roof clutter and a fire escape; the bank (dome), café, shops, trees, far city.
import * as THREE from 'three';
import { GB } from './geo.js';
import { canvasTex } from './sprites.js';
import { MAT, tileTex, asphaltTex, roughTex, plane, facade, std } from './kit.js';
import { NS, EW, QS, VIA, STATION, CLIFF, BANK, CAFE, STRIP, ALLEY, BLOCKS, FIRE } from './story.js';
import { mulberry } from '/core/lib.js';

export const LAMPS = [[-5.2, -1.2], [5.0, 7.6], [-5.2, 7.6], [5.0, -9], [-5.2, -9], [-7, 11.2], [4.4, 11.2], [-9, 15.6], [9, 15.6], [16, 7.6]];
export function buildScene(scene) {
  const R = mulberry(77);
  MAT.pave = new THREE.MeshStandardMaterial({ map: tileTex(), roughness: .6, color: '#9aa1ad' });
  MAT.road = new THREE.MeshStandardMaterial({ map: asphaltTex(), roughnessMap: roughTex(), roughness: .45, metalness: .3, color: '#9aa0aa' });
  MAT.v = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 });
  scene.add(plane(-80, 80, -80, 80, .15, MAT.pave));
  scene.add(plane(NS.x0, NS.x1, -80, QS.z1, .17, MAT.road));
  scene.add(plane(-80, 80, EW.z0, EW.z1, .171, MAT.road));
  scene.add(plane(-80, 80, QS.z0, QS.z1, .171, MAT.road));
  scene.add(plane(ALLEY.x - .7, ALLEY.x + .7, STRIP.z0 - .2, STRIP.z1 + .2, .168, MAT.road));
  const b = new GB(), e = new GB(), m = new GB();
  // kerbs
  const kerb = (x0, x1, z0, z1) => b.box(x0, x1, .1, .26, z0, z1, '#a2a7ad');
  for (const z of [EW.z0, EW.z1, QS.z0, QS.z1]) { kerb(-80, NS.x0, z - .09, z + .09); kerb(NS.x1, 80, z - .09, z + .09); }
  for (const x of [NS.x0, NS.x1]) { kerb(x - .09, x + .09, -80, EW.z0); kerb(x - .09, x + .09, EW.z1, QS.z0); }
  // markings: centre lines, zebras round the junction, stop lines, lane arrows
  for (let z = -80; z < QS.z1; z += 3) if ((z < EW.z0 - 3 || z > EW.z1 + 2) && (z < QS.z0 - 1 || z > QS.z1)) b.flat(-.07, .07, z, z + 1.6, .18, '#d8d4c4');
  for (let x = -80; x < 80; x += 3) if (Math.abs(x) > 6.5) { b.flat(x, x + 1.6, EW.z - .07, EW.z + .07, .18, '#d8d4c4'); b.flat(x, x + 1.6, QS.z - .06, QS.z + .06, .18, '#cfcbbd'); }
  for (let k = 0; k < 7; k++) { const x = NS.x0 + .3 + k * 1.0; b.flat(x, x + .55, EW.z0 - 2.2, EW.z0 - .4, .18, '#e2ded0'); b.flat(x, x + .55, EW.z1 + .4, EW.z1 + 2.2, .18, '#e2ded0'); }
  for (let k = 0; k < 6; k++) { const z = EW.z0 + .3 + k * 1.0; b.flat(NS.x0 - 2.2, NS.x0 - .4, z, z + .55, .18, '#e2ded0'); b.flat(NS.x1 + .4, NS.x1 + 2.2, z, z + .55, .18, '#e2ded0'); }
  // traffic lights at the four corners (heads glow: red for the cross road, green for the avenue)
  for (const [x, z, ry] of [[NS.x0 - .5, EW.z0 - .5, 0], [NS.x1 + .5, EW.z1 + .5, Math.PI], [NS.x1 + .5, EW.z0 - .5, 0], [NS.x0 - .5, EW.z1 + .5, Math.PI]]) {
    b.cyl(x, z, .08, .15, 3.6, '#3a3d42', 6); b.box(x - .14, x + .14, 3.0, 3.9, z - .14, z + .14, '#24272b');
    e.box(x - .1, x + .1, 3.68, 3.82, z + .1, z + .16, '#ff3020'); e.box(x - .1, x + .1, 3.08, 3.22, z + .1, z + .16, '#1a3a1a'); }
  // street lamps (heads are actors: they flash red with the alarm)
  for (const [x, z] of LAMPS) { b.cyl(x, z, .09, .15, 4.6, '#3a3d42', 6); }
  // —— the viaduct, rails, station, cliff and tunnel ——
  const z0 = VIA.z - VIA.w / 2, z1 = VIA.z + VIA.w / 2;
  b.box(VIA.x0, VIA.x1 + 2, VIA.h - .7, VIA.h, z0, z1, '#6d6f74', '#545659');
  b.box(VIA.x0, VIA.x1 + 2, VIA.h, VIA.h + .5, z1 - .15, z1, '#7b7d82'); b.box(VIA.x0, VIA.x1 + 2, VIA.h, VIA.h + .5, z0, z0 + .15, '#7b7d82');
  for (let x = VIA.x0 + 2; x < VIA.x1; x += 6.5) { if (Math.abs(x) < 5) continue; b.box(x - .5, x + .5, 0, VIA.h - .7, VIA.z - 1.6, VIA.z + 1.6, '#64666b'); }
  for (let x = VIA.x0; x < VIA.x1 + 2; x += .6) b.box(x, x + .22, VIA.h, VIA.h + .08, VIA.z - .9, VIA.z + .9, '#4a3f34');
  for (const dz of [-.55, .55]) m.box(VIA.x0, VIA.x1 + 2, VIA.h + .08, VIA.h + .2, VIA.z + dz - .05, VIA.z + dz + .05, '#c9ccd3');
  // overhead wires on posts
  for (let x = VIA.x0 + 1; x < VIA.x1; x += 9) { b.box(x - .07, x + .07, VIA.h, VIA.h + 4.4, z0 + .1, z0 + .3, '#55575c'); b.box(x - .07, x + .07, VIA.h + 4.2, VIA.h + 4.35, z0 + .1, VIA.z + .2, '#55575c'); }
  // station: platform, canopy on posts, ticket hall below with lit windows, stairs
  b.box(STATION.x0, STATION.x1, VIA.h - .6, VIA.h + .45, z1, z1 + 2.4, '#8d8f93', '#b0b2b5');
  e.flat(STATION.x0, STATION.x1, z1 + .05, z1 + .3, VIA.h + .46, '#ffd23a');
  for (let x = STATION.x0 + 1; x < STATION.x1; x += 3.4) b.box(x - .08, x + .08, VIA.h + .45, VIA.h + 3.4, z1 + 1.9, z1 + 2.06, '#3e4044');
  b.box(STATION.x0 - .4, STATION.x1 + .4, VIA.h + 3.4, VIA.h + 3.6, z1 - .2, z1 + 2.6, '#c25a3a', '#8a3a28');
  b.box(STATION.x0 + 1, STATION.x1 - 2, 0, VIA.h - .7, z1 + .4, z1 + 6, '#9c8f7e', '#6e6a64');
  for (let x = STATION.x0 + 2; x < STATION.x1 - 3; x += 2.2) e.box(x, x + 1.2, 1.2, 3.4, z1 + 6, z1 + 6.05, '#ffcf80');
  for (let k = 0; k < 12; k++) b.box(STATION.x1 - 2 + k * .0, STATION.x1 - .4, k * .58, k * .58 + .58, z1 + 6 - k * .45, z1 + 6.5 - k * .45, '#8d8f93');
  // the cliff with the tunnel mouth (a dark arch on its west face at deck level)
  b.box(CLIFF.x0, CLIFF.x1, 0, CLIFF.h, CLIFF.z0, CLIFF.z1, '#4c4a4d', '#3a4a3a');
  for (let k = 0; k < 40; k++) { const x = CLIFF.x0 + .5 + R() * (CLIFF.x1 - CLIFF.x0 - 1), z = CLIFF.z0 + .5 + R() * (CLIFF.z1 - CLIFF.z0 - 1); b.box(x - .9, x + .9, CLIFF.h, CLIFF.h + .5 + R() * 1.4, z - .9, z + .9, R() < .5 ? '#2f4a33' : '#3d4a3a'); }
  b.box(CLIFF.x0 - .6, CLIFF.x0, VIA.h - .7, VIA.h + 5.4, z0 - 1.6, z1 + 1.6, '#9a9096');
  for (const k of [0, 1, 2, 3, 4]) e.box(CLIFF.x0 - .66, CLIFF.x0 - .6, VIA.h + .6 + (k < 2 ? k * 1.8 : 4.6), VIA.h + .9 + (k < 2 ? k * 1.8 : 4.6), k < 2 ? z0 - 1.3 : z0 - 1 + (k - 2) * 2.4, k < 2 ? z0 - 1.0 : z0 - .7 + (k - 2) * 2.4, '#ffc870');
  for (const k of [0, 1]) e.box(CLIFF.x0 - .66, CLIFF.x0 - .6, VIA.h + .6 + k * 1.8, VIA.h + .9 + k * 1.8, z1 + 1.0, z1 + 1.3, '#ffc870');
  e.box(CLIFF.x0 - .52, CLIFF.x0 - .5, VIA.h, VIA.h + 4.2, z0 - .2, z1 + .2, '#000000');
  // far city beyond the viaduct (silhouettes with a few lit windows)
  for (let i = 0; i < 16; i++) { const x = -44 + i * 5.6 + R() * 1.5, z = -40 - R() * 14, h = 8 + R() * 16; if (x > CLIFF.x0 - 2 && x < CLIFF.x1 + 2) continue; b.box(x, x + 4.4, 0, h, z, z + 9, '#2a3142', '#262c3a');
    for (let k = 0; k < 6; k++) if (R() < .5) { const wy = 2 + R() * (h - 3), wx = x + .5 + R() * 3.2; e.box(wx, wx + .7, wy, wy + .8, z + 9, z + 9.05, R() < .7 ? '#ffd28a' : '#a8d8ff'); } }
  // —— middle: the west buildings, the three apartment blocks, roof clutter, the fire escape ——
  for (const [x0, x1, za, zb, h, c] of [[-18, -5.4, -14.4, -8.2, 10, '#6f6a62'], [-18, -5.4, -7.4, -1.2, 13, '#737a80'], [-18, -5.4, 7.2, 10.4, 4.2, '#8a7a68'], [4.6, 7.6, 7.2, 10.4, 4.2, '#6f7a70'], [9.6, 18, 7.2, 10.4, 4.6, '#7a6a72'], [14.2, 22, -11, -1, 9, '#68707a']])
    b.box(x0, x1, 0, h, za, zb, c, '#5d5f63');
  for (const [i, blk] of BLOCKS.entries()) {
    const { x0, x1, z0: a, z1: c, h } = blk;
    b.box(x0, x1, 0, h, a, c, ['#7d7468', '#76705f', '#7a7a70'][i], '#8b8d90');
    for (const [p, q, r, s] of [[x0, x1, c - .2, c], [x0, x1, a, a + .2], [x0, x0 + .2, a, c], [x1 - .2, x1, a, c]]) b.box(p, q, h, h + .45, r, s, '#8a877c');
  }
  const fac = (blk, side, seed) => { const { x0, x1, z0: a, z1: c, h } = blk; const w = side === 'S' ? x1 - x0 : c - a;
    const mat = facade(w, h, 4, side === 'S' ? 4 : 3, [[R() * 3 | 0, 0], [R() * 3 | 0, 2], [2, 3, '#ffe0a0']], seed, '#867e70');
    const g = new THREE.PlaneGeometry(w, h); if (side === 'S') g.translate((x0 + x1) / 2, h / 2, c + .02); else { g.rotateY(-Math.PI / 2); g.translate(x0 - .02, h / 2, (a + c) / 2); }
    const me = new THREE.Mesh(g, mat); me.receiveShadow = true; scene.add(me); };
  BLOCKS.forEach((blk, i) => { fac(blk, 'S', 11 + i); fac(blk, 'W', 21 + i); });
  // roof clutter: AC units (block 1, 3), laundry rack (block 2); tanks are added in actors (shiny)
  for (const [x, z] of [[11.6, -2.0], [11.8, -4.6], [6.2, -4.8], [12.0, -15.4], [11.2, -12.9]]) { b.box(x - .55, x + .55, 12, 12.8, z - .35, z + .35, '#c9cccf'); b.cyl(x, z + .36, .25, 12.1, 12.7, '#333', 8, false); }
  for (const x of [6.0, 8.6]) { b.box(x - .05, x + .05, 12, 13.5, -10.9, -10.8, '#555'); b.box(x - .05, x + .05, 12, 13.5, -7.6, -7.5, '#555'); }
  // the fire escape on block 1's south face: landings at 3, 6, 9 m and the roof; stair planks between them
  const fz0 = BLOCKS[0].z1, fz1 = fz0 + 1.2;
  for (let k = 1; k <= 3; k++) { m.box(FIRE.x0 - .5, FIRE.x1 + .5, k * 3 - .08, k * 3, fz0, fz1, '#2e3136'); m.box(FIRE.x0 - .5, FIRE.x1 + .5, k * 3, k * 3 + 1, fz1 - .05, fz1, '#2e3136'); }
  for (let k = 0; k < 4; k++) { const dir = k % 2 ? -1 : 1; for (let j = 0; j < 12; j++) { const u = j / 12, x = dir > 0 ? FIRE.x0 + u * (FIRE.x1 - FIRE.x0) : FIRE.x1 - u * (FIRE.x1 - FIRE.x0); m.box(x - .2, x + .2, k * 3 + u * 3 - .05, k * 3 + u * 3, fz0 + .15, fz0 + .75, '#3a3d42'); } }
  // —— bottom: the bank (classical, dome), the café, shops, trees ——
  const B = BANK; b.box(B.x0, B.x1, 0, B.h, B.z0, B.z1, '#d9d2c2', '#c2bba9');
  b.box(B.x0 - .4, B.x1 + .4, B.h, B.h + .6, B.z0 - .4, B.z1 + .4, '#e4ddcc', '#bdb6a6');
  for (let k = 0; k < 3; k++) b.box(B.x0 + 1 - k * .2, B.x1 - 1 + k * .2, .15 + k * .18, .33 + k * .18, B.z0 - 1.6 + k * .5, B.z0, '#cfc8b8');
  for (let x = B.x0 + .8; x <= B.x1 - .8; x += 1.4) if (Math.abs(x) > 1.2) b.cyl(x, B.z0 - .55, .28, .7, B.h, '#efe9dc', 12);
  b.box(B.x0 + .4, B.x1 - .4, B.h - .9, B.h, B.z0 - .95, B.z0 - .1, '#e4ddcc');
  { const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#7fb8a8', { roughness: .5, metalness: .3 })); dome.position.set(0, B.h + .6 + 1.2, (B.z0 + B.z1) / 2 + .6); dome.castShadow = true; scene.add(dome);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.2, 28), std('#e4ddcc')); drum.position.set(0, B.h + .6 + .6, (B.z0 + B.z1) / 2 + .6); scene.add(drum); }
  e.box(-1.1, 1.1, .3, 2.8, B.z0 - .02, B.z0 + .02, '#2a1a0a');   // the dark doorway behind the iron door
  const C = CAFE; b.box(C.x0, C.x1, 0, 4.2, C.z0, C.z1, '#b89a7a', '#7d6a5a');
  for (let x = C.x0 + .6; x < C.x1 - .6; x += 2.1) e.box(x, x + 1.5, .6, 2.6, C.z0 - .02, C.z0, '#ffd59a');
  for (const [x0, x1, c] of [[-22, -6.2, '#8e8578'], [14, 26, '#857e8a'], [-30, -22.4, '#7a7468']]) b.box(x0, x1, 0, 4.8, 17, 25, c, '#6a6c70');
  for (const [x0, x1] of [[-18, -5.4], [4.6, 7.6], [9.6, 18]]) for (let x = x0 + .4; x < x1 - 1.2; x += 2.2) e.box(x, x + 1.6, .5, 2.4, STRIP.z1 + .02, STRIP.z1 + .05, R() < .5 ? '#ffd49a' : '#cfe8ff');
  for (let x = -16; x < -6.2; x += 2.3) e.box(x, x + 1.5, .6, 2.6, 17 - .02, 17, '#ffcf8a');
  scene.add(Object.assign(new THREE.Mesh(b.build(), MAT.v), { castShadow: true, receiveShadow: true }));
  scene.add(Object.assign(new THREE.Mesh(m.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, metalness: .8 })), { castShadow: true, receiveShadow: true }));
  scene.add(new THREE.Mesh(e.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  // the café awning (red/white stripes) over 3 round tables
  const stripes = canvasTex(256, 64, g => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4f0e8' : '#d8262a'; g.fillRect(i * 32, 0, 32, 64); } });
  { const g = new THREE.PlaneGeometry(C.x1 - C.x0, 2.2); g.rotateX(-Math.PI / 2 + .35); const aw = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: stripes, roughness: .8, side: THREE.DoubleSide })); aw.position.set((C.x0 + C.x1) / 2, 2.9, C.z0 - 1.0); aw.castShadow = true; scene.add(aw); }
  // toy trees: trunks + round clipped crowns
  const leaf = std('#2f5a3a', { roughness: .9 }), trunk = std('#4a3626');
  for (const [x, z] of [[-14, 11.2], [-10.4, 11.2], [12, 11.2], [15.6, 11.2], [-12, 15.6], [-6.4, 15.6], [15, 15.6], [-14, 6.6], [16, 6.6], [-14, -.6], [14, -12]]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.4, 6), trunk); t.position.set(x, .85, z); scene.add(t);
    const c = new THREE.Mesh(new THREE.SphereGeometry(.95, 16, 10), leaf); c.position.set(x, 2.2, z); c.castShadow = true; scene.add(c); }
}
