#!/bin/sh
# CA ĐÊM (00:00): sh films/ca-dem/build.sh — mix → picture (1800 frames, 24 fps; ~3–6 min with Chromium) → master
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB; cd "$LIB"
"$LIB/.venv/bin/python" "$HERE/mix.py"
ffmpeg -v error -y -i "$HERE/out/mix_raw.wav" -af "volume=4.0dB,alimiter=limit=0.70:attack=1:release=60:level=false,aresample=192000,alimiter=limit=0.80:level=false,aresample=48000" -c:a pcm_s24le "$HERE/out/mix.wav"
python3 "$HERE/tools/srt.py"
node "$HERE/tools/render_range.mjs" 0 75 --fps 24 --workers 3 --q 'x=1' --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/ca-dem.mp4"
echo "done: $HERE/ca-dem.mp4"
