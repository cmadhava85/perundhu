import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizeInput,
  sanitizeURL,
  createSecureObject,
  SecureState,
  RateLimiter,
  createIntegrityCheck,
  validateIntegrity,
  validateFormData,
} from '../../utils/reactSecurity';

describe('React Security Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should handle safe text', () => {
      const input = 'Hello World';
      const result = sanitizeHTML(input);
      
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=doEvil()';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('onclick=');
    });

    it('should remove data URIs', () => {
      const input = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('data:');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World 123!';
      const result = sanitizeInput(input);
      
      expect(result).toBe('Hello World 123!');
    });

    it('should handle non-string input', () => {
      const result = sanitizeInput(null as unknown as string);
      expect(result).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid http URLs', () => {
      const url = 'http://example.com/path';
      const result = sanitizeURL(url);
      
      expect(result).toBe('http://example.com/path');
    });

    it('should allow valid https URLs', () => {
      const url = 'https://example.com/path?query=1';
      const result = sanitizeURL(url);
      
      expect(result).toBe('https://example.com/path?query=1');
    });

    it('should reject javascript URLs', () => {
      const url = 'javascript:alert("xss")';
      const result = sanitizeURL(url);
      
      expect(result).toBeNull();
    });

    it('should reject data URLs', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeURL(url);
      
      expect(result).toBeNull();
    });

    it('should handle relative URLs', () => {
      const url = '/path/to/resource';
      const result = sanitizeURL(url);
      
      expect(result).not.toBeNull();
      expect(result).toContain('/path/to/resource');
    });

    it('should reject invalid URLs', () => {
      const url = 'not-a-valid-url://test';
      const result = sanitizeURL(url);
      
      expect(result).toBeNull();
    });
  });

  describe('createSecureObject', () => {
    it('should create a frozen object', () => {
      const obj = { name: 'test', value: 123 };
      const secureObj = createSecureObject(obj);
      
      expect(Object.isFrozen(secureObj)).toBe(true);
    });

    it('should not allow modifications', () => {
      const obj = { name: 'test', value: 123 };
      const secureObj = createSecureObject(obj);
      
      expect(() => {
        (secureObj as { name: string }).name = 'modified';
      }).toThrow();
    });
  });

  describe('SecureState', () => {
    it('should store and retrieve values', () => {
      const state = new SecureState({ userId: '123' });
      
      expect(state.value).toEqual({ userId: '123' });
    });

    it('should update values', () => {
      const state = new SecureState({ count: 0 });
      state.value = { count: 1 };
      
      expect(state.value).toEqual({ count: 1 });
    });

    it('should report valid state', () => {
      const state = new SecureState({ data: 'test' });
      
      expect(state.isValid()).toBe(true);
    });

    it('should detect tampering', () => {
      const state = new SecureState({ secret: 'sensitive' });
      
      // Tamper with internal state via prototype manipulation
      const privateValue = '_value' as keyof SecureState<object>;
      (state as unknown as Record<string, unknown>)[privateValue] = { secret: 'hacked' };
      
      expect(state.isValid()).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests over limit', () => {
      const limiter = new RateLimiter(2, 1000);
      
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should track different keys separately', () => {
      const limiter = new RateLimiter(1, 1000);
      
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(false);
      expect(limiter.isAllowed('user2')).toBe(false);
    });

    it('should reset limits', () => {
      const limiter = new RateLimiter(1, 1000);
      
      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(false);
      
      limiter.reset('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('Integrity Check', () => {
    it('should create valid integrity check', () => {
      const data = { userId: '123', role: 'user' };
      const checked = createIntegrityCheck(data);
      
      expect(checked.value).toEqual(data);
      expect(checked.checksum).toBeDefined();
      expect(typeof checked.checksum).toBe('string');
    });

    it('should validate unchanged data', () => {
      const data = { userId: '123', role: 'user' };
      const checked = createIntegrityCheck(data);
      
      expect(validateIntegrity(checked)).toBe(true);
    });

    it('should detect modified data', () => {
      const data = { userId: '123', role: 'user' };
      const checked = createIntegrityCheck(data);
      
      // Modify the value
      checked.value.userId = '456';
      
      expect(validateIntegrity(checked)).toBe(false);
    });

    it('should detect modified checksum', () => {
      const data = { userId: '123', role: 'user' };
      const checked = createIntegrityCheck(data);
      
      // Modify the checksum
      checked.checksum = 'invalid';
      
      expect(validateIntegrity(checked)).toBe(false);
    });
  });

  describe('validateFormData', () => {
    it('should accept valid form data', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello World',
      };
      
      const result = validateFormData(formData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect SQL injection', () => {
      const formData = {
        name: "' OR '1'='1",
      };
      
      const result = validateFormData(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should detect XSS', () => {
      const formData = {
        comment: '<script>alert("xss")</script>',
      };
      
      const result = validateFormData(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('comment'))).toBe(true);
    });

    it('should detect path traversal', () => {
      const formData = {
        filepath: '../../../etc/passwd',
      };
      
      const result = validateFormData(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('filepath'))).toBe(true);
    });

    it('should handle non-string values', () => {
      const formData = {
        count: 42,
        active: true,
        name: 'Safe',
      };
      
      const result = validateFormData(formData);
      
      expect(result.isValid).toBe(true);
    });
  });
});
