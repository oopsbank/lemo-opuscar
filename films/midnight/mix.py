# Midnight Crossing — sound (no words): drizzle and a low city hum, the noodle pot's sizzle, slow traffic; at midnight a clock
# beep, the crossing bell KENG-KENG, the barrier CLACK, all traffic gone (rain only); the bell detunes, slows and sinks under a
# low drone; an underwater train whistle, wheels RẦM-RẦM, rumble, spray; signals off, two lamp pops, traffic and sizzle back;
# a small metal KÉT from the manhole; black → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = {e['type']: e['t'] for e in EV if e['type'] not in ('cam', 'ding', 'wheel')}
rng = np.random.default_rng(21)
amb, fx = np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def col(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
def tone(f, d, v):
    t = t_(d); ph = np.cumsum(2 * np.pi * (f if np.ndim(f) else np.full(len(t), f)) / SR)
    return np.sin(ph) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .05) * v
def stereo(x, w=.8): return np.stack([x, x * w], 1)
# —— beds ——
rain = col(1500, 9000) * .05 + col(300, 1500) * .025
for t0 in rng.uniform(0, DUR, 2600): i = int(t0 * SR); rain[i:i + 200] += hp(noise(200 / SR), 3000)[:len(rain[i:i + 200])] * rng.uniform(.01, .05)   # drops ticking
amb[:, 0] += rain; amb[:, 1] += np.roll(rain, 900)
city = lp(col(30, 400), 250) * .05
# traffic hum: present before midnight and after 'go'; cut dead at the barrier
traffic = (1 - seg(tt, T['bar1'], T['bar1'] + .08)) + seg(tt, T['go'], T['go'] + 1.5)
car = lp(col(60, 900), 500) * .07 * traffic
amb += stereo(city + car, .9)
sizzle = hp(col(3000, 12000), 3000) * .012 * (1 + .5 * np.sin(2 * np.pi * 3 * tt))
sz = np.where((tt < T['smoke']) | (tt > T['stir']), 1., 0.) * (1 - seg(tt, T['glance0'], T['glance1']))
amb[:, 0] += sizzle * sz * 1.2; amb[:, 1] += sizzle * sz * .6
# passing car whooshes
for t0, p in [(3.5, .4), (6.8, -.3), (9.5, .3), (56.0, .4), (57.2, -.4), (58.5, .3), (60.2, -.2)]: add(fx, lp(whoosh(1.4, .12), 1800), t0, 1, p)
# the girl's umbrella shake
add(fx, hp(noise(.5), 2500) * np.exp(-t_(.5) / .12) * .04, T['flick'], 1, .4)
# —— midnight ——
add(fx, tone(2000, .12, .06), T['clock'], 1, -.6); add(fx, tone(2000, .12, .06), T['clock'] + .18, 1, -.6)   # the clock beep
# the bell: two-tone, slowing and sinking from 24 s, stopping at sigOff
def bell(f, v): d = .9; t = t_(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / tau) for m, a, tau in [(1, 1, .35), (2.76, .45, .18), (5.4, .2, .08)]); return x * v
dings = [e for e in EV if e['type'] == 'ding']
for e in dings:
    t0 = e['t']; k = seg(np.array(t0), T['push0'], T['push1'] - 2).item()
    if t0 > T['light'] - .1 and t0 < T['enter'] + .2 and (round(t0 * 3) % 2): continue
    slow = 1 + k * 1.0   # keep every other ding as it slows
    if k > .2 and (round(t0 * 3) % int(round(slow))) != 0: continue
    f = (1250 if e['i'] == 0 else 1100) * (1 - .22 * k)
    add(fx, lp(bell(f, .16 * (1 - .3 * k)), 6000 - 4000 * k), t0, 1, -.15 if e['i'] == 0 else .15)
