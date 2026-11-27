# Mix: score (out/music.wav) + museum ambience + event foley (events.json) + voices → out/mix.wav, mastered to −14 LUFS / −1.9 dBTP.
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

# —— ambience: ventilation hum and room tone; a wall clock in the lobby; wind in the Egypt room; nothing in the dark; dawn birds ——
hum = lp(brown(DUR), 220) * .6 + (np.sin(2 * np.pi * 50 * tt) * .5 + np.sin(2 * np.pi * 100 * tt) * .25) * .05 + hp(lp(noise(DUR), 3000), 400) * .05
humG = curve([(0, .8), (T('click'), .8), (T('click') + .05, 0), (T('spot') - .2, 0), (T('spot') + .5, .5), (DUR, .6)])
wind = bp(noise(DUR), 250, 1200) * (.6 + .4 * np.sin(2 * np.pi * .13 * tt)) * curve([(0, 0), (27.6, 0), (28.2, .8), (37.2, .8), (37.6, 0), (DUR, 0)])
birds = np.zeros(N)
for t0 in np.sort(rng.uniform(51.3, DUR - .5, 26)):
    f0 = rng.uniform(2600, 4200); n = rng.integers(2, 5)
    for k in range(n):
        d = rng.uniform(.06, .12); x = t_(d); f = f0 * (1 + .25 * np.sin(np.pi * x / d)) * (1 - .1 * k); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 2 * rng.uniform(.2, .5)
        s = int((t0 + k * .13) * SR); y = y[:max(0, min(len(y), N - s))]; birds[s:s + len(y)] += y
amb = stereo(hum * humG, -.1) + stereo(np.roll(hum, 7919) * humG, .1) + stereo(wind * .22, .3) + stereo(birds, .35) + stereo(np.roll(birds, 13001) * .6, -.4)
amb *= curve([(0, .7), (.5, 1), (DUR - 1, 1), (DUR, 0)])[:, None]

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def footstep(kind, v=1.0):
    d = .16; x = t_(d)
    if kind == 'marble': y = bp(noise(d), 1500, 7000) * np.exp(-x / .012) + np.sin(2 * np.pi * 340 * x) * np.exp(-x / .02) * .5
    elif kind == 'wood': y = bp(noise(d), 300, 2500) * np.exp(-x / .02) + np.sin(2 * np.pi * 150 * x) * np.exp(-x / .03) * .7
    elif kind == 'stone': y = bp(noise(d), 600, 4000) * np.exp(-x / .015) + bp(noise(d), 2000, 8000) * np.exp(-x / .06) * .25   # sandy grit
    else: y = lp(noise(d), 900) * np.exp(-x / .03)   # carpet
    return norm(y) * v
def tick(v=1.0): d = .05; x = t_(d); return norm(bp(noise(d), 2500, 9000) * np.exp(-x / .004) + np.sin(2 * np.pi * 3200 * x) * np.exp(-x / .006) * .5) * v
def bonecreak(v=1.0, d=.6):
    x = t_(d); f = 90 + 40 * np.sin(2 * np.pi * 2 * x); ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sign(np.sin(ph)) * (np.sin(2 * np.pi * 31 * x) > 0)) ; return norm(bp(y, 400, 3500) * np.sin(np.pi * x / d)) * v
def bones(v=1.0):   # a clatter of small dry knocks
    y = np.zeros(int(.4 * SR))
    for k, at in enumerate([0, .035, .07, .12, .2]):
        c = clack(1.4 + .2 * k, 1.0); s = int(at * SR); y[s:s + len(c)] += c[:len(y) - s] * (1 - k * .15)
    return norm(y) * v
