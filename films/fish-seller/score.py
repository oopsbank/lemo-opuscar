# Original score for "You Are a Fish Seller": a small harbour jig in 6/8 (D major), synthesized + physically modelled strings.
# Grid: dotted-quarter = 90 (eighth = 2/9 s, bar = 4/3 s); the chase runs at dotted-quarter = 120 (eighth = 1/6 s, bar = 1 s).
# Writes out/music.wav (stereo, 48 kHz) and out/music_cues.json (section starts and every downbeat, for the cue check).
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 60.0; N = int(DUR * SR)
E90 = 2 / 9; E120 = 1 / 6          # eighth-note lengths
rng = np.random.default_rng(5)
mus = np.zeros((N, 2)); cues = []
def place(x, at, g=1.0, pan=0.0):
    s = int(round(at * SR));
    if s >= N: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); n = min(len(x), N - s)
    mus[s:s + n, 0] += x[:n] * g * l * 1.414; mus[s:s + n, 1] += x[:n] * g * r * 1.414
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# —— instruments ——
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

# —— the tune (D major, 6/8): bars of (eighth offset, length in eighths, MIDI) ——
A, D, E, Fs, G, B = 69, 62, 64, 66, 67, 71
TUNE = [
    [(0, 2, A), (2, 1, D + 12), (3, 2, Fs + 12), (5, 1, D + 12)],      # 1
    [(0, 2, E + 12), (2, 1, Fs + 12), (3, 2, G + 12), (5, 1, E + 12)],  # 2
    [(0, 2, Fs + 12), (2, 1, A + 12), (3, 2, B + 12), (5, 1, A + 12)],  # 3
    [(0, 2, G + 12), (2, 1, E + 12), (3, 3, D + 12)],                   # 4
    [(0, 2, A), (2, 1, D + 12), (3, 2, Fs + 12), (5, 1, A + 12)],       # 5
    [(0, 2, G + 12), (2, 1, Fs + 12), (3, 2, E + 12), (5, 1, Fs + 12)], # 6
    [(0, 2, E + 12), (2, 1, 73), (3, 3, D + 12)],                 # 7
]
CHORDS = ['D', 'A', 'D', 'G', 'D', 'G', 'A']   # per bar (bar 7 resolves at the next downbeat)
CH = {'D': [50, 57, 62, 66], 'A': [45, 57, 61, 64], 'G': [43, 55, 59, 62], 'Bm': [47, 54, 59, 62], 'Em': [40, 55, 59, 64]}
ROOT = {'D': 38, 'A': 45, 'G': 43, 'Bm': 47, 'Em': 40}

def jig(t0, bars, eighth, mel='recorder', mv=.55, band=True, drums=True, oct=0, stop=None, tambo=False, bassv=.8):
    for b in range(bars):
        tb = t0 + b * 6 * eighth; cues.append(round(tb, 4))
        for (o, ln, m) in TUNE[b % len(TUNE)]:
            at = tb + o * eighth; d = ln * eighth * (.92 if mel == 'recorder' else .55)
            if stop is not None and at >= stop: continue
            if mel == 'recorder': place(recorder(m + oct, d, mv), at, 1, .18)
            else: place(reed(m + oct, d, mv), at, 1, .15)
        if not band: continue
        ch = CHORDS[b % len(CHORDS)]
        place(pizz(ROOT[ch], 6 * eighth * .9, bassv), tb, .9, -.05)
        place(strum(CH[ch][1:], 3 * eighth, .5), tb + 3 * eighth, .55, -.25)
        place(guitar(CH[ch][1] + 12, 2 * eighth, .4), tb + eighth * 1, .25, -.3)
        if drums:
            place(drum('low', .9), tb, .7, 0); place(drum('slap', .7), tb + 3 * eighth, .6, .1); place(drum('slap', .45), tb + 5 * eighth, .5, .1)
        if tambo:
            for k in range(6): place(tamb(.5 if k % 3 == 0 else .3), tb + k * eighth, .45, .3)

