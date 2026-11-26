# Subtitle cues from the voice timings (same rule as the page: hold ≥ 1.9 s and ≥ speech + 0.65 s, never into the next line)
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
story = open(os.path.join(HERE, 'story.js')).read()
DUR = float(re.search(r'export const DUR = ([\d.]+)', story).group(1))
VO = [(m.group(1), float(m.group(2)), m.group(4)) for m in re.finditer(r"\{ id: '(v\d)', t: ([\d.]+), text: (['\"])(.*?)\3,", story)]
dur = json.load(open(os.path.join(HERE, 'voices/dur.json')))
cues = []
for i, (vid, t, text) in enumerate(VO):
    t0 = t - .08; t1 = max(t0 + 1.9, t + dur[vid] + .65)
    if i + 1 < len(VO): t1 = min(t1, VO[i + 1][1] - .08 - .05)
    else: t1 = DUR
    cues.append({'t0': round(t0, 3), 't1': round(t1, 3), 'text': text})
json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w'), indent=1, ensure_ascii=False)
for c in cues: print(c, round(c['t1'] - c['t0'], 2))
