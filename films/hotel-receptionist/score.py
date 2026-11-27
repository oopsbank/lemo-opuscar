# Original score for "You Are a Hotel Receptionist": a lobby bossa in F (4/4, crotchet = 120, bar = 2 s) with upright bass,
# nylon guitar comping, shaker and brushes and a vibraphone tune; it stops dead at the brick wall, goes soft and romantic in
# room 7, frantic for the tour group, silent for the goat, a game-over jingle, and the bossa again, cut mid-phrase for the loop.
# Synthesized + physically modelled strings. Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 42.5; N = int(DUR * SR); E8 = .25
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

# —— the bossa: four bars Fmaj7 · Gm7 · C7 · Fmaj7 (bass root/fifth on the bossa pattern, guitar on the syncopations) ——
CH = [[53, 57, 60, 64], [55, 58, 62, 65], [52, 55, 58, 60], [53, 57, 60, 64]]
ROOT = [41, 43, 36, 41]
MEL = [[(0, 69, .7), (3, 72, .5), (5, 69, .3), (6, 67, .5)], [(0, 70, .7), (3, 74, .5), (6, 72, .7)], [(0, 70, .5), (2, 67, .5), (4, 64, .5), (6, 67, .7)], [(0, 65, 1.2), (5, 69, .3), (6, 72, .5)]]
def bossa(t0, bars, start=0, v=1.0, mel=True, frantic=False, stop=None, thin=False):
    for b in range(bars):
        tb = t0 + b * 2.0; k = (start + b) % 4; cues.append(round(tb, 4))
        def ok(at): return stop is None or at < stop - 1e-6
        r = ROOT[k]
        for o, m in [(0, r), (3, r + 7), (4, r), (7, r + 7)]:
            if ok(tb + o * E8): place(pizz(m, .5, .75 * v), tb + o * E8, .9, -.05)
        if not thin:
            for o in ([0, 3, 5] if b % 2 == 0 else [2, 4, 7]):
                if ok(tb + o * E8): place(nylon(CH[k], .35, .5 * v), tb + o * E8 - .008, .55, -.3)
        for s16 in range(16):
            at = tb + s16 * E8 / 2
            if ok(at) and (frantic or s16 % 2 == 0): place(shaker(.22 if s16 % 4 == 0 else .14), at, .5 * v, .35)
        for o in [2, 6]:
            if ok(tb + o * E8): place(brush(.3), tb + o * E8, .45 * v, .2)
        for o in [3, 6] if frantic else [3]:
            if ok(tb + o * E8): place(rim(.35), tb + o * E8, .4 * v, .25)
        if mel:
            for (o, m, d) in MEL[k]:
                if ok(tb + o * E8): place(vibes(m + (12 if frantic else 0), d + .3, .45), tb + o * E8, .5 * v, .3)
def chime(at, v=.5):   # the lift chime: the motif, at every banner
    place(vibes(84, 1.2, v), at, .55, .3); place(vibes(79, 1.6, v * .9), at + .25, .55, .3)

# 0–2: only the bell (in the mix). 2.0–6.0: bossa A, stopping dead at the brick wall
bossa(2.0, 2, 0, stop=6.0)
chime(4.0)
# 6.0: the wall. A descending "boop" at 6.5 with the patience bar
for k, m in enumerate([72, 69, 65, 60]): place(square(m, .11, .3), 6.5 + k * .12, .5)
cues.append(6.0)
# 8.5: the painting goes up: a harp gliss up to a held major chord
for k, m in enumerate([65, 69, 72, 77, 81, 84]): place(harp(m, 2.0, .45), 8.5 + k * .045, .5, -.2 + k * .08)
cues.append(8.5)
# 10.5: "Acceptable." a tiny two-note shrug; 11.5 the bossa back for the XP, thinned under the phone
place(vibes(77, .5, .4), 10.5, .45); place(vibes(76, .8, .35), 11.0, .45)
place(vibes(89, .6, .5), 11.5, .5, .2); place(vibes(96, .8, .4), 11.62, .45, .2)
bossa(11.5, 2, 0, v=.8, thin=True, mel=False, stop=15.5)
# 15.5–22.5: room 7: harp arpeggios and a pad in Bb (the honeymoon), with a deadpan stop for every MEH
HONEY = [[58, 62, 65, 69], [55, 58, 62, 65], [60, 64, 67, 70], [53, 57, 60, 65]]
for b in range(4):
    tb = 15.5 + b * 2.0 - (0 if b == 0 else 0); cues.append(round(tb, 4))
    ch = HONEY[b]
    for q in range(8):
        at = tb + q * E8
        if any(abs(at - s) < .01 or (at > s and at < s + .5) for s in (17.0, 20.0)): continue
        if at >= 22.5 - 1e-6: continue
        place(harp(ch[q % 4] + (12 if q >= 4 else 0), 1.4, .35), at, .45, -.3 + .15 * (q % 4))
    place(pad([c + 12 for c in ch[:3]], 1.8, .16), tb, 1)
# 22.5: the bus horn (in the mix) + a horn stab; 23.0–30.5 the frantic bossa
place(horn(65, .3, .5), 22.5, .6); place(horn(69, .3, .4), 22.5, .5)
chime(23.0)
bossa(23.0, 4, 0, frantic=True, stop=30.5)
for t in [24.0, 25.0, 26.0, 27.0, 28.0]: place(horn(72, .14, .35), t, .4, -.2)
# 30.5: the crunch. Silence. 31.5: a held low note under the Manager
place(drone(29, 2.6, .35), 31.5, .6); cues.append(31.5)
# 34.0: GAME OVER: a descending square-wave jingle and a low thud chord
for k, (m, d) in enumerate([(72, .4), (71, .4), (70, .4), (69, 1.2)]): place(square(m, d, .4), 34.0 + k * .5, .55)
place(pizz(29, 2.0, .8), 35.5, .8); place(square(53, 1.5, .25), 35.5, .4); place(square(57, 1.5, .2), 35.5, .35)
cues += [34.0, 36.0]
# 38.5: "You're hired." 38.5 → the end: the bossa again, cut mid-phrase (no final cadence) so it loops into the bell
bossa(38.5, 2, 2, v=.9)
# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
