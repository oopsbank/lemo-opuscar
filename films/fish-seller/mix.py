# Mix: score (out/music.wav) + harbour ambience + event foley (events.json) + voices → out/mix.wav, mastered to −14 LUFS / −1.2 dBTP.
# Usage: $LIB/.venv/bin/python mix.py
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly, sosfilt, butter, lfilter
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import *

EVJ = json.load(open(os.path.join(HERE, 'events.json'))); DUR = EVJ['dur']; EV = EVJ['ev']
N = int(DUR * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(23)
def curve(keys): k = np.array(keys, float); return np.interp(tt, k[:, 0], k[:, 1])
def stereo(x, pan=0.0): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
def ev(kind): return [e for e in EV if e['type'] == kind]

# —— ambience: harbour before dawn → sunrise ——
SUN = next(e['t'] for e in EV if e['type'] == 'sun')
swell = .45 + .55 * np.sin(2 * np.pi * .12 * tt + 1) ** 4
waves = lp(brown(DUR), 650) * swell + hp(lp(noise(DUR), 3200), 700) * .1 * (.3 + .7 * np.sin(2 * np.pi * .12 * tt + .7) ** 6)
lap = np.zeros(N)   # water slapping on the piles
for t0 in np.arange(.6, DUR, 1.7) + rng.uniform(-.3, .3, len(np.arange(.6, DUR, 1.7))):
    d = .25; x = t_(d); s = int(t0 * SR); y = bp(noise(d), 300, 1400) * np.exp(-x / .06) * rng.uniform(.3, .7)
    lap[s:s + len(y)] += y[:max(0, min(len(y), N - s))]
amb = stereo(waves * .5, -.25) + stereo(np.roll(waves, 7919) * .5, .25) + stereo(lap * .6, .3)
def bellbuoy(v=1.0):
    d = 3.5; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * 523 * m * x + m) * np.exp(-x / tau) for m, a, tau in [(1, 1, 1.4), (2.74, .4, .6), (5.2, .15, .3)])) * v
for t0 in [2.2, 21.5, 33.0]: add(amb, lp(bellbuoy(.18), 2500), t0, 1, -.6)
def gullcall(v=1.0, f0=1300, d=.42, seed=0):
    r = np.random.default_rng(seed); x = t_(d); f = f0 * (1.0 - .35 * x / d) * (1 + .06 * np.sin(2 * np.pi * 7 * x))
    ph = 2 * np.pi * np.cumsum(f) / SR; y = np.sin(ph) + .6 * np.sin(2 * ph) + .35 * np.sin(3 * ph) + .2 * np.sin(5 * ph)
    y *= 1 + .5 * np.sin(2 * np.pi * 55 * x)                       # harsh roughness
    y = bp(y, 500, 6000) + bp(noise(d), 1500, 5000) * .25
    env = np.clip(x / .03, 0, 1) * np.clip((d - x) / .12, 0, 1); return norm(y * env) * v
for i, t0 in enumerate([5.1, 17.8, 31.2, 47.0]): add(amb, lp(gullcall(.08, 1500, .3, i), 3000), t0, 1, .7 * (-1) ** i)
for i, t0 in enumerate(np.arange(50.0, DUR, 1.3)): add(amb, lp(gullcall(.12, 1400 + 200 * (i % 3), .35, 10 + i), 4000), t0 + rng.uniform(0, .5), 1, rng.uniform(-.8, .8))
for t0 in [7.0, 24.0, 38.4, 57.0]: add(amb, creak(.35), t0, 1, .4)
wind = bp(noise(DUR), 250, 1600) * (.5 + .5 * np.sin(2 * np.pi * .08 * tt) ** 2) * curve([(0, .15), (SUN, .15), (SUN + 3, .45), (DUR, .4)])
amb += stereo(wind * .35, -.5) + stereo(np.roll(wind, 9001) * .35, .5)
amb *= curve([(0, .8), (.6, 1), (DUR - 1, 1), (DUR, 0)])[:, None]

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def tick(v=1.0): x = t_(.03); return hp(noise(.03), 3000) * np.exp(-x / .004) * v
def lampclick(v=1.0):
    d = 1.2; x = t_(d); c = np.zeros(len(x)); k = click(1.3, 1.0); c[:len(k)] += k
    hum = np.sin(2 * np.pi * 100 * x) * .08 * np.clip(x / .1, 0, 1) * np.exp(-x / .8)
    return norm(c + hum + bp(noise(d), 2000, 7000) * .05 * np.exp(-x / .3)) * v
