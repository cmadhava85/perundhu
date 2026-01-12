/**
 * TypeScript interfaces for grouped location search responses
 */

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
export function isGroupedResponse(data: any): data is LocationGroupDTO[] {
  return Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('cityName');
}
