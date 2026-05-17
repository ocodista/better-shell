#!/usr/bin/env bash
# Start a persistent Docker fixture for manual better-shell testing.
# Usage: ./tests/dev-container.sh [ubuntu|alpine]

set -euo pipefail

cd "$(dirname "$0")/.."

distro="${1:-ubuntu}"
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

case "$distro" in
  ubuntu)
    dockerfile="tests/ubuntu/Dockerfile"
    image="better-shell-ubuntu-dev"
    container="better-shell-ubuntu-dev"
    shell="bash"
    ;;
  alpine)
    dockerfile="tests/alpine/Dockerfile"
    image="better-shell-alpine-dev"
    container="better-shell-alpine-dev"
    shell="bash"
    ;;
  *)
    echo "Usage: $0 [ubuntu|alpine]" >&2
    exit 1
    ;;
esac

if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
  echo "Removing existing container: $container"
  docker rm -f "$container" >/dev/null
fi

echo "Building $distro fixture ($target_platform)..."
docker build \
  --build-arg TARGETPLATFORM="$target_platform" \
  --build-arg TARGETARCH="$target_arch" \
  -f "$dockerfile" \
  -t "$image" \
  .

echo "Starting persistent container: $container"
docker run -d --name "$container" "$image" tail -f /dev/null >/dev/null

cat <<EOF

Container is ready.

Enter it:
  docker exec -it $container $shell

Try Better Shell inside:
  ./better-shell check
  ./better-shell install --dry-run
  sudo ./better-shell install
  zsh

Clean up:
  docker rm -f $container

EOF
