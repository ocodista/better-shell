# Ubuntu test environment for better-shell
# Use platform-specific image
FROM --platform=$TARGETPLATFORM ubuntu:22.04

# Build args for platform detection
ARG TARGETARCH

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    build-essential \
    sudo \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Create a test user (better-shell shouldn't run as root)
RUN useradd -m -s /bin/bash testuser && \
    echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Switch to test user
USER testuser
WORKDIR /home/testuser

# Copy the appropriate architecture binary
# TARGETARCH is set by Docker (amd64 or arm64)
COPY --chown=testuser:testuser dist/better-shell-linux-${TARGETARCH} /home/testuser/better-shell

# Copy helper scripts
COPY --chown=testuser:testuser tests/install-and-test.sh /home/testuser/install-and-test.sh
COPY --chown=testuser:testuser tests/ubuntu/test-runner.sh /home/testuser/test-runner.sh

# Make executables
RUN chmod +x /home/testuser/better-shell /home/testuser/install-and-test.sh /home/testuser/test-runner.sh

# Default command: run check, show instructions, open shell
CMD ["/bin/bash", "-c", "./better-shell check && echo '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ Ubuntu 22.04 Test Environment Ready!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nQuick start:\n  ./test-runner.sh         - Run automated integration tests ✅\n  ./install-and-test.sh    - Install and launch improved shell\n  ./better-shell install --dry-run  - Preview installation\n  exit                     - Leave container\n' && exec /bin/bash"]
