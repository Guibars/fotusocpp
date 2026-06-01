import React, { useEffect, useState } from 'react';
import { Charger, ChargerStats } from '../types';
import { getChargers, getStats, startCharging, stopCharging, resetCharger } from '../services/api';
import { 
  Zap, 
  PowerOff, 
  BatteryCharging, 
  RefreshCcw, 
  Play, 
  Square,
  Activity,
  Wifi,
  WifiOff,
  Plus,
  Upload,
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<ChargerStats | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, chargersData] = await Promise.all([
        getStats(),
        getChargers()
      ]);
      
      if (!statsData || !chargersData) {
        setHasConnectionError(true);
      } else {
        setHasConnectionError(false);
        setStats(statsData);
        setChargers(chargersData);
      }
    } catch (e) {
      console.error(e);
      setHasConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats && !hasConnectionError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <RefreshCcw className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Conectando ao Backend...</p>
        </div>
      </div>
    );
  }

  if (hasConnectionError && !stats) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center max-w-lg text-center gap-4 bg-white p-10 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Falha na Conexão</h2>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Não foi possível conectar ao backend do Railway. Verifique se o backend está rodando e o CORS está configurado corretamente.
          </p>
          <button onClick={loadData} className="px-6 py-3 bg-brand-blue text-white rounded-md text-sm font-semibold hover:bg-blue-800 transition-colors active:scale-95 shadow-sm">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novos Produtos</h1>
          <p className="text-sm text-slate-500 mt-1">OCPP 1.6J - Desenvolvimento</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
          <RefreshCcw className="h-3.5 w-3.5" />
          Sincronizar
        </button>
      </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-5 mb-8">
            <StatCard 
              icon={<Wifi className="h-4 w-4 text-brand-blue" />}
              title="Online"
              value={stats?.chargersOnline || 0}
            />
            <StatCard 
              icon={<WifiOff className="h-4 w-4 text-slate-400" />}
              title="Offline"
              value={stats?.chargersOffline || 0}
            />
            <StatCard 
              icon={<BatteryCharging className="h-4 w-4 text-brand-blue" />}
              title="Sessões Ativas"
              value={stats?.activeSessions || 0}
            />
            <StatCard 
              icon={<Activity className="h-4 w-4 text-brand-blue" />}
              title="Energia (kWh)"
              value={stats?.totalEnergyConsumed ? Number(stats.totalEnergyConsumed).toFixed(1) : '0.0'}
            />
            <div className="relative bg-white border border-slate-200 p-5 rounded-xl flex flex-col transition-all hover:shadow-md group overflow-hidden shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Tarifa Atual</h3>
              <p className="text-xl font-bold tracking-tight text-slate-900 mb-1 truncate relative z-10">{stats?.tariff?.name || 'Padrão'}</p>
              <p className="text-sm text-brand-blue font-mono font-medium relative z-10">R$ {stats?.tariff?.pricePerKwh ? Number(stats.tariff.pricePerKwh).toFixed(2) : '0.00'}/kWh</p>
            </div>
            <div className="relative bg-white border border-slate-200 p-5 rounded-xl flex flex-col transition-all hover:shadow-md group overflow-hidden shadow-sm">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Receita Estimada</h3>
              <p className="text-2xl font-bold tracking-tight font-mono mt-auto text-emerald-600 relative z-10">
                R$ {stats?.sessions?.totalRevenue ? Number(stats.sessions.totalRevenue).toFixed(2) : '0.00'}
              </p>
            </div>
          </section>

          {/* Infrastructure Map / List Container */}
          <div className="bg-white rounded-xl p-5 md:p-6 mb-8 border border-slate-200 shadow-sm">
            
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Layers className="h-5 w-5 text-brand-blue" />
                 Terminais de Recarga
               </h2>
               <div className="flex gap-2">
                 <button className="p-2 bg-slate-50 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-md transition-colors border border-slate-200"><Plus className="h-4 w-4" /></button>
                 <button className="p-2 bg-slate-50 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-md transition-colors border border-slate-200"><Upload className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4 relative">
              {/* If no real chargers from backend */}
              {chargers.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-semibold text-sm">Nenhum carregador recebido do backend.</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm text-center">Certifique-se de que se carregador físico ou virtual está conectado ao wss://ocpp-backend-production.up.railway.app</p>
                </div>
              )}

              {chargers.map((charger, idx) => (
                <ChargerCard key={charger.id || idx} charger={charger} onRefresh={loadData} />
              ))}
            </div>

          </div>
    </div>
  );
}

/* Sub-components for Mockup Style */

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <div className="relative bg-white border border-slate-200 p-5 rounded-xl flex flex-col transition-all hover:shadow-md group overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100">
          {icon}
        </div>
      </div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">{title}</h3>
      <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono relative z-10">{value}</p>
    </div>
  );
}

