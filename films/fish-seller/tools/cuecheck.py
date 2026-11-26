# Cue check: every visual hit lands on the music grid (beat of 2/3 s; the chase 36–40 s on a 0.5 s beat), and the score's
# section downbeats (out/music_cues.json) sit on the same grid. Prints the error per cue; exits 1 if any is over 1 ms.
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']; MC = json.load(open(os.path.join(HERE, 'out/music_cues.json')))
B = 2 / 3
def grid(t):
    g = [round(t / B) * B]
    if 36 <= t <= 40: g.append(36 + round((t - 36) / .5) * .5)
    return min(g, key=lambda x: abs(x - t))
HITS = {'lamp', 'card', 'land', 'grab', 'lift', 'dlg', 'leap', 'splash', 'turn', 'sun', 'title'}
bad = 0
for e in EV:
    if e['type'] not in HITS: continue
    t = e['t']; t0 = t - (.1 if e['type'] == 'squawk' else 0); err = (t0 - grid(t0)) * 1000
    flag = abs(err) > 1; bad += flag
    print(f"{'XX' if flag else 'ok'} {e['type']:7s} {t:7.3f}s  grid {grid(t0):7.3f}  {err:+6.1f} ms {e.get('id', '')}")
for t in MC:
    err = (t - grid(t)) * 1000; flag = abs(err) > 1; bad += flag
    if flag: print(f"XX music downbeat {t:.3f}s off the grid by {err:+.1f} ms")
print(f"{len(MC)} music downbeats checked; {bad} off-grid")
sys.exit(1 if bad else 0)
