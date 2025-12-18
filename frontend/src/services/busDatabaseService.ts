import axios from 'axios';
import AdminService from './adminService';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface BusListItem {
  id: number;
  busNumber: string;
  name: string;
  origin: string | null;
  destination: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  category: string | null;
  stopCount: number;
  active: boolean;
}

export interface StopDetail {
  id: number;
  name: string;
  locationId: number | null;
  locationName: string;
  stopOrder: number;
  arrivalTime: string | null;
  departureTime: string | null;
}

export interface BusDetail {
  id: number;
  busNumber: string;
  name: string;
  origin: string | null;
  originId: number | null;
  destination: string | null;
  destinationId: number | null;
  departureTime: string | null;
  arrivalTime: string | null;
  category: string | null;
  capacity: number | null;
  active: boolean;
  stops: StopDetail[];
}

export interface PagedBusResponse {
  content: BusListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface LocationSuggestion {
  id: number;
  name: string;
  district: string | null;
}

export interface BusFilters {
  search?: string;
  origin?: string;
  destination?: string;
  activeOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface StopInput {
  locationName: string;
  stopOrder?: number;
  arrivalTime?: string;
  departureTime?: string;
}

/**
 * Service for bus database admin operations
 */
const BusDatabaseService = {
  /**
   * Get paginated list of buses with filters
   */
  async getBuses(filters: BusFilters = {}): Promise<PagedBusResponse> {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.origin) params.append('origin', filters.origin);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.activeOnly !== undefined) params.append('activeOnly', filters.activeOnly.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/buses?${params.toString()}`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get bus details by ID including stops
   */
  async getBusById(busId: number): Promise<BusDetail> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/buses/${busId}`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get stops for a specific bus
   */
  async getStopsForBus(busId: number): Promise<StopDetail[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/buses/${busId}/stops`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Update bus timing
   */
  async updateBusTiming(
    busId: number,
    departureTime?: string,
    arrivalTime?: string
  ): Promise<{ success: boolean; message: string; bus: BusDetail }> {
    const response = await axios.put(
      `${API_URL}/api/v1/admin/bus-database/buses/${busId}/timing`,
      { departureTime, arrivalTime },
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Toggle bus active status
   */
  async toggleBusActive(
    busId: number,
    active: boolean
  ): Promise<{ success: boolean; message: string; bus: BusDetail }> {
    const response = await axios.put(
      `${API_URL}/api/v1/admin/bus-database/buses/${busId}/active`,
      { active },
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Add a new stop to a bus
   */
  async addStop(
    busId: number,
    stop: StopInput
  ): Promise<{ success: boolean; message: string; stop: StopDetail }> {
    const response = await axios.post(
      `${API_URL}/api/v1/admin/bus-database/buses/${busId}/stops`,
      stop,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Update an existing stop
   */
  async updateStop(
    stopId: number,
    stop: StopInput
  ): Promise<{ success: boolean; message: string; stop: StopDetail }> {
    const response = await axios.put(
      `${API_URL}/api/v1/admin/bus-database/stops/${stopId}`,
      stop,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete a stop
   */
  async deleteStop(stopId: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(
      `${API_URL}/api/v1/admin/bus-database/stops/${stopId}`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get unique origins for filter dropdown
   */
  async getUniqueOrigins(): Promise<string[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/filters/origins`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Get unique destinations for filter dropdown
   */
  async getUniqueDestinations(): Promise<string[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/filters/destinations`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },

  /**
   * Search locations for autocomplete
   */
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/bus-database/locations/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': AdminService.getAuthHeader(),
        },
      }
    );
    return response.data;
  },
};

export default BusDatabaseService;
