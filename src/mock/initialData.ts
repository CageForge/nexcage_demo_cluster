import { Container, TemplateImage, ClusterNode, StoragePool, NexCageConfig } from '../types/nexcage';
import { PROXMOX_VERSION, PROXMOX_FULL_VERSION, COMMIT_HASH } from '../version';

export const initialContainers: Container[] = [
  {
    vmid: 100,
    name: 'web-1',
    node: 'mgr',
    backend: 'proxmox-lxc',
    status: 'running',
    image: 'local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst',
    command: 'pct',
    created: '2026-10-04T14:32:10Z',
    pid: 142857,
    ip: '10.0.10.15',
    memoryMb: 2048,
    cpuCores: 2,
    storage: 'local-lvm',
    rootfsSizeGb: 8,
    unprivileged: true,
    snapshots: ['clean-state', 'before-upgrade'],
    logs: [
      '[systemd] Starting Container Init...',
      '[systemd] Reached target System Initialization.',
      '[nginx] Starting A high performance web server and a reverse proxy server...',
      '[nginx] Started A high performance web server.',
      'Active and listening on 10.0.10.15:80'
    ]
  },
  {
    vmid: 101,
    name: 'db-postgres',
    node: 'mgr',
    backend: 'proxmox-lxc',
    status: 'running',
    image: 'local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst',
    command: 'pct',
    created: '2026-10-04T15:10:00Z',
    pid: 143219,
    ip: '10.0.10.20',
    memoryMb: 4096,
    cpuCores: 4,
    storage: 'rpool/lxc',
    rootfsSizeGb: 32,
    unprivileged: true,
    snapshots: ['initial-seed'],
    logs: [
      '[postgres] PostgreSQL 16.4 database server initialized.',
      '[postgres] accepting connections at port 5432'
    ]
  },
  {
    vmid: 200,
    name: 'web-2',
    node: 'titan',
    backend: 'proxmox-lxc',
    status: 'running',
    image: 'shared-rdma:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst',
    command: 'pct',
    created: '2026-10-05T09:12:44Z',
    pid: 89402,
    ip: '10.0.10.16',
    memoryMb: 2048,
    cpuCores: 2,
    storage: 'shared-rdma',
    rootfsSizeGb: 8,
    unprivileged: true,
    snapshots: [],
    logs: [
      '[systemd] Started Application web server replica 2.',
      'Active and listening on 10.0.10.16:80'
    ]
  },
  {
    vmid: 102,
    name: 'redis-cache',
    node: 'mgr',
    backend: 'proxmox-lxc',
    status: 'stopped',
    image: 'shared-rdma:vztmpl/redis_7.tar',
    command: 'pct',
    created: '2026-10-05T18:44:00Z',
    pid: 0,
    ip: '10.0.10.25',
    memoryMb: 1024,
    cpuCores: 1,
    storage: 'local-lvm',
    rootfsSizeGb: 4,
    unprivileged: true,
    snapshots: ['before-stop'],
    logs: [
      '[redis] Received SIGTERM signal, saving DB...',
      '[redis] DB saved on disk',
      '[systemd] Container stopped gracefully.'
    ]
  },
  {
    vmid: 105,
    name: 'cilium-agent',
    node: 'mgr',
    backend: 'crun',
    status: 'running',
    image: 'quay.io/cilium/cilium:v1.16.1',
    command: 'cilium-agent --kvstore=etcd',
    created: '2026-10-05T20:15:33Z',
    pid: 159932,
    ip: '10.0.10.99',
    memoryMb: 1024,
    cpuCores: 2,
    storage: 'local-lvm',
    rootfsSizeGb: 5,
    unprivileged: false,
    snapshots: [],
    logs: [
      'level=info msg="Initializing Cilium daemon" subsys=daemon',
      'level=info msg="BPF filesystem mounted at /sys/fs/bpf" subsys=bpf',
      'level=info msg="Daemon successfully started" subsys=daemon'
    ]
  },
  {
    vmid: 205,
    name: 'kube-ovn-cni',
    node: 'titan',
    backend: 'crun',
    status: 'paused',
    image: 'docker.io/kubeovn/kube-ovn:v1.12.0',
    command: 'kube-ovn-cni',
    created: '2026-10-05T22:01:10Z',
    pid: 92341,
    ip: '10.0.10.101',
    memoryMb: 512,
    cpuCores: 1,
    storage: 'shared-rdma',
    rootfsSizeGb: 4,
    unprivileged: false,
    snapshots: [],
    logs: [
      'kube-ovn: CNI plugin registered',
      'cgroup freezer: process frozen via nexcage pause'
    ]
  }
];

