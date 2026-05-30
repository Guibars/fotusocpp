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
      return { success: false, message: data?.error || 'Failed to reset' };
    }
    return { success: res.ok };
  } catch (e) {
    console.warn("Action failed", e);
    return { success: false, message: 'Connection failed' };
  }
}
