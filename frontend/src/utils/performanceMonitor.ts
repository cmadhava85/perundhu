/**
 * Performance monitoring utilities for tracking and optimizing application performance
 */

// Replace enum with object constants for TypeScript compatibility
export const PerformanceMark = {
  APP_INIT: 'app_init',
  APP_RENDER: 'app_render',
  APP_READY: 'app_ready',
  API_REQUEST: 'api_request',
  API_RESPONSE: 'api_response',
  ROUTE_CHANGE: 'route_change',
  SEARCH_START: 'search_start',
  SEARCH_COMPLETE: 'search_complete',
  MAP_INIT: 'map_init',
  MAP_RENDER: 'map_render'
} as const;

export type PerformanceMarkType = typeof PerformanceMark[keyof typeof PerformanceMark];

// Interface for performance metrics
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

// Class for managing performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Record<string, PerformanceMetric[]> = {};
  private marks: Record<string, number> = {};
  private enabled: boolean = true;
  private sampleRate: number = 1.0; // Collect 100% of metrics by default

  private constructor() {
    // Initialize with any configuration
    this.enabled = this.shouldEnableMonitoring();
    this.sampleRate = this.getSampleRate();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Determine if monitoring should be enabled based on environment or settings
   */
  private shouldEnableMonitoring(): boolean {
    // Check local storage for override
    const localStorageSetting = localStorage.getItem('performanceMonitoring');
    if (localStorageSetting !== null) {
      return localStorageSetting === 'true';
    }

    // Default to enabled in production, configurable in development
    return process.env.NODE_ENV === 'production' || 
           (process.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true');
  }

  /**
   * Get the sampling rate for metrics collection
   */
  private getSampleRate(): number {
    // Check environment variable or default to 1.0 (100%)
    const envRate = process.env.VITE_PERFORMANCE_SAMPLE_RATE;
    if (envRate && !isNaN(parseFloat(envRate))) {
      return Math.max(0, Math.min(1, parseFloat(envRate)));
    }
    return 1.0;
  }

  /**
   * Determine if this session should be sampled based on sampling rate
   */
  private shouldSample(): boolean {
    return Math.random() <= this.sampleRate;
  }

  /**
   * Start measuring a performance period
   * 
   * @param markName Name of the performance mark
   */
  public startMark(markName: string): void {
    if (!this.enabled || !this.shouldSample()) return;
    
    this.marks[markName] = performance.now();
    
    // Also use the browser's Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${markName}_start`);
    }
  }

  /**
   * End measuring a performance period and record the metric
   * 
   * @param markName Name of the performance mark to end
   * @param category Category for grouping related metrics
   */
  public endMark(markName: string, category: string = 'default'): number | undefined {
    if (!this.enabled || !this.marks[markName]) return;
    
    const startTime = this.marks[markName];
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Use browser Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${markName}_end`);
      performance.measure(markName, `${markName}_start`, `${markName}_end`);
    }
    
    // Remove the mark
    delete this.marks[markName];
    
    // Store the metric
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push({
      name: markName,
      duration,
      timestamp: Date.now()
    });
    
    // Return the duration for convenience
    return duration;
  }

  /**
   * Record a complete metric directly
   * 
   * @param name Name of the metric
   * @param duration Duration in milliseconds
   * @param category Category for grouping related metrics
   */
  public recordMetric(name: string, duration: number, category: string = 'default'): void {
    if (!this.enabled || !this.shouldSample()) return;
    
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push({
      name,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Get metrics for a specific category
   * 
   * @param category Category name
   */
  public getMetrics(category: string = 'default'): PerformanceMetric[] {
    return this.metrics[category] || [];
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Record<string, PerformanceMetric[]> {
    return { ...this.metrics };
  }

  /**
   * Clear all stored metrics
   */
  public clearMetrics(): void {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Send metrics to a backend for analysis
   */
  public async sendMetricsToServer(): Promise<void> {
    if (!this.enabled || Object.keys(this.metrics).length === 0) return;
    
    try {
      // You could implement sending to your analytics backend here
      // For example:
      // await fetch('/api/metrics', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     metrics: this.getAllMetrics(),
      //     userAgent: navigator.userAgent,
      //     timestamp: Date.now()
      //   })
      // });
      
      // Clear metrics after sending
      this.clearMetrics();
    } catch (error) {
      // Don't break the app if metrics sending fails
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('performanceMonitoring', enabled.toString());
  }

  /**
   * Check if monitoring is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startMark = (name: string): void => performanceMonitor.startMark(name);
export const endMark = (name: string, category?: string): number | undefined => 
  performanceMonitor.endMark(name, category);
export const recordMetric = (name: string, duration: number, category?: string): void => 
  performanceMonitor.recordMetric(name, duration, category);

export default performanceMonitor;