#!/usr/bin/env bash
# Run all tests

set -e

echo "🧪 better-shell Interactive Test Suite"
echo ""
echo "This will open interactive shells in Docker containers."
echo "You can manually test the installation in each environment."
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

# Detect architecture and build if needed
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    LINUX_BINARY="dist/better-shell-linux-arm64"
else
    LINUX_BINARY="dist/better-shell-linux-amd64"
fi

if [ ! -f "$LINUX_BINARY" ]; then
    echo "📦 Building Linux executables..."
    bun run build:all
    echo ""
fi

# Test Ubuntu
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1/2: Ubuntu 22.04 Test Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./tests/test-ubuntu.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ubuntu test completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Enter to test Alpine..."
read

# Test Alpine
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2/2: Alpine Linux 3.19 Test Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./tests/test-alpine.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Alpine test completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ All interactive tests completed!"
