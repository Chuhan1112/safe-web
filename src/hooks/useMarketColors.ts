import { useMarket } from '@/contexts/MarketContext'

export function useMarketColors() {
  const { market } = useMarket()
  const isCN = market === 'CN'
  return {
    isCN,
    upClass: isCN ? 'text-data-down' : 'text-data-up',
    downClass: isCN ? 'text-data-up' : 'text-data-down',
  }
}
