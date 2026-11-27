// "Home Row" — why do the F and J keys have bumps? (Toon on Set, 1080×1920, 24 fps). Page contract: window.READY, window.render(t), window.DUR, window.TEXTS, window.EV.
// Cast (fixed for the channel): Gus, the confidently wrong one; Nana, the one who knows. Skeleton: Gus test (a blindfold dare). Opening: (a) Gus mid-wrong-action (filing the bump off F).
// Debug: ?fast (no supersampling) · ?ssaa=1.5 · ?nocap · ?dur=1
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eo, eio, ei, back, hash } from '/core/lib.js';
import { makeLight } from './set.js';
import { buildOffice } from './office.js';
import { buildKeyboard, buildMonitor, makeHand } from './kb.js';
import { Card } from './card.js';
import { HAIR, BACK } from './cast.js';
import { drawCaps } from './caps.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('800 92px Baloo2');
const STORY = await (await fetch('story.json')).json();

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), og = ov.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, .005, 200);
const SSAA = QS.has('fast') ? 1 : +(QS.get('ssaa') ?? 2);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .18; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .34; post.vig.uniforms.warm.value = .48; post.vig.uniforms.contrast.value = .25; post.vig.uniforms.sat.value = 1.15;

// a sunny study: the sun from the front-left, a warm room, a cool rim from behind
const L = makeLight(scene, renderer, { sun: '#ffe2b8', sunI: 3.0, sky: '#f0e2cc', ground: '#9a7456', hemiI: 1.2, envI: .5, fog: '#efe2cc' });
const bounce = new THREE.DirectionalLight('#ffe8cc', .45); bounce.position.set(2, 2, 3); scene.add(bounce);
const rim = new THREE.DirectionalLight('#cfe0ff', 1.1); rim.position.set(.6, 2.2, -3); scene.add(rim);
const n0 = scene.children.length;
const K = buildOffice(scene), DY = K.DY;
// clear the desk where the keyboard and the monitor go
for (const o of scene.children.slice(n0)) { const p = o.position; if (p.y > DY - .01 && p.y < DY + .15 && ((p.x > -.45 && p.x < .7 && p.z > -.16 && p.z < .2) || (p.x > .5 && p.x < 1.0 && p.z > -.5 && p.z < -.1))) o.visible = false; }
K.puddle.visible = false; K.mug.position.set(-.62, DY, -.22);
const KB = buildKeyboard(scene, DY, new THREE.Vector3(0, 0, .02));
const MON = buildMonitor(scene, new THREE.Vector3(.74, DY, -.3), -.55);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(vec3(.45, .33, .24), vec3(.95, .88, .76), smoothstep(-.3, .35, d.y));
    c += vec3(2., 1.9, 1.7) * smoothstep(.8, .95, dot(d, normalize(vec3(-1., .4, .6)))); gl_FragColor = vec4(c, 1.); }` })));
L.bakeEnv = () => { scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, .02).texture; scene.environmentIntensity = .55; };

// —— cast ——
const gus = new Card(scene, { shirt: '#5b93d3', pants: '#2b3d63', shoes: '#2a2226', mustache: '#8a5a2b', hair: HAIR.side('#8a5a2b'),
  detail: (T, lw) => { T.shape([[-18, -96], [-6, -96], [-3, -78], [-21, -78]], { fill: '#4a78b0', lw: lw * .5 }); T.line([[-14, -102], [-14, -90]], lw * .9, '#ff8fa8'); } });   // a spare nail file in the pocket
const nana = new Card(scene, { height: 1.55, shirt: '#7d5aa8', pants: '#5a4378', shoes: '#4a2f2a', cheeks: '#f0a0a0', glasses: true, hair: HAIR.bun('#b8b2ab'), back: BACK.bun('#b8b2ab'),
  detail: (T, lw) => { T.shape([[-15, -100], [15, -100], [21, -50], [0, -46], [-21, -50]], { fill: '#f6ecd8', lw: lw * .6, shade: () => T.fillOnly([[6, -100], [15, -100], [21, -50], [8, -48]], '#e3d5bb') }); } });
const cards = [gus, nana];
const SUN_TINT = new THREE.Color(1.05, 1.02, .95), SHADE_TINT = new THREE.Color(.95, .92, .9);
const ray = new THREE.Raycaster();
function sunlit(p, dir) { ray.set(p, dir); ray.far = 20; ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.castShadow && h.object.visible && !cards.some(c => c.group === h.object.parent)); return hits.length ? 0 : 1; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LV = (a, b, u) => a.clone().lerp(b, u);
// hands for the typing macros: Gus's (blue cuffs) and Nana's (purple cuffs)
const HG = [makeHand(scene, -1, '#5b93d3'), makeHand(scene, 1, '#5b93d3')], HN = [makeHand(scene, -1, '#7d5aa8'), makeHand(scene, 1, '#7d5aa8')];
// the nail file (3D, for the macros)
const fileM = new THREE.MeshStandardMaterial({ color: '#ff8fa8', roughness: .85 });
const FILE = new THREE.Group(); { const b = new THREE.Mesh(new THREE.BoxGeometry(.016, .003, .2), fileM); b.position.z = -.1; b.castShadow = true; FILE.add(b);
  const g2 = new THREE.Mesh(new THREE.BoxGeometry(.017, .0032, .06), new THREE.MeshStandardMaterial({ color: '#e86a8a', roughness: .9 })); g2.position.z = -.17; FILE.add(g2); } scene.add(FILE);

// —— acting helpers ——
const on12 = t => Math.floor(t * 12 + 1e-6) / 12;
const VOX = await (await fetch('voices.json')).json();
function talk(who, t) {
  t = on12(t);
  for (const k in VOX) { const e = VOX[k]; if (e.who !== who) continue; const i = Math.floor((t - e.at) * e.rate);
    if (i >= 0 && i < e.v.length) { const v = e.v[i]; return v > .12 ? { mouth: 'o', open: Math.min(1, v * 1.1) } : { mouth: 'flat' }; } }
  return null;
}
const blink = (t, seed) => ((t + seed * 1.7) % 3.1) < .1 ? 1 : 0;
function handWorld(card, h, fwd = .05) {
  const right = V(camera.position.x - card.pos.x, 0, camera.position.z - card.pos.z).normalize(); const r = V(right.z, 0, -right.x);
  return card.pos.clone().addScaledVector(r, h[0] / 100 * card.scale).add(V(0, -h[1] / 100 * card.scale, 0)).addScaledVector(right, fwd);
}

// —— staging ——
const SUN = V(-.6, .62, .5).normalize();
const G0 = V(-.2, 0, -.55), N0 = V(.3, 0, -.55), GF = V(-.17, 0, -.3);   // GF: Gus leaning in over the keys to file
const KEY = n => KB.world(n);
const FILEHAND = [26, -86];   // Gus's drawn right fist, holding the file's far end
const SCRUB = t => Math.sin(t * 26);   // the file rubbing back and forth
// the file from Gus's fist down onto a key, rubbing along its length
function fileOn(n, t, amp = 1) {
  FILE.visible = true; const k = KEY(n).add(V(0, .0035, .006)), hnd = handWorld(gus, FILEHAND, .06);
  const d = k.clone().sub(hnd), along = d.clone().normalize();
  const p = k.clone().addScaledVector(along, .012 * SCRUB(t) * amp);
  FILE.position.copy(p).addScaledVector(along, -0.0); FILE.lookAt(p.clone().sub(along)); FILE.position.copy(p);
  return p;
}
// fingers: a typing pattern over a key list; the hand whose index sits on `home` moves its nearest finger to each key
const LEFT_KEYS = new Set('QWERTASDFGZXCVB12345`'.split('')), FIN = { A: 0, Q: 0, Z: 0, '1': 0, S: 1, W: 1, X: 1, '2': 1, D: 2, E: 2, C: 2, '3': 2, F: 3, R: 3, V: 3, G: 3, T: 3, B: 3, '4': 3, '5': 3,
  J: 0, U: 0, M: 0, H: 0, Y: 0, N: 0, '6': 0, '7': 0, K: 1, I: 1, ',': 1, '8': 1, L: 2, O: 2, '.': 2, '9': 2, ';': 3, P: 3, '/': 3, '0': 3 };
