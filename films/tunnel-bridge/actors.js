// Tunnel or Bridge? — the hospital, the tunnel portals and height bar, the two ambulances, the drawbridge, the sailboat,
// the camper stuck at the bar, cars that pull over, the bridge queue, staff and onlookers, and the yellow cat on the canopy
import * as THREE from 'three';
import { patchCloud, BRIDGE, CANAL, QUAY } from './world.js';
import { clamp, lerp, seg, ss, eio, mulberry } from '/core/lib.js';
import { BR, CAMPER, BAY, PORTAL, PATH, pose, dist, RUN, inTunnel, T_ENTER, T_EXIT, T_STOPB } from './story.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
export const mat = (color, o = {}) => patchCloud(new THREE.MeshStandardMaterial({ color, roughness: .5, ...o }));
export function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; }
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });

export const HOSPITAL = { x0: -64, x1: -18, z0: 566, z1: 612, h: 13.2 };
export const COL = { A: '#1f63d8', B: '#f07a1a' };
export const EXCL = [[HOSPITAL.x0 - 6, HOSPITAL.x1 + 4, HOSPITAL.z0 - 8, HOSPITAL.z1 + 8], [PORTAL.x0 - 4, PORTAL.x1 + 4, PORTAL.N - 16, 626]];

// static geometry added to the world's merged buffers
export function extraGeometry(b) {
  const h = HOSPITAL;
  b.gBld.box(h.x0, h.x1, 0, h.h, h.z0, h.z1, '#f6f4ef', '#d8d4cc', { facade: true, wp: [3.2, 3.3, 1000 + 88] });
  b.gBld.box(h.x0 + 4, h.x0 + 22, h.h, h.h + 3.3, h.z0 + 6, h.z1 - 6, '#eef0f1', '#cfd2d4', { facade: true, wp: [3.0, 3.3, 1000 + 41] });   // upper wing
  b.gBld.box(h.x1 - .1, h.x1 + 4.2, 3.7, 4.1, BAY.zA - 7, BAY.zB + 7, '#f4f2ee', '#c7302a');   // canopy roof
  for (const z of [BAY.zA - 6.6, BAY.zB + 6.6]) b.gBld.box(h.x1 + 3.6, h.x1 + 4.1, 0, 3.7, z - .25, z + .25, '#d8d4cc');   // canopy posts
  b.gBld.box(h.x1 - .1, h.x1 + .1, 0, 3.2, BAY.zA - 4, BAY.zB + 4, '#9fc3d6', '#9fc3d6');   // glass doors
  b.gFlat.flat(h.x1, -7.2, BAY.zA - 8, BAY.zB + 8, .13, '#d4cdbf');   // forecourt
  b.gMark.flat(BAY.x - .35, BAY.x + .35, BAY.zA - 5.5, BAY.zB + 5.5, .15, '#d8342a');   // the bay line (finish)
  for (const zc of [568, 614]) for (let x = -6.4; x < 6.4; x += 1.2) b.gMark.flat(x, x + .6, zc - 2, zc + 2, .045, '#f3f1ea');
  for (let z = 576; z < 608; z += 2.2) { b.gMark.flat(-6.8, -6.5, z, z + 1.1, .045, '#f2c21a'); b.gMark.flat(6.5, 6.8, z, z + 1.1, .045, '#f2c21a'); }
  for (const [x, z] of [[-3.5, 560], [3.5, 622], [-4, 600], [4.2, 580]]) b.gFlat.disc(x, z, .45, .45, .03, '#3a3b3e');
  for (const z of [BAY.zA, BAY.zB]) { b.gMark.flat(-16.6, -8.2, z - 2.1, z - 1.9, .15, '#f2c21a'); b.gMark.flat(-16.6, -8.2, z + 1.9, z + 2.1, .15, '#f2c21a'); }
  // the red cross on the roof (read from the high camera)
  b.gFlat.box(h.x0 + 28, h.x0 + 40, h.h, h.h + .12, (h.z0 + h.z1) / 2 - 2, (h.z0 + h.z1) / 2 + 2, '#d8342a', '#d8342a');
  b.gFlat.box(h.x0 + 32, h.x0 + 36, h.h, h.h + .12, (h.z0 + h.z1) / 2 - 6, (h.z0 + h.z1) / 2 + 6, '#d8342a', '#d8342a');
  // —— tunnel: the road from the quay to the south portal, both portals (concrete, dark mouths), wing walls, lamps, the height bar ——
  const X0 = PORTAL.x0, X1 = PORTAL.x1, cx = (X0 + X1) / 2;
  b.gRoad.flat(cx - 7, cx + 7, PORTAL.S, QUAY.road0, .022, '#45474b');
  b.gFlat.flat(X0 - 6, X1 + 6, CANAL.z1 + .6, PORTAL.S - 12, .05, '#7fae4f');   // grass over the tube (quay side)
  for (const [z, face] of [[PORTAL.S, 1], [PORTAL.N, -1]]) {
    const z0 = face > 0 ? z - 12 : z, z1 = face > 0 ? z : z + 12;
    b.gBld.box(X0, X1, 0, 6.4, z0, z1, '#d9d4c8', '#9aa08f');
    b.gBld.box(X0 - .4, X1 + .4, 6.4, 7.2, z0 - .4, z1 + .4, '#c9c3b5', '#c9c3b5');
    b.gBld.box(cx - 6.2, cx + 6.2, 0, 4.9, face > 0 ? z - .02 : z - .3, face > 0 ? z + .3 : z + .02, '#0c0d10', '#0c0d10');   // the mouth
    b.gBld.box(cx - 6.6, cx + 6.6, 5.1, 6.0, face > 0 ? z : z - .25, face > 0 ? z + .25 : z, '#1f63d8', '#1f63d8');   // blue band (sign plate)
    // wing walls along the approach, stepping down
    for (let k = 0; k < 4; k++) { const za = face > 0 ? z + k * 5 : z - (k + 1) * 5, zb = za + 5, hh = 5.4 - k * 1.25; for (const sx of [cx - 7.6, cx + 7.6]) b.gBld.box(sx - .6, sx + .6, 0, hh, za, zb, '#d4cec1', '#c4bdae'); }
  }
  // height bar gantry on the quay approach: two posts, a striped beam (its bent part is an actor)
  for (const sx of [cx - 8.6, cx + 8.6]) b.gBld.box(sx - .35, sx + .35, 0, 5.2, CAMPER.bar - .35, CAMPER.bar + .35, '#f2c21a', '#f2c21a');
  // south barrier posts at the bridge
  b.gFlat.box(BRIDGE.x0 - .9, BRIDGE.x0 - .5, 0, 1.4, BRIDGE.z1 - .6, BRIDGE.z1 - .2, '#c7302a', '#c7302a');
  b.gFlat.box(BRIDGE.x1 + .5, BRIDGE.x1 + .9, 0, 1.4, BRIDGE.z1 - .6, BRIDGE.z1 - .2, '#c7302a', '#c7302a');
  // ferry terminal at the start: a low pavilion with a blue roof on the quay
  b.gBld.box(-44, -4, 0, 4.2, QUAY.road1 + 4, QUAY.road1 + 16, '#f3efe6', '#2f6fd0', { facade: true, wp: [4, 4.2, 2000 + 12] });
}

