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

Flags available:
- `./scripts/sync_from_upstream.sh --check` — Only checks if upstream has a newer release.
- `./scripts/sync_from_upstream.sh --pull`  — Downloads and updates frontend components directly from `CageForge/nexcage:main`.
- `./scripts/sync_from_upstream.sh --build` — Verifies production build.

---

## 📄 License
Licensed under Apache License 2.0.
