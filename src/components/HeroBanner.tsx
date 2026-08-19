import React from 'react';
import { MenuItem } from '../types';
import { motion } from 'motion/react';
import { m3Easing, m3Duration } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useLongPress } from '../hooks/useLongPress';

interface HeroBannerProps {
  item: MenuItem;
  onSelectItem: (item: MenuItem) => void;
  onPeekStart?: (item: MenuItem) => void;
  onPeekEnd?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  item,
  onSelectItem,
  onPeekStart,
  onPeekEnd,
}) => {
  const { triggerLight } = useHapticFeedback();

  const handleBannerClick = () => {
    triggerLight();
    onSelectItem(item);
  };

  const longPressHandlers = useLongPress({
    threshold: 260,
    onLongPress: () => {
      if (onPeekStart) {
        onPeekStart(item);
      }
    },
    onRelease: () => {
      if (onPeekEnd) {
        onPeekEnd();
      }
    },
    onClick: handleBannerClick,
  });

  return (
    <motion.section
      id="hero-special-banner"
      {...longPressHandlers}
      onContextMenu={(e) => e.preventDefault()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: m3Duration.medium2, ease: m3Easing.emphasizedDecelerate }}
      className="mb-8 md:mb-12 rounded-[28px] overflow-hidden relative shadow-2xl shadow-[#1D2F22]/20 h-64 md:h-80 w-full group cursor-pointer border border-[#564334]/20 transform-gpu will-change-transform select-none"
    >
      <div className="absolute inset-0 bg-[#1D2F22]/40 z-10 transition-opacity duration-300 group-hover:bg-[#1D2F22]/25 pointer-events-none"></div>
      <img
        alt="Zeytoon Cafe Special"
        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105 transform-gpu pointer-events-none"
        src={item.image}
      />
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 bg-gradient-to-t from-[#0e1510] via-[#0e1510]/50 to-transparent pointer-events-none">
        <span className="inline-block px-3 py-1 bg-[#FFD700] text-[#1D2F22] font-bold text-xs rounded-full mb-2 w-max shadow-sm">
          ویژه امروز
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#FDFAE7] mb-2">
          {item.title}
        </h2>
        <p className="text-sm md:text-base text-[#ddc1ae] max-w-md leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>
    </motion.section>
  );
};