function roofTex(letter, col) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, 256, 512); g.fillStyle = '#ffffff'; g.font = '900 300px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(128, 270); g.rotate(Math.PI); g.fillText(letter, 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// —— the two ambulances: white, a coloured band and roof panel with a big letter, flashing light bar ——
export function makeAmbulances(scene) {
  const out = {};
  for (const k of ['A', 'B']) {
    const g = new THREE.Group(), i = new THREE.Group(); g.add(i); i.scale.setScalar(1.15);
    const white = mat('#f8f8f5', { roughness: .35 }), band = mat(COL[k], { roughness: .4 }), dark = mat('#14171c', { roughness: .15, metalness: .4 });
    box(2.2, 1.9, 4.0, white, 0, 1.75, -1.0, i);          // box body
    box(2.1, 1.3, 1.9, white, 0, 1.25, 1.95, i);          // cab
    box(2.0, .62, .08, dark, 0, 1.6, 2.92, i);            // windscreen
    for (const sx of [-1.06, 1.06]) box(.05, .55, 1.0, dark, sx, 1.62, 2.05, i);
    box(2.22, .42, 5.96, band, 0, 1.08, -.03, i);         // band
    box(2.22, .28, 5.96, band, 0, 2.2, -1.0, i).scale.set(1, 1, .67);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.6), new THREE.MeshStandardMaterial({ map: roofTex(k, COL[k]), roughness: .5 }));
    roof.rotation.x = -Math.PI / 2; roof.position.set(0, 2.71, -1.1); i.add(roof);
    const bl = glow(.4, .7, 3.5), rd = glow(3.5, .4, .3), off = mat('#3b4a66');
    const barL = box(.8, .22, .36, bl, -.5, 1.98, 2.3, i), barR = box(.8, .22, .36, rd, .5, 1.98, 2.3, i);
    const barL2 = box(.6, .2, .3, bl, -.6, 2.82, -2.8, i), barR2 = box(.6, .2, .3, rd, .6, 2.82, -2.8, i);
    for (const [x, z] of [[-1, 1.8], [1, 1.8], [-1, -2.2], [1, -2.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 10), mat('#1d1d1f')); w.rotation.z = Math.PI / 2; w.position.set(x, .42, z); i.add(w); }
    for (const sx of [-.75, .75]) box(.4, .25, .06, glow(2.6, 2.4, 1.9), sx, 1.0, 2.95, i);   // headlights
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    const lights = [barL, barR, barL2, barR2];
    out[k] = {
      g,
      draw(t, s) {
        const p = pose(k, s);
        g.position.set(p.x, 0, p.z); g.rotation.y = p.yaw;
        g.visible = !(k === 'A' && inTunnel(s));
        const ph = Math.floor(t * 8 + (k === 'B' ? 2 : 0)) % 4;
        lights[0].material = lights[2].material = ph < 2 ? bl : off; lights[1].material = lights[3].material = ph >= 2 ? rd : off;
      },
      pos: s => { const p = pose(k, s); return V(p.x, 1.6, p.z); },
    };
  }
  return out;
}

