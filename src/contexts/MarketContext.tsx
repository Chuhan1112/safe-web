import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export type Market = 'US' | 'CN'

interface MarketContextValue {
  market: Market
  setMarket: (value: Market | ((prev: Market) => Market)) => void
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarket] = useLocalStorage<Market>('cortex:market', 'US')

  return (
    <MarketContext.Provider value={{ market, setMarket }}>
      {children}
    </MarketContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext)
  if (!ctx) {
    throw new Error('useMarket must be used within a MarketProvider')
  }
  return ctx
}
