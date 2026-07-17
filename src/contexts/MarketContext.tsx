import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export type Market = 'US' | 'CN'

interface MarketContextValue {
  market: Market
  setMarket: (value: Market | ((prev: Market) => Market)) => void
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarket] = useLocalStorage<Market>('cortex:market', 'US')

  // value 对象 useMemo 化，避免每次渲染创建新引用导致所有 consumer 重渲染
  const value = useMemo<MarketContextValue>(() => ({ market, setMarket }), [market, setMarket])

  return (
    <MarketContext.Provider value={value}>
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