// —— the drawbridge: two bascule leaves, barrier arms both sides, flashing red signals ——
export const leafAngle = s => s < BR.up0 ? 0 : s < BR.up1 ? 1.25 * eio(seg(s, BR.up0, BR.up1)) : s < BR.dn0 ? 1.25 : 1.25 * (1 - eio(seg(s, BR.dn0, BR.dn1)));
export const barrier = s => s < BR.bell ? 0 : s < BR.barUp ? ss(seg(s, BR.barDown - .8, BR.barDown)) : 1 - ss(seg(s, BR.barUp, BR.barUp + .6));
export function makeBridge(scene) {
  const deck = mat('#5b5f66', { roughness: .8 }), rail = mat('#f2efe8'), redm = mat('#c7302a');
  const L = (BRIDGE.hinge1 - BRIDGE.hinge0) / 2 + .2, W = BRIDGE.x1 - BRIDGE.x0 + 1.2;
  const mk = (hz, dir) => {
    const piv = new THREE.Group(); piv.position.set((BRIDGE.x0 + BRIDGE.x1) / 2, .0, hz); scene.add(piv);
    box(W, .7, L, deck, 0, -.35, dir * L / 2, piv);
    box(.25, .04, L, mat('#e9b93a'), 0, .02, dir * L / 2, piv);
    for (const sx of [-1, 1]) box(.25, 1.1, L, rail, sx * (W / 2 - .15), .55, dir * L / 2, piv);
    return piv;
  };
  const a = mk(BRIDGE.hinge0, 1), b = mk(BRIDGE.hinge1, -1);
  const arms = [], lamps = [];
  const lampOn = glow(4, .5, .3), lampOff = mat('#5a1a16');
  for (const [z, side] of [[BRIDGE.z0 + .4, -1], [BRIDGE.z1 - .4, 1]]) for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(sx < 0 ? BRIDGE.x0 - .7 : BRIDGE.x1 + .7, 1.2, z); scene.add(piv);
    const arm = new THREE.Group(); piv.add(arm);
    for (let i = 0; i < 6; i++) box(1.05, .18, .18, i % 2 ? rail : redm, -sx * (.55 + i * 1.05), 0, 0, arm);
    arms.push({ arm, sx });
    const lp = box(.5, .5, .2, lampOff, 0, .7, side * .1, piv); lamps.push(lp);
  }
  return {
    draw(t, s) {
      const th = leafAngle(s); a.rotation.x = -th; b.rotation.x = th;
      const dn = barrier(s);
      for (const A of arms) A.arm.rotation.z = A.sx * (1 - dn) * 1.35;
      const on = s > BR.bell && s < BR.barUp + .3;
      lamps.forEach((l, i) => { l.material = on && (Math.floor(t * 3) + i) % 2 ? lampOn : lampOff; });
    },
  };
}

