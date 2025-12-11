/**
 * Security service for managing API security, rate limiting, and secure storage
 * Enhanced with tampering detection and secure data handling
 */

import { getEnv } from '../utils/environment';

// Feature flags from environment
const isSecurityEnabled = (): boolean => getEnv('VITE_SECURITY_ENABLED', 'true') === 'true';
const isRateLimitEnabled = (): boolean => getEnv('VITE_RATE_LIMIT_ENABLED', 'true') === 'true';
const isEncryptionEnabled = (): boolean => getEnv('VITE_ENCRYPTION_ENABLED', 'true') === 'true';

// Encryption key derived from session (simple obfuscation - not true encryption)
const getSessionKey = (): string => {
  let key = sessionStorage.getItem('_sk');
  if (!key) {
    key = Math.random().toString(36).slice(2, 18) + Date.now().toString(36);
    sessionStorage.setItem('_sk', key);
  }
  return key;
};

// Simple XOR-based obfuscation (not cryptographically secure, but prevents casual inspection)
const obfuscate = (data: string, key: string): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const dataCode = data.codePointAt(i) ?? 0;
    const keyCode = key.codePointAt(i % key.length) ?? 0;
    result += String.fromCodePoint(dataCode ^ keyCode);
  }
  return btoa(result);
};

const deobfuscate = (data: string, key: string): string => {
  try {
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const decodedCode = decoded.codePointAt(i) ?? 0;
      const keyCode = key.codePointAt(i % key.length) ?? 0;
      result += String.fromCodePoint(decodedCode ^ keyCode);
    }
    return result;
  } catch {
    return '';
  }
};

class SecurityService {
  private readonly requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT = 100; // requests per window
  private readonly WINDOW_SIZE = 60000; // 1 minute in milliseconds
  private readonly integrityChecks: Map<string, string> = new Map();

  /**
   * Securely store data in localStorage with obfuscation and integrity check
   * Respects VITE_ENCRYPTION_ENABLED flag
   */
  secureStore<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      
      // If encryption is disabled, store as plain base64
      if (!isEncryptionEnabled()) {
        localStorage.setItem(key, btoa(serialized));
        return;
      }
      
      const sessionKey = getSessionKey();
      const obfuscated = obfuscate(serialized, sessionKey);
      
      // Create integrity hash
      const integrity = this.computeIntegrity(serialized);
      this.integrityChecks.set(key, integrity);
      
      // Store with timestamp for expiry checks
      const wrapped = JSON.stringify({
        d: obfuscated,
        t: Date.now(),
        i: integrity
      });
      
      localStorage.setItem(key, btoa(wrapped));
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  /**
   * Securely retrieve data from localStorage with integrity verification
   * Respects VITE_ENCRYPTION_ENABLED flag
   */
  secureRetrieve<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      // If encryption is disabled, retrieve as plain base64
      if (!isEncryptionEnabled()) {
        try {
          return JSON.parse(atob(raw)) as T;
        } catch {
          // Try encrypted format as fallback (for migration)
        }
      }
      
      const wrapped = JSON.parse(atob(raw));
      const sessionKey = getSessionKey();
      const serialized = deobfuscate(wrapped.d, sessionKey);
      
      if (!serialized) {
        this.handleSecurityBreach(`Data corruption detected for key: ${key}`);
        this.secureRemove(key);
        return null;
      }
      
