#!/usr/bin/env bash
# Test better-terminal on Alpine Linux

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏔️  Testing better-terminal on Alpine Linux 3.19"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    LINUX_BINARY="dist/better-terminal-linux-arm64"
else
    LINUX_BINARY="dist/better-terminal-linux-amd64"
fi

# Check if executable exists
if [ ! -f "$LINUX_BINARY" ]; then
    echo "❌ Linux executable not found ($LINUX_BINARY). Building all platforms..."
    bun run build:all
    # Prepare binaries with Docker-compatible names
    ./tests/prepare-binaries.sh
fi

# Ensure Docker-compatible symlinks exist
./tests/prepare-binaries.sh

echo "📦 Building Alpine test container..."
docker build -f tests/alpine/Dockerfile -t better-terminal-alpine .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting interactive Alpine test environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Quick start:"
echo "  ./install-and-test.sh             - Install and launch improved shell ⭐"
echo "  ./better-terminal install --dry-run  - Preview installation"
echo "  exit                              - Exit container"
echo ""

# Run interactive container
docker run --rm -it --name better-terminal-alpine-test better-terminal-alpine
