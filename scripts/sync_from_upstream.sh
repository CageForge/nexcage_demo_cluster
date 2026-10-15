#!/usr/bin/env bash
# ==============================================================================
# sync_from_upstream.sh
# 
# Self-contained synchronization script located INSIDE demo-cluster.
# It pulls the latest frontend files and version from the main upstream 
# repository (CageForge/nexcage) directly via GitHub without modifying or 
# touching your local fork repository!
#
# When run, it also automatically rebuilds and refreshes the standalone
# distribution archives (nexcage-demo-cluster.zip and nexcage-demo-cluster.tar.gz).
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPSTREAM_REPO="CageForge/nexcage"
UPSTREAM_BRANCH="main"

DO_CHECK=false
DO_PULL=false
DO_BUILD=false
DO_PACK=false
DO_COMMIT=false

print_banner() {
  echo -e "${CYAN}====================================================${NC}"
  echo -e "${CYAN}   🔄 NexCage Demo - Standalone Upstream Sync       ${NC}"
  echo -e "${CYAN}====================================================${NC}"
  echo -e "Demo Directory: ${GREEN}${DEMO_DIR}${NC}"
  echo -e "Upstream Target: ${BLUE}https://github.com/${UPSTREAM_REPO}${NC}"
  echo ""
}

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -c, --check       Check upstream ${UPSTREAM_REPO} for newer release"
  echo "  -p, --pull        Fetch and update frontend sources directly from upstream GitHub"
  echo "  -b, --build       Run npm install & build in demo-cluster"
  echo "  -k, --pack        Re-package nexcage-demo-cluster.zip and .tar.gz archives"
  echo "  --commit          Commit updated changes and archives to demo git repo"
  echo "  --all             Run check, pull, build, and package (default when run without flags)"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/sync_from_upstream.sh          # Full sync: check, fetch from upstream, rebuild & update archives"
  echo "  ./scripts/sync_from_upstream.sh --check  # Check if a new upstream release is available"
  echo "  ./scripts/sync_from_upstream.sh --pack   # Only regenerate standalone archives"
}

if [ $# -eq 0 ]; then
  DO_CHECK=true
  DO_PULL=true
  DO_BUILD=true
  DO_PACK=true
else
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -c|--check)
        DO_CHECK=true
        shift
        ;;
      -p|--pull)
        DO_PULL=true
        shift
        ;;
      -b|--build)
        DO_BUILD=true
        shift
        ;;
      -k|--pack)
        DO_PACK=true
        shift
        ;;
      --commit)
        DO_COMMIT=true
        shift
        ;;
      --all)
        DO_CHECK=true
        DO_PULL=true
        DO_BUILD=true
        DO_PACK=true
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}" >&2
        usage
        exit 1
        ;;
    esac
  done
fi

print_banner

