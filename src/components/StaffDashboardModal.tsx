import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { Order, ServiceRequest } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { soundManager } from '../utils/audioAlert';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { StaffAnalyticsTab } from './StaffAnalyticsTab';
import {
  saveStaffPin,
  getStaffPin,
  checkServerConnection,
  fetchOrdersFromServer,
  fetchServiceRequestsFromServer,
} from '../utils/storageSync';
import { requestCloudFullSync, getCloudConnectionStatus } from '../utils/cloudSync';

interface StaffDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  serviceRequests: ServiceRequest[];
  onUpdateServiceStatus: (requestId: string, newStatus: ServiceRequest['status']) => void;
  onDeleteServiceRequest: (requestId: string) => void;
  onAddSampleOrder: () => void;
  onRefreshData?: () => void;
}

export const StaffDashboardModal: React.FC<StaffDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  serviceRequests,
  onUpdateServiceStatus,
  onDeleteServiceRequest,
  onAddSampleOrder,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'reception' | 'waiter' | 'analytics' | 'settings'>('reception');
  const [orderFilter, setOrderFilter] = useState<'all' | Order['status']>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | ServiceRequest['status']>('all');
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundManager.isEnabled());
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Connection & sync status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; pingMs: number; lastChecked: string }>({
    ok: true,
    pingMs: 0,
    lastChecked: 'هم‌اکنون',
  });

  // PIN change state
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);
  const { triggerSelection, triggerSuccess, triggerMedium } = useHapticFeedback();

  const handleCheckConnection = async () => {
    setIsSyncing(true);
    try {
      requestCloudFullSync();
      const res = await checkServerConnection();
      await Promise.all([fetchOrdersFromServer(), fetchServiceRequestsFromServer()]);
      onRefreshData?.();
      const isCloudOk = getCloudConnectionStatus();
      setServerStatus({
        ok: res.ok || isCloudOk,
        pingMs: res.pingMs,
        lastChecked: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      triggerSuccess();
    } catch {
      setServerStatus((prev) => ({ ...prev, ok: getCloudConnectionStatus() }));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setIsSoundOn(soundManager.isEnabled());
    if (isOpen) {
      handleCheckConnection();
      const interval = setInterval(async () => {
        const res = await checkServerConnection();
        setServerStatus((prev) => ({
          ...prev,
          ok: res.ok,
          pingMs: res.pingMs,
          lastChecked: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleToggleSound = () => {
    triggerSelection();
    const newState = soundManager.toggleSound();
    setIsSoundOn(newState);
  };

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      saveStaffPin(newPin);
      triggerSuccess();
      setPinChangeSuccess(true);
      setTimeout(() => {
        setPinChangeSuccess(false);
        setNewPin('');
      }, 2000);
    }
  };

  if (!isOpen) return null;

  // Compute metrics
  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const pendingRequests = serviceRequests.filter((s) => s.status === 'pending');
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);
  const filteredRequests =
    serviceFilter === 'all' ? serviceRequests : serviceRequests.filter((r) => r.status === serviceFilter);

  return (
    <div
      id="staff-dashboard-modal"
      className="fixed inset-0 z-[95] bg-[#09100b] text-[#dde5dc] flex flex-col overflow-hidden font-vazir"
    >
      {/* Top Staff Navigation Header */}
      <header className="bg-[#161d18] border-b border-[#564334]/30 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1D2F22] border border-[#FFD700]/30 text-[#FFD700] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base md:text-lg text-[#FDFAE7]">
                میز کار پرسنل و مدیریت کافه زیتون
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#FF8C00]/20 text-[#FF8C00] text-[10px] font-bold">
                حالت محرمانه
              </span>
            </div>
            <p className="text-xs text-[#ddc1ae]">
              پنل زنده پذیرش، آشپزخانه و فراخوانی‌های گارسون
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Real-time Server Status Badge & Manual Sync Button */}
          <button
            onClick={handleCheckConnection}
            disabled={isSyncing}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              serverStatus.ok
                ? 'bg-[#1D2F22] text-emerald-400 border-emerald-500/30 hover:bg-[#253d2c]'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
            }`}
            title="همگام‌سازی فوری با سرور و بررسی اتصال دستگاه‌ها"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSyncing ? 'bg-amber-400 animate-ping' : serverStatus.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="material-symbols-outlined text-sm">
              {isSyncing ? 'sync' : 'cloud_sync'}
            </span>
            <span className="hidden sm:inline">
              {isSyncing ? 'در حال همگام‌سازی...' : serverStatus.ok ? 'سرور متصل' : 'تلاش مجدد'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isSoundOn
                ? 'bg-[#1D2F22] text-[#FFD700] border-[#FFD700]/40'
                : 'bg-[#242c26] text-[#ddc1ae] border-[#564334]/30'
            }`}
            title="تغییر وضعیت صدای زنگ اعلان‌ها"
          >
            <span className="material-symbols-outlined text-base">
              {isSoundOn ? 'volume_up' : 'volume_off'}
            </span>
            <span className="hidden sm:inline">صدای زنگ: {isSoundOn ? 'روشن' : 'خاموش'}</span>
          </button>

          {/* Test Chime button */}
          <button
            onClick={() => {
              triggerMedium();
              soundManager.playNewOrderChime();
            }}
            className="px-3 py-2 rounded-xl bg-[#242c26] hover:bg-[#2f3731] text-[#dde5dc] text-xs font-medium flex items-center gap-1 border border-[#564334]/20 cursor-pointer"
            title="تست زنگ پذیرش"
          >
            <span className="material-symbols-outlined text-base text-[#FF8C00]">notifications</span>
            <span className="hidden md:inline">تست زنگ</span>
          </button>

          {/* Exit Staff Mode */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-[#FF8C00]/20"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>خروج به منوی مشتری</span>
          </button>
        </div>
      </header>

      {/* Staff Tabs Selector */}
      <div className="bg-[#1a211c] border-b border-[#564334]/20 px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
        <button
          onClick={() => {
            triggerSelection();
            setActiveTab('reception');
          }}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reception'
              ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm shadow-[#FFD700]/20'
              : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          <span>پذیرش و صندوق (سفارش‌ها)</span>
          {activeOrders.length > 0 && (
            <span
              className={`px-2 py-0.2 rounded-full text-[11px] font-bold ${
                activeTab === 'reception' ? 'bg-[#1D2F22] text-[#FFD700]' : 'bg-[#FF8C00] text-[#0e1510]'
              }`}
            >
              {toPersianDigits(activeOrders.length)}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerSelection();
            setActiveTab('waiter');
          }}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'waiter'
              ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm shadow-[#FFD700]/20'
              : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">hail</span>
          <span>فراخوانی‌های گارسون (سرویس سالن)</span>
          {pendingRequests.length > 0 && (
            <span
              className={`px-2 py-0.2 rounded-full text-[11px] font-bold animate-pulse ${
                activeTab === 'waiter' ? 'bg-[#1D2F22] text-[#FFD700]' : 'bg-rose-500 text-white'
              }`}
            >
              {toPersianDigits(pendingRequests.length)}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerSelection();
            setActiveTab('analytics');
          }}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm shadow-[#FFD700]/20'
              : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">show_chart</span>
          <span>آمار و نمودار سفارشات</span>
        </button>

        <button
          onClick={() => {
            triggerSelection();
            setActiveTab('settings');
          }}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm shadow-[#FFD700]/20'
              : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">tune</span>
          <span>تنظیمات و ابزارها</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 hide-scrollbar">
        {/* ================= TAB 1: RECEPTION / ORDERS ================= */}
        {activeTab === 'reception' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-3.5">
                <span className="text-[11px] text-[#ddc1ae]">کل سفارشات امروز</span>
                <div className="text-xl font-bold text-[#FDFAE7] mt-1">
                  {toPersianDigits(orders.length)} سفارش
                </div>
              </div>
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-3.5">
                <span className="text-[11px] text-[#FFD700]">سفارشات فعال</span>
                <div className="text-xl font-bold text-[#FFD700] mt-1">
                  {toPersianDigits(activeOrders.length)} سفارش
                </div>
              </div>
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-3.5">
                <span className="text-[11px] text-amber-400">در حال آماده‌سازی</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {toPersianDigits(orders.filter((o) => o.status === 'preparing').length)}
                </div>
              </div>
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-3.5">
                <span className="text-[11px] text-emerald-400">مجموع فروش ثبت‌شده</span>
                <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1">
                  {formatPrice(totalRevenue)}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161d18] p-3 rounded-2xl border border-[#564334]/20">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                {[
                  { id: 'all', label: 'همه سفارش‌ها' },
                  { id: 'received', label: 'جدید / دریافتی' },
                  { id: 'preparing', label: 'در حال آماده‌سازی' },
                  { id: 'ready', label: 'آماده تحویل' },
                  { id: 'delivered', label: 'تحویل / تسویه شده' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      triggerSelection();
                      setOrderFilter(f.id as typeof orderFilter);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      orderFilter === f.id
                        ? 'bg-[#FF8C00] text-[#0e1510] font-bold'
                        : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onAddSampleOrder}
                className="px-3 py-1.5 rounded-xl bg-[#1D2F22] hover:bg-[#242c26] text-[#FFD700] border border-[#FFD700]/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>افزودن سفارش آزمایشی</span>
              </button>
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-3xl p-12 text-center text-[#ddc1ae] space-y-3">
                <span className="material-symbols-outlined text-5xl text-[#564334]">inbox</span>
                <h4 className="text-base font-bold text-[#FDFAE7]">سفارشی در این وضعیت موجود نیست</h4>
                <p className="text-xs max-w-sm mx-auto text-[#ddc1ae]/70">
                  به محض اینکه مشتری در منو سفارشی ثبت کند، هم‌زمان با صدای زنگ در این پنل نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  const isNew = order.status === 'received';
                  const isPrep = order.status === 'preparing';
                  const isReady = order.status === 'ready';
                  const isDelivered = order.status === 'delivered';

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-[#161d18] rounded-3xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
                        isNew
                          ? 'border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.15)] bg-[#1a211c]'
                          : isPrep
                          ? 'border-amber-500/40 bg-[#161d18]'
                          : isReady
                          ? 'border-emerald-500/40 bg-[#161d18]'
                          : 'border-[#564334]/20 opacity-80'
                      }`}
                    >
                      {/* Order Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#564334]/20 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#FFD700]">
                              سفارش #{order.orderNumber}
                            </span>
                            {order.tableNumber ? (
                              <span className="px-2 py-0.5 rounded-lg bg-[#FFD700]/15 text-[#FFD700] text-xs font-bold">
                                میز {toPersianDigits(order.tableNumber)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium">
                                بیرون‌بر
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#ddc1ae] mt-1 block">
                            ثبت در ساعت {order.createdAt}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                            isNew
                              ? 'bg-[#FF8C00] text-[#0e1510] animate-pulse'
                              : isPrep
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isReady
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-[#242c26] text-[#ddc1ae]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isNew ? 'fiber_new' : isPrep ? 'skillet' : isReady ? 'done_all' : 'check'}
                          </span>
                          <span>
                            {isNew
                              ? 'جدید / دریافتی'
                              : isPrep
                              ? 'در حال آماده‌سازی'
                              : isReady
                              ? 'آماده تحویل'
                              : 'تحویل شد'}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 flex-1">
                        {order.items.map((cartItem, idx) => (
                          <div
                            key={idx}
                            className="bg-[#242c26] rounded-2xl p-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-[#1a211c] text-[#FFD700] font-bold flex items-center justify-center shrink-0">
                                {toPersianDigits(cartItem.quantity)}×
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-[#FDFAE7] block truncate">
                                  {cartItem.item.title}
                                </span>
                                {(cartItem.selectedMilk ||
                                  cartItem.selectedSweetness ||
                                  cartItem.selectedTemperature ||
                                  cartItem.notes) && (
                                  <span className="text-[10px] text-[#ddc1ae] truncate block">
                                    {[
                                      cartItem.selectedMilk,
                                      cartItem.selectedSweetness,
                                      cartItem.selectedTemperature,
                                      cartItem.notes,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-[#FFD700] shrink-0">
                              {formatPrice(cartItem.itemTotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Actions */}
                      <div className="pt-3 border-t border-[#564334]/20 space-y-3">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-[#ddc1ae]">مبلغ قابل پرداخت:</span>
                          <span className="text-[#FFD700]">{formatPrice(order.total)}</span>
                        </div>

                        {/* Status Progression Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'received')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isNew
                                ? 'bg-[#FF8C00] text-[#0e1510]'
                                : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                            }`}
                          >
                            دریافتی
                          </button>
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isPrep
                                ? 'bg-amber-500 text-[#0e1510]'
                                : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                            }`}
                          >
                            آماده‌سازی
                          </button>
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isReady
                                ? 'bg-emerald-500 text-[#0e1510]'
                                : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                            }`}
                          >
                            آماده تحویل
                          </button>
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isDelivered
                                ? 'bg-[#343b35] text-[#FFD700]'
                                : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                            }`}
                          >
                            تحویل شد
                          </button>
                        </div>

                        {/* Secondary utilities */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="text-xs text-[#FFD700] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">print</span>
                            <span>مشاهده و چاپ فیش فاکتور</span>
                          </button>

                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: WAITER SERVICE QUEUE ================= */}
        {activeTab === 'waiter' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Waiter queue status summary */}
            <div className="bg-[#161d18] border border-[#564334]/20 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">notifications_active</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#FDFAE7]">
                    صف زنده فراخوانی‌های سالن (گارسون)
                  </h3>
                  <p className="text-xs text-[#ddc1ae]">
                    درخواست‌های ارسالی مشتریان از سر میزها به صورت لحظه‌ای در این لیست قرار می‌گیرند.
                  </p>
                </div>
              </div>

              {/* Service Status Filter */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'همه' },
                  { id: 'pending', label: 'در انتظار' },
                  { id: 'in_progress', label: 'در حال رسیدگی' },
                  { id: 'completed', label: 'انجام شده' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      triggerSelection();
                      setServiceFilter(s.id as typeof serviceFilter);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      serviceFilter === s.id
                        ? 'bg-[#FF8C00] text-[#0e1510] font-bold'
                        : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="bg-[#161d18] border border-[#564334]/20 rounded-3xl p-12 text-center text-[#ddc1ae] space-y-3">
                <span className="material-symbols-outlined text-5xl text-[#564334]">
                  check_circle_outline
                </span>
                <h4 className="text-base font-bold text-[#FDFAE7]">
                  هیچ درخواست سرویسی در انتظار نیست
                </h4>
                <p className="text-xs text-[#ddc1ae]/70">
                  همه میزها در حال حاضر رسیدگی شده‌اند. به محض فراخوانی گارسون توسط مشتری، پیام به همراه زنگ در اینجا ثبت می‌شود.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isInProgress = req.status === 'in_progress';
                  const isCompleted = req.status === 'completed';

                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-[#161d18] rounded-3xl p-5 border transition-all space-y-4 ${
                        isPending
                          ? 'border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.15)] bg-[#1a211c]'
                          : isInProgress
                          ? 'border-amber-500/40'
                          : 'border-[#564334]/20 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#FF8C00] text-[#0e1510] font-black text-sm flex flex-col items-center justify-center">
                            <span className="text-[10px] opacity-80 leading-none">میز</span>
                            <span className="text-base leading-tight">
                              {toPersianDigits(req.tableNumber)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#FDFAE7]">{req.requestLabel}</h4>
                            <span className="text-[11px] text-[#ddc1ae]">
                              ساعت ثبت: {req.createdAt}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isPending
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isPending
                            ? 'در انتظار مراجعه'
                            : isInProgress
                            ? 'در حال رسیدگی'
                            : 'تکمیل شده'}
                        </span>
                      </div>

                      {/* Custom Note if any */}
                      {req.customNote && (
                        <div className="bg-[#242c26] rounded-2xl p-3 text-xs text-[#dde5dc] border-r-2 border-[#FFD700]">
                          <span className="text-[10px] text-[#FFD700] block font-semibold mb-1">
                            توضیحات مشتری:
                          </span>
                          {req.customNote}
                        </div>
                      )}

                      {/* Waiter Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => onUpdateServiceStatus(req.id, 'in_progress')}
                              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0e1510] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">directions_walk</span>
                              <span>در حال مراجعه سر میز</span>
                            </button>
                          )}

                          {!isCompleted && (
                            <button
                              onClick={() => onUpdateServiceStatus(req.id, 'completed')}
                              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0e1510] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span>انجام شد / تایید</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteServiceRequest(req.id)}
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="حذف این درخواست"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ANALYTICS & RECHARTS HOURLY CHART ================= */}
        {activeTab === 'analytics' && <StaffAnalyticsTab orders={orders} />}

        {/* ================= TAB 4: SETTINGS & TOOLS ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* PIN Settings */}
            <div className="bg-[#161d18] border border-[#564334]/20 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1D2F22] text-[#FFD700] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">key</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#FDFAE7]">تغییر پین کد دسترسی پرسنل</h3>
                  <p className="text-xs text-[#ddc1ae]">
                    رمز فعلی: {getStaffPin()} (برای امنیت، رمز دلخواه ۴ رقمی جدید تعیین کنید)
                  </p>
                </div>
              </div>

              <form onSubmit={handlePinChangeSubmit} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="رمز ۴ رقمی جدید (مثلا 5588)"
                  className="bg-[#242c26] border border-[#564334]/30 rounded-xl px-4 py-2.5 text-xs text-[#FFD700] font-bold focus:outline-none focus:border-[#FFD700] w-56 text-center"
                />
                <button
                  type="submit"
                  disabled={newPin.length !== 4}
                  className="px-5 py-2.5 rounded-xl bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  ذخیره رمز جدید
                </button>
                {pinChangeSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold">
                    ✓ رمز با موفقیت تغییر کرد!
                  </span>
                )}
              </form>
            </div>

            {/* Audio Settings & Sound Tests */}
            <div className="bg-[#161d18] border border-[#564334]/20 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1D2F22] text-[#FFD700] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">volume_up</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#FDFAE7]">تنظیمات و تست صدای زنگ</h3>
                  <p className="text-xs text-[#ddc1ae]">
                    آزمایش صدای اعلان سفارش جدید برای پذیرش و صدای زنگ فراخوانی گارسون
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => soundManager.playNewOrderChime()}
                  className="px-4 py-2.5 rounded-xl bg-[#242c26] hover:bg-[#2f3731] text-[#FFD700] text-xs font-semibold flex items-center gap-2 border border-[#564334]/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">restaurant</span>
                  <span>تست زنگ سفارش پذیرش</span>
                </button>

                <button
                  onClick={() => soundManager.playWaiterCallChime()}
                  className="px-4 py-2.5 rounded-xl bg-[#242c26] hover:bg-[#2f3731] text-[#FF8C00] text-xs font-semibold flex items-center gap-2 border border-[#564334]/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">notifications_active</span>
                  <span>تست زنگ فراخوانی گارسون</span>
                </button>
              </div>
            </div>

            {/* Information note */}
            <div className="bg-[#1D2F22]/60 border border-[#FFD700]/20 rounded-3xl p-5 text-xs text-[#ddc1ae] space-y-2 leading-relaxed">
              <h4 className="font-bold text-[#FFD700] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock</span>
                روش‌های دسترسی مخفی پرسنل:
              </h4>
              <p>
                مشتریان هیچ دکمه یا لینکی از پرسنل را در صفحه مشاهده نمی‌کنند. برای ورود: در دستگاه‌های لمسی/موبایل با <strong>لمس همزمان ۵ انگشت</strong> و در دسکتاپ با فشردن کلید <strong>f</strong> روی کیبورد کادر ورود پین باز می‌شود.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Receipt Modal Preview */}
      <AnimatePresence>
        {selectedReceiptOrder && (
          <div
            onClick={() => setSelectedReceiptOrder(null)}
            className="fixed inset-0 z-[110] bg-[#0e1510]/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white text-black rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="text-center border-b pb-3 space-y-1">
                <h3 className="font-bold text-base">کافه زیتون</h3>
                <p className="text-[11px] text-gray-600">فیش سفارش پذیرش و سالن</p>
                <div className="flex justify-between text-[11px] text-gray-700 pt-2">
                  <span>شماره سفارش: {selectedReceiptOrder.orderNumber}</span>
                  <span>
                    میز: {selectedReceiptOrder.tableNumber ? toPersianDigits(selectedReceiptOrder.tableNumber) : 'بیرون‌بر'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500">زمان: {selectedReceiptOrder.createdAt}</div>
              </div>

              <div className="space-y-2 border-b pb-3">
                {selectedReceiptOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>
                      {toPersianDigits(it.quantity)} × {it.item.title}
                    </span>
                    <span className="font-bold">{formatPrice(it.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold text-sm pt-1">
                <span>مبلغ کل:</span>
                <span>{formatPrice(selectedReceiptOrder.total)}</span>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2 rounded-xl bg-black text-white font-bold text-xs cursor-pointer"
                >
                  چاپ فیش
                </button>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
