import mqtt, { MqttClient } from 'mqtt';
import { Order, ServiceRequest } from '../types';
import {
  getCachedOrders,
  setCachedOrders,
  getCachedServiceRequests,
  setCachedServiceRequests,
} from './storageSync';

// Unique topic identifier for Zeytoon Cafe based on applet ID
const APPLET_TOPIC_PREFIX = 'zeytoon_cafe_aec3f6c3';
const ORDERS_TOPIC = `${APPLET_TOPIC_PREFIX}/orders`;
const REQUESTS_TOPIC = `${APPLET_TOPIC_PREFIX}/requests`;
const STATUS_TOPIC = `${APPLET_TOPIC_PREFIX}/status`;
const SYNC_TOPIC = `${APPLET_TOPIC_PREFIX}/sync`;

// Reliable public secure WebSocket MQTT brokers with SSL/TLS
const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
];

let client: MqttClient | null = null;
let currentBrokerIndex = 0;
let isConnected = false;
let onSyncCallbacks: Array<(event: { type: string; payload: any }) => void> = [];

export function getCloudConnectionStatus(): boolean {
  return isConnected;
}

export function subscribeCloudSync(callback: (event: { type: string; payload: any }) => void) {
  onSyncCallbacks.push(callback);
  return () => {
    onSyncCallbacks = onSyncCallbacks.filter((cb) => cb !== callback);
  };
}

function notifySubscribers(type: string, payload: any) {
  onSyncCallbacks.forEach((cb) => {
    try {
      cb({ type, payload });
    } catch (e) {
      console.warn('Error in cloud sync subscriber:', e);
    }
  });
}

export function initCloudSync() {
  if (client) return;

  const clientId = `zeytoon_${Math.random().toString(16).substring(2, 10)}`;
  const brokerUrl = BROKERS[currentBrokerIndex];

  try {
    client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2500,
      keepalive: 30,
    });

    client.on('connect', () => {
      isConnected = true;
      console.log(`[CloudSync] Connected to MQTT broker: ${brokerUrl}`);

      client?.subscribe(
        [ORDERS_TOPIC, REQUESTS_TOPIC, STATUS_TOPIC, SYNC_TOPIC],
        { qos: 1 },
        (err) => {
          if (err) {
            console.error('[CloudSync] Subscription error:', err);
          } else {
            console.log('[CloudSync] Subscribed to all cafe channels');
            // Request existing orders from any active reception terminal
            broadcastCloudEvent(SYNC_TOPIC, { type: 'QUERY_STATE', from: clientId });
          }
        }
      );
    });

    client.on('message', (topic, messageBuffer) => {
      try {
        const raw = messageBuffer.toString();
        const data = JSON.parse(raw);
        if (!data || !data.type) return;

        console.log(`[CloudSync] Received message on ${topic}:`, data.type);

        if (topic === ORDERS_TOPIC) {
          if (data.type === 'NEW_ORDER' && data.order) {
            const order: Order = data.order;
            const current = getCachedOrders();
            const updated = [order, ...current.filter((o) => o.id !== order.id)];
            setCachedOrders(updated);
            notifySubscribers('NEW_ORDER', order);
          } else if (data.type === 'DELETE_ORDER' && data.orderId) {
            const current = getCachedOrders();
            const updated = current.filter((o) => o.id !== data.orderId);
            setCachedOrders(updated);
            notifySubscribers('ORDERS_UPDATED', updated);
          }
        } else if (topic === REQUESTS_TOPIC) {
          if (data.type === 'NEW_SERVICE_REQUEST' && data.request) {
            const req: ServiceRequest = data.request;
            const current = getCachedServiceRequests();
            const updated = [req, ...current.filter((r) => r.id !== req.id)];
            setCachedServiceRequests(updated);
            notifySubscribers('NEW_SERVICE_REQUEST', req);
          } else if (data.type === 'DELETE_SERVICE_REQUEST' && data.requestId) {
            const current = getCachedServiceRequests();
            const updated = current.filter((r) => r.id !== data.requestId);
            setCachedServiceRequests(updated);
            notifySubscribers('SERVICE_REQUESTS_UPDATED', updated);
          }
        } else if (topic === STATUS_TOPIC) {
          if (data.type === 'ORDER_STATUS_CHANGED' && data.orderId && data.status) {
            const current = getCachedOrders();
            const updated = current.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o));
            setCachedOrders(updated);
            notifySubscribers('ORDERS_UPDATED', updated);
          } else if (data.type === 'SERVICE_STATUS_CHANGED' && data.requestId && data.status) {
            const current = getCachedServiceRequests();
            const updated = current.map((r) =>
              r.id === data.requestId ? { ...r, status: data.status } : r
            );
            setCachedServiceRequests(updated);
            notifySubscribers('SERVICE_REQUESTS_UPDATED', updated);
          }
        } else if (topic === SYNC_TOPIC) {
          if (data.type === 'QUERY_STATE') {
            // If this client has orders, respond with current state
            const currentOrders = getCachedOrders();
            const currentRequests = getCachedServiceRequests();
            if (currentOrders.length > 0 || currentRequests.length > 0) {
              broadcastCloudEvent(SYNC_TOPIC, {
                type: 'FULL_STATE_PAYLOAD',
                orders: currentOrders,
                requests: currentRequests,
              });
            }
          } else if (data.type === 'FULL_STATE_PAYLOAD') {
            if (Array.isArray(data.orders) && data.orders.length > 0) {
              const current = getCachedOrders();
              // Merge without losing any unique orders
              const map = new Map<string, Order>();
              data.orders.forEach((o: Order) => map.set(o.id, o));
              current.forEach((o: Order) => {
                if (!map.has(o.id)) map.set(o.id, o);
              });
              const merged = Array.from(map.values());
              setCachedOrders(merged);
              notifySubscribers('ORDERS_UPDATED', merged);
            }
            if (Array.isArray(data.requests) && data.requests.length > 0) {
              const current = getCachedServiceRequests();
              const map = new Map<string, ServiceRequest>();
              data.requests.forEach((r: ServiceRequest) => map.set(r.id, r));
              current.forEach((r: ServiceRequest) => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              const merged = Array.from(map.values());
              setCachedServiceRequests(merged);
              notifySubscribers('SERVICE_REQUESTS_UPDATED', merged);
            }
          }
        }
      } catch (err) {
        console.warn('[CloudSync] Error parsing message:', err);
      }
    });

    client.on('error', (err) => {
      console.warn('[CloudSync] MQTT Error:', err);
      isConnected = false;
    });

    client.on('close', () => {
      isConnected = false;
    });

    client.on('offline', () => {
      isConnected = false;
      // Switch broker if offline
      currentBrokerIndex = (currentBrokerIndex + 1) % BROKERS.length;
    });
  } catch (err) {
    console.error('[CloudSync] Initialization failed:', err);
  }
}

