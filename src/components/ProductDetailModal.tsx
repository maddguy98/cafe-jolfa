import React, { useState } from 'react';
import { CartItem, MenuItem } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface ProductDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const { triggerMedium, triggerSelection } = useHapticFeedback();

  const totalPrice = item ? item.price * quantity : 0;

  const handleAdd = () => {
    if (!item) return;
    triggerMedium();
    const cartItem: CartItem = {
      cartItemId: `${item.id}-${Date.now()}`,
      item,
      quantity,
      itemTotal: totalPrice,
    };
    onAddToCart(cartItem);
    onClose();
  };

  const handleDecreaseQuantity = () => {
    triggerSelection();
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleIncreaseQuantity = () => {
    triggerSelection();
    setQuantity((q) => q + 1);
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          id="product-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] bg-[#0e1510]/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 transform-gpu"
          onClick={onClose}
        >
          <motion.div
            id="product-detail-dialog"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 35, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={m3Spring.dialogOvershoot}
            className="bg-[#1a211c] border border-[#564334]/30 w-full max-w-md max-h-[90vh] rounded-t-[28px] md:rounded-[28px] overflow-hidden flex flex-col shadow-2xl transform-gpu will-change-transform"
          >
            {/* Header Image */}
            <div className="relative w-full h-56 bg-[#0e1510] overflow-hidden shrink-0 transform-gpu">
              <motion.img
                initial={{ scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={m3Spring.overshoot}
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transform-gpu"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a211c] via-transparent to-black/40" />

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={m3Spring.overshootSnappy}
                onClick={onClose}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#0e1510]/80 text-[#dde5dc] hover:text-[#FFD700] flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </motion.button>

              {/* Badge */}
              {item.badge && (
                <div className="absolute top-4 right-4 bg-[#FF8C00] text-[#0e1510] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {item.badge}
                </div>
              )}
            </div>

            {/* Scrollable Info Body */}
            <div className="p-5 space-y-4 text-[#dde5dc] overflow-y-auto">
              {/* Title & Subtitle & Price */}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-bold text-[#FDFAE7]">
                    {item.title}
                  </h3>
                  <span className="text-lg font-bold text-[#FFD700] shrink-0">
                    {formatPrice(item.price)}
                  </span>
                </div>
                {item.titleEn && (
                  <p className="text-xs text-[#ddc1ae]/60 font-mono tracking-wider mt-0.5">
                    {item.titleEn}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="bg-[#242c26] p-3.5 rounded-2xl border border-[#564334]/20">
                <p className="text-xs md:text-sm text-[#ddc1ae] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Specs: Calories, Prep Time */}
              <div className="grid grid-cols-2 gap-2.5">
                {item.calories !== undefined && (
                  <div className="bg-[#242c26]/70 border border-[#564334]/15 rounded-xl p-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF8C00] text-lg">local_fire_department</span>
                    <div>
                      <div className="text-[10px] text-[#ddc1ae]/60">کالری تقریبی</div>
                      <div className="text-xs font-bold text-[#dde5dc]">{toPersianDigits(item.calories)} کیلوکالری</div>
                    </div>
                  </div>
                )}

                {item.preparationTime && (
                  <div className="bg-[#242c26]/70 border border-[#564334]/15 rounded-xl p-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FFD700] text-lg">schedule</span>
                    <div>
                      <div className="text-[10px] text-[#ddc1ae]/60">زمان آماده‌سازی</div>
                      <div className="text-xs font-bold text-[#dde5dc]">{item.preparationTime}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#ddc1ae]/70 font-medium">ویژگی‌ها:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-[#242c26] text-[#ddc1ae] px-2.5 py-1 rounded-lg border border-[#564334]/25"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242c26] border border-[#564334]/20">
                <span className="text-xs font-medium text-[#ddc1ae]">تعداد سفارش:</span>
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    transition={m3Spring.overshootSnappy}
                    disabled={quantity <= 1}
                    onClick={handleDecreaseQuantity}
                    className="w-8 h-8 rounded-full bg-[#1a211c] text-[#dde5dc] disabled:opacity-30 flex items-center justify-center font-bold text-sm cursor-pointer border border-[#564334]/30"
                  >
                    -
                  </motion.button>
                  <motion.span
                    key={quantity}
                    initial={{ scale: 1.25, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={m3Spring.overshootSnappy}
                    className="font-bold text-base min-w-[24px] text-center text-[#FFD700]"
                  >
                    {toPersianDigits(quantity)}
                  </motion.span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    transition={m3Spring.overshootSnappy}
                    onClick={handleIncreaseQuantity}
                    className="w-8 h-8 rounded-full bg-[#FF8C00] text-[#0e1510] flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm shadow-[#FF8C00]/20"
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom Add CTA */}
            <div className="p-4 bg-[#161d18] border-t border-[#564334]/20 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={m3Spring.overshoot}
                onClick={handleAdd}
                className="w-full py-3.5 rounded-full bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-sm transition-colors shadow-md shadow-[#FF8C00]/20 flex items-center justify-between px-6 cursor-pointer"
              >
                <span>افزودن به سفارش</span>
                <span>{formatPrice(totalPrice)}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
