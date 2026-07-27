/**
 * Lightweight in-memory TTL cache — zero-dependency, zero-cost.
 * Shared within a single Node.js process / serverless warm instance.
 * For multi-instance deployments, upgrade to Upstash Redis.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  constructor() {
    // Sweep expired entries every 5 minutes to prevent memory leak
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref();
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys that start with the given prefix */
  delPattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cache = new MemoryCache();

/** Canonical TTL values in milliseconds */
export const TTL = {
  PRODUCTS_LIST: 5 * 60 * 1000,        // 5 minutes
  PRODUCTS_META: 60 * 60 * 1000,       // 1 hour
  AI_PERSONALIZED: 10 * 60 * 1000,     // 10 minutes
  AI_SIMILAR: 30 * 60 * 1000,          // 30 minutes
  AI_BUNDLE: 30 * 60 * 1000,           // 30 minutes
  AI_SEARCH: 5 * 60 * 1000,            // 5 minutes
  DASHBOARD_STATS: 2 * 60 * 1000,      // 2 minutes
  BOUTIQUE_PUBLIC: 15 * 60 * 1000,     // 15 minutes
} as const;
