# NexCage Demo Cluster (Standalone)

Standalone interactive Web UI & Cluster Simulator for **[NexCage](https://github.com/CageForge/nexcage)**.

This repository is **completely standalone** and isolated. It simulates the NexCage OCI runtime, node agents, Raft consensus, metrics streaming, container lifecycles, and logs without requiring root privileges or a Linux environment.

---

## 🚀 Quick Start

### Option 1: Run with Docker
```bash
docker build -t nexcage-demo .
docker run -p 3000:3000 nexcage-demo
```
Then open: **[http://localhost:3000](http://localhost:3000)**

### Option 2: Run with Node.js
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

### Option 3: Quick scripts
- **Linux / macOS**: `./run.sh`
- **Windows**: `run.bat`

---

## 🔄 Updating from Upstream (`CageForge/nexcage`)

All synchronization tools are contained entirely within this demo repository. **No changes to your fork or parent repository are required!**

### Automated Updates (GitHub Actions)
The workflow in `.github/workflows/check_upstream.yml` automatically:
1. Runs once a week (or manually via *Actions -> Run workflow*).
2. Checks [CageForge/nexcage releases](https://github.com/CageForge/nexcage/releases).
3. Opens a GitHub Issue in this repository if a newer release is published, complete with update instructions.

### Manual Update Script
Run the built-in update script directly inside this directory:
```bash
./scripts/sync_from_upstream.sh
```

This single command:
1. Checks for new upstream releases.
2. Pulls and updates the latest UI code from `CageForge/nexcage:main`.
3. Rebuilds production assets (`npm run build`).
4. **Automatically regenerates the standalone distribution archives** (`nexcage-demo-cluster.zip` and `nexcage-demo-cluster.tar.gz`).

Flags available:
- `./scripts/sync_from_upstream.sh --check` — Only checks if upstream has a newer release.
- `./scripts/sync_from_upstream.sh --pull`  — Downloads and updates frontend components directly from `CageForge/nexcage:main`.
- `./scripts/sync_from_upstream.sh --build` — Verifies production build.
- `./scripts/sync_from_upstream.sh --pack`  — Regenerates only the `.zip` and `.tar.gz` archives (also via `npm run pack`).
- `./scripts/sync_from_upstream.sh --commit` — Automatically commits updated files and archives to your demo git repository.

---

## 📦 Standalone Distribution Archives

Ready-to-use, zero-dependency archives are tracked directly in this repository:
- **`nexcage-demo-cluster.zip`** — for Windows, macOS, and Linux
- **`nexcage-demo-cluster.tar.gz`** — for Linux and macOS environments

To manually refresh the archives at any time without pulling from upstream:
```bash
npm run pack
# or
python3 scripts/package_archives.py
```

---

## 📄 License
Licensed under Apache License 2.0.
