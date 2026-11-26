# Engine Nine — mix: ambience + foley (from events.json) + narration + score (ducked under the voice) → out/mix.wav
# Time-lapse = music first, a faint sped-up town hiss, relay clicks; real time = the harbour turns real (gulls, water, idling engine).
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = lambda ty: [e for e in EV if e['type'] == ty]
rng = np.random.default_rng(31)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.25, fo=.25): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)

# —— beds ——
TL = [(0, 21.75), (28.0, 34.0)]                               # time-lapse stretches (×12 / ×3)
tl = np.zeros(N)
for a, b in TL: tl = np.maximum(tl, win(a, b, .2, .15))
tl *= 1 - .55 * win(12.0, 17.0, .3, .3)                       # quieter in the ×3 crawl
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * (12 + 3 * np.sin(tt * .9)) * tt) ** 2)
amb[:, 0] += grain * tl * .045; amb[:, 1] += np.roll(grain, 911) * tl * .045
real1, real2 = win(21.7, 28.05, .3, .08), win(33.95, DUR, .05, .6)   # J-cut: the harbour arrives 0.3 s before the cut
water = lp(colored(60, 900) * (1 + .6 * np.sin(2 * np.pi * .35 * tt) * np.sin(2 * np.pi * .13 * tt + 1)), 700)
wind = hp(lp(np.cumsum(rng.standard_normal(N)) * .01, 500), 40); wind /= np.abs(wind).max()
amb += (water * .05 * (real1 + .6 * real2))[:, None]
amb += (wind * .05 * (real1 + real2))[:, None]
town = colored(90, 1200) * .5 + colored(1200, 3500) * .1
amb += (town * .025 * (real1 + real2))[:, None]
idle = sum(np.sin(2 * np.pi * f * tt + rng.random() * 6) for f in (28, 30.5, 33)) / 3
idle = lp(idle + .4 * np.tanh(idle * 3) * np.sin(2 * np.pi * 56 * tt), 240)
amb += (idle * .07 * win(21.7, 28.1, .3, .1))[:, None]          # the engine idling at the bridge
def gull(v=1.):
    d = .32 + rng.random() * .2; t = t_(d); f = np.interp(t, [0, d * .25, d], [1500, 2300, 1100]) * (1 + .03 * np.sin(2 * np.pi * 28 * t))
    ph = np.cumsum(2 * np.pi * f / SR); s = (np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)) * np.sin(np.pi * t / d) ** 1.2
    return bp(s + .15 * noise(d) * np.sin(np.pi * t / d), 700, 5000) * v
for t0 in [21.9, 22.5, 23.3, 24.6, 25.1, 26.4, 27.2, 34.9, 35.6, 36.3]:
    for k in range(rng.integers(1, 3)): add(amb, gull(.09), t0 + k * .38, 1, rng.uniform(-.8, .8))
# fire bed: crackle + roar, follows the fire level; starts under the 27.5 clunk (J-cut into the fire)
lev = np.ones(N); flames = sorted(e['t'] for e in T('flame')); out_t = T('out')[0]['t']
for k, ft in enumerate(flames): lev = np.where(tt >= ft, 1 - (k + 1) / (len(flames) + 1), lev)
lev = np.where(tt >= out_t, 0, lev)
roar = lp(colored(40, 600), 500)
fire_on = win(27.3, out_t + .05, .5, .05) * lev
amb += (roar * .09 * fire_on)[:, None]
crk = np.zeros(N)
for _ in range(900):
    ti = rng.uniform(27.3, out_t)
    if rng.random() > np.interp(ti, tt[::480], (fire_on)[::480]): continue
    x = hp(noise(.012), 1500) * env_exp(.012, .002) * rng.uniform(.2, 1); i = int(ti * SR); crk[i:i + len(x)] += x[:N - i]
amb[:, 0] += crk * .1; amb[:, 1] += np.roll(crk, 300) * .1
# siren: two-tone (hi–lo), quick in time-lapse, slower in the crawl; off at the bridge, back on to the fire
def siren(a, b, half, f_hi=960, f_lo=760, g=.035):
    t = tt; m = ((np.floor((t - a) / half) % 2) == 0)
    f = np.where(m, f_hi, f_lo); ph = np.cumsum(2 * np.pi * f / SR)
    s = np.sin(ph) + .3 * np.sin(3 * ph) + .12 * np.sin(5 * ph)
    return lp(s, 3500) * win(a, b, .15, .25) * g
sir = siren(2.6, 12.2, .125) + siren(12.0, 17.2, .3, 900, 720, .03) + siren(17.0, 21.7, .125) + siren(28.0, 29.3, .125)
amb[:, 0] += sir; amb[:, 1] += sir

# —— foley ——
def bell_ring(d=1.9):   # the station alarm bell: a fast hammer on a bell
    out = np.zeros(int((d + 1) * SR))
    parts = [(1.0, 1), (2.76, .5), (5.4, .3), (8.9, .15)]; f0 = 1180
    for k in range(int(d / .055)):
        t = t_(.5); s = sum(a * np.sin(2 * np.pi * f0 * r * t) for r, a in parts) * env_exp(.5, .09)
        s = s + hp(noise(.5), 2000) * env_exp(.5, .004) * .3
        i = int(k * .055 * SR); out[i:i + len(s)] += s * (1 - .5 * k * .055 / d)
    return out * .25
def rattle(v=1.):   # roller door slat step
    a = clack(.7, 1) * .6; b = hp(noise(.09), 900) * env_exp(.09, .02) * .5; n_ = min(len(a), len(b)); return (a[:n_] + b[:n_]) * v
