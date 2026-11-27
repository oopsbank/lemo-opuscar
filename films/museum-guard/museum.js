// The set: a small museum with its ceiling off, four rooms in a 2×2 floor plan (x east, z south):
// Lobby x[-12,0] z[-10,0] (guard desk) · Hall of Giants x[-12,0] z[-18,-10] (the dinosaur) ·
// Portrait Gallery x[0,12] z[-18,-10] · Egypt Room x[0,12] z[-10,0] (the sarcophagus).
// An invisible ceiling (shadow only) lets the moon in through skylights; dawn comes in the same way.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PX, ramp, hex, h2, fbm, texOf, woodPlanks, rock, plaster, ground, glow, mulberry } from './px.js';
import { mats, mat, mesh, box, fire } from './kit.js';
import { sky, particles, beamCard, flick } from './fx.js';
import { makeChar, makePortrait, SPX } from './chars.js';
import { T, P, VO, guard, facing, torch, walkStep } from './story.js';
import { clamp, seg, ss, lerp, track } from '/core/lib.js';

// —— floor and wall textures (pixel, world-UV) ——
function marble(w, h) {
  const p = new PX(w, h), A = ramp(['#4a4c56', '#6c6e78', '#8e909a', '#b4b6be', '#d6d8de'], .4), Bk = ramp(['#121218', '#1e1e26', '#2c2c36', '#3c3c48'], .4);
  p.fill((x, y) => { const c = ((x / 24 | 0) + (y / 24 | 0)) % 2, n = fbm(x * .08, y * .08, c ? 3 : 7), vein = Math.abs(Math.sin((x + y * .6) * .09 + n * 6)) < .06; const v = .45 + (n - .5) * .5 + (vein ? .25 : 0) + ((x % 24 === 0 || y % 24 === 0) ? -.3 : 0); return (c ? A : Bk)(v, x, y); });
  return p.done();
}
function carpet(w, h) {
  const p = new PX(w, h), R = ramp(['#1a0c14', '#2c1220', '#401a2c', '#56243a'], .4), G = ramp(['#4a3210', '#8a621c', '#c89a38'], .3);
  p.fill((x, y) => { const m = (x + y) % 16, d = (x - y + 64) % 16; if ((m === 0 || d === 0) && (x % 2 === 0)) return G(.4, x, y); return R(.45 + (h2(x, y, 4) - .5) * .3, x, y); });
  return p.done();
}
const sandCols = ['#3a2a18', '#5c4426', '#806038', '#a6804c', '#c8a266'];

