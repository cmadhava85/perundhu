/**
 * Security service for managing API security and rate limiting
 */
class SecurityService {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT = 100; // requests per window
  private readonly WINDOW_SIZE = 60000; // 1 minute in milliseconds

  /**
   * Securely store data in localStorage with basic obfuscation
   */
  secureStore<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      const encoded = btoa(serialized); // Basic encoding for obfuscation
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  /**
   * Securely retrieve data from localStorage
   */
  secureRetrieve<T>(key: string): T | null {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      
      const serialized = atob(encoded);
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Securely remove data from localStorage
   */
  secureRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  }

  /**
   * Generate CSRF token for form protection
   */
  generateCSRFToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 12);
    return timestamp + '-' + random;
  }

  /**
   * Check if a request to a specific URL is allowed based on rate limiting
   */
  isRequestAllowed(url: string): boolean {
    const now = Date.now();
    const key = this.getUrlKey(url);
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_SIZE
      });
      return true;
    }

    if (record.count >= this.RATE_LIMIT) {
      console.warn('Rate limit exceeded for ' + url);
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Handle security breaches or violations
   */
  handleSecurityBreach(reason: string): void {
    console.error('Security breach detected:', reason);
    // In a real implementation, this might:
    // - Log to security monitoring system
    // - Temporarily block the user
    // - Send alerts to administrators
  }

  /**
   * Validate API response for security headers
   */
  validateSecurityHeaders(headers: Record<string, string>): boolean {
    // Check for required security headers
    const requiredHeaders = ['x-content-type-options', 'x-frame-options'];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        console.warn('Missing security header: ' + header);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Generate a secure request ID for tracking
   */
  generateSecureRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return timestamp + '-' + random;
  }

  private getUrlKey(url: string): string {
    // Extract the endpoint path for rate limiting (ignore query params)
    try {
      const urlObj = new URL(url, 'http://localhost');
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, use the raw URL
      return url.split('?')[0];
    }
  }

  /**
   * Clear rate limiting records (for testing)
   */
  clearRateLimits(): void {
    this.requestCounts.clear();
  }
}

// Export singleton instance
const securityService = new SecurityService();

export default securityService;