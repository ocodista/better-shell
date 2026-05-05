#!/usr/bin/env bash
# Test better-shell on Alpine Linux

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏔️  Testing better-shell on Alpine Linux 3.19"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    LINUX_BINARY="dist/better-shell-linux-arm64-musl"
else
    LINUX_BINARY="dist/better-shell-linux-amd64-musl"
fi

# Check if executable exists
if [ ! -f "$LINUX_BINARY" ]; then
    echo "❌ Linux executable not found ($LINUX_BINARY). Building all platforms..."
    bun run build:all
    # Prepare binaries with Docker-compatible names
    ./tests/prepare-binaries.sh
fi

# Ensure Docker-compatible binary copies exist
./tests/prepare-binaries.sh

echo "📦 Building Alpine test container..."
docker build -f tests/alpine/Dockerfile -t better-shell-alpine .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting interactive Alpine test environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Quick start:"
echo "  ./install-and-test.sh             - Install and launch improved shell ⭐"
echo "  ./better-shell install --dry-run  - Preview installation"
echo "  exit                              - Exit container"
echo ""

# Run interactive container
docker run --rm -it --name better-shell-alpine-test better-shell-alpine
