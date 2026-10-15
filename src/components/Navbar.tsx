import React from 'react';
import { Box, Layers, Server, Terminal, Settings, Activity, ShieldCheck } from 'lucide-react';
import { DEMO_VERSION, NEXCAGE_VERSION, PROXMOX_VERSION } from '../version';

export type TabType = 'containers' | 'templates' | 'cluster' | 'terminal' | 'config' | 'health';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  containersCount: number;
  runningCount: number;
  templatesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  containersCount,
  runningCount,
  templatesCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-nowrap gap-1.5 sm:gap-2">
                <span className="font-bold text-lg tracking-tight text-white whitespace-nowrap">NexCage</span>
                <span className="px-1.5 py-0.5 text-xs font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded whitespace-nowrap shrink-0" title="NexCage Runtime Engine Version">
                  v{NEXCAGE_VERSION}
                </span>
                <span className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/80 rounded whitespace-nowrap shrink-0" title="Demo Cluster Application Version">
                  Demo v{DEMO_VERSION}
                </span>
                <span className="px-1.5 py-0.5 text-xs font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded flex items-center gap-1 whitespace-nowrap shrink-0" title="Target Proxmox VE Platform">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {PROXMOX_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">OCI Runtime for Proxmox VE & crun</p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('containers')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'containers'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Containers</span>
              <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-slate-800 text-slate-300">
                {runningCount}/{containersCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('templates')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'templates'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Templates</span>
              <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-slate-800 text-slate-300">
                {templatesCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('cluster')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'cluster'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Cluster</span>
            </button>

            <button
              onClick={() => onTabChange('terminal')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'terminal'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>CLI Console</span>
            </button>

            <button
              onClick={() => onTabChange('config')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'config'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Routing & Config</span>
            </button>

            <button
              onClick={() => onTabChange('health')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentTab === 'health'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Diagnostics</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
