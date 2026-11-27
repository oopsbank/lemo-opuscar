# Mix: score (out/music.wav) + store ambience + event foley (events.json) + voices → out/mix.wav, mastered to −14 LUFS / −1.9 dBTP.
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

# —— ambience: mall hubbub (many voices), a fountain far off, the hum of the escalator; quieter under GAME OVER ——
tone = lp(brown(DUR), 300) * .5 + hp(lp(noise(DUR), 3000), 300) * .03
toneG = curve([(0, 1), (33.0, 1), (33.1, .25), (36.0, .25), (36.1, 1), (DUR, 1)])
crowd = np.zeros(N)
for k in range(12):
    f0 = rng.uniform(250, 750); crowd += bp(noise(DUR), f0, f0 * 2.2) * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(3, 6) * tt + rng.uniform(0, 6))) ** 2
crowd *= curve([(0, .55), (9.0, .55), (10.5, .8), (22.5, .8), (23.0, 1.0), (28.5, 1.0), (29.0, .4), (33.0, .4), (33.1, 0), (36.0, 0), (36.1, .6), (DUR, .6)])
water = hp(lp(noise(DUR), 3500), 800) * .25 * (.8 + .2 * np.sin(2 * np.pi * .4 * tt))
amb = stereo(tone * toneG, -.1) + stereo(np.roll(tone, 7919) * toneG, .1) + stereo(crowd * .5, .3) + stereo(np.roll(crowd, 5003) * .45, -.25) + stereo(water * toneG, -.5)

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def footstep(v=1.0): d = .14; x = t_(d); return norm(lp(noise(d), 900) * np.exp(-x / .025) + np.sin(2 * np.pi * 110 * x) * np.exp(-x / .03) * .4) * v
def blip(v=1.0, f0=880, d=.12): x = t_(d); return norm(np.sign(np.sin(2 * np.pi * f0 * x)) * np.clip((d - x) / .03, 0, 1)) * v
def boing(v=1.0, d=.45): x = t_(d); f = 180 + 520 * x / d + 60 * np.sin(2 * np.pi * 18 * x); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .3)) * v
def thwack(v=1.0): d = .3; x = t_(d); return norm(bp(noise(d), 300, 4000) * np.exp(-x / .02) + np.sin(2 * np.pi * 140 * x) * np.exp(-x / .05)) * v
def wail(v=1.0, d=1.2, f0=520):   # a kid's "waaah": a sawtooth with vibrato through vowel formants, falling at the end
    x = t_(d); f = f0 * (1 + .04 * np.sin(2 * np.pi * 7 * x)) * (1 - .25 * np.clip((x - d * .6) / (d * .4), 0, 1)); ph = (np.cumsum(f) / SR) % 1; saw = 2 * ph - 1
    y = bp(saw, 700, 1300) + bp(saw, 1600, 2600) * .7 + bp(saw, 3000, 3600) * .25
    return norm(y * np.clip(x / .08, 0, 1) * np.clip((d - x) / .2, 0, 1)) * v
def shutter(v=1.0): y = np.zeros(int(.2 * SR)); a = click(1.6, 1.0); b = click(1.2, .7); y[:len(a)] += a[:len(y)]; s2 = int(.06 * SR); y[s2:s2 + len(b)] += b[:len(y) - s2]; return norm(y) * v
def whirr(v=1.0, d=.6): x = t_(d); return norm(bp(np.sign(np.sin(2 * np.pi * 90 * x)), 300, 3000) * np.sin(np.pi * x / d)) * v
def rustle(v=1.0, d=.6): x = t_(d); return norm(bp(noise(d), 1500, 7000) * (.5 + .5 * np.sin(2 * np.pi * 14 * x)) ** 2 * np.sin(np.pi * x / d)) * v
def popfx(v=1.0, f0=400): d = .16; x = t_(d); f = f0 + 1600 * x / d; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .05)) * v
def cheer(v=1.0, d=1.6):
    y = np.zeros(int(d * SR))
    for k in range(10): f0 = rng.uniform(600, 1100); z = wail(1, rng.uniform(.5, .9), f0) * rng.uniform(.4, 1); s2 = int(rng.uniform(0, .5) * SR); y[s2:s2 + len(z)] += z[:len(y) - s2]
    return norm(y) * v
def heel(v=1.0): d = .08; x = t_(d); return norm(bp(noise(d), 2000, 8000) * np.exp(-x / .008) + np.sin(2 * np.pi * 900 * x) * np.exp(-x / .01) * .5) * v
def creak(v=1.0, d=.5): x = t_(d); f = 150 + 70 * np.sin(2 * np.pi * 2.5 * x); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * np.sin(np.pi * x / d)) * v
def zap(v=1.0, d=.5): x = t_(d); y = hp(noise(d), 2000) * (np.sin(2 * np.pi * 60 * x) > .3) + np.sign(np.sin(2 * np.pi * 120 * x)) * .3; return norm(y * np.exp(-x / .2)) * v
def servo(v=1.0, d=.8): x = t_(d); f = 200 + 900 * (x / d) ** 2; return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 * np.clip(x / .05, 0, 1)) * v
def whinny(v=1.0, d=.9):   # a mechanical whinny: a buzzy sweep with a fast trill
    x = t_(d); f = 700 + 500 * np.sin(np.pi * x / d) + 80 * np.sin(2 * np.pi * 22 * x); ph = (np.cumsum(f) / SR) % 1
    return norm(bp(2 * ph - 1, 600, 3200) * np.clip(x / .05, 0, 1) * np.clip((d - x) / .2, 0, 1)) * v
