// place.js — the demo's set: a country road at golden hour with a painted-metal mailbox on a wooden post, a gravel shoulder, a fence, a barn, poles and trees.
// Road runs along −z from the camera; x > 0 is the mailbox side.
import * as THREE from 'three';
import { paintedMetal, wood, gravel, raggedEdge, dirtRoad, grass, foliage, mat, rbox, cyl, box, paint, fbm, h2 } from './set.js';

export function buildPlace(scene) {
  const P = {};
  // —— surfaces (painted once, shared) ——
  const S = {
    teal: paintedMetal('#1f6f78', { seed: 3, grime: .5, chips: .06 }),
    red: paintedMetal('#c8321f', { seed: 5, grime: .2, chips: .03 }),
    darkMetal: paintedMetal('#2c2a2a', { seed: 7, grime: .2, dust: '#6b5a48' }),
    post: wood({ seed: 2, planks: 1, cols: ['#4f463c', '#6c6155', '#8a7d6c', '#9c8f7c'] }),
    board: wood({ seed: 9, planks: 2, cols: ['#5b4632', '#7a5d40', '#957452', '#a98760'] }),
    fence: wood({ seed: 4, planks: 1, paint: '#efe9dc', cols: ['#6c5a44', '#85705a', '#9c8770', '#ab9880'] }),
    barn: wood({ seed: 12, planks: 8, paint: '#a52c22', wear: .02, w: 512, h: 512, cols: ['#5a3b24', '#6a4a30', '#7d5a3c', '#8a6646'] }),
    roof: paintedMetal('#6d7378', { seed: 15, grime: .2 }),
    gravel: gravel({ seed: 3 }),
    road: dirtRoad({ seed: 4 }),
    grass: grass({ seed: 6 }),
    leaves: foliage({ seed: 8 }),
    leaves2: foliage({ seed: 11, a: '#3d5e2a', b: '#8c9a48' }),
  };
  P.S = S;
  const M = {
    teal: mat(S.teal, [2, 2], { bump: .6, extra: { metalness: .25 } }),
    tealDoor: mat(S.teal, [2, 2], { bump: .6, extra: { metalness: .25, color: new THREE.Color('#c8d4d4') } }),
    red: mat(S.red, [3, 3], { bump: .5, extra: { metalness: .2 } }),
    dark: mat(S.darkMetal, [2, 2], { bump: .4, extra: { metalness: .5 } }),
    post: mat(S.post, [1, 2], { bump: 1.2 }),
    board: mat(S.board, [1, 1], { bump: 1 }),
    fence: mat(S.fence, [1, 1], { bump: 1 }),
    barn: mat(S.barn, [3, 1], { bump: 1 }),
    roof: mat(S.roof, [4, 4], { bump: .5, extra: { metalness: .35 } }),
    gravel: mat(S.gravel, [1.8, 230], { bump: 2.2 }),
    road: mat(S.road, [1, 30], { bump: 1.6 }),
    grass: mat(S.grass, [90, 90], { bump: 1.2 }),
    leaves: mat(S.leaves, [2, 2], { bump: 1.5 }),
    leaves2: mat(S.leaves2, [2, 2], { bump: 1.5 }),
  };
  P.M = M;
  // —— ground ——
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), M.grass); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.01, -60); ground.receiveShadow = true; scene.add(ground);
  const ROAD_X = -2.6, ROAD_W = 5.2;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 160), M.road); road.rotation.x = -Math.PI / 2; road.position.set(ROAD_X, 0, -70); road.receiveShadow = true; scene.add(road);
  const edge = new THREE.CanvasTexture(raggedEdge().C); edge.wrapS = edge.wrapT = THREE.RepeatWrapping; edge.repeat.set(1, 40); M.gravel.alphaMap = edge; M.gravel.alphaTest = .5;
  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 160), M.gravel); shoulder.rotation.x = -Math.PI / 2; shoulder.position.set(ROAD_X + ROAD_W / 2 + .3, .004, -70); shoulder.receiveShadow = true; scene.add(shoulder);
  P.ROAD_X = ROAD_X; P.ROAD_W = ROAD_W;

  // —— the mailbox (built along +z, door at +z; flag on the +x side) ——
  const mb = new THREE.Group();
  const w = .26, wall = .17, L = .62;
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, wall); sh.absarc(0, wall, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
  // the body is an open shell (caps hidden) so the open door shows the inside; a separate back plate closes the rear
  const shell = M.teal.clone(); shell.side = THREE.DoubleSide;
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false, curveSegments: 24 }), [new THREE.MeshBasicMaterial({ visible: false }), shell]);
  body.position.z = -L / 2; body.castShadow = body.receiveShadow = true; mb.add(body);
  const backPl = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), shell); backPl.position.z = -L / 2; backPl.receiveShadow = backPl.castShadow = true; mb.add(backPl);
  // ribs
  for (const z of [-.18, .06]) { const rib = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: true, bevelThickness: .004, bevelSize: .006, bevelSegments: 1, curveSegments: 24 }), M.teal); rib.scale.set(1.04, 1.04, 1); rib.position.set(0, -.003, z); rib.castShadow = true; mb.add(rib); }
  // door
  const door = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .018, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 2, curveSegments: 24 }), M.tealDoor);
  door.scale.set(1.05, 1.04, 1); door.position.set(0, -.004, 0); door.castShadow = door.receiveShadow = true;
  const hinge = new THREE.Group(); hinge.position.set(0, 0, L / 2 + .002); hinge.add(door); mb.add(hinge); P.door = hinge;   // rotation.x > 0 drops it open
  const latch = rbox(.05, .03, .03, .008, M.dark); latch.position.set(0, wall + .08, .028); hinge.add(latch);
  // the letter waiting inside, propped up toward the door
  const env = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#cfc4ad'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 86); g.lineTo(256, 0); g.stroke(); g.fillStyle = '#c8321f'; g.fillRect(196, 14, 42, 48); g.fillStyle = '#3a3a48'; for (let i = 0; i < 3; i++) g.fillRect(70, 104 + i * 14, 110 - i * 20, 5); return c; })());
  env.colorSpace = THREE.SRGBColorSpace;
  const letter = new THREE.Mesh(new THREE.BoxGeometry(.2, .13, .004), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial(i === 4 ? { map: env, roughness: .8 } : { color: '#efe8d8', roughness: .8 })));
  letter.position.set(0, .1, .16); letter.rotation.x = -.35; letter.castShadow = letter.receiveShadow = true; mb.add(letter); P.letter = letter;
  // rivets
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.SphereGeometry(.007, 8, 6), M.dark); const a = Math.PI * (i + .5) / 6; r.position.set(Math.cos(a) * w / 2 * 1.02, wall + Math.sin(a) * w / 2 * 1.02, .072); mb.add(r); }
  // flag: an arm on a pivot
  const flag = new THREE.Group(); flag.position.set(w / 2 + .022, .07, -.12);
  const pivot = cyl(.018, .018, .02, M.dark, 16); pivot.rotation.z = Math.PI / 2; flag.add(pivot);
  const arm = rbox(.014, .36, .034, .005, M.red); arm.position.set(.007, .16, 0); flag.add(arm);
  const pl = rbox(.014, .13, .19, .008, M.red); pl.position.set(.007, .29, .085); flag.add(pl);
  mb.add(flag); P.flag = flag;
  mb.position.set(0, 1.08, 0);
  const mount = new THREE.Group(); mount.add(mb);
  const brd = rbox(.18, .04, .74, .01, M.board); brd.position.set(0, 1.06, 0); mount.add(brd);
  const post = rbox(.11, 1.06, .11, .012, M.post); post.position.set(0, .53, -.05); mount.add(post);
    mount.position.set(.42, 0, -3.15); mount.rotation.y = -.62;
  scene.add(mount); P.mailbox = mount; P.mb = mb;

  // —— fence along the right side ——
  for (let z = -6; z > -70; z -= 2.6) {
    const fp = rbox(.1, 1.15, .1, .012, M.fence); fp.position.set(2.1, .575, z); scene.add(fp);
  }
  for (const y of [.45, .92]) { const rail = rbox(.04, .12, 64, .012, M.fence); rail.position.set(2.06, y, -38); scene.add(rail); }
  // —— utility poles on the left ——
  for (let z = -14; z > -160; z -= 34) {
    const pole = cyl(.13, .16, 9, M.post, 10); pole.position.set(-6.2, 4.5, z); scene.add(pole);
    const cross = rbox(1.8, .12, .12, .02, M.post); cross.position.set(-6.2, 8.2, z); scene.add(cross);
  }
  // —— barn far right ——
  {
    const g = new THREE.Group();
    const walls = rbox(9, 5.2, 11, .05, M.barn); walls.position.y = 2.6; g.add(walls);
    const roofShape = new THREE.Shape(); roofShape.moveTo(-5, 0); roofShape.lineTo(5, 0); roofShape.lineTo(0, 3.4); roofShape.lineTo(-5, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 11.6, bevelEnabled: false }), M.roof); roof.position.set(0, 5.2, -5.8); roof.castShadow = roof.receiveShadow = true; g.add(roof);
    const gable = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-4.5, 0); s.lineTo(4.5, 0); s.lineTo(0, 3.1); s.lineTo(-4.5, 0); return s; })()), M.barn); gable.position.set(0, 5.2, 5.51); g.add(gable);
    const bdoor = rbox(3.4, 3.6, .12, .03, M.fence); bdoor.position.set(0, 1.8, 5.52); g.add(bdoor);
    const bdoorIn = rbox(3.0, 3.3, .14, .02, M.barn); bdoorIn.position.set(0, 1.75, 5.54); g.add(bdoorIn);
    g.position.set(11, 0, -40); g.rotation.y = -.35; scene.add(g); P.barn = g;
  }
  // —— trees: clumps of leaf-textured blobs on trunks ——
  const tree = (x, z, s, m) => {
    const g = new THREE.Group(); const tr = cyl(.18 * s, .26 * s, 3 * s, M.post, 8); tr.position.y = 1.5 * s; g.add(tr);
    for (let i = 0; i < 6; i++) { const r = (1.3 + h2(i, x * 7 | 0, 3) * .9) * s; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), m); b.position.set((h2(i, 1, z | 0) - .5) * 2.6 * s, (3.4 + h2(i, 2, 5) * 2.2) * s, (h2(i, 3, 7) - .5) * 2.4 * s); b.castShadow = b.receiveShadow = true; g.add(b); }
    g.position.set(x, 0, z); scene.add(g); return g;
  };
  tree(-11, -26, 1.3, M.leaves); tree(-14, -48, 1.6, M.leaves2); tree(-9, -70, 1.4, M.leaves); tree(15, -58, 1.7, M.leaves2); tree(4, -84, 1.5, M.leaves); tree(-20, -30, 1.8, M.leaves2);
  // distant tree line
  for (let i = 0; i < 26; i++) tree(-60 + i * 5 + h2(i, 9, 1) * 3, -118 - h2(i, 4, 2) * 14, 1.6 + h2(i, 5, 3) * .9, i % 2 ? M.leaves : M.leaves2);
  return P;
}
