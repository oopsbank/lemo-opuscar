# Score + SFX + voices for the 10 s test → out/mix.wav (48 kHz stereo); master with ffmpeg loudnorm (−14 LUFS, −1.5 dBTP).
# 120 bpm (a bar = 2 s), C major office pop: C · Am · F · G, light plucks, a soft bass, a shaker; a stop for the reveal, then a
# bright tag; ducked under the voices.
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import *
DUR = 10.0; N = int(DUR * SR); tt = np.arange(N) / SR
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); vo = np.zeros((N, 2))
B = .5
def note(f, d, kind='pluck', v=1.0):
    x = t_(d)
    if kind == 'pluck': y = (np.sin(2 * np.pi * f * x) + .4 * np.sin(4 * np.pi * f * x) + .15 * np.sin(6 * np.pi * f * x)) * np.exp(-x / .25)
    elif kind == 'bass': y = np.tanh(1.5 * np.sin(2 * np.pi * f * x)) * np.exp(-x / .5) * np.clip(x / .01, 0, 1)
    elif kind == 'bell': y = (np.sin(2 * np.pi * f * x) + .3 * np.sin(2 * np.pi * f * 2.76 * x)) * np.exp(-x / .6)
    else: y = np.sin(2 * np.pi * f * x) * np.exp(-x / .4)
    return y * np.clip((d - x) / .02, 0, 1) * v
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]   # Cmaj7 Am7 Fmaj7 G7
STOP = (3.35, 4.0)   # the music holds its breath while the monitor turns
for bar in range(5):
    t0 = bar * 2.0; ch = CH[bar % 4] if bar < 4 else CH[0]
    for k in range(8):   # off-beat plucks
        t = t0 + k * B + (B / 2 if k % 2 else 0)
        if STOP[0] <= t < STOP[1]: continue
        m = ch[(k * 3) % 4] + 12; add(mus, note(hz(m), .3, 'pluck', .18), t, pan=(-.3 if k % 2 else .3))
    for k in range(4):   # bass on the beats
        t = t0 + k * B
        if STOP[0] <= t < STOP[1]: continue
        add(mus, note(hz(ch[0] - 24 + (7 if k == 2 else 0)), .45, 'bass', .3), t)
    for k in range(8):   # shaker
        t = t0 + k * (B / 2)
        if STOP[0] <= t < STOP[1]: continue
        add(mus, hp(noise(.05), 6000) * np.exp(-t_(.05) / .012) * (.12 if k % 2 else .07), t, pan=.4)
# the reveal tag (4.0) and a little end tag (9.0): bells up the chord
for i, m in enumerate([72, 76, 79, 84]): add(mus, note(hz(m), .8, 'bell', .22), 3.95 + i * .08, pan=-.2 + i * .13)
for i, m in enumerate([79, 84]): add(mus, note(hz(m), 1.0, 'bell', .2), 9.0 + i * .12)
# voices (24 kHz Kokoro → 48 kHz), panned to their sides
VO = {'c1': (.15, .25), 'h1': (2.3, -.25), 'h2': (4.4, -.25), 'c2': (7.5, .25)}
vmask = np.zeros(N)
for id_, (t, pan) in VO.items():
    x, sr = sf.read(os.path.join(HERE, 'voices', id_ + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    x = x / (np.abs(x).max() + 1e-9) * .8; add(vo, x, t, pan=pan)
    s = int(t * SR); vmask[s:s + len(x)] = 1
# SFX: the spin (whoosh + plastic clunk + a boot chime), a sparkle at the reveal, a ding for "genius"
add(fx, whoosh(.5, .5), 3.3, pan=-.1); add(fx, thump(.35, 110), 3.9); add(fx, clack(1.2, .35), 3.9)
for i, f in enumerate([1046, 1318, 1568]): add(fx, np.sin(2 * np.pi * f * t_(.25)) * np.exp(-t_(.25) / .08) * .25, 3.95 + i * .07)
add(fx, hp(noise(.6), 5000) * np.exp(-t_(.6) / .15) * .12, 4.0, pan=.1)
add(fx, ding(.35), 9.0)
# room tone: office hum and distant keys
amb = lp(noise(DUR), 300) * .02; keys = np.zeros(N)
rng = np.random.default_rng(4)
for t in np.sort(rng.uniform(0, DUR, 26)): s = int(t * SR); c = click(.7 + rng.random() * .3, .04); keys[s:s + len(c)] += c[:N - s]
add(fx, amb + keys, 0)
# duck the music under the voices
from scipy.ndimage import uniform_filter1d
duck = 1 - .45 * uniform_filter1d(vmask, int(.15 * SR))
out = mus * duck[:, None] + fx + vo
out = np.stack([limit(out[:, 0], .9), limit(out[:, 1], .9)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix_raw.wav'), out, SR, subtype='PCM_24')
print('ok')
