import { useEffect, useState } from 'react'

/**
 * Reactively tracks whether the current theme is dark.
 * If `theme` prop is provided, uses it directly.
 * Otherwise observes `document.documentElement.classList` via MutationObserver.
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
    sync() // catch any change between render and observer attachment
    return () => observer.disconnect()
  }, [theme])

  return theme !== undefined ? theme === 'dark' : observedIsDark
}
