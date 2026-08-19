import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { m3Duration, m3Easing, m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { getStaffPin } from '../utils/storageSync';

interface StaffPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffPinModal: React.FC<StaffPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { triggerSelection, triggerError, triggerSuccess } = useHapticFeedback();

  // Keyboard handler for desktop when PIN modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Backspace') {
        handleDelete();
        return;
      }
      // Check numeric keys 0-9
      const digitMatch = e.key.match(/^[0-9]$/);
      if (digitMatch) {
        handleDigitClick(digitMatch[0]);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, pin]);

  const handleDigitClick = (digit: string) => {
    if (pin.length >= 4) return;
    triggerSelection();
    setError(false);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDelete = () => {
    triggerSelection();
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerSelection();
    setError(false);
    setPin('');
  };

  const verifyPin = (inputPin: string) => {
    const currentPin = getStaffPin();
    if (inputPin === currentPin) {
      triggerSuccess();
      setTimeout(() => {
        setPin('');
        setError(false);
        onSuccess();
      }, 150);
    } else {
      triggerError();
      setError(true);
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="staff-pin-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: m3Duration.short3, ease: m3Easing.standard }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-[#0e1510]/90 backdrop-blur-md flex items-center justify-center p-4 transform-gpu"
      >
        <motion.div
          id="staff-pin-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={m3Spring.overshoot}
          className="w-full max-w-xs bg-[#161d18] rounded-[28px] border border-[#564334]/30 shadow-2xl p-6 flex flex-col items-center space-y-5 text-center transform-gpu will-change-transform"
        >
          {/* Header Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#1D2F22] border border-[#564334]/30 flex items-center justify-center text-[#FFD700]">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#FDFAE7]">ورود پرسنل و پذیرش</h3>
            <p className="text-xs text-[#ddc1ae]">پین کد دسترسی ۴ رقمی را وارد کنید</p>
          </div>

          {/* PIN Dots Display */}
          <div className="flex items-center justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <motion.div
                  key={index}
                  animate={
                    error
                      ? { x: [-8, 8, -6, 6, -3, 3, 0] }
                      : isFilled
                      ? { scale: [1, 1.25, 1] }
                      : {}
                  }
                  transition={{ duration: 0.25 }}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    error
                      ? 'bg-rose-500 border-rose-400'
                      : isFilled
                      ? 'bg-[#FFD700] border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                      : 'bg-[#242c26] border-[#564334]/40'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-rose-400 font-medium"
            >
              پین کد وارد شده اشتباه است
            </motion.p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <motion.button
                key={digit}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigitClick(digit)}
                className="h-12 rounded-2xl bg-[#242c26] hover:bg-[#2f3731] text-[#dde5dc] font-bold text-lg flex items-center justify-center transition-colors cursor-pointer border border-[#564334]/20 active:bg-[#FF8C00] active:text-[#0e1510]"
              >
                {digit}
              </motion.button>
            ))}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              className="h-12 rounded-2xl bg-[#1a211c] text-[#ddc1ae] text-xs font-medium flex items-center justify-center hover:bg-[#242c26] transition-colors cursor-pointer"
            >
              پاک
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDigitClick('0')}
              className="h-12 rounded-2xl bg-[#242c26] hover:bg-[#2f3731] text-[#dde5dc] font-bold text-lg flex items-center justify-center transition-colors cursor-pointer border border-[#564334]/20 active:bg-[#FF8C00] active:text-[#0e1510]"
            >
              0
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-[#1a211c] text-[#ddc1ae] flex items-center justify-center hover:bg-[#242c26] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">backspace</span>
            </motion.button>
          </div>

          <div className="pt-2 flex items-center justify-between w-full border-t border-[#564334]/20 text-[11px] text-[#ddc1ae]/70">
            <span>رمز پیش‌فرض: 1234</span>
            <button
              onClick={onClose}
              className="text-[#FFD700] hover:underline cursor-pointer"
            >
              انصراف و بازگشت
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
