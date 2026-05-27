// src/components/ActionFilter.tsx
import { cn } from '@/lib/utils'

interface ActionFilterProps {
  selected: Set<string>
  onToggle: (action: string) => void
  className?: string
}

const actions = [
  { id: 'BUY', label: 'BUY', color: 'emerald' },
  { id: 'SELL', label: 'SELL', color: 'red' },
  { id: 'HOLD', label: 'HOLD', color: 'slate' },
]

export const ActionFilter = ({ selected, onToggle, className }: ActionFilterProps) => (
  <div className={cn('flex gap-1.5', className)}>
    {actions.map((a) => {
      const isActive = selected.has(a.id)
      return (
        <button
          key={a.id}
          onClick={() => onToggle(a.id)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-wider transition-all',
            isActive
              ? a.id === 'BUY'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-500'
                : a.id === 'SELL'
                  ? 'border-red-500/30 bg-red-500/15 text-red-500'
                  : 'border-border/50 bg-muted/50 text-foreground/70'
              : 'border-border/30 bg-transparent text-muted-foreground/40 hover:text-muted-foreground/60',
          )}
        >
          {a.label}
        </button>
      )
    })}
  </div>
)
