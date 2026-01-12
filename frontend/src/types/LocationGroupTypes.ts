/**
 * TypeScript interfaces for grouped location search responses
 */

import type { LocationSuggestion } from '../services/locationAutocompleteService';

export interface LocationGroupDTO {
  cityName: string;
  cityOption?: LocationSuggestion;
  busStands: LocationSuggestion[];
  neighborhoods: LocationSuggestion[];
}

export interface LocationGroupedSearchResponseDTO {
  groups: LocationGroupDTO[];
  totalCount: number;
}

/**
 * Type guard to check if a response is grouped format
 */
export function isGroupedResponse(data: unknown): data is LocationGroupDTO[] {
  return Array.isArray(data) && data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'cityName');
}
