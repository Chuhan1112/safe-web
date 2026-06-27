import { useState, useMemo, lazy, Suspense, useEffect } from 'react'
import { MetricsGrid } from '@/components/MetricsGrid'
import { TradeLogsTable } from '@/components/TradeLogsTable'
import { RebalanceLogsTable } from '@/components/RebalanceLogsTable'
import { ChartSkeleton } from '@/components/skeletons/ChartSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  mockBacktestMetrics,
  mockEquityCurve,
  mockDrawdownCurve,
  mockTradeLogs,
  mockRebalanceLogs,
} from '@/mock/demoData'
import { cn } from '@/lib/utils'
import { Play, BarChart3, TrendingUp, Activity } from 'lucide-react'
import { BacktestDiagnostics } from '@/components/BacktestDiagnostics'
import { useMarket } from '@/contexts/MarketContext'

const BacktestChart = lazy(() => import('@/components/BacktestChart').then(m => ({ default: m.BacktestChart })))
const DataHealthPage = lazy(() => import('@/components/DataHealthPage').then(m => ({ default: m.DataHealthPage })))
const ExperimentsPage = lazy(() => import('@/components/ExperimentsPage').then(m => ({ default: m.ExperimentsPage })))
const OptimizerTasksPage = lazy(() => import('@/components/OptimizerTasksPage').then(m => ({ default: m.OptimizerTasksPage })))
const SignalsPage = lazy(() => import('@/components/SignalsPage').then(m => ({ default: m.SignalsPage })))
const ResearchPage = lazy(() => import('@/components/ResearchPage').then(m => ({ default: m.ResearchPage })))

interface SafeWorkspaceProps {
  activeView?: string
  hasPrivateOverlay: boolean
  privateOverlayEnabled: boolean
}

const bottomTabs = ['Metrics', 'Trades', 'Rebalance'] as const

export function SafeWorkspace({ activeView = 'backtest' }: SafeWorkspaceProps) {
  const { market } = useMarket()
  const [chartView, setChartView] = useState<'equity' | 'drawdown'>('equity')
  const [bottomTab, setBottomTab] = useState<(typeof bottomTabs)[number]>('Metrics')
  const [loading, setLoading] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // 切市场时清空本地状态（当前展示 mock 数据，但保持一致性）
  useEffect(() => {
    setLoading(false)
    setHoveredDate(null)
  }, [market])

  const metrics = useMemo(() => [
    { label: 'CAGR', value: mockBacktestMetrics.cagr, format: (v: number) => `${v.toFixed(1)}%`, color: 'text-emerald-500' },
    { label: 'Sharpe', value: mockBacktestMetrics.sharpe, format: (v: number) => v.toFixed(2), color: 'text-foreground' },
    { label: 'Max DD', value: mockBacktestMetrics.maxDrawdown, format: (v: number) => `${v.toFixed(1)}%`, color: 'text-red-500' },
    { label: 'Win Rate', value: mockBacktestMetrics.winRate, format: (v: number) => `${v.toFixed(1)}%`, color: 'text-foreground' },
    { label: 'Trades', value: mockBacktestMetrics.totalTrades, format: (v: number) => String(Math.round(v)), color: 'text-foreground' },
    { label: 'Return', value: mockBacktestMetrics.totalReturn, format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, color: 'text-emerald-500' },
  ], [])

  if (activeView === 'health') return <Suspense fallback={null}><DataHealthPage /></Suspense>
  if (activeView === 'experiments') return <Suspense fallback={null}><ExperimentsPage /></Suspense>
  if (activeView === 'optimizer') return <Suspense fallback={null}><OptimizerTasksPage /></Suspense>
  if (activeView === 'signals') return <Suspense fallback={null}><SignalsPage /></Suspense>
  if (activeView === 'research') return <Suspense fallback={null}><ResearchPage /></Suspense>

  if (activeView === 'screener' || activeView === 'scorer' || activeView === 'data') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-4xl opacity-20">
            {activeView === 'screener' ? '📈' : activeView === 'scorer' ? '⚡' : '💾'}
          </div>
          <p className="text-sm text-muted-foreground">
            {activeView === 'screener' ? '筛选器页面开发中...' : activeView === 'scorer' ? '打分页面开发中...' : '数据管理开发中...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <BarChart3 className="h-3 w-3" />
            MOMENTUM
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Activity className="h-3 w-3" />
            {market}
          </Badge>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setLoading(true)}>
          <Play className="h-3.5 w-3.5" />
          Run Backtest
        </Button>
      </div>

      {/* Chart area */}
      <Card className="mb-4 overflow-hidden">
        <CardHeader className="border-b border-border py-3 px-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-semibold">
                {chartView === 'equity' ? 'Equity Curve' : 'Drawdown'}
              </CardTitle>
              <CardDescription className="text-xs">
                {chartView === 'equity' ? 'Portfolio value over time' : 'Peak-to-trough decline'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={chartView === 'equity' ? 'secondary' : 'outline'}
                className={cn('h-7 text-xs', chartView === 'equity' && 'bg-primary text-primary-foreground')}
                onClick={() => setChartView('equity')}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Equity
              </Button>
              <Button
                size="sm"
                variant={chartView === 'drawdown' ? 'secondary' : 'outline'}
                className={cn('h-7 text-xs', chartView === 'drawdown' && 'bg-destructive text-destructive-foreground')}
                onClick={() => setChartView('drawdown')}
              >
                Drawdown
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <div className="w-full h-[400px]">
                <BacktestChart
                  data={chartView === 'equity' ? mockEquityCurve : mockDrawdownCurve}
                  onHoverTime={(time: string | null) => setHoveredDate(time)}
                  colors={{ backgroundColor: 'transparent' }}
                />
              </div>
            </Suspense>
          )}
        </CardContent>
      </Card>

      {/* Metrics grid */}
      <MetricsGrid metrics={metrics} className="mb-4" />

      {/* Diagnostics */}
      <div className="mb-4">
        <BacktestDiagnostics metrics={{
          totalReturn: mockBacktestMetrics.totalReturn,
          cagr: mockBacktestMetrics.cagr,
          sharpe: mockBacktestMetrics.sharpe,
          totalTrades: mockBacktestMetrics.totalTrades,
        }} />
      </div>

      {/* Bottom tabs */}
      <div className="mb-3 flex gap-1">
        {bottomTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setBottomTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              bottomTab === tab
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bottom content */}
      <Card>
        <CardContent className="p-0">
          {bottomTab === 'Metrics' && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {metrics.map((m) => (
                  <div key={m.label} className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
                    <span className={cn('text-2xl font-bold tabular-nums', m.color)}>
                      {m.format(m.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bottomTab === 'Trades' && (
            <TradeLogsTable
              logs={mockTradeLogs}
              logFilter=""
              t={{ action: 'Action', symbol: 'Symbol', price: 'Price', reason: 'Reason' }}
              handleTickerClick={(t) => console.log('click', t)}
              highlightDate={hoveredDate}
            />
          )}
          {bottomTab === 'Rebalance' && (
            <RebalanceLogsTable
              logs={mockRebalanceLogs}
              logFilter=""
              t={{ date: 'Date', portfolio_value: 'Value', selected_assets: 'Assets', weights: 'Weights', buy: 'Buy', holds: 'Hold', sold: 'Sold', empty_position: 'Empty', cash_weight: 'Cash' }}
              handleTickerClick={(t) => console.log('click', t)}
              comparePalette={['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6']}
              highlightDate={hoveredDate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