function hands(HH, homeL, homeR, t, seq, t0, rate, shift = 0, lift = .012) {
  // seq: keys pressed one after another from t0 at `rate` keys/s; the hand doing the key reaches over (its index slides by the key's offset from its home)
  const i = Math.floor((t - t0) * rate), ph = (t - t0) * rate - i, cur = i >= 0 && i < seq.length ? seq[i] : null;
  for (const n in KB.keys) KB.press(n, 0);
  let offL = V(0, 0, 0), offR = V(0, 0, 0);
  if (cur) {
    const left = LEFT_KEYS.has(cur), home = left ? homeL : homeR, f = FIN[cur] ?? 0, k = KEY(cur);
    const homeFinger = KEY(home).add(V((left ? f - 3 : f) * KB.P, 0, 0));
    const off = k.clone().sub(homeFinger); off.y = 0; const dn = Math.sin(Math.PI * clamp(ph * 1.4));
    (left ? offL : offR).copy(off).add(V(0, -.008 * dn, 0));
    const pressed = shift ? keyRight(cur, shift) : cur; KB.press(pressed, dn);
  }
  HH[0].group.visible = HH[1].group.visible = true;
  HH[0].placeIndexOn(KEY(homeL).add(offL).add(V(shift * KB.P, 0, 0)), lift); HH[1].placeIndexOn(KEY(homeR).add(offR).add(V(shift * KB.P, 0, 0)), lift);
  return cur;
}
const ROWSTR = ['`1234567890-=', 'QWERTYUIOP[]', "ASDFGHJKL;'", 'ZXCVBNM,./'];
function keyRight(n, s) { for (const r of ROWSTR) { const i = r.indexOf(n); if (i >= 0) return r[i + s] ?? n; } return n; }
const typed = (str, t, t0, rate) => str.slice(0, clamp(Math.floor((t - t0) * rate) + 1, 0, str.length));

