# Better Shell

A native Rust terminal setup manager that installs and maintains a modern shell environment.

Better Shell turns a fresh terminal into a productive setup. It installs zsh, fuzzy history, completions, directory jumping, a modern `ls`, tmux, Node.js through mise, fonts, config files, and automatic backups.

## Demo

![Annotated feature tour — modern ls, autojump, fuzzy history, tab completion, syntax highlighting](demo/ubuntu-after-annotated.gif)

![Plain bash on the left, Better Shell on the right](demo/ubuntu-side-by-side.gif)

![Installing better-shell with a single curl pipe](demo/install.gif)

See [`demo/`](demo/) for the VHS tapes, Dockerfiles, and Remotion project used to regenerate the recordings.

## Install

### macOS

```bash
curl -fsSL https://shell.ocodista.com/install.sh | bash
```

### Linux

```bash
curl -fsSL https://shell.ocodista.com/install.sh | sudo bash
```

### Windows PowerShell

```powershell
irm https://shell.ocodista.com/install.ps1 | iex
```

Windows prefers WSL2. If WSL2 is unavailable, it can install a native PowerShell setup.

End users do **not** need Rust installed. Releases ship prebuilt native binaries for macOS, Linux glibc, Linux musl, and Windows. The installer detects your OS, CPU, and libc, then downloads the matching binary from GitHub Releases.

Alternative URLs: [`install.sh`](https://raw.githubusercontent.com/ocodista/better-shell/main/install.sh), [`install.ps1`](https://raw.githubusercontent.com/ocodista/better-shell/main/install.ps1)

## Interactive manager

Run `better-shell` with no arguments to open the control center.

```bash
better-shell
better-shell manage
better-shell configure
better-shell install --interactive
```

The TUI can install the full setup, build a custom setup, preview changes, run health checks, back up configs, restore configs, and show next steps.

## Commands

```bash
better-shell check                  # Check requirements and installed tools
better-shell install                # Install and configure the shell
better-shell install --interactive  # Guided TUI installer
better-shell install --dry-run      # Preview changes
better-shell install --minimal      # Skip fonts and carapace
better-shell install --no-tmux      # Skip a feature
better-shell backup                 # Back up current configs
better-shell restore <backup-path>  # Restore configs from a backup
```

## What it installs

| Area | Tools |
| --- | --- |
| Shell | [zsh](https://www.zsh.org/), [Oh My Zsh](https://ohmyz.sh/), [Antigen](https://github.com/zsh-users/antigen) |
| Zsh plugins | `git`, `git-extras`, `command-not-found`, [zsh-completions](https://github.com/zsh-users/zsh-completions), [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions), [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting), [zsh-z](https://github.com/agkozak/zsh-z) |
| Search and completion | [fzf](https://github.com/junegunn/fzf), [carapace](https://github.com/carapace-sh/carapace-bin) |
| File listing | [eza](https://github.com/eza-community/eza) with a TokyoNight config |
| Version management | [mise](https://mise.jdx.dev/) with Node.js LTS |
| Terminal sessions | [tmux](https://github.com/tmux/tmux), [TPM](https://github.com/tmux-plugins/tpm), [tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect), [tmux-continuum](https://github.com/tmux-plugins/tmux-continuum) |
| Font | [FiraCode Nerd Font](https://www.nerdfonts.com/) |
| Windows native path | PowerShell, [Scoop](https://scoop.sh/), `git`, `fzf`, `eza`, `mise`, [PSReadLine](https://github.com/PowerShell/PSReadLine), [PSFzf](https://github.com/kelleyma49/PSFzf), [posh-git](https://github.com/dahlbyk/posh-git), [Terminal-Icons](https://github.com/devblackops/Terminal-Icons) |

## Why mise instead of asdf

`mise` is the modern replacement for this project. It is faster, ships as a single binary, supports `.tool-versions`, manages environment variables and tasks, and works with many asdf plugins.

Better Shell installs Node.js LTS globally with:

```bash
mise use --global node@lts
```

On Alpine, Better Shell installs `mise` but skips Node.js by default because official Node.js LTS binaries are glibc-based and `mise` may fall back to a source build. Use `apk add nodejs npm` there if you need Node.js.

## Requirements

- macOS: Git, curl, Homebrew, and internet access.
- Linux: sudo access, Git, curl, a supported package manager (`apt`, `dnf`, `pacman`, or `apk`), and internet access.
- Windows: PowerShell 5.1 or later. WSL2 is recommended.

## After installation

1. Restart the terminal or run `exec zsh`.
2. Verify the default shell with `echo $SHELL`.
3. In tmux, press `Ctrl+B`, then `I`, to install plugins.
4. Set the terminal font to **FiraCode Nerd Font**.

If `chsh` did not change your shell, run `chsh -s $(command -v zsh)`.

## Usage

```bash
Ctrl+R                         # Fuzzy history search
z docs                         # Directory jumping
lsx                            # Modern ls with icons
tmux                           # Start tmux
mise use --global node@lts     # Install/use Node.js LTS
```

## Configuration and backups

Better Shell writes:

- `~/.zshrc`
- `~/.antigenrc`
- `~/.tmux.conf`
- `~/.config/eza/tokyonight.yml`

It saves backups to `~/.better-shell-backups/YYYY-MM-DD-HHMMSS` before writing new configs.

## Development

Built with Rust and Cargo. The official CLI is the native Rust binary.

```bash
git clone https://github.com/ocodista/better-shell.git
cd better-shell
cargo build --release
./target/release/better-shell install --dry-run
```

Useful commands:

```bash
make test                        # Unit tests
make check                       # Formatting, clippy, tests, and release build
make build                       # Build current-platform release artifact in dist/
make integration                 # Ubuntu and Alpine integration tests
make integration-ubuntu          # Ubuntu integration only
make integration-alpine          # Alpine integration only
make dev-container               # Start persistent Ubuntu container for docker exec
make dev-alpine                  # Start persistent Alpine container for docker exec
make join-alpine                 # docker exec into persistent Alpine container
make dry-run                     # Preview installer with cargo run
npx wrangler deploy --env production  # Deploy shell.ocodista.com worker
```

Project tooling:

| Purpose | Tools |
| --- | --- |
| Runtime and build | Rust, Cargo |
| TUI | dialoguer |
| Distribution | GitHub Releases, compiled Rust binaries, SHA-256 checksums |
| Install endpoint | Cloudflare Workers, Wrangler |
| Tests | Cargo test, Docker, Ubuntu and Alpine test runners |
| Demo generation | VHS, Docker, Remotion, npm |

## Troubleshooting

### Permission denied on Linux

Run `curl -fsSL https://shell.ocodista.com/install.sh | sudo bash`.

### zsh is not the default shell

Run `chsh -s $(command -v zsh)`, restart the terminal, and verify with `echo $SHELL`.

## License

MIT
