# English .srt from timeline.json (dialog boxes + the paper's rules)
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
cues = [(b['a'], b['b'], (b['who'] + ': ' if b['who'] else '') + b['text']) for b in TL['boxes']]
P = TL['paper']; cues += [(r['a'], (P[i + 1]['a'] if i + 1 < len(P) else TL['t']['paperOut']), r['text']) for i, r in enumerate(P)]
cues.sort(); f = lambda s: '%02d:%02d:%02d,%03d' % (s // 3600, s % 3600 // 60, s % 60, round(s % 1 * 1000) % 1000)
open(os.path.join(HERE, '..', 'subtitles_en.srt'), 'w').write(''.join(f'{i + 1}\n{f(a)} --> {f(b)}\n{t}\n\n' for i, (a, b, t) in enumerate(cues)))
