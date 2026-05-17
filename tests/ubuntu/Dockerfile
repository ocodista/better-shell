# Ubuntu test environment for better-shell
# Defaults keep the Dockerfile compatible with the legacy Docker builder.
ARG TARGETPLATFORM=linux/amd64
ARG TARGETARCH=amd64

FROM --platform=$TARGETPLATFORM rust:1.91-slim-bullseye AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM --platform=$TARGETPLATFORM ubuntu:22.04

# Build args for platform detection
ARG TARGETARCH

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install only the tools needed to run the integration fixture.
# The installer itself installs zsh, tmux, mise, eza, fzf, and other managed tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    sudo \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create a test user (better-shell shouldn't run as root)
RUN useradd -m -s /bin/bash testuser && \
    echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Switch to test user
USER testuser
WORKDIR /home/testuser

# Copy the Rust binary built for this Docker platform.
COPY --from=builder --chown=testuser:testuser /app/target/release/better-shell /home/testuser/better-shell

# Copy helper scripts
COPY --chown=testuser:testuser tests/install-and-test.sh /home/testuser/install-and-test.sh
COPY --chown=testuser:testuser tests/ubuntu/test-runner.sh /home/testuser/test-runner.sh

# Make executables
RUN chmod +x /home/testuser/better-shell /home/testuser/install-and-test.sh /home/testuser/test-runner.sh

# Default command: run check, show instructions, open shell
CMD ["/bin/bash", "-c", "./better-shell check && echo '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ Ubuntu 22.04 Test Environment Ready!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nQuick start:\n  ./test-runner.sh         - Run automated integration tests ✅\n  ./install-and-test.sh    - Install and launch improved shell\n  ./better-shell install --dry-run  - Preview installation\n  exit                     - Leave container\n' && exec /bin/bash"]
