import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { m3Easing, m3Duration } from '../theme/m3Motion';

// Morphing Add-to-Cart / Plus Icon with Checkmark feedback
interface MorphingPlusCheckProps {
  isAdded: boolean;
  className?: string;
  size?: number;
}

export const MorphingPlusCheck: React.FC<MorphingPlusCheckProps> = ({
  isAdded,
  className = '',
  size = 20,
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {!isAdded ? (
          <motion.svg
            key="plus"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
            transition={{ duration: m3Duration.short4, ease: m3Easing.emphasizedDecelerate }}
          >
            <motion.line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: m3Duration.short4, ease: m3Easing.standardDecelerate }}
            />
            <motion.line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: m3Duration.short4, ease: m3Easing.standardDecelerate }}
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="check"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1], rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: m3Duration.medium3, ease: m3Easing.emphasized }}
          >
            <motion.polyline
              points="20 6 9 17 4 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: m3Duration.medium1, ease: m3Easing.emphasizedDecelerate }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
};

// Morphing Hamburger Menu to Arrow/X
interface MorphingMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MorphingMenuButton: React.FC<MorphingMenuButtonProps> = ({
  isOpen,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      id="btn-sidebar-toggle"
      onClick={onClick}
      aria-label="Menu"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: m3Duration.short2, ease: m3Easing.standardDecelerate }}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#343b35]/30 transition-colors cursor-pointer ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.line
          x1="4"
          y1="6"
          x2="20"
          y2="6"
          animate={isOpen ? { rotate: 45, y: 6, x: 0 } : { rotate: 0, y: 0, x: 0 }}
          transition={{ duration: m3Duration.medium2, ease: m3Easing.emphasized }}
        />
        <motion.line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: m3Duration.short3, ease: m3Easing.standardAccelerate }}
        />
        <motion.line
          x1="4"
          y1="18"
          x2="20"
          y2="18"
          animate={isOpen ? { rotate: -45, y: -6, x: 0 } : { rotate: 0, y: 0, x: 0 }}
          transition={{ duration: m3Duration.medium2, ease: m3Easing.emphasized }}
        />
      </svg>
    </motion.button>
  );
};

// Morphing Category Icon with animated aura and spring morph
interface MorphingCategoryIconProps {
  icon: string;
  isActive: boolean;
}

export const MorphingCategoryIcon: React.FC<MorphingCategoryIconProps> = ({
  icon,
  isActive,
}) => {
  return (
    <motion.span
      className="relative flex items-center justify-center"
      animate={isActive ? { scale: [1, 1.22, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: m3Duration.medium3, ease: m3Easing.emphasized }}
    >
      <span className={`material-symbols-outlined text-lg ${isActive ? 'fill-1' : ''}`}>
        {icon}
      </span>
      {isActive && (
        <motion.span
          layoutId="cat-morph-ring"
          className="absolute -inset-1 rounded-full bg-[#FFD700]/20 pointer-events-none"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.3, opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
        />
      )}
    </motion.span>
  );
};

// Morphing Tab Icon with bounce and shape morph
interface MorphingNavTabIconProps {
  icon: string;
  isActive: boolean;
  badgeCount?: number;
}

export const MorphingNavTabIcon: React.FC<MorphingNavTabIconProps> = ({
  icon,
  isActive,
  badgeCount,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      <motion.span
        className={`material-symbols-outlined text-2xl ${isActive ? 'fill-1' : ''}`}
        animate={
          isActive
            ? { scale: [1, 1.25, 0.95, 1], y: [0, -3, 0] }
            : { scale: 1, y: 0 }
        }
        transition={{ duration: m3Duration.medium3, ease: m3Easing.emphasized }}
      >
        {icon}
      </motion.span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: m3Duration.medium1, ease: m3Easing.emphasizedDecelerate }}
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF8C00] rounded-full ring-2 ring-[#1D2F22]"
        />
      )}
    </div>
  );
};

// Morphing FAB Icon (Receipt / Bag morph)
interface MorphingFabIconProps {
  isItemAdded?: boolean;
}

export const MorphingFabIcon: React.FC<MorphingFabIconProps> = ({ isItemAdded }) => {
  return (
    <motion.span
      className="material-symbols-outlined text-2xl font-bold inline-block"
      animate={
        isItemAdded
          ? { scale: [1, 1.35, 0.9, 1], rotate: [0, -15, 15, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={{ duration: m3Duration.medium4, ease: m3Easing.emphasized }}
    >
      receipt_long
    </motion.span>
  );
};

