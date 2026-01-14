/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Phase 3 - Code Quality
 */

/**
 * Announce message to screen readers
 * Uses ARIA live region to announce dynamic content changes
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement (1 second)
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  
  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  const isFocusableTag = focusableTags.includes(element.tagName);
  const hasTabindex = element.tabIndex >= 0;
  
  return isFocusableTag || hasTabindex;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter(el => !el.hasAttribute('hidden') && el.offsetParent !== null);
}

/**
 * Trap focus within an element (useful for modals)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = getFocusableElements(element);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  firstFocusable?.focus();
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, largeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = largeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Create ARIA live region for dynamic announcements
 */
export function createLiveRegion(priority: 'polite' | 'assertive' = 'polite'): HTMLDivElement {
  const existing = document.getElementById('aria-live-region');
  if (existing) {
    return existing as HTMLDivElement;
  }
  
  const region = document.createElement('div');
  region.id = 'aria-live-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  region.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  
  document.body.appendChild(region);
  return region;
}

/**
 * Keyboard navigation helper for custom components
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number
): number {
  let newIndex = currentIndex;
  
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault();
      newIndex = (currentIndex + 1) % elements.length;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault();
      newIndex = (currentIndex - 1 + elements.length) % elements.length;
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = elements.length - 1;
      break;
  }
  
  elements[newIndex]?.focus();
  return newIndex;
}

/**
 * Skip to content link helper
 */
export function createSkipLink(targetId: string, text = 'Skip to main content'): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = text;
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  return skipLink;
}

/**
 * ARIA roles helper
 */
export const AriaRoles = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  APPLICATION: 'application',
  ARTICLE: 'article',
  BANNER: 'banner',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  DIALOG: 'dialog',
  FORM: 'form',
  LINK: 'link',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  REGION: 'region',
  SEARCH: 'search',
  STATUS: 'status',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
} as const;

/**
 * ARIA properties helper
 */
export const AriaProperties = {
  EXPANDED: 'aria-expanded',
  HIDDEN: 'aria-hidden',
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  CONTROLS: 'aria-controls',
  CURRENT: 'aria-current',
  DISABLED: 'aria-disabled',
  INVALID: 'aria-invalid',
  PRESSED: 'aria-pressed',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Accessibility audit helper
 */
export interface AccessibilityIssue {
  element: HTMLElement;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  wcagCriterion: string;
}

export function auditAccessibility(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // Check for images without alt text
  container.querySelectorAll('img:not([alt])').forEach(img => {
    issues.push({
      element: img as HTMLElement,
      issue: 'Image missing alt attribute',
      severity: 'error',
      wcagCriterion: '1.1.1 Non-text Content',
    });
  });
  
  // Check for buttons without accessible labels
  container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
    if (!btn.textContent?.trim()) {
      issues.push({
        element: btn as HTMLElement,
        issue: 'Button without accessible label',
        severity: 'error',
        wcagCriterion: '4.1.2 Name, Role, Value',
      });
    }
  });
  
  // Check for form inputs without labels
  container.querySelectorAll('input:not([type="hidden"])').forEach(input => {
    const inputEl = input as HTMLInputElement;
    const hasLabel = container.querySelector(`label[for="${inputEl.id}"]`);
    const hasAriaLabel = inputEl.hasAttribute('aria-label') || inputEl.hasAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel) {
      issues.push({
        element: inputEl,
        issue: 'Form input without label',
        severity: 'error',
        wcagCriterion: '3.3.2 Labels or Instructions',
      });
    }
  });
  
  // Check for heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level - lastLevel > 1) {
      issues.push({
        element: heading as HTMLElement,
        issue: `Heading level ${level} skips level ${lastLevel + 1}`,
        severity: 'warning',
        wcagCriterion: '1.3.1 Info and Relationships',
      });
    }
    lastLevel = level;
  });
  
  return issues;
}
