# All Green — original score, 120 BPM. A bright C major pulse that sours to C minor as the junctions lock (a horn stab per lock),
# thins when the tow truck hooks the crash, then climbs back to major with a glockenspiel note for every junction that gets its lights back.
# Tape-stop into real time (one held bowed note), horns when Engine 9 rolls. No final cadence (the film loops).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
ev = lambda ty: [e for e in E['ev'] if e['type'] == ty]
FIX = sorted(e['t'] for e in ev('fixed')); LOCK = sorted(e['t'] for e in ev('lock')); HOOK = ev('hook')[0]['t']; ROLL = ev('roll')[0]['t']
S.seed(4)
X = .125
CH = {'C': ['C', 'E', 'G'], 'Am': ['A', 'C', 'E'], 'F': ['F', 'A', 'C'], 'G': ['G', 'B', 'D'], 'Cm': ['C', 'D#', 'G'], 'Ab': ['G#', 'C', 'D#'], 'Fm': ['F', 'G#', 'C'], 'Gs': ['G', 'B', 'D']}
def chord_at(t):
    minor = 5 < t < FIX[0]
    return (['Cm', 'Ab', 'Fm', 'Gs'] if minor else ['C', 'Am', 'F', 'G'])[int(t // 2) % 4]
def n(c, i, o): return f'{CH[c][i % 3]}{o + i // 3}'
REAL = (21.5, 26.0)
def layers(t):
    if REAL[0] <= t < REAL[1]: return set()
    if t >= ROLL: return {'mar', 'bass', 'wood', 'glock', 'brass'}
    if HOOK <= t < FIX[0]: return {'bass'}
    L = {'mar', 'bass'}
    if t > 3: L |= {'wood'}
    if t > 7 and t < HOOK: L |= {'brass'}
    if t >= FIX[0]: L |= {'xyl'}
    return L
notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
HOOKL = [4, None, 3, 4, 2, None, 3, None, 4, None, 2, 3, 1, None, None, None]
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t); i16 = int(round(t / X)); b16 = i16 % 4; bar16 = i16 % 16
    if 'mar' in L: k = [0, 2, 4, 2][b16] + (1 if (i16 // 4) % 2 else 0); N_(t, 'marimba', n(c, k, 4), .25, .55 if b16 == 0 else .36, -.25)
    if 'bass' in L and b16 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .6, .72, 0, .85)
    if 'wood' in L: N_(t, 'woodblock', 'a' if b16 == 0 else 'c', None, .38 if b16 == 0 else .12, -.35, .35)
    if 'xyl' in L and HOOKL[bar16] is not None: N_(t, 'xylophone', n(c, HOOKL[bar16], 5), .3, .46, .3, .5)
    if 'brass' in L and bar16 in (0, 6, 10): [N_(t, 'horn_stac', n(c, k, 3), .4, .6, 0, .45) for k in (0, 1, 2)]
    if 'glock' in L and bar16 in (0, 8): N_(t, 'glockenspiel', n(c, 2, 5), .4, .38, .3, .45)
    t = round(t + X, 6)
for lt in LOCK: N_(round(lt / X) * X, 'horn_stac', 'C3', .5, .75, 0, .5); N_(round(lt / X) * X, 'cellos_pizz', 'C2', .4, .7, 0, .6)
for k, ft in enumerate(FIX): N_(ft, 'glockenspiel', ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'][k % 6], 1.0, .5, -.2 + k * .08, .5)
N_(HOOK, 'timpani', 'C2', None, .8, 0, .7)
N_(REAL[0] + .1, 'vibraphone_bowed', 'G4', 2.0, .32, 0, .42); N_(REAL[0] + 2.1, 'vibraphone_bowed', 'A4', ROLL - REAL[0] - 2.1, .34, 0, .44)
N_(ROLL, 'crash', None, None, .45, 0, .4); [N_(ROLL, 'horn', p, 2.0, .65, 0, .45) for p in ('C3', 'G3', 'C4', 'E4')]
mix = S.render(notes, dur=DUR + 1, master=False)
def tapestop(a, b):
    a, b = int(a * SR), int(b * SR); seg_ = mix[a:b].copy(); L = b - a
    rate = np.linspace(1, 0, L) ** .8; pos = np.cumsum(rate); pos = pos / pos[-1] * (L * .55)
    for ch in range(2): mix[a:b, ch] = np.interp(pos, np.arange(L), seg_[:, ch]) * np.linspace(1, 0, L) ** .5
tapestop(REAL[0] - .4, REAL[0])
mix = S.room(mix, size=.35, mix=.15)[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
print('score', len(notes), 'notes')
