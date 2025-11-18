/**
 * Types for Bus Timing Image Contributions
 */

export type TimingImageStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';

export interface ExtractedTiming {
  destination: string;
  destinationTamil?: string;
  morningTimings: string[];  // காலை
  afternoonTimings: string[]; // மாலை
  nightTimings: string[];     // இரவு
}

export interface TimingImageContribution {
  id?: number;
  userId?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  originLocation: string;
  originLocationTamil?: string;
  originLatitude?: number;
  originLongitude?: number;
  boardType?: 'GOVERNMENT' | 'PRIVATE' | 'LOCAL' | 'INTER_CITY';
  description?: string;
  submissionDate?: string;
  status: TimingImageStatus;
  validationMessage?: string;
  processedDate?: string;
  processedBy?: string;
  submittedBy?: string;
  extractedTimings?: ExtractedTiming[];
  ocrConfidence?: number;
  requiresManualReview?: boolean;
  duplicateCheckStatus?: 'CHECKED' | 'DUPLICATES_FOUND' | 'UNIQUE' | 'SKIPPED';
  mergedRecords?: number;
  createdRecords?: number;
}

export interface TimingExtractionResult {
  origin: string;
  originTamil?: string;
  timings: ExtractedTiming[];
  confidence: number;
  rawText?: string;
  warnings?: string[];
}

export interface BusTimingRecord {
  id?: number;
  busNumber?: string;
  fromLocationId: number;
  fromLocationName: string;
  toLocationId: number;
  toLocationName: string;
  departureTime: string;
  arrivalTime?: string;
  timingType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  source: 'USER_CONTRIBUTION' | 'OFFICIAL' | 'OCR_EXTRACTED';
  contributionId?: number;
  verified: boolean;
  lastUpdated?: string;
}
