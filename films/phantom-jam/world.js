// Pocket City — the harbour town (shared with Engine Nine and Ten Minutes) (static): roads, blocks, canal, quay, sea, trees, fire station
// Axes: x east, z south (toward the sea), y up. Metres.
import * as THREE from 'three';
import { GB } from './geo.js';
import { mulberry, clamp } from '/core/lib.js';

export const U = { time: { value: 0 }, sky: { value: new THREE.Color('#9cc3e6') }, snow: { value: 0 }, ft: { value: 0 }, resnow: { value: 0 }, clearTex: { value: null } };
// the plough map: covers x, z in CLR (metres); R = film time the road there was cleared / 40 (255 = never)
export const CLR = { x0: -560, z0: -360, w: 1120, h: 1160 };

// —— Layout ——
export const NS = [ // north–south streets: centre x, half width
  { x: -380, h: 6 }, { x: -260, h: 6 }, { x: -130, h: 6 }, { x: 0, h: 7 }, { x: 120, h: 6 }, { x: 250, h: 6 }, { x: 380, h: 6 },
];
export const EW = [ // east–west streets: centre z, half width
  { z: -230, h: 6 }, { z: -120, h: 6 }, { z: 120, h: 6 }, { z: 260, h: 6 }, { z: 520, h: 8 }, { z: 630, h: 5 },
];
export const BLVD = { z0: 260, z1: 512, h: 12, med: 1.6 };   // the palm boulevard: main road widened
export const STATION = { x0: -12, x1: 12, z0: -58, z1: -24, h: 8.5, apron: -8 };
export const CANAL = { z0: 640, z1: 666, y: -1.9 };
export const BRIDGE = { x0: 114, x1: 126, z0: 636, z1: 670, hinge0: 640, hinge1: 666 };
export const QUAY = { z0: 666, road0: 740, road1: 752, edge: 792 };
export const WAREHOUSE = { x0: 134, x1: 186, z0: 680, z1: 728, h: 11, ridge: 4.5 };
export const EXT = { x0: -520, x1: 520, z0: -330, z1: 792 };

const FACADE = ['#f6f1e8', '#f1e8d8', '#f4e7cf', '#ebdcc2', '#f7f3ec', '#ead6b8', '#f2dcb6', '#e3eaec', '#ecd0ae', '#f5e6c6', '#f6f1e8', '#efe9df'];
const ACCENT = ['#dc8f62', '#e9bd5e', '#93bdd0', '#e8a98a', '#c9dcb7'];
const FLAT = ['#ece5d6', '#e2d9c8', '#d6ccb9', '#e8e0cf'];
const TILE = ['#b26a4e', '#a65f47', '#bd7658', '#9c5843', '#b87050', '#a8735c'];

// Cloud shadows (world-space noise drifting on the sim clock) + facade windows/shutters, patched into standard materials
const CLOUD = `
  float c_h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float c_n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(c_h(i), c_h(i+vec2(1,0)), f.x), mix(c_h(i+vec2(0,1)), c_h(i+vec2(1,1)), f.x), f.y); }
  float cloudShade(vec2 xz){ vec2 p = xz * .0042 + vec2(uTime * .045, uTime * .018);
    float n = c_n(p) * .55 + c_n(p * 2.1 + 7.3) * .3 + c_n(p * 4.3 - 2.1) * .15;
    return 1. - .32 * smoothstep(.52, .68, n); }`;

