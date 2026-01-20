/**
 * Discriminated Union Types for Type-Safe State Management
 * 
 * These types prevent impossible states at compile time and provide
 * better type inference in conditional blocks.
 * 
 * Benefits:
 * - Prevents bugs from invalid state combinations
 * - Better TypeScript type inference
 * - Self-documenting code
 * - Safer refactoring
 * 
 * Example of problem solved:
 * 
 * ❌ BAD (Possible invalid states):
 * ```
 * const [loading, setLoading] = useState(false);
 * const [error, setError] = useState<string | null>(null);
 * const [data, setData] = useState<Data | null>(null);
 * 
 * // Invalid state: loading=false, error=null, data=null ❌
 * // Invalid state: loading=true, error="...", data=[...] ❌
 * ```
 * 
 * ✅ GOOD (Only valid states possible):
 * ```
 * const [state, setState] = useState<AsyncState<Data>>({ status: 'idle' });
 * 
 * // Impossible to have error without status='error' ✅
 * // Impossible to have data without status='success' ✅
 * ```
 */

// ============================================================================
// ASYNC OPERATION STATES
// ============================================================================

/**
 * Generic async operation state with discriminated union
 * 
 * Use this for any async operation (API calls, file uploads, etc.)
 * 
 * @example
 * ```typescript
 * const [busState, setBusState] = useState<AsyncState<Bus[]>>({ status: 'idle' });
 * 
 * if (busState.status === 'success') {
 *   console.log(busState.data); // TypeScript knows data exists
 * }
 * ```
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; retryCount?: number };

/**
 * Helper functions for AsyncState
 */
export const AsyncState = {
  idle: <T>(): AsyncState<T> => ({ status: 'idle' }),
  loading: <T>(): AsyncState<T> => ({ status: 'loading' }),
  success: <T>(data: T): AsyncState<T> => ({ status: 'success', data }),
  error: <T>(error: string, retryCount = 0): AsyncState<T> => ({ 
    status: 'error', 
    error,
    retryCount 
  }),
  
  // Type guards
  isLoading: <T>(state: AsyncState<T>): state is { status: 'loading' } => 
    state.status === 'loading',
  isSuccess: <T>(state: AsyncState<T>): state is { status: 'success'; data: T } => 
    state.status === 'success',
  isError: <T>(state: AsyncState<T>): state is { status: 'error'; error: string } => 
    state.status === 'error',
};

// ============================================================================
// FORM STATES
// ============================================================================

/**
 * Form submission state with validation
 * 
 * Use this for forms that need validation and submission handling
 * 
 * @example
 * ```typescript
 * const [formState, setFormState] = useState<FormState<FormData>>({ 
 *   status: 'editing' 
 * });
 * 
 * if (formState.status === 'invalid') {
 *   console.log(formState.errors); // Type-safe access to errors
 * }
 * ```
 */
export type FormState<T> =
  | { status: 'editing'; data: Partial<T> }
  | { status: 'validating'; data: Partial<T> }
  | { status: 'invalid'; data: Partial<T>; errors: Record<string, string> }
  | { status: 'submitting'; data: T }
  | { status: 'submitted'; data: T; responseId?: string }
  | { status: 'failed'; data: T; error: string };

export const FormState = {
  editing: <T>(data: Partial<T> = {}): FormState<T> => ({ 
    status: 'editing', 
    data 
  }),
  validating: <T>(data: Partial<T>): FormState<T> => ({ 
    status: 'validating', 
    data 
  }),
  invalid: <T>(data: Partial<T>, errors: Record<string, string>): FormState<T> => ({ 
    status: 'invalid', 
    data, 
    errors 
  }),
  submitting: <T>(data: T): FormState<T> => ({ 
    status: 'submitting', 
    data 
  }),
  submitted: <T>(data: T, responseId?: string): FormState<T> => ({ 
    status: 'submitted', 
    data,
    responseId 
  }),
  failed: <T>(data: T, error: string): FormState<T> => ({ 
    status: 'failed', 
    data, 
    error 
  }),
};

// ============================================================================
// SEARCH STATES
// ============================================================================

