import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'perplexity'

const VALID_THEMES: readonly Theme[] = ['light', 'dark', 'perplexity']

/**
 * 解析初始主题：localStorage 白名单优先，其次 <html> 类名，默认 dark。
 * localStorage 只认三个合法值，脏数据回退。
 */
export function getInitialTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const savedTheme = localStorage.getItem('theme')
    if (VALID_THEMES.includes(savedTheme as Theme)) return savedTheme as Theme
  }
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('light')) return 'light'
    if (document.documentElement.classList.contains('perplexity')) return 'perplexity'
  }
  return 'dark'
}

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

/**
 * Reactively reads the actual three-state theme from <html>.
 * Private overlay UI needs this to distinguish dark from perplexity.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark'
    const cls = document.documentElement.classList
    if (cls.contains('light')) return 'light'
    if (cls.contains('perplexity')) return 'perplexity'
    return 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      const cls = document.documentElement.classList
      setTheme(cls.contains('light') ? 'light' : cls.contains('perplexity') ? 'perplexity' : 'dark')
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    sync()
    return () => observer.disconnect()
  }, [])

  return theme
}
