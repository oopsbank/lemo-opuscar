"""mix.py — CA ĐÊM: chip score + foley + text blips → out/mix_raw.wav (48 kHz stereo). Everything synthesised; reads timeline.json.
Master afterwards with ffmpeg loudnorm (linear) to −14 LUFS; the silence (59.5–62.5) and the end stay digital zero."""
import os, sys, json, unicodedata, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, limit
TL = json.load(open(os.path.join(HERE, os.environ.get('TIMELINE', 'timeline.json')))); T = TL['t']; DUR = TL['dur']; N = int(DUR * SR)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); rng = np.random.default_rng(5)
def put(bus, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR)); x = np.asarray(x, float) * g
    if s >= N or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    x = x[:N - s]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[s:s + len(x), 0] += x * l * 1.414; bus[s:s + len(x), 1] += x * r * 1.414
def sq(f, d, duty=.5): ph = np.cumsum(np.full(len(t_(d)), f) if np.isscalar(f) else f) / SR; return ((ph % 1) < duty).astype(float) * 2 - 1
def tri(f, d): ph = np.cumsum(np.full(len(t_(d)), f) if np.isscalar(f) else f) / SR; return np.round((2 * np.abs(2 * (ph % 1) - 1) - 1) * 7) / 7
def adsr(d, a=.005, r=.06): x = t_(d); return np.clip(np.minimum(x / max(a, 1e-4), (d - x) / max(r, 1e-4)), 0, 1)
def echo(x, taps=((.27, .32), (.375, .2), (.56, .1))):
    y = np.concatenate([x, np.zeros(int(.7 * SR))])
    for dt, g in taps: s = int(dt * SR); y[s:s + len(x)] += x * g
    return y
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
B = 60 / TL['bpm']

# —— the score: a lonely D-minor store tune (0–33 s), cut dead at the [!]; then a drone; a heartbeat ——
CUT = T['excl']
mel = [(0, 69, 1.5), (1.5, 65, .5), (2, 64, 1), (3, 62, 2), (5, 60, 1), (6, 62, 1.5), (7.5, 64, .5), (8, 65, 3), (12, 64, 1), (13, 62, 1), (14, 58, 2), (16, 57, 3),
       (20, 62, 1), (21, 65, 1), (22, 69, 1.5), (23.5, 67, .5), (24, 65, 2), (26, 64, 1), (27, 62, 4)]
roots = [50, 46, 43, 45]   # Dm Bb Gm A (a bar each, 4 beats)
for rep in range(3):
    t0 = rep * 32 * B
    for b, m, d in mel:
        t = t0 + b * B
        if t >= CUT: continue
        dd = min(d * B, CUT - t); x = sq(hz(m) * (1 + .003 * np.sin(2 * np.pi * 5 * t_(dd))), dd, .125) * adsr(dd, .01, .12) * .1
        put(mus, echo(x), t, pan=-.15)
    for bar in range(8):
        for k in range(4):
            t = t0 + (bar * 4 + k) * B
            if t >= CUT: continue
            d = min(B * .9, CUT - t); r = roots[bar % 4] - (12 if k % 2 == 0 else 0)
            put(mus, tri(hz(r), d) * adsr(d, .005, .1) * .16, t)
        for k in range(8):   # a soft off-beat pulse (closed-hat noise)
            t = t0 + (bar * 4 + k * .5 + .25) * B
            if t >= CUT: continue
            put(mus, hp(noise(.03), 6000) * env_exp(.03, .006) * .05, t, pan=.4)
mus[int(CUT * SR):] = 0   # cut dead: no echo tail
# the drone after the cut (until the dive), with a slow swell
d0, d1 = CUT + .4, T['dive']; d = d1 - d0; x = t_(d)
drone = (tri(hz(26), d) * .5 + np.sin(2 * np.pi * hz(38) * x) * .25) * np.clip(x / 3, 0, 1) * np.clip((d - x) / .05, 0, 1) * (1 + .3 * np.sin(2 * np.pi * .2 * x)) * .12
put(mus, drone, d0)
# the heartbeat: slow from the first flicker, racing after the second
t, beat = T['fl1'] - 1, 0
while t < T['dive']:
    rate = 66 if t < T['fl2'] else 66 + 84 * (t - T['fl2']) / (T['fl3'] - T['fl2'])
    for dt, g in ((0, 1), (.14, .6)):
        dd = .16; y = np.sin(2 * np.pi * 50 * t_(dd) * (1 - .3 * t_(dd) / dd)) * env_exp(dd, .05); put(fx, lp(y, 200) * g * (.35 if t < T['fl2'] else .5), t + dt)
    t += 60 / rate

