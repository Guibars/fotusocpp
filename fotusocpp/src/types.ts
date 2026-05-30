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
