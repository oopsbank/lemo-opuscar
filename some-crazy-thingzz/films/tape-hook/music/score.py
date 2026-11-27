# Score for "Glue Time" (Toon on Set): a 120 BPM workshop shuffle of sampled instruments (VSCO 2 CE + VCSL, CC0).
# Bb shuffle (tuba, woodblock, staccato clarinet riff) under the glue and the bet → a tuba fall into the CLUNK → silence under WRONG →
# the channel's "Actually…" sting → a light marimba/pizz bed under the demo → a xylophone squeal on "HA!" → a brass ta-da on PERFECT FIT →
# the shuffle back, thin, with no cadence (the film loops). Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(23)
# the shots were blocked on an old clock and retimed (main.js WARP: new0,new1,old0,old1); W maps an old time to the film's clock
WARP = [[0,1.4,0,1.4],[1.4,3.35,1.4,3.1],[3.35,5.35,3.1,4.7],[5.35,6.1,4.7,5.45],[6.1,6.7,5.45,6.05],[6.7,7.25,6.05,6.6],[7.25,8.4,6.6,7.75],[8.4,10.85,7.75,10.2],[10.85,15.95,10.2,14.75],[15.95,17.0,14.75,15.75],[17.0,19.6,15.75,18.2],[19.6,21.4,18.2,20.1],[21.4,24.0,20.1,22.85],[24.0,26.61,22.85,25.8]]
def W1(t):
    for a, b, c, d in WARP:
        if t <= d: return a + (t - c) * (b - a) / (d - c)
    return t + WARP[-1][1] - WARP[-1][3]
# second retime (slower voices): [previous film clock, film clock] anchors, same as main.js W2
W2A = [[0, 0], [0.12, 0.12], [1.75, 1.92], [1.8, 2.17], [3.312, 3.738], [3.4, 4.026], [5.2, 5.916], [5.4, 6.316], [6.381, 7.353], [7.25, 8.422], [8.368, 9.54], [8.45, 9.822], [10.667, 12.044], [10.9, 12.477], [13.808, 15.563], [13.85, 15.805], [16.003, 18.075], [16.05, 18.322], [17.306, 19.799], [17.5, 20.193], [19.59, 22.386], [21.5, 24.496], [22.556, 25.598], [24.6, 27.842], [25.793, 29.186], [26.61, 30.003]]
def W2(t): return float(np.interp(t, [a for a, b in W2A], [b for a, b in W2A]))
def W(t): return W2(W1(t))
B = .5
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))
CH = {'Bb': ('Bb1', ['D4', 'F4', 'Bb4']), 'Eb': ('Eb2', ['Eb4', 'G4', 'Bb4']), 'F7': ('F1', ['Eb4', 'A4', 'C5']), 'Gm': ('G1', ['D4', 'G4', 'Bb4'])}
SW = .08   # the shuffle: off-beats late
def shuffle(t0, t1, prog, v=.7, riff=True):
    t, i = t0, 0
    while t < t1 - 1e-6:
        root, chord = CH[prog[i % len(prog)]]
        for b in range(4):
            tb = t + b * B
            if tb >= t1 - 1e-6: break
            if b in (0, 2): n(tb, 'tuba_stac', root if b == 0 else root[:-1] + str(int(root[-1]) + 1), .3, v * .9, -.1)
            if b in (1, 3):
                for k, p in enumerate(chord): n(tb + k * .01, 'violins_pizz', p, .2, v * .38, .3)
            n(tb + B / 2 + SW, 'woodblock', 'b', None, v * .3, .35)
        t += 4 * B; i += 1
# —— A: the shuffle under the glue and the bet (0.5 – 5.65) ——
shuffle(.5, W(5.6), ['Bb', 'Eb', 'Bb', 'F7'])
for b, p, d in [(1, 'F5', .5), (1.5 + .16, 'D5', .5), (2, 'Bb4', .5), (3, 'C5', .5), (3.5 + .16, 'D5', 1), (5, 'Eb5', .5), (5.5 + .16, 'G5', .5), (6, 'Bb5', 1), (9, 'A5', .5), (9.5 + .16, 'F5', .5), (10, 'C5', 1)]:
    n(W2(b * B), 'clarinet_stac', p, d * B, .5, -.25)
for k, p in enumerate(['F2', 'E2', 'Eb2', 'D2', 'Db2']): n(W(4.95) + k * .12, 'tuba_stac', p, .14, .55, 0)   # the fall into the CLUNK
n(W(5.65), 'clash', 'short', None, .3, .1)
# —— the "Actually…" sting (6.6) ——
n(W(6.57), 'marimba', 'E5', .3, .75, .1); n(W(6.77), 'marimba', 'B5', .5, .8, .1); n(W(6.77), 'glockenspiel', 'B6', .6, .5, .25); n(W(6.77), 'xylophone', 'E6', .4, .45, -.2); n(W(6.77), 'sus_cymbal', 'bell', .8, .25, .1)
# —— the demo (7.75 – 14.75): marimba arpeggios, pizz bass, a lift on TRUE ZERO ——
prog = [('Bb', ['D5', 'F5', 'Bb5', 'F5']), ('Gm', ['D5', 'G5', 'Bb5', 'G5']), ('Eb', ['Eb5', 'G5', 'Bb5', 'G5']), ('F7', ['C5', 'Eb5', 'A5', 'C6'])]
t, i = W(7.75), 0
while t < W(14.7) - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .32, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .5, -.15)
    t += B; i += 1
for k, p in enumerate(['F5', 'Bb5', 'D6']): n(W(13.3) + k * .05, 'glockenspiel', p, .4, .4, .25)
# —— "HA!" (14.8): a xylophone run up; the first inch (15.75 – 18.2): a thin bed ——
for k, p in enumerate(['Bb4', 'D5', 'F5', 'Bb5', 'D6']): n(W(14.8) + k * .04, 'xylophone', p, .1, .45, .2)
for tb in np.arange(W(15.75), W(18.2), B * 2): n(tb, 'contrabass_pizz', 'Bb1', .4, .4, -.15); n(tb + B, 'marimba', 'F5', .3, .25, .2)
# —— PERFECT FIT (18.9): a brass ta-da ——
for p in ['Bb3', 'D4', 'F4', 'Bb4']: n(W(18.9), 'trumpet_stac', p, .2, .45, 0); n(W(18.9) + .25, 'trumpet_stac', p, .4, .5, 0)
for k, p in enumerate(['Bb5', 'D6', 'F6', 'Bb6']): n(W(18.9) + k * .05, 'glockenspiel', p, .5, .45, .25)
# —— the unglue and the loop (19.6 – end, no cadence): the shuffle back, thin ——
shuffle(W(19.6), DUR + .3, ['Bb', 'F7'], v=.5, riff=False)
n(W(21.75), 'tuba_stac', 'Bb0', .5, .7, 0)
for b, p in [(2, 'D5'), (2.5 + .32, 'F5'), (6, 'Eb5'), (6.5 + .32, 'C5'), (10, 'D5'), (10.5 + .32, 'F5')]: n(W(19.6) + b * B, 'clarinet_stac', p, .2, .36, -.25)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(W(6.03), W(6.55))
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
