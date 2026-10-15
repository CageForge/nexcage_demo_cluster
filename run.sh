#!/usr/bin/env bash
# ==============================================================================
# run.sh - NexCage Demo Cluster Launcher (Linux / macOS)
# ==============================================================================
set -euo pipefail

PORT=${PORT:-3000}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "===================================================="
echo "   🚀 NexCage Demo Cluster Launcher"
echo "===================================================="

# Check if dist/ exists and contains index.html; if not, build it with npm
if [ ! -f "dist/index.html" ]; then
  if command -v npm &>/dev/null; then
    echo "==> Production bundle 'dist' not found. Building now..."
    npm install
    npm run build
    if [ ! -f "dist/index.html" ]; then
      echo "Error: Build completed but 'dist/index.html' was not created." >&2
      exit 1
    fi
  else
    echo "Error: dist/index.html not found and npm is not installed." >&2
    echo "Please install Node.js from https://nodejs.org/ to build the demo." >&2
    exit 1
  fi
fi

echo "==> Target URL: http://localhost:${PORT}"
echo "==> Press Ctrl+C in this terminal to stop the server."
echo ""

# Attempt to open default web browser in background
open_browser() {
  sleep 1
  if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:${PORT}" 2>/dev/null || true
  elif command -v open &>/dev/null; then
    open "http://localhost:${PORT}" 2>/dev/null || true
  fi
}
open_browser &

# Method 1: Python 3 (standard on modern Linux & macOS)
if command -v python3 &>/dev/null; then
  echo "==> Starting web server using Python 3..."
  exec python3 -m http.server "$PORT" --directory dist
# Method 2: Python 2 legacy fallback
elif command -v python &>/dev/null; then
  echo "==> Starting web server using Python 2..."
  (cd dist && exec python -m SimpleHTTPServer "$PORT")
# Method 3: npx serve
elif command -v npx &>/dev/null; then
  echo "==> Starting web server using npx serve..."
  exec npx -y serve dist -l "$PORT"
# Method 4: Node.js built-in HTTP server (zero external packages)
elif command -v node &>/dev/null; then
  echo "==> Starting web server using Node.js built-in HTTP server..."
  exec node -e '
    const http = require("http"), fs = require("fs"), path = require("path");
    const port = parseInt(process.env.PORT || "3000", 10);
    const mime = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon"
    };
    const server = http.createServer((req, res) => {
      let safePath = path.normalize(req.url.split("?")[0]).replace(/^(\.\.[\/\\])+/, "");
      let filePath = path.join("dist", safePath === "/" ? "index.html" : safePath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join("dist", "index.html");
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  '
else
  echo "Error: Neither Python nor Node.js found in PATH." >&2
  exit 1
fi
