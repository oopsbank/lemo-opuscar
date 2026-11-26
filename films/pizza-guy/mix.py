# Mix: score (out/music.wav) + rainy-street ambience + event foley (events.json) + voices → out/mix.wav, mastered to −14 LUFS / −1.9 dBTP.
# Usage: $LIB/.venv/bin/python mix.py
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly, lfilter, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import *

EVJ = json.load(open(os.path.join(HERE, 'events.json'))); DUR = EVJ['dur']; EV = EVJ['ev']
N = int(DUR * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(31)
def curve(keys): k = np.array(keys, float); return np.interp(tt, k[:, 0], k[:, 1])
def stereo(x, pan=0.0): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
def ev(kind): return [e for e in EV if e['type'] == kind]
T = lambda kind: next(e['t'] for e in EV if e['type'] == kind)

# —— ambience: rain (heavy → stopping at the porch), gutters, distant traffic hum; neon buzz near the shop ——
DRY = 51.0
rainG = curve([(0, 1), (DRY - 1, 1), (DRY + 2.5, .05), (DUR, 0)])
hiss = hp(lp(noise(DUR), 9000), 1200) * .5 + bp(noise(DUR), 300, 1500) * .35
patter = np.zeros(N); idx = rng.integers(0, N, 9000); patter[idx] = rng.uniform(.1, 1, len(idx)) ** 2; patter = bp(patter, 1500, 7000) * 2.5
rainB = (hiss + patter) * rainG
drips = np.zeros(N)
for t0 in np.sort(rng.uniform(DRY - 2, DUR, 40)):
    d = .08; x = t_(d); s = int(t0 * SR); y = np.sin(2 * np.pi * rng.uniform(900, 1800) * x) * np.exp(-x / .015) * rng.uniform(.15, .4); drips[s:s + len(y)] += y[:max(0, min(len(y), N - s))]
neon = (np.sin(2 * np.pi * 120 * tt) * .5 + np.sin(2 * np.pi * 240 * tt) * .2) * curve([(0, 0), (.5, 0), (.52, 1), (7.3, 1), (7.5, 0), (DUR, 0)]) * .05
canal = lp(brown(DUR), 500) * curve([(0, 0), (15, 0), (15.3, .7), (24, .6), (24.3, 0), (DUR, 0)]) * .5
amb = stereo(rainB * .5, -.3) + stereo(np.roll(rainB, 9973) * .5, .3) + stereo(drips, .2) + stereo(neon, -.2) + stereo(canal, 0)
amb *= curve([(0, .7), (.5, 1), (DUR - 1, 1), (DUR, 0)])[:, None]

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def buzzclick(v=1.0): x = t_(.12); return norm(bp(noise(.12), 800, 5000) * np.exp(-x / .02) + np.sign(np.sin(2 * np.pi * 120 * x)) * np.exp(-x / .04) * .3) * v
def engine(d, v=1.0):
    x = t_(d); f = 32 + 10 * np.clip(x / 1.2, 0, 1); ph = 2 * np.pi * np.cumsum(f) / SR
    putt = (np.sin(ph) > .6).astype(float); y = lp(putt, 900) + bp(noise(d), 200, 900) * .3 * putt
    return norm(y * np.clip(x / .3, 0, 1) * np.clip((d - x) / .4, 0, 1)) * v
def bark(v=1.0, f0=520):
    d = .22; x = t_(d); f = f0 * (1 + .5 * np.exp(-x / .03)) * (1 - .3 * x / d); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + .7 * np.sin(2 * ph) + .4 * np.sin(3 * ph) + bp(noise(d), 600, 3500) * .5
    return norm(bp(y, 250, 4000) * np.clip(x / .01, 0, 1) * np.exp(-x / .07)) * v
def paw(v=1.0): d = .06; x = t_(d); return norm(bp(noise(d), 1200, 6000) * np.exp(-x / .01)) * v
def step(v=1.0): d = .14; x = t_(d); return norm(bp(noise(d), 300, 2200) * np.exp(-x / .02) + np.sin(2 * np.pi * 120 * x) * np.exp(-x / .025) * .5) * v
def knock(v=1.0): d = .18; x = t_(d); return norm(np.sin(2 * np.pi * 180 * x) * np.exp(-x / .03) + bp(noise(d), 300, 2500) * np.exp(-x / .012) * .8) * v
def splat(v=1.0): d = .4; x = t_(d); return norm(lp(noise(d), 1800) * np.exp(-x / .05) + np.sin(2 * np.pi * (220 - 300 * x) * x) * np.exp(-x / .06) * .8) * v
def creakdoor(v=1.0, d=1.0):
    x = t_(d); f = 160 + 90 * np.sin(2 * np.pi * 1.3 * x) + 30 * np.sin(2 * np.pi * 7 * x); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sign(np.sin(ph)) * (np.sin(2 * np.pi * 23 * x) > -.2); return norm(bp(y, 300, 3000) * np.clip(x / .05, 0, 1) * np.clip((d - x) / .2, 0, 1)) * v
def thunder(v=1.0, d=3.2):
    x = t_(d); crack = hp(noise(d), 1500) * np.exp(-x / .08) * .6; body = lp(brown(d), 180) * np.exp(-x / 1.1) * np.clip(x / .12, 0, 1); rum = lp(noise(d), 90) * np.exp(-x / 1.6) * 2
    return norm(crack + body + rum) * v
def ghostwhoosh(v=1.0, d=1.6):
    x = t_(d); y = bp(noise(d), 400, 2400) * np.sin(np.pi * x / d) ** 2 + np.sin(2 * np.pi * (330 + 40 * np.sin(2 * np.pi * 3 * x)) * x) * np.sin(np.pi * x / d) * .3
    return norm(y) * v
def slam(v=1.0): d = 1.2; x = t_(d); return norm(lp(noise(d), 600) * np.exp(-x / .08) + np.sin(2 * np.pi * 70 * x) * np.exp(-x / .12) * 1.2 + bp(noise(d), 2000, 6000) * np.exp(-x / .015) * .5) * v
def lampclick(v=1.0):
    d = 1.0; x = t_(d); c = np.zeros(len(x)); k = click(1.3, 1.0); c[:len(k)] += k
    return norm(c + np.sin(2 * np.pi * 100 * x) * .08 * np.clip(x / .1, 0, 1) * np.exp(-x / .7)) * v
def chew(v=1.0, d=1.4):
    x = t_(d); env = np.clip(np.sin(2 * np.pi * 3.2 * x), 0, 1) ** 2; return norm(bp(noise(d), 500, 3000) * env * np.exp(-x / 1.2)) * v
def whine(v=1.0): d = .7; x = t_(d); f = 900 + 300 * np.sin(np.pi * x / d); ph = 2 * np.pi * np.cumsum(f) / SR; return norm(np.sin(ph) * np.sin(np.pi * x / d) ** 2) * v
def boxopen(v=1.0): d = .3; x = t_(d); return norm(bp(noise(d), 400, 3000) * np.exp(-x / .07)) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'neon': [add(fx, buzzclick(.3), t + o, 1, -.2) for o in (0, .14, .2)]
    elif k == 'card' or k == 'banner': add(fx, chime(.12, 1319), t, 1, 0); add(fx, chime(.07, 1976), t + .08, 1, .2)
    elif k == 'dlg': add(fx, chime(.1, 1568), t, 1, 0)
    elif k == 'start': add(fx, engine(.7, .35), t, 1, 0)
    elif k == 'engine': add(fx, engine(e['d'], .3), t, 1, .1)
    elif k == 'kennel': add(fx, thump(.2, 140), t, 1, -.3)
    elif k == 'bark': add(fx, bark(.5), t, 1, -.3)
    elif k == 'paw': add(fx, paw(.1), t, 1, -.3)
    elif k == 'gust': add(fx, whoosh(1.0, .7), t - .3, 1, .3)
    elif k == 'lid': add(fx, boxopen(.25), t, 1, .1)
    elif k == 'brake': add(fx, bp(noise(.5), 1500, 5000) * np.exp(-t_(.5) / .2) * .15, t, 1, 0)
    elif k == 'splat': add(fx, splat(.6), t, 1, 0)
    elif k == 'step': add(fx, step(.18), t, 1, 0)
    elif k == 'knock': add(fx, knock(.45), t, 1, .1)
    elif k == 'flash': pass
    elif k == 'thunder': add(fx, thunder(.8), t, 1, 0)
    elif k == 'creak': add(fx, creakdoor(.22, 1.0), t, 1, .2)
    elif k == 'ghost': add(fx, ghostwhoosh(.3), t, 1, .2)
    elif k == 'lamp': add(fx, lampclick(.45), t, 1, .3)
    elif k == 'late': pass
    elif k == 'slam': add(fx, slam(.85), t, 1, .1)
    elif k == 'box': add(fx, boxopen(.3), t, 1, 0)
    elif k == 'chew': add(fx, chew(.2), t, 1, .2)
    elif k == 'whine': add(fx, whine(.18), t, 1, .25)
    elif k == 'thump': add(fx, thump(.22, 90), t, 1, .25)

# —— voices ——
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
vox = np.zeros((N, 2)); spans = []
for e in ev('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = compress(x / (np.abs(x).max() + 1e-9) * .7, thr=.2, ratio=3)
    if e['dlg']: x = lp(x, 7000, 4); x = hp(x, 140)              # on-screen characters sit "in the world"
    if e.get('who') == 'No. 31': x = resample_poly(x, 25, 23)      # the bear: a touch lower and slower
    if e.get('who') == 'No. 13':                                   # the ghost: airy, with a long tail
        L = int(1.6 * SR); ir = rng.standard_normal(L) * np.exp(-np.arange(L) / SR / .5); ir[:int(.02 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        x = np.concatenate([x, np.zeros(L)]); x = x * .7 + fftconvolve(x, ir)[:len(x)] * .5
    x *= 10 ** ((-19 - rms_db(x[np.abs(x) > .01])) / 20)          # RMS-match each line
    add(vox, x, e['t'], 1, .15 if e.get('who') == 'No. 13' else (-.1 if e.get('who') == 'YOU' else 0))
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
