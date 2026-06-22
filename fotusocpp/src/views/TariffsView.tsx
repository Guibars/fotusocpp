import React, { useState, useEffect } from 'react';
import { getTariffs, getCurrentTariff, updateCurrentTariff, getTariffEstimate } from '../services/api';
import { Tariff } from '../types';
import { 
  RefreshCcw, 
  DollarSign, 
  CheckCircle, 
  Award, 
  Shield, 
  Zap, 
  Clock, 
  Globe, 
  Calculator, 
  AlertCircle, 
  TrendingUp, 
  Check 
} from 'lucide-react';

export default function TariffsView() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Edit Form States
  const [priceInput, setPriceInput] = useState<string>('4.44');
  const [nameInput, setNameInput] = useState<string>('Teste Atual');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estimate States
  const [energyKwh, setEnergyKwh] = useState<string>('10');
  const [estimation, setEstimation] = useState<any | null>(null);
  const [estimating, setEstimating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([getTariffs(), getCurrentTariff()]);
      if (t) setTariffs(t);
      if (c) {
        setCurrent(c);
        // Pre-fill form with current info
        setPriceInput(String(c.pricePerKwh || ''));
        setNameInput(c.name || '');
      }
    } catch (e) {
      console.error("Failed to load tariffs data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch estimate whenever energyKwh or current tariff changes
  useEffect(() => {
    let active = true;
    const fetchEstimate = async () => {
      const energy = parseFloat(energyKwh);
      if (!isNaN(energy) && energy > 0) {
        setEstimating(true);
        try {
          const res = await getTariffEstimate(energy);
          if (active) {
            setEstimation(res);
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (active) setEstimating(false);
        }
      } else {
        setEstimation(null);
      }
    };

    const timer = setTimeout(fetchEstimate, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [energyKwh, current]);

  const handleUpdateCurrentTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      setUpdateMessage({ type: 'error', text: 'Por favor, insira um preço válido.' });
      return;
    }
    if (!nameInput.trim()) {
      setUpdateMessage({ type: 'error', text: 'Por favor, insira um nome de identificação.' });
      return;
    }

    setIsUpdating(true);
    setUpdateMessage(null);
    try {
      const response = await updateCurrentTariff(price, nameInput);
      if (response && response.success !== false) {
        setUpdateMessage({ type: 'success', text: 'Tarifa atualizada com sucesso!' });
        // Refresh local current state
        const updatedCurrent = await getCurrentTariff();
        if (updatedCurrent) {
          setCurrent(updatedCurrent);
        }
        // Refresh full lists too
        const fullTariffs = await getTariffs();
        if (fullTariffs) setTariffs(fullTariffs);
      } else {
        setUpdateMessage({ type: 'error', text: response?.message || response?.error || 'Erro ao atualizar tarifa.' });
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Não foi possível conectar ao servidor.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800 bg-[#f4f7fc]">
      
      {/* Header section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-brand-yellow animate-pulse" />
            Tabelas Tributárias
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Gestão de preços por kilowatt-hora (kWh) das estações fotovoltaicas Fotus</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] text-slate-700 hover:text-[#0e467f] hover:bg-[#f4f7fc] rounded-full transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCcw className={`h-4 w-4 text-[#0e467f] ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: TARIFF INFO / LISTS & API METADATA (Timezone & Server Hour) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Tariff Highlight & Time/Zone Metadata */}
          <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0e467f]/5 rounded-full blur-2xl"></div>
            
            <h2 className="text-xs font-extrabold text-[#0e467f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Tarifa Corrente Ativada
            </h2>

            {current ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Identificação</span>
                  <p className="text-2xl font-extrabold text-slate-900">{current.name || 'Padrão'}</p>
                  
                  <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-black font-mono text-[#0e467f]">
                      R$ {Number(current.pricePerKwh || 0).toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-1">/ kWh</span>
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[e2e8f0] rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-slate-400" />
                      Fuso Horário (Timezone)
                    </span>
                    <p className="text-xs font-semibold text-slate-700 font-mono mt-0.5">
                      {current.timezone || 'America/Sao_Paulo (Auto)'}
                    </p>
                  </div>
                  <div className="border-t border-slate-200/50 pt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Hora Atual do Barramento
                    </span>
                    <p className="text-xs font-extrabold text-[#0e467f] font-mono mt-0.5">
                      {current.currentHour || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-sm">Carregando tarifa corrente...</div>
            )}
          </div>

          {/* Quick Tariff List */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Histórico de Tabelas Disponíveis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tariffs.map(tariff => {
                const isCurrent = current?.id === tariff.id || current?.name === tariff.name;
                return (
                  <div 
                    key={tariff.id || tariff.name} 
                    className={`bg-white border p-6 rounded-[2rem] flex flex-col justify-between transition-all group hover:shadow h-44 ${isCurrent ? 'border-[#0e467f] shadow-[0_0_15px_rgba(14,70,127,0.05)]' : 'border-[#e2e8f0]'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${isCurrent ? 'bg-blue-50 border-blue-100 text-[#0e467f]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      {isCurrent && (
                        <span className="text-[8px] uppercase tracking-widest font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Corrente
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">{tariff.name}</h4>
                      <p className="text-2xl font-extrabold text-[#0e467f] font-mono mt-1">
                        R$ {Number(tariff.pricePerKwh).toFixed(2)} <span className="text-[10px] text-slate-400 font-sans font-medium">/ kWh</span>
                      </p>
                    </div>
                  </div>
                );
              })}

              {tariffs.length === 0 && !loading && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[2rem] border-dashed text-center shadow-inner">
                  <Shield className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-500 font-bold text-sm">Nenhuma tabela cadastrada</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: QUICK PRICE PATCH FORM & ENERGY CALCULATOR */}
        <div className="space-y-6">
          
          {/* 1. Quick Change Current Pricing (PATCH /api/tariffs/current) */}
          <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm">
            <h2 className="text-xs font-extrabold text-[#0e467f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-yellow" />
              Alteração Rápida (PATCH)
            </h2>
            
            <form onSubmit={handleUpdateCurrentTariff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Preço do kWh (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="4.44"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0e467f] text-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#0e467f] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome/Identificação da Tarifa</label>
                <input 
                  type="text" 
                  placeholder="Teste Atual"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0e467f] text-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#0e467f] transition-all"
                />
              </div>

              {updateMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${updateMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {updateMessage.type === 'success' ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{updateMessage.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full py-3 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-50 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {isUpdating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvar Preço Atual (PATCH)
              </button>
            </form>
          </div>

          {/* 2. Charging Estimator Simulator (GET /api/tariffs/estimate?energyKwh=10) */}
          <div className="bg-gradient-to-tr from-[#fab515]/10 to-amber-500/5 p-6 rounded-[2rem] border border-amber-200/50 shadow-sm">
            <h2 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-600" />
              Calculadora de Faturamento
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Simular Carga de Energia (kWh)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="10"
                    value={energyKwh}
                    onChange={e => setEnergyKwh(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-400 text-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] uppercase">kWh</span>
                </div>
              </div>

              {estimating ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                  <RefreshCcw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  Calculando estimativa de tarifa...
                </div>
              ) : estimation ? (
                <div className="bg-white/80 border border-amber-200/50 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Tarifa Aplicada</span>
                    <span className="text-slate-700 font-extrabold">{estimation.tariffName || current?.name || 'Padrão'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Energia Solicitada</span>
                    <span className="text-slate-700 font-mono font-bold">{Number(estimation.energyKwh || energyKwh).toFixed(1)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Valor por kWh</span>
                    <span className="text-slate-700 font-mono font-bold">R$ {Number(estimation.pricePerKwh || current?.pricePerKwh || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-500 uppercase">Custo Estimado</span>
                    <span className="text-xl font-mono text-emerald-600 font-black">
                      R$ {Number(estimation.estimatedCost || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/40 border border-slate-200 border-dashed rounded-2xl text-center text-xs text-slate-400 font-medium leading-relaxed">
                  Digite uma quantidade de energia para simular o faturamento teórico em tempo real.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
