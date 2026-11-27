// The set: a doll's-house hotel with its front wall off. Ground floor: the lobby x[-5,5] z[-4,0]. First floor (y 3.6): room 7, the
// honeymoon suite x[-5,1], and room 8 x[1,5]. Behind it the brick back of the next building (what the "sea view" window looks at);
// in front, a pavement and a street where the tour bus pulls in. Late-afternoon sun from the front right.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, woodPlanks, rock, glow } from './px.js';
import { mats, mat, mesh, box } from './kit.js';
import { sky, particles, flick } from './fx.js';
import { makeChar, SPX } from './chars.js';
import { T, P, VO, you as youPath, cust as custPath, goat as goatPath, boss as bossPath, TOURISTS, GUIDE, FLASHES, walkStep, keysLeft } from './story.js';
import { HUD } from './ui.js';
import { clamp, seg, ss, lerp, track } from '/core/lib.js';

// —— pixel textures ——
function carpet(w, h) {
  const p = new PX(w, h), R = ramp(['#2a0a10', '#44121a', '#5e1a24', '#782430'], .4), G = ramp(['#5a3a10', '#9a7020', '#d0a640'], .3);
  p.fill((x, y) => { const m = (x + y) % 12, d = (x - y + 96) % 12; if ((m === 0 || d === 0) && x % 2 === 0) return G(.45, x, y); if (x % 48 < 2 || y % 48 < 2) return G(.3, x, y); return R(.45 + (h2(x, y, 4) - .5) * .3, x, y); });
  return p.done();
}
function stripes(w, h, a, b, s = 7) {   // striped wallpaper with a dark dado band at the bottom
  const p = new PX(w, h), A = ramp(a, .4), Bc = ramp(b, .4);
  p.fill((x, y) => { if (y > h - 22) return Bc(.35 + (y === h - 22 ? .4 : 0) + (h2(x, y, s) - .5) * .2, x, y); const st = (x % 12) < 6; return A(.55 + (st ? .12 : -.05) + (fbm(x * .1, y * .1, s) - .5) * .2, x, y); });
  return p.done();
}
function bricks(w, h, s = 3) {
  const p = new PX(w, h), R = ramp(['#2a1410', '#4a2218', '#6a3222', '#8a442c', '#a65a3a'], .4), M = ramp(['#3a342c', '#544c42'], .5);
  p.fill((x, y) => { const row = y / 4 | 0, off = row % 2 ? 4 : 0, bx = ((x + off) / 8) | 0; if (y % 4 === 3 || (x + off) % 8 === 7) return M(.5, x, y); return R(.5 + (h2(bx, row, s) - .5) * .5 + (fbm(x * .2, y * .2, s) - .5) * .2, x, y); });
  return p.done();
}
function seascape() {   // the painting: sea, sky, a sun, a sailboat, a gull — in the lobby since 1974
  const p = new PX(36, 24), Sk = ramp(['#f0a060', '#f8c888', '#9cc8e8', '#6aa8dc'], .4), Se = ramp(['#0e3a6a', '#1c5a96', '#3a7ec0', '#7ab8e8'], .4);
  p.fill((x, y) => { if (y < 13) return Sk(.95 - y / 13 * .7 + (h2(x, y, 2) - .5) * .1, x, y); const v = .3 + (y - 13) / 11 * .4 + (Math.sin(x * .9 + y * 2.1) > .7 ? .35 : 0); return Se(1 - v, x, y); });
  p.ellipse(25, 11, 3.2, 3.2, [255, 220, 140]);
  for (let i = 0; i < 4; i++) p.set(23 + i, 14 + (i % 2), [255, 230, 170]);
  p.rect(9, 9, 1, 5, [60, 40, 30]); p.poly([[10, 5], [10, 13], [15, 13]], [250, 248, 240]); p.rect(6, 13, 9, 2, [120, 50, 40]);
  p.set(17, 5, [40, 40, 50]); p.set(18, 4, [40, 40, 50]); p.set(19, 5, [40, 40, 50]); p.set(20, 4, [40, 40, 50]); p.set(21, 5, [40, 40, 50]);
  return p.done();
}
function heartShape(s) {
  const sh = new THREE.Shape(); sh.moveTo(0, -s * .9);
  sh.bezierCurveTo(s * .6, -s * .35, s * 1.05, s * .05, s * .95, s * .45); sh.bezierCurveTo(s * .85, s * .9, s * .2, s * 1.0, 0, s * .55);
  sh.bezierCurveTo(-s * .2, s * 1.0, -s * .85, s * .9, -s * .95, s * .45); sh.bezierCurveTo(-s * 1.05, s * .05, -s * .6, -s * .35, 0, -s * .9);
  return sh;
}
function signTex(text, fg, bg, w = 64, h = 20) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `bold ${Math.round(h * .6)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 1);
  return texOf(c);
}

export function buildHotel() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2(new THREE.Color('#e8c49a'), .004);
  const SK = sky({ top: '#4a78b8', mid: '#9ab8d8', hor: '#f4c890', moonDir: new THREE.Vector3(.7, .25, .4), moonCol: '#fff0c8', moonI: .6 }); scene.add(SK.mesh);

  // —— lights ——
  const SUN = new THREE.Vector3(.75, .9, .85).normalize();
  const key = new THREE.DirectionalLight('#ffd8a8', 2.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 120 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  key.target.position.set(0, 2, -2); key.position.copy(key.target.position).addScaledVector(SUN, 50); scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#c8d4f0', '#5a3a28', 1.15); scene.add(hemi);
  const fill = new THREE.PointLight('#ffe8cc', 1.0, 8, 2); scene.add(fill);

  // —— outside: pavement, street, the brick building behind, a street lamp ——
  const pave = mat(rock(96, 96, { seed: 8, cols: ['#4a4640', '#625d55', '#7a746a', '#928b80', '#a8a094'] }));
  scene.add(mesh(new THREE.BoxGeometry(60, .2, 4).translate(2, -.1, 1.9), pave, { cast: false }));
  const road = mat(rock(96, 96, { seed: 9, cols: ['#1e1e22', '#2a2a30', '#36363e', '#42424a'] }));
  scene.add(mesh(new THREE.BoxGeometry(60, .2, 10).translate(2, -.16, 8.9), road, { cast: false }));
  for (let x = -26; x < 30; x += 3) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.4, .02, .14), new THREE.MeshStandardMaterial({ color: '#e8d8a0' })); l.position.set(x, -.05, 8.6); scene.add(l); }
  const brick = mat(bricks(96, 96));
  scene.add(mesh(new THREE.BoxGeometry(30, 14, .3).translate(0, 7, -4.55), brick));
  for (const [x, w, hgt] of [[-10.5, 9, 9], [11.5, 9, 10.5]]) scene.add(mesh(new THREE.BoxGeometry(w, hgt, 6).translate(x, hgt / 2, -1.6), brick));   // neighbours left and right
  const lampPost = box(.12, 3.4, .12, new THREE.MeshStandardMaterial({ color: '#1e2228', roughness: .5, metalness: .6 })); lampPost.position.set(6.2, 0, 1.0); scene.add(lampPost);

  // —— the hotel shell ——
  const fCarpet = mat(carpet(96, 96), { rough: .95 });
  scene.add(mesh(new THREE.BoxGeometry(10, .2, 4).translate(0, -.1, -2), fCarpet, { cast: false }));
  const wLobby = mat(stripes(96, 96, ['#7a6a4a', '#a8946a', '#cbb688', '#e6d4aa'], ['#2a160c', '#462614', '#663a1e', '#87532c']));
  const wRoom7 = mat(stripes(96, 96, ['#8a4a5e', '#b8708a', '#dc9cb2', '#f4c4d2'], ['#5a2a3a', '#7a3a4e', '#9a4e64', '#b86a80'], 9));
  const wRoom8 = mat(stripes(96, 96, ['#5a6a7a', '#7a8a9a', '#9aaabb', '#bccad8'], ['#2a2a34', '#3a3a46', '#4c4c5a', '#60606e'], 11));
  const trimM = new THREE.MeshStandardMaterial({ color: '#c8a050', roughness: .35, metalness: .75 });
  const wood = MM.plankDark;
  function wallX(x0, x1, z, y0, h, m, holes = []) {   // a wall along x at depth z, with rectangular holes [xa, xb, ya, yb]
    const add = (a, b, c, d) => { if (b - a < .01 || d - c < .01) return; scene.add(mesh(new THREE.BoxGeometry(b - a, d - c, .3).translate((a + b) / 2, (c + d) / 2, z), m)); };
    if (!holes.length) return add(x0, x1, y0, y0 + h);
    let xa = x0; for (const [a, b, c, d] of holes) { add(xa, a, y0, y0 + h); add(a, b, y0, c); add(a, b, d, y0 + h); xa = b; } add(xa, x1, y0, y0 + h);
  }
  function wallZ(z0, z1, x, y0, h, m, holes = []) {
    const add = (a, b, c, d) => { if (b - a < .01 || d - c < .01) return; scene.add(mesh(new THREE.BoxGeometry(.3, d - c, b - a).translate(x, (c + d) / 2, (a + b) / 2), m)); };
    if (!holes.length) return add(z0, z1, y0, y0 + h);
    let za = z0; for (const [a, b, c, d] of holes) { add(za, a, y0, y0 + h); add(a, b, y0, c); add(a, b, d, y0 + h); za = b; } add(za, z1, y0, y0 + h);
  }
  const WIN = [P.window[0] - .7, P.window[0] + .7, 1.1, 2.5];
  wallX(-5.15, 5.15, -4.15, 0, 3.4, wLobby, [[P.lift[0] - .6, P.lift[0] + .6, 0, 2.3], WIN]);
  wallZ(-4.15, 0, -5.15, 0, 3.4, wLobby, [[-2.9, -1.7, 0, 2.3]]);
  wallZ(-4.15, 0, 5.15, 0, 3.4, wLobby, [[-1.9, -.4, 0, 2.6]]);
  // the slab between the floors, with a gold cornice on the cut edge
  scene.add(mesh(new THREE.BoxGeometry(10.6, .24, 4.3).translate(0, 3.52, -2), wood));
  const corn = new THREE.Mesh(new THREE.BoxGeometry(10.6, .1, .08), trimM); corn.position.set(0, 3.42, .14); scene.add(corn);
  // first floor
  const fPink = mat(carpet(96, 96)); fPink.color.set('#ffc8d8');
  scene.add(mesh(new THREE.BoxGeometry(6, .02, 4).translate(-2, 3.65, -2), fPink, { cast: false }));
  scene.add(mesh(new THREE.BoxGeometry(4, .02, 4).translate(3, 3.65, -2), MM.plank, { cast: false }));
  const WIN7 = [-4.5, -3.3, 4.6, 5.8];
  wallX(-5.15, 1, -4.15, 3.64, 3.0, wRoom7, [WIN7]); wallX(1, 5.15, -4.15, 3.64, 3.0, wRoom8, [[2.6, 3.6, 4.6, 5.8]]);
  wallZ(-4.15, 0, -5.15, 3.64, 3.0, wRoom7); wallZ(-4.15, 0, 5.15, 3.64, 3.0, wRoom8); wallZ(-4.15, 0, 1, 3.64, 3.0, wRoom7, [[-3.6, -2.6, 3.64, 5.84]]);
  scene.add(mesh(new THREE.BoxGeometry(10.8, .3, 4.5).translate(0, 6.79, -2), MM.roof2));
  const corn2 = new THREE.Mesh(new THREE.BoxGeometry(10.6, .1, .08), trimM); corn2.position.set(0, 3.68, .14); scene.add(corn2);
  // the HOTEL sign on the roof: bulbs that chase
  const signM = new THREE.MeshStandardMaterial({ map: signTex('HOTEL', '#fff2c0', '#3a0a10', 80, 22), emissive: '#ffffff', emissiveMap: signTex('HOTEL', '#ffd070', '#000000', 80, 22), emissiveIntensity: 1.4 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, .12), signM); sign.position.set(0, 7.55, -2.6); scene.add(sign);
  const signG = glow('#ffc870', 3.2, .5); signG.position.set(0, 7.55, -2.4); scene.add(signG);

  // —— lobby props ——
  // the reception desk: dark wood, gold trim, a bell, the guest book (the Cat sleeps on it), a phone, a lamp
  const desk = box(2.7, .8, .7, wood); desk.position.set(P.desk[0], 0, P.desk[1]); scene.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.85, .07, .82), new THREE.MeshStandardMaterial({ color: '#3a1e10', roughness: .4 })); top.position.set(P.desk[0], .83, P.desk[1]); top.castShadow = top.receiveShadow = true; scene.add(top);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.72, .06, .02), trimM); trim.position.set(P.desk[0], .68, P.desk[1] + .36); scene.add(trim);
  const bell = new THREE.Group(); bell.position.set(.95, .87, -2.0); scene.add(bell);
  const bellDome = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), trimM); bell.add(bellDome);
  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .025, 12), new THREE.MeshStandardMaterial({ color: '#1a1a1e' })); bell.add(bellBase);
  const bellKnob = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .05, 6), trimM); bellKnob.position.y = .1; bell.add(bellKnob);
  const book = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .36), new THREE.MeshStandardMaterial({ color: '#6a1420', roughness: .7 })); book.position.set(-.7, .89, -2.1); book.castShadow = true; scene.add(book);
  const phone = new THREE.Group(); phone.position.set(-.2, .87, -2.2); scene.add(phone);
  const phM = new THREE.MeshStandardMaterial({ color: '#b01c24', roughness: .4 });
  const phBase = new THREE.Mesh(new THREE.BoxGeometry(.26, .1, .2).translate(0, .05, 0), phM); phBase.castShadow = true; phone.add(phBase);
  const phHand = new THREE.Mesh(new THREE.BoxGeometry(.3, .05, .07), phM); phHand.position.set(0, .13, 0); phone.add(phHand);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(.16, .16, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#8a5a1a', emissive: '#ffb060', emissiveIntensity: 1.0, side: THREE.DoubleSide })); lampShade.position.set(.35, 1.22, -2.35); scene.add(lampShade);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(.015, .03, .34), trimM); lampStem.position.set(.35, 1.03, -2.35); scene.add(lampStem);
  const lampL = new THREE.PointLight('#ffb868', 2.5, 4, 1.8); lampL.position.set(.35, 1.15, -1.9); scene.add(lampL);
  // the key rack: eight hooks, two keys left
  const rack = box(.82, .58, .05, wood); rack.position.set(P.rack[0], 1.45, P.rack[1] + .02); scene.add(rack);
  const keys = [];
  for (let i = 0; i < 8; i++) { const x = P.rack[0] - .3 + (i % 4) * .2, y = 1.88 - Math.floor(i / 4) * .26; const hk = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .06).rotateX(Math.PI / 2), trimM); hk.position.set(x, y, P.rack[1] + .08); scene.add(hk);
    if (i >= 6) { const k = new THREE.Group(); const kb = new THREE.Mesh(new THREE.BoxGeometry(.03, .11, .02), trimM); kb.position.y = -.06; const tag = new THREE.Mesh(new THREE.BoxGeometry(.06, .07, .015), new THREE.MeshStandardMaterial({ color: '#8a1420' })); tag.position.y = -.15; k.add(kb, tag); k.position.set(x, y, P.rack[1] + .1); scene.add(k); keys.push(k); } }
  const numM = new THREE.MeshBasicMaterial({ map: signTex('KEYS', '#e8d0a0', '#2a160c', 48, 14) }); const keyLbl = new THREE.Mesh(new THREE.PlaneGeometry(.5, .14), numM); keyLbl.position.set(P.rack[0], 2.12, P.rack[1] + .08); scene.add(keyLbl);
  // the "sea view" window: frame, curtains, the brick wall a hand's width behind the glass
  const wf = new THREE.Group(); wf.position.set(P.window[0], 0, -4.0); scene.add(wf);
  for (const [w, h, x, y] of [[1.5, .1, 0, 2.52], [1.5, .1, 0, 1.08], [.1, 1.5, -.72, 1.8], [.1, 1.5, .72, 1.8], [.05, 1.4, 0, 1.8], [1.4, .05, 0, 1.8]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .08), new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: .6 })); b.position.set(x, y, 0); b.castShadow = true; wf.add(b); }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .22), new THREE.MeshStandardMaterial({ color: '#f0e8d8' })); sill.position.set(0, 1.06, .08); wf.add(sill);
  const velP = new PX(24, 32), VR = ramp(['#3a0610', '#5a0c18', '#7e1424', '#a01e30', '#c03040'], .3); velP.fill((x, y) => VR(.5 + .38 * Math.sin(x * .8) + (h2(x, y, 5) - .5) * .1 - (y > 29 ? .3 : 0), x, y));
  const velvet = new THREE.MeshStandardMaterial({ map: texOf(velP.done()), roughness: .85, side: THREE.DoubleSide });
  const curtains = [-1, 1].map(s => { const c = new THREE.Mesh(new THREE.BoxGeometry(.76, 1.7, .04), velvet); c.castShadow = true; scene.add(c); return { c, s }; });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 2.0).rotateZ(Math.PI / 2), trimM); rod.position.set(P.window[0], 2.68, -3.9); scene.add(rod);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .9), new THREE.MeshStandardMaterial({ color: '#d8b050' })); cord.position.set(P.window[0] + .82, 2.15, -3.88); scene.add(cord);
  // the seascape painting (it moves: off the wall, onto the window)
  const paint = new THREE.Group(); scene.add(paint);
  const canvasM = new THREE.MeshLambertMaterial({ map: texOf(seascape()) });
  const pc = new THREE.Mesh(new THREE.PlaneGeometry(1.08, .72), canvasM); pc.position.z = .03; paint.add(pc);
  for (const [w, h, x, y] of [[1.24, .08, 0, .4], [1.24, .08, 0, -.4], [.08, .8, -.58, 0], [.08, .8, .58, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .06), trimM); b.position.set(x, y, .02); b.castShadow = true; paint.add(b); }
  const picLight = new THREE.SpotLight('#ffe0b0', 0, 3, .8, .6, 1.5); scene.add(picLight, picLight.target);
  // the lift: brass frame, two sliding doors, a floor dial with a needle; light inside
  const liftG = new THREE.Group(); liftG.position.set(P.lift[0], 0, -4.0); scene.add(liftG);
  for (const [w, h, x, y] of [[1.4, .12, 0, 2.36], [.1, 2.4, -.65, 1.2], [.1, 2.4, .65, 1.2]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .14), trimM); b.position.set(x, y, .06); liftG.add(b); }
  const liftIn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, .05), new THREE.MeshStandardMaterial({ color: '#4a2a14', emissive: '#ffd090', emissiveIntensity: .25 })); liftIn.position.set(0, 1.15, -.55); liftG.add(liftIn);
  const doorM = new THREE.MeshStandardMaterial({ color: '#b8904a', roughness: .3, metalness: .7 });
  const liftDoors = [-1, 1].map(s => { const d = new THREE.Mesh(new THREE.BoxGeometry(.6, 2.28, .05), doorM); d.position.set(s * .3, 1.14, 0); d.castShadow = true; liftG.add(d); return { d, s }; });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(.2, 16, 0, Math.PI), trimM); dial.position.set(0, 2.52, .14); liftG.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.015, .18, .01).translate(0, .09, 0), new THREE.MeshBasicMaterial({ color: '#1a1010' })); needle.position.set(0, 2.52, .16); liftG.add(needle);
  const liftL = new THREE.PointLight('#ffd8a0', 0, 4, 1.8); liftL.position.set(P.lift[0], 1.8, -3.5); scene.add(liftL);
  // the manager's office door (left wall)
  const offDoor = new THREE.Group(); offDoor.position.set(-5.0, 0, -2.9); scene.add(offDoor);
  const od = box(.06, 2.28, 1.2, wood); od.position.set(0, 0, .6); offDoor.add(od);
  const odSign = new THREE.Mesh(new THREE.PlaneGeometry(.5, .14), new THREE.MeshBasicMaterial({ map: signTex('MANAGER', '#f0e0b0', '#2a160c', 60, 14) })); odSign.position.set(.05, 1.8, .6); odSign.rotation.y = Math.PI / 2; offDoor.add(odSign);
  // the revolving door (right wall): brass drum, four glass wings
  const rev = new THREE.Group(); rev.position.set(5.15, 0, -1.15); scene.add(rev);
  const glassM = new THREE.MeshStandardMaterial({ color: '#cfe4f0', transparent: true, opacity: .35, roughness: .1, metalness: .2, depthWrite: false });
  const wings = new THREE.Group(); wings.position.y = 1.2; rev.add(wings);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(.7, 2.2, .03).translate(.35, 0, 0), glassM); w.rotation.y = i * Math.PI / 2; wings.add(w); const fr = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, .04).translate(.35, 1.1, 0), trimM); fr.rotation.y = i * Math.PI / 2; wings.add(fr); }
  const drumTop = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .14, 20), trimM); drumTop.position.set(0, 2.45, 0); rev.add(drumTop);
  // chandelier, luggage cart, side table with red flowers, a rug
  const chand = new THREE.Group(); chand.position.set(-.6, 2.9, -1.9); scene.add(chand);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 6, 20).rotateX(Math.PI / 2), trimM); chand.add(ring);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5), trimM); chain.position.y = .25; chand.add(chain);
  const bulbs = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, g = glow('#ffd8a0', .32, 1.0); g.position.set(Math.cos(a) * .42, .06, Math.sin(a) * .42); chand.add(g); bulbs.push(g); }
  const chandL = new THREE.PointLight('#ffd2a0', 7, 9, 1.6); chandL.position.set(-.6, 2.7, -1.6); chandL.castShadow = true; chandL.shadow.mapSize.set(1024, 1024); chandL.shadow.bias = -.003; scene.add(chandL);
  const cart = new THREE.Group(); cart.position.set(3.9, 0, -3.2); scene.add(cart);
  const cbase = box(1.0, .1, .55, trimM); cbase.position.y = .15; cart.add(cbase);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.7), trimM); p.position.set(s * .48, 1.0, 0); cart.add(p); }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(.48, .025, 6, 16, Math.PI), trimM); arch.position.y = 1.85; cart.add(arch);
  for (const [w, h, x, y, c] of [[.7, .45, -.1, .25, '#3a5a8a'], [.5, .35, .2, .7, '#8a3a2a'], [.45, .3, -.15, 1.05, '#d8c088']]) { const s = box(w, h, .4, new THREE.MeshStandardMaterial({ color: c, roughness: .7 })); s.position.set(x, y, 0); cart.add(s); }
  const stbl = box(.6, .8, .5, wood); stbl.position.set(-4.4, 0, -1.0); scene.add(stbl);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .3, 10).translate(0, .15, 0), new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: .3 })); vase.position.set(-4.4, .8, -1.0); scene.add(vase);
  for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), new THREE.MeshStandardMaterial({ color: i % 2 ? '#d8202c' : '#f04050', roughness: .6 })); f.position.set(-4.4 + Math.cos(i) * .14, 1.22 + h2(i, 3) * .14, -1.0 + Math.sin(i) * .14); scene.add(f); }
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshStandardMaterial({ color: '#c8a050', roughness: .95, map: texOf(carpet(64, 36)) })); rug.rotation.x = -Math.PI / 2; rug.position.set(2.4, .012, -1.1); rug.receiveShadow = true; scene.add(rug);

  // —— room 7: the honeymoon suite ——
  const F1 = P.F1 + .25;
  const bedM = new THREE.MeshStandardMaterial({ color: '#f07aa0', roughness: .8 }), sheet = new THREE.MeshStandardMaterial({ color: '#fff0f4', roughness: .9 });
  const bed = box(2.2, .45, 1.7, bedM); bed.position.set(-2.4, F1, -2.95); scene.add(bed);
  const duvet = box(2.1, .12, 1.3, sheet); duvet.position.set(-2.4, F1 + .45, -2.8); scene.add(duvet);
  const heartGeo = new THREE.ExtrudeGeometry(heartShape(.75), { depth: .12, bevelEnabled: false });
  const headboard = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({ color: '#d8305a', roughness: .5 })); headboard.position.set(-2.4, F1 + 1.15, -3.98); headboard.castShadow = true; scene.add(headboard);
  for (let i = 0; i < 22; i++) { const pe = new THREE.Mesh(new THREE.PlaneGeometry(.07, .05), new THREE.MeshStandardMaterial({ color: '#c8102c', side: THREE.DoubleSide })); pe.rotation.set(-Math.PI / 2, 0, h2(i, 1) * 6); pe.position.set(-2.4 + (h2(i, 2) - .5) * 1.8, F1 + .58, -2.8 + (h2(i, 3) - .5) * 1.1); scene.add(pe); }
  const pouf = box(1.2, .42, .5, new THREE.MeshStandardMaterial({ color: '#c84a74', roughness: .8 })); pouf.position.set(-.4, F1, -1.7); scene.add(pouf);
  const curtain7 = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.7, .04), new THREE.MeshStandardMaterial({ color: '#f4a4c0', roughness: .85, side: THREE.DoubleSide })); curtain7.position.set(-4.15, F1 + 1.55, -3.9); curtain7.castShadow = true; scene.add(curtain7);
  const dnd = new THREE.Mesh(new THREE.PlaneGeometry(.24, .34), new THREE.MeshLambertMaterial({ map: signTex('DND', '#c0202c', '#f4f0e6', 24, 34), side: THREE.DoubleSide })); dnd.position.set(-3.45, F1 + 1.0, -3.86); scene.add(dnd);
  const lamp7 = new THREE.PointLight('#ff90b8', 4.5, 6, 1.8); lamp7.position.set(-1.0, F1 + 1.8, -2.4); scene.add(lamp7);
  const lamp7G = glow('#ffa0c0', .5, .9); lamp7G.position.set(-.5, F1 + 1.3, -3.7); scene.add(lamp7G);
  const nightT = box(.4, .5, .4, wood); nightT.position.set(-.6, F1, -3.7); scene.add(nightT);
  // room 8: a plain room, a single bed, a lamp; someone asleep under the blanket
  const bed8 = box(1.0, .4, 1.9, new THREE.MeshStandardMaterial({ color: '#5a6a8a' })); bed8.position.set(3.4, F1, -2.95); scene.add(bed8);
  const lump = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .9, 4, 8).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d8dce8' })); lump.position.set(3.4, F1 + .55, -2.8); lump.castShadow = true; scene.add(lump);
  const lamp8 = new THREE.PointLight('#ffd8a0', 1.6, 4, 1.8); lamp8.position.set(2.2, F1 + 1.3, -3.4); scene.add(lamp8);

  // —— the tour bus ——
  const bus = new THREE.Group(); scene.add(bus);
  const busM = new THREE.MeshStandardMaterial({ color: '#f0b428', roughness: .5 }), winM = new THREE.MeshStandardMaterial({ color: '#203040', roughness: .2, metalness: .4, emissive: '#405a70', emissiveIntensity: .3 });
  const bb = box(6.6, 2.5, 2.4, busM); bb.position.y = .35; bus.add(bb);
  const bw = new THREE.Mesh(new THREE.BoxGeometry(6.0, .8, 2.42), winM); bw.position.set(.1, 2.05, 0); bus.add(bw);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(6.62, .18, 2.43), new THREE.MeshStandardMaterial({ color: '#c42232' })); stripe.position.y = 1.2; bus.add(stripe);
  for (const x of [-2.2, 2.2]) for (const z of [-1.22, 1.22]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .2, 14).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#141418' })); w.position.set(x, .42, z); bus.add(w); }
  const busSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .36), new THREE.MeshBasicMaterial({ map: signTex('TOURS', '#3a1a00', '#fff2c0', 60, 14) })); busSign.position.set(-.6, 1.55, 1.215); bus.add(busSign);

  // —— characters ——
  const hero = makeChar('hero'), custC = makeChar('cust'), mgr = makeChar('boss'), goatC = makeChar('goat', 1.0, .8), cat = makeChar('cat'), couple = makeChar('couple');
  scene.add(hero.root, custC.root, mgr.root, goatC.root, cat.root, couple.root);
  const tourists = TOURISTS.map(tr => { const c = makeChar('tourist'); scene.add(c.root); return { ...tr, c }; });
  const guide = makeChar('tourist'); scene.add(guide.root);
  const flashL = new THREE.PointLight('#f4f8ff', 0, 7, 1.6); scene.add(flashL);
  const flashG = glow('#ffffff', .9, 1.4); scene.add(flashG);
  const redL = new THREE.PointLight('#ff2030', 0, 12, 1.4); redL.position.set(-.5, 2.6, .5); scene.add(redL);
  const sparkle = glow('#fff0a0', .4, 1.4); scene.add(sparkle);

  // —— helpers ——
  const pick = (t, f) => (Math.floor(t * f) % 2 ? 1 : 0);
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const vo = id => VO.find(o => o.id === id);
  const talking = (id, k = 1) => { const v = vo(id); return t => t >= v.t && t < v.t + k; };
  const firedK = t => ss(seg(t, T.fired, T.fired + .4)) * (1 - ss(seg(t, T.hired - .35, T.hired)));
  const DESK = { p: [1.1, 2.25, 4.8], l: [.72, .95, -2.3] };
  const CAM = {
    desk: { p: track([[0, DESK.p], [5.9, DESK.p], [6.6, [1.0, 2.2, 3.5]], [7.0, [.6, 2.25, 3.7]], [7.8, [-.4, 2.3, 4.0]], [8.6, [.4, 2.3, 4.0]], [9.6, DESK.p], [13, DESK.p]]),
      l: track([[0, DESK.l], [5.9, DESK.l], [6.6, [.85, 1.5, -3.6]], [7.0, [.4, 1.35, -3.0]], [7.8, [-.7, 1.2, -2.6]], [8.6, [.4, 1.2, -2.6]], [9.6, DESK.l], [13, DESK.l]]), fov: () => 42 },
    pull: { p: track([[13, DESK.p], [15.0, [.4, 4.6, 21]], [15.5, [.4, 4.65, 20.6]]]), l: track([[13, DESK.l], [15.0, [.2, 3.6, -2]], [15.5, [.2, 3.65, -2]]]), fov: t => lerp(42, 38, ss(seg(t, 13, 15))) },
    room7: { p: track([[15.5, [.4, 4.65, 20.6]], [17.0, [-1.6, 5.8, 6.6]], [22.5, [-1.7, 5.75, 6.1]]]), l: track([[15.5, [.2, 3.65, -2]], [17.0, [-1.55, 4.3, -2.6]], [22.5, [-1.6, 4.3, -2.7]]]), fov: t => lerp(38, 42, ss(seg(t, 15.5, 17))) },
    tour: { p: track([[22.5, [-1.7, 5.75, 6.1]], [24.0, [3.0, 3.4, 10.5]], [26.5, [2.4, 3.0, 8.4]], [28.5, [1.2, 2.5, 5.6]], [31, [.4, 2.4, 5.2]]]), l: track([[22.5, [-1.6, 4.3, -2.7]], [24.0, [2.4, 1.6, -1.4]], [26.5, [2.0, 1.3, -1.8]], [28.5, [.4, 1.15, -2.4]], [31, [-.4, 1.1, -2.5]]]), fov: () => 42 },
    fired: { p: track([[31, [.4, 2.4, 5.2]], [32, [-.5, 2.35, 4.9]], [38.5, [-.6, 2.3, 4.6]]]), l: track([[31, [-.4, 1.1, -2.5]], [32, [-.95, 1.1, -2.5]], [38.5, [-.95, 1.1, -2.5]]]), fov: () => 42 },
    loop: { p: () => DESK.p, l: () => DESK.l, fov: () => 42 },
  };

  function place(ch, g, y = 0) { ch.root.position.set(g.x, y, g.z); }
  function update(t, shot, cam, post, renderer) {
    const C = CAM[shot.id]; cam.position.set(...C.p(t)); cam.fov = C.fov(t); cam.updateProjectionMatrix(); cam.lookAt(...C.l(t)); post.dof.aper = shot.id === 'pull' ? 320 : 260;
    const fk = firedK(t), wide = shot.id === 'pull' || (shot.id === 'room7' && t < 16.4) || (shot.id === 'tour' && t < 23.6);
    // light: warm afternoon; red and dim under the GAME OVER card
    key.intensity = 2.6 * (1 - fk * .8); hemi.intensity = 1.15 * (1 - fk * .6);
    chandL.intensity = 7 * flick(t, 1) * .97 * (1 - fk); bulbs.forEach(b => b.material.opacity = 1 - fk); redL.intensity = 30 * fk;
    scene.fog.density = wide ? .002 : .004;
    SK.u.k.value = 1 - fk * .6;
    // sign chase
    signM.emissiveIntensity = 1.3 + .3 * Math.sin(t * 6);
    // the bell rings: it bounces
    const rings = [0, .5, 1.0, 1.5, T.back, T.back + .5], rk = Math.max(0, ...rings.map(r => t >= r && t < r + .25 ? 1 - (t - r) / .25 : 0));
    bell.position.y = .87 - rk * .02; bellKnob.position.y = .1 - rk * .03;
    // the phone handset lifts when you answer
    const ph = t >= 12.9 && t < 20.6; phHand.visible = !ph; phone.rotation.z = !ph && t >= T.ring && t < 12.9 ? .06 * Math.sin(t * 60) : 0;
    // curtains: closed until the cord, then open
    const co = ss(seg(t, T.wall - .1, T.wall + .35)) * (t < T.hired ? 1 : 0);
    curtains.forEach(({ c, s }) => { c.position.set(P.window[0] + s * (.38 + co * .55), 1.82, -3.88); c.scale.x = 1 - co * .55; });
    // the painting
    let pp;
    if (t < T.grab) pp = [P.painting[0], 1.9, P.painting[1] + .05, 0];
    else if (t < T.hang) { const g = youPath(t), f = g.dx < 0 ? -1 : 1; pp = [g.x + f * .05, 1.55, g.z + .32, 0]; }
    else if (t < T.hired) { const u = ss(seg(t, T.hang, T.hang + .2)); pp = [P.window[0], lerp(1.6, 1.82, u), P.window[1] + .16, 0]; }
    else pp = [P.painting[0], 1.9, P.painting[1] + .05, 0];
    paint.position.set(pp[0], pp[1], pp[2]);
    picLight.position.set(P.window[0], 2.7, -3.2); picLight.target.position.set(P.window[0], 1.8, -3.9); picLight.intensity = t >= T.hang && t < T.hired ? 3 : 0;
    // keys on the rack
    keys.forEach((k, i) => k.visible = i < keysLeft(t) && !(t >= T.keyUp && i === 0 && t < T.hired));
    // the lift: doors open at T.lift, close behind the goat
    const lo = ss(seg(t, T.lift, T.lift + .35)) * (1 - ss(seg(t, 30.8, 31.3)));
    liftDoors.forEach(({ d, s }) => d.position.x = s * (.3 + lo * .55)); liftL.intensity = 3 * lo;
    needle.rotation.z = t < 28.6 ? -1.2 : lerp(-1.2, 1.2, 1 - ss(seg(t, 28.6, T.lift)));
    // office door swings for the Manager
    offDoor.rotation.y = -1.3 * ss(seg(t, 30.4, 30.7)) * (1 - ss(seg(t, 31.6, 32.0)));
    // revolving door
    const spin = (ss(seg(t, T.door, 28.0)) * 9 + ss(seg(t, 38.9, 40.5)) * 3 + ss(seg(t, 12.2, 13.5)) * 1.5);
    wings.rotation.y = spin * Math.PI * 2 / 4 * 2;
    // the bus pulls in at T.bus
    const bu = ss(seg(t, T.bus - .3, T.bus + 1.0)); bus.position.set(lerp(20, 8.6, bu), 0, 3.2); bus.visible = t > T.bus - .4 && t < T.hired;

    // —— the Customer ——
    { const g = custPath(t); place(custC, g); custC.root.visible = g.x < 5.0;
      let f = 'stand';
      if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
      else if (t < 2.0 || (t >= T.back && t < T.back + 1.0)) { const ph = t >= T.back ? t - T.back : t; f = (ph % .5) < .12 ? 'bellDn' : (ph % .5) < .3 ? 'bellUp' : 'bellUpQ'; if (t >= T.c3 - .1) f = 'talk'; }
      else if (t >= T.c3) f = pick(t, 6) ? 'talk' : 'demand';
      else if (talking('c1', 1.8)(t)) f = pick(t, 6) ? 'talk' : 'demand';
      else if (t >= T.wall && t < T.hang) f = 'cross';
      else if (talking('c2', 1.3)(t)) f = pick(t, 5) ? 'crossTalk' : 'smug';
      else if (t >= T.hang) f = 'smug';
      else f = 'demand';
      if (t < 1.75 && talking('c1', 1.8)(t) && (t % .5) >= .12) f = pick(t, 6) ? 'bellUp' : 'bellUpQ';
      custC.frame(f); custC.face(cam, g.moving ? g.dx < 0 : true); }
    // —— you ——
    { const g = youPath(t); place(hero, g); hero.root.visible = g.x < 5.0;
      let f = 'stand', flip = false;
      const y1 = vo('y1'), y2 = vo('y2');
      if (g.moving) { const s = walkStep(t, true); f = t >= T.hired ? ['b0', 'b1', 'b2', 'b3'][s] : t > T.grab && t < T.hang ? ['c0', 'c1', 'c2', 'c3'][s] : ['w0', 'w1', 'w2', 'w3'][s]; flip = g.dx < 0; }
      else if (t < T.cord) f = t < 2.4 ? 'smile' : talking('n1', 2.2)(t) ? 'smile' : (Math.floor(t * 8) % 23 === 0 ? 'blink' : 'smile');
      else if (t < T.walkP) f = t < T.wall ? 'pull' : t < T.wall + .5 ? 'pullShock' : 'worry';
      else if (t >= T.grab && t < T.grab + .4) { f = 'carry'; flip = true; }
      else if (t >= T.hang && t < 8.9) f = 'carry';
      else if (t >= y1.t && t < y1.t + 1.0) f = 'talkBig';
      else if (t < T.ring) f = t > T.xp ? 'smile' : 'worry';
      else if (t < 12.9) f = 'worry';
      else if (t < 20.6) f = t >= y2.t && t < y2.t + 1.1 ? 'phoneTalk' : t > 13.1 && t < 14.2 ? 'phoneShock' : 'phone';
      else if (t < T.door) f = t >= T.bus ? 'shock' : 'worry';
      else if (t < T.keyUp) f = t < T.door + .8 ? (pick(t, 6) ? 'shock' : 'shock1') : 'worry';
      else if (t < T.crunch) f = t < T.lift + .5 ? 'key' : 'keyShock';
      else if (t < T.boss) f = pick(t, 6) ? 'shock' : 'shock1';
      else if (t < T.hired) { f = t < 32.6 ? 'worry' : 'sadCap'; flip = t >= T.boss && t < 32.6; }
      hero.frame(f); hero.face(cam, flip); }
    // —— the goat ——
    { const inRoom = t < T.bus, g = goatPath(t);
      goatC.root.visible = inRoom ? shot.id !== 'desk' : t >= T.lift + .25;
      let f = 'stand', flip = false;
      if (inRoom) {
        goatC.root.position.set(-3.1, F1 + .57, -2.95); flip = true;
        if (t >= T.meh1 && t < T.meh1 + .5 || t >= T.meh2 && t < T.meh2 + .5) f = 'meh';
        else if (t >= T.eatSign) f = pick(t, 5) ? 'sign' : 'sign1';
        else f = pick(t, 4) ? 'cur0' : 'cur1';
      } else if (t < T.hired) {
        place(goatC, g, .86 * ss(seg(t, 29.95, 30.3))); flip = false;
        if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
        else if (t >= T.crunch && t < T.crunch + 1.6) f = pick(t, 5) ? 'key' : 'key1';
        else if (t >= T.crunch) f = pick(t, 3) ? 'chew0' : 'stand';
        else f = 'stand';
      } else {   // the new receptionist: on a stool behind the desk, in your cap
        goatC.root.position.set(P.you[0] + .1, .55, P.you[1]); goatC.root.visible = true;
        f = t >= T.c3 && t < T.c3 + .5 ? 'capMeh' : pick(t, 3) ? 'capChew' : 'cap';
      }
      goatC.frame(f); goatC.face(cam, flip); }
    dnd.visible = t < T.eatSign;
    curtain7.scale.y = 1 - .25 * ss(seg(t, T.up, T.meh2)); curtain7.position.y = F1 + 1.55 + .21 * ss(seg(t, T.up, T.meh2));
    // —— the newlyweds ——
    couple.root.position.set(-.4, F1, -1.55); couple.root.visible = t >= 13 && t < T.bus + 1.6;
    couple.frame(t >= 13.3 && t < 16.9 || t >= 21.0 ? 'shock' : 'sit'); couple.face(cam, true);
    // —— the Manager ——
    { const g = bossPath(t); place(mgr, g); mgr.root.visible = t >= 30.6 && (t < T.fired + .5 || t >= T.hired);
      let f = 'stand';
      if (g.moving) f = ['w0', 'w1', 'w2', 'w3'][walkStep(t, true)];
      else if (t >= T.hired) f = t >= vo('m2').t && t < vo('m2').t + 1.0 ? (pick(t, 6) ? 'nodTalk' : 'nod') : 'nod';
      else if (talking('m1', 1.6)(t)) f = pick(t, 6) ? 'talk' : 'point';
      else if (t > 33.2) f = 'point';
      mgr.frame(f); mgr.face(cam, false); }
    // —— the Cat, asleep on the guest book ——
    cat.root.position.set(-.7, .91, -2.12); cat.root.visible = true;
    cat.frame(t < 2.0 || (t >= T.back && t < T.back + 1) ? (pick(t, 4) ? 'tail' : 'sleep') : t >= T.crunch && t < T.crunch + 1.5 ? 'look' : (Math.floor(t * 1.2) % 5 === 0 ? 'tail' : 'sleep')); cat.face(cam, false);
    // —— the tour group ——
    const crowdOn = t >= T.door && t < T.fired + .5;
    const DOORP = [5.4, -1.15];
    tourists.forEach(tr => {
      const u = seg(t, tr.a, tr.a + 1.1); tr.c.root.visible = crowdOn && t >= tr.a;
      if (!tr.c.root.visible) return;
      tr.c.root.position.set(lerp(DOORP[0], tr.x, u), 0, lerp(DOORP[1], tr.z, u));
      const fl = FLASHES.find(f => f.who === tr.i && t >= f.t - .15 && t < f.t + .3);
      const fr = u < 1 ? `${tr.v}w${walkStep(t + tr.i * .1, true)}` : fl ? `${tr.v}p` : `${tr.v}s`;
      tr.c.frame(fr); tr.c.face(cam, true);
    });
    { const u = seg(t, GUIDE.a, GUIDE.a + .9); guide.root.visible = crowdOn; guide.root.position.set(lerp(DOORP[0], GUIDE.x, u), 0, lerp(DOORP[1], GUIDE.z, u));
      guide.frame(u < 1 ? `gw${walkStep(t, true)}` : talking('g1', 1.3)(t) ? (pick(t, 6) ? 'gt' : 'gs') : 'gs'); guide.face(cam, true); }
    // camera flashes
    const fl = FLASHES.find(f => t >= f.t && t < f.t + .09);
    if (fl && crowdOn) { const tr = tourists[fl.who], p = tr.c.root.position; flashL.position.set(p.x + .2, 1.6, p.z + .3); flashL.intensity = 26; flashG.position.set(p.x + .25, 1.45, p.z + .2); flashG.material.opacity = 1; }
    else { flashL.intensity = 0; flashG.material.opacity = 0; }
    // the last key sparkles
    const sk = t >= T.keyUp && t < T.crunch ? .7 + .3 * Math.sin(t * 20) : 0; sparkle.material.opacity = sk; sparkle.position.set(P.you[0] + .3, 1.95, P.you[1] + .25);

    // —— focus subject ——
    let subj;
    if (shot.id === 'desk' || shot.id === 'loop') { const g = youPath(t); subj = t > 6.4 && t < 9.4 ? v3(g.x, 1.4, g.z) : v3(.9, 1.2, -2.2); }
    else if (shot.id === 'pull') subj = v3(0, 2.6, -2.2);
    else if (shot.id === 'room7') subj = t < 16.4 ? v3(-1.5, 3.6, -2.2) : v3(-1.9, F1 + .8, -2.4);
    else if (shot.id === 'tour') subj = t < 24 ? v3(2.5, 1.2, -1.2) : t < 28.5 ? v3(2.2, 1.2, -1.4) : v3(-.4, 1.2, -2.6);
    else subj = v3(-1.0, 1.2, -2.6);
    post.dof.focus = cam.position.distanceTo(subj); post.dof.maxCoc = 22;
    fill.position.copy(subj).add(v3(.4, .8, 2.4)); fill.intensity = 1.0 * (1 - fk);

    // —— HUD anchors (screen coordinates for the overlay) ——
    const proj = (x, y, z) => { const v = v3(x, y, z).project(cam); return [(v.x * .5 + .5) * 1080, (.5 - v.y * .5) * 1920]; };
    HUD.cust = proj(custPath(t).x, 2.05, custPath(t).z);
    HUD.you = proj(youPath(t).x, 2.1, youPath(t).z);
    HUD.rack = proj(P.rack[0], 2.3, P.rack[1]);
    HUD.goat = proj(goatPath(t).x, 2.1, goatPath(t).z);
    return subj;
  }
  return { scene, update };
}