def flaps(d=1.0, v=1.0, rate=9):
    x = t_(d); env = np.clip(np.sin(2 * np.pi * rate * x), 0, 1) ** 3; return norm(bp(noise(d), 250, 2500) * env * np.clip(x / .1, 0, 1) * np.clip((d - x) / .2, 0, 1)) * v
def slap(v=1.0, f=1.0):   # wet fish on wood / ice
    d = .16; x = t_(d); return norm(bp(noise(d), 500 * f, 4000 * f) * np.exp(-x / .025) + np.sin(2 * np.pi * 160 * f * x) * np.exp(-x / .03) * .5) * v
def step(v=1.0, kind='shuffle'):
    d = .14; x = t_(d)
    if kind == 'boot': return norm(bp(noise(d), 300, 2200) * np.exp(-x / .02) + np.sin(2 * np.pi * 140 * x) * np.exp(-x / .025) * .7) * v
    return norm(bp(noise(d), 1200, 6000) * np.exp(-x / .05) * .8 + bp(noise(d), 300, 1200) * np.exp(-x / .015) * .4) * v
def coin(v=1.0, f=3100):
    d = .5; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .12), (1.47, .6, .09), (2.3, .3, .05)]) + hp(noise(d), 5000) * np.exp(-x / .004) * .5) * v
def splash(v=1.0):
    d = 1.6; x = t_(d); body = lp(noise(d), 2200) * np.exp(-x / .22) * np.clip(x / .01, 0, 1); plop = np.sin(2 * np.pi * (180 - 90 * x) * x) * np.exp(-x / .08)
    drops = np.zeros(len(x))
    for k in range(40):
        s = int(rng.uniform(.08, 1.1) * SR); y = np.sin(2 * np.pi * rng.uniform(900, 2600) * t_(.04)) * np.exp(-t_(.04) / .01) * rng.uniform(.05, .2); drops[s:s + len(y)] += y[:max(0, len(x) - s)]
    return norm(body + plop * .8 + drops) * v
def skid(v=1.0): d = .5; x = t_(d); return norm(bp(noise(d), 600, 3500) * np.clip(x / .03, 0, 1) * np.exp(-x / .2)) * v
def shimmer(v=1.0):
    d = 4.0; x = t_(d); return norm(sum(np.sin(2 * np.pi * f * x + f) * np.clip(x / 1.5, 0, 1) * np.exp(-x / 2.2) for f in [1175, 1480, 1760, 2349]) + lp(noise(d), 600) * np.clip(x / 2, 0, 1) * np.exp(-x / 1.5) * .3) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'lamp': add(fx, lampclick(.5), t, 1, -.3)
    elif k == 'card': add(fx, chime(.13, 1319), t, 1, 0); add(fx, chime(.08, 1976), t + .08, 1, .2)
    elif k == 'dlg': add(fx, chime(.11, 1568), t, 1, 0)
    elif k == 'squawk': add(fx, gullcall(.6, 1250, .45, 3), t, 1, .15); add(fx, gullcall(.45, 1100, .3, 4), t + .42, 1, .15)
    elif k == 'wings': add(fx, flaps(e.get('d', 1), .35), t, 1, .3)
    elif k == 'land': add(fx, thump(.25, 120), t, 1, .2); add(fx, slap(.12, 1.4), t + .02, 1, .2)
    elif k == 'grab': add(fx, whoosh(.3, .4), t - .05, 1, .1); add(fx, slap(.3, 1.2), t, 1, .1)
    elif k == 'lift': add(fx, slap(.2, 1.1), t, 1, -.2)
    elif k == 'gstep': add(fx, step(.12, 'shuffle'), t, 1, float(np.clip((t - 20) / 6, -.5, .5)))
    elif k == 'heart': add(fx, heartbeat(.3), t, 1, 0)
    elif k == 'coins': [add(fx, coin(.18, f), t + i * .07, 1, .1) for i, f in enumerate([3100, 3600, 2800])]
    elif k == 'blink': add(fx, tick(.35), t, 1, .2); add(fx, slap(.08, 2), t + .05, 1, .2)
    elif k == 'flop': add(fx, slap(.32, 1 + .05 * e.get('i', 0)), t + .4, 1, float(np.clip((t - 38) / 3, -.6, .6)))
    elif k == 'leap': add(fx, whoosh(.45, .35), t, 1, .4)
    elif k == 'boot': add(fx, step(.22, 'boot'), t, 1, float(np.clip((t - 38) / 3, -.6, .6)))
    elif k == 'skid': add(fx, skid(.3), t, 1, .4)
    elif k == 'splash': add(fx, splash(.6), t, 1, .5)
    elif k == 'turn': add(fx, bp(noise(.3), 800, 4000) * np.exp(-t_(.3) / .08) * .12, t, 1, 0)
    elif k == 'sun': add(fx, shimmer(.2), t, 1, .3)

