#!/bin/sh
# Fallback master when core/render/mux.sh refuses an ffmpeg older than 7: two-pass loudnorm to −14 LUFS (true peak −1.5 dB), AAC 192k, picture copied.
# sh master6.sh video.mp4 mix.wav out.mp4
set -e
J=$(ffmpeg -hide_banner -i "$2" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
v() { echo "$J" | grep "\"$1\"" | grep -o '[-0-9.]*' | tail -1; }
ffmpeg -loglevel error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$3"
ffmpeg -hide_banner -i "$3" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
