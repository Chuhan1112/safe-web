import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const VALID_THEMES: readonly Theme[] = ['light', 'dark']

/**
 * 解析初始主题：localStorage 白名单优先，其次 <html> 类名，默认 dark。
 * localStorage 只认两个合法值，脏数据回退（历史遗留的 'perplexity' 会一并回退到 dark）。
 */
export function getInitialTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const savedTheme = localStorage.getItem('theme')
    if (VALID_THEMES.includes(savedTheme as Theme)) return savedTheme as Theme
  }
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('light')) return 'light'
  }
  return 'dark'
}

/**
 * Reactively tracks whether the current theme is dark.
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
 * Reactively reads the actual two-state theme from <html>.
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark'
    const cls = document.documentElement.classList
    if (cls.contains('light')) return 'light'
    return 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const sync = () => {
      const cls = document.documentElement.classList
      setTheme(cls.contains('light') ? 'light' : 'dark')
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    sync()
    return () => observer.disconnect()
  }, [])

  return theme
}
