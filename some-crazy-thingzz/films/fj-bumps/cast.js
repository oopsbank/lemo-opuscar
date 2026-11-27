// cast.js — parametric flat cartoon people: round white head, thick ink outline, stick limbs, flat clothes, one hard shadow shape per form.
// Units: centimetres, feet at y = 0, up is −y. A ~1.7 m adult: head centre y ≈ −146.
// drawChar(T, spec, pose, o): T is a Toon whose matrix maps these units to canvas pixels; o.lw / o.limb are canvas-pixel widths; o.away = −1 / +1 (shadow side on screen).
import { INK, ell, arc, quad, spline, rr, limb, TAU } from './toon.js';
import { clamp, lerp } from '/core/lib.js';

export const SKIN = '#fbf7ef', SKIN_SH = '#e2d6c6', MOUTH = '#5a1a22', TONGUE = '#d4545c', WHITE = '#ffffff';
const shade = (hex, k = .78) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v, i) => Math.round(v * k * [0.96, 0.97, 1.06][i])); return '#' + c.map(v => Math.min(255, v).toString(16).padStart(2, '0')).join(''); };

export const POSE0 = { lh: [-30, -70], rh: [30, -70], bendL: 6, bendR: -6, lf: [-13, -3], rf: [13, -3], lean: 0, tilt: 0, bob: 0, sq: 1, look: [0, 0], turn: 0, brows: 'neutral', mouth: 'smile', open: 0, blink: 0, armsBack: false };

