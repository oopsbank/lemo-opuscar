// You Are a Night Museum Guard — 2.5D Pixel Art, vertical 1080×1920
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt, events, T } from './story.js';
import { buildMuseum } from './museum.js';
import { drawOverlay, overlayReady, texts, W, H } from './ui.js';
import { seg, ss, lerp } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 2);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(40, W / H, .3, 2000);
const set = buildMuseum();
const post = makePost(renderer, set.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
await overlayReady();

const _v = new THREE.Vector3();
window.DUR = DUR;
window.EV = events();
window.TEXTS = t => texts(t);
window.render = t => {
  const shot = shotAt(t);
  if (Q.has('textonly')) { drawOverlay(t); return; }   // fast path for the reading-time check
  const dawn = ss(seg(t, T.dawn, T.dawn + .8));
  V.fade.value = 1; V.amt.value = .62; V.warm.value = lerp(.04, .14, dawn); V.contrast.value = .26; V.sat.value = 1.05 * 1.16;
  post.bloom.strength = .6; post.bloom.radius = .75; post.bloom.threshold = .82;
  const subj = set.update(t, shot, camera, post, renderer);
  // tilt-shift: the sharp band follows the subject's projected height (a strip across the floor plan in the high wides)
  camera.updateMatrixWorld(); _v.copy(subj).project(camera);
  const far = shot.id === 'plan' && t < 4.5 || shot.id === 'dawn' && t < 53;
  const c = Math.min(.8, Math.max(.2, _v.y * .5 + .5));
  post.dof.tiltAmt = 17; post.dof.tiltC = c; post.dof.tiltF = .26;
  post.dof.tiltW = far ? .12 : shot.id === 'close' ? .1 : shot.id === 'dawn' ? lerp(.08, .045, ss(seg(t, 57, 61))) : .075;
  post.dof.maxCoc = Math.max(post.dof.maxCoc, 24);
  if (Q.has('nodof')) { post.dof.maxCoc = 0; post.dof.tiltAmt = 0; }
  if (Q.has('nobloom')) post.bloom.enabled = false;
  post.composer.render();
  drawOverlay(t);
};
window.READY = true;
