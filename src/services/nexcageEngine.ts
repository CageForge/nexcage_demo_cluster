import { Container, TemplateImage, ClusterNode, StoragePool, NexCageConfig, ContainerStatus, RuntimeBackend } from '../types/nexcage';
import { initialContainers, initialTemplates, initialNodes, initialStorages, initialConfig } from '../mock/initialData';
import { DEMO_VERSION, NEXCAGE_VERSION, PROXMOX_VERSION, PROXMOX_FULL_VERSION, ZIG_VERSION, COMMIT_HASH } from '../version';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const STORAGE_KEY_CONTAINERS = 'nexcage_containers_v1';
const STORAGE_KEY_TEMPLATES = 'nexcage_templates_v1';
const STORAGE_KEY_CONFIG = 'nexcage_config_v1';

class NexCageEngine {
  private containers: Container[];
  private templates: TemplateImage[];
  private nodes: ClusterNode[];
  private storages: StoragePool[];
  private config: NexCageConfig;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.containers = this.loadFromStorage(STORAGE_KEY_CONTAINERS, initialContainers);
    this.templates = this.loadFromStorage(STORAGE_KEY_TEMPLATES, initialTemplates);
    this.nodes = initialNodes;
    this.storages = initialStorages;
    this.config = this.loadFromStorage(STORAGE_KEY_CONFIG, initialConfig);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return fallback;
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_CONTAINERS, JSON.stringify(this.containers));
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(this.templates));
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Getters
  public getContainers(): Container[] {
    return [...this.containers];
  }

  public getTemplates(): TemplateImage[] {
    return [...this.templates];
  }

  public getNodes(): ClusterNode[] {
    return [...this.nodes];
  }

  public getStorages(): StoragePool[] {
    return [...this.storages];
  }

  public getConfig(): NexCageConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  public updateConfig(newConfig: NexCageConfig) {
    this.config = newConfig;
    this.saveState();
  }

  // Backend router determination
  public determineBackend(name: string): RuntimeBackend {
    for (const rule of this.config.runtime.routing) {
      if (rule.pattern === '*') {
        return rule.runtime === 'crun' ? 'crun' : 'proxmox-lxc';
      }
      try {
        const regex = new RegExp(rule.pattern);
        if (regex.test(name)) {
          return rule.runtime === 'crun' ? 'crun' : 'proxmox-lxc';
        }
      } catch {
        // invalid regex skip
      }
    }
    return 'proxmox-lxc';
  }

  // Container Operations
  public startContainer(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found on cluster`, exitCode: 1 };
    }
    if (c.status === 'running') {
      return { stdout: '', stderr: `container '${c.name}' is already running`, exitCode: 0 };
    }
    c.status = 'running';
    if (!c.pid || c.pid === 0) {
      c.pid = Math.floor(100000 + Math.random() * 800000);
    }
    c.logs.push(`[${new Date().toISOString()}] Started container (vmid ${c.vmid}) on node ${c.node} via ${c.backend}`);
    this.saveState();
    return { stdout: `Container '${c.name}' (VMID ${c.vmid}) started successfully on node '${c.node}'\n`, stderr: '', exitCode: 0 };
  }

  public stopContainer(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.status === 'stopped') {
      return { stdout: '', stderr: `container '${c.name}' is already stopped`, exitCode: 0 };
    }
    c.status = 'stopped';
    c.pid = 0;
    c.logs.push(`[${new Date().toISOString()}] Container stopped gracefully`);
    this.saveState();
    return { stdout: `Container '${c.name}' (VMID ${c.vmid}) stopped\n`, stderr: '', exitCode: 0 };
  }

  public restartContainer(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    c.status = 'running';
    c.pid = Math.floor(100000 + Math.random() * 800000);
    c.logs.push(`[${new Date().toISOString()}] Container restarted (PID: ${c.pid})`);
    this.saveState();
    return { stdout: `Container '${c.name}' (VMID ${c.vmid}) restarted successfully on node '${c.node}'\n`, stderr: '', exitCode: 0 };
  }

  public pauseContainer(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.status !== 'running') {
      return { stdout: '', stderr: `error: container '${c.name}' is not running (status: ${c.status})`, exitCode: 1 };
    }
    c.status = 'paused';
    c.logs.push(`[${new Date().toISOString()}] Container frozen via cgroup freezer`);
    this.saveState();
    return { stdout: `Container '${c.name}' paused (cgroup frozen)\n`, stderr: '', exitCode: 0 };
  }

  public resumeContainer(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.status !== 'paused') {
      return { stdout: '', stderr: `error: container '${c.name}' is not paused (status: ${c.status})`, exitCode: 1 };
    }
    c.status = 'running';
    c.logs.push(`[${new Date().toISOString()}] Container thawed from cgroup freezer`);
    this.saveState();
    return { stdout: `Container '${c.name}' resumed\n`, stderr: '', exitCode: 0 };
  }

  public killContainer(nameOrVmid: string, signal = 'SIGTERM'): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.node !== 'mgr') {
      return {
        stdout: '',
        stderr: `error: cannot send signal to container on remote node '${c.node}'. kill must run locally on target host`,
        exitCode: 1
      };
    }
    if (c.status === 'stopped') {
      return { stdout: '', stderr: `error: cannot kill stopped container`, exitCode: 1 };
    }
    if (signal === 'SIGKILL' || signal === '9') {
      c.status = 'stopped';
      c.pid = 0;
      c.logs.push(`[${new Date().toISOString()}] Killed with SIGKILL`);
    } else {
      c.logs.push(`[${new Date().toISOString()}] Signal ${signal} sent to init process ${c.pid}`);
    }
    this.saveState();
    return { stdout: `Signal ${signal} sent to container '${c.name}' (pid ${c.pid})\n`, stderr: '', exitCode: 0 };
  }

  public deleteContainer(nameOrVmid: string, force = false): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.status === 'running' && !force) {
      return {
        stdout: '',
        stderr: `error: container '${c.name}' is running. Stop container first or use --force`,
        exitCode: 1
      };
    }
    this.containers = this.containers.filter(item => item.vmid !== c.vmid);
    this.saveState();
    return { stdout: `Container '${c.name}' (VMID ${c.vmid}) destroyed\n`, stderr: '', exitCode: 0 };
  }

  public createContainer(params: {
    name: string;
    image: string;
    node?: string;
    storage?: string;
    memoryMb?: number;
    cpuCores?: number;
    rootfsSizeGb?: number;
    unprivileged?: boolean;
    backend?: RuntimeBackend;
  }): CommandResult {
    if (!params.name || !params.image) {
      return { stdout: '', stderr: `error: container name and template/image are required`, exitCode: 2 };
    }
    if (this.findContainer(params.name)) {
      return { stdout: '', stderr: `error: container with name '${params.name}' already exists in cluster`, exitCode: 1 };
    }

    const targetNode = params.node || this.config.proxmox.node || 'mgr';
    const backend = params.backend || this.determineBackend(params.name);
    const vmid = this.generateNextVmid();

    const newContainer: Container = {
      vmid,
      name: params.name,
      node: targetNode,
      backend,
      status: 'stopped',
      image: params.image,
      command: backend === 'crun' ? '/bin/sh' : 'pct',
      created: new Date().toISOString(),
      pid: 0,
      ip: `10.0.10.${Math.floor(30 + Math.random() * 200)}`,
      memoryMb: params.memoryMb || 2048,
      cpuCores: params.cpuCores || 2,
      storage: params.storage || this.config.proxmox.storage || 'local-lvm',
      rootfsSizeGb: params.rootfsSizeGb || this.config.proxmox.rootfs_size_gb || 8,
      unprivileged: params.unprivileged !== undefined ? params.unprivileged : true,
      snapshots: [],
      logs: [
        `[${new Date().toISOString()}] Container ${params.name} created (VMID ${vmid}) on node ${targetNode}`,
        `[${new Date().toISOString()}] Rootfs provisioned on storage ${params.storage || 'local-lvm'} with ${params.memoryMb || 2048}MB RAM`
      ]
    };

    this.containers.push(newContainer);
    this.saveState();
    return {
      stdout: `Container '${params.name}' created with VMID ${vmid} on node '${targetNode}' [backend: ${backend}]\n`,
      stderr: '',
      exitCode: 0
    };
  }

  public updateContainer(nameOrVmid: string, updates: { memoryMb?: number; cpuCores?: number }): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (updates.memoryMb) c.memoryMb = updates.memoryMb;
    if (updates.cpuCores) c.cpuCores = updates.cpuCores;
    c.logs.push(`[${new Date().toISOString()}] Updated limits: Memory=${c.memoryMb}MB, Cores=${c.cpuCores}`);
    this.saveState();
    return {
      stdout: `Container '${c.name}' limits updated (memory: ${c.memoryMb}M, cores: ${c.cpuCores})\n`,
      stderr: '',
      exitCode: 0
    };
  }

  public createSnapshot(nameOrVmid: string, snapName: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (!snapName) {
      return { stdout: '', stderr: `error: snapshot name is required`, exitCode: 2 };
    }
    if (c.snapshots.includes(snapName)) {
      return { stdout: '', stderr: `error: snapshot '${snapName}' already exists for container '${c.name}'`, exitCode: 1 };
    }
    c.snapshots.push(snapName);
    c.logs.push(`[${new Date().toISOString()}] Created snapshot '${snapName}' via storage driver`);
    this.saveState();
    return { stdout: `Snapshot '${snapName}' created for container '${c.name}'\n`, stderr: '', exitCode: 0 };
  }

  public deleteSnapshot(nameOrVmid: string, snapName: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    c.snapshots = c.snapshots.filter(s => s !== snapName);
    c.logs.push(`[${new Date().toISOString()}] Deleted snapshot '${snapName}'`);
    this.saveState();
    return { stdout: `Snapshot '${snapName}' deleted for container '${c.name}'\n`, stderr: '', exitCode: 0 };
  }

  public execContainer(nameOrVmid: string, command: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }
    if (c.node !== 'mgr') {
      return {
        stdout: '',
        stderr: `error: cannot exec into container on remote node '${c.node}'. pct exec attaches locally only`,
        exitCode: 1
      };
    }
    if (c.status !== 'running') {
      return { stdout: '', stderr: `error: container '${c.name}' is not running`, exitCode: 1 };
    }

    // Simulate standard commands inside Linux containers
    const cmdTrimmed = command.trim();
    if (cmdTrimmed === 'hostname' || cmdTrimmed === 'uname -n') {
      return { stdout: `${c.name}\n`, stderr: '', exitCode: 0 };
    } else if (cmdTrimmed === 'uptime') {
      return { stdout: ` 00:45:00 up 2 days, 4:12, 1 user, load average: 0.14, 0.08, 0.05\n`, stderr: '', exitCode: 0 };
    } else if (cmdTrimmed.startsWith('ip a') || cmdTrimmed.startsWith('ifconfig')) {
      return {
        stdout: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0@if14: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet ${c.ip}/24 brd 10.0.10.255 scope global eth0\n`,
        stderr: '',
        exitCode: 0
      };
    } else if (cmdTrimmed.startsWith('echo ')) {
      return { stdout: `${cmdTrimmed.slice(5).replace(/^['"]|['"]$/g, '')}\n`, stderr: '', exitCode: 0 };
    } else if (cmdTrimmed === 'cat /etc/os-release') {
      return {
        stdout: `PRETTY_NAME="Debian GNU/Linux 13 (trixie)"\nNAME="Debian GNU/Linux"\nVERSION_ID="13"\nVERSION="13 (trixie)"\nID=debian\n`,
        stderr: '',
        exitCode: 0
      };
    } else if (cmdTrimmed === 'ps aux') {
      return {
        stdout: `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.1  21308 11488 ?        Ss   Oct04   0:02 /sbin/init\nroot          84  0.0  0.0  14500  4200 ?        Ss   Oct04   0:00 /lib/systemd/systemd-journald\nroot         110  0.1  0.3  84120 18900 ?        Ss   Oct04   0:15 /usr/sbin/nginx -g daemon off;\n`,
        stderr: '',
        exitCode: 0
      };
    }

    return {
      stdout: `[${c.name} ~]# ${command}\nExecuted command successfully.\n`,
      stderr: '',
      exitCode: 0
    };
  }

  public getContainerState(nameOrVmid: string): CommandResult {
    const c = this.findContainer(nameOrVmid);
    if (!c) {
      return { stdout: '', stderr: `error: container '${nameOrVmid}' not found`, exitCode: 1 };
    }

    const stateObj = {
      ociVersion: '1.1.0',
      id: c.name,
      status: c.status,
      pid: c.node === 'mgr' ? c.pid : 0,
      bundle: `/var/lib/nexcage/bundles/${c.name}`,
      annotations: {
        'io.cageforge.nexcage.node': c.node,
        'io.cageforge.nexcage.backend': c.backend,
        'io.cageforge.nexcage.vmid': String(c.vmid),
        'io.cageforge.nexcage.storage': c.storage,
        'io.cageforge.nexcage.ip': c.ip,
        'io.cageforge.nexcage.created': c.created
      }
    };

    return { stdout: JSON.stringify(stateObj, null, 2) + '\n', stderr: '', exitCode: 0 };
  }

  // Template Management
  public pullImage(imageRef: string, storage?: string): CommandResult {
    if (!imageRef) {
      return { stdout: '', stderr: `error: image reference required`, exitCode: 2 };
    }
    const targetStorage = storage || 'shared-rdma';
    const volid = `${targetStorage}:vztmpl/${imageRef.replace(/[:/]/g, '_')}.tar.zst`;
    
    // Check if already exists
    if (this.templates.some(t => t.volid === volid)) {
      return { stdout: `Template '${volid}' is already present\n`, stderr: '', exitCode: 0 };
    }

    this.templates.push({
      volid,
      storage: targetStorage,
      format: 'oci',
      sizeMb: Math.round(50 + Math.random() * 200 * 10) / 10,
      node: targetStorage === 'shared-rdma' ? 'all' : 'mgr'
    });
    this.saveState();

    return {
      stdout: `Pulling ${imageRef} via Proxmox OCI pull API...\nImporting layers to storage '${targetStorage}'...\nSaved template: ${volid}\n`,
      stderr: '',
      exitCode: 0
    };
  }

  public removeImage(volid: string): CommandResult {
    const existing = this.templates.find(t => t.volid === volid);
    if (!existing) {
      return { stdout: '', stderr: `error: volume '${volid}' does not exist on storage`, exitCode: 1 };
    }
    this.templates = this.templates.filter(t => t.volid !== volid);
    this.saveState();
    return { stdout: `Volume '${volid}' removed\n`, stderr: '', exitCode: 0 };
  }

  // CLI Command Interpreter
  public executeCli(rawCmd: string): CommandResult {
    const trimmed = rawCmd.trim();
    if (!trimmed) return { stdout: '', stderr: '', exitCode: 0 };

    if (trimmed === 'clear') {
      return { stdout: '\x1Bc', stderr: '', exitCode: 0 };
    }

    if (trimmed === 'pveversion') {
      return {
        stdout: `pve-manager/9.2.20/3817a0a3 (running kernel: 6.14.2-1-pve)\n`,
        stderr: '',
        exitCode: 0
      };
    }

    if (trimmed === 'pveversion -v' || trimmed === 'pveversion --verbose') {
      return {
        stdout: `proxmox-ve: 9.2.0 (running kernel: 6.14.2-1-pve)\npve-manager: 9.2.20 (running version: 9.2.20/3817a0a3)\nproxmox-kernel-helper: 9.0.1\npve-kernel-6.14: 6.14.2-1-pve\ncorosync: 3.1.9-pve1\ncri-o: 1.30.2\ncrun: 1.18.2\nlibcrun: 1.18.2\nqemu-server: 9.1.5\npve-firewall: 6.0.4\npve-ha-manager: 5.0.3\nzfsutils-linux: 2.3.2-pve1\n`,
        stderr: '',
        exitCode: 0
      };
    }

    // Strip leading "nexcage" if present
    const cmdLine = trimmed.startsWith('nexcage ') ? trimmed.slice(8).trim() : (trimmed === 'nexcage' ? '--help' : trimmed);
    const parts = this.tokenize(cmdLine);
    const command = parts[0];

    if (command === '--version' || command === '-v' || command === 'version') {
      return {
        stdout: `nexcage ${NEXCAGE_VERSION} (built with zig ${ZIG_VERSION}, crun backend enabled)\ndemo: v${DEMO_VERSION}\nhost: ${PROXMOX_FULL_VERSION}\ncommit: ${COMMIT_HASH} (2026-10-15)\n`,
        stderr: '',
        exitCode: 0
      };
    }

    if (command === '--help' || command === '-h' || command === 'help') {
      const sub = parts[1];
      return { stdout: this.getHelpText(sub), stderr: '', exitCode: 0 };
    }

    switch (command) {
      case 'list':
      case 'ps': {
        return this.formatListTable();
      }
      case 'start': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage start requires a container name or VMID', exitCode: 2 };
        return this.startContainer(parts[1]);
      }
      case 'stop': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage stop requires a container name or VMID', exitCode: 2 };
        return this.stopContainer(parts[1]);
      }
      case 'restart': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage restart requires a container name or VMID', exitCode: 2 };
        return this.restartContainer(parts[1]);
      }
      case 'pause': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage pause requires a container name or VMID', exitCode: 2 };
        return this.pauseContainer(parts[1]);
      }
      case 'resume': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage resume requires a container name or VMID', exitCode: 2 };
        return this.resumeContainer(parts[1]);
      }
      case 'kill': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage kill requires a container name or VMID', exitCode: 2 };
        const sigIdx = parts.indexOf('-s');
        const sig = sigIdx !== -1 && parts[sigIdx + 1] ? parts[sigIdx + 1] : 'SIGTERM';
        return this.killContainer(parts[1], sig);
      }
      case 'delete':
      case 'rm': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage delete requires a container name or VMID', exitCode: 2 };
        const force = parts.includes('--force') || parts.includes('-f');
        const target = parts.find(p => p !== 'delete' && p !== 'rm' && p !== '--force' && p !== '-f') || parts[1];
        return this.deleteContainer(target, force);
      }
      case 'state': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage state requires a container name or VMID', exitCode: 2 };
        return this.getContainerState(parts[1]);
      }
      case 'images': {
        return this.formatImagesTable();
      }
      case 'pull': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage pull requires an image reference (e.g. docker.io/library/redis:7)', exitCode: 2 };
        const storageIdx = parts.indexOf('--storage');
        const st = storageIdx !== -1 && parts[storageIdx + 1] ? parts[storageIdx + 1] : undefined;
        return this.pullImage(parts[1], st);
      }
      case 'rmi': {
        if (!parts[1]) return { stdout: '', stderr: 'nexcage rmi requires a volume ID', exitCode: 2 };
        return this.removeImage(parts[1]);
      }
      case 'create': {
        let name = '';
        let node: string | undefined;
        let storage: string | undefined;
        let image = '';
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '--name' && parts[i + 1]) {
            name = parts[i + 1];
            i++;
          } else if (parts[i] === '--node' && parts[i + 1]) {
            node = parts[i + 1];
            i++;
          } else if (parts[i] === '--storage' && parts[i + 1]) {
            storage = parts[i + 1];
            i++;
          } else if (!parts[i].startsWith('-')) {
            image = parts[i];
          }
        }
        if (!name || !image) {
          return { stdout: '', stderr: 'Usage: nexcage create --name <name> [--node <node>] [--storage <storage>] <image>', exitCode: 2 };
        }
        return this.createContainer({ name, image, node, storage });
      }
      case 'run': {
        let name = '';
        let image = '';
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '--name' && parts[i + 1]) {
            name = parts[i + 1];
            i++;
          } else if (!parts[i].startsWith('-')) {
            image = parts[i];
          }
        }
        if (!name || !image) {
          return { stdout: '', stderr: 'Usage: nexcage run --name <name> <image>', exitCode: 2 };
        }
        const createRes = this.createContainer({ name, image });
        if (createRes.exitCode !== 0) return createRes;
        const startRes = this.startContainer(name);
        return {
          stdout: createRes.stdout + startRes.stdout,
          stderr: startRes.stderr,
          exitCode: startRes.exitCode
        };
      }
      case 'exec': {
        if (!parts[1]) return { stdout: '', stderr: 'Usage: nexcage exec <container> -- <command>', exitCode: 2 };
        const splitIdx = parts.indexOf('--');
        const execCmd = splitIdx !== -1 ? parts.slice(splitIdx + 1).join(' ') : parts.slice(2).join(' ');
        if (!execCmd) return { stdout: '', stderr: 'error: no command specified after --', exitCode: 2 };
        return this.execContainer(parts[1], execCmd);
      }
      case 'snapshot': {
        if (!parts[1] || !parts[2]) {
          return { stdout: '', stderr: 'Usage: nexcage snapshot <container> <snapshot-name>', exitCode: 2 };
        }
        return this.createSnapshot(parts[1], parts[2]);
      }
      case 'health': {
        return this.runHealthCheck();
      }
      case 'features': {
        return {
          stdout: JSON.stringify({
            ociVersion: '1.1.0',
            cgroup: { v1: false, v2: true },
            mountExtensions: { idmap: true },
            annotations: {
              'io.cageforge.nexcage.features': 'cluster,crun,lxc,zfs,cgroup-v2',
              'io.cageforge.nexcage.version': '0.13.0'
            },
            linux: {
              namespaces: ['pid', 'network', 'mount', 'ipc', 'uts', 'cgroup', 'user'],
              seccomp: true,
              apparmor: true
            }
          }, null, 2) + '\n',
          stderr: '',
          exitCode: 0
        };
      }
      default:
        return {
          stdout: '',
          stderr: `nexcage: '${command}' is not a valid command. See 'nexcage --help'.\n`,
          exitCode: 2
        };
    }
  }

  private formatListTable(): CommandResult {
    let out = 'ID    IMAGE     COMMAND  CREATED   STATUS   BACKEND      NODE        NAMES\n';
    for (const c of this.containers) {
      const id = String(c.vmid).padEnd(6);
      const img = (c.image.length > 9 ? c.image.slice(0, 7) + '..' : c.image).padEnd(10);
      const cmd = (c.command.length > 8 ? c.command.slice(0, 6) + '..' : c.command).padEnd(9);
      const created = '2d ago'.padEnd(10);
      const status = c.status.padEnd(9);
      const backend = c.backend.padEnd(13);
      const node = c.node.padEnd(12);
      const name = c.name;
      out += `${id}${img}${cmd}${created}${status}${backend}${node}${name}\n`;
    }
    return { stdout: out, stderr: '', exitCode: 0 };
  }

  private formatImagesTable(): CommandResult {
    let out = 'STORAGE      FORMAT   SIZE     NODE   VOLID\n';
    for (const t of this.templates) {
      const st = t.storage.padEnd(13);
      const fmt = t.format.padEnd(9);
      const size = `${t.sizeMb}MB`.padEnd(9);
      const node = t.node.padEnd(7);
      out += `${st}${fmt}${size}${node}${t.volid}\n`;
    }
    return { stdout: out, stderr: '', exitCode: 0 };
  }

  public runHealthCheck(): CommandResult {
    let report = '=== NexCage Proxmox & OCI Health Report ===\n\n';
    report += `[OK] Cluster node local: mgr (${PROXMOX_FULL_VERSION})\n`;
    report += '[OK] pct tool: /usr/bin/pct exists, executable (exit 0)\n';
    report += '[OK] pvesh tool: /usr/bin/pvesh exists, cluster resources query OK (3 nodes online)\n';
    report += '[OK] pvesm tool: /usr/bin/pvesm storage status OK (local-lvm, shared-rdma accessible)\n';
    report += '[OK] libcrun OCI backend: /usr/lib/libcrun.so.1 loaded, seccomp & cap2 supported\n';
    report += '[OK] ZFS driver: zpool status healthy, dataset rpool/lxc ready\n';
    report += '[OK] Cgroup v2 unified hierarchy enabled\n';
    report += '\nStatus: ALL SUBSYSTEMS OPERATIONAL\n';
    return { stdout: report, stderr: '', exitCode: 0 };
  }

  private getHelpText(sub?: string): string {
    if (sub === 'create') {
      return `Usage: nexcage create [options] <image>\n\nCreate a new container in Proxmox VE from template or OCI image.\n\nOptions:\n  --name <name>       Name and hostname for container (required, must be unique across cluster)\n  --node <node>       Target cluster node (defaults to current host)\n  --storage <pool>    Storage pool for rootfs (default: local-lvm)\n  --bundle <path>     OCI runtime bundle directory\n`;
    }
    if (sub === 'state') {
      return `Usage: nexcage state <container-name|vmid>\n\nPrint OCI state JSON to stdout conforming to OCI Runtime Spec v1.1.0.\n`;
    }
    return `NexCage - An OCI runtime and container orchestration tool for Proxmox VE\n\nUsage: nexcage [--debug] [--log-level <level>] <command> [options]\n\nCommands:\n  list, ps          List containers across all cluster nodes\n  create            Create container from template or OCI bundle\n  run               Create and start container in one step\n  start             Start a stopped container\n  stop              Stop a running container\n  pause             Freeze container processes using cgroup freezer\n  resume            Thaw container processes\n  kill              Send signal to container process\n  delete, rm        Delete container and clean up rootfs\n  state             Output OCI state JSON\n  exec              Run command inside container (local node)\n  snapshot          Create filesystem snapshot\n  images            List container templates across storage pools\n  pull              Pull image from OCI registry to Proxmox template storage\n  rmi               Remove template image from storage\n  features          Output runtime features JSON\n  health            Run diagnostic checks against Proxmox & crun\n  version           Print nexcage version info\n`;
  }

  private findContainer(nameOrVmid: string): Container | undefined {
    return this.containers.find(
      c => c.name.toLowerCase() === nameOrVmid.toLowerCase() || String(c.vmid) === nameOrVmid
    );
  }

  private generateNextVmid(): number {
    const existing = new Set(this.containers.map(c => c.vmid));
    let vmid = 100;
    while (existing.has(vmid)) {
      vmid++;
    }
    return vmid;
  }

  private tokenize(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes: '"' | "'" | false = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inQuotes) {
        if (ch === inQuotes) {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"' || ch === "'") {
          inQuotes = ch;
        } else if (/\s/.test(ch)) {
          if (current.length > 0) {
            tokens.push(current);
            current = '';
          }
        } else {
          current += ch;
        }
      }
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
  }
}

export const nexcage = new NexCageEngine();
