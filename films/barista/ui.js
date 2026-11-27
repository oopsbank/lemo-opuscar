// 2D overlay for the vertical frame (1080×1920), in a chunky pixel style: the frame-0 caption, quest/alert banners, the game HUD,
// emotes over heads, dialogue boxes, narration subtitles, flashes, the GAME OVER card.
import { VO, BANNERS, CAPTION, T, DUR, FLASHES, QUESTION, orders, pressure, MODS, modAt } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
export const HUD = {};   // screen anchors, written by the set each frame
let DURS = {};
export const VDUR = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const pop = (t, a, k = 1) => { const u = t - a; return u < 0 ? 0 : 1 + .35 * k * Math.exp(-u * 11) * Math.cos(u * 32) * (u < .02 ? 0 : 1) - (u < .06 ? .25 * k * (1 - u / .06) : 0); };
const PX = "'Pixelify Sans'", SK = 'Silkscreen';
const INK = '#120c16';

export async function overlayReady() {
  await Promise.all([`700 40px ${PX}`, `500 40px ${PX}`, `400 40px ${SK}`, `700 40px ${SK}`, `400 16px ${SK}`, `700 16px ${SK}`].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json(); Object.assign(VDUR, DURS);
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
  'YOU': { bg: '#86d636', fg: INK }, 'THE CUSTOMER': { bg: '#9448c0', fg: '#fff4ff' }, 'THE KID': { bg: '#3a92d8', fg: '#ffffff' }, 'THE REGULAR': { bg: '#e0569a', fg: '#ffffff' }, 'THE MANAGER': { bg: '#767e8c', fg: '#ffffff' },
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
  g.font = `700 150px ${PX}`; const fit = Math.min(1, 960 / g.measureText(CAPTION.text).width);
  g.save(); g.globalAlpha = a; g.translate(W / 2, 380); g.rotate(-.05); g.scale(s * fit, s * fit); g.textAlign = 'center'; g.textBaseline = 'middle';
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

// —— HUD: ORDERS (top left), PRESSURE (top right) ——
const hudA = t => t < T.quest ? 0 : t < T.fired - .15 ? 1 : t >= T.hired + .2 && t < T.k2 ? 1 : 0;
function icon(x, y, s, rows, col) { g.fillStyle = col; rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') g.fillRect(x + i * s, y + j * s, s, s); })); }
const CUPI = ['######.', '.####.#', '.####.#', '.####..', '..##...'], GAUGEI = ['.###.', '#...#', '#.#.#', '#..##', '.###.'];
function hud(t) {
  const a = hudA(t); if (a <= 0) return;
  const s = pop(t, T.quest, .6);
  g.save(); g.textBaseline = 'middle';
  g.translate(200, 120); g.scale(s, s); g.translate(-200, -120);
  const n = orders(t), bump = n !== orders(t - .05) ? 1.25 : 1, goal = t >= T.hired ? 200 : 100;
  pbox(40, 70, 330, 100, { fill: n >= 100 ? '#1a5a2a' : '#17142a', b: 5, n: 5 });
  icon(62, 100, 8, CUPI, '#f4ecd8'); g.font = `700 24px ${SK}`; g.fillStyle = '#f0c84a'; g.textAlign = 'left'; g.fillText('ORDERS', 126, 121);
  g.save(); g.translate(352, 121); g.scale(bump, bump); g.textAlign = 'right'; g.font = `700 ${n >= 100 ? 32 : 40}px ${PX}`; g.fillStyle = '#fbf6ea'; g.fillText(`${n}/${goal}`, 0, 0); g.restore();
  g.restore();
  g.save(); g.textBaseline = 'middle';
  g.translate(W - 200, 120); g.scale(s, s); g.translate(-(W - 200), -120);
  const pr = pressure(t), hot = pr > .85;
  pbox(W - 370, 70, 330, 100, { fill: hot ? (Math.floor(t * 6) % 2 ? '#8a0a14' : '#5a0a12') : '#17142a', b: 5, n: 5 });
  icon(W - 348, 100, 8, GAUGEI, hot ? '#ff5a4a' : '#9ad0ff'); g.font = `700 22px ${SK}`; g.fillStyle = '#f0c84a'; g.textAlign = 'left'; g.fillText('PRESSURE', W - 298, 104);
  const bx = W - 298, bw = 230, sh = hot ? Math.sin(t * 60) * 3 : 0;
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx + sh, 120, bw, 30);
  for (let i = 0; i < 8; i++) if ((i + .5) / 8 < pr) { g.fillStyle = i >= 6 ? '#ff3a2a' : i >= 4 ? '#ffb030' : '#7ae04a'; g.fillRect(bx + sh + i * 29 + 2, 122, 25, 26); }
  g.restore();
}
// the Customer's modifiers: one chip per beat, stacked on the right, they burst at MAX
function mods(t) {
  if (t < T.ticket || t >= T.max + .4) return;
  const boom = seg(t, T.max, T.max + .4);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  pbox(W - 360, 470, 330, 70, { fill: '#f0c84a', b: 5, n: 5, shine: false }); g.font = `700 30px ${SK}`; g.fillStyle = INK; g.fillText(`MODS: ${MODS.filter((_, k) => t >= modAt(k)).length}`, W - 195, 506);
  MODS.forEach((m, k) => { const a0 = modAt(k); if (t < a0) return; const s = pop(t, a0, 1), y = 580 + k * 62, x = W - 195 + (k % 2 ? 14 : -14), dx = boom * (k % 2 ? 600 : -900), dy = boom * (k - 5) * 40;
    g.save(); g.globalAlpha = 1 - boom; g.translate(x + dx, y + dy); g.rotate((k % 2 ? .04 : -.04) + boom * (k - 5) * .2); g.scale(s, s);
    const bad = m === '+NO FOAM' || m === '+EXTRA FOAM';
    g.fillStyle = 'rgba(8,4,12,.5)'; g.fillRect(-150 + 6, -26 + 6, 300, 52); g.fillStyle = bad ? '#d81c2c' : '#fbf6ea'; g.fillRect(-150, -26, 300, 52); g.fillStyle = INK; g.fillRect(-150, -26, 300, 4); g.fillRect(-150, 22, 300, 4);
    g.font = `700 34px ${PX}`; g.fillStyle = bad ? '#fff6e0' : INK; g.fillText(m, 0, 2); g.restore(); });
  g.restore();
}
// the VHS rewind: tracking bars, scanlines, a REWIND plate; then a small "earlier" tag
function rewind(t) {
  if (t >= T.rew && t < T.wide) { const u = t - T.rew;
    g.save(); g.globalAlpha = .22; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 3); g.globalAlpha = .55;
    for (let k = 0; k < 4; k++) { const y = ((k * 520 + u * 4200) % (H + 200)) - 100; g.fillStyle = k % 2 ? '#e8f0ff' : '#203040'; g.fillRect(0, y, W, 18 + k * 6); }
    g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'middle'; outlined('◀◀ REWIND', 70, 200, `700 92px ${SK}`, '#fbf6ea', INK, 12); g.restore(); }
  if (t >= T.wide && t < 3.9) { const a = 1 - ss(seg(t, 3.7, 3.9)); g.save(); g.globalAlpha = a; g.textBaseline = 'middle'; g.textAlign = 'left';
    pbox(40, 520, 520, 84, { fill: '#17142a', b: 5, n: 5 }); g.font = `700 34px ${SK}`; g.fillStyle = '#9ad0ff'; g.fillText('◀◀ 30 MIN EARLIER', 72, 563); g.restore(); }
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
  } else if (kind === 'zzz') {
    g.textAlign = 'center'; g.textBaseline = 'middle'; for (let k = 0; k < 3; k++) { const yy = -k * 34 - ((u * 30) % 34); outlined('z', k * 22, yy, `700 ${40 + k * 10}px ${PX}`, '#fbf6ea', INK, 8); }
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
function flash(t) { for (const f of FLASHES) if (t >= f && t < f + .2) { g.save(); g.globalAlpha = .45 * (1 - (t - f) / .2); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore(); } }

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
  g.font = `700 44px ${SK}`; g.fillStyle = INK; g.fillText('JOB #7', W / 2, 292);
  g.translate(W / 2, 520); g.rotate(-.06);
  outlined('FOAM:', 0, -70, `700 160px ${PX}`, '#fff6e0', INK, 22); outlined('OVERLOAD', 0, 84, `700 168px ${PX}`, '#ff4a3a', INK, 24);
  g.restore();
}
export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  if (COVER) { coverCaption(); return; }
  flash(t);
  rewind(t);
  hud(t);
  bubble(t, HUD.you, -.12, 1.15, '!!', .9);   // frame 0: the hero's "!!" is already popping
  bubble(t, HUD.cat, T.wide + .3, T.rush, 'zzz', .8);
  bubble(t, HUD.reg, 5.9, 7.7, 'q', .9);
  bubble(t, HUD.you, 13.6, T.knob, 'sweat');
  bubble(t, HUD.you, T.max, T.max + 1.0, '!', .9);
  bubble(t, HUD.mach, T.twist, T.twist + 1.1, '!!', 1.1);
  bubble(t, HUD.boss, 24.6, 26.7, 'vein', .9);
  bubble(t, HUD.you, T.k2, DUR + .1, '!!', .9);
  popup(t, [540, 1060], T.cup + .05, 'NAILED IT!', '#9cf06a', 96);
  popup(t, HUD.cust, T.too + .9, 'TOO FOAMY: -1 STAR', '#ff7a6a', 56);
  popup(t, HUD.queue, T.hired + .4, 'SOLD OUT!', '#ffd23a', 96);
  stamp(t, T.rush + .05, T.rush + 2.2, 'RUSH HOUR');
  stamp(t, T.burst + .05, T.burst + 2.2, 'SPLASH!');
  mods(t);
  for (const v of VO) { if (v.dlg) dialog(t, v.who, v.sub, v.box, v.t, DURS[v.id] || 1); else subtitle(t, v); }
  for (const b of BANNERS) banner(t, b);
  caption(t);
  gameOver(t);
}

