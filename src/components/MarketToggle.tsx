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
        aria-pressed={market === 'US'}
        className={cn(
          'px-2.5 py-1 text-2xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
          market === 'US'
            ? 'bg-market-us/10 text-market-us shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        US
      </button>
      <button
        onClick={() => handleClick('CN')}
        aria-pressed={market === 'CN'}
        className={cn(
          'px-2.5 py-1 text-2xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
          market === 'CN'
            ? 'bg-market-cn/10 text-market-cn shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        CN
      </button>
    </div>
  )
}
