import { logger } from '../../utils/logger';

export interface RequestData {
  [key: string]: unknown;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  errorCode?: string;
  userMessage?: string;

  constructor(message: string, status?: number, code?: string, userMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errorCode = code;
    this.userMessage = userMessage;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiErrorResponse {
  status?: number;
  data?: {
    message?: string;
    errorCode?: string;
    userMessage?: string;
    error?: string;
    details?: string;
    retryAfter?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const handleApiError = (error: unknown): never => {
  logger.error('API error:', error);
  const axiosError = error as { response?: ApiErrorResponse };
  if (axiosError.response) {
    const data = axiosError.response.data;
    const displayMessage =
      data?.userMessage || data?.message || 'An error occurred with the API request';
    throw new ApiError(
      displayMessage,
      axiosError.response.status,
      data?.errorCode,
      data?.userMessage
    );
  }
  throw new ApiError('Failed to connect to the server. Please check your internet connection.');
};
