import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';
import { OcppEvent } from '../types';
import { RefreshCcw, Code, ArrowRightLeft, Search } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 custom-scrollbar relative z-10 w-full h-full text-zinc-100">
      
      <div className="flex items-center justify-between mb-10 pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Logs OCPP</h1>
          <p className="text-zinc-500 mt-1">Tráfego bruto da comunicação websocket</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-300">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Filtrar por ID do Carregador..." 
            value={filterCharger}
            onChange={e => setFilterCharger(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-zinc-600 glass-panel"
          />
        </div>
        <div className="relative flex-1">
          <Code className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Filtrar por Ação (ex: Heartbeat)..." 
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-zinc-600 glass-panel"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.length === 0 && !loading ? (
          <div className="py-16 flex flex-col items-center justify-center bg-zinc-900/20 border border-zinc-800/50 rounded-3xl border-dashed">
            <ArrowRightLeft className="h-8 w-8 text-zinc-700 mb-4" />
            <p className="text-zinc-400">Nenhum evento registrado.</p>
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
              <div key={log.id || idx} className="bg-zinc-900/60 border border-zinc-800/60 rounded-3xl overflow-hidden glass-panel">
                <div className="px-5 py-4 bg-zinc-950/50 border-b border-zinc-800/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${isOut ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {log.direction || 'IN'}
                    </span>
                    <span className="font-bold text-white tracking-wide">{log.action || 'Unknown'}</span>
                    <span className="text-xs font-mono text-zinc-500 border-l border-zinc-800 pl-4">{log.charge_point_id}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{timestamp}</span>
                </div>
                <div className="p-5 bg-zinc-950 overflow-x-auto text-sm font-mono text-zinc-300">
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
