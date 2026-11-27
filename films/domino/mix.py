# Domino — toy foley (no words): a soft low city bed under small, bright, pitched-up sounds: pigeon coos and wing flaps, a
# whistle as the bucket falls, a plastic CLOP on the car, a squeal, the hydrant's WHOOSH and water hiss, a scooter horn
# "meep-meep", metal clanks and the crane motor, pipes rolling (rumble + clatter), the pile-up BOP-BOP-BOP, the truck burst,
# thousands of ball pops, lamp posts CRASH, the cake SPLAT, a siren that goes weak, silence, the coo, the second whistle → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = {e['type']: e['t'] for e in EV if e['type'] not in ('cam', 'postHit', 'bump')}
rng = np.random.default_rng(12)
amb, fx = np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
def tone(f, d, v, shape='sine'):
    t = t_(d); ph = np.cumsum(2 * np.pi * (f if np.ndim(f) else np.full(len(t), f)) / SR)
    s = np.sin(ph) if shape == 'sine' else np.sign(np.sin(ph)) * .5
    return s * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .05) * v
def coo(at, v=.12):
    for k, (d, f0) in enumerate(((.22, 420), (.38, 360))):
        t = t_(d); f = f0 * (1 + .15 * np.sin(np.pi * t / d)); add(fx, lp(tone(f, d, v), 1500) * (.5 + .5 * np.sin(2 * np.pi * 28 * t)), at + k * .26, 1, -.2)
def whistle(at, d, v=.06): t = t_(d); f = 2400 * np.exp(-t / d * 1.2) + 500; add(fx, tone(f, d, v), at, 1, 0)
def clop(at, v=.35, f=900): d = .12; t = t_(d); add(fx, (np.sin(2 * np.pi * f * t) * np.exp(-t / .02) + hp(noise(d), 1500) * np.exp(-t / .015) * .6) * v, at, 1, 0)
def splat(at, v=.3): d = .5; t = t_(d); s = lp(noise(d), 900) * np.exp(-t / .09) + np.sin(2 * np.pi * (140 - 80 * t) * t) * np.exp(-t / .12); add(fx, s * v, at, 1, 0)
# bed: distant, soft city
amb += (lp(colored(40, 500), 350) * .03)[:, None]
for t0 in np.cumsum(rng.uniform(.8, 2.4, 50)):
    if t0 > DUR - 1: break
    add(amb, tone(rng.uniform(500, 800), .15, .012, 'sq') * .5, t0, 1, rng.uniform(-.9, .9))   # far-off toy horns
