import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { logError } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Search Feature Error Boundary
 * Isolated error boundary for bus search functionality
 * Phase 3 - Code Quality
 */
export class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('SearchErrorBoundary caught an error', error, {
      feature: 'search',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-search" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
            🔍 Search Temporarily Unavailable
          </h3>
          <p style={{ color: '#856404', marginBottom: '1rem' }}>
            We're having trouble loading search results. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Retry Search
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Map Feature Error Boundary
 * Isolated error boundary for map rendering
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('MapErrorBoundary caught an error', error, {
      feature: 'map',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-map" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <h3 style={{ color: '#721c24', marginBottom: '1rem' }}>
            🗺️ Map Unavailable
          </h3>
          <p style={{ color: '#721c24' }}>
            The map couldn't be loaded. Bus information is still available below.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Contribution Feature Error Boundary
 * Isolated error boundary for user contributions
 */
export class ContributionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('ContributionErrorBoundary caught an error', error, {
      feature: 'contribution',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-contribution" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <h3 style={{ color: '#0c5460', marginBottom: '1rem' }}>
            ✏️ Contribution Form Error
          </h3>
          <p style={{ color: '#0c5460', marginBottom: '1rem' }}>
            We couldn't load the contribution form. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reload Form
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Admin Feature Error Boundary
 * Isolated error boundary for admin functionality
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('AdminErrorBoundary caught an error', error, {
      feature: 'admin',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-admin" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <h3 style={{ color: '#721c24', marginBottom: '1rem' }}>
            🔒 Admin Panel Error
          </h3>
          <p style={{ color: '#721c24', marginBottom: '1rem' }}>
            The admin panel encountered an error. Please refresh the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Data Loading Error Boundary
 * Handles errors during initial data loading
 */
export class DataLoadingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('DataLoadingErrorBoundary caught an error', error, {
      feature: 'data-loading',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-data-loading" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          margin: '1rem',
        }}>
          <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
            📊 Data Loading Failed
          </h3>
          <p style={{ color: '#856404', marginBottom: '1rem' }}>
            We couldn't load the necessary data. Please check your connection and try again.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
