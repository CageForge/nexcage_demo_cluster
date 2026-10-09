import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { ContainersView } from './components/ContainersView';
import { TemplatesView } from './components/TemplatesView';
import { ClusterView } from './components/ClusterView';
import { TerminalView } from './components/TerminalView';
import { ConfigView } from './components/ConfigView';
import { HealthCheckView } from './components/HealthCheckView';
import { nexcage } from './services/nexcageEngine';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('containers');
  const [containers, setContainers] = useState(nexcage.getContainers());
  const [templates, setTemplates] = useState(nexcage.getTemplates());
  const [nodes, setNodes] = useState(nexcage.getNodes());
  const [storages, setStorages] = useState(nexcage.getStorages());

  const refreshState = () => {
    setContainers(nexcage.getContainers());
    setTemplates(nexcage.getTemplates());
    setNodes(nexcage.getNodes());
    setStorages(nexcage.getStorages());
  };

  useEffect(() => {
    const unsubscribe = nexcage.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, []);

  const runningCount = containers.filter((c) => c.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        containersCount={containers.length}
        runningCount={runningCount}
        templatesCount={templates.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'containers' && (
          <ContainersView
            containers={containers}
            templates={templates}
            nodes={nodes}
            storages={storages}
            onRefresh={refreshState}
          />
        )}

        {currentTab === 'templates' && (
          <TemplatesView
            templates={templates}
            storages={storages}
            onRefresh={refreshState}
          />
        )}

        {currentTab === 'cluster' && (
          <ClusterView nodes={nodes} storages={storages} />
        )}

        {currentTab === 'terminal' && (
          <TerminalView onStateChange={refreshState} />
        )}

        {currentTab === 'config' && (
          <ConfigView onSaved={refreshState} />
        )}

        {currentTab === 'health' && (
          <HealthCheckView />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>NexCage v0.13.0</span>
          <span>•</span>
          <span>OCI Runtime for Proxmox VE</span>
          <span>•</span>
          <span className="text-emerald-500">Node: mgr (192.168.1.10)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>/run/nexcage</span>
          <span>Corosync Ring 0 Online</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
