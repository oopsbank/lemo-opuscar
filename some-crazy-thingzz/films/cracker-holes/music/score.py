# Score for "No Holes" (Toon on Set): a 120 BPM kitchen-comedy band of sampled instruments (VSCO 2 CE + VCSL, CC0; ukulele from the sampler's FluidR3 set).
# F major groove (ukulele off-beats, pizzicato bass, marimba tune, clarinet answers, woodblock) → bassoon walk-up to the oven →
# tension (tremolo strings, rising pizzicato, timpani) under the swelling dough → sting on the door, silence → lighter groove under the answer →
# glockenspiel ta-da on the ding → a drop for the crunch → button chord. Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(11)
B = .5                      # one beat at 120 BPM
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))

CH = {'F': ('F1', ['F3', 'A3', 'C4']), 'C7': ('C2', ['E3', 'G3', 'A#3']), 'Bb': ('A#1', ['D3', 'F3', 'A#3']), 'Dm': ('D2', ['D3', 'F3', 'A3']), 'G7': ('G1', ['B2', 'D3', 'F3'])}
def groove(t0, t1, prog, v=.7, uke=True, wood=True):
    """bass on 1 and 3, ukulele chord on the off-beats, woodblock on 2 and 4; one chord per bar"""
    t, i = t0, 0
    while t < t1 - 1e-6:
        root, chord = CH[prog[i % len(prog)]]
        for b in range(4):
            tb = t + b * B
            if tb >= t1 - 1e-6: break
            if b in (0, 2): n(tb, 'contrabass_pizz', root if b == 0 else root[:-1] + str(int(root[-1]) + 1), .4, v, -.15)
            if uke:
                for k, p in enumerate(chord): n(tb + B / 2 + k * .012, 'ukulele', p.replace('3', '4') if p[-1] == '3' else p, .3, v * .55, .25)
            if wood and b in (1, 3): n(tb, 'woodblock', 'b', None, v * .4, .35)
        t += 4 * B; i += 1

# —— A: the groove at the counter (0 – 6.0) ——
groove(0, 6.0, ['F', 'C7', 'F'])
tune = [(0, 'C5', .5), (.5, 'A4', .5), (1, 'C5', .5), (1.5, 'F5', 1), (3, 'E5', .5), (3.5, 'D5', .5), (4, 'C5', 1),
        (6, 'A#4', .5), (6.5, 'D5', .5), (7, 'C5', .5), (7.5, 'A4', .5), (8, 'F4', 1)]
for b, p, d in tune: n(b * B, 'marimba', p, d * B, .55, .2)
for b, p in [(2.5, 'A4'), (3, 'C5'), (5, 'G4'), (5.5, 'A#4'), (9.5, 'A4'), (10, 'C5'), (10.5, 'F5')]: n(b * B, 'clarinet_stac', p, .2, .5, -.25)
# —— B: walk-up to the oven (6.0 – 7.5) ——
for k, p in enumerate(['F2', 'G2', 'A2', 'A#2', 'B2', 'C3']): n(6.0 + k * B / 2, 'bassoon_stac', p, .2, .65, .05)
n(6.0, 'contrabass_pizz', 'F1', .3, .7); n(6.12, 'xylophone', 'C6', .3, .5, .2)                      # the slam
for k, p in enumerate(['C6', 'E6', 'G6']): n(6.9 + k * .06, 'glockenspiel', p, .4, .4, .3)          # the glow comes on
# —— C: tension under the swelling dough (7.5 – 10.9) ——
n(7.5, 'violins_trem', 'C5', 3.4, .3, .3, .55); n(7.5, 'violas', 'F4', 3.4, .25, .1, .5)
n(8.5, 'violins_trem', 'C#5', 2.4, .45, .3, .6); n(9.5, 'violins_trem', 'D5', 1.4, .6, .35, .65)
t, k = 7.5, 0
chrom = ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4']
while t < 10.85:                                                                                       # rising pizzicato, quickening
    n(t, 'cellos_pizz', chrom[min(k // 2, len(chrom) - 1)], .2, .45 + .4 * (t - 7.5) / 3.4, -.2)
    t += B if t < 8.5 else (B / 2 if t < 9.8 else B / 4); k += 1
for i, tb in enumerate([7.62, 7.78, 7.92, 8.05, 8.17, 8.28]): n(tb, 'xylophone', ['G5', 'A5', 'C6', 'D6', 'F6', 'G6'][i], .2, .45, .25)   # the bubbles
for tb in np.arange(8.5, 10.85, B / 2): n(tb, 'timpani', 'C2', .5, .3 + .55 * (tb - 8.5) / 2.35, 0)
n(10.1, 'sus_cymbal', 'cresc', .8, .5, .1)
# the sting on the door (10.9): timpani + tuba + cymbal, then silence
n(10.9, 'timpani', 'F2', 1.2, .95, 0); n(10.9, 'tuba_stac', 'F1', .4, .9, 0); n(10.9, 'clash', 'short', None, .7, .1); n(10.9, 'bassoon_stac', 'F2', .3, .8, -.1)
# —— D: the answer, lighter (14.8 – 20.0) ——
groove(14.8, 20.0, ['F', 'Bb', 'C7', 'F', 'Dm', 'C7'], v=.55, wood=False)
for k in range(int((20.0 - 15.0) / B)): n(15.0 + k * B, 'marimba', ['F5', 'A5', 'C6', 'A5'][k % 4], .3, .32, .25)
for b, p, d in [(0, 'A4', 2), (2, 'A#4', 1), (3, 'C5', 1), (4, 'D5', 2), (6, 'C5', 2)]: n(16.9 + b * B, 'clarinet_stac', p, d * B * .5, .42, -.25)
# —— E: ta-da on the ding (20.0), a drop for the crunch, the button ——
for i, p in enumerate(['F5', 'A5', 'C6', 'F6']): n(20.0 + i * .06, 'glockenspiel', p, .5, .5, .25)
n(20.0, 'contrabass_pizz', 'F1', .4, .7); n(20.0, 'violins_pizz', 'A5', .3, .55, .3); n(20.0, 'violas_pizz', 'C5', .3, .5, .2)
groove(20.5, 22.0, ['F'], v=.55, wood=False)
for b, p in [(0, 'C5'), (1, 'D5'), (2, 'E5')]: n(20.5 + b * B, 'clarinet_stac', p, .2, .45, -.25)
# 22.0 – 22.75: silence around the crunch; then "Crunchy!" and the button
n(23.25, 'contrabass_pizz', 'F1', .6, .85, -.1); n(23.25, 'tuba_stac', 'F1', .4, .6, 0); n(23.25, 'cellos_pizz', 'C3', .6, .7, -.2)
n(23.25, 'violins_pizz', 'A5', .6, .7, .3); n(23.25, 'violins_pizz', 'F5', .6, .7, .3)
for k, p in enumerate(['F4', 'A4', 'C5']): n(23.25 + k * .012, 'ukulele', p, .6, .6, .25)
n(23.25, 'xylophone', 'F6', .8, .65, .25); n(23.25, 'marimba', 'F5', .8, .5, .2)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):   # a hard stop: the music cuts dead (reverb tails included)
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(11.6, 14.79); cut(22.0, 23.24)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
