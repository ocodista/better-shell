#!/usr/bin/env bash
# Quick test - runs installation in Ubuntu container

set -e

echo "🚀 Quick Test: Ubuntu Installation"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    LINUX_BINARY="dist/better-terminal-linux-arm64"
else
    LINUX_BINARY="dist/better-terminal-linux-amd64"
fi

# Build Linux executable if needed
if [ ! -f "$LINUX_BINARY" ]; then
    echo "📦 Building Linux executable ($LINUX_BINARY)..."
    bun run build:all
    echo ""
fi

# Prepare binaries with Docker-compatible names
./tests/prepare-binaries.sh

# Build and run container
echo "📦 Building test container..."
docker build -f tests/ubuntu/Dockerfile -t better-terminal-ubuntu . -q

echo "🐧 Starting Ubuntu container..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Interactive Ubuntu Test Shell"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Try these commands:"
echo "  ./better-terminal install --dry-run   # Preview"
echo "  ./better-terminal install            # Full install"
echo "  zsh                                   # Test new shell"
echo "  exit                                  # Leave container"
echo ""

docker run --rm -it --name better-terminal-ubuntu-test better-terminal-ubuntu
