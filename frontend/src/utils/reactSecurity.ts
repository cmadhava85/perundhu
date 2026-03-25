/**
 * React Security Utilities
 * Protects against common frontend security vulnerabilities:
 * - Console manipulation
 * - DevTools state tampering
 * - XSS attacks
 * - Prototype pollution
 * - Script injection
 */

// Check if in production mode
const isProduction = (): boolean => {
  try {
    return import.meta.env.MODE === 'production' || import.meta.env.PROD === true;
  } catch {
    return false;
  }
};

/**
 * Disable console methods in production to prevent sensitive data leakage
 * and make debugging harder for attackers
 */
export const disableConsoleInProduction = (): void => {
  if (!isProduction()) return;

  const noop = () => {};
  const consoleMethods = ['log', 'debug', 'info', 'warn', 'error', 'trace', 'dir', 'table'] as const;
  
  consoleMethods.forEach((method) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as unknown as Record<string, any>)[method] = noop;
  });

  // Freeze console to prevent re-enabling
  Object.freeze(console);
};

/**
 * Detect and respond to DevTools being opened
 * This helps prevent state manipulation through browser DevTools
 */
export const detectDevTools = (callback?: () => void): void => {
  if (!isProduction()) return;

  const threshold = 160;
  let isOpen = false;

  const check = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!isOpen) {
        isOpen = true;
        callback?.();
      }
    } else {
      isOpen = false;
    }
  };

  setInterval(check, 1000);
};

/**
 * Prevent right-click context menu in production
 * Makes it harder to inspect elements
 */
export const preventContextMenu = (): void => {
  if (!isProduction()) return;

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
};

/**
 * Prevent keyboard shortcuts for DevTools
 */
export const preventDevToolsShortcuts = (): void => {
  if (!isProduction()) return;

  document.addEventListener('keydown', (e) => {
    // Don't block anything if user is typing in a form field
    const target = e.target as HTMLElement;
    const isFormField = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'SELECT' || 
      target.contentEditable === 'true' ||
      target.closest('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], .form-input, .form-select, .form-textarea');
    
    // Only prevent shortcuts when NOT in form fields
    if (isFormField) {
      return;
    }

    // F12 - DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I or Cmd+Option+I - DevTools
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+J or Cmd+Option+J - Console
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U or Cmd+U - View Source
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    return true;
  });
};

/**
 * Sanitize HTML string to prevent XSS attacks
 * Use this before rendering any user-provided content
 */
export const sanitizeHTML = (html: string): string => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

/**
 * Sanitize user input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  let sanitized = input;
  sanitized = sanitized.replaceAll('<', '');
  sanitized = sanitized.replaceAll('>', '');
  sanitized = sanitized.replaceAll(/javascript:/gi, '');
  sanitized = sanitized.replaceAll(/on\w+=/gi, '');
  sanitized = sanitized.replaceAll(/data:/gi, '');
  sanitized = sanitized.replaceAll(/vbscript:/gi, '');
  return sanitized.trim();
};

/**
 * Validate and sanitize URL to prevent open redirect attacks
 */
export const sanitizeURL = (url: string): string | null => {
  try {
    const parsed = new URL(url, globalThis.location.origin);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Check for javascript injection in URL
    if (parsed.href.toLowerCase().includes('javascript:')) {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * Create a frozen, tamper-proof object
 * Use for sensitive data structures
 */
export const createSecureObject = <T extends object>(obj: T): Readonly<T> => {
  return Object.freeze({ ...obj });
};

/**
 * Protect against prototype pollution attacks
 * NOTE: We intentionally do NOT freeze built-in prototypes (Object.prototype,
 * String.prototype, etc.) because doing so breaks third-party scripts such as
 * Google AdSense ("Cannot define property Symbol(replaceAll), object is not
 * extensible"). Prototype pollution is better mitigated via CSP and server-side
 * validation.
 */
export const protectPrototypes = (): void => {
  // No-op: prototype freezing disabled to avoid breaking third-party scripts.
};

/**
 * Validate that a value hasn't been tampered with using checksums
 */
export const createIntegrityCheck = <T>(value: T): { value: T; checksum: string } => {
  const serialized = JSON.stringify(value);
  const checksum = btoa(serialized).slice(0, 16);
  return { value, checksum };
};

export const validateIntegrity = <T>(data: { value: T; checksum: string }): boolean => {
  const serialized = JSON.stringify(data.value);
  const expectedChecksum = btoa(serialized).slice(0, 16);
  return data.checksum === expectedChecksum;
};

/**
 * Secure state wrapper that detects tampering
 */
export class SecureState<T> {
  private _value: T;
  private _checksum: string;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._checksum = this.computeChecksum(initialValue);
  }

  private computeChecksum(value: T): string {
    return btoa(JSON.stringify(value)).slice(0, 16);
  }

  get value(): T {
    // Verify integrity before returning
    if (this._checksum !== this.computeChecksum(this._value)) {
      console.error('State tampering detected!');
      throw new Error('Security violation: State has been tampered with');
    }
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    this._checksum = this.computeChecksum(newValue);
  }

  isValid(): boolean {
    return this._checksum === this.computeChecksum(this._value);
  }
}

/**
 * Rate limiter to prevent abuse
 */
export class RateLimiter {
  private readonly attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy violation handler
 */
export const setupCSPViolationHandler = (): void => {
  document.addEventListener('securitypolicyviolation', (e) => {
    // Log CSP violations for monitoring
    const violation = {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
    };
    
    // In production, send to monitoring service
    if (isProduction()) {
      // Could send to analytics/monitoring endpoint
      console.warn('CSP Violation:', violation);
    }
  });
};

/**
 * Initialize all security measures
 * Call this in your app's entry point
 */
export const initializeSecurity = (): void => {
  disableConsoleInProduction();
  preventContextMenu();
  preventDevToolsShortcuts();
  protectPrototypes();
  setupCSPViolationHandler();
  
  // Optional: Detect DevTools
  detectDevTools(() => {
    // Handle DevTools detection (e.g., show warning, log event)
  });
};

/**
 * Validate form data against common attack patterns
 */
export const validateFormData = (data: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check for SQL injection patterns
      if (/('|--|;|\/\*|\*\/|xp_|sp_|exec\s|execute\s)/i.test(value)) {
        errors.push(`Suspicious pattern detected in ${key}`);
      }
      
      // Check for XSS patterns
      if (/<script|javascript:|on\w+=/i.test(value)) {
        errors.push(`Potential XSS detected in ${key}`);
      }
      
      // Check for path traversal
      if (/\.\.[/\\]/.test(value)) {
        errors.push(`Path traversal attempt detected in ${key}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

export default {
  initializeSecurity,
  sanitizeHTML,
  sanitizeInput,
  sanitizeURL,
  createSecureObject,
  SecureState,
  RateLimiter,
  validateFormData,
};
