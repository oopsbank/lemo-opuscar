# Mix for "The Bristle Wall": no voices. Score + synthesised foley for every event + a room tone of the escalator and the city.
# Reads $OUT/score.wav and $OUT/events.json (core/render/events.mjs); writes $OUT/mix.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio.sfx import SR, add, t_, env_exp, noise, bp, lp, hp, norm, brown, whoosh, thump, pop, click, clack, ding, creak, limit

E = json.load(open(os.path.join(OUT, 'events.json'))); DUR = E['dur']; EVS = E.get('events', E.get('ev', []))
rng = np.random.default_rng(3)
N = int((DUR + .3) * SR); buf = np.zeros((N, 2), np.float32)
score, sr = sf.read(os.path.join(OUT, 'score.wav'), dtype='float32'); assert sr == SR
add(buf, score[:, 0], 0, .9, -1); add(buf, score[:, 1], 0, .9, 1)

def fade(x, a=.01, b=.05): tt = t_(len(x) / SR); return x * np.minimum(1, tt / a) * np.minimum(1, (tt[-1] - tt + 1e-4) / b)
def tone(f0, f1, d, harm=(1, .5, .25)):   # a gliding voice-less "vocal" tone (squeal, hum) from a few harmonics
    tt = t_(d); f = np.linspace(f0, f1, len(tt)); ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(np.sin(ph * (k + 1)) * a for k, a in enumerate(harm))
def brush(d):   # nylon bristles on leather: rhythmic filtered noise swishes ("fwish… fwish…")
    tt = t_(d); x = hp(noise(d), 2500) * (.3 + .7 * np.abs(np.sin(tt * 7.5 / 2 * np.pi / 2 * 2))) ; return norm(lp(x, 9000)) * .6
def room(d):   # the escalator's steady rumble + far city murmur
    x = lp(brown(d), 180) * 1.0 + bp(noise(d), 300, 1200) * .08; tt = t_(d); x *= .8 + .2 * np.sin(tt * 2 * np.pi * 1.7); return norm(x) * .6
def suck():   # "SHHLUP": a fast downward-sweeping slurp
    d = .45; tt = t_(d); x = noise(d); y = np.zeros_like(x)
    for k in range(0, len(x), 1024): c = 3000 - 2600 * (k / len(x)); y[k:k + 1024] = bp(x[k:k + 1024], c * .6, c * 1.4)
    return fade(norm(y) * env_exp(d, .25), .005, .08)
def scratch():   # record scratch: a noise burst sweeping up then down
    d = .35; tt = t_(d); f = 600 + 2500 * np.sin(tt / d * np.pi); y = np.zeros(len(tt)); x = noise(d)
    for k in range(0, len(x), 512): c = f[k]; y[k:k + 512] = bp(x[k:k + 512], c * .7, c * 1.3)
    return fade(norm(y), .003, .05)
def doom(): x = tone(55, 48, 1.6, (1, .6, .3, .15)) * env_exp(1.6, .7); return norm(lp(x, 400))
def ping(v=1): return bell(2800 + rng.uniform(-200, 200), .5) * v
def bell(f, d=1.0, v=1.0, inh=(1, 2.76, 5.4)):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * (3 + r * 2)) / (1 + i) for i, r in enumerate(inh)); return norm(x * np.minimum(1, tt / .002)) * v
def frrsh():   # bristles fluffing up: a crackly noise swell
    d = .5; tt = t_(d); x = hp(noise(d), 3500) * np.sin(np.pi * tt / d) ** .5
    for _ in range(80): s = int(rng.uniform(0, d - .005) * SR); x[s:s + 40] += rng.uniform(-1, 1) * .8
    return norm(x) * .8
def boing(): tt = t_(.35); f = 180 + 260 * np.exp(-tt * 9) * (1 + .3 * np.sin(tt * 60)); ph = 2 * np.pi * np.cumsum(f) / SR; return norm(np.sin(ph) * env_exp(.35, .15))
def stretch(d):   # rubber stretching: a rising rubbery squeal ("KÉÉÉT")
    x = tone(300, 900, d, (1, .7, .5, .3, .2)) * (1 + .3 * np.sin(t_(d) * 70)); return fade(norm(x), .02, .1) * .7
def giggle(d):   # wordless giggles: short rising-falling hummed pips
    x = np.zeros(int(d * SR))
    for k in range(int(d / .14)): s = int(k * .14 * SR); y = tone(520 + 60 * (k % 2), 480, .1, (1, .4, .2)) * np.sin(np.pi * t_(.1) / .1); x[s:s + len(y)] += y[:len(x) - s]
    return norm(x) * .7
def grind(d):   # the comb teeth: metallic grinding, with a "rắc" every step
    x = bp(noise(d), 120, 600) * .6 + hp(noise(d), 4000) * .08; tt = t_(d); x *= .6 + .4 * np.abs(np.sin(tt * np.pi * .85))
    for k in range(int(d / 1.18)): s = int(k * 1.18 * SR); c = clack(1.6, .7); x[s:s + len(c)] += c[:len(x) - s] * 1.5
    return norm(x) * .8
def tick(d):   # the mechanical tick, quickening
    x = np.zeros(int(d * SR)); t0 = 0; iv = .5
    while t0 < d - .02: c = click(2.4, 1); s = int(t0 * SR); x[s:s + len(c)] += c[:len(x) - s] * (.5 + t0 / d * .5); t0 += iv; iv = max(.14, iv * .965)
    return x
def crack():
    x = np.zeros(int(.3 * SR))
    for s0, a in [(0, 1), (.03, .7), (.07, .5)]: i = int(s0 * SR); x[i:i + 300] += hp(noise(300 / SR), 2000)[:300] * env_exp(300 / SR, .004)[:300] * a
    return norm(x)
