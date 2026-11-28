"""mix.py — NO SAVE FILE: chip score by level (90 → 110 → 130 → 150 bpm, drifting out of tune), an 8-bit tick under the whole film,
foley and UI sounds, text blips (no voice), and a real-sounding mechanical clock for the twist → out/mix_raw.wav (48 kHz stereo)."""
import os, sys, json, unicodedata, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, limit
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['t']; DUR = TL['dur']; N = int(DUR * SR)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
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
def echo(x, taps=((.22, .28), (.44, .12))):
    y = np.concatenate([x, np.zeros(int((max(d for d, _ in taps) + .1) * SR))])
    for dt, g in taps: s = int(dt * SR); y[s:s + len(x)] += x * g
    return y
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def clusters(s):
    out = []
    for ch in unicodedata.normalize('NFD', s):
        if unicodedata.category(ch) == 'Mn' and out: out[-1] += ch
        else: out.append(ch)
    return out

# —— the score: one section per level; every level faster, the bass drifting flat ——
def level(a, b, bpm, chords, lead, detune=0.0, minor=False, g=1.0, drop=None):
    B = 60 / bpm; n = int((b - a) / B)
    for k in range(n):
        t = a + k * B
        if drop and drop[0] <= t < drop[1]: continue
        ch = chords[(k // 4) % len(chords)]; d = B * .9
        put(mus, tri(hz(ch[0] - 12) * (1 - detune * (k / n)), d) * adsr(d) * .2 * g, t)                     # bass, sinking
        for j in range(2): dd = B / 2 * .8; put(mus, sq(hz(ch[(k * 2 + j) % len(ch)] + 12), dd, .25) * adsr(dd) * .045 * g, t + j * B / 2, pan=-.3)
        if k % 2 == 0: put(mus, hp(noise(.03), 6000) * env_exp(.03, .006) * .06 * g, t + B / 2, pan=.4)
    for bt, m, d in lead:
        t = a + bt * B
        if t >= b or (drop and drop[0] <= t < drop[1]): continue
        dd = min(d * B, b - t); put(mus, echo(sq(hz(m) * (1 - detune * .5 * (t - a) / (b - a)), dd, .125) * adsr(dd, .005, .05) * .065 * g), t, pan=.15)
L1 = [(0, 72, 1), (1, 76, 1), (2, 79, 2), (4, 77, 1), (5, 76, 1), (6, 74, 2), (8, 72, 1), (9, 76, 1), (10, 79, 1), (11, 84, 3)]
LA = [l['a'] for l in TL['levels']]; BX = {b['id']: b for b in TL['boxes']}; CS, CZ = TL['clockStart'], TL['clockZero']
level(LA[0], LA[1], 90, [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], L1 + [(b + 12, m, d) for b, m, d in L1])
L2 = [(0, 74, 1), (1, 77, 1), (2, 81, 2), (4, 79, 1), (5, 77, 1), (6, 76, 2), (8, 74, 1), (9, 72, 1), (10, 71, 4)]
level(LA[1], LA[2], 110, [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]], [(b, m, d) for b, m, d in L2 if not (b == 9)] + [(b + 12, m, d) for b, m, d in L2], detune=.01)   # one note missing
level(LA[2], LA[3], 130, [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]], [(b, m - 12, d) for b, m, d in L2 + [(b + 12, m, d) for b, m, d in L2]], detune=.03)
level(LA[3], LA[4], 150, [[57, 60, 64], [53, 57, 60], [55, 58, 62], [52, 56, 59]], [(b, m - 15, d) for b, m, d in L2 + [(b + 12, m, d) for b, m, d in L2]], detune=.05)
level(LA[4], T['slamDoor'], 150, [[57, 60, 63], [53, 56, 60], [55, 58, 61], [52, 55, 59]], [(b, m - 16, d) for b, m, d in L2], detune=.08)

# —— the tick under everything (8-bit), louder toward the end; silent where the film goes silent ——
for k in range(60):   # one tick each time the clock drops a second (60 game-seconds from clockStart to clockZero)
    t = CS + k * (CZ - CS) / 60; g = .05 + .25 * (k / 60) ** 1.5
    if t >= T['calling']: g *= 1.6
    put(fx, sq(1800 if k % 2 == 0 else 1300, .025, .5) * env_exp(.025, .006) * g, t, pan=.25)
