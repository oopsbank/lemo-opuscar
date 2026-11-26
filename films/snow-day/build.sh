#!/bin/sh
# Rebuild "Snow Day" from scratch: sh films/snow-day/build.sh
# Needs the library's packages (setup.sh deps voice music) and ffmpeg 7+ on PATH (or FFMPEG_DIR pointing at its bin folder).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -n "$FFMPEG_DIR" ] && PATH="$FFMPEG_DIR:$PATH"
PY="$LIB/.venv/bin/python"; SIZE=1080x1920
sh "$HERE/fonts.sh"
cd "$LIB"
"$PY" core/audio/sampler.py --need contrabass_pizz crash glockenspiel horn horn_stac marimba sleighbells snare timpani vibraphone_bowed xylophone
echo "== 1. voice + speech check"
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang en
echo "== 2. events + subtitles"
node core/render/events.mjs "$HERE" --size $SIZE
"$PY" "$HERE/subs.py"; "$PY" core/render/srt.py "$HERE/cues.json" "$HERE/subtitles_en.srt"
echo "== 3. score + mix"
"$PY" "$HERE/music/score.py"; "$PY" "$HERE/mix.py"
echo "== 4. picture (on a machine without a GPU: LEMO_ANGLE=swiftshader, slow)"
node core/render/video.mjs "$HERE" --size $SIZE --fps 24 --workers 2 --out "$HERE/out/video.mp4"
echo "== 5. mux (-14 LUFS, light grain)"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/snow-day.mp4" 24 1
echo "== 6. poster"
node core/render/still.mjs "$HERE" 28.8 --size $SIZE --q nohud --out "$HERE/out"
cp "$HERE/out/t_28.8.jpg" "$HERE/poster.jpg"
echo "done: $HERE/snow-day.mp4"
