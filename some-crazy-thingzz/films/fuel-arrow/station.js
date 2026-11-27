// station.js — the set for "Wrong Side": a bright corner gas station (canopy with the channel name, two pump islands, a shop with snack posters,
// a forecourt with markings, an air pump, a bin, cones, plants, a street and houses behind), a teal hatchback whose fuel door opens on the right,
// and the car's cockpit as a separate rig (dashboard with the fuel gauge, the steering wheel, the windscreen frame) for the close shots.
// Units: metres; ground y = 0.
import * as THREE from 'three';
import { paint, mat, fbm, h2, rbox, cyl } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const M = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function concrete() { const W = 512, s = 71; return paint(W, W, (x, y) => { const u = x / W, v = y / W, n = fbm(u * 8, v * 8, s, 5, 8), f = h2(x, y, s);
  let c = mix3(hex('#b9b4aa'), hex('#d6d1c6'), n).map(k => k * (.94 + f * .08)); const joint = Math.min(u % .5, v % .5) * W < 2; if (joint) c = c.map(k => k * .7);
  const oil = fbm(u * 3 + 10, v * 3, s + 4, 3, 3); if (oil > .68) c = mix3(c, [80, 76, 72], (oil - .68) * 2.5);
  return { c, r: .85, h: n * .6 + (joint ? 0 : .3) }; }); }
function asphalt() { const W = 256, s = 73; return paint(W, W, (x, y) => { const f = h2(x, y, s), n = fbm(x / 40, y / 40, s, 3, 6.4); return { c: [70 + n * 20 + f * 18, 72 + n * 20 + f * 18, 76 + n * 20 + f * 18], r: .9, h: f }; }); }

// —— the fuel gauge face: a dial, a needle near E, the pump icon (hose on the LEFT) and the arrow pointing RIGHT ——
export function gaugeCanvas(o = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  const draw = (o2 = {}) => {
    g.clearRect(0, 0, 512, 512); g.fillStyle = '#101418'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    g.strokeStyle = '#3a4048'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#e8f4ff'; g.lineCap = 'round';
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.15 + i / 8 * .7); g.lineWidth = i % 4 ? 6 : 12; g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 300 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * (i % 4 ? 175 : 160), 300 + Math.sin(a) * (i % 4 ? 175 : 160)); g.stroke(); }
    g.fillStyle = '#ff5a3a'; g.font = '800 54px Baloo2'; g.textAlign = 'center'; g.fillText('E', 110, 210); g.fillStyle = '#e8f4ff'; g.fillText('F', 402, 210);
    // the pump icon: body, window, and the hose curling out on the LEFT
    const glow = o2.icon ?? 0, col = glow ? '#ffd84a' : '#ff9a3a';
    g.save(); g.translate(256, 330); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 12;
    g.fillRect(-38, -60, 66, 100); g.fillStyle = '#101418'; g.fillRect(-26, -48, 42, 26);
    g.beginPath(); g.moveTo(-38, -30); g.quadraticCurveTo(-78, -30, -74, 10); g.lineTo(-74, 34); g.stroke();   // the hose (left)
    if (o2.hoseX) { g.strokeStyle = '#ff3b30'; g.lineWidth = 14; g.beginPath(); g.moveTo(-104, -40); g.lineTo(-44, 40); g.moveTo(-44, -40); g.lineTo(-104, 40); g.stroke(); }
    // the arrow (RIGHT)
    g.fillStyle = o2.arrow ? '#7be07b' : col; g.beginPath(); g.moveTo(62, -36); g.lineTo(112, -10); g.lineTo(62, 16); g.closePath(); g.fill();
    g.restore();
    // the needle, nearly empty
    const na = Math.PI * (1.2 + (o2.needle ?? .08) * .6); g.strokeStyle = '#ff3b30'; g.lineWidth = 12; g.beginPath(); g.moveTo(256, 300); g.lineTo(256 + Math.cos(na) * 190, 300 + Math.sin(na) * 190); g.stroke();
    g.fillStyle = '#3a4048'; g.beginPath(); g.arc(256, 300, 26, 0, 7); g.fill();
    if (o2.sticker) {   // Gus's own arrow, stuck on beside the gauge (drawn on the bezel)
      g.save(); g.translate(330, 470); g.rotate(-.12); g.fillStyle = '#ffd84a'; g.fillRect(-120, -34, 240, 64); g.fillStyle = '#c23a2e'; g.font = '800 44px Baloo2'; g.fillText('SNACKS →', 0, 14); g.restore();
    }
  };
  draw(o); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  let key = ''; t.set = o2 => { const k = JSON.stringify(o2); if (k === key) return; key = k; draw(o2); t.needsUpdate = true; };
  return t;
}

