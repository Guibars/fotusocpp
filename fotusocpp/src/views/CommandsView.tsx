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
     return <div className="p-10 text-slate-500">Carregando dispositivos...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full text-slate-800 flex flex-col p-6 md:p-8 custom-scrollbar">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Terminal className="h-6 w-6 text-brand-blue" />
          Central de Comandos OCPP
        </h1>
        <p className="text-sm text-slate-500 mt-1">Envie comandos remotos para carregadores conectados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charger Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selecionar Carregador</h2>
            
            <div className="relative">
              <select 
                value={selectedChargerId}
                onChange={e => setSelectedChargerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-sm"
              >
                <option value="" disabled>Selecione um carregador...</option>
                {chargers.map(c => (
                  <option key={c.id} value={c.id}>{c.charge_point_id} ({c.status})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-slate-500"></div>
              </div>
            </div>

            {selectedCharger && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <span className="text-slate-500 text-xs font-medium">Status</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedCharger.status}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <span className="text-slate-500 text-xs font-medium">Fabricante / Modelo</span>
                  <span className="text-slate-700 text-xs font-medium truncate max-w-[150px]">{selectedCharger.fabricante} / {selectedCharger.modelo}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <span className="text-slate-500 text-xs font-medium">Último Heartbeat</span>
                  <span className="text-slate-700 text-[10px] font-mono">{lastHeartbeat}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <span className="text-slate-500 text-xs font-medium">Conector 1</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${connector?.status === 'Charging' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
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
            <div className="h-48 flex flex-col items-center justify-center border border-slate-200 rounded-xl border-dashed bg-white">
              <Zap className="h-6 w-6 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">Selecione um carregador para ver os comandos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <CommandCard 
                icon={<Play className="h-4 w-4" />}
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
                icon={<Square className="h-4 w-4" />}
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
                icon={<RefreshCw className="h-4 w-4" />}
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
                icon={<PowerOff className="h-4 w-4" />}
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
                icon={<Unlock className="h-4 w-4" />}
                title="Desbloquear Conector"
                description="UnlockConnector (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<Settings className="h-4 w-4" />}
                title="Alterar Disponibilidade"
                description="ChangeAvailability (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<Settings className="h-4 w-4" />}
                title="Obter Configuração"
                description="GetConfiguration (Em breve)"
                active={isOnline}
                pending
                onClick={() => {}}
              />
              
              <CommandCard 
                icon={<RefreshCw className="h-4 w-4" />}
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

import { Terminal } from 'lucide-react';

function CommandCard({ icon, title, description, active, danger, pending, onClick }: any) {
  let baseClasses = "flex flex-col p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden ";
  
  if (!active || pending) {
    baseClasses += "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed";
  } else if (danger) {
    baseClasses += "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 cursor-pointer";
  } else {
    baseClasses += "bg-white border-slate-200 hover:bg-slate-50 hover:border-brand-blue/30 cursor-pointer shadow-sm";
  }

  return (
    <button className={baseClasses} onClick={!(active && !pending) ? undefined : onClick} disabled={!active || pending}>
      <div className={`h-8 w-8 rounded-md flex items-center justify-center mb-3 ${danger && active && !pending ? 'bg-red-100 text-red-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold text-sm ${danger && active && !pending ? 'text-red-700' : 'text-slate-800'}`}>{title}</h3>
      <p className="text-slate-500 text-xs mt-1">{description}</p>
      
      {pending && (
        <span className="absolute top-3 right-3 bg-slate-100 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-slate-500">
          Backend Pendente
        </span>
      )}
    </button>
  );
}
