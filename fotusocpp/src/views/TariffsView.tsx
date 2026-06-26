import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calculator, Check, Clock, ReceiptText, RefreshCcw, WalletCards, Zap } from 'lucide-react';
import { Tariff } from '../types';
import { getCurrentTariff, getTariffEstimate, getTariffs, updateCurrentTariff } from '../services/api';

export default function TariffsView() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [energyKwh, setEnergyKwh] = useState('10');
  const [estimation, setEstimation] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [tariffsData, currentData] = await Promise.all([getTariffs(), getCurrentTariff()]);
    if (tariffsData) setTariffs(tariffsData);
    if (currentData) {
      setCurrent(currentData);
      setPriceInput(String(currentData.pricePerKwh ?? ''));
      setNameInput(currentData.name || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const energy = Number(energyKwh);
      if (!Number.isFinite(energy) || energy <= 0) {
        setEstimation(null);
        return;
      }

      setEstimating(true);
      const result = await getTariffEstimate(energy);
      if (active) {
        setEstimation(result);
        setEstimating(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [energyKwh, current]);

  const currentPrice = Number(current?.pricePerKwh || 0);
  const averagePrice = useMemo(() => {
    if (!tariffs.length) return 0;
    return tariffs.reduce((total, tariff) => total + Number(tariff.pricePerKwh || 0), 0) / tariffs.length;
  }, [tariffs]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(priceInput);

    if (!Number.isFinite(price) || price < 0) {
      setMessage({ type: 'error', text: 'Informe um valor de kWh valido.' });
      return;
    }

    if (!nameInput.trim()) {
      setMessage({ type: 'error', text: 'Informe um nome para a tarifa.' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    const response = await updateCurrentTariff(price, nameInput.trim());
    setIsUpdating(false);

    if (response?.success !== false) {
      setMessage({ type: 'success', text: 'Tarifa de faturamento atualizada no backend.' });
      await loadData();
    } else {
      setMessage({ type: 'error', text: response?.message || response?.error || 'Nao foi possivel atualizar a tarifa.' });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0e467f]">Faturamento</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Tarifas do backend</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              A tarifa aqui alimenta calculo de sessoes e estimativas financeiras. Configuracao fisica do carregador deve passar por comando OCPP suportado pelo equipamento.
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#0e467f]/30 hover:text-[#0e467f]"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tarifa atual" value={`R$ ${currentPrice.toFixed(2)}`} detail={current?.name || 'Sem identificacao'} icon={<ReceiptText className="h-5 w-5" />} />
          <SummaryCard label="Tabelas" value={tariffs.length} detail="cadastradas no backend" icon={<WalletCards className="h-5 w-5" />} />
          <SummaryCard label="Media" value={`R$ ${averagePrice.toFixed(2)}`} detail="por kWh nas tabelas" icon={<Zap className="h-5 w-5" />} />
          <SummaryCard label="Estimativa 10 kWh" value={`R$ ${Number(estimation?.estimatedCost || currentPrice * 10).toFixed(2)}`} detail="calculada via API" icon={<Calculator className="h-5 w-5" />} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-base font-black text-slate-950">Tabelas cadastradas</h3>
              <p className="text-sm font-medium text-slate-500">Dados lidos de /api/tariffs.</p>
            </div>

            {tariffs.length === 0 && !loading ? (
              <div className="p-10 text-center">
                <WalletCards className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">Nenhuma tarifa cadastrada</p>
              </div>
            ) : (
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {tariffs.map(tariff => {
                  const isCurrent = current?.id === tariff.id || current?.name === tariff.name;
                  return (
                    <div
                      key={tariff.id || tariff.name}
                      className={`rounded-lg border p-4 ${
                        isCurrent ? 'border-[#0e467f] bg-blue-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{tariff.name}</p>
                          <p className="mt-1 text-2xl font-black text-[#0e467f]">R$ {Number(tariff.pricePerKwh || 0).toFixed(2)}</p>
                        </div>
                        {isCurrent && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                            Corrente
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {tariff.startHour ?? 0}:00 - {tariff.endHour ?? 24}:00
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-slate-950">Alterar tarifa corrente</h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">PATCH /api/tariffs/current</p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nome</label>
                  <input
                    value={nameInput}
                    onChange={event => setNameInput(event.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0e467f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Preco por kWh</label>
                  <div className="mt-1 flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-[#0e467f]">
                    <span className="text-sm font-black text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={priceInput}
                      onChange={event => setPriceInput(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent pl-2 text-sm font-black text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {message && (
                  <div
                    className={`flex gap-2 rounded-lg border p-3 text-sm font-semibold ${
                      message.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0e467f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#083969] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Salvar tarifa
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-slate-950">Estimativa de custo</h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">GET /api/tariffs/estimate</p>
              <div className="mt-5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Energia em kWh</label>
                <input
                  type="number"
                  value={energyKwh}
                  onChange={event => setEnergyKwh(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0e467f]"
                />
              </div>
              <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</p>
                {estimating ? (
                  <p className="mt-2 text-sm font-semibold text-slate-300">Calculando...</p>
                ) : estimation ? (
                  <>
                    <p className="mt-2 text-2xl font-black">R$ {Number(estimation.estimatedCost || 0).toFixed(2)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {Number(estimation.energyKwh || 0).toFixed(2)} kWh a R$ {Number(estimation.pricePerKwh || 0).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-300">Informe um valor valido.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-[#0e467f]">{icon}</div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}
