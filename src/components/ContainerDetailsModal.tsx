import React, { useState } from 'react';
import { X, Code, Terminal, Camera, RefreshCw, Cpu, HardDrive, Trash2, Plus } from 'lucide-react';
import { Container } from '../types/nexcage';
import { nexcage } from '../services/nexcageEngine';

interface ContainerDetailsModalProps {
  container: Container | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ContainerDetailsModal: React.FC<ContainerDetailsModalProps> = ({
  container,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'oci' | 'logs' | 'snapshots' | 'limits'>('oci');
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [memInput, setMemInput] = useState(container?.memoryMb || 2048);
  const [cpuInput, setCpuInput] = useState(container?.cpuCores || 2);
  const [snapMsg, setSnapMsg] = useState('');

  if (!isOpen || !container) return null;

  const ociState = nexcage.getContainerState(container.name).stdout;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;
    const res = nexcage.createSnapshot(container.name, newSnapshotName.trim());
    if (res.exitCode === 0) {
      setNewSnapshotName('');
      setSnapMsg(`Snapshot created: ${newSnapshotName}`);
      onUpdated();
    } else {
      setSnapMsg(`Error: ${res.stderr}`);
    }
  };

  const handleDeleteSnapshot = (snap: string) => {
    const res = nexcage.deleteSnapshot(container.name, snap);
    if (res.exitCode === 0) {
      setSnapMsg(`Snapshot deleted: ${snap}`);
      onUpdated();
    }
  };

  const handleUpdateLimits = (e: React.FormEvent) => {
    e.preventDefault();
    const res = nexcage.updateContainer(container.name, {
      memoryMb: memInput,
      cpuCores: cpuInput,
    });
    if (res.exitCode === 0) {
      setSnapMsg(`Resource limits updated!`);
      onUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{container.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                VMID {container.vmid}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                container.status === 'running'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : container.status === 'paused'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {container.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Node: {container.node} | Backend: {container.backend} | IP: {container.ip}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('oci')}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'oci'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            OCI State JSON
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Container Logs
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'snapshots'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Snapshots ({container.snapshots.length})
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'limits'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Update Limits
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          {snapMsg && (
            <div className="mb-4 p-2 bg-slate-800/80 border border-slate-700 text-cyan-300 rounded text-xs flex justify-between items-center">
              <span>{snapMsg}</span>
              <button onClick={() => setSnapMsg('')} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {activeTab === 'oci' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>OCI Runtime Spec v1.1.0 formatted state</span>
                <span>pct & libcrun compliant</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 overflow-x-auto leading-relaxed">
                {ociState}
              </pre>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-slate-400 text-[11px]">Recent system and runtime log lines:</div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1.5 overflow-x-auto">
                {container.logs.length === 0 ? (
                  <span className="text-slate-500 italic">No logs available for this container</span>
                ) : (
                  container.logs.map((line, idx) => (
                    <div key={idx} className="leading-snug text-[11.5px] border-l-2 border-cyan-500/30 pl-2">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Snapshot name (e.g. before-update)"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-cyan-500 text-slate-950 font-medium rounded-lg hover:bg-cyan-400 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Take Snapshot
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold">Existing Snapshots (Storage: {container.storage})</h4>
                {container.snapshots.length === 0 ? (
                  <p className="text-slate-500 italic p-4 bg-slate-950 rounded-xl border border-slate-800">
                    No snapshots taken yet. Snapshots leverage ZFS datasets or LVM-thin volume snapshots.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {container.snapshots.map((snap) => (
                      <div
                        key={snap}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-cyan-400" />
                          <span className="font-semibold">{snap}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSnapshot(snap)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                          title="Delete Snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <form onSubmit={handleUpdateLimits} className="space-y-4">
              <p className="text-slate-400 text-xs">
                Dynamically adjust container resource limits via libcrun or <code className="text-cyan-300">pct set</code>:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs mb-1">RAM (MB)</label>
                  <input
                    type="number"
                    min="256"
                    step="256"
                    value={memInput}
                    onChange={(e) => setMemInput(parseInt(e.target.value) || 1024)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs mb-1">CPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={cpuInput}
                    onChange={(e) => setCpuInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-medium rounded-lg hover:bg-cyan-400 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Apply Limits Update
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