# —— ambience: rain (muffled under the paper), the freezer hum (drops out in the dark frames) ——
rain = lp(hp(rng.standard_normal(N), 900), 6000) * .03
env = np.ones(N); env[int(T['dark'] * SR):int(21.75 * SR)] = .35; env[int(T['door'] * SR):int((T['inside'] + .6) * SR)] = 2.2
env[int(42 * SR):] = .5; env[int(54.75 * SR):] = 0
rain *= np.convolve(env, np.ones(2400) / 2400, 'same')
amb[:, 0] += rain; amb[:, 1] += np.roll(rain, 31)
xx = np.arange(N) / SR; hum = (np.sin(2 * np.pi * 60 * xx) * .5 + np.sin(2 * np.pi * 120 * xx) * .3 + np.sin(2 * np.pi * 180 * xx) * .1) * .025
henv = np.ones(N); henv[int(54.75 * SR):] = 0
def lightAt(t):
    f1 = [(0, .125), (.25, .375), (.46, .54)]; f2 = [(0, .33), (.42, .5)]
    return not (any(T['fl1'] + a <= t < T['fl1'] + b for a, b in f1) or any(T['fl2'] + a <= t < T['fl2'] + b for a, b in f2) or (T['fl3'] - .1 <= t < 54.75))
for i in range(int(42 * SR), int(54.75 * SR), 480):
    if not lightAt(i / SR): henv[i:i + 480] = 0
amb[:, 0] += hum * henv; amb[:, 1] += hum * henv

# —— foley ——
for k in range(int(8.25 / B)):   # the clock: tick… tock…
    put(fx, bp(noise(.03), 2500 if k % 2 == 0 else 1800, 6000) * env_exp(.03, .004) * .35, k * B, pan=.5)
put(fx, lp(noise(1.2), 900) * np.sin(np.pi * t_(1.2) / 1.2) ** 2 * .25, T['yawn'])   # a yawn
put(fx, sq(1320, .16, .5) * adsr(.16) * .12, T['beep'])   # BEEP
put(fx, sq(1320, .1, .5) * adsr(.1) * .1, T['beep'] + .2)
def rustle(d, g):
    x = bp(noise(d), 1500, 7000) * (np.abs(np.sin(2 * np.pi * 9 * t_(d))) ** 3) * np.sin(np.pi * t_(d) / d) ** .5
    return x * g
put(fx, rustle(.7, .5), T['paperUp'] - .1); put(fx, rustle(.5, .4), T['paperOut'])
def clusters(s):
    out = []
    for ch in unicodedata.normalize('NFD', s):
        if unicodedata.category(ch) == 'Mn' and out: out[-1] += ch
        else: out.append(ch)
    return out
for r in TL['paper']:   # typed ticks on the paper
    for k, c in enumerate(clusters(r['text'])):
        if c != ' ': put(fx, hp(noise(.012), 3000) * env_exp(.012, .002) * .3, r['a'] + (k + 1) / r['cps'], pan=(k % 5 - 2) * .1)
