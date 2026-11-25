import { broadcastLogout } from './tabSync';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HTTP-only cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If unauthorized, broadcast logout to all open tabs to keep session states in sync
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
      broadcastLogout();
    }
    throw new ApiError(data.error || 'An unexpected error occurred', response.status);
  }

  return data.data !== undefined ? data.data : data;
}

// Re-export high-performance caching & prefetching primitives
export {
  cachedApiRequest,
  invalidateApiCache,
  mutateApiCache,
  prefetchApi,
  subscribeToRevalidation,
} from './cache';