export function drawChar(T, sp, pose, o) {
  const p = { ...POSE0, ...pose }, g = T.g, lw = o.lw, lb = o.limb ?? lw * 2.2, away = o.away ?? 1;
  const HIP = -62, SH = -110;
  T.push();
  if (sp.flip) T.scale(-1, 1);
  T.scale(sp.scale ?? 1);
  T.translate(0, p.bob);
  T.scale(1 / Math.sqrt(p.sq), p.sq);               // squash & stretch around the feet
  const aw = sp.flip ? -away : away;                  // shadow side in local coordinates

  // —— legs and shoes ——
  for (const [hx, f, s] of [[-9, p.lf, -1], [9, p.rf, 1]]) {
    T.line(limb([hx, HIP + 4], [f[0], f[1] - 4], s * (p.legBend ?? 2)), lb);
    T.shape(ell(f[0] + s * 5, f[1] - 3.5, 9.5, 5.5, 24), { fill: sp.shoes ?? '#2a2226', lw: lw * .7 });
  }
  T.push(); T.translate(0, HIP); T.rotate(p.lean); T.translate(0, -HIP);
  // —— arms behind the body ——
  const arms = () => {
    for (const [sx, h, b] of [[-17, p.lh, p.bendL], [17, p.rh, p.bendR]]) {
      T.line(limb([sx, SH + 6], h, b), lb);
      const pr = sx > 0 ? p.rprop : p.lprop;
      if (pr) drawGolfProp(T, pr, h, lw);
      T.dot(h[0], h[1], lb * .95);
    }
  };
  if (p.armsBack) arms();
  // —— torso: shirt, trousers, one hard shadow shape on the away side ——
  const torso = spline([[-18, SH - 6], [18, SH - 6], [24, SH + 18], [25, HIP - 2], [0, HIP + 3], [-25, HIP - 2], [-24, SH + 18]], true, 6);
  T.shape(torso, {
    fill: sp.shirt, lw, shade: () => {
      if (sp.pants) T.fillOnly(rr(-40, HIP - 15, 80, 40, 2), sp.pants);
      if (sp.pants) T.line([[-40, HIP - 15], [40, HIP - 15]], lw * .6);
      T.g.globalAlpha = .9; T.fillOnly(ell(aw * 30, SH + 30, 16, 60, 32), shade(sp.shirt)); T.g.globalAlpha = 1;
      if (sp.pants) { T.g.globalAlpha = .9; T.fillOnly(rr(aw > 0 ? 14 : -40, HIP - 15, 26, 40, 2), shade(sp.pants)); T.g.globalAlpha = 1; }
      if (sp.detail) sp.detail(T, lw);
    }
  });
  if (!p.armsBack && !p.armsFront) arms();
  // —— head ——
  T.push(); T.translate(0, SH - 6); T.rotate(p.tilt); T.scale(sp.headScale ?? 1); T.translate(0, -(SH - 6));
  const HX = 0, HY = -144, RX = 31, RY = 28;
  if (sp.back) sp.back(T, lw, HX, HY);                 // hair behind the head (bun, curls)
  T.shape(ell(HX, HY, RX, RY, 64), {
    fill: SKIN, lw, shade: () => {
      T.fillOnly(ell(HX + aw * 38, HY + 10, 26, 40, 40), SKIN_SH);
      if (sp.hair) sp.hair(T, lw, HX, HY, RX, RY, aw);
    }
  });
  // —— face ——
  const fdy = sp.hat ? 4 : 0, fx = HX + p.turn * 8, ey = HY - 1 + fdy;   // under a cap the face sits a little lower
  const browSet = { neutral: [[0, 0], [0, 0]], up: [[-4, .1], [-4, -.1]], angry: [[2, -.45], [2, .45]], worried: [[-2, .4], [-2, -.4]], skeptic: [[-5, .15], [1, .3]], shock: [[-5, .15], [-5, -.15]] }[p.brows] ?? [[0, 0], [0, 0]];
  for (const [s, i] of [[-1, 0], [1, 1]]) {
    const ex = fx + s * 11.5;
    if (p.blink > .5) T.line(arc(ex, ey + 1, 7.5, 4, .15 * Math.PI, .85 * Math.PI, 10), lw * 1.1);
    else {
      T.shape(ell(ex, ey, 8.2, 10, 40), { fill: WHITE, lw: lw * .85 });
      const px = ex + p.look[0] * 3.2 + p.turn * 1.5, py = ey + 1 + p.look[1] * 3;
      T.shape(ell(px, py, 4.6, 5.2, 24), { fill: INK, stroke: false });
      T.dot(px + 1.6, py - 2, Math.max(.8, 1.5 * T.zoom()), WHITE);
      if (p.brows === 'skeptic' && i === 1) T.shape([...arc(ex, ey, 8.2, 10, Math.PI * 1.05, Math.PI * 1.95, 16)], { fill: SKIN, lw: lw * .85, closed: true });   // a heavy lid
    }

  }
  if (sp.cheeks) for (const s of [-1, 1]) { T.g.globalAlpha = .55; T.fillOnly(ell(fx + s * 17, ey + 12, 6, 3.6, 20), sp.cheeks); T.g.globalAlpha = 1; }
  if (p.inkRing) { T.g.globalAlpha = .85 * Math.min(1, p.inkRing); T.shape(ell(fx - 11.5, ey, 13, 14, 32), { fill: false, lw: lw * 1.6, line: '#2a4fd0' }); T.g.globalAlpha = 1; }   // a blue ink ring round the left eye
  if (p.mask) {   // a sleep mask over the eyes: blindfolded
    T.line([[fx - 40, ey - 6], [fx - 30, ey - 3]], lw * .8); T.line([[fx + 30, ey - 3], [fx + 40, ey - 6]], lw * .8);
    T.shape(spline([[fx - 31, ey - 9], [fx, ey - 13], [fx + 31, ey - 9], [fx + 30, ey + 8], [fx + 12, ey + 11], [fx, ey + 6], [fx - 12, ey + 11], [fx - 30, ey + 8]], true, 6), { fill: '#3a3a8a', lw, shade: () => T.fillOnly(rr(fx + 10, ey - 14, 24, 28, 0), '#2c2c70') });
    for (const s of [-1, 1]) { T.line(arc(fx + s * 13, ey - 1, 7, 4, .15 * Math.PI, .85 * Math.PI, 10), lw * .6, '#ffffff'); for (const d of [-5, 0, 5]) T.line([[fx + s * 13 + d, ey + 3], [fx + s * 13 + d * 1.3, ey + 6]], lw * .45, '#ffffff'); }
  }
  if (sp.glasses && !p.mask) {   // round wire glasses with a little bridge
    for (const s of [-1, 1]) T.shape(ell(fx + s * 11.5, ey, 11.5, 11.5, 40), { fill: false, lw: lw * .75 });
    T.line(arc(fx, ey - 2, 2.6, 2.6, Math.PI * 1.1, Math.PI * 1.9, 8), lw * .7);
  }
  const mx = fx + p.turn * 2, my = HY + 15 + fdy * .6;
  if (sp.mustache && p.stache) { T.push(); T.translate(mx + p.stache[0], my - 5 + p.stache[1]); T.rotate(p.stache[2] ?? 0); T.translate(-mx, -(my - 5)); }
  if (sp.mustache) T.shape(spline([[mx - 12, my - 3], [mx - 3, my - 8], [mx, my - 6], [mx + 3, my - 8], [mx + 12, my - 3], [mx + 5, my - 4.5], [mx, my - 3.5], [mx - 5, my - 4.5]], true, 4), { fill: sp.mustache, lw: lw * .7 });
  if (sp.mustache && p.stache) T.pop();
  const m = p.mouth, op = clamp(p.open);
  if (m === 'smile') T.line(arc(mx, my - 4, 7, 5, .2 * Math.PI, .8 * Math.PI, 12), lw * 1.05);
  else if (m === 'frown') T.line(arc(mx, my + 3, 6.5, 4, 1.2 * Math.PI, 1.8 * Math.PI, 12), lw * 1.05);
  else if (m === 'flat') T.line([[mx - 5, my], [mx + 5, my]], lw * 1.05);
  else if (m === 'o') T.shape(ell(mx, my + 1, 3.6 + op * 1.5, 4.5 + op * 4, 24), { fill: MOUTH, lw: lw * .9, shade: () => T.fillOnly(ell(mx, my + 5 + op * 3, 4, 3, 16), TONGUE) });
  else if (m === 'grin' || m === 'teeth') {
    const h = m === 'grin' ? 5 + op * 6 : 4.5, w = m === 'grin' ? 10 : 9;
    const pts = m === 'grin' ? [...arc(mx, my - 3, w, h + 2, 0, Math.PI, 16), [mx - w, my - 3]] : rr(mx - w, my - h / 2, w * 2, h, 2);
    T.shape(pts, {
      fill: MOUTH, lw: lw * .9, shade: () => {
        T.fillOnly(rr(mx - w - 2, my - 6, w * 2 + 4, m === 'grin' ? 4.5 : h / 2 + .4, 1), WHITE);
        if (m === 'teeth') T.fillOnly(rr(mx - w - 2, my, w * 2 + 4, h, 1), WHITE);
        if (m === 'grin') T.fillOnly(ell(mx, my + h + 1, 6, 3.5, 16), TONGUE);
      }
    });
    if (m === 'teeth') T.line([[mx - w, my], [mx + w, my]], lw * .5);
  }
  if (sp.hat) { T.push(); T.translate(0, -(p.hatLift ?? 0)); sp.hat(T, lw, HX, HY, RX, RY, aw, p.turn); T.pop(); }   // after the face: raised brows tuck under the peak
  for (const [s, i] of [[-1, 0], [1, 1]]) {   // brows last, over the hat's peak: they carry the acting
    const ex = fx + s * 11.5;
      const [dy, rot] = browSet[i];
      const bx = ex, by = ey - 15 + dy;
      T.line([[bx - 7, by + s * rot * 7 * -1 + 1], [bx, by - 1.5], [bx + 7, by + s * rot * 7 + 1]].map(q => q), lw * 1.35);
  }
  if (sp.lips) T.shape(ell(mx, my + 1, 4, 2.6, 16), { fill: sp.lips, lw: lw * .6 });
  if (p.crumbs) for (const [cx, cy, r] of [[-11, 9, 1.8], [9, 12, 1.5], [14, 4, 1.3], [-5, 16, 1.4]].slice(0, p.crumbs)) T.shape(ell(mx + cx, my + cy, r, r, 10), { fill: '#e0a64e', lw: lw * .35 });
  T.pop();   // head
  if (p.armsFront) arms();   // a hand in front of the face (eating, holding something up)
  T.pop();   // lean
  T.pop();
}

