// 2D overlay for the vertical frame (1080×1920): rule cards, dialogue boxes, narration subtitles, title, fades.
import { VO, SQUAWKS, CARDS, T, DUR } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
}
export const CREDIT = 'Voices: Kokoro TTS  ·  Type: Cinzel, Cormorant Garamond (OFL)';

function ornament(cx, y, w, a) {
  g.save(); g.globalAlpha = a; g.fillStyle = '#e2c989'; g.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, 'rgba(226,201,137,1)'); gr.addColorStop(1, 'rgba(226,201,137,0)');
    g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke();
    g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill();
  }
  g.strokeStyle = '#c9a863'; g.beginPath(); g.moveTo(cx, y - 8); g.lineTo(cx + 8, y); g.lineTo(cx, y + 8); g.lineTo(cx - 8, y); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, y - 3.5); g.lineTo(cx + 3.5, y); g.lineTo(cx, y + 3.5); g.lineTo(cx - 3.5, y); g.closePath(); g.fill();
  g.restore();
}
function spacedW(text, sp) { return [...text].reduce((a, c) => a + g.measureText(c).width, 0) + sp * ([...text].length - 1); }
function spaced(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width); let cx = x - spacedW(text, sp) / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; }); }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }

// —— Rule cards (upper third, over a dark translucent plate) ——
const CARD_Y = 300;
function cardA(c, t) { return ss(seg(t, c.a, c.a + .35)) * (1 - ss(seg(t, c.b - .35, c.b))); }
function ruleCard(t, c) {
  const a = cardA(c, t); if (a <= 0) return;
  const a1 = ss(seg(t, c.a + .1, c.a + .5)) * (1 - ss(seg(t, c.b - .35, c.b)));
  g.save();
  const pl = g.createLinearGradient(0, CARD_Y - 150, 0, CARD_Y + 170); pl.addColorStop(0, 'rgba(6,8,18,0)'); pl.addColorStop(.3, 'rgba(6,8,18,.62)'); pl.addColorStop(.7, 'rgba(6,8,18,.62)'); pl.addColorStop(1, 'rgba(6,8,18,0)');
  g.globalAlpha = a; g.fillStyle = pl; g.fillRect(0, CARD_Y - 150, W, 320);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#d8c28e'; g.font = '500 44px Cinzel'; spaced(c.label, W / 2, CARD_Y - 52, 12);
  ornament(W / 2, CARD_Y + 2, 230 * (.4 + .6 * a), a);
  g.globalAlpha = a1; g.fillStyle = '#f3ead6'; g.font = 'italic 500 70px "Cormorant Garamond"';
  glowText(() => g.fillText(c.line, W / 2, CARD_Y + 74 - (1 - a1) * 10), 'rgba(255,190,110,.35)', 24);
  g.restore();
}

// —— Dialogue box (lower third) ——
const BOX = { w: 960, h: 190, y: 1330 };
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function dialog(t, who, text, box, vt, vd) {
  const a = ss(seg(t, box[0], box[0] + .3)) * (1 - ss(seg(t, box[1] - .3, box[1])));
  if (a <= 0) return;
  const { w: bw, h: bh } = BOX, x = (W - bw) / 2, y = BOX.y + (1 - ss(seg(t, box[0], box[0] + .3))) * 14;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + bh); bgr.addColorStop(0, 'rgba(14,18,34,.88)'); bgr.addColorStop(1, 'rgba(6,8,18,.92)');
  g.fillStyle = bgr; g.fillRect(x, y, bw, bh);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, bw - 15, bh - 15);
  for (const [cx, cy] of [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]]) { g.fillStyle = '#e2c989'; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
  g.font = '600 38px "Cormorant Garamond"'; const nw = g.measureText(who).width + 60;
  g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x + 34, y - 28, nw, 54); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.5; g.strokeRect(x + 34.5, y - 27.5, nw - 1, 53);
  g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(who, x + 64, y - 1);
  g.font = '500 58px "Cormorant Garamond"'; g.fillStyle = '#f4efe4';
  const n = text.length, shown = Math.floor(n * clamp((t - vt + .05) / (vd * .9)));
  const lines = wrap(text, bw - 140); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 64, y + 98 + i * 64 - (lines.length - 1) * 30); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = '#e2c989'; const tx = x + bw - 54, ty = y + bh - 36; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}

