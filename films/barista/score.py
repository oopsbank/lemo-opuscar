# Original score for "You Are a Barista": a café bossa in F (4/4, crotchet = 120, bar = 2 s) with upright bass, nylon guitar, vibes,
# shaker and brushes. Frantic for the eruption, a tape stop for the rewind, the easy morning groove, double time for the rush, a
# pompous walking bass for the Customer, a rising drone as the knob goes to MAX, a frantic minor groove for the flood, a drone under
# the Manager, a game-over jingle, and the groove again, cut mid-phrase for the loop.
# Synthesized + physically modelled strings. Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 44.4; N = int(DUR * SR); E8 = .25
rng = np.random.default_rng(9)
mus = np.zeros((N, 2)); cues = []
def place(x, at, g=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= N: return
    if s < 0: x = x[-s:]; s = 0
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); n = min(len(x), N - s)
    mus[s:s + n, 0] += x[:n] * g * l * 1.414; mus[s:s + n, 1] += x[:n] * g * r * 1.414
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def recorder(m, d, v=.8):
    d = max(d, .08); x = t_(d + .12); f = hz(m)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.2 * x) * np.clip((x - .15) / .2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    tone = np.sin(ph) + .18 * np.sin(2 * ph) + .12 * np.sin(3 * ph) + .03 * np.sin(4 * ph)
    breath = bp(noise(len(x) / SR), f * .9, min(f * 3.5, 15000)) * .06
    env = np.clip(x / .025, 0, 1) * np.clip((d - x) / .06 + 1, 0, 1); env[x > d + .06] = 0
    chiff = np.exp(-x / .015) * bp(noise(len(x) / SR), 2000, 8000) * .25
    return (tone + breath) * env * v + chiff * v * .5
def reed(m, d, v=.8):           # bassoon-ish: buzzy pulse through a nasal formant
    d = max(d, .08); x = t_(d + .1); f = hz(m); ph = (f * x) % 1
    raw = np.where(ph < .32, 1.0, -.47) + .3 * np.sin(2 * np.pi * f * x)
    y = bp(raw, 120, 2400) + bp(raw, 420, 700) * .8
    env = np.clip(x / .03, 0, 1) * np.clip((d - x) / .05 + 1, 0, 1); env[x > d + .05] = 0
    return norm(y) * env * v
def guitar(m, d=1.2, v=.7): return PL.pluck('acoustic_guitar', m, d, vel=v)
def strum(ms, d=1.0, v=.6): return PL.strum('acoustic_guitar', ms, d, vel=v, spread=.018)
def pizz(m, d=.6, v=.8): return PL.pluck('upright_bass_pizz', m, d, vel=v)
def harp(m, d=2.5, v=.6): return PL.pluck('harp', m, d, vel=v)
def celesta(m, d=1.6, v=.6): return PL.pluck('music_box', m, d, vel=v)
def drum(kind='low', v=.8):
    if kind == 'low':
        x = t_(.35); f = 95 * np.exp(-x / .08) + 58
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .12) + lp(noise(.35), 900) * np.exp(-x / .02) * .4) * v
    x = t_(.18); return (bp(noise(.18), 900, 5000) * np.exp(-x / .025) + np.sin(2 * np.pi * 320 * x) * np.exp(-x / .03) * .4) * v * .7
def tamb(v=.5): x = t_(.25); return hp(noise(.25), 6000) * (np.exp(-x / .05) + .3 * np.exp(-((x - .03) / .02) ** 2)) * v
def pad(ms, d, v=.3):          # soft bowed strings: detuned saws, slow swell; nothing below MIDI 50
    x = t_(d + .6); y = np.zeros(len(x))
    for m in ms:
        for det in (-.07, 0, .06):
            f = hz(m + det); y += 2 * ((f * x + rng.random()) % 1) - 1
    y = lp(y, 1800); env = np.clip(x / .9, 0, 1) * np.clip((d + .6 - x) / .6, 0, 1)
    return y / len(ms) * env * v
