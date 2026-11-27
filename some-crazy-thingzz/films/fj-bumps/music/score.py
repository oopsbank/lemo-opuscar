# Score for "Home Row" (Toon on Set): a 120 BPM workshop shuffle of sampled instruments (VSCO 2 CE + VCSL, CC0).
# Bb shuffle (tuba, woodblock, staccato clarinet riff) under the filing and the dare → a tuba fall into the blind typing → silence under WRONG →
# the channel's "Actually…" sting → a light marimba/pizz bed under the home-row demo → a brass ta-da on "GUS" → a thin bed on the 5 →
# the shuffle back, thin, with no cadence (the film loops). Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(23)
W = lambda t: t   # this film is timed on its final clock
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
# —— A: the shuffle under the filing and the dare (0.5 – 5.8) ——
shuffle(.5, 5.8, ['Bb', 'Eb', 'Bb', 'F7'])
for b, p, d in [(1, 'F5', .5), (1.5 + .16, 'D5', .5), (2, 'Bb4', .5), (3, 'C5', .5), (3.5 + .16, 'D5', 1), (5, 'Eb5', .5), (5.5 + .16, 'G5', .5), (6, 'Bb5', 1), (9, 'A5', .5), (9.5 + .16, 'F5', .5), (10, 'C5', 1)]:
    n(b * B, 'clarinet_stac', p, d * B, .5, -.25)
for k, p in enumerate(['F2', 'E2', 'Eb2', 'D2', 'Db2']): n(5.3 + k * .1, 'tuba_stac', p, .14, .55, 0)   # the fall into the blind typing
n(5.85, 'clash', 'short', None, .3, .1)
# —— the "Actually…" sting (7.3) ——
n(7.22, 'marimba', 'E5', .3, .75, .1); n(7.42, 'marimba', 'B5', .5, .8, .1); n(7.42, 'glockenspiel', 'B6', .6, .5, .25); n(7.42, 'xylophone', 'E6', .4, .45, -.2); n(7.42, 'sus_cymbal', 'bell', .8, .25, .1)
# —— the demo (8.4 – 15.1): marimba arpeggios, pizz bass, a lift on HOME ROW ——
prog = [('Bb', ['D5', 'F5', 'Bb5', 'F5']), ('Gm', ['D5', 'G5', 'Bb5', 'G5']), ('Eb', ['Eb5', 'G5', 'Bb5', 'G5']), ('F7', ['C5', 'Eb5', 'A5', 'C6'])]
t, i = 8.4, 0
while t < 15.05 - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .32, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .5, -.15)
    t += B; i += 1
for k, p in enumerate(['F5', 'Bb5', 'D6']): n(11.2 + k * .05, 'glockenspiel', p, .4, .4, .25)
# —— touch typing (13.5): a xylophone run up; the five (17.4 – 19.3): a thin bed ——
for k, p in enumerate(['Bb4', 'D5', 'F5', 'Bb5', 'D6']): n(13.5 + k * .04, 'xylophone', p, .1, .45, .2)
for tb in np.arange(17.4, 19.3, B * 2): n(tb, 'contrabass_pizz', 'Bb1', .4, .4, -.15); n(tb + B, 'marimba', 'F5', .3, .25, .2)
# —— "GUS" (15.95): a brass ta-da ——
for p in ['Bb3', 'D4', 'F4', 'Bb4']: n(15.95, 'trumpet_stac', p, .2, .45, 0); n(15.95 + .25, 'trumpet_stac', p, .4, .5, 0)
for k, p in enumerate(['Bb5', 'D6', 'F6', 'Bb6']): n(15.95 + k * .05, 'glockenspiel', p, .5, .45, .25)
# —— the second filing and the loop (19.3 – end, no cadence): the shuffle back, thin ——
shuffle(19.3, DUR + .3, ['Bb', 'F7'], v=.5, riff=False)
n(20.5, 'tuba_stac', 'Bb0', .5, .7, 0)
for b, p in [(2, 'D5'), (2.5 + .32, 'F5'), (6, 'Eb5'), (6.5 + .32, 'C5'), (10, 'D5'), (10.5 + .32, 'F5')]: n(19.3 + b * B, 'clarinet_stac', p, .2, .36, -.25)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(6.75, 7.22)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
