// src/components/FloatingTooltip.tsx
import { cn } from '@/lib/utils'
import { useMarketColors } from '@/hooks/useMarketColors'

export interface TooltipData {
  date: string
  open: number
  high: number
  low: number
  close: number
  changePercent?: number
  intraday?: boolean
  indicators?: Record<string, number | undefined>
  indicatorLabels?: Record<string, { label: string; color: string }>
}

interface FloatingTooltipProps {
  data: TooltipData | null
  className?: string
}

export const FloatingTooltip = ({ data, className }: FloatingTooltipProps) => {
  const { upClass, downClass } = useMarketColors()
  if (!data) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-3 top-3 z-10 min-w-[170px] rounded-lg border border-border/40 bg-background/80 px-3 py-2.5 text-xs backdrop-blur-md shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-bold text-foreground/90">
        {data.date}
        {data.intraday && (
          <span className="rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-500">
            盘中
          </span>
        )}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
        <span className="text-muted-foreground/50">O</span>
        <span className="text-right">{data.open.toFixed(2)}</span>
        <span className="text-muted-foreground/50">H</span>
        <span className="text-right">{data.high.toFixed(2)}</span>
        <span className="text-muted-foreground/50">L</span>
        <span className="text-right">{data.low.toFixed(2)}</span>
        <span className="text-muted-foreground/50">C</span>
        <span className="text-right font-bold">{data.close.toFixed(2)}</span>
        {data.changePercent != null && (
          <>
            <span className="text-muted-foreground/50">%</span>
            <span
              className={cn(
                'text-right font-semibold',
                data.changePercent >= 0 ? upClass : downClass,
              )}
            >
              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </span>
          </>
        )}
      </div>

      {data.indicators && Object.keys(data.indicators).length > 0 && (
        <div className="mt-2 border-t border-border/30 pt-2">
          {Object.entries(data.indicators).map(([key, value]) => {
            const meta = data.indicatorLabels?.[key]
            return (
              <div key={key} className="flex justify-between gap-3">
                <span style={{ color: meta?.color ?? 'hsl(var(--muted-foreground))' }}>
                  {meta?.label ?? key}
                </span>
                <span className="tabular-nums">{value != null ? value.toFixed(2) : '--'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