# heartbeats: the hook, the SAVE/SHOP panic, the slow end
def beat(at, g=.5):
    for dt, gg in ((0, 1), (.15, .6)): d = .17; x = t_(d); put(fx, lp(np.sin(2 * np.pi * 48 * x * (1 - .3 * x / d)) * env_exp(d, .05), 200) * g * gg, at + dt)
for t in np.arange(.5, T['fly'], .62): beat(t, .6)
t = T['save']
while t < T['free']: beat(t, .45); t += .45
t = T['free']
while t < T['zero']: beat(t, .35); t += .9 + (t - T['free']) * .06

# —— foley and UI ——
put(fx, hp(noise(.03), 2000) * env_exp(.03, .005) * .9, 0)                      # TẠCH: the TV switching on
put(fx, hp(noise(.12), 500) * .25, .01)                                           # 3 frames of white noise
put(fx, (np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t_(.8) * 3) + 32) / SR) * env_exp(.8, .3) + lp(noise(.8), 200) * env_exp(.8, .1)) * 1.0, T['punch'])   # BOOM
# rain + monitor beeps in the hospital
for a, b in ((T['fly'], T['cuTime']), (T['save'], T['zero'] + 1.0)):
    d = b - a; put(fx, lp(hp(noise(d), 900), 5000) * .025, a)
    t = a + .3
    while t < b: put(fx, sq(1000, .08, .5) * adsr(.08) * .05, t); t += (.6 if a == T['save'] and t < T['free'] else 1.0)
