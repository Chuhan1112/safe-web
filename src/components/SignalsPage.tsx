import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { Alert } from '@/components/Alert'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SignalExplanationDrawer } from '@/components/SignalExplanationDrawer'
import { useMarket } from '@/contexts/MarketContext'
import { useMarketScope } from '@/hooks/useMarketScope'
import { usePageVisible } from '@/hooks/usePageVisible'
import { useMarketColors } from '@/hooks/useMarketColors'
import { usePolling } from '@/hooks/usePolling'
import { api } from '@/lib/api/client'
import { ALL_STRATEGIES, STRATEGY_LABELS } from '@/constants/strategies'

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
  const scope = useMarketScope(market)
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
  const [rankingError, setRankingError] = useState<string | null>(null)

  const pageVisible = usePageVisible()

  const fetchRanking = useCallback(async () => {
    const gen = scope.claim()
    setRankingLoading(true)
    setRankingError(null)
    try {
      const data = await api.get<{
        date: string
        rankings: { rank: number; ticker: string; price: number | null; momentum: number | null; above_sma: boolean | null }[]
      }>('/signals/momentum-ranking', { market, top_n: 20 }, scope.getSignal())
      if (!scope.alive(gen)) return
      setRankingData(data)
    } catch {
      if (!scope.alive(gen)) return
      setRankingData(null)
      setRankingError('动量排名加载失败，请稍后重试')
    } finally { if (scope.alive(gen)) setRankingLoading(false) }
  }, [market, scope])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  // 切市场时清空旧信号结果/动量排名/脉冲（旧市场数据不可留）
  useEffect(() => {
    setSignalsData(null)
    setError(null)
    setRankingData(null)
    setRankingError(null)
    setPulseData(null)
  }, [market])

  // 当前策略不在新市场列表时重置
  useEffect(() => {
    const strategies = ALL_STRATEGIES[market] || ALL_STRATEGIES.US
    if (!strategies.includes(strategyId)) {
      setStrategyId(strategies[0])
    }
  }, [market, strategyId])

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
    const gen = scope.claim()
    const symbols = signalsData.signals.map((s) => s.ticker)
    try {
      const data = await api.get<PulseData>('/signals/live/pulse', {
        symbols: symbols.join(','),
        market,
      }, scope.getSignal())
      if (!scope.alive(gen)) return
      setPulseData(data)
    } catch { /* pulse 静默失败 */ }
  }, [signalsData, market, scope])

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
    const gen = scope.claim()
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<SignalsResponse>('/signals/live', {
        strategy_id: strategyId,
        market,
        force_sync: true,
      })
      if (!scope.alive(gen)) return
      setSignalsData(data)
    } catch (e: unknown) {
      if (!scope.alive(gen)) return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (scope.alive(gen)) setLoading(false)
    }
  }, [strategyId, market, scope])

  const handleExplain = useCallback(async (signal: SignalItem) => {
    if (signal.explanation) {
      setSelectedSignal(signal)
      setDrawerOpen(true)
      return
    }

    setDrawerLoading(true)
    setSelectedSignal({ ...signal, explanation: undefined })
    setDrawerOpen(true)

    const gen = scope.claim()
    try {
      const params = { strategy_id: strategyId, market }
      const explanation = await api.get<{
        ticker: string
        action: string
        summary: string
        regime: string | null
        passed_conditions: { name: string; label: string; passed: boolean }[]
        failed_conditions: { name: string; label: string; passed: boolean }[]
        factor_contributions: { name: string; label: string; score: number; weight: number }[]
        risk_notes: string[]
      }>(`/signals/explain/${signal.ticker}`, params, scope.getSignal())
      if (!scope.alive(gen)) return
      setSelectedSignal({ ...signal, explanation: { ...explanation, ticker: signal.ticker, action: signal.action } })
    } catch {
      if (!scope.alive(gen)) return
      setSelectedSignal({ ...signal, explanation: undefined })
    } finally {
      if (scope.alive(gen)) setDrawerLoading(false)
    }
  }, [strategyId, market, scope])

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
                <SelectTrigger className="h-8 w-48 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(ALL_STRATEGIES[market] || ALL_STRATEGIES.US).map((s) => (
                    <SelectItem key={s} value={s}>{STRATEGY_LABELS[s] ?? s}</SelectItem>
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
      {error && <Alert variant="error" title="信号生成失败" description={error} />}

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
                        <td className="py-2.5 pr-4 text-right font-mono text-xs font-medium tabular-nums">
                          {sig.weight != null ? (sig.weight * 100).toFixed(1) + '%' : '--'}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs font-medium tabular-nums">
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
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-data-up/60 ${pageVisible ? 'animate-pulse will-change-[opacity]' : 'opacity-0'}`} />
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
                        <span className="font-mono text-xs font-medium tabular-nums">{cur?.toFixed(2) ?? '-'}</span>
                        {changePct != null && (
                          <span className={`font-mono text-xs font-medium tabular-nums ${changePct >= 0 ? upClass : downClass}`}>
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
                      className="text-xs font-mono font-medium tabular-nums"
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
                市场广度: <span className="font-mono text-xs font-medium tabular-nums">{pulseData.enhancements.market_breadth.up}</span>↑ / <span className="font-mono text-xs font-medium tabular-nums">{pulseData.enhancements.market_breadth.down}</span>↓
                (<span className="font-mono text-xs font-medium tabular-nums">{(pulseData.enhancements.market_breadth.up_ratio * 100).toFixed(0)}%</span> 上涨)
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
        <CardContent className="p-0">
          {rankingLoading && !rankingData ? (
            <div className="p-4"><TableSkeleton rows={8} /></div>
          ) : rankingError ? (
            <div className="p-4"><Alert variant="error" title="排名加载失败" description={rankingError} /></div>
          ) : rankingData && rankingData.rankings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 px-3">#</TableHead>
                    <TableHead className="px-3">Ticker</TableHead>
                    <TableHead className="px-3 text-right">Price</TableHead>
                    <TableHead className="px-3 text-right">动量</TableHead>
                    <TableHead className="w-14 px-3 text-center">SMA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingData.rankings.map((r) => (
                    <TableRow key={r.ticker}>
                      <TableCell className="px-3 py-1.5 font-mono text-xs font-medium tabular-nums text-muted-foreground">{r.rank}</TableCell>
                      <TableCell className="px-3 py-1.5 font-medium">{r.ticker}</TableCell>
                      <TableCell className="px-3 py-1.5 text-right font-mono text-xs font-medium tabular-nums">{r.price?.toFixed(2) ?? '-'}</TableCell>
                      <TableCell className={`px-3 py-1.5 text-right font-mono text-xs font-medium tabular-nums ${(r.momentum ?? 0) > 0 ? upClass : downClass}`}>
                        {r.momentum != null ? (r.momentum * 100).toFixed(1) + '%' : '-'}
                      </TableCell>
                      <TableCell className="px-3 py-1.5 text-center">
                        {r.above_sma === true ? <span className={upClass}>▲</span> : r.above_sma === false ? <span className={downClass}>▼</span> : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