/**
 * Search state with empty results distinction
 * 
 * Distinguishes between:
 * - No search performed yet (idle)
 * - Searching (loading)
 * - Empty results (no matches found)
 * - Results found (success)
 * - Error occurred
 * 
 * @example
 * ```typescript
 * const [searchState, setSearchState] = useState<SearchState<Bus>>({ 
 *   status: 'idle' 
 * });
 * 
 * if (searchState.status === 'empty') {
 *   return <NoResults query={searchState.query} />;
 * }
 * ```
 */
export type SearchState<T> =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'empty'; query: string }
  | { status: 'success'; query: string; results: T[]; totalCount: number }
  | { status: 'error'; query: string; error: string };

export const SearchState = {
  idle: <T>(): SearchState<T> => ({ status: 'idle' }),
  loading: <T>(query: string): SearchState<T> => ({ status: 'loading', query }),
  empty: <T>(query: string): SearchState<T> => ({ status: 'empty', query }),
  success: <T>(query: string, results: T[], totalCount?: number): SearchState<T> => ({ 
    status: 'success', 
    query, 
    results,
    totalCount: totalCount ?? results.length
  }),
  error: <T>(query: string, error: string): SearchState<T> => ({ 
    status: 'error', 
    query, 
    error 
  }),
};

// ============================================================================
// NETWORK/CONNECTION STATES
// ============================================================================

/**
 * Network connection state
 * 
 * Tracks online/offline status with transition states
 * 
 * @example
 * ```typescript
 * const [netState, setNetState] = useState<NetworkState>({ status: 'online' });
 * 
 * if (netState.status === 'reconnecting') {
 *   console.log(`Retry ${netState.retryCount} of ${netState.maxRetries}`);
 * }
 * ```
 */
export type NetworkState =
  | { status: 'online' }
  | { status: 'offline'; since: number }
  | { status: 'reconnecting'; retryCount: number; maxRetries: number }
  | { status: 'degraded'; latency: number };

export const NetworkState = {
  online: (): NetworkState => ({ status: 'online' }),
  offline: (): NetworkState => ({ status: 'offline', since: Date.now() }),
  reconnecting: (retryCount: number, maxRetries = 3): NetworkState => ({ 
    status: 'reconnecting', 
    retryCount, 
    maxRetries 
  }),
  degraded: (latency: number): NetworkState => ({ 
    status: 'degraded', 
    latency 
  }),
};

// ============================================================================
// UPLOAD STATES
// ============================================================================

/**
 * File upload state with progress tracking
 * 
 * @example
 * ```typescript
 * const [uploadState, setUploadState] = useState<UploadState>({ 
 *   status: 'idle' 
 * });
 * 
 * if (uploadState.status === 'uploading') {
 *   console.log(`Progress: ${uploadState.progress}%`);
 * }
 * ```
 */
export type UploadState =
  | { status: 'idle' }
  | { status: 'validating'; fileName: string }
  | { status: 'uploading'; fileName: string; progress: number; bytesUploaded: number; totalBytes: number }
  | { status: 'processing'; fileName: string }
  | { status: 'success'; fileName: string; fileUrl: string }
  | { status: 'error'; fileName: string; error: string };

export const UploadState = {
  idle: (): UploadState => ({ status: 'idle' }),
  validating: (fileName: string): UploadState => ({ status: 'validating', fileName }),
  uploading: (fileName: string, progress: number, bytesUploaded: number, totalBytes: number): UploadState => ({ 
    status: 'uploading', 
    fileName, 
    progress, 
    bytesUploaded, 
    totalBytes 
  }),
  processing: (fileName: string): UploadState => ({ status: 'processing', fileName }),
  success: (fileName: string, fileUrl: string): UploadState => ({ 
    status: 'success', 
    fileName, 
    fileUrl 
  }),
  error: (fileName: string, error: string): UploadState => ({ 
    status: 'error', 
    fileName, 
    error 
  }),
};

// ============================================================================
// AUTHENTICATION STATES
// ============================================================================

