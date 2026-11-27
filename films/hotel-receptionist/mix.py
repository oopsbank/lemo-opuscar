# Mix: score (out/music.wav) + hotel ambience + event foley (events.json) + voices → out/mix.wav, mastered to −14 LUFS / −1.9 dBTP.
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

# —— ambience: lobby room tone and distant traffic through the door; quieter upstairs; the crowd; dead air under GAME OVER ——
tone = lp(brown(DUR), 260) * .6 + hp(lp(noise(DUR), 2500), 300) * .04
traffic = lp(brown(DUR), 500) * (.6 + .4 * np.sin(2 * np.pi * .07 * tt))
toneG = curve([(0, 1), (15.3, 1), (15.8, .5), (22.3, .5), (22.7, 1), (33.9, 1), (34.1, .15), (38.4, .15), (38.6, 1), (DUR, 1)])
crowd = np.zeros(N)
for k in range(9):   # murmuring voices: band-passed noise with syllable-rate wobble
    f0 = rng.uniform(250, 700); crowd += bp(noise(DUR), f0, f0 * 2.2) * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(3, 6) * tt + rng.uniform(0, 6))) ** 2
crowd *= curve([(0, 0), (23.4, 0), (24.5, .9), (30.4, .9), (30.6, .15), (33.9, .1), (34.1, 0), (DUR, 0)])
waves = lp(noise(DUR), 900) * (.5 + .5 * np.sin(2 * np.pi * .18 * tt)) ** 2 * curve([(0, 0), (8.45, 0), (8.7, .7), (11.6, .7), (12.4, 0), (DUR, 0)])
amb = stereo(tone * toneG, -.1) + stereo(np.roll(tone, 7919) * toneG, .1) + stereo(traffic * toneG * .35, .5) + stereo(crowd * .5, .35) + stereo(np.roll(crowd, 5003) * .4, -.1) + stereo(waves * .9, 0)

# —— foley ——
fx = np.zeros((N, 2))
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def deskbell(v=1.0):   # the reception bell: a bright inharmonic ding
    d = 1.6; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x / tau) for f, a, tau in [(2093, 1, .7), (5230, .45, .3), (7650, .2, .15), (2100, .5, .9)]) + bp(noise(d), 3000, 9000) * np.exp(-x / .004) * .4) * v
def footstep(v=1.0): d = .14; x = t_(d); return norm(lp(noise(d), 900) * np.exp(-x / .025) + np.sin(2 * np.pi * 110 * x) * np.exp(-x / .03) * .4) * v
def swish(v=1.0, d=.4): x = t_(d); return norm(bp(noise(d), 700, 5000) * np.sin(np.pi * x / d) ** 2) * v
def gull(v=1.0):
    y = np.zeros(int(1.0 * SR))
    for k in range(3):
        d = .22; x = t_(d); f = 1500 + 900 * np.sin(np.pi * x / d) - 300 * k; z = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR); z = bp(z, 700, 6000) * np.sin(np.pi * x / d) ** 2; s = int(k * .27 * SR); y[s:s + len(z)] += z
    return norm(y) * v
def coin(v=1.0):
    d = .45; x = t_(d); f = np.where(x < .08, 988, 1319); return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-x / .2) * .6) * v
def phonering(v=1.0, d=.8):
    x = t_(d); bell2 = np.sin(2 * np.pi * 1200 * x) + .7 * np.sin(2 * np.pi * 1500 * x); return norm(bell2 * (np.sin(2 * np.pi * 22 * x) > 0) * np.clip((d - x) / .05, 0, 1)) * v
def pickup(v=1.0): return norm(clack(1.2, 1.0)) * v
def bleat(v=1.0, d=.7):   # MEH: a pitched sawtooth with a fast wobble, through two formants
    x = t_(d); f = 520 * (1 + .1 * np.sin(2 * np.pi * 26 * x)) * (1 - .15 * x / d); ph = (np.cumsum(f) / SR) % 1; saw = 2 * ph - 1
    y = bp(saw, 500, 900) * 1.0 + bp(saw, 1500, 2600) * .7 + bp(saw, 2800, 3600) * .3
    return norm(y * np.clip(x / .04, 0, 1) * np.clip((d - x) / .15, 0, 1)) * v
def chew(v=1.0, d=1.0):
    y = np.zeros(int(d * SR))
    for k in range(int(d / .18)): z = bp(noise(.08), 600, 4000) * np.exp(-t_(.08) / .02); s = int(k * .18 * SR); y[s:s + len(z)] += z * (.7 + .3 * (k % 2))
    return norm(y) * v
def munch(v=1.0): return chew(v, .6) + 0
def gasp(v=1.0, d=.5): x = t_(d); return norm(bp(noise(d), 900, 4000) * np.sin(np.pi * x / d) * np.exp(-x / .2)) * v
def bushorn(v=1.0, d=.7):
    x = t_(d); y = sum(np.sign(np.sin(2 * np.pi * f * x)) for f in (311, 392)) * .5; return norm(lp(y, 2200) * np.clip(x / .02, 0, 1) * np.clip((d - x) / .05, 0, 1)) * v