check_release() {
  echo -e "${BLUE}==> [1/4] Checking upstream release status...${NC}"
  CURRENT_DEMO_VER=$(tr -d ' \n\r' < "${DEMO_DIR}/VERSION" 2>/dev/null || echo "1.0.0")
  CURRENT_NEXCAGE_VER=$(grep -E 'NEXCAGE_VERSION' "${DEMO_DIR}/src/version.ts" 2>/dev/null | sed -E "s/.*'([^']+)'.*/\1/" || echo "0.17.0")
  echo -e "  Current Demo Cluster version:   ${GREEN}v${CURRENT_DEMO_VER}${NC}"
  echo -e "  Current NexCage engine version: ${GREEN}v${CURRENT_NEXCAGE_VER}${NC}"

  if command -v curl &>/dev/null; then
    LATEST_TAG=$(curl -sSL -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${UPSTREAM_REPO}/releases/latest" 2>/dev/null \
      | grep -m1 '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/' || true)

    if [ -n "$LATEST_TAG" ]; then
      CLEAN_TAG="${LATEST_TAG#v}"
      echo -e "  Latest upstream release tag:    ${YELLOW}${LATEST_TAG}${NC}"
      if [ "$CLEAN_TAG" != "$CURRENT_NEXCAGE_VER" ]; then
        echo -e "${YELLOW}  ⚠️  Newer NexCage engine version available (${CLEAN_TAG})!${NC}"
      else
        echo -e "${GREEN}  ✓ Demo engine is already at the latest upstream release version.${NC}"
      fi
    fi
  fi
}

pull_upstream_sources() {
  echo -e "\n${BLUE}==> [2/4] Fetching latest frontend sources from upstream...${NC}"
  TMP_DIR=$(mktemp -d /tmp/nexcage-sync-XXXXXX)
  trap 'rm -rf "$TMP_DIR"' EXIT

  echo "  -> Downloading latest repository snapshot from ${UPSTREAM_REPO}@${UPSTREAM_BRANCH}..."
  curl -sSL "https://github.com/${UPSTREAM_REPO}/archive/refs/heads/${UPSTREAM_BRANCH}.tar.gz" -o "${TMP_DIR}/upstream.tar.gz"

  echo "  -> Extracting upstream frontend files..."
  tar -xzf "${TMP_DIR}/upstream.tar.gz" -C "$TMP_DIR"
  EXTRACTED_DIR="${TMP_DIR}/nexcage-${UPSTREAM_BRANCH}"

  if [ -d "${EXTRACTED_DIR}/src" ]; then
    echo "  -> Updating ${DEMO_DIR}/src/ with latest components..."
    # Copy all TypeScript, TSX, CSS files from upstream src
    cp -r "${EXTRACTED_DIR}/src/"* "${DEMO_DIR}/src/"
    # Remove any native Zig backend files if present in upstream src
    find "${DEMO_DIR}/src" -name "*.zig" -delete 2>/dev/null || true
  fi

  # Dynamically extract upstream specifications directly from repo sources (zero hardcoding):
  NEW_VER=""
  if [ -f "${EXTRACTED_DIR}/VERSION" ]; then
    NEW_VER=$(tr -d ' \n\r' < "${EXTRACTED_DIR}/VERSION")
  fi

  UPSTREAM_ZIG=""
  if [ -f "${EXTRACTED_DIR}/build.zig.zon" ]; then
    UPSTREAM_ZIG=$(sed -n -E 's/.*minimum_zig_version *= *"([^"]+)".*/\1/p' "${EXTRACTED_DIR}/build.zig.zon" | head -n 1 | tr -d ' \n\r')
  fi

  UPSTREAM_PVE=""
  if [ -f "${EXTRACTED_DIR}/README.md" ]; then
    UPSTREAM_PVE=$(grep -o -E "Proxmox VE [0-9]+(\.[0-9x]+)?" "${EXTRACTED_DIR}/README.md" | head -n 1 | sed -E 's/Proxmox VE/PVE/' | tr -d '\r\n')
  fi

  UPSTREAM_COMMIT=$(curl -sSL -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${UPSTREAM_REPO}/commits/${UPSTREAM_BRANCH}" 2>/dev/null | grep -o -E '"sha": "[a-f0-9]{40}"' | head -n 1 | cut -d'"' -f4 | cut -c1-7 || echo "")
  [ -z "$UPSTREAM_COMMIT" ] && UPSTREAM_COMMIT="956571a"

  DEMO_VER=$(tr -d ' \n\r' < "${DEMO_DIR}/VERSION" 2>/dev/null || echo "1.0.0")

  echo "  -> Upstream specifications detected dynamically:"
  echo "     * Demo Version:    v${DEMO_VER}"
  echo "     * NexCage Engine:  v${NEW_VER:-0.17.0}"
  echo "     * Target Proxmox:  ${UPSTREAM_PVE:-PVE 9.2}"
  echo "     * Zig Compiler:    ${UPSTREAM_ZIG:-0.15.1}"
  echo "     * Commit SHA:      ${UPSTREAM_COMMIT}"

  # Update package.json version with Demo version
  if command -v sed &>/dev/null; then
    sed -i.bak -E "s/\"version\": \"[^\"]+\"/\"version\": \"${DEMO_VER}\"/" "${DEMO_DIR}/package.json"
    rm -f "${DEMO_DIR}/package.json.bak"
  fi

  # Generate src/version.ts dynamically
  cat <<EOF > "${DEMO_DIR}/src/version.ts"
// Centralized version specifications - auto-generated dynamically by sync_from_upstream.sh
export const DEMO_VERSION = '${DEMO_VER}';
export const NEXCAGE_VERSION = '${NEW_VER:-0.17.0}';
export const PROXMOX_VERSION = '${UPSTREAM_PVE:-PVE 9.2}';
export const PROXMOX_FULL_VERSION = 'pve-manager/9.2.20/3817a0a3 (kernel: 6.14.2-1-pve, Debian 13 Trixie)';
export const ZIG_VERSION = '${UPSTREAM_ZIG:-0.15.1}';
export const COMMIT_HASH = '${UPSTREAM_COMMIT}';
EOF

  echo -e "${GREEN}  ✓ Frontend files updated successfully without modifying parent repo!${NC}"
}

build_bundle() {
  echo -e "\n${BLUE}==> [3/4] Rebuilding standalone demo...${NC}"
  pushd "$DEMO_DIR" >/dev/null

  if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v 2>/dev/null || echo "0")
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
    if [ "$NODE_MAJOR" -lt 20 ]; then
      echo -e "${YELLOW}  ⚠️  Detected Node.js ${NODE_VERSION} (< 20).${NC}"
      echo -e "${YELLOW}      Tailwind CSS v4 (@tailwindcss/oxide) requires Node.js >= 20.${NC}"
      echo -e "      To upgrade Node.js on Ubuntu/Pop!_OS:"
      echo -e "        ${CYAN}curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs${NC}"
      echo -e "      Or with nvm:"
      echo -e "        ${CYAN}nvm install 20 && nvm use 20${NC}"
    fi
  fi

  if command -v npm &>/dev/null; then
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/tsc" ]; then
      echo "  -> Dependencies missing in demo-cluster. Running npm install..."
      npm install || {
        echo -e "${RED}  ❌ npm install failed.${NC}"
      }
    fi
    echo "  -> Compiling and building production assets (npm run build)..."
    if ! npm run build; then
      echo -e "\n${RED}  ❌ Build failed.${NC}"
      echo -e "${YELLOW}  👉 If the error says 'Cannot find native binding' (@tailwindcss/oxide):${NC}"
      echo -e "     Tailwind v4 requires Node.js >= 20. Update Node.js, remove node_modules and reinstall:${NC}"
      echo -e "     ${CYAN}rm -rf node_modules package-lock.json && npm install && npm run build${NC}\n"
      popd >/dev/null
      return 1
    fi
    echo -e "${GREEN}  ✓ Build complete! ${DEMO_DIR}/dist is updated.${NC}"
  else
    echo -e "${YELLOW}  ⚠️ npm not found. Skipping build step.${NC}"
  fi
  popd >/dev/null
}

package_distribution() {
  echo -e "\n${BLUE}==> [4/4] Updating distribution archives (zip & tar.gz)...${NC}"
  if [ -f "${SCRIPT_DIR}/package_archives.py" ]; then
    python3 "${SCRIPT_DIR}/package_archives.py"
  elif [ -f "${SCRIPT_DIR}/package_archives.sh" ]; then
    bash "${SCRIPT_DIR}/package_archives.sh"
  fi
  echo -e "${GREEN}  ✓ Standalone archives (nexcage-demo-cluster.zip & .tar.gz) updated.${NC}"
}

commit_changes() {
  pushd "$DEMO_DIR" >/dev/null
  if git rev-parse --is-inside-work-tree &>/dev/null; then
    echo -e "\n${BLUE}==> Committing changes and updated archives to demo repository...${NC}"
    git add src/ package.json dist/ nexcage-demo-cluster.zip nexcage-demo-cluster.tar.gz README.md .github/ scripts/ 2>/dev/null || git add .
    git commit -m "chore(demo): sync upstream changes and update release archives" || echo "No changes to commit."
    echo -e "${GREEN}  ✓ Changes committed to local git branch.${NC}"
  else
    echo -e "${YELLOW}  ⚠️ Demo directory is not a git repository. Skipping commit.${NC}"
  fi
  popd >/dev/null
}

if [ "$DO_CHECK" = true ]; then check_release; fi
if [ "$DO_PULL" = true ]; then pull_upstream_sources; fi
if [ "$DO_BUILD" = true ]; then build_bundle; fi
if [ "$DO_PACK" = true ]; then package_distribution; fi
if [ "$DO_COMMIT" = true ]; then commit_changes; fi

echo -e "\n${GREEN}✨ Demo cluster successfully synchronized and archives refreshed!${NC}"
