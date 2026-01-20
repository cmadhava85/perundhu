import React, { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { StructuredLogger } from '../utils/structuredLogger';

/**
 * Application error interface with structured logging support
 */
export interface AppError {
  id: string;
  message: string;
  code: string;
  status?: number;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  traceId?: string;
  details?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Error context type definition
 */
interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  getErrorsByType: (severity: AppError['severity']) => AppError[];
  lastError: AppError | null;
}

/**
 * Create the error context
 */
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

/**
 * Props for ErrorProvider component
 */
interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  autoRemoveDelay?: number;
}

/**
 * Error Provider component that manages application-wide error state
 * Provides centralized error handling, logging, and display management
 * 
 * @example
 * ```tsx
 * <ErrorProvider maxErrors={10} autoRemoveDelay={5000}>
 *   <App />
 * </ErrorProvider>
 * ```
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxErrors = 10,
  autoRemoveDelay = 5000
}) => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [lastError, setLastError] = useState<AppError | null>(null);

  /**
   * Remove a specific error by ID
   */
  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  }, []);

  /**
   * Add a new error to the error state and log it
   */
  const addError = useCallback(
    (errorData: Omit<AppError, 'id' | 'timestamp'>) => {
      const appError: AppError = {
        ...errorData,
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      // Log error based on severity
      const logContext = {
        errorId: appError.id,
        code: appError.code,
        status: appError.status,
        severity: appError.severity,
        traceId: appError.traceId,
        ...appError.context
      };

      switch (appError.severity) {
        case 'critical':
          StructuredLogger.error(appError.message, logContext);
          break;
        case 'error':
          StructuredLogger.error(appError.message, logContext);
          break;
        case 'warning':
          StructuredLogger.warn(appError.message, logContext);
          break;
        case 'info':
          StructuredLogger.info(appError.message, logContext);
          break;
      }

      // Update error state
      setErrors(prev => {
        const updated = [appError, ...prev];
        // Keep only the most recent errors (limited to maxErrors)
        return updated.slice(0, maxErrors);
      });

      setLastError(appError);

      // Auto-remove non-critical errors after delay
      if (appError.severity !== 'critical' && appError.severity !== 'error') {
        setTimeout(() => {
          removeError(appError.id);
        }, autoRemoveDelay);
      }
    },
    [maxErrors, autoRemoveDelay, removeError]
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
    setLastError(null);
  }, []);

  /**
   * Get errors filtered by severity level
   */
  const getErrorsByType = useCallback(
    (severity: AppError['severity']): AppError[] => {
      return errors.filter(err => err.severity === severity);
    },
    [errors]
  );

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    getErrorsByType,
    lastError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Hook to use error context - throws error if used outside ErrorProvider
 */
export const useErrors = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrors must be used within ErrorProvider');
  }
  return context;
};

/**
 * Hook for adding errors with a more convenient API
 */
export const useAddError = () => {
  const { addError } = useErrors();

  return useCallback(
    (
      message: string,
      code: string = 'UNKNOWN_ERROR',
      options: Partial<Omit<AppError, 'id' | 'timestamp' | 'message' | 'code'>> = {}
    ) => {
      addError({
        message,
        code,
        severity: options.severity || 'error',
        status: options.status,
        traceId: options.traceId,
        details: options.details,
        context: options.context
      });
    },
    [addError]
  );
};

/**
 * Hook for removing errors
 */
export const useRemoveError = () => {
  const { removeError } = useErrors();
  return removeError;
};

/**
 * Hook for getting errors of a specific severity
 */
export const useErrorsByType = (severity: AppError['severity']) => {
  const { getErrorsByType } = useErrors();
  return getErrorsByType(severity);
};

/**
 * Hook for getting the last error
 */
export const useLastError = () => {
  const { lastError } = useErrors();
  return lastError;
};

export default ErrorProvider;
