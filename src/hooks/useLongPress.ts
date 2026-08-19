import React, { useRef, useCallback } from 'react';
import { triggerHaptic } from './useHapticFeedback';

interface UseLongPressOptions {
  threshold?: number; // ms to wait before triggering long press (default 260ms)
  onLongPress: () => void;
  onRelease?: () => void;
  onClick?: () => void;
}

export function useLongPress({
  threshold = 260,
  onLongPress,
  onRelease,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const start = useCallback(
    (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
      // Don't trigger on right clicks
      if ('button' in e && e.button !== 0) return;

      isLongPressTriggered.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
      startPos.current = { x: clientX, y: clientY };

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        isLongPressTriggered.current = true;
        triggerHaptic('heavy');
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const move = useCallback((e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (!timerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;

    const diffX = Math.abs(clientX - startPos.current.x);
    const diffY = Math.abs(clientY - startPos.current.y);

    // If moved more than 10px, treat as scroll/drag and cancel long press
    if (diffX > 10 || diffY > 10) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (isLongPressTriggered.current) {
        isLongPressTriggered.current = false;
        if (onRelease) onRelease();
      }
    }
  }, [onRelease]);

  const end = useCallback(
    (e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (isLongPressTriggered.current) {
        if (e && 'preventDefault' in e) {
          e.preventDefault();
        }
        isLongPressTriggered.current = false;
        if (onRelease) onRelease();
      } else {
        // Was a normal short tap
        if (onClick) onClick();
      }
    },
    [onClick, onRelease]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      if (onRelease) onRelease();
    }
  }, [onRelease]);

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
