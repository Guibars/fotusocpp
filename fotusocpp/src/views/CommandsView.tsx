import React, { useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Database,
  LockOpen,
  MessageSquare,
  Play,
  Power,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Terminal,
  Zap,
} from 'lucide-react';
import { Charger, CommandResult } from '../types';
import {
  changeAvailability,
  changeConfiguration,
  clearCache,
  getChargers,
  getCommandResults,
  getConfiguration,
  resetCharger,
  setChargingProfile,
  startCharging,
  stopCharging,
  triggerMessage,
  unlockConnector,
} from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export default function CommandsView() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState('');
  const [loading, setLoading] = useState(true);

  const [connectorId, setConnectorId] = useState(1);
  const [idTag, setIdTag] = useState('ADMIN');
  const [configKey, setConfigKey] = useState('MeterValueSampleInterval');
  const [configValue, setConfigValue] = useState('30');
  const [profileJson, setProfileJson] = useState(
    JSON.stringify(
      {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: {
          chargingRateUnit: 'A',
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      },
      null,
      2,
    ),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [commandTitle, setCommandTitle] = useState('');
  const [commandPayload, setCommandPayload] = useState<any>({});
  const [isSending, setIsSending] = useState(false);
  const [commandResult, setCommandResult] = useState<{ success: boolean; message?: string; messageId?: string; status?: string } | null>(null);
  const [currentAction, setCurrentAction] = useState<() => Promise<any>>();
  const [localError, setLocalError] = useState('');

  const loadData = async () => {
    const [chargersData, resultsData] = await Promise.all([getChargers(), getCommandResults(20)]);
    if (chargersData) {
      setChargers(chargersData);
      setSelectedChargerId(current => current || chargersData[0]?.id || '');
    }
    if (resultsData) setResults(resultsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedCharger = chargers.find(charger => charger.id === selectedChargerId);
  const isOnline = selectedCharger?.status === 'Online';
  const connectorStatus = selectedCharger?.connectors?.find(connector => connector.connector_number === connectorId)?.status;

  const triggerCommand = (title: string, payload: any, action: () => Promise<any>) => {
    setCommandTitle(title);
    setCommandPayload(payload);
    setCurrentAction(() => action);
    setCommandResult(null);
    setLocalError('');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;
    setIsSending(true);
    const result = await currentAction();
    setIsSending(false);
    setCommandResult(result);
    loadData();
  };

  const sendChargingProfile = () => {
    if (!selectedCharger) return;
    try {
      const parsed = JSON.parse(profileJson);
      triggerCommand('SetChargingProfile', { connectorId: 1, csChargingProfiles: parsed }, () =>
        setChargingProfile(selectedCharger.id, parsed),
      );
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'JSON invalido');
    }
  };

  if (loading) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#0e467f]" />
          <p className="mt-4 text-sm font-bold text-slate-700">Carregando comandos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0e467f]">Central OCPP</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Comandos reais do backend</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            Esta tela lista somente comandos com rota implementada no backend conectado.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Carregador alvo</label>
              <div className="relative mt-2">
                <select
                  value={selectedChargerId}
                  onChange={event => setSelectedChargerId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0e467f] focus:ring-2 focus:ring-[#0e467f]/10"
                >
                  <option value="">Selecione um carregador</option>
                  {chargers.map(charger => (
                    <option key={charger.id} value={charger.id}>
                      {charger.charge_point_id} ({charger.status})
                    </option>
                  ))}
                </select>
                <Database className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {selectedCharger ? (
                <div className="mt-4 space-y-2 text-sm">
                  <InfoRow label="Estado" value={selectedCharger.status} />
                  <InfoRow label="Modelo" value={`${selectedCharger.fabricante || '-'} / ${selectedCharger.modelo || '-'}`} />
                  <InfoRow label="Conector" value={connectorStatus || 'Sem status'} />
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-500">Nenhum carregador selecionado.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Parametros comuns</label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-500">Connector ID</span>
                  <input
                    type="number"
                    min={0}
                    value={connectorId}
                    onChange={event => setConnectorId(Number(event.target.value) || 1)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-[#0e467f]"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500">ID Tag</span>
                  <input
                    value={idTag}
                    onChange={event => setIdTag(event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-[#0e467f]"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {!selectedCharger ? (
              <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <Terminal className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-700">Selecione um carregador</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Os comandos ficam bloqueados ate existir um alvo valido.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <CommandButton
                    icon={<Play className="h-4 w-4" />}
                    title="RemoteStart"
                    description="Iniciar recarga"
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('RemoteStartTransaction', { connectorId, idTag }, () =>
                        startCharging(selectedCharger.id, connectorId, idTag),
                      )
                    }
                  />
                  <CommandButton
                    icon={<Square className="h-4 w-4" />}
                    title="RemoteStop"
                    description="Parar transacao ativa"
                    danger
                    disabled={!isOnline}
                    onClick={() => triggerCommand('RemoteStopTransaction', {}, () => stopCharging(selectedCharger.id))}
                  />
                  <CommandButton
                    icon={<RefreshCw className="h-4 w-4" />}
                    title="Reset Soft"
                    description="Reinicializacao logica"
                    disabled={!isOnline}
                    onClick={() => triggerCommand('Reset Soft', { type: 'Soft' }, () => resetCharger(selectedCharger.id, 'Soft'))}
                  />
                  <CommandButton
                    icon={<Power className="h-4 w-4" />}
                    title="Reset Hard"
                    description="Ciclo completo"
                    danger
                    disabled={!isOnline}
                    onClick={() => triggerCommand('Reset Hard', { type: 'Hard' }, () => resetCharger(selectedCharger.id, 'Hard'))}
                  />
                  <CommandButton
                    icon={<LockOpen className="h-4 w-4" />}
                    title="UnlockConnector"
                    description={`Conector ${connectorId}`}
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('UnlockConnector', { connectorId }, () => unlockConnector(selectedCharger.id, connectorId))
                    }
                  />
                  <CommandButton
                    icon={<Database className="h-4 w-4" />}
                    title="ClearCache"
                    description="Limpar cache local"
                    disabled={!isOnline}
                    onClick={() => triggerCommand('ClearCache', {}, () => clearCache(selectedCharger.id))}
                  />
                  <CommandButton
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Trigger Heartbeat"
                    description="Solicitar heartbeat"
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('TriggerMessage Heartbeat', { requestedMessage: 'Heartbeat' }, () =>
                        triggerMessage(selectedCharger.id, 'Heartbeat'),
                      )
                    }
                  />
                  <CommandButton
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Trigger Status"
                    description="StatusNotification"
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('TriggerMessage StatusNotification', { requestedMessage: 'StatusNotification', connectorId }, () =>
                        triggerMessage(selectedCharger.id, 'StatusNotification', connectorId),
                      )
                    }
                  />
                  <CommandButton
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Operative"
                    description="Ativar disponibilidade"
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('ChangeAvailability Operative', { connectorId, type: 'Operative' }, () =>
                        changeAvailability(selectedCharger.id, 'Operative', connectorId),
                      )
                    }
                  />
                  <CommandButton
                    icon={<Ban className="h-4 w-4" />}
                    title="Inoperative"
                    description="Pausar conector"
                    danger
                    disabled={!isOnline}
                    onClick={() =>
                      triggerCommand('ChangeAvailability Inoperative', { connectorId, type: 'Inoperative' }, () =>
                        changeAvailability(selectedCharger.id, 'Inoperative', connectorId),
                      )
                    }
                  />
                  <CommandButton
                    icon={<Settings className="h-4 w-4" />}
                    title="GetConfiguration"
                    description="Ler configuracoes"
                    disabled={!isOnline}
                    onClick={() => triggerCommand('GetConfiguration', {}, () => getConfiguration(selectedCharger.id))}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-[#0e467f]">
                        <SlidersHorizontal className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-950">ChangeConfiguration</h3>
                        <p className="text-sm font-medium text-slate-500">Envia chave e valor para o carregador.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={configKey}
                        onChange={event => setConfigKey(event.target.value)}
                        placeholder="Key"
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm font-bold outline-none focus:border-[#0e467f]"
                      />
                      <input
                        value={configValue}
                        onChange={event => setConfigValue(event.target.value)}
                        placeholder="Value"
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm font-bold outline-none focus:border-[#0e467f]"
                      />
                    </div>
                    <button
                      disabled={!isOnline || !configKey || !configValue}
                      onClick={() =>
                        triggerCommand('ChangeConfiguration', { key: configKey, value: configValue }, () =>
                          changeConfiguration(selectedCharger.id, configKey, configValue),
                        )
                      }
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0e467f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#083969] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-950">SetChargingProfile</h3>
                        <p className="text-sm font-medium text-slate-500">Perfil JSON OCPP 1.6-J.</p>
                      </div>
                    </div>
                    {localError && (
                      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                        {localError}
                      </div>
                    )}
                    <textarea
                      value={profileJson}
                      onChange={event => setProfileJson(event.target.value)}
                      rows={8}
                      className="w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs font-semibold leading-5 text-emerald-300 outline-none focus:border-[#0e467f]"
                    />
                    <button
                      disabled={!isOnline}
                      onClick={sendChargingProfile}
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0e467f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#083969] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      Aplicar perfil
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h3 className="text-base font-black text-slate-950">Ultimos resultados</h3>
                <p className="text-sm font-medium text-slate-500">Retorno persistido por /api/command-results.</p>
              </div>
              {results.length === 0 ? (
                <div className="p-5 text-sm font-semibold text-slate-500">Nenhum comando recente.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {results.slice(0, 8).map((result, index) => (
                    <div key={result.id || index} className="grid gap-2 p-5 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">{result.action}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                            {result.charge_point_id}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {result.created_at ? new Date(result.created_at).toLocaleString('pt-BR') : 'Sem data'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase ${
                          result.status?.toLowerCase() === 'accepted' || result.status?.toLowerCase() === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : result.status?.toLowerCase() === 'pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {result.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={commandTitle}
        payload={commandPayload}
        onConfirm={handleConfirm}
        isSending={isSending}
        result={commandResult}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="truncate text-xs font-black text-slate-800">{value}</span>
    </div>
  );
}

function CommandButton({
  icon,
  title,
  description,
  disabled,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border bg-white p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? 'border-red-100 hover:border-red-300 hover:bg-red-50'
          : 'border-slate-200 hover:border-[#0e467f]/30 hover:bg-blue-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            danger ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-[#0e467f]'
          }`}
        >
          {icon}
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
          Real
        </span>
      </div>
      <p className={`mt-4 text-sm font-black ${danger ? 'text-red-800' : 'text-slate-950'}`}>{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
    </button>
  );
}
