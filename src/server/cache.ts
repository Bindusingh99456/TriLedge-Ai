import { logStructured } from "../utils/logger.js";

// Memory cache fallback store if Redis environment connection is offline
const inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

export class CacheAsideService {
  private static prefix = "triledger:cache:";

  /**
   * Get cached value or execute fallback data fetcher and store result
   */
  public static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<{ data: T; source: "cache" | "database" }> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();

    // Check Memory Cache
    const item = inMemoryCache.get(fullKey);
    if (item && item.expiresAt > now) {
      logStructured("debug", `Cache HIT for key: ${key}`, { cacheKey: key });
      return { data: item.value as T, source: "cache" };
    }

    logStructured("debug", `Cache MISS for key: ${key}. Fetching from origin source...`, { cacheKey: key });
    
    // Execute Origin Data Fetch
    const freshData = await fetchFn();

    // Store in Cache with TTL
    inMemoryCache.set(fullKey, {
      value: freshData,
      expiresAt: now + ttlSeconds * 1000
    });

    return { data: freshData, source: "database" };
  }

  /**
   * Invalidate specific key or namespace pattern on mutation/write
   */
  public static invalidate(keyOrPattern: string): void {
    const fullKey = `${this.prefix}${keyOrPattern}`;
    let count = 0;

    for (const key of inMemoryCache.keys()) {
      if (key === fullKey || key.startsWith(fullKey)) {
        inMemoryCache.delete(key);
        count++;
      }
    }

    logStructured("info", `Cache INVALIDATED for key/pattern: ${keyOrPattern}`, { invalidatedKeys: count });
  }

  /**
   * Flush entire cache store
   */
  public static clearAll(): void {
    inMemoryCache.clear();
    logStructured("info", "Entire cache store cleared");
  }
}
