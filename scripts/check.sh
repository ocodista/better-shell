#!/usr/bin/env bash
# Run the Rust quality gate used by CI.

set -euo pipefail

cd "$(dirname "$0")/.."

cargo fmt --check
cargo clippy --release -- -D warnings
cargo test
cargo build --release
