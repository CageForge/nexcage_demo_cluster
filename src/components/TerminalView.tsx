import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, HelpCircle, Sparkles } from 'lucide-react';
import { nexcage } from '../services/nexcageEngine';

interface TerminalViewProps {
  onStateChange: () => void;
}

interface LogEntry {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ onStateChange }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<LogEntry[]>([
    {
      command: 'nexcage --version',
      stdout: 'nexcage 0.13.0 (built with zig 0.13.0, crun backend enabled)\ncommit: e8a261c (2026-10-06)\n',
      stderr: '',
      exitCode: 0,
    },
    {
      command: 'nexcage list',
      stdout: nexcage.executeCli('nexcage list').stdout,
      stderr: '',
      exitCode: 0,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const commandHistory = useRef<string[]>(['nexcage --version', 'nexcage list']);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    commandHistory.current.push(trimmed);
    setHistoryIndex(null);

    if (trimmed === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    const res = nexcage.executeCli(trimmed);
    setHistory((prev) => [
      ...prev,
      {
        command: trimmed,
        stdout: res.stdout,
        stderr: res.stderr,
        exitCode: res.exitCode,
      },
    ]);
    setInput('');
    onStateChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.current.length === 0) return;
      const nextIndex =
        historyIndex === null
          ? commandHistory.current.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory.current[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.current.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(commandHistory.current[nextIndex]);
      }
    }
  };

  const sampleCommands = [
    'nexcage list',
    'nexcage state web-1',
    'nexcage images',
    'nexcage health',
    'nexcage features',
    'nexcage start redis-cache',
    'nexcage pause web-1',
    'nexcage resume web-1',
    'nexcage exec web-1 -- hostname',
    'nexcage --help',
  ];

  return (
    <div className="space-y-4">
      {/* Quick Discovery Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Commands:
        </span>
        {sampleCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommand(cmd)}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-700/60 font-mono text-[11px] shrink-0 transition"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px] font-mono">
        {/* Terminal Titlebar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span className="text-xs text-slate-400 font-semibold ml-2">
              root@mgr:/run/nexcage (Proxmox OCI Host Console)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistory([])}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
              title="Clear terminal buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              clear
            </button>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Interactive TTY
            </span>
          </div>
        </div>

        {/* Scrollable output area */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 overflow-y-auto space-y-4 text-xs cursor-text"
        >
          <div className="text-slate-500 text-[11.5px] border-b border-slate-900 pb-2">
            NexCage OCI runtime and container orchestration shell v0.13.0.<br />
            Type <span className="text-cyan-400">nexcage --help</span> for available commands, or explore container operations.
          </div>

          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              {/* Command line */}
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-emerald-400">root@mgr</span>
                <span className="text-slate-600">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-slate-400">#</span>
                <span className="text-white font-semibold">{item.command}</span>
                {item.exitCode !== 0 && (
                  <span className="ml-auto text-[10px] text-rose-400 px-1 rounded bg-rose-950/60 border border-rose-900">
                    exit {item.exitCode}
                  </span>
                )}
              </div>

              {/* Stdout */}
              {item.stdout && (
                <pre className="text-slate-300 whitespace-pre font-mono leading-relaxed pl-2 overflow-x-auto">
                  {item.stdout}
                </pre>
              )}

              {/* Stderr */}
              {item.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap font-mono leading-relaxed pl-2">
                  {item.stderr}
                </pre>
              )}
            </div>
          ))}

          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Prompt */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <span className="text-emerald-400 text-xs">root@mgr</span>
          <span className="text-slate-600 text-xs">:</span>
          <span className="text-blue-400 text-xs">~</span>
          <span className="text-slate-400 text-xs">#</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'nexcage list', 'nexcage start <name>', 'nexcage health'..."
            className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
            autoFocus
          />
          <button
            onClick={() => executeCommand(input)}
            className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
