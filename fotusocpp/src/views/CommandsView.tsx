import React, { useState, useEffect } from 'react';
import { Charger } from '../types';
import { getChargers, startCharging, stopCharging, resetCharger } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  Zap, 
  Play, 
  Square, 
  PowerOff, 
  Unlock, 
  Settings, 
  RefreshCw, 
  MessageSquare, 
  AlertTriangle,
  Terminal,
  Grid,
  TrendingUp,
  Sliders,
  ShieldCheck
} from 'lucide-react';

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
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-[#0e467f]" />
          <p className="text-slate-600 font-bold text-sm">Carregando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full text-slate-800 flex flex-col p-6 md:p-8 custom-scrollbar">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
          <Terminal className="h-7 w-7 text-brand-yellow" />
          Central de Comandos
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Interaja diretamente com os terminais através do barramento seguro OCPP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bento Column 1: Selector & Device Stats (Spans 1 of 3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all">
            <h2 className="text-xs font-bold text-[#0e467f] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Terminal Alvo
            </h2>
            
            <div className="relative">
              <select 
                value={selectedChargerId}
                onChange={e => setSelectedChargerId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-[#f4f7fc] border border-slate-200 focus:border-[#0e467f] text-slate-800 rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0e467f] transition-all text-sm font-bold shadow-inner"
              >
                <option value="" disabled>Selecione um carregador...</option>
                {chargers.map(c => (
                  <option key={c.id} value={c.id}>{c.charge_point_id} ({c.status})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Grid className="h-4 w-4" />
              </div>
            </div>

            {selectedCharger ? (
              <div className="mt-6 space-y-3.5">
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold">Estado da Rede</span>
                  <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {selectedCharger.status}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold">Modelo</span>
                  <span className="text-slate-700 text-xs font-bold truncate max-w-[150px]">{selectedCharger.fabricante} / {selectedCharger.modelo}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold">Último Heartbeat</span>
                  <span className="text-slate-700 text-[10px] font-mono font-medium">{lastHeartbeat}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold">Conector Ativo</span>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border ${connector?.status === 'Charging' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                     {connector?.status || 'Inativo'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-6 text-center text-slate-400 text-xs font-medium">Nenhum terminal selecionado</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#0e467f] to-[#12589e] text-white p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#fab515]/20 rounded-full blur-xl"></div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-brand-yellow" />
              Segurança OCPP 1.6-J
            </h3>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Todos os frames e comandos recebidos via WebSocket utilizam validação em tempo de execução para evitar loops ou sobrecarga do sistema.
            </p>
          </div>
        </div>

        {/* Bento Column 2: Commands Grid (Spans 2 of 3) */}
        <div className="lg:col-span-2">
          {!selectedCharger ? (
            <div className="h-64 flex flex-col items-center justify-center border border-slate-200 rounded-[2rem] border-dashed bg-white p-8 text-center shadow-sm">
              <Zap className="h-10 w-10 text-[#0e467f]/30 mb-3" />
              <p className="text-slate-500 font-bold mb-1">Selecione um terminal ativo</p>
              <p className="text-xs text-slate-400 max-w-sm">Os botões interativos e telemetrias serão habilitados após a detecção de integridade</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Comandos operacionais disponíveis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <CommandCard 
                  icon={<Play className="h-5 w-5" />}
                  title="Iniciar Recarga"
                  description="RemoteStartTransaction"
                  actionText="Iniciar"
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
                  actionText="Parar"
                  active={isOnline}
                  danger
                  onClick={() => triggerCommand(
                    "Parar Recarga", 
                    { transactionId: "Automático (buscar transação ativa)" }, 
                    () => stopCharging(selectedCharger.id) 
                  )}
                />
                
                <CommandCard 
                  icon={<RefreshCw className="h-5 w-5" />}
                  title="Reset Soft"
                  description="Reinicia o firmware operacional de forma segura"
                  actionText="Reiniciar"
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
                  description="Força o ciclo de energia completo do hardware"
                  actionText="Ciclar"
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
                  description="UnlockConnector - Libera fisicamente o plug de recarga"
                  actionText="Liberar"
                  active={isOnline}
                  pending
                  onClick={() => {}}
                />
                
                <CommandCard 
                  icon={<Settings className="h-5 w-5" />}
                  title="Alterar Disponibilidade"
                  description="ChangeAvailability - Altera o status operacional da estação"
                  actionText="Configurar"
                  active={isOnline}
                  pending
                  onClick={() => {}}
                />
                
                <CommandCard 
                  icon={<Settings className="h-5 w-5" />}
                  title="Obter Configuração"
                  description="GetConfiguration - Requisite os parâmetros de chaves OCPP"
                  actionText="Solicitar"
                  active={isOnline}
                  pending
                  onClick={() => {}}
                />
                
                <CommandCard 
                  icon={<RefreshCw className="h-5 w-5" />}
                  title="Limpar Cache"
                  description="ClearCache - Apaga o histórico local do token de recarga"
                  actionText="Limpar"
                  active={isOnline}
                  pending
                  onClick={() => {}}
                />
              </div>
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

function CommandCard({ icon, title, description, actionText, active, danger, pending, onClick }: any) {
  let baseClasses = "flex flex-col p-5 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden ";
  
  if (!active || pending) {
    baseClasses += "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed";
  } else if (danger) {
    baseClasses += "bg-white border-red-100 hover:border-red-300 hover:shadow-md cursor-pointer";
  } else {
    baseClasses += "bg-white border-slate-200 hover:border-[#0e467f]/30 hover:shadow-md cursor-pointer shadow-sm";
  }

  const handlePress = (e: React.MouseEvent) => {
    e.preventDefault();
    if (active && !pending && onClick) {
      onClick();
    }
  };

  return (
    <div className={baseClasses} onClick={handlePress}>
      <div className="flex items-start justify-between mb-4">
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${danger && active && !pending ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-slate-50 border border-slate-100 text-[#0e467f]'}`}>
          {icon}
        </div>
        {pending ? (
          <span className="bg-slate-100 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full text-slate-500 border border-slate-200">
            Pendente
          </span>
        ) : active ? (
          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${danger ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {actionText || 'Pronto'}
          </span>
        ) : (
          <span className="bg-slate-100 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full text-slate-400 border border-slate-200">
            Offline
          </span>
        )}
      </div>
      
      <h3 className={`font-extrabold text-sm ${danger && active && !pending ? 'text-red-700' : 'text-slate-900'}`}>{title}</h3>
      <p className="text-slate-500 text-xs mt-1 leading-relaxed font-semibold">{description}</p>
    </div>
  );
}
