import React, { useState, useMemo, useEffect } from 'react';
import { buildTradeMap, buildRebalanceMap, parseDateToTs } from '@/utils/chartHoverLogic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BacktestChart } from '@/components/BacktestChart';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartSkeleton } from '@/components/skeletons/ChartSkeleton';
import { cn } from "@/private/lib/utils";
import { translations } from '@/private/lib/translations';
import type { BacktestResult } from '@/private/api/client';

interface ChartPanelProps {
  result: BacktestResult | null;
  compareMode: boolean;
  chartView: 'equity' | 'drawdown';
  setChartView: (v: 'equity' | 'drawdown') => void;
  chartKey: number;
  setChartKey: React.Dispatch<React.SetStateAction<number>>;
  compareResults: Record<string, BacktestResult>;
  highlightStrategy: string | null;
  setHighlightStrategy: (id: string | null) => void;
  getStrategyName: (id: string) => string;
  comparePalette: string[];
  t: typeof translations['en'];
  loading: boolean;
  error: string | null;
}




export const ChartPanel = React.memo(({
  result,
  compareMode,
  chartView,
  setChartView,
  chartKey,
  setChartKey,
  compareResults,
  highlightStrategy,
  setHighlightStrategy,
  getStrategyName,
  comparePalette,
  t,
  loading,
  error
}: ChartPanelProps) => {
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  const tradeMemo = useMemo(
    () => buildTradeMap(result?.trade_logs),
    [result?.trade_logs],
  )

  const rebalanceMemo = useMemo(
    () => buildRebalanceMap(result?.logs),
    [result?.logs],
  )

  const hoverLookup = useMemo(() => {
    if (compareMode || (!tradeMemo && !rebalanceMemo)) return null
    return {
      tradeByDate: tradeMemo?.tradeByDate ?? new Map(),
      tradeDates: tradeMemo?.tradeDates ?? [],
      rebalanceByDate: rebalanceMemo?.rebalanceByDate ?? new Map(),
      rebalanceDates: rebalanceMemo?.rebalanceDates ?? [],
    }
  }, [tradeMemo, rebalanceMemo, compareMode])

  const hoveredSnapshot = useMemo(() => {
    if (!hoverLookup || !hoveredTime) return null;
    const hoveredTs = parseDateToTs(hoveredTime);
    if (!Number.isFinite(hoveredTs)) return null;

    const latestOnOrBefore = (arr: { date: string; ts: number }[]) => {
      let idx = -1;
      for (let i = 0; i < arr.length; i += 1) {
        if (arr[i].ts <= hoveredTs) idx = i;
        else break;
      }
      return idx >= 0 ? arr[idx] : null;
    };

    const tradeRow = latestOnOrBefore(hoverLookup.tradeDates);
    const rebalanceRow = latestOnOrBefore(hoverLookup.rebalanceDates);
    const useTrade = tradeRow && (!rebalanceRow || tradeRow.ts >= rebalanceRow.ts);

    if (useTrade && tradeRow) {
      const rows = hoverLookup.tradeByDate.get(tradeRow.date) || [];
      const latest = rows[rows.length - 1];
      const holdings: string[] = latest?.Snapshot?.holdings || [];
      
      const actionOrder: Record<string, number> = { 'SELL': 0, 'HOLD': 1, 'BUY': 2 };
      const actionRows = rows
        .filter((row: any) => row?.Ticker)
        .map((row: any) => ({
          ticker: String(row.Ticker),
          action: String(row.Action || ''),
          price: Number(row.Price),
        }))
        .sort((a: { ticker: string; action: string; price: number }, b: { ticker: string; action: string; price: number }) => {
          const orderA = actionOrder[a.action] ?? 99;
          const orderB = actionOrder[b.action] ?? 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.ticker.localeCompare(b.ticker);
        })
        .slice(0, 12); // 增加容量，因为分组后更易读

      return {
        source: 'trade' as const,
        date: tradeRow.date,
        holdings,
        prices: null as Record<string, number> | null,
        weights: null as Record<string, string> | null,
        actions: actionRows,
      };
    }

    if (rebalanceRow) {
      const log = hoverLookup.rebalanceByDate.get(rebalanceRow.date);
      if (!log) return null;
      const holdings: string[] = (log.Selected || []).filter(Boolean);
      const prevHoldings = log.PrevHoldings || [];
      
      // 生成类似 trade 的 actions 列表以便展示聚合标签
      const rebalanceActions: { ticker: string; action: string; price: number }[] = [];
      
      // 1. SELLs
      const exited = (log.Exited || []).filter(Boolean);
      exited.forEach((t: string) => rebalanceActions.push({ ticker: t, action: 'SELL', price: log.ExitPrices?.[t] || 0 }));
      
      // 2. HOLDs
      const holds = holdings.filter(t => prevHoldings.includes(t));
      holds.forEach(t => rebalanceActions.push({ ticker: t, action: 'HOLD', price: log.Prices?.[t] || 0 }));
      
      // 3. BUYs
      const buys = holdings.filter(t => !prevHoldings.includes(t));
      buys.forEach(t => rebalanceActions.push({ ticker: t, action: 'BUY', price: log.Prices?.[t] || 0 }));

      return {
        source: 'rebalance' as const,
        date: rebalanceRow.date,
        holdings,
        prices: (log.Prices || null) as Record<string, number> | null,
        weights: (log.Weights || null) as Record<string, string> | null,
        actions: rebalanceActions.slice(0, 12),
      };
    }

    return null;
  }, [hoverLookup, hoveredTime]);

  useEffect(() => {
    setHoveredTime(null);
  }, [result, compareMode, chartView]);

  return (
    <Card className="border-border bg-card/50 overflow-hidden min-h-[400px] shadow-sm flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/10">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-semibold">{chartView === "equity" ? t.equity_curve : t.drawdown}</CardTitle>
            <CardDescription className="text-xs">{t.equity_curve_desc}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={chartView === "equity" ? "secondary" : "outline"}
              className={cn(
                "h-7 text-xs",
                chartView === "equity"
                  ? "bg-primary text-primary-foreground border border-primary/40"
                  : "bg-background/70"
              )}
              onClick={() => setChartView("equity")}
            >
              {t.equity_label}
            </Button>
            <Button
              size="sm"
              variant={chartView === "drawdown" ? "secondary" : "outline"}
              className={cn(
                "h-7 text-xs",
                chartView === "drawdown"
                  ? "bg-primary text-primary-foreground border border-primary/40"
                  : "bg-background/70"
              )}
              onClick={() => setChartView("drawdown")}
            >
              {t.drawdown_label}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setChartKey((prev: number) => prev + 1)}
            >
              {t.reset_zoom}
            </Button>
          </div>
        </div>
        {compareMode && Object.keys(compareResults).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {Object.keys(compareResults).map((id, idx) => (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer px-1 py-0.5 rounded",
                  highlightStrategy === id ? "bg-primary/10" : ""
                )}
                onMouseEnter={() => setHighlightStrategy(id)}
                onMouseLeave={() => setHighlightStrategy(null)}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: comparePalette[idx % comparePalette.length] }}
                />
                <span className="text-foreground/80">{getStrategyName(id)}</span>
              </div>
            ))}
          </div>
        )}
        {!compareMode && hoveredTime && (
          <div className="mt-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-2 text-[11px]">
            {hoveredSnapshot ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <span className="font-bold text-foreground/90 whitespace-nowrap">
                      {t.hover_time}: {hoveredTime}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap line-clamp-1">
                      {t.snapshot_date}: {hoveredSnapshot.date}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-1 mb-0.5">
                    {hoveredSnapshot.holdings.slice(0, 8).map((h: string) => {
                      const raw = String(h);
                      const ticker = raw.split('(')[0]?.trim();
                      return (
                        <span key={raw} className="inline-flex items-center rounded-sm bg-background/40 px-1 py-0.5 text-[9px] font-mono border border-border/20 text-muted-foreground hover:text-foreground transition-colors">
                          {ticker || raw}
                        </span>
                      );
                    })}
                    {hoveredSnapshot.holdings.length > 8 && (
                      <span className="inline-flex items-center rounded-sm bg-background/40 px-1 py-0.5 text-[9px] text-muted-foreground/60 border border-border/10">
                        +{hoveredSnapshot.holdings.length - 8}
                      </span>
                    )}
                    {(!hoveredSnapshot.holdings || hoveredSnapshot.holdings.length === 0) && (
                      <span className="text-muted-foreground/40 italic">{t.no_holdings}</span>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground text-[9px] font-bold uppercase tracking-wider">
                      {hoveredSnapshot.source === 'trade' ? t.trade_snapshot : t.rebalance_snapshot}
                    </span>
                  </div>
                </div>
                {hoveredSnapshot.actions && hoveredSnapshot.actions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {hoveredSnapshot.actions.map((row: any, idx: number) => (
                      <span
                        key={`${row.ticker}-${idx}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono border transition-all shadow-sm",
                          row.action === "BUY"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : row.action === "SELL"
                              ? "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400"
                              : "border-indigo-500/20 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                        )}
                      >
                        {row.action === "BUY" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : row.action === "SELL" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="font-bold tracking-tight">{row.ticker}</span>
                        <span className="opacity-60">${Number.isFinite(row.price) ? row.price.toFixed(2) : '--'}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">{t.no_snapshot_hint}</div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-destructive flex-col gap-2">
            <AlertCircle className="h-6 w-6" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : compareMode && Object.keys(compareResults).length > 0 ? (
          <div key={`${chartKey}-${JSON.stringify(compareResults)}`} className="w-full h-[400px]">
            <BacktestChart
              series={Object.entries(compareResults).map(([id, res]: [string, any], idx: number) => {
                const isHighlighted = highlightStrategy === null || highlightStrategy === id;
                return {
                  id,
                  name: getStrategyName(id),
                  data: chartView === "equity" ? res.equity_curve : res.drawdown_curve,
                  color: comparePalette[idx % comparePalette.length],
                  lineWidth: isHighlighted ? 4 : 1,
                  opacity: isHighlighted ? 0.75 : 0.05,
                };
              })}
              colors={{ backgroundColor: 'transparent' }}
            />
          </div>
        ) : result ? (
          <div key={`${chartKey}-${result.metrics?.cagr || 0}`} className="w-full h-[400px]">
            <BacktestChart
              data={chartView === "equity" ? result.equity_curve : result.drawdown_curve}
              onHoverTime={setHoveredTime}
              colors={{ backgroundColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">{t.no_data}</div>
        )}
      </CardContent>
    </Card>
  );
});
