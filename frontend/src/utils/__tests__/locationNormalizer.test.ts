/**
 * Location Normalizer Tests
 * Verifies that location names with bus terminuses/stands are normalized correctly
 */

import {
  normalizeLocationName,
  extractBaseLocationName,
  areLocationsEquivalent,
  findLocationByNormalizedName
} from '../locationNormalizer';

describe('locationNormalizer', () => {
  describe('normalizeLocationName', () => {
    it('should remove MTC Terminus suffix', () => {
      expect(normalizeLocationName('Besant Nagar MTC Terminus')).toBe('Besant Nagar');
      expect(normalizeLocationName('Vadapalani MTC Terminus')).toBe('Vadapalani');
    });

    it('should remove bus stand variations', () => {
      expect(normalizeLocationName('Vadapalani Bus Stand')).toBe('Vadapalani');
      expect(normalizeLocationName('Salem Bus Stop')).toBe('Salem');
      expect(normalizeLocationName('Coimbatore Bus Station')).toBe('Coimbatore');
    });

    it('should handle compound locations with bus codes', () => {
      expect(normalizeLocationName('Chennai - CMBT (Koyambedu)')).toBe('Chennai');
      expect(normalizeLocationName('Chennai - CMBT')).toBe('Chennai');
    });

    it('should remove parenthetical clarifications', () => {
      expect(normalizeLocationName('Besant Nagar (Downtown)')).toBe('Besant Nagar');
      expect(normalizeLocationName('Koyambedu (CMBT)')).toBe('Koyambedu');
    });

    it('should normalize operator names', () => {
      expect(normalizeLocationName('Madurai - TNSTC Terminus')).toBe('Madurai');
    });

    it('should handle multiple variations', () => {
      expect(normalizeLocationName('Coimbatore - KSRTC Bus Station')).toBe('Coimbatore');
      expect(normalizeLocationName('Bangalore - BMTC Terminal (Main)')).toBe('Bangalore');
    });

    it('should not modify simple location names', () => {
      expect(normalizeLocationName('Besant Nagar')).toBe('Besant Nagar');
      expect(normalizeLocationName('Chennai')).toBe('Chennai');
    });

    it('should handle whitespace correctly', () => {
      expect(normalizeLocationName('  Besant Nagar  ')).toBe('Besant Nagar');
      expect(normalizeLocationName('Besant   Nagar')).toBe('Besant Nagar');
    });
  });

  describe('extractBaseLocationName', () => {
    it('should extract base name from terminus variants', () => {
      expect(extractBaseLocationName('Besant Nagar MTC Terminus')).toBe('Besant Nagar');
      expect(extractBaseLocationName('Chennai - CMBT')).toBe('Chennai');
    });

    it('should return simple name as-is', () => {
      expect(extractBaseLocationName('Besant Nagar')).toBe('Besant Nagar');
    });
  });

  describe('areLocationsEquivalent', () => {
    it('should recognize MTC Terminus as equivalent', () => {
      expect(areLocationsEquivalent('Besant Nagar', 'Besant Nagar MTC Terminus')).toBe(true);
      expect(areLocationsEquivalent('Besant Nagar MTC Terminus', 'Besant Nagar')).toBe(true);
    });

    it('should recognize bus stand variations as equivalent', () => {
      expect(areLocationsEquivalent('Vadapalani', 'Vadapalani Bus Stand')).toBe(true);
      expect(areLocationsEquivalent('Chennai', 'Chennai - CMBT')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(areLocationsEquivalent('BESANT NAGAR', 'besant nagar MTC TERMINUS')).toBe(true);
    });

    it('should return false for different locations', () => {
      expect(areLocationsEquivalent('Besant Nagar', 'Vadapalani')).toBe(false);
      expect(areLocationsEquivalent('Chennai', 'Coimbatore')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(areLocationsEquivalent('', 'Besant Nagar')).toBe(false);
      expect(areLocationsEquivalent('Besant Nagar', '')).toBe(false);
    });
  });

  describe('findLocationByNormalizedName', () => {
    const locations = [
      { id: 1, name: 'Besant Nagar' },
      { id: 2, name: 'Vadapalani' },
      { id: 3, name: 'Chennai' }
    ];

    it('should find location by normalized name with terminus', () => {
      expect(findLocationByNormalizedName('Besant Nagar MTC Terminus', locations)).toBe(1);
      expect(findLocationByNormalizedName('Vadapalani Bus Stand', locations)).toBe(2);
    });

    it('should find location by exact name', () => {
      expect(findLocationByNormalizedName('Besant Nagar', locations)).toBe(1);
      expect(findLocationByNormalizedName('Chennai', locations)).toBe(3);
    });

    it('should return null for non-matching locations', () => {
      expect(findLocationByNormalizedName('Coimbatore', locations)).toBeNull();
    });

    it('should handle empty list', () => {
      expect(findLocationByNormalizedName('Besant Nagar', [])).toBeNull();
    });

    it('should handle empty search query', () => {
      expect(findLocationByNormalizedName('', locations)).toBeNull();
    });
  });
});
