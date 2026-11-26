# Mix for "No Holes": voices + score (ducked under them) + kitchen foley on the action + a quiet room bed (birds through the window,
# the oven's hum once it is on, a clock ticking in the silence). Reads $OUT/score.wav, events.json (core/render/events.mjs), lines.json and
# $OUT/voices; writes $OUT/mix.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d
from core.audio.sfx import SR, add, t_, env_exp, noise, bp, lp, hp, norm, brown, whoosh, thump, pop, click, clack, ding, ignite, limit, compress

D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(OUT, 'events.json') if os.path.exists(os.path.join(OUT, 'events.json')) else os.path.join(D, 'events.json'))); DUR = E['dur']
rng = np.random.default_rng(5)
N = int((DUR + .3) * SR); buf = np.zeros((N, 2), np.float32)

# —— voices: compressed, RMS-matched, placed at their `at`; the music ducks ~8 dB under them ——
score, sr = sf.read(os.path.join(OUT, 'score.wav'), dtype='float32'); assert sr == SR
LINES = json.load(open(os.path.join(D, 'lines.json'))); VDIR = os.path.join(OUT, 'voices')
duck = np.zeros(N, np.float32); vbuf = np.zeros((N, 2), np.float32)
PAN = {'narr': 0, 'kid': -.1, 'gran': .18}
for L in LINES:
    v, vsr = sf.read(os.path.join(VDIR, L['id'] + '.wav'), dtype='float32')
    if v.ndim > 1: v = v.mean(1)
    if vsr != SR: v = resample_poly(v, SR, vsr).astype(np.float32)
    v = hp(v, 90); v = compress(v / (np.abs(v).max() + 1e-9) * .9, thr=.22, ratio=3.2)
    v = v / (np.sqrt(np.mean(v[np.abs(v) > .02] ** 2)) + 1e-9) * .16                    # same speech RMS for every line
    add(vbuf, v, L['at'], 1.0, PAN.get(L['who'], 0))
    s0 = int(L['at'] * SR); duck[s0:s0 + len(v)] = 1
duck = np.clip(uniform_filter1d(duck, int(.25 * SR)) * 1.6, 0, 1)
mg = 10 ** (-8 * duck / 20)
add(buf, score[:, 0] * mg[:len(score)], 0, .9, -1); add(buf, score[:, 1] * mg[:len(score)], 0, .9, 1)

# —— foley (synthesised) ——
def metal(f=900, d=.6, v=1.):   # struck steel: a few inharmonic partials
    tt = t_(d); x = sum(a * np.sin(2 * np.pi * f * k * tt + rng.uniform(0, 6)) * env_exp(d, tau) for k, a, tau in [(1, 1, .18), (1.47, .6, .12), (2.31, .45, .07), (3.1, .3, .05)])
    return norm(x + hp(noise(d), 2000) * env_exp(d, .004) * .6) * v
def slap():   # wet dough slapped on a tray + a puff of flour
    d = .35; x = bp(noise(d), 250, 2200) * env_exp(d, .025) + np.sin(2 * np.pi * 95 * t_(d)) * env_exp(d, .05) * .8
    return norm(x)
def fork_clatter():   # a fork landing on the floor tiles off-screen: three bounces
    x = np.zeros(int(.9 * SR))
    for k, (dt, g) in enumerate([(0, 1), (.13, .6), (.22, .35), (.28, .2)]):
        m = metal(2300 + k * 140, .4, g); s = int(dt * SR); x[s:s + len(m)] += m[:len(x) - s]
    return lp(x, 6000)
def ratchet(d):   # an oven dial turning
    x = np.zeros(int(d * SR) + 2000); t = 0
    while t < d: c = clack(1.6, .7); s = int(t * SR); x[s:s + len(c)] += c[:len(x) - s]; t += .06
    return norm(x)
def hum(d):   # the oven's element hum
    tt = t_(d); x = .6 * np.sin(2 * np.pi * 60 * tt) + .3 * np.sin(2 * np.pi * 120 * tt) + lp(noise(d), 380) * .25
    return x * np.minimum(1, tt / .4) * np.minimum(1, (d - tt) / .6)
