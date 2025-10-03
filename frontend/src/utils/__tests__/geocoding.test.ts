import { getCityCoordinates, getStopCoordinatesAsync, geocodeCity } from '../cityCoordinates';

describe('Geocoding Functions', () => {
  test('should find Villupuram coordinates', () => {
    const coords = getCityCoordinates('Villupuram');
    expect(coords).toBeTruthy();
    expect(coords?.name).toBe('Villupuram');
    expect(coords?.latitude).toBeCloseTo(11.9401);
    expect(coords?.longitude).toBeCloseTo(79.4861);
  });

  test('should handle case variations', () => {
    const coords1 = getCityCoordinates('villupuram');
    const coords2 = getCityCoordinates('VILLUPURAM');
    const coords3 = getCityCoordinates('Villupuram');
    
    expect(coords1).toBeTruthy();
    expect(coords2).toBeTruthy();
    expect(coords3).toBeTruthy();
    expect(coords1?.latitude).toBe(coords2?.latitude);
    expect(coords2?.latitude).toBe(coords3?.latitude);
  });

  test('should handle async geocoding for unknown cities', async () => {
    // Mock a stop with an unknown city
    const unknownStop = {
      name: 'UnknownCity',
      latitude: null,
      longitude: null
    };

    // This should return null since we're not hitting the actual API in tests
    const result = await getStopCoordinatesAsync(unknownStop);
    // In a real scenario with internet, this might return geocoded coordinates
    expect(result).toBeNull();
  });

  test('should use exact coordinates when available', async () => {
    const stopWithCoords = {
      name: 'TestStop',
      latitude: 12.345,
      longitude: 78.901
    };

    const result = await getStopCoordinatesAsync(stopWithCoords);
    expect(result).toBeTruthy();
    expect(result?.latitude).toBe(12.345);
    expect(result?.longitude).toBe(78.901);
    expect(result?.source).toBe('Exact stop location');
  });

  test('should fall back to city coordinates', async () => {
    const stopWithoutCoords = {
      name: 'Villupuram',
      latitude: null,
      longitude: null
    };

    const result = await getStopCoordinatesAsync(stopWithoutCoords);
    expect(result).toBeTruthy();
    expect(result?.latitude).toBeCloseTo(11.9401);
    expect(result?.longitude).toBeCloseTo(79.4861);
    expect(result?.source).toBe('Villupuram Bus Stand');
  });
});