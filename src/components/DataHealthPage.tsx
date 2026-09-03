import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataHealthTable } from '@/components/DataHealthTable'
import type { ViewMode } from '@/utils/dataHealth'
import { DataHealthDetailDrawer } from '@/components/DataHealthDetailDrawer'
import { useMarket } from '@/contexts/MarketContext'
import { useMarketScope } from '@/hooks/useMarketScope'
import { requestCache } from '@/utils/requestCache'
import { deduplicateRequest } from '@/utils/deduplicateRequest'
import { api } from '@/lib/api/client'

// ── 类型 ──────────────────────────────────────────────────────

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

interface TickerHealthRow {
  symbol: string
  market: string
  latest_date: string | null
  effective_date: string
  status: string
  name: string | null
  missing_days: number
  anomaly_count: number
  provider: string | null
  last_checked_at: string
  notes: string[]
}

// ── 常量 ──────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: '', label: '全部' },
  { key: 'healthy', label: '健康' },
  { key: 'stale', label: '过期' },
  { key: 'missing', label: '缺失' },
  { key: 'anomaly', label: '异常' },
] as const


const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'limited', label: '默认 200 行' },
  { key: 'abnormal', label: '仅显示异常' },
  { key: 'all', label: '显示全部' },
]

const SUMMARY_CARDS: { key: keyof HealthSummary; label: string; color: string }[] = [
  { key: 'healthy', label: '健康', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'stale', label: '过期', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'missing', label: '缺失', color: 'text-red-600 dark:text-red-400' },
  { key: 'anomaly', label: '异常', color: 'text-purple-600 dark:text-purple-400' },
]

// ── 组件 ──────────────────────────────────────────────────────

export const DataHealthPage = memo(function DataHealthPage() {
  const { market } = useMarket()
  const scope = useMarketScope(market)
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [tickers, setTickers] = useState<TickerHealthRow[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicker, setSelectedTicker] = useState<TickerHealthRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('limited')

  // ── 缓存帮助函数 ──────────────────────────────────────────

  const cachedFetch = useCallback(
    async <T,>(
      url: string,
      params: Record<string, unknown> | undefined,
      cacheKey: string,
      ttlMs = 60_000,
      signal?: AbortSignal,
    ): Promise<T> => {
      const cached = requestCache.get<T>(cacheKey)
      if (cached) return cached as T
      return deduplicateRequest(cacheKey, async () => {
        const data = await api.get<T>(url, params, signal)
        requestCache.set(cacheKey, data, ttlMs)
        return data as T
      })
    },
    [],
  )

  // ── 数据获取 ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const gen = scope.claim()
    setLoading(true)
    try {
      const [summaryData, tickersData] = await Promise.all([
        cachedFetch<HealthSummary>(
          '/data/health/summary',
          { market },
          `health-summary-${market}`,
          60_000,
          scope.getSignal(),
        ),
        cachedFetch<TickerHealthRow[]>(
          '/data/health/tickers',
          { market },
          `health-tickers-${market}`,
          60_000,
          scope.getSignal(),
        ),
      ])
      if (!scope.alive(gen)) return
      setSummary(summaryData)
      setTickers(tickersData)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      console.error('获取数据健康信息失败:', err)
    } finally {
      if (scope.alive(gen)) setLoading(false)
    }
  }, [market, cachedFetch, scope])

  // 切市场时清空旧数据（选中 + 汇总 + 列表），避免旧市场数字闪现
  useEffect(() => {
    setSelectedTicker(null)
    setSummary(null)
    setTickers([])
  }, [market])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 监听 sync 完成事件：失效缓存并 refetch（sync 后健康统计已变）
  useEffect(() => {
    const handler = (e: Event) => {
      const detailMarket = (e as CustomEvent<{ market?: string }>).detail?.market
      if (detailMarket && detailMarket !== market) return
      requestCache.invalidate(`health-summary-${market}`)
      requestCache.invalidate(`health-tickers-${market}`)
      fetchData()
    }
    window.addEventListener('data:sync-complete', handler)
    return () => window.removeEventListener('data:sync-complete', handler)
  }, [market, fetchData])

  // ── 过滤 ──────────────────────────────────────────────────

  const filteredTickers = useMemo(() => {
    if (!statusFilter) return tickers
    return tickers.filter((t) => t.status === statusFilter)
  }, [tickers, statusFilter])

  // ── 修复 ──────────────────────────────────────────────────

  const handleRepair = useCallback(
    async (symbol: string) => {
      try {
        await api.post(`/data/health/ticker/${symbol}/repair?market=${market}`)
        // 修复后失效缓存，拉取最新数据
        requestCache.invalidate(`health-summary-${market}`)
        requestCache.invalidate(`health-tickers-${market}`)
        await fetchData()
        setSelectedTicker(null)
      } catch (err) {
        console.error('修复失败:', err)
      }
    },
    [market, fetchData],
  )

  // ── 渲染 ──────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* 标题行 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">数据健康中心</h1>
            <span className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold',
              market === 'US'
                ? 'bg-market-us/10 text-market-us'
                : 'bg-market-cn/10 text-market-cn',
            )}>
              {market === 'US' ? '美股' : 'A股'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => { requestCache.invalidate(`health-summary-${market}`); requestCache.invalidate(`health-tickers-${market}`); fetchData() }} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </Button>
        </div>

        {/* 汇总卡片 */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {SUMMARY_CARDS.map((card) => (
              <Card
                key={card.key}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  statusFilter === card.key && 'ring-2 ring-primary/40',
                )}
                onClick={() =>
                  setStatusFilter((prev) => (prev === card.key ? '' : card.key))
                }
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn('text-2xl font-bold font-mono tabular-nums', card.color)}>
                    {(summary[card.key] as number) ?? 0}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">总计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums">{summary.total}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 筛选按钮 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* 视图切换 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {VIEW_MODES.map((m) => (
            <Button
              key={m.key}
              variant={viewMode === m.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        {/* 表格 */}
        <DataHealthTable
          data={filteredTickers}
          onSelect={setSelectedTicker}
          selectedSymbol={selectedTicker?.symbol}
          market={market}
          viewMode={viewMode}
        />
      </div>

      {/* 详情抽屉 */}
      <DataHealthDetailDrawer
        ticker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
        onRepair={handleRepair}
      />
    </div>
  )
})
