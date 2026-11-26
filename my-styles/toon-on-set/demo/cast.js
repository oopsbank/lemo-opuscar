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
  if (!p.armsBack) arms();
  // —— head ——
  T.push(); T.translate(0, SH - 6); T.rotate(p.tilt); T.translate(0, -(SH - 6));
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
  const mx = fx + p.turn * 2, my = HY + 15 + fdy * .6;
  if (sp.mustache) T.shape(spline([[mx - 12, my - 3], [mx - 3, my - 8], [mx, my - 6], [mx + 3, my - 8], [mx + 12, my - 3], [mx + 5, my - 4.5], [mx, my - 3.5], [mx - 5, my - 4.5]], true, 4), { fill: sp.mustache, lw: lw * .7 });
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
  T.pop();   // head
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
