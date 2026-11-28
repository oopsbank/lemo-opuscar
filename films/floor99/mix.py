"""mix.py — FLOOR -99: chip score + foley + Leo's voice (Kokoro) → out/mix_raw.wav (48 kHz stereo). Reads timeline.json and voices/."""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, limit
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['t']; DUR = TL['dur']; N = int(DUR * SR)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); vmask = np.zeros(N)
def put(bus, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR)); x = np.asarray(x, float) * g
    if s >= N or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    x = x[:N - s]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[s:s + len(x), 0] += x * l * 1.414; bus[s:s + len(x), 1] += x * r * 1.414
def ph(f, d): return np.cumsum(np.full(len(t_(d)), f) if np.isscalar(f) else f) / SR
def sq(f, d, duty=.5): return ((ph(f, d) % 1) < duty).astype(float) * 2 - 1
def tri(f, d): return np.round((2 * np.abs(2 * (ph(f, d) % 1) - 1) - 1) * 7) / 7
def adsr(d, a=.004, r=.05): x = t_(d); return np.clip(np.minimum(x / max(a, 1e-4), (d - x) / max(r, 1e-4)), 0, 1)
def echo(x, taps=((.21, .3), (.43, .15))):
    y = np.concatenate([x, np.zeros(int(.5 * SR))])
    for dt, g in taps: s = int(dt * SR); y[s:s + len(x)] += x * g
    return y
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
B = 60 / TL['bpm']
def kick(): d = .18; x = t_(d); return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-x * 25) + 45) / SR) * env_exp(d, .06)
def snare(): d = .15; return (hp(noise(d), 1500) * env_exp(d, .04) + np.sin(2 * np.pi * 190 * t_(d)) * env_exp(d, .03) * .4)
def hat(): d = .03; return hp(noise(d), 7000) * env_exp(d, .006)

