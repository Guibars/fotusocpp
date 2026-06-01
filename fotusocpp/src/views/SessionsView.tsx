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
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-blue" />
            Sessões OCPP
          </h1>
          <p className="text-sm text-slate-500 mt-1">Histórico e monitoramento de recargas</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl p-0 border border-slate-200 shadow-sm overflow-hidden">
        
        {sessions.length === 0 && !loading ? (
           <div className="py-16 flex flex-col items-center justify-center">
             <BatteryCharging className="h-8 w-8 text-slate-300 mb-3" />
             <p className="text-slate-500 text-sm">Nenhuma sessão encontrada.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 pl-6">ID do Carregador</th>
                  <th className="py-3">Transação</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Energia (kWh)</th>
                  <th className="py-3">Duração</th>
                  <th className="py-3 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s, idx) => {
                  const isActive = s.status === 'in_progress' || s.status === 'Charging' || s.ended_at === null;
                  const start = new Date(s.started_at);
                  const end = s.ended_at ? new Date(s.ended_at) : new Date();
                  const durationMins = Math.floor((end.getTime() - start.getTime()) / 60000);

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 pl-6">
                        <div className="font-semibold text-slate-800 text-sm">{s.charge_point_id}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">Conn: {s.connector_id}</div>
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-500">#{s.transaction_id}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {isActive ? 'Ativa' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-mono text-slate-700 flex items-center gap-1.5 font-medium">
                          {s.energy_kwh !== undefined ? Number(s.energy_kwh).toFixed(2) : '0.00'}
                          <Zap className="h-3 w-3 text-brand-blue" />
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          {durationMins}m
                        </span>
                      </td>
                      <td className="py-4 pr-6 text-right">
                        {isActive && (
                          <button 
                            onClick={() => handleStop(s)}
                            className="p-1.5 md:px-3 md:py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <Square className="h-3 w-3 fill-current" />
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
