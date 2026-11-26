# Score for "Red Flag" (Toon on Set demo): a 120 BPM light-comedy band of sampled instruments (VSCO 2 CE + VCSL, CC0).
# Pizzicato oom-pah, bassoon staccato, clarinet staccato tune, marimba, xylophone, woodblock. It stops dead at 6.5 s and 18.4 s.
# Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, t_, env_exp

S.seed(7)
B = .5                      # one beat at 120 BPM
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
ev = []
def n(t, inst, p, d, v, pan=0, g=1): ev.append((t, inst, p, d, v, pan, g))

# —— A: the walk-in groove, C major (0 – 6.5) ——
def oompah(t0, t1, roots, v=.7):
    t, i = t0, 0
    while t < t1 - 1e-6:
        r = roots[i % len(roots)]
        n(t, 'contrabass_pizz', r, .4, v, -.15)
        n(t + B, 'violins_pizz', {'C2': 'E4', 'G1': 'D4', 'F1': 'C4', 'A1': 'C4'}.get(r, 'E4'), .3, v * .62, .3)
        n(t + B, 'violas_pizz', {'C2': 'G3', 'G1': 'B3', 'F1': 'A3', 'A1': 'A3'}.get(r, 'G3'), .3, v * .55, .2)
        t += 2 * B; i += 1
oompah(0, 6.5, ['C2', 'G1', 'C2', 'G1', 'F1', 'G1', 'C2'])
# the tune (clarinet staccato), answered by the bassoon
tune = [(0, 'G4', .5), (1, 'E4', .5), (1.5, 'G4', .5), (2, 'C5', .5), (3, 'B4', .5), (3.5, 'A4', .5), (4, 'G4', 1),
        (6, 'F4', .5), (6.5, 'A4', .5), (7, 'G4', .5), (7.5, 'F4', .5), (8, 'E4', .5), (9, 'D4', .5), (10, 'G4', .5), (10.5, 'A4', .5), (11, 'B4', .5), (12, 'C5', .4)]
for b, p, d in tune: n(b * B, 'clarinet_stac', p, d * B, .62, -.25)
for b, p in [(4.5, 'G2'), (5, 'A2'), (5.5, 'B2'), (8.5, 'C3'), (9.5, 'B2'), (11.5, 'D3')]: n(b * B, 'bassoon_stac', p, .25, .6, .1)
for b in range(6, 13): n(b * B + B / 2, 'woodblock', 'b', None, .32, .35)          # the walk ticks on the off-beats
for b, p in [(6, 'E5'), (8, 'G5'), (10, 'F5'), (12, 'E5')]: n(b * B, 'marimba', p, .4, .45, .3)
# —— the sting on "Red flag?!" (6.75): xylophone run up, bassoon bwomp, slide whistle (synth, mix.py) ——
for i, p in enumerate(['C5', 'E5', 'G5', 'C6', 'E6']): n(6.75 + i * .035, 'xylophone', p, .3, .65, .2)
n(6.75, 'bassoon_stac', 'C2', .4, .8, 0); n(6.75, 'contrabass_pizz', 'C1', .4, .8, 0)

# —— B: sneaky, A minor (8.5 – 13) ——
sneak = ['A3', 'E3', 'A3', 'E3', 'F3', 'E3', 'D#3', 'E3']
t = 8.5; i = 0
while t < 13 - 1e-6:
    n(t, 'cellos_pizz', sneak[i % 8], .2, .55 + .1 * (i % 2 == 0), -.2)
    if i % 4 == 0: n(t, 'bassoon_stac', 'A2', .2, .55, .1)
    t += B / 2 if t > 10.5 else B; i += 1
n(9.55, 'cellos_pizz', 'A2', .5, .95, -.2); n(9.55, 'contrabass_pizz', 'A1', .5, .95, 0); n(9.55, 'violins_pizz', 'D#5', .5, .8, .3); n(9.55, 'xylophone', 'D#6', .4, .7, .3)   # "DANGER?"
for b, p in [(0, 'C5'), (1, 'B4'), (2, 'C5'), (3, 'E5')]: n(8.75 + b * B, 'clarinet_stac', p, .2, .5, -.3)
for k in range(int((13 - 10.5) / (B / 4))): n(10.5 + k * B / 4, 'violins_pizz', 'E5' if k % 2 else 'F5', .1, .28 + .1 * (k % 4 == 0), .35)   # the tremble

# —— C: deadpan explanation, C major again (13 – 18.4) ——
oompah(13, 18.4, ['C2', 'A1', 'F1', 'G1', 'C2', 'G1'], v=.55)
arp = ['C5', 'E5', 'G5', 'E5']
for k in range(int((18.4 - 13) / B)): n(13 + k * B, 'marimba', arp[k % 4], .3, .38, .25)
for b, p, d in [(0, 'E4', 2), (2, 'D4', 1), (3, 'C4', 1), (4, 'G4', 2), (6, 'F4', 1), (7, 'E4', 1)]: n(14 + b * B, 'clarinet_stac', p, d * B * .5, .5, -.25)
for i, p in enumerate(['G5', 'C6', 'E6', 'G6']): n(16.95 + i * .05, 'xylophone', p, .3, .55, .2)   # the door: a small ta-da
n(17.4, 'violins_pizz', 'G5', .3, .6, .3); n(17.4, 'violas_pizz', 'C5', .3, .55, .2); n(17.4, 'contrabass_pizz', 'C2', .4, .7, -.1)
# 18.4: everything stops. Silence (room tone + crickets in mix.py) until the sheepish wah-wah
for i, p in enumerate(['G2', 'F#2', 'F2']): n(19.95 + i * .32, 'bassoon', p, .3 if i < 2 else .7, .7, 0)
# —— D: the callback button (20.6 – 22.4) ——
oompah(20.6, 21.1, ['C2'], v=.5)
n(21.2, 'contrabass_pizz', 'C2', .6, .85, -.1); n(21.2, 'cellos_pizz', 'G3', .6, .7, -.2); n(21.2, 'violins_pizz', 'E5', .6, .7, .3); n(21.2, 'violins_pizz', 'C5', .6, .7, .3)
n(21.2, 'xylophone', 'C6', .8, .7, .25); n(21.2, 'marimba', 'C5', .8, .5, .2)

mix = S.render(ev, dur=DUR + .3)
# hard stops: the music cuts dead (reverb tails included) at 6.5 and 18.4; the 6.75 sting rings on its own
def cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    mix[i:i + f] *= np.linspace(1, 0, f)[:, None]; mix[i + f:j] = 0
mix = S.room(mix, size=.25, mix=.12)
cut(6.5, 6.74); cut(18.4, 19.94)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
