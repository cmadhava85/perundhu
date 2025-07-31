import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error boundary needs to be a class component
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  reset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided, otherwise show default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary-fallback">
          <ErrorFallback error={this.state.error} reset={this.reset} />
        </div>
      );
    }

    return this.props.children;
  }
}

// Default error fallback UI component
interface ErrorFallbackProps {
  error: Error | null;
  reset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, reset }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-red-50 p-6 rounded-lg shadow-md dark:bg-red-900/20">
      <div className="flex items-center gap-3 mb-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8 text-red-600 dark:text-red-400" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">
          {t('errorBoundary.title', 'Something went wrong')}
        </h2>
      </div>
      
      <div className="mb-4">
        <p className="text-red-700 dark:text-red-300 mb-2">
          {t('errorBoundary.message', 'An error occurred while rendering this component:')}
        </p>
        <pre className="bg-white p-3 rounded border border-red-200 text-red-800 text-sm overflow-auto max-h-40 dark:bg-gray-800 dark:border-red-800 dark:text-red-300">
          {error?.message || t('errorBoundary.unknown', 'Unknown error')}
        </pre>
      </div>
      
      <button
        onClick={reset}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors dark:bg-red-800 dark:hover:bg-red-700"
      >
        {t('errorBoundary.retry', 'Try again')}
      </button>
    </div>
  );
};

// Create a function component wrapper for easier use
const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;