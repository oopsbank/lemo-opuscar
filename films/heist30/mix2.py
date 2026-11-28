# The Last Train Heist — 35 s recut, audio v2 ("too noisy"): built from scratch in film time with few layers at once.
# The blast at 0–1 s; the alarm and sirens only in short bursts, far down; no wind/crowd/drone loops; quiet gaps so the key hits
# (door blast, train doors hissing, the landing, the sweeper) stand out; the slow-motion jump almost silent (a whoosh, a heartbeat);
# a soft low pulse under the chase (procedural, no samples); everything low-passed above ~6.5 kHz → out/mix2.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
CUTS = [(e['t'], e['s0'], e['s1'], e['k'], e['cam']) for e in E['ev'] if e['type'] == 'cut']
def film(s):   # story → film time (first segment containing s), or None
    for f0, s0, s1, k, _ in CUTS:
        if s0 <= s <= s1: return f0 + (s - s0) / k
    return None
cut_t = [c[0] for c in CUTS]
rng = np.random.default_rng(5); tt = np.arange(N) / SR
fx = np.zeros((N, 2)); bed = np.zeros((N, 2)); hb = np.zeros((N, 2))
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def tone(f, d, v):
    t = t_(d); ph = np.cumsum(2 * np.pi * (f if np.ndim(f) else np.full(len(t), f)) / SR)
    return np.sin(ph) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .04) * v
def put(x, s, g=1, pan=0):
    t = film(s)
    if t is not None: add(fx, x, t, g, pan)
# —— 0–1 s: the blast (the loudest thing in the film), the door clanging down ——
add(fx, thump(.55, 52), .25, 1, 0); add(fx, lp(noise(1.0), 500) * np.exp(-t_(1.0) / .2) * .3, .25, 1, 0)
add(fx, lp(clack(.4, .3), 3000), 1.55, 1, .2)
# —— the alarm: two short bursts, far down ——
for a, b in [(.7, 2.4), (3.3, 4.6)]:
    d = b - a; t = t_(d); r = (np.sin(2 * np.pi * 1300 * t) * .6 + np.sin(2 * np.pi * 2600 * t) * .2) * (np.sin(2 * np.pi * 20 * t) > 0) * (np.mod(t, .9) < .6)
    add(fx, lp(r, 3500) * np.minimum(1, t / .08) * np.minimum(1, (d - t) / .3) * .025, a, 1, -.2)
# —— sirens: two wails that come and go (panned), two skids ——
for a, d, pan in [(4.2, 2.6, -.6), (6.4, 2.4, .6)]:
    t = t_(d); f = 760 + 220 * np.sin(2 * np.pi * .8 * t); x = np.tanh(1.6 * np.sin(np.cumsum(2 * np.pi * f / SR)))
    add(fx, lp(x, 2600) * np.sin(np.pi * t / d) ** 2 * .022, a, 1, pan)
for a, pan in [(5.1, -.5), (7.3, .5)]:
    d = .5; t = t_(d); add(fx, lp(bp(noise(d), 1500, 4000), 4500) * np.sin(np.pi * t / d) * .05, a, 1, pan)
