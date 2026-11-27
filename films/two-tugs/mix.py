# Two Tugs — mix: harbour bed (water, gulls, crowd), tug diesels that rise with their pull, ship horn, the line snap, the sailboat,
# fenders creaking at the stop, narration, score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
STOP = Tv('stop')[0]['t']; SNAP = Tv('snap')[0]['t']; SAIL = Tv('sail')[0]['t']
rng = np.random.default_rng(6)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
real = np.maximum(win(11.5, 13, .05, .1), win(21.5, 26.5, .05, .1)); tl = 1 - real
pt = [e['t'] for e in Tv('pull')]; R = np.interp(tt, pt, [e['r'] / 100 for e in Tv('pull')]); B = np.interp(tt, pt, [e['b'] / 100 for e in Tv('pull')]); G = np.interp(tt, pt, [e['gap'] for e in Tv('pull')])
water = lp(colored(60, 900), 700) * (.6 + .4 * np.abs(np.sin(2 * np.pi * .17 * tt)))
amb += (water * .08)[:, None]
lap = hp(colored(300, 3000), 400) * (np.sin(2 * np.pi * .9 * tt) > .6)
amb[:, 0] += lap * .02; amb[:, 1] += np.roll(lap, 4000) * .02
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * 12 * tt) ** 2); amb += (grain * tl * .02)[:, None]
crowd = bp(colored(250, 2500), 300, 1800) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 1.7 * tt))) * (.4 + .6 * np.clip((20 - G) / 18, 0, 1))
amb += (crowd * .03)[:, None]
for t0 in np.cumsum(rng.uniform(.8, 2.5, 30)):
    if t0 > DUR - 1: break
    d = .5; t = t_(d); f = 1800 + 900 * np.exp(-t * 6); gull = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) ** 2
    add(amb, hp(gull, 900) * .012, t0, 1, rng.uniform(-.8, .8))
def diesel(f0, k, pan):
    f = f0 * (1 + .6 * k); x = lp(np.sign(np.sin(np.cumsum(2 * np.pi * f / SR))), 500) + .5 * lp(colored(30, 200), 150)
    return x * (.012 + .05 * k)
dr = diesel(26, R, -.4) * seg(tt, 1.5, 3.5); db = diesel(22, B, .4) * seg(tt, 2, 4) * (1 - .8 * win(SNAP, SNAP + 4.6, .1, .8))
fx[:, 0] += dr * .7 + db * .4; fx[:, 1] += dr * .4 + db * .7
wash = hp(colored(400, 5000), 600) * (R + B) * .02; fx += wash[:, None]
# the ship's horn at the start (it can't stop), and a short toot when it does
def shiphorn(d, v):
    t = t_(d); s = sum(np.sin(2 * np.pi * f * t) / (k + 1) for k, f in enumerate((92, 184, 276, 368))); return lp(s, 900) * np.minimum(1, t / .15) * np.minimum(1, (d - t) / .3) * v
add(fx, shiphorn(1.6, .09), .05, 1, 0); add(fx, shiphorn(.8, .07), STOP + 1.2, 1, 0)
# the snap: a crack, a whip, a splash
add(fx, hp(noise(.08), 2000) * np.exp(-t_(.08) / .01) * .35, SNAP, 1, -.3); add(fx, whoosh(.4, .08), SNAP + .05, 1, -.3)
add(fx, hp(noise(1.0), 700) * np.exp(-t_(1.0) / .25) * .1, SNAP + 1.0, 1, -.3)
# fenders squeezing at the stop: a deep rubber creak
d = 1.2; t = t_(d); creak = np.sin(np.cumsum(2 * np.pi * (55 + 25 * np.sin(2 * np.pi * 3 * t)) / SR)) * np.sin(np.pi * t / d) * .12
add(fx, lp(creak, 400), STOP - .3, 1, 0); add(fx, thump(.4, 50), STOP - .1, 1, 0)
for e in Tv('real'): add(fx, whoosh(.5, .05)[::-1], e['t'] - .5, 1, 0)
for e in Tv('resume'): add(fx, whoosh(.45, .07), e['t'] - .05, 1, 0)
for e in Tv('cut'):
    if e['t'] not in (11.5, 21.5): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)
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
mus *= np.clip((tt - .4) / .4, 0, 1)[:, None] * .7 + .3 * np.clip(tt / .4, 0, 1)[:, None]
duck = 1 - .74 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * .95 * duck[:, None] + amb + fx * .9 + vo
r = int(.02 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
