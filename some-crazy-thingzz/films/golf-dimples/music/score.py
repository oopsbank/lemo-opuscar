# Score for "Sand Trap" (Toon on Set): a jaunty 120 BPM golf-comedy band of sampled instruments (VSCO 2 CE + VCSL, CC0; ukulele from FreePats, CC0).
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

CH = {'G': ('G1', ['G4', 'B4', 'D5']), 'C': ('C2', ['G4', 'C5', 'E5']), 'D7': ('D2', ['F#4', 'A4', 'C5']), 'Em': ('E2', ['G4', 'B4', 'E5']), 'Am': ('A1', ['A4', 'C5', 'E5'])}
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

# —— A: the sanding groove (0 – 7.25) ——
groove(0, 7.25, ['G', 'D7', 'G', 'C'])
tune = [(0, 'D5', .5), (.5, 'B4', .5), (1, 'D5', .5), (1.5, 'G5', 1), (3, 'F#5', .5), (3.5, 'E5', .5), (4, 'D5', 1),
        (6, 'C5', .5), (6.5, 'E5', .5), (7, 'D5', .5), (7.5, 'B4', .5), (8, 'G4', 1), (10, 'A4', .5), (10.5, 'B4', .5), (11, 'C5', .5), (11.5, 'D5', 1)]
for b, p, d in tune: n(b * B, 'marimba', p, d * B, .5, .2)
for b, p in [(2.5, 'B4'), (3, 'D5'), (5, 'A4'), (5.5, 'C5'), (9.5, 'B4'), (10, 'D5'), (12.5, 'G5'), (13, 'F#5'), (13.5, 'E5')]: n(b * B, 'clarinet_stac', p, .2, .45, -.25)
for k, p in enumerate(['D6', 'G6', 'B6']): n(5.38 + k * .05, 'glockenspiel', p, .4, .4, .3)   # the shine
# 6.0 – 7.25: the waggle: a held tremolo, rising
n(6.2, 'violins_trem', 'D5', 1.05, .35, .3, .55); n(6.2, 'violas', 'A4', 1.05, .25, .1, .5)
for tb in np.arange(6.9, 7.25, B / 4): n(tb, 'timpani', 'D2', .3, .35 + (tb - 6.9), 0)
# —— B: silence, then the sad wah-wah (8.55 – 9.15) ——
for k, p in enumerate(['A2', 'G#2', 'G2']): n(8.55 + k * .22, 'bassoon_stac', p, .2, .7, -.05)
n(8.55 + 3 * .22, 'tuba_stac', 'F#1', .4, .75, 0); n(8.55 + 3 * .22, 'bassoon_stac', 'F#2', .4, .7, -.05)
# —— C: the "Actually…" sting (10.15): two bright marimba notes + glockenspiel + a soft cymbal ——
n(10.12, 'marimba', 'E5', .3, .75, .1); n(10.32, 'marimba', 'B5', .5, .8, .1); n(10.32, 'glockenspiel', 'B6', .6, .5, .25); n(10.32, 'xylophone', 'E6', .4, .45, -.2)
n(10.32, 'sus_cymbal', 'bell', .8, .25, .1)
# —— D: the smoke board (11.2 – 16.4): marimba arpeggios over pizzicato, light ——
prog = [('Em', ['E5', 'G5', 'B5', 'G5']), ('C', ['C5', 'E5', 'G5', 'E5']), ('G', ['D5', 'G5', 'B5', 'G5']), ('D7', ['D5', 'F#5', 'A5', 'C6'])]
t, i = 11.2, 0
while t < 16.4 - 1e-6:
    ch, arp = prog[(i // 4) % 4]
    n(t, 'marimba', arp[i % 4], .3, .32, .2)
    if i % 4 == 0: n(t, 'contrabass_pizz', CH[ch][0], .4, .5, -.15); n(t, 'cellos_pizz', CH[ch][1][0].replace('4', '3'), .3, .35, -.2)
    t += B; i += 1
# —— E: the groove back for the handoff (16.4 – 18.95) ——
groove(16.4, 18.95, ['G', 'Em', 'C', 'D7'], v=.6, wood=False)
for b, p in [(0, 'B4'), (1, 'D5'), (2, 'G5'), (4, 'F#5'), (4.5, 'E5'), (5, 'D5')]: n(16.4 + b * B, 'clarinet_stac', p, .2, .42, -.25)
# —— F: the drive: xylophone run up (18.95 – 19.45), the hit, a bright ride up, the twinkle ——
run = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'D6']
for k, p in enumerate(run): n(18.95 + k * .042, 'xylophone', p, .2, .45 + k * .03, .2)
n(19.45, 'timpani', 'G2', .9, .8, 0); n(19.45, 'clash', 'short', None, .45, .1); n(19.45, 'contrabass_pizz', 'G1', .4, .8)
for k, p in enumerate(['G5', 'B5', 'D6', 'G6']): n(19.5 + k * .06, 'glockenspiel', p, .6, .45, .25)
n(19.5, 'violins_trem', 'G5', 1.7, .3, .3, .55); n(19.5, 'violas', 'D5', 1.7, .25, .1, .5)
groove(19.95, 21.8, ['G', 'C'], v=.6)
for k, p in enumerate(['D7', 'G7']): n(21.2 + k * .08, 'glockenspiel', p, .8, .5, .35)
# —— G: the last line: thin groove, no cadence; ends mid-bar on the dominant (the cut back to frame 0) ——
groove(21.8, DUR + .3, ['G', 'D7'], v=.5, wood=False)
for b, p in [(2, 'B4'), (2.5, 'D5'), (6, 'C5'), (6.5, 'A4'), (7, 'F#4')]: n(21.8 + b * B, 'clarinet_stac', p, .2, .38, -.25)
n(24.55, 'bassoon_stac', 'D3', .2, .5); n(24.65, 'bassoon_stac', 'F#3', .2, .5); n(24.75, 'bassoon_stac', 'A3', .2, .55)

mix = S.render(ev, dur=DUR + .3)
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.22, mix=.12)
cut(7.25, 8.5); cut(9.3, 10.1)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
