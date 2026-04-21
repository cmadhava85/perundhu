import { api } from './api';
import { ApiError, handleApiError } from './http/apiError';
import { logger } from '../utils/logger';
import type { Bus, Stop, Location, ConnectingRoute } from '../types/index';

// ─── Internal DTOs ────────────────────────────────────────────────────────────

interface BusDTO {
  id: number;
  number: string;
  name: string;
  operator: string;
  type: string;
  departureTime?: string;
  arrivalTime?: string;
  rating?: number;
  features?: Record<string, string>;
  fromLocationId?: number;
  fromLocationName?: string;
  fromLocationNameTranslated?: string;
  toLocationId?: number;
  toLocationName?: string;
  toLocationNameTranslated?: string;
}

interface StopDTO {
  id: number;
  name: string;
  translatedName?: string;
  arrivalTime?: string;
  departureTime?: string;
  sequence?: number;
  platform?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  locationId?: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const FALLBACK_DEPARTURE_TIMES = [
  '06:00', '07:30', '09:15', '11:00', '13:45', '16:20', '18:30', '20:15',
];

const transformBusDTOToBus = (
  busDTO: BusDTO,
  fromLocation: Location,
  toLocation: Location
): Bus => {
  let departureTime = busDTO.departureTime;
  const arrivalTime = busDTO.arrivalTime;

  if (!departureTime) {
    departureTime = FALLBACK_DEPARTURE_TIMES[busDTO.id % FALLBACK_DEPARTURE_TIMES.length];
    logger.debug(`Bus ${busDTO.id}: No departureTime from backend, using fallback: ${departureTime}`);
  }

  if (!arrivalTime) {
    logger.debug(`Bus ${busDTO.id}: No arrivalTime from backend, leaving blank (avoid inaccurate calculation)`);
  }

  let duration = '';
  if (departureTime && arrivalTime) {
    const [depH, depM] = departureTime.split(':').map(Number);
    const [arrH, arrM] = arrivalTime.split(':').map(Number);
    let hours = arrH - depH;
    let minutes = arrM - depM;
    if (hours < 0) hours += 24;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    duration = `${hours}h ${minutes}m`;
  }

  const fromName = busDTO.fromLocationNameTranslated || busDTO.fromLocationName || fromLocation.name;
  const toName = busDTO.toLocationNameTranslated || busDTO.toLocationName || toLocation.name;
  const corporation = (busDTO.operator || '').trim() || (busDTO.type || '').trim();

  return {
    id: busDTO.id,
    busName: busDTO.name || corporation || 'Unknown Bus',
    busNumber: busDTO.number || 'N/A',
    from: fromName,
    to: toName,
    fromLocationId: busDTO.fromLocationId || fromLocation.id,
    toLocationId: busDTO.toLocationId || toLocation.id,
    fromLocation: fromLocation,
    toLocation: toLocation,
    departureTime: departureTime || '',
    arrivalTime: arrivalTime || '',
    category: busDTO.type || 'Express Service',
    busType: busDTO.type || 'Express Service',
    corporation: corporation || undefined,
    status: busDTO.id % 3 === 0 ? 'Delayed' : 'On Time',
    duration: duration,
    name: busDTO.name,
    routeName: `${fromName} - ${toName}`,
    isLive: false,
    availability: 'available' as const,
    capacity: 40 + (busDTO.id % 20),
    rating: busDTO.rating,
  };
};

const transformStopDTOToStop = (stopDTO: StopDTO, busId: number): Stop => ({
  id: stopDTO.id,
  name: stopDTO.name,
  translatedName: stopDTO.translatedName || stopDTO.name,
  arrivalTime: stopDTO.arrivalTime || '',
  departureTime: stopDTO.departureTime || '',
  order: stopDTO.sequence || 0,
  stopOrder: stopDTO.sequence || 0,
  busId: busId,
  platform: stopDTO.platform,
  status: stopDTO.status,
  locationId: stopDTO.locationId,
  latitude: stopDTO.latitude,
  longitude: stopDTO.longitude,
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search for buses between two locations.
 * Enriches each result with real stop timing data for the user's segment.
 */
export const searchBuses = async (
  fromLocation: Location,
  toLocation: Location,
  includeContinuing = false,
  languageCode = 'en'
): Promise<Bus[]> => {
  try {
    console.log('🔍 API searchBuses called with:');
    console.log('  From:', fromLocation.name, '(ID:', fromLocation.id, ')');
    console.log('  To:', toLocation.name, '(ID:', toLocation.id, ')');
    console.log('  Include Continuing:', includeContinuing);

    const isFromOSM = fromLocation.id < 0;
    const isToOSM = toLocation.id < 0;

    if (isFromOSM || isToOSM) {
      logger.debug('🌍 OpenStreetMap location detected, searching by coordinates');
      logger.warn('⚠️ OpenStreetMap locations not yet supported for bus search');
      throw new ApiError(
        `Currently, we can only search between locations in our database. "${isFromOSM ? fromLocation.name : toLocation.name}" is not in our system yet. Please try selecting a nearby city that appears with a 🚍 icon.`,
        400,
        'OSM_LOCATION_NOT_SUPPORTED'
      );
    }

    const response = await api.get('/v1/bus-schedules/search', {
      params: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        includeContinuing,
        lang: languageCode,
      },
    });

    const busDTOs: BusDTO[] = response.data.items || response.data || [];
    const buses: Bus[] = busDTOs.map(busDTO =>
      transformBusDTOToBus(busDTO, fromLocation, toLocation)
    );

    const computeDuration = (dep: string, arr: string): string => {
      if (!dep || !arr) return '';
      const [depH, depM] = dep.split(':').map(Number);
      const [arrH, arrM] = arr.split(':').map(Number);
      let hours = arrH - depH;
      let minutes = arrM - depM;
      if (hours < 0) hours += 24;
      if (minutes < 0) { hours -= 1; minutes += 60; }
      return `${hours}h ${minutes}m`;
    };

    for (const bus of buses) {
      try {
        const stops = await getStops(bus.id, languageCode);
        if (stops.length > 0) {
          const stopMatches = (s: Stop, loc: Location): boolean => {
            if (s.locationId && s.locationId === loc.id) return true;
            const sName = (s.name || '').toLowerCase();
            const sTranslated = (s.translatedName || '').toLowerCase();
            const locName = (loc.name || '').toLowerCase();
            return sName === locName || sName.includes(locName) || sTranslated.includes(locName);
          };

          const fromStop = stops.find(s => stopMatches(s, fromLocation));
          const toStop = stops.find(s => stopMatches(s, toLocation));

          const newDeparture = fromStop?.departureTime || stops[0].departureTime || bus.departureTime;
          const newArrival = toStop?.arrivalTime || stops[stops.length - 1].arrivalTime || bus.arrivalTime;
          bus.departureTime = newDeparture || bus.departureTime;
          bus.arrivalTime = newArrival || bus.arrivalTime;
          bus.duration = computeDuration(bus.departureTime, bus.arrivalTime);
        }
      } catch (error) {
        logger.warn(`Failed to fetch stops for bus ${bus.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.debug(`Transformed buses with real stops: ${buses.length} buses`);
    return buses;
  } catch (error) {
    logger.error('Error searching buses:', error);
    if (error instanceof ApiError && error.errorCode === 'OSM_LOCATION_NOT_SUPPORTED') {
      throw error;
    }
    throw new ApiError('Failed to search for buses. Please try again.');
  }
};

/**
 * Search for buses that pass through both locations as intermediate stops.
 */
export const searchBusesViaStops = async (
  fromLocation: Location | number,
  toLocation: Location | number
): Promise<Bus[]> => {
  try {
    const fromId = typeof fromLocation === 'number' ? fromLocation : fromLocation.id;
    const toId = typeof toLocation === 'number' ? toLocation : toLocation.id;
    const fromLoc = typeof fromLocation === 'object' ? fromLocation : ({ id: fromId, name: 'Unknown' } as Location);
    const toLoc = typeof toLocation === 'object' ? toLocation : ({ id: toId, name: 'Unknown' } as Location);

    const response = await api.get('/v1/bus-schedules/search-via-stops', {
      params: { fromLocationId: fromId, toLocationId: toId },
    });

    const busDTOs: BusDTO[] = Array.isArray(response.data)
      ? response.data
      : response.data.items || response.data || [];

    return busDTOs.map(busDTO => transformBusDTOToBus(busDTO, fromLoc, toLoc));
  } catch (error) {
    logger.error('Error searching buses via stops:', error);
    throw new ApiError('Failed to search for buses via stops. Please try again.');
  }
};

/**
 * Get all stops for a specific bus.
 */
export const getStops = async (busId: number, languageCode = 'en'): Promise<Stop[]> => {
  try {
    logger.debug(`Fetching stops for bus ${busId} with language ${languageCode}`);
    const response = await api.get(`/v1/bus-schedules/buses/${busId}/stops/basic`, {
      params: { lang: languageCode },
    });
    logger.debug('Stops API response:', response.data);
    const stops: Stop[] = (response.data as StopDTO[]).map(dto => transformStopDTOToStop(dto, busId));
    logger.debug(`Transformed stops: ${stops.length} stops`);
    return stops;
  } catch (error) {
    logger.error(`Error fetching stops for bus ${busId}:`, error);
    throw new ApiError(`Failed to fetch bus stops for bus ID ${busId}. Please try again.`);
  }
};

/**
 * Get connecting routes between two locations.
 */
export const getConnectingRoutes = async (
  fromLocation: Location | number,
  toLocation: Location | number
): Promise<ConnectingRoute[]> => {
  try {
    const fromId = typeof fromLocation === 'number' ? fromLocation : fromLocation.id;
    const toId = typeof toLocation === 'number' ? toLocation : toLocation.id;
    const response = await api.get('/v1/bus-schedules/connecting-routes', {
      params: { fromLocationId: fromId, toLocationId: toId },
    });
    return response.data;
  } catch (error) {
    logger.error('Error fetching connecting routes:', error);
    throw new ApiError('Failed to fetch connecting routes. Please try again.');
  }
};

// Re-export handleApiError for callers that imported it alongside bus functions
export { handleApiError };
