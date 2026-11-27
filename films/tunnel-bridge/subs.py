# Subtitle cues from the voice timings in events.json (the page uses the same rule: hold >= 1.9 s and >= speech + 0.65 s, never into the next line)
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']
story = open(os.path.join(HERE, 'story.js')).read()
TEXT = {m.group(1): m.group(3) for m in re.finditer(r"\{ id: '(v\d+)', t: [\d.]+, text: (['\"])(.*?)\2", story)}
VO = sorted([(e['t'], e['id']) for e in E['ev'] if e['type'] == 'vo'])
dur = json.load(open(os.path.join(HERE, 'voices/dur.json')))
cues = []
for i, (t, vid) in enumerate(VO):
    t0 = max(0, t - .08); t1 = max(t0 + 1.9, t + dur[vid] + .65)
    if i + 1 < len(VO): t1 = min(t1, VO[i + 1][0] - .08 - .05)
    else: t1 = DUR
    cues.append({'t0': round(t0, 3), 't1': round(t1, 3), 'text': TEXT[vid]})
json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w'), indent=1, ensure_ascii=False)
for c in cues: print(c, round(c['t1'] - c['t0'], 2))
