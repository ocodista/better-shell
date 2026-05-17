#!/usr/bin/env bash
# Test better-shell on Ubuntu.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐧 Testing better-shell on Ubuntu 22.04"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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

echo "📦 Building Ubuntu test container ($target_platform)..."
docker build \
  --build-arg TARGETPLATFORM="$target_platform" \
  --build-arg TARGETARCH="$target_arch" \
  -f tests/ubuntu/Dockerfile \
  -t better-shell-ubuntu \
  .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting interactive Ubuntu test environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Quick start:"
echo "  ./install-and-test.sh             - Install and launch improved shell ⭐"
echo "  ./better-shell install --dry-run  - Preview installation"
echo "  exit                              - Exit container"
echo ""

# Run interactive container
docker run --rm -it --name better-shell-ubuntu-test better-shell-ubuntu
