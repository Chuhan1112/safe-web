import { memo, useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TickerLink } from '@/components/TickerLink'
import { ActionFilter } from '@/components/ActionFilter'
import { cn, formatPrice } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface TradeSnapshot {
  total_equity?: number
  holdings?: string[]
  names?: Record<string, string>
  cash_weight?: string
  holdings_detail?: Record<string, { price?: number }>
}

interface TradeLogRow {
  Date?: string
  Ticker?: string
  TickerName?: string
  Action?: string
  Price?: number
  Shares?: number
  Reason?: string
  Snapshot?: TradeSnapshot
  [key: string]: unknown
}

interface RebalanceLogFallback {
  PortfolioValue?: number
  CashWeight?: string
  Selected?: string[]
  Weights?: Record<string, string>
  Names?: Record<string, string>
  Prices?: Record<string, number>
}

const CHIP_LIMIT = 8

function weightOfHolding(entry: string): number {
  const m = entry.match(/\(([\d.]+)%\)/)
  return m ? parseFloat(m[1]) : 0
}

interface TradeLogsTableProps {
  logs: TradeLogRow[]
  /** 调仓日志（按日期索引）。Rust/月度路径的逐笔成交没有股数快照，用它回填市值/权重 */
  rebalanceByDate?: Record<string, RebalanceLogFallback>
  logFilter: string
  t: { action?: string; symbol?: string; price?: string; reason?: string; date?: string; portfolio_value?: string; buy?: string; sold?: string; holds?: string; empty?: string; cash_weight?: string }
  handleTickerClick: (ticker: string) => void
  highlightDate?: string | null
  market?: string
  comparePalette?: string[]
}

