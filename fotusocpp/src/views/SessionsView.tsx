import React, { useState, useEffect } from 'react';
import { getSessions, stopCharging } from '../services/api';
import { Session } from '../types';
import { BatteryCharging, RefreshCcw, Zap, Clock, Square, Play } from 'lucide-react';
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
    const res = await stopCharging(selectedSession.charge_point_id, selectedSession.transaction_id);
    setIsSending(false);
    setResult(res);
    if (res.success) {
      loadData();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800 bg-[#f4f7fc]">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
            <Clock className="h-7 w-7 text-brand-yellow" />
            Sessões OCPP
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitore e gerencie transações de recargas em andamento</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] text-slate-700 hover:text-[#0e467f] hover:bg-[#f4f7fc] rounded-full transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCcw className={`h-4 w-4 text-[#0e467f] ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm overflow-hidden">
        
        {sessions.length === 0 && !loading ? (
           <div className="py-16 flex flex-col items-center justify-center text-center">
             <BatteryCharging className="h-12 w-12 text-[#0e467f]/30 mb-3" />
             <p className="text-slate-600 font-bold text-sm">Nenhuma sessão encontrada</p>
             <p className="text-xs text-slate-400 mt-1">Conecte um veículo para iniciar as medições OCPP</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[#0e467f] text-xs uppercase tracking-widest font-extrabold">
                  <th className="py-4 px-4 pl-6">Estação Fotus</th>
                  <th className="py-4 px-4">Transação ID</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Energia Entregue</th>
                  <th className="py-4 px-4">Duração</th>
                  <th className="py-4 px-4 pr-6 text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s, idx) => {
                  const isActive = s.status === 'in_progress' || s.status === 'Charging' || s.ended_at === null;
                  const start = new Date(s.started_at);
                  const end = s.ended_at ? new Date(s.ended_at) : new Date();
                  const durationMins = Math.floor((end.getTime() - start.getTime()) / 60000);

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-4 pl-6">
                        <div className="font-extrabold text-slate-950 text-sm">{s.charge_point_id}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 font-bold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md inline-block">Conector {s.connector_id}</div>
                      </td>
                      <td className="py-5 px-4 text-xs font-mono font-bold text-slate-500">#{s.transaction_id}</td>
                      <td className="py-5 px-4">
                        <span className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-full border ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {isActive ? 'Ativa' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-sm font-mono text-slate-800 flex items-center gap-1 font-bold">
                          {s.energy_kwh !== undefined ? Number(s.energy_kwh).toFixed(2) : '0.00'}
                          <span className="text-slate-400 text-xs font-bold font-sans">kWh</span>
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold font-mono">
                          <Clock className="h-4 w-4 text-[#0e467f]/70" />
                          {durationMins} min
                        </span>
                      </td>
                      <td className="py-5 px-4 pr-6 text-right">
                        {isActive && (
                          <button 
                            onClick={() => handleStop(s)}
                            className="bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ml-auto shadow-sm active:scale-95"
                          >
                            <Square className="h-3 w-3 fill-current" />
                            Parar
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
