# Alpine test environment for better-shell
# Defaults keep the Dockerfile compatible with the legacy Docker builder.
ARG TARGETPLATFORM=linux/amd64
ARG TARGETARCH=amd64

FROM --platform=$TARGETPLATFORM rust:1.91-slim-bullseye AS builder
ARG TARGETARCH
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends musl-tools && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN case "$TARGETARCH" in \
      arm64) rust_target="aarch64-unknown-linux-musl" ;; \
      amd64) rust_target="x86_64-unknown-linux-musl" ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" >&2; exit 1 ;; \
    esac && \
    rustup target add "$rust_target" && \
    cargo build --release --target "$rust_target" && \
    cp "target/$rust_target/release/better-shell" /usr/local/bin/better-shell

FROM --platform=$TARGETPLATFORM alpine:3.19

# Build args for platform detection
ARG TARGETARCH

# Install only the tools needed to run the integration fixture.
# The installer itself installs zsh, tmux, mise, eza, fzf, and other managed tools.
RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    git \
    shadow \
    sudo \
    unzip

# Create a test user
RUN adduser -D -s /bin/bash testuser && \
    echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Switch to test user
USER testuser
WORKDIR /home/testuser

# Copy the Rust binary built for this Docker platform.
COPY --from=builder --chown=testuser:testuser /usr/local/bin/better-shell /home/testuser/better-shell

# Copy helper scripts
COPY --chown=testuser:testuser tests/install-and-test.sh /home/testuser/install-and-test.sh
COPY --chown=testuser:testuser tests/alpine/test-runner.sh /home/testuser/test-runner.sh

# Make executables
RUN chmod +x /home/testuser/better-shell /home/testuser/install-and-test.sh /home/testuser/test-runner.sh

# Default command: run check, show instructions, open shell
CMD ["/bin/bash", "-c", "./better-shell check && echo '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ Alpine Linux 3.19 Test Environment Ready!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nQuick start:\n  ./test-runner.sh         - Run automated integration tests ✅\n  ./install-and-test.sh    - Install and launch improved shell\n  ./better-shell install --dry-run  - Preview installation\n  exit                     - Leave container\n' && exec /bin/bash"]
