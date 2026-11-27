// 2D overlay for the vertical frame (1080×1920), in a chunky pixel style: the frame-0 caption, quest/alert banners, the game HUD,
// emotes over heads, dialogue boxes, narration subtitles, flashes, the GAME OVER card.
import { VO, BANNERS, CAPTION, T, DUR, QUESTION, FLASHES, xpAt, patience, queueCount } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
export const HUD = {};   // screen anchors, written by the set each frame
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const pop = (t, a, k = 1) => { const u = t - a; return u < 0 ? 0 : 1 + .35 * k * Math.exp(-u * 11) * Math.cos(u * 32) * (u < .02 ? 0 : 1) - (u < .06 ? .25 * k * (1 - u / .06) : 0); };
const PX = "'Pixelify Sans'", SK = 'Silkscreen';
const INK = '#120c16';

export async function overlayReady() {
  await Promise.all([`700 40px ${PX}`, `500 40px ${PX}`, `400 40px ${SK}`, `700 40px ${SK}`, `400 16px ${SK}`, `700 16px ${SK}`].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
}
export const CREDIT = 'Voices: Kokoro TTS  ·  Type: Pixelify Sans, Silkscreen (OFL)';

// —— pixel box: hard drop shadow, notched corners, a 2-tone border ——
function pbox(x, y, w, h, o = {}) {
  const b = o.b ?? 6, n = o.n ?? 6;
  const notch = (X, Y, Wd, Hd, col) => { g.fillStyle = col; g.fillRect(X + n, Y, Wd - 2 * n, Hd); g.fillRect(X, Y + n, Wd, Hd - 2 * n); g.fillRect(X + n / 2, Y + n / 2, Wd - n, Hd - n); };
  if (o.shadow !== false) notch(x + 10, y + 10, w, h, 'rgba(8,4,12,.55)');
  notch(x, y, w, h, o.edge ?? INK);
  notch(x + b, y + b, w - 2 * b, h - 2 * b, o.rim ?? '#f4ecd8');
  notch(x + b * 2, y + b * 2, w - 4 * b, h - 4 * b, o.fill ?? '#1c1830');
  if (o.shine !== false) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + b * 2 + n, y + b * 2, w - 4 * b - 2 * n, Math.max(4, (h - 4 * b) * .18)); }
}
function outlined(text, x, y, font, fill, stroke = INK, lw = 12) {
  g.font = font; g.lineJoin = 'miter'; g.miterLimit = 2; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = fill; g.fillText(text, x, y);
}
const WHO = {
  'YOU': { bg: '#86d636', fg: INK }, 'THE CUSTOMER': { bg: '#9448c0', fg: '#fff4ff' }, 'THE DAD': { bg: '#c42232', fg: '#fff4e8' }, 'THE MANAGER': { bg: '#767e8c', fg: '#ffffff' },
};

// —— dialogue box (lower third), typed on ——
const BOX = { w: 980, h: 210, y: 1330 };
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function dialog(t, who, text, box, vt, vd) {
  if (t < box[0] || t >= box[1]) return;
  const out = box[1] >= DUR ? 1 : 1 - ss(seg(t, box[1] - .18, box[1]));
  const s = box[0] <= 0 ? 1 : Math.min(1.06, .86 + .14 * ss(seg(t, box[0], box[0] + .12)) + .05 * Math.sin(seg(t, box[0] + .08, box[0] + .3) * Math.PI));
  const { w: bw, h: bh } = BOX, x = (W - bw) / 2, y = BOX.y;
  g.save(); g.globalAlpha = out; g.translate(W / 2, y + bh / 2); g.scale(s, s); g.translate(-W / 2, -(y + bh / 2));
  pbox(x, y, bw, bh, { fill: '#17142a' });
  const C = WHO[who] || { bg: '#f0c84a', fg: INK };
  g.font = `700 36px ${SK}`; const nw = g.measureText(who).width + 52;
  pbox(x + 30, y - 40, nw, 70, { fill: C.bg, rim: '#f4ecd8', b: 5, n: 5, shine: false });
  g.fillStyle = C.fg; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(who, x + 56, y - 3);
  g.font = `500 60px ${PX}`; g.fillStyle = '#fbf6ea';
  const n = text.length, shown = box[0] <= 0 ? n : Math.floor(n * clamp((t - vt + .05) / (vd * .85)));
  const lines = wrap(text, bw - 140); let k = shown;
  lines.forEach((L, i) => { const str = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(str, x + 62, y + 112 + i * 68 - (lines.length - 1) * 32); });
  if (shown >= n && Math.floor(t * 3) % 2 === 0) { g.fillStyle = '#f0c84a'; const tx = x + bw - 66, ty = y + bh - 50; g.fillRect(tx - 12, ty - 6, 24, 6); g.fillRect(tx - 6, ty, 12, 6); }
  g.restore();
}

