# Better Shell
One command to install a modern shell environment.

The default shell still looks like a 1970s command prompt. This script brings your terminal to life.

## What You Get

- **Auto-suggestions** - [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
- **Fast search** - [fzf](https://github.com/junegunn/fzf) (Ctrl+R)
- **Syntax highlighting** - [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- **Directory jumping** - [zsh-z](https://github.com/agkozak/zsh-z)
- **Modern ls** - [eza](https://github.com/eza-community/eza)
- **Version manager** - [asdf](https://github.com/asdf-vm/asdf)
- **Terminal multiplexer** - [tmux](https://github.com/tmux/tmux)
- **Programming font** - [FiraCode Nerd Font](https://github.com/ryanoasis/nerd-fonts)

## Installation

### macOS

```bash
curl -fsSL https://shell.ocodista.com/install.sh | bash
```

### Linux

The installer needs root privileges to install packages (zsh, tmux, etc.) and change your default shell.

```bash
curl -fsSL https://shell.ocodista.com/install.sh | sudo bash
```

### Windows (PowerShell)

```powershell
irm https://shell.ocodista.com/install.ps1 | iex
```

**Windows options:**
- **WSL2** (recommended) - Full Linux experience with zsh, tmux, etc.
- **Native** - PowerShell with fzf, eza, PSReadLine

**Alternative URLs:**
- Bash: `https://raw.githubusercontent.com/ocodista/better-shell/main/install.sh`
- PowerShell: `https://raw.githubusercontent.com/ocodista/better-shell/main/install.ps1`

Automatically backs up existing configs.

## Tools Installed

| Tool | Purpose | Repository |
|------|---------|------------|
| [zsh](https://www.zsh.org/) | Shell | - |
| [Oh My Zsh](https://ohmyz.sh/) | Framework | [ohmyzsh/ohmyzsh](https://github.com/ohmyzsh/ohmyzsh) |
| [Antigen](http://antigen.sharats.me/) | Plugin manager | [zsh-users/antigen](https://github.com/zsh-users/antigen) |
| [fzf](https://github.com/junegunn/fzf) | Fuzzy finder | [junegunn/fzf](https://github.com/junegunn/fzf) |
| [eza](https://eza.rocks/) | ls replacement | [eza-community/eza](https://github.com/eza-community/eza) |
| [asdf](https://asdf-vm.com/) | Version manager | [asdf-vm/asdf](https://github.com/asdf-vm/asdf) |
| [tmux](https://github.com/tmux/tmux) | Multiplexer | [tmux/tmux](https://github.com/tmux/tmux) |
| [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) | Suggestions | [zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) |
| [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) | Highlighting | [zsh-users/zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) |
| [zsh-completions](https://github.com/zsh-users/zsh-completions) | Completions | [zsh-users/zsh-completions](https://github.com/zsh-users/zsh-completions) |
| [zsh-z](https://github.com/agkozak/zsh-z) | Directory jumper | [agkozak/zsh-z](https://github.com/agkozak/zsh-z) |
| [FiraCode Nerd Font](https://www.nerdfonts.com/) | Font | [ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts) |

### Windows Native Tools

| Tool | Purpose | Repository |
|------|---------|------------|
| [PowerShell](https://github.com/PowerShell/PowerShell) | Shell | [PowerShell/PowerShell](https://github.com/PowerShell/PowerShell) |
| [Scoop](https://scoop.sh/) | Package manager | [ScoopInstaller/Scoop](https://github.com/ScoopInstaller/Scoop) |
| [PSReadLine](https://github.com/PowerShell/PSReadLine) | Auto-suggestions | [PowerShell/PSReadLine](https://github.com/PowerShell/PSReadLine) |
| [posh-git](https://github.com/dahlbyk/posh-git) | Git integration | [dahlbyk/posh-git](https://github.com/dahlbyk/posh-git) |
| [Terminal-Icons](https://github.com/devblackops/Terminal-Icons) | File icons | [devblackops/Terminal-Icons](https://github.com/devblackops/Terminal-Icons) |
| [fzf](https://github.com/junegunn/fzf) | Fuzzy finder | [junegunn/fzf](https://github.com/junegunn/fzf) |
| [eza](https://github.com/eza-community/eza) | ls replacement | [eza-community/eza](https://github.com/eza-community/eza) |

## Requirements

### macOS
- Git
- Internet connection
- [Homebrew](https://brew.sh/) (used to install packages)

### Linux
- `curl` and `git`
- Internet connection
- `sudo` access (needed to install packages and change default shell)

### Windows
- PowerShell 5.1 or later
- Internet connection
- (Optional) WSL2 for full Linux experience

## Usage

### Search History
Press `Ctrl+R`, type to search.

### Jump to Directories
```bash
z docs          # Jump to ~/documents
z blog          # Jump to ~/sites/blog
```

### List Files
```bash
lsx             # List with icons
```

### Terminal Splits
```bash
tmux            # Start tmux
# Ctrl+B then %  → split vertical
# Ctrl+B then "  → split horizontal
```

### Version Management
```bash
asdf install nodejs 20.0.0
asdf global nodejs 20.0.0
```

## After Installation

1. **Restart your terminal** (or run `exec zsh` to switch immediately)
2. Verify zsh is your default shell: `echo $SHELL` should print `/usr/bin/zsh` or `/bin/zsh`
3. Open tmux and press `Ctrl+B` then `I` to install tmux plugins
4. Set your terminal font to **FiraCode Nerd Font**

> The installer runs `chsh -s $(which zsh)` to set zsh as your default shell. If that step failed (some systems require a password prompt), run it manually:
> ```bash
> chsh -s $(which zsh)
> ```

## Commands

```bash
better-shell check                  # Check requirements
better-shell install                # Install
better-shell install --dry-run      # Preview changes
better-shell install --skip-backup  # Skip backup
better-shell backup                 # Backup configs
better-shell restore <path>         # Restore from backup
```

## Configuration

Edit these files:

- `~/.zshrc` - Shell settings
- `~/.tmux.conf` - Tmux settings
- `~/.config/eza/tokyonight.yml` - File colors
- `~/.antigenrc` - Zsh plugins
- `~/.ssh/config` - SSH defaults (keep-alive, connection reuse, security)

Backups saved to `~/.better-shell-backups/YYYY-MM-DD-HHMMSS`.

## Troubleshooting

### Permission denied on Linux

The installer needs root privileges to install packages and change your default shell. Use `sudo`:

```bash
curl -fsSL https://shell.ocodista.com/install.sh | sudo bash
```

### Zsh is not my default shell after installation

Some systems require a password for `chsh`. Run it manually:

```bash
chsh -s $(which zsh)
```

Then restart your terminal. Verify with `echo $SHELL`.

### Amazon Linux / RHEL / Fedora

These distros don't ship with zsh. The installer handles this automatically via `dnf`, but requires `sudo`. See [Permission denied on Linux](#permission-denied-on-linux).

## Development

Built with [Bun](https://github.com/oven-sh/bun).

### Build from Source

```bash
git clone https://github.com/ocodista/better-shell.git
cd better-shell
bun install
bun run build
./dist/better-shell install
```

### Test

```bash
docker build -t better-shell .
docker run -it better-shell

./tests/quick-test.sh
bun run test
```

### Binaries

Pre-built binaries for:
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Linux ARM64
- Linux x64
- Windows x64

Download from [releases](https://github.com/ocodista/better-shell/releases).

## License

MIT

---

Made with [Bun](https://bun.sh) 🥟
