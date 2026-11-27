# Original score for "You Are a Night Museum Guard": a tiptoe pizzicato march in D minor (4/4, crotchet = 120, bar = 2 s)
# that freezes whenever you turn round, an Egyptian drone, three harp plucks for the spots, a party waltz in D major (3/4)
# and a dawn reprise. Synthesized + physically modelled strings. Writes out/music.wav and out/music_cues.json.
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, lp, hp, bp, noise, norm, t_
import pluck as PL

DUR = 61.0; N = int(DUR * SR); E8 = .25
rng = np.random.default_rng(9)
mus = np.zeros((N, 2)); cues = []
def place(x, at, g=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= N: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); n = min(len(x), N - s)
    mus[s:s + n, 0] += x[:n] * g * l * 1.414; mus[s:s + n, 1] += x[:n] * g * r * 1.414
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def recorder(m, d, v=.8):
    d = max(d, .08); x = t_(d + .12); f = hz(m)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.2 * x) * np.clip((x - .15) / .2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    tone = np.sin(ph) + .18 * np.sin(2 * ph) + .12 * np.sin(3 * ph) + .03 * np.sin(4 * ph)
    breath = bp(noise(len(x) / SR), f * .9, min(f * 3.5, 15000)) * .06
    env = np.clip(x / .025, 0, 1) * np.clip((d - x) / .06 + 1, 0, 1); env[x > d + .06] = 0
    chiff = np.exp(-x / .015) * bp(noise(len(x) / SR), 2000, 8000) * .25
    return (tone + breath) * env * v + chiff * v * .5
def reed(m, d, v=.8):           # bassoon-ish: buzzy pulse through a nasal formant
    d = max(d, .08); x = t_(d + .1); f = hz(m); ph = (f * x) % 1
    raw = np.where(ph < .32, 1.0, -.47) + .3 * np.sin(2 * np.pi * f * x)
    y = bp(raw, 120, 2400) + bp(raw, 420, 700) * .8
    env = np.clip(x / .03, 0, 1) * np.clip((d - x) / .05 + 1, 0, 1); env[x > d + .05] = 0
    return norm(y) * env * v
def guitar(m, d=1.2, v=.7): return PL.pluck('acoustic_guitar', m, d, vel=v)
def strum(ms, d=1.0, v=.6): return PL.strum('acoustic_guitar', ms, d, vel=v, spread=.018)
def pizz(m, d=.6, v=.8): return PL.pluck('upright_bass_pizz', m, d, vel=v)
def harp(m, d=2.5, v=.6): return PL.pluck('harp', m, d, vel=v)
def celesta(m, d=1.6, v=.6): return PL.pluck('music_box', m, d, vel=v)
def drum(kind='low', v=.8):
    if kind == 'low':
        x = t_(.35); f = 95 * np.exp(-x / .08) + 58
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .12) + lp(noise(.35), 900) * np.exp(-x / .02) * .4) * v
    x = t_(.18); return (bp(noise(.18), 900, 5000) * np.exp(-x / .025) + np.sin(2 * np.pi * 320 * x) * np.exp(-x / .03) * .4) * v * .7
def tamb(v=.5): x = t_(.25); return hp(noise(.25), 6000) * (np.exp(-x / .05) + .3 * np.exp(-((x - .03) / .02) ** 2)) * v
def pad(ms, d, v=.3):          # soft bowed strings: detuned saws, slow swell; nothing below MIDI 50
    x = t_(d + .6); y = np.zeros(len(x))
    for m in ms:
        for det in (-.07, 0, .06):
            f = hz(m + det); y += 2 * ((f * x + rng.random()) % 1) - 1
    y = lp(y, 1800); env = np.clip(x / .9, 0, 1) * np.clip((d + .6 - x) / .6, 0, 1)
    return y / len(ms) * env * v
def drone(m, d, v=.5):         # one held low bowed note with harmonics so it speaks on small speakers
    x = t_(d); f = hz(m); y = sum(a * np.sin(2 * np.pi * f * k * x + k) for k, a in [(1, 1), (2, .55), (3, .35), (4, .18), (5, .1)])
    y *= 1 + .08 * np.sin(2 * np.pi * 4.5 * x); return lp(y, 1400) * np.clip(x / 1.2, 0, 1) * np.clip((d - x) / .5, 0, 1) * v


