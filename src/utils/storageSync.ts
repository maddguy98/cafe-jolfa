import { Order, ServiceRequest } from '../types';

const ORDERS_KEY = 'zeytoon_orders_v1';
const SERVICE_REQUESTS_KEY = 'zeytoon_service_requests_v1';
const STAFF_PIN_KEY = 'zeytoon_staff_pin_v1';
const CURRENT_TABLE_KEY = 'zeytoon_current_table_v1';

// BroadcastChannel for cross-tab realtime messaging
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('zeytoon_cafe_channel');
  }
} catch {
  // fallback
}

// Local cache helpers
export const getCachedOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setCachedOrders = (orders: Order[]) => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    broadcastChannel?.postMessage({ type: 'ORDERS_UPDATED', orders });
  } catch {
    // ignore
  }
};

export const getCachedServiceRequests = (): ServiceRequest[] => {
  try {
    const raw = localStorage.getItem(SERVICE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setCachedServiceRequests = (requests: ServiceRequest[]) => {
  try {
    localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(requests));
    broadcastChannel?.postMessage({ type: 'SERVICE_REQUESTS_UPDATED', requests });
  } catch {
    // ignore
  }
};

// ================= REMOTE API CLIENT =================

export async function fetchOrdersFromServer(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data: Order[] = await res.json();
      setCachedOrders(data);
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch orders from backend, using local cache:', err);
  }
  return getCachedOrders();
}

export async function createOrderOnServer(order: Order): Promise<Order> {
  // Update local cache immediately
  const current = getCachedOrders();
  const updated = [order, ...current.filter((o) => o.id !== order.id)];
  setCachedOrders(updated);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to post order to server:', err);
  }
  return order;
}

export async function updateOrderStatusOnServer(orderId: string, status: Order['status']): Promise<void> {
  const current = getCachedOrders();
  const updated = current.map((o) => (o.id === orderId ? { ...o, status } : o));
  setCachedOrders(updated);

  try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.error('Failed to update order status on server:', err);
  }
}

export async function deleteOrderOnServer(orderId: string): Promise<void> {
  const current = getCachedOrders();
  const updated = current.filter((o) => o.id !== orderId);
  setCachedOrders(updated);

  try {
    await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete order on server:', err);
  }
}

// ================= SERVICE REQUESTS (WAITER CALLS) API =================

