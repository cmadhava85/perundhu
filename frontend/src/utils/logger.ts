/**
 * Centralized logging utility
 * Replaces direct console.log usage throughout the application
 * Provides structured logging with different log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
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
     
    console.warn(`[${LogLevel.WARN}] ${message}`, context || '');
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
     
    console.error(`[${LogLevel.ERROR}] ${message}`, error, context || '');
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, also log to console for debugging
    if (this.isDevelopment && (level === LogLevel.DEBUG || level === LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${message}`, context || '');
    }

    // Here you can add additional logging targets:
    // - Send to analytics service
    // - Store in local storage
    // - Send to error tracking service (e.g., Sentry)
    this.sendToLogService(logEntry);
  }

  /**
   * Send logs to external service (stub for future implementation)
   */
  private sendToLogService(logEntry: Record<string, unknown>): void {
    // TODO: Implement sending to logging service
    // For now, we just store in sessionStorage in development
    if (this.isDevelopment) {
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
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
