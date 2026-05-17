#!/usr/bin/env bash
# Build better-shell from the Rust source and package it in dist/.

set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p dist

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"

case "$os" in
  darwin) os="darwin" ;;
  linux) os="linux" ;;
  *)
    echo "Unsupported OS: $os" >&2
    exit 1
    ;;
esac

case "$arch" in
  x86_64|amd64) arch="x64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

libc_suffix=""
if [ "$os" = "linux" ] && ldd --version 2>&1 | grep -qi musl; then
  libc_suffix="-musl"
fi

asset="better-shell-$os-$arch$libc_suffix"

echo "Building better-shell for $os-$arch$libc_suffix..."
cargo build --release

cp target/release/better-shell "dist/$asset"
chmod +x "dist/$asset"

if [ "$os" != "windows" ]; then
  ln -sf "$asset" dist/better-shell
fi

if command -v sha256sum >/dev/null 2>&1; then
  (cd dist && sha256sum "$asset" > "$asset.sha256")
else
  (cd dist && shasum -a 256 "$asset" > "$asset.sha256")
fi

size=$(du -h "dist/$asset" | awk '{print $1}')
echo "Built dist/$asset ($size)"
echo "Checksum dist/$asset.sha256"
