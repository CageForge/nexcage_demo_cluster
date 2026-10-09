import React, { useState } from 'react';
import { Activity, ShieldCheck, CheckCircle2, RefreshCw, Cpu, Layers, HardDrive, Terminal } from 'lucide-react';
import { nexcage } from '../services/nexcageEngine';

export const HealthCheckView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('Just now');
  const [output, setOutput] = useState<string>(nexcage.runHealthCheck().stdout);

  const featuresJson = nexcage.executeCli('nexcage features').stdout;

  const handleRunDiagnostics = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = nexcage.runHealthCheck();
      setOutput(res.stdout);
      setLastCheck(new Date().toLocaleTimeString());
      setIsRunning(false);
    }, 500);
  };

  const checkItems = [
    { title: 'Proxmox VE Host Tooling', detail: '/usr/bin/pct, /usr/bin/pvesh, /usr/bin/pvesm operational', status: 'pass' },
    { title: 'Cluster Corosync & Quorum', detail: '3 nodes online, quorum valid (votes: 3)', status: 'pass' },
    { title: 'libcrun OCI Subsystem', detail: 'Shared libraries libjson-c5, libseccomp2, libcap2 linked', status: 'pass' },
    { title: 'ZFS Dataset Driver', detail: 'Pool rpool/lxc online, snapshots supported', status: 'pass' },
    { title: 'Cgroup v2 Freezer', detail: 'Unified cgroup hierarchy mounted at /sys/fs/cgroup', status: 'pass' },
    { title: 'OCI Runtime Spec Compliance', detail: 'v1.1.0 specifications validated', status: 'pass' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">NexCage Subsystem Health &amp; Diagnostics</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-mono">
                  ALL OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifies cluster API connectivity, binary execution, libcrun backend, and OCI spec interfaces
              </p>
            </div>
          </div>
          <button
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Run Diagnostics (nexcage health)
          </button>
        </div>

        {/* Check Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-6">
          {checkItems.map((chk, idx) => (
            <div key={idx} className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-start gap-3">
              <div className="p-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{chk.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1 leading-snug">{chk.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostics Output Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Diagnostic Report (Last checked: {lastCheck})</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">exit 0</span>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Runtime Features (nexcage features)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">OCI 1.1.0</span>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 font-mono text-xs leading-relaxed overflow-x-auto">
            {featuresJson}
          </pre>
        </div>
      </div>
    </div>
  );
};
