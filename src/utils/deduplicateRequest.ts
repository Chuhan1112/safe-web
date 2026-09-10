const pending = new Map<string, Promise<unknown>>()

/** 60s 超时：防止 factory 永不 settle 导致 pending 无限增长 */
const DEDUP_TIMEOUT_MS = 60_000

export function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const existing = pending.get(key)
  if (existing) return existing as Promise<T>

  const promiseRef: { current: Promise<T> | null } = { current: null }
  const clearPending = () => {
    if (pending.get(key) === promiseRef.current) pending.delete(key)
    signal?.removeEventListener('abort', clearPending)
  }

  const promise = Promise.race([
    factory(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('dedup timeout')), DEDUP_TIMEOUT_MS),
    ),
  ]).finally(clearPending) as Promise<T>
  promiseRef.current = promise
  pending.set(key, promise)
  if (signal) {
    if (signal.aborted) clearPending()
    else signal.addEventListener('abort', clearPending, { once: true })
  }
  return promise
}
