import axios from 'axios';
import type { TimingImageContribution, TimingExtractionResult } from '../types/busTimingTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Service for bus timing image contributions
 */
export const busTimingService = {
  /**
   * Upload a bus timing board image
   */
  async uploadTimingImage(
    file: File,
    originLocation: string,
    originLocationTamil?: string,
    description?: string
  ): Promise<TimingImageContribution> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('originLocation', originLocation);
    if (originLocationTamil) {
      formData.append('originLocationTamil', originLocationTamil);
    }
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post(
      `${API_URL}/api/v1/contributions/timing-images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Get all pending timing image contributions (admin)
   */
  async getPendingContributions(): Promise<TimingImageContribution[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/contributions/timing-images/pending`
    );
    return response.data;
  },

  /**
   * Get all timing image contributions with filters
   */
  async getContributions(
    status?: string,
    userId?: string
  ): Promise<TimingImageContribution[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (userId) params.append('userId', userId);

    const response = await axios.get(
      `${API_URL}/api/v1/contributions/timing-images?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a specific timing image contribution
   */
  async getContribution(id: number): Promise<TimingImageContribution> {
    const response = await axios.get(
      `${API_URL}/api/v1/contributions/timing-images/${id}`
    );
    return response.data;
  },

  /**
   * Extract timings from image using OCR (admin)
   */
  async extractTimings(id: number): Promise<TimingExtractionResult> {
    const response = await axios.post(
      `${API_URL}/api/v1/admin/contributions/timing-images/${id}/extract`
    );
    return response.data;
  },

  /**
   * Approve timing image contribution and update database (admin)
   */
  async approveContribution(
    id: number,
    extractedTimings?: TimingExtractionResult
  ): Promise<TimingImageContribution> {
    const response = await axios.post(
      `${API_URL}/api/v1/admin/contributions/timing-images/${id}/approve`,
      extractedTimings
    );
    return response.data;
  },

  /**
   * Reject timing image contribution (admin)
   */
  async rejectContribution(
    id: number,
    reason: string
  ): Promise<TimingImageContribution> {
    const response = await axios.post(
      `${API_URL}/api/v1/admin/contributions/timing-images/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Get user's timing image contributions
   */
  async getMyContributions(userId: string): Promise<TimingImageContribution[]> {
    const response = await axios.get(
      `${API_URL}/api/v1/contributions/timing-images/user/${userId}`
    );
    return response.data;
  },

  /**
   * Delete a timing image contribution
   */
  async deleteContribution(id: number): Promise<void> {
    await axios.delete(
      `${API_URL}/api/v1/contributions/timing-images/${id}`
    );
  },

  /**
   * Update extracted timings for a contribution (admin)
   */
  async updateExtractedTimings(
    id: number,
    extractionResult: TimingExtractionResult
  ): Promise<TimingImageContribution> {
    const response = await axios.put(
      `${API_URL}/api/v1/admin/contributions/timing-images/${id}/timings`,
      extractionResult
    );
    return response.data;
  },

  /**
   * Check for duplicate timings before approval (admin)
   */
  async checkDuplicates(id: number): Promise<{
    hasDuplicates: boolean;
    duplicateCount: number;
    conflicts: Array<{
      destination: string;
      existingTiming: string;
      newTiming: string;
    }>;
  }> {
    const response = await axios.get(
      `${API_URL}/api/v1/admin/contributions/timing-images/${id}/check-duplicates`
    );
    return response.data;
  },
};

export default busTimingService;
