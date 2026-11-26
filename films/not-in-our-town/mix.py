# Not In Our Town — mix: ambience + foley (from events.json) + narration + score (ducked under the voice) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = lambda ty: [e for e in EV if e['type'] == ty]
t1 = lambda ty: T(ty)[0]['t']
rng = np.random.default_rng(7)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
REAL = [(2.5, 8.0), (30.0, 35.0)]; SLOW = (28.5, 30.0)
tl = np.ones(N)
for a, b in REAL + [SLOW]: tl *= 1 - win(a, b, .05, .1)
FLEE = t1('flee')

# —— beds ——
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * (12 + 3 * np.sin(tt * .9)) * tt) ** 2)
amb[:, 0] += grain * tl * .035; amb[:, 1] += np.roll(grain, 911) * tl * .035
town = lp(colored(80, 1500), 1200) * (1 + .3 * np.sin(2 * np.pi * .3 * tt))                  # the real town, quiet
amb += (town * .03 * (win(2.5, 8.0, .1, .2) + win(30.0, 35.2, .1, .2)))[:, None]
# the saucer's hum: low, beating, louder when it's close (real time), stutters after the hit, gone when it flees
hph = np.cumsum(2 * np.pi * (55 + 1.5 * np.sin(2 * np.pi * .4 * tt)) / SR)
hum = np.sin(hph) + .5 * np.sin(2.01 * hph) + .25 * np.sin(3.02 * hph) + .3 * lp(colored(40, 300), 200)
hum *= 1 + .25 * np.sin(2 * np.pi * 3.2 * tt)
hlev = .02 + .05 * np.maximum(win(2.5, 8.0, .15, .2), win(28.5, 35.0, .1, .1))
stut = np.where((tt > 28.9) & (tt < FLEE), (np.sin(2 * np.pi * 7 * tt + 3 * np.sin(tt * 5)) > -.3).astype(float) * .8 + .2, 1)
amb += (hum * hlev * stut * seg(tt, 0.3, 2.5) * (1 - seg(tt, FLEE, FLEE + .6)))[:, None]
def gull(v=1.):
    d = .32 + rng.random() * .2; t = t_(d); f = np.interp(t, [0, d * .25, d], [1500, 2300, 1100]); ph = np.cumsum(2 * np.pi * f / SR)
    return bp((np.sin(ph) + .35 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 1.2, 700, 5000) * v
for t0 in [5.4, 6.8, 7.4, 34.6, 35.0]: add(amb, gull(.06), t0, 1, rng.uniform(-.7, .7))
water_bed = lp(colored(60, 900) * (1 + .6 * np.sin(2 * np.pi * .35 * tt)), 700)
amb += (water_bed * .03 * (win(8.0, 15.0, .3, .3) + win(25.0, 35.2, .3, .3)))[:, None]
# crowd: screams as the beam hits (sped up, tiny), a cheer at the end
def chirp(v=1.):
    d = .09 + rng.random() * .08; t = t_(d); f = np.interp(t, [0, d], [1900, 2700]) * rng.uniform(.8, 1.3)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * v
for e in T('screams'):
    for k in range(26): add(fx, chirp(.03), e['t'] + rng.uniform(0, 1.6), 1, rng.uniform(-.6, .6))
cheer = bp(colored(300, 3000), 400, 2600) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 2.3 * tt)))
c0 = t1('cheer'); amb += (cheer * .07 * win(c0, DUR, .8, .6))[:, None]
claps = np.zeros(N)
for _ in range(260):
    t0 = rng.uniform(c0 + .4, DUR - .3); x = hp(noise(.03), 800) * env_exp(.03, .006) * rng.uniform(.3, 1); i = int(t0 * SR); claps[i:i + len(x)] += x[:N - i]
amb[:, 0] += claps * .07; amb[:, 1] += np.roll(claps, 500) * .07

# —— foley ——
def bell(f0=1350, v=1.):
    d = .5; t = t_(d); return (np.sin(2 * np.pi * f0 * t) + .4 * np.sin(2 * np.pi * f0 * 2.7 * t)) * env_exp(d, .15) * v
def zap(v=1.):
    d = .5; t = t_(d); f = np.interp(t, [0, d], [300, 1400]); ph = np.cumsum(2 * np.pi * f / SR)
    return (np.sin(ph) * .6 + np.sign(np.sin(ph * 2.01)) * .2 + bp(noise(d), 2000, 7000) * .3) * np.minimum(1, t / .02) * np.exp(-t / .25) * v
def whirr(d=1.6, v=1.):
    t = t_(d); f = np.interp(t, [0, d], [180, 900]); ph = np.cumsum(2 * np.pi * f / SR)
    return (np.sin(ph) + .4 * np.sin(2.5 * ph)) * (1 + .5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / d) * v
def splash(d=.5, v=1.): return bp(noise(d), 500, 6000) * env_exp(d, .12) * v
def squeal(d=.45, v=1.):
    t = t_(d); f = 2100 - 600 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * v
