#!/bin/sh
# Rebuild "No Holes" (why do crackers have holes?) from this folder: sh build.sh
# LIB = the Lemo-Opuscar library (core tools, three.js, sample libraries); OUT = where everything is written (nothing is written into this folder).
# Without a GPU (cloud Linux), run with LEMO_ANGLE=swiftshader: about 20 s a frame per worker at ssaa=1.5.
set -e
LIB=${LIB:-/home/user/lemo-opuscar}
D="$(cd "$(dirname "$0")" && pwd)"
OUT=${OUT:-$HOME/cracker-holes-build}; mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
export LIB OUT
PY="$LIB/.venv/bin/python"; SZ=1080x1920; Q=${Q:-ssaa=1.5}
cd "$LIB"
echo "== 0. voices (Kokoro, offline) and a speech-to-text check of every line"
$PY core/tts/tts.py "$D/lines.json" "$OUT/voices"
$PY core/tts/asr_check.py "$D/lines.json" "$OUT/voices" --lang en
# story.json (caption groups) and voices.json (lip-sync envelopes) in this folder were made from these voices by timing.py;
# after changing lines.json, run:  $PY "$D/timing.py" "$OUT/voices"   (it rewrites those two files)
echo "== 1. sound events from the page"
node core/render/events.mjs "$D" --size $SZ --q fast --out "$OUT/events.json"
echo "== 2. score (sampled kitchen-comedy band) and mix (voices, foley, bed)"
$PY "$D/music/score.py"
$PY "$D/mix.py"
echo "== 3. subtitles file (the captions are also burned in)"
$PY "$D/subs.py"
echo "== 4. picture: 576 frames at 24 fps (QUICK=1: the first second only, unsupersampled: a pipeline check)"
[ -n "$QUICK" ] && Q="fast&dur=1"
node core/render/video.mjs "$D" --fps 24 --workers ${WORKERS:-2} --size $SZ --q "$Q" --out "$OUT/video24.mp4"
echo "== 5. mux and master (−14 LUFS, no grain)"
sh core/render/mux.sh "$OUT/video24.mp4" "$OUT/mix.wav" "$OUT/cracker-holes.mp4" 24 0 || sh "$D/master6.sh" "$OUT/video24.mp4" "$OUT/mix.wav" "$OUT/cracker-holes.mp4"
echo "== 6. poster"
[ -n "$QUICK" ] && SQ="fast" || SQ="ssaa=2"
node core/render/still.mjs "$D" 11.3 --size $SZ --q "$SQ" --prefix poster_ --out "$OUT"
cp "$OUT/poster_11.3.jpg" "$OUT/poster.jpg"
echo "done: $OUT/cracker-holes.mp4"
