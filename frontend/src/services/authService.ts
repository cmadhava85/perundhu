import { logger } from '../utils/logger';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import SecurityService from './securityService';
import { getEnv } from '../utils/environment';
import { traceContext, TRACE_HEADERS } from '../utils/traceId';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'PREMIUM';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private api: AxiosInstance;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  private refreshPromise: Promise<AuthToken> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: getEnv('VITE_API_URL', ''),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Add traceId for distributed tracing
        const traceId = traceContext.newTraceId();
        const sessionId = traceContext.getSessionId();
        config.headers[TRACE_HEADERS.TRACE_ID] = traceId;
        config.headers[TRACE_HEADERS.SESSION_ID] = sessionId;
        
        logger.debug(`[${traceId}] AuthService Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add security headers only if security is enabled
        if (SecurityService.isSecurityEnabled?.()) {
          config.headers['X-Client-Version'] = getEnv('VITE_APP_VERSION', '1.0.0');
          config.headers['X-Request-ID'] = traceId; // Use traceId instead of separate requestId
          
          // Add CSRF protection for state-changing operations
          if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
            config.headers['X-CSRF-Token'] = SecurityService.generateCSRFToken?.() || '';
          }
        }

        // Check rate limiting before making request
        if (SecurityService.isRateLimitEnabled?.() && config.url) {
          if (!SecurityService.isRequestAllowed(config.url)) {
            return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and security validation
    this.api.interceptors.response.use(
      (response) => {
        // Validate security headers in response
        const securityLevel = response.headers['x-security-level'];
        if (securityLevel === 'HIGH' || securityLevel === 'CRITICAL') {
          logger.warn('High security alert detected from backend');
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle rate limiting
        if (error.response?.status === 429) {
          logger.error('Rate limit exceeded for authenticated request');
          SecurityService.handleSecurityBreach?.('Authentication rate limit exceeded');
          return Promise.reject(new Error('Too many requests. Please try again later.'));
        }

        // Handle authentication errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle blocked IPs or security violations
        if (error.response?.status === 403) {
          const errorMessage = error.response?.data?.message || '';
          if (errorMessage.includes('blocked') || errorMessage.includes('security')) {
            SecurityService.handleSecurityBreach?.('IP blocked or security violation');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; token: AuthToken }> {
    try {
      const response = await this.api.post('/api/auth/login', credentials);
      const { user, token } = response.data;

      // Store auth data securely
      this.storeAuthData(user, token);

      return { user, token };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<{ user: User; token: AuthToken }> {
    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await this.api.post('/api/auth/register', {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      });

      const { user, token } = response.data;
      this.storeAuthData(user, token);

      return { user, token };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<AuthToken> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthToken> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        refreshToken,
      });

      const newToken: AuthToken = response.data;
      this.storeToken(newToken);

      return newToken;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.api.post('/api/auth/forgot-password', { email });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to send reset email');
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await this.api.post('/api/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Password reset failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await this.api.post('/api/auth/verify-email', { token });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Email verification failed');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await this.api.post('/api/auth/resend-verification');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to resend verification email');
    }
  }

  // Profile management
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.api.put('/api/auth/profile', userData);
      const updatedUser = response.data;
      this.storeUser(updatedUser);
      return updatedUser;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Profile update failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Password change failed');
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.api.delete('/api/auth/account');
      this.clearAuthData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Account deletion failed');
    }
  }

  // Token and user data management
  private storeAuthData(user: User, token: AuthToken): void {
    this.storeUser(user);
    this.storeToken(token);
  }

  private storeUser(user: User): void {
    SecurityService.secureStore(this.USER_KEY, user);
  }

  private storeToken(token: AuthToken): void {
    SecurityService.secureStore(this.TOKEN_KEY, token.accessToken);
    SecurityService.secureStore(this.REFRESH_TOKEN_KEY, token.refreshToken);
    
    // Set expiration timer
    if (token.expiresIn) {
      const expirationTime = Date.now() + (token.expiresIn * 1000) - 60000; // Refresh 1 minute before expiry
      SecurityService.secureStore('token_expiration', expirationTime);
    }
  }

  private clearAuthData(): void {
    SecurityService.secureRemove(this.TOKEN_KEY);
    SecurityService.secureRemove(this.REFRESH_TOKEN_KEY);
    SecurityService.secureRemove(this.USER_KEY);
    SecurityService.secureRemove('token_expiration');
  }

  // Public getters
  getToken(): string | null {
    return SecurityService.secureRetrieve(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return SecurityService.secureRetrieve(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return SecurityService.secureRetrieve(this.USER_KEY);
  }

  getUserName(): string | null {
    const user = this.getCurrentUser();
    return user?.name || null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  isTokenExpired(): boolean {
    const expiration = SecurityService.secureRetrieve('token_expiration');
    if (!expiration || typeof expiration !== 'number') return true;
    return Date.now() > expiration;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.hasRole('MODERATOR') || this.isAdmin();
  }

  // Session management
  async validateSession(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) return false;

      if (this.isTokenExpired()) {
        await this.refreshToken();
      }

      // Verify token with backend
      await this.api.get('/api/auth/validate');
      return true;
    } catch (_error) {
      this.clearAuthData();
      return false;
    }
  }

  // Social authentication (placeholder for future implementation)
  async loginWithGoogle(token: string): Promise<{ user: User; token: AuthToken }> {
    try {
      const response = await this.api.post('/api/auth/google', { token });
      const { user, token: authToken } = response.data;
      this.storeAuthData(user, authToken);
      return { user, token: authToken };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Google login failed');
    }
  }

  async loginWithFacebook(token: string): Promise<{ user: User; token: AuthToken }> {
    try {
      const response = await this.api.post('/api/auth/facebook', { token });
      const { user, token: authToken } = response.data;
      this.storeAuthData(user, authToken);
      return { user, token: authToken };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Facebook login failed');
    }
  }

  // Security features
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    try {
      const response = await this.api.post('/api/auth/2fa/enable');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to enable 2FA');
    }
  }

  async confirmTwoFactor(code: string): Promise<void> {
    try {
      await this.api.post('/api/auth/2fa/confirm', { code });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Invalid 2FA code');
    }
  }

  async disableTwoFactor(code: string): Promise<void> {
    try {
      await this.api.post('/api/auth/2fa/disable', { code });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to disable 2FA');
    }
  }

  // Admin functions
  async getUsers(page: number = 0, size: number = 20): Promise<{ users: User[]; totalPages: number; totalElements: number }> {
    try {
      const response = await this.api.get(`/api/admin/users?page=${page}&size=${size}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch users');
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const response = await this.api.put(`/api/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to update user role');
    }
  }

  async banUser(userId: string, reason: string): Promise<void> {
    try {
      await this.api.post(`/api/admin/users/${userId}/ban`, { reason });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to ban user');
    }
  }

  async unbanUser(userId: string): Promise<void> {
    try {
      await this.api.post(`/api/admin/users/${userId}/unban`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to unban user');
    }
  }
}

export default new AuthService();