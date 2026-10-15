import React from 'react';
import { Server, Database, Activity, HardDrive, Cpu, ShieldCheck, Network, Layers } from 'lucide-react';
import { ClusterNode, StoragePool } from '../types/nexcage';

interface ClusterViewProps {
  nodes: ClusterNode[];
  storages: StoragePool[];
}

export const ClusterView: React.FC<ClusterViewProps> = ({ nodes, storages }) => {
  return (
    <div className="space-y-6">
      {/* Cluster Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Proxmox VE 9.2 Cluster: pve-cluster-primary</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Quorate (3/3 votes)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-xs font-mono hidden sm:inline-block">
                  Debian 13 (Trixie)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Connected via Proxmox VE 9.2 cluster API &amp; corosync 3.1 • Linux kernel 6.14.2-1-pve • nexcage multi-node daemon active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Corosync Ring 0: 192.168.1.0/24</span>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {nodes.map((node) => (
            <div
              key={node.name}
              className={`bg-slate-950 rounded-xl p-4 border transition-all ${
                node.isCurrentHost
                  ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="font-bold text-white text-sm font-mono">{node.name}</span>
                  {node.isCurrentHost && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                      local runner
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400">{node.ip}</span>
              </div>

              <div className="text-[11px] text-slate-500 font-mono mb-4 truncate" title={node.pveVersion}>
                {node.pveVersion}
              </div>

              {/* Resource Bars */}
              <div className="space-y-3 text-xs font-mono">
                {/* CPU */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" /> CPU Usage
                    </span>
                    <span className="text-white">{node.cpuUsage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all"
                      style={{ width: `${node.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" /> RAM Usage
                    </span>
                    <span className="text-white">{node.memoryUsage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full transition-all"
                      style={{ width: `${node.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-400" /> Local Storage
                    </span>
                    <span className="text-white">{node.storageUsage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${node.storageUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>Workloads on node:</span>
                <span className="text-white font-semibold">{node.containersCount} containers</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storages Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cluster Storage Pools</h3>
              <p className="text-xs text-slate-400">
                LVM-Thin, ZFS dataset pools, and shared RDMA/NFS storages for rootfs and templates
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">pvesm status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storages.map((s) => {
            const usagePercent = Math.round((s.usedGb / s.totalGb) * 100);
            return (
              <div key={s.id} className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-sm">{s.id}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.type}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  {s.shared ? (
                    <span className="text-emerald-400 text-[11px]">Shared across cluster</span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Node-local storage</span>
                  )}
                </div>

                {/* Usage meter */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Capacity</span>
                    <span className="text-slate-200">
                      {s.usedGb} / {s.totalGb} GB ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent > 80 ? 'bg-rose-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Content badges */}
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-900">
                  {s.content.map((c) => (
                    <span key={c} className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
