import { useEffect } from 'react';

/**
 * Custom hook to detect when mobile keyboard is open
 * Adds/removes 'keyboard-open' class to body when input/textarea is focused
 * This helps prevent bottom navigation from overlapping with inputs on mobile
 */
export const useKeyboardDetector = () => {
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let isKeyboardOpen = false;

    // Method 1: Focus/Blur events on input elements
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        document.body.classList.add('keyboard-open');
        isKeyboardOpen = true;
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Small delay to prevent flickering when switching between inputs
        setTimeout(() => {
          // Check if another input is focused
          const activeElement = document.activeElement;
          if (
            activeElement?.tagName !== 'INPUT' &&
            activeElement?.tagName !== 'TEXTAREA' &&
            activeElement?.tagName !== 'SELECT' &&
            !(activeElement as HTMLElement)?.isContentEditable
          ) {
            document.body.classList.remove('keyboard-open');
            isKeyboardOpen = false;
          }
        }, 100);
      }
    };

    // Method 2: Visual Viewport API (more reliable for keyboard detection)
    const handleViewportResize = () => {
      if (!window.visualViewport) return;

      const currentHeight = window.visualViewport.height;
      const heightDiff = initialViewportHeight - currentHeight;

      // If viewport shrunk by more than 150px, keyboard is likely open
      if (heightDiff > 150 && !isKeyboardOpen) {
        document.body.classList.add('keyboard-open');
        isKeyboardOpen = true;
      } 
      // If viewport restored to near original height, keyboard is closed
      else if (heightDiff < 100 && isKeyboardOpen) {
        // Check if input is still focused
        const activeElement = document.activeElement;
        if (
          activeElement?.tagName !== 'INPUT' &&
          activeElement?.tagName !== 'TEXTAREA' &&
          activeElement?.tagName !== 'SELECT'
        ) {
          document.body.classList.remove('keyboard-open');
          isKeyboardOpen = false;
        }
      }
    };

    // Add event listeners
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    // Visual Viewport API for more accurate keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      document.body.classList.remove('keyboard-open');
    };
  }, []);
};
