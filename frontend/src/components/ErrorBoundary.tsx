import React from 'react';
import { logError } from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * ErrorBoundary Component
 * 
 * Note: This component uses a class component because React Error Boundaries
 * are not yet supported with functional components. Error boundaries require
 * the componentDidCatch lifecycle method, which is only available in class components.
 * 
 * This is an exception to our "functional components only" rule and is
 * the recommended approach per React documentation.
 * 
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('ErrorBoundary caught an error', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚫 Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
              {import.meta.env.MODE === 'development' && (
                <pre>{this.state.error?.stack}</pre>
              )}
            </details>
            <button 
              onClick={this.handleRetry}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;