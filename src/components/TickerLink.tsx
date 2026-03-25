import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TickerLinkProps {
  ticker: string
  onClick: (ticker: string) => void
  className?: string
  hideIcon?: boolean
}

export const TickerLink = ({ ticker, onClick, className, hideIcon }: TickerLinkProps) => (
  <button
    onClick={(event) => {
      event.stopPropagation()
      onClick(ticker)
    }}
    aria-label={`View ${ticker} details`}
    className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded-[4px] font-mono font-medium bg-secondary/30 text-secondary-foreground border border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-pointer group/ticker',
      className,
    )}
  >
    {ticker}
    {!hideIcon && (
      <ExternalLink className="ml-1 h-2.5 w-2.5 opacity-0 group-hover/row:opacity-40 group-hover/row:hover:opacity-100 transition-opacity" />
    )}
  </button>
)
