# Not In Our Town — original score, 120 BPM. D minor under the threat, D major from the hit.
# Tuned percussion pulse (marimba, xylophone, glockenspiel, bowed vibraphone), pizzicato bass, horns, timpani;
# a synthesized "theremin" for the saucer; a tape-stop into silence when real time arrives; silence in the slow-motion hit.
# → out/score.wav (48 kHz stereo)
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, add, t_

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
S.seed(9)
X = .125   # a sixteenth at 120 BPM
CH = {'Dm': ['D', 'F', 'A'], 'Bb': ['A#', 'D', 'F'], 'Gm': ['G', 'A#', 'D'], 'A': ['A', 'C#', 'E'],
      'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D']}
MINOR, MAJOR = ['Dm', 'Bb', 'Gm', 'A'], ['D', 'Bm', 'G', 'A']
MAJ0 = 30.0
def chord_at(t): return (MAJOR if t >= MAJ0 else MINOR)[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'

def layers(t):
    if 2.5 <= t < 8.0 or 28.5 <= t < 30.0 or 30.0 <= t < 35.0: return set()
    if t < 2.5: return {'mar', 'bass'}
    if t < 15.0: return {'mar', 'bass', 'wood'}
    if t < 19.0: return {'mar', 'bass', 'brass', 'snare'}
    if t < 25.0: return {'mar', 'bass', 'xyl', 'brass', 'snare', 'glock'}
    if t < 28.5: return {'mar', 'bass', 'xyl', 'snare'}
    return {'mar', 'bass', 'xyl', 'glock', 'wood', 'hornpad'}   # the win (35–40)

notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
HOOK = [4, None, 3, 4, 5, None, 4, 2, 3, None, 2, 3, 4, None, None, None]
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .58 if b16 == 0 else .4, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .75, 0, .9)
    if 'wood' in L: N_(t, 'woodblock', 'a' if b16 == 0 else 'c', None, .4 if b16 == 0 else .15, -.35, .35)
    if 'xyl' in L and HOOK[bar16] is not None: N_(t, 'xylophone', n(c, HOOK[bar16], 5), .3, .52, .3, .6)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .72, 0, .55) for k in (0, 1, 2)]
    if 'snare' in L and b16 == 2 and (i16 // 4) % 2 == 1: N_(t, 'snare', 'on', None, .45, .2, .45)
    if 'snare' in L and t >= 19 and b16 in (1, 3): N_(t, 'snare', 'on', None, .18, .2, .3)
    if 'glock' in L and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .4, .3, .55)
    if 'hornpad' in L and bar16 == 0 and (i16 // 16) % 2 == 0: [N_(t, 'horn', n(c, k, 3), 3.8, .5, 0, .4) for k in (0, 1, 2)]
    t = round(t + X, 6)

# reveal: gong + bowed vibraphone, a low bowed drone under the real-time hold
N_(ev('gong')[0], 'gong', None, None, .55, 0, .55)
N_(4.0, 'contrabass', 'D2', 3.9, .35, 0, .35)
N_(6.0, 'vibraphone_bowed', 'A5', 1.8, .4, .2, .5)
# abductions: timpani on each target, a bowed vibraphone rising with each lift
for tt in ev('zap'): N_(tt, 'timpani', 'D3', None, .6, 0, .55)
for tt, p in zip(ev('lift'), ['D5', 'F5', 'A5']): N_(tt, 'vibraphone_bowed', p, 1.6, .5, -.2, .55)
# alarm into the roll-out: a horn call
for k, p in enumerate(['A3', 'D4', 'F4', 'A4']): N_(15.0 + k * .25, 'horn_stac', p, .3, .75, 0, .55)
# before the hit: timpani roll crescendo, then silence; a high bowed note hangs over the slow-motion hit
for k in range(16): N_(27.5 + k * .0625, 'timpani', 'A2', None, .22 + k * .035, 0, .5)
N_(28.5, 'crash', None, None, .55, 0, .5)
N_(28.6, 'vibraphone_bowed', 'D6', 1.5, .35, 0, .45)
# the release in D major
N_(MAJ0, 'crash', None, None, .5, 0, .45)
for p in ['D3', 'A3', 'D4', 'F#4']: N_(MAJ0, 'horn', p, 1.6, .7, 0, .5)
# the payoff: one plucked note per landing
for tt, p in zip(ev('land'), ['D4', 'F#4', 'A4']): N_(tt, 'violins_pizz', p, .3, .7, .2, .7)
for k, p in enumerate(['A5', 'B5', 'C#6', 'D6', 'E6', 'F#6', 'A6']): N_(ev('flee')[0] + .3 + k * .06, 'glockenspiel', p, 1.2, .4, .3 - k * .08, .45)
# the end: cadence on D
N_(39.0, 'timpani', 'D3', None, .6, 0, .5)
for p in ['D3', 'A3', 'F#4', 'D5']: N_(39.0, 'horn', p, 1.0, .6, 0, .45)

mix = S.render(notes, dur=DUR + 1, master=False)

# the saucer's theremin: a sine with vibrato and portamento (three notes falling a minor third)
def theremin(t0, notes_hz, step=.42, v=.12):
    d = step * len(notes_hz) + .5; tt = t_(d)
    f = np.interp(tt, [k * step + (.12 if k else 0) for k in range(len(notes_hz))], notes_hz)
    f = f * (1 + .012 * np.sin(2 * np.pi * 5.6 * tt) * np.clip(tt / .3, 0, 1))
    ph = np.cumsum(2 * np.pi * f / SR); x = np.sin(ph) + .18 * np.sin(2 * ph)
    x *= np.clip(tt / .08, 0, 1) * np.clip((d - tt) / .4, 0, 1) * v
    add(mix, x, t0, 1, .1)
add_hz = lambda m: 440 * 2 ** ((m - 69) / 12)
theremin(ev('theremin')[0], [add_hz(81), add_hz(77), add_hz(74)], .5, .14)
for tt in ev('zap'): theremin(tt + .05, [add_hz(74), add_hz(86)], .3, .07)

# tape-stop into the real-time hold: the last 0.45 s before 2.5 slows to a halt
a, b = int(2.05 * SR), int(2.5 * SR)
seg_ = mix[a:b].copy(); L = b - a
rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
mix[b:int(3.95 * SR)] *= 0   # the gong at 4.0 and what follows stay

mix = S.room(mix, size=.35, mix=.15)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
names = sorted({x[1] for x in notes}); json.dump(names, open(os.path.join(HERE, '../out/score_instruments.json'), 'w'))
print('score', len(notes), 'notes', names)