export const TradeLogsTable = memo(({ logs, logFilter, t, handleTickerClick, highlightDate, market, rebalanceByDate }: TradeLogsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [actionFilter, setActionFilter] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLDivElement>(null)

  const currencySymbol = market === 'CN' ? '¥' : '$'

  const toggleExpand = useCallback((date: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const handleActionToggle = useCallback((action: string) => {
    setActionFilter((prev) => {
      const next = new Set(prev)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return next
    })
  }, [])

  // 按日期分组，使用最后一条 trade 的 Snapshot（最完整的持仓快照）
  const dateGroups = useMemo(() => {
    let filtered = logs
    if (logFilter) {
      const needle = logFilter.toLowerCase()
      filtered = logs.filter((log) =>
        String(log.Date || '').toLowerCase().includes(needle) ||
        String(log.Ticker || '').toLowerCase().includes(needle) ||
        String(log.Action || '').toLowerCase().includes(needle) ||
        String(log.Reason || '').toLowerCase().includes(needle)
      )
    }
    if (actionFilter.size > 0) {
      filtered = filtered.filter((log) => actionFilter.has(log.Action ?? ''))
    }

    const groups = new Map<string, TradeLogRow[]>()
    for (const log of filtered) {
      const date = String(log.Date || '')
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date)!.push(log)
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, trades]) => {
        const buys = trades.filter((t) => t.Action === 'BUY')
        const sells = trades.filter((t) => t.Action === 'SELL')
        // 同日所有 trade 共享同一个 EOD Snapshot（后端 rebuild_daily_snapshots 保证）
        const snap = trades[0]?.Snapshot
        // 调仓型策略（月度/自适应）的逐笔成交由调仓日志合成，后端再按股数重建的 EOD Snapshot
        // 会漂移成离谱组合（例：39 只持仓 / 现金 -36%）。这里以同日调仓日志为准，
        // 逐笔成交只负责“操作明细”，市值/持仓/权重一律取调仓日志。
        const fallback = rebalanceByDate?.[date]
        const useFallback = Boolean(fallback && (fallback.PortfolioValue != null || fallback.Weights))
        const fallbackWeights = fallback?.Weights || {}
        const eq = useFallback ? fallback?.PortfolioValue : snap?.total_equity
        // 大仓位策略可能同时持有几十只，摘要行按权重倒序并折叠，展开后才看全量
        const holdList = (useFallback
          ? Object.keys(fallbackWeights).map((ticker) => `${ticker} (${fallbackWeights[ticker]})`)
          : (snap?.holdings || [])).slice().sort((a, b) => weightOfHolding(b) - weightOfHolding(a))
        const names = (useFallback ? fallback?.Names : snap?.names) || {}
        const cashWeight = (useFallback ? fallback?.CashWeight : snap?.cash_weight) || '0%'
        // 继续持有 = EOD 持仓中剔除当天买入的
        const todayBuyTickers = new Set(buys.map(t => String(t.Ticker || '')))
        const continuingHoldings = holdList.filter((h: string) => {
          const ticker = h.split('(')[0].trim()
          return !todayBuyTickers.has(ticker)
        })
        const holdingsDetail = useFallback
          ? Object.fromEntries(
              Object.keys(fallbackWeights).map((ticker) => [ticker, { price: fallback?.Prices?.[ticker] }]),
            )
          : (snap?.holdings_detail || {})
        return { date, trades, buys, sells, count: trades.length, equity: eq, holdings: holdList, names, cashWeight, continuingHoldings, holdingsDetail }
      })
  }, [logs, logFilter, actionFilter, rebalanceByDate])

  useEffect(() => {
    if (!highlightDate || !tableRef.current) return
    const el = tableRef.current.querySelector(`[data-date="${highlightDate}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightDate])

  const badgeLabel = (reason: string) => {
    if (!reason) return '--'
    if (reason.includes('Entry')) return '建仓'
    if (reason.includes('Exit')) return '离场'
    if (reason.includes('End of Period')) return '平仓'
    if (reason.includes('Rebalance')) return '调仓'
    return reason.length > 12 ? reason.slice(0, 12) + '…' : reason
  }

  const badgeStyle = (reason: string, action: string) => {
    if (reason.includes('Entry') || action === 'BUY') return 'text-emerald-500/70 border-emerald-500/20 bg-emerald-500/[0.04]'
    if (reason.includes('Exit') || reason.includes('Stop') || reason.includes('End of Period') || action === 'SELL') return 'text-rose-500/70 border-rose-500/20 bg-rose-500/[0.04]'
    return 'text-muted-foreground/50 border-border/50'
  }

  return (
    <div ref={tableRef} className="overflow-x-auto">
      <div className="min-w-[640px]">
      <div className="mb-2 flex items-center gap-2">
        <ActionFilter selected={actionFilter} onToggle={handleActionToggle} />
      </div>
      <Table>
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xl z-30 transition-all border-b border-border/40">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="w-[120px] h-8 ">{t.date || '日期'}</TableHead>
            <TableHead className="w-[140px] h-8 text-right">{t.portfolio_value || '市值'}</TableHead>
            <TableHead className="h-8 ">{t.action || '操作'}</TableHead>
            <TableHead className="w-[240px] h-8 text-right">持仓权重</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dateGroups.map(({ date, trades, buys, sells, equity, holdings, names, cashWeight, continuingHoldings, holdingsDetail }) => {
            const isExpanded = expandedRows.has(date)
            const isHighlighted = highlightDate === date
            const totalPnL = trades.reduce((sum, t) => sum + (Number(t.PnL) || 0), 0)

            return (
              <Fragment key={date}>
                <TableRow
                  data-date={date}
                  className={cn(
                    "border-b border-border/80 hover:bg-accent/5 transition-colors align-top cursor-pointer",
                    isHighlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  )}
                  onClick={() => toggleExpand(date)}
                >
                  {/* 日期 — 对齐月度 */}
                  <TableCell className="font-mono text-xs text-muted-foreground py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {date}
                    </span>
                  </TableCell>

                  {/* 组合市值 — 对齐月度 Portfolio Value */}
                  <TableCell className="font-mono text-xs font-medium tabular-nums py-3 text-right">
                    {equity != null ? `${currencySymbol}${Number(equity).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
                  </TableCell>

                  {/* 操作分组 — 对齐月度 Selected Assets */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-3">
                      {buys.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground/60 font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500/80" />
                              {t.buy || '买入'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {buys.slice(0, CHIP_LIMIT).map((log) => {
                              const ticker = String(log.Ticker || '')
                              const name = log.TickerName || ticker
                              const key = `buy|${String(log.Date ?? '')}|${ticker}|${log.Action ?? ''}|${log.Price ?? ''}`
                              return (
                                <span key={key} className="inline-flex items-center gap-1.5 rounded-md border border-green-200/30 bg-green-500/5 px-2 py-0.5">
                                  <span className="text-xs font-bold tracking-tight uppercase">
                                    <TickerLink ticker={ticker} displayName={name} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-2xs font-mono text-muted-foreground/70 tabular-nums font-medium">
                                    {formatPrice(log.Price, currencySymbol)}
                                  </span>
                                </span>
                              )
                            })}
                            {buys.length > CHIP_LIMIT && (
                              <span className="inline-flex items-center rounded-md border border-dashed border-green-500/30 px-2 py-0.5 text-2xs font-mono text-muted-foreground/60">
                                +{buys.length - CHIP_LIMIT}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* 继续持有 — Snapshot 中剔除当天交易（前几天买入今天继续拿着） */}
                      {continuingHoldings && continuingHoldings.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground/60 font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                              {t.holds || '持有'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {continuingHoldings.slice(0, CHIP_LIMIT).map((h: string) => {
                              const ticker = h.split('(')[0].trim()
                              const display = names[ticker] || ticker
                              const pct = h.match(/\((.*)\)/)?.[1] || '--'
                              const px = holdingsDetail?.[ticker]?.price
                              return (
                                <span key={h} className="relative inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-0.5">
                                  <span className="text-xs font-bold tracking-tight uppercase">
                                    <TickerLink ticker={ticker} displayName={display} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-2xs font-mono text-muted-foreground/50 tabular-nums font-medium">{pct}</span>
                                  <span className="text-2xs font-mono text-muted-foreground/70 tabular-nums font-medium">
                                    {formatPrice(px, currencySymbol)}
                                  </span>
                                </span>
                              )
                            })}
                            {continuingHoldings.length > CHIP_LIMIT && (
                              <span className="inline-flex items-center rounded-md border border-dashed border-border/60 px-2 py-0.5 text-2xs font-mono text-muted-foreground/60">
                                +{continuingHoldings.length - CHIP_LIMIT} 只
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {sells.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground/60 font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
                              {t.sold || '卖出'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sells.slice(0, CHIP_LIMIT).map((log) => {
                              const ticker = String(log.Ticker || '')
                              const name = log.TickerName || ticker
                              const pnl = Number(log.PnL) || 0
                              const key = `sell|${String(log.Date ?? '')}|${ticker}|${log.Action ?? ''}|${log.Price ?? ''}`
                              return (
                                <span key={key} className="inline-flex items-center gap-1.5 rounded-md border border-red-200/30 bg-red-500/5 px-2 py-0.5">
                                  <span className="text-xs font-bold tracking-tight uppercase text-red-600/80">
                                    <TickerLink ticker={ticker} displayName={name} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-2xs font-mono text-red-500/60 tabular-nums font-medium">
                                    {formatPrice(log.Price, currencySymbol)}
                                  </span>
                                  {pnl !== 0 && (
                                    <span className={cn("text-2xs font-mono font-medium tabular-nums ml-0.5", pnl > 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                      {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
                                    </span>
                                  )}
                                </span>
                              )
                            })}
                            {sells.length > CHIP_LIMIT && (
                              <span className="inline-flex items-center rounded-md border border-dashed border-red-500/30 px-2 py-0.5 text-2xs font-mono text-muted-foreground/60">
                                +{sells.length - CHIP_LIMIT}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {trades.length === 0 && (
                        <span className="text-2xs text-muted-foreground/30 uppercase tracking-wider">{t.empty || '无交易'}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* 持仓权重 — 对齐月度 Weights 列（权重条） */}
                  <TableCell className="text-right py-2 align-top">
                    <div className="flex flex-wrap justify-end gap-1.5 ml-auto max-w-[280px]">
                      {holdings.length > 0 ? holdings.slice(0, CHIP_LIMIT).map((h: string) => {
                        const ticker = h.split('(')[0].trim()
                        const display = names[ticker] || ticker
                        const pctStr = h.match(/\((.*)\)/)?.[1] || '0%'
                        const parsedWeight = parseFloat(pctStr) || 0
                        return (
                          <div key={ticker} className="relative group border border-border/40 bg-secondary/10 rounded-sm overflow-hidden px-1.5 py-0.5 min-w-[72px] flex justify-between items-center z-0 shadow-sm transition-colors hover:border-primary/30">
                            <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all -z-10 group-hover:bg-primary/20" style={{ width: `${parsedWeight}%` }} />
                            <span className="text-2xs font-bold text-muted-foreground/70 tracking-tight mr-2 truncate max-w-[60px]" title={ticker}>{display}</span>
                            <span className="text-2xs font-mono font-black tabular-nums text-foreground/80">{pctStr}</span>
                          </div>
                        )
                      }) : (
                        <span className="text-2xs text-muted-foreground/20">--</span>
                      )}
                      {holdings.length > CHIP_LIMIT && (
                        <div className="relative border border-dashed border-border/50 bg-secondary/5 rounded-sm px-1.5 py-0.5 min-w-[72px] flex justify-between items-center text-2xs font-mono text-muted-foreground/60">
                          <span>+{holdings.length - CHIP_LIMIT}</span>
                          <span>共{holdings.length}</span>
                        </div>
                      )}
                      {holdings.length > 0 && cashWeight && parseFloat(cashWeight) > 0 && (
                        <div className="relative group border border-yellow-500/20 bg-yellow-500/5 rounded-sm overflow-hidden px-1.5 py-0.5 min-w-[72px] flex justify-between items-center z-0 shadow-sm">
                          <div className="absolute left-0 top-0 bottom-0 bg-yellow-500/10 transition-all -z-10" style={{ width: `${parseFloat(cashWeight) || 0}%` }} />
                          <span className="text-2xs font-bold text-yellow-600/70 dark:text-yellow-500/60 tracking-tight mr-2">{t.cash_weight || '现金'}</span>
                          <span className="text-2xs font-mono font-black tabular-nums text-yellow-700 dark:text-yellow-400">{cashWeight}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* 展开详情 — 完全复用月度布局 */}
                {isExpanded && (
                  <TableRow className="bg-muted/5">
                    <TableCell colSpan={4} className="py-4 px-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-2xs uppercase tracking-wider text-muted-foreground/60 font-semibold">持仓快照</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {holdings.length > 0 ? holdings.map((h: string) => {
                              const ticker = h.split('(')[0].trim()
                              const display = names[ticker] || ticker
                              const pct = h.match(/\((.*)\)/)?.[1] || '--'
                              return (
                                <span key={h} className="rounded-md border border-border/50 bg-background/50 px-2 py-1 text-xs font-mono">
                                  {display} — {pct}
                                </span>
                              )
                            }) : (
                              <span className="text-2xs text-muted-foreground/30 uppercase tracking-wider">空仓</span>
                            )}
                          </div>
                          {equity != null && (
                            <div className="mt-2 text-2xs font-mono font-medium text-muted-foreground/40 tabular-nums">
                              市值: {currencySymbol}{Number(equity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              {totalPnL !== 0 && (
                                <span className={cn("ml-3 font-mono font-medium", totalPnL > 0 ? "text-emerald-500" : "text-rose-500")}>
                                  当日 PnL: {totalPnL > 0 ? '+' : ''}{currencySymbol}{Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-2xs uppercase tracking-wider text-muted-foreground/60 font-semibold">操作明细</span>
                          <div className="mt-2 flex flex-col gap-1.5">
                            {trades.map((log) => {
                              const ticker = String(log.Ticker || '')
                              const name = log.TickerName || ticker
                              const action = log.Action ?? ''
                              const reason = badgeLabel(log.Reason || '')
                              const bs = badgeStyle(log.Reason || '', action)
                              const isBuy = action === 'BUY'
                              const pnl = Number(log.PnL) || 0
                              const key = `trade|${String(log.Date ?? '')}|${ticker}|${action}|${log.Price ?? ''}|${log.Shares ?? ''}`
                              return (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                  <span className={cn(
                                    "inline-flex items-center px-1.5 py-0 rounded-[3px] text-2xs font-bold tracking-[0.04em] w-8 justify-center border uppercase",
                                    isBuy ? "text-emerald-500/70 border-emerald-500/20 bg-emerald-500/[0.04]"
                                          : "text-rose-500/70 border-rose-500/20 bg-rose-500/[0.04]"
                                  )}>
                                    {action}
                                  </span>
                                  <span className="text-xs font-bold tracking-tight">
                                    <TickerLink ticker={ticker} displayName={name} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-2xs font-mono text-muted-foreground/60 tabular-nums font-medium">
                                    {formatPrice(log.Price, currencySymbol)}
                                  </span>
                                  {Number(log.Shares) > 0 && (
                                    <span className="text-2xs font-mono text-muted-foreground/40 tabular-nums font-medium">×{log.Shares}</span>
                                  )}
                                  <span className={cn("inline-flex px-1.5 py-0 rounded-[3px] text-[8px] font-bold border uppercase tracking-[0.04em]", bs)}>{reason}</span>
                                  {pnl !== 0 && (
                                    <span className={cn("text-2xs font-mono tabular-nums ml-auto", pnl > 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold")}>
                                      {pnl > 0 ? '+' : ''}{currencySymbol}{Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  )
})
