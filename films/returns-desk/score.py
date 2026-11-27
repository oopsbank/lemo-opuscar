# Original score for "You Are a Returns Desk Clerk": a perky shop-floor bossa-pop in C (4/4, crotchet = 120, bar = 2 s) with upright
# bass, nylon guitar, shaker, rim and a music-box tune. A stab on every big hit; a pizzicato tiptoe for the Cat; a rising run as
# the receipt unrolls, stopped dead by "1998"; double time with horns for the queue; a drone under the Manager; a game-over
# jingle; the groove again, cut mid-phrase for the loop.
# Synthesized + physically modelled strings. Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 34.5; N = int(DUR * SR); E8 = .25
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

# —— the groove: Cmaj7 · Am7 · Dm7 · G7 ——
CH = [[52, 55, 59, 60], [52, 55, 57, 60], [53, 57, 60, 62], [53, 55, 59, 62]]
ROOT = [36, 33, 38, 31]
MEL = [[(0, 76, .5), (2, 79, .3), (3, 76, .5), (6, 72, .5)], [(0, 74, .5), (3, 72, .5), (5, 69, .3), (6, 72, .7)], [(0, 74, .7), (3, 77, .5), (6, 76, .5)], [(0, 74, .5), (2, 71, .3), (4, 67, .5), (6, 71, .7)]]
def groove(t0, bars, start=0, v=1.0, mel=True, frantic=False, stop=None, thin=False):
    for b in range(bars):
        tb = t0 + b * 2.0; k = (start + b) % 4; cues.append(round(tb, 4))
        def ok(at): return stop is None or at < stop - 1e-6
        r = ROOT[k]
        pat = [(0, r), (2, r + 12), (3, r + 7), (4, r), (6, r + 7)] if frantic else [(0, r), (3, r + 7), (4, r), (7, r + 7)]
        for o, m in pat:
            if ok(tb + o * E8): place(pizz(m, .45, .8 * v), tb + o * E8, .9, -.05)
        if not thin:
            for o in ([0, 3, 5] if b % 2 == 0 else [2, 4, 7]):
                if ok(tb + o * E8): place(nylon(CH[k], .3, .5 * v), tb + o * E8 - .008, .55, -.3)
        for s16 in range(16):
            at = tb + s16 * E8 / 2
            if ok(at) and (frantic or s16 % 2 == 0): place(shaker(.22 if s16 % 4 == 0 else .14), at, .5 * v, .35)
        for o in ([0, 4] if frantic else []):
            if ok(tb + o * E8): place(drum('low', .7), tb + o * E8, .5 * v)
        for o in [2, 6]:
            if ok(tb + o * E8): place(rim(.35) if frantic else brush(.3), tb + o * E8, .45 * v, .2)
        if mel:
            for (o, m, d) in MEL[k]:
                if ok(tb + o * E8): place(vibes(m + (12 if frantic else 0), d + .3, .45), tb + o * E8, .5 * v, .3)
def stab(at, ms=(60, 64, 67, 72), v=.5):
    for m in ms: place(horn(m, .22, v), at, .45)
    place(drum('low', .9), at, .7)

# 0.0: SLAM. A stab; the music proper starts with the narration
stab(0.0, (60, 63, 66, 72), .5); cues.append(0.0)
groove(2.0, 3, 0, stop=8.0)
for k, m in enumerate([72, 69, 65, 60]): place(square(m, .1, .3), 5.0 + k * .11, .45)   # the patience drains
# 7.9–8.5: the Cat tiptoes (pizzicato), a gulp at the bite; "?!"
for k in range(5): place(vpizz(79 - (k % 2) * 3, .45), 7.9 + k * .125, .5, .3)
place(square(84, .08, .25), 8.5, .4); place(square(72, .12, .25), 8.6, .4)
# 9.5: the refund: a bright arpeggio, then the groove, thin under the Dad
for k, m in enumerate([72, 76, 79, 84, 88]): place(vibes(m, .8, .45), 9.5 + k * .05, .5, .2)
cues.append(9.5)
groove(10.0, 1, 0, v=.75, thin=True, mel=False)
# 12.0–13.5: the receipt unrolls: a rising chromatic run, accelerating; 13.5 "1998": stab, silence
at, k = 12.0, 0
while at < 13.45:
    place(vpizz(60 + k, .5), at, .5, -.2 + (k % 5) * .1); k += 1; at += max(.05, .16 - k * .006)
stab(13.5, (61, 64, 67, 70), .55); cues.append(13.5)
groove(14.0, 1, 2, v=.7, thin=True, mel=False, stop=16.5)
for m, d in [(74, .3), (71, .6)]: place(vibes(m, d + .3, .4), 14.5 + (0 if m == 74 else .5), .45)
# 16.5–20.0: the queue: double time with horn stabs on the beats
groove(16.5, 2, 0, frantic=True, stop=20.0)
for t in [16.5, 17.0, 17.5, 18.5, 19.0, 19.5]: place(horn(72 if t % 1 == .5 else 76, .14, .35), t, .4, -.2)
place(horn(79, .4, .45), 19.75, .45)
# 20.5: the avalanche: a low hit and a falling horn
stab(20.5, (48, 55, 58, 61), .55); place(horn(67, .8, .4, bend=-.5), 20.6, .45); cues.append(20.5)
# 21.5: the pop (in the mix). 22.0–25.9: a held low note under the Manager
place(drone(31, 3.9, .35), 22.0, .6); cues.append(22.0)
# 26.0: GAME OVER: a descending square-wave jingle and a low thud chord
for k, (m, d) in enumerate([(72, .4), (71, .4), (70, .4), (69, 1.2)]): place(square(m, d, .4), 26.0 + k * .5, .55)
place(pizz(29, 2.0, .8), 27.5, .8); place(square(53, 1.5, .25), 27.5, .4); place(square(57, 1.5, .2), 27.5, .35)
cues += [26.0, 28.0]
# 30.5 → the end: the groove again, cut mid-phrase so it loops into the slam
groove(30.5, 2, 0, v=.9)
# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
