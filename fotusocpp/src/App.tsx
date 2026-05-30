/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CommandsView from './views/CommandsView';
import SessionsView from './views/SessionsView';
import LogsView from './views/LogsView';
import AmbientBackground from './components/AmbientBackground';
import { Layers, Terminal, Clock, Activity, Settings } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans text-zinc-100 relative">
      <AmbientBackground />
      
      {/* Side Navigation */}
      <aside className="w-20 md:w-64 border-r border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center md:items-start py-6 z-20 shrink-0">
        
        <div className="flex items-center gap-3 px-0 md:px-6 mb-10 w-full justify-center md:justify-start">
          <img 
            src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1776262898/LOGO_Fotus_1A_r2m41s.png" 
            alt="Fotus" 
            className="h-10 md:h-12 object-contain shrink-0 brightness-0 invert opacity-90 mx-auto md:mx-0"
          />
        </div>

        <nav className="flex flex-col gap-2 w-full px-3 md:px-4">
          <NavItem 
            icon={<Layers className="h-5 w-5" />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem 
            icon={<Terminal className="h-5 w-5" />} 
            label="Comandos OCPP" 
            active={currentView === 'commands'} 
            onClick={() => setCurrentView('commands')}
          />
          <NavItem 
            icon={<Clock className="h-5 w-5" />} 
            label="Sessões" 
            active={currentView === 'sessions'} 
            onClick={() => setCurrentView('sessions')}
          />
          <NavItem 
            icon={<Activity className="h-5 w-5" />} 
            label="Logs OCPP" 
            active={currentView === 'logs'} 
            onClick={() => setCurrentView('logs')}
          />
        </nav>

        <div className="mt-auto w-full px-3 md:px-4">
           <NavItem 
            icon={<Settings className="h-5 w-5" />} 
            label="Configurações" 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'commands' && <CommandsView />}
        {currentView === 'sessions' && <SessionsView />}
        {currentView === 'logs' && <LogsView />}
        {currentView === 'settings' && (
          <div className="p-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configurações</h1>
            <p className="text-zinc-500">Em desenvolvimento.</p>
          </div>
        )}
      </main>

    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center md:justify-start gap-4 p-3 rounded-2xl md:rounded-xl transition-all duration-200 border border-transparent ${
        active 
          ? 'bg-zinc-900 border-zinc-800 text-white shadow-inner' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden md:block text-sm font-medium">{label}</span>
    </button>
  );
}