// —— the tall sailboat that makes the bridge open ——
export function makeSailboat(scene) {
  const g = new THREE.Group(); scene.add(g);
  const hs = new THREE.Shape(); hs.moveTo(-6, -1.6); hs.lineTo(3, -1.6); hs.quadraticCurveTo(6.2, -1.2, 6.8, 0); hs.quadraticCurveTo(6.2, 1.2, 3, 1.6); hs.lineTo(-6, 1.6); hs.lineTo(-6, -1.6);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 1.5, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -.6, 0);
  const hull = new THREE.Mesh(hg, mat('#f6f6f2', { roughness: .4 })); hull.castShadow = true; g.add(hull);
  box(12.4, .2, 3.25, mat('#1f4f9a'), .2, .1, 0, g);
  box(3.4, .9, 2.0, mat('#f6f6f2'), -1.4, 1.4, 0, g);
  box(.22, 15, .22, mat('#d9d9d9', { metalness: .5 }), .8, 8.4, 0, g);
  const ss_ = new THREE.Shape(); ss_.moveTo(0, 0); ss_.lineTo(-5.6, 0); ss_.lineTo(0, 13); ss_.lineTo(0, 0);
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(ss_), mat('#fbfaf5', { side: THREE.DoubleSide, roughness: .7 })); sail.position.set(.7, 1.6, .1); sail.rotation.y = .25; sail.castShadow = true; g.add(sail);
  const js = new THREE.Shape(); js.moveTo(0, 0); js.lineTo(4.6, 0); js.lineTo(0, 12); js.lineTo(0, 0);
  const jib = new THREE.Mesh(new THREE.ShapeGeometry(js), mat('#e8463a', { side: THREE.DoubleSide, roughness: .7 })); jib.position.set(1.0, 1.6, -.1); jib.rotation.y = -.2; jib.castShadow = true; g.add(jib);
  // a person at the helm
  const p = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .6, 3, 6), mat('#f2b72e')); p.position.set(-4.2, 1.3, 0); g.add(p);
  // it motors in from the west, waits for the leaves, passes under and away east
  const X = s => s < BR.sail0 ? lerp(40, 92, seg(s, 6, BR.sail0)) : lerp(92, 170, ss(seg(s, BR.sail0, BR.sail1 + 2.5)));
  return {
    g,
    draw(t, s) { g.position.set(X(s), CANAL.y + .9, (CANAL.z0 + CANAL.z1) / 2 + 1.5); g.rotation.z = Math.sin(t * 1.3) * .02; },
    pos: s => V(X(s), 4, (CANAL.z0 + CANAL.z1) / 2),
  };
}

// —— the camper stuck at the height bar, hazards blinking; the bent bar ——
export function makeCamper(scene) {
  const g = new THREE.Group(); scene.add(g);
  const cream = mat('#f1e7d2'), stripe = mat('#2c9a7a'), dark = mat('#14171c', { roughness: .15 });
  box(2.4, 2.9, 6.4, cream, 0, 2.05, -.6, g); box(2.3, 1.2, 1.4, cream, 0, 1.6, 3.2, g);
  box(2.42, .35, 7.4, stripe, 0, 1.5, 0, g); box(2.0, .6, .06, dark, 0, 2.0, 3.92, g);
  box(1.4, .6, 1.6, mat('#d8d0bd'), 0, 3.8, 2.6, g);   // the roof box that hit the bar
  for (const [x, z] of [[-1.1, 2.6], [1.1, 2.6], [-1.1, -2.4], [1.1, -2.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .3, 10), mat('#1d1d1f')); w.rotation.z = Math.PI / 2; w.position.set(x, .45, z); g.add(w); }
  const hz = [box(.3, .2, .06, glow(4, 2, .2), -.9, 1.1, 3.93, g), box(.3, .2, .06, glow(4, 2, .2), .9, 1.1, 3.93, g), box(.3, .25, .06, glow(4, 2, .2), -1, 1.2, -3.85, g), box(.3, .25, .06, glow(4, 2, .2), 1, 1.2, -3.85, g)];
  g.position.set(CAMPER.x, 0, CAMPER.z); g.rotation.y = Math.PI + .06;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // the beam: yellow/black stripes, bent where the camper hit it
  const beam = new THREE.Group(); scene.add(beam); beam.position.set(PORTAL.x0 + 3.4, 4.0, CAMPER.bar);
  const yel = mat('#f2c21a'), blk = mat('#1b1c1f');
  for (let i = 0; i < 13; i++) box(1.32, .5, .4, i % 2 ? blk : yel, .66 + i * 1.32, 0, 0, beam);
  beam.rotation.z = -.05; beam.rotation.y = .04;
  return { draw(t) { hz.forEach(h => { h.visible = Math.floor(t * 2.5) % 2 === 0; }); } };
}

