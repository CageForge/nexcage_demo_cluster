import React, { useState } from 'react';
import { Layers, Download, Trash2, Database, HardDrive, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { TemplateImage, StoragePool } from '../types/nexcage';
import { nexcage } from '../services/nexcageEngine';

interface TemplatesViewProps {
  templates: TemplateImage[];
  storages: StoragePool[];
  onRefresh: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, storages, onRefresh }) => {
  const [imageRef, setImageRef] = useState('');
  const [targetStorage, setTargetStorage] = useState('shared-rdma');
  const [isPulling, setIsPulling] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePull = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageRef.trim()) return;

    setIsPulling(true);
    setTimeout(() => {
      const res = nexcage.pullImage(imageRef.trim(), targetStorage);
      setIsPulling(false);
      if (res.exitCode === 0) {
        showNotice(res.stdout);
        setImageRef('');
        onRefresh();
      } else {
        showNotice(res.stderr, 'error');
      }
    }, 600);
  };

  const handleRmi = (volid: string) => {
    if (window.confirm(`Delete template volume '${volid}' from storage?`)) {
      const res = nexcage.removeImage(volid);
      if (res.exitCode === 0) {
        showNotice(res.stdout);
        onRefresh();
      } else {
        showNotice(res.stderr, 'error');
      }
    }
  };

  const popularImages = [
    'docker.io/library/alpine:latest',
    'docker.io/library/debian:13-slim',
    'docker.io/library/ubuntu:24.04',
    'docker.io/library/redis:7-alpine',
    'docker.io/library/nginx:alpine',
  ];

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="whitespace-pre-wrap">{notice.msg}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white pl-4">
            ✕
          </button>
        </div>
      )}

      {/* Pull Image Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Pull OCI Registry Image</h3>
            <p className="text-xs text-slate-400">
              Download from Docker Hub, Quay, or OCI registry and convert into Proxmox VE template
            </p>
          </div>
        </div>

        <form onSubmit={handlePull} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Image Reference</label>
              <input
                type="text"
                value={imageRef}
                onChange={(e) => setImageRef(e.target.value)}
                placeholder="docker.io/library/redis:7 or quay.io/cilium/cilium:v1.16"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Storage Pool</label>
              <select
                value={targetStorage}
                onChange={(e) => setTargetStorage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {storages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({s.type}{s.shared ? ', shared across nodes' : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px]">Quick pull suggestions:</span>
            {popularImages.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => setImageRef(img)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
              >
                {img.replace('docker.io/library/', '')}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPulling}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
            >
              {isPulling ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Pulling Layers...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Pull Template (nexcage pull)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Available Templates List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Installed Container Templates</h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
              {templates.length} volumes
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">nexcage images</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Volume ID (VolID)</th>
                <th className="py-3 px-4 font-semibold">Storage</th>
                <th className="py-3 px-4 font-semibold">Format</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Node Availability</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {templates.map((tpl) => (
                <tr key={tpl.volid} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-white font-medium break-all">
                    {tpl.volid}
                  </td>
                  <td className="py-3 px-4 text-cyan-400">{tpl.storage}</td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {tpl.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{tpl.sizeMb} MB</td>
                  <td className="py-3 px-4 text-slate-400">
                    {tpl.node === 'all' ? (
                      <span className="text-emerald-400">All nodes (shared storage)</span>
                    ) : (
                      <span>Node: {tpl.node}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRmi(tpl.volid)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove template (nexcage rmi)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
