# Mix for "Quán Mì Đêm": no voices. Score (from 22 s) + synthesised foley on every action + a bed of cloud-sea wind.
# Reads $OUT/score.wav and $OUT/events.json (core/render/events.mjs); writes $OUT/mix.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio.sfx import SR, add, t_, env_exp, noise, bp, lp, hp, norm, brown, whoosh, thump, pop, click, clack, ding, ignite, creak, limit

D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(OUT, 'events.json'))); DUR = E['dur']
rng = np.random.default_rng(11)
N = int((DUR + .3) * SR); buf = np.zeros((N, 2), np.float32)
score, sr = sf.read(os.path.join(OUT, 'score.wav'), dtype='float32'); assert sr == SR
add(buf, score[:, 0], 0, .95, -1); add(buf, score[:, 1], 0, .95, 1)

def bell(f, d=2.5, v=1.0, inh=(1, 2.76, 5.4, 8.93)):   # a struck metal bar: inharmonic partials, each with its own decay
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * (1.2 + r * .9)) / (1 + i) for i, r in enumerate(inh))
    return norm(x * np.minimum(1, tt / .002)) * v
def boil(d):   # bubbling broth: many little low "blup"s over a soft hiss
    x = lp(noise(d), 900) * .05
    for _ in range(int(d * 9)):
        s = rng.uniform(0, d - .1); f = rng.uniform(140, 380); tt = t_(.07); b = np.sin(2 * np.pi * (f + 900 * tt) * tt) * np.exp(-tt * 45)
        i = int(s * SR); x[i:i + len(b)] += b * rng.uniform(.2, .6)
    return norm(x) * .9
def wind(d):   # the cloud-sea wind: brown noise, slowly breathing
    x = lp(brown(d), 500); tt = t_(d); return norm(x * (.6 + .4 * np.sin(2 * np.pi * tt / 7.3) * np.sin(2 * np.pi * tt / 3.1 + 1)))
def stomp(v=1.0):   # a giant's footstep: a deep thump with a wooden rattle
    x = thump(1.0, 42); r = hp(noise(.35), 1800) * env_exp(.35, .05) * .25; y = np.zeros(max(len(x), len(r))); y[:len(x)] += x; y[:len(r)] += r; return norm(y) * v
def rainpatter(d):   # tiny drops on a head: high soft ticks
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 26)): s = int(rng.uniform(0, d - .02) * SR); c = hp(noise(.012), 3500) * env_exp(.012, .002); x[s:s + len(c)] += c * rng.uniform(.3, 1)
    return norm(x) * .6
def roll(d):   # a stone rolling on wood: irregular clacks getting softer
    x = np.zeros(int(d * SR)); t0 = 0
    while t0 < d - .05: c = clack(rng.uniform(.6, .9), 1); s = int(t0 * SR); x[s:s + len(c)] += c[:len(x) - s] * (1 - t0 / d); t0 += rng.uniform(.06, .14)
    return norm(x)
def sizzle(d):
    tt = t_(d); x = hp(noise(d), 2500) * (.5 + .5 * np.abs(np.sin(tt * 37))) * np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .4)
    for _ in range(int(d * 30)): s = int(rng.uniform(0, d - .01) * SR); x[s:s + 60] += rng.uniform(-1, 1)
    return norm(x) * .7
def pour(d):
    tt = t_(d); return norm(bp(noise(d), 400, 1800) * (1 + .3 * np.sin(tt * 60)) * np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .15)) * .6
def slurp(d):   # a long happy slurp: a band of noise sweeping up, wobbling
    tt = t_(d); x = noise(d); f = 500 + 1400 * (tt / d) ** .6; y = np.zeros_like(x)
    for k in range(0, len(x), 2048): seg_ = x[k:k + 2048]; c = f[min(k, len(f) - 1)]; y[k:k + len(seg_)] = bp(seg_, c * .7, c * 1.3)
    return norm(y * (.6 + .4 * np.sin(tt * 23)) * np.minimum(1, tt / .1) * np.minimum(1, (d - tt) / .3)) * .7
def shimmer(d):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt) * (.5 + .5 * np.sin(tt * (6 + k))) for k, f in enumerate([1568, 1976, 2349, 2637]))
    return norm(x * np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / .3)) * .35
def windchime(d):
    x = np.zeros(int((d + 2.5) * SR))
    for _ in range(9): s = int(rng.uniform(0, d) * SR); b = bell(rng.choice([1318, 1568, 1760, 2093, 2349]), 2.4, rng.uniform(.3, .8)); x[s:s + len(b)] += b[:len(x) - s]
    return norm(x) * .8
def steps(d):
    x = np.zeros(int((d + .5) * SR))
    for k in range(int(d / .62)): s = int(k * .62 * SR); f = stomp(.6 * (1 - k / (d / .62)) + .1); x[s:s + len(f)] += f[:len(x) - s]
    return x

for e in E['events']:
    ty, t, d, v = e['type'], e['t'], e.get('dur', .5), e.get('v', 1)
    if ty == 'boil': add(buf, boil(d), t, .16, -.2)
    elif ty == 'wind': add(buf, wind(d), t, .1, -.5); add(buf, wind(d)[::-1].copy(), t, .1, .5)
    elif ty == 'stomp': add(buf, stomp(v), t, .55, .1); add(buf, clack(1.4, .8), t + .04, .12 * v, .3)
    elif ty == 'sit': add(buf, thump(1, 60), t, .45, 0)
    elif ty == 'creak': add(buf, creak(), t, .3, .1)
    elif ty == 'rain': add(buf, rainpatter(d), t, .09, .2)
    elif ty == 'roll': add(buf, roll(d), t, .3, 0)
    elif ty == 'tick': add(buf, click(1.6, 1), t, .2, -.1)
    elif ty == 'whoosh': add(buf, whoosh(.35), t, .22, 0)
    elif ty == 'plop': add(buf, pop(), t, .25, 0)
    elif ty == 'sizzle': add(buf, sizzle(d), t, .2, -.1)
    elif ty == 'clang': add(buf, bell(880, 1.2, 1, (1, 2.3, 3.9, 5.7)), t, .25, -.2)
    elif ty == 'pour': add(buf, pour(d), t, .2, -.1)
    elif ty == 'pop': add(buf, pop(), t, .45, .1)
    elif ty == 'tink': add(buf, bell(2637, .8), t, .12, .1)
    elif ty == 'slide': add(buf, lp(noise(.5), 700) * env_exp(.5, .2), t, .15, 0)
    elif ty == 'slurp': add(buf, slurp(d), t, .35, .1)
    elif ty == 'shimmer': add(buf, shimmer(d), t, .3, .2)
    elif ty == 'chime': [add(buf, bell(f, 2.6), t + k * .07, .2, -.3 + k * .2) for k, f in enumerate([1568, 2093, 2637, 3136])]
    elif ty == 'steps': add(buf, steps(d), t, .4, .3)
    elif ty == 'whoomp': add(buf, ignite(), t, .45, .1)
    elif ty == 'windchime': add(buf, windchime(d), t, .25, -.4)

for c in range(2): buf[:, c] = limit(buf[:, c], .62)
tt = np.arange(N) / SR; buf *= np.clip((DUR - tt) / .6, 0, 1)[:, None]
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