/**
 * Authentication state
 * 
 * Tracks user authentication status with session info
 * 
 * @example
 * ```typescript
 * const [authState, setAuthState] = useState<AuthState>({ 
 *   status: 'unauthenticated' 
 * });
 * 
 * if (authState.status === 'authenticated') {
 *   console.log(`Welcome ${authState.user.name}`);
 * }
 * ```
 */
export type AuthState<TUser = any> =
  | { status: 'unauthenticated' }
  | { status: 'authenticating' }
  | { status: 'authenticated'; user: TUser; token: string; expiresAt: number }
  | { status: 'refreshing'; user: TUser; token: string }
  | { status: 'error'; error: string };

export const AuthState = {
  unauthenticated: <TUser>(): AuthState<TUser> => ({ 
    status: 'unauthenticated' 
  }),
  authenticating: <TUser>(): AuthState<TUser> => ({ 
    status: 'authenticating' 
  }),
  authenticated: <TUser>(user: TUser, token: string, expiresAt: number): AuthState<TUser> => ({ 
    status: 'authenticated', 
    user, 
    token, 
    expiresAt 
  }),
  refreshing: <TUser>(user: TUser, token: string): AuthState<TUser> => ({ 
    status: 'refreshing', 
    user, 
    token 
  }),
  error: <TUser>(error: string): AuthState<TUser> => ({ 
    status: 'error', 
    error 
  }),
};

// ============================================================================
// PAGINATION STATES
// ============================================================================

/**
 * Pagination state for infinite scroll or page-based pagination
 * 
 * @example
 * ```typescript
 * const [paginationState, setPaginationState] = useState<PaginationState<Bus>>({ 
 *   status: 'idle' 
 * });
 * 
 * if (paginationState.status === 'loadingMore') {
 *   console.log(`Loading page ${paginationState.page}`);
 * }
 * ```
 */
export type PaginationState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T[]; page: number; hasMore: boolean; totalCount?: number }
  | { status: 'loadingMore'; data: T[]; page: number }
  | { status: 'error'; error: string };

export const PaginationState = {
  idle: <T>(): PaginationState<T> => ({ status: 'idle' }),
  loading: <T>(): PaginationState<T> => ({ status: 'loading' }),
  success: <T>(data: T[], page: number, hasMore: boolean, totalCount?: number): PaginationState<T> => ({ 
    status: 'success', 
    data, 
    page, 
    hasMore,
    totalCount 
  }),
  loadingMore: <T>(data: T[], page: number): PaginationState<T> => ({ 
    status: 'loadingMore', 
    data, 
    page 
  }),
  error: <T>(error: string): PaginationState<T> => ({ 
    status: 'error', 
    error 
  }),
};

// ============================================================================
// EXAMPLE USAGE PATTERNS
// ============================================================================

/**
 * Example: Refactoring a component to use discriminated unions
 * 
 * BEFORE (Multiple states that can be inconsistent):
 * ```typescript
 * const [loading, setLoading] = useState(false);
 * const [error, setError] = useState<string | null>(null);
 * const [buses, setBuses] = useState<Bus[]>([]);
 * 
 * // Problems:
 * // - Can have loading=true AND error set
 * // - Can have loading=false AND buses=[] AND error=null (unclear state)
 * // - Hard to determine if we've loaded data yet
 * ```
 * 
 * AFTER (Single state with type safety):
 * ```typescript
 * const [busState, setBusState] = useState<AsyncState<Bus[]>>({ status: 'idle' });
 * 
 * // Fetch data
 * const fetchBuses = async () => {
 *   setBusState(AsyncState.loading());
 *   try {
 *     const buses = await api.getBuses();
 *     setBusState(AsyncState.success(buses));
 *   } catch (error) {
 *     setBusState(AsyncState.error(error.message));
 *   }
 * };
 * 
 * // Render based on state
 * if (busState.status === 'loading') {
 *   return <Loading />;
 * }
 * 
 * if (busState.status === 'error') {
 *   return <Error message={busState.error} />; // Type-safe!
 * }
 * 
 * if (busState.status === 'success') {
 *   return <BusList buses={busState.data} />; // Type-safe!
 * }
 * 
 * return <Idle />;
 * ```
 */