// —— hair, hats ——
export const HAIR = {
  side: col => (T, lw, x, y, rx, ry, aw) => {   // short hair swept to one side, under a cap or alone
    T.shape(spline([[x - rx - 4, y + 4], [x - rx, y - 16], [x - 10, y - ry - 6], [x + 14, y - ry - 4], [x + rx + 2, y - 10], [x + rx + 4, y + 2], [x + 20, y - 20], [x - 6, y - 22], [x - 24, y - 4]], true, 6), { fill: col, lw });
  },
  bun: col => (T, lw, x, y, rx, ry) => { T.shape(spline([[x - rx - 3, y + 6], [x - rx, y - 16], [x, y - ry - 4], [x + rx, y - 16], [x + rx + 3, y + 6], [x + 20, y - 12], [x, y - 17], [x - 20, y - 12]], true, 6), { fill: col, lw }); },
};
export const BACK = {
  bun: col => (T, lw, x, y) => { T.shape(ell(x + 4, y - 32, 13, 11, 32), { fill: col, lw }); },
};
export const HAT = {
  cap: (col, band) => (T, lw, x, y, rx, ry, aw, turn = 0) => {   // a peaked cap seen from the front: crown dome, band, the peak as a crescent toward the camera
    const by = y - 22;
    T.shape(spline([[x - rx * .9, by + 2], [x - rx * .86, by - 12], [x - rx * .5, y - ry - 11], [x + rx * .5, y - ry - 11], [x + rx * .86, by - 12], [x + rx * .9, by + 2]], false, 8).concat([[x + rx * .9, by + 2], [x - rx * .9, by + 2]]), {
      fill: col, lw, shade: () => { T.fillOnly(ell(x + aw * 34, by - 12, 20, 34, 24), shade(col, .78)); if (band) T.fillOnly(rr(x - rx - 4, by - 7, rx * 2 + 8, 7, 1), band); }
    });
    const px = x + turn * 9;
    T.shape([...arc(px, by + 1, rx * .82, 6.5, 0, Math.PI, 20)], { fill: shade(col, .7), lw });   // the peak
  },
};

