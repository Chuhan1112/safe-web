import { useCallback, useEffect, useMemo, useState } from "react"
import { differenceInCalendarDays } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AssetChart } from "@/components/AssetChart"
import { Loader2, ExternalLink } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useMarketColors } from "@/hooks/useMarketColors"

interface TickerChartBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  indicators?: {
    sma20?: number
    sma50?: number
    sma200?: number
    bb_upper?: number
    bb_lower?: number
  }
}

interface TickerDataResponse {
  data: TickerChartBar[]
  current_price?: number
  change_percent?: number | null
}

interface AssetDetailDialogProps {
  ticker: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  dateRange?: DateRange
  fetchData?: (symbol: string, lookback: number, market?: string) => Promise<TickerDataResponse>
  market?: string
}

export function AssetDetailDialog({ ticker, open, onOpenChange, dateRange, fetchData, market }: AssetDetailDialogProps) {
  const { upClass, downClass } = useMarketColors()
  const [data, setData] = useState<TickerDataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missingDataSource = open && !!ticker && !fetchData
  const currencySymbol = market === 'CN' ? '¥' : '$'
  const tvSymbol = useMemo(() => {
    if (!ticker) return ''
    if (market === 'CN') {
      // 去除 .SS/.SZ 后缀，TradingView 用 SHA:600519 或 SZSE:000001 等
      const clean = ticker.replace(/\.(SS|SZ)$/, '')
      if (ticker.endsWith('.SS')) return `SHA:${clean}`
      if (ticker.endsWith('.SZ')) return `SZSE:${clean}`
      return ticker
    }
    return ticker
  }, [ticker, market])
  const tradingViewUrl = tvSymbol ? `https://www.tradingview.com/symbols/${tvSymbol}/` : '#'

  const lookback = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 252
    const days = Math.abs(differenceInCalendarDays(dateRange.to, dateRange.from)) + 1
    return Math.max(30, days)
  }, [dateRange])

  const loadData = useCallback(async (symbol: string) => {
    if (!fetchData) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchData(symbol, lookback, market)
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [lookback, fetchData, market])

  useEffect(() => {
    if (open && ticker) {
      loadData(ticker)
    } else {
        // Reset when closed
        setData(null)
        setError(null)
    }
  }, [open, ticker, loadData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-4">
            <span className="text-2xl font-mono font-bold tracking-tight">{ticker}</span>
            {(() => {
              const changePct: number | null = data?.change_percent ?? null
              const isPositive = changePct != null && changePct >= 0
              const changeSign = changePct != null && changePct > 0 ? '+' : ''
              return data ? (
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-mono font-medium ${isPositive ? upClass : downClass}`}>
                      {currencySymbol}{data.current_price?.toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${isPositive ? 'bg-data-up/10 ' + upClass : 'bg-data-down/10 ' + downClass}`}>
                      {changeSign}{changePct?.toFixed(2)}%
                  </span>
                </div>
              ) : null
            })()}
            <a
                href={tradingViewUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto mr-8 text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-md"
                title="Open in TradingView"
            >
                <ExternalLink className="h-4 w-4" />
            </a>
          </DialogTitle>
          <DialogDescription>
            Historical price data and technical indicators (SMA, Bollinger Bands)
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[450px] pt-4">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center flex-col gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading market data...</span>
            </div>
          ) : error ? (
            <div className="flex h-[400px] items-center justify-center text-destructive flex-col gap-2 bg-destructive/5 rounded-lg border border-destructive/20">
              <span className="font-semibold">Error loading data</span>
              <span className="text-sm opacity-80">{error}</span>
            </div>
          ) : data ? (
            <AssetChart data={data.data} />
          ) : missingDataSource ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground flex-col gap-2 bg-muted/20 rounded-lg border border-border/50">
              <span className="font-semibold">Market data unavailable</span>
              <span className="text-sm opacity-80">This workspace did not provide a ticker data loader.</span>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