function broadcastCloudEvent(topic: string, payload: any) {
  if (!client || !isConnected) {
    initCloudSync();
  }
  try {
    const msg = JSON.stringify(payload);
    client?.publish(topic, msg, { qos: 1, retain: false }, (err) => {
      if (err) {
        console.warn('[CloudSync] Publish error:', err);
      }
    });
  } catch (e) {
    console.warn('[CloudSync] Broadcast failed:', e);
  }
}

export function publishNewOrderToCloud(order: Order) {
  broadcastCloudEvent(ORDERS_TOPIC, { type: 'NEW_ORDER', order });
  // Also push state payload so new joining devices receive it
  broadcastCloudEvent(SYNC_TOPIC, {
    type: 'FULL_STATE_PAYLOAD',
    orders: getCachedOrders(),
    requests: getCachedServiceRequests(),
  });
}

export function publishOrderStatusToCloud(orderId: string, status: Order['status']) {
  broadcastCloudEvent(STATUS_TOPIC, { type: 'ORDER_STATUS_CHANGED', orderId, status });
}

export function publishDeleteOrderToCloud(orderId: string) {
  broadcastCloudEvent(ORDERS_TOPIC, { type: 'DELETE_ORDER', orderId });
}

export function publishNewServiceRequestToCloud(request: ServiceRequest) {
  broadcastCloudEvent(REQUESTS_TOPIC, { type: 'NEW_SERVICE_REQUEST', request });
  broadcastCloudEvent(SYNC_TOPIC, {
    type: 'FULL_STATE_PAYLOAD',
    orders: getCachedOrders(),
    requests: getCachedServiceRequests(),
  });
}

export function publishServiceRequestStatusToCloud(requestId: string, status: ServiceRequest['status']) {
  broadcastCloudEvent(STATUS_TOPIC, { type: 'SERVICE_STATUS_CHANGED', requestId, status });
}

export function publishDeleteServiceRequestToCloud(requestId: string) {
  broadcastCloudEvent(REQUESTS_TOPIC, { type: 'DELETE_SERVICE_REQUEST', requestId });
}

export function requestCloudFullSync() {
  broadcastCloudEvent(SYNC_TOPIC, { type: 'QUERY_STATE' });
}
