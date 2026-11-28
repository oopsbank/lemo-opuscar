# The Ring Run — music (an original music-box chase: glockenspiel, pizzicato, ukulele; CC0 samples) + small toy foley, sparse,
# with real silences; only the chapel bell is full-size (a deep synthesized DONG that shakes the frame) → out/mix.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import *
from core.audio import sampler as S
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
T = {e['type']: e['t'] for e in E['ev'] if e['type'] not in ('cam', 'cut', 'clank', 'tink')}
rng = np.random.default_rng(3); tt = np.arange(N) / SR
fx = np.zeros((N, 2))
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def tone(f, d, v, decay=None):
    t = t_(d); ph = np.cumsum(2 * np.pi * (f if np.ndim(f) else np.full(len(t), f)) / SR)
    e = np.exp(-t / decay) if decay else np.minimum(1, (d - t) / .04)
    return np.sin(ph) * np.minimum(1, t / .004) * e * v
def ting(at, v=.05, f=3200, pan=0): add(fx, tone(f, .5, v, .12) + tone(f * 2.01, .5, v * .4, .06), at, 1, pan)
def coo(at, v=.06):
    for k, (d, f0) in enumerate(((.2, 520), (.32, 450))): t = t_(d); add(fx, lp(tone(f0 * (1 + .12 * np.sin(np.pi * t / d)), d, v), 1400) * (.6 + .4 * np.sin(2 * np.pi * 26 * t)), at + k * .24, 1, -.2)
