import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataHealthTable } from '@/components/DataHealthTable'
import { DataHealthDetailDrawer } from '@/components/DataHealthDetailDrawer'
import { useMarket } from '@/contexts/MarketContext'
import { requestCache } from '@/utils/requestCache'
import { deduplicateRequest } from '@/utils/deduplicateRequest'

const API = 'http://127.0.0.1:8000'

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

const SUMMARY_CARDS: { key: keyof HealthSummary; label: string; color: string }[] = [
  { key: 'healthy', label: '健康', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'stale', label: '过期', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'missing', label: '缺失', color: 'text-red-600 dark:text-red-400' },
  { key: 'anomaly', label: '异常', color: 'text-purple-600 dark:text-purple-400' },
]

// ── 组件 ──────────────────────────────────────────────────────

export const DataHealthPage = memo(function DataHealthPage() {
  const { market } = useMarket()
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [tickers, setTickers] = useState<TickerHealthRow[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicker, setSelectedTicker] = useState<TickerHealthRow | null>(null)
  const [loading, setLoading] = useState(false)

  // ── 缓存帮助函数 ──────────────────────────────────────────

  const cachedFetch = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async <T,>(url: string, cacheKey: string, ttlMs = 60_000): Promise<T> => {
      const cached = requestCache.get<T>(cacheKey)
      if (cached) return cached as T
      return deduplicateRequest(cacheKey, async () => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        requestCache.set(cacheKey, data, ttlMs)
        return data as T
      })
    },
    [],
  )

  // ── 数据获取 ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryData, tickersData] = await Promise.all([
        cachedFetch<HealthSummary>(
          `${API}/data/health/summary?market=${market}`,
          `health-summary-${market}`,
          60_000,
        ),
        cachedFetch<TickerHealthRow[]>(
          `${API}/data/health/tickers?market=${market}`,
          `health-tickers-${market}`,
          60_000,
        ),
      ])
      setSummary(summaryData)
      setTickers(tickersData)
    } catch (err) {
      console.error('获取数据健康信息失败:', err)
    } finally {
      setLoading(false)
    }
  }, [market, cachedFetch])

  // 切市场时清空旧选中（可能属于不同市场）
  useEffect(() => {
    setSelectedTicker(null)
  }, [market])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── 过滤 ──────────────────────────────────────────────────

  const filteredTickers = useMemo(() => {
    if (!statusFilter) return tickers
    return tickers.filter((t) => t.status === statusFilter)
  }, [tickers, statusFilter])

  // ── 修复 ──────────────────────────────────────────────────

  const handleRepair = useCallback(
    async (symbol: string) => {
      try {
        const res = await fetch(`${API}/data/health/ticker/${symbol}/repair?market=${market}`, {
          method: 'POST',
        })
        if (res.ok) {
          // 修复后失效缓存，拉取最新数据
          requestCache.invalidate(`health-summary-${market}`)
          requestCache.invalidate(`health-tickers-${market}`)
          await fetchData()
          setSelectedTicker(null)
        }
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
            <h1 className="text-2xl font-semibold">数据健康中心</h1>
            <span className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold',
              market === 'US'
                ? 'bg-primary/10 text-primary'
                : 'bg-red-500/10 text-red-500',
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
                  <div className={cn('text-2xl font-bold', card.color)}>
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
                <div className="text-2xl font-bold">{summary.total}</div>
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

        {/* 表格 */}
        <DataHealthTable
          data={filteredTickers}
          onSelect={setSelectedTicker}
          selectedSymbol={selectedTicker?.symbol}
          market={market}
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