hold = (tt > T['hold0']) & (tt < T['hold1'] + 2.5); amb[hold] *= .35
# 0–8: pigeon, bucket
add(fx, hp(noise(.5), 1500) * np.abs(np.sin(2 * np.pi * 18 * t_(.5))) * .05, max(0, T['land'] - .6), 1, -.3)   # wings
coo(T['land'] + .4); add(fx, tone(1800, .04, .1), T['peck1'], 1, 0); add(fx, tone(1700, .04, .1), T['peck2'], 1, 0)
add(fx, tone(np.linspace(600, 520, int(.4 * SR)), .4, .05), T['tip'], 1, 0)   # the bucket's wobble creak
whistle(T['fall'], T['splat'] - T['fall'])
clop(T['splat'], .4, 700); splat(T['splat'] + .02, .2)
# 8–18: squeal, hydrant, scooter horn, flight, cab clank
d = 1.0; t = t_(d); sq = (np.sin(np.cumsum(2 * np.pi * (2300 + 300 * np.sin(2 * np.pi * 11 * t)) / SR)) * .5 + bp(noise(d), 2000, 5000) * .4) * np.minimum(1, (d - t) / .2) * .06; add(fx, sq, T['splat'] + .05, 1, 0)
clop(T['hydrant'], .45, 520)
gey = (hp(colored(800, 8000), 900) * seg(tt, T['hydrant'], T['hydrant'] + .3) * (1 - .6 * seg(tt, 45, 50))) * .05; fx[:, 0] += gey; fx[:, 1] += gey * .8
add(fx, whoosh(.7, .12), T['hydrant'], 1, -.3)
for k in range(2): add(fx, tone(880 if k == 0 else 740, .14, .08, 'sq'), T['launch'] + k * .18, 1, -.2)   # meep-meep
whistle(T['launch'] + .3, 4.5, .03)
for k in range(3): add(fx, clack(1.3 - k * .1, .2), T['cab'] + k * .09, 1, .3)
# crane motor while spinning, the sweep clank, pipes rolling
mot = lp(np.sign(np.sin(2 * np.pi * (60 + 30 * seg(tt, T['spin0'], T['spin1'])) * tt)), 400) * seg(tt, T['spin0'], T['spin0'] + .3) * (1 - seg(tt, T['spin1'] - .3, T['spin1'] + .5)) * .035
fx += mot[:, None]
for k in range(4): add(fx, clack(1.6, .25), T['sweep'] + k * .07, 1, .4)
roll = lp(colored(30, 300), 200) * seg(tt, T['roll0'], T['roll0'] + .5) * (1 - seg(tt, T['roll1'] - 2, T['roll1'])) * .25; fx += roll[:, None]
for t0 in np.sort(rng.uniform(T['roll0'], T['roll1'] - 1, 40)): add(fx, clack(rng.uniform(.5, .9), .1), t0, 1, rng.uniform(-.6, .6))
# 30–46: pile-up bops, the smash, ball rain, posts, sign, cake
for e in [x for x in EV if x['type'] == 'bump']: clop(e['t'], .35, 380 + e['i'] * 60); add(fx, tone(560 + 40 * e['i'], .16, .05, 'sq'), e['t'] + .1, 1, 0)
add(fx, crash(.35), T['smash'], 1, 0); add(fx, thump(.7, 60), T['smash'], 1, 0)
for t0 in np.sort(T['burst'] + rng.gamma(1.6, 1.0, 900)):
    if t0 < DUR - 1 and t0 < T['hold0']: add(fx, tone(rng.uniform(700, 1500), .05, .012) * np.exp(-t_(.05) / .015), t0, 1, rng.uniform(-.9, .9))
for e in [x for x in EV if x['type'] == 'postHit']: add(fx, clack(.45, .3), e['t'], 1, .2); add(fx, thump(.35, 90), e['t'], 1, .2)
add(fx, clack(.8, .3), T['sign'], 1, .3); whistle(T['cakeFall'], T['cakeHit'] - T['cakeFall'], .04); splat(T['cakeHit'], .5)
# the police siren: arrives, then, under the cream, weak and slow
fs = 700 + 380 * (.5 + .5 * np.sin(2 * np.pi * .7 * tt)); sir = np.tanh(2 * np.sin(np.cumsum(2 * np.pi * fs / SR))) * seg(tt, T['copStop'] - 4, T['copStop'] - 1) * .05
weak = tt > T['cakeHit']; sir[weak] = (np.sin(2 * np.pi * 620 * tt) * (np.sin(2 * np.pi * .9 * tt) > .6))[weak] * .02
sir *= 1 - seg(tt, T['hold1'] + 1, T['hold1'] + 3); fx[:, 0] += lp(sir, 3000) * .7; fx[:, 1] += lp(sir, 3000)
# the end: silence, a coo, wings, the second whistle; a splat in the black
coo(T['look'] + .2, .14); add(fx, hp(noise(.6), 1500) * np.abs(np.sin(2 * np.pi * 18 * t_(.6))) * .06, T['fly'], 1, -.3)
add(fx, clack(1.1, .15), T['knock'], 1, 0); whistle(T['fall2'], 2.4, .06); splat(T['fall2'] + 2.45, .35)
mus, _ = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32')
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus * .8 + amb + fx
r = int(.03 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · rms music', round(rms(mus * .8), 1), 'amb', round(rms(amb), 1), 'fx', round(rms(fx), 1))