// —— narration subtitles ——
const SUB_Y = 1740;
function subtitle(t, v) {
  const d = DURS[v.id] || 2, t1 = v.t + Math.max(1.9, d + .75), a = ss(seg(t, v.t - .2, v.t)) * (1 - ss(seg(t, t1 - .2, t1)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  outlined(v.sub, W / 2, SUB_Y, `500 58px ${PX}`, '#fbf6ea', INK, 12);
  g.restore();
}
export const subWindow = v => [v.t - .2, v.t + Math.max(1.9, (DURS[v.id] || 2) + .75)];

// —— frame-0 caption: big, tilted, on screen from the first frame ——
function caption(t) {
  if (t < CAPTION.a || t >= CAPTION.b) return;
  const a = 1 - ss(seg(t, CAPTION.b - .2, CAPTION.b)), s = 1 + .12 * Math.exp(-t * 6) * Math.cos(t * 26);
  g.save(); g.globalAlpha = a; g.translate(W / 2, 380); g.rotate(-.05); g.scale(s, s); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(8,4,12,.55)'; g.font = `700 150px ${PX}`; g.fillText(CAPTION.text, 10, 12);
  outlined(CAPTION.text, 0, 0, `700 150px ${PX}`, '#ffd23a', INK, 22);
  g.restore();
}

// —— banners (upper third): slide in, kicker plate + big line ——
const CARD_Y = 380;
function banA(b, t) { return t >= b.a && t < b.b ? 1 - ss(seg(t, b.b - .2, b.b)) : 0; }
function banner(t, b) {
  const a = banA(b, t); if (a <= 0) return;
  const alert = b.id === 'alert', u = t - b.a, slide = (1 - ss(seg(t, b.a, b.a + .22))) * -W + 18 * Math.exp(-u * 9) * Math.sin(u * 30);
  g.save(); g.globalAlpha = a; g.translate(slide, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
  const bw = 940, bx = (W - bw) / 2;
  pbox(bx, CARD_Y - 70, bw, 160, { fill: alert ? (Math.floor(t * 4) % 2 ? '#8a1018' : '#b41a26') : '#1a3a6a', rim: alert ? '#ffd23a' : '#f4ecd8' });
  pbox(W / 2 - 230, CARD_Y - 112, 460, 70, { fill: alert ? '#ffd23a' : '#f0c84a', b: 5, n: 5, shine: false });
  g.font = `700 34px ${SK}`; g.fillStyle = INK; g.fillText(b.kicker, W / 2, CARD_Y - 76);
  outlined(b.text, W / 2, CARD_Y + 18, `700 74px ${PX}`, '#fff6e0', INK, 12);
  g.restore();
}

// —— HUD: XP (top left), QUEUE (top right), the Customer's patience ——
const hudA = t => t < T.quest ? 0 : t < T.fired - .15 ? 1 : 0;
function icon(x, y, s, rows, col) { g.fillStyle = col; rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') g.fillRect(x + i * s, y + j * s, s, s); })); }
const STAR = ['..#..', '.###.', '#####', '.###.', '.#.#.'], PERSON = ['.##.', '.##.', '####', '####', '.##.', '.##.'];
function hud(t) {
  const a = hudA(t); if (a <= 0) return;
  const s = pop(t, T.quest, .6);
  g.save(); g.textBaseline = 'middle';
  g.translate(190, 120); g.scale(s, s); g.translate(-190, -120);
  pbox(40, 70, 300, 100, { fill: '#17142a', b: 5, n: 5 });
  icon(66, 98, 9, STAR, '#ffd23a'); g.font = `700 40px ${SK}`; g.fillStyle = '#f0c84a'; g.textAlign = 'left'; g.fillText('XP', 124, 121);
  const xp = xpAt(t), xs = t >= T.refund && t < T.refund + .4 ? 1 + .3 * (1 - (t - T.refund) / .4) : 1;
  g.save(); g.translate(312, 121); g.scale(xs, xs); g.textAlign = 'right'; g.font = `700 44px ${PX}`; g.fillStyle = xp < 0 ? '#ff5a4a' : '#fbf6ea'; g.fillText(String(xp), 0, 0); g.restore();
  g.restore();
  g.save(); g.textBaseline = 'middle';
  const q = queueCount(t), qs = t >= T.alert && t < 19.6 ? 1 + .06 * Math.sin(t * 40) : 1;
  g.translate(W - 210, 120); g.scale(s * qs, s * qs); g.translate(-(W - 210), -120);
  pbox(W - 380, 70, 340, 100, { fill: q > 50 ? '#5a0a12' : '#17142a', b: 5, n: 5 });
  icon(W - 354, 94, 8, PERSON, '#9ad0ff'); g.font = `700 30px ${SK}`; g.fillStyle = '#f0c84a'; g.textAlign = 'left'; g.fillText('QUEUE', W - 312, 121);
  g.textAlign = 'right'; g.font = `700 44px ${PX}`; g.fillStyle = q > 50 ? '#ff7a5a' : '#fbf6ea'; g.fillText(String(q), W - 66, 121);
  g.restore();
  // the patience bar over the Customer, until the refund
  const pa = t < T.refund ? 1 : 1 - ss(seg(t, T.refund, T.refund + .25));
  if (pa > 0 && HUD.cust) {
    const cx = Math.min(W - 150, Math.max(150, HUD.cust[0])), cy = HUD.cust[1], w = 230, h = 34, x = cx - w / 2, y = cy - 80, p = patience(t), n = 8;
    const shake = t >= T.drain && t < T.drain + .4 ? Math.sin(t * 90) * 6 * (1 - (t - T.drain) / .4) : 0;
    g.save(); g.globalAlpha = pa; g.translate(shake, 0);
    pbox(x - 12, y - 12, w + 24, h + 24, { fill: '#17142a', b: 4, n: 4, shine: false });
    for (let i = 0; i < n; i++) { const on = (i + .5) / n < p; g.fillStyle = on ? (p < .35 ? '#ff3a2a' : p < .7 ? '#ffb030' : '#7ae04a') : 'rgba(255,255,255,.12)'; g.fillRect(x + i * (w / n) + 3, y + 3, w / n - 6, h - 6); }
    g.textAlign = 'center'; g.textBaseline = 'bottom'; outlined('PATIENCE', cx, y - 18, `700 28px ${SK}`, '#fbf6ea', INK, 8);
    g.restore();
  }
}

// —— emotes over heads ——
function bubble(t, at, a0, a1, kind, big = 1) {
  if (!at || t < a0 || t >= a1) return;
  const u = t - a0, a = 1 - ss(seg(t, a1 - .12, a1)), s = big * (u < .1 ? .4 + 6 * u : 1 + .25 * Math.exp(-(u - .1) * 10) * Math.cos((u - .1) * 30));
  const x = Math.min(W - 80, Math.max(80, at[0])), y = at[1] - 150 - Math.min(u, .3) * 40;
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  if (kind === 'sweat') {
    for (const [dx, dy, k] of [[-40, 30, 1], [36, 10, .8], [-6, -20, .7]]) { const fall = (u * 120 * k) % 90; g.fillStyle = '#8acfff'; g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath(); g.moveTo(dx, dy + fall - 22 * k); g.lineTo(dx + 13 * k, dy + fall); g.lineTo(dx, dy + fall + 12 * k); g.lineTo(dx - 13 * k, dy + fall); g.closePath(); g.fill(); g.stroke(); }
  } else if (kind === 'vein') {
    g.fillStyle = '#ff3a2a'; g.strokeStyle = INK; g.lineWidth = 6;
    for (const [rx, ry] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { g.beginPath(); g.moveTo(rx * 8, ry * 8); g.lineTo(rx * 34, ry * 14); g.lineTo(rx * 30, ry * 26); g.lineTo(rx * 14, ry * 34); g.lineTo(rx * 8, ry * 8); g.closePath(); g.fill(); g.stroke(); }
  } else {
    const txt = kind === 'q' ? '?!' : kind === '!!' ? '!!' : '!';
    g.fillStyle = '#fbf6ea'; g.strokeStyle = INK; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-44, -46); g.lineTo(44, -46); g.lineTo(44, 30); g.lineTo(14, 30); g.lineTo(0, 50); g.lineTo(-14, 30); g.lineTo(-44, 30); g.closePath(); g.fill(); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 70px ${PX}`; g.fillStyle = kind === 'q' ? '#2c5aa0' : '#d81c2c'; g.fillText(txt, 0, -6);
  }
  g.restore();
}
// floating pop-ups: +10 XP, REFUND!
function popup(t, at, a0, text, col, size = 70) {
  if (!at || t < a0 || t > a0 + 1.5) return;
  const u = t - a0, a = 1 - ss(seg(t, a0 + 1.1, a0 + 1.5)), s = pop(t, a0, 1);
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.translate(at[0], at[1] - 130 - u * 80); g.scale(s, s); outlined(text, 0, 0, `700 ${size}px ${PX}`, col, INK, 14);
  g.restore();
}
// a rubber stamp slammed across the frame (the avalanche: there's text on screen while nobody speaks)
function stamp(t, a0, a1, text) {
  if (t < a0 || t >= a1) return;
  const u = t - a0, s = u < .08 ? 2.2 - 15 * u : 1 + .06 * Math.exp(-(u - .08) * 9) * Math.cos((u - .08) * 30), a = 1 - ss(seg(t, a1 - .2, a1));
  g.save(); g.globalAlpha = a; g.translate(W / 2, 630); g.rotate(-.12); g.scale(s, s); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeStyle = '#d81c2c'; g.lineWidth = 14; g.strokeRect(-330, -90, 660, 180); g.lineWidth = 5; g.strokeRect(-310, -72, 620, 144);
  g.fillStyle = 'rgba(255,240,230,.25)'; g.fillRect(-330, -90, 660, 180);
  outlined(text, 0, 6, `700 116px ${PX}`, '#e8202e', '#fff4ea', 10);
  g.restore();
}
function flash(t) { for (const f of FLASHES) if (t >= f && t < f + .2) { g.save(); g.globalAlpha = .75 * (1 - (t - f) / .2); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore(); } }

// —— GAME OVER: YOU'RE FIRED, and the question ——
const GO = { a: T.fired, b: T.hired };
function gameOver(t) {
  if (t < GO.a || t >= GO.b) return;
  const a = 1 - ss(seg(t, GO.b - .25, GO.b)), u = t - GO.a;
  g.save(); g.globalAlpha = a * .62; g.fillStyle = '#1a0006'; g.fillRect(0, 0, W, H);
  // scanlines
  g.globalAlpha = a * .18; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 3);
  g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = 640, drop = (1 - ss(seg(t, GO.a, GO.a + .18))) * -500 + 24 * Math.exp(-u * 8) * Math.sin(u * 28);
  g.save(); g.translate(0, drop);
  pbox(70, y0 - 200, W - 140, 400, { fill: '#6a0a14', rim: '#ffd23a' });
  g.font = `700 50px ${SK}`; g.fillStyle = '#ffd23a'; g.fillText('GAME OVER', W / 2, y0 - 110);
  const jit = u < .5 ? Math.round(Math.sin(u * 80) * 4) : 0;
  outlined('YOU’RE FIRED', W / 2 + jit, y0 + 20, `700 124px ${PX}`, '#fff2dc', INK, 16);
  const cnt = Math.max(5, 9 - Math.floor(u * 1.1)); g.font = `700 40px ${SK}`; g.fillStyle = Math.floor(u * 2.2) % 2 ? '#ffd23a' : '#ffb4a8'; g.fillText(`CONTINUE?  ${cnt}`, W / 2, y0 + 130);
  g.restore();
  const q = 0;   // the comment question lives in the pinned comment, not on a card mid-story (content playbook)
  if (q > 0) { g.globalAlpha = q; pbox(60, 920, W - 120, 230, { fill: '#17142a' });
    const [l1, l2] = QUESTION.split(': ');
    g.font = `500 56px ${PX}`; g.fillStyle = '#fbf6ea'; g.fillText(l1 + ':', W / 2, 998);
    outlined(l2, W / 2, 1076, `700 64px ${PX}`, '#ffd23a', INK, 10); }
  g.restore();
}

const COVER = new URLSearchParams(location.search).has('cover');
function coverCaption() {   // the cover frame (channel grid, search): a 2–4 word caption, top and bottom left clear for the UI
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  pbox(W / 2 - 150, 250, 300, 80, { fill: '#f0c84a', b: 5, n: 5, shine: false });
  g.font = `700 44px ${SK}`; g.fillStyle = INK; g.fillText('JOB #5', W / 2, 292);
  g.translate(W / 2, 520); g.rotate(-.06);
  outlined('UNOPENED?', 0, 0, `700 172px ${PX}`, '#ffd23a', INK, 24);
  g.restore();
}
export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (COVER) { coverCaption(); return; }
  flash(t);
  hud(t);
  bubble(t, HUD.you, -.12, .9, '!!', .9);   // frame 0: the hero's "!!" is already popping
  bubble(t, HUD.cust, T.drain, T.drain + 1.3, '!');
  bubble(t, HUD.you, T.catBite + .05, T.catBite + 1.1, 'q', .9);
  bubble(t, HUD.dad, T.dslam, T.dslam + .9, '!', .8);
  bubble(t, HUD.you, T.y2 - .2, T.alert, 'sweat');
  bubble(t, HUD.boss, 22.4, 24.6, 'vein', .9);
  popup(t, HUD.till, T.refund + .08, '+10 XP', '#9cf06a');
  popup(t, HUD.cust, T.refund, 'REFUND!', '#ffd23a', 80);
  stamp(t, T.crash + .1, T.boss + 1.25, 'CAGE FULL');
  for (const v of VO) { if (v.dlg) dialog(t, v.who, v.sub, v.box, v.t, DURS[v.id] || 1); else subtitle(t, v); }
  for (const b of BANNERS) banner(t, b);
  caption(t);
  gameOver(t);
}

// Every on-screen text that must be read, with its box (for core/render/readcheck.mjs). Subtitles are checked by the .srt.
export function texts(t) {
  const out = [];
  const box = (id, text, bx, pass) => { if (t >= bx[0] && t < bx[1]) out.push({ id, text, x0: (W - BOX.w) / 2, y0: BOX.y - 40, x1: (W + BOX.w) / 2, y1: BOX.y + BOX.h, pass }); };
  for (const v of VO) if (v.dlg) box(v.id, v.sub, v.box, v.loop);   // the loop line is cut by the loop on purpose
  for (const b of BANNERS) if (banA(b, t) > 0) out.push({ id: b.id, text: b.kicker + ' ' + b.text, x0: 70, y0: CARD_Y - 112, x1: 1010, y1: CARD_Y + 90 });
  if (t >= CAPTION.a && t < CAPTION.b) out.push({ id: 'caption', text: CAPTION.text, x0: 80, y0: 290, x1: 1000, y1: 470 });
  if (t >= GO.a && t < GO.b - .25) out.push({ id: 'fired', text: 'GAME OVER YOU’RE FIRED', x0: 70, y0: 440, x1: 1010, y1: 840 });
  if (t >= T.crash + .1 && t < T.boss + 1.25) out.push({ id: 'stamp', text: 'CAGE FULL', x0: 200, y0: 500, x1: 880, y1: 760 });
  return out;
}
