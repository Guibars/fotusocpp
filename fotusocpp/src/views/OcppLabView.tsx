import React, { useState, useEffect } from 'react';
import { Charger, CommandResult } from '../types';
import { 
  getChargers, 
  getCommandResults,
  getConfiguration, 
  changeConfiguration, 
  changeAvailability, 
  unlockConnector, 
  clearCache, 
  triggerMessage,
  reserveNow,
  cancelReservation,
  getDiagnostics,
  updateFirmware,
  dataTransfer,
  getLocalListVersion,
  sendLocalList,
  clearChargingProfile,
  getCompositeSchedule
} from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  FlaskConical, 
  Send, 
  TerminalSquare, 
  Settings2, 
  ShieldCheck, 
  Unlock, 
  RefreshCw, 
  MessageSquare,
  Sliders,
  ChevronRight,
  Database,
  Cpu,
  Trash2,
  Download,
  Network,
  CalendarDays,
  Ban,
  ListMinus,
  FileJson,
  Activity,
  ListPlus,
  Play
} from 'lucide-react';

export default function OcppLabView() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string>('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab for advanced commands: 'reservations' | 'system' | 'smart'
  const [advancedTab, setAdvancedTab] = useState<'reservations' | 'system' | 'smart'>('reservations');

  // Input States for the 9 advanced test commands:
  // 1. Reserve Now
  const [reserveConnector, setReserveConnector] = useState<number>(1);
  const [reserveIdTag, setReserveIdTag] = useState<string>('ADMIN');

  // 2. Cancel Reservation
  const [cancelResId, setCancelResId] = useState<number>(123);

  // 3. Get Diagnostics
  const [diagLocation, setDiagLocation] = useState<string>('https://raw.githubusercontent.com/test-logs/main/diagnostic.log');

  // 4. Update Firmware
  const [firmwareLocation, setFirmwareLocation] = useState<string>('https://ocpp-firmware-downloads.com/firmware-v2.bin');

  // 5. Data Transfer
  const [dtVendorId, setDtVendorId] = useState<string>('VENDOR');
  const [dtMessageId, setDtMessageId] = useState<string>('ping');
  const [dtData, setDtData] = useState<string>('{}');

  // 7. Send Local List
  const [listVersion, setListVersion] = useState<number>(1);
  const [updateType, setUpdateType] = useState<string>('Full');
  const [authListJson, setAuthListJson] = useState<string>(
    JSON.stringify([
      { "idTag": "ADMIN", "idTagInfo": { "status": "Accepted" } }
    ], null, 2)
  );

  // 8. Clear Charging Profile
  const [clearConnectorId, setClearConnectorId] = useState<number>(1);
  const [clearPurpose, setClearPurpose] = useState<string>('TxProfile');

  // 9. Get Composite Schedule
  const [scheduleConnectorId, setScheduleConnectorId] = useState<number>(1);
  const [scheduleDuration, setScheduleDuration] = useState<number>(3600);

  // Standard commands setup state
  const [configKey, setConfigKey] = useState('');
  const [configValue, setConfigValue] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [commandTitle, setCommandTitle] = useState('');
  const [commandPayload, setCommandPayload] = useState<any>({});
  const [isSending, setIsSending] = useState(false);
  const [commandResult, setCommandResult] = useState<{ success: boolean; message?: string; messageId?: string; status?: string } | null>(null);
  const [currentAction, setCurrentAction] = useState<() => Promise<any>>();

  useEffect(() => {
    async function load() {
      const [chargersData, resultsData] = await Promise.all([getChargers(), getCommandResults()]);
      if (chargersData) {
        setChargers(chargersData);
        if (chargersData.length > 0 && !selectedChargerId) {
          setSelectedChargerId(chargersData[0].id);
        }
      }
      if (resultsData) setResults(resultsData);
      setLoading(false);
    }
    load();
    const interval = setInterval(async () => {
      const resultsData = await getCommandResults();
      if (resultsData) setResults(resultsData);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChargerId]);

  const selectedCharger = chargers.find(c => c.id === selectedChargerId);
  const isOnline = selectedCharger?.status === 'Online';

  const triggerCmd = (title: string, payload: any, action: () => Promise<any>) => {
    setCommandTitle(title);
    setCommandPayload(payload);
    setCurrentAction(() => action);
    setCommandResult(null);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;
    setIsSending(true);
    try {
      const result = await currentAction();
      setCommandResult(result);
    } catch (e) {
      console.error(e);
      setCommandResult({ success: false, message: 'Falha na requisição' });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-[#0e467f]" />
          <p className="text-slate-600 font-bold text-sm">Carregando laboratório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full text-slate-800 flex flex-col lg:flex-row gap-8 p-6 md:p-8 custom-scrollbar relative z-10 bg-[#f4f7fc]">
      
      {/* Left Column: Command Controls */}
      <div className="flex-1 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] flex items-center gap-3">
            <FlaskConical className="h-7 w-7 text-brand-yellow animate-pulse" />
            Laboratório OCPP
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Simulação de comandos de barramento e testes de conformidade avançada</p>
        </div>

        {/* Charger Selector Bento Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm">
          <h2 className="text-xs font-bold text-[#0e467f] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Selecionar Estação de Teste
          </h2>
          <div className="relative">
            <select 
              value={selectedChargerId}
              onChange={e => setSelectedChargerId(e.target.value)}
              className="w-full bg-slate-50 hover:bg-[#f4f7fc] border border-slate-200 focus:border-[#0e467f] text-slate-800 rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0e467f] transition-all text-sm font-bold shadow-inner"
            >
              <option value="" disabled>Selecione um carregador...</option>
              {chargers.map(c => (
                <option key={c.id} value={c.id}>{c.charge_point_id} ({c.status})</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <Database className="h-4 w-4" />
            </div>
          </div>
        </div>

        {selectedCharger && (
          <div className="space-y-6">
            
            {/* 1. Basic Action Grid */}
            <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm">
              <h2 className="text-xs font-extrabold text-[#0e467f] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-brand-yellow" />
                Ações OCPP Básicas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LabCard 
                  icon={<Settings2 className="h-5 w-5" />}
                  title="Solicitar Configurações"
                  description="GetConfiguration"
                  active={isOnline}
                  onClick={() => triggerCmd("GetConfiguration", {}, () => getConfiguration(selectedCharger.id))}
                />
                
                <LabCard 
                  icon={<RefreshCw className="h-5 w-5" />}
                  title="Limpar Cache Local"
                  description="ClearCache"
                  active={isOnline}
                  onClick={() => triggerCmd("ClearCache", {}, () => clearCache(selectedCharger.id))}
                />

                <LabCard 
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Forçar Heartbeat"
                  description="Trigger: Heartbeat"
                  active={isOnline}
                  onClick={() => triggerCmd("TriggerMessage", { requestedMessage: "Heartbeat" }, () => triggerMessage(selectedCharger.id, "Heartbeat"))}
                />

                <LabCard 
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Solicitar Status"
                  description="Trigger: StatusNotification"
                  active={isOnline}
                  onClick={() => triggerCmd("TriggerMessage", { requestedMessage: "StatusNotification" }, () => triggerMessage(selectedCharger.id, "StatusNotification"))}
                />
                
                <LabCard 
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Disponibilidade: Ativa"
                  description="Availability: Operative"
                  active={isOnline}
                  onClick={() => triggerCmd("ChangeAvailability (Operative)", { connectorId: 1, type: "Operative" }, () => changeAvailability(selectedCharger.id, 'Operative', 1))}
                />

                <LabCard 
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Disponibilidade: Pausado"
                  description="Availability: Inoperative"
                  active={isOnline}
                  onClick={() => triggerCmd("ChangeAvailability (Inoperative)", { connectorId: 1, type: "Inoperative" }, () => changeAvailability(selectedCharger.id, 'Inoperative', 1))}
                />

                <LabCard 
                  icon={<Unlock className="h-5 w-5" />}
                  title="Destravar Conector 1"
                  description="UnlockConnector"
                  active={isOnline}
                  onClick={() => triggerCmd("UnlockConnector", { connectorId: 1 }, () => unlockConnector(selectedCharger.id, 1))}
                />

                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-between border border-slate-200 border-dashed">
                  <div>
                    <span className="text-[10px] font-bold text-[#0e467f] uppercase tracking-wider block mb-1">Status de Conectividade</span>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Esta estação foi detectada como <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-500'}`}>{selectedCharger.status}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Change configuration inputs */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <TerminalSquare className="h-4 w-4 text-[#0e467f]" />
                  <span className="text-xs font-bold text-slate-800">Modificar Chave Específica (ChangeConfiguration)</span>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Chave (Ex: MeterValueSampleInterval)"
                    value={configKey}
                    onChange={e => setConfigKey(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0e467f] focus:ring-1 focus:ring-[#0e467f] transition-all font-mono text-xs font-extrabold"
                    disabled={!isOnline}
                  />
                  <input 
                    type="text" 
                    placeholder="Valor (Ex: 30)"
                    value={configValue}
                    onChange={e => setConfigValue(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0e467f] focus:ring-1 focus:ring-[#0e467f] transition-all font-mono text-xs font-extrabold"
                    disabled={!isOnline}
                  />
                  <button 
                    disabled={!isOnline || !configKey || !configValue}
                    onClick={() => triggerCmd("ChangeConfiguration", { key: configKey, value: configValue }, () => changeConfiguration(selectedCharger.id, configKey, configValue))}
                    className="px-5 py-2.5 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center gap-2 justify-center shadow"
                  >
                    <Send className="h-3 w-3" /> Aplicar
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Advanced OCPP Certification Test Tabs & Forms */}
            <div className="bg-white rounded-[2rem] p-6 border border-[#e2e8f0] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                <div>
                  <h2 className="text-xs font-extrabold text-[#0e467f] uppercase tracking-wider flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-brand-yellow animate-pulse" />
                    Barramento de Homologação Av.
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Parâmetros dinâmicos customizados para homologação rápida</p>
                </div>

                {/* Sub Tab selection */}
                <div className="flex bg-[#f4f7fc] p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setAdvancedTab('reservations')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${advancedTab === 'reservations' ? 'bg-white text-[#0e467f] shadow' : 'text-slate-500 hover:text-[#0e467f]'}`}
                  >
                    Reservas e Listas
                  </button>
                  <button 
                    onClick={() => setAdvancedTab('system')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${advancedTab === 'system' ? 'bg-white text-[#0e467f] shadow' : 'text-slate-500 hover:text-[#0e467f]'}`}
                  >
                    Diagnóstico e Firm.
                  </button>
                  <button 
                    onClick={() => setAdvancedTab('smart')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${advancedTab === 'smart' ? 'bg-white text-[#0e467f] shadow' : 'text-slate-500 hover:text-[#0e467f]'}`}
                  >
                    Smart Charging
                  </button>
                </div>
              </div>

              {/* RESERVATIONS & LISTS */}
              {advancedTab === 'reservations' && (
                <div className="space-y-6">
                  
                  {/* Test 1: Reserve Now */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <CalendarDays className="h-4 w-4 text-[#0e467f]" />
                      <span>1. Reserve Now (Reserva de Conector)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Connector ID</label>
                        <input 
                          type="number" 
                          value={reserveConnector}
                          onChange={e => setReserveConnector(parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">ID Tag Autorizado</label>
                        <input 
                          type="text" 
                          value={reserveIdTag}
                          onChange={e => setReserveIdTag(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "ReserveNow", 
                          { connectorId: reserveConnector, idTag: reserveIdTag }, 
                          () => reserveNow(selectedCharger.id, reserveConnector, reserveIdTag)
                        )}
                        className="w-full py-2 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5" /> Reserve Now
                      </button>
                    </div>
                  </div>

                  {/* Test 2: Cancel Reservation */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Ban className="h-4 w-4 text-[#0e467f]" />
                      <span>2. Cancel Reservation (Cancelar ID da Reserva)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Reservation ID</label>
                        <input 
                          type="number" 
                          value={cancelResId}
                          onChange={e => setCancelResId(parseInt(e.target.value) || 123)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "CancelReservation", 
                          { reservationId: cancelResId }, 
                          () => cancelReservation(selectedCharger.id, cancelResId)
                        )}
                        className="w-full py-2 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Cancel Reservation
                      </button>
                    </div>
                  </div>

                  {/* Test 6: Get Local List Version & Test 7: Send Local List */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                        <ListPlus className="h-4 w-4 text-[#0e467f]" />
                        <span>3. Autorização Local (Local List v1.6)</span>
                      </div>
                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "GetLocalListVersion", 
                          {}, 
                          () => getLocalListVersion(selectedCharger.id)
                        )}
                        className="px-3 py-1 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <ListMinus className="h-3 w-3" /> Get Local List Version
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Versão da Lista</label>
                          <input 
                            type="number" 
                            value={listVersion}
                            onChange={e => setListVersion(parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tipo de Atualização</label>
                          <select 
                            value={updateType}
                            onChange={e => setUpdateType(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="Full">Full (Substituição)</option>
                            <option value="Differential">Differential (Diferencial)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase flex items-center gap-1">
                          <FileJson className="h-3.5 w-3.5 text-zinc-400" />
                          Lista de Autorizações (localAuthorizationList JSON)
                        </label>
                        <textarea 
                          value={authListJson}
                          onChange={e => setAuthListJson(e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-slate-200 focus:border-[#0e467f] hover:border-slate-300 rounded-lg p-3 text-[11px] font-mono leading-normal focus:outline-none focus:ring-1 focus:ring-[#0e467f]"
                        />
                      </div>

                      <button 
                        disabled={!isOnline}
                        onClick={() => {
                          try {
                            const parsedList = JSON.parse(authListJson);
                            triggerCmd(
                              "SendLocalList", 
                              { listVersion, updateType, localAuthorizationList: parsedList }, 
                              () => sendLocalList(selectedCharger.id, listVersion, updateType, parsedList)
                            );
                          } catch (err: any) {
                            alert("JSON inválido de lista de autorização! " + err.message);
                          }
                        }}
                        className="w-full py-2 bg-[#004b82] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" /> Send Local List (Enviar Lista Local)
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* SYSTEM DIAGNOSTICS & FIRMWARE TRANSFERS */}
              {advancedTab === 'system' && (
                <div className="space-y-6">
                  
                  {/* Test 3: Get Diagnostics */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Download className="h-4 w-4 text-[#0e467f]" />
                      <span>1. Get Diagnostics (Exportar Diagnóstico)</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">FTP/HTTPS Upload Location</label>
                        <input 
                          type="text" 
                          value={diagLocation}
                          onChange={e => setDiagLocation(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "GetDiagnostics", 
                          { location: diagLocation }, 
                          () => getDiagnostics(selectedCharger.id, diagLocation)
                        )}
                        className="w-full py-2 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" /> Enviar Requisição de Diagnóstico
                      </button>
                    </div>
                  </div>

                  {/* Test 4: Update Firmware */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Cpu className="h-4 w-4 text-[#0e467f]" />
                      <span>2. Update Firmware (Atualização do Firmware)</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Firmware Server Location URL</label>
                        <input 
                          type="text" 
                          value={firmwareLocation}
                          onChange={e => setFirmwareLocation(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "UpdateFirmware", 
                          { location: firmwareLocation }, 
                          () => updateFirmware(selectedCharger.id, firmwareLocation)
                        )}
                        className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Cpu className="h-3.5 w-3.5" /> Solicitar Atualização de Firmware
                      </button>
                    </div>
                  </div>

                  {/* Test 5: Data Transfer */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Network className="h-4 w-4 text-[#0e467f]" />
                      <span>3. Data Transfer (Transmissão Personalizada de Frames)</span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Vendor ID</label>
                          <input 
                            type="text" 
                            value={dtVendorId}
                            onChange={e => setDtVendorId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Message ID</label>
                          <input 
                            type="text" 
                            value={dtMessageId}
                            onChange={e => setDtMessageId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Data Payload (JSON/String)</label>
                        <input 
                          type="text" 
                          value={dtData}
                          onChange={e => setDtData(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <button 
                        disabled={!isOnline}
                        onClick={() => triggerCmd(
                          "DataTransfer", 
                          { vendorId: dtVendorId, messageId: dtMessageId, data: dtData }, 
                          () => dataTransfer(selectedCharger.id, dtVendorId, dtMessageId, dtData)
                        )}
                        className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Network className="h-3.5 w-3.5" /> Disparar Data Transfer (Custom)
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* SMART CHARGING ACCORDIONS */}
              {advancedTab === 'smart' && (
                <div className="space-y-6">
                  
                  {/* Test 8: Clear Charging Profile */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Trash2 className="h-4 w-4 text-[#0e467f]" />
                      <span>1. Clear Charging Profile (Resetar Limite de Carga)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Connector ID (Opcional)</label>
                        <input 
                          type="number" 
                          value={clearConnectorId}
                          onChange={e => setClearConnectorId(parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Charging Profile Purpose (Opcional)</label>
                        <input 
                          type="text" 
                          value={clearPurpose}
                          onChange={e => setClearPurpose(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      disabled={!isOnline}
                      onClick={() => triggerCmd(
                        "ClearChargingProfile", 
                        { connectorId: clearConnectorId, chargingProfilePurpose: clearPurpose }, 
                        () => clearChargingProfile(selectedCharger.id, clearConnectorId, clearPurpose)
                      )}
                      className="w-full py-2 bg-[#0e467f] hover:bg-blue-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear Charging Profile
                    </button>
                  </div>

                  {/* Test 9: Get Composite Schedule */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mb-3">
                      <Sliders className="h-4 w-4 text-[#0e467f]" />
                      <span>2. Get Composite Schedule (Gráfico de Potência Agendada)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 font-semibold">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Connector ID</label>
                        <input 
                          type="number" 
                          value={scheduleConnectorId}
                          onChange={e => setScheduleConnectorId(parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Duration (Segundos)</label>
                        <input 
                          type="number" 
                          value={scheduleDuration}
                          onChange={e => setScheduleDuration(parseInt(e.target.value) || 3600)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      disabled={!isOnline}
                      onClick={() => triggerCmd(
                        "GetCompositeSchedule", 
                        { connectorId: scheduleConnectorId, duration: scheduleDuration }, 
                        () => getCompositeSchedule(selectedCharger.id, scheduleConnectorId, scheduleDuration)
                      )}
                      className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Activity className="h-3.5 w-3.5 shrink-0" /> Obter Cronograma de Potência (Composite Schedule)
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}
      </div>

      {/* Right Column: Console/Results */}
      <div className="lg:w-[420px] xl:w-[480px] flex flex-col shrink-0 h-[500px] lg:h-auto relative z-10">
         <h2 className="text-xl font-bold text-[#0e467f] mb-4 flex items-center gap-2.5">
           <TerminalSquare className="h-6 w-6 text-brand-yellow" />
           Console de Terminação
         </h2>
         <div className="flex-1 bg-[#1a202c] rounded-[2rem] overflow-hidden flex flex-col shadow-lg border border-[#2d3748] relative">
            
            {/* Terminal Header */}
            <div className="bg-[#2d3748]/50 px-5 py-3 border-b border-[#2d3748] flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
              <span className="text-[10px] text-slate-400 font-mono ml-2">stdout_ocpp_feed</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative z-0">
              {results.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 font-mono text-xs leading-relaxed">
                  // Nenhum frame recebido no barramento local.<br/>
                  // Dispare comandos para rastrear callbacks JSON.
                </div>
              ) : (
                <div className="space-y-4">
                  {results.slice(0, 15).map((r, i) => (
                    <div key={r.id || i} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono shadow-inner">
                      <div className="flex justify-between items-center mb-2 text-[10px]">
                        <span className="font-bold text-yellow-400">{r.action}</span>
                        <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${r.status?.toLowerCase() === 'accepted' || r.status?.toLowerCase() === 'success' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-red-400/20 text-red-400'}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 mb-3 tracking-wider font-bold">
                        {r.charge_point_id} • {r.created_at ? new Date(r.created_at).toLocaleTimeString() : ''}
                      </div>
                      
                      <div className="space-y-2 text-[10px]">
                        {r.request_payload && (
                          <div className="bg-[#1a202c]/65 rounded-xl p-3 border border-slate-800">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">// REQUEST_FRAME_INTENT</span>
                            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {typeof r.request_payload === 'string' ? r.request_payload : JSON.stringify(r.request_payload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {(r.response_payload || r.erro) && (
                          <div className="bg-[#1a202c]/65 rounded-xl p-3 border border-slate-800">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">// RESPONSE_CALLBACK</span>
                            {r.erro ? (
                              <div className="text-[11px] font-mono text-red-400 font-bold">{r.erro}</div>
                            ) : (
                              <pre className="text-[11px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {typeof r.response_payload === 'string' ? r.response_payload : JSON.stringify(r.response_payload, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         </div>
      </div>

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

function LabCard({ icon, title, description, active, onClick }: { icon: React.ReactNode, title: string, description: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={active ? onClick : undefined} 
      disabled={!active}
      className={`group relative flex items-start gap-4 p-4 rounded-3xl border transition-all duration-300 text-left overflow-hidden ${active ? 'bg-white border-[#e2e8f0] hover:border-[#0e467f]/30 hover:shadow-md cursor-pointer shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}
    >
      <div className={`relative z-10 h-10 w-10 border rounded-2xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-slate-50 border-slate-100 text-[#0e467f]' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
        {icon}
      </div>
      <div>
        <span className={`relative z-10 font-bold text-sm block leading-snug ${active ? 'text-slate-900 group-hover:text-[#0e467f]' : 'text-slate-400'}`}>{title}</span>
        <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug font-mono uppercase tracking-wider">{description}</span>
      </div>
    </button>
  );
}
