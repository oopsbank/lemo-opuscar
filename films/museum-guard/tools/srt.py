# Subtitles from the same data as the overlay: events.json "vo" cues + voices/dur.json → subtitles_en.srt
# Narration: shown from t−0.35 to t+max(1.9, dur+0.75) (ui.js subWindow); dialogue: its box; card lines: the card's time.
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']; DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
SQ = [(e['box'][0], e['box'][1], e.get('text', '')) for e in EV if e['type'] == 'sq']
cues = []
for e in EV:
    if e['type'] != 'vo': continue
    d = DURS.get(e['id'], 1.0)
    if e['dlg']: a, b = e['box']; cues.append((a, b, f"{e['who']}: {e['sub']}"))
    else: cues.append((e['t'] - .35, e['t'] + max(1.9, d + .75), e['sub']))
for a, b, txt in SQ: cues.append((a, b, 'DOG: ' + txt))
cues.sort()
cues = [(a, min(b, cues[i + 1][0] - .04) if i + 1 < len(cues) else b, s) for i, (a, b, s) in enumerate(cues)]
def ts(x): h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'subtitles_en.srt')
with open(out, 'w') as f:
    for i, (a, b, s) in enumerate(cues, 1): f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{s}\n\n")
bad = [(round(a, 2), s) for a, b, s in cues if b - a < 1.8]
over = [(round(cues[i][0], 2)) for i in range(len(cues) - 1) if cues[i][1] > cues[i + 1][0] + 1e-6]
print(out, len(cues), 'cues', 'short:', bad, 'overlaps:', over)