// —— props held in a hand (drawn in the card, so they keep the cartoon line): { kind: 'fork' | 'cracker', ang, bite } ——
const STEEL = '#cfd3d8', STEEL_SH = '#9aa1ab';
export function drawProp(T, pr, h, lw) {
  T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
  if (pr.kind === 'fork') {   // handle in the fist, tines pointing along +y (down when ang = 0); the tips are 22 cm from the hand
    T.shape(rr(-1.6, -7, 3.2, 17, 1.5), { fill: STEEL, lw: lw * .55, shade: () => T.fillOnly(rr(.4, -7, 1.6, 17, .8), STEEL_SH) });
    T.shape([[-2.2, 9], [2.2, 9], [3.6, 14], [-3.6, 14]], { fill: STEEL, lw: lw * .55 });
    for (const x of [-3, -1, 1, 3]) T.line([[x, 13.5], [x * 1.05, 22]], lw * .55);
  } else if (pr.kind === 'cracker') {   // a golden square, a smiley of holes; `bite` takes a corner off
    const pts = pr.bite ? [[-10, -10], [0, -10], [1.5, -7], [4.5, -6.5], [5.5, -3.5], [8.5, -2.5], [10, 0], [10, 10], [-10, 10]] : rr(-10, -10, 20, 20, 2);
    T.shape(pts, { fill: '#e9b45c', lw: lw * .6, shade: () => { T.fillOnly(rr(4, -12, 8, 24, 0), '#d39a45'); T.fillOnly(rr(-12, 6, 24, 6, 0), '#d39a45'); } });
    const holes = [[-4.5, -3], [3.5, -3], [-6, 3], [-3, 5.5], [0, 6.3], [3, 5.5], [6, 3]];
    for (const [x, y] of holes) if (!(pr.bite && x > 1 && y < -1)) T.dot(x, y, Math.max(1, 1.1 * T.zoom()), '#8a5a26');
  }
  T.pop();
}
// a tall chef's hat: a band on the head and a puffed top; oversized on a kid
HAT.toque = (band = '#f3f1ec') => (T, lw, x, y, rx, ry, aw, turn = 0) => {
  const yb = y - 13, yt = yb - 13;
  T.shape(spline([[x - rx * .9, yt + 3], [x - rx * 1.16, yt - 12], [x - rx * .9, yt - 28], [x - rx * .3, yt - 36], [x + rx * .2, yt - 35], [x + rx * .85, yt - 29], [x + rx * 1.14, yt - 13], [x + rx * .9, yt + 3]], true, 8), {
    fill: '#ffffff', lw, shade: () => { T.fillOnly(ell(x + aw * rx * 1.0, yt - 16, rx * .5, 30, 24), '#dcdfe8'); }
  });
  T.line(quad([x - rx * .35, yt - 4], [x - rx * .45, yt - 18], [x - rx * .2, yt - 29]), lw * .55);
  T.line(quad([x + rx * .35, yt - 3], [x + rx * .5, yt - 15], [x + rx * .3, yt - 25]), lw * .55);
  T.shape(rr(x - rx * .98, yt, rx * 1.96, yb - yt, 3), { fill: band, lw, shade: () => T.fillOnly(rr(x + (aw > 0 ? rx * .45 : -rx * .98), yt, rx * .53, yb - yt, 0), '#dcdfe8') });
};
HAIR.tuft = col => (T, lw, x, y, rx, ry, aw) => {   // a short fringe peeking out under a hat
  T.shape(spline([[x - rx - 3, y + 2], [x - rx + 2, y - 18], [x - 8, y - 22], [x - 2, y - 14], [x + 8, y - 22], [x + rx - 2, y - 18], [x + rx + 3, y + 2], [x + rx - 6, y - 8], [x - rx + 6, y - 8]], true, 6), { fill: col, lw });
};

