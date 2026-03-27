import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SafeWorkspace } from '@/components/SafeWorkspace'
import {
  hasPrivateOverlayModule,
  isPrivateOverlayEnabled,
  loadPrivateOverlay,
} from '@/lib/privateOverlay'
import { Moon, SunMedium } from 'lucide-react'
import type { ComponentType } from 'react'
import type { PrivateOverlayMeta } from '@/types/privateOverlay'

const defaultPrivateMeta: Required<PrivateOverlayMeta> = {
  label: 'Local Overlay',
  description: 'Trusted-machine-only workspace.',
  preferredView: 'private',
}

function App() {
  const privateOverlayEnabled = isPrivateOverlayEnabled()
  const privateOverlayPresent = hasPrivateOverlayModule()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('light')) return 'light'
      if (document.documentElement.classList.contains('dark')) return 'dark'
    }
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    }
    return 'dark'
  })
  const [view, setView] = useState<'safe' | 'private'>('safe')
  const [privateComponent, setPrivateComponent] = useState<ComponentType | null>(null)
  const [privateMeta, setPrivateMeta] = useState(defaultPrivateMeta)
  const [privateLoadState, setPrivateLoadState] = useState<'idle' | 'loading' | 'ready'>(
    privateOverlayEnabled && privateOverlayPresent ? 'loading' : 'idle',
  )
  const privateStatus =
    !privateOverlayEnabled
      ? 'disabled'
      : !privateOverlayPresent
        ? 'missing'
        : privateLoadState === 'ready' && privateComponent
          ? 'ready'
          : privateLoadState === 'loading'
            ? 'loading'
            : 'missing'

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const syncTheme = () => {
      const nextTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark'
      setTheme((current) => (current === nextTheme ? current : nextTheme))
    }

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    syncTheme()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!privateOverlayEnabled || !privateOverlayPresent || privateComponent) return () => {
      cancelled = true
    }

    loadPrivateOverlay()
      .then((module) => {
        if (cancelled || !module) return

        setPrivateComponent(() => module.default)
        setPrivateMeta({ ...defaultPrivateMeta, ...module.overlayMeta })
        setPrivateLoadState('ready')
        if ((module.overlayMeta?.preferredView ?? defaultPrivateMeta.preferredView) === 'private') {
          setView('private')
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [privateComponent, privateOverlayEnabled, privateOverlayPresent])

  const PrivateComponent = privateComponent
  const canOpenPrivate = privateStatus === 'ready' && PrivateComponent
  const activeView = view === 'private' && canOpenPrivate ? 'private' : 'safe'

  return (
    <div className="min-h-screen trading-shell bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Shared Frontend Workspace
              </p>
              <h1 className="text-base font-semibold tracking-[0.03em] text-foreground">
                safe-web
              </h1>
            </div>
            <div className="hidden rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground md:block">
              {privateStatus === 'ready'
                ? `${privateMeta.label} attached`
                : privateStatus === 'loading'
                  ? 'Loading local overlay'
                  : privateStatus === 'disabled'
                    ? 'Local overlay disabled'
                    : 'Safe-only mode'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'safe' ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setView('safe')}
            >
              Shared workspace
            </Button>
            <Button
              variant={activeView === 'private' ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => canOpenPrivate && setView('private')}
              disabled={!canOpenPrivate}
            >
              {privateMeta.label}
            </Button>
            {activeView !== 'private' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg border border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? <SunMedium /> : <Moon />}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Always keep both views mounted so background tasks survive tab switches */}
      <div className={activeView === 'private' ? 'hidden' : ''}>
        <SafeWorkspace
          hasPrivateOverlay={privateOverlayPresent}
          privateOverlayEnabled={privateOverlayEnabled}
        />
      </div>
      {PrivateComponent && (
        <div className={activeView !== 'private' ? 'hidden' : ''}>
          <PrivateComponent />
        </div>
      )}
    </div>
  )
}

export default App
