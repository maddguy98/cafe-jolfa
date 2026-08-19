import React from 'react';
import { Order } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';
import { motion } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';

interface OrdersTabProps {
  orders: Order[];
  onGoToMenu: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, onGoToMenu }) => {
  return (
    <div className="space-y-4 pb-12">
      <h2 className="text-xl font-bold text-[#FDFAE7]">سفارش‌ها</h2>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={m3Spring.overshoot}
          className="rounded-[24px] bg-[#1a211c] p-8 text-center text-[#ddc1ae] transform-gpu"
        >
          <p className="text-xs mb-4">سفارشی ثبت نشده است</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={m3Spring.overshootSnappy}
            onClick={onGoToMenu}
            className="px-5 py-2 rounded-full bg-[#FF8C00] text-[#0e1510] font-bold text-xs hover:bg-[#FFD700] transition-colors cursor-pointer transform-gpu shadow-sm shadow-[#FF8C00]/20"
          >
            مشاهده منو
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={m3Spring.overshoot}
              className="rounded-2xl bg-[#242c26] p-4 border border-[#564334]/20 space-y-2 text-xs transform-gpu will-change-transform"
            >
              <div className="flex justify-between items-center text-[#FFD700] font-medium">
                <span>{order.orderNumber}</span>
                <span>{order.createdAt}</span>
              </div>

              <div className="space-y-1 text-[#dde5dc] pt-1">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{toPersianDigits(i.quantity)} × {i.item.title}</span>
                    <span className="text-[#ddc1ae]">{formatPrice(i.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2 border-t border-[#564334]/20 font-bold text-sm text-[#FFD700]">
                <span>جمع کل:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
