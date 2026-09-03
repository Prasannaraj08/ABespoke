/**
 * Production-hardened Bounded LRU Cache with TTL support.
 * Zero-dependency, memory-capped (prevents Out-Of-Memory DoS - CWE-400).
 * Automatic Least-Recently-Used eviction when capacity is reached.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

class BoundedLRUCache {
  private store = new Map<string, CacheEntry<any>>();
  private readonly maxEntries: number;
  private readonly maxKeyLength = 256;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
    // Sweep expired entries every 3 minutes
    setInterval(() => this.sweep(), 3 * 60 * 1000).unref();
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (!key || typeof key !== 'string' || key.length > this.maxKeyLength) {
      return; // Reject invalid or excessively large keys
    }

    const now = Date.now();

    // If key exists, delete first to re-insert at end (Map preserves insertion order)
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      lastAccessed: now
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh LRU order by re-inserting
    this.store.delete(key);
    entry.lastAccessed = now;
    this.store.set(key, entry);

    return entry.value as T;
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys that start with the given prefix */
  delPattern(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new BoundedLRUCache(500);

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
