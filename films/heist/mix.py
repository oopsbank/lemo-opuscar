# The Last Train Heist — 100% sound effects (no music, no words): a calm night bed; a warm toy BOOM, the bank alarm RENG-RENG;
# sirens from every side (panned), tyres KÍT, the helicopter's thwack overhead, little bumps; clanking iron stairs, wind up high;
# the clock beep, the door hiss XỊT, the departure whistle TUÝT; wheels XÌNH XỊCH speeding up, the billboard slide, a held breath
# with a heartbeat in the slow-motion, the landing BỊCH; the horn swallowed by the tunnel; the police pile-up; the sweeper's brushes
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = {e['type']: e['t'] for e in EV if e['type'] not in ('cam', 'siren', 'skid', 'bump', 'lineBump', 'clank', 'wheel')}
rng = np.random.default_rng(31)
amb, fx = np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def col(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
def tone(f, d, v):
    t = t_(d); ph = np.cumsum(2 * np.pi * (f if np.ndim(f) else np.full(len(t), f)) / SR)
    return np.sin(ph) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .05) * v
def st(x, l=1., r=1.): return np.stack([x * l, x * r], 1)
slow = (tt > T['slow0']) & (tt < T['slow1'])
duck = 1 - .85 * np.clip(seg(tt, T['slow0'] - .1, T['slow0'] + .05) - seg(tt, T['slow1'] - .05, T['slow1'] + .25), 0, 1)
# —— beds: a quiet night city; wind on the roofs ——
amb += st(lp(col(40, 500), 300) * .05)
amb += st(hp(col(300, 3000), 200) * .02 * (.6 + .4 * np.sin(2 * np.pi * .13 * tt)) * seg(tt, 20, 23) * (1 - seg(tt, T['out0'], T['out0'] + 3)), 1, .8)
for t0 in np.cumsum(rng.uniform(1.5, 3.5, 30)):
    if t0 > DUR - 2: break
    if t0 < 5: add(fx, lp(whoosh(1.4, .05), 1500), t0, 1, rng.uniform(-.8, .8))   # a passing car or two before the bang
# —— the BOOM and the alarm ——
add(fx, thump(.9, 55), T['boom'], 1, 0); add(fx, lp(noise(1.2), 700) * np.exp(-t_(1.2) / .25) * .5, T['boom'], 1, 0); add(fx, crash(.25), T['boom'] + .02, 1, 0)
add(fx, clack(.4, .35), T['boom'] + 1.35, 1, .2)   # the iron door lands
ring = np.sign(np.sin(2 * np.pi * 1650 * tt)) * (np.sin(2 * np.pi * 24 * tt) > 0) * .5 + np.sin(2 * np.pi * 3300 * tt) * .3
ring *= (np.mod(tt - T['alarm'], 1.2) < .85) * seg(tt, T['alarm'], T['alarm'] + .05) * (1 - seg(tt, 22, 30)) * .05
amb += st(bp(ring, 800, 5000), 1, .85)
# people gasp-scatter: quick pattering steps from the café
for k in range(14): add(fx, step(.05), T['cafe'] + k * .09 + rng.uniform(0, .05), 1, .5)
# —— sirens from every side (panned), skids, bumps ——
for e in [x for x in EV if x['type'] == 'siren']:
    a, b, pan = e['t'], e['end'], e['pan']; d = min(DUR - a, (T['black'] - a)); t = t_(d)
    f = 820 + 260 * np.sign(np.sin(2 * np.pi * (.9 + e['i'] * .07) * t + e['i'])); x = np.tanh(2.2 * np.sin(np.cumsum(2 * np.pi * f / SR)))
    g = np.minimum(1, t / .8) * (1 - .55 * np.clip((t - (b - a)) / 2, 0, 1)) * .03
    add(fx, lp(x, 3200) * g, a, 1, pan)
for e in [x for x in EV if x['type'] == 'skid']:
    d = .7; t = t_(d); sq = (np.sin(np.cumsum(2 * np.pi * (2100 + 400 * np.sin(2 * np.pi * 13 * t)) / SR)) * .5 + bp(noise(d), 1800, 5000) * .5) * np.minimum(1, (d - t) / .15) * .07
    add(fx, sq, e['t'], 1, e['pan'])
