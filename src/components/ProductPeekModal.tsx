import React, { useEffect } from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';

interface ProductPeekModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ProductPeekModal: React.FC<ProductPeekModalProps> = ({ item, onClose }) => {
  // Listen on window for any release/cancel events to guarantee dismissal on finger lift
  useEffect(() => {
    if (!item) return;

    const handleRelease = () => {
      onClose();
    };

    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchcancel', handleRelease);
    window.addEventListener('pointercancel', handleRelease);

    return () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchcancel', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          id="product-peek-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[95] bg-[#0e1510]/80 backdrop-blur-md flex items-center justify-center p-4 select-none pointer-events-auto transform-gpu"
        >
          <motion.div
            id="product-peek-card"
            initial={{ opacity: 0, scale: 0.86, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={m3Spring.dialogOvershoot}
            className="w-full max-w-sm bg-[#1a211c] border border-[#564334]/40 rounded-[28px] overflow-hidden shadow-2xl flex flex-col transform-gpu will-change-transform"
          >
            {/* Header Image */}
            <div className="relative w-full h-52 bg-[#0e1510] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a211c] via-transparent to-black/30" />

              {item.badge && (
                <span className="absolute top-3 right-3 bg-[#FF8C00] text-[#0e1510] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {item.badge}
                </span>
              )}

              {/* Peek badge indicator */}
              <div className="absolute top-3 left-3 bg-[#0e1510]/80 backdrop-blur-md text-[#FFD700] text-[11px] font-medium px-2.5 py-1 rounded-full border border-[#FFD700]/20 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span>پیش‌نمایش سریع</span>
              </div>
            </div>

            {/* Content info */}
            <div className="p-5 space-y-3.5 text-[#dde5dc]">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#FDFAE7]">
                  {item.title}
                </h3>
                <span className="text-base font-bold text-[#FFD700]">
                  {formatPrice(item.price)}
                </span>
              </div>

              <div className="bg-[#242c26] p-3.5 rounded-2xl border border-[#564334]/20">
                <p className="text-xs md:text-sm text-[#ddc1ae] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Release hint bar */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#ddc1ae]/75 font-normal">
                <span className="material-symbols-outlined text-sm text-[#FF8C00]">touch_app</span>
                <span>با رها کردن انگشت، پیش‌نمایش بسته می‌شود</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
