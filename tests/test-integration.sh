#!/usr/bin/env bash
# Run Ubuntu and Alpine Docker integration tests.

set -euo pipefail

cd "$(dirname "$0")/.."

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

run_suite() {
  local distro="$1"
  local image="better-shell-${distro}-test"
  local runner="/home/testuser/test-runner.sh"

  echo "📦 Building ${distro} test container (${target_platform})..."
  docker build \
    --build-arg TARGETPLATFORM="$target_platform" \
    --build-arg TARGETARCH="$target_arch" \
    -f "tests/${distro}/Dockerfile" \
    -t "$image" \
    . \
    -q

  echo "🚀 Running ${distro} integration tests..."
  docker run --rm --name "${image}-run" "$image" "$runner"
  echo "✅ ${distro} integration test passed"
  echo ""
}

run_suite ubuntu
run_suite alpine
