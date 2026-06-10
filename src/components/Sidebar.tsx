// src/components/Sidebar.tsx
import { cn } from '@/lib/utils'
import { BarChart3, LineChart, Target, Zap, Database, HeartPulse, FlaskConical, ListChecks, Moon, Sun, Search } from 'lucide-react'
import { useMarket } from '@/contexts/MarketContext'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  theme: 'light' | 'dark'
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
      className={cn(
        'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      title={item.label}
    >
      <Icon className="h-[18px] w-[18px]" />
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </button>
  )
}

function SidebarMarketToggle() {
  const { market, setMarket } = useMarket()
  const isUS = market === 'US'
  return (
    <div className="mb-2 flex flex-col items-center gap-1">
      <button
        onClick={() => setMarket('US')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold transition-colors',
          isUS
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        title="美股"
      >
        US
      </button>
      <button
        onClick={() => setMarket('CN')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold transition-colors',
          !isUS
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
        title="A股"
      >
        CN
      </button>
    </div>
  )
}

export const Sidebar = ({ activeView, onViewChange, theme, onThemeToggle, canOpenPrivate, onNavigateToPrivate }: SidebarProps) => (
  <nav className="flex h-screen w-14 flex-col items-center border-r border-border py-4">
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
          {/* private 视图内部自行路由 tab，此处所有 private 按钮统一高亮，仅作为入口指示 */}
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

    {/* 市场切换 */}
    <SidebarMarketToggle />
    <button
      onClick={onThemeToggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="切换主题"
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  </nav>
)
