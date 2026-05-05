#!/usr/bin/env bash
# Prepare binaries with Docker-compatible naming

set -e

cd "$(dirname "$0")/.."

# Create copies for Docker compatibility.
# Docker uses 'amd64' and 'arm64'. Bun uses 'x64' and 'arm64'.
# Use copies instead of symlinks so Docker COPY works on every host.

if [ -f "dist/better-shell-linux-x64" ]; then
    rm -f dist/better-shell-linux-amd64
    cp dist/better-shell-linux-x64 dist/better-shell-linux-amd64
    echo "✓ Prepared: linux-amd64 → linux-x64"
fi

if [ -f "dist/better-shell-linux-x64-musl" ]; then
    rm -f dist/better-shell-linux-amd64-musl
    cp dist/better-shell-linux-x64-musl dist/better-shell-linux-amd64-musl
    echo "✓ Prepared: linux-amd64-musl → linux-x64-musl"
fi

if [ -f "dist/better-shell-linux-arm64" ]; then
    echo "✓ Found: linux-arm64"
fi

if [ -f "dist/better-shell-linux-arm64-musl" ]; then
    echo "✓ Found: linux-arm64-musl"
fi

echo ""
echo "Binaries ready for Docker:"
ls -lh dist/better-shell-linux-* 2>/dev/null || echo "No Linux binaries found"
