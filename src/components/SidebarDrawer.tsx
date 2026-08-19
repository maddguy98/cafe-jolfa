import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { m3Easing, m3Duration } from '../theme/m3Motion';
import { TabType } from '../types';
import { ZeytoonLogo } from './ZeytoonLogo';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
  onOpenCallWaiter: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCallWaiter,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="sidebar-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: m3Duration.short3, ease: m3Easing.standard }}
          className="fixed inset-0 z-[90] bg-[#0e1510]/80 backdrop-blur-sm flex justify-start transform-gpu"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-xs bg-[#161d18] h-full flex flex-col justify-between shadow-2xl p-6 border-r border-[#564334]/20 transform-gpu will-change-transform"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ZeytoonLogo className="w-7 h-7 text-[#FFD700]" />
                  <h2 className="text-xl font-bold text-[#FFD700]">کافه زیتون</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#ddc1ae] hover:text-[#FFD700] p-1 rounded-full hover:bg-[#242c26] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-2 text-sm font-medium">
                <button
                  onClick={() => {
                    onNavigate('menu');
                    onClose();
                  }}
                  className="w-full text-right p-3 rounded-xl hover:bg-[#242c26] text-[#dde5dc] hover:text-[#FFD700] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                  <span>منوی دیجیتال</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('home');
                    onClose();
                  }}
                  className="w-full text-right p-3 rounded-xl hover:bg-[#242c26] text-[#dde5dc] hover:text-[#FFD700] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">info</span>
                  <span>درباره کافه زیتون</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('orders');
                    onClose();
                  }}
                  className="w-full text-right p-3 rounded-xl hover:bg-[#242c26] text-[#dde5dc] hover:text-[#FFD700] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  <span>سفارش‌های من</span>
                </button>

                <div className="pt-2 border-t border-[#564334]/20">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCallWaiter();
                    }}
                    className="w-full text-right p-3 rounded-xl bg-[#FF8C00]/15 hover:bg-[#FF8C00]/25 text-[#FF8C00] font-bold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">notifications_active</span>
                    <span>فراخوانی گارسون و سرویس</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-[#ddc1ae]/40 pt-4 border-t border-[#564334]/20">
              <span>کافه زیتون © منوی دیجیتال</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};



