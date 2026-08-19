import React from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { ZeytoonLogo } from './ZeytoonLogo';
import { motion } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useLongPress } from '../hooks/useLongPress';

interface HomeTabProps {
  popularItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onGoToMenu: () => void;
  onPeekStart?: (item: MenuItem) => void;
  onPeekEnd?: () => void;
}

const PopularItemCard: React.FC<{
  item: MenuItem;
  onSelectItem: (item: MenuItem) => void;
  onPeekStart?: (item: MenuItem) => void;
  onPeekEnd?: () => void;
}> = ({ item, onSelectItem, onPeekStart, onPeekEnd }) => {
  const { triggerLight } = useHapticFeedback();

  const handleCardClick = () => {
    triggerLight();
    onSelectItem(item);
  };

  const longPressHandlers = useLongPress({
    threshold: 260,
    onLongPress: () => {
      if (onPeekStart) onPeekStart(item);
    },
    onRelease: () => {
      if (onPeekEnd) onPeekEnd();
    },
    onClick: handleCardClick,
  });

  return (
    <motion.div
      {...longPressHandlers}
      onContextMenu={(e) => e.preventDefault()}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={m3Spring.overshoot}
      className="bg-[#242c26] rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-[#2f3731] transition-colors transform-gpu will-change-transform shadow-sm select-none"
    >
      <img
        src={item.image}
        alt={item.title}
        className="w-14 h-14 rounded-xl object-cover pointer-events-none"
        loading="lazy"
      />
      <div className="flex-1 min-w-0 pointer-events-none">
        <h4 className="font-medium text-sm text-[#dde5dc] truncate">{item.title}</h4>
        <p className="text-xs text-[#FFD700] font-medium mt-1">{formatPrice(item.price)}</p>
      </div>
    </motion.div>
  );
};

export const HomeTab: React.FC<HomeTabProps> = ({
  popularItems,
  onSelectItem,
  onGoToMenu,
  onPeekStart,
  onPeekEnd,
}) => {
  const { triggerSelection } = useHapticFeedback();

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={m3Spring.overshoot}
        className="rounded-[24px] bg-[#1D2F22] p-6 border border-[#564334]/20 transform-gpu"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <ZeytoonLogo className="w-8 h-8 text-[#FFD700]" />
          <h2 className="text-2xl font-bold text-[#FDFAE7]">
            کافه زیتون
          </h2>
        </div>
        <p className="text-xs md:text-sm text-[#ddc1ae] leading-relaxed mb-4">
          قهوه تخصصی و طعم‌های تازه در فضایی مدرن و دلنشین.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={m3Spring.overshootSnappy}
          onClick={() => {
            triggerSelection();
            onGoToMenu();
          }}
          className="px-5 py-2.5 rounded-full bg-[#FF8C00] text-[#0e1510] font-bold text-xs hover:bg-[#FFD700] transition-colors cursor-pointer transform-gpu shadow-sm shadow-[#FF8C00]/20"
        >
          مشاهده منو
        </motion.button>
      </motion.div>

      {/* Popular Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#dde5dc]">
          پیشنهادهای محبوب
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {popularItems.map((item) => (
            <PopularItemCard
              key={item.id}
              item={item}
              onSelectItem={onSelectItem}
              onPeekStart={onPeekStart}
              onPeekEnd={onPeekEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
