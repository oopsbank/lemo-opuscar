# Score for "The Bristle Wall": playful marimba + pizzicato (C major, 112 BPM) → cut dead on the freeze frame → back, bouncier, for the city →
# thinning to one hanging marimba note → low strings, tremolo and a quickening pulse for the gap → a brass burst on the rescue → silence →
# one warm low piano note for the truth → a whistled tune (flute + piccolo) as the city fixes its signs, cut off when everyone turns to stare.
# Writes $OUT/score.wav. Run with LIB=<library root> OUT=<folder>.
import os, sys, json
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(5)
DUR = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'story.json')))['dur']
B = 60 / 112
ev = []
def n(t, inst, p, d, v, pan=0): ev.append((t, inst, p, d, v, pan, 1))

CH = {'C': ['C3', 'G3', 'E4'], 'F': ['F2', 'C3', 'A3'], 'G': ['G2', 'D3', 'B3'], 'Am': ['A2', 'E3', 'C4'], 'Dm': ['D3', 'A3', 'F4']}
ARP = {'C': ['C5', 'E5', 'G5', 'E5'], 'F': ['F4', 'A4', 'C5', 'A4'], 'G': ['G4', 'B4', 'D5', 'B4'], 'Am': ['A4', 'C5', 'E5', 'C5'], 'Dm': ['D5', 'F5', 'A5', 'F5']}

def playful(t0, t1, prog, mar=.32, pizz=.3, busy=1):
    t, i = t0, 0
    while t < t1 - 1e-6:
        c = prog[i % len(prog)]
        for b in range(4):
            tb = t + b * B
            if tb >= t1: break
            n(tb, 'cellos_pizz', CH[c][0] if b % 2 == 0 else CH[c][1], B, pizz * (1 if b == 0 else .7), -.25)
            for k in range(2 if busy else 1):
                tk = tb + k * B / 2
                if tk >= t1: break
                n(tk, 'marimba', ARP[c][(b * 2 + k) % 4], B / 2, mar * (1 if k == 0 else .75), .25)
            if busy and b in (1, 3): n(tb, 'violins_pizz', CH[c][2], B / 2, pizz * .6, .1)
        t += 4 * B; i += 1

# 0 – 3.25: Duke's lazy spa, a slow marimba; cut dead at the freeze
playful(0.0, 3.25, ['C', 'F'], mar=.26, pizz=.18, busy=0)
# 4.0 – 15: back, cheeky; the city
playful(4.05, 7.0, ['C', 'G'], mar=.3, pizz=.24, busy=1)
playful(7.0, 15.0, ['C', 'F', 'G', 'C'], mar=.34, pizz=.32, busy=1)
# 15 – 27: Squish, a little lighter
playful(15.0, 26.6, ['F', 'C', 'G', 'C'], mar=.28, pizz=.24, busy=1)
# 27 – 30: thinning to one hanging marimba note
for k, p in enumerate(['E5', 'C5', 'G4']): n(26.8 + k * B, 'marimba', p, B, .24 - k * .05, .2)
n(29.0, 'marimba', 'B4', 2.5, .16, .2)
# 30 – 44: the gap — low strings, tremolo, quickening ticks (the ticks are in the mix)
for t0, p, v in [(30.4, 'C2', .4), (33.4, 'C#2', .44), (36.4, 'D2', .5), (39.4, 'D#2', .56), (42.0, 'E2', .62)]:
    n(t0, 'contrabass', p, 3.1, v, -.1); n(t0, 'cellos', p.replace('2', '3'), 3.1, v * .8, -.2)
for t0, p in [(31.0, 'G4'), (34.0, 'G#4'), (37.0, 'A4'), (40.0, 'A#4'), (42.5, 'B4')]: n(t0, 'violins_trem', p, 2.9, .22, .25)
for k in range(12): n(31.0 + k * 1.05 - k * k * .02, 'timpani', 'C2', .8, .18 + k * .025, 0)   # a heartbeat that speeds up
# 48.0: the brass burst on the rescue
for k, p in enumerate(['C3', 'G3', 'C4', 'E4', 'G4', 'C5']): n(48.0 + k * .01, ['trombone', 'trombone', 'horn', 'horn', 'trumpet', 'trumpet'][k], p, 1.1, .5, -.3 + k * .12)
n(48.0, 'timpani', 'C2', 1.5, .5, 0)
# 50.3: one warm low piano note, then soft strings under the truth
n(50.4, 'piano', 'C2', 4, .4, 0); n(50.45, 'piano', 'G2', 4, .26, 0)
n(51.0, 'violas', 'E3', 5, .14, -.2); n(51.0, 'cellos', 'C3', 5, .16, .2)
n(56.2, 'piano', 'E4', 2, .2, .1); n(57.0, 'piano', 'G4', 2, .18, .1); n(58.0, 'piano', 'C5', 2, .16, .1)
# 60 – 68.9: whistling (flute doubled by piccolo) over pizzicato; cut dead at the stare
WH = [('E5', 1), ('G5', .5), ('A5', .5), ('G5', 1), ('E5', 1), ('C5', 1), ('D5', .5), ('E5', .5), ('D5', 2),
      ('E5', 1), ('G5', .5), ('A5', .5), ('C6', 1), ('A5', 1), ('G5', 1), ('E5', .5), ('D5', .5), ('C5', 2)]
t = 60.4
for p, d in WH:
    if t >= 68.85: break
    n(t, 'flute', p, min(d * B * .92, 68.85 - t), .3, -.1); n(t, 'piccolo', p, min(d * B * .92, 68.85 - t), .1, .2); t += d * B
playful(60.4, 68.85, ['C', 'Am', 'F', 'G'], mar=.16, pizz=.26, busy=0)

mix = S.render(ev, dur=DUR + .3)
mix = S.room(mix, size=.45, mix=.18)
tt = np.arange(len(mix)) / SR
gate = np.ones_like(tt)
gate[(tt >= 3.25) & (tt < 4.0)] = 0                     # the record-scratch silence
gate *= np.where(tt >= 68.85, np.clip(1 - (tt - 68.85) / .05, 0, 1), 1)   # the whistle cuts off
gate *= np.where((tt > 48.9) & (tt < 50.3), np.clip(1 - (tt - 48.9) / .5, 0, 1), 1)   # hush after the rescue
mix *= gate[:, None]
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR)
print('score →', os.path.join(OUT, 'score.wav'), f'{len(mix) / SR:.1f}s')
