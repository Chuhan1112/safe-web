import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { useMarket } from '@/contexts/MarketContext'
import { api, type AnalysisResult } from '@/lib/api/client'
import { AssetChart } from '@/components/AssetChart'
import { ChartSkeleton } from '@/components/skeletons/ChartSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { Activity, TrendingUp, Target, BarChart3, Zap } from 'lucide-react'

const QUICK_CHIPS = ['NVDA', 'AAPL', 'MSFT', '600519.SS'] as const

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatNum(value: number | null | undefined, decimals: number = 2): string {
  if (value == null) return '-'
  return Number(value).toFixed(decimals)
}

export function TechAnalysisPage() {
  const { market } = useMarket()
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [chart, setChart] = useState<any | null>(null)

  // 切市场清空结果（CLAUDE.md 陷阱 14）
  useEffect(() => {
    setAnalysis(null)
    setChart(null)
    setError('')
  }, [market])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value)
  }, [])

  const handleAnalyze = useCallback(async (overrideSymbol?: string) => {
    const trimmed = (overrideSymbol ?? symbol).trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setAnalysis(null)
    setChart(null)

    try {
      const [tickerData, analysisData] = await Promise.all([
        api.getTickerData(trimmed, 756, market),
        api.getAnalysis(trimmed, market),
      ])
      setChart(tickerData)
      setAnalysis(analysisData)
    } catch (err: any) {
      setError(err?.message || '分析失败')
    } finally {
      setLoading(false)
    }
  }, [symbol, market])

  const handleChipClick = useCallback((chip: string) => {
    setSymbol(chip)
    handleAnalyze(chip)
  }, [handleAnalyze])

  const macdStateColor = (state: string) => {
    switch (state) {
      case 'golden': return 'text-emerald-400'
      case 'dead': return 'text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const macdStateLabel = (state: string) => {
    switch (state) {
      case 'golden': return '金叉'
      case 'dead': return '死叉'
      default: return '平'
    }
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Input area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              技术分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="输入代码，如 AAPL / NVDA / 600519"
                value={symbol}
                onChange={handleChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze() }}
              />
              <Button onClick={() => handleAnalyze()} disabled={loading} className="gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                分析
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHIPS.map((chip) => (
                <Badge
                  key={chip}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleChipClick(chip)}
                >
                  {chip}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <ChartSkeleton />
            <TableSkeleton rows={5} cols={4} />
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-4">
            {/* K线卡 */}
            <Card>
              <CardHeader className="border-b border-border py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  {analysis.symbol} K线图
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AssetChart data={chart?.data ?? []} />
              </CardContent>
            </Card>

            {/* 技术指标卡 */}
            <Card>
              <CardHeader className="border-b border-border py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />
                  技术指标
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* MACD */}
                  <div className="space-y-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">MACD</span>
                    <div className="text-sm font-mono space-y-0.5">
                      <div>DIF: {formatNum(analysis.indicators.macd.dif)}</div>
                      <div>DEA: {formatNum(analysis.indicators.macd.dea)}</div>
                      <div>HIST: {formatNum(analysis.indicators.macd.hist)}</div>
                      <div className={macdStateColor(analysis.indicators.macd.state)}>
                        {macdStateLabel(analysis.indicators.macd.state)}
                      </div>
                    </div>
                  </div>
                  {/* KDJ */}
                  <div className="space-y-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">KDJ</span>
                    <div className="text-sm font-mono space-y-0.5">
                      <div>K: {formatNum(analysis.indicators.kdj.k)}</div>
                      <div>D: {formatNum(analysis.indicators.kdj.d)}</div>
                      <div>J: {formatNum(analysis.indicators.kdj.j)}</div>
                    </div>
                  </div>
                  {/* RSI */}
                  <div className="space-y-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">RSI (14)</span>
                    <div className="text-sm font-mono">{formatNum(analysis.indicators.rsi14)}</div>
                  </div>
                  {/* SMA */}
                  <div className="space-y-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">SMA</span>
                    <div className="text-sm font-mono space-y-0.5">
                      <div>20: {formatNum(analysis.indicators.sma20)}</div>
                      <div>50: {formatNum(analysis.indicators.sma50)}</div>
                      <div>200: {formatNum(analysis.indicators.sma200)}</div>
                    </div>
                  </div>
                  {/* Close */}
                  <div className="space-y-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">收盘价</span>
                    <div className="text-sm font-mono">{formatNum(analysis.indicators.close)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 买点信号 */}
            <Card>
              <CardHeader className="border-b border-border py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  买点信号
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analysis.buy_points.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">暂无买点信号</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-muted-foreground">规则</th>
                        <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-muted-foreground">状态</th>
                        <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-muted-foreground">触发日</th>
                        <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-muted-foreground">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.buy_points.map((bp) => (
                        <tr key={bp.rule_id} className="border-b border-border/50">
                          <td className="px-4 py-2 font-medium">{bp.name}</td>
                          <td className="px-4 py-2">
                            {bp.triggered ? (
                              <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 text-2xs">触发</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-2xs">未触发</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground font-mono">{bp.trigger_date || '-'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{bp.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* 回测统计 */}
            <Card>
              <CardHeader className="border-b border-border py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  回测统计
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {analysis.backtest.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">暂无回测数据</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-muted-foreground">规则</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">信号数</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">5日收益</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">10日收益</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">20日收益</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">5日胜率</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">10日胜率</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">20日胜率</th>
                          <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-muted-foreground">最近触发</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.backtest.map((bt) => (
                          <tr key={bt.rule_id} className="border-b border-border/50">
                            <td className="px-4 py-2 font-medium">{bt.name}</td>
                            <td className="px-4 py-2 text-right font-mono">{bt.signals}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.avg_ret_5d)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.avg_ret_10d)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.avg_ret_20d)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.win_rate_5d)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.win_rate_10d)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatPct(bt.win_rate_20d)}</td>
                            <td className="px-4 py-2 text-right text-muted-foreground font-mono">{bt.last_trigger || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 实时快照 */}
            <Card>
              <CardHeader className="border-b border-border py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  实时快照
                  <span className="text-2xs font-normal text-muted-foreground ml-1">实时·腾讯口径</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {analysis.live_snapshot ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">来源</span>
                      <div className="text-sm">{analysis.live_snapshot.source}</div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">日期</span>
                      <div className="text-sm font-mono">{analysis.live_snapshot.date}</div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">收盘价</span>
                      <div className="text-sm font-mono">{formatNum(analysis.live_snapshot.close)}</div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">MACD</span>
                      <div className="text-sm font-mono space-y-0.5">
                        <div>DIF: {formatNum(analysis.live_snapshot.dif)}</div>
                        <div>DEA: {formatNum(analysis.live_snapshot.dea)}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">RSI</span>
                      <div className="text-sm font-mono space-y-0.5">
                        <div>6: {formatNum(analysis.live_snapshot.rsi_6)}</div>
                        <div>12: {formatNum(analysis.live_snapshot.rsi_12)}</div>
                        <div>24: {formatNum(analysis.live_snapshot.rsi_24)}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground">KDJ</span>
                      <div className="text-sm font-mono space-y-0.5">
                        <div>K: {formatNum(analysis.live_snapshot.kdj_k)}</div>
                        <div>D: {formatNum(analysis.live_snapshot.kdj_d)}</div>
                        <div>J: {formatNum(analysis.live_snapshot.kdj_j)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">不可用</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
