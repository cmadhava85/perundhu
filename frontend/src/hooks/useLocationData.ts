import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/api';
import type { Location } from '../types';
import { calculateDistance, getCurrentPosition } from '../utils/geolocation';

/**
 * Custom hook for managing location data and selection
 */
export const useLocationData = () => {
  const { i18n } = useTranslation();
  
  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [destinations, setDestinations] = useState<Location[]>([]);
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [geoLocationLoading, setGeoLocationLoading] = useState<boolean>(false);
  // Changed from const to let user toggle it
  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(true);

  /**
   * Toggle automatic location detection
   */
  const toggleAutoLocation = useCallback(() => {
    const newValue = !autoLocationEnabled;
    setAutoLocationEnabled(newValue);
    
    // Save preference to localStorage
    localStorage.setItem('perundhu-auto-location', newValue ? 'true' : 'false');
    
    // If turning on auto-location, try to detect
    if (newValue && locations.length > 0) {
      detectUserLocation();
    }
  }, [autoLocationEnabled, locations]);
  
  // Load user preference for auto-location on first load
  useEffect(() => {
    const savedPreference = localStorage.getItem('perundhu-auto-location');
    if (savedPreference !== null) {
      setAutoLocationEnabled(savedPreference === 'true');
    }
  }, []);

  /**
   * Load all available locations
   */
  const loadLocations = useCallback(async () => {
    try {
      console.log('useLocationData: Starting to load locations');
      setLoading(true);
      const locationsData = await getLocations(i18n.language);
      console.log('useLocationData: Locations received from API:', locationsData);
      
      if (!locationsData || locationsData.length === 0) {
        console.warn('useLocationData: No locations data received from API');
      }
      
      setLocations(locationsData);
      console.log('useLocationData: Locations state updated');
      
      // After loading locations, automatically detect user location
      if (locationsData.length > 0 && autoLocationEnabled) {
        console.log('useLocationData: Attempting to detect user location');
        detectUserLocation();
      }
    } catch (err) {
      console.error("useLocationData: Error loading locations:", err);
      setError(err instanceof Error ? err : new Error('Failed to load locations'));
    } finally {
      setLoading(false);
    }
  }, [autoLocationEnabled, i18n.language]);

  /**
   * Load destinations based on selected origin
   * Since we don't have a getDestinations API, we'll filter from the full locations list
   */
  const loadDestinations = useCallback(async (location: Location | null) => {
    console.log('useLocationData: Loading destinations for location:', location);
    if (location) {
      try {
        setLoading(true);
        // Instead of calling a separate API, we'll filter the locations
        // to exclude the current fromLocation
        const destinationsData = locations.filter(loc => loc.id !== location.id);
        console.log('useLocationData: Filtered destinations:', destinationsData);
        setDestinations(destinationsData);
      } catch (err) {
        console.error("useLocationData: Error loading destinations:", err);
        setError(err instanceof Error ? err : new Error('Failed to load destinations'));
      } finally {
        setLoading(false);
      }
    } else {
      console.log('useLocationData: No origin selected, clearing destinations');
      setDestinations([]);
    }
  }, [locations]);
  
  /**
   * Handler for when the origin location changes
   */
  const handleFromLocationChange = useCallback((location: Location | null) => {
    setFromLocation(location);
    setToLocation(null); // Reset destination when origin changes
    loadDestinations(location);
  }, [loadDestinations]);

  /**
   * Get user's current location and find the nearest bus stop
   */
  const detectUserLocation = useCallback(async (): Promise<Location | null> => {
    if (locations.length === 0 || !autoLocationEnabled) return null;
    
    try {
      setGeoLocationLoading(true);
      
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Find the nearest location from our available locations
      let nearestLocation: Location | null = null;
      let shortestDistance = Number.MAX_VALUE;
      
      locations.forEach(location => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          location.latitude, 
          location.longitude
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestLocation = location;
        }
      });
      
      if (nearestLocation) {
        handleFromLocationChange(nearestLocation);
        return nearestLocation;
      }
    } catch (err) {
      console.error("Geolocation error:", err);
      // Don't set error state here to avoid disrupting the UI
      // Just log the error and continue
    } finally {
      setGeoLocationLoading(false);
    }
    
    return null;
  }, [locations, handleFromLocationChange, autoLocationEnabled]);

  /**
   * Handler for when the destination location changes
   */
  const handleToLocationChange = useCallback((location: Location | null) => {
    setToLocation(location);
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load locations when component mounts or language changes
  useEffect(() => {
    loadLocations();
  }, [loadLocations, i18n.language]);

  return {
    // State
    locations,
    destinations,
    fromLocation,
    toLocation,
    loading,
    error,
    geoLocationLoading,
    autoLocationEnabled,
    
    // Actions
    setFromLocation: handleFromLocationChange,
    setToLocation: handleToLocationChange,
    detectUserLocation,
    clearError,
    toggleAutoLocation
  };
};