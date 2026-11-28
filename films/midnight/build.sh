#!/bin/sh
# Rebuild "Midnight Crossing" from scratch: sh films/midnight/build.sh
# Needs the library's packages (setup.sh deps voice music) and ffmpeg 7+ on PATH (or FFMPEG_DIR pointing at its bin folder).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -n "$FFMPEG_DIR" ] && PATH="$FFMPEG_DIR:$PATH"
PY="$LIB/.venv/bin/python"; SIZE=1080x1920
cd "$LIB"
"$PY" core/audio/sampler.py --need piano cellos contrabass contrabass_pizz violins_trem timpani gong vibraphone_bowed
echo "== 1. (no voice: a wordless film)"
echo "== 2. events + subtitles"
node core/render/events.mjs "$HERE" --size $SIZE
echo "== 3. score + mix"
"$PY" "$HERE/music/score.py"; "$PY" "$HERE/mix.py"
echo "== 4. picture (on a machine without a GPU: LEMO_ANGLE=swiftshader, slow)"
node core/render/video.mjs "$HERE" --size $SIZE --fps 24 --workers 2 --out "$HERE/out/video.mp4"
echo "== 5. mux (-14 LUFS, light grain)"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/midnight.mp4" 24 1
echo "== 6. poster"
node core/render/still.mjs "$HERE" 44 --size $SIZE --out "$HERE/out"
cp "$HERE/out/t_44.jpg" "$HERE/poster.jpg"
echo "done: $HERE/midnight.mp4"
