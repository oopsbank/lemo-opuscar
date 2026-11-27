// Three props drawn on the 3× grid (81 px per metre, the same as the 3× characters): the help-desk table, its monitor with a
// keyboard, and a mug. Hard pixels (nearest filtering), hand-placed detail: laminate grain, an edge band, a coffee ring, a sticky
// note, a drawer with a handle, the monitor's pixel ticket queue, keycaps, the mug's band and handle, steam.
import * as THREE from 'three';
import { PX, ramp, h2, texOf, billboard } from './px.js';

const PPM3 = 81;
const LAM = ramp(['#8a8478', '#aaa496', '#c8c2b2', '#e0dacb', '#f2ede0'], .3), MET = ramp(['#1e2026', '#30343c', '#464c56', '#646a76'], .3);
const px = m => Math.max(1, Math.round(m * PPM3));
const matOf = (canvas, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: texOf(canvas), roughness: o.r ?? .7, metalness: o.m ?? 0, transparent: !!o.alpha, alphaTest: o.alpha ? .5 : 0 }); if (o.em) { m.emissiveMap = m.map; m.emissive = new THREE.Color('#ffffff'); m.emissiveIntensity = o.em; } return m; };
const quad = (w, h, m) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.receiveShadow = true; q.castShadow = true; return q; };

function deskTop(w, h) {   // laminate seen from above: long grain streaks, an edge band, a coffee ring, a sticky note, scuffs
  const P = new PX(w, h);
  P.fill((x, y) => { let v = .55 + (h2(Math.floor(x / 9), y, 3) - .5) * .12 + (h2(x, y, 7) - .5) * .1; if (y < 2 || y >= h - 2 || x < 2 || x >= w - 2) v = .25; return LAM(v, x, y); });
  for (let a = 0; a < 6.28; a += .05) P.set(Math.round(w * .72 + Math.cos(a) * 4), Math.round(h * .45 + Math.sin(a) * 3), LAM(.3, 0, 0));
  P.rect(Math.round(w * .12), Math.round(h * .3), 8, 7, [250, 222, 90]); P.rect(Math.round(w * .12), Math.round(h * .3), 8, 2, [236, 196, 60]);
  for (const [k, l] of [[0, 4], [2, 3], [4, 5]]) P.rect(Math.round(w * .12) + 1, Math.round(h * .3) + 3 + k / 2, l, 1, [90, 80, 60]);
  for (let i = 0; i < 6; i++) { const x = Math.round(h2(i, 1, 5) * (w - 10)) + 5, y = Math.round(h2(i, 2, 5) * (h - 6)) + 3; P.line(x, y, x + 3, y + 1, LAM(.42, 0, 0)); }
  return P.done();
}
function deskFront(w, h) {   // the modesty panel: a drawer with a recessed handle and a cable grommet
  const P = new PX(w, h);
  P.fill((x, y) => { let v = .42 + (h2(x >> 3, y, 2) - .5) * .08; if (y < 3) v = .2; return LAM(v, x, y); });
  const dx = Math.round(w * .62), dw = Math.round(w * .3), dy = 6, dh = Math.round(h * .32);
  P.rect(dx, dy, dw, dh, LAM(.5, 0, 0)); P.rect(dx, dy, dw, 1, LAM(.75, 0, 0)); P.rect(dx, dy + dh - 1, dw, 1, LAM(.2, 0, 0)); P.rect(dx, dy, 1, dh, LAM(.7, 0, 0));
  P.rect(dx + (dw >> 1) - 6, dy + 5, 12, 2, MET(.4, 0, 0)); P.rect(dx + (dw >> 1) - 6, dy + 5, 12, 1, MET(.8, 0, 0));
  for (let a = 0; a < 6.28; a += .1) P.set(Math.round(w * .2 + Math.cos(a) * 3), Math.round(10 + Math.sin(a) * 3), MET(.3, 0, 0));
  return P.done();
}
function screen(w, h) {   // a pixel ticket queue: a title bar, rows with status dots, a cursor
  const P = new PX(w, h);
  P.fill((x, y) => [22, 32, 58]);
  P.rect(0, 0, w, 4, [60, 120, 220]); P.rect(1, 1, 10, 2, [230, 240, 255]); P.rect(w - 4, 1, 2, 2, [240, 90, 90]);
  const cols = [[240, 90, 90], [250, 200, 60], [120, 220, 90]];
  for (let r = 0; r < 6; r++) { const y = 6 + r * 4; P.rect(2, y, 2, 2, cols[r % 3]); P.rect(6, y, 10 + (r * 7) % 14, 1, [170, 190, 220]); P.rect(6, y + 2, 6 + (r * 5) % 9, 1, [90, 110, 150]); if (r === 2) P.rect(1, y - 1, w - 2, 4, [40, 70, 120]); }
  P.rect(w - 12, h - 7, 10, 5, [120, 220, 90]); P.rect(w - 11, h - 6, 8, 1, [20, 60, 20]);
  P.rect(Math.round(w * .55), 15, 1, 3, [255, 255, 255]);
  return P.done();
}
function keyboard(w, h) {
  const P = new PX(w, h);
  P.fill((x, y) => MET(.35, x, y));
  for (let r = 0; r < 4; r++) for (let c = 0; c < Math.floor((w - 2) / 3); c++) { const x = 1 + c * 3, y = 1 + r * 3; if (r === 3 && c > 2 && c < 9) continue; P.rect(x, y, 2, 2, MET(.7, 0, 0)); P.set(x, y, MET(.95, 0, 0)); }
  P.rect(10, 10, 17, 2, MET(.7, 0, 0));
  return P.done();
}
function mug() {   // 12×13: a white mug with a lime band, a handle, coffee, a chip
  const P = new PX(16, 22), E = new PX(16, 22);
  for (let y = 9; y < 21; y++) for (let x = 2; x < 12; x++) P.set(x, y, x < 4 ? [200, 200, 196] : x > 9 ? [214, 214, 208] : [246, 246, 240]);
  P.rect(2, 13, 10, 3, [88, 170, 34]); P.rect(2, 13, 10, 1, [134, 214, 54]); P.rect(4, 14, 2, 1, [30, 70, 12]); P.rect(7, 14, 2, 1, [30, 70, 12]);
  P.rect(3, 9, 8, 1, [70, 40, 22]); P.rect(2, 20, 10, 1, [170, 170, 164]);
  for (const [x, y] of [[12, 11], [13, 11], [14, 12], [14, 13], [14, 14], [14, 15], [13, 16], [12, 16]]) P.set(x, y, [226, 226, 220]);
  P.set(11, 10, [180, 180, 176]);
  for (const [x, y] of [[5, 7], [6, 6], [6, 5], [5, 4], [8, 6], [9, 5], [9, 4], [8, 3], [8, 2]]) { P.set(x, y, [236, 240, 246], 150); E.set(x, y, [40, 40, 44]); }
  P.outline(.3);
  return { tex: texOf(P.done()), em: texOf(E.done()) };
}

