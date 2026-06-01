import React, { useState, useEffect } from 'react';
import { getTariffs, getCurrentTariff } from '../services/api';
import { Tariff } from '../types';
import { RefreshCcw, DollarSign, Zap, CheckCircle } from 'lucide-react';

export default function TariffsView() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [current, setCurrent] = useState<Tariff | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([getTariffs(), getCurrentTariff()]);
    if (t) setTariffs(t);
    if (c) setCurrent(c);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-brand-blue" />
            Tarifas
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de preços de energia</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 shadow-sm">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tariffs.map(tariff => {
          const isCurrent = current?.id === tariff.id || current?.name === tariff.name;
          return (
            <div key={tariff.id || tariff.name} className={`relative bg-white border ${isCurrent ? 'border-brand-blue shadow-[0_0_0_1px_rgba(0,105,255,0.2)]' : 'border-slate-200 shadow-sm'} p-5 rounded-xl flex flex-col transition-all group hover:shadow-md`}>
              {isCurrent && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <CheckCircle className="h-3 w-3" /> Atual
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900 mb-2">{tariff.name}</h3>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-emerald-600 font-mono">R$ {Number(tariff.pricePerKwh).toFixed(2)}</span>
                <span className="text-slate-500 text-sm font-medium">/ kWh</span>
              </div>
            </div>
          );
        })}
        {tariffs.length === 0 && !loading && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl border-dashed">
            <DollarSign className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma tarifa encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