def engine_rev(d=1.4, v=1., f0=38, f1=90):
    t = t_(d); f = np.interp(t, [0, d * .35, d], [f0, f1, f1 * .8]); ph = np.cumsum(2 * np.pi * f / SR)
    s = np.sin(ph) + .6 * np.sin(2 * ph) + .3 * np.sin(3.02 * ph) + .2 * np.tanh(3 * np.sin(ph))
    return lp(s, 900) * np.sin(np.pi * np.minimum(t / d, 1)) ** .6 * v
def air_brake(v=1.):
    d = .7; return hp(noise(d), 1800) * env_exp(d, .22) * np.minimum(1, t_(d) / .01) * v
def horn(f=420, d=.35, v=1.):
    t = t_(d); s = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * .5
    return lp(s, 2500) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03) * v
def squeak(v=1.):
    d = .22; t = t_(d); f = 1900 - 500 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * v
def boat_horn(v=1.):
    d = 1.7; t = t_(d); f = 118; s = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in [(1, 1), (2, .6), (3, .35), (4, .2), (5, .12)])
    return lp(s, 1500) * np.minimum(1, t / .08) * np.minimum(1, (d - t) / .3) * v
def motor(a, b, v=1.):
    t = tt; s = (np.sin(2 * np.pi * 92 * t) + .4 * np.sin(2 * np.pi * 184 * t) + .15 * bp(rng.standard_normal(N), 600, 1400)) * win(a, b, .3, .15) * v
    return s
def hiss(d, v=1., lo=1200, hi=7000, tau=None):
    x = bp(noise(d), lo, hi); e = env_exp(d, tau) if tau else np.sin(np.pi * t_(d) / d) ** .5
    return x * e * v
def drip(v=1.):
    d = .12; t = t_(d); f = 1300 + 900 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * env_exp(d, .025) * v
for e in T('alarm'): add(fx, bell_ring(), e['t'], .3, -.1)
for e in T('door'): add(fx, rattle(.28), e['t'], 1, -.1)
for e in T('engine'): add(fx, engine_rev(1.2, .08, 30, 60), e['t'], 1, 0)
for e in T('depart'): add(fx, engine_rev(1.4, .1), e['t'], 1, 0)
for e in T('yield'): add(fx, squeak(.05) if rng.random() < .5 else click(1.3, .18), e['t'], 1, e.get('pan', 0) * .7)
for e in T('brake'): add(fx, air_brake(.13), e['t'], 1, 0)
for e in T('horn'): add(fx, horn(400 + 60 * rng.random(), .32, .07), e['t'], 1, e.get('pan', 0)); add(fx, horn(410, .22, .05), e['t'] + .42, 1, e.get('pan', 0))
for e in T('part'): add(fx, thump(.18), e['t'], 1, 0); add(fx, squeak(.05), e['t'] + .05, 1, -.4); add(fx, squeak(.05), e['t'] + .1, 1, .4)
for e in T('rev'): add(fx, engine_rev(1.3, .11), e['t'], 1, 0)
for e in T('corner'): add(fx, squeak(.07), e['t'], 1, .3)
for e in T('boathorn'): add(fx, boat_horn(.06), e['t'], 1, -.3)
fx += motor(25.0, 27.55, .022)[:, None]
for e in T('clunk'): add(fx, thump(.4, 55), e['t'], 1, 0); add(fx, clack(.4, .35), e['t'] + .01, 1, 0)
for e in T('barrier'): add(fx, click(.8, .3), e['t'], 1, -.3); add(fx, click(.8, .3), e['t'] + .03, 1, .3)
for e in T('outrig'): add(fx, thump(.15, 80), e['t'], 1, rng.uniform(-.4, .4))
for e in T('ladder'): add(fx, clack(1.1, .35), e['t'], 1, .2)
for e in T('water'):
    w = hiss(out_t + 1.1 - e['t'], .09, 800, 6000); w *= np.minimum(1, t_(len(w) / SR) / .15)[:len(w)]; add(fx, w, e['t'], 1, .15)
for e in T('flame'): add(fx, hiss(.6, .1, 1500, 8000, .18), e['t'], 1, .25)
for e in T('out'): add(fx, hiss(2.6, .16, 1200, 9000, .8), e['t'], 1, .2)
for k in range(9): add(fx, drip(.06), out_t + .6 + k * .27 + rng.random() * .1, 1, rng.uniform(-.5, .5))
for e in T('cut'):
    if e['t'] not in (22.0,): add(fx, whoosh(.3, .05), e['t'] - .15, 1, 0)

# —— voice: compress, place ——
lines = {l['id']: l for l in json.load(open(os.path.join(HERE, 'lines.json')))}
vo_env = np.zeros(N)
for e in T('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = compress(x / max(1e-6, np.abs(x).max()), thr=.3, ratio=3.0); x = x / max(1e-6, np.abs(x).max()) * .62
    add(vo, x, e['t'], 1, 0)
    i0, i1 = int(e['t'] * SR), min(N, int(e['t'] * SR) + len(x)); vo_env[max(0, i0 - int(.12 * SR)):min(N, i1 + int(.2 * SR))] = 1

# —— score, ducked ~8 dB under the voice ——
mus, sr = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
from scipy.ndimage import uniform_filter1d
duck = 1 - .6 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * 1.5 * duck[:, None] + amb + fx * .9 + vo
mix[-int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR))[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', round(DUR, 2), 's · rms music', round(rms(mus * .55), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * 1.5 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):5.0f}' for s in range(int(DUR))))