def boing(at, v=.08): d = .5; t = t_(d); add(fx, np.sin(np.cumsum(2 * np.pi * (180 + 260 * np.exp(-t / .08) + 40 * np.sin(2 * np.pi * 14 * t)) / SR)) * np.exp(-t / .18) * v, at, 1, 0)
def whistle(at, d, v=.03, f0=1800, f1=500): t = t_(d); add(fx, tone(np.linspace(f0, f1, len(t)), d, v), at, 1, 0)
def plop(at, v=.12): d = .35; t = t_(d); add(fx, (np.sin(np.cumsum(2 * np.pi * (900 * np.exp(-t / .05) + 180) / SR)) * np.exp(-t / .08) + lp(noise(d), 1500) * np.exp(-t / .05) * .4) * v, at, 1, .3)
def bell_bike(at, v=.04): ting(at, v, 2600); ting(at + .16, v, 2600)
def tram_bell(at, v=.05): ting(at, v, 1500, -.2); ting(at + .2, v, 1500, -.2)
# —— 0–4: the peck, the roll, the fall ——
coo(T['land'] + .2); ting(.5, .05); add(fx, clack(1.6, .14), T['peck'], 1, 0)
for k in range(6): add(fx, clack(2.2 + k * .05, .03), T['peck'] + .12 + k * .13, 1, .1)
whistle(T['fall0'] + .05, 2.0, .025, 1400, 380)
add(fx, lp(thump(.25, 60), 600), 2.15, 1, -.5)                         # the tower clock's deep TÓC
# —— 4–11: line, awning, basket, bell, stairs ——
d = .4; t = t_(d); add(fx, np.sin(2 * np.pi * 140 * t) * np.exp(-t / .1) * (1 + np.sin(2 * np.pi * 40 * t)) * .06, T['line'], 1, 0)   # TƯNG
boing(T['awning']); add(fx, lp(noise(.12), 900) * np.exp(-t_(.12) / .03) * .2, T['basket'], 1, .2); bell_bike(T['basket'] + .5)
for e in [x for x in E['ev'] if x['type'] == 'clank']: add(fx, lp(clack(1.4, .045), 5000), e['t'], 1, .35)
add(fx, lp(noise(.5), 1200) * np.exp(-t_(.5) / .15) * .06, T['sheet'], 1, .3)
# —— 11–19: pothole, slow flight, the tram, apples ——
add(fx, thump(.2, 150), T['pothole'], 1, -.2); add(fx, whoosh(1.6, .04), T['pothole'] + .1, 1, 0); ting(T['pothole'] + .4, .04, 3600)
add(fx, clack(1.9, .12), T['tram'], 1, -.2); tram_bell(T['tram'] + .4)
for k in range(10): add(fx, clack(1.0 + rng.uniform(-.1, .1), .05), T['apples'] + k * .13, 1, rng.uniform(-.5, .5))
# —— 19–27: the curve screech, the slide, the miss, KENG KENG, tõm ——
d = 1.4; t = t_(d); add(fx, lp(np.sin(np.cumsum(2 * np.pi * (3100 + 200 * np.sin(2 * np.pi * 9 * t)) / SR)) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3), 5000) * .018, T['curve'] + .2, 1, .3)
add(fx, lp(bp(noise(.5), 1500, 5000), 5000) * np.exp(-t_(.5) / .2) * .05, T['curve'] + .9, 1, .3)
add(fx, clack(2.0, .1), T['slip'] + .3, 1, .3); add(fx, clack(2.1, .08), T['slip'] + .48, 1, .3); plop(T['hole'] - .05, .08)
# —— 27–34: the pipe (gurgle, squeak), TÕM, ticking ——
gur = lp(bp(rng.standard_normal(N), 150, 900), 700) * (.6 + .4 * np.sin(2 * np.pi * 3 * tt)) * seg(tt, T['pipe0'], T['pipe0'] + .5) * (1 - seg(tt, T['pipe1'], T['pipe1'] + .5)) * .03
fx[:, 0] += gur; fx[:, 1] += gur
add(fx, tone(np.linspace(3400, 4200, int(.12 * SR)), .12, .03), 28.6, 1, .3); add(fx, tone(np.linspace(3600, 4400, int(.1 * SR)), .1, .025), 28.78, 1, .3)
plop(T['splash'], .16)
for k, t0 in enumerate(np.arange(31.8, 34.0, .5)): add(fx, clack(1.5 if k % 2 else 1.3, .03 + k * .006), t0, 1, -.3)
# —— 34–43: the reel, the fish, the long flight, PHỊCH, oars ——
d = .9; t = t_(d); add(fx, lp(np.sign(np.sin(2 * np.pi * 60 * t)) * (np.mod(t, .025) < .008), 4000) * .03, T['hook'] - .2, 1, .4)
for k in range(4): add(fx, lp(noise(.06), 3000) * np.exp(-t_(.06) / .015) * .05, 36.4 + k * .14, 1, .4)
add(fx, whoosh(1.4, .04), T['flick'], 1, .3); ting(T['flick'] + .2, .05, 3400); ting(T['flick'] + 1.0, .03, 3600)
add(fx, thump(.3, 120), T['boat'], 1, 0); add(fx, lp(noise(.6), 2500) * np.exp(-t_(.6) / .15) * .06, T['boat'] + .02, 1, 0)
for t0 in np.arange(40.4, 42.6, .45): add(fx, lp(noise(.18), 1200) * np.exp(-t_(.18) / .05) * .05, t0, 1, -.2)
# —— 43–57: the window, tinh tinh, murmur, RẦM, the slide ——
ting(T['rose'], .06, 3000)
for e in [x for x in E['ev'] if x['type'] == 'tink']: ting(e['t'], .035, 4200)
mur = lp(bp(rng.standard_normal(N), 300, 1500), 1200) * seg(tt, T['turn'], T['turn'] + .5) * (1 - seg(tt, T['wobble'], T['wobble'] + .6)) * .02; fx[:, 0] += mur; fx[:, 1] += mur
add(fx, thump(.8, 70), T['door'], 1, 0); add(fx, clack(.5, .3), T['door'] + .02, 1, 0)
sl = lp(bp(rng.standard_normal(N), 900, 4500), 5000) * seg(tt, T['slide0'] + .5, T['slide0'] + .8) * (1 - seg(tt, T['catch'] - .4, T['catch'])) * .04; fx[:, 0] += sl; fx[:, 1] += sl
add(fx, lp(noise(.5), 900) * np.sin(np.pi * t_(.5) / .5) * .04, T['catch'] - .55, 1, 0)   # the whole chapel gasps
for k, t0 in enumerate([55.4, 56.2, 57.2, 58.4, 59.5]): add(fx, clack(1.2, .05), t0, 1, 0)   # the tower clock ticks, slowing
# —— 60: DONG (full size), cheers ——
d = 6.0; t = t_(d); dong = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in [(98, 1, 3.5), (196, .6, 2.6), (233, .4, 2.0), (294, .3, 1.6), (392, .25, 1.0), (523, .12, .7)])
dong = dong * np.minimum(1, t / .004) + lp(noise(d), 400) * np.exp(-t / .05) * .3; add(fx, dong * .22, T['dong'], 1, 0)
che = lp(bp(rng.standard_normal(N), 500, 3000), 3500) * seg(tt, T['cheer'], T['cheer'] + .4) * (1 - seg(tt, T['crane0'] - .5, T['crane0'] + 1.5)) * .05; fx[:, 0] += che; fx[:, 1] += che
# —— 62–67: ting-ting-ting along the golden trail; the tram bell ——
for k in range(8): ting(T['crane0'] + .7 + k * .55, .03, 2400 + k * 200, -.6 + k * .17)
tram_bell(64.4, .035)
# —— 67–72: ting, coo, wings, silence, the wind of the fall ——
ting(T['ring2'] + .1, .05, 3000); coo(T['steal'] - .3, .07); add(fx, hp(noise(1.3), 1500) * np.abs(np.sin(2 * np.pi * 16 * t_(1.3))) * .05, T['steal'] + .3, 1, .2)
whistle(T['loop'], 1.0, .022, 1400, 900)
# —— music: a music-box chase that speeds up; a stop at the miss; nothing in the chapel until the bell; the wedding tune ——
S.seed(2); notes = []
def nn(t, inst, p, d, v, pan=0): notes.append((round(t, 3), inst, p, d, v, pan))
mel = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'D5', 'G5', 'A5', 'C6', 'B5', 'A5']
chords = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4']]
t = 4.3; i = 0
while t < T['door'] - .3:
    bpm = 116 + 40 * seg(t, 4.3, 44) ; st = 60 / bpm / 2
    quiet = (T['slip'] < t < T['pipe0'] + .3) or (T['splash'] - .2 < t < T['hook'])
    if not quiet:
        if i % 2 == 0 or t > 20: nn(t, 'glockenspiel', mel[i % 16], st * 1.6, .32, .2)
        if i % 4 == 0: [nn(t, 'violins_pizz', p, st * 2, .38, -.3) for p in chords[(i // 16) % 4]]
        if i % 2 == 1: nn(t, 'ukulele', chords[(i // 16) % 4][i % 3].replace('3', '4'), st, .3, -.1)
    t += st; i += 1
nn(T['slip'] + .1, 'glockenspiel', 'F5', 1.0, .3, 0)                  # the deflated note at the miss
for k, p in enumerate(['C5', 'C5', 'G5', 'E5', 'C6', 'B5', 'G5', 'A5']):   # the wedding tune, after the DONG
    nn(T['dong'] + 1.2 + k * .42, 'glockenspiel', p, .8, .42, .1)
for k, p in enumerate(['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4', 'G4', 'C5']):
    nn(T['crane0'] + .3 + k * .45, 'ukulele', p, .5, .35, -.2)
mus = S.render(notes, dur=DUR); mus = S.room(mus, size=.4, mix=.15)
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus * .55 + fx
mix = lp(mix.T, 7500).T
r = int(.04 * SR); mix[-r:] *= np.linspace(1, 0, r)[:, None]
mix = limit(mix * (.85 / max(1e-6, np.abs(mix).max())), .95)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
print('credits:', S.credits(['glockenspiel', 'violins_pizz', 'ukulele']))
m = mix.mean(1); print('per-2s dB:', [round(20 * np.log10(np.sqrt(np.mean(m[int(i * SR):int((i + 2) * SR)] ** 2)) + 1e-9)) for i in range(0, int(DUR) - 1, 2)])
