import { logger } from '../utils/logger';
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
let loadPromise: Promise<void> | null = null;

/**
 * Load the reCAPTCHA script dynamically
 */
export const loadRecaptchaScript = (): Promise<void> => {
  if (!isRecaptchaEnabled()) {
    return Promise.resolve();
  }

  if (scriptLoaded && typeof window.grecaptcha !== 'undefined') {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (scriptLoading && loadPromise) {
    return loadPromise;
  }

  scriptLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
    if (existingScript) {
      // Script exists, wait for grecaptcha to be available
      const checkReady = setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
          clearInterval(checkReady);
          scriptLoaded = true;
          scriptLoading = false;
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        scriptLoading = false;
        if (typeof window.grecaptcha === 'undefined') {
          logger.warn('reCAPTCHA script exists but grecaptcha not available');
          resolve(); // Resolve anyway to not block forms
        } else {
          scriptLoaded = true;
          resolve();
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for grecaptcha to be ready
      const checkReady = setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
          clearInterval(checkReady);
          scriptLoaded = true;
          scriptLoading = false;
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        scriptLoading = false;
        if (typeof window.grecaptcha === 'undefined') {
          logger.warn('reCAPTCHA loaded but grecaptcha not defined');
          resolve(); // Resolve anyway to not block forms
        } else {
          scriptLoaded = true;
          resolve();
        }
      }, 5000);
    };

    script.onerror = (error) => {
      scriptLoading = false;
      loadPromise = null;
      logger.error('Failed to load reCAPTCHA script', { error });
      resolve(); // Resolve instead of reject to not block forms
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Execute reCAPTCHA and get token
 * @param action - The action name for this verification (e.g., 'submit_contribution')
 * @returns Promise<string | null> - The reCAPTCHA token or null if disabled/failed
 */
export const executeRecaptcha = async (action: string = 'submit'): Promise<string | null> => {
  if (!isRecaptchaEnabled()) {
    logger.debug('reCAPTCHA is disabled');
    return null;
  }

  try {
    await loadRecaptchaScript();

    // Check if grecaptcha is available
    if (typeof window.grecaptcha === 'undefined') {
      logger.warn('reCAPTCHA not loaded, continuing without token');
      return null;
    }

    return new Promise((resolve) => {
      try {
        window.grecaptcha.ready(() => {
          try {
            window.grecaptcha
              .execute(SITE_KEY, { action })
              .then((token: string) => {
                resolve(token);
              })
              .catch((error: Error) => {
                logger.error('reCAPTCHA execution error:', error);
                resolve(null); // Return null instead of rejecting to not block forms
              });
          } catch (innerError) {
            logger.error('reCAPTCHA execute call error:', innerError);
            resolve(null);
          }
        });
      } catch (readyError) {
        logger.error('reCAPTCHA ready call error:', readyError);
        resolve(null);
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        logger.warn('reCAPTCHA execution timeout');
        resolve(null);
      }, 5000);
    });
  } catch (error) {
    logger.error('reCAPTCHA error:', error);
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
    logger.warn('Failed to get reCAPTCHA token:', { error: error instanceof Error ? error.message : String(error) });
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