// —— Narration subtitles ——
const SUB_Y = 1720;
function subtitle(t, v) {
  const d = DURS[v.id] || 2, t1 = v.t + Math.max(1.9, d + .75), a = ss(seg(t, v.t - .35, v.t)) * (1 - ss(seg(t, t1 - .3, t1)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'italic 500 60px "Cormorant Garamond"';
  const tw = g.measureText(v.sub).width;
  const sh = g.createLinearGradient(0, SUB_Y - 80, 0, SUB_Y + 44); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(0, SUB_Y - 80, W, 124);
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = '#f6f0e2'; g.fillText(v.sub, W / 2, SUB_Y);
  g.restore();
}
export const subWindow = v => [v.t - .35, v.t + Math.max(1.9, (DURS[v.id] || 2) + .75)];

// —— Title ——
const TITLE = { lines: ['YOU ARE A', 'FISH SELLER'], tag: 'Four rules. One seagull.' };
function title(t) {
  const a = ss(seg(t, T.title, T.title + 1.0)), out = 1 - ss(seg(t, DUR - .9, DUR));
  if (a <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a * out * .45; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalAlpha = a * out; g.font = '700 96px Cinzel';
  const gr = g.createLinearGradient(0, 640, 0, 860); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; glowText(() => { spaced(TITLE.lines[0], W / 2, 690, 12); spaced(TITLE.lines[1], W / 2, 810, 12); }, 'rgba(255,200,120,.55)', 40);
  ornament(W / 2, 900, 300 * (.3 + .7 * a), a * out);
  const b = ss(seg(t, T.title + .8, T.title + 1.6));
  g.globalAlpha = b * out; g.font = 'italic 500 60px "Cormorant Garamond"'; g.fillStyle = '#f3ead6'; g.fillText(TITLE.tag, W / 2, 980);
  const c = ss(seg(t, T.title + 1.6, T.title + 2.4));
  g.globalAlpha = c * out * .75; g.font = '500 30px "Cormorant Garamond"'; g.fillStyle = '#cfc6b2'; g.fillText(CREDIT, W / 2, H - 120);
  g.restore();
}

function blackout(t) {
  let a = 1 - ss(seg(t, 0, .45));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  for (const c of CARDS) ruleCard(t, c);
  for (const v of VO) { if (v.card) continue; if (v.dlg) dialog(t, v.who, v.sub, v.box, v.t, DURS[v.id] || 1); else subtitle(t, v); }
  for (const q of SQUAWKS) dialog(t, 'GULL', 'SQUAWK.', q.box, q.t, .6);
  title(t);
  blackout(t);
}

// Every on-screen text that must be read, with its box (for core/render/readcheck.mjs). Subtitles are checked by the .srt.
export function texts(t) {
  const out = [];
  for (const c of CARDS) if (cardA(c, t) > 0) {
    out.push({ id: 'card' + c.n + 'L', text: c.label, x0: 200, y0: CARD_Y - 80, x1: 880, y1: CARD_Y - 24 });
    if (t >= c.a + .1) out.push({ id: 'card' + c.n, text: c.line, x0: 60, y0: CARD_Y + 30, x1: 1020, y1: CARD_Y + 120 });
  }
  const box = (id, text, bx) => { if (t >= bx[0] && t < bx[1]) out.push({ id, text, x0: (W - BOX.w) / 2, y0: BOX.y - 28, x1: (W + BOX.w) / 2, y1: BOX.y + BOX.h }); };
  for (const v of VO) if (v.dlg) box(v.id, v.sub, v.box);
  for (const q of SQUAWKS) box(q.id, 'SQUAWK.', q.box);
  if (t >= T.title && t < DUR - .9) { out.push({ id: 'title', text: TITLE.lines.join(' '), x0: 60, y0: 620, x1: 1020, y1: 870 }); if (t >= T.title + .8) out.push({ id: 'tag', text: TITLE.tag, x0: 60, y0: 940, x1: 1020, y1: 1020 }); if (t >= T.title + 1.6) out.push({ id: 'credit', text: CREDIT, x0: 60, y0: H - 140, x1: 1020, y1: H - 100, pass: true }); }
  return out;
}
