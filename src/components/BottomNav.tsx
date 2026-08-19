import React from 'react';
import { TabType } from '../types';
import { MorphingNavTabIcon } from './MorphingIcons';
import { motion } from 'motion/react';
import { m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeOrdersCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeOrdersCount,
}) => {
  const { triggerSelection } = useHapticFeedback();
  const navItems: NavItem[] = [
    { id: 'menu', label: 'منو', icon: 'restaurant_menu' },
    { id: 'home', label: 'خانه', icon: 'home' },
    { id: 'orders', label: 'سفارش‌ها', icon: 'shopping_bag', badge: activeOrdersCount },
  ];

  return (
    <nav
      id="bottom-nav-bar"
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-3 pt-2 bg-[#1D2F22]/95 dark:bg-[#1a211c]/95 backdrop-blur-lg shadow-[0_-4px_20px_0_rgba(29,47,34,0.15)] rounded-t-[28px] border-t border-[#564334]/20"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <motion.button
            key={item.id}
            id={`nav-tab-${item.id}`}
            onClick={() => {
              triggerSelection();
              onSelectTab(item.id);
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={m3Spring.overshootSnappy}
            className="relative flex flex-col items-center justify-center py-1 px-4 cursor-pointer transform-gpu will-change-transform"
          >
            {/* M3 Active Indicator Pill with Smooth Spring Glide */}
            {isActive && (
              <motion.div
                layoutId="m3ActiveTabPill"
                className="absolute inset-0 bg-[#FFD700] rounded-full z-0 transform-gpu"
                transition={m3Spring.pillGlide}
              />
            )}

            <div className={`relative z-10 flex flex-col items-center transition-colors ${
              isActive ? 'text-[#1D2F22] font-bold' : 'text-[#dde5dc]/70 hover:text-[#FFD700]'
            }`}>
              <MorphingNavTabIcon
                icon={item.icon}
                isActive={isActive}
                badgeCount={item.badge}
              />
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </nav>
  );
};

