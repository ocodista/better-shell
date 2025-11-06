FROM ubuntu:22.04

# Install minimal requirements
RUN apt-get update && \
    apt-get install -y curl sudo git && \
    rm -rf /var/lib/apt/lists/*

# Run better-terminal installation
RUN curl -fsSL https://raw.githubusercontent.com/ocodista/better-terminal/main/install.sh | bash

# Set zsh as default shell
CMD ["zsh"]
