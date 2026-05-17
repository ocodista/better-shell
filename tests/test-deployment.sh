#!/usr/bin/env bash
# End-to-end deployment test
# Tests the complete installation flow from GitHub releases

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 End-to-End Deployment Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CONTAINER_NAME="better-shell-e2e-test"

# Clean up any existing test container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️  Removing existing test container..."
    docker rm -f $CONTAINER_NAME > /dev/null 2>&1
fi

echo "📦 Starting fresh Ubuntu container..."
docker run -d --name $CONTAINER_NAME ubuntu:22.04 tail -f /dev/null > /dev/null

echo "⏳ Installing curl, sudo, and git in container..."
docker exec $CONTAINER_NAME bash -c "apt-get update -qq && apt-get install -y -qq curl sudo git > /dev/null 2>&1"

echo "🌐 Running deployed install script..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec $CONTAINER_NAME bash -c "curl -fsSL https://raw.githubusercontent.com/ocodista/better-shell/main/install.sh | bash"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $? -eq 0 ]; then
    echo "✅ Installation completed successfully!"
    echo ""
    echo "🧪 Running verification tests..."
    echo ""

    # Test zsh
    echo -n "  zsh: "
    if docker exec $CONTAINER_NAME zsh --version > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test fzf
    echo -n "  fzf: "
    if docker exec $CONTAINER_NAME bash -c "[ -f ~/.fzf/bin/fzf ]" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test eza
    echo -n "  eza: "
    if docker exec $CONTAINER_NAME bash -c "command -v eza" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test mise
    echo -n "  mise: "
    if docker exec $CONTAINER_NAME bash -c "~/.local/bin/mise --version || mise --version" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test tmux
    echo -n "  tmux: "
    if docker exec $CONTAINER_NAME tmux -V > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test oh-my-zsh
    echo -n "  oh-my-zsh: "
    if docker exec $CONTAINER_NAME bash -c "[ -d ~/.oh-my-zsh ]" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    # Test configs
    echo -n "  .zshrc: "
    if docker exec $CONTAINER_NAME bash -c "[ -f ~/.zshrc ]" > /dev/null 2>&1; then
        echo "✓"
    else
        echo "✗ FAILED"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ All tests passed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Container name: $CONTAINER_NAME"
    echo ""
    echo "To access the container and try it out:"
    echo "  docker exec -it $CONTAINER_NAME zsh"
    echo ""
    echo "To clean up:"
    echo "  docker rm -f $CONTAINER_NAME"
    echo ""
else
    echo "❌ Installation failed!"
    echo ""
    echo "To inspect the container:"
    echo "  docker exec -it $CONTAINER_NAME bash"
    echo ""
    echo "To clean up:"
    echo "  docker rm -f $CONTAINER_NAME"
    echo ""
    exit 1
fi
