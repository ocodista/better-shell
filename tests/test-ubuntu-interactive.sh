#!/usr/bin/env bash
# Start Ubuntu test container and keep it running for manual testing.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐧 Starting Persistent Ubuntu Test Container"
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

# Container name
CONTAINER_NAME="better-shell-ubuntu-dev"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container '$CONTAINER_NAME' already exists"
    echo ""
    read -p "Do you want to remove it and create a new one? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing existing container..."
        docker rm -f $CONTAINER_NAME
    else
        echo "ℹ️  Using existing container"
        if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "🚀 Starting stopped container..."
            docker start $CONTAINER_NAME
        fi
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✨ Container is running!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "To access the container:"
        echo "  docker exec -it $CONTAINER_NAME bash"
        echo ""
        echo "To stop and remove the container:"
        echo "  docker rm -f $CONTAINER_NAME"
        echo ""
        exit 0
    fi
fi

echo "📦 Building Ubuntu test container ($target_platform)..."
docker build \
    --build-arg TARGETPLATFORM="$target_platform" \
    --build-arg TARGETARCH="$target_arch" \
    -f tests/ubuntu/Dockerfile \
    -t better-shell-ubuntu \
    . \
    -q

echo "🚀 Starting container in background..."
docker run -d --name $CONTAINER_NAME better-shell-ubuntu tail -f /dev/null

echo "⏳ Installing better-shell in container..."
docker exec $CONTAINER_NAME sudo ./better-shell install

echo "📋 Ensuring testuser owns generated configs..."
docker exec $CONTAINER_NAME bash -c '
    sudo chown -R testuser:testuser \
        /home/testuser/.zshrc \
        /home/testuser/.antigenrc \
        /home/testuser/antigen.zsh \
        /home/testuser/.tmux.conf \
        /home/testuser/.config \
        /home/testuser/.fzf.zsh \
        /home/testuser/.fzf \
        /home/testuser/.local \
        /home/testuser/.oh-my-zsh \
        /home/testuser/.tmux \
        2>/dev/null || true
'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Container is running with better-shell installed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Container name: $CONTAINER_NAME"
echo ""
echo "To access the improved shell (zsh):"
echo "  docker exec -it $CONTAINER_NAME zsh"
echo ""
echo "To access regular bash:"
echo "  docker exec -it $CONTAINER_NAME bash"
echo ""
echo "To run as root:"
echo "  docker exec -it -u root $CONTAINER_NAME zsh"
echo ""
echo "Test commands once inside:"
echo "  Ctrl+R           - Blazingly fast search with fzf"
echo "  lsx              - List files with icons (eza)"
echo "  z <dir>          - Jump to frequently used directories"
echo "  tmux             - Start terminal multiplexer"
echo "  node --version   - Check Node.js (via mise)"
echo ""
echo "To stop and remove the container:"
echo "  docker rm -f $CONTAINER_NAME"
echo ""
