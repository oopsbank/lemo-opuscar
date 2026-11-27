// Pixel Life: 2× sprite design test. The IT office set from Job #8 (frozen at 9 a.m.), the story's own hero and CEO hidden,
// and a small stage in front of the help desk with the hero and the Customer.
//   ?mode=old|new&still=1   the comparison pose (old sprites or the new 2× sprites)
//   ?mode=new               the 4 s loop: the hero walks in, the Customer makes a demand, he panics and runs off (loops)
//   ?sheet=1                the new atlases, magnified, on the overlay canvas
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { buildOffice } from './office.js';
import { overlayReady, W, H } from './ui.js';
import { makeChar } from './chars.js';
import { makeCharHD, atlasHD } from './chars_hd.js';
import { makeChar3, atlas3 } from './chars_3x.js';
import { buildProps3x } from './props3x.js';
import { seg, ss, lerp } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 2), MODE = Q.get('mode') || 'new', STILL = Q.has('still');
await overlayReady();
const ov = document.getElementById('ov'), g = ov.getContext('2d');
if (Q.has('sheet')) {
  g.fillStyle = '#7c828e'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = false;
  let y = 10; for (const k of ['hero', 'cust']) { const A = (Q.get('mode') === '3x' ? atlas3 : atlasHD)(k), s = 2, per = 6, fw = A.canvas.width / A.n;
    for (let i = 0; i < A.n; i++) { const r = Math.floor(i / per), c = i % per; g.drawImage(A.canvas, i * fw, 0, fw, A.canvas.height, 10 + c * (fw * s + 6), y + r * (A.canvas.height * s + 6), fw * s, A.canvas.height * s); }
    y += Math.ceil(A.n / per) * (A.canvas.height * s + 6) + 10; }
  window.DUR = 1; window.render = () => {}; window.READY = true;
} else {
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

// extend the carpet towards the camera (the film never looks at the diorama's front edge; this stage does)
{ let fl = null; set.scene.traverse(o => { if (!fl && o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (Math.abs(b.max.x - b.min.x - 17.2) < .01 && Math.abs(b.max.z - b.min.z - 8.2) < .01) fl = o; } });
  if (fl) { const ext = fl.clone(); ext.position.z += 8.0; ext.position.y -= .003; set.scene.add(ext); } else console.warn('floor not found'); }
const mk = MODE === '3x' ? makeChar3 : MODE === 'new' ? makeCharHD : makeChar;
const hero = mk('hero'), cust = mk('cust');
for (const c of [hero, cust]) { c.root.userData.test = 1; set.scene.add(c.root); }
const Z = 2.75, XH = -3.3, XC = -2.55, DUR = 4.0;
let props = null;
if (MODE === '3x') {   // replace the help desk behind the stage with the 3× desk, monitor, keyboard and mug
  const hide = []; set.scene.traverse(o => { if (!o.isMesh || o.userData.test) return; const p = new THREE.Vector3(); o.getWorldPosition(p); if (p.x > -4.1 && p.x < -1.9 && p.z > 1.4 && p.z < 2.7 && p.y < 1.9) hide.push(o); });
  for (const o of hide) o.visible = false;
  props = buildProps3x(set.scene, -2.92, 2.2);
}
const CAM = { p: [-2.92, 1.38, 7.1], l: [-2.92, .98, Z] };

window.DUR = DUR;
window.EV = [];
window.TEXTS = () => [];
window.render = t => {
  set.update(5.0, { id: 'desk', a: 2.9, b: 7.3 }, camera, 0);   // the office at 9 a.m., lights on
  set.scene.traverse(o => { const k = o.userData.char; if ((k === 'hero' || k === 'ceo') && !o.userData.test) o.visible = false; });
  camera.position.set(...CAM.p); camera.lookAt(...CAM.l);
  // the stage
  let hx = XH, hf = 'stand', hflip = false, hk = 0, cf = 'smug', ck = 0;
  if (STILL) { hf = 'talk'; cf = 'talk'; }
  else {
    const wk = Math.floor(t * 8) % 4, rk = Math.floor(t * 12) % 4;
    if (t < 1.3) { hx = lerp(-4.85, XH, seg(t, 0, 1.3)); hf = 'w' + wk; }
    else if (t < 1.6) hf = t < 1.45 ? 'stand' : 'blink';
    else if (t < 2.35) { hf = 'stare'; cf = 'talk'; ck = .1 * Math.exp(-(t - 1.6) * 9); }
    else if (t < 2.95) { hf = Math.floor(t * 10) % 2 ? 'shock' : 'shock1'; hk = .16 * Math.exp(-(t - 2.35) * 8); cf = 'demand'; }
    else { hx = lerp(XH, -5.0, ss(seg(t, 2.95, 3.95)) * .2 + seg(t, 2.95, 3.95) * .8); hf = 's' + rk; hflip = true; cf = 'smug'; }
  }
  hero.root.position.set(hx, 0, Z); cust.root.position.set(XC, 0, Z + .02);
  hero.frame(hf); cust.frame(cf);
  if (hk) hero.squash(hk); if (ck) cust.squash(ck);
  hero.face(camera, hflip); cust.face(camera, true);
  if (props) props.cup.rotation.y = Math.atan2(camera.position.x - (-2.92 + .16), camera.position.z - 2.4);
  V.fade.value = 1; V.amt.value = .5; V.warm.value = .04; V.contrast.value = .26; V.sat.value = 1.12 * 1.1;
  renderer.toneMappingExposure = 1.06;
  post.bloom.strength = .55; post.bloom.radius = .7; post.bloom.threshold = .9;
  const subj = new THREE.Vector3(-2.95, 1.0, Z);
  post.dof.tiltAmt = 4; post.dof.tiltC = .45; post.dof.tiltF = .45; post.dof.tiltW = .3; post.dof.focus = camera.position.distanceTo(subj); post.dof.maxCoc = 4;
  post.composer.render();
  g.clearRect(0, 0, W, H);
};
window.READY = true;
}
