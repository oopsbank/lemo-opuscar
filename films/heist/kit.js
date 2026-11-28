// Shared kit for this film (copied from films/midnight): textures, a facade painter, toy figures, toy cars.
import * as THREE from 'three';
import { canvasTex } from './sprites.js';
import { mulberry } from '/core/lib.js';
export const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
export const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
export const sph = (r, mat, x = 0, y = 0, z = 0, s = 12) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, s, s >> 1), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
export const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, s = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, s), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const R = mulberry(41);
export const MAT = {};
// tiled pavement and wet asphalt textures (world-space uvs: 1 unit = 1 m)
export function tileTex() {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5a5d63'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 84 + (R() * 22 | 0); g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(20,25,20,${.05 + R() * .1})`; g.beginPath(); g.arc(R() * w, R() * h, 4 + R() * 14, 0, 7); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 2.4, 1 / 2.4); return t;
}
export function asphaltTex() {
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4000; k++) { const v = 30 + R() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(R() * w, R() * h, 2, 2); }
    for (let k = 0; k < 26; k++) { g.fillStyle = `rgba(10,12,16,${.25 + R() * .3})`; g.beginPath(); g.ellipse(R() * w, R() * h, 20 + R() * 60, 10 + R() * 30, R() * 3, 0, 7); g.fill(); }   // puddle-dark patches
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, 1 / 9); return t;
}
export function roughTex() {   // puddles: shiny (dark in the roughness map)
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 18; k++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); g.save(); g.translate(R() * w, R() * h); g.scale(30 + R() * 70, 14 + R() * 30); gr.addColorStop(0, '#080808'); gr.addColorStop(.8, '#181818'); gr.addColorStop(1, 'rgba(154,154,154,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
  });
  t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, 1 / 9); return t;
}
export function plane(x0, x1, z0, z1, y, mat) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute('uv'), p = g.getAttribute('position'); for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
// a facade: stained concrete, a grid of windows, some lit (emissive map)
export function facade(wid, hgt, floors, bays, lit, seed, base = '#8d8a7e') {
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

export function car(scene, { body = '#f2c21a', cab = null, len = 3.5, wid = 1.6, taxi = false, truck = false }) {
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
