# Ten Minutes — mix: ambience + foley (from events.json) + narration + score (ducked under the voice) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = lambda ty: [e for e in EV if e['type'] == ty]
rng = np.random.default_rng(44)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
REAL = [(19.5, 23.5), (41.0, DUR)]; SLOW = (31.6, 33.0)
tl = np.ones(N)
for a, b in REAL + [SLOW]: tl *= 1 - win(a, b, .05, .1)

# —— beds ——
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * (12 + 3 * np.sin(tt * .9)) * tt) ** 2)
amb[:, 0] += grain * tl * .035; amb[:, 1] += np.roll(grain, 911) * tl * .035
chatter = colored(300, 2500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * tt + np.sin(tt * 3) * 4)))
amb += (chatter * .05 * win(3.0, 9.0, .3, .3))[:, None]                                   # market crowd, sped up
crowd = colored(250, 2200) * (.7 + .3 * np.sin(2 * np.pi * .7 * tt))
amb += (crowd * .07 * win(19.3, 23.6, .3, .2))[:, None]                                   # parade crowd, real time
claps = np.zeros(N)
for _ in range(220):
    t0 = rng.uniform(19.6, 23.4); x = hp(noise(.03), 800) * env_exp(.03, .006) * rng.uniform(.3, 1); i = int(t0 * SR); claps[i:i + len(x)] += x[:N - i]
amb[:, 0] += claps * .09; amb[:, 1] += np.roll(claps, 500) * .09
mach = lp(colored(30, 400), 300) + .3 * np.sin(2 * np.pi * 47 * tt) * (1 + .5 * np.sin(2 * np.pi * 1.3 * tt))
amb += (mach * .06 * win(14.0, 19.0, .2, .3))[:, None]                                   # roadworks machines
rain = hp(colored(800, 9000), 600) * (1 + .3 * np.sin(2 * np.pi * 3.1 * tt))
ra = np.clip(np.minimum((tt - 34.3) / .5, 1 - (tt - 39.8) / .9), 0, 1)
amb += (rain * .07 * ra)[:, None]
pat = np.zeros(N)
for _ in range(1600):
    t0 = rng.uniform(34.3, 40.6); x = hp(noise(.008), 2000) * env_exp(.008, .0015) * rng.uniform(.2, 1); i = int(t0 * SR); pat[i:i + len(x)] += x[:N - i]
