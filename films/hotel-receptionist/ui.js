// 2D overlay for the vertical frame (1080×1920): quest/alert banners, the game HUD, dialogue boxes, narration subtitles, the GAME OVER card.
import { VO, BANNERS, T, DUR, QUESTION, keysLeft, xpAt, patience, guestsIn } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
export const HUD = {};   // screen anchors, written by the set each frame
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

// —— Dialogue box (lower third) ——
const BOX = { w: 960, h: 190, y: 1330 };
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function dialog(t, who, text, box, vt, vd) {
  const a = (box[0] <= 0 ? 1 : ss(seg(t, box[0], box[0] + .3))) * (box[1] >= DUR ? 1 : 1 - ss(seg(t, box[1] - .3, box[1])));   // the hook is on frame 0; the loop line is cut, not faded
  if (a <= 0) return;
  const { w: bw, h: bh } = BOX, x = (W - bw) / 2, y = BOX.y + (box[0] <= 0 ? 0 : (1 - ss(seg(t, box[0], box[0] + .3))) * 14);
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
  const n = text.length, shown = box[0] <= 0 ? n : Math.floor(n * clamp((t - vt + .05) / (vd * .9)));
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


const CARD_Y = 380;
// —— Banners (upper third): a small kicker line over the big line ——
function banA(b, t) { return ss(seg(t, b.a, b.a + .35)) * (1 - ss(seg(t, b.b - .35, b.b))); }
function banner(t, b) {
  const a = banA(b, t); if (a <= 0) return;
  const alert = b.id === 'alert', pop = 1 + .08 * (1 - ss(seg(t, b.a, b.a + .25)));
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const pl = g.createLinearGradient(0, CARD_Y - 110, 0, CARD_Y + 90); pl.addColorStop(0, 'rgba(6,8,18,0)'); pl.addColorStop(.3, alert ? 'rgba(60,6,10,.72)' : 'rgba(6,8,18,.66)'); pl.addColorStop(.7, alert ? 'rgba(60,6,10,.72)' : 'rgba(6,8,18,.66)'); pl.addColorStop(1, 'rgba(6,8,18,0)');
  g.fillStyle = pl; g.fillRect(0, CARD_Y - 110, W, 200);
  g.font = '500 36px Cinzel'; g.fillStyle = alert ? '#ff9a8a' : '#d8c28e'; spaced(b.kicker, W / 2, CARD_Y - 52, 8);
  g.save(); g.translate(W / 2, CARD_Y + 8); g.scale(pop, pop);
  g.font = '700 62px Cinzel'; g.fillStyle = alert ? '#fff0e0' : '#f0dca8'; glowText(() => spaced(b.text, 0, 0, 4), alert ? 'rgba(255,80,60,.55)' : 'rgba(255,200,120,.45)', 22);
  g.restore();
  ornament(W / 2, CARD_Y + 58, 220 * (.4 + .6 * a), a);
  g.restore();
}

// —— The game HUD: XP top left, KEYS top right, the Customer's patience bar, pop-ups, the guest counter ——
function plate(x, y, w, h, a) { g.fillStyle = `rgba(8,10,20,${.78 * a})`; g.fillRect(x, y, w, h); g.strokeStyle = `rgba(226,201,137,${.95 * a})`; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); g.strokeStyle = `rgba(226,201,137,${.35 * a})`; g.lineWidth = 2; g.strokeRect(x + 7, y + 7, w - 14, h - 14); }
function keyGlyph(x, y, s, col) { g.fillStyle = col; g.fillRect(x, y, s * 3, s * 3); g.fillStyle = 'rgba(8,10,20,1)'; g.fillRect(x + s, y + s, s, s); g.fillStyle = col; g.fillRect(x + s * 3, y + s, s * 4, s); g.fillRect(x + s * 5, y + s * 2, s, s); g.fillRect(x + s * 6, y + s * 2, s, s * 1.5); }
const hudA = t => t < T.quest ? 0 : t < T.hired ? ss(seg(t, T.quest, T.quest + .4)) * (1 - ss(seg(t, T.fired - .2, T.fired + .2))) : 0;
function hud(t) {
  const a = hudA(t); if (a <= 0) return;
  g.save(); g.textBaseline = 'middle';
  // XP
  plate(40, 70, 300, 92, a); g.globalAlpha = a; g.font = '700 40px Cinzel'; g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.fillText('XP', 66, 117);
  const xp = xpAt(t); g.fillStyle = xp < 0 ? '#ff6a5a' : '#fff4d8'; g.textAlign = 'right'; g.fillText(String(xp), 312, 117);
  // KEYS
  plate(W - 340, 70, 300, 92, a); g.textAlign = 'left'; keyGlyph(W - 314, 102, 8, '#e8c060'); g.font = '700 40px Cinzel'; g.fillStyle = '#e8d5a4'; g.fillText('KEYS', W - 238, 117);
  const k = keysLeft(t); g.textAlign = 'right'; g.fillStyle = k === 0 ? '#ff6a5a' : '#fff4d8'; g.fillText(String(k), W - 66, 117);
  // the guest counter (tour group)
  const ga = ss(seg(t, T.door, T.door + .3)) * (1 - ss(seg(t, T.crunch, T.crunch + .4)));
  if (ga > 0) { g.globalAlpha = a * ga; plate(W / 2 - 170, 70, 340, 92, 1); g.textAlign = 'center'; g.font = '700 40px Cinzel'; g.fillStyle = '#fff4d8'; g.fillText(`GUESTS ${guestsIn(t)}/40`, W / 2, 117); }
  g.restore();
  // the patience bar over the Customer
  const pa = a * (t < T.ring ? 1 : 1 - ss(seg(t, T.ring, T.ring + .3)));
  if (pa > 0 && HUD.cust) {
    const cx = Math.min(W - 150, Math.max(150, HUD.cust[0])), cy = HUD.cust[1], w = 220, h = 30, x = cx - w / 2, y = cy - 66, p = patience(t), seg8 = 10;
    g.save(); g.globalAlpha = pa; g.fillStyle = 'rgba(8,10,20,.85)'; g.fillRect(x - 6, y - 6, w + 12, h + 12); g.strokeStyle = '#e2c989'; g.lineWidth = 3; g.strokeRect(x - 4.5, y - 4.5, w + 9, h + 9);
    for (let i = 0; i < seg8; i++) { const on = (i + .5) / seg8 < p; g.fillStyle = on ? (p < .4 ? '#ff4a3a' : p < .7 ? '#ffb040' : '#ff6a8a') : 'rgba(255,255,255,.12)'; g.fillRect(x + i * (w / seg8) + 2, y + 2, w / seg8 - 4, h - 4); }
    g.font = '600 30px "Cormorant Garamond"'; g.fillStyle = '#f4efe4'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('PATIENCE', cx, y - 10);
    g.restore();
  }
}
// "!" bubbles over heads
function bang(t, at, a0, a1, big = 1) {
  if (!at || t < a0 || t >= a1) return;
  const u = t - a0, a = ss(seg(t, a0, a0 + .1)) * (1 - ss(seg(t, a1 - .15, a1))), s = big * (1 + .3 * Math.exp(-u * 10) * Math.cos(u * 30));
  const x = Math.min(W - 70, Math.max(70, at[0])), y = at[1]; g.save(); g.globalAlpha = a; g.translate(x, y - 150); g.scale(s, s);
  g.fillStyle = '#fff8e8'; g.strokeStyle = '#1a1016'; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -40); g.lineTo(30, -40); g.lineTo(30, 26); g.lineTo(10, 26); g.lineTo(0, 42); g.lineTo(-10, 26); g.lineTo(-30, 26); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#d81c2c'; g.fillRect(-7, -30, 14, 34); g.fillRect(-7, 10, 14, 10);
  g.restore();
}
// floating pop-ups: +10 XP, −1 KEY
function popup(t, at, a0, text, col) {
  if (!at || t < a0 || t > a0 + 1.4) return;
  const u = t - a0, a = ss(seg(t, a0, a0 + .12)) * (1 - ss(seg(t, a0 + 1.0, a0 + 1.4)));
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 64px Cinzel';
  g.lineWidth = 10; g.strokeStyle = 'rgba(10,8,16,.9)'; const y = at[1] - 120 - u * 70; g.strokeText(text, at[0], y); g.fillStyle = col; g.fillText(text, at[0], y);
  g.restore();
}

