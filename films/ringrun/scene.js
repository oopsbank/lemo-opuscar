// The Ring Run — the static hillside: three tiers (hotel roofs / market street / canal), the terrace wall with the pipe channel
// and the stone steps, the bridge, the chapel (its roof can be lifted off) and its clock tower, plus pastel town dressing.
import * as THREE from 'three';
import { GB } from './geo.js';
import { canvasTex } from './sprites.js';
import { std } from './kit.js';
import { MID, TOP, STREET, HOTEL, RAIL_, LINE, AWN, FIRE, CURVE, HOLE, PIPE, STAIRS, CANAL, BRIDGE, CHAPEL, TOWER, ROSE, GRATE, ALTAR, railAt, RAILLEN, ARC } from './story.js';
import { mulberry } from '/core/lib.js';

const PAL = { mint: '#a8dcc4', peach: '#f6c6a6', cream: '#f4e7cc', sky: '#b8d6ea', pink: '#f0b8c4', lilac: '#c9b8e0', sand: '#e6d7b8', stone: '#cfc4b0' };
const cols = [PAL.mint, PAL.peach, PAL.cream, PAL.sky, PAL.pink, PAL.lilac];
export const OUT = {};
function signTex(text, bg, fg, w = 512, h = 128, font = 'bold 84px sans-serif') { return canvasTex(w, h, g => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); }); }
function sign(scene, text, w, h, x, y, z, ry = 0, rx = 0, bg = '#f4e7cc', fg = '#3a4a6a') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, bg, fg), roughness: .6 })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m); return m; }
function windowsTex(seed, wcol = '#5a6a80') { const r = mulberry(seed); return canvasTex(128, 128, g => { g.clearRect(0, 0, 128, 128); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.fillStyle = wcol; g.fillRect(14 + i * 40, 12 + j * 40, 22, 26); g.fillStyle = '#ffffff'; g.fillRect(14 + i * 40, 36 + j * 40, 22, 3); } }); }
export function buildScene(scene) {
  const R = mulberry(17), b = new GB(), w = new GB();
  // —— ground levels ——
  b.box(-80, 80, -1.5, 0, -2, CANAL.z0, PAL.sand, PAL.sand); b.box(-80, 80, -1.5, 0, CANAL.z1, 60, PAL.sand, PAL.sand);   // bottom tier quays
  b.box(-80, 80, -3, CANAL.y - .9, CANAL.z0, CANAL.z1, '#5fa8a0');       // canal bed
  b.box(-80, 80, 0, MID, -30, 0, '#d8c8a8', '#d9cfbd');                 // the terrace (middle tier) with its wall at z 0
  b.box(-80, 80, MID, 16, -80, -26, '#d4c6aa', '#cbbf9f');               // the upper hillside behind
  // stone courses on the terrace wall (south face), leaving the pipe channel and the steps open
  for (let y = .6; y < MID; y += .9) for (let x = -80; x < 80; x += 1.8) { const off = (Math.round(y / .9) % 2) * .9; const xx = x + off; if (xx > PIPE.x - 1.2 && xx < STAIRS.x1 + .2) continue; b.box(xx, xx + 1.72, y - .4, y + .42, -.05, .06, R() < .5 ? '#d2c3a5' : '#c9b99a'); }
  // the pipe channel (a half-pipe cut in the wall, then across the quay to the canal) is in actors (open, mossy)
  // the stone steps beside it, middle → bottom
  for (let k = 0; k < 16; k++) { const z = -1 + k * .5, y = MID - k * .5; b.box(STAIRS.x0, STAIRS.x1, 0, y, z, z + .5, '#d8cdb6', '#e2d8c4'); }
  b.box(STAIRS.x1, STAIRS.x1 + .25, 0, MID + .8, -1, 7, '#cbbd9e');
  // quay edges, bollards, the canal walls
  b.box(-80, 80, -1.2, .12, CANAL.z0 - .3, CANAL.z0, '#cfc3ad'); b.box(-80, 80, -1.2, .12, CANAL.z1, CANAL.z1 + .3, '#cfc3ad');
  for (let x = -30; x < 40; x += 6) { b.cyl(x, CANAL.z0 - .6, .15, 0, .5, '#6b6f78', 8); b.cyl(x + 3, CANAL.z1 + .6, .15, 0, .5, '#6b6f78', 8); }
  // the stone bridge (an arch over the canal)
  const bx = BRIDGE.x, bw = BRIDGE.w / 2;
  for (let k = 0; k <= 12; k++) { const u = k / 12, z = CANAL.z0 - 1 + u * (CANAL.z1 - CANAL.z0 + 2), y = 1.2 + Math.sin(u * Math.PI) * .9; b.box(bx - bw, bx + bw, y - .5, y, z - .3, z + .3, '#e8dcc6', '#efe5d2'); }
  for (const s of [-1, 1]) for (let k = 0; k <= 12; k++) { const u = k / 12, z = CANAL.z0 - 1 + u * (CANAL.z1 - CANAL.z0 + 2), y = 1.2 + Math.sin(u * Math.PI) * .9; b.box(bx + s * bw - .12, bx + s * bw + .12, y, y + .7, z - .3, z + .3, '#e2d4bc'); }
  // —— the middle tier: street (cobbles), sidewalks, rails, stalls, buildings ——
  b.flat(-80, 80, STREET.z0, STREET.z1, MID + .01, '#c9bfae');
  for (let x = -80; x < 80; x += .9) b.flat(x, x + .04, STREET.z0, STREET.z1, MID + .015, '#b8ad9a');
  b.flat(-80, 80, STREET.z0 - .12, STREET.z0, MID + .02, '#e8e1d2'); b.flat(-80, 80, STREET.z1, STREET.z1 + .12, MID + .02, '#e8e1d2');
  // rails (yellow-painted tram rails): two strips along the path
  const rail = new GB(); for (let d = 0; d < RAILLEN + ARC + 30; d += .5) { const p = railAt(d), q = railAt(d + .5); for (const off of [-.6, .6]) { const nx = Math.cos(p.yaw) * 0 + -Math.cos(p.yaw), nz = Math.sin(p.yaw); const ox = -Math.cos(p.yaw) * off, oz = Math.sin(p.yaw) * off;
      const ax = p.x + Math.sin(p.yaw) * 0, az = p.z; rail.box(Math.min(p.x, q.x) + ox - .06, Math.max(p.x, q.x) + ox + .06, MID + .01, MID + .07, Math.min(p.z, q.z) + oz - .06, Math.max(p.z, q.z) + oz + .06, '#e2b93a'); } }
  scene.add(new THREE.Mesh(rail.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, metalness: .4 })));
  // overhead tram wire posts
  for (let x = -40; x < 8; x += 9) { b.box(x - .07, x + .07, MID, MID + 5, STREET.z1 - .1, STREET.z1 + .05, '#7a7f88'); b.box(x - .05, x + .05, MID + 4.8, MID + 4.9, STREET.rail - .1, STREET.z1, '#7a7f88'); }
  // buildings along the north side of the street (except the hotel) and on the terrace edge, pastel, with windows
  const winMat = s => new THREE.MeshStandardMaterial({ map: windowsTex(s), roughness: .7 });
  const facades = [];
  const house = (x0, x1, z0, z1, y0, h, c, roof = '#e9a48a') => { b.box(x0, x1, y0, y0 + h, z0, z1, c, roof); facades.push([x0, x1, z1, y0, h, R() * 1000 | 0]); };
  for (const [x0, x1] of [[-40, -31], [-30, -22], [-21, -13], [-12.5, -6.6], [16.5, 24], [25, 33], [34, 42]]) house(x0, x1, -16, -9.6, MID, 6 + R() * 5, cols[R() * 6 | 0]);
  house(10.6, 13.0, -16, -12.6, MID, 9, PAL.lilac);
  // the hotel (top tier roof at y 22), its south facade, roof railing, sign, water tank, a neighbour roof
  b.box(HOTEL.x0, HOTEL.x1, MID, TOP, HOTEL.z0, HOTEL.z1, PAL.cream, '#d9cdb8'); facades.push([HOTEL.x0, HOTEL.x1, HOTEL.z1, MID, TOP - MID, 7]);
  b.box(HOTEL.x0, HOTEL.x1, TOP, TOP + .35, HOTEL.z1 - .3, HOTEL.z1, '#e6dccb');
  for (let x = HOTEL.x0 + .2; x < HOTEL.x1; x += .5) b.box(x - .03, x + .03, TOP, TOP + 1.1, RAIL_.z - .03, RAIL_.z + .03, '#4a5a70');
  b.box(HOTEL.x0, HOTEL.x1, TOP + 1.05, TOP + 1.15, RAIL_.z - .06, RAIL_.z + .06, '#4a5a70');
  b.box(HOTEL.x0 + .5, HOTEL.x1 - .5, TOP, TOP + .03, HOTEL.z0 + .5, HOTEL.z1 - .5, '#d8c8b0');
  for (let x = HOTEL.x0 + 1; x < HOTEL.x1 - 1; x += 1.6) for (let z = HOTEL.z0 + 1; z < HOTEL.z1 - 1; z += 1.6) b.flat(x, x + 1.5, z, z + 1.5, TOP + .035, (Math.round(x + z) % 2) ? '#e8dac4' : '#dccbb2');
  b.cyl(-3.5, -20, 1.2, TOP, TOP + 3.2, '#9ab0c0', 14); b.cyl(-3.5, -20, 1.25, TOP + 3.2, TOP + 3.6, '#7a8a98', 14);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(-3.5 + dx * .9 - .08, -3.5 + dx * .9 + .08, TOP - 1, TOP, -20 + dz * .9 - .08, -20 + dz * .9 + .08, '#5a5a5a');
  b.box(HOTEL.x1, 16, MID, 18, -24, -16.4, PAL.mint, '#e59a84'); b.box(-16, HOTEL.x0, MID, 19.5, -24, -16.6, PAL.peach, '#e3a894');
  // GRAND HOTEL letters on a frame at the back of the roof
  OUT.hotelSign = sign(scene, 'GRAND HOTEL', 11, 2.2, 2, TOP + 3.2, HOTEL.z0 + 1.2, 0, -.25, '#ffffff', '#c23a4a');
  b.box(-3.2, -3.0, TOP, TOP + 2.2, HOTEL.z0 + 1.05, HOTEL.z0 + 1.2, '#888'); b.box(7.0, 7.2, TOP, TOP + 2.2, HOTEL.z0 + 1.05, HOTEL.z0 + 1.2, '#888');
  // laundry line brackets on the facade
  b.box(LINE.x0 - .05, LINE.x0 + .05, LINE.y - .05, LINE.y + .05, HOTEL.z1, LINE.z, '#555'); b.box(LINE.x1 - .05, LINE.x1 + .05, LINE.y - .05, LINE.y + .05, HOTEL.z1, LINE.z, '#555');
  // the fire escape (green): landings every 3.5 m, zig-zag flights
  const fe = new GB(); for (let k = 0; k <= 4; k++) { const y = MID + k * 3.5; fe.box(FIRE.x0 - .3, FIRE.x1 + .3, y - .08, y, HOTEL.z1, FIRE.z + .5, '#3e9a72'); fe.box(FIRE.x0 - .3, FIRE.x1 + .3, y, y + .8, FIRE.z + .46, FIRE.z + .5, '#3e9a72'); }
  for (let k = 0; k < 4; k++) for (let j = 0; j < 10; j++) { const u = j / 10, dir = k % 2 ? 1 : -1, x = dir > 0 ? FIRE.x0 + u * (FIRE.x1 - FIRE.x0) : FIRE.x1 - u * (FIRE.x1 - FIRE.x0), y = TOP - k * 3.5 - u * 3.5; fe.box(x - .16, x + .16, y - .06, y, HOTEL.z1 + .1, FIRE.z + .3, '#3e9a72'); }
  scene.add(Object.assign(new THREE.Mesh(fe.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .3 })), { castShadow: true }));
  // café (north side, under the awning), market stalls on the south sidewalk, the fruit cart
  b.box(AWN.x0, AWN.x1, MID, MID + 3.2, -12, -10, '#fff4e4', '#e8a090');
  for (const [x, c] of [[-28, '#f08a8a'], [-24, '#8ac8f0'], [-20, '#f0d08a'], [-12, '#a8e0a0'], [-4, '#f0a8d0'], [4, '#a8d0f0'], [20, '#f0c08a'], [26, '#c0a8f0']]) {
    b.box(x - 1.4, x + 1.4, MID, MID + .9, -1.6, -.4, '#c8a878'); b.box(x - 1.5, x + 1.5, MID + 2.1, MID + 2.25, -1.8, -.2, c, c);
    for (const dx of [-1.35, 1.35]) b.box(x + dx - .05, x + dx + .05, MID, MID + 2.1, -1.7, -1.6, '#888');
    for (let k = 0; k < 6; k++) b.box(x - 1.2 + k * .42, x - .9 + k * .42, MID + .9, MID + 1.15, -1.4, -.6, ['#e84a4a', '#f0c030', '#7ac050', '#f08a30'][k % 4]); }
  for (let k = 0; k < 50; k++) { const x = -40 + R() * 80; if (Math.abs(x - 13) < 6) continue; b.box(x - .25, x + .25, MID, MID + .3, -9.4 + R() * .6, -9.0 + R() * .6, R() < .5 ? '#7aa060' : '#e8c880'); }
  // a few toy trees, round; benches along the quay
  const tree = (x, y, z) => { b.cyl(x, z, .12, y, y + 1.2, '#8a6a4a', 6); };
  const treeTops = [];
  for (const [x, z] of [[-30, 4], [-22, 4], [-14, 4], [2, 4], [8, 4], [28, 4], [34, 4], [-26, 18], [-20, 18], [-12, 14.6], [7, 14.6], [36, 18]]) { tree(x, 0, z); treeTops.push([x, 1.9, z]); }
  for (const [x, z] of [[-34, -12.5], [30, -12.5]]) { tree(x, MID, z); treeTops.push([x, MID + 1.9, z]); }
  // quay houses on the south bank (east of the chapel) and far west
  for (const [x0, x1] of [[8, 14], [15, 21], [22, 28], [29, 35], [-24, -17], [-16, -10]]) house(x0, x1, 16, 26, 0, 5 + R() * 3, cols[R() * 6 | 0]);
  // —— the chapel (white) and its clock tower ——
  const C = CHAPEL; OUT.chapelWalls = new GB(); const cw = OUT.chapelWalls;
  cw.box(C.x0, C.x1, 0, C.h, C.z0, C.z0 + .4, '#f8f6f0'); cw.box(C.x0, C.x1, 0, C.h, C.z1 - .4, C.z1, '#f8f6f0');
  cw.box(C.x0, C.x0 + .4, 0, C.h, C.z0, C.z1, '#f8f6f0'); cw.box(C.x1 - .4, C.x1, 0, C.h, C.z0, C.z1, '#f8f6f0');
  for (let y = C.h; y < C.h + 3.2; y += .4) { const k = (y - C.h) / 3.2, hw = (C.x1 - C.x0) / 2 * (1 - k); cw.box(C.x0 + (C.x1 - C.x0) / 2 - hw, C.x0 + (C.x1 - C.x0) / 2 + hw, y, y + .4, C.z0, C.z0 + .4, '#f8f6f0'); cw.box(C.x0 + (C.x1 - C.x0) / 2 - hw, C.x0 + (C.x1 - C.x0) / 2 + hw, y, y + .4, C.z1 - .4, C.z1, '#f8f6f0'); }
  cw.box(C.door - 1.6, C.door + 1.6, 0, .25, C.z0 - 1.8, C.z0, '#e8e2d4'); cw.box(C.door - 1.2, C.door + 1.2, 0, .5, C.z0 - 1.0, C.z0, '#e8e2d4');
  cw.flat(C.x0 + .4, C.x1 - .4, C.z0 + .4, C.z1 - .4, .03, '#e9e2d2');
  scene.add(Object.assign(new THREE.Mesh(cw.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 })), { castShadow: true, receiveShadow: true }));
  // the roof (lifted off for the dollhouse shots)
  { const rg = new THREE.Group(); const hw = (C.x1 - C.x0) / 2 + .3, L = C.z1 - C.z0 + .4, sl = Math.hypot(hw, 3.2);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(sl, .25, L), std('#8fb8d8', { roughness: .45 })); p.position.set(C.x0 + (C.x1 - C.x0) / 2 + s * hw / 2, C.h + 1.6, (C.z0 + C.z1) / 2); p.rotation.z = -s * Math.atan2(3.2, hw); p.castShadow = true; rg.add(p); }
    scene.add(rg); OUT.roof = rg; }
  sign(scene, 'HARBOR CHAPEL', 5, .8, C.door, 3.6, C.z0 - .05, Math.PI, 0, '#ffffff', '#3a5a8a').rotation.y = 0;
  // the clock tower
  b.box(TOWER.x0, TOWER.x1, 0, TOWER.h, TOWER.z0, TOWER.z1, '#f8f6f0', '#f0ece2');
  for (let k = 0; k < 6; k++) { const y = TOWER.h + k * .7, s = 1.9 - k * .32; b.box((TOWER.x0 + TOWER.x1) / 2 - s, (TOWER.x0 + TOWER.x1) / 2 + s, y, y + .7, (TOWER.z0 + TOWER.z1) / 2 - s, (TOWER.z0 + TOWER.z1) / 2 + s, '#8fb8d8', '#8fb8d8'); }
  b.box(C.x0 - .2, C.x0 + .1, C.h - 1, C.h, C.z0, C.z0 + 3.4, '#f0ece2');
  // —— build ——
  scene.add(Object.assign(new THREE.Mesh(b.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55 })), { castShadow: true, receiveShadow: true }));
  // facades with windows (planes in front of the south faces)
  for (const [x0, x1, z, y0, h, s] of facades) { const m = winMat(s); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(Math.max(1, Math.round((x1 - x0) / 3)), Math.max(1, Math.round(h / 3))); m.transparent = true; m.alphaTest = .5;
    const g = new THREE.PlaneGeometry(x1 - x0 - .4, h - 1); const me = new THREE.Mesh(g, m); me.position.set((x0 + x1) / 2, y0 + h / 2, z + .03); scene.add(me); }
  // tree crowns
  const leaf = std('#7cc48a', { roughness: .5 }); for (const [x, y, z] of treeTops) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 10), leaf); c.position.set(x, y + .3, z); c.castShadow = true; scene.add(c); }
  // signs
  sign(scene, 'MARKET STREET', 6, 1, -16, MID + 3.8, -9.5, 0, -.5, '#3e9a72', '#ffffff');
  // water
  const water = new THREE.Mesh(new THREE.PlaneGeometry(160, CANAL.z1 - CANAL.z0, 80, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5cc8c0', roughness: .12, metalness: .3, transparent: true, opacity: .9 }));
  water.position.set(0, CANAL.y, (CANAL.z0 + CANAL.z1) / 2); water.receiveShadow = true; scene.add(water); OUT.water = water;
}