add(fx, clack(.7, .45), T['bar1'], 1, -.3); add(fx, thump(.35, 110), T['bar1'], 1, -.3); add(fx, clack(.75, .35), T['bar1'] + .05, 1, .3)
add(fx, creak(.05), T['bar0'], 1, -.3); add(fx, creak(.05), T['bar0'] + .1, 1, .3)
for k in range(8): add(fx, hp(noise(.5), 1200) * np.abs(np.sin(2 * np.pi * 16 * t_(.5))) * .04, T['pige'] + k * .06, 1, .5)   # the pigeons burst off
# —— the shadow: a low drone; a cold slither as it crawls; her small gasp-step ——
dr = (np.sin(2 * np.pi * 41 * tt) + .6 * np.sin(2 * np.pi * 61.5 * tt + .5 * np.sin(2 * np.pi * .2 * tt))) * seg(tt, T['push0'], T['push1']) * (1 - seg(tt, T['tail'], T['tail'] + 1.5))
amb += stereo(lp(dr, 200) * .06, 1)
sl = lp(col(200, 1500), 900) * (.5 + .5 * np.sin(2 * np.pi * 1.6 * tt)) * seg(tt, T['ink0'], T['ink0'] + 1) * (1 - seg(tt, T['reach'], T['reach'] + .6)) * .03
amb += stereo(sl, .7)
add(fx, tone(np.linspace(500, 900, int(.12 * SR)), .12, .03), T['step'], 1, .5); add(fx, step(.08), T['step'] + .1, 1, .5)
add(fx, clack(1.8, .12), T['drop'] + .45, 1, .5)   # the umbrella hits the pavement
add(fx, creak(.06), T['door'], 1, -.6)
# —— the ghost train: a whistle from under water, rumble, wheels, spray ——
w = T['light'] + .3; d = 2.6; t = t_(d)
wh = sum(np.sin(2 * np.pi * f * t * (1 + .004 * np.sin(2 * np.pi * 5 * t))) for f in (392, 466, 587)) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .6)
add(fx, lp(wh, 700) * .09, w, 1, -.6); add(fx, lp(wh, 500) * .05, w + .25, 1, .2)   # muffled, with a late echo
rum = lp(brown(DUR), 120)[:N]; rum = rum / (np.abs(rum).max() + 1e-9) * seg(tt, T['light'], T['enter'] + .8) * (1 - seg(tt, T['tail'] - .6, T['tail'] + 1.2)) * .5
amb += stereo(rum, 1)
for e in [x for x in EV if x['type'] == 'wheel']: add(fx, thump(.28, 75), e['t'], 1, np.clip((e['t'] - T['enter'] - 1.5) / 4 - .6, -.8, .8)); add(fx, clack(.5, .14), e['t'] + .02, 1, 0)
add(fx, whoosh(2.0, .25), T['enter'] - .3, 1, -.7); add(fx, whoosh(1.6, .2), T['tail'] - .8, 1, .7)
spray = hp(col(1500, 9000), 1200) * seg(tt, T['enter'] + .4, T['enter'] + 1) * (1 - seg(tt, T['tail'] - .8, T['tail'])) * .05; amb += stereo(spray, .9)
add(fx, lp(noise(.4), 900) * np.exp(-t_(.4) / .08) * .12, T['coat'], 1, -.3)   # the coat flops down
# —— after: signals off, barrier motors, two lamp pops, life again ——
for k in range(2): add(fx, tone(np.linspace(90, 140, int(1.8 * SR)), 1.8, .025), T["up0"], 1, -.3 + .6 * k)
for t0 in (T['flick1'], T['flick2']): add(fx, pop(.12), t0, 1, -.4); add(fx, hp(noise(.06), 2000) * np.exp(-t_(.06) / .01) * .12, t0, 1, -.4)
add(fx, step(.05), T['pick'], 1, .5); add(fx, hp(noise(.3), 3000) * np.exp(-t_(.3) / .06) * .04, T['hand'], 1, .5)
for k in range(10): add(fx, step(.035), T['away0'] + k * .38, 1, .4 + k * .04)
# —— the manhole: KÉT, then nothing ——
d = .7; t = t_(d); ket = np.sin(np.cumsum(2 * np.pi * (1800 + 600 * np.sin(2 * np.pi * 14 * t)) / SR)) * (np.abs(np.sin(2 * np.pi * 31 * t)) ** 2) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .1)
add(fx, bp(ket, 900, 5000) * .1, T['lid'], 1, .4)
mus, _ = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus * 1.1 + amb + fx
blk = tt >= T['black'] + .05; mix[blk] *= np.exp(-(tt[blk] - T['black']) / .15)[:, None]
mix[(tt > T['lid'] + .75) & (tt < T['black'])] *= 1   # the rain stays until black
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .7), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1))
