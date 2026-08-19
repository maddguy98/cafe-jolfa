import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { m3Easing, m3Duration } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { getSavedTableNumber, saveTableNumber } from '../utils/storageSync';
import { soundManager } from '../utils/audioAlert';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: Order) => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
}) => {
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>(() => getSavedTableNumber());
  const { triggerSelection, triggerSuccess } = useHapticFeedback();

  const total = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);

  const handleTableChange = (val: string) => {
    setTableNumber(val);
    saveTableNumber(val);
  };

  const handleSubmit = () => {
    if (cartItems.length === 0) return;
    triggerSuccess();
    soundManager.playCustomerConfirmation();

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `NB-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [...cartItems],
      subtotal: total,
      discount: 0,
      tax: 0,
      total,
      status: 'received',
      orderType,
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      estimatedReadyTime: '۱۰ دقیقه',
      customerName: 'کاربر',
      customerPhone: '',
    };

    onPlaceOrder(newOrder);
    onClearCart();
    onClose();
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="order-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: m3Duration.short3, ease: m3Easing.standard }}
          className="fixed inset-0 z-[80] bg-[#0e1510]/80 backdrop-blur-sm flex justify-start transform-gpu"
          onClick={onClose}
        >
          <motion.div
            id="order-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-sm bg-[#161d18] h-full flex flex-col shadow-2xl border-l border-[#564334]/20 transform-gpu will-change-transform"
          >
            {/* Header */}
            <div className="p-4 bg-[#1D2F22] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FFD700]">receipt_long</span>
                <h3 className="font-semibold text-base text-[#FDFAE7]">سفارش شما</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#0e1510]/40 text-[#dde5dc] hover:text-[#FFD700] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Content */}
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#ddc1ae]">
                <span className="material-symbols-outlined text-4xl text-[#564334] mb-2">shopping_cart</span>
                <p className="text-sm">سبد سفارش خالی است</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                {/* Items */}
                {cartItems.map((cartItem) => (
                  <motion.div
                    key={cartItem.cartItemId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: m3Duration.short3, ease: m3Easing.standardDecelerate }}
                    className="bg-[#242c26] rounded-2xl p-3 flex items-center gap-3"
                  >
                    <img
                      src={cartItem.item.image}
                      alt={cartItem.item.title}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-[#dde5dc] truncate">
                        {cartItem.item.title}
                      </h4>
                      <div className="text-xs text-[#FFD700] font-medium mt-1">
                        {formatPrice(cartItem.itemTotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#1a211c] px-2 py-1 rounded-full">
                      <button
                        onClick={() => {
                          triggerSelection();
                          cartItem.quantity > 1
                            ? onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)
                            : onRemoveItem(cartItem.cartItemId);
                        }}
                        className="w-5 h-5 rounded-full bg-[#242c26] text-[#dde5dc] flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold min-w-[14px] text-center">
                        {toPersianDigits(cartItem.quantity)}
                      </span>
                      <button
                        onClick={() => {
                          triggerSelection();
                          onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
                        }}
                        className="w-5 h-5 rounded-full bg-[#FF8C00] text-[#0e1510] flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Type selector */}
                <div className="bg-[#242c26] rounded-2xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerSelection();
                        setOrderType('dine_in');
                      }}
                      className={`py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        orderType === 'dine_in'
                          ? 'bg-[#FFD700] text-[#1D2F22]'
                          : 'bg-[#1a211c] text-[#ddc1ae]'
                      }`}
                    >
                      سرو در کافه
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerSelection();
                        setOrderType('takeaway');
                      }}
                      className={`py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        orderType === 'takeaway'
                          ? 'bg-[#FFD700] text-[#1D2F22]'
                          : 'bg-[#1a211c] text-[#ddc1ae]'
                      }`}
                    >
                      بیرون‌بر
                    </button>
                  </div>

                  {orderType === 'dine_in' && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#ddc1ae]">شماره میز:</span>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => handleTableChange(e.target.value)}
                        className="w-16 bg-[#1a211c] border border-[#564334]/30 rounded-lg py-1 text-center text-xs text-[#FFD700] font-bold focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-[#1a211c] rounded-2xl p-3 flex justify-between items-center text-sm font-semibold text-[#FFD700]">
                  <span>مبلغ کل:</span>
                  <span className="text-base">{formatPrice(total)}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-4 bg-[#0e1510] border-t border-[#564334]/20">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: m3Duration.short2, ease: m3Easing.standardDecelerate }}
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-full bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-sm transition-colors shadow-sm shadow-[#FF8C00]/20 cursor-pointer"
                >
                  ثبت سفارش
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

