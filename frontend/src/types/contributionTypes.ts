/**
 * Types for user contributions
 */

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StopContribution {
  stopOrder: number;
  name: string;
  latitude?: number;
  longitude?: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface RouteContribution {
  id?: number;
  userId?: string;
  busNumber: string;
  busName: string;
  fromLocationName: string;
  toLocationName: string;
  fromLatitude?: number;
  fromLongitude?: number;
  toLatitude?: number;
  toLongitude?: number;
  departureTime: string;
  arrivalTime: string;
  stops?: StopContribution[];
  submissionDate?: string;
  status?: ContributionStatus;
  validationMessage?: string;
  processedDate?: string;
  source?: string;
}

export interface ImageContribution {
  id?: number;
  userId?: string;
  busNumber: string;
  imageUrl?: string;
  description?: string;
  imageDescription?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  captureDate?: string;
  submissionDate?: string;
  status?: ContributionStatus;
  validationMessage?: string;
  processedDate?: string;
}