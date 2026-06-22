import React, { useEffect, useState, useRef } from 'react';
import { Charger, ChargerStats } from '../types';
import { getChargers, getStats, startCharging, stopCharging, resetCharger } from '../services/api';
import { 
  Zap, 
  PowerOff, 
  BatteryCharging, 
  RefreshCcw, 
  Play, 
  Square,
  Activity,
  Wifi,
  WifiOff,
  Plus,
  Upload,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Cpu,
  MonitorCheck,
  CheckCircle2,
  Info,
  X,
  PlayCircle,
  HelpCircle,
  Terminal,
  Unplug
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  time: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ChargerStats | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Ref to track chargers for change detection (state comparison)
  const previousChargersRef = useRef<Charger[]>([]);

  // Integrated OCPP Simulator States
  const [simChargerId, setSimChargerId] = useState('FOTUS-MOCK-03');
  const [simSocket, setSimSocket] = useState<WebSocket | null>(null);
  const [simLogs, setSimLogs] = useState<{ time: string; msg: string; direction: 'in' | 'out' | 'info' }[]>([]);
  const [simStatus, setSimStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');
  const [simConnectorStatus, setSimConnectorStatus] = useState<'Available' | 'Preparing' | 'Charging' | 'Faulted'>('Available');
  const [simShowPanel, setSimShowPanel] = useState(true);

  // Add a beautiful alert toast
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const time = new Date().toLocaleTimeString();
    setToasts(prev => [...prev, { id, message, type, time }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const loadData = async (isFirstLoad = false) => {
    try {
      const [statsData, chargersData] = await Promise.all([
        getStats(),
        getChargers()
      ]);
      
      if (!statsData || !chargersData) {
        setHasConnectionError(true);
      } else {
        setHasConnectionError(false);
        setStats(statsData);

        // Perform diff analysis to pop up beautiful real-time toasts
        const oldChargers = previousChargersRef.current;
        if (oldChargers && oldChargers.length > 0 && !isFirstLoad) {
          chargersData.forEach(newC => {
            const oldC = oldChargers.find(c => c.id === newC.id);
            if (!oldC) {
              triggerToast(`⚡ Novo carregador [${newC.charge_point_id}] registrado no barramento!`, 'success');
            } else {
              // Status Connection Changed
              if (oldC.status !== newC.status) {
                if (newC.status === 'Online') {
                  triggerToast(`🟢 Estação [${newC.charge_point_id}] acaba de se conectar!`, 'success');
                } else {
                  triggerToast(`⚪ Estação [${newC.charge_point_id}] ficou offline.`, 'warning');
                }
              }
              
              // Connector Actions Changes
              const oldConnSt = oldC.connectors?.[0]?.status;
              const newConnSt = newC.connectors?.[0]?.status;
              if (oldConnSt && newConnSt && oldConnSt !== newConnSt) {
                if (newConnSt === 'Charging') {
                  triggerToast(`🔋 Sessão de recarga ATIVADA no terminal [${newC.charge_point_id}]`, 'success');
                } else if (newConnSt === 'Available') {
                  triggerToast(`🔌 Terminal [${newC.charge_point_id}] foi desconectado e está DISPONÍVEL`, 'info');
                } else if (newConnSt === 'Faulted') {
                  triggerToast(`⚠️ Alerta: Status de falha detectado no terminal [${newC.charge_point_id}]`, 'warning');
                } else {
                  triggerToast(`ℹ️ Terminal [${newC.charge_point_id}] mudou status para: ${newConnSt}`, 'info');
                }
              }
            }
          });
        }

        // Cache previous state
        previousChargersRef.current = chargersData;
        setChargers(chargersData);
      }
    } catch (e) {
      console.error("Dashboard pull error:", e);
      setHasConnectionError(true);
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  // High frequency polling: 2.0s instead of 5s to solve the delay/update user concern
  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  // Sync Simulator connector state selector with physical status
  const updateSimStatusOnServer = (newStatus: 'Available' | 'Preparing' | 'Charging' | 'Faulted') => {
    if (simSocket && simSocket.readyState === WebSocket.OPEN) {
      setSimConnectorStatus(newStatus);
      const uniqueId = "sim-status-" + Date.now();
      const payload = {
        connectorId: 1,
        errorCode: "NoError",
        status: newStatus,
        timestamp: new Date().toISOString()
      };
      simSocket.send(JSON.stringify([2, uniqueId, "StatusNotification", payload]));
      addSimLog(`Enviado status [${newStatus}] para conector 1`, 'out');
    }
  };

  const addSimLog = (msg: string, direction: 'in' | 'out' | 'info') => {
    const time = new Date().toLocaleTimeString();
    setSimLogs(prev => [{ time, msg, direction }, ...prev].slice(0, 50));
  };

  // Connect Local WebSocket Simulator to Railway backend OCPP server
  const handleConnectSimulator = () => {
    if (simStatus !== 'Disconnected') {
      if (simSocket) simSocket.close();
      setSimStatus('Disconnected');
      addSimLog("Simulador desconectado.", 'info');
      return;
    }

    if (!simChargerId.trim()) {
      triggerToast("Digite um ID de carregador válido para simular", 'warning');
      return;
    }

    setSimStatus('Connecting');
    addSimLog(`Abrindo WebSocket para wss://ocpp-backend-production.up.railway.app/ocpp/${simChargerId}...`, 'info');

    try {
      const socket = new WebSocket(`wss://ocpp-backend-production.up.railway.app/ocpp/${simChargerId}`);
      
      socket.onopen = () => {
        setSimSocket(socket);
        setSimStatus('Connected');
        addSimLog("Conexão estabelecida com servidor OCPP!", "info");
        triggerToast(`🔌 Simulador [${simChargerId}] conectou com sucesso!`, 'success');

        // Send BootNotification immediately
        const bootId = "sim-boot-" + Date.now();
        const bootPayload = {
          chargePointVendor: "Fotus Solar",
          chargePointModel: "Fotus Expressive 3 Virtual",
          firmwareVersion: "FTS-V3.9.4",
          chargeBoxSerialNumber: "FOTUS-" + Math.floor(Math.random() * 100000)
        };
        socket.send(JSON.stringify([2, bootId, "BootNotification", bootPayload]));
        addSimLog(`Enviado BootNotification (ID: ${simChargerId})`, 'out');

        // Send Initial StatusNotifications
        setTimeout(() => {
          const statusId0 = "sim-stat0-" + Date.now();
          socket.send(JSON.stringify([2, statusId0, "StatusNotification", {
            connectorId: 0,
            errorCode: "NoError",
            status: "Available"
          }]));
          
          const statusId1 = "sim-stat1-" + Date.now();
          socket.send(JSON.stringify([2, statusId1, "StatusNotification", {
            connectorId: 1,
            errorCode: "NoError",
            status: "Available"
          }]));
          setSimConnectorStatus('Available');
          addSimLog(`Enviado StatusNotification: Conector 0 e 1 [Available]`, 'out');
        }, 1200);

        // Auto trigger dashboard refresh
        setTimeout(() => loadData(false), 1000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!Array.isArray(data)) return;
          
          const [type, msgId, action, payload] = data;

          // Request frame received from Server
          if (type === 2) {
            addSimLog(`📥 SOLICITAÇÃO RECEBIDA: ${action}`, 'in');
            
            if (action === 'RemoteStartTransaction') {
              // Answer Accepted
              socket.send(JSON.stringify([3, msgId, { status: "Accepted" }]));
              addSimLog(`📤 REPOSTA OCPP: [RemoteStart] Aceito!`, 'out');
              
              // Trigger state changes to Charging automatically
              setTimeout(() => {
                setSimConnectorStatus('Charging');
                // StatusNotification
                const statusChgId = "sim-stat-chg-" + Date.now();
                socket.send(JSON.stringify([2, statusChgId, "StatusNotification", {
                  connectorId: 1,
                  errorCode: "NoError",
                  status: "Charging"
                }]));
                
                // StartTransaction request
                const startTransId = "sim-trans-start-" + Date.now();
                socket.send(JSON.stringify([2, startTransId, "StartTransaction", {
                  connectorId: 1,
                  idTag: payload.idTag || "ADMIN",
                  meterStart: 1250,
                  timestamp: new Date().toISOString()
                }]));
                addSimLog(`⚡ Mudança de estado: Conector em RECARGA. Enviado StartTransaction`, 'info');
              }, 1500);

            } else if (action === 'RemoteStopTransaction') {
              socket.send(JSON.stringify([3, msgId, { status: "Accepted" }]));
              addSimLog(`📤 REPOSTA OCPP: [RemoteStop] Aceito!`, 'out');

              setTimeout(() => {
                setSimConnectorStatus('Available');
                // StatusNotification
                const statusAvailId = "sim-stat-avl-" + Date.now();
                socket.send(JSON.stringify([2, statusAvailId, "StatusNotification", {
                  connectorId: 1,
                  errorCode: "NoError",
                  status: "Available"
                }]));

                // StopTransaction request
                const stopTransId = "sim-trans-stop-" + Date.now();
                socket.send(JSON.stringify([2, stopTransId, "StopTransaction", {
                  transactionId: 9912,
                  idTag: "ADMIN",
                  meterStop: 4890,
                  timestamp: new Date().toISOString()
                }]));
                addSimLog(`🔌 Mudança de estado: Recarga FINALIZADA. Enviado StopTransaction`, 'info');
              }, 1500);

            } else if (action === 'TriggerMessage') {
              socket.send(JSON.stringify([3, msgId, { status: "Accepted" }]));
              addSimLog(`📤 RESPOSTA OCPP: TriggerMessage [${payload.requestedMessage}] Aceito`, 'out');

              if (payload.requestedMessage === 'Heartbeat') {
                const hbId = "sim-hb-" + Date.now();
                socket.send(JSON.stringify([2, hbId, "Heartbeat", {}]));
                addSimLog(`📤 OCPP: Enviado Heartbeat`, 'out');
              } else if (payload.requestedMessage === 'StatusNotification') {
                const statusTrigId = "sim-trig-stat-" + Date.now();
                socket.send(JSON.stringify([2, statusTrigId, "StatusNotification", {
                  connectorId: 1,
                  errorCode: "NoError",
                  status: simConnectorStatus
                }]));
                addSimLog(`📤 OCPP: Re-enviado StatusNotification [${simConnectorStatus}]`, 'out');
              }
            } else if (action === 'Reset') {
              socket.send(JSON.stringify([3, msgId, { status: "Accepted" }]));
              addSimLog(`⚠️ Solicitação de RESET do Servidor! Simulador reiniciará em 2s.`, 'in');
              triggerToast(`♻️ Servidor solicitou reset de ${simChargerId}`, 'warning');
              
              setTimeout(() => {
                socket.close();
                handleConnectSimulator();
              }, 2000);
            } else if (action === 'UnlockConnector') {
              socket.send(JSON.stringify([3, msgId, { status: "Unlocked" }]));
              addSimLog(`🔓 Destravamento de conector aceito!`, 'out');
            } else {
              // Answer generic success for unhandled commands
              socket.send(JSON.stringify([3, msgId, { status: "Accepted" }]));
              addSimLog(`📤 REPOSTA OCPP: Comando genérico [${action}] aceito de forma padrão.`, 'out');
            }
          } else if (type === 3) {
            // CALL_RESULT reply from Server
            addSimLog(`📥 CONFIRMAÇÃO DO SERVIDOR (ID: ${msgId})`, 'in');
          }
        } catch (e) {
          addSimLog(`❌ Erro tratando frame OCPP: ${e}`, 'info');
        }
      };

      socket.onclose = () => {
        setSimSocket(null);
        setSimStatus('Disconnected');
        addSimLog("Conexão WebSocket fechada pelo servidor ou cliente.", 'info');
      };

      socket.onerror = (err) => {
        addSimLog(`❌ Falha na conexão WebSocket: Endereço indisponível ou recusado.`, 'info');
        setSimStatus('Disconnected');
      };

    } catch (e) {
      addSimLog(`❌ Falha fatal criando socket: ${e}`, 'info');
      setSimStatus('Disconnected');
    }
  };

  // Clean simulator on unmount
  useEffect(() => {
    return () => {
      if (simSocket) {
        simSocket.close();
      }
    };
  }, [simSocket]);

  if (loading && !stats && !hasConnectionError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl max-w-sm text-center">
          <RefreshCcw className="h-12 w-12 animate-spin text-[#0e467f]" />
          <h2 className="text-lg font-bold text-slate-800 font-display">Fotus Charge Bus</h2>
          <p className="text-slate-500 font-medium text-xs leading-relaxed">Conectando ao barramento de inteligência energética em alta frequência...</p>
        </div>
      </div>
    );
  }

  if (hasConnectionError && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc] p-6">
        <div className="flex flex-col items-center max-w-lg text-center gap-4 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Sem Sinal de Conexão</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Não foi possível ler as estatísticas do servidor Fotus em <code className="bg-slate-50 text-slate-900 font-mono text-xs px-2 py-1 rounded">Railway</code>. Certifique-se de que o backend de comunicação está online e tente reconectar.
          </p>
          <button onClick={() => loadData(true)} className="mt-2 px-6 py-3 bg-[#0e467f] text-white rounded-full text-xs font-bold hover:bg-blue-800 transition-all active:scale-95 shadow cursor-pointer">
            Reconectar Agora
          </button>
        </div>
      </div>
    );
  }

  const onlineCount = stats?.chargersOnline || 0;
  const offlineCount = stats?.chargersOffline || 0;
  const totalChargers = onlineCount + offlineCount;
  const onlinePercent = totalChargers > 0 ? Math.round((onlineCount / totalChargers) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar relative z-10 w-full h-full text-slate-800">
      
      {/* Toast Notification Deck */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100 flex gap-3.5 items-start animate-slide-in relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              t.type === 'success' ? 'bg-emerald-500' : t.type === 'warning' ? 'bg-rose-500' : 'bg-blue-500'
            }`} />
            
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              t.type === 'success' ? 'bg-emerald-50 text-emerald-600' : t.type === 'warning' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {t.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : t.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </div>

            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider block">{t.time} • NOTIFICAÇÃO REAL-TIME</span>
              <p className="text-xs font-bold text-slate-800 mt-1.5 leading-relaxed">{t.message}</p>
            </div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-505 bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Monitoramento de Alta Frequência Ativo (2s)</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0e467f] font-display">Painel de Supervisão</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Visão unificada das estações da rede integrada de recargas Fotus Solar</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setSimShowPanel(!simShowPanel)} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-xs font-bold shadow-xs border cursor-pointer active:scale-95 ${
              simShowPanel 
                ? 'bg-[#fab515]/10 text-amber-800 border-amber-300' 
                : 'bg-white border-slate-200 text-slate-600 hover:text-[#0e467f] hover:bg-slate-50'
            }`}
          >
            <Cpu className="h-4 w-4 text-[#fab515]" />
            {simShowPanel ? "Ocultar Simulador" : "Simulador Integrado"}
          </button>

          <button 
            onClick={() => loadData(false)} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] text-[#0e467f] hover:bg-[#f4f7fc] rounded-full transition-all text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Forçar Sincronismo
          </button>
        </div>
      </div>

      {/* UPPER BENTO GRID - Material Expressive 3 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Bento Card 1: Network Active Nodes (Spans 2 columns) */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#0e467f] to-[#043360] text-white p-6 rounded-[2.5rem] shadow-lg flex flex-col justify-between relative overflow-hidden h-56 group border-none">
          <div className="absolute top-0 right-0 w-52 h-52 bg-[#fab515]/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center text-brand-yellow">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fab515] font-mono">Infraestrutura em Nuvem</h3>
                <p className="text-base font-extrabold font-display">Estações Conectadas</p>
              </div>
            </div>
            <span className="text-3xl font-extrabold font-display text-brand-yellow pr-2">{onlinePercent}%</span>
          </div>

          <div className="my-2 relative z-10">
            <div className="w-full bg-[#1c5f9f]/40 h-2.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div 
                className="bg-gradient-to-r from-amber-400 to-[#fab515] h-full rounded-full transition-all duration-700" 
                style={{ width: `${onlinePercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-white/80 font-bold mt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {onlineCount} Online
              </span>
              <span>{offlineCount} Offline</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl relative z-10 border border-white/5 transition-colors">
            <span className="text-xs font-bold text-white/90">Protocolo OCPP 1.6-J & Socket Conectado</span>
            <span className="text-[10px] bg-emerald-500 text-slate-950 font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider font-mono">Ativo</span>
          </div>
        </div>

        {/* Bento Card 2: Active Recargas */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-[#e2e8f0] shadow-xs flex flex-col justify-between h-56 transition-all hover:shadow-md hover:border-[#0e467f]/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full blur-xl pointer-events-none group-hover:bg-[#0e467f]/5 transition-colors"></div>
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-2xl bg-[#0e467f]/10 flex items-center justify-center text-[#0e467f]">
              <BatteryCharging className="h-6 w-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 text-blue-700 bg-blue-50 border border-blue-100 rounded-full uppercase tracking-wider font-mono">Operação</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 text-slate-400 uppercase tracking-widest block mb-1">Recargas Simultâneas</span>
            <span className="text-4xl font-black text-[#0e467f] font-display pr-1">{stats?.activeSessions || 0}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold border-t border-slate-100 pt-3">Veículos sendo alimentados nesta hora</p>
        </div>

        {/* Bento Card 3: Total Energy Consumption */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-[#e2e8f0] shadow-xs flex flex-col justify-between h-56 transition-all hover:shadow-md hover:border-[#0e467f]/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full blur-xl pointer-events-none group-hover:bg-amber-100/30 transition-colors"></div>
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-2xl bg-[#fab515]/10 flex items-center justify-center text-[#c48d10]">
              <Activity className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Potência Consumida</span>
            <span className="text-3xl font-extrabold text-slate-800 font-display leading-none">
              {stats?.totalEnergyConsumed ? Number(stats.totalEnergyConsumed).toFixed(1) : '0.0'}
              <span className="text-base font-black text-[#0e467f] ml-1 font-display">kWh</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold border-t border-slate-100 pt-3">Consumo absoluto de eletricidade solar</p>
        </div>

      </section>

      {/* INTERACTIVE INTEGRATED SIMULATOR PANEL (MATERIAL EXPRESSIVE 3) */}
      {simShowPanel && (
        <section className="bg-gradient-to-tr from-[#1a202c] to-[#043360] text-slate-100 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fab515]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#fab515]/20 text-[#fab515] rounded-2xl flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  Simulador OCPP 1.6-J Integrado
                  <span className="text-[10px] bg-[#fab515] text-slate-950 font-black uppercase px-2.5 py-0.5 rounded-full font-mono">BETA</span>
                </h2>
                <p className="text-xs text-slate-350 text-slate-400">Gere e conecte uma estação virtual via WebSockets direto do seu navegador para testar recargas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#fab515] block mb-2 font-mono">ID de Simulação (Charge Point ID)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={simChargerId}
                    onChange={e => setSimChargerId(e.target.value)}
                    disabled={simStatus !== 'Disconnected'}
                    placeholder="Ex: FOTUS-EXPRESS-1"
                    className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-150 font-bold focus:outline-none focus:ring-1 focus:ring-[#fab515] font-mono text-white placeholder-slate-600"
                  />
                  <button 
                    onClick={handleConnectSimulator}
                    className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-2 shadow-sm ${
                      simStatus === 'Connected' 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                        : simStatus === 'Connecting' 
                        ? 'bg-slate-700 text-slate-400' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {simStatus === 'Connected' ? 'Desconectar' : simStatus === 'Connecting' ? 'Conectando...' : 'Ligar Simulador'}
                  </button>
                </div>
              </div>

              {simStatus === 'Connected' && (
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">Simular Ações do Conector 1</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase ${
                      simConnectorStatus === 'Charging' ? 'bg-[#0e467f] text-[#fab515]' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {simConnectorStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateSimStatusOnServer('Available')}
                      disabled={simConnectorStatus === 'Available'}
                      className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all border border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      🔌 Definir Disponível
                    </button>
                    <button 
                      onClick={() => updateSimStatusOnServer('Preparing')}
                      disabled={simConnectorStatus === 'Preparing'}
                      className="py-2 px-3 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all border border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      🛞 Simular Plugado (Preparing)
                    </button>
                    <button 
                      onClick={() => updateSimStatusOnServer('Charging')}
                      disabled={simConnectorStatus === 'Charging'}
                      className="py-2 px-3 bg-[#0e467f] hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all border border-blue-900 disabled:opacity-40 cursor-pointer col-span-2"
                    >
                      ⚡ Iniciar Carga (Charging)
                    </button>
                    <button 
                      onClick={() => updateSimStatusOnServer('Faulted')}
                      disabled={simConnectorStatus === 'Faulted'}
                      className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/40 text-xs font-bold text-rose-300 rounded-xl transition-all border border-rose-900 disabled:opacity-40 cursor-pointer col-span-2"
                    >
                      ⚠️ Simular Alerta de Falha (Faulted)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Live Console logs */}
            <div className="lg:col-span-7 flex flex-col h-48 lg:h-56 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 font-mono text-[10px]">
                <span className="text-slate-500 font-bold tracking-wider">// FRAME MONITOR DE SINALIZAÇÃO</span>
                <span className="text-emerald-500 font-black uppercase tracking-wider">ONLINE</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 scroll-smooth">
                {simLogs.length === 0 ? (
                  <div className="text-slate-650 text-slate-650 py-10 text-center leading-relaxed font-mono">
                    // Simulador em standby. Clique em 'Ligar Simulador' para<br/>
                    // gerar conexões e capturar transmissões OCPP aqui.
                  </div>
                ) : (
                  simLogs.map((log, i) => (
                    <div key={i} className="leading-normal flex gap-1.5 items-start">
                      <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                      <span className={`font-bold uppercase tracking-wider shrink-0 select-none ${
                        log.direction === 'in' ? 'text-blue-400' : log.direction === 'out' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {log.direction === 'in' ? '→' : log.direction === 'out' ? '←' : '•'}
                      </span>
                      <span className={`font-mono leading-relaxed ${
                        log.direction === 'in' ? 'text-blue-300' : log.direction === 'out' ? 'text-amber-200' : 'text-slate-400'
                      }`}>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN PLUGGED OVERVIEW: CHARGERS CARDS */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 mb-10 border border-[#e2e8f0] shadow-xs">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
           <div>
             <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 font-display">
               <Layers className="h-6 w-6 text-[#0e467f]" />
               Terminais de Recarga Ativos
             </h2>
             <p className="text-xs text-slate-505 text-slate-500 mt-0.5">Clique em Iniciar/Parar Recarga para interagir em tempo real</p>
           </div>
           
           <div className="flex gap-2.5">
             <button title="Conectar terminal físico" className="px-3.5 py-2 bg-slate-50 text-slate-600 hover:text-[#0e467f] hover:bg-[#0e467f]/5 rounded-xl transition-all border border-slate-200 active:scale-95 shadow-sm text-xs font-bold cursor-pointer">
               + Novo Link
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 relative">
          {chargers.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-slate-200/60 border-dashed">
              <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mb-3.5 border border-slate-100 shadow-xs">
                <AlertTriangle className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-800 font-extrabold text-sm font-display">Nenhum carregador conectado no barramento</p>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm text-center leading-relaxed">
                Recomendamos utilizar o <strong>Simulador OCPP Integrado</strong> acima para simular instantaneamente um novo terminal com apenas um clique!
              </p>
              
              {!simShowPanel && (
                <button 
                  onClick={() => setSimShowPanel(true)} 
                  className="mt-4 px-4 py-2 bg-[#0e467f] text-white rounded-full text-xs font-bold active:scale-95 cursor-pointer shadow-xs"
                >
                  Abrir Simulador OCPP agora
                </button>
              )}
            </div>
          ) : (
            chargers.map((charger, idx) => (
              <ChargerCard key={charger.id || idx} charger={charger} onRefresh={() => loadData(false)} />
            ))
          )}
        </div>

      </div>

    </div>
  );
}

// Internal Sub-component: ChargerCard utilizing compliant styles and actions
function ChargerCard({ charger, onRefresh }: { charger: Charger; onRefresh: () => any; key?: any }) {
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const handleAction = async (action: 'start' | 'stop' | 'reset') => {
    setActing(true);
    setActionError(null);
    let result: { success: boolean; message?: string } = { success: false, message: 'Erro desconhecido' };
    
    try {
      if (action === 'start') result = await startCharging(charger.id);
      else if (action === 'stop') result = await stopCharging(charger.id);
      else if (action === 'reset') result = await resetCharger(charger.id);
      
      if (!result.success && result.message) {
        setActionError(result.message);
        // Clean error after 4s
        setTimeout(() => setActionError(null), 4000);
      }
    } catch (e) {
      setActionError("Falha de rede ao disparar o comando");
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setActing(false);
      onRefresh();
    }
  };

  const connector = charger.connectors && charger.connectors.length > 0 ? charger.connectors[0] : null;
  const connectorStatus = connector ? connector.status : 'Unknown';
  const isOnline = charger.status === 'Online';
  const isCharging = connectorStatus === 'Charging';
  const isFaulted = connectorStatus === 'Faulted';

  // State Styling
  let statusColorClass = 'text-slate-500 bg-slate-50 border border-slate-200';
  let dotColor = 'bg-slate-400';
  let cardBorder = 'border-slate-200';
  let bgClass = 'bg-white hover:border-[#0e467f]/30';
  const displayConnectorLabel = connectorStatus === 'Preparing' ? 'Preparando Link' : connectorStatus;
  
  if (isFaulted) {
    statusColorClass = 'text-rose-700 bg-rose-50 border border-rose-200';
    dotColor = 'bg-rose-500 animate-pulse';
    cardBorder = 'border-rose-200 shadow-xs';
    bgClass = 'bg-white';
  } else if (!isOnline) {
    statusColorClass = 'text-slate-650 bg-slate-100 border border-slate-300';
    dotColor = 'bg-slate-505 bg-slate-500';
  } else if (isCharging) {
    statusColorClass = 'text-[#0e467f] bg-blue-50/70 border border-blue-200/80';
    dotColor = 'bg-[#0e467f] animate-pulse';
    cardBorder = 'border-[#0e467f]/40 shadow-xs';
    bgClass = 'bg-white';
  } else if (connectorStatus === 'Available') {
    statusColorClass = 'text-green-700 bg-emerald-50/70 border border-green-200/80';
    dotColor = 'bg-green-500';
    cardBorder = 'border-green-250 border-green-200';
    bgClass = 'bg-white hover:border-green-300';
  }

  const timeAgo = () => {
    if (!charger.ultimo_heartbeat) return 'Sem sinal recente';
    const ms = Date.now() - new Date(charger.ultimo_heartbeat).getTime();
    if (isNaN(ms)) return 'Sem sinal';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (seconds < 30) return 'Agora mesmo (Online)';
    if (minutes < 1) return `Há ${seconds}s`;
    if (minutes < 60) return `Há ${minutes}m`;
    return `Há ${Math.floor(minutes / 60)}h`;
  };

  return (
    <div className={`rounded-[2rem] p-6 flex flex-col gap-6 relative transition-all duration-350 border ${bgClass} ${cardBorder} shadow-xs group`}>

      {/* Expressive active glowing gradient line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 opacity-90 rounded-t-3xl transition-opacity duration-300 ${
        isCharging 
          ? 'bg-gradient-to-r from-transparent via-[#0e467f] to-transparent' 
          : isOnline 
          ? 'bg-transparent' 
          : 'bg-transparent'
      }`}></div>

      {/* Card Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
              isCharging ? 'bg-blue-50 border-blue-200 text-[#0e467f]' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <Zap className={`h-5 w-5 ${isOnline && !isFaulted ? 'text-[#0e467f]' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-display">{charger.charge_point_id || 'Estação'}</h3>
              <p className="text-slate-500 text-[11px] font-semibold mt-0.5 max-w-[160px] truncate">
                {charger.fabricante || 'Fotus'} • {charger.modelo || 'Conector Solar'}
              </p>
            </div>
        </div>
        
        {/* Status Pills */}
        <div className={`flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${statusColorClass} shrink-0`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
          {displayConnectorLabel}
        </div>
      </div>

      {/* Diagnostic telemetry parameters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Conetividade</span>
          <span className={`text-[10px] font-black font-mono ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Ultimo Sinal</span>
          <span className="text-[10px] font-bold text-slate-700 font-mono">{timeAgo()}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">ID</span>
          <span className="text-[10px] font-semibold text-slate-800 font-mono truncate max-w-[80px]" title={charger.id}>
            {charger.id}
          </span>
        </div>
      </div>

      {/* Action Error Alerts if they ever fail */}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-750 text-rose-800 p-2.5 rounded-xl text-xs font-bold leading-relaxed flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Controller Buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-1 border-t border-slate-100 pt-4">
        <button 
          onClick={() => handleAction('start')}
          disabled={!isOnline || isCharging || isFaulted || acting}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0e467f] hover:bg-blue-800 disabled:opacity-45 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold transition-all text-white shadow-xs flex-1 cursor-pointer active:scale-95"
        >
          <PlaySquare className="h-3.5 w-3.5" />
          Iniciar Recarga
        </button>
        
        <button 
          onClick={() => handleAction('stop')}
          disabled={!isOnline || !isCharging || acting}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-250 disabled:opacity-40 disabled:bg-slate-50 disabled:border-slate-150 disabled:text-slate-400 text-xs font-bold transition-all shadow-xs flex-1 cursor-pointer active:scale-95"
        >
          <Square className="h-3 w-3 fill-current" />
          Parar Recarga
        </button>
        
        <button 
          onClick={() => handleAction('reset')}
          disabled={acting || !isOnline}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-500 hover:border-slate-200 border border-transparent transition-all active:scale-95 cursor-pointer"
          title="Reiniciar dispositivo remotamente"
        >
          <PowerOff className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}

// Custom subcomponent icon
function PlaySquare({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
