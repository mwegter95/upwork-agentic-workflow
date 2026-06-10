#!/usr/bin/env bash
# Scaffold a run directory for the upwork-proposal workflow.
# Usage: bash scripts/new-run.sh <slug>
set -euo pipefail

SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "usage: bash scripts/new-run.sh <slug>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN="$ROOT/upwork-runs/$SLUG"

mkdir -p "$RUN/proposal/media"
touch "$RUN/run.log"

# Seed an empty input file if the orchestrator has not written one yet.
[[ -f "$RUN/input.md" ]] || : > "$RUN/input.md"

echo "run dir ready: upwork-runs/$SLUG"
echo "  - input.md, run.log, proposal/media/ created"