function ChargerCard({ charger, onRefresh }: { charger: Charger, onRefresh: () => void }) {
  
  const handleAction = async (action: 'start' | 'stop' | 'reset') => {
    let result = { success: false, message: 'Unknown error' };
    if (action === 'start') result = await startCharging(charger.id);
    else if (action === 'stop') result = await stopCharging(charger.id);
    else if (action === 'reset') result = await resetCharger(charger.id);
    
    if (!result.success && result.message) {
      alert(result.message);
    }
    
    onRefresh();
  };

  const connectorStatus = charger.connectors && charger.connectors.length > 0 ? charger.connectors[0].status : 'Unknown';
  const isOnline = charger.status === 'Online';
  const isCharging = connectorStatus === 'Charging';
  const isFaulted = connectorStatus === 'Faulted';

  // Light mode visual states
  let statusColorClass = 'text-slate-500 bg-slate-50 border border-slate-200';
  let dotColor = 'bg-slate-400';
  let cardBorder = 'border-slate-200';
  let bgClass = 'bg-white hover:bg-slate-50';
  
  if (isFaulted) {
    statusColorClass = 'text-red-700 bg-red-50 border border-red-200';
    dotColor = 'bg-red-500 animate-pulse';
    cardBorder = 'border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
    bgClass = 'bg-white hover:bg-red-50/50';
  } else if (!isOnline) {
    statusColorClass = 'text-slate-700 bg-slate-100 border border-slate-300';
    dotColor = 'bg-slate-500';
  } else if (isCharging) {
    statusColorClass = 'text-blue-700 bg-blue-50 border border-blue-200';
    dotColor = 'bg-brand-blue animate-pulse';
    cardBorder = 'border-blue-200 shadow-[0_0_20px_rgba(0,105,255,0.08)]';
    bgClass = 'bg-white hover:bg-blue-50/50';
  } else if (connectorStatus === 'Available') {
    statusColorClass = 'text-green-700 bg-green-50 border border-green-200';
    dotColor = 'bg-green-500';
    cardBorder = 'border-green-200';
    bgClass = 'bg-white hover:bg-green-50/50';
  } else {
    // Other statuses (Preparing, Finishing)
    statusColorClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  const timeAgo = () => {
    if (!charger.ultimo_heartbeat) return 'Unknown';
    const ms = Date.now() - new Date(charger.ultimo_heartbeat).getTime();
    if (isNaN(ms)) return 'Unknown';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className={`rounded-xl p-5 md:p-6 flex flex-col gap-5 relative transition-all duration-300 border ${bgClass} ${cardBorder} shadow-sm group`}>

      {/* Decorative pulse line */}
      <div className={`absolute top-0 left-0 w-full h-1 opacity-70 ${isCharging ? 'bg-gradient-to-r from-transparent via-brand-blue to-transparent' : 'bg-transparent'}`}></div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3 items-center">
            <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <Zap className={`h-4 w-4 ${isOnline ? 'text-brand-blue' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{charger.charge_point_id || 'Unknown Station'}</h3>
              <p className="text-slate-500 text-xs font-mono mt-0.5 pr-2 truncate max-w-[140px] md:max-w-[200px]">{charger.fabricante || 'Desconhecido'} • {charger.modelo || 'Desconhecido'}</p>
            </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${statusColorClass} shrink-0`}>
          <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></div>
          {connectorStatus || 'Unknown'}
        </div>
      </div>

      {/* Info Blocks */}
      <div className="flex flex-wrap gap-2 md:gap-2">
        <InfoPill 
          label="Network" 
          value={isOnline ? 'Online' : 'Offline'} 
          valueClass={isOnline ? 'text-green-600' : 'text-slate-500'} 
        />
        <InfoPill label="Sync" value={timeAgo()} />
        <InfoPill label="ID" value={charger.id} />
      </div>

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center gap-2 mt-1 border-t border-slate-100 pt-4">
        <button 
          onClick={() => handleAction('start')}
          disabled={!isOnline || isCharging || isFaulted}
          className="flex items-center justify-center gap-1.5 py-2 px-5 rounded-md bg-brand-blue hover:bg-blue-800 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-semibold transition-all text-white shadow-sm disabled:shadow-none"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Start
        </button>
        <button 
          onClick={() => handleAction('stop')}
          disabled={!isOnline || !isCharging}
          className="flex items-center justify-center gap-1.5 py-2 px-5 rounded-md bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 text-xs font-semibold transition-all shadow-sm disabled:shadow-none"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          Stop
        </button>
        <div className="flex-1"></div>
        <button 
          onClick={() => handleAction('reset')}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
          title="Reset Charger"
        >
          <PowerOff className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}

function InfoPill({ label, value, valueClass = "text-slate-700" }: { label: string, value: string, valueClass?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-[10px] font-semibold font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}

