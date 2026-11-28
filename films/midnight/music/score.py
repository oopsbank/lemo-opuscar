# Midnight Crossing — a sparse original score (CC0 samples): a soft lonely piano over the drizzle (0–12); nothing but the bell
# after midnight (12–24); low cellos and tremolo violins creeping in under the shadow (24–38); contrabass and timpani pulses under
# the ghost train (38–51); the piano again, one note wrong, as life resumes (52–61); silence; one bowed vibraphone note for the eyes.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
E = json.load(open(os.path.join(HERE, '../events.json'))); DUR = E['dur']
T = {e['type']: e['t'] for e in E['ev'] if e['type'] not in ('cam', 'ding', 'wheel')}
S.seed(3)
N = []
def n(t, inst, p, d, v, pan=0, g=1.0): N.append((round(t, 3), inst, p, d, v, pan, g))
# 0–12: piano, slow (68 BPM), A minor, gentle
beat = 60 / 68
mel = ['E5', None, 'C5', 'D5', 'E5', None, 'G4', None, 'A4', None, 'C5', 'B4', 'A4', None]
for i, p in enumerate(mel):
    t = .4 + i * beat
    if t > T['clock'] - .3: break
    if p: n(t, 'piano', p, beat * 1.6, .32, .1)
for i, ch in enumerate([['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['C3', 'G3', 'E4'], ['G2', 'D3', 'B3']]):
    t = .4 + i * beat * 3.5
    if t > T['clock'] - .5: break
    for k, p in enumerate(ch): n(t + k * .12, 'piano', p, beat * 3.4, .22, -.2)
# 24–38: cellos drone, violins tremolo creeping up a semitone at a time
n(T['push0'], 'cellos', 'A2', T['light'] - T['push0'] + .5, .42, -.3)
n(T['push0'] + 2, 'contrabass', 'A1', T['light'] - T['push0'] - 1.5, .38, 0)
for i, p in enumerate(['E4', 'F4', 'F#4', 'G4', 'G#4']):
    t = T['push0'] + 3 + i * 2.4
    n(t, 'violins_trem', p, 2.8, .16 + i * .04, .3)
# 38–51: low pulses under the train
t = T['light']
while t < T['tail'] - .5:
    n(t, 'timpani', 'A2', .6, .45, 0); n(t, 'contrabass_pizz', 'A1', .5, .5, 0)
    t += 60 / 100 * 2
n(T['enter'], 'cellos', 'A2', T['tail'] - T['enter'], .5, -.3); n(T['enter'], 'violins_trem', 'A#4', T['tail'] - T['enter'], .3, .3)
n(T['enter'], 'gong', None, None, .35, 0)
# 52–61: the piano again, quieter, the last note one semitone wrong
for i, p in enumerate(['E5', 'C5', 'D5', 'E5', 'G4', 'A4', 'C5', 'B4', 'A#4']):
    t = T['stir'] + .2 + i * beat
    if t > T['glance0'] - .4: break
    n(t, 'piano', p, beat * 1.6, .26, .1)
n(T['stir'] + .2, 'piano', 'A2', 3, .2, -.2); n(T['stir'] + .2 + 3.5 * beat, 'piano', 'F2', 3, .2, -.2)
# the eyes: one bowed vibraphone note
n(T['eyes'], 'vibraphone_bowed', 'D#5', 1.6, .4, .3)
mix = S.render(N, dur=DUR)
mix = S.room(mix, size=.6, mix=.25)
sf.write(os.path.join(HERE, '../out/score.wav'), mix, SR)
print('score', len(N), 'notes')
