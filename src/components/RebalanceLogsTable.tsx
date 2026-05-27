import { memo, useState, useCallback, Fragment } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TickerLink } from '@/components/TickerLink'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface RebalanceLogsTableProps {
  logs: Record<string, any>[]
  logFilter: string
  t: { date: string; portfolio_value: string; selected_assets: string; weights: string; buy?: string; holds?: string; sold?: string; empty_position: string; cash_weight: string }
  handleTickerClick: (ticker: string) => void
  comparePalette: string[]
  highlightDate?: string | null
}

function displayName(ticker: string, names: Record<string, string>): string {
  return names[ticker] || ticker
}

export const RebalanceLogsTable = memo(({ logs, logFilter, t, handleTickerClick, comparePalette, highlightDate }: RebalanceLogsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((date: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (!logFilter) return true
    const needle = logFilter.toLowerCase()
    return (
      String(log.Date || '').toLowerCase().includes(needle) ||
      String(log.PortfolioValue || '').toLowerCase().includes(needle) ||
      (log.Selected || []).join(',').toLowerCase().includes(needle) ||
      Object.values(log.Names || {}).join(',').toLowerCase().includes(needle)
    )
  }).reverse()

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="w-[120px] h-8 text-xs font-semibold">{t.date}</TableHead>
          <TableHead className="w-[140px] h-8 text-xs font-semibold text-right">{t.portfolio_value}</TableHead>
          <TableHead className="h-8 text-xs font-semibold">{t.selected_assets}</TableHead>
          <TableHead className="w-[240px] h-8 text-xs font-semibold text-right">{t.weights}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredLogs.map((log) => {
          const dateStr = log.Date as string
          const isExpanded = expandedRows.has(dateStr)
          const isHighlighted = highlightDate === dateStr

          return (
            <Fragment key={dateStr}>
              <TableRow
                className={cn(
                  "border-b border-border/80 hover:bg-accent/5 transition-colors align-top cursor-pointer",
                  isHighlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                )}
                onClick={() => toggleExpand(dateStr)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground py-3">
                  <span className="inline-flex items-center gap-1.5">
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {dateStr}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm font-semibold py-3 text-right">
                  ${log.PortfolioValue?.toLocaleString?.(undefined, { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="py-3">
                  {(() => {
                    const selected = (log.Selected || []).filter(Boolean)
                    const prevHoldings = (log.PrevHoldings || []).filter(Boolean)
                    const buys = selected.filter((t: string) => !prevHoldings.includes(t)).sort()
                    const holds = selected.filter((t: string) => prevHoldings.includes(t)).sort()
                    const exitedTickers = (log.Exited || []).filter(Boolean).sort()
                    const names = log.Names || {}
                    return (
                      <div className="flex flex-col gap-3">
                        {buys.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500/80" />
                                {t.buy || '买入'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {buys.map((ticker: string) => (
                                <span key={ticker} className="inline-flex items-center gap-1.5 rounded-md border border-green-200/30 bg-green-500/5 px-2 py-0.5">
                                  <span className="text-[11px] font-bold tracking-tight uppercase">
                                    <TickerLink ticker={displayName(ticker, names)} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                                    {log.Prices?.[ticker] != null ? `$${Number(log.Prices[ticker]).toFixed(2)}` : '--'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {holds.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                                {t.holds || '持有'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {holds.map((ticker: string, idx: number) => (
                                <span key={ticker} className="relative inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-0.5">
                                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full" style={{ backgroundColor: comparePalette[idx % comparePalette.length] }} />
                                  <span className="text-[11px] font-bold tracking-tight uppercase pl-2">
                                    <TickerLink ticker={displayName(ticker, names)} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                                    {log.Prices?.[ticker] != null ? `$${Number(log.Prices[ticker]).toFixed(2)}` : '--'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.IsEmpty && (
                          <span className="inline-flex items-center rounded-lg border border-border/50 bg-secondary/40 px-2 py-1 text-[11px] font-medium text-secondary-foreground">{t.empty_position}</span>
                        )}
                        {exitedTickers.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
                                {t.sold || '卖出'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {exitedTickers.map((ticker: string) => (
                                <span key={`exit-${ticker}`} className="inline-flex items-center gap-1.5 rounded-md border border-red-200/30 bg-red-500/5 px-2 py-0.5 text-red-600/80">
                                  <span className="text-[11px] font-bold tracking-tight uppercase">
                                    <TickerLink ticker={displayName(ticker, names)} onClick={() => handleTickerClick(ticker)} />
                                  </span>
                                  <span className="text-[10px] text-red-500/60 tabular-nums">
                                    {log.ExitPrices?.[ticker] != null ? `$${Number(log.ExitPrices[ticker]).toFixed(2)}` : '--'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-right py-2 align-top">
                  <div className="flex flex-wrap justify-end gap-1.5 ml-auto max-w-[280px]">
                    {Object.entries((log.Weights as Record<string, string>) || {})
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                      .map(([k, v]) => {
                        const parsedWeight = parseFloat(v) || 0
                        const label = (log.WeightNames || {})[k] || k
                        return (
                          <div key={k} className="relative group border border-border/40 bg-secondary/10 rounded-sm overflow-hidden px-1.5 py-0.5 min-w-[72px] flex justify-between items-center z-0 shadow-sm transition-colors hover:border-primary/30">
                            <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all -z-10 group-hover:bg-primary/20" style={{ width: `${parsedWeight}%` }} />
                            <span className="text-[9px] font-bold text-muted-foreground/70 tracking-tight mr-2 truncate max-w-[60px]" title={k}>{label}</span>
                            <span className="text-[10px] font-mono font-black text-foreground/80">{v}</span>
                          </div>
                        )
                      })}
                    {log.CashWeight && (
                      <div className="relative group border border-yellow-500/20 bg-yellow-500/5 rounded-sm overflow-hidden px-1.5 py-0.5 min-w-[72px] flex justify-between items-center z-0 shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 bg-yellow-500/10 transition-all -z-10" style={{ width: `${parseFloat(log.CashWeight) || 0}%` }} />
                        <span className="text-[9px] font-bold text-yellow-600/70 dark:text-yellow-500/60 tracking-tight mr-2">{t.cash_weight}</span>
                        <span className="text-[10px] font-mono font-black text-yellow-700 dark:text-yellow-400">{log.CashWeight}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow className="bg-muted/5">
                  <TableCell colSpan={4} className="py-4 px-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">持仓快照</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(log.Selected || []).filter(Boolean).map((ticker: string) => (
                            <span key={ticker} className="rounded-md border border-border/50 bg-background/50 px-2 py-1 text-xs font-mono">
                              {displayName(ticker, log.Names || {})} — {log.Weights?.[ticker] ?? '--'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">操作明细</span>
                        <div className="mt-2 flex flex-col gap-1">
                          {(log.Exited || []).filter(Boolean).map((t: string) => (
                            <span key={t} className="text-xs text-red-500/80">- SELL {displayName(t, log.Names || {})} @ ${log.ExitPrices?.[t]?.toFixed(2) ?? '--'}</span>
                          ))}
                          {(log.Selected || []).filter((t: string) => !(log.PrevHoldings || []).includes(t)).map((t: string) => (
                            <span key={t} className="text-xs text-emerald-500/80">+ BUY {displayName(t, log.Names || {})} @ ${log.Prices?.[t]?.toFixed(2) ?? '--'}</span>
                          ))}
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
  )
})
