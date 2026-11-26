# story.json caption lines → $OUT/cues.json → $OUT/subtitles_en.srt (the captions are burned into the picture; this file is for upload / accessibility)
import os, sys, json, subprocess
LIB = os.environ.get('LIB', '/home/user/lemo-opuscar'); OUT = os.environ.get('OUT', 'out'); D = os.path.dirname(os.path.abspath(__file__))
lines = json.load(open(os.path.join(D, 'story.json')))['lines']
json.dump([{'t0': l['t0'], 't1': l['t1'], 'text': l['text']} for l in lines], open(os.path.join(OUT, 'cues.json'), 'w'))
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(OUT, 'cues.json'), os.path.join(OUT, 'subtitles_en.srt')], check=True)