const SHOTS = [
  { t0: 0, t1: 1.75, name: 'file',   // (a) Gus mid-wrong-action: filing the bump off F, sparks; his face right behind
    cam: u => ({ pos: LV(V(-.06, 1.13, .72), V(-.07, 1.12, .66), ss(u / 1.75)), look: V(-.15, .99, -.35), fov: 50, focus: .72, aper: 9 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(GF);
      gus.pose = { rh: FILEHAND, bendR: -10, lh: [-30, -88], bendL: 12, brows: 'angry', mouth: 'teeth', look: [.6, 1], turn: .2, lean: .06, sq: 1 + .04 * Math.exp(-tc * 7) * Math.cos(tc * 28), ...(talk('gus', tc) ?? {}) };
      fileOn('F', tc); KB.setBump('F', lerp(1, .8, clamp(tc / 1.75))); } },
  { t0: 1.75, t1: 3.6, name: 'fixing',   // "Factory mistake. I'm fixing it!" — proud, file up like a trophy; Nana behind him, unimpressed
    cam: u => ({ pos: LV(V(.05, 1.38, 1.95), V(.05, 1.36, 1.8), ss(u / 1.85)), look: V(.05, 1.08, -.4), fov: 42, focus: 1.9, aper: 18 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(G0); nana.pos.copy(N0);
      const up = eo(clamp((tc - 1.8) / .3));
      gus.pose = { rh: [lerp(30, 40, up), lerp(-86, -150, up)], bendR: -16, rprop: { kind: 'file', ang: .3 }, lh: [-36, -84], bendL: 10, brows: 'up', mouth: 'grin', open: .3, look: [.4, -.2], turn: .1, ...(talk('gus', tc) ?? {}) };
      nana.pose = { lh: [16, -86], rh: [-16, -84], bendL: 14, bendR: -14, brows: 'skeptic', mouth: 'flat', look: [-.9, .2], turn: -.3, blink: blink(tc, 2) };
      KB.setBump('F', .8); } },
  { t0: 3.6, t1: 5.85, name: 'dare',   // "Then type your name. Eyes shut." — the sleep mask dangling from her finger
    cam: u => ({ pos: LV(V(.36, 1.27, .55), V(.36, 1.27, .45), ss(u / 2.25)), look: V(.32, 1.15, -.62), fov: 38, focus: 1.0, aper: 28 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const up = ei(seg(tc, 3.7, 4.0));
      nana.pose = { lh: [-26, -80], rh: [lerp(30, 40, up), lerp(-84, -140, up)], bendR: -14, rprop: up > .2 ? { kind: 'mask', ang: .1 * Math.sin(tc * 5) } : null, brows: tc < 4.6 ? 'skeptic' : 'up', mouth: tc < 5.3 ? 'flat' : 'smile', look: [-.4, -.1], turn: -.15, ...(talk('nana', tc) ?? {}) }; } },
  { t0: 5.85, t1: 6.75, name: 'blind',   // "Easy!" — masked, typing fast and sure, his hands one key off
    cam: u => ({ pos: LV(V(-.02, 1.2, .62), V(-.02, 1.16, .56), ss(u / .9)), look: V(-.04, .9, -.2), fov: 46, focus: .7, aper: 10 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { lh: [-34, -84], rh: [34, -84], bendL: 10, bendR: -10, mask: true, brows: 'up', mouth: 'grin', open: .3, turn: 0, lean: .05, ...(talk('gus', tc) ?? {}) };
      hands(HG, 'F', 'J', tc, 'GUS', 5.95, 4.5, 1); KB.setBump('F', .8);
      MON.setScreen(typed('HID', tc, 5.95, 4.5)); } },
  { t0: 6.75, t1: 7.3, name: 'wrong',   // the screen: HID — ❌ WRONG
    cam: u => { const s = MON.screenWorld(); return { pos: s.clone().add(V(-.22, .02, .42)), look: s.clone().add(V(0, -.01, 0)), fov: 40, focus: .48, aper: 10 }; },
    set(u, tc) { gus.visible = nana.visible = false; MON.setScreen('HID', false, '#e8231a'); } },
  { t0: 7.3, t1: 8.4, name: 'actually',   // "Actually…"
    cam: u => ({ pos: LV(V(.34, 1.25, .5), V(.34, 1.25, .38), ss(u / 1.1)), look: V(.32, 1.15, -.62), fov: 36, focus: 1.0, aper: 30 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(N0);
      const push = ei(seg(tc, 7.35, 7.65));
      nana.pose = { armsFront: tc < 7.9 && push > .3, lh: [-30, -76], rh: tc < 7.9 ? [lerp(30, 6, push), lerp(-80, -146, push)] : [34, -80], bendR: -12, brows: 'skeptic', mouth: 'flat', look: [-.2, 0], turn: -.1, ...(talk('nana', tc) ?? {}) }; } },
  { t0: 8.4, t1: 10.7, name: 'bumps',   // "The bumps are for your index fingers." — macro on F and J; the two index fingers come down onto them
    cam: u => { const c = KEY('G').lerp(KEY('H'), .5); return { pos: c.clone().add(V(0, .3 - .04 * ss(u / 2.3), .3 - .04 * ss(u / 2.3))), look: c.clone().add(V(0, 0, -.01)), fov: 40, focus: .4, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; KB.setBump('F', .8);
      const dn = ei(seg(tc, 9.4, 10.0)); KB.hot('F', clamp((tc - 8.6) / .3)); KB.hot('J', clamp((tc - 8.6) / .3));
      HN[0].group.visible = HN[1].group.visible = true; HN[0].placeIndexOn(KEY('F'), lerp(.16, .006, dn)); HN[1].placeIndexOn(KEY('J'), lerp(.16, .006, dn)); } },
  { t0: 10.7, t1: 13.4, name: 'home',   // "Feel them, and you're home. No looking." — the other six fingers settle; the home row lights up
    cam: u => { const c = KEY('G').lerp(KEY('H'), .5); return { pos: c.clone().add(V(0, .42, .4 - .05 * ss(u / 2.7))), look: c.clone().add(V(0, 0, -.03)), fov: 44, focus: .55, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; KB.setBump('F', .8);
      for (const [i, n] of ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'].entries()) KB.hot(n, clamp((tc - 11.2 - Math.abs(i - 3.5) * .08) / .2));
      HN[0].group.visible = HN[1].group.visible = true; HN[0].placeIndexOn(KEY('F'), .006); HN[1].placeIndexOn(KEY('J'), .006); } },
  { t0: 13.4, t1: 15.1, name: 'touch',   // "That's touch typing." — Nana, eyes shut, types like the wind; the screen fills
    cam: u => ({ pos: LV(V(.08, 1.22, .66), V(.08, 1.2, .6), ss(u / 1.7)), look: V(.1, .92, -.25), fov: 46, focus: .75, aper: 10 }),
    set(u, tc) { gus.visible = false; nana.visible = true; nana.pos.copy(V(.02, 0, -.55));
      nana.pose = { lh: [-30, -84], rh: [30, -84], bendL: 10, bendR: -10, blink: 1, brows: 'up', mouth: 'smile', turn: 0, ...(talk('nana', tc) ?? {}) };
      hands(HN, 'F', 'J', tc, 'HOMEROWHEROGUS', 13.5, 9); MON.setScreen(typed('HOME ROW HERO', tc, 13.5, 9), true, '#1c1418', 110); } },
  { t0: 15.1, t1: 15.9, name: 'retry',   // Gus again, masked: index fingers on the bumps now — G, U, S
    cam: u => ({ pos: LV(V(-.02, 1.2, .62), V(-.02, 1.16, .56), ss(u / .8)), look: V(-.04, .9, -.2), fov: 46, focus: .7, aper: 10 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(G0);
      gus.pose = { lh: [-34, -84], rh: [34, -84], bendL: 10, bendR: -10, mask: true, brows: 'worried', mouth: 'flat', turn: 0, lean: .05 };
      hands(HG, 'F', 'J', tc, 'GUS', 15.2, 5); KB.setBump('F', .8); KB.hot('F', .6); KB.hot('J', .6); MON.setScreen(typed('GUS', tc, 15.2, 5)); } },
  { t0: 15.9, t1: 17.4, name: 'gus',   // "Look! It says GUS!" — mask up on his forehead, the screen beside him: DING
    cam: u => ({ pos: LV(V(.3, 1.3, 1.1), V(.3, 1.29, 1.0), ss(u / 1.5)), look: V(.35, 1.1, -.4), fov: 40, focus: 1.3, aper: 16 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(V(.1, 0, -.55));
      gus.pose = { lh: [-40, -90], rh: [lerp(30, 50, ei(seg(tc, 15.95, 16.2))), lerp(-84, -130, ei(seg(tc, 15.95, 16.2)))], bendR: -16, brows: 'up', mouth: 'grin', open: .4, look: [1, 0], turn: .3, ...(talk('gus', tc) ?? {}) };
      MON.setScreen('GUS', false, '#3f8a5a'); } },
  { t0: 17.4, t1: 19.3, name: 'five',   // "Even the five has one." — the number pad; Nana's middle finger finds the 5
    cam: u => { const c = KEY('N5'); return { pos: c.clone().add(V(-.02, .28 - .03 * ss(u / 1.9), .28 - .03 * ss(u / 1.9))), look: c.clone(), fov: 40, focus: .38, aper: 8 }; },
    set(u, tc) { gus.visible = nana.visible = false; const dn = ei(seg(tc, 18.0, 18.5));
      KB.hot('N5', clamp((tc - 17.6) / .3)); HN[1].group.visible = true; HN[1].placeIndexOn(KEY('N4'), lerp(.14, .006, dn)); } },
  { t0: 19.3, t1: 22.6, name: 'already',   // "Then that one's a mistake too!" — he's already filing it; Nana facepalms behind
    cam: u => ({ pos: LV(V(.52, 1.14, .74), V(.5, 1.13, .68), ss(u / 3.3)), look: V(.38, .99, -.35), fov: 50, focus: .72, aper: 9 }),
    set(u, tc) { gus.visible = nana.visible = true; gus.pos.copy(V(.36, 0, -.3)); nana.pos.copy(V(-.05, 0, -.6));
      gus.pose = { rh: FILEHAND, bendR: -10, lh: [-30, -88], bendL: 12, brows: 'angry', mouth: 'teeth', look: [.6, 1], turn: .2, lean: .06, ...(talk('gus', tc) ?? {}) };
      nana.pose = { armsFront: tc > 20.4, lh: [-20, -88], rh: tc > 20.4 ? [6, -146] : [30, -84], bendR: -12, brows: tc > 20.4 ? 'worried' : 'skeptic', mouth: 'flat', look: [.6, .3], turn: .2, blink: tc > 20.4 ? 1 : blink(tc, 1) };
      fileOn('N5', tc); KB.setBump('N5', lerp(1, .45, clamp((tc - 19.3) / 3))); } },
  { t0: 22.6, t1: 24.9, name: 'loop',   // "Hold still, little bump." — back on F; the last frame is frame 0
    cam: u => ({ pos: LV(V(-.07, 1.12, .66), V(-.06, 1.13, .72), 0), look: V(-.15, .99, -.35), fov: 50, focus: .72, aper: 9 }),
    set(u, tc) { gus.visible = true; nana.visible = false; gus.pos.copy(GF);
      gus.pose = { rh: FILEHAND, bendR: -10, lh: [-30, -88], bendL: 12, brows: 'angry', mouth: 'teeth', look: [.6, 1], turn: .2, lean: .06, ...(talk('gus', tc) ?? {}) };
      fileOn('F', tc, clamp((tc - 22.8) / .3)); KB.setBump('F', 1); } },
];
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
function setProps(t, S) {
  FILE.visible = false; for (const h of [...HG, ...HN]) h.group.visible = false;
  KB.reset(); MON.setScreen('');
  for (const o of K.backRow) o.visible = ['bumps', 'home', 'five'].includes(S.name);
  K.updateMotes(t);
}

// —— overlays ——
function proj(P) { const p = P.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function ring(P, t, t0, R0 = 70, col = '#ff3b30') {
  const k = clamp((t - t0) / .3); if (k <= 0) return; const c = proj(P);
  og.save(); og.strokeStyle = col; og.lineWidth = 14; og.lineCap = 'round'; og.shadowColor = 'rgba(0,0,0,.35)'; og.shadowBlur = 8;
  og.beginPath(); const a0 = -2.2; for (let a = 0; a <= Math.PI * 2.15 * ss(k); a += .05) { const w = 1 + .05 * Math.sin(a * 3); const x = c[0] + Math.cos(a0 + a) * R0 * w, y = c[1] + Math.sin(a0 + a) * R0 * .8 * w; a === 0 ? og.moveTo(x, y) : og.lineTo(x, y); }
  og.stroke(); og.restore();
}
function title(t) {   // the question, slammed in big at the top in the first second, gone by 1.5 s
  if (t > 1.5) return;
  const s = t < .09 ? lerp(1.08, 1, ei(clamp(t / .09))) : 1 + .02 * Math.exp(-(t - .18) * 8) * Math.cos((t - .18) * 30), out = clamp((1.5 - t) / .12);
  og.save(); og.translate(W / 2, H * .2); og.scale(s, s); og.globalAlpha = out; og.rotate(-.03);
  og.font = '800 108px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const LN = [['WHY DO F AND J', -66], ['HAVE BUMPS?', 66]], fit = Math.min(1, 900 / Math.max(...LN.map(([x]) => og.measureText(x).width))); og.scale(fit, fit);
  for (const [txt, y] of LN) { og.lineWidth = 30; og.strokeStyle = '#000'; og.save(); og.translate(0, 10); og.fillStyle = '#000'; og.strokeText(txt, 0, y); og.fillText(txt, 0, y); og.restore(); og.strokeText(txt, 0, y); og.fillStyle = y > 0 ? '#ffd84a' : '#ffffff'; og.fillText(txt, 0, y); }
  og.restore();
}
function sparks(P, t, n = 14) {   // file sparks flying off the key
  const c = proj(P); og.save(); og.lineCap = 'round';
  for (let i = 0; i < n; i++) { const ph = (t * 3 + hash(i * 1.7)) % 1, a = -Math.PI * (.15 + .7 * hash(i * 3.1)), r = 20 + ph * (120 + 90 * hash(i)), x = c[0] + Math.cos(a) * r, y = c[1] + Math.sin(a) * r + ph * ph * 90;
    og.globalAlpha = 1 - ph; og.strokeStyle = i % 3 ? '#ffd84a' : '#ffffff'; og.lineWidth = 8 * (1 - ph) + 2; og.beginPath(); og.moveTo(x, y); og.lineTo(x - Math.cos(a) * 26, y - Math.sin(a) * 26); og.stroke(); }
  og.restore();
}
function burst(cx, cy, t, t0, col = '#ffffff') {
  const k = t - t0; if (k < 0 || k > .35) return;
  og.save();
  if (k < .085) { og.fillStyle = `rgba(255,255,255,${k < .042 ? .85 : .4})`; og.fillRect(0, 0, W, H); }
  og.strokeStyle = col; og.lineCap = 'round'; og.lineWidth = 14 * (1 - k / .35); og.globalAlpha = 1 - k / .35;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .2, r0 = 90 + k * 500, r1 = r0 + 120; og.beginPath(); og.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); og.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); og.stroke(); }
  og.restore();
}
function pow(txt, x, y, t, t0, dur, col = '#ffd84a', rot = -.12, size = 120) {
  const k = t - t0; if (k < 0 || k > dur) return;
  const sc = k < .1 ? lerp(1.5, 1, ei(k / .1)) : 1 + .03 * Math.sin(k * 30);
  og.save(); og.translate(x, y); og.rotate(rot); og.scale(sc, sc); og.globalAlpha = Math.min(1, (dur - k) / .15);
  og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = size * .22; og.strokeStyle = '#1c1418'; og.strokeText(txt, 0, 0); og.fillStyle = col; og.fillText(txt, 0, 0);
  og.restore();
}
function label(txt, x, y, col = '#ffffff', size = 76, a = 1) {
  og.save(); og.globalAlpha = a; og.font = `800 ${size}px Baloo2`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = size * .24; og.strokeStyle = '#1c1418'; og.strokeText(txt, x, y); og.fillStyle = col; og.fillText(txt, x, y); og.restore();
}
function arrow(x0, y0, x1, y1, col, a = 1, lw = 18) {
  og.save(); og.globalAlpha = a; og.lineCap = 'round'; og.lineJoin = 'round';
  const ang = Math.atan2(y1 - y0, x1 - x0), hd = 34;
  for (const [c, w] of [['#1c1418', lw + 12], [col, lw]]) { og.strokeStyle = c; og.lineWidth = w; og.beginPath(); og.moveTo(x0, y0); og.lineTo(x1, y1); og.moveTo(x1 - Math.cos(ang - .5) * hd, y1 - Math.sin(ang - .5) * hd); og.lineTo(x1, y1); og.lineTo(x1 - Math.cos(ang + .5) * hd, y1 - Math.sin(ang + .5) * hd); og.stroke(); }
  og.restore();
}
function stamp(t, t0) {
  const k = t - t0; if (k < 0) return;
  const s = k < .12 ? lerp(1.9, .95, ei(k / .12)) : .95 + .05 * Math.exp(-(k - .12) * 9) * Math.cos((k - .12) * 30);
  og.save(); og.translate(W / 2, H * .22); og.rotate(-.18); og.scale(s, s); og.globalAlpha = clamp(k / .06);
  const w = 860, h = 250; og.lineJoin = 'round';
  og.fillStyle = 'rgba(255,255,255,.12)'; og.strokeStyle = '#e8231a'; og.lineWidth = 22;
  og.beginPath(); og.roundRect(-w / 2, -h / 2, w, h, 30); og.fill(); og.stroke();
  og.lineWidth = 34; og.lineCap = 'round'; const X = -w / 2 + 115; og.beginPath(); og.moveTo(X - 62, -62); og.lineTo(X + 62, 62); og.moveTo(X + 62, -62); og.lineTo(X - 62, 62); og.stroke();
  og.font = '800 190px Baloo2'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#e8231a'; og.fillText('WRONG', 110, 16);
  og.restore();
}
function confetti(t, t0) {
  const k = t - t0; if (k < 0 || k > 1.6) return;
  og.save(); for (let i = 0; i < 40; i++) { const x = W * hash(i * 1.3), y = -40 + k * (600 + hash(i * 2.7) * 700) + Math.sin(k * 6 + i) * 20; og.fillStyle = ['#ffd84a', '#ff6a8a', '#7be07b', '#9be0ff'][i % 4]; og.save(); og.translate(x, y); og.rotate(k * 8 + i); og.fillRect(-10, -5, 20, 10); og.restore(); } og.restore();
}
function sweat(card, t, t0) {
  const k = t - t0; if (k < 0) return;
  const head = proj(card.pos.clone().add(V(.27 * card.scale, 1.5 * card.scale, .02))), y = head[1] + Math.min(1, k / .6) * 60;
  og.save(); og.fillStyle = '#8fd0ff'; og.strokeStyle = '#1c1418'; og.lineWidth = 6; og.beginPath(); og.moveTo(head[0], y - 46); og.quadraticCurveTo(head[0] + 28, y + 6, head[0], y + 18); og.quadraticCurveTo(head[0] - 28, y + 6, head[0], y - 46); og.fill(); og.stroke(); og.restore();
}

let texts = [];
function render(t) {
  const S = shotAt(t), u = t - S.t0, tc = on12(t);
  setProps(t, S);
  const C = S.cam(u);
  const dist = C.pos.distanceTo(C.look), dr = .006 * dist;
  C.pos = C.pos.clone().add(V(Math.sin(t * .7) * dr, Math.sin(t * .93 + 1) * dr * .7, 0)); C.look = C.look.clone().add(V(Math.sin(t * .61 + 2) * dr * .5, Math.sin(t * .8) * dr * .4, 0));
  camera.fov = C.fov; camera.position.copy(C.pos); camera.lookAt(C.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  S.set(u, tc);
  L.setSun(SUN, V(0, 1, -.5), 4);
  if (!L.baked) { L.bakeEnv(); L.baked = true; }
  for (const c of cards) {
    if (c.visible) c.light = sunlit(c.pos.clone().add(V(0, 1.3 * c.scale, 0)), L.dir);
    c.update(camera, H, L.dir, { sunTint: SUN_TINT, shadeTint: SHADE_TINT, lw: 7, limb: 15 });
  }
  post.dof.focus = C.focus; post.dof.aper = C.aper * .45; post.dof.maxCoc = 18;
  post.composer.render();
  og.clearRect(0, 0, W, H);
  texts = [];
  const N = S.name;
  if (N === 'file') { title(t); const p = KEY('F'); sparks(p, t); ring(p, t, .1, 85); pow('SCRITCH!', W * .76, H * .56, t, .15, .7, '#ffffff', .12, 96); pow('SCRITCH!', W * .26, H * .6, t, .95, .7, '#ffd84a', -.1, 96); }
  if (N === 'fixing') pow('FIXED!', W * .3, H * .3, t, 2.6, .8, '#7be07b', -.12, 110);
  if (N === 'dare') pow('EYES SHUT!', W * .5, H * .26, t, 4.7, 1.0, '#ffd84a', -.08, 104);
  if (N === 'blind') { pow('TAP TAP TAP', W * .5, H * .26, t, 5.95, .75, '#ffffff', -.06, 90); }
  if (N === 'wrong') { stamp(t, 6.8); const s = proj(MON.screenWorld()); label('HID?!', s[0], s[1] + 380, '#ff6a50', 110); }
  if (N === 'bumps') { const f = proj(KEY('F')), j = proj(KEY('J'));
    ring(KEY('F'), t, 8.6, 80, '#ffd84a'); ring(KEY('J'), t, 8.75, 80, '#ffd84a');
    label('BUMP', f[0], f[1] - 220, '#ffd84a', 84, clamp((t - 8.7) / .25)); label('BUMP', j[0], j[1] - 220, '#ffd84a', 84, clamp((t - 8.8) / .25));
    if (t > 9.5) label('INDEX FINGERS', W * .5, H * .2, '#7be07b', 92, clamp((t - 9.5) / .25)); }
  if (N === 'home') { if (t > 11.2) label('HOME ROW', W * .5, H * .2, '#ffd84a', 120, clamp((t - 11.2) / .25)); if (t > 12.2) label('NO LOOKING!', W * .5, H * .28, '#9be0ff', 90, clamp((t - 12.2) / .25)); }
  if (N === 'touch') { pow('ZOOM!', W * .74, H * .28, t, 13.6, .8, '#ffd84a', .12, 104); }
  if (N === 'gus') { const s = proj(MON.screenWorld()); burst(s[0], s[1], t, 15.95, '#7be07b'); pow('DING!', W * .72, H * .2, t, 15.95, .8, '#ffd84a', .1, 110); confetti(t, 15.95); }
  if (N === 'five') { ring(KEY('N5'), t, 17.6, 85, '#ffd84a'); const p = proj(KEY('N5')); label('BUMP!', p[0], p[1] - 230, '#ffd84a', 96, clamp((t - 17.7) / .25)); if (t > 18.6) label('FIND 5, FIND THEM ALL', W * .5, H * .2, '#7be07b', 72, clamp((t - 18.6) / .25)); }
  if (N === 'already') { const p = KEY('N5'); sparks(p, t); pow('SCRITCH!', W * .3, H * .56, t, 19.35, .7, '#ffffff', -.1, 96); if (t > 20.5) { label('FACEPALM', W * .3, H * .2, '#c9b6ff', 70, clamp((t - 20.5) / .2) * clamp((21.8 - t) / .2)); } }
  if (N === 'loop') { const p = KEY('F'); if (t > 22.8) sparks(p, t); if (t > 24.4) ring(p, t, 24.4, 85); }
  if (!QS.has('nocap')) drawCaps(og, STORY.caps, Math.max(t, STORY.caps[0]?.t0 ?? 0), W, H);
}
const EV = [
  { t: 0, type: 'file' }, { t: .15, type: 'pop' }, { t: 1.75, type: 'whoosh' }, { t: 2.6, type: 'pop' }, { t: 3.9, type: 'whoosh' }, { t: 4.7, type: 'pop' },
  { t: 5.95, type: 'type', n: 3, rate: 4.5 }, { t: 6.8, type: 'buzzer' }, { t: 6.8, type: 'stamp' }, { t: 8.6, type: 'tick' }, { t: 9.95, type: 'tap' }, { t: 11.2, type: 'ding' },
  { t: 13.5, type: 'type', n: 14, rate: 9 }, { t: 15.2, type: 'type', n: 3, rate: 5 }, { t: 15.95, type: 'ding' }, { t: 15.95, type: 'cheer' }, { t: 17.6, type: 'tick' }, { t: 18.45, type: 'tap' },
  { t: 19.35, type: 'file' }, { t: 20.5, type: 'slap' }, { t: 22.8, type: 'file' },
];
window.render = render; window.DUR = QS.has('dur') ? +QS.get('dur') : STORY.dur; window.TEXTS = () => texts; window.EV = EV;
window.DBG = { scene, camera, post, K, KB, MON, cards, L, SHOTS };
render(0);
window.READY = true;
