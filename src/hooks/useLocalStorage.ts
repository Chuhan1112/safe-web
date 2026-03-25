import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
          try {
            window.localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // localStorage full or private mode, ignore silently
          }
          return next
        })
      } catch {
        // ignore
      }
    },
    [key],
  )

  return [storedValue, setValue] as const
}
