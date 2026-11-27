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

# —— ambience: store hum and fluorescent buzz, a murmuring crowd that grows with the queue, wind when we see the car park ——
tone = lp(brown(DUR), 260) * .6 + hp(lp(noise(DUR), 2500), 300) * .03
buzz = sum(a2 * np.sin(2 * np.pi * f * tt) for f, a2 in [(100, 1), (200, .5), (300, .25), (400, .12)]) * .05 * (1 + .3 * (np.sin(2 * np.pi * 7 * tt) > .8))
toneG = curve([(0, 1), (26.0, 1), (26.1, .2), (30.4, .2), (30.5, 1), (DUR, 1)])
crowd = np.zeros(N)
for k in range(10):   # murmuring voices: band-passed noise with syllable-rate wobble
    f0 = rng.uniform(250, 700); crowd += bp(noise(DUR), f0, f0 * 2.2) * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(3, 6) * tt + rng.uniform(0, 6))) ** 2
crowd *= curve([(0, .25), (16.3, .25), (17.5, 1.0), (20.4, 1.0), (20.6, .2), (21.2, .6), (26.0, .5), (26.1, 0), (30.4, 0), (30.5, .25), (DUR, .25)])
wind = lp(noise(DUR), 700) * (.6 + .4 * np.sin(2 * np.pi * .3 * tt)) * curve([(0, 0), (17.0, 0), (18.0, .8), (19.9, .8), (20.0, 0), (DUR, 0)])
amb = stereo(tone * toneG, -.1) + stereo(np.roll(tone, 7919) * toneG, .1) + stereo(buzz * toneG, 0) + stereo(crowd * .5, .35) + stereo(np.roll(crowd, 5003) * .4, -.15) + stereo(wind * .8, .4)

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def footstep(v=1.0): d = .14; x = t_(d); return norm(lp(noise(d), 900) * np.exp(-x / .025) + np.sin(2 * np.pi * 110 * x) * np.exp(-x / .03) * .4) * v
def swish(v=1.0, d=.4): x = t_(d); return norm(bp(noise(d), 700, 5000) * np.sin(np.pi * x / d) ** 2) * v
def coin(v=1.0, f0=988):
    d = .45; x = t_(d); f = np.where(x < .08, f0, f0 * 1.335); return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-x / .2) * .6) * v
def blip(v=1.0, f0=880, d=.12): x = t_(d); return norm(np.sign(np.sin(2 * np.pi * f0 * x)) * np.clip((d - x) / .03, 0, 1)) * v
def slam(v=1.0):   # a box hitting the counter: body thump, a cardboard slap, crumbs
    d = .5; x = t_(d); f = 120 * np.exp(-x / .05) + 60
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .1) + bp(noise(d), 300, 3000) * np.exp(-x / .02) * .9
    for k in range(6): s = int((.03 + k * .03 + rng.uniform(0, .02)) * SR); z = bp(noise(.03), 2500, 9000) * np.exp(-t_(.03) / .006) * .25; y[s:s + len(z)] += z
    return norm(y) * v
def munch(v=1.0, d=.5):
    y = np.zeros(int(d * SR))
    for k in range(int(d / .12)): z = bp(noise(.06), 600, 4000) * np.exp(-t_(.06) / .015); s = int(k * .12 * SR); y[s:s + len(z)] += z * (.7 + .3 * (k % 2))
    return norm(y) * v
def till(v=1.0):   # the cash drawer: a bell and a metal slide
    d = 1.0; x = t_(d); bell = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x / tau) for f, a, tau in [(2637, 1, .4), (3520, .5, .25), (5274, .2, .12)])
    slide = bp(noise(d), 1500, 6000) * np.exp(-((x - .05) / .05) ** 2) * .6 + np.sin(2 * np.pi * 180 * x) * np.exp(-np.clip(x - .1, 0, None) / .03) * (x > .1) * .7
    return norm(bell + slide) * v
def rip(v=1.0, d=1.5):   # the receipt unrolling: a ratchety paper rip, rising
    x = t_(d); rate = 18 + 40 * x / d; ph = np.cumsum(rate) / SR
    y = (bp(noise(d), 1200, 7000) * (1 - x / d) + bp(noise(d), 3500, 9000) * (x / d)) * (.5 + .5 * (np.sin(2 * np.pi * ph) > 0)) * np.clip(x / .05, 0, 1) * np.clip((d - x) / .05, 0, 1)
    return norm(y) * v
