import { describe, it, expect, vi } from 'vitest';

describe('Client-Side SWR Cache & Request Deduplication Logic', () => {
  it('should deduplicate multiple simultaneous calls for the same endpoint', async () => {
    let networkCalls = 0;
    const fakeFetch = async (url: string) => {
      networkCalls++;
      await new Promise((r) => setTimeout(r, 10));
      return { url, timestamp: Date.now() };
    };

    const inFlight = new Map<string, Promise<any>>();

    const getOrFetch = (endpoint: string) => {
      if (inFlight.has(endpoint)) {
        return inFlight.get(endpoint)!;
      }
      const promise = fakeFetch(endpoint).finally(() => {
        inFlight.delete(endpoint);
      });
      inFlight.set(endpoint, promise);
      return promise;
    };

    // Fire 5 simultaneous calls for '/rooms'
    const results = await Promise.all([
      getOrFetch('/rooms'),
      getOrFetch('/rooms'),
      getOrFetch('/rooms'),
      getOrFetch('/rooms'),
      getOrFetch('/rooms'),
    ]);

    // Backend should receive only 1 call!
    expect(networkCalls).toBe(1);
    expect(results.length).toBe(5);
  });

  it('should return cached data instantly when fresh and invalidate when requested', () => {
    const memory = new Map<string, { data: any; timestamp: number }>();

    const setCache = (key: string, data: any) => {
      memory.set(key, { data, timestamp: Date.now() });
    };

    const getCache = (key: string, maxAge = 20_000) => {
      const entry = memory.get(key);
      if (!entry) return null;
      if (Date.now() - entry.timestamp < maxAge) {
        return entry.data;
      }
      return null;
    };

    const invalidate = (pattern: string) => {
      const reg = new RegExp(pattern);
      for (const k of Array.from(memory.keys())) {
        if (reg.test(k)) {
          memory.delete(k);
        }
      }
    };

    setCache('/tasks/my', [{ id: 1, title: 'Test Task' }]);
    setCache('/rooms', [{ id: 'room-1' }]);

    expect(getCache('/tasks/my')).toEqual([{ id: 1, title: 'Test Task' }]);
    expect(getCache('/rooms')).toEqual([{ id: 'room-1' }]);

    // Invalidate tasks only
    invalidate('^/tasks');
    expect(getCache('/tasks/my')).toBeNull();
    expect(getCache('/rooms')).toEqual([{ id: 'room-1' }]);
  });
});
