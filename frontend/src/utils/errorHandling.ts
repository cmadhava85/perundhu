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
    // If backend provided a userMessage, use it directly
    if (error.userMessage) {
      return {
        message: error.userMessage,
        suggestion: getSuggestionForErrorCode(error.code, error.status)
      };
    }

    // Check for specific error codes first
    if (error.code === 'NO_ROUTES_FOUND') {
      return {
        message: 'We couldn\'t find any bus routes between these locations.',
        suggestion: 'Try different locations or help improve our database by contributing a route if you know one exists.'
      };
    }
    
    if (error.code === 'OSM_LOCATION_NOT_SUPPORTED') {
      return {
        message: error.message,
        suggestion: 'Look for locations with a 🚍 icon - these are in our database and can be searched.'
      };
    }

    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        message: 'You\'re making too many requests.',
        suggestion: 'Please wait a moment before trying again. This helps us maintain service for everyone.'
      };
    }

    if (error.code === 'DUPLICATE_ENTRY') {
      return {
        message: 'This item already exists in our system.',
        suggestion: 'Please check if this has already been submitted, or try with different details.'
      };
    }
    
    switch (error.status) {
      case 404:
        return {
          message: 'The requested resource could not be found.',
          suggestion: 'Please check your search criteria and try again.'
        };
      case 409:
        return {
          message: 'This submission conflicts with existing data.',
          suggestion: 'This route or contribution may already exist. Please check and try again with different details.'
        };
      case 422:
        return {
          message: 'Your request could not be processed.',
          suggestion: 'Please check the information you provided follows our guidelines and try again.'
        };
      case 429:
        return {
          message: 'Too many requests. Please slow down.',
          suggestion: 'Wait about a minute before trying again. This helps ensure fair access for everyone.'
        };
      case 500:
        return {
          message: 'The server encountered an error processing your request.',
          suggestion: 'Please try again later or contact support if the problem persists.'
        };
      case 502:
      case 503:
      case 504:
        return {
          message: 'Our service is temporarily unavailable.',
          suggestion: 'Please try again in a few minutes. We\'re working to restore service.'
        };
      case 400:
        // Check if it's an OSM location error in the message
        if (error.message.includes('not in our system')) {
          return {
            message: error.message,
            suggestion: 'Please select locations from our database (marked with 🚍) for now.'
          };
        }
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
          message: error.message || 'An unexpected error occurred.',
          suggestion: 'Please try again or contact support.'
        };
    }
  }

  // Check for timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return {
      message: 'The request took too long to complete.',
      suggestion: 'Please check your internet connection and try again.'
    };
  }

  // Check for network errors
  if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
    return {
      message: 'Unable to connect to the server.',
      suggestion: 'Please check your internet connection and try again.'
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred.',
    suggestion: 'Please try again or contact support if the problem persists.'
  };
};

/**
 * Get suggestion text based on error code or status
 */
const getSuggestionForErrorCode = (code?: string, status?: number): string => {
  if (code) {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 'Please wait a moment before trying again.';
      case 'DUPLICATE_ENTRY':
        return 'Please check if this has already been submitted.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and correct any errors.';
      case 'RESOURCE_NOT_FOUND':
        return 'Please check your search criteria and try again.';
      case 'INTERNAL_ERROR':
        return 'Please try again later or contact support.';
      default:
        break;
    }
  }
  
  if (status) {
    if (status === 429) return 'Please wait before trying again.';
    if (status === 409) return 'This may already exist. Try different details.';
    if (status >= 500) return 'Please try again later.';
    if (status === 401 || status === 403) return 'Please log in or contact support.';
  }
  
  return 'Please try again or contact support.';
};