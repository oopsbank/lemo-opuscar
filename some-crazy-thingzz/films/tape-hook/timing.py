# Voice → timing data: caption word groups from Whisper word timestamps, and mouth envelopes for lip sync.
# python timing.py <voices_dir>   (reads lines.json, <voices_dir>/words.json and <id>.wav; writes story.json "caps"/"lines" and voices.json next to this file)
# Run it whenever the voice lines change; the page reads story.json and voices.json, mix.py reads lines.json for placement.
import os, sys, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); VD = sys.argv[1]
lines = json.load(open(os.path.join(D, 'lines.json')))
words = json.load(open(os.path.join(VD, 'words.json')))
story = json.load(open(os.path.join(D, 'story.json')))
caps, subs, env = [], [], {}
for L in lines:
    W = words[L['id']]; shown = (L.get('cap') or L['text']).split()
    if len(W) != len(shown): sys.exit(f"{L['id']}: whisper heard {len(W)} words, the caption has {len(shown)}: {W}")
    x, sr = sf.read(os.path.join(VD, L['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    dur = len(x) / sr; at = L['at']; i = 0; gs = []
    for g, n in enumerate(L['groups']):
        gs.append({'t0': round(at + max(0, W[i][1] - .04), 3), 'text': ' '.join(shown[i:i + n]), 'hot': g in L.get('hot', []), 'who': L['who']}); i += n
    for a, b in zip(gs, gs[1:]): a['t1'] = b['t0']
    gs[-1]['t1'] = round(max(at + dur + .35, gs[-1]['t0'] + .55), 3)
    caps += [{k: v for k, v in c.items() if v is not False} for c in gs]
    subs.append({'t0': gs[0]['t0'], 't1': gs[-1]['t1'], 'text': L.get('cap') or L['text']})
    hop = sr // 24; rms = [float(np.sqrt(np.mean(x[k:k + hop] ** 2))) for k in range(0, len(x), hop)]
    m = max(rms) or 1; env[L['id']] = {'at': at, 'who': L['who'], 'rate': 24, 'v': [round(v / m, 3) for v in rms]}
for a, b in zip(caps, caps[1:]):   # a caption never overlaps the next one
    if a['t1'] > b['t0']: a['t1'] = b['t0']
story['caps'] = caps; story['lines'] = subs
json.dump(story, open(os.path.join(D, 'story.json'), 'w'), indent=1)
json.dump(env, open(os.path.join(D, 'voices.json'), 'w'))
for c in caps: print(f"{c['t0']:6.2f}–{c['t1']:6.2f} {c['text']}{'  *' if c.get('hot') else ''}")
