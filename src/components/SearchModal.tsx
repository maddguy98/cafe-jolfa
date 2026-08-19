import React, { useState } from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  const [query, setQuery] = useState('');
  const { triggerLight } = useHapticFeedback();

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="search-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[85] bg-[#0e1510]/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16 transform-gpu"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={m3Spring.overshoot}
            className="w-full max-w-md bg-[#1a211c] rounded-[28px] border border-[#564334]/20 overflow-hidden flex flex-col max-h-[75vh] shadow-2xl transform-gpu will-change-transform"
          >
            <div className="p-4 bg-[#1D2F22] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FFD700]">search</span>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در منو..."
                className="flex-1 bg-transparent border-none text-sm text-[#dde5dc] placeholder-[#ddc1ae]/60 focus:outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={m3Spring.overshootSnappy}
                onClick={onClose}
                className="text-[#ddc1ae] hover:text-[#FFD700] p-1 rounded-full hover:bg-[#242c26] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 hide-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#ddc1ae]/70">
                  موردی یافت نشد
                </div>
              ) : (
                filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.025, x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    transition={m3Spring.overshoot}
                    onClick={() => {
                      triggerLight();
                      onSelectItem(item);
                      onClose();
                    }}
                    className="bg-[#242c26] hover:bg-[#2f3731] rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-[#dde5dc] truncate">{item.title}</h4>
                      <span className="text-xs text-[#FFD700]">{formatPrice(item.price)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

