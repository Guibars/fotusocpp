import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';
import { OcppEvent } from '../types';
import { RefreshCcw, Code, ArrowRightLeft, Search, Activity } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-blue" />
            Logs OCPP
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tráfego bruto da comunicação websocket</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar por ID do Carregador..." 
            value={filterCharger}
            onChange={e => setFilterCharger(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          />
        </div>
        <div className="relative flex-1">
          <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filtrar por Ação (ex: Heartbeat)..." 
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredLogs.length === 0 && !loading ? (
          <div className="py-12 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl border-dashed">
            <ArrowRightLeft className="h-6 w-6 text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">Nenhum evento registrado.</p>
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
              <div key={log.id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isOut ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {log.direction || 'IN'}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{log.action || 'Unknown'}</span>
                    <span className="text-xs font-mono text-slate-500 border-l border-slate-200 pl-3">{log.charge_point_id}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{timestamp}</span>
                </div>
                <div className="p-4 bg-white overflow-x-auto text-[11px] font-mono text-slate-600">
                  <pre>{JSON.stringify(parsedPayload, null, 2)}</pre>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
