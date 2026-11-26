# Mix for "Red Flag": score + cartoon foley on the action + a light outdoor bed (breeze, birds); crickets in the silence.
# Reads $OUT/score.wav and events.json (core/render/events.mjs); writes $OUT/mix.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio.sfx import SR, add, t_, env_exp, noise, bp, lp, hp, norm, brown, whoosh, creak, thump, pop, click, limit

D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(OUT, 'events.json') if os.path.exists(os.path.join(OUT, 'events.json')) else os.path.join(D, 'events.json'))); DUR = E['dur']
rng = np.random.default_rng(5)
N = int((DUR + .3) * SR); buf = np.zeros((N, 2), np.float32)

score, sr = sf.read(os.path.join(OUT, 'score.wav'), dtype='float32'); assert sr == SR
add(buf, score[:, 0], 0, .9, -1); add(buf, score[:, 1], 0, .9, 1)

# —— foley ——
def gravel_step(v=1.):
    d = .16; tt = t_(d); x = np.zeros(len(tt))
    for k in range(9):   # a cluster of tiny stone clicks
        s = int(rng.uniform(0, .07) * SR); g = bp(noise(.03), 1800 + rng.uniform(0, 3000), 7000) * env_exp(.03, .004) * rng.uniform(.3, 1)
        x[s:s + len(g)] += g[:len(x) - s]
    x += lp(noise(d), 500) * env_exp(d, .025) * .6
    return norm(x) * v
def boing(v=1.):   # spring: a pitch wobble decaying
    d = .7; tt = t_(d); f = 210 * (1 + .35 * np.sin(2 * np.pi * 11 * tt) * np.exp(-tt * 4)) * (1 + tt * .6)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .22) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR) * env_exp(d, .1)) * v
def slide_whistle(d=.38, f0=700, f1=2100, v=1.):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + bp(noise(d), 1500, 4000) * .05
    return norm(x * np.sin(np.pi * tt / d) ** .5) * v
def swell(d=1.0, v=1.):   # a breathy rise into the low angle
    tt = t_(d); return norm(bp(noise(d), 300, 2500) * (tt / d) ** 2.2 * np.exp(-np.maximum(0, tt - d * .92) * 60)) * v
def chatter(d, v=1.):   # teeth chattering + knees knocking while he hides
    x = np.zeros(int(d * SR)); t = 0
    while t < d - .05:
        c = click(rng.uniform(.6, .9), rng.uniform(.4, 1)); s = int(t * SR); x[s:s + len(c)] += c[:len(x) - s]; t += rng.uniform(.045, .07)
    return norm(x) * v
def metal(f=900, d=.6, v=1.):   # a struck painted-steel box: a few inharmonic partials
    tt = t_(d); x = sum(a * np.sin(2 * np.pi * f * k * tt + rng.uniform(0, 6)) * env_exp(d, tau) for k, a, tau in [(1, 1, .18), (1.47, .6, .12), (2.31, .45, .07), (3.1, .3, .05)])
    return norm(x + hp(noise(d), 2000) * env_exp(d, .004) * .6) * v

for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'step': add(buf, gravel_step(), t, .30 * e.get('gain', 1), rng.uniform(-.3, .3))
    elif ty == 'whoosh': add(buf, whoosh(.3), t - .2, .35, 0)
    elif ty == 'boing': add(buf, boing(), t + .02, .38, -.1); add(buf, slide_whistle(), t + .05, .2, .15)
    elif ty == 'swell': add(buf, swell(.9), t - .85, .22, 0)
    elif ty == 'tremble': add(buf, chatter(e['dur']), t, .16, -.2)
    elif ty == 'pop': add(buf, pop(), t, .22, -.2)
    elif ty == 'creak': add(buf, creak(), t, .3, .1); add(buf, creak(), t + .18, .22, .1)
    elif ty == 'clank': add(buf, metal(760, .7), t, .3, .1); add(buf, thump(1, 90), t, .25, 0)
    elif ty == 'clunk': add(buf, metal(520, .9), t, .34, .2); add(buf, thump(1, 70), t, .3, 0)

# —— bed: breeze and birds; crickets and a far bird only in the silence (18.4 – 19.95) ——
bed = lp(brown(DUR + .3), 900) * .05
def bird(f0=3200):
    d = .12; tt = t_(d); f = f0 * (1 + .25 * np.sin(2 * np.pi * 18 * tt)) * (1 + .4 * tt / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
add(buf, bed, 0, 1, -.2); add(buf, bed[::-1].copy(), 0, 1, .2)
for t in np.arange(.6, DUR, 1.7):
    if 18.3 < t < 20: continue
    for k in range(rng.integers(2, 4)): add(buf, bird(rng.uniform(2600, 3800)), t + k * .14 + rng.uniform(0, .05), .035, rng.uniform(-.7, .7))
def cricket(d=1.6):
    tt = t_(d); x = np.sin(2 * np.pi * 4600 * tt) * (np.sin(2 * np.pi * 28 * tt) > .2) * ((tt * 2.1) % 1 < .45)
    return x * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .2)
add(buf, cricket(1.6), 18.4, .035, .5); add(buf, cricket(1.5)[::-1].copy(), 18.45, .025, -.5)
add(buf, bird(2900), 19.3, .03, -.6)

for c in range(2): buf[:, c] = limit(buf[:, c], .9)
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
