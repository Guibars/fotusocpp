import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Gauge,
  Layers,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
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

const views: Array<{ id: ViewId; label: string; icon: React.ReactNode; shape: string }> = [
  { id: 'dashboard', label: 'Operacao', icon: <Layers className="h-4 w-4" />, shape: 'shape-squircle' },
  { id: 'commands', label: 'Comandos', icon: <Terminal className="h-4 w-4" />, shape: 'shape-arch' },
  { id: 'sessions', label: 'Sessoes', icon: <Clock className="h-4 w-4" />, shape: 'shape-pill' },
  { id: 'meters', label: 'Telemetria', icon: <Gauge className="h-4 w-4" />, shape: 'shape-blob' },
  { id: 'tariffs', label: 'Tarifas', icon: <ReceiptText className="h-4 w-4" />, shape: 'shape-diamond' },
  { id: 'logs', label: 'Logs', icon: <Activity className="h-4 w-4" />, shape: 'shape-soft' },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = (view: ViewId) => {
    setCurrentView(view);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f3f1] text-slate-900 lg:p-8 xl:p-10">
      <div className="crm-app-shell flex min-h-screen overflow-hidden lg:min-h-[calc(100vh-5rem)]">
        <aside
          className={`hidden shrink-0 flex-col bg-[#dfe1e8]/90 transition-[width] duration-300 ease-out lg:flex ${
            sidebarCollapsed ? 'w-[92px]' : 'w-64'
          }`}
        >
          <BrandBlock collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(value => !value)} />
          <nav className={`flex-1 py-4 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
            {views.map(view => (
              <NavItem
                key={view.id}
                icon={view.icon}
                shape={view.shape}
                label={view.label}
                active={currentView === view.id}
                collapsed={sidebarCollapsed}
                onClick={() => navigate(view.id)}
              />
            ))}
          </nav>
          <div className={`border-t border-slate-200 py-3 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
            <NavItem
              icon={<Settings className="h-4 w-4" />}
              shape="shape-soft"
              label="Sistema"
              active={currentView === 'settings'}
              collapsed={sidebarCollapsed}
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
                shape={view.shape}
                label={view.label}
                active={currentView === view.id}
                onClick={() => navigate(view.id)}
              />
            ))}
            <NavItem
              icon={<Settings className="h-4 w-4" />}
              shape="shape-soft"
              label="Sistema"
              active={currentView === 'settings'}
              onClick={() => navigate('settings')}
            />
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[#ececef]">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#ececef]/95 px-4 backdrop-blur lg:h-20 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fotus Charge CRM</p>
                <h1 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                  {currentView === 'settings' ? 'Sistema' : views.find(view => view.id === currentView)?.label}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:flex">
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

function BrandBlock({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className={`relative ${collapsed ? 'px-3 py-5' : 'px-5 py-7'}`}>
      <div className={`flex ${collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between gap-3'}`}>
        <BrandMark collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="expressive-control group shrink-0 text-slate-950"
          aria-label={collapsed ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
          title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-[1.15rem_1.65rem_1.1rem_1.35rem] border border-white/70 bg-white/55 p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stack</p>
            <p className="mt-1 text-sm font-bold text-slate-950">OCPP 1.6-J</p>
          </div>
          <div className="rounded-[1.6rem_1.15rem_1.45rem_1.1rem] border border-lime-200/80 bg-lime-100/80 p-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Modo</p>
            <p className="mt-1 text-sm font-bold text-emerald-800">Real</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
      <div className="shape-blob grid h-12 w-12 place-items-center bg-slate-950 text-[#d9f96e] shadow-sm">
        <BarChart3 className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div>
          <p className="text-lg font-black tracking-tight text-slate-950">Fotus</p>
          <p className="text-[11px] font-semibold text-slate-500">Operacao OCPP</p>
        </div>
      )}
    </div>
  );
}

function NavItem({
  icon,
  shape,
  label,
  active,
  collapsed = false,
  onClick,
}: {
  key?: React.Key;
  icon: React.ReactNode;
  shape: string;
  label: string;
  active: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group mb-2 flex h-12 w-full items-center transition-all duration-200 ${
        collapsed ? 'justify-center px-0' : 'gap-3 rounded-[1.45rem] px-2.5'
      } ${
        active
          ? collapsed
            ? 'text-white'
            : 'bg-white/70 text-slate-950 shadow-sm'
          : collapsed
            ? 'text-slate-600'
            : 'text-slate-600 hover:bg-white/65 hover:text-slate-950 hover:shadow-sm'
      }`}
    >
      <span
        className={`expressive-nav-icon ${shape} ${active ? 'nav-icon-active' : ''} ${
          active
            ? 'bg-slate-950 text-[#d9f96e] shadow-[0_12px_24px_rgba(15,23,42,0.22)]'
            : 'bg-white/80 text-slate-500 shadow-sm ring-1 ring-white/70 group-hover:bg-white group-hover:text-slate-950'
        }`}
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className={`min-w-0 flex-1 truncate text-left text-sm font-bold ${active ? 'text-slate-950' : 'text-slate-700'}`}>
            {label}
          </span>
          {active && <span className="h-2.5 w-2.5 rounded-full bg-[#d9f96e]" />}
        </>
      )}
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
