import React, { useState } from 'react';
import { X, Terminal, CornerDownLeft, AlertCircle, Play } from 'lucide-react';
import { Container } from '../types/nexcage';
import { nexcage } from '../services/nexcageEngine';

interface ExecModalProps {
  container: Container | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExecModal: React.FC<ExecModalProps> = ({ container, isOpen, onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; output: string; exitCode: number }>>([
    {
      cmd: 'hostname',
      output: container ? `${container.name}\n` : '',
      exitCode: 0,
    },
  ]);

  if (!isOpen || !container) return null;

  const isRemote = container.node !== 'mgr';

  const handleRunCommand = (cmdToRun: string) => {
    const cmd = cmdToRun.trim();
    if (!cmd) return;

    const res = nexcage.execContainer(container.name, cmd);
    setHistory((prev) => [
      ...prev,
      {
        cmd,
        output: res.exitCode === 0 ? res.stdout : res.stderr,
        exitCode: res.exitCode,
      },
    ]);
    setCommand('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunCommand(command);
  };

  const quickCommands = ['hostname', 'uptime', 'ip a', 'ps aux', 'cat /etc/os-release'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">pct exec: {container.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Node: {container.node}
                </span>
              </div>
              <p className="text-xs text-slate-400">Execute interactive commands in container environment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Remote Node Warning */}
        {isRemote && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-start gap-2.5 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Remote node constraint:</span> Container '{container.name}' is hosted on remote cluster node '{container.node}'. In NexCage architecture, <code className="text-amber-200">pct exec</code> attaches locally only. Run commands directly from node '{container.node}'.
            </div>
          </div>
        )}

        {/* Console output body */}
        <div className="flex-1 p-4 bg-slate-950 overflow-y-auto font-mono text-xs space-y-3">
          <div className="text-slate-500 pb-2 border-b border-slate-900">
            Connected to container {container.name} (VMID {container.vmid}) on {container.node} via {container.backend}
          </div>

          {history.map((entry, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-slate-500">root@{container.name}:~#</span>
                <span className="text-white font-medium">{entry.cmd}</span>
                {entry.exitCode !== 0 && (
                  <span className="ml-auto text-[10px] text-rose-400 px-1 rounded bg-rose-950/50 border border-rose-900">
                    exit {entry.exitCode}
                  </span>
                )}
              </div>
              <pre className={`pl-4 whitespace-pre-wrap ${entry.exitCode === 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                {entry.output || <span className="text-slate-600">(no output)</span>}
              </pre>
            </div>
          ))}
        </div>

        {/* Quick presets */}
        {!isRemote && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 shrink-0">Quick run:</span>
            {quickCommands.map((qc) => (
              <button
                key={qc}
                type="button"
                onClick={() => handleRunCommand(qc)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] shrink-0 transition"
              >
                {qc}
              </button>
            ))}
          </div>
        )}

        {/* Input prompt */}
        {!isRemote ? (
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
            <span className="text-slate-400 text-xs font-mono pl-2">#</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Type command inside container (e.g. ls -la /var/log, df -h)..."
              className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-medium flex items-center gap-1"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              Exec
            </button>
          </form>
        ) : (
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-500">
            Interactive exec disabled for remote node '{container.node}'.
          </div>
        )}
      </div>
    </div>
  );
};
