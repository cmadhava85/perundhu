import { useRef, useCallback, useState } from 'react';

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface SwipeState {
  isSwiping: boolean;
  swipeDistance: number;
  swipeDirection: 'left' | 'right' | null;
}

export const useSwipeGesture = (config: SwipeGestureConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    onSwipeStart,
    onSwipeEnd,
  } = config;

  const startX = useRef(0);
  const startY = useRef(0);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeDistance: 0,
    swipeDirection: null,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    onSwipeStart?.();
  }, [onSwipeStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    // Only track horizontal swipes (ignore if too much vertical movement)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // Prevent default scrolling when swiping horizontally
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }

    const direction = deltaX > 0 ? 'right' : 'left';
    const distance = Math.abs(deltaX);

    setSwipeState({
      isSwiping: true,
      swipeDistance: distance,
      swipeDirection: direction,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { swipeDistance, swipeDirection } = swipeState;

    // Check if swipe threshold was reached
    if (swipeDistance >= threshold) {
      if (swipeDirection === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDirection === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Reset state
    setSwipeState({
      isSwiping: false,
      swipeDistance: 0,
      swipeDirection: null,
    });

    onSwipeEnd?.();
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeEnd]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    swipeHandlers,
    swipeState,
  };
};

export default useSwipeGesture;
