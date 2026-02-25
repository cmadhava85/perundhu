import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRecaptcha, addRecaptchaTokenToHeaders } from '../hooks/useRecaptcha';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => string | null;
  extendSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_AUTH_KEY = 'admin_auth_credentials';
const ADMIN_AUTH_EXPIRY_KEY = 'admin_auth_expiry';
const ADMIN_LAST_ACTIVITY_KEY = 'admin_last_activity';

// Session timeout: configurable via env var, default 30 minutes
const SESSION_DURATION = (import.meta.env?.VITE_ADMIN_SESSION_MINUTES 
  ? Number.parseInt(import.meta.env.VITE_ADMIN_SESSION_MINUTES, 10) 
  : 30) * 60 * 1000;

// Inactivity timeout: log out after 15 minutes of no activity
const INACTIVITY_TIMEOUT = (import.meta.env?.VITE_ADMIN_INACTIVITY_MINUTES 
  ? Number.parseInt(import.meta.env.VITE_ADMIN_INACTIVITY_MINUTES, 10) 
  : 15) * 60 * 1000;

// Get API base URL
const getApiBaseUrl = (): string => {
  if (globalThis.window !== undefined && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:8080';
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { executeRecaptcha, isConfigured } = useRecaptcha();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all session data
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_EXPIRY_KEY);
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    setIsAdminAuthenticated(false);
    setError(null);
  }, []);

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    if (isAdminAuthenticated) {
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
    }
  }, [isAdminAuthenticated]);

  // Check for session expiry (both absolute and inactivity)
  const checkSessionValidity = useCallback(() => {
    const storedCredentials = sessionStorage.getItem(ADMIN_AUTH_KEY);
    const expiry = sessionStorage.getItem(ADMIN_AUTH_EXPIRY_KEY);
    const lastActivity = sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);

    if (!storedCredentials || !expiry) {
      return false;
    }

    const now = Date.now();
    const expiryTime = Number.parseInt(expiry, 10);
    const lastActivityTime = lastActivity ? Number.parseInt(lastActivity, 10) : now;

    // Check absolute session expiry
    if (now >= expiryTime) {
      console.warn('Admin session expired (absolute timeout)');
      return false;
    }

    // Check inactivity timeout
    if (now - lastActivityTime >= INACTIVITY_TIMEOUT) {
      console.warn('Admin session expired (inactivity timeout)');
      return false;
    }

    return true;
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      if (checkSessionValidity()) {
        setIsAdminAuthenticated(true);
        updateLastActivity();
      } else {
        clearSession();
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, [checkSessionValidity, clearSession, updateLastActivity]);

  // Set up activity listeners when authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) {
      return;
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Throttled activity handler (update at most once per minute)
    let lastUpdate = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate >= 60000) { // Update at most once per minute
        lastUpdate = now;
        updateLastActivity();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      globalThis.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic session validity check (every minute)
    sessionCheckIntervalRef.current = setInterval(() => {
      if (!checkSessionValidity()) {
        console.warn('Admin session expired, logging out...');
        clearSession();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        globalThis.removeEventListener(event, handleActivity);
      });
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [isAdminAuthenticated, updateLastActivity, checkSessionValidity, clearSession]);

  // Extend session (can be called by components to reset timeout)
  const extendSession = useCallback(() => {
    if (isAdminAuthenticated) {
      const newExpiry = Date.now() + SESSION_DURATION;
      sessionStorage.setItem(ADMIN_AUTH_EXPIRY_KEY, String(newExpiry));
      updateLastActivity();
    }
  }, [isAdminAuthenticated, updateLastActivity]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate reCAPTCHA token for LOGIN action
      const recaptchaToken = isConfigured() ? await executeRecaptcha('LOGIN') : null;

      // Create Basic Auth credentials to store on success
      const credentials = btoa(`${username}:${password}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Build headers with reCAPTCHA token if available
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      };
      headers = addRecaptchaTokenToHeaders(headers, recaptchaToken);

      // Use dedicated admin login endpoint (fast, DB-independent)
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
        credentials: 'include', // Include cookies for CORS
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Store credentials in session storage (not localStorage for security)
        sessionStorage.setItem(ADMIN_AUTH_KEY, credentials);
        sessionStorage.setItem(ADMIN_AUTH_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
        sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
        setIsAdminAuthenticated(true);
        setIsLoading(false);
        return true;
      } else if (response.status === 401) {
        setError('Invalid username or password');
        setIsLoading(false);
        return false;
      } else if (response.status === 403) {
        setError('Security validation failed (reCAPTCHA). Please try again.');
        setIsLoading(false);
        return false;
      } else {
        setError(`Authentication failed: ${response.statusText || 'Unknown error'}`);
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Admin login error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Connection timed out. Please check your network and try again.');
      } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check if the server is running and CORS is configured.');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
      setIsLoading(false);
      return false;
    }
  }, [executeRecaptcha, isConfigured]);

  const logout = useCallback(() => {
    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    clearSession();
  }, [clearSession]);

  const getAuthHeader = useCallback((): string | null => {
    const credentials = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (credentials) {
      return `Basic ${credentials}`;
    }
    return null;
  }, []);

  const contextValue = useMemo(() => ({
    isAdminAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getAuthHeader,
    extendSession,
  }), [isAdminAuthenticated, isLoading, error, login, logout, getAuthHeader, extendSession]);

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
