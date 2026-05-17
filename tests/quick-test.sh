#!/usr/bin/env bash
# Quick test - opens the Ubuntu fixture built from the Rust source.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "🚀 Quick Test: Ubuntu Installation"
echo ""

arch="$(uname -m)"
case "$arch" in
  arm64|aarch64) target_arch="arm64" ;;
  x86_64|amd64) target_arch="amd64" ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

target_platform="linux/$target_arch"

# Build and run container
echo "📦 Building test container ($target_platform)..."
docker build \
  --build-arg TARGETPLATFORM="$target_platform" \
  --build-arg TARGETARCH="$target_arch" \
  -f tests/ubuntu/Dockerfile \
  -t better-shell-ubuntu \
  . \
  -q

echo "🐧 Starting Ubuntu container..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Interactive Ubuntu Test Shell"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Try these commands:"
echo "  ./better-shell install --dry-run  # Preview"
echo "  ./better-shell install            # Full install"
echo "  zsh                               # Test new shell"
echo "  exit                              # Leave container"
echo ""

docker run --rm -it --name better-shell-ubuntu-test better-shell-ubuntu
