# Mix for "Glue Time": voices + score (ducked under them) + kitchen foley on the action + a quiet room bed (birds through the window,
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
def buzzer():   # the game-show WRONG buzzer
    d = .6; tt = t_(d); ph = 2 * np.pi * 110 * tt; x = np.sign(np.sin(ph)) + .5 * np.sign(np.sin(ph * 1.5))
    return norm(lp(x, 2500) * np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .05))
def tapeclack():   # the loose hook rattling: two quick metal ticks
    x = np.zeros(int(.12 * SR))
    for k, t0 in enumerate([0, .035]): c = clack(3.2 + .3 * k, .9); s = int(t0 * SR); x[s:s + len(c)] += c[:len(x) - s]
    return norm(hp(x, 1500))
def squirt():   # glue squeezed out: a wet squelch
    d = .45; tt = t_(d); f = 300 * (1 + 2.5 * tt / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * .6 + bp(noise(d), 600, 3000) * np.sin(np.pi * tt / d) ** 3
    return norm(x)
def zip_(d=.4):   # the blade pulled out: a ratchety metal zip
    x = np.zeros(int(d * SR) + 2000)
    for t0 in np.arange(0, d, .018): c = click(2.4, .5); s = int(t0 * SR); x[s:s + len(c)] += c[:len(x) - s]
    return norm(hp(x, 1200) + bp(noise(d + 2000 / SR), 2000, 7000) * .15)
def zipback():   # the blade whipping home: a fast falling zip
    d = .18; x = np.zeros(int(d * SR) + 2000)
    for t0 in np.arange(0, d, .007): c = click(2.8, .5); s = int(t0 * SR); x[s:s + len(c)] += c[:len(x) - s]
    return norm(hp(x, 1500))
def clunk():   # a board jammed in a cubby
    d = .35; tt = t_(d); return norm(np.sin(2 * np.pi * 140 * tt) * env_exp(d, .07) + lp(noise(d), 800) * env_exp(d, .03) + bp(noise(d), 800, 2500) * env_exp(d, .01) * .5)
def slide(d=.35):   # wood sliding on wood
    tt = t_(d); return norm(bp(noise(d), 500, 3000) * np.sin(np.pi * tt / d) ** 1.5)
def tick():   # a tiny metal tick on the macro
    return norm(clack(4.0, .6))
def cheer():   # a tiny "yay": sparkle partials
    d = .8; tt = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(2093, 1, .3), (2637, .7, .25), (3136, .5, .2)]))

for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'clack': add(buf, tapeclack(), t, .35, .2)
    elif ty == 'whoosh': add(buf, whoosh(.3), t, .12, 0)
    elif ty == 'squirt': add(buf, squirt(), t, .3, -.1)
    elif ty == 'pop': add(buf, pop(), t, .25, .1)
    elif ty == 'zip': add(buf, zip_(e.get('dur', .4)), t, .18, .1)
    elif ty == 'zipback': add(buf, zipback(), t, .3, 0)
    elif ty == 'clunk': add(buf, clunk(), t, .5, -.1)
    elif ty == 'buzzer': add(buf, buzzer(), t, .3, 0)
    elif ty == 'stamp': add(buf, thump(1, 70), t, .4, 0)
    elif ty == 'tick': add(buf, tick(), t, .2, .2)
    elif ty == 'slide': add(buf, slide(), t, .25, 0)
    elif ty == 'ding': add(buf, ding(), t, .22, .2)
    elif ty == 'cheer': add(buf, cheer(), t, .15, .2)
    elif ty == 'thwack': add(buf, thump(1, 110), t, .5, 0); add(buf, clack(1.2, 1), t, .4, 0); add(buf, pop(), t + .02, .2, 0)

# —— bed: a quiet room, a radio far off, a clock (not in the WRONG silence) ——
bed = lp(brown(DUR + .3), 600) * .03
add(buf, bed, 0, 1, -.2); add(buf, bed[::-1].copy(), 0, 1, .2)
for t in np.arange(.5, DUR, 1.0):
    if 6.0 < t < 6.6: continue
    add(buf, hp(clack(5.0, .3), 2500), t, .03, .5)

buf += vbuf
for c in range(2): buf[:, c] = limit(buf[:, c], .62)   # headroom: the master adds about +2 dB to reach −14 LUFS
sf.write(os.path.join(OUT, 'mix.wav'), buf, SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(buf) / SR:.1f}s, peak {np.abs(buf).max():.2f}')
