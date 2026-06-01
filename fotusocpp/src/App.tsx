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
import { Layers, Terminal, Clock, Activity, Settings, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans text-zinc-100 relative">
      <AmbientBackground />
      
      {/* Side Navigation */}
      <aside className={`transition-all duration-300 border-r border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md flex flex-col py-6 z-20 shrink-0 ${isSidebarOpen ? 'w-64 items-start' : 'w-20 items-center'}`}>
        
        <div className={`flex items-center w-full mb-10 ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}`}>
          {isSidebarOpen && (
            <img 
              src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1778251202/ChatGPT_Image_23_de_abr._de_2026__13_34_41-removebg-preview_1_rjedu4.png" 
              alt="Fotus" 
              className="h-10 md:h-12 object-contain shrink-0 brightness-0 invert opacity-90 mx-auto md:mx-0"
            />
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex flex-col gap-2 w-full px-3 md:px-4">
          <NavItem 
            icon={<Layers className="h-5 w-5" />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Terminal className="h-5 w-5" />} 
            label="Comandos OCPP" 
            active={currentView === 'commands'} 
            onClick={() => setCurrentView('commands')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Clock className="h-5 w-5" />} 
            label="Sessões" 
            active={currentView === 'sessions'} 
            onClick={() => setCurrentView('sessions')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Activity className="h-5 w-5" />} 
            label="Logs OCPP" 
            active={currentView === 'logs'} 
            onClick={() => setCurrentView('logs')}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="mt-auto w-full px-3 md:px-4">
           <NavItem 
            icon={<Settings className="h-5 w-5" />} 
            label="Configurações" 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
            isOpen={isSidebarOpen}
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

function NavItem({ icon, label, active, onClick, isOpen = true }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isOpen?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-4 p-3 rounded-2xl md:rounded-xl transition-all duration-200 border border-transparent ${
        active 
          ? 'bg-zinc-900 border-zinc-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
      }`}
      title={label}
    >
      {icon}
      {isOpen && <span className="hidden md:block text-sm font-bold tracking-wide">{label}</span>}
    </button>
  );
}

