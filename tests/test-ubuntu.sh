#!/usr/bin/env bash
# Test better-shell on Ubuntu

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐧 Testing better-shell on Ubuntu 22.04"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    TARGETARCH="arm64"
    LINUX_BINARY="dist/better-shell-linux-arm64"
else
    TARGETARCH="amd64"
    LINUX_BINARY="dist/better-shell-linux-amd64"
fi
TARGETPLATFORM="linux/$TARGETARCH"

# Check if executable exists
if [ ! -f "$LINUX_BINARY" ]; then
    echo "❌ Linux executable not found ($LINUX_BINARY). Building all platforms..."
    bun run build:all
    # Prepare binaries with Docker-compatible names
    ./tests/prepare-binaries.sh
fi

# Ensure Docker-compatible binary copies exist
./tests/prepare-binaries.sh

echo "📦 Building Ubuntu test container ($TARGETPLATFORM)..."
docker build \
    --build-arg TARGETPLATFORM="$TARGETPLATFORM" \
    --build-arg TARGETARCH="$TARGETARCH" \
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
