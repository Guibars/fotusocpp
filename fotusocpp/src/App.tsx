import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Gauge,
  Layers,
  Menu,
  ReceiptText,
  Server,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import CommandsView from './views/CommandsView';
import SessionsView from './views/SessionsView';
import LogsView from './views/LogsView';
import TariffsView from './views/TariffsView';
import MeterValuesView from './views/MeterValuesView';
import { getBackendHost } from './services/api';

type ViewId = 'dashboard' | 'commands' | 'sessions' | 'meters' | 'tariffs' | 'logs' | 'settings';

const views: Array<{ id: ViewId; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Operacao', icon: <Layers className="h-4 w-4" /> },
  { id: 'commands', label: 'Comandos', icon: <Terminal className="h-4 w-4" /> },
  { id: 'sessions', label: 'Sessoes', icon: <Clock className="h-4 w-4" /> },
  { id: 'meters', label: 'Telemetria', icon: <Gauge className="h-4 w-4" /> },
  { id: 'tariffs', label: 'Tarifas', icon: <ReceiptText className="h-4 w-4" /> },
  { id: 'logs', label: 'Logs', icon: <Activity className="h-4 w-4" /> },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = (view: ViewId) => {
    setCurrentView(view);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
          <BrandBlock />
          <nav className="flex-1 px-3 py-4">
            {views.map(view => (
              <NavItem
                key={view.id}
                icon={view.icon}
                label={view.label}
                active={currentView === view.id}
                onClick={() => navigate(view.id)}
              />
            ))}
          </nav>
          <div className="border-t border-slate-200 p-3">
            <NavItem
              icon={<Settings className="h-4 w-4" />}
              label="Sistema"
              active={currentView === 'settings'}
              onClick={() => navigate('settings')}
            />
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white transition-transform lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <BrandMark />
            <button
              onClick={() => setMobileNavOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="px-3 py-4">
            {views.map(view => (
              <NavItem
                key={view.id}
                icon={view.icon}
                label={view.label}
                active={currentView === view.id}
                onClick={() => navigate(view.id)}
              />
            ))}
            <NavItem
              icon={<Settings className="h-4 w-4" />}
              label="Sistema"
              active={currentView === 'settings'}
              onClick={() => navigate('settings')}
            />
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fotus Charge CRM</p>
                <h1 className="text-base font-bold text-slate-950 sm:text-lg">
                  {currentView === 'settings' ? 'Sistema' : views.find(view => view.id === currentView)?.label}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:flex">
              <Server className="h-4 w-4 text-[#0e467f]" />
              {getBackendHost()}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'commands' && <CommandsView />}
            {currentView === 'sessions' && <SessionsView />}
            {currentView === 'meters' && <MeterValuesView />}
            {currentView === 'tariffs' && <TariffsView />}
            {currentView === 'logs' && <LogsView />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="border-b border-slate-200 px-5 py-5">
      <BrandMark />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stack</p>
          <p className="mt-1 text-sm font-bold text-slate-950">OCPP 1.6-J</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Modo</p>
          <p className="mt-1 text-sm font-bold text-emerald-800">Real</p>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0e467f] text-[#fab515]">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black tracking-tight text-[#0e467f]">Fotus Charge</p>
        <p className="text-[11px] font-semibold text-slate-500">Operacao OCPP</p>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  key?: React.Key;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
        active
          ? 'bg-[#0e467f] text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      }`}
    >
      <span className={active ? 'text-[#fab515]' : 'text-slate-500'}>{icon}</span>
      {label}
    </button>
  );
}

function SettingsView() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0e467f]">Sistema</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Configuracao operacional</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            O painel usa somente endpoints presentes no backend conectado. Recursos de simulacao e comandos sem rota foram removidos da navegacao.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-[#0e467f]">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Backend API</p>
                <p className="text-sm font-bold text-slate-950">{getBackendHost()}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-xs font-semibold text-slate-600">
              VITE_BACKEND_URL
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Superficie ativa</p>
                <p className="text-sm font-bold text-slate-950">Operacao, comandos, tarifas, logs e telemetria</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
              As telas restantes leem ou escrevem no backend real; quando um carregador recusar um comando, a resposta volta pelo fluxo de resultados OCPP.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
