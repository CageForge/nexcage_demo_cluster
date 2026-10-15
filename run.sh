#!/usr/bin/env bash
set -e

PORT=${PORT:-3000}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== NexCage Demo Cluster Launcher ==="

# Check if dist/ exists, if not build it
if [ ! -d "dist" ]; then
  if command -v npm &>/dev/null; then
    echo "==> Building dist/ bundle..."
    npm install
    npm run build
  else
    echo "Error: dist/ directory not found and npm is not installed." >&2
    exit 1
  fi
fi

# Prefer Python 3 (built-in on Linux & macOS)
if command -v python3 &>/dev/null; then
  echo "==> Starting web server on http://localhost:${PORT} using Python 3..."
  echo "==> Open http://localhost:${PORT} in your browser."
  echo "==> Press Ctrl+C to stop."
  python3 -m http.server "$PORT" --directory dist
elif command -v python &>/dev/null; then
  echo "==> Starting web server on http://localhost:${PORT} using Python..."
  echo "==> Open http://localhost:${PORT} in your browser."
  echo "==> Press Ctrl+C to stop."
  (cd dist && python -m SimpleHTTPServer "$PORT")
elif command -v npx &>/dev/null; then
  echo "==> Starting web server on http://localhost:${PORT} using npx serve..."
  npx serve dist -l "$PORT"
else
  echo "Error: Neither Python nor Node.js/npx found in PATH." >&2
  exit 1
fi