def drone(m, d, v=.5):         # one held low bowed note with harmonics so it speaks on small speakers
    x = t_(d); f = hz(m); y = sum(a * np.sin(2 * np.pi * f * k * x + k) for k, a in [(1, 1), (2, .55), (3, .35), (4, .18), (5, .1)])
    y *= 1 + .08 * np.sin(2 * np.pi * 4.5 * x); return lp(y, 1400) * np.clip(x / 1.2, 0, 1) * np.clip((d - x) / .5, 0, 1) * v


def horn(m, d, v=.6, bend=0.0):
    x = t_(d + .15); f = hz(m) * (1 + bend * x / d) * (1 + .006 * np.sin(2 * np.pi * 5 * x)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .7), (3, .5), (4, .3), (5, .18), (6, .1)])
    env = np.clip(x / .06, 0, 1) * np.clip((d + .15 - x) / .15, 0, 1); return lp(y, 1800) * env * v
def vpizz(m, v=.6): return PL.pluck('upright_bass_pizz', m, .35, vel=v)      # pizzicato "violins": the bass model, high
def handdrum(v=.6): x = t_(.3); f = 180 * np.exp(-x / .05) + 120; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .09) + bp(noise(.3), 400, 3000) * np.exp(-x / .015) * .4) * v


def nylon(ms, d=.5, v=.5): return PL.strum('nylon_guitar', ms, d, vel=v, spread=.012)
def vibes(m, d=1.0, v=.5):
    x = PL.pluck('music_box', m, d, vel=v); tt = np.arange(len(x)) / SR; return x * (1 + .25 * np.sin(2 * np.pi * 5.5 * tt))
def shaker(v=.25): x = t_(.09); return bp(noise(.09), 5000, 12000) * np.exp(-((x - .03) / .02) ** 2) * v
def brush(v=.35): x = t_(.3); return bp(noise(.3), 1500, 7000) * (np.clip(x / .05, 0, 1) * np.exp(-x / .12)) * v
def rim(v=.4): x = t_(.08); return (bp(noise(.08), 1500, 6000) * np.exp(-x / .01) + np.sin(2 * np.pi * 1700 * x) * np.exp(-x / .015) * .5) * v
def square(m, d, v=.4):
    x = t_(d); f = hz(m); y = np.sign(np.sin(2 * np.pi * f * x)) * .6 + np.sign(np.sin(2 * np.pi * f * 2 * x)) * .15
    return lp(y, 3500) * np.clip(x / .005, 0, 1) * np.clip((d - x) / .04, 0, 1) * v

# —— the groove: Fmaj7 · Dm9 · Gm7 · C9 ——
CH = [[53, 57, 60, 64], [53, 57, 60, 64], [55, 58, 62, 65], [52, 55, 58, 62]]
ROOT = [41, 38, 43, 36]
MEL = [[(0, 76, .5), (2, 77, .3), (3, 79, .5), (6, 76, .5)], [(0, 74, .5), (3, 77, .5), (5, 72, .3), (6, 74, .7)], [(0, 74, .7), (3, 77, .5), (6, 79, .5)], [(0, 76, .5), (2, 72, .3), (4, 70, .5), (6, 72, .7)]]
def groove(t0, bars, start=0, v=1.0, mel=True, frantic=False, stop=None, thin=False, minor=False):
    for b in range(bars):
        tb = t0 + b * 2.0; k = (start + b) % 4; cues.append(round(tb, 4))
        def ok(at): return stop is None or at < stop - 1e-6
        r = ROOT[k]; ch = [c - (1 if minor and i == 1 else 0) for i, c in enumerate(CH[k])]
        pat = [(0, r), (2, r + 12), (3, r + 7), (4, r), (6, r + 7)] if frantic else [(0, r), (3, r + 7), (4, r + 12), (7, r + 7)]
        for o, m in pat:
            if ok(tb + o * E8): place(pizz(m, .45, .8 * v), tb + o * E8, .9, -.05)
        if not thin:
            for o in ([0, 3, 6] if b % 2 == 0 else [1, 3, 5]):
                if ok(tb + o * E8): place(nylon(ch, .3, .5 * v), tb + o * E8 - .008, .55, -.3)
        for s16 in range(16):
            at = tb + s16 * E8 / 2
            if ok(at) and (frantic or s16 % 2 == 0): place(shaker(.22 if s16 % 4 == 0 else .14), at, .5 * v, .35)
        for o in ([0, 4] if frantic else [0]):
            if ok(tb + o * E8): place(drum('low', .7 if frantic else .4), tb + o * E8, .5 * v)
        for o in [2, 6] if frantic else [3, 6]:
            if ok(tb + o * E8): place(rim(.35) if frantic else rim(.22), tb + o * E8, .45 * v, .2)
        if mel:
            for (o, m, d) in MEL[k]:
                if ok(tb + o * E8): place(vibes(m - (1 if minor and m % 12 in (9, 4) else 0) + (12 if frantic else 0), d + .3, .45), tb + o * E8, .5 * v, .3)