for e in [x for x in EV if x['type'] == 'bump']: add(fx, clack(.55, .22), e['t'], 1, rng.uniform(-.5, .5)); add(fx, thump(.18, 120), e['t'], 1, 0)
# —— the helicopter: a rotor thwack, louder when close, panned from the left ——
rot = (np.abs(np.sin(2 * np.pi * 5.6 * tt)) ** 8) * lp(col(60, 900), 500) * 1.6 + lp(col(30, 200), 120) * .4
hg = seg(tt, T['heli'] - 1, T['heli'] + 3) * .09 * (1 - .4 * seg(tt, T['out0'], T['out0'] + 4))
amb[:, 0] += rot * hg * (1.2 - .4 * seg(tt, T['heli'], 20)); amb[:, 1] += rot * hg * (.6 + .4 * seg(tt, T['heli'], 20))
# —— the climb: iron stairs, roof steps, the two jumps ——
for e in [x for x in EV if x['type'] == 'clank']: add(fx, clack(1.3 + rng.uniform(-.1, .1), .1), e['t'], 1, .3)
for t0 in np.arange(T['fire1'] + .2, T['board0'], .21): add(fx, step(.06), t0, 1, .35)
for k in ('jump1', 'jump2'): add(fx, whoosh(.5, .08), T[k], 1, .3); add(fx, thump(.2, 140), T[k] + .55, 1, .3)
# —— midnight at the station: clock beep, doors XỊT, whistle TUÝT ——
add(fx, tone(2000, .12, .05), T['clock'], 1, -.6); add(fx, tone(2000, .12, .05), T['clock'] + .18, 1, -.6)
add(fx, hp(noise(.7), 1800) * np.exp(-t_(.7) / .25) * .09, T['doors'], 1, -.5); add(fx, clack(.9, .12), T['doors'] + .35, 1, -.5)
d = 1.1; t = t_(d); add(fx, (np.sin(2 * np.pi * 2350 * t) + .3 * np.sin(2 * np.pi * 4700 * t)) * (1 + .3 * np.sin(2 * np.pi * 30 * t)) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .1) * .05, T['whistle'], 1, -.5)
# —— the train: wheels speeding up, a rising hum ——
for e in [x for x in EV if x['type'] == 'wheel']: add(fx, clack(.6, .1), e['t'], 1, np.clip((e['t'] - T['depart']) / 12 - .6, -.7, .7)); add(fx, clack(.65, .08), e['t'] + .09, 1, 0)
hum = np.sin(2 * np.pi * (70 + 40 * seg(tt, T['depart'], T['tunnel'])) * tt) * seg(tt, T['depart'], T['depart'] + 2) * (1 - seg(tt, T['tunnel'], T['tunnel'] + 1.5)) * .04
amb += st(hum)
# —— the leap: slide hiss, a held breath (everything ducks) with two heartbeats, the landing BỊCH ——
add(fx, bp(noise(T['launch'] - T['board0']), 700, 4000) * np.linspace(.01, .08, int(round((T['launch'] - T['board0']) * SR))), T['board0'], 1, .2)
add(fx, whoosh(.6, .1), T['launch'] - .1, 1, 0)
hb = np.zeros((N, 2))
for k in range(2): add(hb, heartbeat(.6), T['slow0'] + .1 + k * .7, 1, 0)
add(fx, thump(.55, 90), T['land'], 1, -.1); add(fx, clack(.5, .2), T['land'] + .03, 1, -.1); add(fx, step(.08), T['roll'], 1, 0); add(fx, clack(1.1, .12), T['grab'], 1, 0)
# —— the tunnel: the horn swallowed, an echo that fades ——
d = 3.2; t = t_(d); horn = sum(np.sin(2 * np.pi * f * t) for f in (311, 392)) * np.minimum(1, t / .05) * np.exp(-t / 1.0)
hn = lp(horn, 1800) * .06; add(fx, hn, T['tunnel'] - .4, 1, .6)
for k in range(1, 5): add(fx, lp(hn, 1200 - 200 * k) * .5 ** k, T['tunnel'] - .4 + .28 * k, 1, .7)
add(fx, whoosh(1.4, .12), T['tunnel'] - .3, 1, .8)
# —— the useless police line: brakes and bumps ——
for e in [x for x in EV if x['type'] == 'lineBump']: add(fx, clack(.5, .18), e['t'], 1, -.2); add(fx, tone(np.linspace(2400, 1900, int(.3 * SR)), .3, .02), e['t'] - .3, 1, -.2)
# —— the sweeper: a small motor, brushes scratching XÀO XẠO ——
sw = seg(tt, T['sweep0'], T['sweep0'] + .8) * (tt < T['black'])
brush = bp(col(1500, 7000), 1500, 7000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 2.2 * tt))) * .05 + lp(np.sign(np.sin(2 * np.pi * 48 * tt)), 300) * .02
amb += st(brush * sw, .9, 1)
mix = (amb + fx) * duck[:, None] + hb
blk = tt >= T['black']; mix[blk] *= np.exp(-(tt[blk] - T['black']) / .08)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('mix', DUR, 's · amb', round(rms(amb), 1), 'fx', round(rms(fx), 1))