export const initialTemplates: TemplateImage[] = [
  {
    volid: 'local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst',
    storage: 'local',
    format: 'tar.zst',
    sizeMb: 128.4,
    node: 'mgr'
  },
  {
    volid: 'local:vztmpl/alpine-3.21-default_20250108_amd64.tar.xz',
    storage: 'local',
    format: 'tar.xz',
    sizeMb: 3.8,
    node: 'mgr'
  },
  {
    volid: 'shared-rdma:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst',
    storage: 'shared-rdma',
    format: 'tar.zst',
    sizeMb: 145.2,
    node: 'all'
  },
  {
    volid: 'shared-rdma:vztmpl/redis_7.tar',
    storage: 'shared-rdma',
    format: 'oci',
    sizeMb: 42.1,
    node: 'all'
  }
];

export const initialNodes: ClusterNode[] = [
  {
    name: 'mgr',
    ip: '192.168.1.10',
    status: 'online',
    pveVersion: `pve-manager/9.2.20/3817a0a3 (${PROXMOX_VERSION}, kernel: 6.14.2-1-pve)`,
    cpuUsage: 18.4,
    memoryUsage: 42.6,
    storageUsage: 35.1,
    containersCount: 4,
    isCurrentHost: true
  },
  {
    name: 'titan',
    ip: '192.168.1.11',
    status: 'online',
    pveVersion: `pve-manager/9.2.20/3817a0a3 (${PROXMOX_VERSION}, kernel: 6.14.2-1-pve)`,
    cpuUsage: 27.8,
    memoryUsage: 61.2,
    storageUsage: 48.0,
    containersCount: 2,
    isCurrentHost: false
  },
  {
    name: 'prox-home',
    ip: '192.168.1.12',
    status: 'online',
    pveVersion: `pve-manager/9.2.20/3817a0a3 (${PROXMOX_VERSION}, kernel: 6.14.2-1-pve)`,
    cpuUsage: 8.1,
    memoryUsage: 22.0,
    storageUsage: 14.5,
    containersCount: 0,
    isCurrentHost: false
  }
];

export const initialStorages: StoragePool[] = [
  {
    id: 'local',
    type: 'dir',
    shared: false,
    content: ['vztmpl', 'iso', 'backup'],
    totalGb: 250,
    usedGb: 45
  },
  {
    id: 'local-lvm',
    type: 'lvmthin',
    shared: false,
    content: ['rootdir', 'images'],
    totalGb: 1800,
    usedGb: 420
  },
  {
    id: 'shared-rdma',
    type: 'nfs',
    shared: true,
    content: ['vztmpl', 'rootdir', 'images', 'snippets'],
    totalGb: 8000,
    usedGb: 2150
  },
  {
    id: 'rpool/lxc',
    type: 'zfspool',
    shared: false,
    content: ['rootdir'],
    totalGb: 3600,
    usedGb: 890
  }
];

export const initialConfig: NexCageConfig = {
  proxmox: {
    storage: 'local-lvm',
    rootfs_size_gb: 8,
    unprivileged: true,
    pct_path: '/usr/bin/pct',
    node: 'mgr',
    timeout: 30,
    legacy_api: {
      hosts: ['mgr.cp.if.ua'],
      port: 8006,
      token: 'root@pam!nexcage=a8385012-689e-4e3a-9e12-3286fbdc3822',
      node_cache_duration: 60
    }
  },
  runtime: {
    log_level: 'info',
    log_path: '/var/log/nexcage/runtime.log',
    root_path: '/var/lib/nexcage',
    terminal: false,
    routing: [
      {
        pattern: '^(kube-ovn-.*|cilium-.*)$',
        runtime: 'crun'
      },
      {
        pattern: '*',
        runtime: 'lxc'
      }
    ]
  },
  container_config: {
    default_container_type: 'lxc'
  },
  storage: {
    zfs_dataset: 'rpool/lxc',
    image_path: '/var/lib/nexcage/images'
  },
  network: {
    bridge: 'vmbr0',
    dns_servers: ['8.8.8.8', '8.8.4.4']
  }
};