# —— the score ——
def section(a, b, bass=None, drums=0, lead=None, arp=None, g=1.0):
    n = int((b - a) / B)
    for k in range(n):
        t = a + k * B
        if bass: m = bass[(k // 4) % len(bass)]; d = B * .9; put(mus, tri(hz(m - 12 if k % 2 else m), d) * adsr(d) * .22 * g, t)
        if drums:
            if k % 2 == 0: put(mus, kick() * .5 * g, t)
            if drums > 1 and k % 4 == 2: put(mus, snare() * .35 * g, t)
            put(mus, hat() * .12 * g, t + B / 2, pan=.4)
        if arp:
            ch = arp[(k // 4) % len(arp)]
            for j in range(2): d = B / 2 * .8; put(mus, sq(hz(ch[(k * 2 + j) % len(ch)] + 12), d, .25) * adsr(d) * .05 * g, t + j * B / 2, pan=-.3)
    if lead:
        for bt, m, d in lead:
            t = a + bt * B
            if t >= b: continue
            dd = min(d * B, b - t); put(mus, echo(sq(hz(m), dd, .125) * adsr(dd, .005, .04) * .07 * g), t, pan=.2)
AM = [45, 45, 41, 43]   # A F G
section(4.7, 15.0, bass=AM, drums=1)
for h in T['hits']: put(mus, sq(hz(70), .12, .5) * adsr(.12) * .08 + sq(hz(71), .12, .5) * adsr(.12) * .06, h)   # dissonant stabs
# the hallway: a detuned drone pad
d = 27 - 15.2; x = t_(d); pad = (sq(hz(45), d, .5) * .3 + sq(hz(45) * 1.006, d, .5) * .3 + sq(hz(52) * .996, d, .25) * .2) * np.clip(x / 2, 0, 1) * np.clip((d - x) / .3, 0, 1)
pad = lp(pad, 1200) * .09; pad[int((T['turnA'] - 15.2) * SR):int((T['turnB'] - 15.2) * SR)] *= .25; put(mus, pad, 15.2)
section(27.2, 30.0, bass=AM, arp=[[57, 60, 64], [53, 57, 60]])
section(31.0, 40.0, bass=AM, drums=1, arp=[[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]])
riff = [(0, 69, .5), (.5, 72, .5), (1, 76, .5), (1.5, 74, .5), (2, 72, 1), (3, 71, 1), (4, 69, .5), (4.5, 72, .5), (5, 77, .5), (5.5, 76, .5), (6, 74, 2)]
lead = [(bt + rep * 8, m, d) for rep in range(4) for bt, m, d in riff]
section(40.0, 53.6, bass=AM, drums=2, arp=[[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]], lead=lead)
mus[int(T['pull'] * SR):int(55.2 * SR)] = 0
# relief: a warm C major pad, then it detunes down into the loop
d = T['cut'] - 55.4; x = t_(d); det = 1 - .06 * np.clip((x - (T['glitchSign'] - 55.4)) / 3, 0, 1)
warm = sum(np.sin(2 * np.pi * np.cumsum(hz(m) * det) / SR) for m in (60, 64, 67, 72)) / 4 * np.clip(x / 1, 0, 1) * np.clip((d - x) / .05, 0, 1)
crushed = np.round(warm * 6) / 6; mixk = np.clip((x - (T['glitchSign'] - 55.4)) / 2, 0, 1); warm = warm * (1 - mixk) + crushed * mixk
put(mus, warm * .14, 55.4)

# —— foley ——
d = 4.0; x = t_(d); put(fx, (sq(np.where((x * 2.5) % 1 < .5, 880, 660), d, .5) * .5) * .1, 0)   # the siren WEE-WOO
put(fx, lp(noise(4), 600) * np.clip(t_(4) / .2, 0, 1) * .25, 0)   # the wind of the fall
put(fx, (hp(noise(.25), 2000) * env_exp(.25, .02) + np.sin(2 * np.pi * 2200 * t_(.25)) * env_exp(.25, .08)) * .6, T['snap'])   # the cable SNAP
d = 2.2; x = t_(d); put(fx, bp(sq(1800 + 600 * np.sin(2 * np.pi * 3 * x), d, .5), 1200, 6000) * np.sin(np.pi * x / d) * .12, .3)   # metal shriek
put(fx, (lp(noise(.4), 300) * env_exp(.4, .06) + np.sin(2 * np.pi * 60 * t_(.4)) * env_exp(.4, .1)) * .9, T['slam'])   # body slam
put(fx, bp(noise(.3), 300, 3000) * env_exp(.3, .05) * .5, T['b13'])   # the jolt at B13
for i in range(40):   # claws scraping metal
    tt = 5.6 + i * .23 + (i % 3) * .05
    if tt > 15: break
    d = .16; xx = t_(d); put(fx, bp(sq(2600 + 400 * np.sin(2 * np.pi * 30 * xx), d, .3), 1500, 7000) * np.sin(np.pi * xx / d) * .05, tt, pan=(i % 5 - 2) * .2)
for h in T['hits']:   # the button TẠCH and its sparks
    put(fx, (hp(noise(.04), 2000) * env_exp(.04, .006) + sq(1600, .04, .5) * env_exp(.04, .01) * .3) * .5, h, pan=.4)
    put(fx, hp(noise(.3), 3000) * (np.random.default_rng(int(h * 10)).random(len(t_(.3))) > .9) * env_exp(.3, .1) * .3, h + .02, pan=.4)
xx = np.arange(int(12 * SR)) / SR; put(fx, (bp(sq(120, 12, .5), 100, 3000) * .5 * (1 + .5 * np.sin(2 * np.pi * 7 * xx))) * .03, 15)   # neon buzz
for k in range(int((T['turnB'] - T['turnA']) / .25)): put(fx, bp(noise(.08), 300, 1500) * env_exp(.08, .03) * .15, T['turnA'] + k * .25)   # the neck creaking
for k in range(12):   # the ghost's text: low, wobbly blips
    tt = 19.5 + (k + 1) / 7 * 2
    if tt < 23: put(fx, sq(220 + 40 * np.sin(k), .09, .5) * adsr(.09) * .06, tt)
put(fx, hp(noise(1.6), 2500) * np.clip(t_(1.6) / .05, 0, 1) * np.clip((1.6 - t_(1.6)) / .2, 0, 1) * .35, T['spray'])   # XÌÌÌ
put(fx, sq(80, .2, .5) * env_exp(.2, .05) * .4, T['lever']); put(fx, hp(noise(.05), 1500) * env_exp(.05, .01) * .4, T['lever'])   # the lever clunk
put(fx, (lp(noise(.6), 400) * env_exp(.6, .1) + np.sin(2 * np.pi * 55 * t_(.6)) * env_exp(.6, .15) + hp(noise(.6), 1500) * env_exp(.6, .03) * .5) * 1.0, T['slamDoor'])   # RẦM
d = 13; xx = t_(d); put(fx, lp(noise(d), 1400) * np.clip(xx / 1.5, 0, 1) * (1 + .4 * np.sin(2 * np.pi * .7 * xx)) * .22, 27)   # water rushing
put(fx, (hp(noise(.3), 1500) * env_exp(.3, .03) + lp(noise(.3), 300) * env_exp(.3, .05)) * .8, T['pop'])   # the light POPS
for p in T['pry']: put(fx, (bp(noise(.06), 1500, 6000) * env_exp(.06, .01) + sq(900, .06, .3) * env_exp(.06, .01) * .3) * .4, p)   # CẠCH
put(fx, (sq(140, .35, .5) * env_exp(.35, .08) + hp(noise(.35), 1200) * env_exp(.35, .05)) * .4, T['hatch'])   # the hatch clang
d = 13.6; xx = t_(d); put(fx, bp(noise(d), 600, 4000) * (1 + .5 * np.sin(2 * np.pi * 1.3 * xx)) * .1, 40)   # the wind whistling up the shaft
for k in range(int(13.5 * 9)): put(fx, hp(noise(.03), 4000) * env_exp(.03, .005) * .06, 40 + k / 9, pan=(-.7 if k % 2 else .7))   # rail sparks
def screech(d):
    x = t_(d); f = 900 + 500 * np.sin(2 * np.pi * 11 * x) + 300 * x / d
    return bp(sq(f, d, .3) + noise(d) * .5, 600, 6000) * np.sin(np.pi * x / d)
put(fx, screech(1.2) * .25, T['spiderIn'] + .3); put(fx, screech(1.0) * .2, 45.5)
d = T['hit'] - T['flareLit'] + .4; put(fx, hp(noise(d), 2500) * (1 + .6 * np.random.default_rng(3).random(len(t_(d)))) * .12, T['flareLit'])   # the flare fizz
put(fx, bp(noise(.4), 400, 3000) * np.sin(np.pi * t_(.4) / .4) * .3, T['throw'])
put(fx, (lp(noise(.5), 500) * env_exp(.5, .08) + hp(noise(.5), 2000) * env_exp(.5, .05)) * .9, T['hit']); put(fx, screech(1.6) * .35, T['hit'] + .05)
for i, m in enumerate([76, 79, 84]): put(fx, sq(hz(m), .12, .25) * adsr(.12) * .08, T['hit'] + .1 + i * .07)   # the CRITICAL HIT jingle
d = 1.0; xx = t_(d); put(fx, bp(sq(2400 + 800 * np.sin(2 * np.pi * 40 * xx), d, .5), 1500, 8000) * np.clip((d - xx) / .2, 0, 1) * .25, T['pull'])   # KÉÉÉT
put(fx, hp(noise(.8), 3000) * env_exp(.8, .2) * .25, T['pull'] + .05)
d = 1.6; xx = t_(d); put(fx, (np.sin(2 * np.pi * 1760 * xx) + .4 * np.sin(2 * np.pi * 2640 * xx)) * env_exp(d, .5) * .2, T['ting'])   # TING
put(fx, lp(noise(1.0), 900) * np.sin(np.pi * t_(1.0)) * .15, T['kneel'])   # a breath out
d = 1.5; put(fx, hp(noise(d), 1000) * (np.random.default_rng(9).random(len(t_(d))) > .6) * .12, T['glitchSign'])   # the sign glitching
put(fx, np.round(noise(.2) * 4) / 4 * .3, T['cut'])
d = T['black'] - T['static']; put(fx, hp(noise(d), 300) * .2 * np.clip((d - t_(d)) / .02, 0, 1), T['static'])

# —— Leo's voice ——
dur = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
for v in TL['vo']:
    x, sr = sf.read(os.path.join(HERE, 'voices', v['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    x = x / (np.abs(x).max() + 1e-9) * (.5 if v['id'] == 'v3' else .8)
    if v['id'] == 'v3': x = hp(x, 300) + hp(noise(len(x) / SR), 4000) * .02   # a whisper: thin, breathy
    put(vo, x, v['t']); s = int(v['t'] * SR); vmask[s:s + len(x)] = 1
from scipy.ndimage import uniform_filter1d
duck = 1 - .5 * uniform_filter1d(vmask, int(.2 * SR))
out = (mus + fx * .9) * duck[:, None] + vo
out[int(T['black'] * SR):] = 0
out = np.stack([limit(out[:, 0], .75), limit(out[:, 1], .75)], 1); out[int(T['black'] * SR):] = 0
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix_raw.wav'), out, SR, subtype='PCM_24'); print('ok')
