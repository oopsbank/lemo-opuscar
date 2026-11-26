# The Phantom Jam — original score, 120 BPM. D minor while the jam grows, D major when the ambulance gets through.
# Native technique: every car that comes to a stop triggers a low pizzicato note, so the jam is heard as it grows.
# Tape-stops into the two real-time moments; no final cadence (the film loops).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
ARR = ev('arrive')[0]
S.seed(6)
X = .125
CH = {'Dm': ['D', 'F', 'A'], 'Bb': ['A#', 'D', 'F'], 'Gm': ['G', 'A#', 'D'], 'A': ['A', 'C#', 'E'], 'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D']}
def chord_at(t): return (['D', 'Bm', 'G', 'A'] if t >= ARR else ['Dm', 'Bb', 'Gm', 'A'])[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
REAL = [(7.0, 11.0), (25.4, ARR)]
def layers(t):
    if any(a <= t < b for a, b in REAL): return set()
    if t < 7: return {'mar', 'bass'}
    if t < 17: return {'mar', 'bass', 'wood', 'xyl'}
    if t < 25.4: return {'mar', 'bass', 'wood', 'xyl', 'brass'}
    return {'mar', 'bass', 'xyl', 'glock'}
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
HOOK = [4, None, 3, 4, 2, None, 3, None, 4, None, 2, 3, 1, None, None, None]
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .55 if b16 == 0 else .38, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .7, 0, .85)
    if 'wood' in L: N_(t, 'woodblock', 'a' if b16 == 0 else 'c', None, .4 if b16 == 0 else .14, -.35, .35)
    if 'xyl' in L and HOOK[bar16] is not None: N_(t, 'xylophone', n(c, HOOK[bar16], 5), .3, .48, .3, .55)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .65, 0, .5) for k in (0, 1, 2)]
    if 'glock' in L and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .4, .3, .5)
    t = round(t + X, 6)
# every car that stops: a low pizzicato note, quantized to the sixteenth (quiet in real time)
for tt in ev('stop'):
    q = round(tt / X) * X; c = chord_at(q)
    N_(q, 'cellos_pizz', n(c, int(q * 7) % 3, 3), .3, .45 if not any(a <= q < b for a, b in REAL) else .25, .2, .5)
# the decision (real time): a held, bowed note
N_(7.1, 'vibraphone_bowed', 'A4', 3.6, .35, 0, .45)
N_(25.5, 'vibraphone_bowed', 'D5', ARR - 25.5, .35, 0, .45)
# through: horn chord + glockenspiel run in D major
N_(ARR, 'crash', None, None, .45, 0, .4); [N_(ARR, 'horn', p, 1.8, .65, 0, .45) for p in ('D3', 'A3', 'D4', 'F#4')]
for k, p in enumerate(['D5', 'F#5', 'A5', 'D6']): N_(ARR + k * .125, 'glockenspiel', p, 1.0, .45, -.2 + k * .13, .5)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
for t0 in (7.0, 25.4): tapestop(t0 - .4, t0)
mix = S.room(mix, size=.35, mix=.15)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes', sorted({x[1] for x in notes}))
