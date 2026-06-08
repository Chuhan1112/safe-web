import { useState, useCallback } from 'react'
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

const STRATEGIES = [
  'ADAPTIVE_MOMENTUM',
  'ULTIMATE_COMBINED',
  'MOMENTUM',
  'MEAN_REVERSION',
  'COMMANDER',
  'MACD_REVERSAL',
]

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
                {STRATEGIES.map((s) => (
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
    </div>
  )
}