      // Verify integrity (only if security is enabled)
      if (isSecurityEnabled()) {
        const currentIntegrity = this.computeIntegrity(serialized);
        if (wrapped.i !== currentIntegrity) {
          this.handleSecurityBreach(`Data tampering detected for key: ${key}`);
          this.secureRemove(key);
          return null;
        }
      }
      
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      // Clear potentially corrupted data
      this.secureRemove(key);
      return null;
    }
  }

  /**
   * Securely remove data from localStorage
   */
  secureRemove(key: string): void {
    try {
      localStorage.removeItem(key);
      this.integrityChecks.delete(key);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  }

  /**
   * Compute integrity hash for data
   */
  private computeIntegrity(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.codePointAt(i) ?? 0;
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate CSRF token for form protection
   */
  generateCSRFToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 14);
    const token = timestamp + '-' + random;
    
    // Store token for validation
    sessionStorage.setItem('_csrf', token);
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const stored = sessionStorage.getItem('_csrf');
    return stored === token;
  }

  /**
   * Check if a request to a specific URL is allowed based on rate limiting
   * Respects VITE_RATE_LIMIT_ENABLED flag
   */
  isRequestAllowed(url: string): boolean {
    // If rate limiting is disabled, always allow
    if (!isRateLimitEnabled()) {
      return true;
    }
    
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
   * Respects VITE_SECURITY_ENABLED flag
   */
  handleSecurityBreach(reason: string): void {
    console.error('Security breach detected:', reason);
    
    // If security is disabled, just log and return
    if (!isSecurityEnabled()) {
      console.warn('Security is disabled - breach handling skipped');
      return;
    }
    
    // Clear all stored data on security breach
    this.clearAllSecureData();
    
    // In a real implementation, this might:
    // - Log to security monitoring system
    // - Temporarily block the user
    // - Send alerts to administrators
  }

  /**
   * Check if security features are enabled
   */
  isSecurityEnabled(): boolean {
    return isSecurityEnabled();
  }

  /**
   * Check if rate limiting is enabled
   */
  isRateLimitEnabled(): boolean {
    return isRateLimitEnabled();
  }

  /**
   * Check if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    return isEncryptionEnabled();
  }

  /**
   * Clear all secure data (useful on logout or security breach)
   */
  clearAllSecureData(): void {
    const keysToRemove = ['auth_token', 'refresh_token', 'user_data', 'token_expiration'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    this.integrityChecks.clear();
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

    // Using replaceAll with regex for global replacement
    let sanitized = input;
    sanitized = sanitized.replaceAll('<', '');
    sanitized = sanitized.replaceAll('>', '');
    sanitized = sanitized.replaceAll(/javascript:/gi, '');
    sanitized = sanitized.replaceAll(/data:/gi, '');
    // Remove event handlers like onclick=, onload=, etc.
    sanitized = sanitized.replaceAll(/on\w+\s*=/gi, '');
    return sanitized.trim();
  }

  /**
   * Validate input against common attack patterns
   */
  validateInput(input: string): { isValid: boolean; reason?: string } {
    if (typeof input !== 'string') {
      return { isValid: false, reason: 'Input must be a string' };
    }

    // Check for SQL injection patterns
    if (/('|--|;|\/\*|\*\/|xp_|sp_|exec\s|execute\s)/i.test(input)) {
      return { isValid: false, reason: 'Suspicious SQL pattern detected' };
    }

    // Check for XSS patterns
    if (/<script|javascript:|on\w+=/i.test(input)) {
      return { isValid: false, reason: 'Potential XSS detected' };
    }

    // Check for path traversal
    if (/\.\.[/\\]/.test(input)) {
      return { isValid: false, reason: 'Path traversal attempt detected' };
    }

    return { isValid: true };
  }

  /**
   * Generate a secure request ID for tracking
   */
  generateSecureRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 11);
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

  /**
   * Check if storage has been tampered with externally
   */
  verifyStorageIntegrity(): boolean {
    const criticalKeys = ['auth_token', 'user_data'];
    
    for (const key of criticalKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const wrapped = JSON.parse(atob(raw));
          const sessionKey = getSessionKey();
          const serialized = deobfuscate(wrapped.d, sessionKey);
          const currentIntegrity = this.computeIntegrity(serialized);
          
          if (wrapped.i !== currentIntegrity) {
            return false;
          }
        } catch {
          return false;
        }
      }
    }
    
    return true;
  }
}

// Export singleton instance
const securityService = new SecurityService();

export default securityService;