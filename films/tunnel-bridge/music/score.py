# Tunnel or Bridge? — original score, 132 BPM, D minor/F major race: marimba ostinato, pizzicato bass, woodblock;
# blue's motif on glockenspiel, orange's on stopped horns. Tape-stops into the real-time bridge wait and the slow-mo finish;
# a reversed swell under each rewind; no final cadence (the film loops).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
FINA = ev('finA')[-1]; SLOW = ev('slow')[0]; REAL = ev('real')[0]; GO = ev('bgo')[0]
S.seed(12)
X = 60 / 132 / 4
CH = {'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'F': ['F', 'A', 'C'], 'C': ['C', 'E', 'G'], 'Gm': ['G', 'Bb', 'D'], 'A': ['A', 'C#', 'E']}
def chord_at(t):
    prog = ['Dm', 'Bb', 'F', 'C'] if t < REAL or t >= GO else ['Gm', 'Dm', 'A', 'A']
    return prog[int(t // (16 * X)) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
quiet = [(0, .4), (1.6, 3.2), (REAL, REAL + 4.0), (SLOW, SLOW + 1.8), (34.25, DUR)]
t = .4
while t < DUR - 1e-6:
    if any(a <= t < b for a, b in quiet): t = round(t + X, 6); continue
    c = chord_at(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    k = [0, 2, 1, 2][b16] + (1 if (i16 // 8) % 2 else 0)
    N_(t, 'marimba', n(c, k, 4), .2, .5 if b16 == 0 else .32, -.2)
    if b16 in (0, 3) and bar16 != 15: N_(t, 'contrabass_pizz', n(c, 0, 2), .5, .7, 0, .85)
    if b16 == 2: N_(t, 'woodblock', 'c', None, .22, -.35, .3)
    if bar16 in (0, 6, 10): N_(t, 'glockenspiel', n(c, [2, 1, 0][[0, 6, 10].index(bar16)], 5), .3, .32, .4, .45)      # blue
    if bar16 in (4, 12, 14): N_(t, 'horn_stac', n(c, [0, 2, 1][[4, 12, 14].index(bar16)], 3), .35, .5, -.3, .5)        # orange
    if t > 23 and bar16 in (0, 8): N_(t, 'timpani', n(c, 0, 2), None, .45, 0, .45)
    t = round(t + X, 6)
# the wait at the bridge: a bowed vibraphone pedal; the slow-mo: a held cluster; the win: a glock run, a horn stab
N_(REAL + .05, 'vibraphone_bowed', 'A4', 3.6, .3, 0, .42); N_(REAL + 1.8, 'vibraphone_bowed', 'D5', 2.0, .28, 0, .4)
N_(SLOW + .05, 'vibraphone_bowed', 'E5', 1.8, .32, 0, .44); N_(SLOW + .05, 'cellos_pizz', 'A2', .6, .5, 0, .5)
N_(FINA, 'crash', None, None, .35, .3, .35); N_(FINA, 'timpani', 'D2', None, .7, 0, .6)
for k, p in enumerate(['D5', 'F5', 'A5', 'D6']): N_(FINA + .1 + k * X, 'glockenspiel', p, .8, .42, -.2 + k * .13, .45)
[N_(FINA + .02, 'horn', p, 1.6, .55, 0, .42) for p in ('D3', 'A3', 'F4')]
N_(3.2, 'timpani', 'A1', None, .6, 0, .55)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
for a in (REAL, SLOW): tapestop(a - .4, a)
# rewinds: the music just before, played backwards and fast
for a, b in ((1.6, 2.6), (34.25, DUR)):
    i0, i1 = int(a * SR), int(b * SR); L = i1 - i0; src = mix[max(0, i0 - 3 * L):i0][::-1]
    if len(src) > 10: idx = np.linspace(0, len(src) - 1, L); mix[i0:i1] = np.stack([np.interp(idx, np.arange(len(src)), src[:, c]) for c in range(2)], 1) * np.linspace(1, .3, L)[:, None] * .8
mix = S.room(mix, size=.4, mix=.18)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes')
