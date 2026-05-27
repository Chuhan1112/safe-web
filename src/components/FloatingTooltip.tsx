// src/components/FloatingTooltip.tsx
import { cn } from '@/lib/utils'

export interface TooltipData {
  date: string
  open: number
  high: number
  low: number
  close: number
  changePercent?: number
  indicators?: Record<string, number | undefined>
  indicatorLabels?: Record<string, { label: string; color: string }>
}

interface FloatingTooltipProps {
  data: TooltipData | null
  className?: string
}

export const FloatingTooltip = ({ data, className }: FloatingTooltipProps) => {
  if (!data) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-3 top-3 z-10 min-w-[170px] rounded-lg border border-border/40 bg-background/80 px-3 py-2.5 text-[11px] backdrop-blur-md shadow-sm',
        className,
      )}
    >
      <div className="mb-2 font-bold text-foreground/90">{data.date}</div>

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
                data.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500',
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
                <span style={{ color: meta?.color ?? 'rgba(255,255,255,0.5)' }}>
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
