#!/bin/sh
# Rebuild "The Ring Run" from scratch: sh films/ringrun/build.sh
# Needs the library's packages (setup.sh deps voice music) and ffmpeg 7+ on PATH (or FFMPEG_DIR pointing at its bin folder).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -n "$FFMPEG_DIR" ] && PATH="$FFMPEG_DIR:$PATH"
PY="$LIB/.venv/bin/python"; SIZE=1080x1920
cd "$LIB"
echo "== 1. (no voice: a wordless film)"
echo "== 2. events + subtitles"
node core/render/events.mjs "$HERE" --size $SIZE
echo "== 3. mix (SFX only)"
"$PY" core/audio/sampler.py --need glockenspiel violins_pizz ukulele
"$PY" "$HERE/mix.py"
echo "== 4. picture (on a machine without a GPU: LEMO_ANGLE=swiftshader, slow)"
node core/render/video.mjs "$HERE" --size $SIZE --fps 24 --workers 2 --out "$HERE/out/video.mp4"
echo "== 5. mux (-14 LUFS, light grain)"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/ringrun.mp4" 24 1
echo "== 6. poster"
node core/render/still.mjs "$HERE" 38 --size $SIZE --out "$HERE/out"
cp "$HERE/out/t_38.jpg" "$HERE/poster.jpg"
echo "done: $HERE/ringrun.mp4"
