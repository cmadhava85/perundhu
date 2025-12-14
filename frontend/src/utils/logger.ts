/**
 * Centralized logging utility with metrics tracking
 * Replaces direct console.log usage throughout the application
 * Provides structured logging with different log levels and performance tracking
 */

import { traceContext } from './traceId';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  API = 'API',
  UI = 'UI',
  AUTH = 'AUTH',
  SEARCH = 'SEARCH',
  CONTRIBUTION = 'CONTRIBUTION',
  TRACKING = 'TRACKING',
  PERFORMANCE = 'PERFORMANCE',
  GEOCODING = 'GEOCODING',
  GENERAL = 'GENERAL',
}

interface LogContext {
  component?: string;
  action?: string;
  category?: LogCategory;
  duration?: number;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface PerformanceMetric {
  name: string;
  startTime: number;
  category: LogCategory;
}

interface ApiMetrics {
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  totalDuration: number;
  slowCalls: number; // > 3 seconds
}

class Logger {
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  private readonly performanceMarks: Map<string, PerformanceMetric> = new Map();
  private readonly apiMetrics: Map<string, ApiMetrics> = new Map();
  private readonly sessionId: string;
  private logBuffer: Array<Record<string, unknown>> = [];
  private readonly MAX_BUFFER_SIZE = 50;
  private readonly SLOW_API_THRESHOLD = 3000; // 3 seconds

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging with optional error object
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    let errorDetails: Record<string, unknown> = {};
    
    if (error instanceof Error) {
      errorDetails = { 
        errorName: error.name, 
        errorMessage: error.message, 
        stack: error.stack 
      };
    } else if (error !== undefined) {
      let errorValue: string;
      if (typeof error === 'object' && error !== null) {
        try {
          errorValue = JSON.stringify(error);
        } catch {
          errorValue = '[Unserializable object]';
        }
      } else if (typeof error === 'string') {
        errorValue = error;
      } else if (typeof error === 'number' || typeof error === 'boolean') {
        errorValue = String(error);
      } else {
        errorValue = '[Unknown error type]';
      }
      errorDetails = { errorDetails: errorValue };
    }
    
    this.log(LogLevel.ERROR, message, { ...context, ...errorDetails });
  }

  /**
   * Start a performance measurement
   */
  startPerformance(name: string, category: LogCategory = LogCategory.PERFORMANCE): void {
    this.performanceMarks.set(name, {
      name,
      startTime: performance.now(),
      category,
    });
  }

  /**
   * End a performance measurement and log the result
   */
  endPerformance(name: string, context?: LogContext): number {
    const mark = this.performanceMarks.get(name);
    if (!mark) {
      this.warn(`Performance mark '${name}' not found`);
      return 0;
    }

    const duration = Math.round(performance.now() - mark.startTime);
    this.performanceMarks.delete(name);

    this.info(`Performance: ${name}`, {
      ...context,
      category: mark.category,
      duration,
      action: 'performance_measurement',
    });

    return duration;
  }

  /**
   * Log an API call with automatic metrics tracking
   */
  logApiCall(
    endpoint: string,
    method: string,
    options: {
      success: boolean;
      statusCode?: number;
      duration?: number;
      error?: unknown;
      responseSize?: number;
    }
  ): void {
    const { success, statusCode, duration = 0, error, responseSize } = options;
    
    // Update metrics
    const metricsKey = `${method}:${endpoint}`;
    const metrics = this.apiMetrics.get(metricsKey) || {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      totalDuration: 0,
      slowCalls: 0,
    };
    
    metrics.totalCalls++;
    metrics.totalDuration += duration;
    
    if (success) {
      metrics.successCalls++;
    } else {
      metrics.errorCalls++;
    }
    
    if (duration > this.SLOW_API_THRESHOLD) {
      metrics.slowCalls++;
    }
    
    this.apiMetrics.set(metricsKey, metrics);

    // Format error message
    const formatError = (err: unknown): string => {
      if (err instanceof Error) {
        return err.message;
      }
      if (typeof err === 'object' && err !== null) {
        return JSON.stringify(err);
      }
      return String(err);
    };

    // Log the call
    let level: LogLevel;
    if (!success) {
      level = LogLevel.ERROR;
    } else if (duration > this.SLOW_API_THRESHOLD) {
      level = LogLevel.WARN;
    } else {
      level = LogLevel.INFO;
    }
    const message = success
      ? `API ${method} ${endpoint} completed`
      : `API ${method} ${endpoint} failed`;

    this.log(level, message, {
      category: LogCategory.API,
      action: 'api_call',
      endpoint,
      method,
      statusCode,
      duration,
      success,
      responseSize,
      ...(error === undefined ? {} : { error: formatError(error) }),
    });
  }

