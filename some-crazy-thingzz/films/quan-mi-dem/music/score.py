# Score for "Quán Mì Đêm": soft piano and kalimba (sampled, CC0), entering with the stone at 22 s.
# D major, 72 BPM: slow piano chords and a kalimba figure → a lighter kalimba pulse under the cooking → held under the slurp →
# a brighter turn with chimes after the cloud bursts → a last swell when the lantern blazes, then it fades out before the end.
# Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(29)
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
B = 60 / 72
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))
CH = {'D': ['D3', 'A3', 'F#4', 'A4'], 'Bm': ['B2', 'F#3', 'D4', 'F#4'], 'G': ['G2', 'D3', 'B3', 'D4'], 'A': ['A2', 'E3', 'C#4', 'E4'], 'Em': ['E3', 'B3', 'G4'], 'F#m': ['F#2', 'C#3', 'A3', 'C#4']}
KAL = {'D': ['D5', 'F#5', 'A5', 'F#5'], 'Bm': ['B4', 'D5', 'F#5', 'D5'], 'G': ['G4', 'B4', 'D5', 'B4'], 'A': ['A4', 'C#5', 'E5', 'C#5'], 'Em': ['E5', 'G5', 'B5', 'G5'], 'F#m': ['F#4', 'A4', 'C#5', 'A4']}

def bars(t0, t1, prog, piano=.32, kal=.3, kal_div=2, mel=None):
    t, i = t0, 0
    while t < t1 - 1e-6:
        c = prog[i % len(prog)]
        for k, p in enumerate(CH[c]): n(t + k * .03, 'piano', p, 4 * B, piano * (1 if k else 1.1), -.15 + k * .1)
        for b in range(4 * kal_div):
            tb = t + b * B / kal_div
            if tb >= t1 - 1e-6: break
            n(tb, 'kalimba', KAL[c][b % 4], B, kal * (1 if b % kal_div == 0 else .7), .25)
        t += 4 * B; i += 1
    return t

# 22 – 34: the stone, the monocle, the nod — slow and sparse
t = bars(22.0, 34.0, ['Bm', 'G', 'D', 'A'], piano=.28, kal=.22, kal_div=1)
# 34 – 50: cooking — the kalimba in eighths, a little melody on top
t = bars(34.0, 50.2, ['D', 'A', 'Bm', 'G'], piano=.3, kal=.3, kal_div=2)
for k, p in enumerate(['A5', 'B5', 'D6', 'A5', 'F#5', 'E5', 'D5', 'E5', 'F#5', 'A5', 'B5', 'A5']): n(34.0 + 8 * B + k * B / 2 * 2, 'kalimba', p, B, .26, -.2)
# 50 – 59.3: the bowl and the slurp — held, gentle
t = bars(50.2, 59.3, ['G', 'D', 'Em', 'A'], piano=.26, kal=.2, kal_div=1)
# the burst: a bright chord with chimes and glockenspiel
for k, p in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5']): n(59.3 + k * .05, 'piano', p, 3.5, .34, -.2 + k * .08)
for k, p in enumerate(['A5', 'D6', 'F#6', 'A6']): n(59.3 + .05 + k * .09, 'glockenspiel', p, 1.5, .22, .3)
# 61 – 71.9: warmth; the giant leaves, the gem
t = bars(61.0, 71.9, ['D', 'F#m', 'G', 'A'], piano=.28, kal=.24, kal_div=2)
# 71.9: the lantern blazes — a last D chord, left to ring and fade
for k, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): n(71.95 + k * .04, 'piano', p, 3.2, .36, -.2 + k * .08)
for k, p in enumerate(['D6', 'A5', 'F#5', 'D5']): n(72.2 + k * .35, 'kalimba', p, 1.5, .22, .3)

mix = S.render(ev, dur=DUR + .3)
mix = S.room(mix, size=.5, mix=.22)
tt = np.arange(len(mix)) / SR
mix *= np.clip((tt - 21.9) / .4, 0, 1)[:, None] * np.clip((75.0 - tt) / 2.4, 0, 1)[:, None]   # in at the stone, fading out before the end
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
