import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Loading from '../components/Loading';
import { useTranslation } from 'react-i18next';
import { performanceMonitor, PerformanceMark as _PerformanceMark } from './performanceMonitor';

// Types for behavior configuration
export interface CommonBehaviorOptions {
  withErrorBoundary?: boolean;
  withLoadingState?: boolean;
  withPerformanceTracking?: boolean;
  componentName?: string; // For performance tracking
  loadingMessage?: string; // Custom loading message
}

/**
 * Higher-order component that adds common behaviors to any component
 * 
 * @param WrappedComponent The component to enhance
 * @param options Configuration options for behaviors
 */
export function withCommonBehaviors<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: CommonBehaviorOptions = {}
): React.FC<P & { isLoading?: boolean }> {
  // Default options
  const {
    withErrorBoundary = true,
    withLoadingState = true,
    withPerformanceTracking = true,
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    loadingMessage
  } = options;
  
  // Create the enhanced component
  const EnhancedComponent: React.FC<P & { isLoading?: boolean }> = (props) => {
    const { t } = useTranslation();
    const [_isRendered, setIsRendered] = useState(false);
    
    // Start performance tracking when component mounts
    useEffect(() => {
      if (withPerformanceTracking) {
        const markName = `${componentName}_render`;
        performanceMonitor.startMark(markName);
        
        return () => {
          performanceMonitor.endMark(markName, 'component_render');
        };
      }
    }, []);
    
    // Mark component as rendered after first render
    useEffect(() => {
      setIsRendered(true);
    }, []);
    
    // Render loading state if isLoading prop is true
    if (withLoadingState && props.isLoading) {
      return <Loading message={loadingMessage || t('common.loading', 'Loading...')} />;
    }
    
    // Apply error boundary if enabled
    const content = <WrappedComponent {...props} />;
    
    if (withErrorBoundary) {
      return <ErrorBoundary>{content}</ErrorBoundary>;
    }
    
    return content;
  };
  
  // Set display name for the enhanced component
  EnhancedComponent.displayName = `withCommonBehaviors(${componentName})`;
  
  return EnhancedComponent;
}

/**
 * Custom hook for tracking component performance
 * 
 * @param componentName Name of the component
 * @param dependencies Dependencies array to track re-renders
 */
export function useComponentPerformance(componentName: string, dependencies: unknown[] = []) {
  useEffect(() => {
    // Track initial render
    const markName = `${componentName}_render`;
    performanceMonitor.startMark(markName);
    
    return () => {
      performanceMonitor.endMark(markName, 'component_render');
    };
  }, []); // Empty array ensures this only runs on mount and unmount
  
  // Track re-renders based on dependencies
  useEffect(() => {
    if (dependencies.length > 0) {
      performanceMonitor.recordMetric(
        `${componentName}_rerender`, 
        0, // We're just counting occurrences, not timing
        'component_rerender'
      );
    }
  }, dependencies);
}

export default withCommonBehaviors;