/**
 * CSRF Token Management Utility
 * Handles fetching and managing CSRF tokens for state-changing operations
 */

interface CsrfTokenResponse {
  token: string;
  headerName: string;
  parameterName: string;
}

class CsrfTokenManager {
  private static instance: CsrfTokenManager;
  private tokenCache: CsrfTokenResponse | null = null;
  private tokenFetchPromise: Promise<CsrfTokenResponse> | null = null;

  private constructor() {}

  static getInstance(): CsrfTokenManager {
    if (!CsrfTokenManager.instance) {
      CsrfTokenManager.instance = new CsrfTokenManager();
    }
    return CsrfTokenManager.instance;
  }

  /**
   * Fetch CSRF token from server
   * Caches the token to avoid repeated calls
   */
  async getToken(): Promise<CsrfTokenResponse> {
    // Return cached token if available
    if (this.tokenCache) {
      return this.tokenCache;
    }

    // Return pending promise if already fetching
    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }

    // Fetch token from server
    this.tokenFetchPromise = fetch('/v1/csrf/token', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        this.tokenCache = data;
        this.tokenFetchPromise = null;
        return data;
      })
      .catch(error => {
        this.tokenFetchPromise = null;
        console.error('Error fetching CSRF token:', error);
        throw error;
      });

    return this.tokenFetchPromise;
  }

  /**
   * Clear cached token (call this after logout)
   */
  clearToken(): void {
    this.tokenCache = null;
  }

  /**
   * Get headers with CSRF token for API requests
   * Call this before making POST, PUT, DELETE requests
   */
  async getHeadersWithCsrf(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      [token.headerName]: token.token
    };
  }

  /**
   * Add CSRF token to request body (for form submissions)
   */
  async addCsrfToFormData(formData: FormData): Promise<void> {
    const token = await this.getToken();
    formData.append(token.parameterName, token.token);
  }

  /**
   * Manually set token (useful if received from response)
   */
  setToken(token: CsrfTokenResponse): void {
    this.tokenCache = token;
  }
}

// Create singleton instance
const csrfTokenManager = CsrfTokenManager.getInstance();

export { csrfTokenManager, type CsrfTokenResponse };
