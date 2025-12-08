import { AxiosError } from 'axios';

/**
 * Standardized API error handler
 * @param message - Custom error message
 * @param error - The error object thrown by API request
 * @returns Default fallback value (usually empty array or object)
 */
export function handleApiError<T>(message: string, error: unknown, fallbackValue?: T): T {
  const errorMessage = getErrorMessage(error);
  console.error(`${message}: ${errorMessage}`);
  
  // Show a user-friendly notification if needed
  // This could be connected to your app's notification system
  
  // Return fallback value if provided
  if (fallbackValue !== undefined) {
    return fallbackValue;
  }
  
  // Re-throw the error for the caller to handle
  throw error;
}

/**
 * Extract a meaningful error message from various error types
 * @param error - The error object
 * @returns A human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Handle Axios specific errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.statusText;
      
      return `Server error (${status}): ${serverMessage}`;
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error: No response received from server';
    } else {
      // Error setting up the request
      return `Request configuration error: ${error.message}`;
    }
  } else if (error instanceof Error) {
    // Handle standard Error objects
    return error.message;
  } else if (typeof error === 'string') {
    // Handle string errors
    return error;
  } else {
    // Handle unknown error types
    return 'An unknown error occurred';
  }
}

/**
 * Check if error is a network connectivity issue
 * @param error - The error to check
 * @returns Boolean indicating if error is related to connectivity
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
}

/**
 * Check if error is a server error (5xx status code)
 * @param error - The error to check
 * @returns Boolean indicating if error is a server error
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    return status >= 500 && status < 600;
  }
  return false;
}

/**
 * Check if error is a client error (4xx status code)
 * @param error - The error to check
 * @returns Boolean indicating if error is a client error
 */
export function isClientError(error: unknown): boolean {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    return status >= 400 && status < 500;
  }
  return false;
}

/**
 * Format validation errors from API responses
 * @param error - The error object from API
 * @returns An object mapping field names to error messages
 */
export function formatValidationErrors(error: AxiosError): Record<string, string> {
  try {
    // Add type assertion for error.response.data to handle potential errors property
    interface ValidationErrorResponse {
      errors?: Record<string, string>;
    }
    if (error.response?.status === 400 && (error.response.data as ValidationErrorResponse)?.errors) {
      return (error.response.data as ValidationErrorResponse).errors ?? {};
    }
    return {};
  } catch (e) {
    console.error('Error formatting validation errors', e);
    return {};
  }
}