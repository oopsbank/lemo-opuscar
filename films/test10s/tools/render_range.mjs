// Render a time range of the film: node films/fish-seller/tools/render_range.mjs <a> <b> [--fps 60] [--workers 3] [--q 'ss=1'] [--out out/part.mp4]
// Same capture as core/render/video.mjs (JPEG q95 → x264 crf 14), frames [round(a*fps), round(b*fps)), viewport 1080×1920.
// Adapted from the 2.5D Pixel Art demo's tools/render_range.mjs. Run from the library root.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
const LIB = process.env.LIB || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { openDemo } = await import(path.join(LIB, 'core/render/page.mjs'));
const DEMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [VW, VH] = opt('--size', '1080x1920').split('x').map(Number);
const A = +args[0], B = +args[1], FPS = +opt('--fps', 60), WK = +opt('--workers', 3), Q = opt('--q', 'ss=1');
const out = path.resolve(opt('--out', path.join(DEMO, 'out', `part_${A}_${B}.mp4`)));
const tmp = path.join(DEMO, 'out', `tmp_${A}_${B}`); fs.mkdirSync(tmp, { recursive: true });
const F0 = Math.round(A * FPS), F1 = Math.round(B * FPS), TOTAL = F1 - F0, per = Math.ceil(TOTAL / WK), t0 = Date.now();
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = F0 + w * per, b = Math.min(F1, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(DEMO, { q: Q, w: VW, h: VH });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path.join(tmp, `seg_${w}.mp4`)]);
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 60 === 0) console.log(`w${w} ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
}));
const list = path.join(tmp, 'segs.txt');
fs.writeFileSync(list, [...Array(WK)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < TOTAL).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
fs.rmSync(tmp, { recursive: true, force: true });
const sec = (Date.now() - t0) / 1000;
console.log('done', out, TOTAL, 'frames', sec.toFixed(1) + 's', (TOTAL / sec).toFixed(2) + ' fps');
process.exit(0);