// —— traffic: cars ahead on each route pull over to the kerb as the ambulance closes in; a queue waits at the bridge ——
export function makeTraffic(scene) {
  const rnd = mulberry(21);
  const CARC = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#8e98a3', '#1f4f8f', '#7fb3d5', '#3f8f5b', '#a83a2f', '#e9e4d8', '#f2b72e', '#e85f3a'];
  const cars = [];
  const along = (k, dd) => { for (const d of dd) cars.push({ k, d, c: CARC[Math.floor(rnd() * CARC.length)], ph: rnd() }); };
  along('A', [40, 72, 290, 330, 378, 420, 470]);
  along('B', [35, 64, 100, 290, 325, 360]);
  // the queue on the north side of the bridge (southbound lane), and cars waiting behind B on the south side
  const Q_ = [];
  for (let i = 0; i < 3; i++) Q_.push({ x: 108 - i * 6.8, z: 632.8, yaw: Math.PI / 2 });
  for (let i = 0; i < 3; i++) Q_.push({ x: 122.8, z: BRIDGE.z1 + 14 + i * 6.8, yaw: Math.PI, behind: i });
  const n = cars.length + Q_.length;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .35, metalness: .15 })), n);
  const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), patchCloud(new THREE.MeshStandardMaterial({ color: '#0f1218', roughness: .12, metalness: .5 })), n);
  const brake = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, .2, .05).translate(0, 1.05, -2.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, .3, .2) }), n);
  [body, cab, brake].forEach(m => { m.castShadow = m !== brake; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); });
  cars.forEach((c, i) => body.setColorAt(i, C.set(c.c))); Q_.forEach((c, i) => body.setColorAt(cars.length + i, C.set(CARC[(i * 5 + 2) % CARC.length])));
  return {
    draw(t, s) {
      let i = 0;
      for (const c of cars) {
        const P0 = PATH[c.k].at(c.d), dAmb = dist(c.k, s), gap = c.d - dAmb;
        // creep along slowly until the siren is close, then pull 2.6 m to the right and stop; after it passes, ease back
        const pull = ss(clamp((48 - gap) / 22)) * (1 - ss(clamp((-gap - 25) / 30)));
        const creep = Math.min(s, 20) * 1.2 * (1 - pull);
        const p = PATH[c.k].at(c.d + creep), cx = Math.cos(p.yaw), sn = Math.sin(p.yaw);
        const off = pull * 2.6;
        Q.setFromEuler(E.set(0, p.yaw + pull * .25 * Math.sin(Math.PI * clamp(pull)), 0));
        M.compose(P.set(p.x - cx * off, 0, p.z + sn * off), Q, Sc.set(1, 1, 1));
        const visible = !(c.k === 'A' && p.z < PORTAL.S && p.z > PORTAL.N && Math.abs(p.x + 130) < 8);
        if (!visible) M.makeScale(0, 0, 0);
        body.setMatrixAt(i, M); cab.setMatrixAt(i, M);
        brake.setMatrixAt(i, pull > .2 && pull < .99 ? M : M.clone().scale(Sc.set(0, 0, 0))); i++;
      }
      for (const c of Q_) {
        let z = c.z, x = c.x;
        if (c.behind !== undefined) {   // they roll up behind B while it waits, then follow it over
          z = c.z + Math.max(0, T_STOPB + 1 + c.behind * 1.2 - s) * 9 - Math.max(0, s - BR.go - 1.2 - c.behind * .8) * 9;
        } else x = c.x + Math.min(3, Math.max(0, s - BR.go - 2) * 1.5);
        Q.setFromEuler(E.set(0, c.yaw, 0)); M.compose(P.set(x, 0, z), Q, Sc.set(1, 1, 1));
        if (z > 744 || z < 600) M.makeScale(0, 0, 0);
        body.setMatrixAt(i, M); cab.setMatrixAt(i, M); brake.setMatrixAt(i, s < BR.go + 1 ? M : M.clone().scale(Sc.set(0, 0, 0))); i++;
      }
      body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = brake.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— people: staff with stretchers waiting at the bay, onlookers at the hospital and the ferry gate, cyclists ——
export function makePeople(scene) {
  const rnd = mulberry(33), R = (a, b) => a + (b - a) * rnd();
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  const F = [];
  for (const z of [BAY.zA, BAY.zB]) for (let i = 0; i < 3; i++) F.push({ x: -16 + i * .8, z: z + (i - 1) * 1.6 + 4.2 * (z === BAY.zA ? -1 : 1) * 0, c: i === 1 ? '#2c9a7a' : '#f4f6f6', ph: R(0, 9), staff: 1 });
  for (let i = 0; i < 16; i++) F.push({ x: R(-15, -9), z: R(BAY.zA - 10, BAY.zA - 7.5), c: PC[Math.floor(rnd() * PC.length)], ph: R(0, 9) });
  for (let i = 0; i < 12; i++) F.push({ x: R(-15, -9), z: R(BAY.zB + 7.5, BAY.zB + 10), c: PC[Math.floor(rnd() * PC.length)], ph: R(0, 9) });
  for (let i = 0; i < 44; i++) F.push({ x: R(-48, 0), z: R(QUAY.road1 + 1.5, QUAY.road1 + 4.5), c: PC[Math.floor(rnd() * PC.length)], ph: R(0, 9) });   // ferry gate
  for (let i = 0; i < 14; i++) F.push({ x: R(112, 128) + (rnd() < .5 ? -10 : 10), z: R(672, 680), c: PC[Math.floor(rnd() * PC.length)], ph: R(0, 9) });   // watching the bridge
  for (let i = 0; i < 10; i++) F.push({ x: R(-150, -142), z: R(714, 738), c: PC[Math.floor(rnd() * PC.length)], ph: R(0, 9) });   // the camper's crowd
  const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), patchCloud(new THREE.MeshStandardMaterial({ roughness: .7 })), F.length); m.castShadow = true; m.frustumCulled = false;
  F.forEach((f, i) => m.setColorAt(i, C.set(f.c))); scene.add(m);
  // two stretchers (white beds on legs) at the bay
  for (const z of [BAY.zA, BAY.zB]) { const g = new THREE.Group(); box(.8, .12, 2.1, mat('#f7f7f4'), 0, .9, 0, g); box(.7, .8, .1, mat('#9aa0a6'), 0, .45, .9, g); box(.7, .8, .1, mat('#9aa0a6'), 0, .45, -.9, g); g.position.set(-15.2, 0, z + (z === BAY.zA ? -3.4 : 3.4)); g.rotation.y = Math.PI / 2; scene.add(g); }
  return {
    draw(t, s) {
      F.forEach((f, i) => {
        const hop = !f.staff && Math.max(0, Math.sin(t * 7 + f.ph)) * (s > 39.9 && s < 44 ? .35 : .06);
        M.compose(P.set(f.x + Math.sin(t * .7 + f.ph) * .15, hop || 0, f.z), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i, M);
      });
      m.instanceMatrix.needsUpdate = true;
    },
  };
}

