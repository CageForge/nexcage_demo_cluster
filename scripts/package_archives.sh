#!/usr/bin/env bash
# ==============================================================================
# package_archives.sh
# Packages nexcage-demo-cluster.zip and nexcage-demo-cluster.tar.gz cleanly.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if command -v python3 &>/dev/null; then
  python3 "${SCRIPT_DIR}/package_archives.py"
else
  echo "==> Python3 not found, falling back to standard tar/zip..."
  TMP_DIR=$(mktemp -d /tmp/nexcage-pack-XXXXXX)
  trap 'rm -rf "$TMP_DIR"' EXIT
  
  # Stage files into clean demo-cluster directory
  mkdir -p "${TMP_DIR}/demo-cluster"
  rsync -av --exclude="node_modules" \
            --exclude=".git" \
            --exclude="nexcage-demo-cluster.zip" \
            --exclude="nexcage-demo-cluster.tar.gz" \
            --exclude=".DS_Store" \
            --exclude="*.tmp" \
            "${DEMO_DIR}/" "${TMP_DIR}/demo-cluster/"
  
  # Build tar.gz
  tar -czf "${DEMO_DIR}/nexcage-demo-cluster.tar.gz" -C "$TMP_DIR" demo-cluster
  
  # Build zip if zip command available
  if command -v zip &>/dev/null; then
    (cd "$TMP_DIR" && zip -rq9 "${DEMO_DIR}/nexcage-demo-cluster.zip" demo-cluster)
  fi
  echo "✨ Standalone archives updated!"
fi