// Snow on every upward surface; on roads (ROAD defined) only where the ploughs haven't been yet, and again when it re-snows
const SNOW_GLSL = `
#ifndef NOSNOW
  { float up = smoothstep(.45, .8, vWN.y);
    float amt = uSnow;
    float fl = c_n(vWP.xz * .9) * .5 + c_n(vWP.xz * 3.7) * .5;
  #ifdef ROAD
    vec2 cuv = (vWP.xz - vec2(${CLR.x0.toFixed(1)}, ${CLR.z0.toFixed(1)})) / vec2(${CLR.w.toFixed(1)}, ${CLR.h.toFixed(1)});
    float ct = texture2D(uClear, cuv).r * 40.;
    float cleared = smoothstep(ct - .05, ct + .25, uFt) * step(ct, 39.);
    amt *= 1. - cleared * (1. - smoothstep(fl * .7, fl * .7 + .3, uResnow));
    // wet dark asphalt where cleared, with salt specks
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * .72, cleared);
    diffuseColor.rgb += cleared * step(.93, c_h(floor(vWP.xz * 6.))) * .18;
  #endif
    vec3 sn = vec3(.9, .93, .97) * (.94 + .08 * fl);
    diffuseColor.rgb = mix(diffuseColor.rgb, sn, clamp(amt * up, 0., 1.)); }
#endif`;
export function patchCloud(m, extra = null) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.time; sh.uniforms.uSky = U.sky; sh.uniforms.uSnow = U.snow; sh.uniforms.uFt = U.ft; sh.uniforms.uResnow = U.resnow; sh.uniforms.uClear = U.clearTex;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;' + (extra ? '\nattribute vec3 wp; varying vec3 vWp; varying vec2 vFac;' : ''))
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n{ vec4 _w = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\n_w = instanceMatrix * _w;\n#endif\nvWP = (modelMatrix * _w).xyz; vWN = normalize((vec4(transformedNormal, 0.) * viewMatrix).xyz); }' + (extra ? '\nvWp = wp; vFac = uv;' : ''));
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; uniform float uTime, uSnow, uFt, uResnow; uniform vec3 uSky; uniform sampler2D uClear;' + (extra ? '\nvarying vec3 vWp; varying vec2 vFac;' : '') + CLOUD)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (extra || '') + '\ndiffuseColor.rgb *= cloudShade(vWP.xz);' + SNOW_GLSL);
  };
  return m;
}

// Facade: tall windows with open shutters (Mediterranean), dark reveals, grime toward the ground, ground-floor doors
const FACADE_GLSL = `
  { float gn = c_n(vWP.xz * .6 + vWP.y * .2) * .6 + c_n(vWP.xz * 2.7 - vWP.y * .8) * .4;
    diffuseColor.rgb *= .93 + .12 * gn;
    diffuseColor.rgb *= mix(.8, 1., smoothstep(0., 2.2, vWP.y)); }
  if (vFac.x >= 0. && vWp.x > 0.) {
    vec2 cs = vWp.xy; vec2 qq = vFac / cs; vec2 id = floor(qq); vec2 f = fract(qq);
    float ty = floor(vWp.z / 1000.); float sd = fract(vWp.z / 1000.) * 1000.;
    float ground = step(vFac.y, cs.y);
    float wx = .36, wy0 = .22, wy1 = .82;
    if (ty == 1.) { wx = .38; wy0 = .4; wy1 = .78; }
    if (ty == 2.) { wx = .12; wy0 = .62; wy1 = .84; }
    if (ground > .5 && ty != 2.) { wx = .3; wy0 = .0; wy1 = .78; }
    vec2 fw = fwidth(qq) * 1.2;
    float win = smoothstep(wx-fw.x, wx+fw.x, f.x) * (1.-smoothstep(1.-wx-fw.x, 1.-wx+fw.x, f.x)) * smoothstep(wy0-fw.y, wy0+fw.y, f.y) * (1.-smoothstep(wy1-fw.y, wy1+fw.y, f.y));
    float r = c_h(id + sd * .137);
    float skip = step(.86, c_h(id.yx * 1.7 + sd));
    win *= 1. - skip * (1. - ground);
    vec3 glass = mix(vec3(.05,.06,.08), uSky * .75, .15 + .35 * r);
    if (ground > .5) glass = mix(vec3(.08,.07,.07), vec3(.36,.26,.2), r);
    // shutters either side of the window (open), in one of a few paints per building
    float shw = (1. - 2. * wx) * .48;
    float shL = smoothstep(wx - shw - fw.x, wx - shw + fw.x, f.x) * (1. - smoothstep(wx - fw.x, wx + fw.x, f.x));
    float shR = smoothstep(1. - wx - fw.x, 1. - wx + fw.x, f.x) * (1. - smoothstep(1. - wx + shw - fw.x, 1. - wx + shw + fw.x, f.x));
    float shY = smoothstep(wy0-fw.y, wy0+fw.y, f.y) * (1.-smoothstep(wy1-fw.y, wy1+fw.y, f.y));
    float hasSh = step(.35, c_h(vec2(sd, 3.1))) * (1. - ground) * step(ty, .5) * (1. - skip);
    float pick = c_h(vec2(sd, 9.7));
    vec3 shc = pick < .45 ? vec3(.11,.27,.62) : pick < .7 ? vec3(.13,.45,.44) : pick < .88 ? vec3(.27,.47,.2) : vec3(.55,.2,.15);
    float sh = (shL + shR) * shY * hasSh;
    sh *= .85 + .15 * step(.5, fract(f.y * 9.));   // louvres
    float lod = clamp(max(fw.x, fw.y) * 2.2 - .3, 0., 1.);
    diffuseColor.rgb = mix(diffuseColor.rgb, glass, win * (1. - lod * .5));
    diffuseColor.rgb = mix(diffuseColor.rgb, shc, sh * (1. - lod * .4));
    float sill = (1. - smoothstep(0., fw.y * 2. + .02, abs(f.y - wy0 + .02))) * step(wx - .06, f.x) * step(f.x, 1. - wx + .06) * (1. - ground);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.96,.95,.92), sill * .6 * (1. - lod));
    diffuseColor.rgb *= 1. - (1. - smoothstep(0., fw.y * 2. + .02, abs(f.y - .01))) * .08 * (1. - lod);
  }`;

