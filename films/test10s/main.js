// Pixel Life 10 s test in the 3× look: "My computer is broken!" — the monitor was just facing the wall.
// The IT office set (frozen at 9 a.m.), its help desk replaced by the 3× desk, monitor, keyboard and mug, the floor and the
// IT HELP DESK sign redrawn at 81 px/m, the 3× hero behind the desk and the 3× Customer in front. One static two-shot with a
// slow push-in (one camera scale); one text layer (the caption).
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { buildOffice } from './office.js';
import { overlayReady, W, H } from './ui.js';
import { makeChar3 } from './chars_3x.js';
import { buildProps3x } from './props3x.js';
import { PX, ramp, h2, texOf } from './px.js';
import { seg, ss, lerp } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 2);
export const DUR = 10.0;
const DURS = await fetch('voices/dur.json').then(r => r.json()).catch(() => ({}));
export const VO = [
  { id: 'c1', t: .15, who: 'CUSTOMER', col: '#e0a0ff', sub: 'My computer is broken!', box: [.1, 2.1] },
  { id: 'h1', t: 2.3, who: 'YOU', col: '#9cf06a', sub: 'Let me see.', box: [2.2, 3.6] },
  { id: 'h2', t: 4.4, who: 'YOU', col: '#9cf06a', sub: 'It was facing the wall.', box: [4.3, 6.3] },
  { id: 'c2', t: 7.5, who: 'CUSTOMER', col: '#e0a0ff', sub: 'Wow. You’re a genius.', box: [7.4, 9.4] },
];
const SPIN = [3.35, 3.9];
const talking = (t, id) => { const v = VO.find(o => o.id === id); return t >= v.t && t < v.t + (DURS[id] || 1) && Math.floor(t * 9) % 2 === 0; };

await overlayReady();
const ov = document.getElementById('ov'), g = ov.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 400);
const set = buildOffice();
const post = makePost(renderer, set.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;

// —— the set at 3×: carpet (54 px tiles, 4 m per 324 px texture), the sign; the old help desk hidden ——
function carpet3(n) {
  const P = new PX(n, n), R = ramp(['#262c3c', '#343c4e', '#444e64', '#56627a', '#66728c'], .35);
  P.fill((x, y) => { const tx = Math.floor(x / 54), ty = Math.floor(y / 54), u = (tx + ty) % 2 ? x : y; if (x % 54 === 0 || y % 54 === 0) return [34, 38, 52];
    return R(.5 + (h2(tx, ty, 3) - .5) * .2 + ((u % 3 === 0) ? .1 : 0) - ((u % 9 === 4) ? .06 : 0) + (h2(x, y, 5) - .5) * .16, x, y); });
  return P.done();
}
let floor = null; set.scene.traverse(o => { if (!floor && o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (Math.abs(b.max.x - b.min.x - 17.2) < .01 && Math.abs(b.max.z - b.min.z - 8.2) < .01) floor = o; } });
if (floor) { floor.material = floor.material.clone(); floor.material.map = texOf(carpet3(324), { repeat: [1, 1] }); const ext = floor.clone(); ext.position.z += 8.0; ext.position.y -= .003; set.scene.add(ext); }
{ const c = document.createElement('canvas'); c.width = 105; c.height = 26; const x = c.getContext('2d');
  x.fillStyle = '#1a1016'; x.fillRect(0, 0, 105, 26); x.fillStyle = '#86d636'; x.fillRect(2, 2, 101, 22); x.fillStyle = '#b6ee66'; x.fillRect(2, 2, 101, 3); x.fillStyle = '#5aa822'; x.fillRect(2, 21, 101, 3);
  const L = document.createElement('canvas'); L.width = 105; L.height = 26; const l = L.getContext('2d'); let fs = 13; do { l.font = `700 ${fs}px Silkscreen`; } while (l.measureText('IT HELP DESK').width > 96 && --fs > 6); l.textAlign = 'center'; l.textBaseline = 'middle'; l.fillStyle = '#1a1016'; l.fillText('IT HELP DESK', 52.5, 14);
  const d = l.getImageData(0, 0, 105, 26); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; l.putImageData(d, 0, 0); x.drawImage(L, 0, 0);
  let nS = 0; set.scene.traverse(o => { const p = o.geometry?.parameters; if (o.isMesh && p && Math.abs(p.width - 1.3) < .01 && Math.abs(p.height - .32) < .01 && ++nS) { o.material = o.material.clone(); o.material.map = texOf(c); o.material.emissiveMap = o.material.map; o.material.needsUpdate = true; } }); }
{ const hide = []; set.scene.traverse(o => { if (!o.isMesh) return; const p = new THREE.Vector3(); o.getWorldPosition(p); if (p.x > -4.1 && p.x < -1.9 && p.z > 1.4 && p.z < 2.7 && p.y < 1.9) hide.push(o); }); for (const o of hide) o.visible = false; }
function welcome(w, h) {   // the screen once it faces us: a desktop with a big green tick and a happy face
  const P = new PX(w, h);
  P.fill((x, y) => y < 4 ? [60, 120, 220] : [36 + (y >> 2), 120 + (y >> 1), 200]);
  P.rect(1, 1, 10, 2, [230, 240, 255]);
  for (let i = 0; i < 3; i++) { P.rect(2, 7 + i * 6, 4, 4, [250, 230, 120]); P.rect(2, 12 + i * 6, 4, 1, [230, 240, 255]); }
  const cx = w / 2 + 4 | 0, cy = h / 2 + 2 | 0; P.ellipse(cx, cy, 8, 8, [250, 250, 246]); P.ellipse(cx, cy, 7, 7, [120, 220, 90]);
  P.set(cx - 3, cy - 2, [20, 60, 20]); P.set(cx + 2, cy - 2, [20, 60, 20]); P.rect(cx - 3, cy + 2, 6, 1, [20, 60, 20]); P.set(cx - 4, cy + 1, [20, 60, 20]); P.set(cx + 3, cy + 1, [20, 60, 20]);
  return P.done();
}
const props = buildProps3x(set.scene, -2.92, 2.2, { screen: welcome, cupX: -.5 });
const hero = makeChar3('hero'), cust = makeChar3('cust');
for (const c of [hero, cust]) { c.root.userData.test = 1; set.scene.add(c.root); }
hero.root.position.set(-3.45, 0, 1.72); cust.root.position.set(-2.44, 0, 2.78);

window.DUR = DUR;
window.TEXTS = t => VO.filter(v => t >= v.box[0] && t < v.box[1]).map(v => v.sub);
const EVL = [];
for (const v of VO) EVL.push({ t: v.t, type: 'vo', id: v.id, sub: v.sub });
EVL.push({ t: SPIN[0], type: 'whoosh' }, { t: SPIN[1], type: 'clunk' }, { t: SPIN[1] + .05, type: 'boot' }, { t: 5.55, type: 'sting' }, { t: 9.0, type: 'ding' });
window.EV = EVL.sort((a, b) => a.t - b.t);

function caption(t) {
  const v = VO.find(o => t >= o.box[0] && t < o.box[1]); if (!v) return;
  const a = Math.min(1, (t - v.box[0]) / .12, (v.box[1] - t) / .12); g.globalAlpha = Math.max(0, a);
  g.font = '700 64px "Pixelify Sans"'; const tw = g.measureText(v.sub).width, bw = Math.max(tw + 80, 420), x0 = (W - bw) / 2, y0 = 1480;
  g.fillStyle = '#1a1016'; g.fillRect(x0 - 6, y0 - 6, bw + 12, 132); g.fillStyle = '#f6f2e8'; g.fillRect(x0, y0, bw, 120);
  g.fillStyle = '#1a1016'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v.sub, W / 2, y0 + 64);
  g.font = '400 34px Silkscreen'; const nw = g.measureText(v.who).width + 36; g.fillStyle = '#1a1016'; g.fillRect(x0 + 18, y0 - 34, nw + 8, 50); g.fillStyle = v.col; g.fillRect(x0 + 22, y0 - 30, nw, 42);
  g.fillStyle = '#1a1016'; g.textAlign = 'left'; g.fillText(v.who, x0 + 40, y0 - 8);
  g.globalAlpha = 1;
}

