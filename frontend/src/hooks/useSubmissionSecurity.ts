/**
 * useSubmissionSecurity Hook
 * Combines honeypot, reCAPTCHA, and API key security for form submissions
 */

import { useState, useCallback, useEffect } from 'react';
import { initHoneypotData, validateHoneypot, cleanHoneypotFields } from '../utils/honeypot';
import type { HoneypotData } from '../utils/honeypot';
import { getRecaptchaToken, isRecaptchaAvailable, loadRecaptchaScript } from '../services/recaptchaService';
import { getApiKeyHeader } from '../services/apiKeyService';

interface SubmissionSecurityResult {
  /** Honeypot data to include in form state */
  honeypotData: HoneypotData;
  /** Update honeypot field value */
  setHoneypotField: (field: string, value: string) => void;
  /** Validate and prepare data for submission */
  prepareSubmission: <T extends Record<string, unknown>>(
    data: T,
    action?: string
  ) => Promise<PreparedSubmission<T>>;
  /** Check if security features are loading */
  isLoading: boolean;
  /** Error message if security validation fails */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

interface PreparedSubmission<T> {
  /** Whether the submission passed security checks */
  isValid: boolean;
  /** Cleaned data (without honeypot fields) */
  data: T;
  /** Headers to include in the request */
  headers: Record<string, string>;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Hook for managing submission security
 * Use this in any form that accepts user submissions
 */
export const useSubmissionSecurity = (): SubmissionSecurityResult => {
  const [honeypotData, setHoneypotData] = useState<HoneypotData>(() => initHoneypotData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reCAPTCHA script on mount if enabled
  useEffect(() => {
    if (isRecaptchaAvailable()) {
      loadRecaptchaScript().catch(err => {
        console.warn('Failed to load reCAPTCHA:', err);
      });
    }
  }, []);

  // Update honeypot field
  const setHoneypotField = useCallback((field: string, value: string) => {
    setHoneypotData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Prepare submission with all security checks
  const prepareSubmission = useCallback(async <T extends Record<string, unknown>>(
    data: T,
    action: string = 'submit'
  ): Promise<PreparedSubmission<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Validate honeypot
      const honeypotResult = validateHoneypot(honeypotData);
      if (!honeypotResult.isValid) {
        setError(honeypotResult.reason || 'Security validation failed');
        return {
          isValid: false,
          data: data,
          headers: {},
          error: honeypotResult.reason,
        };
      }

      // 2. Get reCAPTCHA token
      let recaptchaToken: string | null = null;
      if (isRecaptchaAvailable()) {
        try {
          recaptchaToken = await getRecaptchaToken(action);
        } catch (err) {
          console.warn('reCAPTCHA failed:', err);
          // Don't fail the submission if reCAPTCHA fails
          // The backend will decide how to handle missing tokens
        }
      }

      // 3. Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getApiKeyHeader(),
      };

      // Add reCAPTCHA token to headers if available
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }

      // Add form timestamp for server-side time validation
      headers['X-Form-Timestamp'] = String(honeypotData._form_ts);

      // 4. Clean data (remove honeypot fields)
      const mergedData = { ...data, ...honeypotData };
      const cleanedData = cleanHoneypotFields(mergedData) as T;

      // 5. Reset honeypot for next submission
      setHoneypotData(initHoneypotData());

      return {
        isValid: true,
        data: cleanedData,
        headers,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Security validation failed';
      setError(errorMessage);
      return {
        isValid: false,
        data: data,
        headers: {},
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [honeypotData]);

  return {
    honeypotData,
    setHoneypotField,
    prepareSubmission,
    isLoading,
    error,
    clearError,
  };
};

export default useSubmissionSecurity;