export const buildingMaterial = () => patchCloud(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0 }), FACADE_GLSL);
export const plainMaterial = (o = {}) => patchCloud(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, ...o }));

const GROUND_GLSL = `
  { float n = c_n(vWP.xz * .35) * .5 + c_n(vWP.xz * 1.9) * .3 + c_n(vWP.xz * 7.) * .2;
    diffuseColor.rgb *= .9 + .2 * n; }`;

export function buildWorld(scene, opts = {}) {
  const EXCL = opts.excl || [];
  const hitsExcl = (x0, x1, z0, z1) => EXCL.some(e => x0 < e[1] && x1 > e[0] && z0 < e[3] && z1 > e[2]);
  const rnd = mulberry(9);
  const R = (a, b) => a + (b - a) * rnd();
  const pick = a => a[Math.floor(rnd() * a.length)];

  const gBld = new GB(), gFlat = new GB(), gMark = new GB(), gRoad = new GB();
  const palms = [], trees = [], bollards = [];

  // ground: paving north of the canal and on the quay; asphalt roads
  gFlat.flat(EXT.x0 - 300, EXT.x1 + 300, EXT.z0 - 600, CANAL.z0, 0, '#d9d0bf');
  gFlat.flat(EXT.x0 - 300, EXT.x1 + 300, CANAL.z1, QUAY.edge, 0, '#cfc6b5');
  const ASPH = '#45474b';
  for (const s of NS) {
    const z1 = s.x === 120 ? QUAY.road1 : 625;
    if (s.x === 0) {
      gRoad.flat(-7, 7, STATION.apron, BLVD.z0, .02, ASPH);
      gRoad.flat(-BLVD.h, BLVD.h, BLVD.z0, BLVD.z1, .02, ASPH);
      gRoad.flat(-7, 7, BLVD.z1, 625, .02, ASPH);
    } else if (s.x === 120) {
      gRoad.flat(s.x - s.h, s.x + s.h, EXT.z0, BRIDGE.z0, .02, ASPH);
      gRoad.flat(s.x - s.h, s.x + s.h, BRIDGE.z1, z1, .02, ASPH);
    } else gRoad.flat(s.x - s.h, s.x + s.h, EXT.z0, 625, .02, ASPH);
  }
  for (const s of EW) gRoad.flat(EXT.x0 - 300, EXT.x1 + 300, s.z - s.h, s.z + s.h, .021, ASPH);
  gRoad.flat(EXT.x0 - 300, EXT.x1 + 300, QUAY.road0, QUAY.road1, .021, ASPH);
  gRoad.flat(STATION.x0, STATION.x1, STATION.z1, STATION.apron, .015, '#bdb6a8');   // station apron (concrete)

  // markings: centre dashes, stop lines, zebras at the crossroads
  const W = '#f3f1ea', Y = '#e9b93a';
  const dashZ = (x, z0, z1, col = W) => { for (let z = z0; z < z1; z += 9) gMark.flat(x - .12, x + .12, z, z + 4.5, .04, col); };
  const dashX = (z, x0, x1, col = W) => { for (let x = x0; x < x1; x += 9) gMark.flat(x, x + 4.5, z - .12, z + .12, .04, col); };
  dashZ(0, STATION.apron + 4, BLVD.z0 - 2, Y); dashZ(0, BLVD.z1 + 16, 620, Y);
  dashZ(-6.4, BLVD.z0 + 2, BLVD.z1 - 2); dashZ(6.4, BLVD.z0 + 2, BLVD.z1 - 2);
  for (const s of NS) if (s.x !== 0) dashZ(s.x, EXT.z0, 620);
  dashZ(120, BRIDGE.z1 + 2, QUAY.road0 - 2);
  for (const s of EW) dashX(s.z, EXT.x0, EXT.x1);
  dashX((QUAY.road0 + QUAY.road1) / 2, EXT.x0, EXT.x1);
  const zebra = (cx, cz, alongX, len, w) => { for (let i = -len / 2; i < len / 2; i += 1.2) alongX ? gMark.flat(cx + i, cx + i + .6, cz - w / 2, cz + w / 2, .041, W) : gMark.flat(cx - w / 2, cx + w / 2, cz + i, cz + i + .6, .041, W); };
  zebra(0, 520 - 8 - 3.5, true, 24, 4); zebra(0, 520 + 8 + 3.5, true, 14, 4);
  zebra(-19.5, 520, false, 16, 4); zebra(19.5, 520, false, 16, 4);
  gMark.flat(-12, -1.6, 520 - 8 - 6.5, 520 - 8 - 6, .041, W);   // stop line, southbound boulevard
  // boulevard median (planted)
  gFlat.box(-BLVD.med, BLVD.med, 0, .25, BLVD.z0 + 4, BLVD.z1 - 4, '#d7cfbf', '#5f9a3c');
  for (let z = BLVD.z0 + 10; z < BLVD.z1 - 6; z += 13) palms.push([0, z, R(10, 13), R(0, 6.28)]);

  // —— canal, bridge abutments, quay, sea ——
  const WALL = '#bfb5a2';
  gFlat.quad([EXT.x0 - 300, CANAL.y, CANAL.z0], [EXT.x1 + 300, CANAL.y, CANAL.z0], [EXT.x1 + 300, 0, CANAL.z0], [EXT.x0 - 300, 0, CANAL.z0], [0, 0, 1], WALL);
  gFlat.quad([EXT.x1 + 300, CANAL.y, CANAL.z1], [EXT.x0 - 300, CANAL.y, CANAL.z1], [EXT.x0 - 300, 0, CANAL.z1], [EXT.x1 + 300, 0, CANAL.z1], [0, 0, -1], WALL);
  gFlat.flat(EXT.x0 - 300, EXT.x1 + 300, CANAL.z0 - .6, CANAL.z0, .06, '#e6e0d3');   // coping stones
  gFlat.flat(EXT.x0 - 300, EXT.x1 + 300, CANAL.z1, CANAL.z1 + .6, .06, '#e6e0d3');
  gRoad.flat(BRIDGE.x0, BRIDGE.x1, BRIDGE.z0, CANAL.z0, .03, ASPH);
  gRoad.flat(BRIDGE.x0, BRIDGE.x1, CANAL.z1, BRIDGE.z1, .03, ASPH);
  gFlat.quad([EXT.x1 + 300, -1.2, QUAY.edge], [EXT.x0 - 300, -1.2, QUAY.edge], [EXT.x0 - 300, 0, QUAY.edge], [EXT.x1 + 300, 0, QUAY.edge], [0, 0, 1], WALL);
  gFlat.flat(EXT.x0 - 300, EXT.x1 + 300, QUAY.edge - .8, QUAY.edge, .07, '#e6e0d3');
  for (let x = EXT.x0; x < EXT.x1; x += 14) bollards.push([x + R(-2, 2), QUAY.edge - 1.2]);
  for (let x = EXT.x0 + 8; x < EXT.x1; x += 22) if (Math.abs(x - 120) > 14) { const pp = [x + R(-2, 2), QUAY.road1 + 6, R(9, 12), R(0, 6.28)]; if (Math.abs(pp[0] - 20) > 12) palms.push(pp); }   // the stolen palm (an actor) stands at x = 20
  // bridge counterweight houses + railings each side
  for (const z of [BRIDGE.hinge0 - 3.2, BRIDGE.hinge1 + 3.2]) for (const x of [BRIDGE.x0 - 1.6, BRIDGE.x1 + 1.6]) gBld.box(x - 1.3, x + 1.3, 0, 4.2, z - 1.6, z + 1.6, '#e9e2d3', '#4d6f8f');
  gFlat.box(BRIDGE.x0 - .9, BRIDGE.x0 - .5, 0, 1.4, BRIDGE.z0 + .2, BRIDGE.z0 + .6, '#c7302a', '#c7302a');   // barrier posts
  gFlat.box(BRIDGE.x1 + .5, BRIDGE.x1 + .9, 0, 1.4, BRIDGE.z0 + .2, BRIDGE.z0 + .6, '#c7302a', '#c7302a');

  // —— buildings ——
  const storey = 3.2;
  function building(x0, x1, z0, z1, floors, o = {}) {
    if (!o.force && hitsExcl(x0, x1, z0, z1)) return 0;
    const h = floors * storey + R(0, .6), wall = o.wall || (rnd() < .14 ? pick(ACCENT) : pick(FACADE));
    const seed = Math.floor(rnd() * 999) + 1, ty = o.ty ?? (rnd() < .2 ? 1 : 0);
    const bay = o.bay || R(3.0, 3.8);
    const wp = [bay, storey, ty * 1000 + seed];
    const gable = o.gable ?? (rnd() < .42);
    if (gable) {
      gBld.box(x0, x1, 0, h, z0, z1, wall, wall, { facade: true, wp, noTop: true });
      const alongX = (x1 - x0) >= (z1 - z0);
      gBld.gable(x0 - .35, x1 + .35, z0 - .35, z1 + .35, h, Math.min(x1 - x0, z1 - z0) * .32, o.tile || pick(TILE), wall, alongX);
    } else {
      const roof = pick(FLAT);
      gBld.box(x0, x1, 0, h, z0, z1, wall, roof, { facade: true, wp });
      // parapet + roof clutter
      gBld.box(x0, x1, h, h + .5, z0, z0 + .3, wall, wall); gBld.box(x0, x1, h, h + .5, z1 - .3, z1, wall, wall);
      gBld.box(x0, x0 + .3, h, h + .5, z0, z1, wall, wall); gBld.box(x1 - .3, x1, h, h + .5, z0, z1, wall, wall);
      if (!o.clean) {
        const n = Math.floor(R(0, 3.5));
        for (let i = 0; i < n; i++) {
          const cx = R(x0 + 1.5, x1 - 1.5), cz = R(z0 + 1.5, z1 - 1.5);
          if (rnd() < .5) gBld.cyl(cx, cz, R(.5, .8), h, h + R(1, 1.6), '#f4f2ee', 8);
          else { const s = R(.6, 1.4); gBld.box(cx - s, cx + s, h, h + R(.6, 1.5), cz - s * .7, cz + s * .7, '#cfcbc2', '#bdb8ad'); }
        }
        if (rnd() < .3) { const cx = R(x0 + 2, x1 - 2), cz = R(z0 + 2, z1 - 2); gBld.box(cx - 1.6, cx + 1.6, h, h + 2.4, cz - 1.6, cz + 1.6, wall, roof); }   // stair house
        if (rnd() < .25) gBld.flat(x0 + .6, x1 - .6, z0 + .6, z1 - .6, h + .04, '#b9b2a2');
      }
    }
    return h;
  }
  // a block: perimeter row houses, courtyard with a tree or two
  function block(x0, x1, z0, z1, o = {}) {
    if (x1 - x0 < 10 || z1 - z0 < 10) return;
    gFlat.flat(x0, x1, z0, z1, .12, '#e2dacb');   // raised sidewalk edge of the block
    if (o.park) {
      gFlat.flat(x0 + 2, x1 - 2, z0 + 2, z1 - 2, .14, '#5f9a3c');
      gFlat.flat((x0 + x1) / 2 - 1.5, (x0 + x1) / 2 + 1.5, z0 + 2, z1 - 2, .16, '#e6dcc7');
      gFlat.flat(x0 + 2, x1 - 2, (z0 + z1) / 2 - 1.5, (z0 + z1) / 2 + 1.5, .16, '#e6dcc7');
      gFlat.disc((x0 + x1) / 2, (z0 + z1) / 2, 5, 5, .18, '#e6dcc7'); gFlat.disc((x0 + x1) / 2, (z0 + z1) / 2, 3.4, 3.4, .22, '#3fa5b5');
      for (let i = 0; i < (x1 - x0) * (z1 - z0) / 140; i++) { const x = R(x0 + 4, x1 - 4), z = R(z0 + 4, z1 - 4); if (Math.abs(x - (x0 + x1) / 2) > 3 && Math.abs(z - (z0 + z1) / 2) > 3) trees.push([x, z, R(3, 4.6)]); }
      return;
    }
    const lot = () => R(8, 15), dep = () => R(10, 14), fl = () => o.floors ? o.floors() : Math.floor(R(2, 5.2));
    const d0 = dep(), d1 = dep();
    for (let x = x0 + 1; x < x1 - 1;) { const w = Math.min(lot(), x1 - 1 - x); if (w > 5) building(x, x + w, z0 + 1, z0 + 1 + d0, fl()); x += w + (rnd() < .12 ? R(2, 5) : 0); }
    for (let x = x0 + 1; x < x1 - 1;) { const w = Math.min(lot(), x1 - 1 - x); if (w > 5) building(x, x + w, z1 - 1 - d1, z1 - 1, fl()); x += w + (rnd() < .12 ? R(2, 5) : 0); }
    const za = z0 + 1 + d0 + .5, zb = z1 - 1 - d1 - .5;
    if (zb - za > 6) {
      const e0 = dep(), e1 = dep();
      for (let z = za; z < zb;) { const w = Math.min(lot(), zb - z); if (w > 5) building(x0 + 1, x0 + 1 + e0, z, z + w, fl()); z += w; }
      for (let z = za; z < zb;) { const w = Math.min(lot(), zb - z); if (w > 5) building(x1 - 1 - e1, x1 - 1, z, z + w, fl()); z += w; }
      const cx0 = x0 + 2 + e0, cx1 = x1 - 2 - e1;
      if (cx1 - cx0 > 6) { gFlat.flat(cx0, cx1, za, zb, .14, rnd() < .5 ? '#d8cdb6' : '#7fae4f'); const n = Math.floor((cx1 - cx0) * (zb - za) / 260); for (let i = 0; i < n; i++) { const tx = R(cx0 + 2, cx1 - 2), tz = R(za + 2, zb - 2); if (!hitsExcl(tx - 4, tx + 4, tz - 4, tz + 4)) trees.push([tx, tz, R(2.4, 3.8)]); } }
    }
  }

  // street edges (block extents) north of the canal
  const xs = [EXT.x0, ...NS.map(s => s.x), EXT.x1], zs = [EXT.z0, ...EW.filter(e => e.z < 600).map(e => e.z), 630];
  const hx = x => (NS.find(s => s.x === x) || { h: -3 }).h, hz = z => (EW.find(e => e.z === z) || { h: -3 }).h;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    let x0 = xs[i] + hx(xs[i]) + 3, x1 = xs[i + 1] - hx(xs[i + 1]) - 3;
    const z0 = zs[j] + hz(zs[j]) + 3, z1 = zs[j + 1] - hz(zs[j + 1]) - 3;
    // the boulevard is wider
    if (zs[j] >= BLVD.z0 && zs[j + 1] <= BLVD.z1 + 8) { if (xs[i + 1] === 0) x1 = -BLVD.h - 3; if (xs[i] === 0) x0 = BLVD.h + 3; }
    // the station block: no main road north of the apron
    if (zs[j] === -120 && zs[j + 1] === 120 && (xs[i] === 0 || xs[i + 1] === 0)) {
      if (xs[i + 1] === 0) { block(x0, -16, z0, STATION.apron - 2 - 0, {}); block(x0, -10, STATION.apron + 2, z1); }
      else { block(16, x1, z0, STATION.apron - 2); block(10, x1, STATION.apron + 2, z1); }
      continue;
    }
    const park = (xs[i] === -130 && zs[j] === 120) || (xs[i] === 250 && zs[j] === 260);
    block(x0, x1, z0, z1, { park });
  }
  // fire station: cream walls, red roller door (actor), red band, flat roof with the painted title (texture, below)
  {
    const s = STATION;
    gBld.box(s.x0, s.x1, 0, s.h, s.z0, s.z1, '#f1ebe0', '#d6cdbb', { facade: true, wp: [4, 4.2, 2000 + 7] });
    gBld.box(s.x0 - .2, s.x1 + .2, s.h - 1.1, s.h - .3, s.z1 - .01, s.z1 + .2, '#b8322a', '#b8322a');   // red band
    gBld.box(-4.4, 4.4, 0, 5.6, s.z1, s.z1 + .25, '#3a3330', '#3a3330');   // door opening (dark interior behind the roller door)
    gBld.box(s.x0, s.x1, s.h, s.h + .5, s.z0, s.z0 + .3, '#f1ebe0'); gBld.box(s.x0, s.x1, s.h, s.h + .5, s.z1 - .3, s.z1, '#f1ebe0');
    gBld.box(s.x0, s.x0 + .3, s.h, s.h + .5, s.z0, s.z1, '#f1ebe0'); gBld.box(s.x1 - .3, s.x1, s.h, s.h + .5, s.z0, s.z1, '#f1ebe0');
    gBld.box(s.x1 - 4, s.x1 - 1, s.h, s.h + 9, s.z0 + 2, s.z0 + 5, '#e3dccd', '#b8322a', { facade: true, wp: [3, 2.2, 1000 + 3] });   // hose tower
  }
  // —— south of the canal: warehouses and sheds along the quay ——
  const sheds = [];
  for (let x = EXT.x0 + 4; x < EXT.x1 - 10;) {
    const w = R(26, 44);
    if (x < 114 && x + w > 80) { x = 129; continue; }
    if (x < WAREHOUSE.x1 + 4 && x + w > WAREHOUSE.x0 - 4) { x = WAREHOUSE.x1 + 6; continue; }
    const z0 = CANAL.z1 + R(10, 16), z1 = QUAY.road0 - R(8, 12);
    sheds.push([x, Math.min(x + w, EXT.x1), z0, z1]); x += w + R(6, 14);
  }
  for (const [x0, x1, z0, z1] of sheds) {
    const wall = pick(['#e7dccb', '#d9c7aa', '#e4c49d', '#c9d6dc', '#eee6d8', '#d7b48c']);
    const h = R(7, 10.5);
    gBld.box(x0, x1, 0, h, z0, z1, wall, wall, { facade: true, wp: [R(5, 7), h, 2000 + Math.floor(rnd() * 999)], noTop: true });
    gBld.gable(x0 - .4, x1 + .4, z0 - .4, z1 + .4, h, (z1 - z0) * .18, pick(['#9aa3a8', '#b25a3d', '#8d9599', '#c26a48']), wall, true);
  }
  // container stacks on the east quay
  const CONT = ['#c23b2b', '#2c6aa0', '#e0a422', '#3d8c5a', '#d8d4cc', '#8b4a8a'];
  for (let i = 0; i < 40; i++) { const x = 300 + (i % 8) * 6.6, z = 690 + Math.floor(i / 8) % 3 * 13, y = Math.floor(i / 24) * 2.6, c = pick(CONT); gBld.box(x, x + 6.1, y, y + 2.6, z, z + 12.2, c, c); }
  // the warehouse that burns (terracotta walls, grey roof); its facade is plain so the fire glow reads
  {
    const w = WAREHOUSE;
    gBld.box(w.x0, w.x1, 0, w.h, w.z0, w.z1, '#d98a5a', '#d98a5a', { facade: true, wp: [5.2, w.h, 2000 + 77], noTop: true });
    gBld.gable(w.x0 - .5, w.x1 + .5, w.z0 - .5, w.z1 + .5, w.h, w.ridge, '#8e8a84', '#d98a5a', false);
  }

  if (opts.extra) opts.extra({ gBld, gFlat, gRoad, gMark, building, trees, palms, R, rnd });
  // —— meshes ——
  const mB = buildingMaterial();
  const bld = new THREE.Mesh(gBld.build(), mB); bld.castShadow = bld.receiveShadow = true; scene.add(bld);
  const mFlat = patchCloud(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94 }), GROUND_GLSL);
  const flat = new THREE.Mesh(gFlat.build(), mFlat); flat.receiveShadow = true; flat.castShadow = true; scene.add(flat);
  const mRoad = patchCloud(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }), GROUND_GLSL + `
    { float st = smoothstep(.7, .78, c_n(vWP.xz * .23 + 4.)) * .12 + smoothstep(.74, .8, c_n(vWP.xz * 1.3 - 9.)) * .1; diffuseColor.rgb *= 1. - st; }`);
    const road = new THREE.Mesh(gRoad.build(), mRoad); road.receiveShadow = true; scene.add(road);
  const mMark = patchCloud(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  const mark = new THREE.Mesh(gMark.build(), mMark); mark.receiveShadow = true; scene.add(mark);

  // water: sea and canal (turquoise, sky-reflective, slight ripple normal from noise)
  const waterMat = patchCloud(new THREE.MeshStandardMaterial({ color: '#3f97a6', roughness: .14, metalness: .1 }), `
    { float n = c_n(vWP.xz * .12 + uTime * .3) * .5 + c_n(vWP.xz * .5 - uTime * .5) * .5; diffuseColor.rgb *= .86 + .26 * n;
      float deep = smoothstep(${QUAY.edge.toFixed(1)}, ${(QUAY.edge + 260).toFixed(1)}, vWP.z); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.07,.42,.58), deep * .7); }`); waterMat.defines = { NOSNOW: '' };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 3000), waterMat); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -.9, QUAY.edge + 1500); sea.receiveShadow = true; scene.add(sea);
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(EXT.x1 - EXT.x0 + 600, CANAL.z1 - CANAL.z0), waterMat); canal.rotation.x = -Math.PI / 2; canal.position.set(0, CANAL.y + .2, (CANAL.z0 + CANAL.z1) / 2); canal.receiveShadow = true; scene.add(canal);
  // far hills beyond the town (north, west, east) so the horizon isn't a hard edge
  const hillMat = patchCloud(new THREE.MeshStandardMaterial({ color: '#8fae6a', roughness: 1, flatShading: true }));
  const hg = new THREE.ConeGeometry(1, 1, 7, 1);
  for (let i = 0; i < 26; i++) { const a = -Math.PI * .1 - i / 25 * Math.PI * 1.2, r = R(1100, 1600); const m = new THREE.Mesh(hg, hillMat); m.scale.set(R(280, 460), R(70, 160), R(280, 460)); m.position.set(Math.cos(a) * r, -2, 300 + Math.sin(a) * r); scene.add(m); }

  // trees: palms (trunk + 7 fronds) and round trees, instanced
  const trunkG = new THREE.CylinderGeometry(.16, .26, 1, 6); trunkG.translate(0, .5, 0);
  const tMat = patchCloud(new THREE.MeshStandardMaterial({ color: '#8a6d52', roughness: .9 }));
  const trunk = new THREE.InstancedMesh(trunkG, tMat, palms.length); trunk.castShadow = true;
  const frondG = new THREE.BoxGeometry(3.6, .14, .9); frondG.translate(1.8, 0, 0);
  const fMat = patchCloud(new THREE.MeshStandardMaterial({ color: '#3f8f2f', roughness: .8 }));
  const frond = new THREE.InstancedMesh(frondG, fMat, palms.length * 7); frond.castShadow = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3();
  palms.forEach(([x, z, h, a], i) => {
    M.compose(P.set(x, 0, z), Q.identity(), Sc.set(1, h, 1)); trunk.setMatrixAt(i, M);
    for (let k = 0; k < 7; k++) { E.set(0, a + k / 7 * Math.PI * 2, -.35 - (k % 2) * .25, 'YXZ'); Q.setFromEuler(E); M.compose(P.set(x, h, z), Q, Sc.set(1, 1, 1)); frond.setMatrixAt(i * 7 + k, M); }
  });
  scene.add(trunk, frond);
  const crownG = new THREE.IcosahedronGeometry(1, 1);
  const cMat = patchCloud(new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true }));
  const crown = new THREE.InstancedMesh(crownG, cMat, trees.length); crown.castShadow = true; crown.receiveShadow = true;
  const tc = new THREE.Color();
  trees.forEach(([x, z, r], i) => { M.compose(P.set(x, r * 1.1 + .4, z), Q.identity(), Sc.set(r, r * .9, r)); crown.setMatrixAt(i, M); crown.setColorAt(i, tc.set(pick(['#4f9a35', '#5fa83c', '#3e8a35', '#6aae42']))); });
  scene.add(crown);
  const bolG = new THREE.CylinderGeometry(.25, .3, .7, 6); bolG.translate(0, .35, 0);
  const bol = new THREE.InstancedMesh(bolG, new THREE.MeshStandardMaterial({ color: '#3b3d40' }), bollards.length);
  bollards.forEach(([x, z], i) => { M.compose(P.set(x, 0, z), Q.identity(), Sc.set(1, 1, 1)); bol.setMatrixAt(i, M); }); scene.add(bol);

  // the painted roof title on the fire station: white letters, red keyline, readable from the north-high camera
  {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 512);
    g.font = '900 230px Overpass'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 26; g.strokeStyle = '#b8322a'; g.lineJoin = 'round';
    g.save(); g.translate(512, 262); const tw0 = g.measureText('ENGINE 9').width; g.scale(Math.min(1, 900 / tw0), 1.25);
    g.strokeText('ENGINE 9', 0, 0); g.fillStyle = '#fbfaf6'; g.fillText('ENGINE 9', 0, 0); g.restore();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const s = STATION, w = s.x1 - s.x0 - 1.4, d = s.z1 - s.z0 - 1.4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Math.min(d, w * .5)), patchCloud(new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
    m.rotation.x = -Math.PI / 2; m.position.set(0, s.h + .06, (s.z0 + s.z1) / 2 - .5); m.receiveShadow = true;   // read from the south-east camera: letters' up = north
    scene.add(m);
  }
  return { bld, flat, road };
}
