/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile interactions
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: 50,
  warning: [50, 30],
  error: [50, 50, 50],
  selection: 10
};

/**
 * Trigger haptic feedback (vibration) on supported devices
 * @param pattern - The haptic pattern to use
 */
export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(hapticPatterns[pattern]);
  }
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Higher-order function to add haptic feedback to event handlers
 * @param handler - Original event handler
 * @param pattern - Haptic pattern to trigger
 */
export const withHaptic = <T extends (...args: unknown[]) => unknown>(
  handler: T,
  pattern: HapticPattern = 'light'
): T => {
  return ((...args: unknown[]) => {
    triggerHaptic(pattern);
    return handler(...args);
  }) as T;
};
