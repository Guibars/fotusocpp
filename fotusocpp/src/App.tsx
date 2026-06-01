/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CommandsView from './views/CommandsView';
import SessionsView from './views/SessionsView';
import LogsView from './views/LogsView';
import OcppLabView from './views/OcppLabView';
import TariffsView from './views/TariffsView';
import MeterValuesView from './views/MeterValuesView';
import { Layers, Terminal, Clock, Activity, Settings, Menu, ChevronLeft, FlaskConical, DollarSign, PlugZap } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 relative">
      
      {/* Side Navigation */}
      <aside className={`transition-all duration-300 border-r border-slate-200 bg-white shadow-sm flex flex-col py-6 z-20 shrink-0 ${isSidebarOpen ? 'w-64 items-start' : 'w-20 items-center'}`}>
        
        <div className={`flex items-center w-full mb-10 ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}`}>
          {isSidebarOpen && (
            <img 
              src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1778251202/ChatGPT_Image_23_de_abr._de_2026__13_34_41-removebg-preview_1_rjedu4.png" 
              alt="Fotus" 
              className="h-10 md:h-12 object-contain shrink-0 mx-auto md:mx-0"
              style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(87%) saturate(1516%) hue-rotate(193deg) brightness(97%) contrast(106%)' }} // approximates #0e467f
            />
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-brand-blue border border-slate-200 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex flex-col gap-2 w-full px-3 md:px-4 overflow-y-auto custom-scrollbar">
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
            icon={<FlaskConical className="h-5 w-5" />} 
            label="Laboratório OCPP" 
            active={currentView === 'lab'} 
            onClick={() => setCurrentView('lab')}
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
            icon={<PlugZap className="h-5 w-5" />} 
            label="Medições (MeterValues)" 
            active={currentView === 'meters'} 
            onClick={() => setCurrentView('meters')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<DollarSign className="h-5 w-5" />} 
            label="Tarifas" 
            active={currentView === 'tariffs'} 
            onClick={() => setCurrentView('tariffs')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Activity className="h-5 w-5" />} 
            label="Logs Websocket" 
            active={currentView === 'logs'} 
            onClick={() => setCurrentView('logs')}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="mt-auto w-full px-3 md:px-4 pt-4 border-t border-slate-100">
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
        {currentView === 'lab' && <OcppLabView />}
        {currentView === 'sessions' && <SessionsView />}
        {currentView === 'meters' && <MeterValuesView />}
        {currentView === 'tariffs' && <TariffsView />}
        {currentView === 'logs' && <LogsView />}
        {currentView === 'settings' && (
          <div className="p-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Configurações</h1>
            <p className="text-slate-500">Em desenvolvimento.</p>
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
      className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-4 p-3 rounded-2xl md:rounded-xl transition-all duration-200 border ${
        active 
          ? 'bg-brand-blue border-brand-blue text-white shadow-sm' 
          : 'text-slate-500 border-transparent hover:text-brand-blue hover:bg-slate-100'
      }`}
      title={label}
    >
      <div className={active ? "text-brand-yellow drop-shadow-sm" : ""}>
        {icon}
      </div>
      {isOpen && <span className="hidden md:block text-sm font-semibold tracking-wide">{label}</span>}
    </button>
  );
}

