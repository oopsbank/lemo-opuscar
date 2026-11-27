# Storm Surge — original score, 120 BPM. A minor pulse that gains a layer with every gate shut; each gate lands a timpani + low horn hit.
# Tape-stops into the two real-time stretches; in the last one the music drops out (a bowed note only), then A major horns when the wall holds.
# No final cadence (the film loops).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e for e in E['ev'] if e['type'] == ty]
SHUT = sorted(e['t'] for e in ev('gate_shut')); IMPACT = ev('impact')[0]['t']; HELD = IMPACT + .8
S.seed(11)
X = .125
CH = {'Am': ['A', 'C', 'E'], 'F': ['F', 'A', 'C'], 'Dm': ['D', 'F', 'A'], 'E': ['E', 'G#', 'B'], 'A': ['A', 'C#', 'E'], 'D': ['D', 'F#', 'A'], 'F#m': ['F#', 'A', 'C#']}
def chord_at(t): return (['A', 'F#m', 'D', 'E'] if t >= 34 else ['Am', 'F', 'Dm', 'E'])[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
REAL = [(8.0, 10.6), (26.0, 34.0)]
def layers(t):
    if any(a <= t < b for a, b in REAL): return set()
    k = sum(1 for s in SHUT if s <= t)
    if t >= 34: return {'mar', 'bass', 'glock'}
    L = {'mar', 'bass'}
    if k >= 1: L |= {'wood'}
    if k >= 2: L |= {'cello'}
    if k >= 3 or t >= 21: L |= {'brass'}
    return L
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .55 if b16 == 0 else .36, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .72, 0, .85)
    if 'wood' in L: N_(t, 'woodblock', 'a' if b16 == 0 else 'c', None, .4 if b16 == 0 else .13, -.35, .35)
    if 'cello' in L and b16 == 2: N_(t, 'cellos_pizz', n(c, 2, 3), .3, .5, .25, .55)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .62, 0, .5) for k in (0, 1, 2)]
    if 'glock' in L and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .38, .3, .45)
    t = round(t + X, 6)
# each gate shut: a timpani hit and a low horn on the chord root
for s in SHUT[:3]:
    c = chord_at(s); N_(s, 'timpani', 'A2', None, .8, 0, .7); N_(s, 'horn', n(c, 0, 2), 1.2, .6, 0, .45)
# the real-time stops: held bowed notes; the last gate's slow close rises a step
N_(8.1, 'vibraphone_bowed', 'E5', 2.4, .32, 0, .4)
N_(26.1, 'vibraphone_bowed', 'E5', 2.0, .3, 0, .4); N_(28.1, 'vibraphone_bowed', 'F5', 1.9, .32, 0, .42)
N_(SHUT[3], 'timpani', 'A2', None, .9, 0, .8); N_(SHUT[3], 'vibraphone_bowed', 'G#5', IMPACT - SHUT[3], .3, 0, .4)
# impact: crash + timpani; it held: A major horns, glockenspiel
N_(IMPACT, 'timpani', 'E2', None, 1.0, 0, .9); N_(IMPACT, 'crash', None, None, .5, 0, .45)
[N_(HELD, 'horn', p, 2.4, .62, 0, .45) for p in ('A2', 'E3', 'A3', 'C#4')]
for k, p in enumerate(['A5', 'C#6', 'E6', 'A6']): N_(HELD + .3 + k * .125, 'glockenspiel', p, 1.0, .42, -.2 + k * .13, .45)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
for t0 in (8.0, 26.0): tapestop(t0 - .4, t0)
mix = S.room(mix, size=.4, mix=.18)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes', sorted({x[1] for x in notes}))