def swish(v=1.0): d = .25; x = t_(d); return norm(bp(noise(d), 800, 5000) * np.sin(np.pi * x / d) ** 2) * v
def grind(v=1.0, d=.6): x = t_(d); return norm(lp(noise(d), 1200) * (1 + .5 * np.sin(2 * np.pi * 37 * x)) * np.clip(x / .05, 0, 1) * np.clip((d - x) / .1, 0, 1)) * v
def rustle(v=1.0, d=.5): x = t_(d); return norm(bp(noise(d), 1500, 7000) * np.abs(np.sin(2 * np.pi * 6 * x)) * np.sin(np.pi * x / d)) * v
def lidthud(v=1.0): d = .9; x = t_(d); return norm(lp(noise(d), 400) * np.exp(-x / .06) + np.sin(2 * np.pi * 60 * x) * np.exp(-x / .15)) * v
def yawn(v=1.0, d=1.0):
    x = t_(d); f = 140 + 60 * np.sin(np.pi * x / d); ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .5), (3, .3)]) + bp(noise(d), 300, 1500) * .4; return norm(lp(y, 1500) * np.sin(np.pi * x / d)) * v
def purr(v=1.0, d=.9): x = t_(d); return norm(lp(noise(d), 300) * (np.sin(2 * np.pi * 24 * x) > 0) * np.sin(np.pi * x / d)) * v
def giggle(v=1.0):
    y = np.zeros(int(.7 * SR))
    for k in range(5):
        d = .09; x = t_(d); f = 700 - k * 30; z = np.sin(2 * np.pi * f * x) * np.sin(np.pi * x / d) ** 2 + .3 * np.sin(4 * np.pi * f * x) * np.sin(np.pi * x / d) ** 2; s = int(k * .12 * SR); y[s:s + len(z)] += z
    return norm(bp(y, 300, 5000)) * v
def buzz(v=1.0, d=.35): x = t_(d); return norm((np.sign(np.sin(2 * np.pi * 120 * x)) * .5 + bp(noise(d), 2000, 6000)) * (np.sin(2 * np.pi * 9 * x) > -.3) * np.exp(-x / .15)) * v
def heart(v=1.0):
    d = .45; x = t_(d); one = lambda a: np.sin(2 * np.pi * 48 * (x - a)) * np.exp(-np.clip(x - a, 0, None) / .05) * (x >= a)
    return norm(lp(one(0) + .7 * one(.16), 200)) * v
def clunk(v=1.0): d = .6; x = t_(d); return norm(np.sin(2 * np.pi * 85 * x) * np.exp(-x / .05) + bp(noise(d), 500, 3000) * np.exp(-x / .01) + np.sin(2 * np.pi * 100 * x) * .06 * np.exp(-x / .4)) * v
def match(v=1.0): d = .6; x = t_(d); return norm(bp(noise(d), 2000, 9000) * np.exp(-x / .03) + lp(noise(d), 1200) * np.clip(x / .05, 0, 1) * np.exp(-x / .3) * .5) * v
def cheer(v=1.0, d=1.6):
    x = t_(d); y = np.zeros(len(x))
    for k, f0 in enumerate([420, 560, 700, 300, 880]):
        f = f0 * (1 + .15 * np.sin(2 * np.pi * (3 + k) * x)); ph = 2 * np.pi * np.cumsum(f) / SR; y += np.sin(ph) * .3 + np.sin(2 * ph) * .15
    y += bp(noise(d), 600, 4000) * .6; return norm(y * np.clip(x / .05, 0, 1) * np.exp(-x / .6)) * v
