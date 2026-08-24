/**
 * Simple in-memory TTL cache for repository analysis results
 *
 * NOTE: This cache only helps within a single warm serverless instance.
 * Vercel functions are stateless across cold starts and may be scaled to
 * multiple concurrent instances, so this does NOT provide global caching
 * across all requests. It's an acceptable tradeoff for now to reduce
 * GitHub API calls for repeat lookups without introducing external infra
 * (e.g. Redis). A durable cache would require an external store.
 */

const DEFAULT_TTL_MS = 7 * 60 * 1000; // 7 minutes

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
