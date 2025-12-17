import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_AUTH_KEY = 'admin_auth_credentials';
const ADMIN_AUTH_EXPIRY_KEY = 'admin_auth_expiry';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Get API base URL
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
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

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const storedCredentials = sessionStorage.getItem(ADMIN_AUTH_KEY);
      const expiry = sessionStorage.getItem(ADMIN_AUTH_EXPIRY_KEY);
      
      if (storedCredentials && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          setIsAdminAuthenticated(true);
        } else {
          // Session expired, clear it
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          sessionStorage.removeItem(ADMIN_AUTH_EXPIRY_KEY);
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create Basic Auth header
      const credentials = btoa(`${username}:${password}`);
      const authHeader = `Basic ${credentials}`;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Validate credentials against backend
      const response = await fetch(`${getApiBaseUrl()}/api/admin/contributions/routes/pending`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
        credentials: 'include', // Include cookies for CORS
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Store credentials in session storage (not localStorage for security)
        sessionStorage.setItem(ADMIN_AUTH_KEY, credentials);
        sessionStorage.setItem(ADMIN_AUTH_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
        setIsAdminAuthenticated(true);
        setIsLoading(false);
        return true;
      } else if (response.status === 401) {
        setError('Invalid username or password');
        setIsLoading(false);
        return false;
      } else if (response.status === 403) {
        setError('Access forbidden. Please check your credentials.');
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
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_EXPIRY_KEY);
    setIsAdminAuthenticated(false);
    setError(null);
  }, []);

  const getAuthHeader = useCallback((): string | null => {
    const credentials = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (credentials) {
      return `Basic ${credentials}`;
    }
    return null;
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        isLoading,
        error,
        login,
        logout,
        getAuthHeader,
      }}
    >
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
