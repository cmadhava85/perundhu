import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getOrCreateDeviceId, clearDeviceId, getDeviceId } from '../deviceId';

describe('deviceId Utility', () => {
  const DEVICE_ID_KEY = 'perundhu_device_id';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('getOrCreateDeviceId()', () => {
    it('should create a new device ID if none exists', () => {
      const deviceId = getOrCreateDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toMatch(/^device_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should store device ID in localStorage', () => {
      const deviceId = getOrCreateDeviceId();
      
      const stored = localStorage.getItem(DEVICE_ID_KEY);
      expect(stored).toBe(deviceId);
    });

    it('should return the same device ID on subsequent calls', () => {
      const firstCall = getOrCreateDeviceId();
      const secondCall = getOrCreateDeviceId();
      
      expect(firstCall).toBe(secondCall);
    });

    it('should generate device ID with correct format', () => {
      const deviceId = getOrCreateDeviceId();
      
      expect(deviceId).toMatch(/^device_/);
      const parts = deviceId.split('_');
      expect(parts.length).toBe(3); // device, timestamp, random
    });

    it('should generate unique device IDs for different calls (when localStorage is cleared)', () => {
      const firstId = getOrCreateDeviceId();
      localStorage.clear();
      const secondId = getOrCreateDeviceId();
      
      expect(firstId).not.toBe(secondId);
    });

    it('should persist across page reloads (simulated by localStorage)', () => {
      const originalId = getOrCreateDeviceId();
      
      // Simulate page reload - create new instance
      const reloadedId = getOrCreateDeviceId();
      
      expect(reloadedId).toBe(originalId);
    });
  });

  describe('clearDeviceId()', () => {
    it('should remove device ID from localStorage', () => {
      getOrCreateDeviceId();
      expect(localStorage.getItem(DEVICE_ID_KEY)).not.toBeNull();
      
      clearDeviceId();
      
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
    });

    it('should allow creating a new device ID after clearing', () => {
      const originalId = getOrCreateDeviceId();
      clearDeviceId();
      const newId = getOrCreateDeviceId();
      
      expect(originalId).not.toBe(newId);
    });

    it('should not throw error if device ID does not exist', () => {
      expect(() => clearDeviceId()).not.toThrow();
    });
  });

  describe('getDeviceId()', () => {
    it('should return existing device ID without creating new one', () => {
      const createdId = getOrCreateDeviceId();
      
      const retrieved = getDeviceId();
      
      expect(retrieved).toBe(createdId);
    });

    it('should return device ID if it exists', () => {
      const createdId = getOrCreateDeviceId();
      
      const retrieved = getDeviceId();
      
      expect(retrieved).toBe(createdId);
    });

    it('should not modify localStorage when getting existing device ID', () => {
      getOrCreateDeviceId();
      const beforeCount = localStorage.length;
      
      getDeviceId();
      
      expect(localStorage.length).toBe(beforeCount);
    });

    it('should return null if device ID has never been created', () => {
      localStorage.clear();
      const retrieved = getDeviceId();
      
      expect(retrieved).toBeNull();
    });
  });

  describe('Device ID persistence', () => {
    it('should maintain same device ID across multiple operations', () => {
      const id1 = getOrCreateDeviceId();
      const id2 = getDeviceId();
      const id3 = getOrCreateDeviceId();
      
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });

    it('should handle concurrent calls to getOrCreateDeviceId', () => {
      const results = [
        getOrCreateDeviceId(),
        getOrCreateDeviceId(),
        getOrCreateDeviceId(),
      ];
      
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });

  describe('Device ID format validation', () => {
    it('should generate device ID with valid timestamp component', () => {
      const deviceId = getOrCreateDeviceId();
      const parts = deviceId.split('_');
      const timestamp = parts[1];
      
      // Timestamp is in base36 format
      expect(timestamp).toBeDefined();
      expect(timestamp.length).toBeGreaterThan(0);
      // Base36 can contain 0-9 and a-z
      expect(timestamp).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate device ID with valid random component', () => {
      const deviceId = getOrCreateDeviceId();
      const parts = deviceId.split('_');
      const random = parts[2];
      
      expect(random).toMatch(/^[a-z0-9]+$/);
      expect(random.length).toBeGreaterThan(0);
    });

    it('should generate different random components for different IDs', () => {
      const id1 = getOrCreateDeviceId();
      clearDeviceId();
      const id2 = getOrCreateDeviceId();
      
      const random1 = id1.split('_')[2];
      const random2 = id2.split('_')[2];
      
      expect(random1).not.toBe(random2);
    });
  });
});
