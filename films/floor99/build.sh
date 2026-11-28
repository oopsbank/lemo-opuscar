#!/bin/sh
# FLOOR -99: sh films/floor99/build.sh — voice → mix → picture (1560 frames, ~1 min) → master
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB; cd "$LIB"
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$LIB/.venv/bin/python" "$HERE/mix.py"
ffmpeg -v error -y -i "$HERE/out/mix_raw.wav" -af "volume=-2.6dB,alimiter=limit=0.70:attack=1:release=60:level=false,aresample=192000,alimiter=limit=0.80:level=false,aresample=48000" -c:a pcm_s24le "$HERE/out/mix.wav"
node "$HERE/tools/render_range.mjs" 0 65 --fps 24 --workers 3 --q 'x=1' --out "$HERE/out/video.mp4"
# the edit: the button-mashing beat cut in half (10.25–15.0 s removed) → 60.25 s
ffmpeg -v error -y -i "$HERE/out/video.mp4" -filter_complex "[0:v]trim=0:10.25,setpts=PTS-STARTPTS[a];[0:v]trim=15:65,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 24 "$HERE/out/video_cut.mp4"
ffmpeg -v error -y -i "$HERE/out/mix.wav" -filter_complex "[0:a]atrim=0:10.27,asetpts=PTS-STARTPTS[a];[0:a]atrim=14.98:65,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.02:c1=tri:c2=tri[o]" -map "[o]" -c:a pcm_s24le "$HERE/out/mix_cut.wav"
ffmpeg -v error -y -i "$HERE/out/video_cut.mp4" -i "$HERE/out/mix_cut.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/floor99.mp4"
