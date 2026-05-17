.PHONY: help fmt fmt-check lint test build check dry-run integration integration-ubuntu integration-alpine dev-container dev-ubuntu dev-alpine join-ubuntu join-alpine quick ubuntu alpine clean

ARCH := $(shell uname -m)
ifeq ($(ARCH),arm64)
  TARGETARCH := arm64
else ifeq ($(ARCH),aarch64)
  TARGETARCH := arm64
else
  TARGETARCH := amd64
endif
TARGETPLATFORM := linux/$(TARGETARCH)
DOCKER_BUILD_ARGS := --build-arg TARGETPLATFORM=$(TARGETPLATFORM) --build-arg TARGETARCH=$(TARGETARCH)

help:
	@printf "better-shell Rust targets\n\n"
	@printf "  make build                Build current-platform release artifact in dist/\n"
	@printf "  make check                Run fmt, clippy, tests, and release build\n"
	@printf "  make dry-run              Preview installer with cargo run\n"
	@printf "  make integration          Run Ubuntu and Alpine Docker integration tests\n"
	@printf "  make integration-ubuntu   Run Ubuntu Docker integration test\n"
	@printf "  make integration-alpine   Run Alpine Docker integration test\n"
	@printf "  make dev-container        Start persistent Ubuntu container for docker exec\n"
	@printf "  make dev-ubuntu           Start persistent Ubuntu container for docker exec\n"
	@printf "  make dev-alpine           Start persistent Alpine container for docker exec\n"
	@printf "  make join-ubuntu          docker exec into persistent Ubuntu container\n"
	@printf "  make join-alpine          docker exec into persistent Alpine container\n"
	@printf "  make quick                Open quick Ubuntu test shell\n"
	@printf "  make clean                Remove Cargo and dist build outputs\n"

fmt:
	cargo fmt

fmt-check:
	cargo fmt --check

lint:
	cargo clippy --release -- -D warnings

test:
	cargo test

build:
	./scripts/build.sh

check:
	./scripts/check.sh

dry-run:
	cargo run -- install --dry-run

integration: integration-ubuntu integration-alpine

integration-ubuntu:
	docker build $(DOCKER_BUILD_ARGS) -f tests/ubuntu/Dockerfile -t better-shell-ubuntu-test .
	docker run --rm --name better-shell-ubuntu-test-run better-shell-ubuntu-test /home/testuser/test-runner.sh

integration-alpine:
	docker build $(DOCKER_BUILD_ARGS) -f tests/alpine/Dockerfile -t better-shell-alpine-test .
	docker run --rm --name better-shell-alpine-test-run better-shell-alpine-test /home/testuser/test-runner.sh

dev-container: dev-ubuntu

dev-ubuntu:
	./tests/dev-container.sh ubuntu

dev-alpine:
	./tests/dev-container.sh alpine

join-ubuntu:
	docker exec -it better-shell-ubuntu-dev bash

join-alpine:
	docker exec -it better-shell-alpine-dev bash

quick:
	./tests/quick-test.sh

ubuntu:
	./tests/test-ubuntu.sh

alpine:
	./tests/test-alpine.sh

clean:
	cargo clean
	rm -rf dist
