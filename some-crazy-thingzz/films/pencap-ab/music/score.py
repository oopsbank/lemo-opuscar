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

# "Cap Check": a light groove under the claim, a quiet marimba under the demo, the music out for the held answer, a soft groove to the end.
groove(.3, 3.2, ['C', 'G'], v=.55)
for b, p, d in [(1, 'E5', .5), (1.5, 'G5', .5), (2, 'E5', .5), (2.5, 'C5', 1)]: n(.3 + b * B, 'marimba', p, d * B, .4, .2)
groove(3.2, 6.3, ['Am', 'F'], v=.4, uke=False)
prog = [('Am', ['A4', 'C5', 'E5', 'C5']), ('C', ['C5', 'E5', 'G5', 'E5']), ('G', ['B4', 'D5', 'G5', 'D5']), ('D7', ['D5', 'F#5', 'A5', 'C6'])]
t, i = 6.3, 0
while t < 20.0 - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .26, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .42, -.15)
    t += B; i += 1
for k, p in enumerate(['C6', 'E6', 'G6']): n(20.0 + k * .06, 'glockenspiel', p, .6, .3, .25)   # the answer: one soft chime, then quiet
groove(23.3, DUR - .6, ['C', 'F', 'G', 'C'], v=.42, wood=False)
for p in ['C2', 'E4', 'G4', 'C5']: n(DUR - .6, 'contrabass_pizz' if p == 'C2' else 'ukulele', p, .6, .4, 0)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(20.25, 23.25)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
