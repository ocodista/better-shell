#!/usr/bin/env bash
# Composite demo/ubuntu-before.gif and demo/ubuntu-after.gif into
# demo/ubuntu-side-by-side.gif using ffmpeg's hstack filter. Run this after
# regenerating the two source tapes with `vhs demo/ubuntu-before.tape` and
# `vhs demo/ubuntu-after.tape`.

set -euo pipefail

cd "$(dirname "$0")/.."

BEFORE=demo/ubuntu-before.gif
AFTER=demo/ubuntu-after.gif
OUTPUT=demo/ubuntu-side-by-side.gif

if [[ ! -f "$BEFORE" || ! -f "$AFTER" ]]; then
  echo "Missing source gifs. Run 'vhs demo/ubuntu-before.tape' and 'vhs demo/ubuntu-after.tape' first." >&2
  exit 1
fi

# Two-pass palette generation keeps colors sharp in the composite. The
# [0:v][1:v]hstack layout places before on the left, after on the right.
ffmpeg -y \
  -i "$BEFORE" \
  -i "$AFTER" \
  -filter_complex '[0:v][1:v]hstack=inputs=2[stacked];[stacked]split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle' \
  -loop 0 \
  "$OUTPUT"

echo "Wrote $OUTPUT"
