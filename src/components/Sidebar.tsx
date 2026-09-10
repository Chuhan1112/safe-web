// src/components/Sidebar.tsx — 响应式侧边栏（桌面图标+文字 / 移动底部 Tab 栏）
import { cn } from '@/lib/utils'
import { BarChart3, LineChart, Target, Zap, Database, HeartPulse, FlaskConical, ListChecks, Moon, Sun, Sparkles, Search, Wifi, WifiOff } from 'lucide-react'
import { useMarket } from '@/contexts/MarketContext'
import { api } from '@/lib/api/client'
import { useState, useEffect } from 'react'
import type { Theme } from '@/hooks/useIsDark'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  theme: Theme
  onThemeToggle: () => void
  canOpenPrivate: boolean
  onNavigateToPrivate: (tab: string) => void
}

const publicNavItems = [
  { id: 'backtest', icon: BarChart3, label: '回测' },
  { id: 'optimizer', icon: Target, label: '优化' },
  { id: 'health', icon: HeartPulse, label: '健康' },
  { id: 'experiments', icon: FlaskConical, label: '实验' },
  { id: 'signals', icon: ListChecks, label: '信号' },
  { id: 'analysis', icon: LineChart, label: '分析' },
  { id: 'research', icon: Search, label: '研究' },
]

const privateNavItems = [
  { id: 'screener', icon: LineChart, label: '筛选' },
  { id: 'scorer', icon: Zap, label: '打分' },
  { id: 'data', icon: Database, label: '数据' },
]

function NavButton({ item, isActive, onClick }: { item: { id: string; icon: React.ComponentType<{ className?: string }>; label: string }; isActive: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 w-9 md:h-9 md:w-12 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] flex-col gap-0.5',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      title={item.label}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-2xs leading-none hidden md:block">{item.label}</span>
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary hidden md:block transition-all duration-200',
          isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
        )}
      />
    </button>
  )
}

interface HealthSummary {
  market: string
  total: number
  healthy: number
  stale: number
  missing: number
  anomaly: number
  unknown: number
  last_checked_at: string
}

function DataStatusDot() {
  const { market } = useMarket()
  const [status, setStatus] = useState<'fresh' | 'stale' | 'unknown'>('unknown')

  useEffect(() => {
    const controller = new AbortController()
    api.get<HealthSummary>('/data/health/summary', { market }, controller.signal)
      .then((data) => {
        if (!data || !data.total) {
          setStatus('unknown')
          return
        }
        const bad = (data.stale || 0) + (data.missing || 0) + (data.anomaly || 0)
        setStatus(bad === 0 ? 'fresh' : 'stale')
      })
      .catch(() => setStatus('unknown'))
    return () => controller.abort()
  }, [market])

  return (
    <div className="flex flex-col items-center gap-0.5" title={
      status === 'fresh' ? '数据已最新' : status === 'stale' ? '数据已过期' : '数据状态未知'
    }>
      {status === 'fresh' ? (
        <Wifi className="h-3 w-3 text-emerald-400" />
      ) : status === 'stale' ? (
        <WifiOff className="h-3 w-3 text-amber-400" />
      ) : (
        <Wifi className="h-3 w-3 text-muted-foreground/40" />
      )}
    </div>
  )
}

function SidebarMarketToggle() {
  const { market, setMarket } = useMarket()
  const isUS = market === 'US'
  return (
    <div className="mb-2 flex flex-col items-center gap-1">
      <button
        onClick={() => setMarket('US')}
        aria-pressed={isUS}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md text-2xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
          isUS
            ? 'bg-market-us/10 text-market-us'
            : 'text-muted-foreground hover:text-foreground',
        )}
        title="美股"
      >
        US
      </button>
      <button
        onClick={() => setMarket('CN')}
        aria-pressed={!isUS}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md text-2xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
          !isUS
            ? 'bg-market-cn/10 text-market-cn'
            : 'text-muted-foreground hover:text-foreground',
        )}
        title="A股"
      >
        CN
      </button>
    </div>
  )
}

export const Sidebar = ({ activeView, onViewChange, theme, onThemeToggle, canOpenPrivate, onNavigateToPrivate }: SidebarProps) => {
  const allItems = [...publicNavItems, ...(canOpenPrivate ? privateNavItems : [])]

  return (
    <>
      {/* 桌面端垂直侧边栏 — md+ 显示 */}
      <nav className="hidden md:flex h-screen w-16 flex-col items-center border-r border-border py-4">
        <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          {publicNavItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onClick={() => onViewChange(item.id)}
            />
          ))}
          {canOpenPrivate && (
            <>
              <div className="my-1 h-px w-6 bg-border" />
              {privateNavItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activeView === 'private'}
                  onClick={() => onNavigateToPrivate(item.id)}
                />
              ))}
            </>
          )}
        </div>

        <SidebarMarketToggle />
        <DataStatusDot />

        <button
          onClick={onThemeToggle}
          aria-label="切换主题"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          title={theme === 'light' ? '切换到 Dark 主题' : theme === 'dark' ? '切换到 Perplexity 主题' : '切换到 Light 主题'}
        >
          {theme === 'light' ? <Sun className="h-[18px] w-[18px]" /> : theme === 'dark' ? <Moon className="h-[18px] w-[18px]" /> : <Sparkles className="h-[18px] w-[18px]" />}
        </button>
      </nav>

      {/* 移动端底部 Tab 栏 — 仅 <md 显示 */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around md:hidden',
        'h-14 border-t border-border bg-background/95 backdrop-blur-md',
      )}>
        {allItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeView || (canOpenPrivate && activeView === 'private' && privateNavItems.some(p => p.id === item.id))
          return (
            <button
              key={item.id}
              onClick={() => {
                if (privateNavItems.some(p => p.id === item.id) && canOpenPrivate) {
                  onNavigateToPrivate(item.id)
                } else {
                  onViewChange(item.id)
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] min-w-0',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-2xs leading-none">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={onThemeToggle}
          aria-label="切换主题"
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          title={theme === 'light' ? '切换到 Dark 主题' : theme === 'dark' ? '切换到 Perplexity 主题' : '切换到 Light 主题'}
        >
          {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          <span className="text-2xs leading-none">主题</span>
        </button>
      </nav>
    </>
  )
}
