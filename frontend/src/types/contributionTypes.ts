// Type definitions for route and image contributions

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BaseContribution {
  id: string | number; // Allow both string and number types for id
  status: ContributionStatus;
  submissionDate: string;
  userId?: string;
}

export interface RouteContribution extends BaseContribution {
  busNumber: string;
  busName?: string;
  fromLocationName: string;
  toLocationName: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: Array<{
    name: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  rejectionReason?: string;
}

export interface ImageContribution extends BaseContribution {
  busNumber: string;
  busName?: string;
  fromLocationName?: string;
  toLocationName?: string;
  imageUrl: string;
  imageDescription?: string; // Added missing field
  notes?: string;
  rejectionReason?: string;
}