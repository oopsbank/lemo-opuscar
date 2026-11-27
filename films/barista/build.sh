#!/bin/sh
# One command: "You Are a Barista" (Job #7; 2.5D Pixel Art, vertical 1080×1920, 60 fps, 34.95 s)
#   sh films/barista/build.sh            fonts → voices → score → events → mix → subtitles → picture → master → poster
# Needs the library's core, voice and music tiers (setup.sh deps voice music), and network once for the Google Fonts slices.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=barista; FPS=60; SIZE=1080x1920; Q='ss=1'
cd "$LIB"

# 0. fonts (OFL): latin slices of Pixelify Sans (variable) and Silkscreen 400/700 → fonts/p0, s0, s1.woff2 (already in fonts/)
for f in p0 s0 s1; do [ -f "$HERE/fonts/$f.woff2" ] || { echo "fonts/$f.woff2 missing: see fonts/fonts.css for the Google Fonts slices"; exit 1; }; done
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
# 3. picture: tilt-shift diorama, 2097 frames. With software WebGL (LEMO_ANGLE=swiftshader) this takes hours: render in parts
#    with tools/render_range.mjs and join them, e.g. for p in '0 8.75' '8.75 17.5' '17.5 26.25' '26.25 34.95'; do …; done
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --size $SIZE --q "$Q" --out "$HERE/out/video.mp4"
# 4. master: mix.py already sets −14 LUFS / −1.2 dBTP; mux.sh needs ffmpeg 7+, otherwise mux directly
if sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 0; then :; else
  ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/$NAME.mp4"
fi
# 5. cover: the hero in the foam flood (20.6 s), caption FOAM: OVERLOAD (?cover=1 draws the caption instead of the HUD)
node core/render/still.mjs "$HERE" 20.6 --size $SIZE --q "$Q&cover=1" && cp "$HERE/stills/t_20.6.jpg" "$HERE/cover.jpg"
echo "done: $HERE/$NAME.mp4"