// —— a teal hatchback (front toward −z when ry = 0); the fuel door on its RIGHT rear ——
export function makeCar() {
  const g = new THREE.Group(), body = M('#2fa39a', .35, .2), dark = M('#1c2228', .2, .3), glass = new THREE.MeshStandardMaterial({ color: '#2a3a48', roughness: .08, metalness: .3 }), tyre = M('#1a1a1c', .9), rim = M('#c8ccd2', .3, 1), chrome = M('#e0e4ea', .2, 1);
  const b = rbox(1.72, .62, 3.7, .16, body); b.position.y = .62; g.add(b);
  const cab = rbox(1.5, .55, 2.0, .2, body); cab.position.set(0, 1.15, .25); g.add(cab);
  for (const [w, h, d, x, y, z] of [[1.52, .42, .04, 0, 1.17, -.76], [1.5, .4, .04, 0, 1.18, 1.26], [.04, .38, 1.7, .76, 1.17, .25], [.04, .38, 1.7, -.76, 1.17, .25]]) { const p = rbox(w, h, d, .01, glass); p.position.set(x, y, z); g.add(p); }
  for (const [x, z] of [[-.8, -1.2], [.8, -1.2], [-.8, 1.2], [.8, 1.2]]) { const t = cyl(.34, .34, .24, tyre, 24); t.rotation.z = Math.PI / 2; t.position.set(x, .34, z); g.add(t); const r = cyl(.2, .2, .25, rim, 16); r.rotation.z = Math.PI / 2; r.position.set(x, .34, z); g.add(r); }
  for (const x of [-.55, .55]) { const hl = rbox(.32, .14, .05, .03, new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fff2c0', emissiveIntensity: .6 })); hl.position.set(x, .72, -1.86); g.add(hl); const tl = rbox(.3, .12, .05, .03, new THREE.MeshStandardMaterial({ color: '#d8342a', emissive: '#6a0a06', emissiveIntensity: .6 })); tl.position.set(x, .78, 1.86); g.add(tl); }
  const bump = rbox(1.74, .16, .2, .06, dark); bump.position.set(0, .38, -1.84); g.add(bump); const bump2 = bump.clone(); bump2.position.z = 1.84; g.add(bump2);
  const plate = rbox(.42, .12, .02, .01, M('#f4f1e8', .5)); plate.position.set(0, .5, 1.95); g.add(plate);
  // the fuel door: a hinged flap on the right rear quarter
  const hinge = new THREE.Group(); hinge.position.set(.865, .86, .95); g.add(hinge);
  const door = rbox(.02, .2, .2, .03, body); door.position.set(0, 0, .1); hinge.add(door);
  const ring = new THREE.Mesh(new THREE.CircleGeometry(.085, 24), dark); ring.rotation.y = Math.PI / 2; ring.position.set(.858, .86, 1.05); g.add(ring);
  const cap = cyl(.05, .05, .03, M('#1e1e22', .5), 16); cap.rotation.z = Math.PI / 2; cap.position.set(.86, .86, 1.05); g.add(cap);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.fuelDoor = hinge; g.FUEL_LOCAL = new THREE.Vector3(.87, .86, 1.05);
  return g;
}

export function buildStation(scene) {
  const K = {};
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(concrete(), [12, 12], { bump: .4 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 9), mat(asphalt(), [20, 2], { bump: .3 })); road.rotation.x = -Math.PI / 2; road.position.set(0, .005, 12); road.receiveShadow = true; scene.add(road);
  for (let x = -38; x < 40; x += 4) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2, .15), M('#f4f1e8', .6)); d.rotation.x = -Math.PI / 2; d.position.set(x, .01, 12); scene.add(d); }
  // forecourt markings: bay lines and arrows
  for (const x of [-4.6, -1.4, 1.4, 4.6]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.12, 7), M('#f4f1e8', .6)); l.rotation.x = -Math.PI / 2; l.position.set(x, .008, 0); scene.add(l); }
  const arrowTex = cv(256, 256, (g) => { g.fillStyle = '#f4f1e8'; g.beginPath(); g.moveTo(128, 20); g.lineTo(220, 130); g.lineTo(160, 130); g.lineTo(160, 236); g.lineTo(96, 236); g.lineTo(96, 130); g.lineTo(36, 130); g.closePath(); g.fill(); });
  for (const [x, z, r] of [[-3, 4.2, 0], [3, -4.2, Math.PI]]) { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: arrowTex, transparent: true, roughness: .7 })); a.rotation.set(-Math.PI / 2, 0, r); a.position.set(x, .009, z); scene.add(a); }
  // pump islands (two), with pumps; the hero pump at x = 0
  K.ISLANDS = [];
  for (const x of [0, -6.2]) {
    const isl = rbox(1.0, .18, 3.2, .05, M('#d8d0c0', .7)); isl.position.set(x, .09, 0); scene.add(isl);
    const edge = rbox(1.04, .06, 3.24, .03, M('#e8b23a', .5)); edge.position.set(x, .2, 0); scene.add(edge);
    const pump = new THREE.Group(); const pb = rbox(.7, 1.5, .45, .05, M('#f4f1e8', .45)); pb.position.y = .93; pump.add(pb);
    const top = rbox(.74, .3, .5, .05, M('#c23a2e', .45)); top.position.y = 1.83; pump.add(top);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.4, .22), new THREE.MeshStandardMaterial({ color: '#1a2a3a', emissive: '#3ad0ff', emissiveIntensity: .35 })); scr.position.set(0, 1.35, .231); pump.add(scr);
    const scr2 = scr.clone(); scr2.rotation.y = Math.PI; scr2.position.z = -.231; pump.add(scr2);
    for (const sx of [-.36, .36]) { const n = rbox(.06, .22, .1, .02, M('#1e1e22', .4)); n.position.set(sx, 1.05, 0); pump.add(n); const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[sx, 1.0, 0], [sx * 1.15, .6, .05], [sx * 1.08, .35, .1], [sx, .3, .1]].map(p => new THREE.Vector3(...p))), 20, .018, 6), M('#1e1e22', .6)); pump.add(hose); }
    pump.position.set(x, .18, 0); scene.add(pump);
    for (const z of [-1.4, 1.4]) { const bol = cyl(.08, .08, .9, M('#e8b23a', .5), 12); bol.position.set(x, .45, z); scene.add(bol); }
    K.ISLANDS.push(new THREE.Vector3(x, 0, 0));
  }
  // the canopy with the channel name on its fascia, lit underneath
  const can = new THREE.Group(); const roof = rbox(16, .5, 8, .06, M('#f4f1e8', .5)); roof.position.y = 4.6; can.add(roof);
  const fasciaT = cv(2048, 128, (g) => { g.fillStyle = '#c23a2e'; g.fillRect(0, 0, 2048, 128); g.fillStyle = '#ffffff'; g.font = '800 86px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOME CRAZY THINGZZ  ·  FUEL & SNACKS', 1024, 70); });
  const fas = new THREE.Mesh(new THREE.PlaneGeometry(16, .5), new THREE.MeshStandardMaterial({ map: fasciaT, roughness: .5, emissive: '#ffffff', emissiveMap: fasciaT, emissiveIntensity: .2 })); fas.position.set(0, 4.6, 4.01); can.add(fas);
  for (const [x, z] of [[-7, -3.6], [-7, 3.6], [6.5, -3.6], [6.5, 3.6]]) { const c2 = rbox(.35, 4.4, .35, .04, M('#d8d0c0', .5)); c2.position.set(x, 2.2, z); can.add(c2); }
  for (let i = 0; i < 6; i++) { const l = rbox(1.2, .04, .4, .02, new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e0', emissiveIntensity: 1.2 })); l.position.set(-6 + (i % 3) * 4, 4.33, (i < 3 ? -1.8 : 1.8)); can.add(l); }
  can.position.set(-2, 0, 0); can.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(can);
  // the shop behind: windows with snack posters, a door, a sign
  const shop = new THREE.Group(); const wall = rbox(14, 4, 6, .05, M('#f2e3c7', .8)); wall.position.set(0, 2, 0); shop.add(wall);
  const stripe = rbox(14.05, .5, 6.05, .02, M('#2456c8', .5)); stripe.position.set(0, 3.6, 0); shop.add(stripe);
  const posters = [['CHIPS', '#ffd84a', '#c23a2e'], ['SODA', '#2456c8', '#ffffff'], ['SNACKS!', '#c23a2e', '#ffffff'], ['ICE', '#9be0ff', '#2456c8'], ['COFFEE', '#6b4a2e', '#ffffff']];
  posters.forEach(([t, bg, fg], i) => { const tx = cv(256, 320, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 256, 320); g.fillStyle = fg; g.font = '800 54px Baloo2'; g.textAlign = 'center'; g.fillText(t, 128, 180); g.beginPath(); g.arc(128, 80, 40, 0, 7); g.fill(); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshStandardMaterial({ color: '#2a3a48', roughness: .1, metalness: .3 })); win.position.set(-5.5 + i * 2.4, 1.5, 3.01); shop.add(win);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.7, .9), new THREE.MeshStandardMaterial({ map: tx, roughness: .6 })); p.position.set(-5.5 + i * 2.4 + (i % 2 ? .3 : -.3), 1.4, 3.02); shop.add(p); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), M('#3a4a58', .2, .3)); door.position.set(6.4, 1.1, 3.02); shop.add(door);
  shop.position.set(-1, 0, -11); scene.add(shop);
  // forecourt dressing: an air pump, a bin, cones, a planter, a newspaper box, an ice chest, a price sign
  const put = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(o); return o; };
  const grp = (...ms) => { const g = new THREE.Group(); ms.forEach(m => g.add(m)); return g; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  put(grp(at(rbox(.5, 1.2, .4, .05, M('#2456c8', .5)), 0, .6, 0), at(rbox(.3, .2, .05, .02, M('#ffd84a', .5)), 0, .9, .21)), 5.6, -3.5, -.3);
  put(grp(at(cyl(.28, .25, .9, M('#3f8a5a', .6), 20), 0, .45, 0), at(cyl(.3, .3, .06, M('#1e1e22', .5), 20), 0, .93, 0)), 1.0, 2.0);
  for (const [x, z] of [[4.2, 3.8], [4.8, 4.2], [-4.2, -4.6]]) put(grp(at(new THREE.Mesh(new THREE.ConeGeometry(.18, .6, 16), M('#f07a2a', .5)), 0, .3, 0), at(cyl(.12, .12, .1, M('#f4f1e8', .5), 16), 0, .4, 0)), x, z);
  const planter = grp(at(rbox(2.2, .5, .6, .05, M('#b8683a', .7)), 0, .25, 0)); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.22 + h2(i, 1, 3) * .1, 1), M('#4e8a3a', .7)); b.position.set(-.9 + i * .22, .6 + h2(i, 2, 3) * .15, 0); planter.add(b); for (const c of ['#ff6a8a', '#ffd84a']) { const f = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), M(c, .6)); f.position.set(-.9 + i * .22 + .08, .78 + h2(i, 4, 3) * .1, .1); planter.add(f); } } put(planter, -1, -7.4);
  put(grp(at(rbox(.8, .7, .6, .05, M('#f4f1e8', .4)), 0, .35, 0), at(rbox(.82, .12, .62, .03, M('#2a7ad0', .4)), 0, .74, 0)), 3.6, -7.6);
  const priceT = cv(256, 512, (g) => { g.fillStyle = '#1e1e22'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#c23a2e'; g.fillRect(0, 0, 256, 90); g.fillStyle = '#fff'; g.font = '800 48px Baloo2'; g.textAlign = 'center'; g.fillText('FUEL', 128, 62); g.fillStyle = '#7be07b'; g.font = '800 70px Baloo2'; for (const [t, y] of [['3.19', 190], ['3.49', 300], ['3.89', 410]]) g.fillText(t, 128, y); });
  const ps = grp(at(rbox(.12, 3.2, .12, .02, M('#9aa1ab', .4, .8)), 0, 1.6, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ map: priceT, emissive: '#ffffff', emissiveMap: priceT, emissiveIntensity: .25 })), 0, 3.6, .07)); put(ps, 7.5, 5.5, -.4);
  // the near forecourt (it fills the bottom of the high shots): a tyre stack, an A-frame sign, a squeegee bucket, a puddle, a crate of oil cans, cones
  const tyres = new THREE.Group(); for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.3, .12, 10, 24), M('#1a1a1c', .9)); t.rotation.x = Math.PI / 2; t.position.y = .12 + i * .23; tyres.add(t); } put(tyres, -2.6, 7.2);
  const aT = cv(256, 320, (g) => { g.fillStyle = '#ffd84a'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#c23a2e'; g.font = '800 46px Baloo2'; g.textAlign = 'center'; g.fillText('SNACKS', 128, 110); g.fillText('INSIDE', 128, 170); g.font = '800 90px Baloo2'; g.fillText('→', 128, 270); });
  const af = new THREE.Group(); for (const sgn of [-1, 1]) { const b2 = new THREE.Mesh(new THREE.PlaneGeometry(.7, .9), new THREE.MeshStandardMaterial({ map: aT, roughness: .6, side: THREE.DoubleSide })); b2.position.set(0, .45, sgn * .15); b2.rotation.x = sgn * .3; af.add(b2); } put(af, 2.4, 6.6, -.4);
  put(grp(at(cyl(.2, .17, .32, M('#2456c8', .5), 16), 0, .16, 0), at(rbox(.04, .6, .04, .01, M('#9aa1ab', .4, .8)), .08, .45, 0), at(rbox(.3, .05, .05, .01, M('#1e1e22', .5)), .08, .76, 0)), 1.2, 5.2);
  const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: '#7f8a96', roughness: .02, metalness: .4 })); pud.rotation.x = -Math.PI / 2; pud.scale.set(.9, .5, 1); pud.position.set(-.6, .012, 8.2); scene.add(pud);
  const crate = grp(at(rbox(.7, .3, .5, .02, M('#9c6a3a', .7)), 0, .15, 0)); for (let i = 0; i < 6; i++) crate.add(at(cyl(.07, .07, .2, M(['#c23a2e', '#ffd84a', '#2456c8'][i % 3], .4, .3), 12), -.22 + (i % 3) * .22, .4, i < 3 ? -.1 : .1)); put(crate, 3.6, 8.4, .3);
  for (const [x, z] of [[-4, 8.8], [-1.2, 9.6], [5.2, 7.4]]) put(grp(at(new THREE.Mesh(new THREE.ConeGeometry(.18, .6, 16), M('#f07a2a', .5)), 0, .3, 0), at(cyl(.12, .12, .1, M('#f4f1e8', .5), 16), 0, .4, 0)), x, z);
  // skid marks round the hero island (they appear after the laps)
  const skT = cv(512, 512, (g) => { g.strokeStyle = 'rgba(20,20,22,.75)'; g.lineWidth = 14; for (const r of [.86, .92]) { g.beginPath(); g.ellipse(256, 256, 230 * r, 230 * r, 0, 0, 7); g.stroke(); } });
  K.skid = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 7.4), new THREE.MeshBasicMaterial({ map: skT, transparent: true, depthWrite: false })); K.skid.rotation.x = -Math.PI / 2; K.skid.position.set(0, .011, 0); K.skid.visible = false; scene.add(K.skid);
  // street side: houses and trees
  for (let i = 0; i < 7; i++) { const hcol = ['#e8c27a', '#c9693a', '#9cc8f0', '#e8d2b0', '#b8d08a', '#f4b8a8', '#d8b08a'][i];
    const house = grp(at(rbox(4, 3, 4, .05, M(hcol, .8)), 0, 1.5, 0), at(new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), M('#7a3a2a', .8)), 0, 3.8, 0)); house.children[1].rotation.y = Math.PI / 4;
    for (const sx of [-1, 1]) house.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.8, .8), M('#2a3a48', .1, .3)), sx, 1.8, 2.01));
    put(house, -21 + i * 7, 22 + h2(i, 3, 3) * 2); }
  for (let i = 0; i < 10; i++) { const t = grp(at(cyl(.15, .2, 2, M('#5a4030', .9), 8), 0, 1, 0), at(new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), M(i % 2 ? '#4e8a3a' : '#6f9a48', .8)), 0, 2.8, 0)); put(t, -24 + i * 5.3, 17.5); }
  for (let i = 0; i < 6; i++) { const t = grp(at(cyl(.15, .2, 2, M('#5a4030', .9), 8), 0, 1, 0), at(new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), M('#4e8a3a', .8)), 0, 3.1, 0)); put(t, (i % 2 ? 1 : -1) * (11 + i), -14 - i * 1.5); }
  // the car
  K.car = makeCar(); scene.add(K.car);
  return K;
}

