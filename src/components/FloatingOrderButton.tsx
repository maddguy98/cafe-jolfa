import React, { useEffect, useState } from 'react';
import { toPersianDigits } from '../utils/formatters';
import { MorphingFabIcon } from './MorphingIcons';
import { motion } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface FloatingOrderButtonProps {
  totalItemsCount: number;
  onClick: () => void;
}

export const FloatingOrderButton: React.FC<FloatingOrderButtonProps> = ({
  totalItemsCount,
  onClick,
}) => {
  const [isShrunk, setIsShrunk] = useState(false);
  const [isCountChanged, setIsCountChanged] = useState(false);
  const { triggerMedium } = useHapticFeedback();

  const handleClick = () => {
    triggerMedium();
    onClick();
  };

  useEffect(() => {
    setIsCountChanged(true);
    const timer = setTimeout(() => setIsCountChanged(false), 700);
    return () => clearTimeout(timer);
  }, [totalItemsCount]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (totalItemsCount <= 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 md:left-8 z-[55] transform-gpu">
      <motion.button
        id="orderFab"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        animate={isCountChanged ? { scale: [1, 1.15, 0.96, 1] } : { scale: 1 }}
        transition={{
          scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
        }}
        className={`flex items-center justify-center gap-2.5 h-14 bg-[#FF8C00] text-[#0e1510] rounded-full shadow-[0_4px_12px_rgba(255,140,0,0.18)] hover:shadow-[0_4px_16px_rgba(255,215,0,0.22)] transition-colors duration-300 whitespace-nowrap overflow-hidden border border-[#0e1510]/30 cursor-pointer transform-gpu will-change-transform ${
          isShrunk ? 'w-14 px-0' : 'px-6'
        }`}
        aria-label="مشاهده سفارش و تسویه حساب"
      >
        <MorphingFabIcon isItemAdded={isCountChanged} />
        {!isShrunk && (
          <span className="font-bold text-sm md:text-base tracking-tight transition-opacity duration-200">
            سفارش سریع ({toPersianDigits(totalItemsCount)})
          </span>
        )}
      </motion.button>
    </div>
  );
};

