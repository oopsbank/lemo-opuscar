# Original score for "You Are a Pizza Delivery Guy": a tarantella in 6/8 (A minor → A major), synthesized + physically
# modelled strings. Grid: dotted-quarter = 120 (eighth = 1/6 s, bar = 1 s). Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 61.0; N = int(DUR * SR); E8 = 1 / 6
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

# —— the tune (D major, 6/8): bars of (eighth offset, length in eighths, MIDI) ——
def mando(m, d=.3, v=.6, trem=False): return PL.pluck('pipa', m, max(d, .25), vel=v, trem=14 if trem else None) if trem else PL.pluck('pipa', m, max(d, .25), vel=v)
def horn(m, d, v=.6, bend=0.0):
    x = t_(d + .15); f = hz(m) * (1 + bend * x / d) * (1 + .006 * np.sin(2 * np.pi * 5 * x)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .7), (3, .5), (4, .3), (5, .18), (6, .1)])
    env = np.clip(x / .06, 0, 1) * np.clip((d + .15 - x) / .15, 0, 1); return lp(y, 1800) * env * v

# —— the tune: bars of (eighth offset, length in eighths, MIDI), A harmonic minor ——
TUNE = [
    [(0, 1, 69), (1, 1, 72), (2, 1, 76), (3, 1, 81), (4, 1, 76), (5, 1, 72)],
    [(0, 1, 71), (1, 1, 74), (2, 1, 76), (3, 1, 80), (4, 1, 76), (5, 1, 74)],
    [(0, 1, 72), (1, 1, 76), (2, 1, 81), (3, 1, 84), (4, 1, 83), (5, 1, 81)],
    [(0, 1, 80), (1, 1, 76), (2, 1, 71), (3, 3, 76)],
    [(0, 1, 69), (1, 1, 72), (2, 1, 76), (3, 1, 81), (4, 1, 76), (5, 1, 72)],
    [(0, 1, 74), (1, 1, 77), (2, 1, 81), (3, 1, 86), (4, 1, 81), (5, 1, 77)],
    [(0, 1, 76), (1, 1, 80), (2, 1, 83), (3, 1, 88), (4, 1, 86), (5, 1, 83)],
    [(0, 1, 81), (1, 1, 76), (2, 1, 72), (3, 3, 69)],
]
CHORDS = ['Am', 'E', 'Am', 'E', 'Am', 'Dm', 'E', 'Am']
CH = {'Am': [57, 60, 64], 'E': [56, 59, 64], 'Dm': [57, 62, 65], 'A': [57, 61, 64], 'D': [57, 62, 66]}
ROOT = {'Am': 45, 'E': 40, 'Dm': 50, 'A': 45, 'D': 50}
MAJ = {0: 1, 5: 6, 7: 8}   # C→C#, F→F#, G→G# (A major)
major = lambda m: m + (MAJ[m % 12] - m % 12 if m % 12 in MAJ else 0)

def tarantella(t0, bars, start_bar=0, mv=.5, drums=True, tamb_every=3, stop=None, bassv=.75, band=True):
    for b in range(bars):
        tb = t0 + b * 6 * E8; cues.append(round(tb, 4)); bar = (start_bar + b) % len(TUNE)
        for (o, ln, m) in TUNE[bar]:
            at = tb + o * E8
            if stop is not None and at >= stop: continue
            place(mando(m, ln * E8 * 1.6, mv, trem=ln > 1), at, .9, .2)
        if not band: continue
        ch = CHORDS[bar]
        if stop is None or tb < stop: place(pizz(ROOT[ch], .5, bassv), tb, .9, -.05)
        if stop is None or tb + 3 * E8 < stop:
            place(strum(CH[ch], 2 * E8, .5), tb + 3 * E8 - .01, .5, -.25); place(pizz(ROOT[ch] + 7, .4, bassv * .7), tb + 3 * E8, .7, -.05)
        if drums:
            for k in range(6):
                at = tb + k * E8
                if stop is not None and at >= stop: break
                if k == 0: place(drum('low', .85), at, .65)
                elif k == 3: place(drum('slap', .7), at, .55, .1)
                if k % tamb_every == 0 or tamb_every == 1: place(tamb(.55 if k % 3 == 0 else .3), at, .5, .3)

