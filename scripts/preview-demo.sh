#!/usr/bin/env bash
# Serve a built demo locally so it can be captured / smoke-tested.
# Usage: bash scripts/preview-demo.sh <slug> [port]
# Serves ../michaelwegter.com/public/demos/<slug>/ at http://localhost:<port>/
# Prints the URL, then blocks. The caller backgrounds it and kills it when done.
set -euo pipefail

SLUG="${1:-}"
PORT="${2:-5050}"
if [[ -z "$SLUG" ]]; then
  echo "usage: bash scripts/preview-demo.sh <slug> [port]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="$ROOT/../michaelwegter.com/public/demos/$SLUG"

if [[ ! -d "$DIR" ]]; then
  echo "demo not found: $DIR" >&2
  exit 1
fi

echo "serving $DIR at http://localhost:$PORT/"
# Python's http.server is everywhere and needs no install.
cd "$DIR"
exec python3 -m http.server "$PORT"
