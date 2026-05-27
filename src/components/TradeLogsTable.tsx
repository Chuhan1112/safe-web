import { memo, useMemo, useState, useCallback, useRef, useEffect, Fragment } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TickerLink } from '@/components/TickerLink'
import { ActionFilter } from '@/components/ActionFilter'
import { SortableTableHeader, type SortDirection } from '@/components/SortableTableHeader'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface TradeLogsTableProps {
  logs: Record<string, any>[]
  logFilter: string
  t: { action: string; symbol?: string; price?: string; reason: string }
  handleTickerClick: (ticker: string) => void
  highlightDate?: string | null
}

export const TradeLogsTable = memo(({ logs, logFilter, t, handleTickerClick, highlightDate }: TradeLogsTableProps) => {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null })
  const [actionFilter, setActionFilter] = useState<Set<string>>(new Set())
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLDivElement>(null)

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return { key: '', direction: null }
        return { key, direction: 'asc' }
      }
      return { key, direction: 'asc' }
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

  const toggleDateCollapse = useCallback((date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      if (logFilter) {
        const needle = logFilter.toLowerCase()
        const match = String(log.Date || '').toLowerCase().includes(needle) ||
          String(log.Ticker || '').toLowerCase().includes(needle) ||
          String(log.Action || '').toLowerCase().includes(needle) ||
          String(log.Reason || '').toLowerCase().includes(needle)
        if (!match) return false
      }
      if (actionFilter.size > 0 && !actionFilter.has(log.Action)) return false
      return true
    })

    if (sort.key && sort.direction) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any
        if (sort.key === 'price') { aVal = Number(a.Price) || 0; bVal = Number(b.Price) || 0 }
        else if (sort.key === 'pnl') { aVal = Number(a.PnL) || 0; bVal = Number(b.PnL) || 0 }
        else if (sort.key === 'action') { aVal = a.Action || ''; bVal = b.Action || '' }
        else if (sort.key === 'ticker') { aVal = a.Ticker || ''; bVal = b.Ticker || '' }
        else return 0
        if (typeof aVal === 'string') return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    return result.reverse()
  }, [logs, logFilter, actionFilter, sort])

  useEffect(() => {
    if (!highlightDate || !tableRef.current) return
    const el = tableRef.current.querySelector(`[data-date="${highlightDate}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightDate])

  return (
    <div ref={tableRef} className="max-w-[1100px] mx-auto w-full px-4">
      <div className="mb-3 flex items-center gap-3">
        <ActionFilter selected={actionFilter} onToggle={handleActionToggle} />
      </div>
      <Table className="relative border-separate border-spacing-0">
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xl z-30 transition-all border-b border-border/40">
          <TableRow className="border-none hover:bg-transparent">
            <SortableTableHeader label={t.action} sortKey="action" currentSort={sort} onSort={handleSort} className="w-[100px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40" />
            <SortableTableHeader label={t.symbol || '代码'} sortKey="ticker" currentSort={sort} onSort={handleSort} className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40" />
            <SortableTableHeader label={t.price || '价格'} sortKey="price" currentSort={sort} onSort={handleSort} className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40" align="right" />
            <TableHead className="h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-10 text-center">{t.reason}</TableHead>
            <SortableTableHeader label="PnL" sortKey="pnl" currentSort={sort} onSort={handleSort} className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40" align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map((log, i, arr) => {
            const isNewDate = i === 0 || log.Date !== arr[i - 1].Date
            const isCollapsed = collapsedDates.has(log.Date)
            const isHighlighted = highlightDate === log.Date

            let badgeText = log.Reason || ''
            let badgeStyle = 'text-muted-foreground/50 border-border/50'
            if (badgeText.includes('唐奇安突破') || badgeText.includes('Breakout') || badgeText.includes('Entry')) { badgeText = '突破建仓'; badgeStyle = 'text-emerald-500/80 border-emerald-500/30' }
            else if (badgeText.includes('唐奇安离场') || badgeText.includes('Exit') || badgeText.includes('Stop')) { badgeText = '离场止盈/损'; badgeStyle = 'text-rose-500/80 border-rose-500/30' }
            else if (badgeText.includes('End of Period')) { badgeText = '周期平仓'; badgeStyle = 'text-blue-500/80 border-blue-500/30' }

            return (
              <Fragment key={`${i}-group`}>
                {isNewDate && (
                  <TableRow
                    key={`${i}-header`}
                    data-date={log.Date}
                    className={cn(
                      "bg-muted/5 hover:bg-muted/10 transition-colors border-none group/header overflow-visible cursor-pointer",
                      isHighlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                    )}
                    onClick={() => toggleDateCollapse(log.Date)}
                  >
                    <TableCell colSpan={5} className="py-3 px-4 border-y border-border/30">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />}
                          <span className="text-[13px] font-black tracking-tighter text-foreground/70">{log.Date}</span>
                          <div className="h-4 w-[1px] bg-border/40 mx-1" />
                        </div>
                        <div className="flex items-center gap-2 overflow-visible">
                          {log.Snapshot?.holdings?.map((h: string, idx: number) => {
                            const ticker = h.split('(')[0].trim()
                            const name = log.Snapshot?.names?.[ticker] || ticker
                            return (
                              <div key={idx} className="group/pill flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-background/40 border border-border/30 shadow-sm transition-all hover:border-primary/30">
                                <span className="text-[10px] font-black text-foreground/50 font-mono tracking-tighter group-hover/pill:text-primary/70 transition-colors">{name}</span>
                                <span className="text-[9px] font-bold text-muted-foreground/30 tabular-nums">{h.match(/\((.*)\)/)?.[1]}</span>
                              </div>
                            )
                          })}
                          {log.Snapshot?.cash_weight && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-yellow-500/5 border border-yellow-500/20 text-yellow-600/60 shadow-[0_0_12px_rgba(234,179,8,0.05)] ring-1 ring-yellow-500/10">
                              <span className="text-[9px] font-black tracking-widest uppercase opacity-70">Cash</span>
                              <span className="text-[9px] font-bold tabular-nums">{log.Snapshot.cash_weight}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isCollapsed && (
                  <TableRow key={`${i}-row`} className="border-b-[0.5px] border-border/30 hover:bg-white/[0.02] transition-colors group/row">
                    <TableCell className="py-2.5 align-middle">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black tracking-[0.1em] w-12 justify-center border",
                        log.Action === 'BUY' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/70"
                          : log.Action === 'SELL' ? "bg-rose-500/5 border-rose-500/10 text-rose-500/70"
                            : "bg-slate-500/5 border-slate-500/10 text-slate-500/50"
                      )}>{log.Action}</span>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle">
                      <TickerLink ticker={log.TickerName || log.Ticker} onClick={handleTickerClick} className="font-bold tracking-tight text-foreground/80 group-hover/row:text-primary transition-colors text-[13px] border-none bg-transparent hover:bg-transparent px-0" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px] font-bold py-2.5 tracking-tighter tabular-nums">
                      <span className="text-muted-foreground/20 mr-1.5 font-normal">$</span>
                      {log.Price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-2.5 px-10 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-[4px] text-[9px] font-black border uppercase tracking-[0.05em]", badgeStyle)}>{badgeText}</span>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono text-[12px] py-2.5 tabular-nums transition-all tracking-tighter",
                      (log.PnL || 0) > 0 ? "text-emerald-500 font-bold" : (log.PnL || 0) < 0 ? "text-rose-500 font-bold" : "text-muted-foreground/30"
                    )}>
                      {log.PnL && log.PnL !== 0 ? (
                        <span className="flex items-center justify-end">
                          <span className="text-[10px] text-muted-foreground/20 mr-1.5 font-normal">$</span>
                          {Math.abs(log.PnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground/20 uppercase opacity-60">
                          {log.Action === 'SELL' ? 'REDUCE' : log.Type === 'LONG_ADD' ? 'ADD' : 'OPEN'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