def horn(m, d, v=.6, bend=0.0):
    x = t_(d + .15); f = hz(m) * (1 + bend * x / d) * (1 + .006 * np.sin(2 * np.pi * 5 * x)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .7), (3, .5), (4, .3), (5, .18), (6, .1)])
    env = np.clip(x / .06, 0, 1) * np.clip((d + .15 - x) / .15, 0, 1); return lp(y, 1800) * env * v
def vpizz(m, v=.6): return PL.pluck('upright_bass_pizz', m, .35, vel=v)      # pizzicato "violins": the bass model, high
def handdrum(v=.6): x = t_(.3); f = 180 * np.exp(-x / .05) + 120; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .09) + bp(noise(.3), 400, 3000) * np.exp(-x / .015) * .4) * v

# —— the tiptoe: per bar of 8 quavers, (quaver offset, MIDI) for the "bassoon"; None = rest ——
TIP = [
    [(0, 50), (2, 53), (4, 57), (6, 56), (7, 57)],
    [(0, 58), (2, 57), (4, 55), (6, 53), (7, 52)],
    [(0, 50), (2, 53), (4, 57), (5, 58), (6, 61), (7, 62)],
    [(0, 57), (1, 55), (2, 53), (3, 52), (4, 50)],
]
TCH = [[62, 65, 69], [62, 67, 70], [62, 65, 69], [61, 64, 69]]   # Dm, Gm, Dm, A
TROOT = [38, 43, 38, 45]
def tiptoe(t0, bars, start=0, v=.55, stop=None, celesta_on=True):
    for b in range(bars):
        tb = t0 + b * 2.0; cues.append(round(tb, 4)); k = (start + b) % 4
        for (o, m) in TIP[k]:
            at = tb + o * E8
            if stop is not None and at >= stop - 1e-6: continue
            place(reed(m, .16, v), at, .75, .15)
        for q in (0, 4):
            at = tb + q * E8
            if stop is None or at < stop - 1e-6: place(pizz(TROOT[k] if q == 0 else TROOT[k] + 7, .4, .7), at, .85, -.1)
        for q in (2, 6):
            at = tb + q * E8
            if stop is None or at < stop - 1e-6:
                for i, m in enumerate(TCH[k]): place(vpizz(m, .45), at + i * .006, .3, -.3 + .3 * i)
        if celesta_on and (stop is None or tb + 7 * E8 < stop):
            place(celesta(TCH[k][2] + 24, .8, .35), tb + 7 * E8, .3, .5)

# 0.5 → 10.0: tiptoe A (freezes as you turn round)
tiptoe(.5, 5, 0, stop=10.0)
place(celesta(93, 1.2, .5), 10.0, .5, .4); place(celesta(92, 1.2, .4), 10.5, .4, .4); cues.extend([10.0])
# 11.0 → 12.5: on again, dead stop as you turn and see it
tiptoe(11.0, 1, 2, stop=12.5)
place(pizz(37, 1.2, .9), 12.5, .9); place(celesta(97, 2.0, .5), 12.5, .35, .4)
# 15.5 → 17.0: the scurry: a fast pizzicato run up
for i, m in enumerate([50, 52, 53, 55, 57, 58, 60, 62]): place(vpizz(m, .6), 15.5 + i * .125, .5, -.2 + i * .03)
cues.append(15.5)  # the scurry ends on the cut at 16.5
# 16.5 → 28.0: tiptoe B, lighter (the dialogue sits on it)
tiptoe(16.5, 5, 0, v=.42, stop=26.5)
place(celesta(86, 1.6, .45), 26.0, .4, .4); place(celesta(90, 1.6, .4), 26.5, .35, .4)
# 28.0 → 37.0: Egypt: a low drone, hand drum, music-box arpeggios in D Phrygian dominant
place(drone(38, 9.0, .2), 28.0, .8); place(drone(45, 9.0, .12), 28.0, .5, .2)
EG = [74, 75, 78, 79, 81, 82, 85, 86]
for i in range(18):
    at = 28.0 + i * .5
    if at >= 37.0: break
    if i % 2 == 0: place(handdrum(.4 if i % 4 == 0 else .28), at, .5, -.15)
    if i % 2 == 1 or i > 8: place(celesta(EG[(i * 3) % 8], 1.4, .35), at, .35, .35 * np.sin(i))
