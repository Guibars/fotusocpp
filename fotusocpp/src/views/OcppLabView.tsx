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
} from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { FlaskConical, Send, TerminalSquare, Settings2, ShieldCheck, Unlock, RefreshCw, MessageSquare } from 'lucide-react';

export default function OcppLabView() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string>('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Command setup state
  const [configKey, setConfigKey] = useState('');
  const [configValue, setConfigValue] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [commandTitle, setCommandTitle] = useState('');
  const [commandPayload, setCommandPayload] = useState<any>({});
  const [isSending, setIsSending] = useState(false);
  const [commandResult, setCommandResult] = useState<{ success: boolean; message?: string } | null>(null);
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
    const result = await currentAction();
    setIsSending(false);
    setCommandResult(result);
  };

  if (loading) {
     return <div className="p-10 text-slate-500">Carregando laboratório...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full text-slate-800 flex flex-col lg:flex-row gap-8 p-6 md:p-8 custom-scrollbar relative z-10">
      
      {/* Left Column: Command Controls */}
      <div className="flex-1 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-brand-blue" />
            Laboratório OCPP
          </h1>
          <p className="text-sm text-slate-500 mt-1">Ambiente de testes para comunicação direta</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selecionar Carregador</h2>
          <div className="relative">
            <select 
              value={selectedChargerId}
              onChange={e => setSelectedChargerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm"
            >
              <option value="" disabled>Selecione um carregador...</option>
              {chargers.map(c => (
                <option key={c.id} value={c.id}>{c.charge_point_id} ({c.status})</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-slate-500"></div>
            </div>
          </div>
        </div>

        {selectedCharger && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <LabCard 
              icon={<Settings2 className="h-4 w-4" />}
              title="Buscar Configurações"
              active={isOnline}
              onClick={() => triggerCmd("GetConfiguration", {}, () => getConfiguration(selectedCharger.id))}
            />
            
            <LabCard 
              icon={<RefreshCw className="h-4 w-4" />}
              title="Limpar Cache"
              active={isOnline}
              onClick={() => triggerCmd("ClearCache", {}, () => clearCache(selectedCharger.id))}
            />

            <LabCard 
              icon={<MessageSquare className="h-4 w-4" />}
              title="Solicitar Heartbeat"
              active={isOnline}
              onClick={() => triggerCmd("TriggerMessage", { requestedMessage: "Heartbeat" }, () => triggerMessage(selectedCharger.id, "Heartbeat"))}
            />

            <LabCard 
              icon={<MessageSquare className="h-4 w-4" />}
              title="Solicitar Status"
              active={isOnline}
              onClick={() => triggerCmd("TriggerMessage", { requestedMessage: "StatusNotification" }, () => triggerMessage(selectedCharger.id, "StatusNotification"))}
            />
            
            <LabCard 
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Ativar Conector"
              active={isOnline}
              onClick={() => triggerCmd("ChangeAvailability (Operative)", { connectorId: 1, type: "Operative" }, () => changeAvailability(selectedCharger.id, 'Operative', 1))}
            />

            <LabCard 
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Desativar Conector"
              active={isOnline}
              onClick={() => triggerCmd("ChangeAvailability (Inoperative)", { connectorId: 1, type: "Inoperative" }, () => changeAvailability(selectedCharger.id, 'Inoperative', 1))}
            />

            <LabCard 
              icon={<Unlock className="h-4 w-4" />}
              title="Destravar Conector"
              active={isOnline}
              onClick={() => triggerCmd("UnlockConnector", { connectorId: 1 }, () => unlockConnector(selectedCharger.id, 1))}
            />

            {/* Change Configuration Form */}
            <div className="md:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-5 relative overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="h-10 w-10 rounded-md bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <TerminalSquare className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg tracking-tight text-slate-800">Alterar Configuração</h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 relative z-10">
                <input 
                  type="text" 
                  placeholder="Key (ex: MeterValueSampleInterval)"
                  value={configKey}
                  onChange={e => setConfigKey(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-mono text-sm"
                  disabled={!isOnline}
                />
                <input 
                  type="text" 
                  placeholder="Value (ex: 30)"
                  value={configValue}
                  onChange={e => setConfigValue(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-mono text-sm"
                  disabled={!isOnline}
                />
                <button 
                  disabled={!isOnline || !configKey || !configValue}
                  onClick={() => triggerCmd("ChangeConfiguration", { key: configKey, value: configValue }, () => changeConfiguration(selectedCharger.id, configKey, configValue))}
                  className="px-6 py-2 bg-brand-blue text-white hover:bg-blue-800 rounded-md font-semibold tracking-wide disabled:opacity-50 transition-all flex items-center gap-2 justify-center shadow-sm"
                >
                  <Send className="h-4 w-4" /> Enviar
                </button>
              </div>
              {!isOnline && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-0"></div>}
            </div>

          </div>
        )}
      </div>

      {/* Right Column: Console/Results */}
      <div className="lg:w-[400px] xl:w-[450px] flex flex-col shrink-0 h-[500px] lg:h-full relative z-10">
         <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
           <TerminalSquare className="h-5 w-5 text-brand-blue" />
           Logs Recentes
         </h2>
         <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative z-0">
              {results.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 font-mono text-sm px-4">
                  Nenhum resultado de comando registrado.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {results.map((r, i) => (
                    <div key={r.id || i} className="p-4 transition-all hover:bg-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-800 text-sm">{r.action}</span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${r.status === 'Accepted' || r.status === 'Success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mb-3 font-mono tracking-wider">
                        {r.charge_point_id} • {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                      </div>
                      
                      <div className="space-y-2">
                        {r.request_payload && (
                          <div className="bg-slate-50 rounded-md p-3 border border-slate-100 relative">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Request</span>
                            <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap">{typeof r.request_payload === 'string' ? r.request_payload : JSON.stringify(r.request_payload, null, 2)}</pre>
                          </div>
                        )}
                        {(r.response_payload || r.erro) && (
                          <div className="bg-slate-50 rounded-md p-3 border border-slate-100 relative">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Response</span>
                            {r.erro ? (
                              <div className="text-[10px] font-mono text-red-600">{r.erro}</div>
                            ) : (
                              <pre className="text-[10px] font-mono text-green-700 whitespace-pre-wrap">{typeof r.response_payload === 'string' ? r.response_payload : JSON.stringify(r.response_payload, null, 2)}</pre>
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

function LabCard({ icon, title, active, onClick }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={active ? onClick : undefined} 
      disabled={!active}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left overflow-hidden ${active ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-brand-blue/30 cursor-pointer shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'}`}
    >
      <div className={`relative z-10 h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${active ? 'bg-brand-blue/10 text-brand-blue shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
        {icon}
      </div>
      <span className={`relative z-10 font-semibold text-sm transition-colors duration-200 ${active ? 'text-slate-800' : 'text-slate-400'}`}>{title}</span>
    </button>
  );
}