def brakes(v=1.0, d=.8): x = t_(d); return norm(hp(noise(d), 2500) * np.exp(-x / .25) + np.sin(2 * np.pi * 3100 * x) * .2 * np.exp(-x / .3)) * v
def revolve(v=1.0, d=1.6): x = t_(d); return norm(bp(noise(d), 400, 2500) * (.6 + .4 * np.sin(2 * np.pi * 3 * x)) * np.sin(np.pi * x / d)) * v
def shutter(v=1.0):
    y = np.zeros(int(.2 * SR)); a = click(1.6, 1.0); b = click(1.2, .7); y[:len(a)] += a[:len(y)]; s = int(.06 * SR); y[s:s + len(b)] += b[:len(y) - s]
    return norm(y) * v
def sparkle(v=1.0):
    y = np.zeros(int(.8 * SR))
    for k, f in enumerate([2637, 3136, 3951, 5274]): x = t_(.3); z = np.sin(2 * np.pi * f * x) * np.exp(-x / .08); s = int(k * .06 * SR); y[s:s + len(z)] += z
    return norm(y) * v
def liftding(v=1.0): d = 1.8; x = t_(d); return norm(np.sin(2 * np.pi * 1319 * x) * np.exp(-x / .6) + .6 * np.sin(2 * np.pi * 1047 * (x - .35)) * np.exp(-np.clip(x - .35, 0, None) / .7) * (x > .35)) * v
def crunch(v=1.0):
    y = np.zeros(int(.6 * SR))
    for k in range(7): z = bp(noise(.05), 1500, 8000) * np.exp(-t_(.05) / .01); s = int((k * .045 + rng.uniform(0, .02)) * SR); y[s:s + len(z)] += z * rng.uniform(.5, 1)
    return norm(y) * v
def xpdown(v=1.0): d = 1.2; x = t_(d); f = 1200 * np.exp(-x * 1.8) + 120; return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 * np.clip((d - x) / .1, 0, 1)) * v

for e in EV:
    t, k = e['t'], e['type']
    if k == 'banner': add(fx, chime(.12, 1319), t, 1, 0); add(fx, chime(.07, 1976), t + .08, 1, .2)
    elif k == 'dlg': add(fx, chime(.08, 1568), t, 1, 0)
    elif k == 'bell': add(fx, deskbell(.55), t, 1, .25)
    elif k == 'step': add(fx, footstep(.16), t, 1, 0)
    elif k == 'tstep': add(fx, footstep(.08), t, 1, .4)
    elif k == 'cord': add(fx, swish(.12, .2), t, 1, .1)
    elif k == 'curtain': add(fx, swish(.35, .45), t, 1, .1)
    elif k == 'grab': add(fx, clack(.8, .3), t, 1, -.3)
    elif k == 'hang': add(fx, thump(.35, 110), t, 1, .1)
    elif k == 'gull': add(fx, gull(.22), t + .3, 1, .3)
    elif k == 'xp': add(fx, coin(.18), t, 1, 0)
    elif k == 'ring': add(fx, phonering(.32), t, 1, -.1)
    elif k == 'pickup': add(fx, pickup(.3), t, 1, -.1)
    elif k == 'whoosh': add(fx, whoosh(.5, .35), t, 1, 0)
    elif k == 'meh': add(fx, bleat(.45), t, 1, -.2)
    elif k == 'chew': add(fx, chew(.25, 1.2), t, 1, -.2)
    elif k == 'munch': add(fx, munch(.3), t, 1, -.2)
    elif k == 'gasp': add(fx, gasp(.25), t, 1, .2)
    elif k == 'horn': add(fx, bushorn(.4), t, 1, .5)
    elif k == 'brakes': add(fx, brakes(.2), t, 1, .5)
    elif k == 'revolve': add(fx, revolve(.25, 3.5), t, 1, .5)
    elif k == 'flash': add(fx, shutter(.22), t, 1, .3)
    elif k == 'sparkle': add(fx, sparkle(.15), t, 1, 0)
    elif k == 'ding': add(fx, liftding(.3), t, 1, -.35)
    elif k == 'crunch': add(fx, crunch(.55), t, 1, -.1); add(fx, bleat(.2, .35), t + .9, 1, -.1)
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
    if e.get('who') == 'ROOM 7':                                   # over the phone line
        x = np.tanh(bp(x, 350, 3200, 4) * 2.5) * .6
    x *= 10 ** ((-19 - rms_db(x[np.abs(x) > .01])) / 20)          # RMS-match each line
    add(vox, x, e['t'], 1, {'YOU': -.1, 'THE CUSTOMER': .15, 'THE MANAGER': -.15, 'THE GUIDE': .2}.get(e.get('who'), 0))
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
