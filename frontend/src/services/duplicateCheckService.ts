import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface DuplicateCheckRequest {
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  busNumber?: string;
}

export interface MatchedBusInfo {
  busId: number | null;
  busNumber: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  departureTime: string | null;
  matchType: 'EXACT_MATCH' | 'POSSIBLE_DUPLICATE' | 'PASSES_THROUGH' | 'SAME_BUS_DIFFERENT_TIME' | 'NO_MATCH';
  details: string;
  confidenceScore: number;
}

export interface DuplicateCheckResponse {
  hasPotentialDuplicates: boolean;
  message: string;
  matches: MatchedBusInfo[];
}

/**
 * Check for potential duplicate routes before submission.
 * This is a "soft check" - it suggests matches but doesn't block submission.
 */
export async function checkForDuplicates(request: DuplicateCheckRequest): Promise<DuplicateCheckResponse> {
  try {
    const response = await axios.post<DuplicateCheckResponse>(
      `${API_URL}/api/v1/duplicates/check`,
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    // Return no duplicates on error - don't block submission
    return {
      hasPotentialDuplicates: false,
      message: 'Could not check for duplicates',
      matches: []
    };
  }
}

/**
 * Get match type display text for UI
 */
export function getMatchTypeLabel(matchType: MatchedBusInfo['matchType']): string {
  switch (matchType) {
    case 'EXACT_MATCH':
      return 'Same bus found';
    case 'POSSIBLE_DUPLICATE':
      return 'Similar route (different bus number)';
    case 'PASSES_THROUGH':
      return 'Passes through this destination';
    case 'SAME_BUS_DIFFERENT_TIME':
      return 'Same bus, different time';
    default:
      return 'Match found';
  }
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 80) {
    return { label: 'High confidence', color: 'text-red-600' };
  } else if (score >= 50) {
    return { label: 'Medium confidence', color: 'text-yellow-600' };
  } else {
    return { label: 'Low confidence', color: 'text-gray-600' };
  }
}
