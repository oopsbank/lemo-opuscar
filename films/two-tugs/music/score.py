# Two Tugs — original score, 120 BPM, G major, nautical: marimba pulse, pizzicato bass, a tuba-and-horn "tug" motif that answers
# red (high, xylophone) and blue (low, cellos) as they pull. Tape-stops into both real-time stretches; horns + glockenspiel when it stops.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e for e in E['ev'] if e['type'] == ty]
STOP = ev('stop')[0]['t']; SNAP = ev('snap')[0]['t']
PULL = sorted((e['t'], e['r'], e['b']) for e in ev('pull'))
pull = lambda t: min(PULL, key=lambda p: abs(p[0] - t))
S.seed(8)
X = .125
CH = {'G': ['G', 'B', 'D'], 'Em': ['E', 'G', 'B'], 'C': ['C', 'E', 'G'], 'D': ['D', 'F#', 'A'], 'Am': ['A', 'C', 'E']}
def chord_at(t): return (['G', 'Em', 'C', 'D'] if t < 11.5 or t >= STOP else ['Em', 'C', 'Am', 'D'])[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
REAL = [(11.5, 13.0), (21.5, 26.5)]
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if any(a <= t < b for a, b in REAL): t = round(t + X, 6); continue
    _, r, b = pull(t)
    k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .52 if b16 == 0 else .34, -.25)
    if b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .72, 0, .85)
    if b16 == 2: N_(t, 'woodblock', 'c', None, .2, -.35, .3)
    if r > 30 and bar16 in (0, 3, 6, 10): N_(t, 'xylophone', n(c, [2, 1, 2, 0][[0, 3, 6, 10].index(bar16)], 5), .3, .3 + .25 * r / 100, .45, .55)
    if b > 30 and bar16 in (8, 11, 14): N_(t, 'cellos_pizz', n(c, [0, 2, 1][[8, 11, 14].index(bar16)], 3), .3, .35 + .3 * b / 100, -.45, .6)
    if t >= 17 and bar16 in (0, 8): [N_(t, 'horn_stac', n(c, k, 3), .4, .62, 0, .45) for k in (0, 1, 2)]
    if t >= STOP and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .38, .3, .45)
    t = round(t + X, 6)
N_(SNAP, 'timpani', 'D2', None, .8, 0, .7); N_(SNAP, 'crash', None, None, .35, .3, .35)
N_(REAL[0][0] + .05, 'vibraphone_bowed', 'B4', 1.4, .3, 0, .4)
N_(REAL[1][0] + .1, 'vibraphone_bowed', 'D5', 2.0, .3, 0, .42); N_(REAL[1][0] + 2.1, 'vibraphone_bowed', 'E5', STOP - REAL[1][0] - 2.1, .32, 0, .44)
N_(STOP, 'timpani', 'G2', None, .7, 0, .6); [N_(STOP, 'horn', p, 2.2, .62, 0, .45) for p in ('G2', 'D3', 'G3', 'B3')]
for k, p in enumerate(['G5', 'B5', 'D6', 'G6']): N_(STOP + .3 + k * .125, 'glockenspiel', p, 1.0, .42, -.2 + k * .13, .45)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
for a, _ in REAL: tapestop(a - .4, a)
mix = S.room(mix, size=.4, mix=.18)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes')
