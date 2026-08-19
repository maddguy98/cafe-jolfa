import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface OrderItem {
  cartItemId: string;
  item: {
    id: string;
    title: string;
    titleEn: string;
    price: number;
    image: string;
    [key: string]: unknown;
  };
  quantity: number;
  selectedMilk?: string;
  selectedSweetness?: string;
  selectedTemperature?: string;
  selectedSyrups?: string[];
  notes?: string;
  itemTotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  orderType: 'dine_in' | 'takeaway';
  tableNumber?: string;
  createdAt: string;
  estimatedReadyTime: string;
  customerName: string;
  customerPhone: string;
}

interface ServiceRequest {
  id: string;
  tableNumber: string;
  requestType: 'bill' | 'clean' | 'reorder' | 'water' | 'napkin_sugar' | 'custom';
  requestLabel: string;
  customNote?: string;
  createdAt: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed';
  handledBy?: string;
}

// In-memory data store with file persistence fallback
let orders: Order[] = [];
let serviceRequests: ServiceRequest[] = [];

const DATA_FILE = path.join(process.cwd(), '.zeytoon_data.json');

function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.orders)) orders = data.orders;
      if (Array.isArray(data.serviceRequests)) serviceRequests = data.serviceRequests;
    }
  } catch (err) {
    console.error('Error loading persisted data:', err);
  }
}

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ orders, serviceRequests }), 'utf-8');
  } catch (err) {
    console.error('Error persisting data:', err);
  }
}

loadPersistedData();

// SSE Connected Clients list
const sseClients: express.Response[] = [];

function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware for multi-device & preview access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      ordersCount: orders.length,
      requestsCount: serviceRequests.length,
    });
  });

  // Server-Sent Events (SSE) stream for instant real-time sync across devices
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on reverse proxies
    res.flushHeaders();

    // Initial state push
    res.write(`event: INIT\ndata: ${JSON.stringify({ orders, serviceRequests })}\n\n`);

    sseClients.push(res);

    // Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const index = sseClients.indexOf(res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // ================= ORDERS API =================
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const newOrder: Order = req.body;
    if (!newOrder || !newOrder.id || !Array.isArray(newOrder.items)) {
      return res.status(400).json({ error: 'Invalid order structure' });
    }

    // Prepend new order
    orders = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
    persistData();

    // Broadcast to all devices (cashier, kitchen, waiter, other customers)
    broadcastSSE('NEW_ORDER', newOrder);
    broadcastSSE('ORDERS_UPDATED', orders);

    return res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status) {
      orders[orderIndex].status = status;
    }

    persistData();
    broadcastSSE('ORDER_STATUS_CHANGED', orders[orderIndex]);
    broadcastSSE('ORDERS_UPDATED', orders);

    return res.json(orders[orderIndex]);
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter((o) => o.id !== id);
    persistData();

    broadcastSSE('ORDERS_UPDATED', orders);
    return res.json({ success: true, id });
  });

  // ================= SERVICE REQUESTS (WAITER CALLS) API =================
  app.get('/api/service-requests', (req, res) => {
    res.json(serviceRequests);
  });

  app.post('/api/service-requests', (req, res) => {
    const newRequest: ServiceRequest = req.body;
    if (!newRequest || !newRequest.id || !newRequest.tableNumber) {
      return res.status(400).json({ error: 'Invalid service request structure' });
    }

    // Prepend new request
    serviceRequests = [newRequest, ...serviceRequests.filter((r) => r.id !== newRequest.id)];
    persistData();

    // Broadcast to all devices
    broadcastSSE('NEW_SERVICE_REQUEST', newRequest);
    broadcastSSE('SERVICE_REQUESTS_UPDATED', serviceRequests);

    return res.status(201).json(newRequest);
  });

  app.patch('/api/service-requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const reqIndex = serviceRequests.findIndex((r) => r.id === id);
    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (status) {
      serviceRequests[reqIndex].status = status;
    }

    persistData();
    broadcastSSE('SERVICE_REQUESTS_UPDATED', serviceRequests);

    return res.json(serviceRequests[reqIndex]);
  });

  app.delete('/api/service-requests/:id', (req, res) => {
    const { id } = req.params;
    serviceRequests = serviceRequests.filter((r) => r.id !== id);
    persistData();

    broadcastSSE('SERVICE_REQUESTS_UPDATED', serviceRequests);
    return res.json({ success: true, id });
  });

  // Vite middleware for development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zeytoon Cafe Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
