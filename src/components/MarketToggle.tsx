import { cn } from '@/lib/utils'
import { useMarket, type Market } from '@/contexts/MarketContext'

interface MarketToggleProps {
  className?: string
}

export function MarketToggle({ className }: MarketToggleProps) {
  const { market, setMarket } = useMarket()

  const handleClick = (m: Market) => {
    setMarket(m)
  }

  return (
    <div className={cn('flex items-center rounded-lg border border-border/40 bg-secondary/20 p-0.5', className)}>
      <button
        onClick={() => handleClick('US')}
        className={cn(
          'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
          market === 'US'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        US
      </button>
      <button
        onClick={() => handleClick('CN')}
        className={cn(
          'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
          market === 'CN'
            ? 'bg-red-500 text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        CN
      </button>
    </div>
  )
}
