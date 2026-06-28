import { useState, useEffect, useCallback } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignalExplanationDrawer } from '@/components/SignalExplanationDrawer'
import { useMarket } from '@/contexts/MarketContext'

const API = 'http://127.0.0.1:8000'

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

  const handleExplain = async (signal: SignalItem) => {
    // If signal already has explanation attached, use it directly
    if (signal.explanation) {
      setSelectedSignal(signal)
      setDrawerOpen(true)
      return
    }

    // Otherwise fetch from explain endpoint
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
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">信号生成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">策略</label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(ALL_STRATEGIES[market] || ALL_STRATEGIES.US).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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
                          {(sig.weight * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono">
                          {sig.price.toFixed(2)}
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
                      <td className={`py-1.5 px-3 text-right font-mono ${(r.momentum ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.momentum != null ? (r.momentum * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {r.above_sma === true ? <span className="text-green-600">▲</span> : r.above_sma === false ? <span className="text-red-400">▼</span> : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
