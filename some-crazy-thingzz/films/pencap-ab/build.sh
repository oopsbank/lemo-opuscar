#!/bin/sh
# Rebuild "Cap Check" A and B (why do pen caps have a hole?) from this folder: sh build.sh
# LIB = the library root; OUT = where everything goes. Without a GPU: LEMO_ANGLE=swiftshader.
set -e
LIB=${LIB:-/home/user/lemo-opuscar}; D="$(cd "$(dirname "$0")" && pwd)"
OUT=${OUT:-$HOME/pencap-ab-build}; mkdir -p "$OUT"; export LIB
PY="$LIB/.venv/bin/python"; cd "$LIB"
$PY core/tts/tts.py "$D/lines.json" "$OUT/voices"          # story.json captions are hand-placed (clarity rules); timing.py only rebuilds voices.json
for v in A B; do
  O="$OUT/$v"; mkdir -p "$O"; ln -sfn "$OUT/voices" "$O/voices"
  node core/render/events.mjs "$D" --size 1080x1920 --q "fast&v=$v" --out "$O/events.json"
  OUT="$O" $PY "$D/music/score.py"; OUT="$O" $PY "$D/mix.py"; OUT="$O" $PY "$D/subs.py"
  node some-crazy-thingzz/tools/render_chunks.mjs "$D" --fps 24 --workers 3 --chunk 24 --size 1080x1920 --q "ssaa=1.5&v=$v" --out "$O/video24.mp4"
  sh "$D/master6.sh" "$O/video24.mp4" "$O/mix.wav" "$OUT/some-crazy-thingzz_pencap-${v}_1080x1920.mp4"
done
ffmpeg -y -i "$OUT/some-crazy-thingzz_pencap-A_1080x1920.mp4" -i "$OUT/some-crazy-thingzz_pencap-B_1080x1920.mp4" -filter_complex "[0:v]scale=540:960[a];[1:v]scale=540:960[b];[a][b]hstack=2[v]" -map "[v]" -map 0:a -c:v libx264 -crf 20 -c:a aac -b:a 192k "$OUT/some-crazy-thingzz_pencap-AB_compare.mp4"
