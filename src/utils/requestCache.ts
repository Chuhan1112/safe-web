interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class RequestCache {
  private store = new Map<string, CacheEntry<unknown>>()
  /** 最大缓存条目数，超出后按 LRU 驱逐（Map 插入序即 LRU） */
  private maxSize = 200

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs = 60_000): void {
    if (this.store.size >= this.maxSize) {
      const first = this.store.keys().next().value
      if (first !== undefined) this.store.delete(first)
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export const requestCache = new RequestCache()