def clop(v=1.0): d = .12; x = t_(d); return norm(bp(noise(d), 600, 3500) * np.exp(-x / .01) + np.sin(2 * np.pi * 420 * x) * np.exp(-x / .02) * .6) * v
def jingle(v=1.0, d=.6):
    y = np.zeros(int(d * SR))
    for k in range(8):
        x = t_(.25); z = sum(np.sin(2 * np.pi * f * x) for f in (5200 + k * 90, 7100 - k * 70)) * np.exp(-x / .05); s2 = int(k * .07 * SR)
        if s2 < len(y): n2 = min(len(z), len(y) - s2); y[s2:s2 + n2] += z[:n2]
    return norm(y) * v
def crash(v=1.0):
    d = 1.8; x = t_(d); return norm(lp(noise(d), 3000) * np.exp(-x / .5) * 1.2 + np.sin(2 * np.pi * 50 * x) * np.exp(-x / .25) + bp(noise(d), 4000, 10000) * np.exp(-x / .3) * .6) * v
def tinkles(v=1.0, d=1.5):
    y = np.zeros(int(d * SR))
    for k in range(14): x = t_(.3); f = rng.uniform(2500, 6000); z = np.sin(2 * np.pi * f * x) * np.exp(-x / .06); s2 = int(rng.uniform(0, d - .3) * SR); y[s2:s2 + len(z)] += z * rng.uniform(.4, 1)
    return norm(y) * v
def xpdown(v=1.0): d = 1.2; x = t_(d); f = 1200 * np.exp(-x * 1.8) + 120; return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 * np.clip((d - x) / .1, 0, 1)) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'banner': add(fx, chime(.12, 1319), t, 1, 0); add(fx, chime(.07, 1976), t + .08, 1, .2)
    elif k == 'dlg' and t > 0: add(fx, blip(.05, 1568, .05), t, 1, 0)
    elif k == 'boing': add(fx, boing(.55), t, 1, .1)
    elif k == 'thwack': add(fx, thwack(.6), t, 1, 0)
    elif k == 'whoosh': add(fx, whoosh(.4, .3), t, 1, 0)
    elif k == 'hop': add(fx, popfx(.25, 300), t, 1, .2)
    elif k == 'count': add(fx, blip(.12, 1046, .08), t, 1, .3)
    elif k == 'shutter': add(fx, shutter(.4), t, 1, .3)
    elif k == 'wail': add(fx, wail(.32 if e.get('k', 0) == 0 else .16, 1.1, 480 + e.get('k', 0) * 23), t, 1, -.1 if e.get('k', 0) == 0 else .2 + e.get('k', 0) * .05)
    elif k == 'print': add(fx, whirr(.2, .5), t, 1, .3)
    elif k == 'sack': add(fx, rustle(.35, .8), t, 1, 0)
    elif k == 'gift': add(fx, popfx(.12, 500 + e.get('k', 0) * 40), t, 1, .2 + e.get('k', 0) * .05)
    elif k == 'cheer': add(fx, cheer(.4, 1.6), t, 1, .2)
    elif k == 'heels': [add(fx, heel(.15), t + j * .2, 1, .4) for j in range(4)]
    elif k == 'creak': add(fx, creak(.35), t, 1, 0)
    elif k == 'zap': add(fx, zap(.5), t, 1, .1)
    elif k == 'servo': add(fx, servo(.3), t, 1, -.3)
    elif k == 'neigh': add(fx, whinny(.4), t, 1, -.3)
    elif k == 'bells': add(fx, jingle(.3), t, 1, -.2)
    elif k == 'gallop': add(fx, clop(.18), t, 1, -.2); add(fx, clop(.12), t + .12, 1, -.2); add(fx, jingle(.06, .2), t, 1, 0)
    elif k == 'flash': add(fx, shutter(.1), t, 1, .4)
    elif k == 'pop': [add(fx, popfx(.15, 300 + j * 80), t + j * .07, 1, -.3) for j in range(4)]
    elif k == 'crash': add(fx, crash(.8), t, 1, -.2)
    elif k == 'baubles': add(fx, tinkles(.3), t, 1, -.2)
    elif k == 'steps': [add(fx, footstep(.15), t + j * .3, 1, .3) for j in range(3)]
    elif k == 'xpdown': add(fx, xpdown(.12), t, 1, -.3)

# —— voices ——
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
def load(i):
    x, sr = sf.read(os.path.join(HERE, 'voices', i + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    return resample_poly(x, SR, sr)
vox = np.zeros((N, 2)); spans = []
for e in ev('vo'):
    x = load(e['id'])
    x = compress(x / (np.abs(x).max() + 1e-9) * .7, thr=.2, ratio=3)
    if e['dlg']: x = lp(x, 7000, 4); x = hp(x, 140)              # on-screen characters sit "in the world"
    x *= 10 ** ((-19 - rms_db(x[np.abs(x) > .01])) / 20)          # RMS-match each line
    add(vox, x, e['t'], 1, {'YOU': -.1, 'THE CUSTOMER': .15, 'THE MANAGER': -.2, 'THE KID': .2}.get(e.get('who'), 0))
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