export async function fetchServiceRequestsFromServer(): Promise<ServiceRequest[]> {
  try {
    const res = await fetch('/api/service-requests');
    if (res.ok) {
      const data: ServiceRequest[] = await res.json();
      setCachedServiceRequests(data);
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch service requests from backend, using local cache:', err);
  }
  return getCachedServiceRequests();
}

export async function createServiceRequestOnServer(request: ServiceRequest): Promise<ServiceRequest> {
  const current = getCachedServiceRequests();
  const updated = [request, ...current.filter((r) => r.id !== request.id)];
  setCachedServiceRequests(updated);

  try {
    const res = await fetch('/api/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to post service request to server:', err);
  }
  return request;
}

export async function updateServiceRequestStatusOnServer(
  requestId: string,
  status: ServiceRequest['status']
): Promise<void> {
  const current = getCachedServiceRequests();
  const updated = current.map((r) => (r.id === requestId ? { ...r, status } : r));
  setCachedServiceRequests(updated);

  try {
    await fetch(`/api/service-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.error('Failed to update service request on server:', err);
  }
}

export async function deleteServiceRequestOnServer(requestId: string): Promise<void> {
  const current = getCachedServiceRequests();
  const updated = current.filter((r) => r.id !== requestId);
  setCachedServiceRequests(updated);

  try {
    await fetch(`/api/service-requests/${requestId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete service request on server:', err);
  }
}

// PIN and Table helpers
export const getStaffPin = (): string => {
  try {
    return localStorage.getItem(STAFF_PIN_KEY) || '1234';
  } catch {
    return '1234';
  }
};

export const saveStaffPin = (newPin: string) => {
  try {
    localStorage.setItem(STAFF_PIN_KEY, newPin);
  } catch {
    // ignore
  }
};

export const getSavedTableNumber = (): string => {
  try {
    return localStorage.getItem(CURRENT_TABLE_KEY) || '۴';
  } catch {
    return '۴';
  }
};

export const saveTableNumber = (table: string) => {
  try {
    localStorage.setItem(CURRENT_TABLE_KEY, table);
  } catch {
    // ignore
  }
};

// Server Health and Sync check helper
export async function checkServerConnection(): Promise<{ ok: boolean; ordersCount: number; requestsCount: number; pingMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    const pingMs = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { ok: true, ordersCount: data.ordersCount || 0, requestsCount: data.requestsCount || 0, pingMs };
    }
  } catch (err) {
    console.warn('Server check failed:', err);
  }
  return { ok: false, ordersCount: 0, requestsCount: 0, pingMs: 0 };
}

// Smart merger to prevent orders from disappearing or flickering
export function mergeOrders(current: Order[], incoming: Order[], deletedIds: Set<string> = new Set()): Order[] {
  const map = new Map<string, Order>();
  current.forEach((o) => {
    if (!deletedIds.has(o.id)) map.set(o.id, o);
  });
  incoming.forEach((o) => {
    if (!deletedIds.has(o.id)) {
      map.set(o.id, o);
    }
  });
  return Array.from(map.values());
}

export function mergeServiceRequests(
  current: ServiceRequest[],
  incoming: ServiceRequest[],
  deletedIds: Set<string> = new Set()
): ServiceRequest[] {
  const map = new Map<string, ServiceRequest>();
  current.forEach((r) => {
    if (!deletedIds.has(r.id)) map.set(r.id, r);
  });
  incoming.forEach((r) => {
    if (!deletedIds.has(r.id)) {
      map.set(r.id, r);
    }
  });
  return Array.from(map.values());
}

// Real-time EventSource listener + safe fallback
export interface SyncEvent {
  type: 'INIT' | 'NEW_ORDER' | 'ORDERS_UPDATED' | 'NEW_SERVICE_REQUEST' | 'SERVICE_REQUESTS_UPDATED';
  payload?: any;
}

export function subscribeToRealtimeSync(onEvent: (event: SyncEvent) => void) {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  function connectSSE() {
    if (isClosed) return;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('INIT', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.orders) && data.orders.length > 0) {
            onEvent({ type: 'INIT', payload: data });
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('NEW_ORDER', (e) => {
        try {
          const order = JSON.parse(e.data);
          onEvent({ type: 'NEW_ORDER', payload: order });
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('ORDERS_UPDATED', (e) => {
        try {
          const orders = JSON.parse(e.data);
          if (Array.isArray(orders) && orders.length > 0) {
            onEvent({ type: 'ORDERS_UPDATED', payload: orders });
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('NEW_SERVICE_REQUEST', (e) => {
        try {
          const request = JSON.parse(e.data);
          onEvent({ type: 'NEW_SERVICE_REQUEST', payload: request });
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('SERVICE_REQUESTS_UPDATED', (e) => {
        try {
          const requests = JSON.parse(e.data);
          if (Array.isArray(requests) && requests.length > 0) {
            onEvent({ type: 'SERVICE_REQUESTS_UPDATED', payload: requests });
          }
        } catch {
          // ignore
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isClosed) {
          setTimeout(connectSSE, 3000);
        }
      };
    } catch (err) {
      console.warn('SSE connection error:', err);
    }
  }

  connectSSE();

  // Tab storage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ORDERS_KEY) {
      const cached = getCachedOrders();
      if (cached.length > 0) {
        onEvent({ type: 'ORDERS_UPDATED', payload: cached });
      }
    } else if (event.key === SERVICE_REQUESTS_KEY) {
      const cached = getCachedServiceRequests();
      if (cached.length > 0) {
        onEvent({ type: 'SERVICE_REQUESTS_UPDATED', payload: cached });
      }
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'ORDERS_UPDATED' && Array.isArray(event.data.orders) && event.data.orders.length > 0) {
      onEvent({ type: 'ORDERS_UPDATED', payload: event.data.orders });
    } else if (event.data?.type === 'SERVICE_REQUESTS_UPDATED' && Array.isArray(event.data.requests) && event.data.requests.length > 0) {
      onEvent({ type: 'SERVICE_REQUESTS_UPDATED', payload: event.data.requests });
    }
  };

  window.addEventListener('storage', handleStorage);
  broadcastChannel?.addEventListener('message', handleBroadcast);

  return () => {
    isClosed = true;
    eventSource?.close();
    window.removeEventListener('storage', handleStorage);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
  };
}
