import { useEffect, useState } from 'react'

/**
 * Reactively tracks whether the current theme is dark.
 * If `theme` is provided, it wins over DOM observation.
 */
export function useIsDark(theme?: 'light' | 'dark'): boolean {
  const [observedIsDark, setObservedIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    if (theme !== undefined) return

    const sync = () => setObservedIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    sync()
    return () => observer.disconnect()
  }, [theme])

  return theme !== undefined ? theme === 'dark' : observedIsDark
}
