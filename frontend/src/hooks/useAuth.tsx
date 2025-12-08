import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AuthService from '../services/authService';
import type { User, LoginCredentials, RegisterData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already authenticated
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && AuthService.isAuthenticated()) {
        // Validate session with backend
        const isValid = await AuthService.validateSession();
        if (isValid) {
          setUser(currentUser);
        } else {
          // Session invalid, clear auth data
          await AuthService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await AuthService.login(credentials);
      setUser(loggedInUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const { user: registeredUser } = await AuthService.register(userData);
      setUser(registeredUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    const updatedUser = await AuthService.updateProfile(userData);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const isAuthenticated = !!user && AuthService.isAuthenticated();

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Additional hooks for specific auth states
export const useUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

// Role-based hooks
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' || false;
};

export const useIsModerator = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'MODERATOR' || user?.role === 'ADMIN' || false;
};

export const useIsPremium = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'PREMIUM' || user?.role === 'ADMIN' || false;
};

export const useIsVerified = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'PREMIUM' || user?.role === 'ADMIN' || false;
};

export const useHasRole = (role: string): boolean => {
  const { user } = useAuth();
  return user?.role === role || false;
};

export const useHasAnyRole = (roles: string[]): boolean => {
  const { user } = useAuth();
  return roles.includes(user?.role || '') || false;
};