def alarm(v=1.0, d=3.4): x = t_(d); f = np.where((x * 2.5) % 1 < .5, 960, 720); return norm(lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 3000) * np.clip((d - x) / .1, 0, 1)) * v
def creak(v=1.0, d=.4): x = t_(d); f = 160 + 60 * np.sin(2 * np.pi * 3 * x); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * np.sin(np.pi * x / d)) * v
def crash(v=1.0):   # the cage gives way: a metal clang, then a cardboard roar
    d = 1.6; x = t_(d); clang = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x / tau) for f, a, tau in [(420, 1, .5), (1130, .6, .3), (2400, .3, .2)])
    roar = lp(noise(d), 2500) * np.exp(-x / .5) * 1.4
    return norm(clang * .6 + roar + np.sin(2 * np.pi * 55 * x) * np.exp(-x / .2)) * v
def boxthump(v=1.0): d = .25; x = t_(d); f = 140 * np.exp(-x / .04) + 80; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .07) + bp(noise(d), 400, 2500) * np.exp(-x / .015) * .6) * v
def popfx(v=1.0): d = .18; x = t_(d); f = 400 + 1600 * x / d; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .06)) * v
def xpdown(v=1.0): d = 1.2; x = t_(d); f = 1200 * np.exp(-x * 1.8) + 120; return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 * np.clip((d - x) / .1, 0, 1)) * v
def doorslide(v=1.0, d=.8): x = t_(d); return norm(bp(noise(d), 300, 2000) * np.sin(np.pi * x / d)) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'banner': add(fx, chime(.12, 1319), t, 1, 0); add(fx, chime(.07, 1976), t + .08, 1, .2)
    elif k == 'dlg' and t > 0: add(fx, blip(.05, 1568, .05), t, 1, 0)
    elif k == 'step': add(fx, footstep(.16), t, 1, {'cust': .3, 'dad': .25, 'boss': -.3}.get(e.get('who'), 0))
    elif k == 'slam': add(fx, slam(.7), max(0, t), 1, .1)
    elif k == 'lid': add(fx, clack(1.4, .25), t, 1, .1)
    elif k == 'point': add(fx, swish(.12, .2), t, 1, -.1)
    elif k == 'bang': add(fx, blip(.12, 1320, .08), t, 1, .2); add(fx, blip(.1, 1760, .1), t + .08, 1, .2)
    elif k == 'catjump': add(fx, footstep(.12), t, 1, -.2)
    elif k == 'munch': add(fx, munch(.3), t, 1, 0)
    elif k == 'till': add(fx, till(.4), t, 1, -.25)
    elif k == 'coins': [add(fx, coin(.1, 988 * (1 + .12 * j)), t + j * .07, 1, -.2 + j * .1) for j in range(6)]
    elif k == 'xp': add(fx, coin(.14, 1319), t + .1, 1, 0)
    elif k == 'shuffle': [add(fx, footstep(.07), t + j * .09, 1, .4) for j in range(8)]
    elif k == 'thud': add(fx, slam(.5), t, 1, .1)
    elif k == 'rip': add(fx, rip(.4, 1.45), t, 1, 0)
    elif k == 'stab': add(fx, thump(.5, 70), t, 1, 0)
    elif k == 'sweat': add(fx, blip(.06, 2200, .06), t, 1, -.1)
    elif k == 'alarm': add(fx, alarm(.22, 3.4), t, 1, .2)
    elif k == 'whoosh': add(fx, whoosh(.45, .35), t, 1, 0)
    elif k == 'creak': add(fx, creak(.3, .35), t, 1, -.1)
    elif k == 'crash': add(fx, crash(.8), t, 1, 0)
    elif k == 'thump': add(fx, boxthump(.4), t, 1, (e.get('k', 0) % 3 - 1) * .3)
    elif k == 'pop': add(fx, popfx(.35), t, 1, -.1)
    elif k == 'xpdown': add(fx, xpdown(.12), t, 1, -.3)
    elif k == 'door': add(fx, doorslide(.2), t, 1, .5)

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
    add(vox, x, e['t'], 1, {'YOU': -.1, 'THE CUSTOMER': .15, 'THE MANAGER': -.2, 'THE DAD': .2}.get(e.get('who'), 0))
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
