// workshop.js — the set for "Glue Time": a sunny home workshop corner (pegboard wall with painted tool outlines and real tools, a window,
// shelves of jars and paint cans, a thick workbench with a vise, a cubby shelf unit with one EMPTY cubby (the target), clutter everywhere),
// and the hero prop: a yellow tape measure whose hook slides on slotted rivets (K.makeTape()).
// Units: metres. Ground y = 0; the camera mostly looks toward -z. Bench top at DY.
import * as THREE from 'three';
import { paint, mat, wood, fbm, h2, rbox, cyl } from './set.js';
import { clamp, lerp } from '/core/lib.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const SM = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const cvTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// —— surfaces ——
function pegboard() {   // warm hardboard with a grid of holes and a little grain
  const W = 256, s = 33; return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, n = fbm(u * 5, v * 5, s, 4, 5); let c = mix3(hex('#c8945a'), hex('#d9a86c'), n);
    const cx = (u * 8) % 1 - .5, cy = (v * 8) % 1 - .5, d = Math.hypot(cx, cy); if (d < .12) c = c.map(k => k * .28); else if (d < .16) c = c.map(k => k * .8);
    return { c, r: .85, h: d < .14 ? 0 : .6 + n * .2 }; });
}
function brick() {   // painted brick (warm white) for the side walls
  const W = 256, s = 34; return paint(W, W, (x, y) => {
    const u = x / W, v = y / W, row = Math.floor(v * 8), off = row % 2 ? .125 : 0, bx = (u + off) * 4 % 1, by = v * 8 % 1, n = fbm(u * 9, v * 9, s, 4, 9);
    const mortar = bx < .04 || by < .08; let c = mortar ? hex('#b9ab98') : mix3(hex('#efe3cf'), hex('#f7efe0'), n).map(k => k * (.94 + h2(Math.floor((u + off) * 4), row, 5) * .08));
    return { c, r: .9, h: mortar ? 0 : .7 + n * .2 }; });
}
function concreteFloor() { const W = 256, s = 35; return paint(W, W, (x, y) => { const u = x / W, v = y / W, n = fbm(u * 6, v * 6, s, 5, 6), f = h2(x, y, s);
  let c = mix3(hex('#8f8a82'), hex('#a9a399'), n).map(k => k * (.94 + f * .1)); const dust = fbm(u * 3 + 4, v * 3, s + 2, 3, 3); if (dust > .62) c = mix3(c, hex('#d9b98a'), (dust - .62) * 2);
  return { c, r: .9, h: n }; }); }