// —— the cockpit rig (placed away from the forecourt): dashboard with the gauge, steering wheel, windscreen frame, seats ——
export function buildCockpit(scene, at) {
  const C = new THREE.Group(); C.position.copy(at); scene.add(C);
  const dashM = M('#2a2e34', .6), trim = M('#2fa39a', .35, .2);
  const dash = rbox(1.7, .32, .55, .12, dashM); dash.position.set(0, 1.0, -.5); C.add(dash);
  const top = rbox(1.72, .06, .6, .03, M('#1e2228', .7)); top.position.set(0, 1.17, -.55); C.add(top);
  const cluster = rbox(.5, .26, .12, .06, M('#15181c', .5)); cluster.position.set(-.38, 1.13, -.25); cluster.rotation.x = -.25; C.add(cluster);
  C.gauge = gaugeCanvas();
  const gface = new THREE.Mesh(new THREE.CircleGeometry(.1, 48), new THREE.MeshBasicMaterial({ map: C.gauge })); gface.position.set(-.28, 1.14, -.185); gface.rotation.x = -.25; C.add(gface);
  const spdT = cv(256, 256, (g) => { g.fillStyle = '#101418'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#e8f4ff'; g.lineWidth = 4; for (let i = 0; i <= 12; i++) { const a = Math.PI * (.75 + i / 12 * 1.5); g.beginPath(); g.moveTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.lineTo(128 + Math.cos(a) * 95, 128 + Math.sin(a) * 95); g.stroke(); } g.strokeStyle = '#ff3b30'; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(60, 170); g.stroke(); });
  const sface = new THREE.Mesh(new THREE.CircleGeometry(.1, 48), new THREE.MeshBasicMaterial({ map: spdT })); sface.position.set(-.5, 1.14, -.185); sface.rotation.x = -.25; C.add(sface);
  C.GAUGE = new THREE.Vector3(-.28, 1.14, -.18).add(at);
  const wheel = C.wheelMesh = new THREE.Mesh(new THREE.TorusGeometry(.19, .025, 12, 40), M('#1a1a1c', .5)); wheel.position.set(-.38, 1.02, -.05); wheel.rotation.x = -.45; C.add(wheel); C.wheel = wheel;
  const hub = C.hub = cyl(.05, .05, .06, M('#2fa39a', .4), 16); hub.rotation.x = Math.PI / 2 - .45; hub.position.copy(wheel.position); C.add(hub);
  // the windscreen frame: pillars and the roof edge, a rear-view mirror with an air freshener
  for (const x of [-.82, .82]) { const p = rbox(.08, .9, .08, .02, trim); p.position.set(x, 1.5, -.7); p.rotation.x = .45; p.rotation.z = x < 0 ? .1 : -.1; C.add(p); }
  const roof = rbox(1.8, .08, .5, .02, trim); roof.position.set(0, 1.92, -.45); C.add(roof);
  const mir = rbox(.24, .07, .04, .02, M('#1e1e22', .4)); mir.position.set(0, 1.78, -.5); C.add(mir);
  const fresh = new THREE.Mesh(new THREE.ConeGeometry(.04, .09, 3), M('#7be07b', .6)); fresh.position.set(.04, 1.66, -.5); fresh.rotation.z = Math.PI; C.add(fresh); C.fresh = fresh;
  // a snack bag and a map on the dash, fuzzy dice, a phone holder
  const bag = rbox(.16, .08, .22, .04, M('#ffd84a', .5)); bag.position.set(.5, 1.22, -.6); bag.rotation.y = .4; C.add(bag);
  const map = rbox(.3, .01, .2, .002, M('#9cc8f0', .7)); map.position.set(.15, 1.205, -.62); map.rotation.y = -.2; C.add(map);
  for (const [x, c] of [[-.03, '#ff6a8a'], [.03, '#ffffff']]) { const d = rbox(.035, .035, .035, .008, M(c, .5)); d.position.set(x, 1.6, -.5); d.rotation.set(.4, .6, .2); C.add(d); }
  // seats behind the cast (tops visible), the view through the windscreen is the forecourt itself
  for (const x of [-.4, .4]) { const s = rbox(.5, .7, .14, .08, M('#3a3e44', .8)); s.position.set(x, 1.25, .62); C.add(s); const h = rbox(.3, .2, .12, .06, M('#3a3e44', .8)); h.position.set(x, 1.72, .62); C.add(h); }
  C.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return C;
}
