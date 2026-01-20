/**
 * Structured Logger - JSON-formatted logging for production debugging
 * Outputs logs in structured JSON format suitable for:
 * - Cloud logging aggregation (Google Cloud Logging, CloudWatch, etc.)
 * - Machine parsing and analysis
 * - Distributed tracing with trace IDs
 */

import { traceContext } from './traceId';
import logger, { LogCategory } from './logger';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry format (JSON)
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  sessionId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  stack?: string;
  environment?: string;
  version?: string;
}

/**
 * Structured Logger class for JSON-formatted logging
 * Provides consistent structured logging across the application
 */
export class StructuredLogger {
  private static sessionId: string = StructuredLogger.getOrCreateSessionId();
  private static environment: string = import.meta.env.MODE || 'development';
  private static version: string = import.meta.env.VITE_APP_VERSION || 'unknown';

  /**
   * Get or create session ID
   */
  private static getOrCreateSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('structuredLoggerSessionId');
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('structuredLoggerSessionId', sessionId);
      }
      return sessionId;
    } catch {
      // Fallback if sessionStorage is unavailable
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Format a log entry as JSON
   */
  private static formatLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const traceId = traceContext.getTraceId();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId,
      sessionId: this.sessionId,
      environment: this.environment,
      version: this.version,
      context
    };

    if (error) {
      entry.stack = error.stack;
    }

    return entry;
  }

  /**
   * Output log entry to console as JSON (for cloud logging agents to pick up)
   */
  private static output(entry: LogEntry): void {
    const jsonString = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(jsonString);
        break;
      case 'warn':
        console.warn(jsonString);
        break;
      case 'debug':
        if (import.meta.env.DEV) {
          console.log(jsonString);
        }
        break;
      case 'info':
      default:
        console.log(jsonString);
        break;
    }
  }

  /**
   * Log a debug message
   * Only appears in development environment
   */
  static debug(message: string, context?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      const entry = this.formatLogEntry('debug', message, context);
      this.output(entry);

      // Also use the regular logger for development convenience
      logger.debug(message, {
        category: LogCategory.GENERAL,
        ...context
      });
    }
  }

  /**
   * Log an info message
   * Used for significant application events
   */
  static info(message: string, context?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('info', message, context);
    this.output(entry);

    // Also use the regular logger for consistency
    logger.info(message, {
      category: LogCategory.GENERAL,
      ...context
    });
  }

  /**
   * Log a warning message
   * Used for potentially problematic situations
   */
  static warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.formatLogEntry('warn', message, context);
    this.output(entry);

    // Also use the regular logger
    logger.warn(message, {
      category: LogCategory.GENERAL,
      ...context
    });
  }

  /**
   * Log an error message with optional error object
   * Used for error conditions and exceptions
   */
  static error(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.formatLogEntry('error', message, context, error);
    this.output(entry);

    // Also use the regular logger
    logger.error(message, error, {
      category: LogCategory.GENERAL,
      ...context
    });
  }

  /**
   * Log an API call with request and response details
   */
  static logApiCall(
    method: string,
    endpoint: string,
    context?: {
      status?: number;
      duration?: number;
      success?: boolean;
      error?: string;
      requestSize?: number;
      responseSize?: number;
      retryCount?: number;
      [key: string]: unknown;
    }
  ): void {
    const message = `${method} ${endpoint}`;
    const fullContext = {
      type: 'api_call',
      method,
      endpoint,
      ...context
    };

    if (context?.error) {
      this.error(message, fullContext);
    } else if (!context?.success) {
      this.warn(message, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  /**
   * Log a user action
   */
  static logUserAction(
    action: string,
    context?: {
      component?: string;
      userId?: string;
      timestamp?: number;
      [key: string]: unknown;
    }
  ): void {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      action,
      ...context
    });
  }

  /**
   * Log a performance metric
   */
  static logPerformance(
    operation: string,
    duration: number,
    context?: {
      component?: string;
      threshold?: number;
      [key: string]: unknown;
    }
  ): void {
    const fullContext = {
      type: 'performance',
      operation,
      duration,
      ...context
    };

    const threshold = context?.threshold || 3000;
    if (duration > threshold) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, fullContext);
    } else {
      this.info(`Performance: ${operation} took ${duration}ms`, fullContext);
    }
  }

  /**
   * Log a search operation
   */
  static logSearch(
    query: string,
    resultsCount: number,
    context?: {
      duration?: number;
      language?: string;
      [key: string]: unknown;
    }
  ): void {
    this.info('Search performed', {
      type: 'search',
      query: query.substring(0, 100), // Truncate long queries
      resultsCount,
      ...context
    });
  }

  /**
   * Log a contribution (route, image, etc.)
   */
  static logContribution(
    type: 'route' | 'image' | 'voice' | 'stops',
    action: string,
    context?: {
      success?: boolean;
      error?: string;
      [key: string]: unknown;
    }
  ): void {
    const message = `Contribution: ${action}`;
    const fullContext = {
      type: 'contribution',
      contributionType: type,
      action,
      ...context
    };

    if (context?.success === false) {
      this.error(message, fullContext);
    } else if (context?.success) {
      this.info(message, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  /**
   * Create a structured error from an Error object
   */
  static createErrorContext(error: Error): Record<string, unknown> {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      type: 'error'
    };
  }

  /**
   * Get the current trace ID for manual use
   */
  static getTraceId(): string {
    return traceContext.getTraceId();
  }

  /**
   * Get the session ID
   */
  static getSessionId(): string {
    return this.sessionId;
  }
}

export default StructuredLogger;
