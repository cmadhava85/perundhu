import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { traceContext, TRACE_HEADERS, incrementRequestCount } from '../utils/traceId';
import logger, { LogCategory } from '../utils/logger';

// Helper function to get environment variables that works in both Vite and Jest
const getEnv = (key: string, defaultValue: string = ''): string => {
  // For Jest environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  return defaultValue;
};

// Extend axios config to include metadata
interface RequestMetadata {
  startTime: number;
  traceId: string;
  endpoint: string;
  method: string;
}

// Store request metadata keyed by request URL + method
const requestMetadataMap = new Map<string, RequestMetadata>();

// Extended config type to include our custom property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __requestKey?: string;
}

// Error response data structure
interface ApiErrorResponse {
  message?: string;
  error?: string;
  traceId?: string;
  errorCode?: string;
  details?: unknown;
}

// Enhanced error type
interface EnhancedError extends Error {
  traceId?: string;
  errorCode?: string;
  status?: number;
  originalError?: AxiosError;
}

// Create API client for analytics services
export const apiClient = axios.create({
  baseURL: getEnv('VITE_ANALYTICS_API_URL', 'http://localhost:8081/api/v1'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Generate a unique key for tracking request metadata
 */
const getRequestKey = (config: InternalAxiosRequestConfig): string => {
  return `${config.method?.toUpperCase()}-${config.url}-${Date.now()}`;
};

// Add request interceptor for analytics requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate new traceId for this request
    const traceId = traceContext.newTraceId();
    const sessionId = traceContext.getSessionId();
    const requestCount = incrementRequestCount();
    
    // Add trace headers
    config.headers[TRACE_HEADERS.TRACE_ID] = traceId;
    config.headers[TRACE_HEADERS.SESSION_ID] = sessionId;
    config.headers['X-Request-Count'] = String(requestCount);
    
    // Store request metadata for response logging
    const requestKey = getRequestKey(config);
    const metadata: RequestMetadata = {
      startTime: Date.now(),
      traceId,
      endpoint: config.url || '',
      method: config.method?.toUpperCase() || 'GET'
    };
    requestMetadataMap.set(requestKey, metadata);
    
    // Store key in config for retrieval in response interceptor
    (config as ExtendedAxiosRequestConfig).__requestKey = requestKey;
    
    // Log request
    logger.info(`[${traceId}] → ${metadata.method} ${metadata.endpoint}`, {
      category: LogCategory.API,
      traceId,
      sessionId,
      requestCount
    });
    
    return config;
  },
  (error: AxiosError) => {
    const traceId = traceContext.getTraceId();
    logger.error(`[${traceId}] Request setup failed`, error, { 
      category: LogCategory.API,
      traceId
    });
    return Promise.reject(error);
  }
);

// Add response interceptor for analytics requests
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Get request metadata
    const requestKey = (response.config as ExtendedAxiosRequestConfig).__requestKey;
    const metadata = requestKey ? requestMetadataMap.get(requestKey) : undefined;
    
    if (metadata) {
      const duration = Date.now() - metadata.startTime;
      const serverTraceId = response.headers[TRACE_HEADERS.TRACE_ID.toLowerCase()] || 
                            response.headers['x-trace-id'];
      
      // Update trace context with server's traceId if different
      if (serverTraceId && serverTraceId !== metadata.traceId) {
        traceContext.setTraceId(serverTraceId);
      }
      
      // Log successful response
      if (duration > 3000) {
        // Slow request warning
        logger.warn(`[${metadata.traceId}][SLOW] ← ${metadata.method} ${metadata.endpoint}`, {
          category: LogCategory.API,
          traceId: metadata.traceId,
          serverTraceId,
          status: response.status,
          duration
        });
      } else {
        logger.info(`[${metadata.traceId}] ← ${metadata.method} ${metadata.endpoint}`, {
          category: LogCategory.API,
          traceId: metadata.traceId,
          serverTraceId,
          status: response.status,
          duration
        });
      }
      
      // Clean up metadata
      if (requestKey) requestMetadataMap.delete(requestKey);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Get request metadata
    const requestKey = (error.config as ExtendedAxiosRequestConfig | undefined)?.__requestKey;
    const metadata = requestKey ? requestMetadataMap.get(requestKey) : undefined;
    const traceId = metadata?.traceId || traceContext.getTraceId();
    
    if (metadata) {
      const duration = Date.now() - metadata.startTime;
      
      if (!error.response) {
        // Network error
        logger.error(`[${traceId}][NETWORK] ✗ ${metadata.method} ${metadata.endpoint}`, 'Network error or service unavailable', {
          category: LogCategory.API,
          traceId,
          duration
        });
        if (requestKey) requestMetadataMap.delete(requestKey);
        return Promise.reject(new Error(`[${traceId}] Network error or service unavailable`));
      }
      
      // Get traceId from error response if available
      const errorData = error.response.data as ApiErrorResponse;
      const responseTraceId = error.response.headers[TRACE_HEADERS.TRACE_ID.toLowerCase()] ||
                              error.response.headers['x-trace-id'] ||
                              errorData?.traceId;
      
      const errorMessage = errorData?.message || errorData?.error || error.message;
      const errorCode = errorData?.errorCode || `HTTP_${error.response.status}`;
      
      // Log error with full context
      logger.error(`[${traceId}] ✗ ${metadata.method} ${metadata.endpoint}`, errorMessage, {
        category: LogCategory.API,
        traceId,
        serverTraceId: responseTraceId,
        status: error.response.status,
        errorCode,
        duration,
        details: errorData?.details
      });
      
      // Enhance error with traceId for user display
      const enhancedError = new Error(`[${responseTraceId || traceId}] ${errorMessage}`) as EnhancedError;
      enhancedError.traceId = responseTraceId || traceId;
      enhancedError.errorCode = errorCode;
      enhancedError.status = error.response.status;
      enhancedError.originalError = error;
      
      if (requestKey) requestMetadataMap.delete(requestKey);
      return Promise.reject(enhancedError);
    }
    
    // Fallback error handling
    if (!error.response) {
      logger.error(`[${traceId}][NETWORK] Network error`, 'Network error or service unavailable', { category: LogCategory.API, traceId });
      return Promise.reject(new Error(`[${traceId}] Network error or service unavailable`));
    }
    
    return Promise.reject(error);
  }
);

/**
 * Get current trace ID from context
 */
export const getCurrentTraceId = (): string => {
  return traceContext.getTraceId();
};

/**
 * Get session trace ID
 */
export const getSessionTraceId = (): string => {
  return traceContext.getSessionId();
};