// Resumable chunked render: node some-crazy-thingzz/tools/render_chunks.mjs <film> --out <mp4> [--fps 24] [--workers 3] [--chunk 24] [--size 1080x1920] [--q ssaa=1.5]
// Each chunk of frames becomes its own small mp4 in <out>_chunks/; finished chunks are skipped on re-run.
// The browser is reopened for every chunk, and a timed-out frame is retried with a fresh browser.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo, closeServer, takeSize } from '../../core/render/page.mjs';
const args = process.argv.slice(2), { w: W, h: H } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], FPS = +opt('--fps', 24), WK = +opt('--workers', 3), CH = +opt('--chunk', 24), Q = opt('--q', '');
const out = path.resolve(opt('--out')), cdir = out.replace(/\.mp4$/, '') + '_chunks'; fs.mkdirSync(cdir, { recursive: true });
const probe = await openDemo(dir, { w: W, h: H, q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const TOTAL = Math.round(DUR * FPS), NC = Math.ceil(TOTAL / CH), t0 = Date.now();
const todo = [...Array(NC).keys()].filter(c => !fs.existsSync(path.join(cdir, `c${String(c).padStart(4, '0')}.mp4`)));
console.log(`${TOTAL} frames, ${NC} chunks, ${todo.length} to do`);
async function chunk(c) {
  const a = c * CH, b = Math.min(TOTAL, a + CH), name = `c${String(c).padStart(4, '0')}.mp4`, tmp = path.join(cdir, 'tmp_' + name);
  for (let attempt = 0; attempt < 4; attempt++) {
    let br;
    try {
      const { browser, page } = await openDemo(dir, { w: W, h: H, q: Q }); br = browser;
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise(r => ff.on('close', r));
      for (let f = a; f < b; f++) {
        await page.evaluate(t => window.render(t), f / FPS);
        const buf = await page.screenshot({ type: 'jpeg', quality: 95, timeout: 180000 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); const code = await closed; await browser.close();
      if (code !== 0) throw new Error('ffmpeg exit ' + code);
      fs.renameSync(tmp, path.join(cdir, name));
      console.log(`chunk ${c} (${a}-${b - 1}) ok  ${((Date.now() - t0) / 1000).toFixed(0)}s`); return;
    } catch (e) { console.log(`chunk ${c} attempt ${attempt} failed: ${String(e.message || e).split('\n')[0]}`); try { await br?.close(); } catch {} }
  }
  throw new Error(`chunk ${c} failed 4 times`);
}
let next = 0;
await Promise.all([...Array(WK)].map(async () => { while (next < todo.length) await chunk(todo[next++]); }));
const list = path.join(cdir, 'list.txt');
fs.writeFileSync(list, [...Array(NC).keys()].map(c => `file 'c${String(c).padStart(4, '0')}.mp4'`).join('\n') + '\n');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
console.log(`done ${out} ${TOTAL} frames ${((Date.now() - t0) / 1000).toFixed(0)}s`); closeServer(); process.exit(0);