export function buildMuseum() {
  const scene = new THREE.Scene(), MM = mats();
  const FOG = new THREE.Color('#121a30'); scene.fog = new THREE.FogExp2(FOG.clone(), .016);
  const SK = sky({ top: '#04060e', mid: '#0b1226', hor: '#18223c', moonDir: new THREE.Vector3(-.3, .5, -1), moonCol: '#dfe8ff', moonI: .8 }); scene.add(SK.mesh);

  // —— lights ——
  const key = new THREE.DirectionalLight('#8aa2e6', 1.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 120 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(0, 0, -9); scene.add(key, key.target);
  const MOON = new THREE.Vector3(-.28, 1, .3).normalize(), SUN = new THREE.Vector3(.55, .75, .35).normalize();
  const hemi = new THREE.HemisphereLight('#43548e', '#0d0d18', 1.25); scene.add(hemi);
  const fill = new THREE.PointLight('#9fb2e8', 1.2, 7, 2); scene.add(fill);

  // —— exterior: lawn, gravel path, hedges, garden lamps ——
  const lawn = mat(ground(96, 96, { seed: 4, grass: ['#0b140f', '#122018', '#1a2c20', '#24392a', '#2f4834'], dirt: ['#15120f', '#221c16', '#2e261d', '#3c3226'], mask: () => .9 }));
  scene.add(mesh(new THREE.BoxGeometry(160, .2, 160).translate(0, -.12, -9), lawn, { cast: false }));
  const gravel = mat(rock(96, 96, { seed: 8, cols: ['#2a2622', '#3a352f', '#4c463e', '#5e574c', '#706858'] }));
  scene.add(mesh(new THREE.BoxGeometry(3.2, .1, 20).translate(-7.5, -.03, 10.4), gravel, { cast: false }));
  const hedgeM = mat(rock(48, 48, { seed: 12, cols: ['#0a120c', '#122018', '#1a2c1f', '#223826'] }));
  for (const [x, z, w, d] of [[-14.2, -9, 1.2, 21], [14.2, -9, 1.2, 21], [0, -20.2, 29.6, 1.2], [-12.2, 1.8, 5.4, 1.1], [4.55, 1.8, 20.5, 1.1]]) scene.add(mesh(new THREE.BoxGeometry(w, 1.1, d).translate(x, .55, z), hedgeM));
  const glamps = [];
  for (const z of [4.5, 9, 13.5]) for (const s of [-1, 1]) { const x = -7.5 + s * 2.1; const post = box(.1, 1.1, .1, MM.plankDark); post.position.set(x, 0, z); scene.add(post); const g = glow('#ffcf8a', .7, 1.2); g.position.set(x, 1.2, z); scene.add(g); glamps.push(g); }
  const pathL = new THREE.PointLight('#ffc888', 3, 9, 1.8); pathL.position.set(-7.5, 1.6, 6); scene.add(pathL);

  // —— floors ——
  const fMarble = mat(marble(96, 96), { rough: .28 }); fMarble.metalness = .1;
  const fParquet = mat(woodPlanks(96, 96, { pw: 4, len: 32, seed: 21, nails: false, cols: ['#2a160c', '#462614', '#663a1e', '#87532c', '#a46e3c'] }), { rough: .5 });
  const fSand = mat(rock(96, 96, { seed: 5, cols: sandCols }));
  const fCarpet = mat(carpet(96, 96));
  for (const [x0, x1, z0, z1, m] of [[-12, 0, -10, 0, fCarpet], [-12, 0, -18, -10, fMarble], [0, 12, -18, -10, fParquet], [0, 12, -10, 0, fSand]]) scene.add(mesh(new THREE.BoxGeometry(x1 - x0, .2, z1 - z0).translate((x0 + x1) / 2, -.1, (z0 + z1) / 2), m, { cast: false }));

  // —— walls (tall at the back, low at the front: a cutaway model) ——
  const wStone = mat(plaster(96, 96, { seed: 31, wall: ['#5a5c66', '#74767f', '#8e9098', '#a8aab0'], beams: [{ t: 'h', y: 0 }] }));
  const wWine = mat(plaster(96, 96, { seed: 32, wall: ['#2e0e16', '#45161f', '#5c2029', '#742a34'], beams: [{ t: 'h', y: 0 }] }));
  const wSand = mat(rock(96, 96, { seed: 33, cols: sandCols }));
  const wPanel = MM.plankDark;
  const capM = new THREE.MeshStandardMaterial({ color: '#c8c2b4', roughness: .6 });
  function wall(x0, z0, x1, z1, h, m, gaps = []) {   // axis-aligned wall from (x0,z0) to (x1,z1), with door gaps [a,b] along its length
    const L = Math.hypot(x1 - x0, z1 - z0), alongX = z0 === z1; let a = 0; const segs = [];
    for (const [g0, g1] of [...gaps, [L, L]]) { if (g0 > a) segs.push([a, g0]); a = g1; }
    for (const [s0, s1] of segs) {
      const len = s1 - s0, mid = (s0 + s1) / 2;
      const geo = alongX ? new THREE.BoxGeometry(len, h, .3) : new THREE.BoxGeometry(.3, h, len);
      const cx = alongX ? Math.min(x0, x1) + mid : x0, cz = alongX ? z0 : Math.min(z0, z1) + mid;
      scene.add(mesh(geo.translate(cx, h / 2, cz), m));
      const cap = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, .08, .38) : new THREE.BoxGeometry(.38, .08, len), capM); cap.position.set(cx, h + .04, cz); cap.castShadow = true; scene.add(cap);
    }
  }
  wall(-12.15, -18, 12.15, -18, 3.6, wStone);                // north (back) wall
  wall(-12, -18, -12, 0, 3.6, wPanel);                        // west wall
  wall(12, -18, 12, 0, 3.6, wSand);                           // east wall
  wall(0, -18, 0, -10, 3.4, wStone, [[4.6, 6.6]]);            // Hall | Gallery, door at z −13.4…−11.4
  wall(0, -10, 0, 0, 3.4, wSand);                             // Lobby | Egypt
  wall(-12, -10, 12, -10, .9, wStone, [[.6, 2.4], [21.6, 23.4]]);   // low wall between the rows (doors Lobby→Hall, Egypt→Gallery)
  wall(-12, 0, 12, 0, .9, wPanel, [[3.4, 5.6]]);              // low front wall, entrance at x −8.6…−6.4
  // the gallery's back wall: burgundy cloth over the stone
  const galW = new THREE.Mesh(new THREE.BoxGeometry(11.6, 3.3, .04).translate(6, 1.65, -17.83), wWine); galW.receiveShadow = true; scene.add(galW);
  // the invisible ceiling: casts shadows, never seen. Skylights over each room.
  const HOLES = [[-9.2, -7.0, -16.4, -12.6], [-5.4, -3.2, -16.4, -12.6], [2.6, 9.4, -15.6, -13.0], [5.0, 9.2, -7.6, -4.2], [-8.2, -5.0, -7.2, -4.4]];
  const cg = [];
  for (let x = -12.5; x < 12.5; x += .5) for (let z = -18.5; z < .5; z += .5) { const cx = x + .25, cz = z + .25; if (HOLES.some(([a, b, c, d]) => cx > a && cx < b && cz > c && cz < d)) continue; cg.push(new THREE.BoxGeometry(.5, .2, .5).translate(cx, 4.3, cz)); }
  const ceil = new THREE.Mesh(mergeGeometries(cg), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); ceil.castShadow = true; ceil.receiveShadow = false; scene.add(ceil);
  // skylight shafts
  const shafts = HOLES.map(([a, b, c, d]) => { const s = beamCard(6.5, Math.min(b - a, d - c) * .9, Math.min(b - a, d - c) * 1.3, '#9fb8ff', { k: .16, fall: .9 }); s.userData.o = new THREE.Vector3((a + b) / 2, 4.3, (c + d) / 2); scene.add(s); return s; });

  // —— Lobby: the guard desk ——
  const desk = box(2.2, .9, .8, MM.plankDark); desk.position.set(P.desk[0], 0, P.desk[1]); scene.add(desk);
  const mon = box(.6, .42, .1, new THREE.MeshStandardMaterial({ color: '#141820' })); mon.position.set(P.desk[0] - .5, .9, P.desk[1] - .2); scene.add(mon);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.52, .34), new THREE.MeshStandardMaterial({ color: '#0a1020', emissive: '#9cc4ff', emissiveIntensity: 1.6 })); scr.position.set(P.desk[0] - .5, 1.11, P.desk[1] - .14); scene.add(scr);
  const monL = new THREE.PointLight('#9cc4ff', 2, 4, 2); monL.position.set(P.desk[0] - .5, 1.3, P.desk[1] + .4); scene.add(monL);
  const lampB = new THREE.Mesh(new THREE.ConeGeometry(.2, .2, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#6a4a1a', emissive: '#ffb050', emissiveIntensity: 1.2, side: THREE.DoubleSide })); lampB.position.set(P.desk[0] + .6, 1.3, P.desk[1]); scene.add(lampB);
  const lampL = new THREE.PointLight('#ffb050', 4, 6, 1.8); lampL.position.set(P.desk[0] + .6, 1.2, P.desk[1] + .35); scene.add(lampL);
  const lampG = glow('#ffc070', .8, 1.0); lampG.position.set(P.desk[0] + .6, 1.25, P.desk[1] + .1); scene.add(lampG);
  const chair = box(.5, .5, .5, MM.plankDark); chair.position.set(P.desk[0], 0, P.desk[1] + .8); scene.add(chair);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .12, 8), new THREE.MeshStandardMaterial({ color: '#d8d0c0' })); mug.position.set(P.desk[0] + .1, .96, P.desk[1] + .15); scene.add(mug);

  // —— Hall of Giants: plinth, ropes, bench, the dinosaur ——
  const plinth = box(5.8, .35, 2.4, new THREE.MeshStandardMaterial({ color: '#2a2a32', roughness: .5 })); plinth.position.set(P.dino[0], 0, P.dino[1]); scene.add(plinth);
  const brass = new THREE.MeshStandardMaterial({ color: '#c8a050', roughness: .3, metalness: .8 }), rope = new THREE.MeshStandardMaterial({ color: '#8a1a24', roughness: .8 });
  for (let i = 0; i < 5; i++) { const x = -9.6 + i * 1.75; const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .07, .9, 8).translate(0, .45, 0), brass); p.position.set(x, 0, -13.5); p.castShadow = true; scene.add(p);
    if (i < 4) for (let k = 0; k < 6; k++) { const u0 = k / 6, u1 = (k + 1) / 6, y = u => .82 - Math.sin(u * Math.PI) * .18; const sgm = new THREE.Mesh(new THREE.BoxGeometry(1.75 / 6 + .02, .04, .04), rope); sgm.position.set(x + (u0 + u1) / 2 * 1.75, (y(u0) + y(u1)) / 2, -13.5); sgm.rotation.z = Math.atan2(y(u1) - y(u0), 1.75 / 6); scene.add(sgm); } }
  const exitM = new THREE.MeshStandardMaterial({ color: '#300808', emissive: '#ff3030', emissiveIntensity: 2.2 });
  const exits = [[-.2, 2.9, -12.4, Math.PI / 2], [-11.83, 2.9, -14, Math.PI / 2]].map(([x, y, z, r]) => { const e = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .06), exitM); e.position.set(x, y, z); e.rotation.y = r; scene.add(e); const L = new THREE.PointLight('#ff3030', .8, 3, 2); L.position.set(x + (x > -1 ? -.4 : .4), y - .2, z); scene.add(L); const g = glow('#ff4040', .5, 1); g.position.set(x, y, z); scene.add(g); return L; });
  const dino = makeChar('dino', 1.2, .95); dino.root.position.set(P.dino[0], .35, P.dino[1]); scene.add(dino.root);

  // —— Portrait Gallery ——
  const PORTS = ['captain', 'duchess', 'cat'].map((k, i) => { const p = makePortrait(k, 1.6); p.root.position.set(P.portraits[i], 2.05, -17.78); scene.add(p.root); return p; });
  const picL = P.portraits.map(x => { const bar = new THREE.Mesh(new THREE.BoxGeometry(.7, .06, .12), brass); bar.position.set(x, 3.25, -17.65); scene.add(bar); const L = new THREE.SpotLight('#ffd8a0', 2.5, 4, .7, .6, 1.5); L.position.set(x, 3.2, -17.2); L.target.position.set(x, 1.9, -17.8); scene.add(L, L.target); const g = glow('#ffd8a0', .22, 1); g.position.set(x, 3.3, -17.6); scene.add(g); return L; });
  const vbench = box(2.2, .45, .6, new THREE.MeshStandardMaterial({ color: '#4a1420', roughness: .9 })); vbench.position.set(6, 0, -15.2); scene.add(vbench);

  // —— Egypt Room: columns, braziers, the sarcophagus ——
  const colM = mat(rock(48, 48, { seed: 41, cols: sandCols }));
  for (const [x, z] of [[1.4, -8.6], [10.6, -8.6], [1.4, -1.4], [10.6, -1.4]]) { const c = mesh(new THREE.CylinderGeometry(.32, .38, 3.0, 10).translate(0, 1.5, 0), colM); c.position.set(x, 0, z); scene.add(c); const band = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .14, 10), new THREE.MeshStandardMaterial({ color: '#1e4e9a', roughness: .6 })); band.position.set(x, 2.7, z); scene.add(band); }
  const braz = [[3.4, -8.8], [10.8, -5.0]].map(([x, z]) => { const st = box(.3, 1.5, .3, colM); st.position.set(x, 0, z); scene.add(st); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.32, .18, .22, 10), brass); bowl.position.set(x, 1.6, z); scene.add(bowl);
    const f = fire(.6, { seed: x }); f.position.set(0, 1.68, 0); const g = new THREE.Group(); g.position.set(x, 0, z); g.add(f); scene.add(g); const L = new THREE.PointLight('#ff9a40', 5, 8, 1.8); L.position.set(x, 2.0, z + .4); scene.add(L); const gl = glow('#ffa040', 1.1, 1); gl.position.set(x, 1.95, z); scene.add(gl); return { f, L, gl }; });
  const sarcTex = new PX(48, 16); { const G = ramp(['#4a3210', '#8a621c', '#c89a38', '#f0d27a'], .3), Bl = ramp(['#0c1c40', '#163066', '#22489a', '#3a66c4'], .3);
    sarcTex.fill((x, y) => { const band = (x >> 2) % 3; if (y < 2 || y > 13) return G(.7, x, y); if (band === 0) return G(.55 + (h2(x, y, 1) - .5) * .3, x, y); if (band === 1) return Bl(.5 + ((x + y) % 5 === 0 ? .3 : 0), x, y); return ((x * 3 + y * 5) % 7 < 2) ? G(.8, x, y) : Bl(.35, x, y); }); }
  const sarcM = new THREE.MeshStandardMaterial({ map: texOf(sarcTex.done()), roughness: .45, metalness: .3 });
  const sarc = new THREE.Mesh(new THREE.BoxGeometry(2.4, .78, .95).translate(0, .39, 0), sarcM); sarc.position.set(P.sarc[0], 0, P.sarc[1]); sarc.castShadow = sarc.receiveShadow = true; scene.add(sarc);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.45, .16, 1.0).translate(0, .08, 0), sarcM); lid.castShadow = true; scene.add(lid);
  const innerM = new THREE.Mesh(new THREE.BoxGeometry(2.2, .02, .78), new THREE.MeshBasicMaterial({ color: '#060403' })); innerM.position.set(P.sarc[0], .79, P.sarc[1]); scene.add(innerM);
  const mumSit = makeChar('mummySit', 1.6, 1.0); scene.add(mumSit.root);

  // —— the party: the mummy with a cake, the Duchess on an easel, three display spots ——
  const mum = makeChar('mummy', 1.8, 1.0); mum.root.position.set(-3.3, 0, -11.9); scene.add(mum.root);
  const easelDuch = makePortrait('duchess', 1.0); easelDuch.root.position.set(-6.8, 1.45, -11.95); scene.add(easelDuch.root);
  const easel = new THREE.Group(); easel.position.set(-6.8, 0, -12.05); scene.add(easel);
  for (const s of [-1, 1]) { const leg = box(.06, 2.0, .06, MM.beam); leg.position.set(s * .4, 0, 0); leg.rotation.z = -s * .08; easel.add(leg); }
  const shelf = box(1.1, .05, .12, MM.beam); shelf.position.set(0, .8, .05); easel.add(shelf);
  const SPOTS = [[-4.7, -14.0], [-3.3, -11.9], [-6.8, -11.95]].map(([x, z]) => { const L = new THREE.SpotLight('#ffe6c0', 0, 12, .36, .45, 1.2); L.position.set(x + .6, 7.5, z + 1.6); L.target.position.set(x, .8, z); scene.add(L, L.target); const b = beamCard(7.2, .25, 2.2, '#fff0d8', { k: 0, fall: .55 }); scene.add(b); return { L, b, x, z }; });
  SPOTS[0].L.castShadow = true; SPOTS[0].L.shadow.mapSize.set(1024, 1024); SPOTS[0].L.shadow.bias = -.002;
  const candleL = new THREE.PointLight('#ffb050', 0, 4, 2); scene.add(candleL);
  const candleG = glow('#ffc070', .5, 1.2); scene.add(candleG);
  // confetti for SURPRISE
  const CONF = particles(160, (i, t, o) => { const u = t - T.surprise; if (u < 0 || u > 6) { o.a = 0; return; } const a = h2(i, 1) * 6.28, sp = 1 + h2(i, 2) * 2.4; o.x = -4.6 + Math.cos(a) * sp * Math.min(u, .6) * 1.6; o.z = -12.4 + Math.sin(a) * sp * .4; o.y = 2.6 + 2.2 * Math.min(u, .5) - Math.max(0, u - .5) * .55 + Math.sin(u * 5 + i) * .05; o.a = (o.y > .02 ? 1 : 0) * (1 - seg(u, 4.5, 6)); o.s = .05; const c = [[1, .4, .7], [1, .85, .3], [.4, .8, 1], [1, 1, 1]][i % 4]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { blend: THREE.NormalBlending });
  scene.add(CONF);
  // dust motes in the moonlight
  const DUST = particles(240, (i, t, o) => { const hI = i % 5, [a, b, c, d] = HOLES[hI]; o.x = a + h2(i, 3) * (b - a) + Math.sin(t * .2 + i) * .2; o.z = c + h2(i, 4) * (d - c); o.y = ((h2(i, 5) * 4 - t * .05) % 4 + 4) % 4; o.a = .25 * dustK; o.s = .03; o.r = .8; o.g = .88; o.b = 1; }, { soft: 1 });
  scene.add(DUST); let dustK = 1;

  // —— the guard, the torch ——
  const you = makeChar('guard', 2.0); scene.add(you.root);
  const TL = new THREE.SpotLight('#fff0d4', 0, 16, .42, .55, 1.4); TL.castShadow = true; TL.shadow.mapSize.set(1024, 1024); TL.shadow.bias = -.002; TL.shadow.camera.near = .2; scene.add(TL, TL.target);
  const TB = beamCard(4.2, .12, 1.7, '#fff2d8', { k: .3, fall: 1.1 }); scene.add(TB);
  const TG = glow('#fff4dc', .42, 1.2); scene.add(TG);

  // —— helpers ——
  const pick = (t, f) => (Math.floor(t * f) % 2 ? 1 : 0);
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const dawnK = t => ss(seg(t, T.dawn, T.dawn + .8));
  const darkK = t => t < T.dark ? 0 : t < T.blow + .1 ? 1 - .75 * ss(seg(t, T.spot1, T.surprise)) : t < T.dawn ? 1 : 0;   // 1 = moon and fill gone
  const spotK = (t, n) => { const a = [T.spot1, T.spot2, T.spot3][n]; if (t < a || t >= T.blow + .08) return 0; const u = t - a; return u < .05 ? 1 : u < .1 ? .3 : 1; };

  const CAM = {
    plan: { p: track([[0, [0, 50, 3]], [4.5, [-3, 44, 1.5]], [7.5, [-7.0, 9.6, 2.6]]]), l: track([[0, [0, 0, -9.5]], [4.5, [-3.5, 0, -10.5]], [7.5, [-7.0, .9, -13.3]]]), fov: t => lerp(44, 40, ss(seg(t, 4.5, 7.5))), aper: 300 },
    gallery: { p: track([[16.5, [3.4, 8.8, -1.0]], [18.5, [5.4, 8.6, -1.4]], [23.6, [5.6, 8.4, -1.8]], [26.5, [6.0, 8.8, -1.0]], [28, [6.0, 8.8, -1.0]]]), l: track([[16.5, [3.6, .6, -14.0]], [18.5, [5.5, .6, -14.0]], [23.6, [5.6, .7, -14.2]], [26.5, [6.0, .6, -14.0]], [28, [6.0, .6, -14.0]]]), fov: t => lerp(lerp(44, 39, ss(seg(t, 18.5, 23))), 44, ss(seg(t, 24, 26.5))), aper: 300 },
    dark: { p: track([[37.5, [-4.6, 7.9, 1.4]], [45, [-4.7, 6.6, -1.6]]]), l: track([[37.5, [-4.8, 1.3, -13.0]], [45, [-4.8, 1.5, -13.2]]]), fov: () => 40, aper: 300 },
    close: { p: track([[45, [-4.1, 4.0, -5.4]], [48, [-4.0, 3.5, -6.2]], [51.5, [-4.0, 3.3, -6.6]]]), l: track([[45, [-4.1, 1.2, -12.3]], [51.5, [-4.0, 1.15, -12.4]]]), fov: () => 40, aper: 200 },
    dawn: { p: track([[51.5, [0, 50, 3]], [53, [-2, 46, 2]], [56, [-6.8, 8.2, 1.6]], [61, [-6.6, 7.0, -1.0]]]), l: track([[51.5, [0, 0, -9.5]], [53, [-2.5, 0, -10.5]], [56, [-6.6, 2.4, -13.8]], [61, [-6.5, 2.6, -14.2]]]), fov: t => lerp(44, 40, ss(seg(t, 53, 56))), aper: 320 },
  };

  function update(t, shot, cam, post, renderer) {
    const g = guard(t), f = facing(t), tv = torch(t), dk = dawnK(t), dkk = darkK(t);
    // —— camera ——
    if (shot.id === 'hall') {
      const cx = clamp(lerp(-7.4, g.x, .45), -8.2, -4.2);
      const cxs = t < T.run ? cx : lerp(cx, -4.0, ss(seg(t, T.run, T.gal)));
      const pu = ss(seg(t, 12.5, 15.0)); cam.position.set(cxs, 8.2 - pu * 1.2, .6 - pu * 2.6); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(cxs, .9 + pu * .3, -13.3); post.dof.aper = 300;
    } else if (shot.id === 'egypt') {
      const th = lerp(-.42, .28, ss(seg(t, 28, 37.5))), R = 13.2, cx = 6.3, cz = -5.4;
      cam.position.set(cx + Math.sin(th) * R, 7.6, cz + Math.cos(th) * R); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(cx - .3, .8, cz + 1.0); post.dof.aper = 300;
    } else { const C = CAM[shot.id]; cam.position.set(...C.p(t)); cam.fov = C.fov(t); cam.updateProjectionMatrix(); cam.lookAt(...C.l(t)); post.dof.aper = C.aper; }
    const far = shot.id === 'plan' || (shot.id === 'dawn' && t < 54.5);

    // —— light key: moon at night, sun at dawn; black when the torch dies ——
    const kd = MOON.clone().lerp(SUN, dk).normalize();
    key.position.copy(key.target.position).addScaledVector(kd, 60);
    key.color.set('#8aa2e6').lerp(new THREE.Color('#ffdcaa'), dk); key.intensity = lerp(1.6, 3.4, dk) * (1 - dkk);
    hemi.color.set('#43548e').lerp(new THREE.Color('#b8c8f0'), dk); hemi.groundColor.set('#0d0d18').lerp(new THREE.Color('#5a4c3c'), dk);
    hemi.intensity = lerp(1.25, 1.7, dk) * (1 - dkk * .96);
    scene.fog.color.copy(FOG).lerp(new THREE.Color('#b8b4ac'), dk).multiplyScalar(1 - dkk * .8);
    scene.fog.density = far ? .005 : lerp(.016, .01, dk);
    SK.u.k.value = (1 - dkk) * (1 + dk * 5);
    renderer.toneMappingExposure = lerp(1.25, 1.0, dk);
    shafts.forEach(s => { s.userData.side = s.userData.aim(s.userData.o, kd.clone().negate(), cam); s.material.uniforms.k.value = (.09 * (1 - dkk) + dk * .08) * (shot.id === 'close' ? 0 : 1) * (s === shafts[4] && !far ? 0 : 1); s.material.uniforms.col.value.set(dk > .5 ? '#ffe2b0' : '#9fb8ff'); s.material.uniforms.t.value = t; });
    dustK = (1 - dkk) * (far ? 0 : 1); DUST.userData.update(t);

    // —— practicals ——
    const night = 1 - dk, lit = (1 - dkk) * night;
    scr.material.emissiveIntensity = 1.6 * lit; monL.intensity = 2 * lit; lampL.intensity = 4 * lit * flick(t, 2) * .95; lampG.material.opacity = .8 * lit; lampB.material.emissiveIntensity = 1.2 * lit;
    picL.forEach((L, i) => L.intensity = 2.5 * lit * (1 + .03 * Math.sin(t * 3 + i)));
    exitM.emissiveIntensity = 2.2 * (1 - dkk * .7) * (1 - dk * .6); exits.forEach(L => L.intensity = .8 * (1 - dkk) * night);
    braz.forEach((b, i) => { const k = flick(t, i * 3); b.L.intensity = 5 * Math.pow(k, 1.3) * lit; b.gl.material.opacity = .7 * k * lit; b.f.userData.update(t, cam, lit > .05 ? 1 : .001); });
    glamps.forEach(gl => gl.material.opacity = .9 * night); pathL.intensity = 3 * night;

    // —— the dinosaur ——
    let df = 'stand';
    if (t < T.gal) df = t >= T.look && t < T.turn1 ? 'look' : t >= T.lift ? 'step' : 'stand';
    else if (t >= T.back && t < T.dawn) df = t < T.spot1 ? 'stand' : (t >= T.surprise && t < T.surprise + 1.0) ? 'down' : 'downC';
    else if (t >= T.dawn) df = t < T.wink ? 'hat' : t < T.wink + .5 ? 'hatLook' : t < T.wink + .9 ? 'hatWink' : 'hatLook';
    dino.frame(df); dino.face(cam);

    // —— portraits ——
    const talking = id => { const v = VO.find(o => o.id === id); return t >= v.t && t < v.t + (id === 'd2' ? 2.4 : 1.8); };
    const gx = g.x, lookAtYou = gx < 6 ? -1 : 1;
    PORTS[0].frame(t > 24.4 && t < 27.5 ? 'smirk' : t > 17.0 ? (gx < 3 ? 'lookL' : 'lookR') : 'n');
    PORTS[1].frame(talking('d1') ? (pick(t, 6) ? 'talkSq' : 'squint') : talking('d2') ? (pick(t, 6) ? 'talkFan' : 'smileFan') : t > 26.5 && t < 28 ? 'smileFan' : t >= 17.6 && t < 21 ? 'squint' : t > 17.0 ? (lookAtYou < 0 ? 'lookL' : 'lookR') : 'n');
    PORTS[2].frame(t > 25.2 && t < 26.4 ? 'yawn' : t > 21.0 && t < 25.2 ? 'lookL' : t > 26.4 && t < 28 ? 'lookL' : 'n');

    // —— the sarcophagus and the mummy ——
    const lo = ss(seg(t, T.lid, T.lid + .5)) * (1 - ss(seg(t, T.lieBack + .1, T.lidShut)));
    lid.position.set(P.sarc[0] - lo * .15, .78 - lo * .2, P.sarc[1] + lo * .85); lid.rotation.set(lo * .35, 0, lo * .06);
    const up = ss(seg(t, T.sitUp, T.sitUp + .45)) * (1 - ss(seg(t, T.lieBack, T.lieBack + .45)));
    mumSit.root.visible = shot.id === 'egypt' && up > .01;
    if (mumSit.root.visible) {
      mumSit.root.position.set(P.sarc[0] - .75, .78 - (1 - up) * 1.1, P.sarc[1] + .05);
      const m1 = VO.find(o => o.id === 'm1'), m2 = VO.find(o => o.id === 'm2');
      let mf = Math.floor(t * 8) % 21 === 0 ? 'blink' : 'sit';
      if (t >= m1.t && t < m1.t + 1.2) mf = pick(t, 6) ? 'talk' : 'sit';
      else if (t >= 31.4 && t < 32.4) mf = 'yawn';
      else if (t >= m2.t && t < m2.t + 2.0) mf = pick(t, 5) ? 'point' : 'talk';
      mumSit.frame(mf); mumSit.face(cam, true);
      // the mummy sits inside the box: clip its legs by keeping the sprite above the rim (the rim hides the rest)
    }
    // the party guests appear in the dark
    const party = t >= T.dark && t < T.dawn;
    mum.root.visible = party; easelDuch.root.visible = easel.visible = party;
    if (party) {
      const s1 = VO.find(o => o.id === 's1');
      mum.frame(t < T.spot3 ? 'cakeOut' : t >= T.blow ? 'cakeOut' : (t >= s1.t && t < s1.t + .9) ? 'cakeTalk' : pick(t, 2) ? 'cake1' : 'cake'); mum.face(cam, true);
      easelDuch.frame(t >= s1.t && t < s1.t + .9 ? 'talkFan' : 'smileFan');
    }
    const cOn = t >= T.spot3 && t < T.blow;
    const cp = v3(-3.3, (52 - 16.5) * SPX, -11.9);   // the candle flame: sprite pixel (17, 16) of the standing mummy
    { const toCam = cam.position.clone().sub(cp).setY(0).normalize(); candleL.position.copy(cp).addScaledVector(toCam, .3); }
    candleL.intensity = cOn ? 2.2 * flick(t, 5) : 0; candleG.position.copy(cp); candleG.material.opacity = cOn ? .7 * flick(t, 5) : 0;
    SPOTS.forEach((S, n) => { const k = spotK(t, n); S.L.intensity = (n === 1 ? 38 : 60) * k; S.b.userData.aim(S.L.position, S.L.target.position.clone().sub(S.L.position).normalize(), cam); S.b.material.uniforms.k.value = .22 * k; S.b.material.uniforms.t.value = t; });
    CONF.userData.update(t);

    // —— you ——
    you.root.position.set(g.x, 0, g.z);
    let yf = 'stand', flip = f < 0;
    const y1 = VO.find(o => o.id === 'y1'), y2 = VO.find(o => o.id === 'y2');
    if (t >= T.dawn) { yf = pick(t, .8) ? 'sleep1' : 'sleep'; flip = false; you.root.position.set(P.bench[0], .12, P.bench[1]); }
    else if (t >= T.dark) {
      if (t < T.spot1) yf = Math.abs(t - 41.2) < .1 ? 'darkBlink' : 'dark';
      else if (t < T.surprise) yf = 'surprised';
      else if (t < T.close) yf = pick(t, 4) ? 'happy1' : 'happy';
      else if (t >= T.blow - .5 && t < T.blow + .15) yf = 'blow';
      else yf = t > T.blow ? (pick(t, 3) ? 'happy1' : 'happy') : (Math.floor(t * 8) % 25 === 0 ? 'blink' : 'smile');
    } else if (g.moving) {
      const st = walkStep(t, g.run);
      yf = g.run ? ['r0', 'r1', 'r2', 'r3'][st] : tv < .5 ? ['dimW0', 'dimW1', 'dimW2', 'dimW3'][st] : ['w0', 'w1', 'w2', 'w3'][st];
    } else if (t < T.gal) {
      if (t >= T.turn1 && t < T.walk2) yf = 'look';
      else if (t >= T.turn2) yf = t < T.turn2 + .7 ? (pick(t, 6) ? 'shock' : 'shock1') : t > 15.1 ? 'shock' : (pick(t, 1.5) ? 'worry1' : 'look');
    } else if (t < T.egypt) {
      yf = t >= y1.t && t < y1.t + 1.1 ? (pick(t, 6) ? 'talkShock' : 'shock') : t > 24.2 ? 'look' : (Math.floor(t * 8) % 23 === 0 ? 'blink' : 'stand');
    } else {
      yf = t >= T.sitUp && t < T.sitUp + .7 ? (pick(t, 6) ? 'shock' : 'shock1') : t >= y2.t && t < y2.t + .6 ? 'talkW' : t > T.sitUp ? 'look' : 'stand';
    }
    you.frame(yf); you.face(cam, flip);

    // —— the torch: spot from the hand, a beam card, a glow on the lens ——
    const hand = v3(g.x + f * .95, 1.03, g.z + .1);
    let aim;
    if (t < 7.5) aim = v3(g.dx, -.35 * Math.hypot(g.dx, g.dz), g.dz).normalize();
    else if (t >= T.turn1 && t < T.walk2) aim = v3(-1, .1, -.6).normalize();
    else if (t >= T.turn2 && t < T.run) aim = v3(-3.9 - hand.x, 2.6 - hand.y, -14.6 - hand.z).normalize();
    else if (t >= T.duchess && t < T.egypt) aim = v3(6.0 - hand.x, 2.2 - hand.y, -17.6 - hand.z).normalize();
    else if (t >= T.lid && t < T.back) aim = v3(6.4 - hand.x, 1.3 - hand.y, -6.6 - hand.z).normalize();
    else { const sw = .22 * Math.sin(t * 1.3); aim = v3(f * Math.cos(sw), -.32, Math.sin(sw) - .25).normalize(); }
    if (f < 0 && t >= T.turn2 && t < T.run) hand.x = g.x - .95;
    const tOn = t < T.dark ? tv : 0;
    TL.position.copy(hand); TL.target.position.copy(hand).addScaledVector(aim, 4); TL.intensity = 26 * tOn * (t >= T.duchess && t < T.egypt ? .4 : t >= T.turn2 && t < T.run ? .6 : 1);
    TB.userData.aim(hand, aim, cam); TB.material.uniforms.k.value = .26 * tOn * (far ? .6 : 1); TB.material.uniforms.t.value = t;
    TG.position.copy(hand).add(v3(0, 0, .12)); TG.material.opacity = .9 * tOn; TG.scale.setScalar(far ? 1.2 : .42);
    TL.castShadow = !far;

    // —— focus subject (rack between speakers) ——
    let subj = v3(g.x, .95, g.z);
    if (shot.id === 'plan') subj = v3(g.x, .5, g.z);
    else if (shot.id === 'hall') subj = t >= T.turn2 && t < T.run ? v3(lerp(g.x, -4.3, .5), 1.4, -13.6) : v3(g.x, .95, g.z);
    else if (shot.id === 'gallery') { const onD = (t >= 19 && t < 22) || (t >= 24 && t < 26.5); subj = onD ? v3(6.0, 2.0, -17.6) : v3(g.x, 1.0, g.z); }
    else if (shot.id === 'egypt') subj = t > T.sitUp && t < T.lieBack ? v3(P.sarc[0] - .75, 1.1, P.sarc[1]) : v3(g.x, 1.0, g.z);
    else if (shot.id === 'close') subj = v3(-4.0, 1.15, -12.2);
    else if (shot.id === 'dawn') subj = t < 54.5 ? v3(-6.5, .5, -13.5) : v3(-5.6, 1.6, -14.4);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.maxCoc = 22;
    fill.position.copy(subj).add(v3(.3, .8, 2.2)); fill.intensity = 1.2 * (1 - dkk) * (1 - dk * .5) * (far ? 0 : 1);
    return subj;
  }
  return { scene, update };
}
