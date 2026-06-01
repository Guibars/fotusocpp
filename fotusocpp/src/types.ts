export type SystemStatus = 'Online' | 'Offline' | string;
export type ConnectorStatus = 'Available' | 'Charging' | 'Faulted' | 'Preparing' | 'Finishing' | 'Unavailable' | string;

export interface Connector {
  id: string;
  connector_number: number;
  status: ConnectorStatus;
}

export interface Charger {
  id: string;
  charge_point_id: string;
  fabricante: string;
  modelo: string;
  status: SystemStatus;
  ultimo_heartbeat: string;
  connectors: Connector[];
}

export interface ChargerStats {
  chargersOnline: number;
  chargersOffline: number;
  activeSessions: number;
  totalEnergyConsumed: number;
  sessions?: {
    totalRevenue: number;
  };
  tariff?: {
    name: string;
    pricePerKwh: number;
  };
}

export interface OcppEvent {
  id?: string;
  direction?: 'IN' | 'OUT' | string;
  action: string;
  charge_point_id: string;
  payload: any;
  created_at?: string;
  data_hora?: string;
}

export interface Session {
  id?: string;
  charge_point_id: string;
  connector_id: number;
  transaction_id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  energy_kwh: number;
}

export interface CommandResult {
  id?: string;
  action: string;
  status: string;
  charge_point_id: string;
  request_payload?: any;
  response_payload?: any;
  erro?: string;
  created_at?: string;
}

export interface Tariff {
  id?: string;
  name: string;
  pricePerKwh: number;
  status?: string;
}

export interface MeterValue {
  id?: string;
  charge_point_id: string;
  transaction_id: number;
  connector_id?: number;
  timestamp?: string;
  energia_kwh?: number;
  potencia_kw?: number;
  tensao_v?: number;
  corrente_a?: number;
}
