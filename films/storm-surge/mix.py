# Storm Surge — mix: wind, rain, sea and waves on the wall, gate motors and clangs, the tow truck, the impact, narration, score (ducked) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
Tv = lambda ty: [e for e in EV if e['type'] == ty]
IMP = Tv('impact')[0]['t']
rng = np.random.default_rng(5)
amb, fx, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def win(a, b, fi=.2, fo=.2): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
REAL = [(8.0, 10.6), (26.0, 34.0)]
real = np.zeros(N)
for a, b in REAL: real = np.maximum(real, win(a, b, .05, .1))
tl = 1 - real
st = np.interp(tt, [e['t'] for e in Tv('storm')], [e['v'] for e in Tv('storm')])   # storm 0…1
fz = np.interp(tt, [e['t'] for e in Tv('storm')], [e['fz'] for e in Tv('storm')])
# wind: band noise with slow gusts (louder in real time), whistling partial
gust = .6 + .4 * np.sin(2 * np.pi * .23 * tt) * np.sin(2 * np.pi * .071 * tt + 1)
wind = colored(150, 1400) * gust
whistle = bp(rng.standard_normal(N), 700, 900, 4) * (gust ** 3)
for ch, sh in ((0, 0), (1, 1777)):
    amb[:, ch] += np.roll(wind, sh) * (.05 + .05 * real + .03 * st) + np.roll(whistle, sh) * .05 * (.4 + st)
# rain: bright hiss, and the sped-up town grain in time-lapse
rain = hp(rng.standard_normal(N), 3000) * .022
amb[:, 0] += rain; amb[:, 1] += np.roll(rain, 333)
grain = colored(700, 6000) * (.55 + .45 * np.sin(2 * np.pi * 12 * tt) ** 2)
amb += (grain * tl * .018)[:, None]
# sea: low surf roar growing with the storm and as the front nears (front distance from the wall)
near = np.clip(1 - (fz - 792) / 450, 0, 1)
surf = lp(colored(40, 600), 500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * .12 * tt)))
amb += (surf * (.05 + .09 * st + .16 * near ** 2) * (1 - seg(tt, IMP + 2.5, IMP + 5) * .5))[:, None]
# waves slapping the wall (irregular, more with the storm), quiet in the real-time stretch before the hit
def slap(v=1.):
    d = .7; t = t_(d); x = lp(noise(d), 1800) * np.exp(-t / .18) + np.sin(2 * np.pi * 55 * t) * np.exp(-t / .12) * .6
    return x * v
for t0 in np.cumsum(rng.uniform(.35, 1.1, 80)):
    if t0 < DUR - 1 and not (IMP - .5 < t0 < IMP + 1.5):
        s = float(np.interp(t0, tt[::100], st[::100])); add(fx, slap(.03 + .07 * s), t0, 1, rng.uniform(-.6, .6))
# gates: a hydraulic motor whine while they move, a steel clang when they shut
def motor(d, v=1.):
    t = t_(d); f = 95 + 10 * np.sin(2 * np.pi * 3 * t); x = np.sign(np.sin(np.cumsum(2 * np.pi * f / SR))) * .5 + np.sin(np.cumsum(2 * np.pi * 2 * f / SR)) * .5
    return lp(x, 900) * np.minimum(1, np.minimum(t, d - t) / .15) * v
def clang(v=1., f=180):
    d = 1.6; t = t_(d); x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t / (.5 / k)) / k for k in (1, 2.76, 5.4)) + lp(noise(d), 3000) * np.exp(-t / .03)
    return x * v
starts = sorted((e['t'], e['i']) for e in Tv('gate_start')); shuts = {e['i']: e['t'] for e in Tv('gate_shut')}
for t0, i in starts:
    t1 = [e['t'] for e in Tv('clunk')][0] if (i == 1 and t0 < 9) else shuts[i]
    add(fx, motor(t1 - t0, .05 if i == 3 else .035), t0, 1, 0)
for i, t1 in shuts.items(): add(fx, clang(.14 if i == 3 else .09, 150 if i == 0 else 190), t1, 1, 0); add(fx, thump(.5 if i == 3 else .35, 60), t1, 1, 0)
for e in Tv('clunk'): add(fx, clang(.12, 240), e['t'], 1, .3); add(fx, thump(.35, 90), e['t'], 1, .3)
# the tow truck: engine, reversing beeper, the hook's chain, the drag
eng = lp(np.sign(np.sin(np.cumsum(2 * np.pi * (38 + 8 * seg(tt, 13.1, 14.3)) / SR))), 400) * .03 * win(10.6, 16.8, .4, .8)
fx += eng[:, None]
for k in range(5): add(fx, np.sin(2 * np.pi * 1450 * t_(.15)) * .03, 11.75 + k * .2, 1, .3)
add(fx, clack(1.3, .2), 12.75, 1, .3); add(fx, clack(1.1, .15), 12.95, 1, .3)
# whooshes into and out of real time, and on cuts
for e in Tv('real'): add(fx, whoosh(.5, .05)[::-1], e['t'] - .5, 1, 0)
for e in Tv('resume'): add(fx, whoosh(.45, .07), e['t'] - .05, 1, 0)
for e in Tv('cut'):
    if e['t'] not in (8.0, 26.0, 34.0): add(fx, whoosh(.25, .03), e['t'] - .12, 1, 0)
# the hit: the roar of the front closing in, then a boom and the spray coming down
pre = lp(colored(60, 2000), 1500) * seg(tt, IMP - 4, IMP) ** 2 * (1 - seg(tt, IMP, IMP + .05))
fx += (pre * .12)[:, None]
add(fx, thump(1.0, 45), IMP, 1, 0); add(fx, rumble(2.5, .5), IMP, 1, 0)
splash = hp(noise(3.0), 900) * np.exp(-t_(3.0) / .9); add(fx, splash * .22, IMP + .05, 1, -.2); add(fx, splash[::-1][::-1] * .18, IMP + .12, 1, .2)
for k in range(30): add(fx, hp(noise(.05), 2500) * np.exp(-t_(.05) / .01) * .05, IMP + .6 + rng.uniform(0, 2.2), 1, rng.uniform(-.8, .8))   # drops on the quay
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
bed = 1 - .55 * np.clip(uniform_filter1d(vo_env, int(.15 * SR)), 0, 1)   # the storm bed dips a little under the voice too
mix = mus * .95 * duck[:, None] + amb * bed[:, None] + fx * .9 + vo
r = int(.02 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .95), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1), 'vo', round(rms(vo), 1))
if os.environ.get('MIXDBG'):
    for name, x in (('mus', mus * .95 * duck[:, None]), ('amb', amb), ('fx', fx * .9), ('vo', vo)):
        print(name, ' '.join(f'{rms(x[int(s*SR):int((s+1)*SR)]):4.0f}' for s in range(int(DUR))))