// —— tunnel lamps glowing in both mouths (depth cue) ——
export function makeTunnelLamps(scene) {
  const cx = (PORTAL.x0 + PORTAL.x1) / 2, mt = glow(3.2, 2.0, .9), n = 10;
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(.6, .12, .3), mt, n * 2);
  let i = 0;
  for (const [z, f] of [[PORTAL.S, -1], [PORTAL.N, 1]]) for (let k = 0; k < n; k++) { M.compose(P.set(cx - 5.6 + (k % 2) * 11.2, 4.3, z + f * (.6 + Math.floor(k / 2) * 2.2)), Q.identity(), Sc.set(1, 1, 1)); m.setMatrixAt(i++, M); }
  m.frustumCulled = false; scene.add(m);
}

export function makeCat(scene) {
  const g = new THREE.Group(), y = mat('#f2b72e', { roughness: .8 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .7, 4, 8), y); b.rotation.z = Math.PI / 2; b.position.y = .35; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), y); h.position.set(.62, .45, 0); g.add(h);
  for (const z of [-.13, .13]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 4), y); e.position.set(.66, .76, z); g.add(e); }
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 5), y); tl.rotation.z = 1.2; tl.position.set(-.75, .3, .1); g.add(tl);
  g.scale.setScalar(1.4); g.traverse(o => { o.castShadow = true; }); scene.add(g);
  g.position.set(HOSPITAL.x1 + 2.6, 4.1, BAY.zA - 5.2); g.rotation.y = 2.4;   // asleep on the canopy roof
  return g;
}