cues.extend([28.0, 30.0, 32.0, 34.0, 36.0])
place(horn(50, .9, .45), 30.0, .5); place(horn(49, 1.2, .45, -.03), 34.5, .5)
# 37.5 → 39.0: one nervous pizz line as the torch flickers; then silence
for i, m in enumerate([50, 51, 50, 51]): place(vpizz(m, .45), 37.5 + i * .25, .5)
# 42.0 / 42.5 / 43.0: the spots — harp plucks rising
for at, m in [(42.0, 62), (42.5, 66), (43.0, 69)]: place(harp(m, 2.0, .65), at, .7, .2); place(harp(m + 12, 2.0, .4), at + .01, .4, .3)
cues.extend([42.0, 42.5, 43.0])
# 43.5 → 50.5: the party waltz in D major (bar = 1.5 s)
WALTZ = [[(0, 74), (1, 78), (2, 81)], [(0, 83), (1, 81), (2, 78)], [(0, 79), (1, 81), (2, 83)], [(0, 81), (2, 78)], [(0, 74), (1, 76), (2, 78)]]
WCH = [[62, 66, 69], [62, 67, 71], [61, 64, 67, 69], [62, 66, 69], [62, 66, 69]]
WR = [38, 43, 45, 38, 38]
for b in range(5):
    tb = 43.5 + b * 1.5; cues.append(tb)
    for (o, m) in WALTZ[b]:
        at = tb + o * .5
        if at < 50.5 - 1e-6: place(recorder(m, .42 if o < 2 else .5, .5), at, .75, .15)
    place(pizz(WR[b], .6, .8), tb, .9, -.1)
    for q in (1, 2):
        at = tb + q * .5
        if at < 50.5 - 1e-6: place(strum(WCH[b], .4, .45), at - .01, .5, -.25); place(tamb(.45), at, .4, .3)
    place(celesta(WCH[b][-1] + 24, 1.0, .3), tb, .3, .45)
place(harp(74, 1.5, .6), 50.5, .6); place(harp(86, 1.5, .4), 50.52, .4, .3); cues.append(50.5)
# 51.5 → 56.0: dawn: the tiptoe tune slowed into D major, recorder over harp
DAWN = [(51.5, 62, 1.0), (52.5, 66, .5), (53.0, 69, 1.0), (54.0, 71, .5), (54.5, 69, .5)]
for at, m, d in DAWN: place(recorder(m + 12, d * .95, .3), at, .6, .15)
for at, ch in [(51.5, [50, 57, 62, 66]), (53.5, [55, 59, 62, 67]), (55.0, [57, 61, 64, 69])]:
    for k, c in enumerate(ch): place(harp(c, 2.2, .4), at + k * .07, .5, -.3 + k * .15)
    cues.append(at)
place(pad([62, 66, 69], 4.5, .18), 51.5, 1)
# 56.5: the title chord; a celesta blip on the wink
cues.append(56.0)
for k, c in enumerate([38, 50, 57, 62, 66, 69, 74, 78, 81]): place(harp(c, 4.5, .5), 56.0 + k * .055, .6, -.3 + k * .07)
place(pad([62, 66, 69, 74], 4.8, .26), 56.0, 1); place(pizz(38, 2.5, .7), 56.0, .9)
place(celesta(93, 1.5, .55), 57.0, .45, .4); place(celesta(98, 1.5, .4), 57.5, .4, .4)
# —— small room reverb ——
L = int(1.0 * SR); ir = rng.standard_normal((L, 2)) * np.exp(-np.arange(L) / SR / .28)[:, None]; ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus[:, c], ir[:, c])[:N] for c in range(2)], 1)
out = hp((mus + wet * .2).T, 35).T; out /= max(1e-9, np.abs(out).max()) / .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/music.wav'), out.astype(np.float32), SR)
json.dump(sorted(set(round(c, 3) for c in cues)), open(os.path.join(HERE, 'out/music_cues.json'), 'w'))
print('music.wav', out.shape[0] / SR, 's;', len(cues), 'downbeats')
