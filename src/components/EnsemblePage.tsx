import { useEffect, useState } from 'react'
import { useMarket } from '@/contexts/MarketContext'
import { api } from '@/lib/api/client'
import type { EnsembleRunResponse } from '@/lib/api/ensemble'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/layout/PageContainer'
import { AlertCircle, Play, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESETS_BY_MARKET: Record<string, { value: string; label: string }[]> = {
  US: [
    { value: 'US_CORE_3', label: 'US_CORE_3 · MC + UC + RSI（推荐）' },
    { value: 'US_CORE_3_PDD', label: 'US_CORE_3_PDD · MC(PDD)（对照，PIT 下劣于基线）' },
  ],
  CN: [
    { value: 'CN_CORE_2_Q', label: 'CN_CORE_2_Q · UC + RSI(质量过滤)（推荐）' },
    { value: 'CN_CORE_2', label: 'CN_CORE_2 · UC + RSI（旧版对照）' },
    { value: 'CN_CORE_2_RISK', label: 'CN_CORE_2_RISK · UC + RSI · 周级DD监控' },
    { value: 'CN_CORE_3', label: 'CN_CORE_3 · MC + UC + RSI（legacy）' },
  ],
}

const DEFAULT_RANGE = { start: '2022-02-01', end: '2026-10-16' }

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

function signed(value: number, digits = 1): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-xl font-bold font-mono tabular-nums',
          tone === 'pos' && 'text-emerald-500',
          tone === 'neg' && 'text-destructive',
          !tone && 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function EnsemblePage() {
  const { market } = useMarket()
  const presets = PRESETS_BY_MARKET[market] ?? PRESETS_BY_MARKET.US
  const [preset, setPreset] = useState(presets[0]?.value ?? 'US_CORE_3_PDD')
  const [range, setRange] = useState(DEFAULT_RANGE)
  const [holdoutStart, setHoldoutStart] = useState('')
  const [result, setResult] = useState<EnsembleRunResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 切市场时同步切换 preset，并清空旧市场结果，避免 CN/US 串数据。
  useEffect(() => {
    const next = PRESETS_BY_MARKET[market]?.[0]?.value ?? 'US_CORE_3_PDD'
    setPreset(next)
    setResult(null)
    setError(null)
  }, [market])

  async function handleRun() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.runEnsemble({
        market,
        preset,
        startDate: range.start,
        endDate: range.end,
        holdoutStart: holdoutStart || undefined,
      })
      setResult(data)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ensemble-preset" className="text-2xs uppercase tracking-wider">
              Preset
            </Label>
            <select
              id="ensemble-preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            >
              {presets.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ensemble-start" className="text-2xs uppercase tracking-wider">
              Start
            </Label>
            <input
              id="ensemble-start"
              type="date"
              value={range.start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ensemble-end" className="text-2xs uppercase tracking-wider">
              End
            </Label>
            <input
              id="ensemble-end"
              type="date"
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ensemble-holdout" className="text-2xs uppercase tracking-wider">
              Holdout start
            </Label>
            <input
              id="ensemble-holdout"
              type="date"
              value={holdoutStart}
              onChange={(e) => setHoldoutStart(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            />
          </div>
        </div>
        <Button size="sm" className="gap-1.5" disabled={loading} onClick={handleRun}>
          <Play className="h-3.5 w-3.5" />
          {loading ? 'Running…' : 'Run Ensemble'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !error && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            选择 preset 后点击 Run，查看 sleeve 权重、相关性矩阵与回撤贡献。
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border py-3 px-4">
              <CardTitle className="text-sm font-semibold">组合指标</CardTitle>
              <CardDescription className="text-xs">
                method={result.method} · max_weight={pct(result.maxWeight)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricTile label="Full Sharpe" value={result.fullMetrics.sharpe.toFixed(2)} />
                <MetricTile label="Full CAGR" value={pct(result.fullMetrics.cagr)} tone="pos" />
                <MetricTile label="Full Max DD" value={pct(result.fullMetrics.maxDrawdown)} tone="neg" />
                <MetricTile label="Full Calmar" value={result.fullMetrics.calmar.toFixed(2)} />
              </div>
              {result.holdoutMetrics && (
                <>
                  <div className="my-3 h-px bg-border" />
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <MetricTile label="Holdout Sharpe" value={result.holdoutMetrics.sharpe.toFixed(2)} />
                    <MetricTile label="Holdout CAGR" value={pct(result.holdoutMetrics.cagr)} tone="pos" />
                    <MetricTile label="Holdout Max DD" value={pct(result.holdoutMetrics.maxDrawdown)} tone="neg" />
                    <MetricTile label="Avg Invested" value={pct(result.holdoutMetrics.avgInvested)} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border py-3 px-4">
              <CardTitle className="text-sm font-semibold">Sleeve 权重与贡献</CardTitle>
              <CardDescription className="text-xs">
                平均资金分配、收益贡献与回撤贡献
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Sleeve</th>
                    <th className="px-4 py-2 text-right font-medium">Avg Weight</th>
                    <th className="px-4 py-2 text-right font-medium">Sharpe</th>
                    <th className="px-4 py-2 text-right font-medium">Return Contrib</th>
                    <th className="px-4 py-2 text-right font-medium">DD Contrib</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sleeves.map((sleeve) => (
                    <tr key={sleeve.strategy} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{sleeve.strategy}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">
                        {pct(sleeve.avgWeight)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">
                        {sleeve.sharpe.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2 text-right font-mono tabular-nums',
                          sleeve.returnContribution >= 0 ? 'text-emerald-500' : 'text-destructive',
                        )}
                      >
                        {signed(sleeve.returnContribution)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-destructive">
                        {pct(sleeve.drawdownContribution)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border py-3 px-4">
              <CardTitle className="text-sm font-semibold">相关性矩阵</CardTitle>
              <CardDescription className="text-xs">Sleeve 两两日收益相关性</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium" />
                    {result.sleeves.map((sleeve) => (
                      <th key={sleeve.strategy} className="px-4 py-2 text-right font-medium">
                        {sleeve.strategy}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sleeves.map((row) => (
                    <tr key={row.strategy} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{row.strategy}</td>
                      {result.sleeves.map((col) => {
                        const isDiagonal = col.strategy === row.strategy
                        const value = isDiagonal ? 1 : row.correlations[col.strategy] ?? 0
                        return (
                          <td
                            key={col.strategy}
                            className={cn(
                              'px-4 py-2 text-right font-mono tabular-nums',
                              isDiagonal && 'text-muted-foreground/50',
                              !isDiagonal && value > result.constraints.maxPairCorrelation && 'text-amber-500',
                            )}
                          >
                            {isDiagonal ? '—' : value.toFixed(3)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border py-3 px-4">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                组合约束
              </CardTitle>
              <CardDescription className="text-xs">
                约束只有在真正生效时才是安全网，未生效会显式标注
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricTile label="Min Weight" value={pct(result.constraints.minWeight)} />
                <MetricTile
                  label="Min Weight Binding"
                  value={result.constraints.minWeightBinding ? 'binding' : 'inactive'}
                  tone={result.constraints.minWeightBinding ? 'neg' : undefined}
                />
                <MetricTile
                  label="Corr Soft Target"
                  value={result.constraints.maxPairCorrelation.toFixed(2)}
                />
                <MetricTile
                  label="Observed Max Corr"
                  value={result.constraints.maxObservedPairCorrelation.toFixed(3)}
                  tone={
                    result.constraints.maxObservedPairCorrelation >
                    result.constraints.maxPairCorrelation
                      ? 'neg'
                      : undefined
                  }
                />
                <MetricTile
                  label="DD Contrib Target"
                  value={pct(result.constraints.maxDdContribution)}
                />
                <MetricTile
                  label="Observed DD Contrib"
                  value={pct(result.constraints.maxObservedDdContribution)}
                  tone={
                    result.constraints.maxObservedDdContribution >
                    result.constraints.maxDdContribution
                      ? 'neg'
                      : undefined
                  }
                />
                <MetricTile
                  label="Min Weight Violations"
                  value={String(result.constraints.minWeightViolations)}
                  tone={result.constraints.minWeightViolations > 0 ? 'neg' : undefined}
                />
                <MetricTile
                  label="DD Target Binding"
                  value={result.constraints.ddContributionBinding ? 'binding' : 'inactive'}
                />
                <MetricTile
                  label="DD Target Breached"
                  value={result.constraints.ddContributionBreached ? 'breached' : 'within'}
                  tone={result.constraints.ddContributionBreached ? 'neg' : undefined}
                />
              </div>
              <p className="mt-3 text-2xs text-muted-foreground">
                相关性是软惩罚目标，观测值可能高于目标；回撤贡献在调仓日执行上限，两次调仓之间回撤加深时实际路径仍可能超过目标。
              </p>
              {result.constraints.minWeightViolations > 0 && (
                <Badge variant="destructive" className="mt-3">
                  min_weight 出现违反
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