def stab(at, ms=(65, 69, 72, 77), v=.5):
    for m in ms: place(horn(m, .22, v), at, .45)
    place(drum('low', .9), at, .7)

# 0.0–1.2: the eruption: frantic, a horn stab on frame 0 (the hiss is in the mix); the tape stop at the rewind
stab(0.0, (65, 69, 72, 77), .5); groove(0.0, 1, 0, frantic=True, stop=1.2, v=.9)
# 1.5–9.5: the easy morning (the cup insert gets a vibes sting)
groove(1.5, 4, 0, v=.85)
place(vibes(84, .6, .5), 6.0, .5)
# 9.5–13.0: the rush: double time
groove(9.5, 2, 0, frantic=True, stop=13.0)
for t in [10.0, 11.0, 12.0, 12.5]: place(horn(77, .14, .35), t, .4, -.2)
# 13.5–19.5: the Customer: a pompous walking bass and a single horn per bar
for k in range(13): place(pizz([41, 45, 48, 50, 48, 45, 43, 41, 45, 48, 52, 53, 52][k], .45, .75), 13.5 + k * .5, .9)
for t, m in [(13.5, 65), (15.5, 64), (17.5, 62)]: place(horn(m, .8, .32), t, .4); cues.append(t)
# 20.0–24.0: tension: a drone that rises, a ticking clock on the beat; MAX at 21.5 is a stab
place(drone(29, 4.0, .3), 20.0, .55)
for k in range(8): place(rim(.25), 20.0 + k * .5, .4, .3)
stab(21.5, (60, 63, 66, 69), .45); cues.append(21.5)
for k in range(4): place(square(64 + k, .2, .18), 22.0 + k * .5, .4, .2)
# 24.0–30.5: the flood: frantic minor, horns
stab(24.0, (53, 60, 65, 68), .55)
groove(24.0, 3, 0, frantic=True, stop=30.5, minor=True)
for t in [25.0, 26.0, 27.0, 28.0, 29.0, 29.5, 30.0]: place(horn(72 if t % 1 == 0 else 77, .14, .35), t, .4, -.2)
# 32.0: SPLASH, a falling horn; a drone under the Manager
stab(32.0, (41, 48, 51, 54), .55); place(horn(60, .8, .4, bend=-.5), 32.1, .45); cues.append(32.0)
place(drone(29, 3.8, .33), 32.6, .6)
# 36.5: the game-over jingle
for k, (m, d) in enumerate([(72, .4), (71, .4), (70, .4), (69, 1.2)]): place(square(m, d, .4), 36.5 + k * .5, .55)
place(pizz(29, 2.0, .8), 38.0, .8); place(square(53, 1.0, .25), 38.0, .4); place(square(57, 1.0, .2), 38.0, .35)
cues += [36.5, 38.5]
# 39.5 → the end: the groove again (warm), cut mid-phrase so it loops into the eruption
groove(39.5, 3, 0, v=.85)
# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
