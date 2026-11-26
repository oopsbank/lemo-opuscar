# Score for "Bald Serve" (Toon on Set): a jaunty 120 BPM golf-comedy band of sampled instruments (VSCO 2 CE + VCSL, CC0; ukulele from FreePats, CC0).
# G major groove under the sanding → dead stop before the tink → a sad bassoon "wah-wah" → (the buzzer is foley) → the "Actually…" sting →
# a light marimba bed under the smoke board → the groove back for the handoff → a xylophone run up into the drive, glockenspiel sparkle →
# a thin groove under the last line that never cadences (the film loops). Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(17)
B = .5
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))

CH = {'F': ('F1', ['F4', 'A4', 'C5']), 'G': ('G1', ['G4', 'B4', 'D5']), 'C': ('C2', ['G4', 'C5', 'E5']), 'D7': ('D2', ['F#4', 'A4', 'C5']), 'Em': ('E2', ['G4', 'B4', 'E5']), 'Am': ('A1', ['A4', 'C5', 'E5'])}
def groove(t0, t1, prog, v=.7, uke=True, wood=True):
    t, i = t0, 0
    while t < t1 - 1e-6:
        root, chord = CH[prog[i % len(prog)]]
        for b in range(4):
            tb = t + b * B
            if tb >= t1 - 1e-6: break
            if b in (0, 2): n(tb, 'contrabass_pizz', root if b == 0 else root[:-1] + str(int(root[-1]) + 1), .4, v, -.15)
            if uke:
                for k, p in enumerate(chord): n(tb + B / 2 + k * .012, 'ukulele', p, .3, v * .5, .25)
            if wood and b in (1, 3): n(tb, 'woodblock', 'b', None, v * .35, .35)
        t += 4 * B; i += 1

# —— A: the shaving groove (0 – 7.1), a little faster feel with the clarinet ——
groove(0, 7.0, ['C', 'G', 'C', 'D7'])
tune = [(0, 'E5', .5), (.5, 'G5', .5), (1, 'E5', .5), (1.5, 'C5', 1), (3, 'D5', .5), (3.5, 'E5', .5), (4, 'D5', 1),
        (6, 'A4', .5), (6.5, 'C5', .5), (7, 'E5', .5), (7.5, 'G5', .5), (8, 'E5', 1), (10, 'F#5', .5), (10.5, 'E5', .5), (11, 'D5', .5), (11.5, 'B4', 1)]
for b, p, d in tune: n(b * B, 'marimba', p, d * B, .5, .2)
for b, p in [(2.5, 'G4'), (3, 'C5'), (5, 'B4'), (5.5, 'D5'), (9.5, 'C5'), (10, 'E5'), (12.5, 'D5'), (13, 'F#5')]: n(b * B, 'clarinet_stac', p, .2, .45, -.25)
for k, p in enumerate(['E6', 'G6', 'C7']): n(5.42 + k * .05, 'glockenspiel', p, .4, .4, .3)
# the toss and serve: a quick rising tremolo, a timpani roll, a hit on the ping
n(6.0, 'violins_trem', 'G5', 1.1, .35, .3, .55)
for tb in np.arange(6.6, 7.08, B / 4): n(tb, 'timpani', 'G2', .3, .3 + (tb - 6.6))
n(7.1, 'clash', 'short', None, .4, .1); n(7.1, 'xylophone', 'G6', .3, .6, .2)
for k, p in enumerate(['G6', 'E6', 'C6', 'G5', 'E5']): n(7.3 + k * .07, 'xylophone', p, .2, .45, .2)   # the ball streaks off: a run down
# —— B: the fence; silence (cut 8.35 – 10.1) ——
n(8.3, 'tuba_stac', 'C1', .4, .7, 0)
# —— C: the "Actually…" sting (same as every episode) ——
n(10.12, 'marimba', 'E5', .3, .75, .1); n(10.32, 'marimba', 'B5', .5, .8, .1); n(10.32, 'glockenspiel', 'B6', .6, .5, .25); n(10.32, 'xylophone', 'E6', .4, .45, -.2)
n(10.32, 'sus_cymbal', 'bell', .8, .25, .1)
# —— D: the demo (11.2 – 17.2): marimba arpeggios, a pizzicato pulse ——
prog = [('Am', ['A4', 'C5', 'E5', 'C5']), ('C', ['C5', 'E5', 'G5', 'E5']), ('G', ['B4', 'D5', 'G5', 'D5']), ('D7', ['D5', 'F#5', 'A5', 'C6'])]
t, i = 11.2, 0
while t < 17.2 - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .32, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .5, -.15)
    t += B; i += 1
n(12.3, 'tuba_stac', 'D#1', .3, .45, 0)                                     # the bald ball hits the fence
for k, p in enumerate(['C6', 'E6', 'G6']): n(13.81 + k * .05, 'glockenspiel', p, .4, .4, .25)   # the fuzzy ball lands in
# —— E: the rally (17.2 – 20.6): groove back, a ta-da on the pok ——
groove(17.2, 20.6, ['C', 'Am', 'F', 'G'], v=.6, wood=False)
for k, p in enumerate(['C6', 'E6', 'G6', 'C7']): n(18.0 + k * .05, 'glockenspiel', p, .5, .5, .25)
n(18.0, 'timpani', 'C2', .6, .6, 0)
# —— F: the sweater: thin groove, no cadence; cut mid-bar back to frame 0 ——
groove(20.6, DUR + .3, ['C', 'G'], v=.45, wood=False)
for b, p in [(2, 'E5'), (2.5, 'D5'), (6, 'C5'), (6.5, 'B4')]: n(20.6 + b * B, 'clarinet_stac', p, .2, .36, -.25)
for k, p in enumerate(['G5', 'C6']): n(24.5 + k * .1, 'glockenspiel', p, .4, .35, .3)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(8.35, 10.1)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