# —— voices ——
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
vox = np.zeros((N, 2)); spans = []
for e in ev('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = compress(x / (np.abs(x).max() + 1e-9) * .7, thr=.2, ratio=3)
    if e['dlg']: x = lp(x, 7000, 4); x = hp(x, 140)              # on-screen characters sit "in the world"
    x *= 10 ** ((-19 - rms_db(x[np.abs(x) > .01])) / 20)          # RMS-match each line
    add(vox, x, e['t'], 1, .12 if e.get('who') == 'GRANDMA' else (-.1 if e.get('who') == 'YOU' else 0))
    spans.append((e['t'], e['t'] + len(x) / SR, e['id']))

# —— music, ducked ~10 dB under each line (down only) ——
mus, msr = sf.read(os.path.join(HERE, 'out/music.wav'), dtype='float64')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
def level(x, db): return x * 10 ** ((db - rms_db(x[np.abs(x).max(1) > 1e-4] if x.ndim > 1 else x)) / 20)
mus = level(mus, -23); amb = level(amb, -31); fx = level(fx, -27)
duck = np.ones(N)
for a, b, _ in spans:
    duck = np.minimum(duck, np.interp(tt, [a - .25, a - .05, b + .05, b + .4], [1, .22, .22, 1], left=1, right=1))
mus *= duck[:, None]; amb *= (.4 + .6 * duck)[:, None]
for a, b, i in spans:
    s, e2 = int(a * SR), int(b * SR); v = rms_db(vox[s:e2]); m = rms_db(mus[s:e2] + amb[s:e2])
    print(f'{i:4s} {a:6.2f}s  voice {v:6.1f} dB  bed {m:6.1f} dB  gap {v - m:5.1f} dB')

mix = vox + mus + amb + fx
mix = np.tanh(mix * 1.4) / 1.4

# —— master: −14 LUFS integrated (BS.1770 K-weighting, gated), true peak ≤ −1.2 dBTP (4× oversampled limiter) ——
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585]
    b2, a2 = [1, -2, 1], [1, -1.99004745483398, .99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    y = kweight(resample_poly(x, 48000, SR, axis=0) if SR != 48000 else x); blk, hop = int(.4 * 48000), int(.1 * 48000)
    z = np.array([np.mean(y[i:i + blk] ** 2, 0).sum() for i in range(0, len(y) - blk, hop)]); l = -.691 + 10 * np.log10(z + 1e-12)
    g = z[l > -70]; rel = -.691 + 10 * np.log10(g.mean()) - 10; g2 = z[(l > -70) & (l > rel)]
    return -.691 + 10 * np.log10(g2.mean())
L0 = lufs(mix); mix *= 10 ** ((-14 - L0) / 20)
ceil = 10 ** (-1.9 / 20)
for _ in range(3):
    up = resample_poly(mix, 4, 1, axis=0); pk = np.abs(up).max(1)
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    n = int(.004 * SR * 4); g = np.minimum(1, ceil / np.maximum(maximum_filter1d(pk, 2 * n + 1), 1e-9)); g = uniform_filter1d(np.minimum.accumulate(g[::-1])[::-1] if False else g, n)
    mix = mix * g[::4][:len(mix), None]
    if np.abs(resample_poly(mix, 4, 1, axis=0)).max() <= ceil * 1.01: break
L1 = lufs(mix); mix *= 10 ** ((-14 - L1) / 20)
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1, axis=0)).max())
print(f'loudness {lufs(mix):.2f} LUFS, true peak {tp:.2f} dBTP')
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('out/mix.wav', len(mix) / SR, 's')
