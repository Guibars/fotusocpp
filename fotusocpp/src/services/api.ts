import { Charger, ChargerStats } from '../types';

const BACKEND_URL = "https://ocpp-backend-production.up.railway.app";

export async function getStats(): Promise<ChargerStats | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard-stats`);
    if (res.ok) {
      return await res.json();
    }
    console.warn(`Backend error on /api/dashboard-stats: status ${res.status}`);
  } catch (e) {
    console.warn("Connection to Railway backend failed.", e);
  }
  
  return null;
}

export async function getChargers(): Promise<Charger[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chargers`);
    if (res.ok) {
      return await res.json();
    }
    console.warn(`Backend error on /api/chargers: status ${res.status}`);
  } catch (e) {
    console.warn("Connection to Railway backend failed.", e);
  }
  return null;
}

export async function getEvents(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return null;
}

export async function getSessions(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/sessions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return null;
}

export async function startCharging(chargerId: string, connectorId: number = 1, idTag: string = "ADMIN"): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chargers/${chargerId}/remote-start`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectorId, idTag })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (res.status === 400 || res.status === 404) {
         return { success: false, message: data?.error || 'Could not start charging.' };
      }
    }
    return { success: res.ok };
  } catch (e) {
    console.warn("Action failed", e);
    return { success: false, message: 'Connection failed' };
  }
}

export async function stopCharging(chargerId: string, transactionId?: number): Promise<{ success: boolean; message?: string }> {
  try {
    const body: any = {};
    if (transactionId) body.transactionId = transactionId;

    const res = await fetch(`${BACKEND_URL}/api/chargers/${chargerId}/remote-stop`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (res.status === 400 || res.status === 404) {
         return { success: false, message: data?.error || 'Nenhuma transação ativa encontrada para este carregador.' };
      }
      return { success: false, message: 'Falha ao parar carregamento. ' + (data?.error || '') };
    }
    return { success: res.ok };
  } catch (e) {
    console.warn("Action failed", e);
    return { success: false, message: 'Connection failed' };
  }
}

export async function resetCharger(chargerId: string, type: 'Soft' | 'Hard' = 'Soft'): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chargers/${chargerId}/reset`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (res.status === 400 || res.status === 404) {
         return { success: false, message: data?.error || 'Nenhuma transação ativa encontrada para este carregador.' };
      }
      return { success: false, message: 'Falha ao parar carregamento. ' + (data?.error || '') };
    }
    return { success: res.ok };
  } catch (e) {
    console.warn("Action failed", e);
    return { success: false, message: 'Connection failed' };
  }
}

export async function getConfiguration(chargerId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/get-configuration`;
    const payload = {};
    console.log('[OCPP Lab] Command:', 'GetConfiguration');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);
    
    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to get configuration' };
    return { success: true, message: data?.message || 'Configuration request sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function changeConfiguration(chargerId: string, key: string, value: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/change-configuration`;
    const payload = { key, value };
    console.log('[OCPP Lab] Command:', 'ChangeConfiguration');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to change configuration' };
    return { success: true, message: data?.message || 'Change configuration sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function changeAvailability(chargerId: string, type: 'Operative' | 'Inoperative' = 'Operative', connectorId: number = 0): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/change-availability`;
    const payload = { connectorId, type };
    console.log('[OCPP Lab] Command:', 'ChangeAvailability');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to change availability' };
    return { success: true, message: data?.message || 'Change availability sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function unlockConnector(chargerId: string, connectorId: number = 1): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/unlock-connector`;
    const payload = { connectorId };
    console.log('[OCPP Lab] Command:', 'UnlockConnector');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to unlock connector' };
    return { success: true, message: data?.message || 'Unlock connector sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function clearCache(chargerId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/clear-cache`;
    const payload = {};
    console.log('[OCPP Lab] Command:', 'ClearCache');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to clear cache' };
    return { success: true, message: data?.message || 'Clear cache sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function triggerMessage(chargerId: string, requestedMessage: string, connectorId?: number): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/trigger-message`;
    const payload: any = { requestedMessage };
    if (connectorId !== undefined) payload.connectorId = connectorId;
    
    console.log('[OCPP Lab] Command:', 'TriggerMessage');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to trigger message' };
    return { success: true, message: data?.message || 'Trigger message sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function setChargingProfile(chargerId: string, csChargingProfiles: any): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BACKEND_URL}/api/chargers/${chargerId}/set-charging-profile`;
    const payload = { connectorId: 1, csChargingProfiles };
    
    console.log('[OCPP Lab] Command:', 'SetChargingProfile');
    console.log('[OCPP Lab] Charger ID:', chargerId);
    console.log('[OCPP Lab] URL:', url);
    console.log('[OCPP Lab] Payload:', payload);

    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: data?.error || 'Failed to set charging profile' };
    return { success: true, message: data?.message || 'Set charging profile sent' };
  } catch (e) {
    return { success: false, message: 'Connection failed' };
  }
}

export async function getCommandResults(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/command-results`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function getTariffs(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tariffs`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function getCurrentTariff(): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tariffs/current`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function getMeterValues(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/meter-values`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

