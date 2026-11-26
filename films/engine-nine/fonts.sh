#!/bin/sh
# Fonts are not kept in git (SIL OFL 1.1, named in CREDITS). Fetch them into fonts/ from google/fonts pinned to one commit.
set -e
D=$(cd "$(dirname "$0")" && pwd)/fonts; mkdir -p "$D"
GF=https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b
get() { [ -s "$D/$1" ] && return 0; curl -fsSL -g --retry 2 -o "$D/$1.part" "$2" && mv "$D/$1.part" "$D/$1" && echo "fonts/$1"; }
get Overpass-var.ttf "$GF/ofl/overpass/Overpass[wght].ttf"
get OverpassMono-var.ttf "$GF/ofl/overpassmono/OverpassMono[wght].ttf"
