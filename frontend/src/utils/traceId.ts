/**
 * TraceId utility for distributed tracing across frontend and backend
 * 
 * Generates unique trace IDs that are sent with every API request to the backend.
 * The backend will use the same traceId in its logs, enabling end-to-end request tracking.
 * 
 * TraceId format: {timestamp}-{randomHex}
 * Example: 1734183224445-a1b2c3d4
 */

// Storage key for the current page session trace
const TRACE_STORAGE_KEY = 'perundhu_trace_session';

interface TraceSession {
  sessionId: string;
  createdAt: number;
  requestCount: number;
}

/**
 * Generate a random hex string
 */
const generateRandomHex = (length: number = 8): string => {
  const array = new Uint8Array(length / 2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a unique trace ID
 * Format: {timestamp}-{randomHex}
 */
export const generateTraceId = (): string => {
  const timestamp = Date.now();
  const randomPart = generateRandomHex(8);
  return `${timestamp}-${randomPart}`;
};

/**
 * Get or create a session trace ID
 * This ID persists for the browser session and can be used to correlate all requests
 */
export const getSessionTraceId = (): string => {
  try {
    const stored = sessionStorage.getItem(TRACE_STORAGE_KEY);
    if (stored) {
      const session: TraceSession = JSON.parse(stored);
      // Session is valid for 24 hours
      if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
        return session.sessionId;
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Create new session
  const sessionId = generateTraceId();
  try {
    const session: TraceSession = {
      sessionId,
      createdAt: Date.now(),
      requestCount: 0,
    };
    sessionStorage.setItem(TRACE_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
  
  return sessionId;
};

/**
 * Increment request count for the current session
 * Returns the updated count
 */
export const incrementRequestCount = (): number => {
  try {
    const stored = sessionStorage.getItem(TRACE_STORAGE_KEY);
    if (stored) {
      const session: TraceSession = JSON.parse(stored);
      session.requestCount++;
      sessionStorage.setItem(TRACE_STORAGE_KEY, JSON.stringify(session));
      return session.requestCount;
    }
  } catch {
    // Ignore storage errors
  }
  return 0;
};

/**
 * TraceContext class for managing trace state throughout a request lifecycle
 */
class TraceContext {
  private currentTraceId: string | null = null;
  private userId: string | null = null;
  private operation: string | null = null;

  /**
   * Get current trace ID or generate a new one
   */
  getTraceId(): string {
    if (!this.currentTraceId) {
      this.currentTraceId = generateTraceId();
    }
    return this.currentTraceId;
  }

  /**
   * Set current trace ID (e.g., from a parent request or page load)
   */
  setTraceId(traceId: string): void {
    this.currentTraceId = traceId;
  }

  /**
   * Generate and set a new trace ID
   */
  newTraceId(): string {
    this.currentTraceId = generateTraceId();
    return this.currentTraceId;
  }

  /**
   * Clear current trace ID (start fresh for next operation)
   */
  clearTraceId(): void {
    this.currentTraceId = null;
  }

  /**
   * Set user ID for trace context
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get user ID from trace context
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set current operation name
   */
  setOperation(operation: string): void {
    this.operation = operation;
  }

  /**
   * Get current operation name
   */
  getOperation(): string | null {
    return this.operation;
  }

  /**
   * Get session trace ID
   */
  getSessionId(): string {
    return getSessionTraceId();
  }

  /**
   * Get full context for logging
   */
  getContext(): { traceId: string; sessionId: string; userId?: string; operation?: string } {
    return {
      traceId: this.getTraceId(),
      sessionId: this.getSessionId(),
      ...(this.userId && { userId: this.userId }),
      ...(this.operation && { operation: this.operation }),
    };
  }
}

// Export singleton instance
export const traceContext = new TraceContext();

// Header names used for distributed tracing
export const TRACE_HEADERS = {
  TRACE_ID: 'X-Trace-Id',
  REQUEST_ID: 'X-Request-Id',
  SESSION_ID: 'X-Session-Id',
} as const;

export default traceContext;