# —— sections (seconds; all on the grid) ——
# R1: 4.0 → 13.333 (7 bars), stops dead on the theft
jig(4.0, 7, E90, 'recorder', .5, stop=13.333)
place(celesta(86, 1.5, .5), 4.0, .4, .3)
# sting on the theft: a recorder squeak up + nothing
place(recorder(86, .12, .6), 13.333, .8, .2)
# R2: 16.0 → 25.333 (7 bars): the grandma's version: bassoon an octave down, pizzicato, softer drum; stops into the stare
jig(16.0, 7, E90, 'reed', .5, oct=-12, drums=True, bassv=.7)
place(celesta(81, 1.5, .5), 16.0, .4, .3)
# after she leaves: three sad pizzicato steps down (27.333, 28.0, 28.667)
for i, m in enumerate([62, 61, 59]): place(pizz(m - 12, .6, .7), 27.333 + i * 2 / 3, .9)
place(pizz(55 - 12, 1.2, .7), 29.333 - 2 / 9, .0)
# R3: 29.333 → 36.0 (5 bars): creeping pizzicato in B minor, celesta when the eye opens
cues.extend([29.333, 30.667, 32.0, 33.333, 34.667])
creep = [47, 50, 54, 50, 47, 50, 53, 50, 47, 52, 55, 52, 47, 50, 54, 59, 58, 57, 56, 55]
for i, m in enumerate(creep): place(pizz(m, .45, .65 if i % 4 == 0 else .45), 29.333 + i * 3 * E90, .9, -.1 if i % 2 else .1)
for i, m in enumerate([83, 86, 90, 95]): place(celesta(m, 1.2, .55), 34.0 + i * .08, .45, .35)
# chase: 36.0 → 40.0 (4 bars at 120), full band + tambourine, stops on the splash
jig(36.0, 4, E120, 'recorder', .55, tambo=True, stop=40.0, bassv=.9)
# reveal: one held low note from the turn, under the gull and the grandma
place(drone(38, 6.5, .45), 42.0, .8)
place(pizz(50, .8, .6), 43.333, .6); place(pizz(57, .8, .55), 45.333, .55)
# rule IV card: a harp statement of bar 1
cues.append(48.0)
for i, (o, ln, m) in enumerate(TUNE[0]): place(harp(m, 1.8, .55), 48.0 + o * E90, .7, .2)
place(harp(50, 2.5, .5), 48.0, .6, -.2)
# finale: 50.667 → 54.667, warm and broad (harp + recorder + strings), into the title chord
for b, bar in enumerate([0, 2, 3]):
    tb = 50.667 + b * 6 * E90; cues.append(round(tb, 4))
    for (o, ln, m) in TUNE[bar]: place(recorder(m, ln * E90 * .95, .45), tb + o * E90, 1, .15)
    ch = CHORDS[bar]
    place(pad([c for c in CH[ch] if c >= 50] + [CH[ch][-1] + 12], 6 * E90, .28), tb, 1, 0)
    for k, c in enumerate(CH[ch]): place(harp(c + 12, 2.0, .45), tb + k * .06, .55, -.25)
    place(pizz(ROOT[ch], 6 * E90, .6), tb, .8)
TT = 54.667; cues.append(TT)
for k, c in enumerate([50, 57, 62, 66, 69, 74, 78, 81, 86]): place(harp(c, 4.5, .55), TT + k * .055, .6, -.3 + k * .07)
place(pad([62, 66, 69, 74], 4.6, .3), TT, 1)
place(recorder(74, 2.6, .4), TT + .1, .8, .15)
place(pizz(38, 2.5, .7), TT, .9)
place(celesta(93, 2.5, .45), TT + .5, .35, .3)

# —— small room reverb on the music bus ——
L = int(1.1 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .32)[:, None]; ir[:int(.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = mus + wet * .22
out = hp(out.T, 35).T
out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