// —— quay-side dressing: nose-in parking between the sheds and the quay road, lamps, crates, people strolling,
//    trees and benches on the grass over the tunnel ——
export function makeQuayDressing(scene) {
  const rnd = mulberry(55), R = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)];
  const CARC = ['#f4f4f2', '#c9ccd0', '#2a2d33', '#8e98a3', '#d9d4c7', '#1f4f8f', '#7fb3d5', '#3f8f5b', '#a83a2f', '#e9e4d8', '#f2b72e', '#e85f3a'];
  const PC = ['#e8463a', '#2f6fd0', '#f4f1ea', '#f2b72e', '#3f9a5a', '#e27fb0', '#1f2a3a', '#8bc6e8', '#f07f2c'];
  const free = x => !(x > -147 && x < -113) && !(x > 106 && x < 136) && !(x > -50 && x < 8);
  const cars = [], lamps = [], crates = [], walkers = [], crowns = [], benches = [];
  for (let x = -330; x < 330; x += R(3.0, 3.6)) if (free(x) && rnd() < .8) cars.push({ x, z: 735.4 + R(-.2, .2), yaw: R(-.06, .06), c: pick(CARC) });
  for (let x = -330; x < 330; x += 18) { if (free(x)) lamps.push({ x, z: 738.6 }); lamps.push({ x: x + 9, z: 754 }); }
  for (let i = 0; i < 90; i++) { const x = R(-330, 330); if (!free(x)) continue; const z = R(668, 676), n = 1 + Math.floor(R(0, 3)); for (let k = 0; k < n; k++) crates.push({ x, z, y: k * 1.1, c: pick(['#b9874f', '#a3743f', '#2c6aa0', '#c23b2b', '#3d8c5a']), yaw: R(-.2, .2) }); }
  for (let i = 0; i < 110; i++) walkers.push({ x0: R(-330, 330), z: rnd() < .5 ? R(755, 760) : R(677, 680), v: R(.8, 1.4) * (rnd() < .5 ? 1 : -1), c: pick(PC), ph: R(0, 9) });
  for (let i = 0; i < 26; i++) { const x = R(PORTAL.x0 - 8, PORTAL.x1 + 8), z = R(CANAL.z1 + 4, PORTAL.S - 16); if (Math.abs(x + 130) > 3.5 || rnd() < .3) crowns.push({ x, z, r: R(1.8, 3.2) }); }
  for (let i = 0; i < 6; i++) benches.push({ x: PORTAL.x0 - 4 + i * 6.5, z: CANAL.z1 + 2.5 });
  // cones round the camper, pallets and bins on the quay pavement, planters along the hospital street
  const cones = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cones.push({ x: CAMPER.x + Math.cos(a) * 2.2 + 1.2, z: CAMPER.z + 4 + Math.sin(a) * 4.8 }); }
  for (let i = 0; i < 60; i++) { const x = R(-330, 330); if (free(x)) crates.push({ x, z: R(681, 728), y: 0, c: pick(['#b9874f', '#a3743f', '#8c8f93', '#2c6aa0', '#3d8c5a']), yaw: R(-.3, .3) }); }
  for (const z of [560, 570, 610, 618]) for (const x of [-9.5, 9.5]) cones.push({ x, z, planter: 1 });
  const std = (o = {}) => patchCloud(new THREE.MeshStandardMaterial({ roughness: .6, ...o }));
  const inst = (geo, m, list, f, colors, shadow = true) => {
    const im = new THREE.InstancedMesh(geo, m, Math.max(1, list.length)); im.count = list.length;
    list.forEach((it, i) => { f(it); im.setMatrixAt(i, M); if (colors) im.setColorAt(i, C.set(colors(it))); });
    im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im;
  };
  const place = (x, y, z, yaw = 0, s = 1, sy = s) => { Q.setFromEuler(E.set(0, yaw, 0)); M.compose(P.set(x, y, z), Q, Sc.set(s, sy, s)); };
  inst(new THREE.BoxGeometry(1.9, 1.0, 4.4).translate(0, .85, 0), std({ roughness: .35, metalness: .15 }), cars, it => place(it.x, 0, it.z, it.yaw), it => it.c);
  inst(new THREE.BoxGeometry(1.7, .72, 2.3).translate(0, 1.71, -.25), std({ color: '#0f1218', roughness: .12, metalness: .5 }), cars, it => place(it.x, 0, it.z, it.yaw));
  inst(new THREE.CylinderGeometry(.1, .13, 6, 6).translate(0, 3, 0), std({ color: '#2f3338' }), lamps, it => place(it.x, 0, it.z));
  inst(new THREE.SphereGeometry(.38, 8, 6).translate(0, 6.1, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, .8) }), lamps, it => place(it.x, 0, it.z), null, false);
  inst(new THREE.BoxGeometry(1.1, 1.0, 1.1).translate(0, .5, 0), std(), crates, it => place(it.x, it.y, it.z, it.yaw), it => it.c);
  inst(new THREE.IcosahedronGeometry(1, 1), patchCloud(new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true })), crowns, it => place(it.x, it.r * 1.1 + .4, it.z, 0, it.r, it.r * .9), () => pick(['#4f9a35', '#5fa83c', '#3e8a35', '#6aae42']));
  inst(new THREE.BoxGeometry(2.0, .5, .7).translate(0, .45, 0), std({ color: '#8a5a3a' }), benches, it => place(it.x, 0, it.z));
  inst(new THREE.ConeGeometry(.32, .8, 8).translate(0, .4, 0), std({ color: '#f26b1d' }), cones.filter(c => !c.planter), it => place(it.x, 0, it.z));
  inst(new THREE.BoxGeometry(1.3, .7, 1.3).translate(0, .35, 0), std({ color: '#c9b79c' }), cones.filter(c => c.planter), it => place(it.x, 0, it.z));
  inst(new THREE.IcosahedronGeometry(.8, 0).translate(0, 1.2, 0), std({ color: '#4f9a35', flatShading: true }), cones.filter(c => c.planter), it => place(it.x, 0, it.z));
  // a market on the promenade (sea side of the quay road): stalls with striped awnings, shoppers
  const stalls = [];
  for (let x = -330; x < 330; x += R(6.5, 9)) { for (const z of [759, 768, 777]) if (rnd() < .8 && !(z === 759 && x > -52 && x < 10)) stalls.push({ x, z, c: pick(['#d8342a', '#2f6fd0', '#f2b72e', '#2c9a7a', '#f07f2c', '#e27fb0']), g: pick(['#e3c07a', '#c94f3a', '#7fae4f', '#f2e2b0']) }); }
  for (const st of stalls) for (let k = 0; k < 2; k++) if (rnd() < .8) walkers.push({ x0: st.x + R(-2, 2), z: st.z + (st.z < 764 ? 2.6 : -2.6) + R(-.4, .4), v: R(-.15, .15), c: pick(PC), ph: R(0, 9) });
  inst(new THREE.BoxGeometry(4.2, .9, 1.8).translate(0, .45, 0), std({ color: '#9a6b45' }), stalls, it => place(it.x, 0, it.z));
  inst(new THREE.BoxGeometry(3.8, .35, 1.5).translate(0, 1.05, 0), std(), stalls, it => place(it.x, 0, it.z), it => it.g);
  inst(new THREE.BoxGeometry(4.8, .14, 2.8).translate(0, 2.5, 0), std({ roughness: .55 }), stalls, it => place(it.x, 0, it.z, 0, 1), it => it.c);
  inst(new THREE.CylinderGeometry(.05, .05, 2.5, 4).translate(0, 1.25, 0), std({ color: '#ddd' }), stalls, it => place(it.x - 2.2, 0, it.z));
  const ppl = inst(new THREE.CapsuleGeometry(.32, .7, 3, 6).translate(0, .67, 0), std({ roughness: .7 }), walkers, it => place(it.x0, 0, it.z), it => it.c);
  return {
    draw(t) {
      walkers.forEach((w, i) => { let x = w.x0 + w.v * t * 1.5; if (!free(x)) x += 40 * Math.sign(w.v); place(x, Math.abs(Math.sin(t * 5 + w.ph)) * .08, w.z); ppl.setMatrixAt(i, M); });
      ppl.instanceMatrix.needsUpdate = true;
    },
  };
}