def puff(v=1.0): d = .45; x = t_(d); return norm(bp(noise(d), 400, 3000) * np.sin(np.pi * x / d) ** 1.5) * v
def snore(v=1.0, d=1.2): x = t_(d); return norm(lp(noise(d), 500) * (1 + np.sin(2 * np.pi * 30 * x)) * np.sin(np.pi * x / d) ** 2) * v
def blip(v=1.0): d = .3; x = t_(d); return norm(np.sin(2 * np.pi * (1800 + 1200 * x / d) * x) * np.exp(-x / .08)) * v
def dinoroar(v=1.0): return norm(roar(1.1, 1.0)) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'card' or k == 'banner': add(fx, chime(.12, 1319), t, 1, 0); add(fx, chime(.07, 1976), t + .08, 1, .2)
    elif k == 'dlg': add(fx, chime(.1, 1568), t, 1, 0)
    elif k == 'step': add(fx, footstep(e['f'], .22 if e.get('run') else .16), t, 1, 0)
    elif k == 'tick': add(fx, tick(.12), t, 1, -.3)
    elif k == 'look': add(fx, bonecreak(.3, .5), t, 1, -.2)
    elif k == 'turn': add(fx, swish(.18), t, 1, 0)
    elif k == 'snap': add(fx, bones(.35), t, 1, -.2)
    elif k == 'lift': add(fx, bonecreak(.3, .8), t, 1, -.2)
    elif k == 'freeze': add(fx, bones(.25), t + .02, 1, -.2)
    elif k == 'scurry': add(fx, whoosh(.4, .3), t, 1, .2)
    elif k == 'purr': add(fx, purr(.25), t, 1, .35)
    elif k == 'giggle': add(fx, giggle(.18), t, 1, -.3)
    elif k == 'grind': add(fx, grind(.4, .6), t, 1, .2)
    elif k == 'rustle': add(fx, rustle(.2), t, 1, .2)
    elif k == 'yawn': add(fx, yawn(.3), t, 1, .2)
    elif k == 'thud': add(fx, lidthud(.6), t, 1, .2)
    elif k == 'buzz': add(fx, buzz(.25), t, 1, 0)
    elif k == 'click': add(fx, click(.9, .6), t, 1, 0)
    elif k == 'heart': add(fx, heart(.55), t, 1, 0)
    elif k == 'spot': add(fx, clunk(.55), t, 1, [-.1, .3, -.35][e['n'] - 1])
    elif k == 'candle': add(fx, match(.3), t, 1, .3)
    elif k == 'cheer': add(fx, cheer(.5), t, 1, 0)
    elif k == 'roar': add(fx, dinoroar(.35), t, 1, -.2)
    elif k == 'puff': add(fx, puff(.4), t, 1, .1)
    elif k == 'cheer2': add(fx, cheer(.35, 1.0), t, 1, 0)
    elif k == 'snore': add(fx, snore(.2), t, 1, -.2)
    elif k == 'wink': add(fx, blip(.12), t, 1, .2)

# —— voices ——
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
def load(i):
    x, sr = sf.read(os.path.join(HERE, 'voices', i + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    return resample_poly(x, SR, sr)
vox = np.zeros((N, 2)); spans = []
for e in ev('vo'):
    if e['id'] == 's1':   # SURPRISE: three voices together
        xs = [load(i) for i in ('s1a', 's1b', 's1c')]; L = max(len(x) for x in xs) + int(.06 * SR); x = np.zeros(L)
        for j, y in enumerate(xs): s = int(j * .025 * SR); x[s:s + len(y)] += y / (np.abs(y).max() + 1e-9)
    else: x = load(e['id'])
    x = compress(x / (np.abs(x).max() + 1e-9) * .7, thr=.2, ratio=3)
    if e['dlg']: x = lp(x, 7000, 4); x = hp(x, 140)              # on-screen characters sit "in the world"
    if e.get('who') == 'THE MUMMY':                                # dusty, from inside a stone box
        x = resample_poly(x, 25, 23); L = int(1.2 * SR); ir = rng.standard_normal(L) * np.exp(-np.arange(L) / SR / .35); ir[:int(.015 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        x = np.concatenate([x, np.zeros(L)]); x = lp(x * .75 + fftconvolve(x, ir)[:len(x)] * .4, 4500)
    x *= 10 ** ((-19 - rms_db(x[np.abs(x) > .01])) / 20)          # RMS-match each line
    add(vox, x, e['t'], 1, {'YOU': -.1, 'THE DUCHESS': .12, 'THE MUMMY': .15}.get(e.get('who'), 0))
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
