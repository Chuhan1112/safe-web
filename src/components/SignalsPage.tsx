import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { SignalExplanationDrawer } from '@/components/SignalExplanationDrawer'
import { useMarket } from '@/contexts/MarketContext'
import { usePageVisible } from '@/hooks/usePageVisible'
import { useMarketColors } from '@/hooks/useMarketColors'
import { usePolling } from '@/hooks/usePolling'
import { API_BASE as API } from '@/lib/api'

interface SignalItem {
  ticker: string
  name?: string
  action: string
  weight: number
  price: number
  reason: string
  explanation?: {
    ticker: string
    action: string
    summary: string
    regime: string | null
    passed_conditions: { name: string; label: string; passed: boolean }[]
    failed_conditions: { name: string; label: string; passed: boolean }[]
    factor_contributions: { name: string; label: string; score: number; weight: number }[]
    risk_notes: string[]
  }
}

interface SignalsResponse {
  date: string
  market_status: string
  signals: SignalItem[]
  portfolio: { ticker: string; weight: number }[]
  cash_weight: string
  metadata: Record<string, unknown>
}

// 策略列表按市场过滤：部分策略只在特定市场有效
const ALL_STRATEGIES: Record<string, string[]> = {
  US: [
    'ADAPTIVE_MOMENTUM',
    'MOMENTUM_CONFIRM',
    'ULTIMATE_COMBINED',
    'MOMENTUM',
    'COMMANDER',
    'PRACTICAL_ATR',
    'PRACTICAL_DONCHIAN',
    'PRACTICAL_VBO',
    'PRACTICAL_RSI',
  ],
  CN: [
    'ADAPTIVE_MOMENTUM',
    'MOMENTUM_CONFIRM',
    'MOMENTUM',
    'COMMANDER',
    'PRACTICAL_ATR',
    'PRACTICAL_DONCHIAN',
    'PRACTICAL_VBO',
    'PRACTICAL_BOLLINGER',
  ],
}

