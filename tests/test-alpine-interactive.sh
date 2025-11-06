#!/usr/bin/env bash
# Start Alpine test container and keep it running for manual testing

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏔️  Starting Persistent Alpine Test Container"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    LINUX_BINARY="dist/better-shell-linux-arm64"
else
    LINUX_BINARY="dist/better-shell-linux-amd64"
fi

# Check if executable exists
if [ ! -f "$LINUX_BINARY" ]; then
    echo "❌ Linux executable not found ($LINUX_BINARY). Building all platforms..."
    bun run build:all
    ./tests/prepare-binaries.sh
fi

# Ensure Docker-compatible symlinks exist
./tests/prepare-binaries.sh

# Container name
CONTAINER_NAME="better-shell-alpine-dev"

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

echo "📦 Building Alpine test container..."
docker build -f tests/alpine/Dockerfile -t better-shell-alpine . -q

echo "🚀 Starting container in background..."
docker run -d --name $CONTAINER_NAME better-shell-alpine tail -f /dev/null

echo "⏳ Installing better-shell in container..."
docker exec $CONTAINER_NAME sudo ./better-shell install

echo "📋 Copying configs to testuser..."
docker exec $CONTAINER_NAME bash -c '
    sudo cp /root/.zshrc /home/testuser/
    sudo cp /root/.antigenrc /home/testuser/
    sudo cp /root/antigen.zsh /home/testuser/
    sudo cp /root/.tmux.conf /home/testuser/
    sudo cp -r /root/.config/eza /home/testuser/.config/ 2>/dev/null || true
    sudo cp /root/.fzf.zsh /home/testuser/ 2>/dev/null || true
    sudo cp -r /root/.fzf /home/testuser/ 2>/dev/null || true
    sudo cp -r /root/.asdf /home/testuser/ 2>/dev/null || true
    sudo cp /root/.tool-versions /home/testuser/ 2>/dev/null || true
    sudo cp -r /root/.oh-my-zsh /home/testuser/ 2>/dev/null || true
    sudo cp -r /root/.tmux /home/testuser/ 2>/dev/null || true
    sudo chown -R testuser:testuser /home/testuser/.zshrc /home/testuser/.antigenrc /home/testuser/antigen.zsh /home/testuser/.tmux.conf /home/testuser/.config /home/testuser/.fzf.zsh /home/testuser/.fzf /home/testuser/.asdf /home/testuser/.tool-versions /home/testuser/.oh-my-zsh /home/testuser/.tmux 2>/dev/null || true
    # Fix hardcoded /root paths
    sudo sed -i "s|/root/|/home/testuser/|g" /home/testuser/.fzf.zsh 2>/dev/null || true
    sudo sed -i "s|/root/|/home/testuser/|g" /home/testuser/.zshrc 2>/dev/null || true
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
echo "  node --version   - Check Node.js (via asdf)"
echo ""
echo "To stop and remove the container:"
echo "  docker rm -f $CONTAINER_NAME"
echo ""
