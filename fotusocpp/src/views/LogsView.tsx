import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';
import { OcppEvent } from '../types';
import { RefreshCcw, Code, ArrowRightLeft, Search, Activity, Cpu, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function LogsView() {
  const [logs, setLogs] = useState<OcppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCharger, setFilterCharger] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadData = async () => {
    const data = await getEvents();
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterCharger && !log.charge_point_id?.toLowerCase().includes(filterCharger.toLowerCase())) return false;
    if (filterAction && !log.action?.toLowerCase().includes(filterAction.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800 bg-[#f4f7fc]">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
            <Activity className="h-7 w-7 text-brand-yellow animate-pulse" />
            Logs de Barramento
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Tráfego de frames OCPP brutos e callbacks em tempo real</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] text-slate-700 hover:text-[#0e467f] hover:bg-[#f4f7fc] rounded-full transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCcw className={`h-4 w-4 text-[#0e467f] ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar por nome da estação..." 
            value={filterCharger}
            onChange={e => setFilterCharger(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:border-[#0e467f] focus:ring-1 focus:ring-[#0e467f] shadow-sm transition-all placeholder-slate-400"
          />
        </div>
        <div className="relative flex-1">
          <Code className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar por ação (Ex: Transação)..." 
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:border-[#0e467f] focus:ring-1 focus:ring-[#0e467f] shadow-sm transition-all placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredLogs.length === 0 && !loading ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[2rem] border-dashed p-8 shadow-sm">
            <ArrowRightLeft className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold">Nenhum evento detectado</p>
            <p className="text-xs text-slate-400 text-center mt-1">Aguardando telemetrias ou verifique o filtro selecionado</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isOut = log.direction === 'OUT';
            const timestamp = new Date(log.created_at || log.data_hora || log.timestamp || Date.now()).toLocaleString();
            let parsedPayload = log.payload;
            if (typeof log.payload === 'string') {
              try { parsedPayload = JSON.parse(log.payload); } catch (e) {}
            }

            return (
              <div key={log.id || idx} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 ${isOut ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                      {isOut ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      {log.direction || 'IN'}
                    </span>
                    <span className="font-extrabold text-[#0e467f] text-sm">{log.action || 'Desconhecido'}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{log.charge_point_id}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{timestamp}</span>
                    <Cpu className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </div>
                
                <div className="p-6 bg-slate-900 overflow-x-auto text-xs font-mono text-slate-300 shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(parsedPayload, null, 2)}</pre>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