// —— GAME OVER: YOU'RE FIRED, and the question ——
const GO = { a: T.fired, b: T.hired };
function gameOver(t) {
  const a = ss(seg(t, GO.a, GO.a + .3)) * (1 - ss(seg(t, GO.b - .35, GO.b))); if (a <= 0) return;
  const pop = 1 + .25 * Math.exp(-(t - GO.a) * 9) * Math.cos((t - GO.a) * 26);
  g.save(); g.globalAlpha = a * .55; g.fillStyle = '#1a0004'; g.fillRect(0, 0, W, H);
  g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = 620; g.fillStyle = 'rgba(70,6,12,.9)'; g.fillRect(60, y0 - 190, W - 120, 380); g.strokeStyle = '#e2c989'; g.lineWidth = 4; g.strokeRect(62, y0 - 188, W - 124, 376); g.strokeStyle = 'rgba(226,201,137,.4)'; g.lineWidth = 2; g.strokeRect(76, y0 - 174, W - 152, 348);
  g.font = '500 48px Cinzel'; g.fillStyle = '#ffb4a8'; spaced('GAME OVER', W / 2, y0 - 100, 14);
  g.save(); g.translate(W / 2, y0 + 30); g.scale(pop, pop); g.font = '700 118px Cinzel'; g.fillStyle = '#fff2dc'; glowText(() => g.fillText('YOU’RE FIRED', 0, 0), 'rgba(255,60,40,.8)', 34); g.restore();
  ornament(W / 2, y0 + 122, 260, a);
  const q = ss(seg(t, T.ask, T.ask + .4)) * a;
  if (q > 0) { g.globalAlpha = q; g.fillStyle = 'rgba(8,10,20,.82)'; g.fillRect(60, 900, W - 120, 210); g.strokeStyle = 'rgba(226,201,137,.9)'; g.lineWidth = 2; g.strokeRect(61, 901, W - 122, 208);
    g.font = 'italic 500 62px "Cormorant Garamond"'; g.fillStyle = '#f6f0e2'; const [l1, l2] = QUESTION.split(': '); g.fillText(l1 + ':', W / 2, 965); g.font = '600 66px "Cormorant Garamond"'; g.fillStyle = '#ffe2a0'; g.fillText(l2, W / 2, 1045); }
  g.restore();
}

