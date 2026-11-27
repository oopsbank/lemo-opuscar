// kb.js — the hero keyboard (cartoon-enlarged: 5 cm key pitch), its F/J/5 bumps, a monitor whose screen we type on, and flat cartoon hands for the typing macros.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const P = .05, KS = .044, KH = .022;
const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m);
const ROWS = [
  [['`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['-'], ['='], ['⌫', 2, 'm']],
  [['TAB', 1.5, 'm'], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'], ['U'], ['I'], ['O'], ['P'], ['['], [']'], ['\\', 1.5]],
  [['CAPS', 1.75, 'm'], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], [';'], ["'"], ['ENTER', 2.25, 'e']],
  [['SHIFT', 2.25, 'm'], ['Z'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], [','], ['.'], ['/'], ['SHIFT ', 2.75, 'm']],
  [['CTRL', 1.5, 'm'], ['❖', 1.25, 'm'], ['ALT', 1.25, 'm'], ['SPACE', 7, 's'], ['ALT ', 1.25, 'm'], ['FN', 1.25, 'm'], ['CTRL ', 1.5, 'm']],
];
const PAD = [[['NUM', 1, 'm', 0, 0], ['/', 1, 'm', 1, 0], ['*', 1, 'm', 2, 0], ['−', 1, 'm', 3, 0]],
  [['N7', 1, 'a', 0, 1], ['N8', 1, 'a', 1, 1], ['N9', 1, 'a', 2, 1], ['+', 1, 'm', 3, 1, 2]],
  [['N4', 1, 'a', 0, 2], ['N5', 1, 'a', 1, 2], ['N6', 1, 'a', 2, 2]],
  [['N1', 1, 'a', 0, 3], ['N2', 1, 'a', 1, 3], ['N3', 1, 'a', 2, 3], ['NENT', 1, 'e', 3, 3, 2]],
  [['N0', 2, 'a', 0, 4], ['N.', 1, 'a', 2, 4]]];
const COL = { a: '#f6f1e4', m: '#a9b2c0', e: '#ff8a3a', s: '#f6f1e4', hot: '#ffd84a' };

export function buildKeyboard(scene, DY, at = new THREE.Vector3(0, 0, .02)) {
  const K = { keys: {}, P }, root = new THREE.Group(); root.position.set(at.x, DY, at.z); scene.add(root); K.root = root;
  // legends: one atlas canvas, each key's label plane maps its own cell
  const AC = document.createElement('canvas'); AC.width = 2048; AC.height = 1024; const ag = AC.getContext('2d');
  const atlas = new THREE.CanvasTexture(AC); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8;
  const labM = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  let cell = 0; const CW = 128, CH = 128, PER = 16;
  const bodyM = new THREE.MeshStandardMaterial({ color: '#2c3440', roughness: .45 });
  const W0 = 15 * P, D0 = 5 * P, GAP = .5 * P, WP = 4 * P;
  const body = rbox(W0 + WP + GAP + .05, .03, D0 + .05, .012, bodyM); body.position.set((WP + GAP) / 2, .015, 0); body.castShadow = body.receiveShadow = true; root.add(body);
  const rim = rbox(W0 + WP + GAP + .06, .012, D0 + .06, .006, new THREE.MeshStandardMaterial({ color: '#ffd84a', roughness: .5 })); rim.position.set((WP + GAP) / 2, .004, 0); root.add(rim);
  const x0 = -W0 / 2, z0 = -D0 / 2;
  function key(name, x, z, w, d, kind) {
    const label = name.replace(/^N(?=[0-9.]|ENT)/, '').replace('ENT', 'ENTER').trim();
    const g = new THREE.Group(); g.position.set(x, .03, z); root.add(g);
    const m = new THREE.MeshStandardMaterial({ color: COL[kind] ?? COL.a, roughness: .38 });
    const b = rbox(w * P - (P - KS), KH, d * P - (P - KS), .007, m); b.position.y = KH / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
    // legend cell
    const cx = (cell % PER) * CW, cy = Math.floor(cell / PER) * CH; cell++;
    ag.fillStyle = '#20242c'; ag.textAlign = 'center'; ag.textBaseline = 'middle';
    const fs = label.length > 2 ? 30 : 64; ag.font = `800 ${fs}px Baloo2`; ag.fillText(label, cx + CW / 2, cy + (label.length > 2 ? CH * .72 : CH * .42));
    const lw = Math.min(w * P - (P - KS) - .006, KS - .004), ld = KS - .004;
    const lg = new THREE.PlaneGeometry(lw, ld); const uv = lg.attributes.uv;
    const aspect = lw / ld, cw2 = Math.min(1, aspect) * CW, u0 = (cx + CW / 2 - cw2 / 2) / 2048, u1 = (cx + CW / 2 + cw2 / 2) / 2048, v0 = 1 - (cy + CH) / 1024, v1 = 1 - cy / 1024;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
    const lab = new THREE.Mesh(lg, labM); lab.rotation.x = -Math.PI / 2; lab.position.y = KH + .0006; lab.renderOrder = 3; g.add(lab);
    K.keys[name] = { g, b, m, base: m.color.clone(), w, d, press: 0, x, z };
    return K.keys[name];
  }
  ROWS.forEach((row, r) => { let x = x0; for (const [n, w = 1, kind = 'a'] of row) { key(n, x + w * P / 2, z0 + (r + .5) * P, w, 1, kind); x += w * P; } });
  const px0 = W0 / 2 + GAP;
  PAD.flat().forEach(([n, w, kind, c, r, h = 1]) => key(n, px0 + (c + w / 2) * P, z0 + (r + h / 2) * P, w, h, kind));
  atlas.needsUpdate = true;
  // the bumps: a short ridge low on F and J, a dot on the pad's 5
  const bumpM = new THREE.MeshStandardMaterial({ color: '#f6f1e4', roughness: .3 });
  K.bumps = {};
  for (const n of ['F', 'J', 'N5']) {
    const k = K.keys[n], br = n === 'N5' ? rbox(.006, .004, .006, .0019, bumpM) : rbox(.014, .004, .0035, .0016, bumpM);
    br.position.set(0, KH + .0015, .013); br.castShadow = true; k.g.add(br); K.bumps[n] = br;
  }
  K.setBump = (n, a) => { const b = K.bumps[n]; b.visible = a > .02; b.scale.set(1, Math.max(.02, a), 1); b.position.y = KH + .0015 * a; };
  K.hot = (n, a) => { const k = K.keys[n]; k.m.color.copy(k.base).lerp(new THREE.Color(COL.hot), a); k.m.emissive = new THREE.Color(COL.hot).multiplyScalar(a * .35); };
  K.reset = () => { for (const n in K.keys) { const k = K.keys[n]; k.g.position.y = .03; k.m.color.copy(k.base); k.m.emissive?.setScalar(0); } for (const n in K.bumps) K.setBump(n, 1); };
  K.press = (n, a) => { const k = K.keys[n]; if (k) k.g.position.y = .03 - .008 * a; };
  K.world = (n, dy = KH) => { const k = K.keys[n]; return root.localToWorld(new THREE.Vector3(k.x, .03 + dy, k.z)); };
  return K;
}

// the monitor: a chunky retro-modern screen on a stand; setScreen draws a little text editor
export function buildMonitor(scene, pos, ry) {
  const M = {}, g = new THREE.Group(); g.position.copy(pos); g.rotation.y = ry; scene.add(g); M.group = g;
  const dark = new THREE.MeshStandardMaterial({ color: '#2c3440', roughness: .45 });
  const base = rbox(.2, .015, .14, .006, dark); base.position.y = .0075; g.add(base);
  const neck = rbox(.04, .16, .03, .008, dark); neck.position.set(0, .09, -.03); g.add(neck);
  const bez = rbox(.5, .33, .03, .014, dark); bez.position.set(0, .3, 0); g.add(bez);
  const C = document.createElement('canvas'); C.width = 1000; C.height = 640; const cg = C.getContext('2d');
  const tex = new THREE.CanvasTexture(C); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.46, .294), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.1, 1.1, 1.1) })); scr.position.set(0, .3, .0155); g.add(scr);
  g.traverse(o => { if (o.isMesh && o !== scr) { o.castShadow = true; o.receiveShadow = true; } });
  const st = document.createElement('canvas');
  M.setScreen = (text, cursor = true, col = '#1c1418', big = 150) => {
    if (M._k === text + cursor + col + big) return; M._k = text + cursor + col + big;
    cg.fillStyle = '#fbf8f0'; cg.fillRect(0, 0, 1000, 640);
    cg.fillStyle = '#5b93d3'; cg.fillRect(0, 0, 1000, 70); cg.fillStyle = '#fff'; cg.font = '800 40px Baloo2'; cg.textBaseline = 'middle'; cg.textAlign = 'left'; cg.fillText('  my_name.txt', 10, 37);
    for (const [x, c] of [[930, '#ff6a50'], [880, '#ffd84a'], [830, '#7be07b']]) { cg.fillStyle = c; cg.beginPath(); cg.arc(x, 35, 16, 0, 7); cg.fill(); }
    cg.strokeStyle = '#e4dccb'; cg.lineWidth = 3; for (let y = 120; y < 640; y += 60) { cg.beginPath(); cg.moveTo(40, y); cg.lineTo(960, y); cg.stroke(); }
    cg.fillStyle = col; cg.font = `800 ${big}px Baloo2`; cg.textBaseline = 'alphabetic'; cg.textAlign = 'left';
    const lines = text.split('\n'); let y = 260; let wLast = 0;
    for (const l of lines) { cg.fillText(l, 60, y); wLast = cg.measureText(l).width; y += big * .9; }
    if (cursor) { cg.fillStyle = '#2456c8'; cg.fillRect(70 + wLast, y - big * .9 - big * .72, 14, big * .8); }
    tex.needsUpdate = true;
  };
  M.setScreen('');
  M.screenWorld = () => scr.getWorldPosition(new THREE.Vector3());
  return M;
}

