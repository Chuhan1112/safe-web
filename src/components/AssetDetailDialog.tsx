import { useCallback, useEffect, useMemo, useState } from "react"
import { differenceInCalendarDays } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AssetChart } from "@/components/AssetChart"
import { api } from "@/private/api/client"
import { Loader2, ExternalLink } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface AssetDetailDialogProps {
  ticker: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  dateRange?: DateRange
}

export function AssetDetailDialog({ ticker, open, onOpenChange, dateRange }: AssetDetailDialogProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookback = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 252
    const days = Math.abs(differenceInCalendarDays(dateRange.to, dateRange.from)) + 1
    return Math.max(30, days)
  }, [dateRange])

  const loadData = useCallback(async (symbol: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getTickerData(symbol, lookback)
      setData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [lookback])

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
            {data && (
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-mono font-medium ${data.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${data.current_price?.toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${data.change_percent >= 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {data.change_percent > 0 ? '+' : ''}{data.change_percent?.toFixed(2)}%
                  </span>
                </div>
            )}
            <a
                href={`https://www.tradingview.com/symbols/${ticker}/`}
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