put(fx, (lp(noise(.3), 600) * env_exp(.3, .06) + np.sin(2 * np.pi * 140 * t_(.3)) * env_exp(.3, .05)) * .7, T['flip'])   # CẠCH: the hourglass turned
# text blips: TIME speaks in low bass "vrrm"s; everyone else in blips, a pitch each
PITCH = {'MOM': 900, 'MAX': 700, 'LILY': 1300, 'MIA': 800, 'LEO': 520, '1 VOICEMAIL': 1000, '': 1100}
for b in TL['boxes']:
    for i, c in enumerate(clusters(b['text'])):
        tt = b['a'] + (i + 1) / b['cps']
        if c == ' ' or tt >= b['b'] or (b.get('cutAt') and tt >= b['cutAt']): continue
        if b.get('style') == 'time': d = .07; put(fx, lp(sq(55 + (i % 3) * 4, d, .5), 400) * adsr(d) * .28, tt)
        elif i % 2 == 0: put(fx, sq(PITCH.get(b['who'], 1000) * (1 + .03 * ((i // 2) % 3)), .03, .25) * adsr(.03, .002, .012) * .06, tt)
# menus: cursor blips, confirm, the self-moving cursor's BZZT
for m in TL['menus']:
    for mv in m['move']:
        put(fx, sq(1500, .04, .25) * adsr(.04) * .08, mv)
        if m.get('auto'): put(fx, bp(sq(120, .1, .5) + noise(.1) * .5, 200, 5000) * .25, mv)
    put(fx, (sq(1200, .05, .5) * adsr(.05) * .1), m['confirm']); put(fx, sq(1800, .07, .5) * adsr(.07) * .1, m['confirm'] + .05)
# the rewind: tape rip, tracking noise, pops as the hearts light, a clean ding
d = T['lv1'] - T['rewind']; x = t_(d); put(fx, bp(sq(np.linspace(2000, 300, len(x)), d, .5), 200, 4000) * .12 + hp(noise(d), 1500) * (np.sin(2 * np.pi * 7 * x) > 0) * .08, T['rewind'])
for i in range(4): put(fx, sq(hz(72 + i * 4), .08, .5) * adsr(.08) * .12, T['rewind'] + .3 * (i + 1))
put(fx, np.sin(2 * np.pi * 1760 * t_(1.0)) * env_exp(1.0, .3) * .2, T['lv1'])
# LV1: wind, a kid's laugh (a high arpeggio), the heart pling, the tip ding
put(fx, bp(noise(1.2), 300, 2000) * np.sin(np.pi * t_(1.2) / 1.2) * .25, T['scarf'])
for i, m in enumerate([84, 88, 91, 88, 91, 96]): put(fx, sq(hz(m), .07, .25) * adsr(.07) * .06, T['scarf'] + .5 + i * .08)
put(fx, np.sin(2 * np.pi * 2093 * t_(.6)) * env_exp(.6, .2) * .2, T['heart5']); put(fx, np.sin(2 * np.pi * 1568 * t_(.8)) * env_exp(.8, .3) * .12, BX['tip']['a'])
# KA-CHING ×4, more warped each time; the sand hiss of a person crumbling; the heart cracks; the subliminal screech
def kaching(warp):
    d = .7; x = t_(d); f = (1 - warp * x / d)
    return (sq(2637 * f, d, .5) * env_exp(d, .12) * .5 + sq(3520 * f, d, .25) * env_exp(d, .2) * .3 + hp(noise(d), 4000) * env_exp(d, .03) * .4)
for at, w, sp in ((T['plus100'], 0, 1), (T['plus5k'], .1, 1), (T['plus50k'], .25, 1), (T['plus500k'], .5, .5)):
    y = kaching(w); y = np.interp(np.arange(0, len(y), sp), np.arange(len(y)), y) if sp != 1 else y; put(fx, y * .35, at)
for a, d in ((T['dustMax'] - .9, 1.8), (T['frame'], 1.2), (T['bow'] + .3, 1.0), (T['plus500k'] + .2, .7)):
    put(fx, hp(noise(d), 3000) * (np.random.default_rng(int(a * 10)).random(len(t_(d))) > .5) * np.sin(np.pi * t_(d) / d) * .14, a)
for b in (T['break1'], T['break2'], T['break3'], T['break4'], T['break5']): put(fx, (hp(noise(.12), 1500) * env_exp(.12, .02) + sq(300, .12, .5) * env_exp(.12, .03) * .3) * .55, b)
for f in (T['flash1'], T['flash2'], T['flash3'], T['flash4']): put(fx, bp(sq(np.linspace(3000, 5000, len(t_(.18))), .18, .3), 2000, 8000) * .2, f)
# LV3: the phone buzzing, the decline beep, the glass cracking
d = T['plus5k'] - T['ring']; put(fx, sq(150, d, .5) * (np.sin(2 * np.pi * 5 * t_(d)) > 0) * .07, T['ring'])
put(fx, sq(600, .1, .5) * adsr(.1) * .12, T['plus5k']); put(fx, (hp(noise(.08), 3000) * env_exp(.08, .01)) * .4, T['frame'] + .55); put(fx, hp(noise(.2), 2500) * env_exp(.2, .03) * .5, T['frame'] + .8)
# LV4: the airport ding-dong, a few claps that stop, the star going out
for i, f in enumerate((660, 520)): put(fx, np.sin(2 * np.pi * f * t_(.7)) * env_exp(.7, .3) * .15, BX['lily']['a'] + .4 + i * .35)
for i in range(7): put(fx, hp(noise(.05), 1200) * env_exp(.05, .01) * .2, T['timeSeat'] + i * .17 + (i % 2) * .05)
put(fx, sq(np.linspace(1500, 200, len(t_(.6))), .6, .5) * np.linspace(1, 0, len(t_(.6))) * .1, T['bow'])
# LV5: the door slams, echoing long; the chandelier fizz
d = 1.6; put(fx, echo((lp(noise(.5), 500) * env_exp(.5, .08) + np.sin(2 * np.pi * 55 * t_(.5)) * env_exp(.5, .12)) * 1.0, ((.18, .5), (.37, .35), (.6, .2))), T['slamDoor'])
# the montage: switches clicking, the victory fanfare slowed and detuned like a groan, the last heart, silence
for i in range(int((T['achievement'] - T['montage']) / .5)): put(fx, (hp(noise(.02), 2000) * env_exp(.02, .003) + sq(800, .02, .5) * env_exp(.02, .004) * .3) * .4, T['montage'] + i * .5)
for i, m in enumerate([72, 76, 79, 84]): d = .5; put(fx, sq(hz(m - 3) * (1 - .04 * i), d, .5) * adsr(d) * .09, T['achievement'] + i * .2)
# SAVE: the error BUZZ;  SHOP: three stamps, dry coins;  FREE: a warm music-box blip
put(fx, bp(sq(110, .35, .5) + noise(.35) * .4, 80, 3000) * .35, T['error'])
for b in T['buys']: put(fx, (lp(noise(.15), 800) * env_exp(.15, .03) + hp(noise(.15), 2000) * env_exp(.15, .01)) * .8, b)
rng = np.random.default_rng(4)
for i in range(90): tt = T['buys'][0] + rng.random() * (T['free'] - T['buys'][0]); put(fx, (np.sin(2 * np.pi * (3000 + rng.random() * 2000) * t_(.04)) * env_exp(.04, .008)) * .05, tt, pan=rng.random() - .5)
for i, m in enumerate([84, 88, 91]): put(fx, np.sin(2 * np.pi * hz(m) * t_(1.2)) * env_exp(1.2, .4) * .14, T['freeSel'] + i * .12)
# CALLING: the ringback, the pick-up click, one warm 8-bit piano note
for at in np.arange(T['calling'] + .3, T['pickup'] - .8, 1.5):
    d = .9; x = t_(d); put(fx, (np.sin(2 * np.pi * 440 * x) + np.sin(2 * np.pi * 480 * x)) * adsr(d, .02, .05) * .09, at)
put(fx, hp(noise(.03), 2000) * env_exp(.03, .005) * .5, T['pickup'])
d = 2.6; x = t_(d); put(fx, (np.sin(2 * np.pi * 523.25 * x) + .4 * np.sin(2 * np.pi * 1046.5 * x) + .15 * np.sin(2 * np.pi * 1569.8 * x)) * env_exp(d, .9) * adsr(d, .005, .3) * .3, T['pickup'] + .3)
# 00:00: the flatline swallows everything; GAME OVER: a slow detuned falling arpeggio; BUZZ on YES
d = T['gameOver'] - CZ; put(fx, sq(1000, d, .5) * .2, CZ)
for i, m in enumerate([72, 67, 64, 60, 55]): d = .4; put(fx, sq(hz(m) * (1 - .02 * i), d, .5) * adsr(d) * .1, T['gameOver'] + .2 + i * .28)
put(fx, bp(sq(110, .25, .5), 80, 3000) * .3, T['contYes'])
# THE TWIST: no chip sounds at all, only a real mechanical clock (a sharp escapement click with a metal ring and a wooden body)
def realtick(hi=True):
    d = .12; x = t_(d)
    click = hp(noise(d), 2500) * env_exp(d, .0015)
    ring = sum(a * np.sin(2 * np.pi * f * x + p) * env_exp(d, tau) for f, a, tau, p in ((3150 if hi else 2780, .35, .02, 0), (5200, .15, .01, 1), (1180, .2, .03, 2)))
    body = lp(noise(d), 600) * env_exp(d, .01) * .5
    return (click + ring + body) * .5
for i, tt in enumerate(np.arange(T['twist'], T['end'] + .01, .5)): put(fx, realtick(i % 2 == 0) * 1.6, tt)
put(fx, lp(noise(T['end'] - T['twist']), 300) * .006, T['twist'])   # a real room's faint air
# THE END: TV off and the capacitors winding down, ending in the same click the film opened on
put(fx, hp(noise(.03), 2000) * env_exp(.03, .005) * .8, T['crtOff'])
d = DUR - T['crtOff'] - .05; x = t_(d); put(fx, (np.sin(2 * np.pi * np.cumsum(15000 * np.exp(-x * 2) + 200) / SR) * .03 + np.sin(2 * np.pi * 60 * x) * .08) * np.exp(-x * 2.5), T['crtOff'])

out = mus * .85 + fx
for a, b in ((T['silence'], T['matchCut']),): out[int(a * SR):int(b * SR)] = 0   # absolute silence
out[int((T['slamDoor'] + .05) * SR):int(T['montage'] * SR)] = fx[int((T['slamDoor'] + .05) * SR):int(T['montage'] * SR)]   # the music cut dead at the door
out[int(T['twist'] * SR):int(T['end'] * SR)] = fx[int(T['twist'] * SR):int(T['end'] * SR)]
out = np.stack([limit(out[:, 0], .75), limit(out[:, 1], .75)], 1)
out[int(T['silence'] * SR):int(T['matchCut'] * SR)] = 0
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix_raw.wav'), out, SR, subtype='PCM_24'); print('ok')
