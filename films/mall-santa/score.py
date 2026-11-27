# Original score for "You Are a Mall Santa": a bright swing-pop in G (4/4, crotchet = 120, bar = 2 s) with upright bass, nylon guitar,
# music box (as glockenspiel), shaker and synthesized sleigh bells. It stops for the camera flash, wobbles in minor for the crying
# chain, comes back for the presents, goes pompous for the Customer, dies at the plug, double time for the reindeer chase, a drone
# under the Manager, a game-over jingle, and the groove again, cut mid-phrase for the loop.
# Synthesized + physically modelled strings. Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 41.7; N = int(DUR * SR); E8 = .25
rng = np.random.default_rng(9)
mus = np.zeros((N, 2)); cues = []
def place(x, at, g=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= N: return
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

# —— the groove: Gmaj7 · Em7 · Am7 · D7 ——
CH = [[55, 59, 62, 66], [55, 59, 62, 64], [57, 60, 64, 67], [57, 60, 62, 66]]
ROOT = [43, 40, 45, 38]
MEL = [[(0, 79, .5), (2, 83, .3), (3, 81, .5), (6, 79, .5)], [(0, 76, .5), (3, 79, .5), (5, 74, .3), (6, 76, .7)], [(0, 77, .7), (3, 81, .5), (6, 79, .5)], [(0, 78, .5), (2, 74, .3), (4, 72, .5), (6, 74, .7)]]
def bells(v=.3):   # sleigh bells: a cluster of tiny inharmonic jingles
    d = .25; x = t_(d); y = np.zeros(len(x))
    for f in (5200, 6300, 7400, 8800): y += np.sin(2 * np.pi * f * x + rng.random() * 6) * np.exp(-x / (.03 + rng.random() * .04))
    return y * v * .25 + hp(noise(d), 7000) * np.exp(-x / .03) * v * .3
def groove(t0, bars, start=0, v=1.0, mel=True, frantic=False, stop=None, thin=False, minor=False):
    for b in range(bars):
        tb = t0 + b * 2.0; k = (start + b) % 4; cues.append(round(tb, 4))
        def ok(at): return stop is None or at < stop - 1e-6
        r = ROOT[k] - (0 if not minor else 0); ch = [c - (1 if minor and i == 1 else 0) for i, c in enumerate(CH[k])]
        pat = [(0, r), (2, r + 12), (3, r + 7), (4, r), (6, r + 7)] if frantic else [(0, r), (3, r + 7), (4, r), (7, r + 7)]
        for o, m in pat:
            if ok(tb + o * E8): place(pizz(m, .45, .8 * v), tb + o * E8, .9, -.05)
        if not thin:
            for o in ([0, 3, 5] if b % 2 == 0 else [2, 4, 7]):
                if ok(tb + o * E8): place(nylon(ch, .3, .5 * v), tb + o * E8 - .008, .55, -.3)
        for s16 in range(16):
            at = tb + s16 * E8 / 2
            if ok(at) and (frantic or s16 % 2 == 0): place(bells(.3) if s16 % 4 == 2 else shaker(.22 if s16 % 4 == 0 else .14), at, .5 * v, .35)
        for o in ([0, 4] if frantic else []):
            if ok(tb + o * E8): place(drum('low', .7), tb + o * E8, .5 * v)
        for o in [2, 6]:
            if ok(tb + o * E8): place(rim(.35) if frantic else brush(.3), tb + o * E8, .45 * v, .2)
        if mel:
            for (o, m, d) in MEL[k]:
                if ok(tb + o * E8): place(vibes(m - (1 if minor and m % 12 in (11, 4) else 0) + (12 if frantic else 0), d + .3, .45), tb + o * E8, .5 * v, .3)
def stab(at, ms=(67, 71, 74, 79), v=.5):
    for m in ms: place(horn(m, .22, v), at, .45)
    place(drum('low', .9), at, .7)

# 0.0: the yank (the boing and thwack are in the mix); the music enters with the wide shot
cues.append(0.0)
groove(1.5, 2, 0, stop=5.0, v=.9)
for at, m in [(5.0, 79), (5.5, 79), (6.0, 79)]: place(vibes(m, .3, .5), at, .55)   # the countdown
place(vibes(91, .8, .5), 6.5, .5); cues.append(6.5)
for k, m in enumerate([76, 75, 74, 73]): place(vibes(m, .5, .35), 7.0 + k * .4, .45)   # the toddler's sad slide
# 9.0–12.4: the crying chain: a minor wobble that builds
groove(9.0, 2, 1, v=.85, minor=True, stop=12.5, thin=True)
for k in range(13): place(square(64 + (k % 3), .12, .18 + k * .01), 9.0 + k * .25, .4, .2)
# 12.5–16.4: the sack: the groove back, a harp gliss at JOY MAX
groove(12.5, 2, 0, v=1.0)
for k, m in enumerate([67, 71, 74, 79, 83, 86]): place(harp(m, 1.6, .45), 15.5 + k * .045, .5, -.2 + k * .08)
cues.append(15.5)
# 16.5–20.0: the Customer: a pompous walking bass and a single horn
for k in range(7): place(pizz([43, 47, 50, 52, 50, 47, 45][k], .45, .75), 16.5 + k * .5, .9)
place(horn(67, .8, .35), 17.0, .4); place(horn(66, .8, .35), 18.5, .4); cues.append(16.5)
# 20.0: the plug: the music dies. 21.5: a servo drone; 22.0 a horn stab as it rears
place(drone(31, 1.6, .3), 20.4, .5); stab(22.0, (62, 66, 69, 74), .55); cues.append(22.0)
# 22.5–28.5: the chase: double time with bells and horns
groove(22.5, 3, 0, frantic=True, stop=28.5)
for t in [23.0, 24.0, 25.0, 26.0, 27.0, 27.5, 28.0]: place(horn(74 if t % 1 == 0 else 79, .14, .35), t, .4, -.2)
# 28.5: TIMBER: a low hit and a falling horn
stab(28.5, (43, 50, 53, 56), .55); place(horn(62, .8, .4, bend=-.5), 28.6, .45); cues.append(28.5)
place(drone(31, 3.6, .33), 29.2, .6); cues.append(29.0)
# 32.8 — not on a bar: the game-over jingle starts on the beat at 33.0
for k, (m, d) in enumerate([(72, .4), (71, .4), (70, .4), (69, 1.2)]): place(square(m, d, .4), 33.0 + k * .5, .55)
place(pizz(31, 2.0, .8), 34.5, .8); place(square(55, 1.0, .25), 34.5, .4); place(square(59, 1.0, .2), 34.5, .35)
cues += [33.0, 35.0]
# 35.5 → the end: the groove again (warm), cut mid-phrase so it loops into the yank
groove(36.0, 3, 0, v=.85)
# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
