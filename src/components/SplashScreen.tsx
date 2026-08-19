import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZeytoonLogo } from './ZeytoonLogo';
import { toPersianDigits } from '../utils/formatters';
import { m3Easing, m3Spring } from '../theme/m3Motion';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // M3 Standard Progress Timer (Clean & Deterministic)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Smooth progressive acceleration
        const step = prev > 60 ? 8 : prev > 20 ? 5 : 4;
        return Math.min(100, prev + step);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setIsFinished(true);
        const completeTimer = setTimeout(() => {
          if (onFinish) onFinish();
        }, 320);
        return () => clearTimeout(completeTimer);
      }, 180);

      return () => clearTimeout(timer);
    }
  }, [progress, onFinish]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          id="m3-splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.3, ease: m3Easing.emphasizedAccelerate },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-16 px-6 bg-[#0e1510] text-[#dde5dc] select-none transform-gpu"
        >
          {/* Top Spacing Anchor */}
          <div className="w-full" />

          {/* M3 Center Brand Module */}
          <div className="flex flex-col items-center max-w-sm w-full">
            {/* M3 App Icon Container with Emphasized Decelerate Spring */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: m3Easing.emphasizedDecelerate,
              }}
              className="w-20 h-20 rounded-[28px] bg-[#1a231d] border border-[#564334]/25 flex items-center justify-center p-4 shadow-lg shadow-black/25 mb-5 transform-gpu"
            >
              <ZeytoonLogo className="w-full h-full text-[#FFD700]" />
            </motion.div>

            {/* M3 Headline & Supporting Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.12,
                ease: m3Easing.standardDecelerate,
              }}
              className="text-center space-y-1"
            >
              <h1 className="text-2xl font-bold text-[#FDFAE7] tracking-tight">
                کافه زیتون
              </h1>
              <p className="text-xs text-[#ddc1ae] font-normal">
                طعم اصیل قهوه و آرامش
              </p>
            </motion.div>
          </div>

          {/* M3 Linear Progress Indicator (Docked at Bottom) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="w-full max-w-[200px] flex flex-col items-center gap-2"
          >
            {/* M3 Linear Track */}
            <div className="w-full h-1 bg-[#242c26] rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-[#FFD700] rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Persian Number Percentage */}
            <span className="text-[11px] font-medium text-[#ddc1ae] tracking-wider font-mono">
              {toPersianDigits(progress)}٪
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