export function buildProps3x(scene, x0, z0) {
  const g = new THREE.Group(); g.position.set(x0, 0, z0); scene.add(g);
  const W = 1.3, D = .62, H = .74;
  const topM = matOf(deskTop(px(W), px(D)), { r: .55 }), frontM = matOf(deskFront(px(W - .1), px(.5)));
  const top = quad(W, D, topM); top.rotation.x = -Math.PI / 2; top.position.set(0, H, 0); g.add(top);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(W, .035, D), new THREE.MeshStandardMaterial({ color: '#5a564e', roughness: .6 })); edge.position.set(0, H - .02, 0); edge.castShadow = true; g.add(edge);
  const front = quad(W - .1, .5, frontM); front.position.set(0, H - .29, D / 2 - .06); g.add(front);
  const legM = new THREE.MeshStandardMaterial({ color: '#30343c', roughness: .4, metalness: .6 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.04, H - .04, .04), legM); l.position.set(sx * (W / 2 - .05), (H - .04) / 2, sz * (D / 2 - .05)); l.castShadow = true; g.add(l); }
  // the monitor: a bezel, the pixel screen (emissive), a neck and a foot
  const bez = new THREE.Mesh(new THREE.BoxGeometry(.6, .38, .03), new THREE.MeshStandardMaterial({ color: '#1c1e24', roughness: .4 })); bez.position.set(-.12, H + .36, -.12); bez.castShadow = true; g.add(bez);
  const scr = quad(.55, .33, matOf(screen(px(.55), px(.33)), { em: .9 })); scr.position.set(-.12, H + .36, -.103); g.add(scr);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(.05, .17, .04), legM); neck.position.set(-.12, H + .085, -.14); g.add(neck);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.22, .015, .14), legM); foot.position.set(-.12, H + .008, -.12); g.add(foot);
  const kb = quad(.42, .14, matOf(keyboard(px(.42), px(.14)), { r: .5 })); kb.rotation.x = -Math.PI / 2; kb.position.set(-.12, H + .006, .1); g.add(kb);
  const M = mug(), cup = billboard(M.tex, 16 / PPM3, 22 / PPM3, { em: M.em, emCol: '#ffffff', emI: 1 }); cup.position.set(.16, H, .2); g.add(cup);
  return { group: g, cup };
}