// Every on-screen text that must be read, with its box (for core/render/readcheck.mjs). Subtitles are checked by the .srt.
export function texts(t) {
  const out = [];
  const box = (id, text, bx, pass) => { if (t >= bx[0] && t < bx[1]) out.push({ id, text, x0: (W - BOX.w) / 2, y0: BOX.y - 40, x1: (W + BOX.w) / 2, y1: BOX.y + BOX.h, pass }); };
  for (const v of VO) if (v.dlg) box(v.id, v.sub, v.box, v.loop || v.pass);   // the loop line is cut by the loop on purpose
  for (const b of BANNERS) if (banA(b, t) > 0) out.push({ id: b.id, text: b.kicker + ' ' + b.text, x0: 70, y0: CARD_Y - 112, x1: 1010, y1: CARD_Y + 90 });
  if (t >= CAPTION.a && t < CAPTION.b) out.push({ id: 'caption', text: CAPTION.text, x0: 80, y0: 290, x1: 1000, y1: 470, pass: true });
  if (t >= GO.a && t < GO.b - .25) out.push({ id: 'fired', text: 'GAME OVER YOU’RE FIRED', x0: 70, y0: 440, x1: 1010, y1: 840 });
  if (t >= T.rush + .05 && t < T.rush + 2.2) out.push({ id: 'rush', text: 'RUSH HOUR', x0: 200, y0: 500, x1: 880, y1: 760 });
  if (t >= T.burst + .05 && t < T.burst + 2.2) out.push({ id: 'splash', text: 'SPLASH!', x0: 200, y0: 500, x1: 880, y1: 760 });
  if (t >= T.wide && t < 3.9) out.push({ id: 'earlier', text: '30 MIN EARLIER', x0: 40, y0: 520, x1: 560, y1: 604 });
  if (t >= T.ticket && t < T.max) out.push({ id: 'mods', text: 'MODS', x0: W - 360, y0: 470, x1: W - 30, y1: 1260, pass: true });   // a growing list read as it lands
  return out;
}
