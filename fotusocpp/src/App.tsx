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
import { 
  Layers, 
  Terminal, 
  Clock, 
  Activity, 
  Settings, 
  FlaskConical, 
  DollarSign, 
  PlugZap,
  Cpu,
  MonitorCheck
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden font-sans text-slate-800 relative select-none">
      
      {/* Side Navigation - Material Expressive 3 Drawers */}
      <aside className="w-68 border-r border-[#e2e8f0] bg-white flex flex-col py-8 z-20 shrink-0 shadow-[4px_0_24px_rgba(14,70,127,0.015)]">
        
        {/* Header - Only the Fotus Charge Logo */}
        <div className="flex items-center justify-center w-full mb-10 px-6">
          <img 
            src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1778251202/ChatGPT_Image_23_de_abr._de_2026__13_34_41-removebg-preview_1_rjedu4.png" 
            alt="Fotus Charge" 
            className="h-12 w-auto object-contain shrink-0 filter brightness-100 hover:scale-105 transition-transform duration-300"
            style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(87%) saturate(1516%) hue-rotate(193deg) brightness(97%) contrast(106%)' }} // #0e467f brand color
          />
        </div>

        {/* M3 Active-Indicator Navigation Pills */}
        <nav className="flex flex-col gap-2 w-full px-4 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<Layers className="h-5 w-5" />} 
            label="Dashboard Geral" 
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
            icon={<FlaskConical className="h-5 w-5" />} 
            label="Laboratório Especial" 
            active={currentView === 'lab'} 
            onClick={() => setCurrentView('lab')}
          />
          <NavItem 
            icon={<Clock className="h-5 w-5" />} 
            label="Sessões Realizadas" 
            active={currentView === 'sessions'} 
            onClick={() => setCurrentView('sessions')}
          />
          <NavItem 
            icon={<PlugZap className="h-5 w-5" />} 
            label="Medições / Telemetria" 
            active={currentView === 'meters'} 
            onClick={() => setCurrentView('meters')}
          />
          <NavItem 
            icon={<DollarSign className="h-5 w-5" />} 
            label="Configurar Tarifas" 
            active={currentView === 'tariffs'} 
            onClick={() => setCurrentView('tariffs')}
          />
          <NavItem 
            icon={<Activity className="h-5 w-5" />} 
            label="Logs de Sistema" 
            active={currentView === 'logs'} 
            onClick={() => setCurrentView('logs')}
          />
        </nav>

        {/* Bottom Config Section */}
        <div className="mt-auto w-full px-4 pt-4 border-t border-slate-100">
           <NavItem 
            icon={<Settings className="h-5 w-5" />} 
            label="Configurações" 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f4f7fc]">
        
        {/* Core View Switchers with smooth entry background animations */}
        <div className="flex-1 h-full w-full relative overflow-hidden flex flex-col">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'commands' && <CommandsView />}
          {currentView === 'lab' && <OcppLabView />}
          {currentView === 'sessions' && <SessionsView />}
          {currentView === 'meters' && <MeterValuesView />}
          {currentView === 'tariffs' && <TariffsView />}
          {currentView === 'logs' && <LogsView />}
          {currentView === 'settings' && (
            <div className="p-8 md:p-10 flex-1 overflow-y-auto w-full">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-1">Painel Administrativo</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] font-display mb-2">Configurações</h1>
              <p className="text-slate-500 mb-8 text-sm font-medium">Gerenciamento global de parâmetros de conformidade e credenciais do barramento OCPP.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 font-display flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-[#0e467f]" />
                    Conectividade OCPP
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">URL Base do WebSocket (WSS)</label>
                      <input 
                        type="text" 
                        value="wss://ocpp-backend-production.up.railway.app" 
                        disabled
                        className="w-full bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status do Servidor Central</label>
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 pl-2.5 py-1.5 rounded-xl border border-green-100 w-fit text-xs font-bold uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Operacional
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#0e467f]/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/10 rounded-full blur-xl pointer-events-none"></div>
                  <div>
                    <h3 className="font-bold text-lg text-[#0e467f] mb-4 font-display flex items-center gap-2">
                      <MonitorCheck className="h-5 w-5 text-[#fab515]" />
                      Taxas de Atualização
                    </h3>
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 font-semibold">
                        <span>Frequência de Polling</span>
                        <span className="font-bold text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Alta Frequência (2.0s)</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 font-semibold">
                        <span>Versão Integrada</span>
                        <span className="font-bold text-slate-800">OCPP 1.6 JSON</span>
                      </div>
                      <div className="flex justify-between items-center py-2 font-semibold">
                        <span>Localização Global</span>
                        <span className="font-bold text-slate-850">Português (Brasil)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

// Subcomponent: NavItem utilizing Google Material 3 Visual Expressive Language
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative w-full flex items-center px-3 py-2.5 h-12 rounded-2xl transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-[#0e467f]/20 cursor-pointer ${
        active 
          ? 'bg-blue-50/70 text-[#0e467f]' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0e467f]'
      }`}
    >
      {/* Active Indicator Bar - Left vertical line */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md transition-all duration-300 ${
        active ? 'bg-[#0e467f] scale-y-100' : 'bg-transparent scale-y-0'
      }`}></div>

      {/* M3 Icon Container (Pill Highlight) */}
      <div className={`flex items-center justify-center h-9 w-11 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-[#0e467f] text-[#fab515] shadow-xs' 
          : 'bg-transparent text-slate-500 group-hover:bg-slate-100 group-hover:text-[#0e467f]'
      }`}>
        {icon}
      </div>

      {/* Primary Label */}
      <span className={`ml-3 text-xs font-bold tracking-wide font-display transition-colors ${
        active ? 'text-[#0e467f]' : 'text-slate-600 group-hover:text-[#0e467f]'
      }`}>
        {label}
      </span>

      {/* Dynamic Solar Accent */}
      {active && (
        <span className="absolute right-3.5 h-2 w-2 rounded-full bg-[#fab515] shadow-xs animate-pulse"></span>
      )}
    </button>
  );
}
