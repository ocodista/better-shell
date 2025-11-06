#!/usr/bin/env bash
# Prepare binaries with Docker-compatible naming

set -e

cd "$(dirname "$0")/.."

# Create symlinks for Docker compatibility
# Docker uses 'amd64' and 'arm64'
# Bun uses 'x64' and 'arm64'

if [ -f "dist/better-terminal-linux-x64" ]; then
    ln -sf better-terminal-linux-x64 dist/better-terminal-linux-amd64
    echo "✓ Created symlink: linux-amd64 → linux-x64"
fi

if [ -f "dist/better-terminal-linux-arm64" ]; then
    # Already correct name, but ensure it exists
    echo "✓ Found: linux-arm64"
fi

echo ""
echo "Binaries ready for Docker:"
ls -lh dist/better-terminal-linux-* 2>/dev/null || echo "No Linux binaries found"
