#!/bin/sh
# One command: "You Are a Fish Seller" (2.5D Pixel Art, vertical 1080×1920, 60 fps)
#   sh films/fish-seller/build.sh            fonts → voices → score → events → mix → subtitles → picture → master → poster
# Needs the library's core, voice and music tiers (setup.sh deps voice music), and network once for the Google Fonts slices.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=fish-seller; FPS=60; SIZE=1080x1920; Q='ss=1'
cd "$LIB"

# 0. fonts (OFL): latin slices of Cinzel 500/700 and Cormorant Garamond italic 500, 500, 600 → fonts/h0..h4.woff2
for i in 0 1 2 3 4; do [ -f "$HERE/fonts/h$i.woff2" ] || MISSING=1; done
if [ -n "$MISSING" ]; then
  UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
  curl -sSf -A "$UA" 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=block' |
    awk '/\/\* latin \*\//{f=1} f&&/src:/{match($0,/https:[^)]*/); print substr($0,RSTART,RLENGTH); f=0}' |
    { i=0; while read -r u; do curl -sSfL -o "$HERE/fonts/h$i.woff2" "$u"; i=$((i+1)); done; }
fi
# 1. voices (Kokoro, offline) + speech-to-text check (needs the Whisper model once, from huggingface.co)
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" || echo "build.sh: voice check failed or could not run — listen to the lines"
# 2. score, events, cue check, mix, subtitles
"$PY" "$HERE/score.py"
node core/render/events.mjs "$HERE" --size $SIZE --q "$Q&textonly=1"
"$PY" "$HERE/tools/cuecheck.py"
node core/render/readcheck.mjs "$HERE" --size $SIZE --q "$Q&textonly=1"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/srt.py" "$HERE/subtitles_en.srt"
# 3. picture: tilt-shift diorama, 3600 frames
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --size $SIZE --q "$Q" --out "$HERE/out/video.mp4"
# 4. master: mix.py already sets −14 LUFS / −1.2 dBTP; mux.sh needs ffmpeg 7+, otherwise mux directly
if sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 0; then :; else
  ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/$NAME.mp4"
fi
# 5. poster: the title card over the harbour at sunrise
ffmpeg -v error -y -ss 57.5 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
