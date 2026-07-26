import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'perplexity'

/**
 * Reactively tracks whether the current theme is dark (dark or perplexity).
 * If `theme` is provided, it wins over DOM observation.
 */
export function useIsDark(theme?: Theme): boolean {
  const [observedIsDark, setObservedIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' && !document.documentElement.classList.contains('light'),
  )

  useEffect(() => {
    if (theme !== undefined) return

    const sync = () => setObservedIsDark(!document.documentElement.classList.contains('light'))
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    sync()
    return () => observer.disconnect()
  }, [theme])

  return theme !== undefined ? theme !== 'light' : observedIsDark
}