# —— the helicopter: a soft low thwack, only while it is on screen in the chase ——
rot = lp((np.abs(np.sin(2 * np.pi * 5.4 * tt)) ** 8) * rng.standard_normal(N), 600) * .9
env = np.zeros(N)
for a, b in [(5.6, 8.9), (14.5, 18.8), (21.5, 25.6)]: env += seg(tt, a, a + .8) * (1 - seg(tt, b - .8, b))
bed[:, 0] += rot * env * .05; bed[:, 1] += rot * env * .035
# —— the run: light steps in the alley; iron clanks on the fire escape; roof steps; the first jump ——
for s in np.arange(16.1, 20.5, .24): put(lp(step(.04), 5000), s, 1, .2)
for s in np.arange(23.5, 25.8, .26): put(lp(clack(1.2, .06), 5000), s, 1, .3)
for s in np.arange(26.0, 28.3, .22): put(lp(step(.035), 5000), s, 1, .3)
put(lp(whoosh(.45, .05), 4000), 28.35, 1, .3); put(thump(.18, 140), 28.95)
# —— the clock insert: two beeps on the flip; the train doors hiss (a key hit, at the end of the insert) ——
add(fx, tone(1900, .1, .05), film(29.0), 1, -.3); add(fx, tone(1900, .1, .05), film(29.0) + .16, 1, -.3)
add(fx, lp(hp(noise(.8), 900), 5500) * np.exp(-t_(.8) / .25) * .11, cut_t[5] - .55, 1, -.4); add(fx, lp(clack(.9, .1), 4000), cut_t[5] - .1, 1, -.4)
# —— the train: a soft whistle as the slice opens, wheels speeding up (sparse), the billboard slide ——
d = .9; t = t_(d); add(fx, lp(np.sin(2 * np.pi * 1900 * t) * (1 + .2 * np.sin(2 * np.pi * 28 * t)) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .1), 4000) * .03, cut_t[5] + .1, 1, -.5)
s = 38.6
while s < 43.5: put(lp(clack(.6, .06), 3500), s, 1, -.2); s += max(.3, .9 - (s - 38.6) * .12)
put(lp(bp(noise(2.4), 600, 3000), 4000) * np.linspace(.0, .045, int(round(2.4 * SR))), 40.6, 1, .2)
# —— the leap: everything drops away; one whoosh; two soft heartbeats; the landing BỊCH ——
f_slow0, f_slow1 = cut_t[6], cut_t[7]
add(fx, lp(whoosh(.7, .09), 3500), f_slow0 - .35, 1, 0)
for k in range(2): add(hb, lp(heartbeat(.35), 900), f_slow0 + .15 + k * .65, 1, 0)
put(thump(.38, 88), 44.95); put(lp(clack(.5, .14), 3500), 44.98, 1, -.1); put(lp(step(.06), 4000), 45.6); put(lp(clack(1.0, .08), 4000), 46.2)
# —— the tunnel: the horn, an echo fading; then quiet ——
tun = film(48.94); d = 2.6; t = t_(d); horn = sum(np.sin(2 * np.pi * f * t) for f in (311, 392)) * np.minimum(1, t / .05) * np.exp(-t / .9)
hn = lp(horn, 1600) * .05; add(fx, hn, tun - .4, 1, .6)
for k in range(1, 4): add(fx, lp(hn, 1100 - 200 * k) * .45 ** k, tun - .4 + .3 * k, 1, .7)
# —— the end: the sweeper's brushes (a key hit) and the 00:00 beep ——
f_end = cut_t[8]; dd = DUR - f_end; t = t_(dd)
brush = lp(bp(rng.standard_normal(len(t)), 1200, 5000), 5500) * (.55 + .45 * np.abs(np.sin(2 * np.pi * 2.0 * t))) * .07 + lp(np.sign(np.sin(2 * np.pi * 46 * t)), 250) * .012
add(fx, brush * np.minimum(1, t / .3), f_end, 1, -.1)
add(fx, tone(2000, .1, .06), 33.25, 1, 0); add(fx, tone(2000, .1, .06), 33.41, 1, 0)
# —— a soft low pulse (D minor, 96 BPM) under the chase; out for the leap and the ending ——
beat = 60 / 96; pulse = np.zeros(N)
for i, t0 in enumerate(np.arange(3.2, 33.0, beat / 2)):
    if f_slow0 - .5 < t0 < f_slow1 + .6: continue
    f = [73.4, 73.4, 87.3, 65.4][int(t0 / (beat * 8)) % 4]; d = beat * .45; t = t_(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .12) * (1 if i % 2 == 0 else .55); i0 = int(t0 * SR); pulse[i0:i0 + len(x)] += x[:N - i0]
pad = sum(np.sin(2 * np.pi * f * tt + p) for f, p in ((146.8, 0), (174.6, 1.1), (220.0, 2.3))) * .33
pad = lp(pad * (.7 + .3 * np.sin(2 * np.pi * .1 * tt)), 900)
mus = (pulse * .05 + pad * .008) * seg(tt, 3.0, 4.5) * (1 - seg(tt, f_slow0 - .4, f_slow0)) + (pulse * .05 + pad * .008) * seg(tt, f_slow1 + .3, f_slow1 + 1.2) * (1 - seg(tt, 31.8, 33.0))
bed += np.stack([mus, mus], 1)
# —— the leap is near-silent: duck everything but the heartbeat ——
duck = 1 - .9 * (seg(tt, f_slow0 - .15, f_slow0 + .05) - seg(tt, f_slow1 - .05, f_slow1 + .2))
mix = (fx + bed) * duck[:, None] + hb
mix = lp(mix.T, 6500).T   # tame the top
r = int(.05 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.8 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix2.wav'), mix.astype(np.float32), SR)
m = mix.mean(1); print('per-second dB:', [round(20 * np.log10(np.sqrt(np.mean(m[int(i * SR):int((i + 1) * SR)] ** 2)) + 1e-9)) for i in range(int(DUR))])
