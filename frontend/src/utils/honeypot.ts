/**
 * Honeypot fields utility for bot detection
 * These invisible fields help detect automated form submissions
 */

import { getEnv } from '../utils/environment';

// Honeypot field names (must match backend)
export const HONEYPOT_FIELDS = {
  WEBSITE: 'website',
  PHONE_NUMBER: 'phone_number',
  FAX: 'fax',
  COMPANY_URL: 'company_url',
  HP_FIELD: 'hp_field',
} as const;

// Timestamp field for time-based validation
export const FORM_TIMESTAMP_FIELD = '_form_ts';

// Check if honeypot is enabled
export const isHoneypotEnabled = (): boolean => {
  return getEnv('VITE_HONEYPOT_ENABLED', 'true') === 'true';
};

/**
 * Generate honeypot field data structure
 * Call this when the form loads to track submission time
 */
export const initHoneypotData = (): HoneypotData => {
  return {
    [HONEYPOT_FIELDS.WEBSITE]: '',
    [HONEYPOT_FIELDS.PHONE_NUMBER]: '',
    [HONEYPOT_FIELDS.FAX]: '',
    [HONEYPOT_FIELDS.COMPANY_URL]: '',
    [HONEYPOT_FIELDS.HP_FIELD]: '',
    [FORM_TIMESTAMP_FIELD]: Date.now(),
  };
};

/**
 * Validate honeypot data before submission
 * Returns true if the submission appears legitimate
 */
export const validateHoneypot = (data: HoneypotData): ValidationResult => {
  if (!isHoneypotEnabled()) {
    return { isValid: true };
  }

  // Check if any honeypot field was filled (bots fill these)
  const honeypotFields = Object.values(HONEYPOT_FIELDS);
  for (const field of honeypotFields) {
    const value = data[field];
    if (value && String(value).trim() !== '') {
      console.warn('Honeypot field filled:', field);
      return {
        isValid: false,
        reason: 'Invalid submission detected',
      };
    }
  }

  // Check submission timing
  const formLoadTime = data[FORM_TIMESTAMP_FIELD];
  if (formLoadTime) {
    const elapsed = Date.now() - Number(formLoadTime);
    const minTime = 3000; // 3 seconds minimum
    const maxTime = 3600000; // 1 hour maximum

    if (elapsed < minTime) {
      console.warn('Form submitted too quickly:', elapsed, 'ms');
      return {
        isValid: false,
        reason: 'Please take your time filling out the form',
      };
    }

    if (elapsed > maxTime) {
      console.warn('Form submission expired:', elapsed, 'ms');
      return {
        isValid: false,
        reason: 'Form has expired. Please refresh and try again',
      };
    }
  }

  return { isValid: true };
};

/**
 * Clean honeypot fields from data before sending to API
 */
export const cleanHoneypotFields = <T extends Record<string, unknown>>(data: T): Omit<T, keyof typeof HONEYPOT_FIELDS | typeof FORM_TIMESTAMP_FIELD> => {
  const cleaned = { ...data };
  
  // Remove honeypot fields
  Object.values(HONEYPOT_FIELDS).forEach(field => {
    delete (cleaned as Record<string, unknown>)[field];
  });
  
  // Remove timestamp field
  delete (cleaned as Record<string, unknown>)[FORM_TIMESTAMP_FIELD];
  
  return cleaned as Omit<T, keyof typeof HONEYPOT_FIELDS | typeof FORM_TIMESTAMP_FIELD>;
};

/**
 * Get CSS for hiding honeypot fields
 * Use this style to make fields invisible to humans but visible to bots
 */
export const getHoneypotStyle = (): React.CSSProperties => ({
  position: 'absolute',
  left: '-9999px',
  top: '-9999px',
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none',
});

// Types
export interface HoneypotData {
  [HONEYPOT_FIELDS.WEBSITE]: string;
  [HONEYPOT_FIELDS.PHONE_NUMBER]: string;
  [HONEYPOT_FIELDS.FAX]: string;
  [HONEYPOT_FIELDS.COMPANY_URL]: string;
  [HONEYPOT_FIELDS.HP_FIELD]: string;
  [FORM_TIMESTAMP_FIELD]: number;
  [key: string]: string | number;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export default {
  HONEYPOT_FIELDS,
  FORM_TIMESTAMP_FIELD,
  initHoneypotData,
  validateHoneypot,
  cleanHoneypotFields,
  getHoneypotStyle,
  isHoneypotEnabled,
};
