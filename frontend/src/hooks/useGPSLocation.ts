import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { findNearbyLocationFromGPS, checkLocationPermission } from '../services/nearbyLocationService';
import { getGeolocationSupport } from '../services/geolocation';
import type { Location as AppLocation } from '../types';

export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface GPSLocationResult {
  location: AppLocation;
  distance?: number;
}

export interface UseGPSLocationOptions {
  /** Called when GPS successfully resolves a location */
  onLocationDetected?: (result: GPSLocationResult) => void;
  /** Whether to auto-detect on mount if permission is already granted */
  autoDetectIfGranted?: boolean;
  /** Whether the "from" field is already populated (skip auto-detect if so) */
  hasExistingLocation?: boolean;
}

export interface UseGPSLocationReturn {
  isGettingLocation: boolean;
  locationPermission: LocationPermission;
  locationError: string | null;
  gpsSupported: boolean;
  isFromGPS: boolean;
  setIsFromGPS: (value: boolean) => void;
  handleUseMyLocation: () => Promise<void>;
  clearLocationError: () => void;
}

export function useGPSLocation({
  onLocationDetected,
  autoDetectIfGranted = true,
  hasExistingLocation = false,
}: UseGPSLocationOptions = {}): UseGPSLocationReturn {
  const { t } = useTranslation();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('unknown');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsSupported, setGpsSupported] = useState(true);
  const [isFromGPS, setIsFromGPS] = useState(false);

  const handleUseMyLocation = useCallback(async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const result = await findNearbyLocationFromGPS();

      if (result.success && result.location) {
        setLocationPermission('granted');
        setIsFromGPS(true);
        onLocationDetected?.({ location: result.location, distance: result.distance });
      } else {
        const errorMsg = result.error || t('location.error', 'Could not detect your location');
        setLocationError(errorMsg);
        setTimeout(() => setLocationError(null), 5000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLocationError(errorMessage);
      setTimeout(() => setLocationError(null), 5000);
    } finally {
      setIsGettingLocation(false);
    }
  }, [onLocationDetected, t]);

  // Check GPS support and permission on mount, auto-detect if already granted
  useEffect(() => {
    const checkGpsStatus = async () => {
      const supported = getGeolocationSupport();
      setGpsSupported(supported);

      if (supported) {
        const permission = await checkLocationPermission();
        setLocationPermission(permission);

        if (autoDetectIfGranted && permission === 'granted' && !hasExistingLocation) {
          handleUseMyLocation();
        }
      }
    };

    checkGpsStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearLocationError = useCallback(() => setLocationError(null), []);

  return {
    isGettingLocation,
    locationPermission,
    locationError,
    gpsSupported,
    isFromGPS,
    setIsFromGPS,
    handleUseMyLocation,
    clearLocationError,
  };
}
