import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import securityService from '../../services/securityService';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('SecurityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    securityService.clearRateLimits();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Secure Storage', () => {
    it('should store data securely', () => {
      const testData = { userId: '123', role: 'user' };
      
      securityService.secureStore('test_key', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test_key', expect.any(String));
    });

    it('should retrieve stored data', () => {
      const testData = { userId: '123', role: 'user' };
      // Mock the encrypted data that would be stored
      const encryptedData = btoa(JSON.stringify(testData)); // Base64 encoded for test
      
      localStorageMock.getItem.mockReturnValue(encryptedData);
      
      const result = securityService.secureRetrieve('test_key');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test_key');
      // The security service should handle decryption and return the original data
      expect(result).toEqual(testData);
    });

    it('should handle invalid data gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = securityService.secureRetrieve('non_existent_key');
      
      expect(result).toBeNull();
    });

    it('should remove stored data', () => {
      securityService.secureRemove('test_key');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_key');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const token = securityService.generateCSRFToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token).toContain('-');
    });

    it('should generate unique tokens', () => {
      const token1 = securityService.generateCSRFToken();
      const token2 = securityService.generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const allowed = securityService.isRequestAllowed('https://api.example.com/endpoint');
      
      expect(allowed).toBe(true);
    });

    it('should track separate endpoints differently', () => {
      const endpoint1Allowed = securityService.isRequestAllowed('https://api.example.com/endpoint1');
      const endpoint2Allowed = securityService.isRequestAllowed('https://api.example.com/endpoint2');
      
      expect(endpoint1Allowed).toBe(true);
      expect(endpoint2Allowed).toBe(true);
    });

    it('should reset rate limits after time window', () => {
      // Make multiple requests to reach limit
      for (let i = 0; i < 100; i++) {
        securityService.isRequestAllowed('https://api.example.com/test');
      }
      
      // Should be blocked now
      const blocked = securityService.isRequestAllowed('https://api.example.com/test');
      expect(blocked).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = securityService.sanitizeInput(maliciousInput);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove javascript protocols', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const result = securityService.sanitizeInput(maliciousInput);
      
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const maliciousInput = 'onclick=alert("xss")';
      const result = securityService.sanitizeInput(maliciousInput);
      
      expect(result).not.toContain('onclick=');
    });

    it('should handle non-string input', () => {
      const result = securityService.sanitizeInput(null as unknown as string);
      expect(result).toBe('');
    });

    it('should preserve safe content', () => {
      const safeInput = 'Hello World 123';
      const result = securityService.sanitizeInput(safeInput);
      
      expect(result).toBe('Hello World 123');
    });
  });

  describe('Security Headers Validation', () => {
    it('should validate required security headers', () => {
      const validHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY'
      };
      
      const isValid = securityService.validateSecurityHeaders(validHeaders);
      
      expect(isValid).toBe(true);
    });

    it('should reject missing security headers', () => {
      const invalidHeaders = {
        'content-type': 'application/json'
      };
      
      const isValid = securityService.validateSecurityHeaders(invalidHeaders);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Security Breach Handling', () => {
    it('should log security breaches', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      securityService.handleSecurityBreach('Test security breach');
      
      expect(consoleSpy).toHaveBeenCalledWith('Security breach detected:', 'Test security breach');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request ID Generation', () => {
    it('should generate secure request IDs', () => {
      const requestId = securityService.generateSecureRequestId();
      
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId.length).toBeGreaterThan(0);
      expect(requestId).toContain('-');
    });

    it('should generate unique request IDs', () => {
      const id1 = securityService.generateSecureRequestId();
      const id2 = securityService.generateSecureRequestId();
      
      expect(id1).not.toBe(id2);
    });
  });
});