def beep(d): tt = t_(d); return norm(np.sign(np.sin(2 * np.pi * 1000 * tt)) * (np.sin(2 * np.pi * 3 * tt) > 0) * .3) * .5
def brake(): d = .9; tt = t_(d); x = tone(1800, 900, d, (1, .3)) * env_exp(d, .5) + bp(noise(d), 1500, 4000) * .3 * env_exp(d, .4); return norm(x)
def huych():
    x = thump(1.0, 70).copy(); y = lp(noise(.3), 600) * env_exp(.3, .06) * .5; n = min(len(x), len(y)); x[:n] += y[:n]; return norm(x)
def sploink(): tt = t_(.5); f = 700 * np.exp(-tt * 6) + 120; ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) * env_exp(.5, .25); return norm(x)
def blup(): tt = t_(.18); f = 200 + 500 * tt / .18; return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / .18))
def sniff(): x = bp(noise(.5), 1500, 5000) * np.concatenate([np.sin(np.pi * t_(.2) / .2), np.zeros(int(.05 * SR)), np.sin(np.pi * t_(.25) / .25)])[:int(.5 * SR)]; return norm(x) * .5
def sigh(d): tt = t_(d); return norm(bp(noise(d), 400, 3000) * np.sin(np.pi * tt / d) ** 2) * .5
def tear(): d = .5; x = bp(noise(d), 1200, 6000) * (1 + .6 * np.sign(np.sin(t_(d) * 250))); return fade(norm(x) * env_exp(d, .35), .005, .05)
def spray(d): tt = t_(d); x = hp(noise(d), 3000) * ((tt % .55) < .45); return fade(norm(x) * .7, .02, .05)
def hmph(): x = tone(180, 140, .35, (1, .5, .3)) * np.sin(np.pi * t_(.35) / .35); return norm(lp(x + bp(noise(.35), 300, 1500) * .3, 1200)) * .7

for e in EVS:
    ty, t, d, v = e['type'], e['t'], e.get('dur', .5), e.get('v', 1)
    if ty == 'room': add(buf, room(d), t, .12, -.3); add(buf, room(d)[::-1].copy(), t, .12, .3)
    elif ty == 'brush': add(buf, brush(d), t, .22, .3)
    elif ty == 'suck': add(buf, suck(), t, .55, .2)
    elif ty == 'slam': add(buf, thump(1, 90), t, .6, .3); add(buf, creak(), t + .05, .3, .3)
    elif ty == 'scratch': add(buf, scratch(), t, .45, 0)
    elif ty == 'doom': add(buf, doom(), t, .7, 0)
    elif ty == 'snap': add(buf, pop(), t, .5, .2)
    elif ty == 'ping': add(buf, ping(v), t, .28, rng.uniform(-.7, .7))
    elif ty == 'hmph': add(buf, hmph(), t, .35, .2)
    elif ty == 'frrsh': add(buf, frrsh(), t, .3, .4)
    elif ty == 'city':
        for k in range(int(d * 5)): add(buf, clack(rng.uniform(.8, 1.6), 1), t + rng.uniform(0, d), .06, rng.uniform(-.8, .8))
    elif ty == 'boing': add(buf, boing(), t, .3, -.1)
    elif ty == 'ting': add(buf, bell(3136, 1.2), t, .25, 0)
    elif ty == 'clack': add(buf, clack(1, 1), t, .3, 0)
    elif ty == 'tie': add(buf, bp(noise(d), 2000, 6000) * (np.sin(t_(d) * 30) > .3) * .4, t, .12, -.3)
    elif ty == 'giggle': add(buf, giggle(d), t, .3, .1)
    elif ty == 'rumble': add(buf, lp(brown(d), 120) * np.linspace(0, 1, int(d * SR)), t, .3, .4)
    elif ty == 'stretch': add(buf, stretch(d), t, .4, .35)
    elif ty == 'squeak': add(buf, tone(900, 1500, .3, (1, .3)) * env_exp(.3, .2), t, .25, .1)
    elif ty == 'grind': add(buf, grind(d), t, .3, .2); add(buf, tick(d), t, .22, -.2)
    elif ty == 'bump': add(buf, thump(1, 110), t, .4, -.3); add(buf, boing(), t + .02, .2, -.3)
    elif ty == 'tink': add(buf, bell(2400, .7), t, .3, .2)
    elif ty == 'crack': add(buf, crack(), t, .6, .1)
    elif ty == 'clunk': add(buf, thump(1, 140), t, .6, .3); add(buf, clack(.7, 1), t, .5, .3)
    elif ty == 'beep': add(buf, beep(d), t, .3, .3)
    elif ty == 'brake': add(buf, brake(), t, .35, 0)
    elif ty == 'huych': add(buf, huych(), t, .5, 0)
    elif ty == 'sploink': add(buf, sploink(), t, .55, .1)
    elif ty == 'sigh': add(buf, sigh(d), t, .25, .3)
    elif ty == 'blup': add(buf, blup(), t, .35, 0)
    elif ty == 'sniff': add(buf, sniff(), t, .25, -.1)
    elif ty == 'pat': add(buf, thump(1, 220) * .5, t, .25, -.2); add(buf, pop() * .2, t, .25, -.2)
    elif ty == 'tear': add(buf, tear(), t, .5, -.2)
    elif ty == 'spray': add(buf, spray(d), t, .3, .3)
    elif ty == 'turn': [add(buf, clack(rng.uniform(.9, 1.3), 1), t + rng.uniform(0, .08), .08, rng.uniform(-.8, .8)) for _ in range(40)]

for c in range(2): buf[:, c] = limit(buf[:, c], .62)
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
