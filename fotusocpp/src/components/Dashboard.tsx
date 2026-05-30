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
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4 bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 glass-panel">
          <RefreshCcw className="h-8 w-8 animate-spin text-brand-neon" />
          <p className="text-zinc-400 font-medium text-sm tracking-widest uppercase">Conectando ao Backend...</p>
        </div>
      </div>
    );
  }

  if (hasConnectionError && !stats) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center max-w-lg text-center gap-4 bg-zinc-900/80 p-10 rounded-3xl border border-zinc-800 glass-panel">
          <div className="h-16 w-16 bg-red-500/10 text-brand-red rounded-full flex items-center justify-center mb-2 inset-shadow">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Falha na Conexão</h2>
          <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
            Não foi possível conectar ao backend do Railway. Verifique se o backend está rodando e o CORS está configurado corretamente.
          </p>
          <button onClick={loadData} className="px-6 py-3 bg-white text-black rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors active:scale-95">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 custom-scrollbar relative z-10 w-full h-full text-zinc-100">
      
      <div className="flex items-center justify-between mb-10 pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Novos Produtos</h1>
          <p className="text-zinc-500 mt-1">OCPP 1.6J - Desenvolvimento</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-300 backdrop-blur-sm">
          <RefreshCcw className="h-4 w-4" />
          Sincronizar
        </button>
      </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard 
              icon={<Wifi className="h-5 w-5 text-brand-neon" />}
              title="Online"
              value={stats?.chargersOnline || 0}
            />
            <StatCard 
              icon={<WifiOff className="h-5 w-5 text-zinc-600" />}
              title="Offline"
              value={stats?.chargersOffline || 0}
            />
            <StatCard 
              icon={<BatteryCharging className="h-5 w-5 text-brand-blue" />}
              title="Sessões Ativas"
              value={stats?.activeSessions || 0}
            />
            <StatCard 
              icon={<Activity className="h-5 w-5 text-purple-400" />}
              title="Energia (kWh)"
              value={stats?.totalEnergyConsumed ? Number(stats.totalEnergyConsumed).toFixed(1) : '0.0'}
            />
          </section>

          {/* Infrastructure Map / List Container */}
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 md:p-10 mb-10 border border-zinc-800/60 glass-panel">
            
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                 <Layers className="h-5 w-5 text-brand-blue" />
                 Terminais de Recarga
               </h2>
               <div className="flex gap-2">
                 <button className="p-2.5 bg-zinc-800/80 text-zinc-400 hover:text-white rounded-full transition-colors border border-zinc-700/50"><Plus className="h-4 w-4" /></button>
                 <button className="p-2.5 bg-zinc-800/80 text-zinc-400 hover:text-white rounded-full transition-colors border border-zinc-700/50"><Upload className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 gap-6 relative">
              {/* If no real chargers from backend */}
              {chargers.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-900/50 rounded-[2rem] border border-zinc-800/50 border-dashed">
                  <div className="h-16 w-16 bg-zinc-950 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                    <AlertTriangle className="h-6 w-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-300 font-medium">Nenhum carregador recebido do backend.</p>
                  <p className="text-zinc-500 text-sm mt-2 max-w-sm text-center">Certifique-se de que se carregador físico ou virtual está conectado ao wss://ocpp-backend-production.up.railway.app</p>
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
    <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl flex flex-col transition-all hover:bg-zinc-800/80 glass-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800/50 shadow-inner">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-zinc-400 mb-1">{title}</h3>
      <p className="text-3xl font-bold tracking-tight text-white font-mono">{value}</p>
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

  // Dark mode visual states
  let statusColorClass = 'text-zinc-500 bg-zinc-900 border border-zinc-800';
  let dotColor = 'bg-zinc-500';
  let cardBorder = 'border-zinc-800/80';
  
  if (isFaulted) {
    statusColorClass = 'text-brand-intense-red bg-red-950/30 border border-brand-intense-red/20';
    dotColor = 'bg-brand-red animate-pulse';
    cardBorder = 'border-brand-intense-red/20';
  } else if (!isOnline) {
    statusColorClass = 'text-brand-red bg-red-950/20 border border-brand-red/20';
    dotColor = 'bg-brand-red';
  } else if (isCharging) {
    statusColorClass = 'text-brand-blue bg-blue-950/30 border border-brand-blue/30';
    dotColor = 'bg-brand-blue animate-pulse';
    cardBorder = 'border-brand-blue/30 blue-glow';
  } else if (connectorStatus === 'Available') {
    statusColorClass = 'text-zinc-300 bg-zinc-800/50 border border-zinc-700/50';
    dotColor = 'bg-brand-neon';
  } else {
    // Other statuses (Preparing, Finishing)
    statusColorClass = 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/30';
    dotColor = 'bg-brand-neon';
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
    <div className={`bg-zinc-950/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 border ${cardBorder}`}>
      
      {/* Decorative pulse line */}
      <div className={`absolute top-0 left-0 w-full h-1 opacity-50 ${isCharging ? 'bg-gradient-to-r from-transparent via-brand-blue to-transparent' : 'bg-transparent'}`}></div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4 items-center">
            <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800 shadow-inner">
                <Zap className={`h-5 w-5 ${isOnline ? 'text-brand-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]' : 'text-zinc-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{charger.charge_point_id || 'Unknown Station'}</h3>
              <p className="text-zinc-500 text-sm font-mono mt-1 pr-2 truncate max-w-[140px] md:max-w-xs">{charger.fabricante || 'Desconhecido'} • {charger.modelo || 'Desconhecido'}</p>
            </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest ${statusColorClass} shrink-0`}>
          <div className={`h-1.5 w-1.5 rounded-full ${dotColor} ${isCharging || isFaulted ? 'drop-shadow-[0_0_5px_currentColor]' : ''}`}></div>
          {connectorStatus || 'Unknown'}
        </div>
      </div>

      {/* Info Blocks (Dark mode pills) */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <InfoPill 
          label="Network" 
          value={isOnline ? 'Online' : 'Offline'} 
          valueClass={isOnline ? 'text-brand-neon' : 'text-brand-red'} 
        />
        <InfoPill label="Sync" value={timeAgo()} />
        <InfoPill label="ID" value={charger.id} />
      </div>

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center gap-3 mt-2 border-t border-zinc-800/50 pt-5">
        <button 
          onClick={() => handleAction('start')}
          disabled={!isOnline || isCharging || isFaulted}
          className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-bold transition-all text-black active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:shadow-none"
        >
          <Play className="h-4 w-4 fill-current" />
          Start
        </button>
        <button 
          onClick={() => handleAction('stop')}
          disabled={!isOnline || !isCharging}
          className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-red-500/10 hover:bg-red-500/20 text-brand-red border border-red-500/20 hover:border-red-500/40 disabled:opacity-30 disabled:bg-zinc-900 disabled:border-zinc-800 disabled:text-zinc-600 text-sm font-bold transition-all active:scale-95"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </button>
        <div className="flex-1"></div>
        <button 
          onClick={() => handleAction('reset')}
          className="p-2.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors border border-transparent hover:border-zinc-700"
          title="Reset Charger"
        >
          <PowerOff className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}

function InfoPill({ label, value, valueClass = "text-zinc-300" }: { label: string, value: string, valueClass?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 rounded-full border border-zinc-800/60 shadow-inner">
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

