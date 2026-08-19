import { useCallback } from 'react';

/**
 * Standard tactile haptic patterns (in milliseconds)
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,          // Micro pulse for tabs, +/- quantity counters
  light: 12,             // Subtle tap for card clicks & button taps
  medium: 22,            // Solid feedback for adding item to cart & FAB click
  heavy: 35,             // Strong interaction feedback
  success: [15, 45, 25], // Double distinct pulse for order placement
  warning: [25, 40, 25], // Double alert pulse
  error: [30, 30, 30, 30, 40],
};

/**
 * Direct tactile vibration function safe for browser & iframe environments
 */
export function triggerHaptic(type: HapticType | number | number[] = 'light'): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if ('navigator' in window && typeof window.navigator.vibrate === 'function') {
      const pattern = typeof type === 'string' ? HAPTIC_PATTERNS[type] || 12 : type;
      return window.navigator.vibrate(pattern);
    }
  } catch {
    // Graceful fallback on environments where vibration is restricted or unsupported
  }
  return false;
}

/**
 * React hook providing tactile haptic feedback for user interactions
 */
export function useHapticFeedback() {
  const trigger = useCallback((type: HapticType | number | number[] = 'light') => {
    return triggerHaptic(type);
  }, []);

  const triggerLight = useCallback(() => triggerHaptic('light'), []);
  const triggerMedium = useCallback(() => triggerHaptic('medium'), []);
  const triggerHeavy = useCallback(() => triggerHaptic('heavy'), []);
  const triggerSelection = useCallback(() => triggerHaptic('selection'), []);
  const triggerSuccess = useCallback(() => triggerHaptic('success'), []);
  const triggerError = useCallback(() => triggerHaptic('error'), []);

  return {
    trigger,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerSuccess,
    triggerError,
  };

}
