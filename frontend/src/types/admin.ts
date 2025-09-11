/**
 * Type for contribution status values
 */
export const ContributionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type ContributionStatus = typeof ContributionStatus[keyof typeof ContributionStatus];

/**
 * Interface for route contributions
 */
export interface RouteContribution {
  id: number;
  busNumber: string;
  fromLocationName: string;
  toLocationName: string;
  stops?: string;
  frequency?: string;
  operatingHours?: string;
  fare?: string;
  submissionDate: string;
  status: ContributionStatus;
  submittedBy?: string;
  rejectionReason?: string;
}

/**
 * Interface for image contributions
 */
export interface ImageContribution {
  id?: number;
  userId?: string;
  imageUrl?: string;
  description?: string;
  submissionDate?: string;
  status?: string;
  validationMessage?: string;
  processedDate?: string;
  extractedData?: string;
  submittedBy?: string;
  location?: string;
}