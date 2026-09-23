/**
 * Lightweight in-memory cache for stale-while-revalidate data fetching.
 *
 * This Map lives at module scope so it survives Next.js client-side
 * route transitions. Data fetched on /daily is still in memory when
 * you navigate back — so the page renders instantly from the cache
 * while a background refresh runs silently.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const pageCache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key);
    return entry ? (entry.data as T) : undefined;
  },

  set<T>(key: string, data: T): void {
    store.set(key, { data, cachedAt: Date.now() });
  },

  invalidate(key: string): void {
    store.delete(key);
  },
};