// —— Sand Trap additions: Gary's flat cap, Dot's visor and ponytail; golf props ——
// a flat cap: a low, wide crown pulled forward, a short peak; plaid lines on the crown
HAT.flat = (col, line = '#3a2a22') => (T, lw, x, y, rx, ry, aw, turn = 0) => {
  const by = y - 16;
  const crown = spline([[x - rx * 1.02, by + 2], [x - rx * 1.05, by - 12], [x - rx * .6, y - ry - 9], [x + rx * .3, y - ry - 11], [x + rx * 1.0, by - 14], [x + rx * 1.12, by - 2], [x + rx * .9, by + 3]], true, 8);
  T.shape(crown, { fill: col, lw, shade: () => {
    T.fillOnly(ell(x + aw * 34, by - 8, 18, 30, 24), shade(col, .8));
    T.g.globalAlpha = .55; for (const k of [-18, -6, 6, 18]) T.line([[x + k - 4, by + 4], [x + k + 4, y - ry - 12]], lw * .35, line); for (const k of [-6, -14]) T.line([[x - rx * 1.1, by + k], [x + rx * 1.2, by + k - 2]], lw * .35, line); T.g.globalAlpha = 1;
  } });
  const px = x + turn * 9;
  T.shape([...arc(px, by + 2, rx * .78, 6, 0, Math.PI, 20)], { fill: shade(col, .7), lw });
};
// a sun visor: a band round the head and a big peak, no crown (the hair shows on top)
HAT.visor = (col, band) => (T, lw, x, y, rx, ry, aw, turn = 0) => {
  const by = y - 18;
  T.shape(rr(x - rx * .98, by - 8, rx * 1.96, 9, 3), { fill: band ?? col, lw: lw * .8 });
  const px = x + turn * 9;
  T.shape([...arc(px, by + 1, rx * .95, 9, 0, Math.PI, 20)], { fill: col, lw, shade: () => T.fillOnly(ell(px + aw * 20, by + 6, 14, 6, 16), shade(col, .85)) });
};
BACK.pony = col => (T, lw, x, y) => {   // a ponytail swinging out behind the head on one side
  T.shape(spline([[x + 20, y - 24], [x + 40, y - 30], [x + 50, y - 12], [x + 46, y + 14], [x + 38, y + 26], [x + 36, y + 6], [x + 30, y - 12]], true, 6), { fill: col, lw });
  T.shape(rr(x + 22, y - 31, 12, 9, 3), { fill: '#f08a32', lw: lw * .6 });
};
HAIR.top = col => (T, lw, x, y, rx, ry) => {   // hair pulled back, showing over a visor
  T.shape(spline([[x - rx - 2, y - 2], [x - rx + 1, y - 18], [x - 12, y - ry - 5], [x + 12, y - ry - 5], [x + rx - 1, y - 18], [x + rx + 2, y - 2], [x + rx - 6, y - 14], [x, y - 20], [x - rx + 6, y - 14]], true, 6), { fill: col, lw });
};
const GOLF = { white: '#fbfaf5', dim: '#c9c5ba' };
const _drawProp0 = drawProp;
export function drawGolfProp(T, pr, h, lw) {
  if (pr.kind === 'tape') {   // a yellow tape measure, the blade out a little with its hook
    T.push(); T.translate(h[0], h[1] - 6);
    T.shape(rr(-9, -9, 18, 18, 5), { fill: '#ffd84a', lw: lw * .6, shade: () => T.fillOnly(ell(0, 0, 5, 5, 16), '#1e1e22') });
    T.shape(rr(9, 4, 14, 3.5, .5), { fill: '#f2e8a0', lw: lw * .45 }); T.shape(rr(22, 2, 2.5, 7, .5), { fill: '#c8ccd2', lw: lw * .45 });
    T.pop(); return;
  }
  if (pr.kind === 'file') {   // a pink emery board (nail file), along -y (up) from the fist
    T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
    T.shape(rr(-2.6, -30, 5.2, 36, 2.4), { fill: '#ff8fa8', lw: lw * .55, shade: () => { T.fillOnly(rr(.6, -30, 2, 36, 1), '#e86a8a'); T.g.globalAlpha = .5; for (let y = -27; y < 2; y += 3) T.dot(-1 + (y % 2), y, Math.max(.6, .5 * T.zoom()), '#b8405e'); T.g.globalAlpha = 1; } });
    T.pop(); return;
  }
  if (pr.kind === 'mask') {   // a sleep mask dangling by its strap
    T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
    T.line([[0, 0], [-8, 10], [8, 10], [0, 0]], lw * .5);
    T.shape([[-16, 8], [16, 8], [17, 17], [8, 20], [0, 17], [-8, 20], [-17, 17]], { fill: '#3a3a8a', lw: lw * .6 });
    for (const s of [-1, 1]) T.line([[s * 11 - 5, 14], [s * 11, 16], [s * 11 + 5, 14]], lw * .4, '#ffffff');
    T.pop(); return;
  }
  if (pr.kind === 'glue') {   // an orange glue bottle, nozzle along -y (up) from the fist; `squeeze` swells it
    const q = pr.squeeze ?? 0; T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
    T.shape(rr(-6 - q, -14, 12 + 2 * q, 22, 4), { fill: '#f4f1e8', lw: lw * .55, shade: () => T.fillOnly(rr(-6 - q, -8, 12 + 2 * q, 9, 1), '#ff8a1e') });
    T.shape([[-3, -14], [3, -14], [1, -26], [-1, -26]], { fill: '#ff8a1e', lw: lw * .5 });
    if (pr.drop) T.shape(ell(0, -29 - pr.drop * 2, 2.4, 3, 12), { fill: '#eef6ff', lw: lw * .35 });
    T.pop(); return;
  }
  if (pr.kind === 'cookie') {   // a chocolate-chip cookie, `bite` takes a chunk
    T.push(); T.translate(h[0], h[1] - 6); T.shape(ell(0, 0, 9, 9, 24), { fill: '#d9a050', lw: lw * .55, shade: () => { for (const [x, y] of [[-3, -3], [4, -1], [-1, 4], [3, 5]]) T.fillOnly(ell(x, y, 1.6, 1.4, 8), '#4a2a14'); } });
    T.pop(); return;
  }
  if (pr.kind === 'sticker') {   // a hand-made "SNACKS →" sticker
    T.push(); T.translate(h[0], h[1] - 8); T.rotate(-.1); T.shape(rr(-14, -5, 28, 10, 1.5), { fill: '#ffd84a', lw: lw * .5 }); T.line([[-9, 0], [7, 0]], lw * .5, '#c23a2e'); T.line([[3, -3], [8, 0], [3, 3]], lw * .5, '#c23a2e'); T.pop(); return;
  }
  if (pr.kind === 'cap' || pr.kind === 'pen') {   // a blue pen cap (hole at the top), or a white ballpoint with a blue plug; along +y from the fingers
    T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
    if (pr.kind === 'cap') { T.shape([[-2.6, 0], [2.6, 0], [2.6, -9], [1.6, -11], [-1.6, -11], [-2.6, -9]], { fill: '#2456c8', lw: lw * .55, shade: () => T.fillOnly(rr(.8, -11, 2, 11, 0), '#1a3f94') }); T.line([[3.2, -2], [3.2, -9]], lw * .4); T.dot(0, -10.6, Math.max(.8, .7 * T.zoom()), '#0c0c12'); if (pr.ring) { T.g.globalAlpha = Math.min(1, pr.ring); T.shape(ell(0, -10.6, 5, 4, 24), { fill: false, lw: lw * .55, line: '#ff3b30' }); T.g.globalAlpha = 1; } }
    else { T.shape(rr(-2.2, -14, 4.4, 26, 1.6), { fill: '#f2f0ea', lw: lw * .55, shade: () => T.fillOnly(rr(.8, -14, 1.4, 26, 0), '#d8d4ca') }); T.shape(rr(-2, -17, 4, 4, 1), { fill: '#2456c8', lw: lw * .5 }); T.shape([[-2.2, 12], [2.2, 12], [0, 16]], { fill: '#f2f0ea', lw: lw * .5 }); T.dot(0, -3, Math.max(.7, .6 * T.zoom()), '#0c0c12');
      if (pr.ring) { T.g.globalAlpha = Math.min(1, pr.ring); T.shape(ell(0, -3, 4.5, 4.5, 24), { fill: false, lw: lw * .5, line: '#ff3b30' }); T.g.globalAlpha = 1; } }
    T.pop(); return;
  }
  if (pr.kind === 'bald') {   // a shaved tennis ball (rubber), optionally in a knitted sweater
    T.push(); T.translate(h[0] + (pr.dx ?? 0), h[1] - 6 + (pr.dy ?? 0));
    T.shape(ell(0, 0, 7, 7, 28), { fill: '#b9c25a', lw: lw * .6, shade: () => { T.line(arc(-7.7, 0, 5.6, 7.7, -.9, .9, 10), lw * .45, '#7d8540'); T.line(arc(7.7, 0, 5.6, 7.7, Math.PI - .9, Math.PI + .9, 10), lw * .45, '#7d8540'); T.fillOnly(ell(-2.4, -2.6, 2, 1.3, 12), '#e6ecb0'); } });
    const sw = pr.sweater ?? 0;
    if (sw > 0) {   // the sweater slides down over the ball
      const top = -8, bot = lerp(-8, 5.5, sw);
      T.shape(rr(-7.6, top, 15.2, bot - top + .01, 2.5), { fill: '#d8342a', lw: lw * .55, shade: () => { for (let y = top + 2.5; y < bot; y += 4) T.fillOnly(rr(-8, y, 16, 1.6, 0), '#f4efe2'); } });
      if (sw > .6) for (const sx of [-1, 1]) T.shape(rr(sx > 0 ? 6.5 : -10.5, -2, 4, 3.4, 1.2), { fill: '#d8342a', lw: lw * .45 });
    }
    if (pr.shiver) T.line([[9, -3], [11, -5], [13, -3], [15, -5]], lw * .35);
    T.pop(); return;
  }
  if (pr.kind === 'ball' || pr.kind === 'tennis') {   // held in the fingertips, centred a little above the hand
    T.push(); T.translate(h[0] + (pr.dx ?? 0), h[1] - 4 + (pr.dy ?? 0));
    const r = pr.kind === 'ball' ? 4.6 : 7;
    T.shape(ell(0, 0, r, r, 28), { fill: pr.kind === 'ball' ? GOLF.white : '#d8e84a', lw: lw * .6, shade: () => {
      if (pr.kind === 'tennis') { T.line(arc(-r * 1.1, 0, r * .8, r * 1.1, -.9, .9, 10), lw * .5, '#ffffff'); T.line(arc(r * 1.1, 0, r * .8, r * 1.1, Math.PI - .9, Math.PI + .9, 10), lw * .5, '#ffffff'); }
      else if (!pr.shiny) for (const [x, y] of [[-2, -2], [1.5, -2.5], [-2.6, 1.2], [.8, .6], [2.8, 1.8], [-.4, 3]]) T.dot(x, y, Math.max(.7, .55 * T.zoom()), GOLF.dim);
      else T.fillOnly(ell(-1.6, -1.8, 1.6, 1.1, 12), '#ffffff');
    } });
    if (pr.sparkle) { const s = pr.sparkle * 9; T.g.globalAlpha = Math.min(1, pr.sparkle * 1.5); T.shape([[-3 - s, -6], [-3, -6 - s * .2], [-3 + s, -6], [-3, -6 + s * .2]], { fill: '#ffffff', lw: lw * .35 }); T.shape([[-3 - s * .2, -6], [-3, -6 - s], [-3 + s * .2, -6], [-3, -6 + s]], { fill: '#ffffff', lw: lw * .35 }); T.g.globalAlpha = 1; }
    T.pop(); return;
  }
  T.push(); T.translate(h[0], h[1]); T.rotate(pr.ang ?? 0);
  if (pr.kind === 'shaver') {   // an electric shaver: black body, a silver foil head along +y
    T.shape(rr(-3.6, -8, 7.2, 15, 3), { fill: '#24242a', lw: lw * .55, shade: () => T.fillOnly(rr(-1, -4, 2, 4, 1), '#5a5a66') });
    T.shape(rr(-4.6, 6, 9.2, 4, 1.5), { fill: '#c9ccd0', lw: lw * .55 });
    if (pr.buzz) { T.g.globalAlpha = .7; for (const k of [-1, 1]) T.line([[k * 7, 4], [k * 9, 6], [k * 7, 8]], lw * .3); T.g.globalAlpha = 1; }
  } else if (pr.kind === 'racket') {   // a racket: grip in the hand, the throat and an oval head with strings along +y
    const L = pr.len ?? 34;
    T.shape(rr(-1.8, -6, 3.6, 14, 1.4), { fill: '#f4f1ea', lw: lw * .5 });
    T.line([[-1.5, 8], [-4, L - 12]], lw * .45, '#2a2a2e'); T.line([[1.5, 8], [4, L - 12]], lw * .45, '#2a2a2e');
    T.shape(ell(0, L, 11, 15, 32), { fill: 'rgba(255,255,255,.12)', lw: lw * .7, line: '#c23a2e', shade: () => { T.g.globalAlpha = .55; for (let x = -9; x <= 9; x += 3) T.line([[x, L - 15], [x, L + 15]], lw * .14, '#f4f1ea'); for (let y = -12; y <= 12; y += 3) T.line([[-11, L + y], [11, L + y]], lw * .14, '#f4f1ea'); T.g.globalAlpha = 1; } });
    if (pr.blur) { T.g.globalAlpha = .3; for (const k of [1, 2]) T.shape(ell(-k * pr.blur * 7, L, 11, 15, 24), { fill: false, lw: lw * .4, line: '#c23a2e' }); T.g.globalAlpha = 1; }
  } else if (pr.kind === 'sand') {   // a sanding block held flat: wood on top, grit underneath
    T.shape(rr(-9, -4, 18, 7, 2), { fill: '#c08a52', lw: lw * .6, shade: () => T.fillOnly(rr(-9, 0, 18, 3, 0), '#9a6a3c') });
    T.shape(rr(-9, 3, 18, 2.2, .8), { fill: '#d8b07a', lw: lw * .45 });
  } else if (pr.kind === 'club') {   // a driver: grip in the hands, the shaft along +y, the head at `len`
    const L = pr.len ?? 80;
    T.shape(rr(-1.6, -6, 3.2, 16, 1.4), { fill: '#2a2a2e', lw: lw * .5 });
    T.line([[0, 9], [0, L - 3]], lw * .55, '#8d939b'); T.line([[0, 9], [0, L - 3]], lw * .22, '#e8ecf0');
    const f = pr.face ?? 1;
    T.shape(spline([[-1.5 * f, L - 4], [4 * f, L - 4], [10 * f, L - 1], [11 * f, L + 4], [5 * f, L + 6.5], [-3 * f, L + 5], [-3.5 * f, L + 1]], true, 6), { fill: '#24242a', lw: lw * .55, shade: () => T.fillOnly(ell(5 * f, L - 1.5, 3, 1.4, 10), '#5a5a66') });
    if (pr.blur) { T.g.globalAlpha = .35; for (const k of [1, 2, 3]) T.line([[0, 9], [-k * pr.blur * 6, L]], lw * .5, '#c8ccd2'); T.g.globalAlpha = 1; }
  } else { T.pop(); return _drawProp0(T, pr, h, lw); }
  T.pop();
}

// a tennis headband: a white terry band across the forehead, a red stripe
HAT.band = (col = '#ffffff', stripe = '#d8342a') => (T, lw, x, y, rx, ry, aw) => {
  const by = y - 16;
  T.shape(spline([[x - rx * 1.0, by + 4], [x - rx * .6, by - 2], [x, by - 3], [x + rx * .6, by - 2], [x + rx * 1.0, by + 4], [x + rx * .98, by - 6], [x + rx * .6, by - 11], [x, by - 12], [x - rx * .6, by - 11], [x - rx * .98, by - 6]], true, 6), { fill: col, lw, shade: () => { T.fillOnly(rr(x - rx * 1.1, by - 7.5, rx * 2.2, 2.4, 0), stripe); T.fillOnly(ell(x + aw * 30, by - 4, 10, 10, 16), '#dcdfe8'); } });
};
