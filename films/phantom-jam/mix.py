# The Phantom Jam — mix: town ambience + traffic + brake squeaks + horns + siren + narration + score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
ARR = Tv('arrive')[0]['t']
rng = np.random.default_rng(9)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
REAL = [(7.0, 11.0), (25.4, 29.4)]
tl = np.ones(N)
for a, b in REAL: tl *= 1 - win(a, b, .05, .1)
# beds: sped-up town grain in time-lapse; in real time, an idling queue (engines), birds, a far city
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * 12 * tt) ** 2)
amb[:, 0] += grain * tl * .03; amb[:, 1] += np.roll(grain, 911) * tl * .03
idle = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (31 + 2 * np.sin(tt * .7)) / SR))), 300) + .4 * lp(colored(30, 300), 200)
amb += (idle * .045 * (1 - tl))[:, None]
city = lp(colored(80, 1500), 1100); amb += (city * .03 * (1 - tl))[:, None]
traffic = bp(colored(150, 2500), 200, 2000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * .8 * tt)))
amb += (traffic * .03 * tl)[:, None]
# brake squeaks (quiet, many), horns that get more frequent as the jam grows
def squeal(d=.3, v=1.):
    t = t_(d); f = rng.uniform(1800, 2600) - 500 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * v
def horn(f=420, d=.25, v=1.):
    t = t_(d); s = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * .5; return lp(s, 2500) * np.minimum(1, (d - t) / .03) * np.minimum(1, t / .01) * v
for e in Tv('stop'): add(fx, squeal(.25, .012), e['t'], 1, e.get('pan', 0))
for e in Tv('brake1'): add(fx, squeal(.5, .04), e['t'], 1, 0)
for t0 in sorted(rng.uniform(4, 25, 14)): 
    if not any(a <= t0 < b for a, b in REAL): add(fx, horn(rng.choice([380, 420, 470]), .22, .03), t0, 1, rng.uniform(-.6, .6))
for t0 in (8.4, 9.9): add(fx, horn(400, .5, .04), t0, 1, .4)
# the ambulance's siren (two-tone), heard from the start, off after it turns in
sir_f = np.where(np.sin(2 * np.pi * .75 * tt) > 0, 700, 940)
siren = lp(np.sign(np.sin(np.cumsum(2 * np.pi * sir_f / SR))), 2400) * .4 + np.sin(np.cumsum(2 * np.pi * sir_f / SR)) * .6
near = .4 + .6 * np.maximum(win(3, 11, .3, .3), win(25.4, 29.4, .3, .3))
fx += (siren * .022 * near * seg(tt, 1.5, 2.5) * (1 - seg(tt, ARR + 1.2, ARR + 2.2)))[:, None]
for e in Tv('real'): add(fx, whoosh(.5, .05)[::-1], e['t'] - .5, 1, 0)
for e in Tv('resume'): add(fx, whoosh(.45, .07), e['t'] - .05, 1, 0)
for e in Tv('arrive'): add(fx, squeal(.35, .03), e['t'] + .2, 1, -.2)
for e in Tv('cut'):
    if e['t'] not in (7.0, 25.4): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)
# voice
vo_env = np.zeros(N)
for e in Tv('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = compress(x / max(1e-6, np.abs(x).max()), thr=.3, ratio=3.0); x = x / max(1e-6, np.abs(x).max()) * .62
    add(vo, x, e['t'], 1, 0)
    i0, i1 = int(e['t'] * SR), min(N, int(e['t'] * SR) + len(x)); vo_env[max(0, i0 - int(.12 * SR)):min(N, i1 + int(.2 * SR))] = 1
mus, _ = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
duck = 1 - .74 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * .95 * duck[:, None] + amb + fx * .9 + vo
r = int(.02 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * .95 * duck[:, None]), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
