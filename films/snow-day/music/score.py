# Snow Day — original score, 120 BPM, D major: marimba pulse, pizzicato bass, sleigh bells, glockenspiel/xylophone hook, horns.
# Tape-stops into silence at the two real-time drops; timpani roll into the ram; the bell releases the full theme. No final cadence (the film loops).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
S.seed(4)
X = .125
CH = {'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E']}
PROG = ['D', 'Bm', 'G', 'A']
def chord_at(t): return PROG[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
R1, R2, BELL = (14.5, 18.5), (27.5, 29.5), 29.5
def layers(t):
    if R1[0] <= t < R1[1] or R2[0] <= t < R2[1]: return set()
    if t < 4: return {'mar', 'bass', 'sleigh'}
    if t < 14.5: return {'mar', 'bass', 'sleigh', 'glock', 'xyl'}
    if t < 27.5: return {'mar', 'bass', 'sleigh', 'xyl', 'brass', 'snare'} if t >= 22 else {'mar', 'bass', 'sleigh', 'xyl', 'glock'}
    return {'mar', 'bass', 'sleigh', 'xyl', 'glock', 'brass', 'hornpad'}
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
HOOK = [4, None, 5, 4, 2, None, 3, None, 4, None, 5, 6, 5, None, None, None]
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .56 if b16 == 0 else .38, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .75, 0, .9)
    if 'sleigh' in L and b16 in (0, 2): N_(t, 'sleighbells', None, None, .32 if b16 == 0 else .2, .35, .3)
    if 'glock' in L and bar16 in (0, 6, 10): N_(t, 'glockenspiel', n(c, 2 + bar16 % 3, 5), .4, .38, .3, .5)
    if 'xyl' in L and t >= 4 and HOOK[bar16] is not None: N_(t, 'xylophone', n(c, HOOK[bar16], 5), .3, .5, .3, .55)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .7, 0, .5) for k in (0, 1, 2)]
    if 'snare' in L and b16 == 2 and (i16 // 4) % 2 == 1: N_(t, 'snare', 'on', None, .4, .2, .4)
    if 'hornpad' in L and bar16 == 0: [N_(t, 'horn', n(c, k, 3), 1.9, .5, 0, .38) for k in (0, 1, 2)]
    t = round(t + X, 6)
# the stuck plough: a low bowed note under the spin, timpani roll into the ram, crash + horns on the burst
N_(14.6, 'vibraphone_bowed', 'A4', 1.6, .3, 0, .4)
for k in range(8): N_(ev('ram')[0] - .45 + k * .0625, 'timpani', 'A2', None, .25 + k * .06, 0, .5)
N_(ev('burst')[0], 'crash', None, None, .55, 0, .5); [N_(ev('burst')[0], 'horn_stac', p, .4, .8, 0, .55) for p in ('D3', 'A3', 'F#4')]
# the last two seconds before eight: a held bowed note; the bell releases a horn chord + crash
N_(27.6, 'vibraphone_bowed', 'E5', 1.8, .32, 0, .4)
N_(BELL, 'crash', None, None, .5, 0, .45); [N_(BELL, 'horn', p, 1.6, .65, 0, .45) for p in ('D3', 'A3', 'D4', 'F#4')]
for k, p in enumerate(['D5', 'F#5', 'A5', 'D6']): N_(BELL + k * .125, 'glockenspiel', p, 1.0, .45, -.2 + k * .13, .5)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
for t0 in (R1[0], R2[0]): tapestop(t0 - .4, t0); mix[int(t0 * SR):int((t0 + .08) * SR)] *= 0
mix = S.room(mix, size=.4, mix=.18)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes', sorted({x[1] for x in notes}))