// a flat cartoon hand lying palm-down on the keys (seen from above): fingertips at 5 cm pitch; side −1 = left hand
// tips: index at x = ±1.5P from the hand centre's x, fingers point to −z (away from the camera)
export function makeHand(scene, side, sleeve) {
  const C = document.createElement('canvas'); C.width = 512; C.height = 640; const g = C.getContext('2d');
  const S = 512 / .26;   // px per metre: the plane is .26 × .325 m
  const ink = '#1c1418', skin = '#fbf7ef', sh = '#e2d6c6';
  g.lineJoin = g.lineCap = 'round';
  const X = m => 256 + m * S, Y = m => 640 - m * S;   // hand coords: x across, y from the wrist edge toward the fingertips
  const tips = side < 0 ? [-1.5, -.5, .5, 1.5] : [-1.5, -.5, .5, 1.5];
  const len = side < 0 ? [.07, .085, .09, .085] : [.085, .09, .085, .07];   // pinky … index for the left, index … pinky for the right
  const tipY = .245;
  function draw(curl) {
    g.clearRect(0, 0, 512, 640);
    // sleeve cuff at the wrist
    g.fillStyle = sleeve; g.strokeStyle = ink; g.lineWidth = 12;
    g.beginPath(); g.roundRect(X(-.075), Y(.06), .15 * S, .07 * S, 14); g.fill(); g.stroke();
    // fingers
    tips.forEach((t, i) => {
      const x = t * P * .92, l = len[i] * (1 - .25 * (curl?.[i] ?? 0)), y1 = tipY - (.09 - l) - .005;
      g.fillStyle = skin; g.lineWidth = 11; g.beginPath(); g.roundRect(X(x - .0115), Y(y1), .023 * S, (l + .02) * S, .0115 * S); g.fill(); g.stroke();
      g.fillStyle = sh; g.beginPath(); g.ellipse(X(x), Y(y1 - .008), .007 * S, .004 * S, 0, 0, 7); g.fill();
    });
    // thumb, toward the space bar
    const tx = side < 0 ? .05 : -.05;
    g.fillStyle = skin; g.lineWidth = 11; g.save(); g.translate(X(tx), Y(.12)); g.rotate(side < 0 ? .6 : -.6); g.beginPath(); g.roundRect(-.012 * S, -.05 * S, .024 * S, .065 * S, .012 * S); g.fill(); g.stroke(); g.restore();
    // palm over the finger roots
    g.fillStyle = skin; g.lineWidth = 12; g.beginPath(); g.roundRect(X(-.068), Y(.165), .136 * S, .11 * S, .04 * S); g.fill(); g.stroke();
    g.fillStyle = sh; g.beginPath(); g.ellipse(X(side * -.03), Y(.1), .02 * S, .035 * S, 0, 0, 7); g.fill();
    // knuckle hints
    g.strokeStyle = ink; g.lineWidth = 5; tips.forEach(t => { const x = t * P * .92; g.beginPath(); g.arc(X(x), Y(.168), .006 * S, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
    tex.needsUpdate = true;
  }
  const tex = new THREE.CanvasTexture(C); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.26, .325), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .05, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 6;
  const grp = new THREE.Group(); grp.add(m); scene.add(grp);
  // the plane's centre sits .1625 m from the wrist edge; the fingertips at tipY from it
  m.position.z = -(.1625 - 0);   // local: z = 0 at the wrist edge, fingertips at z = −tipY
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.26, .325), new THREE.MeshBasicMaterial({ map: tex, color: '#000', transparent: true, opacity: .22, alphaTest: .05, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(.006, -.012, -.1625 + .006); grp.add(shadow);
  draw();
  // place so the index fingertip lands on key `k` (a world point); lift = height above the keys
  const H = { group: grp, draw, idx: side < 0 ? 3 : 0, side };
  H.placeIndexOn = (p, lift = .012, yaw = 0) => {
    const ix = tips[H.idx] * P * .92;
    grp.position.set(p.x - ix, p.y + lift, p.z + tipY - .005); grp.rotation.set(0, yaw, 0);
  };
  return H;
}