BL = {'sys': 1400, 'nam': 520, 'sms': 980}
for b in TL['boxes']:   # text blips, a pitch per speaker
    for k, c in enumerate(clusters(b['text'])):
        if c == ' ' or k % 2: continue
        tt = b['a'] + (k + 1) / b['cps']
        if tt < b['b']: put(fx, sq(BL[b['blip']] * (1 + .03 * ((k // 2) % 3)), .035, .25) * adsr(.035, .002, .015) * .07, tt)
put(fx, sq(np.linspace(600, 1200, len(t_(.08))), .08, .25) * adsr(.08) * .1, T['q'])   # the ? pop
for k in range(int((T['excl'] - T['wipe']) * 5 / np.pi)):   # rag squeaks on each stroke
    tt = T['wipe'] + (k + .5) * np.pi / 5
    put(fx, bp(sq(np.linspace(900, 1300, len(t_(.09))), .09, .3), 700, 3000) * adsr(.09) * .04, tt, pan=.3)
# the door chime, detuned (two tones bending flat), rain louder while the door is open
for f, dt in ((988, 0), (784, .35)):
    d = 1.4; x = t_(d); y = np.sin(2 * np.pi * np.cumsum(f * (1 - .03 * x - .01 * np.sin(2 * np.pi * 6 * x))) / SR) * env_exp(d, .5)
    put(fx, echo(y * .3), T['door'] + dt, pan=-.4)
# wet steps down the aisle (the walk cycle steps every 0.25 s)
t = T['inside'] - .3
while t < T['atShelf']:
    d = .12; y = lp(noise(d), 1800) * env_exp(d, .03) + bp(noise(d), 300, 900) * env_exp(d, .05) * .6
    put(fx, y * .22, t, pan=-.5 + .5 * (t - T['inside']) / (T['atShelf'] - T['inside'])); t += .25
# the CHING: harsh and bright
d = .9; x = t_(d); ching = (sq(2093, d, .5) * .5 + sq(3136, d, .25) * .3 + np.sin(2 * np.pi * 4186 * x) * .4) * env_exp(d, .18)
put(fx, ching * .3, T['excl'])
# the neon: buzz while it struggles, a pop when it relights
def buzz(d): x = t_(d); return bp(sq(120, d, .5) + .4 * noise(d), 200, 4000) * .5
prev = True
for i in range(int(42 * 100), int(54.75 * 100)):
    tt = i / 100; L = lightAt(tt)
    if L != prev:
        if L: put(fx, hp(noise(.05), 1500) * env_exp(.05, .01) * .5 + 0, tt)   # BỤP
        else: put(fx, buzz(.12) * .3, tt)                                          # RÈ
        prev = L
put(fx, np.sin(2 * np.pi * 1800 * t_(.12)) * env_exp(.12, .03) * .1, T['sweat'] + .9)   # the sweat drop lands
# the dive: a whoosh and a thump
put(fx, bp(noise(.4), 400, 3000) * np.sin(np.pi * t_(.4) / .4) * .3, T['dive'])
put(fx, lp(noise(.25), 300) * env_exp(.25, .05) * .7 + np.sin(2 * np.pi * 70 * t_(.25)) * env_exp(.25, .06) * .5, T['fl3'] - .05)
# under the counter: a shaky breath, wet steps (six), then absolute silence
put(fx, lp(noise(1.1), 1200) * (np.sin(np.pi * t_(1.1) / 1.1) * (1 + .5 * np.sin(2 * np.pi * 7 * t_(1.1)))) * .12, 54.95)
for k in range(6):
    tt = T['stepsA'] + k * (T['bootsStop'] - T['stepsA']) / 6 + .1
    d = .2; y = lp(noise(d), 1500) * env_exp(d, .05) + bp(noise(d), 200, 700) * env_exp(d, .08) * .8 + hp(noise(d), 4000) * env_exp(d, .01) * .3
    put(fx, y * (.25 + k * .05), tt, pan=.6 - k * .08)
put(fx, lp(noise(.8), 800) * np.sin(np.pi * t_(.8) / .8) * .1, T['silenceEnd'] + .4)   # a held breath released
# the phone: buzz, TING, TING; a sub swell; the eyes; the glitch; the static
put(fx, sq(150, .6, .5) * (np.sin(2 * np.pi * 12 * t_(.6)) > 0) * .08, T['buzz'])
for tt in (T['ting1'], T['ting2']):
    d = 1.2; x = t_(d); put(fx, (np.sin(2 * np.pi * 2637 * x) + .4 * np.sin(2 * np.pi * 3951 * x)) * env_exp(d, .25) * .22, tt)
d = T['glitch'] - T['ting2']; x = t_(d); put(fx, np.sin(2 * np.pi * (36 + 6 * x / d) * x) * (x / d) ** 2 * .35, T['ting2'])
d = 1.4; x = t_(d); put(fx, bp(noise(d), 200, 2000) * (x / d) ** 3 * .25, T['eyesOpen'])
put(fx, np.round(noise(.15) * 4) / 4 * .4, T['glitch'])
d = T['black'] - T['static']; put(fx, hp(noise(d), 300) * .2 * np.clip((d - t_(d)) / .02, 0, 1), T['static'])

out = mus + fx + amb
for a, b in ((T['bootsStop'], T['silenceEnd']), (T['black'], DUR)): out[int(a * SR):int(b * SR)] = 0   # true silence
out = np.stack([limit(out[:, 0], .75), limit(out[:, 1], .75)], 1)
for a, b in ((T['bootsStop'], T['silenceEnd']), (T['black'], DUR)): out[int(a * SR):int(b * SR)] = 0
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', os.environ.get('MIXOUT', 'mix_raw.wav')), out, SR, subtype='PCM_24'); print('ok', out.shape)
