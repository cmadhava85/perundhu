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
  (document.body.style as any).msUserSelect = 'none';
  (document.body.style as any).MozUserSelect = 'none';

  document.addEventListener('selectstart', (event) => {
    event.preventDefault();
    return false;
  });
}

/**
 * Prevent keyboard shortcuts used for inspection
 */
export function disableKeyboardShortcuts(): void {
  const blockedKeys = ['F12', 'F11', 'F3'];
  const blockedCombinations = ['Ctrl+Shift+I', 'Ctrl+Shift+C', 'Ctrl+Shift+J', 'Ctrl+I'];

  document.addEventListener('keydown', (event) => {
    let shouldBlock = false;
    
    // Block F12 and other function keys
    if (blockedKeys.includes(event.key)) {
      shouldBlock = true;
    }

    // Block Ctrl/Cmd combinations
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      if (['I', 'C', 'J'].includes(event.key.toUpperCase())) {
        shouldBlock = true;
      }
    }

    // Block Ctrl+I for inspect
    if ((event.ctrlKey || event.metaKey) && event.key === 'I') {
      shouldBlock = true;
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
    debugger;
    const endTime = performance.now();

    if (endTime - startTime > 100) {
      if (!isOpen) {
        isOpen = true;
        console.log(
          '%c⚠️ Security Warning',
          'font-size: 16px; color: red; font-weight: bold;'
        );
        console.log(
          '%cThis browser console is for authorized use only.',
          'font-size: 14px; color: orange;'
        );
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
export async function logSecurityEvent(eventType: string, details?: Record<string, any>): Promise<void> {
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
