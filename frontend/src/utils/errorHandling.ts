import { ApiError } from '../services/api';

/**
 * Standardized error handling utility
 * 
 * @param error The error to process
 * @param defaultMessage Default message to show if error is not an Error instance
 * @returns A proper Error or ApiError object
 */
export const handleError = (error: unknown, defaultMessage = 'An unknown error occurred'): Error | ApiError => {
  console.error('Error occurred:', error);
  
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error(defaultMessage);
};

/**
 * Creates a descriptive error message for the user based on error status codes
 * 
 * @param error The error object
 * @returns User-friendly error message and suggestion
 */
export const getUserFriendlyErrorMessage = (error: Error | ApiError): { message: string; suggestion: string } => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return {
          message: 'The requested resource could not be found.',
          suggestion: 'Please check your search criteria and try again.'
        };
      case 500:
        return {
          message: 'The server encountered an error processing your request.',
          suggestion: 'Please try again later or contact support if the problem persists.'
        };
      case 400:
        return {
          message: 'There was a problem with your request.',
          suggestion: 'Please check the information you provided and try again.'
        };
      case 401:
        return {
          message: 'You need to be logged in to access this feature.',
          suggestion: 'Please log in and try again.'
        };
      case 403:
        return {
          message: 'You don\'t have permission to access this resource.',
          suggestion: 'Please contact support if you believe this is in error.'
        };
      case 0:
        return {
          message: 'Network error: Unable to connect to the server.',
          suggestion: 'Please check your internet connection and try again.'
        };
      default:
        return {
          message: error.message,
          suggestion: 'Please try again or contact support.'
        };
    }
  }
  
  return {
    message: error.message,
    suggestion: 'Please try again or contact support if the problem persists.'
  };
};