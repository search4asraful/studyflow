import { apiRequest } from './api';
import { broadcastCacheInvalidate } from './tabSync';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface RequestCacheOptions {
  staleTime?: number; // Time in ms before background revalidation is triggered (default: 20s)
  maxAge?: number;    // Maximum age in ms before cache is considered dead (default: 3 min)
  forceRefresh?: boolean; // Bypass cache and fetch fresh
}

// In-memory hot cache for zero-latency lookups (< 0.1ms)
const memoryCache = new Map<string, CacheEntry<any>>();

// In-flight promise map for request de-duplication (prevents duplicate hits to 100MB RAM backend)
const inFlightRequests = new Map<string, Promise<any>>();

// Listeners for background revalidations: endpoint -> Set<callback>
const revalidateListeners = new Map<string, Set<(data: any) => void>>();

// Hydrate from sessionStorage if available
function getSessionStorageItem<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(`sf_cache_${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSessionStorageItem<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`sf_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore quota errors
  }
}

function removeSessionStorageMatching(pattern?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!pattern) {
      const keys = Object.keys(window.sessionStorage);
      for (const k of keys) {
        if (k.startsWith('sf_cache_')) {
          window.sessionStorage.removeItem(k);
        }
      }
      return;
    }

    const reg = new RegExp(pattern);
    const keys = Object.keys(window.sessionStorage);
    for (const k of keys) {
      if (k.startsWith('sf_cache_')) {
        const rawKey = k.replace('sf_cache_', '');
        if (reg.test(rawKey)) {
          window.sessionStorage.removeItem(k);
        }
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * High-performance Stale-While-Revalidate (SWR) cached API fetcher.
 * 
 * - Returns cached data instantly (< 0.1ms perceived latency).
 * - De-duplicates in-flight requests so a single-core backend isn't hammered by duplicate fetches.
 * - Revalidates quietly in the background when stale.
 */
export async function cachedApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  cacheOptions: RequestCacheOptions = {}
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  
  // Non-GET requests (mutations) bypass cache and invalidate affected cache keys
  if (!isGet || cacheOptions.forceRefresh) {
    const freshData = await apiRequest<T>(endpoint, options);
    if (!isGet) {
      invalidateApiCache(endpoint.split('?')[0]);
    }
    return freshData;
  }

  const { staleTime = 20_000, maxAge = 180_000 } = cacheOptions;
  const now = Date.now();

  // 1. Check memory cache first
  let cached = memoryCache.get(endpoint) as CacheEntry<T> | undefined;

  // 2. Fall back to sessionStorage if memory cache missed (e.g. after soft reload or navigation)
  if (!cached) {
    const sessionEntry = getSessionStorageItem<T>(endpoint);
    if (sessionEntry && now - sessionEntry.timestamp < maxAge) {
      cached = sessionEntry;
      memoryCache.set(endpoint, sessionEntry);
    }
  }

  // 3. If cache entry is fresh, return immediately without touching network
  if (cached && now - cached.timestamp < staleTime) {
    return cached.data;
  }

  // 4. Background revalidation helper
  const revalidate = async (): Promise<T> => {
    // Check if a request for this endpoint is already in flight
    if (inFlightRequests.has(endpoint)) {
      return inFlightRequests.get(endpoint)!;
    }

    const fetchPromise = (async () => {
      try {
        const data = await apiRequest<T>(endpoint, options);
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        memoryCache.set(endpoint, entry);
        setSessionStorageItem(endpoint, entry);

        // Notify any active components subscribed to this endpoint
        const listeners = revalidateListeners.get(endpoint);
        if (listeners) {
          listeners.forEach((cb) => cb(data));
        }

        return data;
      } finally {
        inFlightRequests.delete(endpoint);
      }
    })();

    inFlightRequests.set(endpoint, fetchPromise);
    return fetchPromise;
  };

  // 5. Stale-While-Revalidate: If we have cached data, return it immediately and revalidate quietly
  if (cached && now - cached.timestamp < maxAge) {
    // Fire background revalidation without awaiting
    revalidate().catch(() => {});
    return cached.data;
  }

  // 6. Cache missed or expired: fetch synchronously
  return revalidate();
}

/**
 * Subscribe to background revalidations for an endpoint
 */
export function subscribeToRevalidation<T>(
  endpoint: string,
  callback: (data: T) => void
): () => void {
  if (!revalidateListeners.has(endpoint)) {
    revalidateListeners.set(endpoint, new Set());
  }
  revalidateListeners.get(endpoint)!.add(callback);

  return () => {
    const set = revalidateListeners.get(endpoint);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        revalidateListeners.delete(endpoint);
      }
    }
  };
}

/**
 * Invalidate cached endpoints (e.g. after a task update or room creation).
 * Optionally broadcasts to other open tabs to keep them synchronized.
 */
export function invalidateApiCache(pattern?: string, shouldBroadcast: boolean = true): void {
  if (!pattern) {
    memoryCache.clear();
    removeSessionStorageMatching();
  } else {
    const reg = new RegExp(pattern);
    for (const key of Array.from(memoryCache.keys())) {
      if (reg.test(key)) {
        memoryCache.delete(key);
      }
    }
    removeSessionStorageMatching(pattern);
  }

  if (shouldBroadcast) {
    broadcastCacheInvalidate(pattern);
  }
}

/**
 * Optimistically mutate cache in memory and storage immediately
 */
export function mutateApiCache<T>(key: string, updater: (oldData: T | undefined) => T): void {
  let current = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!current) {
    const sessionEntry = getSessionStorageItem<T>(key);
    if (sessionEntry) {
      current = sessionEntry;
      memoryCache.set(key, sessionEntry);
    }
  }

  const newData = updater(current?.data);
  if (newData === undefined) return;

  const entry: CacheEntry<T> = { data: newData, timestamp: Date.now() };
  memoryCache.set(key, entry);
  setSessionStorageItem(key, entry);

  const listeners = revalidateListeners.get(key);
  if (listeners) {
    listeners.forEach((cb) => cb(newData));
  }
}

/**
 * Pre-warm the cache for an endpoint (used on link hover)
 */
export function prefetchApi(endpoint: string): void {
  const cached = memoryCache.get(endpoint);
  const now = Date.now();
  if (!cached || now - cached.timestamp > 15_000) {
    cachedApiRequest(endpoint).catch(() => {});
  }
}

// Listen for cross-tab cache invalidation events
if (typeof window !== 'undefined') {
  window.addEventListener('studyflow:cache-invalidated', ((e: CustomEvent<string | undefined>) => {
    invalidateApiCache(e.detail, false);
  }) as EventListener);
}
