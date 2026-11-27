# Police Chase — original score, 144 BPM, D minor: driving pizzicato-bass ostinato, marimba sixteenths, woodblock and timpani
# hits, stopped-horn stabs; a tape-stop into the slow-mo crossing; a held tension chord as the bridge rises; the drive cuts out
# at the stop, horns land on "caught", a calm glockenspiel tag for the ferry.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
SLOW, RES, STOP, HANDS, FERRY, BELL = ev('slow')[0], ev('resume')[0], ev('stop')[0], ev('hands')[0], ev('ferry')[0], ev('bell')[0]
S.seed(21)
X = 60 / 144 / 4
CH = {'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'C': ['C', 'E', 'G'], 'A': ['A', 'C#', 'E'], 'Gm': ['G', 'Bb', 'D'], 'F': ['F', 'A', 'C']}
def chord_at(t): return (['Dm', 'Bb', 'C', 'A'] if t < BELL else ['Gm', 'Dm', 'A', 'A'])[int(t // (16 * X)) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
t = .3
while t < STOP - .05:
    if SLOW <= t < RES: t = round(t + X, 6); continue
    c = chord_at(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    N_(t, 'contrabass_pizz', n(c, 0, 2), .2, .75 if b16 == 0 else .5, 0, .9)
    N_(t, 'marimba', n(c, [0, 2, 1, 2][b16] + (i16 // 8) % 2, 4), .15, .42 if b16 == 0 else .28, -.25)
    if b16 == 2: N_(t, 'woodblock', 'c', None, .3, .3, .35)
    if bar16 in (0, 6, 12): N_(t, 'horn_stac', n(c, 0, 3), .3, .6, 0, .5); N_(t, 'horn_stac', n(c, 2, 3), .3, .5, 0, .4)
    if bar16 in (0, 8): N_(t, 'timpani', n(c, 0, 2), None, .55, 0, .5)
    t = round(t + X, 6)
N_(.05, 'timpani', 'D2', None, .8, 0, .7); N_(.05, 'crash', None, None, .35, .2, .35)
N_(SLOW + .05, 'vibraphone_bowed', 'A4', RES - SLOW, .3, 0, .42); N_(SLOW + .05, 'cellos_pizz', 'D2', .8, .5, 0, .5)
N_(BELL, 'vibraphone_bowed', 'G#4', 3.0, .25, 0, .35)
N_(STOP, 'timpani', 'A1', None, .85, 0, .7); N_(STOP, 'crash', None, None, .3, 0, .3)
N_(STOP + 1.2, 'vibraphone_bowed', 'D4', HANDS - STOP - 1.2, .25, 0, .35)
[N_(HANDS, 'horn', p, 2.0, .6, 0, .45) for p in ('D3', 'A3', 'F4', 'D4')]; N_(HANDS, 'timpani', 'D2', None, .7, 0, .6)
for k, p in enumerate(['A5', 'F5', 'D5', 'A4', 'D5', 'F5']): N_(FERRY + .1 + k * .3, 'glockenspiel', p, .8, .34, -.2 + k * .08, .4)
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
tapestop(SLOW - .35, SLOW)
mix = S.room(mix, size=.4, mix=.16)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes')
