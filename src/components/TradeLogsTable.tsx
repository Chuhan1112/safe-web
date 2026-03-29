import { memo, Fragment } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TickerLink } from "@/components/TickerLink"
import { cn } from "@/private/lib/utils"
import { translations } from '@/private/lib/translations'

interface TradeLogsTableProps {
  logs: Record<string, unknown>[];
  logFilter: string;
  t: typeof translations['en'];
  handleTickerClick: (ticker: string) => void;
}

export const TradeLogsTable = memo(({ logs, logFilter, t, handleTickerClick }: TradeLogsTableProps) => {
  const filteredLogs = logs.filter((log) => {
    if (!logFilter) return true
    const needle = logFilter.toLowerCase()
    return (
      String(log.Date || '').toLowerCase().includes(needle) ||
      String(log.Ticker || '').toLowerCase().includes(needle) ||
      String(log.Action || '').toLowerCase().includes(needle) ||
      String(log.Reason || '').toLowerCase().includes(needle)
    )
  }).reverse()

  return (
    <div className="max-w-[1100px] mx-auto w-full px-4">
      <Table className="relative border-separate border-spacing-0">
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xl z-30 transition-all border-b border-border/40">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="w-[100px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{t.action}</TableHead>
            <TableHead className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{t.symbol || '代码'}</TableHead>
            <TableHead className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right">{t.price || '价格'}</TableHead>
            <TableHead className="h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-10 text-center">{t.reason}</TableHead>
            <TableHead className="w-[120px] h-11 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right">PnL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map((log, i, arr) => {
            const isNewDate = i === 0 || log.Date !== arr[i - 1].Date

            // Ghost Tag logic: Border and text only
            let badgeText = log.Reason || '';
            let badgeStyle = "text-muted-foreground/50 border-border/50";

            if (badgeText.includes("唐奇安突破") || badgeText.includes("Breakout") || badgeText.includes("Entry")) {
              badgeText = "突破建仓";
              badgeStyle = "text-emerald-500/80 border-emerald-500/30";
            } else if (badgeText.includes("唐奇安离场") || badgeText.includes("Exit") || badgeText.includes("Stop")) {
              badgeText = "离场止盈/损";
              badgeStyle = "text-rose-500/80 border-rose-500/30";
            } else if (badgeText.includes("End of Period")) {
              badgeText = "周期平仓";
              badgeStyle = "text-blue-500/80 border-blue-500/30";
            }

            return (
              <Fragment key={`${i}-group`}>
                {isNewDate && (
                  <TableRow key={`${i}-header`} className="bg-muted/5 hover:bg-muted/10 transition-colors border-none group/header overflow-visible">
                    <TableCell colSpan={5} className="py-3 px-4 border-y border-border/30">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-black tracking-tighter text-foreground/70">
                            {log.Date}
                          </span>
                          <div className="h-4 w-[1px] bg-border/40 mx-1" />
                        </div>
                        
                        <div className="flex items-center gap-2 overflow-visible">
                          {log.Snapshot?.holdings?.map((h: string, idx: number) => (
                            <div
                              key={idx}
                              className="group/pill flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-background/40 border border-border/30 shadow-sm transition-all hover:border-primary/30"
                            >
                              <span className="text-[10px] font-black text-foreground/50 font-mono tracking-tighter group-hover/pill:text-primary/70 transition-colors">
                                {h.split('(')[0]}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground/30 tabular-nums">
                                {h.match(/\((.*)\)/)?.[1]}
                              </span>
                            </div>
                          ))}
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
                <TableRow key={`${i}-row`} className="border-b-[0.5px] border-border/30 hover:bg-white/[0.02] transition-colors group/row">
                  <TableCell className="py-2.5 align-middle">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black tracking-[0.1em] w-12 justify-center border",
                      log.Action === 'BUY'
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/70"
                        : log.Action === 'SELL'
                          ? "bg-rose-500/5 border-rose-500/10 text-rose-500/70"
                          : "bg-slate-500/5 border-slate-500/10 text-slate-500/50"
                    )}>
                      {log.Action}
                    </span>
                  </TableCell>

                  <TableCell className="py-2.5 align-middle">
                    <TickerLink 
                      ticker={log.Ticker} 
                      onClick={handleTickerClick} 
                      className="font-bold tracking-tight text-foreground/80 group-hover/row:text-primary transition-colors text-[13px] border-none bg-transparent hover:bg-transparent px-0"
                    />
                  </TableCell>

                  <TableCell className="text-right font-mono text-[12px] font-bold py-2.5 tracking-tighter tabular-nums">
                    <span className="text-muted-foreground/20 mr-1.5 font-normal">$</span>
                    {log.Price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  <TableCell className="py-2.5 px-10 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-[4px] text-[9px] font-black border uppercase tracking-[0.05em]", badgeStyle)}>
                      {badgeText}
                    </span>
                  </TableCell>
                  
                  <TableCell className={cn(
                    "text-right font-mono text-[12px] py-2.5 tabular-nums transition-all tracking-tighter",
                    (log.PnL || 0) > 0 
                      ? "text-emerald-500 font-bold" 
                      : (log.PnL || 0) < 0 
                        ? "text-rose-500 font-bold" 
                        : "text-muted-foreground/30"
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
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
