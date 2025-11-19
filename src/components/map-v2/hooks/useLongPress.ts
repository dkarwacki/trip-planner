/**
 * Hook for detecting long-press gestures on mobile
 * Used for entering reorder mode
 */

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  threshold?: number; // Time in ms to trigger long press
  onStart?: () => void;
  onCancel?: () => void;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: () => void;
  onTouchEnd: () => void;
}

export function useLongPress({
  onLongPress,
  threshold = 800, // 800ms standard for long-press
  onStart,
  onCancel,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      onStart?.();

      timerRef.current = setTimeout(() => {
        // Trigger long-press
        onLongPress();

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(50); // Medium vibration for long-press
        }

        clear();
      }, threshold);
    },
    [onLongPress, threshold, onStart, clear]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel if user moves finger too much (they're scrolling)
      if (!startPosRef.current || !timerRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // Cancel if moved more than 10px in any direction
      if (deltaX > 10 || deltaY > 10) {
        onCancel?.();
        clear();
      }
    },
    [onCancel, clear]
  );

  const handleTouchEnd = useCallback(() => {
    // Cancel if released before threshold
    if (timerRef.current) {
      onCancel?.();
    }
    clear();
  }, [onCancel, clear]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}



