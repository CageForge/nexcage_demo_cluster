import React, { useState } from 'react';
import {
  Play,
  Square,
  Pause,
  PlayCircle,
  Skull,
  Trash2,
  Terminal,
  Code,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
  RotateCw,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { Container, TemplateImage, ClusterNode, StoragePool } from '../types/nexcage';
import { nexcage } from '../services/nexcageEngine';
import { CreateContainerModal } from './CreateContainerModal';
import { ContainerDetailsModal } from './ContainerDetailsModal';
import { ExecModal } from './ExecModal';

interface ContainersViewProps {
  containers: Container[];
  templates: TemplateImage[];
  nodes: ClusterNode[];
  storages: StoragePool[];
  onRefresh: () => void;
}

export const ContainersView: React.FC<ContainersViewProps> = ({
  containers,
  templates,
  nodes,
  storages,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [backendFilter, setBackendFilter] = useState('all');

  const [activeMenuVmid, setActiveMenuVmid] = useState<number | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [execContainer, setExecContainer] = useState<Container | null>(null);
  const [isExecOpen, setIsExecOpen] = useState(false);

  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Actions
  const handleStart = (name: string) => {
    const res = nexcage.startContainer(name);
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Container ${name} started`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handleStop = (name: string) => {
    const res = nexcage.stopContainer(name);
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Container ${name} stopped`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handleRestart = (name: string) => {
    const res = nexcage.restartContainer(name);
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Container ${name} restarted`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handlePause = (name: string) => {
    const res = nexcage.pauseContainer(name);
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Container ${name} paused`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handleResume = (name: string) => {
    const res = nexcage.resumeContainer(name);
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Container ${name} resumed`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handleKill = (name: string) => {
    const res = nexcage.killContainer(name, 'SIGKILL');
    if (res.exitCode === 0) {
      showNotice(res.stdout || `Killed container ${name}`);
      onRefresh();
    } else {
      showNotice(res.stderr, 'error');
    }
  };

  const handleDelete = (name: string, isRunning: boolean) => {
    if (window.confirm(`Are you sure you want to delete container '${name}'? This destroys its rootfs.`)) {
      const res = nexcage.deleteContainer(name, isRunning);
      if (res.exitCode === 0) {
        showNotice(res.stdout || `Container ${name} deleted`);
        onRefresh();
      } else {
        showNotice(res.stderr, 'error');
      }
    }
  };

  // Filtering
  const filteredContainers = containers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      String(c.vmid).includes(search) ||
      c.ip.includes(search);
    const matchNode = nodeFilter === 'all' || c.node === nodeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchBackend = backendFilter === 'all' || c.backend === backendFilter;
    return matchSearch && matchNode && matchStatus && matchBackend;
  });

  const runningCount = containers.filter((c) => c.status === 'running').length;
  const pausedCount = containers.filter((c) => c.status === 'paused').length;
  const stoppedCount = containers.filter((c) => c.status === 'stopped').length;
  const totalRamGb = (containers.reduce((acc, c) => acc + c.memoryMb, 0) / 1024).toFixed(1);
  const totalCores = containers.reduce((acc, c) => acc + c.cpuCores, 0);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between shadow-lg border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white pl-4">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Running Workloads</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{runningCount}</span>
            <span className="text-xs text-slate-500">/ {containers.length} total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex gap-2">
            <span>{pausedCount} paused</span>
            <span>•</span>
            <span>{stoppedCount} stopped</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Allocated RAM</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">{totalRamGb} GB</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Across cluster hosts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Assigned Cores</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-purple-400 font-mono">{totalCores}</span>
            <span className="text-xs text-slate-500">vCPUs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">LXC & crun cgroups</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Proxmox Cluster Nodes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white font-mono">{nodes.length}</span>
            <span className="text-xs text-emerald-400 font-mono">Quorum OK</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">mgr (local), titan, prox-home</div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, VMID, IP..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Node filter */}
          <select
            value={nodeFilter}
            onChange={(e) => setNodeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Nodes</option>
            {nodes.map((n) => (
              <option key={n.name} value={n.name}>
                Node: {n.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
          </select>

          {/* Backend filter */}
          <select
            value={backendFilter}
            onChange={(e) => setBackendFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Backends</option>
            <option value="proxmox-lxc">proxmox-lxc</option>
            <option value="crun">crun (OCI)</option>
          </select>
        </div>

        {/* Create Container Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold rounded-lg shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Container</span>
        </button>
      </div>

      {/* Containers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">ID / Name</th>
                <th className="py-3.5 px-4 font-semibold">Cluster Node</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Backend</th>
                <th className="py-3.5 px-4 font-semibold">Resources</th>
                <th className="py-3.5 px-4 font-semibold">Network IP</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredContainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No containers match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredContainers.map((container) => {
                  const isRunning = container.status === 'running';
                  const isPaused = container.status === 'paused';
                  const isStopped = container.status === 'stopped';
                  const isLocal = container.node === 'mgr';

                  return (
                    <tr
                      key={container.vmid}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID / Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">#{container.vmid}</span>
                          <span className="font-semibold text-white text-sm tracking-tight">
                            {container.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[190px]" title={container.image}>
                          {container.image}
                        </div>
                      </td>

                      {/* Cluster Node */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-200">{container.node}</span>
                          {isLocal ? (
                            <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                              local
                            </span>
                          ) : (
                            <span className="text-[10px] px-1 rounded bg-slate-800/80 text-cyan-400 border border-cyan-900/50">
                              remote
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{container.storage}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isRunning && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            running
                          </span>
                        )}
                        {isPaused && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            paused
                          </span>
                        )}
                        {isStopped && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            stopped
                          </span>
                        )}
                      </td>

                      {/* Backend */}
                      <td className="py-3.5 px-4">
                        {container.backend === 'crun' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[11px]">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            crun
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[11px]">
                            proxmox-lxc
                          </span>
                        )}
                      </td>

                      {/* Resources */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>
                          {container.memoryMb} MB RAM • {container.cpuCores} CPU
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {container.rootfsSizeGb} GB rootfs
                        </div>
                      </td>

                      {/* Network IP */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">{container.ip}</span>
                        {isRunning && container.pid > 0 && (
                          <div className="text-[10px] text-slate-500">PID {container.pid}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Quick Actions Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuVmid(activeMenuVmid === container.vmid ? null : container.vmid);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 border shadow-sm ${
                                activeMenuVmid === container.vmid
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                              }`}
                              title="Open Quick Actions menu (Start, Stop, Restart)"
                            >
                              <Zap className="w-3 h-3 text-cyan-400" />
                              <span className="text-[11px]">Quick Actions</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>

                            {/* Dropdown Menu Popover */}
                            {activeMenuVmid === container.vmid && (
                              <>
                                {/* Click-away overlay */}
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveMenuVmid(null)}
                                />
                                <div
                                  className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 text-left font-sans text-xs divide-y divide-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Quick Controls</span>
                                    <span className="text-cyan-400">#{container.vmid}</span>
                                  </div>

                                  <div className="py-1 space-y-0.5">
                                    {/* Start */}
                                    <button
                                      disabled={isRunning}
                                      onClick={() => {
                                        setActiveMenuVmid(null);
                                        handleStart(container.name);
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-500/15 text-emerald-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                                    >
                                      <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <div>
                                        <div className="font-semibold text-xs leading-none">Start Container</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">pct start</div>
                                      </div>
                                    </button>

                                    {/* Stop */}
                                    <button
                                      disabled={isStopped}
                                      onClick={() => {
                                        setActiveMenuVmid(null);
                                        handleStop(container.name);
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-amber-500/15 text-amber-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                                    >
                                      <Square className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <div>
                                        <div className="font-semibold text-xs leading-none">Stop Container</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">pct stop (graceful)</div>
                                      </div>
                                    </button>

                                    {/* Restart */}
                                    <button
                                      onClick={() => {
                                        setActiveMenuVmid(null);
                                        handleRestart(container.name);
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-cyan-500/15 text-cyan-300 transition"
                                    >
                                      <RotateCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                      <div>
                                        <div className="font-semibold text-xs leading-none">Restart Container</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">reboot & new pid</div>
                                      </div>
                                    </button>
                                  </div>

                                  {/* Secondary options in menu */}
                                  <div className="pt-1 space-y-0.5">
                                    {isRunning && (
                                      <button
                                        onClick={() => {
                                          setActiveMenuVmid(null);
                                          handlePause(container.name);
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-amber-500/15 text-amber-400 transition"
                                      >
                                        <Pause className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-xs">Freeze (cgroup pause)</span>
                                      </button>
                                    )}

                                    {isPaused && (
                                      <button
                                        onClick={() => {
                                          setActiveMenuVmid(null);
                                          handleResume(container.name);
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-500/15 text-emerald-400 transition"
                                      >
                                        <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-xs">Thaw (cgroup resume)</span>
                                      </button>
                                    )}

                                    {isRunning && isLocal && (
                                      <button
                                        onClick={() => {
                                          setActiveMenuVmid(null);
                                          handleKill(container.name);
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-rose-500/15 text-rose-400 transition"
                                      >
                                        <Skull className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-xs">Force Kill (SIGKILL)</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Direct 1-click Quick Buttons */}
                          {/* Start / Stop */}
                          {isStopped ? (
                            <button
                              onClick={() => handleStart(container.name)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                              title="Start container (pct start)"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStop(container.name)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Stop container gracefully (pct stop)"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 1-click Quick Restart Button */}
                          <button
                            onClick={() => handleRestart(container.name)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 transition"
                            title="Quick Restart (reboot container without modal)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Pause / Resume */}
                          {isRunning && (
                            <button
                              onClick={() => handlePause(container.name)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                              title="Pause container (cgroup freezer)"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isPaused && (
                            <button
                              onClick={() => handleResume(container.name)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                              title="Resume container (cgroup unfreeze)"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Kill (local only) */}
                          {isRunning && isLocal && (
                            <button
                              onClick={() => handleKill(container.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                              title="Send SIGKILL to container process"
                            >
                              <Skull className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Exec Console */}
                          <button
                            onClick={() => {
                              setExecContainer(container);
                              setIsExecOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                            title="Open pct exec console"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          {/* Inspect / State / Snapshots */}
                          <button
                            onClick={() => {
                              setSelectedContainer(container);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Inspect OCI State & Snapshots"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(container.name, isRunning)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete container"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateContainerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        templates={templates}
        nodes={nodes}
        storages={storages}
        onCreated={(msg) => {
          showNotice(msg);
          onRefresh();
        }}
      />

      <ContainerDetailsModal
        container={selectedContainer}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedContainer(null);
        }}
        onUpdated={onRefresh}
      />

      <ExecModal
        container={execContainer}
        isOpen={isExecOpen}
        onClose={() => {
          setIsExecOpen(false);
          setExecContainer(null);
        }}
      />
    </div>
  );
};
