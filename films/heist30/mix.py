# The Last Train Heist — 35 s recut: the sound is cut from the full film's SFX mix (films/heist/out/mix.wav) slice by slice,
# following the recut's segments (story time → the full film's time), with short crossfades, a soft whoosh on each hard cut,
# and the clock beeps for the 23:59 / 00:00 badges → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
src, sr = sf.read(os.path.join(ROOT, 'films/heist/out/mix.wav'), dtype='float32'); assert sr == SR
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
cuts = [e for e in E['ev'] if e['type'] == 'cut']
SL = (43.55, 44.0, .3); t1 = SL[0] + (SL[1] - SL[0]) / SL[2]
def orig(s): return s if s <= SL[0] else (SL[0] + (s - SL[0]) / SL[2] if s <= SL[1] else t1 + (s - SL[1]))
out = np.zeros((N, 2), np.float32); X = int(.04 * SR)
for i, c in enumerate(cuts):
    f0 = c['t']; f1 = cuts[i + 1]['t'] if i + 1 < len(cuts) else DUR
    a = int(round(orig(c['s0']) * SR)) - X; n = int(round((f1 - f0) * SR)) + 2 * X
    piece = src[max(0, a):max(0, a) + n].copy()
    if len(piece) < n: piece = np.pad(piece, ((0, n - len(piece)), (0, 0)))
    ramp = np.linspace(0, 1, 2 * X)[:, None]; piece[:2 * X] *= ramp; piece[-2 * X:] *= ramp[::-1]
    o = int(round(f0 * SR)) - X; lo = max(0, o); hi = min(N, o + n); out[lo:hi] += piece[lo - o:hi - o]
    if i: add(out, whoosh(.35, .05), max(0, f0 - .12), 1, 0)
def tone(f, d, v): t = t_(d); return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .03) * v
for t0 in (0.02, 33.25): add(out, tone(2000, .1, .08), t0, 1, 0); add(out, tone(2000, .1, .08), t0 + .16, 1, 0)
r = int(.05 * SR); out[-r:] *= np.linspace(1, 0, r)[:, None]
out = limit(out * (.85 / max(1e-6, np.abs(out).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), out, SR); print('mix', DUR, 's', len(cuts), 'slices')
