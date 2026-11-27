# Police Chase — mix: town bed, the race car's engine (pitch follows its speed, level its distance), police sirens (wail),
# tyre squeals at the corners and the final skid, a gasp and crate clatter at the crossing (slowed in the slow-mo), the bridge
# bell / barriers / leaf motor, a door and a "freeze!" stinger at the arrest, the ferry horn, narration, score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
T1 = lambda ty: Tv(ty)[0]['t']
rng = np.random.default_rng(4)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
slow = (tt > T1('slow')) & (tt < T1('resume'))
amb += (lp(colored(40, 600), 400) * .04)[:, None]
for t0 in np.cumsum(rng.uniform(1.5, 3.5, 14)):
    if t0 > DUR - 1: break
    d = .5; t = t_(d); f = 1800 + 900 * np.exp(-t * 6); gull = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) ** 2
    add(amb, hp(gull, 900) * .008, t0, 1, rng.uniform(-.8, .8))
L = Tv('lvl'); lt = np.array([e['t'] for e in L])
spd, gC, gP = [np.interp(tt, lt, [e[k] for e in L]) for k in ('v', 'car', 'pol')]
spd = np.where(slow, spd * .45, spd)
# engine: a buzzy sawtooth + harmonics, pitch with speed
f0 = 55 + spd * 5.5; ph = np.cumsum(2 * np.pi * f0 / SR); eng = (np.mod(ph / (2 * np.pi), 1) - .5) * .8 + .4 * np.sin(2 * ph) + .25 * np.sin(3 * ph)
eng = lp(eng, 1800) * (.03 + .2 * gC) * np.clip(spd / 6, 0, 1); eng *= np.where(slow, .6, 1)
fx += eng[:, None]
# sirens: two police wails slightly detuned, panned apart
for k, (det, pan) in enumerate(((1.0, -.4), (1.06, .4))):
    fs = (650 + 420 * (.5 + .5 * np.sin(2 * np.pi * .55 * tt + k))) * det; s_ = np.tanh(2.0 * np.sin(np.cumsum(2 * np.pi * fs / SR))) * (.02 + .12 * gP) * (.55 if k else 1)
    s_ = lp(s_, 3200) * np.where(slow, .5, 1); fx[:, 0] += s_ * np.sqrt(.5 * (1 - pan)); fx[:, 1] += s_ * np.sqrt(.5 * (1 + pan))
def squeal(d, v, f=2400):
    t = t_(d); s = np.sin(np.cumsum(2 * np.pi * (f + 260 * np.sin(2 * np.pi * 13 * t)) / SR)) * .5 + bp(noise(d), 1800, 5200) * .6
    return s * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .25) * v
add(fx, squeal(1.6, .07), T1('brake'), 1, 0); add(fx, squeal(.8, .05, 2100), 7.2, 1, 0)
add(fx, thump(.6, 55), T1('stop'), 1, 0)
# frame 0: siren blip + horn
d = .5; t = t_(d); blip = np.sin(np.cumsum(2 * np.pi * (900 + 1600 * t / d) / SR)) * np.minimum(1, (d - t) / .1); add(fx, blip * .12, 0, 1, 0)
# the crossing: a gasp, crates and fruit clatter (slowed: low pitched, spread)
cr = T1('cross'); d = 1.4; t = t_(d); gasp = bp(noise(d), 400, 2500) * np.exp(-t / .5) * .15; add(fx, gasp, cr - .9, 1, .2)
for k in range(10): add(fx, clack(rng.uniform(.4, .7), .12), cr + .05 + k * rng.uniform(.12, .25), 1, rng.uniform(-.5, .5))
add(fx, whoosh(1.2, .1), cr - .6, 1, 0)
# the bridge: bell until the leaves are up, barrier clunk, the motor
b0, b1 = T1('bell'), T1('up1')
for t0 in np.arange(b0, b1, .5): add(fx, ding(.1), t0, 1, .2)
add(fx, clack(.6, .25), T1('barDown'), 1, .2)
amb += (lp(np.sign(np.sin(2 * np.pi * 48 * tt)), 300) * seg(tt, T1('up0'), T1('up0') + .3) * (1 - seg(tt, b1 - .3, b1)) * .03)[:, None]
# arrest: a door, a stinger on "hands up"
add(fx, thump(.4, 120), T1('out'), 1, .1)
# ferry horn
def horn(d, v): t = t_(d); s = sum(np.sin(2 * np.pi * f * t) / (k + 1) for k, f in enumerate((92, 184, 276, 368))); return lp(s, 900) * np.minimum(1, t / .15) * np.minimum(1, (d - t) / .3) * v
add(fx, horn(2.0, .12), T1('ferry') - .3, 1, .2)
for e in Tv('cut'): add(fx, whoosh(.25, .035), e['t'] - .12, 1, 0)
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
mus *= np.clip((tt - .3) / .3, 0, 1)[:, None] * .75 + .25
env = np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * .95 * (1 - .7 * env)[:, None] + amb + fx * .9 * (1 - .55 * env)[:, None] + vo
r = int(.03 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
