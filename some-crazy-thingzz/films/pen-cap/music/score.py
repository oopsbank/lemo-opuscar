# Score for "Cap Solo" (Toon on Set): a jaunty 120 BPM golf-comedy band of sampled instruments (VSCO 2 CE + VCSL, CC0; ukulele from FreePats, CC0).
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

# Retimed for the retention playbook: a sound hit (foley) owns frame 0, the band enters at 0.5 s.
# —— A: the groove (0.5 – 4.1) ——
groove(.5, 4.1, ['C', 'G'])
tune = [(1, 'E5', .5), (1.5, 'G5', .5), (2, 'E5', .5), (2.5, 'C5', 1), (4, 'D5', .5), (4.5, 'E5', .5), (5, 'D5', 1)]
for b, p, d in tune: n(b * B, 'marimba', p, d * B, .5, .2)
for b, p in [(3.5, 'G4'), (4, 'C5'), (6, 'B4'), (6.5, 'D5')]: n(b * B, 'clarinet_stac', p, .2, .45, -.25)
n(3.4, 'violins_trem', 'C#6', .7, .3, .3, .5)                                             # the squeal
n(4.1, 'clash', 'short', None, .35, .1); n(4.1, 'tuba_stac', 'C1', .4, .6, 0)             # the crack
# —— the "Actually…" sting (6.3) ——
n(6.27, 'marimba', 'E5', .3, .75, .1); n(6.47, 'marimba', 'B5', .5, .8, .1); n(6.47, 'glockenspiel', 'B6', .6, .5, .25); n(6.47, 'xylophone', 'E6', .4, .45, -.2)
n(6.47, 'sus_cymbal', 'bell', .8, .25, .1)
# —— the model (7.4 – 16.4) ——
prog = [('Am', ['A4', 'C5', 'E5', 'C5']), ('C', ['C5', 'E5', 'G5', 'E5']), ('G', ['B4', 'D5', 'G5', 'D5']), ('D7', ['D5', 'F#5', 'A5', 'C6'])]
t, i = 7.4, 0
while t < 16.4 - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .32, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .5, -.15)
    t += B; i += 1
# —— the pluck (16.4 – 19.6) and the pen (19.6 – end, no cadence) ——
groove(16.4, 19.6, ['C', 'Am', 'F', 'G'], v=.6, wood=True)
groove(19.6, DUR + .3, ['C', 'G'], v=.45, wood=False)
for b, p in [(2, 'E5'), (2.5, 'D5'), (6, 'C5'), (6.5, 'B4')]: n(19.6 + b * B, 'clarinet_stac', p, .2, .36, -.25)
for k, p in enumerate(['G5', 'D6']): n(20.4 + k * .1, 'glockenspiel', p, .4, .35, .3)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(4.12, 6.25)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
