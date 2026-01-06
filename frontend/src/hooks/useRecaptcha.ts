import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Custom hook for reCAPTCHA Enterprise token generation
 * Handles all reCAPTCHA operations with proper error handling
 * 
 * @returns Object with token generation function and loading state
 */
export const useRecaptcha = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const isEnterprise = import.meta.env.VITE_RECAPTCHA_ENTERPRISE === 'true';
  const isEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED === 'true';
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    if (!isEnabled || !isEnterprise) return;

    if (!readyPromiseRef.current) {
      readyPromiseRef.current = new Promise((resolve) => {
        const grecaptchaObj = window.grecaptcha as { enterprise?: { ready: (cb: () => void) => void } };
        if (grecaptchaObj?.enterprise) {
          grecaptchaObj.enterprise.ready(() => {
            setIsReady(true);
            resolve();
          });
        } else {
          // Fallback if grecaptcha not loaded
          const checkInterval = setInterval(() => {
            const grecaptchaCheck = window.grecaptcha as { enterprise?: { ready: (cb: () => void) => void } };
            if (grecaptchaCheck?.enterprise) {
              clearInterval(checkInterval);
              grecaptchaCheck.enterprise.ready(() => {
                setIsReady(true);
                resolve();
              });
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 10000);
        }
      });
    }

    readyPromiseRef.current.then(() => setIsReady(true));
  }, [isEnabled, isEnterprise]);

  /**
   * Execute reCAPTCHA verification for a specific action
   * @param action - The action being protected (e.g., 'LOGIN', 'SUBMIT_REVIEW', 'SEARCH')
   * @returns Promise resolving to reCAPTCHA token
   */
  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      // If reCAPTCHA is disabled, return null (no token needed)
      if (!isEnabled) {
        console.debug('reCAPTCHA disabled in environment');
        return null;
      }

      // If not Enterprise, return null
      if (!isEnterprise) {
        console.debug('reCAPTCHA Enterprise not configured');
        return null;
      }

      // Check if grecaptcha is available
      const grecaptchaObj = window.grecaptcha as { enterprise?: { execute: (key: string, opts: { action: string }) => Promise<string> } };
      if (!grecaptchaObj?.enterprise) {
        const errorMsg = 'reCAPTCHA Enterprise script not loaded';
        console.error(errorMsg);
        setError(errorMsg);
        return null;
      }

      try {
        setError(null);
        const token = await grecaptchaObj.enterprise.execute(siteKey, {
          action: action.toUpperCase(),
        });
        return token;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'reCAPTCHA execution failed';
        console.error('reCAPTCHA error:', errorMsg);
        setError(errorMsg);
        return null;
      }
    },
    [isEnabled, isEnterprise, siteKey]
  );

  /**
   * Get the reCAPTCHA site key for direct use
   */
  const getSiteKey = useCallback(() => siteKey, [siteKey]);

  /**
   * Check if reCAPTCHA is properly configured and ready
   */
  const isConfigured = useCallback(() => {
    return isEnabled && isEnterprise && isReady && !!siteKey;
  }, [isEnabled, isEnterprise, isReady, siteKey]);

  return {
    executeRecaptcha,
    getSiteKey,
    isConfigured,
    isReady,
    error,
    isEnabled,
    isEnterprise,
  };
};

/**
 * Helper function to add reCAPTCHA token to API request headers
 * @param headers - Existing headers object
 * @param token - reCAPTCHA token
 * @returns Headers with added reCAPTCHA token
 */
export const addRecaptchaTokenToHeaders = (
  headers: Record<string, string>,
  token: string | null
): Record<string, string> => {
  if (token) {
    return {
      ...headers,
      'X-reCAPTCHA-Token': token,
    };
  }
  return headers;
};
