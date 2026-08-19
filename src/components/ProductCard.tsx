import React, { useState } from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { MorphingPlusCheck } from './MorphingIcons';
import { motion } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useLongPress } from '../hooks/useLongPress';

interface ProductCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  onAdd: (item: MenuItem, e: React.MouseEvent) => void;
  onPeekStart?: (item: MenuItem) => void;
  onPeekEnd?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onSelect,
  onAdd,
  onPeekStart,
  onPeekEnd,
}) => {
  const [isJustAdded, setIsJustAdded] = useState(false);
  const { triggerLight, triggerMedium } = useHapticFeedback();

  const handleCardClick = () => {
    triggerLight();
    onSelect(item);
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
    onClick: handleCardClick,
  });

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerMedium();
    setIsJustAdded(true);
    onAdd(item, e);
    setTimeout(() => setIsJustAdded(false), 900);
  };

  return (
    <motion.div
      id={`product-card-${item.id}`}
      {...longPressHandlers}
      onContextMenu={(e) => e.preventDefault()}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={m3Spring.overshoot}
      className="bg-[#242c26] border border-[#564334]/20 rounded-[24px] p-3.5 relative flex flex-col justify-between gap-3 shadow-md hover:shadow-lg hover:shadow-[#1D2F22]/25 cursor-pointer transition-shadow transform-gpu will-change-transform select-none group"
    >
      {/* Top Image + Badges */}
      <div className="w-full h-40 rounded-2xl overflow-hidden relative bg-[#1a211c] transform-gpu">
        <motion.img
          whileHover={{ scale: 1.06 }}
          transition={m3Spring.overshoot}
          className="w-full h-full object-cover transform-gpu pointer-events-none transition-transform duration-500 ease-out"
          alt={item.title}
          src={item.image}
          loading="lazy"
        />

        {/* Badge Pill */}
        {item.badge && (
          <div className="absolute top-2.5 right-2.5 bg-[#FF8C00] text-[#0e1510] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md z-10 backdrop-blur-sm bg-opacity-95">
            {item.badge}
          </div>
        )}

        {/* Preparation Time Pill */}
        {item.preparationTime && (
          <div className="absolute bottom-2.5 right-2.5 bg-[#0e1510]/80 backdrop-blur-md text-[#ddc1ae] text-[10px] font-medium px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-[#FFD700]">timer</span>
            <span>{item.preparationTime}</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-base font-bold text-[#FDFAE7] group-hover:text-[#FFD700] transition-colors line-clamp-1">
              {item.title}
            </h4>
            <span className="text-[11px] text-[#ddc1ae]/60 font-mono tracking-wider truncate">
              {item.titleEn}
            </span>
          </div>

          <p className="text-xs text-[#ddc1ae]/85 line-clamp-2 leading-relaxed h-9">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-[#1a211c] text-[#ddc1ae]/75 px-2 py-0.5 rounded-md border border-[#564334]/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-[#564334]/20">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#ddc1ae]/60">قیمت</span>
            <span className="text-sm md:text-base font-bold text-[#FFD700]">
              {formatPrice(item.price)}
            </span>
          </div>

          <motion.button
            id={`btn-add-${item.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleAddClick}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            animate={
              isJustAdded
                ? { scale: [1, 1.25, 0.95, 1], backgroundColor: '#FFD700' }
                : { backgroundColor: '#FF8C00' }
            }
            transition={{
              scale: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
              backgroundColor: { duration: 0.2 },
            }}
            className="h-8 px-3 rounded-full text-[#0e1510] font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#FF8C00]/20 cursor-pointer transform-gpu"
            aria-label={`افزودن ${item.title}`}
          >
            <MorphingPlusCheck isAdded={isJustAdded} size={15} />
            <span>{isJustAdded ? 'اضافه شد' : 'افزودن'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
