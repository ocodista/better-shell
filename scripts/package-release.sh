#!/usr/bin/env bash
# Build one release target and write the named artifact plus SHA-256 checksum.

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <rust-target> <asset-name>" >&2
  exit 1
fi

target="$1"
asset="$2"

cd "$(dirname "$0")/.."

mkdir -p dist

cargo_cmd=(cargo)
if command -v rustup >/dev/null 2>&1; then
  rustup target add "$target"
  cargo_cmd=(rustup run stable cargo)
fi

echo "Building $asset ($target)..."
"${cargo_cmd[@]}" build --release --target "$target"

binary="target/$target/release/better-shell"
if [[ "$asset" == *.exe ]]; then
  binary="$binary.exe"
fi

cp "$binary" "dist/$asset"
chmod +x "dist/$asset" 2>/dev/null || true

if command -v sha256sum >/dev/null 2>&1; then
  (cd dist && sha256sum "$asset" > "$asset.sha256")
else
  (cd dist && shasum -a 256 "$asset" > "$asset.sha256")
fi

size=$(du -h "dist/$asset" | awk '{print $1}')
echo "Packaged dist/$asset ($size)"
echo "Checksum dist/$asset.sha256"
