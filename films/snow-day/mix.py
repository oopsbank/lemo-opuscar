# Snow Day — mix: winter ambience + plough diesels and blades + foley (events.json) + narration + score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e['t'] for e in EV if e['type'] == ty]
rng = np.random.default_rng(3)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
REAL = [(14.5, 18.5), (27.5, 30.5)]
tl = np.ones(N)
for a, b in REAL: tl *= 1 - win(a, b, .05, .1)

# —— beds: winter wind (soft), sped-up town grain in time-lapse, a muffled town in real time, snowfall hush at the start and end ——
wind = lp(colored(80, 900), 600) * (.6 + .4 * np.sin(2 * np.pi * .13 * tt) ** 2)
amb[:, 0] += wind * .05; amb[:, 1] += np.roll(wind, 7000) * .05
grain = colored(900, 6000) * (.55 + .45 * np.sin(2 * np.pi * 11 * tt) ** 2)
amb[:, 0] += grain * tl * .025; amb[:, 1] += np.roll(grain, 911) * tl * .025
hush = hp(colored(2000, 9000), 1500)
snow = np.maximum(1 - seg(tt, .2, 2.2), seg(tt, 33.0, 34.2))
amb += (hush * .02 * snow)[:, None]

# —— the ploughs: three diesels (time-lapse: a sped-up buzz; real time: a slow chug), blade scrape ——
def diesel(f0, lfo):
    f = f0 * (1 + .03 * np.sin(2 * np.pi * lfo * tt)); ph = np.cumsum(2 * np.pi * f / SR)
    return lp(np.sign(np.sin(ph)) * .5 + np.sin(2 * ph) * .4 + np.sin(.5 * ph) * .4, 900)
eng = diesel(48, .3) * .6 + diesel(53, .41) * .5 + diesel(44, .23) * .4
eng_tl = lp(diesel(140, 2.1), 1600)
spin = (tt > 14.7) & (tt < 16.3)
rev = np.interp(tt, [14.5, 14.7, 16.2, 16.3, 17.1, 17.35, 17.75, 18.4, 27.5, 29.4, 29.6, 30.5], [.5, 1.4, 1.4, .6, .7, 1.8, 1.6, .8, .9, 1.2, .4, .4])
real_eng = lp(diesel(42, .5) * (1 + .6 * (rev - 1)), 1200) * np.clip(rev, .3, 2)
fx += ((eng_tl * .02 * tl) + real_eng * .05 * (1 - tl))[:, None]
scrape = bp(colored(400, 3000), 600, 2500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 7 * tt)))
fx += (scrape * .015 * tl * (1 - seg(tt, 29.4, 29.6)) * (tt < 30.5))[:, None]
whine = np.sin(np.cumsum(2 * np.pi * (900 + 120 * np.sin(2 * np.pi * 6 * tt)) / SR)) * spin
fx += (bp(whine + .5 * colored(800, 4000) * spin, 500, 4000) * .03)[:, None]
for t0 in Tv('beep'): d = .1; t = t_(d); add(fx, np.sin(2 * np.pi * 1200 * t) * np.minimum(1, (d - t) / .01) * .05, t0, 1, -.1)
for t0 in Tv('ram'): add(fx, whoosh(.5, .06), t0, 1, 0)
for t0 in Tv('burst'): add(fx, thump(.4, 55), t0, 1, 0); add(fx, bp(noise(1.2), 300, 6000) * env_exp(1.2, .3) * .12, t0, 1, 0)
for t0 in Tv('push'): add(fx, bp(noise(1.8), 200, 2000) * np.sin(np.pi * t_(1.8) / 1.8) * .05, t0, 1, .1)
for t0 in Tv('stop'): add(fx, thump(.15, 80), t0 + .1, 1, .1)
for t0 in Tv('tick'): add(fx, click(1.4, .25), t0, 1, -.4)
for t0 in Tv('bell'):
    d = 1.8; t = t_(d); ham = (np.sin(2 * np.pi * 22 * t) > 0).astype(float)
    b = (np.sin(2 * np.pi * 1850 * t) + .5 * np.sin(2 * np.pi * 4100 * t)) * (.4 + .6 * ham) * np.minimum(1, (d - t) / .3)
    add(fx, b * .07, t0, 1, .2)
cheer = bp(colored(400, 3500), 500, 3000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 2.7 * tt)))
for t0 in Tv('cheer'): amb += (cheer * .08 * win(t0, t0 + 2.4, .15, .8))[:, None]
for t0 in Tv('resume'): add(fx, whoosh(.45, .07), t0 - .05, 1, 0)
for t0 in Tv('cut'):
    if t0 not in (14.5,): add(fx, whoosh(.25, .03), t0 - .12, 1, 0)
# after the bell: traffic in time-lapse
traf = bp(colored(200, 3000), 300, 2500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 1.7 * tt)))
amb += (traf * .03 * seg(tt, 30.6, 31.6))[:, None]

# —— voice ——
vo_env = np.zeros(N)
for e in [e for e in EV if e['type'] == 'vo']:
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
# no fade-out: the film loops; a 20 ms ramp only, to avoid a click
r = int(.02 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]; mix[:r] *= np.linspace(0, 1, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * .95 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
