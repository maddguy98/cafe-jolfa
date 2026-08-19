import React from 'react';
import { MorphingMenuButton } from './MorphingIcons';
import { ZeytoonLogo } from './ZeytoonLogo';
import { motion } from 'motion/react';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCallWaiter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen = false,
  onOpenSidebar,
  onOpenSearch,
  onOpenCallWaiter,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-8 h-16 bg-[#1D2F22]/85 dark:bg-[#0e1510]/85 backdrop-blur-md shadow-sm shadow-[#1D2F22]/10 w-full rounded-bl-[32px] rounded-br-[8px]">
      <div className="flex items-center gap-2">
        <MorphingMenuButton
          isOpen={isSidebarOpen}
          onClick={onOpenSidebar}
          className="text-[#FFD700] dark:text-[#ffe16d]"
        />

        <div
          title="کافه زیتون"
          className="flex items-center gap-2 select-none"
        >
          <motion.div
            whileHover={{ rotate: 10, scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="text-[#FFD700] dark:text-[#ffe16d] flex items-center"
          >
            <ZeytoonLogo className="w-7 h-7 md:w-8 md:h-8" />
          </motion.div>
          <h1 className="text-xl md:text-2xl font-bold text-[#FFD700] dark:text-[#ffe16d] tracking-tight">
            کافه زیتون
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* Call Waiter / Service Button for Customers */}
        <motion.button
          id="btn-call-waiter"
          onClick={onOpenCallWaiter}
          aria-label="فراخوانی گارسون"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-1.5 shadow-sm shadow-[#FF8C00]/30 cursor-pointer transform-gpu transition-colors"
        >
          <span className="material-symbols-outlined text-base md:text-lg animate-bounce">
            notifications_active
          </span>
          <span className="hidden sm:inline">فراخوانی گارسون</span>
          <span className="sm:hidden">گارسون</span>
        </motion.button>

        {/* Search button */}
        <motion.button
          id="btn-search-toggle"
          onClick={onOpenSearch}
          aria-label="Search"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="text-[#FFD700] dark:text-[#ffe16d] hover:bg-[#343b35]/20 transition-colors rounded-full p-2 cursor-pointer transform-gpu"
        >
          <span className="material-symbols-outlined text-xl md:text-2xl">search</span>
        </motion.button>
      </div>
    </header>
  );
};


