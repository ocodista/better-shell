#!/usr/bin/env bash
# Install better-shell from GitHub releases

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 better-shell installer${NC}"
echo ""

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  *)
    echo -e "${RED}❌ Unsupported OS: $OS${NC}"
    echo "better-shell supports macOS and Linux only"
    exit 1
    ;;
esac

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    exit 1
    ;;
esac

echo -e "Platform: ${GREEN}$OS-$ARCH${NC}"

# Get latest release info
REPO="ocodista/better-shell"
RELEASE_URL="https://api.github.com/repos/$REPO/releases/latest"

echo "Fetching latest release..."
RELEASE_DATA=$(curl -sL "$RELEASE_URL")

# Extract version
VERSION=$(echo "$RELEASE_DATA" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$VERSION" ]; then
  echo -e "${RED}❌ Failed to fetch latest release${NC}"
  echo "Check: https://github.com/$REPO/releases"
  exit 1
fi

echo -e "Latest version: ${GREEN}$VERSION${NC}"

# Construct download URL
if [ "$OS" = "darwin" ]; then
  BINARY_NAME="better-shell-darwin-$ARCH"
else
  LIBC="glibc"
  if ldd --version 2>&1 | grep -qi musl; then
    LIBC="musl"
  fi

  if [ "$LIBC" = "musl" ]; then
    BINARY_NAME="better-shell-linux-$ARCH-musl"
  else
    BINARY_NAME="better-shell-linux-$ARCH"
  fi
fi

DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION/$BINARY_NAME"
CHECKSUM_URL="$DOWNLOAD_URL.sha256"

# Download binary
TMP_DIR=$(mktemp -d)
TMP_FILE="$TMP_DIR/better-shell"

echo "Downloading..."
if ! curl -fsSL "$DOWNLOAD_URL" -o "$TMP_FILE"; then
  echo -e "${RED}❌ Download failed${NC}"
  echo "URL: $DOWNLOAD_URL"
  exit 1
fi

# Make executable
chmod +x "$TMP_FILE"

echo -e "${GREEN}✓${NC} Downloaded successfully"

# Verify checksum when the release provides one
if curl -fsSL "$CHECKSUM_URL" -o "$TMP_FILE.sha256" 2>/dev/null; then
  EXPECTED_SHA=$(awk '{print $1}' "$TMP_FILE.sha256")

  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_SHA=$(sha256sum "$TMP_FILE" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL_SHA=$(shasum -a 256 "$TMP_FILE" | awk '{print $1}')
  else
    ACTUAL_SHA=""
    echo -e "${BLUE}ℹ${NC} sha256sum/shasum not found; skipping checksum verification"
  fi

  if [ -n "$ACTUAL_SHA" ]; then
    if [ "$EXPECTED_SHA" != "$ACTUAL_SHA" ]; then
      echo -e "${RED}❌ Checksum verification failed${NC}"
      echo "Expected: $EXPECTED_SHA"
      echo "Actual:   $ACTUAL_SHA"
      exit 1
    fi
    echo -e "${GREEN}✓${NC} Checksum verified"
  fi
else
  echo -e "${BLUE}ℹ${NC} No checksum file found for $BINARY_NAME; skipping verification"
fi

echo ""

# Run installation
echo "Starting installation..."
echo ""
if [ "$OS" = "linux" ] && [ "$(id -u)" -ne 0 ]; then
  if ! command -v sudo >/dev/null 2>&1; then
    echo -e "${RED}❌ Linux installation requires sudo${NC}"
    exit 1
  fi
  sudo "$TMP_FILE" install
else
  "$TMP_FILE" install
fi

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}✨ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: exec zsh"
echo "2. Verify default shell: echo \$SHELL"
echo "3. Press 'Ctrl+B then I' in tmux to install plugins"
echo "4. Set terminal font to FiraCode Nerd Font"
