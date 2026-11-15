#!/usr/bin/env bash
set -euo pipefail

# Keep the actual application in the repository root; this script makes the
# demo folder a convenient, stable entry point.
cd "$(dirname "$0")/.."
exec npm run dev -- --hostname 0.0.0.0 --port "${PORT:-3000}"
