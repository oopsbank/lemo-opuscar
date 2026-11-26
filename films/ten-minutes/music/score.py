# Ten Minutes — original score, 120 BPM, D major. A scooter motif on marimba + xylophone; each obstacle adds its own colour;
# the parade is played by the band itself (diegetic, in real time) while the score is silent; silence for the slow-motion jump.
# → out/score.wav (48 kHz stereo)
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
S.seed(21)
B = .5; X = B / 4
CH = {'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E']}
PROG = ['D', 'Bm', 'G', 'A']
def chord_at(t): return PROG[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'

REAL0, REAL1, JUMP0, JUMP1, STOP = 19.5, 23.5, 31.6, 33.0, 41.0
def layers(t):
    if t < 2.2 or REAL0 <= t < REAL1 or JUMP0 <= t < JUMP1 or t >= STOP: return set()
    L = {'mar', 'bass'}
    if t < 3.0: return {'mar'}
    if 3.0 <= t < 9.0: L |= {'xyl', 'kal', 'shk'}
    elif 9.0 <= t < 14.0: L |= {'pizz', 'wood'}
    elif 14.0 <= t < 19.5: L |= {'brass', 'wood'}
    elif 23.5 <= t < 30.0: L |= {'xyl', 'wood', 'kal', 'glock'}
    elif 30.0 <= t < 31.6: L = {'bass'}
    elif 33.0 <= t < 34.3: L |= {'xyl', 'wood', 'glock'}
    elif t >= 34.3: L |= {'vib'}            # rain: softer
    return L

notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
MEL = [4, None, 3, 4, 5, None, 4, 2, 3, None, 2, 3, 4, None, None, None]   # xylophone hook (scale degrees in the chord)
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    soft = .75 if t >= 34.3 else 1.0
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, (.6 if b16 == 0 else .42) * soft, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .75, 0, .9)
    if 'xyl' in L and MEL[bar16] is not None: N_(t, 'xylophone', n(c, MEL[bar16], 5), .3, .55, .3, .65)
    if 'kal' in L and b16 == 2: notes.append((round(t, 4), '__kal', n(c, 1 + (i16 // 4) % 2, 5), .9, .5, .45, .5))
    if 'shk' in L and b16 in (1, 3): N_(t, 'shaker', 'down' if b16 == 1 else 'up', None, .35, -.4, .4)
    if 'wood' in L: N_(t, 'woodblock', 'a' if b16 == 0 else 'c', None, .45 if b16 == 0 else .18, -.35, .4)
    if 'pizz' in L and b16 in (0, 2): N_(t, 'violins_pizz', n(c, [2, 4, 3, 5][(i16 // 2) % 4], 4), .3, .6, .2, .7)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .75, 0, .6) for k in (0, 1, 2)]; N_(t, 'tuba_stac', n(c, 0, 2), .4, .7, 0, .6) if bar16 == 0 else None
    if 'glock' in L and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .4, .3, .6)
    if 'vib' in L and b16 == 0 and (i16 // 4) % 2 == 0: N_(t, 'vibraphone', n(c, 1, 4), 1.2, .45, .2, .7); N_(t, 'vibraphone', n(c, 2, 4), 1.2, .4, -.2, .6)
    t = round(t + X, 6)

# beats in the run: crate, dog, U-turn
N_(ev('crate')[0], 'timpani', 'A2', None, .5, .2, .5)
for tt in ev('bark'): N_(np.ceil(tt / X) * X, 'violins_pizz', 'A5', .2, .55, .3, .5)
N_(ev('skid')[0], 'horn_stac', 'D3', .4, .8, 0, .6)
# the band (diegetic, real time 19.5–23.5): march in D — snare, bass drum, tuba oom-pah, trumpets
for k in range(int((REAL1 - REAL0) / X)):
    tt = REAL0 + k * X; b16 = k % 4
    if b16 in (0, 2): N_(tt, 'snare', 'on', None, .5 if b16 == 0 else .35, .25, .5)
    if b16 == 3: N_(tt, 'snare', 'on', None, .25, .25, .35)
    if b16 == 0 and (k // 4) % 2 == 0: N_(tt, 'bass_drum', None, None, .6, .2, .55)
    if b16 == 0: N_(tt, 'tuba_stac', 'D2' if (k // 4) % 2 == 0 else 'A1', .35, .7, .2, .6)
TRP = ['D5', 'F#5', 'A5', 'A5', 'B5', 'A5', 'F#5', 'D5', 'E5', 'G5', 'F#5', 'E5', 'D5', 'D5', 'A4', 'D5']
for k, p in enumerate(TRP): N_(REAL0 + k * .25, 'trumpet_stac', p, .22, .55, .3, .5)
# the band goes past at ×18 (23.5–24.3): a quick high blip of the same tune
for k, p in enumerate(TRP[:8]): N_(REAL1 + k * .07, 'xylophone', p.replace('5', '6').replace('4', '5'), .1, .4, .5, .4)
N_(ev('go')[0] if False else 24.45, 'crash', None, None, .4, 0, .4)
# bridge: timpani roll into the take-off, silence in the air, crash + horns on landing
for k in range(16): N_(30.6 + k * .0625, 'timpani', 'D3', None, .25 + k * .03, 0, .5)
N_(JUMP1, 'crash', None, None, .6, 0, .55); N_(JUMP1, 'timpani', 'D3', None, .8, 0, .7)
for p in ['D3', 'A3', 'D4', 'F#4']: N_(JUMP1, 'horn', p, 1.0, .75, 0, .55)
N_(JUMP0 + .02, 'vibraphone_bowed', 'A5', 1.35, .35, 0, .5)
# arrival: cadence, then the rainbow
N_(41.5, 'horn', 'D3', 3, .55, 0, .5); N_(41.5, 'horn', 'A3', 3, .5, 0, .5); N_(41.5, 'horn', 'F#4', 3, .5, 0, .45)
for k, p in enumerate(['D5', 'F#5', 'A5', 'D6']): N_(41.5 + k * .125, 'vibraphone', p, 2.5, .5, -.2 + k * .13, .7)
for k, p in enumerate(['A5', 'B5', 'C#6', 'D6', 'E6', 'F#6', 'A6']): N_(ev('rainbow')[0] + k * .09, 'glockenspiel', p, 1.5, .45, .4 - k * .1, .55)

sampled = [x for x in notes if x[1] != '__kal']
mix = S.render(sampled, dur=DUR + 1, master=False)
for (tt, _, p, d, v, pan, g) in [x for x in notes if x[1] == '__kal']: add(mix, P.pluck('kalimba', p, d, vel=v), tt, g * .9, pan)
mix = S.room(mix, size=.35, mix=.15)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
names = sorted({x[1] for x in sampled}); json.dump(names, open(os.path.join(HERE, '../out/score_instruments.json'), 'w'))
print('score', len(notes), 'notes', names)