def horn(f=420, d=.35, v=1.):
    t = t_(d); s = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * .5; return lp(s, 2500) * np.minimum(1, (d - t) / .03) * np.minimum(1, t / .01) * v
def crackle(d=.4, v=1.):
    x = np.zeros(int(d * SR))
    for _ in range(14): i = rng.integers(0, len(x) - 400); x[i:i + 400] += hp(noise(400 / SR), 3000) * env_exp(400 / SR, .002) * rng.uniform(.3, 1)
    return x * v
for e in T('tapestop'): add(fx, whoosh(.5, .05)[::-1], e['t'] - .5, 1, 0)
for e in T('gong'): add(fx, thump(.12, 45), e['t'], 1, 0)
for e in T('zap'): add(fx, zap(.07), e['t'], 1, .1)
for e in T('lift'): add(fx, whirr(1.6, .03), e['t'], 1, rng.uniform(-.2, .2))
for e in T('beamoff'): add(fx, zap(.04)[::-1], e['t'] - .5, 1, 0)
# alarm bell (J-cut into the station), roller door, engine, siren
a0 = t1('alarm')
for k in range(14): add(fx, bell(1350, .06), a0 + k * .1, 1, -.2)
for e in T('door'): add(fx, click(.7, .1), e['t'], 1, -.1)
for e in T('engine'): add(fx, rumble(1.2, .2), e['t'], 1, 0)
s0 = t1('siren'); sir_f = np.where(np.sin(2 * np.pi * .9 * tt) > 0, 720, 960)
siren = lp(np.sign(np.sin(np.cumsum(2 * np.pi * sir_f / SR))), 2200) * .5 + np.sin(np.cumsum(2 * np.pi * sir_f / SR)) * .5
fx += (siren * .022 * win(s0, 25.2, .3, .6) * (1 - .5 * seg(tt, 19, 21)))[:, None]
boat_eng = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (42 + 4 * np.sin(tt)) / SR))), 400)
fx += (boat_eng * .03 * win(t1('boats'), 26.0, .5, .8))[:, None]
for e in T('brake'): add(fx, squeal(.45, .04), e['t'], 1, .3)
for e in T('outrig'): add(fx, clack(.8, .2), e['t'], 1, .3)
for e in T('ladder'): add(fx, click(1.1, .12), e['t'], 1, .3)
# water: the engine's jet, then the monitors; muffled and slowed in the slow-motion hit; off at the fizzle
w_on = np.maximum(win(t1('water'), 31.3, .15, .4) * .7, win(t1('arcs'), 31.3, .3, .4))
wat = hp(colored(300, 7000), 250)
wat_slow = lp(colored(80, 1200), 700)
fx += ((wat * (1 - win(*SLOW, .1, .1)) + wat_slow * 1.4 * win(*SLOW, .1, .1)) * w_on * .06)[:, None]
for e in T('hit'): add(fx, crash(.25), e['t'], 1, 0); add(fx, thump(.3, 55), e['t'], 1, 0); add(fx, crackle(.6, .12), e['t'], 1, -.2)
for e in T('crackle'): add(fx, crackle(.35, .06), e['t'], 1, rng.uniform(-.5, .5))
for e in T('fizzle'): add(fx, zap(.05)[::-1], e['t'], 1, 0)
for e in T('land'):
    w = e.get('what')
    if w == 'car': add(fx, thump(.35, 70), e['t'], 1, -.1); add(fx, clack(.7, .25), e['t'] + .01, 1, -.1); add(fx, thump(.12, 90), e['t'] + .36, 1, -.1)
    elif w == 'palm': add(fx, thump(.25, 60), e['t'], 1, .2); add(fx, bp(noise(.4), 300, 3000) * env_exp(.4, .1) * .05, e['t'], 1, .2)
    else: add(fx, splash(.8, .12), e['t'], 1, -.2); add(fx, thump(.15, 50), e['t'], 1, -.2)
for e in T('wobble'): add(fx, whirr(.8, .03), e['t'], 1, 0)
for e in T('flee'): add(fx, whoosh(1.2, .14), e['t'] - .1, 1, .3); d = 1.4; t = t_(d); add(fx, np.sin(np.cumsum(2 * np.pi * np.interp(t, [0, d], [300, 2400]) / SR)) * np.exp(-t / .5) * .05, e['t'], 1, .4)
for e in T('honk'): add(fx, horn(420, .3, .04), e['t'], 1, e.get('pan', 0)); add(fx, horn(420, .3, .04), e['t'] + .4, 1, e.get('pan', 0))
for e in T('cut'):
    if e['t'] not in (4.0, 31.0): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)

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
duck = 1 - .74 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * .95 * duck[:, None] + amb + fx * .9 + vo
mix[-int(.4 * SR):] *= np.linspace(1, 0, int(.4 * SR))[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * 1.1), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * .95 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
