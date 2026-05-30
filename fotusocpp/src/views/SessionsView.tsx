import React, { useState, useEffect } from 'react';
import { getSessions, stopCharging } from '../services/api';
import { Session } from '../types';
import { BatteryCharging, RefreshCcw, Zap, Clock, Square } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function SessionsView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  const loadData = async () => {
    const data = await getSessions();
    if (data) {
      setSessions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStop = (session: Session) => {
    setSelectedSession(session);
    setResult(null);
    setModalOpen(true);
  };

  const confirmStop = async () => {
    if (!selectedSession) return;
    setIsSending(true);
    // Find the charger id from charge_point_id if possible, 
    // Wait, the API takes chargerId (the uuid usually). Is charge_point_id the ID we need to pass?
    // Let's assume the API expects the charger ID or we can just pass the charge_point_id as the ID.
    // If the backend accepts charge_point_id as the :id parameter or if session.charger_id was available. 
    // Assuming backend stop endpoint expects the same ID used in Start/Reset.
    const res = await stopCharging(selectedSession.charge_point_id, selectedSession.transaction_id);
    setIsSending(false);
    setResult(res);
    if (res.success) {
      loadData();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 custom-scrollbar relative z-10 w-full h-full text-zinc-100">
      
      <div className="flex items-center justify-between mb-10 pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sessões OCPP</h1>
          <p className="text-zinc-500 mt-1">Histórico e monitoramento de recargas</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-300">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="bg-zinc-900/40 rounded-[2.5rem] p-6 border border-zinc-800/60 glass-panel">
        
        {sessions.length === 0 && !loading ? (
           <div className="py-16 flex flex-col items-center justify-center">
             <BatteryCharging className="h-10 w-10 text-zinc-700 mb-4" />
             <p className="text-zinc-400">Nenhuma sessão encontrada.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-4 pt-2 pl-4">ID do Carregador</th>
                  <th className="pb-4 pt-2">Transação</th>
                  <th className="pb-4 pt-2">Status</th>
                  <th className="pb-4 pt-2">Energia (kWh)</th>
                  <th className="pb-4 pt-2">Duração</th>
                  <th className="pb-4 pt-2 pr-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sessions.map((s, idx) => {
                  const isActive = s.status === 'in_progress' || s.status === 'Charging' || s.ended_at === null;
                  const start = new Date(s.started_at);
                  const end = s.ended_at ? new Date(s.ended_at) : new Date();
                  const durationMins = Math.floor((end.getTime() - start.getTime()) / 60000);

                  return (
                    <tr key={s.id || idx} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="py-4 pl-4">
                        <div className="font-medium text-white">{s.charge_point_id}</div>
                        <div className="text-xs text-zinc-500 font-mono">Conn: {s.connector_id}</div>
                      </td>
                      <td className="py-4 text-sm font-mono text-zinc-400">#{s.transaction_id}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${isActive ? 'bg-blue-950/30 text-brand-blue border-blue-500/30' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'}`}>
                          {isActive ? 'Ativa' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-base font-mono text-white flex items-center gap-1.5">
                          {s.energy_kwh !== undefined ? Number(s.energy_kwh).toFixed(2) : '0.00'}
                          <Zap className="h-3 w-3 text-brand-neon" />
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-zinc-400 flex items-center gap-1.5 font-mono">
                          <Clock className="h-3 w-3" />
                          {durationMins}m
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        {isActive && (
                          <button 
                            onClick={() => handleStop(s)}
                            className="p-2 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 text-brand-red border border-red-500/20 rounded-full text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                          >
                            <Square className="h-4 w-4 fill-current" />
                            <span className="hidden md:inline">Parar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Parar Sessão"
        payload={{ transactionId: selectedSession?.transaction_id, chargePointId: selectedSession?.charge_point_id }}
        onConfirm={confirmStop}
        isSending={isSending}
        result={result}
      />
    </div>
  );
}