  /**
   * Log a user action for analytics
   */
  logUserAction(action: string, context?: Omit<LogContext, 'action'>): void {
    const category = (context?.category as LogCategory | undefined) ?? LogCategory.UI;
    this.info(`User action: ${action}`, {
      ...context,
      action,
      category,
    });
  }

  /**
   * Log a search operation
   */
  logSearch(query: string, resultsCount: number, duration?: number): void {
    this.info('Search performed', {
      category: LogCategory.SEARCH,
      action: 'search',
      query: query.substring(0, 100), // Truncate long queries
      resultsCount,
      duration,
    });
  }

  /**
   * Get API metrics summary
   */
  getApiMetrics(): Record<string, ApiMetrics & { avgDuration: number; errorRate: number }> {
    const result: Record<string, ApiMetrics & { avgDuration: number; errorRate: number }> = {};
    
    this.apiMetrics.forEach((metrics, key) => {
      result[key] = {
        ...metrics,
        avgDuration: metrics.totalCalls > 0 ? Math.round(metrics.totalDuration / metrics.totalCalls) : 0,
        errorRate: metrics.totalCalls > 0 ? (metrics.errorCalls / metrics.totalCalls) * 100 : 0,
      };
    });
    
    return result;
  }

  /**
   * Get session logs for debugging
   */
  getSessionLogs(): Array<Record<string, unknown>> {
    return [...this.logBuffer];
  }

  /**
   * Clear session logs
   */
  clearSessionLogs(): void {
    this.logBuffer = [];
    try {
      sessionStorage.removeItem('app_logs');
    } catch {
      // Silently fail
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    
    // Get traceId from context - handle circular dependency by lazy import
    let traceId: string | undefined;
    let sessionId: string | undefined;
    try {
      traceId = traceContext.getTraceId();
      sessionId = traceContext.getSessionId();
    } catch {
      // traceContext may not be available yet during initialization
    }
    
    const logEntry = {
      timestamp,
      level,
      message,
      traceId,
      sessionId: sessionId || this.sessionId,
      url: globalThis.window === undefined ? undefined : globalThis.window.location.pathname,
      ...context,
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      const categoryTag = context?.category ? `[${context.category}]` : '';
      const traceTag = traceId ? `[${traceId}]` : '';
      const prefix = `[${level}]${traceTag}${categoryTag}`;
      consoleMethod(`${prefix} ${message}`, context || '');
    }

    // In production, only log warnings and errors to console
    if (this.isProduction && (level === LogLevel.WARN || level === LogLevel.ERROR)) {
      const consoleMethod = level === LogLevel.ERROR ? console.error : console.warn;
      const traceTag = traceId ? `[${traceId}]` : '';
      consoleMethod(`[${level}]${traceTag} ${message}`);
    }

    // Store in session storage (development only)
    this.persistLog(logEntry);
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.DEBUG:
      case LogLevel.INFO:
      default:
        // eslint-disable-next-line no-console
        return console.log;
    }
  }

  /**
   * Persist logs to session storage
   */
  private persistLog(logEntry: Record<string, unknown>): void {
    if (!this.isDevelopment) return;
    
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]') as unknown[];
      logs.push(logEntry);
      // Keep only last 100 logs
      const recentLogs = logs.slice(-100);
      sessionStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: unknown, context?: LogContext) => logger.error(message, error, context);
export const logApiCall = logger.logApiCall.bind(logger);
export const logUserAction = logger.logUserAction.bind(logger);
export const logSearch = logger.logSearch.bind(logger);
export const startPerformance = logger.startPerformance.bind(logger);
export const endPerformance = logger.endPerformance.bind(logger);

// Export for dashboard/debugging
export const getApiMetrics = () => logger.getApiMetrics();
export const getSessionLogs = () => logger.getSessionLogs();