# 3.0 → 18.5: the run (stops dead on the splat); the dog chase from 8.0 adds every-eighth tambourine
tarantella(3.0, 5, 0, .45, drums=False, band=True)
tarantella(8.0, 11, 5, .5, tamb_every=1, stop=18.5)
place(mando(93, .4, .7), 18.5, .6, .3)                     # a single high pluck: the splat
# 22.5 → 27.0: a soft guitar vamp, riding on
for b in range(5):
    tb = 22.5 + b; ch = ['Am', 'E', 'Am', 'E', 'Am'][b]
    if tb < 27.0: place(pizz(ROOT[ch], .5, .55), tb, .7); place(strum(CH[ch], .3, .35), tb + .5, .35, -.2)
cues.extend([22.5, 23.5, 24.5, 25.5, 26.5])
# 28.5 → 32.0: the ghost: a low drone + music-box whole-tone arpeggios
place(drone(38, 3.6, .4), 28.5, .8)
for i, m in enumerate([86, 90, 94, 98, 94, 90, 86, 82, 86, 90, 94, 98]): place(celesta(m, 1.0, .5), 28.5 + i * E8 * 1.5, .4, .4 * np.sin(i))
cues.append(28.5)
# 32.0 → 35.0: the flee — full band, double-time tambourine
tarantella(32.0, 3, 0, .55, tamb_every=1)
# 35.0 → 39.0: hesitant pizzicato as you walk up and knock; a harp ding when the porch lamp comes on
for i, m in enumerate([45, 48, 52, 48, 45, 48, 52, 55]): place(pizz(m, .4, .5), 35.0 + i * .5, .7, .15 * (-1) ** i)
place(harp(81, 2.0, .5), 38.0, .5, .3); cues.extend([35.0, 36.0, 37.0, 38.0])
# 39.0: LATE — a descending horn, wah-wah
for i, (m, d) in enumerate([(57, .45), (56, .45), (55, .45), (54, 1.3)]): place(horn(m, d, .6, -.04 if i == 3 else 0), 39.0 + i * .5, .8, -.1)
cues.append(39.0)
# under the bear: one low pluck per line
place(pizz(40, 1.0, .5), 41.0, .6); place(pizz(45, 1.0, .5), 44.0, .6)
# 50.0 → 56.0: the finale in A major: harp + recorder + soft mandolin tremolo; title chord on 56.0
for b, bar in enumerate([0, 1, 2, 3, 6, 7]):
    tb = 50.0 + b; cues.append(tb); ch = {'Am': 'A', 'Dm': 'D'}.get(CHORDS[bar], CHORDS[bar])
    for (o, ln, m) in TUNE[bar]:
        place(recorder(major(m) - 12, ln * E8 * .95, .38), tb + o * E8, .9, .15)
    for k, c in enumerate(CH[ch]): place(harp(c + 12, 1.6, .42), tb + k * .05, .55, -.25)
    place(pizz(ROOT[ch], .9, .55), tb, .75)
    place(mando(major(TUNE[bar][0][2]), .9, .35, trem=True), tb, .35, .3)
cues.append(56.0)
for k, c in enumerate([45, 52, 57, 61, 64, 69, 73, 76, 81]): place(harp(c, 4.5, .5), 56.0 + k * .055, .6, -.3 + k * .07)
place(pad([57, 61, 64, 69], 4.4, .28), 56.0, 1)
place(mando(81, 3.0, .4, trem=True), 56.05, .45, .2)
place(pizz(33 + 12, 2.5, .7), 56.0, .9)

# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
