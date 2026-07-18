const pending = new Map<string, Promise<unknown>>()

/** 60s 超时：防止 factory 永不 settle 导致 pending 无限增长 */
const DEDUP_TIMEOUT_MS = 60_000

export function deduplicateRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = pending.get(key)
  if (existing) return existing as Promise<T>

  const promise = Promise.race([
    factory(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('dedup timeout')), DEDUP_TIMEOUT_MS),
    ),
  ]).finally(() => {
    pending.delete(key)
  }) as Promise<T>
  pending.set(key, promise)
  return promise
}
