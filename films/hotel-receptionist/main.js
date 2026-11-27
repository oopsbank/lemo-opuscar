// You Are a Hotel Receptionist (Job #4) — 2.5D Pixel Art, vertical 1080×1920
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt, events, T } from './story.js';
import { buildHotel } from './hotel.js';
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
const set = buildHotel();
const post = makePost(renderer, set.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
await overlayReady();

const _v = new THREE.Vector3();
window.SCENE = set.scene;   // for the set-density count (tools)
window.DUR = DUR;
window.EV = events();
window.TEXTS = t => texts(t);
window.render = t => {
  const shot = shotAt(t);
  if (Q.has('textonly')) { drawOverlay(t); return; }   // fast path for the reading-time check
  V.fade.value = 1; V.amt.value = .55; V.warm.value = .1; V.contrast.value = .24; V.sat.value = 1.05 * 1.14;
  post.bloom.strength = .5; post.bloom.radius = .7; post.bloom.threshold = .86;
  const subj = set.update(t, shot, camera, post, renderer);
  // tilt-shift: the sharp band follows the subject's projected height
  camera.updateMatrixWorld(); _v.copy(subj).project(camera);
  const wide = shot.id === 'pull' || (shot.id === 'room7' && t < 16.4) || (shot.id === 'tour' && t < 23.8);
  const c = Math.min(.8, Math.max(.2, _v.y * .5 + .5));
  post.dof.tiltAmt = 17; post.dof.tiltC = c; post.dof.tiltF = .26;
  post.dof.tiltW = wide ? .13 : .085;
  post.dof.maxCoc = Math.max(post.dof.maxCoc, 22);
  if (Q.has('nodof')) { post.dof.maxCoc = 0; post.dof.tiltAmt = 0; }
  if (Q.has('nobloom')) post.bloom.enabled = false;
  post.composer.render();
  drawOverlay(t);
};
window.READY = true;
