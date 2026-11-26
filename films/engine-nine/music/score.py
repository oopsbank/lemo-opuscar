# Engine Nine — original score: tuned-percussion minimalism, 120 BPM, D major.
# Fixed phrase skeleton; story events (cars yielding, the partings, the ladder steps, the flames dying) decide which notes sound.
# → out/score.wav (48 kHz stereo)
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']; EV = E['ev']
ev = lambda ty: [e['t'] for e in E['ev'] if e['type'] == ty]
S.seed(9)
B = .5; X = B / 4                     # beat, sixteenth
CH = {'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E'], 'Em': ['E', 'G', 'B']}
PROG = ['D', 'D', 'D', 'Bm', 'G', 'A', 'Bm', 'G', 'A', 'D', 'Bm', None, None, None, 'D', 'Bm', 'G', 'D', 'D']   # one chord per bar (2 s); silent 22–28
def chord_at(t): k = int(t // 2); return PROG[k] if k < len(PROG) else None
def n(c, i, octv): name = CH[c][i % 3]; return f'{name}{octv + i // 3}'

def on(t):   # where the score plays (silence during the bridge wait, and after the last flame)
    return (t < 21.75) or (28.0 <= t < 34.0)
# Layer schedule: which voices play where (the flames take them away one per beat from 31.0)
FLAME = sorted(ev('flame'))
def layers(t):
    L = set()
    if t < 2.0: L |= {'alarm', 'wood'}
    elif t < 4.0: L |= {'alarm', 'wood', 'marA'}
    elif t < 12.0: L |= {'marA', 'wood'} | ({'kal'} if t >= 6 else set()) | ({'vib'} if t >= 8 else set()) | ({'bass'} if t >= 10 else set())
    elif t < 17.0: L |= {'pulse', 'bass'}
    elif t < 21.75: L |= {'marA', 'marB', 'kal', 'vib', 'bass', 'glock', 'wood'}
    elif 28.0 <= t < 34.0:
        L |= {'marA', 'marB', 'kal', 'bass', 'glock', 'wood', 'vib'}
        drop = ['wood', 'glock', 'kal', 'marB', 'bass', 'vib']   # one voice leaves per dying flame
        k = sum(1 for f in FLAME if t >= f)
        for v in drop[:k]: L.discard(v)
    return L

notes = []
def N_(t, inst, p, d, v, pan, g=1.0): notes.append((round(t, 4), inst, p, d, v, pan, g))
t = 0.0
while t < DUR - 1e-6:
    c = chord_at(t); L = layers(t) if on(t) else set()
    i16 = int(round(t / X)); beat16 = i16 % 4; bar16 = i16 % 16
    if c and L:
        if 'alarm' in L and beat16 == 0:                                  # hi–lo siren interval as a bell motif
            N_(t, 'glockenspiel', 'A5' if (i16 // 4) % 2 == 0 else 'D6', .4, .55, .25)
            if (i16 // 4) % 4 == 0: N_(t, 'tubular_bells', 'D5', 1.2, .35, -.2, .6)
        if 'wood' in L: N_(t, 'woodblock', 'a' if beat16 == 0 else 'c', None, .5 if beat16 == 0 else .22, -.35, .45)
        pat = [0, 2, 4, 2, 1, 2, 4, 3]                                    # marimba A: root–fifth–octave third shapes in 16ths
        if 'marA' in L: k = pat[i16 % 8]; N_(t, 'marimba', n(c, k, 4), .3, .62 if beat16 == 0 else .45, -.3)
        if 'marB' in L: k = pat[(i16 + 3) % 8] + 1; N_(t + .004, 'marimba', n(c, k, 4), .3, .4, .35, .8)   # phased a 16th + a voice off
        if 'pulse' in L and beat16 == 0: N_(t, 'marimba', n(c, 0, 4), .4, .55, 0); N_(t, 'marimba', n(c, 2, 4), .4, .4, .2)
        if 'kal' in L and beat16 == 2: P_ = (t, n(c, 1 + (i16 // 4) % 2, 5)); notes.append((round(t, 4), '__kal', P_[1], 1.0, .5, .45, .5))
        if 'bass' in L and beat16 == 0 and (i16 // 4) % 2 == 0: N_(t, 'contrabass_pizz', n(c, 0, 2), .8, .75, 0, .9)
        if 'glock' in L and bar16 in (0, 6, 10, 12):
            mel = {0: 2, 6: 3, 10: 4, 12: 3}[bar16]; N_(t, 'glockenspiel', n(c, mel, 5), .5, .42, .3, .7)
    t = round(t + X, 6)

# vibraphone notes gated by cars yielding (quantised to the next 16th) and by the corners
for e in E['ev']:
    if e['type'] == 'yield' and 6.0 <= e['t'] < 12.0:
        tq = np.ceil(e['t'] / X) * X; c = chord_at(tq)
        if c: N_(tq, 'vibraphone', n(c, int(abs(hash(round(tq, 3))) % 3) + 3, 4), .8, .5, e.get('pan', 0) * .6, .7)
    if e['type'] == 'yield' and e['t'] < 6.0:
        tq = np.ceil(e['t'] / X) * X; c = chord_at(tq)
        if c and tq >= 2: N_(tq, 'glockenspiel', n(c, 3 + int(tq * 8) % 3, 4), .3, .3, e.get('pan', 0) * .6, .55)
# the partings: tuned horn stabs, rising, then a snare roll into the surge
for tt, ch in zip(sorted(ev('part')), [['B3', 'D4', 'F#4'], ['C#4', 'E4', 'A4'], ['D4', 'F#4', 'A4', 'D5']]):
    for p in ch: N_(tt, 'horn_stac', p, .5, .8, 0, .75)
    N_(tt, 'timpani', 'D3' if tt < 16 else 'A2', None, .55, 0, .6)
notes.append((16.5, 'snare', 'roll', .5, .45, 0, .5))
notes.append((17.0, 'crash', None, None, .5, .1, .45))
for p in ['D4', 'F#4', 'A4']: N_(17.0, 'horn_stac', p, .4, .85, 0, .7)
# corners: a glockenspiel flick
for tt in ev('corner'): N_(np.ceil(tt / X) * X, 'glockenspiel', 'F#6', .3, .45, .4, .6); N_(np.ceil(tt / X) * X + X, 'glockenspiel', 'A6', .3, .4, .4, .5)
# back at 28: crash + horns
notes.append((28.0, 'crash', None, None, .6, 0, .55)); notes.append((28.0, 'timpani', 'D3', None, .7, 0, .7))
for p in ['D3', 'A3', 'D4', 'F#4']: N_(28.0, 'horn', p, 1.6, .7, 0, .55)
# the ladder climbs: a rising scale, one note per step
for k, tt in enumerate(sorted(ev('ladder'))): N_(tt, 'xylophone', ['D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6', 'E6'][k % 9], .3, .6, .3, .7)
# water on: a glockenspiel run
for k, p in enumerate(['A5', 'D6', 'F#6', 'A6']): N_(ev('water')[0] + k * X, 'glockenspiel', p, .4, .5, .2, .6)
# the last flame dies: one glockenspiel note into the silence (the film's first note reprised: A5 of the alarm motif → resolved to D6)
N_(ev('out')[0] + .02, 'glockenspiel', 'D6', 2.5, .5, 0, .8)
N_(ev('out')[0] + .02, 'vibraphone', 'D5', 2.5, .3, 0, .5)

# —— render ——
sampled = [x for x in notes if x[1] != '__kal']
mix = S.render(sampled, dur=DUR + 1, master=False)
for (tt, _, p, d, v, pan, g) in [x for x in notes if x[1] == '__kal']:
    add(mix, P.pluck('kalimba', p, d, vel=v), tt, g * .9, pan)
# tape-stop into the bridge wait: varispeed 1 → 0.2 over 21.6–22.0, voices fading out
a, b = int(21.55 * SR), int(22.0 * SR)
rate = np.linspace(1, .18, b - a); pos = a + np.cumsum(rate)
for ch in range(2):
    src = mix[:, ch].copy(); mix[a:b, ch] = np.interp(pos, np.arange(len(src)), src) * np.linspace(1, 0, b - a) ** 1.4
mix[b:int(28.0 * SR) - 200] = 0
mix = S.room(mix, size=.35, mix=.16)
mix = mix[:int(DUR * SR)]
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs(os.path.join(HERE, '../out'), exist_ok=True)
sf.write(os.path.join(HERE, '../out/score.wav'), mix.astype(np.float32), SR)
names = sorted({x[1] for x in sampled})
json.dump(names, open(os.path.join(HERE, '../out/score_instruments.json'), 'w'))
print('score', len(notes), 'notes', names)
