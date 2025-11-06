#!/bin/bash
# Helper script to install better-shell and launch the improved shell

echo "🚀 Installing better-shell..."
echo ""

# Run installation with sudo on Linux (needed for package installation)
if [ "$(uname)" = "Linux" ] && [ "$EUID" -ne 0 ]; then
    echo "ℹ Running with sudo for package installation..."
    sudo ./better-shell install

    # Copy configs from root to current user if installation was run with sudo
    if [ $? -eq 0 ] && [ -f /root/.zshrc ]; then
        echo ""
        echo "📋 Copying configs to your user directory..."
        sudo cp /root/.zshrc ~/
        sudo cp /root/.antigenrc ~/
        sudo cp /root/antigen.zsh ~/
        sudo cp /root/.tmux.conf ~/
        sudo cp -r /root/.config/eza ~/.config/ 2>/dev/null || true
        sudo cp /root/.fzf.zsh ~/ 2>/dev/null || true
        sudo cp -r /root/.fzf ~/ 2>/dev/null || true
        sudo cp -r /root/.asdf ~/ 2>/dev/null || true
        sudo cp /root/.tool-versions ~/ 2>/dev/null || true
        sudo cp -r /root/.oh-my-zsh ~/ 2>/dev/null || true
        sudo cp -r /root/.tmux ~/ 2>/dev/null || true

        # Fix ownership
        sudo chown -R $(id -u):$(id -g) ~/.zshrc ~/.antigenrc ~/antigen.zsh ~/.tmux.conf ~/.config/eza ~/.fzf.zsh ~/.fzf ~/.asdf ~/.tool-versions ~/.oh-my-zsh ~/.tmux 2>/dev/null || true

        # Fix hardcoded /root paths to use $HOME
        sed -i 's|/root/|$HOME/|g' ~/.fzf.zsh 2>/dev/null || true
        sed -i 's|/root/|$HOME/|g' ~/.zshrc 2>/dev/null || true

        echo "✓ Configs copied and paths fixed"
    fi
else
    ./better-shell install
fi

# Check if installation succeeded
if [ $? -eq 0 ] || [ -f ~/.zshrc ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Installation complete! Launching your improved terminal..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Try these commands to test your new terminal:"
    echo "  Ctrl+R           - Blazingly fast search with fzf"
    echo "  lsx              - List files with icons (eza)"
    echo "  z <dir>          - Jump to frequently used directories"
    echo "  tmux             - Start terminal multiplexer"
    echo "  node --version   - Check Node.js (via asdf)"
    echo "  exit             - Leave the improved shell"
    echo ""

    # Source zsh and exec into it
    export SHELL=$(which zsh)
    exec zsh -l
else
    echo ""
    echo "❌ Installation failed. Check the errors above."
    exit 1
fi
