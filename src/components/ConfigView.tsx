import React, { useState } from 'react';
import { Settings, Plus, Trash2, CheckCircle2, Save, FileCode, Route, Server, Shield } from 'lucide-react';
import { NexCageConfig, RoutingRule } from '../types/nexcage';
import { nexcage } from '../services/nexcageEngine';

interface ConfigViewProps {
  onSaved: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ onSaved }) => {
  const [config, setConfig] = useState<NexCageConfig>(nexcage.getConfig());
  const [newPattern, setNewPattern] = useState('');
  const [newRuntime, setNewRuntime] = useState<'crun' | 'lxc'>('crun');
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;
    const updated = { ...config };
    // Insert before the catch-all '*' rule
    const catchAllIndex = updated.runtime.routing.findIndex((r) => r.pattern === '*');
    if (catchAllIndex !== -1) {
      updated.runtime.routing.splice(catchAllIndex, 0, {
        pattern: newPattern.trim(),
        runtime: newRuntime,
      });
    } else {
      updated.runtime.routing.push({
        pattern: newPattern.trim(),
        runtime: newRuntime,
      });
    }
    setConfig(updated);
    setNewPattern('');
  };

  const handleDeleteRule = (idx: number) => {
    const updated = { ...config };
    updated.runtime.routing.splice(idx, 1);
    setConfig(updated);
  };

  const handleSave = () => {
    nexcage.updateConfig(config);
    setNotice('Configuration saved to /etc/nexcage/config.json and runtime updated!');
    setTimeout(() => setNotice(null), 4000);
    onSaved();
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3.5 rounded-xl text-xs font-mono flex items-center justify-between border bg-emerald-950/90 border-emerald-700/80 text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Backend Routing Rules Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">OCI Runtime Routing Rules</h3>
              <p className="text-xs text-slate-400">
                Determines whether a container runs via standard Proxmox LXC or libcrun backend
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 border border-cyan-800 rounded">
            libcrun enabled
          </span>
        </div>

        {/* Existing rules table */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Pattern (RegEx / Wildcard)</th>
                <th className="py-2.5 px-4">Target Runtime</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {config.runtime.routing.map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30">
                  <td className="py-2.5 px-4 text-cyan-300 font-semibold">{rule.pattern}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        rule.runtime === 'crun'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {rule.runtime}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {rule.pattern === '*'
                      ? 'Default fallback for unrouted containers'
                      : 'Matches container name regex'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {rule.pattern !== '*' ? (
                      <button
                        onClick={() => handleDeleteRule(idx)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                        title="Remove rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600">fallback</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add new routing rule form */}
        <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="e.g. ^(gpu-.*|ai-model-.*)$ or redis-*"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <select
            value={newRuntime}
            onChange={(e) => setNewRuntime(e.target.value as 'crun' | 'lxc')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="crun">Target: crun (OCI)</option>
            <option value="lxc">Target: lxc (Proxmox)</option>
          </select>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </form>
      </div>

      {/* Proxmox VE Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Proxmox VE Cluster & Network Defaults</h3>
            <p className="text-xs text-slate-400">
              Host node parameters, storage backend, and Linux network bridge mapping
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Default Storage</label>
            <input
              type="text"
              value={config.proxmox.storage}
              onChange={(e) =>
                setConfig({
                  ...config,
                  proxmox: { ...config.proxmox, storage: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Primary Node</label>
            <input
              type="text"
              value={config.proxmox.node}
              onChange={(e) =>
                setConfig({
                  ...config,
                  proxmox: { ...config.proxmox, node: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Network Bridge</label>
            <input
              type="text"
              value={config.network.bridge}
              onChange={(e) =>
                setConfig({
                  ...config,
                  network: { ...config.network, bridge: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Rootfs Default Size (GB)</label>
            <input
              type="number"
              value={config.proxmox.rootfs_size_gb}
              onChange={(e) =>
                setConfig({
                  ...config,
                  proxmox: { ...config.proxmox, rootfs_size_gb: parseInt(e.target.value) || 8 },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">ZFS Dataset</label>
            <input
              type="text"
              value={config.storage.zfs_dataset}
              onChange={(e) =>
                setConfig({
                  ...config,
                  storage: { ...config.storage, zfs_dataset: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Log Level</label>
            <select
              value={config.runtime.log_level}
              onChange={(e) =>
                setConfig({
                  ...config,
                  runtime: {
                    ...config.runtime,
                    log_level: e.target.value as any,
                  },
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="trace">trace</option>
              <option value="debug">debug</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <Save className="w-3.5 h-3.5" />
            Save Configuration Changes
          </button>
        </div>
      </div>

      {/* JSON File Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Active config file: /etc/nexcage/config.json</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Synced</span>
        </div>
        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
};
