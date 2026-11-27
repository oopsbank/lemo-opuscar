// You Are a Returns Desk Clerk (Job #5) — 2.5D Pixel Art, vertical 1080×1920
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt, events, T, sceneT, shakeAt } from './story.js';
import { buildStore } from './store.js';
import { drawOverlay, overlayReady, texts, W, H } from './ui.js';
import { seg, ss, lerp } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 2);
await overlayReady();   // the pixel fonts are also used for the signs in the set
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 400);
const set = buildStore();
const post = makePost(renderer, set.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;

// the grade over the day: a calm cool morning → hot and harsh as the queue grows → red at GAME OVER → morning again for the loop
const KEYS = [[0, [.02, .26, 1.08, .98]], [15.5, [.02, .26, 1.08, .98]], [17.5, [.16, .34, 1.16, 1.05]], [25.8, [.16, .34, 1.16, 1.05]], [26.2, [.3, .36, .8, .9]], [30.3, [.3, .36, .8, .9]], [30.6, [.02, .26, 1.08, .98]], [DUR, [.02, .26, 1.08, .98]]];
const grade = t => { let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++; const [a, A] = KEYS[i], [b, Bv] = KEYS[i + 1], u = ss(seg(t, a, b)); return A.map((v, k) => lerp(v, Bv[k], u)); };

const _v = new THREE.Vector3();
window.SCENE = set.scene;   // for the set-density count (tools)
window.DUR = DUR;
window.EV = events();
window.TEXTS = t => texts(t);
window.render = t => {
  if (Q.has('textonly')) { drawOverlay(t); return; }   // fast path for the reading-time check
  const ts = sceneT(t), shot = shotAt(ts);
  const [warm, contrast, sat, expo] = grade(t);
  V.fade.value = 1; V.amt.value = .5; V.warm.value = warm; V.contrast.value = contrast; V.sat.value = sat * 1.1;
  const hook = shot.id === 'slam' || shot.id === 'slamEnd' || t < 2;   // the hook: brighter, and sharp except at the outer edge
  renderer.toneMappingExposure = expo * (shot.id === 'receipt' ? .82 : hook ? 1.06 : 1);
  post.bloom.strength = .55; post.bloom.radius = .7; post.bloom.threshold = .9;
  const subj = set.update(ts, shot, camera, shakeAt(t));
  camera.updateMatrixWorld(); _v.copy(subj).project(camera);
  const wide = shot.id === 'queue';
  const c = Math.min(.8, Math.max(.2, _v.y * .5 + .5));
  post.dof.tiltAmt = wide ? 12 : 16; post.dof.tiltC = c; post.dof.tiltF = .26; post.dof.tiltW = wide ? .16 : .09;
  post.dof.focus = camera.position.distanceTo(subj); post.dof.maxCoc = shot.id === 'receipt' && ts >= 13.2 ? 14 : 22;
  if (hook) { post.dof.tiltAmt = 5; post.dof.tiltW = .32; post.dof.tiltF = .2; post.dof.tiltC = .5; post.dof.maxCoc = 6; }
  if (Q.has('nodof')) { post.dof.maxCoc = 0; post.dof.tiltAmt = 0; }
  post.composer.render();
  drawOverlay(t);
};
window.READY = true;
