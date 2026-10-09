export type ContainerStatus = 'running' | 'stopped' | 'paused';
export type RuntimeBackend = 'proxmox-lxc' | 'crun';

export interface Container {
  vmid: number;
  name: string;
  node: string;
  backend: RuntimeBackend;
  status: ContainerStatus;
  image: string;
  command: string;
  created: string;
  pid: number;
  ip: string;
  memoryMb: number;
  cpuCores: number;
  storage: string;
  rootfsSizeGb: number;
  unprivileged: boolean;
  snapshots: string[];
  logs: string[];
}

export interface TemplateImage {
  volid: string;
  storage: string;
  format: string;
  sizeMb: number;
  node: string;
}

export interface ClusterNode {
  name: string;
  ip: string;
  status: 'online' | 'offline';
  pveVersion: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  containersCount: number;
  isCurrentHost: boolean;
}

export interface StoragePool {
  id: string;
  type: 'dir' | 'lvmthin' | 'zfspool' | 'nfs';
  shared: boolean;
  content: string[];
  totalGb: number;
  usedGb: number;
}

export interface RoutingRule {
  pattern: string;
  runtime: 'crun' | 'lxc';
}

export interface NexCageConfig {
  proxmox: {
    storage: string;
    rootfs_size_gb: number;
    unprivileged: boolean;
    pct_path: string;
    node: string;
    timeout: number;
    legacy_api: {
      hosts: string[];
      port: number;
      token: string;
      node_cache_duration: number;
    };
  };
  runtime: {
    log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    log_path: string;
    root_path: string;
    terminal: boolean;
    routing: RoutingRule[];
  };
  container_config: {
    default_container_type: 'lxc' | 'crun';
  };
  storage: {
    zfs_dataset: string;
    image_path: string;
  };
  network: {
    bridge: string;
    dns_servers: string[];
  };
}
