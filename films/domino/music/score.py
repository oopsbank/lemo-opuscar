# Domino — original score, no words: a sunny toy-town waltz-pop at 112 BPM (marimba, pizzicato, glockenspiel, woodblock) for the
# calm open; each link of the chain adds a layer and a step up in tempo feel (horn stabs, timpani); a held breath while the pipes
# roll; full chaos for the pile-up and the ball rain; total silence for the 4 s hold; a tiny music-box tag for the pigeon; then black.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
T = {e['type']: e['t'] for e in E['ev'] if e['type'] not in ('cam', 'postHit', 'bump')}
S.seed(5)
X = 60 / 112 / 4
CH = {'C': ['C', 'E', 'G'], 'F': ['F', 'A', 'C'], 'G': ['G', 'B', 'D'], 'Am': ['A', 'C', 'E'], 'Dm': ['D', 'F', 'A'], 'E': ['E', 'G#', 'B']}
def chord_at(t): return (['C', 'Am', 'F', 'G'] if t < T['brake'] else ['Dm', 'Am', 'E', 'E'])[int(t // (16 * X)) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
quiet = [(T['fall'], T['splat']), (T['launch'], T['launch'] + .6), (T['hold0'], T['hold1'] + 3.0), (T['black'], DUR)]
t = 0.0
while t < DUR - 1e-6:
    if any(a <= t < b for a, b in quiet): t = round(t + X, 6); continue
    c = chord_at(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    lvl = 0 if t < T['splat'] else 1 if t < T['cab'] else 2 if t < T['brake'] else 3
    if b16 == 0 or (lvl >= 2 and b16 == 2): N_(t, 'contrabass_pizz', n(c, 0, 2), .4, .7, 0, .8)
    if bar16 % 2 == 0 or lvl >= 1: N_(t, 'marimba', n(c, [0, 2, 1, 2][b16] + (i16 // 8) % 2, 4), .2, .45 if b16 == 0 else .3, -.2)
    if b16 == 2: N_(t, 'woodblock', 'c', None, .22 + .06 * lvl, .3, .3)
    if bar16 in (0, 6, 10): N_(t, 'glockenspiel', n(c, [2, 1, 0][[0, 6, 10].index(bar16)], 5), .3, .3, .35, .4)
    if lvl >= 2 and bar16 in (0, 8): [N_(t, 'horn_stac', n(c, k, 3), .3, .55, 0, .45) for k in (0, 2)]
    if lvl >= 3 and b16 == 0: N_(t, 'timpani', n(c, 0, 2), None, .5, 0, .45)
    if lvl >= 3 and bar16 in (2, 5, 11, 14): N_(t, 'xylophone', n(c, bar16 % 3, 5), .2, .4, .4, .5)
    t = round(t + X, 6)
# hits on the chain's links
for k, (p, v) in {'splat': ('C2', .7), 'hydrant': ('G1', .7), 'cab': ('D2', .5), 'smash': ('A1', .9), 'cakeHit': ('D2', .8)}.items(): N_(T[k], 'timpani', p, None, v, 0, .6)
N_(T['smash'], 'crash', None, None, .4, 0, .4); N_(T['cakeHit'], 'crash', None, None, .3, .2, .3)
N_(T['fall'], 'vibraphone_bowed', 'G4', T['splat'] - T['fall'], .25, 0, .35)
# the pigeon's tag: a little music box run
for k, p in enumerate(['E6', 'C6', 'G5', 'E5', 'G5']): N_(T['look'] + .3 + k * .28, 'glockenspiel', p, .7, .3, -.2 + k * .1, .38)
mix = S.render(notes, dur=DUR + 1, master=False)
mix = S.room(mix, size=.45, mix=.2)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes')