window.render = t => {
  set.update(5.0, { id: 'desk', a: 2.9, b: 7.3 }, camera, 0);
  set.scene.traverse(o => { const k = o.userData.char; if ((k === 'hero' || k === 'ceo' || k === 'shop') && !o.userData.test) o.visible = false; });
  const u = ss(seg(t, 0, DUR)); camera.position.set(-2.85, lerp(1.58, 1.52, u), lerp(7.0, 6.55, u)); camera.lookAt(-2.85, 1.08, 2.2);
  // the monitor: back to us, then spun round (a little hop) to show the screen
  const sp = ss(seg(t, SPIN[0], SPIN[1])); props.mon.rotation.y = Math.PI * (1 - sp); props.mon.position.y = .74 + Math.sin(Math.PI * sp) * .04;
  props.scrM.emissiveIntensity = t < SPIN[1] ? 0 : .9 + .5 * Math.exp(-(t - SPIN[1]) * 4);
  // the hero
  let hf = 'stare', hk = 0;
  if (t < 2.2) hf = t > 1.0 && t < 1.12 ? 'blink' : 'stare';
  else if (t < 3.1) hf = talking(t, 'h1') ? 'talk' : 'stand';
  else if (t < SPIN[1] + .15) hf = 'point';
  else if (t < 4.4) { hf = 'smile'; hk = .08 * Math.exp(-(t - SPIN[1]) * 8); }
  else if (t < 5.6) hf = talking(t, 'h2') ? 'talkS' : 'smile';
  else if (t < 7.5) hf = t > 6.6 && t < 6.72 ? 'blink' : 'smile';
  else hf = t > 8.95 ? 'talkS' : 'smile';
  // the Customer
  let cf = 'stand', ck = 0;
  if (t < 1.75) { cf = talking(t, 'c1') ? 'talk' : 'demand'; ck = .06 * Math.exp(-t * 6); }
  else if (t < SPIN[1]) cf = 'demand';
  else if (t < 7.5) cf = 'stand';
  else if (t < 8.9) { cf = talking(t, 'c2') ? 'talkDn' : 'stand'; ck = .05 * Math.exp(-(t - 7.5) * 6); }
  else cf = 'smug';
  hero.frame(hf); cust.frame(cf); if (hk) hero.squash(hk); if (ck) cust.squash(ck);
  hero.face(camera, false); cust.face(camera, true);
  props.cup.rotation.y = Math.atan2(camera.position.x - (-2.92 - .5), camera.position.z - 2.4);
  V.fade.value = 1; V.amt.value = .5; V.warm.value = .05; V.contrast.value = .26; V.sat.value = 1.12 * 1.1;
  renderer.toneMappingExposure = 1.08;
  post.bloom.strength = .5; post.bloom.radius = .7; post.bloom.threshold = .9;
  const subj = new THREE.Vector3(-2.88, 1.0, 2.3);
  post.dof.tiltAmt = 5; post.dof.tiltC = .5; post.dof.tiltF = .4; post.dof.tiltW = .3; post.dof.focus = camera.position.distanceTo(subj); post.dof.maxCoc = 5;
  post.composer.render();
  g.clearRect(0, 0, W, H);
  caption(t);
};
window.READY = true;
