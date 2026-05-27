// src/components/MetricsGrid.tsx
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { cn } from '@/lib/utils'

interface MetricItem {
  label: string
  value: number
  format?: (v: number) => string
  color?: string
}

interface MetricsGridProps {
  metrics: MetricItem[]
  className?: string
}

const defaultFormat = (v: number) => {
  if (Math.abs(v) >= 1) return v.toFixed(2)
  return v.toFixed(2)
}

export const MetricsGrid = ({ metrics, className }: MetricsGridProps) => (
  <div className={cn('grid grid-cols-3 gap-3 md:grid-cols-6', className)}>
    {metrics.map((m) => (
      <div
        key={m.label}
        className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 backdrop-blur-sm"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {m.label}
        </span>
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            m.color ?? 'text-foreground',
          )}
        >
          <AnimatedNumber
            value={m.value}
            format={m.format ?? defaultFormat}
          />
        </span>
      </div>
    ))}
  </div>
)
