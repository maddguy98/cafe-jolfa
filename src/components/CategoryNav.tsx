import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Category } from '../types';
import { MorphingCategoryIcon } from './MorphingIcons';
import { motion, AnimatePresence } from 'motion/react';
import { m3Easing, m3Duration, m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const { triggerSelection } = useHapticFeedback();

  // Reorder categories so the active category morphs to the first position
  const orderedCategories = useMemo(() => {
    const selected = categories.find((c) => c.id === selectedCategoryId);
    if (!selected) return categories;
    return [selected, ...categories.filter((c) => c.id !== selectedCategoryId)];
  }, [categories, selectedCategoryId]);

  // When active category changes, smoothly scroll back to the start of the row
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [selectedCategoryId]);

  // Handle horizontal mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollRef.current.scrollBy({
        left: -e.deltaY * 1.5,
        behavior: 'auto',
      });
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Manual scroll by clicking arrows
  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: amount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="mb-6 md:mb-8 relative scroll-mt-24" id="categories-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-[#dde5dc]">
          دسته‌بندی‌ها
        </h3>
        {/* Desktop scroll arrows */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scrollByAmount(200)}
            className="w-8 h-8 rounded-full bg-[#1a211c] hover:bg-[#242c26] text-[#ddc1ae] hover:text-[#FFD700] flex items-center justify-center transition-colors cursor-pointer border border-[#564334]/20"
            aria-label="اسکرول به راست"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
          <button
            onClick={() => scrollByAmount(-200)}
            className="w-8 h-8 rounded-full bg-[#1a211c] hover:bg-[#242c26] text-[#ddc1ae] hover:text-[#FFD700] flex items-center justify-center transition-colors cursor-pointer border border-[#564334]/20"
            aria-label="اسکرول به چپ"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
        </div>
      </div>

      {/* Scrollable Container with Morphing Layout */}
      <div className="relative group">
        <motion.div
          layout
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 -mx-4 px-4 md:mx-0 md:px-0 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab md:cursor-pointer'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          {orderedCategories.map((cat, index) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <motion.button
                layout
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                onClick={() => {
                  if (!hasMoved) {
                    triggerSelection();
                    onSelectCategory(cat.id);
                  }
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{
                  layout: m3Spring.pillGlide,
                  scale: m3Spring.overshootSnappy,
                }}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm md:text-base whitespace-nowrap shrink-0 cursor-pointer overflow-hidden transition-colors transform-gpu will-change-transform ${
                  isActive
                    ? 'text-[#1D2F22] shadow-sm shadow-[#FFD700]/10 font-bold ring-1 ring-[#FFD700]/15'
                    : 'text-[#ddc1ae] bg-[#242c26] hover:bg-[#2f3731]'
                }`}
              >
                {/* M3 Active Chip Pill Background with Smooth Spring Glide */}
                {isActive && (
                  <motion.div
                    layoutId="m3ActiveCategoryPill"
                    className="absolute inset-0 bg-[#FFD700] rounded-full z-0 transform-gpu"
                    transition={m3Spring.pillGlide}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2 pointer-events-none">
                  <MorphingCategoryIcon icon={cat.icon} isActive={isActive} />
                  <span>{cat.name}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};



