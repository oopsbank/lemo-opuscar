#!/bin/sh
# NO SAVE FILE: sh films/nosave/build.sh — mix → picture (2785 frames, ~1.5 min) → master
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB; cd "$LIB"
python3 "$HERE/tools/retime.py"   # timeline.base.json → timeline.json with reading time for every text
"$LIB/.venv/bin/python" "$HERE/mix.py"
ffmpeg -v error -y -i "$HERE/out/mix_raw.wav" -af "volume=3.1dB,alimiter=limit=0.70:attack=1:release=60:level=false,aresample=192000,alimiter=limit=0.80:level=false,aresample=48000" -c:a pcm_s24le "$HERE/out/mix.wav"
node "$HERE/tools/render_range.mjs" 0 $(python3 -c "import json;print(json.load(open('$HERE/timeline.json'))['dur'])") --fps 24 --workers 3 --q 'x=1' --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/nosave.mp4"
