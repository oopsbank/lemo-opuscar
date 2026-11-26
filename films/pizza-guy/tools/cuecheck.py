# Cue check: every visual hit lands on the music grid (beat = 0.5 s), and the score's downbeats (out/music_cues.json) too.
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
MCF = os.path.join(HERE, 'out/music_cues.json'); MC = json.load(open(MCF)) if os.path.exists(MCF) else []
B = .5; grid = lambda t: round(t / B) * B
HITS = {'neon', 'card', 'banner', 'dlg', 'watch', 'gust', 'splat', 'flash', 'lamp', 'late', 'slam', 'title', 'knock'}
bad = 0
for e in EV:
    if e['type'] not in HITS: continue
    err = (e['t'] - grid(e['t'])) * 1000; flag = abs(err) > 1; bad += flag
    print(f"{'XX' if flag else 'ok'} {e['type']:7s} {e['t']:7.3f}s  {err:+6.1f} ms {e.get('id', '')}")
for t in MC:
    err = (t - grid(t)) * 1000
    if abs(err) > 1: bad += 1; print(f"XX music downbeat {t:.3f}s off the grid by {err:+.1f} ms")
print(f"{len(MC)} music downbeats checked; {bad} off-grid"); sys.exit(1 if bad else 0)
