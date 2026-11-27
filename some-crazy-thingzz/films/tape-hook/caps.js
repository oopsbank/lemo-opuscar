// caps.js — word-by-word Shorts captions: heavy rounded sans, white with a thick black outline and a short hard drop shadow, centred lower-middle.
// groups: [{ t0, t1, text, hot? }] — one to three words; `hot` flashes the group yellow (the punchline).
import { clamp, back } from '/core/lib.js';
export const CAP = { font: 'Baloo2', size: 92, y: .64, outline: 13, hot: '#ffd84a' };

export function capAt(groups, t) { for (const c of groups) if (t >= c.t0 && t < c.t1) return c; return null; }

const SLOTS = [CAP.y, .74, .54, .44];   // first slot whose band misses every keep-clear box
function capY(H, keep, w, W) {
  const hit = y => keep.some(k => k.y1 > y - CAP.size * .75 && k.y0 < y + CAP.size * .75 && k.x1 > (W - w) / 2 && k.x0 < (W + w) / 2);
  for (const s of SLOTS) if (!hit(H * s)) return H * s;
  return H * SLOTS[1];
}
export function drawCaps(g, groups, t, W, H, keep = []) {
  const c = capAt(groups, t); if (!c) return null;
  const k = clamp((t - c.t0) / .12), s = 1.18 - .18 * back(k, 2.2) + (k >= 1 ? 0 : 0);
  g.font = `800 ${CAP.size}px ${CAP.font}`; const x = W / 2, y = capY(H, keep, Math.min(W * .86, g.measureText(c.text).width + CAP.outline * 2), W);
  g.save(); g.translate(x, y); g.scale(s, s);
  g.font = `800 ${CAP.size}px ${CAP.font}`; const fit = Math.min(1, (W * .86) / (g.measureText(c.text).width + CAP.outline * 2)); g.scale(fit, fit);   // long groups shrink to stay inside the frame
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
  // hard drop shadow, outline, fill
  g.lineWidth = CAP.outline * 2; g.strokeStyle = '#000';
  g.save(); g.translate(0, 7); g.fillStyle = '#000'; g.strokeText(c.text, 0, 0); g.fillText(c.text, 0, 0); g.restore();
  g.strokeText(c.text, 0, 0);
  g.fillStyle = c.hot ? CAP.hot : '#fff'; g.fillText(c.text, 0, 0);
  const w = g.measureText(c.text).width;
  g.restore();
  return { id: 'cap', text: c.text, x0: x - w / 2 - CAP.outline, x1: x + w / 2 + CAP.outline, y0: y - CAP.size * .6, y1: y + CAP.size * .6 };
}
