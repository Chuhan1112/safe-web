import { useEffect, useLayoutEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { SafeWorkspace } from '@/components/SafeWorkspace'
import {
  hasPrivateOverlayModule,
  isPrivateOverlayEnabled,
  loadPrivateOverlay,
} from '@/lib/privateOverlay'
import type { ComponentType } from 'react'
import { MarketProvider } from '@/contexts/MarketContext'
import { getInitialTheme, type Theme } from '@/hooks/useIsDark'

function App() {
  const privateOverlayEnabled = isPrivateOverlayEnabled()
  const privateOverlayPresent = hasPrivateOverlayModule()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [activeView, setActiveView] = useState('backtest')
  const [privateComponent, setPrivateComponent] = useState<ComponentType | null>(null)
  const [privateLoadState, setPrivateLoadState] = useState<'idle' | 'loading' | 'ready'>(
    privateOverlayEnabled && privateOverlayPresent ? 'loading' : 'idle',
  )
  const privateStatus =
    !privateOverlayEnabled ? 'disabled'
      : !privateOverlayPresent ? 'missing'
        : privateLoadState === 'ready' && privateComponent ? 'ready'
          : privateLoadState === 'loading' ? 'loading'
            : 'missing'

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.remove('light', 'dark', 'perplexity')
    document.documentElement.classList.add(theme)
  }, [theme])

  useEffect(() => {
    if (typeof document === 'undefined') return
    localStorage.setItem('theme', theme)
  }, [theme])

  // 私有工作区的主题按钮也由这里统一处理，避免两个 App 互相覆盖 <html> 类名。
  useEffect(() => {
    const handleThemeToggle = () => {
      setTheme((v) => (v === 'light' ? 'dark' : v === 'dark' ? 'perplexity' : 'light'))
    }
    window.addEventListener('cortex:theme-toggle', handleThemeToggle)
    return () => window.removeEventListener('cortex:theme-toggle', handleThemeToggle)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const syncTheme = () => {
      const cls = document.documentElement.classList
      let nextTheme: Theme = 'dark'
      if (cls.contains('light')) nextTheme = 'light'
      else if (cls.contains('perplexity')) nextTheme = 'perplexity'
      setTheme((current) => (current === nextTheme ? current : nextTheme))
    }
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    syncTheme()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!privateOverlayEnabled || !privateOverlayPresent || privateComponent) return () => { cancelled = true }
    loadPrivateOverlay()
      .then((module) => {
        if (cancelled || !module) return
        setPrivateComponent(() => module.default)
        setPrivateLoadState('ready')
        if (module.overlayMeta?.preferredView === 'private') {
          setActiveView('private')
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [privateComponent, privateOverlayEnabled, privateOverlayPresent])

  const PrivateComponent = privateComponent
  const canOpenPrivate = privateStatus === 'ready' && PrivateComponent
  const isPrivateView = activeView === 'private' && canOpenPrivate

  return (
    <MarketProvider>
    <div className="flex h-screen overflow-hidden trading-shell bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === 'private' && canOpenPrivate) setActiveView(view)
          else if (view !== 'private') setActiveView(view)
        }}
        theme={theme}
        onThemeToggle={() => setTheme((v) => (v === 'light' ? 'dark' : v === 'dark' ? 'perplexity' : 'light'))}
        canOpenPrivate={!!canOpenPrivate}
        onNavigateToPrivate={(tab) => {
          if (!canOpenPrivate) return
          window.dispatchEvent(new CustomEvent('cortex:navigate', { detail: { tab } }))
          setActiveView('private')
        }}
      />

      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
        <div className={isPrivateView ? 'hidden' : ''}>
          <SafeWorkspace
            activeView={activeView}
            hasPrivateOverlay={privateOverlayPresent}
            privateOverlayEnabled={privateOverlayEnabled}
          />
        </div>
        {PrivateComponent && (
          <div className={!isPrivateView ? 'hidden' : ''}>
            <PrivateComponent />
          </div>
        )}
      </main>
    </div>
    </MarketProvider>
  )
}

export default App
