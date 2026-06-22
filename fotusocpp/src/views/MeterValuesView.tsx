import React, { useState, useEffect } from 'react';
import { getMeterValues } from '../services/api';
import { MeterValue } from '../types';
import { RefreshCcw, Activity, Gauge, Zap } from 'lucide-react';

export default function MeterValuesView() {
  const [meters, setMeters] = useState<MeterValue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const data = await getMeterValues();
    if (data) setMeters(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800 bg-[#f4f7fc]">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
            <Gauge className="h-7 w-7 text-brand-yellow" />
            Telemetria de Potência
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Valores instantâneos coletados diretamente dos sensores internos dos carregadores</p>
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
        
        {meters.length === 0 && !loading ? (
           <div className="py-16 flex flex-col items-center justify-center text-center">
             <Activity className="h-12 w-12 text-[#0e467f]/30 mb-3" />
             <p className="text-slate-600 font-bold text-sm">Nenhuma informação de telemetria registrada</p>
             <p className="text-xs text-slate-400 mt-1">As medições de tensão, corrente e potência aparecerão após transações iniciadas</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[#0e467f] text-xs uppercase tracking-widest font-extrabold">
                  <th className="py-4 px-4 pl-6">Momento</th>
                  <th className="py-4 px-4">Estação</th>
                  <th className="py-4 px-4">Transação</th>
                  <th className="py-4 px-4">Instantâneo (kW)</th>
                  <th className="py-4 px-4">Energia (kWh)</th>
                  <th className="py-4 px-4">Tensão (V)</th>
                  <th className="py-4 px-4 pr-6">Corrente (A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meters.slice(0, 50).map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-800">
                    <td className="py-4 px-4 pl-6 text-xs font-mono text-slate-400 font-medium">
                      {m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-[#0e467f] font-extrabold">{m.charge_point_id}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-500 font-medium">#{m.transaction_id}</td>
                    <td className="py-4 px-4 font-mono font-extrabold text-slate-900 group-hover:text-[#0e467f]">
                      {m.potencia_kw !== undefined ? Number(m.potencia_kw).toFixed(2) : '-'} <span className="text-[10px] text-slate-400 font-sans">kW</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[#0e467f] font-extrabold">
                      {m.energia_kwh !== undefined ? Number(m.energia_kwh).toFixed(3) : '-'} <span className="text-[10px] text-slate-400 font-sans">kWh</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 font-bold">
                      {m.tensao_v !== undefined ? Number(m.tensao_v).toFixed(1) : '-'} <span className="text-[10px] text-slate-400 font-sans">V</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 font-bold pr-6">
                      {m.corrente_a !== undefined ? Number(m.corrente_a).toFixed(2) : '-'} <span className="text-[10px] text-slate-400 font-sans">A</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