function actionBadgeVariant(action: string) {
  switch (action) {
    case 'BUY':
      return 'default'
    case 'SELL':
      return 'destructive'
    case 'HOLD':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function SignalsPage() {
  const { market } = useMarket()
  const { upClass, downClass } = useMarketColors()
  const [strategyId, setStrategyId] = useState('ADAPTIVE_MOMENTUM')
  const [loading, setLoading] = useState(false)
  const [signalsData, setSignalsData] = useState<SignalsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<SignalItem | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  // 动量排名仪表盘
  const [rankingData, setRankingData] = useState<{ date: string; rankings: { rank: number; ticker: string; price: number | null; momentum: number | null; above_sma: boolean | null }[] } | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)

  const pageVisible = usePageVisible()

  const fetchRanking = useCallback(async () => {
    setRankingLoading(true)
    try {
      const res = await fetch(`${API}/signals/momentum-ranking?market=${market}&top_n=20`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRankingData(await res.json())
    } catch { setRankingData(null) } finally { setRankingLoading(false) }
  }, [market])

  // 切市场时清空旧信号结果 + 当前策略不在新市场列表时重置
  useEffect(() => {
    setSignalsData(null)
    setError(null)
    const strategies = ALL_STRATEGIES[market] || ALL_STRATEGIES.US
    if (!strategies.includes(strategyId)) {
      setStrategyId(strategies[0])
    }
  }, [market])

  // ── 盘中脉冲轮询 ──
  interface PulseData {
    ts: string
    prices: { current: Record<string, number>; prev_close: Record<string, number> }
    enhancements: {
      ts?: string
      return_ranking?: { symbol: string; price: number; prev_close: number; change_pct: number; rank: number }[]
      breakout_signals?: { symbol: string; price: number; type: string; breakout_pct: number; volume_ratio: number }[]
      market_breadth?: { up: number; down: number; up_ratio: number }
    }
    market_open: boolean
    degraded: boolean
    degraded_reason: string
  }
  const [pulseData, setPulseData] = useState<PulseData | null>(null)

  const fetchPulse = useCallback(async () => {
    if (!signalsData || !signalsData.signals || signalsData.signals.length === 0) return
    const symbols = signalsData.signals.map((s) => s.ticker)
    try {
      const res = await fetch(`${API}/signals/live/pulse?symbols=${symbols.join(',')}&market=${market}`)
      if (!res.ok) return
      setPulseData(await res.json())
    } catch { /* pulse 静默失败 */ }
  }, [signalsData, market])

  // pulse 轮询: 每 45s 刷新一次盘中价格（页面 hidden 时自动暂停）
  const pulseEnabled = !!(signalsData && signalsData.metadata?.has_live_quotes)
  useEffect(() => {
    if (!pulseEnabled) setPulseData(null)
  }, [pulseEnabled])

  // 初次立即拉取一次 pulse，后续由 usePolling 定时触发
  const hasPulseRef = useRef(false)
  useEffect(() => {
    if (!pulseEnabled) {
      hasPulseRef.current = false
      return
    }
    if (!hasPulseRef.current) {
      fetchPulse()
      hasPulseRef.current = true
    }
  }, [pulseEnabled, fetchPulse])

  usePolling(fetchPulse, 45000, pulseEnabled)

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/signals/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: strategyId,
          market,
          force_sync: true,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(body.detail || `HTTP ${res.status}`)
      }
      const data: SignalsResponse = await res.json()
      setSignalsData(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [strategyId, market])

  const handleExplain = useCallback(async (signal: SignalItem) => {
    if (signal.explanation) {
      setSelectedSignal(signal)
      setDrawerOpen(true)
      return
    }

    setDrawerLoading(true)
    setSelectedSignal({ ...signal, explanation: undefined })
    setDrawerOpen(true)

    try {
      const params = new URLSearchParams({ strategy_id: strategyId, market })
      const res = await fetch(`${API}/signals/explain/${signal.ticker}?${params}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const explanation = await res.json()
      setSelectedSignal({ ...signal, explanation: { ...explanation, ticker: signal.ticker, action: signal.action } })
    } catch {
      setSelectedSignal({ ...signal, explanation: undefined })
    } finally {
      setDrawerLoading(false)
    }
  }, [strategyId, market])

  return (
    <PageContainer className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">信号生成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">策略</label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger className="h-9 w-48 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(ALL_STRATEGIES[market] || ALL_STRATEGIES.US).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchSignals} disabled={loading} size="sm">
              {loading ? '生成中...' : '生成信号'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Signals Table */}
      {signalsData && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                信号结果 — {signalsData.date}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                状态: {signalsData.market_status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {signalsData.signals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                无信号
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-2 pr-4">股票</th>
                      <th className="pb-2 pr-4">名称</th>
                      <th className="pb-2 pr-4">动作</th>
                      <th className="pb-2 pr-4 text-right">权重</th>
                      <th className="pb-2 pr-4 text-right">价格</th>
                      <th className="pb-2 pr-4">原因</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {signalsData.signals.map((sig, i) => (
                      <tr
                        key={`${sig.ticker}-${i}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-2.5 pr-4 font-medium">{sig.ticker}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">{sig.name || '--'}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={actionBadgeVariant(sig.action)}>
                            {sig.action}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono">
                          {sig.weight != null ? (sig.weight * 100).toFixed(1) + '%' : '--'}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono">
                          {sig.price?.toFixed(2) ?? '--'}
                        </td>
                        <td className="max-w-xs truncate py-2.5 pr-4 text-muted-foreground">
                          {sig.reason}
                        </td>
                        <td className="py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExplain(sig)}
                            className="h-7 gap-1 px-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            解释
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!signalsData && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl opacity-20 mb-3">📋</div>
          <p className="text-sm text-muted-foreground">
            选择策略和市场，点击"生成信号"查看结果
          </p>
        </div>
      )}

      {/* Explanation Drawer */}
      <SignalExplanationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={selectedSignal?.explanation ?? null}
        loading={drawerLoading}
      />

      {/* Pulse: 盘中实时价格 + 增强信号 */}
      {pulseData && !pulseData.degraded && (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-data-up/60 opacity-75 ${pageVisible ? 'animate-ping' : ''}`} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-data-up" />
                </span>
                盘中实时 {pulseData.market_open ? '● 交易中' : '○ 盘后'}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {pulseData.ts ? new Date(pulseData.ts).toLocaleTimeString() : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 持仓价格变动 */}
            {pulseData.prices?.current && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">持仓实时价格</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {signalsData?.portfolio?.map((p) => {
                    const cur = pulseData.prices.current[p.ticker]
                    const prev = pulseData.prices.prev_close?.[p.ticker]
                    const changePct = cur != null && prev != null && prev > 0 ? (cur - prev) / prev : null
                    return (
                      <div key={p.ticker} className="flex flex-col rounded bg-white/60 dark:bg-black/20 px-2 py-1.5 text-xs">
                        <span className="font-medium">{p.ticker}</span>
                        <span className="font-mono">{cur?.toFixed(2) ?? '-'}</span>
                        {changePct != null && (
                          <span className={`font-mono ${changePct >= 0 ? upClass : downClass}`}>
                            {changePct >= 0 ? '+' : ''}{(changePct * 100).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 突破信号 */}
            {pulseData.enhancements?.breakout_signals && pulseData.enhancements.breakout_signals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  盘中突破信号 ({pulseData.enhancements.breakout_signals.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {pulseData.enhancements.breakout_signals.slice(0, 10).map((bs, i) => (
                    <Badge
                      key={`${bs.symbol}:${bs.type}-${i}`}
                      variant={bs.type.includes('up') || bs.type === 'strong_up' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {bs.symbol} {bs.type.includes('up') ? '↑' : '↓'}+{Math.abs(bs.breakout_pct * 100).toFixed(1)}% vol{bs.volume_ratio}x
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 市场广度 */}
            {pulseData.enhancements?.market_breadth && (
              <p className="text-xs text-muted-foreground">
                市场广度: {pulseData.enhancements.market_breadth.up}↑ / {pulseData.enhancements.market_breadth.down}↓
                ({(pulseData.enhancements.market_breadth.up_ratio * 100).toFixed(0)}% 上涨)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 动量排名仪表盘 (Path A) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              动量排名 {rankingData ? `— ${rankingData.date}` : ''}
            </CardTitle>
            <Button onClick={fetchRanking} disabled={rankingLoading} size="sm" variant="outline">
              {rankingLoading ? '加载中...' : '刷新排名'}
            </Button>
          </div>
        </CardHeader>
        {rankingData && rankingData.rankings.length > 0 && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 px-3 text-left w-10">#</th>
                    <th className="py-2 px-3 text-left">Ticker</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">动量</th>
                    <th className="py-2 px-3 text-center w-14">SMA</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.rankings.map((r) => (
                    <tr key={r.ticker} className="border-b hover:bg-muted/50">
                      <td className="py-1.5 px-3 font-mono text-muted-foreground">{r.rank}</td>
                      <td className="py-1.5 px-3 font-medium">{r.ticker}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{r.price?.toFixed(2) ?? '-'}</td>
                      <td className={`py-1.5 px-3 text-right font-mono ${(r.momentum ?? 0) > 0 ? upClass : downClass}`}>
                        {r.momentum != null ? (r.momentum * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {r.above_sma === true ? <span className={upClass}>▲</span> : r.above_sma === false ? <span className={downClass}>▼</span> : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </PageContainer>
  )
}
