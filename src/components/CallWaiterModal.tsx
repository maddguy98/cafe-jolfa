import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { m3Duration, m3Easing, m3Spring } from '../theme/m3Motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { toPersianDigits } from '../utils/formatters';
import { ServiceRequest } from '../types';
import { soundManager } from '../utils/audioAlert';
import { getSavedTableNumber, saveTableNumber } from '../utils/storageSync';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (request: ServiceRequest) => void;
}

const SERVICE_OPTIONS: Array<{
  type: ServiceRequest['requestType'];
  title: string;
  icon: string;
  description: string;
}> = [
  {
    type: 'bill',
    title: 'درخواست صورت‌حساب و کارتخوان',
    icon: 'credit_card',
    description: 'تسویه حساب و آوردن پوز سر میز',
  },
  {
    type: 'clean',
    title: 'تمیز کردن و جمع‌آوری میز',
    icon: 'mop',
    description: 'نظافت سطح میز یا جمع‌آوری ظروف خالی',
  },
  {
    type: 'reorder',
    title: 'راهنمایی سفارش / حضور گارسون',
    icon: 'person_raised_hand',
    description: 'سوال درباره منو یا ثبت سفارش حضوری',
  },
  {
    type: 'water',
    title: 'درخواست آب معدنی / لیوان اضافی',
    icon: 'water_drop',
    description: 'آب خنک یا لیوان تمیز',
  },
  {
    type: 'napkin_sugar',
    title: 'دستمال کاغذی / قند و شکر',
    icon: 'inventory_2',
    description: 'ملزومات پذیرایی و شیرین‌کننده',
  },
  {
    type: 'custom',
    title: 'سایر درخواست‌ها',
    icon: 'edit_note',
    description: 'توضیحات اختصاصی و یادداشت برای گارسون',
  },
];

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const [selectedType, setSelectedType] = useState<ServiceRequest['requestType']>('reorder');
  const [tableNumber, setTableNumber] = useState<string>(() => getSavedTableNumber());
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { triggerSelection, triggerSuccess } = useHapticFeedback();

  const handleTableChange = (val: string) => {
    setTableNumber(val);
    saveTableNumber(val);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!tableNumber.trim()) return;

    setIsSubmitting(true);
    triggerSuccess();
    soundManager.playCustomerConfirmation();

    const selectedOption = SERVICE_OPTIONS.find((o) => o.type === selectedType) || SERVICE_OPTIONS[0];

    const newRequest: ServiceRequest = {
      id: `srv-${Date.now()}`,
      tableNumber: tableNumber.trim(),
      requestType: selectedType,
      requestLabel: selectedOption.title,
      customNote: customNote.trim() || undefined,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'pending',
    };

    setTimeout(() => {
      onRequestSubmitted(newRequest);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setCustomNote('');
        onClose();
      }, 1900);
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="call-waiter-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: m3Duration.short3, ease: m3Easing.standard }}
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-[#0e1510]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transform-gpu"
      >
        <motion.div
          id="call-waiter-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={m3Spring.pillGlide}
          className="w-full max-w-lg bg-[#161d18] rounded-t-[32px] sm:rounded-[28px] border border-[#564334]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transform-gpu will-change-transform"
        >
          {/* Header */}
          <div className="p-5 bg-[#1D2F22] border-b border-[#564334]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">notifications_active</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-[#FDFAE7]">فراخوانی گارسون و سرویس</h3>
                <p className="text-xs text-[#ddc1ae]">سفارش شما بی‌درنگ به تیم سالن منتقل می‌شود</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#0e1510]/40 text-[#dde5dc] hover:text-[#FFD700] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 hide-scrollbar flex-1">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 text-[#FFD700] mx-auto flex items-center justify-center animate-bounce">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-[#FDFAE7]">درخواست شما ارسال شد!</h4>
                  <p className="text-xs text-[#ddc1ae] max-w-xs mx-auto leading-relaxed">
                    پیغام شما به گارسون و پرسنل سالن رسید. همکاران ما در سریع‌ترین زمان سر میز {toPersianDigits(tableNumber)} حاضر خواهند شد.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Table Number Selection */}
                <div className="bg-[#1a211c] p-3.5 rounded-2xl border border-[#564334]/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#FFD700] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">table_restaurant</span>
                      شماره میز شما:
                    </span>
                    <span className="text-[11px] text-[#ddc1ae]">میز {toPersianDigits(tableNumber)}</span>
                  </div>

                  {/* Fast Table Selector Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', 'تراس', 'VIP'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          triggerSelection();
                          handleTableChange(tab);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          tableNumber === tab
                            ? 'bg-[#FF8C00] text-[#0e1510] shadow-sm shadow-[#FF8C00]/30 scale-105'
                            : 'bg-[#242c26] text-[#dde5dc] hover:bg-[#2f3731]'
                        }`}
                      >
                        {tab.startsWith('تراس') || tab.startsWith('VIP') ? tab : `میز ${tab}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Request Type Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#FDFAE7] block">
                    نوع خدمت مورد نیاز:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SERVICE_OPTIONS.map((opt) => {
                      const isSelected = selectedType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            triggerSelection();
                            setSelectedType(opt.type);
                          }}
                          className={`p-3 rounded-2xl text-right transition-all flex items-start gap-3 border cursor-pointer ${
                            isSelected
                              ? 'bg-[#1D2F22] border-[#FFD700] shadow-sm shadow-[#FFD700]/10'
                              : 'bg-[#242c26] border-[#564334]/20 hover:border-[#564334]/50'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#FFD700] text-[#0e1510]'
                                : 'bg-[#1a211c] text-[#ddc1ae]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-xs text-[#FDFAE7] truncate">
                              {opt.title}
                            </h5>
                            <p className="text-[11px] text-[#ddc1ae] line-clamp-1 mt-0.5">
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Custom Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#ddc1ae] block">
                    توضیحات بیشتر (اختیاری):
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="مثال: لطفا دو تا فنجان خالی و یک بطری آب خنک بیاورید..."
                    className="w-full bg-[#1a211c] border border-[#564334]/30 rounded-2xl p-3 text-xs text-[#dde5dc] placeholder-[#ddc1ae]/40 focus:border-[#FFD700] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer CTA */}
          {!isSuccess && (
            <div className="p-4 bg-[#0e1510] border-t border-[#564334]/20">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting || !tableNumber.trim()}
                onClick={() => handleSubmit()}
                className="w-full py-3.5 rounded-full bg-[#FF8C00] hover:bg-[#FFD700] text-[#0e1510] font-bold text-sm transition-colors shadow-md shadow-[#FF8C00]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">notifications_active</span>
                {isSubmitting ? 'در حال ارسال درخواست...' : `ارسال درخواست برای گارسون (میز ${toPersianDigits(tableNumber)})`}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