def blip(i):   # a bubble rising in the dough
    d = .09; tt = t_(d); f = (380 + i * 90) * (1 + tt / d * .8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
def stretch(d):   # rubbery dough swelling: a squeaky upward glide with a wobble
    tt = t_(d); f = 160 * 2 ** (tt / d * 1.6) * (1 + .04 * np.sin(2 * np.pi * 9 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sign(np.sin(ph)) * .3 + np.sin(ph)
    return norm(bp(x, 150, 2500) * (tt / d) ** .7 * np.minimum(1, (d - tt) / .05))
def boing():   # a spring: pitch wobble decaying
    d = .7; tt = t_(d); f = 190 * (1 + .35 * np.sin(2 * np.pi * 11 * tt) * np.exp(-tt * 4)) * (1 + tt * .6)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .22))
def hiss(d):   # steam
    tt = t_(d); return norm(bp(noise(d), 2500, 9000) * np.minimum(1, tt / .03) * np.exp(-tt / (d * .5)))
def deflate():   # a balloon letting go: a slide whistle down over a fluttering raspberry
    d = .8; tt = t_(d); f = 1900 * (420 / 1900) ** (tt / d)
    w = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** .4
    r = bp(np.sign(np.sin(2 * np.pi * np.cumsum(110 + 40 * (1 - tt / d)) / SR)), 100, 1600) * (.5 + .5 * np.sin(2 * np.pi * 24 * tt)) * np.sin(np.pi * tt / d) ** .5
    return norm(w * .7 + r * .5)
def shuffle():   # a slipper on tiles
    d = .22; tt = t_(d); return norm(bp(noise(d), 700, 3500) * np.sin(np.pi * tt / d) ** 2)
def crunch():   # a big crunch: a burst of crackles
    d = .32; x = np.zeros(int(d * SR))
    for _ in range(26):
        s = int(rng.uniform(0, .2) * SR); g = bp(noise(.025), rng.uniform(1200, 3500), 9000) * env_exp(.025, .004) * rng.uniform(.3, 1)
        x[s:s + len(g)] += g[:len(x) - s]
    x += lp(noise(d), 700) * env_exp(d, .05) * .6
    return norm(x)
def tick(d):   # a kitchen clock in the silence
    x = np.zeros(int(d * SR) + 4000)
    for k, t in enumerate(np.arange(0, d, .5)): c = clack(1.9 if k % 2 else 1.6, .5); s = int(t * SR); x[s:s + len(c)] += c[:len(x) - s]
    return x

for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'slap': add(buf, slap(), t, .42, -.05); add(buf, whoosh(.4), t + .02, .1, 0)
    elif ty == 'whoosh': add(buf, whoosh(.3), t - .15, .3, .1)
    elif ty == 'clang': add(buf, fork_clatter(), t, .2, -.65)
    elif ty == 'kick': add(buf, thump(1, 120), t, .2, .1)
    elif ty == 'slam': add(buf, metal(380, .7), t, .3, .15); add(buf, thump(1, 80), t, .3, .1)
    elif ty == 'ratchet': add(buf, ratchet(e['dur']), t, .16, .15)
    elif ty == 'ignite': add(buf, ignite(), t, .25, .15)
    elif ty == 'hum': add(buf, hum(e['dur']), t, .05, .1)
    elif ty == 'blip': add(buf, blip(e['i']), t, .2, .1)
    elif ty == 'stretch': add(buf, stretch(e['dur']), t, .16, .1)
    elif ty == 'bang': add(buf, metal(300, 1.0), t, .38, .15); add(buf, thump(1, 60), t, .45, 0); add(buf, boing(), t + .05, .3, .1)
    elif ty == 'hiss': add(buf, hiss(e['dur']), t, .12 * e.get('gain', 1), .2)
    elif ty == 'tick': add(buf, tick(e['dur']), t, .07, -.4)
    elif ty == 'shuffle': add(buf, shuffle(), t, .12, .4)
    elif ty == 'poke': add(buf, pop(), t, .25, .25)
    elif ty == 'deflate': add(buf, deflate(), t, .26, .15)
    elif ty == 'tock': add(buf, clack(1.0 + .05 * (e['k'] % 3), 1), t, .22, -.05)
    elif ty == 'ding': add(buf, ding(), t, .3, .2)
    elif ty == 'crunch': add(buf, crunch(), t, 1.3, 0); add(buf, crunch(), t + .09, .8, .1)

# —— bed: room tone, birds through the window (not in the silence) ——
bed = lp(brown(DUR + .3), 500) * .03
add(buf, bed, 0, 1, -.2); add(buf, bed[::-1].copy(), 0, 1, .2)
def bird(f0=3200):
    d = .12; tt = t_(d); f = f0 * (1 + .25 * np.sin(2 * np.pi * 18 * tt)) * (1 + .4 * tt / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
for t in np.arange(.9, DUR, 2.1):
    if 10.8 < t < 14.8: continue
    for k in range(rng.integers(2, 4)): add(buf, lp(bird(rng.uniform(2600, 3800)), 5000), t + k * .14 + rng.uniform(0, .05), .02, -.7)

buf += vbuf
for c in range(2): buf[:, c] = limit(buf[:, c], .62)   # headroom: the master adds about +2 dB to reach −14 LUFS
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
