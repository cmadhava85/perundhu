/**
 * Security Headers and Protection Utilities
 * 
 * Implements client-side security measures to prevent scraping
 */

/**
 * Disable right-click context menu
 */
export function disableContextMenu(): void {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    return false;
  });
}

/**
 * Disable text selection
 */
export function disableTextSelection(): void {
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  (document.body.style as CSSStyleDeclaration & { msUserSelect?: string }).msUserSelect = 'none';
  (document.body.style as CSSStyleDeclaration & { MozUserSelect?: string }).MozUserSelect = 'none';

  document.addEventListener('selectstart', (event) => {
    event.preventDefault();
    return false;
  });
}

/**
 * Prevent DevTools keyboard shortcuts in production only.
 * Does not block shortcuts in form fields to avoid disrupting user input.
 */
export function disableKeyboardShortcuts(): void {
  // Only applies in production — never block developer workflow in dev/test
  try {
    const env = (import.meta as { env?: { MODE?: string } }).env;
    if (env?.MODE !== 'production') return;
  } catch {
    return; // Not a Vite environment; skip
  }

  document.addEventListener('keydown', (event) => {
    // Never interfere when the user is typing in a form field
    const target = event.target as HTMLElement;
    const isFormField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true';
    if (isFormField) return;

    let shouldBlock = false;

    // F12 — DevTools toggle
    if (event.key === 'F12') {
      shouldBlock = true;
    }

    // Ctrl/Cmd+Shift+I — Elements inspector
    // Ctrl/Cmd+Shift+J — Console
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      if (['I', 'J'].includes(event.key.toUpperCase())) {
        shouldBlock = true;
      }
    }

    if (shouldBlock) {
      event.preventDefault();
    }
  });
}

/**
 * Disable drag and drop
 */
export function disableDragDrop(): void {
  document.addEventListener('dragstart', (event) => {
    event.preventDefault();
    return false;
  });

  document.addEventListener('dragover', (event) => {
    event.preventDefault();
    return false;
  });

  document.addEventListener('drop', (event) => {
    event.preventDefault();
    return false;
  });
}

/**
 * Prevent iframe embedding
 */
export function preventIframeEmbedding(): void {
  if (window.self !== window.top) {
    window.top!.location.href = window.self.location.href;
  }
}

/**
 * Detect browser console
 */
export function detectConsoleOpening(): void {
  let isOpen = false;

  const check = () => {
    const startTime = performance.now();
    // Note: debugger removed for production - console detection disabled
    const endTime = performance.now();

    if (endTime - startTime > 100) {
      if (!isOpen) {
        isOpen = true;
        // eslint-disable-next-line no-console
        console.log(
          '%c⚠️ Security Warning',
          'font-size: 16px; color: red; font-weight: bold;'
        );
        // eslint-disable-next-line no-console
        console.log(
          '%cThis browser console is for authorized use only.',
          'font-size: 14px; color: orange;'
        );
        // eslint-disable-next-line no-console
        console.log(
          '%cUnauthorized access attempts are logged and monitored.',
          'font-size: 12px; color: red;'
        );

        // Log to backend
        logSecurityEvent('CONSOLE_OPENED');
      }
    }

    setTimeout(check, 500);
  };

  check();
}

/**
 * Obfuscate API endpoints
 */
export function getApiEndpoint(endpoint: string): string {
  // Map readable names to obfuscated endpoints
  const endpointMap: Record<string, string> = {
    buses: '/api/resources',
    routes: '/api/data',
    schedules: '/api/info',
    search: '/api/query',
    tracking: '/api/stream',
  };

  return endpointMap[endpoint] || `/api/${endpoint}`;
}

/**
 * Add random delays to requests to prevent pattern detection
 */
export function getRandomDelay(): number {
  // Random delay between 100-500ms
  return Math.random() * 400 + 100;
}

/**
 * Log security event to backend
 */
export async function logSecurityEvent(eventType: string, details?: Record<string, string | number | boolean>): Promise<void> {
  try {
    await fetch('/api/security/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        details,
      }),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Validate request origins
 */
export function validateOrigin(): boolean {
  const allowedOrigins = [
    'https://perundhu.in',
    'https://www.perundhu.in',
    'https://perundhu.app',
    'https://www.perundhu.app',
    'http://localhost:5173', // Dev
    'http://localhost:4173', // Preview
  ];

  return allowedOrigins.includes(window.location.origin);
}

/**
 * Initialize all security protections
 */
export function initializeSecurity(options: {
  disableContextMenu?: boolean;
  disableTextSelection?: boolean;
  disableKeyboardShortcuts?: boolean;
  disableDragDrop?: boolean;
  preventIframe?: boolean;
  detectConsole?: boolean;
} = {}): void {
  const {
    disableContextMenu: contextMenu = false,
    disableTextSelection: textSelection = false,
    disableKeyboardShortcuts: keyboardShortcuts = false,
    disableDragDrop: dragDrop = false,
    preventIframe: iframe = true,
    detectConsole: detectConsoleOpt = true,
  } = options;

  if (contextMenu) disableContextMenu();
  if (textSelection) disableTextSelection();
  if (keyboardShortcuts) disableKeyboardShortcuts();
  if (dragDrop) disableDragDrop();
  if (iframe) preventIframeEmbedding();
  if (detectConsoleOpt) detectConsoleOpening();

  if (!validateOrigin()) {
    if (typeof console.warn === 'function') {
      console.warn('⚠️ Invalid origin detected');
    }
    logSecurityEvent('INVALID_ORIGIN');
  }
}