amb[:, 0] += pat * .06 * ra; amb[:, 1] += np.roll(pat, 300) * .06 * ra
water = lp(colored(60, 900) * (1 + .6 * np.sin(2 * np.pi * .35 * tt)), 700)
amb += (water * .05 * win(39.0, DUR, .5, .3))[:, None]
def gull(v=1.):
    d = .32 + rng.random() * .2; t = t_(d); f = np.interp(t, [0, d * .25, d], [1500, 2300, 1100]); ph = np.cumsum(2 * np.pi * f / SR)
    return bp((np.sin(ph) + .35 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 1.2, 700, 5000) * v
for t0 in [41.3, 42.6, 43.4, 44.2]: add(amb, gull(.08), t0, 1, rng.uniform(-.7, .7))

# —— the scooter engine: buzzy two-stroke; pitch follows speed; idle at the parade; slowed in the slow-motion jump ——
spd = np.zeros(N)
keys = [(0, 0), (1.85, 0), (2.2, .6), (3, 1), (14.9, 1), (15.2, .2), (16.5, .5), (17.6, 1), (19.3, .4), (19.5, .15), (23.5, .15), (24.45, 1), (30.9, 1), (31.3, 1.25), (31.6, 1.25),
        (33.0, .9), (40.6, .9), (41.0, .1), (41.4, 0), (DUR, 0)]
spd = np.interp(tt, [k[0] for k in keys], [k[1] for k in keys])
f = 55 + 95 * spd
f = np.where((tt >= SLOW[0]) & (tt < SLOW[1]), f * .3, f)
ph = np.cumsum(2 * np.pi * f / SR)
eng = np.sign(np.sin(ph)) * .4 + np.sin(2 * ph) * .3 + np.sin(3.01 * ph) * .2
eng = lp(eng, 1800) * (.25 + .75 * np.clip(spd, 0, 1))
on = np.clip((tt - 1.85) / .1, 0, 1) * np.clip((41.4 - tt) / .2, 0, 1)
fx += (eng * .045 * on)[:, None]

# —— foley ——
def ding(f0=2400, v=1.):
    d = 1.0; t = t_(d); return sum(a * np.sin(2 * np.pi * f0 * r * t) for r, a in [(1, 1), (2.7, .4), (5.2, .15)]) * env_exp(d, .35) * v
def bark(v=1.):
    d = .16; t = t_(d); f = np.interp(t, [0, .03, d], [380, 620, 300]); ph = np.cumsum(2 * np.pi * f / SR)
    s = np.sign(np.sin(ph)) * .5 + np.sin(2 * ph) * .3 + bp(noise(d), 500, 2500) * .6
    return bp(s, 250, 3000) * np.sin(np.pi * np.minimum(t / d, 1)) ** .5 * v
def meep(v=1.):
    d = .14; t = t_(d); s = np.sign(np.sin(2 * np.pi * 620 * t)) * .5 + np.sign(np.sin(2 * np.pi * 780 * t)) * .5; return lp(s, 3000) * np.minimum(1, (d - t) / .02) * v
def squeal(d=.45, v=1.):
    t = t_(d); f = 2100 - 600 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * (1 + .2 * np.sin(50 * t)) * v
def bridge_bell(v=1.):
    d = .4; t = t_(d); return (np.sin(2 * np.pi * 1350 * t) + .4 * np.sin(2 * np.pi * 3600 * t)) * env_exp(d, .12) * v
def rumble2(d=2.4, v=1.):
    x = lp(noise(d), 120) + .5 * lp(noise(d), 60); t = t_(d); return x * np.minimum(1, t / .2) * np.exp(-t / .9) * v
def splash(v=1.):
    d = .35; return bp(noise(d), 600, 5000) * env_exp(d, .08) * v
for e in T('bell'): add(fx, ding(2600, .22), e['t'], 1, -.2); add(fx, ding(2600, .16), e['t'] + .28, 1, -.2)
for e in T('door'): add(fx, ding(3100, .08), e['t'], 1, -.3); add(fx, click(.9, .2), e['t'], 1, -.3)
for e in T('beep'): add(fx, meep(.05), e['t'], 1, 0); add(fx, meep(.05), e['t'] + .19, 1, 0)
for e in T('crate'): add(fx, thump(.25, 90), e['t'], 1, .3); add(fx, clack(.6, .3), e['t'] + .02, 1, .3)
for e in T('roll'): add(fx, click(1.4, .07), e['t'], 1, rng.uniform(-.2, .5))
for e in T('bark'): add(fx, bark(.16), e['t'], 1, .35)
for e in T('whine'): d = .5; t = t_(d); add(fx, np.sin(np.cumsum(2 * np.pi * np.linspace(900, 600, len(t)) / SR)) * np.sin(np.pi * t / d) * .04, e['t'], 1, .35)
for e in T('brake'): add(fx, squeal(.45, .05), e['t'], 1, 0)
for e in T('skid'): add(fx, squeal(.7, .045), e['t'], 1, -.1); add(fx, bp(noise(.6), 400, 3000) * env_exp(.6, .25) * .05, e['t'], 1, 0)
for e in T('rev'): add(fx, whoosh(.3, .05), e['t'], 1, 0)
for e in T('resume'): add(fx, whoosh(.45, .08), e['t'] - .05, 1, 0)
for e in T('corner'): add(fx, squeal(.25, .035), e['t'], 1, .3)
for e in T('bells'):
    for k in range(6): add(fx, bridge_bell(.07), e['t'] + k * .25, 1, .4 if k % 2 else -.4)
for e in T('takeoff'): add(fx, whoosh(1.2, .07), e['t'], 1, 0)
for e in T('land'): add(fx, thump(.4, 60), e['t'], 1, 0); add(fx, clack(.5, .3), e['t'] + .01, 1, 0)
for e in T('thunder'): add(fx, rumble2(2.4, .25), e['t'], 1, -.3)
for e in T('splash'): add(fx, splash(.06), e['t'], 1, rng.uniform(-.4, .4))
for e in T('stop'): add(fx, click(.6, .15), e['t'] + .35, 1, 0)
for e in T('hand'): add(fx, thump(.06, 160), e['t'] + .3, 1, .2)
for e in T('cut'):
    if e['t'] not in (19.0,): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)

# —— voice ——
vo_env = np.zeros(N)
for e in T('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = compress(x / max(1e-6, np.abs(x).max()), thr=.3, ratio=3.0); x = x / max(1e-6, np.abs(x).max()) * .62
    add(vo, x, e['t'], 1, 0)
    i0, i1 = int(e['t'] * SR), min(N, int(e['t'] * SR) + len(x)); vo_env[max(0, i0 - int(.12 * SR)):min(N, i1 + int(.2 * SR))] = 1

mus, _ = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
duck = 1 - .6 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * 1.1 * duck[:, None] + amb + fx * .9 + vo
mix[-int(.4 * SR):] *= np.linspace(1, 0, int(.4 * SR))[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * 1.5), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * 1.5 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
