# Make every line readable: timeline.base.json → timeline.json.
# For each text (dialog box, menu, popup, end line) the film needs: typing time + reading time (words / 3 + 0.6 s, at least 1.6 s).
# Where the base timing is shorter, a gap is inserted right after the text finishes typing: everything later moves on by that much
# (the scene keeps playing; only the next event comes later). The clock still runs 01:00 → 00:00, ending on the cut line.
import json, os, re, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
tl = json.load(open(os.path.join(ROOT, 'timeline.base.json'))); T = tl['t']
def words(s): return len(re.findall(r"[\w'⭐]+", s))
def chars(s): return len([c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn'])
def read(s): return max(1.6, words(s) / 3 + .6)
gaps = []   # (where, how long)
for b in tl['boxes']:
    if b['id'] == 'sorry': continue   # cut on purpose
    if b['id'] == 'die': b['cps'] = 45
    typed = b['a'] + chars(b['text']) / b['cps']; need = chars(b['text']) / b['cps'] + read(b['text'])
    have = b['b'] - b['a']
    if need > have: gaps.append((min(typed, b['b'] - .05), need - have))
for m in tl['menus']:
    need = max(1.8, sum(words(o) for o in m['opts']) / 3 + .8); have = (m['move'][0] if m['move'] else m['confirm']) - m['a']
    if need > have: gaps.append((m['a'] + .05, need - have))
# popups and lines that are not boxes
for at, until, txt in ((T['achievement'], T['silence'], 'ACHIEVEMENT UNLOCKED: ALONE AT THE TOP'), (T['error'], T['shop'], 'ERROR: THIS GAME HAS NO SAVE FILE.'),
                       (T['noCont'], T['twist'], 'NO CONTINUES LEFT.')):
    need = read(txt) + .4; have = until - at
    if need > have: gaps.append((at + .1, need - have))
# the end lines type on: give each its reading time after it has typed
for at, until, txt, cps in ((T['line1'], T['line2'], 'THIS GAME HAS NO SAVE FILE.', 22), (T['line2'], T['end'], 'NEITHER DOES YOURS.', 16)):
    typ = chars(txt) / cps; need = typ + 1.8; have = until - at
    if need > have: gaps.append((at + typ + .05, need - have))
# screens that hold several lines at once
gaps += [(T['shop'] + .1, 1.5),          # SHOP / GOLD / three SOLD OUT rows before the first press
         (T['calling'] + .5, .6),        # LILY / Last call: 29 years ago / CALLING...
         (T['gameOver'] + 1.05, .8),     # CONTINUE?  YES  NO before the cursor moves
         (T['rewind'] + .1, .5)]         # REWIND / LOADING MEMORIES...
def shift(v, x, g): return v + g if v > x else v
def apply(x, g):
    for k, v in T.items(): T[k] = [shift(a, x, g) for a in v] if isinstance(v, list) else shift(v, x, g)
    for b in tl['boxes']:
        for k in ('a', 'b', 'cutAt'):
            if k in b: b[k] = shift(b[k], x, g)
    for m in tl['menus']:
        m['a'] = shift(m['a'], x, g); m['b'] = shift(m['b'], x, g); m['confirm'] = shift(m['confirm'], x, g); m['move'] = [shift(a, x, g) for a in m['move']]
    for l in tl['levels']: l['a'] = shift(l['a'], x, g)
    tl['clockZero'] = shift(tl['clockZero'], x, g); tl['clockStart'] = shift(tl['clockStart'], x, g); tl['dur'] += g
for x, g in sorted(gaps): print(f'  gap {g:4.2f} s at {x:5.2f}')
for x, g in sorted(gaps, reverse=True): apply(x, round(g, 2))
tl['dur'] = round(tl['dur'], 2)
for k, v in T.items(): T[k] = [round(a, 2) for a in v] if isinstance(v, list) else round(v, 2)
json.dump(tl, open(os.path.join(ROOT, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('gaps', len(gaps), 'added', round(sum(g for _, g in gaps), 2), 's → dur', tl['dur'], 'clock zero at', tl['clockZero'])
