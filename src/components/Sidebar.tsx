// src/components/Sidebar.tsx
import { cn } from '@/lib/utils'
import { BarChart3, LineChart, ListChecks, Settings, Moon, Sun, HeartPulse, FlaskConical, ListTodo } from 'lucide-react'
import { useMarket } from '@/contexts/MarketContext'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

const navItems = [
  { id: 'backtest', icon: BarChart3, label: '回测' },
  { id: 'screener', icon: LineChart, label: '筛选' },
  { id: 'signals', icon: ListChecks, label: '信号' },
  { id: 'health', icon: HeartPulse, label: '数据健康' },
  { id: 'experiments', icon: FlaskConical, label: '实验记录' },
  { id: 'optimizer-tasks', icon: ListTodo, label: '优化任务' },
  { id: 'settings', icon: Settings, label: '设置' },
]

export const Sidebar = ({ activeView, onViewChange, theme, onThemeToggle }: SidebarProps) => (
  <nav className="flex h-screen w-14 flex-col items-center border-r border-border py-4">
    <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
      <BarChart3 className="h-4 w-4 text-primary" />
    </div>

    <div className="flex flex-1 flex-col items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
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
      })}
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
