# The short cut of "Quán Mì Đêm" (about 37 s) for TikTok / Shorts: opens on the giant, trims the slow middle, keeps the best cooking beats,
# ends on a push back into the pot so the loop is seamless. Cut from the full render (with the ?alt shots), sound rebuilt on the new timeline.
# Run with LIB=<library root> SRC=<full-length 75 s picture with alt shots> OUT=<folder>; writes OUT/events.json, OUT/score.wav, OUT/cut_video.mp4
import os, sys, json, subprocess
import numpy as np, soundfile as sf
LIB = os.environ['LIB']; SRC = os.environ['SRC']; OUT = os.environ['OUT']; os.makedirs(OUT, exist_ok=True)
D = os.path.dirname(os.path.abspath(__file__))
SEG = [(0.6, 1.6), (10.0, 15.2), (24.0, 26.4), (27.4, 29.6), (31.0, 32.4), (34.6, 36.6), (36.7, 37.9), (40.3, 42.0), (42.6, 43.6), (45.0, 46.4),
       (50.2, 51.5), (53.6, 55.2), (56.6, 61.0), (63.4, 65.6), (66.4, 68.2), (69.6, 71.8), (71.8, 75.0)]
starts = np.cumsum([0] + [b - a for a, b in SEG])[:-1]; DUR = float(sum(b - a for a, b in SEG))
def remap(t):
    for (a, b), o in zip(SEG, starts):
        if a <= t < b: return o + t - a
    return None

# —— events ——
src = json.load(open(os.path.join(OUT, 'events_full.json')))['ev']
ev = [{'t': 0, 'type': 'wind', 'dur': DUR}]
for e in src:
    if e['type'] == 'wind': continue
    d = e.get('dur')
    if d:   # long events are clipped to every segment they overlap
        for (a, b), o in zip(SEG, starts):
            lo, hi = max(a, e['t']), min(b, e['t'] + d)
            if hi - lo > .15: ev.append({**e, 't': o + lo - a, 'dur': hi - lo})
    else:
        n = remap(e['t'])
        if n is not None: ev.append({**e, 't': n})
json.dump({'dur': DUR, 'ev': ev}, open(os.path.join(OUT, 'events.json'), 'w'))

# —— music: the score runs on unbroken from the stone, then the lantern chord lands with the blaze ——
score, SR = sf.read(os.path.join(OUT, 'score_full.wav'), dtype='float32')
N = int((DUR + .3) * SR); mus = np.zeros((N, 2), np.float32)
t_stone = starts[2]; t_lamp = starts[-1]
a0 = int(22.0 * SR); n1 = int((t_lamp - t_stone + .4) * SR); o1 = int(t_stone * SR)
mus[o1:o1 + n1] += score[a0:a0 + n1]
fo = int(.4 * SR); mus[o1 + n1 - fo:o1 + n1] *= np.linspace(1, 0, fo)[:, None]
b0 = int(71.8 * SR); o2 = int(t_lamp * SR); n2 = min(N - o2, len(score) - b0)
seg2 = score[b0:b0 + n2].copy(); seg2[:fo] *= np.linspace(0, 1, fo)[:, None]; mus[o2:o2 + n2] += seg2
mus[:o1 + int(.05 * SR)] *= 0; ramp = int(.4 * SR); mus[o1:o1 + ramp] *= np.linspace(0, 1, ramp)[:, None]
tt = np.arange(N) / SR; mus *= np.clip((DUR - tt) / 1.6, 0, 1)[:, None]
sf.write(os.path.join(OUT, 'score.wav'), mus, SR)

# —— picture: trim + concat, the opening line drawn on top (kept out of the bottom quarter) ——
font = os.path.join(D, 'fonts', 'baloo2.ttf')
parts = ''.join(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];' for i, (a, b) in enumerate(SEG))
cat = ''.join(f'[v{i}]' for i in range(len(SEG))) + f'concat=n={len(SEG)}:v=1:a=0[c];'
def txt(s, y, t0, t1):
    return (f"drawtext=fontfile={font}:text='{s}':fontsize=74:fontcolor=#fff3dc:borderw=5:bordercolor=#2a1440:x=(w-tw)/2:y={y}:"
            f"alpha='clip(min((t-{t0})/0.3\\,({t1}-t)/0.3)\\,0\\,1)':enable='between(t,{t0},{t1})'")
draw = f"[c]{txt('Open until dawn...', 220, 0.15, 3.6)},{txt('and tonight, a strange guest.', 315, 1.1, 3.6)}[o]"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-filter_complex', parts + cat + draw, '-map', '[o]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow',
                '-pix_fmt', 'yuv420p', '-r', '24', os.path.join(OUT, 'cut_video.mp4')], check=True)
print(f'cut {DUR:.1f}s, {len(SEG)} segments, {len(ev)} events → {OUT}')
