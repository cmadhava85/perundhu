import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Configuration for API retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay between retries in ms (default: 1000) */
  retryDelay: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Maximum delay between retries in ms (default: 10000) */
  maxDelay: number;
  /** HTTP status codes that should trigger retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatusCodes: number[];
  /** Network error types that should trigger retry */
  retryableErrorCodes: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrorCodes: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ERR_NETWORK'],
};

/**
 * Extended Axios config to track retry state
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __retryConfig?: RetryConfig;
}

/**
 * Calculate delay for next retry using exponential backoff
 */
function calculateRetryDelay(retryCount: number, config: RetryConfig): number {
  const delay = config.retryDelay * Math.pow(config.backoffMultiplier, retryCount);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 200;
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Check if the error should trigger a retry
 */
function shouldRetry(error: AxiosError, config: RetryConfig, currentRetryCount: number): boolean {
  // Don't retry if we've exceeded max retries
  if (currentRetryCount >= config.maxRetries) {
    return false;
  }

  // Don't retry canceled requests
  if (axios.isCancel(error)) {
    return false;
  }

  // Retry on network errors
  if (!error.response) {
    const errorCode = (error as AxiosError & { code?: string }).code || '';
    return config.retryableErrorCodes.includes(errorCode) || error.message.includes('Network Error');
  }

  // Retry on specific status codes
  const status = error.response?.status;
  if (status && config.retryableStatusCodes.includes(status)) {
    // Check for Retry-After header (rate limiting)
    const retryAfter = error.response.headers?.['retry-after'];
    if (retryAfter) {
      console.log(`API rate limited. Retry-After: ${retryAfter}s`);
    }
    return true;
  }

  // Don't retry on client errors (4xx except specific ones)
  if (status && status >= 400 && status < 500) {
    return false;
  }

  return false;
}

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Setup retry interceptors on an Axios instance
 * 
 * @param axiosInstance - The Axios instance to configure
 * @param customConfig - Optional custom retry configuration
 */
export function setupRetryInterceptor(
  axiosInstance: AxiosInstance,
  customConfig?: Partial<RetryConfig>
): void {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...customConfig };

  // Response interceptor for retry logic
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
      
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Initialize retry count if not set
      const currentRetryCount = originalRequest.__retryCount || 0;
      originalRequest.__retryCount = currentRetryCount;
      originalRequest.__retryConfig = config;

      if (shouldRetry(error, config, currentRetryCount)) {
        originalRequest.__retryCount = currentRetryCount + 1;
        
        const delay = calculateRetryDelay(currentRetryCount, config);
        
        console.log(
          `API request failed. Retrying (${currentRetryCount + 1}/${config.maxRetries}) in ${delay}ms...`,
          {
            url: originalRequest.url,
            status: error.response?.status,
            error: error.message,
          }
        );

        await sleep(delay);
        
        return axiosInstance.request(originalRequest);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Create a request with a timeout and abort controller
 * Useful for requests that should be cancellable
 */
export function createCancelableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 30000
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const promise = requestFn(controller.signal).finally(() => {
    clearTimeout(timeoutId);
  });

  return {
    promise,
    cancel: () => {
      clearTimeout(timeoutId);
      controller.abort();
    },
  };
}

/**
 * Higher-order function for retry with custom logic
 * Use for non-axios operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < fullConfig.maxRetries) {
        const delay = calculateRetryDelay(attempt, fullConfig);
        console.log(`Operation failed. Retrying (${attempt + 1}/${fullConfig.maxRetries}) in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Utility to check if an error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && (
      error.message.includes('Network Error') ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK'
    );
  }
  return false;
}

/**
 * Utility to check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.code === 'ECONNABORTED' || error.message.includes('timeout');
  }
  return false;
}

/**
 * Utility to check if a service is temporarily unavailable (circuit breaker open)
 */
export function isCircuitBreakerOpen(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { circuitBreakerTriggered?: boolean };
    return data.circuitBreakerTriggered === true;
  }
  return false;
}
