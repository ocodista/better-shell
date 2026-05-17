# Testing Strategy

Tests focus on user-facing behavior: the CLI should build, report health correctly, install a complete terminal setup in containers, and write the expected configuration files.

## Local Rust checks

```bash
make check
```

Or run the individual commands:

```bash
cargo fmt --check
cargo clippy --release -- -D warnings
cargo test
cargo build --release
```

## Docker integration tests

The Docker fixtures build the Rust binary from source inside the target Linux image, then run the installer and verify the resulting shell setup.

```bash
make integration          # Ubuntu and Alpine
make integration-ubuntu   # Ubuntu only
make integration-alpine   # Alpine only
make dev-container        # Persistent Ubuntu container for docker exec
make dev-alpine           # Persistent Alpine container for docker exec
make join-alpine          # docker exec into persistent Alpine container
make ubuntu               # Interactive Ubuntu fixture
make alpine               # Interactive Alpine fixture
make quick                # Quick Ubuntu shell
```

For a persistent manual test container:

```bash
make dev-container
make join-ubuntu

make dev-alpine
make join-alpine
```

## What integration verifies

- `zsh` is installed and loads correctly.
- `fzf`, `eza`, `tmux`, and `mise` are installed.
- Oh My Zsh and Antigen are installed.
- `~/.zshrc`, `~/.antigenrc`, `~/.tmux.conf`, and the eza Tokyo Night config are written.

## CI/CD

GitHub Actions runs:

- Rust formatting, clippy, tests, and release build on Linux, macOS, and Windows.
- Docker integration tests on Ubuntu and Alpine containers.
- Release artifact builds for macOS, Linux glibc, Linux musl, and Windows.

Configuration: `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
