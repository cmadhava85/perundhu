/**
 * Types for user contributions
 */

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StopContribution {
  stopOrder: number;
  name: string;
  locationName?: string; // Alternative field name from some API responses
  translatedName?: string;
  taName?: string;
  translations?: {
    [key: string]: {
      name: string;
      [key: string]: string | undefined;
    };
  };
  latitude?: number;
  longitude?: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface RouteContribution {
  id?: number;
  userId?: string;
  busName?: string;
  busNumber: string;
  fromLocationName: string;
  fromLocationTranslatedName?: string;
  fromLocationTaName?: string;
  fromLatitude?: number;
  fromLongitude?: number;
  toLocationName: string;
  toLocationTranslatedName?: string;
  toLocationTaName?: string;
  toLatitude?: number;
  toLongitude?: number;
  departureTime?: string;
  arrivalTime?: string;
  scheduleInfo?: string;
  submissionDate?: string;
  status?: ContributionStatus;
  validationMessage?: string;
  processedDate?: string;
  additionalNotes?: string;
  submittedBy?: string;
  stops?: StopContribution[];
  // Fields for stop contributions to existing routes
  sourceBusId?: number;
  contributionType?: 'NEW_ROUTE' | 'ADD_STOPS';
  // Legacy fields kept for backward compatibility with frontend forms
  route?: string;
  origin?: string;
  destination?: string;
}

export interface ImageContribution {
  id?: number;
  userId?: string;
  busNumber?: string;
  imageUrl?: string;
  description?: string;
  submissionDate?: string;
  status?: ContributionStatus;
  validationMessage?: string;
  processedDate?: string;
  extractedData?: string;
  submittedBy?: string;
}