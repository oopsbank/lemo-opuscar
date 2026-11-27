# All Green — mix: town and traffic beds, horns that grow with the gridlock, the crash, the tow truck, relay clicks as the lights come back,
# Engine 9's siren, narration, score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
ROLL = Tv('roll')[0]['t']
rng = np.random.default_rng(3)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
real = win(21.5, 26.0, .05, .1); tl = 1 - real
jt = [e['t'] for e in Tv('jam')]; jn = np.array([e['n'] for e in Tv('jam')], float); jam = np.interp(tt, jt, jn / max(1, jn.max()))
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * 12 * tt) ** 2)
amb[:, 0] += grain * tl * .025; amb[:, 1] += np.roll(grain, 911) * tl * .025
traffic = bp(colored(150, 2500), 200, 2000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * .8 * tt)))
amb += (traffic * .035 * (1 - .5 * jam))[:, None]
idle = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (31 + 2 * np.sin(tt * .7)) / SR))), 300) + .4 * lp(colored(30, 300), 200)
amb += (idle * (.02 + .03 * jam + .03 * real))[:, None]
birds = sum(np.sin(2 * np.pi * (3200 + 600 * np.sin(2 * np.pi * 9 * tt + k)) * tt) * (np.sin(2 * np.pi * .7 * tt + k * 2) > .85) for k in range(3)) * .006
amb += (birds * real)[:, None]
def horn(f=420, d=.25, v=1.):
    t = t_(d); s = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * .5; return lp(s, 2500) * np.minimum(1, (d - t) / .03) * np.minimum(1, t / .01) * v
for t0 in np.cumsum(rng.uniform(.15, .9, 120)):
    if t0 > DUR - .5: break
    j = float(np.interp(t0, jt, jn / max(1, jn.max())))
    if rng.random() < j * 1.3 and not (21.5 <= t0 < 26): add(fx, horn(rng.choice([360, 400, 440, 480]), rng.uniform(.15, .5), .02 + .03 * j), t0, 1, rng.uniform(-.7, .7))
for t0 in (22.3, 23.9): add(fx, horn(410, .6, .04), t0, 1, .3)
# the hit on frame 0: a long horn blast right at the lens
add(fx, horn(430, .7, .09), 0.0, 1, .1); add(fx, horn(470, .5, .06), .05, 1, -.2)
# the lights flip (relay clicks rippling), the crash, locks
for k in range(6): add(fx, clack(1.6, .05), Tv('flip')[0]['t'] + k * .07, 1, -.5 + k * .2)
c0 = Tv('crash')[0]['t']; add(fx, thump(.5, 80), c0, 1, .2); add(fx, hp(noise(.4), 1500) * np.exp(-t_(.4) / .06) * .2, c0, 1, .2); add(fx, horn(430, .9, .05), c0 + .4, 1, .2)
# tow truck: beacon-ish engine, reversing beeper, the hook
eng = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (36 + 6 * seg(tt, 14.1, 14.6)) / SR))), 400) * .03 * win(11.5, 16.5, .4, .6)
fx += eng[:, None]
h = Tv('hook')[0]['t']
for k in range(5): add(fx, np.sin(2 * np.pi * 1450 * t_(.15)) * .025, h - 1.1 + k * .2, 1, .2)
add(fx, clack(1.2, .25), h, 1, .2); add(fx, clack(1.0, .2), h + .2, 1, .2)
for e in Tv('fixed'): add(fx, clack(2.0, .12), e['t'], 1, rng.uniform(-.5, .5)); add(fx, ding(.05), e['t'] + .02, 1, 0)
# Engine 9: diesel and two-tone siren from the roll on (a short whoop before)
dz = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (28 + 20 * seg(tt, ROLL, ROLL + 3)) / SR))), 500) * .05 * seg(tt, ROLL - .3, ROLL)
sir_f = np.where(np.sin(2 * np.pi * .75 * tt) > 0, 700, 940)
siren = lp(np.sign(np.sin(np.cumsum(2 * np.pi * sir_f / SR))), 2400) * .4 + np.sin(np.cumsum(2 * np.pi * sir_f / SR)) * .6
fx += ((dz + siren * .035 * seg(tt, ROLL, ROLL + .3)) * (1 - .4 * seg(tt, 29, DUR)))[:, None]
add(fx, horn(300, .8, .06), ROLL + .05, 1, 0)
for e in Tv('real'): add(fx, whoosh(.5, .05)[::-1], e['t'] - .5, 1, 0)
for e in Tv('resume'): add(fx, whoosh(.45, .07), e['t'] - .05, 1, 0)
for e in Tv('cut'):
    if e["t"] not in (21.5, 26): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)
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
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * .95 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
