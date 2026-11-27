# Tunnel or Bridge? — mix: town bed (traffic hum, gulls, water), two sirens (A: hi-lo two-tone, B: wail) with level and pan from
# the camera, an air-horn hit on frame 0, tape rewinds, the bridge bell / barriers / leaf motor, the camper's crunch and honk,
# the tunnel whoosh in and out, the finish (whoosh, crowd cheer), narration, score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
T1 = lambda ty: Tv(ty)[0]['t'] if Tv(ty) else None
rng = np.random.default_rng(9)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
rew = np.maximum(win(1.6, 2.6, .05, .1), win(34.25, DUR, .05, .02))
# bed
amb += (lp(colored(40, 600), 400) * .05 * (1 - .7 * rew))[:, None]
lap = hp(colored(300, 3000), 400) * (np.sin(2 * np.pi * .7 * tt) > .5); amb[:, 0] += lap * .012; amb[:, 1] += np.roll(lap, 3000) * .012
for t0 in np.cumsum(rng.uniform(1, 3, 20)):
    if t0 > DUR - 1: break
    d = .5; t = t_(d); f = 1800 + 900 * np.exp(-t * 6); gull = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) ** 2
    add(amb, hp(gull, 900) * .01, t0, 1, rng.uniform(-.8, .8))
# sirens
st = np.array([e['t'] for e in Tv('siren')])
gA, gB = [np.interp(tt, st, [e[k] for e in Tv('siren')]) for k in ('A', 'B')]
pA, pB = [np.interp(tt, st, [e[k] for e in Tv('siren')]) for k in ('pA', 'pB')]
fA = np.where((tt * 1.6) % 1 < .5, 960, 770); fB = 700 + 450 * (.5 + .5 * np.sin(2 * np.pi * .45 * tt))
def tone(f): ph = np.cumsum(2 * np.pi * f / SR); return np.tanh(2.2 * np.sin(ph)) * .5 + .2 * np.sin(2 * ph)
sA, sB = lp(tone(fA), 3500) * (.025 + .16 * gA), lp(tone(fB), 3500) * (.025 + .16 * gB)
sA *= 1 - .9 * rew; sB *= 1 - .9 * rew
for s_, p_ in ((sA, pA), (sB, pB)): fx[:, 0] += s_ * np.sqrt(.5 * (1 - p_)); fx[:, 1] += s_ * np.sqrt(.5 * (1 + p_))
# frame 0: an air horn blast under the first word
def horn(d, v): t = t_(d); s = sum(np.sin(2 * np.pi * f * t) / (k + 1) for k, f in enumerate((233, 311, 466))); return lp(np.tanh(2 * s), 2500) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .12) * v
add(fx, horn(.7, .22), 0, 1, 0)
# rewinds: a tape-scrub sweep
for a, b in ((1.6, 2.6), (34.25, DUR)):
    d = b - a; t = t_(d); f = 300 + 2600 * (t / d) ** 1.5; sc = np.sin(np.cumsum(2 * np.pi * f / SR)) * .5 + bp(noise(d), 800, 6000) * .5
    add(fx, sc * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .5 * .12, a, 1, 0)
add(fx, thump(.5, 60), 2.62, 1, 0); add(fx, whoosh(.35, .08), 3.05, 1, 0)
# the bridge: bell from bell to barUp, barrier clunks, leaf motor hum while moving
b0, b1 = T1('bell'), T1('barUp')
if b0 is not None and b1 is not None:
    for t0 in np.arange(b0, b1, .5): add(fx, ding(.11), t0, 1, .25)
for k in ('barDown', 'barUp'):
    if T1(k) is not None: add(fx, clack(.6, .25), T1(k), 1, .2)
for a, b in (('up0', 'up1'), ('dn0', 'dn1')):
    if T1(a) is not None and T1(b) is not None: amb += (lp(np.sign(np.sin(2 * np.pi * 48 * tt)), 300) * win(T1(a), T1(b), .3, .3) * .03)[:, None]
if T1('dn1') is not None: add(fx, thump(.5, 55), T1('dn1'), 1, .2)
# camper: crunch at the bar (heard at the shot's start), a honk when A squeezes past
add(fx, crash(.12), 9.3, 1, -.3); add(fx, horn(.35, .07), T1('camper') or 11.8, 1, -.3)
# tunnel: a whoosh in, a whoosh out
for k in ('enter', 'exit'):
    if T1(k) is not None: add(fx, whoosh(.5, .12), T1(k) - .2, 1, -.2)
# B goes: a rev
if T1('bgo') is not None: d = 1.2; t = t_(d); rev = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (40 + 60 * t / d) / SR))), 500) * np.sin(np.pi * t / d) * .06; add(fx, rev, T1('bgo'), 1, .3)
# the finish: a whoosh into slow-mo, the crowd cheering at A's line, a second whoosh as B crosses
add(fx, whoosh(.6, .06)[::-1], (T1('slow') or 27.8) - .6, 1, 0)
fa = T1('finA') or 29.2
d = 3.2; t = t_(d); cheer = bp(noise(d), 300, 3000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3.1 * t))) * np.minimum(1, t / .15) * np.exp(-t / 1.6) * .18
add(fx, cheer, fa, 1, 0); add(fx, thump(.5, 80), fa, 1, 0)
for e in Tv('cut'): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)
# narration
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
mus *= np.clip((tt - .4) / .4, 0, 1)[:, None]
duck = 1 - .72 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)
mix = mus * .95 * duck[:, None] + amb + fx * .9 + vo
r = int(.02 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
