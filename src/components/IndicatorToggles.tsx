// src/components/IndicatorToggles.tsx
import { cn } from '@/lib/utils'

export interface IndicatorConfig {
  id: string
  label: string
  color: string
  visible: boolean
}

interface IndicatorTogglesProps {
  indicators: IndicatorConfig[]
  onToggle: (id: string) => void
  className?: string
}

export const IndicatorToggles = ({ indicators, onToggle, className }: IndicatorTogglesProps) => (
  <div className={cn('flex flex-wrap gap-1.5', className)}>
    {indicators.map((ind) => (
      <button
        key={ind.id}
        onClick={() => onToggle(ind.id)}
        className={cn(
          'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all',
          ind.visible
            ? 'border-current/20'
            : 'border-border/50 bg-background/50 text-muted-foreground/40 hover:text-muted-foreground/70',
        )}
        style={ind.visible ? { color: ind.color, backgroundColor: `${ind.color}15` } : undefined}
      >
        {ind.label}
        {ind.visible && ' ✓'}
      </button>
    ))}
  </div>
)
