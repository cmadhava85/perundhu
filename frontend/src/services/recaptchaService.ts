/**
 * Google reCAPTCHA v3 Service
 * Provides invisible bot protection for form submissions
 */

import { getEnv } from '../utils/environment';

// reCAPTCHA site key from environment
const SITE_KEY = getEnv('VITE_RECAPTCHA_SITE_KEY', '');

// Check if reCAPTCHA is enabled
const isRecaptchaEnabled = (): boolean => {
  return getEnv('VITE_RECAPTCHA_ENABLED', 'false') === 'true' && SITE_KEY !== '';
};

// Track if script is loaded
let scriptLoaded = false;
let scriptLoading = false;

/**
 * Load the reCAPTCHA script dynamically
 */
export const loadRecaptchaScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isRecaptchaEnabled()) {
      resolve();
      return;
    }

    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      // Wait for existing load
      const checkLoaded = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Execute reCAPTCHA and get token
 * @param action - The action name for this verification (e.g., 'submit_contribution')
 * @returns Promise<string | null> - The reCAPTCHA token or null if disabled/failed
 */
export const executeRecaptcha = async (action: string = 'submit'): Promise<string | null> => {
  if (!isRecaptchaEnabled()) {
    console.debug('reCAPTCHA is disabled');
    return null;
  }

  try {
    await loadRecaptchaScript();

    // Wait for grecaptcha to be ready
    if (typeof window.grecaptcha === 'undefined') {
      throw new Error('reCAPTCHA not loaded');
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: Error) => {
            console.error('reCAPTCHA execution error:', error);
            reject(error);
          });
      });
    });
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return null;
  }
};

/**
 * Get reCAPTCHA token for form submission
 * Returns null if reCAPTCHA is not enabled, allowing forms to work without it
 */
export const getRecaptchaToken = async (action: string = 'submit'): Promise<string | null> => {
  try {
    return await executeRecaptcha(action);
  } catch (error) {
    console.warn('Failed to get reCAPTCHA token:', error);
    return null;
  }
};

/**
 * Check if reCAPTCHA is available
 */
export const isRecaptchaAvailable = (): boolean => {
  return isRecaptchaEnabled();
};

// Type declaration for grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default {
  loadRecaptchaScript,
  executeRecaptcha,
  getRecaptchaToken,
  isRecaptchaAvailable,
};
