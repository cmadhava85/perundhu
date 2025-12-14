import axios from 'axios';
import { traceContext, TRACE_HEADERS } from '../utils/traceId';
import { logger } from '../utils/logger';

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

// Create API client for analytics services
export const apiClient = axios.create({
  baseURL: getEnv('VITE_ANALYTICS_API_URL', 'http://localhost:8081/api/v1'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for analytics requests
apiClient.interceptors.request.use(
  config => {
    // Add traceId for distributed tracing
    const traceId = traceContext.newTraceId();
    const sessionId = traceContext.getSessionId();
    config.headers[TRACE_HEADERS.TRACE_ID] = traceId;
    config.headers[TRACE_HEADERS.SESSION_ID] = sessionId;
    
    logger.debug(`[${traceId}] Analytics Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for analytics requests
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle common error scenarios
    if (!error.response) {
      return Promise.reject(new Error('Network error or service unavailable'));
    }
    return Promise.reject(error);
  }
);