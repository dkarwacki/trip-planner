/**
 * Hook for swipe-to-delete gesture on mobile
 * Implements native iOS/Android pattern
 */

import { useState, useCallback, useRef } from "react";

interface UseSwipeToDeleteOptions {
  onDelete: () => void;
  deleteThreshold?: number; // Pixels to swipe before revealing delete button
  maxSwipe?: number; // Maximum swipe distance
}

interface SwipeState {
  swipeOffset: number;
  isDeleteRevealed: boolean;
  bind: () => {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  handleDelete: () => void;
}

export function useSwipeToDelete({
  onDelete,
  deleteThreshold = 80,
  maxSwipe = 120,
}: UseSwipeToDeleteOptions): SwipeState {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleteRevealed, setIsDeleteRevealed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const currentOffset = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;

      const currentX = e.touches[0].clientX;
      const deltaX = currentX - touchStartX.current;

      // Only allow left swipe (negative deltaX)
      if (deltaX < 0) {
        const newOffset = Math.max(deltaX, -maxSwipe);
        setSwipeOffset(newOffset);
        currentOffset.current = newOffset;

        // Reveal delete if past threshold
        if (Math.abs(newOffset) >= deleteThreshold) {
          setIsDeleteRevealed(true);

          // Haptic feedback when delete is revealed
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        }
      } else {
        // Swipe right - close delete if revealed
        setSwipeOffset(0);
        setIsDeleteRevealed(false);
        currentOffset.current = 0;
      }
    },
    [deleteThreshold, maxSwipe]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null;

    // Snap to either revealed or closed position
    if (isDeleteRevealed) {
      // Snap to revealed position
      setSwipeOffset(-deleteThreshold);
      currentOffset.current = -deleteThreshold;
    } else {
      // Snap back to closed
      setSwipeOffset(0);
      currentOffset.current = 0;
    }
  }, [isDeleteRevealed, deleteThreshold]);

  const handleDelete = useCallback(() => {
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }

    onDelete();
  }, [onDelete]);

  const bind = useCallback(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  );

  return {
    swipeOffset,
    isDeleteRevealed,
    bind,
    handleDelete,
  };
}









