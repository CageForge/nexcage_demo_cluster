# NexCage Demo Cluster 📦

[![Deploy to GitHub Pages](https://github.com/IhorTelepenko/Nexcage_demo_cluster/actions/workflows/deploy.yml/badge.svg)](https://github.com/IhorTelepenko/Nexcage_demo_cluster/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?logo=github)](https://ihortelepenko.github.io/Nexcage_demo_cluster/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An interactive, zero-dependency web control panel demonstrating **[NexCage](https://github.com/CageForge/nexcage)** — the OCI container runtime and orchestration manager for Proxmox VE clusters.

> **Live Demo:** Try it directly in your browser without installing anything:  
> 👉 **[https://ihortelepenko.github.io/Nexcage_demo_cluster/](https://ihortelepenko.github.io/Nexcage_demo_cluster/)**

---

## ✨ Features Demonstrated

- **Multi-Node Container Lifecycle**:
  - Full container orchestration (`create`, `start`, `stop`, `pause`, `resume`, `kill`, `delete`, `update limits`) across cluster nodes (`mgr`, `titan`, `prox-home`).
  - **Quick Actions Menu**: 1-click start, stop, restart, and freeze directly from each row without entering modals.
- **Dual Runtime Routing Engine**:
  - Automatically routes workloads between standard `proxmox-lxc` and `crun` (OCI) using regex patterns (e.g. `^(kube-ovn-.*|cilium-.*)$` → `crun`, `*` → `lxc`).
- **OCI Runtime Spec v1.1.0 Inspector**:
  - Live inspection of `nexcage state <container>` producing compliant OCI State JSON with node annotations.
- **In-Browser Container Shell (`pct exec`)**:
  - Interactive console honoring local vs. remote cluster node constraints.
- **Storage & Template Registry**:
  - Template manager (`nexcage images`), pulling OCI images (`nexcage pull`), and removing volume templates (`nexcage rmi`).
- **Cluster & Storage Topology**:
  - Corosync quorum status, cluster nodes health, and storage pools utilization (LVM-Thin, ZFS, shared RDMA/NFS).
- **Interactive CLI Terminal**:
  - Terminal emulator supporting authentic `nexcage` commands (`list`, `start`, `stop`, `state`, `health`, `features`, `--help`, etc.).
- **Subsystem Diagnostics**:
  - Real-time health inspector verifying Proxmox VE tools (`pct`, `pvesh`, `pvesm`), ZFS datasets, and libcrun subsystem.

---

## 🚀 Quick Start

### Option 1: One-Click Local Launcher (Zero Dependencies)

If you downloaded the repository or archive, you can run it immediately using Python (pre-installed on Linux and macOS):

```bash
# On Linux / macOS:
./run.sh

# On Windows:
run.bat
```
Then open `http://localhost:3000` in your web browser.

---

### Option 2: Docker Container (~15 MB)

Run the self-contained lightweight Nginx container:

```bash
docker build -t nexcage-demo-cluster .
docker run -d -p 3000:80 --name nexcage-demo nexcage-demo-cluster
```
Visit `http://localhost:3000`.

---

### Option 3: Development Mode (Vite + React)

For developers who want to modify or extend the interface:

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 🌐 Automatic GitHub Pages Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`).

To enable the live demo on your fork or repository:
1. Push this code to the `main` branch:
   ```bash
   git add .
   git commit -m "Initial commit of NexCage demo cluster"
   git push origin main
   ```
2. In your GitHub repository settings:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Once the action finishes, your demo will be live at:
   `https://<your-username>.github.io/Nexcage_demo_cluster/`

---

## 📄 License

Licensed under the Apache License 2.0.
