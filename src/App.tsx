import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, MENU_ITEMS } from './data/menuData';
import { CartItem, MenuItem, Order, ServiceRequest, TabType } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductPeekModal } from './components/ProductPeekModal';
import { OrderDrawer } from './components/OrderDrawer';
import { BottomNav } from './components/BottomNav';
import { FloatingOrderButton } from './components/FloatingOrderButton';
import { HomeTab } from './components/HomeTab';
import { OrdersTab } from './components/OrdersTab';
import { SearchModal } from './components/SearchModal';
import { SidebarDrawer } from './components/SidebarDrawer';
import { SplashScreen } from './components/SplashScreen';
import { CallWaiterModal } from './components/CallWaiterModal';
import { StaffPinModal } from './components/StaffPinModal';
import { StaffDashboardModal } from './components/StaffDashboardModal';
import { soundManager } from './utils/audioAlert';
import {
  getCachedOrders,
  getCachedServiceRequests,
  fetchOrdersFromServer,
  fetchServiceRequestsFromServer,
  createOrderOnServer,
  updateOrderStatusOnServer,
  deleteOrderOnServer,
  createServiceRequestOnServer,
  updateServiceRequestStatusOnServer,
  deleteServiceRequestOnServer,
  subscribeToRealtimeSync,
  mergeOrders,
  mergeServiceRequests,
} from './utils/storageSync';
import {
  initCloudSync,
  subscribeCloudSync,
  publishNewOrderToCloud,
  publishOrderStatusToCloud,
  publishDeleteOrderToCloud,
  publishNewServiceRequestToCloud,
  publishServiceRequestStatusToCloud,
  publishDeleteServiceRequestToCloud,
  requestCloudFullSync,
} from './utils/cloudSync';
import { motion, AnimatePresence } from 'motion/react';
import { m3Variants } from './theme/m3Motion';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('hot_drinks');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);
  const [peekingItem, setPeekingItem] = useState<MenuItem | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // States for customer call waiter and secret staff mode
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState<boolean>(false);
  const [isStaffPinOpen, setIsStaffPinOpen] = useState<boolean>(false);
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Secret staff access trigger: 5-finger simultaneous touch on mobile OR 'f' key on desktop
  useEffect(() => {
    // 1. Mobile 5-finger gesture
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 5) {
        setIsStaffPinOpen(true);
      }
    };

    // 2. Desktop 'f' key trigger (ignoring input/textarea fields)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isInput) return;

      if (e.key === 'f' || e.key === 'F' || e.code === 'KeyF' || e.key === 'ب') {
        e.preventDefault();
        setIsStaffPinOpen((prev) => !prev);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Preload hero and main images in the background while splash is shown
  useEffect(() => {
    const imagesToPreload = MENU_ITEMS.slice(0, 6).map((item) => item.image);
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Initial cart items (2 items matching the screenshot badge "سفارش سریع (۲)")
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const item1 = MENU_ITEMS.find((i) => i.id === 'espresso') || MENU_ITEMS[0];
    const item2 = MENU_ITEMS.find((i) => i.id === 'cappuccino') || MENU_ITEMS[1];
    return [
      {
        cartItemId: `init-${item1.id}`,
        item: item1,
        quantity: 1,
        itemTotal: item1.price,
      },
      {
        cartItemId: `init-${item2.id}`,
        item: item2,
        quantity: 1,
        itemTotal: item2.price,
      },
    ];
  });

  const [orders, setOrders] = useState<Order[]>(() => getCachedOrders());
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() =>
    getCachedServiceRequests()
  );

  const localSubmittedOrderIds = useRef<Set<string>>(new Set());
  const localSubmittedRequestIds = useRef<Set<string>>(new Set());
  const deletedOrderIds = useRef<Set<string>>(new Set());
  const deletedRequestIds = useRef<Set<string>>(new Set());

  // Real-time server and multi-device cloud synchronization
  useEffect(() => {
    // 1. Initialize cloud MQTT sync across all devices worldwide
    initCloudSync();

    // 2. Initial fetch from local server cache
    fetchOrdersFromServer().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setOrders((prev) => mergeOrders(prev, data, deletedOrderIds.current));
      }
    });
    fetchServiceRequestsFromServer().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setServiceRequests((prev) => mergeServiceRequests(prev, data, deletedRequestIds.current));
      }
    });

    // 3. Subscribe to cloud events (instant cross-device delivery via WebSocket)
    const unsubCloud = subscribeCloudSync((event) => {
      if (event.type === 'NEW_ORDER') {
        const order = event.payload as Order;
        if (order && !deletedOrderIds.current.has(order.id)) {
          setOrders((prev) => mergeOrders(prev, [order], deletedOrderIds.current));
          if (!localSubmittedOrderIds.current.has(order.id)) {
            soundManager.playNewOrderChime();
          }
        }
      } else if (event.type === 'ORDERS_UPDATED') {
        if (Array.isArray(event.payload) && event.payload.length > 0) {
          setOrders((prev) => mergeOrders(prev, event.payload, deletedOrderIds.current));
        }
      } else if (event.type === 'NEW_SERVICE_REQUEST') {
        const request = event.payload as ServiceRequest;
        if (request && !deletedRequestIds.current.has(request.id)) {
          setServiceRequests((prev) => mergeServiceRequests(prev, [request], deletedRequestIds.current));
          if (!localSubmittedRequestIds.current.has(request.id)) {
            soundManager.playWaiterCallChime();
          }
        }
      } else if (event.type === 'SERVICE_REQUESTS_UPDATED') {
        if (Array.isArray(event.payload) && event.payload.length > 0) {
          setServiceRequests((prev) => mergeServiceRequests(prev, event.payload, deletedRequestIds.current));
        }
      }
    });

    // 4. Subscribe to server SSE stream
    const unsubServer = subscribeToRealtimeSync((event) => {
      if (event.type === 'INIT') {
        if (event.payload?.orders && event.payload.orders.length > 0) {
          setOrders((prev) => mergeOrders(prev, event.payload.orders, deletedOrderIds.current));
        }
        if (event.payload?.serviceRequests && event.payload.serviceRequests.length > 0) {
          setServiceRequests((prev) => mergeServiceRequests(prev, event.payload.serviceRequests, deletedRequestIds.current));
        }
      } else if (event.type === 'NEW_ORDER') {
        const order = event.payload as Order;
        if (order && !deletedOrderIds.current.has(order.id)) {
          setOrders((prev) => mergeOrders(prev, [order], deletedOrderIds.current));
          if (!localSubmittedOrderIds.current.has(order.id)) {
            soundManager.playNewOrderChime();
          }
        }
      } else if (event.type === 'ORDERS_UPDATED') {
        if (Array.isArray(event.payload) && event.payload.length > 0) {
          setOrders((prev) => mergeOrders(prev, event.payload, deletedOrderIds.current));
        }
      } else if (event.type === 'NEW_SERVICE_REQUEST') {
        const request = event.payload as ServiceRequest;
        if (request && !deletedRequestIds.current.has(request.id)) {
          setServiceRequests((prev) => mergeServiceRequests(prev, [request], deletedRequestIds.current));
          if (!localSubmittedRequestIds.current.has(request.id)) {
            soundManager.playWaiterCallChime();
          }
        }
      } else if (event.type === 'SERVICE_REQUESTS_UPDATED') {
        if (Array.isArray(event.payload) && event.payload.length > 0) {
          setServiceRequests((prev) => mergeServiceRequests(prev, event.payload, deletedRequestIds.current));
        }
      }
    });

    return () => {
      unsubCloud();
      unsubServer();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleQuickAdd = (item: MenuItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartItems((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.cartItemId === existing.cartItemId
            ? {
                ...c,
                quantity: c.quantity + 1,
                itemTotal: (c.quantity + 1) * c.item.price,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          cartItemId: `${item.id}-${Date.now()}`,
          item,
          quantity: 1,
          itemTotal: item.price,
        },
      ];
    });
  };

  const handleAddToCart = (cartItem: CartItem) => {
    setCartItems((prev) => [...prev, cartItem]);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const unit = item.itemTotal / item.quantity;
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: unit * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handlePlaceOrder = (order: Order) => {
    localSubmittedOrderIds.current.add(order.id);
    const updated = [order, ...orders.filter((o) => o.id !== order.id)];
    setOrders(updated);

    // 1. Broadcast to cloud (MQTT WebSockets) for instant multi-device sync
    publishNewOrderToCloud(order);

    // 2. Send to backend server
    createOrderOnServer(order);

    // Audio chime dispatched for customer
    soundManager.playCustomerConfirmation();

    showToast(`سفارش #${order.orderNumber} با موفقیت ثبت و به پذیرش کافه ارسال شد.`);
    setActiveTab('orders');
  };

  const handleServiceRequestSubmitted = (request: ServiceRequest) => {
    localSubmittedRequestIds.current.add(request.id);
    const updated = [request, ...serviceRequests.filter((r) => r.id !== request.id)];
    setServiceRequests(updated);

    // 1. Broadcast to cloud for instant delivery to waiter / reception device
    publishNewServiceRequestToCloud(request);

    // 2. Send to backend server
    createServiceRequestOnServer(request);

    // Confirmation chime for customer
    soundManager.playCustomerConfirmation();

    showToast(`درخواست شما (میز ${request.tableNumber}) با موفقیت برای گارسون ارسال شد.`);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    publishOrderStatusToCloud(orderId, newStatus);
    updateOrderStatusOnServer(orderId, newStatus);
  };

  const handleDeleteOrder = (orderId: string) => {
    deletedOrderIds.current.add(orderId);
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    publishDeleteOrderToCloud(orderId);
    deleteOrderOnServer(orderId);
  };

  const handleUpdateServiceStatus = (requestId: string, newStatus: ServiceRequest['status']) => {
    const updated = serviceRequests.map((r) =>
      r.id === requestId ? { ...r, status: newStatus } : r
    );
    setServiceRequests(updated);
    publishServiceRequestStatusToCloud(requestId, newStatus);
    updateServiceRequestStatusOnServer(requestId, newStatus);
  };

  const handleDeleteServiceRequest = (requestId: string) => {
    deletedRequestIds.current.add(requestId);
    const updated = serviceRequests.filter((r) => r.id !== requestId);
    setServiceRequests(updated);
    publishDeleteServiceRequestToCloud(requestId);
    deleteServiceRequestOnServer(requestId);
  };

  const handleAddSampleOrder = () => {
    const sampleItem1 = MENU_ITEMS[0];
    const sampleItem2 = MENU_ITEMS[2];
    const sample: Order = {
      id: `ord-sample-${Date.now()}`,
      orderNumber: `NB-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [
        {
          cartItemId: `s1-${Date.now()}`,
          item: sampleItem1,
          quantity: 2,
          itemTotal: sampleItem1.price * 2,
          selectedMilk: 'شیر جو دوسر',
        },
        {
          cartItemId: `s2-${Date.now()}`,
          item: sampleItem2,
          quantity: 1,
          itemTotal: sampleItem2.price,
        },
      ],
      subtotal: sampleItem1.price * 2 + sampleItem2.price,
      discount: 0,
      tax: 0,
      total: sampleItem1.price * 2 + sampleItem2.price,
      status: 'received',
      orderType: 'dine_in',
      tableNumber: '۷',
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      estimatedReadyTime: '۱۰ دقیقه',
      customerName: 'مشتری میز ۷',
      customerPhone: '',
    };
    handlePlaceOrder(sample);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // Smooth scroll categories / menu section to top below header
    const catSection = document.getElementById('categories-section');
    if (catSection) {
      const yOffset = -76; // Header height + spacing offset
      const y = catSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({
        top: Math.max(0, y),
        behavior: 'smooth',
      });
    }
  };

  const heroSpecialItem = MENU_ITEMS.find((i) => i.isSpecialToday) || MENU_ITEMS[0];

  const currentCategoryItems =
    selectedCategoryId === 'all'
      ? MENU_ITEMS
      : MENU_ITEMS.filter((i) => i.categoryId === selectedCategoryId);

  return (
    <div className="bg-[#0e1510] text-[#dde5dc] min-h-screen pb-24 md:pb-16 selection:bg-[#FF8C00] selection:text-[#0e1510] font-vazir relative">
      {/* Loading Splash Screen */}
      <AnimatePresence>
        {isLoading && <SplashScreen onFinish={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Top Header with Call Waiter button */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCallWaiter={() => setIsCallWaiterOpen(true)}
      />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[70] bg-[#1D2F22] border border-[#FFD700]/40 text-[#FDFAE7] p-3.5 rounded-2xl shadow-xl shadow-black/40 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed flex-1">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#ddc1ae] hover:text-[#FFD700] p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with M3 Fade Through Navigation */}
      <main className="pt-20 md:pt-24 px-4 md:px-8 pb-28 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div
              key="menu-tab"
              variants={m3Variants.fadeThrough}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 md:space-y-8"
            >
              {/* Hero Section */}
              <HeroBanner
                item={heroSpecialItem}
                onSelectItem={setSelectedItemForDetail}
                onPeekStart={setPeekingItem}
                onPeekEnd={() => setPeekingItem(null)}
              />

              {/* Categories */}
              <CategoryNav
                categories={CATEGORIES}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleCategorySelect}
              />

              {/* Product Grid with M3 Shared Axis & Staggered Cascade */}
              <section id="menu-product-grid">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategoryId}
                    variants={m3Variants.staggerContainer}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transform-gpu"
                  >
                    {currentCategoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={m3Variants.staggerItem}
                        className="transform-gpu will-change-transform"
                      >
                        <ProductCard
                          item={item}
                          onSelect={setSelectedItemForDetail}
                          onAdd={handleQuickAdd}
                          onPeekStart={setPeekingItem}
                          onPeekEnd={() => setPeekingItem(null)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </section>
            </motion.div>
          )}

          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              variants={m3Variants.fadeThrough}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <HomeTab
                popularItems={MENU_ITEMS.slice(0, 3)}
                onSelectItem={setSelectedItemForDetail}
                onGoToMenu={() => setActiveTab('menu')}
                onPeekStart={setPeekingItem}
                onPeekEnd={() => setPeekingItem(null)}
              />
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders-tab"
              variants={m3Variants.fadeThrough}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <OrdersTab
                orders={orders}
                onGoToMenu={() => setActiveTab('menu')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button (FAB) */}
      <FloatingOrderButton
        totalItemsCount={totalCartCount}
        onClick={() => setIsOrderDrawerOpen(true)}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeOrdersCount={orders.length}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Long-Press Peek Description Modal */}
      <ProductPeekModal
        item={peekingItem}
        onClose={() => setPeekingItem(null)}
      />

      <OrderDrawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={MENU_ITEMS}
        onSelectItem={(item) => {
          setSelectedItemForDetail(item);
          setIsSearchOpen(false);
        }}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        onOpenCallWaiter={() => setIsCallWaiterOpen(true)}
      />

      {/* Call Waiter Modal (Customer Facing) */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        onRequestSubmitted={handleServiceRequestSubmitted}
      />

      {/* Secret Staff PIN Authentication */}
      <StaffPinModal
        isOpen={isStaffPinOpen}
        onClose={() => setIsStaffPinOpen(false)}
        onSuccess={() => {
          setIsStaffPinOpen(false);
          setIsStaffDashboardOpen(true);
        }}
      />

      {/* Reception & Waiter Staff Dashboard */}
      <StaffDashboardModal
        isOpen={isStaffDashboardOpen}
        onClose={() => setIsStaffDashboardOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        serviceRequests={serviceRequests}
        onUpdateServiceStatus={handleUpdateServiceStatus}
        onDeleteServiceRequest={handleDeleteServiceRequest}
        onAddSampleOrder={handleAddSampleOrder}
        onRefreshData={async () => {
          const [o, r] = await Promise.all([fetchOrdersFromServer(), fetchServiceRequestsFromServer()]);
          setOrders(o);
          setServiceRequests(r);
        }}
      />
    </div>
  );
}
