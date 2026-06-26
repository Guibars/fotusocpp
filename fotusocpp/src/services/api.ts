import { Charger, ChargerStats } from '../types';

export const BACKEND_URL =
  ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://ocpp-backend-production.up.railway.app';

type ApiResult<T> = T | null;
type CommandResponse = {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  status?: string;
};

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || data?.message || `Backend returned ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function safeRead<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    return await readJson<T>(path, init);
  } catch (error) {
    console.warn(`[API] ${path}`, error);
    return null;
  }
}

async function command(path: string, body: Record<string, unknown> = {}): Promise<CommandResponse> {
  try {
    const data = await readJson<CommandResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return data || { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export function getBackendHost() {
  try {
    return new URL(BACKEND_URL).host;
  } catch {
    return BACKEND_URL;
  }
}

export async function getHealth(): Promise<ApiResult<{ status: string; database: string; timestamp: string }>> {
  return safeRead('/api/health');
}

export async function getStats(): Promise<ApiResult<ChargerStats>> {
  return safeRead('/api/dashboard-stats');
}

export async function getChargers(): Promise<ApiResult<Charger[]>> {
  return safeRead('/api/chargers');
}

export async function getEvents(limit = 50): Promise<ApiResult<any[]>> {
  return safeRead(`/api/events?limit=${limit}`);
}

export async function getSessions(): Promise<ApiResult<any[]>> {
  return safeRead('/api/sessions');
}

export async function getMeterValues(limit = 100): Promise<ApiResult<any[]>> {
  return safeRead(`/api/meter-values?limit=${limit}`);
}

export async function getCommandResults(limit = 100): Promise<ApiResult<any[]>> {
  return safeRead(`/api/command-results?limit=${limit}`);
}

export async function getCommandResultByMessageId(messageId: string): Promise<ApiResult<any>> {
  return safeRead(`/api/command-results/${messageId}`);
}

export async function getTariffs(): Promise<ApiResult<any[]>> {
  return safeRead('/api/tariffs');
}

export async function getCurrentTariff(): Promise<ApiResult<any>> {
  return safeRead('/api/tariffs/current');
}

export async function updateCurrentTariff(pricePerKwh: number, name: string): Promise<CommandResponse> {
  try {
    const data = await readJson<CommandResponse & Record<string, unknown>>('/api/tariffs/current', {
      method: 'PATCH',
      body: JSON.stringify({ pricePerKwh, name }),
    });
    return { success: data?.success !== false, ...data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function getTariffEstimate(energyKwh: number): Promise<ApiResult<any>> {
  return safeRead(`/api/tariffs/estimate?energyKwh=${encodeURIComponent(String(energyKwh))}`);
}

export async function startCharging(
  chargerId: string,
  connectorId = 1,
  idTag = 'ADMIN',
): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/remote-start`, { connectorId, idTag });
}

export async function stopCharging(chargerId: string, transactionId?: number): Promise<CommandResponse> {
  const body: Record<string, unknown> = {};
  if (transactionId !== undefined) body.transactionId = transactionId;
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/remote-stop`, body);
}

export async function resetCharger(chargerId: string, type: 'Soft' | 'Hard' = 'Soft'): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/reset`, { type });
}

export async function getConfiguration(chargerId: string, keys?: string[]): Promise<CommandResponse> {
  const body = keys && keys.length > 0 ? { keys } : {};
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/get-configuration`, body);
}

export async function changeConfiguration(
  chargerId: string,
  key: string,
  value: string,
): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/change-configuration`, { key, value });
}

export async function changeAvailability(
  chargerId: string,
  type: 'Operative' | 'Inoperative' = 'Operative',
  connectorId = 1,
): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/change-availability`, { connectorId, type });
}

export async function unlockConnector(chargerId: string, connectorId = 1): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/unlock-connector`, { connectorId });
}

export async function clearCache(chargerId: string): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/clear-cache`);
}

export async function triggerMessage(
  chargerId: string,
  requestedMessage: string,
  connectorId?: number,
): Promise<CommandResponse> {
  const body: Record<string, unknown> = { requestedMessage };
  if (connectorId !== undefined) body.connectorId = connectorId;
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/trigger-message`, body);
}

export async function setChargingProfile(chargerId: string, csChargingProfiles: any): Promise<CommandResponse> {
  return command(`/api/chargers/${encodeURIComponent(chargerId)}/set-charging-profile`, {
    connectorId: 1,
    csChargingProfiles,
  });
}