const COVER = new URLSearchParams(location.search).has('cover');
function coverCaption() {   // the cover frame (channel grid, search): a 2–4 word caption, top and bottom left clear for the UI
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  const pl = g.createLinearGradient(0, 180, 0, 640); pl.addColorStop(0, 'rgba(6,8,18,0)'); pl.addColorStop(.25, 'rgba(6,8,18,.7)'); pl.addColorStop(.75, 'rgba(6,8,18,.7)'); pl.addColorStop(1, 'rgba(6,8,18,0)');
  g.fillStyle = pl; g.fillRect(0, 180, W, 460);
  g.font = '500 44px Cinzel'; g.fillStyle = '#d8c28e'; spaced('JOB #4', W / 2, 300, 14);
  g.font = '700 150px Cinzel'; g.lineWidth = 14; g.strokeStyle = 'rgba(10,8,16,.9)'; g.strokeText('ROOM 7:', W / 2, 420); g.fillStyle = '#fff2dc'; glowText(() => g.fillText('ROOM 7:', W / 2, 420), 'rgba(255,200,120,.5)', 24);
  g.strokeText('GOAT', W / 2, 560); g.fillStyle = '#ffd070'; glowText(() => g.fillText('GOAT', W / 2, 560), 'rgba(255,160,60,.6)', 30);
  g.restore();
}
export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (COVER) { coverCaption(); return; }
  hud(t);
  bang(t, HUD.cust, T.drain, T.drain + 1.2);
  bang(t, HUD.you, T.ring, T.ring + 1.0, .8);
  popup(t, HUD.you, T.xp, '+10 XP', '#9cf06a');
  popup(t, HUD.goat, T.crunch + .1, '−1 KEY', '#ff6a5a');
  for (const v of VO) { if (v.dlg) dialog(t, v.who, v.sub, v.box, v.t, DURS[v.id] || 1); else subtitle(t, v); }
  for (const b of BANNERS) banner(t, b);
  gameOver(t);
}

// Every on-screen text that must be read, with its box (for core/render/readcheck.mjs). Subtitles are checked by the .srt.
export function texts(t) {
  const out = [];
  const box = (id, text, bx, pass) => { if (t >= bx[0] && t < bx[1]) out.push({ id, text, x0: (W - BOX.w) / 2, y0: BOX.y - 28, x1: (W + BOX.w) / 2, y1: BOX.y + BOX.h, pass }); };
  for (const v of VO) if (v.dlg) box(v.id, v.sub, v.box, v.loop);   // the loop line is cut by the loop on purpose
  for (const b of BANNERS) if (banA(b, t) > 0) out.push({ id: b.id, text: b.kicker + ' ' + b.text, x0: 60, y0: CARD_Y - 80, x1: 1020, y1: CARD_Y + 50 });
  if (t >= GO.a && t < GO.b - .35) out.push({ id: 'fired', text: 'GAME OVER YOU’RE FIRED', x0: 60, y0: 430, x1: 1020, y1: 810 });
  if (t >= T.ask && t < GO.b - .35) out.push({ id: 'ask', text: QUESTION, x0: 60, y0: 900, x1: 1020, y1: 1110 });
  return out;
}
