import React, { useState, useEffect } from 'react';
import { getMeterValues } from '../services/api';
import { MeterValue } from '../types';
import { RefreshCcw, Activity } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-blue" />
            Medições
          </h1>
          <p className="text-sm text-slate-500 mt-1">Valores de leitura de medidores</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-0">
        
        {meters.length === 0 && !loading ? (
           <div className="py-16 flex flex-col items-center justify-center border-dashed border border-slate-200 m-4 rounded-xl bg-slate-50">
             <Activity className="h-8 w-8 text-slate-300 mb-3" />
             <p className="text-slate-500 text-sm">Nenhuma medição encontrada.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 pl-6">Timestamp</th>
                  <th className="py-3">ID do Carregador</th>
                  <th className="py-3">Transação</th>
                  <th className="py-3">Energia (kWh)</th>
                  <th className="py-3">Potência (kW)</th>
                  <th className="py-3">Tensão (V)</th>
                  <th className="py-3 pr-6">Corrente (A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meters.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="py-3.5 pl-6 text-xs font-mono text-slate-500">{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{m.charge_point_id}</td>
                    <td className="py-3.5 text-xs font-mono text-slate-500">#{m.transaction_id}</td>
                    <td className="py-3.5 font-mono font-medium text-brand-blue">{m.energia_kwh !== undefined ? Number(m.energia_kwh).toFixed(3) : '-'}</td>
                    <td className="py-3.5 font-mono text-slate-700">{m.potencia_kw !== undefined ? Number(m.potencia_kw).toFixed(2) : '-'}</td>
                    <td className="py-3.5 font-mono text-slate-700">{m.tensao_v !== undefined ? Number(m.tensao_v).toFixed(1) : '-'}</td>
                    <td className="py-3.5 font-mono text-slate-700 pr-6">{m.corrente_a !== undefined ? Number(m.corrente_a).toFixed(2) : '-'}</td>
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