// —— the tape measure: case + blade along +x + a hook that slides by `slide` (−1 pushed in … +1 pulled out) ——
// real hook travel is ±0.8 mm around its mid-point; `gain` exaggerates it for the demo.
function bladeTex() {   // inch ruler blade: yellow, black ticks, red numbers every inch; 1 px = 1/128 in, 24 in long
  return cvTex(4096, 96, (g, w, h) => {
    g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h);
    const px = w / 32;   // px per inch (32 in of blade on the texture)
    g.fillStyle = '#1a1a1e';
    // zero at the RIGHT edge (the hook end); each inch mark sits 1/16 in short of its true distance: the hook's thickness makes it up
    for (let i = 0; i <= 32 * 16; i++) { const x = w - (i * px / 16 - (px / 16) * 1); const L = i % 16 === 0 ? 46 : i % 8 === 0 ? 34 : i % 4 === 0 ? 26 : i % 2 === 0 ? 18 : 12; g.fillRect(x, 0, 3, L); g.fillRect(x, h - L, 3, L); }
    g.font = '800 40px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i < 32; i++) { g.fillStyle = i % 12 === 0 ? '#ffffff' : '#c8231a'; if (i % 12 === 0) { g.fillStyle = '#c8231a'; g.fillRect(w - (i * px - px / 16) - 60, 26, 60, 44); g.fillStyle = '#fff'; } g.fillText(String(i), w - (i * px - px / 16) - 30, h / 2 + 2); }
  });
}
let _blade = null;
export function makeTape(o = {}) {
  _blade = _blade || bladeTex();
  const g = new THREE.Group(), yel = SM(o.col ?? '#ffcf1f', .38), blk = SM('#1e1e22', .7), steel = SM('#c9ced6', .25, 1), dark = SM('#4a4e56', .35, 1);
  const cs = rbox(.072, .072, .036, .016, yel); cs.position.set(-.036, .036, 0); g.add(cs);
  const bump = rbox(.078, .03, .04, .012, blk); bump.position.set(-.034, .015, 0); g.add(bump);   // the rubber foot
  const lab = new THREE.Mesh(new THREE.CircleGeometry(.024, 32), new THREE.MeshStandardMaterial({ map: cvTex(256, 256, (c) => { c.fillStyle = '#1e1e22'; c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fill(); c.fillStyle = '#ffcf1f'; c.font = '800 64px Baloo2'; c.textAlign = 'center'; c.fillText('GUS', 128, 120); c.font = '800 34px Baloo2'; c.fillText('25 FT', 128, 170); }), roughness: .5 }));
  lab.position.set(-.036, .04, .0185); g.add(lab);
  const lock = rbox(.014, .02, .012, .004, SM('#c8231a', .5)); lock.position.set(-.018, .074, 0); g.add(lock);
  const mouth = rbox(.012, .012, .03, .003, blk); mouth.position.set(.002, .01, 0); g.add(mouth);
  // the blade: a strip (width 25 mm, curved a little), length set by setLen()
  const bladeGeo = new THREE.PlaneGeometry(1, .025, 1, 6); const pp = bladeGeo.attributes.position; for (let i = 0; i < pp.count; i++) { const z = pp.getY(i); pp.setXYZ(i, pp.getX(i) + .5, .0035 * (1 - (z / .0125) ** 2), z); } bladeGeo.computeVertexNormals();
  const bm = new THREE.MeshStandardMaterial({ map: _blade.clone(), roughness: .35, metalness: .15, side: THREE.DoubleSide }); bm.map.needsUpdate = true; bm.map.wrapS = THREE.ClampToEdgeWrapping;
  const blade = new THREE.Mesh(bladeGeo, bm); blade.position.set(.006, .006, 0); blade.castShadow = blade.receiveShadow = true; g.add(blade);
  // the hook: tab riding on top of the blade end (two rivets in slots) and a lip bent down
  const hook = new THREE.Group(); g.add(hook);
  const tab = rbox(.018, .0012, .024, .0005, steel); tab.position.set(-.009, .0042, 0); hook.add(tab);
  const lip = rbox(.0016, .014, .026, .0005, steel); lip.position.set(.0008, -.0005, 0); hook.add(lip);
  const rivM = SM('#e8ecf2', .2, 1); g.rivets = [];
  for (const z of [-.006, .006]) { const r = cyl(.0018, .0018, .0012, rivM, 16); r.position.set(-.011, .0052, z); hook.add(r); }
  // the slots in the tab (dark ovals seen around the rivets when it slides)
  for (const z of [-.006, .006]) { const s = new THREE.Mesh(new THREE.CircleGeometry(.0024, 20), SM('#2a2c30', .5)); s.scale.set(1.6, 1, 1); s.rotation.x = -Math.PI / 2; s.position.set(-.011, .00485, z); hook.add(s); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.blade = blade; g.hook = hook; g.len = .2; g.slide = 0; g.gain = 1; g.glue = null;
  const glueM = new THREE.MeshStandardMaterial({ color: '#eef6ff', roughness: .05, transparent: true, opacity: .75 });
  g.setGlue = on => { if (on && !g.glue) { const b = new THREE.Mesh(new THREE.SphereGeometry(.007, 16, 12), glueM); b.scale.set(1.6, .7, 1.4); g.glue = b; hook.add(b); b.position.set(-.004, .0055, .003); } if (g.glue) g.glue.visible = on; };
  g.set = (len = g.len, slide = g.slide) => {   // blade length out of the case (m), hook slide
    g.len = len; g.slide = slide;
    blade.scale.x = len; const rep = len / (32 * .0254); bm.map.repeat.set(rep, 1); bm.map.offset.set(1 - rep, 0);
    const end = .006 + len, d = .0008 * g.gain * slide;
    hook.position.set(end + d, .006, 0);
    // the tab's slots: the rivets stay fixed in the blade, so they move by −d relative to the tab
    hook.children.filter(m => m.geometry?.type === 'CylinderGeometry').forEach(r => r.position.x = -.011 - d);
  };
  g.set(o.len ?? .2, 0);
  return g;
}

// —— the set ——
export function buildWorkshop(scene) {
  const K = {}, DY = .9; K.DY = DY;
  const M = K.M = {
    peg: mat(pegboard(), [6, 3], { bump: .4 }), brick: mat(brick(), [3, 2], { bump: .5 }), floor: mat(concreteFloor(), [4, 4], { bump: .3 }),
    top: mat(wood({ planks: 5, cols: ['#a8723e', '#b98048', '#c99056', '#d6a066'], seed: 21 }), [1, 1], { bump: .5 }),
    ply: mat(wood({ planks: 3, cols: ['#d9b07a', '#e2bc88', '#cfa46c', '#e8c494'], seed: 22 }), [1, 1], { bump: .3 }),
    leg: SM('#6a4429', .7), black: SM('#1e1e22', .4), red: SM('#c8231a', .45), steel: SM('#c9ced6', .3, 1), white: SM('#f4f1e8', .5),
  };
  const R = (w, h, d, r, c, rough = .6, metal = 0) => rbox(w, h, d, r, typeof c === 'string' ? SM(c, rough, metal) : c);
  const put = (m, x, y, z, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.y = ry; m.rotation.z = rz; m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(m); return m; };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.floor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), M.brick); wall.position.set(0, 2.5, -1.72); wall.receiveShadow = true; scene.add(wall);
  // —— the pegboard (x −1.5 … 1.5, y 1.0 … 2.35) with painted tool outlines and the tools on hooks ——
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.35), M.peg); pb.position.set(0, 1.68, -1.69); pb.receiveShadow = true; scene.add(pb);
  for (const [w, h, x, y] of [[3.08, .05, 0, 2.375], [3.08, .05, 0, .985], [.05, 1.4, -1.53, 1.68], [.05, 1.4, 1.53, 1.68]]) put(R(w, h, .04, .01, M.leg), x, y, -1.68);
  const outline = cvTex(2048, 920, (g, w, h) => {   // white "shadow board" outlines, one of them EMPTY with a "?" (the missing tape)
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 9; g.lineJoin = 'round';
    g.fillStyle = 'rgba(255,255,255,.18)';
    const sh = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.stroke(); };
    sh([[1640, 140], [1760, 140], [1760, 260], [1640, 260]]); g.fillStyle = '#fff'; g.font = '800 90px Baloo2'; g.textAlign = 'center'; g.fillText('?', 1700, 235);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.font = '800 54px Baloo2'; g.fillStyle = '#fff'; g.fillText('TAPE', 1700, 320);
  });
  const ol = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.35), new THREE.MeshBasicMaterial({ map: outline, transparent: true, depthWrite: false })); ol.position.set(0, 1.68, -1.685); scene.add(ol);
  const peg = (x, y) => { const p = cyl(.003, .003, .04, M.steel, 8); p.rotation.x = Math.PI / 2; put(p, x, y, -1.67); };
  // tools: a hammer, a saw, wrenches (graded), screwdrivers, pliers, a spirit level, clamps, a coil of rope, scissors
  const hammer = new THREE.Group(); { const hd = R(.11, .03, .03, .006, M.steel); hd.position.y = .14; const hd2 = R(.03, .035, .028, .004, M.black); hd2.position.set(.05, .14, 0); const hn = R(.025, .26, .018, .008, '#b07c46'); hn.position.y = 0; const gr = R(.03, .1, .022, .01, '#c8231a'); gr.position.y = -.08; hammer.add(hd, hd2, hn, gr); }
  put(hammer, -1.3, 1.95, -1.65, 0, .1); peg(-1.3, 2.12);
  const saw = new THREE.Group(); { const bl = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.42, .03), new THREE.Vector2(.42, .07), new THREE.Vector2(0, .12)])), SM('#d8dde4', .25, 1)); const hd = R(.1, .12, .025, .02, '#2456c8'); hd.position.set(-.04, .06, 0); saw.add(bl, hd); }
  put(saw, -1.05, 1.55, -1.665, 0, -.1); peg(-1.0, 1.7);
  for (let i = 0; i < 6; i++) { const L = .12 + i * .025; const wr = new THREE.Group(); const sh = R(.016, L, .006, .003, M.steel); const e1 = new THREE.Mesh(new THREE.TorusGeometry(.016 + i * .002, .005, 8, 20, 4.6), M.steel); e1.position.y = L / 2; e1.rotation.z = -.8; const e2 = new THREE.Mesh(new THREE.TorusGeometry(.014 + i * .002, .005, 8, 20), M.steel); e2.position.y = -L / 2; wr.add(sh, e1, e2); put(wr, -.62 + i * .07, 2.0 - L / 2, -1.665); }
  ['#c8231a', '#2456c8', '#f2c335', '#3f8a5a', '#1e1e22', '#e8762e'].forEach((c, i) => { const sd = new THREE.Group(); const hd = R(.025, .08, .025, .008, c, .4); hd.position.y = .04; const sh = cyl(.003, .003, .1, M.steel, 8); sh.position.y = -.05; sd.add(hd, sh); put(sd, -.55 + i * .06, 1.55, -1.66); });
  const level = R(.6, .045, .025, .006, '#f2c335', .4); put(level, .1, 2.22, -1.66); const vial = R(.06, .018, .01, .006, SM('#7be07b', .1)); put(vial, .1, 2.22, -1.645);
  for (const [x, c] of [[.55, '#c8231a'], [.7, '#2456c8']]) { const cl = new THREE.Group(); const b = R(.03, .2, .02, .005, M.steel); const j1 = R(.09, .025, .025, .006, c); j1.position.set(.04, .09, 0); const j2 = R(.09, .025, .025, .006, c); j2.position.set(.04, -.05, 0); cl.add(b, j1, j2); put(cl, x, 1.75, -1.65); }
  const rope = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 10, 32), SM('#d9b07a', .9)); rope.scale.set(1, 1.1, .6); put(rope, 1.0, 1.85, -1.64);
  const pl = new THREE.Group(); { for (const s of [-1, 1]) { const a = R(.018, .16, .012, .006, '#c8231a', .5); a.position.x = s * .012; a.rotation.z = s * .12; pl.add(a); } const jw = R(.03, .05, .014, .004, M.steel); jw.position.y = .1; pl.add(jw); } put(pl, .35, 1.55, -1.65);
  // the spot where Gus's tape should hang: an empty peg under the "?" outline
  peg(1.1, 2.18);
  // a shelf above the pegboard: jars of screws, paint cans, a radio, a plant
  put(R(2.6, .03, .24, .006, M.leg), 0, 2.48, -1.6);
  for (let i = 0; i < 7; i++) { const j = new THREE.Group(); const gl = cyl(.045, .045, .11, new THREE.MeshStandardMaterial({ color: '#e8f4ff', roughness: .05, transparent: true, opacity: .35 }), 20); gl.position.y = .055; const lid = cyl(.047, .047, .02, SM(['#c8231a', '#2456c8', '#f2c335', '#3f8a5a'][i % 4], .4), 20); lid.position.y = .12; const fill = cyl(.04, .04, .07, SM(['#b9bec6', '#d9a050', '#8a8f98'][i % 3], .5, .6), 16); fill.position.y = .036; j.add(gl, lid, fill); put(j, -1.2 + i * .12, 2.495, -1.58); }
  for (const [x, c, h] of [[-.25, '#2456c8', .14], [-.08, '#e8762e', .12], [.07, '#7be07b', .14]]) { const can = new THREE.Group(); const b = cyl(.06, .06, h, SM(c, .4, .3), 24); b.position.y = h / 2; const drip = cyl(.061, .061, .03, SM('#f4f1e8', .6), 24); drip.position.y = h - .02; can.add(b, drip); put(can, x, 2.495, -1.58); }
  const radio = new THREE.Group(); { const b = R(.26, .15, .1, .02, '#c8231a', .4); b.position.y = .075; const sp = new THREE.Mesh(new THREE.CircleGeometry(.045, 24), SM('#1e1e22', .8)); sp.position.set(-.06, .075, .051); const dial = R(.08, .03, .01, .005, '#f4f1e8'); dial.position.set(.06, .1, .051); const ant = cyl(.003, .003, .25, M.steel, 6); ant.position.set(.1, .26, 0); ant.rotation.z = -.4; radio.add(b, sp, dial, ant); }
  put(radio, .42, 2.495, -1.57, -.15);
  const plant = new THREE.Group(); { const pot = cyl(.06, .045, .1, SM('#c9693a', .8), 20); pot.position.y = .05; plant.add(pot); const lm = SM('#4e8a3a', .7); for (let i = 0; i < 14; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), lm); lf.scale.set(.5, 2.2, .25); const a = i / 14 * Math.PI * 2; lf.position.set(Math.cos(a) * .05, .17 + h2(i, 3, 9) * .08, Math.sin(a) * .05); lf.rotation.set(Math.sin(a) * .8, a, Math.cos(a) * .8); plant.add(lf); } }
  put(plant, 1.05, 2.495, -1.58);
  // the channel sign over the shelf, and a window on the right with the sun coming in
  const sign = cvTex(1024, 256, (g, w, h) => { g.fillStyle = '#1f4d32'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd84a'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28); g.fillStyle = '#ffd84a'; g.font = '800 100px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOME CRAZY THINGZZ', w / 2, h / 2 + 6); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .275), new THREE.MeshStandardMaterial({ map: sign, roughness: .6 })); sg.position.set(-.35, 2.86, -1.69); scene.add(sg);
  const wc = cvTex(256, 320, (g) => { const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#8fc0ee'); gr.addColorStop(1, '#e6f2fb'); g.fillStyle = gr; g.fillRect(0, 0, 256, 320); g.fillStyle = '#6f9a48'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(30 + i * 7, 250 + Math.sin(i) * 20, 40, 0, 7); g.fill(); } g.fillStyle = '#fff'; for (const [x, y, r] of [[60, 60, 24], [92, 52, 30], [190, 90, 20]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.0), new THREE.MeshBasicMaterial({ map: wc, color: new THREE.Color(1.25, 1.25, 1.25) })); win.position.set(2.05, 1.75, -1.69); scene.add(win);
  for (const [w, h, x, y] of [[.9, .06, 2.05, 2.28], [.9, .06, 2.05, 1.22], [.06, 1.1, 1.62, 1.75], [.06, 1.1, 2.48, 1.75], [.8, .03, 2.05, 1.75], [.03, 1.0, 2.05, 1.75]]) put(R(w, h, .05, .008, M.white), x, y, -1.67);
  // string lights along the top
  const bulbM = ['#ffd84a', '#ff8a6a', '#9be0ff', '#7be07b'].map(c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.6) }));
  const wire = []; for (let i = 0; i <= 44; i++) { const x = -2.2 + i * .1; wire.push(new THREE.Vector3(x, 3.1 - .07 * Math.abs(Math.sin(i * Math.PI / 9)), -1.66)); }
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 120, .003, 4), M.black));
  wire.forEach((p, i) => { if (i % 2) return; const b = new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), bulbM[(i / 2) % 4]); b.position.copy(p).add(new THREE.Vector3(0, -.03, .005)); scene.add(b); });

  // —— the workbench (x −1.1 … 1.1, z −.45 … .3), a vise, sawdust, offcuts ——
  const top = R(2.2, .07, .75, .012, M.top); put(top, 0, DY - .035, -.075);
  for (const [x, z] of [[-1.02, .22], [1.02, .22], [-1.02, -.38], [1.02, -.38]]) put(R(.08, DY - .07, .08, .01, M.leg), x, (DY - .07) / 2, z);
  put(R(2.0, .05, .6, .01, M.ply), 0, .22, -.08);   // lower shelf
  const apron = cvTex(2048, 160, (g, w, h) => { g.fillStyle = '#8a5a32'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,22,10,.35)'; g.lineWidth = 3; for (let y = 10; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x * .012 + y) * 3); g.stroke(); }
    const tags = [['#ffd84a', '#1f4d32', 'MEASURE TWICE'], ['#ff8fa8', '#7a1630', 'CUT ONCE'], ['#4ad0ff', '#123a5a', 'GUS ★ BENCH'], ['#7be07b', '#1f4d32', 'NO GLUE!'], ['#f2f2ee', '#c8231a', 'NANA WAS RIGHT'], ['#e8a33a', '#3a2008', '1/16"']];
    g.font = '800 46px Baloo2'; g.textBaseline = 'middle'; tags.forEach(([bg, fg, tx], i) => { const tw = g.measureText(tx).width + 40, x = 170 + i * 340 - tw / 2; g.save(); g.translate(x + tw / 2, 80); g.rotate(((i % 3) - 1) * .05); g.fillStyle = bg; g.fillRect(-tw / 2, -34, tw, 68); g.fillStyle = fg; g.textAlign = 'center'; g.fillText(tx, 0, 4); g.restore(); });
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#c8231a', '#2456c8', '#ffd84a', '#3f8a5a'][i % 4]; g.beginPath(); g.arc(20 + i * 79, i % 2 ? 14 : 146, 7, 0, 7); g.fill(); } });
  const ap = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .16), new THREE.MeshStandardMaterial({ map: apron, roughness: .6 })); ap.position.set(0, DY - .13, .3); ap.receiveShadow = true; scene.add(ap);
  put(R(2.2, .16, .02, .005, M.leg), 0, DY - .13, .289);
  // a vise on the right front corner
  const vise = new THREE.Group(); { const b = R(.16, .08, .14, .01, '#2456c8', .4, .3); b.position.y = .04; const j = R(.18, .06, .03, .006, M.steel); j.position.set(0, .09, .06); const sc = cyl(.008, .008, .2, M.steel, 10); sc.rotation.x = Math.PI / 2; sc.position.set(0, .05, .15); const hd = cyl(.005, .005, .14, M.steel, 8); hd.rotation.z = Math.PI / 2; hd.position.set(0, .05, .25); vise.add(b, j, sc, hd); }
  put(vise, .9, DY, .12);
  // sawdust piles and curls, offcuts, pencils, screws, a coffee mug (channel logo), a glue bottle, a cookie plate (the bet)
  const dustM = SM('#e7c690', 1);
  for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.05 + h2(i, 1, 8) * .04, 12, 8), dustM); d.scale.set(1, .12, .8); put(d, -.9 + h2(i, 2, 8) * 1.8, DY + .002, -.35 + h2(i, 3, 8) * .6); }
  for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.012, .003, 6, 14, 4), SM('#e2b878', .8)); c.rotation.set(h2(i, 1, 4) * 3, h2(i, 2, 4) * 3, 0); put(c, -1 + h2(i, 3, 4) * 2, DY + .008, -.4 + h2(i, 4, 4) * .65); }
  [[-.62, -.3, .4, '#d6a066', .3], [.62, -.32, -.2, '#c99056', .35], [.28, .12, .7, '#e2bc88', .22]].forEach(([x, z, r, c, L]) => put(R(L, .02, .07, .004, c, .8), x, DY + .01, z, r));
  [[.05, .2, .3, '#f2c335'], [.12, .18, -.4, '#3f8a5a']].forEach(([x, z, r, c]) => { const p = cyl(.004, .004, .15, SM(c, .5), 8); p.rotation.z = Math.PI / 2; put(p, x, DY + .004, z, r, Math.PI / 2); });
  for (let i = 0; i < 10; i++) { const s = cyl(.002, .001, .03, M.steel, 6); s.rotation.z = Math.PI / 2; put(s, .55 + h2(i, 1, 6) * .2, DY + .002, .1 + h2(i, 2, 6) * .12, h2(i, 3, 6) * 6, Math.PI / 2); }
  const mugTex = cvTex(1024, 256, (g) => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#1f4d32'; g.font = '800 58px Baloo2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOME CRAZY', 512, 100); g.fillText('THINGZZ', 512, 160); g.fillStyle = '#ffd84a'; g.fillRect(0, 16, 1024, 10); g.fillRect(0, 232, 1024, 10); });
  const mug = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.042, .038, .1, 32), [new THREE.MeshStandardMaterial({ map: mugTex, roughness: .35 }), SM('#5a3a22', .2), M.white]); b.position.y = .05; b.rotation.y = -1.6; const h = new THREE.Mesh(new THREE.TorusGeometry(.025, .007, 8, 20), SM('#f6efe0', .35)); h.position.set(-.045, .05, 0); mug.add(b, h); }
  put(mug, .72, DY, -.18);
  const glue = new THREE.Group(); { const b = cyl(.022, .025, .11, SM('#f4f1e8', .4), 20); b.position.y = .055; const lab = cyl(.0225, .0255, .05, SM('#ff8a1e', .4), 20); lab.position.y = .05; const cap = cyl(.006, .012, .035, SM('#ff8a1e', .4), 16); cap.position.y = .125; glue.add(b, lab, cap); }
  K.glueBottle = put(glue, .2, DY, -.2);
  const plate = new THREE.Group(); { const p = cyl(.09, .075, .012, M.white, 32); p.position.y = .006; plate.add(p); for (let i = 0; i < 5; i++) { const c = cyl(.03, .03, .009, SM('#c98a4a', .8), 18); c.position.set(Math.cos(i * 1.3) * .035, .016 + i * .004, Math.sin(i * 1.3) * .035); plate.add(c); for (let k = 0; k < 3; k++) { const ch = new THREE.Mesh(new THREE.SphereGeometry(.004, 6, 4), SM('#4a2a14', .6)); ch.position.set(c.position.x + Math.cos(k * 2 + i) * .015, c.position.y + .005, c.position.z + Math.sin(k * 2 + i) * .015); plate.add(ch); } } }
  K.plate = put(plate, .5, DY, -.05);
  // under the bench: a toolbox, a bucket, a stack of boards, an extension cord
  const tb = new THREE.Group(); { const b = R(.45, .2, .22, .02, '#c8231a', .4, .2); b.position.y = .1; const l = R(.46, .03, .23, .01, '#a81c14', .4, .2); l.position.y = .215; const hd = R(.2, .02, .03, .01, M.black); hd.position.y = .25; tb.add(b, l, hd); }
  put(tb, -.6, .245, -.05, .1);
  const bucket = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.13, .11, .28, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#e8762e', roughness: .5, side: THREE.DoubleSide })); b.position.y = .14; bucket.add(b); for (let i = 0; i < 4; i++) { const s = R(.04, .3, .02, .005, ['#d6a066', '#f2c335', '#2456c8', '#c99056'][i]); s.position.set(-.05 + i * .03, .25, 0); s.rotation.z = (i - 1.5) * .15; bucket.add(s); } }
  put(bucket, .55, .245, -.1);
  for (let i = 0; i < 5; i++) put(R(1.4, .025, .14, .004, ['#d6a066', '#c99056', '#e2bc88', '#b98048', '#d9b07a'][i], .8), -.1 + h2(i, 1, 3) * .1, .02 + i * .026, .55, .05 * (h2(i, 2, 3) - .5));
  // a stool and a floor broom on the left, a shop vac on the right
  const stool = new THREE.Group(); { const s = cyl(.17, .17, .04, SM('#2456c8', .5), 24); s.position.y = .62; stool.add(s); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const l = cyl(.012, .012, .64, M.steel, 8); l.position.set(Math.cos(a) * .11, .31, Math.sin(a) * .11); l.rotation.set(Math.sin(a) * .12, 0, -Math.cos(a) * .12); stool.add(l); } }
  put(stool, -1.45, 0, .2);
  const vac = new THREE.Group(); { const b = cyl(.2, .18, .45, SM('#f2c335', .4), 24); b.position.y = .25; const lid = cyl(.21, .21, .08, SM('#1e1e22', .5), 24); lid.position.y = .5; const hose = new THREE.Mesh(new THREE.TorusGeometry(.18, .025, 8, 24, 3.6), SM('#1e1e22', .6)); hose.position.set(.1, .5, .1); hose.rotation.y = .6; vac.add(b, lid, hose); }
  put(vac, 1.45, 0, .0);

  // —— the cubby unit on the bench, left (x −.98 … −.48): 3 × 2 open boxes; the middle-bottom one is EMPTY (the target) ——
  const cub = new THREE.Group(); K.cubby = cub;
  const CW = .5, CH = .4, CD = .26, t = .016, cx = [-CW / 2 + t, -CW / 6, CW / 6, CW / 2 - t];
  const side = (w, h, d) => R(w, h, d, .003, M.ply, .7);
  for (const x of [-CW / 2 + t / 2, -CW / 6 + t / 4, CW / 6 - t / 4, CW / 2 - t / 2]) { const s = side(t, CH, CD); s.position.set(x, CH / 2, 0); cub.add(s); }
  for (const y of [t / 2, CH / 2, CH - t / 2]) { const s = side(CW, t, CD); s.position.set(0, y, 0); cub.add(s); }
  const back = side(CW, CH, t / 2); back.position.set(0, CH / 2, -CD / 2); cub.add(back);
  K.CUB = { w: CW / 3 - t * 1.25, h: CH / 2 - t * 1.5, d: CD, x: 0, y: t + (CH / 2 - t * 1.5) / 2 };   // the empty cell (local)
  const fillCell = (cxl, cyl2, items) => items.forEach(([m, dx, dy]) => { m.position.set(cxl + dx, cyl2 + dy, .01); cub.add(m); });
  // top-left: paint cans; top-mid: rolled tape + string; top-right: jars; bottom-left: books; bottom-right: a box of screws
  fillCell(-CW / 3, CH / 2 + t / 2, [[cyl(.04, .04, .1, SM('#2456c8', .4, .3), 18), -.03, .05], [cyl(.035, .035, .08, SM('#c8231a', .4, .3), 18), .04, .04]]);
  fillCell(0, CH / 2 + t / 2, [[new THREE.Mesh(new THREE.TorusGeometry(.03, .015, 10, 20), SM('#9be0ff', .5)), -.03, .045], [new THREE.Mesh(new THREE.TorusGeometry(.025, .013, 10, 20), SM('#f2c335', .5)), .035, .04]]);
  fillCell(CW / 3, CH / 2 + t / 2, [[cyl(.03, .03, .12, new THREE.MeshStandardMaterial({ color: '#e8f4ff', roughness: .05, transparent: true, opacity: .4 }), 16), -.035, .06], [cyl(.03, .03, .1, SM('#e8a33a', .2), 16), .035, .05]]);
  ['#c8231a', '#2456c8', '#3f8a5a', '#f2c335', '#7d5aa8'].forEach((c, i) => fillCell(-CW / 3, t, [[R(.022, .13 + h2(i, 1, 2) * .03, .17, .003, c, .7), -.05 + i * .025, .075]]));
  fillCell(CW / 3, t, [[R(.12, .08, .16, .006, '#e8762e', .6), 0, .04], [R(.1, .03, .14, .004, '#f4f1e8', .6), 0, .095]]);
  put(cub, -.74, DY, -.2);
  // the boards: Gus's (too long, jams) and Nana's (fits), small shelves for the empty cell
  K.boardG = put(R(K.CUB.w + .012, .012, .2, .002, '#e2bc88', .7), 0, -5, 0); K.boardN = put(R(K.CUB.w - .002, .012, .2, .002, '#c99056', .7), 0, -5, 0);
  // —— the hero tape (Gus's, in hand / on the bench) and Nana's tape (red), and the spare on the pegboard ——
  K.tapeG = makeTape({ len: .12 }); scene.add(K.tapeG);
  K.tapeN = makeTape({ len: .12, col: '#c8231a' }); scene.add(K.tapeN); K.tapeN.visible = false;
  K.tapeDemo = [makeTape({ len: .16 }), makeTape({ len: .16 })]; K.tapeDemo.forEach(tp => { tp.gain = 4; scene.add(tp); tp.visible = false; });
  // demo blocks: a block hooked from outside (left), a wall pushed against from inside (right)
  K.blockOut = put(R(.06, .05, .08, .004, '#c99056', .7), 0, -5, 0); K.blockIn = put(R(.04, .09, .08, .004, '#8a5a32', .7), 0, -5, 0);
  // sunbeam and dust motes
  const bc = document.createElement('canvas'); bc.width = 64; bc.height = 256; const bg2 = bc.getContext('2d'); const gr2 = bg2.createLinearGradient(0, 0, 0, 256); gr2.addColorStop(0, 'rgba(255,240,210,.5)'); gr2.addColorStop(1, 'rgba(255,240,210,0)'); bg2.fillStyle = gr2; bg2.fillRect(0, 0, 64, 256);
  const hz = bg2.createLinearGradient(0, 0, 64, 0); hz.addColorStop(0, 'rgba(0,0,0,1)'); hz.addColorStop(.25, 'rgba(0,0,0,0)'); hz.addColorStop(.75, 'rgba(0,0,0,0)'); hz.addColorStop(1, 'rgba(0,0,0,1)'); bg2.globalCompositeOperation = 'destination-out'; bg2.fillStyle = hz; bg2.fillRect(0, 0, 64, 256);
  const beamM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .3, side: THREE.DoubleSide, fog: false });
  for (const [x, w] of [[1.3, .35], [1.0, .28]]) { const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), beamM); bm.position.set(x, 1.4, -.9); bm.rotation.set(-.35, -.5, -.55); bm.renderOrder = 5; scene.add(bm); }
  const NM = 160, mg = new THREE.BufferGeometry(), mp = new Float32Array(NM * 3); const base = [];
  for (let i = 0; i < NM; i++) { const b = [-.6 + h2(i, 1, 7) * 2, .9 + h2(i, 2, 7) * 1.4, -1.4 + h2(i, 3, 7) * 1.5]; base.push(b); mp.set(b, i * 3); }
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#fff3d6', size: .004, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(motes);
  K.updateMotes = tt => { const a = motes.geometry.attributes.position; for (let i = 0; i < NM; i++) { const b = base[i]; a.setXYZ(i, b[0] + Math.sin(tt * .3 + i) * .03, b[1] + ((tt * .02 + h2(i, 4, 7)) % 1) * .1 - .05, b[2] + Math.cos(tt * .25 + i * 1.3) * .03); } a.needsUpdate = true; };
  return K;
}
