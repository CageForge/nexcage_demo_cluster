import React, { useState } from 'react';
import { X, Box, Server, Database, Cpu, HardDrive, Shield, Sparkles } from 'lucide-react';
import { nexcage } from '../services/nexcageEngine';
import { TemplateImage, ClusterNode, StoragePool, RuntimeBackend } from '../types/nexcage';

interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateImage[];
  nodes: ClusterNode[];
  storages: StoragePool[];
  onCreated: (msg: string) => void;
}

export const CreateContainerModal: React.FC<CreateContainerModalProps> = ({
  isOpen,
  onClose,
  templates,
  nodes,
  storages,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [node, setNode] = useState('mgr');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.volid || '');
  const [customImage, setCustomImage] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [storage, setStorage] = useState('local-lvm');
  const [memoryMb, setMemoryMb] = useState(2048);
  const [cpuCores, setCpuCores] = useState(2);
  const [rootfsSizeGb, setRootfsSizeGb] = useState(8);
  const [unprivileged, setUnprivileged] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resolvedBackend: RuntimeBackend = nexcage.determineBackend(name || 'container');
  const isCrunRouted = resolvedBackend === 'crun';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetImage = useCustomImage ? customImage.trim() : selectedTemplate;
    if (!name.trim()) {
      setError('Please provide a container name');
      return;
    }
    if (!targetImage) {
      setError('Please select or specify a template image');
      return;
    }

    const res = nexcage.createContainer({
      name: name.trim(),
      image: targetImage,
      node,
      storage,
      memoryMb,
      cpuCores,
      rootfsSizeGb,
      unprivileged,
      backend: resolvedBackend,
    });

    if (res.exitCode !== 0) {
      setError(res.stderr || 'Failed to create container');
    } else {
      onCreated(res.stdout);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create New Container</h3>
              <p className="text-xs text-slate-400">Deploy an OCI container across the Proxmox VE cluster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Container Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Container Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. web-3, api-gateway, cilium-daemon"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
            {/* Real-time backend routing indicator */}
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Runtime Backend:</span>
              {isCrunRouted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-mono text-xs">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  crun (matched routing regex)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono text-xs">
                  proxmox-lxc (standard default)
                </span>
              )}
            </div>
          </div>

          {/* Cluster Node Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Node <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={node}
                  onChange={(e) => setNode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none font-mono"
                >
                  {nodes.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name} {n.isCurrentHost ? '(local host)' : '(cluster remote)'}
                    </option>
                  ))}
                </select>
                <Server className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Storage Pool <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none font-mono"
                >
                  {storages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.type}{s.shared ? ', shared' : ''})
                    </option>
                  ))}
                </select>
                <Database className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Template / Image Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Template Image <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomImage(!useCustomImage)}
                className="text-xs text-cyan-400 hover:underline"
              >
                {useCustomImage ? 'Select from installed templates' : 'Enter custom registry image'}
              </button>
            </div>

            {useCustomImage ? (
              <input
                type="text"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                placeholder="e.g. docker.io/library/redis:7 or quay.io/cilium/cilium:v1.16"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            ) : (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {templates.map((t) => (
                  <option key={t.volid} value={t.volid}>
                    {t.volid} ({t.sizeMb}MB)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Resources */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Cores
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={cpuCores}
                onChange={(e) => setCpuCores(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                RAM (MB)
              </label>
              <input
                type="number"
                min="256"
                step="256"
                max="65536"
                value={memoryMb}
                onChange={(e) => setMemoryMb(parseInt(e.target.value) || 1024)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Disk (GB)
              </label>
              <input
                type="number"
                min="2"
                max="500"
                value={rootfsSizeGb}
                onChange={(e) => setRootfsSizeGb(parseInt(e.target.value) || 8)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Unprivileged toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-medium text-white">Unprivileged Container</span>
                <p className="text-[11px] text-slate-400">Map UID/GID to non-root for enhanced host security</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={unprivileged}
                onChange={(e) => setUnprivileged(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Generated CLI preview */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-[11px] text-slate-500 font-mono block mb-1">Equivalent CLI invocation:</span>
            <code className="text-xs text-cyan-300 font-mono break-all">
              nexcage create --name {name || '&lt;name&gt;'} --node {node} --storage {storage}{' '}
              {useCustomImage ? (customImage || '&lt;image&gt;') : selectedTemplate}
            </code>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
            >
              Create Container
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
