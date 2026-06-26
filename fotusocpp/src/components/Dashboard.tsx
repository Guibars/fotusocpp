import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Clock,
  Play,
  PlugZap,
  RefreshCcw,
  Server,
  Square,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { Charger, ChargerStats, OcppEvent } from '../types';
import { getChargers, getEvents, getStats, resetCharger, startCharging, stopCharging } from '../services/api';

type Notice = {
  type: 'success' | 'error' | 'info';
  text: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<ChargerStats | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [events, setEvents] = useState<OcppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadData = async (initial = false) => {
    if (!initial) setSyncing(true);
    const [statsData, chargersData, eventsData] = await Promise.all([getStats(), getChargers(), getEvents(8)]);

    if (statsData) setStats(statsData);
    if (chargersData) setChargers(chargersData);
    if (eventsData) setEvents(eventsData);

    setLoading(false);
    setSyncing(false);
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    const online = stats?.chargersOnline ?? chargers.filter(charger => charger.status === 'Online').length;
    const offline = stats?.chargersOffline ?? Math.max(0, chargers.length - online);
    const activeSessions = stats?.activeSessions ?? 0;
    const energy = Number(stats?.totalEnergyConsumed || 0);
    const revenue = Number(stats?.sessions?.totalRevenue || 0);
    const currentTariff = Number(stats?.tariff?.pricePerKwh || 0);

    return { online, offline, activeSessions, energy, revenue, currentTariff };
  }, [chargers, stats]);

  const runAction = async (label: string, action: () => Promise<any>) => {
    setNotice({ type: 'info', text: `${label}: enviando comando...` });
    const result = await action();
    const ok = result?.success !== false;
    setNotice({
      type: ok ? 'success' : 'error',
      text: ok ? `${label}: comando aceito pelo backend.` : `${label}: ${result?.message || result?.error || 'falha no comando.'}`,
    });
    await loadData(false);
  };

  if (loading) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-7 text-center shadow-sm">
          <RefreshCcw className="mx-auto h-8 w-8 animate-spin text-[#0e467f]" />
          <p className="mt-4 text-sm font-bold text-slate-700">Sincronizando operacao OCPP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-7 grid gap-6 rounded-[2.25rem] bg-[#e3e4e9] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:p-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Operacao em tempo real</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Olá, João!</h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">
              Dados lidos do backend OCPP: carregadores, conectores, sessoes, tarifa atual e eventos recentes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-[1.6rem] bg-white/75 px-5 py-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Online</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{totals.online}</p>
            </div>
            <div className="rounded-[1.6rem] bg-white/75 px-5 py-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Sessoes</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{totals.activeSessions}</p>
            </div>
            <button
              onClick={() => loadData(false)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <RefreshCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-[1.5rem] border p-4 text-sm font-semibold ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : notice.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {notice.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Online"
            value={totals.online}
            detail={`${totals.offline} offline`}
            icon={<Wifi className="h-5 w-5" />}
            tone="blue"
          />
          <MetricCard
            label="Sessoes ativas"
            value={totals.activeSessions}
            detail="transacoes em carga"
            icon={<BatteryCharging className="h-5 w-5" />}
            tone="green"
          />
          <MetricCard
            label="Energia total"
            value={`${totals.energy.toFixed(2)} kWh`}
            detail="somatorio registrado"
            icon={<Zap className="h-5 w-5" />}
            tone="amber"
          />
          <MetricCard
            label="Tarifa atual"
            value={`R$ ${totals.currentTariff.toFixed(2)}`}
            detail={stats?.tariff?.name || 'sem tarifa corrente'}
            icon={<Server className="h-5 w-5" />}
            tone="slate"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-white/70 bg-white/72 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">Carregadores</h3>
                <p className="text-sm font-medium text-slate-500">Acoes abaixo chamam rotas reais do backend.</p>
              </div>
              <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                {chargers.length} registrados
              </span>
            </div>

            {chargers.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200/60 bg-transparent text-xs font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Carregador</th>
                      <th className="px-5 py-3">Conector</th>
                      <th className="px-5 py-3">Ultimo heartbeat</th>
                      <th className="px-5 py-3 text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chargers.map(charger => {
                      const connector = charger.connectors?.[0];
                      const online = charger.status === 'Online';
                      const charging = connector?.status === 'Charging';

                      return (
                        <tr key={charger.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`shape-blob grid h-11 w-11 place-items-center ${
                                  online ? 'bg-lime-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-black text-slate-950">{charger.charge_point_id}</p>
                                <p className="text-xs font-semibold text-slate-500">
                                  {charger.fabricante || 'Fabricante'} / {charger.modelo || 'Modelo'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={connector?.status || (online ? 'Available' : 'Offline')} />
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                            {charger.ultimo_heartbeat ? new Date(charger.ultimo_heartbeat).toLocaleString('pt-BR') : 'Sem registro'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                disabled={!online || charging}
                                onClick={() => runAction('Iniciar recarga', () => startCharging(charger.id, 1, 'ADMIN'))}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Play className="h-3.5 w-3.5" />
                                Iniciar
                              </button>
                              <button
                                disabled={!online || !charging}
                                onClick={() => runAction('Parar recarga', () => stopCharging(charger.id))}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Square className="h-3.5 w-3.5" />
                                Parar
                              </button>
                              <button
                                disabled={!online}
                                onClick={() => runAction('Reset soft', () => resetCharger(charger.id, 'Soft'))}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-xs font-bold text-slate-700 transition hover:border-[#0e467f]/30 hover:bg-blue-50 hover:text-[#0e467f] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-white/70 bg-white/72 shadow-sm backdrop-blur">
            <div className="border-b border-slate-200/60 p-5">
              <h3 className="text-lg font-black text-slate-950">Eventos recentes</h3>
              <p className="text-sm font-medium text-slate-500">Frames recebidos ou enviados pelo backend.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <div className="p-5 text-sm font-semibold text-slate-500">Nenhum evento recente.</div>
              ) : (
                events.map((event, index) => (
                  <div key={event.id || index} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-950">{event.action || 'Evento'}</p>
                      <span className="rounded-full bg-[#d9f96e] px-2 py-1 text-[10px] font-black uppercase text-slate-950">
                        {event.direction || 'IN'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{event.charge_point_id || 'Sem carregador'}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Clock className="h-3 w-3" />
                      {event.created_at || event.data_hora
                        ? new Date(event.created_at || event.data_hora || '').toLocaleString('pt-BR')
                        : 'Agora'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: React.ReactNode;
  tone: 'blue' | 'green' | 'amber' | 'slate';
}) {
  const tones = {
    blue: 'bg-[#e7ecff] text-[#0e467f]',
    green: 'bg-lime-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    slate: 'bg-slate-950 text-[#d9f96e]',
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`shape-soft grid h-11 w-11 place-items-center ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    normalized === 'charging'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : normalized === 'available'
      ? 'border-lime-200 bg-lime-100 text-emerald-800'
      : normalized === 'faulted'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-100 text-slate-600';

  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${cls}`}>{status}</span>;
}

function EmptyState() {
  return (
    <div className="grid place-items-center p-12 text-center">
      <div className="shape-soft grid h-14 w-14 place-items-center bg-slate-100 text-slate-500">
        <PlugZap className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-black text-slate-700">Nenhum carregador registrado</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
        Quando um charge point conectar em /ocpp/{'{chargePointId}'}, ele aparece aqui automaticamente.
      </p>
    </div>
  );
}
