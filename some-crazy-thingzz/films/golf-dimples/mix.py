# Mix for "Sand Trap": voices + score (ducked under them) + kitchen foley on the action + a quiet room bed (birds through the window,
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
PAN = {'narr': 0, 'gus': -.1, 'nana': .15}
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
def rasp(d):   # sandpaper on a ball: gritty band noise with a stroke envelope
    tt = t_(d); x = bp(noise(d), 1800, 9000) * (.6 + .4 * np.abs(np.sin(np.pi * tt / d))) ** 2 * np.sin(np.pi * tt / d) ** .5
    g = np.zeros_like(x); idx = rng.integers(0, len(x), int(d * 400)); g[idx] = rng.uniform(-1, 1, len(idx)); x += hp(g, 3000) * .8
    return norm(x)
def sparkle():   # a shine: high bell partials with a shimmer
    d = .7; tt = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(3520, 1, .25), (5280, .6, .18), (7040, .4, .12)]) * (1 + .3 * np.sin(2 * np.pi * 14 * tt)))
def swish(d=.28):   # a club through the air
    tt = t_(d); f = 600 + 2500 * np.sin(np.pi * tt / d); x = bp(noise(d), 400, 5000) * np.sin(np.pi * tt / d) ** 2
    return norm(x)
def tink():   # a weak, glassy tap on a polished ball
    d = .25; tt = t_(d); return norm(np.sin(2 * np.pi * 2900 * tt) * env_exp(d, .03) + hp(noise(d), 4000) * env_exp(d, .003) * .6)
def crack():   # a driver hit: a sharp crack with body
    d = .4; tt = t_(d); x = hp(noise(d), 1500) * env_exp(d, .006) * 1.4 + np.sin(2 * np.pi * 1800 * tt) * env_exp(d, .02) * .7 + np.sin(2 * np.pi * 180 * tt) * env_exp(d, .04) * .8
    return norm(x)
def plop():   # the ball landing in grass: a soft thud
    d = .25; tt = t_(d); return norm(lp(noise(d), 900) * env_exp(d, .03) + np.sin(2 * np.pi * 120 * tt) * env_exp(d, .05))
def roll(d):   # a slow roll back through grass
    tt = t_(d); return norm(bp(noise(d), 300, 2500) * (1 - tt / d) * (.6 + .4 * np.sin(2 * np.pi * 7 * tt)))
def cricket(d):   # the awkward silence
    x = np.zeros(int(d * SR) + 4000)
    for t0 in np.arange(0, d, .42):
        for k in range(3): s = int((t0 + k * .045) * SR); c = np.sin(2 * np.pi * 4300 * t_(.03)) * np.sin(np.pi * t_(.03) / .03); x[s:s + len(c)] += c[:len(x) - s]
    return x
def buzzer():   # the game-show WRONG buzzer
    d = .6; tt = t_(d); ph = 2 * np.pi * 110 * tt; x = np.sign(np.sin(ph)) + .5 * np.sign(np.sin(ph * 1.5))
    return norm(lp(x, 2500) * np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .05))
def air(d):   # the wind tunnel: a soft steady hiss
    tt = t_(d); return norm(bp(noise(d), 300, 3000)) * np.minimum(1, tt / .6) * np.minimum(1, (d - tt) / .4)
def whistle(d):   # the ball going up and away: a falling-pitch whistle, fading
    tt = t_(d); f = 1700 * (1 + tt / d * .5); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d * .45)) + bp(noise(d), 2000, 6000) * .3 * np.exp(-tt / (d * .3))
    return norm(x)

for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'rasp': add(buf, rasp(e['dur']), t, .17 * e.get('gain', 1), .1)
    elif ty == 'sparkle': add(buf, sparkle(), t, .12, .2)
    elif ty == 'swish': add(buf, swish(), t - .1, .22 * e.get('gain', 1), 0)
    elif ty == 'tink': add(buf, tink(), t, .2, 0)
    elif ty == 'crack': add(buf, crack(), t, .55, 0); add(buf, thump(1, 90), t, .2, 0)
    elif ty == 'plop': add(buf, plop(), t, .3, .3)
    elif ty == 'roll': add(buf, roll(e['dur']), t, .07, .3)
    elif ty == 'cricket': add(buf, cricket(e['dur']), t, .04, -.5)
    elif ty == 'buzzer': add(buf, buzzer(), t, .3, 0)
    elif ty == 'stamp': add(buf, thump(1, 70), t, .4, 0)
    elif ty == 'air': add(buf, air(e['dur']), t, .045, 0)
    elif ty == 'pat': add(buf, pop(), t, .12, 0)
    elif ty == 'whistle': add(buf, whistle(e['dur']), t, .14, .3)
    elif ty == 'twinkle': add(buf, sparkle(), t, .1, .3)

# —— bed: a light breeze, birds (not in the awkward silence or the smoke board) ——
bed = lp(brown(DUR + .3), 700) * .035
add(buf, bed, 0, 1, -.2); add(buf, bed[::-1].copy(), 0, 1, .2)
def bird(f0=3200):
    d = .12; tt = t_(d); f = f0 * (1 + .25 * np.sin(2 * np.pi * 18 * tt)) * (1 + .4 * tt / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
for t in np.arange(.9, DUR, 2.3):
    if 7.3 < t < 10.2 or 11.0 < t < 16.4: continue
    for k in range(rng.integers(2, 4)): add(buf, lp(bird(rng.uniform(2600, 3800)), 5000), t + k * .14 + rng.uniform(0, .05), .02, rng.uniform(-.7, .7))


buf += vbuf
for c in range(2): buf[:, c] = limit(buf[:, c], .62)   # headroom: the master adds about +2 dB to reach −14 LUFS
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
