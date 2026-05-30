import React, { useState, useEffect } from 'react';
import { Charger } from '../types';
import { getChargers, startCharging, stopCharging, resetCharger } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { Zap, Play, Square, PowerOff, Unlock, Settings, RefreshCw, MessageSquare, AlertTriangle } from 'lucide-react';

export default function CommandsView() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [commandTitle, setCommandTitle] = useState('');
  const [commandPayload, setCommandPayload] = useState<any>({});
  const [isSending, setIsSending] = useState(false);
  const [commandResult, setCommandResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [currentAction, setCurrentAction] = useState<() => Promise<any>>();

  useEffect(() => {
    async function load() {
      const data = await getChargers();
      if (data) {
        setChargers(data);
        if (data.length > 0 && !selectedChargerId) {
          setSelectedChargerId(data[0].id);
        }
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [selectedChargerId]);

  const selectedCharger = chargers.find(c => c.id === selectedChargerId);
  const isOnline = selectedCharger?.status === 'Online';
  const lastHeartbeat = selectedCharger?.ultimo_heartbeat ? new Date(selectedCharger.ultimo_heartbeat).toLocaleString() : 'Desconhecido';
  const connector = selectedCharger?.connectors?.[0];

  const triggerCommand = (title: string, payload: any, action: () => Promise<any>) => {
    setCommandTitle(title);
    setCommandPayload(payload);
    setCurrentAction(() => action);
    setCommandResult(null);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;
    setIsSending(true);
    const result = await currentAction();
    setIsSending(false);
    setCommandResult(result);
  };

  if (loading) {
     return <div className="p-10 text-zinc-400">Carregando dispositivos...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 custom-scrollbar relative z-10 w-full h-full text-zinc-100">
      
      <div className="mb-10 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Central de Comandos OCPP</h1>
        <p className="text-zinc-500 mt-1">Envie comandos remotos para carregadores conectados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Charger Selection Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 border border-zinc-800/60 glass-panel">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Selecionar Carregador</h2>
            
            <div className="relative">
              <select 
                value={selectedChargerId}
                onChange={e => setSelectedChargerId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="" disabled>Selecione um carregador...</option>
                {chargers.map(c => (
                  <option key={c.id} value={c.id}>{c.charge_point_id} ({c.status})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-zinc-400"></div>
              </div>
            </div>

            {selectedCharger && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Status</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${isOnline ? 'bg-brand-neon/10 text-brand-neon' : 'bg-red-500/10 text-brand-red'}`}>
                    {selectedCharger.status}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Fabricante / Modelo</span>
                  <span className="text-zinc-300 text-sm font-mono truncate max-w-[150px]">{selectedCharger.fabricante} / {selectedCharger.modelo}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Último Heartbeat</span>
                  <span className="text-zinc-300 text-xs font-mono">{lastHeartbeat}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Conector 1</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${connector?.status === 'Charging' ? 'bg-blue-950/30 text-brand-blue border-brand-blue/30' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'}`}>
                     {connector?.status || 'Desconhecido'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commands Grid */}
        <div className="lg:col-span-2">
          {!selectedCharger ? (
            <div className="h-64 flex flex-col items-center justify-center border border-zinc-800/50 rounded-3xl border-dashed">
              <Zap className="h-8 w-8 text-zinc-600 mb-3" />
              <p className="text-zinc-500">Selecione um carregador para ver os comandos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <CommandCard 
                icon={<Play className="h-5 w-5" />}
                title="Iniciar Recarga"
                description="RemoteStartTransaction"
                active={isOnline}
                onClick={() => triggerCommand(
                  "Iniciar Recarga", 
                  { connectorId: 1, idTag: "ADMIN" }, 
                  () => startCharging(selectedCharger.id, 1, "ADMIN")
                )}
              />
              
              <CommandCard 
                icon={<Square className="h-5 w-5" />}
                title="Parar Recarga"
                description="RemoteStopTransaction"
                active={isOnline}
                danger
                onClick={() => triggerCommand(
                  "Parar Recarga", 
                  { transactionId: "Auto (buscar ativa)" }, 
                  () => stopCharging(selectedCharger.id) // It might fail if we don't know the transactionId, but api handles message
                )}
              />
              
              <CommandCard 
                icon={<RefreshCw className="h-5 w-5" />}
                title="Reset Soft"
                description="Reinicia o sistema operacional"
                active={isOnline}
                onClick={() => triggerCommand(
                  "Reset Soft", 
                  { type: "Soft" }, 
                  () => resetCharger(selectedCharger.id, "Soft")
                )}
              />
              
              <CommandCard 
                icon={<PowerOff className="h-5 w-5" />}
                title="Reset Hard"
                description="Reinício forçado de energia"
                active={isOnline}
                danger
                onClick={() => triggerCommand(
                  "Reset Hard", 
                  { type: "Hard" }, 
                  () => resetCharger(selectedCharger.id, "Hard")
                )}
              />
              
              <CommandCard 
                icon={<Unlock className="h-5 w-5" />}
                title="Desbloquear Conector"
                description="UnlockConnector (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<Settings className="h-5 w-5" />}
                title="Alterar Disponibilidade"
                description="ChangeAvailability (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<Settings className="h-5 w-5" />}
                title="Obter Configuração"
                description="GetConfiguration (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<RefreshCw className="h-5 w-5" />}
                title="Limpar Cache"
                description="ClearCache (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={commandTitle} 
        payload={commandPayload} 
        onConfirm={handleConfirm}
        isSending={isSending}
        result={commandResult}
      />
    </div>
  );
}

function CommandCard({ icon, title, description, active, danger, pending, onClick }: any) {
  let baseClasses = "flex flex-col p-6 rounded-3xl border transition-all duration-200 text-left relative overflow-hidden ";
  
  if (!active || pending) {
    baseClasses += "bg-zinc-900/30 border-zinc-800/40 opacity-60 cursor-not-allowed";
  } else if (danger) {
    baseClasses += "bg-red-950/10 border-red-900/30 hover:bg-red-950/30 hover:border-red-500/30 cursor-pointer";
  } else {
    baseClasses += "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 cursor-pointer";
  }

  return (
    <button className={baseClasses} onClick={!(active && !pending) ? undefined : onClick} disabled={!active || pending}>
      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-4 ${danger && active && !pending ? 'bg-red-500/20 text-brand-red' : 'bg-zinc-800 text-zinc-300'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold text-lg ${danger && active && !pending ? 'text-brand-red' : 'text-white'}`}>{title}</h3>
      <p className="text-zinc-500 text-sm mt-1">{description}</p>
      
      {pending && (
        <span className="absolute top-4 right-4 bg-zinc-800 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded text-zinc-400">
          Backend Pendente
        </span>
      )}
    </button>
  );
}
